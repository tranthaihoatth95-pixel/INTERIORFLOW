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
import VitalsGesturePanel, { markVitalsUsed, wasVitalsUsed } from './VitalsGesture';

/** Cùng công thức slug của NotebookButton cũ (đã bỏ khỏi Header). */
function slugifyFlow(s: string) {
  return (
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'default'
  );
}

const ICON: Record<Phase, typeof PencilRuler> = { concept: PencilRuler, render: Box, present: Presentation };

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
  const flowName = useFlowStore((s) => s.flowName);
  const router = useRouter();

  const dockRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  const [dragging, setDragging] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
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
          const id = slugifyFlow(flowName || 'default');
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
    [panelOpen, flowName, router],
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
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
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
        {STAGE_INDEX[active]} · {PHASES.find((p) => p.id === active)?.label}
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
    </div>
  );
}
