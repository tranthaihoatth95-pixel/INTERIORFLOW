/**
 * lib/idfc-import/nhan-dien-cau-kien.test.ts — canh MỐI NỐI, không canh lại thuật toán.
 *
 * Bốn module engine đã có 64 test riêng. Thứ file này khẳng định là **cái chưa ai canh**: bốn bước
 * NỐI ĐƯỢC VÀO NHAU trên một GLB thật, và bản ghi ra mang cờ nguồn ĐÚNG SỰ THẬT.
 *
 * ⭐ HIỆU CHUẨN, đặt trước mọi khẳng định: ca ⑥ dựng một GLB HỎNG và đòi hàm NÉM. Nếu ca đó cũng
 * xanh thì phép đo không phân biệt được hai thế giới (hàm nuốt mọi đầu vào) ⇒ mọi số ở trên vô giá
 * trị. Cùng kỷ luật đối chứng của `noi-kho-idfc-song-sot.mjs`.
 *
 * Chạy: node_modules/.bin/sucrase-node lib/idfc-import/nhan-dien-cau-kien.test.ts
 */

import { nhanDienCauKien } from './nhan-dien-cau-kien';
import { buildIdfcFromPhoto, type PhotoClassification, type VerifiedSpec } from './from-photo';
import { docDauVao } from '../../app/api/idfc-import/_lib/doc-dau-vao';

let pass = 0;
const fail: string[] = [];
const ok = (ten: string, dieu: boolean, chiTiet = '') => {
  if (dieu) {
    pass++;
    console.log('  ok  -', ten, chiTiet && `· ${chiTiet}`);
  } else {
    fail.push(ten);
    console.log('  FAIL-', ten, chiTiet && `· ${chiTiet}`);
  }
};

/* ══════════ GLB tự dựng: một khối hộp có UV, đủ để bốn bước chạy thật ══════════ */
function dungGlb(hong = false): Uint8Array {
  // 8 đỉnh hộp, 12 tam giác — nhỏ nhưng là mesh HỢP LỆ (không phải mảng byte ngẫu nhiên).
  const P = [
    -0.3, 0, -0.3, 0.3, 0, -0.3, 0.3, 0, 0.3, -0.3, 0, 0.3,
    -0.3, 1, -0.3, 0.3, 1, -0.3, 0.3, 1, 0.3, -0.3, 1, 0.3,
  ];
  const I = [
    0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6, 0, 4, 5, 0, 5, 1,
    1, 5, 6, 1, 6, 2, 2, 6, 7, 2, 7, 3, 3, 7, 4, 3, 4, 0,
  ];
  const UV = [0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1];
  const pos = new Float32Array(P);
  const uv = new Float32Array(UV);
  const idx = new Uint32Array(I);
  const pad4 = (n: number) => (n + 3) & ~3;
  const offUv = pad4(pos.byteLength);
  const offIdx = pad4(offUv + uv.byteLength);
  const binLen = pad4(offIdx + idx.byteLength);
  const json = {
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [{ mode: 4, attributes: { POSITION: 0, TEXCOORD_0: 1 }, indices: 2 }] }],
    accessors: [
      { bufferView: 0, componentType: 5126, count: 8, type: 'VEC3', min: [-0.3, 0, -0.3], max: [0.3, 1, 0.3] },
      { bufferView: 1, componentType: 5126, count: 8, type: 'VEC2' },
      { bufferView: 2, componentType: 5125, count: idx.length, type: 'SCALAR' },
    ],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: pos.byteLength },
      { buffer: 0, byteOffset: offUv, byteLength: uv.byteLength },
      { buffer: 0, byteOffset: offIdx, byteLength: idx.byteLength },
    ],
    buffers: [{ byteLength: binLen }],
  };
  let jb = Buffer.from(JSON.stringify(json), 'utf8');
  if (jb.length % 4) jb = Buffer.concat([jb, Buffer.alloc(4 - (jb.length % 4), 0x20)]);
  const total = 12 + 8 + jb.length + 8 + binLen;
  const out = Buffer.alloc(total);
  out.writeUInt32LE(hong ? 0x11111111 : 0x46546c67, 0); // hỏng = sai magic "glTF"
  out.writeUInt32LE(2, 4);
  out.writeUInt32LE(total, 8);
  out.writeUInt32LE(jb.length, 12);
  out.writeUInt32LE(0x4e4f534a, 16);
  jb.copy(out, 20);
  const b = 20 + jb.length;
  out.writeUInt32LE(binLen, b);
  out.writeUInt32LE(0x004e4942, b + 4);
  Buffer.from(pos.buffer, pos.byteOffset, pos.byteLength).copy(out, b + 8);
  Buffer.from(uv.buffer, uv.byteOffset, uv.byteLength).copy(out, b + 8 + offUv);
  Buffer.from(idx.buffer, idx.byteOffset, idx.byteLength).copy(out, b + 8 + offIdx);
  return new Uint8Array(out);
}

const SPEC: VerifiedSpec = {
  name: 'Món kiểm',
  code: 'KIEM-01',
  brand: 'Hãng kiểm',
  wMm: 600,
  dMm: 600,
  hMm: 1000,
  sourceUrl: 'https://vi.du/hang/kiem-01',
};
const PHAN_LOAI_NGUOI: PhotoClassification = {
  caption: 'Một khối hộp kiểm thử',
  style: 'Trung tính',
  materials: ['Gỗ'],
  room: 'Phòng khách',
  visionModel: '-',
  nguon: { flag: 'verified', source: 'người nhập khai lúc nhập tệp khối' },
};

console.log('nhanDienCauKien — bốn bước nối được vào nhau');
{
  const r = nhanDienCauKien({
    glb: dungGlb(),
    spec: SPEC,
    phanLoai: PHAN_LOAI_NGUOI,
    mesh: { glbUrl: 'file://kiem.glb', falModel: '-', nguon: 'tệp người dùng đưa: kiem.glb' },
    sourceImageUrl: SPEC.sourceUrl,
  });

  // ① mỗi bước phải thật sự CHẠY, không phải trả rỗng cho êm
  ok('bước chuẩn nét cho ra hình học', r.chuanNet.obj.length > 0 && r.soLieu.triTruoc > 0, `${r.soLieu.triTruoc} tam giác vào`);
  ok('bước đồ thị diện cho ra diện', r.soLieu.soDien > 0, `${r.soLieu.soDien} diện`);
  ok('bước cấu kiện cho ra phần có tên', r.partLock.parts.length > 0, `${r.soLieu.soCauKien} cấu kiện`);
  ok('bản ghi .idfc mở lại được bằng chính app', r.parsed.meta.name === SPEC.name);

  // ② CỜ NGUỒN NÓI ĐÚNG SỰ THẬT — đây là khẳng định đắt nhất của lượt này
  const x = (JSON.parse(r.idfcJson) as { xFromPhoto: Record<string, never> }).xFromPhoto as unknown as {
    params: Record<string, { flag: string; source: string }>;
    mesh: { flag: string; source: string };
    classification: Record<string, { flag: string; source: string }>;
  };
  ok('số hãng mang cờ đã-xác-minh kèm nguồn', x.params.wMm.flag === 'verified' && x.params.wMm.source === SPEC.sourceUrl);
  ok('hình khối mang cờ máy-suy', x.mesh.flag === 'inferred');
  ok(
    'mesh người đưa KHÔNG bị dán nhãn fal',
    !x.mesh.source.startsWith('fal:') && x.mesh.source.includes('người dùng đưa'),
    x.mesh.source,
  );
  ok(
    'phân loại người khai KHÔNG đội lốt vision',
    !x.classification.style.source.startsWith('vision:') && x.classification.style.flag === 'verified',
    x.classification.style.source,
  );

  // ③ đường CŨ giữ nguyên hành vi — thiếu `nguon` thì vẫn ghi như trước (không đổi ngữ nghĩa file cũ)
  const cu = buildIdfcFromPhoto({
    spec: SPEC,
    classification: { caption: 'a', style: 'b', materials: [], room: 'c', visionModel: 'llama-x' },
    mesh: { glbUrl: 'u', falModel: 'fal-ai/trellis', requestId: 'r1' },
    sourceImageUrl: 'https://vi.du/anh.jpg',
  });
  const xc = (JSON.parse(cu.idfcJson) as { xFromPhoto: never }).xFromPhoto as unknown as {
    mesh: { source: string };
    classification: { style: { flag: string; source: string } };
  };
  ok('không khai nguồn ⇒ giữ nguyên hành vi cũ', xc.mesh.source === 'fal:fal-ai/trellis#r1' && xc.classification.style.source === 'vision:llama-x' && xc.classification.style.flag === 'inferred');
}

/* ══════════ HIỆU CHUẨN — phép đo phải biết NÓI KHÔNG ══════════ */
console.log('\nhiệu chuẩn — đầu vào hỏng phải bị từ chối');
{
  let nem = false;
  try {
    nhanDienCauKien({
      glb: dungGlb(true),
      spec: SPEC,
      phanLoai: PHAN_LOAI_NGUOI,
      mesh: { glbUrl: 'x', falModel: '-' },
      sourceImageUrl: SPEC.sourceUrl,
    });
  } catch {
    nem = true;
  }
  ok('GLB sai magic ⇒ NÉM, không dựng khối cho có', nem);

  let nem2 = false;
  try {
    nhanDienCauKien({
      glb: dungGlb(),
      spec: { ...SPEC, hMm: 0 },
      phanLoai: PHAN_LOAI_NGUOI,
      mesh: { glbUrl: 'x', falModel: '-' },
      sourceImageUrl: SPEC.sourceUrl,
    });
  } catch {
    nem2 = true;
  }
  ok('thiếu chiều cao thật ⇒ NÉM, không bịa số mm', nem2);
}

/* ══════════ CỬA VÀO — cấm số verified không có nguồn ══════════ */
console.log('\ndocDauVao — cổng chặn trước khi vào lõi');
{
  const nen = {
    nhanh: 'khoi',
    anhDataUri: 'data:image/png;base64,AA',
    glbBase64: 'AAAA',
    spec: { name: 'A', code: 'B', wMm: 1, dMm: 1, hMm: 1, sourceUrl: 'https://x' },
  };
  ok('đủ trường ⇒ nhận', docDauVao(nen).ok);
  ok('thiếu nguồn số đo ⇒ TỪ CHỐI', !docDauVao({ ...nen, spec: { ...nen.spec, sourceUrl: '' } }).ok);
  ok('thiếu kích thước ⇒ TỪ CHỐI', !docDauVao({ ...nen, spec: { ...nen.spec, hMm: 0 } }).ok);
  ok('nhánh lạ ⇒ TỪ CHỐI', !docDauVao({ ...nen, nhanh: 'bua' }).ok);
  ok('không có ảnh ⇒ TỪ CHỐI', !docDauVao({ ...nen, anhDataUri: '' }).ok);
  ok('nhánh khối mà không có tệp khối ⇒ TỪ CHỐI', !docDauVao({ ...nen, glbBase64: '' }).ok);
  const d = docDauVao(nen);
  ok(
    'phân loại nhánh khối khai đúng là NGƯỜI khai',
    d.ok && d.dauVao.phanLoai.nguon?.flag === 'verified' && !d.dauVao.phanLoai.nguon.source.startsWith('vision:'),
  );
}

console.log(`\n${pass} pass · ${fail.length} fail`);
if (fail.length) {
  console.error('FAIL:', fail.join(' | '));
  process.exit(1);
}
