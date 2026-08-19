/**
 * lib/idfc-import/surface-graph.ts — TẦNG "ĐỒ THỊ DIỆN" (surface graph) cho mesh máy sinh.
 * Hoà chỉ đạo 14/08: *"áp dụng thuật toán wireframe, định biên theo diện. Chia lưới xác định lại
 * hệ giá trị cần để định vị đúng. Phần cấu kiện vật liệu định nghĩa NÉT → MÀU → VẬT LIỆU."*
 *
 * Khác `chuan-net.ts` (cắt LÁT ngang theo trục đứng rồi gom cụm — mù với hình dạng): ở đây mesh
 * được đọc theo ĐÚNG thứ nó là — một tập DIỆN (surface patch) nối nhau qua CẠNH ĐẶC TRƯNG. Sáu
 * bước, mỗi bước ra SỐ [T6]:
 *   ① chuanHoaMesh      weld đỉnh (2 không gian: pos+uv để GIỮ UV · pos-only để nối topology),
 *                       bỏ tam giác suy biến, pháp tuyến/diện tích, bảng cạnh↔tam giác
 *   ② phanVungTheoDien  region growing theo góc NHỊ DIỆN (crease) — trụ/xuyến còn nguyên một diện
 *                       (nếu so với pháp tuyến TRUNG BÌNH của vùng thì mặt cong bị băm thành dải)
 *   ③ phanLoaiDien      fit planar / cylindrical / toroidal, không đạt ngưỡng ⇒ `freeform` +
 *                       khai thật [T0]; diện lớn mà freeform thì CHIA ĐÔI theo pháp tuyến rồi thử
 *                       lại (VSA rút gọn) — chia có giới hạn độ sâu, không chia vô hạn
 *   ④ bienDien          cạnh có 2 tam giác thuộc 2 diện KHÁC nhau (hoặc cạnh hở) = NÉT → nối
 *                       thành polyline → Douglas-Peucker
 *   ⑤ frame + lưới      mỗi diện có hệ trục cục bộ {tâm, 3 trục} + bbox cục bộ + lưới có cấu trúc
 *   ⑥ mauDien/suyVatLieu NÉT → MÀU (median texel atlas theo UV) → VẬT LIỆU (matId/PBR của IF)
 *
 * THUẦN — không fs/mạng/DOM/AI. Atlas pixel do phía gọi giải mã đưa vào (proof Node dùng `sharp`,
 * app dùng canvas). Chỉ GỌI `lib/cad/materials` + `lib/materials/*`, không đẻ hệ vật liệu riêng [T1].
 * Test: `lib/idfc-import/surface-graph.test.ts` (fixture hộp + trụ + xuyến tổng hợp).
 */
import { MATERIALS, type MaterialDef } from '../cad/materials';
import { inferPbrFromCategory } from '../materials/pbr-from-category';
import type { MaterialPbr } from '../materials/schema';

export type V3 = [number, number, number];

/* ══════════════════════ ① CHUẨN HOÁ ══════════════════════ */

export interface RawMesh {
  positions: Float32Array | Float64Array;
  uvs: Float32Array | Float64Array | null;
  indices: Uint32Array;
}

export interface MeshSoLieu {
  triVao: number;
  triRa: number;
  triSuyBien: number;
  dinhVao: number;
  /** đỉnh sau weld pos+uv (không gian XUẤT — giữ nguyên seam UV) */
  dinhRa: number;
  /** lớp vị trí sau weld pos-only (không gian TOPOLOGY — seam UV vẫn nối liền) */
  lopViTri: number;
  canhTong: number;
  /** cạnh chỉ 1 tam giác — mép hở */
  canhHo: number;
  /** cạnh ≥3 tam giác — không manifold, không nối hàng xóm */
  canhKhongManifold: number;
  dienTich: number;
}

export interface NormalizedMesh {
  /** đỉnh weld pos+uv, ĐÃ scale về mm nếu `hMm` được đưa */
  positions: Float64Array;
  uvs: Float64Array | null;
  indices: Uint32Array;
  /** đỉnh xuất → lớp vị trí (topology) */
  lopViTri: Uint32Array;
  triNormals: Float64Array;
  triAreas: Float64Array;
  /** 3 hàng xóm/tam giác theo cạnh (i0-i1, i1-i2, i2-i0); −1 = hở hoặc không manifold */
  triAdj: Int32Array;
  bboxMin: V3;
  bboxMax: V3;
  /** đường chéo bbox — mọi ngưỡng tỉ lệ đều quy theo số này */
  diag: number;
  /** hệ số đã nhân vào toạ độ gốc (1 nếu không scale) */
  scale: number;
  soLieu: MeshSoLieu;
}

const sub3 = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot3 = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross3 = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len3 = (a: V3): number => Math.hypot(a[0], a[1], a[2]);
const unit3 = (a: V3): V3 => { const l = len3(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

/**
 * Weld + dọn + dựng bảng cạnh. HAI không gian đỉnh cố ý:
 *  · `positions/uvs/indices` weld theo (vị trí + UV) — bài học CN-F1: weld chỉ theo vị trí là
 *    NUỐT seam UV ⇒ texture xé khi mở lại ở Max.
 *  · `lopViTri` weld theo vị trí — dùng để nối tam giác qua cạnh; nếu nối bằng không gian trên,
 *    mesh sẽ TỰ ĐỨT dọc mọi seam UV và vùng nào cũng vỡ vụn.
 */
export function chuanHoaMesh(raw: RawMesh, opts: { hMm?: number; weldEpsFrac?: number } = {}): NormalizedMesh {
  const P = raw.positions;
  const triVao = Math.floor(raw.indices.length / 3);
  const dinhVao = Math.floor(P.length / 3);

  // bbox gốc → hệ số scale (nếu khai chiều cao thật) + eps weld tỉ lệ
  let mn: V3 = [Infinity, Infinity, Infinity];
  let mx: V3 = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < P.length; i += 3) {
    for (let k = 0; k < 3; k++) { if (P[i + k] < mn[k]) mn[k] = P[i + k]; if (P[i + k] > mx[k]) mx[k] = P[i + k]; }
  }
  const hRaw = mx[1] - mn[1];
  const scale = opts.hMm && hRaw > 0 ? opts.hMm / hRaw : 1;
  mn = [mn[0] * scale, mn[1] * scale, mn[2] * scale];
  mx = [mx[0] * scale, mx[1] * scale, mx[2] * scale];
  const diag = len3(sub3(mx, mn)) || 1;
  const eps = diag * (opts.weldEpsFrac ?? 1e-6);

  const qk = (x: number) => Math.round(x / eps);
  const posMap = new Map<string, number>();
  const vertMap = new Map<string, number>();
  const outPos: number[] = [];
  const outUv: number[] = [];
  const outLop: number[] = [];
  const remap = new Uint32Array(dinhVao);
  const hasUv = !!raw.uvs;
  for (let v = 0; v < dinhVao; v++) {
    const x = P[v * 3] * scale, y = P[v * 3 + 1] * scale, z = P[v * 3 + 2] * scale;
    const pKey = `${qk(x)},${qk(y)},${qk(z)}`;
    let lop = posMap.get(pKey);
    if (lop === undefined) { lop = posMap.size; posMap.set(pKey, lop); }
    const u = hasUv ? raw.uvs![v * 2] : 0;
    const w = hasUv ? raw.uvs![v * 2 + 1] : 0;
    const vKey = `${pKey}|${Math.round(u * 1e5)},${Math.round(w * 1e5)}`;
    let vi = vertMap.get(vKey);
    if (vi === undefined) {
      vi = outLop.length;
      vertMap.set(vKey, vi);
      outPos.push(x, y, z);
      outUv.push(u, w);
      outLop.push(lop);
    }
    remap[v] = vi;
  }

  // tam giác: bỏ suy biến (lặp lớp vị trí hoặc diện tích ~0)
  const idx: number[] = [];
  const nrm: number[] = [];
  const ars: number[] = [];
  const areaEps = diag * diag * 1e-12;
  let triSuyBien = 0;
  let dienTich = 0;
  for (let t = 0; t < triVao; t++) {
    const a = remap[raw.indices[t * 3]], b = remap[raw.indices[t * 3 + 1]], c = remap[raw.indices[t * 3 + 2]];
    const la = outLop[a], lb = outLop[b], lc = outLop[c];
    if (la === lb || lb === lc || la === lc) { triSuyBien++; continue; }
    const pa: V3 = [outPos[a * 3], outPos[a * 3 + 1], outPos[a * 3 + 2]];
    const pb: V3 = [outPos[b * 3], outPos[b * 3 + 1], outPos[b * 3 + 2]];
    const pc: V3 = [outPos[c * 3], outPos[c * 3 + 1], outPos[c * 3 + 2]];
    const n = cross3(sub3(pb, pa), sub3(pc, pa));
    const l = len3(n);
    if (l * 0.5 < areaEps) { triSuyBien++; continue; }
    idx.push(a, b, c);
    nrm.push(n[0] / l, n[1] / l, n[2] / l);
    ars.push(l * 0.5);
    dienTich += l * 0.5;
  }
  const triRa = ars.length;

  // bảng cạnh (theo lớp vị trí) → hàng xóm tam giác
  const NP = posMap.size;
  const edgeMap = new Map<number, number[]>();
  const ekey = (a: number, b: number) => (a < b ? a * NP + b : b * NP + a);
  for (let t = 0; t < triRa; t++) {
    const l0 = outLop[idx[t * 3]], l1 = outLop[idx[t * 3 + 1]], l2 = outLop[idx[t * 3 + 2]];
    for (const [a, b] of [[l0, l1], [l1, l2], [l2, l0]] as const) {
      const k = ekey(a, b);
      const arr = edgeMap.get(k);
      if (arr) arr.push(t); else edgeMap.set(k, [t]);
    }
  }
  const triAdj = new Int32Array(triRa * 3).fill(-1);
  let canhHo = 0, canhKhongManifold = 0;
  for (const [, tris] of edgeMap) {
    if (tris.length === 1) { canhHo++; continue; }
    if (tris.length > 2) { canhKhongManifold++; continue; }
    const [ta, tb] = tris;
    // điền ĐÚNG khe cạnh (0=i0i1, 1=i1i2, 2=i2i0) của mỗi tam giác, không phải khe trống bất kỳ
    for (const [x, y] of [[ta, tb], [tb, ta]] as const) {
      const l0 = outLop[idx[x * 3]], l1 = outLop[idx[x * 3 + 1]], l2 = outLop[idx[x * 3 + 2]];
      const pairs: Array<[number, number]> = [[l0, l1], [l1, l2], [l2, l0]];
      for (let e = 0; e < 3; e++) {
        if (edgeMap.get(ekey(pairs[e][0], pairs[e][1])) === tris) triAdj[x * 3 + e] = y;
      }
    }
  }

  return {
    positions: Float64Array.from(outPos),
    uvs: hasUv ? Float64Array.from(outUv) : null,
    indices: Uint32Array.from(idx),
    lopViTri: Uint32Array.from(outLop),
    triNormals: Float64Array.from(nrm),
    triAreas: Float64Array.from(ars),
    triAdj,
    bboxMin: mn,
    bboxMax: mx,
    diag,
    scale,
    soLieu: {
      triVao, triRa, triSuyBien,
      dinhVao, dinhRa: outLop.length, lopViTri: NP,
      canhTong: edgeMap.size, canhHo, canhKhongManifold,
      dienTich,
    },
  };
}

/* ══════════════════════ ② PHÂN VÙNG THEO DIỆN ══════════════════════ */

export interface PhanVungOpts {
  /** ngưỡng góc NHỊ DIỆN giữa 2 tam giác kề — vượt là CẠNH ĐẶC TRƯNG (mặc định 15°) */
  angleDeg?: number;
  /** diện nhỏ hơn tỉ lệ này (so tổng diện tích) thì gộp vào hàng xóm lớn nhất (mặc định 0,3%) */
  minAreaFrac?: number;
}

/** Region growing theo crease → nhãn diện cho từng tam giác (0..n−1). */
export function phanVungTheoDien(m: NormalizedMesh, opts: PhanVungOpts = {}): { nhan: Int32Array; soDien: number } {
  const cosLim = Math.cos(((opts.angleDeg ?? 15) * Math.PI) / 180);
  const nT = m.triAreas.length;
  const nhan = new Int32Array(nT).fill(-1);
  const thuTu = Array.from({ length: nT }, (_, i) => i).sort((a, b) => m.triAreas[b] - m.triAreas[a]);
  let soDien = 0;
  const stack: number[] = [];
  for (const seed of thuTu) {
    if (nhan[seed] !== -1) continue;
    const id = soDien++;
    nhan[seed] = id;
    stack.push(seed);
    while (stack.length) {
      const t = stack.pop()!;
      const nt: V3 = [m.triNormals[t * 3], m.triNormals[t * 3 + 1], m.triNormals[t * 3 + 2]];
      for (let e = 0; e < 3; e++) {
        const u = m.triAdj[t * 3 + e];
        if (u < 0 || nhan[u] !== -1) continue;
        const nu: V3 = [m.triNormals[u * 3], m.triNormals[u * 3 + 1], m.triNormals[u * 3 + 2]];
        if (dot3(nt, nu) < cosLim) continue;
        nhan[u] = id;
        stack.push(u);
      }
    }
  }
  return gopDienVun(m, nhan, soDien, opts.minAreaFrac ?? 0.003);
}

/** Gộp diện vụn vào hàng xóm có diện tích lớn nhất — lặp từ nhỏ đến lớn, dừng khi hết diện vụn. */
export function gopDienVun(m: NormalizedMesh, nhanIn: Int32Array, soDien: number, minAreaFrac: number): { nhan: Int32Array; soDien: number } {
  const nhan = nhanIn.slice();
  const nT = m.triAreas.length;
  const tong = m.soLieu.dienTich || 1;
  const dt = new Float64Array(soDien);
  for (let t = 0; t < nT; t++) dt[nhan[t]] += m.triAreas[t];

  const nguong = tong * minAreaFrac;
  for (let vong = 0; vong < 8; vong++) {
    const nho = Array.from({ length: soDien }, (_, i) => i).filter((i) => dt[i] > 0 && dt[i] < nguong).sort((a, b) => dt[a] - dt[b]);
    if (!nho.length) break;
    let doiGi = false;
    for (const id of nho) {
      if (dt[id] <= 0 || dt[id] >= nguong) continue;
      const hangXom = new Map<number, number>();
      for (let t = 0; t < nT; t++) {
        if (nhan[t] !== id) continue;
        for (let e = 0; e < 3; e++) {
          const u = m.triAdj[t * 3 + e];
          if (u < 0 || nhan[u] === id) continue;
          hangXom.set(nhan[u], (hangXom.get(nhan[u]) ?? 0) + m.triAreas[u]);
        }
      }
      if (!hangXom.size) continue;
      let best = -1, bestA = -1;
      for (const [k, a] of hangXom) if (a > bestA) { bestA = a; best = k; }
      for (let t = 0; t < nT; t++) if (nhan[t] === id) nhan[t] = best;
      dt[best] += dt[id];
      dt[id] = 0;
      doiGi = true;
    }
    if (!doiGi) break;
  }
  return danhLaiSo(nhan, soDien);
}

function danhLaiSo(nhan: Int32Array, soDien: number): { nhan: Int32Array; soDien: number } {
  const map = new Map<number, number>();
  const out = new Int32Array(nhan.length);
  for (let i = 0; i < nhan.length; i++) {
    let v = map.get(nhan[i]);
    if (v === undefined) { v = map.size; map.set(nhan[i], v); }
    out[i] = v;
  }
  void soDien;
  return { nhan: out, soDien: map.size };
}

/* ══════════════════════ ③ PHÂN LOẠI DIỆN ══════════════════════ */

export type LoaiDien = 'planar' | 'cylindrical' | 'toroidal' | 'freeform';

export interface FitPlanar { normal: V3; diem: V3 }
export interface FitCylindrical { truc: V3; diem: V3; banKinh: number; cao: number; phuGocDeg: number }
export interface FitToroidal { truc: V3; tam: V3; rLon: number; rNho: number; phuGocDeg: number }

export interface KetQuaFit {
  loai: LoaiDien;
  /** RMS sai lệch (đơn vị dài của mesh) */
  rms: number;
  /** RMS / đường chéo bbox CỦA DIỆN, tính %, [T6] */
  rmsPct: number;
  thamSo: FitPlanar | FitCylindrical | FitToroidal | null;
  /** vì sao không fit được — CHỈ khi loai==='freeform' [T0] */
  lyDo?: string;
}

/** Jacobi cho ma trận đối xứng 3×3 (trị riêng tăng dần theo |vals| không đảm bảo — tự sort ở nơi dùng). */
export function eigen3(mIn: number[][]): { vals: number[]; vecs: V3[] } {
  const a = mIn.map((r) => [...r]);
  let v = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  for (let sweep = 0; sweep < 48; sweep++) {
    let off = 0;
    for (let p = 0; p < 3; p++) for (let q = p + 1; q < 3; q++) off += a[p][q] * a[p][q];
    if (off < 1e-20) break;
    for (let p = 0; p < 3; p++) for (let q = p + 1; q < 3; q++) {
      if (Math.abs(a[p][q]) < 1e-18) continue;
      const theta = (a[q][q] - a[p][p]) / (2 * a[p][q]);
      const t = (theta >= 0 ? 1 : -1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
      const c = 1 / Math.sqrt(t * t + 1);
      const s = t * c;
      for (let k = 0; k < 3; k++) { const akp = a[k][p], akq = a[k][q]; a[k][p] = c * akp - s * akq; a[k][q] = s * akp + c * akq; }
      for (let k = 0; k < 3; k++) { const apk = a[p][k], aqk = a[q][k]; a[p][k] = c * apk - s * aqk; a[q][k] = s * apk + c * aqk; }
      v = v.map((row) => { const rp = row[p], rq = row[q]; const o = [...row]; o[p] = c * rp - s * rq; o[q] = s * rp + c * rq; return o; });
    }
  }
  return { vals: [a[0][0], a[1][1], a[2][2]], vecs: [0, 1, 2].map((i) => unit3([v[0][i], v[1][i], v[2][i]])) };
}

/** PCA có trọng số: tâm + 3 trục (sắp theo trị riêng GIẢM dần: axes[0] = trục trải rộng nhất). */
export function pcaCoTrongSo(pts: Float64Array, w?: Float64Array): { tam: V3; truc: V3[]; vals: number[] } {
  const n = pts.length / 3;
  let W = 0;
  const c: V3 = [0, 0, 0];
  for (let i = 0; i < n; i++) { const wi = w ? w[i] : 1; W += wi; c[0] += pts[i * 3] * wi; c[1] += pts[i * 3 + 1] * wi; c[2] += pts[i * 3 + 2] * wi; }
  if (W <= 0) W = 1;
  c[0] /= W; c[1] /= W; c[2] /= W;
  const cov = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < n; i++) {
    const wi = w ? w[i] : 1;
    const d = [pts[i * 3] - c[0], pts[i * 3 + 1] - c[1], pts[i * 3 + 2] - c[2]];
    for (let r = 0; r < 3; r++) for (let s = r; s < 3; s++) cov[r][s] += d[r] * d[s] * wi;
  }
  for (let r = 0; r < 3; r++) for (let s = 0; s < r; s++) cov[r][s] = cov[s][r];
  const { vals, vecs } = eigen3(cov);
  const ord = [0, 1, 2].sort((a, b) => vals[b] - vals[a]);
  return { tam: c, truc: ord.map((i) => vecs[i]), vals: ord.map((i) => vals[i]) };
}

/** Fit mặt phẳng: pháp tuyến = trục PCA yếu nhất; RMS = khoảng cách điểm→mặt. */
export function fitPhang(pts: Float64Array): { fit: FitPlanar; rms: number } {
  const { tam, truc } = pcaCoTrongSo(pts);
  const n = truc[2];
  let sq = 0;
  const cnt = pts.length / 3;
  for (let i = 0; i < cnt; i++) {
    const d = dot3(sub3([pts[i * 3], pts[i * 3 + 1], pts[i * 3 + 2]], tam), n);
    sq += d * d;
  }
  return { fit: { normal: n, diem: tam }, rms: Math.sqrt(sq / Math.max(1, cnt)) };
}

/** Fit đường tròn 2D theo Kåsa (đại số, 1 lần giải 3×3) — dùng cho cả trụ và tiết diện xuyến. */
export function fitTron2D(xs: number[], ys: number[]): { cx: number; cy: number; r: number; rms: number } | null {
  const n = xs.length;
  if (n < 3) return null;
  let Sx = 0, Sy = 0, Sxx = 0, Syy = 0, Sxy = 0, Sz = 0, Sxz = 0, Syz = 0;
  for (let i = 0; i < n; i++) {
    const x = xs[i], y = ys[i], z = x * x + y * y;
    Sx += x; Sy += y; Sxx += x * x; Syy += y * y; Sxy += x * y; Sz += z; Sxz += x * z; Syz += y * z;
  }
  const A = [[Sxx, Sxy, Sx], [Sxy, Syy, Sy], [Sx, Sy, n]];
  const b = [Sxz, Syz, Sz];
  const sol = giai3x3(A, b);
  if (!sol) return null;
  const cx = sol[0] / 2, cy = sol[1] / 2;
  const rr = sol[2] + cx * cx + cy * cy;
  if (!(rr > 0)) return null;
  const r = Math.sqrt(rr);
  let sq = 0;
  for (let i = 0; i < n; i++) { const d = Math.hypot(xs[i] - cx, ys[i] - cy) - r; sq += d * d; }
  return { cx, cy, r, rms: Math.sqrt(sq / n) };
}

function giai3x3(A: number[][], b: number[]): number[] | null {
  const m = [[...A[0], b[0]], [...A[1], b[1]], [...A[2], b[2]]];
  for (let c = 0; c < 3; c++) {
    let piv = c;
    for (let r = c + 1; r < 3; r++) if (Math.abs(m[r][c]) > Math.abs(m[piv][c])) piv = r;
    if (Math.abs(m[piv][c]) < 1e-14) return null;
    [m[c], m[piv]] = [m[piv], m[c]];
    for (let r = 0; r < 3; r++) {
      if (r === c) continue;
      const f = m[r][c] / m[c][c];
      for (let k = c; k < 4; k++) m[r][k] -= f * m[c][k];
    }
  }
  return [m[0][3] / m[0][0], m[1][3] / m[1][1], m[2][3] / m[2][2]];
}

/** hai trục ⟂ với `n` (dựng khung cục bộ ổn định) */
function truVuongGoc(n: V3): [V3, V3] {
  const t: V3 = Math.abs(n[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
  const e1 = unit3(cross3(n, t));
  const e2 = unit3(cross3(n, e1));
  return [e1, e2];
}

/** Độ phủ góc (deg) của tập góc quanh vòng tròn — khoảng TRỐNG lớn nhất bị trừ ra. */
function phuGoc(goc: number[]): number {
  if (goc.length < 2) return 0;
  const g = goc.map((a) => ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)).sort((a, b) => a - b);
  let khe = g[0] + Math.PI * 2 - g[g.length - 1];
  for (let i = 1; i < g.length; i++) khe = Math.max(khe, g[i] - g[i - 1]);
  return Math.max(0, (Math.PI * 2 - khe) * 180 / Math.PI);
}

/** Fit trụ: trục ứng viên = 3 trục PCA điểm + trục yếu nhất của PCA PHÁP TUYẾN (trụ có mọi pháp
 * tuyến ⟂ trục ⇒ đây là ước lượng tốt nhất). Chiếu ⟂ trục → fit tròn Kåsa. */
export function fitTru(pts: Float64Array, normals?: Float64Array): { fit: FitCylindrical; rms: number } | null {
  const { tam, truc } = pcaCoTrongSo(pts);
  const ungVien: V3[] = [...truc];
  if (normals && normals.length >= 9) ungVien.push(pcaCoTrongSo(normals).truc[2]);
  let best: { fit: FitCylindrical; rms: number } | null = null;
  const n = pts.length / 3;
  for (const ax of ungVien) {
    const [e1, e2] = truVuongGoc(ax);
    const xs: number[] = [], ys: number[] = [];
    let tMin = Infinity, tMax = -Infinity;
    for (let i = 0; i < n; i++) {
      const d = sub3([pts[i * 3], pts[i * 3 + 1], pts[i * 3 + 2]], tam);
      xs.push(dot3(d, e1)); ys.push(dot3(d, e2));
      const t = dot3(d, ax);
      if (t < tMin) tMin = t; if (t > tMax) tMax = t;
    }
    const c = fitTron2D(xs, ys);
    if (!c) continue;
    const goc: number[] = [];
    for (let i = 0; i < n; i++) goc.push(Math.atan2(ys[i] - c.cy, xs[i] - c.cx));
    const diem: V3 = [
      tam[0] + e1[0] * c.cx + e2[0] * c.cy,
      tam[1] + e1[1] * c.cx + e2[1] * c.cy,
      tam[2] + e1[2] * c.cx + e2[2] * c.cy,
    ];
    const kq = { fit: { truc: ax, diem, banKinh: c.r, cao: tMax - tMin, phuGocDeg: phuGoc(goc) }, rms: c.rms };
    if (!best || kq.rms < best.rms) best = kq;
  }
  return best;
}

/** Fit xuyến: trục ứng viên = 3 trục PCA; toạ độ (ρ, t) quanh trục → fit tròn tiết diện Kåsa
 * ⇒ rLon = ρ tâm tiết diện, rNho = bán kính tiết diện. Phủ góc = phủ QUANH TRỤC (phiếu ≥240°). */
export function fitXuyen(pts: Float64Array): { fit: FitToroidal; rms: number } | null {
  const { tam, truc } = pcaCoTrongSo(pts);
  const n = pts.length / 3;
  let best: { fit: FitToroidal; rms: number } | null = null;
  for (const ax of truc) {
    const [e1, e2] = truVuongGoc(ax);
    const rho: number[] = [], tt: number[] = [], goc: number[] = [];
    for (let i = 0; i < n; i++) {
      const d = sub3([pts[i * 3], pts[i * 3 + 1], pts[i * 3 + 2]], tam);
      const t = dot3(d, ax);
      const a = dot3(d, e1), b = dot3(d, e2);
      rho.push(Math.hypot(a, b)); tt.push(t); goc.push(Math.atan2(b, a));
    }
    const c = fitTron2D(rho, tt);
    // XUYẾN THẬT phải là VÒNG: bán kính lớn > bán kính tiết diện. Không có chặn này thì MẶT CẦU
    // (ρ,t nằm trên tròn tâm ρ=0) cũng "fit xuyến hoàn hảo" — ép sai loại, trái [T0].
    if (!c || !(c.cx > c.r * 1.05)) continue;
    const kq = { fit: { truc: ax, tam, rLon: c.cx, rNho: c.r, phuGocDeg: phuGoc(goc) }, rms: c.rms };
    if (!best || kq.rms < best.rms) best = kq;
  }
  return best;
}

export interface PhanLoaiOpts {
  /** RMS/đường chéo bbox diện, tính % — vượt là KHÔNG nhận fit (mặc định 1%) */
  fitTolPct?: number;
  /** phủ góc tối thiểu để nhận xuyến (mặc định 240°) */
  torusPhuMin?: number;
}

/** Thử ba primitive theo thứ tự đơn giản dần: phẳng → trụ → xuyến. Không đạt ⇒ freeform + LÝ DO. */
export function phanLoaiDien(pts: Float64Array, normals: Float64Array | undefined, diagDien: number, opts: PhanLoaiOpts = {}): KetQuaFit {
  const tol = (opts.fitTolPct ?? 1) / 100;
  const pct = (r: number) => (diagDien > 0 ? (r / diagDien) * 100 : Infinity);

  const pl = fitPhang(pts);
  if (pl.rms <= diagDien * tol) return { loai: 'planar', rms: pl.rms, rmsPct: pct(pl.rms), thamSo: pl.fit };

  const cy = fitTru(pts, normals);
  if (cy && cy.rms <= diagDien * tol && cy.fit.banKinh < diagDien * 20) {
    return { loai: 'cylindrical', rms: cy.rms, rmsPct: pct(cy.rms), thamSo: cy.fit };
  }
  const to = fitXuyen(pts);
  if (to && to.rms <= diagDien * tol && to.fit.phuGocDeg >= (opts.torusPhuMin ?? 240)) {
    return { loai: 'toroidal', rms: to.rms, rmsPct: pct(to.rms), thamSo: to.fit };
  }

  const bests: Array<[string, number]> = [['phẳng', pct(pl.rms)]];
  if (cy) bests.push(['trụ', pct(cy.rms)]);
  if (to) bests.push(['xuyến', pct(to.rms)]);
  bests.sort((a, b) => a[1] - b[1]);
  const lyDo = `không primitive nào dưới ${(tol * 100).toFixed(1)}% bbox diện — tốt nhất: ${bests
    .map(([k, v]) => `${k} ${v.toFixed(2)}%`).join(' · ')}${to && to.fit.phuGocDeg < (opts.torusPhuMin ?? 240) ? ` (xuyến phủ ${to.fit.phuGocDeg.toFixed(0)}° < ngưỡng)` : ''}`;
  return { loai: 'freeform', rms: pl.rms, rmsPct: pct(pl.rms), thamSo: null, lyDo };
}

/* ══════════════════════ ④ BIÊN DIỆN = NÉT ══════════════════════ */

/**
 * Douglas-Peucker cho polyline 3D. VÒNG KÍN (điểm đầu ≡ điểm cuối) được CẮT ĐÔI tại điểm xa
 * điểm đầu nhất rồi rút gọn từng nửa — nếu không, dây cung đầu-cuối dài 0 làm mọi khoảng cách
 * bằng 0 và cả vòng bị nuốt còn 2 điểm (bẫy kinh điển của DP trên vòng kín).
 */
export function douglasPeucker3D(pts: V3[], tol: number): V3[] {
  if (pts.length < 3) return pts.slice();
  if (len3(sub3(pts[0], pts[pts.length - 1])) < 1e-9) {
    let k = 0, best = -1;
    for (let i = 1; i < pts.length - 1; i++) {
      const d = len3(sub3(pts[i], pts[0]));
      if (d > best) { best = d; k = i; }
    }
    if (k > 0) {
      const a = douglasPeucker3D(pts.slice(0, k + 1), tol);
      const b = douglasPeucker3D(pts.slice(k), tol);
      return [...a, ...b.slice(1)];
    }
  }
  const keep = new Uint8Array(pts.length);
  keep[0] = 1; keep[pts.length - 1] = 1;
  const stack: Array<[number, number]> = [[0, pts.length - 1]];
  while (stack.length) {
    const [i, j] = stack.pop()!;
    if (j <= i + 1) continue;
    const a = pts[i], b = pts[j];
    const ab = sub3(b, a);
    const L = len3(ab) || 1e-12;
    let bestD = -1, bestK = -1;
    for (let k = i + 1; k < j; k++) {
      const ap = sub3(pts[k], a);
      const d = len3(cross3(ap, ab)) / L;
      if (d > bestD) { bestD = d; bestK = k; }
    }
    if (bestD > tol && bestK > 0) { keep[bestK] = 1; stack.push([i, bestK], [bestK, j]); }
  }
  return pts.filter((_, i) => keep[i] === 1);
}

export interface BienDienKetQua {
  /** polyline theo từng diện: `theoDien[id] = [polyline, …]` */
  theoDien: V3[][][];
  soCanhDacTrung: number;
  soPolyline: number;
  soDiemTruoc: number;
  soDiemSau: number;
}

/**
 * Cạnh đặc trưng = cạnh mà hai tam giác kề thuộc HAI diện khác nhau, hoặc cạnh hở (1 tam giác).
 * Nối thành chuỗi trong từng diện rồi đơn giản hoá. Đây là NÉT của bước ⑥.
 */
export function bienDien(m: NormalizedMesh, nhan: Int32Array, soDien: number, dpTolFrac = 0.005): BienDienKetQua {
  const NP = m.soLieu.lopViTri;
  // gom cạnh đặc trưng theo diện
  const canhTheoDien: Array<Map<number, [number, number]>> = Array.from({ length: soDien }, () => new Map());
  const nT = m.triAreas.length;
  let soCanh = 0;
  const seen = new Set<number>();
  for (let t = 0; t < nT; t++) {
    const l0 = m.lopViTri[m.indices[t * 3]], l1 = m.lopViTri[m.indices[t * 3 + 1]], l2 = m.lopViTri[m.indices[t * 3 + 2]];
    const pairs: Array<[number, number]> = [[l0, l1], [l1, l2], [l2, l0]];
    for (let e = 0; e < 3; e++) {
      const u = m.triAdj[t * 3 + e];
      const khac = u < 0 || nhan[u] !== nhan[t];
      if (!khac) continue;
      const [a, b] = pairs[e];
      const key = (a < b ? a * NP + b : b * NP + a);
      if (!seen.has(key)) { seen.add(key); soCanh++; }
      canhTheoDien[nhan[t]].set(key, [a, b]);
    }
  }

  const tol = m.diag * dpTolFrac;
  const viTri = new Float64Array(NP * 3);
  const daCo = new Uint8Array(NP);
  for (let v = 0; v < m.lopViTri.length; v++) {
    const l = m.lopViTri[v];
    if (daCo[l]) continue;
    daCo[l] = 1;
    viTri[l * 3] = m.positions[v * 3]; viTri[l * 3 + 1] = m.positions[v * 3 + 1]; viTri[l * 3 + 2] = m.positions[v * 3 + 2];
  }
  const P = (l: number): V3 => [viTri[l * 3], viTri[l * 3 + 1], viTri[l * 3 + 2]];

  const theoDien: V3[][][] = [];
  let soPoly = 0, truoc = 0, sau = 0;
  for (let d = 0; d < soDien; d++) {
    const adj = new Map<number, number[]>();
    const conLai = new Set<number>();
    for (const [key, [a, b]] of canhTheoDien[d]) {
      conLai.add(key);
      if (!adj.has(a)) adj.set(a, []);
      if (!adj.has(b)) adj.set(b, []);
      adj.get(a)!.push(key); adj.get(b)!.push(key);
    }
    const canhCua = canhTheoDien[d];
    const polys: V3[][] = [];
    while (conLai.size) {
      const start = conLai.values().next().value as number;
      conLai.delete(start);
      const [a0, b0] = canhCua.get(start)!;
      const chain: number[] = [a0, b0];
      // đi tiếp hai đầu
      for (const huong of [1, 0]) {
        for (;;) {
          const dau = huong ? chain[chain.length - 1] : chain[0];
          const ke = (adj.get(dau) ?? []).find((k) => conLai.has(k));
          if (ke === undefined) break;
          conLai.delete(ke);
          const [x, y] = canhCua.get(ke)!;
          const tiep = x === dau ? y : x;
          if (huong) chain.push(tiep); else chain.unshift(tiep);
          if (tiep === (huong ? chain[0] : chain[chain.length - 1])) break;
        }
      }
      const pts = chain.map(P);
      truoc += pts.length;
      const gon = douglasPeucker3D(pts, tol);
      sau += gon.length;
      if (gon.length >= 2) { polys.push(gon); soPoly++; }
    }
    theoDien.push(polys);
  }
  return { theoDien, soCanhDacTrung: soCanh, soPolyline: soPoly, soDiemTruoc: truoc, soDiemSau: sau };
}

/* ══════════════════════ ⑤ HỆ GIÁ TRỊ ĐỊNH VỊ + CHIA LƯỚI ══════════════════════ */

export interface FrameCucBo {
  /** gốc = trọng tâm diện */
  goc: V3;
  /** e1,e2 = 2 trục PCA trải rộng nhất · e3 = pháp tuyến (hoặc trục primitive) */
  e1: V3; e2: V3; e3: V3;
  /** bbox trong hệ trục cục bộ */
  min: V3; max: V3;
  /** kích thước u×v×w */
  co: V3;
}

export interface LuoiDien {
  kieu: 'phang' | 'tru' | 'khong';
  nu: number;
  nv: number;
  /** bước lưới theo đơn vị mesh (mm nếu đã scale) */
  buoc: number;
  /** số ô lưới = nu×nv (0 khi kiểu 'khong') */
  soO: number;
}

export function frameCucBo(pts: Float64Array, phapTuyen?: V3): FrameCucBo {
  const { tam, truc } = pcaCoTrongSo(pts);
  let e3 = phapTuyen ? unit3(phapTuyen) : truc[2];
  // dựng e1,e2 ⟂ e3 nhưng bám hướng PCA để bbox cục bộ chặt
  let e1 = unit3(sub3(truc[0], [e3[0] * dot3(truc[0], e3), e3[1] * dot3(truc[0], e3), e3[2] * dot3(truc[0], e3)]));
  if (!isFinite(e1[0]) || len3(e1) < 0.5) [e1] = truVuongGoc(e3);
  const e2 = unit3(cross3(e3, e1));
  e3 = unit3(cross3(e1, e2));
  const mn: V3 = [Infinity, Infinity, Infinity];
  const mx: V3 = [-Infinity, -Infinity, -Infinity];
  const n = pts.length / 3;
  for (let i = 0; i < n; i++) {
    const d = sub3([pts[i * 3], pts[i * 3 + 1], pts[i * 3 + 2]], tam);
    const c: V3 = [dot3(d, e1), dot3(d, e2), dot3(d, e3)];
    for (let k = 0; k < 3; k++) { if (c[k] < mn[k]) mn[k] = c[k]; if (c[k] > mx[k]) mx[k] = c[k]; }
  }
  return { goc: tam, e1, e2, e3, min: mn, max: mx, co: [mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]] };
}

/**
 * Lưới CÓ CẤU TRÚC: diện phẳng chia theo (u,v) của frame cục bộ · diện trụ chia theo (dọc trục ×
 * cung) · freeform/xuyến GIỮ tam giác (kiểu 'khong') nhưng vẫn có frame + bbox để định vị.
 */
export function chiaLuoi(loai: LoaiDien, frame: FrameCucBo, thamSo: KetQuaFit['thamSo'], buoc: number): LuoiDien {
  const clamp = (x: number) => Math.max(1, Math.min(64, Math.round(x)));
  if (loai === 'planar') {
    const nu = clamp(frame.co[0] / buoc), nv = clamp(frame.co[1] / buoc);
    return { kieu: 'phang', nu, nv, buoc, soO: nu * nv };
  }
  if (loai === 'cylindrical' && thamSo && 'banKinh' in thamSo) {
    const cung = (thamSo.phuGocDeg / 180) * Math.PI * thamSo.banKinh;
    const nu = clamp(thamSo.cao / buoc), nv = clamp(cung / buoc);
    return { kieu: 'tru', nu, nv, buoc, soO: nu * nv };
  }
  return { kieu: 'khong', nu: 0, nv: 0, buoc, soO: 0 };
}

/* ══════════════════════ ⑥ NÉT → MÀU → VẬT LIỆU ══════════════════════ */

export interface AtlasRgba {
  width: number;
  height: number;
  data: Uint8Array | Uint8ClampedArray;
  /** số kênh/pixel (mặc định 4) */
  channels?: number;
}

export interface MauDien {
  hex: string;
  rgb: V3;
  /** độ lệch trung bình quanh trung vị (0–255) — cao = diện nhiều màu, màu đại diện kém tin */
  doLech: number;
  soMau: number;
}

const hex2 = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
export const rgbToHex = (c: V3): string => `#${hex2(c[0])}${hex2(c[1])}${hex2(c[2])}`;
export function hexToRgb(hex: string): V3 {
  const h = hex.replace('#', '');
  const s = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}

function texel(a: AtlasRgba, u: number, v: number): V3 {
  const ch = a.channels ?? 4;
  const x = Math.min(a.width - 1, Math.max(0, Math.floor((u - Math.floor(u)) * a.width)));
  const y = Math.min(a.height - 1, Math.max(0, Math.floor((v - Math.floor(v)) * a.height)));
  const i = (y * a.width + x) * ch;
  return [a.data[i], a.data[i + 1], a.data[i + 2]];
}

/**
 * MÀU của một diện = TRUNG VỊ từng kênh các texel mà tam giác của diện tham chiếu qua UV.
 * Mỗi tam giác lấy 4 mẫu: trọng tâm + 3 điểm co 20% về trọng tâm (tránh viền/seam của atlas).
 * Sau đó BỎ 10% mẫu xa trung vị nhất rồi tính lại — "bỏ 10% ngoài rìa" của phiếu.
 * Quy ước UV theo glTF: v=0 là HÀNG TRÊN ảnh.
 */
export function mauDien(m: NormalizedMesh, tris: number[], atlas: AtlasRgba, trimPct = 10): MauDien | null {
  if (!m.uvs || !tris.length) return null;
  const mau: V3[] = [];
  /** kéo 35% từ mỗi đỉnh về trọng tâm — mẫu nằm HẲN trong lòng tam giác, không dính viền atlas */
  const CO = 0.35;
  for (const t of tris) {
    const ia = m.indices[t * 3], ib = m.indices[t * 3 + 1], ic = m.indices[t * 3 + 2];
    const uvs: Array<[number, number]> = [
      [m.uvs[ia * 2], m.uvs[ia * 2 + 1]],
      [m.uvs[ib * 2], m.uvs[ib * 2 + 1]],
      [m.uvs[ic * 2], m.uvs[ic * 2 + 1]],
    ];
    const cu = (uvs[0][0] + uvs[1][0] + uvs[2][0]) / 3, cv = (uvs[0][1] + uvs[1][1] + uvs[2][1]) / 3;
    mau.push(texel(atlas, cu, cv));
    for (const p of uvs) mau.push(texel(atlas, p[0] + (cu - p[0]) * CO, p[1] + (cv - p[1]) * CO));
  }
  if (!mau.length) return null;
  const med = (arr: V3[]): V3 => [0, 1, 2].map((k) => {
    const s = arr.map((c) => c[k]).sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)];
  }) as V3;
  let m0 = med(mau);
  const dist = (c: V3) => Math.hypot(c[0] - m0[0], c[1] - m0[1], c[2] - m0[2]);
  const giu = mau.slice().sort((a, b) => dist(a) - dist(b)).slice(0, Math.max(1, Math.round(mau.length * (1 - trimPct / 100))));
  m0 = med(giu);
  const doLech = giu.reduce((s, c) => s + dist(c), 0) / giu.length;
  return { hex: rgbToHex(m0), rgb: m0, doLech, soMau: mau.length };
}

/** RGB → HSV (h 0–360, s/v 0–1) — dùng cho luật suy HỌ vật liệu. */
export function rgbToHsv(c: V3): { h: number; s: number; v: number } {
  const r = c[0] / 255, g = c[1] / 255, b = c[2] / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d > 1e-9) {
    if (mx === r) h = 60 * (((g - b) / d) % 6);
    else if (mx === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
  }
  return { h: (h + 360) % 360, s: mx > 0 ? d / mx : 0, v: mx };
}

export type HoVatLieu = 'gỗ' | 'kim loại' | 'vải/da' | 'sơn/nhựa' | 'đá' | 'không rõ';

export interface VatLieuSuy {
  /** họ vật liệu SUY từ màu + hình học — luôn là suy đoán, không phải đo */
  ho: HoVatLieu;
  /** chuỗi danh mục đưa vào `inferPbrFromCategory` (kho quy tắc SẴN của IF) */
  danhMuc: string;
  /** preset MÀU gần nhất trong `lib/cad/materials` MATERIALS + khoảng cách RGB */
  presetGanNhat: string | null;
  deltaRgb: number;
  /** matId thật (⚠️ SUPERSEDED 19/08: nay là IF-owned immutable UUID, không phải ProductSpec.sku
   * — Hoà chốt hòa giải Decision Conflict; xem lib/materials/matid-identity.ts + frontier
   * material-matid-uuid) nếu preset có khai — hôm nay chưa preset nào khai ⇒ null */
  matId: string | null;
  pbr: MaterialPbr;
  /** LUÔN true — module này không có đường trả "chắc chắn" [T0] */
  inferred: true;
  lyDo: string;
}

/**
 * Suy VẬT LIỆU từ MÀU + loại hình học. Ba đầu ra tách bạch, cố ý KHÔNG trộn:
 *  · `ho` — suy theo luật màu/hình học viết thẳng ở đây (bảng nhỏ, đọc được, sửa được)
 *  · `presetGanNhat` — CHỈ so MÀU với kho preset 2D sẵn có (`MATERIALS`); kho đó hiện toàn vật
 *    liệu SÀN/TƯỜNG nên với đồ rời nó chỉ là "màu gần nhất", không phải "đúng vật liệu"
 *  · `matId` — mã nghiệp vụ thật; preset nào chưa khai `matId` thì trả null, KHÔNG bịa
 */
export function suyVatLieu(hex: string, loai: LoaiDien, opt: { doLech?: number } = {}): VatLieuSuy {
  const rgb = hexToRgb(hex);
  const { h, s, v } = rgbToHsv(rgb);
  let ho: HoVatLieu = 'không rõ';
  let danhMuc = '';
  let lyDo = `HSV(${h.toFixed(0)}°, ${(s * 100).toFixed(0)}%, ${(v * 100).toFixed(0)}%)`;

  if (s < 0.12 && v > 0.82) { ho = 'sơn/nhựa'; danhMuc = 'sơn'; lyDo += ' — gần trắng, bão hoà thấp'; }
  else if (s < 0.18 && v >= 0.35 && v <= 0.82 && (loai === 'cylindrical' || loai === 'toroidal')) {
    ho = 'kim loại'; danhMuc = 'kim loại'; lyDo += ' — xám trung tính trên mặt tròn xoay';
  } else if (h >= 35 && h <= 62 && s >= 0.28 && v >= 0.45) { ho = 'kim loại'; danhMuc = 'kim loại'; lyDo += ' — vàng ánh kim (đồng thau)'; }
  else if (h >= 12 && h <= 45 && s >= 0.18 && v >= 0.18) { ho = 'gỗ'; danhMuc = 'gỗ tự nhiên'; lyDo += ' — tông nâu/cam vân gỗ'; }
  else if (v < 0.2) { ho = 'vải/da'; danhMuc = 'da that'; lyDo += ' — rất tối, thường là da/vải sẫm'; }
  else if (s < 0.2) { ho = 'sơn/nhựa'; danhMuc = 'sơn'; lyDo += ' — xám phi kim'; }
  else { ho = 'vải/da'; danhMuc = 'vai'; lyDo += ' — màu có sắc, không thuộc dải gỗ/kim loại'; }

  if ((opt.doLech ?? 0) > 40) lyDo += ` · CẢNH BÁO màu tản (độ lệch ${(opt.doLech ?? 0).toFixed(0)}/255)`;

  let best: MaterialDef | null = null;
  let bestD = Infinity;
  for (const p of MATERIALS) {
    const c = hexToRgb(p.color);
    const d = Math.hypot(c[0] - rgb[0], c[1] - rgb[1], c[2] - rgb[2]);
    if (d < bestD) { bestD = d; best = p; }
  }
  const pbrGoi = inferPbrFromCategory(danhMuc);
  return {
    ho,
    danhMuc,
    presetGanNhat: best ? best.id : null,
    deltaRgb: Math.round(bestD),
    matId: best?.matId ?? null,
    pbr: { baseColor: hex, roughness: pbrGoi.roughness, metallic: pbrGoi.metallic },
    inferred: true,
    lyDo,
  };
}

/* ══════════════════════ ĐỒ THỊ DIỆN — pipeline đủ ══════════════════════ */

export interface Dien {
  id: number;
  loai: LoaiDien;
  soTri: number;
  dienTich: number;
  dienTichPct: number;
  rms: number;
  rmsPct: number;
  thamSo: KetQuaFit['thamSo'];
  lyDo?: string;
  frame: FrameCucBo;
  luoi: LuoiDien;
  /** polyline biên (đã Douglas-Peucker) */
  bien: V3[][];
  mauHex?: string;
  doLechMau?: number;
  vatLieu?: VatLieuSuy;
  /** id các diện kề (chung ≥1 cạnh) */
  keBen: number[];
  /**
   * NGHI VẤN "bóng sàn": mesh TRELLIS nướng cả vệt bóng dưới chân vật thành một tấm phẳng nằm
   * ngang sát đáy bbox (đo trên ghế Lincoln: 2 tấm ~890×880mm chiếm 32,4% tổng diện tích).
   * CHỈ GẮN CỜ, KHÔNG tự xoá — phía gọi quyết định (đúng nguyên tắc khai thật, không ép [T0]).
   */
  nghiVanBongSan?: boolean;
}

export interface CauKienVatLieu {
  id: number;
  dien: number[];
  ho: HoVatLieu;
  mauHex: string;
  dienTich: number;
  dienTichPct: number;
  matId: string | null;
  presetGanNhat: string | null;
}

export interface DoThiDien {
  mesh: NormalizedMesh;
  nhan: Int32Array;
  dien: Dien[];
  cauKien: CauKienVatLieu[];
  tomTat: {
    triangles: number;
    soDien: number;
    theoLoai: Record<LoaiDien, number>;
    dienTichTheoLoai: Record<LoaiDien, number>;
    soCanhDacTrung: number;
    soPolyline: number;
    soDiemBienTruoc: number;
    soDiemBienSau: number;
    soLanChiaLai: number;
    /** diện bị nghi là bóng sàn nướng vào mesh (xem `Dien.nghiVanBongSan`) */
    soDienBongSan: number;
    dienTichBongSanPct: number;
    coAtlas: boolean;
    thamSo: Required<Omit<DoThiDienOpts, 'atlas' | 'hMm'>> & { hMm?: number };
  };
}

export interface DoThiDienOpts extends PhanVungOpts, PhanLoaiOpts {
  hMm?: number;
  atlas?: AtlasRgba;
  /** dung sai Douglas-Peucker theo tỉ lệ đường chéo bbox (mặc định 0,5%) */
  dpTolFrac?: number;
  /** bước lưới theo tỉ lệ đường chéo bbox (mặc định 5%) */
  gridStepFrac?: number;
  /** diện freeform lớn hơn tỉ lệ này thì CHIA ĐÔI theo pháp tuyến rồi fit lại (mặc định 2%) */
  splitMinFrac?: number;
  /** độ sâu chia tối đa (mặc định 3 ⇒ tối đa 8 mảnh/vùng gốc) */
  splitMaxDepth?: number;
  /** ΔRGB tối đa để 2 diện kề GỘP thành 1 cấu kiện vật liệu (mặc định 18) */
  gopDeltaRgb?: number;
}

/** Chia đôi một diện theo trục biến thiên pháp tuyến mạnh nhất, rồi tách thành phần liên thông. */
function chiaDoiDien(m: NormalizedMesh, tris: number[]): number[][] | null {
  if (tris.length < 8) return null;
  const nr = new Float64Array(tris.length * 3);
  const w = new Float64Array(tris.length);
  for (let i = 0; i < tris.length; i++) {
    nr[i * 3] = m.triNormals[tris[i] * 3]; nr[i * 3 + 1] = m.triNormals[tris[i] * 3 + 1]; nr[i * 3 + 2] = m.triNormals[tris[i] * 3 + 2];
    w[i] = m.triAreas[tris[i]];
  }
  const { tam, truc } = pcaCoTrongSo(nr, w);
  const ax = truc[0];
  const proj = tris.map((_, i) => dot3(sub3([nr[i * 3], nr[i * 3 + 1], nr[i * 3 + 2]], tam), ax));
  const sorted = [...proj].sort((a, b) => a - b);
  const mid = sorted[Math.floor(sorted.length / 2)];
  const nhom = new Map<number, number>();
  tris.forEach((t, i) => nhom.set(t, proj[i] <= mid ? 0 : 1));
  // thành phần liên thông trong từng nhãn
  const trongDien = new Set(tris);
  const daXet = new Set<number>();
  const out: number[][] = [];
  for (const t0 of tris) {
    if (daXet.has(t0)) continue;
    const lab = nhom.get(t0)!;
    const comp: number[] = [];
    const st = [t0];
    daXet.add(t0);
    while (st.length) {
      const t = st.pop()!;
      comp.push(t);
      for (let e = 0; e < 3; e++) {
        const u = m.triAdj[t * 3 + e];
        if (u < 0 || daXet.has(u) || !trongDien.has(u) || nhom.get(u) !== lab) continue;
        daXet.add(u); st.push(u);
      }
    }
    out.push(comp);
  }
  if (out.length < 2) return null;

  // Chia đôi theo pháp tuyến hay đẻ ra MẢNH VỤN (một nhãn vỡ thành chục thành phần rời). Gộp
  // mảnh < `vunFrac` diện tích cha vào thành phần KỀ có diện tích lớn nhất — nếu không, mỗi vòng
  // chia lại nhân số diện lên hàng chục lần (đo: 25° cho 564 diện, phần lớn là vụn).
  const dtCua = (c: number[]) => c.reduce((s, t) => s + m.triAreas[t], 0);
  const dtCha = dtCua(tris);
  const vunFrac = 0.08;
  const idCua = new Map<number, number>();
  out.forEach((c, i) => c.forEach((t) => idCua.set(t, i)));
  const song = out.map((c) => c.slice());
  for (let vong = 0; vong < 6; vong++) {
    const nho = song.map((c, i) => [i, dtCua(c)] as const).filter(([, a]) => a > 0 && a < dtCha * vunFrac).sort((a, b) => a[1] - b[1]);
    if (!nho.length || song.filter((c) => c.length).length <= 1) break;
    let doi = false;
    for (const [i] of nho) {
      if (!song[i].length) continue;
      const hx = new Map<number, number>();
      for (const t of song[i]) for (let e = 0; e < 3; e++) {
        const u = m.triAdj[t * 3 + e];
        if (u < 0 || !idCua.has(u)) continue;
        const j = idCua.get(u)!;
        if (j === i || !song[j].length) continue;
        hx.set(j, (hx.get(j) ?? 0) + m.triAreas[u]);
      }
      if (!hx.size) continue;
      let best = -1, bestA = -1;
      for (const [k, a] of hx) if (a > bestA) { bestA = a; best = k; }
      for (const t of song[i]) idCua.set(t, best);
      song[best].push(...song[i]);
      song[i] = [];
      doi = true;
    }
    if (!doi) break;
  }
  const cuoi = song.filter((c) => c.length);
  return cuoi.length >= 2 ? cuoi : null;
}

function ptsCuaDien(m: NormalizedMesh, tris: number[]): { pts: Float64Array; nrm: Float64Array; diag: number; dienTich: number } {
  const set = new Set<number>();
  for (const t of tris) for (let k = 0; k < 3; k++) set.add(m.indices[t * 3 + k]);
  const pts = new Float64Array(set.size * 3);
  let i = 0;
  const mn: V3 = [Infinity, Infinity, Infinity], mx: V3 = [-Infinity, -Infinity, -Infinity];
  for (const v of set) {
    for (let k = 0; k < 3; k++) {
      const x = m.positions[v * 3 + k];
      pts[i * 3 + k] = x;
      if (x < mn[k]) mn[k] = x; if (x > mx[k]) mx[k] = x;
    }
    i++;
  }
  const nrm = new Float64Array(tris.length * 3);
  let dt = 0;
  for (let j = 0; j < tris.length; j++) {
    nrm[j * 3] = m.triNormals[tris[j] * 3]; nrm[j * 3 + 1] = m.triNormals[tris[j] * 3 + 1]; nrm[j * 3 + 2] = m.triNormals[tris[j] * 3 + 2];
    dt += m.triAreas[tris[j]];
  }
  return { pts, nrm, diag: len3(sub3(mx, mn)), dienTich: dt };
}

/** Pipeline đủ ①→⑥. Atlas không đưa ⇒ bỏ bước MÀU/VẬT LIỆU và khai thật `coAtlas:false`. */
export function xayDoThiDien(raw: RawMesh, opts: DoThiDienOpts = {}): DoThiDien {
  const o = {
    angleDeg: opts.angleDeg ?? 15,
    minAreaFrac: opts.minAreaFrac ?? 0.003,
    fitTolPct: opts.fitTolPct ?? 1,
    torusPhuMin: opts.torusPhuMin ?? 240,
    dpTolFrac: opts.dpTolFrac ?? 0.005,
    gridStepFrac: opts.gridStepFrac ?? 0.05,
    splitMinFrac: opts.splitMinFrac ?? 0.02,
    splitMaxDepth: opts.splitMaxDepth ?? 3,
    gopDeltaRgb: opts.gopDeltaRgb ?? 18,
  };
  const m = chuanHoaMesh(raw, { hMm: opts.hMm });
  const vung = phanVungTheoDien(m, { angleDeg: o.angleDeg, minAreaFrac: o.minAreaFrac });

  // gom tam giác theo nhãn
  let nhomTris: number[][] = Array.from({ length: vung.soDien }, () => []);
  for (let t = 0; t < m.triAreas.length; t++) nhomTris[vung.nhan[t]].push(t);

  // ③ fit + chia lại diện freeform lớn
  const tong = m.soLieu.dienTich || 1;
  const ketQua: Array<{ tris: number[]; fit: KetQuaFit }> = [];
  let soLanChiaLai = 0;
  const hangDoi: Array<{ tris: number[]; depth: number }> = nhomTris.map((tris) => ({ tris, depth: 0 }));
  while (hangDoi.length) {
    const { tris, depth } = hangDoi.pop()!;
    if (!tris.length) continue;
    const g = ptsCuaDien(m, tris);
    const fit = phanLoaiDien(g.pts, g.nrm, g.diag, { fitTolPct: o.fitTolPct, torusPhuMin: o.torusPhuMin });
    if (fit.loai === 'freeform' && depth < o.splitMaxDepth && g.dienTich > tong * o.splitMinFrac) {
      const con = chiaDoiDien(m, tris);
      if (con && con.length >= 2) {
        soLanChiaLai++;
        for (const c of con) hangDoi.push({ tris: c, depth: depth + 1 });
        continue;
      }
    }
    ketQua.push({ tris, fit });
  }

  // nhãn lại theo thứ tự diện tích giảm dần (diện lớn = id nhỏ, dễ đọc bảng)
  ketQua.sort((a, b) => {
    const da = a.tris.reduce((s, t) => s + m.triAreas[t], 0);
    const db = b.tris.reduce((s, t) => s + m.triAreas[t], 0);
    return db - da;
  });
  const nhan = new Int32Array(m.triAreas.length).fill(-1);
  ketQua.forEach((k, i) => k.tris.forEach((t) => { nhan[t] = i; }));
  nhomTris = ketQua.map((k) => k.tris);
  const soDien = ketQua.length;

  // ④ biên diện
  const bien = bienDien(m, nhan, soDien, o.dpTolFrac);

  // kề bên
  const keBen: Set<number>[] = Array.from({ length: soDien }, () => new Set<number>());
  for (let t = 0; t < m.triAreas.length; t++) {
    for (let e = 0; e < 3; e++) {
      const u = m.triAdj[t * 3 + e];
      if (u < 0 || nhan[u] === nhan[t]) continue;
      keBen[nhan[t]].add(nhan[u]);
    }
  }

  // ⑤⑥
  const buoc = m.diag * o.gridStepFrac;
  const yMin = m.bboxMin[1];
  const dien: Dien[] = ketQua.map((k, i) => {
    const g = ptsCuaDien(m, k.tris);
    const pn = k.fit.loai === 'planar' && k.fit.thamSo && 'normal' in k.fit.thamSo ? k.fit.thamSo.normal
      : k.fit.loai === 'cylindrical' && k.fit.thamSo && 'truc' in k.fit.thamSo ? k.fit.thamSo.truc : undefined;
    const frame = frameCucBo(g.pts, pn);
    const luoi = chiaLuoi(k.fit.loai, frame, k.fit.thamSo, buoc);
    const mau = opts.atlas ? mauDien(m, k.tris, opts.atlas) : null;
    return {
      id: i,
      loai: k.fit.loai,
      soTri: k.tris.length,
      dienTich: g.dienTich,
      dienTichPct: (g.dienTich / tong) * 100,
      rms: k.fit.rms,
      rmsPct: k.fit.rmsPct,
      thamSo: k.fit.thamSo,
      lyDo: k.fit.lyDo,
      frame,
      luoi,
      bien: bien.theoDien[i] ?? [],
      mauHex: mau?.hex,
      doLechMau: mau?.doLech,
      vatLieu: mau ? suyVatLieu(mau.hex, k.fit.loai, { doLech: mau.doLech }) : undefined,
      keBen: [...keBen[i]].sort((a, b) => a - b),
      nghiVanBongSan: k.fit.loai === 'planar'
        && !!k.fit.thamSo && 'normal' in k.fit.thamSo && Math.abs(k.fit.thamSo.normal[1]) > 0.95
        && frame.goc[1] - yMin < m.diag * 0.02
        && g.dienTich > tong * 0.05,
    };
  });

  // gộp cấu kiện vật liệu: union-find trên diện KỀ NHAU, cùng họ, ΔRGB nhỏ
  const cha = Array.from({ length: soDien }, (_, i) => i);
  const find = (x: number): number => (cha[x] === x ? x : (cha[x] = find(cha[x])));
  for (const d of dien) {
    if (!d.vatLieu || !d.mauHex) continue;
    for (const j of d.keBen) {
      const e = dien[j];
      if (!e.vatLieu || !e.mauHex) continue;
      if (e.vatLieu.ho !== d.vatLieu.ho) continue;
      const a = hexToRgb(d.mauHex), b = hexToRgb(e.mauHex);
      if (Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) > o.gopDeltaRgb) continue;
      const ra = find(d.id), rb = find(e.id);
      if (ra !== rb) cha[ra] = rb;
    }
  }
  const cum = new Map<number, number[]>();
  for (const d of dien) {
    if (!d.vatLieu) continue;
    const r = find(d.id);
    if (!cum.has(r)) cum.set(r, []);
    cum.get(r)!.push(d.id);
  }
  const cauKien: CauKienVatLieu[] = [...cum.values()]
    .map((ids, i) => {
      const dt = ids.reduce((s, id) => s + dien[id].dienTich, 0);
      const lon = ids.slice().sort((a, b) => dien[b].dienTich - dien[a].dienTich)[0];
      return {
        id: i,
        dien: ids.sort((a, b) => a - b),
        ho: dien[lon].vatLieu!.ho,
        mauHex: dien[lon].mauHex!,
        dienTich: dt,
        dienTichPct: (dt / tong) * 100,
        matId: dien[lon].vatLieu!.matId,
        presetGanNhat: dien[lon].vatLieu!.presetGanNhat,
      };
    })
    .sort((a, b) => b.dienTich - a.dienTich)
    .map((c, i) => ({ ...c, id: i }));

  const theoLoai: Record<LoaiDien, number> = { planar: 0, cylindrical: 0, toroidal: 0, freeform: 0 };
  const dienTichTheoLoai: Record<LoaiDien, number> = { planar: 0, cylindrical: 0, toroidal: 0, freeform: 0 };
  for (const d of dien) { theoLoai[d.loai]++; dienTichTheoLoai[d.loai] += d.dienTich; }

  return {
    mesh: m,
    nhan,
    dien,
    cauKien,
    tomTat: {
      triangles: m.soLieu.triRa,
      soDien,
      theoLoai,
      dienTichTheoLoai,
      soCanhDacTrung: bien.soCanhDacTrung,
      soPolyline: bien.soPolyline,
      soDiemBienTruoc: bien.soDiemTruoc,
      soDiemBienSau: bien.soDiemSau,
      soLanChiaLai,
      soDienBongSan: dien.filter((d) => d.nghiVanBongSan).length,
      dienTichBongSanPct: dien.filter((d) => d.nghiVanBongSan).reduce((s, d) => s + d.dienTichPct, 0),
      coAtlas: !!opts.atlas,
      thamSo: { ...o, hMm: opts.hMm },
    },
  };
}

/* ══════════════════════ XUẤT: SVG wireframe · OBJ theo diện ══════════════════════ */

export type Chieu = 'dung' | 'canh' | 'bang';

/** Chiếu trực giao 3D → 2D (Y-up): đứng = nhìn theo −Z (XY) · cạnh = nhìn theo −X (ZY) · bằng = nhìn từ trên (XZ). */
export function chieuTrucGiao(p: V3, view: Chieu): [number, number] {
  if (view === 'dung') return [p[0], -p[1]];
  if (view === 'canh') return [p[2], -p[1]];
  return [p[0], p[2]];
}

const MAU_LOAI: Record<LoaiDien, string> = {
  planar: '#2f6fd0',
  cylindrical: '#1f9e6b',
  toroidal: '#c2760a',
  freeform: '#8a8f98',
};

/**
 * SVG 3 hình chiếu của NÉT BIÊN DIỆN — để soi bằng MẮT (nghiệm thu phiếu: phải đọc ra hình ghế,
 * không rối như point cloud). Màu nét theo LOẠI diện, không phải theo màu vật liệu.
 */
export function svgWireframe(g: DoThiDien, opts: { rong?: number; theoLoai?: boolean; strokeW?: number; boBongSan?: boolean } = {}): string {
  const W = opts.rong ?? 480;
  const veDien = opts.boBongSan ? g.dien.filter((d) => !d.nghiVanBongSan) : g.dien;
  const views: Chieu[] = ['dung', 'canh', 'bang'];
  const nhan: Record<Chieu, string> = { dung: 'ĐỨNG (nhìn −Z)', canh: 'CẠNH (nhìn −X)', bang: 'BẰNG (nhìn từ trên)' };
  const parts: string[] = [];
  let X = 0;
  let Hmax = 0;
  const pad = 24;
  const blocks: Array<{ x: number; w: number; h: number; body: string; ten: string }> = [];
  for (const v of views) {
    let mnx = Infinity, mny = Infinity, mxx = -Infinity, mxy = -Infinity;
    for (const d of veDien) for (const poly of d.bien) for (const p of poly) {
      const [x, y] = chieuTrucGiao(p, v);
      if (x < mnx) mnx = x; if (x > mxx) mxx = x;
      if (y < mny) mny = y; if (y > mxy) mxy = y;
    }
    const bw = Math.max(1e-6, mxx - mnx), bh = Math.max(1e-6, mxy - mny);
    const s = (W - pad * 2) / Math.max(bw, bh);
    const h = bh * s + pad * 2;
    const body = veDien.map((d) => {
      const col = opts.theoLoai === false ? (d.mauHex ?? '#333') : MAU_LOAI[d.loai];
      const paths = d.bien.map((poly) => 'M' + poly.map((p) => {
        const [x, y] = chieuTrucGiao(p, v);
        return `${((x - mnx) * s + pad).toFixed(1)},${((y - mny) * s + pad).toFixed(1)}`;
      }).join('L')).join(' ');
      return paths ? `<path d="${paths}" fill="none" stroke="${col}" stroke-width="${opts.strokeW ?? 0.8}" stroke-linejoin="round"/>` : '';
    }).join('');
    blocks.push({ x: X, w: W, h, body, ten: nhan[v] });
    X += W;
    Hmax = Math.max(Hmax, h);
  }
  for (const b of blocks) {
    parts.push(`<g transform="translate(${b.x},0)"><rect x="0" y="0" width="${b.w}" height="${Hmax}" fill="none" stroke="#ddd"/>` +
      `<text x="${pad}" y="16" font-family="monospace" font-size="11" fill="#666">${b.ten}</text>${b.body}</g>`);
  }
  const legend = (['planar', 'cylindrical', 'toroidal', 'freeform'] as LoaiDien[])
    .map((k, i) => `<rect x="${8 + i * 110}" y="${Hmax + 8}" width="10" height="10" fill="${MAU_LOAI[k]}"/>` +
      `<text x="${22 + i * 110}" y="${Hmax + 17}" font-family="monospace" font-size="10" fill="#444">${k} (${g.tomTat.theoLoai[k]})</text>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${X}" height="${Hmax + 28}" viewBox="0 0 ${X} ${Hmax + 28}">` +
    `<rect width="100%" height="100%" fill="#fff"/>${parts.join('')}${legend}</svg>`;
}

/** OBJ nhóm theo DIỆN + MTL màu theo diện (màu atlas nếu có, không thì màu theo loại). */
export function objTheoDien(g: DoThiDien, tenMtl = 'lincoln-dien.mtl'): { obj: string; mtl: string } {
  const m = g.mesh;
  const obj: string[] = [`# surface-graph — ${g.tomTat.soDien} diện · ${g.tomTat.triangles} tam giác`, `mtllib ${tenMtl}`];
  for (let v = 0; v < m.positions.length / 3; v++) {
    obj.push(`v ${m.positions[v * 3].toFixed(4)} ${m.positions[v * 3 + 1].toFixed(4)} ${m.positions[v * 3 + 2].toFixed(4)}`);
  }
  if (m.uvs) for (let v = 0; v < m.uvs.length / 2; v++) obj.push(`vt ${m.uvs[v * 2].toFixed(6)} ${(1 - m.uvs[v * 2 + 1]).toFixed(6)}`);
  const mtl: string[] = ['# surface-graph — 1 material / diện'];
  for (const d of g.dien) {
    const hex = d.mauHex ?? MAU_LOAI[d.loai];
    const c = hexToRgb(hex).map((x) => (x / 255).toFixed(4));
    const rough = d.vatLieu?.pbr.roughness ?? 0.5;
    mtl.push(`newmtl dien_${d.id}_${d.loai}`, `Kd ${c[0]} ${c[1]} ${c[2]}`, `Ks ${(1 - rough).toFixed(3)} ${(1 - rough).toFixed(3)} ${(1 - rough).toFixed(3)}`, 'illum 2', '');
    obj.push(`g dien_${d.id}_${d.loai}`, `usemtl dien_${d.id}_${d.loai}`);
    for (let t = 0; t < m.triAreas.length; t++) {
      if (g.nhan[t] !== d.id) continue;
      const a = m.indices[t * 3] + 1, b = m.indices[t * 3 + 1] + 1, cc = m.indices[t * 3 + 2] + 1;
      obj.push(m.uvs ? `f ${a}/${a} ${b}/${b} ${cc}/${cc}` : `f ${a} ${b} ${cc}`);
    }
  }
  return { obj: obj.join('\n') + '\n', mtl: mtl.join('\n') + '\n' };
}

/** JSON gọn để soi mắt/nạp lại — KHÔNG kèm mesh (nặng), chỉ đồ thị diện. */
export function doThiDienJson(g: DoThiDien): string {
  return JSON.stringify({
    marker: 'surfaceGraph',
    tomTat: g.tomTat,
    mesh: g.mesh.soLieu,
    bbox: { min: g.mesh.bboxMin, max: g.mesh.bboxMax, diag: g.mesh.diag, scale: g.mesh.scale },
    cauKien: g.cauKien,
    dien: g.dien.map((d) => ({
      id: d.id, loai: d.loai, soTri: d.soTri, nghiVanBongSan: d.nghiVanBongSan || undefined,
      dienTich: +d.dienTich.toFixed(2), dienTichPct: +d.dienTichPct.toFixed(3),
      rms: +d.rms.toFixed(4), rmsPct: +d.rmsPct.toFixed(3),
      thamSo: d.thamSo, lyDo: d.lyDo,
      frame: { goc: d.frame.goc.map((x) => +x.toFixed(2)), e1: d.frame.e1, e2: d.frame.e2, e3: d.frame.e3, co: d.frame.co.map((x) => +x.toFixed(2)) },
      luoi: d.luoi,
      bien: d.bien.map((p) => p.map((q) => q.map((x) => +x.toFixed(2)))),
      mauHex: d.mauHex, doLechMau: d.doLechMau != null ? +d.doLechMau.toFixed(1) : undefined,
      vatLieu: d.vatLieu,
      keBen: d.keBen,
    })),
  }, null, 1);
}
