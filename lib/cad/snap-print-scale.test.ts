/**
 * lib/cad/snap-print-scale.test.ts — VIỆC 1 `ty-le-chuan` (docs/CHUAN-DAU-RA-NGHE.md §1):
 * fit-trang phải BẮT về nấc tỉ lệ chuẩn phía nhỏ hơn, cấm in số lẻ kiểu "1:47".
 *
 * Chạy: node_modules/.bin/sucrase-node lib/cad/snap-print-scale.test.ts
 */
import assert from 'node:assert';
import { emptyDoc, snapPrintScale, isStandardPrintScale, PRINT_SCALE_STEPS, STANDARD_SCALES, docBox, paperSizeMm } from './model';
import type { Doc } from './model';
import { newId } from './id';
import { resolveExportScaleN, DEFAULT_PDF_MARGIN_MM } from './pdf';

let pass = 0;
function test(name: string, fn: () => void) {
  fn();
  pass++;
  console.log(`  ✓ ${name}`);
}

test('1:47 → 1:50 (nấc chuẩn gần nhất phía nhỏ — đúng ca lỗi layout.pdf 11/08)', () => {
  assert.strictEqual(snapPrintScale(47), 50);
});

test('1:12 → 1:20', () => {
  assert.strictEqual(snapPrintScale(12), 20);
});

test('1:200 → 1:200 (đã là nấc chuẩn thì giữ nguyên)', () => {
  assert.strictEqual(snapPrintScale(200), 200);
});

test('mọi nấc chuẩn tự bắt về chính nó (kể cả lệch epsilon float)', () => {
  for (const n of PRINT_SCALE_STEPS) {
    assert.strictEqual(snapPrintScale(n), n);
    assert.strictEqual(snapPrintScale(n * (1 + 1e-12)), n);
  }
});

test('vượt 1:500 → trả 500 (caller tự kiểm fitsAtScale — xem docstring)', () => {
  assert.strictEqual(snapPrintScale(760), 500);
});

test('N hỏng (0/âm/NaN) → 100 an toàn', () => {
  assert.strictEqual(snapPrintScale(0), 100);
  assert.strictEqual(snapPrintScale(-3), 100);
  assert.strictEqual(snapPrintScale(NaN), 100);
});

test('PRINT_SCALE_STEPS = [1,2,5] + STANDARD_SCALES nguyên vẹn (không sửa dãy cũ)', () => {
  assert.deepStrictEqual([...PRINT_SCALE_STEPS], [1, 2, 5, ...STANDARD_SCALES]);
  assert.ok(isStandardPrintScale(50) && !isStandardPrintScale(47));
});

test('resolveExportScaleN: auto-fit LUÔN ra nấc chuẩn cho bản vẽ căn hộ thường', () => {
  // 12m×8m trên A3 ngang — fit thô ~1:31 → phải bắt về 1:50.
  const doc: Doc = emptyDoc();
  const wall = doc.layers[0].id;
  doc.entities.push({ id: newId('e'), type: 'line', layer: wall, a: { x: 0, y: 0 }, b: { x: 12000, y: 8000 } });
  const [pw, ph] = paperSizeMm('A3', 'landscape');
  const n = resolveExportScaleN(doc, pw, ph, DEFAULT_PDF_MARGIN_MM);
  assert.strictEqual(n, 50, `mong 1:50, ra 1:${n}`);
  assert.ok(n !== null && isStandardPrintScale(n));
});

test('resolveExportScaleN: printScale người dùng chọn tường minh được TÔN TRỌNG (gate sẽ báo nếu lẻ)', () => {
  const doc: Doc = emptyDoc();
  const wall = doc.layers[0].id;
  doc.entities.push({ id: newId('e'), type: 'line', layer: wall, a: { x: 0, y: 0 }, b: { x: 3000, y: 2000 } });
  doc.printScale = 47; // cố ý lẻ nhưng lọt giấy
  const [pw, ph] = paperSizeMm('A3', 'landscape');
  assert.strictEqual(resolveExportScaleN(doc, pw, ph, DEFAULT_PDF_MARGIN_MM), 47);
});

test('resolveExportScaleN: bản vẽ vượt cả 1:500 → null (không im lặng in số lẻ)', () => {
  const doc: Doc = emptyDoc();
  const wall = doc.layers[0].id;
  // 400m — không nấc ≤500 nào lọt A4.
  doc.entities.push({ id: newId('e'), type: 'line', layer: wall, a: { x: 0, y: 0 }, b: { x: 400_000, y: 300_000 } });
  const [pw, ph] = paperSizeMm('A4', 'portrait');
  assert.strictEqual(resolveExportScaleN(doc, pw, ph, DEFAULT_PDF_MARGIN_MM), null);
  assert.ok(docBox(doc) !== null);
});

console.log(`\n${pass} ok`);
