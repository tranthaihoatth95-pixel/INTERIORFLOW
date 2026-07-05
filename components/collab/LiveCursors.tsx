'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useViewport } from '@xyflow/react';
import { useCollabStore } from '@/lib/collabStore';

/**
 * LiveCursors — overlay vẽ con trỏ của đồng đội trong FLOW SPACE.
 *
 * Toạ độ nhận được là flow-space (x,y). Ta tự đổi sang screen bằng
 * viewport transform của React Flow: screen = flow * zoom + pan.
 * Nhờ vậy cursor bám đúng khi pan/zoom canvas.
 * pointer-events: none — không bao giờ chặn thao tác chuột.
 */
export function LiveCursors() {
  const others = useCollabStore((s) => s.others);
  const { x: tx, y: ty, zoom } = useViewport();

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      <AnimatePresence>
        {others.map((c) => {
          const sx = c.x * zoom + tx;
          const sy = c.y * zoom + ty;
          return (
            <motion.div
              key={c.userId}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1, x: sx, y: sy }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{
                x: { type: 'spring', stiffness: 700, damping: 42, mass: 0.5 },
                y: { type: 'spring', stiffness: 700, damping: 42, mass: 0.5 },
                opacity: { duration: 0.12 },
                scale: { duration: 0.12 },
              }}
              className="absolute left-0 top-0"
              style={{ willChange: 'transform' }}
            >
              {/* mũi tên con trỏ */}
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.35))' }}
              >
                <path
                  d="M3 2.5 L3 15.2 L6.7 11.7 L9.2 17 L11.3 16 L8.9 10.9 L14 10.6 Z"
                  fill={c.color}
                  stroke="white"
                  strokeWidth="1.1"
                  strokeLinejoin="round"
                />
              </svg>
              {/* pill tên */}
              <div
                className="absolute left-4 top-4 whitespace-nowrap rounded-[8px] px-2 py-0.5 text-[11px] font-medium text-white shadow-sm"
                style={{ background: c.color }}
              >
                {c.name}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
