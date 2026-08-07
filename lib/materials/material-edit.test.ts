/**
 * lib/materials/material-edit.test.ts — VIỆC 5 PHẦN B: lớp chỉnh 4 núm + 2 khoá vật lý.
 * Chạy: node_modules/.bin/sucrase-node lib/materials/material-edit.test.ts
 */
import {
  MATERIAL_TYPES,
  materialTypeOf,
  applyMaterialType,
  setRoughness,
  setBaseColor,
  setTransparency,
  pbrKnobView,
  GLASS_TRANSMISSION_INIT,
} from './material-edit';
import { inferPbrFromCategory } from './pbr-from-category';
import { DEFAULT_PBR, type MaterialPbr } from './schema';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

console.log('MATERIAL_TYPES — đủ 11 loại phiếu giao, id không trùng');
{
  ok('đúng 11 loại', MATERIAL_TYPES.length === 11);
  ok('id duy nhất', new Set(MATERIAL_TYPES.map((t) => t.id)).size === 11);
}

console.log('KHOÁ 2 bảng không lệch nhau — roughnessInit/metallic từng loại BẰNG bảng suy đoán pbr-from-category');
for (const t of MATERIAL_TYPES) {
  const inferred = inferPbrFromCategory(t.categoryProbe);
  ok(`${t.id}: roughness ${t.roughnessInit} = inferPbrFromCategory('${t.categoryProbe}').roughness ${inferred.roughness}`, t.roughnessInit === inferred.roughness);
  ok(`${t.id}: metallic khớp (${t.metallic})`, t.metallic === inferred.metallic);
}

console.log('applyMaterialType — đổi gỗ→kim loại: metallic TỰ NHẢY 0→1, không đường nào khác chỉnh được');
{
  const wood = applyMaterialType(undefined, 'go');
  ok('gỗ: metallic=0', wood.metallic === 0);
  ok('gỗ: roughness khởi tạo 0.6', wood.roughness === 0.6);
  const metal = applyMaterialType(wood, 'kim-loai');
  ok('kim loại: metallic NHẢY thành 1', metal.metallic === 1);
  ok('kim loại: roughness reset 0.3', metal.roughness === 0.3);
  ok('specular bị khoá đúng DEFAULT_PBR (0.04)', metal.specular === DEFAULT_PBR.specular);
  ok('KS4 — pbr gốc KHÔNG bị sửa tại chỗ', wood.metallic === 0 && wood.roughness === 0.6);
}

console.log('applyMaterialType — kính: transmission tự mở; rời kính: transmission bị XOÁ');
{
  const glass = applyMaterialType(undefined, 'kinh');
  ok('kính có transmission khởi tạo 0.9/ior 1.5', glass.transmission?.value === GLASS_TRANSMISSION_INIT.value && glass.transmission?.ior === GLASS_TRANSMISSION_INIT.ior);
  const custom = setTransparency(glass, 0.6);
  ok('kéo độ trong 0.6 ăn', custom.transmission?.value === 0.6);
  const backToGlass = applyMaterialType(custom, 'kinh');
  ok('đổi lại kính GIỮ transmission người dùng đã kéo (0.6)', backToGlass.transmission?.value === 0.6);
  const paint = applyMaterialType(custom, 'son');
  ok('sang sơn: transmission bị xoá (sơn có khúc xạ là sai vật lý)', paint.transmission === undefined);
}

console.log('setTransparency trên loại ĐỤC — no-op lưới đỡ, không throw');
{
  const wood = applyMaterialType(undefined, 'go');
  const after = setTransparency(wood, 0.5);
  ok('trả nguyên pbr, không gắn transmission', after === wood && after.transmission === undefined);
}

console.log('suyDoan — máy đoán giữ cờ, người dùng đụng tay là cờ mất (K3 khai báo thắng suy đoán)');
{
  const inferred: MaterialPbr = { ...inferPbrFromCategory('gỗ tự nhiên') };
  ok('nguồn suy đoán mang cờ', inferred.suyDoan === true);
  ok('setRoughness xoá cờ', setRoughness(inferred, 0.7).suyDoan === undefined);
  ok('applyMaterialType xoá cờ', applyMaterialType(inferred, 'go').suyDoan === undefined);
  ok('setBaseColor KHÔNG đụng cờ (màu độc lập với bảng suy đoán)', setBaseColor(inferred, '#aa5500').suyDoan === true);
}

console.log('setRoughness — clamp 0..1');
{
  const p = applyMaterialType(undefined, 'go');
  ok('âm về 0', setRoughness(p, -1).roughness === 0);
  ok('quá 1 về 1', setRoughness(p, 3).roughness === 1);
}

console.log('pbrKnobView — 4 núm + nguồn giá trị');
{
  const empty = pbrKnobView(undefined);
  ok('chưa có gì: typeId null, roughness mặc định + cờ fromDefault', empty.typeId === null && empty.roughness === DEFAULT_PBR.roughness && empty.roughnessFromDefault);
  ok('loại đục: núm ④ ẩn (null)', pbrKnobView(applyMaterialType(undefined, 'son')).transmission === null);
  const glassView = pbrKnobView(applyMaterialType(undefined, 'kinh'));
  ok('kính: núm ④ hiện 0.9', glassView.transmission === GLASS_TRANSMISSION_INIT.value);
  ok('pbr suy đoán: view báo suyDoan', pbrKnobView({ ...inferPbrFromCategory('vải') }).suyDoan === true);
}

console.log('materialTypeOf — id lạ trả null, không throw');
ok('null cho id lạ', materialTypeOf('khong-co') === null);

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
