/**
 * lib/materials/hat-giong.test.ts — CANH BA RÀNG BUỘC của tầng hạt giống (`hat-giong.ts`).
 *
 * Đây KHÔNG phải test "hàm chạy đúng không". Ba khẳng định dưới đây canh những thứ mà **hỏng thì
 * hỏng vĩnh viễn ở máy người dùng, và không ai phát hiện lúc chạy**:
 *   ① `matId` đổi ⇒ mọi `.idf`/`.idfc` đang trỏ vào nó thành **mồ côi**, im lặng.
 *   ② giá lọt vào vật liệu ⇒ mỗi lần bảng giá đổi phải sửa MỌI vật liệu (phá luật 2.1.9.i).
 *   ③ bản đồ texture **của người ngoài** lọt vào ⇒ kéo theo hồ sơ giấy phép vào bộ ship.
 *      🔴 SỬA 05/09 — luật cũ cấm MỌI bản đồ texture, và cái giá đo được là: 9 ảnh vân do CHÍNH
 *      IF sinh (`scripts/sinh-mau-vat-lieu.mjs`) nằm mồ côi trong `public/mau-vat-lieu/` 16 ngày
 *      (`grep` nơi dùng = 0), trong khi mọi quả cầu rơi về hai màu không vân. Lý do của luật là
 *      GIẤY PHÉP, và ảnh của chính mình thì không có rủi ro đó ⇒ thu hẹp, không bỏ: cấm ảnh
 *      NGOÀI (http · data: · thư mục khác) và cấm URL trỏ vào tệp KHÔNG TỒN TẠI.
 *
 * Chạy: node_modules/.bin/sucrase-node lib/materials/hat-giong.test.ts
 */
import {
  VAT_LIEU_HAT_GIONG,
  vatLieuHatGiong,
  pbrMapHatGiong,
  timVatLieuHatGiong,
} from './hat-giong';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { isMatIdUuid, normalizeMatIdCanonical } from './matid-identity';
import { inferPbrFromCategory } from './pbr-from-category';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean, detail?: string) {
  if (cond) pass += 1;
  else {
    fail += 1;
    console.error('  ✗', name, detail ?? '');
  }
}

/* ─── ① UUID BẤT BIẾN — khoá cứng từng chuỗi ─────────────────────────────────
   Danh sách này là HỢP ĐỒNG. Test đỏ ở đây có ĐÚNG HAI cách xử lý đúng:
     · đang sửa nhầm một UUID đã ship ⇒ HOÀN NGUYÊN, đừng sửa test.
     · đang THÊM vật liệu mới ⇒ thêm dòng mới vào bảng dưới, KHÔNG đổi dòng cũ.
   Sửa một dòng cũ cho test xanh = làm mồ côi dữ liệu người dùng trong im lặng. */
const HOP_DONG_UUID: Record<string, string> = {
  'IF-MAT-GO-SOI': 'f77b3a78-f2e3-4b19-b70f-20643c8a6243',
  'IF-MAT-GO-OC-CHO': 'e1f4694e-b25c-4dcb-86d4-0c787b69f857',
};

console.log('① matId hạt giống là UUID GÕ CỨNG, không bao giờ đổi');
for (const [code, uuid] of Object.entries(HOP_DONG_UUID)) {
  const v = VAT_LIEU_HAT_GIONG.find((m) => m.code === code);
  ok(`"${code}" còn trong kho`, !!v, 'đã bị xoá — vật liệu đã ship không được biến mất');
  ok(`"${code}" giữ NGUYÊN UUID đã ship`, v?.matId === uuid, `mong ${uuid}, đang là ${v?.matId}`);
}
ok(
  'mọi matId là UUID hợp lệ',
  VAT_LIEU_HAT_GIONG.every((v) => isMatIdUuid(v.matId)),
  VAT_LIEU_HAT_GIONG.filter((v) => !isMatIdUuid(v.matId)).map((v) => v.code).join(','),
);
ok(
  'mọi matId đã ở dạng canonical (lowercase) sẵn trong nguồn',
  VAT_LIEU_HAT_GIONG.every((v) => v.matId === normalizeMatIdCanonical(v.matId)),
);
ok(
  'không hai vật liệu nào trùng matId',
  new Set(VAT_LIEU_HAT_GIONG.map((v) => v.matId)).size === VAT_LIEU_HAT_GIONG.length,
);
ok(
  'không hai vật liệu nào trùng code',
  new Set(VAT_LIEU_HAT_GIONG.map((v) => v.code)).size === VAT_LIEU_HAT_GIONG.length,
);
// Sinh-lại-mỗi-lần-build là cách hỏng ràng buộc ① mà không ai thấy: nạp module hai lần phải ra
// CÙNG một chuỗi. Nếu ai đó thay bằng `generateMatId()`, khẳng định dưới đây vẫn xanh trong MỘT
// tiến trình — nên khoá cứng ở HOP_DONG_UUID phía trên mới là chốt thật; dòng này chỉ là lớp hai.
ok(
  'bảng tra trả về ĐÚNG bản ghi theo matId',
  VAT_LIEU_HAT_GIONG.every((v) => vatLieuHatGiong(v.matId)?.code === v.code),
);
ok('tra bằng UUID viết hoa vẫn ra đúng món', vatLieuHatGiong(HOP_DONG_UUID['IF-MAT-GO-SOI'].toUpperCase())?.code === 'IF-MAT-GO-SOI');
ok('tra bằng mã không phải UUID ⇒ null (không bịa)', vatLieuHatGiong('IF-MAT-GO-SOI') === null);
ok('tra UUID lạ ⇒ null', vatLieuHatGiong('00000000-0000-4000-8000-000000000000') === null);

/* ─── ② KHÔNG CHÉP GIÁ (luật 2.1.9.i) ───────────────────────────────────── */
console.log('② vật liệu TRỎ TỚI bản ghi thương mại — không chứa giá');
const KHOA_CAM_THUONG_MAI = [
  'price', 'priceVnd', 'gia', 'giaVnd', 'donGia', 'vendor', 'nhaCungCap', 'supplier',
  'supplierId', 'sku', 'brand', 'wastagePercent', 'haoHut', 'currency', 'packagingSpec',
];
for (const v of VAT_LIEU_HAT_GIONG) {
  const phang = JSON.stringify(v);
  const dinh = KHOA_CAM_THUONG_MAI.filter((k) => phang.includes(`"${k}"`));
  ok(`"${v.code}" không mang trường thương mại nào`, dinh.length === 0, `dính: ${dinh.join(',')}`);
}

/* ─── ③ BẢN ĐỒ TEXTURE: CHỈ ẢNH CỦA CHÍNH IF, VÀ PHẢI CÓ THẬT ─────────────── */
console.log('③ bản đồ texture chỉ được trỏ vào ảnh của chính IF, và tệp phải tồn tại');
const KHOA_TEXTURE = ['baseColorMapUrl', 'normalUrl', 'roughnessMapUrl', 'metallicMapUrl', 'heightUrl', 'aoUrl', 'photoUrl'] as const;
/** Thư mục ảnh do CHÍNH IF sinh ra bằng `scripts/sinh-mau-vat-lieu.mjs` — tất định, không tải
 * mạng, không chép của ai. Đây là ngoại lệ DUY NHẤT; mọi đường khác vẫn cấm. */
const DUONG_CHO_PHEP = '/mau-vat-lieu/';
for (const v of VAT_LIEU_HAT_GIONG) {
  for (const k of KHOA_TEXTURE) {
    const url = (v.pbr as Record<string, unknown>)[k];
    if (url === undefined) continue;
    ok(`"${v.code}".${k} là chuỗi`, typeof url === 'string');
    const u = String(url);
    /* CẤM ảnh ngoài: `http(s)://` kéo theo phụ thuộc mạng + giấy phép của người khác;
       `data:` nhét nhị phân vào mã nguồn và làm mọi khác biệt git thành rác. */
    ok(`"${v.code}".${k} không trỏ ra ngoài`, !/^(https?:)?\/\//.test(u) && !u.startsWith('data:'), u);
    ok(`"${v.code}".${k} nằm trong ${DUONG_CHO_PHEP}`, u.startsWith(DUONG_CHO_PHEP), u);
    /* URL trỏ vào tệp không tồn tại là **ô trống im lặng** trên máy người dùng — three.js nuốt
       lỗi tải (`loadPbrTextures` cố ý `.catch`), nên không có test này thì không ai biết. */
    ok(`"${v.code}".${k} có tệp THẬT trên đĩa`, existsSync(join(process.cwd(), 'public', u)), u);
  }
}
/* Có ảnh vân thì BẮT BUỘC khai bước lặp — thiếu nó là vân sai tỉ lệ, lỗi NHÌN THẤY ĐƯỢC
   (`ba-mat.ts` cũng hạ mặt 3D xuống `chuaDu` đúng ca này). */
for (const v of VAT_LIEU_HAT_GIONG) {
  if (!v.pbr.baseColorMapUrl) continue;
  ok(`"${v.code}" có ảnh vân thì phải có uvScaleMm`, !!v.pbr.uvScaleMm && v.pbr.uvScaleMm.w > 0 && v.pbr.uvScaleMm.h > 0);
  /* glTF: `baseColorFactor × baseColorTexture`. Ảnh vân đủ màu phải đi với hệ số TRẮNG, không
     thì ảnh bị ám màu — gỗ óc chó nhân với chính màu nâu của nó ra gần đen. */
  ok(`"${v.code}" có ảnh vân thì baseColor phải TRẮNG (hệ số nhân)`, (v.pbr.baseColor ?? '').toLowerCase() === '#ffffff', String(v.pbr.baseColor));
}

/* ─── GIẤY PHÉP — mọi tài sản phân phối phải khai tường minh ─────────────── */
console.log('giấy phép + nguồn khai tường minh trên TỪNG món');
for (const v of VAT_LIEU_HAT_GIONG) {
  ok(`"${v.code}" có license`, typeof v.license === 'string' && v.license.trim().length > 0);
  ok(`"${v.code}" có source`, typeof v.source === 'string' && v.source.trim().length > 0);
}

/* ─── THAM SỐ RENDER dùng được thật, không phải chỗ giữ chỗ ───────────────── */
console.log('tham số PBR đủ để render ngay, và khớp họ vật liệu nó tự khai');
for (const v of VAT_LIEU_HAT_GIONG) {
  ok(`"${v.code}" có baseColor sRGB`, /^#[0-9a-f]{6}$/i.test(v.pbr.baseColor ?? ''), v.pbr.baseColor);
  ok(`"${v.code}" roughness trong [0,1]`, typeof v.pbr.roughness === 'number' && v.pbr.roughness >= 0 && v.pbr.roughness <= 1, String(v.pbr.roughness));
  ok(`"${v.code}" metallic là 0 hoặc 1 (glTF metal/rough)`, v.pbr.metallic === 0 || v.pbr.metallic === 1, String(v.pbr.metallic));
  /* 🔴 05/09 — LUẬT NÀY TỪNG LÀ VÔ ĐIỀU KIỆN, và nó SAI với vật liệu không có ảnh vân.
     `uvScaleMm` là tỉ lệ để LÁT MỘT ẢNH; không có ảnh thì `uvRepeatOf` không áp vào đâu cả, nên
     bắt khai là bắt dựng một con số vật lý **không ai kiểm được và không ai dùng** — đúng thứ
     "bịa tỉ lệ" mà chính bảng này cấm. Ca thật: đồng xước và sơn matt ship THAM SỐ (lý do ghi ở
     `hat-giong.ts`), và chúng render đúng mà không cần trường này.
     ⇒ Bắt buộc **khi và chỉ khi** có ảnh vân — khẳng định đó nằm ở khối ③ phía trên. */
  if (v.pbr.baseColorMapUrl) {
    ok(`"${v.code}" có ảnh vân ⇒ khai bước lặp vân bằng mm thật`, !!v.pbr.uvScaleMm && v.pbr.uvScaleMm.w > 0 && v.pbr.uvScaleMm.h > 0);
  }
  // Hạt giống là giá trị CHỌN CÓ CHỦ Ý, không phải máy suy ⇒ không được đeo cờ suyDoan.
  ok(`"${v.code}" KHÔNG đeo cờ suyDoan`, v.pbr.suyDoan !== true);
  // `inferPbrFromCategory` là ĐƯỜNG SUY KHI THIẾU, không phải kho. Nhưng hạt giống không được
  // mâu thuẫn với nó: cùng họ thì độ nhám phải cùng phía, lệch quá 0.25 là một trong hai sai.
  const suy = inferPbrFromCategory(v.danhMuc);
  ok(
    `"${v.code}" không mâu thuẫn với đường suy theo họ "${v.hoPbr}"`,
    Math.abs((v.pbr.roughness ?? 0) - suy.roughness) <= 0.25 && v.pbr.metallic === suy.metallic,
    `hạt giống rough=${v.pbr.roughness} metallic=${v.pbr.metallic} · đường suy rough=${suy.roughness} metallic=${suy.metallic}`,
  );
}

/* ─── KHO PBR + TÌM ───────────────────────────────────────────────────────── */
console.log('kho PBR hạt giống + khâu TÌM');
const kho = pbrMapHatGiong();
ok('kho PBR đủ số món', Object.keys(kho).length === VAT_LIEU_HAT_GIONG.length, `${Object.keys(kho).length}`);
ok('kho PBR khoá bằng UUID canonical', Object.keys(kho).every((k) => isMatIdUuid(k) && k === k.toLowerCase()));
kho[VAT_LIEU_HAT_GIONG[0].matId] = { roughness: 0.99 };
ok(
  'kho hạt giống CHỈ ĐỌC — ghi vào bản trả về không làm bẩn nguồn',
  pbrMapHatGiong()[VAT_LIEU_HAT_GIONG[0].matId].roughness === VAT_LIEU_HAT_GIONG[0].pbr.roughness,
);
ok('tìm "sồi" ra gỗ sồi', timVatLieuHatGiong('sồi').some((v) => v.code === 'IF-MAT-GO-SOI'));
ok('tìm không dấu "soi" cũng ra', timVatLieuHatGiong('soi').some((v) => v.code === 'IF-MAT-GO-SOI'));
ok('tìm tiếng Anh "walnut" ra gỗ óc chó', timVatLieuHatGiong('walnut').some((v) => v.code === 'IF-MAT-GO-OC-CHO'));
ok('tìm chuỗi rỗng ⇒ mở kệ ra thấy hết', timVatLieuHatGiong('').length === VAT_LIEU_HAT_GIONG.length);
ok('tìm chuỗi không khớp gì ⇒ rỗng (không trả bừa)', timVatLieuHatGiong('bê tông mài').length === 0);

console.log(`\n${pass} pass · ${fail} fail`);
if (fail > 0) process.exit(1);
