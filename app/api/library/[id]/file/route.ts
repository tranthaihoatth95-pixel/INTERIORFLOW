import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/auth';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const asset = await prisma.libraryAsset.findUnique({ where: { id: params.id } });
  if (!asset) return NextResponse.json({ error: 'Không tìm thấy.' }, { status: 404 });
  try {
    const buf = await readFile(path.join(process.cwd(), 'uploads', asset.path));
    return new NextResponse(buf, {
      headers: {
        'Content-Type': asset.mime,
        'Cache-Control': 'private, max-age=86400',
      },
    });
  } catch {
    return NextResponse.json({ error: 'File mất trên đĩa.' }, { status: 410 });
  }
}
