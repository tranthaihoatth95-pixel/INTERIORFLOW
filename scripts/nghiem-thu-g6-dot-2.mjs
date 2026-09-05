/**
 * scripts/nghiem-thu-g6-dot-2.mjs — G6 ĐỢT 2: ba lỗ còn lại + lát cắt NỘI DUNG TỐI THIỂU.
 *
 * VÌ SAO CÓ BỘ NÀY, VÀ VÌ SAO KHÔNG NHỒI VÀO `nghiem-thu-g6-kho-mo-dau.mjs`:
 * bộ kia trả lời *"tầng hạt giống có tới MÀN KHO VẬT LIỆU không"*. Bộ này trả lời một câu khác:
 * *"nó có tới **MỌI MẶT TIỀN** không, và người dùng đi trọn được một vòng nghề chưa"*. Đợt 1 tự
 * khai hai lỗ (kệ Thư viện chưa qua mắt · nhánh đã-đăng-nhập chưa đo); đây là chỗ đóng chúng.
 *
 * ⛔ LUẬT PASS ÁP ĐÚNG NGHĨA: *THAO TÁC → GHI XUỐNG → **ĐÓNG HẲN** → VÀO LẠI → CÙNG MỘT SỰ THẬT.*
 * K9 của đợt 1 dùng `newContext()` + `page.goto()` — đó là **TẢI LẠI**, không phải đóng hẳn:
 * `newContext()` vứt IndexedDB lúc đóng, nên nó không bao giờ chứng minh được thứ gì về kho
 * `.idfc` (kho đó đã dời sang IndexedDB từ W0.3 19/08). Bộ này dùng `launchPersistentContext`
 * với hồ sơ TRÊN ĐĨA và **tắt hẳn trình duyệt** giữa hai lượt.
 *
 * CHẠY:
 *   node scripts/nghiem-thu-g6-dot-2.mjs                 # phần THUẦN + hiệu chuẩn
 *   node scripts/nghiem-thu-g6-dot-2.mjs --tren-app      # + trình duyệt thật (cần dev server)
 *   … --cong=3092 --tk=… --mk=…                          # cổng và tài khoản kiểm
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const GOC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const doiSo = (t, mac) => {
  const h = process.argv.find((a) => a.startsWith(`--${t}=`));
  return h ? h.slice(t.length + 3) : mac;
};
const TREN_APP = process.argv.includes('--tren-app');
const CONG = doiSo('cong', '3092');
const GOC_URL = `http://localhost:${CONG}`;
const TK = doiSo('tk', 'kiem@localhost.test');
const MK = doiSo('mk', '');
const THU_MUC_ANH = path.join(GOC, 'docs/delivery/anh-duyet-mat/g6-dot-2');

/* sucrase-node cho phép nạp thẳng TS của repo — dùng ĐÚNG mã sản phẩm, không chép lại logic. */
const { addHook } = await import(`${GOC}/node_modules/pirates/lib/index.js`);
const { transform } = await import(`${GOC}/node_modules/sucrase/dist/index.js`);
addHook((code, f) => transform(code, { transforms: ['typescript', 'imports', 'jsx'], filePath: f }).code, {
  exts: ['.ts', '.tsx'],
  ignoreNodeModules: true,
});
const nap = (p) => require(path.join(GOC, p));
const { createRequire } = await import('node:module');
const require = createRequire(import.meta.url);

const KHO = nap('lib/materials/kho-mo-dau.ts');
const HG = nap('lib/materials/hat-giong.ts');
const HG3D = nap('lib/library/hat-giong-3d.ts');
const TPG = nap('lib/materials/tang-phan-giai.ts');
const NGAN = nap('app/files/_lib/ngan-tho.ts');
const OVERVIEW = nap('lib/library/overview.ts');
const SHELVES = nap('lib/library/shelves.ts');
const CADMAT = nap('lib/cad/materials.ts');
const BOQ = nap('lib/boq/compute.ts');

const SOI = HG.VAT_LIEU_HAT_GIONG[0];

/* ─────────────────────── sổ khẳng định ─────────────────────── */
const so = [];
let khauHienTai = '';
const khau = (t) => { khauHienTai = t; };
const doi = (nhan, dat, chiTiet) => { so.push({ khau: khauHienTai, nhan, dat: !!dat, chiTiet: String(chiTiet ?? '') }); };
function inSo(ds) {
  let k = '';
  for (const d of ds) {
    if (d.khau !== k) { k = d.khau; console.log(`\n── ${k} ──`); }
    console.log(`  ${d.dat ? 'ok  ' : 'ĐỎ  '}- ${d.nhan}${d.chiTiet ? `\n         ${d.chiTiet}` : ''}`);
  }
}

/* ═══════════════════════ PHẦN THUẦN ═══════════════════════
   `theGioi` cho phép HIỆU CHUẨN: mỗi khâu phải ĐỎ được vì đúng khẳng định của nó, chứ không
   phải vì hạ tầng ngã. Bộ nào đỏ ở mọi thế giới thì nó không chứng minh gì. */
const THAT = {
  ten: 'thật',
  hatGiongVatLieu: () => KHO.hangHatGiong(),
  khoaTra: (m) => KHO.khoaBaMat(m),
  demHatGiongKe: (id) => SHELVES.builtinCount(id),
  demCauKienHatGiong: () => HG3D.cauKienHatGiongTrenKe().length,
};
/* thế giới HỎNG ①: ngăn Phần thô quay về đọc MỖI `/api/specs` (đúng hiện trạng trước 04/09). */
const HONG_NGAN_KHONG_TRON = { ...THAT, ten: 'ngăn Phần thô thôi trộn hạt giống', hatGiongVatLieu: () => [] };
/* thế giới HỎNG ②: tra ba mặt bằng `sku` như trước — lệch namespace với kho PBR khoá theo UUID. */
const HONG_KHOA_SKU = { ...THAT, ten: 'tra ba mặt bằng sku thay vì khoá đúng loại dòng', khoaTra: (m) => m.sku ?? null };
/* thế giới HỎNG ③: trang tổng thôi đếm hàng theo bản cài. */
const HONG_TRANG_TONG = { ...THAT, ten: 'trang tổng thôi đếm hàng theo bản cài', demHatGiongKe: () => 0, demCauKienHatGiong: () => 0 };

function chayThuan(the) {
  so.length = 0;

  /* ── K10 · NGĂN PHẦN THÔ ĐỌC ĐỦ HAI TẦNG ────────────────────────────────── */
  khau('K10 · NGĂN PHẦN THÔ — máy sạch KHÔNG được nói "kho chung chưa có món nào"');

  const hatGiong = the.hatGiongVatLieu();
  const khoChungMaySach = KHO.tronHatGiong([]).filter((m) => hatGiong.length > 0);
  doi(
    'kho chung trên máy sạch CÓ hàng (bản cài ship sẵn, không phụ thuộc máy chủ)',
    khoChungMaySach.length > 0,
    `${khoChungMaySach.length} món: ${khoChungMaySach.map((m) => m.sku).join(', ') || '(RỖNG)'}`,
  );
  const tomTat = NGAN.tomTatNganTho([], khoChungMaySach.length);
  doi(
    'dòng tổng nói ĐÚNG hiện trạng, không nói "chưa có món nào"',
    khoChungMaySach.length > 0 && !/chưa có món nào/.test(tomTat.vi),
    `"${tomTat.vi}"`,
  );

  /* ── K11 · KHOÁ TRA ĐÚNG NAMESPACE ──────────────────────────────────────── */
  khau('K11 · KHOÁ TRA — vật liệu ĐÃ ĐỦ định nghĩa không được rơi vào ngăn thô');

  const pbrMap = TPG.pbrMapBaTang({ studio: {} });
  const hang = KHO.tronHatGiong([]);
  /* gọi `locMonTho` với khoá do `the` cấp — thế giới hỏng ② ép nó về `sku` để chứng minh bẫy. */
  const thoTheoKhoa = hang.filter((m) => {
    const khoa = the.khoaTra(m);
    if (!khoa) return false;
    const facets = nap('lib/materials/resolve.ts').getMaterial(khoa, { pbrMap, specs: hang, defs: CADMAT.MATERIALS });
    const ba = nap('lib/materials/ba-mat.ts').baMatCuaVatLieu(facets);
    return ba.mats.find((x) => x.khoa === 'dung3d')?.trangThai !== 'du';
  });
  doi(
    'khoá tra khớp kho PBR ⇒ 0 món hạt giống bị bày ra như hàng thô',
    thoTheoKhoa.length === 0,
    thoTheoKhoa.length === 0
      ? `${hang.length} món hạt giống đều đọc ra đủ thông số render`
      : `🔴 ${thoTheoKhoa.length} món ĐÃ ĐỦ định nghĩa nhưng bị coi là thô: ${thoTheoKhoa.map((m) => m.sku).join(', ')}`,
  );
  const thoThat = NGAN.locMonTho(hang, { pbrMap, specs: hang, defs: CADMAT.MATERIALS });
  doi(
    '`locMonTho` (mã sản phẩm thật) cũng cho 0 món thô',
    thoThat.length === 0,
    `${thoThat.length} món thô`,
  );

  /* ── K12 · TRANG TỔNG THƯ VIỆN ──────────────────────────────────────────── */
  khau('K12 · TRANG TỔNG — không được ghi "Kho trống" trong khi kệ có hàng');

  const RONG_IN = {
    daTaiKho: true, items: [], idfcKinds: [],
    dna: { soThe: 0, soDuAn: 0 },
    knowledge: { tong: 0, daKiem: 0, hienHanh: 0, daThayThe: 0, theoLoai: { 'quy-chuan': 0, 'tai-lieu-du-an': 0 } },
  };
  const muc = OVERVIEW.buildLibraryOverview(RONG_IN);
  const vatLieu = muc.find((m) => m.id === 'vat-lieu');
  const cauKien = muc.find((m) => m.id === 'cau-kien');
  const nHgVatLieu = the.demHatGiongKe('common-atlas');
  const nHgCauKien = the.demCauKienHatGiong();

  doi(
    'mục VẬT LIỆU đếm cả hàng theo bản cài (kho DB rỗng vẫn SỐNG)',
    vatLieu?.count === nHgVatLieu && nHgVatLieu > 0 && vatLieu?.trangThai === 'song',
    `count=${vatLieu?.count} · trạng thái=${vatLieu?.trangThai} · hạt giống trên kệ=${nHgVatLieu}`,
  );
  doi(
    'mục CẤU KIỆN đếm cả hàng theo bản cài',
    cauKien?.count === nHgCauKien && nHgCauKien > 0 && cauKien?.trangThai === 'song',
    `count=${cauKien?.count} · trạng thái=${cauKien?.trangThai} · hạt giống trên kệ=${nHgCauKien}`,
  );
  doi(
    'SỐ TRÊN TRANG TỔNG = SỐ TRÊN KỆ (hai chỗ không được lệch nhau)',
    vatLieu?.count === SHELVES.builtinCount('common-atlas') && cauKien?.count === HG3D.cauKienHatGiongTrenKe().length,
    `trang tổng ${vatLieu?.count}/${cauKien?.count} · kệ ${SHELVES.builtinCount('common-atlas')}/${HG3D.cauKienHatGiongTrenKe().length}`,
  );
  /* Ba kệ dưới đây THẬT SỰ rỗng — "Kho trống" ở đó là SỰ THẬT, không phải lỗi. Khẳng định này giữ
     cho lần vá sau không đi bịt mồm mọi ô trống: ô trống là bằng chứng còn việc (§9). */
  doi(
    'kệ thật sự rỗng vẫn được phép nói "trống" (không bịt mồm ô trống)',
    ['anh-tai-san', 'mo-hinh-3d', 'mau-ho-so'].every((id) => muc.find((m) => m.id === id)?.trangThai === 'trong'),
    ['anh-tai-san', 'mo-hinh-3d', 'mau-ho-so'].map((id) => `${id}=${muc.find((m) => m.id === id)?.trangThai}`).join(' · '),
  );

  return so.slice();
}

/* ═══════════ K13 · ĐỒNG BỘ: ĐỔI VẬT LIỆU TRÊN MÀN CÓ TỚI BOQ KHÔNG ═══════════
   Đây là ĐO, không phải khẳng định "phải đỏ" hay "phải xanh": nó ghi lại một sự thật của hệ
   thống lúc 04/09 để nó không nằm im. Chốt 16/08 định nghĩa ĐỒNG BỘ là *"không tách chúng ra ngay
   từ đầu — đổi vật liệu xong BOQ đúng vì CHỈ CÓ MỘT VẬT"*. Khâu này hỏi đúng câu đó. */
function doDongBo() {
  console.log('\n═══ K13 · ĐO ĐỒNG BỘ — đổi vật liệu ở mặt tiền 2D có tới BOQ không ═══');

  const { useCadStore } = nap('lib/cad/store.ts');
  const hatch = {
    id: 'h1', type: 'hatch', layer: 'l1', specId: 'ps-van-soi',
    points: [{ x: 0, y: 0 }, { x: 1000, y: 0 }, { x: 1000, y: 1000 }, { x: 0, y: 1000 }],
    pattern: 'ANSI31', patternScale: 1, patternAngle: 0, elementType: 'slab',
  };
  useCadStore.setState({ doc: { ...useCadStore.getState().doc, entities: [hatch] }, selection: ['h1'] });
  const truoc = { ...useCadStore.getState().doc.entities[0] };

  /* ĐÚNG lời gọi mà `components/cad/MaterialPalette.tsx:84` phát ra khi người dùng bấm một vật
     liệu khác trong bảng — không mô phỏng, không đường tắt. */
  useCadStore.getState().applyMaterial('go-oc-cho', 'ANSI37', 2, 45, '#5a3a22');
  const sau = { ...useCadStore.getState().doc.entities[0] };

  const specs = [
    { id: 'ps-van-soi', name: 'Gỗ sồi tự nhiên', unit: 'm2', priceVnd: 1000000 },
    { id: 'ps-van-oc-cho', name: 'Gỗ óc chó', unit: 'm2', priceVnd: 3000000 },
  ];
  const ket = BOQ.computeBoq(useCadStore.getState().doc, specs);
  const dong = ket.rows ?? [];
  const hinhDoi = sau.pattern !== truoc.pattern;
  const danhTinhDoi = sau.specId !== truoc.specId;

  console.log(`  hình (pattern)      : ${truoc.pattern} → ${sau.pattern}   ${hinhDoi ? '(ĐỔI)' : '(giữ)'}`);
  console.log(`  danh tính (specId)  : ${truoc.specId} → ${sau.specId}   ${danhTinhDoi ? '(ĐỔI)' : '(GIỮ NGUYÊN)'}`);
  console.log(`  BOQ tính theo       : ${dong.map((r) => r.specId).join(', ') || '(không dòng nào)'}`);

  if (hinhDoi && !danhTinhDoi) {
    console.log('\n  🔴 LỖ ĐỒNG BỘ ĐO ĐƯỢC — bản vẽ NHÌN đã là vật liệu mới, BOQ vẫn tính vật liệu cũ.');
    console.log('     `applyMaterial` (lib/cad/store.ts:811) ghi pattern/scale/angle, KHÔNG ghi `specId`,');
    console.log('     mà `specId` mới là thứ `lib/boq/compute.ts` và `lib/materials/impact.ts` đọc.');
    console.log('     `replaceMaterialReferences` — hàm ĐÚNG cho việc này, đã có test chứng minh nó');
    console.log('     giữ nguyên vị trí — có 0 nơi gọi trong `app/` và `components/`: có dây, chưa có nút.');
    console.log('     KHÔNG vá ở lượt này: `lib/cad/store.ts` nằm ngoài vùng ghi của phiếu, và đổi ngữ');
    console.log('     nghĩa `applyMaterial` là quyết định chạm BOQ — phải đi bằng phiếu riêng.');
    return false;
  }
  console.log('\n  ✅ đổi vật liệu trên màn đi tới tận BOQ.');
  return true;
}

/* ═══════════════════════ K14 · TRÊN APP THẬT ═══════════════════════ */
async function chayTrenApp() {
  so.length = 0;
  const pw = require(`${GOC}/node_modules/playwright-core/index.js`);
  const EXE = process.env.PW_CHROMIUM
    || '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
  const HO_SO = path.join(GOC, '.nen-chrome-g6-dot-2');
  fs.mkdirSync(THU_MUC_ANH, { recursive: true });

  /* HỒ SƠ TRÊN ĐĨA — điều kiện để "đóng hẳn rồi vào lại" có nghĩa. `newContext()` vứt IndexedDB
     lúc đóng nên nó không bao giờ chứng minh được gì về kho `.idfc`. */
  const mo = () => pw.chromium.launchPersistentContext(HO_SO, {
    executablePath: EXE, args: ['--no-sandbox'], viewport: { width: 1440, height: 900 },
  });

  const dangNhap = (p) => p.evaluate(async ({ u, tk, mk }) => {
    const r = await fetch(`${u}/api/auth/login`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifier: tk, password: mk }),
    });
    return r.status;
  }, { u: GOC_URL, tk: TK, mk: MK });

  const doNganHai = async (p) => {
    await p.goto(`${GOC_URL}/files`, { waitUntil: 'networkidle' });
    await p.waitForTimeout(1600);
    await p.evaluate(() => {
      [...document.querySelectorAll('button')].find((x) => /Phần thô dùng chung/.test(x.innerText || ''))?.click();
    });
    await p.waitForTimeout(1300);
    return p.evaluate(() => {
      const s = document.querySelector('section[aria-label="Phần thô dùng chung"], section[aria-label="Shared raw stock"]');
      return s ? s.innerText : '(KHÔNG THẤY NGĂN)';
    });
  };

  let ctx = await mo();
  let p = ctx.pages()[0] ?? await ctx.newPage();
  const loiJs = [];
  p.on('pageerror', (e) => loiJs.push(String(e).slice(0, 180)));

  /* ── K14a · máy sạch, CHƯA đăng nhập ────────────────────────────────────── */
  khau('K14a · MÁY SẠCH, CHƯA ĐĂNG NHẬP — máy chủ 401 không được làm kho rỗng');

  await p.goto(`${GOC_URL}/files`, { waitUntil: 'domcontentloaded' });
  await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  const chu401 = await doNganHai(p);
  doi(
    'ngăn Phần thô KHÔNG nói "chưa có món nào" khi máy chủ từ chối',
    !/chưa có món nào/i.test(chu401),
    chu401.split('\n').filter(Boolean).slice(0, 2).join(' ⏐ '),
  );
  doi(
    'vẫn NÓI RA là không đọc được kho chung (không im lặng giả vờ đủ)',
    /không đọc được kho chung|could not read/i.test(chu401),
    /401/.test(chu401) ? 'có dải báo lỗi kèm mã 401' : 'KHÔNG thấy dải báo lỗi',
  );
  await p.screenshot({ path: path.join(THU_MUC_ANH, '01-ngan-pho-tho-chua-dang-nhap.png') });

  /* ── K14b · đã đăng nhập ────────────────────────────────────────────────── */
  khau('K14b · ĐÃ ĐĂNG NHẬP — nhánh chưa ai đo, và là nơi SEED gặp DB');

  const maDn = await dangNhap(p);
  doi('đăng nhập được bằng tài khoản kiểm', maDn === 200, `POST /api/auth/login → ${maDn}`);

  const chuDn = await doNganHai(p);
  doi(
    'đã đăng nhập: ngăn Phần thô nói đúng hiện trạng, hết dải báo lỗi',
    !/không đọc được kho chung/i.test(chuDn),
    chuDn.split('\n').filter(Boolean)[0] ?? '',
  );
  await p.screenshot({ path: path.join(THU_MUC_ANH, '02-ngan-pho-tho-da-dang-nhap.png') });

  await p.goto(`${GOC_URL}/materials`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(2000);
  const docBang = `(() => [...document.querySelectorAll('table tbody tr')].map((r) => {
    const td = [...r.querySelectorAll('td')];
    return { ma: (td[1]?.innerText||'').trim(), ten: (td[2]?.innerText||'').trim(), gia: (td[6]?.innerText||'').trim(), nguon: (td[9]?.innerText||'').trim() };
  }))()`;
  const bang = await p.evaluate(docBang);
  doi(
    'ĐÃ ĐĂNG NHẬP mà kho vẫn có đủ vật liệu theo bản cài',
    HG.VAT_LIEU_HAT_GIONG.every((v) => bang.some((b) => b.ma === v.code)),
    `${bang.length} dòng: ${bang.map((b) => b.ma).join(', ')}`,
  );
  doi(
    'cột Nguồn nói ĐÚNG gia phả cho dòng theo bản cài (không gắn nhầm "Studio tự nhập")',
    bang.filter((b) => HG.VAT_LIEU_HAT_GIONG.some((v) => v.code === b.ma)).every((b) => /theo bản cài|built-?in/i.test(b.nguon)),
    bang.map((b) => `${b.ma}→"${b.nguon}"`).join(' · '),
  );
  doi(
    'KHÔNG đếm trùng — mỗi mã hạt giống đúng MỘT dòng',
    HG.VAT_LIEU_HAT_GIONG.every((v) => bang.filter((b) => b.ma === v.code).length === 1),
    HG.VAT_LIEU_HAT_GIONG.map((v) => `${v.code}×${bang.filter((b) => b.ma === v.code).length}`).join(' · '),
  );
  await p.screenshot({ path: path.join(THU_MUC_ANH, '03-kho-vat-lieu-da-dang-nhap.png') });

  /* ── K14c · KỆ THƯ VIỆN QUA MẮT ─────────────────────────────────────────── */
  khau('K14c · KỆ THƯ VIỆN trên app thật — lỗ đợt 1 tự khai, nay mở bằng mắt');

  await p.goto(`${GOC_URL}/library`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1800);

  /* Đọc THEO THẺ, không theo khoảng ký tự quanh một từ khoá: bản đầu của khâu này dùng
     `/CẤU KIỆN[\s\S]{0,80}Kho trống/` và báo đỏ oan — "80 ký tự sau" trườn sang thẻ kế bên, mà
     ba kệ kế bên thì RỖNG THẬT. Bộ đo bắt nhầm vùng còn nguy hơn bộ đo bỏ sót: nó vu cho mã một
     lỗi không có. Nay khoanh đúng thẻ rồi mới đọc chữ trong đó. */
  const the = await p.evaluate(() => {
    const ra = {};
    for (const el of document.querySelectorAll('article, section, div')) {
      const t = (el.innerText || '').trim();
      if (!/^0\d\s*\n?\s*(CẤU KIỆN|VẬT LIỆU)/i.test(t)) continue;
      /* phải bọc CẢ phần thân (số món / câu "Kho trống") — thẻ nhỏ nhất bọc mỗi tiêu đề là cái
         ĐẦU ĐỀ, đọc nó thì khẳng định nào cũng đỏ oan. */
      if (!/món|Kho trống/i.test(t)) continue;
      const ten = /CẤU KIỆN/i.test(t.slice(0, 30)) ? 'cauKien' : 'vatLieu';
      if (!ra[ten] || t.length < ra[ten].length) ra[ten] = t;
    }
    return ra;
  });
  for (const [khoa, nhan] of [['cauKien', 'CẤU KIỆN (.idfc)'], ['vatLieu', 'VẬT LIỆU']]) {
    const t = the[khoa];
    doi(
      `thẻ "${nhan}" trên TRANG TỔNG nói số món, KHÔNG nói "Kho trống"`,
      !!t && !/Kho trống/i.test(t) && /\d+\s*\n?\s*món/i.test(t),
      t ? t.split('\n').filter(Boolean).slice(0, 3).join(' ⏐ ') : '(KHÔNG tìm thấy thẻ)',
    );
  }
  await p.screenshot({ path: path.join(THU_MUC_ANH, '04-trang-tong-thu-vien.png') });

  for (const [keId, nhan, soMon] of [
    ['common-atlas', 'Vật liệu ATLAS', SHELVES.builtinCount('common-atlas')],
    ['common-idfc', 'Cấu kiện (.idfc)', HG3D.cauKienHatGiongTrenKe().length],
  ]) {
    await p.evaluate((s) => window.dispatchEvent(new CustomEvent('if:library-open', { detail: { shelfId: s } })), keId);
    await p.waitForTimeout(2000);
    const chuKe = await p.evaluate(() => document.body.innerText);
    doi(
      `kệ "${nhan}" MỞ ĐƯỢC và bày đúng ${soMon} món (không phải màn kệ trống)`,
      new RegExp(`${soMon} mục trong kệ`).test(chuKe) && !/Kệ này chưa có món nào/.test(chuKe.split('mục trong kệ')[0].slice(-400)),
      (chuKe.match(/\d+ mục trong kệ [^\n]*/) || ['(không thấy dòng đếm)'])[0],
    );
    await p.screenshot({ path: path.join(THU_MUC_ANH, `05-ke-${keId}.png`) });
  }

  const tenTrenKe = await p.evaluate(() => document.body.innerText);
  doi(
    'kệ Cấu kiện bày ĐÚNG cấu kiện ship kèm, có mã đọc được',
    tenTrenKe.includes(HG3D.cauKienHatGiongTrenKe()[0].meta.code),
    `tìm mã ${HG3D.cauKienHatGiongTrenKe()[0].meta.code} trên màn: ${tenTrenKe.includes(HG3D.cauKienHatGiongTrenKe()[0].meta.code) ? 'thấy' : 'KHÔNG thấy'}`,
  );

  /* ── K14d · THAO TÁC THẬT → GHI XUỐNG ───────────────────────────────────── */
  khau('K14d · THAO TÁC THẬT — kéo thanh trượt trong cửa chất liệu, không chọc thẳng vào kho');

  await p.goto(`${GOC_URL}/materials`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1800);
  const moCua = await p.evaluate((ma) => {
    const r = [...document.querySelectorAll('table tbody tr')]
      .find((x) => (x.querySelectorAll('td')[1]?.innerText || '').trim() === ma);
    const n = r?.querySelector('td:last-child button');
    if (!n) return false;
    n.click();
    return true;
  }, SOI.code);
  doi('mở được cửa chất liệu render từ dòng theo bản cài', moCua, moCua ? `bấm nút trên dòng ${SOI.code}` : 'không thấy nút');
  await p.waitForTimeout(1200);

  const NHAM_MOI = '0.17';
  const daKeo = await p.evaluate((v) => {
    const o = [...document.querySelectorAll('input[type="range"]')].find((x) => x.min === '0' && x.max === '1');
    if (!o) return null;
    const truoc = o.value;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(o, v);
    o.dispatchEvent(new Event('input', { bubbles: true }));
    o.dispatchEvent(new Event('change', { bubbles: true }));
    return { truoc, sau: o.value };
  }, NHAM_MOI);
  doi(
    'thanh trượt độ nhám nhận thao tác thật',
    !!daKeo && daKeo.sau === NHAM_MOI,
    daKeo ? `${daKeo.truoc} → ${daKeo.sau}` : 'KHÔNG thấy thanh trượt 0..1 nào',
  );
  await p.waitForTimeout(900);
  await p.screenshot({ path: path.join(THU_MUC_ANH, '06-thao-tac-that-do-nham.png') });

  /* KÉO KHÔNG PHẢI LÀ LƯU — và đó là hành vi ĐÚNG. Bản đầu của khâu này khẳng định "kéo xong là
     ghi xuống" rồi báo đỏ; đo lại thì cửa có nút *Lưu chất liệu* riêng, tức app bắt người dùng
     xác nhận trước khi ghi. Khẳng định sai của bộ đo, không phải lỗi của app — ghi lại để lần sau
     không ai đi "vá" một hành vi vốn đúng. */
  const khoTruocLuu = await p.evaluate((k) => localStorage.getItem(k), 'if.materials.pbr.v1');
  doi(
    'kéo thanh trượt CHƯA ghi xuống — app đợi người dùng bấm Lưu (đúng, không tự ý ghi)',
    khoTruocLuu === null || !khoTruocLuu.includes(NHAM_MOI),
    khoTruocLuu === null ? 'kho vẫn trống trước khi bấm Lưu' : `kho = ${khoTruocLuu.slice(0, 60)}`,
  );

  const daLuu = await p.evaluate(() => {
    const n = [...document.querySelectorAll('button')].find((x) => /^Lưu chất liệu|^Save material/i.test((x.innerText || '').trim()));
    if (!n) return false;
    n.click();
    return true;
  });
  doi('cửa chất liệu CÓ nút Lưu và bấm được', daLuu, daLuu ? 'đã bấm "Lưu chất liệu"' : 'KHÔNG thấy nút Lưu');
  await p.waitForTimeout(1200);

  const daGhi = await p.evaluate((k) => localStorage.getItem(k), 'if.materials.pbr.v1');
  doi(
    'bấm Lưu ⇒ GHI XUỐNG nơi lưu thật (không chỉ nằm trong bộ nhớ màn hình)',
    !!daGhi && daGhi.includes(NHAM_MOI),
    daGhi ? `if.materials.pbr.v1 = ${daGhi.slice(0, 90)}` : '(không ghi gì)',
  );
  /* ĐO, không phán: bản ghi đè lưu ra chỉ có `roughness`/`metallic`. Nếu nó là ghi-đè-theo-VẬT
     (chốt: "ghi đè theo VẬT, không theo trường") thì màu gốc của vật liệu sẽ biến mất sau khi lưu
     — mở lại phải kiểm bằng mắt ở khâu sau. */
  const truongDaLuu = daGhi ? Object.keys(JSON.parse(daGhi)[Object.keys(JSON.parse(daGhi))[0]] ?? {}) : [];
  console.log(`   ℹ️  bản ghi đè lưu ra mang các trường: ${truongDaLuu.join(', ') || '(rỗng)'}`);

  /* ── K14e · ĐÓNG HẲN → VÀO LẠI ──────────────────────────────────────────── */
  khau('K14e · ĐÓNG HẲN trình duyệt → VÀO LẠI — luật PASS đúng nghĩa, không phải tải lại trang');

  await ctx.close();
  ctx = await mo();
  p = ctx.pages()[0] ?? await ctx.newPage();

  await p.goto(`${GOC_URL}/materials`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(2000);
  const conSau = await p.evaluate((k) => localStorage.getItem(k), 'if.materials.pbr.v1');
  doi(
    'sau khi TẮT HẲN trình duyệt, bản chỉnh VẪN CÒN',
    !!conSau && conSau.includes(NHAM_MOI),
    conSau ? `if.materials.pbr.v1 = ${conSau.slice(0, 90)}` : '(mất sạch)',
  );
  doi(
    'phiên đăng nhập cũng sống qua lần đóng hẳn (cookie trên đĩa)',
    (await p.evaluate(async (u) => (await fetch(`${u}/api/auth/me`)).status, GOC_URL)) === 200,
    'GET /api/auth/me sau khi mở lại',
  );
  const bangSau = await p.evaluate(docBang);
  doi(
    'mở lại vẫn thấy đủ vật liệu theo bản cài (bản chỉnh không nuốt mẫu)',
    HG.VAT_LIEU_HAT_GIONG.every((v) => bangSau.some((b) => b.ma === v.code)),
    `${bangSau.length} dòng: ${bangSau.map((b) => b.ma).join(', ')}`,
  );
  const moLai = await p.evaluate((ma) => {
    const r = [...document.querySelectorAll('table tbody tr')]
      .find((x) => (x.querySelectorAll('td')[1]?.innerText || '').trim() === ma);
    r?.querySelector('td:last-child button')?.click();
    return !!r;
  }, SOI.code);
  await p.waitForTimeout(1200);
  const soTrenPanel = await p.evaluate(() => {
    const o = [...document.querySelectorAll('input[type="range"]')].find((x) => x.min === '0' && x.max === '1');
    return o ? o.value : null;
  });
  doi(
    'mở lại cửa chất liệu đọc ra ĐÚNG số người dùng đặt, không rơi về mẫu gốc',
    moLai && soTrenPanel === NHAM_MOI,
    `thanh trượt đọc ra ${soTrenPanel} (đặt ${NHAM_MOI}, mẫu gốc ${SOI.pbr.roughness})`,
  );
  /* Chụp NGAY ở đây — bản đầu để dòng này xuống cuối khâu, sau khi đã mở sang vật liệu khác, nên
     ảnh tên "vào lại bản chỉnh còn đó" lại chụp đúng màn của món kia (hai tệp trùng từng byte).
     Ảnh không đúng tên nó thì tệ hơn không có ảnh: nó là bằng chứng SAI mà vẫn được đem đi duyệt. */
  await p.screenshot({ path: path.join(THU_MUC_ANH, '07-vao-lai-ban-chinh-con-do.png') });

  /* ── VẬT LIỆU CHƯA AI TỪNG SỬA — nơi lộ ra cửa này đọc tầng nào ─────────────
     Phải đo trên món KHÁC (gỗ óc chó), vì món vừa lưu thì tầng studio đã có bản ghi, che mất câu
     hỏi thật: *cửa có đọc được tham số SHIP KÈM BẢN CÀI không, hay đi ĐOÁN TỪ TÊN?* */
  const OC_CHO = HG.VAT_LIEU_HAT_GIONG[1];
  await p.evaluate(() => [...document.querySelectorAll('button')].find((x) => /^Đóng|^Close/i.test((x.innerText || '').trim()))?.click());
  await p.waitForTimeout(700);
  const moOcCho = await p.evaluate((ma) => {
    const r = [...document.querySelectorAll('table tbody tr')]
      .find((x) => (x.querySelectorAll('td')[1]?.innerText || '').trim() === ma);
    r?.querySelector('td:last-child button')?.click();
    return !!r;
  }, OC_CHO.code);
  await p.waitForTimeout(1300);
  const mauOcCho = await p.evaluate(() => document.querySelector('input[type="color"]')?.value ?? null);
  doi(
    'cửa chất liệu đọc ra ĐÚNG MÀU của vật liệu ship kèm (không phải màu đoán từ tên)',
    moOcCho && mauOcCho?.toLowerCase() === String(OC_CHO.pbr.baseColor).toLowerCase(),
    `${OC_CHO.code}: ô màu đọc ra ${mauOcCho} · mẫu gốc khai ${OC_CHO.pbr.baseColor}`,
  );
  const nutXuat = await p.evaluate(() => [...document.querySelectorAll('button')]
    .filter((x) => /Xuất V-Ray|Xuất D5|Export V-Ray|Export D5/i.test(x.innerText || ''))
    .map((x) => ({ ten: x.innerText.trim(), khoa: x.disabled })));
  doi(
    'xuất được vật liệu ship kèm sang V-Ray/D5 mà KHÔNG bắt lưu lại một lần vô nghĩa',
    nutXuat.length === 2 && nutXuat.every((n) => !n.khoa),
    nutXuat.map((n) => `${n.ten}=${n.khoa ? 'KHOÁ' : 'mở'}`).join(' · ') || '(không thấy nút xuất)',
  );
  await p.screenshot({ path: path.join(THU_MUC_ANH, '08-vat-lieu-chua-ai-sua.png') });

  const nguonHatGiong = fs.readFileSync(path.join(GOC, 'lib/materials/hat-giong.ts'), 'utf8');
  doi(
    'MẪU GỐC trong repo KHÔNG đổi một byte (một chiều)',
    nguonHatGiong.includes(`roughness: ${SOI.pbr.roughness}`),
    `hat-giong.ts vẫn khai roughness ${SOI.pbr.roughness} cho ${SOI.code}`,
  );

  doi('không trang nào ném lỗi JS', loiJs.length === 0, loiJs.length ? loiJs.slice(0, 2).join(' | ') : '0 lỗi');

  await ctx.close();
  fs.rmSync(HO_SO, { recursive: true, force: true });
  return so.slice();
}

/* ─────────────────────── chạy ─────────────────────── */
let maThoat = 0;

if (TREN_APP) {
  if (!MK) {
    console.error('⛔ Thiếu --mk=<mật khẩu tài khoản kiểm>. Bộ này CỐ Ý không có mật khẩu mặc định.');
    process.exit(2);
  }
  console.log(`═══ G6 ĐỢT 2 · K14 — TRÊN APP THẬT (cổng ${CONG}, hồ sơ trên đĩa) ═══`);
  const kq = await chayTrenApp();
  inSo(kq);
  const dat = kq.filter((d) => d.dat).length;
  console.log(`\n── KẾT: ${dat}/${kq.length} khẳng định ĐẠT ──`);
  console.log(`   ảnh bằng chứng: ${path.relative(GOC, THU_MUC_ANH)}/`);
  if (dat !== kq.length) {
    console.log('ĐỨT Ở:');
    for (const d of kq.filter((x) => !x.dat)) console.log(`  · [${d.khau}] ${d.nhan} — ${d.chiTiet}`);
    maThoat = 1;
  }
  process.exit(maThoat);
}

console.log('═══ G6 ĐỢT 2 · PHẦN THUẦN ═══');
const ketQua = chayThuan(THAT);
inSo(ketQua);
const dat = ketQua.filter((d) => d.dat).length;
console.log(`\n── KẾT: ${dat}/${ketQua.length} khẳng định ĐẠT ──`);
if (dat !== ketQua.length) {
  console.log('ĐỨT Ở:');
  for (const d of ketQua.filter((x) => !x.dat)) console.log(`  · [${d.khau}] ${d.nhan} — ${d.chiTiet}`);
  maThoat = 1;
}

/* HIỆU CHUẨN — mỗi thế giới hỏng phải làm ĐỎ đúng khâu của nó. Không đỏ = bộ này chỉ in chữ PASS. */
function hieuChuan(the, khauPhaiDo) {
  console.log(`\n═══ HIỆU CHUẨN · ${the.ten} — PHẢI báo đỏ ở ${khauPhaiDo} ═══`);
  const kq = chayThuan(the);
  const do_ = kq.filter((d) => !d.dat && d.khau.startsWith(khauPhaiDo));
  inSo(kq.filter((d) => d.khau.startsWith(khauPhaiDo)));
  if (do_.length > 0) { console.log(`\n✅ HIỆU CHUẨN ĐẠT — ca biết-hỏng làm ĐỎ ${do_.length} khẳng định.`); return true; }
  console.log('\n🔴 HIỆU CHUẨN TRƯỢT — ca biết-hỏng KHÔNG làm đỏ khẳng định nào.');
  return false;
}
const h1 = hieuChuan(HONG_NGAN_KHONG_TRON, 'K10');
const h2 = hieuChuan(HONG_KHOA_SKU, 'K11');
const h3 = hieuChuan(HONG_TRANG_TONG, 'K12');
if (!h1 || !h2 || !h3) maThoat = 1;

/* K13 là ĐO, không tính vào mã thoát: nó ghi một sự thật để nó không nằm im, và lỗ nó chỉ ra nằm
   ngoài vùng ghi của phiếu này. Đưa nó vào mã thoát là biến một báo cáo trung thực thành cổng chặn
   cho lane khác. */
doDongBo();

process.exit(maThoat);
