/**
 * scripts/chup-mock.mjs — CHỤP BẢN VẼ (mock HTML) Ở KHỔ THẬT, CẢ HAI NỀN.
 *
 * VÌ SAO CÓ: luật thiết kế của dự án bắt bản vẽ phải đủ **hai theme** và phải soi ở **khổ thật**
 * (không phải ảnh thu nhỏ). Trước tệp này, việc đó làm bằng tay từng lượt — và việc làm tay lặp
 * lại thì sớm muộn bị bỏ, rồi bản vẽ chỉ-sáng lại lọt qua như ca `/settings` tối hỏng.
 *
 * KHÁC `chup-man-duyet-mat.mjs`: tệp kia chụp **APP THẬT** (cần máy chủ + đăng nhập). Tệp này
 * chụp **TỆP HTML TĨNH** — không máy chủ, không tài khoản, không CSDL. Hai việc khác nhau, cố ý
 * không gộp: gộp lại thì mỗi lần muốn soi một bản vẽ phải dựng cả môi trường.
 *
 * CHẠY:
 *   node scripts/chup-mock.mjs docs/mocks/mock-a.html [docs/mocks/mock-b.html …]
 * Tuỳ chọn:
 *   IF_KHO=1600x900        khổ chụp (mặc định 1600x900 — khổ "màn rộng" đang duyệt)
 *   IF_OUT=<thư mục>       nơi đổ ảnh (mặc định docs/delivery/anh-duyet-mat/nc)
 *   IF_TRINH_DUYET=<path>  trình duyệt tự chỉ (xem ghi chú lệch số hiệu bản ở cuối)
 *
 * ⚠️ Gói `playwright` trong repo đóng đinh một SỐ HIỆU BẢN trình duyệt; máy dựng sẵn có bản khác
 * ⇒ lỗi "Executable doesn't exist" đọc như thiếu trình duyệt, thật ra chỉ lệch số hiệu. Trỏ
 * `IF_TRINH_DUYET` vào bản có sẵn, ĐỪNG chạy `npx playwright install`.
 */
import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';
import { basename, resolve, join } from 'path';

const TEP = process.argv.slice(2);
if (!TEP.length) {
  console.error('⛔ Thiếu tệp. Chạy: node scripts/chup-mock.mjs docs/mocks/<tên>.html');
  process.exit(1);
}
const [W, H] = (process.env.IF_KHO ?? '1600x900').split('x').map(Number);
const OUT = process.env.IF_OUT ?? 'docs/delivery/anh-duyet-mat/nc';
const CHROME = process.env.IF_TRINH_DUYET ?? '';

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch(CHROME && existsSync(CHROME) ? { executablePath: CHROME } : {});
let n = 0;
for (const t of TEP) {
  const duong = resolve(t);
  if (!existsSync(duong)) { console.error(`  ⚠️  không thấy ${t}`); continue; }
  for (const [nen, attr] of [['sang', 'light'], ['toi', 'dark']]) {
    const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
    // Đặt theme TRƯỚC khi tải, để không chụp trúng khung nhấp nháy giữa hai nền.
    await page.addInitScript((v) => {
      document.addEventListener('DOMContentLoaded', () => document.documentElement.setAttribute('data-theme', v));
    }, attr);
    await page.goto('file://' + duong, { waitUntil: 'load' });
    await page.evaluate((v) => document.documentElement.setAttribute('data-theme', v), attr);
    await page.waitForTimeout(350); // chờ gradient/nét vẽ ổn định
    const ten = basename(t).replace(/\.html$/, '');
    await page.screenshot({ path: join(OUT, `${ten}-${W}x${H}-${nen}.png`), animations: 'disabled' });
    console.log(`  📸 ${ten}-${W}x${H}-${nen}`);
    n++;
    await page.close();
  }
}
await browser.close();
console.log(`\n✅ ${n} ảnh → ${OUT}`);
