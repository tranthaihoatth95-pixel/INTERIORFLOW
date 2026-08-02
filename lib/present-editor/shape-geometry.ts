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

import type { ShapeKind, OpacityGradient, GradientDirection, ImageMask, FillOverlay } from './model';

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

/**
 * P1/E2 — CSS clip-path cho MASK ẢNH. 'ellipse' dùng hàm `ellipse()` gốc CSS (khớp box, kể cả
 * khung không vuông — khác `borderRadius:'50%'` của ShapeElement vốn chỉ đúng khi box vuông);
 * tam giác/đa giác/mũi tên TÁI DÙNG NGUYÊN `shapeClipPath` — không viết lại hình học lần 2.
 * Không mask → `undefined` (ảnh chữ nhật/bo góc như cũ, xem `ImageElement.mask`).
 */
export function imageMaskClipPath(mask: ImageMask | undefined): string | undefined {
  if (!mask) return undefined;
  if (mask.shape === 'ellipse') return 'ellipse(50% 50% at 50% 50%)';
  return shapeClipPath(mask.shape, mask.sides);
}

/**
 * P1/E2 — dựng ĐƯỜNG (path) canvas cho mask ảnh, khớp HÌNH DẠNG với `imageMaskClipPath` ở trên
 * (cùng 1 nguồn đỉnh `polygonPoints01` cho phần đa giác) — dùng cho `render.ts#drawImageEl` khi
 * bake PDF/PNG/PPTX (`ctx.clip()` NGAY SAU khi gọi hàm này, hàm KHÔNG tự clip để caller còn
 * quyết định — giống quy ước `roundRectPath` cùng file `render.ts`). x/y/w/h là PIXEL đã quy
 * đổi (không phải %).
 */
export function imageMaskCanvasPath(
  ctx: CanvasRenderingContext2D,
  mask: ImageMask,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  ctx.beginPath();
  if (mask.shape === 'ellipse') {
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    return;
  }
  const pts = polygonPoints01(mask.shape, mask.sides);
  pts.forEach((p, i) => {
    const X = x + p.x * w;
    const Y = y + p.y * h;
    if (i === 0) ctx.moveTo(X, Y);
    else ctx.lineTo(X, Y);
  });
  ctx.closePath();
}

/**
 * Toạ độ (deg / kiểu) cho linear-gradient theo hướng — XUẤT (P3/E3) để `fillOverlayCss` bên
 * dưới dùng lại, giữ 1 nguồn quy ước hướng duy nhất cho MỌI gradient trong file này.
 */
export function dirAngle(direction: GradientDirection): string {
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

/**
 * P3/E3 — CSS `background` cho lớp phủ FILL kiểu gradient (kiểu `color` thì caller dùng thẳng
 * `overlay.color` làm background, KHÔNG qua hàm này — xem `Element.tsx`). Mirror CHÍNH XÁC
 * `render.ts#makeOverlayGradient` (canvas) để CSS (xem-trước) và canvas (xuất PDF/PNG/PPTX) ra
 * CÙNG một gradient (WYSIWYG, xem đầu file) — 'center': đậm giữa (colorTo) mờ dần ra rìa (color);
 * 'edges': đối xứng color→colorTo→color; hướng khác: `color` ở đầu, `colorTo` ở cuối theo
 * `dirAngle`. `colorTo` bỏ trống = dùng lại `color` (dải đồng màu, coi như không có gradient
 * thấy được — hợp lệ, không phải lỗi).
 */
export function fillOverlayCss(overlay: FillOverlay): string {
  const c1 = overlay.color;
  const c2 = overlay.colorTo || overlay.color;
  const dir = overlay.direction ?? 'ltr';
  if (dir === 'center') {
    return `radial-gradient(circle at center, ${c2} 0%, ${c1} 100%)`;
  }
  if (dir === 'edges') {
    return `linear-gradient(to right, ${c2} 0%, ${c1} 50%, ${c2} 100%)`;
  }
  return `linear-gradient(${dirAngle(dir)}, ${c1} 0%, ${c2} 100%)`;
}

/**
 * P3/E3 — CanvasGradient 2 MÀU THẬT theo hướng (KHÁC gradient alpha-fade của `render.ts` vốn
 * mờ dần CÙNG 1 màu). Khớp 1:1 với `fillOverlayCss` ở trên — 'center' dùng radial, 'edges' dùng
 * linear 3-stop đối xứng, 4 hướng còn lại linear 2-stop — CSS (preview) và canvas (export
 * PDF/PNG/PPTX) phải ra CÙNG hình (WYSIWYG, quy ước sẵn của file này). ĐẶT Ở ĐÂY (không phải
 * `render.ts`) vì hàm CHỈ cần `CanvasRenderingContext2D` được truyền vào (không đụng `document`/
 * `Image`/`@/lib/imaging` như phần còn lại của `render.ts`) — nhờ vậy test được bằng ctx GIẢ qua
 * sucrase-node (xem `fill-overlay.test.ts`), khớp quy ước `imageMaskCanvasPath` cùng file.
 */
function makeOverlayGradient(
  ctx: CanvasRenderingContext2D,
  overlay: FillOverlay,
  fx: number,
  fy: number,
  fw: number,
  fh: number,
): CanvasGradient {
  const c1 = overlay.color;
  const c2 = overlay.colorTo || overlay.color;
  const dir = overlay.direction ?? 'ltr';
  if (dir === 'center') {
    const grad = ctx.createRadialGradient(fx + fw / 2, fy + fh / 2, 0, fx + fw / 2, fy + fh / 2, Math.max(fw, fh) / 2);
    grad.addColorStop(0, c2);
    grad.addColorStop(1, c1);
    return grad;
  }
  if (dir === 'edges') {
    const grad = ctx.createLinearGradient(fx, fy, fx + fw, fy);
    grad.addColorStop(0, c2);
    grad.addColorStop(0.5, c1);
    grad.addColorStop(1, c2);
    return grad;
  }
  const horiz = dir === 'ltr' || dir === 'rtl';
  const rev = dir === 'rtl' || dir === 'btt';
  const x0 = horiz ? (rev ? fx + fw : fx) : fx;
  const x1 = horiz ? (rev ? fx : fx + fw) : fx;
  const y0 = horiz ? fy : rev ? fy + fh : fy;
  const y1 = horiz ? fy : rev ? fy : fy + fh;
  const grad = ctx.createLinearGradient(x0, y0, x1, y1);
  grad.addColorStop(0, c1);
  grad.addColorStop(1, c2);
  return grad;
}

/**
 * P3/E3 — đặt fillStyle/alpha/blend cho lớp phủ TRƯỚC khi caller tự fill (path shape đã dựng
 * sẵn, hoặc fillRect trong vùng ĐÃ clip của ảnh) — hàm này KHÔNG tự vẽ, để mỗi loại element áp
 * đúng cách của nó (path riêng cho shape vì shape KHÔNG dùng ctx.clip(); fillRect an toàn cho
 * ảnh vì ảnh đã clip() sẵn theo mask/bo góc). `baseAlpha` = alpha hiện có của element (nhân dồn,
 * không thay thế — 2 lớp mờ cộng dồn đúng cảm giác). Dùng ở `render.ts#drawShapeEl`/`drawImageEl`
 * VÀ `export.ts#maskedImageDataUri` (bake overlay khi xuất PPTX hero image).
 */
export function applyFillOverlayStyle(
  ctx: CanvasRenderingContext2D,
  overlay: FillOverlay,
  baseAlpha: number,
  fx: number,
  fy: number,
  fw: number,
  fh: number,
): void {
  ctx.globalAlpha = baseAlpha * clamp01(overlay.opacity);
  ctx.globalCompositeOperation =
    overlay.blend && overlay.blend !== 'normal' ? (overlay.blend as GlobalCompositeOperation) : 'source-over';
  ctx.fillStyle = overlay.kind === 'gradient' ? makeOverlayGradient(ctx, overlay, fx, fy, fw, fh) : overlay.color;
}
