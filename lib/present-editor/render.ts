/**
 * lib/present-editor/render.ts — Vẽ 1 EditorSlide (model) ra canvas.
 *
 * Dùng cho:
 *   - Xuất PDF (mỗi slide → 1 ảnh JPEG full-page, jsPDF).
 *   - Tạo data URI cho ảnh nền/hero khi xuất PPTX.
 *   - (Có thể) thumbnail.
 *
 * Toạ độ model là % của sân khấu → nhân W/H. Kích thước sân khấu (W/H) đọc từ THAM SỐ
 * `stage` (mặc định 16:9 = STAGE_PRESETS['16:9'], KHÔNG đổi hành vi so trước PS-4) — xem
 * lib/present-editor/stage-presets.ts (nguồn duy nhất, gộp nợ kỹ thuật "2 nguồn stage-size").
 * CSS filter (adjust) được tái dựng bằng ctx.filter (Canvas hỗ trợ cùng cú pháp filter với
 * CSS). Crop áp bằng source-rect.
 *
 * Chỉ chạy ở client (cần document/canvas). Trả JPEG dataURL.
 */

import {
  type EditorSlide,
  type ImageElement,
  type TextElement,
  type ShapeElement,
  type OpacityGradient,
  type DeckWatermark,
  adjustToCssFilter,
  decorateListText,
  effectiveListStyle,
} from './model';
import { polygonPoints01, isPolygonShape } from './shape-geometry';
import { applyTransform, gradientLine, isCurved } from './text-fx';
import { loadImage } from '@/lib/imaging';
import { STAGE_PRESETS, type StageSize } from './stage-presets';

/** Bộ quy đổi %→px CHO 1 LẦN vẽ — truyền qua tham số (KHÔNG dùng biến module-level dùng
 * chung) để nhiều renderEditorSlide chạy song song (Promise.all ở TemplatePicker/LayoutShelf)
 * không giẫm lên nhau. */
interface Scale {
  W: number;
  H: number;
  px: (pctW: number) => number;
  py: (pctH: number) => number;
}
function makeScale(stage: StageSize): Scale {
  const { w: W, h: H } = stage;
  return { W, H, px: (pctW) => (pctW / 100) * W, py: (pctH) => (pctH / 100) * H };
}

/** Vẽ ảnh có crop (theo tỉ lệ 0..1 của ảnh gốc) + filter, phủ khung dạng cover. */
async function drawImageEl(
  ctx: CanvasRenderingContext2D,
  el: ImageElement,
  sc: Scale,
): Promise<void> {
  let img: HTMLImageElement;
  try {
    img = await loadImage(el.src);
  } catch {
    return;
  }
  const fx = sc.px(el.frame.x);
  const fy = sc.py(el.frame.y);
  const fw = sc.px(el.frame.w);
  const fh = sc.py(el.frame.h);
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
  applyRotation(ctx, el.frame, sc);
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

function drawShapeEl(ctx: CanvasRenderingContext2D, el: ShapeElement, sc: Scale): void {
  const fx = sc.px(el.frame.x);
  const fy = sc.py(el.frame.y);
  const fw = sc.px(el.frame.w);
  const fh = sc.py(el.frame.h);
  ctx.save();
  ctx.globalAlpha = el.opacity ?? 1;
  applyRotation(ctx, el.frame, sc);
  const strokePx = (el.strokeWidth / 100) * sc.H; // strokeWidth tính @ chiều cao sân khấu
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

function drawTextEl(ctx: CanvasRenderingContext2D, el: TextElement, fontDeck: string, sc: Scale): void {
  const fx = sc.px(el.frame.x);
  const fy = sc.py(el.frame.y);
  const fw = sc.px(el.frame.w);
  const fh = sc.py(el.frame.h);
  const sizePx = (el.fontSize / 100) * sc.H;
  ctx.save();
  ctx.globalAlpha = el.opacity ?? 1;
  applyRotation(ctx, el.frame, sc);
  const weight = el.bold ? '700' : '400';
  const style = el.italic ? 'italic ' : '';
  // Bộ chữ: ưu tiên fontFamily riêng của element (chuỗi CSS dùng thẳng được), không thì deck.
  const fontBody = el.fontFamily || fontDeck;
  ctx.font = `${style}${weight} ${sizePx}px ${fontBody}`;

  /* Hiệu ứng chữ (#2) — quy mọi khoảng cách % sân khấu sang px, rồi gói thành `paint` để
     các hàm vẽ dòng dùng chung. Không có fx → paint "trơn", đường vẽ y hệt trước. */
  const paint = buildTextPaint(ctx, el, sc, { x: fx, y: fy, w: fw, h: fh });
  if (paint.blend) ctx.globalCompositeOperation = paint.blend;

  ctx.fillStyle = paint.fill;
  ctx.strokeStyle = paint.strokeColor;
  ctx.textBaseline = 'top';
  const align = el.align || 'left';
  ctx.textAlign = align === 'center' ? 'center' : align === 'right' ? 'right' : 'left';
  const anchorX = align === 'center' ? fx + fw / 2 : align === 'right' ? fx + fw : fx;
  let sizeDraw = sizePx;
  let lineH = sizePx * (el.lineHeight ?? 1.2);
  let tracking = ((el.tracking ?? 0) / 100) * sc.H;

  // Chữ uốn cung đi đường riêng (một dòng, vẽ từng ký tự quay quanh tâm cung).
  if (isCurved(el.fx)) {
    drawCurvedText(ctx, el, paint, { x: fx, y: fy, w: fw, h: fh }, sizePx, tracking);
    ctx.restore();
    return;
  }

  // Kicker = nhãn 1 dòng (tracking rộng): TỰ CO để không rớt xuống 2 dòng khi chữ dài.
  if (el.role === 'kicker') {
    let maxW = 0;
    for (const p of textOf(el).split('\n'))
      maxW = Math.max(maxW, measureTracked(ctx, p, tracking));
    if (maxW > fw && fw > 0) {
      const s = (fw * 0.98) / maxW;
      sizeDraw = sizePx * s;
      tracking *= s;
      lineH *= s;
      ctx.font = `${style}${weight} ${sizeDraw}px ${fontBody}`;
    }
  }

  // wrap theo từng dòng logic (\n) rồi wrap theo bề rộng.
  // Danh sách (bullet/số) → decorate tiền tố CHUNG với canvas UI (1 nguồn sự thật).
  const decorated = textOf(el);
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
        drawLineText(ctx, line, anchorX, y, tracking, align, el.underline, sizeDraw, paint);
        line = word;
        y += lineH;
      } else {
        line = test;
      }
    }
    if (line) {
      drawLineText(ctx, line, anchorX, y, tracking, align, el.underline, sizeDraw, paint);
      y += lineH;
    }
  }
  ctx.restore();
}

/** Nội dung chữ ĐÃ decorate danh sách + áp hoa/thường — khớp Element.tsx (DOM). */
function textOf(el: TextElement): string {
  return applyTransform(decorateListText(el.text || '', effectiveListStyle(el)), el.fx);
}

/* ------------------------------------------------------------------ */
/* Hiệu ứng chữ trên canvas                                            */
/* ------------------------------------------------------------------ */

/**
 * Mô tả cách "tô" một dòng chữ. Gom lại một chỗ vì canvas 2D không có khái niệm hiệu ứng
 * chữ như CSS: mỗi thứ phải tự dựng — gradient thành CanvasGradient, viền thành strokeText,
 * và BÓNG NHIỀU LỚP thành nhiều lượt vẽ (canvas chỉ giữ ĐƯỢC MỘT shadow tại một thời điểm).
 */
interface TextPaint {
  fill: string | CanvasGradient;
  strokeColor: string;
  strokeWidth: number;
  outlineOnly: boolean;
  wordSpacing: number;
  shadows: { x: number; y: number; blur: number; color: string }[];
  blend?: GlobalCompositeOperation;
}

function buildTextPaint(
  ctx: CanvasRenderingContext2D,
  el: TextElement,
  sc: Scale,
  box: { x: number; y: number; w: number; h: number },
): TextPaint {
  const fx = el.fx;
  const toPx = (v: number) => (v / 100) * sc.H;

  let fill: string | CanvasGradient = el.color;
  if (fx?.gradient) {
    const { x0, y0, x1, y1 } = gradientLine(fx.gradient.angle, box);
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, fx.gradient.from);
    g.addColorStop(1, fx.gradient.to);
    fill = g;
  }

  return {
    fill,
    strokeColor: fx?.strokeColor ?? el.color,
    strokeWidth: fx?.strokeWidth ? toPx(fx.strokeWidth) : 0,
    outlineOnly: Boolean(fx?.outlineOnly),
    wordSpacing: fx?.wordSpacing ? toPx(fx.wordSpacing) : 0,
    shadows: (fx?.shadows ?? []).map((s) => ({
      x: toPx(s.x),
      y: toPx(s.y),
      blur: Math.max(0, toPx(s.blur)),
      color: s.color,
    })),
    blend:
      fx?.blend && fx.blend !== 'normal' ? (fx.blend as GlobalCompositeOperation) : undefined,
  };
}

/**
 * Vẽ chữ theo `paint`: các lớp bóng trước (mỗi lớp một lượt, vì canvas chỉ giữ 1 shadow),
 * rồi lượt cuối vẽ chữ thật không bóng. `emit` là hàm vẽ nguyên văn (fill/stroke) do caller
 * cấp — dùng chung cho cả chữ thẳng lẫn chữ uốn.
 */
function paintWithFx(ctx: CanvasRenderingContext2D, paint: TextPaint, emit: () => void): void {
  // MẢNG BÓNG vẽ từ lớp CUỐI về lớp ĐẦU để lớp đầu nằm trên cùng (khớp thứ tự CSS text-shadow)
  for (let i = paint.shadows.length - 1; i >= 0; i--) {
    const s = paint.shadows[i];
    ctx.save();
    ctx.shadowColor = s.color;
    ctx.shadowOffsetX = s.x;
    ctx.shadowOffsetY = s.y;
    ctx.shadowBlur = s.blur;
    emit();
    ctx.restore();
  }
  ctx.save();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  emit();
  ctx.restore();
}

/** Một lượt vẽ chữ: ruột (nếu không phải chữ rỗng) + viền (nếu có). */
function emitGlyph(
  ctx: CanvasRenderingContext2D,
  paint: TextPaint,
  draw: (mode: 'fill' | 'stroke') => void,
): void {
  if (!paint.outlineOnly) draw('fill');
  if (paint.strokeWidth > 0) {
    ctx.save();
    ctx.lineWidth = paint.strokeWidth;
    ctx.strokeStyle = paint.strokeColor;
    ctx.lineJoin = 'round';
    draw('stroke');
    ctx.restore();
  }
}

/**
 * CHỮ UỐN CUNG trên canvas — vẽ từng ký tự, mỗi ký tự xoay theo tiếp tuyến của cung.
 * Cùng công thức hình học với CurvedText (DOM) ở Element.tsx: dây cung = 92% bề ngang khung,
 * góc ở tâm = |curve| độ, R = (dây/2)/sin(góc/2). Xuống dòng bị bỏ (cung chỉ có một đường).
 */
function drawCurvedText(
  ctx: CanvasRenderingContext2D,
  el: TextElement,
  paint: TextPaint,
  box: { x: number; y: number; w: number; h: number },
  sizePx: number,
  tracking: number,
): void {
  const line = textOf(el).replace(/\s*\n\s*/g, ' ');
  if (!line) return;

  const deg = Math.max(-350, Math.min(350, el.fx?.curve ?? 0));
  const up = deg > 0;
  const rad = (Math.abs(deg) * Math.PI) / 180;
  const chord = Math.max(1, box.w * 0.92);
  const R = chord / 2 / Math.max(0.0001, Math.sin(rad / 2));
  const sagitta = R - Math.sqrt(Math.max(0, R * R - (chord / 2) ** 2));
  const cx = box.x + box.w / 2;
  // tâm cung: nằm dưới khung khi cong lên, trên khung khi cong xuống
  const midY = box.y + box.h / 2 + (up ? sagitta / 2 : -sagitta / 2);
  const centerY = up ? midY + R : midY - R;

  // bề rộng cung chữ → góc mỗi ký tự (góc = cung/bán kính)
  const widths = [...line].map((ch) => ctx.measureText(ch).width + tracking + (ch === ' ' ? paint.wordSpacing : 0));
  const totalW = widths.reduce((a, b) => a + b, 0);
  const totalAngle = totalW / R;

  const align = el.align || 'left';
  // góc bắt đầu: 0 = đỉnh cung (thẳng trên/dưới tâm)
  let angle =
    align === 'center' ? -totalAngle / 2 : align === 'right' ? rad / 2 - totalAngle : -rad / 2;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = paint.fill;

  for (let i = 0; i < widths.length; i++) {
    const ch = [...line][i];
    const step = widths[i] / R;
    const a = angle + step / 2;
    ctx.save();
    ctx.translate(cx + Math.sin(a) * R, centerY + (up ? -1 : 1) * Math.cos(a) * R);
    ctx.rotate(up ? a : -a);
    paintWithFx(ctx, paint, () =>
      emitGlyph(ctx, paint, (mode) => (mode === 'fill' ? ctx.fillText(ch, 0, 0) : ctx.strokeText(ch, 0, 0))),
    );
    ctx.restore();
    angle += step;
  }
  ctx.restore();
}

/** Vẽ 1 dòng chữ (có tracking + hiệu ứng) + gạch chân nếu bật. */
function drawLineText(
  ctx: CanvasRenderingContext2D,
  text: string,
  anchorX: number,
  y: number,
  tracking: number,
  align: string,
  underline: boolean | undefined,
  sizePx: number,
  paint: TextPaint,
): void {
  drawTracked(ctx, text, anchorX, y, tracking, align, paint);
  if (underline) {
    const width = measureTracked(ctx, text, tracking, paint.wordSpacing);
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

function measureTracked(
  ctx: CanvasRenderingContext2D,
  text: string,
  tracking: number,
  wordSpacing = 0,
): number {
  const base = ctx.measureText(text).width;
  if (!tracking && !wordSpacing) return base;
  const spaces = wordSpacing ? (text.match(/ /g)?.length ?? 0) : 0;
  return base + tracking * Math.max(0, text.length - 1) + wordSpacing * spaces;
}

function drawTracked(
  ctx: CanvasRenderingContext2D,
  text: string,
  anchorX: number,
  y: number,
  tracking: number,
  align: string,
  paint: TextPaint,
): void {
  const perChar = Boolean(tracking || paint.wordSpacing);

  if (!perChar) {
    paintWithFx(ctx, paint, () =>
      emitGlyph(ctx, paint, (mode) =>
        mode === 'fill' ? ctx.fillText(text, anchorX, y) : ctx.strokeText(text, anchorX, y),
      ),
    );
    return;
  }

  // vẽ từng ký tự để áp letter-spacing / word-spacing (căn trái; căn giữa-phải bù offset)
  const total = measureTracked(ctx, text, tracking, paint.wordSpacing);
  let startX = anchorX;
  if (align === 'center') startX = anchorX - total / 2;
  else if (align === 'right') startX = anchorX - total;
  const prevAlign = ctx.textAlign;
  ctx.textAlign = 'left';
  let cx = startX;
  for (const ch of text) {
    const x = cx;
    paintWithFx(ctx, paint, () =>
      emitGlyph(ctx, paint, (mode) => (mode === 'fill' ? ctx.fillText(ch, x, y) : ctx.strokeText(ch, x, y))),
    );
    cx += ctx.measureText(ch).width + tracking + (ch === ' ' ? paint.wordSpacing : 0);
  }
  ctx.textAlign = prevAlign;
}

function applyRotation(
  ctx: CanvasRenderingContext2D,
  frame: { x: number; y: number; w: number; h: number; rotation: number },
  sc: Scale,
): void {
  if (!frame.rotation) return;
  const cx = sc.px(frame.x) + sc.px(frame.w) / 2;
  const cy = sc.py(frame.y) + sc.py(frame.h) / 2;
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

/** Vẽ logo/watermark cấp deck ở 1 góc (giữ tỉ lệ ảnh, phủ theo bề rộng sizePct). */
async function drawWatermark(
  ctx: CanvasRenderingContext2D,
  wm: DeckWatermark,
  sc: Scale,
): Promise<void> {
  if (!wm.enabled || !wm.src) return;
  let img: HTMLImageElement;
  try {
    img = await loadImage(wm.src);
  } catch {
    return;
  }
  const w = (Math.max(1, Math.min(wm.sizePct, 100)) / 100) * sc.W;
  const ratio = img.naturalHeight / (img.naturalWidth || 1);
  const h = w * ratio;
  const margin = ((wm.marginPct ?? 3) / 100) * sc.W;
  const left = wm.corner === 'tl' || wm.corner === 'bl';
  const top = wm.corner === 'tl' || wm.corner === 'tr';
  const x = left ? margin : sc.W - margin - w;
  const y = top ? margin : sc.H - margin - h;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(wm.opacity, 1));
  ctx.drawImage(img, x, y, w, h);
  ctx.restore();
}

/**
 * Vẽ toàn slide ra JPEG dataURL. `stage` chọn kích thước sân khấu (mặc định 16:9 —
 * STAGE_PRESETS['16:9'], HÀNH VI GIỮ NGUYÊN so với trước PS-4 khi gọi không truyền tham
 * số này) — xem stage-presets.ts.
 */
export async function renderEditorSlide(
  slide: EditorSlide,
  fonts: string = 'Editorial',
  watermark?: DeckWatermark,
  stage: StageSize = STAGE_PRESETS['16:9'],
): Promise<string> {
  const sc = makeScale(stage);
  const canvas = document.createElement('canvas');
  canvas.width = sc.W;
  canvas.height = sc.H;
  const ctx = canvas.getContext('2d')!;
  const fontBody = CANVAS_FONT[fonts] ?? CANVAS_FONT.Editorial;

  // nền màu
  ctx.fillStyle = slide.background || '#ffffff';
  ctx.fillRect(0, 0, sc.W, sc.H);

  // ảnh nền full-bleed
  if (slide.backgroundImage) {
    try {
      const img = await loadImage(slide.backgroundImage);
      const scale = Math.max(sc.W / img.naturalWidth, sc.H / img.naturalHeight);
      const sw = sc.W / scale;
      const sh = sc.H / scale;
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
        sc.W,
        sc.H,
      );
      ctx.restore();
    } catch {
      /* bỏ qua ảnh lỗi */
    }
  }

  // element theo thứ tự mảng (cuối = trên cùng); bỏ qua element ẩn (layer tắt).
  for (const el of slide.elements) {
    if (el.hidden) continue;
    if (el.kind === 'image') await drawImageEl(ctx, el, sc);
    else if (el.kind === 'shape') drawShapeEl(ctx, el, sc);
    else if (el.kind === 'text') drawTextEl(ctx, el, fontBody, sc);
  }

  // logo/watermark cấp deck — trên cùng, mọi slide (PS-1 / G.7).
  if (watermark) await drawWatermark(ctx, watermark, sc);

  return canvas.toDataURL('image/jpeg', 0.92);
}
