/**
 * lib/cad/hatch-openings-boundary.test.ts — T4 `openingsWidthOnBoundary()` (SPEC-VE-REVIT-MODE
 * §A7.2): tổng BỀ RỘNG cửa nằm TRÊN BIÊN polygon, trừ khỏi chu vi khi tính m dài len/phào.
 * File RIÊNG (không chèn vào hatch.test.ts) — tránh giẫm file test chung khi nhiều phiên cùng ghi.
 * Chạy: npx tsx lib/cad/hatch-openings-boundary.test.ts
 */
import {
  openingsWidthOnBoundary, OPENING_BOUNDARY_TOL_MM, polygonPerimeter,
} from './hatch';
import type { BlockEntity, Entity } from './model';
import { newId } from './store';

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
function approx(a: number, b: number, eps = 0.001): boolean { return Math.abs(a - b) <= eps; }

// Phòng 5000×4000 — đúng ca minh hoạ của spec §A7.2 (cạnh đáy 5000 có cửa 900 ở giữa).
const room = [{ x: 0, y: 0 }, { x: 5000, y: 0 }, { x: 5000, y: 4000 }, { x: 0, y: 4000 }];

/* ── 1) cửa nằm trên 1 cạnh ── */
function testDoorOnOneEdge() {
  console.log('\n[1] cửa trên 1 cạnh — ca spec §A7.2: 5000 − 900 = 4100');
  const door = doorBlock({ x: 2500, y: 0 }); // 'door' w=900, ĐÚNG trên cạnh đáy y=0
  ok('1 cửa 900 trên cạnh đáy → tổng bề rộng = 900', approx(openingsWidthOnBoundary([door], room), 900));
  const skirtMm = polygonPerimeter(room, [true, false, false, false]) - openingsWidthOnBoundary([door], room);
  ok('công thức §A7.6 trên cạnh đáy: 5000 − 900 = 4100', approx(skirtMm, 4100));
  const doorLech = doorBlock({ x: 1000, y: 120 }); // lệch 120mm khỏi cạnh (điểm chèn giữa bề dày tường) — vẫn ≤ tol 150
  ok(`cửa lệch 120mm khỏi cạnh (≤ tol ${OPENING_BOUNDARY_TOL_MM}) → vẫn tính = 900`, approx(openingsWidthOnBoundary([doorLech], room), 900));
}

/* ── 2) cửa trên 2 cạnh khác nhau ── */
function testDoorsOnTwoEdges() {
  console.log('\n[2] cửa trên 2 cạnh khác nhau — cộng dồn');
  const doorBottom = doorBlock({ x: 2500, y: 0 });          // cạnh đáy, w=900
  const doorLeft = doorBlock({ x: 0, y: 2000 }, 'doorWC');  // cạnh trái x=0, w=700
  ok('cửa 900 (đáy) + cửa 700 (trái) = 1600', approx(openingsWidthOnBoundary([doorBottom, doorLeft], room), 1600));
}

/* ── 3) cửa KHÔNG nằm trên biên ── */
function testDoorNotOnBoundary() {
  console.log('\n[3] cửa KHÔNG trên biên — không trừ');
  const doorMid = doorBlock({ x: 2500, y: 2000 }); // giữa phòng, cách cạnh gần nhất 2000mm
  ok('cửa giữa phòng (cách biên 2000mm) → 0', approx(openingsWidthOnBoundary([doorMid], room), 0));
  const doorJustOver = doorBlock({ x: 2500, y: OPENING_BOUNDARY_TOL_MM + 1 }); // 151mm — quá tol đúng 1mm
  ok(`cửa cách cạnh ${OPENING_BOUNDARY_TOL_MM + 1}mm (> tol ${OPENING_BOUNDARY_TOL_MM}) → 0`, approx(openingsWidthOnBoundary([doorJustOver], room), 0));
  ok('cùng cửa đó, nới tolMm=200 → tính lại = 900 (tol là CONFIG, không hard-code)', approx(openingsWidthOnBoundary([doorJustOver], room, 200), 900));
  const doorOutside = doorBlock({ x: 9000, y: 9000 }); // ngoài phòng hẳn
  ok('cửa ngoài phòng hẳn → 0', approx(openingsWidthOnBoundary([doorOutside], room), 0));
}

/* ── 4) polygon không cửa ── */
function testNoOpenings() {
  console.log('\n[4] polygon không cửa → 0');
  ok('danh sách entity rỗng → 0', approx(openingsWidthOnBoundary([], room), 0));
  const sofa: Entity = { id: newId('e'), type: 'block', layer: LAY, block: 'sofa2', at: { x: 2500, y: 10 }, rot: 0, sx: 1, sy: 1, elementType: 'furniture' } as BlockEntity;
  ok('block furniture sát biên → bỏ qua (chỉ nhận door/window đã phân loại)', approx(openingsWidthOnBoundary([sofa], room), 0));
  const line: Entity = { id: newId('e'), type: 'line', layer: LAY, a: { x: 0, y: 0 }, b: { x: 1000, y: 0 } } as Entity;
  ok('entity không phải block → bỏ qua', approx(openingsWidthOnBoundary([line], room), 0));
}

/* ── 5) rẽ nhánh loại phào (spec: "đừng trừ mù") ── */
function testKindBranch() {
  console.log('\n[5] rẽ nhánh kinds — len chân tường mặc định KHÔNG trừ cửa sổ');
  const win = windowBlock({ x: 1000, y: 4000 }); // 'window' w=1200, trên cạnh đỉnh y=4000
  const door = doorBlock({ x: 2500, y: 0 });
  ok('mặc định (len chân tường): cửa sổ trên biên KHÔNG trừ → chỉ 900', approx(openingsWidthOnBoundary([door, win], room), 900));
  ok("kinds=['door','window'] (caller có ý thức) → 900 + 1200 = 2100", approx(openingsWidthOnBoundary([door, win], room, OPENING_BOUNDARY_TOL_MM, ['door', 'window']), 2100));
  ok("kinds=['window'] → chỉ 1200", approx(openingsWidthOnBoundary([door, win], room, OPENING_BOUNDARY_TOL_MM, ['window']), 1200));
}

/* ── 6) block lạ không có w — không đoán mò ── */
function testUnknownBlock() {
  console.log('\n[6] block lạ (DXF ngoài BLOCK_MAP) — không đoán mò');
  const unknown: Entity = { id: newId('e'), type: 'block', layer: LAY, block: 'khong-co-trong-block-map', at: { x: 2500, y: 0 }, rot: 0, sx: 1, sy: 1, elementType: 'door' } as BlockEntity;
  ok('block door lạ trên biên nhưng không có w → bỏ qua, 0', approx(openingsWidthOnBoundary([unknown], room), 0));
}

testDoorOnOneEdge();
testDoorsOnTwoEdges();
testDoorNotOnBoundary();
testNoOpenings();
testKindBranch();
testUnknownBlock();

console.log(`\n${pass} pass · ${fail} fail`);
if (fail > 0) process.exit(1);
