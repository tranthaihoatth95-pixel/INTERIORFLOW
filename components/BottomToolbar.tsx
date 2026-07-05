'use client';

import { MousePointer2, Hand, StickyNote, Undo2, Redo2, Minus, Plus, Maximize, LayoutGrid, Grid3x3, Command } from 'lucide-react';
import { useReactFlow, useViewport } from '@xyflow/react';
import { useFlowStore } from '@/lib/store';
import { cn } from '@/lib/utils';

export function BottomToolbar({ onAddNote }: { onAddNote: () => void }) {
  const tool = useFlowStore((s) => s.tool);
  const setTool = useFlowStore((s) => s.setTool);
  const undo = useFlowStore((s) => s.undo);
  const redo = useFlowStore((s) => s.redo);
  const canUndo = useFlowStore((s) => s.past.length > 0);
  const canRedo = useFlowStore((s) => s.future.length > 0);
  const snapGrid = useFlowStore((s) => s.snapGrid);
  const toggleSnap = useFlowStore((s) => s.toggleSnap);
  const autoLayout = useFlowStore((s) => s.autoLayout);
  const setPaletteOpen = useFlowStore((s) => s.setPaletteOpen);
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const { zoom } = useViewport();

  const btn = (active = false, disabled = false) =>
    cn(
      'grid h-8 w-8 place-items-center rounded-lg transition',
      active ? 'bg-violet-500/15 text-violet-300' : 'text-[var(--t3)] hover:bg-[var(--hover)] hover:text-[var(--t1)]',
      disabled && 'opacity-30 pointer-events-none',
    );

  return (
    <div className="no-scrollbar pointer-events-auto absolute bottom-4 left-1/2 z-20 flex max-w-[calc(100vw-1rem)] -translate-x-1/2 items-center gap-0.5 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--card)] px-1.5 py-1 shadow-xl shadow-black/40 backdrop-blur [&>*]:shrink-0">
      <button title="Select (V)" className={btn(tool === 'select')} onClick={() => setTool('select')}>
        <MousePointer2 size={15} />
      </button>
      <button title="Pan (Space giữ / H)" className={btn(tool === 'pan')} onClick={() => setTool('pan')}>
        <Hand size={15} />
      </button>
      <button title="Sticky note" className={btn()} onClick={onAddNote}>
        <StickyNote size={15} />
      </button>
      <div className="mx-1 h-5 w-px bg-[var(--hover)]" />
      <button title="Undo (⌘Z)" className={btn(false, !canUndo)} onClick={undo}>
        <Undo2 size={15} />
      </button>
      <button title="Redo (⌘⇧Z)" className={btn(false, !canRedo)} onClick={redo}>
        <Redo2 size={15} />
      </button>
      <div className="mx-1 h-5 w-px bg-[var(--hover)]" />
      <button title="Zoom out" className={btn()} onClick={() => zoomOut()}>
        <Minus size={15} />
      </button>
      <span className="w-11 text-center text-[11px] tabular-nums text-[var(--t3)]">
        {Math.round(zoom * 100)}%
      </span>
      <button title="Zoom in" className={btn()} onClick={() => zoomIn()}>
        <Plus size={15} />
      </button>
      <button title="Fit view" className={btn()} onClick={() => fitView({ padding: 0.2 })}>
        <Maximize size={15} />
      </button>
      <div className="mx-1 h-5 w-px bg-[var(--hover)]" />
      <button title="Tự sắp xếp graph (auto-layout)" className={btn()} onClick={() => autoLayout()}>
        <LayoutGrid size={15} />
      </button>
      <button
        title={`Snap lưới: ${snapGrid ? 'đang bật' : 'đang tắt'}`}
        className={btn(snapGrid)}
        onClick={() => toggleSnap()}
      >
        <Grid3x3 size={15} />
      </button>
      <button title="Command palette (⌘K)" className={btn()} onClick={() => setPaletteOpen(true)}>
        <Command size={15} />
      </button>
    </div>
  );
}
