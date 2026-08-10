/**
 * lib/three/capture.test.ts — kiểm phần THUẦN của tầng chụp khung hình (3D-2/3D-3). Chạy:
 *   node_modules/.bin/sucrase-node lib/three/capture.test.ts
 *
 * KHÔNG test captureFrame/captureSequence (cần WebGLRenderer thật, không chạy được trong Node —
 * đã verify browser thật, xem STATUS.md/docs/BAO-CAO-CHINH.md mục C3). Chỉ test
 * sampleCamPathAt/camPathSampleToThree/nearFarForScene — toán thuần, ba lớp import (three
 * Vector3, campath.ts) đều load được dưới sucrase-node (đã thử).
 */
import * as THREE from 'three';
import type { CamPathResult } from '../cad/campath';
import type { Scene3DData } from './cad-to-obj';
import { sampleCamPathAt, camPathSampleToThree, nearFarForScene, planCaptureSequenceFrames } from './capture';

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
  const lowPose = camPathSampleToThree({ point: { x: 0, y: 0 }, dirRad: 0, tSec: 0, cumLenMm: 0 }, 320);
  ok('Camera Intent thấp sát sàn dùng đúng cao 0.32m', Math.abs(lowPose.position.y - 0.32) < 1e-9 && Math.abs(lowPose.target.y - 0.32) < 1e-9);
}

console.log('nearFarForScene — near/far riêng theo khoảng cách camera→tâm scene (3D-3, C3)');
{
  const demoScene: Scene3DData = {
    bboxMm: { minX: 0, minY: 0, maxX: 4000, maxY: 4000 },
    sizeM: { w: 4, d: 4, h: 2.7 },
    groups: [],
  };
  const near1 = nearFarForScene(demoScene, new THREE.Vector3(2, 1.35, -2));
  ok('near > 0 (không bao giờ ≤0, tránh z-fighting/NaN)', near1.near > 0);
  ok('far > near', near1.far > near1.near);
  ok('far đủ hẹp cho phòng 4m (không còn 500m cố định)', near1.far < 20);

  const farAway = nearFarForScene(demoScene, new THREE.Vector3(2, 1.35, -100));
  ok('camera xa scene → near/far dịch xa theo, vẫn far > near', farAway.near > near1.near && farAway.far > farAway.near);
}

console.log('planCaptureSequenceFrames — lập kế hoạch khung thuần (3D-2, không cần WebGL)');
{
  // Đường thẳng 8000mm/8s, dirRad=0 cả đường — vị trí three.js dễ tính tay: x(mét) = t(giây)×1,
  // y luôn 0 nên z three.js luôn 0 (không cần verify trục z riêng, đã verify ở khối trên).
  const path8s: CamPathResult = {
    samples: [
      { point: { x: 0, y: 0 }, dirRad: 0, tSec: 0, cumLenMm: 0 },
      { point: { x: 8000, y: 0 }, dirRad: 0, tSec: 8, cumLenMm: 8000 },
    ],
    totalLengthMm: 8000,
    totalDurationSec: 8,
  };

  // Chế độ theo fps (mặc định, không truyền frameCountOverride) — 8s ở fps=4 → 32 khung.
  const framesFps = planCaptureSequenceFrames(path8s, 4);
  ok('fps=4, đường 8s → đúng round(8×4)=32 khung', framesFps.length === 32);
  ok('khung ĐẦU: t=0, x=0m', framesFps[0].tSec === 0 && Math.abs(framesFps[0].pose.position.x) < 1e-9);
  const midFps = framesFps[16];
  ok('khung GIỮA (i=16): t=4s, x=4m', Math.abs(midFps.tSec - 4) < 1e-9 && Math.abs(midFps.pose.position.x - 4) < 1e-9);
  const lastFps = framesFps[framesFps.length - 1];
  ok('khung CUỐI (chế độ fps): t=i/fps=7.75s (KHÔNG chạm đúng 8s — hành vi fps gốc, khớp cảnh báo trong JSDoc)', Math.abs(lastFps.tSec - 7.75) < 1e-9);

  // Chế độ ép đúng số khung (frameCountOverride) — dàn ĐỀU trên [0, totalDurationSec], khung
  // cuối LUÔN chạm đúng mốc cuối đường — đây là ca test bắt buộc Hoà nêu "kiểm camera đúng vị trí
  // ở frame đầu/giữa/cuối", chỉ chế độ này đảm bảo khung cuối khớp CHÍNH XÁC t=totalDurationSec.
  const framesN = planCaptureSequenceFrames(path8s, 4, 5);
  ok('ép frameCountOverride=5 → đúng 5 khung (không lệ thuộc fps)', framesN.length === 5);
  ok('khung ĐẦU (ép số): t=0, x=0m', framesN[0].tSec === 0 && Math.abs(framesN[0].pose.position.x) < 1e-9);
  ok('khung GIỮA (ép số, i=2/4): t=4s, x=4m', Math.abs(framesN[2].tSec - 4) < 1e-9 && Math.abs(framesN[2].pose.position.x - 4) < 1e-9);
  ok('khung CUỐI (ép số): CHẠM đúng t=8s, x=8m', framesN[4].tSec === 8 && Math.abs(framesN[4].pose.position.x - 8) < 1e-9);

  ok('frameCountOverride=1 → không chia-cho-0, trả 1 khung ở t=0', (() => {
    const f1 = planCaptureSequenceFrames(path8s, 4, 1);
    return f1.length === 1 && f1[0].tSec === 0;
  })());

  let threwFps = '';
  try {
    planCaptureSequenceFrames(path8s, 0);
  } catch (e) {
    threwFps = e instanceof Error ? e.message : String(e);
  }
  ok('fps ≤ 0 → báo lỗi rõ (nhắc "fps")', threwFps.toLowerCase().includes('fps'));

  let threwCount = '';
  try {
    planCaptureSequenceFrames(path8s, 4, 0);
  } catch (e) {
    threwCount = e instanceof Error ? e.message : String(e);
  }
  ok('frameCountOverride < 1 → báo lỗi rõ (nhắc "frameCountOverride")', threwCount.includes('frameCountOverride'));
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
