/**
 * lib/cad/furniture.test.ts — kiểm thư viện block nội thất (Sprint 3, B1.1/B1.2/B1.5).
 * Chạy bằng: node_modules/.bin/sucrase-node lib/cad/furniture.test.ts
 * (cùng pattern modify.test.ts — không Jest/Vitest, không phải file production).
 */
import { BLOCKS, BLOCK_MAP } from './furniture';
import type { BlockDef, ShapeVariant, SnapAnchor, ClearanceZone } from './furniture';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

function findBlock(id: string): BlockDef {
  const b = BLOCK_MAP[id];
  if (!b) throw new Error(`missing block ${id}`);
  return b;
}

// ---- Toàn vẹn cơ bản: mọi block có id duy nhất, w/h > 0, ít nhất 1 prim ----
function testBasicIntegrity() {
  console.log('basic integrity:');
  const ids = new Set<string>();
  for (const b of BLOCKS) {
    ok(`${b.id}: id duy nhất`, !ids.has(b.id));
    ids.add(b.id);
    ok(`${b.id}: w > 0`, b.w > 0);
    ok(`${b.id}: h > 0`, b.h > 0);
    ok(`${b.id}: có prims`, b.prims.length > 0);
    // variant id duy nhất trong 1 BlockDef
    if (b.variants) {
      const vids = new Set<string>();
      for (const v of b.variants) {
        ok(`${b.id}.variant ${v.id}: id duy nhất trong block`, !vids.has(v.id));
        vids.add(v.id);
        ok(`${b.id}.variant ${v.id}: w/h > 0`, v.w > 0 && v.h > 0);
        ok(`${b.id}.variant ${v.id}: có prims`, v.prims.length > 0);
      }
    }
  }
  ok('18 block cũ vẫn còn nguyên (>= 18 tổng)', BLOCKS.length >= 18);
}

// ---- 18 block cũ không bị đổi id/group (backward-compat) ----
function testLegacyBlocksUnchanged() {
  console.log('legacy blocks unchanged:');
  const legacy: Array<[string, BlockDef['group'], number, number]> = [
    ['sofa2', 'Phòng khách', 1600, 900],
    ['sofa3', 'Phòng khách', 2100, 900],
    ['armchair', 'Phòng khách', 760, 780],
    ['dining4', 'Phòng ăn', 1200, 1760],
    ['dining6', 'Phòng ăn', 1600, 1760],
    ['dining8', 'Phòng ăn', 2200, 1760],
    ['bedS', 'Phòng ngủ', 1000, 2000],
    ['bedD', 'Phòng ngủ', 1600, 2000],
    ['wardrobe', 'Phòng ngủ', 1800, 600],
    ['desk', 'Làm việc', 1400, 1300],
    ['toilet', 'Vệ sinh', 400, 620],
    ['lavabo', 'Vệ sinh', 600, 460],
    ['bathtub', 'Vệ sinh', 1700, 750],
    ['kitchenI', 'Bếp', 3000, 600],
    ['door', 'Kiến trúc', 900, 900],
    ['doorRoom', 'Kiến trúc', 800, 800],
    ['doorWC', 'Kiến trúc', 700, 700],
    ['window', 'Kiến trúc', 1200, 100],
  ];
  for (const [id, group, w, h] of legacy) {
    const b = findBlock(id);
    ok(`${id}: group giữ nguyên (${group})`, b.group === group);
    ok(`${id}: w giữ nguyên (${w})`, b.w === w);
    ok(`${id}: h giữ nguyên (${h})`, b.h === h);
  }
}

// ---- Shape mới B1.1 (phòng ngủ) + B1.2 (phòng khách) đã được thêm ----
function testNewShapesPresent() {
  console.log('new shapes present:');
  const expectedNew = ['nightstand', 'dressingTable', 'sofaCorner', 'coffeeTable', 'tvConsole'];
  for (const id of expectedNew) {
    ok(`${id}: có trong BLOCK_MAP`, !!BLOCK_MAP[id]);
  }
  ok('nightstand: nhóm Phòng ngủ', findBlock('nightstand').group === 'Phòng ngủ');
  ok('dressingTable: nhóm Phòng ngủ', findBlock('dressingTable').group === 'Phòng ngủ');
  ok('sofaCorner: nhóm Phòng khách', findBlock('sofaCorner').group === 'Phòng khách');
  ok('coffeeTable: nhóm Phòng khách', findBlock('coffeeTable').group === 'Phòng khách');
  ok('tvConsole: nhóm Phòng khách', findBlock('tvConsole').group === 'Phòng khách');
}

// ---- anchors: normal phải là vector đơn vị (xấp xỉ độ dài 1) ----
function testAnchorNormalsUnit() {
  console.log('anchor normals unit-length:');
  for (const b of BLOCKS) {
    if (!b.anchors) continue;
    for (const a of b.anchors) {
      const len = Math.hypot(a.normal.x, a.normal.y);
      ok(`${b.id} anchor(${a.kind}): |normal| ≈ 1`, Math.abs(len - 1) < 1e-6);
    }
  }
}

// ---- clearance: w/h > 0 và có reason ----
function testClearanceValid() {
  console.log('clearance zones valid:');
  for (const b of BLOCKS) {
    if (!b.clearance) continue;
    for (const c of b.clearance) {
      ok(`${b.id} clearance: w > 0`, c.w > 0);
      ok(`${b.id} clearance: h > 0`, c.h > 0);
      ok(`${b.id} clearance: có reason`, typeof c.reason === 'string' && c.reason.length > 0);
    }
  }
}

// ---- shape áp tường theo yêu cầu task đều có anchors ----
function testWallShapesHaveAnchors() {
  console.log('wall-hugging shapes have anchors:');
  const mustHaveAnchor = ['sofa2', 'sofa3', 'wardrobe', 'nightstand', 'dressingTable', 'tvConsole', 'bedS', 'bedD', 'sofaCorner'];
  for (const id of mustHaveAnchor) {
    const b = findBlock(id);
    ok(`${id}: có anchors`, !!b.anchors && b.anchors.length > 0);
  }
}

// ---- giường/tủ áo có clearance ----
function testClearanceShapes() {
  console.log('shapes needing clearance:');
  for (const id of ['bedS', 'bedD', 'wardrobe']) {
    const b = findBlock(id);
    ok(`${id}: có clearance`, !!b.clearance && b.clearance.length > 0);
  }
}

testBasicIntegrity();
testLegacyBlocksUnchanged();
testNewShapesPresent();
testAnchorNormalsUnit();
testClearanceValid();
testWallShapesHaveAnchors();
testClearanceShapes();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
