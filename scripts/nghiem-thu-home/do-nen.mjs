/** Đo xem DẢI MÔI TRƯỜNG có thật sự vẽ gì không, và modal onboarding có che màn không. */
import { chromium } from '/home/user/INTERIORFLOW/node_modules/playwright/index.mjs';

const bh = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await bh.newContext({ viewport: { width: 1600, height: 900 } });
const p0 = await ctx.newPage();
await p0.request.post('http://localhost:3031/api/auth/login', {
  data: { identifier: 'tho@interiorflow.test', password: 'matkhau123' },
});
await p0.close();

const page = await ctx.newPage();
await page.goto('http://localhost:3031/?demo=co-viec', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);

const r = await page.evaluate(() => {
  const dai = document.querySelector('.xuong-home .dai');
  const con = dai?.firstElementChild ?? null;
  const modal = [...document.querySelectorAll('body *')].filter((n) => {
    const s = getComputedStyle(n);
    const b = n.getBoundingClientRect();
    return (
      (s.position === 'fixed' || s.position === 'absolute') &&
      Number(s.zIndex) >= 40 &&
      b.width > 600 &&
      b.height > 400
    );
  }).map((n) => ({ cls: n.className?.toString?.().slice(0, 60), z: getComputedStyle(n).zIndex }));
  return {
    daiCo: !!dai,
    daiCon: con ? { cls: con.className?.toString?.().slice(0, 80), html: con.outerHTML.slice(0, 200) } : null,
    soConTrongDai: dai ? dai.children.length : -1,
    modal,
    khoaLocal: Object.keys(localStorage).filter((k) => /tour|welcome|intro/i.test(k)),
  };
});
console.log(JSON.stringify(r, null, 2));
await bh.close();
