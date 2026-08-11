/**
 * lib/server/tasks.test.ts — VIẾT LẠI 08/08 (p12 NỀN DỮ LIỆU, VIỆC 1 ④).
 *
 * Bản cũ (M-SCOPE 07/08) kiểm "cờ TASK_TABLES_READY còn false + mọi hàm ném lỗi rõ" — đúng cho
 * lúc bảng CHƯA migrate. Nay bảng `Task`/`WorkflowState` ĐÃ CÓ THẬT trong `dev.db`
 * (migration `20260808000002_them_workflowstate_task_externalref`) và cờ đã bật ⇒ test đổi vai:
 * INTEGRATION TEST chạy trọn vòng đời trên Prisma THẬT (tạo user+project tạm → gieo trạng thái
 * mặc định → tạo việc → đổi trạng thái → đọc lại → xoá), tự dọn sạch cuối bài — CÙNG khuôn
 * `credits.test.ts` (file liền kề, cũng Prisma thật + temp row + cleanup).
 *
 * Chạy: node_modules/.bin/sucrase-node lib/server/tasks.test.ts
 */
import assert from 'node:assert';
import { prisma } from './db';
import { TASK_TABLES_READY, listWorkflowStates, listTasks, createTask, updateTask, deleteTask } from './tasks';

let pass = 0;
function ok(label: string) {
  pass += 1;
  console.log(`  ✓ ${label}`);
}

async function main() {
  assert.strictEqual(TASK_TABLES_READY, true);
  ok('cờ TASK_TABLES_READY = true (bảng đã migrate 08/08, không còn là cờ chặn)');

  // user + project tạm — email đóng dấu test để không lẫn dữ liệu thật; dọn ở finally.
  const user = await prisma.user.create({
    data: {
      email: `test-tasks-${Date.now()}-${Math.random().toString(36).slice(2)}@test.local`,
      name: 'Test Tasks',
      passwordHash: 'x',
    },
  });
  const project = await prisma.project.create({
    data: { userId: user.id, name: 'Test Tasks Project', lastEditedBy: user.id },
  });
  try {
    // ① gieo trạng thái mặc định lần đầu
    const states = await listWorkflowStates(project.id);
    assert.strictEqual(states.length, 4);
    assert.deepStrictEqual(
      states.map((s) => s.name),
      ['Chưa làm', 'Đang làm', 'Chờ duyệt', 'Xong'],
    );
    assert.strictEqual(states[3].isDone, true);
    ok('listWorkflowStates gieo đúng 4 trạng thái mặc định, "Xong" mang isDone=true');

    const again = await listWorkflowStates(project.id);
    assert.strictEqual(again.length, 4);
    ok('gọi lại KHÔNG gieo trùng — vẫn đúng 4 trạng thái (idempotent)');

    // ② tạo việc — không truyền statusId thì rơi vào trạng thái đầu
    const t = await createTask({ projectId: project.id, title: 'Việc test p12' });
    assert.strictEqual(t.statusId, states[0].id);
    assert.strictEqual(t.title, 'Việc test p12');
    ok('createTask không truyền statusId → tự vào trạng thái đầu ("Chưa làm")');

    // ③ đổi trạng thái sang "Đang làm" rồi đọc lại từ DB — vòng N6 tạo→đổi→đọc
    await updateTask(t.id, project.id, { statusId: states[1].id });
    const list = await listTasks(project.id);
    assert.strictEqual(list.length, 1);
    assert.strictEqual(list[0].statusId, states[1].id);
    ok('updateTask đổi status → listTasks đọc lại từ DB thấy đúng trạng thái mới');

    // ④ statusId của PROJECT KHÁC phải bị chặn (luật đầu file tasks.ts)
    const otherProject = await prisma.project.create({
      data: { userId: user.id, name: 'Test Tasks Project B', lastEditedBy: user.id },
    });
    try {
      const otherStates = await listWorkflowStates(otherProject.id);
      let threw = false;
      try {
        await updateTask(t.id, project.id, { statusId: otherStates[0].id });
      } catch {
        threw = true;
      }
      assert.ok(threw, 'statusId khác project phải bị từ chối');
      ok('updateTask chặn statusId thuộc project khác (không phải "trạng thái lạ" mà là lỗi)');
    } finally {
      await prisma.$executeRawUnsafe(`DELETE FROM WorkflowState WHERE projectId = '${otherProject.id}'`);
      await prisma.project.delete({ where: { id: otherProject.id } });
    }

    // ④b TaskContext Link (11/08) — 3 field ngữ cảnh round-trip qua DB thật + stage sai bị chặn
    {
      const ctx = await createTask({
        projectId: project.id, title: 'Việc có ngữ cảnh', stage: 'render', workspaceId: 'board', entityId: 'wall-1',
      });
      assert.strictEqual(ctx.stage, 'render');
      assert.strictEqual(ctx.workspaceId, 'board');
      assert.strictEqual(ctx.entityId, 'wall-1');
      const upd = await updateTask(ctx.id, project.id, { stage: null, entityId: null });
      assert.strictEqual(upd.stage, null);
      assert.strictEqual(upd.entityId, null);
      assert.strictEqual(upd.workspaceId, 'board'); // undefined = giữ nguyên
      let threw = false;
      try {
        await updateTask(ctx.id, project.id, { stage: 'sai-gia-tri' as never });
      } catch { threw = true; }
      assert.ok(threw, 'stage ngoài 3 giá trị phải bị từ chối');
      await deleteTask(ctx.id, project.id);
      ok('TaskContext: stage/workspaceId/entityId ghi-đọc đúng, null gỡ được, stage lạ bị chặn');
    }

    // ⑤ xoá việc
    await deleteTask(t.id, project.id);
    const empty = await listTasks(project.id);
    assert.strictEqual(empty.length, 0);
    ok('deleteTask xoá thật — listTasks về 0');
  } finally {
    // dọn SẠCH — task xoá theo cascade project; WorkflowState cũng cascade; user xoá cuối.
    await prisma.project.delete({ where: { id: project.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
    await prisma.$disconnect();
  }

  console.log(`${pass}/${pass} pass (lib/server/tasks.test.ts — integration, dev.db thật, đã tự dọn)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
