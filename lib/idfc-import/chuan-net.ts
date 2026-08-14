/**
 * lib/idfc-import/chuan-net.ts — bước CHUẨN NÉT (entry `chuan-net-3d`, marker `chuanNet`):
 * mesh máy sinh (GLB TRELLIS, xem from-photo.ts) → tách mảnh hình học THUẦN (0 job AI) → xoá
 * shadow-blob bị nướng nhầm thành khối → fit primitive THAM SỐ cho mảnh trục-đối-xứng
 * (cylinder/torus) — dựng lại qua kho build-ops SẴN (`lib/three/build-ops.ts` `revolveProfile`,
 * CHỈ GỌI không sửa ruột) → phần hữu cơ GIỮ mesh làm sạch (bỏ đỉnh trùng, GIỮ UV để texture còn
 * sống khi import Max) → xuất OBJ+MTL + JSON recipe tham số ("gọi bằng hàm số", nạp lại chỉnh được).
 *
 * Vì sao có tầng "CHUỖI LÁT CẮT" (slab chain): mesh TRELLIS là MỘT khối liền watertight —
 * connected-components thuần trả đúng 1 mảnh (đo thật 14/08 trên lincoln-327.glb: 15.538 tam giác,
 * 1 component với weld eps 1e-6). Muốn tách chân/vòng phải cắt lát ngang theo trục đứng, gom cụm
 * XZ trong từng lát, rồi xâu chuỗi cụm NHỎ qua nhiều lát liên tiếp (= chân trụ) và nhận lát HÌNH
 * VÀNH KHUYÊN (= vòng torus). Vẫn là hình học tất định — không AI, mọi ngưỡng là tỉ lệ theo bbox.
 *
 * BIÊN phiếu (docs/phieu-giao/chuan-net-3d.md): mảnh fit KHÔNG đạt ngưỡng sai số → GIỮ mesh +
 * khai thật, CẤM ép fit sai. Sai số in ra SỐ (mm + % đường chéo bbox mảnh) [T6].
 */
import * as THREE from 'three';
import { revolveProfile } from '../three/build-ops';

/* ────────────────────────── ① GLB → hình học thuần ────────────────────────── */

export interface GlbGeometry {
  /** đỉnh xyz phẳng, ĐƠN VỊ GỐC của GLB (TRELLIS chuẩn hoá ~1 đơn vị cao) */
  positions: Float32Array;
  /** UV TEXCOORD_0 (2 số/đỉnh) — null khi mesh không có */
  uvs: Float32Array | null;
  /** chỉ số tam giác (3/tam giác) */
  indices: Uint32Array;
}

const GLB_MAGIC = 0x46546c67;
const CHUNK_JSON = 0x4e4f534a;

interface GltfJson {
  accessors?: Array<{ componentType?: number; type?: string; bufferView?: number; byteOffset?: number; count?: number }>;
  bufferViews?: Array<{ byteOffset?: number; byteLength?: number; byteStride?: number }>;
  images?: Array<{ bufferView?: number; mimeType?: string }>;
  meshes?: Array<{ primitives?: Array<{ mode?: number; indices?: number; attributes?: { POSITION?: number; TEXCOORD_0?: number } }> }>;
}

function glbChunks(buf: Uint8Array): { json: GltfJson; bin: Uint8Array } | null {
  if (buf.byteLength < 28) return null;
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  if (dv.getUint32(0, true) !== GLB_MAGIC) return null;
  const jsonLen = dv.getUint32(12, true);
  if (dv.getUint32(16, true) !== CHUNK_JSON) return null;
  let json: GltfJson;
  try {
    json = JSON.parse(new TextDecoder().decode(buf.subarray(20, 20 + jsonLen))) as GltfJson;
  } catch {
    return null;
  }
  const binStart = 20 + jsonLen + 8; // 8 = header chunk BIN (len + type)
  if (binStart > buf.byteLength) return null;
  return { json, bin: buf.subarray(binStart) };
}

/** Đọc hình học tam giác từ GLB — mở rộng đường `glb-stats.ts` (chỉ đọc JSON) sang cả chunk BIN.
 * HỖ TRỢ ca thực tế của pipeline from-photo: POSITION float32, indices uint16/uint32, buffer đóng
 * gói khít (không byteStride). Ngoài phạm vi đó (Draco, stride, sparse) → trả null KHÔNG throw —
 * caller khai thật "GLB dạng này chưa đọc được", không đoán. Node transform KHÔNG áp (TRELLIS xuất
 * node identity — đã kiểm trên file thật; GLB có transform sẽ lệch → caller đối chiếu bbox). */
export function parseGlbGeometry(buf: Uint8Array): GlbGeometry | null {
  const chunks = glbChunks(buf);
  if (!chunks) return null;
  const { json, bin } = chunks;
  const readAccessor = (ai: number | undefined, comp: 'f32' | 'idx', perElem: number): Float32Array | Uint32Array | null => {
    if (ai == null) return null;
    const acc = json.accessors?.[ai];
    const bv = acc?.bufferView != null ? json.bufferViews?.[acc.bufferView] : undefined;
    if (!acc || !bv || acc.count == null) return null;
    if (bv.byteStride != null) return null; // đóng gói không khít — ngoài phạm vi, khai thật
    const off = (bv.byteOffset ?? 0) + (acc.byteOffset ?? 0);
    const n = acc.count * perElem;
    if (comp === 'f32') {
      if (acc.componentType !== 5126) return null;
      if (off + n * 4 > bin.byteLength) return null;
      return new Float32Array(bin.buffer, bin.byteOffset + off, n);
    }
    if (acc.componentType === 5125) {
      if (off + n * 4 > bin.byteLength) return null;
      return new Uint32Array(bin.buffer, bin.byteOffset + off, n);
    }
    if (acc.componentType === 5123) {
      if (off + n * 2 > bin.byteLength) return null;
      return Uint32Array.from(new Uint16Array(bin.buffer, bin.byteOffset + off, n));
    }
    return null;
  };

  const posAll: number[] = [];
  const uvAll: number[] = [];
  const idxAll: number[] = [];
  let anyUv = false;
  for (const mesh of json.meshes ?? []) {
    for (const prim of mesh.primitives ?? []) {
      if ((prim.mode ?? 4) !== 4) continue;
      const pos = readAccessor(prim.attributes?.POSITION, 'f32', 3) as Float32Array | null;
      if (!pos) return null;
      const uv = readAccessor(prim.attributes?.TEXCOORD_0, 'f32', 2) as Float32Array | null;
      const base = posAll.length / 3;
      const idx = prim.indices != null
        ? (readAccessor(prim.indices, 'idx', 1) as Uint32Array | null)
        : Uint32Array.from({ length: pos.length / 3 }, (_, i) => i);
      if (!idx) return null;
      for (let i = 0; i < pos.length; i++) posAll.push(pos[i]);
      if (uv) { anyUv = true; for (let i = 0; i < uv.length; i++) uvAll.push(uv[i]); }
      else for (let i = 0; i < (pos.length / 3) * 2; i++) uvAll.push(0);
      for (let i = 0; i < idx.length; i++) idxAll.push(base + idx[i]);
    }
  }
  if (!idxAll.length) return null;
  return { positions: new Float32Array(posAll), uvs: anyUv ? new Float32Array(uvAll) : null, indices: new Uint32Array(idxAll) };
}

/** Rút ảnh nhúng (texture baseColor) từ GLB để MTL còn map_Kd — trả bytes + mime, null nếu không có. */
export function extractGlbImage(buf: Uint8Array, index = 0): { mime: string; bytes: Uint8Array } | null {
  const chunks = glbChunks(buf);
  const img = chunks?.json.images?.[index];
  const bv = img?.bufferView != null ? chunks?.json.bufferViews?.[img.bufferView] : undefined;
  if (!chunks || !img || !bv || bv.byteLength == null) return null;
  const off = bv.byteOffset ?? 0;
  return { mime: img.mimeType ?? 'image/png', bytes: chunks.bin.subarray(off, off + bv.byteLength) };
}

/* ────────────────────────── ② PCA + fit primitive ────────────────────────── */

type V3 = [number, number, number];

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a: V3): V3 => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

/** Trị riêng/vector riêng ma trận đối xứng 3×3 — Jacobi cổ điển, đủ cho covariance PCA. */
export function eigenSym3(m: number[][]): { vals: number[]; vecs: V3[] } {
  const a = m.map((r) => [...r]);
  let v = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  for (let sweep = 0; sweep < 32; sweep++) {
    let off = 0;
    for (let p = 0; p < 3; p++) for (let q = p + 1; q < 3; q++) off += a[p][q] * a[p][q];
    if (off < 1e-18) break;
    for (let p = 0; p < 3; p++) for (let q = p + 1; q < 3; q++) {
      if (Math.abs(a[p][q]) < 1e-15) continue;
      const theta = (a[q][q] - a[p][p]) / (2 * a[p][q]);
      const t = Math.sign(theta) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
      const c = 1 / Math.sqrt(t * t + 1);
      const s = t * c;
      for (let k = 0; k < 3; k++) {
        const akp = a[k][p]; const akq = a[k][q];
        a[k][p] = c * akp - s * akq; a[k][q] = s * akp + c * akq;
      }
      for (let k = 0; k < 3; k++) {
        const apk = a[p][k]; const aqk = a[q][k];
        a[p][k] = c * apk - s * aqk; a[q][k] = s * apk + c * aqk;
      }
      v = v.map((row) => {
        const rp = row[p]; const rq = row[q];
        const out = [...row]; out[p] = c * rp - s * rq; out[q] = s * rp + c * rq; return out;
      });
    }
  }
  return { vals: [a[0][0], a[1][1], a[2][2]], vecs: [0, 1, 2].map((i) => norm([v[0][i], v[1][i], v[2][i]])) };
}

function centroidAndAxes(pts: Float64Array): { c: V3; axes: V3[] } {
  const n = pts.length / 3;
  const c: V3 = [0, 0, 0];
  for (let i = 0; i < pts.length; i += 3) { c[0] += pts[i]; c[1] += pts[i + 1]; c[2] += pts[i + 2]; }
  c[0] /= n; c[1] /= n; c[2] /= n;
  const cov = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < pts.length; i += 3) {
    const d = [pts[i] - c[0], pts[i + 1] - c[1], pts[i + 2] - c[2]];
    for (let r = 0; r < 3; r++) for (let s = r; s < 3; s++) cov[r][s] += d[r] * d[s];
  }
  for (let r = 0; r < 3; r++) for (let s = 0; s < r; s++) cov[r][s] = cov[s][r];
  return { c, axes: eigenSym3(cov).vecs };
}

export interface CylFit { axis: V3; center: V3; radius: number; height: number; rms: number }

/** Fit trụ tròn: thử cả 3 trục PCA làm trục ứng viên, lấy trục cho RMS(khoảng cách xuyên tâm − r
 * trung bình) nhỏ nhất. Tâm = centroid (mặt trụ lấy mẫu kín thì centroid nằm trên trục). */
export function fitCylinderPts(pts: Float64Array): CylFit {
  const { c, axes } = centroidAndAxes(pts);
  let best: CylFit | null = null;
  for (const axis of axes) {
    let sum = 0; let n = 0; const ds: number[] = []; let tMin = Infinity; let tMax = -Infinity;
    for (let i = 0; i < pts.length; i += 3) {
      const d = sub([pts[i], pts[i + 1], pts[i + 2]], c);
      const t = dot(d, axis);
      const rx = d[0] - t * axis[0]; const ry = d[1] - t * axis[1]; const rz = d[2] - t * axis[2];
      const r = Math.hypot(rx, ry, rz);
      ds.push(r); sum += r; n++;
      if (t < tMin) tMin = t; if (t > tMax) tMax = t;
    }
    const radius = sum / n;
    let sq = 0; for (const r of ds) sq += (r - radius) * (r - radius);
    const rms = Math.sqrt(sq / n);
    if (!best || rms < best.rms) best = { axis, center: c, radius, height: tMax - tMin, rms };
  }
  return best!;
}

export interface TorusFit { axis: V3; center: V3; rMajor: number; rMinor: number; rms: number }

/** Fit xuyến (torus): thử 3 trục PCA; với mỗi trục: ρ = khoảng cách xuyên tâm, t = dọc trục;
 * R = mean ρ, r = mean √((ρ−R)² + t²), RMS quanh r. Heuristic đúng cho vòng lấy mẫu tương đối đều
 * (vòng gác chân, tay vịn tròn) — vòng khuyết nửa sẽ ra RMS cao và bị loại, đúng ý cấm-ép-fit. */
export function fitTorusPts(pts: Float64Array): TorusFit {
  const { c, axes } = centroidAndAxes(pts);
  let best: TorusFit | null = null;
  for (const axis of axes) {
    let sumRho = 0; const n = pts.length / 3;
    const rho: number[] = []; const tt: number[] = [];
    for (let i = 0; i < pts.length; i += 3) {
      const d = sub([pts[i], pts[i + 1], pts[i + 2]], c);
      const t = dot(d, axis);
      const r = Math.hypot(d[0] - t * axis[0], d[1] - t * axis[1], d[2] - t * axis[2]);
      rho.push(r); tt.push(t); sumRho += r;
    }
    const R = sumRho / n;
    let sumD = 0; const dd: number[] = [];
    for (let i = 0; i < n; i++) { const d = Math.hypot(rho[i] - R, tt[i]); dd.push(d); sumD += d; }
    const rMinor = sumD / n;
    let sq = 0; for (const d of dd) sq += (d - rMinor) * (d - rMinor);
    const rms = Math.sqrt(sq / n);
    if (!best || rms < best.rms) best = { axis, center: c, rMajor: R, rMinor, rms };
  }
  return best!;
}

/* ───────── ②b VÒNG (tay vịn): RANSAC circle-in-3D — đường hình học THUẦN thay lát-vành-khuyên ─────────

 * Vì sao KHÔNG dùng được đường lát-cắt của ④c cho vòng tay vịn (đo thật 14/08, ghi ở báo cáo CN):
 * vòng tay vịn nằm trong MẶT PHẲNG ĐỨNG (trục vòng NGANG) và DÍNH LIỀN mép nệm — mọi lát cắt chứa
 * vòng đều chứa cả nệm ⇒ tỉ lệ rỗng-tâm rMin/rMax ≈ 0,2, luật vành-khuyên tự từ chối.
 * Đường mới: KHÔNG cắt lát, KHÔNG giả định trục. Lấy 3 điểm bất kỳ → đường tròn ngoại tiếp trong
 * KHÔNG GIAN (cho luôn tâm + trục + R) → đếm điểm nằm trong ống bán kính `tube` quanh đường tròn đó.
 * Nệm là NHIỄU: nó không nằm trên ống nên không thành inlier — đó chính là điểm mạnh của RANSAC so
 * với lát cắt (lát cắt buộc phải gom cả cụm, RANSAC chỉ lấy điểm hợp mô hình).
 * Cửa nhận (phiếu CN2): RMS < 2% đường chéo bbox mảnh **VÀ** góc phủ ≥ 300° — vòng hở/cung cong
 * (thanh gác chân chéo) không lọt. Không đạt ⇒ GIỮ MESH, không ép [T0].
 */

/** PRNG tất định (mulberry32) — RANSAC phải cho CÙNG kết quả mỗi lần chạy, nếu không test và bản
 * xuất sẽ nhảy số giữa các lần. Không dùng Math.random. */
function rng32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);

/** Tâm + trục + bán kính đường tròn ngoại tiếp 3 điểm trong không gian. null khi 3 điểm gần thẳng hàng. */
export function circumCircle3(p1: V3, p2: V3, p3: V3): { center: V3; axis: V3; radius: number } | null {
  const a = sub(p1, p3); const b = sub(p2, p3);
  const axb = cross(a, b);
  const d = len(axb);
  if (d < 1e-12) return null;
  const la = dot(a, a); const lb = dot(b, b);
  const num = cross([la * b[0] - lb * a[0], la * b[1] - lb * a[1], la * b[2] - lb * a[2]], axb);
  const k = 1 / (2 * d * d);
  const center: V3 = [p3[0] + num[0] * k, p3[1] + num[1] * k, p3[2] + num[2] * k];
  const radius = len(sub(p1, center));
  if (!isFinite(radius) || radius <= 0) return null;
  return { center, axis: norm(axb), radius };
}

export interface RingFit {
  axis: V3; center: V3; rMajor: number; rMinor: number;
  /** RMS của (khoảng cách tới đường tròn − rMinor) trên tập inlier */
  rms: number;
  /** góc phủ inlier quanh vòng (độ, 36 ô 10°) */
  coverageDeg: number;
  inliers: number[];
}

/** Khoảng cách từ điểm tới ĐƯỜNG TRÒN (tâm c, trục ax, bán kính R) = √((ρ−R)² + t²). */
function distToCircle(p: V3, c: V3, ax: V3, R: number): number {
  const d = sub(p, c);
  const t = dot(d, ax);
  const rho = Math.hypot(d[0] - t * ax[0], d[1] - t * ax[1], d[2] - t * ax[2]);
  return Math.hypot(rho - R, t);
}

function coverageOf(pts: Float64Array, idx: number[], c: V3, ax: V3): number {
  // hai vector đơn vị vuông góc trục để đo góc
  const tmp: V3 = Math.abs(ax[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
  const e1 = norm(cross(ax, tmp));
  const e2 = cross(ax, e1);
  const bins = new Uint8Array(36);
  for (const i of idx) {
    const d = sub([pts[3 * i], pts[3 * i + 1], pts[3 * i + 2]], c);
    const ang = Math.atan2(dot(d, e2), dot(d, e1));
    bins[Math.min(35, Math.floor(((ang + Math.PI) / (2 * Math.PI)) * 36))] = 1;
  }
  let n = 0; for (const b of bins) n += b;
  return n * 10;
}

/**
 * Tìm MỘT vòng trong đám điểm bằng RANSAC. `rMinAbs`/`rMaxAbs`/`tube` theo đơn vị của `pts`.
 * Trả null khi không có ứng viên nào đạt số inlier tối thiểu — caller GIỮ MESH.
 */
export function fitRingRansac(
  pts: Float64Array,
  o: { rMinAbs: number; rMaxAbs: number; tube: number; iters?: number; seed?: number; minInliers?: number },
): RingFit | null {
  const n = pts.length / 3;
  if (n < 40) return null;
  const rnd = rng32(o.seed ?? 20260814);
  const iters = o.iters ?? 4000;
  const minInliers = o.minInliers ?? 40;
  const at = (i: number): V3 => [pts[3 * i], pts[3 * i + 1], pts[3 * i + 2]];
  // tập chấm điểm (giữ chi phí tuyến tính khi mesh lớn) — bước nhảy tất định, không random
  const step = Math.max(1, Math.floor(n / 2500));
  const scoreIdx: number[] = [];
  for (let i = 0; i < n; i += step) scoreIdx.push(i);

  let best: { center: V3; axis: V3; R: number; cnt: number } | null = null;
  for (let it = 0; it < iters; it++) {
    const i1 = Math.floor(rnd() * n); const i2 = Math.floor(rnd() * n); const i3 = Math.floor(rnd() * n);
    if (i1 === i2 || i2 === i3 || i1 === i3) continue;
    const cc = circumCircle3(at(i1), at(i2), at(i3));
    if (!cc || cc.radius < o.rMinAbs || cc.radius > o.rMaxAbs) continue;
    let cnt = 0;
    for (const i of scoreIdx) if (distToCircle(at(i), cc.center, cc.axis, cc.radius) <= o.tube) cnt++;
    if (!best || cnt > best.cnt) best = { center: cc.center, axis: cc.axis, R: cc.radius, cnt };
  }
  if (!best) return null;

  // TINH CHỈNH: 3 vòng — lấy inlier trên TOÀN tập → PCA cho trục (trục vòng = phương phân tán NHỎ
  // nhất) → bán kính = trung bình ρ. Chỉ RANSAC thô thì trục lệch theo 3 điểm may rủi.
  let { center, axis, R } = best;
  let inliers: number[] = [];
  for (let pass = 0; pass < 3; pass++) {
    inliers = [];
    for (let i = 0; i < n; i++) if (distToCircle(at(i), center, axis, R) <= o.tube) inliers.push(i);
    if (inliers.length < minInliers) return null;
    const sub3 = new Float64Array(inliers.length * 3);
    inliers.forEach((i, k) => { sub3[3 * k] = pts[3 * i]; sub3[3 * k + 1] = pts[3 * i + 1]; sub3[3 * k + 2] = pts[3 * i + 2]; });
    const { c, axes } = centroidAndAxes(sub3);
    // trục vòng = trục PCA có phân tán NHỎ nhất (vòng gần phẳng)
    let bestAx = axes[0]; let bestSpread = Infinity;
    for (const a of axes) {
      let s = 0;
      for (let k = 0; k < sub3.length; k += 3) { const t = dot(sub([sub3[k], sub3[k + 1], sub3[k + 2]], c), a); s += t * t; }
      if (s < bestSpread) { bestSpread = s; bestAx = a; }
    }
    axis = bestAx; center = c;
    let sr = 0;
    for (let k = 0; k < sub3.length; k += 3) {
      const d = sub([sub3[k], sub3[k + 1], sub3[k + 2]], c);
      const t = dot(d, axis);
      sr += Math.hypot(d[0] - t * axis[0], d[1] - t * axis[1], d[2] - t * axis[2]);
    }
    R = sr / (sub3.length / 3);
  }
  if (R < o.rMinAbs || R > o.rMaxAbs) return null;

  let sd = 0; const ds: number[] = [];
  for (const i of inliers) { const d = distToCircle(at(i), center, axis, R); ds.push(d); sd += d; }
  const rMinor = sd / ds.length;
  let sq = 0; for (const d of ds) sq += (d - rMinor) * (d - rMinor);
  return {
    axis, center, rMajor: R, rMinor, rms: Math.sqrt(sq / ds.length),
    coverageDeg: coverageOf(pts, inliers, center, axis), inliers,
  };
}

/* ───────── ②c MIRROR-COMPLETION: đối xứng phải SINH, không chỉ TỪ CHỐI ─────────

 * Tới đây trục đối xứng CHỈ dùng để LOẠI (annularity check ở ④c/④c2) — vật đối xứng THẬT (4 chân
 * ghế đúc cùng khuôn, 2 vòng tay vịn cùng cỡ) vẫn bị fit ĐỘC LẬP từng bên, cộng dồn sai số HAI LẦN:
 * chân trái đo ra 38mm, chân phải 41mm, dù thực tế phải giống hệt. `mirrorCompleteShapes` sửa việc
 * này SAU khi mọi part đã fit xong: dò mặt phẳng đối xứng bằng PCA trên TÂM của các part CÙNG VAI
 * TRÒ (cùng hậu tố id, vd "-chan"), rồi COPY kích thước (KHÔNG fit lại) từ part có RMS THẤP HƠN
 * sang part kia. Vị trí (center/axis) GIỮ NGUYÊN — đây không phải phép dịch chuyển: cylinder/torus
 * có radius/height (hay rMajor/rMinor) là ĐẠI LƯỢNG VÔ HƯỚNG, mirror hình học của chúng qua bất kỳ
 * mặt phẳng nào cũng ra đúng số đó — nên "mirror hình dạng" ở đây tương đương "tin số đo chắc hơn".
 */

export interface MirrorableShape {
  id: string;
  loai: 'cylinder' | 'torus';
  /** vai trò vật lý (hậu tố id sau "pN-", vd "chan" · "vong" · "vong-tay-vin") — CHỈ so trong cùng vai trò */
  kind: string;
  centerMm: V3;
  /** RMS fit gốc (mm) — bên thấp hơn được tin làm gốc */
  rms: number;
  /** cylinder: [radiusMm, heightMm] · torus: [rMajorMm, rMinorMm] */
  shape: [number, number];
}

export interface MirrorResult {
  /** id part BỊ SỬA (RMS cao hơn trong cặp/cụm đối xứng) */
  id: string;
  /** kích thước mới — COPY nguyên văn từ part gốc, không tính lại */
  shape: [number, number];
  /** id part LÀM GỐC (RMS thấp hơn) */
  mirroredFrom: string;
}

/** Hậu tố vai trò từ id dạng `p<pid>-<vai trò>` (vd "p3-chan" → "chan"). Không khớp mẫu ⇒ dùng
 * nguyên id — an toàn (mỗi part rơi vào một nhóm riêng của chính nó, không ghép nhầm). */
function partKindOf(id: string): string {
  const m = /^p\d+-(.+)$/.exec(id);
  return m ? m[1] : id;
}

/**
 * Dò đối xứng + copy kích thước — hàm THUẦN (không đụng ChuanNetPart) để test độc lập không cần
 * dựng mesh.
 *
 * Thuật toán, cho từng nhóm CÙNG (loai, kind):
 *  1. PCA trên tâm (centroidAndAxes, hàm sẵn có ở ②) → tâm nhóm `gc` + 3 trục trực chuẩn.
 *  2. Với mỗi trục: phản chiếu MỌI tâm qua mặt phẳng (gc, trục) — nếu quan hệ khớp là ĐỐI XỨNG 1-1
 *     THẬT (mọi tâm khớp đúng một tâm khác, và khớp đó soi ngược lại đúng chính nó — loại trục giả
 *     may rủi khớp một cặp mà không khớp cả nhóm), trục này là MẶT ĐỐI XỨNG THẬT của cả nhóm.
 *  3. Union-find gom các cặp khớp qua NHIỀU trục hợp lệ thành một cụm (4 chân ghế: mặt đối xứng
 *     trái-phải + mặt trước-sau gộp cả 4 chân vào MỘT cụm liên thông qua 2 lượt hợp).
 *  4. Mỗi cụm ≥2 phần tử: phần tử RMS THẤP NHẤT làm gốc, các phần còn lại NHẬN kích thước của nó.
 *
 * Không tìm được trục hợp lệ nào (hình không đối xứng thật, hoặc chỉ có 1 part trong vai trò đó)
 * ⇒ nhóm GIỮ NGUYÊN, không có kết quả cho nhóm đó — đúng luật "không đạt thì giữ, cấm ép" xuyên
 * suốt file này [T0].
 */
export function mirrorCompleteShapes(
  items: MirrorableShape[],
  opts: { matchTolRatio?: number } = {},
): MirrorResult[] {
  const matchTolRatio = opts.matchTolRatio ?? 0.12;
  const out: MirrorResult[] = [];
  const groups = new Map<string, MirrorableShape[]>();
  for (const it of items) {
    const key = `${it.loai}:${it.kind}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(it);
  }

  for (const group of groups.values()) {
    const n = group.length;
    if (n < 2) continue; // lẻ loi — không có đối tác, giữ nguyên [T0]

    const centers = new Float64Array(n * 3);
    group.forEach((g, i) => { centers[3 * i] = g.centerMm[0]; centers[3 * i + 1] = g.centerMm[1]; centers[3 * i + 2] = g.centerMm[2]; });
    const { c: gc, axes } = centroidAndAxes(centers);

    let minPairDist = Infinity;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const d = Math.hypot(
        group[i].centerMm[0] - group[j].centerMm[0],
        group[i].centerMm[1] - group[j].centerMm[1],
        group[i].centerMm[2] - group[j].centerMm[2],
      );
      if (d < minPairDist) minPairDist = d;
    }
    if (!isFinite(minPairDist) || minPairDist < 1e-6) continue; // tâm trùng nhau — suy biến, bỏ qua an toàn
    const tol = minPairDist * matchTolRatio;

    const par = group.map((_, i) => i);
    const find = (a: number): number => { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; } return a; };
    const uni = (a: number, b: number) => { const ra = find(a); const rb = find(b); if (ra !== rb) par[ra] = rb; };

    for (const axis of axes) {
      const matched = new Array<number>(n).fill(-1);
      let axisOk = true;
      for (let i = 0; i < n && axisOk; i++) {
        const d = sub(group[i].centerMm, gc);
        const t = dot(d, axis);
        const refl: V3 = [
          group[i].centerMm[0] - 2 * t * axis[0],
          group[i].centerMm[1] - 2 * t * axis[1],
          group[i].centerMm[2] - 2 * t * axis[2],
        ];
        let bestJ = -1; let bestD = Infinity;
        for (let j = 0; j < n; j++) {
          if (j === i) continue;
          const dj = Math.hypot(refl[0] - group[j].centerMm[0], refl[1] - group[j].centerMm[1], refl[2] - group[j].centerMm[2]);
          if (dj < bestD) { bestD = dj; bestJ = j; }
        }
        if (bestJ === -1 || bestD > tol) { axisOk = false; break; }
        matched[i] = bestJ;
      }
      // đối xứng 1-1 THẬT: quan hệ khớp phải soi ngược lại đúng chính nó — loại trục giả may rủi
      if (axisOk) for (let i = 0; i < n && axisOk; i++) if (matched[matched[i]] !== i) axisOk = false;
      if (!axisOk) continue;
      for (let i = 0; i < n; i++) uni(i, matched[i]);
    }

    const comps = new Map<number, number[]>();
    for (let i = 0; i < n; i++) { const r = find(i); if (!comps.has(r)) comps.set(r, []); comps.get(r)!.push(i); }
    for (const comp of comps.values()) {
      if (comp.length < 2) continue;
      let rootI = comp[0];
      for (const i of comp) if (group[i].rms < group[rootI].rms) rootI = i;
      const root = group[rootI];
      for (const i of comp) if (i !== rootI) out.push({ id: group[i].id, shape: root.shape, mirroredFrom: root.id });
    }
  }
  return out;
}

/* ─────────────── ③ dựng lại primitive QUA build-ops (CHỈ GỌI) + đặt vào chỗ ─────────────── */

/** Trụ tham số → tam giác mm (Y-up không gian mesh): gọi `revolveProfile` (kho build-ops) với tiết
 * diện chữ nhật kín (bịt 2 nắp qua điểm bán kính 0), rồi xoay trục Y → trục fit + tịnh tiến về tâm.
 * Phép ĐẶT (rotate/translate) là việc của bước chuẩn nét, không đụng ruột build-ops. */
export function rebuildCylinderMm(fit: { axis: V3; center: V3; radius: number; height: number }, segments = 32): Float32Array {
  const h2 = fit.height / 2;
  const geom = revolveProfile(
    [{ x: 0, y: -h2 }, { x: fit.radius, y: -h2 }, { x: fit.radius, y: h2 }, { x: 0, y: h2 }],
    { centerXMm: 0, centerYMm: 0, segments },
  );
  return placeMm(geom, fit.axis, fit.center);
}

/** Xuyến tham số → tam giác mm: `revolveProfile` với tiết diện TRÒN kín tâm (R, 0) bán kính r. */
export function rebuildTorusMm(fit: { axis: V3; center: V3; rMajor: number; rMinor: number }, segments = 48, profilePts = 16): Float32Array {
  const profile: { x: number; y: number }[] = [];
  for (let i = 0; i <= profilePts; i++) {
    const a = (i / profilePts) * Math.PI * 2;
    profile.push({ x: fit.rMajor + fit.rMinor * Math.cos(a), y: fit.rMinor * Math.sin(a) });
  }
  const geom = revolveProfile(profile, { centerXMm: 0, centerYMm: 0, segments });
  return placeMm(geom, fit.axis, fit.center);
}

/** build-ops trả mét (Y-up, trục quay = Y) → nhân 1000 về mm, xoay (0,1,0)→axis, tịnh tiến centerMm. */
function placeMm(geom: THREE.BufferGeometry, axis: V3, centerMm: V3): Float32Array {
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...axis).normalize());
  const m = new THREE.Matrix4().compose(new THREE.Vector3(...centerMm), q, new THREE.Vector3(1000, 1000, 1000));
  const src = geom.getAttribute('position').array as Float32Array;
  const out = new Float32Array(src.length);
  const v = new THREE.Vector3();
  for (let i = 0; i < src.length; i += 3) {
    v.set(src[i], src[i + 1], src[i + 2]).applyMatrix4(m);
    out[i] = v.x; out[i + 1] = v.y; out[i + 2] = v.z;
  }
  geom.dispose();
  return out;
}

/* ────────────────────────── ④ pipeline chuẩn nét ────────────────────────── */

export interface ChuanNetOpts {
  /** cao thật của vật (mm) để scale đơn vị GLB chuẩn hoá → mm. Mặc định 1000 (1 đơn vị = 1m). */
  hMm?: number;
  /** số lát cắt ngang (mặc định 25 — đo thật đủ tách chân/vòng ghế bar) */
  slabs?: number;
  /** ngưỡng nhận fit: RMS < fitTolPct % đường chéo bbox mảnh (mặc định 2 — theo phiếu) */
  fitTolPct?: number;
  /**
   * Atlas baseColor đã GIẢI MÃ (RGBA hàng-đầu-là-đỉnh-ảnh) — dùng để primitive KẾ THỪA màu của
   * mảng mesh mà nó thay (CN-F2: chân trụ từng ăn Kd xám cứng 0.72 ⇒ nhìn như nhựa, lạc khỏi ghế
   * gỗ). Module này THUẦN (không đụng fs/không decode PNG) nên caller đưa pixel vào — proof Node
   * dùng `sharp`, app dùng canvas/ImageBitmap. Không đưa ⇒ giữ Kd xám cũ + ghi chú khai thật.
   */
  texRgba?: { width: number; height: number; data: Uint8Array | Uint8ClampedArray; channels?: number };
}

/** Lấy texel tại UV theo quy ước glTF (v=0 là HÀNG TRÊN của ảnh — xem ghi chú UV_FLIP_V). */
function sampleTex(tex: NonNullable<ChuanNetOpts['texRgba']>, u: number, v: number): V3 {
  const ch = tex.channels ?? 4;
  const x = Math.min(tex.width - 1, Math.max(0, Math.floor((u - Math.floor(u)) * tex.width)));
  const y = Math.min(tex.height - 1, Math.max(0, Math.floor((v - Math.floor(v)) * tex.height)));
  const i = (y * tex.width + x) * ch;
  return [tex.data[i], tex.data[i + 1], tex.data[i + 2]];
}

/** Màu TRUNG VỊ (median từng kênh) của các texel mà một tập tam giác tham chiếu qua UV → Kd 0..1
 * (sRGB, đúng thang `Kd` của MTL — MTLLoader tự đưa về không gian làm việc).
 * Trung vị chứ không trung bình: mảng chân gỗ luôn dính vài texel bóng đen ở rìa, trung bình bị
 * chúng kéo tối; trung vị bỏ qua. Trả null khi không có UV/texture — caller khai thật. */
export function medianKdOfTris(
  triIdx: number[],
  indices: Uint32Array,
  uvs: Float32Array | null,
  tex: ChuanNetOpts['texRgba'],
): V3 | null {
  if (!tex || !uvs || !triIdx.length) return null;
  const R: number[] = []; const G: number[] = []; const B: number[] = [];
  for (const t of triIdx) {
    let cu = 0; let cv = 0;
    for (let k = 0; k < 3; k++) {
      const vtx = indices[3 * t + k];
      const u = uvs[2 * vtx]; const v = uvs[2 * vtx + 1];
      cu += u / 3; cv += v / 3;
      const c = sampleTex(tex, u, v);
      R.push(c[0]); G.push(c[1]); B.push(c[2]);
    }
    const c = sampleTex(tex, cu, cv); // thêm trọng tâm — mảng trong lòng tam giác, không chỉ mép
    R.push(c[0]); G.push(c[1]); B.push(c[2]);
  }
  const med = (a: number[]) => { a.sort((x, y) => x - y); return a[a.length >> 1] / 255; };
  return [med(R), med(G), med(B)];
}

export type ChuanNetPart =
  | {
      loai: 'cylinder';
      id: string;
      thamSo: { radiusMm: number; heightMm: number; centerMm: V3; axis: V3 };
      buildOp: { op: 'revolve'; profileMm: { x: number; y: number }[]; centerXMm: number; centerYMm: number; segments: number };
      saiSoMm: number; saiSoPct: number; trisTruoc: number; trisSau: number;
      /** Kd kế thừa (sRGB 0..1) từ texel mảng mesh bị thay — null khi caller không đưa texture. */
      kdSrgb: V3 | null; matName: string;
      /** id part LÀM GỐC nếu radius/height của part này được COPY qua mirror-completion (②c) —
       * không có ⇒ part tự đứng bằng fit của chính nó. */
      mirroredFrom?: string;
    }
  | {
      loai: 'torus';
      id: string;
      thamSo: { rMajorMm: number; rMinorMm: number; centerMm: V3; axis: V3 };
      buildOp: { op: 'revolve'; profileMm: { x: number; y: number }[]; centerXMm: number; centerYMm: number; segments: number };
      saiSoMm: number; saiSoPct: number; trisTruoc: number; trisSau: number;
      kdSrgb: V3 | null; matName: string;
      /** góc phủ của điểm inlier quanh vòng (độ) — vòng hở <300° bị loại, xem fitRingRansac. */
      phuDo?: number;
      /** xem ghi chú cùng tên ở nhánh 'cylinder' — cùng cơ chế cho rMajor/rMinor. */
      mirroredFrom?: string;
    }
  | { loai: 'mesh'; id: string; trisTruoc: number; trisSau: number; dinhTruoc: number; dinhSau: number; lyDoGiu: string }
  | { loai: 'shadow-removed'; id: string; trisTruoc: number; trisSau: 0; lyDo: string };

export interface ChuanNetResult {
  parts: ChuanNetPart[];
  polyTruoc: number;
  polySau: number;
  scaleMmPerUnit: number;
  /** nội dung file xuất — caller tự ghi đĩa (module thuần không đụng fs) */
  obj: string;
  mtl: string;
  recipeJson: string;
  /** texture baseColor rút từ GLB (map_Kd trong MTL) — null nếu GLB không nhúng ảnh */
  texture: { mime: string; bytes: Uint8Array } | null;
  ghiChu: string[];
}

/**
 * ĐỔI TRỤC V glTF → OBJ. **Đây là lỗi CN-F1 (T soi mắt 14/08: nệm/lưng ra ĐEN BÓNG loang lổ).**
 *
 * Đo thật, không đoán (kịch bản `cn2-diag.ts` + đọc trạng thái vật liệu ngay trong trình xem):
 *  · glTF quy ước gốc UV ở MÉP TRÊN ảnh, và GLTFLoader nạp texture với `flipY = false`.
 *  · OBJ/MTL quy ước gốc UV ở MÉP DƯỚI; MTLLoader → TextureLoader để `flipY = true` mặc định
 *    (đo trong trình xem: `material.map.flipY === true`).
 *  ⇒ chép NGUYÊN VĂN v của glTF sang OBJ thì ảnh bị LẬT DỌC so với UV: mặt ngồi/lưng tra vào
 *    đúng mảng ĐEN lớn giữa atlas. Đo tỉ lệ texel tối: quy ước đúng 8,5% · quy ước lật 16,2%.
 *
 * Nghi phạm số 1 của phiếu (dedupe làm lệch chỉ số `vt`) đã ĐO VÀ LOẠI: đọc lại file OBJ đã xuất
 * rồi tra atlas theo chính chỉ số `vt` của từng mặt, màu trung vị 73,52,34 so với 67,48,33 của UV
 * GLB gốc — cùng một chỗ trên atlas. Ánh xạ vt/face KHÔNG lệch. (Test `chuan-net.test.ts` giữ
 * kết luận này: sau dedupe, UV mỗi mặt phải trùng UV nguồn.)
 *
 * `1 − v` cũng chính là phép mọi bộ chuyển glTF↔OBJ dùng, nên đúng cho cả 3ds Max (Max cũng lấy
 * gốc bitmap ở mép dưới).
 */
export const UV_FLIP_V = (v: number): number => 1 - v;

interface Tri { i: number; cx: number; cy: number; cz: number }

/** Gom cụm 1 lát: single-linkage qua lưới ô vuông XZ (ô = linkDist, nối ô kề 8 hướng). */
function clusterSlab(tris: Tri[], linkDist: number): Tri[][] {
  const cell = new Map<string, number[]>();
  const key = (x: number, z: number) => `${Math.floor(x / linkDist)}_${Math.floor(z / linkDist)}`;
  tris.forEach((t, i) => {
    const k = key(t.cx, t.cz);
    if (!cell.has(k)) cell.set(k, []);
    cell.get(k)!.push(i);
  });
  const par = tris.map((_, i) => i);
  const find = (a: number): number => { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; } return a; };
  const uni = (a: number, b: number) => { const ra = find(a); const rb = find(b); if (ra !== rb) par[ra] = rb; };
  for (const [k, ids] of cell) {
    const [gx, gz] = k.split('_').map(Number);
    for (let dx = 0; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      if (dx === 0 && dz < 0) continue;
      const nb = cell.get(`${gx + dx}_${gz + dz}`);
      if (!nb) continue;
      for (const a of ids) for (const b of nb) {
        if (a === b) continue;
        const dxx = tris[a].cx - tris[b].cx; const dzz = tris[a].cz - tris[b].cz;
        if (dxx * dxx + dzz * dzz < linkDist * linkDist) uni(a, b);
      }
    }
  }
  const out = new Map<number, Tri[]>();
  tris.forEach((t, i) => {
    const r = find(i);
    if (!out.has(r)) out.set(r, []);
    out.get(r)!.push(t);
  });
  return [...out.values()];
}

function bboxOf(pts: Float64Array): { min: V3; max: V3; diag: number } {
  const min: V3 = [Infinity, Infinity, Infinity];
  const max: V3 = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < pts.length; i += 3) for (let d = 0; d < 3; d++) {
    if (pts[i + d] < min[d]) min[d] = pts[i + d];
    if (pts[i + d] > max[d]) max[d] = pts[i + d];
  }
  return { min, max, diag: Math.hypot(max[0] - min[0], max[1] - min[1], max[2] - min[2]) };
}

/** Điểm DUY NHẤT (đã bỏ đỉnh trùng theo vị trí) của tập tam giác — nguyên liệu fit, tránh đỉnh
 * lặp (do tách UV seam) làm lệch trọng số. */
function uniquePtsOf(triIdx: number[], indices: Uint32Array, positions: Float32Array): Float64Array {
  const seen = new Set<string>();
  const out: number[] = [];
  for (const t of triIdx) for (let k = 0; k < 3; k++) {
    const v = indices[3 * t + k];
    const x = positions[3 * v]; const y = positions[3 * v + 1]; const z = positions[3 * v + 2];
    const kk = `${Math.round(x * 1e6)}_${Math.round(y * 1e6)}_${Math.round(z * 1e6)}`;
    if (seen.has(kk)) continue;
    seen.add(kk);
    out.push(x, y, z);
  }
  return new Float64Array(out);
}

/** Chạy chuẩn nét trên hình học đã parse (đơn vị GLB gốc). Tách riêng để test thuần không cần dựng
 * GLB nhị phân. `chuanNet(buf)` bên dưới là mặt tiền đọc từ GLB. */
export function chuanNetGeometry(geom: GlbGeometry, opts: ChuanNetOpts = {}): ChuanNetResult {
  const { positions, uvs, indices } = geom;
  const nTri = indices.length / 3;
  const slabs = opts.slabs ?? 25;
  const fitTolPct = opts.fitTolPct ?? 2;
  const ghiChu: string[] = [];

  // bbox toàn cục + scale
  const all = new Float64Array(positions);
  const bb = bboxOf(all);
  const yExt = bb.max[1] - bb.min[1] || 1;
  const xzDiag = Math.hypot(bb.max[0] - bb.min[0], bb.max[2] - bb.min[2]);
  const scaleMmPerUnit = (opts.hMm ?? 1000) / yExt;

  // tam giác + lát
  const slabH = yExt / slabs;
  const triOf = (t: number): Tri => {
    const a = indices[3 * t]; const b = indices[3 * t + 1]; const c = indices[3 * t + 2];
    return {
      i: t,
      cx: (positions[3 * a] + positions[3 * b] + positions[3 * c]) / 3,
      cy: (positions[3 * a + 1] + positions[3 * b + 1] + positions[3 * c + 1]) / 3,
      cz: (positions[3 * a + 2] + positions[3 * b + 2] + positions[3 * c + 2]) / 3,
    };
  };
  const slabTris: Tri[][] = Array.from({ length: slabs }, () => []);
  for (let t = 0; t < nTri; t++) {
    const tri = triOf(t);
    const s = Math.min(slabs - 1, Math.max(0, Math.floor((tri.cy - bb.min[1]) / slabH)));
    slabTris[s].push(tri);
  }

  const linkDist = 0.03 * xzDiag;
  const smallMaxR = 0.06 * xzDiag;
  const claimed = new Uint8Array(nTri); // 0 tự do · 1 chân · 2 bóng · 3 vòng

  /* — ④a CHÂN TRỤ: chuỗi cụm nhỏ qua ≥30% số lát — */
  interface ChainNode { cx: number; cz: number; y: number; maxR: number; tris: Tri[] }
  const chains: ChainNode[][] = [];
  for (let s = 0; s < slabs; s++) {
    for (const cl of clusterSlab(slabTris[s], linkDist)) {
      let cx = 0; let cz = 0;
      for (const t of cl) { cx += t.cx; cz += t.cz; }
      cx /= cl.length; cz /= cl.length;
      let maxR = 0;
      for (const t of cl) maxR = Math.max(maxR, Math.hypot(t.cx - cx, t.cz - cz));
      if (maxR > smallMaxR) continue; // cụm to — không phải chân
      const node: ChainNode = { cx, cz, y: bb.min[1] + (s + 0.5) * slabH, maxR, tris: cl };
      const joinDist = 0.07 * xzDiag;
      let joined = false;
      for (const ch of chains) {
        const last = ch[ch.length - 1];
        if (node.y - last.y <= 3.5 * slabH && Math.hypot(node.cx - last.cx, node.cz - last.cz) < joinDist) {
          ch.push(node); joined = true; break;
        }
      }
      if (!joined) chains.push([node]);
    }
  }
  const minSpan = 0.3 * yExt;
  const legChains = chains.filter((ch) => ch[ch.length - 1].y - ch[0].y >= minSpan);

  const parts: ChuanNetPart[] = [];
  const outTris: { positionsMm: Float32Array; group: string; mat: string; uvIdx?: number[] }[] = [];
  /** vật liệu RIÊNG từng primitive (CN-F2) — Kd kế thừa từ texel mảng mesh bị thay */
  const primMats: { name: string; kd: V3 }[] = [];
  let polySau = 0;
  let pid = 0;

  for (const ch of legChains) {
    // trục = đường thẳng qua tâm các cụm; bán kính bắt = 1.6 × maxR
    const capture = 1.6 * Math.max(...ch.map((n) => n.maxR));
    const centers = new Float64Array(ch.flatMap((n) => [n.cx, n.y, n.cz]));
    const { c: lc, axes } = centroidAndAxes(centers);
    const lax = axes.reduce((bst, a) => {
      const spread = (v: V3) => { let mn = Infinity; let mx = -Infinity; for (let i = 0; i < centers.length; i += 3) { const t = dot(sub([centers[i], centers[i + 1], centers[i + 2]], lc), v); mn = Math.min(mn, t); mx = Math.max(mx, t); } return mx - mn; };
      return spread(a) > spread(bst) ? a : bst;
    });
    // bắt 2 lượt: lượt 1 theo nhịp chuỗi; lượt 2 NỚI XUỐNG SÀN dọc trục đã fit — chuỗi có thể cụt
    // đáy vì lát thấp lẫn rác bóng sàn làm cụm phình quá ngưỡng (đo thật lincoln: 1 chân cụt 250mm)
    const gather = (axO: V3, axD: V3, yLo: number, yHi: number): number[] => {
      const out: number[] = [];
      for (let t = 0; t < nTri; t++) {
        if (claimed[t]) continue;
        let inside = true;
        for (let k = 0; k < 3 && inside; k++) {
          const v = indices[3 * t + k];
          const p: V3 = [positions[3 * v], positions[3 * v + 1], positions[3 * v + 2]];
          if (p[1] < yLo || p[1] > yHi) { inside = false; break; }
          const d = sub(p, axO);
          const tt = dot(d, axD);
          if (Math.hypot(d[0] - tt * axD[0], d[1] - tt * axD[1], d[2] - tt * axD[2]) > capture) inside = false;
        }
        if (inside) out.push(t);
      }
      return out;
    };
    let legTris = gather(lc, lax, ch[0].y - slabH, ch[ch.length - 1].y + slabH);
    if (legTris.length < 20) continue;
    let fit = fitCylinderPts(uniquePtsOf(legTris, indices, positions));
    legTris = gather(fit.center, fit.axis, bb.min[1], ch[ch.length - 1].y + slabH);
    if (legTris.length < 20) continue;
    const pts = uniquePtsOf(legTris, indices, positions);
    fit = fitCylinderPts(pts);
    // kẹp ĐÁY trụ về mặt sàn mesh — extent dọc trục ăn outlier khiến chân thò xuống dưới sàn
    // (đo thật lincoln: thò 13mm). Vật đứng trên sàn: đáy trụ không được thấp hơn minY mesh.
    if (Math.abs(fit.axis[1]) > 0.5) {
      const ax = fit.axis[1] > 0 ? fit.axis : ([-fit.axis[0], -fit.axis[1], -fit.axis[2]] as V3);
      const bottomY = fit.center[1] - ax[1] * (fit.height / 2);
      if (bottomY < bb.min[1]) {
        const delta = (bb.min[1] - bottomY) / ax[1];
        fit = {
          ...fit,
          height: fit.height - delta,
          center: [fit.center[0] + ax[0] * delta / 2, fit.center[1] + ax[1] * delta / 2, fit.center[2] + ax[2] * delta / 2],
        };
      }
    }
    const partDiag = bboxOf(pts).diag;
    const saiSoPct = (fit.rms / partDiag) * 100;
    if (saiSoPct <= fitTolPct) {
      for (const t of legTris) claimed[t] = 1;
      pid++;
      const id = `p${pid}-chan`;
      const thamSo = {
        radiusMm: fit.radius * scaleMmPerUnit,
        heightMm: fit.height * scaleMmPerUnit,
        centerMm: fit.center.map((v) => v * scaleMmPerUnit) as V3,
        axis: fit.axis[1] < 0 ? (fit.axis.map((v) => -v) as V3) : fit.axis,
      };
      const h2 = thamSo.heightMm / 2;
      const buildOp = {
        op: 'revolve' as const,
        profileMm: [{ x: 0, y: -h2 }, { x: thamSo.radiusMm, y: -h2 }, { x: thamSo.radiusMm, y: h2 }, { x: 0, y: h2 }],
        centerXMm: 0, centerYMm: 0, segments: 32,
      };
      const rebuilt = rebuildCylinderMm({ axis: thamSo.axis, center: thamSo.centerMm, radius: thamSo.radiusMm, height: thamSo.heightMm }, 32);
      const trisSau = rebuilt.length / 9;
      polySau += trisSau;
      // CN-F2: chân KẾ THỪA màu gỗ của mảng mesh nó thay, không ăn Kd xám cứng
      const kdSrgb = medianKdOfTris(legTris, indices, uvs, opts.texRgba);
      const matName = kdSrgb ? `mat_${id}` : 'mat_primitive';
      if (kdSrgb) primMats.push({ name: matName, kd: kdSrgb });
      parts.push({ loai: 'cylinder', id, thamSo, buildOp, saiSoMm: fit.rms * scaleMmPerUnit, saiSoPct, trisTruoc: legTris.length, trisSau, kdSrgb, matName });
      outTris.push({ positionsMm: rebuilt, group: `${id}_cylinder`, mat: matName });
    } else {
      ghiChu.push(`chuỗi chân tại (${(lc[0] * scaleMmPerUnit).toFixed(0)},${(lc[2] * scaleMmPerUnit).toFixed(0)})mm fit trụ RMS ${saiSoPct.toFixed(1)}% > ${fitTolPct}% — GIỮ mesh, không ép.`);
    }
  }

  /* — ④b SHADOW-BLOB: tam giác toàn bộ nằm sát sàn, mảng phẳng rộng — */
  const floorBand = bb.min[1] + 0.02 * yExt;
  const floorTris: Tri[] = [];
  for (let t = 0; t < nTri; t++) {
    if (claimed[t]) continue;
    let under = true;
    for (let k = 0; k < 3; k++) if (positions[3 * indices[3 * t + k] + 1] > floorBand) { under = false; break; }
    if (under) floorTris.push(triOf(t));
  }
  if (floorTris.length) {
    // gom cụm giãn 2× (mảng bóng thưa, tam giác to — centroid xa nhau) rồi GỘP mọi cụm đạt tiêu
    // chí thành MỘT mảnh báo cáo (đo thật lincoln: bóng vỡ 136 cụm lắt nhắt nếu báo rời từng cụm)
    let removed = 0;
    let hMax = 0;
    let horizMax = 0;
    for (const cl of clusterSlab(floorTris, 2 * linkDist)) {
      const pts = uniquePtsOf(cl.map((t) => t.i), indices, positions);
      const cb = bboxOf(pts);
      const h = cb.max[1] - cb.min[1];
      const horiz = Math.max(cb.max[0] - cb.min[0], cb.max[2] - cb.min[2]);
      // dẹt (cao < 2% tổng) + bẹt theo phương ngang (rộng ≥ 3× cao) ⇒ bóng nướng nhầm — XOÁ
      if (h < 0.02 * yExt && horiz > 3 * h) {
        for (const t of cl) claimed[t.i] = 2;
        removed += cl.length;
        hMax = Math.max(hMax, h);
        horizMax = Math.max(horizMax, horiz);
      }
    }
    if (removed) {
      pid++;
      parts.push({
        loai: 'shadow-removed', id: `p${pid}-bong`, trisTruoc: removed, trisSau: 0,
        lyDo: `các mảng sát sàn cao ≤${(hMax * scaleMmPerUnit).toFixed(1)}mm (<2% tổng ${(yExt * scaleMmPerUnit).toFixed(0)}mm), bẹt ngang tới ${(horizMax * scaleMmPerUnit).toFixed(0)}mm — bóng đổ bị nướng thành khối, xoá.`,
      });
    }
  }

  /* — ④c VÒNG TORUS: lát có cụm lớn HÌNH VÀNH KHUYÊN (rỗng tâm) — */
  const annularSlabs: number[] = [];
  for (let s = 0; s < slabs; s++) {
    const free = slabTris[s].filter((t) => !claimed[t.i]);
    if (free.length < 30) continue;
    const big = clusterSlab(free, linkDist).sort((a, b) => b.length - a.length)[0];
    if (!big || big.length < 30) continue;
    let cx = 0; let cz = 0;
    for (const t of big) { cx += t.cx; cz += t.cz; }
    cx /= big.length; cz /= big.length;
    let rMin = Infinity; let rMax = 0;
    for (const t of big) { const r = Math.hypot(t.cx - cx, t.cz - cz); rMin = Math.min(rMin, r); rMax = Math.max(rMax, r); }
    if (rMax > 0.3 * xzDiag && rMin > 0.35 * rMax) annularSlabs.push(s);
  }
  // dải lát vành khuyên liên tiếp dài nhất (cho hở 1 lát)
  let run: number[] = [];
  let bestRun: number[] = [];
  for (const s of annularSlabs) {
    if (run.length && s - run[run.length - 1] > 2) { if (run.length > bestRun.length) bestRun = run; run = []; }
    run.push(s);
  }
  if (run.length > bestRun.length) bestRun = run;
  if (bestRun.length) {
    const yLo = bb.min[1] + bestRun[0] * slabH;
    const yHi = bb.min[1] + (bestRun[bestRun.length - 1] + 1) * slabH;
    const ringTris: number[] = [];
    for (let t = 0; t < nTri; t++) {
      if (claimed[t]) continue;
      const c = triOf(t);
      if (c.cy >= yLo && c.cy < yHi) ringTris.push(t);
    }
    if (ringTris.length >= 50) {
      const pts = uniquePtsOf(ringTris, indices, positions);
      const fit = fitTorusPts(pts);
      const partDiag = bboxOf(pts).diag;
      const saiSoPct = (fit.rms / partDiag) * 100;
      if (saiSoPct <= fitTolPct && fit.rMajor > 1.8 * fit.rMinor) {
        for (const t of ringTris) claimed[t] = 3;
        pid++;
        const id = `p${pid}-vong`;
        const thamSo = {
          rMajorMm: fit.rMajor * scaleMmPerUnit,
          rMinorMm: fit.rMinor * scaleMmPerUnit,
          centerMm: fit.center.map((v) => v * scaleMmPerUnit) as V3,
          axis: fit.axis[1] < 0 ? (fit.axis.map((v) => -v) as V3) : fit.axis,
        };
        const profileMm: { x: number; y: number }[] = [];
        for (let i = 0; i <= 16; i++) {
          const a = (i / 16) * Math.PI * 2;
          profileMm.push({ x: thamSo.rMajorMm + thamSo.rMinorMm * Math.cos(a), y: thamSo.rMinorMm * Math.sin(a) });
        }
        const rebuilt = rebuildTorusMm({ axis: thamSo.axis, center: thamSo.centerMm, rMajor: thamSo.rMajorMm, rMinor: thamSo.rMinorMm }, 48, 16);
        const trisSau = rebuilt.length / 9;
        polySau += trisSau;
        const kdSrgb = medianKdOfTris(ringTris, indices, uvs, opts.texRgba);
        const matName = kdSrgb ? `mat_${id}` : 'mat_primitive';
        if (kdSrgb) primMats.push({ name: matName, kd: kdSrgb });
        parts.push({
          loai: 'torus', id, thamSo,
          buildOp: { op: 'revolve', profileMm, centerXMm: 0, centerYMm: 0, segments: 48 },
          saiSoMm: fit.rms * scaleMmPerUnit, saiSoPct, trisTruoc: ringTris.length, trisSau,
          kdSrgb, matName,
        });
        outTris.push({ positionsMm: rebuilt, group: `${id}_torus`, mat: matName });
      } else {
        ghiChu.push(`dải vành khuyên y=[${(yLo * scaleMmPerUnit).toFixed(0)},${(yHi * scaleMmPerUnit).toFixed(0)}]mm fit torus RMS ${saiSoPct.toFixed(1)}%${fit.rMajor <= 1.8 * fit.rMinor ? ' (R/r quá nhỏ)' : ''} — GIỮ mesh, không ép.`);
      }
    }
  }

  /* — ④c2 VÒNG TRỤC NGANG (tay vịn) — RANSAC circle-in-3D, xem khối ②b —
   * Phân vai rõ với ④c: ④c bắt vòng trục ĐỨNG (lát cắt ngang thấy vành khuyên); ④c2 bắt vòng trục
   * NGANG (lát cắt ngang KHÔNG bao giờ thấy vành khuyên vì luôn dính mép nệm — lý do CN cũ khai
   * không tách nổi). Chặn |trục·Y| ≤ 0,4 để hai đường không giành nhau một mảnh, và để cụm gác
   * chân (vòng trục ĐỨNG R lớn, thực chất là các THANH THẲNG bắt chéo) không lọt sang đây. */
  const ringTube = 0.012 * bb.diag;
  for (let ringNo = 0; ringNo < 3; ringNo++) {
    const freeTris: number[] = [];
    for (let t = 0; t < nTri; t++) if (!claimed[t]) freeTris.push(t);
    if (freeTris.length < 60) break;
    const freePts = uniquePtsOf(freeTris, indices, positions);
    const fit = fitRingRansac(freePts, {
      rMinAbs: 0.06 * bb.diag, rMaxAbs: 0.16 * bb.diag, tube: ringTube, iters: 12000, seed: 20260814 + ringNo,
    });
    if (!fit) break;
    if (Math.abs(fit.axis[1]) > 0.4) break; // trục không ngang ⇒ việc của ④c, không lấn sân
    // Tam giác thuộc vòng = CẢ BA đỉnh nằm trong ống. Bán kính THU rộng hơn bán kính CHẤM ĐIỂM
    // 1,35× (không đổi phép fit, chỉ đổi phép gom): lấy đúng `ringTube` thì mép ngoài vỏ ống rơi
    // lại thành mảnh vụn đen bám quanh xuyến mới — nhìn thấy rõ ở ảnh nghiệm thu vòng 1.
    const claimTube = ringTube * 1.35;
    const ringTris = freeTris.filter((t) => {
      for (let k = 0; k < 3; k++) {
        const v = indices[3 * t + k];
        if (distToCircle([positions[3 * v], positions[3 * v + 1], positions[3 * v + 2]], fit.center, fit.axis, fit.rMajor) > claimTube) return false;
      }
      return true;
    });
    if (ringTris.length < 40) break;
    const rPts = uniquePtsOf(ringTris, indices, positions);
    const partDiag = bboxOf(rPts).diag;
    const saiSoPct = (fit.rms / partDiag) * 100;
    const dat = `R=${(fit.rMajor * scaleMmPerUnit).toFixed(0)}mm r=${(fit.rMinor * scaleMmPerUnit).toFixed(1)}mm tâm(${fit.center.map((v) => (v * scaleMmPerUnit).toFixed(0)).join(',')})`;
    if (saiSoPct > fitTolPct || fit.coverageDeg < 300 || fit.rMajor <= 1.8 * fit.rMinor) {
      ghiChu.push(`vòng trục ngang ${dat}: RMS ${saiSoPct.toFixed(2)}% (cửa ${fitTolPct}%) · phủ ${fit.coverageDeg}° (cửa 300°) · R/r ${(fit.rMajor / fit.rMinor).toFixed(1)} — KHÔNG đạt, GIỮ mesh, không ép.`);
      break;
    }
    for (const t of ringTris) claimed[t] = 3;
    pid++;
    const id = `p${pid}-vong-tay-vin`;
    const thamSo = {
      rMajorMm: fit.rMajor * scaleMmPerUnit,
      rMinorMm: fit.rMinor * scaleMmPerUnit,
      centerMm: fit.center.map((v) => v * scaleMmPerUnit) as V3,
      axis: fit.axis,
    };
    // 48 nhịp quanh vòng (đường tròn LỚN nhìn thấy rõ, thiếu nhịp là ra đa giác) × 10 điểm tiết
    // diện (ống chỉ ~11mm, không ai soi mặt cắt) = 960 tam giác — vẫn NHẸ hơn 1005 tris mesh nó thay.
    const RING_SEG = 48; const RING_PROFILE = 10;
    const profileMm: { x: number; y: number }[] = [];
    for (let i = 0; i <= RING_PROFILE; i++) {
      const a = (i / RING_PROFILE) * Math.PI * 2;
      profileMm.push({ x: thamSo.rMajorMm + thamSo.rMinorMm * Math.cos(a), y: thamSo.rMinorMm * Math.sin(a) });
    }
    const rebuilt = rebuildTorusMm({ axis: thamSo.axis, center: thamSo.centerMm, rMajor: thamSo.rMajorMm, rMinor: thamSo.rMinorMm }, RING_SEG, RING_PROFILE);
    const trisSau = rebuilt.length / 9;
    polySau += trisSau;
    const kdSrgb = medianKdOfTris(ringTris, indices, uvs, opts.texRgba);
    const matName = kdSrgb ? `mat_${id}` : 'mat_primitive';
    if (kdSrgb) primMats.push({ name: matName, kd: kdSrgb });
    parts.push({
      loai: 'torus', id, thamSo,
      buildOp: { op: 'revolve', profileMm, centerXMm: 0, centerYMm: 0, segments: 48 },
      saiSoMm: fit.rms * scaleMmPerUnit, saiSoPct, trisTruoc: ringTris.length, trisSau,
      kdSrgb, matName, phuDo: fit.coverageDeg,
    });
    outTris.push({ positionsMm: rebuilt, group: `${id}_torus`, mat: matName });
  }

  /* — ④c3 MIRROR-COMPLETION: cặp part cùng vai trò (chân trái/phải, vòng…) đối chiếu qua mặt đối
   * xứng — bên RMS thấp hơn áp kích thước sang bên kia, xoá sai số cộng dồn của fit độc lập từng
   * bên. Thuật toán đầy đủ ở khối ②c phía trên `mirrorCompleteShapes`. Chạy SAU khi mọi part
   * cylinder/torus đã fit (④a/④c/④c2) và TRƯỚC khi gom phần mesh còn lại (④d) — sửa `parts` +
   * viết lại geometry tương ứng trong `outTris` để OBJ xuất ra khớp con số mới. — */
  const partOutIdx = new Map<string, number>(); // id part → chỉ số outTris (để viết lại geometry khi mirror)
  for (let i = 0; i < outTris.length; i++) {
    const m = /^(.+)_(cylinder|torus)$/.exec(outTris[i].group);
    if (m) partOutIdx.set(m[1], i);
  }
  const mirrorItems: MirrorableShape[] = [];
  for (const p of parts) {
    if (p.loai === 'cylinder') mirrorItems.push({ id: p.id, loai: 'cylinder', kind: partKindOf(p.id), centerMm: p.thamSo.centerMm, rms: p.saiSoMm, shape: [p.thamSo.radiusMm, p.thamSo.heightMm] });
    else if (p.loai === 'torus') mirrorItems.push({ id: p.id, loai: 'torus', kind: partKindOf(p.id), centerMm: p.thamSo.centerMm, rms: p.saiSoMm, shape: [p.thamSo.rMajorMm, p.thamSo.rMinorMm] });
  }
  for (const r of mirrorCompleteShapes(mirrorItems)) {
    const pi = parts.findIndex((p) => p.id === r.id);
    if (pi < 0) continue;
    const p = parts[pi];
    if (p.loai === 'cylinder') {
      const [radiusMm, heightMm] = r.shape;
      const h2 = heightMm / 2;
      const buildOp = {
        op: 'revolve' as const,
        profileMm: [{ x: 0, y: -h2 }, { x: radiusMm, y: -h2 }, { x: radiusMm, y: h2 }, { x: 0, y: h2 }],
        centerXMm: 0, centerYMm: 0, segments: p.buildOp.segments,
      };
      parts[pi] = { ...p, thamSo: { ...p.thamSo, radiusMm, heightMm }, buildOp, mirroredFrom: r.mirroredFrom };
      const oi = partOutIdx.get(p.id);
      if (oi != null) outTris[oi].positionsMm = rebuildCylinderMm({ axis: p.thamSo.axis, center: p.thamSo.centerMm, radius: radiusMm, height: heightMm }, p.buildOp.segments);
    } else if (p.loai === 'torus') {
      const [rMajorMm, rMinorMm] = r.shape;
      const profilePts = p.buildOp.profileMm.length - 1;
      const profileMm: { x: number; y: number }[] = [];
      for (let k = 0; k <= profilePts; k++) {
        const a = (k / profilePts) * Math.PI * 2;
        profileMm.push({ x: rMajorMm + rMinorMm * Math.cos(a), y: rMinorMm * Math.sin(a) });
      }
      const buildOp = { op: 'revolve' as const, profileMm, centerXMm: 0, centerYMm: 0, segments: p.buildOp.segments };
      parts[pi] = { ...p, thamSo: { ...p.thamSo, rMajorMm, rMinorMm }, buildOp, mirroredFrom: r.mirroredFrom };
      const oi = partOutIdx.get(p.id);
      if (oi != null) outTris[oi].positionsMm = rebuildTorusMm({ axis: p.thamSo.axis, center: p.thamSo.centerMm, rMajor: rMajorMm, rMinor: rMinorMm }, p.buildOp.segments, profilePts);
    }
    ghiChu.push(`mirror-completion: ${r.id} nhận kích thước từ ${r.mirroredFrom} (RMS thấp hơn) — đối xứng, không fit lại.`);
  }

  /* — ④d PHẦN CÒN LẠI: mesh giữ, bỏ đỉnh trùng (theo cặp vị trí+UV — không phá seam texture) — */
  const restTris: number[] = [];
  for (let t = 0; t < nTri; t++) if (!claimed[t]) restTris.push(t);
  if (restTris.length) {
    const key2id = new Map<string, number>();
    const vOut: number[] = [];
    const vtOut: number[] = [];
    const fOut: number[] = [];
    const srcVerts = new Set<number>();
    for (const t of restTris) for (let k = 0; k < 3; k++) {
      const v = indices[3 * t + k];
      srcVerts.add(v);
      const x = positions[3 * v] * scaleMmPerUnit;
      const y = positions[3 * v + 1] * scaleMmPerUnit;
      const z = positions[3 * v + 2] * scaleMmPerUnit;
      const u = uvs ? uvs[2 * v] : 0;
      const w = uvs ? uvs[2 * v + 1] : 0;
      const kk = `${Math.round(x * 100)}_${Math.round(y * 100)}_${Math.round(z * 100)}_${Math.round(u * 1e5)}_${Math.round(w * 1e5)}`;
      let id = key2id.get(kk);
      if (id == null) {
        id = vOut.length / 3;
        key2id.set(kk, id);
        vOut.push(x, y, z);
        vtOut.push(u, UV_FLIP_V(w));
      }
      fOut.push(id);
    }
    pid++;
    const id = `p${pid}-huu-co`;
    polySau += restTris.length;
    parts.push({
      loai: 'mesh', id, trisTruoc: restTris.length, trisSau: restTris.length,
      dinhTruoc: srcVerts.size, dinhSau: vOut.length / 3,
      lyDoGiu: 'khối hữu cơ (nệm/lưng bọc, tay vịn liền khối) — không trục đối xứng đơn, fit primitive sẽ sai; giữ mesh làm sạch.',
    });
    outTris.push({
      positionsMm: new Float32Array(0), group: `${id}_mesh`, mat: uvs ? 'mat_mesh' : 'mat_primitive',
      // mesh giữ đi đường indexed riêng — nhét vào cấu trúc dưới khi viết OBJ
      uvIdx: fOut,
    });
    // gắn dữ liệu indexed vào phần tử vừa đẩy (giữ chữ ký outTris đơn giản)
    (outTris[outTris.length - 1] as unknown as { vIndexed: number[]; vtIndexed: number[] }).vIndexed = vOut;
    (outTris[outTris.length - 1] as unknown as { vtIndexed: number[] }).vtIndexed = vtOut;
  }

  /* — ⑤ viết OBJ + MTL + recipe — */
  const texture = null; // mặt tiền chuanNet() điền từ GLB
  const objLines: string[] = [
    '# InteriorFlow chuanNet — đơn vị mm, Y-up (đổi Z-up khi import Max: Flip YZ)',
    `# nguồn: mesh máy sinh ${nTri} tam giác → ${parts.length} mảnh`,
    'mtllib chuannet.mtl',
  ];
  let vBase = 1;
  let vtBase = 1;
  for (const g of outTris) {
    objLines.push(`o ${g.group}`);
    objLines.push(`usemtl ${g.mat}`);
    const gi = g as unknown as { vIndexed?: number[]; vtIndexed?: number[] };
    if (gi.vIndexed) {
      const v = gi.vIndexed; const vt = gi.vtIndexed ?? [];
      for (let i = 0; i < v.length; i += 3) objLines.push(`v ${v[i].toFixed(2)} ${v[i + 1].toFixed(2)} ${v[i + 2].toFixed(2)}`);
      for (let i = 0; i < vt.length; i += 2) objLines.push(`vt ${vt[i].toFixed(5)} ${vt[i + 1].toFixed(5)}`);
      const f = g.uvIdx!;
      for (let i = 0; i < f.length; i += 3) {
        objLines.push(`f ${vBase + f[i]}/${vtBase + f[i]} ${vBase + f[i + 1]}/${vtBase + f[i + 1]} ${vBase + f[i + 2]}/${vtBase + f[i + 2]}`);
      }
      vBase += v.length / 3;
      vtBase += vt.length / 2;
    } else {
      const p = g.positionsMm;
      for (let i = 0; i < p.length; i += 3) objLines.push(`v ${p[i].toFixed(2)} ${p[i + 1].toFixed(2)} ${p[i + 2].toFixed(2)}`);
      for (let i = 0; i < p.length / 3; i += 3) objLines.push(`f ${vBase + i} ${vBase + i + 1} ${vBase + i + 2}`);
      vBase += p.length / 3;
    }
  }
  const mtlLines = ['# InteriorFlow chuanNet MTL'];
  // ① vật liệu RIÊNG từng primitive — Kd = màu trung vị texel của mảng mesh bị thay (CN-F2).
  //    `Ka = Kd` để trình xem có đèn môi trường không dựng mảnh thành khối đen.
  for (const m of primMats) {
    const k = m.kd.map((v) => v.toFixed(3)).join(' ');
    mtlLines.push(`newmtl ${m.name}`, `Kd ${k}`, `Ka ${k}`, 'Ks 0.05 0.05 0.05', 'Ns 32', 'illum 2');
  }
  // ② dự phòng: chỉ dùng khi caller KHÔNG đưa texture ⇒ không suy được màu (khai thật ở ghiChu)
  if (primMats.length < parts.filter((p) => p.loai === 'cylinder' || p.loai === 'torus').length) {
    mtlLines.push('newmtl mat_primitive', 'Kd 0.72 0.70 0.66', 'Ka 0.72 0.70 0.66', 'Ks 0.04 0.04 0.04', 'Ns 24', 'illum 2');
  }
  mtlLines.push(
    'newmtl mat_mesh',
    'Kd 1.0 1.0 1.0', 'Ka 1.0 1.0 1.0', 'Ks 0.02 0.02 0.02', 'Ns 10', 'illum 2',
    'map_Kd chuannet-basecolor.png',
    '',
  );
  const mtl = mtlLines.join('\n');
  if (!opts.texRgba) {
    ghiChu.push('KHÔNG có atlas giải mã (opts.texRgba) — primitive giữ Kd xám dự phòng, KHÔNG kế thừa được màu vật liệu thật.');
  }

  const recipe = {
    marker: 'chuanNet',
    donVi: 'mm',
    scaleMmPerUnit,
    polyTruoc: nTri,
    polySau,
    parts: parts.map((p) => {
      if (p.loai === 'cylinder' || p.loai === 'torus') {
        const { loai, id, thamSo, buildOp, saiSoMm, saiSoPct, trisTruoc, trisSau, kdSrgb, matName, mirroredFrom } = p;
        return {
          loai, id, thamSo, buildOp, datMm: { centerMm: thamSo.centerMm, axis: thamSo.axis },
          vatLieu: { matName, kdSrgb, nguon: kdSrgb ? 'trung vị texel atlas của mảng mesh bị thay' : 'không có atlas — Kd xám dự phòng' },
          saiSoMm, saiSoPct, trisTruoc, trisSau,
          mirroredFrom: mirroredFrom ?? null,
        };
      }
      if (p.loai === 'mesh') return { loai: p.loai, id: p.id, ref: `obj:o ${p.id}_mesh`, trisTruoc: p.trisTruoc, trisSau: p.trisSau, lyDoGiu: p.lyDoGiu };
      return { loai: p.loai, id: p.id, trisTruoc: p.trisTruoc, lyDo: p.lyDo };
    }),
    ghiChu,
  };

  return {
    parts,
    polyTruoc: nTri,
    polySau,
    scaleMmPerUnit,
    obj: objLines.join('\n') + '\n',
    mtl,
    recipeJson: JSON.stringify(recipe, null, 2),
    texture,
    ghiChu,
  };
}

/** Mặt tiền GLB: parse + chạy pipeline + đính texture nhúng. Trả null khi GLB ngoài phạm vi đọc
 * (Draco/stride/không tam giác) — caller khai thật, không đoán. */
export function chuanNet(glb: Uint8Array, opts: ChuanNetOpts = {}): ChuanNetResult | null {
  const geom = parseGlbGeometry(glb);
  if (!geom) return null;
  const result = chuanNetGeometry(geom, opts);
  return { ...result, texture: extractGlbImage(glb) };
}
