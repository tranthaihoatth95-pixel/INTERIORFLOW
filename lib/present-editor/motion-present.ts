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
import type { EditorSlide, SlideTransition, ElementReveal } from './model';
import { easeApple, springSheet, springPop } from '../motion';

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

/**
 * Variants cho TỪNG phần tử build-in. `delaySec` (mới — Animation Pane theo object) = độ trễ
 * TUYỆT ĐỐI (giây) trước khi transition của phần tử này bắt đầu, do
 * `computeElementRevealTimings` tính. Mặc định 0 (giữ nguyên hành vi cũ khi gọi không truyền).
 */
export function revealItem(kind: ElementReveal | undefined, delaySec = 0): Variants {
  const t: Transition = { duration: 0.5, ease: easeApple, delay: delaySec };
  switch (kind ?? 'none') {
    case 'none':
      return { hidden: { opacity: 1 }, visible: { opacity: 1 } };
    case 'fade':
      return { hidden: { opacity: 0 }, visible: { opacity: 1, transition: t } };
    case 'rise':
      return { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: t } };
    case 'zoom':
      return {
        hidden: { opacity: 0, scale: 0.92 },
        visible: { opacity: 1, scale: 1, transition: { ...springPop, delay: delaySec } },
      };
    default:
      return { hidden: { opacity: 1 }, visible: { opacity: 1 } };
  }
}

/* ------------------------------------------------------------------ */
/* Animation Pane THEO OBJECT (mở rộng build-in slide-level ở trên).   */
/* ------------------------------------------------------------------ */

/** Kết quả tính build-in hiệu dụng của 1 element khi trình chiếu. */
export interface ElementRevealTiming {
  id: string;
  /** kiểu build-in hiệu dụng (đã fallback slide/deck nếu element không tự set). */
  reveal: ElementReveal;
  /** độ trễ tuyệt đối (giây) từ lúc slide xuất hiện. */
  delaySec: number;
}

/** Độ trễ tối thiểu trước phần tử ĐẦU TIÊN — khớp `delayChildren` cũ của `revealContainer`. */
const BASE_DELAY_SEC = 0.08;

/** Khoảng cách tự suy giữa 2 phần tử liên tiếp — khớp `staggerChildren` cũ của `revealContainer`. */
function autoStaggerStepSec(kind: ElementReveal): number {
  return kind === 'rise' || kind === 'zoom' ? 0.06 : 0.02;
}

/**
 * Tính kiểu build-in + độ trễ cho TỪNG phần tử của 1 slide khi trình chiếu (Animation Pane
 * theo object). Hàm THUẦN (không DOM/React) để test độc lập.
 *
 * Quy tắc mỗi phần tử:
 *   - kiểu hiệu dụng = `el.elementReveal ?? slide.reveal ?? deckReveal ?? 'none'`.
 *   - hạng (rank) = vị trí sau khi sắp theo `el.revealOrder ?? chỉ số mảng gốc` (trùng số → giữ
 *     thứ tự mảng gốc, sắp ổn định).
 *   - độ trễ = `el.revealDelay` (giây, nếu có set — GHI ĐÈ) hoặc tự suy
 *     `BASE_DELAY_SEC + rank × autoStaggerStepSec(kiểu)`.
 *
 * FALLBACK BẮT BUỘC (regression): deck/slide KHÔNG có field mới ở BẤT KỲ phần tử nào →
 * mọi phần tử ra CÙNG kiểu (`slide.reveal ?? deckReveal ?? 'none'`), hạng = thứ tự mảng gốc,
 * độ trễ tăng dần đúng công thức stagger CŨ — visual giống hệt trước khi có tính năng này
 * (trước đây do framer-motion `staggerChildren` đảm nhiệm, giờ tính tường minh, cùng công thức).
 *
 * Thứ tự phần tử trả về = thứ tự mảng gốc (KHÔNG phải thứ tự rank) — gọi nơi dùng tra theo id.
 */
export function computeElementRevealTimings(
  slide: Pick<EditorSlide, 'elements' | 'reveal'>,
  deckReveal?: ElementReveal,
): ElementRevealTiming[] {
  const elements = slide.elements ?? [];
  const ranked = elements
    .map((el, index) => ({ el, index }))
    .sort((a, b) => {
      const oa = a.el.revealOrder ?? a.index;
      const ob = b.el.revealOrder ?? b.index;
      if (oa !== ob) return oa - ob;
      return a.index - b.index;
    });

  const byId = new Map<string, ElementRevealTiming>();
  ranked.forEach(({ el }, rank) => {
    const kind: ElementReveal = el.elementReveal ?? slide.reveal ?? deckReveal ?? 'none';
    const delaySec =
      typeof el.revealDelay === 'number' && Number.isFinite(el.revealDelay)
        ? Math.max(0, el.revealDelay)
        : BASE_DELAY_SEC + rank * autoStaggerStepSec(kind);
    byId.set(el.id, { id: el.id, reveal: kind, delaySec });
  });

  // trả về theo thứ tự mảng GỐC (thứ tự vẽ/z) — dựng lại từ Map giữ đúng insertion do ranked set,
  // nên map lại theo `elements` gốc để đảm bảo thứ tự đầu ra ổn định/dễ đoán cho caller.
  return elements.map((el) => byId.get(el.id)!);
}
