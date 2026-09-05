/** Soi bước CHỌN vùng tô: Escape về select rồi bấm — có chọn được không, dấu hiệu nào nhìn thấy. */
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
const cv = p.locator('canvas').first();
const hop = await cv.boundingBox();
const bam = async (dx, dy) => {
  await p.mouse.move(hop.x + dx, hop.y + dy, { steps: 6 }); await p.waitForTimeout(140);
  await p.mouse.down(); await p.waitForTimeout(110); await p.mouse.up(); await p.waitForTimeout(450);
};
const tt = () => p.evaluate(() => ({
  batNut: [...document.querySelectorAll('[aria-pressed="true"]')].map((e) => (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 18)),
  coXoa: !!document.querySelector('[title*="Xoá đối tượng đã chọn"]'),
  xoaMo: document.querySelector('[title*="Xoá đối tượng đã chọn"]')?.disabled ?? null,
  chuCuoi: (document.body.innerText.match(/[^\n]*đối tượng[^\n]*/g) || []).slice(0, 3),
}));

const oLenh = p.locator('input[placeholder*="lệnh" i]').first();
await oLenh.evaluate((el) => el.focus());
await p.keyboard.type('REC', { delay: 50 }); await p.keyboard.press('Enter'); await p.waitForTimeout(400);
await bam(150, 200); await bam(620, 560);
await p.keyboard.press('Escape'); await p.waitForTimeout(1600);
console.log('sau khi vẽ rect:', JSON.stringify(await tt()));

// tô: mở tấm, chọn vật liệu, đóng tấm, bấm trong lòng
await p.evaluate(() => window.dispatchEvent(new CustomEvent('cad:open-material-palette')));
await p.waitForTimeout(900);
await p.getByRole('button', { name: /Sàn gỗ sồi/i }).first().click();
await p.waitForTimeout(500);
await p.getByRole('button', { name: /^Đóng$/ }).first().click();
await p.waitForTimeout(500);
await bam(385, 380);
await p.waitForTimeout(1600);
console.log('sau khi tô:', JSON.stringify(await tt()));

// CHỌN: Escape rồi bấm lên vùng tô
await p.keyboard.press('Escape'); await p.waitForTimeout(400);
console.log('sau Escape:', JSON.stringify(await tt()));
await bam(385, 380);
console.log('sau bấm lên vùng tô:', JSON.stringify(await tt()));
// thử QUÂY KHUNG (marquee) — thao tác người dùng thật, chính status bar đang mách
await p.mouse.move(hop.x + 100, hop.y + 150, { steps: 5 });
await p.mouse.down();
await p.mouse.move(hop.x + 680, hop.y + 600, { steps: 14 });
await p.waitForTimeout(150);
await p.mouse.up();
await p.waitForTimeout(600);
console.log('sau QUÂY KHUNG:', JSON.stringify(await tt()));
await p.screenshot({ path: '.nen-kiem/soi-chon.png' });
await b.close();
