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
  adjustToCssFilter,
} from './model';
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
      ctx.fillStyle = el.fill;
      ctx.fill();
    }
    if (strokePx > 0) {
      ctx.strokeStyle = el.stroke;
      ctx.lineWidth = strokePx;
      ctx.stroke();
    }
  } else {
    const r = ((el.radius ?? 0) / 100) * Math.min(fw, fh);
    roundRectPath(ctx, fx, fy, fw, fh, r);
    if (el.fill && el.fill !== 'transparent') {
      ctx.fillStyle = el.fill;
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

function drawTextEl(ctx: CanvasRenderingContext2D, el: TextElement, fontBody: string): void {
  const fx = px(el.frame.x);
  const fy = py(el.frame.y);
  const fw = px(el.frame.w);
  const sizePx = (el.fontSize / 100) * H;
  ctx.save();
  ctx.globalAlpha = el.opacity ?? 1;
  applyRotation(ctx, el.frame);
  const weight = el.bold ? '700' : '400';
  const style = el.italic ? 'italic ' : '';
  ctx.font = `${style}${weight} ${sizePx}px ${fontBody}`;
  ctx.fillStyle = el.color;
  ctx.textBaseline = 'top';
  const align = el.align || 'left';
  ctx.textAlign = align === 'center' ? 'center' : align === 'right' ? 'right' : 'left';
  const anchorX = align === 'center' ? fx + fw / 2 : align === 'right' ? fx + fw : fx;
  const lineH = sizePx * (el.lineHeight ?? 1.2);
  const tracking = ((el.tracking ?? 0) / 100) * H;

  // wrap theo từng dòng logic (\n) rồi wrap theo bề rộng
  const paragraphs = (el.text || '').split('\n');
  let y = fy;
  for (const para of paragraphs) {
    const words = para.split(/\s+/).filter(Boolean);
    if (!words.length) {
      y += lineH;
      continue;
    }
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      const wWidth = measureTracked(ctx, test, tracking);
      if (wWidth > fw && line) {
        drawTracked(ctx, line, anchorX, y, tracking, align);
        line = word;
        y += lineH;
      } else {
        line = test;
      }
    }
    if (line) {
      drawTracked(ctx, line, anchorX, y, tracking, align);
      y += lineH;
    }
  }
  ctx.restore();
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

  // element theo thứ tự mảng (cuối = trên cùng)
  for (const el of slide.elements) {
    if (el.kind === 'image') await drawImageEl(ctx, el);
    else if (el.kind === 'shape') drawShapeEl(ctx, el);
    else if (el.kind === 'text') drawTextEl(ctx, el, fontBody);
  }

  return canvas.toDataURL('image/jpeg', 0.92);
}
