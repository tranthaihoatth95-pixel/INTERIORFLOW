/**
 * DELETE /api/notebook/[projectId]/source/[sourceId]
 * Xoá 1 source + chunks (cascade Prisma) + file trên đĩa nếu có.
 */
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { prisma } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/auth';
import { resolveNotebookProjectId } from '@/lib/notebook/resolveProject';

export async function DELETE(
  _: Request,
  { params }: { params: { projectId: string; sourceId: string } },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const resolvedProjectId = await resolveNotebookProjectId(user.id, params.projectId);

  const source = await prisma.notebookSource.findUnique({
    where: { id: params.sourceId },
    include: { notebook: { include: { project: { select: { userId: true, id: true } } } } },
  });
  if (
    !source ||
    source.notebook.project.userId !== user.id ||
    source.notebook.project.id !== resolvedProjectId
  ) {
    return NextResponse.json({ error: 'Không tìm thấy source.' }, { status: 404 });
  }

  if (source.filePath) {
    const abs = path.isAbsolute(source.filePath)
      ? source.filePath
      : path.join(process.cwd(), source.filePath);
    await fs.unlink(abs).catch(() => {
      /* file có thể đã bị xoá tay — không fatal */
    });
  }

  await prisma.notebookSource.delete({ where: { id: params.sourceId } });
  return NextResponse.json({ ok: true });
}
