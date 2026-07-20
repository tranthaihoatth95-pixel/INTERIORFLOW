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

/**
 * THANG THỜI LƯỢNG CHUẨN (giây) — MỘT bộ duy nhất cho toàn app.
 *
 * Trước đợt rà soát 20/07 app dùng 11 giá trị rời rạc (120/150/180/200/250/300/320/400/500/900ms)
 * và phần lớn class `transition-*` của Tailwind KHÔNG kèm `duration-` nên rơi về mặc định 150ms —
 * không khớp `--dur-fast` (180ms) lẫn `--dur-base` (320ms). Bảng dưới là thang duy nhất được duyệt;
 * chỗ nào cần thời lượng mới thì THÊM vào đây, KHÔNG viết số rời trong component.
 *
 * Gu quiet-luxury: êm, chậm vừa phải, KHÔNG nảy.
 */
export const DUR = {
  /** hover/press trên nút — phải gần như tức thì mới thấy "dính tay". */
  hover: 0.12,
  /** micro-interaction, tooltip, toggle nhỏ. */
  micro: 0.18,
  /** panel/sheet/dropdown trượt vào. */
  panel: 0.22,
  /** modal/lightbox/overlay lớn. */
  modal: 0.28,
  /** chuyển CHẶNG (veil crossfade) — chậm nhất, để mắt kịp "lắng". */
  stage: 0.36,
} as const;

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

/**
 * Node trên canvas: scale nhẹ khi xuất hiện.
 *
 * `exit` bổ sung 20/07: trước đây variant này THIẾU `exit` (mọi variant anh em đều có) nên node
 * hiện ra thì mềm mà xoá đi thì biến mất phựt. Cần AnimatePresence bọc danh sách node mới chạy.
 */
export const nodePop: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: springNode },
  exit: { opacity: 0, scale: 0.92, transition: tweenFast },
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

/* ---------- C-4 Apple motion: "dynamic wallpaper" + adaptive amplitude ---------- */

/**
 * Chuyển CHẶNG kiểu hình nền động macOS: trang ĐẾN crossfade + thu scale rất nhẹ
 * (1.012 → 1) — mắt thấy "lắng xuống" thay vì nhảy cứng. Dùng bọc nội dung
 * studio route (cad-editor / present-editor) khi mount.
 */
export const wallpaperIn: Variants = {
  hidden: { opacity: 0, scale: 1.012 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.45, ease: easeApple } },
  exit: { opacity: 0, transition: { duration: DUR.micro, ease: easeApple } },
};

/**
 * Veil che lúc RỜI chặng (route change): crossfade nền — nửa kia của hiệu ứng
 * dynamic-wallpaper. Thay cho `fade` phẳng ở overlay chuyển route.
 */
export const stageVeil: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.28, ease: easeApple } },
  exit: { opacity: 0, transition: { duration: 0.3, ease: easeApple } },
};

/**
 * Adaptive amplitude — element CÀNG TO bay biên độ CÀNG LỚN (hero title đi 28px,
 * caption chỉ 8px) → cả màn vào nhịp như một khối vật lý, không đều tăm tắp.
 *
 * @param amplitude px dịch chuyển (to: 24–32 · vừa: 12–16 · nhỏ: 6–10)
 * @param delay     trễ (giây) để xếp lớp hero → phụ
 * @param blur      true = kèm blur-in (chỉ nên dùng cho 1–2 hero element)
 */
export const rise = (amplitude: number, delay = 0, blur = false): Variants => ({
  hidden: {
    opacity: 0,
    y: amplitude,
    ...(blur ? { filter: 'blur(8px)' } : {}),
  },
  visible: {
    opacity: 1,
    y: 0,
    ...(blur ? { filter: 'blur(0px)' } : {}),
    transition: { duration: 0.55 + amplitude / 90, ease: easeApple, delay },
  },
});

/** True nếu user bật Reduce Motion (SSR-safe). Bọc quanh animation nặng để tôn trọng. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
