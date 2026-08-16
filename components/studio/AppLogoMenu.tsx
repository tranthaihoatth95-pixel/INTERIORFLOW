'use client';

/**
 * components/studio/AppLogoMenu.tsx — menu bung từ nút logo góc trái (VIỆC 2,
 * `docs/SPEC-HA-TANG-UI-IF.md` Trụ 1 luật B + `docs/SPEC-CAD-SHELL-V3.md` §2 luật 1: "KHÔNG rail
 * icon. 4 mục xuyên app... gom vào menu từ nút logo góc trái"). Thay `LeftRail` (rail dọc 4 icon)
 * ở `AppShell` — 4 mục: Tổng quan · Dự án & Flow · Files · Thư viện, ĐÚNG 4 mục LeftRail đã có,
 * chỉ đổi CỬA VÀO (icon rail thường trực → menu ẩn/hiện), không đụng logic Dashboard/FlowsPanel
 * (vẫn mount ở AppShell, tự gate `dashboardOpen`/`panel==='flows'` bên trong).
 *
 * Portal + `position:fixed` theo `getBoundingClientRect()` — cùng cơ chế `AccountMenu.tsx` (đã
 * qua K4, thoát "kính lồng kính" khi menu portal ra khỏi header kính).
 */

import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, FolderKanban, FolderOpen, Boxes, Home } from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import { openLibrarySheet } from '@/lib/library/use-library-sheet';
import { useT } from '@/lib/i18n';
import { easeApple } from '@/lib/motion';
import { goHomeConfirmed } from '@/lib/resume';
import type { RefObject } from 'react';

interface AnchorRect {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

interface Props {
  open: boolean;
  anchorRect: AnchorRect | null;
  onDismiss: () => void;
  menuRef: RefObject<HTMLDivElement>;
  /** Chặng đang mở — sheet Thư viện tự lọc kệ theo chặng. */
  stage: 'cad' | 'render' | 'present';
}

export function AppLogoMenu({ open, anchorRect, onDismiss, menuRef, stage }: Props) {
  const setPanel = useFlowStore((s) => s.setPanel);
  const setDashboardOpen = useFlowStore((s) => s.setDashboardOpen);
  const router = useRouter();
  const tr = useT();

  // VIỆC 1 UI (04/08) — mục DUY NHẤT trong menu này thật sự RỜI chặng (4 mục còn lại chỉ mở
  // panel/sheet đè lên, ở nguyên route). Tách riêng khỏi mảng `items` dưới để vẽ có gạch phân
  // cách. Nhãn "Home" (Hoà chốt 13/08 đêm): nhãn cũ (về-Thư-viện-dự-án) trùng ngữ nghĩa với
  // mục "Thư viện" (sheet vật liệu/asset) ngay dưới — trang gốc `/` nay là Home Tổng quan (12/08).
  const goHomeItem = {
    icon: Home,
    label: tr('Home', 'Home'),
    action: () => goHomeConfirmed(router),
  };

  const items = [
    {
      icon: LayoutDashboard,
      label: tr('Tổng quan', 'Overview'),
      action: () => setDashboardOpen(true),
    },
    {
      icon: FolderKanban,
      label: tr('Dự án & Flow', 'Projects & Flows'),
      action: () => setPanel('flows'),
    },
    {
      icon: FolderOpen,
      label: tr('Files', 'Files'),
      action: () => router.push('/files'),
    },
    // 03/08 (Hoà chốt, `a73c658` g4) — MỘT tên "Thư viện", MỘT hành vi (mở sheet), mọi chặng.
    // `NodeLibraryPanel` vẫn vào được qua Command Palette — không mồ côi (grep của G4 xác nhận).
    {
      icon: Boxes,
      label: tr('Thư viện', 'Library'),
      action: () => openLibrarySheet({ stage }),
    },
  ];

  return typeof document === 'undefined'
    ? null
    : createPortal(
        <AnimatePresence>
          {open && anchorRect && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.18, ease: easeApple }}
              style={{ position: 'fixed', ...anchorRect }}
              className="nen-mo-panel z-[80] w-52 rounded-[14px] border border-[var(--border)] p-1.5 shadow-xl"
            >
              <div ref={menuRef} style={{ display: 'contents' }}>
                <button
                  type="button"
                  onClick={() => {
                    goHomeItem.action();
                    onDismiss();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-[12.5px] text-[var(--t2)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--t1)]"
                >
                  <goHomeItem.icon size={15} strokeWidth={1.75} className="shrink-0 text-[var(--t4)]" />
                  {goHomeItem.label}
                </button>
                <div className="mx-2 my-1 h-px bg-[var(--border)]" />
                {items.map((it) => (
                  <button
                    key={it.label}
                    type="button"
                    onClick={() => {
                      it.action();
                      onDismiss();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-[12.5px] text-[var(--t2)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--t1)]"
                  >
                    <it.icon size={15} strokeWidth={1.75} className="shrink-0 text-[var(--t4)]" />
                    {it.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      );
}
