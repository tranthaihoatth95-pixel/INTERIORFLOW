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
import { exportIdf, importIdf, lastImportIdfError } from '@/lib/cad/idf';
import { buildIfpack, restoreIfpack } from '@/lib/cad/ifpack';
import { backfillRoomTypes } from '@/lib/cad/standards/checker';
import { useSheetsBucketId } from '@/lib/scope';
import { useFlowStore } from '@/lib/store';
import { createProject } from '@/lib/workspace';
import { saveSheets } from '@/lib/sheets-persist';
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

let seq = 1;
const nextId = () => `cadsheet-${seq++}`;

export default function CadSheets() {
  const router = useRouter();
  // Sheet 1 = trạng thái store hiện có (giữ nguyên bản demo/blank đang mở).
  const [sheets, setSheets] = useState<SheetTab[]>([{ id: 'cadsheet-0', name: 'Bản vẽ 1' }]);
  const [activeId, setActiveId] = useState('cadsheet-0');
  // Snapshot nội dung từng sheet (ref → không render thừa). Sheet đang mở = store thật.
  const snaps = useRef<Record<string, CadSnapshot>>({});

  // ---- Persistence (J-3): refs gương cho autosaver đọc mà không re-subscribe ----
  const userIdRef = useRef<string | null>(null);
  const sheetsRef = useRef(sheets);
  const activeIdRef = useRef(activeId);
  const saverRef = useRef<SheetsAutosaver | null>(null);
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
    void loadSheets<PersistedCadSheet>(userId, ROUTE, bucketId).then((rec) => {
      if (cancelled) return;
      const valid = rec?.sheets.filter((s) => s.doc && s.viewport).slice(0, MAX_SHEETS) ?? [];
      if (rec && valid.length > 0) {
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
    const saver = createSheetsAutosaver(userId, ROUTE, getRecord, {
      projectId: bucketId, // chốt bucket lúc tạo → nhịp flush cuối luôn về đúng dự án này
      onSaved: (bytes) => console.debug(`[cad-sheets] IDB ghi ${(bytes / 1024).toFixed(1)} KB`),
    });
    saverRef.current = saver;
    // CHỈ nghe lát cắt được persist (doc/viewport/layer) — store còn nhiều state phụ
    // (tool, hover, dynamic-input…) đổi liên tục, nghe tất sẽ ghi IDB vô ích mỗi 1.2s.
    const unsub = useCadStore.subscribe((s, prev) => {
      if (s.doc !== prev.doc || s.viewport !== prev.viewport || s.currentLayer !== prev.currentLayer) {
        saver.touch();
      }
    });
    const flush = () => saver.flush();
    const onHide = () => {
      if (document.visibilityState === 'hidden') saver.flush();
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
    };
  }, [hydrated, bucketId]);

  /** Cấu trúc tab đổi (thêm/xoá/đổi tên/reorder/đổi active) → gương ref + đánh dấu lưu. */
  useEffect(() => {
    sheetsRef.current = sheets;
    activeIdRef.current = activeId;
    if (hydrated) saverRef.current?.touch();
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
      const kept = parsed.sheets.slice(0, MAX_SHEETS);
      const dropped = parsed.sheets.length - kept.length;
      snaps.current = {};
      for (const s of kept) {
        // backfillRoomTypes(): file .idf cũ (trước khi roomType tồn tại) — gán 1 LẦN roomType
        // cho nhãn phòng chưa có field này, để sau đó đổi text label không mất công năng phòng.
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
      saverRef.current?.touch(); // ghi ngay vào IDB, không đợi debounce thao tác kế tiếp
      useCadStore
        .getState()
        .setStatus(
          `Đã mở "${detail.fileName}" — ${kept.length} bản vẽ${dropped > 0 ? ` (bỏ ${dropped} sheet vượt trần ${MAX_SHEETS})` : ''}.`,
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

    window.addEventListener('cad:idf-export-request', onExportIdf);
    window.addEventListener('cad:idf-import-request', onImportIdf);
    window.addEventListener('cad:ifpack-export-request', onExportIfpack);
    window.addEventListener('cad:ifpack-import-request', onRestoreIfpack);
    return () => {
      window.removeEventListener('cad:idf-export-request', onExportIdf);
      window.removeEventListener('cad:idf-import-request', onImportIdf);
      window.removeEventListener('cad:ifpack-export-request', onExportIfpack);
      window.removeEventListener('cad:ifpack-import-request', onRestoreIfpack);
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
    </div>
  );
}
