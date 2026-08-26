/**
 * lib/materials/resolve.test.ts — P13 VIỆC 2: getMaterial(matId) trả đủ 3 mặt, mảnh thiếu = null.
 * Chạy: node_modules/.bin/sucrase-node lib/materials/resolve.test.ts
 */
import { getMaterial } from './resolve';
import type { MaterialDef } from '../cad/materials';
import type { MaterialPbr } from './schema';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

const pbrMap: Record<string, MaterialPbr> = { 'SW-TRV-BE': { typeId: 'da-tu-nhien', roughness: 0.5, metallic: 0 } };
const specs = [
  { sku: 'SW-TRV-BE', name: 'Đá travertine be', vendor: 'Stoneworld', unit: 'm2', priceVnd: 850000 },
  { sku: null, name: 'Món không mã' },
];
const defs: MaterialDef[] = [
  {
    id: 'da-travertine', name: 'Đá travertine', category: 'Sàn', hatchPattern: 'ANSI32',
    patternScale: 1, patternAngle: 0, color: '#d8cbb4', texture: 'travertine', tones: ['#d8cbb4'],
    matId: 'SW-TRV-BE',
  },
];

console.log('getMaterial — đủ cả 3 mảnh khi cùng matId');
{
  const m = getMaterial('SW-TRV-BE', { pbrMap, specs, defs });
  ok('① pbr có', m.pbr?.typeId === 'da-tu-nhien');
  ok('② commercial có (giá 850000, đơn vị m2)', m.commercial?.priceVnd === 850000 && m.commercial?.unit === 'm2');
  ok('③ flat có (preset 2D)', m.flat?.id === 'da-travertine');
}

console.log('getMaterial — matId không phân biệt hoa/thường/khoảng trắng (mã gõ tay)');
{
  const m = getMaterial('  sw-trv-be ', { pbrMap, specs, defs });
  ok('vẫn khớp đủ 3 mảnh', m.pbr !== null && m.commercial !== null && m.flat !== null);
  ok('matId trả về đã chuẩn hoá', m.matId === 'SW-TRV-BE');
}

console.log('getMaterial — mảnh thiếu trả null CHO MẢNH ĐÓ, không throw, không bịa');
{
  const m = getMaterial('KHONG-CO-MA-NAY', { pbrMap, specs, defs });
  ok('cả 3 mảnh null', m.pbr === null && m.commercial === null && m.flat === null);
  const partial = getMaterial('SW-TRV-BE', { specs }); // không đưa pbrMap/defs riêng
  ok('chỉ có commercial (pbr null vì kho rỗng)', partial.pbr === null && partial.commercial !== null);
}

console.log('getMaterial — spec sku=null KHÔNG bao giờ khớp (không so null==null)');
{
  const m = getMaterial('', { specs });
  ok('matId rỗng không vớ nhầm món không mã', m.commercial === null);
}

console.log('getMaterial — defs mặc định (MATERIALS app): chưa preset nào khai matId ⇒ flat null, không sập');
{
  const m = getMaterial('SW-TRV-BE', { specs });
  ok('flat null trên catalog mặc định hiện tại', m.flat === null);
}

// ── Bước 2A (19/08) — đường CHÍNH: input là UUID canonical, tra ProductSpec.matId ──
const UUID_1 = 'a1b2c3d4-e5f6-4789-8abc-def012345678';
const UUID_2 = 'b2c3d4e5-f6a7-4890-9bcd-ef0123456789';
const pbrMapUuid: Record<string, MaterialPbr> = { [UUID_1]: { typeId: 'da-tu-nhien', roughness: 0.6, metallic: 0 } };
const specsUuid = [
  { sku: 'SW-TRV-BE', matId: UUID_1, name: 'Đá travertine be', vendor: 'Stoneworld', unit: 'm2', priceVnd: 850000 },
  { sku: 'OLD-NO-MATID', matId: null, name: 'Chưa backfill' },
];
const defsUuid: MaterialDef[] = [
  {
    id: 'da-travertine', name: 'Đá travertine', category: 'Sàn', hatchPattern: 'ANSI32',
    patternScale: 1, patternAngle: 0, color: '#d8cbb4', texture: 'travertine', tones: ['#d8cbb4'],
    matId: UUID_1,
  },
];

console.log('getMaterial — input UUID ⇒ resolvedVia "uuid", tra qua ProductSpec.matId canonical');
{
  const m = getMaterial(UUID_1, { pbrMap: pbrMapUuid, specs: specsUuid, defs: defsUuid });
  ok('resolvedVia = uuid', m.resolvedVia === 'uuid');
  ok('① pbr có', m.pbr?.typeId === 'da-tu-nhien');
  ok('② commercial có, khớp theo matId (không phải sku)', m.commercial?.priceVnd === 850000);
  ok('③ flat có (matId khớp)', m.flat?.id === 'da-travertine');
  ok('matId trả về = canonical lowercase, giữ nguyên UUID', m.matId === UUID_1);
}

console.log('getMaterial — UUID hoa/thường/khoảng trắng vẫn khớp, canonical LUÔN lowercase (không upperCase)');
{
  const m = getMaterial(`  ${UUID_1.toUpperCase()}  `, { pbrMap: pbrMapUuid, specs: specsUuid, defs: defsUuid });
  ok('vẫn khớp đủ 3 mảnh dù input UUID viết hoa', m.pbr !== null && m.commercial !== null && m.flat !== null);
  ok('matId trả về LOWERCASE (không phải bản upper của input)', m.matId === UUID_1 && m.matId === m.matId.toLowerCase());
}

console.log('getMaterial — UUID không khớp bản ghi nào ⇒ cả 3 mảnh null, KHÔNG rơi về đường legacy-sku');
{
  const m = getMaterial(UUID_2, { pbrMap: pbrMapUuid, specs: specsUuid, defs: defsUuid });
  ok('resolvedVia vẫn = uuid (không lặng lẽ đổi đường)', m.resolvedVia === 'uuid');
  ok('cả 3 mảnh null — không bịa, không lẫn sang record của UUID_1', m.pbr === null && m.commercial === null && m.flat === null);
}

console.log('getMaterial — ProductSpec.matId = null (chưa backfill) KHÔNG BAO GIỜ khớp UUID nào (cấm giả sku thành UUID)');
{
  // OLD-NO-MATID có sku hợp lệ nhưng matId=null — tra bằng UUID_1 hay UUID_2 đều không được vớ nhầm nó.
  const m1 = getMaterial(UUID_1, { specs: [{ sku: 'OLD-NO-MATID', matId: null, name: 'Chưa backfill' }] });
  ok('không khớp bản ghi matId=null', m1.commercial === null);
}

console.log('getMaterial — hai đường KHÔNG LẪN NHAU: sku trùng hình dạng UUID (giả định cực đoan) vẫn tách đúng namespace');
{
  // input KHÔNG phải UUID hợp lệ (thiếu version nibble đúng chuẩn) ⇒ phải đi đường legacy, dù trông "giống" UUID.
  const notQuiteUuid = 'zzzzzzzz-e5f6-4789-8abc-def012345678';
  const m = getMaterial(notQuiteUuid, { specs: specsUuid });
  ok('chuỗi không hợp lệ UUID ⇒ đi đường legacy-sku, không throw', m.resolvedVia === 'legacy-sku');
}

console.log('getMaterial — đường legacy-sku (input KHÔNG phải UUID) TIẾP TỤC hoạt động y hệt trước 19/08');
{
  const m = getMaterial('SW-TRV-BE', { pbrMap, specs, defs });
  ok('resolvedVia = legacy-sku', m.resolvedVia === 'legacy-sku');
  ok('hành vi giống hệt test gốc phía trên (không hồi quy)', m.pbr !== null && m.commercial !== null && m.flat !== null);
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
