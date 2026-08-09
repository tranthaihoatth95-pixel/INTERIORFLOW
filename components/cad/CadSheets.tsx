'use client';

/**
 * components/cad/CadSheets.tsx — Tầng MULTI-SHEET (phụ-thêm) cho chặng CAD.
 *
 * NC-13 BƯỚC 3 (docs/PHIEU-CODE-IF-DOT8-MULTISHEET-2026-08-03.md, D1) — ĐÃ BỎ hoán store: trước
 * đây mỗi sheet ôm nguyên 1 `Doc` + undo history riêng, đổi tab thì HOÁN nguyên state vào
 * `useCadStore` (ngược luật K1 — đẻ N nguồn). Từ nay: `useCadStore` giữ ĐÚNG 1 `doc`/`past`/
 * `future`/`currentLayer`/`selection` xuyên suốt phiên làm việc — KHÔNG BAO GIỜ bị hoán khi đổi
 * tab. `sheets` ở component này chỉ còn là METADATA (`Sheet`/`Viewport2D`, `lib/cad/model.ts`):
 * tên, khổ giấy, khung tên, và Ô NHÌN (`centerMm`+tỉ lệ in) — không giữ bản sao hình học nào.
 * Đổi tab = đổi khung nhìn (pan/zoom camera tới `centerMm` của viewport, xem `goToSheetView()` +
 * sự kiện `cad:goto-box` ở `CadCanvas.tsx`), KHÔNG đụng `Doc`. Hệ quả đúng ý (và đã verify): sửa
 * hình ở tab này, sang tab khác thấy đổi theo ngay — vì giờ chỉ có MỘT Doc. Undo/redo cũng thành
 * MỘT dòng lịch sử chung (đúng AutoCAD — undo không theo tab/layout).
 *
 * PERSIST PAPER (10/08): định dạng lưu vẫn có ĐÚNG 1 sheet dữ liệu mang trọn `Doc` chung, nên
 * không nhân hình học và không phá autosave 3D. Field additive `paperSheets?: Sheet[]` trên bản
 * ghi đó mang toàn bộ metadata tờ/viewport nhẹ qua IndexedDB, `.idf`, `.ifpack` và backup. App/file
 * cũ thiếu field này rơi về một tờ mặc định. Mở file/.idf/.ifpack CŨ có N sheet mỗi sheet 1 Doc
 * khác nhau (từ trước
 * luật này) → GỘP về 1 Doc chung bằng bộ chuyển đã có + đã test (`lib/cad/sheet-migrate.ts` Bước
 * 2, `mergeIdfSheetsToDoc()`), bảo toàn mọi entity, không rơi rớt — chỉ còn 1 tab sau khi gộp (tách
 * lại thành N tab không thể suy chính xác vì file cũ không có quan hệ viewport).
 *
 * PERSISTENCE (J-3 Sprint 2 — quyết định #6 "nhớ chính xác từng sheet", đã thu hẹp theo D1 ở
 * trên): bộ sheet (đúng 1 tab, doc + tên + viewport + layer hiện hành) serialize vào IndexedDB
 * theo khoá `userId::/cad-editor` (lib/sheets-persist). Reload → khôi phục Doc + layer hiện hành.
 * Autosave debounce ≥1s nghe cả store CAD lẫn thao tác tab. Không có userId (chưa đăng nhập) →
 * thuần in-memory y bản cũ.
 *
 * 1 sheet ⇒ hành vi y hệt bản cũ (export PNG/DXF, "Đưa sang Render" đều đọc active doc — nay LUÔN
 * đúng vì chỉ có 1 doc). Kéo-gộp single-window = pha 2 (docs/MULTI-SHEET-PROPOSAL.md §6).
 */

import { useEffect, useRef, useState } from 'react';
import CadEditor from './CadEditor';
import BackupRecoveryModal from './BackupRecoveryModal';
import SheetTabBar, { type SheetTab } from '@/components/studio/SheetTabBar';
import { useCadStore, newId, type Tool } from '@/lib/cad/store';
import type { Doc, Viewport, Sheet, PaperKey, PaperOrientation } from '@/lib/cad/model';
import { emptyDoc, docBox, paperSizeMm, defaultPaperOrientation } from '@/lib/cad/model';
import { getLastUserId, loadResume, saveResume } from '@/lib/resume';
import {
  createSheetsAutosaver,
  loadSheets,
  nextSeqFrom,
  type SheetsAutosaver,
  type SheetsRecord,
} from '@/lib/sheets-persist';
import { exportIdf, importIdf, lastImportIdfError, type IdfSheetData } from '@/lib/cad/idf';
import { mergeIdfSheetsToDoc } from '@/lib/cad/sheet-migrate';
import { rootFolderChosen, getProjectFolderHandle, writeTextFile, readTextFile } from '@/lib/root-folder';
import { resolveSourceOfTruth, createDiskWriter, watchProjectPresence, type DiskWriter } from '@/lib/disk-sync';
import { useProjectPresence } from '@/lib/project-presence-ui';
import { ensureProjectScope } from '@/lib/project-scope';
import { buildPaperSheetPdf, exportSheetSetPdf, exportPaperSheetPdf } from '@/lib/cad/pdf';
/**
 * Làn C (in/giấy/xuất) — hộp thoại "Xuất PDF theo tờ giấy" (Màn 7) mount Ở ĐÂY chứ không ở
 * `CadEditor.tsx`, vì đây mới là nơi giữ `sheets[]` THẬT (CadEditor không có — xem chú thích
 * `onExportSheetSetPdf` bên dưới, đã sẵn cơ chế bắc cầu bằng CustomEvent cho đúng lý do này).
 * Khác chặng Trình chiếu (khổ giấy do hồ sơ quyết ⇒ khoá): ở đây khổ giấy là THẬT trong `Doc`
 * nên KHÔNG truyền `paperLockedReason` — người dùng đổi được, và đổi là ghi thẳng vào Doc.
 */
import ExportPdfDialog from '@/components/print/ExportPdfDialog';
import { buildExportChecks } from '@/lib/print/export-checks';
import { buildIfpack, restoreIfpack } from '@/lib/cad/ifpack';
import { startAutoBackup, type AutoBackupSession } from '@/lib/cad/auto-backup';
import { backfillRoomTypes } from '@/lib/cad/standards/checker';
import { syncHostedOpenings } from '@/lib/cad/hosting';
import { syncPocheAnchors } from '@/lib/cad/poche';
import { useSheetsBucketId } from '@/lib/scope';
import { markBucketHydrated } from '@/lib/cad/cad-doc-hydration';
import { useFlowStore } from '@/lib/store';
import { createProject } from '@/lib/workspace';
import { saveSheets } from '@/lib/sheets-persist';
import { useSaveStatus } from '@/lib/save-status';
import { useRouter } from 'next/navigation';
import { drawEntities } from '@/lib/cad/render';
import { clampViewportRect, docForViewport, moveViewportRect, patchSheetViewport, removeSheetViewport, resizeViewportRect, setViewportLayerVisibility, viewportLayerVisible, viewportWorldBox } from '@/lib/cad/paper-space';
import { Grip, Lock, LockOpen, ScanSearch, Trash2 } from 'lucide-react';

const ROUTE = '/cad-editor' as const;
const DEFAULT_VIEWPORT: Viewport = { scale: 0.08, panX: 300, panY: 400 };

/** Hình hài 1 sheet trong IndexedDB — doc + tên + viewport (KHÔNG undo/selection). Giữ NGUYÊN
 * hình dạng cũ (id/name/doc/viewport/currentLayer) — `lib/cad/cad3d-autosave-core.ts` khai lại
 * đúng shape này riêng (private, không import từ đây) và giả định nó không đổi. */
interface PersistedCadSheet {
  id: string;
  name: string;
  doc: Doc;
  viewport: Viewport;
  currentLayer: string;
  paperSheets?: Sheet[];
  [k: string]: unknown;
}

/**
 * B4 (31/07, mã `4.1.d`) — tệp NGUỒN SỰ THẬT trên đĩa cho chặng CAD, trong thư mục dự án
 * (`docs/QUYET-DINH-HA-TANG-2026-07-31.md` sơ đồ đã chốt). Cùng định dạng `.idf` xuất/nhập thủ
 * công đã có (`lib/cad/idf.ts`) — KHÔNG đổi format, chỉ đổi CHỖ đọc/ghi tự động.
 */
const IDF_DISK_FILE = 'ban-ve.idf';

/**
 * Ghi `sheets` ra `ban-ve.idf` trong thư mục dự án — GHI RỒI ĐỌC LẠI XÁC NHẬN đúng kỷ luật
 * `testStorageConnection()` (vá sự cố 31/07 ở B3), không coi ghi xong là ghi ĐÚNG. `create:false`
 * dùng khi CHỈ kiểm tra thư mục dự án có sẵn hay chưa (không tự tạo) — xem gọi ở dưới.
 */
async function writeIdfToDisk(
  bucketId: string,
  projectName: string,
  sheets: IdfSheetData[],
  opts?: { create?: boolean },
): Promise<boolean> {
  const dirRes = await getProjectFolderHandle(bucketId, projectName, { create: opts?.create ?? true });
  if (!dirRes.ok) return false;
  const json = exportIdf(sheets, { projectName });
  if (!(await writeTextFile(dirRes.dir, IDF_DISK_FILE, json))) return false;
  const readBack = await readTextFile(dirRes.dir, IDF_DISK_FILE);
  if (readBack === null) return false;
  const verify = importIdf(readBack);
  return !!verify && verify.sheets.length === sheets.length;
}

/**
 * B4 (4.1.d) — quyết định NGUỒN NÀO thắng lúc mount + tự di trú/tự đồng bộ. Trả về sheets đã
 * parse nếu ĐĨA thắng (caller tự áp qua `applyIdfSheets`); `null` nếu cache thắng (không đổi gì,
 * cache đã đang hiển thị đúng rồi). Cập nhật `useSaveStatus().diskStatus` trong MỌI nhánh — không
 * nhánh nào được im lặng (bài học sự cố 31/07).
 *
 * `cacheSheets`/`cacheTs` rỗng/0 hợp lệ khi CHƯA từng có bản ghi IndexedDB nào (máy mới/trình
 * duyệt mới) — B5 "copy thư mục dự án sang máy khác" phụ thuộc ĐÚNG nhánh này: cache rỗng ⇒
 * `cacheTs=0` (cũ nhất có thể) ⇒ đĩa LUÔN thắng nếu đọc được, không bị coi nhầm là "cache mới hơn".
 */
async function resolveAndSyncCadDisk(
  bucketId: string,
  projectName: string,
  cacheSheets: IdfSheetData[],
  cacheTs: number,
): Promise<IdfSheetData[] | null> {
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
    // Thư mục dự án CHƯA có (NotFoundError, create:false) — CHƯA DI TRÚ, ghi lần đầu nếu có gì để ghi.
    if (cacheSheets.length > 0) {
      setDiskStatus((await writeIdfToDisk(bucketId, projectName, cacheSheets, { create: true })) ? 'synced' : 'off');
    }
    return null;
  }

  const json = await readTextFile(dirRes.dir, IDF_DISK_FILE);
  if (json === null) {
    // Thư mục dự án CÓ nhưng chưa có ban-ve.idf — CHƯA DI TRÚ, ghi lần đầu nếu có gì để ghi.
    if (cacheSheets.length > 0) {
      setDiskStatus((await writeIdfToDisk(bucketId, projectName, cacheSheets, { create: true })) ? 'synced' : 'off');
    }
    return null;
  }
  const parsed = importIdf(json);
  if (!parsed) {
    setDiskStatus('error', 'Tệp ban-ve.idf trên đĩa hỏng hoặc sai định dạng — đang dùng bản trong máy, KHÔNG tự ghi đè.');
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
    // ② — KHÔNG thay im lặng, báo rõ + giữ cache.
    setDiskStatus(
      'error',
      `Tệp trên đĩa chỉ có ${parsed.sheets.length} bản vẽ, ít hơn ${cacheSheets.length} đang mở trong máy — có thể ghi dở/hỏng. ĐANG GIỮ bản trong máy, không tự ghi đè lên đĩa.`,
    );
    return null;
  }
  if (resolution.reason === 'cache-newer' && cacheSheets.length > 0) {
    // Cache mới hơn đĩa (thường do mất quyền phiên trước) — ĐẨY cache RA đĩa, KHÔNG BAO GIỜ
    // kéo đĩa cũ đè bản đang sửa (Hoà chốt, giữ nguyên).
    const wrote = await writeIdfToDisk(bucketId, projectName, cacheSheets, { create: true });
    setDiskStatus(
      wrote ? 'synced' : 'error',
      wrote ? undefined : 'Bản trong máy MỚI HƠN đĩa (có thể do mất quyền ở phiên trước) — thử ghi lại ra đĩa nhưng THẤT BẠI. Vào Cài đặt → Lưu trữ, bấm "Kiểm tra kết nối thư mục".',
    );
    return null;
  }
  // 'tie' — lệch trong ngưỡng dung sai, coi là ngang tuổi, không có gì bất thường.
  setDiskStatus('synced');
  return null;
}

let seq = 1;
const nextId = () => `cadsheet-${seq++}`;

/** Ô nhìn mặc định của 1 Sheet mới — khổ A3, tỉ lệ in 1:100, tâm đặt ở giữa bbox Doc hiện có
 * (Doc rỗng → gốc toạ độ). Chỉ ảnh hưởng "đổi tab thì camera bay tới đâu" (`goToSheetView`), KHÔNG
 * liên quan gì tới hình học lưu trong Doc. */
function defaultSheet(name: string, doc: Doc, id?: string): Sheet {
  const paper: PaperKey = 'A3';
  const orientation: PaperOrientation = defaultPaperOrientation(paper);
  const [paperW, paperH] = paperSizeMm(paper, orientation);
  const box = docBox(doc);
  return {
    id: id ?? nextId(),
    name,
    number: '',
    paper,
    orientation,
    titleBlock: { project: '', drawnBy: '', date: '', revision: '' },
    viewports: [
      {
        id: newId('vp'),
        rectOnPaper: { x: 15, y: 15, w: paperW - 30, h: paperH - 30 },
        centerMm: box ? { x: (box.minX + box.maxX) / 2, y: (box.minY + box.maxY) / 2 } : { x: 0, y: 0 },
        scale: 100,
        locked: false,
      },
    ],
  };
}

/** ÁP 1 Doc mới làm nguồn sự thật DUY NHẤT của store — undo-history bắt đầu mới (đúng ý "mở
 * file/đổi dự án = phiên làm việc mới", giống bản cũ). ĐƯỜNG DUY NHẤT được phép gán `doc` từ bên
 * ngoài thao tác vẽ — mọi nơi cần nạp Doc (mount, import .idf, phục hồi ifpack/backup, đổi dự án)
 * đều gọi qua đây, không tự `setState({doc:...})` rải rác (Luật Đồng Bộ #6). */
function resetStoreWithDoc(doc: Doc, opts?: { viewport?: Viewport; currentLayer?: string }) {
  useCadStore.setState({
    doc,
    past: [],
    future: [],
    viewport: opts?.viewport ?? { ...DEFAULT_VIEWPORT },
    currentLayer: opts?.currentLayer ?? doc.layers[0]?.id ?? 'l-wall',
    selection: [],
  });
}

/**
 * Gộp danh sách sheet kiểu CŨ (`IdfSheetData[]`, mỗi phần tử 1 Doc riêng — từ .idf/.ifpack/backup/
 * cache trước luật MỘT Doc) thành ĐÚNG 1 Doc chung + Sheet[] metadata. 0-1 phần tử: không cần gộp,
 * giữ nguyên id/tên cũ (resume/id tra cứu vẫn khớp). ≥2 phần tử: gộp bằng bộ chuyển đã test
 * (`sheet-migrate.ts` Bước 2) — bảo toàn MỌI entity, không rơi rớt; kết quả CHỈ 1 Sheet (tách lại
 * N tab đúng thuật toán Q1 của phiếu là việc D3, chưa làm ở đây).
 */
function docAndSheetsFromIdf(idfSheets: IdfSheetData[]): { doc: Doc; sheets: Sheet[] } {
  if (idfSheets.length === 0) {
    const doc = emptyDoc();
    return { doc, sheets: [defaultSheet('Bản vẽ 1', doc)] };
  }
  // G-M1-21 (07/08) — trước đây phễu này reconcile HOSTING (cửa/cửa sổ) mà QUÊN poché: `.idf` cũ
  // không có `hostId` nạp lên là mảng tô mồ côi cho tới lần sửa đầu tiên — đúng bệnh G-M1-20 của
  // `importDoc`, chỉ khác cửa vào. Nay gọi CẶP hàm y hệt mọi mutation trong store (poche.ts:13).
  if (idfSheets.length === 1) {
    const doc = syncPocheAnchors(syncHostedOpenings(backfillRoomTypes(idfSheets[0].doc)));
    const paperSheets = idfSheets[0].paperSheets;
    return { doc, sheets: paperSheets?.length ? paperSheets : [defaultSheet(idfSheets[0].name, doc, idfSheets[0].id)] };
  }
  const cleaned = idfSheets.map((s) => ({ ...s, doc: backfillRoomTypes(s.doc) }));
  const merged = mergeIdfSheetsToDoc(cleaned);
  return { doc: syncPocheAnchors(syncHostedOpenings(merged.doc)), sheets: [merged.sheet] };
}

/** Bản ghi 1-sheet để xuất/ghi đĩa (.idf/.ifpack/backup) — LUÔN đúng 1 phần tử mang trọn Doc
 * chung hiện tại (xem docstring đầu file — an toàn cho `cad3d-autosave-core.ts` + không tự nhân
 * đôi nội dung nếu lỡ re-import). */
function singleIdfSheet(id: string, name: string, paperSheets: Sheet[] = []): IdfSheetData[] {
  return [{ id, name, doc: useCadStore.getState().doc, ...(paperSheets.length ? { paperSheets } : {}) }];
}

/** Đổi tab = đổi KHUNG NHÌN — bay camera 2D tới vùng world mà Viewport2D của sheet đang soi vào
 * (tâm `centerMm`, bề rộng/cao = khổ giấy × tỉ lệ in), KHÔNG đụng Doc/undo. `CadCanvas.tsx` nghe
 * sự kiện `cad:goto-box` (cùng khuôn `cad:zoom-extents`/`cad:zoom-to` đã có). */
function goToSheetView(sheet: Sheet | undefined) {
  if (typeof window === 'undefined') return;
  const vp = sheet?.viewports[0];
  if (!sheet || !vp) {
    window.dispatchEvent(new CustomEvent('cad:zoom-extents'));
    return;
  }
  const [paperW, paperH] = paperSizeMm(sheet.paper, sheet.orientation);
  const worldW = paperW * vp.scale;
  const worldH = paperH * vp.scale;
  window.dispatchEvent(
    new CustomEvent('cad:goto-box', {
      detail: {
        minX: vp.centerMm.x - worldW / 2,
        minY: vp.centerMm.y - worldH / 2,
        maxX: vp.centerMm.x + worldW / 2,
        maxY: vp.centerMm.y + worldH / 2,
      },
    }),
  );
}

export default function CadSheets() {
  const router = useRouter();
  // Sheet 1 = trạng thái store hiện có (giữ nguyên bản demo/blank đang mở).
  const [sheets, setSheets] = useState<Sheet[]>(() => [defaultSheet('Bản vẽ 1', emptyDoc(), 'cadsheet-0')]);
  const [activeId, setActiveId] = useState('cadsheet-0');
  const [backupBrowserOpen, setBackupBrowserOpen] = useState(false);
  // Làn C — Màn 7. `paperTick` chỉ để ép tính lại danh sách kiểm khi người dùng đổi khổ giấy trong
  // hộp thoại: nguồn sự thật là `Doc` trong store (không phải state của hộp thoại), mà store này
  // đọc bằng `getState()` ở component này chứ không subscribe.
  const [paperExportOpen, setPaperExportOpen] = useState(false);
  const [paperTick, setPaperTick] = useState(0);
  const cadMode = useCadStore((s) => s.cadMode);
  const cadWorkspace = useCadStore((s) => s.cadWorkspace);

  // ---- Persistence (J-3): refs gương cho autosaver đọc mà không re-subscribe ----
  const userIdRef = useRef<string | null>(null);
  const sheetsRef = useRef(sheets);
  const activeIdRef = useRef(activeId);
  const saverRef = useRef<SheetsAutosaver | null>(null);
  const backupSessionRef = useRef<AutoBackupSession | null>(null);
  // B4 (4.1.d) — writer đĩa RIÊNG, nhịp chậm hơn IndexedDB (③), tạo lại mỗi khi đổi dự án.
  const diskWriterRef = useRef<DiskWriter | null>(null);
  /**
   * BUCKET THEO DỰ ÁN (sửa rò chéo 25/07): bộ sheet lưu theo `userId::route::projectId`.
   * Đổi dự án ⇒ `bucketId` đổi ⇒ hydrate lại từ bucket mới. `hydratedFor` giữ bucket ĐÃ
   * hydrate (không phải cờ boolean) để ngay khung hình đổi dự án, `hydrated` đã là false —
   * autosaver không kịp ghi bản vẽ dự án cũ sang bucket dự án mới.
   */
  const bucketId = useSheetsBucketId();
  const bucketIdRef = useRef(bucketId);
  useEffect(() => {
    bucketIdRef.current = bucketId;
  }, [bucketId]);
  const [hydratedFor, setHydratedFor] = useState<string | null>(null);
  const hydrated = hydratedFor === bucketId;
  const prevBucketRef = useRef<string | null>(null);

  /**
   * B4 (4.1.d) — ÁP dữ liệu `.idf` đã parse vào state sống — ĐÚNG 1 đường dùng chung cho cả
   * nhập thủ công (`onImportIdf`) LẪN nạp tự động khi đĩa thắng lúc mount (Luật Đồng Bộ #6:
   * không viết đường thứ hai). Gộp N sheet cũ thành 1 Doc chung (`docAndSheetsFromIdf`) rồi ÁP
   * NGUYÊN — zoom-extents để thấy hết (không goToSheetView: mở file muốn thấy TOÀN BỘ, không
   * phải đúng khung 1 viewport mặc định).
   */
  const applyIdfSheets = (parsedSheets: IdfSheetData[]): { mergedFromCount: number } => {
    const { doc, sheets: newSheets } = docAndSheetsFromIdf(parsedSheets);
    seq = Math.max(seq, nextSeqFrom(newSheets.map((s) => s.id), 'cadsheet'));
    setSheets(newSheets);
    setActiveId(newSheets[0].id);
    resetStoreWithDoc(doc);
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('cad:zoom-extents'));
    return { mergedFromCount: parsedSheets.length };
  };

  /** KHÔI PHỤC 1 lần lúc mount: IDB → Doc chung + sheet active (ưu tiên resume.sheetId nếu còn). */
  useEffect(() => {
    const userId = getLastUserId();
    userIdRef.current = userId;
    // ĐỔI DỰ ÁN giữa phiên (client-nav /projects/A/cad → /projects/B/cad, component KHÔNG
    // remount): dọn tab + doc + canvas trước, để bản vẽ dự án cũ không nằm lại dưới URL
    // dự án mới. Lần mount đầu KHÔNG dọn — giữ nguyên bản demo/blank store đang mở.
    if (prevBucketRef.current !== null && prevBucketRef.current !== bucketId) {
      const blank = emptyDoc();
      setSheets([defaultSheet('Bản vẽ 1', blank, 'cadsheet-0')]);
      setActiveId('cadsheet-0');
      resetStoreWithDoc(blank);
    }
    prevBucketRef.current = bucketId;
    if (!userId) {
      setHydratedFor(bucketId); // chưa đăng nhập → thuần in-memory (y bản cũ)
      markBucketHydrated(bucketId); // lib/cad/cad3d-autosave.ts đọc cờ này — không có gì để nạp lại
      return;
    }
    let cancelled = false;
    void loadSheets<PersistedCadSheet>(userId, ROUTE, bucketId).then(async (rec) => {
      if (cancelled) return;
      const valid = rec?.sheets.filter((s) => s.doc && s.viewport) ?? [];

      // B4 (4.1.d) — quyết định NGUỒN NÀO thắng TRƯỚC khi áp bất kỳ state nào, tránh 1 khung
      // hình hiện cache rồi ngay sau đó bị đĩa ghi đè (nhấp nháy). `cacheTs=0` khi CHƯA có bản
      // ghi IndexedDB nào (máy mới) — để B5 "copy thư mục dự án sang máy khác" hoạt động đúng:
      // cache rỗng phải LUÔN thua đĩa thật, không bị coi nhầm là "cache mới hơn vì vừa mới now()".
      //
      // BUG BẮT ĐƯỢC KHI BROWSER-VERIFY (31/07, xem PresentSheets.tsx docstring y hệt) —
      // `flowName` nạp bất đồng bộ qua `ensureProjectScope()`, effect này có thể chạy TRƯỚC khi
      // nạp xong ⇒ tạo NHẦM thư mục theo tên mặc định `'Untitled flow'`. Gọi lại
      // `ensureProjectScope()` — IDEMPOTENT, không tốn request nếu trang đã nạp xong.
      if (bucketId) await ensureProjectScope(bucketId);
      if (cancelled) return;
      const projectName = useFlowStore.getState().flowName || 'InteriorFlow project';
      const cacheSheets: IdfSheetData[] = valid.map((s) => ({ id: s.id, name: s.name, doc: s.doc, ...(s.paperSheets?.length ? { paperSheets: s.paperSheets } : {}) }));
      const diskSheets = await resolveAndSyncCadDisk(bucketId, projectName, cacheSheets, rec?.ts ?? 0);
      if (cancelled) return;

      if (diskSheets) {
        applyIdfSheets(diskSheets);
        saverRef.current?.touch(); // đồng bộ ngược lại IndexedDB — cache luôn ấm cho lần mở kế
      } else if (rec && valid.length > 0) {
        const { doc, sheets: newSheets } = docAndSheetsFromIdf(cacheSheets);
        seq = Math.max(seq, nextSeqFrom(newSheets.map((s) => s.id), 'cadsheet'));
        // sheet active: resume trỏ tận sheet nếu id còn sống, kế đến activeId đã lưu. Sau khi gộp
        // (>1 sheet cũ) không id nào khớp nữa → rơi đúng vào newSheets[0] (chỉ còn 1 sheet).
        const resumeSheet = loadResume(userId)?.sheetId;
        const wantId =
          (resumeSheet && newSheets.some((s) => s.id === resumeSheet) && resumeSheet) ||
          (newSheets.some((s) => s.id === rec.activeId) && rec.activeId) ||
          newSheets[0].id;
        const activeOriginal = valid.find((s) => s.id === wantId) ?? valid[0];
        setSheets(newSheets);
        setActiveId(wantId);
        resetStoreWithDoc(doc, { currentLayer: activeOriginal.currentLayer });
        if (cacheSheets.length > 1) {
          // Cache CŨ (trước luật MỘT Doc) có nhiều sheet khác Doc — vừa gộp về 1, ghi lại NGAY để
          // lần sau không phải gộp lại nữa (saverRef có thể chưa sẵn sàng ở đúng dòng này — effect
          // autosave bên dưới còn chưa mount lần đầu; best-effort, autosave bình thường sẽ chốt
          // lại ở lần sửa/đổi tab kế tiếp nếu dòng này không kịp).
          saverRef.current?.touch();
          diskWriterRef.current?.touch();
        }
        window.dispatchEvent(new CustomEvent('cad:zoom-extents'));
      }
      setHydratedFor(bucketId);
      markBucketHydrated(bucketId); // lib/cad/cad3d-autosave.ts: mode 3D tin thẳng store, khỏi nạp lại
    });
    return () => {
      cancelled = true;
    };
  }, [bucketId]);

  /** AUTOSAVE debounce ≥1s: nghe store CAD (vẽ/pan/zoom) — chỉ sau khi đã hydrate. */
  useEffect(() => {
    const userId = userIdRef.current;
    if (!hydrated || !userId) return;
    const getRecord = (): SheetsRecord | null => {
      const active = sheetsRef.current.find((sh) => sh.id === activeIdRef.current) ?? sheetsRef.current[0];
      if (!active) return null;
      const s = useCadStore.getState();
      // Một bản ghi dữ liệu mang Doc chung + paperSheets nhẹ: không nhân hình học, vẫn giữ đủ tờ.
      return {
        v: 1,
        activeId: active.id,
        ts: Date.now(),
        sheets: [{ id: active.id, name: active.name, doc: s.doc, viewport: s.viewport, currentLayer: s.currentLayer, paperSheets: sheetsRef.current }],
      };
    };
    // B1 (30/07, docs/CAT-PHAM-VI-3-NGAY-2026-07-30.md §1) — backup .ifpack ra thư mục thứ 2
    // trên máy (khác nơi IDB lưu), giữ 5 bản gần nhất. Chạy mỗi 10 phút + mỗi lần autosave IDB
    // thật sự ghi xong (`onSaved` bên dưới) — app này không có nút "Lưu tay" riêng, autosave
    // debounce là tín hiệu "vừa lưu" duy nhất. Chưa bật (chưa chọn thư mục) → tự bỏ qua, im lặng.
    const backup = startAutoBackup(() => {
      const active = sheetsRef.current.find((sh) => sh.id === activeIdRef.current) ?? sheetsRef.current[0];
      return {
        sheets: active ? singleIdfSheet(active.id, active.name, sheetsRef.current) : [],
        projectId: bucketId || userId,
        projectName: useFlowStore.getState().flowName || 'InteriorFlow project',
      };
    });
    backupSessionRef.current = backup;

    const saver = createSheetsAutosaver(userId, ROUTE, getRecord, {
      projectId: bucketId, // chốt bucket lúc tạo → nhịp flush cuối luôn về đúng dự án này
      onSaved: (bytes) => {
        console.debug(`[cad-sheets] IDB ghi ${(bytes / 1024).toFixed(1)} KB`);
        useSaveStatus.getState().setLastSavedAt(Date.now());
        backup.triggerNow();
      },
      onSavingChange: (saving) => useSaveStatus.getState().setStatus(saving ? 'saving' : 'saved'),
    });
    saverRef.current = saver;

    /**
     * B4 (4.1.d, bổ sung ③) — ghi đĩa THEO NHỊP RIÊNG, chậm hơn IndexedDB (throttle 10s, không
     * debounce) + ⌘S/rời trang ép ghi ngay. `reason:'off'` là cờ nội bộ (KHÔNG phải lỗi) khi dự
     * án chưa bật lưu trữ — `onStatus` tách riêng, không báo "lỗi" cho trường hợp opt-in này.
     */
    const diskWriter = createDiskWriter(
      async () => {
        if (!bucketId || !(await rootFolderChosen())) return { ok: true, reason: 'off' };
        const projectName = useFlowStore.getState().flowName || 'InteriorFlow project';
        const active = sheetsRef.current.find((sh) => sh.id === activeIdRef.current) ?? sheetsRef.current[0];
        const idfSheets: IdfSheetData[] = active ? singleIdfSheet(active.id, active.name, sheetsRef.current) : [];
        const wrote = await writeIdfToDisk(bucketId, projectName, idfSheets, { create: true });
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

    // CHỈ nghe lát cắt được persist (doc/viewport/layer) — store còn nhiều state phụ
    // (tool, hover, dynamic-input…) đổi liên tục, nghe tất sẽ ghi IDB vô ích mỗi 1.2s.
    const unsub = useCadStore.subscribe((s, prev) => {
      if (s.doc !== prev.doc || s.viewport !== prev.viewport || s.currentLayer !== prev.currentLayer) {
        saver.touch();
        diskWriter.touch();
      }
    });
    const flush = () => {
      saver.flush();
      diskWriter.flushNow();
    };
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('beforeunload', flush);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      unsub();
      window.removeEventListener('beforeunload', flush);
      document.removeEventListener('visibilitychange', onHide);
      saver.flush(); // rời route (client-nav) → không mất nhịp cuối
      saver.dispose();
      saverRef.current = null;
      diskWriter.flushNow();
      diskWriter.dispose();
      diskWriterRef.current = null;
      backup.dispose();
      backupSessionRef.current = null;
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
      diskWriterRef.current?.touch(); // B4 (4.1.d) — thiếu dòng này thì dự án CAD mới, chưa ai
      // vẽ gì, sẽ KHÔNG BAO GIỜ có ban-ve.idf đầu tiên (bắt được khi browser-verify: Present có
      // dòng này nên tự ghi lần đầu ngay cả khi không ai thao tác, CAD thiếu nên treo mãi).
    }
  }, [sheets, activeId, hydrated]);

  /** Resume trỏ tận sheet: ghi sheetId đang mở vào resume-state (lib/resume). */
  useEffect(() => {
    const userId = userIdRef.current;
    if (!hydrated || !userId) return;
    saveResume(userId, { route: ROUTE, sheetId: activeId });
  }, [activeId, hydrated]);

  /** Đổi tab = đổi KHUNG NHÌN — KHÔNG đụng Doc/undo (xem docstring đầu file + `goToSheetView`). */
  const switchTo = (id: string) => {
    if (id === activeId) return;
    setActiveId(id);
    goToSheetView(sheets.find((s) => s.id === id));
  };

  const addSheet = () => {
    // D2 đợt 8: KHÔNG còn trần số tờ — sau D1 mỗi sheet chỉ là metadata vài trăm byte (tên +
    // khung nhìn), thêm tờ không nhân đôi hình học nên hết lý do chặn.
    const doc = useCadStore.getState().doc;
    const sheet = defaultSheet(`Bản vẽ ${sheets.length + 1}`, doc);
    setSheets((prev) => [...prev, sheet]);
    setActiveId(sheet.id);
    goToSheetView(sheet);
  };

  const closeSheet = (id: string) => {
    if (sheets.length <= 1) return;
    const idx = sheets.findIndex((s) => s.id === id);
    const rest = sheets.filter((s) => s.id !== id);
    setSheets(rest);
    if (id === activeId) {
      const neighbor = rest[Math.max(0, idx - 1)];
      setActiveId(neighbor.id);
      goToSheetView(neighbor);
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

  const updateViewport = (viewportId: string, patch: Partial<Sheet['viewports'][number]>) =>
    setSheets((prev) => prev.map((sheet) => sheet.id === activeId ? patchSheetViewport(sheet, viewportId, patch) : sheet));
  const replaceSheet = (nextSheet: Sheet) => setSheets((prev) => prev.map((sheet) => sheet.id === nextSheet.id ? nextSheet : sheet));

  /**
   * Sprint 7 — Việc 2 (.idf): CadEditor (nút "Xuất .idf"/"Mở .idf") không giữ danh sách sheet
   * (chỉ CadSheets giữ, xem đầu file) → bắc cầu qua CustomEvent 'cad:idf-export-request' /
   * 'cad:idf-import-request', cùng pattern 'cad:zoom-extents' đã dùng khắp app.
   */
  useEffect(() => {
    const onExportIdf = () => {
      const active = sheetsRef.current.find((s) => s.id === activeIdRef.current) ?? sheetsRef.current[0];
      const idfSheets = singleIdfSheet(active?.id ?? 'cadsheet-0', active?.name ?? 'Bản vẽ 1', sheetsRef.current);
      const json = exportIdf(idfSheets);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'project.idf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      useCadStore.getState().setStatus('Đã xuất project.idf.');
    };

    /**
     * 2.1.8.k (30/07) — bộ hồ sơ PDF nhiều tờ: CÙNG lý do bắc cầu như .idf ở trên (CadEditor
     * không giữ sheets[]). PDF là sản phẩm CUỐI (không re-import) nên xuất theo ĐÚNG số tab UI
     * hiện có — mỗi trang cùng đọc chung 1 Doc (D3 mới cắt riêng theo từng Viewport2D).
     */
    const onExportSheetSetPdf = () => {
      const doc = useCadStore.getState().doc;
      const idfSheets = sheetsRef.current.map((s) => ({ id: s.id, name: s.name, doc, paperSheet: s }));
      useCadStore.getState().setStatus('Đang dựng bộ hồ sơ PDF…');
      void exportSheetSetPdf(idfSheets, 'drawing-set.pdf', { title: useFlowStore.getState().flowName || 'InteriorFlow — Drafting CAD' })
        .then(() => {
          useCadStore.getState().setStatus(`Đã xuất drawing-set.pdf — ${idfSheets.length} tờ + mục lục.`);
        })
        .catch((err) => {
          useCadStore.getState().setStatus(`Lỗi xuất bộ hồ sơ PDF: ${err instanceof Error ? err.message : String(err)}`);
        });
    };

    const onImportIdf = (ev: Event) => {
      const detail = (ev as CustomEvent<{ json: string; fileName: string }>).detail;
      if (!detail) return;
      const parsed = importIdf(detail.json);
      if (!parsed) {
        // T3 (VIỆC 4) — lastImportIdfError() có lý do CỤ THỂ (vd "file mới hơn app") khi có;
        // generic "hỏng/sai định dạng" chỉ còn dùng cho JSON vỡ/cấu trúc sai thật sự.
        const reason = lastImportIdfError();
        useCadStore.getState().setStatus(reason ?? `Không mở được "${detail.fileName}" — file .idf hỏng hoặc sai định dạng.`);
        return;
      }
      // B4 (4.1.d) — dùng ĐÚNG 1 đường áp dụng sheet đã parse, chung với nạp tự động khi đĩa
      // thắng lúc mount (xem docstring applyIdfSheets — Luật Đồng Bộ #6).
      const { mergedFromCount } = applyIdfSheets(parsed.sheets);
      saverRef.current?.touch(); // ghi ngay vào IDB, không đợi debounce thao tác kế tiếp
      diskWriterRef.current?.touch(); // B4 — cũng đánh dấu đĩa cần ghi lại (nhịp riêng, không ngay lập tức)
      useCadStore
        .getState()
        .setStatus(
          mergedFromCount > 1
            ? `Đã mở "${detail.fileName}" — gộp ${mergedFromCount} bản vẽ cũ thành 1 (tách lại nhiều tờ là việc đợt sau).`
            : `Đã mở "${detail.fileName}".`,
        );
    };

    /**
     * T4 (VIỆC 5, 28/07) — backup ".ifpack": cùng cầu CustomEvent như .idf ở trên.
     * Xuất: gói TẤT CẢ sheet + ảnh markup hiện trường (rút từ base64 ra file rời) vào 1 ZIP.
     * Phục hồi: KHÔNG ghi đè dự án đang mở — luôn tạo DỰ ÁN MỚI (tên gốc + " (phục hồi)"),
     * ghi sheet đã phục hồi thẳng vào bucket IndexedDB của dự án mới rồi điều hướng sang đó,
     * để trang CAD dự án mới tự nạp qua đúng đường `loadSheets()` bình thường (không cần state
     * "đang import" đặc biệt nào ở CadEditor).
     */
    const onExportIfpack = () => {
      const active = sheetsRef.current.find((s) => s.id === activeIdRef.current) ?? sheetsRef.current[0];
      const idfSheets = singleIdfSheet(active?.id ?? 'cadsheet-0', active?.name ?? 'Bản vẽ 1', sheetsRef.current);
      const projectId = bucketIdRef.current || userIdRef.current || 'local';
      const projectName = useFlowStore.getState().flowName || 'InteriorFlow project';
      void buildIfpack(idfSheets, { id: projectId, name: projectName })
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'project.ifpack';
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 2000);
          useCadStore.getState().setStatus('Đã xuất project.ifpack.');
        })
        .catch(() => {
          useCadStore.getState().setStatus('Xuất .ifpack thất bại — thử lại.');
        });
    };

    const onRestoreIfpack = (ev: Event) => {
      const detail = (ev as CustomEvent<{ buffer: ArrayBuffer; fileName: string }>).detail;
      if (!detail) return;
      const userId = userIdRef.current;
      if (!userId) {
        useCadStore.getState().setStatus('Cần đăng nhập để phục hồi .ifpack thành dự án mới.');
        return;
      }
      useCadStore.getState().setStatus(`Đang phục hồi "${detail.fileName}"…`);
      void (async () => {
        const restored = await restoreIfpack(detail.buffer);
        if (!restored) {
          useCadStore.getState().setStatus(`Không phục hồi được "${detail.fileName}" — file .ifpack hỏng hoặc sai định dạng.`);
          return;
        }
        const newName = `${restored.meta.name || 'Dự án'} (phục hồi)`;
        const created = await createProject(newName);
        if (!created) {
          useCadStore.getState().setStatus('Không tạo được dự án mới để phục hồi — thử lại.');
          return;
        }
        // Bản .ifpack có thể từ TRƯỚC luật MỘT Doc (N sheet, mỗi sheet 1 Doc) — gộp về 1 Doc chung
        // trước khi ghi vào dự án mới, KHÔNG rơi rớt entity nào (docAndSheetsFromIdf, xem đầu file).
        const { doc, sheets: newSheets } = docAndSheetsFromIdf(restored.sheets);
        const record: SheetsRecord<PersistedCadSheet> = {
          v: 1,
          activeId: newSheets[0].id,
          ts: Date.now(),
          sheets: [
            {
              id: newSheets[0].id,
              name: newSheets[0].name,
              doc,
              viewport: { ...DEFAULT_VIEWPORT },
              currentLayer: doc.layers[0]?.id ?? 'l-wall',
              paperSheets: newSheets,
            },
          ],
        };
        await saveSheets(userId, ROUTE, record, created.id);
        const warn = restored.integrityWarnings.length ? ` (⚠ ${restored.integrityWarnings.length} cảnh báo toàn vẹn)` : '';
        useCadStore.getState().setStatus(`Đã phục hồi thành dự án mới "${newName}"${warn} — đang chuyển…`);
        router.push(`/projects/${created.id}/cad`);
      })();
    };

    /**
     * B3 (30/07) — phục hồi từ 1 điểm trong thư mục backup tự động (`auto-backup.ts::recoverBackup()`
     * đã ráp SẴN thành `IdfSheetData[]` — KHÔNG cần giải nén .ifpack như `onRestoreIfpack` ở trên,
     * vì có thể là điểm CHÊNH LỆCH đã ráp xuôi từ mốc đầy đủ, không phải file .ifpack thật trên đĩa).
     * Cùng nguyên tắc TẠO DỰ ÁN MỚI, không ghi đè dự án đang mở — y hệt `onRestoreIfpack`.
     */
    const onRestoreFromBackup = (ev: Event) => {
      const detail = (ev as CustomEvent<{ sheets: import('@/lib/cad/idf').IdfSheetData[]; projectName: string; degraded: boolean; recoveredAsOf: string | null }>).detail;
      if (!detail) return;
      const userId = userIdRef.current;
      if (!userId) {
        useCadStore.getState().setStatus('Cần đăng nhập để phục hồi từ backup thành dự án mới.');
        return;
      }
      useCadStore.getState().setStatus(`Đang phục hồi từ backup…`);
      void (async () => {
        if (!detail.sheets.length) {
          useCadStore.getState().setStatus('Không phục hồi được — bản backup này rỗng hoặc hỏng, không còn mốc nào ráp được trước đó.');
          return;
        }
        const newName = `${detail.projectName || 'Dự án'} (phục hồi backup)`;
        const created = await createProject(newName);
        if (!created) {
          useCadStore.getState().setStatus('Không tạo được dự án mới để phục hồi — thử lại.');
          return;
        }
        const { doc, sheets: newSheets } = docAndSheetsFromIdf(detail.sheets);
        const record: SheetsRecord<PersistedCadSheet> = {
          v: 1,
          activeId: newSheets[0].id,
          ts: Date.now(),
          sheets: [
            {
              id: newSheets[0].id,
              name: newSheets[0].name,
              doc,
              viewport: { ...DEFAULT_VIEWPORT },
              currentLayer: doc.layers[0]?.id ?? 'l-wall',
              paperSheets: newSheets,
            },
          ],
        };
        await saveSheets(userId, ROUTE, record, created.id);
        const warn = detail.degraded ? ` (⚠ không ráp trọn tới đúng điểm bạn chọn — dừng ở mốc "${detail.recoveredAsOf ?? '?'}" gần nhất ráp được)` : '';
        useCadStore.getState().setStatus(`Đã phục hồi thành dự án mới "${newName}"${warn} — đang chuyển…`);
        router.push(`/projects/${created.id}/cad`);
      })();
    };

    window.addEventListener('cad:idf-export-request', onExportIdf);
    window.addEventListener('cad:idf-import-request', onImportIdf);
    window.addEventListener('cad:ifpack-export-request', onExportIfpack);
    const onOpenBackupBrowser = () => setBackupBrowserOpen(true);

    /**
     * 2.1.8.n (31/07, GẤP — chặn buổi thử CAD LAN) — Ctrl/⌘+S phát sự kiện này (CadCanvas.tsx),
     * KHÔNG mở đường lưu mới: app đã tự lưu đúng qua autosave debounce, cái thiếu là người dùng
     * KHÔNG THẤY. Ép flush() chạy ngay (bỏ qua debounce ~1.2s) rồi báo trạng thái ngay lập tức —
     * không đợi promise `saveSheets()` bên trong `flush()` xong mới báo, vì mục đích là XÁC NHẬN
     * THỊ GIÁC "trạng thái hiện tại đã/đang được lưu", không phải theo dõi 1 lần ghi cụ thể (ghi
     * IndexedDB cục bộ gần như luôn thành công tức thời — cùng tinh thần optimistic-status các
     * chỗ khác trong file này, vd `st.setStatus()` sau `pasteClipboard()`).
     */
    const onForceSave = () => {
      saverRef.current?.flush();
      diskWriterRef.current?.flushNow(); // B4 (4.1.d) — ⌘S cũng ép ghi đĩa ngay, không đợi nhịp 10s
      const d = new Date();
      const hhmm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      useCadStore.getState().setStatus(`Đã lưu — ${hhmm}`);
    };

    // Làn C — CadEditor (nơi có menu Xuất) không giữ sheets[], nên bắc cầu bằng CustomEvent y hệt
    // các đường trên, KHÔNG mở cơ chế thứ hai.
    const onOpenPaperExport = () => setPaperExportOpen(true);

    window.addEventListener('cad:ifpack-import-request', onRestoreIfpack);
    window.addEventListener('cad:backup-restore-request', onRestoreFromBackup);
    window.addEventListener('cad:backup-browse-open', onOpenBackupBrowser);
    window.addEventListener('cad:sheetset-pdf-export-request', onExportSheetSetPdf);
    window.addEventListener('cad:paper-export-dialog-request', onOpenPaperExport);
    window.addEventListener('cad:force-save-request', onForceSave);
    return () => {
      window.removeEventListener('cad:idf-export-request', onExportIdf);
      window.removeEventListener('cad:idf-import-request', onImportIdf);
      window.removeEventListener('cad:ifpack-export-request', onExportIfpack);
      window.removeEventListener('cad:sheetset-pdf-export-request', onExportSheetSetPdf);
      window.removeEventListener('cad:ifpack-import-request', onRestoreIfpack);
      window.removeEventListener('cad:backup-restore-request', onRestoreFromBackup);
      window.removeEventListener('cad:backup-browse-open', onOpenBackupBrowser);
      window.removeEventListener('cad:paper-export-dialog-request', onOpenPaperExport);
      window.removeEventListener('cad:force-save-request', onForceSave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <SheetTabBar
        sheets={sheets.map(({ id, name }): SheetTab => ({ id, name }))}
        activeId={activeId}
        onSelect={switchTo}
        onAdd={addSheet}
        onRename={renameSheet}
        onClose={closeSheet}
        onReorder={reorder}
        addLabel="Thêm bản vẽ"
      />
      {/* Sketch luôn ở Model; Pro đổi thật giữa hình học 1:1 và tờ giấy. */}
      {cadMode === 'sketch' || cadWorkspace === 'model' ? <CadEditor /> : (
        <PaperSpace
          sheet={sheets.find((sheet) => sheet.id === activeId) ?? sheets[0]}
          onViewportChange={updateViewport}
          onSheetChange={replaceSheet}
          onOpenModel={(viewport) => {
            useCadStore.getState().setCadWorkspace('model');
            const box = viewportWorldBox(viewport);
            window.dispatchEvent(new CustomEvent('cad:goto-box', { detail: box }));
          }}
        />
      )}
      <PaperExportDialogHost
        open={paperExportOpen}
        tick={paperTick}
        sheets={sheets}
        activeId={activeId}
        onClose={() => setPaperExportOpen(false)}
        onPaperChanged={() => setPaperTick((n) => n + 1)}
        onSheetChange={replaceSheet}
      />
      {backupBrowserOpen && (
        <BackupRecoveryModal
          projectId={bucketIdRef.current || userIdRef.current || 'local'}
          projectName={useFlowStore.getState().flowName || 'InteriorFlow project'}
          onClose={() => setBackupBrowserOpen(false)}
        />
      )}
    </div>
  );
}

const PAPER_SCALES = [20, 25, 50, 75, 100, 150, 200] as const;

function PaperSpace({ sheet, onViewportChange, onSheetChange, onOpenModel }: {
  sheet: Sheet;
  onViewportChange: (viewportId: string, patch: Partial<Sheet['viewports'][number]>) => void;
  onSheetChange: (sheet: Sheet) => void;
  onOpenModel: (viewport: Sheet['viewports'][number]) => void;
}) {
  const doc = useCadStore((s) => s.doc);
  const [selectedId, setSelectedId] = useState(sheet.viewports[0]?.id ?? '');
  const [inspectorTab, setInspectorTab] = useState<'sheet' | 'viewport' | 'layers'>('viewport');
  const [cleanView, setCleanView] = useState(false);
  const gesture = useRef<{ id: string; kind: 'move' | 'resize'; x: number; y: number; rect: Sheet['viewports'][number]['rectOnPaper']; paperPxW: number; paperPxH: number } | null>(null);
  const [paperW, paperH] = paperSizeMm(sheet.paper, sheet.orientation);
  const selected = sheet.viewports.find((viewport) => viewport.id === selectedId) ?? sheet.viewports[0];
  useEffect(() => {
    const report = () => window.dispatchEvent(new CustomEvent('cad:paper-selection-state', { detail: { scale: selected?.scale ?? 100, locked: selected?.locked ?? false, clean: cleanView } }));
    const onAction = (event: Event) => {
      const { action, value } = (event as CustomEvent<{ action: string; value?: number }>).detail ?? {};
      if (action === 'report') { report(); return; }
      if (action === 'add') { addViewport(); return; }
      if (action === 'layers') { setCleanView(false); setInspectorTab('layers'); return; }
      if (action === 'clean') { setCleanView((current) => !current); return; }
      if (!selected) return;
      if (action === 'lock') onViewportChange(selected.id, { locked: !selected.locked });
      if (action === 'scale' && value && value > 0) onViewportChange(selected.id, { scale: value });
      if (action === 'center') {
        const box = docBox(doc);
        if (box) onViewportChange(selected.id, { centerMm: { x: (box.minX + box.maxX) / 2, y: (box.minY + box.maxY) / 2 } });
      }
    };
    window.addEventListener('cad:paper-action', onAction);
    report();
    return () => window.removeEventListener('cad:paper-action', onAction);
  // `addViewport` chỉ đọc snapshot render hiện tại; listener được làm mới khi Sheet đổi.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, cleanView, doc]);
  const beginGesture = (event: React.PointerEvent, viewport: Sheet['viewports'][number], kind: 'move' | 'resize') => {
    if (viewport.locked && kind === 'move') return;
    const paper = event.currentTarget.closest('[data-paper]') as HTMLElement | null;
    if (!paper) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = paper.getBoundingClientRect();
    gesture.current = { id: viewport.id, kind, x: event.clientX, y: event.clientY, rect: viewport.rectOnPaper, paperPxW: rect.width, paperPxH: rect.height };
    setSelectedId(viewport.id);
    event.preventDefault();
    event.stopPropagation();
  };
  const continueGesture = (event: React.PointerEvent) => {
    const g = gesture.current;
    if (!g) return;
    const dx = (event.clientX - g.x) * paperW / g.paperPxW;
    const dy = (event.clientY - g.y) * paperH / g.paperPxH;
    const rectOnPaper = g.kind === 'move'
      ? moveViewportRect(g.rect, dx, dy, paperW, paperH)
      : resizeViewportRect(g.rect, dx, dy, paperW, paperH);
    onViewportChange(g.id, { rectOnPaper });
  };
  const endGesture = () => { gesture.current = null; };
  const addViewport = () => {
    const n = sheet.viewports.length;
    const viewport = { id: newId('vp'), rectOnPaper: { x: 24 + n * 8, y: 24 + n * 8, w: Math.min(180, paperW - 48), h: Math.min(120, paperH - 48) }, centerMm: selected?.centerMm ?? { x: 0, y: 0 }, scale: selected?.scale ?? 100, locked: false };
    onSheetChange({ ...sheet, viewports: [...sheet.viewports, viewport] });
    setSelectedId(viewport.id);
  };
  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', background: 'var(--canvas-bg, #242424)' }}>
      <div style={{ flex: 1, minWidth: 0, overflow: 'auto', display: 'grid', placeItems: 'center', padding: cleanView ? 22 : 28 }}>
      <div data-paper style={{ width: `min(${cleanView ? 90 : 76}vw, ${paperW * 2}px)`, aspectRatio: `${paperW}/${paperH}`, minWidth: 520, position: 'relative', background: '#fff', color: '#25221e', boxShadow: '0 18px 55px rgba(0,0,0,.35)', border: '1px solid rgba(0,0,0,.25)', touchAction: 'none' }} onPointerMove={continueGesture} onPointerUp={endGesture} onPointerCancel={endGesture}>
        <div style={{ position: 'absolute', inset: 14, border: '1px solid #777' }} />
        {sheet.viewports.map((viewport) => <PaperViewport key={viewport.id} doc={doc} viewport={viewport} paperW={paperW} paperH={paperH} selected={!cleanView && viewport.id === selected?.id} onSelect={() => { if (!cleanView) { setSelectedId(viewport.id); setInspectorTab('viewport'); } }} onMoveStart={(event) => beginGesture(event, viewport, 'move')} onResizeStart={(event) => beginGesture(event, viewport, 'resize')} onChange={(patch) => onViewportChange(viewport.id, patch)} onOpenModel={() => onOpenModel(viewport)} />)}
        <div style={{ position: 'absolute', right: 14, bottom: 14, width: '42%', height: 54, border: '1px solid #777', padding: '7px 9px', font: '600 10px Archivo, sans-serif', display: 'grid', gridTemplateColumns: '1fr auto', gap: 4 }}>
          <span>{sheet.titleBlock.project || 'TÊN DỰ ÁN'}</span><span>{sheet.number || '—'}</span>
          <strong>{sheet.name}</strong><span>{sheet.paper} · {sheet.viewports.length} ô nhìn</span>
        </div>
      </div>
      </div>
      {!cleanView && <PaperInspector sheet={sheet} selected={selected} doc={doc} tab={inspectorTab} onTab={setInspectorTab} onSheetChange={onSheetChange} onViewportChange={onViewportChange} onOpenModel={() => selected && onOpenModel(selected)} onDelete={() => {
        if (!selected || sheet.viewports.length <= 1) return;
        const next = removeSheetViewport(sheet, selected.id);
        onSheetChange(next);
        setSelectedId(next.viewports[0]?.id ?? '');
      }} />}
    </div>
  );
}

function PaperViewport({ doc, viewport, paperW, paperH, selected, onSelect, onMoveStart, onResizeStart, onChange, onOpenModel }: { doc: Doc; viewport: Sheet['viewports'][number]; paperW: number; paperH: number; selected: boolean; onSelect: () => void; onMoveStart: (event: React.PointerEvent) => void; onResizeStart: (event: React.PointerEvent) => void; onChange: (patch: Partial<Sheet['viewports'][number]>) => void; onOpenModel: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewportDoc = docForViewport(doc, viewport);
  const world = viewportWorldBox(viewport);
  const content = docBox(viewportDoc);
  const hasVisibleContent = !!content && content.maxX >= world.minX && content.minX <= world.maxX && content.maxY >= world.minY && content.minY <= world.maxY;
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect(); const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(rect.width * dpr)); canvas.height = Math.max(1, Math.round(rect.height * dpr));
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, rect.width, rect.height);
    const box = viewportWorldBox(viewport); const scale = Math.min(rect.width / (box.maxX - box.minX), rect.height / (box.maxY - box.minY));
    drawEntities(ctx, { scale, panX: rect.width / 2 - viewport.centerMm.x * scale, panY: rect.height / 2 + viewport.centerMm.y * scale }, viewportDoc, { stroke: '#34312d', lineWidth: 1, text: true });
  }, [doc, viewport]);
  return <div onPointerDown={onSelect} style={{ position: 'absolute', left: `${viewport.rectOnPaper.x / paperW * 100}%`, top: `${viewport.rectOnPaper.y / paperH * 100}%`, width: `${viewport.rectOnPaper.w / paperW * 100}%`, height: `${viewport.rectOnPaper.h / paperH * 100}%`, border: `${selected ? 2 : 1}px solid ${selected ? '#6455d9' : '#8d8880'}`, overflow: 'hidden', background: '#fcfcfb' }}>
    <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    {!hasVisibleContent && <button type="button" onClick={(event) => { event.stopPropagation(); onOpenModel(); }} style={{ position: 'absolute', left: '50%', top: '50%', translate: '-50% -50%', border: '1px solid #c8c4bc', borderRadius: 8, background: 'rgba(255,255,255,.94)', color: '#625d55', padding: '6px 9px', font: '600 10px Archivo, sans-serif', cursor: 'pointer' }}>Không thấy nội dung · Chọn vùng</button>}
    <div style={{ position: 'absolute', right: 5, bottom: 4, padding: '2px 5px', borderRadius: 5, background: 'rgba(255,255,255,.9)', color: '#625d55', font: '600 9px Archivo, sans-serif' }}>1:{viewport.scale} · {viewport.locked ? 'Đã khóa' : 'Chưa khóa'}</div>
    {selected && <><div onPointerDown={onMoveStart} title={viewport.locked ? 'Mở khóa để kéo' : 'Kéo ô nhìn'} style={{ ...paperHandle, left: 6, top: 6, cursor: viewport.locked ? 'not-allowed' : 'move' }}><Grip size={13} /></div><div onPointerDown={onResizeStart} title="Đổi kích thước ô nhìn" style={{ ...paperHandle, right: 2, bottom: 2, cursor: 'nwse-resize' }} /></>}
  </div>;
}

function PaperInspector({ sheet, selected, doc, tab, onTab, onSheetChange, onViewportChange, onOpenModel, onDelete }: {
  sheet: Sheet;
  selected: Sheet['viewports'][number] | undefined;
  doc: Doc;
  tab: 'sheet' | 'viewport' | 'layers';
  onTab: (tab: 'sheet' | 'viewport' | 'layers') => void;
  onSheetChange: (sheet: Sheet) => void;
  onViewportChange: (id: string, patch: Partial<Sheet['viewports'][number]>) => void;
  onOpenModel: () => void;
  onDelete: () => void;
}) {
  return <aside aria-label="Thuộc tính Paper" style={{ width: 252, flex: 'none', minHeight: 0, overflow: 'auto', padding: 12, borderLeft: '1px solid var(--border)', background: 'var(--panel)', color: 'var(--t1)', font: '500 11px Archivo, sans-serif' }}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 3, padding: 3, borderRadius: 10, background: 'var(--field)', marginBottom: 12 }}>
      {([['sheet', 'Tờ'], ['viewport', 'Ô nhìn'], ['layers', 'Lớp']] as const).map(([id, label]) => <button key={id} type="button" onClick={() => onTab(id)} style={{ border: 0, borderRadius: 8, minHeight: 30, background: tab === id ? 'var(--card)' : 'transparent', color: tab === id ? 'var(--t1)' : 'var(--t3)', font: '650 11px Archivo, sans-serif', boxShadow: tab === id ? '0 1px 4px rgba(0,0,0,.12)' : 'none', cursor: 'pointer' }}>{label}</button>)}
    </div>
    {tab === 'sheet' && <div style={paperInspectorGrid}>
      <strong style={paperInspectorHeading}>Thông tin tờ</strong>
      <PaperField label="Số tờ"><input aria-label="Số tờ" value={sheet.number} onChange={(event) => onSheetChange({ ...sheet, number: event.target.value })} style={inspectorInput} placeholder="A-01" /></PaperField>
      <PaperField label="Dự án"><input aria-label="Tên dự án trên tờ" value={sheet.titleBlock.project} onChange={(event) => onSheetChange({ ...sheet, titleBlock: { ...sheet.titleBlock, project: event.target.value } })} style={inspectorInput} placeholder="Tên dự án" /></PaperField>
      <PaperField label="Người vẽ"><input aria-label="Người vẽ" value={sheet.titleBlock.drawnBy} onChange={(event) => onSheetChange({ ...sheet, titleBlock: { ...sheet.titleBlock, drawnBy: event.target.value } })} style={inspectorInput} placeholder="—" /></PaperField>
      <PaperField label="Sửa đổi"><input aria-label="Sửa đổi" value={sheet.titleBlock.revision} onChange={(event) => onSheetChange({ ...sheet, titleBlock: { ...sheet.titleBlock, revision: event.target.value } })} style={inspectorInput} placeholder="00" /></PaperField>
      <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('cad:paper-export-dialog-request'))} style={inspectorAction}>Thiết lập khổ và xuất</button>
    </div>}
    {tab === 'viewport' && selected && <div style={paperInspectorGrid}>
      <strong style={paperInspectorHeading}>Ô nhìn đang chọn</strong>
      <PaperField label="Tỉ lệ"><select value={selected.scale} onChange={(event) => onViewportChange(selected.id, { scale: Number(event.target.value) })} style={inspectorInput}>{PAPER_SCALES.map((scale) => <option key={scale} value={scale}>1:{scale}</option>)}</select></PaperField>
      <button type="button" onClick={() => onViewportChange(selected.id, { locked: !selected.locked })} style={inspectorAction}>{selected.locked ? <Lock size={14} /> : <LockOpen size={14} />}{selected.locked ? 'Đã khóa · Bấm để mở' : 'Khóa ô nhìn'}</button>
      <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('cad:paper-action', { detail: { action: 'center' } }))} style={inspectorAction}><ScanSearch size={14} /> Căn vào bản vẽ</button>
      <button type="button" onClick={onOpenModel} style={inspectorAction}>Mở vùng này trong Model</button>
      <details style={{ marginTop: 5 }}><summary style={{ color: 'var(--t3)', cursor: 'pointer' }}>Tọa độ nâng cao</summary><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 7 }}>
        <PaperField label="Tâm X"><input aria-label="Tâm X ô nhìn" type="number" step="1" disabled={selected.locked} value={Number(selected.centerMm.x.toFixed(2))} onChange={(event) => { const x = Number(event.target.value); if (Number.isFinite(x)) onViewportChange(selected.id, { centerMm: { ...selected.centerMm, x } }); }} style={inspectorInput} /></PaperField>
        <PaperField label="Tâm Y"><input aria-label="Tâm Y ô nhìn" type="number" step="1" disabled={selected.locked} value={Number(selected.centerMm.y.toFixed(2))} onChange={(event) => { const y = Number(event.target.value); if (Number.isFinite(y)) onViewportChange(selected.id, { centerMm: { ...selected.centerMm, y } }); }} style={inspectorInput} /></PaperField>
      </div></details>
      <button type="button" disabled={sheet.viewports.length <= 1} onClick={onDelete} style={{ ...inspectorAction, marginTop: 10, color: sheet.viewports.length <= 1 ? 'var(--t4)' : 'var(--danger, #c64b4b)' }}><Trash2 size={14} /> Xóa ô nhìn</button>
    </div>}
    {tab === 'layers' && selected && <div style={paperInspectorGrid}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><strong style={paperInspectorHeading}>Lớp trong ô này</strong>{selected.layerOverrides && Object.keys(selected.layerOverrides).length > 0 && <button type="button" onClick={() => onViewportChange(selected.id, { layerOverrides: undefined })} style={{ ...paperButton, color: 'var(--accent)' }}>Theo bản vẽ</button>}</div>
      {doc.layers.map((layer) => <label key={layer.id} style={{ display: 'flex', alignItems: 'center', gap: 7, minHeight: 30, cursor: 'pointer' }}><input type="checkbox" checked={viewportLayerVisible(selected, layer.id, layer.visible)} onChange={(event) => { const next = setViewportLayerVisibility(selected, layer.id, event.target.checked); onViewportChange(selected.id, { layerOverrides: next.layerOverrides }); }} /><span style={{ width: 9, height: 9, borderRadius: 3, background: layer.color, border: '1px solid var(--border-strong)' }} /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{layer.name}</span></label>)}
    </div>}
  </aside>;
}

function PaperField({ label, children }: { label: string; children: React.ReactNode }) { return <label style={{ display: 'grid', gap: 4, color: 'var(--t3)', fontSize: 10.5 }}>{label}{children}</label>; }

const paperInspectorGrid: React.CSSProperties = { display: 'grid', gap: 9 };
const paperInspectorHeading: React.CSSProperties = { color: 'var(--t1)', fontSize: 12 };
const inspectorInput: React.CSSProperties = { width: '100%', minWidth: 0, height: 32, padding: '0 8px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--field)', color: 'var(--t1)', font: '550 11.5px Archivo, sans-serif' };
const inspectorAction: React.CSSProperties = { minHeight: 34, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, border: '1px solid var(--border)', borderRadius: 9, background: 'var(--field)', color: 'var(--t2)', font: '650 11px Archivo, sans-serif', cursor: 'pointer' };

const paperButton: React.CSSProperties = { border: 0, background: 'transparent', color: '#34312d', display: 'inline-flex', alignItems: 'center', gap: 4, padding: 2, font: '600 11px Archivo, sans-serif', cursor: 'pointer' };
const paperHandle: React.CSSProperties = { position: 'absolute', zIndex: 2, width: 18, height: 18, display: 'grid', placeItems: 'center', borderRadius: 4, background: '#6455d9', color: '#fff' };

/**
 * Làn C — cầu nối giữa hộp thoại Màn 7 (`components/print/*`, thuần trình bày) và dữ liệu CAD THẬT.
 *
 * Ba thứ ở chặng 2D là thật, khác hẳn chặng Trình chiếu (nơi mới chỉ có 1 "tờ" giả lập):
 *  · **Sheet[]** — đúng số tab bản vẽ đang mở, đúng tên người dùng đặt.
 *  · **Khổ giấy** — đọc `Doc.paperKey/paperOrientation`; đổi trong hộp thoại là ghi thẳng vào Doc
 *    qua `setPrintSettings` (CÙNG đường mà ô chọn khổ giấy trong Inspector CadEditor dùng, không
 *    mở đường thứ hai) ⇒ PDF xuất ra đúng khổ vừa chọn, và khung tên/tỉ lệ cũng theo đó.
 *  · **Danh sách kiểm** — `buildExportChecks()` đo từ chính Doc đó (nét, layer thừa, tỉ lệ có lọt
 *    khổ, khoảng cách tới gốc 0,0), không phải 5 dòng "✓ đã chạy" cứng như mock.
 *
 * Không tự dựng PDF: 2 nút xuất gọi lại đúng 2 đường đã có (`exportSheetSetPdf` cho cả bộ,
 * `exportPaperSheetPdf` cho tờ đang mở).
 */
function PaperExportDialogHost({
  open,
  tick,
  sheets,
  activeId,
  onClose,
  onPaperChanged,
  onSheetChange,
}: {
  open: boolean;
  /** đổi giá trị = tín hiệu "khổ giấy vừa đổi, tính lại danh sách kiểm". */
  tick: number;
  sheets: Sheet[];
  activeId: string;
  onClose: () => void;
  onPaperChanged: () => void;
  onSheetChange: (sheet: Sheet) => void;
}) {
  const doc = useCadStore.getState().doc;
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [previewError, setPreviewError] = useState<string>();
  const activeSheet = sheets.find((sheet) => sheet.id === activeId) ?? sheets[0];
  const paper: PaperKey = activeSheet?.paper ?? 'A3';
  const orientation: PaperOrientation = activeSheet?.orientation ?? defaultPaperOrientation(paper);
  // `tick` cố ý nằm trong biểu thức: nó là lý do duy nhất khiến khối này chạy lại sau khi người
  // dùng đổi khổ giấy (doc đọc bằng getState(), không subscribe).
  const checks = open ? buildExportChecks(doc, paper, orientation) : [];
  if (open && activeSheet && checks.length > 1) {
    checks[1] = {
      label: `${activeSheet.viewports.length} ô nhìn giữ đúng vị trí và tỉ lệ trên ${paper} ${orientation === 'portrait' ? 'dọc' : 'ngang'}`,
      ok: activeSheet.viewports.length > 0 && activeSheet.viewports.every((viewport) => viewport.scale > 0),
    };
  }
  void tick;

  useEffect(() => {
    if (!open || !activeSheet) { setPreviewUrl(undefined); setPreviewError(undefined); return; }
    let cancelled = false;
    let url: string | undefined;
    setPreviewUrl(undefined);
    setPreviewError(undefined);
    void buildPaperSheetPdf(doc, activeSheet, { title: useFlowStore.getState().flowName || 'InteriorFlow project', dimStyle: useCadStore.getState().dimStyle })
      .then((pdf) => {
        if (cancelled) return;
        url = URL.createObjectURL(pdf.output('blob'));
        setPreviewUrl(url);
      })
      .catch((error) => {
        if (!cancelled) setPreviewError(`Không dựng được bản xem trước: ${error instanceof Error ? error.message : String(error)}`);
      });
    return () => { cancelled = true; if (url) URL.revokeObjectURL(url); };
  }, [open, activeSheet, doc, tick]);

  return (
    <ExportPdfDialog
      open={open}
      sheets={sheets.map((s) => ({ id: s.id, label: s.name }))}
      currentSheetIndex={Math.max(0, sheets.findIndex((sheet) => sheet.id === activeId))}
      initialPaper={paper}
      initialOrientation={orientation}
      checks={checks}
      previewUrl={previewUrl}
      previewError={previewError}
      onPaperChange={(p, o) => {
        if (activeSheet) {
          const [pw, ph] = paperSizeMm(p, o);
          onSheetChange({
            ...activeSheet,
            paper: p,
            orientation: o,
            viewports: activeSheet.viewports.map((viewport) => ({
              ...viewport,
              rectOnPaper: clampViewportRect(viewport.rectOnPaper, pw, ph),
            })),
          });
        }
        onPaperChanged();
      }}
      onExportAll={() => {
        onClose();
        window.dispatchEvent(new CustomEvent('cad:sheetset-pdf-export-request'));
      }}
      onExportCurrent={() => {
        onClose();
        const st = useCadStore.getState();
        if (!activeSheet) return;
        st.setStatus('Đang dựng PDF vector…');
        void exportPaperSheetPdf(st.doc, activeSheet, 'layout.pdf', { title: useFlowStore.getState().flowName || 'InteriorFlow — Drafting CAD', dimStyle: st.dimStyle })
          .then(() => st.setStatus('Đã xuất layout.pdf — tờ đang mở.'))
          .catch((err) => st.setStatus(`Lỗi xuất PDF: ${err instanceof Error ? err.message : String(err)}`));
      }}
      onPickTool={(toolId) => {
        // VIỆC 4 (07/08, G-M13-03) — `RadialToolMenu` (Màn 9) chọn CÔNG CỤ CAD THẬT, không phải
        // engine vẽ tay mới. 'undo' gọi thẳng useCadStore.undo(); các id còn lại map sang Tool
        // gần nghĩa nhất đã có sẵn trong lib/cad/store.ts (KHÔNG đẻ tool mới).
        onClose();
        const st = useCadStore.getState();
        const TOOL_MAP: Record<string, Tool> = {
          pen: 'polyline',
          shape: 'rect',
          eraser: 'select',
          measure: 'measure',
          text: 'text',
        };
        if (toolId === 'undo') { st.undo(); return; }
        const t = TOOL_MAP[toolId];
        if (t) st.setTool(t);
      }}
      onClose={onClose}
    />
  );
}
