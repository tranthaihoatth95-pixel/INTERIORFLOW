/**
 * lib/server/promote.test.ts — INTEGRATION test trên `dev.db` THẬT, khuôn
 * `app/api/project-asset-usage/route.test.ts`.
 *
 * Phủ TRỌN hành trình: upload → list → promote → LibraryAsset sinh ra → ProjectAssetUsage TỰ
 * TẠO → promote lại KHÔNG nhân bản → soft-delete.
 *
 * ⭐ `promoteProjectFile()` được gọi THẬT (không mô phỏng) — nó cố ý không kiểm quyền nên chạy
 * được ngoài route. Chỉ hai đầu upload/list/delete là mô phỏng đúng thân handler, vì
 * `getSessionUser()` cần cookie thật (giới hạn đã ghi ở `draft-project.test.ts`).
 *
 * ⛔ ĐIỂM NGHIỆM THU CỨNG: đếm hàng 3 bảng TRƯỚC/SAU phải BẰNG NHAU, và file vật lý ghi ra
 * `./uploads` phải được dọn — test không được để rác cho dev.db lẫn đĩa.
 *
 * Chạy: node_modules/.bin/sucrase-node lib/server/promote.test.ts
 */
import assert from 'node:assert';
import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { prisma } from './db';
import { promoteProjectFile, usageTuMime, tagNguonProjectFile } from './promote';
import { luuProjectFile, docDataUrl, bamContentHash } from '../../app/api/project-files/_lib/luu-file';

let pass = 0;
function ok(label: string) {
  pass += 1;
  console.log(`  ✓ ${label}`);
}

/** PNG 1×1 hợp lệ — magic bytes thật, để `sniffKind` nhận ra (không bịa header). */
const PNG_1X1_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const PNG_DATA_URL = `data:image/png;base64,${PNG_1X1_B64}`;

/** PDF tối thiểu — `%PDF-` là magic bytes `sniffKind` dùng. */
const PDF_DATA_URL = `data:application/pdf;base64,${Buffer.from('%PDF-1.4\n% test\n').toString('base64')}`;

const filesDaGhi: string[] = [];

async function withFixture<T>(fn: (ctx: { userId: string; projectId: string }) => Promise<T>): Promise<T> {
  const user = await prisma.user.create({
    data: {
      email: `test-promote-${Date.now()}-${Math.random().toString(36).slice(2)}@test.local`,
      name: 'Test Promote',
      passwordHash: 'x',
    },
  });
  const project = await prisma.project.create({ data: { userId: user.id, name: 'Dự án test Promote' } });
  await prisma.projectMember.create({ data: { projectId: project.id, userId: user.id, role: 'owner' } });
  try {
    return await fn({ userId: user.id, projectId: project.id });
  } finally {
    await prisma.projectAssetUsage.deleteMany({ where: { projectId: project.id } });
    await prisma.projectFile.deleteMany({ where: { projectId: project.id } });
    await prisma.libraryAsset.deleteMany({ where: { userId: user.id } });
    await prisma.projectMember.deleteMany({ where: { projectId: project.id } });
    await prisma.project.delete({ where: { id: project.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
  }
}

/** Mô phỏng ĐÚNG thân `POST /api/project-files` (phần sau khi qua auth+quyền). */
async function simulateUpload(ctx: { projectId: string; userId: string; name: string; dataUrl: string }) {
  const doc = docDataUrl(ctx.dataUrl);
  if (!doc.ok) return { status: doc.status, error: doc.error };
  const luu = await luuProjectFile(doc.buf);
  if (!luu.ok) return { status: luu.status, error: luu.error };
  filesDaGhi.push(luu.path);
  const row = await prisma.projectFile.create({
    data: {
      projectId: ctx.projectId,
      name: ctx.name.slice(0, 200),
      mime: luu.mime,
      path: luu.path,
      contentHash: luu.contentHash,
      uploadedBy: ctx.userId,
      lastEditedBy: ctx.userId,
    },
  });
  return { status: 200 as const, row };
}

async function main() {
  console.log('ProjectFile + Promote — integration test trên dev.db thật');

  const pfTruoc = await prisma.projectFile.count();
  const laTruoc = await prisma.libraryAsset.count();
  const pauTruoc = await prisma.projectAssetUsage.count();

  /* ═══ ① thuần: suy usage từ MIME + tag provenance ═══ */
  assert.equal(usageTuMime('image/png'), 'ref-render');
  assert.equal(usageTuMime('image/webp'), 'ref-render');
  assert.equal(usageTuMime('application/pdf'), 'brief');
  ok('usageTuMime: ảnh → ref-render · pdf → brief');

  assert.equal(tagNguonProjectFile('abc123'), 'nguon:projectfile:abc123');
  ok('tagNguonProjectFile dùng đúng tiền tố `nguon:` của gallery-tags (không chế cú pháp mới)');

  // contentHash phải TẤT ĐỊNH — cùng nội dung ra cùng hash (điều kiện cần cho dedupe về sau).
  const b = Buffer.from(PNG_1X1_B64, 'base64');
  assert.equal(bamContentHash(b), bamContentHash(Buffer.from(b)));
  assert.equal(bamContentHash(b).length, 64);
  ok('bamContentHash tất định, sha256 hex 64 ký tự');

  await withFixture(async ({ userId, projectId }) => {
    /* ═══ ② UPLOAD ═══ */
    const up = await simulateUpload({ projectId, userId, name: 'anh-tham-chieu.png', dataUrl: PNG_DATA_URL });
    assert.equal(up.status, 200);
    const pf = up.row!;
    // MIME do SERVER sniff, không lấy nhãn client — dataUrl khai image/png và magic bytes cũng png.
    assert.equal(pf.mime, 'image/png');
    assert.ok(pf.contentHash && pf.contentHash.length === 64);
    assert.equal(pf.projectId, projectId, 'ProjectFile PHẢI thuộc đúng 1 project');
    ok('POST /project-files: tạo ProjectFile, mime sniff từ magic bytes, có contentHash');

    /* ═══ ③ LIST ═══ */
    const list1 = await prisma.projectFile.findMany({ where: { projectId, deletedAt: null } });
    assert.equal(list1.length, 1);
    ok('GET ?projectId= list đúng 1 tệp thô còn sống');

    /* ═══ ④ PROMOTE ═══ */
    const pr = await promoteProjectFile({ projectFileId: pf.id, userId });
    assert.ok(pr.ok, 'promote phải thành công');
    if (!pr.ok) return;
    assert.equal(pr.daCo, false, 'lần đầu: sinh asset mới');
    assert.equal(pr.usage, 'ref-render', 'ảnh → ref-render');
    ok('POST /promote lần đầu: daCo=false, usage suy từ mime');

    const asset = await prisma.libraryAsset.findUniqueOrThrow({ where: { id: pr.assetId } });
    // ⭐ CONTRACT: LibraryAsset KHÔNG mang projectId — kiểm ở mức schema (cột không tồn tại).
    assert.equal(
      Object.prototype.hasOwnProperty.call(asset, 'projectId'),
      false,
      'LibraryAsset KHÔNG được có projectId — nó là vật dùng lại được, không thuộc project nào',
    );
    // Trỏ vào ĐÚNG file cũ trên đĩa, KHÔNG copy tệp thứ hai.
    assert.equal(asset.path, pf.path, 'LibraryAsset.path dùng lại file gốc, không nhân bản trên đĩa');
    assert.equal(asset.mime, pf.mime);
    assert.ok(asset.tags.includes(tagNguonProjectFile(pf.id)), 'asset phải mang tag provenance');
    ok('LibraryAsset sinh ra: 0 projectId · path dùng lại file gốc · có tag nguồn');

    /* ═══ ⑤ ProjectAssetUsage TỰ TẠO (vế bắt buộc của contract) ═══ */
    const usages = await prisma.projectAssetUsage.findMany({
      where: { assetId: pr.assetId, deletedAt: null },
    });
    assert.equal(usages.length, 1, 'Promote PHẢI tạo đúng 1 usage cho project nguồn');
    assert.equal(usages[0].projectId, projectId);
    assert.equal(usages[0].usage, 'ref-render');
    assert.equal(usages[0].id, pr.usageId);
    ok('Promote TỰ TẠO ProjectAssetUsage cho project nguồn (không cần gọi thêm API)');

    /* ═══ ⑥ CA RỦI RO NHẤT: promote LẠI cùng ProjectFile → KHÔNG nhân bản ═══ */
    const pr2 = await promoteProjectFile({ projectFileId: pf.id, userId });
    assert.ok(pr2.ok);
    if (!pr2.ok) return;
    assert.equal(pr2.daCo, true, 'lần hai phải nhận ra đã promote');
    assert.equal(pr2.assetId, pr.assetId, 'phải trả lại ĐÚNG asset cũ, không sinh id mới');
    const assetCount = await prisma.libraryAsset.count({ where: { userId, deletedAt: null } });
    assert.equal(assetCount, 1, 'vẫn đúng 1 LibraryAsset — không nhân bản');
    const usageCount = await prisma.projectAssetUsage.count({ where: { assetId: pr.assetId, deletedAt: null } });
    assert.equal(usageCount, 1, 'vẫn đúng 1 usage — không nhân bản');
    ok('Promote lại CÙNG ProjectFile: idempotent, 1 asset + 1 usage, không phình bảng');

    /* ═══ ⑦ usage bị gỡ mềm rồi promote lại → HỒI SINH, không đụng unique ═══ */
    await prisma.projectAssetUsage.update({
      where: { id: pr.usageId },
      data: { deletedAt: new Date() },
    });
    const pr3 = await promoteProjectFile({ projectFileId: pf.id, userId });
    assert.ok(pr3.ok);
    if (!pr3.ok) return;
    assert.equal(pr3.usageId, pr.usageId, 'hồi sinh ĐÚNG hàng cũ (id giữ nguyên)');
    const song = await prisma.projectAssetUsage.findUniqueOrThrow({ where: { id: pr.usageId } });
    assert.equal(song.deletedAt, null);
    ok('usage đã gỡ mềm + promote lại → hồi sinh đúng hàng, KHÔNG đụng composite unique');

    /* ═══ ⑧ PDF → usage 'brief' + asset thứ hai độc lập ═══ */
    const up2 = await simulateUpload({ projectId, userId, name: 'de-bai.pdf', dataUrl: PDF_DATA_URL });
    assert.equal(up2.status, 200);
    assert.equal(up2.row!.mime, 'application/pdf');
    const pr4 = await promoteProjectFile({ projectFileId: up2.row!.id, userId });
    assert.ok(pr4.ok);
    if (!pr4.ok) return;
    assert.equal(pr4.usage, 'brief', 'PDF → brief');
    assert.notEqual(pr4.assetId, pr.assetId, 'ProjectFile khác → asset khác');
    ok('PDF promote được (library-save từ chối PDF, đường này thì nhận) → usage=brief');

    /* ═══ ⑨ 1 asset dùng cho N project ═══ */
    const p2 = await prisma.project.create({ data: { userId, name: 'Dự án thứ hai' } });
    try {
      await prisma.projectAssetUsage.create({
        data: { projectId: p2.id, assetId: pr.assetId, usage: 'material', addedBy: userId },
      });
      const whereUsed = await prisma.projectAssetUsage.findMany({
        where: { assetId: pr.assetId, deletedAt: null },
        select: { projectId: true },
      });
      assert.equal(new Set(whereUsed.map((r) => r.projectId)).size, 2);
      ok('1 LibraryAsset dùng được ở 2 Project (N-N qua ProjectAssetUsage)');
    } finally {
      await prisma.projectAssetUsage.deleteMany({ where: { projectId: p2.id } });
      await prisma.project.delete({ where: { id: p2.id } }).catch(() => {});
    }

    /* ═══ ⑩ SOFT-DELETE ProjectFile — KHÔNG đụng LibraryAsset đã sinh ═══ */
    await prisma.projectFile.update({ where: { id: pf.id }, data: { deletedAt: new Date() } });
    const conSong = await prisma.projectFile.findMany({ where: { projectId, deletedAt: null } });
    assert.equal(conSong.length, 1, 'chỉ còn tệp PDF');
    const assetVanCon = await prisma.libraryAsset.findUnique({ where: { id: pr.assetId } });
    assert.ok(assetVanCon && !assetVanCon.deletedAt, 'xoá tệp thô KHÔNG được giết asset đã promote');
    ok('DELETE soft-delete ProjectFile: khuất khỏi list, LibraryAsset vẫn sống');

    // Promote một tệp đã xoá mềm → 404, không âm thầm làm gì.
    const pr5 = await promoteProjectFile({ projectFileId: pf.id, userId });
    assert.equal(pr5.ok, false);
    if (!pr5.ok) assert.equal(pr5.status, 404);
    ok('Promote tệp đã xoá mềm → 404 (không sinh gì thêm)');
  });

  /* ═══ dọn file vật lý đã ghi ═══ */
  for (const f of filesDaGhi) {
    await unlink(path.join(process.cwd(), 'uploads', f)).catch(() => {});
  }

  const pfSau = await prisma.projectFile.count();
  const laSau = await prisma.libraryAsset.count();
  const pauSau = await prisma.projectAssetUsage.count();
  assert.equal(pfTruoc, pfSau, 'ProjectFile: đếm trước === đếm sau');
  assert.equal(laTruoc, laSau, 'LibraryAsset: đếm trước === đếm sau');
  assert.equal(pauTruoc, pauSau, 'ProjectAssetUsage: đếm trước === đếm sau');
  ok(`dev.db sạch — ProjectFile ${pfTruoc}=${pfSau} · LibraryAsset ${laTruoc}=${laSau} · Usage ${pauTruoc}=${pauSau}`);
  ok(`đĩa sạch — đã dọn ${filesDaGhi.length} file trong ./uploads`);

  console.log(`\n${pass} assertions PASS`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('FAIL', e);
    process.exit(1);
  });
