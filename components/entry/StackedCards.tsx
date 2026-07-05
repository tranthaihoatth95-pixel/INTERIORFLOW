'use client';

import { type ReactNode } from 'react';
import { motion, type Variants } from 'framer-motion';
import { springSheet, springPop } from '@/lib/motion';

/**
 * StackedCards — tài liệu thiết kế xếp layer chồng lên nhau (như 1 tập/folder).
 * - Mặc định: xếp chồng, lệch nhẹ + xoay tí như chồng giấy.
 * - Rê chuột vào: XÒE BUNG ra hình quạt (spread + rotate) như tập ảnh trải ra.
 * - Đưa chuột ra: tự động xếp lại vào chồng.
 * Dùng framer-motion: parent whileHover="fan" tự truyền variant xuống các card con.
 */

function makeVariants(total: number): Variants {
  const mid = (total - 1) / 2;
  return {
    // xếp chồng — nhích lên nhẹ + xoay tí tạo cảm giác "tập giấy"
    stacked: (i: number) => ({
      x: (i - mid) * 4,
      y: i * -7,
      rotate: (i - mid) * 1.6,
      scale: 1 - i * 0.035,
      transition: springSheet,
    }),
    // xòe bung — trải quạt sang hai bên, cạnh vểnh lên như lá bài
    fan: (i: number) => ({
      x: (i - mid) * 96,
      y: -Math.abs(i - mid) * 14,
      rotate: (i - mid) * 9,
      scale: 1,
      transition: springPop,
    }),
  };
}

export function StackedCards({
  faces,
  className,
  onSelect,
  selected = false,
}: {
  faces: ReactNode[];
  className?: string;
  onSelect?: () => void;
  selected?: boolean;
}) {
  const variants = makeVariants(faces.length);

  return (
    <motion.div
      className={className}
      initial="stacked"
      animate="stacked"
      whileHover="fan"
      onClick={onSelect}
      style={{ perspective: 1000 }}
    >
      {/* vùng chứa — card con absolute, xếp chồng ở giữa */}
      <div className="relative grid h-full w-full place-items-center">
        {faces.map((face, i) => (
          <motion.div
            key={i}
            custom={i}
            variants={variants}
            className="absolute"
            style={{ zIndex: i }}
          >
            <div
              className="overflow-hidden rounded-[var(--radius-md)] ring-1 ring-[var(--mat-hairline)]"
              style={{ boxShadow: 'var(--shadow-pop)' }}
            >
              {face}
            </div>
          </motion.div>
        ))}
      </div>

      {/* vòng chọn khi selected — đồng ấm */}
      {selected && (
        <motion.div
          layoutId="ws-select-ring"
          className="pointer-events-none absolute -inset-3 rounded-[var(--radius-xl)]"
          style={{ boxShadow: 'inset 0 0 0 2px #c79a63' }}
          transition={springPop}
        />
      )}
    </motion.div>
  );
}
