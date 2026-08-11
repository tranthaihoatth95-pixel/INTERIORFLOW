import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { assertProjectAccess, accessErrorPayload } from '@/lib/server/access';
import { listWorkflowStates, listTasks, createTask, isTaskStage } from '@/lib/server/tasks';

export const dynamic = 'force-dynamic';

/** GET /api/tasks?projectId=... — Task nội bộ IF (M-SCOPE VIỆC 2), KHÔNG liên quan LarkTaskRef. */
export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const projectId = new URL(req.url).searchParams.get('projectId');
  if (!projectId) return NextResponse.json({ error: 'thiếu projectId' }, { status: 400 });

  try {
    await assertProjectAccess(user.id, projectId, 'viewer');
    const [states, tasks] = await Promise.all([listWorkflowStates(projectId), listTasks(projectId)]);
    return NextResponse.json({ states, tasks });
  } catch (e) {
    const p = accessErrorPayload(e);
    if (p) return NextResponse.json({ error: p.message }, { status: p.status });
    return NextResponse.json({ error: e instanceof Error ? e.message : 'lỗi không rõ' }, { status: 500 });
  }
}

/** POST /api/tasks — tạo task mới trong 1 project (tối thiểu quyền 'drafter' — cùng ngưỡng tạo flow ở /api/flows). */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));

  const projectId = typeof body.projectId === 'string' ? body.projectId : '';
  const title = typeof body.title === 'string' ? body.title : '';
  if (!projectId || !title.trim()) {
    return NextResponse.json({ error: 'thiếu projectId hoặc title' }, { status: 400 });
  }
  // TaskContext Link (11/08) — stage sai giá trị là lỗi ĐẦU VÀO (400), không phải lỗi server.
  if (body.stage !== undefined && body.stage !== null && !isTaskStage(body.stage)) {
    return NextResponse.json({ error: "stage chỉ nhận 'concept' | 'render' | 'present' hoặc null" }, { status: 400 });
  }

  try {
    await assertProjectAccess(user.id, projectId, 'drafter');
    const task = await createTask({
      projectId,
      title,
      statusId: typeof body.statusId === 'string' ? body.statusId : null,
      assigneeIds: Array.isArray(body.assigneeIds) ? body.assigneeIds.filter((x: unknown) => typeof x === 'string') : [],
      startAt: typeof body.startAt === 'string' ? body.startAt : null,
      dueAt: typeof body.dueAt === 'string' ? body.dueAt : null,
      order: typeof body.order === 'number' ? body.order : 0,
      stage: isTaskStage(body.stage) ? body.stage : null,
      workspaceId: typeof body.workspaceId === 'string' ? body.workspaceId : null,
      entityId: typeof body.entityId === 'string' ? body.entityId : null,
    });
    return NextResponse.json({ task });
  } catch (e) {
    const p = accessErrorPayload(e);
    if (p) return NextResponse.json({ error: p.message }, { status: p.status });
    return NextResponse.json({ error: e instanceof Error ? e.message : 'lỗi không rõ' }, { status: 500 });
  }
}
