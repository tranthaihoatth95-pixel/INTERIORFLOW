'use client';

import { motion } from 'framer-motion';
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
  LayoutDashboard,
  CircleHelp,
} from 'lucide-react';
import { useFlowStore, type Panel } from '@/lib/store';
import { pressableIcon } from '@/lib/motion';
import { cn } from '@/lib/utils';

const ITEMS: { icon: typeof Search; label: string; panel?: Panel; soon?: boolean }[] = [
  { icon: Search, label: 'Search node', panel: 'search' },
  { icon: History, label: 'History / Versions', soon: true },
  { icon: Boxes, label: 'Node Library', panel: 'library' },
  { icon: FolderKanban, label: 'Projects & Flows', panel: 'flows' },
  { icon: ImageIcon, label: 'Reference — ảnh / vật liệu', panel: 'assets' },
  { icon: Clapperboard, label: 'Video', soon: true },
  { icon: Box, label: '3D', soon: true },
  { icon: Globe, label: 'Web import', soon: true },
  { icon: LayoutGrid, label: 'Gallery', panel: 'gallery' },
];

export function LeftRail() {
  const panel = useFlowStore((s) => s.panel);
  const setPanel = useFlowStore((s) => s.setPanel);
  const dashboardOpen = useFlowStore((s) => s.dashboardOpen);
  const setDashboardOpen = useFlowStore((s) => s.setDashboardOpen);

  return (
    // material blur — rail hoà vào nền như sidebar macOS
    <nav className="mat-panel z-20 flex w-12 flex-col items-center gap-1 border-r border-[var(--border)] py-2">
      {/* Tổng quan — Dashboard project + team (overlay toàn màn) */}
      <motion.button
        {...pressableIcon}
        whileHover={{ scale: 1.06 }}
        title="Tổng quan — Dashboard project & team"
        onClick={() => setDashboardOpen(true)}
        className={cn(
          'group relative grid h-9 w-9 place-items-center rounded-[10px] transition-colors',
          dashboardOpen
            ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
            : 'text-[var(--t3)] hover:bg-[var(--hover)] hover:text-[var(--t1)]',
        )}
      >
        <LayoutDashboard size={17} strokeWidth={1.75} />
      </motion.button>
      <div className="my-1 h-px w-5 bg-[var(--border)]" />
      {ITEMS.map(({ icon: Icon, label, panel: p, soon }) => {
        const active = !!p && panel === p;
        return (
          <motion.button
            key={label}
            {...pressableIcon}
            whileHover={{ scale: soon ? 1 : 1.06 }}
            title={soon ? `${label} — sắp có (Phase 3–4)` : label}
            onClick={() => p && setPanel(p)}
            className={cn(
              'group relative grid h-9 w-9 place-items-center rounded-[10px] transition-colors',
              active
                ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                : soon
                  ? 'text-[var(--t5)] hover:text-[var(--t4)]'
                  : 'text-[var(--t3)] hover:bg-[var(--hover)] hover:text-[var(--t1)]',
            )}
          >
            {/* chỉ báo panel đang mở — thanh dọc kiểu iOS/macOS, trượt mượt giữa item */}
            {active && (
              <motion.span
                layoutId="rail-active"
                className="absolute -left-2 h-5 w-1 rounded-full bg-[var(--accent)]"
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              />
            )}
            <Icon size={17} strokeWidth={1.75} />
          </motion.button>
        );
      })}
      <div className="flex-1" />
      <motion.button
        {...pressableIcon}
        whileHover={{ scale: 1.06 }}
        title="Help"
        className="grid h-9 w-9 place-items-center rounded-[10px] text-[var(--t4)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--t2)]"
      >
        <CircleHelp size={17} strokeWidth={1.75} />
      </motion.button>
    </nav>
  );
}
