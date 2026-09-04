/**
 * KIỂM WORKHUB SAU KHI GỠ MẶT TRỢ LÝ — hai câu, đo trên app thật:
 *   ① mặt AI đã biến mất hẳn chưa (không còn ô nhập "Bạn muốn làm gì?", không còn khẳng định
 *      "đang dùng ngữ cảnh từ …", không còn công tắc "Dùng ngữ cảnh cửa sổ")
 *   ② phần WorkHub thật sự làm được có còn nguyên không (rail · chia ngăn · thanh địa chỉ · dock)
 *
 * Chạy: node scripts/nghiem-thu-ban-lam-viec/kiem-workhub.mjs
 */
import { chromium } from '/home/user/INTERIORFLOW/node_modules/playwright/index.mjs';
import { mkdirSync } from 'fs';

const GOC = process.env.IF_URL ?? 'http://localhost:3094';
const CHROME = process.env.IF_CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const OUT = process.env.IF_OUT ?? 'docs/delivery/anh-duyet-mat/nut-noi-doi';
mkdirSync(OUT, { recursive: true });

const b = await chromium.launch({ executablePath: CHROME });
const ctx = await b.newContext({ viewport: { width: 1600, height: 900 } });
const page = await ctx.newPage();
const loi = [];
page.on('pageerror', (e) => loi.push(String(e).slice(0, 120)));

for (const theme of ['light', 'dark']) {
  await page.goto(`${GOC}/workhub?theme=${theme}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1800);

  const r = await page.evaluate(() => {
    const chu = document.body.innerText;
    const co = (s) => chu.includes(s);
    return {
      /* ① dấu vết mặt AI — phải TRỐNG hết */
      aiConSot: {
        'Trợ lý công việc': co('Trợ lý công việc'),
        'ChatGPT': co('ChatGPT'),
        'Dùng ngữ cảnh cửa sổ': co('Dùng ngữ cảnh cửa sổ'),
        'đang dùng ngữ cảnh': /đang dùng ngữ cảnh/i.test(chu),
        'Tạo cùng trợ lý': co('Tạo cùng trợ lý'),
        'ô nhập Bạn muốn làm gì': !!document.querySelector('textarea[placeholder*="Bạn muốn"]'),
        'nút Gửi': !!document.querySelector('[aria-label="Gửi"]'),
      },
      /* ② phần thật sự làm được — phải CÒN đủ */
      conNguyen: {
        'rail đổi dịch vụ': document.querySelectorAll('[aria-label^="Mở "]').length,
        'ô địa chỉ': document.querySelectorAll('[aria-label="Địa chỉ trang web"]').length,
        'nút chia ngăn': document.querySelectorAll('[aria-label$="cửa sổ"]').length,
        'chọn dịch vụ mỗi ngăn': document.querySelectorAll('[aria-label^="Dịch vụ cửa sổ"]').length,
        'dock tạo tệp': /Tạo tệp mới/.test(chu),
      },
    };
  });

  const sot = Object.entries(r.aiConSot).filter(([, v]) => v === true).map(([k]) => k);
  console.log(`\n[${theme}] mặt AI còn sót: ${sot.length ? '🔴 ' + sot.join(' · ') : '✅ không còn dấu vết nào'}`);
  console.log(`[${theme}] phần giữ lại:`, JSON.stringify(r.conNguyen));
  await page.screenshot({ path: `${OUT}/workhub-${theme}.png` });
}

console.log(`\nlỗi trang: ${loi.length ? loi.join(' | ') : '0'}`);
await b.close();
