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

/**
 * 1 dòng "công cụ này làm gì" — cho designer không rành Photoshop (PS-7 Việc 3).
 * Hiện dưới dạng dòng mô tả LUÔN THẤY (không chỉ hover) bên dưới hàng công cụ.
 */
export const TOOL_HINTS: Record<Tool, string> = {
  move: 'Chọn lớp và kéo để di chuyển (giữ Space để lia khung nhìn).',
  brush: 'Tô màu trực tiếp lên lớp đang chọn.',
  eraser: 'Xoá (làm trong suốt) phần đã tô trên lớp raster.',
  clone: 'Alt-click chọn điểm nguồn, rồi tô để nhân bản vùng ảnh đó sang chỗ khác.',
  heal: 'Tô lên vết cần xoá — tự làm mượt hoà với vùng xung quanh.',
  mask: 'Vẽ mask cho lớp: tô đen để ẩn, trắng để hiện lại — không phá huỷ ảnh gốc.',
  marquee: 'Kéo một vùng chữ nhật để giới hạn nơi cọ được phép vẽ.',
  lasso: 'Vẽ tay một vùng tự do để giới hạn nơi cọ được phép vẽ.',
};

/** Phím tắt hiển thị (không modifier) cho từng tool — đồng bộ với lib/photo-editor/hotkeys.ts. */
export const TOOL_KEYS: Partial<Record<Tool, string>> = {
  move: 'V',
  brush: 'B',
  eraser: 'E',
  clone: 'S',
  heal: 'J',
  marquee: 'M',
  lasso: 'L',
};

/** Có phải công cụ "vẽ" (dùng cọ) không. */
export function isPaintTool(t: Tool): boolean {
  return t === 'brush' || t === 'eraser' || t === 'clone' || t === 'heal' || t === 'mask';
}
