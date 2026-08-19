import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/auth';
import { AccessError, assertProjectAccess } from '@/lib/server/access';

/**
 * app/api/project-asset-usage/[id] — DELETE gỡ MỘT usage record (soft-delete).
 * KHÔNG đụng LibraryAsset liên quan — asset vẫn còn trong Thư viện dù usage bị gỡ.
 * Xem app/api/project-asset-usage/route.ts cho POST/GET + bối cảnh phiếu.
 */

function errResponse(e: unknown) {
  if (e instanceof AccessError) return NextResponse.json({ error: e.message }, { status: e.status });
  throw e;
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const row = await prisma.projectAssetUsage.findUnique({
      where: { id: params.id },
      select: { id: true, projectId: true, deletedAt: true },
    });
    if (!row || row.deletedAt)
      return NextResponse.json({ error: 'Không tìm thấy usage.' }, { status: 404 });

    await assertProjectAccess(user.id, row.projectId, 'viewer');

    // Soft-delete — KHÔNG delete() thật, KHÔNG chạm LibraryAsset (chỉ gỡ liên kết dùng, giữ asset).
    await prisma.projectAssetUsage.update({
      where: { id: row.id },
      data: { deletedAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errResponse(e);
  }
}
