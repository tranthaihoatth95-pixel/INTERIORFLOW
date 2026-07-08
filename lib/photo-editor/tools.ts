/**
 * lib/photo-editor/tools.ts — Định nghĩa công cụ + tham số cọ (serialize-friendly plain).
 *
 * Tách riêng khỏi component để cả Toolbar, Inspector, Canvas dùng chung kiểu.
 */

export type Tool =
  | 'move' // chọn/di chuyển (hiện chỉ chọn lớp, pan qua Space)
  | 'brush'
  | 'eraser'
  | 'clone'
  | 'heal'
  | 'mask' // vẽ mask cho lớp
  | 'marquee' // chọn vùng chữ nhật
  | 'lasso'; // chọn vùng tự do

/** Tham số cọ dùng chung cho brush/eraser/clone/heal/mask. */
export interface BrushSettings {
  size: number; // px @ khung tài liệu
  hardness: number; // 0..1 (1 = viền cứng)
  opacity: number; // 0..1
  color: string; // dùng cho brush
}

export const DEFAULT_BRUSH: BrushSettings = {
  size: 40,
  hardness: 0.7,
  opacity: 1,
  color: '#8a6f4d',
};

/** Nhãn tiếng Việt cho công cụ. */
export const TOOL_LABELS: Record<Tool, string> = {
  move: 'Di chuyển / chọn',
  brush: 'Cọ vẽ',
  eraser: 'Tẩy',
  clone: 'Sao chép (Clone)',
  heal: 'Chữa lành (Heal)',
  mask: 'Vẽ mask lớp',
  marquee: 'Chọn chữ nhật',
  lasso: 'Chọn tự do (Lasso)',
};

/** Có phải công cụ "vẽ" (dùng cọ) không. */
export function isPaintTool(t: Tool): boolean {
  return t === 'brush' || t === 'eraser' || t === 'clone' || t === 'heal' || t === 'mask';
}
