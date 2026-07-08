/**
 * lib/photo-editor/imaging.ts — Xử lý pixel cho trình chỉnh ảnh raster.
 *
 * Gom mọi thao tác "nặng" chạm ImageData: adjustment (levels/curves/WB/HSL...),
 * clone/heal, tiện ích tạo canvas. Tách khỏi React để dễ test và tái dùng ở render.ts.
 *
 * Chỉ chạy phía client (đụng document/canvas). Các file gọi phải là 'use client'.
 */

import type { AdjustParams, CurvePoint } from './model';
import { DEFAULT_ADJUST_PARAMS } from './model';

/** Tạo canvas offscreen kích thước cho trước. */
export function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

/** Load ảnh (dataURL / URL) → HTMLImageElement, xin CORS cho URL ngoài. */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!src.startsWith('data:')) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Không tải được ảnh (URL hết hạn hoặc chặn CORS).'));
    img.src = src;
  });
}

/** Vẽ ảnh vào canvas mới đúng kích thước tài liệu (cover-fit hoặc stretch tuỳ mode). */
export async function imageToCanvas(
  src: string,
  docW: number,
  docH: number,
  fit: 'cover' | 'contain' | 'stretch' = 'contain',
): Promise<HTMLCanvasElement> {
  const img = await loadImage(src);
  const c = makeCanvas(docW, docH);
  const ctx = c.getContext('2d')!;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (fit === 'stretch') {
    ctx.drawImage(img, 0, 0, docW, docH);
    return c;
  }
  const scale =
    fit === 'cover' ? Math.max(docW / iw, docH / ih) : Math.min(docW / iw, docH / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  ctx.drawImage(img, (docW - dw) / 2, (docH - dh) / 2, dw, dh);
  return c;
}

/* ------------------------------------------------------------------ */
/* Dựng LUT (bảng tra 256) cho các phép chỉnh theo kênh độc lập.       */
/* ------------------------------------------------------------------ */

/** Nội suy tuyến tính đường cong (các điểm 0..255) thành LUT 256 phần tử. */
export function curveToLut(points: CurvePoint[]): Uint8ClampedArray {
  const lut = new Uint8ClampedArray(256);
  const pts = [...points].sort((a, b) => a.x - b.x);
  if (pts.length < 2) {
    for (let i = 0; i < 256; i++) lut[i] = i;
    return lut;
  }
  let seg = 0;
  for (let x = 0; x < 256; x++) {
    while (seg < pts.length - 2 && x > pts[seg + 1].x) seg++;
    const a = pts[seg];
    const b = pts[seg + 1];
    const t = b.x === a.x ? 0 : (x - a.x) / (b.x - a.x);
    lut[x] = Math.round(a.y + (b.y - a.y) * Math.max(0, Math.min(1, t)));
  }
  return lut;
}

/** Có phải đường cong "mặc định" (chéo, không đổi) không → bỏ qua cho nhanh. */
function curveIsIdentity(points: CurvePoint[]): boolean {
  if (points.length !== 2) return false;
  const s = [...points].sort((a, b) => a.x - b.x);
  return s[0].x === 0 && s[0].y === 0 && s[1].x === 255 && s[1].y === 255;
}

/**
 * Áp bộ AdjustParams lên ImageData (mutate tại chỗ).
 * Thứ tự: exposure → brightness → levels(black/white/gamma) → curve → contrast →
 * white-balance (temp/tint) → saturation → hueShift. Toàn bộ ở không gian sRGB xấp xỉ.
 */
export function applyAdjust(data: ImageData, p: AdjustParams): void {
  const px = data.data;
  const n = px.length;

  // Hệ số dẫn xuất
  const exposureMul = Math.pow(2, p.exposure / 50); // ±100 → ±2 stop
  const brightAdd = (p.brightness / 100) * 255 * 0.5;
  const contrastF = (p.contrast + 100) / 100; // 0..2 quanh 128
  const bp = p.blackPoint;
  const wp = Math.max(p.whitePoint, bp + 1);
  const levelsRange = wp - bp;
  const invGamma = 1 / (p.gamma <= 0 ? 1 : p.gamma);
  const sat = (p.saturation + 100) / 100; // 0..2
  // White balance: temp dịch R↑/B↓ khi ấm; tint dịch G.
  const tempR = (p.temperature / 100) * 30;
  const tempB = -(p.temperature / 100) * 30;
  const tintG = -(p.tint / 100) * 30;

  const useCurve = !curveIsIdentity(p.curve);
  const lut = useCurve ? curveToLut(p.curve) : null;
  const hue = p.hueShift;

  for (let i = 0; i < n; i += 4) {
    let r = px[i];
    let g = px[i + 1];
    let b = px[i + 2];
    const a = px[i + 3];
    if (a === 0) continue;

    // exposure (nhân) + brightness (cộng)
    r = r * exposureMul + brightAdd;
    g = g * exposureMul + brightAdd;
    b = b * exposureMul + brightAdd;

    // levels: kéo dải [bp,wp] về [0,255] rồi gamma
    if (bp !== 0 || wp !== 255 || p.gamma !== 1) {
      r = Math.pow(clamp01((r - bp) / levelsRange), invGamma) * 255;
      g = Math.pow(clamp01((g - bp) / levelsRange), invGamma) * 255;
      b = Math.pow(clamp01((b - bp) / levelsRange), invGamma) * 255;
    }

    // curve (LUT trên luminance-per-channel)
    if (lut) {
      r = lut[clampByte(r)];
      g = lut[clampByte(g)];
      b = lut[clampByte(b)];
    }

    // contrast quanh 128
    if (contrastF !== 1) {
      r = (r - 128) * contrastF + 128;
      g = (g - 128) * contrastF + 128;
      b = (b - 128) * contrastF + 128;
    }

    // white balance
    if (tempR !== 0) { r += tempR; b += tempB; }
    if (tintG !== 0) { g += tintG; }

    // saturation quanh luma
    if (sat !== 1) {
      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      r = luma + (r - luma) * sat;
      g = luma + (g - luma) * sat;
      b = luma + (b - luma) * sat;
    }

    // hue shift (đổi sang HSL, xoay, đổi lại) — chỉ khi cần
    if (hue !== 0) {
      const [h, s, l] = rgbToHsl(r, g, b);
      const nh = (h + hue / 360 + 1) % 1;
      const [nr, ng, nb] = hslToRgb(nh, s, l);
      r = nr; g = ng; b = nb;
    }

    px[i] = clampByte(r);
    px[i + 1] = clampByte(g);
    px[i + 2] = clampByte(b);
  }
}

/** Kiểm tra params có khác trung tính không (để skip khi vô hại). */
export function adjustIsNeutral(p: AdjustParams): boolean {
  const d = DEFAULT_ADJUST_PARAMS;
  return (
    p.brightness === d.brightness &&
    p.contrast === d.contrast &&
    p.saturation === d.saturation &&
    p.exposure === d.exposure &&
    p.temperature === d.temperature &&
    p.tint === d.tint &&
    p.blackPoint === d.blackPoint &&
    p.whitePoint === d.whitePoint &&
    p.gamma === d.gamma &&
    p.hueShift === d.hueShift &&
    curveIsIdentity(p.curve)
  );
}

/* ------------------------------------------------------------------ */
/* Heal đơn giản: lấy mẫu vòng quanh vùng đích + blend (median-ish).   */
/* ------------------------------------------------------------------ */

/**
 * Heal 1 chấm tròn tại (cx,cy) bán kính r: thay bằng trung bình mẫu lấy ở vành
 * ngoài (radius*1.6) — đủ để xoá đồ thừa nhỏ trong render. Mutate ctx tại chỗ.
 */
export function healSpot(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
): void {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const rr = Math.max(2, Math.round(r));
  const x0 = Math.max(0, Math.round(cx - rr));
  const y0 = Math.max(0, Math.round(cy - rr));
  const w = Math.min(W - x0, rr * 2);
  const h = Math.min(H - y0, rr * 2);
  if (w <= 0 || h <= 0) return;
  const patch = ctx.getImageData(x0, y0, w, h);
  const px = patch.data;

  // màu trung bình của vành ngoài (mẫu nền xung quanh)
  let sr = 0, sg = 0, sb = 0, cnt = 0;
  const cxL = cx - x0;
  const cyL = cy - y0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = x - cxL;
      const dy = y - cyL;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > rr * 0.9 && dist <= rr) {
        const idx = (y * w + x) * 4;
        sr += px[idx]; sg += px[idx + 1]; sb += px[idx + 2]; cnt++;
      }
    }
  }
  if (cnt === 0) return;
  const mr = sr / cnt, mg = sg / cnt, mb = sb / cnt;

  // tô đầy trong bán kính với feather mềm ra mép
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = x - cxL;
      const dy = y - cyL;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > rr) continue;
      const idx = (y * w + x) * 4;
      const feather = clamp01(1 - dist / rr);
      const t = feather * feather; // mềm hơn ở mép
      px[idx] = px[idx] + (mr - px[idx]) * t;
      px[idx + 1] = px[idx + 1] + (mg - px[idx + 1]) * t;
      px[idx + 2] = px[idx + 2] + (mb - px[idx + 2]) * t;
    }
  }
  ctx.putImageData(patch, x0, y0);
}

/* ------------------------------------------------------------------ */
/* Tiện ích màu.                                                       */
/* ------------------------------------------------------------------ */

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
function clampByte(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : Math.round(v);
}

/** RGB(0..255) → HSL(0..1). */
export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  const l = (max + min) / 2;
  const d = max - min;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
    if (h < 0) h += 1;
  }
  return [h, s, l];
}

/** HSL(0..1) → RGB(0..255). */
export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    const v = l * 255;
    return [v, v, v];
  }
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  const seg = Math.floor(h * 6);
  if (seg === 0) [r, g, b] = [c, x, 0];
  else if (seg === 1) [r, g, b] = [x, c, 0];
  else if (seg === 2) [r, g, b] = [0, c, x];
  else if (seg === 3) [r, g, b] = [0, x, c];
  else if (seg === 4) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}
