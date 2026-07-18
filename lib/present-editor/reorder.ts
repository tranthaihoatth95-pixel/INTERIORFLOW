/**
 * lib/present-editor/reorder.ts — Sắp xếp lại 1 phần tử trong mảng (kéo-thả Slide Sorter).
 *
 * Tách THUẦN khỏi component (không phụ thuộc React/DOM) để test độc lập. Dùng cho
 * PresentEditor.onReorderSlide (kéo-thả trong SlideSorter) — cùng tinh thần onReorderElement
 * (kéo layer trong Inspector) nhưng cho mảng slide cấp deck.
 */
export function reorderArray<T>(arr: readonly T[], from: number, to: number): T[] {
  const n = arr.length;
  if (from === to || from < 0 || from >= n || to < 0 || to >= n) return arr.slice();
  const copy = arr.slice();
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}
