/**
 * lib/cad/hatch.test.ts — kiểm dò biên (boundary trace) + sinh pattern (Nấc 4). Chạy bằng:
 *   node_modules/.bin/sucrase-node lib/cad/hatch.test.ts
 */
import {
  pointInPolygon, polygonArea, traceHatchBoundary, findHatchBoundary, hatchLines, hatchDots,
  polygonPerimeter, openingsAreaInPolygon, BOQ_OPENING_MIN_AREA_M2, OPENING_STANDARD_HEIGHT_MM,
} from './hatch';
import { emptyDoc } from './model';
import type { Doc, LineEntity, BlockEntity, Entity } from './model';
import { newId } from './id';
import { wallChain } from './commands';
import { buildDemoPlan } from './demo-plan';

const LAY = 'l-default';
function doorBlock(at: { x: number; y: number }, block = 'door'): BlockEntity {
  return { id: newId('e'), type: 'block', layer: LAY, block, at, rot: 0, sx: 1, sy: 1, elementType: 'door' };
}
function windowBlock(at: { x: number; y: number }): BlockEntity {
  return { id: newId('e'), type: 'block', layer: LAY, block: 'window', at, rot: 0, sx: 1, sy: 1, elementType: 'window' };
}

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}
function approx(a: number, b: number, eps = 1): boolean { return Math.abs(a - b) <= eps; }

function rectSegs(x0: number, y0: number, x1: number, y1: number): [{ x: number; y: number }, { x: number; y: number }][] {
  const p = [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }];
  return [[p[0], p[1]], [p[1], p[2]], [p[2], p[3]], [p[3], p[0]]];
}

function testPointInPolygon() {
  console.log('\n[1] pointInPolygon');
  const square = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }];
  ok('điểm giữa hình vuông → true', pointInPolygon({ x: 50, y: 50 }, square));
  ok('điểm ngoài hình vuông → false', !pointInPolygon({ x: 200, y: 50 }, square));
  ok('polygonArea hình vuông 100x100 = 10000', approx(polygonArea(square), 10000));
}

/* ── 2) dò biên phòng chữ nhật đơn giản, ghép từ 4 LINE rời ── */
function testSimpleRoom() {
  console.log('\n[2] Boundary trace — phòng chữ nhật 4 LINE rời, click giữa phòng');
  const segs = rectSegs(0, 0, 4000, 3000);
  const poly = traceHatchBoundary(segs, { x: 2000, y: 1500 });
  ok('dò được 1 vòng kín', !!poly);
  if (poly) {
    ok('diện tích ≈ 4000×3000 = 12,000,000 mm²', approx(polygonArea(poly), 12_000_000, 5000));
    ok('điểm pick nằm trong vòng dò được', pointInPolygon({ x: 2000, y: 1500 }, poly));
  }
}

/* ── 3) phòng lồng phòng — click ở vùng trong cùng phải ra vòng NHỎ NHẤT chứa nó ── */
function testNestedRoom() {
  console.log('\n[3] Boundary trace — 2 hình chữ nhật lồng nhau, click vùng trong → vòng nhỏ nhất');
  const outer = rectSegs(0, 0, 10000, 8000);
  const inner = rectSegs(2000, 2000, 5000, 5000); // hoàn toàn nằm trong outer, không giao nhau
  const segs = [...outer, ...inner];
  const poly = traceHatchBoundary(segs, { x: 3000, y: 3000 }); // pick nằm TRONG inner
  ok('dò được vòng kín cho vùng trong cùng (inner)', !!poly);
  if (poly) {
    ok('diện tích khớp inner (3000×3000=9,000,000), KHÔNG phải outer', approx(polygonArea(poly), 9_000_000, 5000));
  }
  const polyOuterRegion = traceHatchBoundary(segs, { x: 500, y: 500 }); // pick nằm giữa outer và inner (vùng khung, không lồng)
  ok('click vùng giữa outer/inner: dò thất bại hoặc không khớp diện tích inner (đúng vì đó là vùng hình khung phức tạp, không phải rect đơn)', !polyOuterRegion || !approx(polygonArea(polyOuterRegion), 9_000_000, 5000));
}

/* ── 4) không có gì để dò (đoạn hở, không khép kín) → null ── */
function testOpenNoClose() {
  console.log('\n[4] Boundary trace — đoạn hở (chữ U, không khép kín) → null');
  const segs: [{ x: number; y: number }, { x: number; y: number }][] = [
    [{ x: 0, y: 0 }, { x: 0, y: 1000 }],
    [{ x: 0, y: 0 }, { x: 1000, y: 0 }],
    [{ x: 1000, y: 0 }, { x: 1000, y: 1000 }],
    // thiếu cạnh trên cùng → không khép kín
  ];
  const poly = traceHatchBoundary(segs, { x: 500, y: 500 });
  ok('không khép được → null', poly === null);
}

/* ── 5) findHatchBoundary từ Doc thật (entity LINE) ── */
function testFromDoc() {
  console.log('\n[5] findHatchBoundary — trực tiếp từ Doc (4 LINE entity)');
  const doc: Doc = emptyDoc();
  const lay = doc.layers[0].id;
  const pts = [{ x: 0, y: 0 }, { x: 5000, y: 0 }, { x: 5000, y: 4000 }, { x: 0, y: 4000 }];
  for (let i = 0; i < 4; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % 4];
    const line: LineEntity = { id: newId('e'), type: 'line', layer: lay, a, b };
    doc.entities.push(line);
  }
  const poly = findHatchBoundary(doc, { x: 2500, y: 2000 });
  ok('dò được biên từ Doc', !!poly);
  if (poly) ok('diện tích ≈ 5000×4000=20,000,000', approx(polygonArea(poly), 20_000_000, 5000));
}

/* ── 6) sinh pattern ── */
function testPatterns() {
  console.log('\n[6] Sinh pattern ANSI31/ANSI32/ANSI37 + DOTS');
  const square = [{ x: 0, y: 0 }, { x: 1000, y: 0 }, { x: 1000, y: 1000 }, { x: 0, y: 1000 }];
  const a31 = hatchLines(square, 'ANSI31', 1, 0);
  ok('ANSI31 sinh ra ít nhất vài đường', a31.length > 0);
  ok('mọi đoạn ANSI31 nằm trong hình vuông (điểm giữa đoạn ở trong)', a31.every(([p, q]) => pointInPolygon({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }, square)));

  const a32 = hatchLines(square, 'ANSI32', 1, 0);
  ok('ANSI32 thưa hơn ANSI31 (ít đường hơn, cùng scale)', a32.length < a31.length);

  const a37 = hatchLines(square, 'ANSI37', 1, 0);
  ok('ANSI37 (crosshatch 2 họ) nhiều đoạn hơn 1 họ đơn', a37.length > a31.length * 0.8);

  const dots = hatchDots(square, 1);
  ok('DOTS sinh ra điểm, mọi điểm nằm trong hình vuông', dots.length > 0 && dots.every((p) => pointInPolygon(p, square)));

  const a31Scaled = hatchLines(square, 'ANSI31', 3, 0);
  ok('scale lớn hơn → ít đường hơn (thưa hơn)', a31Scaled.length < a31.length);
}

/* ── 7) T-JUNCTION — 2 phòng chia bởi vách đâm vào tường bao (quad tường dày thật, không vát
 * góc, mỗi wallSegment phát cả hatch + polyline trùng cạnh — đúng hình học wallChain sinh ra).
 * Đây là ca từng FAIL của thuật toán cũ (rẽ-góc-nhỏ-nhất lạc lối tại đỉnh chữ T bậc ≥4). ── */
function testTJunctionTwoRooms() {
  console.log('\n[7] Boundary trace — 2 phòng, vách ngăn đâm chữ T vào tường bao (quad dày)');
  const doc: Doc = emptyDoc();
  const lay = doc.layers[0].id;
  const EXT = 200; // tường bao
  const PART = 100; // vách ngăn giữa, tim x=4000, đâm chữ T vào tường bao Nam + Bắc
  doc.entities.push(...wallChain([{ x: 0, y: 0 }, { x: 8000, y: 0 }, { x: 8000, y: 6000 }, { x: 0, y: 6000 }], EXT, lay, true));
  doc.entities.push(...wallChain([{ x: 4000, y: 0 }, { x: 4000, y: 6000 }], PART, lay));
  // phòng trái thông thuỷ: x 100..3950, y 100..5900 → 3850×5800 = 22,330,000 mm²
  const expected = 3850 * 5800;
  const left = findHatchBoundary(doc, { x: 2000, y: 3000 });
  ok('phòng TRÁI (kề chữ T): dò được vòng kín', !!left);
  if (left) ok('diện tích phòng trái = 3850×5800 thông thuỷ', approx(polygonArea(left), expected, 5000));
  const right = findHatchBoundary(doc, { x: 6000, y: 3000 });
  ok('phòng PHẢI (kề chữ T): dò được vòng kín', !!right);
  if (right) ok('diện tích phòng phải = 3850×5800 thông thuỷ', approx(polygonArea(right), expected, 5000));
  // pick NGAY TRONG khe chồng lấn quad tại chân chữ T (x quanh 4000, y trong lòng tường Nam
  // dưới mặt trong y=100) → phải ra mặt NHỎ (khe), không phải phòng — và không được null.
  const sliver = findHatchBoundary(doc, { x: 4000, y: 50 });
  ok('pick trong khe chồng lấn quad → ra mặt nhỏ (<0.1m²), không lẫn với phòng', !!sliver && polygonArea(sliver) < 100_000);
}

/* ── 8) MẶT BẰNG DEMO THẬT (demo-plan.ts) — đo cả 4 phòng có nhãn, kể cả 2 phòng kề chữ T
 * từng fail ("PHÒNG KHÁCH + ĂN", "BẾP"). Lọc dim/text/layer trục y hệt wallLikeDoc của
 * standards/checker.ts (nơi tái dùng thuật toán này để đo diện tích phòng). ── */
function testDemoPlanRooms() {
  console.log('\n[8] Boundary trace — demo-plan thật: 4 phòng + hành lang, có chữ T');
  const full = buildDemoPlan();
  const axisLayerIds = new Set(full.layers.filter((l) => l.name === 'Trục' || l.id === 'l-axis').map((l) => l.id));
  const doc: Doc = {
    layers: full.layers,
    entities: full.entities.filter((e) => e.type !== 'dim' && e.type !== 'text' && !axisLayerIds.has(e.layer)),
  };
  // kỳ vọng = diện tích thông thuỷ demo-plan tự tính khi sinh nhãn (xem demo-plan.ts):
  // sống chung 1 nguồn số W/H/XP/Y1/Y2/XW/EXT/PART — nếu demo đổi kích thước, cập nhật đây.
  const cases: { name: string; pick: { x: number; y: number }; m2: number }[] = [
    { name: 'PHÒNG KHÁCH + ĂN (kề chữ T — ca fail cũ)', pick: { x: 1900, y: 6900 }, m2: 36.7 },
    { name: 'BẾP (kề chữ T — ca fail cũ)', pick: { x: 5660, y: 950 }, m2: 5.7 },
    { name: 'PHÒNG NGỦ', pick: { x: 6900, y: 6900 }, m2: 12.2 },
    { name: 'WC', pick: { x: 6860, y: 2750 }, m2: 3.6 },
    { name: 'H.LANG', pick: { x: 5660, y: 2750 }, m2: (1100 * 1600) / 1e6 },
  ];
  for (const c of cases) {
    const poly = findHatchBoundary(doc, c.pick);
    ok(`${c.name}: dò được vòng kín`, !!poly);
    if (poly) {
      const m2 = polygonArea(poly) / 1e6;
      ok(`${c.name}: diện tích ≈ ${c.m2} m² (đo được ${m2.toFixed(2)})`, approx(m2, c.m2, 0.15));
    }
  }
}

/* ── 9) polygonPerimeter — 2.1.9.q ── */
function testPolygonPerimeter() {
  console.log('\n[9] polygonPerimeter — 2.1.9.q');
  const rect = [{ x: 0, y: 0 }, { x: 4000, y: 0 }, { x: 4000, y: 3000 }, { x: 0, y: 3000 }];
  ok('chu vi đầy đủ hình chữ nhật 4000×3000 = 14000', approx(polygonPerimeter(rect), 14000));
  ok('edgeMask chỉ lấy cạnh 0 (đáy, dài 4000)', approx(polygonPerimeter(rect, [true, false, false, false]), 4000));
  ok('edgeMask 2 cạnh đối (đáy+đỉnh, mỗi cạnh 4000) = 8000', approx(polygonPerimeter(rect, [true, false, true, false]), 8000));
  ok('edgeMask toàn false = 0', approx(polygonPerimeter(rect, [false, false, false, false]), 0));
  ok('không truyền edgeMask = chu vi đầy đủ (mặc định lấy hết)', approx(polygonPerimeter(rect), polygonPerimeter(rect, [true, true, true, true])));
}

/* ── 10) openingsAreaInPolygon — 2.1.9.q, trừ lỗ mở cửa/cửa sổ ── */
function testOpeningsAreaInPolygon() {
  console.log('\n[10] openingsAreaInPolygon — 2.1.9.q');
  const room = [{ x: 0, y: 0 }, { x: 5000, y: 0 }, { x: 5000, y: 4000 }, { x: 0, y: 4000 }];

  const doorInside = doorBlock({ x: 2500, y: 10 }); // 'door' block w=900 — lệch nhẹ khỏi biên y=0 (tránh mơ hồ ray-casting đúng trên cạnh)
  const expectedDoorM2 = (900 * OPENING_STANDARD_HEIGHT_MM.door) / 1e6;
  ok(`1 cửa trong phòng (rộng 900) → diện tích ≈ ${expectedDoorM2.toFixed(2)} m² (900×${OPENING_STANDARD_HEIGHT_MM.door})`, approx(openingsAreaInPolygon([doorInside], room), expectedDoorM2, 0.01));

  const doorOutside = doorBlock({ x: 9000, y: 9000 }); // ngoài room hẳn
  ok('cửa NẰM NGOÀI polygon → không trừ (0 m²)', approx(openingsAreaInPolygon([doorOutside], room), 0, 0.001));

  const win = windowBlock({ x: 1000, y: 3990 }); // 'window' block w=1200 — lệch nhẹ khỏi biên y=4000
  const expectedWinM2 = (1200 * OPENING_STANDARD_HEIGHT_MM.window) / 1e6;
  const both = openingsAreaInPolygon([doorInside, win], room);
  ok(`cửa + cửa sổ cùng trong phòng → cộng dồn ≈ ${(expectedDoorM2 + expectedWinM2).toFixed(2)} m²`, approx(both, expectedDoorM2 + expectedWinM2, 0.01));

  const furnitureNotOpening: Entity = { id: newId('e'), type: 'block', layer: LAY, block: 'sofa2', at: { x: 2000, y: 2000 }, rot: 0, sx: 1, sy: 1, elementType: 'furniture' } as BlockEntity;
  ok('entity block KHÔNG phải cửa/cửa sổ (furniture) → bỏ qua dù ở trong polygon', approx(openingsAreaInPolygon([furnitureNotOpening], room), 0, 0.001));

  const tinyDoor = doorBlock({ x: 2500, y: 10 }, 'doorWC'); // w=700 → 700×2100/1e6 = 1.47m², vẫn > ngưỡng 0.5
  ok(`ngưỡng mặc định ${BOQ_OPENING_MIN_AREA_M2}m² — cửa WC 700 vẫn vượt ngưỡng, vẫn trừ`, approx(openingsAreaInPolygon([tinyDoor], room), (700 * OPENING_STANDARD_HEIGHT_MM.door) / 1e6, 0.01));
  ok('ngưỡng cao hơn diện tích cửa thật → không trừ (đúng nghĩa CONFIG điều khiển được, không hard-code)', approx(openingsAreaInPolygon([tinyDoor], room, 5), 0, 0.001));

  const unknownBlock: Entity = { id: newId('e'), type: 'block', layer: LAY, block: 'khong-ton-tai-trong-block-map', at: { x: 2500, y: 10 }, rot: 0, sx: 1, sy: 1, elementType: 'door' } as BlockEntity;
  ok('block KHÔNG có trong BLOCK_MAP (DXF lạ) → không đoán mò kích thước, bỏ qua', approx(openingsAreaInPolygon([unknownBlock], room), 0, 0.001));
}

testPointInPolygon();
testSimpleRoom();
testNestedRoom();
testOpenNoClose();
testFromDoc();
testPatterns();
testTJunctionTwoRooms();
testDemoPlanRooms();
testPolygonPerimeter();
testOpeningsAreaInPolygon();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
