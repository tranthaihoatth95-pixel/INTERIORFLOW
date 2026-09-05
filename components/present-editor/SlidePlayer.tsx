'use client';

/**
 * components/present-editor/SlidePlayer.tsx — TRÌNH CHIẾU deck với hiệu ứng động.
 *
 * Overlay toàn màn, khung giữ ĐÚNG tỉ lệ khổ trình bày đang chọn (PS-4 — mặc định 16:9) giữa
 * nền tối. Mỗi slide render DOM THẬT qua PlayerElements (KHÔNG raster hoá bằng renderEditorSlide
 * như trước — raster gộp mọi phần tử vào 1 ảnh nên không thể build-in TỪNG phần tử độc lập, xem
 * PlayerElements.tsx) rồi bọc trong motion để chạy transition CẢ SLIDE (motion-present). Điều
 * hướng: ← → / Space / click phải-trái, Esc để thoát. Đây là kênh xem hiệu ứng — không sửa model.
 *
 * `containerType: 'size'` đặt ở khung khổ trình bày (ngoài AnimatePresence) để đơn vị `cqh` của
 * TextInner (Element.tsx) tính đúng — trước đây không cần vì render.ts (canvas) không dùng CSS
 * container query units.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import type { EditorDeck } from '@/lib/present-editor/model';
import { stageFor } from '@/lib/present-editor/stage-presets';
import { slideVariants } from '@/lib/present-editor/motion-present';
import { savePresentReturn } from '@/lib/present-editor/present-return';
import PlayerElements from './PlayerElements';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDismissable } from '@/lib/useDismissable';
import VoiceNav from '@/components/voice/VoiceNav';

interface Props {
  deck: EditorDeck;
  startIndex?: number;
  onClose: () => void;
}

export default function SlidePlayer({ deck, startIndex = 0, onClose }: Props) {
  const [idx, setIdx] = useState(Math.min(startIndex, deck.slides.length - 1));
  const [dir, setDir] = useState(1);
  const busyRef = useRef(false);
  const router = useRouter();
  const pathname = usePathname();

  /**
   * DEEP LINK từ slide (BaseElement.href, 21/08): lưu mốc quay-về (đường Present + slide đang
   * đứng) rồi mới điều hướng — người trình bày quay lại là đứng ĐÚNG slide này ở chế độ trình
   * chiếu (PresentEditor tiêu mốc lúc mount). Chỉ nhận đường nội bộ '/', chặn '//' (protocol-
   * relative ra ngoài) — không mở URL ngoài từ một cú bấm trình chiếu.
   */
  const moLink = useCallback(
    (href: string) => {
      if (!href.startsWith('/') || href.startsWith('//')) return;
      savePresentReturn({ path: pathname ?? '/', slideIndex: idx });
      // ĐÓNG player TRƯỚC khi rời trang: `playing` là store TOÀN CỤC (usePlayStatus) sống xuyên
      // điều hướng — không đóng thì lúc quay về PresentEditor mount lại player NGAY với
      // currentSlide=0 (trước khi effect tiêu mốc kịp chạy) ⇒ mở nhầm slide 1. Đã thấy thật.
      onClose();
      router.push(href);
    },
    [router, pathname, idx, onClose],
  );

  const slide = deck.slides[idx];
  const transition = slide?.transition ?? deck.transition ?? 'fade';
  const stage = useMemo(() => stageFor(deck.stagePreset), [deck.stagePreset]);

  const go = useCallback(
    (d: 1 | -1) => {
      if (busyRef.current) return;
      setDir(d);
      setIdx((i) => Math.max(0, Math.min(deck.slides.length - 1, i + d)));
    },
    [deck.slides.length],
  );

  // Điều hướng ← → / Space — tách riêng khỏi Escape (nay đi qua useDismissable bên dưới).
  // Guard né ô nhập (luật keydown-ne-o-nhap, khuôn PresentViewer.tsx): overlay trình chiếu hiện
  // KHÔNG có ô nhập thật nên hành vi không đổi — guard đứng đây để listener capture toàn cục này
  // không nuốt Space/mũi tên nếu mai sau có input (ghi chú, nhảy trang) sống cùng overlay.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = document.activeElement;
      if (el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))) return;
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        go(1);
      } else if (e.key === 'ArrowLeft') go(-1);
    }
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [go]);

  // 2.2.90 ĐỢT 3 — Esc thoát trình chiếu, chuyển sang useDismissable dùng chung. Overlay toàn màn
  // này chỉ mount khi playing (xem PresentEditor.tsx) → open:true cố định lúc mounted. Không có
  // bấm-ra-ngoài-để-đóng ở bản gốc (chỉ Esc/nút X) — giữ outside:false.
  useDismissable({ open: true, onDismiss: onClose, refs: [], outside: false });

  const variants = useMemo(() => slideVariants(transition), [transition]);

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

      {/* khung theo khổ trình bày đang chọn (PS-4) — width = giải phương trình "khít 94vh
          theo chiều cao" rồi kẹp trần 94vw, tổng quát hoá công thức 166vh cũ (vốn chỉ đúng
          cho riêng tỉ lệ 16:9 = 94×16/9 ≈ 167). */}
      <div
        style={{
          width: `min(94vw, calc(94vh * ${stage.w / stage.h}))`,
          aspectRatio: `${stage.w} / ${stage.h}`,
          position: 'relative',
          overflow: 'hidden',
          // "Giấy thì vuông, vỏ thì bo" (docs/SPEC-UI-SHELL.md §3B) — đây là mô phỏng đúng
          // khung trình chiếu thật, PHẢI vuông góc như PDF/PPTX xuất ra.
          borderRadius: 0,
          border: '1px solid rgba(255,255,255,0.08)',
          containerType: 'size',
        }}
      >
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
            {slide ? (
              <PlayerElements
                slide={slide}
                fonts={deck.fonts}
                watermark={deck.watermark}
                deckReveal={deck.reveal}
                onOpenLink={moLink}
              />
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
        <ChevronLeft size={20} />
      </button>
      <button
        type="button"
        onClick={() => go(1)}
        disabled={idx === deck.slides.length - 1}
        style={{ ...navBtn, right: 16 }}
        title="Sau (→ / Space)"
      >
        <ChevronRight size={20} />
      </button>

      <div style={counter}>
        {idx + 1} / {deck.slides.length}
      </div>

      {/* Giọng nói (02/09) — chỉ lật trang, cùng `go`/kẹp biên như phím; không đụng deck. */}
      <div style={{ position: 'absolute', bottom: 12, right: 16, zIndex: 2 }}>
        <VoiceNav
          idx={idx}
          total={deck.slides.length}
          onGo={(n) => { if (busyRef.current) return; setDir(n > idx ? 1 : -1); setIdx(n); }}
          tone="dark"
        />
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
