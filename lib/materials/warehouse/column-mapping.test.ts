/**
 * lib/materials/warehouse/column-mapping.test.ts
 * Chạy: node_modules/.bin/sucrase-node lib/materials/warehouse/column-mapping.test.ts
 */
import { guessMapping, headerSignature, emptyMapping } from './column-mapping';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

// ---- bảng giá tiếng Việt điển hình (NCC gạch/đá) ----
{
  const headers = ['Mã SP', 'Tên sản phẩm', 'Hãng', 'ĐVT', 'Đơn giá', 'Rộng', 'Sâu', 'Cao', 'Ghi chú'];
  const m = guessMapping(headers);
  ok('mã → sku', m.sku === 0);
  ok('tên sản phẩm → name', m.name === 1);
  ok('hãng → brand', m.brand === 2);
  ok('ĐVT → unit', m.unit === 3);
  ok('đơn giá → priceVnd', m.priceVnd === 4);
  ok('rộng → w', m.w === 5);
  ok('sâu → d', m.d === 6);
  ok('cao → h → hUp', m.hUp === 7);
  ok('ghi chú → note', m.note === 8);
}

// ---- tiêu đề tiếng Anh ----
{
  const headers = ['SKU', 'Product Name', 'Brand', 'Unit', 'Price', 'Width (mm)', 'Depth (mm)', 'Height (mm)'];
  const m = guessMapping(headers);
  ok('SKU → sku', m.sku === 0);
  ok('Product Name → name', m.name === 1);
  ok('Brand → brand', m.brand === 2);
  ok('Unit → unit', m.unit === 3);
  ok('Price → priceVnd', m.priceVnd === 4);
  ok('Width → w', m.w === 5);
  ok('Depth → d', m.d === 6);
  ok('Height → hUp', m.hUp === 7);
}

// ---- "Đơn vị" và "Đơn giá" không lẫn nhau (cùng chứa "đơn") ----
{
  const headers = ['Đơn vị', 'Đơn giá'];
  const m = guessMapping(headers);
  ok('Đơn vị → unit (không lẫn priceVnd)', m.unit === 0);
  ok('Đơn giá → priceVnd (không lẫn unit)', m.priceVnd === 1);
}

// ---- cột lạ không map vào đâu ----
{
  const headers = ['Cột bí ẩn XYZ', 'Tên'];
  const m = guessMapping(headers);
  ok('cột không khớp field nào → null', m.brand === null && m.sku === null);
  ok('Tên vẫn map đúng dù có cột lạ đứng trước', m.name === 1);
}

// ---- headerSignature ổn định (không phân biệt hoa/thường/dấu, để nhớ mapping đúng NCC) ----
{
  const a = headerSignature(['Mã SP', 'Tên']);
  const b = headerSignature(['mã sp', 'tên']);
  ok('chữ ký không phân biệt hoa/thường', a === b);
  const c = headerSignature(['Mã SP', 'Khác']);
  ok('chữ ký đổi khi tiêu đề đổi', a !== c);
}

ok('emptyMapping mọi field null', Object.values(emptyMapping()).every((v) => v === null));

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
