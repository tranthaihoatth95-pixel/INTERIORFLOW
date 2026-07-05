/**
 * lib/motion-apple.ts — Tiện ích micro-interaction kiểu Apple (framer-motion).
 *
 * Tinh thần: chạm vào là "sống" một chút — icon nẩy nhẹ khi hover, thẻ nhô lên,
 * ảnh zoom mượt, nhưng KHÔNG lố. Bổ sung cho lib/motion.ts (không thay thế).
 *
 * File này CHỈ khai util + ví dụ dùng (JSDoc). KHÔNG ép vào file khác.
 * Cách dùng: spread prop, vd  <motion.button {...hoverBounce()} />.
 *
 * @example Nút icon nẩy khi hover
 *   import { motion } from 'framer-motion';
 *   import { hoverBounce } from '@/lib/motion-apple';
 *   <motion.span {...hoverBounce()}><Icon /></motion.span>
 */

import type { MotionProps, Transition, Variants } from 'framer-motion';

/* ---------- Easing + spring nền (đồng bộ vibe với lib/motion.ts) ---------- */

/** Đường cong Apple chuẩn iOS. */
export const easeApple = [0.32, 0.72, 0, 1] as const;

/** Spring nẩy "vui tay" nhưng vẫn tiết chế — cho icon/emoji pop. */
export const springBounce: Transition = {
  type: 'spring',
  stiffness: 500,
  damping: 18,
  mass: 0.7,
};

/** Spring chắc tay cho zoom/scale khối lớn (thẻ, ảnh). */
export const springZoom: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
  mass: 0.9,
};

/* ---------- Micro-interaction: hover / press ---------- */

/**
 * Icon/emoji nẩy nhẹ khi hover, thụt khi nhấn — cảm giác "haptic" iOS.
 * @param scale độ phóng khi hover (mặc định 1.18)
 * @example <motion.span {...hoverBounce(1.25)}>🎨</motion.span>
 */
export function hoverBounce(scale = 1.18): MotionProps {
  return {
    whileHover: { scale, rotate: [0, -6, 6, 0], transition: springBounce },
    whileTap: { scale: 0.9, transition: { duration: 0.1, ease: easeApple } },
  };
}

/**
 * Thẻ nhô lên khi hover (lift) — bóng mềm hơn, y dịch lên vài px.
 * Gắn kèm class có box-shadow transition để bóng ăn khớp.
 * @example <motion.div {...cardLift()} className="transition-shadow" />
 */
export function cardLift(dy = -4): MotionProps {
  return {
    whileHover: { y: dy, scale: 1.015, transition: springZoom },
    whileTap: { scale: 0.99, transition: { duration: 0.12, ease: easeApple } },
  };
}

/**
 * Nút chính (CTA): phóng nhẹ + sáng lên khi hover, nhấn thụt.
 * @example <motion.button {...ctaPress} />
 */
export const ctaPress: MotionProps = {
  whileHover: { scale: 1.03, transition: { duration: 0.18, ease: easeApple } },
  whileTap: { scale: 0.97, transition: { duration: 0.1, ease: easeApple } },
};

/* ---------- Zoom in/out (ảnh, lightbox, preview) ---------- */

/**
 * Zoom ảnh trong khung "cover": ảnh phóng nhẹ khi hover khung.
 * Đặt lên <motion.img> trong container có overflow-hidden.
 * @example
 *   <div className="overflow-hidden rounded-xl">
 *     <motion.img {...imageZoom()} src={url} />
 *   </div>
 */
export function imageZoom(scale = 1.06): MotionProps {
  return {
    initial: { scale: 1 },
    whileHover: { scale, transition: { duration: 0.6, ease: easeApple } },
  };
}

/**
 * Variants zoom-in xuất hiện (dùng cho lightbox/preview mở ra).
 * @example
 *   <motion.div variants={zoomIn} initial="hidden" animate="visible" exit="exit" />
 */
export const zoomIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: springZoom },
  exit: { opacity: 0, scale: 0.94, transition: { duration: 0.16, ease: easeApple } },
};

/* ---------- Ẩn/hiện có hướng + stagger ---------- */

/**
 * Nội dung trồi lên có blur tan (kiểu keynote Apple).
 * @example <motion.h1 variants={riseBlur} initial="hidden" animate="visible" />
 */
export const riseBlur: Variants = {
  hidden: { opacity: 0, y: 18, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: easeApple } },
  exit: { opacity: 0, y: -12, filter: 'blur(8px)', transition: { duration: 0.35, ease: easeApple } },
};

/**
 * Container cho danh sách trồi lần lượt.
 * @example
 *   <motion.ul variants={staggerRise} initial="hidden" animate="visible">
 *     {items.map(x => <motion.li key={x} variants={staggerRiseItem} />)}
 *   </motion.ul>
 */
export const staggerRise: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.06 } },
};

export const staggerRiseItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeApple } },
};

/* ---------- Tiện ích an toàn reduced-motion ---------- */

/**
 * Bọc MotionProps để tôn trọng prefers-reduced-motion: trả prop rỗng khi `reduce`.
 * @example
 *   const reduce = useReducedMotion();
 *   <motion.span {...guard(reduce, hoverBounce())} />
 */
export function guard(reduce: boolean | null, props: MotionProps): MotionProps {
  return reduce ? {} : props;
}
