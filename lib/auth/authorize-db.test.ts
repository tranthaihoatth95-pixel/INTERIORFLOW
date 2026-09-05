/**
 * lib/auth/authorize-db.test.ts — INTEGRATION trên Prisma THẬT (khuôn `lib/server/tasks.test.ts`):
 * tạo user/project/member tạm → authorizeProject/listMemberSummaries → gỡ mềm → quyền mất ngay
 * (THU HỒI) → dọn sạch. Không cần cookie: `authorizeRequest` (đọc phiên) là vỏ mỏng, không kiểm ở đây.
 * Chạy: node_modules/.bin/sucrase-node lib/auth/authorize-db.test.ts   (cần DATABASE_URL)
 */
import assert from 'node:assert';
import { prisma } from '../server/db';
import { authorizeProject, listMemberSummaries, loadGrantFacts } from './authorize-db';
import { DenialError, checkAssignees, decideGrant } from './authorize';

let pass = 0;
const ok = (l: string) => { pass += 1; console.log(`  ✓ ${l}`); };
const tag = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const mk = (n: string, isAdmin = false) =>
  prisma.user.create({ data: { email: `test-auth-${n}-${tag}@test.local`, name: `T ${n}`, passwordHash: 'x', isAdmin } });

async function main() {
  const [owner, crea, viewer, outsider, admin] = await Promise.all([mk('owner'), mk('crea'), mk('viewer'), mk('outsider'), mk('admin', true)]);
  const project = await prisma.project.create({ data: { userId: owner.id, name: `Test Auth ${tag}`, currentStage: 'concept', lastEditedBy: owner.id } });
  const ids = [owner.id, crea.id, viewer.id, outsider.id, admin.id];
  try {
    await prisma.projectMember.createMany({
      data: [
        { projectId: project.id, userId: owner.id, role: 'owner' },
        { projectId: project.id, userId: crea.id, role: 'crea' },
        { projectId: project.id, userId: viewer.id, role: 'viewer' },
      ],
    });

    const gO = await authorizeProject(owner.id, project.id);
    const gC = await authorizeProject(crea.id, project.id);
    const gV = await authorizeProject(viewer.id, project.id);
    const gA = await authorizeProject(admin.id, project.id);
    assert.deepStrictEqual([gO.role, gC.role, gV.role, gA.role], ['owner', 'editor', 'viewer', 'admin']);
    assert.strictEqual(gA.storedRole, null);
    ok('owner→owner · crea@concept→editor · viewer→viewer · isAdmin không member→admin');

    await assert.rejects(authorizeProject(outsider.id, project.id), (e: unknown) => e instanceof DenialError && e.status === 404);
    await assert.rejects(authorizeProject(owner.id, 'khong-ton-tai'), (e: unknown) => e instanceof DenialError && e.status === 404);
    ok('người ngoài / dự án không có → DenialError 404 (không lộ tồn tại)');

    // đổi chặng → cùng người, vai canonical đổi (relay)
    await prisma.project.update({ where: { id: project.id }, data: { currentStage: 'render' } });
    assert.strictEqual((await authorizeProject(crea.id, project.id)).role, 'reviewer');
    ok('dự án sang chặng render → crea thành reviewer (quyền theo trạm, không theo nhãn)');

    const members = await listMemberSummaries(project.id, 'render');
    const byId = Object.fromEntries(members.map((m) => [m.userId, m]));
    assert.strictEqual(byId[owner.id].assignable, true);
    assert.strictEqual(byId[crea.id].assignable, true);
    assert.strictEqual(byId[viewer.id].assignable, false);
    assert.ok(!byId[outsider.id] && !byId[admin.id]);
    const chk = checkAssignees([viewer.id, outsider.id, crea.id], members);
    assert.deepStrictEqual(chk.ineligible.map((x) => x.reason), ['not-assignable', 'not-member']);
    ok('roster: viewer không nhận việc, người ngoài/admin-không-member không có trong roster');

    // THU HỒI: gỡ mềm crea → quyền mất NGAY ở lần hỏi kế tiếp
    await prisma.projectMember.update({ where: { projectId_userId: { projectId: project.id, userId: crea.id } }, data: { deletedAt: new Date() } });
    await assert.rejects(authorizeProject(crea.id, project.id), (e: unknown) => e instanceof DenialError && e.status === 404);
    assert.ok(!(await listMemberSummaries(project.id, 'render')).some((m) => m.userId === crea.id));
    ok('gỡ mềm member → 404 ngay + biến khỏi roster (thu hồi có hiệu lực lượt sau, không cache server)');

    // dự án xoá mềm → kể cả owner/admin cũng 404
    await prisma.project.update({ where: { id: project.id }, data: { deletedAt: new Date() } });
    const facts = await loadGrantFacts(owner.id, project.id);
    assert.ok(facts.project?.deletedAt);
    assert.throws(() => decideGrant(facts), (e: unknown) => e instanceof DenialError && e.status === 404);
    await assert.rejects(authorizeProject(admin.id, project.id));
    ok('dự án xoá mềm → owner lẫn admin đều 404');

    console.log(`\n${pass} nhóm khẳng định pass`);
  } finally {
    await prisma.projectMember.deleteMany({ where: { projectId: project.id } });
    await prisma.project.delete({ where: { id: project.id } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
    await prisma.$disconnect();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
