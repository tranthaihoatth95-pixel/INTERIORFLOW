/**
 * app/files/_lib/ngan-tho.test.ts — [marker: filesHaiNgan] V2 17/08.
 * Chạy: node_modules/.bin/sucrase-node app/files/_lib/ngan-tho.test.ts
 *
 * Ba thứ test này CANH, ngoài chuyện chạy đúng:
 *  ① **Ngăn thô không được bịa khoảng giá.** Nhóm không món nào ghi giá ⇒ `null`, không phải `0–0`.
 *  ② **Ca `chuaDu` phải LỌT VÀO ngăn thô.** Món có ảnh vân mà quên bước lặp vân trông như đã xong;
 *     lọc theo kiểu "có PBR là đủ" sẽ đánh rơi đúng ca đắt nhất. Test này chặn cách lọc đó.
 *  ③ **Chuỗi khoảng giá LUÔN mang chữ *kho chung***, để không nơi nào lỡ bày nó ra như giá chốt
 *     của một dự án (hai nửa cố ý tách — xem docstring `ngan-tho.ts`).
 */
import { locMonTho, khoangGiaCuaNhom, tomTatNganTho, NGAN_LABEL, NGAN_MOTA, type MonKhoChung } from './ngan-tho';
import type { MaterialPbr } from '../../../lib/materials/schema';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

const kho: MonKhoChung[] = [
  // đủ để render — PHẢI rời ngăn thô
  { id: '1', kind: 'da', sku: 'TRV-BE', name: 'Đá travertine be', vendor: 'Stoneworld', unit: 'm2', priceVnd: 850_000 },
  // có ảnh vân, THIẾU bước lặp vân ⇒ chuaDu, phải Ở LẠI ngăn thô
  { id: '2', kind: 'da', sku: 'GRA-DEN', name: 'Đá granite đen', vendor: 'Stoneworld', unit: 'm2', priceVnd: 1_200_000, imageAssetId: 'a2' },
  // chưa có thông số render nào ⇒ chuaCo
  { id: '3', kind: 'go', sku: 'OAK-NT', name: 'Gỗ sồi tự nhiên', brand: 'Woodhouse', unit: 'm2', priceVnd: null },
  // chưa có mã ⇒ ngăn này bỏ qua, không phải việc của nó
  { id: '4', kind: 'go', sku: null, name: 'Món chưa đặt mã', unit: 'm2', priceVnd: 500_000 },
];

const pbrMap: Record<string, MaterialPbr> = {
  'TRV-BE': { typeId: 'da-tu-nhien', roughness: 0.5, metallic: 0 },
  'GRA-DEN': { baseColorMapUrl: 'data:image/png;base64,xx', roughness: 0.3 }, // thiếu uvScaleMm
};

const tho = locMonTho(kho, { pbrMap, defs: [] });
const ma = tho.map((m) => m.matId).sort();

ok('món đủ định nghĩa render thì RỜI ngăn thô (TRV-BE vắng mặt)', !ma.includes('TRV-BE'));
ok('ca chuaDu — có ảnh vân mà thiếu bước lặp vân — VẪN nằm trong ngăn thô', ma.includes('GRA-DEN'));
ok('ca chuaCo — chưa thông số render nào — nằm trong ngăn thô', ma.includes('OAK-NT'));
ok('món CHƯA CÓ MÃ bị bỏ qua (không khoá nối thì không tra được mặt nào)', tho.length === 2);

const graden = tho.find((m) => m.matId === 'GRA-DEN');
ok('món thô luôn nói THIẾU GÌ', !!graden?.matDung3d.thieu);
ok('món thô luôn nói LÀM SAO CÓ (cấm ô trống câm)', !!graden?.matDung3d.loiRa);
ok('cờ có-ảnh-vân đọc được từ kho chung', graden?.coAnhVan === true);
ok('nhà cung cấp đọc được từ kho chung', graden?.nhaCungCap === 'Stoneworld');

const oak = tho.find((m) => m.matId === 'OAK-NT');
ok('món chưa có thông số thì KHÔNG khoe ảnh vân', oak?.coAnhVan === false);
ok('thiếu vendor thì lùi về brand, không để trống câm', oak?.nhaCungCap === 'Woodhouse');

// ① khoảng giá
const kgDa = khoangGiaCuaNhom(kho, 'da');
ok('khoảng giá nhóm đá lấy đúng min/max có thật', kgDa?.thap === 850_000 && kgDa?.cao === 1_200_000);
ok('khoảng giá đếm đúng số món có giá', kgDa?.soMonCoGia === 2);
ok('③ chuỗi khoảng giá mang chữ "kho chung"', (kgDa?.chu.vi ?? '').includes('kho chung'));
ok('③ bản tiếng Anh mang chữ "shared catalogue"', (kgDa?.chu.en ?? '').includes('shared catalogue'));
ok('khoảng giá có đơn vị của kho', (kgDa?.chu.vi ?? '').includes('/m2'));

const khoKhongGia: MonKhoChung[] = [
  { id: 'x', kind: 'vai', sku: 'FAB-1', name: 'Vải bố', unit: 'm', priceVnd: null },
  { id: 'y', kind: 'vai', sku: 'FAB-2', name: 'Vải nhung', unit: 'm', priceVnd: null },
];
ok('① nhóm không món nào ghi giá ⇒ null, KHÔNG bịa khoảng 0–0', khoangGiaCuaNhom(khoKhongGia, 'vai') === null);
ok('nhóm không tồn tại ⇒ null', khoangGiaCuaNhom(kho, 'khong-co-nhom-nay') === null);

const motMon: MonKhoChung[] = [{ id: 'z', kind: 'kim', sku: 'INOX', name: 'Inox 304', unit: 'kg', priceVnd: 90_000 }];
const kgMot = khoangGiaCuaNhom(motMon, 'kim');
ok('nhóm đúng một mức giá thì hiện MỘT số, không hiện "90 000–90 000"', !(kgMot?.chu.vi ?? '').includes('–'));

// dòng tổng — ba ca khác hẳn nhau
ok('kho rỗng nói "chưa có món nào"', tomTatNganTho([], 0).vi.includes('chưa có món nào'));
ok('mọi món đã đủ ⇒ câu TIN TỐT, không dùng khuôn "không có gì"', tomTatNganTho([], 4).vi.includes('đều đã đủ'));
ok('còn món thô ⇒ nói rõ mấy trên mấy', tomTatNganTho(tho, 4).vi.startsWith('2/4'));

// nhãn hai ngăn — chữ phải phân biệt được BẢN CHẤT, không chỉ tên
ok('hai ngăn khác tên', NGAN_LABEL.duAn.ten.vi !== NGAN_LABEL.thoChung.ten.vi);
ok('hai ngăn khai rõ AI THẤY — đây là chỗ khác bản chất', NGAN_LABEL.duAn.aiThay.vi !== NGAN_LABEL.thoChung.aiThay.vi);
ok('ngăn thô nói thẳng "chưa đủ định nghĩa để render"', NGAN_MOTA.thoChung.vi.includes('chưa đủ định nghĩa để render'));
ok('mọi nhãn có đủ cả hai thứ tiếng', [NGAN_LABEL.duAn, NGAN_LABEL.thoChung].every((n) => n.ten.en.length > 0 && n.aiThay.en.length > 0));

console.log(`\nngan-tho: ${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
