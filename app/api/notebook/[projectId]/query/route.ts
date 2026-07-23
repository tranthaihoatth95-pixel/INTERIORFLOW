/**
 * POST /api/notebook/[projectId]/query
 * Body: { question: string, topK?: number = 5, stage?: 'concept'|'render'|'present'|'gallery' }
 * Response: { answer, sources: [{sourceId, sourceTitle, page?, snippet, score}], tier, model, stagePrompt }
 *
 * Auth: chủ project. Nếu notebook chưa có source nào → answer vẫn trả (không context),
 * sources = [] — client tự biết là "chưa có tài liệu, đây là hiểu biết chung".
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/auth';
import { ragAnswer } from '@/lib/notebook/rag';
import { normalizeChatStage } from '@/lib/ai/chat-assist';
import { resolveNotebookProjectId } from '@/lib/notebook/resolveProject';

export async function POST(req: Request, { params }: { params: { projectId: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const projectId = await resolveNotebookProjectId(user.id, params.projectId);

  const body = (await req.json().catch(() => ({}))) as {
    question?: string;
    topK?: number;
    stage?: unknown;
  };
  const question = String(body.question ?? '').trim();
  if (!question) return NextResponse.json({ error: 'Thiếu question.' }, { status: 400 });
  if (question.length > 4000) return NextResponse.json({ error: 'Question quá dài (>4000).' }, { status: 400 });

  const notebook = await prisma.projectNotebook.upsert({
    where: { projectId },
    create: { projectId },
    update: {},
    select: { id: true },
  });

  const stage = normalizeChatStage(body.stage);
  const topK = Number.isFinite(body.topK) ? Math.max(1, Math.min(Number(body.topK), 12)) : 5;

  try {
    const r = await ragAnswer(notebook.id, question, { topK, stage });
    return NextResponse.json(r);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `RAG fail: ${msg.slice(0, 300)}` }, { status: 500 });
  }
}
