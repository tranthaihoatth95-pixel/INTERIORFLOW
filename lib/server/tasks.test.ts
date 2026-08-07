/**
 * lib/server/tasks.test.ts — M-SCOPE VIỆC 2 (07/08).
 *
 * 🔴 Bảng Task/WorkflowState CHƯA có trong dev.db (xem TASK_TABLES_READY ở tasks.ts) — test này
 * KHÔNG chạm DB thật, chỉ kiểm: (1) cửa chặn còn đứng đúng chỗ · (2) schema khai đủ field ·
 * (3) mọi hàm public ném lỗi rõ ràng thay vì âm thầm trả rỗng khi cờ còn tắt.
 * Nghiệm thu N6 "tạo→đổi status→đọc lại" CHỈ chạy được SAU khi chủ dự án bật cờ trên máy thật —
 * xem lệnh trong docblock tasks.ts, KHÔNG bịa output ở đây.
 */
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { TASK_TABLES_READY, listWorkflowStates, listTasks, createTask, updateTask, deleteTask } from './tasks';

let pass = 0;
function test(name: string, fn: () => void) {
  fn();
  pass++;
  console.log(`  ✓ ${name}`);
}
async function testAsync(name: string, fn: () => Promise<void>) {
  await fn();
  pass++;
  console.log(`  ✓ ${name}`);
}

test('cờ TASK_TABLES_READY vẫn false — chưa ai bật ẩu trước khi migrate', () => {
  assert.strictEqual(TASK_TABLES_READY, false);
});

const SCHEMA_PATH = path.resolve(__dirname, '../../prisma/schema.prisma');
const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');

test('schema khai đủ model Task với statusId + projectId', () => {
  const m = schema.match(/model Task \{[\s\S]*?\n\}/);
  assert.ok(m, 'model Task không tìm thấy');
  const body = m![0];
  for (const f of ['projectId', 'title', 'statusId', 'assigneeIds', 'startAt', 'dueAt', 'order']) {
    assert.ok(new RegExp(`\\b${f}\\b`).test(body), `thiếu field ${f}`);
  }
});

test('schema khai đủ model WorkflowState với isDone/isActive', () => {
  const m = schema.match(/model WorkflowState \{[\s\S]*?\n\}/);
  assert.ok(m, 'model WorkflowState không tìm thấy');
  const body = m![0];
  for (const f of ['projectId', 'name', 'order', 'isActive', 'isDone']) {
    assert.ok(new RegExp(`\\b${f}\\b`).test(body), `thiếu field ${f}`);
  }
});

async function assertThrowsClear(fn: () => Promise<unknown>) {
  let threw = false;
  try {
    await fn();
  } catch (e) {
    threw = true;
    assert.ok(e instanceof Error && /db push|prisma generate|dev\.db/.test(e.message), 'lỗi phải nói rõ cách sửa');
  }
  assert.ok(threw, 'phải ném lỗi khi TASK_TABLES_READY=false, không được âm thầm trả rỗng');
}

async function main() {
  await testAsync('listWorkflowStates ném lỗi rõ khi bảng chưa migrate', () => assertThrowsClear(() => listWorkflowStates('p1')));
  await testAsync('listTasks ném lỗi rõ khi bảng chưa migrate', () => assertThrowsClear(() => listTasks('p1')));
  await testAsync('createTask ném lỗi rõ khi bảng chưa migrate', () =>
    assertThrowsClear(() => createTask({ projectId: 'p1', title: 'x' })),
  );
  await testAsync('updateTask ném lỗi rõ khi bảng chưa migrate', () => assertThrowsClear(() => updateTask('t1', 'p1', { title: 'y' })));
  await testAsync('deleteTask ném lỗi rõ khi bảng chưa migrate', () => assertThrowsClear(() => deleteTask('t1', 'p1')));
  console.log(`${pass}/${pass} pass (lib/server/tasks.test.ts)`);
}

main();
