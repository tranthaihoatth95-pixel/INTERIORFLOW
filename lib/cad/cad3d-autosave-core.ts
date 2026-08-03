/**
 * lib/cad/cad3d-autosave-core.ts — CỐT LÕI THUẦN của `cad3d-autosave.ts` (tách theo đúng khuôn
 * `lib/scope-core.ts`/`lib/scope.ts`: phần thuần không đụng React/Next sống riêng để test bằng
 * sucrase-node không cần DOM). Xem docstring đầy đủ (lý do/kiến trúc) ở `cad3d-autosave.ts`.
 *
 * CHỈ import module RELATIVE + Node-an-toàn (không alias `@/`, không `next/navigation`) — đây là
 * ranh giới cố ý: `lib/scope.ts` (nơi có `useSheetsBucketId`) kéo theo `next/navigation` +
 * `@/lib/store`, không thể chạy ngoài React/Next, nên hook wrapper (`cad3d-autosave.ts`) giữ
 * riêng, KHÔNG được gộp vào file này.
 */

import { useCadStore } from './store';
import type { Doc, Viewport } from './model';
import { getLastUserId, loadResume } from '../resume';
import { createSheetsAutosaver, loadSheets, type SheetsRecord } from '../sheets-persist';
import { useSaveStatus } from '../save-status';
import { backfillRoomTypes } from './standards/checker';
import { isBucketHydrated, markBucketHydrated } from './cad-doc-hydration';

export const CAD3D_AUTOSAVE_ROUTE = '/cad-editor' as const;
const DEFAULT_VIEWPORT: Viewport = { scale: 0.08, panX: 300, panY: 400 };
const FIRST_SHEET_ID = 'cadsheet-0';
const FIRST_SHEET_NAME = 'Bản vẽ 1';

/** CÙNG hình hài `PersistedCadSheet` nội bộ của `CadSheets.tsx` — không export từ đó (private),
 * khai lại đúng field ở đây vì đơn giản chỉ là 1 type shape, không phải logic trùng lặp. */
export interface PersistedCadSheet {
  id: string;
  name: string;
  doc: Doc;
  viewport: Viewport;
  currentLayer: string;
  [k: string]: unknown;
}

export interface Cad3DAutosaveHandle {
  /** Ép ghi NGAY nếu có thay đổi đang chờ debounce — dùng cho beforeunload/visibilitychange. */
  flushNow: () => void;
  /** Dừng hẳn: flush lần cuối rồi unsubscribe + huỷ timer. Gọi khi rời mode 3D (unmount). */
  dispose: () => void;
}

/** Ưu tiên xác định "sheet nào đang hoạt động" — ĐÚNG thứ tự `CadSheets.tsx` dùng lúc mount:
 * resume-state trỏ tận sheet (nếu id còn sống trong bản ghi) → `activeId` bản ghi → sheet đầu. */
function pickActiveSheet(
  sheets: PersistedCadSheet[],
  resumeSheetId: string | undefined,
  recordActiveId: string,
): PersistedCadSheet {
  return (
    (resumeSheetId && sheets.find((s) => s.id === resumeSheetId)) ||
    sheets.find((s) => s.id === recordActiveId) ||
    sheets[0]
  );
}

/**
 * Nối autosave CAD SẴN CÓ (`lib/sheets-persist.ts`, y hệt bucket/khoá `CadSheets.tsx` dùng) vào
 * mode "3D Thiết kế" — sửa `docs/TECH-DEBT.md` mục "Mode 3D Thiết kế KHÔNG autosave xuống
 * IndexedDB". KHÔNG viết cơ chế lưu thứ hai (K1): gọi lại ĐÚNG `loadSheets`/`saveSheets`/
 * `createSheetsAutosaver`, CÙNG khoá `userId::/cad-editor::bucketId`. Khác `CadSheets` ở chỗ:
 * hàm này KHÔNG quản nhiều "Bản vẽ" (tab) — chỉ đọc/ghi ĐÚNG 1 sheet đang hoạt động (xác định
 * qua resume-state); các sheet khác trong bản ghi giữ NGUYÊN VẸN (đọc 1 lần lúc gọi).
 *
 * THUẦN (không `window`/`document`) — gọi trực tiếp được từ test, không cần React render. Trả
 * `Cad3DAutosaveHandle` NGAY (đồng bộ); phần nạp/ghi bên trong chạy async, tự bỏ qua nếu
 * `dispose()` gọi trước khi xong (cờ `cancelled`, cùng khuôn `CadSheets.tsx`). `userId` rỗng →
 * không làm gì (persistence tắt hẳn khi chưa đăng nhập, đúng hành vi `CadSheets` cho ca này).
 */
export function startCad3DAutosave(userId: string, bucketId: string): Cad3DAutosaveHandle {
  let cancelled = false;
  let saver: ReturnType<typeof createSheetsAutosaver> | null = null;
  let unsub: (() => void) | null = null;

  if (!userId) {
    return { flushNow: () => {}, dispose: () => {} };
  }

  void (async () => {
    const alreadyHydrated = isBucketHydrated(bucketId);
    const rec = await loadSheets<PersistedCadSheet>(userId, CAD3D_AUTOSAVE_ROUTE, bucketId);
    if (cancelled) return;

    const resumeSheetId = loadResume(userId)?.sheetId;
    let activeSheetId: string;
    let baseRecord: SheetsRecord<PersistedCadSheet>;

    if (rec && rec.sheets.length) {
      const sheet = pickActiveSheet(rec.sheets, resumeSheetId, rec.activeId);
      activeSheetId = sheet.id;
      baseRecord = rec;
      // Nạp vào store CHỈ khi bucket này CHƯA hydrate trong phiên (xem docstring
      // `cad-doc-hydration.ts`) — tránh đè bản MỚI HƠN đang sống trong `useCadStore` (vd vừa rời
      // 2D vài mili-giây trước, ghi IDB của route cũ có thể chưa kịp xong).
      if (!alreadyHydrated) {
        const doc = backfillRoomTypes(sheet.doc);
        useCadStore.setState({
          doc,
          past: [],
          future: [],
          selection: [],
          viewport: sheet.viewport ?? { ...DEFAULT_VIEWPORT },
          currentLayer: sheet.currentLayer ?? doc.layers[0]?.id ?? 'l-wall',
        });
      }
    } else {
      // Chưa từng có sheet nào lưu cho bucket này (đi thẳng vào mode 3D, chưa mở 2D lần nào cho
      // dự án này) — khởi tạo ĐÚNG khuôn `CadSheets.tsx` lúc mount lần đầu (sheet
      // 'cadsheet-0'/'Bản vẽ 1'), gieo từ doc ĐANG SỐNG trong store (không có bản cũ nào để nạp).
      activeSheetId = FIRST_SHEET_ID;
      const s = useCadStore.getState();
      baseRecord = {
        v: 1,
        activeId: activeSheetId,
        ts: Date.now(),
        sheets: [{ id: activeSheetId, name: FIRST_SHEET_NAME, doc: s.doc, viewport: s.viewport, currentLayer: s.currentLayer }],
      };
    }
    markBucketHydrated(bucketId);
    if (cancelled) return;

    const getRecord = (): SheetsRecord => {
      const s = useCadStore.getState();
      const sheets = baseRecord.sheets.map((sh) =>
        sh.id === activeSheetId ? { ...sh, doc: s.doc, viewport: s.viewport, currentLayer: s.currentLayer } : sh,
      );
      return { v: 1, activeId: activeSheetId, ts: Date.now(), sheets };
    };

    saver = createSheetsAutosaver(userId, CAD3D_AUTOSAVE_ROUTE, getRecord, {
      projectId: bucketId,
      onSaved: () => useSaveStatus.getState().setLastSavedAt(Date.now()),
      onSavingChange: (saving) => useSaveStatus.getState().setStatus(saving ? 'saving' : 'saved'),
    });

    unsub = useCadStore.subscribe((s, prev) => {
      if (s.doc !== prev.doc || s.viewport !== prev.viewport || s.currentLayer !== prev.currentLayer) {
        saver?.touch();
      }
    });
  })();

  return {
    flushNow: () => saver?.flush(),
    dispose: () => {
      cancelled = true;
      saver?.flush();
      unsub?.();
      saver?.dispose();
      saver = null;
      unsub = null;
    },
  };
}

/** THUẦN — dùng lại được ở hook wrapper (không phải React). */
export { getLastUserId };
