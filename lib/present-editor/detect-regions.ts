/**
 * lib/present-editor/detect-regions.ts — "Nhận diện LƯỚI" từ 1 ảnh bố cục tham khảo.
 *
 * Đây là mảnh mà analyze-refs.ts CỐ Ý bỏ trống (xem analyze-refs.ts:159 `TODO(VLM):
 * nhận diện lưới`). Làm bằng PROJECTION PROFILE trên bản đồ cạnh (gradient), KHÔNG
 * dùng ngưỡng sáng/tối → bất biến với nền trắng LẪN nền đen. Tất định, chạy client-only
 * (cần canvas) cho `detectRegions`; nhưng phần TOÁN đã tách thành hàm thuần để test
 * được không cần DOM.
 *
 * Vì sao projection profile HỢP với slide (khác moodboard): slide là bố cục ít vùng, to,
 * gutter sạch, thẳng trục — đúng đất diễn. Với collage ảnh chồng/masonry thì kỹ thuật
 * này KHÔNG hợp.
 *
 * GIỚI HẠN có chủ đích: module này chỉ cho LƯỚI (hình học), KHÔNG gán vai trò
 * (tiêu đề/ảnh/body). Việc gán vai trò + đổ nội dung là tầng trên, chưa làm ở đây.
 */

/** Ô lưới — khung theo % sân khấu (0..100), khớp thẳng model.Frame (thiếu rotation). */
export interface RegionCell {
  x: number; // 0..100 mép trái
  y: number; // 0..100 mép trên
  w: number; // 0..100
  h: number; // 0..100
}

export interface DetectResult {
  /** ranh giới cột (chỉ số cột trong ảnh downscale, 0..W). */
  cols: number[];
  /** ranh giới hàng (0..H). */
  rows: number[];
  /** ô lưới suy ra (đã lọc ô quá nhỏ / gần như trắng). */
  cells: RegionCell[];
  W: number;
  H: number;
}

export const DOWNSCALE_W = 240; // đủ để thấy BỐ CỤC, rẻ.

/* --------------------------- TOÁN THUẦN (test được) --------------------------- */

/**
 * Tìm khoảng trũng kéo dài trong 1 projection profile = whitespace = ranh giới.
 * Trả về TÂM mỗi khe (đơn vị = chỉ số trong profile).
 *
 * SỬA so với bản nháp: FLUSH khe cuối. Nếu profile kết thúc trong một run trũng
 * ≥ minGap (ảnh có lề phải/đáy trắng — rất hay gặp ở slide), bản cũ bỏ sót ranh
 * giới cuối vì chỉ push ở nhánh `else`. Ở đây push nốt sau vòng lặp.
 * Cũng thay Math.max(...p) (dễ tràn stack ở độ phân giải cao) bằng vòng lặp.
 */
export function findGaps(p: ArrayLike<number>, minGap = 6): number[] {
  let max = 0;
  for (let i = 0; i < p.length; i++) if (p[i] > max) max = p[i];
  if (max === 0) return [];
  const thr = max * 0.12;
  const gaps: number[] = [];
  let run = 0;
  for (let i = 0; i < p.length; i++) {
    if (p[i] < thr) {
      run++;
    } else {
      if (run >= minGap) gaps.push(i - run / 2);
      run = 0;
    }
  }
  // FLUSH: khe chạm mép cuối profile.
  if (run >= minGap) gaps.push(p.length - run / 2);
  return gaps;
}

/** Bản đồ cạnh (độ lớn gradient luminance) từ mảng luminance 0..1, kích thước W×H. */
export function edgeFromLum(lum: Float32Array, W: number, H: number): Float32Array {
  const edge = new Float32Array(W * H);
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      const gx = lum[i + 1] - lum[i - 1];
      const gy = lum[i + W] - lum[i - W];
      edge[i] = Math.hypot(gx, gy);
    }
  }
  return edge;
}

/** Chiếu tổng cạnh theo 2 trục → (col, row) profile. */
export function projectionProfiles(edge: Float32Array, W: number, H: number): {
  col: Float32Array;
  row: Float32Array;
} {
  const col = new Float32Array(W);
  const row = new Float32Array(H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const e = edge[y * W + x];
      col[x] += e;
      row[y] += e;
    }
  }
  return { col, row };
}

/**
 * Dựng ô lưới từ ranh giới cột/hàng. Ranh giới = TÂM các khe; biên ảnh (0 và W/H)
 * luôn là mép ngoài. Tích chéo → ô; đổi sang % sân khấu; lọc ô quá nhỏ (nhiễu).
 */
export function cellsFromCuts(
  cols: number[],
  rows: number[],
  W: number,
  H: number,
  minCellPct = 6,
): RegionCell[] {
  const xs = [0, ...cols, W].sort((a, b) => a - b);
  const ys = [0, ...rows, H].sort((a, b) => a - b);
  const cells: RegionCell[] = [];
  for (let r = 0; r < ys.length - 1; r++) {
    for (let c = 0; c < xs.length - 1; c++) {
      const x = (xs[c] / W) * 100;
      const y = (ys[r] / H) * 100;
      const w = ((xs[c + 1] - xs[c]) / W) * 100;
      const h = ((ys[r + 1] - ys[r]) / H) * 100;
      if (w >= minCellPct && h >= minCellPct) cells.push({ x, y, w, h });
    }
  }
  return cells;
}

/** Tiện: ô lưới → model.Frame (thêm rotation:0). Không import model để giữ tầng thấp sạch. */
export function cellToFrame(cell: RegionCell): RegionCell & { rotation: number } {
  return { ...cell, rotation: 0 };
}

/* ------------------------------ WRAPPER DOM ------------------------------ */

export class DetectRegionsError extends Error {
  constructor(public code: 'BAD_IMAGE' | 'TAINTED') {
    super(code);
    this.name = 'DetectRegionsError';
  }
}

/**
 * Ảnh (ĐÃ load) → lưới. LƯU Ý CORS: hàm này gọi getImageData; nếu `img` cross-origin
 * mà không CORS-clean sẽ ném DetectRegionsError('TAINTED'). Hãy load ảnh với
 * `img.crossOrigin = 'anonymous'` (như loadImg trong analyze-refs.ts).
 */
export function detectRegions(img: HTMLImageElement): DetectResult {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) throw new DetectRegionsError('BAD_IMAGE');

  const W = DOWNSCALE_W;
  const H = Math.max(1, Math.round((DOWNSCALE_W * ih) / iw));
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, W, H);

  let px: Uint8ClampedArray;
  try {
    px = ctx.getImageData(0, 0, W, H).data;
  } catch {
    throw new DetectRegionsError('TAINTED');
  }

  const lum = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) {
    lum[i] = (0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2]) / 255;
  }

  const edge = edgeFromLum(lum, W, H);
  const { col, row } = projectionProfiles(edge, W, H);
  const cols = findGaps(col);
  const rows = findGaps(row);
  const cells = cellsFromCuts(cols, rows, W, H);
  return { cols, rows, cells, W, H };
}
