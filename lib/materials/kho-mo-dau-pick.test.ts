/**
 * lib/materials/kho-mo-dau-pick.test.ts — CANH ĐƯỜNG DÂY "hạt giống → ô chọn vật liệu 2D".
 *
 * ⛔ VÌ SAO CÓ TỆP NÀY — ca thật đo được 04/09: `lib/materials/hat-giong.ts` và `tang-phan-giai.ts`
 * đã có test đầy đủ và XANH, nhưng trên **máy sạch** (`ProductSpec` = 0) mở chặng 2D ra thì ô chọn
 * vật liệu vẫn hiện *"Kho chưa có vật liệu nào"* — vì `MaterialPalette` đọc THUẦN `/api/specs`.
 * Tức **lõi đúng, test lõi xanh, mà người dùng không chọn được gì.** Đúng họ lỗi "có trong mã
 * nhưng không tới được người dùng" mà đội đã trả giá nhiều lần.
 * ⇒ Test này KHÔNG kiểm lại lõi (`hat-giong.test.ts` lo rồi). Nó kiểm đúng **đoạn dây cuối**:
 *   ① phép trộn cho ô chọn 2D có trả hạt giống khi kho DB rỗng không
 *   ② mặt tiền 2D có THẬT SỰ gọi phép trộn đó không — grep chính tệp component.
 * Vế ② là vế đắt: thiếu nó thì ai đó gỡ một dòng import, mọi test khác vẫn xanh, và bệnh cũ
 * quay lại y nguyên mà không máy nào kêu.
 *
 * Chạy: node_modules/.bin/sucrase-node lib/materials/kho-mo-dau-pick.test.ts
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { pickHatGiong, tronPickHatGiong, laHangHatGiong } from './kho-mo-dau';
import { VAT_LIEU_HAT_GIONG } from './hat-giong';

let pass = 0;
let fail = 0;
const ok = (ten: string, dieu: boolean, chiTiet = '') => {
  if (dieu) { pass++; console.log(`  ok  - ${ten}`); }
  else { fail++; console.log(`  FAIL- ${ten}${chiTiet ? `  (${chiTiet})` : ''}`); }
};

console.log('kho-mo-dau-pick — dây hạt giống → ô chọn vật liệu 2D');

/* ── ① phép trộn ────────────────────────────────────────────────────────── */
const seed = pickHatGiong();
ok('mỗi vật liệu hạt giống thành đúng một dòng chọn được',
  seed.length === VAT_LIEU_HAT_GIONG.length, `${seed.length} vs ${VAT_LIEU_HAT_GIONG.length}`);

ok('mọi dòng đều có `id` — không có id thì không gán được cho entity nào',
  seed.every((r) => typeof r.id === 'string' && r.id.length > 0));

ok('`id` mang tiền tố hạt giống ⇒ không bao giờ lẫn với cuid của bản ghi DB',
  seed.every((r) => laHangHatGiong({ id: r.id })));

/* Luật 2.1.9.i — vật liệu TRỎ TỚI bản ghi thương mại, KHÔNG chép giá vào mình. Hạt giống chưa có
   bản ghi thương mại nào ⇒ giá phải là `null`, và bảng hiện "—". Bịa giá ở đây là bịa một con số
   sẽ chảy thẳng vào BOQ. */
ok('KHÔNG chép giá vào dòng hạt giống (luật 2.1.9.i)',
  seed.every((r) => r.priceVnd === null && r.unit === null));

/* Ca chính: máy sạch — `/api/specs` trả rỗng. */
ok('KHO DB RỖNG ⇒ ô chọn 2D vẫn có vật liệu (đây là ca máy sạch)',
  tronPickHatGiong([]).length === seed.length);

ok('kho `null` (chưa nạp xong / fetch hỏng) cũng không làm rỗng ô chọn',
  tronPickHatGiong(null).length === seed.length);

/* Dòng kho THẬT phải thắng khi trùng mã — hiện hai dòng là đếm trùng một vật. */
const skuTrung = seed[0].sku;
const tronTrung = tronPickHatGiong([{ id: 'db-1', name: 'Bản studio tự nhập', sku: skuTrung, colorHex: null, unit: 'm2', priceVnd: 1 }]);
ok('trùng `sku` ⇒ dòng KHO THẬT thắng, hạt giống nhường (không hiện hai dòng một vật)',
  tronTrung.length === seed.length && !tronTrung.some((r) => laHangHatGiong({ id: r.id }) && r.sku === skuTrung),
  `còn ${tronTrung.length} dòng`);

ok('so `sku` không phân biệt hoa/thường và khoảng trắng thừa',
  tronPickHatGiong([{ id: 'db-2', name: 'x', sku: `  ${String(skuTrung).toLowerCase()} `, colorHex: null, unit: null, priceVnd: null }]).length === seed.length);

ok('dòng kho KHÔNG trùng thì cộng thêm, không nuốt mất',
  tronPickHatGiong([{ id: 'db-3', name: 'Đá marble', sku: 'STUDIO-DA-01', colorHex: null, unit: null, priceVnd: null }]).length === seed.length + 1);

ok('hạt giống đứng TRƯỚC dòng kho — nó là nền của kho, có từ lần chạy đầu',
  laHangHatGiong({ id: tronPickHatGiong([{ id: 'db-4', name: 'z', sku: 'Z-1', colorHex: null, unit: null, priceVnd: null }])[0].id }));

/* ── ② mặt tiền 2D có thật sự cắm dây không ─────────────────────────────── */
/* Vế này cố ý đọc TỆP NGUỒN chứ không import component: `MaterialPalette` là React client
   component, kéo nó vào sucrase-node là kéo cả cây React/portal — đắt và giòn, mà thứ cần khẳng
   định chỉ là "đoạn dây còn cắm hay không". Đọc chữ là đủ và rẻ. */
const nguon = readFileSync(join(__dirname, '../../components/cad/MaterialPalette.tsx'), 'utf8');
ok('MaterialPalette CÓ import phép trộn hạt giống',
  /import\s*\{[^}]*tronPickHatGiong[^}]*\}\s*from\s*'@\/lib\/materials\/kho-mo-dau'/.test(nguon));

ok('MaterialPalette CÓ gọi phép trộn khi nạp kho (không chỉ import cho có)',
  /setKho\(\s*tronPickHatGiong\(/.test(nguon),
  'đường nạp kho phải đi qua tronPickHatGiong, nếu không máy sạch lại hiện kho rỗng');

/* Ràng buộc vừa nối xong ở lượt trước — đừng để lượt sau đánh rơi: dòng kho phải truyền `specId`
   xuống `applyMaterial` (tham số thứ 6). Rơi tham số này là mở lại đúng đứt gãy moat.
   🔧 SỬA 05/09 (V8c bước 4): bản cũ neo vào **VỊ TRÍ CUỐI** (`r.id` rồi `)`), nên vừa thêm tham số
   thứ 7 (`matId`) là nó đỏ — dù `r.id` vẫn được truyền đúng. Đó là test neo vào thứ KHÔNG PHẢI
   điều nó muốn khẳng định: nó quan tâm "specId có đi tiếp không", không quan tâm nó đứng thứ mấy.
   Nay neo vào CHÍNH điều đó, và có thêm ca cho `matId` — hai vế của cùng một danh tính. */
const goiApply = nguon.replace(/\s+/g, ' ').match(/applyMaterial\([^;]*?\);/g) ?? [];
const goiDongKho = goiApply.find((g) => g.includes('r.name')) ?? '';
ok('dòng kho vẫn mang `specId` (r.id) đi tiếp xuống applyMaterial',
  /\br\.id\b/.test(goiDongKho), `lời gọi thấy được: ${goiDongKho || '(không tìm thấy)'}`);
ok('dòng kho mang CẢ `matId` (UUID) — thứ chặng 3D tra ra ảnh vân',
  /matIdCuaNhom\(/.test(goiDongKho), `lời gọi thấy được: ${goiDongKho || '(không tìm thấy)'}`);
ok('preset đã khai matId cũng truyền UUID xuống (hạt giống trộn vào ô chọn 2D)',
  /applyMaterial\(\s*m\.name[^;]*m\.matId/.test(nguon.replace(/\s+/g, ' ')));

console.log(`\n${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
