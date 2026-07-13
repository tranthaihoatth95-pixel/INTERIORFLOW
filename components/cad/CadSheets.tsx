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

/** Snapshot dựng lại từ bản ghi IDB — undo-history + selection bắt đầu mới. */
function snapshotFromPersisted(p: PersistedCadSheet): CadSnapshot {
  return {
    doc: p.doc,
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
  const [hydrated, setHydrated] = useState(false);

  /** KHÔI PHỤC 1 lần lúc mount: IDB → bộ sheet + sheet active (ưu tiên resume.sheetId). */
  useEffect(() => {
    const userId = getLastUserId();
    userIdRef.current = userId;
    if (!userId) {
      setHydrated(true); // chưa đăng nhập → thuần in-memory (y bản cũ)
      return;
    }
    let cancelled = false;
    void loadSheets<PersistedCadSheet>(userId, ROUTE).then((rec) => {
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
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

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
  }, [hydrated]);

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
