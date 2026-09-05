/**
 * lib/vision/decode-server.ts — GIẢI MÃ ẢNH PHÍA SERVER → `RgbaImage` cho lib/vision (CHỈ import ở
 * API route / Node). Dùng `sharp` (đã là dependency của dự án, MIT), KHÔNG thêm decoder mới.
 *
 * Nhận: data-URI (`data:image/…;base64,…`) hoặc URL http(s) công khai. Từ chối host nội bộ/riêng
 * (SSRF) và ảnh quá lớn. Thu về cạnh dài ≤ `maxSide` (đo pixel không cần full-res; median-cut và
 * điểm tụ đều sample) — kích thước trả về là kích thước SAU thu, caller ghi vào spec cho đúng.
 */
import sharp from 'sharp';
import type { RgbaImage } from './single-view-metrology';

export const DECODE_MAX_SIDE = 640;
export const DECODE_MAX_BYTES = 25 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 15000;

export class ImageDecodeError extends Error {}

/** Chặn host nội bộ/riêng — không cho route fetch hộ vào mạng nội bộ. */
export function isPrivateHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (h === 'localhost' || h.endsWith('.localhost') || h === '0.0.0.0' || h === '::1' || h === '::') return true;
  const m = h.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    return false;
  }
  if (h.startsWith('fc') || h.startsWith('fd') || h.startsWith('fe80')) return true; // IPv6 ULA / link-local
  return false;
}

/** Chuỗi ảnh (data-URI | http(s) URL) → bytes. Lỗi ném `ImageDecodeError` chữ rõ. */
export async function imageBytes(src: string): Promise<Buffer> {
  const s = src.trim();
  if (s.startsWith('data:')) {
    const comma = s.indexOf(',');
    if (comma < 0) throw new ImageDecodeError('data-URI thiếu phần dữ liệu.');
    const meta = s.slice(5, comma);
    const body = s.slice(comma + 1);
    const buf = meta.includes(';base64') ? Buffer.from(body, 'base64') : Buffer.from(decodeURIComponent(body), 'utf8');
    if (buf.length === 0) throw new ImageDecodeError('data-URI rỗng.');
    if (buf.length > DECODE_MAX_BYTES) throw new ImageDecodeError(`Ảnh quá lớn (${(buf.length / 1048576).toFixed(1)} MB > 25 MB).`);
    return buf;
  }
  let url: URL;
  try {
    url = new URL(s);
  } catch {
    throw new ImageDecodeError('Ảnh phải là data-URI hoặc URL http(s) tuyệt đối.');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new ImageDecodeError('Chỉ nhận URL http(s).');
  if (isPrivateHost(url.hostname)) throw new ImageDecodeError('Không fetch hộ URL nội bộ/riêng.');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new ImageDecodeError(`Không tải được ảnh (HTTP ${res.status}).`);
    const len = Number(res.headers.get('content-length') ?? 0);
    if (len > DECODE_MAX_BYTES) throw new ImageDecodeError('Ảnh quá lớn (> 25 MB).');
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > DECODE_MAX_BYTES) throw new ImageDecodeError('Ảnh quá lớn (> 25 MB).');
    return buf;
  } catch (err) {
    if (err instanceof ImageDecodeError) throw err;
    throw new ImageDecodeError((err as Error)?.name === 'AbortError' ? 'Tải ảnh quá thời gian.' : 'Không tải được ảnh từ URL.');
  } finally {
    clearTimeout(timer);
  }
}

/** bytes → RGBA (đã xoay theo EXIF, thu về cạnh dài ≤ maxSide, luôn có alpha). */
export async function decodeToRgba(buf: Buffer, maxSide = DECODE_MAX_SIDE): Promise<RgbaImage> {
  let out: { data: Buffer; info: { width: number; height: number; channels: number } };
  try {
    out = await sharp(buf, { limitInputPixels: 80_000_000 })
      .rotate()
      .resize({ width: maxSide, height: maxSide, fit: 'inside', withoutEnlargement: true })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
  } catch (err) {
    throw new ImageDecodeError(`Không giải mã được ảnh (${err instanceof Error ? err.message.slice(0, 120) : 'lỗi sharp'}).`);
  }
  const { data, info } = out;
  if (info.channels !== 4) throw new ImageDecodeError(`Ảnh giải mã ra ${info.channels} kênh, cần RGBA.`);
  return { width: info.width, height: info.height, data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.length) };
}

/** Tiện: chuỗi ảnh → RgbaImage. */
export async function decodeImageSource(src: string, maxSide = DECODE_MAX_SIDE): Promise<RgbaImage> {
  return decodeToRgba(await imageBytes(src), maxSide);
}
