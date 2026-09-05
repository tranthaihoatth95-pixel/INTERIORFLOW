/* CHỤP TOÀN BỘ MÀN — mọi route có `page.tsx`, trên app THẬT, đã đăng nhập, có 1 dự án thật.
 * Khác `lo-duyet-mat.mjs` (10 màn cho lô duyệt): bản này quét HẾT, để Hoà nhìn một lượt.
 *
 * 🔴 BA BẪY ĐÃ TRẢ GIÁ, giữ nguyên cách chặn:
 *  ① cổng gõ cứng ⇒ chụp nhầm server của làn khác ⇒ trình MỘT BẢN CODE KHÁC. Nhận qua CONG.
 *  ② chụp sớm ⇒ ảnh trắng có vòng quay ⇒ Hoà đọc thành "màn trống". Chờ tới khi trang thôi quay.
 *  ③ đi trật route mà `.catch()` nuốt lỗi ⇒ N ảnh Home dán N nhãn khác nhau ⇒ bộ ảnh NÓI DỐI.
 *     Sau mỗi lần đi, KIỂM url; trật thì ghi ĐỎ vào bảng, không âm thầm chụp.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';

const OUT = process.env.OUT || '/tmp/toan-man';
const CONG = process.env.CONG || '3277';
const BASE = `http://localhost:${CONG}`;
fs.mkdirSync(OUT, { recursive: true });

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => { try { localStorage.setItem('if_intro_seen_v1', '1'); } catch {} });
const p = await ctx.newPage();
const loi = [];
p.on('pageerror', (e) => loi.push(String(e.message).slice(0, 110)));

// ── đăng ký ──
const email = `toan.man.${Date.now()}@if.test`, mk = 'MatThuong#2026';
await p.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 90000 });
await p.waitForTimeout(3000);
await p.locator('button:has-text("Đăng ký")').first().click().catch(() => {});
await p.waitForTimeout(700);
const t = p.locator('input[placeholder*="Tên"]').first(); if (await t.count()) await t.fill('Toàn Màn');
const i = p.locator('input[placeholder*="Email"]').first(); if (await i.count()) await i.fill(email);
const pw = p.locator('input[type=password]'); for (let k = 0; k < await pw.count(); k++) await pw.nth(k).fill(mk);
await p.locator('button[type=submit]').first().click().catch(() => {});
await p.waitForTimeout(8000);

// ── tạo dự án: không có dự án thì 6 màn cấp dự án chụp trúng Home ──
await p.locator('button:has-text("Tạo dự án mới")').first().click().catch(() => {});
await p.waitForTimeout(2500);
const hop = p.locator('[role=dialog],[aria-modal=true]')
  .filter({ has: p.locator('button:has-text("Tạo dự án")') }).first();
await hop.locator('input[placeholder="Dự án mới"]').first().fill('Căn hộ Thảo Điền').catch(() => {});
await hop.locator('input[placeholder="120"]').first().fill('78').catch(() => {});
const nutTao = p.getByRole('button', { name: 'Tạo dự án', exact: true }).first();
await nutTao.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
await nutTao.click({ timeout: 15000 }).catch(() => {});
await p.waitForTimeout(4000);

// Khẳng định theo THẾ GIỚI (dự án có thật trong CSDL), không theo tàn dư giao diện:
// tấm Thư viện luôn nằm trong DOM với visibility:hidden nên đếm hộp thoại không bao giờ về 0.
const soDuAn = await p.evaluate(() => fetch('/api/flows').then((r) => r.json())
  .then((j) => (Array.isArray(j) ? j.length : (j.flows || []).length)).catch(() => -1));
if (!(soDuAn > 0)) { console.log('⛔ DỪNG — không tạo được dự án, 6 màn cấp dự án sẽ chụp trúng Home.'); process.exitCode = 1; await b.close(); }

// id lấy từ API chứ không từ URL: sau khi tạo, app khi thì nhảy /render, khi thì ở lại `/`.
const id = await p.evaluate(() => fetch('/api/flows').then((r) => r.json())
  .then((j) => { const ds = Array.isArray(j) ? j : (j.flows || []); const x = ds[0] || {};
    return x.projectId || x.project?.id || x.id || ''; }).catch(() => ''));

const MAN = [
  ['01-home', '/'],
  ['02-du-an', '/projects'],
  ['03-2d', `/projects/${id}/cad`],
  ['04-3d', `/projects/${id}/render`],
  ['05-trinh-chieu', `/projects/${id}/present`],
  ['06-tong-quan-du-an', `/projects/${id}/overview`],
  ['07-so-tay', `/projects/${id}/notebook`],
  ['08-anh-du-an', `/projects/${id}/photo`],
  ['09-vat-lieu', '/materials'],
  ['10-mau', '/colors'],
  ['11-thu-vien', '/library'],
  ['12-gallery', '/library/gallery'],
  ['13-nhap-tai-san', '/library/ingest'],
  ['14-kho-tri-thuc', '/library/knowledge'],
  ['15-cam-hung', '/inspiration'],
  ['16-files', '/files'],
  ['17-viec', '/tasks'],
  ['18-cai-dat', '/settings'],
  ['19-cai-dat-avatar', '/settings/avatar'],
  ['20-cai-dat-gioi-thieu', '/settings/about'],
  ['21-cai-dat-giay-phep', '/settings/licenses'],
  ['22-workhub', '/workhub'],
  ['23-soan-2d-doc-lap', '/cad-editor'],
  ['24-soan-trinh-chieu', '/present-editor'],
  ['25-soan-anh', '/photo-editor'],
];

const bang = [];
for (const [ten, duong] of MAN) {
  loi.length = 0;
  try {
    await p.goto(BASE + duong, { waitUntil: 'domcontentloaded', timeout: 60000 });
    /* 🔴 BẪY ② — BẢN VÁ 05/09. Điều kiện cũ `chu > 60` ĐỦ NGAY khi vỏ app hiện ra (rail +
     * thanh trên đã ~580 ký tự), trong khi RUỘT màn còn đang tải ⇒ chụp trúng vòng quay.
     * Ca thật: `/materials` chụp ra ảnh spinner, suýt bị đọc thành "kho vật liệu hỏng";
     * đo lại với 20 giây thì màn tải đủ 3 hàng, 0 lỗi — hỏng là ở THƯỚC, không ở app.
     * ⇒ Chờ tới khi lượng chữ ĐỨNG YÊN hai lần liên tiếp, và không còn phần tử quay. */
    let truoc = -1, yen = 0;
    for (let k = 0; k < 20; k++) {
      const s = await p.evaluate(() => ({
        chu: document.body.innerText.trim().length,
        quay: !!document.querySelector('[class*=animate-spin],[class*=spinner],[aria-busy=true]'),
      }));
      if (s.chu > 60 && s.chu === truoc && !s.quay) { if (++yen >= 2) break; } else yen = 0;
      truoc = s.chu;
      await p.waitForTimeout(1500);
    }
    await p.waitForTimeout(1200);
    const toi = await p.evaluate(() => location.pathname);
    if (toi !== duong) {                              // kiểm đi đúng chỗ (bẫy ③)
      bang.push({ ten, duong, loi: `ĐI TRẬT → ${toi}` });
      console.log(`${ten.padEnd(24)} ⛔ ĐI TRẬT → ${toi}`);
      continue;
    }
  } catch (e) {
    bang.push({ ten, duong, loi: 'ĐI KHÔNG TỚI: ' + e.message.slice(0, 70) });
    console.log(`${ten.padEnd(24)} ⛔ ${e.message.slice(0, 60)}`);
    continue;
  }
  await p.screenshot({ path: `${OUT}/${ten}.png` });
  const d = await p.evaluate(() => ({
    chu: document.body.innerText.trim().length,
    nut: document.querySelectorAll('button,a[href]').length,
    anh: document.querySelectorAll('img,canvas,svg').length,
  }));
  bang.push({ ten, duong, ...d, loi: loi.slice(0, 1) });
  console.log(`${ten.padEnd(24)} chữ=${String(d.chu).padEnd(6)} nút=${String(d.nut).padEnd(4)} hình=${String(d.anh).padEnd(4)} lỗi=${loi.length}`);
}

fs.writeFileSync(`${OUT}/do.json`, JSON.stringify({ id, soDuAn, man: bang }, null, 2));
console.log(`\nXong ${bang.filter((x) => !x.loi || Array.isArray(x.loi)).length}/${MAN.length} màn → ${OUT}`);
await b.close();
