'use client';

import { motion } from 'framer-motion';
import { Brush, Eraser, Minus, Square, Circle, Undo2, Redo2, Trash2 } from 'lucide-react';
import { pressable, pressableIcon } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { SKETCH_PALETTE } from '@/lib/sketch/palette';
import type { SketchTool } from '@/components/sketch/SketchCanvas';

const TOOLS: { id: SketchTool; label: string; icon: typeof Brush }[] = [
  { id: 'brush', label: 'Bút vẽ', icon: Brush },
  { id: 'eraser', label: 'Tẩy', icon: Eraser },
  { id: 'line', label: 'Đường thẳng', icon: Minus },
  { id: 'rect', label: 'Chữ nhật', icon: Square },
  { id: 'ellipse', label: 'Hình tròn / oval', icon: Circle },
];

export function SketchToolbar({
  tool,
  onToolChange,
  color,
  onColorChange,
  thickness,
  onThicknessChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
}: {
  tool: SketchTool;
  onToolChange: (t: SketchTool) => void;
  color: string;
  onColorChange: (c: string) => void;
  thickness: number;
  onThicknessChange: (n: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-[var(--border)] px-4 py-3">
      <div className="flex items-center gap-1">
        {TOOLS.map(({ id, label, icon: Icon }) => (
          <motion.button
            key={id}
            {...pressable}
            title={label}
            onClick={() => onToolChange(id)}
            className={cn(
              'flex items-center gap-1.5 rounded-[10px] border px-2.5 py-1.5 text-xs transition-colors',
              tool === id
                ? 'border-[var(--accent-ring)] bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'border-[var(--border)] text-[var(--t3)] hover:bg-[var(--hover)]',
            )}
          >
            <Icon size={13} />
          </motion.button>
        ))}
      </div>

      <div className="flex items-center gap-1">
        {SKETCH_PALETTE.map((s) => (
          <motion.button
            key={s.hex}
            {...pressableIcon}
            title={s.label}
            onClick={() => onColorChange(s.hex)}
            className={cn(
              'h-5 w-5 rounded-full border-2',
              color.toLowerCase() === s.hex.toLowerCase() ? 'border-[var(--t1)]' : 'border-transparent',
            )}
            style={{ background: s.hex }}
          />
        ))}
        <label
          className="ml-1 grid h-5 w-5 cursor-pointer place-items-center overflow-hidden rounded-full border border-[var(--border)]"
          title="Chọn màu khác"
        >
          <input
            type="color"
            value={color}
            onChange={(e) => onColorChange(e.target.value)}
            className="h-8 w-8 -translate-x-0.5 -translate-y-0.5 cursor-pointer border-0 bg-transparent p-0"
          />
        </label>
      </div>

      <label className="flex items-center gap-2 text-xs text-[var(--t3)]">
        Nét
        <input
          type="range"
          min={1}
          max={60}
          value={thickness}
          onChange={(e) => onThicknessChange(Number(e.target.value))}
          className="w-24 accent-[var(--accent)]"
        />
        <span className="w-6 tabular-nums">{thickness}</span>
      </label>

      <div className="flex items-center gap-1">
        <motion.button
          {...pressableIcon}
          title="Undo"
          disabled={!canUndo}
          onClick={onUndo}
          className="grid h-7 w-7 place-items-center rounded-[10px] text-[var(--t3)] transition-colors hover:bg-[var(--hover)] disabled:opacity-30"
        >
          <Undo2 size={14} />
        </motion.button>
        <motion.button
          {...pressableIcon}
          title="Redo"
          disabled={!canRedo}
          onClick={onRedo}
          className="grid h-7 w-7 place-items-center rounded-[10px] text-[var(--t3)] transition-colors hover:bg-[var(--hover)] disabled:opacity-30"
        >
          <Redo2 size={14} />
        </motion.button>
        <motion.button
          {...pressable}
          onClick={onClear}
          className="flex items-center gap-1.5 rounded-[10px] border border-[var(--border)] px-2.5 py-1.5 text-xs text-[var(--t3)] transition-colors hover:bg-[var(--hover)]"
        >
          <Trash2 size={13} /> Xoá hết
        </motion.button>
      </div>
    </div>
  );
}
