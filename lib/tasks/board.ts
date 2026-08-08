/**
 * lib/tasks/board.ts — logic THUẦN cho màn "Bảng việc" (client đầu tiên tiêu thụ
 * `app/api/tasks/*`, xem `docs/DOI-CHIEU-42-SPEC-2026-08-08.md` §1#4).
 *
 * Tách khỏi component để test được bằng `sucrase-node lib/tasks/board.test.ts`:
 * nhóm task theo WorkflowState, sắp thứ tự, nhãn hạn (trễ/hôm nay/ngày), chữ tắt
 * avatar, và bước đổi trạng thái trái/phải (nút — kéo-thả chỉ là đường TẮT, G8).
 *
 * ⚠️ Chỉ `import type` từ lib/server/tasks — kiểu DTO là hợp đồng chung client/server,
 * type-import bị xoá lúc build nên KHÔNG kéo prisma vào bundle client.
 */

import type { TaskRow, WorkflowStateRow } from '../server/tasks';

export interface BoardColumn {
  state: WorkflowStateRow;
  tasks: TaskRow[];
}

/** So sánh task trong 1 cột: `order` tăng dần → `createdAt` cũ trước → id (ổn định). */
export function compareTasks(a: TaskRow, b: TaskRow): number {
  if (a.order !== b.order) return a.order - b.order;
  if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * Nhóm task vào cột theo WorkflowState (cột theo `order` tăng dần).
 * `orphans` = task có `statusId` không khớp state nào (DB đảm bảo FK nên bình thường
 * là rỗng — nhưng client có thể cầm dữ liệu lệch phiên; không lặng lẽ vứt).
 */
export function groupTasksByState(
  states: WorkflowStateRow[],
  tasks: TaskRow[],
): { columns: BoardColumn[]; orphans: TaskRow[] } {
  const sortedStates = [...states].sort((a, b) => (a.order !== b.order ? a.order - b.order : a.name.localeCompare(b.name)));
  const byId = new Map<string, TaskRow[]>();
  for (const s of sortedStates) byId.set(s.id, []);
  const orphans: TaskRow[] = [];
  for (const t of tasks) {
    const bucket = byId.get(t.statusId);
    if (bucket) bucket.push(t);
    else orphans.push(t);
  }
  const columns = sortedStates.map((state) => ({ state, tasks: (byId.get(state.id) ?? []).sort(compareTasks) }));
  return { columns, orphans: orphans.sort(compareTasks) };
}

/** id trạng thái đứng cạnh (trái = -1, phải = +1) để nút ‹ › đổi cột. Hết biên → null. */
export function adjacentStatusId(
  states: WorkflowStateRow[],
  currentId: string,
  dir: -1 | 1,
): string | null {
  const sorted = [...states].sort((a, b) => a.order - b.order);
  const i = sorted.findIndex((s) => s.id === currentId);
  if (i < 0) return null;
  const j = i + dir;
  if (j < 0 || j >= sorted.length) return null;
  return sorted[j].id;
}

/** Nhãn hạn của thẻ — mock "Bảng việc.dc.html": trễ → màu báo "Trễ N ngày", hôm nay → "Hôm nay",
 * còn lại → "d/m". Trả cấu trúc, chữ VI/EN ghép ở component (song ngữ qua useT). */
export type DueInfo =
  | { kind: 'none' }
  | { kind: 'overdue'; days: number }
  | { kind: 'today' }
  | { kind: 'date'; day: number; month: number };

export function dueInfo(dueAt: string | null, now: Date): DueInfo {
  if (!dueAt) return { kind: 'none' };
  const due = new Date(dueAt);
  if (Number.isNaN(due.getTime())) return { kind: 'none' };
  // So theo NGÀY lịch (local) — hạn 23:00 hôm nay vẫn là "Hôm nay", không phải "trễ 0.x ngày".
  const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((dayStart(due) - dayStart(now)) / 86_400_000);
  if (diffDays < 0) return { kind: 'overdue', days: -diffDays };
  if (diffDays === 0) return { kind: 'today' };
  return { kind: 'date', day: due.getDate(), month: due.getMonth() + 1 };
}

/** Chữ tắt avatar kiểu mock ("Ngọc Trâm" → "NT"): chữ đầu của từ đầu + từ cuối. */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  const first = words[0][0] ?? '';
  const last = words.length > 1 ? words[words.length - 1][0] ?? '' : '';
  return (first + last).toUpperCase();
}

/**
 * Màu chấm đầu cột — token app thật (globals.css KHÔNG có bộ --l-* của mock):
 * cột đầu (chưa làm) → --t4 · cột isDone → --success · cột áp cuối trước Xong → --warning
 * (mock: "Chờ duyệt" vàng) · các cột giữa còn lại → --accent (mock: "Đang làm" tím).
 */
export function stateDotVar(state: WorkflowStateRow, index: number, states: WorkflowStateRow[]): string {
  if (state.isDone) return 'var(--success)';
  if (index === 0) return 'var(--t4)';
  const lastNotDone = states.reduce((acc, s, i) => (!s.isDone ? i : acc), -1);
  if (index === lastNotDone && index > 1) return 'var(--warning)';
  return 'var(--accent)';
}

/** Đếm việc trễ hạn (badge đỏ trên thanh lọc, mock dòng "2 việc trễ hạn") — bỏ cột đã Xong. */
export function countOverdue(states: WorkflowStateRow[], tasks: TaskRow[], now: Date): number {
  const doneIds = new Set(states.filter((s) => s.isDone).map((s) => s.id));
  return tasks.filter((t) => !doneIds.has(t.statusId) && dueInfo(t.dueAt, now).kind === 'overdue').length;
}

/** Lọc theo chuỗi tìm (khớp tiêu đề, không phân hoa/thường). */
export function filterTasks(tasks: TaskRow[], query: string): TaskRow[] {
  const q = query.trim().toLowerCase();
  if (!q) return tasks;
  return tasks.filter((t) => t.title.toLowerCase().includes(q));
}
