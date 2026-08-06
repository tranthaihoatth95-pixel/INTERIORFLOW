/**
 * lib/cad/dxf-export-report.test.ts — VIỆC 1 phiếu S1 (05/08): `exportDxf` LÀM PHẲNG BLOCK MÀ
 * KHÔNG BÁO.
 *
 * Ca bệnh: section BLOCKS mà `exportDxf` ghi ra chỉ có boilerplate `*Model_Space`/`*Paper_Space`
 * + block ẩn danh `*Dn` cho DIMENSION (`dxf.ts`, khối "// BLOCKS —"). Không có đường nào ghi lại
 * INSERT của người dùng. Mở file có block → xuất lại → **hình còn, cấu trúc block mất**, và
 * trước phiên này app không nói một câu nào. Đây là lỗi im lặng làm mất dữ liệu.
 *
 * File này khoá 3 điều:
 *  [1] Doc KHÔNG có block → báo cáo sạch, KHÔNG doạ người dùng vô cớ.
 *  [2] Doc CÓ entity đến từ block → có cảnh báo, đếm đúng, nêu đúng hậu quả.
 *  [3] `exportDxf(doc)` giữ nguyên chữ ký `=> string` và ra ĐÚNG chuỗi cũ (không phá ~mọi nơi gọi).
 *
 * §0h — dữ liệu HƯ CẤU. Tên block đặt bằng chữ cái, không lấy từ hồ sơ khách nào.
 *
 * Chạy: node_modules/.bin/sucrase-node lib/cad/dxf-export-report.test.ts
 */
import { exportDxf, exportDxfEx } from './dxf';
import type { Doc, Entity, Layer } from './model';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean, extra = '') {
  if (cond) { pass++; console.log(`  ok  - ${name}`); }
  else { fail++; console.log(`  FAIL - ${name}${extra ? ` — ${extra}` : ''}`); }
}

const layers: Layer[] = [{ id: 'l0', name: '0', color: '#ffffff', visible: true, locked: false }];
let n = 0;
const line = (srcBlock?: string): Entity => ({
  id: `e${++n}`, type: 'line', layer: 'l0',
  a: { x: 0, y: 0 }, b: { x: 1000, y: 500 },
  ...(srcBlock !== undefined ? { srcBlock } : {}),
});
const doc = (entities: Entity[]): Doc => ({ entities, layers });

console.log('\n[1] Bản vẽ KHÔNG có block → không cảnh báo suông');
{
  const { report } = exportDxfEx(doc([line(), line(), line()]));
  ok('0 tên block', report.flattenedBlockCount === 0, String(report.flattenedBlockCount));
  ok('bảng đếm rỗng', Object.keys(report.flattenedBlocks).length === 0);
  ok('KHÔNG có cảnh báo (không doạ người dùng vô cớ)', report.warnings.length === 0, JSON.stringify(report.warnings));
}

console.log('\n[2] Bản vẽ CÓ block → phải nói ra là bản xuất đã làm phẳng');
{
  const { report } = exportDxfEx(doc([
    line('KHUNG-TEN'), line('KHUNG-TEN'), line('GHE-A'), line(), // 1 entity vẽ tay, không thuộc block
  ]));
  ok('đếm đúng 2 tên block', report.flattenedBlockCount === 2, String(report.flattenedBlockCount));
  ok('đếm đúng số entity mỗi block', report.flattenedBlocks['KHUNG-TEN'] === 2 && report.flattenedBlocks['GHE-A'] === 1,
    JSON.stringify(report.flattenedBlocks));
  ok('entity vẽ tay KHÔNG bị tính vào block nào',
    Object.values(report.flattenedBlocks).reduce((s, v) => s + v, 0) === 3);

  const w = report.warnings.join(' ');
  ok('có đúng 1 cảnh báo', report.warnings.length === 1, String(report.warnings.length));
  ok('nêu SỐ block', w.includes('2 block'), w);
  ok('nói rõ ĐÃ LÀM PHẲNG', w.includes('làm phẳng'), w);
  ok('nói rõ HẬU QUẢ khi mở lại (mất cấu trúc block)', /không còn\s+cấu trúc block/.test(w), w);
  ok('trấn an đúng phần KHÔNG mất (hình vẽ)', w.includes('Hình vẽ giữ nguyên'), w);
  ok('nêu tên block để đối chiếu với file gốc', w.includes('KHUNG-TEN') && w.includes('GHE-A'), w);
  ok('KHÔNG lộ tên field/hàm nội bộ', !w.includes('srcBlock') && !w.includes('exportDxf'), w);
}

console.log('\n[3] Nhiều block → cắt bớt tên, không đổ nguyên danh sách vào câu');
{
  const names = ['B01', 'B02', 'B03', 'B04', 'B05'];
  const { report } = exportDxfEx(doc(names.map((nm) => line(nm))));
  const w = report.warnings[0] ?? '';
  ok('vẫn đếm đủ 5', report.flattenedBlockCount === 5, String(report.flattenedBlockCount));
  ok('chỉ nêu 3 tên đầu', w.includes('B01') && w.includes('B03') && !w.includes('B04'), w);
  ok('nói rõ còn bao nhiêu block nữa', w.includes('2 block nữa'), w);
}

console.log('\n[4] Chữ ký cũ `exportDxf(doc) => string` KHÔNG đổi');
{
  const d = doc([line('B'), line()]);
  const s = exportDxf(d);
  ok('vẫn trả string', typeof s === 'string');
  ok('giống hệt chuỗi của bản đầy đủ', s === exportDxfEx(d).dxf);
  ok('vẫn là DXF hợp lệ (mở SECTION, đóng EOF)', s.startsWith('0\nSECTION') && s.trimEnd().endsWith('EOF'), s.slice(0, 20));
  ok('vẫn ghi đủ 4 section', ['HEADER', 'TABLES', 'BLOCKS', 'ENTITIES'].every((sec) => s.includes(`\n${sec}\n`)));
}

console.log(`\ndxf-export-report.test.ts — ${pass} pass, ${fail} fail`);
if (fail) process.exitCode = 1;
