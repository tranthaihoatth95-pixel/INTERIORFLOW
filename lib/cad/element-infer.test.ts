/**
 * lib/cad/element-infer.test.ts — A5 · GAP `G-M1-09`: suy `elementType` từ TÊN LAYER + cờ
 * `inferred` (K3 — suy đoán phải lộ ra).
 *
 * §0h — dữ liệu HƯ CẤU về nội dung, nhưng **quy ước đặt tên layer thì lấy đúng dạng gặp thật**
 * (`A-Column` · `A-Wall` · `A-Par-Glass` · `E-Stair` · `E-Wc` · `LOUV` · `E-DimTruc`) — đó chính
 * là thứ bộ luật phải xử lý được, viết tên khác đi thì test không chứng minh được gì.
 *
 * Chạy: node_modules/.bin/sucrase-node lib/cad/element-infer.test.ts
 */
import {
  DEFAULT_ELEMENT_INFER_RULES, inferElementTypes, layerTokens, matchElementRule,
  type ElementInferRule,
} from './element-infer';
import { parseDxfEx } from './dxf';
import type { Doc, Entity, Layer } from './model';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean, extra = '') {
  if (cond) { pass++; console.log(`  ok  - ${name}`); }
  else { fail++; console.log(`  FAIL - ${name}${extra ? ` — ${extra}` : ''}`); }
}

const layer = (name: string): Layer => ({ id: `l-${name}`, name, color: '#ffffff', visible: true, locked: false });
let n = 0;
const line = (layerId: string, patch: Partial<Entity> = {}): Entity => ({
  id: `e${++n}`, type: 'line', layer: layerId, a: { x: 0, y: 0 }, b: { x: 100, y: 0 }, ...patch,
} as Entity);

console.log('\n[1] Cắt token — không khớp chuỗi con (bài học bug ghép cột G-M3-06)');
{
  ok('cắt theo mọi dấu ngăn', layerTokens('A-Par_Glass 2').join('|') === 'a|par|glass|2', layerTokens('A-Par_Glass 2').join('|'));
  ok('bỏ dấu tiếng Việt', layerTokens('Tường-Ngoài').join('|') === 'tuong|ngoai', layerTokens('Tường-Ngoài').join('|'));
  ok('đ → d', layerTokens('Dầm').join('|') === 'dam', layerTokens('Dầm').join('|'));
  // 'col' KHÔNG được khớp vào 'COLOR-FILL' bằng chuỗi con.
  ok('KHÔNG khớp chuỗi con: "color" không thành cột', matchElementRule('COLOR-FILL')?.elementType !== 'column',
    String(matchElementRule('COLOR-FILL')?.elementType));
}

console.log('\n[2] Bộ luật mặc định trên đúng bộ tên layer gặp thật');
{
  const want: [string, string | null | undefined][] = [
    ['A-Column', 'column'],
    ['A-Wall', 'wall'],
    ['A-Par-Glass', 'wall'],
    ['E-Par-Glass', 'wall'],
    ['E-DimTruc', null],          // ghi chú/lưới trục — "đã kiểm, KHÔNG phải phần tử BIM"
    ['E-Stair', undefined],       // ElementType không có IfcStair ⇒ CỐ Ý không đoán
    ['E-Wc', undefined],
    ['LOUV', undefined],
  ];
  for (const [nm, exp] of want) {
    const got = matchElementRule(nm)?.elementType;
    ok(`${nm} → ${exp === undefined ? 'không đoán' : String(exp)}`, got === exp, String(got));
  }
}

console.log('\n[3] Annotation THẮNG — layer ghi chú nằm trên tên cấu kiện');
{
  ok('A-Wall-Dim là ghi chú, không phải tường', matchElementRule('A-Wall-Dim')?.elementType === null,
    String(matchElementRule('A-Wall-Dim')?.elementType));
  ok('A-Column-Text là ghi chú', matchElementRule('A-Column-Text')?.elementType === null);
}

console.log('\n[4] KHAI BÁO THẮNG SUY ĐOÁN — không đè entity đã có elementType');
{
  const doc: Doc = {
    layers: [layer('A-Wall'), layer('A-Column')],
    entities: [
      line('l-A-Wall'),                                    // chưa gán → sẽ đoán ra 'wall'
      line('l-A-Wall', { elementType: 'furniture' }),       // đã khai → GIỮ NGUYÊN
      line('l-A-Column', { elementType: null }),            // khai "không phải BIM" → GIỮ NGUYÊN
    ],
  };
  const r = inferElementTypes(doc);
  ok('chỉ đoán 1 entity', r.inferredCount === 1, String(r.inferredCount));
  ok('đếm đúng 2 entity đã khai', r.declaredCount === 2, String(r.declaredCount));
  ok('entity chưa gán → wall', r.doc.entities[0].elementType === 'wall', String(r.doc.entities[0].elementType));
  ok('entity chưa gán MANG CỜ inferred (K3)', r.doc.entities[0].inferred === true);
  ok('entity đã khai furniture KHÔNG bị đè', r.doc.entities[1].elementType === 'furniture');
  ok('entity đã khai KHÔNG bị gắn cờ inferred', r.doc.entities[1].inferred === undefined);
  ok('entity khai null KHÔNG bị đè', r.doc.entities[2].elementType === null && r.doc.entities[2].inferred === undefined);
  ok('entity không đổi giữ NGUYÊN tham chiếu (không tạo rác)', r.doc.entities[1] === doc.entities[1]);
  ok('bảng byType đếm đúng', r.byType.wall === 1, JSON.stringify(r.byType));
  ok('bảng byLayer nói rõ layer nào bị đoán thành gì', r.byLayer['A-Wall'] === 'tường · vách', JSON.stringify(r.byLayer));
}

console.log('\n[5] IDEMPOTENT — chạy lại lần 2 không đoán thêm gì');
{
  const doc: Doc = { layers: [layer('A-Wall')], entities: [line('l-A-Wall'), line('l-A-Wall')] };
  const r1 = inferElementTypes(doc);
  const r2 = inferElementTypes(r1.doc);
  ok('lần 1 đoán 2', r1.inferredCount === 2, String(r1.inferredCount));
  ok('lần 2 đoán 0', r2.inferredCount === 0, String(r2.inferredCount));
  ok('lần 2 đếm 2 entity đã có', r2.declaredCount === 2, String(r2.declaredCount));
}

console.log('\n[6] Bảng luật là THAM SỐ — studio khác đè được, không phải sửa code');
{
  const own: ElementInferRule[] = [{ label: 'vách của tôi', elementType: 'wall', tokens: ['vk'] }];
  const doc: Doc = { layers: [layer('KT-VK-01'), layer('A-Wall')], entities: [line('l-KT-VK-01'), line('l-A-Wall')] };
  const r = inferElementTypes(doc, own);
  ok('layer theo quy ước riêng được nhận', r.doc.entities[0].elementType === 'wall');
  ok('luật mặc định KHÔNG còn hiệu lực khi đã đè', r.doc.entities[1].elementType === undefined,
    String(r.doc.entities[1].elementType));
  ok('bộ mặc định vẫn nguyên vẹn', DEFAULT_ELEMENT_INFER_RULES.length > 5);
}

console.log('\n[7] Nối vào đường nạp DXF thật + tắt được');
{
  const dxf = [
    '0', 'SECTION', '2', 'ENTITIES',
    '0', 'LINE', '8', 'A-Wall', '10', '0', '20', '0', '11', '1000', '21', '0',
    '0', 'LINE', '8', 'A-Column', '10', '0', '20', '0', '11', '10', '21', '0',
    '0', 'LINE', '8', 'LOUV', '10', '0', '20', '0', '11', '10', '21', '0',
    '0', 'ENDSEC', '0', 'EOF',
  ].join('\n');

  const on = parseDxfEx(dxf);
  ok('nạp xong entity CÓ elementType (trước A5 là 0/12.274)',
    on.doc.entities.filter((e) => e.elementType !== undefined).length === 2,
    String(on.doc.entities.filter((e) => e.elementType !== undefined).length));
  ok('layer không có luật thì để trống, không đoán bừa', on.doc.entities[2].elementType === undefined);
  ok('mọi entity vừa đoán đều có cờ inferred',
    on.doc.entities.filter((e) => e.elementType !== undefined).every((e) => e.inferred === true));
  ok('báo cáo nạp nói ra số đã đoán', on.report.elementTypes.inferredCount === 2, String(on.report.elementTypes.inferredCount));

  const off = parseDxfEx(dxf, { inferRules: null });
  ok('tắt được (inferRules:null) → về hành vi cũ',
    off.doc.entities.every((e) => e.elementType === undefined) && off.report.elementTypes.inferredCount === 0);
}

console.log(`\n${fail === 0 ? 'PASS' : 'FAIL'} — ${pass} ok, ${fail} fail`);
if (fail) process.exit(1);
