import { NextResponse } from 'next/server';
import { AI_TASKS, isAiTask } from '@/lib/ai/models';
import { falConfigured, jobStatus } from '@/lib/ai/providers/fal';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  if (!falConfigured()) {
    return NextResponse.json({ error: 'FAL_KEY chưa cấu hình.', code: 'FAL_NOT_CONFIGURED' }, { status: 503 });
  }
  const task = new URL(req.url).searchParams.get('task') ?? '';
  if (!isAiTask(task)) {
    return NextResponse.json({ error: 'Task không hợp lệ.' }, { status: 400 });
  }
  const status = await jobStatus(AI_TASKS[task].falModel, params.id);
  return NextResponse.json(status);
}
