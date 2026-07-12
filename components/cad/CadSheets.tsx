'use client';

/**
 * components/cad/CadSheets.tsx — Tầng MULTI-SHEET (phụ-thêm) cho chặng CAD.
 *
 * `useCadStore` là singleton toàn cục → không thể mount nhiều CadEditor cô lập. Giải pháp:
 * giữ ĐÚNG 1 CadEditor mounted, mỗi lần đổi tab thì HOÁN nội dung store (doc + undo + viewport
 * + layer + selection). Snapshot mỗi sheet giữ trong ref (không gây re-render).
 *
 * 1 sheet ⇒ hành vi y hệt bản cũ (export PNG/DXF, "Đưa sang Render" đều đọc active doc).
 * Kéo-gộp single-window = pha 2 (docs/MULTI-SHEET-PROPOSAL.md §6).
 */

import { useRef, useState } from 'react';
import CadEditor from './CadEditor';
import SheetTabBar, { type SheetTab } from '@/components/studio/SheetTabBar';
import { useCadStore } from '@/lib/cad/store';
import type { Doc, Viewport } from '@/lib/cad/model';
import { emptyDoc } from '@/lib/cad/model';

const MAX_SHEETS = 5;
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

let seq = 1;
const nextId = () => `cadsheet-${seq++}`;

export default function CadSheets() {
  // Sheet 1 = trạng thái store hiện có (giữ nguyên bản demo/blank đang mở).
  const [sheets, setSheets] = useState<SheetTab[]>([{ id: 'cadsheet-0', name: 'Bản vẽ 1' }]);
  const [activeId, setActiveId] = useState('cadsheet-0');
  // Snapshot nội dung từng sheet (ref → không render thừa). Sheet đang mở = store thật.
  const snaps = useRef<Record<string, CadSnapshot>>({});

  const switchTo = (id: string) => {
    if (id === activeId) return;
    snaps.current[activeId] = captureStore();
    const target = snaps.current[id] ?? blankSnapshot();
    useCadStore.setState({
      doc: target.doc,
      past: target.past,
      future: target.future,
      viewport: target.viewport,
      currentLayer: target.currentLayer,
      selection: target.selection,
    });
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
    useCadStore.setState({
      doc: snap.doc,
      past: snap.past,
      future: snap.future,
      viewport: snap.viewport,
      currentLayer: snap.currentLayer,
      selection: snap.selection,
    });
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
      useCadStore.setState({
        doc: target.doc,
        past: target.past,
        future: target.future,
        viewport: target.viewport,
        currentLayer: target.currentLayer,
        selection: target.selection,
      });
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
