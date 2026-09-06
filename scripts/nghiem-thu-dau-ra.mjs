#!/usr/bin/env node
/**
 * scripts/nghiem-thu-dau-ra.mjs — CHẠY LẠI TRỌN CHUỖI "ĐẦU RA NÓI THẬT" TRÊN APP THẬT.
 *
 * ⛔ VÌ SAO CÓ TỆP NÀY: `docs/CHUAN-DAU-RA-NGHE.md` §7/§7b là văn bản CHÉP TAY — hôm nay đúng,
 * một lần sửa `lib/boq/xlsx.ts` hoặc `lib/present-editor/export.ts` là nó thành lời khai cũ mà
 * không máy nào báo. Test đơn vị canh được phần lõi; tệp này canh phần CÒN LẠI: đường đi từ
 * *người dùng bấm nút* tới *byte trong tệp tải về*.
 *
 * Nó KHÔNG phải máy soi (không vào `npm test` — cần dev server + trình duyệt thật). Chạy tay khi
 * đụng vào đường xuất:
 *     npx next dev -p 3021          # cửa sổ khác, ĐÚNG MỘT server
 *     node scripts/nghiem-thu-dau-ra.mjs --url http://localhost:3021 --out .nghiem-thu-out
 *
 * Nó tự dựng dữ liệu THẬT qua UI (đăng ký · tạo dự án · vẽ 2 hình chữ nhật · tô 2 vùng · gán
 * vật liệu qua panel, kể cả bước duyệt "Áp cho 1 chỗ") rồi:
 *   ① xuất .xlsx TRƯỚC khi sửa tay
 *   ② sửa tay 1 ô (bấm ĐÚP — bấm một lần chỉ chọn ô, xem `BoqTable.tsx:190` onDoubleClick)
 *   ③ xuất .xlsx SAU khi sửa tay, rồi MỞ CẢ HAI RA ĐỌC và so
 *   ④ xuất PDF ở deck A3 và ở deck 16:9, đọc `/MediaBox` của từng tệp
 * Mọi khẳng định đọc từ TỆP ĐÃ TẢI, không đọc lại biến trong bộ nhớ.
 *
 * ⚠️ Cần `playwright` + một bản Chromium trên máy. Máy CI của repo có
 * `/opt/pw-browsers/chromium-1194` (bản Playwright đòi hỏi là 1234 nên `launch()` trần THẤT BẠI)
 * — đổi bằng `--chrome <đường dẫn>` nếu máy khác.
 */
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

const arg = (ten, mac) => { const i = process.argv.indexOf(`--${ten}`); return i > 0 ? process.argv[i + 1] : mac; };
const U = arg('url', 'http://localhost:3021');
const OUT = arg('out', '.nghiem-thu-out');
const CHROME = arg('chrome', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome');

let pass = 0, fail = 0;
const ok = (ten, dieu, chiTiet = '') => {
  if (dieu) { pass++; console.log(`  ok  - ${ten}`); }
  else { fail++; console.log(`  FAIL- ${ten}${chiTiet ? `  (${chiTiet})` : ''}`); }
};
const mm = (pt) => pt * 25.4 / 72;

/** Đọc khổ trang đầu của một PDF — thuần regex trên `/MediaBox`, không cần thư viện PDF. */
function khoPdf(tep) {
  const d = fs.readFileSync(tep);
  const m = /\/MediaBox\s*\[([^\]]+)\]/.exec(d.toString('latin1'));
  if (!m) return null;
  const v = m[1].trim().split(/\s+/).map(Number);
  return { wPt: v[2] - v[0], hPt: v[3] - v[1], wMm: mm(v[2] - v[0]), hMm: mm(v[3] - v[1]) };
}

const br = await chromium.launch({ executablePath: CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const ctx = await br.newContext({ viewport: { width: 1600, height: 1000 }, acceptDownloads: true });
const p = await ctx.newPage();
p.on('pageerror', (e) => console.log('  [pageerror]', String(e).slice(0, 200)));
fs.mkdirSync(OUT, { recursive: true });

console.log('nghiệm thu ĐẦU RA NÓI THẬT —', U);
await p.request.post(`${U}/api/auth/register`, { data: { name: 'Nghiem Thu', email: `nt${Date.now()}@if.test`, password: 'matkhau123' } });
const { project } = await (await p.request.post(`${U}/api/flows`, { data: { type: 'project', name: 'Nghiem thu dau ra' } })).json();

/* ── dựng bản vẽ thật ─────────────────────────────────────────────────────── */
await p.goto(`${U}/projects/${project.id}/cad`, { waitUntil: 'networkidle', timeout: 120000 });
await p.waitForTimeout(8000);
await p.getByRole('button', { name: /Tạo bản vẽ mới/i }).first().click();
await p.waitForTimeout(11000);
const an = p.getByRole('button', { name: /Ẩn gợi ý/i }); if (await an.count()) await an.first().click();
const bb = await p.locator('canvas').first().boundingBox();
const nut = (ten) => p.getByRole('button', { name: ten, exact: true });
const rect = async (x1, y1, x2, y2) => { await nut('Chữ nhật').click(); await p.waitForTimeout(300);
  await p.mouse.click(bb.x + x1, bb.y + y1); await p.waitForTimeout(300); await p.mouse.click(bb.x + x2, bb.y + y2); await p.waitForTimeout(900); };
const hatch = async (x, y) => { await nut('Hatch').click(); await p.waitForTimeout(400); await p.mouse.click(bb.x + x, bb.y + y); await p.waitForTimeout(1100); };
const gan = async (x, y, ten) => {
  await nut('Chọn').click(); await p.waitForTimeout(300);
  await p.mouse.click(bb.x + x, bb.y + y); await p.waitForTimeout(800);
  if (!await p.getByText('KHO VẬT LIỆU · GÁN MÃ').count()) { await nut('Vật liệu').click(); await p.waitForTimeout(1600); }
  await p.getByText(ten, { exact: false }).first().click(); await p.waitForTimeout(1200);
  const ap = p.getByRole('button', { name: /Áp cho/i });   // ProposalSheet — người duyệt trước khi áp
  if (await ap.count()) { await ap.first().click(); await p.waitForTimeout(1600); }
};
await rect(260, 180, 700, 470); await rect(820, 180, 1120, 420);
await hatch(480, 330); await hatch(970, 300);
await gan(480, 330, 'Sàn gỗ sồi tự nhiên');   // ProductSpec CÓ giá
await gan(970, 300, 'Gỗ óc chó');             // hạt giống KHÔNG giá

console.log('\n[1] BOQ — lý do nói thật cho vật liệu hạt giống');
const api = await p.evaluate(async (pid) => {
  const doc = window.__cadStore.getState().doc;
  const r = await fetch(`/api/boq/${pid}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ doc }) });
  return r.json();
}, project.id);
ok('có dòng cho vật liệu đã có giá', api.rows.length === 1);
ok('vật liệu hạt giống KHÔNG bị báo "không tìm thấy" nữa',
  !api.errors.some((e) => e.reason === 'spec-not-found'), JSON.stringify(api.errors.map((e) => e.reason)));
ok('lý do đúng là "chưa có đơn giá"', api.errors.some((e) => e.reason === 'missing-priceVnd'));

/* ── BOQ: xuất trước / sửa tay / xuất sau ─────────────────────────────────── */
console.log('\n[2] .xlsx — dấu vết sửa tay sống sót qua cửa xuất');
await p.locator('a,button').filter({ hasText: /^Trình chiếu$/ }).first().click(); await p.waitForTimeout(8000);
await p.getByRole('button', { name: /^Khối lượng \(BOQ\)$/ }).first().click(); await p.waitForTimeout(8000);
const hieu = p.getByRole('button', { name: /^Hiểu rồi$/ }); if (await hieu.count()) await hieu.first().click();
const taiXlsx = async (ten) => {
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 90000 }), p.getByRole('button', { name: /Xuất xlsx/i }).first().click()]);
  const f = path.join(OUT, ten); await dl.saveAs(f); return f;
};
const fTruoc = await taiXlsx('BOQ-1-truoc-sua-tay.xlsx');

const soMay = await p.evaluate(() => {
  const el = [...document.querySelectorAll('td div')].find((e) => /^\d+([.,]\d+)?$/.test((e.textContent || '').trim()));
  return el ? el.textContent.trim() : null;
});
await p.getByText(soMay, { exact: true }).first().dblclick(); await p.waitForTimeout(1200);
for (const el of await p.locator('input').all()) {
  const v = (await el.inputValue().catch(() => '')) || '';
  if (v.replace(/[\s ]/g, '') === soMay) { await el.fill('35'); await el.press('Enter'); break; }
}
await p.waitForTimeout(2500);
ok('màn hình khai số máy sau khi sửa tay', (await p.locator('body').innerText()).includes('Đã sửa tay 1'));
const fSau = await taiXlsx('BOQ-2-sau-sua-tay.xlsx');

// MỞ TỆP RA ĐỌC — bằng chính bộ giải zip, không đọc lại state
const JSZip = (await import('jszip')).default;
const doc = async (f) => (await JSZip.loadAsync(fs.readFileSync(f))).files['xl/worksheets/sheet1.xml'].async('string');
const xTruoc = await doc(fTruoc), xSau = await doc(fSau);
ok('tệp TRƯỚC: ô nói "Đo được"', xTruoc.includes('>Đo được<'));
ok('tệp TRƯỚC: không có dòng tổng theo số máy', !xTruoc.includes('TỔNG theo số máy'));
ok('tệp SAU: ô nói "Người sửa tay"', xSau.includes('>Người sửa tay<'));
ok(`tệp SAU: SỐ MÁY ${soMay} còn sống trong tệp`, xSau.includes(`<v>${soMay}</v>`), 'trước bản vá 06/09: mất hẳn');
ok('tệp SAU: có dòng TỔNG theo số máy', xSau.includes('TỔNG theo số máy'));

/* ── PDF: khổ giấy ────────────────────────────────────────────────────────── */
console.log('\n[3] .pdf — trang đúng khổ người dùng đã chọn');
const xuatPdf = async (ten) => {
  await p.getByRole('button', { name: /^Xuất$/ }).first().click(); await p.waitForTimeout(1500);
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 150000 }),
    p.locator('[role=menuitem],button').filter({ hasText: /PDF \(xem nhanh/ }).first().click()]);
  const f = path.join(OUT, ten); await dl.saveAs(f); return khoPdf(f);
};
await p.goto(`${U}/projects/${project.id}/present`, { waitUntil: 'networkidle', timeout: 120000 }); await p.waitForTimeout(9000);
await p.getByRole('button', { name: /Trang A3 trống để dàn vật liệu/ }).first().click(); await p.waitForTimeout(10000);
const a3 = await xuatPdf('A3-nut-PDF.pdf');
ok(`deck A3 → 420×297 mm (đo ${a3.wMm.toFixed(1)}×${a3.hMm.toFixed(1)})`,
  Math.abs(a3.wMm - 420) < 1 && Math.abs(a3.hMm - 297) < 1, 'trước bản vá 06/09: 1277,5×903,1 mm');

const { project: p2 } = await (await p.request.post(`${U}/api/flows`, { data: { type: 'project', name: 'Nghiem thu 16-9' } })).json();
await p.goto(`${U}/projects/${p2.id}/cad`, { waitUntil: 'networkidle', timeout: 120000 }); await p.waitForTimeout(8000);
await p.getByRole('button', { name: /Tạo bản vẽ mới/i }).first().click(); await p.waitForTimeout(11000);
await p.locator('a,button').filter({ hasText: /^Trình chiếu$/ }).first().click(); await p.waitForTimeout(9000);
await p.getByRole('button', { name: /Bắt đầu trình bày/ }).first().click(); await p.waitForTimeout(12000);
const d169 = await xuatPdf('DECK-16-9-nut-PDF.pdf');
ok(`deck 16:9 giữ đường px cũ, tỉ lệ 1,778 (đo ${(d169.wPt / d169.hPt).toFixed(3)})`,
  Math.abs(d169.wPt / d169.hPt - 16 / 9) < 0.01 && d169.wMm > 500, 'không hồi quy');

await br.close();
console.log(`\n${pass} pass, ${fail} fail  ·  tệp ở ${OUT}/`);
process.exit(fail ? 1 : 0);
