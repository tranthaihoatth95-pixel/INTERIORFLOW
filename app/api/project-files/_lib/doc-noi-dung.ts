/**
 * app/api/project-files/_lib/doc-noi-dung.ts — LÕI của `GET /api/project-files/[id]/file`.
 *
 * ⭐ [Đ2] NHÌN VÀO TRONG TRƯỚC — khuôn gốc là `app/api/library/[id]/file/route.ts` (route phục vụ
 * nội dung cho `LibraryAsset`, live từ §6.2 audit backend). Route mới **theo đúng nó**:
 *   · đọc từ CÙNG kho `./uploads` (không đẻ thư mục thứ hai)
 *   · **sniff lại magic-bytes MỖI LẦN TRẢ**, KHÔNG tin cột `mime` trong DB (cột đó có thể là dữ
 *     liệu từ trước khi vá whitelist) — ép Content-Type về whitelist
 *   · `X-Content-Type-Options: nosniff` luôn có · `Cache-Control: private, max-age=86400`
 *   · thứ KHÔNG phải ảnh raster (PDF, hoặc byte lạ lọt qua từ xưa) ⇒ `attachment` + tên file đã
 *     làm sạch — mặc định an toàn nhất, không đoán
 *   · file mất trên đĩa ⇒ **410**, không phải 404 và không phải 500
 *
 * KHÁC khuôn gốc đúng HAI CHỖ, cả hai đều có lý do đo được:
 *   ① **Quyền theo DỰ ÁN, không theo người tạo.** `LibraryAsset` là vật dùng-lại-được ở tầng
 *      Thư viện; `ProjectFile` **thuộc ĐÚNG MỘT project** (`docs/IF-KIEN-TRUC.md` §5) ⇒ phải đi
 *      qua `assertProjectAccess(userId, projectId, 'viewer')` — CÙNG cửa mà `GET
 *      /api/project-files` đang dùng. KHÔNG tự chế kiểm quyền thứ hai.
 *      ⚠️ Hệ quả đã biết và CỐ Ý GIỮ: người KHÔNG phải thành viên nhận **404**, không phải 403 —
 *      `access.ts:44` cố ý không tiết lộ "project này có tồn tại". 403 chỉ dành cho ca *là*
 *      thành viên nhưng thiếu vai; đọc chỉ cần `viewer` (nấc thấp nhất) nên nhánh 403 trên thực
 *      tế không xảy ra ở route này. Lệch với mô tả phiếu là CÓ Ý — xem báo cáo ⑦b.
 *   ② **Chặn path traversal tường minh.** Khuôn gốc `path.join(cwd,'uploads', asset.path)` không
 *      guard: `path` sinh từ `luuProjectFile()` nên trong luồng bình thường luôn là tên file
 *      phẳng, NHƯNG cột đó là chuỗi tự do trong DB — một đường ghi khác (import, migration, tay)
 *      đặt `../../.env` vào là đọc được file ngoài kho. Rẻ để chặn, đắt nếu sót ⇒ chặn.
 *
 * Hàm này CỐ Ý không gọi `getSessionUser()` — nhận `userId` từ caller. Nhờ vậy test tích hợp gọi
 * được THẲNG (cùng lý do `promoteProjectFile()` tách khỏi route, `lib/server/promote.ts`).
 *
 * Import RELATIVE (không `@/`) — bộ chạy test là `sucrase-node`, nó KHÔNG đọc `paths` tsconfig
 * (cùng quy ước đã ghi ở `_lib/luu-file.ts`).
 */
import { readFile } from 'fs/promises';
import path from 'path';
import { prisma } from '../../../../lib/server/db';
import { assertProjectAccess, AccessError } from '../../../../lib/server/access';
import { sniffKind, isRasterImageKind, SNIFFED_MIME } from '../../../../lib/server/mime-sniff';

/** Cùng kho với `luu-file.ts` và `library-save.ts` — CỐ Ý, không đẻ thư mục thứ hai. */
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

/**
 * ⚠️ `Buffer<ArrayBuffer>` chứ KHÔNG phải `Buffer` trần — có lý do, đừng "dọn" đi: `Buffer` trần
 * rộng thành `Buffer<ArrayBufferLike>`, mà `BodyInit` của `NextResponse` KHÔNG nhận kiểu đó
 * (TS2345). `readFile()` vốn trả đúng `Buffer<ArrayBuffer>`; ghi rõ để không mất thông tin kiểu
 * khi đi qua union này. (`library/[id]/file/route.ts` thoát lỗi vì nó không annotate, chỉ suy.)
 */
export type DocNoiDungKetQua =
  | { ok: true; buf: Buffer<ArrayBuffer>; headers: Record<string, string> }
  | { ok: false; status: 401 | 403 | 404 | 410; error: string };

/**
 * Tên file trong `./uploads` PHẢI là tên phẳng. Khuôn sinh ở `luuProjectFile()` là
 * `<base36>_<rand6>.<ext>` ⇒ chỉ chữ/số/`_`/`.`/`-`. Từ chối mọi thứ khác (có `/`, `\`, `..`,
 * đường tuyệt đối, byte NUL…). Thuần + tất định ⇒ test được không cần DB.
 */
export function tenFileAnToan(p: string): boolean {
  if (!p || p.length > 200) return false;
  if (!/^[A-Za-z0-9._-]+$/.test(p)) return false;
  if (p === '.' || p === '..' || p.startsWith('.')) return false;
  return true;
}

/**
 * Đọc nội dung một `ProjectFile` cho `userId`. Trả kết quả có phân loại status rõ ràng —
 * caller chỉ việc dịch sang `NextResponse`.
 *
 * 404 tệp không tồn tại / đã xoá mềm / không phải thành viên dự án ·
 * 403 là thành viên nhưng thiếu vai (không xảy ra ở nấc 'viewer', giữ nhánh cho đúng hợp đồng) ·
 * 410 bản ghi còn mà file mất trên đĩa (hoặc `path` không an toàn ⇒ coi như không đọc được).
 */
export async function docNoiDungProjectFile(
  userId: string,
  id: string,
): Promise<DocNoiDungKetQua> {
  const row = await prisma.projectFile.findUnique({
    where: { id },
    select: { id: true, projectId: true, name: true, path: true, deletedAt: true },
  });
  if (!row || row.deletedAt)
    return { ok: false, status: 404, error: 'Không tìm thấy tệp dự án.' };

  try {
    await assertProjectAccess(userId, row.projectId, 'viewer');
  } catch (e) {
    if (e instanceof AccessError) return { ok: false, status: e.status, error: e.message };
    throw e;
  }

  // Chặn TRƯỚC khi chạm đĩa. 410 chứ không 400: với người dùng thì hệ quả y hệt "file không đọc
  // được"; và không nói cho bên ngoài biết ta vừa phát hiện một `path` bất thường.
  if (!tenFileAnToan(row.path))
    return { ok: false, status: 410, error: 'File mất trên đĩa.' };

  const duongDan = path.join(UPLOAD_DIR, row.path);
  // Đai an toàn thứ hai (thắt lưng + dây đeo): dù regex trên có sót thì vẫn phải nằm trong kho.
  if (path.resolve(duongDan) !== path.join(UPLOAD_DIR, path.basename(row.path)))
    return { ok: false, status: 410, error: 'File mất trên đĩa.' };

  let buf: Buffer<ArrayBuffer>;
  try {
    buf = await readFile(duongDan);
  } catch {
    return { ok: false, status: 410, error: 'File mất trên đĩa.' };
  }

  const kind = sniffKind(buf);
  const isImage = isRasterImageKind(kind);
  const headers: Record<string, string> = {
    'Content-Type': isImage ? SNIFFED_MIME[kind] : 'application/octet-stream',
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'private, max-age=86400',
  };
  if (!isImage) {
    const safeName = row.name.replace(/[^\w.\- ]/g, '_').slice(0, 120) || 'file';
    headers['Content-Disposition'] = `attachment; filename="${safeName}"`;
  }
  return { ok: true, buf, headers };
}
