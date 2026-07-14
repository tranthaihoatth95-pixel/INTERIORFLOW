/**
 * lib/cad/gu-features.test.ts — kiểm occupancy-grid 8×8 + adjacency + typology (M-3, A-6). Chạy:
 *   node_modules/.bin/sucrase-node lib/cad/gu-features.test.ts
 */
import {
  occupancyGrid, roomFeatures, adjacencyGraph, classifyTypology, guCadFeatures,
  classifyOperatorWithLayout, GRID_N,
} from './gu-features';
import { emptyDoc } from './model';
import type { Doc, Pt } from './model';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

/* ───────────────────────── helpers dựng Doc ───────────────────────── */

let seq = 0;
function docWith(): Doc {
  seq = 0;
  return emptyDoc();
}
function addRect(d: Doc, x: number, y: number, w: number, h: number) {
  d.entities.push({ id: `r${seq++}`, type: 'rect', layer: 'l-wall', x, y, w, h });
}
function addLine(d: Doc, a: Pt, b: Pt) {
  d.entities.push({ id: `ln${seq++}`, type: 'line', layer: 'l-wall', a, b });
}
function addBlock(d: Doc, x: number, y: number, block = 'sofa-3seat') {
  d.entities.push({ id: `b${seq++}`, type: 'block', layer: 'l-furniture', block, at: { x, y }, rot: 0, sx: 1, sy: 1 });
}
function addText(d: Doc, x: number, y: number, text: string) {
  d.entities.push({ id: `t${seq++}`, type: 'text', layer: 'l-text', at: { x, y }, text, h: 200 });
}

/** Mặt bằng 2×2 phòng 10000×10000 (mỗi phòng 5000×5000) + nhãn toàn-hoa. */
function cellularDoc(): Doc {
  const d = docWith();
  addRect(d, 0, 0, 10000, 10000);
  addLine(d, { x: 5000, y: 0 }, { x: 5000, y: 10000 });
  addLine(d, { x: 0, y: 5000 }, { x: 10000, y: 5000 });
  addText(d, 2500, 2500, 'PHÒNG A'); // dưới-trái
  addText(d, 7500, 2500, 'PHÒNG B'); // dưới-phải
  addText(d, 2500, 7500, 'PHÒNG C'); // trên-trái
  addText(d, 7500, 7500, 'PHÒNG D'); // trên-phải
  return d;
}

/* ───────────────────────── [1] occupancy grid ───────────────────────── */

function testGrid() {
  console.log('\n[1] occupancyGrid — lưới 8×8, mật độ block, Y-up đảo hàng');
  const empty = occupancyGrid(emptyDoc());
  ok('doc rỗng → 8×8 toàn 0', empty.length === GRID_N && empty.every((r) => r.length === GRID_N && r.every((v) => v === 0)));

  const d = docWith();
  addRect(d, 0, 0, 16000, 16000); // bao hình 16m — cell 2000mm
  addBlock(d, 8000, 8000); // block ±1200 quanh tâm → rơi vào các ô lõi
  const g = occupancyGrid(d);
  const total = g.flat().reduce((s, v) => s + v, 0);
  ok('có mật độ > 0 khi có block', total > 0);
  ok('mật độ nằm ở lõi (hàng 3-4, cột 3-4)', g[3][3] > 0 && g[4][4] > 0 && g[0][0] === 0 && g[7][7] === 0);
  ok('giá trị ô kẹp ≤ 1', g.flat().every((v) => v <= 1));
  ok('tất định — chạy lại y hệt', JSON.stringify(occupancyGrid(d)) === JSON.stringify(g));

  // hàng 0 = mép TRÊN (Y lớn): block sát đỉnh phải nằm ở hàng đầu
  const d2 = docWith();
  addRect(d2, 0, 0, 16000, 16000);
  addBlock(d2, 8000, 15000);
  const g2 = occupancyGrid(d2);
  ok('block Y cao → hàng 0 (đảo trục cho trực giác bản vẽ)', g2[0].some((v) => v > 0) && g2[7].every((v) => v === 0));
}

/* ───────────────────────── [2] phòng + adjacency ───────────────────────── */

function testRoomsAdjacency() {
  console.log('\n[2] roomFeatures + adjacencyGraph — biên kín, kề qua tường, KHÔNG kề qua góc');
  const d = cellularDoc();
  const rooms = roomFeatures(d);
  ok('nhận 4 phòng biên kín', rooms.length === 4);
  ok('diện tích mỗi phòng = 25m²', rooms.every((r) => Math.abs(r.areaM2 - 25) < 0.5));
  ok('nhãn giữ nguyên', rooms.map((r) => r.name).join(',') === 'PHÒNG A,PHÒNG B,PHÒNG C,PHÒNG D');

  const edges = adjacencyGraph(rooms);
  const has = (i: number, j: number) => edges.some(([a, b]) => (a === i && b === j) || (a === j && b === i));
  ok('A kề B (chung tường dọc)', has(0, 1));
  ok('A kề C (chung tường ngang)', has(0, 2));
  ok('B kề D · C kề D', has(1, 3) && has(2, 3));
  ok('A KHÔNG kề D (chỉ chạm góc)', !has(0, 3));
  ok('B KHÔNG kề C (chỉ chạm góc)', !has(1, 2));

  // nhãn không có biên kín → không thành phòng
  const d2 = docWith();
  addLine(d2, { x: 0, y: 0 }, { x: 5000, y: 0 }); // 1 nét đơn độc — không kín
  addText(d2, 2500, 1000, 'PHÒNG HỞ');
  ok('nhãn không dò được biên kín → bỏ qua', roomFeatures(d2).length === 0);
}

/* ───────────────────────── [3] typology ───────────────────────── */

function testTypology() {
  console.log('\n[3] classifyTypology — 5 nhãn tất định + reasons');

  // cellular: 4 phòng kín phủ 100%
  const cel = classifyTypology(cellularDoc());
  ok('4 phòng kín phủ kín → cellular', cel.typology === 'cellular');
  ok('reasons giải thích được', cel.reasons.length > 0 && cel.reasons[0].includes('cellular'));

  // linear: dãy block 1 trục giữa mặt bằng vuông
  const lin = docWith();
  addRect(lin, 0, 0, 16000, 16000);
  for (let x = 2000; x <= 14000; x += 2000) addBlock(lin, x, 8000, 'desk-1200');
  ok('dãy bàn 1 trục → linear', classifyTypology(lin).typology === 'linear');

  // perimeter: block bám 4 mép
  const per = docWith();
  addRect(per, 0, 0, 16000, 16000);
  for (let t = 2000; t <= 14000; t += 4000) {
    addBlock(per, t, 800); // mép dưới
    addBlock(per, t, 15200); // mép trên
    addBlock(per, 800, t); // mép trái
    addBlock(per, 15200, t); // mép phải
  }
  ok('nội thất bám chu vi → perimeter', classifyTypology(per).typology === 'perimeter');

  // island: cụm block dồn lõi
  const isl = docWith();
  addRect(isl, 0, 0, 16000, 16000);
  addBlock(isl, 7000, 7000);
  addBlock(isl, 9000, 7000);
  addBlock(isl, 7000, 9000);
  addBlock(isl, 9000, 9000);
  ok('cụm giữa sàn → island', classifyTypology(isl).typology === 'island');

  // open-plan: tín hiệu lẫn lộn / thưa
  const op = docWith();
  addRect(op, 0, 0, 16000, 16000);
  addBlock(op, 8000, 8000);
  addBlock(op, 800, 800);
  addBlock(op, 15200, 15200);
  ok('tản đều không pattern → open-plan', classifyTypology(op).typology === 'open-plan');
  ok('doc rỗng → open-plan (không ném)', classifyTypology(emptyDoc()).typology === 'open-plan');
}

/* ───────────────────────── [4] guCadFeatures + nối operator ───────────────────────── */

function testFeaturesAndOperator() {
  console.log('\n[4] guCadFeatures + classifyOperatorWithLayout — additive lên classifier');
  const f = guCadFeatures(cellularDoc());
  ok('gói đủ grid/rooms/adjacency/typology/reasons',
    f.grid.length === GRID_N && f.rooms.length === 4 && f.adjacency.length === 4 && f.typology === 'cellular' && f.reasons.length > 0);
  ok('occupiedRatio ∈ [0,1]', f.occupiedRatio >= 0 && f.occupiedRatio <= 1);

  // typology 'cellular' cộng điểm residential — doc chỉ có nhãn trung tính vẫn nghiêng nhà ở
  const { profile } = classifyOperatorWithLayout(cellularDoc());
  ok('evidence có tín hiệu layout', profile.evidence.some((e) => e.signal === 'layout'));
  ok('cellular → residential thắng (không tín hiệu nào khác mạnh hơn)', profile.operator === 'residential');

  // additive: bàn làm việc (block) vẫn THẮNG tín hiệu layout — layout không lật nội thất thật
  const office = docWith();
  addRect(office, 0, 0, 16000, 16000);
  for (let x = 2000; x <= 14000; x += 2000) addBlock(office, x, 8000, 'desk-1200');
  const r2 = classifyOperatorWithLayout(office);
  ok('7 bàn (linear) → office vẫn thắng, typology chỉ bổ trợ', r2.profile.operator === 'office' && r2.features.typology === 'linear');
}

testGrid();
testRoomsAdjacency();
testTypology();
testFeaturesAndOperator();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
