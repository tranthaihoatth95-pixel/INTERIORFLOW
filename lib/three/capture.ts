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
 * 3D-3 (02/08, C3): `captureFrame` thêm `kind: 'depth' | 'lineart'` — nền cho tool Đổi góc phối
 * cảnh (§6B pha 4 — moat): depth map nuôi thẳng `ai.render` ControlNet depth (quyết định #6, render
 * target với `MeshDepthMaterial` — linh kiện chuẩn three, 0 thuật toán tự viết); lineart = cạnh
 * hình học thật (`THREE.EdgesGeometry`, 0 thuật toán tự viết) vẽ trắng trên nền đen, dùng khi cần
 * khoá đường nét cho ControlNet canny/lineart thay vì depth. CÙNG 1 hàm đặt camera cho cả 3 kind
 * (`placeCamera` gọi đúng 1 lần/khung) — đảm bảo `png`/`depth`/`lineart` LUÔN khớp hình học tuyệt
 * đối ở cùng 1 khung (test bắt buộc theo yêu cầu Hoà 02/08).
 *
 * `captureSequence` (video bậc 2-b) CHỈ hỗ trợ `kind:'png'` — chưa có nhu cầu depth/lineart theo
 * dải khung, giữ đơn giản.
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
  /** `captureSequence` chỉ hỗ trợ 'png'. `captureFrame` hỗ trợ cả 3 (3D-3). */
  kind: 'png' | 'depth' | 'lineart';
  w: number;
  h: number;
}

/** Tầm mắt người cố định cho đường cam video (mode campath) VÀ mode `walk` (3D-4, cùng 1 con số
 * theo SPEC-3D-CORE §1) — KHÔNG lẫn với tầm mắt máy ảnh metrology (1500-1600, xem
 * `docs/00-CHOT.md` mục "Hai con số dễ lẫn"). Export để `Scene3DViewer.tsx` dùng chung, không
 * khai lại số này lần 2. */
export const EYE_HEIGHT_MM = 1650;
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
  return { three, built, dispose: () => built.forEach((b) => b.geometry.dispose()) };
}

/** Scene depth — `MeshDepthMaterial` (quy ước mặc định three.js `BasicDepthPacking`: GẦN camera
 * → TỐI, XA → SÁNG, khớp near/far của chính camera đang chụp). ⚠️ Nếu ControlNet đích cần chiều
 * ngược lại (nhiều pipeline MiDaS quen GẦN=SÁNG) thì đảo màu ở phía TIÊU THỤ (`ai.render`), KHÔNG
 * đảo ở đây — hàm này chỉ có 1 việc "render đúng depth buffer", quy ước hiển thị là việc riêng. */
function buildDepthScene(scene: Scene3DData) {
  const three = new THREE.Scene();
  three.background = new THREE.Color('#ffffff'); // nền = xa vô cực, khớp quy ước "xa → sáng"
  const built = buildMergedGeometries(scene);
  const depthMat = new THREE.MeshDepthMaterial({ depthPacking: THREE.BasicDepthPacking });
  for (const b of built) three.add(new THREE.Mesh(b.geometry, depthMat));
  return { three, built, dispose: () => { built.forEach((b) => b.geometry.dispose()); depthMat.dispose(); } };
}

/** Scene lineart — cạnh hình học thật (`THREE.EdgesGeometry`, ngưỡng góc mặc định three: 1°,
 * đủ bắt mọi cạnh khối hộp/tường vuông thành của proxy nội thất+kiến trúc ở đây) vẽ trắng trên
 * nền đen. KHÔNG phải outline/silhouette AI — là đường viền hình học thật, rẻ, tất định. */
function buildLineartScene(scene: Scene3DData) {
  const three = new THREE.Scene();
  three.background = new THREE.Color('#000000');
  const built = buildMergedGeometries(scene);
  const lineMat = new THREE.LineBasicMaterial({ color: '#ffffff' });
  const edgeGeoms: THREE.EdgesGeometry[] = [];
  for (const b of built) {
    const edges = new THREE.EdgesGeometry(b.geometry);
    edgeGeoms.push(edges);
    three.add(new THREE.LineSegments(edges, lineMat));
  }
  return {
    three,
    built,
    dispose: () => {
      built.forEach((b) => b.geometry.dispose());
      edgeGeoms.forEach((e) => e.dispose());
      lineMat.dispose();
    },
  };
}

/** near/far RIÊNG cho camera đang chụp — bao trọn bbox scene quanh vị trí camera thật, đủ hẹp để
 * depth map có độ phân giải hữu ích (far=500m cố định như viewer orbit sẽ nén hết depth vào vài %
 * đầu dải giá trị với 1 phòng vài mét — depth gần như phẳng, vô dụng cho ControlNet). */
export function nearFarForScene(scene: Scene3DData, cameraPosM: THREE.Vector3): { near: number; far: number } {
  const { minX, minY, maxX, maxY } = scene.bboxMm;
  const centerHeightMm = (scene.sizeM.h / 2) * 1000;
  const [cx, cy, cz] = cadToThreeM((minX + maxX) / 2, (minY + maxY) / 2, centerHeightMm);
  const radius = Math.max(1, Math.hypot(maxX - minX, maxY - minY) / 2 / 1000, scene.sizeM.h);
  const dist = cameraPosM.distanceTo(new THREE.Vector3(cx, cy, cz));
  const far = Math.max(5, dist + radius * 1.5);
  const near = Math.max(0.02, dist - radius * 1.5);
  return { near: near < far ? near : 0.02, far };
}

/** FOV DỌC (độ, cho `THREE.PerspectiveCamera`) từ FOV NGANG của `CameraSpec` (sensor 36mm,
 * `fovFromLens`) + tỉ lệ khung — 2 FOV khác nhau ngoài khung vuông, phải quy đổi đúng aspect. */
function verticalFovDeg(spec: CameraSpec, aspect: number): number {
  const hFovRad = (fovFromLens(spec.lensMm) * Math.PI) / 180;
  const vFovRad = 2 * Math.atan(Math.tan(hFovRad / 2) / aspect);
  return (vFovRad * 180) / Math.PI;
}

/**
 * Chụp 1 khung tại `CameraSpec` cho trước (`placeCamera` đặt vị trí thật trong scene) — offscreen,
 * không hiện UI. `kind`: 'png' (xem trước/debug camPath) · 'depth' (nuôi ControlNet depth, tool
 * Đổi góc phối cảnh) · 'lineart' (cạnh hình học thật). CÙNG 1 khối đặt camera cho cả 3 kind —
 * gọi `captureFrame` nhiều lần với CÙNG `scene`+`spec` LUÔN cho camera giống hệt nhau (tất định),
 * nên `png`/`depth`/`lineart` của cùng 1 khung khớp hình học tuyệt đối.
 */
export function captureFrame(scene: Scene3DData, spec: CameraSpec, out: CaptureOut): string {
  const canvas = document.createElement('canvas');
  canvas.width = out.w;
  canvas.height = out.h;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(out.w, out.h, false);

  const aspect = out.w / out.h;
  const placed = placeCamera(scene.bboxMm, spec);
  const posM = new THREE.Vector3(...cadAxesToThree(...placed.pos));
  const targetM = new THREE.Vector3(...cadAxesToThree(...placed.target));
  const { near, far } = nearFarForScene(scene, posM);
  const camera = new THREE.PerspectiveCamera(verticalFovDeg(spec, aspect), aspect, near, far);
  camera.position.copy(posM);
  camera.lookAt(targetM);

  const built = out.kind === 'depth' ? buildDepthScene(scene) : out.kind === 'lineart' ? buildLineartScene(scene) : buildOffscreenScene(scene);
  renderer.render(built.three, camera);
  const png = canvas.toDataURL('image/png');
  built.dispose();
  renderer.dispose();
  return png;
}

/**
 * Chụp cả dải khung hình dọc đường cam ở `fps` cho trước — nuôi video bậc 2-b (SPEC-3D-CORE §0
 * dòng "video bậc 2-b … xuất khung hình"). Dựng renderer/scene 1 LẦN, tái dùng cho mọi khung
 * (rẻ hơn hẳn gọi `captureFrame` lặp lại N lần — không build lại hình học mỗi khung).
 */
export function captureSequence(scene: Scene3DData, path: CamPathResult, fps: number, out: CaptureOut): string[] {
  if (out.kind !== 'png') throw new Error(`captureSequence: chỉ hỗ trợ kind 'png' (được "${out.kind}") — depth/lineart theo dải khung chưa có nhu cầu, dùng captureFrame() cho từng khung riêng nếu cần.`);
  if (fps <= 0) throw new Error('fps phải > 0.');
  const canvas = document.createElement('canvas');
  canvas.width = out.w;
  canvas.height = out.h;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(out.w, out.h, false);
  const camera = new THREE.PerspectiveCamera(60, out.w / out.h, 0.05, 500);
  const { three, dispose } = buildOffscreenScene(scene);

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

  dispose();
  renderer.dispose();
  return frames;
}
