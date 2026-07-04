'use client';

import { useEffect, useState } from 'react';
import { Coins, Share2, Play, Loader2, ChevronDown, Sparkles, FlaskConical, Sun, Moon, SunMoon, MessageCircle, LogOut, Check } from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import { runFlow } from '@/lib/execution';
import { checkFalAvailable } from '@/lib/ai/client';
import { toggleShare } from '@/lib/workspace';
import { TasksDropdown } from '@/components/TasksDropdown';
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
    <header className="no-scrollbar relative z-30 flex h-12 shrink-0 items-center gap-2 overflow-x-auto overflow-y-hidden border-b border-[var(--border)] bg-[var(--panel)] px-2 sm:gap-3 sm:px-3">
      {/* logo */}
      <div className="flex shrink-0 items-center gap-2">
        <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 text-[13px] font-bold text-white">
          IF
        </div>
        <span className="hidden text-sm font-semibold tracking-tight text-[var(--t1)] sm:block">
          InteriorFlow
        </span>
      </div>

      <div className="mx-1 h-5 w-px bg-[var(--hover)]" />

      {/* flow name — editable */}
      {editing ? (
        <input
          autoFocus
          className="w-56 rounded-md border border-violet-500/50 bg-[var(--field)] px-2 py-1 text-sm text-[var(--t1)] outline-none"
          value={flowName}
          onChange={(e) => setFlowName(e.target.value)}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => e.key === 'Enter' && setEditing(false)}
        />
      ) : (
        <button
          className="max-w-40 shrink-0 truncate rounded-md px-2 py-1 text-sm text-[var(--t2)] transition hover:bg-[var(--hover)] sm:max-w-64"
          onClick={() => setEditing(true)}
          title="Đổi tên flow"
        >
          {flowName}
        </button>
      )}

      {/* AI mode badge */}
      {falMode !== null && (
        <span
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
        </span>
      )}

      <div className="flex-1" />

      {/* run flow */}
      <button
        onClick={() => runFlow()}
        disabled={isRunningFlow}
        className="flex shrink-0 items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
      >
        {isRunningFlow ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
        Run flow
      </button>

      {/* credits */}
      <div className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--field)] px-2.5 py-1.5 text-xs text-[var(--t2)]">
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
      <div className="relative shrink-0">
        <button
          onClick={() => setTasksOpen(!tasksOpen)}
          className={cn(
            'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition',
            tasksOpen
              ? 'border-violet-500/50 bg-violet-500/10 text-violet-300'
              : 'border-[var(--border)] text-[var(--t2)] hover:bg-[var(--hover)]',
          )}
        >
          Tasks
          {activeJobs > 0 && (
            <span className="grid h-4 min-w-4 place-items-center rounded-full bg-violet-500 px-1 text-[10px] font-semibold text-white">
              {activeJobs}
            </span>
          )}
          <ChevronDown size={12} className={cn('transition-transform', tasksOpen && 'rotate-180')} />
        </button>
        {tasksOpen && <TasksDropdown />}
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
    <button
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
        'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition',
        shareToken
          ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
          : 'border-[var(--border)] text-[var(--t2)] hover:bg-[var(--hover)]',
      )}
    >
      {copied ? <Check size={13} /> : <Share2 size={13} />}
      {copied ? 'Đã copy' : 'Share'}
    </button>
  );
}

function ChatToggle() {
  const chatOpen = useFlowStore((s) => s.chatOpen);
  const setChatOpen = useFlowStore((s) => s.setChatOpen);
  return (
    <button
      onClick={() => setChatOpen(!chatOpen)}
      title="Chat nội bộ team"
      className={cn(
        'grid h-8 w-8 place-items-center rounded-lg border transition',
        chatOpen
          ? 'border-violet-500/50 bg-violet-500/10 text-violet-300'
          : 'border-[var(--border)] text-[var(--t3)] hover:bg-[var(--hover)] hover:text-[var(--t1)]',
      )}
    >
      <MessageCircle size={14} />
    </button>
  );
}

function UserChip() {
  const user = useFlowStore((s) => s.user);
  const setUser = useFlowStore((s) => s.setUser);
  if (!user) return null;
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] py-1 pl-2 pr-1 text-xs text-[var(--t2)]">
      <span className="max-w-24 truncate" title={`${user.name} · ${user.email}${user.isAdmin ? ' · admin' : ''}`}>
        {user.name}
      </span>
      <button
        title="Đăng xuất"
        onClick={async () => {
          await fetch('/api/auth/me', { method: 'DELETE' });
          setUser(null);
        }}
        className="grid h-6 w-6 place-items-center rounded-md text-[var(--t4)] hover:bg-[var(--hover)] hover:text-red-400"
      >
        <LogOut size={12} />
      </button>
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
    <button
      onClick={() => setThemePref(next)}
      title={
        pref === 'auto'
          ? `Theme: tự động theo giờ (sáng 6h30–18h) — đang ${applied === 'light' ? 'sáng' : 'tối'}. Bấm để chuyển.`
          : `Theme: ${pref === 'light' ? 'sáng' : 'tối'} cố định. Bấm để chuyển.`
      }
      className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--border)] text-[var(--t3)] transition hover:bg-[var(--hover)] hover:text-[var(--t1)]"
    >
      <Icon size={14} />
    </button>
  );
}
