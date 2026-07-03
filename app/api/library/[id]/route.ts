import { NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/auth';

/** Xoá asset — chỉ người upload hoặc admin. */
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const asset = await prisma.libraryAsset.findUnique({ where: { id: params.id } });
  if (!asset) return NextResponse.json({ error: 'Không tìm thấy.' }, { status: 404 });
  if (asset.userId !== user.id && !user.isAdmin) {
    return NextResponse.json({ error: 'Chỉ người upload hoặc admin được xoá.' }, { status: 403 });
  }
  await prisma.libraryAsset.delete({ where: { id: asset.id } });
  await unlink(path.join(process.cwd(), 'uploads', asset.path)).catch(() => {});
  return NextResponse.json({ ok: true });
}
