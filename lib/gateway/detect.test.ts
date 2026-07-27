/**
 * lib/gateway/detect.test.ts — detectFormat/routeFormat (NT2, VIỆC ②), theo pattern lib/cad/idf.test.ts.
 * Chạy: node_modules/.bin/sucrase-node lib/gateway/detect.test.ts
 */
import { detectFormat } from './detect';
import { routeFormat } from './route';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) {
    pass += 1;
    console.log(`  ok  - ${label}`);
  } else {
    fail += 1;
    console.log(`  FAIL - ${label}`);
  }
}

function bytes(...vals: number[]): Uint8Array {
  return new Uint8Array(vals);
}

function textBytes(s: string): Uint8Array {
  return new Uint8Array(Array.from(s, (c) => c.charCodeAt(0)));
}

/* ── 1) chỉ có đuôi tên (không bytes) → tra theo đuôi ── */
console.log('\n[1] Không có bytes — nhận theo đuôi tên');
ok('.idf → idf', detectFormat({ name: 'ban-ve.idf' }) === 'idf');
ok('.dxf → dxf', detectFormat({ name: 'mat-bang.DXF' }) === 'dxf');
ok('.dwg → dwg', detectFormat({ name: 'ban-ve.dwg' }) === 'dwg');
ok('.ifpack → ifpack', detectFormat({ name: 'backup.ifpack' }) === 'ifpack');
ok('.pptx → pptx', detectFormat({ name: 'deck.pptx' }) === 'pptx');
ok('.pdf → pdf', detectFormat({ name: 'brief.pdf' }) === 'pdf');
ok('.xlsx → xlsx', detectFormat({ name: 'boq.xlsx' }) === 'xlsx');
ok('.csv → csv', detectFormat({ name: 'list.csv' }) === 'csv');
ok('.jpg → image', detectFormat({ name: 'photo.jpg' }) === 'image');
ok('.png → image', detectFormat({ name: 'photo.png' }) === 'image');
ok('đuôi lạ → unknown', detectFormat({ name: 'note.xyz' }) === 'unknown');
ok('không đuôi → unknown', detectFormat({ name: 'README' }) === 'unknown');

/* ── 2) magic byte THẮNG đuôi tên khi user đổi tên file ── */
console.log('\n[2] Đổi tên file — magic byte phải thắng đuôi sai');
ok(
  'thật ra là PNG nhưng đặt đuôi .jpg → vẫn nhận image',
  detectFormat({ name: 'fake.jpg', bytes: bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a) }) === 'image',
);
ok(
  'thật ra là JPEG nhưng đặt đuôi .png → vẫn nhận image',
  detectFormat({ name: 'fake.png', bytes: bytes(0xff, 0xd8, 0xff, 0xe0) }) === 'image',
);
ok(
  'WEBP (RIFF....WEBP) đặt đuôi .png → vẫn nhận image',
  detectFormat({
    name: 'fake.png',
    bytes: bytes(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50),
  }) === 'image',
);
ok(
  '%PDF thật nhưng đặt đuôi .dxf → vẫn nhận pdf',
  detectFormat({ name: 'fake.dxf', bytes: bytes(0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34) }) === 'pdf',
);
ok(
  'DWG (AC1027) đặt đuôi .dxf → vẫn nhận dwg',
  detectFormat({ name: 'fake.dxf', bytes: textBytes('AC1027binarydata...') }) === 'dwg',
);

/* ── 3) ZIP-based (.pptx/.xlsx/.ifpack) — phân biệt bằng ruột, không chỉ PK header chung ── */
console.log('\n[3] ZIP-based — soi ruột để phân biệt pptx/xlsx/ifpack đổi đuôi lẫn nhau');
const zipHeader = [0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
function zipEntry(name: string): Uint8Array {
  return new Uint8Array([...zipHeader, ...Array.from(name, (c) => c.charCodeAt(0))]);
}
ok('.ifpack đổi đuôi thành .pptx → soi ruột vẫn nhận ifpack', detectFormat({ name: 'backup.pptx', bytes: (() => {
  const withManifest = new Uint8Array([...zipEntry('manifest.json'), ...textBytes('drawing.idf project.json')]);
  return withManifest;
})() }) === 'ifpack');
ok(
  '.pptx thật (ruột ppt/presentation.xml) đặt đuôi .ifpack → vẫn nhận pptx',
  detectFormat({ name: 'deck.ifpack', bytes: zipEntry('ppt/presentation.xml') }) === 'pptx',
);
ok(
  '.xlsx thật (ruột xl/workbook.xml) đặt đuôi .zip → vẫn nhận xlsx',
  detectFormat({ name: 'boq.zip', bytes: zipEntry('xl/workbook.xml') }) === 'xlsx',
);
ok(
  'ZIP hợp lệ nhưng không soi được ruột (bytes cắt cụt) → rơi về đuôi tên nếu đuôi là zip-based đã biết',
  detectFormat({ name: 'deck.pptx', bytes: bytes(0x50, 0x4b, 0x03, 0x04) }) === 'pptx',
);
ok(
  'ZIP lạ hoàn toàn (không rõ ruột, đuôi cũng lạ) → unknown, không đoán bừa',
  detectFormat({ name: 'archive.zip', bytes: bytes(0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0) }) === 'unknown',
);

/* ── 4) route theo bảng ánh xạ định dạng → đích ── */
console.log('\n[4] routeFormat — bảng ánh xạ định dạng → đích');
ok('idf → cad-open-project', routeFormat('idf', 'cad').kind === 'cad-open-project');
ok('dxf → cad-import-drawing', routeFormat('dxf', 'cad').kind === 'cad-import-drawing');
ok('dwg → cad-import-drawing', routeFormat('dwg', 'render').kind === 'cad-import-drawing');
ok('ifpack → cad-restore-project (gọi từ bất kỳ chặng nào)', routeFormat('ifpack', 'present').kind === 'cad-restore-project');
ok('pptx → present-import-deck', routeFormat('pptx', 'cad').kind === 'present-import-deck');
ok('pdf → present-import-deck', routeFormat('pdf', 'render').kind === 'present-import-deck');
ok('xlsx → library-bulk-ingest', routeFormat('xlsx', 'present').kind === 'library-bulk-ingest');
ok('csv → library-bulk-ingest', routeFormat('csv', 'cad').kind === 'library-bulk-ingest');
ok('unknown → unsupported (kèm format gốc)', (() => {
  const r = routeFormat('unknown', 'cad');
  return r.kind === 'unsupported' && r.format === 'unknown';
})());

/* ── 5) ảnh — đích tuỳ chặng đang gọi (KHÔNG cố định theo định dạng) ── */
console.log('\n[5] ảnh — đích tuỳ chặng gọi Gateway');
ok('ảnh gọi từ CAD → place-image stage=cad', (() => {
  const r = routeFormat('image', 'cad');
  return r.kind === 'place-image' && r.stage === 'cad';
})());
ok('ảnh gọi từ Render → place-image stage=render', (() => {
  const r = routeFormat('image', 'render');
  return r.kind === 'place-image' && r.stage === 'render';
})());
ok('ảnh gọi từ Present → place-image stage=present', (() => {
  const r = routeFormat('image', 'present');
  return r.kind === 'place-image' && r.stage === 'present';
})());

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
