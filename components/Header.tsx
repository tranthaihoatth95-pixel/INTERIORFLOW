'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Share2, Play, Loader2, ChevronDown, MessageCircle, LogOut, Check, MoreHorizontal, Settings as SettingsIcon } from 'lucide-react';
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
import { stashPresentHandoffWithIds, deckImagesWithIdsFromNodes } from '@/lib/present-editor/handoff';
import { stageHrefFrom } from '@/lib/project-scope';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { IFLogo } from '@/components/entry/IFLogo';
import { UserAvatar } from '@/components/avatar/UserAvatar';
import { HomeButton } from '@/components/studio/HomeButton';
import { requestGallery } from '@/lib/resume';

export function Header() {
  const flowName = useFlowStore((s) => s.flowName);
  const workspace = useFlowStore((s) => s.workspace);
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
    // 2.2.60 (29/07, docs/CHOT-SO-MA-2026-07-29.md §D) — cụm giữa (flowname/phase/Tệp/AI-dot)
    // bọc riêng min-w-0+flex-1 để CHÍNH nó co lại/truncate TRƯỚC tiên khi hẹp, cụm phải
    // (Chạy flow · Tasks · Home · ⋯ · avatar) luôn shrink-0, không bao giờ bị đẩy khỏi màn.
    // ⚠️ KHÔNG đặt overflow-hidden trên <header> hay cụm giữa — đã thử và bỏ: header là ancestor
    // của mọi popover con (Tệp/MoreMenu/TasksDropdown/Vitals gesture), overflow-hidden ở đây
    // CẮT LUÔN các popover đó (chúng position:absolute vươn XUỐNG dưới mép header). Phép co
    // min-w-0+shrink+truncate tự đủ để không tràn ở 1024/1183/1440px (đã verify browser thật),
    // không cần clip.
    <header
      className="mat-header relative z-30 flex h-12 items-center gap-2 border-b border-[var(--border)] px-2 sm:gap-3 sm:px-3"
      // Phân định chặng — hairline đáy header mang tông chặng đang mở (cùng cách làm với
      // StudioBar ở 2 route studio, để app chính và studio đọc giống nhau). Pha loãng vào
      // --border nên vẫn là đường 1px trầm, không thành vạch màu.
      style={{
        borderBottomColor: `color-mix(in srgb, ${STAGE_TINT[workspace ?? DEFAULT_PHASE]} 55%, var(--border))`,
      }}
    >
      {/* logo — bấm điều hướng về Gallery (docs/RESEARCH-HOME-GALLERY-DASHBOARD.md §5.1
          quyết định 3). Đã ở route '/' nên requestGallery() dùng CustomEvent (nghe ở
          app/page.tsx) thay vì round-trip router.push('/') (không remount cùng route). */}
      <button
        type="button"
        onClick={() => requestGallery()}
        title="Về Gallery — InteriorFlow"
        className="flex shrink-0 items-center gap-2 border-none bg-transparent p-0"
      >
        {/* Logo IF chốt phương án "có khung" (IFLogo variant="framed") — 19/07 chủ dự án
            duyệt, thay badge gradient tím-hồng cũ. Đơn sắc currentColor nên tự ăn theo
            theme sáng/tối của app. */}
        <IFLogo size={26} variant="framed" className="shrink-0 text-[var(--t1)]" />
        <span className="hidden text-sm font-semibold tracking-tight text-[var(--t1)] lg:block">
          InteriorFlow
        </span>
      </button>

      <div className="mx-1 hidden h-5 w-px bg-[var(--border)] sm:block" />

      {/* Cụm giữa — co lại/cắt TRƯỚC tiên khi hẹp, để cụm phải (Chạy flow + avatar) luôn thấy. */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
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
            Header chỉ render ở màn ≥600px (cover đã tách Dashboard riêng) nên luôn hiện.
            data-tour: neo highlight cho SmartTour (B-5). */}
        <div className="shrink-0" data-tour="phase-switcher">
          <PhaseSwitcher />
        </div>

        {/* 2.2.60 (29/07) — 1 slot DUY NHẤT: chặng Render gộp "Thêm vào canvas" + Nhập +
            Xuất thành nút "Tệp" (RenderIOMenus, viết lại — xem file đó). Chặng khác vẫn
            UploadButton cũ (hành vi theo chặng: moodboard/nội dung slide). */}
        {(workspace ?? 'render') === 'render' ? <RenderIOMenus /> : <UploadButton />}

        {/* 2.2.61 (29/07) — Mức phụ thuộc AI dời hẳn vào /settings (cấu hình toàn cục,
            không phải nút thao tác). Thanh đầu chỉ giữ 1 chấm nhỏ, im lặng khi bình thường,
            chỉ hiện khi mức đang chọn đang chạy mock (xem AiDependencySettings.tsx). */}
        <AiStatusDot />
      </div>

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
              <span className="grid h-4 min-w-4 place-items-center rounded-full bg-[var(--accent)] px-1 text-[length:var(--fs-xs)] font-semibold text-white">
                {activeJobs}
              </span>
            )}
            <ChevronDown size={12} className={cn('transition-transform duration-200 ease-[cubic-bezier(.32,.72,0,1)]', tasksOpen && 'rotate-180')} />
          </motion.button>
          <AnimatePresence>{tasksOpen && <TasksDropdown />}</AnimatePresence>
        </div>

        {/* Home — CẠNH cụm Tin nhắn (chat toggle nằm trong MoreMenu ⋯). Dời 21/07 theo
            yêu cầu user, khỏi vị trí "trước trục Concept·Render·Present" cũ. */}
        <HomeButton compact />

        {/*
         * Notebook button đã BỎ khỏi Header — Vitals là entry point AI duy nhất
         * (state machine kéo giọt Vitals ở StageSwitcher: kéo lần 1 = popover
         * compact, kéo lần 2 hoặc bấm "Mở rộng" = mở /projects/[id]/notebook).
         * Chi tiết: components/studio/StageSwitcher.tsx + VitalsGesture.tsx.
         */}

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
 * MoreMenu — popover "⋯" gom control phụ (credits · share · chat · theme).
 * Progressive disclosure: bar mặc định gọn, bấm ⋯ mới lộ chi tiết.
 *
 * 7.3.30 (30/07, docs/TICKET-SETTINGS-GOM-CAU-HINH-2026-07-29.md): gỡ "Ngôn ngữ" và
 * "Xem lại hướng dẫn" khỏi đây — cả 2 là CẤU HÌNH đặt-rồi-quên (gần như không bao giờ đổi
 * lại trong 1 phiên), thuộc về /settings, không phải nút thao tác nhanh. Theme GIỮ NGUYÊN ở
 * đây (đổi nhiều lần/phiên theo ánh sáng phòng — đúng luật "nút nhanh" của ticket §4) +
 * cũng có ở /settings cho ai muốn đặt cố định. Credits GIỮ NGUYÊN (trạng thái xem, không
 * phải cấu hình đặt — luật phân biệt trong ticket §4).
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

              {/* Cài đặt — ngôn ngữ/avatar/xem lại hướng dẫn dời hết vào đây (7.3.30) */}
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
  const router = useRouter();
  const tr = useT();
  if (!user) return null;
  return (
    <div className="flex shrink-0 items-center gap-1.5 rounded-[10px] border border-[var(--border)] py-1 pl-1 pr-1 text-xs text-[var(--t2)]">
      {/* Avatar — bấm vào mở /settings/avatar. Chưa lưu config thì UserAvatar tự dựng
          bản random deterministic theo user.id, không bao giờ để trống. */}
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
  // Task #21: 3 chặng nằm dưới `/projects/[id]/…` — id lấy từ URL đang đứng để chuyển chặng
  // không rời dự án. Chưa xác định được dự án → stageHrefFrom trả route toàn cục cũ.
  const pathname = usePathname();
  const current: Phase = workspace ?? DEFAULT_PHASE;
  // Màn che khi rời chặng do StageTransitionProvider (root layout) giữ, KHÔNG còn state cục bộ:
  // veil nằm trong route cũ thì bị unmount ngay giữa lúc chuyển, sinh ra cú "chớp" nền phẳng.
  const { begin } = useStageTransition();

  // Prefetch sớm route studio ngay khi switcher mount → chuyển gần như tức thì, bớt khựng.
  useEffect(() => {
    router.prefetch(stageHrefFrom(pathname, 'present'));
    router.prefetch(stageHrefFrom(pathname, 'cad'));
  }, [router, pathname]);

  return (
    <>
      <StageSwitcher
        active={current}
        onPick={(p) => {
          if (p === 'present') {
            begin('present'); // bật màn che trước, rồi mới điều hướng
            // A-4 (bridge Render→Present): slide đã render trong flow (Export Deck / Slide
            // Composer) theo người dùng sang /present-editor — stash consume-once; storage
            // hỏng có fallback bộ nhớ. Flow không có slide ⇒ mảng rỗng, stash bỏ qua,
            // luồng cũ nguyên vẹn.
            stashPresentHandoffWithIds(deckImagesWithIdsFromNodes(useFlowStore.getState().nodes));
            router.push(stageHrefFrom(pathname, 'present'));
          } else if (p === 'concept') {
            // Chặng 1 = Layout CAD → trình vẽ 2D ở route riêng (cùng pattern fade như Present).
            begin('concept');
            router.push(stageHrefFrom(pathname, 'cad'));
          } else setWorkspace(p);
        }}
      />
    </>
  );
}

