/**
 * lib/cad/dxf-insert.test.ts — INSERT + BLOCKS (phiếu DXF trên một bộ hồ sơ thật 05/08, VIỆC 1+2).
 * Chạy: `node_modules/.bin/sucrase-node lib/cad/dxf-insert.test.ts`
 *
 * Test DỰNG DXF BẰNG TAY (chuỗi cặp group code) chứ không round-trip qua `exportDxf` — vì
 * `exportDxf` KHÔNG ghi INSERT (phiếu cấm sửa nó), round-trip sẽ không bao giờ chạm tới đường
 * đang test. Mỗi ca đều là hình dạng có thật trong bộ file hồ sơ đã đo.
 */

import { parseDxf, parseDxfEx, cleanDxfText } from './dxf';
import type { Entity } from './model';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean, extra = '') {
  if (cond) { pass++; console.log(`  ok  - ${name}`); }
  else { fail++; console.log(`  FAIL - ${name}${extra ? ` — ${extra}` : ''}`); }
}
const near = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) <= eps;

/** Dựng file DXF tối thiểu: BLOCKS (từ `blocks`) + ENTITIES (từ `entities`). */
function dxf(blocks: string, entities: string): string {
  return [
    '0', 'SECTION', '2', 'BLOCKS', blocks, '0', 'ENDSEC',
    '0', 'SECTION', '2', 'ENTITIES', entities, '0', 'ENDSEC',
    '0', 'EOF',
  ].filter(Boolean).join('\n') + '\n';
}
const block = (name: string, body: string, baseX = 0, baseY = 0) =>
  ['0', 'BLOCK', '8', '0', '2', name, '10', String(baseX), '20', String(baseY), body, '0', 'ENDBLK'].join('\n');
const line = (x1: number, y1: number, x2: number, y2: number, layer = '0') =>
  ['0', 'LINE', '8', layer, '10', String(x1), '20', String(y1), '11', String(x2), '21', String(y2)].join('\n');
const insert = (name: string, x: number, y: number, extra: string[] = [], layer = '0') =>
  ['0', 'INSERT', '8', layer, '2', name, '10', String(x), '20', String(y), ...extra].join('\n');

const lines = (d: { entities: Entity[] }) => d.entities.filter((e) => e.type === 'line') as Extract<Entity, { type: 'line' }>[];

console.log('\n[1] INSERT cơ bản — làm phẳng về world');
{
  const doc = parseDxf(dxf(block('B', line(0, 0, 1000, 0)), insert('B', 5000, 7000)));
  const ls = lines(doc);
  ok('sinh đúng 1 line', ls.length === 1);
  ok('điểm đầu dịch theo điểm chèn', near(ls[0].a.x, 5000) && near(ls[0].a.y, 7000), JSON.stringify(ls[0]?.a));
  ok('điểm cuối dịch theo điểm chèn', near(ls[0].b.x, 6000) && near(ls[0].b.y, 7000));
  ok('giữ tên block gốc (VIỆC 1.5)', ls[0].srcBlock === 'B', String(ls[0].srcBlock));
}

console.log('\n[2] INSERT có XOAY (group 50, độ)');
{
  // quay 90° quanh gốc: (1000,0) → (0,1000)
  const doc = parseDxf(dxf(block('B', line(0, 0, 1000, 0)), insert('B', 0, 0, ['50', '90'])));
  const l = lines(doc)[0];
  ok('90° đưa trục X thành trục Y', near(l.b.x, 0, 1e-9) && near(l.b.y, 1000, 1e-9), JSON.stringify(l.b));
}

console.log('\n[3] INSERT có TỈ LỆ (41/42), kể cả không đều và âm (lật gương)');
{
  const doc = parseDxf(dxf(block('B', line(0, 0, 1000, 500)), insert('B', 0, 0, ['41', '2', '42', '3'])));
  const l = lines(doc)[0];
  ok('tỉ lệ X/Y áp riêng từng trục', near(l.b.x, 2000) && near(l.b.y, 1500), JSON.stringify(l.b));

  const mir = parseDxf(dxf(block('B', line(0, 0, 1000, 0)), insert('B', 0, 0, ['41', '-1', '42', '1'])));
  ok('tỉ lệ âm = lật gương ngang', near(lines(mir)[0].b.x, -1000), JSON.stringify(lines(mir)[0].b));
}

console.log('\n[4] BASE POINT của BLOCK bị trừ trước khi scale/xoay');
{
  // base (1000,0): hình tại x=1000 nằm ĐÚNG điểm chèn, không lệch 1000.
  const doc = parseDxf(dxf(block('B', line(1000, 0, 2000, 0), 1000, 0), insert('B', 5000, 0)));
  const l = lines(doc)[0];
  ok('trừ base point trước', near(l.a.x, 5000) && near(l.b.x, 6000), JSON.stringify([l.a.x, l.b.x]));
}

console.log('\n[5] BLOCK LỒNG BLOCK 2 CẤP — biến đổi phải nhân dồn đúng thứ tự');
{
  //  trong: line (0,0)-(100,0)
  //  giữa : INSERT trong tại (1000,0) xoay 90  ⇒ line (1000,0)-(1000,100)
  //  ngoài: INSERT giữa tại (0,5000) tỉ lệ 2   ⇒ line (2000,5000)-(2000,5200)
  const blocks = [
    block('IN', line(0, 0, 100, 0)),
    block('MID', insert('IN', 1000, 0, ['50', '90'])),
  ].join('\n');
  const doc = parseDxf(dxf(blocks, insert('MID', 0, 5000, ['41', '2', '42', '2'])));
  const l = lines(doc)[0];
  ok('2 cấp lồng: điểm đầu đúng', near(l.a.x, 2000, 1e-6) && near(l.a.y, 5000, 1e-6), JSON.stringify(l.a));
  ok('2 cấp lồng: điểm cuối đúng', near(l.b.x, 2000, 1e-6) && near(l.b.y, 5200, 1e-6), JSON.stringify(l.b));
  ok('nhãn block giữ ĐỊNH NGHĨA TRỰC TIẾP (IN), không phải block ngoài', l.srcBlock === 'IN', String(l.srcBlock));
}

console.log('\n[6] Vòng lặp tự tham chiếu + lồng quá sâu KHÔNG treo');
{
  const blocks = [block('A', insert('B', 0, 0)), block('B', insert('A', 0, 0) + '\n' + line(0, 0, 10, 0))].join('\n');
  const t0 = Date.now();
  const { doc, report } = parseDxfEx(dxf(blocks, insert('A', 0, 0)));
  ok('không treo (dưới 2 giây)', Date.now() - t0 < 2000);
  ok('vẫn nạp được phần hình hợp lệ', lines(doc).length > 0);
  ok('có cảnh báo lồng sâu/vòng lặp', report.warnings.some((w) => w.includes('lồng quá')), JSON.stringify(report.warnings));
}

console.log('\n[7] Block không tra được định nghĩa — cảnh báo, KHÔNG đoán hình (K3)');
{
  const { doc, report } = parseDxfEx(dxf(block('B', line(0, 0, 10, 0)), insert('KHONG-CO', 0, 0)));
  ok('không sinh hình nào cho block thiếu', lines(doc).length === 0);
  ok('báo đúng tên block thiếu', report.warnings.some((w) => w.includes('KHONG-CO')), JSON.stringify(report.warnings));
}

console.log('\n[8] INSERT dạng MẢNG (70/71 số cột/hàng, 44/45 bước)');
{
  const doc = parseDxf(dxf(block('B', line(0, 0, 10, 0)), insert('B', 0, 0, ['70', '3', '71', '2', '44', '1000', '45', '500'])));
  const ls = lines(doc);
  ok('3 cột × 2 hàng = 6 bản sao', ls.length === 6, String(ls.length));
  const xs = [...new Set(ls.map((l) => Math.round(l.a.x)))].sort((a, b) => a - b);
  const ys = [...new Set(ls.map((l) => Math.round(l.a.y)))].sort((a, b) => a - b);
  ok('bước cột đúng 1000mm', JSON.stringify(xs) === JSON.stringify([0, 1000, 2000]), JSON.stringify(xs));
  ok('bước hàng đúng 500mm', JSON.stringify(ys) === JSON.stringify([0, 500]), JSON.stringify(ys));
}
{
  const { doc, report } = parseDxfEx(dxf(block('B', line(0, 0, 10, 0)), insert('B', 0, 0, ['70', '9999', '71', '9999'])));
  ok('mảng phi lý bị chặn, không treo', lines(doc).length === 0);
  ok('có cảnh báo mảng quá lớn', report.warnings.some((w) => w.includes('4096')), JSON.stringify(report.warnings));
}

console.log('\n[9] Layer 0 trong block THỪA KẾ layer của INSERT (quy tắc DXF thật)');
{
  const blocks = block('B', line(0, 0, 10, 0, '0') + '\n' + line(0, 0, 10, 10, 'A-Wall'));
  const doc = parseDxf(dxf(blocks, insert('B', 0, 0, [], 'A-Column')));
  const names = new Map(doc.layers.map((l) => [l.id, l.name]));
  const got = lines(doc).map((l) => names.get(l.layer)).sort();
  ok('hình layer 0 → layer của INSERT; hình có layer riêng thì giữ', JSON.stringify(got) === JSON.stringify(['A-Column', 'A-Wall']), JSON.stringify(got));
}

console.log('\n[10] POLYLINE/VERTEX cũ — gom được (docstring cũ ghi đọc được nhưng THỰC TẾ trả null)');
{
  const poly = [
    '0', 'POLYLINE', '8', '0', '70', '1',
    '0', 'VERTEX', '8', '0', '10', '0', '20', '0',
    '0', 'VERTEX', '8', '0', '10', '1000', '20', '0',
    '0', 'VERTEX', '8', '0', '10', '1000', '20', '1000',
    '0', 'SEQEND',
  ].join('\n');
  const doc = parseDxf(dxf('', poly));
  const pl = doc.entities.filter((e) => e.type === 'polyline') as Extract<Entity, { type: 'polyline' }>[];
  ok('gom VERTEX thành 1 polyline', pl.length === 1, String(pl.length));
  ok('đủ 3 đỉnh', pl[0]?.points.length === 3, String(pl[0]?.points.length));
  ok('đọc cờ đóng (70 bit 1)', pl[0]?.closed === true);
}

console.log('\n[11] Báo cáo nạp — 7 trường (VIỆC 2)');
{
  const { report } = parseDxfEx(dxf(block('B', line(0, 0, 1000, 0, 'A-Wall')), insert('B', 0, 0) + '\n' + line(0, 0, 1, 1, 'A-Dim')));
  ok('entitiesRead tách theo loại', report.entitiesRead.line === 2, JSON.stringify(report.entitiesRead));
  ok('blocksExpanded đếm theo tên block', report.blocksExpanded.B === 1, JSON.stringify(report.blocksExpanded));
  ok('layers đếm theo tên layer', report.layers['A-Wall'] === 1 && report.layers['A-Dim'] === 1, JSON.stringify(report.layers));
  ok('bbox theo mm', !!report.bbox && near(report.bbox.maxX, 1000), JSON.stringify(report.bbox));
  ok('totalEntities khớp', report.totalEntities === 2);
  ok('skipped là object (rỗng khi không bỏ gì)', typeof report.skipped === 'object');
  ok('warnings là mảng', Array.isArray(report.warnings));
}
{
  const { report } = parseDxfEx(dxf('', ['0', 'SPLINE', '8', '0', '10', '0', '20', '0'].join('\n')));
  ok('entity chưa đọc được ĐƯỢC ĐẾM, không im lặng', report.skipped.SPLINE === 1, JSON.stringify(report.skipped));
}

console.log('\n[12] Cảnh báo hình nằm xa vùng vẽ chính (ca thật ở một file sàn: bản sao cách 12 km)');
{
  const { report } = parseDxfEx(dxf('', line(0, 0, 10, 0) + '\n' + line(12_000_000, 0, 12_000_010, 0)));
  ok('bắt được toạ độ vượt 1 km', report.warnings.some((w) => w.includes('1 km')), JSON.stringify(report.warnings));
}

console.log('\n[13] cleanDxfText — mã định dạng MTEXT');
{
  ok('bỏ cặp ngoặc nhóm (ca thật "{474 m2}")', cleanDxfText('{\\fArial|b1|i0|c0|p34;474 m2}') === '474 m2', cleanDxfText('{\\fArial|b1|i0|c0|p34;474 m2}'));
  ok('\\P thành khoảng trắng', cleanDxfText('A\\PB') === 'A B');
  ok('%%d thành độ', cleanDxfText('45%%d') === '45°');
  ok('nối group 3 TRƯỚC group 1', cleanDxfText('SAU', 'TRUOC ') === 'TRUOC SAU');
}

console.log(`\ndxf-insert.test.ts — ${pass} pass, ${fail} fail`);
if (fail) process.exitCode = 1;
