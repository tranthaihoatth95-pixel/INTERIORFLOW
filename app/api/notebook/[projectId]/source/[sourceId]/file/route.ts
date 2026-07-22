/**
 * GET /api/notebook/[projectId]/source/[sourceId]/file
 * Download file gốc của source (PDF/ảnh). Auth: chủ project.
 */
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { prisma } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/auth';

export async function GET(
  _: Request,
  { params }: { params: { projectId: string; sourceId: string } },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const source = await prisma.notebookSource.findUnique({
    where: { id: params.sourceId },
    include: { notebook: { include: { project: { select: { userId: true, id: true } } } } },
  });
  if (
    !source ||
    source.notebook.project.userId !== user.id ||
    source.notebook.project.id !== params.projectId
  ) {
    return NextResponse.json({ error: 'Không tìm thấy source.' }, { status: 404 });
  }
  if (!source.filePath) {
    return NextResponse.json({ error: 'Source không có file gốc.' }, { status: 404 });
  }
  const abs = path.isAbsolute(source.filePath)
    ? source.filePath
    : path.join(process.cwd(), source.filePath);
  const buf = await fs.readFile(abs).catch(() => null);
  if (!buf) return NextResponse.json({ error: 'File không còn trên đĩa.' }, { status: 410 });

  const filename = encodeURIComponent(source.title || path.basename(abs));
  return new NextResponse(buf, {
    status: 200,
    headers: {
      'content-type': source.mimeType || 'application/octet-stream',
      'content-disposition': `inline; filename*=UTF-8''${filename}`,
      'cache-control': 'private, max-age=0, must-revalidate',
    },
  });
}
