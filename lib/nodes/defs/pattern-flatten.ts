/**
 * "Dẹt" hoa văn thành stencil in được — hàm THUẦN SỐ (không DOM) nên test được bằng sucrase-node.
 *
 * VÌ SAO CẦN: đo thật trên fal `flux/dev/image-to-image` với ảnh mẫu là ẢNH CHỤP gạch Chăm
 * (có khối, có bóng): kể cả khi prompt nói "flat", strength 0.85 và negative chặn `relief/
 * cast shadow/bevel`, model VẪN trả phù điêu nổi — vì (a) FLUX bỏ qua negative_prompt và
 * (b) img2img bám theo shading của ảnh nguồn.
 *
 * → Không đấu tiếp bằng prompt. Sau khi có ảnh, POSTERIZE theo độ sáng thành 2–3 mức màu
 * phẳng do người dùng chọn: bóng đổ biến thành mảng màu, kết quả in giấy dán tường được thật.
 * Tất định, 0 credit, chạy client-side.
 */

/** '#c9bca8' | 'c9bca8' | '#ccc' → [r,g,b]; sai định dạng → null. */
export function parseHex(hex: string): [number, number, number] | null {
  const h = hex.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(h)) return null;
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

/** Palette mặc định khi người dùng không nhập màu: nền sáng + motif tối, trung tính. */
export const DEFAULT_STENCIL: [number, number, number][] = [
  [238, 233, 224],
  [92, 74, 58],
];

/**
 * Màu người dùng nhập → palette stencil (sáng → tối). Cần ≥2 màu; thiếu thì bù bằng mặc định.
 * Palette được SẮP theo độ sáng để mức sáng của ảnh map đúng (sáng ↔ màu sáng).
 */
export function stencilPalette(colors: (string | undefined)[]): [number, number, number][] {
  const parsed = colors
    .map((c) => (c ? parseHex(String(c)) : null))
    .filter((c): c is [number, number, number] => Boolean(c));
  const pal = parsed.length >= 2 ? parsed : [...DEFAULT_STENCIL];
  return pal.sort((a, b) => lum(b) - lum(a));
}

function lum(c: [number, number, number]): number {
  return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
}

/**
 * Posterize RGBA theo độ sáng vào `palette` (đã sắp sáng→tối). Ngưỡng chia đều theo số mức,
 * căn theo min/max độ sáng THỰC của ảnh (ảnh tone-on-tone dải sáng rất hẹp — chia cứng 0–255
 * sẽ ra một màu duy nhất, mất hẳn hoa văn).
 * Trả buffer MỚI, không sửa input.
 */
export function flattenToStencil(
  rgba: Uint8Array | Uint8ClampedArray,
  palette: [number, number, number][],
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(rgba.length);
  const n = Math.max(2, palette.length);
  const px = rgba.length / 4;

  let min = 255;
  let max = 0;
  for (let i = 0; i < px; i++) {
    const l = 0.299 * rgba[i * 4] + 0.587 * rgba[i * 4 + 1] + 0.114 * rgba[i * 4 + 2];
    if (l < min) min = l;
    if (l > max) max = l;
  }
  const span = Math.max(1, max - min);

  for (let i = 0; i < px; i++) {
    const p = i * 4;
    const l = 0.299 * rgba[p] + 0.587 * rgba[p + 1] + 0.114 * rgba[p + 2];
    const t = (l - min) / span; // 0 (tối) → 1 (sáng)
    // t=1 (sáng nhất) → palette[0]; t=0 → palette[n-1]
    let idx = Math.floor((1 - t) * n);
    if (idx >= n) idx = n - 1;
    if (idx < 0) idx = 0;
    const c = palette[idx];
    out[p] = c[0];
    out[p + 1] = c[1];
    out[p + 2] = c[2];
    out[p + 3] = 255;
  }
  return out;
}

/** Số màu riêng biệt trong buffer — dùng để test "đã phẳng thật" (≤ số mức palette). */
export function distinctColors(rgba: Uint8Array | Uint8ClampedArray): number {
  const set = new Set<number>();
  for (let i = 0; i < rgba.length; i += 4) {
    set.add((rgba[i] << 16) | (rgba[i + 1] << 8) | rgba[i + 2]);
  }
  return set.size;
}
