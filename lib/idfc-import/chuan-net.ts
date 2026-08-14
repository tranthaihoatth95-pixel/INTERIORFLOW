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
}

export type ChuanNetPart =
  | {
      loai: 'cylinder';
      id: string;
      thamSo: { radiusMm: number; heightMm: number; centerMm: V3; axis: V3 };
      buildOp: { op: 'revolve'; profileMm: { x: number; y: number }[]; centerXMm: number; centerYMm: number; segments: number };
      saiSoMm: number; saiSoPct: number; trisTruoc: number; trisSau: number;
    }
  | {
      loai: 'torus';
      id: string;
      thamSo: { rMajorMm: number; rMinorMm: number; centerMm: V3; axis: V3 };
      buildOp: { op: 'revolve'; profileMm: { x: number; y: number }[]; centerXMm: number; centerYMm: number; segments: number };
      saiSoMm: number; saiSoPct: number; trisTruoc: number; trisSau: number;
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
      parts.push({ loai: 'cylinder', id, thamSo, buildOp, saiSoMm: fit.rms * scaleMmPerUnit, saiSoPct, trisTruoc: legTris.length, trisSau });
      outTris.push({ positionsMm: rebuilt, group: `${id}_cylinder`, mat: 'mat_primitive' });
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
        parts.push({
          loai: 'torus', id, thamSo,
          buildOp: { op: 'revolve', profileMm, centerXMm: 0, centerYMm: 0, segments: 48 },
          saiSoMm: fit.rms * scaleMmPerUnit, saiSoPct, trisTruoc: ringTris.length, trisSau,
        });
        outTris.push({ positionsMm: rebuilt, group: `${id}_torus`, mat: 'mat_primitive' });
      } else {
        ghiChu.push(`dải vành khuyên y=[${(yLo * scaleMmPerUnit).toFixed(0)},${(yHi * scaleMmPerUnit).toFixed(0)}]mm fit torus RMS ${saiSoPct.toFixed(1)}%${fit.rMajor <= 1.8 * fit.rMinor ? ' (R/r quá nhỏ)' : ''} — GIỮ mesh, không ép.`);
      }
    }
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
        vtOut.push(u, w);
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
  const mtl = [
    '# InteriorFlow chuanNet MTL',
    'newmtl mat_primitive',
    'Kd 0.72 0.70 0.66', 'Ks 0.04 0.04 0.04', 'Ns 24',
    'newmtl mat_mesh',
    'Kd 1.0 1.0 1.0', 'Ks 0.02 0.02 0.02', 'Ns 10',
    'map_Kd chuannet-basecolor.png',
    '',
  ].join('\n');

  const recipe = {
    marker: 'chuanNet',
    donVi: 'mm',
    scaleMmPerUnit,
    polyTruoc: nTri,
    polySau,
    parts: parts.map((p) => {
      if (p.loai === 'cylinder' || p.loai === 'torus') {
        const { loai, id, thamSo, buildOp, saiSoMm, saiSoPct, trisTruoc, trisSau } = p;
        return { loai, id, thamSo, buildOp, datMm: { centerMm: thamSo.centerMm, axis: thamSo.axis }, saiSoMm, saiSoPct, trisTruoc, trisSau };
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
