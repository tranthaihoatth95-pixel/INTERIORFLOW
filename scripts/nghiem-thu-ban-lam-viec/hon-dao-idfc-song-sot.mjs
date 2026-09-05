/**
 * scripts/nghiem-thu-ban-lam-viec/hon-dao-idfc-song-sot.mjs
 *
 * LUẬT PASS cho lượt "nối lại hòn đảo `lib/idfc-import/`":
 *   máy sạch → nhập MỘT ảnh cấu kiện + tệp khối → ra `.idfc` có hình học + cờ tin cậy
 *   → vào Thư viện thấy nó → ĐÓNG HẲN trình duyệt → vào lại → CÒN NGUYÊN.
 *
 * ⛔ BA KỶ LUẬT (mượn nguyên `noi-kho-idfc-song-sot.mjs` — cùng họ câu hỏi "sống sót"):
 *  1. `launchPersistentContext` trên hồ sơ ĐĨA. `newContext()` vứt cookie/IndexedDB lúc đóng ⇒
 *     hỏi "đóng hẳn rồi mở lại" bằng nó là câu hỏi VÔ NGHĨA TỪ ĐỊNH NGHĨA.
 *  2. Đọc từ NƠI LƯU THẬT — lượt 2 gọi thẳng API kho (`/api/library`, `/api/asset-representation`)
 *     và TẢI VỀ tệp hình học, rồi mới đọc chữ trên màn. Chữ trên màn chỉ chứng minh React vừa render.
 *  3. KHÔNG `reload()` để đi vòng qua lỗi. Phải tải lại mới thấy thì chính đó là phát hiện.
 *
 * ⭐ HIỆU CHUẨN, chạy TRƯỚC mọi khẳng định (ca ⓪): gửi một hồ sơ THIẾU NGUỒN SỐ ĐO và đòi máy chủ
 * TỪ CHỐI. Nếu ca đó cũng qua thì cửa nhận mọi thứ ⇒ số "đã nhập thành công" ở dưới vô nghĩa.
 *
 * Phân biệt FAIL với LỖI: khẳng định sai ⇒ FAIL (kết luận được). Hạ tầng ngã (login hỏng · server
 * chưa lên · thiếu tệp mẫu) ⇒ LỖI, KHÔNG kết luận.
 *
 * Chạy:
 *   node scripts/nghiem-thu-ban-lam-viec/hon-dao-idfc-song-sot.mjs \
 *     --url=http://localhost:3110 --glb=/tmp/nd05/lincoln.glb [--anh=<thư mục ảnh chụp>]
 */
import { chromium } from '/home/user/INTERIORFLOW/node_modules/playwright/index.mjs';
import { mkdtempSync, rmSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';

const co = (t, m) => {
  const a = process.argv.find((x) => x.startsWith(`--${t}=`));
  return a ? a.slice(t.length + 3) : m;
};
const GOC = co('url', 'http://localhost:3110');
const GLB = co('glb', '/tmp/nd05/lincoln.glb');
const ANH_RA = co('anh', '');
const CHROME = process.env.IF_CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
if (ANH_RA) mkdirSync(ANH_RA, { recursive: true });

const ket = { pass: 0, fail: [], loi: [] };
const ok = (ten, dieu, chiTiet = '') => {
  if (dieu) { ket.pass++; console.log('  ok  -', ten, chiTiet && `· ${chiTiet}`); }
  else { ket.fail.push(ten); console.log('  FAIL-', ten, chiTiet && `· ${chiTiet}`); }
};

if (!existsSync(GLB)) { console.error('LỖI hạ tầng: không có tệp khối mẫu', GLB); process.exit(2); }
const glbB64 = readFileSync(GLB).toString('base64');
// Ảnh PNG 2×2 hợp lệ — cửa ghi Thư viện SNIFF magic byte thật, không tin nhãn client khai.
const ANH_DATA =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFklEQVR42mP8z8BQz0AEYBxVSF+FAAhKDveKMLuVAAAAAElFTkSuQmCC';

const HO_SO = mkdtempSync(join(tmpdir(), 'hon-dao-'));

async function moPhien() {
  const ctx = await chromium.launchPersistentContext(HO_SO, {
    executablePath: CHROME,
    headless: true,
    viewport: { width: 1440, height: 900 },
    args: ['--no-sandbox'],
  });
  const page = ctx.pages()[0] ?? (await ctx.newPage());
  return { ctx, page };
}

async function dangNhap(page) {
  const r = await page.request.post(`${GOC}/api/auth/login`, {
    data: { identifier: 'kiem@localhost.test', password: 'matkhau123' },
  });
  return r.ok() ? null : `login ${r.status()}`;
}

const TEN_MON = `Ghế kiểm hòn đảo ${Date.now().toString(36)}`;

/* ══════════════ LƯỢT 1 — nhập, rồi ĐÓNG HẲN ══════════════ */
let assetId = null;
let repObj = null;
{
  console.log('\nLƯỢT 1 — máy sạch, nhập một cấu kiện');
  const { ctx, page } = await moPhien();
  const loi = await dangNhap(page);
  if (loi) { await ctx.close(); console.error('LỖI hạ tầng:', loi); process.exit(2); }

  // ⓪ HIỆU CHUẨN — hồ sơ thiếu nguồn số đo PHẢI bị từ chối
  const xau = await page.request.post(`${GOC}/api/idfc-import`, {
    data: {
      nhanh: 'khoi', anhDataUri: ANH_DATA, glbBase64: glbB64, tenTepKhoi: 'x.glb',
      spec: { name: 'Không nguồn', code: 'X', wMm: 1, dMm: 1, hMm: 1, sourceUrl: '' },
    },
  });
  ok('⓪ hiệu chuẩn: số "đã xác minh" không nguồn ⇒ TỪ CHỐI', xau.status() === 400, `http ${xau.status()}`);

  // trạng thái hai nhánh — nhánh mạng phải khai thẳng thiếu gì, không im lặng
  const tt = await (await page.request.get(`${GOC}/api/idfc-import`)).json();
  ok('nhánh đọc tệp khối khai chạy được, 0 lượt', tt.nhanh?.khoi?.chay === true && tt.nhanh.khoi.credit === 0);
  console.log('     nhánh ảnh:', tt.nhanh?.anh?.chay ? 'chạy được' : `KHÔNG — ${tt.nhanh?.anh?.lyDo}`);

  // ① nhập thật qua nhánh 0-credit
  const r = await page.request.post(`${GOC}/api/idfc-import`, {
    data: {
      nhanh: 'khoi', anhDataUri: ANH_DATA, glbBase64: glbB64, tenTepKhoi: 'lincoln.glb',
      spec: {
        name: TEN_MON, code: 'HD-01', brand: 'Hãng kiểm',
        wMm: 580, dMm: 600, hMm: 1110, sourceUrl: 'https://vi.du/hang/hd-01',
      },
      phanLoai: { caption: 'Ghế bar khung gỗ', style: 'Mid-century', materials: ['Gỗ'], room: 'Phòng khách' },
    },
  });
  const j = await r.json();
  if (!r.ok()) { await ctx.close(); console.error('LỖI/FAIL nhập:', r.status(), j); process.exit(1); }
  assetId = j.assetId;
  repObj = j.bieuDien?.[0]?.id ?? null;

  ok('ra .idfc + hình học', j.soLieu?.triSau > 0 && Array.isArray(j.bieuDien) && j.bieuDien.length === 3,
     `${j.soLieu.triTruoc}→${j.soLieu.triSau} tam giác · ${j.bieuDien.length} biểu diễn`);
  ok('ra cấu kiện có tên nghề', j.soLieu?.soCauKien > 0, `${j.soLieu.soCauKienDatTen}/${j.soLieu.soCauKien} đặt tên`);
  ok('KHÔNG tiêu lượt nào ở nhánh khối', j.creditDaTieu === 0);

  // ② cờ ba nấc phải KHÁC NHAU theo trường — không hiện đồng loạt như nhau
  const nac = new Set();
  for (const v of Object.values(j.coCua?.params ?? {})) nac.add(v.flag);
  const nacMesh = j.coCua?.mesh?.flag;
  ok('số hãng = đã xác minh', nac.size === 1 && nac.has('verified'), [...nac].join(','));
  ok('hình khối = máy suy', nacMesh === 'inferred');
  ok('mesh không bị dán nhãn dịch vụ ngoài', !String(j.coCua?.mesh?.source ?? '').startsWith('fal:'),
     String(j.coCua?.mesh?.source ?? ''));
  ok('máy KHAI THẬT chỗ chưa chắc', Array.isArray(j.ghiChu) && j.ghiChu.length > 0, `${j.ghiChu.length} ghi chú`);

  if (ANH_RA) {
    await page.goto(`${GOC}/library/ingest`, { waitUntil: 'networkidle', timeout: 90000 }).catch(() => {});
    await page.screenshot({ path: join(ANH_RA, 'lo1-cua-nhan-dien.png'), fullPage: false }).catch(() => {});
  }
  await ctx.close(); // ⬅ ĐÓNG HẲN, không phải newContext
  console.log('  … trình duyệt ĐÓNG HẲN');
}

/* ══════════════ LƯỢT 2 — mở lại, đọc từ NƠI LƯU THẬT ══════════════ */
{
  console.log('\nLƯỢT 2 — mở lại trình duyệt, món còn không');
  const { ctx, page } = await moPhien();
  const loi = await dangNhap(page);
  if (loi) { await ctx.close(); console.error('LỖI hạ tầng:', loi); process.exit(2); }

  const kho = await (await page.request.get(`${GOC}/api/library`)).json();
  const mon = (kho.assets ?? []).find((a) => a.id === assetId);
  ok('món CÒN trong kho Thư viện', Boolean(mon), mon ? mon.name : 'mất');
  ok('món mang con trỏ khối 3D', Boolean(mon && /(^|,)\s*mo3d:/.test(mon.tags)), mon?.tags ?? '');

  const rep = await (await page.request.get(`${GOC}/api/asset-representation?assetId=${assetId}`)).json();
  const rows = rep.rows ?? rep.representations ?? rep.items ?? (Array.isArray(rep) ? rep : []);
  const kinds = rows.map((r) => r.kind);
  ok('đủ 3 cách thể hiện còn sống', rows.length === 3, kinds.join(' · '));
  ok('mọi hàng máy sinh vẫn ở nấc máy-suy', rows.every((r) => r.truthLevel === 'inferred'));

  // tệp hình học THẬT tải về được (không chỉ có hàng DB trỏ vào chỗ trống)
  const obj = await page.request.get(`${GOC}/api/idfc-import/tep/${repObj}/mon.obj`);
  const objTxt = obj.ok() ? await obj.text() : '';
  ok('tải được hình học .obj', obj.ok() && /^v\s/m.test(objTxt), `${objTxt.length} byte`);

  // bản ghi .idfc còn nguyên cờ
  const repIdfc = rows.find((r) => String(r.payloadRef).endsWith('mon.idfc'));
  const idfc = repIdfc ? await page.request.get(`${GOC}/api/idfc-import/tep/${repIdfc.id}/mon.idfc`) : null;
  const idfcJson = idfc && idfc.ok() ? await idfc.json() : null;
  ok('bản ghi .idfc còn nguyên cờ ba nấc',
     idfcJson?.xFromPhoto?.params?.wMm?.flag === 'verified' && idfcJson?.xFromPhoto?.mesh?.flag === 'inferred',
     idfcJson ? `w=${idfcJson.xFromPhoto.params.wMm.value}mm` : 'không đọc được');

  // và MẮT thấy được: trang tổng Thư viện.
  // ⚠️ ĐO ĐÚNG BỀ MẶT: trang tổng bày món bằng Ô XEM TRƯỚC (`<img alt="tên món">`), KHÔNG in tên
  // thành chữ. Lượt đầu tôi khẳng định bằng `getByText` và nó FAIL — khẳng định sai chỗ, không
  // phải tính năng hỏng. Ghi lại vì đây đúng bẫy "chữ trên màn chỉ chứng minh React vừa render".
  const demAlt = async () => {
    await page.goto(`${GOC}/library`, { waitUntil: 'networkidle', timeout: 90000 }).catch(() => {});
    await page.waitForTimeout(2500);
    return page.$$eval('img[alt]', (n, t) => n.filter((x) => x.getAttribute('alt') === t).length, TEN_MON);
  };
  const coTro = await demAlt();
  // Món hiện ở HAI ô: "Ảnh & tài sản" (mọi asset) và "Mô hình 3D" (chỉ món có khối xem được).
  ok('trang tổng bày món, và ĐẾM NÓ LÀ MÔ HÌNH 3D', coTro >= 2, `${coTro} ô xem trước`);
  if (ANH_RA) await page.screenshot({ path: join(ANH_RA, 'lo2-thu-vien-sau-khi-mo-lai.png') }).catch(() => {});

  /* ⭐ PHÉP ĐO HAI THẾ GIỚI — GỠ DÂY PHẢI ĐỔI KẾT QUẢ.
     Con trỏ 3D nằm ở tag `mo3d:`. Gỡ tag ⇒ món phải TỤT khỏi ô "Mô hình 3D" (còn 1 ô). Cắm lại
     ⇒ về 2. Nếu cả hai thế giới cho cùng một số thì phép đo trên KHÔNG chứng minh được gì — con
     số 2 có thể đến từ bất cứ đâu (vd bảng tên gõ cứng cũ). */
  const lat = (viec) => {
    try {
      execSync(`DATABASE_URL="file:${process.cwd()}/prisma/dev.db" node scripts/nghiem-thu-ban-lam-viec/lat-co-mo3d.mjs ${assetId} ${viec}`,
        { stdio: 'pipe' });
      return true;
    } catch { return false; }
  };
  if (lat('go')) {
    const sauGo = await demAlt();
    ok('gỡ con trỏ 3D ⇒ món TỤT khỏi ô Mô hình 3D', sauGo < coTro, `${coTro} → ${sauGo} ô`);
    lat('cam');
    const camLai = await demAlt();
    ok('cắm lại ⇒ về đúng số cũ', camLai === coTro, `${sauGo} → ${camLai} ô`);
  } else {
    ket.loi.push('không lật được cờ mo3d ⇒ phép đo hai thế giới BỎ QUA');
    console.log('  LỖI - không lật được cờ ⇒ KHÔNG kết luận về phần con trỏ 3D');
  }

  await ctx.close();
}

rmSync(HO_SO, { recursive: true, force: true });
console.log(`\n${ket.pass} pass · ${ket.fail.length} fail · ${ket.loi.length} lỗi hạ tầng`);
if (ket.fail.length) { console.error('FAIL:', ket.fail.join(' | ')); process.exit(1); }
