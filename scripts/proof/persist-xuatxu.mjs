/**
 * scripts/proof/persist-xuatxu.mjs — runtime proof cho W1-6 (`IF-PERSIST-XUATXU-001`).
 *
 * Chứng minh chặng **CHẠM HTTP + ĐĨA** của `lib/capabilities/xuat-xu-ben.ts`: tầng (c) đẩy
 * `XuatXu` lên `POST /api/asset-representation` của một **dev server thật**, và hàng thật rơi
 * xuống **DB thật** (kiểm bằng Prisma, không tin phản hồi HTTP).
 *
 * ── BỀ MẶT ĐÃ CHẠM / CHƯA CHẠM — đọc trước khi trích dẫn kết quả (luật F-16) ──────────────────
 *  ✅ ĐÃ CHẠM: `next dev` runtime HTTP · route `/api/asset-representation` · Prisma/SQLite ·
 *              module ghi bền THẬT (bundle từ nguồn, không viết lại logic trong script này).
 *  🚫 NOT ASSESSED — **tầng (a) localStorage**: nó là kho của TRÌNH DUYỆT. Script node không có
 *     `localStorage` thật; ở đây nó được thay bằng kho giả để tầng (c) chạy được. Tầng (a) đã
 *     được khoá bằng test thuần `lib/capabilities/xuat-xu-ben.test.ts` (8 nhóm ca) — đó là bằng
 *     chứng HỢP ĐỒNG, **không** phải bằng chứng runtime trình duyệt. Ai muốn nâng bậc phải mở
 *     app thật, bấm Nhận, F5, và nhìn bản ghi còn đó.
 *  🚫 NOT ASSESSED — **ca "đổi máy / xoá dữ liệu duyệt web"** cho đường chạy SẢN PHẨM HÔM NAY:
 *     tầng (c) đòi `assetId` có thật, mà `StageToolbelt.tsx` **chưa truyền `nguonId`** vào
 *     `chayDungHinhAnh()` ⇒ trong app hiện tại tầng (c) không nổ, và xuất xứ chỉ sống ở
 *     localStorage của MỘT máy. Script này chứng minh tầng (c) ĐÚNG khi có `assetId` — tức nó
 *     sẵn sàng cho ngày Toolbelt truyền `nguonId` — **không** chứng minh hôm nay đã bền xuyên máy.
 *     Nói khác đi là nói dối.
 *
 * ⚠️ CỔNG HARNESS (F-15) ở CA 0: kiểm **sản phẩm** của công cụ, không kiểm mã thoát của nó —
 *    bundle phải có thân, phải xuất đủ hàm, và phải **cư xử đúng** (cờ tắt ⇒ `boQua: 'co-tat'`).
 *    Một file rỗng hoặc một stub sẽ đỏ ngay tại đây; cổng đỏ ⇒ `exit 1`, cấm in ĐẠT phía sau.
 * ⚠️ F-17: mỗi khẳng định về nội dung đều có một khẳng định về **chủ thể** đứng trước (trường có
 *    tồn tại và đúng kiểu không), và nhóm ca có ca **mong THẤY** (CA 1–4) chứ không chỉ toàn
 *    "không thấy".
 *
 * ⚠️ CƠ CHẾ COOKIE: module ghi bền gọi `fetch` với `credentials:'include'` — trong trình duyệt
 *    cookie tự đi kèm, trong node thì KHÔNG. Script bọc `globalThis.fetch` để gắn cookie, tức
 *    **đóng vai bình cookie của trình duyệt**. Đây là thay thế có khai báo, không phải giả vờ.
 *
 * Chạy:  node scripts/proof/persist-xuatxu.mjs
 */

import { spawn, spawnSync } from 'child_process';
import { readFileSync, statSync, mkdirSync, rmSync } from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { SignJWT } from 'jose';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const TAG = `__proof_xuatxu_${Date.now()}`;
const PORT = 3031;

/** Bundle PHẢI nằm TRONG repo — đặt ở /tmp là MODULE_NOT_FOUND (node_modules không tra tới). */
const OUT_DIR = path.join(process.cwd(), 'node_modules', '.if-proof-xuatxu');

const ket = [];
function ca(ten, mong, got) {
  const dat = JSON.stringify(mong) === JSON.stringify(got);
  ket.push({ ten, dat });
  console.log(`${dat ? '  ok  ' : ' KHÔNG '} ${ten} — mong ${JSON.stringify(mong)}, nhận ${JSON.stringify(got)}`);
  return dat;
}

/* ── .env (bóc cặp nháy — bài học CA 0 của secure-artifact-delivery.mjs) ───────────────────── */
const env = Object.fromEntries(
  readFileSync('.env', 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [
      l.slice(0, l.indexOf('=')).trim(),
      l.slice(l.indexOf('=') + 1).trim().replace(/^(['"])([\s\S]*)\1$/, '$2'),
    ]),
);
if (!env.AUTH_SECRET) throw new Error('Không đọc được AUTH_SECRET — dừng.');

const cookie = async (sub) =>
  `if_session=${await new SignJWT({ sub })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(env.AUTH_SECRET))}`;

/* ── kho giả thay `localStorage` (xem NOT ASSESSED ở đầu file) ─────────────────────────────── */
class KhoGia {
  map = new Map();
  get length() { return this.map.size; }
  getItem(k) { return this.map.has(k) ? this.map.get(k) : null; }
  setItem(k, v) { this.map.set(k, v); }
  removeItem(k) { this.map.delete(k); }
  clear() { this.map.clear(); }
  key(i) { return [...this.map.keys()][i] ?? null; }
}

let server = null;
async function dungServer() {
  server = spawn('npx', ['next', 'dev', '-p', String(PORT)], { env: { ...process.env }, stdio: 'ignore' });
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/api/comments`);
      if (r.status === 401 || r.status === 200) return `http://127.0.0.1:${PORT}`;
    } catch {}
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`Dev server ${PORT} không lên`);
}

async function main() {
  console.log('# W1-6 · ghi bền XuatXu · runtime proof (HTTP + DB thật)\n');

  /* ══ CA 0 · CỔNG HARNESS ═══════════════════════════════════════════════════════════════════ */
  mkdirSync(OUT_DIR, { recursive: true });
  const OUT = path.join(OUT_DIR, 'xuat-xu-ben.cjs');
  const OUT_VG = path.join(OUT_DIR, 'visual-generate.cjs');
  for (const [src, out] of [
    ['lib/capabilities/xuat-xu-ben.ts', OUT],
    ['lib/capabilities/visual-generate.ts', OUT_VG],
  ]) {
    const r = spawnSync('npx', [
      'esbuild', src, '--bundle', '--format=cjs', '--platform=node',
      '--external:@prisma/client', `--outfile=${out}`,
    ], { encoding: 'utf8' });
    if (r.status !== 0) throw new Error(`esbuild ${src} thất bại:\n${r.stderr}`);
  }

  // ① SẢN PHẨM của công cụ, không phải mã thoát của nó: file phải có THÂN.
  const cong1 = ca('CA 0a · HARNESS: bundle có thân (> 1KB), không phải file rỗng', true,
    statSync(OUT).size > 1024 && statSync(OUT_VG).size > 1024);

  const M = (await import(pathToFileURL(OUT).href)).default ?? (await import(pathToFileURL(OUT).href));
  const VG = (await import(pathToFileURL(OUT_VG).href));
  const thieu = ['ghiXuatXuBen', 'coBatPersist', 'docXuatXuBen', 'datGocApi', 'suCoGhiGanNhat', 'xoaSuCoGhi']
    .filter((n) => typeof M[n] !== 'function');
  const cong2 = ca('CA 0b · HARNESS: bundle xuất đủ hàm thật', [], thieu);
  const cong3 = ca('CA 0c · HARNESS: `dungXuatXu` thật nạp được', 'function', typeof VG.dungXuatXu);

  // ② HÀNH VI, không chỉ hình dạng: một stub sẽ không biết trả `boQua:'co-tat'` khi cờ tắt.
  delete process.env.IF_PERSIST_XUATXU;
  delete globalThis.__IF_PERSIST_XUATXU;
  const thu = await M.ghiXuatXuBen({ id: 'harness', xuatXu: { nguon: {} } });
  const cong4 = ca('CA 0d · HARNESS: module cư xử ĐÚNG khi cờ tắt (boQua=co-tat)', 'co-tat', thu.boQua);

  if (!(cong1 && cong2 && cong3 && cong4)) throw new Error('HARNESS ĐỎ — dừng, KHÔNG báo ĐẠT cho ca nào phía sau.');

  /* ══ dựng runtime + dữ liệu thật ═══════════════════════════════════════════════════════════ */
  const base = await dungServer();
  const nguoi = await prisma.user.create({
    data: { email: `${TAG}@proof.local`, name: TAG, passwordHash: 'x' },
  });
  const cNguoi = await cookie(nguoi.id);
  const cong5 = ca('CA 0e · HARNESS: dev server sống + cookie đúc mở được /api/comments', 200,
    (await fetch(`${base}/api/comments`, { headers: { cookie: cNguoi } })).status);
  if (!cong5) throw new Error('HARNESS ĐỎ — dừng.');

  const asset = await prisma.libraryAsset.create({
    data: { userId: nguoi.id, name: `${TAG} ảnh`, path: `${TAG}.png`, mime: 'image/png', category: 'proof' },
  });

  // Đóng vai bình cookie của trình duyệt — khai báo ở docstring đầu file.
  const fetchGoc = globalThis.fetch;
  let guiCookie = true;
  globalThis.fetch = (u, o = {}) =>
    fetchGoc(u, guiCookie ? { ...o, headers: { ...(o.headers ?? {}), cookie: cNguoi } } : o);

  M.datGocApi(base);
  const kho = new KhoGia();
  globalThis.localStorage = kho;

  /** Xuất xứ THẬT, dựng bằng `dungXuatXu()` của sản phẩm — không bịa object trong script này. */
  const lamXuatXu = (nguonId) => {
    const yc = {
      anhNguon: `data:image/png;base64,${'A'.repeat(600)}`,
      nguonId,
      kieuNguon: 'phac',
      yDinh: 'phòng khách tối giản',
      nac: 'nhanh',
      doiAnhSang: 'Daylight',
    };
    return VG.dungXuatXu({
      yeuCau: yc,
      chuoi: VG.dungKeHoach(yc),
      creditUocTinh: 7,
      taoLuc: 1_700_000_000_000,
      provider: 'proof-provider',
      model: 'proof-model',
    });
  };

  const demHang = () => prisma.assetRepresentation.count({ where: { assetId: asset.id, deletedAt: null } });

  /* ══ NHÓM MONG THẤY — cờ BẬT, assetId có thật ══════════════════════════════════════════════ */
  globalThis.__IF_PERSIST_XUATXU = '1';
  M.xoaSuCoGhi();
  const kq = await M.ghiXuatXuBen({
    id: 'p1', xuatXu: lamXuatXu(asset.id), anhKetQua: `data:image/png;base64,${'B'.repeat(600)}`,
  });
  ca('CA 1 · ghi trả ok, không có sự cố máy chủ', [true, undefined], [kq.ok, kq.mayChu]);

  const hang = await prisma.assetRepresentation.findMany({ where: { assetId: asset.id, deletedAt: null } });
  // F-17 · CHỦ THỂ trước: có hàng nào không, rồi mới soi nội dung.
  const coHang = ca('CA 2 · DB THẬT có đúng 1 hàng cho asset này (đây là ca MONG THẤY)', 1, hang.length);
  if (coHang) {
    const h = hang[0];
    ca('CA 3 · trường `provenance` TỒN TẠI, đúng kiểu chuỗi, không rỗng', true,
      typeof h.provenance === 'string' && h.provenance.length > 0);

    let p = null;
    try { p = JSON.parse(h.provenance); } catch {}
    ca('CA 4 · provenance là JSON đọc lại được, và MANG ĐỦ trường XuatXu', [], p
      ? ['nangLucId', 'nguon', 'chuoiLenh', 'thamSo', 'provider', 'model', 'taoLuc', 'creditUocTinh', 'mucSuThat', 'trangThaiNhan']
          .filter((k) => !(k in p))
      : ['KHÔNG PARSE ĐƯỢC']);
    ca('CA 5 · nội dung đúng của lượt vừa chạy (provider · credit · chuỗi lệnh)',
      ['proof-provider', 7, true],
      [p?.provider, p?.creditUocTinh, Array.isArray(p?.chuoiLenh) && p.chuoiLenh.length > 0]);
    ca('CA 6 · KHÔNG nhồi base64 vào DB (ảnh chỉ giữ tham chiếu)', false,
      h.provenance.includes('data:image') || String(h.payloadRef).includes('data:image'));
    ca('CA 7 · `kind`/`truthLevel`/`verifiedBy`: bấm Nhận KHÔNG tự nâng lên verified (cửa duyệt 03)',
      ['image', 'inferred', null], [h.kind, h.truthLevel, h.verifiedBy]);
    ca('CA 8 · `createdBy` là người thật của phiên (không vô chủ)', nguoi.id, h.createdBy);
  }

  /* ══ CỜ TẮT ⇒ KHÔNG GHI GÌ, cả DB lẫn kho cục bộ ═══════════════════════════════════════════ */
  const truoc = await demHang();
  const khoTruoc = kho.map.size;
  delete globalThis.__IF_PERSIST_XUATXU;
  const kqTat = await M.ghiXuatXuBen({ id: 'p2', xuatXu: lamXuatXu(asset.id) });
  ca('CA 9 · cờ TẮT: trả boQua=co-tat, không ok', ['co-tat', false], [kqTat.boQua, kqTat.ok]);
  ca('CA 10 · cờ TẮT: DB KHÔNG mọc thêm hàng nào', truoc, await demHang());
  ca('CA 11 · cờ TẮT: kho cục bộ KHÔNG mọc thêm mục nào', khoTruoc, kho.map.size);
  globalThis.__IF_PERSIST_XUATXU = '1';

  /* ══ MÁY CHỦ TỪ CHỐI ⇒ báo, KHÔNG ném, KHÔNG mất bản ghi cục bộ ════════════════════════════ */
  M.xoaSuCoGhi();
  let nem = null;
  let kqMa = null;
  try {
    kqMa = await M.ghiXuatXuBen({ id: 'p3', xuatXu: lamXuatXu('khong-ton-tai-cuid'), anhKetQua: '' });
  } catch (e) { nem = e?.message ?? 'ném'; }
  ca('CA 12 · assetId không tồn tại: KHÔNG ném ra ngoài', null, nem);
  ca('CA 13 · vẫn ok (tầng cục bộ ghi được) nhưng có sự cố máy chủ mã `tu-choi`',
    [true, 'mayChu', 'tu-choi'], [kqMa?.ok, kqMa?.mayChu?.noi, kqMa?.mayChu?.ma]);
  ca('CA 14 · sự cố ĐỌNG LẠI ở đường báo (ai không kịp subscribe vẫn thấy)', 'tu-choi',
    M.suCoGhiGanNhat()?.ma);
  ca('CA 15 · câu lỗi không rỗng (chống nuốt im lặng — bài học SessionState)', true,
    (M.suCoGhiGanNhat()?.loi ?? '').trim().length > 0);
  ca('CA 16 · bản ghi vẫn vào được kho cục bộ dù máy chủ từ chối', true,
    M.docXuatXuBen().some((b) => b.id === 'p3'));

  /* ══ CHƯA ĐĂNG NHẬP ⇒ 401 ⇒ vẫn là `tu-choi`, không ném ════════════════════════════════════ */
  guiCookie = false;
  M.xoaSuCoGhi();
  const kq401 = await M.ghiXuatXuBen({ id: 'p4', xuatXu: lamXuatXu(asset.id), anhKetQua: '' });
  ca('CA 17 · không phiên: máy chủ chặn, hàm vẫn không ném và vẫn báo', ['mayChu', 'tu-choi'],
    [kq401?.mayChu?.noi, kq401?.mayChu?.ma]);
  ca('CA 18 · không phiên: DB KHÔNG mọc hàng (401 thật sự chặn)', 1, await demHang());
  guiCookie = true;
  globalThis.fetch = fetchGoc;
}

async function don() {
  if (server) server.kill();
  await prisma.assetRepresentation.deleteMany({ where: { asset: { name: { contains: TAG } } } }).catch(() => {});
  await prisma.libraryAsset.deleteMany({ where: { name: { contains: TAG } } });
  const n = await prisma.user.deleteMany({ where: { name: { contains: TAG } } });
  rmSync(OUT_DIR, { recursive: true, force: true });
  console.log(`\n  (đã xoá ${n.count} user + asset + representation gắn thẻ ${TAG}, gỡ bundle tạm)`);
}

main()
  .catch((e) => {
    console.error(e.message);
    ket.push({ ten: 'CHẠY ĐƯỢC', dat: false });
  })
  .finally(async () => {
    await don().catch((e) => console.error('DỌN THẤT BẠI:', e.message));
    await prisma.$disconnect();
    const fail = ket.filter((k) => !k.dat);
    console.log(`\n${ket.length - fail.length}/${ket.length} ĐẠT`);
    console.log('VERDICT: xem khối "BỀ MẶT ĐÃ CHẠM / CHƯA CHẠM" ở đầu tệp — có 2 mục NOT ASSESSED.');
    process.exit(fail.length ? 1 : 0);
  });
