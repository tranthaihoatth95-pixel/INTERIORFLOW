/**
 * lib/materials/matid-identity.test.ts — canh contract 2 namespace (UUID canonical vs sku business
 * key) không lẫn. Hoà chốt hòa giải 19/08.
 *
 * Chạy: node_modules/.bin/sucrase-node lib/materials/matid-identity.test.ts
 */
import {
  isMatIdUuid,
  normalizeMatIdCanonical,
  normalizeSkuBusinessKey,
  resolveInputMatId,
  generateMatId,
  type SkuToMatIdMapping,
} from './matid-identity';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean, detail?: string) {
  if (cond) {
    pass += 1;
  } else {
    fail += 1;
    console.error('  ✗', name, detail ?? '');
  }
}

console.log('isMatIdUuid — nhận diện UUID hợp lệ');
ok('UUID v4 lowercase', isMatIdUuid('a1b2c3d4-e5f6-4789-8abc-def012345678'));
ok('UUID v4 uppercase', isMatIdUuid('A1B2C3D4-E5F6-4789-8ABC-DEF012345678'));
ok('UUID mixed case + trim', isMatIdUuid('  a1b2c3d4-e5f6-4789-8ABC-def012345678  '));
ok('UUID v1', isMatIdUuid('a1b2c3d4-e5f6-1789-8abc-def012345678'));
ok('không phải UUID — sku', !isMatIdUuid('SW-TRV-BE'));
ok('không phải UUID — chuỗi rỗng', !isMatIdUuid(''));
ok('không phải UUID — chỉ whitespace', !isMatIdUuid('   '));
ok('không phải UUID — thiếu dấu gạch', !isMatIdUuid('a1b2c3d4e5f6478989abcdef012345678'));
ok('không phải UUID — variant sai (0)', !isMatIdUuid('a1b2c3d4-e5f6-4789-0abc-def012345678'));
ok('không phải UUID — version 0', !isMatIdUuid('a1b2c3d4-e5f6-0789-8abc-def012345678'));
ok('không phải UUID — version 9', !isMatIdUuid('a1b2c3d4-e5f6-9789-8abc-def012345678'));
ok('không phải string', !isMatIdUuid(null as unknown as string));
ok('undefined', !isMatIdUuid(undefined as unknown as string));

console.log('normalizeMatIdCanonical — UUID lowercase, KHÔNG upper');
ok(
  'upper → lower',
  normalizeMatIdCanonical('A1B2C3D4-E5F6-4789-8ABC-DEF012345678') === 'a1b2c3d4-e5f6-4789-8abc-def012345678',
);
ok(
  'trim + lower',
  normalizeMatIdCanonical('  A1B2C3D4-E5F6-4789-8ABC-DEF012345678  ') === 'a1b2c3d4-e5f6-4789-8abc-def012345678',
);
ok(
  'đã lowercase — giữ nguyên',
  normalizeMatIdCanonical('a1b2c3d4-e5f6-4789-8abc-def012345678') === 'a1b2c3d4-e5f6-4789-8abc-def012345678',
);

console.log('normalizeSkuBusinessKey — sku upper + trim (semantic cũ 07/08)');
ok('lower → upper', normalizeSkuBusinessKey('sw-trv-be') === 'SW-TRV-BE');
ok('trim + upper', normalizeSkuBusinessKey('  sw-trv-be  ') === 'SW-TRV-BE');
ok('đã upper — giữ nguyên', normalizeSkuBusinessKey('SW-TRV-BE') === 'SW-TRV-BE');

console.log('KHÔNG lẫn 2 namespace — chốt Hoà "cấm normalize UUID theo semantic của SKU"');
const uuidInput = 'a1b2c3d4-e5f6-4789-8abc-def012345678';
const skuInput = 'sw-trv-be';
ok(
  'UUID qua normalizeCanonical KHÁC UUID qua normalizeSku (upper)',
  normalizeMatIdCanonical(uuidInput) !== normalizeSkuBusinessKey(uuidInput),
);
ok(
  'sku qua normalizeSku KHÁC sku qua normalizeCanonical (lower)',
  normalizeSkuBusinessKey(skuInput) !== normalizeMatIdCanonical(skuInput),
);

console.log('resolveInputMatId — legacy compat window');
const mapping: SkuToMatIdMapping = new Map([
  ['SW-TRV-BE', 'a1b2c3d4-e5f6-4789-8abc-def012345678'],
  ['OAK-114', 'b2c3d4e5-f6a7-4890-9bcd-ef0123456789'],
]);

ok(
  'input UUID → normalize canonical',
  resolveInputMatId('A1B2C3D4-E5F6-4789-8ABC-DEF012345678', mapping) === 'a1b2c3d4-e5f6-4789-8abc-def012345678',
);
ok(
  'input sku hoa/thường + trim → tra mapping trả UUID',
  resolveInputMatId('  sw-trv-be  ', mapping) === 'a1b2c3d4-e5f6-4789-8abc-def012345678',
);
ok('input sku KHÔNG có trong mapping → null', resolveInputMatId('UNKNOWN-SKU', mapping) === null);
ok('input rỗng → null', resolveInputMatId('', mapping) === null);
ok('input whitespace → null', resolveInputMatId('   ', mapping) === null);
ok('input null → null', resolveInputMatId(null as unknown as string, mapping) === null);

console.log('resolveInputMatId — mapping rỗng');
const emptyMap: SkuToMatIdMapping = new Map();
ok(
  'UUID vẫn trả canonical dù mapping rỗng',
  resolveInputMatId('a1b2c3d4-e5f6-4789-8abc-def012345678', emptyMap) === 'a1b2c3d4-e5f6-4789-8abc-def012345678',
);
ok('sku với mapping rỗng → null (không fabricate)', resolveInputMatId('SW-TRV-BE', emptyMap) === null);

console.log('generateMatId — sinh UUID v4 hợp lệ');
const id1 = generateMatId();
const id2 = generateMatId();
ok('sinh ra UUID hợp lệ (isMatIdUuid true)', isMatIdUuid(id1));
ok('2 lần sinh khác nhau', id1 !== id2);
ok('output đã canonical (lowercase)', id1 === normalizeMatIdCanonical(id1));

console.log(`\n${pass} pass · ${fail} fail`);
if (fail > 0) process.exit(1);
