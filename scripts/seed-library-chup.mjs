#!/usr/bin/env node
/**
 * scripts/seed-library-chup.mjs — nghiệm thu Lane B TRÊN APP THẬT (không phải trên mã).
 * Mở Thư viện ở `http://localhost:3000`, chụp 2 khung vào `artifacts/visual-review/`:
 *   L1-ke-co-hang.png        — kệ "Cấu kiện (.idfc)" có hàng, thumbnail là .svg thật.
 *   L2-mot-vat-nhieu-mat.png — một món, cột thông số lộ CÁC MẶT + nguồn + độ tin cậy.
 * Dùng hồ sơ Playwright đã đăng nhập ở `~/.if-phien-chup-man` (không tự đăng nhập lại).
 */
import { chromium } from 'playwright';
import path from 'node:path';
import os from 'node:os';
import { mkdirSync } from 'node:fs';

const OUT = path.resolve('artifacts/visual-review');
mkdirSync(OUT, { recursive: true });

const ctx = await chromium.launchPersistentContext(path.join(os.homedir(), '.if-phien-chup-man'), {
  headless: true,
  viewport: { width: 1440, height: 900 },
});
const page = ctx.pages()[0] ?? (await ctx.newPage());

await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
// Dev server biên dịch trang lần đầu có thể mất nhiều chục giây — chờ tới khi vỏ app hiện,
// đừng chụp vào lúc còn vòng quay tải.
await page.waitForSelector('header, .if-appshell, [data-appshell], main', { timeout: 120000 }).catch(() => {});
await page.waitForTimeout(6000);

// Mở Thư viện bằng ĐÚNG cửa của app: bắn sự kiện `if:library-open` mà `useLibrarySheet`
// đang nghe (`lib/library/use-library-sheet.ts:19`). Ổn định hơn phím trần `L` — phím chỉ ăn
// khi tiêu điểm không nằm trong ô nhập, và trang chủ có sẵn ô tìm kiếm.
await page.evaluate(() => window.dispatchEvent(new CustomEvent('if:library-open', { detail: {} })));
await page.waitForSelector('.if-lib-root .lib[data-open="true"]', { timeout: 20000 }).catch(() => {});
await page.waitForTimeout(2000);

const root = page.locator('.if-lib-root .lib[data-open="true"]');
if ((await root.count()) === 0) {
  console.error('✘ Không mở được tấm Thư viện — chụp màn hiện tại để soi.');
  await page.screenshot({ path: path.join(OUT, 'L0-khong-mo-duoc.png') });
  await ctx.close();
  process.exit(1);
}

// Kệ "Cấu kiện (.idfc)" — bấm theo NHÃN thật trên cột kệ.
const ke = root.getByText('Cấu kiện (.idfc)', { exact: false }).first();
await ke.click({ timeout: 5000 }).catch(() => {});
await page.waitForTimeout(1500);

await page.screenshot({ path: path.join(OUT, 'L1-ke-co-hang.png') });
console.log('✔ L1-ke-co-hang.png');

// Chọn một CÁNH CỬA: đây là món lộ được cả mặt 2D lẫn mặt 3D dưới CÙNG một danh tính —
// hình 2D parse từ .dxf thật, cao đùn lấy từ `OPENING_STANDARD_HEIGHT_MM` (lib/cad/hatch.ts).
// Món khác (sofa, bàn) repo KHÔNG có số cao thật nên cố ý không có mặt 3D — không bịa.
const oTim = root.locator('input[type="search"], input').first();
const setValue = (el, v) => {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  setter.call(el, v);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
};
await oTim.evaluate(setValue, 'Cửa');
await page.waitForTimeout(1200);

const mon = root.locator('.grid button.it').first();
await mon.click({ timeout: 5000 });
await page.waitForTimeout(900);
const nutVerify = root.locator('.ppverify').first();
if (await nutVerify.count()) await nutVerify.click().catch(() => {});
await page.waitForTimeout(1200);
await page.screenshot({ path: path.join(OUT, 'L2-mot-vat-nhieu-mat.png') });
console.log('✔ L2-mot-vat-nhieu-mat.png');

// Đọc lại bằng CHỮ trên màn — ảnh có thể lừa mắt, chữ thì đếm được.
// (`.spcap` viết hoa bằng CSS nên innerText trả về chữ HOA — so bằng chữ hoa.)
const text = (await root.innerText()).toUpperCase();
const mat = await root.locator('.spmatchip').allInnerTexts();
console.log('--- có mục "CÁC MẶT CỦA MÓN NÀY":', text.includes('CÁC MẶT CỦA MÓN NÀY'));
console.log('--- các mặt món đang chọn:', JSON.stringify(mat));
console.log('--- có dòng "Độ tin cậy":', text.includes('ĐỘ TIN CẬY'));
console.log('--- có dòng "Nguồn":', text.includes('NGUỒN'));

await ctx.close();
