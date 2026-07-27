/**
 * lib/cad/ifpack.test.ts — round-trip buildIfpack/restoreIfpack (T4, VIỆC 5, 28/07).
 * Chạy: node_modules/.bin/sucrase-node lib/cad/ifpack.test.ts
 */
import { buildIfpack, restoreIfpack } from './ifpack';
import type { IdfSheetData } from './idf';
import { emptyDoc } from './model';
import type { Doc } from './model';
import { newId } from './store';
import { createMarkupPin, createPhotoEmbed } from './markup';

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

// PNG 1x1 đỏ thật (không phải chuỗi giả) — để decode/encode base64 round-trip có ý nghĩa.
const TINY_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

function buildDocWithPhoto(): Doc {
  const doc = emptyDoc();
  const wall = doc.layers[0].id;
  doc.entities.push(
    { id: newId('e'), type: 'line', layer: wall, a: { x: 0, y: 0 }, b: { x: 3000, y: 0 } },
    { id: newId('e'), type: 'rect', layer: wall, x: 0, y: 0, w: 4000, h: 3000 },
  );
  doc.markups = [createMarkupPin({ x: 500, y: 500 }, 'Ghi chú hiện trường', '#e0603a', 1700000000000)];
  doc.photos = [createPhotoEmbed({ x: 1000, y: 1000 }, TINY_PNG, 'ảnh hiện trạng', 1700000001000)];
  return doc;
}

async function testRoundtrip() {
  console.log('\n[1] .ifpack round-trip — bản vẽ + ảnh markup giữ nguyên sau xuất/phục hồi');
  const sheets: IdfSheetData[] = [{ id: 'cadsheet-0', name: 'Bản vẽ 1', doc: buildDocWithPhoto() }];
  const blob = await buildIfpack(sheets, { id: 'proj-1', name: 'Dự án demo' });
  ok('buildIfpack trả về Blob có dung lượng > 0', blob.size > 0);

  const buf = await blob.arrayBuffer();
  const restored = await restoreIfpack(buf);
  ok('restoreIfpack thành công (không null)', restored !== null);
  if (!restored) return;

  ok('meta.name giữ đúng', restored.meta.name === 'Dự án demo');
  ok('meta.id giữ đúng', restored.meta.id === 'proj-1');
  ok('packVersion có giá trị', restored.meta.packVersion === 1);
  ok('không có cảnh báo toàn vẹn (file tự dựng, hash phải khớp)', restored.integrityWarnings.length === 0);

  ok('đúng 1 sheet', restored.sheets.length === 1);
  const back = restored.sheets[0];
  ok('sheet id/name giữ nguyên', back.id === 'cadsheet-0' && back.name === 'Bản vẽ 1');
  ok('đúng 2 entity (line+rect)', back.doc.entities.length === 2);
  ok('markup giữ nguyên', back.doc.markups?.[0]?.text === 'Ghi chú hiện trường');

  const photo = back.doc.photos?.[0];
  ok('ảnh markup còn đúng 1 tấm', back.doc.photos?.length === 1);
  ok('ảnh phục hồi ĐÚNG data URL gốc (round-trip byte-for-byte qua base64)', photo?.src === TINY_PNG);
  ok('caption ảnh giữ nguyên', photo?.caption === 'ảnh hiện trạng');
}

async function testIntegrityWarningOnTamper() {
  console.log('\n[2] drawing.idf bị sửa SAU khi xuất (hash không còn khớp manifest.json) → cảnh báo, KHÔNG chặn phục hồi');
  const sheets: IdfSheetData[] = [{ id: 'cadsheet-0', name: 'Bản vẽ 1', doc: buildDocWithPhoto() }];
  const blob = await buildIfpack(sheets, { id: 'proj-2', name: 'Dự án B' });
  const buf = await blob.arrayBuffer();

  // Mở lại zip (vẫn HỢP LỆ về cấu trúc), ghi ĐÈ drawing.idf bằng nội dung khác — mô phỏng ai đó
  // chỉnh tay file trong .ifpack sau khi xuất — nhưng KHÔNG cập nhật manifest.json theo, nên hash
  // ghi trong manifest không còn khớp nội dung thật.
  const JSZipMod = await import('jszip');
  const JSZip = JSZipMod.default;
  const zip = await JSZip.loadAsync(buf);
  const originalIdf = await zip.file('drawing.idf')!.async('string');
  zip.file('drawing.idf', originalIdf.replace('"Bản vẽ 1"', '"Bản vẽ ĐÃ SỬA"'));
  const tamperedBuf = await zip.generateAsync({ type: 'arraybuffer' });

  const restored = await restoreIfpack(tamperedBuf);
  ok('drawing.idf vẫn parse được dù hash lệch (không chặn phục hồi)', restored !== null);
  ok('nhưng CÓ cảnh báo toàn vẹn nhắc đúng drawing.idf', !!restored?.integrityWarnings.some((w) => w.includes('drawing.idf')));
  ok('nội dung phục hồi ĐÚNG bản đã sửa (không âm thầm dùng bản cũ)', restored?.sheets[0]?.name === 'Bản vẽ ĐÃ SỬA');
}

async function testCorruptZipDoesNotThrow() {
  console.log('\n[3] File KHÔNG PHẢI zip hợp lệ (byte rác) → null, không throw crash app');
  let threw = false;
  let restored: unknown;
  try {
    const garbage = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]).buffer;
    restored = await restoreIfpack(garbage);
  } catch {
    threw = true;
  }
  ok('không throw', !threw);
  ok('trả null', restored === null);
}

async function testMissingParts() {
  console.log('\n[4] File thiếu project.json/drawing.idf → null, không throw');
  const JSZipMod = await import('jszip');
  const JSZip = JSZipMod.default;
  const zip = new JSZip();
  zip.file('project.json', '{}'); // thiếu drawing.idf
  const buf = await zip.generateAsync({ type: 'arraybuffer' });
  const restored = await restoreIfpack(buf);
  ok('thiếu drawing.idf → null', restored === null);
}

async function main() {
  await testRoundtrip();
  await testIntegrityWarningOnTamper();
  await testCorruptZipDoesNotThrow();
  await testMissingParts();
  console.log(`\n${pass} ok, ${fail} fail`);
  if (fail > 0) process.exit(1);
}

main();
