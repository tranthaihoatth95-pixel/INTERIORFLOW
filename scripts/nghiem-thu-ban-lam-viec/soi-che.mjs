/** Ai đang ĐỨNG TRÊN công tắc "Vẽ 3D"? elementFromPoint tại tâm nút. */
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
await page.goto(`${GOC}/projects/${PID}/render`, { waitUntil: 'networkidle' });
await page.waitForTimeout(4000);
const r = await page.evaluate(() => {
  const es = [...document.querySelectorAll('button')];
  const e = es.find((x) => (x.textContent || '').trim() === 'Vẽ 3D');
  if (!e) return { loi: 'không thấy nút' };
  const b = e.getBoundingClientRect();
  const diem = [
    ['tâm', b.x + b.width / 2, b.y + b.height / 2],
    ['núm phải', b.x + b.width - 12, b.y + b.height / 2],
    ['nhãn trái', b.x + 24, b.y + b.height / 2],
  ];
  const mo = (el) => el ? `${el.tagName}.${(el.className || '').toString().slice(0, 40)}` : 'null';
  return {
    hop: { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) },
    doi: e.getAttribute('aria-disabled') || e.disabled || false,
    pe: getComputedStyle(e).pointerEvents,
    tai: diem.map(([t, x, y]) => {
      const top = document.elementFromPoint(x, y);
      return { t, top: mo(top), laNut: top === e || e.contains(top) };
    }),
  };
});
console.log(JSON.stringify(r, null, 1));
await b.close();
