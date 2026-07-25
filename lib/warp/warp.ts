/**
 * Perspective warp thuần canvas 2D — biến ảnh chữ nhật thành tứ giác 4 góc bất kỳ.
 * Dùng để dán pattern / giấy dán tường lên mặt VÁCH NGHIÊNG trong ảnh phối cảnh:
 * app trước đây không có transform phối cảnh nào (chỉ crop/composite theo trục), nên có
 * pattern mà không dán được lên tường xiên.
 *
 * Vì sao tự cài thay vì `matrix3d` CSS: cần OUTPUT là ảnh (data-URI) để nối vào
 * `util.composite` / `ai.materialswap`, mà CSS transform không đọc ra pixel được.
 *
 * Cách làm: chia ảnh nguồn thành lưới N×N ô, mỗi ô map sang tứ giác đích tương ứng
 * (bilinear trên tứ giác đích), rồi vẽ từng ô bằng 2 tam giác affine + clip. Với lưới đủ mịn
 * (mặc định 24) sai số dưới 1px ở kích thước ảnh nội thất thường dùng — không cần
 * homography chính xác từng pixel, và chạy tức thì client-side (0 credit).
 *
 * KHÔNG phụ thuộc DOM ở phần toán (chia lưới / nội suy) → test được bằng sucrase-node.
 */

export interface Pt {
  /** toạ độ theo TỈ LỆ 0–1 của khung đích (ảnh nền), không phải pixel */
  x: number;
  y: number;
}

/** 4 góc theo thứ tự: trên-trái, trên-phải, dưới-phải, dưới-trái. */
export type Corners = [Pt, Pt, Pt, Pt];

export const DEFAULT_CORNERS: Corners = [
  { x: 0.15, y: 0.2 },
  { x: 0.85, y: 0.12 },
  { x: 0.85, y: 0.82 },
  { x: 0.15, y: 0.9 },
];

/** Đọc param corners (JSON) — sai/thiếu thì trả mặc định, không bao giờ throw. */
export function parseCorners(raw: unknown): Corners {
  if (typeof raw !== 'string' || !raw.trim()) return DEFAULT_CORNERS;
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr) || arr.length !== 4) return DEFAULT_CORNERS;
    const pts = arr.map((p) => ({ x: Number(p?.x), y: Number(p?.y) }));
    if (pts.some((p) => !Number.isFinite(p.x) || !Number.isFinite(p.y))) return DEFAULT_CORNERS;
    return pts as Corners;
  } catch {
    return DEFAULT_CORNERS;
  }
}

export function serializeCorners(c: Corners): string {
  return JSON.stringify(c.map((p) => ({ x: round4(p.x), y: round4(p.y) })));
}

function round4(n: number): number {
  return Math.round(n * 1e4) / 1e4;
}

/**
 * Nội suy bilinear trong tứ giác: (u,v) ∈ [0,1]² → điểm trong tứ giác corners.
 * u chạy theo cạnh trên (TL→TR), v chạy xuống (cạnh trên → cạnh dưới).
 */
export function quadPoint(corners: Corners, u: number, v: number): Pt {
  const [tl, tr, br, bl] = corners;
  const top = { x: tl.x + (tr.x - tl.x) * u, y: tl.y + (tr.y - tl.y) * u };
  const bottom = { x: bl.x + (br.x - bl.x) * u, y: bl.y + (br.y - bl.y) * u };
  return { x: top.x + (bottom.x - top.x) * v, y: top.y + (bottom.y - top.y) * v };
}

/** Bao chữ nhật của tứ giác (theo tỉ lệ) — dùng để tính khung ảnh output khi không có ảnh nền. */
export function quadBounds(corners: Corners) {
  const xs = corners.map((p) => p.x);
  const ys = corners.map((p) => p.y);
  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  };
}

export interface WarpOptions {
  /** kích thước canvas output (px). Thường = kích thước ảnh phối cảnh nền. */
  width: number;
  height: number;
  /** số ô mỗi chiều của lưới xấp xỉ — cao hơn = mịn hơn, chậm hơn. */
  grid?: number;
  /** độ mờ 0–1 khi vẽ (giữ nguyên 1 nếu muốn dán đặc) */
  opacity?: number;
}

/**
 * Warp ảnh `img` vào tứ giác `corners` trên canvas trong suốt `width×height`.
 * Vùng ngoài tứ giác để TRONG SUỐT → nối thẳng vào `util.composite` để dán lên phối cảnh.
 */
export function warpImageToCanvas(
  img: CanvasImageSource & { width?: number; height?: number },
  corners: Corners,
  opt: WarpOptions,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(opt.width));
  canvas.height = Math.max(1, Math.round(opt.height));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Không tạo được canvas.');

  const sw =
    (img as HTMLImageElement).naturalWidth || Number(img.width) || canvas.width;
  const sh =
    (img as HTMLImageElement).naturalHeight || Number(img.height) || canvas.height;

  const n = Math.max(2, Math.min(64, Math.round(opt.grid ?? 24)));
  ctx.globalAlpha = Math.max(0, Math.min(1, opt.opacity ?? 1));
  // nội suy chất lượng cao: pattern in giấy dán tường cần cạnh sạch
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const u0 = i / n;
      const u1 = (i + 1) / n;
      const v0 = j / n;
      const v1 = (j + 1) / n;

      // ô nguồn (pixel ảnh gốc) — nới 0.5px mỗi bên để không hở đường chỉ giữa các ô
      const sx = u0 * sw;
      const sy = v0 * sh;
      const sWidth = (u1 - u0) * sw;
      const sHeight = (v1 - v0) * sh;

      // 4 góc ô đích (pixel canvas)
      const p00 = toPx(quadPoint(corners, u0, v0), canvas);
      const p10 = toPx(quadPoint(corners, u1, v0), canvas);
      const p11 = toPx(quadPoint(corners, u1, v1), canvas);
      const p01 = toPx(quadPoint(corners, u0, v1), canvas);

      drawTriangle(ctx, img, [p00, p10, p11], [[sx, sy], [sx + sWidth, sy], [sx + sWidth, sy + sHeight]]);
      drawTriangle(ctx, img, [p00, p11, p01], [[sx, sy], [sx + sWidth, sy + sHeight], [sx, sy + sHeight]]);
    }
  }
  ctx.globalAlpha = 1;
  return canvas;
}

function toPx(p: Pt, canvas: HTMLCanvasElement): [number, number] {
  return [p.x * canvas.width, p.y * canvas.height];
}

/**
 * Vẽ 1 tam giác ảnh: clip theo tam giác đích rồi áp affine transform khớp 3 đỉnh
 * (nguồn → đích). 2 tam giác/ô ghép lại xấp xỉ được biến dạng phối cảnh.
 */
function drawTriangle(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  dst: [number, number][],
  src: [number, number][],
) {
  const [[x0, y0], [x1, y1], [x2, y2]] = dst;
  const [[u0, v0], [u1, v1], [u2, v2]] = src;

  const den = u0 * (v2 - v1) - u1 * v2 + u2 * v1 + (u1 - u2) * v0;
  if (!den) return; // tam giác nguồn suy biến — bỏ qua ô này

  const a = -(v0 * (x2 - x1) - v1 * x2 + v2 * x1 + (v1 - v2) * x0) / den;
  const b = (v1 * y2 + v0 * (y1 - y2) - v2 * y1 + (v2 - v1) * y0) / den;
  const c = (u0 * (x2 - x1) - u1 * x2 + u2 * x1 + (u1 - u2) * x0) / den;
  const d = -(u1 * y2 + u0 * (y1 - y2) - u2 * y1 + (u2 - u1) * y0) / den;
  const e =
    (u0 * (v2 * x1 - v1 * x2) + v0 * (u1 * x2 - u2 * x1) + (u2 * v1 - u1 * v2) * x0) / den;
  const f =
    (u0 * (v2 * y1 - v1 * y2) + v0 * (u1 * y2 - u2 * y1) + (u2 * v1 - u1 * v2) * y0) / den;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.closePath();
  // nở clip ~0.4px để 2 ô cạnh nhau không để lộ đường chỉ do anti-alias
  ctx.clip();
  ctx.transform(a, b, c, d, e, f);
  ctx.drawImage(img, 0, 0);
  ctx.restore();
}
