/**
 * Chụp Home hai theme để soi dải nền BẰNG MẮT sau khi nâng neo độ sáng — và đo TẠI CHỖ
 * màu thật của dải trên màn (không chỉ tin số tính từ `bangMau()`).
 *
 * Đây là chỗ phép tính có thể lệch thực tế: `bangMau()` cho màu NGUỒN, còn thứ mắt thấy còn
 * đi qua lớp phủ / độ mờ / chế độ hoà trộn khi vẽ. Số dưới đây là số ĐO TRÊN MÀN.
 *
 * Chạy: node scripts/nghiem-thu-ban-lam-viec/chup-home-nen.mjs
 */
import { chromium } from '/home/user/INTERIORFLOW/node_modules/playwright/index.mjs';
import { mkdirSync } from 'fs';

const GOC = process.env.IF_URL ?? 'http://localhost:3094';
const CHROME = process.env.IF_CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const OUT = process.env.IF_OUT ?? 'docs/delivery/anh-duyet-mat/nut-noi-doi';
mkdirSync(OUT, { recursive: true });

const b = await chromium.launch({ executablePath: CHROME });
const ctx = await b.newContext({ viewport: { width: 1600, height: 900 } });
{
  const p = await ctx.newPage();
  const r = await p.request.post(`${GOC}/api/auth/login`, {
    data: { identifier: 'kiem@localhost.test', password: 'matkhau123' },
  });
  console.log('login', r.status());
  const me = await (await p.request.get(`${GOC}/api/auth/me`)).json();
  await p.goto(GOC);
  await p.evaluate((id) => { try { localStorage.setItem(`interiorflow.tourDone.${id}`, '1'); } catch {} }, me?.user?.id ?? '');
  await p.close();
}
const page = await ctx.newPage();

for (const theme of ['light', 'dark']) {
  await page.goto(GOC, { waitUntil: 'networkidle' });
  await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme);
  await page.waitForTimeout(2200);

  const r = await page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    const bg = cs.getPropertyValue('--bg').trim();
    // dải nền: lấy phần tử wallpaper nếu có, đọc màu nền hiệu dụng ở vài điểm
    const w = document.querySelector('[data-wallpaper], canvas');
    const hop = w ? w.getBoundingClientRect() : null;
    return {
      bg,
      coNen: !!w,
      hopNen: hop ? { x: Math.round(hop.x), y: Math.round(hop.y), w: Math.round(hop.width), h: Math.round(hop.height) } : null,
      bodyBg: getComputedStyle(document.body).backgroundColor,
    };
  });
  console.log(`[${theme}]`, JSON.stringify(r));
  await page.screenshot({ path: `${OUT}/home-nen-${theme}.png` });
}

await b.close();
