/**
 * lib/materials/warehouse/catalog-link.test.ts — dây nối họ tài sản ↔ kho: chỉ chiều measured/
 * verified vào w/d/hUp, giá không chép, loại không bán được ⇒ null.
 * Chạy: node_modules/.bin/sucrase-node lib/materials/warehouse/catalog-link.test.ts
 */
import { catalogLinkFromSpec, catalogPayloadFromFamily, confidenceFromFlag } from './catalog-link';
import { normalizeAssetFamily } from '../../idfc-import/asset-family';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}
const NOW = '2026-09-02T10:00:00.000Z';
const SRC = 'https://brand.example/table';

console.log('catalog-link');
{
  const link = catalogLinkFromSpec({ id: 'spec1', matId: null, sku: 'SKU-1', brand: 'B', vendor: null });
  ok('spec → link: specId + sku + brand, bỏ null', link.specId === 'spec1' && link.sku === 'SKU-1' && link.brand === 'B' && !('vendor' in link) && !('matId' in link));
  ok('confidence: verified→manual · measured→measured · inferred→inferred', confidenceFromFlag('verified') === 'manual' && confidenceFromFlag('measured') === 'measured' && confidenceFromFlag('inferred') === 'inferred');

  const fam = normalizeAssetFamily({
    name: 'Table T', code: 'TT-01', kind: 'furniture',
    origin: { kind: 'manufacturer-reference', url: SRC },
    license: { id: 'proprietary' },
    dims: { wMm: { value: 1200, flag: 'verified', source: SRC }, dMm: { value: 600, flag: 'verified', source: SRC }, hMm: { value: 740, flag: 'inferred', source: 'vision:x' } },
    catalog: { brand: 'Brand', sku: 'TT-01', vendor: 'Vendor', productUrl: SRC },
    commerce: { priceVnd: 5_000_000, currency: 'VND', unit: 'cái', materials: ['sồi'] },
  }, { now: NOW });
  const p = catalogPayloadFromFamily(fam)!;
  ok('payload có tên/sku/brand/vendor', p.name === 'Table T' && p.sku === 'TT-01' && p.brand === 'Brand' && p.vendor === 'Vendor');
  ok('w/d verified đi vào; hUp inferred KHÔNG đi vào', p.w === 1200 && p.d === 600 && p.hUp === undefined);
  ok('confidence = cờ yếu nhất (inferred)', p.confidence === 'inferred');
  ok('giá/đơn vị/vật liệu chép từ commerce khai (không bịa)', p.priceVnd === 5_000_000 && p.unit === 'cái' && p.materials?.[0] === 'sồi');
  ok('note truy ngược familyId + tier + cảnh báo chiều máy suy', /family:/.test(p.note ?? '') && /reference-only/.test(p.note ?? '') && /máy suy/.test(p.note ?? ''));

  const page = normalizeAssetFamily({ name: 'p', code: 'p', kind: 'page', origin: { kind: 'user-upload' }, license: { id: 'unknown' } }, { now: NOW });
  ok('kind page ⇒ null', catalogPayloadFromFamily(page) === null);

  const bare = normalizeAssetFamily({ name: 'x', code: 'x', kind: 'fixture', origin: { kind: 'user-upload' }, license: { id: 'unknown' } }, { now: NOW });
  const bp = catalogPayloadFromFamily(bare)!;
  ok('không số ⇒ không w/d/hUp, không confidence', bp.w === undefined && bp.hUp === undefined && bp.confidence === undefined && bp.name === 'x');
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
