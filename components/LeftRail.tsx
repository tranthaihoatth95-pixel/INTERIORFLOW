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
import Tooltip from '@/components/ui/Tooltip';

/**
 * REF-VISUAL #9 (`docs/REF-VISUAL-2026-08-02.md`) — "rail dọc = CAPSULE đúng §2d · item active =
 * bubble tròn phóng to · bản sáng/tối song song". Nâng cấp từ cột icon vuông cũ (`rounded-[10px]`,
 * chỉ báo active = thanh dọc mảnh) sang: (1) rail NỔI tách khỏi mép trái (margin, KHÔNG còn
 * `border-r` sát cạnh) + bo `rounded-full` toàn khối (capsule đúng nghĩa — cao suốt viewport
 * NHƯNG hai đầu bo tròn hết cỡ theo bề rộng, không phải bo góc vuông); (2) mỗi nút = TRÒN
 * (`rounded-full`) thay vì bo góc vuông cũ; (3) active = bubble phóng to (scale + nền đặc accent,
 * không còn thanh chỉ báo cạnh) — đúng thang shape §2d "nút bo góc → bar/pill capsule → núm TRÒN".
 */
const RAIL_ITEM_SIZE = 38;
const RAIL_ACTIVE_SIZE = 42;

/** Rút gọn nhãn dài (bỏ mô tả sau " — ") thành nhãn ngắn cho tag hover — cùng quy ước với
 * shortLabel() trong CadToolbar.tsx / present-editor/Toolbar.tsx (dùng chung 1 mẫu). */
function shortLabel(text: string): string {
  return text.split(' — ')[0].trim();
}

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
    // REF-VISUAL #9 — rail NỔI (my-3 ml-3, tách khỏi mép trái+trên+dưới) + rounded-full toàn khối
    // (bo hết cỡ theo bề rộng w-12 ⇒ 2 đầu bán nguyệt = đúng nghĩa "capsule dọc"). MỘT bóng duy
    // nhất (§2c luật 1) — cùng giá trị shadow đã dùng cho BottomToolbar/ModeSwitchBar, nhất quán
    // 1 họ capsule xuyên app.
    <nav
      className="mat-panel if-rail-touch-scroll z-20 my-3 ml-3 flex w-12 flex-col items-center gap-1.5 rounded-full border border-[var(--mat-hairline)] py-3 shadow-[0_8px_24px_rgba(40,38,35,.14)]"
      data-tour="dock"
    >
      {/* Tổng quan — Dashboard project + team (overlay toàn màn) */}
      <Tooltip label={shortLabel(tr('Tổng quan — Dashboard project & team', 'Overview — project & team dashboard'))} side="bottom">
        <motion.button
          {...pressableIcon}
          whileHover={{ scale: 1.06 }}
          aria-label={tr('Tổng quan — Dashboard project & team', 'Overview — project & team dashboard')}
          onClick={() => setDashboardOpen(true)}
          style={dashboardOpen ? { width: RAIL_ACTIVE_SIZE, height: RAIL_ACTIVE_SIZE } : { width: RAIL_ITEM_SIZE, height: RAIL_ITEM_SIZE }}
          className={cn(
            'grid shrink-0 place-items-center rounded-full transition-[background-color,color,width,height] duration-200 ease-[cubic-bezier(.32,.72,0,1)]',
            dashboardOpen ? 'bg-[var(--accent)] text-white' : 'text-[var(--t3)] hover:bg-[var(--hover)] hover:text-[var(--t1)]',
          )}
        >
          <LayoutDashboard size={17} strokeWidth={1.75} />
        </motion.button>
      </Tooltip>
      {/* Present mode — trình chiếu deck/board toàn màn */}
      <Tooltip label={shortLabel(tr('Trình chiếu — Present mode', 'Present mode — full-screen slideshow'))} side="bottom">
        <motion.button
          {...pressableIcon}
          whileHover={{ scale: 1.06 }}
          aria-label={tr('Trình chiếu — Present mode', 'Present mode — full-screen slideshow')}
          onClick={() => setPresentModeOpen(true)}
          style={presentModeOpen ? { width: RAIL_ACTIVE_SIZE, height: RAIL_ACTIVE_SIZE } : { width: RAIL_ITEM_SIZE, height: RAIL_ITEM_SIZE }}
          className={cn(
            'grid shrink-0 place-items-center rounded-full transition-[background-color,color,width,height] duration-200 ease-[cubic-bezier(.32,.72,0,1)]',
            presentModeOpen ? 'bg-[var(--accent)] text-white' : 'text-[var(--t3)] hover:bg-[var(--hover)] hover:text-[var(--t1)]',
          )}
        >
          <Presentation size={17} strokeWidth={1.75} />
        </motion.button>
      </Tooltip>
      <div className="my-1 h-px w-5 bg-[var(--border)]" />
      {ITEMS.map(({ icon: Icon, label, panel: p, soon }) => {
        const active = !!p && panel === p;
        const text = tr(label[0], label[1]);
        const fullLabel = soon ? tr(`${text} — sắp có (Phase 3–4)`, `${text} — coming soon (Phase 3–4)`) : text;
        // Tag hover vẫn giữ gợi ý "sắp có" (mất thông tin này nếu chỉ shortLabel() thẳng
        // fullLabel — split " — " sẽ cắt luôn phần "sắp có"). Nhãn tĩnh cảm ứng thì bỏ hẳn cho
        // gọn (màu chữ mờ [--t5] đã tự nói lên trạng thái "chưa dùng được").
        const hoverLabel = soon ? tr(`${shortLabel(text)} — sắp có`, `${shortLabel(text)} — coming soon`) : shortLabel(text);
        return (
          <Tooltip key={label[1]} label={hoverLabel} touchLabel={shortLabel(text)}>
            <motion.button
              {...pressableIcon}
              whileHover={{ scale: soon ? 1 : 1.06 }}
              aria-label={fullLabel}
              onClick={() => p && setPanel(p)}
              style={active ? { width: RAIL_ACTIVE_SIZE, height: RAIL_ACTIVE_SIZE } : { width: RAIL_ITEM_SIZE, height: RAIL_ITEM_SIZE }}
              className={cn(
                'shrink-0 grid place-items-center rounded-full transition-[background-color,color,width,height] duration-200 ease-[cubic-bezier(.32,.72,0,1)]',
                active
                  ? 'bg-[var(--accent)] text-white'
                  : soon
                    ? 'text-[var(--t5)] hover:text-[var(--t4)]'
                    : 'text-[var(--t3)] hover:bg-[var(--hover)] hover:text-[var(--t1)]',
              )}
            >
              <Icon size={17} strokeWidth={1.75} />
            </motion.button>
          </Tooltip>
        );
      })}
      <div className="flex-1" />
      <Tooltip label={tr('Trợ giúp', 'Help')}>
        <motion.button
          {...pressableIcon}
          whileHover={{ scale: 1.06 }}
          aria-label={tr('Trợ giúp', 'Help')}
          style={{ width: RAIL_ITEM_SIZE, height: RAIL_ITEM_SIZE }}
          className="grid shrink-0 place-items-center rounded-full text-[var(--t4)] transition-colors duration-200 ease-[cubic-bezier(.32,.72,0,1)] hover:bg-[var(--hover)] hover:text-[var(--t2)]"
        >
          <CircleHelp size={17} strokeWidth={1.75} />
        </motion.button>
      </Tooltip>
    </nav>
  );
}
