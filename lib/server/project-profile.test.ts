/**
 * lib/server/project-profile.test.ts — INTEGRATION TEST trên dev.db (cùng khuôn tasks.test.ts):
 * Bảng khởi tạo dự án 12/08 — vòng đầy đủ: tạo project tạm → upsert profile → đọc lại →
 * Scaffolder gợi ý → gieo việc kèm `stage` → đếm → dọn sạch dữ liệu test ở finally.
 *
 * Chạy: node_modules/.bin/sucrase-node lib/server/project-profile.test.ts
 */
import assert from 'node:assert';
import { prisma } from './db';
import { getProjectProfile, upsertProjectProfile } from './project-profile';
import { listWorkflowStates, listTasks, createTask } from './tasks';
import { suggestScaffold } from '../tasks/scaffolder';

// KHÔNG import BOARD_TEMPLATES từ components/ ở đây — TaskBoardScreen dùng alias `@/` mà
// sucrase-node không resolve. Test này chỉ cần SỐ việc mỗi bộ (5) — UI thật mới đọc tiêu đề.
const TASKS_PER_TEMPLATE = 5;

let pass = 0;
function ok(label: string) {
  pass += 1;
  console.log(`  ✓ ${label}`);
}

async function main() {
  const user = await prisma.user.create({
    data: {
      email: `test-profile-${Date.now()}-${Math.random().toString(36).slice(2)}@test.local`,
      name: 'Test Profile',
      passwordHash: 'x',
    },
  });
  const project = await prisma.project.create({
    data: { userId: user.id, name: 'Test Profile Project', lastEditedBy: user.id },
  });
  try {
    // ① dự án chưa khai → profile null (X2: trống là hợp lệ, KHÔNG tự đẻ hàng rỗng)
    assert.strictEqual(await getProjectProfile(project.id), null);
    ok('dự án chưa khai → getProjectProfile trả null, không tự tạo hàng');

    // ② upsert lần đầu (create) — điền một phần, phần còn lại phải là null
    const p1 = await upsertProjectProfile(project.id, {
      loaiHinh: 'khach-san',
      dienTichM2: 500,
      mocBanGiao: '2026-11-15T00:00:00.000Z',
    });
    assert.strictEqual(p1.loaiHinh, 'khach-san');
    assert.strictEqual(p1.dienTichM2, 500);
    assert.strictEqual(p1.nganSach, null);
    assert.ok(p1.mocBanGiao?.startsWith('2026-11-15'));
    ok('upsert lần đầu ghi đúng field điền, field bỏ trống là null');

    // ③ upsert lần hai (update) — patch từng phần, field vắng mặt GIỮ NGUYÊN, null = xoá
    const p2 = await upsertProjectProfile(project.id, { nganSach: '  2 tỷ  ', dienTichM2: null });
    assert.strictEqual(p2.nganSach, '2 tỷ'); // trim
    assert.strictEqual(p2.dienTichM2, null); // null = xoá
    assert.strictEqual(p2.loaiHinh, 'khach-san'); // vắng mặt = giữ nguyên
    ok('patch từng phần: vắng mặt giữ nguyên · null xoá · chuỗi được trim');

    // ④ đầu vào sai → lỗi rõ ràng, DB không đổi
    let threw = false;
    try {
      await upsertProjectProfile(project.id, { dienTichM2: -5 });
    } catch {
      threw = true;
    }
    assert.ok(threw);
    assert.strictEqual((await getProjectProfile(project.id))?.dienTichM2, null);
    ok('dienTichM2 âm bị từ chối, DB giữ nguyên');
    threw = false;
    try {
      await upsertProjectProfile(project.id, { mocBanGiao: 'không-phải-ngày' });
    } catch {
      threw = true;
    }
    assert.ok(threw);
    ok('mocBanGiao không parse được → lỗi rõ, không ghi bừa');

    // ⑤ Scaffolder đọc profile thật → gieo việc kèm stage → đếm đúng
    const profile = await getProjectProfile(project.id);
    const suggestions = suggestScaffold(profile ?? {});
    assert.deepStrictEqual(
      suggestions.map((s) => s.templateKey),
      ['technical', 'fitout'],
    );
    ok('khach-san → Scaffolder gợi ý technical + fitout (map tường minh)');

    await listWorkflowStates(project.id); // gieo 4 trạng thái mặc định
    let expected = 0;
    for (const s of suggestions) {
      for (let i = 0; i < TASKS_PER_TEMPLATE; i += 1) {
        await createTask({ projectId: project.id, title: `Việc ${s.templateKey} #${i + 1}`, stage: s.stage });
        expected += 1;
      }
    }
    const tasks = await listTasks(project.id);
    assert.strictEqual(tasks.length, expected);
    assert.strictEqual(expected, 10); // 2 template × 5 việc
    assert.ok(tasks.every((t) => t.stage === 'concept')); // technical & fitout đều stage concept
    ok(`gieo ${expected} việc từ 2 template, việc nào cũng mang stage (TaskContext Link)`);

    // ⑥ xoá project → profile cascade sạch (onDelete: Cascade)
    const probe = await prisma.project.create({
      data: { userId: user.id, name: 'Test Profile Cascade', lastEditedBy: user.id },
    });
    await upsertProjectProfile(probe.id, { ghiChu: 'sẽ bị cascade' });
    await prisma.project.delete({ where: { id: probe.id } });
    assert.strictEqual(await getProjectProfile(probe.id), null);
    ok('xoá project → profile cascade theo, không mồ côi');
  } finally {
    // dọn sạch dữ liệu test — task/state/profile cascade theo project
    await prisma.project.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  }
  console.log(`\nproject-profile.test: ${pass} pass`);
}

main()
  .catch((e) => {
    console.error('FAIL:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
