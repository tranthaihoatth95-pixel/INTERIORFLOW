'use client';

import {
  Search,
  History,
  Boxes,
  FolderKanban,
  Image as ImageIcon,
  Clapperboard,
  Box,
  Globe,
  LayoutGrid,
  CircleHelp,
} from 'lucide-react';
import { useFlowStore, type Panel } from '@/lib/store';
import { cn } from '@/lib/utils';

const ITEMS: { icon: typeof Search; label: string; panel?: Panel; soon?: boolean }[] = [
  { icon: Search, label: 'Search node', panel: 'search' },
  { icon: History, label: 'History / Versions', soon: true },
  { icon: Boxes, label: 'Node Library', panel: 'library' },
  { icon: FolderKanban, label: 'Projects & Flows', panel: 'flows' },
  { icon: ImageIcon, label: 'Thư viện ảnh / vật liệu', panel: 'assets' },
  { icon: Clapperboard, label: 'Video', soon: true },
  { icon: Box, label: '3D', soon: true },
  { icon: Globe, label: 'Web import', soon: true },
  { icon: LayoutGrid, label: 'Gallery', panel: 'gallery' },
];

export function LeftRail() {
  const panel = useFlowStore((s) => s.panel);
  const setPanel = useFlowStore((s) => s.setPanel);

  return (
    <nav className="relative z-40 flex w-12 shrink-0 flex-col items-center gap-1 border-r border-[var(--border)] bg-[var(--panel)] py-2 md:z-20">
      {ITEMS.map(({ icon: Icon, label, panel: p, soon }) => (
        <button
          key={label}
          title={soon ? `${label} — sắp có (Phase 3–4)` : label}
          onClick={() => p && setPanel(p)}
          className={cn(
            'group relative grid h-9 w-9 place-items-center rounded-lg transition',
            p && panel === p
              ? 'bg-violet-500/15 text-violet-300'
              : soon
                ? 'text-[var(--t5)] hover:text-[var(--t4)]'
                : 'text-[var(--t3)] hover:bg-[var(--hover)] hover:text-[var(--t1)]',
          )}
        >
          <Icon size={17} strokeWidth={1.75} />
        </button>
      ))}
      <div className="flex-1" />
      <button
        title="Help"
        className="grid h-9 w-9 place-items-center rounded-lg text-[var(--t4)] transition hover:bg-[var(--hover)] hover:text-[var(--t2)]"
      >
        <CircleHelp size={17} strokeWidth={1.75} />
      </button>
    </nav>
  );
}
