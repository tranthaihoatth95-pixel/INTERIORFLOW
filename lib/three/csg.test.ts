/**
 * lib/three/csg.test.ts — NC-12 §1/VIỆC 3: `booleanOp` (cổng DUY NHẤT gọi `three-bvh-csg`).
 * Kiểm bằng bbox (không cần đếm tam giác chính xác — CSG có thể tam-giác-hoá khác build), đủ để
 * phân biệt union/subtract/intersect làm ĐÚNG việc, không cần watertight (NC-12 §1.3 — dùng
 * `THREE.BoxGeometry` mặc định, KHÔNG mergeVertices, vẫn phải chạy được — đúng lý do chọn thư
 * viện này thay vì `manifold-3d`). Chạy: node_modules/.bin/sucrase-node lib/three/csg.test.ts
 */
import * as THREE from 'three';
import { booleanOp } from './csg';

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

function bboxSize(g: THREE.BufferGeometry): THREE.Vector3 {
  g.computeBoundingBox();
  const size = new THREE.Vector3();
  g.boundingBox!.getSize(size);
  return size;
}

const boxA = new THREE.BoxGeometry(2, 2, 2); // [-1,1]^3
const insideB = new THREE.BoxGeometry(1, 1, 1); // [-.5,.5]^3, kín HOÀN TOÀN trong A
const offsetB = new THREE.BoxGeometry(2, 2, 2).translate(1.5, 0, 0); // tâm (1.5,0,0), chồng nửa A theo X

console.log('booleanOp("subtract") — khoét khối B nằm trọn trong A: bbox NGOÀI giữ nguyên, có mặt trong mới');
{
  const before = boxA.attributes.position.count;
  const result = booleanOp(boxA, insideB, 'subtract');
  const size = bboxSize(result);
  ok('bbox ngoài vẫn 2×2×2 (B không thò ra ngoài A)', Math.abs(size.x - 2) < 1e-4 && Math.abs(size.y - 2) < 1e-4 && Math.abs(size.z - 2) < 1e-4);
  ok('có thêm hình học (mặt hốc mới) — nhiều vertex hơn A đơn thuần', result.attributes.position.count > before);
}

console.log('booleanOp("union") — hợp A với B chồng nửa theo X: bbox DÀI RA đúng hướng chồng lấn');
{
  const result = booleanOp(boxA, offsetB, 'union');
  const size = bboxSize(result);
  // A: x∈[-1,1] · B: x∈[0.5,2.5] → hợp x∈[-1,2.5], dài 3.5
  ok(`bbox X dài ra ~3.5 (được ${size.x.toFixed(3)})`, Math.abs(size.x - 3.5) < 1e-3);
  ok('bbox Y/Z không đổi (2)', Math.abs(size.y - 2) < 1e-3 && Math.abs(size.z - 2) < 1e-3);
}

console.log('booleanOp("intersect") — giao A với B chồng nửa theo X: bbox THU HẸP đúng vùng chồng');
{
  const result = booleanOp(boxA, offsetB, 'intersect');
  const size = bboxSize(result);
  // vùng chồng x∈[0.5,1] → dài 0.5
  ok(`bbox X thu hẹp còn ~0.5 (được ${size.x.toFixed(3)})`, Math.abs(size.x - 0.5) < 1e-3);
}

console.log('booleanOp KHÔNG sửa geometry gốc tại chỗ (a/b nguyên vẹn cho lần gọi sau)');
{
  const beforeCount = boxA.attributes.position.count;
  booleanOp(boxA, insideB, 'subtract');
  ok('a.attributes.position.count không đổi sau khi gọi', boxA.attributes.position.count === beforeCount);
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
