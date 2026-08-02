'use client';

/**
 * lib/three/capture.ts — TẦNG C (SPEC-3D-CORE.md §1/§3): chụp khung hình OFFSCREEN (không hiện
 * UI) từ `Scene3DData` + camera — nuôi video bậc 2-b (3D-2, đợt này: PNG dọc đường cam) và tool
 * Đổi góc phối cảnh (3D-3: depth/lineart — TODO, xem `CaptureOut`).
 *
 * `captureFrame` dùng `CameraSpec` NGUYÊN VẸN qua `placeCamera()` (quyết định #4 SPEC-3D-CORE) —
 * 1 ngôn ngữ camera cho cả prompt AI (camera.ts) lẫn vị trí máy 3D thật. `captureSequence` KHÔNG
 * qua CameraSpec — mỗi khung lấy thẳng vị trí/hướng từ mẫu `CamPathResult` (campath.ts, V2),
 * tầm mắt người cố định 1650mm (đúng quy ước đường cam video, SPEC-VIDEO-MAT-BANG).
 *
 * Client-only (three.js + canvas thật) — nơi gọi phải qua `next/dynamic(..., {ssr:false})`, cùng
 * ranh giới với `Scene3DViewer.tsx` (không import file này từ code tải ngay khi mở app).
 */
import * as THREE from 'three';
import { buildMergedGeometries } from './obj-scene-to-geometry';
import { cadAxesToThree, cadToThreeM, type Scene3DData } from './cad-to-obj';
import { placeCamera, fovFromLens, type CameraSpec } from './camera';
import type { CamPathResult, CamPathSample } from '@/lib/cad/campath';

export interface CaptureOut {
  /** 3D-2 chỉ thi công 'png'. 'depth'/'lineart' — TODO 3D-3 (SPEC-3D-CORE §4, render target độ
   * sâu nuôi ControlNet — quyết định #6). */
  kind: 'png';
  w: number;
  h: number;
}

/** Tầm mắt người cố định cho đường cam video — KHÔNG lẫn với tầm mắt máy ảnh metrology
 * (1500-1600, xem `docs/00-CHOT.md` mục "Hai con số dễ lẫn"). */
const EYE_HEIGHT_MM = 1650;
const LOOK_AHEAD_M = 3;

function lerpAngle(a: number, b: number, k: number): number {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * k;
}

/** Lấy mẫu tại thời điểm `t` bất kỳ — nội suy tuyến tính giữa 2 mẫu bao quanh (`path.samples` đã
 * sắp theo `tSec` tăng dần, `planCamPath`). `t` ngoài khoảng → kẹp về đầu/cuối đường. */
export function sampleCamPathAt(path: CamPathResult, t: number): CamPathSample {
  const s = path.samples;
  if (!s.length) throw new Error('CamPathResult rỗng — không có mẫu để lấy khung hình.');
  if (t <= s[0].tSec) return s[0];
  if (t >= s[s.length - 1].tSec) return s[s.length - 1];
  let lo = 0;
  let hi = s.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (s[mid].tSec <= t) lo = mid;
    else hi = mid;
  }
  const a = s[lo];
  const b = s[hi];
  const span = b.tSec - a.tSec;
  const k = span > 0 ? (t - a.tSec) / span : 0;
  return {
    point: { x: a.point.x + (b.point.x - a.point.x) * k, y: a.point.y + (b.point.y - a.point.y) * k },
    dirRad: lerpAngle(a.dirRad, b.dirRad, k),
    tSec: t,
    cumLenMm: a.cumLenMm + (b.cumLenMm - a.cumLenMm) * k,
  };
}

/** vị trí + điểm nhìn (mét, three.js Y-up) từ 1 mẫu đường cam. */
export function camPathSampleToThree(sample: CamPathSample): { position: THREE.Vector3; target: THREE.Vector3 } {
  const [px, py, pz] = cadToThreeM(sample.point.x, sample.point.y, EYE_HEIGHT_MM);
  const fwdXMm = sample.point.x + Math.cos(sample.dirRad) * LOOK_AHEAD_M * 1000;
  const fwdYMm = sample.point.y + Math.sin(sample.dirRad) * LOOK_AHEAD_M * 1000;
  const [tx, ty, tz] = cadToThreeM(fwdXMm, fwdYMm, EYE_HEIGHT_MM);
  return { position: new THREE.Vector3(px, py, pz), target: new THREE.Vector3(tx, ty, tz) };
}

function buildOffscreenScene(scene: Scene3DData) {
  const three = new THREE.Scene();
  three.background = new THREE.Color('#2a2d33');
  const built = buildMergedGeometries(scene);
  for (const b of built) {
    three.add(new THREE.Mesh(b.geometry, new THREE.MeshBasicMaterial({ color: b.colorHex, side: THREE.DoubleSide })));
  }
  return { three, built };
}

/** FOV DỌC (độ, cho `THREE.PerspectiveCamera`) từ FOV NGANG của `CameraSpec` (sensor 36mm,
 * `fovFromLens`) + tỉ lệ khung — 2 FOV khác nhau ngoài khung vuông, phải quy đổi đúng aspect. */
function verticalFovDeg(spec: CameraSpec, aspect: number): number {
  const hFovRad = (fovFromLens(spec.lensMm) * Math.PI) / 180;
  const vFovRad = 2 * Math.atan(Math.tan(hFovRad / 2) / aspect);
  return (vFovRad * 180) / Math.PI;
}

/** Chụp 1 khung PNG tại `CameraSpec` cho trước (`placeCamera` đặt vị trí thật trong scene) —
 * offscreen, không hiện UI. Dùng cho tool Đổi góc phối cảnh (đơn khung) hoặc debug camPath. */
export function captureFrame(scene: Scene3DData, spec: CameraSpec, out: CaptureOut): string {
  if (out.kind !== 'png') throw new Error(`captureFrame: kind "${out.kind}" chưa thi công (TODO 3D-3).`);
  const canvas = document.createElement('canvas');
  canvas.width = out.w;
  canvas.height = out.h;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(out.w, out.h, false);

  const aspect = out.w / out.h;
  const camera = new THREE.PerspectiveCamera(verticalFovDeg(spec, aspect), aspect, 0.05, 500);
  const placed = placeCamera(scene.bboxMm, spec);
  camera.position.set(...cadAxesToThree(...placed.pos));
  camera.lookAt(...cadAxesToThree(...placed.target));

  const { three, built } = buildOffscreenScene(scene);
  renderer.render(three, camera);
  const png = canvas.toDataURL('image/png');
  for (const b of built) b.geometry.dispose();
  renderer.dispose();
  return png;
}

/**
 * Chụp cả dải khung hình dọc đường cam ở `fps` cho trước — nuôi video bậc 2-b (SPEC-3D-CORE §0
 * dòng "video bậc 2-b … xuất khung hình"). Dựng renderer/scene 1 LẦN, tái dùng cho mọi khung
 * (rẻ hơn hẳn gọi `captureFrame` lặp lại N lần — không build lại hình học mỗi khung).
 */
export function captureSequence(scene: Scene3DData, path: CamPathResult, fps: number, out: CaptureOut): string[] {
  if (out.kind !== 'png') throw new Error(`captureSequence: kind "${out.kind}" chưa thi công (TODO 3D-3).`);
  if (fps <= 0) throw new Error('fps phải > 0.');
  const canvas = document.createElement('canvas');
  canvas.width = out.w;
  canvas.height = out.h;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(out.w, out.h, false);
  const camera = new THREE.PerspectiveCamera(60, out.w / out.h, 0.05, 500);
  const { three, built } = buildOffscreenScene(scene);

  const frameCount = Math.max(1, Math.round(path.totalDurationSec * fps));
  const frames: string[] = [];
  for (let i = 0; i < frameCount; i++) {
    const t = Math.min(i / fps, path.totalDurationSec);
    const pose = camPathSampleToThree(sampleCamPathAt(path, t));
    camera.position.copy(pose.position);
    camera.lookAt(pose.target);
    renderer.render(three, camera);
    frames.push(canvas.toDataURL('image/png'));
  }

  for (const b of built) b.geometry.dispose();
  renderer.dispose();
  return frames;
}
