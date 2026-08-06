/**
 * lib/cad/dxf-reblock.test.ts — A1·A2·A3, GAP `G-M1-06` + `G-M1-07`.
 *
 *  A1  `srcInsertId` — danh tính TỪNG BẢN CHÈN (không phải tên block).
 *  A2  `expandIdsByInsertGroup()` — chọn 1 hình = cầm cả cụm, KHÔNG lem sang bản chèn khác.
 *  A3  `exportDxfEx()` ghi lại BLOCK + INSERT, và vòng xuất–nạp không rơi hình/layer.
 *
 * Dựng DXF BẰNG TAY (chuỗi cặp group code), cùng khuôn `dxf-insert.test.ts`. §0h — dữ liệu hư cấu.
 *
 * Chạy: node_modules/.bin/sucrase-node lib/cad/dxf-reblock.test.ts
 */
import { parseDxf, parseDxfEx, exportDxfEx } from './dxf';
import { expandIdsByInsertGroup, parentInsertId, insertIdAncestors, entityGeomSignature } from './model';
import type { Doc, Entity } from './model';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean, extra = '') {
  if (cond) { pass++; console.log(`  ok  - ${name}`); }
  else { fail++; console.log(`  FAIL - ${name}${extra ? ` — ${extra}` : ''}`); }
}

function dxf(blocks: string, entities: string): string {
  return [
    '0', 'SECTION', '2', 'BLOCKS', blocks, '0', 'ENDSEC',
    '0', 'SECTION', '2', 'ENTITIES', entities, '0', 'ENDSEC',
    '0', 'EOF',
  ].filter(Boolean).join('\n') + '\n';
}
const block = (name: string, body: string) =>
  ['0', 'BLOCK', '8', '0', '2', name, '10', '0', '20', '0', body, '0', 'ENDBLK'].join('\n');
const line = (x1: number, y1: number, x2: number, y2: number, layer = '0') =>
  ['0', 'LINE', '8', layer, '10', String(x1), '20', String(y1), '11', String(x2), '21', String(y2)].join('\n');
const circle = (x: number, y: number, r: number, layer = '0') =>
  ['0', 'CIRCLE', '8', layer, '10', String(x), '20', String(y), '40', String(r)].join('\n');
const insert = (name: string, x: number, y: number, extra: string[] = [], layer = '0') =>
  ['0', 'INSERT', '8', layer, '2', name, '10', String(x), '20', String(y), ...extra].join('\n');

/** "Vân tay" của cả Doc để so vòng xuất–nạp: số entity · số layer · từng loại hình · từng layer. */
function docFingerprint(doc: Doc) {
  const nameOf = new Map(doc.layers.map((l) => [l.id, l.name]));
  const byType: Record<string, number> = {};
  const byLayer: Record<string, number> = {};
  for (const e of doc.entities) {
    byType[e.type] = (byType[e.type] ?? 0) + 1;
    const nm = nameOf.get(e.layer) ?? e.layer;
    byLayer[nm] = (byLayer[nm] ?? 0) + 1;
  }
  return { total: doc.entities.length, layers: doc.layers.length, byType, byLayer };
}
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Khoá hình học SO ĐƯỢC QUA VÒNG XUẤT–NẠP. Làm tròn 1e-6 mm (1 nanomet) có chủ đích: bản chèn
 * không-chuẩn được ghi lại bằng phép biến đổi TÌM LẠI bằng bình phương tối thiểu (`solveSimilarity`),
 * nên toạ độ về sai khác cỡ 1e-10 mm so với đường nhân ma trận gốc. So chuỗi thô sẽ trượt vì
 * chuyện đó — mà 1e-10 mm thì không có thật trong bất kỳ bản vẽ nào.
 */
function geomKeys(d: Doc): string {
  const r = (v: number) => Math.round(v * 1e6) / 1e6;
  return d.entities
    .map((e) => entityGeomSignature(e).replace(/-?\d+(\.\d+)?(e-?\d+)?/g, (m) => String(r(parseFloat(m)))))
    .sort()
    .join('\n');
}
const countInserts = (s: string) => (s.match(/^INSERT$/gm) ?? []).length;

console.log('\n[1] A1 — MỘT tên block chèn NHIỀU lần ⇒ NHIỀU danh tính tách rời');
{
  const body = line(0, 0, 100, 0) + '\n' + line(100, 0, 100, 100);
  const inserts: string[] = [];
  for (let i = 0; i < 18; i++) inserts.push(insert('GHE', i * 1000, 0));
  const doc = parseDxf(dxf(block('GHE', body), inserts.join('\n')));

  ok('36 hình phẳng (18 bản × 2 đường)', doc.entities.length === 36, String(doc.entities.length));
  ok('tất cả CÙNG một srcBlock (đúng như trước — đó là gốc bệnh)',
    new Set(doc.entities.map((e) => e.srcBlock)).size === 1);
  const ids = new Set(doc.entities.map((e) => e.srcInsertId));
  ok('nhưng ra ĐÚNG 18 danh tính bản chèn', ids.size === 18, String(ids.size));
  ok('mỗi bản chèn đúng 2 hình',
    [...ids].every((id) => doc.entities.filter((e) => e.srcInsertId === id).length === 2));
}

console.log('\n[2] A1 — mỗi Ô của INSERT dạng MẢNG là MỘT bản chèn riêng');
{
  const doc = parseDxf(dxf(block('B', line(0, 0, 10, 0)),
    insert('B', 0, 0, ['70', '3', '71', '2', '44', '1000', '45', '500'])));
  ok('6 hình (3 cột × 2 hàng)', doc.entities.length === 6, String(doc.entities.length));
  ok('6 danh tính khác nhau', new Set(doc.entities.map((e) => e.srcInsertId)).size === 6,
    JSON.stringify(doc.entities.map((e) => e.srcInsertId)));
  ok('mảng 1×1 KHÔNG đẻ hậu tố rác',
    !parseDxf(dxf(block('B', line(0, 0, 10, 0)), insert('B', 0, 0))).entities[0].srcInsertId!.includes('#'));
}

console.log('\n[3] A1 — block LỒNG: bản chèn con truy được về bản chèn cha');
{
  const blocks = [block('IN', line(0, 0, 100, 0)), block('MID', insert('IN', 1000, 0) + '\n' + line(0, 0, 5, 5))].join('\n');
  const doc = parseDxf(dxf(blocks, insert('MID', 0, 0) + '\n' + insert('MID', 9000, 0)));
  const child = doc.entities.find((e) => e.srcBlock === 'IN')!;
  const parentOfChild = parentInsertId(child.srcInsertId!);
  const sibling = doc.entities.find((e) => e.srcBlock === 'MID' && e.srcInsertId === parentOfChild);
  ok('có cha', parentOfChild !== undefined, String(child.srcInsertId));
  ok('cha là ĐÚNG bản chèn MID cùng cụm', !!sibling, `${child.srcInsertId} → ${parentOfChild}`);
  ok('2 bản chèn MID ⇒ 2 chuỗi cha khác nhau',
    new Set(doc.entities.filter((e) => e.srcBlock === 'IN').map((e) => parentInsertId(e.srcInsertId!))).size === 2);
  ok('chuỗi tổ tiên đi được tới cấp ngoài cùng', insertIdAncestors(child.srcInsertId!).length === 1);
}

console.log('\n[4] A2 — chọn 1 hình ⇒ nở đúng CỤM của nó, KHÔNG lem sang bản chèn khác');
{
  const body = line(0, 0, 100, 0) + '\n' + line(100, 0, 100, 100) + '\n' + circle(50, 50, 20);
  const inserts: string[] = [];
  for (let i = 0; i < 18; i++) inserts.push(insert('GHE', i * 1000, 0));
  const doc = parseDxf(dxf(block('GHE', body), inserts.join('\n')));

  const target = doc.entities[7 * 3 + 1]; // một đường của bản chèn thứ 8
  const grown = expandIdsByInsertGroup([target.id], doc);
  ok('nở ra đúng 3 hình', grown.length === 3, String(grown.length));
  ok('cả 3 cùng một bản chèn',
    new Set(grown.map((id) => doc.entities.find((e) => e.id === id)!.srcInsertId)).size === 1);
  ok('ĐÚNG bản chèn của hình đã bấm',
    doc.entities.find((e) => e.id === grown[0])!.srcInsertId === target.srcInsertId);
  ok('KHÔNG lem sang 17 bản chèn còn lại (52 hình kia không dính)', grown.length < doc.entities.length);

  ok('id không thuộc bản chèn nào thì giữ nguyên, không mất',
    expandIdsByInsertGroup(['khong-co-that'], doc).join() === 'khong-co-that');

  // Block LỒNG: MẶC ĐỊNH chỉ cầm bản chèn của chính hình đó — KHÔNG leo lên cha (xem lý do đo
  // được trên hồ sơ thật ở docstring `expandIdsByInsertGroup`). Leo lên cha là TUỲ CHỌN.
  const blocks = [block('IN', line(0, 0, 100, 0)), block('MID', insert('IN', 1000, 0) + '\n' + line(0, 0, 5, 5))].join('\n');
  const nested = parseDxf(dxf(blocks, insert('MID', 0, 0) + '\n' + insert('MID', 9000, 0)));
  const inner = nested.entities.find((e) => e.srcBlock === 'IN')!;
  ok('mặc định: bấm hình con chỉ cầm bản chèn con (1 hình)',
    expandIdsByInsertGroup([inner.id], nested).length === 1,
    String(expandIdsByInsertGroup([inner.id], nested).length));
  const g2 = expandIdsByInsertGroup([inner.id], nested, { outermost: true });
  ok('{outermost:true}: bấm hình con ⇒ cầm cả cụm cha (2 hình)', g2.length === 2, String(g2.length));
  ok('vẫn KHÔNG lem sang cụm MID thứ hai', g2.length === 2 && nested.entities.length === 4);
}

console.log('\n[5] A3 — xuất lại CÓ INSERT, và vòng xuất–nạp khớp 100%');
{
  const body = line(0, 0, 1000, 0, 'A-Wall') + '\n' + line(1000, 0, 1000, 500, 'A-Wall') + '\n' + circle(500, 250, 120, 'A-Column');
  const inserts: string[] = [];
  for (let i = 0; i < 18; i++) inserts.push(insert('CUM', i * 3000, 0, ['50', String(i * 5)]));
  const before = parseDxf(dxf(block('CUM', body), inserts.join('\n') + '\n' + line(-5000, -5000, -4000, -5000, 'A-Wall')));

  const { dxf: text, report } = exportDxfEx(before);
  ok('trước A3 con số này là 0 — nay INSERT > 0', countInserts(text) > 0, String(countInserts(text)));
  ok('đúng 18 INSERT', report.insertsWritten === 18, String(report.insertsWritten));
  ok('CHỈ 1 định nghĩa BLOCK dùng chung cho cả 18 bản (đúng giá trị của block)',
    report.blockDefsWritten === 1, String(report.blockDefsWritten));
  ok('báo cáo đếm đúng số bản chèn giữ được', report.preservedBlocks.CUM === 18, JSON.stringify(report.preservedBlocks));
  ok('KHÔNG còn cảnh báo làm phẳng cho block đã cứu được', report.warnings.length === 0, JSON.stringify(report.warnings));

  const after = parseDxf(text);
  const fa = docFingerprint(before);
  const fb = docFingerprint(after);
  ok(`tổng entity khớp (${fa.total})`, fa.total === fb.total, `${fa.total} → ${fb.total}`);
  ok(`số layer khớp (${fa.layers})`, fa.layers === fb.layers, `${fa.layers} → ${fb.layers}`);
  ok('từng LOẠI HÌNH khớp 100%', same(fa.byType, fb.byType), `${JSON.stringify(fa.byType)} → ${JSON.stringify(fb.byType)}`);
  ok('từng LAYER khớp 100%', same(fa.byLayer, fb.byLayer), `${JSON.stringify(fa.byLayer)} → ${JSON.stringify(fb.byLayer)}`);

  // Hình học phải TRÙNG KHÍT, không chỉ đúng số đếm.
  ok('hình học từng entity trùng khít', geomKeys(before) === geomKeys(after));
}

console.log('\n[6] A3 — lật gương + phóng tỉ lệ vẫn quy về MỘT định nghĩa');
{
  const body = line(0, 0, 1000, 0) + '\n' + line(0, 0, 0, 400);
  const doc = parseDxf(dxf(block('C', body), [
    insert('C', 0, 0),
    insert('C', 5000, 0, ['41', '-1', '42', '1']),      // lật gương ngang
    insert('C', 9000, 0, ['41', '2', '42', '2', '50', '30']), // phóng đều + xoay
  ].join('\n')));
  const { dxf: text, report } = exportDxfEx(doc);
  ok('3 INSERT', report.insertsWritten === 3, String(report.insertsWritten));
  ok('vẫn chỉ 1 định nghĩa BLOCK', report.blockDefsWritten === 1, String(report.blockDefsWritten));
  const back = parseDxf(text);
  ok('nạp lại đủ 6 hình', back.entities.length === 6, String(back.entities.length));
  ok('hình học trùng khít sau lật/phóng/xoay', geomKeys(doc) === geomKeys(back));
}

console.log('\n[7] A3 — co giãn KHÔNG ĐỀU: không quy chung được thì cấp định nghĩa RIÊNG, vẫn là block');
{
  const doc = parseDxf(dxf(block('D', line(0, 0, 1000, 0) + '\n' + line(0, 0, 0, 400)), [
    insert('D', 0, 0),
    insert('D', 5000, 0, ['41', '3', '42', '1']),
  ].join('\n')));
  const { dxf: text, report } = exportDxfEx(doc);
  ok('2 định nghĩa BLOCK (không ép chung sai hình)', report.blockDefsWritten === 2, String(report.blockDefsWritten));
  ok('vẫn 2 INSERT — không hình nào bị làm phẳng', report.insertsWritten === 2, String(report.insertsWritten));
  ok('tên block thứ hai không đụng tên', /^D_2$/m.test(text));
  ok('hình học trùng khít', geomKeys(doc) === geomKeys(parseDxf(text)));
}

console.log('\n[8] A3 — hình ĐÃ BỊ SỬA thì ghi phẳng, phần còn lại vẫn thành block');
{
  const body = line(0, 0, 1000, 0) + '\n' + line(1000, 0, 1000, 500);
  const doc = parseDxf(dxf(block('E', body), [insert('E', 0, 0), insert('E', 5000, 0)].join('\n')));
  // Mô phỏng đúng điều `store.ts` `updateEntities` làm khi người dùng dời 1 đường: gỡ srcInsertId.
  const moved = doc.entities.map((e, i) => (i === 0
    ? ({ ...e, a: { x: 77, y: 77 }, srcInsertId: undefined } as Entity)
    : e));
  const { dxf: text, report } = exportDxfEx({ ...doc, entities: moved });
  ok('hình đã sửa bị tính là LÀM PHẲNG', report.flattenedBlocks.E === 1, JSON.stringify(report.flattenedBlocks));
  ok('vẫn có cảnh báo cho đúng phần bị phẳng', report.warnings.length === 1, JSON.stringify(report.warnings));
  ok('phần chưa đụng vẫn còn INSERT', report.insertsWritten >= 1, String(report.insertsWritten));
  const back = parseDxf(text);
  ok('không rơi hình nào', back.entities.length === 4, String(back.entities.length));
  ok('hình đã dời giữ đúng vị trí mới',
    back.entities.some((e) => e.type === 'line' && e.a.x === 77 && e.a.y === 77));
}

console.log('\n[9] A3 — "vân tay hình học": đổi màu/ngữ nghĩa KHÔNG làm hình rời block, dời thì có');
{
  const e: Entity = { id: 'x', type: 'line', layer: 'l0', a: { x: 0, y: 0 }, b: { x: 10, y: 0 } };
  ok('đổi màu → vân tay không đổi', entityGeomSignature({ ...e, color: '#f00' }) === entityGeomSignature(e));
  ok('gán elementType → vân tay không đổi', entityGeomSignature({ ...e, elementType: 'wall' }) === entityGeomSignature(e));
  ok('dời điểm → vân tay ĐỔI', entityGeomSignature({ ...e, b: { x: 11, y: 0 } }) !== entityGeomSignature(e));
}

console.log('\n[10] A3 — bản vẽ KHÔNG có block: không đẻ INSERT, không cảnh báo suông');
{
  const doc = parseDxf(dxf('', line(0, 0, 100, 0) + '\n' + line(0, 0, 0, 100)));
  const { dxf: text, report } = exportDxfEx(doc);
  ok('0 INSERT', report.insertsWritten === 0 && countInserts(text) === 0);
  ok('0 định nghĩa block', report.blockDefsWritten === 0);
  ok('0 cảnh báo', report.warnings.length === 0, JSON.stringify(report.warnings));
}

console.log('\n[11] Chữ ký cũ + DIMENSION không bị đụng');
{
  // Block ẩn danh `*Dn` của DIMENSION có đường ghi riêng — A3 phải bỏ qua, không cướp tên.
  const doc: Doc = {
    layers: [{ id: 'l0', name: '0', color: '#fff', visible: true, locked: false }],
    entities: [
      { id: 'd1', type: 'dim', layer: 'l0', a: { x: 0, y: 0 }, b: { x: 1000, y: 0 }, off: 300 },
      { id: 'g1', type: 'line', layer: 'l0', a: { x: 0, y: 0 }, b: { x: 10, y: 0 }, srcBlock: '*D9', srcInsertId: 'i1' },
    ],
  };
  const { report } = exportDxfEx(doc);
  ok('block ẩn danh KHÔNG được dựng lại thành block người dùng', report.blockDefsWritten === 0,
    String(report.blockDefsWritten));
  ok('nó vẫn được đếm là làm phẳng (nói thật)', report.flattenedBlocks['*D9'] === 1, JSON.stringify(report.flattenedBlocks));
}

console.log(`\n${fail === 0 ? 'PASS' : 'FAIL'} — ${pass} ok, ${fail} fail`);
if (fail) process.exit(1);
