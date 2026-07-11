/**
 * Palette bổ trợ cho Sketch Studio — màu BÚT VẼ (không phải màu UI, đó ở globals.css).
 * Gồm màu line-art cơ bản + bộ màu vật liệu/nội thất đồng bộ tông đá ấm/gỗ quiet-luxury
 * đang dùng trong app (xem lib/gu.ts, defs/gu-reference.ts) — tiện phác nhanh mảng
 * tường/sàn/gỗ/kim loại đúng gu trước khi AI render.
 */
export interface SketchSwatch {
  hex: string;
  label: string;
}

export const SKETCH_PALETTE: SketchSwatch[] = [
  // line-art / phác thảo
  { hex: '#1a1a1a', label: 'Line đen' },
  { hex: '#ffffff', label: 'Trắng' },
  { hex: '#6f6a5f', label: 'Xám ấm' },
  // gỗ
  { hex: '#b39776', label: 'Gỗ sồi' },
  { hex: '#6f5b40', label: 'Gỗ óc chó' },
  { hex: '#3d2b1f', label: 'Gỗ tối' },
  // đá / tường
  { hex: '#f2ede4', label: 'Tường kem' },
  { hex: '#d9cfc2', label: 'Đá ấm' },
  { hex: '#c7a397', label: 'Đất nung' },
  { hex: '#8a8378', label: 'Bê tông' },
  // kim loại
  { hex: '#a67c52', label: 'Đồng / brass' },
  { hex: '#4a4a4a', label: 'Thép đen' },
  // accent / đánh dấu
  { hex: '#7c9a6b', label: 'Cây xanh' },
  { hex: '#38bdf8', label: 'Xanh trời' },
  { hex: '#8b7cf7', label: 'Accent tím' },
  { hex: '#ef4444', label: 'Đỏ đánh dấu' },
];

export const DEFAULT_SKETCH_COLOR = SKETCH_PALETTE[0].hex;
