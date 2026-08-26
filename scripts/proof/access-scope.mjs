/**
 * scripts/proof/access-scope.mjs — CHỨNG MINH TRÊN RUNTIME cho SHARED ACCESS PRIMITIVE
 * (`projectScope` / `visibleProjectIds` / `projectScopeWhere`, `lib/server/access.ts`), Wave 1 · W1-2.
 *
 * Không phải test thuần: dựng dữ liệu THẬT trong `dev.db` bằng Prisma, gọi hàm THẬT (bundle qua
 * esbuild để giải alias `@/`), rồi XOÁ SẠCH dữ liệu dựng. Lý do phải chạm DB thật: ba lỗi mà lát
 * này vá đều nằm ở **mệnh đề Prisma** (`deletedAt` phía project, nhánh admin, bucket ẩn) — test
 * giả lập `prisma` sẽ xanh với cả bản cũ lẫn bản mới, tức là không kiểm gì.
 *
 * ⚠️ CỔNG HARNESS (F-15) ở CA 0: nếu bundle không thật sự nạp và không thật sự đụng DB thì DỪNG,
 * cấm in ĐẠT cho ca phía sau.
 *
 * Chạy:  node scripts/proof/access-scope.mjs
 */

import { execFileSync } from 'child_process';
import { mkdtempSync, rmSync } from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const prisma = new PrismaClient();
const TAG = `__proof_scope_${Date.now()}`;
// Bundle phải nằm TRONG repo: nó `require('@prisma/client')`, mà Node giải node_modules theo
// đường của FILE. Đặt ở /tmp là `MODULE_NOT_FOUND` — đã sập đúng ca này lần chạy đầu.
const tmp = mkdtempSync(path.join(process.cwd(), 'node_modules', '.if-proof-'));

const ket = [];
function ca(ten, mong, got) {
  const dat = JSON.stringify(mong) === JSON.stringify(got);
  ket.push({ ten, dat });
  console.log(`${dat ? '  ok  ' : ' KHÔNG '} ${ten} — mong ${JSON.stringify(mong)}, nhận ${JSON.stringify(got)}`);
  return dat;
}

async function main() {
  console.log('# SHARED ACCESS PRIMITIVE · runtime proof (dev.db thật)\n');

  // esbuild giải alias `@/` theo tsconfig; `require()` được vì output là cjs.
  const out = path.join(tmp, 'access.cjs');
  execFileSync('npx', [
    'esbuild', 'lib/server/access.ts',
    '--bundle', '--format=cjs', '--platform=node',
    '--external:@prisma/client', '--external:next',
    `--outfile=${out}`,
  ], { stdio: 'pipe' });
  const A = require(out);

  // ── CA 0 · CỔNG HARNESS ────────────────────────────────────────────────────
  // Bundle rỗng vẫn `require()` thành công và vẫn in "nạp được" — đúng bẫy F-15. Nên cổng phải
  // đòi HAI thứ: hàm tồn tại, VÀ nó trả về dữ liệu chỉ có thể đến từ DB thật.
  const soDuAnThat = await prisma.project.count({ where: { deletedAt: null } });
  const admin = await prisma.user.findFirst({ where: { isAdmin: true }, select: { id: true } });
  const congOk =
    typeof A.projectScope === 'function' &&
    typeof A.visibleProjectIds === 'function' &&
    typeof A.projectScopeWhere === 'function' &&
    !!admin &&
    (await A.projectScope(admin.id, { includeHidden: true })).ids.length === soDuAnThat;
  ca(`CA 0 · HARNESS: hàm thật + đụng DB thật (${soDuAnThat} dự án sống)`, true, congOk);
  if (!congOk) {
    console.error('\n⛔ HARNESS ĐỎ — không báo ĐẠT cho ca nào phía sau.');
    process.exit(1);
  }

  // ── Dựng dữ liệu ───────────────────────────────────────────────────────────
  const mk = (n, isAdmin = false) =>
    prisma.user.create({ data: { email: `${TAG}_${n}@proof.local`, name: `${TAG}_${n}`, passwordHash: 'x', isAdmin } });
  const [chu, khach, ngoai, quanTri] = await Promise.all([mk('chu'), mk('khach'), mk('ngoai'), mk('admin', true)]);

  const mkP = (n, deleted = false) =>
    prisma.project.create({
      data: {
        name: n,
        lastEditedBy: chu.id,
        user: { connect: { id: chu.id } },
        ...(deleted ? { deletedAt: new Date() } : {}),
        members: { create: { userId: chu.id, role: 'owner', lastEditedBy: chu.id } },
      },
    });
  const pThuong = await mkP(`${TAG} thường`);
  const pXoaMem = await mkP(`${TAG} xoá mềm`, true);
  const pAn = await mkP(`__nb:${TAG}`);
  const pMoi = await mkP(`${TAG} có khách`);
  await prisma.projectMember.create({ data: { projectId: pMoi.id, userId: khach.id, role: 'viewer', lastEditedBy: chu.id } });
  const pGoBo = await mkP(`${TAG} đã gỡ khách`);
  await prisma.projectMember.create({
    data: { projectId: pGoBo.id, userId: khach.id, role: 'viewer', lastEditedBy: chu.id, deletedAt: new Date() },
  });

  const ids = async (u, o) => (await A.visibleProjectIds(u, o)).sort();
  const co = (arr, p) => arr.includes(p.id);

  // ── Bốn ca mà bản CŨ trượt ─────────────────────────────────────────────────
  const cChu = await ids(chu.id);
  ca('CA 1 · dự án XOÁ MỀM không lọt vào list (bản cũ: lọt)', false, co(cChu, pXoaMem));
  ca('CA 2 · bucket ẩn `__nb:*` không lọt (bản cũ: lọt)', false, co(cChu, pAn));
  ca('CA 3 · includeHidden:true thì bucket ẩn hiện lại', true, co(await ids(chu.id, { includeHidden: true }), pAn));

  const cAdmin = await A.projectScope(quanTri.id);
  ca('CA 4 · admin KHÔNG là member vẫn thấy dự án (bản cũ: rỗng ⇒ mất sạch dashboard)', true,
    cAdmin.ids.includes(pThuong.id) && cAdmin.laAdmin === true);
  ca('CA 5 · admin KHÔNG thấy dự án xoá mềm', false, cAdmin.ids.includes(pXoaMem.id));

  // ── Ca ngữ nghĩa còn lại ───────────────────────────────────────────────────
  ca('CA 6 · member được MỜI thấy dự án (lỗi under-fetch hôm nay của `userId: self`)', true,
    co(await ids(khach.id), pMoi));
  ca('CA 7 · member bị GỠ (soft-delete) KHÔNG còn thấy', false, co(await ids(khach.id), pGoBo));
  ca('CA 8 · người ngoài không thấy gì của proof này', 0,
    (await ids(ngoai.id)).filter((i) => [pThuong.id, pMoi.id, pGoBo.id, pAn.id].includes(i)).length);
  ca('CA 9 · chủ thấy đúng 2 dự án hiện (thường + có khách)', true,
    co(cChu, pThuong) && co(cChu, pMoi));

  // ── Đồng thuận với `assertProjectAccess`: cùng câu trả lời, không hai định nghĩa ──
  const thay = async (u, p) => {
    try {
      await A.assertProjectAccess(u, p);  // p là ID, không phải object
      return true;
    } catch (e) {
      if (!(e && e.constructor && e.constructor.name === 'AccessError')) {
        console.log(`      ↳ LỖI KHÔNG PHẢI AccessError: ${e?.constructor?.name}: ${String(e?.message).replace(/\n+/g,' ¶ ').slice(0, 700)}`);
      }
      return false;
    }
  };
  for (const [ten, u, p] of [
    ['chủ · dự án thường', chu.id, pThuong],
    ['chủ · dự án xoá mềm', chu.id, pXoaMem],
    ['admin · dự án thường', quanTri.id, pThuong],
    ['admin · dự án xoá mềm', quanTri.id, pXoaMem],
    ['khách · dự án được mời', khach.id, pMoi],
    ['khách · dự án đã gỡ', khach.id, pGoBo],
    ['người ngoài · dự án thường', ngoai.id, pThuong],
  ]) {
    const qua1 = (await ids(u, { includeHidden: true })).includes(p.id);
    const qua2 = await thay(u, p.id);
    ca(`CA 10 · ĐỒNG THUẬN hai cửa — ${ten}`, qua2, qua1);
  }

  // ── projectScopeWhere ──────────────────────────────────────────────────────
  const w = await A.projectScopeWhere(chu.id);
  ca('CA 11 · projectScopeWhere trả mệnh đề dùng được', true,
    Array.isArray(w.id?.in) && w.deletedAt === null);
  const qua = await prisma.project.findMany({ where: w, select: { id: true } });
  ca('CA 12 · mệnh đề đó chạy được trên Prisma và khớp danh sách', true,
    qua.map((r) => r.id).sort().join() === cChu.join());
}

async function don() {
  await prisma.projectMember.deleteMany({ where: { project: { name: { contains: TAG } } } });
  await prisma.project.deleteMany({ where: { name: { contains: TAG } } });
  const n = await prisma.user.deleteMany({ where: { name: { contains: TAG } } });
  console.log(`\n  (đã xoá dữ liệu dựng: ${n.count} user + dự án gắn thẻ ${TAG})`);
  rmSync(tmp, { recursive: true, force: true });
}

main()
  .catch((e) => {
    console.error(e);
    ket.push({ ten: 'CHẠY ĐƯỢC', dat: false });
  })
  .finally(async () => {
    await don().catch((e) => console.error('DỌN THẤT BẠI:', e.message));
    await prisma.$disconnect();
    const fail = ket.filter((k) => !k.dat);
    console.log(`\n${ket.length - fail.length}/${ket.length} ĐẠT`);
    process.exit(fail.length ? 1 : 0);
  });
