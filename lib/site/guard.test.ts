import assert from 'node:assert';
import { apSiet, kiemChiSiet, type NguongLuat } from './guard';

let pass = 0;
function test(name: string, fn: () => void) {
  fn();
  pass++;
  console.log(`  ✓ ${name}`);
}

const PCCC: NguongLuat = { id: 'vn-fire-exit-width', min: 800, binding: 'mandatory' };
const LOI_DI: NguongLuat = { id: 'neufert-kitchen-aisle', min: 1200, binding: 'adjustable' };

test('siết thêm (min tăng) và thêm luật mới → 0 vi phạm', () => {
  const sau = [{ ...PCCC, min: 900 }, LOI_DI, { id: 'ven-bien-inox', min: 316, binding: 'mandatory' as const }];
  assert.deepStrictEqual(kiemChiSiet([PCCC, LOI_DI], sau), []);
});

test('hạ min luật bắt buộc → vi phạm; hạ min luật adjustable → KHÔNG vi phạm (không phải luật bắt buộc)', () => {
  assert.deepStrictEqual(kiemChiSiet([PCCC], [{ ...PCCC, min: 700 }]), [{ id: PCCC.id, truong: 'min', truoc: 800, sau: 700 }]);
  assert.deepStrictEqual(kiemChiSiet([LOI_DI], [{ ...LOI_DI, min: 900 }]), []);
});

test('xoá hẳn luật bắt buộc = nới vô cực → vi phạm', () => {
  const v = kiemChiSiet([PCCC], []);
  assert.strictEqual(v.length, 1);
  assert.strictEqual(v[0].sau, Number.NEGATIVE_INFINITY);
});

test('apSiet: delta nới bị TỪ CHỐI và báo lại, delta siết được áp, luật mới được thêm', () => {
  const { ketQua, biTuChoi } = apSiet([PCCC, { id: 'max-noise', max: 45, binding: 'mandatory' }], [
    { id: PCCC.id, min: 700, binding: 'mandatory' },
    { id: 'max-noise', max: 40, binding: 'mandatory' },
    { id: 'chong-an-mon', min: 1, binding: 'mandatory' },
  ]);
  assert.deepStrictEqual(biTuChoi, [{ id: PCCC.id, truong: 'min', truoc: 800, sau: 700 }]);
  assert.strictEqual(ketQua.find((r) => r.id === PCCC.id)!.min, 800);
  assert.strictEqual(ketQua.find((r) => r.id === 'max-noise')!.max, 40);
  assert.ok(ketQua.some((r) => r.id === 'chong-an-mon'));
  assert.deepStrictEqual(kiemChiSiet([PCCC], ketQua), [], 'kết quả apSiet luôn qua kiemChiSiet');
});

console.log(`guard: ${pass} pass`);
