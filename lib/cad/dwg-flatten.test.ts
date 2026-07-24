/**
 * lib/cad/dwg-flatten.test.ts — kiểm block-flatten INSERT/MINSERT/DIMENSION của dwgRawDocToDoc
 * (lib/cad/dwg.ts): ma trận transform (translate + scale + rotate + basePoint + nested), MINSERT
 * mảng hàng/cột, kế thừa BYBLOCK/layer 0, chống vòng lặp block tự tham chiếu, DIMENSION fallback.
 * Chạy bằng: node_modules/.bin/sucrase-node lib/cad/dwg-flatten.test.ts
 */
import { dwgRawDocToDoc } from './dwg-map';
import type { CircleEntity, LineEntity, PolylineEntity, TextEntity } from './model';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}
function approx(a: number, b: number, eps = 1e-6): boolean { return Math.abs(a - b) <= eps; }
function approxPt(p: { x: number; y: number }, x: number, y: number, eps = 1e-6): boolean {
  return approx(p.x, x, eps) && approx(p.y, y, eps);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rawDoc(entities: any[], blocks: Record<string, any> = {}, layers: any[] = []): any {
  return { entities, layers, blocks, skippedEntityCount: 0, totalEntityCount: entities.length };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ins(name: string, at: { x: number; y: number }, extra: any = {}): any {
  return { type: 'INSERT', layer: 'L1', name, at, sx: 1, sy: 1, rot: 0, cols: 1, rows: 1, colSpacing: 0, rowSpacing: 0, ...extra };
}

const lineBlock = {
  basePoint: { x: 0, y: 0 },
  entities: [{ type: 'LINE', layer: '0', a: { x: 0, y: 0 }, b: { x: 100, y: 0 } }],
};

function testTranslate() {
  console.log('\n[1] INSERT translate thuần');
  const doc = dwgRawDocToDoc(rawDoc([ins('CHAIR', { x: 500, y: 300 })], { CHAIR: lineBlock }));
  ok('flatten ra 1 line', doc.entities.length === 1 && doc.entities[0].type === 'line');
  const l = doc.entities[0] as LineEntity;
  ok('a = (500,300)', approxPt(l.a, 500, 300));
  ok('b = (600,300)', approxPt(l.b, 600, 300));
  ok('layer 0 trong block kế thừa layer INSERT (L1)', doc.layers.some((la) => la.name === 'L1' && la.id === l.layer));
}

function testScaleRotate() {
  console.log('\n[2] INSERT scale + rotate');
  const doc = dwgRawDocToDoc(rawDoc([
    ins('CHAIR', { x: 500, y: 300 }, { sx: 2, sy: 2 }),
    ins('CHAIR', { x: 0, y: 0 }, { rot: Math.PI / 2 }),
    ins('CHAIR', { x: 100, y: 100 }, { sx: 2, sy: 2, rot: Math.PI / 2 }),
  ], { CHAIR: lineBlock }));
  ok('3 line', doc.entities.length === 3);
  const [s, r, sr] = doc.entities as LineEntity[];
  ok('scale 2: b = (700,300)', approxPt(s.b, 700, 300));
  ok('rot 90°: b = (0,100)', approxPt(r.b, 0, 100));
  ok('scale 2 + rot 90°: b = (100,300)', approxPt(sr.b, 100, 300));
}

function testBasePoint() {
  console.log('\n[3] basePoint trừ trước khi transform');
  const blk = { basePoint: { x: 50, y: 50 }, entities: lineBlock.entities };
  const doc = dwgRawDocToDoc(rawDoc([ins('B', { x: 500, y: 300 })], { B: blk }));
  const l = doc.entities[0] as LineEntity;
  ok('a = (450,250)', approxPt(l.a, 450, 250));
  ok('b = (550,250)', approxPt(l.b, 550, 250));
}

function testNested() {
  console.log('\n[4] Nested INSERT (2 tầng, có rotate)');
  // OUTER chứa INSERT INNER tại (10,0); INNER chứa line (0,0)-(100,0).
  // Insert OUTER tại (1000,0) rot 90° → điểm chèn INNER world = (1000,10); line xoay 90° →
  // a=(1000,10), b=(1000-0,10+100)=(1000,110)... R90(100,0)=(0,100) → b=(1000,110).
  const blocks = {
    INNER: lineBlock,
    OUTER: { basePoint: { x: 0, y: 0 }, entities: [ins('INNER', { x: 10, y: 0 })] },
  };
  const doc = dwgRawDocToDoc(rawDoc([ins('OUTER', { x: 1000, y: 0 }, { rot: Math.PI / 2 })], blocks));
  ok('flatten ra 1 line', doc.entities.length === 1);
  const l = doc.entities[0] as LineEntity;
  ok('a = (1000,10)', approxPt(l.a, 1000, 10));
  ok('b = (1000,110) — R90(100,0)=(0,100) cộng vào điểm chèn', approxPt(l.b, 1000, 110));
}

function testMinsert() {
  console.log('\n[5] MINSERT mảng 2×3');
  const doc = dwgRawDocToDoc(rawDoc([
    ins('CHAIR', { x: 0, y: 0 }, { cols: 3, rows: 2, colSpacing: 1000, rowSpacing: 2000 }),
  ], { CHAIR: lineBlock }));
  ok('6 bản sao', doc.entities.length === 6);
  const starts = (doc.entities as LineEntity[]).map((l) => l.a);
  ok('có bản (0,0)', starts.some((p) => approxPt(p, 0, 0)));
  ok('có bản (2000,0)', starts.some((p) => approxPt(p, 2000, 0)));
  ok('có bản (1000,2000)', starts.some((p) => approxPt(p, 1000, 2000)));
  // MINSERT xoay 90°: offset cột (1000,0) xoay thành (0,1000)
  const doc2 = dwgRawDocToDoc(rawDoc([
    ins('CHAIR', { x: 0, y: 0 }, { cols: 2, rows: 1, colSpacing: 1000, rot: Math.PI / 2 }),
  ], { CHAIR: lineBlock }));
  const starts2 = (doc2.entities as LineEntity[]).map((l) => l.a);
  ok('MINSERT rot 90°: bản 2 chèn tại (0,1000)', starts2.some((p) => approxPt(p, 0, 1000)));
}

function testCircleArc() {
  console.log('\n[6] CIRCLE/ARC trong block');
  const blk = {
    basePoint: { x: 0, y: 0 },
    entities: [
      { type: 'CIRCLE', layer: '0', c: { x: 10, y: 0 }, r: 5 },
      { type: 'ARC', layer: '0', c: { x: 0, y: 0 }, r: 10, a1: 0, a2: Math.PI / 2 },
    ],
  };
  const uni = dwgRawDocToDoc(rawDoc([ins('B', { x: 100, y: 0 }, { sx: 2, sy: 2, rot: Math.PI / 2 })], { B: blk }));
  const c = uni.entities.find((e) => e.type === 'circle') as CircleEntity;
  ok('circle scale đều: r = 10', !!c && approx(c.r, 10));
  ok('circle tâm xoay 90°: (100,20)', !!c && approxPt(c.c, 100, 20));
  const a = uni.entities.find((e) => e.type === 'arc');
  ok('arc scale đều giữ nguyên là arc, góc +90°', !!a && approx((a as { a1: number }).a1, Math.PI / 2));
  // Scale lệch trục → xấp xỉ polyline
  const skew = dwgRawDocToDoc(rawDoc([ins('B', { x: 0, y: 0 }, { sx: 2, sy: 1 })], { B: blk }));
  ok('scale lệch trục: circle+arc → polyline', skew.entities.every((e) => e.type === 'polyline'));
  const poly = skew.entities[0] as PolylineEntity;
  ok('polyline circle khép kín ≥ 8 điểm', poly.closed && poly.points.length >= 8);
}

function testInheritance() {
  console.log('\n[7] Kế thừa BYBLOCK màu + text scale');
  const blk = {
    basePoint: { x: 0, y: 0 },
    entities: [
      { type: 'LINE', layer: 'A-WALL', colorIndex: 0, a: { x: 0, y: 0 }, b: { x: 1, y: 0 } }, // BYBLOCK
      { type: 'TEXT', layer: '0', at: { x: 0, y: 0 }, text: 'GHẾ', h: 100 },
    ],
  };
  const doc = dwgRawDocToDoc(rawDoc([ins('B', { x: 0, y: 0 }, { colorIndex: 1, sx: 2, sy: 2 })], { B: blk }));
  const l = doc.entities.find((e) => e.type === 'line') as LineEntity;
  ok('BYBLOCK (colorIndex 0) → màu INSERT (ACI 1 = đỏ)', l.color === '#ff0000');
  ok('layer entity giữ A-WALL (không phải layer 0)', doc.layers.some((la) => la.name === 'A-WALL' && la.id === l.layer));
  const t = doc.entities.find((e) => e.type === 'text') as TextEntity;
  ok('text h scale ×2 = 200', !!t && approx(t.h, 200));
}

function testCycleGuard() {
  console.log('\n[8] Block tự tham chiếu — không treo, không nổ');
  const blocks = {
    A: { basePoint: { x: 0, y: 0 }, entities: [{ type: 'LINE', layer: '0', a: { x: 0, y: 0 }, b: { x: 1, y: 0 } }, ins('A', { x: 10, y: 0 })] },
  };
  const doc = dwgRawDocToDoc(rawDoc([ins('A', { x: 0, y: 0 })], blocks));
  ok('dừng ở depth 8: đúng 8 line', doc.entities.length === 8);
}

function testUnknownBlock() {
  console.log('\n[9] INSERT block không tồn tại / doc cũ không có blocks');
  const doc = dwgRawDocToDoc(rawDoc([ins('MISSING', { x: 0, y: 0 })]));
  ok('bỏ qua an toàn, không throw', doc.entities.length === 0);
  // Hợp đồng cũ (dwg2dxf) không gửi field blocks
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const old: any = { entities: [ins('X', { x: 0, y: 0 }), { type: 'LINE', layer: '0', a: { x: 0, y: 0 }, b: { x: 1, y: 1 } }], layers: [], skippedEntityCount: 0, totalEntityCount: 2 };
  const doc2 = dwgRawDocToDoc(old);
  ok('doc không blocks: INSERT bỏ, LINE vẫn vào', doc2.entities.length === 1 && doc2.entities[0].type === 'line');
}

function testDimension() {
  console.log('\n[10] DIMENSION');
  // 10a: có block ẩn danh → flatten block tại chỗ (identity)
  const dimBlk = {
    basePoint: { x: 0, y: 0 },
    entities: [
      { type: 'LINE', layer: '0', a: { x: 0, y: 500 }, b: { x: 3000, y: 500 } },
      { type: 'TEXT', layer: '0', at: { x: 1500, y: 550 }, text: '3000', h: 200 },
    ],
  };
  const doc = dwgRawDocToDoc(rawDoc([{
    type: 'DIMENSION', layer: 'A-DIM', blockName: '*D1', textPoint: { x: 1500, y: 550 }, measurement: 3000, kind: 0,
  }], { '*D1': dimBlk }));
  ok('block *D1 flatten: 1 line + 1 text', doc.entities.length === 2);
  const bl = doc.entities.find((e) => e.type === 'line') as LineEntity;
  ok('line giữ toạ độ WCS (identity)', !!bl && approxPt(bl.a, 0, 500) && approxPt(bl.b, 3000, 500));

  // 10b: không block → fallback text đo + 3 đường gióng cơ bản
  const doc2 = dwgRawDocToDoc(rawDoc([{
    type: 'DIMENSION', layer: 'A-DIM', textPoint: { x: 1500, y: 800 }, measurement: 2999.6, kind: 0,
    p1: { x: 0, y: 0 }, p2: { x: 3000, y: 0 }, defPoint: { x: 3000, y: 700 },
  }]));
  const t = doc2.entities.find((e) => e.type === 'text') as TextEntity;
  ok('fallback: text = "3000" (làm tròn)', !!t && t.text === '3000');
  const lines = doc2.entities.filter((e) => e.type === 'line') as LineEntity[];
  ok('fallback: 3 đường (2 gióng + 1 kích thước)', lines.length === 3);
  ok('đường kích thước ngang qua y=700', lines.some((l) => approxPt(l.a, 0, 700) && approxPt(l.b, 3000, 700)));

  // 10c: text user gõ đè measurement; ' ' = giấu text
  const doc3 = dwgRawDocToDoc(rawDoc([
    { type: 'DIMENSION', layer: 'D', textPoint: { x: 0, y: 0 }, text: '3000 (VERIFY)', measurement: 2999, kind: 1 },
    { type: 'DIMENSION', layer: 'D', textPoint: { x: 0, y: 0 }, text: ' ', measurement: 2999, kind: 1 },
  ]));
  const texts = doc3.entities.filter((e) => e.type === 'text') as TextEntity[];
  ok('text user gõ được giữ', texts.length === 1 && texts[0].text === '3000 (VERIFY)');
}

function testFlattenCap() {
  console.log('\n[11] Van an toàn MAX_FLATTEN_ENTITIES');
  // 500×500 MINSERT của block 1 line = 250k > 200k → bị cắt, không treo
  const doc = dwgRawDocToDoc(rawDoc([
    ins('CHAIR', { x: 0, y: 0 }, { cols: 500, rows: 500, colSpacing: 10, rowSpacing: 10 }),
  ], { CHAIR: lineBlock }));
  ok('cắt tại 200000 entity', doc.entities.length === 200000);
}

testTranslate();
testScaleRotate();
testBasePoint();
testNested();
testMinsert();
testCircleArc();
testInheritance();
testCycleGuard();
testUnknownBlock();
testDimension();
testFlattenCap();

console.log(`\n${pass} pass / ${fail} fail`);
if (fail > 0) process.exit(1);
