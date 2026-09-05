/**
 * app/api/project-files/[id]/file/route.test.ts — INTEGRATION test trên `dev.db` THẬT, khuôn
 * `lib/server/promote.test.ts` + `app/api/project-asset-usage/route.test.ts`.
 *
 * ⭐ `docNoiDungProjectFile()` được gọi **THẬT**, không mô phỏng — nó cố ý nhận `userId` thay vì
 * gọi `getSessionUser()` (cần cookie thật, giới hạn đã ghi ở `draft-project.test.ts`) nên chạy
 * được ngoài route. Phần route bọc ngoài chỉ còn: đọc session → dịch kết quả sang NextResponse.
 *
 * PHỦ: đọc được khi là thành viên (kèm header) · KHÔNG phải thành viên · tệp xoá mềm · file mất
 * trên đĩa (410) · path traversal bị chặn · Content-Type sniff lại từ byte thật, không tin cột
 * `mime` · PDF ra `attachment`.
 *
 * ⛔ ĐIỂM NGHIỆM THU CỨNG: mọi `ProjectFile` do CHÍNH lượt này tạo phải xoá hết (kiểm theo id đã
 * ghi trong `pfDaTao`), và mọi file ghi ra `./uploads` phải được dọn.
 * 🔴 KHÔNG khẳng định đếm TOÀN CỤC trước === sau: `npm test` chạy `-P8`, tệp test khác cũng ghi
 * `dev.db` ⇒ khẳng định một con số mình không sở hữu là test-đỏ-giả. Lý do đầy đủ ở khối dọn dẹp
 * cuối `main()` — đừng khôi phục phép so sánh toàn cục.
 *
 * Chạy: node_modules/.bin/sucrase-node 'app/api/project-files/[id]/file/route.test.ts'
 */
import assert from 'node:assert';
import { unlink } from 'node:fs/promises';
import path from 'node:path';

/* ══════════════ Giàn giáo nạp module — REUSE nguyên khuôn `route.guard.test.ts:18-27` ═════════
 * `sucrase-node` không hiểu alias `@/…`, mà `lib/server/access.ts` (cửa kiểm quyền DUY NHẤT của
 * repo) import `@/lib/server/db`. Vá tại chỗ — KHÔNG đụng hạ tầng chung, KHÔNG thêm gói, và
 * TUYỆT ĐỐI không fork một bản kiểm quyền thứ hai chỉ để test chạy được. */
const Module = require('node:module');
const REPO = path.resolve(__dirname, '../../../../..');
const resolveGoc = Module._resolveFilename;
Module._resolveFilename = function (yeuCau: string, ...rest: unknown[]) {
  return resolveGoc.call(this, yeuCau.startsWith('@/') ? path.join(REPO, yeuCau.slice(2)) : yeuCau, ...rest);
};

/* eslint-disable @typescript-eslint/no-var-requires */
const { prisma } = require('../../../../../lib/server/db');
const { docNoiDungProjectFile, tenFileAnToan } = require('../../_lib/doc-noi-dung');
const { docDataUrl, luuProjectFile } = require('../../_lib/luu-file');

let pass = 0;
function ok(label: string) {
  pass += 1;
  console.log(`  ✓ ${label}`);
}

/** PNG 1×1 hợp lệ — magic bytes THẬT để `sniffKind` nhận ra (không bịa header). */
const PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
/** PDF tối thiểu — `%PDF-` là magic bytes `sniffKind` dùng. */
const PDF_DATA_URL = `data:application/pdf;base64,${Buffer.from('%PDF-1.4\n% test\n').toString('base64')}`;

const filesDaGhi: string[] = [];
/** id ProjectFile do CHÍNH tệp test này tạo — dùng để kiểm rác của mình, không kiểm đếm toàn cục. */
const pfDaTao: string[] = [];

interface Ctx {
  userId: string;
  nguoiLa: string;
  projectId: string;
}

async function withFixture<T>(fn: (ctx: Ctx) => Promise<T>): Promise<T> {
  const rand = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const user = await prisma.user.create({
    data: { email: `test-pffile-${rand()}@test.local`, name: 'Test PF-FILE', passwordHash: 'x' },
  });
  // Người thứ hai KHÔNG phải thành viên dự án — và cố ý KHÔNG phải admin (admin là cửa hậu
  // `access.ts:47`, dùng admin ở đây sẽ làm ca "không phải thành viên" luôn PASS giả).
  const nguoiLa = await prisma.user.create({
    data: { email: `test-pffile-la-${rand()}@test.local`, name: 'Người lạ', passwordHash: 'x' },
  });
  assert.equal(nguoiLa.isAdmin, false, 'người lạ phải KHÔNG phải admin, nếu không ca 404 là giả');
  const project = await prisma.project.create({ data: { userId: user.id, name: 'Dự án test PF-FILE' } });
  await prisma.projectMember.create({ data: { projectId: project.id, userId: user.id, role: 'owner' } });
  try {
    return await fn({ userId: user.id, nguoiLa: nguoiLa.id, projectId: project.id });
  } finally {
    await prisma.projectFile.deleteMany({ where: { projectId: project.id } });
    await prisma.projectMember.deleteMany({ where: { projectId: project.id } });
    await prisma.project.delete({ where: { id: project.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: nguoiLa.id } }).catch(() => {});
  }
}

/** Ghi file thật vào ./uploads + tạo bản ghi ProjectFile — đúng thân POST route (sau auth). */
async function taoTep(ctx: { projectId: string; userId: string; name: string; dataUrl: string }) {
  const doc = docDataUrl(ctx.dataUrl);
  assert.ok(doc.ok, 'dataUrl mẫu phải hợp lệ');
  if (!doc.ok) throw new Error('unreachable');
  const luu = await luuProjectFile(doc.buf);
  assert.ok(luu.ok, 'luuProjectFile phải thành công');
  if (!luu.ok) throw new Error('unreachable');
  filesDaGhi.push(luu.path);
  /* Ghi lại id để cuối lượt kiểm đúng HÀNG CỦA MÌNH, không kiểm đếm toàn cục —
     xem lý do ở khối dọn dẹp cuối `main()`. */
  const pfMoi = await prisma.projectFile.create({
    data: {
      projectId: ctx.projectId,
      name: ctx.name,
      mime: luu.mime,
      path: luu.path,
      contentHash: luu.contentHash,
      uploadedBy: ctx.userId,
      lastEditedBy: ctx.userId,
    },
  });
  pfDaTao.push(pfMoi.id);
  return pfMoi;
}

async function main() {
  console.log('\n▶ project-files/[id]/file — route đọc nội dung\n');

  const pfTruoc = await prisma.projectFile.count();

  /* ═══ ① phần THUẦN — chặn tên file, không cần DB ═══ */
  assert.equal(tenFileAnToan('m1abc_x9y8z7.png'), true);
  assert.equal(tenFileAnToan('../../.env'), false);
  assert.equal(tenFileAnToan('../secret.png'), false);
  assert.equal(tenFileAnToan('sub/dir.png'), false);
  assert.equal(tenFileAnToan('a\\b.png'), false);
  assert.equal(tenFileAnToan('/etc/passwd'), false);
  assert.equal(tenFileAnToan('.hidden'), false);
  assert.equal(tenFileAnToan(''), false);
  ok('tenFileAnToan: nhận tên phẳng, từ chối ../ · / · \\ · tuyệt đối · rỗng · ẩn');

  await withFixture(async ({ userId, nguoiLa, projectId }) => {
    /* ═══ ② thành viên đọc được ẢNH — Content-Type sniff từ byte thật ═══ */
    const anh = await taoTep({ projectId, userId, name: 'anh-test.png', dataUrl: PNG_DATA_URL });
    const r1 = await docNoiDungProjectFile(userId, anh.id);
    assert.ok(r1.ok, 'thành viên phải đọc được');
    if (!r1.ok) return;
    assert.ok(r1.buf.length > 0, 'phải có byte');
    assert.equal(r1.buf.subarray(1, 4).toString('ascii'), 'PNG', 'đúng nội dung PNG đã ghi');
    assert.equal(r1.headers['Content-Type'], 'image/png');
    assert.equal(r1.headers['X-Content-Type-Options'], 'nosniff');
    assert.equal(r1.headers['Cache-Control'], 'private, max-age=86400');
    assert.equal(r1.headers['Content-Disposition'], undefined, 'ảnh raster hiện inline, không tải về');
    ok('thành viên đọc được ảnh · Content-Type=image/png · nosniff · cache private');

    /* ═══ ③ KHÔNG tin cột `mime` trong DB — sniff lại byte thật ═══ */
    await prisma.projectFile.update({ where: { id: anh.id }, data: { mime: 'text/html' } });
    const r2 = await docNoiDungProjectFile(userId, anh.id);
    assert.ok(r2.ok);
    if (!r2.ok) return;
    assert.equal(r2.headers['Content-Type'], 'image/png', 'cột mime bị bẩn KHÔNG được lọt ra header');
    ok('cột `mime` = text/html mà byte là PNG ⇒ vẫn trả image/png (sniff thắng DB)');
    await prisma.projectFile.update({ where: { id: anh.id }, data: { mime: 'image/png' } });

    /* ═══ ④ PDF ⇒ attachment, không inline ═══ */
    const pdf = await taoTep({ projectId, userId, name: 'ho sơ/đề bài.pdf', dataUrl: PDF_DATA_URL });
    const r3 = await docNoiDungProjectFile(userId, pdf.id);
    assert.ok(r3.ok);
    if (!r3.ok) return;
    assert.equal(r3.headers['Content-Type'], 'application/octet-stream');
    assert.ok(r3.headers['Content-Disposition']?.startsWith('attachment;'), 'PDF phải là attachment');
    assert.ok(!/[/\\"]/.test(r3.headers['Content-Disposition']!.split('filename="')[1]!.slice(0, -1)),
      'tên file trong header phải đã làm sạch');
    ok('PDF ⇒ octet-stream + attachment, tên file đã làm sạch');

    /* ═══ ⑤ KHÔNG phải thành viên ═══ */
    const r4 = await docNoiDungProjectFile(nguoiLa, anh.id);
    assert.equal(r4.ok, false, 'người ngoài dự án KHÔNG được đọc');
    if (r4.ok) return;
    // 404 chứ không 403 — CỐ Ý, `access.ts:44` không tiết lộ dự án có tồn tại. Nếu ai đó đổi
    // thành 403, test này đỏ và phải đọc lại lý do ở doc-noi-dung.ts trước khi sửa test.
    assert.equal(r4.status, 404, 'không phải thành viên ⇒ 404 (không lộ sự tồn tại của dự án)');
    ok('người ngoài dự án bị chặn (404 theo hợp đồng access.ts, không phải 403)');

    /* ═══ ⑥ tệp xoá mềm ⇒ 404 ═══ */
    await prisma.projectFile.update({ where: { id: pdf.id }, data: { deletedAt: new Date() } });
    const r5 = await docNoiDungProjectFile(userId, pdf.id);
    assert.equal(r5.ok, false);
    if (r5.ok) return;
    assert.equal(r5.status, 404, 'tệp xoá mềm ⇒ 404');
    ok('tệp đã xoá mềm ⇒ 404 (không phục vụ nội dung nữa)');

    /* ═══ ⑦ id không tồn tại ⇒ 404 ═══ */
    const r6 = await docNoiDungProjectFile(userId, 'khong-ton-tai-abc123');
    assert.equal(r6.ok, false);
    if (r6.ok) return;
    assert.equal(r6.status, 404);
    ok('id không tồn tại ⇒ 404');

    /* ═══ ⑧ bản ghi CÒN mà file MẤT trên đĩa ⇒ 410 (không phải 404, không phải 500) ═══ */
    const mat = await taoTep({ projectId, userId, name: 'sap-mat.png', dataUrl: PNG_DATA_URL });
    await unlink(path.join(process.cwd(), 'uploads', mat.path));
    filesDaGhi.splice(filesDaGhi.indexOf(mat.path), 1); // đã xoá rồi, khỏi dọn lần nữa
    const r7 = await docNoiDungProjectFile(userId, mat.id);
    assert.equal(r7.ok, false);
    if (r7.ok) return;
    assert.equal(r7.status, 410, 'file mất trên đĩa ⇒ 410 Gone');
    ok('bản ghi còn + file mất trên đĩa ⇒ 410 (ca thật, cùng khuôn library/[id]/file)');

    /* ═══ ⑨ PATH TRAVERSAL — cột `path` bị nhét đường thoát kho ⇒ chặn, KHÔNG đọc ra ngoài ═══ */
    const doc = await taoTep({ projectId, userId, name: 'ke-gian.png', dataUrl: PNG_DATA_URL });
    for (const ac of ['../../package.json', '../.env', '/etc/passwd', 'a/../../b.png']) {
      await prisma.projectFile.update({ where: { id: doc.id }, data: { path: ac } });
      const r = await docNoiDungProjectFile(userId, doc.id);
      assert.equal(r.ok, false, `path "${ac}" phải bị chặn`);
      if (!r.ok) assert.equal(r.status, 410, `path "${ac}" ⇒ 410, không rò nội dung`);
    }
    ok('path traversal (4 biến thể) bị chặn — không byte nào ngoài ./uploads lọt ra');
  });

  /* ═══ dọn file vật lý đã ghi ═══ */
  let daDon = 0;
  for (const f of filesDaGhi) {
    await unlink(path.join(process.cwd(), 'uploads', f)).then(() => { daDon += 1; }).catch(() => {});
  }

  /* 🔴 SỬA 20/08 — trước đây ba dòng dưới khẳng định ĐẾM TOÀN CỤC trước === sau. Sai ở chỗ:
     `npm test` chạy `-P8`, tức TÁM tệp test song song, và có tệp khác cũng ghi `dev.db`
     (`project-asset-usage/route.test.ts`). Test này vì thế khẳng định một con số NÓ KHÔNG SỞ HỮU:
     hàng của tệp khác sinh/xoá giữa chừng cũng làm nó đỏ. Chạy riêng thì 11/11 PASS — đúng dấu
     hiệu test-đỏ-giả.
     Test đỏ giả nguy hiểm hơn test thiếu: nó dạy người ta bỏ qua màu đỏ, và lần đỏ THẬT sẽ trôi.
     ⇒ Chỉ khẳng định trên NHỮNG HÀNG TỆP NÀY TỰ TẠO (biết id, xoá xong phải hết), không đụng
     tới đếm toàn cục nữa. Vẫn chứng minh đúng điều cần chứng minh: lượt này không để lại rác. */
  const conSot = await prisma.projectFile.count({ where: { id: { in: pfDaTao } } });
  assert.equal(conSot, 0, `ProjectFile của lượt này còn sót ${conSot} hàng`);
  ok(`dev.db sạch — ${pfDaTao.length} ProjectFile của lượt này đã xoá hết (đếm toàn cục ${pfTruoc}→${await prisma.projectFile.count()} có thể đổi do tệp test khác chạy song song, KHÔNG phải rác của lượt này)`);
  ok(`đĩa sạch — đã dọn ${daDon} file trong ./uploads`);

  console.log(`\n${pass} assertions PASS`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('FAIL', e);
    process.exit(1);
  });
