/**
 * lib/colors/larkbase.test.ts — bản ghi Bitable → ColorSource (PULL-ONLY).
 * Chạy: node_modules/.bin/sucrase-node lib/colors/larkbase.test.ts
 */
import { larkTextOf, larkFieldNames, larkRecordsToGrid, mapLarkRecordsToColorSource, type LarkColorRecord } from './larkbase';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

console.log('\n[1] larkTextOf — các shape Bitable trả thật');
{
  ok('chuỗi', larkTextOf('Trắng ngà') === 'Trắng ngà');
  ok('số → chuỗi', larkTextOf(2026) === '2026');
  ok('mảng đoạn văn [{text}]', larkTextOf([{ text: '#f4f1ea' }]) === '#f4f1ea');
  ok('object {text}', larkTextOf({ text: 'S-01' }) === 'S-01');
  ok('SingleSelect {name}', larkTextOf({ name: 'Mờ' }) === 'Mờ');
  ok('null/undefined → rỗng', larkTextOf(null) === '' && larkTextOf(undefined) === '');
  ok('object lạ → rỗng chứ không "[object Object]"', larkTextOf({ foo: 1 }) === '');
}

console.log('\n[2] larkFieldNames — Bitable BỎ HẲN key khi ô trống');
{
  const recs: LarkColorRecord[] = [
    { record_id: 'r1', fields: { 'Tên màu': 'Trắng ngà', Hex: '#f4f1ea' } },
    { record_id: 'r2', fields: { 'Tên màu': 'Xám khói', Hex: '#8d9299', 'Ghi chú': 'nhấn' } },
  ];
  const names = larkFieldNames(recs);
  ok('gộp key của MỌI bản ghi, không chỉ bản ghi đầu (bẫy thật)', names.length === 3 && names.includes('Ghi chú'));
  ok('thứ tự theo lần xuất hiện đầu tiên (bảng chọn không nhảy)',
    JSON.stringify(names) === '["Tên màu","Hex","Ghi chú"]');

  const grid = larkRecordsToGrid(recs);
  ok('ô thiếu → chuỗi rỗng đúng vị trí cột', grid.rows[0][2] === '' && grid.rows[1][2] === 'nhấn');
}

console.log('\n[3] mapLarkRecordsToColorSource — tự đoán cột + dùng CHUNG bộ kiểm với CSV');
{
  const recs: LarkColorRecord[] = [
    { record_id: 'r1', fields: { 'Tên màu': 'Trắng ngà', 'Mã màu': 'S-01', Hex: [{ text: '#F4F1EA' }], Hãng: 'Nội bộ' } },
    { record_id: 'r2', fields: { 'Tên màu': 'Hỏng', 'Mã màu': 'S-02', Hex: 'xanh' } },
    { record_id: 'r3', fields: { 'Tên màu': 'Xanh rêu', 'Mã màu': 'S-03', Hex: '4a5d4e' } },
  ];
  const r = mapLarkRecordsToColorSource(recs, { id: 'lark_1', name: 'Bảng Lark', scope: 'studio', now: 7 });
  ok('đoán được cột hex/tên/mã từ tên field tiếng Việt',
    r.mapping.hex !== null && r.mapping.name !== null && r.mapping.code !== null);
  ok('2 màu hợp lệ', r.source.colors.length === 2);
  ok('hex chuẩn hoá (kể cả khi Lark trả [{text}]) ', r.source.colors[0].hex === '#f4f1ea');
  ok('hex không dấu # vẫn nhận', r.source.colors[1].hex === '#4a5d4e');
  ok('1 dòng lỗi, đúng dòng thứ 2 của bảng (row 3)', r.errors.length === 1 && r.errors[0].row === 3);
  ok('origin = larkbase', r.source.origin === 'larkbase');
  ok('LAB được lưu', typeof r.source.colors[0].lab.L === 'number');
  ok('trả về fieldNames để IF dựng bảng ghép cột (Hoà không mở được UI Lark)', r.fieldNames.length === 4);
}

console.log('\n[4] mapLarkRecordsToColorSource — mapping do người dùng chốt thắng đoán tự động');
{
  const recs: LarkColorRecord[] = [
    { record_id: 'r1', fields: { A: 'Trắng ngà', B: '#ffffff' } },
  ];
  const auto = mapLarkRecordsToColorSource(recs, { id: 'x', name: 'x', scope: 'studio', now: 1 });
  ok('tên cột vô nghĩa → đoán hụt, 0 màu (không bịa)', auto.source.colors.length === 0);

  const manual = mapLarkRecordsToColorSource(recs, {
    id: 'x', name: 'x', scope: 'studio', now: 1,
    mapping: { name: 0, code: null, hex: 1, brand: null, note: null },
  });
  ok('người dùng ghép tay trong IF → vào đúng 1 màu', manual.source.colors.length === 1 && manual.source.colors[0].hex === '#ffffff');
}

console.log('\n[5] PULL-ONLY — module không có đường ghi ngược');
{
  const mod = require('./larkbase') as Record<string, unknown>;
  const writers = Object.keys(mod).filter((k) => /^(push|write|create|update|delete|sync)/i.test(k));
  ok(`0 hàm ghi ngược Lark (thấy: ${writers.join(', ') || 'không có'})`, writers.length === 0);
}

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
