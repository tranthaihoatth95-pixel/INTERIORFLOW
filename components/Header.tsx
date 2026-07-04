'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Share2, Play, Loader2, ChevronDown, Sparkles, FlaskConical, Sun, Moon, SunMoon, MessageCircle, LogOut, Check, Workflow, LayoutDashboard } from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import { runFlow } from '@/lib/execution';
import { checkFalAvailable } from '@/lib/ai/client';
import { toggleShare } from '@/lib/workspace';
import { TasksDropdown } from '@/components/TasksDropdown';
import { pressable, pressableIcon, easeApple } from '@/lib/motion';
import { cn } from '@/lib/utils';

export function Header() {
  const flowName = useFlowStore((s) => s.flowName);
  const setFlowName = useFlowStore((s) => s.setFlowName);
  const credits = useFlowStore((s) => s.credits);
  const isRunningFlow = useFlowStore((s) => s.isRunningFlow);
  const tasksOpen = useFlowStore((s) => s.tasksOpen);
  const setTasksOpen = useFlowStore((s) => s.setTasksOpen);
  const jobs = useFlowStore((s) => s.jobs);
  const [editing, setEditing] = useState(false);
  const [falMode, setFalMode] = useState<boolean | null>(null);

  useEffect(() => {
    checkFalAvailable().then(setFalMode);
  }, []);

  const activeJobs = jobs.filter((j) => j.status === 'running' || j.status === 'queued').length;

  return (
    // material blur (vibrancy) — header trong suốt, hairline mảnh
    <header className="mat-header relative z-30 flex h-12 items-center gap-3 border-b border-[var(--border)] px-3">
      {/* logo */}
      <div className="flex items-center gap-2">
        <div className="grid h-7 w-7 place-items-center rounded-[10px] bg-gradient-to-br from-violet-500 to-fuchsia-600 text-[13px] font-bold text-white shadow-sm">
          IF
        </div>
        <span className="hidden text-sm font-semibold tracking-tight text-[var(--t1)] sm:block">
          InteriorFlow
        </span>
      </div>

      <div className="mx-1 h-5 w-px bg-[var(--border)]" />

      {/* flow name — editable */}
      {editing ? (
        <input
          autoFocus
          className="w-56 rounded-[10px] border border-[var(--accent-ring)] bg-[var(--field)] px-2 py-1 text-sm text-[var(--t1)] outline-none"
          value={flowName}
          onChange={(e) => setFlowName(e.target.value)}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => e.key === 'Enter' && setEditing(false)}
        />
      ) : (
        <motion.button
          {...pressable}
          className="max-w-64 truncate rounded-[10px] px-2 py-1 text-sm text-[var(--t2)] transition-colors hover:bg-[var(--hover)]"
          onClick={() => setEditing(true)}
          title="Đổi tên flow"
        >
          {flowName}
        </motion.button>
      )}

      {/* chuyển kiểu xem canvas — Node (hiện tại) | Window (Figma, sắp có) */}
      <ViewToggle />

      {/* AI mode badge */}
      <AnimatePresence>
        {falMode !== null && (
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.24, ease: easeApple }}
            data-testid="ai-mode"
            title={
              falMode
                ? 'Đang gọi fal.ai thật'
                : 'Chưa có FAL_KEY trong .env.local — node AI chạy mock (ảnh placeholder). Thêm key rồi restart để dùng AI thật.'
            }
            className={cn(
              'flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium',
              falMode
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                : 'border-amber-500/40 bg-amber-500/10 text-amber-300',
            )}
          >
            {falMode ? <Sparkles size={10} /> : <FlaskConical size={10} />}
            {falMode ? 'AI: fal.ai' : 'AI: mock'}
          </motion.span>
        )}
      </AnimatePresence>

      <div className="flex-1" />

      {/* run flow — nút chính, press-scale */}
      <motion.button
        {...pressable}
        onClick={() => runFlow()}
        disabled={isRunningFlow}
        className="flex items-center gap-1.5 rounded-[10px] bg-[var(--accent-strong)] px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-[var(--accent)] disabled:opacity-50"
      >
        {isRunningFlow ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
        Run flow
      </motion.button>

      {/* credits */}
      <div className="flex items-center gap-1.5 rounded-[10px] border border-[var(--border)] bg-[var(--field)] px-2.5 py-1.5 text-xs text-[var(--t2)]">
        <Coins size={13} className="text-amber-400" />
        {credits}
      </div>

      {/* share — link read-only cho khách */}
      <ShareButton />

      {/* chat team */}
      <ChatToggle />

      {/* theme: auto (theo giờ) → light → dark */}
      <ThemeToggle />

      {/* tasks */}
      <div className="relative">
        <motion.button
          {...pressable}
          onClick={() => setTasksOpen(!tasksOpen)}
          className={cn(
            'flex items-center gap-1.5 rounded-[10px] border px-2.5 py-1.5 text-xs transition-colors',
            tasksOpen
              ? 'border-[var(--accent-ring)] bg-[var(--accent-soft)] text-[var(--accent)]'
              : 'border-[var(--border)] text-[var(--t2)] hover:bg-[var(--hover)]',
          )}
        >
          Tasks
          {activeJobs > 0 && (
            <span className="grid h-4 min-w-4 place-items-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-semibold text-white">
              {activeJobs}
            </span>
          )}
          <ChevronDown size={12} className={cn('transition-transform', tasksOpen && 'rotate-180')} />
        </motion.button>
        <AnimatePresence>{tasksOpen && <TasksDropdown />}</AnimatePresence>
      </div>

      {/* user chip + logout */}
      <UserChip />
    </header>
  );
}

function ShareButton() {
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
    <motion.button
      {...pressable}
      onClick={onClick}
      onContextMenu={(e) => {
        // chuột phải = tắt share
        e.preventDefault();
        if (shareToken) toggleShare();
      }}
      title={
        shareToken
          ? 'Đã bật share — bấm để copy link cho khách (chuột phải: tắt share)'
          : 'Bật share link read-only cho khách xem flow'
      }
      className={cn(
        'flex items-center gap-1.5 rounded-[10px] border px-2.5 py-1.5 text-xs transition-colors',
        shareToken
          ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
          : 'border-[var(--border)] text-[var(--t2)] hover:bg-[var(--hover)]',
      )}
    >
      {copied ? <Check size={13} /> : <Share2 size={13} />}
      {copied ? 'Đã copy' : 'Share'}
    </motion.button>
  );
}

function ChatToggle() {
  const chatOpen = useFlowStore((s) => s.chatOpen);
  const setChatOpen = useFlowStore((s) => s.setChatOpen);
  return (
    <motion.button
      {...pressableIcon}
      whileHover={{ scale: 1.06 }}
      onClick={() => setChatOpen(!chatOpen)}
      title="Chat nội bộ team"
      className={cn(
        'grid h-8 w-8 place-items-center rounded-[10px] border transition-colors',
        chatOpen
          ? 'border-[var(--accent-ring)] bg-[var(--accent-soft)] text-[var(--accent)]'
          : 'border-[var(--border)] text-[var(--t3)] hover:bg-[var(--hover)] hover:text-[var(--t1)]',
      )}
    >
      <MessageCircle size={14} />
    </motion.button>
  );
}

function UserChip() {
  const user = useFlowStore((s) => s.user);
  const setUser = useFlowStore((s) => s.setUser);
  if (!user) return null;
  return (
    <div className="flex items-center gap-1.5 rounded-[10px] border border-[var(--border)] py-1 pl-2 pr-1 text-xs text-[var(--t2)]">
      <span className="max-w-24 truncate" title={`${user.name} · ${user.email}${user.isAdmin ? ' · admin' : ''}`}>
        {user.name}
      </span>
      <motion.button
        {...pressableIcon}
        title="Đăng xuất"
        onClick={async () => {
          await fetch('/api/auth/me', { method: 'DELETE' });
          setUser(null);
        }}
        className="grid h-6 w-6 place-items-center rounded-md text-[var(--t4)] transition-colors hover:bg-[var(--hover)] hover:text-red-400"
      >
        <LogOut size={12} />
      </motion.button>
    </div>
  );
}

function ThemeToggle() {
  const pref = useFlowStore((s) => s.themePref);
  const applied = useFlowStore((s) => s.appliedTheme);
  const setThemePref = useFlowStore((s) => s.setThemePref);
  const next = pref === 'auto' ? 'light' : pref === 'light' ? 'dark' : 'auto';
  const Icon = pref === 'auto' ? SunMoon : pref === 'light' ? Sun : Moon;
  return (
    <motion.button
      {...pressableIcon}
      whileHover={{ scale: 1.06 }}
      onClick={() => setThemePref(next)}
      title={
        pref === 'auto'
          ? `Theme: tự động theo giờ (sáng 6h30–18h) — đang ${applied === 'light' ? 'sáng' : 'tối'}. Bấm để chuyển.`
          : `Theme: ${pref === 'light' ? 'sáng' : 'tối'} cố định. Bấm để chuyển.`
      }
      className="grid h-8 w-8 place-items-center rounded-[10px] border border-[var(--border)] text-[var(--t3)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--t1)]"
    >
      {/* icon xoay-mờ nhẹ khi đổi theme, kiểu Apple */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={pref}
          initial={{ opacity: 0, rotate: -30, scale: 0.8 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 30, scale: 0.8 }}
          transition={{ duration: 0.2, ease: easeApple }}
        >
          <Icon size={14} />
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}

// Segmented control: kiểu xem canvas. 'node' hoạt động; 'window' (Figma) để mốc, chưa bật.
function ViewToggle() {
  const viewMode = useFlowStore((s) => s.viewMode);
  const setViewMode = useFlowStore((s) => s.setViewMode);
  return (
    <div className="hidden items-center gap-0.5 rounded-[10px] border border-[var(--border)] bg-[var(--field)] p-0.5 md:flex">
      <button
        onClick={() => setViewMode('node')}
        title="Node flow (hiện tại)"
        className={cn(
          'flex items-center gap-1 rounded-[7px] px-2 py-1 text-[11px] font-medium transition-colors',
          viewMode === 'node' ? 'bg-[var(--card)] text-[var(--t1)] shadow-sm' : 'text-[var(--t4)] hover:text-[var(--t2)]',
        )}
      >
        <Workflow size={12} /> Node
      </button>
      <button
        disabled
        title="Window view kiểu Figma — sắp có (đang xây engine riêng)"
        className="flex cursor-not-allowed items-center gap-1 rounded-[7px] px-2 py-1 text-[11px] font-medium text-[var(--t5)]"
      >
        <LayoutDashboard size={12} /> Window
        <span className="rounded bg-[var(--hover)] px-1 text-[8px] text-[var(--t4)]">sắp có</span>
      </button>
    </div>
  );
}
