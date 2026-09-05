/** Bấm công tắc "Vẽ 3D" bằng .click() của DOM (bỏ qua mọi lớp phủ), đọc localStorage mode. */
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
const loi = []; page.on('pageerror', (e) => loi.push(String(e).slice(0, 200)));
const g = (o) => console.log(JSON.stringify(o));
const kho = () => page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter((k) => /mode|stage/i.test(k)).map((k) => [k, localStorage.getItem(k)])));
await page.goto(`${GOC}/projects/${PID}/render`, { waitUntil: 'networkidle' });
await page.waitForTimeout(4000);
g({ s: 'trước', kho: await kho() });
const co = await page.evaluate(() => {
  const es = [...document.querySelectorAll('button')];
  const e = es.find((x) => (x.textContent || '').trim() === 'Vẽ 3D');
  if (!e) return 'không thấy';
  e.click();
  return 'đã click';
});
g({ s: 'click DOM', co });
await page.waitForTimeout(6000);
g({ s: 'sau', kho: await kho(), ...(await page.evaluate(() => ({
  canvas: [...document.querySelectorAll('canvas')].map((c) => `${c.width}x${c.height}`),
  webgl: [...document.querySelectorAll('canvas')].some((c) => { try { return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } }),
}))) });
await page.screenshot({ path: '.nen-kiem/out/3d-D-click-dom.png' });
g({ s: 'lỗi', loi });
await b.close();
