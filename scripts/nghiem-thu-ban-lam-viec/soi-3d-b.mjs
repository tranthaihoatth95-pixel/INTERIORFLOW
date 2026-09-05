/** 3D vòng 2 — bật ĐÚNG công tắc "Vẽ 3D" ở dock dưới, xem tường 2D có sang không (luật X1). */
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
await page.goto(`${GOC}/projects/${PID}/render`, { waitUntil: 'networkidle' });
await page.waitForTimeout(4000);

// tìm công tắc "Vẽ 3D" ở dock dưới — theo VỊ TRÍ (y > 780) để không dính mục rail
const congTac = await page.evaluate(() => {
  const es = [...document.querySelectorAll('button,[role="button"],[role="switch"],input[type="checkbox"]')];
  return es.map((e, i) => {
    const r = e.getBoundingClientRect();
    return { i, ten: (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 30), x: Math.round(r.x), y: Math.round(r.y), vai: e.getAttribute('role') };
  }).filter((o) => /3D/i.test(o.ten) && o.y > 700);
});
g({ s: 'công tắc Vẽ 3D ở dock', congTac });
if (congTac.length) {
  await page.mouse.click(congTac[0].x + 40, congTac[0].y + 14);
  await page.waitForTimeout(5000);
  await page.screenshot({ path: '.nen-kiem/out/3d-B-sau-bat.png' });
  g({ s: 'sau khi bật', ...(await page.evaluate(() => ({
    canvas: [...document.querySelectorAll('canvas')].map((c) => `${c.width}x${c.height}`),
    webgl: [...document.querySelectorAll('canvas')].some((c) => { try { return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } }),
    chu: document.body.innerText.replace(/\s+/g, ' ').slice(0, 400),
  }))) });
}
await b.close();
