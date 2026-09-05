/**
 * lib/three/vat-lieu-nhom.test.ts — ĐƯỜNG SÁNG: từ `SceneGroup` ra vật liệu THẬT có ảnh vân.
 *
 * ⛔ Ca đắt nhất ở đây là ca "gỡ 7 ký tự": entity chọn vật liệu hạt giống ở chặng 2D nhận
 * `specId = 'hat-giong:<uuid>'`; **cùng một chuỗi, bỏ tiền tố đi là ra UUID tra được**. Đó là toàn
 * bộ lý do 7 vật liệu ship theo bản cài lên vân được NGAY trên máy sạch — không CSDL, không đăng
 * nhập. Mất ca này là mất luôn đường sáng, mà mất im lặng: `pbr` trả `null` thì mọi thứ vẫn chạy,
 * chỉ là phẳng lì.
 *
 * KHÔNG test phần dựng `THREE.Material` — nó cần `TextureLoader` (DOM). Phần đó nghiệm thu bằng
 * render GL thật, xem báo cáo phiên V8c.
 *
 * Chạy: node_modules/.bin/sucrase-node lib/three/vat-lieu-nhom.test.ts
 */
import { matIdCuaNhom, nguonVatLieuMacDinh } from './vat-lieu-nhom';
import { VAT_LIEU_HAT_GIONG } from '../materials/hat-giong';
import { TIEN_TO_HAT_GIONG } from '../materials/kho-mo-dau';
import { getMaterial } from '../materials/resolve';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean, chiTiet?: string) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}${chiTiet ? ` — ${chiTiet}` : ''}`); }
}

const SOI = VAT_LIEU_HAT_GIONG.find((v) => v.name.includes('sồi'))!;

console.log('matIdCuaNhom — thứ tự lùi: matId ghi thẳng → specId gỡ tiền tố → null');
ok('matId ghi thẳng thắng', matIdCuaNhom({ matId: SOI.matId, specId: 'rác' }) === SOI.matId);
ok('specId hạt giống ⇒ gỡ tiền tố ra UUID', matIdCuaNhom({ specId: `${TIEN_TO_HAT_GIONG}${SOI.matId}` }) === SOI.matId);
ok('hoa/thường chuẩn hoá về canonical lowercase', matIdCuaNhom({ matId: SOI.matId.toUpperCase() }) === SOI.matId);
ok('không khai gì ⇒ null', matIdCuaNhom({}) === null);
ok('specId là cuid ProductSpec ⇒ null (KHÔNG giả UUID từ cuid)', matIdCuaNhom({ specId: 'clx1abc23def45ghi67jkl890' }) === null);
ok('tiền tố đúng nhưng ruột không phải UUID ⇒ null', matIdCuaNhom({ specId: `${TIEN_TO_HAT_GIONG}khong-phai-uuid` }) === null);
ok('matId sai định dạng ⇒ null, không nhận bừa', matIdCuaNhom({ matId: 'ABC-123' }) === null);

console.log('\nĐƯỜNG SÁNG — máy sạch, 0 CSDL: specId 2D → vật liệu có ẢNH VÂN + tỉ lệ vật lý');
{
  const nguon = nguonVatLieuMacDinh();
  const soCoAnh = VAT_LIEU_HAT_GIONG.filter((v) => !!v.pbr.baseColorMapUrl).length;
  ok(`nguồn mặc định mang đủ ${VAT_LIEU_HAT_GIONG.length} vật liệu hạt giống`,
    Object.keys(nguon.pbrMap ?? {}).length >= VAT_LIEU_HAT_GIONG.length,
    String(Object.keys(nguon.pbrMap ?? {}).length));

  let coAnh = 0;
  for (const v of VAT_LIEU_HAT_GIONG) {
    const id = matIdCuaNhom({ specId: `${TIEN_TO_HAT_GIONG}${v.matId}` });
    const pbr = id ? nguon.pbrMap?.[id] : null;
    if (pbr?.baseColorMapUrl) coAnh += 1;
  }
  ok(`cả ${soCoAnh} vật liệu hạt giống CÓ ảnh đều tra ra ảnh qua đường specId`, coAnh === soCoAnh, `${coAnh}/${soCoAnh}`);

  const idSoi = matIdCuaNhom({ specId: `${TIEN_TO_HAT_GIONG}${SOI.matId}` })!;
  const pbrSoi = nguon.pbrMap?.[idSoi];
  ok('gỗ sồi ra đúng ảnh trong repo', pbrSoi?.baseColorMapUrl === '/mau-vat-lieu/go-soi-trang.png', String(pbrSoi?.baseColorMapUrl));
  ok('gỗ sồi mang tỉ lệ vật lý thật (uvScaleMm)', !!pbrSoi?.uvScaleMm && pbrSoi.uvScaleMm.w > 0 && pbrSoi.uvScaleMm.h > 0, JSON.stringify(pbrSoi?.uvScaleMm));

  // Cùng khoá ấy phải tra được qua `getMaterial` đường CHÍNH ('uuid'), không rơi về legacy-sku —
  // rơi về legacy là dấu hiệu chuỗi chưa gỡ tiền tố, đúng lỗi mà bước này sinh ra để sửa.
  const facets = getMaterial(idSoi, { pbrMap: nguon.pbrMap });
  ok("getMaterial đi đường CHÍNH resolvedVia='uuid'", facets.resolvedVia === 'uuid', facets.resolvedVia);
  ok('getMaterial trả pbr thật, không null', !!facets.pbr);

  // Đối chứng: KHÔNG gỡ tiền tố thì chết — chứng minh 7 ký tự đó thật sự là chỗ đứt.
  const chuaGo = getMaterial(`${TIEN_TO_HAT_GIONG}${SOI.matId}`, { pbrMap: nguon.pbrMap });
  ok('(đối chứng) để nguyên tiền tố ⇒ pbr null + rơi đường legacy-sku', chuaGo.pbr === null && chuaGo.resolvedVia === 'legacy-sku');
}

console.log(`\n${pass} pass · ${fail} fail`);
if (fail > 0) process.exit(1);
