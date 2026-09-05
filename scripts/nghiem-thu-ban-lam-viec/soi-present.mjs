/** Trình chiếu — bấm "Tạo hồ sơ trống" xem có vào trình dàn trang không; kiểm thẻ intro có che gì. */
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
const g = (o) => console.log(JSON.stringify(o));
await page.goto(`${GOC}/projects/${PID}/present`, { waitUntil: 'networkidle' });
await page.waitForTimeout(3500);
await page.screenshot({ path: '.nen-kiem/out/pr-A.png' });

// thẻ intro có che nút nào không?
g({ s: 'thẻ intro che gì', ...(await page.evaluate(() => {
  const c = document.querySelector('[data-stage-intro-card]');
  if (!c) return { coThe: false };
  const r = c.getBoundingClientRect();
  const bi = [...document.querySelectorAll('button,[role="button"],a[href]')].filter((e) => {
    const b = e.getBoundingClientRect();
    return b.width > 0 && b.height > 0 && !(b.right < r.left || b.left > r.right || b.bottom < r.top || b.top > r.bottom) && !c.contains(e);
  }).map((e) => (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 30));
  return { coThe: true, hop: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)], deLen: bi };
})) });

const truoc = await page.evaluate(() => document.body.innerText.length);
const n = page.getByRole('button', { name: /Tạo hồ sơ trống/ });
g({ s: 'nút Tạo hồ sơ trống', so: await n.count() });
if (await n.count()) {
  await n.first().click({ force: true });
  await page.waitForTimeout(3500);
  const sau = await page.evaluate(() => document.body.innerText.length);
  g({ s: 'sau bấm', truoc, sau, doi: Math.abs(sau - truoc) > 20, url: page.url() });
  await page.screenshot({ path: '.nen-kiem/out/pr-B-sau.png' });
}
await b.close();
