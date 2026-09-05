'use client';

/**
 * components/present-editor/PresentSheets.tsx — Tầng MULTI-SHEET (phụ-thêm) cho chặng Present.
 *
 * `useEditor` là state cục bộ theo instance, nhưng PresentEditor bind 1 listener keydown cấp
 * window → KHÔNG mount đồng thời nhiều instance (đụng ⌘Z). Giải pháp: giữ ĐÚNG 1 PresentEditor,
 * re-key theo activeId; mỗi sheet giữ deck riêng. `onDeckChange` (prop tuỳ chọn) đẩy deck sống ra
 * → lưu vào deckRef → commit vào sheet trước khi đổi tab.
 *
 * PERSISTENCE (J-3 Sprint 2 — quyết định #6 "nhớ chính xác từng sheet"):
 * cả bộ sheet (deck + tên — trần 5 ĐÃ GỠ ở D2 đợt 8, xem addSheet) serialize vào IndexedDB theo khoá
 * `userId::/present-editor` (lib/sheets-persist). Reload → khôi phục đúng bộ sheet +
 * sheet đang mở (ưu tiên resume.sheetId của lib/resume nếu còn tồn tại). Autosave
 * debounce ≥1s nghe onDeckChange + thao tác tab. PresentEditor chỉ mount SAU khi
 * hydrate xong (IDB trả lời trong vài ms) — vì editor giữ deck theo key=activeId,
 * mount trước rồi mới bơm deck khôi phục sẽ không ăn. Không có userId → in-memory y bản cũ.
 *
 * Đánh đổi pha 1: đổi tab reset undo-history + selection (giống Excel đổi sheet), fetch lại thư
 * viện 1 lần/đổi-tab. Nội dung deck KHÔNG mất. 1 sheet ⇒ y hệt bản cũ (kể cả đường export).
 * Kéo-gộp single-window = pha 2 (docs/MULTI-SHEET-PROPOSAL.md §6).
 */

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import SheetTabBar, { type SheetTab } from '@/components/studio/SheetTabBar';

/**
 * 21/07 (A) — PresentEditor rất nặng (registerFonts + templates + suggest + layout-check +
 * export + brand-kit + reflow + Toolbar/Inspector/LayerPanel…). Mount đồng bộ khi vào chặng
 * Presenting làm StageVeil kéo ra rồi mà chuyển cảnh vẫn khựng vài trăm ms (2 chặng CAD/Render
 * OK với 100/140ms). Tách CHUNK riêng bằng next/dynamic + ssr:false + skeleton nhẹ → veil kéo
 * ra là thấy khung sheet + skeleton (không trắng), heavy code stream về sau. Giữ y hệt hành vi
 * export/undo (chỉ 1 instance mount tại 1 thời điểm, re-key theo activeId).
 */
const PresentEditor = dynamic(() => import('./PresentEditor'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: 'grid',
        placeItems: 'center',
        background: 'var(--bg)',
        color: 'var(--t4)',
        fontSize: 10,
        letterSpacing: '0.24em',
        textTransform: 'uppercase',
      }}
    >
      Đang mở dàn trang…
    </div>
  ),
});
const PresentDocTypePicker = dynamic(() => import('./PresentDocTypePicker'), { ssr: false });
import { useHoSoStatus } from './ho-so-status';
import type { EditorDeck, EditorSlide } from '@/lib/present-editor/model';
import { newId } from '@/lib/present-editor/model';
import { buildStorySetDeck } from '@/lib/present-editor/story-set';
import type { StagePresetId } from '@/lib/present-editor/stage-presets';
import { loadResume, saveResume } from '@/lib/resume';
import { danhTinhChoLuot } from '@/lib/danh-tinh-phien';
import { getActiveBrandKit, seedDeckWithBrandKit } from '@/lib/present-editor/brand-kit';
import { exportIdfp, importIdfp, lastImportIdfpError, type IdfpSheetData } from '@/lib/present-editor/idfp';
import {
  createSheetsAutosaver,
  loadSheets,
  nextSeqFrom,
  taoNhipSaoLuuMayChu,
  type NhipSaoLuuMayChu,
  type SheetsAutosaver,
  type SheetsRecord,
} from '@/lib/sheets-persist';
import { useSaveStatus } from '@/lib/save-status';
import { saoLuuDeckLenMayChu, taiDeckTuMayChu } from '@/lib/present-editor/luu-len-may-chu';
import { useSheetsBucketId } from '@/lib/scope';
import { useFlowStore } from '@/lib/store';
import { rootFolderChosen, getProjectFolderHandle, writeTextFile, readTextFile } from '@/lib/root-folder';
import { ensureProjectScope } from '@/lib/project-scope';
import { resolveSourceOfTruth, createDiskWriter, watchProjectPresence, type DiskWriter } from '@/lib/disk-sync';
import { useProjectPresence } from '@/lib/project-presence-ui';

const ROUTE = '/present-editor' as const;
const BLANK_PALETTE = ['#EFE9DC', '#C2AD86', '#8A6A3A', '#6E4A2E', '#3B352F', '#28211A'];

interface Props {
  /** Deck khởi đầu. BỎ TRỐNG (mặc định từ 07/08 — Hoà chốt "bỏ hết dự án mẫu") = deck RỖNG
   * 0 slide: người dùng mới thấy màn chọn loại hồ sơ (V6/H4) thay vì deck của ai. */
  initialDeck?: EditorDeck;
  /**
   * (V6/H4) Thẻ "Bảng tính/BOQ" trên màn chọn loại hồ sơ mở `BoqScreen` — màn đó sống ở tầng
   * NGOÀI `PresentSheets` (`PresentStageScreen`, cùng `mode` đã có sẵn cho nút BOQ cũ). Bỏ
   * trống = thẻ BOQ không hiện trên màn chọn (tránh nút giả bấm không ra gì, luật §9).
   */
  onRequestBoq?: () => void;
  /**
   * Đợt 4 (`docs/phieu-giao/editor-bang-bieu-mau.md`) — thẻ "Bảng thống kê" mở `ScheduleScreen`,
   * đi ĐÚNG đường `onRequestBoq` (sống ở `PresentStageScreen`, ngoài `PresentSheets`). Bỏ trống =
   * thẻ không hiện (cùng luật §9).
   */
  onRequestSchedule?: () => void;
}

interface Sheet extends SheetTab {
  deck: EditorDeck;
}

/** Hình hài 1 sheet trong IndexedDB — deck + tên. */
interface PersistedPresentSheet {
  id: string;
  name: string;
  deck: EditorDeck;
  [k: string]: unknown;
}

function blankSlide(): EditorSlide {
  return { id: newId('slide'), background: '#ffffff', elements: [] };
}

function blankDeck(n: number): EditorDeck {
  const base: EditorDeck = {
    id: newId('deck'),
    brand: '',
    project: `Hồ sơ ${n}`,
    fonts: 'Editorial',
    palette: [...BLANK_PALETTE],
    slides: [blankSlide()],
  };
  // PS-1 (G.5): deck MỚI tự nạp Brand Kit đang chọn (palette/font/watermark) thay vì mặc định cứng.
  const kit = getActiveBrandKit();
  return kit ? seedDeckWithBrandKit(base, kit) : base;
}

/**
 * B4 (31/07, mã `4.1.d`) — tệp NGUỒN SỰ THẬT trên đĩa cho chặng Present, trong thư mục dự án
 * (`docs/QUYET-DINH-HA-TANG-2026-07-31.md` sơ đồ đã chốt). Cùng định dạng `.idfp` xuất/nhập thủ
 * công đã có (`lib/present-editor/idfp.ts`, B2/`4.1.b`) — KHÔNG đổi format, chỉ đổi CHỖ đọc/ghi
 * tự động.
 */
const IDFP_DISK_FILE = 'trinh-bay.idfp';

/**
 * Ghi `sheets` ra `trinh-bay.idfp` — GHI RỒI ĐỌC LẠI XÁC NHẬN đúng kỷ luật `testStorageConnection()`
 * (vá sự cố 31/07 ở B3). `brandKitSnapshot` đọc ĐÚNG 1 lần lúc gọi (không phải tham chiếu sống,
 * cùng nguyên tắc B2).
 */
async function writeIdfpToDisk(
  bucketId: string,
  projectName: string,
  sheets: IdfpSheetData[],
  opts?: { create?: boolean },
): Promise<boolean> {
  const dirRes = await getProjectFolderHandle(bucketId, projectName, { create: opts?.create ?? true });
  if (!dirRes.ok) return false;
  const json = exportIdfp(sheets, getActiveBrandKit(), { projectName });
  if (!(await writeTextFile(dirRes.dir, IDFP_DISK_FILE, json))) return false;
  const readBack = await readTextFile(dirRes.dir, IDFP_DISK_FILE);
  if (readBack === null) return false;
  const verify = importIdfp(readBack);
  return !!verify && verify.sheets.length === sheets.length;
}

/**
 * B4 (4.1.d) — quyết định NGUỒN NÀO thắng lúc mount (giống hệt tinh thần `resolveAndSyncCadDisk`
 * ở `CadSheets.tsx`, KHÔNG dùng chung code vì `IdfpSheetData`/`exportIdfp` khác chữ ký `IdfSheetData`
 * /`exportIdf` — brandKitSnapshot). Trả sheets đã parse nếu ĐĨA thắng, `null` nếu cache thắng.
 */
async function resolveAndSyncPresentDisk(
  bucketId: string,
  projectName: string,
  cacheSheets: IdfpSheetData[],
  cacheTs: number,
): Promise<IdfpSheetData[] | null> {
  const { setDiskStatus } = useSaveStatus.getState();
  if (!bucketId || !(await rootFolderChosen())) {
    setDiskStatus('off');
    return null;
  }

  const dirRes = await getProjectFolderHandle(bucketId, projectName, { create: false });
  if (!dirRes.ok) {
    if (dirRes.reason === 'no-root') {
      setDiskStatus('off');
      return null;
    }
    if (dirRes.reason === 'no-permission') {
      setDiskStatus('error', 'Mất quyền truy cập thư mục dự án — vào Cài đặt → Lưu trữ, bấm "Kiểm tra kết nối thư mục".');
      return null;
    }
    if (cacheSheets.length > 0) {
      setDiskStatus((await writeIdfpToDisk(bucketId, projectName, cacheSheets, { create: true })) ? 'synced' : 'off');
    }
    return null;
  }

  const json = await readTextFile(dirRes.dir, IDFP_DISK_FILE);
  if (json === null) {
    if (cacheSheets.length > 0) {
      setDiskStatus((await writeIdfpToDisk(bucketId, projectName, cacheSheets, { create: true })) ? 'synced' : 'off');
    }
    return null;
  }
  const parsed = importIdfp(json);
  if (!parsed) {
    setDiskStatus('error', 'Tệp trinh-bay.idfp trên đĩa hỏng hoặc sai định dạng — đang dùng bản trong máy, KHÔNG tự ghi đè.');
    return null;
  }

  const resolution = resolveSourceOfTruth({
    diskModifiedAtMs: Date.parse(parsed.meta.modifiedAt) || null,
    cacheTs,
    diskSheetCount: parsed.sheets.length,
    cacheSheetCount: cacheSheets.length,
  });

  if (resolution.kind === 'disk') {
    setDiskStatus('synced');
    return parsed.sheets;
  }
  if (resolution.reason === 'disk-incomplete') {
    setDiskStatus(
      'error',
      `Tệp trên đĩa chỉ có ${parsed.sheets.length} hồ sơ, ít hơn ${cacheSheets.length} đang mở trong máy — có thể ghi dở/hỏng. ĐANG GIỮ bản trong máy, không tự ghi đè lên đĩa.`,
    );
    return null;
  }
  if (resolution.reason === 'cache-newer' && cacheSheets.length > 0) {
    const wrote = await writeIdfpToDisk(bucketId, projectName, cacheSheets, { create: true });
    setDiskStatus(
      wrote ? 'synced' : 'error',
      wrote ? undefined : 'Bản trong máy MỚI HƠN đĩa (có thể do mất quyền ở phiên trước) — thử ghi lại ra đĩa nhưng THẤT BẠI. Vào Cài đặt → Lưu trữ, bấm "Kiểm tra kết nối thư mục".',
    );
    return null;
  }
  setDiskStatus('synced');
  return null;
}

let seq = 1;
const nextId = () => `presheet-${seq++}`;

export default function PresentSheets({ initialDeck: initialDeckProp, onRequestBoq, onRequestSchedule }: Props) {
  // 07/08 (M-EMPTY, Hoà chốt "bỏ hết dự án mẫu — app thật bắt đầu trống"): không truyền deck
  // khởi đầu ⇒ deck RỖNG 0 slide (khác `blankDeck` có sẵn 1 trang trắng — 0 slide để
  // PresentEditor hiện đúng màn "Chưa có slide" với lối đi tiếp, thay vì một trang trắng câm).
  // useState giữ deck ổn định qua re-render (blankDeck sinh id mới mỗi lần gọi).
  const [initialDeck] = useState<EditorDeck>(
    () => initialDeckProp ?? { ...blankDeck(1), slides: [] },
  );
  const [sheets, setSheets] = useState<Sheet[]>([
    { id: 'presheet-0', name: 'Hồ sơ 1', deck: initialDeck },
  ]);
  const [activeId, setActiveId] = useState('presheet-0');
  // deck "sống" mới nhất của sheet đang mở (ref → không render thừa mỗi lần deck đổi).
  const liveDeck = useRef<EditorDeck>(initialDeck);
  /**
   * B2 (31/07, mã 4.1.b) — PHÁT HIỆN khi verify browser thật (không phải suy đoán từ code):
   * PresentEditor chỉ nạp LẠI `initialDeck` khi `key={activeId}` ĐỔI (remount thật, comment đầu
   * file dòng 7-9 đã nói rõ "re-key theo activeId"). Nhập `.idfp` giữ NGUYÊN id sheet trong file
   * (vd 'presheet-0' — đúng id project TỰ xuất ra rồi nhập lại) ⇒ activeId SAU import TRÙNG activeId
   * TRƯỚC import ⇒ key không đổi ⇒ PresentEditor KHÔNG remount ⇒ canvas giữ nguyên deck CŨ dù
   * state `sheets`/tab đã đổi đúng (tab tên đổi được vì đó là state khác, không qua remount).
   * `importGen` tăng mỗi lần nhập — ghép vào key để LUÔN buộc remount sau import, bất kể id trùng
   * hay không. Không đổi id sheet (giữ nguyên fidelity với file .idfp).
   */
  const [importGen, setImportGen] = useState(0);
  /**
   * L1 (phiếu 03/08): chỉ số góc phải phải nói đúng ĐƠN VỊ người dùng đang nhìn — dải dưới là
   * SLIDE, nên đếm slide, không phải "sheet/trần sheet". Đây là state (không phải ref) vì con số
   * hiện trên màn hình phải đổi theo; `liveDeck` vẫn là ref cho đường lưu (không render thừa).
   */
  const [slideCount, setSlideCount] = useState(initialDeck.slides.length);
  // H4: lựa chọn điều hướng UI cho lần mount đầu của Deck, không phải dữ liệu hồ sơ cần persist.
  const [deckStartBySheet, setDeckStartBySheet] = useState<Record<string, 'blank' | 'magic'>>({});

  // ---- Persistence (J-3): refs gương cho autosaver + cờ hydrate ----
  const userIdRef = useRef<string | null>(null);
  const sheetsRef = useRef(sheets);
  const activeIdRef = useRef(activeId);
  const saverRef = useRef<SheetsAutosaver | null>(null);
  /** P0-LUU (05/09) — nhịp đẩy bản sao máy chủ, CÙNG khuôn `CadSheets`. Xem `lib/save-status.ts`. */
  const nhipMayChuRef = useRef<NhipSaoLuuMayChu | null>(null);
  // B4 (4.1.d) — writer đĩa RIÊNG, nhịp chậm hơn IndexedDB (③), tạo lại mỗi khi đổi dự án.
  const diskWriterRef = useRef<DiskWriter | null>(null);
  /**
   * Ảnh chụp thứ đã sao lưu LÊN MÁY CHỦ thành công gần nhất — để nhịp 30s không tải lên lại y
   * nguyên. `POST /api/project-files` tạo BẢN GHI MỚI mỗi lần (không ghi đè hàng cũ), mà deck
   * mang ảnh dataURL nên mỗi bản có thể vài MB: mở editor suốt buổi không đụng gì vẫn đẻ ~120
   * hàng/giờ và tràn ra màn Files (`components/filemanager/TepNguonDuAn.tsx` liệt kê bảng này).
   * So bằng THAM CHIẾU: `liveDeck.current` được GÁN một object mới mỗi lần editor trả deck
   * (`onChange`), `sheets` là mảng mới mỗi lần thêm/xoá/đổi tên tờ. O(1), không serialize gì.
   */
  const daSaoLuuMayChuRef = useRef<{ deck: EditorDeck; sheets: Sheet[]; activeId: string } | null>(null);
  /**
   * BUCKET THEO DỰ ÁN (sửa rò chéo 25/07): deck lưu theo `userId::route::projectId`.
   * `hydratedFor` giữ bucket ĐÃ hydrate (không phải cờ boolean) → ngay khung hình đổi dự án,
   * `hydrated` đã false nên autosaver không kịp ghi deck dự án cũ sang bucket dự án mới.
   */
  const bucketId = useSheetsBucketId();
  const [hydratedFor, setHydratedFor] = useState<string | null>(null);
  const hydrated = hydratedFor === bucketId;
  const prevBucketRef = useRef<string | null>(null);

  /**
   * B4 (4.1.d) — ÁP dữ liệu `.idfp` đã parse vào state sống — ĐÚNG 1 đường dùng chung cho cả
   * nhập thủ công (`onImportIdfp`) LẪN nạp tự động khi đĩa thắng lúc mount (Luật Đồng Bộ #6:
   * không viết đường thứ hai). BẮT BUỘC tăng `importGen` — đây CHÍNH LÀ lớp lỗi B2: nạp deck
   * giữ nguyên id sheet ⇒ `key={activeId}` không đổi ⇒ PresentEditor không remount ⇒ canvas giữ
   * deck CŨ. Bằng cách CHỈ CÓ 1 hàm áp dụng duy nhất, mọi đường nạp deck từ ngoài vào (thủ công
   * lẫn tự động từ đĩa) đều ĐI QUA đúng chỗ tăng `importGen`, không cần nhớ ghép lại mỗi lần viết
   * đường nạp mới.
   */
  const applyIdfpSheets = (parsedSheets: IdfpSheetData[]): { keptCount: number } => {
    // D2 đợt 8: hết trần 5 — nhận đủ mọi hồ sơ trong file, không cắt bớt nữa.
    seq = Math.max(seq, nextSeqFrom(parsedSheets.map((s) => s.id), 'presheet'));
    const nextSheets: Sheet[] = parsedSheets.map(({ id, name, deck }) => ({ id, name, deck }));
    setSheets(nextSheets);
    const firstId = nextSheets[0].id;
    setActiveId(firstId);
    liveDeck.current = nextSheets[0].deck;
    setImportGen((g) => g + 1); // ép remount PresentEditor dù id trùng — xem docstring B2/importGen
    return { keptCount: nextSheets.length };
  };

  /** KHÔI PHỤC 1 lần lúc mount: IDB → bộ sheet + sheet active (ưu tiên resume.sheetId). */
  useEffect(() => {
    // ĐỔI DỰ ÁN giữa phiên (component KHÔNG remount khi client-nav): dọn tab + deck sống
    // trước khi nạp bộ sheet dự án mới, để deck dự án cũ không nằm lại dưới URL dự án mới.
    // Lần mount đầu KHÔNG dọn — giữ `initialDeck` mà trang truyền vào.
    if (prevBucketRef.current !== null && prevBucketRef.current !== bucketId) {
      const fresh = blankDeck(1);
      setSheets([{ id: 'presheet-0', name: 'Hồ sơ 1', deck: fresh }]);
      setActiveId('presheet-0');
      liveDeck.current = fresh;
    }
    prevBucketRef.current = bucketId;
    let cancelled = false;
    void (async () => {
      // P0 04/09 — CHỜ định danh giải từ PHIÊN MÁY CHỦ rồi mới đọc. Đọc đồng bộ ở đây là
      // thua cuộc chạy đua TẤT ĐỊNH (deps [bucketId] chỉ chạy 1 lần trên deep-link) ⇒ mất
      // trắng việc đang làm. Khối dọn-đổi-dự-án ở TRÊN cố ý nằm ngoài async: đẩy nó vào đây
      // là để bản của dự án CŨ nằm lại dưới URL dự án MỚI thêm một vòng mạng.
      const { tiepTuc, userId } = await danhTinhChoLuot(() => !cancelled);
      if (!tiepTuc) return;
      userIdRef.current = userId;
      if (!userId) {
        setHydratedFor(bucketId); // chưa đăng nhập → thuần in-memory (y bản cũ)
        return;
      }
      await loadSheets<PersistedPresentSheet>(userId, ROUTE, bucketId).then(async (rec) => {
        if (cancelled) return;
        const valid =
          rec?.sheets.filter((s) => s.deck && Array.isArray(s.deck.slides)) ?? [];

        // B4 (4.1.d) — quyết định NGUỒN NÀO thắng TRƯỚC khi áp bất kỳ state nào (tránh nhấp nháy
        // cache→đĩa). `cacheTs=0` khi CHƯA có bản ghi IndexedDB nào — B5 "copy thư mục dự án sang
        // máy khác" cần cache rỗng LUÔN thua đĩa thật (xem docstring resolveAndSyncPresentDisk).
        //
        // BUG BẮT ĐƯỢC KHI BROWSER-VERIFY (31/07, không phải suy đoán): `ensureProjectScope()`
        // (chạy trong `useProjectScopeSync()` ở trang `/projects/[id]/present/page.tsx`) nạp
        // `flowName` THẬT bất đồng bộ — hydrate effect này có thể chạy TRƯỚC khi nạp xong, đọc
        // phải tên mặc định `'Untitled flow'` ⇒ `getProjectFolderHandle()` tạo NHẦM thư mục khác
        // tên cho ĐÚNG 1 dự án (verify thật thấy 2 thư mục `<id> — Untitled flow/` VÀ
        // `<id> — Dự án mẫu/` cùng tồn tại cho cùng 1 project). Sửa: `ensureProjectScope()` chính
        // nó IDEMPOTENT ("khớp sẵn thì trả 'ready' ngay, không tốn request") — gọi lại ở đây AN
        // TOÀN, không tốn thêm request nếu trang đã nạp xong, và ĐẢM BẢO `flowName` đúng trước khi
        // dùng để đặt tên thư mục (tái dùng cơ chế có sẵn, không tự chế cờ "đã sẵn sàng" mới).
        if (bucketId) await ensureProjectScope(bucketId);
        if (cancelled) return;
        const projectName = useFlowStore.getState().flowName || 'InteriorFlow project';
        const cacheSheets: IdfpSheetData[] = valid.map((s) => ({ id: s.id, name: s.name, deck: s.deck }));
        const diskSheets = await resolveAndSyncPresentDisk(bucketId, projectName, cacheSheets, rec?.ts ?? 0);
        if (cancelled) return;

        if (diskSheets) {
          applyIdfpSheets(diskSheets);
          saverRef.current?.touch(); // đồng bộ ngược lại IndexedDB — cache luôn ấm cho lần mở kế
        } else if (!rec || valid.length === 0) {
          /**
           * LƯỚI ĐỠ CUỐI — MÁY CHỦ. Chạy KHI VÀ CHỈ KHI đĩa không thắng VÀ cache rỗng: trình duyệt
           * mới, vừa xoá dữ liệu duyệt web, vừa đăng nhập máy khác. Trước bản này đúng ca đó là mất
           * trắng deck (đã xảy ra thật, một deck 24 trang) vì đồng bộ đĩa mặc định TẮT — nó đòi
           * người dùng tự chọn thư mục gốc, còn bản sao máy chủ thì không cần cài gì.
           * Không thấy bản sao ⇒ im lặng đi tiếp, KHÔNG dựng deck rỗng đè lên việc đang làm.
           */
          const tuMayChu = await taiDeckTuMayChu(bucketId);
          if (cancelled) return;
          if (tuMayChu?.length) {
            applyIdfpSheets(tuMayChu);
            saverRef.current?.touch();
          }
        } else if (rec && valid.length > 0) {
          seq = Math.max(seq, nextSeqFrom(valid.map((s) => s.id), 'presheet'));
          // ⚠️ THỨ TỰ QUYỀN SỞ HỮU (sửa 21/08, giữ nguyên qua lượt hoà nhánh) — `rec.activeId`
          // THẮNG `resume.sheetId`. Trước đây resume được xét TRƯỚC, mà resume là con trỏ TOÀN
          // CỤC theo user+route, KHÔNG theo dự án (`saveResume(userId,{route,sheetId})` — một giá
          // trị duy nhất). Bản ghi thì per-project. Hậu quả đo được: dự án có 2 tờ, resume còn trỏ
          // tờ cũ ⇒ mở Trình chiếu ra thấy tờ TRỐNG dù `activeId` đã trỏ đúng tờ có 25 slide —
          // người dùng đọc thành "mất deck". Dính đúng hai lần trong ngày.
          // Nay: sự thật CỦA CHÍNH DỰ ÁN đi trước; resume chỉ là lưới đỡ khi activeId vô hiệu
          // (bản ghi cũ, tờ đã xoá). Cùng tinh thần `lastStage` — thứ gì thuộc dự án thì khoá
          // theo dự án, không để một con trỏ toàn cục ghi đè.
          const resumeSheet = loadResume(userId)?.sheetId;
          const wantId =
            (valid.some((s) => s.id === rec.activeId) && rec.activeId) ||
            (resumeSheet && valid.some((s) => s.id === resumeSheet) && resumeSheet) ||
            valid[0].id;
          const restored = valid.map(({ id, name, deck }) => ({ id, name, deck }));
          setSheets(restored);
          setActiveId(wantId);
          liveDeck.current = restored.find((s) => s.id === wantId)?.deck ?? restored[0].deck;
        }
        setHydratedFor(bucketId);
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [bucketId]);

  /** AUTOSAVE debounce ≥1s — deck sống + cấu trúc tab, chỉ sau khi hydrate. */
  useEffect(() => {
    const userId = userIdRef.current;
    if (!hydrated || !userId) return;
    // Đổi dự án / hydrate lại ⇒ ảnh chụp sao lưu của dự án CŨ hết nghĩa; xoá để dự án mới chắc
    // chắn có bản sao đầu tiên, không bị so nhầm với thứ của dự án khác.
    daSaoLuuMayChuRef.current = null;
    const getRecord = (): SheetsRecord | null => ({
      v: 1,
      activeId: activeIdRef.current,
      ts: Date.now(),
      sheets: sheetsRef.current.map((s) => ({
        id: s.id,
        name: s.name,
        // sheet đang mở → deck sống mới nhất (state sheets chỉ commit lúc đổi tab)
        deck: s.id === activeIdRef.current ? liveDeck.current : s.deck,
      })),
    });
    const saver = createSheetsAutosaver(userId, ROUTE, getRecord, {
      projectId: bucketId, // chốt bucket lúc tạo → nhịp flush cuối luôn về đúng dự án này
      onSaved: (bytes) => {
        console.debug(`[present-sheets] IDB ghi ${(bytes / 1024).toFixed(1)} KB`);
        useSaveStatus.getState().setLastSavedAt(Date.now()); // 2.1.8.n — đồng bộ với CAD, chung 1 store
      },
      onSavingChange: (saving) => useSaveStatus.getState().setStatus(saving ? 'saving' : 'saved'),
    });
    saverRef.current = saver;

    /**
     * SAO LƯU MÁY CHỦ — bản sao KHÔNG phụ thuộc trình duyệt.
     *
     * 🔴 ĐỔI 05/09 (P0-LUU): trước là `setInterval(30_000)` — cùng bệnh với `CadSheets` mà `A2-03`
     * đo được: đồng hồ treo tường không dính gì tới lúc người dùng sửa, nên có tới ~30 s deck chỉ
     * tồn tại trong một hồ sơ trình duyệt trong khi nhãn đã nói "Đã lưu". Nay đi qua
     * `taoNhipSaoLuuMayChu` (bám thay đổi + báo `serverStatus` thật).
     *
     * ⚠️ KHÁC CAD một điểm, và phải nói thẳng: deck mang ảnh dataURL nên gói tin thường VƯỢT trần
     * 64 KiB của `sendBeacon`/`keepalive` ⇒ đường-sống-sót-lúc-đóng-tab gần như KHÔNG dùng được ở
     * đây (nên không khai `goiKhiRoiTrang`, thà không có còn hơn có mà im lặng hỏng). Thứ bảo vệ
     * người dùng ở chặng này là nhịp NGẮN + nhãn nói thật, không phải beacon.
     *
     * Cổng chặn deck-rỗng vẫn nằm trong `saoLuuDeckLenMayChu`; effect gate bằng `hydrated` nên ca
     * "chưa nạp xong đã ghi đè" vẫn bị chặn hai lớp. Im lặng khi hỏng ở tầng gửi, nhưng KHÔNG im
     * lặng ở tầng NHÃN — đó là chỗ đổi.
     */
    const nhipMayChu = taoNhipSaoLuuMayChu({
      gui: async () => {
        const rec = getRecord();
        // `khongGuiGi` — xem `CadSheets`: không có lượt nhận mới thì không cấp mốc cho nhãn.
        if (!rec?.sheets.length || !bucketId) return { ok: true, khongGuiGi: true };
        const deck = liveDeck.current;
        const daLuu = daSaoLuuMayChuRef.current;
        // Không có gì đổi từ lần gửi thành công gần nhất ⇒ coi như xong (docstring `daSaoLuuMayChuRef`).
        if (daLuu && daLuu.deck === deck && daLuu.sheets === sheetsRef.current && daLuu.activeId === activeIdRef.current)
          return { ok: true, khongGuiGi: true };
        const anhChup = { deck, sheets: sheetsRef.current, activeId: activeIdRef.current };
        const kq = await saoLuuDeckLenMayChu(
          bucketId,
          rec.sheets.map((x) => ({ id: x.id, name: x.name, deck: (x as unknown as { deck: EditorDeck }).deck })),
          getActiveBrandKit(),
          useFlowStore.getState().flowName || 'InteriorFlow project',
        );
        if (kq.ok) daSaoLuuMayChuRef.current = anhChup;
        return kq.ok ? { ok: true } : { ok: false, loi: kq.loi };
      },
      onTrangThai: (st, msg) => useSaveStatus.getState().setServerStatus(st, msg),
      onDaGui: (t) => useSaveStatus.getState().setServerSavedAt(t),
    });
    nhipMayChuRef.current = nhipMayChu;
    if (bucketId) nhipMayChu.touch();
    else useSaveStatus.getState().setServerStatus('off');

    /**
     * B4 (4.1.d, bổ sung ③) — ghi đĩa THEO NHỊP RIÊNG, chậm hơn IndexedDB (throttle 10s, không
     * debounce) + ⌘S/rời trang ép ghi ngay. `reason:'off'` là cờ nội bộ (KHÔNG phải lỗi) khi dự
     * án chưa bật lưu trữ.
     */
    const diskWriter = createDiskWriter(
      async () => {
        if (!bucketId || !(await rootFolderChosen())) return { ok: true, reason: 'off' };
        const projectName = useFlowStore.getState().flowName || 'InteriorFlow project';
        const idfpSheets: IdfpSheetData[] = sheetsRef.current.map((s) => ({
          id: s.id,
          name: s.name,
          deck: s.id === activeIdRef.current ? liveDeck.current : s.deck,
        }));
        const wrote = await writeIdfpToDisk(bucketId, projectName, idfpSheets, { create: true });
        return wrote ? { ok: true } : { ok: false, reason: 'write-failed' };
      },
      {
        intervalMs: 10_000,
        onStatus: (r) => {
          const { setDiskStatus } = useSaveStatus.getState();
          if (r.reason === 'off') setDiskStatus('off');
          else setDiskStatus(r.ok ? 'synced' : 'error', r.ok ? undefined : 'Chưa ghi ra đĩa — kiểm tra quyền thư mục dự án (Cài đặt → Lưu trữ).');
        },
      },
    );
    diskWriterRef.current = diskWriter;

    const flush = () => {
      saver.flush();
      diskWriter.flushNow();
      nhipMayChu.flushKhiRoiTrang();
    };
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    // ⌘S ở Present: ép cả ba đích, và bỏ qua giãn cách 12 s của nhịp máy chủ.
    const onForceSave = () => {
      saver.flush();
      diskWriter.flushNow();
      nhipMayChu.flushNow();
    };
    window.addEventListener('beforeunload', flush);
    window.addEventListener('pagehide', flush); // Safari/iOS không chạy `beforeunload` khi đóng tab
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('present:force-save-request', onForceSave);
    return () => {
      window.removeEventListener('beforeunload', flush);
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('present:force-save-request', onForceSave);
      saver.flush(); // rời route (client-nav) → không mất nhịp cuối
      saver.dispose();
      nhipMayChu.dispose();
      nhipMayChuRef.current = null;
      useSaveStatus.getState().setServerStatus('off');
      saverRef.current = null;
      diskWriter.flushNow();
      diskWriter.dispose();
      diskWriterRef.current = null;
    };
  }, [hydrated, bucketId]);

  /** B4 (4.1.d, bổ sung ④) — CHỈ phát hiện + cảnh báo 2 tab cùng mở 1 dự án, KHÔNG khoá/gộp. */
  useEffect(() => {
    if (!bucketId) return;
    const handle = watchProjectPresence(bucketId, (present) => useProjectPresence.getState().setOtherTabOpen(present));
    return () => {
      useProjectPresence.getState().setOtherTabOpen(false);
      handle.dispose();
    };
  }, [bucketId]);

  /** Cấu trúc tab đổi (thêm/xoá/đổi tên/reorder/đổi active) → gương ref + đánh dấu lưu. */
  useEffect(() => {
    sheetsRef.current = sheets;
    activeIdRef.current = activeId;
    if (hydrated) {
      saverRef.current?.touch();
      diskWriterRef.current?.touch();
      nhipMayChuRef.current?.touch(); // P0-LUU — cấu trúc tờ cũng vào `.idfp`, phải lên máy chủ
    }
  }, [sheets, activeId, hydrated]);

  /**
   * B2 (31/07, ĐỢT B lớp lưu trữ, mã `4.1.b`) — `.idfp` gồm TẤT CẢ trang (không chỉ trang đang
   * mở) — Toolbar/PresentEditor không giữ danh sách sheet (nằm ở đây). Bắc cầu qua CustomEvent,
   * ĐÚNG pattern `cad:idf-export-request`/`cad:idf-import-request` (CadSheets.tsx) — không viết
   * cơ chế mới. Kết quả báo lại qua `present:idfp-*-done` để PresentEditor.tsx hiện toast dùng
   * CHUNG cơ chế `exportMsg` đã có sẵn cho PDF/PPTX/PNG (Luật Đồng Bộ #6, không viết toast mới).
   */
  useEffect(() => {
    const onExportIdfp = () => {
      const committed = commitActive(sheetsRef.current);
      const idfpSheets: IdfpSheetData[] = committed.map((s) => ({ id: s.id, name: s.name, deck: s.deck }));
      // Brand Kit: nhúng bản CHỤP TẠI THỜI ĐIỂM XUẤT, không phải id tham chiếu sống — đọc
      // getActiveBrandKit() ĐÚNG 1 lần ở đây, không lưu lại để tra cứu sau này.
      const brandKitSnapshot = getActiveBrandKit();
      const json = exportIdfp(idfpSheets, brandKitSnapshot);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'project.idfp';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      window.dispatchEvent(new CustomEvent('present:idfp-export-done', { detail: { ok: true, text: `Đã xuất project.idfp — ${idfpSheets.length} hồ sơ.` } }));
    };

    const onImportIdfp = (ev: Event) => {
      const detail = (ev as CustomEvent<{ json: string; fileName: string }>).detail;
      if (!detail) return;
      const parsed = importIdfp(detail.json);
      if (!parsed) {
        const reason = lastImportIdfpError();
        window.dispatchEvent(new CustomEvent('present:idfp-import-done', {
          detail: { ok: false, text: reason ?? `Không mở được "${detail.fileName}" — file .idfp hỏng hoặc sai định dạng.` },
        }));
        return;
      }
      // B4 (4.1.d) — dùng ĐÚNG 1 đường áp dụng sheet đã parse, chung với nạp tự động khi đĩa
      // thắng lúc mount (xem docstring applyIdfpSheets — Luật Đồng Bộ #6).
      const { keptCount } = applyIdfpSheets(parsed.sheets);
      saverRef.current?.touch(); // ghi ngay vào IDB, không đợi debounce thao tác kế tiếp
      diskWriterRef.current?.touch(); // B4 — cũng đánh dấu đĩa cần ghi lại (nhịp riêng)
      nhipMayChuRef.current?.touch(); // P0-LUU — nhập `.idfp` là nội dung đổi thật
      window.dispatchEvent(new CustomEvent('present:idfp-import-done', {
        detail: {
          ok: true,
          // D2 đợt 8: hết trần 5 hồ sơ — không còn nhánh "bỏ N hồ sơ vượt trần".
          text: `Đã mở "${detail.fileName}" — ${keptCount} hồ sơ.`,
        },
      }));
    };

    window.addEventListener('present:idfp-export-request', onExportIdfp);
    window.addEventListener('present:idfp-import-request', onImportIdfp);
    return () => {
      window.removeEventListener('present:idfp-export-request', onExportIdfp);
      window.removeEventListener('present:idfp-import-request', onImportIdfp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Resume trỏ tận sheet: ghi sheetId đang mở vào resume-state (lib/resume). */
  useEffect(() => {
    const userId = userIdRef.current;
    if (!hydrated || !userId) return;
    saveResume(userId, { route: ROUTE, sheetId: activeId });
  }, [activeId, hydrated]);

  const active = sheets.find((s) => s.id === activeId) ?? sheets[0];

  /* [marker: nguonLienKet] Bắc cờ "đã có hồ sơ chưa" sang `PresentNavigator` (ANH EM, không
     phải con — nó mount ở `PresentStageScreen`). CÙNG khuôn `usePlayStatus` đã dùng cho ca y
     hệt của StatusBar; xem `ho-so-status.ts`. Điều kiện dưới đây CHÍNH LÀ điều kiện quyết định
     mount `PresentDocTypePicker` ở phần render — khai một lần, dùng lại cả hai chỗ, không chép
     công thức ra hai nơi rồi để chúng phân kỳ. */
  const setCoHoSo = useHoSoStatus((s) => s.setCoHoSo);
  const dangOThuVienMau = hydrated && active.deck.slides.length === 0 && !active.deck.docType;
  useEffect(() => {
    setCoHoSo(hydrated ? !dangOThuVienMau : null);
    return () => setCoHoSo(null); // rời chặng ⇒ về "chưa biết", không để cờ cũ nói hộ màn khác
  }, [hydrated, dangOThuVienMau, setCoHoSo]);

  /** Commit deck sống của sheet đang mở vào state sheets (gọi trước mỗi thao tác tab). */
  const commitActive = (list: Sheet[]): Sheet[] =>
    list.map((s) => (s.id === activeId ? { ...s, deck: liveDeck.current } : s));

  const switchTo = (id: string) => {
    if (id === activeId) return;
    const committed = commitActive(sheets);
    setSheets(committed);
    const target = committed.find((s) => s.id === id);
    liveDeck.current = target?.deck ?? initialDeck;
    // đổi hồ sơ → chỉ số slide phải theo hồ sơ MỚI ngay, không đợi `onDeckChange` đầu tiên
    setSlideCount(liveDeck.current.slides.length);
    setActiveId(id);
  };

  const addSheet = () => {
    // D2 đợt 8: KHÔNG còn trần số hồ sơ. Khác CAD (sheet = metadata), mỗi hồ sơ Present ôm
    // nguyên 1 deck — nhưng deck chỉ nặng theo số slide người dùng thật sự tạo, trần cứng 5
    // không bảo vệ gì thêm mà chỉ chặn studio nhiều hồ sơ.
    const id = nextId();
    // V6/H4: hồ sơ MỚI chưa quyết loại → 0 slide + docType bỏ trống, để PresentDocTypePicker
    // hiện (cùng điều kiện với deck khởi đầu, xem `initialDeck` ở trên).
    const deck: EditorDeck = { ...blankDeck(sheets.length + 1), slides: [] };
    const committed = commitActive(sheets);
    liveDeck.current = deck;
    setSheets([...committed, { id, name: `Hồ sơ ${sheets.length + 1}`, deck }]);
    setActiveId(id);
  };

  /**
   * Cửa vào chỉ được bật khi editor phía sau có thật. `material-a3` không hứa một editor vật
   * liệu riêng: nó mở cùng trình dàn trang đã có, ở khổ A3 và lưu đúng loại hồ sơ trong `.idfp`.
   */
  const chooseDeck = (
    start: 'blank' | 'magic',
    options: { docType?: 'deck' | 'material-a3'; stagePreset?: StagePresetId } = {},
  ) => {
    const deck: EditorDeck = {
      ...liveDeck.current,
      docType: options.docType ?? 'deck',
      stagePreset: options.stagePreset ?? liveDeck.current.stagePreset,
      slides: liveDeck.current.slides.length > 0 ? liveDeck.current.slides : [blankSlide()],
    };
    liveDeck.current = deck;
    setSheets((prev) => prev.map((s) => (s.id === activeId ? { ...s, deck } : s)));
    setDeckStartBySheet((prev) => ({ ...prev, [activeId]: start }));
    setSlideCount(deck.slides.length);
    setImportGen((g) => g + 1);
    saverRef.current?.touch();
    diskWriterRef.current?.touch();
    nhipMayChuRef.current?.touch(); // P0-LUU
  };

  /**
   * [storySet] Hero output — nạp trọn bộ "Bộ hồ sơ kể chuyện" 8 trang (lib/present-editor/
   * story-set) vào sheet hiện tại. Đi đường 'blank' (skipGenerateFlow) vì deck đã đủ trang,
   * người dùng sửa tự do — không qua flow Magic.
   */
  const chooseStorySet = () => {
    const built = buildStorySetDeck({ projectName: liveDeck.current.project });
    const deck: EditorDeck = {
      ...liveDeck.current,
      docType: 'deck',
      fonts: built.fonts,
      palette: built.palette,
      slides: built.slides,
    };
    liveDeck.current = deck;
    setSheets((prev) => prev.map((s) => (s.id === activeId ? { ...s, deck } : s)));
    setDeckStartBySheet((prev) => ({ ...prev, [activeId]: 'blank' }));
    setSlideCount(deck.slides.length);
    setImportGen((g) => g + 1);
    saverRef.current?.touch();
    diskWriterRef.current?.touch();
    nhipMayChuRef.current?.touch(); // P0-LUU
  };

  const closeSheet = (id: string) => {
    if (sheets.length <= 1) return;
    const committed = commitActive(sheets);
    const idx = committed.findIndex((s) => s.id === id);
    const rest = committed.filter((s) => s.id !== id);
    setSheets(rest);
    if (id === activeId) {
      const neighbor = rest[Math.max(0, idx - 1)];
      liveDeck.current = neighbor.deck;
      setActiveId(neighbor.id);
    }
  };

  const renameSheet = (id: string, name: string) =>
    setSheets((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));

  const reorder = (from: number, to: number) =>
    setSheets((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <SheetTabBar
        sheets={sheets}
        activeId={activeId}
        onSelect={switchTo}
        onAdd={addSheet}
        onRename={renameSheet}
        onClose={closeSheet}
        onReorder={reorder}
        addLabel="Thêm hồ sơ trình bày"
        // "8 slide" — đúng thứ đang thấy ở dải dưới (L1 phiếu 03/08). Trần 5 đã gỡ ở D2 đợt 8.
        status={`${slideCount} slide`}
      />
      <div style={{ flex: 1, minHeight: 0 }}>
        {/* Chỉ mount editor SAU hydrate: deck khôi phục phải vào từ initialDeck (key=activeId).
            B2 (4.1.b) — `:importGen` ép remount sau khi nhập .idfp dù id sheet trùng (xem
            docstring importGen phía trên). */}
        {dangOThuVienMau ? (
          <PresentDocTypePicker
            onChooseBlankDeck={() => chooseDeck('blank')}
            onChooseMagicDeck={() => chooseDeck('magic')}
            onChooseMaterialBoard={() => chooseDeck('blank', { docType: 'material-a3', stagePreset: 'a3-landscape' })}
            onChooseBoq={() => onRequestBoq?.()}
            onChooseStorySet={chooseStorySet}
            onChooseSchedule={() => onRequestSchedule?.()}
          />
        ) : hydrated ? (
          <PresentEditor
            key={`${activeId}:${importGen}`}
            initialDeck={active.deck}
            initialTab="layout"
            skipGenerateFlow={deckStartBySheet[activeId] === 'blank'}
            onDeckChange={(d) => {
              liveDeck.current = d;
              setSlideCount(d.slides.length);
              saverRef.current?.touch();
              diskWriterRef.current?.touch();
              nhipMayChuRef.current?.touch(); // P0-LUU — sửa slide là nội dung đổi thật
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
