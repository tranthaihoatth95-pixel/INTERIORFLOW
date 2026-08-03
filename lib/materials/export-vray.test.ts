import { toVRayMtl } from './export-vray';
import type { MaterialPbr } from './schema';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) {
    pass += 1;
    console.log(`  ok  - ${label}`);
  } else {
    fail += 1;
    console.log(`  FAIL - ${label}`);
  }
}
function approx(a: number, b: number, eps = 0.01): boolean {
  return Math.abs(a - b) < eps;
}

function testRoughnessKhongDao() {
  console.log('\n[1] roughness truyền THẲNG (không đảo 1-x) + useRoughness luôn true + BRDF GGX');
  const out = toVRayMtl({ roughness: 0.3 }, '#ffffff');
  ok('roughness=0.3 → reflection.roughness=0.3 (không đảo)', out.reflection.roughness === 0.3);
  ok('useRoughness luôn true', out.reflection.useRoughness === true);
  ok('brdf luôn GGX', out.reflection.brdf === 'GGX');
  ok('gammaMode luôn linear', out.reflection.gammaMode === 'linear');
}

function testMetalnessPassthrough() {
  console.log('\n[2] metallic → metalness passthrough, chỉ 0 hoặc 1');
  ok('metallic=0 → metalness=0', toVRayMtl({ metallic: 0 }, '#fff').reflection.metalness === 0);
  ok('metallic=1 → metalness=1', toVRayMtl({ metallic: 1 }, '#fff').reflection.metalness === 1);
}

function testFresnelIorTuSpecular() {
  console.log('\n[3-4] specular F0 → Fresnel IOR: F0=((n−1)/(n+1))² đảo ngược');
  const iorMacDinh = toVRayMtl({ specular: 0.04 }, '#fff').reflection.fresnelIor;
  ok('specular 0.04 (mặc định §1) → IOR ≈ 1.5', approx(iorMacDinh, 1.5, 0.02));

  const iorKhongPhanXa = toVRayMtl({ specular: 0 }, '#fff').reflection.fresnelIor;
  ok('specular 0 → IOR = 1 (không khúc xạ)', approx(iorKhongPhanXa, 1, 0.001));
}

function testBumpChiXuatKhiCoUrl() {
  console.log('\n[5] normal/height map — chỉ xuất field khi matId có url, không tự bịa');
  const coNormal = toVRayMtl({ normalUrl: 'tex/n.png' }, '#fff');
  ok('có normalUrl → bump xuất đúng mode/space/gamma', coNormal.bump?.mode === 'normal' && coNormal.bump?.space === 'tangent' && coNormal.bump?.gammaMode === 'linear');
  ok('bump.mapUrl đúng giá trị truyền vào', coNormal.bump?.mapUrl === 'tex/n.png');

  const khongNormal = toVRayMtl({}, '#fff');
  ok('không có normalUrl → không có field bump', khongNormal.bump === undefined);

  const coHeight = toVRayMtl({ heightUrl: 'tex/h.png' }, '#fff');
  ok('có heightUrl → displacement xuất đúng, gamma linear', coHeight.displacement?.mapUrl === 'tex/h.png' && coHeight.displacement?.gammaMode === 'linear');
}

function testEmissiveGiToggle() {
  console.log('\n[6] emissive → Self-Illumination + GI toggle theo cường độ');
  const sang = toVRayMtl({ emissive: { color: '#fff2cc', intensity: 2 } }, '#fff');
  ok('intensity>0 → giToggle true', sang.selfIllumination?.giToggle === true);
  ok('màu self-illumination đúng passthrough', sang.selfIllumination?.colorSrgb === '#fff2cc');

  const tat = toVRayMtl({ emissive: { color: '#000', intensity: 0 } }, '#fff');
  ok('intensity=0 → giToggle false NHƯNG field vẫn xuất (không bỏ qua)', tat.selfIllumination !== undefined && tat.selfIllumination.giToggle === false);

  const khongCoEmissive = toVRayMtl({}, '#fff');
  ok('không set emissive → không có field selfIllumination', khongCoEmissive.selfIllumination === undefined);
}

function testGlassTransmission() {
  console.log('\n[7] glass → Refraction Color + IOR + Fog, từ transmission');
  const kinh = toVRayMtl({ transmission: { value: 0.9, ior: 1.5 } }, '#dff0ff');
  ok('refraction.ior đúng passthrough', kinh.refraction?.ior === 1.5);
  ok('refraction.fogEnabled luôn true khi có transmission', kinh.refraction?.fogEnabled === true);
  ok('refraction.colorSrgb dùng baseColor (không có field màu khúc xạ riêng trong matId)', kinh.refraction?.colorSrgb === '#dff0ff');

  const khongKinh = toVRayMtl({}, '#fff');
  ok('không có transmission → không có field refraction', khongKinh.refraction === undefined);
}

function testOpacityPassthrough() {
  console.log('\n[8] opacity mode truyền qua nguyên vẹn');
  ok('cutout passthrough', toVRayMtl({ opacity: { value: 0.5, mode: 'cutout' } }, '#fff').opacityMode === 'cutout');
  ok('blend passthrough', toVRayMtl({ opacity: { value: 0.5, mode: 'blend' } }, '#fff').opacityMode === 'blend');
  ok('không set opacity → undefined', toVRayMtl({}, '#fff').opacityMode === undefined);
}

function testThieuHetFieldVanRaKetQuaHopLe() {
  console.log('\n[9] object rỗng {} → vẫn ra kết quả hợp lệ dùng DEFAULT_PBR, KHÔNG throw');
  const empty: MaterialPbr = {};
  let threw = false;
  let out;
  try {
    out = toVRayMtl(empty, '#808080');
  } catch {
    threw = true;
  }
  ok('không throw khi input rỗng', !threw);
  ok('diffuse dùng baseColorFallback khi thiếu baseColor', out?.diffuse.colorSrgb === '#808080');
  ok('roughness mặc định 0.5 (DEFAULT_PBR)', out?.reflection.roughness === 0.5);
  ok('metalness mặc định 0', out?.reflection.metalness === 0);
}

function testChuaXuatDoThieuDoc() {
  console.log('\n[10] chuaXuatDoThieuDoc luôn liệt kê đúng clearcoat+sheen (chưa tra doc Chaos cho 2 field này)');
  const out = toVRayMtl({ clearcoat: { value: 1, roughness: 0.1 }, sheen: 0.5 }, '#fff');
  ok('luôn có đúng 2 phần tử clearcoat, sheen', out.chuaXuatDoThieuDoc.length === 2 && out.chuaXuatDoThieuDoc.includes('clearcoat') && out.chuaXuatDoThieuDoc.includes('sheen'));
  // Cố ý: dù input CÓ clearcoat/sheen, output KHÔNG có field clearcoat/sheen riêng (vì chưa map) —
  // đây là hành vi ĐÚNG THIẾT KẾ (tránh bịa tên tham số VRayMtl chưa xác minh), không phải bug.
  ok('output KHÔNG có field .clearcoat rời (cố ý, tránh bịa tên VRayMtl chưa tra)', (out as unknown as Record<string, unknown>).clearcoat === undefined);
}

function testBaseColorFallback() {
  console.log('\n[11] baseColorFallback dùng đúng khi pbr.baseColor thiếu, KHÔNG dùng khi đã có');
  ok('thiếu baseColor → dùng fallback', toVRayMtl({}, '#123456').diffuse.colorSrgb === '#123456');
  ok('có sẵn baseColor → ưu tiên giá trị đó, bỏ qua fallback', toVRayMtl({ baseColor: '#abcdef' }, '#123456').diffuse.colorSrgb === '#abcdef');
}

testRoughnessKhongDao();
testMetalnessPassthrough();
testFresnelIorTuSpecular();
testBumpChiXuatKhiCoUrl();
testEmissiveGiToggle();
testGlassTransmission();
testOpacityPassthrough();
testThieuHetFieldVanRaKetQuaHopLe();
testChuaXuatDoThieuDoc();
testBaseColorFallback();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
