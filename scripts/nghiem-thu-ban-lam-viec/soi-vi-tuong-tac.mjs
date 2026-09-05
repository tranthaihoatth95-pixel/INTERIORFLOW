/**
 * BA CÂU CHUẨN VI-TƯƠNG-TÁC — kiểm bằng TAY trên app thật:
 *  ① phím tắt đã khai mà không mặt nào tiêu thụ   ② nút có mà không có đường chạy
 *  ③ công cụ bấm vào im lặng không làm gì
 */
import { chromium } from '/home/user/INTERIORFLOW/node_modules/playwright/index.mjs';
import { mkdirSync, writeFileSync } from 'fs';
const GOC = process.env.IF_URL ?? 'http://localhost:3081';
const PID = process.env.IF_PID ?? 'cmtmdaaws00017dmmhactp691';
mkdirSync('.nen-kiem/out', { recursive: true });

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await b.newContext({ viewport: { width: 1600, height: 900 } });
{
  const p = await ctx.newPage();
  const r = await p.request.post(`${GOC}/api/auth/login`, { data: { identifier: 'kiem@localhost.test', password: 'matkhau123' } });
  if (!r.ok()) throw new Error('login ' + r.status());
  const me = await (await p.request.get(`${GOC}/api/auth/me`)).json();
  await p.goto(GOC);
  await p.evaluate((id) => { try { localStorage.setItem(`interiorflow.tourDone.${id}`, '1'); } catch {} }, me?.user?.id ?? '');
  await p.close();
}
const page = await ctx.newPage();
const mang404 = [];
page.on('response', (r) => { if (r.status() >= 400) mang404.push(`${r.status()} ${r.url().slice(0, 140)}`); });
const ket = [];
const ghi = (o) => { ket.push(o); console.log(JSON.stringify(o)); };

/** ảnh chụp DOM rút gọn để so trước/sau — chỉ lấy thứ NHÌN THẤY được. */
const anhDom = () => page.evaluate(() => {
  const v = [...document.querySelectorAll('body *')].filter((e) => {
    const r = e.getBoundingClientRect();
    return r.width > 2 && r.height > 2;
  });
  return { soPhanTu: v.length, chu: document.body.innerText.length, url: location.href };
});

async function thu(ten, hanhDong) {
  const a = await anhDom();
  await hanhDong();
  await page.waitForTimeout(700);
  const c = await anhDom();
  const doi = a.soPhanTu !== c.soPhanTu || Math.abs(a.chu - c.chu) > 4 || a.url !== c.url;
  ghi({ thu: ten, truoc: a, sau: c, COVIEC: doi });
  return doi;
}

/* ══ ① ⌘J / Ctrl+J — VITALS ══ */
for (const [ten, url] of [['Home', GOC], ['2D', `${GOC}/projects/${PID}/cad`], ['3D', `${GOC}/projects/${PID}/render`], ['Trình chiếu', `${GOC}/projects/${PID}/present`]]) {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2200);
  await thu(`⌘J ở ${ten}`, async () => { await page.keyboard.press('Meta+j'); await page.waitForTimeout(300); await page.keyboard.press('Control+j'); });
}

/* ══ ② NÚT VITALS trên Home — bấm có mở gì không ══ */
await page.goto(GOC, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await thu('bấm nút Vitals (Home)', async () => {
  const n = page.locator('[aria-label^="Vitals"]').first();
  if (await n.count()) await n.click({ force: true }); else console.log('  (không thấy nút Vitals)');
});

/* ══ ③ CÔNG CỤ 2D — gõ W rồi vẽ, xem kho có ghi không ══ */
await page.goto(`${GOC}/projects/${PID}/cad`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2800);
// đóng lớp phủ bàn-trống bằng nút "Vẽ ngay" (đường CHÍNH thức của app)
const veNgay = page.getByRole('button', { name: /Vẽ ngay|Start drawing/ });
if (await veNgay.count()) { await veNgay.first().click(); await page.waitForTimeout(500); }
ghi({ b2: 'lớp phủ sau nút Vẽ ngay', con: await page.evaluate(() => !!document.querySelector('[data-empty-drawing-overlay]')) });

// công cụ đang chọn là gì? đọc nút toolbelt có aria-pressed
const congCu = () => page.evaluate(() => [...document.querySelectorAll('[aria-pressed="true"]')].map((e) => (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 30)));
ghi({ b2: 'công cụ đang bật TRƯỚC khi gõ W', dang: await congCu() });
await page.keyboard.press('KeyW');
await page.waitForTimeout(500);
ghi({ b2: 'công cụ đang bật SAU khi gõ W', dang: await congCu() });
await page.screenshot({ path: '.nen-kiem/out/vt-2d-sau-W.png' });

const cv = page.locator('canvas').first();
const hop = await cv.boundingBox();
if (hop) {
  await page.mouse.click(hop.x + 260, hop.y + 260);
  await page.waitForTimeout(350);
  await page.screenshot({ path: '.nen-kiem/out/vt-2d-diem1.png' });
  await page.mouse.move(hop.x + 640, hop.y + 260, { steps: 12 });
  await page.waitForTimeout(250);
  await page.screenshot({ path: '.nen-kiem/out/vt-2d-keo.png' });
  await page.mouse.click(hop.x + 640, hop.y + 260);
  await page.waitForTimeout(350);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(700);
  await page.screenshot({ path: '.nen-kiem/out/vt-2d-xong.png' });
}
ghi({ b2: 'sau khi vẽ — còn lớp phủ bàn-trống?', con: await page.evaluate(() => !!document.querySelector('[data-empty-drawing-overlay]')) });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2800);
ghi({ b2: 'SAU TẢI LẠI — bàn vẫn trống?', trong: await page.evaluate(() => !!document.querySelector('[data-empty-drawing-overlay]')) });
await page.screenshot({ path: '.nen-kiem/out/vt-2d-tai-lai.png' });

writeFileSync('.nen-kiem/out/vi-tuong-tac.json', JSON.stringify({ ket, mang404: [...new Set(mang404)] }, null, 1));
console.log('MẠNG LỖI:'); [...new Set(mang404)].forEach((x) => console.log('  ·', x));
await b.close();
