/**
 * GET /api/notebook/[projectId]/source/[sourceId]/file
 * Download file gốc của source (PDF/ảnh). Auth: chủ project.
 */
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { prisma } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/auth';
import { resolveNotebookProjectId } from '@/lib/notebook/resolveProject';
import { sniffKind, isRasterImageKind, SNIFFED_MIME } from '@/lib/server/mime-sniff';

export async function GET(
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
  if (!source.filePath) {
    return NextResponse.json({ error: 'Source không có file gốc.' }, { status: 404 });
  }
  const abs = path.isAbsolute(source.filePath)
    ? source.filePath
    : path.join(process.cwd(), source.filePath);
  const buf = await fs.readFile(abs).catch(() => null);
  if (!buf) return NextResponse.json({ error: 'File không còn trên đĩa.' }, { status: 410 });

  // §6.2 R3 — sniff lại byte THẬT thay vì tin thẳng `source.mimeType` (cột lưu từ upload, có thể
  // là dữ liệu từ TRƯỚC khi vá whitelist ở route POST). Notebook có 2 loại HỢP LỆ để xem `inline`:
  // ảnh raster VÀ PDF (khác `library` — PDF ở đây là nhu cầu chính đáng, trình duyệt render PDF
  // trong renderer riêng có sandbox, không thực thi script như HTML/SVG nên không cùng rủi ro XSS
  // mà R3 nhắm tới). Bất kỳ thứ gì KHÁC 2 loại đó → ép `attachment`, không đoán.
  const sniffed = sniffKind(buf);
  const inlineSafe = isRasterImageKind(sniffed) || sniffed === 'pdf';
  const contentType = sniffed && inlineSafe ? SNIFFED_MIME[sniffed] : 'application/octet-stream';
  const filename = encodeURIComponent(source.title || path.basename(abs));
  const disposition = inlineSafe ? `inline; filename*=UTF-8''${filename}` : `attachment; filename*=UTF-8''${filename}`;
  return new NextResponse(buf, {
    status: 200,
    headers: {
      'content-type': contentType,
      'content-disposition': disposition,
      'x-content-type-options': 'nosniff',
      'cache-control': 'private, max-age=0, must-revalidate',
    },
  });
}
