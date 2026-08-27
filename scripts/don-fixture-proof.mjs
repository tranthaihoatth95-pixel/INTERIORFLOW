/**
 * scripts/don-fixture-proof.mjs — DỌN dữ liệu giả do chính các script proof để lại trong DB thật.
 *
 * ── VÌ SAO CÓ TỆP NÀY ──────────────────────────────────────────────────────────────────────────
 * Trước khi có `scripts/proof/_db-tam.mjs` (cách ly, 27/08), bảy script proof ghi thẳng vào
 * `prisma/dev.db` **thật**. Chúng có dọn ở cuối — nhưng dọn **sau khi đã ghi**, nên hai lượt
 * `access-scope.mjs` chết giữa chừng (lỗi truyền object thay vì id vào `assertProjectAccess`) đã
 * để lại nguyên vẹn dữ liệu dựng.
 *
 * Hậu quả **lộ ra ở bề mặt người dùng**, không chỉ nằm im trong bảng: lane `IF-UXUI-RUNTIME-001`
 * đo được `/api/dashboard` trả **6/10 dự án mang tên `__proof_scope_*`**, và **9/21 user là
 * fixture** — không một dấu hiệu nào phân biệt với dữ liệu thật. Người dùng mở app ra và thấy
 * rác của bộ kiểm thử nằm chung bảng với dự án của mình.
 *
 * ── LUẬT AN TOÀN CỦA CHÍNH TỆP NÀY ────────────────────────────────────────────────────────────
 * ① Chỉ xoá hàng khớp thẻ `__proof` / `@proof.local` / bucket ẩn `__nb:__proof…`. Không mẫu rộng.
 * ② **In ra danh sách và ĐẾM trước khi xoá.** `--dry-run` là mặc định; phải `--xoa` mới xoá.
 * ③ Trước khi xoá, khẳng định **không có dữ liệu thật bám vào**: 0 flow, 0 file, 0 asset.
 *    Khác 0 ⇒ **DỪNG**, không xoá gì — hàng đó không còn thuần fixture.
 * ④ Đối chiếu số hàng các bảng KHÔNG liên quan trước/sau. Lệch ⇒ báo đỏ.
 *
 * ⚠️ Chạy qua cổng mục tiêu, không chạy trần:
 *    node scripts/db-target-guard.mjs --expect prisma/dev.db -- node scripts/don-fixture-proof.mjs --xoa
 */

import { PrismaClient } from '@prisma/client';

const XOA = process.argv.includes('--xoa');
const prisma = new PrismaClient();

const LA_FIXTURE_USER = {
  OR: [{ name: { startsWith: '__proof' } }, { email: { contains: '@proof.local' } }],
};
const LA_FIXTURE_PROJECT = {
  OR: [{ name: { startsWith: '__proof' } }, { name: { startsWith: '__nb:__proof' } }],
};

const DEM = ['user', 'project', 'flow', 'libraryAsset', 'projectFile', 'projectMember', 'assetRepresentation', 'task'];

async function demTatCa() {
  const ra = {};
  for (const m of DEM) ra[m] = await prisma[m].count();
  return ra;
}

async function main() {
  console.log(`# DỌN FIXTURE PROOF — chế độ: ${XOA ? '🔴 XOÁ THẬT' : '🟢 chỉ soi (--dry-run)'}\n`);

  const users = await prisma.user.findMany({ where: LA_FIXTURE_USER, select: { id: true, name: true } });
  const projects = await prisma.project.findMany({ where: LA_FIXTURE_PROJECT, select: { id: true, name: true } });
  const userIds = users.map((u) => u.id);
  const projectIds = projects.map((p) => p.id);

  console.log(`user fixture   : ${users.length}`);
  for (const u of users) console.log(`   · ${u.name}`);
  console.log(`dự án fixture  : ${projects.length}`);
  for (const p of projects) console.log(`   · ${p.name}`);

  // ③ Chốt chặn: có dữ liệu THẬT bám vào thì dừng hẳn.
  const bam = {
    flow: await prisma.flow.count({ where: { OR: [{ projectId: { in: projectIds } }, { userId: { in: userIds } }] } }),
    file: await prisma.projectFile.count({ where: { projectId: { in: projectIds } } }),
    asset: await prisma.libraryAsset.count({ where: { userId: { in: userIds } } }),
    task: await prisma.task.count({ where: { projectId: { in: projectIds } } }),
  };
  console.log(`\ndữ liệu bám vào: flow ${bam.flow} · file ${bam.file} · asset ${bam.asset} · task ${bam.task}`);
  const tongBam = Object.values(bam).reduce((a, b) => a + b, 0);
  if (tongBam > 0) {
    console.error('\n⛔ DỪNG — có dữ liệu bám vào hàng fixture. Chúng không còn thuần fixture nữa.');
    console.error('   Xoá lúc này là xoá cả thứ không phải của bộ kiểm thử. Soi tay trước.');
    process.exit(1);
  }

  if (!XOA) {
    console.log('\n(chưa xoá gì — thêm `--xoa` để thi hành)\n');
    return;
  }

  const truoc = await demTatCa();
  await prisma.projectMember.deleteMany({ where: { OR: [{ projectId: { in: projectIds } }, { userId: { in: userIds } }] } });
  const xoaP = await prisma.project.deleteMany({ where: { id: { in: projectIds } } });
  const xoaU = await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  const sau = await demTatCa();

  console.log(`\nđã xoá: ${xoaP.count} dự án · ${xoaU.count} user\n`);
  console.log('── ④ đối chiếu số hàng trước/sau ──');
  let bat_thuong = 0;
  for (const m of DEM) {
    const d = truoc[m] - sau[m];
    const mongDoi = m === 'project' ? xoaP.count : m === 'user' ? xoaU.count : m === 'projectMember' ? d : 0;
    const ok = d === mongDoi;
    if (!ok) bat_thuong++;
    console.log(`  ${ok ? '✅' : '🔴'} ${m.padEnd(20)} ${truoc[m]} → ${sau[m]}  (giảm ${d}, mong ${mongDoi})`);
  }
  if (bat_thuong) {
    console.error('\n🔴 CÓ BẢNG GIẢM NGOÀI DỰ KIẾN — khôi phục từ bản sao lưu NGAY.');
    process.exit(1);
  }
  console.log('\n✅ Không bảng nào giảm ngoài dự kiến.');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
