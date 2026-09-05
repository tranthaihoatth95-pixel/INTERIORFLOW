/** Test `thang-chu-y.ts` — chạy: node_modules/.bin/sucrase-node lib/home/thang-chu-y.test.ts
 *
 * Đây là chỗ CƠ CHẾ của bản khoá Home được chứng minh bằng máy, không phải bằng lời hứa:
 *
 *   ① bậc DO TRẠNG THÁI tính ra (không ai gán tay)
 *   ② ĐÚNG MỘT tiêu điểm, kể cả khi có nhiều việc dở  (D-DR2)
 *   ③ ⭐ MẬT ĐỘ TĂNG THÌ VẬT TỤT BẬC, KHÔNG ĐÒI THÊM CHỖ — 3 vật và 40 vật cho ra
 *      `keBen.length` / `nen.length` **y hệt nhau** ⇒ hình học không đổi một pixel.
 *      Đây là điểm chết của H2, và là câu nghiệm thu chính của phiếu thi công.
 *   ④ KHÔNG MỤC NÀO BIẾN MẤT IM LẶNG (§30) — tổng vào = tổng ra, phần rơi được ĐẾM.
 *   ⑤ khổ hẹp đổi SỐ NGƯỜI trên bậc, không đổi hệ.
 */
import {
  xepThang,
  bacTuTrangThai,
  cauKhiGoi,
  TRAN,
  TRAN_HEP,
  type VatHome,
  type TrangThai,
} from './thang-chu-y';

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean) {
  if (cond) {
    pass++;
    console.log('  ok  -', name);
  } else {
    fail++;
    console.log('  FAIL-', name);
  }
}
function eq(name: string, a: unknown, b: unknown) {
  ok(`${name} (${JSON.stringify(a)} = ${JSON.stringify(b)})`, JSON.stringify(a) === JSON.stringify(b));
}

const T0 = new Date(2026, 8, 4, 10, 0, 0).getTime();
let seq = 0;
function vat(trangThai: TrangThai, loai: VatHome['loai'] = 'viec'): VatHome {
  seq += 1;
  return { id: `v${seq}`, ten: `vật ${seq}`, loai, trangThai, lucCuoi: T0 - seq * 1000 };
}
function nhieu(n: number, trangThai: TrangThai, loai: VatHome['loai'] = 'viec'): VatHome[] {
  return Array.from({ length: n }, () => vat(trangThai, loai));
}

console.log('① bậc do TRẠNG THÁI tính ra');
eq('dang-do → ngay-bay-gio', bacTuTrangThai('dang-do'), 'ngay-bay-gio');
eq('can-toi → ke-ben', bacTuTrangThai('can-toi'), 'ke-ben');
eq('dang-chay → nen', bacTuTrangThai('dang-chay'), 'nen');
eq('dang-cho → nen', bacTuTrangThai('dang-cho'), 'nen');
eq('lech → nen', bacTuTrangThai('lech'), 'nen');
eq('ngu → khi-goi', bacTuTrangThai('ngu'), 'khi-goi');

console.log('② ĐÚNG MỘT tiêu điểm, kể cả khi có ba việc dở');
{
  const r = xepThang(nhieu(3, 'dang-do'));
  ok('đúng 1 vật ở bậc NGAY BÂY GIỜ', r.ngayBayGio !== null);
  eq('hai việc dở còn lại TỤT xuống KỀ BÊN', r.keBen.length, 2);
}

console.log('③ ⭐ MẬT ĐỘ TĂNG THÌ TỤT BẬC — HÌNH HỌC KHÔNG ĐỔI');
{
  seq = 0;
  const it = xepThang([vat('dang-do'), ...nhieu(2, 'can-toi'), ...nhieu(3, 'dang-cho')]);
  seq = 0;
  const nhieuViec = xepThang([
    ...nhieu(3, 'dang-do'),
    ...nhieu(14, 'can-toi', 'du-an'),
    ...nhieu(11, 'dang-cho'),
    ...nhieu(12, 'ngu', 'vat-the'),
  ]);

  eq('KỀ BÊN ít việc', it.keBen.length, 2);
  eq('KỀ BÊN nhiều việc = ĐÚNG TRẦN', nhieuViec.keBen.length, TRAN.keBen);
  eq('NỀN ít việc', it.nen.length, 3);
  eq('NỀN nhiều việc = ĐÚNG TRẦN', nhieuViec.nen.length, TRAN.nen);
  ok('KỀ BÊN không bao giờ vượt trần', nhieuViec.keBen.length <= TRAN.keBen);
  ok('NỀN không bao giờ vượt trần', nhieuViec.nen.length <= TRAN.nen);
  ok('vẫn ĐÚNG MỘT thân', nhieuViec.ngayBayGio !== null);
  ok('phần dôi ra rơi xuống KHI GỌI', nhieuViec.tongKhiGoi > 0);
}

console.log('④ KHÔNG MỤC NÀO BIẾN MẤT IM LẶNG — tổng vào = tổng ra');
{
  seq = 0;
  const vao = [
    ...nhieu(2, 'dang-do'),
    ...nhieu(9, 'can-toi', 'du-an'),
    ...nhieu(7, 'dang-chay'),
    ...nhieu(5, 'ngu', 'vat-the'),
  ];
  const r = xepThang(vao);
  const ra = (r.ngayBayGio ? 1 : 0) + r.keBen.length + r.nen.length + r.tongKhiGoi;
  eq('tổng vào = tổng ra', ra, vao.length);
  eq('đếm KHI GỌI cộng lại = tổng KHI GỌI', r.khiGoi.reduce((s, d) => s + d.soLuong, 0), r.tongKhiGoi);
  ok('con số KHI GỌI có TÊN LOẠI', r.khiGoi.every((d) => typeof d.loai === 'string'));
}

console.log('⑤ khổ hẹp đổi SỐ NGƯỜI trên bậc, không đổi hệ');
{
  seq = 0;
  const vao = [vat('dang-do'), ...nhieu(6, 'can-toi'), ...nhieu(9, 'dang-cho')];
  const rong = xepThang(vao, false);
  const hep = xepThang(vao, true);
  eq('rộng: KỀ BÊN', rong.keBen.length, TRAN.keBen);
  eq('hẹp:  KỀ BÊN', hep.keBen.length, TRAN_HEP.keBen);
  eq('rộng: NỀN', rong.nen.length, TRAN.nen);
  eq('hẹp:  NỀN', hep.nen.length, TRAN_HEP.nen);
  ok('thu lại thì KHI GỌI đếm NHIỀU HƠN, không mất', hep.tongKhiGoi > rong.tongKhiGoi);
  eq(
    'hẹp cũng không mất mục nào',
    (hep.ngayBayGio ? 1 : 0) + hep.keBen.length + hep.nen.length + hep.tongKhiGoi,
    vao.length,
  );
}

console.log('⑥ rỗng thì KHÔNG dựng mục rỗng');
{
  const r = xepThang([]);
  eq('không có tiêu điểm', r.ngayBayGio, null);
  eq('không có dòng KHI GỌI', cauKhiGoi(r.khiGoi), null);
  eq('câu KHI GỌI một loại', cauKhiGoi([{ loai: 'viec', soLuong: 4 }]), 'còn 4 việc đang ngủ');
  eq(
    'câu KHI GỌI hai loại',
    cauKhiGoi([
      { loai: 'viec', soLuong: 4 },
      { loai: 'du-an', soLuong: 6 },
    ]),
    'còn 4 việc và 6 dự án đang ngủ',
  );
}

console.log('⑦ tất định — cùng đầu vào, hai lượt cho kết quả y hệt');
{
  seq = 0;
  const vao = [vat('dang-do'), ...nhieu(8, 'can-toi'), ...nhieu(8, 'dang-cho')];
  eq('hai lượt trùng khít', JSON.stringify(xepThang(vao)), JSON.stringify(xepThang(vao)));
}

console.log(`\n${pass} ok · ${fail} fail`);
if (fail > 0) process.exit(1);
