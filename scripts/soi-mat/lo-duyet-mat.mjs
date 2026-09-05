/* LÔ DUYỆT MẮT — chụp đúng những mặt mà 30 mục "cần mắt Hoà" đang sống trên đó.
 * Khác lượt chụp trước: TẠO DỰ ÁN rồi mới đi, vì 11/30 mục nằm ở ba chặng 2D/3D/Trình bày
 * mà không có dự án thì không vào được.
 * Tên tệp mang MÃ MỤC trong sổ frontier ⇒ Hoà phán "ok/lệch" là ánh xạ thẳng về sổ, không phải
 * dịch qua một lớp mô tả nào. */
import { chromium } from 'playwright';
import fs from 'node:fs';
const OUT = process.env.OUT || '/tmp/lo-duyet-mat';
fs.mkdirSync(OUT, { recursive: true });
const BASE = 'http://localhost:3210';

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => { try { localStorage.setItem('if_intro_seen_v1', '1'); } catch {} });
const p = await ctx.newPage();
const loi = [];
p.on('pageerror', (e) => loi.push(String(e.message).slice(0, 120)));

const email = `lo.mat.${Date.now()}@if.test`, mk = 'MatThuong#2026';
await p.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(2500);
await p.locator('button:has-text("Đăng ký")').first().click().catch(() => {});
await p.waitForTimeout(600);
const t = p.locator('input[placeholder*="Tên"]').first(); if (await t.count()) await t.fill('Lô Duyệt');
const i = p.locator('input[placeholder*="Email"]').first(); if (await i.count()) await i.fill(email);
const pw = p.locator('input[type=password]'); for (let k = 0; k < await pw.count(); k++) await pw.nth(k).fill(mk);
await p.locator('button[type=submit]').first().click().catch(() => {});
await p.waitForTimeout(7000);
console.log('đăng ký xong →', p.url());

// ── TẠO DỰ ÁN (không có dự án thì ba chặng đều khoá) ──
await p.locator('button:has-text("Tạo dự án mới")').first().click().catch(() => {});
await p.waitForTimeout(2500);
/* 🔴 BẪY: ô `input` ĐẦU TRANG là ô TÌM KIẾM trên thanh trên, không phải ô trong hộp thoại.
 * Lượt đầu tôi điền vào đó rồi tưởng app hỏng. Phải khoanh vùng trong [role=dialog]. */
/* 🔴 BẪY THỨ HAI: trang có HAI [role=dialog]; `.last()` lấy trúng cái KHÔNG chứa nút.
 * Chọn theo NỘI DUNG (hộp nào có nút "Tạo dự án") chứ không theo thứ tự. */
const hop = p.locator('[role=dialog],[aria-modal=true]').filter({ has: p.locator('button:has-text("Tạo dự án")') }).first();
await hop.locator('input[placeholder="Dự án mới"]').first().fill('Căn hộ Thảo Điền').catch(() => {});
await hop.locator('input[placeholder="120"]').first().fill('78').catch(() => {});
// khung việc: tick một mẫu để dự án có việc, đúng đường người dùng thật đi
await hop.locator('text=Concept dự án').first().click().catch(() => {});
await p.waitForTimeout(400);
// nút gửi nằm dưới đáy hộp thoại — cuộn hộp thoại xuống rồi mới tìm
await hop.evaluate((el) => { el.scrollTop = el.scrollHeight; }).catch(() => {});
await p.waitForTimeout(500);
await p.screenshot({ path: `${OUT}/00a-hop-thoai-tao-du-an.png` });
let daTao = false;
for (const nhan of ['Tạo dự án', 'Tạo', 'Bắt đầu', 'Xong', 'Lưu']) {
  const n = hop.locator(`button:has-text("${nhan}")`).last();
  if (await n.count()) { await n.click().catch(() => {}); await p.waitForTimeout(3500); daTao = true; break; }
}
console.log('đã bấm nút tạo:', daTao);
console.log('sau tạo dự án →', p.url());
await p.screenshot({ path: `${OUT}/00-sau-tao-du-an.png` });

const MAN = [
  ['01-home',        '/',                 'thẻ Resume · nền theo giờ · presence-avatar-row · project-init-board'],
  ['02-2d',          null,                'pie-menu-2d · toolbar-mot-khuon · panel-handle-chung'],
  ['03-3d',          null,                'dock-3d-that · tool-state-3d · hinh-hoc-v2 · render-queue-live · ghe-3d-window-app'],
  ['04-trinh-bay',   null,                'h4-picker · material-a3 · present-magic-cua-vao · present-task-first'],
  ['05-vat-lieu',    '/materials',        'vat-lieu-mot-vat · material-impact-ui · boq-specid-namespace'],
  ['06-thu-vien',    '/library',          'panel-handle-chung · o-giai-nghia-co-hinh'],
  ['07-gallery',     '/library/gallery',  'gallery-lien-nganh'],
  ['08-viec',        '/tasks',            'tao-viec-tu-day · focus-entity-doc'],
  ['09-files',       '/files',            'hai tầng Files · panel-handle-chung'],
  ['10-cai-dat',     '/settings',         'mat-do-con-tro · hinh-hoc-ap-thang · vùng cuộn có vệt mờ'],
];
const RAIL = { '02-2d': 'Thiết kế 2D', '03-3d': 'Thiết kế 3D', '04-trinh-bay': 'Trình chiếu' };
const bang = [];
for (const [ten, path, phu] of MAN) {
  loi.length = 0;
  try {
    if (path) { await p.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 45000 }); }
    else {
      await p.locator(`text="${RAIL[ten]}"`).first().click({ timeout: 8000 }).catch(() => {});
    }
    await p.waitForTimeout(4000);
  } catch (e) { bang.push({ ten, loi: 'ĐI KHÔNG TỚI: ' + e.message.slice(0, 60) }); continue; }
  await p.screenshot({ path: `${OUT}/${ten}.png` });
  const d = await p.evaluate(() => ({ url: location.pathname, chu: document.body.innerText.trim().length,
    nut: document.querySelectorAll('button,a[href]').length }));
  bang.push({ ten, phu, ...d, loi: loi.slice(0, 1) });
  console.log(`${ten.padEnd(14)} ${d.url.padEnd(34)} chữ=${String(d.chu).padEnd(5)} nút=${String(d.nut).padEnd(4)} lỗi=${loi.length}`);
}
fs.writeFileSync(`${OUT}/do.json`, JSON.stringify(bang, null, 2));
await b.close();
