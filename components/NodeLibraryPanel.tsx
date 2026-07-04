'use client';

import { useMemo, useState } from 'react';
import { X, GripVertical } from 'lucide-react';
import { NODE_DEFINITIONS } from '@/lib/nodes/registry';
import { useFlowStore } from '@/lib/store';
import { CATEGORY_META, type NodeCategory } from '@/lib/types';

export const DND_MIME = 'application/interiorflow-node';

const CATEGORY_ORDER: NodeCategory[] = ['INPUT', 'AI_GENERATE', 'AI_EDIT', 'SLIDE', 'UTILITY', 'OUTPUT'];

export function NodeLibraryPanel() {
  const panel = useFlowStore((s) => s.panel);
  const setPanel = useFlowStore((s) => s.setPanel);
  const [query, setQuery] = useState('');

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = NODE_DEFINITIONS.filter(
      (d) =>
        !q ||
        d.title.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.type.includes(q),
    );
    return CATEGORY_ORDER.map((cat) => ({
      cat,
      defs: filtered.filter((d) => d.category === cat),
    })).filter((g) => g.defs.length > 0);
  }, [query]);

  if (panel !== 'library' && panel !== 'search') return null;

  return (
    <aside className="absolute inset-y-0 left-12 right-0 z-40 flex flex-col border-r border-[var(--border)] bg-[var(--panel)] shadow-2xl md:static md:z-20 md:w-64 md:shadow-none">
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-2.5">
        <span className="flex-1 text-xs font-semibold uppercase tracking-wider text-[var(--t3)]">
          Node Library
        </span>
        <button
          onClick={() => setPanel(null)}
          className="grid h-6 w-6 place-items-center rounded-md text-[var(--t4)] hover:bg-[var(--hover)] hover:text-[var(--t2)]"
        >
          <X size={13} />
        </button>
      </div>

      <div className="p-2.5">
        <input
          autoFocus={panel === 'search'}
          className="w-full rounded-md border border-[var(--border)] bg-[var(--field)] px-2.5 py-1.5 text-xs text-[var(--t1)] placeholder-[var(--t5)] outline-none focus:border-violet-500/60"
          placeholder="Tìm node…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-2.5 pb-4">
        {groups.map(({ cat, defs }) => (
          <div key={cat}>
            <p className="mb-1.5 flex items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--t4)]">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: CATEGORY_META[cat].color }} />
              {CATEGORY_META[cat].label}
            </p>
            <div className="space-y-1">
              {defs.map((def) => (
                <div
                  key={def.type}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData(DND_MIME, def.type);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  className="group flex cursor-grab items-start gap-2 rounded-lg border border-[var(--border)] bg-[var(--field)] px-2.5 py-2 transition hover:border-violet-500/40 hover:bg-[var(--field)] active:cursor-grabbing"
                  title="Kéo thả vào canvas"
                >
                  <GripVertical size={13} className="mt-0.5 shrink-0 text-[var(--t5)] group-hover:text-[var(--t4)]" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[var(--t1)]">{def.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-[var(--t4)]">
                      {def.description}
                    </p>
                  </div>
                  {def.creditCost > 0 && (
                    <span className="ml-auto shrink-0 rounded bg-[var(--hover)] px-1 py-0.5 text-[9px] text-[var(--t4)]">
                      {def.creditCost}cr
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        {groups.length === 0 && (
          <p className="px-1 pt-4 text-center text-xs text-[var(--t5)]">Không tìm thấy node nào.</p>
        )}
        <p className="px-1 pt-2 text-[10px] leading-relaxed text-[var(--t5)]">
          Đủ bộ 20 node nội thất — kéo thả vào canvas để dùng.
        </p>
      </div>
    </aside>
  );
}
