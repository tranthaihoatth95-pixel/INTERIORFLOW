/**
 * lib/idfc-seed/fixture-glb.ts — DỰNG GLB HỘP tất định, TỰ TÁC (Slice 8, 09/2026).
 *
 * VÌ SAO KHÔNG TẢI MODEL NGOÀI: phiếu cấm bulk download tài sản khi chưa chứng minh giấy phép +
 * tác động dung lượng repo. Fixture kiểm thử phải HỢP PHÁP và NHỎ ⇒ dựng bằng code, không có
 * byte nào chép từ nguồn ngoài. Biên lai: `receipt.ts` (SEED_RECEIPT).
 *
 * Hộp w×d×h (mm) → glTF: MÉT, +Y lên, gốc ở TÂM ĐÁY (x∈[-w/2,w/2], y∈[0,h], z∈[-d/2,d/2]) —
 * đúng quy ước "đặt lên sàn" để hộp bao đọc ra khớp số khai. 8 đỉnh · 12 tam giác · accessor
 * POSITION có min/max (bắt buộc theo spec) · 1 mesh · 1 node · 1 scene. Bố cục byte cố định ⇒
 * cùng đầu vào cùng byte (test khoá bằng sha256).
 *
 * THUẦN — không FS/DOM.
 */

const GLB_MAGIC = 0x46546c67;
const CHUNK_JSON = 0x4e4f534a;
const CHUNK_BIN = 0x004e4942;

export interface BoxSpecMm {
  wMm: number;
  dMm: number;
  hMm: number;
  /** ghi vào asset.generator để nhận ra fixture IF trong mọi đường đọc. */
  generator?: string;
  /** node scale tuỳ chọn — để test đường "exporter nướng scale vào node". */
  nodeScale?: [number, number, number];
}

function pad4(n: number): number {
  return (n + 3) & ~3;
}

/** Dựng GLB hộp. Throw khi số không hữu hạn/≤0 — fixture sai thì sai ngay lúc dựng, không lúc đọc. */
export function buildBoxGlb(spec: BoxSpecMm): Uint8Array {
  for (const k of ['wMm', 'dMm', 'hMm'] as const) {
    const v = spec[k];
    if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) throw new Error(`buildBoxGlb: ${k} phải là số > 0`);
  }
  const hx = spec.wMm / 2000; // mm → m, nửa rộng
  const hz = spec.dMm / 2000;
  const h = spec.hMm / 1000;

  // 8 đỉnh (x, y, z) — y từ 0 tới h.
  const verts = new Float32Array([
    -hx, 0, -hz, hx, 0, -hz, hx, 0, hz, -hx, 0, hz,
    -hx, h, -hz, hx, h, -hz, hx, h, hz, -hx, h, hz,
  ]);
  // 12 tam giác (uint16), hướng ngoài.
  const idx = new Uint16Array([
    0, 2, 1, 0, 3, 2, // đáy
    4, 5, 6, 4, 6, 7, // đỉnh
    0, 1, 5, 0, 5, 4, // z-
    2, 3, 7, 2, 7, 6, // z+
    0, 4, 7, 0, 7, 3, // x-
    1, 2, 6, 1, 6, 5, // x+
  ]);

  const vBytes = verts.byteLength; // 96
  const iBytes = idx.byteLength; // 72
  const binLen = pad4(vBytes) + pad4(iBytes);
  const bin = new Uint8Array(binLen);
  bin.set(new Uint8Array(verts.buffer), 0);
  bin.set(new Uint8Array(idx.buffer), pad4(vBytes));

  const r6 = (n: number) => Math.round(n * 1e6) / 1e6;
  const gltf = {
    asset: { version: '2.0', generator: spec.generator ?? 'interiorflow-seed/fixture-glb' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, ...(spec.nodeScale ? { scale: spec.nodeScale } : {}) }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1, mode: 4 }] }],
    accessors: [
      { bufferView: 0, componentType: 5126, count: 8, type: 'VEC3', min: [r6(-hx), 0, r6(-hz)], max: [r6(hx), r6(h), r6(hz)] },
      { bufferView: 1, componentType: 5123, count: 36, type: 'SCALAR' },
    ],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: vBytes, target: 34962 },
      { buffer: 0, byteOffset: pad4(vBytes), byteLength: iBytes, target: 34963 },
    ],
    buffers: [{ byteLength: binLen }],
  };
  const jsonBytes = new TextEncoder().encode(JSON.stringify(gltf));
  const jsonLen = pad4(jsonBytes.byteLength);
  const total = 12 + 8 + jsonLen + 8 + binLen;
  const out = new Uint8Array(total);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, GLB_MAGIC, true);
  dv.setUint32(4, 2, true);
  dv.setUint32(8, total, true);
  dv.setUint32(12, jsonLen, true);
  dv.setUint32(16, CHUNK_JSON, true);
  out.set(jsonBytes, 20);
  for (let i = 20 + jsonBytes.byteLength; i < 20 + jsonLen; i++) out[i] = 0x20; // pad JSON bằng dấu cách theo spec
  const binStart = 20 + jsonLen;
  dv.setUint32(binStart, binLen, true);
  dv.setUint32(binStart + 4, CHUNK_BIN, true);
  out.set(bin, binStart + 8);
  return out;
}
