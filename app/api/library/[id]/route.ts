import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/auth';
import { RevConflictError, updateWithRevCheck, REV_CONFLICT_RESPONSE } from '@/lib/server/rev-guard';

/**
 * Xoá asset — chỉ người upload hoặc admin.
 * 26/07 local-first: xoá MỀM (set deletedAt) thay vì delete() thật + unlink file vật lý.
 * File trong ./uploads GIỮ NGUYÊN trên đĩa — mục đích xoá mềm là còn khôi phục được; dọn file
 * thật là việc của job dọn dẹp riêng sau này (chưa làm ở đây).
 *
 * W5 (19/08) — rev optimistic-concurrency (`lib/server/rev-guard.ts`, trích từ H11). `?expectedRev=`
 * optional trên query — không gửi thì hành vi y hệt trước giờ.
 */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const expectedRevRaw = new URL(req.url).searchParams.get('expectedRev');
  const expectedRev =
    expectedRevRaw !== null && Number.isFinite(Number(expectedRevRaw))
      ? Number(expectedRevRaw)
      : undefined;
  const asset = await prisma.libraryAsset.findUnique({ where: { id: params.id, deletedAt: null } });
  if (!asset) return NextResponse.json({ error: 'Không tìm thấy.' }, { status: 404 });
  if (asset.userId !== user.id && !user.isAdmin) {
    return NextResponse.json({ error: 'Chỉ người upload hoặc admin được xoá.' }, { status: 403 });
  }
  try {
    await updateWithRevCheck(asset.id, expectedRev, (where) =>
      prisma.libraryAsset.update({
        where,
        data: { deletedAt: new Date(), rev: { increment: 1 }, lastEditedBy: user.id },
      }),
    );
  } catch (e) {
    if (e instanceof RevConflictError) return REV_CONFLICT_RESPONSE();
    throw e;
  }
  return NextResponse.json({ ok: true });
}
