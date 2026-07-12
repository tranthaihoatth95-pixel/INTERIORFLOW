'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Share2, Play, Loader2, ChevronDown, Cloud, Zap, Cpu, ShieldCheck, Sun, Moon, SunMoon, MessageCircle, LogOut, Check, MoreHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useFlowStore } from '@/lib/store';
import { runFlow } from '@/lib/execution';
import { checkProviders, type ProviderStatus } from '@/lib/ai/client';
import {
  TIERS, TIER_ORDER, type AiTier, providerForTier,
  type OneAiEngine, ONE_AI_ENGINES, ONE_AI_RUNTIMES,
} from '@/lib/ai/tiers';
import { DEFAULT_PHASE, type Phase } from '@/lib/phases';
import StageSwitcher from '@/components/studio/StageSwitcher';
import { UploadButton } from '@/components/studio/UploadButton';
import { toggleShare } from '@/lib/workspace';
import { TasksDropdown } from '@/components/TasksDropdown';
import { MobileMenu } from '@/components/MobileMenu';
import { LangToggle } from '@/components/LangToggle';
import { pressable, pressableIcon, easeApple, fade } from '@/lib/motion';
import { stashPresentHandoff, deckImagesFromNodes } from '@/lib/present-editor/handoff';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function Header() {
  const flowName = useFlowStore((s) => s.flowName);
  const setFlowName = useFlowStore((s) => s.setFlowName);
  const isRunningFlow = useFlowStore((s) => s.isRunningFlow);
  const tasksOpen = useFlowStore((s) => s.tasksOpen);
  const setTasksOpen = useFlowStore((s) => s.setTasksOpen);
  const jobs = useFlowStore((s) => s.jobs);
  const [editing, setEditing] = useState(false);
  const tr = useT();

  const activeJobs = jobs.filter((j) => j.status === 'running' || j.status === 'queued').length;

  return (
    // material blur (vibrancy) — header trong suốt, hairline mảnh
    <header className="mat-header relative z-30 flex h-12 items-center gap-2 border-b border-[var(--border)] px-2 sm:gap-3 sm:px-3">
      {/* logo */}
      <div className="flex shrink-0 items-center gap-2">
        <div className="grid h-7 w-7 place-items-center rounded-[10px] bg-gradient-to-br from-violet-500 to-fuchsia-600 text-[13px] font-bold text-white shadow-sm">
          IF
        </div>
        <span className="hidden text-sm font-semibold tracking-tight text-[var(--t1)] lg:block">
          InteriorFlow
        </span>
      </div>

      <div className="mx-1 hidden h-5 w-px bg-[var(--border)] sm:block" />

      {/* flow name — editable (co giãn mượt, không đè lên cụm nút phải) */}
      {editing ? (
        <input
          autoFocus
          className="w-36 shrink rounded-[10px] border border-[var(--accent-ring)] bg-[var(--field)] px-2 py-1 text-sm text-[var(--t1)] outline-none sm:w-56"
          value={flowName}
          onChange={(e) => setFlowName(e.target.value)}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => e.key === 'Enter' && setEditing(false)}
        />
      ) : (
        <motion.button
          {...pressable}
          className="min-w-0 max-w-28 shrink truncate rounded-[10px] px-2 py-1 text-sm text-[var(--t2)] transition-colors hover:bg-[var(--hover)] sm:max-w-40 lg:max-w-56"
          onClick={() => setEditing(true)}
          title={tr('Đổi tên flow', 'Rename flow')}
        >
          {flowName}
        </motion.button>
      )}

      {/* TRỤC ĐIỀU HƯỚNG DUY NHẤT — Concept · Render · Present.
          Header chỉ render ở màn ≥600px (cover đã tách Dashboard riêng) nên luôn hiện. */}
      <div className="shrink-0">
        <PhaseSwitcher />
      </div>

      {/* Nút Tải lên — hành vi theo chặng (Concept: moodboard · Render: import node · Present: studio) */}
      <UploadButton />

      {/* Núm chọn mức phụ thuộc AI (4 mức) — mobile gom vào ⋯ */}
      <div className="hidden sm:block">
        <AiTierMenu />
      </div>

      <div className="min-w-2 flex-1" />

      {/* run flow — nút chính, press-scale */}
      <motion.button
        {...pressable}
        onClick={() => runFlow()}
        disabled={isRunningFlow}
        title={tr('Chạy flow', 'Run flow')}
        className="flex shrink-0 items-center gap-1.5 rounded-[10px] bg-[var(--accent-strong)] px-2.5 py-1.5 text-xs font-medium text-white shadow-sm transition-[background-color,transform] duration-200 ease-[cubic-bezier(.32,.72,0,1)] hover:bg-[var(--accent)] disabled:opacity-50 sm:px-3"
      >
        {isRunningFlow ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
        <span className="hidden sm:inline">{tr('Chạy flow', 'Run flow')}</span>
      </motion.button>

      {/* cụm control phụ — desktop inline; mobile (<sm) gom vào ⋯ bên dưới.
          Progressive disclosure: chỉ Tasks + user luôn hiện; credits/share/chat/theme/lang
          gom vào popover ⋯ (More), bấm mới xổ — bar gọn hơn nhiều. */}
      <div className="hidden items-center gap-2 sm:flex sm:gap-2.5">
        {/* tasks — luôn hiện (trạng thái job quan trọng) */}
        <div className="relative shrink-0">
          <motion.button
            {...pressable}
            onClick={() => setTasksOpen(!tasksOpen)}
            className={cn(
              'flex items-center gap-1.5 rounded-[10px] border px-2.5 py-1.5 text-xs transition-colors duration-200 ease-[cubic-bezier(.32,.72,0,1)]',
              tasksOpen
                ? 'border-[var(--accent-ring)] bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'border-[var(--border)] text-[var(--t2)] hover:bg-[var(--hover)]',
            )}
          >
            {tr('Việc', 'Tasks')}
            {activeJobs > 0 && (
              <span className="grid h-4 min-w-4 place-items-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-semibold text-white">
                {activeJobs}
              </span>
            )}
            <ChevronDown size={12} className={cn('transition-transform duration-200 ease-[cubic-bezier(.32,.72,0,1)]', tasksOpen && 'rotate-180')} />
          </motion.button>
          <AnimatePresence>{tasksOpen && <TasksDropdown />}</AnimatePresence>
        </div>

        {/* ⋯ More — gom control phụ, chỉ xổ khi bấm (progressive disclosure) */}
        <MoreMenu />

        {/* user chip + logout — luôn hiện */}
        <UserChip />
      </div>

      {/* overflow ⋯ — chỉ hiện <sm, gom credits/share/chat/theme/tasks/AI/phase/user */}
      <MobileMenu />
    </header>
  );
}

/**
 * MoreMenu — popover "⋯" gom control phụ (credits · share · chat · theme · ngôn ngữ).
 * Progressive disclosure: bar mặc định gọn, bấm ⋯ mới lộ chi tiết.
 */
function MoreMenu() {
  const tr = useT();
  const credits = useFlowStore((s) => s.credits);
  const [open, setOpen] = useState(false);

  return (
    <div className="relative shrink-0">
      <motion.button
        {...pressable}
        onClick={() => setOpen((o) => !o)}
        title={tr('Thêm', 'More')}
        aria-expanded={open}
        className={cn(
          'grid h-8 w-8 place-items-center rounded-[10px] border transition-colors duration-200 ease-[cubic-bezier(.32,.72,0,1)]',
          open
            ? 'border-[var(--accent-ring)] bg-[var(--accent-soft)] text-[var(--accent)]'
            : 'border-[var(--border)] text-[var(--t2)] hover:bg-[var(--hover)]',
        )}
      >
        <MoreHorizontal size={15} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.18, ease: easeApple }}
              className="mat-panel absolute right-0 top-9 z-40 w-56 rounded-[14px] border border-[var(--border)] p-2 shadow-xl"
            >
              {/* credits */}
              <div className="mb-2 flex items-center justify-between rounded-[10px] bg-[var(--field)] px-2.5 py-1.5 text-xs text-[var(--t2)]">
                <span className="flex items-center gap-1.5">
                  <Coins size={13} className="text-amber-400" />
                  {tr('Tín dụng', 'Credits')}
                </span>
                <span className="font-semibold text-[var(--t1)]">{credits}</span>
              </div>

              {/* hàng nút: share · chat · theme */}
              <div className="flex items-center gap-1.5">
                <ShareButton />
                <ChatToggle />
                <ThemeToggle />
              </div>

              {/* ngôn ngữ */}
              <div className="mt-2 flex items-center justify-between border-t border-[var(--border)] pt-2">
                <span className="pl-0.5 text-[11px] text-[var(--t4)]">{tr('Ngôn ngữ', 'Language')}</span>
                <LangToggle />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

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
      {...pressable}
      onClick={onClick}
      onContextMenu={(e) => {
        // chuột phải = tắt share
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
        'flex shrink-0 items-center gap-1.5 rounded-[10px] border px-2.5 py-1.5 text-xs transition-colors duration-200 ease-[cubic-bezier(.32,.72,0,1)]',
        shareToken
          ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
          : 'border-[var(--border)] text-[var(--t2)] hover:bg-[var(--hover)]',
      )}
    >
      {copied ? <Check size={13} /> : <Share2 size={13} />}
      <span className="hidden md:inline">{copied ? tr('Đã copy', 'Copied') : tr('Chia sẻ', 'Share')}</span>
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
      whileHover={{ scale: 1.06 }}
      onClick={() => setChatOpen(!chatOpen)}
      title={tr('Chat nội bộ team', 'Team chat')}
      className={cn(
        'grid h-8 w-8 shrink-0 place-items-center rounded-[10px] border transition-colors',
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
  const tr = useT();
  if (!user) return null;
  return (
    <div className="flex shrink-0 items-center gap-1.5 rounded-[10px] border border-[var(--border)] py-1 pl-2 pr-1 text-xs text-[var(--t2)]">
      <span className="hidden max-w-24 truncate sm:inline" title={`${user.name} · ${user.email}${user.isAdmin ? ' · admin' : ''}`}>
        {user.name}
      </span>
      <motion.button
        {...pressableIcon}
        title={tr('Đăng xuất', 'Sign out')}
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
  const tr = useT();
  const next = pref === 'auto' ? 'light' : pref === 'light' ? 'dark' : 'auto';
  const Icon = pref === 'auto' ? SunMoon : pref === 'light' ? Sun : Moon;
  return (
    <motion.button
      {...pressableIcon}
      whileHover={{ scale: 1.06 }}
      onClick={() => setThemePref(next)}
      title={
        pref === 'auto'
          ? tr(
              `Theme: tự động theo giờ (sáng 6h30–18h) — đang ${applied === 'light' ? 'sáng' : 'tối'}. Bấm để chuyển.`,
              `Theme: auto by time (light 6:30–18:00) — now ${applied === 'light' ? 'light' : 'dark'}. Click to switch.`,
            )
          : tr(
              `Theme: ${pref === 'light' ? 'sáng' : 'tối'} cố định. Bấm để chuyển.`,
              `Theme: ${pref === 'light' ? 'light' : 'dark'} fixed. Click to switch.`,
            )
      }
      className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] border border-[var(--border)] text-[var(--t3)] transition-colors duration-200 ease-[cubic-bezier(.32,.72,0,1)] hover:bg-[var(--hover)] hover:text-[var(--t1)]"
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

// Trục điều hướng DUY NHẤT: Concept · Render đổi chặng tại chỗ (canvas) · Present → slide studio.
function PhaseSwitcher() {
  const workspace = useFlowStore((s) => s.workspace);
  const setWorkspace = useFlowStore((s) => s.setWorkspace);
  const router = useRouter();
  const current: Phase = workspace ?? DEFAULT_PHASE;
  // Lớp phủ fade khi rời sang /present-editor — mask cú "nhảy" route (khựng).
  const [leaving, setLeaving] = useState(false);

  // Prefetch sớm route studio ngay khi switcher mount → chuyển gần như tức thì, bớt khựng.
  useEffect(() => {
    router.prefetch('/present-editor');
    router.prefetch('/cad-editor');
  }, [router]);

  return (
    <>
      <StageSwitcher
        active={current}
        onPick={(p) => {
          if (p === 'present') {
            setLeaving(true); // bật overlay fade trước, rồi mới điều hướng
            // A-4 (bridge Render→Present): slide đã render trong flow (Export Deck / Slide
            // Composer) theo người dùng sang /present-editor — stash consume-once; storage
            // hỏng có fallback bộ nhớ. Flow không có slide ⇒ mảng rỗng, stash bỏ qua,
            // luồng cũ nguyên vẹn.
            stashPresentHandoff(deckImagesFromNodes(useFlowStore.getState().nodes));
            router.push('/present-editor');
          } else if (p === 'concept') {
            // Chặng 1 = Layout CAD → trình vẽ 2D ở route riêng (cùng pattern fade như Present).
            setLeaving(true);
            router.push('/cad-editor');
          } else setWorkspace(p);
        }}
      />
      {/* Overlay che toàn màn khi rời trang: mắt thấy fade nhẹ thay vì giật route. */}
      <AnimatePresence>
        {leaving && (
          <motion.div
            variants={fade}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-[100] bg-[var(--bg)]"
          />
        )}
      </AnimatePresence>
    </>
  );
}

// Núm chọn mức phụ thuộc AI — 4 mức (Cao cloud · Vừa · Tự-host 0đ · Không AI).
const TIER_ICON: Record<AiTier, typeof Cloud> = { 4: Cloud, 3: Zap, 2: Cpu, 1: ShieldCheck };
const TIER_TONE: Record<AiTier, string> = {
  4: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
  3: 'border-violet-500/40 bg-violet-500/10 text-violet-300',
  2: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  1: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
};

/** null = chưa biết (đang check); true/false = provider của mức đó sẵn sàng chưa. */
function tierAvailable(tier: AiTier, engine: OneAiEngine, status: ProviderStatus | null): boolean | null {
  const p = providerForTier(tier, engine);
  if (!p) return true; // mức 1 luôn "sẵn sàng"
  if (!status) return null;
  return p === 'fal' ? status.fal : p === 'comfyui' ? status.comfyui : status.sd;
}

function AiTierMenu() {
  const aiTier = useFlowStore((s) => s.aiTier);
  const setAiTier = useFlowStore((s) => s.setAiTier);
  const oneAiEngine = useFlowStore((s) => s.oneAiEngine);
  const setOneAiEngine = useFlowStore((s) => s.setOneAiEngine);
  const oneAiRuntime = useFlowStore((s) => s.oneAiRuntime);
  const setOneAiRuntime = useFlowStore((s) => s.setOneAiRuntime);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<ProviderStatus | null>(null);
  const tr = useT();

  useEffect(() => {
    checkProviders().then(setStatus);
  }, []);

  const meta = TIERS[aiTier];
  const Icon = TIER_ICON[aiTier];
  const avail = tierAvailable(aiTier, oneAiEngine, status);
  // badge của oneAI (mức 2) kèm tên engine đang chọn
  const engineName = aiTier === 2 ? ONE_AI_ENGINES.find((e) => e.id === oneAiEngine)?.name : null;

  return (
    <div className="relative">
      <motion.button
        {...pressable}
        data-testid="ai-tier"
        onClick={() => setOpen((o) => !o)}
        title={tr(
          'Mức phụ thuộc AI — bấm để đổi (Cao cloud · Vừa · Tự-host 0đ · Không AI)',
          'AI dependency level — click to switch (High cloud · Medium · Self-host free · No AI)',
        )}
        className={cn(
          'flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium',
          TIER_TONE[aiTier],
        )}
      >
        <Icon size={10} /> <span className="whitespace-nowrap">AI · {meta.name}</span>
        {/* tên engine chỉ hiện từ ≥lg — dưới đó badge bọc 2 dòng làm header cao lệch (bug 768px) */}
        {engineName && <span className="hidden whitespace-nowrap opacity-80 lg:inline">· {engineName}</span>}
        {avail === false && <span className="whitespace-nowrap text-amber-300/90">· mock</span>}
        <ChevronDown size={9} className={cn('transition-transform', open && 'rotate-180')} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.16, ease: easeApple }}
              className="mat-panel absolute left-0 top-8 z-40 w-72 rounded-[14px] border border-[var(--border)] p-1.5 shadow-xl"
            >
              <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--t4)]">
                {tr('Mức phụ thuộc AI', 'AI dependency')}
              </p>
              {TIER_ORDER.map((t) => {
                const m = TIERS[t];
                const TI = TIER_ICON[t];
                const a = tierAvailable(t, oneAiEngine, status);
                const active = t === aiTier;
                return (
                  <button
                    key={t}
                    onClick={() => {
                      setAiTier(t);
                      setOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-start gap-2 rounded-[10px] px-2 py-1.5 text-left transition-colors hover:bg-[var(--hover)]',
                      active && 'bg-[var(--accent-soft)]',
                    )}
                  >
                    <TI size={14} className="mt-0.5 shrink-0 text-[var(--t3)]" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-[var(--t1)]">{m.name}</span>
                        <span className="rounded bg-[var(--hover)] px-1 text-[9px] text-[var(--t4)]">{m.cost}</span>
                        {a === false && (
                          <span className="rounded bg-amber-500/15 px-1 text-[9px] text-amber-300">{tr('chạy mock', 'mock')}</span>
                        )}
                        {active && <Check size={11} className="ml-auto text-[var(--accent)]" />}
                      </div>
                      <p className="mt-0.5 text-[10px] leading-snug text-[var(--t4)]">{m.blurb}</p>
                    </div>
                  </button>
                );
              })}

              {/* oneAI (mức 2): chọn engine + runtime */}
              {aiTier === 2 && (
                <div className="mt-1 border-t border-[var(--border)] pt-1.5">
                  <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--t4)]">
                    oneAI — Engine
                  </p>
                  <div className="flex gap-1 px-1.5">
                    {ONE_AI_ENGINES.map((e) => {
                      const on = e.id === oneAiEngine;
                      return (
                        <button
                          key={e.id}
                          onClick={() => setOneAiEngine(e.id)}
                          title={e.blurb}
                          className={cn(
                            'flex-1 rounded-[9px] border px-2 py-1 text-[11px] font-medium transition-colors',
                            on
                              ? 'border-[var(--accent-ring)] bg-[var(--accent-soft)] text-[var(--accent)]'
                              : 'border-[var(--border)] text-[var(--t3)] hover:bg-[var(--hover)]',
                          )}
                        >
                          {e.name}
                        </button>
                      );
                    })}
                  </div>

                  {/* runtime chỉ áp cho engine SD-portable */}
                  {oneAiEngine === 'sd' && (
                    <>
                      <p className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--t4)]">
                        Runtime
                      </p>
                      <div className="flex gap-1 px-1.5 pb-1">
                        {ONE_AI_RUNTIMES.map((r) => {
                          const on = r.id === oneAiRuntime;
                          return (
                            <button
                              key={r.id}
                              onClick={() => setOneAiRuntime(r.id)}
                              title={r.blurb}
                              className={cn(
                                'flex-1 rounded-[9px] border px-2 py-1 text-[11px] font-medium transition-colors',
                                on
                                  ? 'border-[var(--accent-ring)] bg-[var(--accent-soft)] text-[var(--accent)]'
                                  : 'border-[var(--border)] text-[var(--t3)] hover:bg-[var(--hover)]',
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
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
