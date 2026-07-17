'use client';

/**
 * components/present-editor/SlidePlayer.tsx — TRÌNH CHIẾU deck với hiệu ứng động.
 *
 * Overlay toàn màn 16:9 giữa nền tối. Mỗi slide render bằng renderEditorSlide (ảnh tĩnh
 * trung thực) rồi bọc trong motion để chạy transition/reveal (motion-present). Điều hướng:
 * ← → / Space / click phải-trái, Esc để thoát. Đây là kênh xem hiệu ứng — không sửa model.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { EditorDeck } from '@/lib/present-editor/model';
import { renderEditorSlide } from '@/lib/present-editor/render';
import { slideVariants } from '@/lib/present-editor/motion-present';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  deck: EditorDeck;
  startIndex?: number;
  onClose: () => void;
}

export default function SlidePlayer({ deck, startIndex = 0, onClose }: Props) {
  const [idx, setIdx] = useState(Math.min(startIndex, deck.slides.length - 1));
  const [dir, setDir] = useState(1);
  const [imgs, setImgs] = useState<Record<number, string>>({});
  const busyRef = useRef(false);

  const slide = deck.slides[idx];
  const transition = slide?.transition ?? deck.transition ?? 'fade';

  // render ảnh slide hiện tại (+ kế tiếp để prefetch mượt).
  useEffect(() => {
    let alive = true;
    (async () => {
      for (const i of [idx, idx + 1, idx - 1]) {
        if (i < 0 || i >= deck.slides.length || imgs[i]) continue;
        try {
          const url = await renderEditorSlide(deck.slides[i], deck.fonts, deck.watermark);
          if (!alive) return;
          setImgs((p) => ({ ...p, [i]: url }));
        } catch {
          /* bỏ qua */
        }
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, deck]);

  const go = useCallback(
    (d: 1 | -1) => {
      if (busyRef.current) return;
      setDir(d);
      setIdx((i) => Math.max(0, Math.min(deck.slides.length - 1, i + d)));
    },
    [deck.slides.length],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        go(1);
      } else if (e.key === 'ArrowLeft') go(-1);
    }
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [go, onClose]);

  const variants = useMemo(() => slideVariants(transition), [transition]);
  const cur = imgs[idx];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        background: '#0a0a0c',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* nút đóng */}
      <button type="button" onClick={onClose} title="Thoát (Esc)" style={closeBtn}>
        <X size={18} />
      </button>

      {/* khung 16:9 */}
      <div style={{ width: 'min(94vw, 166vh)', aspectRatio: '16 / 9', position: 'relative', overflow: 'hidden', borderRadius: 8 }}>
        <AnimatePresence custom={dir} mode="sync" initial={false}>
          <motion.div
            key={idx}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            onAnimationStart={() => (busyRef.current = true)}
            onAnimationComplete={() => (busyRef.current = false)}
            style={{ position: 'absolute', inset: 0, background: slide?.background || '#000' }}
          >
            {cur ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cur} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: '#666', fontSize: 13 }}>
                Đang dựng…
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* điều hướng */}
      <button type="button" onClick={() => go(-1)} disabled={idx === 0} style={{ ...navBtn, left: 16 }} title="Trước (←)">
        <ChevronLeft size={22} />
      </button>
      <button
        type="button"
        onClick={() => go(1)}
        disabled={idx === deck.slides.length - 1}
        style={{ ...navBtn, right: 16 }}
        title="Sau (→ / Space)"
      >
        <ChevronRight size={22} />
      </button>

      <div style={counter}>
        {idx + 1} / {deck.slides.length}
      </div>
    </div>
  );
}

const closeBtn: React.CSSProperties = {
  position: 'absolute',
  top: 16,
  right: 16,
  width: 38,
  height: 38,
  display: 'grid',
  placeItems: 'center',
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,.14)',
  background: 'rgba(255,255,255,.06)',
  color: '#fff',
  cursor: 'pointer',
  zIndex: 2,
};

const navBtn: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  width: 44,
  height: 44,
  display: 'grid',
  placeItems: 'center',
  borderRadius: '50%',
  border: '1px solid rgba(255,255,255,.14)',
  background: 'rgba(255,255,255,.06)',
  color: '#fff',
  cursor: 'pointer',
};

const counter: React.CSSProperties = {
  position: 'absolute',
  bottom: 16,
  left: '50%',
  transform: 'translateX(-50%)',
  padding: '4px 12px',
  borderRadius: 20,
  background: 'rgba(255,255,255,.08)',
  color: '#e7e2d8',
  fontSize: 12,
  letterSpacing: 1,
};
