/**
 * lib/server/tasks.ts — CRUD cho `Task`/`WorkflowState` nội bộ IF (M-SCOPE VIỆC 2, 07/08).
 *
 * ⚠️ status KHÔNG phải String tự do — mỗi Task trỏ `statusId` vào `WorkflowState` của ĐÚNG
 *    project đó. Đổi trạng thái ngoài bộ trạng thái của project (statusId sai project) là lỗi,
 *    không phải "trạng thái lạ".
 * ⚠️ KHÔNG đọc/ghi `Project.currentStage`/`lib/phases.ts` ở đây — xem cảnh báo trong phiếu.
 *
 * ✅ ĐÃ MIGRATE 08/08 (p12 NỀN DỮ LIỆU) — bảng `Task`/`WorkflowState` nay CÓ THẬT trong
 *    `dev.db` (migration `20260808000002_them_workflowstate_task_externalref`, sinh bằng
 *    `prisma migrate diff` + áp bằng `prisma db execute` + `migrate resolve` — đường giữ dữ
 *    liệu, KHÔNG reset; backup `prisma/dev.db.bak-p12-nendl-2026-08-08`). Cờ dưới đã bật;
 *    `tasks.test.ts` nay là INTEGRATION TEST chạy CRUD thật trên dev.db (tự dọn cuối bài).
 */

import { prisma } from './db';

/** Xem khối chú thích đầu file. Bật 08/08 sau khi migration áp thật vào `dev.db`. */
export const TASK_TABLES_READY = true;

export interface WorkflowStateRow {
  id: string;
  projectId: string;
  name: string;
  order: number;
  isActive: boolean;
  isDone: boolean;
}

export interface TaskRow {
  id: string;
  projectId: string;
  title: string;
  statusId: string;
  assigneeIds: string[];
  startAt: string | null;
  dueAt: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface WorkflowStateDelegate {
  findMany(args: unknown): Promise<Array<Omit<WorkflowStateRow, 'projectId'> & { projectId: string }>>;
  create(args: unknown): Promise<{ id: string }>;
  findUnique(args: unknown): Promise<{ id: string; projectId: string } | null>;
}
interface TaskDelegate {
  findMany(args: unknown): Promise<
    Array<{
      id: string;
      projectId: string;
      title: string;
      statusId: string;
      assigneeIds: string;
      startAt: Date | null;
      dueAt: Date | null;
      order: number;
      createdAt: Date;
      updatedAt: Date;
    }>
  >;
  create(args: unknown): Promise<{ id: string }>;
  update(args: unknown): Promise<{ id: string; projectId: string; statusId: string }>;
  delete(args: unknown): Promise<unknown>;
  findUnique(args: unknown): Promise<{ id: string; projectId: string } | null>;
}

function tables(what: string): { task: TaskDelegate; workflowState: WorkflowStateDelegate } {
  if (!TASK_TABLES_READY) {
    throw new Error(
      `[Task] Chưa dùng được ${what}: bảng Task/WorkflowState mới có trong schema, CHƯA có trong dev.db. ` +
        'Chủ dự án chạy TRÊN MÁY THẬT, khi không còn dev server nào mở: ' +
        'sqlite3 dev.db ".backup \'dev.db.bak-truoc-task\'" && npx prisma db push && npx prisma generate ' +
        '— rồi đổi TASK_TABLES_READY thành true (lib/server/tasks.ts).',
    );
  }
  const p = prisma as unknown as { task?: TaskDelegate; workflowState?: WorkflowStateDelegate };
  if (!p.task || !p.workflowState) {
    throw new Error(`[Task] Cờ đã bật nhưng Prisma client chưa biết bảng Task/WorkflowState — thiếu "npx prisma generate". (${what})`);
  }
  return { task: p.task, workflowState: p.workflowState };
}

/** 08/08 (p12) — statusId phải thuộc ĐÚNG project (hợp đồng docblock đầu file, nay có code kiểm). */
async function assertStatusBelongsToProject(statusId: string, projectId: string): Promise<void> {
  const { workflowState } = tables('assertStatusBelongsToProject');
  const st = await workflowState.findUnique({ where: { id: statusId } });
  if (!st || st.projectId !== projectId) {
    throw new Error('[Task] statusId không thuộc bộ trạng thái của project này.');
  }
}

/** 4 trạng thái mặc định gieo cho project mới chưa từng khai bộ trạng thái riêng. */
const DEFAULT_WORKFLOW_STATES = [
  { name: 'Chưa làm', order: 0, isDone: false },
  { name: 'Đang làm', order: 1, isDone: false },
  { name: 'Chờ duyệt', order: 2, isDone: false },
  { name: 'Xong', order: 3, isDone: true },
];

/** Đọc bộ trạng thái của project; gieo mặc định lần đầu nếu project chưa có state nào. */
export async function listWorkflowStates(projectId: string): Promise<WorkflowStateRow[]> {
  const { workflowState } = tables('listWorkflowStates');
  const existing = await workflowState.findMany({
    where: { projectId },
    orderBy: { order: 'asc' },
  });
  if (existing.length > 0) return existing as WorkflowStateRow[];
  for (const s of DEFAULT_WORKFLOW_STATES) {
    await workflowState.create({ data: { projectId, ...s } });
  }
  return workflowState.findMany({ where: { projectId }, orderBy: { order: 'asc' } }) as Promise<WorkflowStateRow[]>;
}

function toTaskRow(t: {
  id: string;
  projectId: string;
  title: string;
  statusId: string;
  assigneeIds: string;
  startAt: Date | null;
  dueAt: Date | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}): TaskRow {
  let assigneeIds: string[] = [];
  try {
    const parsed = JSON.parse(t.assigneeIds || '[]');
    if (Array.isArray(parsed)) assigneeIds = parsed.filter((x) => typeof x === 'string');
  } catch {
    assigneeIds = [];
  }
  return {
    id: t.id,
    projectId: t.projectId,
    title: t.title,
    statusId: t.statusId,
    assigneeIds,
    startAt: t.startAt ? t.startAt.toISOString() : null,
    dueAt: t.dueAt ? t.dueAt.toISOString() : null,
    order: t.order,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

export async function listTasks(projectId: string): Promise<TaskRow[]> {
  const { task } = tables('listTasks');
  const rows = await task.findMany({ where: { projectId }, orderBy: [{ statusId: 'asc' }, { order: 'asc' }] });
  return rows.map(toTaskRow);
}

export interface CreateTaskInput {
  projectId: string;
  title: string;
  statusId?: string | null; // null/undefined = cột đầu tiên (order thấp nhất) của project
  assigneeIds?: string[];
  startAt?: string | null;
  dueAt?: string | null;
  order?: number;
}

export async function createTask(input: CreateTaskInput): Promise<TaskRow> {
  const { task } = tables('createTask');
  const title = input.title.trim();
  if (!title) throw new Error('[Task] title rỗng.');
  let statusId = input.statusId ?? null;
  if (!statusId) {
    const states = await listWorkflowStates(input.projectId);
    const first = states.find((s) => s.isActive) ?? states[0];
    if (!first) throw new Error('[Task] project chưa có WorkflowState nào (kể cả mặc định).');
    statusId = first.id;
  } else {
    // 08/08 (p12) — hợp đồng đầu file ("statusId sai project là lỗi") trước đây CHỈ nằm trong
    // docblock, code không kiểm ⇒ truyền statusId của project khác vẫn ghi êm. Vá cả 2 cửa
    // (create/update) bằng cùng 1 hàm kiểm.
    await assertStatusBelongsToProject(statusId, input.projectId);
  }
  const created = await task.create({
    data: {
      projectId: input.projectId,
      title,
      statusId,
      assigneeIds: JSON.stringify(input.assigneeIds ?? []),
      startAt: input.startAt ? new Date(input.startAt) : null,
      dueAt: input.dueAt ? new Date(input.dueAt) : null,
      order: input.order ?? 0,
    },
  });
  const rows = await task.findMany({ where: { id: created.id } });
  return toTaskRow(rows[0]);
}

export interface UpdateTaskInput {
  title?: string;
  statusId?: string;
  assigneeIds?: string[];
  startAt?: string | null;
  dueAt?: string | null;
  order?: number;
}

/** projectId truyền vào để CHẶN sửa Task của project khác qua id đoán mò (không đi qua access.ts ở tầng này — route gọi assertProjectAccess trước). */
export async function updateTask(id: string, projectId: string, patch: UpdateTaskInput): Promise<TaskRow> {
  const { task } = tables('updateTask');
  const existing = await task.findUnique({ where: { id } });
  if (!existing || existing.projectId !== projectId) throw new Error('[Task] không tìm thấy trong project này.');
  const data: Record<string, unknown> = {};
  if (patch.title !== undefined) data.title = patch.title.trim();
  if (patch.statusId !== undefined) {
    await assertStatusBelongsToProject(patch.statusId, projectId); // xem chú thích ở createTask
    data.statusId = patch.statusId;
  }
  if (patch.assigneeIds !== undefined) data.assigneeIds = JSON.stringify(patch.assigneeIds);
  if (patch.startAt !== undefined) data.startAt = patch.startAt ? new Date(patch.startAt) : null;
  if (patch.dueAt !== undefined) data.dueAt = patch.dueAt ? new Date(patch.dueAt) : null;
  if (patch.order !== undefined) data.order = patch.order;
  await task.update({ where: { id }, data });
  const rows = await task.findMany({ where: { id } });
  return toTaskRow(rows[0]);
}

export async function deleteTask(id: string, projectId: string): Promise<void> {
  const { task } = tables('deleteTask');
  const existing = await task.findUnique({ where: { id } });
  if (!existing || existing.projectId !== projectId) throw new Error('[Task] không tìm thấy trong project này.');
  await task.delete({ where: { id } });
}
