/**
 * lib/cad/entity-path.test.ts — chạy: node_modules/.bin/sucrase-node lib/cad/entity-path.test.ts
 * LUẬT TRUNG TÍNH: fixture hư cấu 100%.
 */
import { entityToStrokeD, entityToFillD, batchStrokeD, strokeLength, batchStrokeLength } from './entity-path';
import type { LineEntity, PolylineEntity, RectEntity, CircleEntity, ArcEntity, HatchEntity, ZoneEntity, TextEntity, BlockEntity } from './model';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

function line(): LineEntity {
  return { id: 'e1', type: 'line', layer: 'l1', a: { x: 0, y: 0 }, b: { x: 100, y: 50 } };
}
function poly(closed: boolean): PolylineEntity {
  return { id: 'e2', type: 'polyline', layer: 'l1', points: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }], closed };
}
function rect(): RectEntity {
  return { id: 'e3', type: 'rect', layer: 'l1', x: 10, y: 20, w: 30, h: 40 };
}
function circle(): CircleEntity {
  return { id: 'e4', type: 'circle', layer: 'l1', c: { x: 0, y: 0 }, r: 50 };
}
function arc(): ArcEntity {
  return { id: 'e5', type: 'arc', layer: 'l1', c: { x: 0, y: 0 }, r: 50, a1: 0, a2: Math.PI / 2 };
}
function hatch(): HatchEntity {
  return { id: 'e6', type: 'hatch', layer: 'l1', points: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }], solid: true };
}
function zonePoly(): ZoneEntity {
  return { id: 'e7', type: 'zone', layer: 'l1', polygon: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }], label: 'KHU MẪU', group: 'social', opacity: 0.4 };
}
function zoneEllipse(): ZoneEntity {
  return { id: 'e8', type: 'zone', layer: 'l1', ellipse: { c: { x: 0, y: 0 }, rx: 10, ry: 5 }, label: 'KHU MẪU 2', group: 'social', opacity: 0.4 };
}
function text(): TextEntity {
  return { id: 'e9', type: 'text', layer: 'l1', at: { x: 0, y: 0 }, text: 'PHÒNG MẪU', h: 250 };
}
function block(): BlockEntity {
  return { id: 'e10', type: 'block', layer: 'l1', block: 'doorSample', at: { x: 0, y: 0 }, rot: 0, sx: 1, sy: 1 };
}

function testStroke() {
  console.log('\n[1] entityToStrokeD — hình học có nét');
  const dLine = entityToStrokeD(line());
  ok('line → "M x y L x y"', dLine === 'M 0 0 L 100 50');

  const dPolyOpen = entityToStrokeD(poly(false));
  ok('polyline mở → không có Z', dPolyOpen !== null && !dPolyOpen.includes('Z'));
  const dPolyClosed = entityToStrokeD(poly(true));
  ok('polyline closed=true → có Z', dPolyClosed !== null && dPolyClosed.endsWith('Z'));

  const dRect = entityToStrokeD(rect());
  ok('rect → 4 điểm khép vòng (có Z)', dRect !== null && dRect.split('L').length - 1 === 3 && dRect.endsWith('Z'));

  const dCircle = entityToStrokeD(circle());
  ok('circle → path arc không null', dCircle !== null && dCircle.startsWith('M'));

  const dArc = entityToStrokeD(arc());
  ok('arc → path "A" (elliptical arc command)', dArc !== null && dArc.includes(' A '));

  ok('hatch → entityToStrokeD trả null (không vẽ nét, dùng entityToFillD)', entityToStrokeD(hatch()) === null);
  ok('zone → entityToStrokeD trả null (không vẽ nét)', entityToStrokeD(zonePoly()) === null);
  ok('text → entityToStrokeD trả null (không có khái niệm nét)', entityToStrokeD(text()) === null);
  ok('block → entityToStrokeD trả null (không phải hình học thô)', entityToStrokeD(block()) === null);
}

function testFill() {
  console.log('\n[2] entityToFillD — hatch/zone tô (clip-path)');
  const dHatch = entityToFillD(hatch());
  ok('hatch → path khép vòng (có Z)', dHatch !== null && dHatch.endsWith('Z'));

  const dZonePoly = entityToFillD(zonePoly());
  ok('zone polygon → path khép vòng', dZonePoly !== null && dZonePoly.endsWith('Z'));

  ok('zone ellipse (không polygon) → null (component tự dựng <ellipse>)', entityToFillD(zoneEllipse()) === null);
  ok('line → entityToFillD trả null (không phải vùng tô)', entityToFillD(line()) === null);
}

function testBatch() {
  console.log('\n[3] batchStrokeD — gộp nhiều entity thành 1 d (tối ưu hiệu năng)');
  const entities = [line(), poly(true), hatch(), text()]; // hatch/text bị lọc bỏ (không phải nét)
  const d = batchStrokeD(entities);
  ok('gộp đúng 2 subpath (line + polyline), bỏ hatch/text', d.split('M').length - 1 === 2);

  ok('mảng rỗng → chuỗi rỗng, không throw', batchStrokeD([]) === '');

  const only1 = batchStrokeD([line()]);
  ok('1 entity → giống hệt entityToStrokeD đơn lẻ', only1 === entityToStrokeD(line()));
}

function testLength() {
  console.log('\n[4] strokeLength/batchStrokeLength — dasharray');
  ok('line 3-4-5 (dx=100,dy=50) → độ dài đúng hypot', Math.abs(strokeLength(line()) - Math.hypot(100, 50)) < 1e-9);
  ok('rect 30×40 → chu vi 140', strokeLength(rect()) === 140);
  const dEllipse = strokeLength({ id: 'e11', type: 'ellipse', layer: 'l1', c: { x: 0, y: 0 }, rx: 50, ry: 30 });
  ok('ellipse rx=50,ry=30 → chu vi xấp xỉ hợp lý (250-260)', dEllipse > 250 && dEllipse < 260);

  const total = batchStrokeLength([line(), poly(true), hatch(), text()]);
  const expected = strokeLength(line()) + strokeLength(poly(true));
  ok('batchStrokeLength cộng đúng, bỏ qua hatch/text (không có nét)', Math.abs(total - expected) < 1e-9);
}

testStroke();
testFill();
testBatch();
testLength();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
