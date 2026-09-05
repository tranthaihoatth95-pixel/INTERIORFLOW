/**
 * scripts/soi-mat/cham-pattern.mjs — CHẤM MÀN APP THẬT THEO DESIGN PATTERN.
 *
 * ⭐ VÌ SAO CÓ TỆP NÀY (05/09). `cong-thiet-ke.mjs` chấm BẢN VẼ `*.dc.html`; các bánh cóc
 * (`cam-hex-inline`, `hinh-hoc-ap-thang`, nét icon…) chấm MÃ NGUỒN. Không cỗ nào chấm **thứ người
 * dùng thật sự nhìn thấy**. Hệ quả đo được cùng ngày: `/library/ingest` sơn cứng cả một bảng màu
 * ấm suốt nhiều tháng, ở theme sáng nó thành MỘT MÀN HAI HỆ MÀU — không cổng nào kêu, vì bánh cóc
 * chỉ ĐẾM hex chứ không biết chúng hợp thành cái gì trên màn.
 *
 * Tệp này đo trên trình duyệt thật: mở route, đọc màu ĐÃ TÍNH (`getComputedStyle`) của mọi phần tử
 * NHÌN THẤY ĐƯỢC, rồi áp đúng luật L1/L2 mà cổng bản vẽ đang áp.
 *
 * ⚠️ BA GIỚI HẠN, KHAI TRƯỚC — đọc trước khi tin con số:
 *  ① Chỉ thấy phần tử ĐANG hiển thị. Panel đóng, tab chưa mở, trạng thái lỗi chưa xảy ra thì
 *    không vào phép đo. Đây là SÀN, không phải trần.
 *  ② Không phân biệt được "màu nghĩa" với "màu trang trí trùng hue" — giống hệt cổng bản vẽ, và
 *    lời giải ở đó là KHAI BÁO (`data-kenh`). Ở app, cửa khai báo là thuộc tính `data-kenh` trên
 *    phần tử; chưa khai thì vẫn bị đếm.
 *  ③ Màu ẢNH/canvas/WebGL không đọc được qua computed style ⇒ không tính. Đó là màu NỘI DUNG,
 *    đúng ra cũng không nên tính.
 */
import { chromium } from 'playwright';
import { rgbToHsl, gomHoAccent } from '../lib/mau-ho.mjs';

const CONG = process.env.CONG || '3230';
const BASE = `http://localhost:${CONG}`;
const cho = (ms) => new Promise((r) => setTimeout(r, ms));

/** Route công khai + route cần dự án. Tên là thứ Hoà đọc, nên viết như người nói. */
const MAN = [
  { ten: 'Trang chủ', duong: '/' },
  { ten: 'Tệp', duong: '/files' },
  { ten: 'Thư viện', duong: '/library' },
  { ten: 'Nạp tham khảo', duong: '/library/ingest' },
  { ten: 'Vật liệu', duong: '/materials' },
  { ten: 'Bảng việc', duong: '/tasks' },
  { ten: 'Cài đặt', duong: '/settings' },
];

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => { try { localStorage.setItem('if_intro_seen_v1', '1'); } catch {} });
const p = await ctx.newPage();

await p.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 60000 }); await cho(2500);
await p.locator('button:has-text("Đăng ký")').first().click().catch(() => {}); await cho(600);
const t = p.locator('input[placeholder*="Tên"]').first(); if (await t.count()) await t.fill('CP');
const i = p.locator('input[placeholder*="Email"]').first(); if (await i.count()) await i.fill(`cp.${Date.now()}@if.test`);
const pw = p.locator('input[type=password]'); for (let k = 0; k < await pw.count(); k++) await pw.nth(k).fill('MatThuong#2026');
await p.locator('button[type=submit]').first().click().catch(() => {}); await cho(7000);

/** Gom màu đã tính của mọi phần tử nhìn thấy được. Bỏ phần tử nằm trong khối khai `data-kenh`. */
const HUT = () => {
  const ra = [];
  for (const el of document.querySelectorAll('*')) {
    if (el.closest('[data-kenh],[data-truc],[data-mau-vat-lieu]')) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) continue;
    const co = el.textContent && el.textContent.trim().length > 0;
    ra.push({ nen: cs.backgroundColor, chu: co ? cs.color : null, vien: cs.borderTopColor, dau: (el.tagName + '.' + (el.className || '')).slice(0, 60) });
  }
  return ra;
};

let tongLoi = 0;
const theme = process.env.THEME || 'dark';
console.log(`chấm theo design pattern · cổng ${CONG} · theme ${theme}\n`);
for (const m of MAN) {
  await p.evaluate((v) => { document.documentElement.dataset.theme = v; try { localStorage.setItem('theme', v); } catch {} }, theme);
  await p.goto(BASE + m.duong, { waitUntil: 'domcontentloaded' }).catch(() => {});
  await cho(2500);
  await p.evaluate((v) => { document.documentElement.dataset.theme = v; }, theme);
  await cho(400);
  const tho = await p.evaluate(HUT);
  const mau = [];
  for (const x of tho) for (const c of [x.nen, x.chu, x.vien]) { const h = c && rgbToHsl(c); if (h) mau.push(h); }
  const ho = gomHoAccent(mau);
  const day = ho.filter((x) => x.n >= 3); // 1-2 lần là nhiễu (một viền, một dấu), chưa thành họ
  const mo = day.map((x) => `hue ${x.tu}°${x.toi !== x.tu ? `–${x.toi}°` : ''}: ${x.n}`).join(' · ');
  if (day.length >= 2) { tongLoi++; console.log(`✗ ${m.ten.padEnd(16)} L1 "tè le" — ${day.length} họ accent (${mo})`); }
  else console.log(`✓ ${m.ten.padEnd(16)} ${day.length ? mo : 'không họ accent nào ≥3'}`);
}
console.log(`\n— ${MAN.length} màn · ${tongLoi} màn tè le`);
await b.close();
process.exit(tongLoi ? 1 : 0);
