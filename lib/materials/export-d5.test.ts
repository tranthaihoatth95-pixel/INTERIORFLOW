import { toD5Material } from './export-d5';
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

function testPassthroughCoBan() {
  console.log('\n[1] Passthrough cơ bản — D5 đã metal/rough chuẩn, không đảo/dịch gì (khác V-Ray)');
  const out = toD5Material({ baseColor: '#a0522d', roughness: 0.6, metallic: 0 }, '#fff');
  ok('albedoSrgb đúng passthrough', out.albedoSrgb === '#a0522d');
  ok('roughness KHÔNG đảo (0.6 giữ nguyên 0.6)', out.roughness === 0.6);
  ok('metalness passthrough', out.metalness === 0);
}

function testBaseColorFallback() {
  console.log('\n[2] baseColorFallback dùng khi thiếu baseColor');
  ok('thiếu baseColor → dùng fallback', toD5Material({}, '#112233').albedoSrgb === '#112233');
  ok('có sẵn baseColor → ưu tiên, bỏ qua fallback', toD5Material({ baseColor: '#445566' }, '#112233').albedoSrgb === '#445566');
}

function testOptionalFieldsChiXuatKhiCoMat() {
  console.log('\n[3] Field optional (normal/height/ao/emissive/opacity/transmission/clearcoat/sheen) chỉ xuất khi input có — không tự bịa mặc định thừa');
  const rong = toD5Material({}, '#fff');
  ok('không có normalMapUrl', rong.normalMapUrl === undefined);
  ok('không có heightMapUrl', rong.heightMapUrl === undefined);
  ok('không có aoMapUrl', rong.aoMapUrl === undefined);
  ok('không có emissive', rong.emissive === undefined);
  ok('không có opacity', rong.opacity === undefined);
  ok('không có transmission', rong.transmission === undefined);
  ok('không có clearcoat', rong.clearcoat === undefined);
  ok('không có sheen', rong.sheen === undefined);

  const day: MaterialPbr = {
    normalUrl: 'n.png',
    heightUrl: 'h.png',
    aoUrl: 'ao.png',
    emissive: { color: '#fff', intensity: 3 },
    opacity: { value: 0.8, mode: 'blend' },
    transmission: { value: 0.9, ior: 1.5 },
    clearcoat: { value: 1, roughness: 0.05 },
    sheen: 0.3,
  };
  const outDay = toD5Material(day, '#fff');
  ok('normalMapUrl passthrough', outDay.normalMapUrl === 'n.png');
  ok('heightMapUrl passthrough', outDay.heightMapUrl === 'h.png');
  ok('aoMapUrl passthrough', outDay.aoMapUrl === 'ao.png');
  ok('emissive passthrough nguyên object', outDay.emissive?.intensity === 3 && outDay.emissive?.colorSrgb === '#fff');
  ok('opacity passthrough', outDay.opacity?.mode === 'blend' && outDay.opacity?.value === 0.8);
  ok('transmission passthrough (D5 không cần dịch tên như V-Ray glass)', outDay.transmission?.ior === 1.5);
  ok('clearcoat passthrough — D5 có field riêng, không bị bỏ qua như V-Ray (chưa tra doc)', outDay.clearcoat?.value === 1 && outDay.clearcoat?.roughness === 0.05);
  ok('sheen passthrough', outDay.sheen === 0.3);
}

function testSuyDoanTruyenQua() {
  console.log('\n[4] suyDoan truyền qua đúng — chỉ có field khi true, không có khi undefined/false');
  ok('suyDoan true → xuất suyDoan true', toD5Material({ suyDoan: true }, '#fff').suyDoan === true);
  ok('suyDoan undefined → không xuất field suyDoan', toD5Material({}, '#fff').suyDoan === undefined);
}

function testThieuHetVanKhongThrow() {
  console.log('\n[5] Object rỗng {} → vẫn ra kết quả tối giản hợp lệ, KHÔNG throw');
  let threw = false;
  try {
    toD5Material({}, '#808080');
  } catch {
    threw = true;
  }
  ok('không throw', !threw);
  const out = toD5Material({}, '#808080');
  ok('roughness mặc định DEFAULT_PBR 0.5', out.roughness === 0.5);
  ok('metalness mặc định 0', out.metalness === 0);
}

testPassthroughCoBan();
testBaseColorFallback();
testOptionalFieldsChiXuatKhiCoMat();
testSuyDoanTruyenQua();
testThieuHetVanKhongThrow();

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
