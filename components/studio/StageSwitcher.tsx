'use client';

/**
 * components/studio/StageSwitcher.tsx — bộ gạt nhanh giữa 3 chặng Concept · Render · Present,
 * kèm cử chỉ kéo-xuống mở Vitals.
 *
 * 🔴 ĐÍNH CHÍNH 17/08 — dòng đầu file này TRƯỚC ĐÂY ghi *"TRỤC ĐIỀU HƯỚNG DUY NHẤT của app"*.
 * Câu đó **HẾT HIỆU LỰC**. Hoà chốt 16/08: **sidebar là hệ router toàn app, ba chặng chỉ là MỘT
 * nhóm stage** ngang hàng với Tổng quan · Bảng việc · Chat · Họp · Files · Thư viện · Cài đặt.
 * Trục điều hướng nay là `components/nav/RailDieuHuong.tsx` ([marker: railHaiCum], mount ở ổ ⓪
 * của `AppShell`); nguồn cấu trúc: `docs/HOP-DONG-CAU-TRUC-DIEU-HUONG.md`.
 * ⇒ File này GIỮ NGUYÊN vai trò và giữ nguyên cử chỉ — nó là **lối tắt giữa ba chặng**, không
 * còn là bản đồ. Đừng thêm mục cấp app (Files/Thư viện/Bảng việc…) vào đây: chỗ của chúng là rail.
 *
 * Vì sao đóng dấu tại chỗ thay vì im lặng sửa: văn bản bị thay mà bỏ hoang thì đọc ra như đang
 * còn hiệu lực — đúng cách bản đồ kiến trúc cũ chết suốt 19 ngày (`docs/CLAUDE.md:14`).
 *
 * 23/07 — RESTORE GESTURE, KHÔNG VISUAL GIỌT KÍNH: user chốt "bỏ hiệu ứng giọt
 * kính nhưng phải chừa lại cho người ra cử chỉ kéo xuống hiện ô chat được tối
 * ưu trả lời cho từng chặng". Cách làm:
 *   - Handle line hairline 24×1px ở giữa-dưới dock (dạng iOS bottom sheet
 *     handle). Idle 1px opacity 0.4; hover/active 3px opacity 0.9. Rất subtle,
 *     hint cử chỉ mà không cầu kỳ (tinh thần quiet-luxury TTT).
 *   - Pointer-down trên handle → `createStageDragTracker` phân biệt click/trượt
 *     ngang/kéo xuống (lib/input/stage-drop.ts). Kéo xuống vượt 28px → mở Vitals
 *     qua kho dùng chung `lib/vitals-ui.ts`.
 *
 * 🔴 ĐÍNH CHÍNH 04/09 — TỆP NÀY KHÔNG CÒN MOUNT PANEL VITALS, VÀ KHÔNG CÒN GIỮ ⌘J.
 *   Bản thân `StageSwitcher` đã bị gỡ khỏi `AppChrome` từ 17/08 (sidebar thành hệ router)
 *   ⇒ `grep` toàn repo: KHÔNG route nào mount nó. Nhưng nó vẫn là **nơi mount duy nhất** của
 *   `VitalsGesturePanel` và **nơi đăng ký duy nhất** của ⌘J, nên hai thứ đó chết theo mà không
 *   ai thấy: ô gõ nhanh ở `StatusBar` gọi `openVitals()` vào hư không — gõ Enter là MẤT CÂU HỎI.
 *   Cả hai nay về `components/studio/VitalsAperture.tsx` (khẩu độ mép trên, EXS §7 — Hoà duyệt
 *   mắt 20/08). Ở đây chỉ còn cử chỉ KÉO XUỐNG, và nó gọi thẳng kho dùng chung — nếu tệp này có
 *   ngày được mount lại thì cử chỉ vẫn mở đúng MỘT panel, không đẻ chỗ đứng thứ hai.
 *   ⛔ Đừng "khôi phục cho đủ": mount lại panel ở đây là vi phạm `SO-KIEM-TONG` §1 và phá luật
 *   một-chỗ-đứng (test canh: `components/studio/mot-cho-dung.test.ts`).
 *   - Onboarding subtle: lần đầu vào 1 trong 3 chặng, handle line hiện active
 *     3s + tooltip "↓ Kéo xuống để hỏi Vitals" 4s (key `gesture_hint_seen`).
 *     Sau lần drag đầu (`gesture_first_done`) không hiện lại tooltip.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { PencilRuler, Box, Presentation } from 'lucide-react';
import type { Phase } from '@/lib/phases';
import { PHASES } from '@/lib/phases';
import { useCadStore } from '@/lib/cad/store';
import { useFlowStore } from '@/lib/store';
import { springSheet, pressable, easeApple } from '@/lib/motion';
import { createStageDragTracker } from '@/lib/input/stage-drop';
import { useVitalsUi } from '@/lib/vitals-ui';
import { useT } from '@/lib/i18n';
import Tooltip from '@/components/ui/Tooltip';
import { markVitalsUsed, wasVitalsUsed } from './VitalsGesture';

/** Cùng công thức slug của NotebookButton cũ (đã bỏ khỏi Header). */
const ICON: Record<Phase, typeof PencilRuler> = { concept: PencilRuler, render: Box, present: Presentation };

/**
 * 7.3.31 (30/07) — bản CHỮ ĐẬM RỘNG NHẤT mỗi nút chặng CÓ THỂ hiện, dùng làm `data-label` ghost
 * (xem `.stage-btn::before` ở globals.css) để chiếm sẵn chỗ, không đổi bề rộng khi active/inactive.
 * 07/08 [G-M15-02] — nút chặng CHỈ ghi tên CHẶNG (`p.label`), KHÔNG còn gộp tên MODE (Sơ phác/Kỹ
 * thuật) — đó là 2 khái niệm khác nhau, mode đã có dải chọn riêng ở thanh công cụ dưới. Ghost
 * width nay chính là `p.label`, không cần bảng riêng theo cadStage nữa.
 */
const WIDEST_LABEL: Record<Phase, string> = {
  concept: 'Thiết kế 2D',
  render: 'Thiết kế 3D',
  present: 'Trình chiếu',
};

const HINT_SEEN_KEY = 'interiorflow.vitals.gesture_hint_seen';
const FIRST_DONE_KEY = 'interiorflow.vitals.gesture_first_done';

interface Props {
  active: Phase;
  onPick: (p: Phase) => void;
  photoContext?: boolean;
}

export default function StageSwitcher({ active, onPick, photoContext }: Props) {
  // IF2-nền — nhãn pill CAD tự đổi theo `store.stage` ('sketch' | 'technical' | 'bim').
  // Selector này KHÔNG trigger re-render nào ngoài lúc stage thật sự đổi (Zustand shallow-eq).
  const cadStage = useCadStore((s) => s.stage);
  // SCOPE FIX (Task #18): id ổn định cho `/projects/[id]/notebook` (Project.id thật
  // hoặc Flow.id) — không slug tên flow (trùng tên → rò dữ liệu chéo giữa dự án).
  const currentProjectId = useFlowStore((s) => s.currentProjectId);
  const currentFlowId = useFlowStore((s) => s.currentFlowId);
  const router = useRouter();
  const tr = useT();

  const dockRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  const [dragging, setDragging] = useState(false);
  // VIỆC A (28/07): panelOpen nâng lên store dùng chung (lib/vitals-ui.ts) — ô gõ nhanh ở
  // `StatusBar.tsx` cũng mở panel này qua `open()`.
  // 05/08 (Hoà chốt "hai Vitals cùng lúc"): panel mount DUY NHẤT ở đây (ổ ① header, đúng
  // `SPEC-HA-TANG-UI-IF` Trụ 1 + mock Claude Design). `anchor` đã BỎ khỏi store — trước đó nó
  // chọn 1 trong 2 nơi mount, mà hai nơi mount là hai nguồn cho một panel (gate anchor giữ chỉ
  // một cái MỞ nhưng người dùng vẫn thấy 2 lối vào trên màn). StatusBar nay chỉ gọi `open()`,
  // không mount gì.
  const panelOpen = useVitalsUi((s) => s.panelOpen);
  const openShared = useVitalsUi((s) => s.open);
  const closeShared = useVitalsUi((s) => s.close);
  // `initialInput`/`autoSend`/`consumeInitial` đã GỠ khỏi đây 04/09 — chúng thuộc về NƠI MOUNT
  // panel, và nơi đó nay là `VitalsAperture.tsx`. Đọc lại ở đây là đọc mà không dùng.
  const setPanelOpen = useCallback(
    (v: boolean | ((prev: boolean) => boolean)) => {
      const cur = useVitalsUi.getState();
      const next = typeof v === 'function' ? (v as (prev: boolean) => boolean)(cur.panelOpen) : v;
      if (next) openShared();
      else closeShared();
    },
    [openShared, closeShared],
  );
  // `originPx` (điểm gốc phóng của panel theo chỗ ngón đặt) cũng theo panel sang khẩu độ.
  const [handleActive, setHandleActive] = useState(false); // hover HOẶC onboarding highlight
  const [hintTooltip, setHintTooltip] = useState(false);
  // 08/08 — hover màu chữ nút chặng, port `mock-if-3chang.html` `.seg button:hover`.
  const [hoveredPhase, setHoveredPhase] = useState<Phase | null>(null);

  // Onboarding lần đầu — chỉ chạy client, đọc localStorage đồng bộ.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (localStorage.getItem(HINT_SEEN_KEY) === '1') return;
      // Handle line active 3s + tooltip 4s.
      setHandleActive(true);
      setHintTooltip(true);
      const t1 = window.setTimeout(() => setHandleActive(false), 3000);
      const t2 = window.setTimeout(() => setHintTooltip(false), 4000);
      localStorage.setItem(HINT_SEEN_KEY, '1');
      return () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
      };
    } catch {/* localStorage bị chặn (chế độ riêng tư) — hint/cờ không nhớ được, không chặn việc */}
  }, []);

  const onHandlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      const el = handleRef.current;
      const dock = dockRef.current;
      if (!el || !dock) return;

      const startX = e.clientX;
      const startY = e.clientY;
      const tracker = createStageDragTracker();

      setDragging(true);

      try {
        el.setPointerCapture(e.pointerId);
      } catch {/* pointer đã rời/huỷ giữa chừng — capture không còn để giữ/nhả, bỏ qua an toàn */}

      const onMove = (ev: PointerEvent) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        const v = tracker.move(dx, dy);
        if (v === 'vitals') {
          // Không cleanup — vẫn theo dõi để nâng cấp thành 'notebook-full' nếu user
          // kéo tiếp. Pointer capture giữ nguyên; nếu thả tay ở đây, `onUp` dọn.
          if (!panelOpen) setPanelOpen(true);
          markVitalsUsed();
          try {
            localStorage.setItem(FIRST_DONE_KEY, '1');
          } catch {/* localStorage bị chặn (chế độ riêng tư) — hint/cờ không nhớ được, không chặn việc */}
        } else if (v === 'notebook-full') {
          // Kéo lần 2 — bỏ popover, mở NotebookLM full modal (route hiện có).
          setPanelOpen(false);
          setDragging(false);
          markVitalsUsed();
          try {
            localStorage.setItem(FIRST_DONE_KEY, '1');
          } catch {/* localStorage bị chặn (chế độ riêng tư) — hint/cờ không nhớ được, không chặn việc */}
          const id = currentProjectId || currentFlowId || 'default';
          router.push(`/projects/${id}/notebook`);
          cleanup();
        } else if (v === 'locked') {
          setDragging(false);
          cleanup();
        }
      };
      const onUp = () => {
        // Thả tay chưa đủ ngưỡng → không mở panel, dọn pre-mount.
        if (!panelOpen) setDragging(false);
        cleanup();
      };
      const cleanup = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
        try {
          el.releasePointerCapture(e.pointerId);
        } catch {/* pointer đã rời/huỷ giữa chừng — capture không còn để giữ/nhả, bỏ qua an toàn */}
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    },
    [panelOpen, currentProjectId, currentFlowId, router],
  );

  // Khi panel đóng, dọn dragging để lần drag tiếp không dính state cũ.
  useEffect(() => {
    if (!panelOpen && !dragging) return;
    if (!panelOpen) return; // vẫn đang drag nhưng chưa mở
    return () => {
      // panel unmount hoặc onClose → reset dragging
      setDragging(false);
    };
  }, [panelOpen, dragging]);


  /* ⌘J / Ctrl+J — ĐÃ GỠ KHỎI ĐÂY 04/09. Tổ hợp này nay đăng ký DUY NHẤT ở
     `components/studio/VitalsAperture.tsx` (khẩu độ mép trên), kèm nguyên guard né ô nhập.
     Giữ ở đây là đăng ký ở một component không được mount ⇒ phím tắt chết, và nếu component
     này được mount lại thì thành HAI nơi cùng nghe một phím. */

  // Ẩn tooltip khi user đã drag lần đầu (dù chưa hết 4s).
  useEffect(() => {
    if (!hintTooltip) return;
    try {
      if (localStorage.getItem(FIRST_DONE_KEY) === '1') setHintTooltip(false);
    } catch {/* localStorage bị chặn (chế độ riêng tư) — hint/cờ không nhớ được, không chặn việc */}
  }, [hintTooltip, dragging]);

  const handleWidth = 24;
  const handleHeight = handleActive ? 3 : 1;
  const handleOpacity = handleActive ? 0.9 : 0.4;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
      {/* 08/08 — PORT `docs/mocks/mock-if-3chang.html` `.seg` (nguồn sự thật theo `00-CHOT.md`
          "QUY TRÌNH DESIGN"): segmented control PHẲNG (field bg, không kính/blur/border) — khác
          class `.if-dock` cũ (Sprint 2 C-3, ngôn ngữ kính mờ, tài liệu FINAL_ARCHITECTURE_REPORT
          đã lỗi thời, không nằm trong 00-CHOT). Override tại chỗ bằng inline style (đè `.if-dock`
          trong globals.css) vì phạm vi việc này CHỈ được sửa file này, không đụng globals.css. */}
      <div
        ref={dockRef}
        className="if-dock"
        role="tablist"
        aria-label="Chặng làm việc"
        style={{
          position: 'relative',
          gap: 0,
          padding: 2,
          borderRadius: 'var(--radius-sm)',
          background: 'var(--field)',
          border: 'none',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
        }}
      >
        {PHASES.map((p, i) => {
          const Icon = ICON[p.id];
          const on = p.id === active;
          const name = tr(p.label, p.labelEn);
          const soon = p.id === 'concept' && (cadStage === 'technical' || cadStage === 'bim');
          const hovered = hoveredPhase === p.id;
          return (
            /* VIỆC 2 (05/08) — bỏ `title=` HTML: trễ 1-2s, không tách được tên/mô tả, và CÂM trên
               cảm ứng (§0c mảng 3). Tooltip dùng chung cho luôn phím tắt ⌘1/⌘2/⌘3 (đăng ký thật ở
               `AppChrome.tsx:136-138`) — trước đây người dùng không có chỗ nào nhìn ra 3 phím này.
               `hideTouchLabel`: nút chặng ĐÃ hiện chữ tên sẵn, thêm nhãn tĩnh là lặp tên hai lần.
               `side="bottom"`: thanh chặng nằm sát mép TRÊN màn, tag hướng lên sẽ tràn khỏi viewport. */
            <Tooltip
              key={p.id}
              label={name}
              desc={soon ? `${p.tagline} · Chặng kỹ thuật/BIM (IF2) sắp có` : p.tagline}
              shortcut={`⌘${i + 1}`}
              side="bottom"
              hideTouchLabel
            >
            <motion.button
              type="button"
              role="tab"
              aria-selected={on}
              {...pressable}
              onClick={() => onPick(p.id)}
              onMouseEnter={() => setHoveredPhase(p.id)}
              onMouseLeave={() => setHoveredPhase((cur) => (cur === p.id ? null : cur))}
              className="stage-btn"
              data-label={WIDEST_LABEL[p.id]}
              style={{
                padding: '5px 15px',
                borderRadius: 10,
                border: 'none',
                fontSize: 'var(--fs-xs)',
                // mock `.seg button{color:t3} :hover{color:t2} .on{color:t1,fw:600}` — inline vì
                // element là `motion.button`, class scope của styled-jsx không gắn vào (đã thử,
                // không nhận), nên dùng state hover thật (cùng công thức `handleActive` phía trên).
                fontWeight: on ? 'var(--fw-semi)' : 'var(--fw-normal)',
                color: on ? 'var(--t1)' : hovered ? 'var(--t2)' : 'var(--t3)',
                background: 'transparent',
                cursor: on ? 'default' : 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {on && (
                <motion.span
                  layoutId="stage-active-pill"
                  transition={springSheet}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 10,
                    background: 'var(--panel)',
                    boxShadow: 'var(--shadow-node)',
                    zIndex: 0,
                  }}
                />
              )}
              <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon size={13} strokeWidth={on ? 2.2 : 2} /> {name}
                {/* IF2-nền — badge "Coming soon · IF2" khi CAD ở chặng kỹ thuật/BIM mà tính năng
                    thật (BIM viewer/IFC/clash) chưa build. Đặt ngay cạnh nhãn pill để hoạ viên/
                    khách demo hiểu là tính năng sắp có, không phải lỗi. Class chấm bé xíu, không
                    phá layout thanh pill. */}
                {soon && (
                  <span
                    /* `title=` gỡ 05/08: Tooltip của chính nút chặng (bọc ngoài) đã nói câu "Chặng
                       kỹ thuật/BIM (IF2) sắp có" trong dòng mô tả. Để lại `title=` ở đây thì
                       tooltip HTML chậm của badge sẽ ĐÈ lên tag đẹp vừa hiện — hai tooltip một chỗ.
                       `aria-label` GIỮ để trình đọc màn hình vẫn đọc được badge. */
                    aria-label="Coming soon · IF2"
                    style={{
                      fontSize: 9,
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      padding: '1px 5px',
                      borderRadius: 3,
                      background: 'var(--warn, #b57a4e)',
                      color: '#fff',
                      whiteSpace: 'nowrap',
                      opacity: 0.85,
                    }}
                  >
                    Soon
                  </span>
                )}
              </span>
            </motion.button>
            </Tooltip>
          );
        })}

        {/* Handle line hairline — subtle drag hint, KHÔNG teardrop giọt kính. Idle 24×1px
            opacity 0.4; hover/active 24×3px opacity 0.9. Vùng bắt pointer 40×12px lớn
            hơn phần vẽ để không phải "chạm chuẩn" mới drag được. */}
        <div
          ref={handleRef}
          data-vitals-gesture-handle
          onPointerDown={onHandlePointerDown}
          onMouseEnter={() => setHandleActive(true)}
          onMouseLeave={() => {
            if (!hintTooltip) setHandleActive(false);
          }}
          aria-label="Kéo xuống để hỏi Vitals"
          role="button"
          tabIndex={-1}
          style={{
            position: 'absolute',
            left: '50%',
            top: '100%',
            transform: 'translateX(-50%)',
            width: 40,
            height: 12,
            display: 'grid',
            placeItems: 'center',
            cursor: 'grab',
            touchAction: 'none',
            zIndex: 5,
          }}
        >
          <motion.span
            aria-hidden
            animate={{
              width: handleWidth,
              height: handleHeight,
              opacity: handleOpacity,
            }}
            transition={{ duration: 0.18, ease: easeApple }}
            style={{
              display: 'block',
              borderRadius: 2,
              background: 'var(--t4)',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Tooltip onboarding — chỉ hiện lần đầu, 4s, có mũi tên nhỏ. */}
        <AnimatePresence>
          {hintTooltip && !wasVitalsUsed() && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4, transition: { duration: 0.18 } }}
              transition={{ duration: 0.22, ease: easeApple }}
              style={{
                position: 'absolute',
                left: '50%',
                top: 'calc(100% + 18px)',
                transform: 'translateX(-50%)',
                whiteSpace: 'nowrap',
                fontSize: 10.5,
                letterSpacing: '0.02em',
                color: 'var(--t2)',
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '4px 8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                zIndex: 10,
                pointerEvents: 'none',
              }}
            >
              ↓ Kéo xuống để hỏi Vitals
            </motion.div>
          )}
        </AnimatePresence>

        {/* Panel chat Vitals ĐÃ RỜI KHỎI ĐÂY (04/09) — nay là mức ③ Engage của khẩu độ mép
            trên, `components/studio/VitalsAperture.tsx`. Cử chỉ kéo xuống ở trên vẫn mở đúng
            panel đó qua kho dùng chung `lib/vitals-ui.ts`. */}
      </div>
      {/* 03/08 SPEC-APP-SHELL-CHUNG §2 mục 4 — nhãn "— 01/02/03" ĐÃ CẮT HẲN: Hoà chỉ ra "nhãn
          không ai hiểu" (vi phạm SPEC-NGON-NGU-CHI-DAN — số thứ tự chặng là jargon nội bộ, nút
          pill ngay cạnh đã ghi tên chặng rõ ràng). Bản 30/07 từng giữ số 2 chữ số làm "bất biến
          bề rộng" — nay avatar/⋯ đã rời header nên không còn thứ gì phía sau để nhảy vị trí. */}
      {photoContext && (
        <span
          style={{
            fontSize: 11.5,
            color: 'var(--t3)',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ width: 4, height: 4, borderRadius: 4, background: 'var(--accent)' }} />
          Chỉnh ảnh
        </span>
      )}

      {/* Nút Vitals nổi (VIỆC 3, 27/07) ĐÃ GỠ (VIỆC A, 28/07) — thay bằng vùng Vitals giữa
          StatusBar (components/studio/StatusBar.tsx), điểm gọi chính thức DUY NHẤT hiện nay.
          ⌘J/Ctrl+J + cử chỉ kéo ở trên vẫn gọi đúng `panelOpen` này (nay ở lib/vitals-ui.ts). */}
    </div>
  );
}
