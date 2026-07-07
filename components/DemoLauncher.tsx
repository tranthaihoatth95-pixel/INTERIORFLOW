'use client';

import { DEMO_SEEDS, applyDemoSeed } from '@/lib/demo-seeds';

/**
 * Launcher 3 flow mẫu one-click cho empty state.
 * Bấm 1 nút → dựng sẵn node + edge + params đã tune lên canvas, chỉ cần Run.
 */
export default function DemoLauncher() {
  return (
    <div className="pointer-events-auto mt-4 flex flex-wrap justify-center gap-2">
      {DEMO_SEEDS.map((demo) => (
        <button
          key={demo.id}
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
        </button>
      ))}
    </div>
  );
}
