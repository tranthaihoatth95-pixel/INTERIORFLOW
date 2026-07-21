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
 * 21/07 — VITAS Ở CHẶNG (giọt kính lỏng): Vitas AI "ẩn mình" trong chính thanh này.
 *   - Click/trượt ngang các tab = chuyển chặng Y HỆT cũ (không đổi 1 li).
 *   - TRỎ vào tab rồi KÉO XUỐNG vượt ngưỡng 28px (lib/input/stage-drop.ts — phân biệt
 *     trục như wheel.ts) → giọt kính kéo dãn dưới thanh rồi TÁCH thành panel chat nhỏ
 *     (VitasStageDrop.tsx, tái dùng route ai-assist-chat của bản Gallery).
 *   - Fallback khám phá: hover thanh ~0.9s hiện tooltip "Kéo xuống để hỏi Vitas · ⌘J",
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
import { createStageDragTracker, VITAS_DROP_THRESHOLD_PX } from '@/lib/input/stage-drop';
import VitasDropPanel, { markVitasUsed, wasVitasUsed } from './VitasStageDrop';

// Chặng 1 = Drafting CAD → icon thước-bút; Rendering = khối; Presenting = trình chiếu.
const ICON: Record<Phase, typeof PencilRuler> = { concept: PencilRuler, render: Box, present: Presentation };

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

  /* ---------- Vitas giọt kính lỏng — state cử chỉ ---------- */
  const wrapRef = useRef<HTMLDivElement>(null);
  const [vitasOpen, setVitasOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [hintShown, setHintShown] = useState(false);
  const [hover, setHover] = useState(false);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** true = cử chỉ kéo vừa bắn Vitas → nuốt click kế tiếp, KHÔNG cho chuyển chặng nhầm. */
  const suppressClick = useRef(false);
  /** px giọt đang bị kéo dãn (0..threshold+8) — motion value để không re-render 60fps. */
  const dragY = useMotionValue(0);
  /** vị trí ngang điểm kéo (px, so với mép trái wrapper) — giọt + origin panel mọc từ đây. */
  const [dropX, setDropX] = useState(0);
  /** origin panel: px điểm kéo (mở bằng cử chỉ) · null = giữa (mở bằng ⌘J). */
  const [originPx, setOriginPx] = useState<number | null>(null);

  // Hình giọt: kéo càng xa càng dài ra + thắt ngang lại + rõ dần (như giọt nước sắp rơi).
  const dropletH = useTransform(dragY, [0, VITAS_DROP_THRESHOLD_PX], [0, VITAS_DROP_THRESHOLD_PX]);
  const dropletW = useTransform(dragY, [0, VITAS_DROP_THRESHOLD_PX], [26, 15]);
  const dropletO = useTransform(dragY, [0, 8, VITAS_DROP_THRESHOLD_PX], [0, 0.55, 0.95]);

  const openVitas = () => {
    markVitasUsed();
    setHintShown(false);
    setVitasOpen(true);
  };

  // Fallback 1 — phím tắt ⌘J / Ctrl+J mở-đóng panel (không đụng cử chỉ nào của canvas).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setOriginPx(null); // mở bằng phím → panel nở từ giữa
        setVitasOpen((o) => {
          if (!o) markVitasUsed();
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
  }, []);

  // Nhấn xuống trên thanh → theo dõi cử chỉ ở mức window (KHÔNG setPointerCapture:
  // capture sẽ cướp click khỏi tab và phá chuyển chặng). Tracker thuần quyết định:
  // ngang/click = như cũ · dọc xuống vượt ngưỡng = Vitas.
  const onDockPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (vitasOpen) return;
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
      if (v === 'vitas') {
        suppressClick.current = true; // pointerup có thể vẫn rơi trong tab → nuốt click
        finish();
        setOriginPx(px); // panel nở từ đúng điểm giọt được kéo ra
        openVitas();
        return;
      }
      const dy = ev.clientY - startY;
      if (dy > 2) {
        setDragging(true);
        dragY.set(Math.min(Math.max(dy, 0), VITAS_DROP_THRESHOLD_PX + 8));
      }
    };
    const onUp = () => finish();
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {/* wrapper relative: neo giọt kính + panel Vitas ngay dưới thanh — overlay tuyệt đối,
          KHÔNG chiếm layout nên thanh/canvas không xê dịch 1px nào. */}
      <div ref={wrapRef} style={{ position: 'relative' }}>
      {/* C-3 UNIFIED DOCK — vật liệu kính mờ (.if-dock, globals.css) dùng CHUNG
          Header app chính + StudioBar → 3 chặng nhìn/đứng y hệt nhau ở mọi nơi. */}
      <div
        className="if-dock"
        role="tablist"
        aria-label="Chặng làm việc"
        // touch-action pan-x: giữ trượt ngang hệ thống, nhường kéo DỌC cho cử chỉ Vitas
        // (không có nó, trình duyệt cảm ứng nuốt pointermove dọc thành scroll).
        style={{ touchAction: 'pan-x' }}
        onPointerDown={onDockPointerDown}
        onClickCapture={(e) => {
          // Cử chỉ kéo vừa bắn Vitas → click sinh ra sau pointerup KHÔNG được chuyển chặng.
          if (suppressClick.current) {
            suppressClick.current = false;
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        onMouseEnter={() => {
          setHover(true);
          // Fallback 2 — khả năng khám phá: hover đủ lâu (0.9s) mới thì thầm gợi ý cử chỉ;
          // thôi hiện sau lần đầu user đã gọi Vitas trong phiên tab.
          if (!wasVitasUsed() && !vitasOpen) {
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
                {/* Phân định chặng: chấm 4px tông riêng của chặng, CHỈ hiện ở chặng đang mở —
                    đủ để mắt bắt ngay "mình đang ở đâu" mà không thành trang trí. Cùng tông với
                    hairline đáy thanh đầu (StageBar/Header). */}
                {on && (
                  <span
                    aria-hidden
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: 4,
                      background: STAGE_TINT[p.id],
                      marginLeft: 1,
                    }}
                  />
                )}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* ---------- Vitas — giọt kính ẩn ở mép dưới thanh ---------- */}
      {/* Gợn kính TĨNH: chỉ hé ra khi hover (visual hint tinh tế, không phải nút).
          Đứng yên giữa thanh, như một giọt sắp đọng ở mép kính. */}
      {!reduce && (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: '50%',
            bottom: -2.5,
            transform: 'translateX(-50%)',
            width: 18,
            height: 3,
            borderRadius: '0 0 9px 9px',
            background: 'linear-gradient(rgba(255,255,255,0.3), rgba(255,255,255,0.12))',
            boxShadow: '0 1px 3px rgba(0,0,0,0.18), inset 0 0 2px rgba(255,255,255,0.35)',
            opacity: hover && !dragging && !vitasOpen ? 0.75 : 0,
            transition: 'opacity 0.25s',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Giọt ĐANG KÉO: dài ra + thắt lại theo dragY (motion value, không re-render 60fps).
          Vượt ngưỡng → giọt "tách" thành panel. Reduce-motion: bỏ hẳn, panel fade. */}
      <AnimatePresence>
        {dragging && !reduce && (
          <motion.div
            key="vitas-droplet"
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.12, ease: easeApple } }}
            style={{
              position: 'absolute',
              top: '100%',
              left: dropX,
              x: '-50%',
              height: dropletH,
              width: dropletW,
              opacity: dropletO,
              borderRadius: '0 0 999px 999px',
              background:
                'linear-gradient(rgba(255,255,255,0.22), rgba(199,154,99,0.28))',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              boxShadow:
                'inset 0 0 4px rgba(255,255,255,0.4), 0 2px 6px rgba(0,0,0,0.2)',
              pointerEvents: 'none',
            }}
          />
        )}
      </AnimatePresence>

      {/* Tooltip gợi ý cử chỉ — hover đủ lâu mới hiện, mất hẳn sau lần đầu dùng Vitas. */}
      <AnimatePresence>
        {hintShown && !vitasOpen && !dragging && (
          <motion.div
            key="vitas-hint"
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
            Kéo xuống để hỏi Vitas · ⌘J
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panel chat nhỏ — neo dưới thanh, đè lên canvas KHÔNG backdrop, không layout shift. */}
      <AnimatePresence>
        {vitasOpen && (
          <VitasDropPanel key="vitas-panel" originPx={originPx} onClose={() => setVitasOpen(false)} />
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
