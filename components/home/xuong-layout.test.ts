/**
 * components/home/xuong-layout.test.ts — canh ba khẳng định mà LUẬT 20/08 dựa vào, để bố cục
 * không lặng lẽ trôi về lưới đều:
 *   ① Vị trí tiêu điểm KHÔNG đổi giữa A/B/C (một không gian lớn lên, không phải ba dashboard).
 *   ② Cụm phụ luôn theo ĐÚNG một thứ tự ưu tiên, và mục rỗng thì KHÔNG chiếm chỗ.
 *   ③ Hai vùng KHÔNG BAO GIỜ bằng nhau — 1:1 là lưới đều, thứ bị cấm.
 */

import assert from 'node:assert/strict';
import { bocCucXuong, cotXuong, THU_TU_PHU, type CoDuLieuPhu } from './xuong-layout';

const RONG: CoDuLieuPhu = {
  homNay: false, mocToi: false, vatLieu: false, anhTuan: false, bieuDo: false, dongTin: false,
};
const DAY: CoDuLieuPhu = {
  homNay: true, mocToi: true, vatLieu: true, anhTuan: true, bieuDo: true, dongTin: true,
};

/* ① A/B/C — cùng MỘT vùng tiêu điểm ------------------------------------------------------ */
const A = bocCucXuong({ coDuAn: false, coViecDo: false, duLieu: RONG });
const B = bocCucXuong({ coDuAn: true, coViecDo: true, duLieu: RONG });
const C = bocCucXuong({ coDuAn: true, coViecDo: true, duLieu: DAY });

assert.equal(A.tieuDiem, 'ngaySoKhong', 'A: chưa có dự án ⇒ tiêu điểm là ba cửa');
assert.equal(B.tieuDiem, 'duAn');
assert.equal(C.tieuDiem, 'duAn');
// Tiêu điểm luôn là ô 01 ở CẢ BA trạng thái — nó không nhảy chỗ, không tụt hạng.
for (const bc of [A, B, C]) assert.equal(bc.soO.tieuDiem, '01');

// Việc dở KHÔNG mọc ra ở Ngày-Số-Không (không có dự án thì không có gì để tiếp).
assert.equal(bocCucXuong({ coDuAn: false, coViecDo: true, duLieu: RONG }).banViecDo, false);
assert.equal(B.banViecDo, true, 'B: có dự án + có việc dở ⇒ dải việc-dở mọc trên tiêu điểm');
assert.equal(bocCucXuong({ coDuAn: true, coViecDo: false, duLieu: RONG }).banViecDo, false);

/* ② cụm phụ — mỏng khi rỗng, đúng thứ tự khi dày ------------------------------------------ */
assert.deepEqual(A.cumPhu, ['chao', 'ghiChu'], 'rỗng ⇒ chỉ hai mục LUÔN sống, không khung rỗng');
assert.deepEqual(C.cumPhu, [...THU_TU_PHU], 'dày ⇒ đủ, và đúng thứ tự ưu tiên đã khai');

// Mục rỗng không chiếm chỗ, và số ô liền mạch (không đứt dãy như bản gán cứng cũ).
const chiMocToi = bocCucXuong({ coDuAn: true, coViecDo: false, duLieu: { ...RONG, mocToi: true } });
assert.deepEqual(chiMocToi.cumPhu, ['chao', 'mocToi', 'ghiChu']);
assert.deepEqual(
  chiMocToi.cumPhu.map((m) => chiMocToi.soO[m]),
  ['02', '03', '04'],
);
assert.equal(chiMocToi.soO.anhTuan, undefined, 'mục không hiện thì KHÔNG có số');

// Quét toàn bộ 64 tổ hợp cờ: số ô luôn liền mạch từ 02, không trùng, không đứt.
const co = ['homNay', 'mocToi', 'vatLieu', 'anhTuan', 'bieuDo', 'dongTin'] as const;
for (let mask = 0; mask < 64; mask++) {
  const duLieu: CoDuLieuPhu = {
    homNay: Boolean(mask & 1),
    mocToi: Boolean(mask & 2),
    vatLieu: Boolean(mask & 4),
    anhTuan: Boolean(mask & 8),
    bieuDo: Boolean(mask & 16),
    dongTin: Boolean(mask & 32),
  };
  void co;
  const bc = bocCucXuong({ coDuAn: true, coViecDo: false, duLieu });
  const so = bc.cumPhu.map((m) => bc.soO[m]);
  assert.deepEqual(so, bc.cumPhu.map((_, i) => (i + 2 < 10 ? `0${i + 2}` : `${i + 2}`)), `mask ${mask}`);
  assert.ok(bc.cumPhu.includes('chao') && bc.cumPhu.includes('ghiChu'), `mask ${mask}: hai mục luôn sống`);
}

/* ③ hai vùng không bao giờ bằng nhau ------------------------------------------------------ */
for (const n of [0, 1, 2, 3, 5, 8]) {
  const cot = cotXuong(n);
  const [a, b] = [...cot.matchAll(/([\d.]+)fr/g)].map((m) => Number(m[1]));
  assert.notEqual(a, b, `n=${n}: 1:1 là lưới đều — thứ luật 20/08 cấm`);
  assert.ok(a > b, `n=${n}: tiêu điểm phải rộng hơn cụm phụ`);
}
// Dữ liệu mỏng ⇒ cụm phụ hẹp hơn nữa, nền chiếm chỗ nhiều hơn.
assert.ok(cotXuong(2) !== cotXuong(5));

console.log('xuong-layout: OK');

/* ④ hai loại mục, hai luật — canh đúng ba ca đã SẬP/NGHIẾN trên app thật 20/08 --------------- */
import { hangPhu } from './xuong-layout';
// Mục BỀ MẶT phải có diện tích: `auto` từng làm Ảnh tuần sập còn 2px, Ghi chú còn 105px.
assert.equal(hangPhu('anhTuan').flex, '0 0 20vh', 'ảnh tuần là BỀ MẶT — auto thì nó sập về 0');
assert.equal(hangPhu('ghiChu').minHeight, '16vh', 'ghi chú phải có SÀN, không chỉ phần thừa');
// Mục KÝ HIỆU cao đúng nội dung — VÀ không được phép bị CO (ca Biểu đồ chặng 289px → 106px).
for (const m of ['chao', 'homNay', 'mocToi', 'vatLieu', 'bieuDo', 'dongTin'] as const) {
  assert.equal(hangPhu(m).flex, '0 0 auto', `${m}: cao đúng nội dung, cấm co cấm dãn`);
}
// Không mục nào được `flex-shrink` khác 0 — shrink là đường quay lại chỗ nghiến.
for (const m of THU_TU_PHU) {
  assert.equal(hangPhu(m).flex.split(' ')[1], '0', `${m}: flex-shrink phải là 0`);
  assert.ok(!/\dpx/.test(JSON.stringify(hangPhu(m))), `${m}: cấm khai px`);
}
console.log('xuong-layout ④ hàng cụm phụ: OK');
