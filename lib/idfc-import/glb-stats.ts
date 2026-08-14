/**
 * lib/idfc-import/glb-stats.ts — đọc SỐ LIỆU THẬT từ file GLB (binary glTF 2.0) mà KHÔNG cần
 * engine 3D: kích thước, số tam giác, số đỉnh, generator. Dùng cho pipeline `importFromPhoto`
 * (from-photo.ts) để bản ghi .idfc khai đúng "mesh này to bao nhiêu, thô/mịn cỡ nào" — số đo
 * được từ file, không phải số bịa.
 *
 * Cấu trúc GLB (spec Khronos glTF 2.0 §Binary glTF):
 *   [0..3]  magic 'glTF' (0x46546C67 LE) · [4..7] version · [8..11] tổng bytes
 *   [12..15] độ dài chunk 0 · [16..19] loại chunk 0 (0x4E4F534A = 'JSON') · [20..] JSON UTF-8
 * Tam giác: mỗi mesh.primitives[] mode 4 (TRIANGLES, mặc định khi vắng) → count/3, count lấy từ
 * accessor `indices` (mesh đánh chỉ số) hoặc `attributes.POSITION` (mesh xổ thẳng).
 *
 * THUẦN (không mạng/DOM) — test trong from-photo.test.ts bằng GLB tự dựng tay.
 */

export interface GlbStats {
  bytes: number;
  /** tổng tam giác các primitive mode TRIANGLES (mode khác — line/point — không tính vào đây) */
  triangles: number;
  /** tổng số đỉnh (cộng count các accessor POSITION — đỉnh dùng chung giữa primitive tính lặp) */
  vertices: number;
  meshes: number;
  materials: number;
  generator?: string;
}

const GLB_MAGIC = 0x46546c67; // 'glTF'
const CHUNK_JSON = 0x4e4f534a; // 'JSON'

interface GltfJson {
  asset?: { generator?: string };
  accessors?: Array<{ count?: number }>;
  materials?: unknown[];
  meshes?: Array<{
    primitives?: Array<{ mode?: number; indices?: number; attributes?: { POSITION?: number } }>;
  }>;
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
  };
}
