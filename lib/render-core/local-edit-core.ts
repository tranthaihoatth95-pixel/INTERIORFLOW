/**
 * lib/render-core/local-edit-core.ts — TẦNG LÕI TẤT ĐỊNH của node "Chỉnh cục bộ".
 *
 * Không có key inpaint (FLUX Fill) vẫn CHỈNH THẬT vùng mask: sáng / tương phản /
 * bão hoà / nhiệt màu / hue-shift áp CÓ TRỌNG SỐ theo mask (pixel ngoài mask giữ
 * nguyên 100%, mép mask mượt theo alpha). Toán pixel thuần, tất định.
 *
 * Test: node_modules/.bin/sucrase-node lib/render-core/render-core.test.ts
 */
import type { Rgba } from './idmask-core';

export interface LocalAdjust {
  /** 0.5..1.5 — nhân độ sáng */
  brightness?: number;
  /** 0.5..1.5 — quanh trung điểm 128 */
  contrast?: number;
  /** 0..2 — 0 = xám hoá, 1 = giữ, 2 = rực */
  saturate?: number;
  /** -1..1 — ấm (+) / lạnh (-) */
  temperature?: number;
  /** -180..180 độ — xoay hue (đổi màu vật liệu nhanh) */
  hueShiftDeg?: number;
}

const clamp255 = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v);

/** Điều chỉnh 1 pixel RGB — thứ tự: brightness → contrast → saturate → temperature → hue. */
export function adjustPixel(r: number, g: number, b: number, a: LocalAdjust): [number, number, number] {
  const br = a.brightness ?? 1;
  const ct = a.contrast ?? 1;
  const sat = a.saturate ?? 1;
  const temp = a.temperature ?? 0;
  const hue = ((a.hueShiftDeg ?? 0) * Math.PI) / 180;

  let rr = r * br;
  let gg = g * br;
  let bb = b * br;
  rr = (rr - 128) * ct + 128;
  gg = (gg - 128) * ct + 128;
  bb = (bb - 128) * ct + 128;
  const lum = 0.2126 * rr + 0.7152 * gg + 0.0722 * bb;
  rr = lum + (rr - lum) * sat;
  gg = lum + (gg - lum) * sat;
  bb = lum + (bb - lum) * sat;
  rr += temp * 26;
  bb -= temp * 26;
  if (hue !== 0) {
    // xoay hue quanh trục xám (ma trận YIQ gọn — đủ cho chỉnh vật liệu)
    const cosA = Math.cos(hue);
    const sinA = Math.sin(hue);
    const m = [
      0.213 + cosA * 0.787 - sinA * 0.213, 0.715 - cosA * 0.715 - sinA * 0.715, 0.072 - cosA * 0.072 + sinA * 0.928,
      0.213 - cosA * 0.213 + sinA * 0.143, 0.715 + cosA * 0.285 + sinA * 0.14, 0.072 - cosA * 0.072 - sinA * 0.283,
      0.213 - cosA * 0.213 - sinA * 0.787, 0.715 - cosA * 0.715 + sinA * 0.715, 0.072 + cosA * 0.928 + sinA * 0.072,
    ];
    const r2 = m[0] * rr + m[1] * gg + m[2] * bb;
    const g2 = m[3] * rr + m[4] * gg + m[5] * bb;
    const b2 = m[6] * rr + m[7] * gg + m[8] * bb;
    rr = r2;
    gg = g2;
    bb = b2;
  }
  return [clamp255(rr), clamp255(gg), clamp255(bb)];
}

export interface LocalEditResult {
  data: Uint8ClampedArray;
  /** tỉ lệ pixel bị chỉnh (trọng số mask > 0) */
  editedRatio: number;
}

/**
 * Áp điều chỉnh CÓ TRỌNG SỐ theo mask: weight = độ sáng mask (0..1, trắng = chỉnh full).
 * mask null → áp toàn ảnh. img và mask cùng kích thước w×h (RGBA).
 */
export function applyMaskedAdjust(
  img: Rgba,
  mask: Rgba | null,
  w: number,
  h: number,
  adjust: LocalAdjust,
): LocalEditResult {
  const n = w * h;
  const out = new Uint8ClampedArray(n * 4);
  let edited = 0;
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    const r = img[o] as number;
    const g = img[o + 1] as number;
    const b = img[o + 2] as number;
    const al = img[o + 3] as number;
    let weight = 1;
    if (mask) {
      // độ sáng mask × alpha mask (mask vẽ tay của MaskPainter: trắng trên nền đen/trong)
      const mo = i * 4;
      const mlum = (0.2126 * (mask[mo] as number) + 0.7152 * (mask[mo + 1] as number) + 0.0722 * (mask[mo + 2] as number)) / 255;
      weight = mlum * ((mask[mo + 3] as number) / 255);
    }
    if (weight <= 0.002) {
      out[o] = r;
      out[o + 1] = g;
      out[o + 2] = b;
      out[o + 3] = al;
      continue;
    }
    edited++;
    const [ar, ag, ab] = adjustPixel(r, g, b, adjust);
    out[o] = clamp255(r + (ar - r) * weight);
    out[o + 1] = clamp255(g + (ag - g) * weight);
    out[o + 2] = clamp255(b + (ab - b) * weight);
    out[o + 3] = al;
  }
  return { data: out, editedRatio: edited / n };
}
