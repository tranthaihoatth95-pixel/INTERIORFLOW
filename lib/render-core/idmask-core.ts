/**
 * lib/render-core/idmask-core.ts — TẦNG LÕI TẤT ĐỊNH của node "ID Mask (phân vùng)".
 *
 * Phân vùng ảnh thành k vùng màu bằng MEDIAN-CUT (không ngẫu nhiên, không AI):
 * cùng ảnh + cùng k luôn cho cùng kết quả. Đây là ID map kiểu VRay/Corona
 * (mỗi vùng 1 màu phẳng) để chọn vùng đưa vào Material Swap / Chỉnh cục bộ.
 *
 * Thuần TS trên buffer RGBA (không DOM) — node def lo phần canvas encode/decode.
 * Test: node_modules/.bin/sucrase-node lib/render-core/render-core.test.ts
 */

export type Rgba = Uint8ClampedArray | Uint8Array | number[];

/** Bảng màu ID cố định (flat, phân biệt mạnh) — index = số vùng. */
export const ID_COLORS: Array<[number, number, number]> = [
  [230, 57, 70], // đỏ
  [69, 123, 157], // xanh dương
  [42, 157, 143], // teal
  [233, 196, 106], // vàng
  [155, 93, 229], // tím
  [244, 140, 6], // cam
  [87, 117, 144], // xám xanh
  [144, 190, 109], // lá
];

export const IDMASK_MAX_REGIONS = ID_COLORS.length;

interface CutBox {
  /** index pixel (đã sample) thuộc box */
  idx: number[];
}

/** Kênh có range lớn nhất trong box — median-cut chuẩn. */
function widestChannel(px: number[][], box: CutBox): number {
  const mins = [255, 255, 255];
  const maxs = [0, 0, 0];
  for (const i of box.idx) {
    for (let c = 0; c < 3; c++) {
      const v = px[i][c];
      if (v < mins[c]) mins[c] = v;
      if (v > maxs[c]) maxs[c] = v;
    }
  }
  let best = 0;
  let bestRange = -1;
  for (let c = 0; c < 3; c++) {
    const r = maxs[c] - mins[c];
    if (r > bestRange) {
      bestRange = r;
      best = c;
    }
  }
  return best;
}

export interface IdMapResult {
  /** vùng của từng pixel (0..k-1), dài w*h */
  assign: Uint8Array;
  /** màu đại diện thật của mỗi vùng (trung bình pixel) */
  palette: Array<[number, number, number]>;
  /** tỉ lệ pixel mỗi vùng (0..1) */
  share: number[];
  k: number;
}

/**
 * Median-cut k vùng trên buffer RGBA. Sample stride để nhanh (ảnh lớn), nhưng
 * ASSIGN đủ mọi pixel theo nearest-palette → mask sắc nét đúng kích thước ảnh.
 */
export function quantizeIdMap(data: Rgba, w: number, h: number, k: number): IdMapResult {
  const n = w * h;
  const kk = Math.max(2, Math.min(IDMASK_MAX_REGIONS, Math.floor(k)));
  // 1) sample pixel (tối đa ~16k điểm) — tất định (stride đều)
  const stride = Math.max(1, Math.floor(n / 16384));
  const px: number[][] = [];
  for (let i = 0; i < n; i += stride) {
    const o = i * 4;
    px.push([data[o] as number, data[o + 1] as number, data[o + 2] as number]);
  }
  // 2) median-cut: tách box rộng nhất cho tới khi đủ kk box
  const boxes: CutBox[] = [{ idx: px.map((_, i) => i) }];
  while (boxes.length < kk) {
    // chọn box đông pixel nhất còn tách được
    let bi = -1;
    let bn = 1;
    for (let i = 0; i < boxes.length; i++) {
      if (boxes[i].idx.length > bn) {
        bn = boxes[i].idx.length;
        bi = i;
      }
    }
    if (bi < 0) break;
    const box = boxes[bi];
    const ch = widestChannel(px, box);
    const sorted = [...box.idx].sort((a, b) => px[a][ch] - px[b][ch] || a - b); // tie-break index → tất định
    const mid = Math.floor(sorted.length / 2);
    if (mid === 0 || mid === sorted.length) break;
    boxes.splice(bi, 1, { idx: sorted.slice(0, mid) }, { idx: sorted.slice(mid) });
  }
  // 3) palette = trung bình mỗi box; sắp theo độ sáng (tối→sáng) để index ổn định
  const palette: Array<[number, number, number]> = boxes.map((b) => {
    let r = 0;
    let g = 0;
    let bl = 0;
    for (const i of b.idx) {
      r += px[i][0];
      g += px[i][1];
      bl += px[i][2];
    }
    const c = Math.max(1, b.idx.length);
    return [Math.round(r / c), Math.round(g / c), Math.round(bl / c)];
  });
  palette.sort((a, b) => a[0] + a[1] + a[2] - (b[0] + b[1] + b[2]));
  // 4) assign đủ mọi pixel → vùng gần nhất
  const assign = new Uint8Array(n);
  const counts = new Array(palette.length).fill(0);
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    const r = data[o] as number;
    const g = data[o + 1] as number;
    const bl = data[o + 2] as number;
    let best = 0;
    let bestD = Infinity;
    for (let p = 0; p < palette.length; p++) {
      const dr = r - palette[p][0];
      const dg = g - palette[p][1];
      const db = bl - palette[p][2];
      const d = dr * dr + dg * dg + db * db;
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    assign[i] = best;
    counts[best]++;
  }
  return { assign, palette, share: counts.map((c) => c / n), k: palette.length };
}

/** Render ID map: mỗi vùng tô 1 màu ID phẳng (buffer RGBA mới). */
export function renderIdMap(assign: Uint8Array, w: number, h: number): Uint8ClampedArray {
  const out = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < assign.length; i++) {
    const c = ID_COLORS[assign[i] % ID_COLORS.length];
    const o = i * 4;
    out[o] = c[0];
    out[o + 1] = c[1];
    out[o + 2] = c[2];
    out[o + 3] = 255;
  }
  return out;
}

/** Mask trắng/đen cho 1 vùng (chuẩn inpaint: trắng = vùng chọn). */
export function maskForRegion(assign: Uint8Array, w: number, h: number, region: number): Uint8ClampedArray {
  const out = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < assign.length; i++) {
    const v = assign[i] === region ? 255 : 0;
    const o = i * 4;
    out[o] = v;
    out[o + 1] = v;
    out[o + 2] = v;
    out[o + 3] = 255;
  }
  return out;
}

/**
 * Tinh chỉnh 2-tầng: có cutout BiRefNet (alpha) → ép pixel NỀN (alpha thấp) về vùng 0,
 * pixel foreground giữ vùng quantize (dồn lên 1..k). Kết quả: vùng 0 = nền chính xác AI.
 */
export function refineWithAlpha(assign: Uint8Array, alpha: Rgba, threshold = 128): Uint8Array {
  const out = new Uint8Array(assign.length);
  for (let i = 0; i < assign.length; i++) {
    const a = alpha[i * 4 + 3] as number;
    out[i] = a < threshold ? 0 : Math.min(IDMASK_MAX_REGIONS - 1, assign[i] + 1);
  }
  return out;
}
