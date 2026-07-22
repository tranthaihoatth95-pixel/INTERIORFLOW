'use client';

/**
 * components/studio/StageSwitcher.tsx — TRỤC ĐIỀU HƯỚNG DUY NHẤT của app: 3 chặng
 * Concept · Render · Present.
 *
 * Trước đây header có tới 3 cụm switcher chồng vai trò (2 cụm cùng ghi "Node"):
 * PhaseSwitcher + ViewToggle(Node/Window "soon") + uiMode(Node/Form — đã bỏ). Nay gom về 1:
 *   - Concept/Render = xưởng làm việc (canvas node) ở route '/'.
 *   - Present = slide studio (/present-editor) — chính là "Window view" từng hứa.
 *   - Chỉnh ảnh (Photo) KHÔNG phải chặng — là công cụ con của Render (photoContext).
 *
 * Thuần presentational: parent quyết hành vi qua onPick (Header đổi workspace / studio
 * điều hướng route). Cùng 1 giao diện ở mọi nơi → app liền một mạch.
 *
 * 21/07 — VITALS Ở CHẶNG (giọt kính lỏng): Vitals AI "ẩn mình" trong chính thanh này.
 *   - Click/trượt ngang các tab = chuyển chặng Y HỆT cũ (không đổi 1 li).
 *   - TRỎ vào tab rồi KÉO XUỐNG vượt ngưỡng 28px (lib/input/stage-drop.ts — phân biệt
 *     trục như wheel.ts) → giọt kính kéo dãn dưới thanh rồi TÁCH thành panel chat nhỏ
 *     (VitalsStageDrop.tsx, tái dùng route ai-assist-chat của bản Gallery).
 *   - Fallback khám phá: hover thanh ~0.9s hiện tooltip "Kéo xuống để hỏi Vitals · ⌘J",
 *     và phím tắt ⌘J / Ctrl+J mở-đóng trực tiếp (quan trọng cho cảm ứng + người mới).
 *   - prefers-reduced-motion: bỏ giọt kéo dãn, panel fade đơn giản.
 * Gesture nằm TRONG component này nên Header ('/') lẫn StudioBar (3 route studio) tự có
 * hành vi giống hệt nhau, không sửa 2 nơi.
 */

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useTransform, useReducedMotion } from 'framer-motion';
import { PencilRuler, Box, Presentation } from 'lucide-react';
import type { Phase } from '@/lib/phases';
import { PHASES, STAGE_TINT, STAGE_INDEX } from '@/lib/phases';
import { springSheet, pressable, easeApple } from '@/lib/motion';
import { createStageDragTracker, VITALS_DROP_THRESHOLD_PX } from '@/lib/input/stage-drop';
import VitalsDropPanel, { markVitalsUsed, wasVitalsUsed } from './VitalsStageDrop';

// Chặng 1 = Drafting CAD → icon thước-bút; Rendering = khối; Presenting = trình chiếu.
const ICON: Record<Phase, typeof PencilRuler> = { concept: PencilRuler, render: Box, present: Presentation };

// Copper — chữ ký thị giác Vitals (đồng bộ VitalsStageDrop/Gallery).
const COPPER_LIGHT = '#e3b98a';
const COPPER_DEEP = '#c79a63';

interface Props {
  /** chặng đang sáng. */
  active: Phase;
  /** click 1 chặng. */
  onPick: (p: Phase) => void;
  /** true khi đang ở photo-editor (active=render + hiện nhãn "Chỉnh ảnh"). */
  photoContext?: boolean;
}

export default function StageSwitcher({ active, onPick, photoContext }: Props) {
  const reduce = useReducedMotion();

  /* ---------- Vitals giọt kính lỏng — state cử chỉ ---------- */
  const wrapRef = useRef<HTMLDivElement>(null);
  const [vitalsOpen, setVitalsOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [hintShown, setHintShown] = useState(false);
  const [hover, setHover] = useState(false);
  /** 21/07 v2 — onboarding rõ hơn (user báo "ai mà biết"): key mới `hint_seen_v2` reset cho
   *  mọi user cũ. Lần đầu vào bất kỳ chặng: sau 1s giọt kính "chào" bằng 1 drip rõ + tooltip
   *  6s "Kéo xuống để hỏi Vitals · Drag down to ask" có mũi tên chỉ xuống. */
  const [onboardingHint, setOnboardingHint] = useState(false);
  /** Reminder tooltip cho user chưa từng drag: hiện 3s mỗi 60s, tối đa 3 lần/session. */
  const [reminderHint, setReminderHint] = useState(false);
  /** true khi cần chạy 1 drip "chào" đầu tiên (biên độ lớn hơn drip hint thường). */
  const [greetingDrip, setGreetingDrip] = useState(false);
  /** true khi drip hint chu kỳ chạy (idle 8-12s / lần). */
  const [dripHint, setDripHint] = useState(false);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onboardingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dripTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reminderTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  /** true = cử chỉ kéo vừa bắn Vitals → nuốt click kế tiếp, KHÔNG cho chuyển chặng nhầm. */
  const suppressClick = useRef(false);
  /** px giọt đang bị kéo dãn (0..threshold+8) — motion value để không re-render 60fps. */
  const dragY = useMotionValue(0);
  /** vị trí ngang điểm kéo (px, so với mép trái wrapper) — giọt + origin panel mọc từ đây. */
  const [dropX, setDropX] = useState(0);
  /** origin panel: px điểm kéo (mở bằng cử chỉ) · null = giữa (mở bằng ⌘J). */
  const [originPx, setOriginPx] = useState<number | null>(null);

  // Opacity giọt: hiện dần theo dragY (rõ như giọt sắp rơi).
  const dropletO = useTransform(dragY, [0, 8, VITALS_DROP_THRESHOLD_PX], [0, 0.55, 0.95]);
  const dropletScaleY = useTransform(dragY, [0, VITALS_DROP_THRESHOLD_PX], [0.25, 1]);

  const openVitals = () => {
    markVitalsUsed();
    setHintShown(false);
    setReminderHint(false);
    // Lần drag đầu tiên → khoá reminder loop v2 vĩnh viễn.
    try {
      localStorage.setItem('interiorflow.vitals.first_drag_done', '1');
    } catch {}
    if (reminderTimer.current) {
      clearInterval(reminderTimer.current);
      reminderTimer.current = null;
    }
    setVitalsOpen(true);
  };

  // Fallback 1 — phím tắt ⌘J / Ctrl+J mở-đóng panel (không đụng cử chỉ nào của canvas).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setOriginPx(null); // mở bằng phím → panel nở từ giữa
        setVitalsOpen((o) => {
          if (!o) markVitalsUsed();
          return !o;
        });
        setHintShown(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => () => {
    if (hintTimer.current) clearTimeout(hintTimer.current);
    if (onboardingTimer.current) clearTimeout(onboardingTimer.current);
    if (dripTimer.current) clearTimeout(dripTimer.current);
    if (reminderTimer.current) clearInterval(reminderTimer.current);
  }, []);

  // Onboarding v2 — 6s + greeting drip. Key mới `hint_seen_v2` reset cho tất cả user cũ.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let seen = false;
    try {
      seen = localStorage.getItem('interiorflow.vitals.hint_seen_v2') === '1';
    } catch {
      return;
    }
    if (seen) return;
    // Sau 1s: giọt kính "chào" bằng 1 drip biên độ lớn + tooltip 6s có mũi tên chỉ xuống.
    const greetTimer = setTimeout(() => {
      setGreetingDrip(true);
      setOnboardingHint(true);
      setTimeout(() => setGreetingDrip(false), 900);
    }, 1000);
    onboardingTimer.current = setTimeout(() => {
      setOnboardingHint(false);
      try {
        localStorage.setItem('interiorflow.vitals.hint_seen_v2', '1');
      } catch {}
    }, 7000);
    return () => {
      clearTimeout(greetTimer);
      if (onboardingTimer.current) clearTimeout(onboardingTimer.current);
    };
  }, []);

  // Drip hint chu kỳ 8-12s (randomize để tự nhiên) — motion "giọt sắp rơi" 800ms.
  // Không chạy khi đang drag/hover/vitalsOpen/reduce-motion/greetingDrip đang chạy.
  useEffect(() => {
    if (reduce) return;
    if (dragging || vitalsOpen) return;
    let alive = true;
    const schedule = () => {
      if (!alive) return;
      const delay = 8000 + Math.random() * 4000; // 8-12s
      dripTimer.current = setTimeout(() => {
        if (!alive) return;
        setDripHint(true);
        setTimeout(() => {
          if (!alive) return;
          setDripHint(false);
          schedule();
        }, 800);
      }, delay);
    };
    schedule();
    return () => {
      alive = false;
      if (dripTimer.current) clearTimeout(dripTimer.current);
    };
  }, [reduce, dragging, vitalsOpen]);

  // Reminder loop — user chưa từng drag: mỗi 60s hiện 3s tooltip nhắc, tối đa 3 lần/session.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let done = false;
    try {
      done = localStorage.getItem('interiorflow.vitals.first_drag_done') === '1';
    } catch {
      return;
    }
    if (done) return;
    let count = 0;
    reminderTimer.current = setInterval(() => {
      if (count >= 3 || vitalsOpen) return;
      count += 1;
      setReminderHint(true);
      setTimeout(() => setReminderHint(false), 3000);
      if (count >= 3 && reminderTimer.current) {
        clearInterval(reminderTimer.current);
        reminderTimer.current = null;
      }
    }, 60000);
    return () => {
      if (reminderTimer.current) clearInterval(reminderTimer.current);
    };
  }, [vitalsOpen]);

  // Nhấn xuống trên thanh → theo dõi cử chỉ ở mức window (KHÔNG setPointerCapture:
  // capture sẽ cướp click khỏi tab và phá chuyển chặng). Tracker thuần quyết định:
  // ngang/click = như cũ · dọc xuống vượt ngưỡng = Vitals.
  const onDockPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (vitalsOpen) return;
    const rect = wrapRef.current?.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    // px điểm kéo — biến CỤC BỘ để closure onMove không dính state cũ.
    const px = rect ? Math.max(10, Math.min(startX - rect.left, rect.width - 10)) : 0;
    setDropX(px);
    const tracker = createStageDragTracker();
    let live = true;
    const finish = () => {
      if (!live) return;
      live = false;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      setDragging(false);
      dragY.set(0);
    };
    const onMove = (ev: PointerEvent) => {
      if (!live) return;
      const v = tracker.move(ev.clientX - startX, ev.clientY - startY);
      if (v === 'locked') {
        finish();
        return;
      }
      if (v === 'vitals') {
        suppressClick.current = true; // pointerup có thể vẫn rơi trong tab → nuốt click
        finish();
        setOriginPx(px); // panel nở từ đúng điểm giọt được kéo ra
        openVitals();
        return;
      }
      const dy = ev.clientY - startY;
      if (dy > 2) {
        setDragging(true);
        dragY.set(Math.min(Math.max(dy, 0), VITALS_DROP_THRESHOLD_PX + 8));
      }
    };
    const onUp = () => finish();
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {/* wrapper relative: neo giọt kính + panel Vitals ngay dưới thanh — overlay tuyệt đối,
          KHÔNG chiếm layout nên thanh/canvas không xê dịch 1px nào. */}
      <div ref={wrapRef} style={{ position: 'relative' }}>
      {/* C-3 UNIFIED DOCK — vật liệu kính mờ (.if-dock, globals.css) dùng CHUNG
          Header app chính + StudioBar → 3 chặng nhìn/đứng y hệt nhau ở mọi nơi. */}
      <div
        className="if-dock"
        role="tablist"
        aria-label="Chặng làm việc"
        // touch-action pan-x: giữ trượt ngang hệ thống, nhường kéo DỌC cho cử chỉ Vitals
        // (không có nó, trình duyệt cảm ứng nuốt pointermove dọc thành scroll).
        style={{ touchAction: 'pan-x' }}
        onPointerDown={onDockPointerDown}
        onClickCapture={(e) => {
          // Cử chỉ kéo vừa bắn Vitals → click sinh ra sau pointerup KHÔNG được chuyển chặng.
          if (suppressClick.current) {
            suppressClick.current = false;
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        onMouseEnter={() => {
          setHover(true);
          // Fallback 2 — khả năng khám phá: hover đủ lâu (0.9s) mới thì thầm gợi ý cử chỉ;
          // thôi hiện sau lần đầu user đã gọi Vitals trong phiên tab.
          if (!wasVitalsUsed() && !vitalsOpen) {
            if (hintTimer.current) clearTimeout(hintTimer.current);
            hintTimer.current = setTimeout(() => setHintShown(true), 900);
          }
        }}
        onMouseLeave={() => {
          setHover(false);
          if (hintTimer.current) clearTimeout(hintTimer.current);
          setHintShown(false);
        }}
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
              title={`${p.label} — ${p.tagline}`}
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
              {/* pill "active" trượt mượt giữa 3 chặng (shared layout) — active-state rõ:
                  nền card + hairline viền + bóng 2 lớp nông (quiet-luxury, không neon). */}
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
                <Icon size={13} strokeWidth={on ? 2.2 : 2} /> {p.label}
                {/* Active-stage marker chấm màu đã bỏ 21/07 (user chê xấu). Chặng active
                    đã đủ phân biệt bằng: pill nền card (var(--card)) + hairline viền +
                    font-weight 600 (vs 500) + color var(--t1) (vs var(--t4)). */}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* ---------- Vitals — GIỌT KÍNH LỎNG (Apple Vision Pro style) ---------- */}
      {/* Chồm 6px dưới thanh: nhấn mạnh "kéo xuống" + không lấn tab. Teardrop SVG bezier
          (24×32 default), inner highlight specular, hairline border gradient cam→navy,
          subtle drop-shadow cam. Motion 3 lớp: idle 4s breathing · drip hint 8-12s /
          800ms · hover -2px scale 1.08. Onboarding v2 chạy 1 greeting drip biên độ lớn. */}
      {!reduce && (
        <motion.div
          aria-hidden
          animate={
            vitalsOpen || dragging
              ? { opacity: 0, y: 0, scale: 1 }
              : greetingDrip
                ? { opacity: [1, 0.85, 1], y: [0, 4, 0], scaleY: [1, 1.1, 1] }
                : dripHint
                  ? { opacity: [1, 0.85, 1], y: [0, 2, 0, -1, 0], scaleY: [1, 1.05, 1, 1, 1] }
                  : hover
                    ? { opacity: 1, y: -2, scale: 1.08 }
                    : { opacity: [0.9, 1, 0.9], y: 0, scale: 1, scaleY: 1 }
          }
          transition={
            greetingDrip
              ? { duration: 0.9, ease: easeApple }
              : dripHint
                ? { duration: 0.8, ease: easeApple }
                : hover
                  ? { duration: 0.25, ease: easeApple }
                  : { opacity: { duration: 4, repeat: Infinity, ease: 'easeInOut' } }
          }
          style={{
            position: 'absolute',
            left: '50%',
            bottom: -6,
            width: 24,
            height: 32,
            transform: 'translateX(-50%)',
            transformOrigin: '50% 0%',
            pointerEvents: 'none',
            filter: hover
              ? 'drop-shadow(0 6px 14px rgba(240,96,32,0.38))'
              : 'drop-shadow(0 4px 10px rgba(240,96,32,0.22))',
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="32"
            viewBox="0 0 40 56"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="vitals-teardrop-stroke" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F06020" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#002850" stopOpacity="0.5" />
              </linearGradient>
              <linearGradient id="vitals-teardrop-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(255,255,255,0.28)" />
                <stop offset="60%" stopColor="rgba(240,96,32,0.10)" />
                <stop offset="100%" stopColor="rgba(0,40,80,0.14)" />
              </linearGradient>
              <filter id="vitals-teardrop-blur" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="0.4" />
              </filter>
            </defs>
            {/* Teardrop path: đỉnh nhọn thuôn (20,2), phình tròn đáy — tỉ lệ ~1:1.4.
                Bezier đối xứng 2 bên. */}
            <path
              d="M 20 2
                 C 20 12, 6 22, 6 34
                 A 14 14 0 0 0 34 34
                 C 34 22, 20 12, 20 2 Z"
              fill="url(#vitals-teardrop-fill)"
              stroke="url(#vitals-teardrop-stroke)"
              strokeWidth="1"
              filter="url(#vitals-teardrop-blur)"
            />
            {/* Specular highlight — giọt nước thật: ellipse trắng nhỏ lệch đỉnh phải. */}
            <ellipse
              cx="15"
              cy="18"
              rx="3.2"
              ry="5.4"
              fill="rgba(255,255,255,0.55)"
              transform="rotate(-18 15 18)"
            />
          </svg>
        </motion.div>
      )}

      {/* Onboarding v2 + reminder loop — bong bóng dưới giọt kính, có mũi tên chỉ xuống
          để user hiểu ngay "kéo cái này xuống". Onboarding hiện 6s lần đầu; reminder
          hiện 3s mỗi 60s (max 3 lần/session) khi user chưa từng drag. */}
      <AnimatePresence>
        {(onboardingHint || reminderHint) && !vitalsOpen && !dragging && (
          <motion.div
            key="vitals-onboarding"
            initial={{ opacity: 0, y: reduce ? 0 : -4 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.28, ease: easeApple } }}
            exit={{ opacity: 0, transition: { duration: 0.2, ease: easeApple } }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 34px)',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 56,
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--card)',
              boxShadow: '0 6px 18px -6px rgba(0,0,0,0.28)',
              fontSize: 11,
              color: 'var(--t2)',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span aria-hidden style={{ fontSize: 13, lineHeight: 1, color: '#F06020' }}>↓</span>
            Kéo xuống để hỏi Vitals · Drag down to ask
          </motion.div>
        )}
      </AnimatePresence>

      {/* Giọt ĐANG KÉO — SVG teardrop bezier + feGaussianBlur (không còn seam/aliasing
          như div với border-radius + backdrop-filter). Dài ra theo dragY qua scaleY;
          feGaussianBlur mượt hoá cạnh ở GPU nên đường cong không có "răng cưa". */}
      <AnimatePresence>
        {dragging && !reduce && (
          <motion.svg
            key="vitals-droplet"
            aria-hidden
            className="vitals-droplet-svg"
            width={26}
            height={VITALS_DROP_THRESHOLD_PX + 12}
            viewBox={`0 0 26 ${VITALS_DROP_THRESHOLD_PX + 12}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.12, ease: easeApple } }}
            style={{
              position: 'absolute',
              top: '100%',
              left: dropX,
              x: '-50%',
              opacity: dropletO,
              // scaleY dãn giọt theo dragY (0..1), origin=top để giọt "chảy xuống" khỏi thanh
              scaleY: dropletScaleY,
              originY: 0,
              originX: 0.5,
            }}
          >
            <defs>
              <filter id="vitals-drop-blur" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="0.35" />
              </filter>
              <linearGradient id="vitals-drop-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COPPER_LIGHT} stopOpacity="0.28" />
                <stop offset="100%" stopColor={COPPER_DEEP} stopOpacity="0.42" />
              </linearGradient>
            </defs>
            {/* Teardrop path — đỉnh chạm mép thanh (y=0), thắt eo (13,10), bo tròn đáy.
                Bezier đối xứng 2 bên → không seam giữa. */}
            <path
              d={`M 6 0
                  C 6 6, 3 ${VITALS_DROP_THRESHOLD_PX * 0.35}, 3 ${VITALS_DROP_THRESHOLD_PX * 0.65}
                  A 10 ${VITALS_DROP_THRESHOLD_PX * 0.35} 0 0 0 23 ${VITALS_DROP_THRESHOLD_PX * 0.65}
                  C 23 ${VITALS_DROP_THRESHOLD_PX * 0.35}, 20 6, 20 0 Z`}
              fill="url(#vitals-drop-fill)"
              filter="url(#vitals-drop-blur)"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="0.5"
            />
          </motion.svg>
        )}
      </AnimatePresence>

      {/* Tooltip gợi ý cử chỉ — hover đủ lâu mới hiện, mất hẳn sau lần đầu dùng Vitals. */}
      <AnimatePresence>
        {hintShown && !vitalsOpen && !dragging && (
          <motion.div
            key="vitals-hint"
            initial={{ opacity: 0, y: reduce ? 0 : -4 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.22, ease: easeApple } }}
            exit={{ opacity: 0, transition: { duration: 0.14, ease: easeApple } }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 7px)',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 55,
              padding: '4px 10px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--card)',
              boxShadow: '0 4px 14px -4px rgba(0,0,0,0.25)',
              fontSize: 10.5,
              color: 'var(--t3)',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            Kéo xuống để hỏi Vitals · ⌘J
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panel chat nhỏ — neo dưới thanh, đè lên canvas KHÔNG backdrop, không layout shift.
          21/07 tối — pre-mount fix motion khưng: mount NGAY khi drag bắt đầu (dragging=true),
          giữ opacity 0/pointer-events none, để React commit + effect setup chạy TRONG lúc
          user còn kéo. Khi threshold hit → open=true → chỉ tween opacity/scale 220ms
          easeApple (thay springSheet ~300ms) → thấy panel mượt ngay, không cold-mount. */}
      <AnimatePresence>
        {(dragging || vitalsOpen) && (
          <VitalsDropPanel
            key="vitals-panel"
            originPx={originPx}
            open={vitalsOpen}
            onClose={() => setVitalsOpen(false)}
          />
        )}
      </AnimatePresence>
      </div>
      {/* Nhãn micro "01 · DRAFTING CAD" — label tracked uppercase theo gu TTT. Vế thứ hai của việc
          phân định chặng: pill cho biết chọn được gì, nhãn này khẳng định đang ĐỨNG ở đâu.
          Ẩn trên màn hẹp (media query .if-stage-label trong globals.css) để không chen thanh đầu. */}
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
