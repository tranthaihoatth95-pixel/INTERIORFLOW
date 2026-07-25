/**
 * Xử lý mask thuần số học — KHÔNG dùng DOM/canvas, nên test được bằng
 * `node_modules/.bin/sucrase-node lib/nodes/mask-ops.test.ts`.
 *
 * Dùng cho `ai.smartselect` (Smart Select): SAM 2 trả biên vật thể khá đúng nhưng
 * gần như không bao giờ đúng 100% ở mép — thực tế cần "nới/co biên" vài px để mask
 * phủ hết mép vách (inpaint bị hở mép sẽ để lại viền vật liệu cũ), và cần "đảo vùng chọn"
 * (chọn được cái vách rồi muốn tác động phần CÒN LẠI).
 *
 * Quy ước mask trong app: ảnh xám, TRẮNG = vùng tác động, ĐEN = giữ nguyên
 * (khớp `util.maskpainter` — xem save() trong components/MaskPainterModal.tsx).
 * Ở đây làm việc trên mảng alpha 1 byte/pixel (0–255) cho gọn và nhanh.
 */

/** Ngưỡng hoá RGBA → alpha mask. Ưu tiên kênh alpha (SAM trả PNG có nền trong suốt),
 *  không có alpha thì dùng độ sáng. */
export function rgbaToAlphaMask(rgba: Uint8Array | Uint8ClampedArray, threshold = 127): Uint8Array {
  const n = Math.floor(rgba.length / 4);
  const out = new Uint8Array(n);
  // Ảnh hoàn toàn đục → alpha vô nghĩa, phải xét độ sáng.
  let anyTransparent = false;
  for (let i = 0; i < n; i++) {
    if (rgba[i * 4 + 3] < 250) {
      anyTransparent = true;
      break;
    }
  }
  for (let i = 0; i < n; i++) {
    const p = i * 4;
    if (anyTransparent) {
      out[i] = rgba[p + 3] > threshold ? 255 : 0;
    } else {
      const lum = 0.299 * rgba[p] + 0.587 * rgba[p + 1] + 0.114 * rgba[p + 2];
      out[i] = lum > threshold ? 255 : 0;
    }
  }
  return out;
}

/** Đảo vùng chọn. */
export function invertMask(mask: Uint8Array): Uint8Array {
  const out = new Uint8Array(mask.length);
  for (let i = 0; i < mask.length; i++) out[i] = mask[i] > 127 ? 0 : 255;
  return out;
}

/**
 * Nới (radius > 0) / co (radius < 0) biên mask theo khoảng cách Chebyshev — morphological
 * dilate/erode bằng 2 lượt 1 chiều (ngang rồi dọc), O(w·h·r) nhưng tách chiều nên nhanh.
 * radius = 0 → trả bản sao nguyên vẹn.
 */
export function growMask(mask: Uint8Array, width: number, height: number, radius: number): Uint8Array {
  const r = Math.round(radius);
  if (!r) return new Uint8Array(mask);
  const dilate = r > 0;
  const rad = Math.abs(r);
  // dilate = lấy MAX trong cửa sổ; erode = lấy MIN
  const pick = dilate
    ? (a: number, b: number) => (a > b ? a : b)
    : (a: number, b: number) => (a < b ? a : b);
  const pass = (src: Uint8Array, horizontal: boolean): Uint8Array => {
    const out = new Uint8Array(src.length);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let v = src[y * width + x];
        for (let k = 1; k <= rad; k++) {
          if (horizontal) {
            const xa = x - k;
            const xb = x + k;
            // ngoài biên ảnh: coi như ĐEN (0) — mask không "chảy" ra ngoài khung
            v = pick(v, xa >= 0 ? src[y * width + xa] : 0);
            v = pick(v, xb < width ? src[y * width + xb] : 0);
          } else {
            const ya = y - k;
            const yb = y + k;
            v = pick(v, ya >= 0 ? src[ya * width + x] : 0);
            v = pick(v, yb < height ? src[yb * width + x] : 0);
          }
        }
        out[y * width + x] = v;
      }
    }
    return out;
  };
  return pass(pass(mask, true), false);
}

/** Hợp 2 mask (dùng khi người dùng tô thêm bằng brush lên mask SAM). */
export function unionMask(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length);
  for (let i = 0; i < a.length; i++) out[i] = a[i] > 127 || b[i] > 127 ? 255 : 0;
  return out;
}

/** Trừ mask b khỏi a (brush eraser). */
export function subtractMask(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length);
  for (let i = 0; i < a.length; i++) out[i] = a[i] > 127 && !(b[i] > 127) ? 255 : 0;
  return out;
}

/** Tỉ lệ diện tích được chọn (0–1) — dùng để cảnh báo "mask trống" / "chọn cả ảnh". */
export function maskCoverage(mask: Uint8Array): number {
  let on = 0;
  for (let i = 0; i < mask.length; i++) if (mask[i] > 127) on++;
  return mask.length ? on / mask.length : 0;
}

/** alpha mask → RGBA xám (trắng = chọn) để vẽ ra canvas / export PNG. */
export function alphaMaskToRgba(mask: Uint8Array): Uint8ClampedArray {
  const out = new Uint8ClampedArray(mask.length * 4);
  for (let i = 0; i < mask.length; i++) {
    const v = mask[i] > 127 ? 255 : 0;
    out[i * 4] = v;
    out[i * 4 + 1] = v;
    out[i * 4 + 2] = v;
    out[i * 4 + 3] = 255;
  }
  return out;
}
