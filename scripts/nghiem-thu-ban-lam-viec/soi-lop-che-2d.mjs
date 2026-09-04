/** Soi lớp che ô dòng lệnh ở chặng 2D — dò nguyên nhân click bị chặn. */
import { chromium } from '/home/user/INTERIORFLOW/node_modules/playwright/index.mjs';
const GOC = process.env.GOC ?? 'http://localhost:3095';
const PID = process.env.PID ?? 'cmtmdaaws00017dmmhactp691';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 1600, height: 950 } });
const p = await ctx.newPage();
await p.request.post(`${GOC}/api/auth/login`, { data: { identifier: 'kiem@localhost.test', password: 'matkhau123' } });
const me = await (await p.request.get(`${GOC}/api/auth/me`)).json();
await p.goto(GOC);
await p.evaluate((id) => { try { localStorage.setItem(`interiorflow.tourDone.${id}`, '1'); } catch {} }, me?.user?.id ?? '');
await p.goto(`${GOC}/projects/${PID}/cad`, { waitUntil: 'networkidle' });
await p.waitForTimeout(3500);
const veNgay = p.getByRole('button', { name: /Vẽ ngay|Start drawing/ });
if (await veNgay.count()) { await veNgay.first().click(); await p.waitForTimeout(500); }
const bao = await p.evaluate(() => {
  const inp = document.querySelector('input[placeholder*="lệnh" i]');
  const r = inp?.getBoundingClientRect();
  const giua = r ? document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) : null;
  const chuoi = [];
  let n = giua;
  while (n && chuoi.length < 6) {
    chuoi.push({ tag: n.tagName, cls: String(n.className).slice(0, 90), pe: getComputedStyle(n).pointerEvents });
    n = n.parentElement;
  }
  return { inputRect: r ? { x: r.x, y: r.y, w: r.width, h: r.height } : null, chuoiTrenDiem: chuoi, coCanvas: !!document.querySelector('canvas') };
});
console.log(JSON.stringify(bao, null, 1));
await p.screenshot({ path: '.nen-kiem/soi-cad.png' });
await b.close();
