/**
 * lib/idfc-import/glb-stats.ts — đọc SỐ LIỆU THẬT từ file GLB (binary glTF 2.0) mà KHÔNG cần
 * engine 3D: kích thước, số tam giác, số đỉnh, generator, và (từ 09/2026) HỘP BAO của cảnh.
 * Dùng cho pipeline `importFromPhoto` (from-photo.ts) và `normalizeAssetFamily` (asset-family.ts)
 * để bản ghi .idfc khai đúng "mesh này to bao nhiêu, thô/mịn cỡ nào" — số đo được từ file,
 * không phải số bịa.
 *
 * Cấu trúc GLB (spec Khronos glTF 2.0 §Binary glTF):
 *   [0..3]  magic 'glTF' (0x46546C67 LE) · [4..7] version · [8..11] tổng bytes
 *   [12..15] độ dài chunk 0 · [16..19] loại chunk 0 (0x4E4F534A = 'JSON') · [20..] JSON UTF-8
 * Tam giác: mỗi mesh.primitives[] mode 4 (TRIANGLES, mặc định khi vắng) → count/3, count lấy từ
 * accessor `indices` (mesh đánh chỉ số) hoặc `attributes.POSITION` (mesh xổ thẳng).
 *
 * HỘP BAO (`bounds`) — glTF 2.0 §3.6.2.3 BẮT BUỘC accessor POSITION khai `min`/`max` ⇒ đọc thẳng,
 * KHÔNG giải mã buffer. Đơn vị theo spec là MÉT, trục +Y hướng lên. Hộp bao được TÍNH QUA NODE
 * TRANSFORM (matrix hoặc TRS, nhân dồn theo cây scene) vì exporter hay "nướng" scale vào node —
 * bỏ qua transform là báo lệch đơn vị giả. Mesh không được node nào tham chiếu (mồ côi) thì hợp
 * nhất theo min/max thô và `bounds.basis = "raw-accessors"` nói rõ. Không có POSITION min/max hợp lệ ⇒
 * `bounds` = undefined — KHÔNG bịa hộp bao.
 *
 * THUẦN (không mạng/DOM) — test trong from-photo.test.ts + asset-family.test.ts bằng GLB tự dựng.
 */

export interface GlbBounds {
  /** mét, hệ toạ độ glTF (+Y lên) — đã áp node transform. */
  min: [number, number, number];
  max: [number, number, number];
  /** 'scene' = tính qua cây node · 'raw-accessors' = không có scene/node tham chiếu mesh, hợp nhất min/max thô. */
  basis: 'scene' | 'raw-accessors';
}

export interface GlbStats {
  bytes: number;
  /** tổng tam giác các primitive mode TRIANGLES (mode khác — line/point — không tính vào đây) */
  triangles: number;
  /** tổng số đỉnh (cộng count các accessor POSITION — đỉnh dùng chung giữa primitive tính lặp) */
  vertices: number;
  meshes: number;
  materials: number;
  generator?: string;
  /** hộp bao cảnh (mét, +Y lên) — undefined khi file không khai min/max POSITION hợp lệ. */
  bounds?: GlbBounds;
}

const GLB_MAGIC = 0x46546c67; // 'glTF'
const CHUNK_JSON = 0x4e4f534a; // 'JSON'

type Vec3 = [number, number, number];
type Mat4 = number[]; // 16 số, column-major theo glTF

interface GltfNode {
  mesh?: number;
  children?: number[];
  matrix?: number[];
  translation?: number[];
  rotation?: number[];
  scale?: number[];
}

interface GltfJson {
  asset?: { generator?: string };
  accessors?: Array<{ count?: number; min?: number[]; max?: number[] }>;
  materials?: unknown[];
  meshes?: Array<{
    primitives?: Array<{ mode?: number; indices?: number; attributes?: { POSITION?: number } }>;
  }>;
  nodes?: GltfNode[];
  scenes?: Array<{ nodes?: number[] }>;
  scene?: number;
}

/** Parse GLB → số liệu. Trả null nếu không phải GLB hợp lệ (KHÔNG throw — caller báo lỗi rõ). */
export function glbStats(buf: Uint8Array): GlbStats | null {
  if (buf.byteLength < 20) return null;
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  if (dv.getUint32(0, true) !== GLB_MAGIC) return null;
  const chunkLen = dv.getUint32(12, true);
  if (dv.getUint32(16, true) !== CHUNK_JSON) return null;
  if (20 + chunkLen > buf.byteLength) return null;

  let json: GltfJson;
  try {
    json = JSON.parse(new TextDecoder().decode(buf.subarray(20, 20 + chunkLen))) as GltfJson;
  } catch {
    return null;
  }

  const accessors = json.accessors ?? [];
  let triangles = 0;
  let vertices = 0;
  for (const mesh of json.meshes ?? []) {
    for (const prim of mesh.primitives ?? []) {
      const mode = prim.mode ?? 4; // vắng mode = TRIANGLES theo spec
      const posCount = prim.attributes?.POSITION != null ? accessors[prim.attributes.POSITION]?.count ?? 0 : 0;
      vertices += posCount;
      if (mode !== 4) continue;
      const idxCount = prim.indices != null ? accessors[prim.indices]?.count ?? 0 : posCount;
      triangles += Math.floor(idxCount / 3);
    }
  }

  return {
    bytes: buf.byteLength,
    triangles,
    vertices,
    meshes: (json.meshes ?? []).length,
    materials: (json.materials ?? []).length,
    generator: json.asset?.generator,
    bounds: computeBounds(json),
  };
}

/* ═══════════════ HỘP BAO ═══════════════ */

function isVec3(v: unknown): v is number[] {
  return Array.isArray(v) && v.length >= 3 && v.slice(0, 3).every((n) => typeof n === 'number' && Number.isFinite(n));
}

/** min/max thô của một mesh: hợp các accessor POSITION có min/max hợp lệ. null nếu không có. */
function meshRawBox(json: GltfJson, meshIdx: number): { min: Vec3; max: Vec3 } | null {
  const mesh = json.meshes?.[meshIdx];
  if (!mesh) return null;
  let box: { min: Vec3; max: Vec3 } | null = null;
  for (const prim of mesh.primitives ?? []) {
    const ai = prim.attributes?.POSITION;
    if (ai == null) continue;
    const acc = json.accessors?.[ai];
    if (!acc || !isVec3(acc.min) || !isVec3(acc.max)) continue;
    const mn: Vec3 = [acc.min[0], acc.min[1], acc.min[2]];
    const mx: Vec3 = [acc.max[0], acc.max[1], acc.max[2]];
    box = box ? unionBox(box, { min: mn, max: mx }) : { min: mn, max: mx };
  }
  return box;
}

function unionBox(a: { min: Vec3; max: Vec3 }, b: { min: Vec3; max: Vec3 }) {
  return {
    min: [Math.min(a.min[0], b.min[0]), Math.min(a.min[1], b.min[1]), Math.min(a.min[2], b.min[2])] as Vec3,
    max: [Math.max(a.max[0], b.max[0]), Math.max(a.max[1], b.max[1]), Math.max(a.max[2], b.max[2])] as Vec3,
  };
}

const IDENTITY: Mat4 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

/** a × b (column-major 4×4). */
function mul(a: Mat4, b: Mat4): Mat4 {
  const out = new Array<number>(16).fill(0);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
      out[c * 4 + r] = s;
    }
  }
  return out;
}

/** Ma trận cục bộ của node: `matrix` thắng; không có thì T·R·S theo đúng thứ tự spec. */
function localMatrix(n: GltfNode): Mat4 {
  if (Array.isArray(n.matrix) && n.matrix.length === 16 && n.matrix.every((x) => Number.isFinite(x))) return n.matrix;
  const t = isVec3(n.translation) ? n.translation : [0, 0, 0];
  const s = isVec3(n.scale) ? n.scale : [1, 1, 1];
  const q = Array.isArray(n.rotation) && n.rotation.length === 4 && n.rotation.every((x) => Number.isFinite(x)) ? n.rotation : [0, 0, 0, 1];
  const [x, y, z, w] = q;
  // quaternion → ma trận xoay (column-major)
  const R: Mat4 = [
    1 - 2 * (y * y + z * z), 2 * (x * y + z * w), 2 * (x * z - y * w), 0,
    2 * (x * y - z * w), 1 - 2 * (x * x + z * z), 2 * (y * z + x * w), 0,
    2 * (x * z + y * w), 2 * (y * z - x * w), 1 - 2 * (x * x + y * y), 0,
    0, 0, 0, 1,
  ];
  const S: Mat4 = [s[0], 0, 0, 0, 0, s[1], 0, 0, 0, 0, s[2], 0, 0, 0, 0, 1];
  const T: Mat4 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, t[0], t[1], t[2], 1];
  return mul(T, mul(R, S));
}

function transformPoint(m: Mat4, p: Vec3): Vec3 {
  return [
    m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12],
    m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13],
    m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14],
  ];
}

/** Hộp bao sau biến đổi = hộp bao của 8 đỉnh hộp gốc đã nhân ma trận. */
function transformBox(m: Mat4, b: { min: Vec3; max: Vec3 }): { min: Vec3; max: Vec3 } {
  let out: { min: Vec3; max: Vec3 } | null = null;
  for (let i = 0; i < 8; i++) {
    const p: Vec3 = [i & 1 ? b.max[0] : b.min[0], i & 2 ? b.max[1] : b.min[1], i & 4 ? b.max[2] : b.min[2]];
    const q = transformPoint(m, p);
    out = out ? unionBox(out, { min: q, max: q }) : { min: q, max: q };
  }
  return out as { min: Vec3; max: Vec3 };
}

function computeBounds(json: GltfJson): GlbBounds | undefined {
  const nodes = json.nodes ?? [];
  const sceneIdx = typeof json.scene === 'number' ? json.scene : 0;
  const roots = json.scenes?.[sceneIdx]?.nodes;

  if (Array.isArray(roots) && roots.length > 0 && nodes.length > 0) {
    let box: { min: Vec3; max: Vec3 } | null = null;
    const seen = new Set<number>(); // chặn vòng lặp node tự tham chiếu (file hỏng) — không treo
    const walk = (idx: number, parent: Mat4, depth: number) => {
      if (depth > 64 || seen.has(idx)) return;
      const n = nodes[idx];
      if (!n) return;
      seen.add(idx);
      const world = mul(parent, localMatrix(n));
      if (typeof n.mesh === 'number') {
        const raw = meshRawBox(json, n.mesh);
        if (raw) {
          const tb = transformBox(world, raw);
          box = box ? unionBox(box, tb) : tb;
        }
      }
      for (const c of n.children ?? []) walk(c, world, depth + 1);
      seen.delete(idx); // cùng node xuất hiện ở hai nhánh khác nhau là hợp lệ (instancing)
    };
    for (const r of roots) walk(r, IDENTITY, 0);
    if (box) return { ...(box as { min: Vec3; max: Vec3 }), basis: 'scene' };
  }

  // Không có scene/node ⇒ hợp nhất min/max thô của mọi mesh.
  let box: { min: Vec3; max: Vec3 } | null = null;
  for (let i = 0; i < (json.meshes ?? []).length; i++) {
    const raw = meshRawBox(json, i);
    if (raw) box = box ? unionBox(box, raw) : raw;
  }
  return box ? { ...box, basis: 'raw-accessors' } : undefined;
}
