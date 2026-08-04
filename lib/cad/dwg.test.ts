/**
 * lib/cad/dwg.test.ts — P1 (bug đỏ STATUS.md 2.1.6.d "nhập DWG treo vĩnh viễn"): các hàm THUẦN
 * mới thêm cho timeout/tiến độ/thông báo lỗi khi nhập DWG (`describeDwgHeader`/`dwgTimeoutMessage`/
 * `dwgCancelledMessage`/`dwgProgressMessage`, sống ở `dwg-map.ts` — KHÔNG test được `openDwgFile`
 * chính nó ở đây vì `dwg.ts` chứa `import.meta.url` (khởi tạo Worker), không require được dưới
 * sucrase-node, xem docstring đầu `dwg-map.ts`/`dwg.ts`).
 * Chạy: node_modules/.bin/sucrase-node lib/cad/dwg.test.ts
 */
import {
  describeDwgHeader,
  dwgTimeoutMessage,
  dwgCancelledMessage,
  dwgProgressMessage,
  DEFAULT_DWG_IMPORT_TIMEOUT_MS,
} from './dwg-map';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

function bufFromString(s: string): ArrayBuffer {
  return new TextEncoder().encode(s).buffer;
}

console.log('describeDwgHeader — nhận diện phiên bản quen thuộc');
{
  ok('AC1032 → AutoCAD 2018–2024', describeDwgHeader(bufFromString('AC1032rest-of-file')).includes('AutoCAD 2018–2024'));
  ok('AC1015 → AutoCAD 2000–2002', describeDwgHeader(bufFromString('AC1015rest')).includes('AutoCAD 2000–2002'));
  ok('giữ nguyên chữ ký trong câu trả về', describeDwgHeader(bufFromString('AC1032xxxxxx')).includes('AC1032'));
}

console.log('describeDwgHeader — phiên bản lạ/không hợp lệ, KHÔNG đoán bừa tên');
{
  const weird = describeDwgHeader(bufFromString('AC9999xxxxxx'));
  ok('mã lạ vẫn hiện nguyên chữ ký', weird.includes('AC9999'));
  ok('mã lạ ghi rõ "chưa rõ tên", không bịa', weird.includes('chưa rõ tên'));

  const notDwg = describeDwgHeader(bufFromString('%PDF-1.7 fake'));
  ok('không phải DWG → báo rõ không hợp lệ', notDwg.includes('không phải DWG hợp lệ'));

  const tooShort = describeDwgHeader(new ArrayBuffer(3));
  ok('file quá ngắn (<6 byte) → báo rõ, không sập', tooShort.includes('quá ngắn'));
}

console.log('dwgTimeoutMessage — chứa đủ tên file, kích thước, phiên bản, giai đoạn — không nuốt lỗi');
{
  const msg = dwgTimeoutMessage({ name: 'du-an-lon.dwg', size: 21_579_995 }, 60_000, 'converting', 'AC1032 · AutoCAD 2018–2024');
  ok('có tên file', msg.includes('du-an-lon.dwg'));
  ok('có kích thước (MB, làm tròn 1 số lẻ)', msg.includes('20.6 MB'));
  ok('có phiên bản DWG', msg.includes('AC1032'));
  ok('có số giây timeout', msg.includes('60s'));
  ok('có nhắc đúng giai đoạn đang chạy (convertEx)', msg.includes('chuyển đổi entity'));
  ok('không phải câu chung chung — đủ dài để chứa ngữ cảnh thật', msg.length > 80);
}

console.log('dwgTimeoutMessage — giai đoạn "reading" ghi khác giai đoạn "converting" (không dùng chung 1 câu mập mờ)');
{
  const reading = dwgTimeoutMessage({ name: 'a.dwg', size: 1000 }, 60_000, 'reading', 'AC1015 · AutoCAD 2000–2002');
  const converting = dwgTimeoutMessage({ name: 'a.dwg', size: 1000 }, 60_000, 'converting', 'AC1015 · AutoCAD 2000–2002');
  ok('2 giai đoạn cho 2 câu khác nhau', reading !== converting);
}

console.log('dwgCancelledMessage — ngắn gọn, có tên file, không lẫn với lỗi timeout');
{
  const msg = dwgCancelledMessage({ name: 'ban-ve.dwg' });
  ok('có tên file', msg.includes('ban-ve.dwg'));
  ok('nói rõ là HUỶ theo yêu cầu, không phải lỗi', msg.includes('Đã huỷ'));
}

console.log('dwgProgressMessage — có elapsed giây, đổi theo giai đoạn');
{
  const at3s = dwgProgressMessage({ name: 'x.dwg' }, 'converting', 3400);
  ok('làm tròn giây (3400ms → "3s")', at3s.includes('3s'));
  ok('có tên file', at3s.includes('x.dwg'));
  const spawning = dwgProgressMessage({ name: 'x.dwg' }, 'spawning', 100);
  ok('giai đoạn khác nhau ra câu khác nhau', spawning !== at3s);
}

console.log('DEFAULT_DWG_IMPORT_TIMEOUT_MS — đúng đề xuất 60s, lớn hơn case chậm nhất đo thật (39s)');
{
  ok('60 000ms', DEFAULT_DWG_IMPORT_TIMEOUT_MS === 60_000);
  ok('dư ra so với 39s đo thật (file 21MB)', DEFAULT_DWG_IMPORT_TIMEOUT_MS > 39_000);
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
