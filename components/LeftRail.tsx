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
  Presentation,
  CircleHelp,
} from 'lucide-react';
import { useFlowStore, type Panel } from '@/lib/store';
import { pressableIcon } from '@/lib/motion';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

// label = [vi, en] để dịch nhãn nút qua t()
const ITEMS: { icon: typeof Search; label: [string, string]; panel?: Panel; soon?: boolean }[] = [
  { icon: Search, label: ['Tìm node', 'Search node'], panel: 'search' },
  { icon: History, label: ['Lịch sử / Phiên bản', 'History / Versions'], soon: true },
  { icon: Boxes, label: ['Thư viện Node', 'Node Library'], panel: 'library' },
  { icon: FolderKanban, label: ['Dự án & Flow', 'Projects & Flows'], panel: 'flows' },
  { icon: ImageIcon, label: ['Reference — ảnh / vật liệu', 'Reference — images / materials'], panel: 'assets' },
  { icon: Clapperboard, label: ['Video', 'Video'], soon: true },
  { icon: Box, label: ['3D', '3D'], soon: true },
  { icon: Globe, label: ['Nhập từ web', 'Web import'], soon: true },
  { icon: LayoutGrid, label: ['Thư viện ảnh', 'Gallery'], panel: 'gallery' },
];

export function LeftRail() {
  const panel = useFlowStore((s) => s.panel);
  const setPanel = useFlowStore((s) => s.setPanel);
  const dashboardOpen = useFlowStore((s) => s.dashboardOpen);
  const setDashboardOpen = useFlowStore((s) => s.setDashboardOpen);
  const presentModeOpen = useFlowStore((s) => s.presentModeOpen);
  const setPresentModeOpen = useFlowStore((s) => s.setPresentModeOpen);
  const tr = useT();

  return (
    // material blur — rail hoà vào nền như sidebar macOS
    // data-tour: neo highlight cho SmartTour (B-5) — đổi/xoá thì tour tự fallback card giữa màn
    <nav className="mat-panel z-20 flex w-12 flex-col items-center gap-1 border-r border-[var(--border)] py-2" data-tour="dock">
      {/* Tổng quan — Dashboard project + team (overlay toàn màn) */}
      <motion.button
        {...pressableIcon}
        whileHover={{ scale: 1.06 }}
        title={tr('Tổng quan — Dashboard project & team', 'Overview — project & team dashboard')}
        onClick={() => setDashboardOpen(true)}
        className={cn(
          'group relative grid h-9 w-9 place-items-center rounded-[10px] transition-colors duration-200 ease-[cubic-bezier(.32,.72,0,1)]',
          dashboardOpen
            ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
            : 'text-[var(--t3)] hover:bg-[var(--hover)] hover:text-[var(--t1)]',
        )}
      >
        <LayoutDashboard size={17} strokeWidth={1.75} />
      </motion.button>
      {/* Present mode — trình chiếu deck/board toàn màn */}
      <motion.button
        {...pressableIcon}
        whileHover={{ scale: 1.06 }}
        title={tr('Trình chiếu — Present mode', 'Present mode — full-screen slideshow')}
        onClick={() => setPresentModeOpen(true)}
        className={cn(
          'group relative grid h-9 w-9 place-items-center rounded-[10px] transition-colors duration-200 ease-[cubic-bezier(.32,.72,0,1)]',
          presentModeOpen
            ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
            : 'text-[var(--t3)] hover:bg-[var(--hover)] hover:text-[var(--t1)]',
        )}
      >
        <Presentation size={17} strokeWidth={1.75} />
      </motion.button>
      <div className="my-1 h-px w-5 bg-[var(--border)]" />
      {ITEMS.map(({ icon: Icon, label, panel: p, soon }) => {
        const active = !!p && panel === p;
        const text = tr(label[0], label[1]);
        return (
          <motion.button
            key={label[1]}
            {...pressableIcon}
            whileHover={{ scale: soon ? 1 : 1.06 }}
            title={soon ? tr(`${text} — sắp có (Phase 3–4)`, `${text} — coming soon (Phase 3–4)`) : text}
            onClick={() => p && setPanel(p)}
            className={cn(
              'group relative grid h-9 w-9 place-items-center rounded-[10px] transition-colors duration-200 ease-[cubic-bezier(.32,.72,0,1)]',
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
        title={tr('Trợ giúp', 'Help')}
        className="grid h-9 w-9 place-items-center rounded-[10px] text-[var(--t4)] transition-colors duration-200 ease-[cubic-bezier(.32,.72,0,1)] hover:bg-[var(--hover)] hover:text-[var(--t2)]"
      >
        <CircleHelp size={17} strokeWidth={1.75} />
      </motion.button>
    </nav>
  );
}
