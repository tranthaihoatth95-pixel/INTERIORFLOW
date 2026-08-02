/**
 * lib/three/capture.test.ts — kiểm phần THUẦN của tầng chụp khung hình (3D-2). Chạy:
 *   node_modules/.bin/sucrase-node lib/three/capture.test.ts
 *
 * KHÔNG test captureFrame/captureSequence (cần WebGLRenderer thật, không chạy được trong Node —
 * đã verify browser thật, xem STATUS.md). Chỉ test sampleCamPathAt/camPathSampleToThree — toán
 * thuần, ba lớp import (three Vector3, campath.ts) đều load được dưới sucrase-node (đã thử).
 */
import type { CamPathResult } from '../cad/campath';
import { sampleCamPathAt, camPathSampleToThree } from './capture';

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

function demoPath(): CamPathResult {
  return {
    samples: [
      { point: { x: 0, y: 0 }, dirRad: 0, tSec: 0, cumLenMm: 0 },
      { point: { x: 1000, y: 0 }, dirRad: Math.PI / 2, tSec: 1, cumLenMm: 1000 },
      { point: { x: 1000, y: 1000 }, dirRad: Math.PI / 2, tSec: 2, cumLenMm: 2000 },
    ],
    totalLengthMm: 2000,
    totalDurationSec: 2,
  };
}

console.log('sampleCamPathAt — nội suy tuyến tính + kẹp biên');
{
  const path = demoPath();
  const mid = sampleCamPathAt(path, 0.5);
  ok('nội suy điểm giữa mẫu 0-1 (x=500)', Math.abs(mid.point.x - 500) < 1e-9);
  ok('nội suy hướng giữa mẫu 0-1 (π/4)', Math.abs(mid.dirRad - Math.PI / 4) < 1e-9);
  ok('t trước mẫu đầu → kẹp về mẫu đầu', sampleCamPathAt(path, -5).point.x === 0);
  ok('t sau mẫu cuối → kẹp về mẫu cuối', sampleCamPathAt(path, 99).point.y === 1000);
  ok('t đúng bằng 1 mẫu → trả đúng mẫu đó', sampleCamPathAt(path, 1).point.x === 1000);

  const wrap: CamPathResult = {
    samples: [
      { point: { x: 0, y: 0 }, dirRad: Math.PI - 0.1, tSec: 0, cumLenMm: 0 },
      { point: { x: 0, y: 0 }, dirRad: -Math.PI + 0.1, tSec: 1, cumLenMm: 0 },
    ],
    totalLengthMm: 0,
    totalDurationSec: 1,
  };
  const wrapped = sampleCamPathAt(wrap, 0.5);
  ok(`hướng nội suy đi đường NGẮN qua ±π (được ${wrapped.dirRad.toFixed(3)})`, Math.abs(Math.abs(wrapped.dirRad) - Math.PI) < 1e-6);

  let threw = '';
  try {
    sampleCamPathAt({ samples: [], totalLengthMm: 0, totalDurationSec: 0 }, 0);
  } catch (e) {
    threw = e instanceof Error ? e.message : String(e);
  }
  ok('đường rỗng → báo lỗi rõ', threw.includes('rỗng'));
}

console.log('camPathSampleToThree — vị trí/hướng nhìn tầm mắt người');
{
  const pose = camPathSampleToThree({ point: { x: 0, y: 0 }, dirRad: 0, tSec: 0, cumLenMm: 0 });
  ok('cao mắt 1.65m (trục Y three.js)', Math.abs(pose.position.y - 1.65) < 1e-9);
  ok('vị trí tại gốc (x,z)', pose.position.x === 0 && pose.position.z === 0);
  ok('nhìn thẳng +X CAD → +X three.js, cùng cao', pose.target.x > 0 && Math.abs(pose.target.y - 1.65) < 1e-9 && Math.abs(pose.target.z) < 1e-9);

  const poseTurned = camPathSampleToThree({ point: { x: 0, y: 0 }, dirRad: Math.PI / 2, tSec: 0, cumLenMm: 0 });
  ok('nhìn +Y CAD (dirRad=π/2) → target.z ÂM (three.js z=-y)', poseTurned.target.z < 0);
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
