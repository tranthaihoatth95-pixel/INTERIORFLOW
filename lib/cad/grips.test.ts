/**
 * lib/cad/grips.test.ts — kiểm grips (Nấc 2). Chạy bằng:
 *   node_modules/.bin/sucrase-node lib/cad/grips.test.ts
 */
import { gripsOf, hitTestGrip, applyGripMove } from './grips';
import type { LineEntity, PolylineEntity, RectEntity, CircleEntity, ArcEntity, BlockEntity } from './model';
import { newId } from './store';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}
function approx(a: number, b: number, eps = 0.5): boolean { return Math.abs(a - b) <= eps; }
function ptApprox(a: { x: number; y: number }, b: { x: number; y: number }, eps = 0.5): boolean {
  return approx(a.x, b.x, eps) && approx(a.y, b.y, eps);
}
const LAY = 'l-wall';

function testLine() {
  console.log('\n[1] LINE — endpoint a/b + midpoint');
  const line: LineEntity = { id: newId('e'), type: 'line', layer: LAY, a: { x: 0, y: 0 }, b: { x: 100, y: 0 } };
  const grips = gripsOf(line);
  ok('3 grip (a, b, midpoint)', grips.length === 3);
  const gA = grips.find((g) => g.kind === 'endpoint' && g.index === 0)!;
  const moved = applyGripMove(line, gA, { x: -50, y: 0 }) as LineEntity;
  ok('kéo grip a → a đổi, b giữ nguyên', ptApprox(moved.a, { x: -50, y: 0 }) && ptApprox(moved.b, { x: 100, y: 0 }));

  const gMid = grips.find((g) => g.kind === 'midpoint')!;
  const movedMid = applyGripMove(line, gMid, { x: 60, y: 10 }) as LineEntity; // kéo midpoint (50,0)→(60,10): dịch cả line +10,+10
  ok('kéo grip midpoint → dời CẢ line theo delta', ptApprox(movedMid.a, { x: 10, y: 10 }) && ptApprox(movedMid.b, { x: 110, y: 10 }));

  const hit = hitTestGrip(grips, { x: 2, y: 1 }, 10);
  ok('hitTestGrip bắt được grip a khi click gần', !!hit && hit.kind === 'endpoint' && hit.index === 0);
  const miss = hitTestGrip(grips, { x: 500, y: 500 }, 10);
  ok('hitTestGrip null khi click xa mọi grip', miss === null);
}

function testPolyline() {
  console.log('\n[2] POLYLINE — grip từng đỉnh');
  const poly: PolylineEntity = { id: newId('e'), type: 'polyline', layer: LAY, closed: false, points: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 200, y: 0 }] };
  const grips = gripsOf(poly);
  ok('3 grip đúng số đỉnh', grips.length === 3);
  const g1 = grips[1];
  const moved = applyGripMove(poly, g1, { x: 100, y: 50 }) as PolylineEntity;
  ok('kéo đỉnh giữa → chỉ đỉnh đó đổi', ptApprox(moved.points[1], { x: 100, y: 50 }) && ptApprox(moved.points[0], { x: 0, y: 0 }) && ptApprox(moved.points[2], { x: 200, y: 0 }));
}

function testRect() {
  console.log('\n[3] RECT — kéo 1 góc, góc đối diện đứng yên');
  const rect: RectEntity = { id: newId('e'), type: 'rect', layer: LAY, x: 0, y: 0, w: 200, h: 100 };
  const grips = gripsOf(rect);
  ok('4 grip góc', grips.length === 4);
  // góc 0 = (0,0); góc đối diện (index 2) = (200,100)
  const g0 = grips[0];
  const moved = applyGripMove(rect, g0, { x: -50, y: -20 }) as RectEntity;
  ok('kéo góc (0,0) ra (-50,-20): góc đối diện (200,100) đứng yên', approx(moved.x, 200) && approx(moved.y, 100));
  ok('góc kéo di đúng vị trí mới (qua x+w, y+h)', approx(moved.x + moved.w, -50) && approx(moved.y + moved.h, -20));
}

function testCircle() {
  console.log('\n[4] CIRCLE — center + radius');
  const circ: CircleEntity = { id: newId('e'), type: 'circle', layer: LAY, c: { x: 0, y: 0 }, r: 100 };
  const grips = gripsOf(circ);
  ok('2 grip (center, radius)', grips.length === 2);
  const gc = grips.find((g) => g.kind === 'center')!;
  const movedC = applyGripMove(circ, gc, { x: 50, y: 50 }) as CircleEntity;
  ok('kéo center → tâm đổi, bán kính giữ nguyên', ptApprox(movedC.c, { x: 50, y: 50 }) && approx(movedC.r, 100));
  const gr = grips.find((g) => g.kind === 'radius')!;
  const movedR = applyGripMove(circ, gr, { x: 0, y: 150 }) as CircleEntity;
  ok('kéo radius grip → bán kính đổi theo khoảng cách tới tâm', approx(movedR.r, 150) && ptApprox(movedR.c, { x: 0, y: 0 }));
}

function testArc() {
  console.log('\n[5] ARC — center + 2 đầu mút (chỉ đổi góc, giữ bán kính)');
  const arc: ArcEntity = { id: newId('e'), type: 'arc', layer: LAY, c: { x: 0, y: 0 }, r: 100, a1: 0, a2: Math.PI / 2 };
  const grips = gripsOf(arc);
  ok('3 grip (center + 2 đầu mút)', grips.length === 3);
  const gEnd = grips.find((g) => g.kind === 'endpoint' && g.index === 1)!;
  const moved = applyGripMove(arc, gEnd, { x: -100, y: 0 }) as ArcEntity; // kéo đầu a2 tới góc π
  ok('kéo đầu mút a2 tới (−100,0) → a2 = π, bán kính giữ nguyên', approx(moved.a2, Math.PI, 0.01) && approx(moved.r, 100));
}

function testTextBlock() {
  console.log('\n[6] TEXT/BLOCK — 1 grip điểm chèn');
  const block: BlockEntity = { id: newId('e'), type: 'block', layer: LAY, block: 'sofa2', at: { x: 0, y: 0 }, rot: 0, sx: 1, sy: 1 };
  const grips = gripsOf(block);
  ok('1 grip điểm chèn', grips.length === 1 && grips[0].kind === 'insertion');
  const moved = applyGripMove(block, grips[0], { x: 500, y: 500 }) as BlockEntity;
  ok('kéo grip → block dời tới điểm mới', ptApprox(moved.at, { x: 500, y: 500 }));
}

testLine();
testPolyline();
testRect();
testCircle();
testArc();
testTextBlock();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
