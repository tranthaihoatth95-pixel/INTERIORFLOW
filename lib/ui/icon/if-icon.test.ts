/**
 * lib/ui/icon/if-icon.test.ts — KHOÁ các ràng buộc của bộ ký hiệu IF bằng máy.
 * Chạy: `node_modules/.bin/sucrase-node lib/ui/icon/if-icon.test.ts`
 *
 * Mỗi mục là một cách hỏng đã lường trước, không phải kiểm cho có:
 *  1. Đủ 21 ký hiệu, mỗi tên render ra <svg> CÓ NÉT (không rơi vào nhánh câm).
 *  2. 0 mã màu gõ cứng — chỉ `currentColor`.
 *  3. Mọi ký hiệu CÙNG viewBox 16 — lệch lưới là lệch cả bề dày nét khi co giãn.
 *  4. Đầu nét vuông + góc nhọn ở MỌI ký hiệu — đây là chỗ đổi một tham số mà đổi cảm giác
 *     cả sản phẩm; lỡ tay đổi về `round` là bộ ký hiệu trôi về giọng web đa dụng.
 *  5. CHỈ hai bề dày nét được dùng (1 và 0,5). Nét thứ ba là bắt đầu trôi.
 *  6. Bốn hình khoá cân diện tích trong 3% — luật cân bằng quang học, quy về SỐ.
 *  7. Không nét nào ra ngoài vùng an toàn [1, 15].
 *  8. Họ NGHỀ phải THỰC SỰ dùng cặp nét 2:1 — nếu không thì nó chỉ là họ chung đội tên.
 *  9. Trợ năng: có nhãn ⇒ role="img"; không nhãn ⇒ aria-hidden. Không bao giờ cả hai.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { IfIcon, TEN_ICON, HO_CUA_ICON, NHAN_ICON, coHopLe } from './IfIcon';
import { LUOI, NET, DEM, THANG_CO, lechDienTich, netThuc } from './he-so';

let fail = 0;
function ok(msg: string, cond: unknown) {
  if (cond) console.log('  ok  -', msg);
  else { fail += 1; console.log('  FAIL -', msg); }
}
console.log('\nif-icon — bộ ký hiệu riêng của IF');

const SRC = readFileSync(join(__dirname, 'IfIcon.tsx'), 'utf8');
const html: Record<string, string> = {};
for (const k of TEN_ICON) html[k] = renderToStaticMarkup(createElement(IfIcon, { ten: k }));

console.log('\n[1] Đủ 21 ký hiệu, mỗi cái ra <svg> có nét');
ok('có đúng 21 tên', TEN_ICON.length === 21);
ok('không tên nào trùng', new Set(TEN_ICON).size === 21);
ok('12 họ chung + 9 họ nghề', TEN_ICON.filter((k) => HO_CUA_ICON[k] === 'chung').length === 12
  && TEN_ICON.filter((k) => HO_CUA_ICON[k] === 'nghe').length === 9);
for (const k of TEN_ICON) {
  ok(`"${k}" ra <svg> có nét vẽ`, /^<svg/.test(html[k]) && /(<path|<rect|<line|<circle)/.test(html[k]));
  ok(`"${k}" có nhãn song ngữ`, !!NHAN_ICON[k]?.vi && !!NHAN_ICON[k]?.en);
}

console.log('\n[2] 0 mã màu gõ cứng');
for (const k of TEN_ICON) ok(`"${k}" không hex/rgb`, !/#[0-9a-f]{3,8}\b|rgba?\(/i.test(html[k]));
ok('nguồn chỉ dùng currentColor', !/#[0-9a-f]{3,8}\b/i.test(SRC));

console.log('\n[3] Cùng viewBox 16');
for (const k of TEN_ICON) ok(`"${k}" viewBox 0 0 16 16`, html[k].includes(`viewBox="0 0 ${LUOI} ${LUOI}"`));

console.log('\n[4] Đầu nét VUÔNG + góc NHỌN ở mọi ký hiệu');
for (const k of TEN_ICON) {
  ok(`"${k}" butt+miter`, /stroke-linecap="butt"/.test(html[k]) && /stroke-linejoin="miter"/.test(html[k]));
  ok(`"${k}" không nét bo tròn`, !/stroke-linecap="round"|stroke-linejoin="round"/.test(html[k]));
}

console.log('\n[5] Chỉ hai bề dày nét');
const beDay = new Set<string>();
for (const k of TEN_ICON) for (const m of html[k].matchAll(/stroke-width="([\d.]+)"/g)) beDay.add(m[1]);
ok(`chỉ dùng {1, 0.5} — đo được: {${[...beDay].sort().join(', ')}}`,
  [...beDay].every((v) => Number(v) === NET.cat || Number(v) === NET.thay));
ok('nét "xa" (0,25) KHÔNG được dùng ở lưới 16', !beDay.has(String(NET.xa)));

console.log('\n[6] Bốn hình khoá cân diện tích');
ok(`chênh lệch ${lechDienTich().toFixed(1)}% < 3%`, lechDienTich() < 3);

console.log('\n[7] Không nét nào ra ngoài vùng an toàn');
for (const k of TEN_ICON) {
  const so = [...html[k].matchAll(/(?:^|[\s"=])(-?\d+(?:\.\d+)?)/g)].map((m) => Number(m[1]));
  const toaDo = so.filter((n) => n !== LUOI && Number.isFinite(n));
  ok(`"${k}" mọi toạ độ trong [0, 16]`, toaDo.every((n) => n >= 0 && n <= LUOI));
}

console.log('\n[8] Họ NGHỀ thực sự dùng CẶP nét 2:1');
for (const k of TEN_ICON.filter((x) => HO_CUA_ICON[x] === 'nghe')) {
  const co1 = html[k].includes(`stroke-width="${NET.cat}"`);
  const co05 = html[k].includes(`stroke-width="${NET.thay}"`);
  ok(`"${k}" có cả nét cắt lẫn nét thấy`, co1 && co05);
}

console.log('\n[9] Trợ năng — có nhãn ⇒ role=img; không nhãn ⇒ aria-hidden');
const coNhan = renderToStaticMarkup(createElement(IfIcon, { ten: 'tuong', nhan: 'Tường' }));
ok('có nhãn ⇒ role="img" + aria-label', /role="img"/.test(coNhan) && /aria-label="Tường"/.test(coNhan));
ok('có nhãn ⇒ KHÔNG aria-hidden', !/aria-hidden/.test(coNhan));
ok('không nhãn ⇒ aria-hidden', /aria-hidden="true"/.test(html['tuong']));
ok('không nhãn ⇒ KHÔNG role="img"', !/role="img"/.test(html['tuong']));
for (const k of TEN_ICON) ok(`"${k}" focusable="false"`, html[k].includes('focusable="false"'));

console.log('\n[10] Thang cỡ — bốn nấc, và nét thực luôn theo tỉ lệ');
ok('thang đúng 16/20/24/32', THANG_CO.join(',') === '16,20,24,32');
ok('cỡ 13 (cỡ đang dùng nhiều nhất hiện nay) bị từ chối', !coHopLe(13));
ok('nét thực 16→1,00 · 20→1,25 · 24→1,50 · 32→2,00',
  netThuc(16) === 1 && netThuc(20) === 1.25 && netThuc(24) === 1.5 && netThuc(32) === 2);
ok('tỉ lệ nét/lưới là hằng số 6,25% ở mọi cỡ',
  THANG_CO.every((s) => Math.abs(netThuc(s) / s - NET.cat / LUOI) < 1e-9));
ok('vùng an toàn 14 (đệm 1 mỗi phía)', LUOI - 2 * DEM === 14);

console.log(fail === 0 ? '\n✅ if-icon: tất cả PASS\n' : `\n❌ if-icon: ${fail} FAIL\n`);
process.exit(fail === 0 ? 0 : 1);
