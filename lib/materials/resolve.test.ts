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

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
