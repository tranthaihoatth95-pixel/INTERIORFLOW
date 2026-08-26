/**
 * app/api/project-asset-usage/route.test.ts — INTEGRATION test trên dev.db THẬT (khuôn
 * app/api/flows/[id]/route.test.ts): route handler không gọi được trực tiếp vì
 * getSessionUser() cần cookie/session thật (giới hạn đã ghi ở draft-project.test.ts) → test
 * mô phỏng ĐÚNG logic lõi route.ts bằng Prisma thật, đặc biệt ca "hồi sinh sau xoá mềm"
 * (POST → DELETE → POST lại CÙNG projectId+assetId+usage → phải thành công, không 409/lỗi
 * unique) — đây là điểm rủi ro thật của phiếu (composite unique không loại trừ deletedAt,
 * xem comment schema.prisma:719-724).
 *
 * Chạy: node_modules/.bin/sucrase-node app/api/project-asset-usage/route.test.ts
 */
import assert from 'node:assert';
import { prisma } from '../../../lib/server/db';

let pass = 0;
function ok(label: string) {
  pass += 1;
  console.log(`  ✓ ${label}`);
}

async function withFixture<T>(
  fn: (ctx: { userId: string; projectId: string; assetId: string }) => Promise<T>,
): Promise<T> {
  const user = await prisma.user.create({
    data: {
      email: `test-pau-${Date.now()}-${Math.random().toString(36).slice(2)}@test.local`,
      name: 'Test PAU',
      passwordHash: 'x',
    },
  });
  const project = await prisma.project.create({
    data: { userId: user.id, name: 'Dự án test PAU' },
  });
  await prisma.projectMember.create({
    data: { projectId: project.id, userId: user.id, role: 'owner' },
  });
  const asset = await prisma.libraryAsset.create({
    data: {
      userId: user.id,
      name: 'asset test PAU',
      category: 'material',
      mime: 'image/png',
      path: '/tmp/test-pau.png',
    },
  });
  try {
    return await fn({ userId: user.id, projectId: project.id, assetId: asset.id });
  } finally {
    await prisma.projectAssetUsage.deleteMany({ where: { projectId: project.id } });
    await prisma.projectMember.deleteMany({ where: { projectId: project.id } });
    await prisma.libraryAsset.delete({ where: { id: asset.id } }).catch(() => {});
    await prisma.project.delete({ where: { id: project.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
  }
}

/** Mô phỏng đúng logic POST route.ts (findUnique composite → hồi sinh/409/create). */
async function simulatePost(ctx: {
  projectId: string;
  assetId: string;
  usage: string;
  addedBy: string;
  note?: string;
}) {
  const existed = await prisma.projectAssetUsage.findUnique({
    where: {
      projectId_assetId_usage: { projectId: ctx.projectId, assetId: ctx.assetId, usage: ctx.usage },
    },
    select: { id: true, deletedAt: true },
  });
  if (existed && !existed.deletedAt) {
    return { status: 409 as const };
  } else if (existed) {
    const row = await prisma.projectAssetUsage.update({
      where: { id: existed.id },
      data: { deletedAt: null, note: ctx.note ?? null, addedBy: ctx.addedBy },
    });
    return { status: 200 as const, row };
  } else {
    const row = await prisma.projectAssetUsage.create({
      data: {
        projectId: ctx.projectId,
        assetId: ctx.assetId,
        usage: ctx.usage,
        note: ctx.note ?? null,
        addedBy: ctx.addedBy,
      },
    });
    return { status: 200 as const, row };
  }
}

async function main() {
  console.log('ProjectAssetUsage API — integration test trên dev.db thật');

  const rowsBefore = await prisma.projectAssetUsage.count();

  /* ---- ① create mới ---- */
  await withFixture(async ({ userId, projectId, assetId }) => {
    const res = await simulatePost({ projectId, assetId, usage: 'material', addedBy: userId });
    assert.equal(res.status, 200);
    assert.equal(res.row!.deletedAt, null);
    ok('POST tạo mới usage thành công');

    /* ---- ② create lại CÙNG bộ ba khi hàng còn sống → 409 ---- */
    const res2 = await simulatePost({ projectId, assetId, usage: 'material', addedBy: userId });
    assert.equal(res2.status, 409);
    ok('POST trùng usage còn sống → 409');

    /* ---- ③ where-used GET logic: assetId trả về đúng project ---- */
    const whereUsed = await prisma.projectAssetUsage.findMany({
      where: { assetId, deletedAt: null },
      select: { projectId: true, usage: true },
    });
    assert.equal(whereUsed.length, 1);
    assert.equal(whereUsed[0].projectId, projectId);
    ok('GET ?assetId= (where-used) thấy đúng 1 project');

    /* ---- ④ soft-delete (mô phỏng DELETE /[id]) ---- */
    const target = await prisma.projectAssetUsage.findUniqueOrThrow({
      where: { projectId_assetId_usage: { projectId, assetId, usage: 'material' } },
    });
    await prisma.projectAssetUsage.update({
      where: { id: target.id },
      data: { deletedAt: new Date() },
    });
    const afterDelete = await prisma.projectAssetUsage.findMany({
      where: { projectId, deletedAt: null },
    });
    assert.equal(afterDelete.length, 0);
    ok('DELETE soft-delete: hàng biến mất khỏi truy vấn còn sống');

    // Asset gốc PHẢI còn nguyên — DELETE usage không được đụng LibraryAsset.
    const assetStillThere = await prisma.libraryAsset.findUnique({ where: { id: assetId } });
    assert.ok(assetStillThere && !assetStillThere.deletedAt);
    ok('DELETE usage KHÔNG xoá LibraryAsset liên quan');

    /* ---- ⑤ CA RỦI RO NHẤT: POST lại CÙNG projectId+assetId+usage sau khi đã xoá mềm ---- */
    const res3 = await simulatePost({ projectId, assetId, usage: 'material', addedBy: userId });
    assert.equal(res3.status, 200, 'hồi sinh phải thành công (không đụng unique constraint)');
    assert.equal(res3.row!.deletedAt, null);
    ok('POST hồi sinh sau xoá mềm: thành công, KHÔNG đụng unique constraint');

    // Vẫn đúng 1 hàng sống (không tạo hàng thứ hai) — composite unique giữ đúng 1 hàng vật lý.
    const finalCount = await prisma.projectAssetUsage.count({ where: { projectId, assetId, usage: 'material' } });
    assert.equal(finalCount, 1);
    ok('Sau hồi sinh: đúng 1 hàng vật lý (id giữ nguyên, không phình bảng)');

    /* ---- ⑥ usage KHÁC trên CÙNG asset+project sống độc lập ---- */
    const res4 = await simulatePost({ projectId, assetId, usage: 'ref-render', addedBy: userId });
    assert.equal(res4.status, 200);
    ok('POST usage khác nhau (material vs ref-render) cùng asset+project: độc lập, không đụng nhau');

    const liveForProject = await prisma.projectAssetUsage.findMany({
      where: { projectId, deletedAt: null },
      include: { asset: { select: { id: true, name: true } } },
    });
    assert.equal(liveForProject.length, 2);
    ok('GET ?projectId= list đủ 2 usage sống, include asset');
  });

  const rowsAfter = await prisma.projectAssetUsage.count();
  assert.equal(rowsBefore, rowsAfter, 'dev.db phải sạch sau test — 0 rác để lại');
  ok(`dev.db sạch: ${rowsBefore} hàng trước === ${rowsAfter} hàng sau`);

  console.log(`\n${pass} assertions PASS`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('FAIL', e);
    process.exit(1);
  });
