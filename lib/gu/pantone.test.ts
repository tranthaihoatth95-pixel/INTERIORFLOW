/**
 * lib/gu/pantone.test.ts — máy tra màu `nearestColor`/`nearestColors` (lib/gu/pantone.ts).
 * Chạy: node_modules/.bin/sucrase-node lib/gu/pantone.test.ts
 *
 * ⚠️ VIẾT LẠI 05/08: bản cũ kiểm `pantone-tcx.json` (2310 mã nhúng sẵn) — **bảng đó đã xoá**,
 * nên mọi test kiểu "đủ 2000 mã", "mã không trùng" không còn nghĩa. Nguồn màu giờ do người dùng
 * nạp lúc chạy ⇒ test phải dựng nguồn GIẢ ngay trong test, đúng cách một máy tra cắm rời được
 * kiểm: đưa bảng vào, xem thứ hạng ra có đúng không.
 */
import { nearestColor, nearestColors, paletteToColors, DEFAULT_MAX_DELTA_E } from './pantone';
import { hexToRgb, rgbToLab } from './color-psychology';
import type { ColorEntry, ColorSource } from '../colors/types';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

function entry(code: string, name: string, hex: string, brand?: string): ColorEntry {
  return { code, name, hex, lab: rgbToLab(hexToRgb(hex)!), brand };
}
function source(colors: ColorEntry[], id = 'src', name = 'Bảng thử'): ColorSource {
  return { id, name, colors, origin: 'user-csv', scope: 'studio', updatedAt: 0 };
}

const BANG = source([
  entry('S-01', 'Trắng ngà', '#f4f1ea'),
  entry('S-02', 'Xám khói', '#8d9299'),
  entry('S-03', 'Xanh rêu', '#4a5d4e'),
  entry('S-04', 'Nâu đất', '#8a5a3c'),
  entry('S-05', 'Xanh biển', '#2f5d8a'),
  entry('S-06', 'Đen mực', '#1b1b1d'),
]);

console.log('\n[1] Trùng khít → ΔE = 0, đúng mã đó đứng đầu');
{
  const r = nearestColors('#4a5d4e', BANG);
  ok('mã đầu bảng đúng', r.matches[0].code === 'S-03');
  ok('ΔE = 0', r.matches[0].deltaE === 0);
  ok('nearestDeltaE = 0', r.nearestDeltaE === 0);
  ok('enough = true', r.enough === true);
  ok('có ghi tên nguồn để UI nói "gần nhất TRONG bảng nào"', r.sourceName === 'Bảng thử' && r.sourceId === 'src');
}

console.log('\n[2] Lệch nhẹ → vẫn ra đúng mã, ΔE nhỏ nhưng > 0');
{
  const r = nearestColors('#4b5e4f', BANG); // +1 mỗi kênh
  ok('vẫn là S-03', r.matches[0].code === 'S-03');
  ok('0 < ΔE < 1', r.matches[0].deltaE > 0 && r.matches[0].deltaE < 1);
}

console.log('\n[3] TOP N — trả nhiều lựa chọn, KHÔNG một đáp án chắc nịch');
{
  const r = nearestColors('#4a5d4e', BANG);
  ok('mặc định trả 5 kết quả', r.matches.length === 5);
  ok('mọi kết quả đều KÈM số ΔE', r.matches.every((m) => typeof m.deltaE === 'number'));
  ok('xếp tăng dần theo ΔE', r.matches.every((m, i) => i === 0 || m.deltaE >= r.matches[i - 1].deltaE));

  ok('limit = 3 → 3 kết quả', nearestColors('#4a5d4e', BANG, { limit: 3 }).matches.length === 3);
  ok('limit kẹp trên ở 10 (nguồn chỉ có 6 → 6)', nearestColors('#4a5d4e', BANG, { limit: 999 }).matches.length === 6);
  ok('limit 0 → kẹp về 1, không trả rỗng', nearestColors('#4a5d4e', BANG, { limit: 0 }).matches.length === 1);
}

console.log('\n[4] Ngưỡng ΔE — quá xa thì KHÔNG được bày mã ra như đáp án');
{
  // Hồng cánh sen: bảng 6 màu trên không có gì gần.
  const r = nearestColors('#ff00aa', BANG);
  ok('nearestDeltaE > ngưỡng 5', (r.nearestDeltaE ?? 0) > DEFAULT_MAX_DELTA_E);
  ok('enough = false ⇒ UI hiện "không có màu nào đủ gần"', r.enough === false);
  ok('matches VẪN có dữ liệu để người dùng tự xem nếu muốn', r.matches.length > 0);
  ok('nearestColor() trả null khi không đủ gần (không bịa mã)', nearestColor('#ff00aa', BANG) === null);

  ok('nới ngưỡng thì enough bật lại', nearestColors('#ff00aa', BANG, { maxDeltaE: 100 }).enough === true);
}

console.log('\n[5] Dùng LAB đã lưu, không tính lại từ hex');
{
  // Entry cố tình có hex và lab KHÔNG khớp nhau — mô phỏng nguồn có Lab đo thật.
  const lech: ColorSource = source([
    { code: 'X', name: 'Lab thật', hex: '#ffffff', lab: rgbToLab(hexToRgb('#000000')!) },
  ], 'lech', 'Lệch');
  const r = nearestColors('#000000', lech);
  ok('xếp hạng theo LAB (ΔE≈0 với đen) chứ không theo hex trắng', r.matches[0].deltaE < 0.01);
}

console.log('\n[6] Ca biên');
{
  ok('hex sai → matches rỗng, nearestDeltaE null, enough false', (() => {
    const r = nearestColors('không-phải-hex', BANG);
    return r.matches.length === 0 && r.nearestDeltaE === null && r.enough === false;
  })());
  ok('nguồn rỗng → không sập', (() => {
    const r = nearestColors('#ffffff', source([], 'empty', 'Rỗng'));
    return r.matches.length === 0 && r.enough === false;
  })());
  ok('entry có hex hỏng bị BỎ QUA, phần còn lại vẫn tra được', (() => {
    const bad = source([
      { code: 'BAD', name: 'hỏng', hex: 'zzz' } as unknown as ColorEntry,
      entry('OK', 'trắng', '#ffffff'),
    ], 'mix', 'Lẫn');
    const r = nearestColors('#ffffff', bad);
    return r.matches.length === 1 && r.matches[0].code === 'OK' && r.enough === true;
  })());
  ok('tất định: gọi 2 lần ra cùng thứ tự', (() => {
    const a = nearestColors('#7f7f7f', BANG).matches.map((m) => m.code).join();
    const b = nearestColors('#7f7f7f', BANG).matches.map((m) => m.code).join();
    return a === b;
  })());
}

console.log('\n[7] paletteToColors — giữ đúng thứ tự palette, kể cả hex hỏng');
{
  const rs = paletteToColors(['#4a5d4e', 'rác', '#f4f1ea'], BANG, { limit: 1 });
  ok('trả đúng 3 kết quả, không nén mất phần tử', rs.length === 3);
  ok('phần tử 1 khớp S-03', rs[0].matches[0]?.code === 'S-03');
  ok('phần tử hỏng ở giữa → rỗng, KHÔNG làm lệch thứ tự', rs[1].matches.length === 0 && rs[1].enough === false);
  ok('phần tử 3 khớp S-01', rs[2].matches[0]?.code === 'S-01');
}

console.log('\n[8] Không còn dấu vết bảng nhúng sẵn (VIỆC 3)');
{
  const fs = require('node:fs') as typeof import('node:fs');
  ok('lib/gu/pantone-tcx.json ĐÃ XOÁ khỏi đĩa', !fs.existsSync(`${__dirname}/pantone-tcx.json`));
  const src = fs.readFileSync(`${__dirname}/pantone.ts`, 'utf8');
  ok('pantone.ts không import tệp dữ liệu nào', !/from\s+'\.\/[^']*\.json'/.test(src));
  ok('pantone.ts không còn export nearestPantone (đã đổi thành nearestColor)', !/export function nearestPantone/.test(src));
}

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
