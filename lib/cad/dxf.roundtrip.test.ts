/**
 * lib/cad/dxf.roundtrip.test.ts — kiểm round-trip cho exportDxf/parseDxf (KHÔNG phải file
 * production, không import ở đâu trong app). Chạy bằng:
 *   node_modules/.bin/sucrase-node lib/cad/dxf.roundtrip.test.ts
 * (repo chưa cài Jest/Vitest — dùng sucrase-node sẵn có trong node_modules để chạy TS thẳng,
 * không cần thêm dependency/đụng package.json).
 *
 * Vì phạm vi export DXF chỉ nhắm "mở sạch" (không phủ mọi entity — xem đầu file dxf.ts), test
 * này không kỳ vọng round-trip 1:1 tuyệt đối cho mọi loại: hatch → polyline biên (không tô),
 * block → phẳng hoá thành line/poly/circle/arc. Test xác nhận đúng hành vi ĐÃ TÀI LIỆU HOÁ đó,
 * cộng với việc cấu trúc SECTION/TABLE cân bằng. Riêng DIMENSION (Nấc 3): xuất entity DIMENSION
 * thật + block ẩn danh (*D1, *D2…) trong BLOCKS — round-trip lại đúng kind/a/b/off/c (không dựa
 * vào việc parse lại nội dung block, chỉ đọc các group code định nghĩa mà app tự ghi).
 */
import { exportDxf, parseDxf } from './dxf';
import { emptyDoc, dist } from './model';
import type { Doc, Entity } from './model';
import { newId } from './store';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) {
    pass += 1;
    console.log(`  ok  - ${label}`);
  } else {
    fail += 1;
    console.log(`  FAIL - ${label}`);
  }
}
function approx(a: number, b: number, eps = 0.5): boolean {
  return Math.abs(a - b) <= eps;
}

function countBy<T extends string>(entities: Entity[], key: (e: Entity) => T): Record<string, number> {
  const out: Record<string, number> = {};
  for (const e of entities) {
    const k = key(e);
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

/* ── 1) entity 1:1 (line/polyline/rect/circle/arc/text) ── */
function testSimpleShapes() {
  console.log('\n[1] Line/Polyline/Rect/Circle/Arc/Text — round-trip 1:1');
  const doc: Doc = emptyDoc();
  const wall = doc.layers[0].id;
  doc.entities.push(
    { id: newId('e'), type: 'line', layer: wall, a: { x: 0, y: 0 }, b: { x: 3000, y: 0 } },
    { id: newId('e'), type: 'polyline', layer: wall, points: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }], closed: false },
    { id: newId('e'), type: 'rect', layer: wall, x: 0, y: 0, w: 4000, h: 3000 },
    { id: newId('e'), type: 'circle', layer: wall, c: { x: 500, y: 500 }, r: 300 },
    { id: newId('e'), type: 'arc', layer: wall, c: { x: 0, y: 0 }, r: 500, a1: 0, a2: Math.PI / 2 },
    { id: newId('e'), type: 'text', layer: wall, at: { x: 0, y: 0 }, text: 'PHONG NGU', h: 250 },
  );
  const dxf = exportDxf(doc);
  const back = parseDxf(dxf);

  // line(1) + rect-as-polyline(1) + polyline(1) => 2 polyline + 1 line expected among back.entities
  const byType = countBy(back.entities, (e) => e.type);
  ok('có đúng 1 LINE', byType['line'] === 1);
  ok('có đúng 2 POLYLINE (polyline gốc + rect→polyline)', byType['polyline'] === 2);
  ok('có đúng 1 CIRCLE', byType['circle'] === 1);
  ok('có đúng 1 ARC', byType['arc'] === 1);
  ok('có đúng 1 TEXT', byType['text'] === 1);

  const ln = back.entities.find((e) => e.type === 'line');
  ok('LINE toạ độ đúng (a,b)', !!ln && ln.type === 'line' && approx(ln.a.x, 0) && approx(ln.b.x, 3000));

  const circ = back.entities.find((e) => e.type === 'circle');
  ok('CIRCLE tâm+bán kính đúng', !!circ && circ.type === 'circle' && approx(circ.r, 300) && approx(circ.c.x, 500));

  const arc = back.entities.find((e) => e.type === 'arc');
  ok('ARC bán kính đúng', !!arc && arc.type === 'arc' && approx(arc.r, 500));

  const txt = back.entities.find((e) => e.type === 'text');
  ok('TEXT nội dung tiếng Việt không dấu giữ nguyên (data string, không phải symbol name)', !!txt && txt.type === 'text' && txt.text.includes('PHONG NGU'));

  const rectPoly = back.entities.filter((e) => e.type === 'polyline').find((e) => e.type === 'polyline' && e.closed);
  ok('RECT xuất thành POLYLINE khép kín 4 đỉnh', !!rectPoly && rectPoly.type === 'polyline' && rectPoly.points.length === 4);
}

/* ── 2) dim — Nấc 3: DIMENSION entity THẬT (aligned/radius/diameter/angular), round-trip a/b/off/kind ── */
function testDim() {
  console.log('\n[2] Dimension — DIMENSION entity thật (4 kind) + block ẩn danh kèm theo');
  const doc: Doc = emptyDoc();
  const dimLayer = doc.layers.find((l) => l.name === 'Kích thước')!.id;
  doc.entities.push(
    { id: newId('e'), type: 'dim', kind: 'aligned', layer: dimLayer, a: { x: 0, y: 0 }, b: { x: 2500, y: 0 }, off: 200 },
    { id: newId('e'), type: 'dim', kind: 'radius', layer: dimLayer, a: { x: 5000, y: 0 }, b: { x: 5300, y: 0 }, off: 0 },
    { id: newId('e'), type: 'dim', kind: 'diameter', layer: dimLayer, a: { x: 8000, y: 0 }, b: { x: 8400, y: 0 }, off: 0 },
    { id: newId('e'), type: 'dim', kind: 'angular', layer: dimLayer, c: { x: 0, y: 5000 }, a: { x: 1000, y: 5000 }, b: { x: 0, y: 6000 }, off: 600 },
  );
  const dxf = exportDxf(doc);
  ok('BLOCKS section xuất hiện (cần cho DIMENSION thật)', dxf.includes('BLOCKS'));
  ok('4 block ẩn danh *D1..*D4 cho 4 dimension', ['*D1', '*D2', '*D3', '*D4'].every((n) => dxf.includes(n)));
  ok('bảng BLOCK_RECORD xuất hiện trong TABLES', dxf.includes('BLOCK_RECORD'));
  ok('4 entity DIMENSION thật trong ENTITIES (group 0 = DIMENSION)', (dxf.match(/\nDIMENSION\n/g) ?? []).length === 4);

  const back = parseDxf(dxf);
  const dims = back.entities.filter((e): e is Entity & { type: 'dim' } => e.type === 'dim');
  ok('round-trip đủ 4 dim', dims.length === 4);

  const aligned = dims.find((d) => d.kind === 'aligned');
  ok('aligned: a/b đúng toạ độ', !!aligned && dist(aligned.a, { x: 0, y: 0 }) < 1 && dist(aligned.b, { x: 2500, y: 0 }) < 1);
  ok('aligned: off round-trip đúng dấu + độ lớn (200mm)', !!aligned && approx(aligned.off, 200));

  const radius = dims.find((d) => d.kind === 'radius');
  ok('radius: tâm (a) + điểm trên đường tròn (b) đúng → bán kính suy ra = 300', !!radius && approx(dist(radius.a, radius.b), 300));

  const diameter = dims.find((d) => d.kind === 'diameter');
  ok('diameter: tâm + điểm trên đường tròn → bán kính suy ra = 400', !!diameter && approx(dist(diameter.a, diameter.b), 400));

  const angular = dims.find((d) => d.kind === 'angular');
  ok('angular: đỉnh c round-trip đúng', !!angular && !!angular.c && dist(angular.c, { x: 0, y: 5000 }) < 1);
  ok('angular: off (bán kính cung đo) round-trip ≈ 600', !!angular && approx(angular.off, 600, 2));
}

/* ── 3) hatch — poché tường CŨ (không pattern) vs HATCH thật (Nấc 4, có pattern) ── */
function testHatch() {
  console.log('\n[3] Hatch — poché tường (không pattern) → LWPOLYLINE biên; pattern (Nấc 4) → HATCH entity thật');
  const doc: Doc = emptyDoc();
  const wall = doc.layers[0].id;
  doc.entities.push({
    id: newId('e'),
    type: 'hatch',
    layer: wall,
    solid: true,
    points: [{ x: 0, y: 0 }, { x: 1000, y: 0 }, { x: 1000, y: 110 }, { x: 0, y: 110 }],
  });
  const dxf = exportDxf(doc);
  const back = parseDxf(dxf);
  ok('1 hatch (không pattern) → 1 POLYLINE khép kín 4 đỉnh (hành vi cũ giữ nguyên)', back.entities.length === 1 && back.entities[0].type === 'polyline' && back.entities[0].closed && back.entities[0].points.length === 4);

  const doc2: Doc = emptyDoc();
  const lay2 = doc2.layers[0].id;
  doc2.entities.push({
    id: newId('e'), type: 'hatch', layer: lay2, pattern: 'ANSI31', patternScale: 1.5, patternAngle: 30,
    points: [{ x: 0, y: 0 }, { x: 2000, y: 0 }, { x: 2000, y: 1500 }, { x: 0, y: 1500 }],
  });
  const dxf2 = exportDxf(doc2);
  ok('HATCH entity thật xuất hiện (group 0 HATCH)', (dxf2.match(/\nHATCH\n/g) ?? []).length === 1);
  ok('tên pattern ANSI31 có trong file', dxf2.includes('ANSI31'));
  const back2 = parseDxf(dxf2);
  const h = back2.entities.find((e) => e.type === 'hatch');
  ok('round-trip: 1 hatch với đúng 4 đỉnh biên', !!h && h.type === 'hatch' && h.points.length === 4);
  ok('round-trip: pattern/scale/angle giữ nguyên', !!h && h.type === 'hatch' && h.pattern === 'ANSI31' && approx(h.patternScale ?? 0, 1.5, 0.01) && approx(h.patternAngle ?? -1, 30, 0.01));
}

/* ── 4) block furniture → phẳng hoá thành primitive thật ── */
function testBlock() {
  console.log('\n[4] Block nội thất — phẳng hoá (không cần BLOCKS/INSERT) khi export');
  const doc: Doc = emptyDoc();
  const furn = doc.layers.find((l) => l.name === 'Nội thất')!.id;
  doc.entities.push({ id: newId('e'), type: 'block', layer: furn, block: 'sofa2', at: { x: 1000, y: 1000 }, rot: 0, sx: 1, sy: 1 });
  const dxf = exportDxf(doc);
  const back = parseDxf(dxf);
  ok('block sofa2 phẳng hoá ra ít nhất 1 entity hình học', back.entities.length > 0);
  ok('mọi entity phẳng hoá đều là LINE/POLYLINE/CIRCLE/ARC (không còn "block")', back.entities.every((e) => ['line', 'polyline', 'circle', 'arc'].includes(e.type)));
  // sofa2 đặt tại (1000,1000) — kiểm 1 điểm bất kỳ nằm gần khu vực đó (không rơi về gốc toạ độ do quên áp phép translate).
  const anyNear = back.entities.some((e) => {
    if (e.type === 'line') return dist(e.a, { x: 1000, y: 1000 }) < 1200 || dist(e.b, { x: 1000, y: 1000 }) < 1200;
    if (e.type === 'circle' || e.type === 'arc') return dist(e.c, { x: 1000, y: 1000 }) < 1200;
    if (e.type === 'polyline') return e.points.some((p) => dist(p, { x: 1000, y: 1000 }) < 1200);
    return false;
  });
  ok('hình học nằm đúng quanh điểm đặt block (đã áp translate/rotate/scale)', anyNear);
}

/* ── 5) cấu trúc SECTION/TABLE cân bằng ── */
function testStructure() {
  console.log('\n[5] Cấu trúc DXF — SECTION/ENDSEC, TABLE/ENDTAB cân bằng + HEADER có $ACADVER/$INSUNITS/$EXTMIN/$EXTMAX');
  const doc: Doc = emptyDoc();
  doc.entities.push({ id: newId('e'), type: 'line', layer: doc.layers[0].id, a: { x: 0, y: 0 }, b: { x: 1, y: 1 } });
  const dxf = exportDxf(doc);
  const lines = dxf.split('\n');
  const countPair = (code: string, val: string) => {
    let c = 0;
    for (let i = 0; i + 1 < lines.length; i++) if (lines[i].trim() === code && lines[i + 1].trim() === val) c++;
    return c;
  };
  ok('SECTION/ENDSEC cân bằng (4 section: HEADER/TABLES/BLOCKS/ENTITIES)', countPair('0', 'SECTION') === 4 && countPair('0', 'ENDSEC') === 4);
  ok('TABLE/ENDTAB cân bằng (2 bảng: LTYPE + LAYER — hệ nét ISO 128)', countPair('0', 'TABLE') === 2 && countPair('0', 'ENDTAB') === 2);
  ok('LTYPE table có đủ 5 nét chuẩn', ['CONTINUOUS', 'HIDDEN', 'CENTER', 'DASHED', 'PHANTOM'].every((n) => dxf.includes(n)));
  // LAYER "Tuong" (lineweight mặc định 0.6mm ⇒ enum DXF gần nhất = 60) mang group 370 đúng giá trị.
  const tuongIdx = lines.findIndex((l) => l.trim() === 'Tuong');
  const next370 = tuongIdx >= 0 ? lines.slice(tuongIdx, tuongIdx + 8).findIndex((l) => l.trim() === '370') : -1;
  ok('LAYER "Tuong" mang lineweight 370 = 60 (0.6mm)', next370 >= 0 && lines[tuongIdx + next370 + 1]?.trim() === '60');
  ok('có $ACADVER', dxf.includes('$ACADVER'));
  ok('có $INSUNITS', dxf.includes('$INSUNITS'));
  ok('có $EXTMIN/$EXTMAX', dxf.includes('$EXTMIN') && dxf.includes('$EXTMAX'));
  ok('kết thúc bằng EOF', lines.filter((l) => l.trim() === 'EOF').length === 1);
  ok('layer "Tường" (có dấu) được bỏ dấu an toàn thành symbol name trong LAYER table', dxf.includes('Tuong'));
}

/* ── 6) layer routing giữ nguyên sau round-trip (entity vẫn về đúng nhóm layer) ── */
function testLayerRouting() {
  console.log('\n[6] Layer — entity vẫn nhóm đúng theo layer (tên đã bỏ dấu) sau round-trip');
  const doc: Doc = emptyDoc();
  const wall = doc.layers.find((l) => l.name === 'Tường')!.id;
  const furn = doc.layers.find((l) => l.name === 'Nội thất')!.id;
  doc.entities.push(
    { id: newId('e'), type: 'line', layer: wall, a: { x: 0, y: 0 }, b: { x: 1000, y: 0 } },
    { id: newId('e'), type: 'circle', layer: furn, c: { x: 0, y: 0 }, r: 10 },
  );
  const back = parseDxf(exportDxf(doc));
  const wallLayerBack = back.layers.find((l) => l.name === 'Tuong');
  const furnLayerBack = back.layers.find((l) => l.name === 'Noi_that');
  ok('layer Tuong tồn tại sau round-trip', !!wallLayerBack);
  ok('layer Noi_that tồn tại sau round-trip', !!furnLayerBack);
  const lineBack = back.entities.find((e) => e.type === 'line');
  const circBack = back.entities.find((e) => e.type === 'circle');
  ok('LINE vẫn thuộc layer Tuong', !!lineBack && !!wallLayerBack && lineBack.layer === wallLayerBack.id);
  ok('CIRCLE vẫn thuộc layer Noi_that', !!circBack && !!furnLayerBack && circBack.layer === furnLayerBack.id);
}

/* ── 7) hệ nét ISO 128 — lineweight/linetype của LAYER round-trip qua TABLES/LAYER ── */
function testLineweightRoundtrip() {
  console.log('\n[7] Hệ nét ISO 128 — lineweight/linetype của layer round-trip qua bảng LAYER');
  const doc: Doc = emptyDoc(); // Tường=0.6/continuous, Trục=0.13/center theo DEFAULT_LAYERS
  doc.entities.push({ id: newId('e'), type: 'line', layer: doc.layers[0].id, a: { x: 0, y: 0 }, b: { x: 100, y: 0 } });
  const axisLayer = doc.layers.find((l) => l.name === 'Trục')!;
  doc.entities.push({ id: newId('e'), type: 'line', layer: axisLayer.id, a: { x: 0, y: 0 }, b: { x: 100, y: 100 } });
  const back = parseDxf(exportDxf(doc));
  const wallBack = back.layers.find((l) => l.name === 'Tuong');
  const axisBack = back.layers.find((l) => l.name === 'Truc');
  ok('layer Tuong: lineweight round-trip ≈ 0.6mm', !!wallBack && approx(wallBack.lineweight ?? 0, 0.6, 0.01));
  ok('layer Tuong: lineType round-trip = continuous', wallBack?.lineType === 'continuous');
  ok('layer Truc: lineweight round-trip ≈ 0.13mm', !!axisBack && approx(axisBack.lineweight ?? 0, 0.13, 0.02));
  ok('layer Truc: lineType round-trip = center', axisBack?.lineType === 'center');
}

testSimpleShapes();
testDim();
testHatch();
testBlock();
testStructure();
testLineweightRoundtrip();
testLayerRouting();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
