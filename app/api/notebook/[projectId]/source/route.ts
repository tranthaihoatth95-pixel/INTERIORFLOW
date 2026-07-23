/**
 * POST /api/notebook/[projectId]/source
 *
 * Upload/ingest 1 nguồn vào Project Notebook. Chấp nhận 2 dạng body:
 *  A) multipart/form-data: field `file` (File) + `kind` + `title` (+ optional `originalUrl`)
 *  B) application/json: `{ kind, title, content, originalUrl? }` (cho text/url/meeting-note)
 *
 * Flow: tạo NotebookSource status='processing' → response ngay (không giữ HTTP mở
 * chờ embed) → background await extract → chunk → embed → tạo NotebookChunk hàng
 * loạt → set status='ready'. Nếu fail bất kỳ bước nào → status='error' + errorMsg.
 *
 * Auth: chủ project (project.userId === user.id).
 * Max file: 20MB PDF, 5MB ảnh.
 */

import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { prisma } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/auth';
import { extractPdf, extractImage, extractPlain, type ExtractResult } from '@/lib/notebook/extract';
import { chunkPages, chunkText } from '@/lib/notebook/chunk';
import { embedTexts, NoEmbedProviderError } from '@/lib/notebook/embed';
import { resolveNotebookProjectId } from '@/lib/notebook/resolveProject';

const MAX_PDF = 20 * 1024 * 1024;
const MAX_IMG = 5 * 1024 * 1024;
const UPLOAD_ROOT = path.join(process.cwd(), 'uploads', 'notebook');

type Kind = 'pdf' | 'image' | 'text' | 'url' | 'meeting-note';
const KINDS: Kind[] = ['pdf', 'image', 'text', 'url', 'meeting-note'];

/** Resolve param → real Project.id owned by user (auto-provision bucket ẩn), rồi upsert ProjectNotebook. */
async function ownProjectNotebook(
  paramProjectId: string,
  userId: string,
): Promise<{ notebookId: string; projectId: string } | null> {
  const projectId = await resolveNotebookProjectId(userId, paramProjectId);
  const nb = await prisma.projectNotebook.upsert({
    where: { projectId },
    create: { projectId },
    update: {},
    select: { id: true },
  });
  return { notebookId: nb.id, projectId };
}

function extForMime(mime: string | null | undefined, fallback = 'bin'): string {
  if (!mime) return fallback;
  if (mime.includes('pdf')) return 'pdf';
  if (mime.includes('png')) return 'png';
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
  if (mime.includes('webp')) return 'webp';
  return fallback;
}

/**
 * Chạy pipeline extract → chunk → embed → lưu chunk. Không throw ra ngoài —
 * mọi lỗi đều update source.status='error' + errorMsg.
 */
async function processSource(sourceId: string, notebookId: string, extract: () => Promise<ExtractResult>) {
  try {
    const res = await extract();
    if (!res.fullText.trim()) {
      await prisma.notebookSource.update({
        where: { id: sourceId },
        data: { status: 'error', errorMsg: 'Không trích được text nào từ nguồn.' },
      });
      return;
    }
    const chunks = res.pages.length > 0
      ? chunkPages(res.pages, { targetTokens: 500, overlapTokens: 50 })
      : chunkText(res.fullText, { targetTokens: 500, overlapTokens: 50 });
    if (chunks.length === 0) {
      await prisma.notebookSource.update({
        where: { id: sourceId },
        data: { status: 'error', errorMsg: 'Không chunk được nội dung.' },
      });
      return;
    }

    // Embed theo batch nhỏ để tránh timeout (~32 chunk/lượt cho NVIDIA NIM).
    const BATCH = 32;
    const allVectors: number[][] = [];
    for (let i = 0; i < chunks.length; i += BATCH) {
      const batch = chunks.slice(i, i + BATCH);
      const vecs = await embedTexts(batch.map((c) => c.content), 'passage');
      for (const v of vecs) allVectors.push(v);
    }

    await prisma.$transaction(
      chunks.map((c, i) =>
        prisma.notebookChunk.create({
          data: {
            notebookId,
            sourceId,
            page: c.page ?? null,
            content: c.content,
            tokens: c.tokens,
            embedding: JSON.stringify(allVectors[i] ?? []),
          },
        }),
      ),
    );

    await prisma.notebookSource.update({
      where: { id: sourceId },
      data: {
        status: 'ready',
        errorMsg: res.warnings.length ? res.warnings.join(' · ').slice(0, 500) : null,
      },
    });
  } catch (err) {
    const msg = err instanceof NoEmbedProviderError
      ? 'Chưa cấu hình NVIDIA_API_KEY để embed.'
      : err instanceof Error
      ? err.message
      : String(err);
    await prisma.notebookSource.update({
      where: { id: sourceId },
      data: { status: 'error', errorMsg: msg.slice(0, 500) },
    });
  }
}

export async function POST(req: Request, { params }: { params: { projectId: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const owned = await ownProjectNotebook(params.projectId, user.id);
  if (!owned) return NextResponse.json({ error: 'Không tìm thấy project.' }, { status: 404 });
  const { notebookId, projectId: resolvedProjectId } = owned;

  const contentType = req.headers.get('content-type') ?? '';

  let kind: Kind | null = null;
  let title = '';
  let originalUrl: string | null = null;
  let filePath: string | null = null;
  let mimeType: string | null = null;
  let sizeBytes = 0;
  let plainContent = '';
  let fileBuf: Uint8Array | null = null;

  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData();
    const rawKind = String(form.get('kind') ?? '').trim() as Kind;
    if (!KINDS.includes(rawKind)) return NextResponse.json({ error: 'kind không hợp lệ.' }, { status: 400 });
    kind = rawKind;
    title = String(form.get('title') ?? '').trim();
    originalUrl = (form.get('originalUrl') ? String(form.get('originalUrl')) : null) || null;
    const file = form.get('file');
    if (file && typeof file !== 'string') {
      const f = file as File;
      const max = kind === 'pdf' ? MAX_PDF : MAX_IMG;
      if (f.size > max) {
        return NextResponse.json(
          { error: `File quá lớn (${(f.size / 1024 / 1024).toFixed(1)}MB > ${(max / 1024 / 1024)}MB).` },
          { status: 413 },
        );
      }
      mimeType = f.type || null;
      sizeBytes = f.size;
      fileBuf = new Uint8Array(await f.arrayBuffer());
      if (!title) title = f.name;
    }
  } else {
    const body = (await req.json().catch(() => ({}))) as {
      kind?: string;
      title?: string;
      content?: string;
      originalUrl?: string;
    };
    const rawKind = String(body.kind ?? '').trim() as Kind;
    if (!KINDS.includes(rawKind)) return NextResponse.json({ error: 'kind không hợp lệ.' }, { status: 400 });
    kind = rawKind;
    title = String(body.title ?? '').trim();
    originalUrl = body.originalUrl ?? null;
    plainContent = String(body.content ?? '');
  }

  if (!title) title = 'Nguồn không tên';
  if (kind === 'pdf' && !fileBuf) return NextResponse.json({ error: 'PDF cần file upload.' }, { status: 400 });
  if (kind === 'image' && !fileBuf) return NextResponse.json({ error: 'Ảnh cần file upload.' }, { status: 400 });
  if ((kind === 'text' || kind === 'meeting-note') && !plainContent.trim()) {
    return NextResponse.json({ error: `${kind} cần content trong body.` }, { status: 400 });
  }
  if (kind === 'url' && !plainContent.trim() && !originalUrl) {
    return NextResponse.json({ error: 'url cần content (paste text) hoặc originalUrl.' }, { status: 400 });
  }

  // Persist file (nếu có)
  const source = await prisma.notebookSource.create({
    data: {
      notebookId,
      kind,
      title,
      originalUrl,
      mimeType,
      sizeBytes: sizeBytes || null,
      status: 'processing',
    },
  });

  if (fileBuf) {
    const dir = path.join(UPLOAD_ROOT, resolvedProjectId);
    await fs.mkdir(dir, { recursive: true });
    const ext = extForMime(mimeType, kind === 'pdf' ? 'pdf' : 'bin');
    filePath = path.join(dir, `${source.id}.${ext}`);
    await fs.writeFile(filePath, fileBuf);
    await prisma.notebookSource.update({
      where: { id: source.id },
      data: { filePath: path.relative(process.cwd(), filePath) },
    });
  }

  // Kick pipeline (không await → response trả ngay).
  const kindLocked = kind;
  const bufLocked = fileBuf;
  const contentLocked = plainContent;
  const mimeLocked = mimeType;
  void processSource(source.id, notebookId, async () => {
    if (kindLocked === 'pdf' && bufLocked) return extractPdf(bufLocked);
    if (kindLocked === 'image' && bufLocked) {
      const b64 = Buffer.from(bufLocked).toString('base64');
      return extractImage(`data:${mimeLocked ?? 'image/png'};base64,${b64}`);
    }
    return extractPlain(contentLocked || originalUrl || '');
  });

  return NextResponse.json({ sourceId: source.id, status: 'processing' }, { status: 202 });
}
