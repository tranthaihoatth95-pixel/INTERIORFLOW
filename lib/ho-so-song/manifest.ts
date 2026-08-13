/**
 * lib/ho-so-song/manifest.ts — dựng manifest + checksum cho Gói Hồ Sơ Sống.
 *
 * SHA-256 qua WebCrypto (`globalThis.crypto.subtle`) — cùng tiền lệ
 * `lib/present-editor/upscale-cache.ts` (chạy được cả browser lẫn node ≥ 20, không dep mới).
 * Mọi hàm THUẦN: không Date.now, không DOM — caller cấp `taoLuc` (test tất định).
 * MARKER: HoSoSong.
 */

import type {
  HoSoSongBinary,
  HoSoSongKenh,
  HoSoSongLoaiKenh,
  HoSoSongManifest,
} from './types';

/** Chuẩn hoá mọi dạng nhị phân/chuỗi về Uint8Array — điểm quy đổi DUY NHẤT của gói. */
export async function toBytes(data: HoSoSongBinary | string): Promise<Uint8Array> {
  if (typeof data === 'string') return new TextEncoder().encode(data);
  if (data instanceof Uint8Array) return data;
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  // Blob — browser và node ≥ 18 đều có arrayBuffer().
  return new Uint8Array(await data.arrayBuffer());
}

/** SHA-256 hex của một mảng byte. */
export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  // Copy sang ArrayBuffer "sạch" — né quirk kiểu ArrayBufferLike/SharedArrayBuffer của lib.dom
  // TS mới (cùng lý do ép kiểu ở BoqScreen.tsx#exportXlsx).
  const buf = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buf).set(bytes);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Dựng một entry kênh — sha256 tính từ ĐÚNG byte sẽ ghi vào zip. */
export async function taoKenh(
  id: string,
  loai: HoSoSongLoaiKenh,
  path: string,
  mime: string,
  bytes: Uint8Array,
): Promise<HoSoSongKenh> {
  return { id, loai, path, mime, sha256: await sha256Hex(bytes) };
}

/** Suy mime ảnh từ đuôi tên file — chỉ các loại gói này thật sự dùng, lạ thì octet-stream. */
export function mimeAnh(name: string): string {
  const ext = name.slice(name.lastIndexOf('.') + 1).toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'webp') return 'image/webp';
  return 'application/octet-stream';
}

export function taoManifest(opts: {
  projectId: string;
  tenDuAn: string;
  taoLuc: string;
  kenh: HoSoSongKenh[];
  soBan: number;
  nguoiXuat?: string;
}): HoSoSongManifest {
  return {
    version: 1,
    projectId: opts.projectId,
    tenDuAn: opts.tenDuAn,
    taoLuc: opts.taoLuc,
    kenh: opts.kenh,
    provenance: {
      nguon: 'interiorflow',
      soBan: opts.soBan,
      ...(opts.nguoiXuat ? { nguoiXuat: opts.nguoiXuat } : {}),
    },
  };
}
