import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getSessionUser } from '@/lib/server/auth';
import { assertProjectAccess, accessErrorPayload } from '@/lib/server/access';
import { listWorkflowStates, createTask, updateTask } from '@/lib/server/tasks';
import { EXTERNAL_REF_TABLE_READY, findCoreEntity, linkExternalRef } from '@/lib/integrations/external-ref';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/lark-tasks/:recordId/status — M-SCOPE VIỆC 6 (07/08): kéo-thả Kanban trong
 * `LarkPanels.tsx` gọi route này để ĐỔI TRẠNG THÁI, ghi vào `Task` NỘI BỘ (không đụng Larkbase —
 * PULL-ONLY tuyệt đối vẫn giữ nguyên, xem xung đột đã chặn ở VIỆC 4/`lark-write.ts`).
 *
 * Thẻ Kanban là bản ghi mirror `LarkTaskRef` (chỉ đọc), KHÔNG có Task nội bộ tương ứng cho tới
 * lần kéo-thả ĐẦU TIÊN — route này get-or-create: resolve `larkProjectCode` của task →
 * `Project.larkProjectCode` khớp trong IF → tạo/nối `Task` nội bộ qua `ExternalRef{system:'lark',
 * entityType:'task'}` (idempotent, lần kéo sau tái dùng đúng Task đã tạo).
 *
 * 🔴 CHƯA CHẠY ĐƯỢC — phụ thuộc CẢ `Task`/`WorkflowState` (VIỆC 2) LẪN `ExternalRef` (L-EXT1) đều
 * chưa migrate trong `dev.db`. Ném lỗi rõ (qua `tables()`/`externalRefTable()` gate sẵn có), không
 * âm thầm no-op.
 */
export async function PATCH(req: Request, { params }: { params: { recordId: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { recordId } = params;
  const body = await req.json().catch(() => ({}));
  const status = typeof body.status === 'string' ? body.status.trim() : '';
  if (!recordId || !status) return NextResponse.json({ error: 'thiếu recordId hoặc status' }, { status: 400 });

  try {
    const larkTask = await prisma.larkTaskRef.findUnique({ where: { larkRecordId: recordId } });
    if (!larkTask) return NextResponse.json({ error: 'Không tìm thấy task Lark này trong mirror.' }, { status: 404 });
    if (!larkTask.larkProjectCode) {
      return NextResponse.json(
        { error: 'Task Lark này chưa có "Mã DA" — không suy ra được Project nội bộ nào để lưu trạng thái.' },
        { status: 409 },
      );
    }

    const project = await prisma.project.findFirst({
      where: { larkProjectCode: larkTask.larkProjectCode, deletedAt: null },
      select: { id: true },
    });
    if (!project) {
      return NextResponse.json(
        { error: `Mã DA "${larkTask.larkProjectCode}" chưa liên kết với Project nào trong IF — vào Cài đặt dự án để liên kết trước.` },
        { status: 409 },
      );
    }

    await assertProjectAccess(user.id, project.id, 'drafter');

    // Trạng thái đích: khớp theo TÊN (không phân biệt hoa/thường) với WorkflowState của project;
    // 3 cột Kanban hôm nay ('Đang làm'/'Hoàn thành'/'Ghi nhận') khác 4 trạng thái mặc định IF gieo
    // (VIỆC 2) — KHÔNG áp đặt trùng, tự tạo cột mới nếu project chưa có tên đó (đúng luật
    // WorkflowState "mỗi dự án tự khai bộ trạng thái riêng").
    const states = await listWorkflowStates(project.id);
    let target = states.find((s) => s.name.toLowerCase() === status.toLowerCase());
    if (!target) {
      const table = (prisma as unknown as { workflowState: { create(a: unknown): Promise<{ id: string }> } }).workflowState;
      const created = await table.create({
        data: { projectId: project.id, name: status, order: states.length, isDone: false },
      });
      target = { id: created.id, projectId: project.id, name: status, order: states.length, isActive: true, isDone: false };
    }

    // Get-or-create Task nội bộ nối với đúng bản ghi Lark này qua ExternalRef.
    let taskId: string | null = null;
    if (EXTERNAL_REF_TABLE_READY) {
      const core = await findCoreEntity({ system: 'lark', externalId: recordId });
      if (core && core.entityType === 'task') taskId = core.entityId;
    }
    if (!taskId) {
      const created = await createTask({ projectId: project.id, title: larkTask.task, statusId: target.id });
      taskId = created.id;
      if (EXTERNAL_REF_TABLE_READY) {
        await linkExternalRef({ system: 'lark', externalId: recordId }, { entityType: 'task', entityId: taskId });
      }
    } else {
      await updateTask(taskId, project.id, { statusId: target.id });
    }

    // Mirror LarkTaskRef.status cập nhật LUÔN để card không "nhảy lại chỗ cũ" tới lần sync sau —
    // đây KHÔNG phải ghi ra Larkbase thật (route sync riêng mới chạm Lark API), chỉ là bản đọc
    // nội bộ tự phản chiếu quyết định của chính IF.
    await prisma.larkTaskRef.update({ where: { larkRecordId: recordId }, data: { status } });

    return NextResponse.json({ ok: true, taskId, statusId: target.id });
  } catch (e) {
    const p = accessErrorPayload(e);
    if (p) return NextResponse.json({ error: p.message }, { status: p.status });
    return NextResponse.json({ error: e instanceof Error ? e.message : 'lỗi không rõ' }, { status: 500 });
  }
}
