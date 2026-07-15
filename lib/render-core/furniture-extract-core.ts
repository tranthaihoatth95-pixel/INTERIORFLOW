/**
 * lib/render-core/furniture-extract-core.ts — TẦNG LÕI TẤT ĐỊNH của node "Tách nội thất".
 *
 * Không có FAL_KEY (BiRefNet) vẫn tách được ảnh sản phẩm/nội thất chụp trên nền
 * tương đối phẳng (catalogue, ảnh studio): ước lượng màu nền từ VIỀN ảnh →
 * alpha theo khoảng cách màu (ramp mềm quanh tolerance). Kết quả thật, tất định.
 *
 * Thuần TS trên buffer RGBA — test: node_modules/.bin/sucrase-node lib/render-core/render-core.test.ts
 */
import type { Rgba } from './idmask-core';

export interface BgEstimate {
  color: [number, number, number];
  /** độ lệch chuẩn màu viền — nền càng phẳng càng nhỏ; lớn = cảnh phức tạp, cảnh báo */
  spread: number;
}

/** Ước lượng màu nền từ pixel viền (2 hàng/2 cột mép) — median từng kênh cho bền outlier. */
export function estimateBackground(data: Rgba, w: number, h: number): BgEstimate {
  const rs: number[] = [];
  const gs: number[] = [];
  const bs: number[] = [];
  const push = (i: number) => {
    const o = i * 4;
    rs.push(data[o] as number);
    gs.push(data[o + 1] as number);
    bs.push(data[o + 2] as number);
  };
  const band = Math.max(1, Math.min(2, Math.floor(Math.min(w, h) / 32)));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (x < band || x >= w - band || y < band || y >= h - band) push(y * w + x);
    }
  }
  const med = (arr: number[]) => {
    const s = [...arr].sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)] ?? 0;
  };
  const color: [number, number, number] = [med(rs), med(gs), med(bs)];
  let varSum = 0;
  for (let i = 0; i < rs.length; i++) {
    const dr = rs[i] - color[0];
    const dg = gs[i] - color[1];
    const db = bs[i] - color[2];
    varSum += dr * dr + dg * dg + db * db;
  }
  return { color, spread: Math.sqrt(varSum / Math.max(1, rs.length)) };
}

export interface ExtractResult {
  /** buffer RGBA mới — nền trong suốt, foreground giữ nguyên */
  data: Uint8ClampedArray;
  /** tỉ lệ pixel foreground (0..1) */
  fgRatio: number;
  /** bbox foreground (px) — null nếu không tách được gì */
  bbox: { x: number; y: number; w: number; h: number } | null;
  bg: BgEstimate;
  /** cảnh báo tầng lõi (nền phức tạp…) — node hiện thẳng cho user */
  warnings: string[];
}

/**
 * Tách foreground theo khoảng cách màu tới nền. tolerance 0..1 (0.25 mặc định):
 * dist < tol*255 → alpha 0; ramp mềm tới 1.6*tol; xa hơn → giữ nguyên alpha gốc.
 */
export function extractForeground(data: Rgba, w: number, h: number, tolerance = 0.25): ExtractResult {
  const bg = estimateBackground(data, w, h);
  const warnings: string[] = [];
  if (bg.spread > 60) {
    warnings.push('Nền ảnh phức tạp — tầng lõi tách theo màu viền có thể lem. Có FAL_KEY sẽ dùng BiRefNet chính xác hơn.');
  }
  const tol = Math.max(0.02, Math.min(0.9, tolerance)) * 255;
  const soft = tol * 1.6;
  const n = w * h;
  const out = new Uint8ClampedArray(n * 4);
  let fg = 0;
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    const dr = (data[o] as number) - bg.color[0];
    const dg = (data[o + 1] as number) - bg.color[1];
    const db = (data[o + 2] as number) - bg.color[2];
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);
    let a: number;
    if (dist <= tol) a = 0;
    else if (dist >= soft) a = data[o + 3] as number;
    else a = Math.round(((dist - tol) / (soft - tol)) * (data[o + 3] as number));
    out[o] = data[o] as number;
    out[o + 1] = data[o + 1] as number;
    out[o + 2] = data[o + 2] as number;
    out[o + 3] = a;
    if (a >= 128) {
      fg++;
      const x = i % w;
      const y = Math.floor(i / w);
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  const bbox = maxX >= 0 ? { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 } : null;
  if (!bbox) warnings.push('Không tách được foreground — ảnh gần như đồng màu với nền.');
  return { data: out, fgRatio: fg / n, bbox, bg, warnings };
}

/** Mask trắng/đen từ alpha đã tách (trắng = foreground) — nối thẳng vào node inpaint. */
export function alphaToMask(data: Rgba, w: number, h: number, threshold = 128): Uint8ClampedArray {
  const n = w * h;
  const out = new Uint8ClampedArray(n * 4);
  for (let i = 0; i < n; i++) {
    const v = (data[i * 4 + 3] as number) >= threshold ? 255 : 0;
    const o = i * 4;
    out[o] = v;
    out[o + 1] = v;
    out[o + 2] = v;
    out[o + 3] = 255;
  }
  return out;
}
