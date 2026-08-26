/**
 * app/api/project-files/_lib/luu-file.ts — LỚP GHI FILE VẬT LÝ cho `ProjectFile`.
 *
 * ⭐ VÌ SAO KHÔNG GỌI `saveLibraryAssetFromBuffer` (lib/server/library-save.ts) — ba lý do ĐO
 * ĐƯỢC, không phải "thích viết lại" ([Đ2] nhìn-vào-trong-trước đã làm, kết luận là KHÔNG dùng
 * được, chứ không phải chưa tìm):
 *   ① Hàm đó **tạo bản ghi `LibraryAsset`** ngay trong thân nó. `ProjectFile` là bảng KHÁC và ở
 *      GIAI ĐOẠN KHÁC của dòng chảy (`docs/IF-KIEN-TRUC.md` §5: Files = thô, chưa đủ định nghĩa;
 *      LibraryAsset = đã hiểu). Gọi nó ở đây là **tạo LibraryAsset trước khi Promote** — phá
 *      thẳng contract Hoà chốt.
 *   ② Nó `isRasterImageKind()` ⇒ **từ chối PDF**. Mà PDF (đề bài/hồ sơ) là đúng một trong hai ca
 *      chính của ngăn thô (`usage: 'brief'`).
 *   ③ Nó không trả `contentHash`, và `ProjectFile.contentHash` là cột có thật phải điền.
 *
 * ⇒ Thứ **ĐƯỢC REUSE** ở đây là phần dùng lại được thật, và reuse nguyên: cùng `UPLOAD_DIR`
 * `./uploads` · cùng trần `LIBRARY_MAX_BYTES` 25MB · cùng `sniffKind`/`SNIFFED_MIME` (đọc MAGIC
 * BYTES, **không tin nhãn MIME client khai** — §6.2 `docs/AUDIT-BACKEND-2026-08-03.md`) · cùng
 * khuôn tên file. **KHÔNG đẻ thư mục lưu thứ hai.**
 *
 * ⚠️ GIỚI HẠN KHAI THẲNG — v0 chỉ nhận thứ `sniffKind` nhận ra: PNG/JPEG/WEBP/GIF/AVIF/PDF.
 * DWG/DXF/XLSX/DOCX **chưa nhận được**, vì mở cửa cho chúng là một quyết định AN TOÀN (nới
 * whitelist magic-bytes, hoặc chấp nhận binary không nhận diện được) — không phải việc làm lén
 * trong một phiếu về ProjectFile. Ai cần: nới `lib/server/mime-sniff.ts` bằng một phiếu riêng.
 *
 * Import RELATIVE (không `@/`) — bộ chạy test của repo là `sucrase-node`, nó KHÔNG đọc `paths`
 * của tsconfig (xem `app/files/_lib/ngan-tho.ts` cùng quy ước).
 */
import { createHash } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { sniffKind, SNIFFED_MIME } from '../../../../lib/server/mime-sniff';
import { LIBRARY_MAX_BYTES } from '../../../../lib/server/library-save';

/** Cùng thư mục với `library-save.ts` — CỐ Ý, không đẻ kho thứ hai. */
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

export { LIBRARY_MAX_BYTES as PROJECT_FILE_MAX_BYTES };

export type DocFileResult =
  | { ok: true; buf: Buffer }
  | { ok: false; error: string; status: number };

/**
 * Bóc `data:` URL ra Buffer. Thuần, không I/O — test được.
 * KHÔNG tin phần `;base64` khai trong URL để suy MIME: MIME thật do `sniffKind` quyết ở bước sau.
 */
export function docDataUrl(dataUrl: string): DocFileResult {
  const m = /^data:([^;,]*)(;base64)?,/.exec(dataUrl);
  if (!m) return { ok: false, error: 'dataUrl không đúng định dạng `data:…`.', status: 400 };
  const body = dataUrl.slice(m[0].length);
  let buf: Buffer;
  try {
    buf = m[2] ? Buffer.from(body, 'base64') : Buffer.from(decodeURIComponent(body), 'utf8');
  } catch {
    return { ok: false, error: 'Không giải mã được nội dung dataUrl.', status: 400 };
  }
  if (buf.length === 0) return { ok: false, error: 'Nội dung rỗng.', status: 400 };
  if (buf.length > LIBRARY_MAX_BYTES)
    return { ok: false, error: 'File quá 25MB.', status: 413 };
  return { ok: true, buf };
}

/** sha256 hex của nội dung — nguồn của `ProjectFile.contentHash`. Thuần, tất định. */
export function bamContentHash(buf: Buffer): string {
  return createHash('sha256').update(buf).digest('hex');
}

export type LuuFileResult =
  | { ok: true; path: string; mime: string; contentHash: string; bytes: number }
  | { ok: false; error: string; status: number };

/**
 * Sniff MIME thật → ghi file vào `./uploads` → trả metadata để caller ghi bản ghi `ProjectFile`.
 * KHÔNG chạm DB (caller lo) — tách để `promote.ts` và test dùng lại được phần thuần.
 */
export async function luuProjectFile(buf: Buffer): Promise<LuuFileResult> {
  if (buf.length > LIBRARY_MAX_BYTES) return { ok: false, error: 'File quá 25MB.', status: 413 };
  const kind = sniffKind(buf);
  if (!kind) {
    return {
      ok: false,
      error:
        'Loại file chưa nhận được — v0 chỉ nhận PNG/JPEG/WEBP/GIF/AVIF/PDF. ' +
        '(DWG/DXF/XLSX cần nới lib/server/mime-sniff.ts bằng một phiếu riêng.)',
      status: 415,
    };
  }
  const mime = SNIFFED_MIME[kind];
  await mkdir(UPLOAD_DIR, { recursive: true });
  const ext = mime.split('/')[1]?.replace(/[^a-z0-9]/gi, '') || 'bin';
  const filename = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  await writeFile(path.join(UPLOAD_DIR, filename), buf);
  return { ok: true, path: filename, mime, contentHash: bamContentHash(buf), bytes: buf.length };
}
