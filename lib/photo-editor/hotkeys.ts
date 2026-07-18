/**
 * lib/photo-editor/hotkeys.ts — Ánh xạ phím tắt kiểu Photoshop cho /photo-editor (PS-7).
 *
 * Tách riêng khỏi component để logic tra cứu thuần (không DOM) có thể unit-test độc lập,
 * và để DocCanvas/PhotoToolbar/PhotoEditor dùng chung 1 nguồn — không lệch nhau.
 *
 * Phạm vi PS-7 = tương tác & khả năng phát hiện công cụ, KHÔNG thêm engine mới (xem D.11):
 * không có phím cho magic-wand/quick-select (chưa tồn tại), CMYK, timeline, curves-per-channel.
 */

import type { Tool } from './tools';

/** Phím chữ (không cần modifier) → tool. Muscle-memory Photoshop: V/B/E/S/J/M/L. */
export const TOOL_HOTKEYS: Record<string, Tool> = {
  v: 'move',
  b: 'brush',
  e: 'eraser',
  s: 'clone', // S = Stamp (Clone Stamp) trong Photoshop
  j: 'heal', // J = Healing brush trong Photoshop
  m: 'marquee',
  l: 'lasso',
};

/** Tra cứu tool theo phím đã gõ (không phân biệt hoa/thường). undefined = không map. */
export function toolForHotkey(key: string): Tool | undefined {
  return TOOL_HOTKEYS[key.toLowerCase()];
}

/** Giới hạn cỡ cọ hợp lệ — khớp MiniSlider trong PhotoToolbar.tsx (min=1, max=400). */
export const BRUSH_SIZE_MIN = 1;
export const BRUSH_SIZE_MAX = 400;

/**
 * Cỡ cọ tiếp theo khi bấm '[' (dir=-1, giảm) hay ']' (dir=+1, tăng).
 * Bước tỉ lệ theo cỡ hiện tại (giống Photoshop: cọ càng lớn, bước càng lớn), tối thiểu 1px,
 * làm tròn để tránh số lẻ khó chịu trên UI. Luôn kẹp trong [BRUSH_SIZE_MIN, BRUSH_SIZE_MAX].
 */
export function nextBrushSize(size: number, dir: -1 | 1): number {
  const step = Math.max(1, Math.round(size * 0.1));
  const next = Math.round(size + dir * step);
  return Math.max(BRUSH_SIZE_MIN, Math.min(BRUSH_SIZE_MAX, next));
}
