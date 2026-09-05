import { NextResponse } from 'next/server';
import { authorizeRequest } from '@/lib/auth/authorize-request';
import { listMemberSummaries } from '@/lib/auth/authorize-db';
import { requireCapability, checkAssignees } from '@/lib/auth/authorize';
import { respondError } from '@/lib/auth/route-helpers';
import { updateTask, deleteTask, isTaskStage } from '@/lib/server/tasks';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/tasks/:id — body PHẢI kèm `projectId` (đổi statusId khi kéo-thả Kanban là ca
 * chính — LarkPanels.tsx VIỆC 6). projectId dùng để xác nhận task thuộc đúng project trước
 * khi kiểm quyền + trước khi ghi (chặn sửa task project khác qua id đoán mò).
 * SLICE 6: quyền = task:write qua lib/auth; `assigneeIds` kiểm đủ điều kiện giao (xem ../route.ts).
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await req.json().catch(() => ({}));
  const projectId = typeof body.projectId === 'string' ? body.projectId : '';
  if (!projectId) return NextResponse.json({ error: 'thiếu projectId' }, { status: 400 });
  // TaskContext Link (11/08) — stage sai giá trị là lỗi ĐẦU VÀO (400); null = gỡ ngữ cảnh.
  if (body.stage !== undefined && body.stage !== null && !isTaskStage(body.stage)) {
    return NextResponse.json({ error: "stage chỉ nhận 'concept' | 'render' | 'present' hoặc null" }, { status: 400 });
  }
  const assigneeIds: string[] | undefined = Array.isArray(body.assigneeIds)
    ? body.assigneeIds.filter((x: unknown) => typeof x === 'string')
    : undefined;

  try {
    const grant = requireCapability(await authorizeRequest(projectId), 'task:write');
    if (assigneeIds && assigneeIds.length > 0) {
      requireCapability(grant, 'task:assign');
      const chk = checkAssignees(assigneeIds, await listMemberSummaries(projectId, grant.currentStage));
      if (!chk.ok) {
        return NextResponse.json({ error: 'Người được giao phải là thành viên còn hiệu lực và có quyền nhận việc.', ineligible: chk.ineligible }, { status: 400 });
      }
    }
    const task = await updateTask(id, projectId, {
      title: typeof body.title === 'string' ? body.title : undefined,
      statusId: typeof body.statusId === 'string' ? body.statusId : undefined,
      assigneeIds,
      startAt: body.startAt === undefined ? undefined : body.startAt,
      dueAt: body.dueAt === undefined ? undefined : body.dueAt,
      order: typeof body.order === 'number' ? body.order : undefined,
      stage: body.stage === undefined ? undefined : isTaskStage(body.stage) ? body.stage : null,
      workspaceId: body.workspaceId === undefined ? undefined : typeof body.workspaceId === 'string' ? body.workspaceId : null,
      entityId: body.entityId === undefined ? undefined : typeof body.entityId === 'string' ? body.entityId : null,
    });
    return NextResponse.json({ task });
  } catch (e) {
    return respondError(e);
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const projectId = new URL(req.url).searchParams.get('projectId') ?? '';
  if (!projectId) return NextResponse.json({ error: 'thiếu projectId' }, { status: 400 });

  try {
    requireCapability(await authorizeRequest(projectId), 'task:write');
    await deleteTask(id, projectId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return respondError(e);
  }
}
