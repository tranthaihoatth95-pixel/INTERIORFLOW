/**
 * scripts/nghiem-thu-ban-lam-viec/luong-trinh-chieu.mjs
 * ĐI TRỌN MỘT LUỒNG NGHỀ CỦA CHẶNG TRÌNH CHIẾU TRÊN APP THẬT (không audit từng màn rời).
 *
 *   mở Trình chiếu → chọn loại hồ sơ → dàn trang → thêm chữ → tìm đường xuất
 *   → ĐÓNG HẲN trình duyệt → mở lại → còn nguyên không?
 *
 * Cùng khuôn `luong-nghe.mjs` (login qua API, tắt tour, đếm thứ bấm được, chụp mỗi trạm).
 * Ảnh ra `docs/ship/anh/` — KHÔNG để ở thư mục bị gitignore (luật §11.12 zero-loss).
 * Dự án test phải là FIXTURE TỔNG HỢP · ẨN DANH · TRUNG TÍNH — không mượn tên studio/khách thật.
 *
 * Chạy:  IF_URL=http://localhost:3000 PID=<projectId> node scripts/nghiem-thu-ban-lam-viec/luong-trinh-chieu.mjs
 */
import { chromium } from '/home/user/INTERIORFLOW/node_modules/playwright/index.mjs';
import { mkdirSync, writeFileSync } from 'fs';

const GOC = process.env.IF_URL ?? 'http://localhost:3000';
const PID = process.env.PID;
if (!PID) throw new Error('Thiếu PID=<projectId>');
const RA = 'docs/ship/anh';
mkdirSync(RA, { recursive: true });

// Playwright của repo đòi build 1234, máy có 1194 ⇒ launch() trần THẤT BẠI. Trỏ tường minh.
const b = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});

const nhatKy = [];
const ghi = (o) => { nhatKy.push(o); console.log(JSON.stringify(o)); };

async function moPhien() {
  const ctx = await b.newContext({ viewport: { width: 1600, height: 900 }, acceptDownloads: true });
  const p0 = await ctx.newPage();
  const r = await p0.request.post(`${GOC}/api/auth/login`, { data: { identifier: 'kiem@localhost.test', password: 'matkhau123' } });
  if (!r.ok()) throw new Error('login ' + r.status());
  const me = await (await p0.request.get(`${GOC}/api/auth/me`)).json();
  await p0.goto(GOC);
  await p0.evaluate((id) => { try { localStorage.setItem(`interiorflow.tourDone.${id}`, '1'); } catch {} }, me?.user?.id ?? '');
  await p0.close();
  const page = await ctx.newPage();
  const loi = [];
  page.on('console', (m) => { if (m.type() === 'error') loi.push(m.text().slice(0, 200)); });
  page.on('pageerror', (e) => loi.push('PAGEERROR ' + String(e).slice(0, 200)));
  page.on('response', (r) => { if (!r.ok() && /\/api\//.test(r.url())) loi.push(`HTTP ${r.status()} ${r.request().method()} ${r.url().replace(GOC, '')}`); });
  return { ctx, page, loi };
}

const damBam = (page) => page.evaluate(() => {
  const els = [...document.querySelectorAll('button,[role="button"],a[href],input,select')];
  const hien = els.filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; });
  const ten = (e) => (e.getAttribute('aria-label') || e.textContent || e.getAttribute('title') || e.tagName).trim().replace(/\s+/g, ' ').slice(0, 34);
  return { tong: hien.length, moVoHieu: hien.filter((e) => e.getAttribute('aria-disabled') === 'true' || e.hasAttribute('disabled')).length,
           nhan: [...new Set(hien.map(ten))].slice(0, 80) };
});

/** §11.6 — mật độ nghề: đo bề rộng panel, cỡ chữ lớn nhất, tỉ lệ khoảng trống. */
const doMatDo = (page) => page.evaluate(() => {
  const r = (e) => { const b = e.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }; };
  const chuTo = [...document.querySelectorAll('h1,h2,h3,div,span,p')]
    .filter((e) => e.getBoundingClientRect().width > 0 && e.textContent.trim().length > 2 && e.children.length === 0)
    .map((e) => ({ t: e.textContent.trim().slice(0, 30), px: Math.round(parseFloat(getComputedStyle(e).fontSize)) }))
    .sort((a, b) => b.px - a.px).slice(0, 6);
  const aside = [...document.querySelectorAll('aside,[class*="panel"],[class*="Panel"],[class*="inspector"]')]
    .filter((e) => { const b = e.getBoundingClientRect(); return b.width > 80 && b.height > 200; })
    .map((e) => ({ tag: e.tagName + '.' + String(e.className).slice(0, 26), ...r(e) })).slice(0, 6);
  return { chuTo, panel: aside, man: { w: innerWidth, h: innerHeight } };
});

// ═══════════ PHIÊN 1 ═══════════
let { ctx, page, loi } = await moPhien();
await page.goto(`${GOC}/projects/${PID}/present`, { waitUntil: 'networkidle' });
await page.waitForTimeout(5000);
await page.screenshot({ path: `${RA}/tc-01-cua-vao.png` });
ghi({ tram: '01 cửa vào Trình chiếu', ...(await damBam(page)) });
ghi({ tram: '01b mật độ cửa vào', ...(await doMatDo(page)) });

// ── vào trình dàn trang
const batDau = page.getByRole('button', { name: /Bắt đầu trình bày/ });
ghi({ tram: '02 nút Bắt đầu trình bày', so: await batDau.count() });
if (await batDau.count()) {
  await batDau.first().click({ force: true });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: `${RA}/tc-02-trinh-dan-trang.png` });
  ghi({ tram: '03 trong trình dàn trang', ...(await damBam(page)) });
  ghi({ tram: '03b mật độ trình dàn trang', ...(await doMatDo(page)) });
}

// ── thêm chữ (thao tác nghề lặp nhiều nhất)
for (const ten of [/^Chữ$/, /Thêm chữ/, /^Text$/]) {
  const n = page.getByRole('button', { name: ten });
  if (await n.count()) { await n.first().click({ force: true }); await page.waitForTimeout(2000); break; }
}
await page.screenshot({ path: `${RA}/tc-03-sau-them-chu.png` });
ghi({ tram: '04 sau khi thêm chữ', ...(await page.evaluate(() => ({
  phanTu: document.querySelectorAll('[data-el-id],[data-element-id],[data-elid]').length,
  vanBan: document.body.innerText.replace(/\s+/g, ' ').length,
}))) });

// ── đường xuất nào thấy được
ghi({ tram: '05 đường xuất/lưu thấy được', nhan: await page.evaluate(() => [...new Set([...document.querySelectorAll('button,[role="button"]')]
  .filter((e) => e.getBoundingClientRect().width > 0)
  .map((e) => (e.getAttribute('aria-label') || e.textContent || '').trim().replace(/\s+/g, ' '))
  .filter((t) => /xuất|export|pdf|pptx|lưu|save|gói|in ấn|^In$/i.test(t)))].slice(0, 25)) });

// ── mở menu ⋯ / Tệp để tìm đường xuất bị giấu
for (const ten of [/^Tệp$/, /^File$/, /^⋯$/, /Thêm/]) {
  const n = page.getByRole('button', { name: ten });
  if (await n.count()) { await n.first().click({ force: true }); await page.waitForTimeout(1200); break; }
}
await page.screenshot({ path: `${RA}/tc-04-menu-tep.png` });
ghi({ tram: '06 sau khi mở menu Tệp', nhan: await page.evaluate(() => [...new Set([...document.querySelectorAll('button,[role="button"],[role="menuitem"]')]
  .filter((e) => e.getBoundingClientRect().width > 0)
  .map((e) => (e.getAttribute('aria-label') || e.textContent || '').trim().replace(/\s+/g, ' '))
  .filter((t) => /xuất|export|pdf|pptx|gói|lưu/i.test(t)))].slice(0, 25)) });

ghi({ tram: '07 lỗi phiên 1', so: loi.length, loi: loi.slice(0, 10) });

// ═══════════ ĐÓNG HẲN, MỞ LẠI ═══════════
await ctx.close();
({ ctx, page, loi } = await moPhien());
await page.goto(`${GOC}/projects/${PID}/present`, { waitUntil: 'networkidle' });
await page.waitForTimeout(6000);
await page.screenshot({ path: `${RA}/tc-05-mo-lai.png` });
ghi({ tram: '08 MỞ LẠI sau khi đóng hẳn',
  conThayCuaVao: await page.getByRole('button', { name: /Bắt đầu trình bày/ }).count(),
  soSlideHienThi: await page.evaluate(() => (document.body.innerText.match(/(\d+)\s*slide/) || [])[1] ?? null),
  ...(await damBam(page)) });
ghi({ tram: '09 lỗi phiên 2', so: loi.length, loi: loi.slice(0, 10) });

writeFileSync(`${RA}/tc-nhat-ky.json`, JSON.stringify(nhatKy, null, 1));
await b.close();
console.log('\nẢnh + nhật ký ở', RA);
