/**
 * lib/server/library-save.ts — CỬA GHI THẬT DUY NHẤT cho `LibraryAsset` (tách ra khỏi
 * `app/api/library/route.ts` 19/08, phiếu CONNECT-1) — để `POST /api/library` (nhận dataUrl
 * client tự encode) VÀ `POST /api/library/from-url` (server tự tải ảnh từ URL ngoài — Unsplash/
 * Openverse/link dán) cùng đi qua ĐÚNG MỘT hàm ghi DB, không chế cú pháp lưu thứ hai.
 *
 * Giữ nguyên hành vi gốc của route cũ: whitelist MIME đọc MAGIC BYTES thật (không tin nhãn client
 * khai — §6.2 `docs/AUDIT-BACKEND-2026-08-03.md`), trần 25MB, thư mục `./uploads`.
 */
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { prisma } from './db';
import { imgIdFromKey } from '../img-id';
import { sniffKind, isRasterImageKind, SNIFFED_MIME } from './mime-sniff';

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
  const asset = await prisma.libraryAsset.create({
    data: {
      userId: input.userId,
      name: String(input.name).slice(0, 120),
      category: String(input.category),
      tags: String(input.tags ?? ''),
      mime,
      path: filename,
      usage: LIBRARY_USAGES.includes(input.usage ?? '') ? (input.usage as string) : 'ref-render',
      palette: Array.isArray(input.palette) ? JSON.stringify(input.palette.slice(0, 8)) : '',
      caption: typeof input.caption === 'string' ? input.caption.slice(0, 400) : '',
      content: typeof input.content === 'string' ? input.content.slice(0, 20000) : null,
      w: Number.isFinite(input.w) ? Math.round(input.w as number) : 0,
      h: Number.isFinite(input.h) ? Math.round(input.h as number) : 0,
      lastEditedBy: input.userId,
    },
  });
  return { ok: true, id: asset.id, imgId: imgIdFromKey(asset.id), url: `/api/library/${asset.id}/file` };
}
