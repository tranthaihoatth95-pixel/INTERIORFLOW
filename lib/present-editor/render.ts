/**
 * lib/present-editor/render.ts — Vẽ 1 EditorSlide (model) ra canvas 1920×1080.
 *
 * Dùng cho:
 *   - Xuất PDF (mỗi slide → 1 ảnh JPEG full-page, jsPDF).
 *   - Tạo data URI cho ảnh nền/hero khi xuất PPTX.
 *   - (Có thể) thumbnail.
 *
 * Toạ độ model là % của sân khấu → nhân W/H. CSS filter (adjust) được tái dựng bằng
 * ctx.filter (Canvas hỗ trợ cùng cú pháp filter với CSS). Crop áp bằng source-rect.
 *
 * Chỉ chạy ở client (cần document/canvas). Trả JPEG dataURL.
 */

import {
  type EditorSlide,
  type ImageElement,
  type TextElement,
  type ShapeElement,
  type OpacityGradient,
  adjustToCssFilter,
  decorateListText,
  effectiveListStyle,
} from './model';
import { polygonPoints01, isPolygonShape } from './shape-geometry';
import { loadImage } from '@/lib/imaging';

const W = 1920;
const H = 1080;

function px(pctW: number) {
  return (pctW / 100) * W;
}
function py(pctH: number) {
  return (pctH / 100) * H;
}

/** Vẽ ảnh có crop (theo tỉ lệ 0..1 của ảnh gốc) + filter, phủ khung dạng cover. */
async function drawImageEl(
  ctx: CanvasRenderingContext2D,
  el: ImageElement,
): Promise<void> {
  let img: HTMLImageElement;
  try {
    img = await loadImage(el.src);
  } catch {
    return;
  }
  const fx = px(el.frame.x);
  const fy = py(el.frame.y);
  const fw = px(el.frame.w);
  const fh = py(el.frame.h);
  const crop = el.crop || { x: 0, y: 0, w: 1, h: 1 };
  const sx = crop.x * img.naturalWidth;
  const sy = crop.y * img.naturalHeight;
  const sw = crop.w * img.naturalWidth;
  const sh = crop.h * img.naturalHeight;
  // cover trong khung
  const scale = Math.max(fw / sw, fh / sh);
  const dw = sw * scale;
  const dh = sh * scale;
  const drawSx = sx + (sw - fw / scale) / 2;
  const drawSy = sy + (sh - fh / scale) / 2;

  ctx.save();
  ctx.globalAlpha = el.opacity ?? 1;
  ctx.filter = adjustToCssFilter(el.adjust);
  applyRotation(ctx, el.frame);
  // clip bo góc
  const r = ((el.radius ?? 0) / 100) * Math.min(fw, fh);
  roundRectPath(ctx, fx, fy, fw, fh, r);
  ctx.clip();
  ctx.drawImage(img, drawSx, drawSy, fw / scale, fh / scale, fx, fy, fw, fh);
  void dw;
  void dh;
  ctx.restore();
}

/** Style fill: màu đơn HOẶC gradient mờ (mô phỏng opacity fade theo hướng) trên fill. */
function fillStyleFor(
  ctx: CanvasRenderingContext2D,
  el: ShapeElement,
  fx: number,
  fy: number,
  fw: number,
  fh: number,
): string | CanvasGradient {
  if (!el.gradient || !el.fill || el.fill === 'transparent') return el.fill;
  return makeAlphaGradient(ctx, el.fill, el.gradient, fx, fy, fw, fh);
}

/** Canvas gradient: cùng màu fill nhưng alpha biến thiên theo hướng (giống mask CSS). */
function makeAlphaGradient(
  ctx: CanvasRenderingContext2D,
  color: string,
  g: OpacityGradient,
  fx: number,
  fy: number,
  fw: number,
  fh: number,
): CanvasGradient {
  const rgb = hexToRgb(color);
  const c = (a: number) => `rgba(${rgb.r},${rgb.g},${rgb.b},${Math.max(0, Math.min(1, a))})`;
  let grad: CanvasGradient;
  if (g.direction === 'center' || g.direction === 'edges') {
    grad = ctx.createRadialGradient(
      fx + fw / 2,
      fy + fh / 2,
      0,
      fx + fw / 2,
      fy + fh / 2,
      Math.max(fw, fh) / 2,
    );
    if (g.direction === 'center') {
      grad.addColorStop(0, c(g.to));
      grad.addColorStop(1, c(g.from));
    } else {
      grad.addColorStop(0, c(g.to));
      grad.addColorStop(1, c(g.from));
    }
    return grad;
  }
  const horiz = g.direction === 'ltr' || g.direction === 'rtl';
  const rev = g.direction === 'rtl' || g.direction === 'btt';
  const x0 = horiz ? (rev ? fx + fw : fx) : fx;
  const x1 = horiz ? (rev ? fx : fx + fw) : fx;
  const y0 = horiz ? fy : rev ? fy + fh : fy;
  const y1 = horiz ? fy : rev ? fy : fy + fh;
  grad = ctx.createLinearGradient(x0, y0, x1, y1);
  grad.addColorStop(0, c(g.from));
  grad.addColorStop(1, c(g.to));
  return grad;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  if (h.length < 6) return { r: 138, g: 111, b: 77 };
  const n = parseInt(h.slice(0, 6), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function drawShapeEl(ctx: CanvasRenderingContext2D, el: ShapeElement): void {
  const fx = px(el.frame.x);
  const fy = py(el.frame.y);
  const fw = px(el.frame.w);
  const fh = py(el.frame.h);
  ctx.save();
  ctx.globalAlpha = el.opacity ?? 1;
  applyRotation(ctx, el.frame);
  const strokePx = (el.strokeWidth / 100) * H; // strokeWidth tính @1080
  if (el.shape === 'line') {
    ctx.strokeStyle = el.stroke;
    ctx.lineWidth = Math.max(1, strokePx);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(fx, fy + fh / 2);
    ctx.lineTo(fx + fw, fy + fh / 2);
    ctx.stroke();
  } else if (el.shape === 'ellipse') {
    ctx.beginPath();
    ctx.ellipse(fx + fw / 2, fy + fh / 2, fw / 2, fh / 2, 0, 0, Math.PI * 2);
    if (el.fill && el.fill !== 'transparent') {
      ctx.fillStyle = fillStyleFor(ctx, el, fx, fy, fw, fh);
      ctx.fill();
    }
    if (strokePx > 0) {
      ctx.strokeStyle = el.stroke;
      ctx.lineWidth = strokePx;
      ctx.stroke();
    }
  } else if (isPolygonShape(el.shape)) {
    // tam giác / đa giác N cạnh / mũi tên — từ đỉnh tỉ lệ 0..1 (dùng chung với canvas UI).
    const pts = polygonPoints01(el.shape, el.sides);
    ctx.beginPath();
    pts.forEach((p, i) => {
      const X = fx + p.x * fw;
      const Y = fy + p.y * fh;
      if (i === 0) ctx.moveTo(X, Y);
      else ctx.lineTo(X, Y);
    });
    ctx.closePath();
    if (el.fill && el.fill !== 'transparent') {
      ctx.fillStyle = fillStyleFor(ctx, el, fx, fy, fw, fh);
      ctx.fill();
    }
    if (strokePx > 0) {
      ctx.strokeStyle = el.stroke;
      ctx.lineWidth = strokePx;
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
  } else {
    const r = ((el.radius ?? 0) / 100) * Math.min(fw, fh);
    roundRectPath(ctx, fx, fy, fw, fh, r);
    if (el.fill && el.fill !== 'transparent') {
      ctx.fillStyle = fillStyleFor(ctx, el, fx, fy, fw, fh);
      ctx.fill();
    }
    if (strokePx > 0) {
      ctx.strokeStyle = el.stroke;
      ctx.lineWidth = strokePx;
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawTextEl(ctx: CanvasRenderingContext2D, el: TextElement, fontDeck: string): void {
  const fx = px(el.frame.x);
  const fy = py(el.frame.y);
  const fw = px(el.frame.w);
  const sizePx = (el.fontSize / 100) * H;
  ctx.save();
  ctx.globalAlpha = el.opacity ?? 1;
  applyRotation(ctx, el.frame);
  const weight = el.bold ? '700' : '400';
  const style = el.italic ? 'italic ' : '';
  // Bộ chữ: ưu tiên fontFamily riêng của element (chuỗi CSS dùng thẳng được), không thì deck.
  const fontBody = el.fontFamily || fontDeck;
  ctx.font = `${style}${weight} ${sizePx}px ${fontBody}`;
  ctx.fillStyle = el.color;
  ctx.strokeStyle = el.color;
  ctx.textBaseline = 'top';
  const align = el.align || 'left';
  ctx.textAlign = align === 'center' ? 'center' : align === 'right' ? 'right' : 'left';
  const anchorX = align === 'center' ? fx + fw / 2 : align === 'right' ? fx + fw : fx;
  const lineH = sizePx * (el.lineHeight ?? 1.2);
  const tracking = ((el.tracking ?? 0) / 100) * H;

  // wrap theo từng dòng logic (\n) rồi wrap theo bề rộng.
  // Danh sách (bullet/số) → decorate tiền tố CHUNG với canvas UI (1 nguồn sự thật).
  const decorated = decorateListText(el.text || '', effectiveListStyle(el));
  const paragraphs = decorated.split('\n');
  let y = fy;
  for (const para of paragraphs) {
    const raw = para;
    const words = raw.split(/\s+/).filter(Boolean);
    if (!words.length) {
      y += lineH;
      continue;
    }
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      const wWidth = measureTracked(ctx, test, tracking);
      if (wWidth > fw && line) {
        drawLineText(ctx, line, anchorX, y, tracking, align, el.underline, sizePx);
        line = word;
        y += lineH;
      } else {
        line = test;
      }
    }
    if (line) {
      drawLineText(ctx, line, anchorX, y, tracking, align, el.underline, sizePx);
      y += lineH;
    }
  }
  ctx.restore();
}

/** Vẽ 1 dòng chữ (có tracking) + gạch chân nếu bật. */
function drawLineText(
  ctx: CanvasRenderingContext2D,
  text: string,
  anchorX: number,
  y: number,
  tracking: number,
  align: string,
  underline: boolean | undefined,
  sizePx: number,
): void {
  drawTracked(ctx, text, anchorX, y, tracking, align);
  if (underline) {
    const width = measureTracked(ctx, text, tracking);
    let x0 = anchorX;
    if (align === 'center') x0 = anchorX - width / 2;
    else if (align === 'right') x0 = anchorX - width;
    const uy = y + sizePx * 1.02; // ngay dưới đường baseline (textBaseline='top')
    ctx.save();
    ctx.lineWidth = Math.max(1, sizePx * 0.05);
    ctx.beginPath();
    ctx.moveTo(x0, uy);
    ctx.lineTo(x0 + width, uy);
    ctx.stroke();
    ctx.restore();
  }
}

function measureTracked(ctx: CanvasRenderingContext2D, text: string, tracking: number): number {
  if (!tracking) return ctx.measureText(text).width;
  return ctx.measureText(text).width + tracking * Math.max(0, text.length - 1);
}

function drawTracked(
  ctx: CanvasRenderingContext2D,
  text: string,
  anchorX: number,
  y: number,
  tracking: number,
  align: string,
): void {
  if (!tracking) {
    ctx.fillText(text, anchorX, y);
    return;
  }
  // vẽ từng ký tự để áp letter-spacing (căn trái để đơn giản; căn giữa/phải bù offset)
  const total = measureTracked(ctx, text, tracking);
  let startX = anchorX;
  if (align === 'center') startX = anchorX - total / 2;
  else if (align === 'right') startX = anchorX - total;
  const prevAlign = ctx.textAlign;
  ctx.textAlign = 'left';
  let cx = startX;
  for (const ch of text) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + tracking;
  }
  ctx.textAlign = prevAlign;
}

function applyRotation(ctx: CanvasRenderingContext2D, frame: { x: number; y: number; w: number; h: number; rotation: number }): void {
  if (!frame.rotation) return;
  const cx = px(frame.x) + px(frame.w) / 2;
  const cy = py(frame.y) + py(frame.h) / 2;
  ctx.translate(cx, cy);
  ctx.rotate((frame.rotation * Math.PI) / 180);
  ctx.translate(-cx, -cy);
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rad = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  ctx.beginPath();
  if (rad === 0) {
    ctx.rect(x, y, w, h);
  } else {
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
  }
}

/** Bộ chữ body cho canvas (sans, khớp lib/slides FONTS). */
const CANVAS_FONT: Record<string, string> = {
  Editorial: '"Avenir Next", "Helvetica Neue", Helvetica, Arial, sans-serif',
  Modern: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  Elegant: 'Optima, "Avenir Next", "Helvetica Neue", sans-serif',
};

/** Vẽ toàn slide ra JPEG dataURL 1920×1080. */
export async function renderEditorSlide(
  slide: EditorSlide,
  fonts: string = 'Editorial',
): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const fontBody = CANVAS_FONT[fonts] ?? CANVAS_FONT.Editorial;

  // nền màu
  ctx.fillStyle = slide.background || '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // ảnh nền full-bleed
  if (slide.backgroundImage) {
    try {
      const img = await loadImage(slide.backgroundImage);
      const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
      const sw = W / scale;
      const sh = H / scale;
      ctx.save();
      ctx.filter = adjustToCssFilter(slide.backgroundAdjust);
      ctx.drawImage(
        img,
        (img.naturalWidth - sw) / 2,
        (img.naturalHeight - sh) / 2,
        sw,
        sh,
        0,
        0,
        W,
        H,
      );
      ctx.restore();
    } catch {
      /* bỏ qua ảnh lỗi */
    }
  }

  // element theo thứ tự mảng (cuối = trên cùng); bỏ qua element ẩn (layer tắt).
  for (const el of slide.elements) {
    if (el.hidden) continue;
    if (el.kind === 'image') await drawImageEl(ctx, el);
    else if (el.kind === 'shape') drawShapeEl(ctx, el);
    else if (el.kind === 'text') drawTextEl(ctx, el, fontBody);
  }

  return canvas.toDataURL('image/jpeg', 0.92);
}
