/**
 * lib/server/library-save.ts — CỬA GHI THẬT DUY NHẤT cho `LibraryAsset` (tách ra khỏi
 * `app/api/library/route.ts` 19/08, phiếu CONNECT-1) — để `POST /api/library` (nhận dataUrl
 * client tự encode) VÀ `POST /api/library/from-url` (server tự tải ảnh từ URL ngoài — Unsplash/
 * Openverse/link dán) cùng đi qua ĐÚNG MỘT hàm ghi DB, không chế cú pháp lưu thứ hai.
 *
 * Giữ nguyên hành vi gốc của route cũ: whitelist MIME đọc MAGIC BYTES thật (không tin nhãn client
 * khai — §6.2 `docs/AUDIT-BACKEND-2026-08-03.md`), trần 25MB, thư mục `./uploads`.
 *
 * ══ ĐỔI 20/08 (LANE B) — SERVER TỰ NHÌN VÀO TỆP, THÔI TIN LỜI CLIENT ═════════════════════════
 * Trước: `w`/`h`/`palette` lấy NGUYÊN từ tham số caller — tức từ con số client tự đo bằng canvas.
 * Client khai sai (hoặc không khai) thì DB sai theo, và không ai biết.
 * Nay: cả `w`/`h`/`palette` LẪN `contentHash` do **`trichSieuDuLieu()`** (`asset-metadata.ts`)
 * đọc thẳng từ buffer. Giá trị client gửi tụt xuống **đường lùi**, chỉ dùng khi trích thất bại.
 * ⇒ Cùng MỘT cửa trích với `promote.ts` — hết cảnh hai cửa ghi cho ra hai chất lượng bản ghi.
 */
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { prisma } from './db';
import { imgIdFromKey } from '../img-id';
import { sniffKind, isRasterImageKind, SNIFFED_MIME } from './mime-sniff';
import { trichSieuDuLieu, dungBanGhiLibraryAsset } from './asset-metadata';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
export const LIBRARY_USAGES = ['ref-render', 'slide', 'material', 'layout', 'cad', 'brief', 'furniture'];
export const LIBRARY_MAX_BYTES = 25 * 1024 * 1024;

export interface SaveLibraryAssetInput {
  userId: string;
  name: string;
  category: string;
  tags?: string;
  buf: Buffer;
  usage?: string;
  palette?: unknown;
  caption?: string;
  content?: string;
  w?: number;
  h?: number;
}

export type SaveLibraryAssetResult =
  | { ok: true; id: string; imgId: string; url: string }
  | { ok: false; error: string; status: number };

/** Sniff + ghi file vào `./uploads` + tạo bản ghi `LibraryAsset`. KHÔNG kiểm quyền — caller lo. */
export async function saveLibraryAssetFromBuffer(input: SaveLibraryAssetInput): Promise<SaveLibraryAssetResult> {
  if (input.buf.length > LIBRARY_MAX_BYTES) {
    return { ok: false, error: 'File quá 25MB.', status: 413 };
  }
  const kind = sniffKind(input.buf);
  if (!isRasterImageKind(kind)) {
    return {
      ok: false,
      error: 'Loại file không được phép — Thư viện chỉ nhận ảnh (PNG/JPEG/WEBP/GIF/AVIF).',
      status: 400,
    };
  }
  const mime = SNIFFED_MIME[kind];
  await mkdir(UPLOAD_DIR, { recursive: true });
  const ext = mime.split('/')[1]?.replace(/[^a-z0-9]/gi, '') || 'bin';
  const filename = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  await writeFile(path.join(UPLOAD_DIR, filename), input.buf);

  // Trích TRƯỚC khi ghi, và không để nó làm hỏng lượt lưu: `trichSieuDuLieu` đã nuốt lỗi sharp
  // bên trong và trả `ghiChu`, nhưng bọc thêm một lớp cho ca ngoài dự kiến — mất siêu dữ liệu là
  // bản ghi nghèo, mất cả tệp vừa upload mới là hỏng việc.
  const meta = await trichSieuDuLieu(input.buf).catch(() => null);

  const asset = await prisma.libraryAsset.create({
    data: dungBanGhiLibraryAsset({
      userId: input.userId,
      name: input.name,
      category: input.category,
      tags: input.tags,
      mime,
      path: filename,
      usage: LIBRARY_USAGES.includes(input.usage ?? '') ? (input.usage as string) : 'ref-render',
      caption: input.caption,
      content: input.content,
      meta,
      wDuPhong: input.w,
      hDuPhong: input.h,
      paletteDuPhong: input.palette,
    }),
  });
  return { ok: true, id: asset.id, imgId: imgIdFromKey(asset.id), url: `/api/library/${asset.id}/file` };
}
