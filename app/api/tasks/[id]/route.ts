import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { assertProjectAccess, accessErrorPayload } from '@/lib/server/access';
import { updateTask, deleteTask } from '@/lib/server/tasks';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/tasks/:id — body PHẢI kèm `projectId` (đổi statusId khi kéo-thả Kanban là ca
 * chính — LarkPanels.tsx VIỆC 6). projectId dùng để xác nhận task thuộc đúng project trước
 * khi kiểm quyền + trước khi ghi (chặn sửa task project khác qua id đoán mò).
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = params;
  const body = await req.json().catch(() => ({}));
  const projectId = typeof body.projectId === 'string' ? body.projectId : '';
  if (!projectId) return NextResponse.json({ error: 'thiếu projectId' }, { status: 400 });

  try {
    await assertProjectAccess(user.id, projectId, 'drafter');
    const task = await updateTask(id, projectId, {
      title: typeof body.title === 'string' ? body.title : undefined,
      statusId: typeof body.statusId === 'string' ? body.statusId : undefined,
      assigneeIds: Array.isArray(body.assigneeIds) ? body.assigneeIds.filter((x: unknown) => typeof x === 'string') : undefined,
      startAt: body.startAt === undefined ? undefined : body.startAt,
      dueAt: body.dueAt === undefined ? undefined : body.dueAt,
      order: typeof body.order === 'number' ? body.order : undefined,
    });
    return NextResponse.json({ task });
  } catch (e) {
    const p = accessErrorPayload(e);
    if (p) return NextResponse.json({ error: p.message }, { status: p.status });
    return NextResponse.json({ error: e instanceof Error ? e.message : 'lỗi không rõ' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = params;
  const projectId = new URL(req.url).searchParams.get('projectId') ?? '';
  if (!projectId) return NextResponse.json({ error: 'thiếu projectId' }, { status: 400 });

  try {
    await assertProjectAccess(user.id, projectId, 'drafter');
    await deleteTask(id, projectId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const p = accessErrorPayload(e);
    if (p) return NextResponse.json({ error: p.message }, { status: p.status });
    return NextResponse.json({ error: e instanceof Error ? e.message : 'lỗi không rõ' }, { status: 500 });
  }
}
