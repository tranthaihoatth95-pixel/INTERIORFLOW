/**
 * lib/tasks/board.test.ts — kiểm logic thuần màn Bảng việc. Chạy:
 *   node_modules/.bin/sucrase-node lib/tasks/board.test.ts
 */
import {
  groupTasksByState,
  adjacentStatusId,
  dueInfo,
  initialsOf,
  stateDotVar,
  countOverdue,
  filterTasks,
  compareTasks,
} from './board';
import type { TaskRow, WorkflowStateRow } from '../server/tasks';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

function st(id: string, name: string, order: number, isDone = false): WorkflowStateRow {
  return { id, projectId: 'p1', name, order, isActive: true, isDone };
}
function task(id: string, statusId: string, order = 0, extra: Partial<TaskRow> = {}): TaskRow {
  return {
    id, projectId: 'p1', title: `Việc ${id}`, statusId, assigneeIds: [],
    startAt: null, dueAt: null, order,
    createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-01T00:00:00.000Z',
    ...extra,
  };
}

// bộ 4 trạng thái mặc định (lib/server/tasks.ts DEFAULT_WORKFLOW_STATES) — cố ý xáo thứ tự mảng
const states = [st('s2', 'Đang làm', 1), st('s4', 'Xong', 3, true), st('s1', 'Chưa làm', 0), st('s3', 'Chờ duyệt', 2)];

console.log('\n[1] groupTasksByState — cột theo order, task đúng cột');
{
  const tasks = [task('a', 's2'), task('b', 's1'), task('c', 's4'), task('d', 's1', 5)];
  const { columns, orphans } = groupTasksByState(states, tasks);
  ok('4 cột', columns.length === 4);
  ok('cột theo order tăng dần', columns.map((c) => c.state.id).join(',') === 's1,s2,s3,s4');
  ok('s1 có 2 task', columns[0].tasks.length === 2);
  ok('s1 sắp theo order (b trước d)', columns[0].tasks.map((t) => t.id).join(',') === 'b,d');
  ok('s3 rỗng vẫn có cột', columns[2].tasks.length === 0);
  ok('không orphan', orphans.length === 0);
}

console.log('\n[2] orphan — statusId lạ KHÔNG bị lặng lẽ vứt');
{
  const { columns, orphans } = groupTasksByState(states, [task('x', 'khong-ton-tai')]);
  ok('cột nào cũng rỗng', columns.every((c) => c.tasks.length === 0));
  ok('orphan giữ lại 1', orphans.length === 1 && orphans[0].id === 'x');
}

console.log('\n[3] compareTasks — order → createdAt → id');
{
  const a = task('a', 's1', 1, { createdAt: '2026-08-02T00:00:00.000Z' });
  const b = task('b', 's1', 1, { createdAt: '2026-08-01T00:00:00.000Z' });
  ok('order thắng trước', compareTasks(task('z', 's1', 0), a) < 0);
  ok('cùng order → createdAt cũ trước', compareTasks(b, a) < 0);
  ok('cùng cả hai → id', compareTasks(task('a', 's1'), task('b', 's1')) < 0);
}

console.log('\n[4] adjacentStatusId — nút ‹ › đổi cột');
{
  ok('s2 sang phải = s3', adjacentStatusId(states, 's2', 1) === 's3');
  ok('s2 sang trái = s1', adjacentStatusId(states, 's2', -1) === 's1');
  ok('s1 sang trái = null (biên)', adjacentStatusId(states, 's1', -1) === null);
  ok('s4 sang phải = null (biên)', adjacentStatusId(states, 's4', 1) === null);
  ok('id lạ = null', adjacentStatusId(states, 'nope', 1) === null);
}

console.log('\n[5] dueInfo — so theo NGÀY lịch local');
{
  const now = new Date(2026, 7, 8, 9, 30); // 08/08/2026 09:30 local
  ok('null = none', dueInfo(null, now).kind === 'none');
  ok('chuỗi hỏng = none', dueInfo('khong-phai-ngay', now).kind === 'none');
  const today = dueInfo(new Date(2026, 7, 8, 23, 0).toISOString(), now);
  ok('hạn 23:00 hôm nay = today (không phải trễ)', today.kind === 'today');
  const late = dueInfo(new Date(2026, 7, 6, 23, 59).toISOString(), now);
  ok('hạn 06/08 = trễ 2 ngày', late.kind === 'overdue' && late.days === 2);
  const future = dueInfo(new Date(2026, 7, 12, 0, 0).toISOString(), now);
  ok('hạn 12/8 = date 12/8', future.kind === 'date' && future.day === 12 && future.month === 8);
}

console.log('\n[6] initialsOf — chữ tắt kiểu mock');
{
  ok('"Ngọc Trâm" → NT', initialsOf('Ngọc Trâm') === 'NT');
  ok('"Minh Hoàng" → MH', initialsOf('Minh Hoàng') === 'MH');
  ok('1 từ → 1 chữ', initialsOf('Hoà') === 'H');
  ok('3 từ lấy đầu+cuối', initialsOf('Trần Thái Hoà') === 'TH');
  ok('rỗng → ?', initialsOf('   ') === '?');
}

console.log('\n[7] stateDotVar — map token đúng mock 4 cột mặc định');
{
  const sorted = [...states].sort((a, b) => a.order - b.order);
  ok('Chưa làm → --t4', stateDotVar(sorted[0], 0, sorted) === 'var(--t4)');
  ok('Đang làm → --accent', stateDotVar(sorted[1], 1, sorted) === 'var(--accent)');
  ok('Chờ duyệt → --warning', stateDotVar(sorted[2], 2, sorted) === 'var(--warning)');
  ok('Xong → --success', stateDotVar(sorted[3], 3, sorted) === 'var(--success)');
}

console.log('\n[8] countOverdue — bỏ qua việc đã Xong');
{
  const now = new Date(2026, 7, 8);
  const lateIso = new Date(2026, 7, 5).toISOString();
  const tasks = [
    task('a', 's2', 0, { dueAt: lateIso }),
    task('b', 's4', 0, { dueAt: lateIso }), // đã Xong — không đếm
    task('c', 's1', 0, { dueAt: new Date(2026, 7, 20).toISOString() }),
  ];
  ok('chỉ đếm 1 việc trễ chưa xong', countOverdue(states, tasks, now) === 1);
}

console.log('\n[9] filterTasks — khớp tiêu đề, không phân hoa/thường');
{
  const tasks = [task('a', 's1', 0, { title: 'Bóc tách vật liệu bếp' }), task('b', 's1', 0, { title: 'Đo thông tầng' })];
  ok('rỗng = giữ nguyên', filterTasks(tasks, '  ').length === 2);
  ok('"VẬT LIỆU" khớp 1', filterTasks(tasks, 'VẬT LIỆU').length === 1);
  ok('không khớp = 0', filterTasks(tasks, 'xyz').length === 0);
}

console.log(`\n${pass} pass · ${fail} fail`);
if (fail > 0) process.exit(1);
