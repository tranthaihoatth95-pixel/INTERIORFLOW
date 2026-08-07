/**
 * lib/server/draft-project.test.ts — p12 NỀN DỮ LIỆU (08/08), chốt chặn G-M14-01.
 *
 * Hai tầng kiểm:
 *  ① INTEGRATION (Prisma thật, dev.db, tự dọn — khuôn credits.test.ts): `ensureDraftProject`
 *     get-or-create đúng, idempotent, có ProjectMember owner.
 *  ② CẤU TRÚC (đọc source thật — khuôn StoreHydrator.test.ts): POST /api/flows PHẢI đi qua
 *     `ensureDraftProject` khi thiếu projectId, và KHÔNG còn ghi `projectId: newProjectId`
 *     thẳng nữa — ai gỡ dòng fallback là test đỏ, đường đẻ mồ côi không mở lại lặng lẽ được.
 *     (Không dựng được route handler thật trong sucrase-node — cần session/cookie.)
 *
 * Chạy: node_modules/.bin/sucrase-node lib/server/draft-project.test.ts
 */
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { prisma } from './db';
import { ensureDraftProject, DRAFT_PROJECT_NAME } from './draft-project';

let pass = 0;
function ok(label: string) {
  pass += 1;
  console.log(`  ✓ ${label}`);
}

async function main() {
  /* ---- ① integration ---- */
  const user = await prisma.user.create({
    data: {
      email: `test-draft-${Date.now()}-${Math.random().toString(36).slice(2)}@test.local`,
      name: 'Test Draft',
      passwordHash: 'x',
    },
  });
  try {
    const id1 = await ensureDraftProject(user.id);
    const p1 = await prisma.project.findUnique({ where: { id: id1 }, include: { members: true } });
    assert.ok(p1 && p1.name === DRAFT_PROJECT_NAME && p1.userId === user.id);
    ok('lần đầu: tạo dự án "Nháp" đúng tên, đúng chủ');
    assert.ok(p1!.members.some((m) => m.userId === user.id && m.role === 'owner'));
    ok('có ProjectMember owner (cùng khuôn POST type:project — không quên member)');

    const id2 = await ensureDraftProject(user.id);
    assert.strictEqual(id2, id1);
    const count = await prisma.project.count({ where: { userId: user.id, name: DRAFT_PROJECT_NAME, deletedAt: null } });
    assert.strictEqual(count, 1);
    ok('lần hai: trả ĐÚNG id cũ, không đẻ "Nháp" thứ hai (idempotent)');
  } finally {
    await prisma.project.deleteMany({ where: { userId: user.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
  }

  /* ---- ② cấu trúc route ---- */
  const routeSrc = fs.readFileSync(path.resolve(__dirname, '../../app/api/flows/route.ts'), 'utf8');
  assert.ok(/import\s*\{\s*ensureDraftProject\s*\}\s*from\s*'@\/lib\/server\/draft-project'/.test(routeSrc));
  ok('route.ts import ensureDraftProject');
  assert.ok(/newProjectId\s*\?\?\s*\(await ensureDraftProject\(user\.id\)\)/.test(routeSrc));
  ok('route.ts fallback `newProjectId ?? ensureDraftProject(...)` còn đứng đúng chỗ');
  assert.ok(!/projectId:\s*newProjectId\s*,/.test(routeSrc));
  ok('route.ts KHÔNG còn ghi thẳng `projectId: newProjectId` (đường đẻ mồ côi cũ đã bịt)');

  /* ---- đối chứng: bộ quét cấu trúc CÓ RĂNG — source cũ (trước vá) phải bị bắt ---- */
  const OLD_SNIPPET = `
  const flow = await prisma.flow.create({
    data: {
      userId: user.id,
      name: String(body.name ?? 'Untitled flow'),
      projectId: newProjectId,
      graphJson: '{}',
    },
  });`;
  assert.ok(/projectId:\s*newProjectId\s*,/.test(OLD_SNIPPET));
  ok('đối chứng: snippet route CŨ khớp pattern cấm — chứng minh phép quét phân biệt được cũ/mới');

  await prisma.$disconnect();
  console.log(`${pass}/${pass} pass (lib/server/draft-project.test.ts)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
