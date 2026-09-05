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
  const top = document.elementFromPoint(1352, 834);
  const chuoi = [];
  let e = top;
  for (let i = 0; i < 8 && e; i++) {
    const cs = getComputedStyle(e);
    const b = e.getBoundingClientRect();
    chuoi.push({
      tag: e.tagName, cls: (e.className || '').toString().slice(0, 70),
      pos: cs.position, z: cs.zIndex, pe: cs.pointerEvents, ov: cs.overflow,
      hop: [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)],
      chu: (e.textContent || '').trim().slice(0, 50),
    });
    e = e.parentElement;
  }
  return chuoi;
});
console.log(JSON.stringify(r, null, 1));
await b.close();
