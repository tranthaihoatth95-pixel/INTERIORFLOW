/**
 * lib/server/comment-artifact.ts — IF-SECURE-ARTIFACT-DELIVERY-001.
 *
 * VẤN ĐỀ ĐO ĐƯỢC (không phải suy đoán): `app/api/comments/route.ts` cũ ghi ảnh đính kèm góp ý
 * vào `public/comments-images/` rồi trả URL `/comments-images/<id>.<ext>`. Đường đó là
 * PUBLIC-ASSET — Next phục vụ tĩnh, KHÔNG qua `getSessionUser()`. Trong khi chính siêu dữ liệu
 * góp ý (`comments-review.json`) lại đứng sau 401. Ảnh và chữ của cùng một góp ý được xếp hạng
 * hai mức bảo mật khác nhau. Ảnh là PROJECT-PRIVATE bị phục vụ như PUBLIC-ASSET.
 *
 * Còn một lỗi thứ hai đi kèm: trong Electron đóng gói, `process.cwd()` = `app.getPath('userData')`
 * (xem `electron/main.js`), nên `public/comments-images/` được ghi ở nơi Next KHÔNG hề phục vụ
 * tĩnh. Nghĩa là tính năng này ĐÃ HỎNG SẴN trong bản đóng gói: ghi được, đọc không ra. Một route
 * đọc có xác thực vá cả hai — lỗ rò VÀ chỗ hỏng.
 *
 * LUẬT Ở ĐÂY
 *  - Phân loại theo BẰNG CHỨNG, không theo đường dẫn: bytes chỉ rời máy chủ sau khi có phiên.
 *  - MIGRATION ADDITIVE: ghi mới vào thư mục riêng; đọc vẫn ngã về đường cũ nếu file còn ở đó.
 *    KHÔNG di chuyển, KHÔNG xoá, KHÔNG viết lại hàng loạt.
 *  - Có cờ lùi: `IF_COMMENT_IMAGE_PUBLIC=1` trả lại hành vi cũ nguyên vẹn.
 *
 * Import TƯƠNG ĐỐI cho `mime-sniff` để test chạy thẳng qua sucrase-node (cùng quy ước file đó).
 */

import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { sniffKind, SNIFFED_MIME, isRasterImageKind, type SniffedKind } from './mime-sniff';

/** Thư mục RIÊNG — cùng gốc `uploads/` mà `asset-metadata.ts:43` đã dùng, Next không phục vụ tĩnh. */
export const COMMENT_IMAGE_DIR = path.join(process.cwd(), 'uploads', 'comment-images');

/** Đường CŨ, chỉ còn dùng để ĐỌC (tương thích ngược). Không bao giờ ghi mới vào đây khi cờ tắt. */
export const LEGACY_PUBLIC_DIR = path.join(process.cwd(), 'public', 'comments-images');

/** `true` = quay về hành vi cũ (ghi ra `public/`). Cờ lùi, mặc định TẮT. */
export function chePublicCu(): boolean {
  return process.env.IF_COMMENT_IMAGE_PUBLIC === '1';
}

const EXT_OF: Record<string, string> = { png: 'png', jpeg: 'jpg', gif: 'gif', webp: 'webp', avif: 'avif' };

/**
 * ID góp ý do server sinh: `c_<base36>_<4 ký tự>` (`app/api/comments/route.ts`). Chỉ nhận đúng
 * bộ chữ đó — chặn `..`, `/`, NUL ngay từ hình dạng, trước khi chạm hệ tệp.
 */
export function idGopYAnToan(id: string): boolean {
  return /^c_[a-z0-9]{1,24}_[a-z0-9]{1,12}$/.test(id);
}

export interface AnhDaLuu {
  /** URL để hiển thị lại — nay là route CÓ XÁC THỰC, không phải file tĩnh. */
  url: string;
  /** Định danh bền của artifact = chính id góp ý (một góp ý một ảnh). */
  artifactId: string;
  /** sha256 của bytes gốc — để đối chiếu về sau, phát hiện file bị thay/hỏng. */
  sha256: string;
  bytes: number;
  kind: SniffedKind;
}

/**
 * Giải mã data URL → KIỂM BẰNG MAGIC BYTES (không tin nhãn `data:image/...` client khai) → ghi
 * vào thư mục riêng. Trả `undefined` nếu không phải ảnh raster nhận diện được.
 */
export async function luuAnhGopY(id: string, dataUrl: string): Promise<AnhDaLuu | undefined> {
  if (!idGopYAnToan(id)) return undefined;
  const m = /^data:image\/[a-z+.-]+;base64,(.+)$/i.exec(dataUrl);
  if (!m) return undefined;
  const buf = Buffer.from(m[1], 'base64');
  if (buf.length === 0) return undefined;

  // Nhãn client nói gì không quan trọng — byte đầu file mới quyết.
  const kind = sniffKind(buf);
  if (!kind || !isRasterImageKind(kind) || !EXT_OF[kind]) return undefined;

  const dir = chePublicCu() ? LEGACY_PUBLIC_DIR : COMMENT_IMAGE_DIR;
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, `${id}.${EXT_OF[kind]}`), buf);

  return {
    url: chePublicCu() ? `/comments-images/${id}.${EXT_OF[kind]}` : `/api/comments/image/${id}`,
    artifactId: id,
    sha256: crypto.createHash('sha256').update(buf).digest('hex'),
    bytes: buf.length,
    kind,
  };
}

export interface AnhDocDuoc {
  buf: Buffer;
  mime: string;
  /** `true` = file lấy từ đường CŨ `public/` — dữ liệu di sản, vẫn phục vụ, không di chuyển. */
  legacy: boolean;
}

/**
 * Đọc ảnh theo id. Thử thư mục RIÊNG trước, rồi ngã về đường CŨ. Chỉ trả bytes khi sniff lại
 * xác nhận vẫn là ảnh raster — file trên đĩa có thể đã bị thay sau khi ghi.
 */
export async function docAnhGopY(id: string): Promise<AnhDocDuoc | null> {
  if (!idGopYAnToan(id)) return null;
  for (const [dir, legacy] of [
    [COMMENT_IMAGE_DIR, false],
    [LEGACY_PUBLIC_DIR, true],
  ] as [string, boolean][]) {
    for (const ext of ['png', 'jpg', 'gif', 'webp', 'avif']) {
      const p = path.join(dir, `${id}.${ext}`);
      // Chốt chặn thứ hai (sau `idGopYAnToan`): đường giải xong phải vẫn nằm TRONG thư mục.
      if (path.resolve(p) !== path.join(dir, path.basename(p))) continue;
      let buf: Buffer;
      try {
        buf = await fs.readFile(p);
      } catch {
        continue;
      }
      const kind = sniffKind(buf);
      if (!kind || !isRasterImageKind(kind)) return null;
      return { buf, mime: SNIFFED_MIME[kind], legacy };
    }
  }
  return null;
}
