/**
 * scripts/audit-con-nguoi.mjs — Audit v2 CON NGƯƠI theo QUY-TRINH-REVIEW-120-PHUT.md
 * Không chỉ chụp route — login xuyên suốt, đi 5 luồng, ghi console error đầy đủ.
 * Chạy: node scripts/audit-con-nguoi.mjs
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'http://localhost:3000';
const OUT_DIR = 'docs/audit-2026-08-18-v2';
const AUTH_EMAIL = 'audit@if.local';
const AUTH_PW = 'auditIF2026';

fs.mkdirSync(path.join(OUT_DIR, 'anh'), { recursive: true });

const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const buoc = [];
const errAll = [];

page.on('console', (msg) => {
  if (msg.type() === 'error') {
    const loc = msg.location();
    errAll.push({ url: page.url(), text: msg.text().slice(0, 400), file: loc.url, line: loc.lineNumber });
  }
});
page.on('pageerror', (e) => errAll.push({ url: page.url(), text: 'PAGEERROR: ' + e.message.slice(0, 400), stack: e.stack?.slice(0, 400) }));

async function chup(id, ten, luong, note = '') {
  const p = path.join(OUT_DIR, 'anh', `${id}.png`);
  try {
    await page.waitForTimeout(400);
    await page.screenshot({ path: p, fullPage: false });
  } catch (e) {}
  buoc.push({ id, ten, luong, url: page.url(), note });
  console.log(`  ${id.padEnd(28)} ${ten}`);
}

async function login() {
  console.log('LOGIN');
  await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
  await chup('00-login-truoc', 'Login trước khi đăng nhập', 'auth');
  await page.fill('input[type="email"], input[name="identifier"], input[placeholder*="Email"], input[placeholder*="email"]', AUTH_EMAIL);
  await page.fill('input[type="password"]', AUTH_PW);
  const btn = await page.$('button[type="submit"], button:has-text("Đăng nhập")');
  if (btn) await btn.click();
  await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1500);
  console.log('  Login OK → ' + page.url().replace(BASE, ''));
}

async function luongShell() {
  console.log('\n▸ LUỒNG 1 · SHELL TỔNG THỂ');
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await chup('11-home', 'Home dashboard', 'shell');
  await page.goto(BASE + '/tasks', { waitUntil: 'networkidle' });
  await chup('12-tasks', 'Bảng việc', 'shell');
  await page.goto(BASE + '/files', { waitUntil: 'networkidle' });
  await chup('13-files', 'Files (hai tầng?)', 'shell');
  await page.goto(BASE + '/library/gallery', { waitUntil: 'networkidle' });
  await chup('14-library-gallery', 'Gallery ảnh', 'shell');
  await page.goto(BASE + '/settings', { waitUntil: 'networkidle' });
  await chup('15-settings', 'Cài đặt', 'shell');
  // Thử mở Library sheet
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.keyboard.press('l').catch(() => {});
  await chup('16-library-sheet', 'Library sheet (phím L)', 'shell');
}

async function moDuAn() {
  console.log('\n▸ Mở dự án đầu tiên');
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  // Click nút "Open project overview" hoặc card đầu tiên
  const opened = await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label*="Open project"], button[aria-label*="overview"], a[href^="/projects/"]');
    if (btn) { btn.click(); return true; }
    return false;
  });
  if (opened) await page.waitForTimeout(1500);
  const proj = page.url().match(/\/projects\/([^/?]+)/);
  const projId = proj ? proj[1] : null;
  console.log('  projId=' + projId);
  return projId;
}

async function luong2D(pid) {
  console.log('\n▸ LUỒNG 2 · 2D KỸ THUẬT');
  if (!pid) return;
  await page.goto(`${BASE}/projects/${pid}/overview`, { waitUntil: 'networkidle' });
  await chup('21-project-overview', 'Dự án · Tổng quan', '2d');
  await page.goto(`${BASE}/projects/${pid}/cad`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await chup('22-2d-empty', '2D · vào chặng', '2d');
  // Thử click nút vẽ tường (nếu có toolbar)
  await page.keyboard.press('w').catch(() => {});
  await page.waitForTimeout(400);
  await chup('23-2d-tuong-active', '2D · sau khi bấm W (tường)', '2d');
  // Chuyển mode
  await page.keyboard.press('Escape').catch(() => {});
  await chup('24-2d-esc', '2D · sau Escape', '2d');
}

async function luong3D(pid) {
  console.log('\n▸ LUỒNG 3 · 3D THIẾT KẾ');
  if (!pid) return;
  await page.goto(`${BASE}/projects/${pid}/render`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await chup('31-3d-vao', '3D · vào chặng', '3d');
  // Panel material?
  await page.keyboard.press('m').catch(() => {});
  await page.waitForTimeout(500);
  await chup('32-3d-material', '3D · sau bấm M (vật liệu)', '3d');
}

async function luongPresent(pid) {
  console.log('\n▸ LUỒNG 4 · TRÌNH BÀY');
  if (!pid) return;
  await page.goto(`${BASE}/projects/${pid}/present`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await chup('41-present-vao', 'Trình bày · vào chặng', 'present');
  await page.goto(`${BASE}/projects/${pid}/notebook`, { waitUntil: 'networkidle' });
  await chup('42-notebook', 'Notebook (bàn ý tưởng)', 'present');
  await page.goto(`${BASE}/projects/${pid}/photo`, { waitUntil: 'networkidle' });
  await chup('43-photo', 'Photo editor', 'present');
}

async function luongMotNguon() {
  console.log('\n▸ LUỒNG 5 · MỘT NGUỒN xuyên chặng (chưa có nút — đo empty state)');
  await page.goto(BASE + '/files', { waitUntil: 'networkidle' });
  await chup('51-files-detail', 'Files · nội dung', 'nguon');
  await page.goto(BASE + '/library/ingest', { waitUntil: 'networkidle' });
  await chup('52-ingest', 'Ingest (đường vào của thô)', 'nguon');
}

async function darkTheme() {
  console.log('\n▸ Dark theme lượt 2');
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await chup('61-home-dark', 'Home · dark', 'theme');
  await page.goto(BASE + '/files', { waitUntil: 'networkidle' });
  await chup('62-files-dark', 'Files · dark', 'theme');
}

// ---------- CHẠY ----------
await login();
await luongShell();
const pid = await moDuAn();
await luong2D(pid);
await luong3D(pid);
await luongPresent(pid);
await luongMotNguon();
await darkTheme();

await browser.close();

// Nhóm console error theo message
const errGroup = {};
for (const e of errAll) {
  const key = e.text.slice(0, 100);
  if (!errGroup[key]) errGroup[key] = { text: key, count: 0, urls: new Set(), file: e.file, line: e.line };
  errGroup[key].count++;
  errGroup[key].urls.add(e.url.replace(BASE, ''));
}
const errList = Object.values(errGroup).map((e) => ({ ...e, urls: [...e.urls] })).sort((a, b) => b.count - a.count);

fs.writeFileSync(path.join(OUT_DIR, 'ket-qua.json'), JSON.stringify({ buoc, errList, at: new Date().toISOString() }, null, 2));
console.log(`\nXong ${buoc.length} bước · ${errAll.length} console error → ${Object.keys(errGroup).length} nhóm.`);
console.log(`Ảnh: ${OUT_DIR}/anh · JSON: ${OUT_DIR}/ket-qua.json`);
