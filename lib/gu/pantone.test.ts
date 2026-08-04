/**
 * lib/gu/pantone.test.ts — F3b: `nearestPantone`/`paletteToPantone` (lib/gu/pantone.ts).
 * Chạy: node_modules/.bin/sucrase-node lib/gu/pantone.test.ts
 */
import { nearestPantone, paletteToPantone } from './pantone';
import pantoneData from './pantone-tcx.json';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

console.log('pantone-tcx.json — dữ liệu thô đúng hình dạng, đủ số lượng, không trùng mã');
{
  ok('~2000+ mã (đề bài "~2000")', pantoneData.length >= 2000);
  ok('mọi entry có đủ code/name/hex', pantoneData.every((e) => typeof e.code === 'string' && e.code && typeof e.name === 'string' && e.name && typeof e.hex === 'string'));
  ok('mọi hex đúng định dạng #RRGGBB', pantoneData.every((e) => /^#[0-9A-F]{6}$/.test(e.hex)));
  const codes = new Set(pantoneData.map((e) => e.code));
  ok('mã KHÔNG trùng nhau (đủ 1-1 với danh sách gốc)', codes.size === pantoneData.length);
}

console.log('nearestPantone — trùng khít trả ĐÚNG mã đó, ΔE=0');
{
  const sample = pantoneData[100];
  const m = nearestPantone(sample.hex);
  ok('trả đúng entry khi hex trùng khít', m?.code === sample.code && m?.name === sample.name);
  ok('ΔE = 0 khi trùng khít', m?.deltaE === 0);
}

console.log('nearestPantone — hex GẦN (lệch nhẹ) vẫn ra ĐÚNG mã đó, ΔE nhỏ nhưng > 0');
{
  const sample = pantoneData[500];
  // lệch +1 mỗi kênh RGB — đủ nhỏ để KHÔNG nhảy sang mã khác (2310 mã phủ khá dày nhưng lệch 1
  // đơn vị mỗi kênh là biến động cực nhỏ, luôn còn trong "vùng hút" của mã gần nhất).
  const rgb = parseInt(sample.hex.slice(1), 16);
  const r = Math.min(255, (rgb >> 16) + 1);
  const g = Math.min(255, ((rgb >> 8) & 0xff) + 1);
  const b = Math.min(255, (rgb & 0xff) + 1);
  const nudged = `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
  const m = nearestPantone(nudged);
  ok('vẫn khớp đúng mã gốc', m?.code === sample.code);
  ok('ΔE > 0 (không trùng khít tuyệt đối)', (m?.deltaE ?? -1) > 0);
  ok('ΔE rất nhỏ (< 1, mắt thường không phân biệt được)', (m?.deltaE ?? 99) < 1);
}

console.log('nearestPantone — hex không hợp lệ trả null, KHÔNG sập');
{
  ok('chuỗi rác → null', nearestPantone('không-phải-hex') === null);
  ok('chuỗi rỗng → null', nearestPantone('') === null);
  ok('thiếu ký tự (#FFFFF, 5 số) → null', nearestPantone('#FFFFF') === null);
  ok('#FFF (rút gọn 3 ký tự) VẪN hợp lệ — hexToRgb hỗ trợ dạng rút gọn', nearestPantone('#FFF') !== null);
  ok('#GGGGGG (ký tự sai) → null', nearestPantone('#GGGGGG') === null);
}

console.log('nearestPantone — 2 màu cực trị (đen/trắng tinh) vẫn ra kết quả hợp lệ trong bảng');
{
  const black = nearestPantone('#000000');
  const white = nearestPantone('#FFFFFF');
  ok('đen tuyệt đối → có kết quả', black !== null);
  ok('trắng tuyệt đối → có kết quả', white !== null);
  ok('đen và trắng KHÔNG ra cùng 1 mã', black?.code !== white?.code);
}

console.log('paletteToPantone — áp lên cả palette, bỏ qua hex hỏng thay vì sập cả mảng');
{
  const palette = [pantoneData[0].hex, pantoneData[1].hex, 'rác', pantoneData[2].hex];
  const matches = paletteToPantone(palette);
  ok('3 hex hợp lệ → 3 kết quả (bỏ qua 1 hex hỏng)', matches.length === 3);
  ok('đúng thứ tự tương ứng palette (giữ nguyên vị trí các hex hợp lệ)', matches[0].code === pantoneData[0].code && matches[2].code === pantoneData[2].code);
  ok('mảng rỗng → mảng rỗng, không sập', paletteToPantone([]).length === 0);
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
