'use client';

/**
 * components/AccountMenu.tsx — nội dung menu tài khoản DÙNG CHUNG (tách từ `UserChip` trong
 * `AppChrome.tsx` khi rail trái cũng cần mở menu này — xem `LeftRail.tsx`). Chỉ tách PHẦN NỘI
 * DUNG (5 mục: Hồ sơ · Đổi avatar · Giao diện · Đăng xuất · Trợ giúp) + khung portal/motion —
 * KHÔNG tách phần tính `anchorRect` (mỗi nơi gọi neo theo hướng khác nhau: `UserChip` neo
 * top-right theo nút góc trên phải, `LeftRail` neo bottom-left theo avatar cuối rail — để mỗi
 * nơi tự tính, tránh ép 1 hook làm 2 việc khác hướng).
 *
 * Giữ NGUYÊN cơ chế portal + `position:fixed` theo `getBoundingClientRect()` đã sửa ở K4
 * (`docs/TICKET-FIX-KINH-HEADER-2026-08-02.md` — thoát "kính lồng kính").
 */

import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, User, Palette, CircleHelp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { RefObject } from 'react';
import { useFlowStore } from '@/lib/store';
import { nextThemePref, themeIconFor, themeLabelVi } from '@/lib/theme-toggle';
import { easeApple } from '@/lib/motion';
import { useT } from '@/lib/i18n';

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
}

export function AccountMenu({ open, anchorRect, onDismiss, menuRef }: Props) {
  const user = useFlowStore((s) => s.user);
  const setUser = useFlowStore((s) => s.setUser);
  const themePref = useFlowStore((s) => s.themePref);
  const setThemePref = useFlowStore((s) => s.setThemePref);
  const router = useRouter();
  const tr = useT();
  if (!user) return null;
  const ThemeIcon = themeIconFor(themePref);

  const go = (href: string) => {
    onDismiss();
    router.push(href);
  };

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
              className="mat-panel z-[80] w-52 rounded-[14px] border border-[var(--border)] p-2 shadow-xl"
            >
              <div ref={menuRef} style={{ display: 'contents' }}>
                <div className="truncate px-2 py-1.5 text-xs text-[var(--t3)]" title={`${user.name} · ${user.email}`}>
                  {user.name}
                </div>
                <button
                  type="button"
                  onClick={() => go('/settings')}
                  className="flex w-full items-center gap-2 rounded-[10px] px-2 py-1.5 text-[11.5px] text-[var(--t2)] transition-colors hover:bg-[var(--hover)]"
                >
                  <User size={13} className="shrink-0 text-[var(--t4)]" />
                  {tr('Hồ sơ', 'Profile')}
                </button>
                <button
                  type="button"
                  onClick={() => go('/settings/avatar')}
                  className="flex w-full items-center gap-2 rounded-[10px] px-2 py-1.5 text-[11.5px] text-[var(--t2)] transition-colors hover:bg-[var(--hover)]"
                >
                  <Palette size={13} className="shrink-0 text-[var(--t4)]" />
                  {tr('Đổi avatar', 'Change avatar')}
                </button>
                <button
                  type="button"
                  onClick={() => setThemePref(nextThemePref(themePref))}
                  className="flex w-full items-center gap-2 rounded-[10px] px-2 py-1.5 text-[11.5px] text-[var(--t2)] transition-colors hover:bg-[var(--hover)]"
                  title={tr('Bấm để đổi', 'Click to switch')}
                >
                  <ThemeIcon size={13} className="shrink-0 text-[var(--t4)]" />
                  {tr('Giao diện', 'Appearance')}
                  <span className="ml-auto text-[10px] text-[var(--t4)]">{themeLabelVi(themePref)}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDismiss();
                    window.dispatchEvent(new CustomEvent('shortcuts:open'));
                  }}
                  className="flex w-full items-center gap-2 rounded-[10px] px-2 py-1.5 text-[11.5px] text-[var(--t2)] transition-colors hover:bg-[var(--hover)]"
                >
                  <CircleHelp size={13} className="shrink-0 text-[var(--t4)]" />
                  {tr('Trợ giúp', 'Help')}
                </button>
                {/* Ngăn cách phía trên — hành động phá huỷ tách khỏi mục thường. */}
                <button
                  type="button"
                  onClick={async () => {
                    onDismiss();
                    await fetch('/api/auth/me', { method: 'DELETE' });
                    setUser(null);
                  }}
                  className="mt-1 flex w-full items-center gap-2 rounded-[10px] border-t border-[var(--border)] px-2 pt-2 text-[11.5px] text-[var(--t3)] transition-colors hover:text-red-400"
                >
                  <LogOut size={13} />
                  {tr('Đăng xuất', 'Sign out')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      );
}
