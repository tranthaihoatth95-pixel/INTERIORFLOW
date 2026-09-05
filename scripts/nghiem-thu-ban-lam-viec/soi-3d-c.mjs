/** 3D vòng 3 — bấm ĐÚNG TÂM công tắc "Vẽ 3D", chờ WebGL, kiểm tường 2D có sang không. */
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

const hop = await page.evaluate(() => {
  const es = [...document.querySelectorAll('*')];
  const e = es.find((x) => (x.textContent || '').trim() === 'Vẽ 3D' && x.getBoundingClientRect().y > 700);
  if (!e) return null;
  // đi lên tới phần tử BẤM ĐƯỢC gần nhất
  let p = e; for (let i = 0; i < 5 && p; i++) { if (p.tagName === 'BUTTON' || p.getAttribute('role') === 'button' || p.onclick) break; p = p.parentElement; }
  const r = (p || e).getBoundingClientRect();
  return { tag: (p || e).tagName, w: Math.round(r.width), h: Math.round(r.height), cx: Math.round(r.x + r.width / 2), cy: Math.round(r.y + r.height / 2), rx: Math.round(r.x + r.width - 12), };
});
g({ s: 'hộp công tắc', hop });
if (hop) {
  await page.mouse.click(hop.rx, hop.cy);
  await page.waitForTimeout(6000);
  await page.screenshot({ path: '.nen-kiem/out/3d-C-bat.png' });
  g({ s: 'sau bấm núm', ...(await page.evaluate(() => ({
    canvas: [...document.querySelectorAll('canvas')].map((c) => `${c.width}x${c.height}`),
    webgl: [...document.querySelectorAll('canvas')].some((c) => { try { return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } }),
    chu: document.body.innerText.replace(/\s+/g, ' ').slice(300, 700),
  }))) });
}
await b.close();
