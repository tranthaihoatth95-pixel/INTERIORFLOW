/**
 * lib/cad/sprint10-precision.test.ts — Sprint 10: nhập toạ độ chính xác (parseCoordInput/
 * resolveCoordInput trong commands.ts) + hình học thuần mới (polygon đều/ellipse/spline/
 * divide-measure trong geometry.ts). Chạy: node_modules/.bin/sucrase-node lib/cad/sprint10-precision.test.ts
 */
import { parseCoordInput, resolveCoordInput } from './commands';
import {
  polygonVertices,
  ellipsePoints,
  catmullRomSpline,
  entityLength,
  pointAtLength,
  divideEntity,
  measureEntity,
} from './geometry';
import type { LineEntity, PolylineEntity, CircleEntity, ArcEntity } from './model';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}
function approx(a: number, b: number, eps = 0.01): boolean {
  return Math.abs(a - b) <= eps;
}

/* ── Việc 1: parseCoordInput / resolveCoordInput ── */
function testCoordInput() {
  console.log('\n[Sprint10] parseCoordInput/resolveCoordInput — toạ độ tuyệt đối/tương đối');

  const abs1 = parseCoordInput('1500,2200');
  ok('abs: parse đúng kind', abs1?.kind === 'abs');
  if (abs1?.kind === 'abs') {
    ok('abs: x đúng', approx(abs1.pt.x, 1500));
    ok('abs: y đúng', approx(abs1.pt.y, 2200));
  }
  ok('abs: resolve không cần base', resolveCoordInput(abs1!)?.x === 1500);

  const rel1 = parseCoordInput('@300,-150');
  ok('rel: parse đúng kind', rel1?.kind === 'rel');
  if (rel1?.kind === 'rel') {
    ok('rel: dx đúng', approx(rel1.dx, 300));
    ok('rel: dy đúng', approx(rel1.dy, -150));
  }
  const base = { x: 1000, y: 1000 };
  const resolved = resolveCoordInput(rel1!, base);
  ok('rel: resolve cộng base đúng x', approx(resolved!.x, 1300));
  ok('rel: resolve cộng base đúng y', approx(resolved!.y, 850));
  ok('rel: không có base → null', resolveCoordInput(rel1!, undefined) === null);

  ok('số đơn (độ dài, không phải toạ độ) → null', parseCoordInput('500') === null);
  ok('chuỗi rỗng → null', parseCoordInput('') === null);
  ok('sai định dạng (3 phần) → null', parseCoordInput('1,2,3') === null);
  ok('sai định dạng (không phải số) → null', parseCoordInput('a,b') === null);
  ok('âm cả 2 trục hợp lệ', parseCoordInput('-100,-200')?.kind === 'abs');
}

/* ── Việc 2: polygonVertices — đa giác đều N cạnh ── */
function testPolygon() {
  console.log('\n[Sprint10] polygonVertices — đa giác đều');
  const center = { x: 0, y: 0 };
  const radiusPt = { x: 100, y: 0 }; // bán kính 100, góc bắt đầu 0°
  const hexagon = polygonVertices(center, radiusPt, 6);
  ok('lục giác: đủ 6 đỉnh', hexagon.length === 6);
  for (const p of hexagon) {
    ok(`lục giác: đỉnh (${p.x.toFixed(1)},${p.y.toFixed(1)}) cách tâm = bán kính`, approx(Math.hypot(p.x - center.x, p.y - center.y), 100, 0.01));
  }
  // đỉnh đầu tiên phải trùng điểm bán kính đã click (góc bắt đầu)
  ok('lục giác: đỉnh đầu trùng điểm click', approx(hexagon[0].x, 100) && approx(hexagon[0].y, 0));
  // góc giữa 2 đỉnh liên tiếp = 360/6 = 60°
  const ang = (p: { x: number; y: number }) => Math.atan2(p.y, p.x);
  const deltaDeg = ((ang(hexagon[1]) - ang(hexagon[0])) * 180) / Math.PI;
  ok('lục giác: góc bước 60°', approx(Math.abs(deltaDeg), 60, 0.01));

  const triangle = polygonVertices(center, { x: 50, y: 0 }, 3);
  ok('tam giác đều: đủ 3 đỉnh', triangle.length === 3);
  const dodeca = polygonVertices(center, { x: 50, y: 0 }, 12);
  ok('12 cạnh: đủ 12 đỉnh', dodeca.length === 12);
}

/* ── Việc 3.3: ellipsePoints — 2 bán trục ── */
function testEllipse() {
  console.log('\n[Sprint10] ellipsePoints — 2 bán trục');
  const center = { x: 500, y: 500 };
  const rx = 200;
  const ry = 80;
  const pts = ellipsePoints(center, rx, ry, 48);
  ok('ellipse: đủ số điểm xấp xỉ', pts.length === 48);
  const xs = pts.map((p) => p.x - center.x);
  const ys = pts.map((p) => p.y - center.y);
  ok('ellipse: bán trục X đúng (max |dx| ≈ rx)', approx(Math.max(...xs.map(Math.abs)), rx, 1));
  ok('ellipse: bán trục Y đúng (max |dy| ≈ ry)', approx(Math.max(...ys.map(Math.abs)), ry, 1));
  // mọi điểm phải thoả phương trình ellipse (x/rx)^2+(y/ry)^2=1
  let allOnEllipse = true;
  for (const p of pts) {
    const dx = (p.x - center.x) / rx;
    const dy = (p.y - center.y) / ry;
    if (!approx(dx * dx + dy * dy, 1, 0.01)) allOnEllipse = false;
  }
  ok('ellipse: mọi điểm thoả phương trình chuẩn', allOnEllipse);
}

/* ── Việc 3.1: catmullRomSpline — nội suy qua các control point ── */
function testSpline() {
  console.log('\n[Sprint10] catmullRomSpline — nội suy cong');
  const ctrl = [
    { x: 0, y: 0 },
    { x: 100, y: 200 },
    { x: 300, y: 150 },
    { x: 500, y: 400 },
  ];
  const curve = catmullRomSpline(ctrl, 12, false);
  ok('spline: nhiều điểm hơn control points (đủ mượt)', curve.length > ctrl.length);
  ok('spline: điểm đầu trùng control point đầu', approx(curve[0].x, ctrl[0].x, 0.01) && approx(curve[0].y, ctrl[0].y, 0.01));
  ok('spline: điểm cuối trùng control point cuối', approx(curve[curve.length - 1].x, ctrl[3].x, 0.01) && approx(curve[curve.length - 1].y, ctrl[3].y, 0.01));
  // đi qua các control point GIỮA (không chỉ đầu/cuối) — tìm điểm gần nhất trong curve có khớp
  for (const c of ctrl) {
    const hit = curve.some((p) => approx(p.x, c.x, 0.5) && approx(p.y, c.y, 0.5));
    ok(`spline: đi qua control point (${c.x},${c.y})`, hit);
  }
  // 2 control points → vẫn trả về (thoái hoá thành đoạn thẳng nội suy)
  const two = catmullRomSpline([{ x: 0, y: 0 }, { x: 100, y: 100 }], 8, false);
  ok('spline: 2 control points vẫn ra điểm', two.length >= 2);
  ok('spline: 2 control points điểm đầu đúng', approx(two[0].x, 0) && approx(two[0].y, 0));
  ok('spline: 2 control points điểm cuối đúng', approx(two[two.length - 1].x, 100) && approx(two[two.length - 1].y, 100));
}

/* ── Việc 3.5: entityLength / pointAtLength / divideEntity / measureEntity ── */
function testDivideMeasure() {
  console.log('\n[Sprint10] divideEntity/measureEntity — chia đều N đoạn / đo khoảng cách cố định');

  const line: LineEntity = { id: 'l1', type: 'line', layer: 'l-wall', a: { x: 0, y: 0 }, b: { x: 1000, y: 0 } };
  ok('line: entityLength = 1000', approx(entityLength(line), 1000));
  const midP = pointAtLength(line, 500);
  ok('line: pointAtLength(500) = trung điểm', !!midP && approx(midP.x, 500) && approx(midP.y, 0));

  // Divide 1 line dài 1000mm thành 5 đoạn → 4 điểm chia tại 200/400/600/800
  const div5 = divideEntity(line, 5);
  ok('divide line: 5 đoạn → 4 điểm chia', div5.length === 4);
  const expectedX = [200, 400, 600, 800];
  div5.forEach((p, i) => ok(`divide line: điểm ${i} tại x=${expectedX[i]}`, approx(p.x, expectedX[i], 0.01) && approx(p.y, 0, 0.01)));

  // Measure 1 line dài 1000mm mỗi 300mm → điểm tại 300/600/900 (KHÔNG có điểm ở 1000, còn dư)
  const mea300 = measureEntity(line, 300);
  ok('measure line: 3 điểm (300/600/900)', mea300.length === 3);
  ok('measure line: điểm 1 tại x=300', approx(mea300[0].x, 300, 0.01));
  ok('measure line: điểm 3 tại x=900', approx(mea300[2].x, 900, 0.01));

  // Polyline hở 2 đoạn (0,0)→(100,0)→(100,100), tổng dài 200mm — chia 4 đoạn → 3 điểm chia tại 50mm
  const pl: PolylineEntity = { id: 'pl1', type: 'polyline', layer: 'l-wall', closed: false, points: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }] };
  ok('polyline: entityLength = 200', approx(entityLength(pl), 200));
  const divPl = divideEntity(pl, 4);
  ok('polyline: chia 4 đoạn → 3 điểm', divPl.length === 3);
  ok('polyline: điểm giữa tại góc bẻ (100,0)', approx(divPl[1].x, 100, 0.01) && approx(divPl[1].y, 0, 0.01));

  // Circle chu vi 2πr — chia N đoạn → N điểm (đối tượng KÍN, không trừ 1 như line hở)
  const circle: CircleEntity = { id: 'c1', type: 'circle', layer: 'l-wall', c: { x: 0, y: 0 }, r: 100 };
  const circumference = 2 * Math.PI * 100;
  ok('circle: entityLength = chu vi', approx(entityLength(circle), circumference, 0.1));
  const divCircle = divideEntity(circle, 4);
  ok('circle: chia 4 đoạn (kín) → 4 điểm', divCircle.length === 4);
  // 4 điểm cách đều 90° quanh tâm, đều cách tâm = bán kính
  divCircle.forEach((p) => ok(`circle: điểm cách tâm = bán kính`, approx(Math.hypot(p.x, p.y), 100, 0.1)));

  // Arc nửa vòng (a1=0, a2=π), bán kính 50 → dài = π*50
  const arc: ArcEntity = { id: 'a1', type: 'arc', layer: 'l-wall', c: { x: 0, y: 0 }, r: 50, a1: 0, a2: Math.PI };
  ok('arc: entityLength = π·r', approx(entityLength(arc), Math.PI * 50, 0.1));
  const divArc = divideEntity(arc, 2);
  ok('arc: chia 2 đoạn (hở) → 1 điểm giữa', divArc.length === 1);
  ok('arc: điểm giữa ở góc 90°', approx(divArc[0].x, 0, 0.5) && approx(divArc[0].y, 50, 0.5));
}

testCoordInput();
testPolygon();
testEllipse();
testSpline();
testDivideMeasure();

console.log(`\n[Sprint10] precision-geometry: ${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
