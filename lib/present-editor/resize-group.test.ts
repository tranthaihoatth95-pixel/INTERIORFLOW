/**
 * lib/present-editor/resize-group.test.ts — kiểm phần THUẦN của resize NHÓM theo tỉ lệ
 * (E1 bổ sung, chốt 02/08). Chạy:
 *   node_modules/.bin/sucrase-node lib/present-editor/resize-group.test.ts
 */
import { groupBoundingBox, scaleGroupByCorner, scaleMemberFrame } from './resize-group';

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

function testBoundingBoxUnion() {
  console.log('\n[1] groupBoundingBox — hợp 2 frame lệch nhau');
  const bb = groupBoundingBox([
    { x: 10, y: 10, w: 20, h: 10 }, // trái=10 phải=30 trên=10 dưới=20
    { x: 25, y: 5, w: 10, h: 20 }, // trái=25 phải=35 trên=5 dưới=25
  ]);
  ok('x = min trái', bb.x === 10);
  ok('y = min trên', bb.y === 5);
  ok('w = max phải - min trái', bb.w === 25); // 35-10
  ok('h = max dưới - min trên', bb.h === 20); // 25-5
}

function testBoundingBoxEmpty() {
  console.log('\n[2] groupBoundingBox([]) — mảng rỗng không throw, trả khung 0');
  const bb = groupBoundingBox([]);
  ok('x/y/w/h đều 0', bb.x === 0 && bb.y === 0 && bb.w === 0 && bb.h === 0);
}

function testScaleGroupByCornerSE() {
  console.log('\n[3] scaleGroupByCorner "se" — kéo phải/xuống, góc nw đứng yên');
  const bbox = { x: 20, y: 20, w: 40, h: 20 };
  const { bbox: nb, scale } = scaleGroupByCorner(bbox, 'se', 20); // +20% ngang → w 60
  ok('w mới = 60', Math.abs(nb.w - 60) < 1e-9);
  ok('scale = 1.5', Math.abs(scale - 1.5) < 1e-9);
  ok('h mới = 30 (20*1.5, theo cùng scale)', Math.abs(nb.h - 30) < 1e-9);
  ok('x/y KHÔNG đổi (góc nw neo)', nb.x === 20 && nb.y === 20);
}

function testScaleGroupByCornerNW() {
  console.log('\n[4] scaleGroupByCorner "nw" — kéo trái/lên, góc se đứng yên');
  const bbox = { x: 20, y: 20, w: 40, h: 20 };
  const { bbox: nb, scale } = scaleGroupByCorner(bbox, 'nw', -20); // kéo nw ra xa (trái) → to hơn
  ok('w mới = 60', Math.abs(nb.w - 60) < 1e-9);
  ok('x lùi lại để mép phải (x+w) giữ nguyên = 60', Math.abs(nb.x + nb.w - 60) < 1e-9);
  ok('y lùi lại để mép dưới (y+h) giữ nguyên = 40', Math.abs(nb.y + nb.h - 40) < 1e-9);
  ok('scale = 1.5', Math.abs(scale - 1.5) < 1e-9);
}

function testScaleGroupByCornerClamp() {
  console.log('\n[5] scaleGroupByCorner — chặn dưới 3% (không co về 0/âm)');
  const bbox = { x: 20, y: 20, w: 40, h: 20 };
  const { bbox: nb, scale } = scaleGroupByCorner(bbox, 'se', -1000); // kéo co cực mạnh
  ok('w mới chặn ở 3', nb.w === 3);
  ok('scale dương, nhỏ', scale > 0 && scale < 1);
}

function testScaleMemberFramePreservesLayout() {
  console.log('\n[6] scaleMemberFrame — giữ vị trí tương đối trong khung bao, nhân kích thước theo scale');
  const oldBbox = { x: 0, y: 0, w: 100, h: 50 };
  const newBbox = { x: 0, y: 0, w: 200, h: 100 }; // scale = 2 đều 2 trục
  const member = { x: 10, y: 10, w: 20, h: 10 }; // cách mép trái/trên 10/10
  const { frame } = scaleMemberFrame(member, oldBbox, newBbox, 2);
  ok('x mới = 20 (offset 10 × scale 2)', Math.abs(frame.x - 20) < 1e-9);
  ok('y mới = 20', Math.abs(frame.y - 20) < 1e-9);
  ok('w mới = 40 (20 × 2)', Math.abs(frame.w - 40) < 1e-9);
  ok('h mới = 20 (10 × 2)', Math.abs(frame.h - 20) < 1e-9);
}

function testScaleMemberFrameFontSize() {
  console.log('\n[7] scaleMemberFrame — fontSize nhân theo scale nếu có, bỏ qua nếu không');
  const oldBbox = { x: 0, y: 0, w: 100, h: 50 };
  const newBbox = { x: 0, y: 0, w: 50, h: 25 }; // scale 0.5
  const member = { x: 0, y: 0, w: 10, h: 10 };
  const withFont = scaleMemberFrame(member, oldBbox, newBbox, 0.5, 8);
  ok('fontSize 8 × 0.5 = 4', withFont.fontSize === 4);
  const noFont = scaleMemberFrame(member, oldBbox, newBbox, 0.5);
  ok('không truyền fontSize → trả undefined', noFont.fontSize === undefined);
}

function testScaleMemberFrameMinClamp() {
  console.log('\n[8] scaleMemberFrame — w/h/fontSize chặn dưới (không về 0/âm khi scale rất nhỏ)');
  const oldBbox = { x: 0, y: 0, w: 100, h: 50 };
  const newBbox = { x: 0, y: 0, w: 1, h: 0.5 }; // scale ~0.01
  const member = { x: 0, y: 0, w: 10, h: 10 };
  const { frame, fontSize } = scaleMemberFrame(member, oldBbox, newBbox, 0.01, 5);
  ok('w chặn ở 3', frame.w === 3);
  ok('h chặn ở 3', frame.h === 3);
  ok('fontSize chặn ở 1', fontSize === 1);
}

testBoundingBoxUnion();
testBoundingBoxEmpty();
testScaleGroupByCornerSE();
testScaleGroupByCornerNW();
testScaleGroupByCornerClamp();
testScaleMemberFramePreservesLayout();
testScaleMemberFrameFontSize();
testScaleMemberFrameMinClamp();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
