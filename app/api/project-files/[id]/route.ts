import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/auth';
import { assertProjectAccess } from '@/lib/server/access';
import { kiemDelegate, loiJson as loiJsonChung } from '../_lib/guard';

/**
 * app/api/project-files/[id] — DELETE **xoá mềm** một tệp thô.
 *
 * ⛔ KHÔNG xoá file vật lý trong `./uploads`, và KHÔNG đụng `LibraryAsset` nào đã sinh ra từ tệp
 * này qua Promote. Hai lý do, cả hai đều là contract chứ không phải sự lười:
 *   ① Cùng luật soft-delete của `LibraryAsset` (`schema.prisma:305-308`) — xoá mềm là để **còn
 *      khôi phục được**; dọn file thật là việc của job dọn dẹp sau này.
 *   ② Sau Promote, `LibraryAsset.path` **trỏ vào ĐÚNG file đó** (promote.ts cố ý không copy).
 *      Xoá file ở đây sẽ làm chết một asset đang sống trong Master Library, có thể đang được N
 *      project khác dùng — đúng thứ mô hình 1-asset-N-project sinh ra để tránh.
 */
const loiJson = (e: unknown, cho: string) => loiJsonChung(e, 'project-files/[id]', cho);

export async function DELETE(req: Request, ctx: { params: { id: string } }) {
  try {
    return await deleteHandler(req, ctx);
  } catch (e) {
    return loiJson(e, 'DELETE');
  }
}

async function deleteHandler(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const thieu = kiemDelegate('project-files/[id]');
  if (thieu) return thieu;

  try {
    const row = await prisma.projectFile.findUnique({
      where: { id: params.id },
      select: { id: true, projectId: true, deletedAt: true },
    });
    if (!row || row.deletedAt)
      return NextResponse.json({ error: 'Không tìm thấy tệp dự án.' }, { status: 404 });

    await assertProjectAccess(user.id, row.projectId, 'bim');

    await prisma.projectFile.update({
      where: { id: row.id },
      data: { deletedAt: new Date(), lastEditedBy: user.id },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return loiJson(e, 'DELETE');
  }
}
