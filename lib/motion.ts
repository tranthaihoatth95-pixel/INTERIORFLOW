/**
 * lib/motion.ts — Hệ chuyển động dùng chung theo vibe Apple/iOS.
 *
 * Triết lý: "ít mà chất". Mượt, tinh tế, không bounce lố.
 * - Easing Apple: cubic-bezier(0.32, 0.72, 0, 1) — chuẩn iOS sheet/nav.
 * - Spring tiết chế cho sheet/modal/node (không nảy quá đà).
 * - Tái sử dụng qua các variants + transition preset; KHÔNG lặp từng component.
 *
 * Dùng với framer-motion: <motion.div variants={...} initial="hidden"
 * animate="visible" exit="exit" /> hoặc trực tiếp transition={springSheet}.
 */

import type { Transition, Variants } from 'framer-motion';

/* ---------- Easing + Spring nền tảng ---------- */

/** Đường cong Apple chuẩn (dùng cho tween fade/scale). */
export const easeApple = [0.32, 0.72, 0, 1] as const;

/** Spring cho panel trượt kiểu iOS sheet — chắc tay, gần như không nảy. */
export const springSheet: Transition = {
  type: 'spring',
  stiffness: 380,
  damping: 42,
  mass: 0.9,
};

/** Spring mềm hơn cho modal/pop scale — có chút "sống" nhưng vẫn tiết chế. */
export const springPop: Transition = {
  type: 'spring',
  stiffness: 420,
  damping: 34,
  mass: 0.8,
};

/** Spring rất nhẹ cho node xuất hiện trên canvas. */
export const springNode: Transition = {
  type: 'spring',
  stiffness: 500,
  damping: 30,
  mass: 0.6,
};

/** Tween fade cơ bản theo nhịp Apple. */
export const tweenFast: Transition = { duration: 0.18, ease: easeApple };
export const tweenBase: Transition = { duration: 0.32, ease: easeApple };

/* ---------- Micro-interaction (press/tap/hover) ---------- */

/** Nút bấm: thu nhỏ nhẹ khi nhấn — cảm giác "haptic" của iOS. */
export const pressable = {
  whileHover: { scale: 1.015 },
  whileTap: { scale: 0.96 },
  transition: { duration: 0.14, ease: easeApple },
} as const;

/** Nút icon vuông nhỏ: press mạnh tay hơn một chút. */
export const pressableIcon = {
  whileTap: { scale: 0.9 },
  transition: { duration: 0.12, ease: easeApple },
} as const;

/* ---------- Variants dùng chung ---------- */

/** Fade + nhích lên nhẹ (dropdown, toast, badge). */
export const fadeRise: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: tweenBase },
  exit: { opacity: 0, y: 4, transition: tweenFast },
};

/** Fade thuần (backdrop, overlay). */
export const fade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: tweenBase },
  exit: { opacity: 0, transition: tweenFast },
};

/** Modal/Lightbox: fade + scale spring, tan vào giữa màn hình. */
export const modalScale: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1, transition: springPop },
  exit: { opacity: 0, scale: 0.97, transition: tweenFast },
};

/** Command palette: rơi xuống nhẹ từ trên (giống Spotlight). */
export const paletteDrop: Variants = {
  hidden: { opacity: 0, scale: 0.97, y: -10 },
  visible: { opacity: 1, scale: 1, y: 0, transition: springPop },
  exit: { opacity: 0, scale: 0.98, y: -6, transition: tweenFast },
};

/** Node trên canvas: scale nhẹ khi xuất hiện. */
export const nodePop: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: springNode },
};

/**
 * Panel iOS sheet trượt ngang. Hướng tuỳ cạnh gắn:
 * - 'left'  : panel bên trái/rail (trượt từ trái vào).
 * - 'right' : panel bên phải như Chat (trượt từ phải vào).
 * Dùng: variants={sheetSlide('left')}.
 */
export const sheetSlide = (from: 'left' | 'right'): Variants => {
  const off = from === 'left' ? -18 : 18;
  return {
    hidden: { opacity: 0, x: off },
    visible: { opacity: 1, x: 0, transition: springSheet },
    exit: { opacity: 0, x: off, transition: { duration: 0.2, ease: easeApple } },
  };
};

/* ---------- Stagger cho danh sách (node library, flows…) ---------- */

/** Container stagger nhẹ — con hiện lần lượt như list iOS. */
export const staggerList: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.03, delayChildren: 0.04 },
  },
};

/** Item con của staggerList. */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: easeApple } },
};

/* ---------- Chuyển CHẶNG / trang (expressive) ---------- */

/** Spring đằm, có đà — dành cho chuyển chặng Concept↔Render↔Present, mask khựng route. */
export const springStage: Transition = {
  type: 'spring',
  stiffness: 240,
  damping: 28,
  mass: 1,
};

/**
 * Nội dung chặng đổi: trồi + phóng rất nhẹ. Dùng bọc empty-state/canvas khi đổi
 * workspace, và bọc chuyển route sang /present-editor để không "nhảy" cứng.
 */
export const stageTransition: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.985 },
  visible: { opacity: 1, y: 0, scale: 1, transition: springStage },
  exit: { opacity: 0, y: -8, scale: 0.99, transition: { duration: 0.24, ease: easeApple } },
};

/** True nếu user bật Reduce Motion (SSR-safe). Bọc quanh animation nặng để tôn trọng. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
