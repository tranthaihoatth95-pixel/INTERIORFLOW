/**
 * scripts/proof/nguonid-xuyen-may.mjs — runtime proof cho W1-6b (`IF-NGUONID-WIRING-001`).
 *
 * ── CÂU HỎI PHIẾU NÀY TRẢ LỜI ────────────────────────────────────────────────────────────────
 * Lát W1-6 chứng minh `xuat-xu-ben.ts` ĐÚNG **khi có `assetId`**, rồi tự khai một `NOT ASSESSED`
 * to bằng cả bàn tay: đường chạy sản phẩm (`StageToolbelt.tsx`) **không truyền `nguonId`**, nên
 * tầng bền xuyên máy chưa bao giờ nổ trong app. Phiếu này đóng đúng lỗ đó, và phải chứng minh
 * bằng **DB SQLite thật**, không phải bằng `localStorage`.
 *
 * ── DÂY CHUYỀN ĐƯỢC ĐO (mỗi mắt là một ca, không mắt nào bị bịa) ──────────────────────────────
 *   `LibraryPanel` phát `item.url` (từ `GET /api/library`, hàng THẬT trong DB)
 *     → `idAssetTuUrl()`   ← hàm THẬT xuất từ `components/ui/StageToolbelt.tsx`
 *     → `dungYeuCau()`     ← hàm THẬT xuất từ `components/ui/StageToolbelt.tsx` (ĐƯỜNG NỐI)
 *     → `dungXuatXu()`     ← `lib/capabilities/visual-generate.ts`
 *     → `ghiXuatXuBen()`   ← `lib/capabilities/xuat-xu-ben.ts`
 *     → `POST /api/asset-representation` trên `next dev` THẬT
 *     → hàng trong `prisma/dev.db`, đọc lại bằng Prisma **và** bằng HTTP sau khi xoá sạch kho cục bộ.
 *
 * Ba module trên được **bundle từ nguồn** rồi nạp vào script — script này KHÔNG viết lại một dòng
 * logic nào của sản phẩm. Chặn `nguonId` ở `dungYeuCau()` là CA 3–8 + CA 14 đỏ ngay (kiểm đột biến
 * đã chạy, xem báo cáo).
 *
 * ── BỀ MẶT ĐÃ CHẠM / CHƯA CHẠM (luật F-16) ───────────────────────────────────────────────────
 *  ✅ ĐÃ CHẠM: hàm nối THẬT của `StageToolbelt.tsx` · `next dev` HTTP · route
 *     `/api/asset-representation` + `/api/library` · Prisma/SQLite thật.
 *  🚫 NOT ASSESSED — **bậc runtime UI**: script node không dựng React, không kéo-thả bằng chuột.
 *     Ca "người kéo ảnh từ kệ Thư viện vào ô nguồn rồi bấm Dựng" chưa được đo trên trình duyệt.
 *     Cái được đo là: các hàm mà chính component đó gọi, chạy thật, ra id thật, rơi xuống DB thật.
 *  🚫 NOT ASSESSED — **tầng (a) localStorage** (kho của trình duyệt): thay bằng kho giả, y như
 *     `persist-xuatxu.mjs` đã khai. Ở đây nó còn được **cố ý xoá sạch** ở CA 14 để chứng minh
 *     dữ liệu không nương vào nó.
 *
 * ⚠️ CỔNG HARNESS (F-15) ở CA 0: kiểm **sản phẩm** của công cụ — bundle phải có thân, phải xuất
 *    đủ hàm, và phải **cư xử đúng**. Bundle rỗng/stub đỏ ngay tại đây; cổng đỏ ⇒ `exit 1`.
 * ⚠️ F-17: mọi khẳng định về nội dung đều có khẳng định về **chủ thể** đứng trước, và nhóm ca có
 *    ca **mong THẤY** (CA 2–8, CA 14) chứ không chỉ toàn "không thấy".
 *
 * Chạy:  node scripts/proof/nguonid-xuyen-may.mjs
 */

import { spawn, spawnSync } from 'child_process';
import { readFileSync, statSync, mkdirSync, rmSync } from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { SignJWT } from 'jose';
import { moDbTam } from './_db-tam.mjs';

// Cách ly khỏi `prisma/dev.db` THẬT — xem `_db-tam.mjs` (cổng #12 của lane QA phát hành).
const db = await moDbTam('nguonid-xuyen-may');
const prisma = db.prisma;
const TAG = `__proof_nguonid_${Date.now()}`;
const PORT = 3033;

/** Bundle PHẢI nằm TRONG repo — đặt ở /tmp là MODULE_NOT_FOUND (node_modules không tra tới). */
const OUT_DIR = path.join(process.cwd(), 'node_modules', '.if-proof-nguonid');

const ket = [];
function ca(ten, mong, got) {
  const dat = JSON.stringify(mong) === JSON.stringify(got);
  ket.push({ ten, dat });
  console.log(`${dat ? '  ok  ' : ' KHÔNG '} ${ten} — mong ${JSON.stringify(mong)}, nhận ${JSON.stringify(got)}`);
  return dat;
}

/* ── .env (bóc cặp nháy quanh giá trị — bài học CA 0 của secure-artifact-delivery.mjs) ─────── */
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

/* ── kho giả thay `localStorage` (xem NOT ASSESSED ở đầu tệp) ──────────────────────────────── */
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
  server = spawn('npx', ['next', 'dev', '-p', String(PORT)], { env: { ...process.env, ...db.env }, stdio: 'ignore' });
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
  console.log('# W1-6b · nối `nguonId` · runtime proof (xuyên máy = DB thật)\n');

  /* ══ CA 0 · CỔNG HARNESS ═══════════════════════════════════════════════════════════════════ */
  mkdirSync(OUT_DIR, { recursive: true });
  const OUT_ST = path.join(OUT_DIR, 'stage-toolbelt.cjs');
  const OUT_XX = path.join(OUT_DIR, 'xuat-xu-ben.cjs');
  const OUT_VG = path.join(OUT_DIR, 'visual-generate.cjs');
  for (const [src, out] of [
    ['components/ui/StageToolbelt.tsx', OUT_ST],
    ['lib/capabilities/xuat-xu-ben.ts', OUT_XX],
    ['lib/capabilities/visual-generate.ts', OUT_VG],
  ]) {
    const r = spawnSync('npx', [
      'esbuild', src, '--bundle', '--format=cjs', '--platform=node',
      '--external:react', '--external:react-dom', '--external:@prisma/client', `--outfile=${out}`,
    ], { encoding: 'utf8' });
    if (r.status !== 0) throw new Error(`esbuild ${src} thất bại:\n${r.stderr}`);
  }

  // ① SẢN PHẨM của công cụ, không phải mã thoát: cả ba bundle phải có THÂN (bắt ca bundle rỗng).
  const cong1 = ca('CA 0a · HARNESS: cả 3 bundle có thân (> 1KB), không phải tệp rỗng', true,
    [OUT_ST, OUT_XX, OUT_VG].every((f) => statSync(f).size > 1024));

  const ST = await import(pathToFileURL(OUT_ST).href);
  const M = await import(pathToFileURL(OUT_XX).href);
  const VG = await import(pathToFileURL(OUT_VG).href);
  const thieu = [
    ['StageToolbelt.idAssetTuUrl', ST.idAssetTuUrl],
    ['StageToolbelt.dungYeuCau', ST.dungYeuCau],
    ['xuat-xu-ben.ghiXuatXuBen', M.ghiXuatXuBen],
    ['xuat-xu-ben.datGocApi', M.datGocApi],
    ['xuat-xu-ben.suCoGhiGanNhat', M.suCoGhiGanNhat],
    ['xuat-xu-ben.xoaSuCoGhi', M.xoaSuCoGhi],
    ['visual-generate.dungXuatXu', VG.dungXuatXu],
    ['visual-generate.dungKeHoach', VG.dungKeHoach],
    ['visual-generate.nhanKetQua', VG.nhanKetQua],
  ].filter(([, f]) => typeof f !== 'function').map(([n]) => n);
  const cong2 = ca('CA 0b · HARNESS: bundle xuất đủ hàm THẬT của sản phẩm', [], thieu);

  // ② HÀNH VI, không chỉ hình dạng: một stub sẽ không biết trả `boQua:'co-tat'` khi cờ tắt.
  delete process.env.IF_PERSIST_XUATXU;
  delete globalThis.__IF_PERSIST_XUATXU;
  const cong3 = ca('CA 0c · HARNESS: module ghi bền cư xử ĐÚNG khi cờ tắt (boQua=co-tat)', 'co-tat',
    (await M.ghiXuatXuBen({ id: 'harness', xuatXu: { nguon: {} } })).boQua);
  // ③ HÀNH VI của chính đường nối: hàm dựng yêu cầu phải trả về một object có `nac`.
  const cong4 = ca('CA 0d · HARNESS: `dungYeuCau` thật trả YeuCauDung có `nac`', 'nhanh',
    ST.dungYeuCau({ kieuNguon: 'phac', yDinh: '', anhSang: '', nangCap: false })?.nac);

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

  // Đóng vai bình cookie của trình duyệt (module gọi `fetch` với `credentials:'include'`).
  const fetchGoc = globalThis.fetch;
  globalThis.fetch = (u, o = {}) => fetchGoc(u, { ...o, headers: { ...(o.headers ?? {}), cookie: cNguoi } });

  M.datGocApi(base);
  let kho = new KhoGia();
  globalThis.localStorage = kho;

  const demHang = () => prisma.assetRepresentation.count({ where: { assetId: asset.id, deletedAt: null } });

  /* ══ MẮT ①: URL do SẢN PHẨM phát ra, không do script bịa ═══════════════════════════════════ */
  const dsRes = await fetch(`${base}/api/library`);
  const ds = await dsRes.json().catch(() => null);
  const mon = Array.isArray(ds?.assets) ? ds.assets.find((a) => a.id === asset.id) : undefined;
  // F-17 · CHỦ THỂ trước: có món không, rồi mới soi `url` của nó.
  const coMon = ca('CA 1 · `GET /api/library` trả về đúng món vừa dựng (chủ thể có thật)', true,
    Boolean(mon) && typeof mon.url === 'string' && mon.url.length > 0);
  if (!coMon) throw new Error('Không lấy được món từ /api/library — dừng, mọi ca sau vô nghĩa.');

  /* ══ MẮT ②–④: URL → id → YeuCauDung → XuatXu.nguon.id ═════════════════════════════════════ */
  ca('CA 2 · `idAssetTuUrl()` THẬT bóc đúng id `LibraryAsset` từ URL sản phẩm phát (MONG THẤY)',
    asset.id, ST.idAssetTuUrl(mon.url));

  const yc = ST.dungYeuCau({
    anhNguon: mon.url,
    kieuNguon: 'phac',
    nguonId: ST.idAssetTuUrl(mon.url),
    yDinh: 'phòng khách tối giản',
    anhSang: 'Daylight',
    nangCap: false,
  });
  ca('CA 3 · ĐƯỜNG NỐI: `dungYeuCau()` mang `nguonId` sang YeuCauDung (MONG THẤY)', asset.id, yc.nguonId);

  // `nhanKetQua()` là bước SẢN PHẨM luôn chạy trước khi ghi bền: `nguon-anh.ts:nhanDeXuat()` chỉ
  // gọi `ghiXuatXuBen` cho một xuất xứ ĐÃ NHẬN. Bỏ bước này là dựng một đường chạy không có thật.
  const xuatXu = VG.nhanKetQua(VG.dungXuatXu({
    yeuCau: yc, chuoi: VG.dungKeHoach(yc), creditUocTinh: 7, taoLuc: 1_700_000_000_000,
  }));
  ca('CA 4 · `dungXuatXu()` đặt id đó vào `XuatXu.nguon.id`, qua `nhanKetQua()` vẫn giữ (MONG THẤY)',
    [asset.id, 'daNhan'], [xuatXu?.nguon?.id, xuatXu?.trangThaiNhan]);

  /* ══ CỜ TẮT ⇒ KHÔNG MỘT HÀNG NÀO RƠI XUỐNG DB ═════════════════════════════════════════════ */
  delete globalThis.__IF_PERSIST_XUATXU;
  const kqTat = await M.ghiXuatXuBen({ id: 'tat1', xuatXu, anhKetQua: '' });
  ca('CA 5 · cờ TẮT: trả boQua=co-tat, không ok', ['co-tat', false], [kqTat.boQua, kqTat.ok]);
  ca('CA 6 · cờ TẮT: DB có ĐÚNG 0 hàng (hành vi y hệt hôm nay)', 0, await demHang());

  /* ══ CỜ BẬT + có `nguonId` ⇒ hàng rơi xuống DB THẬT ════════════════════════════════════════ */
  globalThis.__IF_PERSIST_XUATXU = '1';
  M.xoaSuCoGhi();
  const kq = await M.ghiXuatXuBen({
    id: 'p1', xuatXu, anhKetQua: `data:image/png;base64,${'B'.repeat(600)}`,
  });
  ca('CA 7 · cờ BẬT + có nguonId: ghi trả ok, KHÔNG có sự cố máy chủ', [true, undefined],
    [kq.ok, kq.mayChu]);

  const hang = await prisma.assetRepresentation.findMany({ where: { assetId: asset.id, deletedAt: null } });
  const coHang = ca('CA 8 · DB THẬT có ĐÚNG 1 hàng AssetRepresentation (MONG THẤY)', 1, hang.length);
  if (coHang) {
    const h = hang[0];
    ca('CA 9 · `provenance` TỒN TẠI, đúng kiểu chuỗi, không rỗng', true,
      typeof h.provenance === 'string' && h.provenance.length > 0);
    let p = null;
    try { p = JSON.parse(h.provenance); } catch {}
    ca('CA 10 · `provenance` bóc ra ĐỦ trường của XuatXu', [], p
      ? ['nangLucId', 'nguon', 'chuoiLenh', 'thamSo', 'taoLuc', 'creditUocTinh', 'mucSuThat', 'trangThaiNhan']
          .filter((k) => !(k in p))
      : ['KHÔNG PARSE ĐƯỢC']);
    ca('CA 11 · trong `provenance`, `nguon.id` chính là id asset (gia phả không đứt)',
      asset.id, p?.nguon?.id);
    ca('CA 12 · KHÔNG nhồi base64 vào DB (ảnh chỉ giữ tham chiếu)', false,
      h.provenance.includes('data:image') || String(h.payloadRef).includes('data:image'));
    ca('CA 13 · bấm Nhận KHÔNG tự nâng verified (kind/truthLevel/verifiedBy)',
      ['image', 'inferred', null], [h.kind, h.truthLevel, h.verifiedBy]);
  }

  /* ══ CA XUYÊN MÁY: xoá sạch kho cục bộ rồi đọc lại — dữ liệu phải CÒN ═══════════════════════ */
  kho = new KhoGia(); // máy khác: chưa từng có `if.xuatXu.v1` nào
  globalThis.localStorage = kho;
  const khoRong = ca('CA 14a · giả lập đổi máy: kho cục bộ đã sạch trơn', [0, []],
    [kho.map.size, M.docXuatXuBen().map((b) => b.id)]);
  const gRes = await fetch(`${base}/api/asset-representation?assetId=${encodeURIComponent(asset.id)}`);
  const g = await gRes.json().catch(() => null);
  const dsRep = Array.isArray(g?.representations) ? g.representations : null;
  const coRep = ca('CA 14b · máy mới đọc HTTP: chủ thể có thật, đúng 1 cách thể hiện (MONG THẤY)',
    [200, 1], [gRes.status, dsRep ? dsRep.length : -1]);
  if (khoRong && coRep) {
    let p2 = null;
    try { p2 = JSON.parse(dsRep[0].provenance); } catch {}
    ca('CA 14c · XUYÊN MÁY: xuất xứ đọc lại được nguyên vẹn từ DB, không nương localStorage',
      [asset.id, 'visual-generate', 'daNhan'],
      [p2?.nguon?.id, p2?.nangLucId, p2?.trangThaiNhan]);
  }

  /* ══ `nguonId` SAI / KHÔNG TỒN TẠI ⇒ ĐO hành vi thật, không mong ═══════════════════════════ */
  M.xoaSuCoGhi();
  const truocSai = await demHang();
  let nem = null;
  let kqSai = null;
  try {
    const ycSai = ST.dungYeuCau({
      anhNguon: mon.url, kieuNguon: 'phac', nguonId: 'khong-ton-tai-cuid',
      yDinh: '', anhSang: '', nangCap: false,
    });
    kqSai = await M.ghiXuatXuBen({
      id: 'p2',
      xuatXu: VG.nhanKetQua(VG.dungXuatXu({ yeuCau: ycSai, chuoi: VG.dungKeHoach(ycSai), creditUocTinh: 1, taoLuc: 1 })),
      anhKetQua: '',
    });
  } catch (e) { nem = e?.message ?? 'ném'; }
  ca('CA 15 · nguonId không tồn tại: KHÔNG ném ra ngoài (luồng Nhận không rơi)', null, nem);
  // ĐO ĐƯỢC: route trả 404 ⇒ module ghi lại `tu-choi`. Ghi đúng thứ đo được, không ghi thứ mong.
  ca('CA 16 · nguonId không tồn tại: máy chủ 404 ⇒ sự cố `mayChu/tu-choi`, câu lỗi có mã 404',
    ['mayChu', 'tu-choi', true],
    [kqSai?.mayChu?.noi, kqSai?.mayChu?.ma, /404/.test(kqSai?.mayChu?.loi ?? '')]);
  ca('CA 17 · nguonId không tồn tại: DB KHÔNG mọc thêm hàng nào cho asset thật', truocSai, await demHang());
  ca('CA 18 · sự cố ĐỌNG LẠI ở đường báo, câu lỗi không rỗng (chống nuốt im lặng)',
    ['tu-choi', true], [M.suCoGhiGanNhat()?.ma, (M.suCoGhiGanNhat()?.loi ?? '').trim().length > 0]);

  /* ══ ĐƯỜNG TỆP CỤC BỘ (không có id) ⇒ vẫn y như hôm nay: không chạm DB, không báo sự cố ════ */
  M.xoaSuCoGhi();
  const truocCucBo = await demHang();
  const ycTep = ST.dungYeuCau({
    anhNguon: 'data:image/png;base64,AAAA', kieuNguon: 'phac', yDinh: '', anhSang: '', nangCap: false,
  });
  ca('CA 19 · ảnh chọn bằng hộp thoại tệp: KHÔNG có nguonId (cấm bịa id)', undefined, ycTep.nguonId);
  const kqTep = await M.ghiXuatXuBen({
    id: 'p3',
    xuatXu: VG.nhanKetQua(VG.dungXuatXu({ yeuCau: ycTep, chuoi: VG.dungKeHoach(ycTep), creditUocTinh: 1, taoLuc: 1 })),
    anhKetQua: '',
  });
  ca('CA 20 · không có nguonId: ok cục bộ, KHÔNG báo sự cố máy chủ (không áp dụng ≠ sự cố)',
    [true, undefined], [kqTep.ok, kqTep.mayChu]);
  ca('CA 21 · không có nguonId: DB KHÔNG mọc hàng — đúng hiện trạng trước lát này', truocCucBo, await demHang());

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
    await db.dong();
    const fail = ket.filter((k) => !k.dat);
    console.log(`\n${ket.length - fail.length}/${ket.length} ĐẠT`);
    console.log('VERDICT: xem khối "BỀ MẶT ĐÃ CHẠM / CHƯA CHẠM" ở đầu tệp — bậc runtime UI là NOT ASSESSED.');
    process.exit(fail.length ? 1 : 0);
  });
