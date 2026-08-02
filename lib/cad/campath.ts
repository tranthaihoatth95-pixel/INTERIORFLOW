/**
 * lib/cad/campath.ts — V2 (`docs/SPEC-VIDEO-MAT-BANG.md` §2): biến polyline đường cam thành chuỗi
 * mẫu {điểm, hướng nhìn, thời điểm} để chặng 3 chạy hình quạt tầm nhìn (2-a) hoặc đặt camera 3D
 * (2-b, chưa làm). Đúng thứ tự §2.2: **bo góc cung tròn TRƯỚC → lấy mẫu đều theo ĐỘ DÀI sau**.
 *
 * Hàm THUẦN — không import React/DOM/Next, test được bằng sucrase-node.
 *
 * Quy ước hướng: radian, hệ Y-up của CAD (0 = +X, tăng ngược kim đồng hồ) — khớp `ArcEntity.a1/a2`
 * (`model.ts`), KHÔNG dùng độ để nhất quán với phần còn lại của codebase.
 */

import type { Pt } from './model';

export interface CamPathSample {
  point: Pt;
  /** hướng nhìn, radian — xem quy ước ở đầu file. */
  dirRad: number;
  tSec: number;
  /** khoảng cách dồn từ điểm đầu đường cam (mm) — tiện debug/test, không phải field bắt buộc dùng. */
  cumLenMm: number;
}

/**
 * Điểm ngắm (look-at) — §2.1 "ba chế độ, chọn trên panel" (V2.1, 02/08):
 *  1. `tangent` — đi tới đâu nhìn tới đó (mặc định, hành vi V2 gốc, dùng tiếp tuyến làm mượt).
 *  2. `point`   — khoá vào MỘT ĐIỂM cố định trên mặt bằng (chốt kéo được ở UI, `at` là toạ độ
 *     hiện tại của chốt đó — component UI tự lo phần kéo-thả, campath.ts chỉ nhận toạ độ).
 *  3. `zone`    — khoá vào tâm 1 zone (`centroid` = `zoneCentroid()` đã tính sẵn ở model.ts —
 *     campath.ts KHÔNG import `ZoneEntity`/model.ts để giữ tầng thuần tất định gọn, người gọi tự
 *     tính centroid rồi truyền vào).
 * Chế độ 2/3 KHÔNG cần làm mượt tiếp tuyến (hướng suy trực tiếp từ hình học điểm→đích, đã mượt
 * tự nhiên dọc đường cong) — chỉ `tangent` mới cần `smoothDirections`.
 */
export type LookAtMode = { kind: 'tangent' } | { kind: 'point'; at: Pt } | { kind: 'zone'; centroid: Pt };

export interface CamPathOptions {
  /** tốc độ đi, mm/giây. Mặc định 1200 (~đi bộ chậm, §2.1). */
  speedMmPerSec?: number;
  /** bán kính bo góc, mm. Mặc định 600 (§2.2, cố định theo spec — không phải tham số panel). */
  filletRadiusMm?: number;
  /** khoảng cách giữa 2 mẫu liên tiếp dọc đường, mm. Mặc định 100mm. */
  stepMm?: number;
  /** số điểm xấp xỉ mỗi cung bo góc. Mặc định 12 (đủ mượt, không nặng). */
  arcSegments?: number;
  /** cỡ cửa sổ trung bình trượt khi làm mượt hướng nhìn (số mẫu, LẺ). Mặc định 5. */
  smoothWindow?: number;
  /** điểm ngắm — mặc định `{ kind: 'tangent' }` (V2.1, §2.1). */
  lookAt?: LookAtMode;
}

export interface CamPathResult {
  samples: CamPathSample[];
  totalLengthMm: number;
  totalDurationSec: number;
}

// `lookAt` cố ý KHÔNG nằm trong DEFAULTS — xử lý riêng ở planCamPath() (mặc định 'tangent'),
// không đi qua `{...DEFAULTS, ...opts}` như các field số khác.
const DEFAULTS: Required<Omit<CamPathOptions, 'lookAt'>> = {
  speedMmPerSec: 1200,
  filletRadiusMm: 600,
  stepMm: 100,
  arcSegments: 12,
  smoothWindow: 5,
};

function dist(a: Pt, b: Pt): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function lerp(a: Pt, b: Pt, t: number): Pt {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/**
 * Bo góc mỗi đỉnh TRONG (không phải 2 đầu mút) bằng cung tròn bán kính `radiusMm` — thay 1 đỉnh
 * gãy bằng 2 điểm tiếp tuyến + `arcSegments` điểm trên cung. Công thức fillet chuẩn: với góc
 * trong `θ` giữa 2 cạnh (đo bằng vector từ đỉnh TỚI 2 điểm lân cận), khoảng lùi từ đỉnh dọc mỗi
 * cạnh `d = R / tan(θ/2)`, tâm cung cách đỉnh `R / sin(θ/2)` theo đường phân giác. Đoạn quá ngắn
 * (< 2d) ⇒ CLAMP d về nửa đoạn ngắn nhất, bán kính hiệu lực co lại tương ứng cho riêng góc đó —
 * tránh 2 cung chồng lấn, không làm hỏng đoạn kề.
 */
export function roundPolylineCorners(points: Pt[], radiusMm: number, arcSegments = 12): Pt[] {
  if (points.length < 3 || radiusMm <= 0) return points.slice();
  const out: Pt[] = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];
    const lenPrev = dist(prev, curr);
    const lenNext = dist(curr, next);
    if (lenPrev < 1e-6 || lenNext < 1e-6) {
      out.push(curr);
      continue;
    }
    const u1 = { x: (prev.x - curr.x) / lenPrev, y: (prev.y - curr.y) / lenPrev };
    const u2 = { x: (next.x - curr.x) / lenNext, y: (next.y - curr.y) / lenNext };
    const cosTheta = Math.max(-1, Math.min(1, u1.x * u2.x + u1.y * u2.y));
    const theta = Math.acos(cosTheta);
    // Gần thẳng hàng (θ≈π) hoặc gần đảo ngược (θ≈0) ⇒ fillet suy biến (tan(θ/2)→0 hoặc ∞) — bỏ bo.
    if (theta < 1e-6 || theta > Math.PI - 1e-6) {
      out.push(curr);
      continue;
    }
    let d = radiusMm / Math.tan(theta / 2);
    const maxD = Math.min(lenPrev, lenNext) * 0.49;
    let rEff = radiusMm;
    if (d > maxD) {
      d = maxD;
      rEff = d * Math.tan(theta / 2);
    }
    const p1 = { x: curr.x + u1.x * d, y: curr.y + u1.y * d }; // điểm tiếp tuyến phía prev
    const p2 = { x: curr.x + u2.x * d, y: curr.y + u2.y * d }; // điểm tiếp tuyến phía next
    const bisectorLen = Math.hypot(u1.x + u2.x, u1.y + u2.y) || 1;
    const bisector = { x: (u1.x + u2.x) / bisectorLen, y: (u1.y + u2.y) / bisectorLen };
    const centerDist = rEff / Math.sin(theta / 2);
    const center = { x: curr.x + bisector.x * centerDist, y: curr.y + bisector.y * centerDist };
    const a1 = Math.atan2(p1.y - center.y, p1.x - center.x);
    const a2 = Math.atan2(p2.y - center.y, p2.x - center.x);
    // Quét CUNG NGẮN (đi qua phía đỉnh gốc, không phải vòng dài phía ngoài) — chọn hướng quét có
    // |Δgóc| < π (đúng cung lồi phía đỉnh), unwrap thủ công vì atan2 trả trong (-π,π].
    let delta = a2 - a1;
    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;
    out.push(p1);
    for (let s = 1; s < arcSegments; s++) {
      const a = a1 + (delta * s) / arcSegments;
      out.push({ x: center.x + Math.cos(a) * rEff, y: center.y + Math.sin(a) * rEff });
    }
    out.push(p2);
  }
  out.push(points[points.length - 1]);
  return out;
}

/** Lấy mẫu đều theo ĐỘ DÀI dọc polyline (nội suy tuyến tính giữa các điểm sẵn có) — KHÔNG theo số
 * đỉnh gốc. Luôn có mẫu tại đầu (0mm) và cuối (đúng tổng chiều dài), dù không chia hết `stepMm`. */
export function sampleByLength(points: Pt[], stepMm: number): { point: Pt; cumLenMm: number }[] {
  if (points.length === 0) return [];
  if (points.length === 1) return [{ point: points[0], cumLenMm: 0 }];
  const segLens = points.slice(1).map((p, i) => dist(points[i], p));
  const total = segLens.reduce((a, b) => a + b, 0);
  if (total < 1e-6) return [{ point: points[0], cumLenMm: 0 }];

  const out: { point: Pt; cumLenMm: number }[] = [];
  let nextTarget = 0;
  let cum = 0;
  out.push({ point: points[0], cumLenMm: 0 });
  nextTarget = stepMm;
  for (let i = 0; i < segLens.length; i++) {
    const segLen = segLens[i];
    const segStart = cum;
    while (nextTarget <= segStart + segLen && nextTarget < total - 1e-6) {
      const t = segLen < 1e-9 ? 0 : (nextTarget - segStart) / segLen;
      out.push({ point: lerp(points[i], points[i + 1], t), cumLenMm: nextTarget });
      nextTarget += stepMm;
    }
    cum += segLen;
  }
  const last = out[out.length - 1];
  if (Math.abs(last.cumLenMm - total) > 1e-6) out.push({ point: points[points.length - 1], cumLenMm: total });
  return out;
}

function normalizeAngle(a: number): number {
  let r = a % (Math.PI * 2);
  if (r > Math.PI) r -= Math.PI * 2;
  if (r < -Math.PI) r += Math.PI * 2;
  return r;
}

/** Hướng tiếp tuyến tại mỗi mẫu (forward difference; mẫu cuối dùng backward difference). */
function rawTangents(pts: Pt[]): number[] {
  const n = pts.length;
  if (n === 0) return [];
  if (n === 1) return [0];
  const dirs: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = i < n - 1 ? pts[i] : pts[i - 1];
    const b = i < n - 1 ? pts[i + 1] : pts[i];
    dirs.push(Math.atan2(b.y - a.y, b.x - a.x));
  }
  return dirs;
}

/** Trung bình trượt CÓ CHU KỲ GÓC (cộng vector đơn vị rồi atan2 lại) — tránh lỗi khi góc quấn qua
 * ±π (trung bình tuyến tính thô của góc sẽ sai ở biên ±180°). */
export function smoothDirections(dirsRad: number[], windowSize = 5): number[] {
  const n = dirsRad.length;
  if (n === 0) return [];
  const half = Math.max(0, Math.floor(windowSize / 2));
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    let sx = 0;
    let sy = 0;
    let count = 0;
    for (let k = -half; k <= half; k++) {
      const j = i + k;
      if (j < 0 || j >= n) continue;
      sx += Math.cos(dirsRad[j]);
      sy += Math.sin(dirsRad[j]);
      count++;
    }
    out.push(count > 0 ? Math.atan2(sy, sx) : dirsRad[i]);
  }
  return out;
}

/** Hướng nhìn tại 1 điểm theo `LookAtMode` — 'tangent' dùng hướng tiếp tuyến ĐÃ LÀM MƯỢT
 * (`tangentDirRad`), 'point'/'zone' tính thẳng góc điểm→đích (atan2), bỏ qua tiếp tuyến. */
function dirForMode(mode: LookAtMode, point: Pt, tangentDirRad: number): number {
  if (mode.kind === 'tangent') return normalizeAngle(tangentDirRad);
  const target = mode.kind === 'point' ? mode.at : mode.centroid;
  if (target.x === point.x && target.y === point.y) return normalizeAngle(tangentDirRad); // trùng điểm — atan2(0,0) vô nghĩa, rơi về tiếp tuyến
  return Math.atan2(target.y - point.y, target.x - point.x);
}

/**
 * Hàm chính: polyline đường cam → chuỗi mẫu {điểm, hướng, thời điểm}. Thứ tự đúng §2.2: bo góc
 * trước → lấy mẫu theo độ dài sau → làm mượt hướng (chỉ áp dụng chế độ `tangent`, xem
 * `dirForMode`). `tSec` suy từ `cumLenMm / speedMmPerSec` (tốc độ CỐ ĐỊNH dọc đường — đúng mô
 * hình "đi bộ đều tốc" của spec, không tăng/giảm tốc ở khúc cua).
 */
export function planCamPath(points: Pt[], opts?: CamPathOptions): CamPathResult {
  const o = { ...DEFAULTS, ...opts };
  const lookAt: LookAtMode = opts?.lookAt ?? { kind: 'tangent' };
  if (points.length < 2) {
    if (points.length !== 1) return { samples: [], totalLengthMm: 0, totalDurationSec: 0 };
    return { samples: [{ point: points[0], dirRad: dirForMode(lookAt, points[0], 0), tSec: 0, cumLenMm: 0 }], totalLengthMm: 0, totalDurationSec: 0 };
  }

  const rounded = roundPolylineCorners(points, o.filletRadiusMm, o.arcSegments);
  const sampled = sampleByLength(rounded, o.stepMm);
  const rawDirs = rawTangents(sampled.map((s) => s.point));
  const smoothed = smoothDirections(rawDirs, o.smoothWindow);

  const totalLengthMm = sampled[sampled.length - 1]?.cumLenMm ?? 0;
  const samples: CamPathSample[] = sampled.map((s, i) => ({
    point: s.point,
    dirRad: dirForMode(lookAt, s.point, smoothed[i]),
    tSec: o.speedMmPerSec > 0 ? s.cumLenMm / o.speedMmPerSec : 0,
    cumLenMm: s.cumLenMm,
  }));

  return { samples, totalLengthMm, totalDurationSec: o.speedMmPerSec > 0 ? totalLengthMm / o.speedMmPerSec : 0 };
}
