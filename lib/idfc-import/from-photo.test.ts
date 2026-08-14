/**
 * lib/idfc-import/from-photo.test.ts — phần THUẦN của pipeline importFromPhoto (KHÔNG mạng):
 * buildIdfcFromPhoto shape đúng + cờ nguồn đúng từng trường + round-trip qua importIdfc thật,
 * và glbStats đọc đúng GLB tự dựng tay. Chạy: node_modules/.bin/sucrase-node lib/idfc-import/from-photo.test.ts
 */
import { buildIdfcFromPhoto, type VerifiedSpec, type PhotoClassification, type MeshResult, type ProvenancedValue } from './from-photo';
import { glbStats } from './glb-stats';
import { importIdfc } from '../cad/idfc';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

/* ── dữ liệu giả — đúng ca proof Lincoln 327 nhưng KHÔNG gọi mạng ── */
const SPEC: VerifiedSpec = {
  name: 'Lincoln Bar Chair',
  code: '327',
  brand: 'Mezzo Collection',
  wMm: 580,
  dMm: 600,
  hMm: 1110,
  seatHMm: 850,
  weightKg: 16,
  materials: ['Matte Walnut Wood', 'Polished Brass', 'Fabric'],
  sourceUrl: 'https://mezzocollection.com/en/products/upholstery/bar-chair/lincoln-327',
};
const CLS: PhotoClassification = {
  caption: 'Ghế bar bọc nhung mù tạt, khung gỗ óc chó, tay vịn vòng đồng bóng.',
  style: 'Mid-century glam',
  materials: ['nhung mù tạt', 'gỗ óc chó', 'đồng bóng'],
  room: 'Bếp',
  visionModel: 'meta/llama-3.2-11b-vision-instruct',
};
const MESH: MeshResult = {
  glbUrl: 'https://fal.example/lincoln.glb',
  falModel: 'fal-ai/trellis',
  requestId: 'req-test-123',
  fileSizeBytes: 1234567,
  triangles: 50000,
};

console.log('buildIdfcFromPhoto — shape + cờ nguồn');
{
  const rec = buildIdfcFromPhoto({ spec: SPEC, classification: CLS, mesh: MESH, sourceImageUrl: 'https://mezzo.example/lincoln-01.jpg', group: 'Bếp' });

  ok('round-trip importIdfc mở được (parsed trả về)', rec.parsed !== null);
  ok('kind = furniture', rec.parsed.meta.kind === 'furniture');
  ok('tên + mã từ spec verified', rec.parsed.meta.name === 'Lincoln Bar Chair' && rec.parsed.meta.code === '327');

  const body = rec.parsed.body;
  ok('ruột component', body.type === 'component');
  if (body.type === 'component') {
    ok('geom2d w×d = 580×600 (số verified)', body.geom2d.w === 580 && body.geom2d.h === 600);
    ok('geom2d nét bao poly closed', body.geom2d.prims.length === 1 && body.geom2d.prims[0].k === 'poly');
    ok('geom3d.heightMm = 1110', body.geom3d?.heightMm === 1110);
  }
  ok('commerce mang brand hãng, KHÔNG bịa giá', rec.parsed.commerce?.brand === 'Mezzo Collection' && rec.parsed.commerce?.priceVnd === undefined);

  // Khoá mở rộng xFromPhoto — importIdfc bỏ qua nhưng JSON phải giữ nguyên
  const raw = JSON.parse(rec.idfcJson) as { xFromPhoto?: Record<string, unknown> };
  const x = raw.xFromPhoto as {
    mesh: { flag: string; source: string; glbUrl: string };
    classification: Record<string, ProvenancedValue<unknown>>;
    params: Record<string, ProvenancedValue<number>>;
    reviewStatus: string;
  };
  ok('xFromPhoto tồn tại trong JSON', Boolean(x));
  ok('mesh cờ inferred + source có model + requestId', x.mesh.flag === 'inferred' && x.mesh.source === 'fal:fal-ai/trellis#req-test-123');
  ok('phân loại: MỌI trường cờ inferred, source = vision model', Object.values(x.classification).every((p) => p.flag === 'inferred' && p.source === 'vision:meta/llama-3.2-11b-vision-instruct'));
  ok('params: MỌI trường cờ verified, source = URL hãng', Object.values(x.params).every((p) => p.flag === 'verified' && p.source === SPEC.sourceUrl));
  ok('params đủ 5 trường w/d/h/seatH/weight', ['wMm', 'dMm', 'hMm', 'seatHMm', 'weightKg'].every((k) => x.params[k] !== undefined));
  ok('params đúng giá trị hãng', x.params.wMm.value === 580 && x.params.seatHMm.value === 850 && x.params.weightKg.value === 16);
  ok('reviewStatus = draft-pending-review (T5 — nháp chờ duyệt)', x.reviewStatus === 'draft-pending-review');

  // File .idfc mở lại lần nữa từ chính chuỗi JSON (double round-trip — không mất gì)
  const again = importIdfc(rec.idfcJson);
  ok('mở lại lần 2 vẫn được', again !== null && again.meta.code === '327');
}

console.log('\nbuildIdfcFromPhoto — thiếu trường optional thì KHÔNG khai (không đoán bừa)');
{
  const specThieu: VerifiedSpec = { ...SPEC, seatHMm: undefined, weightKg: undefined };
  const rec = buildIdfcFromPhoto({ spec: specThieu, classification: CLS, mesh: MESH, sourceImageUrl: 'x' });
  const x = (JSON.parse(rec.idfcJson) as { xFromPhoto: { params: Record<string, unknown> } }).xFromPhoto;
  ok('seatHMm vắng mặt (không có key)', !('seatHMm' in x.params));
  ok('weightKg vắng mặt (không có key)', !('weightKg' in x.params));
  ok('3 trường bắt buộc vẫn đủ', ['wMm', 'dMm', 'hMm'].every((k) => k in x.params));
}

console.log('\nglbStats — GLB tự dựng tay');
{
  // GLB tối thiểu: header 12B + chunk JSON. 1 mesh, POSITION accessor count 24, indices count 36 → 12 tam giác.
  const gltf = {
    asset: { version: '2.0', generator: 'test-gen' },
    accessors: [{ count: 24 }, { count: 36 }],
    materials: [{}],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1 }] }],
  };
  let jsonBytes = new TextEncoder().encode(JSON.stringify(gltf));
  // pad 4 bytes bằng space theo spec
  const pad = (4 - (jsonBytes.length % 4)) % 4;
  if (pad) jsonBytes = new Uint8Array([...jsonBytes, ...new Array(pad).fill(0x20)]);
  const total = 12 + 8 + jsonBytes.length;
  const buf = new Uint8Array(total);
  const dv = new DataView(buf.buffer);
  dv.setUint32(0, 0x46546c67, true); // 'glTF'
  dv.setUint32(4, 2, true);
  dv.setUint32(8, total, true);
  dv.setUint32(12, jsonBytes.length, true);
  dv.setUint32(16, 0x4e4f534a, true); // 'JSON'
  buf.set(jsonBytes, 20);

  const s = glbStats(buf);
  ok('parse được GLB hợp lệ', s !== null);
  ok('triangles = 36/3 = 12', s?.triangles === 12);
  ok('vertices = 24', s?.vertices === 24);
  ok('meshes = 1, materials = 1', s?.meshes === 1 && s?.materials === 1);
  ok('generator đọc đúng', s?.generator === 'test-gen');

  ok('không phải GLB → null (không throw)', glbStats(new TextEncoder().encode('hello world hello world')) === null);
  ok('buffer cụt → null', glbStats(new Uint8Array(4)) === null);
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
