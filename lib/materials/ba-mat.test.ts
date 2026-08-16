/**
 * lib/materials/ba-mat.test.ts — [marker: vatLieuBaMat] P-T 17/08.
 * Chạy: node_modules/.bin/sucrase-node lib/materials/ba-mat.test.ts
 *
 * Điều test này CANH, ngoài chuyện chạy đúng: **mảnh thiếu thì UI phải NÓI THIẾU, không rơi về
 * giá trị bịa.** Mọi ca thiếu ở đây đều khẳng định `tomTat` không chứa số/giá trị nào, và luôn
 * có `thieu` + `loiRa` (cấm ô trống câm).
 */
import { getMaterial } from './resolve';
import { baMatCuaVatLieu, baMatChuaCoMa, dinhDangVnd, type MatKhoa, type MatMotMat } from './ba-mat';
import type { MaterialDef } from '../cad/materials';
import type { MaterialPbr } from './schema';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}
const lay = (mats: readonly MatMotMat[], khoa: MatKhoa): MatMotMat => {
  const m = mats.find((x) => x.khoa === khoa);
  if (!m) throw new Error(`thiếu mặt ${khoa}`);
  return m;
};

const defs: MaterialDef[] = [{
  id: 'da-travertine', name: 'Đá travertine', category: 'Sàn', hatchPattern: 'ANSI32',
  patternScale: 1, patternAngle: 0, color: '#d8cbb4', texture: 'travertine', tones: ['#d8cbb4'],
  matId: 'SW-TRV-BE',
}];
const specs = [
  { sku: 'SW-TRV-BE', name: 'Đá travertine be', vendor: 'Stoneworld', unit: 'm2', priceVnd: 850000 },
  { sku: 'NO-PRICE', name: 'Gỗ sồi lam', vendor: 'Woodhouse', unit: 'm2', priceVnd: null },
];
const pbrMap: Record<string, MaterialPbr> = {
  'SW-TRV-BE': { typeId: 'da-tu-nhien', roughness: 0.5, metallic: 0 },
  'NO-PRICE': { baseColorMapUrl: 'data:image/png;base64,xxx', roughness: 0.4 },
  'RONG': {},
  'SUY-DOAN': { roughness: 0.6, metallic: 0, suyDoan: true },
};

console.log('ba mặt — đủ cả ba khi cùng matId');
{
  const b = baMatCuaVatLieu(getMaterial('SW-TRV-BE', { pbrMap, specs, defs }));
  ok('soDu = 3', b.soDu === 3);
  ok('cả ba mặt trạng thái du', b.mats.every((m) => m.trangThai === 'du'));
  ok('thứ tự luôn 2D → 3D → Trình bày', b.mats.map((m) => m.khoa).join(',') === 've2d,dung3d,trinhBay');
  ok('2D nói ra ký hiệu thật', lay(b.mats, 've2d').tomTat?.vi === 'Đá travertine · ANSI32');
  ok('3D nói ra thông số thật', lay(b.mats, 'dung3d').tomTat?.vi === 'nhám 0.50 · phi kim');
  ok('Trình bày nói ra giá thật + đơn vị', lay(b.mats, 'trinhBay').tomTat?.vi === '850 000 ₫/m2');
  ok('mặt đủ thì KHÔNG kèm câu thiếu', b.mats.every((m) => m.thieu === null && m.loiRa === null));
}

console.log('mảnh thiếu ⇒ NÓI THIẾU, không bịa mặc định');
{
  const b = baMatCuaVatLieu(getMaterial('KHONG-CO-MA-NAY', { pbrMap, specs, defs }));
  ok('soDu = 0', b.soDu === 0);
  ok('cả ba chuaCo', b.mats.every((m) => m.trangThai === 'chuaCo'));
  ok('KHÔNG mặt nào có tomTat (0 giá trị bịa)', b.mats.every((m) => m.tomTat === null));
  ok('mọi mặt thiếu đều nói THIẾU GÌ', b.mats.every((m) => (m.thieu?.vi.length ?? 0) > 0));
  ok('mọi mặt thiếu đều nói LÀM SAO CÓ', b.mats.every((m) => (m.loiRa?.vi.length ?? 0) > 0));
  ok('song ngữ đủ, không rơi chuỗi EN', b.mats.every((m) => (m.thieu?.en.length ?? 0) > 0 && (m.loiRa?.en.length ?? 0) > 0));
  ok('KHÔNG bịa 0 ₫ cho mặt giá', !JSON.stringify(b.mats).includes('₫'));
}

console.log('thiếu PBR — hai mặt kia vẫn đứng, không kéo nhau sập');
{
  const b = baMatCuaVatLieu(getMaterial('SW-TRV-BE', { specs, defs })); // không đưa pbrMap
  ok('soDu = 2', b.soDu === 2);
  ok('3D chuaCo', lay(b.mats, 'dung3d').trangThai === 'chuaCo');
  ok('3D KHÔNG rơi về DEFAULT_PBR (không hiện nhám 0.50)', lay(b.mats, 'dung3d').tomTat === null);
  ok('2D và Trình bày vẫn du', lay(b.mats, 've2d').trangThai === 'du' && lay(b.mats, 'trinhBay').trangThai === 'du');
}

console.log('có bản ghi thương mại mà bỏ trống giá ⇒ chuaDu, KHÔNG phải du, cũng KHÔNG phải chuaCo');
{
  const b = baMatCuaVatLieu(getMaterial('NO-PRICE', { pbrMap, specs, defs }));
  const t = lay(b.mats, 'trinhBay');
  ok('trạng thái chuaDu', t.trangThai === 'chuaDu');
  ok('không đếm vào soDu', b.soDu < 3);
  ok('nói rõ bỏ trống giá', (t.thieu?.vi ?? '').includes('bỏ trống giá'));
  ok('KHÔNG hiện con số tiền nào', !(t.tomTat?.vi ?? '').includes('₫'));
  ok('vẫn cho biết bản ghi có thật (tên NCC)', (t.tomTat?.vi ?? '').includes('Woodhouse'));
}

console.log('có ảnh vân mà thiếu bước lặp vân ⇒ chuaDu (vân sai tỉ lệ ngay khi nhìn)');
{
  const b = baMatCuaVatLieu(getMaterial('NO-PRICE', { pbrMap, specs, defs }));
  const d3 = lay(b.mats, 'dung3d');
  ok('trạng thái chuaDu', d3.trangThai === 'chuaDu');
  ok('vẫn khoe được thông số đã có', (d3.tomTat?.vi ?? '').includes('có ảnh vân'));
  ok('nói đúng thứ thiếu', (d3.thieu?.vi ?? '').includes('bước lặp vân'));
}

console.log('bản ghi PBR rỗng ⇒ chuaDu, không nói dối là đã có chất liệu');
{
  const b = baMatCuaVatLieu(getMaterial('RONG', { pbrMap, specs, defs }));
  const d3 = lay(b.mats, 'dung3d');
  ok('chuaDu', d3.trangThai === 'chuaDu');
  ok('tomTat null (không có gì để khoe)', d3.tomTat === null);
}

console.log('cờ suy đoán đi kèm mặt, không bị nuốt');
{
  const b = baMatCuaVatLieu(getMaterial('SUY-DOAN', { pbrMap, specs, defs }));
  ok('suyDoan = true trên mặt 3D', lay(b.mats, 'dung3d').suyDoan === true);
  ok('các mặt khác không nhận nhầm cờ', lay(b.mats, 've2d').suyDoan === false && lay(b.mats, 'trinhBay').suyDoan === false);
}

console.log('món CHƯA CÓ MÃ — nói thẳng, không hiện ba ô trống câm');
{
  const b = baMatChuaCoMa();
  ok('soDu = 0', b.soDu === 0);
  ok('đủ ba mặt, mặt nào cũng có lối ra', b.mats.length === 3 && b.mats.every((m) => (m.loiRa?.vi.length ?? 0) > 0));
  ok('lối ra chỉ đúng việc phải làm (đặt mã)', b.mats.every((m) => (m.loiRa?.vi ?? '').includes('Mã vật liệu')));
  ok('không mặt nào có tomTat', b.mats.every((m) => m.tomTat === null));
}

console.log('định dạng tiền — MỘT nguồn, nhóm ba chữ số');
{
  ok('850000 → "850 000"', dinhDangVnd(850000) === '850 000');
  ok('999 giữ nguyên', dinhDangVnd(999) === '999');
  ok('làm tròn, không ra số lẻ', dinhDangVnd(1234.6) === '1 235');
}

console.log(`\n${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
