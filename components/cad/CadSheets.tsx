'use client';

/**
 * components/cad/CadSheets.tsx — Tầng MULTI-SHEET (phụ-thêm) cho chặng CAD.
 *
 * `useCadStore` là singleton toàn cục → không thể mount nhiều CadEditor cô lập. Giải pháp:
 * giữ ĐÚNG 1 CadEditor mounted, mỗi lần đổi tab thì HOÁN nội dung store (doc + undo + viewport
 * + layer + selection). Snapshot mỗi sheet giữ trong ref (không gây re-render).
 *
 * PERSISTENCE (J-3 Sprint 2 — quyết định #6 "nhớ chính xác từng sheet"):
 * cả bộ sheet (doc + tên + viewport + layer hiện hành, TRẦN 5) serialize vào IndexedDB
 * theo khoá `userId::/cad-editor` (lib/sheets-persist). Reload → khôi phục đúng bộ sheet
 * + sheet đang mở (ưu tiên resume.sheetId của lib/resume nếu còn tồn tại). Autosave
 * debounce ≥1s nghe cả store CAD lẫn thao tác tab; KHÔNG lưu undo-history/selection
 * (reload = lịch sử mới, giống mở file). Không có userId (chưa đăng nhập) → thuần in-memory y bản cũ.
 *
 * 1 sheet ⇒ hành vi y hệt bản cũ (export PNG/DXF, "Đưa sang Render" đều đọc active doc).
 * Kéo-gộp single-window = pha 2 (docs/MULTI-SHEET-PROPOSAL.md §6).
 */

import { useEffect, useRef, useState } from 'react';
import CadEditor from './CadEditor';
import BackupRecoveryModal from './BackupRecoveryModal';
import SheetTabBar, { type SheetTab } from '@/components/studio/SheetTabBar';
import { useCadStore } from '@/lib/cad/store';
import type { Doc, Viewport } from '@/lib/cad/model';
import { emptyDoc } from '@/lib/cad/model';
import { getLastUserId, loadResume, saveResume } from '@/lib/resume';
import {
  createSheetsAutosaver,
  loadSheets,
  nextSeqFrom,
  type SheetsAutosaver,
  type SheetsRecord,
} from '@/lib/sheets-persist';
import { exportIdf, importIdf, lastImportIdfError, type IdfSheetData } from '@/lib/cad/idf';
import { rootFolderChosen, getProjectFolderHandle, writeTextFile, readTextFile } from '@/lib/root-folder';
import { resolveSourceOfTruth, createDiskWriter, watchProjectPresence, type DiskWriter } from '@/lib/disk-sync';
import { useProjectPresence } from '@/lib/project-presence-ui';
import { ensureProjectScope } from '@/lib/project-scope';
import { exportSheetSetPdf } from '@/lib/cad/pdf';
import { buildIfpack, restoreIfpack } from '@/lib/cad/ifpack';
import { startAutoBackup, type AutoBackupSession } from '@/lib/cad/auto-backup';
import { backfillRoomTypes } from '@/lib/cad/standards/checker';
import { useSheetsBucketId } from '@/lib/scope';
import { useFlowStore } from '@/lib/store';
import { createProject } from '@/lib/workspace';
import { saveSheets } from '@/lib/sheets-persist';
import { useSaveStatus } from '@/lib/save-status';
import { useRouter } from 'next/navigation';

const MAX_SHEETS = 5;
const ROUTE = '/cad-editor' as const;
const DEFAULT_VIEWPORT: Viewport = { scale: 0.08, panX: 300, panY: 400 };

/** Lát cắt store mà mỗi sheet CAD sở hữu riêng (serialize được). */
interface CadSnapshot {
  doc: Doc;
  past: Doc[];
  future: Doc[];
  viewport: Viewport;
  currentLayer: string;
  selection: string[];
}

/** Hình hài 1 sheet trong IndexedDB — doc + tên + viewport (KHÔNG undo/selection). */
interface PersistedCadSheet {
  id: string;
  name: string;
  doc: Doc;
  viewport: Viewport;
  currentLayer: string;
  [k: string]: unknown;
}

function captureStore(): CadSnapshot {
  const s = useCadStore.getState();
  return {
    doc: s.doc,
    past: s.past,
    future: s.future,
    viewport: s.viewport,
    currentLayer: s.currentLayer,
    selection: s.selection,
  };
}

function blankSnapshot(): CadSnapshot {
  const doc = emptyDoc();
  return {
    doc,
    past: [],
    future: [],
    viewport: { ...DEFAULT_VIEWPORT },
    currentLayer: doc.layers[0]?.id ?? 'l-wall',
    selection: [],
  };
}

/** Snapshot dựng lại từ bản ghi IDB — undo-history + selection bắt đầu mới.
 * backfillRoomTypes(): choke point DUY NHẤT của đường autosave-restore — gán 1 LẦN roomType cho
 * nhãn phòng cũ chưa có field này (xem checker.ts). Idempotent, no-op nếu đã backfill trước đó. */
function snapshotFromPersisted(p: PersistedCadSheet): CadSnapshot {
  return {
    doc: backfillRoomTypes(p.doc),
    past: [],
    future: [],
    viewport: p.viewport,
    currentLayer: p.currentLayer ?? p.doc.layers?.[0]?.id ?? 'l-wall',
    selection: [],
  };
}

function applySnapshot(t: CadSnapshot) {
  useCadStore.setState({
    doc: t.doc,
    past: t.past,
    future: t.future,
    viewport: t.viewport,
    currentLayer: t.currentLayer,
    selection: t.selection,
  });
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

export default function CadSheets() {
  const router = useRouter();
  // Sheet 1 = trạng thái store hiện có (giữ nguyên bản demo/blank đang mở).
  const [sheets, setSheets] = useState<SheetTab[]>([{ id: 'cadsheet-0', name: 'Bản vẽ 1' }]);
  const [activeId, setActiveId] = useState('cadsheet-0');
  const [backupBrowserOpen, setBackupBrowserOpen] = useState(false);
  // Snapshot nội dung từng sheet (ref → không render thừa). Sheet đang mở = store thật.
  const snaps = useRef<Record<string, CadSnapshot>>({});

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
   * không viết đường thứ hai). CAD dùng Zustand (`applySnapshot` → `setState`) nên KHÔNG dính
   * lớp lỗi remount/id-trùng của B2 (đó là đặc thù kiến trúc key-remount riêng của Present) —
   * nhưng vẫn giữ NGUYÊN TẮC "1 đường áp dụng duy nhất" để không phải verify lại 2 lần.
   */
  const applyIdfSheets = (parsedSheets: IdfSheetData[]): { keptCount: number; droppedCount: number } => {
    const kept = parsedSheets.slice(0, MAX_SHEETS);
    snaps.current = {};
    for (const s of kept) {
      const doc = backfillRoomTypes(s.doc);
      snaps.current[s.id] = {
        doc,
        past: [],
        future: [],
        viewport: { ...DEFAULT_VIEWPORT },
        currentLayer: doc.layers[0]?.id ?? 'l-wall',
        selection: [],
      };
    }
    seq = Math.max(seq, nextSeqFrom(kept.map((s) => s.id), 'cadsheet'));
    const nextSheets = kept.map(({ id, name }) => ({ id, name }));
    setSheets(nextSheets);
    const firstId = nextSheets[0].id;
    setActiveId(firstId);
    applySnapshot(snaps.current[firstId]);
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('cad:zoom-extents'));
    return { keptCount: kept.length, droppedCount: parsedSheets.length - kept.length };
  };

  /** KHÔI PHỤC 1 lần lúc mount: IDB → bộ sheet + sheet active (ưu tiên resume.sheetId). */
  useEffect(() => {
    const userId = getLastUserId();
    userIdRef.current = userId;
    // ĐỔI DỰ ÁN giữa phiên (client-nav /projects/A/cad → /projects/B/cad, component KHÔNG
    // remount): dọn tab + snapshot + canvas trước, để bản vẽ dự án cũ không nằm lại dưới URL
    // dự án mới. Lần mount đầu KHÔNG dọn — giữ nguyên bản demo/blank store đang mở.
    if (prevBucketRef.current !== null && prevBucketRef.current !== bucketId) {
      snaps.current = {};
      setSheets([{ id: 'cadsheet-0', name: 'Bản vẽ 1' }]);
      setActiveId('cadsheet-0');
      applySnapshot(blankSnapshot());
    }
    prevBucketRef.current = bucketId;
    if (!userId) {
      setHydratedFor(bucketId); // chưa đăng nhập → thuần in-memory (y bản cũ)
      return;
    }
    let cancelled = false;
    void loadSheets<PersistedCadSheet>(userId, ROUTE, bucketId).then(async (rec) => {
      if (cancelled) return;
      const valid = rec?.sheets.filter((s) => s.doc && s.viewport).slice(0, MAX_SHEETS) ?? [];

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
      const cacheSheets: IdfSheetData[] = valid.map((s) => ({ id: s.id, name: s.name, doc: s.doc }));
      const diskSheets = await resolveAndSyncCadDisk(bucketId, projectName, cacheSheets, rec?.ts ?? 0);
      if (cancelled) return;

      if (diskSheets) {
        applyIdfSheets(diskSheets);
        saverRef.current?.touch(); // đồng bộ ngược lại IndexedDB — cache luôn ấm cho lần mở kế
      } else if (rec && valid.length > 0) {
        for (const s of valid) snaps.current[s.id] = snapshotFromPersisted(s);
        seq = Math.max(seq, nextSeqFrom(valid.map((s) => s.id), 'cadsheet'));
        // sheet active: resume trỏ tận sheet nếu id còn sống, kế đến activeId đã lưu.
        const resumeSheet = loadResume(userId)?.sheetId;
        const wantId =
          (resumeSheet && valid.some((s) => s.id === resumeSheet) && resumeSheet) ||
          (valid.some((s) => s.id === rec.activeId) && rec.activeId) ||
          valid[0].id;
        setSheets(valid.map(({ id, name }) => ({ id, name })));
        setActiveId(wantId);
        applySnapshot(snaps.current[wantId]);
        window.dispatchEvent(new CustomEvent('cad:zoom-extents'));
      }
      setHydratedFor(bucketId);
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
      snaps.current[activeIdRef.current] = captureStore(); // sheet đang mở = store thật
      return {
        v: 1,
        activeId: activeIdRef.current,
        ts: Date.now(),
        sheets: sheetsRef.current.slice(0, MAX_SHEETS).map((s) => {
          const snap = snaps.current[s.id] ?? blankSnapshot();
          return { id: s.id, name: s.name, doc: snap.doc, viewport: snap.viewport, currentLayer: snap.currentLayer };
        }),
      };
    };
    // B1 (30/07, docs/CAT-PHAM-VI-3-NGAY-2026-07-30.md §1) — backup .ifpack ra thư mục thứ 2
    // trên máy (khác nơi IDB lưu), giữ 5 bản gần nhất. Chạy mỗi 10 phút + mỗi lần autosave IDB
    // thật sự ghi xong (`onSaved` bên dưới) — app này không có nút "Lưu tay" riêng, autosave
    // debounce là tín hiệu "vừa lưu" duy nhất. Chưa bật (chưa chọn thư mục) → tự bỏ qua, im lặng.
    const backup = startAutoBackup(() => ({
      sheets: sheetsRef.current.slice(0, MAX_SHEETS).map((s) => {
        const snap = snaps.current[s.id] ?? blankSnapshot();
        return { id: s.id, name: s.name, doc: snap.doc };
      }),
      projectId: bucketId || userId,
      projectName: useFlowStore.getState().flowName || 'InteriorFlow project',
    }));
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
        snaps.current[activeIdRef.current] = captureStore();
        const idfSheets: IdfSheetData[] = sheetsRef.current.slice(0, MAX_SHEETS).map((s) => {
          const snap = snaps.current[s.id] ?? blankSnapshot();
          return { id: s.id, name: s.name, doc: snap.doc };
        });
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

  const switchTo = (id: string) => {
    if (id === activeId) return;
    snaps.current[activeId] = captureStore();
    const target = snaps.current[id] ?? blankSnapshot();
    applySnapshot(target);
    setActiveId(id);
    // Canh khung cho vừa bản vẽ mới (CadCanvas nghe sự kiện này).
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cad:zoom-extents'));
    }
  };

  const addSheet = () => {
    if (sheets.length >= MAX_SHEETS) return;
    snaps.current[activeId] = captureStore();
    const id = nextId();
    const snap = blankSnapshot();
    snaps.current[id] = snap;
    setSheets((prev) => [...prev, { id, name: `Bản vẽ ${prev.length + 1}` }]);
    applySnapshot(snap);
    setActiveId(id);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cad:zoom-extents'));
    }
  };

  const closeSheet = (id: string) => {
    if (sheets.length <= 1) return;
    const idx = sheets.findIndex((s) => s.id === id);
    const rest = sheets.filter((s) => s.id !== id);
    delete snaps.current[id];
    setSheets(rest);
    if (id === activeId) {
      const neighbor = rest[Math.max(0, idx - 1)];
      const target = snaps.current[neighbor.id] ?? blankSnapshot();
      applySnapshot(target);
      setActiveId(neighbor.id);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cad:zoom-extents'));
      }
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

  /**
   * Sprint 7 — Việc 2 (.idf): CadEditor (nút "Xuất .idf"/"Mở .idf") không giữ danh sách sheet
   * (chỉ CadSheets giữ, xem đầu file) → bắc cầu qua CustomEvent 'cad:idf-export-request' /
   * 'cad:idf-import-request', cùng pattern 'cad:zoom-extents' đã dùng khắp app.
   */
  useEffect(() => {
    const onExportIdf = () => {
      snaps.current[activeIdRef.current] = captureStore(); // đồng bộ sheet đang mở trước khi gom
      const idfSheets = sheetsRef.current.map((s) => {
        const snap = snaps.current[s.id] ?? blankSnapshot();
        return { id: s.id, name: s.name, doc: snap.doc };
      });
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
      useCadStore.getState().setStatus(`Đã xuất project.idf — ${idfSheets.length} bản vẽ.`);
    };

    /**
     * 2.1.8.k (30/07) — bộ hồ sơ PDF nhiều tờ: CÙNG lý do bắc cầu như .idf ở trên (CadEditor
     * không giữ sheets[]). Đồng bộ sheet đang mở TRƯỚC khi gom, y hệt onExportIdf.
     */
    const onExportSheetSetPdf = () => {
      snaps.current[activeIdRef.current] = captureStore();
      const idfSheets = sheetsRef.current.map((s) => {
        const snap = snaps.current[s.id] ?? blankSnapshot();
        return { id: s.id, name: s.name, doc: snap.doc };
      });
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
      const { keptCount, droppedCount } = applyIdfSheets(parsed.sheets);
      saverRef.current?.touch(); // ghi ngay vào IDB, không đợi debounce thao tác kế tiếp
      diskWriterRef.current?.touch(); // B4 — cũng đánh dấu đĩa cần ghi lại (nhịp riêng, không ngay lập tức)
      useCadStore
        .getState()
        .setStatus(
          `Đã mở "${detail.fileName}" — ${keptCount} bản vẽ${droppedCount > 0 ? ` (bỏ ${droppedCount} sheet vượt trần ${MAX_SHEETS})` : ''}.`,
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
      snaps.current[activeIdRef.current] = captureStore();
      const idfSheets = sheetsRef.current.map((s) => {
        const snap = snaps.current[s.id] ?? blankSnapshot();
        return { id: s.id, name: s.name, doc: snap.doc };
      });
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
          useCadStore.getState().setStatus(`Đã xuất project.ifpack — ${idfSheets.length} bản vẽ + ảnh markup.`);
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
        const kept = restored.sheets.slice(0, MAX_SHEETS);
        const record: SheetsRecord<PersistedCadSheet> = {
          v: 1,
          activeId: kept[0]?.id ?? 'cadsheet-0',
          ts: Date.now(),
          sheets: kept.map((s) => {
            const doc = backfillRoomTypes(s.doc);
            return {
              id: s.id,
              name: s.name,
              doc,
              viewport: { ...DEFAULT_VIEWPORT },
              currentLayer: doc.layers[0]?.id ?? 'l-wall',
            };
          }),
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
        const kept = detail.sheets.slice(0, MAX_SHEETS);
        const record: SheetsRecord<PersistedCadSheet> = {
          v: 1,
          activeId: kept[0]?.id ?? 'cadsheet-0',
          ts: Date.now(),
          sheets: kept.map((s) => {
            const doc = backfillRoomTypes(s.doc);
            return {
              id: s.id,
              name: s.name,
              doc,
              viewport: { ...DEFAULT_VIEWPORT },
              currentLayer: doc.layers[0]?.id ?? 'l-wall',
            };
          }),
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

    window.addEventListener('cad:ifpack-import-request', onRestoreIfpack);
    window.addEventListener('cad:backup-restore-request', onRestoreFromBackup);
    window.addEventListener('cad:backup-browse-open', onOpenBackupBrowser);
    window.addEventListener('cad:sheetset-pdf-export-request', onExportSheetSetPdf);
    window.addEventListener('cad:force-save-request', onForceSave);
    return () => {
      window.removeEventListener('cad:idf-export-request', onExportIdf);
      window.removeEventListener('cad:idf-import-request', onImportIdf);
      window.removeEventListener('cad:ifpack-export-request', onExportIfpack);
      window.removeEventListener('cad:sheetset-pdf-export-request', onExportSheetSetPdf);
      window.removeEventListener('cad:ifpack-import-request', onRestoreIfpack);
      window.removeEventListener('cad:backup-restore-request', onRestoreFromBackup);
      window.removeEventListener('cad:backup-browse-open', onOpenBackupBrowser);
      window.removeEventListener('cad:force-save-request', onForceSave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <SheetTabBar
        sheets={sheets}
        activeId={activeId}
        max={MAX_SHEETS}
        onSelect={switchTo}
        onAdd={addSheet}
        onRename={renameSheet}
        onClose={closeSheet}
        onReorder={reorder}
        addLabel="Thêm bản vẽ"
      />
      {/* CadEditor tự có flex:1 → là con trực tiếp của cột này để giãn đầy. */}
      <CadEditor />
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
