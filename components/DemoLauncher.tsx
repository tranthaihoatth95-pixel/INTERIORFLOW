'use client';

import { motion } from 'framer-motion';
import { DEMO_SEEDS, applyDemoSeed } from '@/lib/demo-seeds';
import { useFlowStore } from '@/lib/store';
import { DEFAULT_PHASE } from '@/lib/phases';
import { staggerList, staggerItem, pressable } from '@/lib/motion';

/**
 * Launcher các flow mẫu one-click cho empty state — LỌC theo chặng đang mở.
 * Concept → 1 demo (concept) · Render → 2 demo (sketch, clay) · Present chạy ở route
 * riêng (/present-editor) nên không hiện trên canvas.
 * Bấm 1 nút → dựng sẵn node + edge + params đã tune lên canvas, chỉ cần Run.
 */
export default function DemoLauncher() {
  const workspace = useFlowStore((s) => s.workspace);
  // Legacy: workspace 'concept' (localStorage cũ) giờ là "Drafting CAD" ở /cad-editor,
  // không còn demo trên canvas → coi như 'render' để vẫn hiện demo hợp lý.
  const phase = (workspace === 'concept' ? 'render' : workspace) ?? DEFAULT_PHASE;
  const demos = DEMO_SEEDS.filter((d) => d.phase === phase);

  // Chặng không có demo trên canvas (vd Present → studio riêng) → gợi ý nhẹ thay vì trống.
  if (demos.length === 0) {
    return (
      <p className="pointer-events-none mt-4 text-[11px] leading-snug text-[var(--t5)]">
        Chặng này chưa có demo dựng sẵn — kéo node từ Node Library để bắt đầu.
      </p>
    );
  }

  return (
    <motion.div
      variants={staggerList}
      initial="hidden"
      animate="visible"
      className="pointer-events-auto mt-4 flex flex-wrap justify-center gap-2"
    >
      {demos.map((demo) => (
        <motion.button
          key={demo.id}
          variants={staggerItem}
          {...pressable}
          type="button"
          data-testid={`demo-${demo.id}`}
          title={demo.desc}
          onClick={() => applyDemoSeed(demo.id)}
          className="group flex max-w-[220px] items-start gap-2 rounded-lg border border-[var(--border)] bg-[var(--field)] px-3 py-2 text-left transition-colors hover:border-[var(--accent-ring)] hover:bg-[var(--hover)]"
        >
          <span className="mt-0.5 text-sm leading-none text-[var(--accent)]">{demo.glyph}</span>
          <span className="min-w-0">
            <span className="block text-xs font-medium text-[var(--t2)]">{demo.label}</span>
            <span className="mt-0.5 block text-[10px] leading-snug text-[var(--t4)]">{demo.desc}</span>
          </span>
        </motion.button>
      ))}
    </motion.div>
  );
}
