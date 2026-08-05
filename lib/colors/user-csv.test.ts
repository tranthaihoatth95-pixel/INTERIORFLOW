/**
 * lib/colors/user-csv.test.ts — parser văn bản dán (clipboard) + mẫu CSV tải về.
 * Chạy: node_modules/.bin/sucrase-node lib/colors/user-csv.test.ts
 */
import { parseDelimitedText, COLOR_CSV_TEMPLATE } from './user-csv';
import { guessColorMapping, buildColorSource } from './build';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

console.log('\n[1] parseDelimitedText — dò dấu phân cách');
{
  const tsv = parseDelimitedText('Tên màu\tHex\nTrắng ngà\t#f4f1ea');
  ok('TAB (dán từ Excel/Sheets)', tsv.headers.length === 2 && tsv.rows[0][1] === '#f4f1ea');

  const csv = parseDelimitedText('Tên màu,Hex\nTrắng ngà,#f4f1ea');
  ok('PHẨY', csv.headers.length === 2 && csv.rows[0][0] === 'Trắng ngà');

  const scsv = parseDelimitedText('Tên màu;Hex\nTrắng ngà;#f4f1ea');
  ok('CHẤM PHẨY (Excel locale VN)', scsv.headers.length === 2 && scsv.rows[0][1] === '#f4f1ea');

  const one = parseDelimitedText('Hex\n#ffffff');
  ok('1 cột, không có dấu phân cách nào → không vỡ', one.headers[0] === 'Hex' && one.rows[0][0] === '#ffffff');
}

console.log('\n[2] parseDelimitedText — ô trong nháy kép');
{
  const g = parseDelimitedText('name,note\n"Xám, khói","Ghi ""chú"" trong nháy"');
  ok('dấu phẩy TRONG nháy không tách ô', g.rows[0][0] === 'Xám, khói');
  ok('"" là một dấu nháy', g.rows[0][1] === 'Ghi "chú" trong nháy');

  const multi = parseDelimitedText('name,note\n"Trắng","dòng 1\ndòng 2"');
  ok('ô nhiều dòng không cắt thành 2 hàng', multi.rows.length === 1 && multi.rows[0][1] === 'dòng 1\ndòng 2');
}

console.log('\n[3] parseDelimitedText — rác lặt vặt');
{
  ok('BOM ở đầu bị bỏ', parseDelimitedText('﻿Hex\n#fff').headers[0] === 'Hex');
  ok('CRLF không để lại \\r', parseDelimitedText('a,b\r\n1,2').rows[0][1] === '2');
  ok('dòng trắng giữa bảng bị bỏ', parseDelimitedText('a\n1\n\n2').rows.length === 2);
  ok('dòng thiếu ô → điền rỗng theo số cột tiêu đề',
    JSON.stringify(parseDelimitedText('a,b,c\n1,2').rows[0]) === '["1","2",""]');
  ok('chuỗi rỗng không sập', parseDelimitedText('').rows.length === 0);
}

console.log('\n[4] Mẫu CSV tải về');
{
  const g = parseDelimitedText(COLOR_CSV_TEMPLATE);
  const mapping = guessColorMapping(g.headers);
  ok('mẫu có đủ 5 cột theo phiếu (name, code, hex, brand, note)',
    JSON.stringify(g.headers) === '["name","code","hex","brand","note"]');
  ok('IF tự đoán được 5/5 cột của chính mẫu mình phát ra',
    mapping.name === 0 && mapping.code === 1 && mapping.hex === 2 && mapping.brand === 3 && mapping.note === 4);

  const { source, errors } = buildColorSource({
    ...g, mapping, id: 't', name: 'Mẫu', origin: 'user-csv', scope: 'studio', now: 1,
  });
  ok('mẫu nạp lại được, 0 dòng lỗi (mẫu phát ra phải tự nuốt được)', errors.length === 0);
  ok('mẫu có 3 màu ví dụ', source.colors.length === 3);
  ok('mẫu KHÔNG mang tên/mã hãng nào (LUẬT NỀN TẢNG)',
    source.colors.every((c) => !c.brand) && !/dulux|jotun|pantone|ral|nippon|kova|toa/i.test(COLOR_CSV_TEMPLATE));
}

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
