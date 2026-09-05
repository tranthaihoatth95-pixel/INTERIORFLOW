/**
 * scripts/nghiem-thu-ban-lam-viec/obj-sang-glb.mjs — đổi một `.obj` (chỉ v/vt/f) thành `.glb` nhị
 * phân tối thiểu, để có MẪU THẬT chạy đường 0-credit của cửa "Nhận diện cấu kiện".
 *
 * VÌ SAO CẦN: `chuanNet()`/`xayDoThiDien()` nhận GLB, còn proof duy nhất đang nằm trong repo là
 * `public/library-assets/lincoln-327/lincoln-327-chuannet.obj` (đầu ra của chính bước chuẩn nét,
 * 14/08). Không có FAL_KEY trong môi trường này nên KHÔNG sinh được GLB mới bằng fal — và cũng
 * KHÔNG được phép tiêu credit. Đổi ngược OBJ→GLB cho ta một mesh ghế THẬT, tất định, 0 đồng.
 *
 * ⚠️ Khai thật: mesh này là bản ĐÃ chuẩn nét một lần (12.268 tam giác), không phải mesh TRELLIS
 * thô. Nó chứng minh dây chuyền chạy trên hình học thật, KHÔNG chứng minh chất lượng bước
 * chuẩn-nét trên đầu vào thô — hai chuyện khác nhau.
 *
 * Dùng: node scripts/nghiem-thu-ban-lam-viec/obj-sang-glb.mjs <vào.obj> <ra.glb>
 */
import { readFileSync, writeFileSync } from 'node:fs';

const [, , objPath, glbPath] = process.argv;
if (!objPath || !glbPath) {
  console.error('Dùng: obj-sang-glb.mjs <vào.obj> <ra.glb>');
  process.exit(2);
}

const txt = readFileSync(objPath, 'utf8');
const V = [];
const VT = [];
/** khoá "vIdx/vtIdx" → chỉ số đỉnh trong buffer ra (OBJ cho phép một v dùng nhiều vt). */
const map = new Map();
const pos = [];
const uv = [];
const idx = [];

function dinh(tok) {
  const [vs, vts] = tok.split('/');
  const vi = Number(vs) - 1;
  const ti = vts ? Number(vts) - 1 : -1;
  const key = `${vi}/${ti}`;
  let out = map.get(key);
  if (out === undefined) {
    out = pos.length / 3;
    map.set(key, out);
    pos.push(V[vi * 3], V[vi * 3 + 1], V[vi * 3 + 2]);
    if (ti >= 0 && VT.length) uv.push(VT[ti * 2], VT[ti * 2 + 1]);
    else uv.push(0, 0);
  }
  return out;
}

for (const line of txt.split('\n')) {
  if (line.startsWith('v ')) {
    const p = line.slice(2).trim().split(/\s+/).map(Number);
    V.push(p[0], p[1], p[2]);
  } else if (line.startsWith('vt ')) {
    const p = line.slice(3).trim().split(/\s+/).map(Number);
    // OBJ gốc UV ở MÉP DƯỚI, glTF ở MÉP TRÊN — đảo lại đúng luật UV_FLIP_V của chuan-net.ts.
    VT.push(p[0], 1 - p[1]);
  } else if (line.startsWith('f ')) {
    const toks = line.slice(2).trim().split(/\s+/);
    const fan = toks.map(dinh);
    for (let i = 1; i + 1 < fan.length; i++) idx.push(fan[0], fan[i], fan[i + 1]);
  }
}

const positions = new Float32Array(pos);
const uvs = new Float32Array(uv);
const indices = new Uint32Array(idx);

// bbox cho accessor POSITION (glTF bắt buộc min/max)
const mn = [Infinity, Infinity, Infinity];
const mx = [-Infinity, -Infinity, -Infinity];
for (let i = 0; i < positions.length; i += 3)
  for (let k = 0; k < 3; k++) {
    const x = positions[i + k];
    if (x < mn[k]) mn[k] = x;
    if (x > mx[k]) mx[k] = x;
  }

const pad4 = (n) => (n + 3) & ~3;
const posBytes = positions.byteLength;
const uvBytes = uvs.byteLength;
const idxBytes = indices.byteLength;
const offPos = 0;
const offUv = pad4(offPos + posBytes);
const offIdx = pad4(offUv + uvBytes);
const binLen = pad4(offIdx + idxBytes);

const json = {
  asset: { version: '2.0', generator: 'obj-sang-glb.mjs (nghiệm thu IF, 0 credit)' },
  scene: 0,
  scenes: [{ nodes: [0] }],
  nodes: [{ mesh: 0 }],
  meshes: [{ primitives: [{ mode: 4, attributes: { POSITION: 0, TEXCOORD_0: 1 }, indices: 2 }] }],
  accessors: [
    { bufferView: 0, componentType: 5126, count: positions.length / 3, type: 'VEC3', min: mn, max: mx },
    { bufferView: 1, componentType: 5126, count: uvs.length / 2, type: 'VEC2' },
    { bufferView: 2, componentType: 5125, count: indices.length, type: 'SCALAR' },
  ],
  bufferViews: [
    { buffer: 0, byteOffset: offPos, byteLength: posBytes, target: 34962 },
    { buffer: 0, byteOffset: offUv, byteLength: uvBytes, target: 34962 },
    { buffer: 0, byteOffset: offIdx, byteLength: idxBytes, target: 34963 },
  ],
  buffers: [{ byteLength: binLen }],
};

// ⚠️ Đệm theo BYTE, không theo KÝ TỰ. Chuỗi `generator` có dấu tiếng Việt (nhiều byte/ký tự) nên
// đệm theo `.length` cho ra chunk JSON lệch 4-byte ⇒ `new Float32Array(buffer, offset)` của
// parseGlbGeometry ném "start offset should be a multiple of 4". Đã đo bằng chính ca đó.
let jsonBytes = Buffer.from(JSON.stringify(json), 'utf8');
if (jsonBytes.length % 4 !== 0) {
  jsonBytes = Buffer.concat([jsonBytes, Buffer.alloc(4 - (jsonBytes.length % 4), 0x20)]);
}

const total = 12 + 8 + jsonBytes.length + 8 + binLen;
const out = Buffer.alloc(total);
out.writeUInt32LE(0x46546c67, 0); // "glTF"
out.writeUInt32LE(2, 4);
out.writeUInt32LE(total, 8);
out.writeUInt32LE(jsonBytes.length, 12);
out.writeUInt32LE(0x4e4f534a, 16); // "JSON"
jsonBytes.copy(out, 20);
const binOff = 20 + jsonBytes.length;
out.writeUInt32LE(binLen, binOff);
out.writeUInt32LE(0x004e4942, binOff + 4); // "BIN\0"
Buffer.from(positions.buffer, positions.byteOffset, posBytes).copy(out, binOff + 8 + offPos);
Buffer.from(uvs.buffer, uvs.byteOffset, uvBytes).copy(out, binOff + 8 + offUv);
Buffer.from(indices.buffer, indices.byteOffset, idxBytes).copy(out, binOff + 8 + offIdx);

writeFileSync(glbPath, out);
console.log(
  `GLB: ${glbPath} · ${out.length} bytes · ${positions.length / 3} đỉnh · ${indices.length / 3} tam giác · uv=${uvs.length / 2}`,
);
