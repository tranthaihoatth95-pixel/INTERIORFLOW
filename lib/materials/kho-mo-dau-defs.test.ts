/**
 * lib/materials/kho-mo-dau-defs.test.ts — canh CHÂN THỨ BA của kiềng ba chân (V1, 05/09).
 *
 * Ca quan trọng nhất là ca ĐỐI CHỨNG: đường CŨ (`defs: MATERIALS`) trả `flat: null` cho vật liệu
 * ship theo bản cài — tức chỉ báo `2D –` mà người dùng thấy trên app **không phải lỗi hiển thị**,
 * nó là sự thật của dữ liệu. Test này khoá cứng cả hai chiều: đường cũ HỎNG, đường mới CHẠY.
 * Mất một trong hai khẳng định thì lần sau không ai biết đã sửa cái gì.
 *
 * Chạy: node_modules/.bin/sucrase-node lib/materials/kho-mo-dau-defs.test.ts
 */
import { defsHatGiong, tronDefsHatGiong } from './kho-mo-dau';
import { VAT_LIEU_HAT_GIONG } from './hat-giong';
import { getMaterial } from './resolve';
import { baMatCuaVatLieu } from './ba-mat';
import { MATERIALS } from '../cad/materials';
import { normalizeMatIdCanonical } from './matid-identity';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean, detail?: string) {
  if (cond) pass += 1;
  else { fail += 1; console.error('  ✗', name, detail ?? ''); }
}
const mat2d = (matId: string, defs: readonly any[]) =>
  baMatCuaVatLieu(getMaterial(matId, { defs })).mats.find((m) => m.khoa === 've2d')!;

const SOI = VAT_LIEU_HAT_GIONG[0];
const OC_CHO = VAT_LIEU_HAT_GIONG[1];

console.log('ĐỐI CHỨNG — đường CŨ (chỉ MATERIALS) mặt 2D CHẾT trên 100% vật liệu ship sẵn');
ok('0/13 preset gốc khai matId', MATERIALS.every((d) => d.matId == null), String(MATERIALS.filter((d) => d.matId != null).length));
for (const v of VAT_LIEU_HAT_GIONG) {
  ok(`${v.code}: defs cũ ⇒ flat null`, getMaterial(v.matId, { defs: MATERIALS }).flat === null);
  ok(`${v.code}: defs cũ ⇒ chỉ báo 2D là "chưa có"`, mat2d(v.matId, MATERIALS).trangThai === 'chuaCo');
}

console.log('ĐƯỜNG MỚI — trộn preset hạt giống thì mặt 2D SỐNG');
const defs = tronDefsHatGiong(MATERIALS);
for (const v of VAT_LIEU_HAT_GIONG) {
  const f = getMaterial(v.matId, { defs });
  ok(`${v.code}: tra ra flat`, f.flat !== null);
  ok(`${v.code}: chỉ báo 2D là "đủ"`, mat2d(v.matId, defs).trangThai === 'du', mat2d(v.matId, defs).trangThai);
  ok(`${v.code}: mặt 2D nói được nó là ký hiệu gì`, !!mat2d(v.matId, defs).tomTat?.vi);
}

console.log('KHÔNG BỊA — mọi trường lấy từ `hatch2d` của chính hạt giống');
const dSoi = defsHatGiong().find((d) => d.matId === normalizeMatIdCanonical(SOI.matId))!;
ok('đúng số món', defsHatGiong().length === VAT_LIEU_HAT_GIONG.length);
ok('hatchPattern lấy nguyên', dSoi.hatchPattern === SOI.hatch2d.hatchPattern);
ok('patternScale lấy nguyên', dSoi.patternScale === SOI.hatch2d.patternScale);
ok('patternAngle lấy nguyên', dSoi.patternAngle === SOI.hatch2d.patternAngle);
ok('color lấy nguyên', dSoi.color === SOI.hatch2d.color);
ok('name lấy nguyên', dSoi.name === SOI.name);
ok('matId canonical (lowercase)', dSoi.matId === normalizeMatIdCanonical(SOI.matId));
ok('id mang tiền tố hạt giống', dSoi.id.startsWith('hat-giong:'));

console.log('BA TÔNG SUY TẤT ĐỊNH — không phải nguồn sự thật thứ hai cho màu');
ok('đủ 3 tông', dSoi.tones.length === 3);
ok('tông giữa CHÍNH LÀ màu gốc', dSoi.tones[1] === SOI.hatch2d.color);
ok('tông đậm ≠ tông nhạt', dSoi.tones[0] !== dSoi.tones[2], dSoi.tones.join(','));
ok('suy lại lần hai ra y hệt (tất định)', JSON.stringify(defsHatGiong()) === JSON.stringify(defsHatGiong()));
ok('gỗ ⇒ kiểu vân "wood" (theo MATERIAL_TYPES, không bảng thứ hai)', dSoi.texture === 'wood', dSoi.texture);
ok('hai vật liệu khác nhau ⇒ khác màu', dSoi.color !== defsHatGiong().find((d) => d.matId === normalizeMatIdCanonical(OC_CHO.matId))!.color);

console.log('LUẬT NHƯỜNG — preset thật khai cùng mã thì preset THẮNG');
const cuaStudio = { ...MATERIALS[0], id: 'cua-studio', name: 'Ký hiệu riêng của studio', matId: normalizeMatIdCanonical(SOI.matId) };
const tron = tronDefsHatGiong([...MATERIALS, cuaStudio]);
ok('chỉ còn MỘT def cho mã đó', tron.filter((d) => d.matId === normalizeMatIdCanonical(SOI.matId)).length === 1);
ok('và đó là bản của studio', getMaterial(SOI.matId, { defs: tron }).flat?.name === 'Ký hiệu riêng của studio');

console.log('KHÔNG ĐỤNG KHO ĐANG SỐNG');
ok('MATERIALS vẫn 0 preset khai matId sau khi trộn', MATERIALS.every((d) => d.matId == null));
ok('bản sao mỗi lần gọi', defsHatGiong()[0] !== defsHatGiong()[0]);
ok('mã lạ vẫn trả flat null', getMaterial('00000000-0000-4000-8000-000000000000', { defs }).flat === null);

console.log(`\n${pass} pass · ${fail} fail`);
if (fail > 0) process.exit(1);
