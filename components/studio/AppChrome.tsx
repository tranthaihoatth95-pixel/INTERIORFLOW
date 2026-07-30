'use client';

/**
 * components/studio/AppChrome.tsx — THANH ĐẦU DUY NHẤT cho cả 4 route (7.3.31 mở rộng, 30/07,
 * docs/TICKET-STAGE-SWITCHER-NHAY-2026-07-30.md). Hợp nhất `Header.tsx` (route `/`, chặng
 * Rendering) + `StudioBar.tsx` (routes `/cad`, `/present-editor`, `/photo-editor`) — LỚP APP
 * CHROME (đăng nhập/tài khoản/cài đặt/điều hướng chặng) dùng CHUNG cho mọi route.
 *
 * KHÔNG gộp toolbar TÀI LIỆU (Mở tệp/Xuất/Sao lưu của CadEditor.tsx, cặp IOMenu của
 * PresentEditor's Toolbar.tsx, export PNG/JPEG của PhotoToolbar.tsx) — đó là lớp KHÁC, thuộc
 * bản vẽ/deck/ảnh đang mở, không thuộc app. Slot "Tệp" (RenderIOMenus/UploadButton) ở đây CHỈ
 * hiện khi `active==='render'`, vì Render KHÔNG có toolbar tài liệu riêng (flow/node-graph
 * chính LÀ tài liệu, xuất/nhập của nó luôn sống ở app chrome, không có lớp thứ 2 nào để dời
 * vào) — CAD/Present/Photo đã có toolbar tài liệu riêng của chúng, thêm 1 "Tệp" chung vào đây
 * sẽ TRÙNG (2 menu Nhập/Xuất cùng lúc trên 1 trang).
 *
 * PHẦN RIÊNG CHẶNG (chỉ `active==='render'`, không di chuyển đi đâu — không phải bug, không
 * phải "thiếu"): "Chạy flow" (chạy node-graph, CAD/Present không có), Tasks/AiStatusDot (hàng
 * đợi job AI, hôm nay chỉ Render gọi AI), `photoContext` badge (chỉ route `/photo-editor`),
 * `data-if-deselect-zone` (canvas 2D tự viết của CAD/Present cần marker này; canvas Render là
 * React Flow, đã tự deselect khi click nền, không cần marker).
 *
 * SỬA 2 LỖI (không phải gap) khi hợp nhất: (1) `SessionWatch` trước chỉ có ở StudioBar — route
 * `/` không báo hết phiên, tới lúc bấm Chạy flow mới bị đá login. (2) Không route nào ngoài `/`
 * có đường tới `/settings` (dựng ở 7.3.30 cùng ngày) — MoreMenu (kèm link Cài đặt) giờ universal.
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coins, Share2, Play, Loader2, ChevronDown, MessageCircle, LogOut, Check, MoreHorizontal,
  Settings as SettingsIcon,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useFlowStore } from '@/lib/store';
import { runFlow } from '@/lib/execution';
import { AiStatusDot } from '@/components/settings/AiDependencySettings';
import { DEFAULT_PHASE, STAGE_TINT, type Phase } from '@/lib/phases';
import StageSwitcher from '@/components/studio/StageSwitcher';
import { UploadButton } from '@/components/studio/UploadButton';
import { RenderIOMenus } from '@/components/studio/RenderIOMenus';
import { toggleShare } from '@/lib/workspace';
import { TasksDropdown } from '@/components/TasksDropdown';
import { MobileMenu } from '@/components/MobileMenu';
import { nextThemePref, themeIconFor } from '@/lib/theme-toggle';
import { pressable, pressableIcon, easeApple } from '@/lib/motion';
import { useStageTransition } from '@/components/studio/StageTransitionProvider';
import { stageHrefFrom } from '@/lib/project-scope';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { IFLogo } from '@/components/entry/IFLogo';
import { UserAvatar } from '@/components/avatar/UserAvatar';
import { HomeButton } from '@/components/studio/HomeButton';
import { requestGallery } from '@/lib/resume';
import SessionWatch from '@/components/studio/SessionWatch';
import { activeToPhase, pickStage } from '@/lib/studio/stage-nav';
import type { AppChromeActive } from '@/components/studio/AppChromeTypes';

export type { AppChromeActive };

interface Props {
  active: AppChromeActive;
}

export function AppChrome({ active }: Props) {
  const flowName = useFlowStore((s) => s.flowName);
  const workspace = useFlowStore((s) => s.workspace);
  const setFlowName = useFlowStore((s) => s.setFlowName);
  const isRunningFlow = useFlowStore((s) => s.isRunningFlow);
  const tasksOpen = useFlowStore((s) => s.tasksOpen);
  const setTasksOpen = useFlowStore((s) => s.setTasksOpen);
  const jobs = useFlowStore((s) => s.jobs);
  const applyTheme = useFlowStore((s) => s.applyTheme);
  const [editing, setEditing] = useState(false);
  const tr = useT();
  const router = useRouter();
  const pathname = usePathname();
  const { begin } = useStageTransition();

  const activeJobs = jobs.filter((j) => j.status === 'running' || j.status === 'queued').length;
  const currentPhase = activeToPhase(active);
  const tint = STAGE_TINT[active === 'render' ? (workspace ?? DEFAULT_PHASE) : currentPhase];

  // Route studio (cad/present/photo) đứng riêng, page không tự gọi hydrate/applyTheme — route
  // `/` đã có hydrate riêng nhưng gọi lại đây vô hại (applyTheme thuần, idempotent).
  useEffect(() => {
    applyTheme();
    router.prefetch(stageHrefFrom(pathname, 'render'));
    router.prefetch(stageHrefFrom(pathname, 'cad'));
    router.prefetch(stageHrefFrom(pathname, 'present'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Điều hướng chặng — logic dùng chung với MobileMenu's PhaseRow, xem lib/studio/stage-nav.ts.
  const onPick = (p: Phase) => pickStage(p, { active, pathname, router, begin });

  return (
    <header
      // data-if-deselect-zone: CHỈ cad/present/photo — canvas 2D tự viết của 2 route đó cần
      // marker này để click nền = deselect (xem PresentEditor.tsx). Render dùng React Flow,
      // đã tự deselect khi click nền, không cần marker (thêm vào sẽ vô nghĩa, không hại nhưng
      // cũng không lợi — bỏ qua cho đúng phạm vi "chỉ nơi cần").
      {...(active !== 'render' ? { 'data-if-deselect-zone': 'true' } : {})}
      className="mat-header relative z-30 flex h-12 items-center gap-2 border-b border-[var(--border)] px-2 sm:gap-3 sm:px-3"
      style={{ borderBottomColor: `color-mix(in srgb, ${tint} 55%, var(--border))` }}
    >
      <button
        type="button"
        onClick={() => {
          requestGallery();
          if (active !== 'render') router.push('/');
        }}
        title="Về Gallery — InteriorFlow"
        className="flex shrink-0 items-center gap-2 border-none bg-transparent p-0"
      >
        <IFLogo size={26} variant="framed" className="shrink-0 text-[var(--t1)]" />
        <span className="hidden text-sm font-semibold tracking-tight text-[var(--t1)] lg:block">
          InteriorFlow
        </span>
      </button>

      <div className="mx-1 hidden h-5 w-px bg-[var(--border)] sm:block" />

      {/* 30/07 — TÁI CẤU TRÚC (sửa nốt phần overlap 1024px của 7.3.31, thay bản "co lại/cắt" cũ):
          "Tệp" về cụm trái cạnh logo (đúng quy ước menu File, vẫn CHỈ active==='render' — không
          đổi lớp, xem ghi chú đầu file). StageSwitcher ra làm con TRỰC TIẾP shrink-0 của header
          — khớp yêu cầu "3 nút chặng đứng yên một chỗ" của 7.3.31, không còn sống trong hộp co. */}
      {active === 'render' && ((workspace ?? 'render') === 'render' ? <RenderIOMenus /> : <UploadButton />)}

      {/* LUẬT (đã vỡ 1 lần, 30/07 — Tệp/StageSwitcher từng sống ở đây, cả 2 đều shrink-0, tràn
          khỏi hộp bị bóp nhỏ hơn nội dung → "Chạy flow" vẽ sau trong DOM nên đè lên phần tràn,
          KHÔNG phải z-index/stacking quirk): hộp `flex-1 min-w-0` CHỈ được chứa thứ CO ĐƯỢC.
          Mọi shrink-0 đặt trong nó sẽ tràn ra ngoài và bị phần tử vẽ sau đè lên. KHÔNG chữa bằng
          overflow-hidden (cắt popover con — đã thử, bỏ, xem Header.tsx cũ trước 7.3.31). */}
      {/* overflow-hidden CHỈ ở đây (an toàn — hộp này không chứa popover nào, khác cụm giữa cũ
          bị cấm overflow-hidden vì có Tệp/MoreMenu). Không có nó: khi flex bóp hộp này xuống gần
          0, nút tên dự án vẫn cần 1 mức rộng tối thiểu để vẽ (padding + 1 ký tự + "…") và TRÀN
          khỏi hộp — đè lên StageSwitcher (phát hiện 30/07, đo được 4px chồng ở 1024px). */}
      <div className="flex min-w-0 flex-1 items-center overflow-hidden">
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
            className="min-w-0 truncate rounded-[10px] px-2 py-1 text-sm text-[var(--t2)] transition-colors hover:bg-[var(--hover)]"
            onClick={() => setEditing(true)}
            title={tr('Đổi tên dự án', 'Rename project')}
          >
            {flowName}
          </motion.button>
        )}
      </div>

      <div className="shrink-0" data-tour="phase-switcher">
        <StageSwitcher active={currentPhase} onPick={onPick} photoContext={active === 'photo'} />
      </div>

      {active === 'render' && <AiStatusDot />}

      {/* Chạy flow — CHỈ Render (node-graph để chạy). */}
      {active === 'render' && (
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
      )}

      <div className="hidden items-center gap-2 sm:flex sm:gap-2.5">
        {active === 'render' && (
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
                <span className="grid h-4 min-w-4 place-items-center rounded-full bg-[var(--accent)] px-1 text-[length:var(--fs-xs)] font-semibold text-white">
                  {activeJobs}
                </span>
              )}
              <ChevronDown size={12} className={cn('transition-transform duration-200 ease-[cubic-bezier(.32,.72,0,1)]', tasksOpen && 'rotate-180')} />
            </motion.button>
            <AnimatePresence>{tasksOpen && <TasksDropdown />}</AnimatePresence>
          </div>
        )}

        <HomeButton compact />
        <MoreMenu />
        <UserChip />
      </div>

      {/* SessionWatch — universal (30/07, sửa lỗi: trước chỉ StudioBar có, route `/` không báo
          hết phiên giữa chừng). Dải báo fixed đáy màn, không chặn thao tác. */}
      <SessionWatch />

      <MobileMenu active={active} />
    </header>
  );
}

/**
 * MoreMenu — popover "⋯" gom control phụ (credits · theme · share · chat · settings). Universal
 * 4 route (30/07) — trước chỉ có ở Header, StudioBar không có đường tới /settings/Share/Credits/
 * logout nào cả (UserChip cũng thiếu, xem bên dưới). Theme ở ĐÂY, không tách nút đứng riêng ở
 * cụm phải: thử tách riêng đã vỡ bất biến priority+ (2.2.60) ở 1024px — nút luôn-hiện mới chiếm
 * thêm ~32-40px làm "Chạy flow" bị đè sau "Tệp"; bản gốc Header.tsx để theme trong ⋯ vì đúng lý do
 * đó, giữ nguyên cấu trúc an toàn này.
 */
function MoreMenu() {
  const tr = useT();
  const credits = useFlowStore((s) => s.credits);
  const [open, setOpen] = useState(false);
  const router = useRouter();

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
              <div className="mb-2 flex items-center justify-between rounded-[10px] bg-[var(--field)] px-2.5 py-1.5 text-xs text-[var(--t2)]">
                <span className="flex items-center gap-1.5">
                  <Coins size={13} className="text-amber-400" />
                  {tr('Tín dụng', 'Credits')}
                </span>
                <span className="font-semibold text-[var(--t1)]">{credits}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <ThemeToggle />
                <ShareButton />
                <ChatToggle />
              </div>

              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  router.push('/settings');
                }}
                className="mt-2 flex w-full items-center gap-2 rounded-[10px] border-t border-[var(--border)] px-0.5 pt-2 text-[11.5px] text-[var(--t3)] transition-colors hover:text-[var(--t1)]"
              >
                <SettingsIcon size={13} />
                {tr('Cài đặt', 'Settings')}
              </button>
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
  const router = useRouter();
  const tr = useT();
  if (!user) return null;
  return (
    <div className="flex shrink-0 items-center gap-1.5 rounded-[10px] border border-[var(--border)] py-1 pl-1 pr-1 text-xs text-[var(--t2)]">
      <motion.button
        {...pressableIcon}
        onClick={() => router.push('/settings/avatar')}
        title={tr('Đổi avatar', 'Change avatar')}
        className="grid h-6 w-6 shrink-0 place-items-center overflow-hidden rounded-full"
      >
        <UserAvatar id={user.id} avatar={user.avatar} name={user.name} size={24} frame={false} />
      </motion.button>
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

/** Nút đổi theme — sống trong popover MoreMenu (⋯), không đứng riêng ở cụm phải (xem ghi chú
 * ở MoreMenu() phía trên: đứng riêng vỡ bất biến priority+ ở 1024px). */
function ThemeToggle() {
  const pref = useFlowStore((s) => s.themePref);
  const applied = useFlowStore((s) => s.appliedTheme);
  const setThemePref = useFlowStore((s) => s.setThemePref);
  const tr = useT();
  const next = nextThemePref(pref);
  const Icon = themeIconFor(pref);
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
