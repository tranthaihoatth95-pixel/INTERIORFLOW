/** 3D — tường vừa vẽ ở 2D có sang không (luật X1 một Doc), gán vật liệu, rồi sang Trình chiếu. */
import { chromium } from '/home/user/INTERIORFLOW/node_modules/playwright/index.mjs';
const GOC = 'http://localhost:3081';
const PID = 'cmtmdaaws00017dmmhactp691';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await b.newContext({ viewport: { width: 1600, height: 900 } });
{
  const p = await ctx.newPage();
  await p.request.post(`${GOC}/api/auth/login`, { data: { identifier: 'kiem@localhost.test', password: 'matkhau123' } });
  const me = await (await p.request.get(`${GOC}/api/auth/me`)).json();
  await p.goto(GOC);
  await p.evaluate((id) => { try { localStorage.setItem(`interiorflow.tourDone.${id}`, '1'); } catch {} }, me?.user?.id ?? '');
  await p.close();
}
const page = await ctx.newPage();
const loi = [];
page.on('pageerror', (e) => loi.push(String(e).slice(0, 200)));
const g = (o) => console.log(JSON.stringify(o));

await page.goto(`${GOC}/projects/${PID}/render`, { waitUntil: 'networkidle' });
await page.waitForTimeout(4000);
await page.screenshot({ path: '.nen-kiem/out/3d-01-vao.png' });
g({ s: '3D · vào', ...(await page.evaluate(() => ({
  canvasWebGL: [...document.querySelectorAll('canvas')].map((c) => ({ w: c.width, h: c.height, ctx: !!(c.getContext('webgl2') || c.getContext('webgl')) })),
  coViewport3D: !!document.querySelector('[data-viewport-3d],[class*="viewport"]'),
  chuTrenMan: document.body.innerText.replace(/\s+/g, ' ').slice(0, 300),
}))) });

// tìm đường sang chế độ 3D dựng khối
const nut3D = page.getByRole('button', { name: /Vẽ 3D|Dựng khối|3D/ });
g({ s: 'nút mở 3D', so: await nut3D.count() });
if (await nut3D.count()) {
  await nut3D.first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(3500);
  await page.screenshot({ path: '.nen-kiem/out/3d-02-mode.png' });
  g({ s: 'sau khi bấm', ...(await page.evaluate(() => ({
    canvas: [...document.querySelectorAll('canvas')].map((c) => `${c.width}x${c.height}`),
    webgl: [...document.querySelectorAll('canvas')].some((c) => !!(c.getContext('webgl2') || c.getContext('webgl'))),
    chu: document.body.innerText.replace(/\s+/g, ' ').slice(0, 260),
  }))) });
}
g({ s: 'lỗi trang', loi });
await page.screenshot({ path: '.nen-kiem/out/3d-03-cuoi.png' });

/* TRÌNH CHIẾU */
await page.goto(`${GOC}/projects/${PID}/present`, { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
await page.screenshot({ path: '.nen-kiem/out/pr-01.png' });
g({ s: 'Trình chiếu', chu: await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 300)) });
// chọn một mẫu hồ sơ rồi xem có vào editor không
const mau = page.getByRole('button', { name: /Tạo hồ sơ trống/ });
if (await mau.count()) {
  const u0 = page.url();
  await mau.first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(3000);
  g({ s: 'bấm Tạo hồ sơ trống', truoc: u0, sau: page.url(), doi: u0 !== page.url() });
  await page.screenshot({ path: '.nen-kiem/out/pr-02-sau-tao.png' });
}
g({ s: 'lỗi trang cuối', loi });
await b.close();
