import { NextResponse } from 'next/server';
import { authorizeRequest } from '@/lib/auth/authorize-request';
import { listMemberSummaries } from '@/lib/auth/authorize-db';
import { requireCapability, checkAssignees } from '@/lib/auth/authorize';
import { respondError } from '@/lib/auth/route-helpers';
import { listWorkflowStates, listTasks, createTask, isTaskStage } from '@/lib/server/tasks';

export const dynamic = 'force-dynamic';

/**
 * SLICE 6 (02/09) — quyền đi qua `lib/auth` (vai canonical theo năng lực), thay `assertProjectAccess
 * minRole 'drafter'`. Ánh xạ: đọc = task:read (mọi thành viên) · tạo/sửa/xoá = task:write
 * (editor · reviewer · owner · admin; viewer KHÔNG). Reviewer có task:write vì Cổng Duyệt chốt
 * 11/08: note duyệt gom thành checklist → việc — người duyệt phải tạo được việc.
 * GIAO VIỆC: mọi `assigneeIds` phải là thành viên CÒN HIỆU LỰC có `task:assignable` — sai thì 400
 * nêu tên, KHÔNG lặng lẽ lọc bớt (lọc bớt = giả thành công).
 */

/** GET /api/tasks?projectId=... — states + tasks + grant + members (nguồn picker giao việc). */
export async function GET(req: Request) {
  const projectId = new URL(req.url).searchParams.get('projectId');
  if (!projectId) return NextResponse.json({ error: 'thiếu projectId' }, { status: 400 });
  try {
    const grant = requireCapability(await authorizeRequest(projectId), 'task:read');
    const [states, tasks, members] = await Promise.all([
      listWorkflowStates(projectId),
      listTasks(projectId),
      listMemberSummaries(projectId, grant.currentStage),
    ]);
    return NextResponse.json({ states, tasks, grant, members });
  } catch (e) {
    return respondError(e);
  }
}

/** POST /api/tasks — tạo task mới trong 1 project (task:write). */
export async function POST(req: Request) {
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
  const assigneeIds: string[] = Array.isArray(body.assigneeIds) ? body.assigneeIds.filter((x: unknown) => typeof x === 'string') : [];

  try {
    const grant = requireCapability(await authorizeRequest(projectId), 'task:write');
    if (assigneeIds.length > 0) {
      requireCapability(grant, 'task:assign');
      const chk = checkAssignees(assigneeIds, await listMemberSummaries(projectId, grant.currentStage));
      if (!chk.ok) {
        return NextResponse.json({ error: 'Người được giao phải là thành viên còn hiệu lực và có quyền nhận việc.', ineligible: chk.ineligible }, { status: 400 });
      }
    }
    const task = await createTask({
      projectId,
      title,
      statusId: typeof body.statusId === 'string' ? body.statusId : null,
      assigneeIds,
      startAt: typeof body.startAt === 'string' ? body.startAt : null,
      dueAt: typeof body.dueAt === 'string' ? body.dueAt : null,
      order: typeof body.order === 'number' ? body.order : 0,
      stage: isTaskStage(body.stage) ? body.stage : null,
      workspaceId: typeof body.workspaceId === 'string' ? body.workspaceId : null,
      entityId: typeof body.entityId === 'string' ? body.entityId : null,
    });
    return NextResponse.json({ task });
  } catch (e) {
    return respondError(e);
  }
}
