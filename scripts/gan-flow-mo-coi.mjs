/**
 * scripts/gan-flow-mo-coi.mjs — p12 NỀN DỮ LIỆU (08/08), VIỆC 2 ②: gán chủ cho flow mồ côi.
 *
 * MẶC ĐỊNH CHẠY KHÔ (không ghi gì). Truyền `--that` mới ghi thật — CHỈ sau khi Hoà duyệt bảng
 * chạy khô (KS3 duyệt từng phần · KS4 lùi được: backup trước khi --that, xem cuối file).
 *
 *   node scripts/gan-flow-mo-coi.mjs            # chạy khô — in bảng flow→dự án→vì sao
 *   node scripts/gan-flow-mo-coi.mjs --that     # ghi thật (tự backup dev.db trước)
 *
 * Suy chủ theo BẰNG CHỨNG, mạnh trước yếu — không suy được thì vào "Chưa phân loại" của chính
 * user đó, KHÔNG đoán bừa (lệnh cứng của Hoà trong phiếu):
 *   R1 tên flow ↔ tên dự án trùng/chứa nhau (cùng user, so không dấu, không phân hoa-thường)
 *   R2 user chỉ có ĐÚNG 1 dự án thật (ngoài Nháp/Chưa phân loại/__nb:) → về đó
 *   R3 flow tạo trong ±3 ngày quanh createdAt của đúng 1 dự án của user → về đó
 *   R0 không có gì ở trên → "Chưa phân loại" (get-or-create mỗi user)
 * Flow đã xoá mềm (deletedAt≠null) KHÔNG suy đoán — thẳng "Chưa phân loại" (rác đã vứt, gán
 * bằng chứng cho nó là vô nghĩa, nhưng vẫn phải có chủ để số mồ côi về 0).
 *
 * BÀI HỌC 08/08 (phiếu): script phải TỰ ĐO LẠI SAU KHI CHẠY, in số TRƯỚC/SAU; không về đích
 * → exit 1 + chữ THẤT BẠI, không in "xong".
 */
import { PrismaClient } from '@prisma/client';
import { execSync } from 'node:child_process';

const prisma = new PrismaClient();
const THAT = process.argv.includes('--that');
const UNSORTED_NAME = 'Chưa phân loại';
const HIDDEN_PREFIX = '__nb:';

const bo_dau = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();

async function main() {
  const truoc = await prisma.flow.count({ where: { projectId: null } });
  console.log(`\n== TRƯỚC: ${truoc} flow mồ côi (đếm cả xoá mềm — cùng thước lệnh đo của phiếu) ==\n`);
  if (truoc === 0) {
    console.log('Không có gì để gán.');
    return;
  }

  const orphans = await prisma.flow.findMany({
    where: { projectId: null },
    select: { id: true, name: true, userId: true, createdAt: true, deletedAt: true },
    orderBy: { createdAt: 'asc' },
  });
  const projects = await prisma.project.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, userId: true, createdAt: true },
  });
  const realProjectsOf = (userId) =>
    projects.filter(
      (p) => p.userId === userId && !p.name.startsWith(HIDDEN_PREFIX) && p.name !== 'Nháp' && p.name !== UNSORTED_NAME,
    );

  /** @type {Array<{flow: typeof orphans[0], targetName: string, targetId: string|null, why: string}>} */
  const plan = [];
  for (const f of orphans) {
    if (f.deletedAt) {
      plan.push({ flow: f, targetName: UNSORTED_NAME, targetId: null, why: 'đã xoá mềm — không suy đoán, chỉ cần có chủ' });
      continue;
    }
    const mine = realProjectsOf(f.userId);
    const fname = bo_dau(f.name);
    // R1 — tên trùng/chứa nhau
    const byName = mine.filter((p) => {
      const pname = bo_dau(p.name);
      return fname && pname && (fname === pname || fname.includes(pname) || pname.includes(fname));
    });
    if (byName.length === 1) {
      plan.push({ flow: f, targetName: byName[0].name, targetId: byName[0].id, why: `R1 tên trùng: "${f.name}" ↔ "${byName[0].name}"` });
      continue;
    }
    // R2 — user chỉ có đúng 1 dự án thật
    if (mine.length === 1) {
      plan.push({ flow: f, targetName: mine[0].name, targetId: mine[0].id, why: `R2 user chỉ có 1 dự án thật ("${mine[0].name}")` });
      continue;
    }
    // R3 — tạo trong ±3 ngày quanh đúng 1 dự án
    const D3 = 3 * 24 * 3600 * 1000;
    const near = mine.filter((p) => Math.abs(p.createdAt.getTime() - f.createdAt.getTime()) <= D3);
    if (near.length === 1) {
      plan.push({ flow: f, targetName: near[0].name, targetId: near[0].id, why: `R3 tạo cách "${near[0].name}" ${Math.round(Math.abs(near[0].createdAt - f.createdAt) / 3600000)}h` });
      continue;
    }
    plan.push({ flow: f, targetName: UNSORTED_NAME, targetId: null, why: mine.length === 0 ? 'R0 user không có dự án thật nào' : `R0 ${mine.length} dự án, không cái nào đủ bằng chứng` });
  }

  console.log('flow'.padEnd(28) + '| về dự án'.padEnd(22) + '| vì sao');
  console.log('-'.repeat(100));
  for (const p of plan) {
    const tag = p.flow.deletedAt ? ' (đã xoá mềm)' : '';
    console.log(`${(p.flow.name + tag).slice(0, 26).padEnd(28)}| ${p.targetName.slice(0, 20).padEnd(20)}| ${p.why}`);
  }
  const nUnsorted = plan.filter((p) => !p.targetId).length;
  console.log(`\nTổng: ${plan.length} — có bằng chứng: ${plan.length - nUnsorted} · về "Chưa phân loại": ${nUnsorted}`);

  if (!THAT) {
    console.log('\n[CHẠY KHÔ — chưa ghi gì. Hoà duyệt bảng trên rồi chạy lại với --that]');
    return;
  }

  // ---- GHI THẬT ----
  execSync(`sqlite3 prisma/dev.db ".backup 'prisma/dev.db.bak-truoc-gan-mo-coi'"`);
  console.log('\n[--that] Đã backup: prisma/dev.db.bak-truoc-gan-mo-coi');
  const unsortedByUser = new Map();
  for (const p of plan) {
    let target = p.targetId;
    if (!target) {
      if (!unsortedByUser.has(p.flow.userId)) {
        const existing = await prisma.project.findFirst({
          where: { userId: p.flow.userId, name: UNSORTED_NAME, deletedAt: null },
          select: { id: true },
        });
        const proj =
          existing ??
          (await prisma.project.create({
            data: {
              userId: p.flow.userId,
              name: UNSORTED_NAME,
              lastEditedBy: p.flow.userId,
              members: { create: { userId: p.flow.userId, role: 'owner', lastEditedBy: p.flow.userId } },
            },
            select: { id: true },
          }));
        unsortedByUser.set(p.flow.userId, proj.id);
      }
      target = unsortedByUser.get(p.flow.userId);
    }
    await prisma.flow.update({ where: { id: p.flow.id }, data: { projectId: target } });
  }

  // ---- ĐO LẠI (bài học 08/08 — không tin chính mình) ----
  const sau = await prisma.flow.count({ where: { projectId: null } });
  console.log(`\n== SAU: ${sau} flow mồ côi (TRƯỚC: ${truoc}) ==`);
  if (sau !== 0) {
    console.error(`THẤT BẠI: còn ${sau} mồ côi sau khi chạy — KHÔNG về đích. Khôi phục: cp prisma/dev.db.bak-truoc-gan-mo-coi prisma/dev.db`);
    process.exit(1);
  }
  console.log('✔ Về đích: 0 mồ côi. Hoàn tác nếu cần: cp prisma/dev.db.bak-truoc-gan-mo-coi prisma/dev.db');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
