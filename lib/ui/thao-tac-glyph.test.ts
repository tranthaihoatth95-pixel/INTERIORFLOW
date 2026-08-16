/**
 * lib/ui/thao-tac-glyph.test.ts — khoá RÀNG BUỘC của kho hình minh hoạ thao tác.
 * Chạy: `node_modules/.bin/sucrase-node lib/ui/thao-tac-glyph.test.ts`
 *
 * Kiểm gì (và vì sao — mỗi mục là một cách hỏng đã lường trước):
 *  1. Đủ 6 hình, mỗi khoá render ra một <svg> THẬT (không rơi vào nhánh mặc định câm).
 *  2. 0 mã màu gõ cứng — chỉ `currentColor`. Thẻ tooltip đảo màu theo theme; một hex là hình
 *     biến mất ở một trong hai theme.
 *  3. Mọi hình cùng viewBox 220×110 — lệch khổ thì lướt danh sách lệnh thấy thẻ nhảy giật.
 *  4. `aria-hidden` + `focusable="false"` — hình minh hoạ lại điều `desc` đã nói, đọc hai lần
 *     là nhiễu; và nó KHÔNG được cướp một chặng Tab của bàn phím.
 *  5. id của marker mũi tên PHẢI khác nhau giữa các hình — nhiều tooltip cùng nằm trong DOM,
 *     trùng id thì mũi tên hình này ăn định nghĩa của hình kia.
 *  6. Nguồn phải mang RÀNG BUỘC PHẠM VI bằng chữ: cấm dùng làm nút (loại "Hình minh hoạ"
 *     trong bảng sáu loại icon, 00-CHOT 16/08).
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ThaoTacGlyph, THAO_TAC_KEYS, THAO_TAC_NHAN, GLYPH_VIEWBOX } from './thao-tac-glyph';

let fail = 0;
function ok(msg: string, cond: unknown) {
  if (cond) console.log('  ok  -', msg);
  else { fail += 1; console.log('  FAIL -', msg); }
}

console.log('\nthao-tac-glyph — kho hình minh hoạ thao tác');

const SRC = readFileSync(join(__dirname, 'thao-tac-glyph.tsx'), 'utf8');
const html: Record<string, string> = {};
for (const k of THAO_TAC_KEYS) html[k] = renderToStaticMarkup(createElement(ThaoTacGlyph, { ten: k }));

console.log('\n[1] Đủ 6 hình, mỗi hình ra <svg> thật');
ok('có đúng 6 khoá', THAO_TAC_KEYS.length === 6);
ok('không khoá nào trùng', new Set(THAO_TAC_KEYS).size === 6);
for (const k of THAO_TAC_KEYS) {
  ok(`"${k}" render ra <svg> có nét vẽ`, /^<svg/.test(html[k]) && /(<path|<rect|<line|<circle)/.test(html[k]));
  ok(`"${k}" có nhãn song ngữ VI/EN`, Boolean(THAO_TAC_NHAN[k]?.vi && THAO_TAC_NHAN[k]?.en));
}

console.log('\n[2] Không mã màu gõ cứng — chỉ currentColor');
for (const k of THAO_TAC_KEYS) {
  ok(`"${k}" không chứa hex`, !/#[0-9a-fA-F]{3,8}\b/.test(html[k]));
  ok(`"${k}" không chứa rgb()/hsl()`, !/\brgba?\(|\bhsla?\(/.test(html[k]));
  ok(`"${k}" có dùng currentColor`, html[k].includes('currentColor'));
}
ok('nguồn không gõ hex ở đâu cả', !/#[0-9a-fA-F]{3,8}\b/.test(SRC));

console.log('\n[3] Cùng một khổ hình');
ok('khổ chuẩn là 220×110', GLYPH_VIEWBOX === '0 0 220 110');
for (const k of THAO_TAC_KEYS) {
  ok(`"${k}" dùng đúng viewBox chuẩn`, html[k].includes(`viewBox="${GLYPH_VIEWBOX}"`));
}

console.log('\n[4] Không cướp bàn phím, không đọc hai lần');
for (const k of THAO_TAC_KEYS) {
  ok(`"${k}" aria-hidden`, /aria-hidden="true"/.test(html[k]));
  ok(`"${k}" focusable="false"`, /focusable="false"/.test(html[k]));
}

console.log('\n[5] id marker không đụng nhau giữa các hình');
{
  const ids = THAO_TAC_KEYS.flatMap((k) => [...html[k].matchAll(/<marker[^>]*id="([^"]+)"/g)].map((m) => m[1]));
  ok(`${ids.length} marker, không id nào trùng`, ids.length === new Set(ids).size);
}

console.log('\n[6] Ràng buộc phạm vi ghi thành chữ trong nguồn');
ok('nguồn cấm dùng làm nút', /CẤM DÙNG CÁC SVG NÀY LÀM NÚT/.test(SRC));
ok('nguồn nêu chỉ sống trong ô giải nghĩa', /chỉ sống trong ô giải nghĩa/.test(SRC));
ok('nguồn cấm file ảnh ngoài', /KHÔNG file ảnh ngoài/.test(SRC));

console.log(fail === 0 ? '\n✅ thao-tac-glyph: tất cả đạt' : `\n❌ thao-tac-glyph: ${fail} mục hỏng`);
if (fail > 0) process.exit(1);
