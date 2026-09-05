/**
 * scripts/nghiem-thu-ban-lam-viec/noi-kho-idfc-song-sot.mjs
 *
 * LUẬT PASS cho lượt "cắm điện `resolveIdfcCommerceToSpec`":
 *   nhập hai cấu kiện `.idfc` qua ĐÚNG cửa nhập của app → mở cột thông số → thấy nó nối về hàng
 *   nào và nối CHẮC hay MỎNG → **đổi mã hàng trong kho** → ĐÓNG HẲN trình duyệt → vào lại
 *   → tệp nối bằng khoá bất biến VẪN ĐÚNG · tệp nối bằng mã hàng thì ĐỨT.
 *
 * ⭐ PHÉP ĐO TỰ MANG ĐỐI CHỨNG: hai tệp khác nhau ĐÚNG MỘT ĐIỂM (có/không `commerce.specId`) và
 * đi qua CÙNG một lần đổi mã. Chúng phải rẽ HAI HƯỚNG. Nếu cả hai cùng sống hoặc cùng chết thì
 * phép đo không phân biệt được hai thế giới ⇒ HIỆU CHUẨN THOÁI HOÁ, số chính không đáng tin.
 *
 * ⛔ BA KỶ LUẬT mượn nguyên `vat-lieu-hat-giong-song-sot.mjs` (cùng họ):
 *  1. `launchPersistentContext` trên hồ sơ ĐĨA — `newContext()` vứt IndexedDB lúc đóng, mà kho
 *     `.idfc` sống ở IndexedDB (`interiorflow-studio` route `/studio-idfc`). Hỏi "đóng hẳn rồi mở
 *     lại" bằng `newContext` là câu hỏi VÔ NGHĨA TỪ ĐỊNH NGHĨA.
 *  2. Đọc từ NƠI LƯU THẬT — lượt 2 đọc thẳng IndexedDB xác nhận hai bản ghi `.idfc` còn đó, rồi
 *     mới đọc chữ trên màn. Chữ trên màn chỉ chứng minh React vừa render.
 *  3. KHÔNG `reload()` để đi vòng qua lỗi. Phải tải lại mới thấy thì chính đó là phát hiện.
 *
 * Phân biệt FAIL với LỖI: khẳng định sai ⇒ FAIL (kết luận được). Hạ tầng ngã (login hỏng · không
 * mở được tấm Thư viện · cửa nhập không có) ⇒ LỖI, KHÔNG kết luận.
 *
 * Chạy:
 *   node scripts/nghiem-thu-ban-lam-viec/noi-kho-idfc-song-sot.mjs \
 *        --url=http://localhost:3106 --tep=<thư mục chứa ghe-ben.idfc, ghe-mong.idfc> [--anh=<thư mục>]
 *   (giữa hai lượt, tự gọi `gieo-noi-kho-idfc.ts --doi-ma` qua `--doi-ma-cmd=`; mặc định đã cắm sẵn)
 */
import { chromium } from '/home/user/INTERIORFLOW/node_modules/playwright/index.mjs';
import { mkdtempSync, rmSync, mkdirSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';

const co = (t, m) => {
  const a = process.argv.find((x) => x.startsWith(`--${t}=`));
  return a ? a.slice(t.length + 3) : m;
};
const GOC = co('url', 'http://localhost:3106');
const TEP = co('tep', join(process.cwd(), '.nen-noi-kho'));
const ANH = co('anh', '');
const DOI_MA_CMD = co(
  'doi-ma-cmd',
  `DATABASE_URL="file:${process.cwd()}/prisma/dev.db" node_modules/.bin/sucrase-node scripts/nghiem-thu-ban-lam-viec/gieo-noi-kho-idfc.ts --doi-ma`,
);
const CHROME = process.env.IF_CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
if (ANH) mkdirSync(ANH, { recursive: true });

const ket = { pass: 0, fail: [], loi: [] };
const ok = (ten, dieuKien, chiTiet = '') => {
  if (dieuKien) { ket.pass++; console.log('  ok  -', ten, chiTiet && `· ${chiTiet}`); }
  else { ket.fail.push(ten); console.log('  FAIL-', ten, chiTiet && `· ${chiTiet}`); }
};

/**
 * Đọc thẳng kho `.idfc` trong IndexedDB — NƠI LƯU THẬT.
 * Địa chỉ chính xác, đọc từ mã chứ không đoán: DB `interiorflow-sheets` v1 · store `sheets`
 * (`lib/sheets-persist.ts:28-30`) · khoá `sheetsKey('studio', '/studio-idfc')` = `studio::/studio-idfc`
 * (`:52-55` + `studio-persist.ts:27` `STUDIO_USER='studio'`, `idfc-store.ts` `IDB_ROUTE`) ·
 * ruột `{ sheets: [{ id:'data', payload: StoredIdfc[] }] }` (`studio-persist.ts:44-52`).
 * ⚠️ Lượt đầu tôi viết reader này bằng `getAll()` + đoán hình dạng ⇒ nó trả `[]` trong khi món
 * VẪN CÒN trên kệ. Bộ đo báo sai chỗ nó không hiểu — nên nay đi đúng khoá, và khoá sai thì trả
 * `LỖI` kèm danh sách khoá thật để người đọc biết là bộ đo hỏng chứ không phải app mất dữ liệu.
 */
const DOC_KHO_IDFC = () => new Promise((res) => {
  const r = indexedDB.open('interiorflow-sheets', 1);
  r.onerror = () => res({ loi: 'không mở được IndexedDB interiorflow-sheets' });
  r.onsuccess = () => {
    const db = r.result;
    if (!db.objectStoreNames.contains('sheets')) return res({ loi: 'chưa có object store "sheets"' });
    const st = db.transaction('sheets', 'readonly').objectStore('sheets');
    const keys = st.getAllKeys();
    const g = st.get('studio::/studio-idfc');
    g.onerror = () => res({ loi: 'đọc bản ghi lỗi' });
    g.onsuccess = () => {
      const rec = g.result;
      const khoaThat = keys.result ?? [];
      if (!rec) return res({ loi: 'không có bản ghi ở khoá studio::/studio-idfc', khoaThat });
      const ma = [];
      for (const s of rec.sheets ?? []) for (const m of s.payload ?? []) if (m?.meta?.code) ma.push(m.meta.code);
      res({ khoa: 'studio::/studio-idfc', ts: rec.ts ?? null, khoaThat, maIdfc: ma });
    };
  };
});

/** Mở tấm Thư viện thẳng vào kệ "Cấu kiện (.idfc)" bằng ĐÚNG cửa chung của app. */
async function moKeCauKien(page) {
  await page.evaluate(() => window.dispatchEvent(
    new CustomEvent('if:library-open', { detail: { shelfId: 'common-idfc' } }),
  ));
  await page.waitForTimeout(1500);
}

/** Bấm một món trên lưới theo TÊN, rồi đọc cột thông số. */
async function xemMon(page, ten) {
  const nut = page.locator('.if-lib-root .grid button, .if-lib-root button').filter({ hasText: ten });
  const so = await nut.count().catch(() => 0);
  if (!so) return { loi: `không thấy món "${ten}" trên kệ` };
  await nut.first().click().catch(() => {});
  await page.waitForTimeout(900);
  return page.evaluate(() => {
    const col = document.querySelector('.if-lib-root .speccol');
    if (!col) return { loi: 'cột thông số không mở' };
    const noi = col.querySelector('[data-testid="lib-noi-kho"]');
    const rows = {};
    for (const r of col.querySelectorAll('.sprow')) {
      const k = r.querySelector('.k')?.textContent?.trim() ?? '';
      const v = r.querySelector('.v')?.textContent?.trim() ?? '';
      if (k) rows[k] = v;
    }
    return {
      ten: col.querySelector('.spname b')?.textContent?.trim() ?? null,
      kieu: noi?.getAttribute('data-kieu') ?? null,
      chinh: noi?.querySelector('b')?.textContent?.trim() ?? null,
      phu: noi?.querySelector('span')?.textContent?.trim() ?? null,
      mauCham: noi ? getComputedStyle(noi.querySelector('b i')).backgroundColor : null,
      dong: rows,
      why: col.querySelector('.spwhy')?.textContent?.trim() ?? null,
    };
  });
}

async function moPhien(hoSo) {
  const ctx = await chromium.launchPersistentContext(hoSo, {
    executablePath: CHROME,
    viewport: { width: 1600, height: 900 },
  });
  const page = ctx.pages()[0] ?? (await ctx.newPage());
  const r = await page.request.post(`${GOC}/api/auth/login`, {
    data: { identifier: 'kiem@localhost.test', password: 'matkhau123' },
  });
  if (!r.ok()) { await ctx.close(); return { loi: `login ${r.status()}` }; }
  const me = await (await page.request.get(`${GOC}/api/auth/me`)).json().catch(() => ({}));
  const uid = me?.user?.id ?? '';
  await page.goto(GOC, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await page.evaluate((id) => { try { localStorage.setItem(`interiorflow.tourDone.${id}`, '1'); } catch {} }, uid);
  await page.goto(`${GOC}/library`, { waitUntil: 'networkidle', timeout: 90000 }).catch(() => {});
  await page.waitForTimeout(2500);
  return { ctx, page };
}

/* ══════════════ LƯỢT 1 — nhập tệp, đọc trạng thái nối ══════════════ */
const hoSo = mkdtempSync(join(tmpdir(), 'if-noi-kho-'));
let luot1 = null;
{
  if (!existsSync(join(TEP, 'ghe-ben.idfc'))) {
    console.error(`LỖI: không thấy ${join(TEP, 'ghe-ben.idfc')} — chạy gieo-noi-kho-idfc.ts trước.`);
    process.exit(2);
  }
  const s = await moPhien(hoSo);
  if (s.loi) { console.error('LỖI hạ tầng:', s.loi); process.exit(2); }
  const { ctx, page } = s;

  await moKeCauKien(page);
  if (!(await page.locator('.if-lib-root .speccol, .if-lib-root').count())) {
    await ctx.close(); console.error('LỖI: không mở được tấm Thư viện'); process.exit(2);
  }

  console.log('\n① NHẬP hai tệp .idfc qua ĐÚNG cửa nhập của app (không ghi thẳng vào kho)');
  const nutNap = page.getByRole('button', { name: /Nạp hàng loạt|Bulk add/ });
  if (!(await nutNap.count())) { await ctx.close(); console.error('LỖI: không thấy nút "Nạp hàng loạt"'); process.exit(2); }
  await nutNap.first().click();
  await page.waitForTimeout(600);
  await page.locator('[data-testid="lib-ingest-input"]').setInputFiles([
    join(TEP, 'ghe-ben.idfc'),
    join(TEP, 'ghe-mong.idfc'),
  ]);
  await page.waitForTimeout(1200);
  const nutVaoKho = page.getByRole('button', { name: /Đưa vào kho|Add to store/ });
  if (!(await nutVaoKho.count())) { await ctx.close(); console.error('LỖI: không thấy nút "Đưa vào kho"'); process.exit(2); }
  await nutVaoKho.first().click();
  await page.waitForTimeout(2500);
  await moKeCauKien(page);

  console.log('\n② ĐỌC trạng thái nối — ba ca phải RA BA CÂU KHÁC NHAU');
  const ben = await xemMon(page, 'Ghế ăn — nối chắc');
  const mong = await xemMon(page, 'Ghế ăn — nối mỏng');
  const hatGiong = await xemMon(page, 'Kệ sách liền tường 900');
  luot1 = { ben, mong, hatGiong };

  for (const [nhan, r] of [['ben', ben], ['mong', mong], ['hạt giống', hatGiong]]) {
    if (r.loi) { ket.loi.push(`${nhan}: ${r.loi}`); console.log('  LỖI -', nhan, r.loi); }
  }

  ok('ca NỐI CHẮC — trạng thái ben', ben.kieu === 'ben', `kieu=${ben.kieu}`);
  ok('ca NỐI CHẮC — nói ra tên hàng trong kho', /Ghế ăn gỗ sồi/.test(ben.phu ?? ''), ben.phu ?? '');
  ok('ca NỐI CHẮC — giá lấy SỐNG từ kho (4 200 000), KHÔNG phải 3 100 000 chép trong tệp',
    Object.values(ben.dong).includes('4 200 000'), JSON.stringify(ben.dong));
  ok('ca NỐI CHẮC — hãng cũng lấy từ kho, không lấy "Hãng ghi trong tệp"',
    ben.dong['Hãng'] === 'Xưởng Kiểm', ben.dong['Hãng'] ?? '');

  ok('ca NỐI MỎNG — trạng thái mong', mong.kieu === 'mong', `kieu=${mong.kieu}`);
  ok('ca NỐI MỎNG — câu chữ cảnh báo "đứt"', /đứt/.test(mong.chinh ?? ''), mong.chinh ?? '');

  ok('ca CHƯA KHAI — hạt giống nói "chưa khai", KHÔNG nói "không tìm thấy"',
    hatGiong.kieu === 'chua-khai', `kieu=${hatGiong.kieu} · ${hatGiong.chinh ?? ''}`);

  ok('ba ca RA BA CÂU KHÁC NHAU (không gộp)',
    new Set([ben.chinh, mong.chinh, hatGiong.chinh]).size === 3);
  ok('không câu nào lộ chữ máy (specId · matId · sku)',
    ![ben, mong, hatGiong].some((r) => /\b(specId|matId|sku)\b/.test(`${r.chinh ?? ''} ${r.phu ?? ''}`)));

  if (ANH) {
    await xemMon(page, 'Ghế ăn — nối chắc');
    await page.screenshot({ path: join(ANH, 'noi-kho-1-ben.png') });
    await xemMon(page, 'Ghế ăn — nối mỏng');
    await page.screenshot({ path: join(ANH, 'noi-kho-2-mong.png') });
    await xemMon(page, 'Kệ sách liền tường 900');
    await page.screenshot({ path: join(ANH, 'noi-kho-3-chua-khai.png') });
  }

  await ctx.close(); // ĐÓNG HẲN
}

/* ══════════════ ĐỔI MÃ HÀNG TRONG KHO ══════════════ */
console.log('\n③ ĐỔI MÃ HÀNG trong kho (giả lập NCC đổi mã) — trình duyệt đang ĐÓNG');
console.log('   ', execSync(DOI_MA_CMD, { encoding: 'utf8' }).trim());

/* ══════════════ LƯỢT 2 — vào lại trên CÙNG hồ sơ đĩa ══════════════ */
{
  const s = await moPhien(hoSo);
  if (s.loi) { console.error('LỖI hạ tầng lượt 2:', s.loi); process.exit(2); }
  const { ctx, page } = s;

  console.log('\n④ ĐỌC TỪ NƠI LƯU THẬT — hai bản ghi .idfc còn sống qua một lần tắt trình duyệt?');
  const kho = await page.evaluate(DOC_KHO_IDFC);
  if (kho.loi) {
    // Bộ đo không tìm được chỗ lưu ⇒ LỖI (không kết luận), KHÔNG phải FAIL "app mất dữ liệu".
    ket.loi.push(`đọc IndexedDB: ${kho.loi} · khoá thật = ${JSON.stringify(kho.khoaThat ?? [])}`);
    console.log('  LỖI - đọc IndexedDB:', kho.loi, JSON.stringify(kho.khoaThat ?? []));
  } else {
    ok('IndexedDB còn "Ghế ăn — nối chắc"', (kho.maIdfc ?? []).includes('NK-GHE-BEN'), JSON.stringify(kho.maIdfc));
    ok('IndexedDB còn "Ghế ăn — nối mỏng"', (kho.maIdfc ?? []).includes('NK-GHE-MONG'));
  }

  await moKeCauKien(page);
  console.log('\n⑤ SAU KHI KHO ĐỔI MÃ — hai tệp phải RẼ HAI HƯỚNG');
  const ben = await xemMon(page, 'Ghế ăn — nối chắc');
  const mong = await xemMon(page, 'Ghế ăn — nối mỏng');

  ok('NỐI CHẮC vẫn đúng sau khi kho đổi mã hàng', ben.kieu === 'ben', `kieu=${ben.kieu}`);
  ok('NỐI CHẮC vẫn đọc giá sống 4 200 000', Object.values(ben.dong).includes('4 200 000'), JSON.stringify(ben.dong));
  ok('NỐI MỎNG ĐỨT — kho không còn tìm ra', mong.kieu === 'khong-thay', `kieu=${mong.kieu} · ${mong.chinh ?? ''}`);
  ok('NỐI MỎNG rơi về số chép trong tệp VÀ NÓI RA điều đó',
    /chép trong tệp/.test(mong.phu ?? '') && Object.values(mong.dong).includes('3 100 000'),
    `${mong.phu ?? ''} · ${JSON.stringify(mong.dong)}`);

  /* ⭐ HIỆU CHUẨN NỘI TẠI — hai tệp đi qua CÙNG một lần đổi mã. Cùng sống hoặc cùng chết là phép
     đo không phân biệt được hai thế giới, lúc đó mọi số ở trên vô nghĩa. */
  ok('HIỆU CHUẨN — hai tệp RẼ HAI HƯỚNG (phép đo phân biệt được)',
    ben.kieu !== mong.kieu, `ben=${ben.kieu} · mong=${mong.kieu}`);

  if (ANH) {
    await xemMon(page, 'Ghế ăn — nối chắc');
    await page.screenshot({ path: join(ANH, 'noi-kho-4-sau-doi-ma-ben.png') });
    await xemMon(page, 'Ghế ăn — nối mỏng');
    await page.screenshot({ path: join(ANH, 'noi-kho-5-sau-doi-ma-dut.png') });
  }
  await ctx.close();
}

rmSync(hoSo, { recursive: true, force: true });

console.log('\n══ chữ người dùng thấy (lượt 1) ══');
for (const [k, v] of Object.entries(luot1 ?? {})) console.log(` ${k}: [${v.kieu}] ${v.chinh}\n         ${v.phu}`);
console.log(`\n${ket.pass} pass · ${ket.fail.length} FAIL · ${ket.loi.length} LỖI`);
if (ket.fail.length) console.log('FAIL:', ket.fail.join(' · '));
if (ket.loi.length) console.log('LỖI:', ket.loi.join(' · '));
process.exit(ket.fail.length || ket.loi.length ? 1 : 0);
