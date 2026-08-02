/**
 * lib/three/section.test.ts — chạy: node_modules/.bin/sucrase-node lib/three/section.test.ts
 * Test THUẦN toán (THREE.Plane/Vector3, không WebGL) — xác nhận GIỮ/CẮT đúng chiều cho cả 3 trục.
 */
import * as THREE from 'three';
import { sectionPlane } from './section';
import { cadToThreeM } from './cad-to-obj';

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

/** `distanceToPoint >= 0` ⟺ điểm ở phía GIỮ (WebGL clip loại bỏ phía normal·X+constant < 0). */
function kept(planeArgs: Parameters<typeof sectionPlane>[0], xMm: number, yMm: number, zMm: number): boolean {
  const plane = sectionPlane(planeArgs);
  const [x, y, z] = cadToThreeM(xMm, yMm, zMm);
  return plane.distanceToPoint(new THREE.Vector3(x, y, z)) >= 0;
}

console.log('sectionPlane — axis z (cao độ, ca "Công trường cắt lớp" chính)');
{
  ok('cao 1000mm, cắt tại 1200mm → GIỮ (dưới lát cắt)', kept({ axis: 'z', at: 1200 }, 0, 0, 1000));
  ok('cao 1200mm đúng mặt cắt → GIỮ (biên tính là giữ)', kept({ axis: 'z', at: 1200 }, 0, 0, 1200));
  ok('cao 2000mm, cắt tại 1200mm → CẮT (trên lát cắt, vd trần)', !kept({ axis: 'z', at: 1200 }, 0, 0, 2000));
}

console.log('sectionPlane — axis x');
{
  ok('x=500, cắt tại x=1000 → GIỮ', kept({ axis: 'x', at: 1000 }, 500, 0, 0));
  ok('x=1500, cắt tại x=1000 → CẮT', !kept({ axis: 'x', at: 1000 }, 1500, 0, 0));
}

console.log('sectionPlane — axis y (khác dấu do quy ước three.js z=-y, dễ sai nhất — test kỹ)');
{
  ok('y=500, cắt tại y=1000 → GIỮ', kept({ axis: 'y', at: 1000 }, 0, 500, 0));
  ok('y=1500, cắt tại y=1000 → CẮT', !kept({ axis: 'y', at: 1000 }, 0, 1500, 0));
  ok('y ÂM (-2000), cắt tại y=1000 → GIỮ (càng âm càng chắc dưới ngưỡng)', kept({ axis: 'y', at: 1000 }, 0, -2000, 0));
}

console.log('sectionPlane — mọi trục dùng chung constant = at/1000 (chỉ đổi normal)');
{
  const pX = sectionPlane({ axis: 'x', at: 3000 });
  const pY = sectionPlane({ axis: 'y', at: 3000 });
  const pZ = sectionPlane({ axis: 'z', at: 3000 });
  ok('constant giống nhau cả 3 trục = 3', pX.constant === 3 && pY.constant === 3 && pZ.constant === 3);
  ok('normal khác nhau đúng trục', pX.normal.x === -1 && pY.normal.z === 1 && pZ.normal.y === -1);
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
