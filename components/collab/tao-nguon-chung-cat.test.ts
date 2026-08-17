/**
 * components/collab/tao-nguon-chung-cat.test.ts — chạy bằng:
 *   node_modules/.bin/sucrase-node components/collab/tao-nguon-chung-cat.test.ts
 *
 * Canh CÂY CẦU duy nhất giữa Cửa Sổ Thảo Luận (COLLAB-VO) và distiller (COLLAB-LOI):
 *  ① hàng so cực chưa bấm KHÔNG lộ ra `fields` (khác 0);
 *  ② rỗng ⇒ không xuất nguồn tương ứng (mảng có thể rỗng hoàn toàn);
 *  ③ id cố định (`ban-so-cuc` · `cau-chuyen-3-hoi`) — để merge nhiều lượt truy nguồn cũ;
 *  ④ `formKind` khớp với union LOI (`'poles'` · `'ba-hoi'`);
 *  ⑤ moodboard v0 không xuất — ghi rõ để phiên sau không tưởng là bỏ sót.
 */

import { taoNguonChungCat } from './tao-nguon-chung-cat';

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

console.log('components/collab/tao-nguon-chung-cat.test.ts');

// ① — hoàn toàn rỗng
const nguon0 = taoNguonChungCat({ soCuc: [], baHoi: [], moodboardDaMo: false });
ok('đầu vào rỗng ⇒ nguồn rỗng, không throw', nguon0.length === 0);

// ② — moodboard đã mở nhưng không có bảng nào ⇒ vẫn KHÔNG xuất (v0 chưa nối đường ảnh)
const nguon1 = taoNguonChungCat({ soCuc: [], baHoi: [], moodboardDaMo: true });
ok('moodboard mở tay không đủ điều kiện xuất (v0)', nguon1.length === 0);

// ③ — chỉ hàng so cực đã bấm mới lộ ra fields
const nguon2 = taoNguonChungCat({
  moodboardDaMo: false,
  soCuc: [
    { id: 'toi-gian-vs-phong-phu', giaTri: -2 },
    { id: 'kin-vs-mo', giaTri: null },
    { id: 'nguoi-vs-am', giaTri: 0 },
    { id: 'tron-vs-nhip', giaTri: null },
  ],
  baHoi: [],
});
ok('sinh đúng 1 nguồn form(poles)', nguon2.length === 1);
const formPoles = nguon2[0];
ok('kind là form', formPoles.kind === 'form');
if (formPoles.kind === 'form') {
  ok('formKind là poles', formPoles.formKind === 'poles');
  ok('id ổn định = "ban-so-cuc"', formPoles.id === 'ban-so-cuc');
  ok('CHỈ hàng đã bấm vào fields (2 hàng)', Object.keys(formPoles.fields).length === 2);
  ok('hàng cân bằng (0) VẪN được xuất — khác chưa bấm', formPoles.fields['nguoi-vs-am'] === '0');
  ok('hàng chưa bấm KHÔNG xuất', formPoles.fields['kin-vs-mo'] === undefined);
  ok('giá trị âm được xuất đúng', formPoles.fields['toi-gian-vs-phong-phu'] === '-2');
}

// ④ — ba hồi: chỉ hồi đã điền lộ ra
const nguon3 = taoNguonChungCat({
  moodboardDaMo: false,
  soCuc: [],
  baHoi: [
    { vi_tri: 0, tieuDe: 'Bước vào', moTa: 'nắng chiều', daDien: true },
    { vi_tri: 1, tieuDe: '', moTa: '', daDien: false },
    { vi_tri: 2, tieuDe: 'Đóng cửa', moTa: '', daDien: true },
  ],
});
ok('sinh đúng 1 nguồn form(ba-hoi)', nguon3.length === 1);
const formHoi = nguon3[0];
ok('kind là form', formHoi.kind === 'form');
if (formHoi.kind === 'form') {
  ok('formKind là ba-hoi', formHoi.formKind === 'ba-hoi');
  ok('id ổn định = "cau-chuyen-3-hoi"', formHoi.id === 'cau-chuyen-3-hoi');
  ok('chỉ 2 hồi đã điền vào fields', Object.keys(formHoi.fields).length === 2);
  ok('hồi 1 ghép tiêu đề + mô tả', formHoi.fields['hoi-1'] === 'Bước vào — nắng chiều');
  ok('hồi 2 KHÔNG xuất', formHoi.fields['hoi-2'] === undefined);
  ok('hồi 3 chỉ có tiêu đề vẫn xuất được', formHoi.fields['hoi-3'] === 'Đóng cửa');
}

// ⑤ — hồi có daDien=true nhưng tất cả trường trống ⇒ không xuất (phòng bị double-count)
const nguon4 = taoNguonChungCat({
  moodboardDaMo: false,
  soCuc: [],
  baHoi: [{ vi_tri: 0, tieuDe: '   ', moTa: '\t\n', daDien: true }],
});
ok('hồi có daDien=true nhưng whitespace ⇒ không xuất form', nguon4.length === 0);

// ⑥ — cả hai loại form + moodboard mở ⇒ đúng 2 nguồn (không đẻ nguồn moodboard v0)
const nguon5 = taoNguonChungCat({
  moodboardDaMo: true,
  soCuc: [{ id: 'toi-vs-sang', giaTri: 3 }],
  baHoi: [{ vi_tri: 0, tieuDe: 'Sáng', moTa: 'ban ngày', daDien: true }],
});
ok('sinh đúng 2 nguồn (poles + ba-hoi)', nguon5.length === 2);
ok('moodboard mở không tự sinh nguồn thứ ba (v0 chưa nối)', nguon5.every((n) => n.kind === 'form'));

console.log(`\n${pass} pass · ${fail} fail`);
if (fail > 0) process.exit(1);
