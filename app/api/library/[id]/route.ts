import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/auth';

/**
 * Xoá asset — chỉ người upload hoặc admin.
 * 26/07 local-first: xoá MỀM (set deletedAt) thay vì delete() thật + unlink file vật lý.
 * File trong ./uploads GIỮ NGUYÊN trên đĩa — mục đích xoá mềm là còn khôi phục được; dọn file
 * thật là việc của job dọn dẹp riêng sau này (chưa làm ở đây).
 */
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const asset = await prisma.libraryAsset.findUnique({ where: { id: params.id, deletedAt: null } });
  if (!asset) return NextResponse.json({ error: 'Không tìm thấy.' }, { status: 404 });
  if (asset.userId !== user.id && !user.isAdmin) {
    return NextResponse.json({ error: 'Chỉ người upload hoặc admin được xoá.' }, { status: 403 });
  }
  await prisma.libraryAsset.update({
    where: { id: asset.id },
    data: { deletedAt: new Date(), rev: { increment: 1 }, lastEditedBy: user.id },
  });
  return NextResponse.json({ ok: true });
}
