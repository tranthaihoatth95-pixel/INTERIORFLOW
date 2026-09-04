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
import { motion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { useFlowStore } from '@/lib/store';
import { DEFAULT_PHASE, STAGE_TINT, type Phase } from '@/lib/phases';
import { MobileMenu } from '@/components/MobileMenu';
// P-V 17/08 — ô tìm dự án + Vitals ở top bar (chỉ Home; chặng có Vitals cạnh trục phải riêng).
import SearchProjectsInput from '@/components/SearchProjectsInput';
import { VitalsAperture } from '@/components/studio/VitalsAperture';
import { changTheoDuong } from '@/components/studio/vitals-tin-hieu';
import { pressable } from '@/lib/motion';
import { useStageTransition } from '@/components/studio/StageTransitionProvider';
import { stageHrefFrom } from '@/lib/project-scope';
import { useT } from '@/lib/i18n';
import { IFLogo } from '@/components/entry/IFLogo';
import { goHomeConfirmed } from '@/lib/resume';
import SessionWatch from '@/components/studio/SessionWatch';
import ShortcutsPanel from '@/components/ShortcutsPanel';
import { AppLogoMenu } from '@/components/studio/AppLogoMenu';
import { LeaveConfirmBar } from '@/components/studio/LeaveConfirmBar';
import { LockScreen } from '@/components/studio/LockScreen';
import { useLockScreen, lockScreenNow, getLockIdleMinutes } from '@/lib/lockscreen';
import { getLastUserId } from '@/lib/resume';
import { useDismissable } from '@/lib/useDismissable';
import { openLibrarySheet } from '@/lib/library/use-library-sheet';
import { activeToPhase, pickStage } from '@/lib/studio/stage-nav';
import type { AppChromeActive } from '@/components/studio/AppChromeTypes';

export type { AppChromeActive };

interface Props {
  active: AppChromeActive;
  /** VIỆC 2 (`AppShell`, hiện chỉ CAD dùng) — bật thì logo mở `AppLogoMenu` (4 mục xuyên app)
   * thay vì điều hướng thẳng Gallery, và header cao 42px đúng `SPEC-HA-TANG-UI-IF` Trụ 1.
   * Mặc định false: Render/Present (còn `StageShell` cũ) giữ NGUYÊN hành vi/kích thước cũ —
   * đổi behavior toàn cục ở đây sẽ ảnh hưởng 2 chặng chưa verify theo khung mới. */
  logoMenu?: boolean;
}

export function AppChrome({ active, logoMenu }: Props) {
  const flowName = useFlowStore((s) => s.flowName);
  const workspace = useFlowStore((s) => s.workspace);
  const setFlowName = useFlowStore((s) => s.setFlowName);
  const applyTheme = useFlowStore((s) => s.applyTheme);
  const [editing, setEditing] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [logoMenuOpen, setLogoMenuOpen] = useState(false);
  const onPickRef = useRef<(p: Phase) => void>(() => {});
  // VIỆC 2 UI (04/08) — ref cho handler ⌘0/⌘B/⌘L (effect deps rỗng, cùng lý do onPickRef trên:
  // tránh re-subscribe mỗi lần active đổi, luôn đọc closure mới nhất).
  const activeRef = useRef(active);
  activeRef.current = active;
  const logoRef = useRef<HTMLButtonElement>(null);
  const logoMenuRef = useRef<HTMLDivElement>(null);
  const [logoAnchor, setLogoAnchor] = useState<{ top: number; left: number } | null>(null);
  const tr = useT();
  const router = useRouter();
  const pathname = usePathname();
  const { begin } = useStageTransition();

  useLayoutEffect(() => {
    if (!logoMenuOpen) return;
    const el = logoRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setLogoAnchor({ top: r.bottom + 6, left: r.left });
  }, [logoMenuOpen]);
  useDismissable({ open: logoMenuOpen, onDismiss: () => setLogoMenuOpen(false), refs: [logoRef, logoMenuRef] });

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
      // VIỆC 3 UI (04/08) — ⌃⌘Q khoá màn NGAY, kể cả đang gõ dở (đúng hành vi macOS thật, phím
      // này không bao giờ gõ ra ký tự nên an toàn đặt TRƯỚC input-guard bên dưới).
      if (e.ctrlKey && e.metaKey && e.key.toLowerCase() === 'q') {
        e.preventDefault();
        lockScreenNow();
        return;
      }
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (((e.metaKey || e.ctrlKey) && e.key === '/') || e.key === '?') {
        e.preventDefault();
        setShortcutsOpen((v) => !v);
      }
      // CHINH-4 (SPEC-PANEL-ROLLOUT-IDF §4a) — ⌘1/⌘2/⌘3 sang chặng 2D Kỹ thuật · 3D Thiết kế ·
      // Trình bày (03/08 CHỐT TÊN vòng cuối).
      // Đặt ở AppChrome (không phải AppShell) vì pickStage cần đủ bộ {active,pathname,router,
      // begin} đã wire sẵn tại đây — không nhân đôi dây.
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && (e.key === '1' || e.key === '2' || e.key === '3')) {
        e.preventDefault();
        const target: Phase = e.key === '1' ? 'concept' : e.key === '2' ? 'render' : 'present';
        onPickRef.current(target);
      }
      // VIỆC 2 UI (04/08, docs/SO-KIEM-TONG.md) — 3 phím toàn cục mới, ĐĂNG KÝ Ở ĐÂY (AppChrome
      // đã là điểm tập trung của ⌘/, ⌘1-3 — không mở thêm listener rời). ⌘0 tái dùng đúng cửa
      // "về Gallery" của VIỆC 1 (goHomeConfirmed, hỏi trước nếu chưa lưu). ⌘B/⌘L tái dùng đúng sự
      // kiện/hàm sẵn có của phím trần B (AppShell.tsx `if:navigator-toggle`) và L (`openLibrarySheet`,
      // lib/library/use-library-sheet.ts) — không viết luồng toggle/mở-sheet thứ hai.
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && e.key === '0') {
        e.preventDefault();
        goHomeConfirmed(router, { push: activeRef.current !== 'render' });
        return;
      }
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('if:navigator-toggle', { detail: {} }));
        return;
      }
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        const a = activeRef.current;
        openLibrarySheet({ stage: a === 'render' ? 'render' : a === 'present' ? 'present' : 'cad' });
        return;
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

  /**
   * VIỆC 3 UI (04/08) — tự khoá màn sau N phút không thao tác (mặc định
   * `DEFAULT_LOCK_IDLE_MINUTES`, chỉnh ở Cài đặt → `getLockIdleMinutes`/`setLockIdleMinutes`,
   * lib/lockscreen.ts). Đặt lại hẹn giờ ở MỌI hoạt động thật (chuột/phím/chạm/cuộn) — đọc số
   * phút LẠI TỪ ĐẦU mỗi lần đặt hẹn giờ (không cache), để đổi trong Cài đặt có hiệu lực ngay ở
   * lần hoạt động kế tiếp, không cần tải lại trang.
   */
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const reset = () => {
      if (timer) clearTimeout(timer);
      if (useLockScreen.getState().locked) return;
      const userId = useFlowStore.getState().user?.id ?? getLastUserId() ?? '';
      const minutes = getLockIdleMinutes(userId);
      timer = setTimeout(() => lockScreenNow(), minutes * 60_000);
    };
    const events: (keyof WindowEventMap)[] = ['mousemove', 'keydown', 'pointerdown', 'wheel', 'touchstart'];
    events.forEach((ev) => window.addEventListener(ev, reset, { passive: true }));
    reset();
    return () => {
      if (timer) clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, reset));
    };
  }, []);

  /**
   * VIỆC 3 UI (04/08) — "khoá rồi thì mọi phím tắt khác phải tắt, trừ phím mở khoá". Chặn ở
   * CAPTURE PHASE trên `window` — theo thứ tự lan truyền DOM thật, listener capture trên
   * `window` LUÔN chạy TRƯỚC mọi listener khác trong app (kể cả các listener capture trên
   * `document` mà AppShell.tsx (B/I) và use-library-sheet.ts (L) đang dùng, và mọi listener
   * bubble trên `window`/`document`) — `stopImmediatePropagation()` ở đây chặn TRỌN VẸN, không
   * cần sửa từng file rải rác (đúng ràng buộc "đăng ký một chỗ" của VIỆC 2, áp dụng lại ở đây).
   * Chừa lối cho chính LockScreen (ô mật khẩu bên trong `[data-lockscreen-root]`) — không thì
   * người dùng không gõ được mật khẩu để mở khoá.
   */
  useEffect(() => {
    const blocker = (e: KeyboardEvent) => {
      if (!useLockScreen.getState().locked) return;
      // `e.target` có thể là `window`/`document` (không phải `Element`, không có `.closest()`) —
      // vd keydown khi chưa focus gì cả. Bắt cả 2 ca, không giả định luôn là HTMLElement.
      const target = e.target;
      if (target instanceof Element && target.closest('[data-lockscreen-root]')) return;
      e.stopImmediatePropagation();
      e.preventDefault();
    };
    window.addEventListener('keydown', blocker, true);
    return () => window.removeEventListener('keydown', blocker, true);
  }, []);

  // Điều hướng chặng — logic dùng chung với MobileMenu's PhaseRow, xem lib/studio/stage-nav.ts.
  const onPick = (p: Phase) => pickStage(p, { active, pathname, router, begin });
  // Ref cho handler ⌘1-3 (effect deps rỗng, mount 1 lần) — luôn trỏ bản onPick mới nhất
  // (active/pathname đổi theo điều hướng).
  onPickRef.current = onPick;

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
      className={`nen-mo-header relative z-30 flex items-center gap-2 border-b border-[var(--border)] px-2 sm:gap-3 sm:px-3 ${logoMenu ? 'h-[42px]' : 'h-12'}`}
      style={{ borderBottomColor: `color-mix(in srgb, ${tint} 55%, var(--border))` }}
    >
      {/* G-M22-03 (07/08, M-NHAN-OUT) — ĐÃ GỠ `<HomeButton compact />` từng đứng riêng ở đây
          (VIỆC 1 UI, 04/08). Lý do lúc đó: "4 mục trong menu chỉ mở panel đè lên, không mục nào
          rời chặng" — nhưng CÙNG NGÀY 04/08, `AppLogoMenu.tsx` cũng đã thêm mục đầu tiên
          `goHomeItem` (nay nhãn "Home" — chốt 13/08 đêm, gọi thẳng `goHomeConfirmed()`, đứng TRÊN
          vạch phân cách, phía trên 4 mục Tổng quan/Dự án & Flow/Files/Thư viện) — làm ĐÚNG hành vi
          HomeButton, tại ĐÚNG vị trí Hoà chốt 07/08 ("đặt PHÍA TRÊN mục về-trang-gốc" hoá ra
          CHÍNH LÀ mục đó, không phải một mục thứ 6 riêng — đo lại bằng code, không theo số "6
          mục" ghi trong GAP-IF.md cũ, xem M-NHAN-OUT.md). Hai nút cùng gọi `goHomeConfirmed()`,
          đứng cạnh nhau — trùng vai thật (đúng HomeButton.tsx tự khai), gộp bằng cách XOÁ bản
          đứng riêng, giữ bản trong menu. */}
      <button
        ref={logoRef}
        type="button"
        onClick={() => {
          if (logoMenu) {
            setLogoMenuOpen((o) => !o);
            return;
          }
          goHomeConfirmed(router, { push: active !== 'render' });
        }}
        title={logoMenu ? tr('Tổng quan · Dự án · Files · Thư viện', 'Overview · Projects · Files · Library') : 'Về Gallery — InteriorFlow'}
        aria-expanded={logoMenu ? logoMenuOpen : undefined}
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
      {logoMenu && (
        <AppLogoMenu
          open={logoMenuOpen}
          anchorRect={logoAnchor}
          onDismiss={() => setLogoMenuOpen(false)}
          menuRef={logoMenuRef}
          stage={active === 'render' ? 'render' : active === 'present' ? 'present' : 'cad'}
        />
      )}

      <div className="mx-1 hidden h-5 w-px bg-[var(--border)] sm:block" />

      {/* 30/07 — TÁI CẤU TRÚC (sửa nốt phần overlap 1024px của 7.3.31, thay bản "co lại/cắt" cũ):
          "Tệp" về cụm trái cạnh logo (đúng quy ước menu File, vẫn CHỈ active==='render' — không
          đổi lớp, xem ghi chú đầu file). StageSwitcher ra làm con TRỰC TIẾP shrink-0 của header
          — khớp yêu cầu "3 nút chặng đứng yên một chỗ" của 7.3.31, không còn sống trong hộp co. */}
      {/* 03/08 SPEC-APP-SHELL-CHUNG §2 mục 5 — "Tệp ▾" RỜI header: nó là toolbar tài liệu RIÊNG
          của chặng render, nay sống ở RenderDocBar (slot toolbar của StageShell, HomeScreen
          truyền vào) — header 3 chặng đồng nhất. */}

      {/* LUẬT (đã vỡ 1 lần, 30/07 — Tệp/StageSwitcher từng sống ở đây, cả 2 đều shrink-0, tràn
          khỏi hộp bị bóp nhỏ hơn nội dung → "Chạy flow" vẽ sau trong DOM nên đè lên phần tràn,
          KHÔNG phải z-index/stacking quirk): hộp `flex-1 min-w-0` CHỈ được chứa thứ CO ĐƯỢC.
          Mọi shrink-0 đặt trong nó sẽ tràn ra ngoài và bị phần tử vẽ sau đè lên. KHÔNG chữa bằng
          overflow-hidden (cắt popover con — đã thử, bỏ, xem Header.tsx cũ trước 7.3.31). */}
      {/* overflow-hidden CHỈ ở đây (an toàn — hộp này không chứa popover nào, khác cụm giữa cũ
          bị cấm overflow-hidden vì có Tệp/MoreMenu). Không có nó: khi flex bóp hộp này xuống gần
          0, nút tên dự án vẫn cần 1 mức rộng tối thiểu để vẽ (padding + 1 ký tự + "…") và TRÀN
          khỏi hộp — đè lên StageSwitcher (phát hiện 30/07, đo được 4px chồng ở 1024px). */}
      {/* ⛔ THỨ TỰ NHƯỜNG CHỖ (Hoà chốt, thi hành ở `lib/ui/vung-lam-viec.ts#viTriO`):
          ① nén/cắt ĐẦU ĐỀ DỰ ÁN trước → ② GIỮ NEO VITALS ĐỨNG YÊN → ③ co bề rộng Peek →
          ④ chỉ khi đó mới dịch ổ. `--if-tran-cum-trai` do chính khẩu độ ghi lên `<header>` mỗi
          lần đo lại; chưa có khẩu độ (hoặc chưa đo được) thì `100%` như cũ. Không có nó thì tên
          dự án dài chạy thẳng xuống dưới ổ Vitals — hai vật chồng nhau ở giữa header. */}
      <div className="flex min-w-0 flex-1 items-center overflow-hidden" style={{ maxWidth: 'var(--if-tran-cum-trai, 100%)' }}>
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

      {/* StageSwitcher đã gỡ 17/08 (Hoà chốt): chốt 16/08 hạ sidebar thành hệ router,
          ba chặng chỉ là 1 nhóm stage trong cụm PROJECT của RailDieuHuong. 3 nút chặng ở
          top trùng chức năng. Phím tắt ⌘1/⌘2/⌘3 GIỮ NGUYÊN (onPickRef ở effect trên vẫn
          gọi onPick), lối bàn phím không mất. Không xoá StageSwitcher.tsx — giữ để có thể
          dùng lại nếu quay đầu. */}

      {/* 🔴 ĐÍNH CHÍNH 04/09 — chốt 16/08 "Vitals cạnh trục phải" ĐÃ BỊ ĐÈ.
          `docs/CHOT-EXPERIENCE-SYSTEM-2026-08-20.md` §7 (Hoà duyệt mắt 20/08): Vitals nằm **VẬT
          LÝ trong TOP EDGE như một khẩu độ sống**, ba mức Ambient → Peek → Engage, *"không phải
          popover gắn lên"*. Nên ở đây:
            · `<VitalsPill/>` (chỉ Home, chat riêng gọi `stage:'gallery'`) → GỠ. Nó là chỗ đứng
              thứ hai, và app chỉ được có MỘT.
            · Khẩu độ mount ở NGOÀI nhánh `active === 'home'` (ngay dưới) ⇒ có mặt ở MỌI chặng,
              đúng "Ambient luôn thấy ở mọi màn".
          Ô tìm dự án GIỮ NGUYÊN chỗ cũ — nó không phải Vitals. `data-marker="cumPhaiTren"` là
          mốc ĐO cho khẩu độ: ổ Vitals không bao giờ được chạm vào cụm này (`viTriO`). */}
      {active === 'home' && (
        <div className="flex shrink-0 items-center gap-2" data-marker="cumPhaiTren" data-tour="home-search-vitals">
          <SearchProjectsInput />
        </div>
      )}

      {/* ⭐⭐ KHẨU ĐỘ VITALS — chỗ đứng vật lý DUY NHẤT của Vitals trong app (EXS §7).
          Nó là con `absolute` của chính `<header>` này (header đã `relative` ở trên), neo vào TÂM
          VÙNG LÀM VIỆC chứ không vào tâm cửa sổ — xem `lib/ui/vung-lam-viec.ts`.
          🔴 Chặng suy từ ĐƯỜNG DẪN, KHÔNG từ `activeToPhase(active)` — sửa 04/09 sau khi soi ảnh
          thật: `/files` · `/library` · `/materials` · `/tasks` · `/settings` · `/inspiration` đều
          bọc `<AppShell active="render">`, nên `activeToPhase` trả `'render'` cho cả sáu ⇒ tấm chat
          ghi "VITALS · THIẾT KẾ 3D" khi đứng ở Trang chủ. `active` KHÔNG phân biệt nổi
          `/projects/<id>/render` với `/files`; chỉ đường dẫn phân biệt được. */}
      <VitalsAperture stage={changTheoDuong(pathname)} />

      {/* 2.2.86 (30/07, Hoà chốt) — "Chạy flow" KHÔNG còn đứng riêng trên bar (~110px trả lại
          ngân sách bề rộng). Khởi chạy giờ CẠNH ĐỐI TƯỢNG: nút ▶ trên node, "Kết xuất" trên thẻ
          Tool Mode, "Run flow" ở Command Palette (⌘K) — cả ba đều xếp hàng qua cùng 1 hàng đợi
          (lib/execution.ts). Theo dõi/huỷ ở menu "Việc" (TasksDropdown) — xem badge số dưới đây. */}

      {/* 7.3.32 (31/07) — mốc "hiện đủ 4 nút" đẩy từ sm(640) sang lg(1024): ở 640-1023px cụm
          này cộng Tệp/AiStatusDot (route render) tràn 819px cứng bất kể viewport. MobileMenu
          (sm:hidden trước đây, nay lg:hidden) đã có sẵn Tasks+Home+account+actions trong bottom
          sheet — chỉ cần đẩy cùng mốc, không viết UI mới. */}
      {/* 03/08 SPEC-APP-SHELL-CHUNG §2 — CẮT khỏi header: "Việc ▾" → RenderDocBar (toolbar
          chặng render) · avatar UserChip (avatar duy nhất ở RAIL, mở AccountMenu —
          CHOT-AVATAR-MEMOJI §2). Nút ⌂ Home từng cắt vì "TRÙNG logo góc trái" — ĐÚNG khi logo tự
          về Gallery (`logoMenu` false); khi logo mở `AppLogoMenu` thay vào đó (`logoMenu` true),
          đường về Gallery nay sống trong CHÍNH menu đó (mục "Home", đầu danh sách —
          xem comment ở nút logo phía trên, G-M22-03). */}

      {/* SessionWatch — universal (30/07, sửa lỗi: trước chỉ StudioBar có, route `/` không báo
          hết phiên giữa chừng). Dải báo fixed đáy màn, không chặn thao tác. */}
      <SessionWatch />

      <MobileMenu active={active} />

      <ShortcutsPanel open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} active={active} />
      <LeaveConfirmBar />
      <LockScreen />
    </header>
  );
}


