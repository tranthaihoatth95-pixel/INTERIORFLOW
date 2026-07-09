/**
 * lib/present-editor/shape-geometry.ts — Hình học dùng CHUNG cho shape (canvas + export).
 *
 * 1 nguồn sự thật cho tam giác / đa giác N cạnh / mũi tên:
 *   - `polygonPoints01` trả các đỉnh theo TỈ LỆ 0..1 của khung (dùng cho canvas render.ts).
 *   - `shapeClipPath` trả chuỗi CSS clip-path (dùng cho hiển thị live ở Element.tsx).
 * Nhờ vậy sân khấu (CSS) và export (canvas) vẽ RA CÙNG một hình → WYSIWYG.
 *
 * Gradient MỜ có hướng: `gradientOverlayCss` trả 1 lớp linear/radial-gradient dùng làm
 * mask/overlay mờ (mô phỏng opacity fade) trên fill.
 */

import type { ShapeKind, OpacityGradient, GradientDirection } from './model';

/** Điểm theo tỉ lệ 0..1 của khung shape. */
export interface P01 {
  x: number;
  y: number;
}

/** Số cạnh hợp lệ cho polygon (3..12). */
export function clampSides(sides: number | undefined): number {
  const n = Math.round(sides ?? 5);
  return Math.max(3, Math.min(12, n));
}

/**
 * Đỉnh (0..1) của shape đa giác/tam giác/mũi tên. Rỗng = shape dùng đường/hình cơ bản
 * (rect/ellipse/line vẽ riêng, không qua polygon).
 */
export function polygonPoints01(shape: ShapeKind, sides?: number): P01[] {
  if (shape === 'triangle') {
    return [
      { x: 0.5, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ];
  }
  if (shape === 'arrow') {
    // mũi tên nằm ngang chỉ sang phải (thân + đầu nhọn).
    return [
      { x: 0, y: 0.3 },
      { x: 0.6, y: 0.3 },
      { x: 0.6, y: 0.05 },
      { x: 1, y: 0.5 },
      { x: 0.6, y: 0.95 },
      { x: 0.6, y: 0.7 },
      { x: 0, y: 0.7 },
    ];
  }
  if (shape === 'polygon') {
    const n = clampSides(sides);
    const pts: P01[] = [];
    // đỉnh đầu ở trên (12h), quay đều theo chiều kim đồng hồ; nội tiếp trong khung.
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i) / n - Math.PI / 2;
      pts.push({ x: 0.5 + 0.5 * Math.cos(a), y: 0.5 + 0.5 * Math.sin(a) });
    }
    return pts;
  }
  return [];
}

/** CSS clip-path (polygon) cho hiển thị live. Rỗng = không clip (rect/ellipse/line). */
export function shapeClipPath(shape: ShapeKind, sides?: number): string | undefined {
  const pts = polygonPoints01(shape, sides);
  if (!pts.length) return undefined;
  return `polygon(${pts.map((p) => `${(p.x * 100).toFixed(3)}% ${(p.y * 100).toFixed(3)}%`).join(', ')})`;
}

/** true nếu shape vẽ bằng đa giác (không phải rect/ellipse/line). */
export function isPolygonShape(shape: ShapeKind): boolean {
  return shape === 'triangle' || shape === 'polygon' || shape === 'arrow';
}

/** Toạ độ (deg / kiểu) cho linear-gradient theo hướng. */
function dirAngle(direction: GradientDirection): string {
  switch (direction) {
    case 'ltr':
      return 'to right';
    case 'rtl':
      return 'to left';
    case 'ttb':
      return 'to bottom';
    case 'btt':
      return 'to top';
    default:
      return 'to right';
  }
}

/**
 * Lớp phủ gradient MỜ (mask alpha) mô phỏng opacity fade theo hướng.
 * Trả `WebkitMaskImage`/`maskImage` value (chuỗi gradient) để đắp lên fill của shape.
 * from/to là alpha 0..1 ở 2 đầu dải.
 */
export function gradientOverlayCss(g: OpacityGradient): string {
  const a0 = clamp01(g.from);
  const a1 = clamp01(g.to);
  if (g.direction === 'center') {
    // đậm ở giữa, mờ dần ra rìa
    return `radial-gradient(circle at center, rgba(0,0,0,${a1}) 0%, rgba(0,0,0,${a0}) 100%)`;
  }
  if (g.direction === 'edges') {
    // mờ ở giữa, đậm ở 2 rìa (đối xứng ngang)
    return `linear-gradient(to right, rgba(0,0,0,${a1}) 0%, rgba(0,0,0,${a0}) 50%, rgba(0,0,0,${a1}) 100%)`;
  }
  return `linear-gradient(${dirAngle(g.direction)}, rgba(0,0,0,${a0}) 0%, rgba(0,0,0,${a1}) 100%)`;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}
