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
export function camPathSampleToThree(sample: CamPathSample, cameraHeightMm = EYE_HEIGHT_MM): { position: THREE.Vector3; target: THREE.Vector3 } {
  const [px, py, pz] = cadToThreeM(sample.point.x, sample.point.y, cameraHeightMm);
  const fwdXMm = sample.point.x + Math.cos(sample.dirRad) * LOOK_AHEAD_M * 1000;
  const fwdYMm = sample.point.y + Math.sin(sample.dirRad) * LOOK_AHEAD_M * 1000;
  const [tx, ty, tz] = cadToThreeM(fwdXMm, fwdYMm, cameraHeightMm);
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

/** 1 khung đã LẬP KẾ HOẠCH (thuần, chưa render) — `index`/`tSec` để nơi gọi đặt tên file/log tiến
 * độ, `pose` sẵn sàng gán thẳng vào `camera.position`/`camera.lookAt()`. */
export interface CaptureSequencePlanFrame {
  index: number;
  tSec: number;
  pose: { position: THREE.Vector3; target: THREE.Vector3 };
}

/**
 * Lập danh sách khung hình cho `captureSequence` — TÁCH RIÊNG khỏi phần WebGL thật (3D-2, 03/08,
 * theo yêu cầu test "đếm đúng số khung, kiểm camera đúng vị trí đầu/giữa/cuối") vì `captureFrame`/
 * `captureSequence` gốc cần `WebGLRenderer`/canvas thật, KHÔNG chạy được dưới sucrase-node (xem
 * đầu `capture.test.ts`) — còn hàm này chỉ toán thuần (`camPathSampleToThree`/`sampleCamPathAt`,
 * cả hai đã thuần từ trước), test được như mọi hàm khác trong file.
 *
 * Hai chế độ đặt SỐ KHUNG, chọn qua có/không truyền `frameCountOverride` (đúng yêu cầu Hoà 03/08
 * "tuỳ chọn fps + số frame"):
 *  - KHÔNG truyền (mặc định, hành vi gốc 3D-2 giữ nguyên): số khung = `round(totalDurationSec ×
 *    fps)`, mỗi khung cách nhau đúng `1/fps` giây — khung CUỐI có thể hụt vài phần nghìn giây so
 *    với `totalDurationSec` nếu không chia hết (giống mọi bộ đếm khung theo fps thông thường).
 *  - CÓ truyền — ép ĐÚNG số khung đó, dàn ĐỀU trên toàn bộ `[0, totalDurationSec]` (khung đầu
 *    luôn t=0, khung cuối luôn t=totalDurationSec CHÍNH XÁC, không lệ thuộc `fps`) — dùng khi cần
 *    xem trước nhanh vài khung (vd 5 khung) mà không đợi lập hết dải fps đầy đủ, hoặc khi cần
 *    khung cuối chạm đúng mốc cuối đường cam (ca test bắt buộc "vị trí đúng ở khung cuối").
 */
export function planCaptureSequenceFrames(path: CamPathResult, fps: number, frameCountOverride?: number): CaptureSequencePlanFrame[] {
  if (fps <= 0) throw new Error('fps phải > 0.');
  if (frameCountOverride !== undefined && frameCountOverride < 1) throw new Error('frameCountOverride phải ≥ 1.');
  const frameCount = Math.max(1, frameCountOverride ?? Math.round(path.totalDurationSec * fps));
  const frames: CaptureSequencePlanFrame[] = [];
  for (let i = 0; i < frameCount; i++) {
    const t =
      frameCountOverride !== undefined
        ? frameCount > 1
          ? (i / (frameCount - 1)) * path.totalDurationSec
          : 0
        : Math.min(i / fps, path.totalDurationSec);
    frames.push({ index: i, tSec: t, pose: camPathSampleToThree(sampleCamPathAt(path, t)) });
  }
  return frames;
}

/** 1 khung ĐÃ RENDER xong, trả về NGAY qua `onFrame` (không giữ lại trong mảng nội bộ nào của
 * `captureSequence` — nơi gọi tự quyết dùng xong `dataUrl` thế nào: ghi file, tải lên, hay tự gom
 * mảng nếu THẬT SỰ cần, nhưng khi đó là lựa chọn của nơi gọi, không phải ép buộc từ API). */
export interface CaptureSequenceFrame {
  index: number;
  tSec: number;
  dataUrl: string;
}

export interface CaptureSequenceOptions {
  fps: number;
  /** ép đúng số khung — xem `planCaptureSequenceFrames`. Bỏ trống = hành vi gốc (suy từ fps). */
  frameCount?: number;
  w: number;
  h: number;
  /** gọi lại NGAY sau khi render xong 1 khung, TRƯỚC khi render khung kế — đây là điểm "stream",
   * không có mảng nào bên trong hàm này giữ hết mọi `dataUrl` cùng lúc (cảnh mật độ cao 3D-1 đo
   * ~2000 entity/24k tam giác đã nặng cho 1 khung; giữ hàng trăm khung PNG base64 cùng lúc trong
   * RAM là bài toán khác hẳn, không giải ở đây — để nơi gọi tự lo, ví dụ ghi từng khung ra đĩa). */
  onFrame: (frame: CaptureSequenceFrame) => void;
  /** huỷ giữa chừng — kiểm TRƯỚC mỗi khung (không huỷ được giữa 1 khung đang render dở, khung đó
   * vẫn hoàn tất bình thường rồi mới dừng ở khung kế). */
  signal?: AbortSignal;
}

export interface CaptureSequenceResult {
  /** số khung THẬT SỰ đã render (< kế hoạch nếu bị huỷ giữa chừng). */
  frameCount: number;
  aborted: boolean;
}

/**
 * Chụp cả dải khung hình dọc đường cam — nuôi video bậc 2-b (SPEC-3D-CORE §0 dòng "video bậc 2-b
 * … xuất khung hình"). Dựng renderer/scene 1 LẦN, tái dùng cho mọi khung (rẻ hơn hẳn gọi
 * `captureFrame` lặp lại N lần — không build lại hình học mỗi khung).
 *
 * ⚠️ Đổi chữ ký so với bản 3D-2 gốc (`d7dff63`, trả thẳng `string[]`) theo yêu cầu Hoà 03/08:
 * KHÔNG gom hết khung vào 1 mảng RAM (mặt bằng mật độ cao nhiều khung × PNG lớn có thể rất nặng)
 * — đổi sang callback `onFrame` từng khung (stream) + `AbortSignal` huỷ giữa chừng + tuỳ chọn ép
 * số khung qua `frameCount`. Đây là lần đổi chữ ký "hợp đồng" mà `SPEC-3D-CORE.md` §3 yêu cầu
 * phải qua duyệt trước khi đổi — Hoà đã ra yêu cầu trực tiếp 03/08, coi như đã duyệt. CHƯA có nơi
 * gọi nào khác ngoài `capture.test.ts`/file này tại thời điểm đổi (đã grep xác nhận), nên đổi
 * thẳng, không giữ chữ ký cũ song song.
 */
export function captureSequence(scene: Scene3DData, path: CamPathResult, opts: CaptureSequenceOptions): CaptureSequenceResult {
  const plan = planCaptureSequenceFrames(path, opts.fps, opts.frameCount);
  const canvas = document.createElement('canvas');
  canvas.width = opts.w;
  canvas.height = opts.h;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(opts.w, opts.h, false);
  const camera = new THREE.PerspectiveCamera(60, opts.w / opts.h, 0.05, 500);
  const { three, dispose } = buildOffscreenScene(scene);

  let rendered = 0;
  let aborted = false;
  try {
    for (const frame of plan) {
      if (opts.signal?.aborted) {
        aborted = true;
        break;
      }
      camera.position.copy(frame.pose.position);
      camera.lookAt(frame.pose.target);
      renderer.render(three, camera);
      opts.onFrame({ index: frame.index, tSec: frame.tSec, dataUrl: canvas.toDataURL('image/png') });
      rendered += 1;
    }
  } finally {
    dispose();
    renderer.dispose();
  }
  return { frameCount: rendered, aborted };
}

/**
 * Bản ASYNC của `captureSequence` — CÙNG hợp đồng (plan/onFrame/AbortSignal/CaptureSequenceResult),
 * chỉ khác: NHẢ event-loop (macrotask) giữa 2 khung. LÝ DO TỒN TẠI (phiếu capture-nut, 14/08):
 * `captureSequence` là vòng `for` đồng bộ — gọi từ UI thì main thread bị chặn suốt dải khung, thanh
 * tiến độ không vẽ được khung nào ([N1] tội ④ "tiến độ thật") và nút Huỷ không bấm được giữa chừng
 * ([T5] "huỷ được" — signal có mà không ai flip được nó). Đây là "1 export additive" phiếu cho phép:
 * KHÔNG sửa `captureSequence` hiện có (bench `app/dev-bench-3d-2` đo hiệu năng cần bản sync thuần,
 * không lẫn chi phí setTimeout vào số đo).
 */
export async function captureSequenceAsync(scene: Scene3DData, path: CamPathResult, opts: CaptureSequenceOptions): Promise<CaptureSequenceResult> {
  const plan = planCaptureSequenceFrames(path, opts.fps, opts.frameCount);
  const canvas = document.createElement('canvas');
  canvas.width = opts.w;
  canvas.height = opts.h;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(opts.w, opts.h, false);
  const camera = new THREE.PerspectiveCamera(60, opts.w / opts.h, 0.05, 500);
  const { three, dispose } = buildOffscreenScene(scene);

  let rendered = 0;
  let aborted = false;
  try {
    for (const frame of plan) {
      // Nhả TRƯỚC khi kiểm signal: click "Huỷ" của người dùng chỉ chạy được khi main thread rảnh.
      await new Promise((r) => setTimeout(r, 0));
      if (opts.signal?.aborted) {
        aborted = true;
        break;
      }
      camera.position.copy(frame.pose.position);
      camera.lookAt(frame.pose.target);
      renderer.render(three, camera);
      opts.onFrame({ index: frame.index, tSec: frame.tSec, dataUrl: canvas.toDataURL('image/png') });
      rendered += 1;
    }
  } finally {
    dispose();
    renderer.dispose();
  }
  return { frameCount: rendered, aborted };
}
