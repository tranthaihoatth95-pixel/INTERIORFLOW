/** Soi điểm bấm trên canvas 2D: elementFromPoint trả về gì, và pointerdown có tới canvas không. */
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

// cắm bộ đếm sự kiện lên chính canvas
await p.evaluate(() => {
  const cv = document.querySelector('canvas');
  window.__dem = { down: 0, up: 0, move: 0 };
  cv.addEventListener('pointerdown', () => { window.__dem.down += 1; }, true);
  cv.addEventListener('pointerup', () => { window.__dem.up += 1; }, true);
  cv.addEventListener('pointermove', () => { window.__dem.move += 1; }, true);
});

const cv = p.locator('canvas').first();
const hop = await cv.boundingBox();
console.log('canvas box =', JSON.stringify(hop));
const soiDiem = (dx, dy) => p.evaluate(([x, y]) => {
  const el = document.elementFromPoint(x, y);
  return { tag: el?.tagName, cls: String(el?.className).slice(0, 80) };
}, [hop.x + dx, hop.y + dy]);
console.log('điểm (400,300):', JSON.stringify(await soiDiem(400, 300)));
console.log('điểm (250,200):', JSON.stringify(await soiDiem(250, 200)));

await p.locator('input[placeholder*="lệnh" i]').first().evaluate((el) => el.focus());
await p.keyboard.type('REC', { delay: 50 });
await p.keyboard.press('Enter');
await p.waitForTimeout(500);

await p.mouse.move(hop.x + 400, hop.y + 300, { steps: 5 });
await p.waitForTimeout(150);
await p.mouse.down();
await p.waitForTimeout(120);
await p.mouse.up();
await p.waitForTimeout(400);
console.log('đếm sau nhấn 1:', JSON.stringify(await p.evaluate(() => window.__dem)));
console.log('SAU NHẤN 1 — chuỗi cha tại (900,640):', JSON.stringify(await p.evaluate(([x, y]) => {
  let n = document.elementFromPoint(x, y); const ra = [];
  while (n && ra.length < 7) { const r = n.getBoundingClientRect(); ra.push({ tag: n.tagName, cls: String(n.className).slice(0,70), rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)], z: getComputedStyle(n).zIndex, pe: getComputedStyle(n).pointerEvents }); n = n.parentElement; }
  return ra;
}, [hop.x + 900, hop.y + 640]), null, 1));
console.log('SAU NHẤN 1 — có input nổi nào:', JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('input')].map((i) => { const r = i.getBoundingClientRect(); return { ph: (i.placeholder||'').slice(0,30), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; }))));
await p.mouse.move(hop.x + 900, hop.y + 640, { steps: 10 });
await p.waitForTimeout(200);
await p.mouse.down();
await p.waitForTimeout(120);
await p.mouse.up();
await p.waitForTimeout(3000);
console.log('đếm sau nhấn 2:', JSON.stringify(await p.evaluate(() => window.__dem)));

const so = await p.evaluate(async () => {
  const db = await new Promise((res) => { const r = indexedDB.open('interiorflow-sheets', 1); r.onsuccess = () => res(r.result); });
  const keys = await new Promise((res) => { const r = db.transaction('sheets', 'readonly').objectStore('sheets').getAllKeys(); r.onsuccess = () => res(r.result); });
  const v = await new Promise((res) => { const r = db.transaction('sheets', 'readonly').objectStore('sheets').get(keys[0]); r.onsuccess = () => res(r.result); });
  return (v?.sheets ?? []).map((s) => ({ id: s.id, so: s.doc?.entities?.length ?? null, loai: (s.doc?.entities ?? []).map((e) => e.type) }));
});
console.log('sheets trong IDB:', JSON.stringify(so));
await p.screenshot({ path: '.nen-kiem/soi-diem.png' });
await b.close();
