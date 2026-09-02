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
import { usePathname, useRouter } from 'next/navigation';
import { useFlowStore } from '@/lib/store';
import { DEFAULT_PHASE, STAGE_TINT, type Phase } from '@/lib/phases';
import { MobileMenu } from '@/components/MobileMenu';
// P-V 17/08 — ô tìm dự án + Vitals ở top bar (chỉ Home; chặng có Vitals cạnh trục phải riêng).
import SearchProjectsInput from '@/components/SearchProjectsInput';
// COHERENCE-SHELL 20/08 — mép trên có HAI thứ mới, cả hai sống ở MỌI màn (không còn "chỉ Home"):
// dải ngữ cảnh (đang ở đâu) + khẩu độ Vitals (nên biết gì).
//
// 🔴 ĐẢO NỬA SAU 02/09 (V-3a) — KHẨU ĐỘ VITALS THÔI MOUNT Ở HEADER. Hoà 09:08 02/09: *"VITAL
// HẢ? DM"* ⇒ chốt sau thắng chốt duyệt-mắt 20/08. Nhưng Vitals là tính năng THẬT, không được
// mất cùng chỗ đứng của nó (luật: gỡ CHỖ ĐỨNG ≠ gỡ NĂNG LỰC — bàn 06, 02/09).
// ⇒ `VitalsPill` (bản chỉ-Home, `components/home/widgets/VitalsPill.tsx`) MOUNT LẠI vào đúng
// cụm `data-tour="home-search-vitals"` bên dưới. Đây là CONNECT, không phải NEW (B25): tệp đó
// đã làm sẵn việc "nút nhỏ → mở `VitalsChatSurface`", nó chỉ mất chỗ mount từ 20/08.
// Vì sao cụm tìm kiếm chứ không phải `CumPhaiTren`: SO-TONG mục `vitals` (Hoà 17/08) đặt Vitals
// *"nằm TRÊN thanh tìm kiếm"*, còn chốt 6 giao góc phải cho *cá nhân + thông báo* — và chính
// `CumPhaiTren.tsx:14-17` cấm nhập hai hệ. Phiếu V-3b đề nghị góc phải; nguồn thắng phiếu.
// ⛳ NỢ CÓ TÊN: cụm này chỉ render khi `active === 'home'` ⇒ Vitals nay CHỈ CÒN Ở HOME, trong
// khi khẩu độ cũ sống ở mọi màn. Thu hẹp có chủ ý cho pilot, không phải quên. Muốn trả lại
// "mọi màn" thì đó là việc THÊM một chỗ đứng, không phải khôi phục `<VitalsAperture/>`.
import { DaiNguCanh } from '@/components/studio/DaiNguCanh';
import VitalsPill from '@/components/home/widgets/VitalsPill';
import { CumPhaiTren } from '@/components/studio/CumPhaiTren';
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
import { LiveGuide } from '@/components/studio/LiveGuide';
import { QuayVeTrinhBay } from '@/components/studio/QuayVeTrinhBay';
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
        lockScreenNow('tay');   // NGƯỜI chủ động bấm ⌃⌘Q ⇒ khoá CỨNG, đòi mật khẩu
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
      // §24 — `null` = "Không bao giờ": KHÔNG đặt hẹn giờ, không giả lập bằng một số khổng lồ.
      if (minutes === null) return;
      timer = setTimeout(() => lockScreenNow('ranh'), minutes * 60_000);   // MÁY tự khoá ⇒ mở bằng một nút
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
      {/* COHERENCE-SHELL 20/08 — Ô NÀY TRƯỚC ĐÂY CHỈ CÓ TÊN DỰ ÁN (bấm = đổi tên). Nay là DẢI
          NGỮ CẢNH: tên dự án · chặng đang đứng, bấm mở bộ chuyển ngữ cảnh. Đổi tên KHÔNG MẤT —
          nó thành một mục trong menu (`onDoiTen` bật đúng ô `<input>` cũ dưới đây), vì một chỗ
          đứng không nên mang hai việc: trước kia bấm vào tên dự án là lập tức vào chế độ sửa,
          người dùng muốn BIẾT mình đang ở đâu thì không có gì để bấm.
          Vì sao dải chỉ có HAI tầng (không có "Không gian/Workspace"): đo tại nguồn — schema
          KHÔNG có model Workspace, `lib/store.ts:33` `WorkspaceMode = Phase` tức "workspace"
          hiện chính là chặng. Chi tiết + bằng chứng file:dòng ở đầu `DaiNguCanh.tsx`. */}
      {/* ⓵ VÙNG TRÁI — DỰ ÁN · CHẶNG. `min-w-0` + `overflow-hidden` là bước ① của bậc thang
          nhường va chạm (Hoà chốt 20/08): **đầu đề dự án nén/cắt TRƯỚC**, để ổ Vitals ở giữa
          không bao giờ phải nhúc nhích. `data-if-cum-trai-tren` cho ổ đo được mép phải của cụm
          này mà không phải đoán. */}
      <div className="flex min-w-0 flex-1 items-center overflow-hidden" data-if-cum-trai-tren="">
        {editing ? (
          <input
            autoFocus
            className="w-36 shrink rounded-[var(--r-2)] border border-[var(--accent-ring)] bg-[var(--field)] px-2 py-1 text-sm text-[var(--t1)] outline-none sm:w-56"
            value={flowName}
            onChange={(e) => setFlowName(e.target.value)}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => e.key === 'Enter' && setEditing(false)}
          />
        ) : (
          <DaiNguCanh
            /* 🔴 26/08 — 'Untitled flow' KHÔNG PHẢI MỘT CÁI TÊN, nó là chỗ trống đội lốt tên.
               Hoà soi app thật: thanh trên bày 'Untitled flow' cho một hồ sơ chưa ai đặt tên.
               Chuỗi đó là giá trị MẶC ĐỊNH của store (`lib/store.ts:345`), không phải nhãn giao
               diện — nhưng người dùng không phân biệt được, họ chỉ thấy app tự tin gọi tên một
               thứ chưa có tên.
               ⭐ Luật: CHƯA ĐẶT TÊN THÌ ĐỂ TRỐNG. Một chỗ trống nói thật ('chưa đặt tên') và
               còn mời người ta đặt; một cái tên bịa thì đóng luôn lời mời đó lại — người dùng
               tưởng nó đã có tên rồi nên không bấm vào sửa.
               ⛔ Sửa ở TẦNG HIỂN THỊ, không đụng giá trị mặc định trong store: nhiều nơi khác
               (API, xuất tệp, danh sách) đang dựa vào chuỗi đó để có một khoá không rỗng. */
            tenDuAn={flowName === 'Untitled flow' ? '' : flowName}
            // Home là màn CẤP APP, không đứng trong chặng nào ⇒ dải chỉ nói tên dự án, không
            // bịa ra một chặng "mặc định" mà người dùng chưa bước vào.
            chang={active === 'home' ? null : currentPhase}
            onChonChang={(p) => onPickRef.current(p)}
            onDoiTen={() => setEditing(true)}
          />
        )}
      </div>

      {/* StageSwitcher đã gỡ 17/08 (Hoà chốt): chốt 16/08 hạ sidebar thành hệ router,
          ba chặng chỉ là 1 nhóm stage trong cụm PROJECT của RailDieuHuong. 3 nút chặng ở
          top trùng chức năng. Phím tắt ⌘1/⌘2/⌘3 GIỮ NGUYÊN (onPickRef ở effect trên vẫn
          gọi onPick), lối bàn phím không mất. Không xoá StageSwitcher.tsx — giữ để có thể
          dùng lại nếu quay đầu. */}

      {/* Ô TÌM DỰ ÁN — vẫn CHỈ Home (tìm giữa các dự án chỉ có nghĩa khi chưa mở dự án nào).
          KHẨU ĐỘ VITALS thì ở MỌI màn: chốt 16/08 nói "cùng MỘT vật, di chuyển theo chỗ tay
          đang đặt", và mép trên là chỗ vật đó đứng khi tay chưa ở trục phải. Vẫn đúng ràng buộc
          "mỗi màn ĐÚNG MỘT Vitals" — `VitalsGesture` bản cũ đã mồ côi từ 17/08 (xem đầu
          `VitalsAperture.tsx`).
          🔴 SỬA 02/09: câu cũ ở đây ghi *"`VitalsPill` bản chỉ-Home đã thôi mount"* — nay SAI,
          nó vừa mount lại ngay dưới đây (V-3a). Sửa tại chỗ thay vì để lại: một chú thích tả
          hiện trạng đã hết đúng thì phiên sau đọc nó như FACT rồi đi tìm bug không tồn tại. */}
      <div className="flex shrink-0 items-center gap-2" data-tour="home-search-vitals">
        {active === 'home' && <SearchProjectsInput />}
        {active === 'home' && <VitalsPill />}
      </div>

      {/* ⓶ Ổ VITALS — ĐÃ GỠ 02/09 (V-3a). Khối cũ dựng một VÙNG NGỮ NGHĨA GIỮA riêng cho
          `<VitalsAperture/>`: con trực tiếp của `<header>`, tự đặt mình bằng toạ độ tuyệt đối
          theo tâm vùng làm việc (`useVungLamViec` → `viTriO`), cố ý ĐỨNG NGOÀI mọi cụm flex.
          Thiết kế đó không sai về mặt kỹ thuật — nó bị Hoà bác về mặt SỰ CÓ MẶT (09:08 02/09).
          ⛔ Đừng dựng lại chỗ đứng này. `VitalsAperture.tsx` giữ nguyên trên đĩa (mức Peek +
          quỹ đạo là công sức thật, và bản thân tệp đã là lời chứng vì sao chip StatusBar chết);
          nó chỉ THÔI MOUNT. Lối vào Vitals nay ở cụm tìm kiếm phía trên — xem chú thích ở import.
          Header nay là một dòng flex phẳng: trái = Dự án·Chặng · giữa = tìm + Vitals ·
          phải = Thông báo·Hiện diện·Avatar. */}

      {/* NAV-HAI-DAO 20/08 — CỤM PHẢI TRÊN: "tôi là ai / ai đang ở đây".
          Hoà chốt thanh trái CHỈ CÒN VIỆC ⇒ Hồ sơ · Credit · Cài đặt · Tài khoản · Đăng xuất rời
          rail và về đây, sau khẩu độ Vitals. ⛔ HAI HỆ KHÁC NHAU, cấm nhập một: `VitalsAperture`
          (mép trên) trả lời *tôi nên biết gì*; `CumPhaiTren` trả lời *tôi là ai / ai đang ở đây*.
          Vì sao đứng ở đây mà không sớm hơn trong DOM: thứ tự đọc trái→phải phải là ngữ-cảnh →
          Vitals → danh-tính; đảo lại thì avatar chen vào giữa ô tìm và khẩu độ.
          Cụm TỰ ẨN khi chưa đăng nhập, và phần hiện diện tự ẩn khi chỉ có một mình — không giữ
          chỗ trống (luật widget-thiếu-dữ-liệu-tự-ẩn, Hoà chốt 13/08). */}
      {/* ⓷ VÙNG PHẢI — THÔNG BÁO · HIỆN DIỆN · AVATAR. Ổ Vitals đọc mép trái của cụm này qua
          marker SẴN CÓ `data-marker="cumPhaiTren"` (`CumPhaiTren.tsx:132`) — [Đ2] CONNECT, không
          đẻ marker thứ hai — và coi đó là BIÊN CỨNG: bước ④ chỉ được dịch trong vùng an toàn,
          không bao giờ chạm vào cụm này. Hai hệ cạnh nhau về không gian, tách hẳn về nghĩa:
          Vitals = *tôi nên biết gì* · cụm này = *ai gửi gì cho tôi / tôi là ai*. */}
      <CumPhaiTren />

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
      {/* Hướng dẫn sống (Live Guide) — lớp chỉ dẫn neo UI thật, TẮT mặc định, bật ở tab Demo của
          chuông Hoạt động. Sống ở đây (mọi chặng) để guide đi theo qua điều hướng. Render null
          khi tắt — 0 chi phí. */}
      <LiveGuide />
      {/* Viên "Quay về Trình bày" — chỉ hiện khi đang rời trình chiếu bằng deep link (demo). */}
      <QuayVeTrinhBay />
    </header>
  );
}


