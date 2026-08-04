/**
 * lib/materials/warehouse/image-match.test.ts
 * Chạy: node_modules/.bin/sucrase-node lib/materials/warehouse/image-match.test.ts
 * Node ≥20 có global `File` (undici) — không cần jsdom cho test này.
 */
import { matchImagesBySku } from './image-match';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

function fakeFile(name: string): File {
  return new File(['x'], name, { type: 'image/jpeg' });
}

// ---- khớp đúng theo tên file == SKU (bỏ đuôi, không phân biệt hoa/thường) ----
{
  const files = [fakeFile('GACH-01.jpg'), fakeFile('gach-02.PNG'), fakeFile('readme.txt')];
  const map = matchImagesBySku(files, ['GACH-01', 'GACH-02', 'GACH-03']);
  ok('khớp đúng hoa/thường', map.get('GACH-01')?.name === 'GACH-01.jpg');
  ok('khớp không phân biệt hoa/thường', map.get('GACH-02')?.name === 'gach-02.PNG');
  ok('SKU không có ảnh → không có trong map', !map.has('GACH-03'));
  ok('file không phải ảnh (readme.txt) bị bỏ qua', map.size === 2);
}

// ---- webkitdirectory trả đường dẫn có "/" — chỉ so tên file, không so cả path ----
{
  const files = [fakeFile('sub-folder/SP-9.jpg')];
  const map = matchImagesBySku(files, ['SP-9']);
  ok('bỏ qua phần thư mục trong path, chỉ so tên file', map.get('SP-9')?.name === 'sub-folder/SP-9.jpg');
}

// ---- SKU rỗng không khớp bừa ----
{
  const files = [fakeFile('.jpg')];
  const map = matchImagesBySku(files, ['', '  ']);
  ok('SKU rỗng/toàn khoảng trắng không khớp gì', map.size === 0);
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
