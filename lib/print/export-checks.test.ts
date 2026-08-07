/**
 * lib/print/export-checks.test.ts — danh sách kiểm "TRƯỚC KHI XUẤT" của Màn 7.
 *
 * Điều quan trọng nhất cần khoá: mỗi dòng kiểm phải ĐỔI THEO Doc THẬT. Mock vẽ 5 dòng "✓ đã chạy"
 * cứng; nếu code lỡ quay lại kiểu đó thì test này đỏ ngay (một Doc sạch và một Doc hỏng phải cho
 * kết quả KHÁC nhau).
 */

import assert from 'node:assert';
import { emptyDoc } from '../cad/model';
import type { Doc, Layer, LineEntity } from '../cad/model';
import { buildExportChecks } from './export-checks';

let pass = 0;
function test(name: string, fn: () => void) {
  fn();
  pass++;
  console.log(`  ✓ ${name}`);
}

const layer = (id: string, lineweight?: number): Layer => ({
  id,
  name: id,
  color: '#000000',
  visible: true,
  locked: false,
  lineweight,
});

const line = (id: string, layerId: string, a: [number, number], b: [number, number], lw?: number): LineEntity => ({
  id,
  type: 'line',
  layer: layerId,
  a: { x: a[0], y: a[1] },
  b: { x: b[0], y: b[1] },
  ...(lw === undefined ? {} : { lineweight: lw }),
});

/** Doc "sạch": 1 layer, mọi nét dùng layer đó, nằm quanh gốc, nét đủ dày. */
function docSach(): Doc {
  const d = emptyDoc();
  d.layers = [layer('l1', 0.35)];
  d.entities = [line('e1', 'l1', [0, 0], [4000, 0]), line('e2', 'l1', [0, 0], [0, 3000])];
  return d;
}

const nhan = (items: { label: string }[]) => items.map((i) => i.label).join(' | ');
const soDongHong = (items: { ok: boolean }[]) => items.filter((i) => !i.ok).length;

test('Doc SẠCH → mọi dòng đều ✓', () => {
  const items = buildExportChecks(docSach(), 'A3', 'landscape');
  assert.strictEqual(soDongHong(items), 0, `còn dòng hỏng: ${nhan(items.filter((i) => !i.ok))}`);
  assert.ok(items.length >= 4, 'phải kiểm ít nhất 4 điều, không phải 1 dòng cho có');
});

test('Doc TRỐNG → báo trống, và KHÔNG khẳng định bừa về gốc toạ độ', () => {
  const items = buildExportChecks(emptyDoc(), 'A3', 'landscape');
  assert.ok(items.some((i) => !i.ok && /trống/i.test(i.label)), nhan(items));
  // docBox = null khi không có nét ⇒ không đo được vị trí ⇒ không được sinh dòng "đã về gốc".
  assert.ok(!items.some((i) => /gốc/i.test(i.label)), `không được đoán về gốc toạ độ: ${nhan(items)}`);
});

test('LAYER THỪA (không nét nào dùng) → bắt được, đếm đúng số', () => {
  const d = docSach();
  d.layers = [layer('l1', 0.35), layer('thua-1', 0.25), layer('thua-2', 0.25)];
  const items = buildExportChecks(d, 'A3', 'landscape');
  const dong = items.find((i) => /PURGE/.test(i.label));
  assert.ok(dong && !dong.ok, nhan(items));
  assert.ok(/\b2 layer\b/.test(dong!.label), `phải đếm đúng 2: ${dong!.label}`);
});

test('NÉT MẢNH hơn sàn in được → bắt được; nét dày thì im lặng', () => {
  const d = docSach();
  d.entities.push(line('mong', 'l1', [0, 0], [10, 10], 0.02)); // 0.02mm < sàn 0.1mm
  const items = buildExportChecks(d, 'A3', 'landscape');
  const dong = items.find((i) => /mảnh hơn/.test(i.label));
  assert.ok(dong && !dong.ok, nhan(items));
  assert.strictEqual(soDongHong(buildExportChecks(docSach(), 'A3', 'landscape')), 0);
});

test('nét KHÔNG tự khai bề dày thì lấy theo LAYER của nó', () => {
  const d = docSach();
  d.layers = [layer('l1', 0.02)]; // layer mảnh hơn sàn, entity không override
  const items = buildExportChecks(d, 'A3', 'landscape');
  assert.ok(items.some((i) => !i.ok && /mảnh hơn/.test(i.label)), nhan(items));
});

test('BẢN VẼ XA GỐC 0,0 → bắt được và nói rõ cách bao nhiêu mét', () => {
  const d = docSach();
  d.entities = [line('e1', 'l1', [900_000, 900_000], [904_000, 900_000])]; // cách gốc 900m
  const items = buildExportChecks(d, 'A3', 'landscape');
  const dong = items.find((i) => /gốc/.test(i.label));
  assert.ok(dong && !dong.ok, nhan(items));
  assert.ok(/900m/.test(dong!.label), `phải nói đúng khoảng cách: ${dong!.label}`);
});

test('TỈ LỆ không lọt khổ → báo hỏng kèm gợi ý tỉ lệ khác', () => {
  const d = docSach();
  d.entities = [line('e1', 'l1', [0, 0], [50_000, 0])]; // 50m ngang
  d.printScale = 10; // 1:10 ⇒ 5000mm trên giấy, A3 chỉ 420mm
  const items = buildExportChecks(d, 'A3', 'landscape');
  const dong = items.find((i) => /1:10/.test(i.label));
  assert.ok(dong && !dong.ok, nhan(items));
  assert.ok(/thử 1:\d+/.test(dong!.label), `phải gợi ý tỉ lệ thay thế: ${dong!.label}`);
});

test('ĐỔI KHỔ GIẤY thì dòng tỉ lệ đổi theo — đây là điều làm nó "thật"', () => {
  const d = docSach();
  d.entities = [line('e1', 'l1', [0, 0], [30_000, 0])]; // 30m
  d.printScale = 100; // 300mm trên giấy: lọt A3 (420) nhưng KHÔNG lọt A4 (297)
  const a3 = buildExportChecks(d, 'A3', 'landscape').find((i) => /1:100/.test(i.label))!;
  const a4 = buildExportChecks(d, 'A4', 'landscape').find((i) => /1:100/.test(i.label))!;
  assert.strictEqual(a3.ok, true, a3.label);
  assert.strictEqual(a4.ok, false, a4.label);
});

test('ĐỔI HƯỚNG GIẤY cũng đổi kết quả (ngang ≠ dọc, không phải nhãn suông)', () => {
  const d = docSach();
  d.entities = [line('e1', 'l1', [0, 0], [35_000, 0])];
  d.printScale = 100; // 350mm: lọt A3 ngang (420) — không lọt A3 dọc (297)
  const ngang = buildExportChecks(d, 'A3', 'landscape').find((i) => /1:100/.test(i.label))!;
  const doc2 = buildExportChecks(d, 'A3', 'portrait').find((i) => /1:100/.test(i.label))!;
  assert.strictEqual(ngang.ok, true, ngang.label);
  assert.strictEqual(doc2.ok, false, doc2.label);
  assert.ok(/ngang/.test(ngang.label) && /dọc/.test(doc2.label));
});

test('không có printScale (tự động fit) thì không bị báo hỏng oan', () => {
  const d = docSach();
  delete d.printScale;
  const dong = buildExportChecks(d, 'A4', 'portrait').find((i) => /Tỉ lệ/.test(i.label))!;
  assert.strictEqual(dong.ok, true, dong.label);
});

console.log(`\nexport-checks.test.ts — ${pass}/${pass} PASS`);
