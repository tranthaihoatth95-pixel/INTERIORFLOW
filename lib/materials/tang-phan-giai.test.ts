/**
 * lib/materials/tang-phan-giai.test.ts — canh THỨ TỰ BA TẦNG và hai luật đi kèm.
 *
 * Ca quan trọng nhất là ca ĐẦU TIÊN: **máy sạch, kho studio rỗng, vẫn tra ra vật liệu.** Đó đúng
 * là ca mà kho `localStorage` một mình không giải được, và là lý do tầng hạt giống tồn tại.
 *
 * Chạy: node_modules/.bin/sucrase-node lib/materials/tang-phan-giai.test.ts
 */
import { phanGiaiPbr, pbrMapBaTang } from './tang-phan-giai';
import { VAT_LIEU_HAT_GIONG } from './hat-giong';
import { getMaterial } from './resolve';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean, detail?: string) {
  if (cond) pass += 1;
  else {
    fail += 1;
    console.error('  ✗', name, detail ?? '');
  }
}

const SOI = VAT_LIEU_HAT_GIONG[0];
const OC_CHO = VAT_LIEU_HAT_GIONG[1];

console.log('MÁY SẠCH — kho studio rỗng vẫn tra ra vật liệu (lý do tầng hạt giống tồn tại)');
const sach = phanGiaiPbr(SOI.matId, {});
ok('tra ra PBR', sach.pbr !== null);
ok('tầng thắng là hạt giống', sach.tang === 'hat-giong', String(sach.tang));
ok('đúng màu của gỗ sồi', sach.pbr?.baseColor === SOI.pbr.baseColor, sach.pbr?.baseColor);
ok('mang theo danh tính hạt giống', sach.hatGiong?.code === SOI.code);
// Đối chứng: đường CŨ (chỉ kho studio) trên máy sạch trả rỗng — đây là lỗ mà tầng này vá.
ok(
  'đường cũ (chỉ kho studio) trên máy sạch KHÔNG có gì',
  getMaterial(SOI.matId, { pbrMap: {} }).pbr === null,
);
ok(
  'đường mới (kho ba tầng) cắm vào getMaterial thì có',
  getMaterial(SOI.matId, { pbrMap: pbrMapBaTang({}) }).pbr?.baseColor === SOI.pbr.baseColor,
);

console.log('THỨ TỰ GHI ĐÈ — dự án > studio > hạt giống');
const banStudio = { [SOI.matId]: { baseColor: '#111111', roughness: 0.2 } };
const banDuAn = { [SOI.matId]: { baseColor: '#222222', roughness: 0.9 } };
ok('studio đè hạt giống', phanGiaiPbr(SOI.matId, { studio: banStudio }).tang === 'studio');
ok('studio đè đúng giá trị', phanGiaiPbr(SOI.matId, { studio: banStudio }).pbr?.baseColor === '#111111');
ok('dự án đè studio', phanGiaiPbr(SOI.matId, { studio: banStudio, duAn: banDuAn }).tang === 'du-an');
ok('dự án đè đúng giá trị', phanGiaiPbr(SOI.matId, { studio: banStudio, duAn: banDuAn }).pbr?.baseColor === '#222222');
ok(
  'mã KHÔNG bị đè vẫn về hạt giống dù tầng trên có mã khác',
  phanGiaiPbr(OC_CHO.matId, { studio: banStudio, duAn: banDuAn }).tang === 'hat-giong',
);

console.log('GHI ĐÈ THEO VẬT, KHÔNG THEO TRƯỜNG — không đẻ ra mặt lai');
const tren = phanGiaiPbr(SOI.matId, { studio: { [SOI.matId]: { baseColor: '#111111' } } });
ok(
  'bản studio thiếu roughness thì KHÔNG mượn roughness của hạt giống',
  tren.pbr?.roughness === undefined,
  `roughness=${tren.pbr?.roughness} — trộn theo trường sẽ ra ${SOI.pbr.roughness}, tức một vật liệu chưa ai từng thấy`,
);

console.log('MỘT CHIỀU — sửa ở tầng trên KHÔNG đổi mẫu gốc');
const goc = phanGiaiPbr(SOI.matId, {});
const daSua = phanGiaiPbr(SOI.matId, { duAn: banDuAn });
void daSua;
ok('hạt giống nguyên vẹn sau khi có bản đè', phanGiaiPbr(SOI.matId, {}).pbr?.baseColor === goc.pbr?.baseColor);
const traVe = phanGiaiPbr(SOI.matId, {});
if (traVe.pbr) traVe.pbr.baseColor = '#ff0000';
ok(
  'ghi vào KẾT QUẢ trả về không làm bẩn bảng hạt giống',
  phanGiaiPbr(SOI.matId, {}).pbr?.baseColor === SOI.pbr.baseColor && SOI.pbr.baseColor !== '#ff0000',
);

console.log('KHÔNG BỊA — mã lạ trả null, không rơi về DEFAULT_PBR');
const la = phanGiaiPbr('00000000-0000-4000-8000-000000000000', {});
ok('mã lạ ⇒ pbr null', la.pbr === null);
ok('mã lạ ⇒ tang null', la.tang === null);
ok('chuỗi rỗng ⇒ null, không throw', phanGiaiPbr('', {}).pbr === null);

console.log('TƯƠNG THÍCH — khoá sku legacy trong kho studio vẫn tra được');
ok(
  'input sku, kho studio khoá sku upper',
  phanGiaiPbr('sw-trv-be', { studio: { 'SW-TRV-BE': { roughness: 0.33 } } }).pbr?.roughness === 0.33,
);
ok('input sku không có ở đâu ⇒ null', phanGiaiPbr('SW-KHONG-CO', {}).pbr === null);

console.log('kho hợp nhất giữ đủ món của cả ba tầng');
const hop = pbrMapBaTang({ studio: { 'SW-TRV-BE': { roughness: 0.33 } } });
ok('có đủ món hạt giống', VAT_LIEU_HAT_GIONG.every((v) => !!hop[v.matId]));
ok('có thêm món chỉ có ở studio', hop['SW-TRV-BE']?.roughness === 0.33);

console.log(`\n${pass} pass · ${fail} fail`);
if (fail > 0) process.exit(1);
