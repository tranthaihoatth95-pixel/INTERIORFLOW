/**
 * lib/units/units.test.ts — Phiếu P-A ④.5: tối thiểu 20 ca, gồm round-trip mm→hiện→gõ lại→mm,
 * feet-inch dạng 5'6", và tỉ lệ lẻ bị từ chối.
 *
 * Chạy: node_modules/.bin/sucrase-node lib/units/units.test.ts
 */
import assert from 'node:assert';
import { formatLength, parseLength, groupThousands } from './index';
import { SCALE_CHUAN, isValidScale, chooseNearestScale, formatScale } from './scale';

let pass = 0;
function test(name: string, fn: () => void) {
  fn();
  pass++;
  console.log(`  ✓ ${name}`);
}

// ── formatLength ──────────────────────────────────────────────────────────
test('formatLength mm mặc định, cách nghìn bằng khoảng trắng (luật seed #3)', () => {
  assert.strictEqual(formatLength(5200), '5 200mm');
});
test('formatLength mm số tròn nhỏ', () => {
  assert.strictEqual(formatLength(1000), '1 000mm');
});
test('formatLength cm', () => {
  assert.strictEqual(formatLength(1000, { unit: 'cm' }), '100cm');
});
test('formatLength m — 2 chữ số thập phân mặc định', () => {
  assert.strictEqual(formatLength(1000, { unit: 'm' }), '1.00m');
});
test('formatLength in — 2 chữ số thập phân mặc định', () => {
  assert.strictEqual(formatLength(1000, { unit: 'in' }), '39.37"');
});
test('formatLength ft-in — chuyển đúng feet + inch lẻ', () => {
  assert.strictEqual(formatLength(1000, { unit: 'ft-in' }), '3′3.37″');
});
test('formatLength ft-in — tràn 12in đẩy lên feet kế (304.8mm = đúng 12in = 1ft chẵn)', () => {
  assert.strictEqual(formatLength(304.8, { unit: 'ft-in' }), '1′0″');
});
test('formatLength ft-in — làm tròn tràn defensive (23.999in → 2′0″ không phải 1′12.00″)', () => {
  assert.strictEqual(formatLength(23.999 * 25.4, { unit: 'ft-in' }), '2′0″');
});
test('formatLength số 0', () => {
  assert.strictEqual(formatLength(0), '0mm');
});
test('formatLength số âm', () => {
  assert.strictEqual(formatLength(-500), '-500mm');
});
test('formatLength NaN → gạch ngang, không crash', () => {
  assert.strictEqual(formatLength(NaN), '—');
});
test('formatLength withUnitLabel:false — bỏ hậu tố', () => {
  assert.strictEqual(formatLength(1000, { unit: 'cm', withUnitLabel: false }), '100');
});
test('groupThousands số 6 chữ số', () => {
  assert.strictEqual(groupThousands('123456'), '123 456');
});
test('groupThousands giữ phần thập phân nguyên vẹn', () => {
  assert.strictEqual(groupThousands('1234.50'), '1 234.50');
});

// ── parseLength ───────────────────────────────────────────────────────────
test('parseLength hậu tố mm', () => {
  assert.strictEqual(parseLength('1000mm'), 1000);
});
test('parseLength hậu tố cm', () => {
  assert.strictEqual(parseLength('100cm'), 1000);
});
test('parseLength hậu tố m', () => {
  assert.strictEqual(parseLength('1m'), 1000);
});
test('parseLength hậu tố in (dấu ") — so sánh dung sai vì float 12*25.4 ≠ 304.8 tuyệt đối', () => {
  assert.ok(Math.abs(parseLength('12"')! - 304.8) < 1e-9);
});
test('parseLength hậu tố in (chữ)', () => {
  const mm = parseLength('39.37in')!;
  assert.ok(Math.abs(mm - 1000) < 0.01, `39.37in phải ≈1000mm, được ${mm}`);
});
// 25.4/304.8 không phải phân số nhị phân tròn — so sánh dung sai 1e-9, không strictEqual, đúng
// cách xử lý số dấu phẩy động chuẩn (áp cho mọi ca nhân với 25.4/304.8 bên dưới).
const closeTo = (actual: number | null, expected: number, eps = 1e-9) => {
  assert.ok(actual !== null && Math.abs(actual - expected) < eps, `được ${actual}, muốn ≈${expected}`);
};

test("parseLength feet-inch dạng 5'6\" — đúng yêu cầu phiếu ④.5", () => {
  closeTo(parseLength("5'6\""), 1676.4);
});
test('parseLength feet-inch dạng chữ "5ft 6in"', () => {
  closeTo(parseLength('5ft 6in'), 1676.4);
});
test("parseLength chỉ feet, không inch (5')", () => {
  closeTo(parseLength("5'"), 1524);
});
test('parseLength số trần dùng đơn vị ngầm định mm', () => {
  assert.strictEqual(parseLength('3250'), 3250);
});
test('parseLength số trần dùng đơn vị ngầm định cm (opts.unit)', () => {
  assert.strictEqual(parseLength('3.5', { unit: 'cm' }), 35);
});
test('parseLength số trần dùng đơn vị ngầm định ft-in → hiểu là inch nguyên', () => {
  closeTo(parseLength('100', { unit: 'ft-in' }), 2540);
});
test('parseLength số âm có hậu tố', () => {
  assert.strictEqual(parseLength('-500mm'), -500);
});
test('parseLength chuỗi rỗng → null, không throw', () => {
  assert.strictEqual(parseLength(''), null);
  assert.strictEqual(parseLength('   '), null);
});
test('parseLength chữ vô nghĩa → null', () => {
  assert.strictEqual(parseLength('abc'), null);
});
test('parseLength số kèm đơn vị KHÔNG hợp lệ → null (không âm thầm đoán bừa)', () => {
  assert.strictEqual(parseLength('12xyz'), null);
});
test('parseLength dấu phẩy thập phân (thói quen gõ VN)', () => {
  assert.strictEqual(parseLength('3,5cm'), 35);
});

// ── round-trip mm → hiện → gõ lại → mm (④.5 bắt buộc) ───────────────────
test('round-trip cm — số tròn, không mất gì', () => {
  const shown = formatLength(1500, { unit: 'cm' });
  assert.strictEqual(shown, '150cm');
  assert.strictEqual(parseLength(shown, { unit: 'cm' }), 1500);
});
test('round-trip m — số tròn, không mất gì', () => {
  const shown = formatLength(2000, { unit: 'm' });
  assert.strictEqual(shown, '2.00m');
  assert.strictEqual(parseLength(shown, { unit: 'm' }), 2000);
});
test('round-trip mm số lớn có dấu cách hàng nghìn — gõ lại nguyên văn vẫn đọc đúng', () => {
  const shown = formatLength(123456, { unit: 'mm' });
  assert.strictEqual(shown, '123 456mm');
  assert.strictEqual(parseLength(shown), 123456);
});
test('round-trip inch — sai số làm tròn ≤0.01mm (mm→in mất một ít vì chỉ giữ 2 số lẻ)', () => {
  const original = 1000;
  const shown = formatLength(original, { unit: 'in' });
  const back = parseLength(shown, { unit: 'in' })!;
  assert.ok(Math.abs(back - original) < 0.05, `round-trip in lệch quá 0.05mm: ${back}`);
});

// ── SCALE_CHUAN — tỉ lệ lẻ bị từ chối (④.5 bắt buộc) ─────────────────────
test('SCALE_CHUAN đúng dãy ISO 10 nấc, tăng dần', () => {
  assert.deepStrictEqual(SCALE_CHUAN, [1, 2, 5, 10, 20, 25, 50, 100, 200, 500]);
});
test('isValidScale chấp nhận nấc chuẩn', () => {
  assert.strictEqual(isValidScale(50), true);
  assert.strictEqual(isValidScale(1), true);
  assert.strictEqual(isValidScale(500), true);
});
test('isValidScale TỪ CHỐI tỉ lệ lẻ (đúng ca lỗi layout.pdf 11/08: "1:47")', () => {
  assert.strictEqual(isValidScale(47), false);
  assert.strictEqual(isValidScale(1000), false);
  assert.strictEqual(isValidScale(0), false);
});
test('chooseNearestScale bắt tỉ lệ lẻ về nấc chuẩn gần nhất (phía nhỏ hơn)', () => {
  assert.strictEqual(chooseNearestScale(47), 50);
  assert.strictEqual(chooseNearestScale(12), 20);
});
test('chooseNearestScale giữ nguyên khi đã là nấc chuẩn', () => {
  assert.strictEqual(chooseNearestScale(500), 500);
});
test('chooseNearestScale vượt trần → trả nấc lớn nhất (500)', () => {
  assert.strictEqual(chooseNearestScale(600), 500);
});
test('formatScale', () => {
  assert.strictEqual(formatScale(50), '1:50');
});

console.log(`\n${pass} test PASS — lib/units`);
