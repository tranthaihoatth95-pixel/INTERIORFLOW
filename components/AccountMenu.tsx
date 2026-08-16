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

import { useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, User, Palette, CircleHelp, Coins, Share2, Check, MessageCircle, Settings as SettingsIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useFlowStore } from '@/lib/store';
import { nextThemePref, themeIconFor, themeLabelVi } from '@/lib/theme-toggle';
import { toggleShare } from '@/lib/workspace';
import { easeApple, pressableIcon } from '@/lib/motion';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

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
  const credits = useFlowStore((s) => s.credits);
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
              className="nen-mo-panel z-[80] w-52 rounded-[14px] border border-[var(--border)] p-2 shadow-xl"
            >
              <div ref={menuRef} style={{ display: 'contents' }}>
                <div className="truncate px-2 py-1.5 text-xs text-[var(--t3)]" title={`${user.name} · ${user.email}`}>
                  {user.name}
                </div>
                {/* Gom từ MoreMenu (⋯ đã bỏ khỏi header, Hoà chốt 03/08 "một cửa cho chuyện
                    của tôi"): credits + share/chat giữ nguyên chức năng, chỉ đổi nhà. */}
                <div className="mb-1.5 flex items-center justify-between rounded-[10px] bg-[var(--field)] px-2.5 py-1.5 text-xs text-[var(--t2)]">
                  <span className="flex items-center gap-1.5">
                    <Coins size={13} className="text-amber-400" />
                    {tr('Tín dụng', 'Credits')}
                  </span>
                  <span className="font-semibold text-[var(--t1)]">{credits}</span>
                </div>
                <div className="mb-1 flex items-center gap-1.5 px-0.5">
                  <ShareButton />
                  <ChatToggle />
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
                  onClick={() => go('/settings')}
                  className="flex w-full items-center gap-2 rounded-[10px] px-2 py-1.5 text-[11.5px] text-[var(--t2)] transition-colors hover:bg-[var(--hover)]"
                >
                  <SettingsIcon size={13} className="shrink-0 text-[var(--t4)]" />
                  {tr('Cài đặt', 'Settings')}
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

/* ShareButton + ChatToggle — CHUYỂN NGUYÊN VĂN từ AppChrome.tsx khi MoreMenu (⋯) bị gom vào
 * menu này (03/08). Logic không đổi — chỉ đổi nhà, giữ đủ chức năng share/chat sau khi ⋯ biến
 * mất khỏi header. */

function ShareButton() {
  const shareToken = useFlowStore((s) => s.shareToken);
  const currentFlowId = useFlowStore((s) => s.currentFlowId);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const tr = useT();

  const onClick = async () => {
    if (!currentFlowId || busy) return;
    setBusy(true);
    try {
      let token = shareToken;
      if (!token) token = await toggleShare();
      if (token) {
        await navigator.clipboard.writeText(`${location.origin}/share/${token}`).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.button
      {...pressableIcon}
      onClick={onClick}
      onContextMenu={(e) => {
        e.preventDefault();
        if (shareToken) toggleShare();
      }}
      title={
        shareToken
          ? tr(
              'Đã bật share — bấm để copy link cho khách (chuột phải: tắt share)',
              'Sharing on — click to copy the guest link (right-click: turn off)',
            )
          : tr('Bật share link read-only cho khách xem flow', 'Turn on a read-only share link for guests')
      }
      className={cn(
        'flex flex-1 shrink-0 items-center justify-center gap-1.5 rounded-[10px] border px-2 py-1.5 text-[11px] transition-colors duration-200 ease-[cubic-bezier(.32,.72,0,1)]',
        shareToken
          ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
          : 'border-[var(--border)] text-[var(--t2)] hover:bg-[var(--hover)]',
      )}
    >
      {copied ? <Check size={13} /> : <Share2 size={13} />}
      {copied ? tr('Đã copy', 'Copied') : tr('Chia sẻ', 'Share')}
    </motion.button>
  );
}

function ChatToggle() {
  const chatOpen = useFlowStore((s) => s.chatOpen);
  const setChatOpen = useFlowStore((s) => s.setChatOpen);
  const tr = useT();
  return (
    <motion.button
      {...pressableIcon}
      onClick={() => setChatOpen(!chatOpen)}
      title={tr('Chat nội bộ team', 'Team chat')}
      className={cn(
        'flex flex-1 shrink-0 items-center justify-center gap-1.5 rounded-[10px] border px-2 py-1.5 text-[11px] transition-colors',
        chatOpen
          ? 'border-[var(--accent-ring)] bg-[var(--accent-soft)] text-[var(--accent)]'
          : 'border-[var(--border)] text-[var(--t3)] hover:bg-[var(--hover)] hover:text-[var(--t1)]',
      )}
    >
      <MessageCircle size={13} />
      {tr('Chat', 'Chat')}
    </motion.button>
  );
}
