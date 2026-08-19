/**
 * scripts/audit-routes.mjs — chụp 25 route + đo lệch cơ bản cho audit 18/08.
 * Chạy: node scripts/audit-routes.mjs
 * Yêu cầu: dev server sống ở localhost:3000.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'http://localhost:3000';
const OUT_DIR = 'docs/audit-2026-08-18/anh';

// Dự án thật có sẵn từ đo trước
const PROJECT_ID = 'cmsl4b5ux0001w9jlrgo2q41t'; // "Nháp"

const ROUTES = [
  { id: '00-home', url: '/', ten: 'Home dashboard', cum: 'app' },
  { id: '01-tasks', url: '/tasks', ten: 'Bảng việc', cum: 'app' },
  { id: '02-files', url: '/files', ten: 'Files', cum: 'app' },
  { id: '03-library', url: '/library', ten: 'Thư viện', cum: 'app' },
  { id: '04-library-gallery', url: '/library/gallery', ten: 'Gallery ảnh', cum: 'app' },
  { id: '05-library-ingest', url: '/library/ingest', ten: 'Nhập vào thư viện', cum: 'app' },
  { id: '06-materials', url: '/materials', ten: 'Vật liệu (kệ ngoài)', cum: 'app' },
  { id: '07-colors', url: '/colors', ten: 'Bảng màu (kệ ngoài)', cum: 'app' },
  { id: '08-workhub', url: '/workhub', ten: 'WorkHub (Chat)', cum: 'app' },
  { id: '09-settings', url: '/settings', ten: 'Cài đặt', cum: 'app' },
  { id: '10-settings-about', url: '/settings/about', ten: 'Cài đặt · Giới thiệu', cum: 'app' },
  { id: '11-settings-avatar', url: '/settings/avatar', ten: 'Cài đặt · Avatar', cum: 'app' },
  { id: '12-settings-licenses', url: '/settings/licenses', ten: 'Cài đặt · Giấy phép', cum: 'app' },
  { id: '13-project-overview', url: `/projects/${PROJECT_ID}/overview`, ten: 'Dự án · Tổng quan', cum: 'du-an' },
  { id: '14-project-notebook', url: `/projects/${PROJECT_ID}/notebook`, ten: 'Dự án · Notebook', cum: 'du-an' },
  { id: '15-project-cad', url: `/projects/${PROJECT_ID}/cad`, ten: 'Dự án · 2D Kỹ thuật', cum: 'du-an' },
  { id: '16-project-render', url: `/projects/${PROJECT_ID}/render`, ten: 'Dự án · 3D Thiết kế', cum: 'du-an' },
  { id: '17-project-present', url: `/projects/${PROJECT_ID}/present`, ten: 'Dự án · Trình bày', cum: 'du-an' },
  { id: '18-project-photo', url: `/projects/${PROJECT_ID}/photo`, ten: 'Dự án · Photo editor', cum: 'du-an' },
  { id: '19-cad-editor', url: '/cad-editor', ten: 'CAD editor (đường tắt cũ)', cum: 'legacy' },
  { id: '20-present-editor', url: '/present-editor', ten: 'Present editor (đường tắt cũ)', cum: 'legacy' },
  { id: '21-photo-editor', url: '/photo-editor', ten: 'Photo editor (đường tắt cũ)', cum: 'legacy' },
  { id: '22-dev-bench-3d-2', url: '/dev-bench-3d-2', ten: 'Dev bench 3D', cum: 'dev' },
  { id: '23-intro', url: '/intro', ten: 'Intro / đón khách', cum: 'auth' },
  { id: '24-login', url: '/login', ten: 'Login', cum: 'auth' },
];

fs.mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});

const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push({ where: page.url(), msg: e.message }));

const results = [];

for (const r of ROUTES) {
  const started = Date.now();
  const url = BASE + r.url;
  let redirect = null, title = null, consoleErrors = 0, ok = true, note = '';
  const localErrs = [];
  const onConsoleErr = (msg) => { if (msg.type() === 'error') { consoleErrors++; localErrs.push(msg.text().slice(0, 200)); } };
  page.on('console', onConsoleErr);
  try {
    const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(600);
    const finalUrl = page.url();
    if (finalUrl.replace(BASE, '') !== r.url) redirect = finalUrl.replace(BASE, '');
    title = await page.title();
    const status = resp?.status();
    if (status && status >= 400) { ok = false; note = `HTTP ${status}`; }
    await page.screenshot({ path: path.join(OUT_DIR, `${r.id}.png`), fullPage: false });
  } catch (e) {
    ok = false;
    note = 'TIMEOUT/ERROR: ' + e.message.slice(0, 150);
  }
  page.off('console', onConsoleErr);
  results.push({ ...r, redirect, title, consoleErrors, ok, note, ms: Date.now() - started, errs: localErrs.slice(0, 3) });
  console.log(`${r.id.padEnd(24)} ${ok ? '✓' : '✗'} ${redirect ? `→ ${redirect}` : ''} ${consoleErrors ? `[${consoleErrors} err]` : ''} ${Date.now() - started}ms`);
}

await browser.close();

fs.writeFileSync('docs/audit-2026-08-18/ket-qua.json', JSON.stringify({ results, pageErrors: errors, at: new Date().toISOString() }, null, 2));
console.log(`\nXong ${results.length} route. Ảnh ở ${OUT_DIR}/, JSON ở docs/audit-2026-08-18/ket-qua.json`);
