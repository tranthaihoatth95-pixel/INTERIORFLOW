import { NextResponse } from 'next/server';
import { AI_TASKS, isAiTask } from '@/lib/ai/models';
import { falConfigured, submitJob } from '@/lib/ai/providers/fal';

export async function POST(req: Request) {
  if (!falConfigured()) {
    return NextResponse.json(
      { error: 'FAL_KEY chưa cấu hình — thêm vào .env.local để dùng AI thật.', code: 'FAL_NOT_CONFIGURED' },
      { status: 503 },
    );
  }

  let body: { task?: string; input?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body không phải JSON.' }, { status: 400 });
  }

  const { task, input } = body;
  if (!task || !isAiTask(task) || !input || typeof input !== 'object') {
    return NextResponse.json({ error: 'Thiếu task hợp lệ hoặc input.' }, { status: 400 });
  }

  try {
    const jobId = await submitJob(AI_TASKS[task].falModel, input);
    return NextResponse.json({ jobId, task });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Submit job thất bại.' },
      { status: 502 },
    );
  }
}
