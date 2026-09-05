/** Home ở BA NẤC RAIL — kiểm xem bố cục có khớp CONTAINER hay chỉ khớp VIEWPORT. */
import { chromium } from '/home/user/INTERIORFLOW/node_modules/playwright/index.mjs';
import { mkdirSync } from 'fs';
const GOC = process.env.IF_URL ?? 'http://localhost:3081';
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
const out = {};
for (const nac of ['dinhVi', 'dieuHuong', 'duyet']) {
  await page.goto(GOC, { waitUntil: 'domcontentloaded' });
  await page.evaluate((n) => { try { localStorage.setItem('interiorflow.rail.nac_v1', n); } catch {} }, nac);
  await page.goto(GOC, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1100);
  out[nac] = await page.evaluate(() => {
    const g = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { w: Math.round(r.width), x: Math.round(r.x) }; };
    const xh = document.querySelector('.xuong-home');
    const cs = xh ? getComputedStyle(xh) : null;
    return {
      rail: g('nav'), xuong: g('.xuong-home'), san: g('.xuong-home .san'), thang: g('.xuong-home .thang'),
      vat: g('.xuong-home .vat'),
      thangW: cs ? cs.getPropertyValue('--thangW').trim() : null,
      daiH: cs ? cs.getPropertyValue('--daiH').trim() : null,
      keBen: document.querySelectorAll('.xuong-home .ke-ben').length,
      oNen: document.querySelectorAll('.xuong-home .o-nen').length,
    };
  });
  await page.screenshot({ path: `.nen-kiem/out/rail-${nac}.png` });
}
console.log(JSON.stringify(out, null, 1));
await b.close();
