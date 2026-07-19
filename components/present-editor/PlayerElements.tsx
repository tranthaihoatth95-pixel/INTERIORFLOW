'use client';

/**
 * components/present-editor/PlayerElements.tsx — lớp NỀN + PHẦN TỬ của 1 slide khi TRÌNH CHIẾU.
 *
 * TRƯỚC (nợ ẩn đã tìm thấy khi làm Animation Pane theo object): SlidePlayer raster hoá cả slide
 * thành 1 ảnh JPEG (`renderEditorSlide`) rồi chỉ chạy `slideVariants` (hiệu ứng CẢ SLIDE). Field
 * `EditorSlide.reveal` tồn tại trong model + chọn được ở MotionPanel nhưng `revealContainer` /
 * `revealItem` KHÔNG hề được gọi ở đâu khi trình chiếu — build-in phần tử trước đây KHÔNG có
 * hiệu lực thị giác nào (dead code). Vì raster hoá gộp mọi phần tử vào 1 ảnh nên KHÔNG thể build-in
 * từng phần tử độc lập.
 *
 * GIỜ: render DOM thật cho từng element (dùng LẠI đúng cách vẽ text/ảnh/shape của Element.tsx —
 * `Inner` — khớp những gì user thấy lúc chỉnh sửa ở EditorCanvas, KHÔNG viết lại logic vẽ), mỗi
 * element bọc `motion.div` build-in ĐỘC LẬP theo `computeElementRevealTimings` (thứ tự/độ trễ
 * theo object — lib/present-editor/motion-present.ts). Chỉ đọc — không có handle kéo/chọn.
 *
 * BẪY đã gặp lúc verify browser: `SlidePlayer` bọc slide trong `AnimatePresence initial={false}`
 * (để tắt animation "vào" cho slide ĐẦU khi vừa mở player). Framer Motion truyền context đó
 * xuống MỌI motion component lồng bên trong ở LẦN RENDER ĐẦU — nếu build-in phần tử chỉ dựa vào
 * `initial="hidden" animate="visible"` (transition-khi-mount), slide ĐẦU TIÊN sẽ hiện MỌI phần
 * tử ngay lập tức, bỏ qua stagger/delay hoàn toàn (im lặng, không lỗi). Sửa bằng RevealItem: lật
 * state cục bộ hidden→visible sau mount (useEffect + rAF) — animate là kết quả 1 THAY ĐỔI STATE
 * thật (không phải giá trị animate cố định lúc mount) nên Framer Motion LUÔN chạy transition,
 * bất kể context initial={false} của AnimatePresence tổ tiên.
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { EditorSlide, DeckWatermark, ElementReveal } from '@/lib/present-editor/model';
import { adjustToCssFilter } from '@/lib/present-editor/model';
import { cornerStyle } from './EditorCanvas';
import { Inner, textOverImage } from './Element';
import { computeElementRevealTimings, revealItem } from '@/lib/present-editor/motion-present';

interface Props {
  slide: EditorSlide;
  fonts: string;
  watermark?: DeckWatermark;
  /** hiệu ứng build-in mặc định cấp deck (fallback khi slide/element không tự set). */
  deckReveal?: ElementReveal;
}

export default function PlayerElements({ slide, fonts, watermark, deckReveal }: Props) {
  const timings = computeElementRevealTimings(slide, deckReveal);
  const timingById = new Map(timings.map((t) => [t.id, t]));

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* ảnh nền full-bleed (màu nền do SlidePlayer đặt ở khung ngoài) */}
      {slide.backgroundImage && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url("${slide.backgroundImage}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: adjustToCssFilter(slide.backgroundAdjust),
          }}
        />
      )}

      {slide.elements.map((el) => {
        if (el.hidden) return null;
        const timing = timingById.get(el.id);
        return (
          <div
            key={el.id}
            style={{
              position: 'absolute',
              left: `${el.frame.x}%`,
              top: `${el.frame.y}%`,
              width: `${el.frame.w}%`,
              height: `${el.frame.h}%`,
              transform: `rotate(${el.frame.rotation}deg)`,
              opacity: el.opacity ?? 1,
            }}
          >
            <RevealItem reveal={timing?.reveal} delaySec={timing?.delaySec ?? 0}>
              <Inner
                el={el}
                fonts={fonts}
                overImage={textOverImage(el, slide.elements, !!slide.backgroundImage)}
              />
            </RevealItem>
          </div>
        );
      })}

      {/* logo/watermark cấp deck — trên cùng, khớp EditorCanvas (PS-1/G.7). */}
      {watermark?.enabled && watermark.src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={watermark.src}
          alt=""
          aria-hidden
          style={{
            position: 'absolute',
            width: `${watermark.sizePct}%`,
            height: 'auto',
            opacity: watermark.opacity,
            pointerEvents: 'none',
            zIndex: 3,
            ...cornerStyle(watermark.corner, watermark.marginPct ?? 3),
          }}
        />
      )}
    </div>
  );
}

/**
 * Bọc 1 element build-in ĐỘC LẬP. Lật `phase` hidden→visible sau mount (useEffect + rAF) thay vì
 * dựa vào transition-khi-mount (`initial`/`animate` cố định) — xem giải thích ở đầu file: đảm
 * bảo hiệu ứng LUÔN chạy kể cả ở slide ĐẦU của player (AnimatePresence tổ tiên initial={false}).
 */
function RevealItem({
  reveal,
  delaySec,
  children,
}: {
  reveal: ElementReveal | undefined;
  delaySec: number;
  children: React.ReactNode;
}) {
  const [phase, setPhase] = useState<'hidden' | 'visible'>('hidden');

  useEffect(() => {
    setPhase('hidden');
    let raf2 = 0;
    // 2 rAF: đảm bảo trình duyệt đã "chốt" khung hình `hidden` trước khi đổi sang `visible`,
    // nếu không Framer Motion có thể gộp cả 2 thay đổi vào 1 khung hình (không thấy transition).
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setPhase('visible'));
    });
    return () => {
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reveal, delaySec]);

  return (
    <motion.div
      initial="hidden"
      animate={phase}
      variants={revealItem(reveal, delaySec)}
      style={{ width: '100%', height: '100%' }}
    >
      {children}
    </motion.div>
  );
}
