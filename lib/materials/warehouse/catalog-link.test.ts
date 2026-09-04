/**
 * lib/materials/warehouse/catalog-link.test.ts — dây nối họ tài sản ↔ kho: chỉ chiều measured/
 * verified vào w/d/hUp, giá không chép, loại không bán được ⇒ null.
 * Chạy: node_modules/.bin/sucrase-node lib/materials/warehouse/catalog-link.test.ts
 */
import { catalogLinkFromSpec, catalogPayloadFromFamily, confidenceFromFlag, resolveIdfcCommerceToSpec } from './catalog-link';
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

console.log('resolveIdfcCommerceToSpec — khoá BẤT BIẾN trước, business key sau');
{
  const kho = [
    { id: 'ps-sofa', matId: '9e1d4c77-2a55-4f10-9c8b-3d6e04b1a222', sku: 'SOFA-3S' },
    { id: 'ps-tu', matId: null, sku: 'WRD-240' },
  ];

  // ⚠️ CA THEN CHỐT — lý do cả hàm này tồn tại: NCC đổi mã hàng, tệp .idfc KHÔNG đổi byte nào.
  const khoDoiSku = [{ ...kho[0], sku: 'SOFA-3S-V2' }, kho[1]];
  const sauDoi = resolveIdfcCommerceToSpec({ specId: 'ps-sofa', sku: 'SOFA-3S' }, khoDoiSku);
  ok('kho đổi sku ⇒ vẫn nối đúng bản ghi qua specId, và cờ bền=true',
    sauDoi?.spec.id === 'ps-sofa' && sauDoi?.via === 'specId' && sauDoi?.ben === true);

  // ĐỐI CHỨNG: cùng cú đổi đó, tệp chỉ-có-sku thì MẤT NỐI ⇒ chứng minh ca trên không tự đúng.
  ok('ĐỐI CHỨNG — chỉ có sku thì cùng cú đổi đó làm mất nối',
    resolveIdfcCommerceToSpec({ sku: 'SOFA-3S' }, khoDoiSku) === null);

  // Thứ tự ưu tiên: specId THẮNG cả khi matId/sku cùng trỏ chỗ khác.
  const uuTien = resolveIdfcCommerceToSpec({ specId: 'ps-tu', matId: '9e1d4c77-2a55-4f10-9c8b-3d6e04b1a222', sku: 'SOFA-3S' }, kho);
  ok('specId THẮNG matId và sku khi cả ba cùng khai', uuTien?.spec.id === 'ps-tu' && uuTien?.via === 'specId');

  const quaMatId = resolveIdfcCommerceToSpec({ matId: '9E1D4C77-2A55-4F10-9C8B-3D6E04B1A222', sku: 'WRD-240' }, kho);
  ok('không có specId ⇒ matId (UUID, không phân biệt hoa thường) thắng sku', quaMatId?.spec.id === 'ps-sofa' && quaMatId?.via === 'matId' && quaMatId?.ben === true);

  const quaSku = resolveIdfcCommerceToSpec({ sku: ' wrd-240 ' }, kho);
  ok('đường lùi sku — chuẩn hoá trim+upper, và cờ bền=false (liên kết mỏng)',
    quaSku?.spec.id === 'ps-tu' && quaSku?.via === 'sku' && quaSku?.ben === false);

  ok('không nối được ⇒ null, KHÔNG lấy bừa bản ghi gần đúng', resolveIdfcCommerceToSpec({ sku: 'KHONG-CO' }, kho) === null);
  ok('commerce undefined ⇒ null, không throw', resolveIdfcCommerceToSpec(undefined, kho) === null);
  ok('specId khai nhưng kho không có ⇒ TỤT xuống sku, không trả null vội',
    resolveIdfcCommerceToSpec({ specId: 'ps-khong-ton-tai', sku: 'WRD-240' }, kho)?.spec.id === 'ps-tu');
  ok('matId KHÔNG phải UUID thì bỏ qua đường matId (không lẫn namespace sku)',
    resolveIdfcCommerceToSpec({ matId: 'SOFA-3S', sku: 'WRD-240' }, kho)?.via === 'sku');

  // Đường sinh THẬT phải chuyển khoá bất biến sang commerce, không bỏ lại trong xAssetFamily.
  const fam = normalizeAssetFamily({
    name: 'Sofa', code: 'SOFA-3S', kind: 'furniture',
    origin: { kind: 'user-upload' }, license: { id: 'proprietary' },
    // w×d bắt buộc — không có thì `.idfc` bị TỪ CHỐI đúng luật "thiếu thì thiếu, không bịa nét bao".
    dims: { wMm: { value: 1800, flag: 'verified', source: SRC }, dMm: { value: 800, flag: 'verified', source: SRC } },
    catalog: { specId: 'ps-sofa', sku: 'SOFA-3S', vendor: 'NCC A' },
  }, { now: NOW });
  ok('normalizeAssetFamily chép specId từ catalog sang commerce',
    fam.idfc.ok && fam.idfc.parsed.commerce?.specId === 'ps-sofa' && fam.idfc.parsed.commerce?.sku === 'SOFA-3S');
  ok('KHÔNG chép giá vào .idfc từ kho (luật 2.1.9.i — trỏ tới, không chứa)',
    fam.idfc.ok && fam.idfc.parsed.commerce?.priceVnd === undefined);
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
