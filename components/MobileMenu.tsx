'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MoreHorizontal, X, Coins, Share2, Check, MessageCircle, LogOut,
  LayoutDashboard, Palette, Box, Presentation, ChevronRight,
  Loader2, Clock3, CircleCheck, CircleAlert, CircleX, Settings as SettingsIcon,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useFlowStore } from '@/lib/store';
import { estimateRunCredit } from '@/lib/execution';
import type { FlowRun } from '@/lib/types';
import { TIERS } from '@/lib/ai/tiers';
import { AiStatusDot } from '@/components/settings/AiDependencySettings';
import { PHASES, type Phase } from '@/lib/phases';
import { toggleShare } from '@/lib/workspace';
import { nextThemePref, themeIconFor, themeLabelVi } from '@/lib/theme-toggle';
import { pressable, pressableIcon, springSheet, easeApple } from '@/lib/motion';
import { useStageTransition } from '@/components/studio/StageTransitionProvider';
import { activeToPhase, pickStage } from '@/lib/studio/stage-nav';
import type { AppChromeActive } from '@/components/studio/AppChromeTypes';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/avatar/UserAvatar';

const PHASE_ICON: Record<Phase, typeof Palette> = { concept: Palette, render: Box, present: Presentation };

/**
 * Overflow "⋯" cho mobile (<sm). Trên desktop các control này nằm inline ở `AppChrome`;
 * dưới 640px chúng tràn mép nên gom hết vào bottom-sheet kiểu Apple.
 *
 * `active` (30/07, hợp nhất Header+StudioBar) — bắt buộc truyền vào để `PhaseRow` điều hướng
 * ĐÚNG route hiện tại (`lib/studio/stage-nav.ts`), thay vì gọi thẳng `setWorkspace()` như trước
 * (chỉ đúng khi mount ở route `/`, SAI ở /cad·/present·/photo — đổi state mà không đổi URL).
 */
export function MobileMenu({ active }: { active: AppChromeActive }) {
  const [open, setOpen] = useState(false);
  // 2.2.86 (30/07) — đếm theo FlowRun (lượt chạy), KHÔNG phải Job (node lẻ) — khớp badge "Việc"
  // ở AppChrome.tsx (Luật Đồng Bộ #6, tránh 2 mặt tiền đếm khác đơn vị, ra 2 con số khác nhau).
  const activeJobs = useFlowStore((s) => s.flowRuns.filter((r) => r.status === 'running' || r.status === 'queued').length);

  // khoá scroll nền khi sheet mở
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <motion.button
        {...pressableIcon}
        onClick={() => setOpen(true)}
        title="Thêm"
        className="relative grid h-8 w-8 shrink-0 place-items-center rounded-[10px] border border-[var(--border)] text-[var(--t2)] transition-colors hover:bg-[var(--hover)]"
      >
        <MoreHorizontal size={16} />
        {activeJobs > 0 && (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--accent)] px-1 text-[9px] font-semibold text-white">
            {activeJobs}
          </span>
        )}
      </motion.button>

      <AnimatePresence>{open && <Sheet close={() => setOpen(false)} active={active} />}</AnimatePresence>
    </div>
  );
}

function Sheet({ close, active }: { close: () => void; active: AppChromeActive }) {
  // portal ra body — tránh bị ancestor có transform (header/motion wrapper) "giam" fixed
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 z-[60]">
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: easeApple }}
        onClick={close}
      />
      <motion.div
        role="dialog"
        aria-label="Menu"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={springSheet}
        className="mat-panel absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-[22px] border-t border-[var(--border)] shadow-pop"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        {/* grab handle */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-[var(--panel)]/80 px-4 pb-2 pt-3 backdrop-blur">
          <div className="mx-auto h-1 w-9 rounded-full bg-[var(--border)]" />
          <button
            onClick={close}
            className="absolute right-3 top-2.5 grid h-8 w-8 place-items-center rounded-full text-[var(--t3)] transition-colors hover:bg-[var(--hover)]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 px-4 pt-1">
          <AccountRow />
          <PhaseRow active={active} />
          <TierLinkRow />
          <ActionsRow close={close} />
          <TasksRow />
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 px-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--t4)]">{label}</p>
      {children}
    </div>
  );
}

function AccountRow() {
  const user = useFlowStore((s) => s.user);
  const setUser = useFlowStore((s) => s.setUser);
  const credits = useFlowStore((s) => s.credits);
  return (
    <div className="flex items-center gap-3 rounded-[14px] border border-[var(--border)] bg-[var(--field)] p-3">
      {/* Avatar — bấm mở /settings/avatar. Khách (chưa đăng nhập) vẫn có avatar
          random deterministic, không để trống ô. */}
      <a
        href="/settings/avatar"
        title="Đổi avatar"
        className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full"
      >
        <UserAvatar id={user?.id} avatar={user?.avatar} name={user?.name} size={36} frame={false} />
      </a>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[var(--t1)]">
          {user?.name ?? 'Khách'}
          {user?.isAdmin && <span className="ml-1.5 rounded bg-amber-500/15 px-1 text-[9px] text-amber-300">admin</span>}
        </p>
        <p className="flex items-center gap-1 text-xs text-[var(--t3)]">
          <Coins size={12} className="text-amber-400" /> {credits} credits
        </p>
      </div>
      {user && (
        <motion.button
          {...pressableIcon}
          title="Đăng xuất"
          onClick={async () => {
            await fetch('/api/auth/me', { method: 'DELETE' });
            setUser(null);
          }}
          className="grid h-9 w-9 place-items-center rounded-[10px] border border-[var(--border)] text-[var(--t3)] transition-colors hover:bg-[var(--hover)] hover:text-red-400"
        >
          <LogOut size={15} />
        </motion.button>
      )}
    </div>
  );
}

function PhaseRow({ active }: { active: AppChromeActive }) {
  const current: Phase = activeToPhase(active);
  const router = useRouter();
  const pathname = usePathname();
  const { begin } = useStageTransition();
  const tr = useT();
  return (
    <Section label={tr('Chặng làm việc', 'Workflow stage')}>
      <div className="grid grid-cols-3 gap-1.5">
        {PHASES.map((p) => {
          const Icon = PHASE_ICON[p.id];
          const isActive = current === p.id;
          return (
            <button
              key={p.id}
              onClick={() => pickStage(p.id, { active, pathname, router, begin })}
              className={cn(
                'flex flex-col items-center gap-1 rounded-[14px] border px-2 py-2.5 text-[11px] font-medium transition-colors',
                isActive
                  ? 'border-[var(--accent-ring)] bg-[var(--accent-soft)] text-[var(--accent)]'
                  : 'border-[var(--border)] text-[var(--t3)] hover:bg-[var(--hover)]',
              )}
            >
              <Icon size={16} /> {p.label}
            </button>
          );
        })}
      </div>
    </Section>
  );
}

/**
 * 2.2.61.a (30/07, docs/PROMPT-... "7.3.30") — chỉ 1 dòng dẫn sang `/settings`, KHÔNG còn picker
 * thật ở đây. Trước đó `TierRow` lặp lại nguyên bảng 4 tầng của `AiDependencySettings.tsx`
 * (2.2.61 đã dời khỏi Header nhưng bỏ sót MobileMenu) — vi phạm Luật #6 Đồng Bộ, một cấu hình
 * hai mặt tiền, hai trải nghiệm khác nhau cho cùng một thứ. Cài đặt là nguồn sự thật duy nhất.
 */
function TierLinkRow() {
  const aiTier = useFlowStore((s) => s.aiTier);
  const tr = useT();
  return (
    <Section label={tr('Mức phụ thuộc AI', 'AI dependency')}>
      <a
        href="/settings"
        className="flex items-center justify-between rounded-[14px] border border-[var(--border)] bg-[var(--field)] px-3 py-2.5 text-xs text-[var(--t2)] transition-colors hover:bg-[var(--hover)]"
      >
        <span className="flex items-center gap-1.5">
          {TIERS[aiTier].name}
          <AiStatusDot />
        </span>
        <span className="flex items-center gap-0.5 text-[var(--t4)]">
          {tr('Đổi trong Cài đặt', 'Change in Settings')}
          <ChevronRight size={13} />
        </span>
      </a>
    </Section>
  );
}

function ActionsRow({ close }: { close: () => void }) {
  const setChatOpen = useFlowStore((s) => s.setChatOpen);
  const setDashboardOpen = useFlowStore((s) => s.setDashboardOpen);
  const tr = useT();
  const router = useRouter();

  return (
    <Section label={tr('Công cụ', 'Tools')}>
      <div className="grid grid-cols-2 gap-1.5">
        <Tile
          icon={<LayoutDashboard size={16} />}
          label={tr('Tổng quan', 'Overview')}
          onClick={() => {
            setDashboardOpen(true);
            close();
          }}
        />
        <Tile
          icon={<MessageCircle size={16} />}
          label={tr('Chat team', 'Team chat')}
          onClick={() => {
            setChatOpen(true);
            close();
          }}
        />
        <ShareTile />
        <ThemeTile />
        {/* Ngôn ngữ + xem lại hướng dẫn dời hết vào /settings (7.3.30) */}
        <Tile
          icon={<SettingsIcon size={16} />}
          label={tr('Cài đặt', 'Settings')}
          onClick={() => {
            close();
            router.push('/settings');
          }}
        />
      </div>
    </Section>
  );
}

function Tile({ icon, label, onClick, tone }: { icon: React.ReactNode; label: string; onClick: () => void; tone?: string }) {
  return (
    <motion.button
      {...pressable}
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 rounded-[14px] border border-[var(--border)] px-3 py-2.5 text-xs font-medium text-[var(--t2)] transition-colors hover:bg-[var(--hover)]',
        tone,
      )}
    >
      <span className="shrink-0 text-[var(--t3)]">{icon}</span>
      <span className="truncate">{label}</span>
    </motion.button>
  );
}

function ShareTile() {
  const shareToken = useFlowStore((s) => s.shareToken);
  const currentFlowId = useFlowStore((s) => s.currentFlowId);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

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
    <Tile
      icon={copied ? <Check size={16} /> : <Share2 size={16} />}
      label={copied ? 'Đã copy link' : shareToken ? 'Copy link share' : 'Bật share'}
      onClick={onClick}
      tone={shareToken ? 'border-emerald-500/40 text-emerald-300' : undefined}
    />
  );
}

function ThemeTile() {
  const pref = useFlowStore((s) => s.themePref);
  const applied = useFlowStore((s) => s.appliedTheme);
  const setThemePref = useFlowStore((s) => s.setThemePref);
  const next = nextThemePref(pref);
  const Icon = themeIconFor(pref);
  const label = pref === 'auto' ? `${themeLabelVi(pref)} (${applied === 'light' ? 'sáng' : 'tối'})` : themeLabelVi(pref);
  return <Tile icon={<Icon size={16} />} label={`Theme: ${label}`} onClick={() => setThemePref(next)} />;
}

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 5) return 'vừa xong';
  if (s < 60) return `${s}s trước`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m trước`;
  return `${Math.floor(m / 60)}h trước`;
}

/** 2.2.86 (30/07) — đơn vị hàng đợi là FlowRun (lượt chạy), KHÔNG phải Job (node lẻ), khớp
 * TasksDropdown.tsx (desktop) — Luật Đồng Bộ #6, tránh 2 mặt tiền đếm khác đơn vị. Bản mobile
 * gọn hơn: 1 danh sách phẳng (đang chạy → đang chờ → vừa xong), không tách 3 nhóm có tiêu đề
 * riêng như desktop (đủ chỗ hơn) — cùng dữ liệu, khác mức chi tiết trình bày. */
function TasksRow() {
  const flowRuns = useFlowStore((s) => s.flowRuns);
  const running = flowRuns.filter((r) => r.status === 'running');
  const queued = flowRuns.filter((r) => r.status === 'queued').sort((a, b) => a.queuedAt - b.queuedAt);
  const finished = flowRuns
    .filter((r) => r.status === 'done' || r.status === 'error' || r.status === 'cancelled')
    .sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0));
  const ordered = [...running, ...queued, ...finished].slice(0, 8);
  return (
    <Section label={`Việc${running.length + queued.length ? ` · ${running.length + queued.length}` : ''}`}>
      <div className="overflow-hidden rounded-[14px] border border-[var(--border)]">
        {ordered.length === 0 && (
          <p className="px-3 py-5 text-center text-xs text-[var(--t4)]">Chưa có lượt chạy nào — bấm ▶ trên node hoặc &quot;Kết xuất&quot; trên thẻ.</p>
        )}
        {ordered.map((r: FlowRun) => {
          const total = r.nodeIds.length;
          const credit = r.status === 'queued' || r.status === 'running' ? estimateRunCredit(r.nodeIds) : 0;
          let detail: string;
          if (r.status === 'running') detail = `${Math.min(total, Math.max(0, r.currentIndex) + 1)}/${total} node`;
          else if (r.status === 'queued') detail = `Đang chờ · ${total} node`;
          else if (r.status === 'error') detail = `Lỗi · ${timeAgo(r.finishedAt ?? r.queuedAt)}`;
          else if (r.status === 'cancelled') detail = `Đã huỷ · ${timeAgo(r.finishedAt ?? r.queuedAt)}`;
          else detail = `${total} node · ${timeAgo(r.finishedAt ?? r.queuedAt)}`;
          return (
            <div key={r.id} className="flex items-center gap-2.5 border-b border-[var(--border)] px-3 py-2.5 last:border-0">
              {r.status === 'running' && <Loader2 size={14} className="shrink-0 animate-spin text-[var(--accent)]" />}
              {r.status === 'queued' && <Clock3 size={14} className="shrink-0 text-[var(--t4)]" />}
              {r.status === 'done' && <CircleCheck size={14} className="shrink-0 text-emerald-400" />}
              {r.status === 'error' && <CircleAlert size={14} className="shrink-0 text-red-400" />}
              {r.status === 'cancelled' && <CircleX size={14} className="shrink-0 text-[var(--t4)]" />}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-[var(--t1)]">{r.label}</p>
                <p className="truncate text-[10px] text-[var(--t4)]">
                  {detail}
                  {credit > 0 && ` · ~${credit}cr`}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
