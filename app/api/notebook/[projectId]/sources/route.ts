/**
 * GET /api/notebook/[projectId]/sources
 * Liệt kê mọi source của notebook + số chunk. Auth: chủ project.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/auth';
import { resolveNotebookProjectId } from '@/lib/notebook/resolveProject';

export async function GET(_: Request, { params }: { params: { projectId: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // Resolve param → real Project.id owned by user (auto-provision bucket ẩn nếu
  // client truyền slug tên flow như NotebookButton hiện tại). Không còn 404 giả.
  const projectId = await resolveNotebookProjectId(user.id, params.projectId);

  const notebook = await prisma.projectNotebook.findUnique({
    where: { projectId },
    select: { id: true, createdAt: true, updatedAt: true },
  });
  if (!notebook) {
    return NextResponse.json({ notebook: null, sources: [] });
  }

  const sources = await prisma.notebookSource.findMany({
    where: { notebookId: notebook.id },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { chunks: true } } },
  });

  return NextResponse.json({
    notebook,
    sources: sources.map((s) => ({
      id: s.id,
      kind: s.kind,
      title: s.title,
      status: s.status,
      errorMsg: s.errorMsg,
      mimeType: s.mimeType,
      sizeBytes: s.sizeBytes,
      originalUrl: s.originalUrl,
      hasFile: !!s.filePath,
      chunkCount: s._count.chunks,
      createdAt: s.createdAt,
    })),
  });
}
