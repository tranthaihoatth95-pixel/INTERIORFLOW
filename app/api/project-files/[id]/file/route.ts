import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { docNoiDungProjectFile } from '../../_lib/doc-noi-dung';
import { kiemDelegate, loiJson as loiJsonChung } from '../../_lib/guard';

/**
 * app/api/project-files/[id]/file — TRẢ NỘI DUNG một tệp thô của dự án.
 *
 * VÌ SAO CÓ: `ProjectFile` trước nay KHÔNG có đường đọc nội dung ⇒ khu *Tệp nguồn dự án* chỉ xem
 * trước được tệp **vừa upload trong phiên** (dataUrl còn trong bộ nhớ) hoặc tệp **đã promote**
 * (đi nhờ `/api/library/[id]/file`). Reload trang là mất ảnh — đúng ca hỏng phiếu này vá.
 *
 * Route này là VỎ MỎNG: auth → `docNoiDungProjectFile()` (lõi ở `_lib/doc-noi-dung.ts`, nơi ghi
 * đủ lý do của từng quyết định + hai chỗ khác khuôn `library/[id]/file`).
 *
 * ══ BẢNG MÃ LỖI — cùng khuôn 3 route `project-files` anh em ═════════════════════════════════
 *   401 chưa đăng nhập · 403 là thành viên nhưng thiếu vai · **404 tệp không tồn tại / đã xoá
 *   mềm / KHÔNG phải thành viên dự án** (cố ý không tiết lộ dự án có tồn tại — `access.ts:44`)
 *   · 410 bản ghi còn mà file mất trên đĩa (hoặc `path` bất thường) · 503 Prisma Client thiếu
 *   model `ProjectFile` (lỗi VẬN HÀNH: server khởi động trước `prisma generate`) · 500 luôn kèm
 *   body JSON + `console.error`, không bao giờ rỗng.
 */
const loiJson = (e: unknown, cho: string) => loiJsonChung(e, 'project-files/[id]/file', cho);

export async function GET(req: Request, ctx: { params: { id: string } }) {
  try {
    return await getHandler(req, ctx);
  } catch (e) {
    return loiJson(e, 'GET');
  }
}

async function getHandler(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const thieu = kiemDelegate('project-files/[id]/file');
  if (thieu) return thieu;

  try {
    const kq = await docNoiDungProjectFile(user.id, params.id);
    if (!kq.ok) return NextResponse.json({ error: kq.error }, { status: kq.status });
    return new NextResponse(kq.buf, { headers: kq.headers });
  } catch (e) {
    return loiJson(e, 'GET');
  }
}
