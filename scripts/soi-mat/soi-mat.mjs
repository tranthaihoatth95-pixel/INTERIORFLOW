/* SOI MẮT — tự đăng ký, tự đi hết các màn, tự chụp, tự đo.
 * Không đọc mã rồi đoán: mở app thật, bấm thật, đo trên DOM thật. */
import { chromium } from 'playwright';
import fs from 'node:fs';
const OUT = process.env.OUT || '/tmp/soi-mat';
fs.mkdirSync(OUT, { recursive: true });
const BASE = 'http://localhost:3210';

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
// bỏ qua intro (route /intro tự đọc cờ này — app/intro/page.tsx:18)
await ctx.addInitScript(() => { try { localStorage.setItem('if_intro_seen_v1', '1'); } catch {} });
const p = await ctx.newPage();

const loi = [];
p.on('console', (m) => { if (m.type() === 'error') loi.push(m.text().slice(0, 200)); });
p.on('pageerror', (e) => loi.push('PAGEERROR ' + String(e.message).slice(0, 200)));

const email = `soi.mat.${Date.now()}@if.test`, mk = 'MatThuong#2026';
await p.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(2500);
console.log('URL đầu:', p.url());

// sang tab ĐĂNG KÝ
const tabDangKy = p.locator('button:has-text("Đăng ký"), button:has-text("Sign up")').first();
if (await tabDangKy.count()) { await tabDangKy.click().catch(() => {}); await p.waitForTimeout(700); }
await p.screenshot({ path: `${OUT}/00-dang-ky.png` });

const ten = p.locator('input[placeholder*="Tên"], input[placeholder*="Your name"]').first();
if (await ten.count()) await ten.fill('Soi Mắt');
const idf = p.locator('input[placeholder*="Email"], input[placeholder*="Email or phone"]').first();
if (await idf.count()) await idf.fill(email);
const pws = p.locator('input[type="password"]');
const n = await pws.count();
for (let i = 0; i < n; i++) await pws.nth(i).fill(mk);
await p.screenshot({ path: `${OUT}/01-da-dien.png` });
await p.locator('button[type="submit"]').first().click().catch(() => {});
await p.waitForTimeout(7000);
console.log('sau đăng ký → URL:', p.url());
console.log('chữ:', (await p.evaluate(() => document.body.innerText.slice(0, 260))).replace(/\s+/g, ' '));
await p.screenshot({ path: `${OUT}/02-sau-dang-ky.png`, fullPage: false });

const MAN = [
  ['10-home', '/'],
  ['20-files', '/files'],
  ['30-thu-vien', '/library'],
  ['31-gallery', '/library/gallery'],
  ['40-vat-lieu', '/materials'],
  ['50-viec', '/tasks'],
  ['60-cai-dat', '/settings'],
  ['61-ve-app', '/settings/about'],
];
const bang = [];
for (const [ten, path] of MAN) {
  loi.length = 0;
  try {
    await p.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await p.waitForTimeout(3500);
  } catch (e) { bang.push({ ten, path, loi: 'GOTO FAIL ' + e.message.slice(0, 80) }); continue; }
  const do_ = await p.evaluate(() => {
    const d = document.documentElement, bd = document.body;
    return {
      url: location.pathname,
      caoND: d.scrollHeight, caoMan: d.clientHeight,
      tranNgang: d.scrollWidth > d.clientWidth + 1,
      chu: bd.innerText.replace(/\s+/g, ' ').slice(0, 180),
      soChu: bd.innerText.trim().length,
      nut: document.querySelectorAll('button,a[href]').length,
      anh: document.querySelectorAll('img,canvas,svg').length,
      theme: d.getAttribute('data-theme') || getComputedStyle(d).colorScheme,
      nen: getComputedStyle(bd).backgroundColor,
    };
  });
  await p.screenshot({ path: `${OUT}/${ten}.png` });
  bang.push({ ten, path, ...do_, loi: loi.slice(0, 2) });
  console.log(`${ten.padEnd(14)} ${do_.url.padEnd(20)} chữ=${String(do_.soChu).padEnd(5)} nút=${String(do_.nut).padEnd(4)} cuộn=${do_.caoND}/${do_.caoMan} ngang=${do_.tranNgang ? 'TRÀN' : 'ok'} lỗi=${loi.length}`);
}
fs.writeFileSync(`${OUT}/do.json`, JSON.stringify(bang, null, 2));
await b.close();
