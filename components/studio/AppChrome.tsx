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
 * phải "thiếu"): Tasks/AiStatusDot (hàng đợi job AI, hôm nay chỉ Render gọi AI), `photoContext`
 * badge (chỉ route `/photo-editor`), `data-if-deselect-zone` (canvas 2D tự viết của CAD/Present
 * cần marker này; canvas Render là React Flow, đã tự deselect khi click nền, không cần marker).
 *
 * SỬA 2 LỖI (không phải gap) khi hợp nhất: (1) `SessionWatch` trước chỉ có ở StudioBar — route
 * `/` không báo hết phiên giữa chừng. (2) Không route nào ngoài `/` có đường tới `/settings`
 * (dựng ở 7.3.30 cùng ngày) — MoreMenu (kèm link Cài đặt) giờ universal.
 *
 * 2.2.86 (30/07, Hoà chốt) — nút "Chạy flow" ĐÃ XOÁ khỏi bar (không phải ẩn có điều kiện như
 * trước — xoá hẳn). Khởi chạy chuyển hết sang cạnh đối tượng (▶ node, "Kết xuất" thẻ Tool Mode,
 * "Run flow" Command Palette) + hàng đợi trong menu "Việc" — xem lib/execution.ts.
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useFlowStore } from '@/lib/store';
import { AiStatusDot } from '@/components/settings/AiDependencySettings';
import { DEFAULT_PHASE, STAGE_TINT, type Phase } from '@/lib/phases';
import StageSwitcher from '@/components/studio/StageSwitcher';
import { UploadButton } from '@/components/studio/UploadButton';
import { RenderIOMenus } from '@/components/studio/RenderIOMenus';
import { TasksDropdown } from '@/components/TasksDropdown';
import { MobileMenu } from '@/components/MobileMenu';
import { pressable } from '@/lib/motion';
import { useStageTransition } from '@/components/studio/StageTransitionProvider';
import { stageHrefFrom } from '@/lib/project-scope';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { IFLogo } from '@/components/entry/IFLogo';
import { UserAvatar } from '@/components/avatar/UserAvatar';
import { AccountMenu } from '@/components/AccountMenu';
import { HomeButton } from '@/components/studio/HomeButton';
import { requestGallery } from '@/lib/resume';
import SessionWatch from '@/components/studio/SessionWatch';
import ShortcutsPanel from '@/components/ShortcutsPanel';
import { activeToPhase, pickStage } from '@/lib/studio/stage-nav';
import { useDismissable } from '@/lib/useDismissable';
import type { AppChromeActive } from '@/components/studio/AppChromeTypes';

export type { AppChromeActive };

/**
 * K4 (`docs/TICKET-FIX-KINH-HEADER-2026-08-02.md`) — 2 dropdown `mat-panel` (MoreMenu/UserChip)
 * TRƯỚC là con của `<header class="mat-header">` (cũng có backdrop-filter riêng) → "kính lồng
 * kính": blur của menu chỉ sample trong phạm vi header, không thấy canvas dưới, chữ node xuyên
 * qua rõ nét. Sửa: PORTAL panel ra `document.body`, định vị `position:fixed` theo
 * `getBoundingClientRect()` của nút bấm — thoát hẳn khỏi backdrop root của header. Animation
 * `motion.div` GIỮ NGUYÊN (không đổi sang Popover.tsx — component đó không có
 * AnimatePresence enter/exit tích hợp kiểu này, dùng thẳng sẽ mất animation hiện có).
 */
function useMenuAnchor() {
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<{ top: number; right: number } | null>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setAnchorRect({ top: r.bottom + 6, right: Math.max(8, window.innerWidth - r.right) });
  }, [open]);

  return { triggerRef, menuRef, open, setOpen, anchorRect };
}

interface Props {
  active: AppChromeActive;
}

export function AppChrome({ active }: Props) {
  const flowName = useFlowStore((s) => s.flowName);
  const workspace = useFlowStore((s) => s.workspace);
  const setFlowName = useFlowStore((s) => s.setFlowName);
  const tasksOpen = useFlowStore((s) => s.tasksOpen);
  const setTasksOpen = useFlowStore((s) => s.setTasksOpen);
  const flowRuns = useFlowStore((s) => s.flowRuns);
  const applyTheme = useFlowStore((s) => s.applyTheme);
  const [editing, setEditing] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const tr = useT();
  const router = useRouter();
  const pathname = usePathname();
  const { begin } = useStageTransition();

  // 2.2.90 ĐỢT 2 (01/08) — Tasks dropdown trước đây 0 logic đóng (không bấm-ra-ngoài, không
  // Escape) — THÊM hành vi qua hook dùng chung, khác biệt được phép duy nhất của đợt này.
  const tasksRef = useRef<HTMLDivElement>(null);
  useDismissable({ open: active === 'render' && tasksOpen, onDismiss: () => setTasksOpen(false), refs: [tasksRef] });

  // 2.2.86 (30/07) — badge "Việc" = số lượt ĐANG CHẠY + ĐANG CHỜ (không phải số job lẻ như cũ),
  // đúng đơn vị FlowRun mới. "Liếc là biết" — không cần mở menu mới thấy có gì đang bận.
  const activeJobs = flowRuns.filter((r) => r.status === 'running' || r.status === 'queued').length;
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

  // 7.3.33 (31/07) — ⌘/ (và phím phụ ?) mở bảng tra phím tắt, TOÀN CỤC vì AppChrome universal
  // 4 route (không giống ⌘K của CommandPalette.tsx, chỉ sống ở HomeScreen). '?' cũng chạy khi
  // KHÔNG giữ Shift (một số bàn phím gửi '?' trực tiếp không cần Shift+/ tuỳ layout) — chặn khi
  // đang gõ INPUT/TEXTAREA (đổi tên dự án, ô lệnh CAD…), cùng khuôn input-guard các nơi khác.
  // 'shortcuts:open' — CustomEvent bridge cho mục "Phím tắt" trong CommandPalette.tsx (nơi đó
  // không có state cục bộ của AppChrome), cùng pattern cad:*-request đã dùng khắp app.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (((e.metaKey || e.ctrlKey) && e.key === '/') || e.key === '?') {
        e.preventDefault();
        setShortcutsOpen((v) => !v);
      }
    };
    const onOpenEvent = () => setShortcutsOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('shortcuts:open', onOpenEvent);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('shortcuts:open', onOpenEvent);
    };
  }, []);

  // Điều hướng chặng — logic dùng chung với MobileMenu's PhaseRow, xem lib/studio/stage-nav.ts.
  const onPick = (p: Phase) => pickStage(p, { active, pathname, router, begin });

  /**
   * 30/07 — THANG ƯU TIÊN NHƯỜNG CHỖ khi hẹp dần (PatternFly priority+, IF theo từ 2.2.60).
   * Phát hiện 1024px thiếu ~23px ngay cả khi tên dự án co về 0 (docs/VERIFY-7.3.31.md mục 4) —
   * đây là chuẩn responsive, không phải quyết định sản phẩm (Luật #10), làm ngay không hỏi:
   *   1. wordmark "InteriorFlow" → chỉ còn logomark        (≥1280px mới hiện chữ, xem span dưới)
   *   2. "Đăng xuất" → vào menu bấm-avatar (KHÔNG theo breakpoint — đúng ở MỌI kích thước, hành
   *      động phá huỷ không đứng trần trụi ngoài thanh, xem UserChip())
   *   3. Home → gộp vào ⋯                                   (CHƯA LÀM — chỉ khi đo vẫn thiếu)
   *   4. "Việc" → gộp vào ⋯                                  (CHƯA LÀM — chỉ khi đo vẫn thiếu)
   *   5. "Tệp" → còn icon, bỏ chữ                            (CHƯA LÀM — chỉ khi đo vẫn thiếu)
   * KHÔNG BAO GIỜ nhường: StageSwitcher · avatar · nút ⋯. Bậc 1+2 đã đủ bù 23px thiếu ở 1024px
   * (xác nhận bằng số ở docs/VERIFY-7.3.31.md mục 5) — 3/4/5 để dành, không làm trước khi cần.
   */
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
        {/* 30/07 — bậc ① thang ưu tiên nhường chỗ (xem comment đầu <header>): wordmark chỉ hiện
            ≥1280px (xl), không phải ≥1024px (lg) — lg là breakpoint CHẬT NHẤT, bật chữ ngay đó
            là sai hướng ưu tiên. Logomark (IFLogo) luôn hiện, mọi kích thước. */}
        <span className="hidden text-sm font-semibold tracking-tight text-[var(--t1)] xl:block">
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

      {/* 2.2.86 (30/07, Hoà chốt) — "Chạy flow" KHÔNG còn đứng riêng trên bar (~110px trả lại
          ngân sách bề rộng). Khởi chạy giờ CẠNH ĐỐI TƯỢNG: nút ▶ trên node, "Kết xuất" trên thẻ
          Tool Mode, "Run flow" ở Command Palette (⌘K) — cả ba đều xếp hàng qua cùng 1 hàng đợi
          (lib/execution.ts). Theo dõi/huỷ ở menu "Việc" (TasksDropdown) — xem badge số dưới đây. */}

      {/* 7.3.32 (31/07) — mốc "hiện đủ 4 nút" đẩy từ sm(640) sang lg(1024): ở 640-1023px cụm
          này cộng Tệp/AiStatusDot (route render) tràn 819px cứng bất kể viewport. MobileMenu
          (sm:hidden trước đây, nay lg:hidden) đã có sẵn Tasks+Home+account+actions trong bottom
          sheet — chỉ cần đẩy cùng mốc, không viết UI mới. */}
      <div className="hidden items-center gap-2 lg:flex lg:gap-2.5">
        {active === 'render' && (
          <div ref={tasksRef} className="relative shrink-0">
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
        <UserChip />
      </div>

      {/* SessionWatch — universal (30/07, sửa lỗi: trước chỉ StudioBar có, route `/` không báo
          hết phiên giữa chừng). Dải báo fixed đáy màn, không chặn thao tác. */}
      <SessionWatch />

      <MobileMenu active={active} />

      <ShortcutsPanel open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} active={active} />
    </header>
  );
}

/**
 * 30/07 — bậc ② thang ưu tiên nhường chỗ (xem comment đầu <header>): "Đăng xuất" KHÔNG còn là nút
 * rời cạnh avatar — vào trong menu bấm-avatar-để-mở, chuẩn Google/Figma/Notion/Slack/GitHub cho
 * hành động PHÁ HUỶ (mất phiên) không đặt trần trụi ngoài thanh. Không phải responsive (không ẩn
 * theo breakpoint) — đây là ĐÚNG chuẩn ở mọi kích thước, tiện thể trả lại ~1 nút rời chiều rộng.
 */
function UserChip() {
  const user = useFlowStore((s) => s.user);
  const { triggerRef, menuRef, open, setOpen, anchorRect } = useMenuAnchor();
  // 2.2.90 ĐỢT 2 (01/08) — thay backdrop `fixed inset-0` bằng hook dùng chung, cùng lý do đã
  // ghi ở MoreMenu() phía trên (click-xuyên-qua + thêm Escape). K4 — 2 ref riêng, xem MoreMenu().
  useDismissable({ open, onDismiss: () => setOpen(false), refs: [triggerRef, menuRef] });
  if (!user) return null;
  return (
    <div ref={triggerRef} className="relative shrink-0">
      <motion.button
        {...pressable}
        onClick={() => setOpen((o) => !o)}
        title={`${user.name} · ${user.email}${user.isAdmin ? ' · admin' : ''}`}
        aria-expanded={open}
        className={cn(
          'flex items-center gap-1.5 rounded-[10px] border py-1 pl-1 pr-2 text-xs transition-colors duration-200 ease-[cubic-bezier(.32,.72,0,1)]',
          open
            ? 'border-[var(--accent-ring)] bg-[var(--accent-soft)] text-[var(--accent)]'
            : 'border-[var(--border)] text-[var(--t2)] hover:bg-[var(--hover)]',
        )}
      >
        <span className="grid h-6 w-6 shrink-0 place-items-center overflow-hidden rounded-full">
          <UserAvatar id={user.id} avatar={user.avatar} name={user.name} size={24} frame={false} />
        </span>
        <span className="hidden max-w-24 truncate sm:inline">{user.name}</span>
      </motion.button>

      <AccountMenu
        open={open}
        anchorRect={anchorRect ? { top: anchorRect.top, right: anchorRect.right } : null}
        onDismiss={() => setOpen(false)}
        menuRef={menuRef}
      />
    </div>
  );
}

