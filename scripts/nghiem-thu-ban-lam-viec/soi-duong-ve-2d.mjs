/** Soi đường vẽ 2D: gõ REC có đổi công cụ không, vẽ xong Doc có entity không. */
import { chromium } from '/home/user/INTERIORFLOW/node_modules/playwright/index.mjs';
const GOC = process.env.GOC ?? 'http://localhost:3095';
const PID = process.env.PID ?? 'cmtmdaaws00017dmmhactp691';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const ctx = await b.newContext({ viewport: { width: 1600, height: 950 } });
const p = await ctx.newPage();
p.on('console', (m) => { if (m.type() === 'error') console.log('  [console.error]', m.text().slice(0, 160)); });
await p.request.post(`${GOC}/api/auth/login`, { data: { identifier: 'kiem@localhost.test', password: 'matkhau123' } });
const me = await (await p.request.get(`${GOC}/api/auth/me`)).json();
await p.goto(GOC);
await p.evaluate((id) => { try { localStorage.setItem(`interiorflow.tourDone.${id}`, '1'); } catch {} }, me?.user?.id ?? '');
await p.goto(`${GOC}/projects/${PID}/cad`, { waitUntil: 'networkidle' });
await p.waitForTimeout(3500);
const veNgay = p.getByRole('button', { name: /Vẽ ngay|Start drawing/ });
if (await veNgay.count()) { await veNgay.first().click(); await p.waitForTimeout(500); }

const trangThai = () => p.evaluate(() => ({
  status: (document.querySelector('[data-cad-status]')?.textContent
    || [...document.querySelectorAll('div')].map((d) => d.textContent || '').find((t) => /^(Chọn|Hatch|Chữ nhật|Rect)/.test(t.trim()))
    || '').trim().slice(0, 110),
  giaTriOLenh: document.querySelector('input[placeholder*="lệnh" i]')?.value ?? null,
  batNut: [...document.querySelectorAll('[aria-pressed="true"]')].map((e) => (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 20)),
}));

const oLenh = p.locator('input[placeholder*="lệnh" i]').first();
console.log('nền:', JSON.stringify(await trangThai()));

await oLenh.evaluate((el) => el.focus());
await p.keyboard.type('REC', { delay: 60 });
console.log('sau gõ REC (chưa Enter):', JSON.stringify(await trangThai()));
await p.keyboard.press('Enter');
await p.waitForTimeout(500);
console.log('sau Enter:', JSON.stringify(await trangThai()));

const cv = p.locator('canvas').first();
const hop = await cv.boundingBox();
await p.mouse.click(hop.x + 400, hop.y + 300);
await p.waitForTimeout(300);
console.log('sau điểm 1:', JSON.stringify(await trangThai()));
await p.mouse.move(hop.x + 900, hop.y + 640, { steps: 10 });
await p.waitForTimeout(200);
await p.mouse.click(hop.x + 900, hop.y + 640);
await p.waitForTimeout(3000);
console.log('sau điểm 2:', JSON.stringify(await trangThai()));
await p.screenshot({ path: '.nen-kiem/soi-ve.png' });

const idb = await p.evaluate(async () => {
  const db = await new Promise((res, rej) => { const r = indexedDB.open('interiorflow-sheets', 1); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const keys = await new Promise((res, rej) => { const r = db.transaction('sheets', 'readonly').objectStore('sheets').getAllKeys(); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const out = {};
  for (const k of keys) {
    const v = await new Promise((res, rej) => { const r = db.transaction('sheets', 'readonly').objectStore('sheets').get(k); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    out[k] = { kieu: Array.isArray(v) ? 'mang' : typeof v, khoaCon: v && typeof v === 'object' ? Object.keys(v).slice(0, 8) : null, soEntity: v?.sheets?.[0]?.doc?.entities?.length ?? null, loaiEntity: (v?.sheets?.[0]?.doc?.entities ?? []).map((e) => e.type), tomTat: JSON.stringify(v?.sheets?.[0]?.doc?.entities ?? []).slice(0, 400) };
  }
  return out;
});
console.log('IndexedDB:', JSON.stringify(idb, null, 1).slice(0, 1600));
await b.close();
