'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MoreHorizontal, X, Coins, Share2, Check, MessageCircle, LogOut, Sun, Moon, SunMoon,
  LayoutDashboard, Palette, Box, Presentation, Cloud, Zap, Cpu, ShieldCheck,
  Loader2, Clock3, CircleCheck, CircleAlert,
} from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import { checkProviders, type ProviderStatus } from '@/lib/ai/client';
import {
  TIERS, TIER_ORDER, type AiTier, providerForTier,
  ONE_AI_ENGINES, ONE_AI_RUNTIMES,
} from '@/lib/ai/tiers';
import { PHASES, DEFAULT_PHASE, type Phase } from '@/lib/phases';
import { toggleShare } from '@/lib/workspace';
import { pressable, pressableIcon, springSheet, easeApple } from '@/lib/motion';
import { useT } from '@/lib/i18n';
import { LangToggle } from '@/components/LangToggle';
import { cn } from '@/lib/utils';

const PHASE_ICON: Record<Phase, typeof Palette> = { concept: Palette, render: Box, present: Presentation };
const TIER_ICON: Record<AiTier, typeof Cloud> = { 4: Cloud, 3: Zap, 2: Cpu, 1: ShieldCheck };

/**
 * Overflow "⋯" cho mobile (<sm). Trên desktop các control này nằm inline ở Header;
 * dưới 640px chúng tràn mép nên gom hết vào bottom-sheet kiểu Apple.
 */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const activeJobs = useFlowStore((s) => s.jobs.filter((j) => j.status === 'running' || j.status === 'queued').length);

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
    <div className="sm:hidden">
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

      <AnimatePresence>{open && <Sheet close={() => setOpen(false)} />}</AnimatePresence>
    </div>
  );
}

function Sheet({ close }: { close: () => void }) {
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
          <PhaseRow />
          <TierRow />
          <ActionsRow close={close} />
          <LangRow />
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
      <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 text-sm font-semibold text-white">
        {(user?.name ?? '?').slice(0, 1).toUpperCase()}
      </div>
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

function LangRow() {
  const tr = useT();
  return (
    <Section label={tr('Ngôn ngữ', 'Language')}>
      <div className="flex items-center justify-between rounded-[14px] border border-[var(--border)] bg-[var(--field)] px-3 py-2.5">
        <span className="text-xs text-[var(--t2)]">{tr('Tiếng Việt / English', 'Vietnamese / English')}</span>
        <LangToggle />
      </div>
    </Section>
  );
}

function PhaseRow() {
  const workspace = useFlowStore((s) => s.workspace);
  const setWorkspace = useFlowStore((s) => s.setWorkspace);
  const current: Phase = workspace ?? DEFAULT_PHASE;
  const tr = useT();
  return (
    <Section label={tr('Chặng làm việc', 'Workflow stage')}>
      <div className="grid grid-cols-3 gap-1.5">
        {PHASES.map((p) => {
          const Icon = PHASE_ICON[p.id];
          const active = current === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setWorkspace(p.id)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-[12px] border px-2 py-2.5 text-[11px] font-medium transition-colors',
                active
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

function TierRow() {
  const aiTier = useFlowStore((s) => s.aiTier);
  const setAiTier = useFlowStore((s) => s.setAiTier);
  const oneAiEngine = useFlowStore((s) => s.oneAiEngine);
  const setOneAiEngine = useFlowStore((s) => s.setOneAiEngine);
  const oneAiRuntime = useFlowStore((s) => s.oneAiRuntime);
  const setOneAiRuntime = useFlowStore((s) => s.setOneAiRuntime);
  const [status, setStatus] = useState<ProviderStatus | null>(null);
  const tr = useT();
  useEffect(() => {
    checkProviders().then(setStatus);
  }, []);

  const avail = (t: AiTier): boolean | null => {
    const p = providerForTier(t, oneAiEngine);
    if (!p) return true;
    if (!status) return null;
    return p === 'fal' ? status.fal : p === 'comfyui' ? status.comfyui : status.sd;
  };

  return (
    <Section label={tr('Mức phụ thuộc AI', 'AI dependency')}>
      <div className="space-y-1.5">
        {TIER_ORDER.map((t) => {
          const m = TIERS[t];
          const TI = TIER_ICON[t];
          const active = t === aiTier;
          const a = avail(t);
          return (
            <button
              key={t}
              onClick={() => setAiTier(t)}
              className={cn(
                'flex w-full items-start gap-2.5 rounded-[12px] border px-3 py-2 text-left transition-colors',
                active ? 'border-[var(--accent-ring)] bg-[var(--accent-soft)]' : 'border-[var(--border)] hover:bg-[var(--hover)]',
              )}
            >
              <TI size={16} className="mt-0.5 shrink-0 text-[var(--t3)]" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-[var(--t1)]">{m.name}</span>
                  <span className="rounded bg-[var(--hover)] px-1 text-[9px] text-[var(--t4)]">{m.cost}</span>
                  {a === false && <span className="rounded bg-amber-500/15 px-1 text-[9px] text-amber-300">mock</span>}
                  {active && <Check size={12} className="ml-auto text-[var(--accent)]" />}
                </div>
                <p className="mt-0.5 text-[10px] leading-snug text-[var(--t4)]">{m.blurb}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* oneAI (mức 2): engine + runtime */}
      {aiTier === 2 && (
        <div className="mt-2 space-y-1.5">
          <p className="px-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--t4)]">Engine</p>
          <div className="flex gap-1.5">
            {ONE_AI_ENGINES.map((e) => {
              const on = e.id === oneAiEngine;
              return (
                <button
                  key={e.id}
                  onClick={() => setOneAiEngine(e.id)}
                  className={cn(
                    'flex-1 rounded-[10px] border px-2 py-2 text-[11px] font-medium transition-colors',
                    on ? 'border-[var(--accent-ring)] bg-[var(--accent-soft)] text-[var(--accent)]' : 'border-[var(--border)] text-[var(--t3)]',
                  )}
                >
                  {e.name}
                </button>
              );
            })}
          </div>
          {oneAiEngine === 'sd' && (
            <>
              <p className="px-0.5 pt-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--t4)]">Runtime</p>
              <div className="flex gap-1.5">
                {ONE_AI_RUNTIMES.map((r) => {
                  const on = r.id === oneAiRuntime;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setOneAiRuntime(r.id)}
                      className={cn(
                        'flex-1 rounded-[10px] border px-2 py-2 text-[11px] font-medium transition-colors',
                        on ? 'border-[var(--accent-ring)] bg-[var(--accent-soft)] text-[var(--accent)]' : 'border-[var(--border)] text-[var(--t3)]',
                      )}
                    >
                      {r.name}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </Section>
  );
}

function ActionsRow({ close }: { close: () => void }) {
  const setChatOpen = useFlowStore((s) => s.setChatOpen);
  const setDashboardOpen = useFlowStore((s) => s.setDashboardOpen);
  const tr = useT();

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
        'flex items-center gap-2 rounded-[12px] border border-[var(--border)] px-3 py-2.5 text-xs font-medium text-[var(--t2)] transition-colors hover:bg-[var(--hover)]',
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
  const next = pref === 'auto' ? 'light' : pref === 'light' ? 'dark' : 'auto';
  const Icon = pref === 'auto' ? SunMoon : pref === 'light' ? Sun : Moon;
  const label = pref === 'auto' ? `Tự động (${applied === 'light' ? 'sáng' : 'tối'})` : pref === 'light' ? 'Sáng' : 'Tối';
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

function TasksRow() {
  const jobs = useFlowStore((s) => s.jobs);
  return (
    <Section label={`Tasks${jobs.length ? ` · ${jobs.length}` : ''}`}>
      <div className="overflow-hidden rounded-[14px] border border-[var(--border)]">
        {jobs.length === 0 && (
          <p className="px-3 py-5 text-center text-xs text-[var(--t4)]">Chưa có job nào — bấm ▶ trên node hoặc Run flow.</p>
        )}
        {jobs.slice(0, 8).map((j) => (
          <div key={j.id} className="flex items-center gap-2.5 border-b border-[var(--border)] px-3 py-2.5 last:border-0">
            {j.status === 'running' && <Loader2 size={14} className="shrink-0 animate-spin text-[var(--accent)]" />}
            {j.status === 'queued' && <Clock3 size={14} className="shrink-0 text-[var(--t4)]" />}
            {j.status === 'done' && <CircleCheck size={14} className="shrink-0 text-emerald-400" />}
            {j.status === 'error' && <CircleAlert size={14} className="shrink-0 text-red-400" />}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-[var(--t1)]">{j.nodeTitle}</p>
              <p className="truncate text-[10px] text-[var(--t4)]">
                {j.status === 'error' ? j.error : timeAgo(j.createdAt)}
                {j.creditCost > 0 && ` · ${j.creditCost}cr${j.status === 'error' ? ' (đã hoàn)' : ''}`}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
