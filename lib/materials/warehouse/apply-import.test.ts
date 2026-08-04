/**
 * lib/materials/warehouse/apply-import.test.ts
 * Chạy: node_modules/.bin/sucrase-node lib/materials/warehouse/apply-import.test.ts
 */
import { buildImportRows } from './apply-import';
import { guessMapping } from './column-mapping';
import type { ParsedSheet } from './xlsx-parse';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

function sheet(headers: string[], rows: string[][]): ParsedSheet {
  return { sheetName: 'Sheet1', headers, rows };
}

// ---- dòng hợp lệ đầy đủ ----
{
  const s = sheet(
    ['Mã SP', 'Tên sản phẩm', 'Hãng', 'ĐVT', 'Đơn giá', 'Rộng', 'Sâu', 'Cao'],
    [['GACH-01', 'Gạch Terrazzo 60x60', 'ABC Ceramic', 'm2', '1250000', '600', '600', '10']],
  );
  const mapping = guessMapping(s.headers);
  const rows = buildImportRows(s, mapping);
  ok('1 dòng ra 1 kết quả', rows.length === 1);
  ok('không lỗi', rows[0].error === null);
  ok('name đúng', rows[0].payload?.name === 'Gạch Terrazzo 60x60');
  ok('sku đúng', rows[0].payload?.sku === 'GACH-01');
  ok('priceVnd là số', rows[0].payload?.priceVnd === 1250000);
  ok('w/d/hUp đúng', rows[0].payload?.w === 600 && rows[0].payload?.d === 600 && rows[0].payload?.hUp === 10);
}

// ---- giá có ngăn nghìn bằng chấm (kiểu VN "1.250.000") ----
{
  const s = sheet(['Tên', 'Giá'], [['Sofa da', '15.500.000']]);
  const mapping = guessMapping(s.headers);
  const rows = buildImportRows(s, mapping);
  ok('giá ngăn nghìn kiểu VN đọc đúng thành 15500000', rows[0].payload?.priceVnd === 15500000);
}

// ---- thiếu "Tên" (field bắt buộc) → lỗi, không tạo payload ----
{
  const s = sheet(['Tên', 'Giá'], [['', '100000']]);
  const mapping = guessMapping(s.headers);
  const rows = buildImportRows(s, mapping);
  ok('thiếu tên → có lỗi', rows[0].error !== null);
  ok('thiếu tên → payload null', rows[0].payload === null);
}

// ---- giá không đọc được thành số → lỗi rõ, không âm thầm tạo giá 0/NaN ----
{
  const s = sheet(['Tên', 'Giá'], [['Đèn bàn', 'liên hệ']]);
  const mapping = guessMapping(s.headers);
  const rows = buildImportRows(s, mapping);
  ok('giá chữ "liên hệ" → lỗi', rows[0].error !== null && /Giá/.test(rows[0].error!));
}

// ---- nhiều dòng, có dòng lỗi lẫn dòng tốt — không dòng nào làm hỏng dòng khác ----
{
  const s = sheet(
    ['Tên', 'Giá'],
    [
      ['Ghế A', '500000'],
      ['', '200000'],
      ['Ghế B', '700000'],
    ],
  );
  const mapping = guessMapping(s.headers);
  const rows = buildImportRows(s, mapping);
  ok('3 dòng ra 3 kết quả', rows.length === 3);
  ok('dòng 1 ok', rows[0].error === null);
  ok('dòng 2 lỗi', rows[1].error !== null);
  ok('dòng 3 ok, không bị ảnh hưởng bởi dòng 2 lỗi', rows[2].error === null && rows[2].payload?.name === 'Ghế B');
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
