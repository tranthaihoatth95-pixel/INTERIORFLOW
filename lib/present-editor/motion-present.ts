/**
 * lib/present-editor/motion-present.ts — HIỆU ỨNG chuyển slide + build-in phần tử.
 *
 * Ánh xạ SlideTransition / ElementReveal (model, serialize được) → variants framer-motion
 * theo vibe Apple (spring iOS + ease keynote). Dùng ở chế độ TRÌNH CHIẾU (SlidePlayer) —
 * KHÔNG đụng model tĩnh nên PDF/PPTX vẫn trung thực.
 *
 * Tái dùng easing/spring của lib/motion.ts (không định nghĩa lại nhịp).
 */

import type { Variants, Transition } from 'framer-motion';
import type { SlideTransition, ElementReveal } from './model';
import { easeApple, springSheet, springPop } from '@/lib/motion';

/** Nhãn tiếng Việt cho picker hiệu ứng chuyển slide. */
export const TRANSITION_OPTIONS: { id: SlideTransition; label: string; hint: string }[] = [
  { id: 'none', label: 'Không', hint: 'Cắt cứng, chuyển ngay' },
  { id: 'fade', label: 'Tan mờ', hint: 'Slide mới hiện mờ dần' },
  { id: 'slide', label: 'Trượt', hint: 'Trượt ngang kiểu iOS' },
  { id: 'push', label: 'Đẩy', hint: 'Slide cũ bị đẩy ra, mới vào' },
  { id: 'zoom', label: 'Phóng', hint: 'Phóng nhẹ khi vào' },
  { id: 'rise', label: 'Trồi + blur', hint: 'Trồi lên, tan blur (keynote)' },
];

/** Nhãn tiếng Việt cho picker build-in phần tử. */
export const REVEAL_OPTIONS: { id: ElementReveal; label: string; hint: string }[] = [
  { id: 'none', label: 'Không', hint: 'Hiện cùng lúc với slide' },
  { id: 'fade', label: 'Hiện mờ', hint: 'Các phần tử mờ vào đồng loạt' },
  { id: 'rise', label: 'Trồi lần lượt', hint: 'Từng phần tử trồi lên (stagger)' },
  { id: 'zoom', label: 'Phóng lần lượt', hint: 'Từng phần tử phóng nhẹ vào' },
];

/**
 * Variants cho KHUNG SLIDE khi chuyển. Hướng `dir` = 1 (tiến) / -1 (lùi) để trượt/đẩy
 * đúng chiều. Dùng với AnimatePresence custom={dir}.
 */
export function slideVariants(kind: SlideTransition | undefined): Variants {
  const t = kind ?? 'fade';
  const spring = springSheet;
  const enter = (dir: number) => {
    switch (t) {
      case 'none':
        return { opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' };
      case 'fade':
        return { opacity: 0 };
      case 'slide':
        return { opacity: 0, x: dir > 0 ? 60 : -60 };
      case 'push':
        return { opacity: 1, x: dir > 0 ? '100%' : '-100%' };
      case 'zoom':
        return { opacity: 0, scale: 1.06 };
      case 'rise':
        return { opacity: 0, y: 26, filter: 'blur(8px)' };
    }
  };
  const exit = (dir: number) => {
    switch (t) {
      case 'none':
        return { opacity: 1 };
      case 'fade':
        return { opacity: 0, transition: { duration: 0.24, ease: easeApple } };
      case 'slide':
        return { opacity: 0, x: dir > 0 ? -60 : 60, transition: { duration: 0.28, ease: easeApple } };
      case 'push':
        return { opacity: 1, x: dir > 0 ? '-100%' : '100%', transition: spring };
      case 'zoom':
        return { opacity: 0, scale: 0.96, transition: { duration: 0.24, ease: easeApple } };
      case 'rise':
        return { opacity: 0, y: -18, filter: 'blur(8px)', transition: { duration: 0.3, ease: easeApple } };
    }
  };
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    enter: (dir: number) => enter(dir) as any,
    center: { opacity: 1, x: 0, y: 0, scale: 1, filter: 'blur(0px)', transition: t === 'none' ? { duration: 0 } : spring },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    exit: (dir: number) => exit(dir) as any,
  };
}

/** Container stagger cho build-in phần tử (nhịp theo reveal). */
export function revealContainer(kind: ElementReveal | undefined): Variants {
  const stagger = kind === 'rise' || kind === 'zoom' ? 0.06 : 0.02;
  return {
    hidden: {},
    visible: { transition: { staggerChildren: kind === 'none' ? 0 : stagger, delayChildren: 0.08 } },
  };
}

/** Variants cho TỪNG phần tử build-in. */
export function revealItem(kind: ElementReveal | undefined): Variants {
  const t: Transition = { duration: 0.5, ease: easeApple };
  switch (kind ?? 'none') {
    case 'none':
      return { hidden: { opacity: 1 }, visible: { opacity: 1 } };
    case 'fade':
      return { hidden: { opacity: 0 }, visible: { opacity: 1, transition: t } };
    case 'rise':
      return { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: t } };
    case 'zoom':
      return { hidden: { opacity: 0, scale: 0.92 }, visible: { opacity: 1, scale: 1, transition: springPop } };
    default:
      return { hidden: { opacity: 1 }, visible: { opacity: 1 } };
  }
}
