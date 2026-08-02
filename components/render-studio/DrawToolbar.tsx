'use client';

/**
 * components/render-studio/DrawToolbar.tsx — G2 phần (3): thanh dọc TRÁI nổi trên canvas Mood+
 * Collab (`docs/SPEC-CHANG2-UI-2MODE.md` §3 "toolbar trái: Bút · Marker · Highlight · Tẩy. Nút
 * to, tối ưu chạm/pen") — KHÁC `LeftRail` (app-level, điều hướng panel) và `BottomToolbar` (zoom/
 * pan/công cụ chung React Flow). Nút ≥34px đúng spec.
 *
 * "chọn/sticky/…/comment" trong spec ĐÃ có lối vào riêng (BottomToolbar/CommentPin) — không lặp
 * lại ở đây, chỉ thêm nút "Chọn" để thoát tool vẽ (xem ghi chú NGOÀI PHẠM VI trong
 * `docs/BAO-CAO-CHINH.md` phần (3)).
 *
 * G4-1a (đêm 04/08, BAO-CAO-DEM mục 2): KHÔNG đứng thường trực nữa — chỉ hiện khi một công cụ
 * vẽ tay đang active (vào bằng nút Bút ở BottomToolbar), thoát bằng nút "Chọn" ngay trong thanh.
 */

import { MousePointer2, Pen, Highlighter, PenTool, Eraser } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFlowStore, type Tool } from '@/lib/store';
import { pressableIcon } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';

const DRAW_TOOLS: { tool: Tool; icon: typeof Pen; label: [string, string] }[] = [
  { tool: 'select', icon: MousePointer2, label: ['Chọn', 'Select'] },
  { tool: 'pen', icon: Pen, label: ['Bút', 'Pen'] },
  { tool: 'marker', icon: PenTool, label: ['Marker', 'Marker'] },
  { tool: 'highlight', icon: Highlighter, label: ['Tô sáng', 'Highlight'] },
  { tool: 'eraser', icon: Eraser, label: ['Tẩy', 'Eraser'] },
];

export default function DrawToolbar() {
  const tool = useFlowStore((s) => s.tool);
  const setTool = useFlowStore((s) => s.setTool);
  const tr = useT();

  const drawing = tool === 'pen' || tool === 'marker' || tool === 'highlight' || tool === 'eraser';
  if (!drawing) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      className="mat-card pointer-events-auto absolute left-3 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-1.5 rounded-full border border-[var(--mat-hairline)] p-2 shadow-[0_8px_24px_rgba(40,38,35,.14)]"
    >
      {DRAW_TOOLS.map(({ tool: t, icon: Icon, label }) => {
        const active = tool === t;
        return (
          <motion.button
            key={t}
            {...pressableIcon}
            whileHover={{ scale: 1.06 }}
            onClick={() => setTool(t)}
            title={tr(label[0], label[1])}
            aria-pressed={active}
            style={{ width: 34, height: 34 }}
            className={cn(
              'grid shrink-0 place-items-center rounded-full transition-colors duration-200 ease-[cubic-bezier(.32,.72,0,1)]',
              active ? 'bg-[var(--accent)] text-white' : 'text-[var(--t3)] hover:bg-[var(--hover)] hover:text-[var(--t1)]',
            )}
          >
            <Icon size={16} strokeWidth={1.75} />
          </motion.button>
        );
      })}
    </motion.div>
  );
}
