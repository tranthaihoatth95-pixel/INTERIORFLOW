'use client';

/**
 * components/studio/StageSwitcher.tsx — TRỤC ĐIỀU HƯỚNG DUY NHẤT của app: 3 chặng
 * Concept · Render · Present.
 *
 * 23/07 — RESTORE GESTURE, KHÔNG VISUAL GIỌT KÍNH: user chốt "bỏ hiệu ứng giọt
 * kính nhưng phải chừa lại cho người ra cử chỉ kéo xuống hiện ô chat được tối
 * ưu trả lời cho từng chặng". Cách làm:
 *   - Handle line hairline 24×1px ở giữa-dưới dock (dạng iOS bottom sheet
 *     handle). Idle 1px opacity 0.4; hover/active 3px opacity 0.9. Rất subtle,
 *     hint cử chỉ mà không cầu kỳ (tinh thần quiet-luxury TTT).
 *   - Pointer-down trên handle → `createStageDragTracker` phân biệt click/trượt
 *     ngang/kéo xuống (lib/input/stage-drop.ts). Kéo xuống vượt 28px → mở
 *     `VitalsGesturePanel`, chat với backend context-aware theo `active` chặng.
 *   - Pre-mount panel khi drag bắt đầu (fix motion khưng 8d3b6a4 vẫn giữ):
 *     mount opacity 0 → threshold hit set open=true, không cold-mount.
 *   - Onboarding subtle: lần đầu vào 1 trong 3 chặng, handle line hiện active
 *     3s + tooltip "↓ Kéo xuống để hỏi Vitals" 4s (key `gesture_hint_seen`).
 *     Sau lần drag đầu (`gesture_first_done`) không hiện lại tooltip.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { PencilRuler, Box, Presentation } from 'lucide-react';
import type { Phase } from '@/lib/phases';
import { PHASES, STAGE_TINT, STAGE_INDEX, phaseLabel } from '@/lib/phases';
import { useCadStore } from '@/lib/cad/store';
import { useFlowStore } from '@/lib/store';
import { springSheet, pressable, easeApple } from '@/lib/motion';
import { createStageDragTracker } from '@/lib/input/stage-drop';
import { useVitalsUi } from '@/lib/vitals-ui';
import VitalsGesturePanel, { markVitalsUsed, wasVitalsUsed } from './VitalsGesture';

/** Cùng công thức slug của NotebookButton cũ (đã bỏ khỏi Header). */
const ICON: Record<Phase, typeof PencilRuler> = { concept: PencilRuler, render: Box, present: Presentation };

/**
 * 7.3.31 (30/07) — bản CHỮ ĐẬM RỘNG NHẤT mỗi nút chặng CÓ THỂ hiện, dùng làm `data-label` ghost
 * (xem `.stage-btn::before` ở globals.css) để chiếm sẵn chỗ, không đổi bề rộng khi active/
 * inactive hay khi đổi cadStage. Render/Present chỉ có 1 nhãn — dùng chính nó. CAD có 3 biến
 * thể theo cadStage ('CAD · Phác thảo'/'CAD · Kỹ thuật'/'CAD · BIM') — 'Phác thảo' dài nhất
 * trong 3, dùng cố định làm ghost dù cadStage đang là gì (cadStage hiện luôn = 'sketch' trong
 * thực tế — `setStage()` KHÔNG được gọi ở đâu trong UI, `cadStageFromProjectStage()` chỉ có
 * trong test — nên đây là phòng xa cho lúc field này được nối thật, không đổi gì hôm nay).
 */
const WIDEST_LABEL: Record<Phase, string> = {
  concept: 'CAD · Phác thảo',
  render: 'Rendering',
  present: 'Presenting',
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

  const dockRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  const [dragging, setDragging] = useState(false);
  // VIỆC A (28/07): panelOpen/anchor nâng lên store dùng chung (lib/vitals-ui.ts) — StatusBar
  // (điểm gọi chính thức mới, giữa status bar) cũng mở/đóng panel này qua `open()`/`toggle()`.
  // `anchor` phân biệt NƠI panel mọc ra (StageSwitcher này, đỉnh màn = 'gesture' · StatusBar,
  // đáy màn = 'statusbar') — component nào KHÔNG khớp anchor thì KHÔNG mount panel, tránh 2
  // popover chồng nhau. Cử chỉ kéo tay/chạm ở DƯỚI ĐÂY giữ nguyên 100% hành vi cũ, luôn dùng
  // anchor='gesture'; ⌘J/Ctrl+J đổi sang neo 'statusbar' (điểm gọi chính thức mới).
  const panelOpen = useVitalsUi((s) => s.panelOpen && s.anchor === 'gesture');
  const openShared = useVitalsUi((s) => s.open);
  const closeShared = useVitalsUi((s) => s.close);
  const setPanelOpen = useCallback(
    (v: boolean | ((prev: boolean) => boolean)) => {
      const cur = useVitalsUi.getState();
      const curForThisAnchor = cur.panelOpen && cur.anchor === 'gesture';
      const next = typeof v === 'function' ? (v as (prev: boolean) => boolean)(curForThisAnchor) : v;
      if (next) openShared('gesture');
      else closeShared();
    },
    [openShared, closeShared],
  );
  const [originPx, setOriginPx] = useState<number | null>(null);
  const [handleActive, setHandleActive] = useState(false); // hover HOẶC onboarding highlight
  const [hintTooltip, setHintTooltip] = useState(false);

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
    } catch {}
  }, []);

  const onHandlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      const el = handleRef.current;
      const dock = dockRef.current;
      if (!el || !dock) return;

      const dockRect = dock.getBoundingClientRect();
      const startX = e.clientX;
      const startY = e.clientY;
      const tracker = createStageDragTracker();

      // Origin panel: nơi ngón tay bắt đầu, tính từ mép trái dock.
      setOriginPx(Math.max(0, Math.min(dockRect.width, startX - dockRect.left)));
      setDragging(true); // → pre-mount panel với open=false (fix motion khưng)

      try {
        el.setPointerCapture(e.pointerId);
      } catch {}

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
          } catch {}
        } else if (v === 'notebook-full') {
          // Kéo lần 2 — bỏ popover, mở NotebookLM full modal (route hiện có).
          setPanelOpen(false);
          setDragging(false);
          markVitalsUsed();
          try {
            localStorage.setItem(FIRST_DONE_KEY, '1');
          } catch {}
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
        } catch {}
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

  const shouldMountPanel = dragging || panelOpen;

  // ⌘J (Mac) / Ctrl+J (Win) — mở/đóng Vitals, cả 3 chặng (StageSwitcher mount ở cả 3).
  // Đã grep trước: repo chưa dùng phím 'j' ở đâu khác — không đè phím tắt sẵn có.
  // VIỆC A (28/07): neo 'statusbar' — StatusBar (điểm gọi chính thức) tự mount panel của NÓ khi
  // store báo mở, StageSwitcher không cần biết/làm gì thêm ở đây (không đụng dragging cục bộ).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'j' || e.key === 'J')) {
        e.preventDefault();
        useVitalsUi.getState().toggle('statusbar');
        markVitalsUsed();
        try {
          localStorage.setItem(FIRST_DONE_KEY, '1');
        } catch {}
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Ẩn tooltip khi user đã drag lần đầu (dù chưa hết 4s).
  useEffect(() => {
    if (!hintTooltip) return;
    try {
      if (localStorage.getItem(FIRST_DONE_KEY) === '1') setHintTooltip(false);
    } catch {}
  }, [hintTooltip, dragging]);

  const handleWidth = 24;
  const handleHeight = handleActive ? 3 : 1;
  const handleOpacity = handleActive ? 0.9 : 0.4;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
      <div
        ref={dockRef}
        className="if-dock"
        role="tablist"
        aria-label="Chặng làm việc"
        style={{ position: 'relative' }}
      >
        {PHASES.map((p) => {
          const Icon = ICON[p.id];
          const on = p.id === active;
          return (
            <motion.button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={on}
              {...pressable}
              onClick={() => onPick(p.id)}
              title={`${phaseLabel(p.id, p.id === 'concept' ? cadStage : undefined)} — ${p.tagline}`}
              className="stage-btn"
              data-label={WIDEST_LABEL[p.id]}
              style={{
                padding: '6px 12px',
                borderRadius: 9,
                border: 'none',
                fontSize: 12.5,
                fontWeight: on ? 600 : 500,
                color: on ? 'var(--t1)' : 'var(--t4)',
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
                    borderRadius: 9,
                    background: 'var(--card)',
                    boxShadow:
                      'inset 0 0 0 1px var(--border), 0 1px 2px rgba(0,0,0,.1), 0 3px 8px -2px rgba(0,0,0,.12)',
                    zIndex: 0,
                  }}
                />
              )}
              <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon size={13} strokeWidth={on ? 2.2 : 2} /> {phaseLabel(p.id, p.id === 'concept' ? cadStage : undefined)}
                {/* IF2-nền — badge "Coming soon · IF2" khi CAD ở chặng kỹ thuật/BIM mà tính năng
                    thật (BIM viewer/IFC/clash) chưa build. Đặt ngay cạnh nhãn pill để hoạ viên/
                    khách demo hiểu là tính năng sắp có, không phải lỗi. Class chấm bé xíu, không
                    phá layout thanh pill. */}
                {p.id === 'concept' && (cadStage === 'technical' || cadStage === 'bim') && (
                  <span
                    aria-label="Coming soon · IF2"
                    title="Chặng kỹ thuật/BIM · Sắp có · Coming soon · IF2"
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

        {/* Panel chat Vitals — pre-mount khi dragging, chỉ open khi threshold hit. */}
        {shouldMountPanel && (
          <VitalsGesturePanel
            originPx={originPx}
            open={panelOpen}
            onClose={() => {
              setPanelOpen(false);
              setDragging(false);
            }}
            stage={active}
          />
        )}
      </div>
      <span
        className="if-stage-label"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 9.5,
          fontWeight: 600,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--t4)',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ width: 14, height: 1, background: STAGE_TINT[active] }} />
        {/* 7.3.31 (30/07) — bỏ hẳn `· {label}` trùng thông tin với nút pill NGAY BÊN CẠNH (đã ghi
           tên chặng rõ ràng) — vi phạm Luật #6 Đồng Bộ, và bản thân nó là nguyên nhân ③ khiến
           Tệp/⋯/avatar nhảy vị trí (3 độ dài khác nhau đẩy mọi thứ SAU nó). Giữ đúng số 2 chữ số
           (bất biến bề rộng) + vạch màu chặng — đủ phân biệt, không lặp lại chữ đã có. */}
        {STAGE_INDEX[active]}
      </span>
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
