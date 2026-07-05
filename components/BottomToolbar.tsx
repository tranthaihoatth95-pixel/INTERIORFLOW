'use client';

import { motion } from 'framer-motion';
import { MousePointer2, Hand, StickyNote, Undo2, Redo2, Minus, Plus, Maximize, LayoutGrid, Grid3x3, Command } from 'lucide-react';
import { useReactFlow, useViewport } from '@xyflow/react';
import { useFlowStore } from '@/lib/store';
import { springSheet, easeApple } from '@/lib/motion';
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

  const btnClass = (active = false, disabled = false) =>
    cn(
      'grid h-8 w-8 place-items-center rounded-[10px] transition-colors',
      active ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'text-[var(--t3)] hover:bg-[var(--hover)] hover:text-[var(--t1)]',
      disabled && 'opacity-30 pointer-events-none',
    );

  // Nút icon với micro-press kiểu iOS (không hover-scale để không rung khi rê chuột qua thanh).
  const Btn = ({
    active = false,
    disabled = false,
    title,
    onClick,
    children,
  }: {
    active?: boolean;
    disabled?: boolean;
    title: string;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <motion.button
      whileTap={{ scale: 0.9 }}
      transition={{ duration: 0.12, ease: easeApple }}
      title={title}
      className={btnClass(active, disabled)}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, x: '-50%' }}
      animate={{ opacity: 1, y: 0, x: '-50%' }}
      transition={springSheet}
      className="mat-card no-scrollbar pointer-events-auto absolute bottom-4 left-1/2 z-20 flex max-w-[calc(100vw-1rem)] items-center gap-0.5 overflow-x-auto rounded-[14px] border border-[var(--mat-hairline)] px-1.5 py-1 shadow-xl shadow-black/30 [&>*]:shrink-0"
    >
      <Btn title="Select (V)" active={tool === 'select'} onClick={() => setTool('select')}>
        <MousePointer2 size={15} />
      </Btn>
      <Btn title="Pan (Space giữ / H)" active={tool === 'pan'} onClick={() => setTool('pan')}>
        <Hand size={15} />
      </Btn>
      <Btn title="Sticky note" onClick={onAddNote}>
        <StickyNote size={15} />
      </Btn>
      <div className="mx-1 h-5 w-px bg-[var(--border)]" />
      <Btn title="Undo (⌘Z)" disabled={!canUndo} onClick={undo}>
        <Undo2 size={15} />
      </Btn>
      <Btn title="Redo (⌘⇧Z)" disabled={!canRedo} onClick={redo}>
        <Redo2 size={15} />
      </Btn>
      <div className="mx-1 h-5 w-px bg-[var(--border)]" />
      <Btn title="Zoom out" onClick={() => zoomOut()}>
        <Minus size={15} />
      </Btn>
      <span className="w-11 text-center text-[11px] tabular-nums text-[var(--t3)]">
        {Math.round(zoom * 100)}%
      </span>
      <Btn title="Zoom in" onClick={() => zoomIn()}>
        <Plus size={15} />
      </Btn>
      <Btn title="Fit view" onClick={() => fitView({ padding: 0.2 })}>
        <Maximize size={15} />
      </Btn>
      <div className="mx-1 h-5 w-px bg-[var(--border)]" />
      <Btn title="Tự sắp xếp graph (auto-layout)" onClick={() => autoLayout()}>
        <LayoutGrid size={15} />
      </Btn>
      <Btn title={`Snap lưới: ${snapGrid ? 'đang bật' : 'đang tắt'}`} active={snapGrid} onClick={() => toggleSnap()}>
        <Grid3x3 size={15} />
      </Btn>
      <Btn title="Command palette (⌘K)" onClick={() => setPaletteOpen(true)}>
        <Command size={15} />
      </Btn>
    </motion.div>
  );
}
