/**
 * lib/cad/snap-priority.test.ts — T1 (Sprint ĐỔ NỀN 2): findSnap() phải chọn đúng NẤC ưu tiên
 * chuẩn AutoCAD OSNAP khi nhiều loại điểm bắt cùng nằm trong dung sai — không chỉ "ai gần con
 * trỏ hơn thắng" (bug cũ: intersection bị đẩy xuống rất thấp, endpoint/quadrant/node/center/
 * midpoint/perpendicular/tangent gộp chung 1 vòng so khoảng cách).
 * Chạy: node_modules/.bin/sucrase-node lib/cad/snap-priority.test.ts
 */
import { findSnap } from './query';
import type { SnapSettings } from './store';
import type { Doc, LineEntity, CircleEntity } from './model';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

const ALL_ON: SnapSettings = {
  enabled: true, endpoint: true, midpoint: true, center: true, intersection: true, grid: true,
  quadrant: true, node: true, nearest: true, perpendicular: true, tangent: true,
};

function docWith(entities: Doc['entities']): Doc {
  return {
    entities,
    layers: [{ id: 'l1', name: 'L1', color: '#ffffff', visible: true, locked: false }],
  };
}

console.log('\n[T1] findSnap — priority theo NẤC (endpoint > intersection > center > midpoint > perp/tangent > quadrant > node > nearest > grid)');

// 1) endpoint vs grid: điểm world nằm cách endpoint 5mm và cách 1 mắt lưới 100 y hệt gần hơn
//    (dựng để mắt lưới GẦN HƠN endpoint, endpoint vẫn phải thắng vì priority cao hơn, không phải "gần hơn").
{
  const line: LineEntity = { id: 'e1', type: 'line', layer: 'l1', a: { x: 1000, y: 1000 }, b: { x: 2000, y: 1000 } };
  const doc = docWith([line]);
  // world gần mắt lưới (1000,1000 trùng luôn endpoint a — dùng thẳng world=a để chắc chắn cả 2 cùng ứng viên)
  const r = findSnap(doc, { x: 1000, y: 1000 }, 50, 100, ALL_ON);
  ok('endpoint thắng dù grid cũng khớp tại đúng điểm đó', r.type === 'endpoint');
}

// 2) endpoint vs intersection: 2 line cắt nhau tại (1000,1000) — cũng là endpoint của line B.
//    endpoint phải thắng (priority cao hơn intersection dù cả 2 cùng khoảng cách 0).
{
  const lineA: LineEntity = { id: 'a', type: 'line', layer: 'l1', a: { x: 0, y: 1000 }, b: { x: 2000, y: 1000 } };
  const lineB: LineEntity = { id: 'b', type: 'line', layer: 'l1', a: { x: 1000, y: 1000 }, b: { x: 1000, y: 2000 } };
  const doc = docWith([lineA, lineB]);
  const r = findSnap(doc, { x: 1000, y: 1000 }, 50, 100, ALL_ON);
  ok('endpoint thắng intersection tại cùng 1 điểm', r.type === 'endpoint');
}

// 3) intersection thắng center: 2 line cắt nhau RẤT GẦN tâm 1 circle riêng biệt, nhưng intersection
//    gần con trỏ hơn 1 chút vẫn thắng theo priority (kể cả nếu center gần hơn, intersection vẫn thắng
//    vì nấc cao hơn) — dựng center XA hơn intersection một chút để không nhầm với "ai gần hơn".
{
  const lineA: LineEntity = { id: 'a', type: 'line', layer: 'l1', a: { x: 0, y: 1000 }, b: { x: 2000, y: 1000 } };
  const lineB: LineEntity = { id: 'b', type: 'line', layer: 'l1', a: { x: 1000, y: 0 }, b: { x: 1000, y: 2000 } };
  const circle: CircleEntity = { id: 'c', type: 'circle', layer: 'l1', c: { x: 1005, y: 1000 }, r: 300 };
  const doc = docWith([lineA, lineB, circle]);
  // world đặt tại đúng center (1005,1000) — GẦN center hơn intersection (1000,1000, cách 5mm) —
  // vẫn phải ra intersection vì nấc cao hơn thắng dù xa hơn 1 chút.
  const r = findSnap(doc, { x: 1005, y: 1000 }, 50, 100, ALL_ON);
  ok('intersection thắng center dù center gần con trỏ hơn', r.type === 'intersection');
}

// 4) quadrant KHÔNG được thắng center: circle có cả center và quadrant trong dung sai —
//    center (nấc 3) phải thắng quadrant (nấc 6) dù quadrant gần con trỏ hơn.
{
  const circle: CircleEntity = { id: 'c', type: 'circle', layer: 'l1', c: { x: 1000, y: 1000 }, r: 500 };
  const doc = docWith([circle]);
  // world giữa tâm và quadrant phải (1500,1000) — quadrant (1500,1000) cách 0, center (1000,1000) cách 500.
  // Dựng world SÁT quadrant để quadrant "gần hơn" nhưng center vẫn phải thắng theo priority + tolMm đủ rộng.
  const r = findSnap(doc, { x: 1490, y: 1000 }, 600, 100, ALL_ON);
  ok('center thắng quadrant dù quadrant gần con trỏ hơn', r.type === 'center');
}

// 5) grid chỉ được chọn khi KHÔNG còn nấc nào khác khớp (không có entity nào gần) — sanity cũ vẫn đúng.
{
  const doc = docWith([]);
  const r = findSnap(doc, { x: 1000, y: 1000 }, 50, 100, ALL_ON);
  ok('grid vẫn hoạt động khi không có entity nào', r.type === 'grid' && r.pt.x === 1000 && r.pt.y === 1000);
}

// 6) snap.enabled=false → luôn 'none', trả nguyên world (hành vi cũ giữ nguyên).
{
  const line: LineEntity = { id: 'e1', type: 'line', layer: 'l1', a: { x: 1000, y: 1000 }, b: { x: 2000, y: 1000 } };
  const doc = docWith([line]);
  const r = findSnap(doc, { x: 1000, y: 1000 }, 50, 100, { ...ALL_ON, enabled: false });
  ok('snap tắt hẳn → type none, trả nguyên world', r.type === 'none' && r.pt.x === 1000 && r.pt.y === 1000);
}

console.log(`\n[T1] snap-priority: ${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
