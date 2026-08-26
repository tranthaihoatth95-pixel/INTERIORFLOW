/**
 * app/files/_lib/hai-tang.test.ts — [marker: filesHaiTang] 23/08.
 * Chạy: node_modules/.bin/sucrase-node app/files/_lib/hai-tang.test.ts
 *
 * Bốn thứ test này CANH, ngoài chuyện chạy đúng:
 *  ① **Hai tầng là hai TRỤC, không phải hai lát của một danh sách** — canh bằng cách bắt hai bảng
 *     khai đủ trường đặc trưng của trục mình (tầng ① phải có `quyen`, tầng ② phải có `maLoai`).
 *     Ai đó gộp hai tầng thành một danh sách thì một trong hai trường này rụng ⇒ test đỏ.
 *  ② **Mã `COL-<LOẠI>-NNN` đệm 3 chữ số và KHÔNG quay vòng ở 999** — mã trùng là hỏng khoá nối.
 *  ③ **`null` ≠ `0`.** "Chưa có nguồn số" và "đọc được, đúng là rỗng" phải ra hai câu khác nhau;
 *     trộn hai thứ đó là bịa số.
 *  ④ **Trục lọc không dùng được thì BẮT BUỘC có lý do** — §9 cấm nút giả bấm không ra gì.
 */
import {
  THU_MUC_HE_THONG, thuMucTheoKhoa, COLLECTION_GOI, goiTheoKhoa,
  maCollection, docMaCollection, TRUC_LOC, QUYEN_GOI, tomTatCollection, soHoacGach,
  type GoiKey,
} from './hai-tang';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

/* ① hai trục ------------------------------------------------------------------ */
ok('tầng ① đúng 5 thư mục hệ thống', THU_MUC_HE_THONG.length === 5);
ok('tầng ② đúng 8 gói Collection+', COLLECTION_GOI.length === 8);
ok(
  'mọi thư mục khai QUYỀN (trục của tầng ①) — cả hai thứ tiếng',
  THU_MUC_HE_THONG.every((t) => t.quyen.vi.length > 0 && t.quyen.en.length > 0),
);
ok(
  'mọi gói khai mã LOẠI (trục của tầng ②) viết hoa 2–4 ký tự',
  COLLECTION_GOI.every((g) => /^[A-Z]{2,4}$/.test(g.maLoai)),
);
ok('mã loại không trùng nhau', new Set(COLLECTION_GOI.map((g) => g.maLoai)).size === 8);
ok('khoá thư mục không trùng', new Set(THU_MUC_HE_THONG.map((t) => t.khoa)).size === 5);
ok('thư mục Nhà cung cấp giữ đúng ba thứ của phần thô cũ',
  /texture/.test(thuMucTheoKhoa('nhaCungCap').vai.vi) && /giá/.test(thuMucTheoKhoa('nhaCungCap').vai.vi));
ok('tra khoá sai thì NỔ, không rơi im lặng', (() => {
  try { thuMucTheoKhoa('khongCo' as never); return false; } catch { return true; }
})());
ok('tra gói sai cũng nổ', (() => {
  try { goiTheoKhoa('khongCo' as never); return false; } catch { return true; }
})());

/* Thư mục chưa nối kho PHẢI có câu cho màn trống — cấm để trống câm. */
ok(
  'mọi thư mục có câu khi-trống, và câu đó không phải câu lỗi',
  THU_MUC_HE_THONG.every((t) => t.khiTrong.vi.length > 10 && !/lỗi|error/i.test(t.khiTrong.vi)),
);
/* Bản vẽ `docs/mocks/mock-files-hai-tang.html` (`.quy.ro{border-style:dashed}`) chọn HÌNH DẠNG
   chứ không chọn màu cho *Chỉ đọc*, để nó đọc được cả khi in đen trắng. Canh đúng điều đó. */
ok('Chỉ đọc mang dáng nét đứt (ro)', thuMucTheoKhoa('daDuyet').dangQuyen === 'ro');
ok('Lưu trữ mang dáng quản trị (admin)', thuMucTheoKhoa('luuTru').dangQuyen === 'admin');
ok('mọi thư mục khai dáng huy hiệu quyền',
  THU_MUC_HE_THONG.every((t) => ['rw', 'ro', 'admin'].includes(t.dangQuyen)));

ok('có đúng 2 thư mục đã nối kho thật (Dự án · Nhà cung cấp)',
  THU_MUC_HE_THONG.filter((t) => t.daNoiKho).map((t) => t.khoa).join(',') === 'duAn,nhaCungCap');

/* ② mã ------------------------------------------------------------------------ */
ok('mã đệm 3 chữ số', maCollection('MAT', 1) === 'COL-MAT-001');
ok('mã xếp đúng thứ tự chữ: 002 trước 010', maCollection('MAT', 2) < maCollection('MAT', 10));
ok('quá 999 thì mã DÀI RA, không cắt cụt, không quay vòng', maCollection('MAT', 1000) === 'COL-MAT-1000');
ok('số 0 hoặc âm là lỗi lập trình ⇒ nổ', (() => {
  try { maCollection('MAT', 0); return false; } catch { return true; }
})());
ok('số lẻ (không nguyên) cũng nổ', (() => {
  try { maCollection('MAT', 1.5); return false; } catch { return true; }
})());
ok('đọc ngược được mã hợp lệ', JSON.stringify(docMaCollection('COL-CNG-042')) === JSON.stringify({ maLoai: 'CNG', so: 42 }));
ok('đọc ngược mã 4 chữ số vẫn được', docMaCollection('COL-MAT-1000')?.so === 1000);
ok('mã sai khuôn trả null chứ không throw', docMaCollection('VL-1') === null && docMaCollection('COL-vl-001') === null);
ok('mọi mã loại đều sinh được mã đọc ngược khớp',
  COLLECTION_GOI.every((g) => docMaCollection(maCollection(g.maLoai, 7))?.maLoai === g.maLoai));

/* ③ null ≠ 0 ------------------------------------------------------------------- */
const chuaNoi = tomTatCollection({});
ok('chưa gói nào nối kho ⇒ câu nói về việc CHƯA NỐI', /chưa gói nào nối kho/.test(chuaNoi.vi));
const rong: Partial<Record<GoiKey, number | null>> = { vatLieu: 0, furniture: 0 };
const cauRong = tomTatCollection(rong);
ok('đã nối mà rỗng ⇒ câu KHÁC HẲN câu chưa nối', /đang rỗng/.test(cauRong.vi) && cauRong.vi !== chuaNoi.vi);
ok('gói khai null KHÔNG được tính là đã nối', tomTatCollection({ vatLieu: null }).vi === chuaNoi.vi);
ok('có mục thì đếm đúng tổng', /3 mục trong 2\/8 gói/.test(tomTatCollection({ vatLieu: 2, furniture: 1 }).vi));
ok('ô số: null hiện gạch, 0 hiện 0', soHoacGach(null) === '—' && soHoacGach(0) === '0' && soHoacGach(12) === '12');
ok('undefined cũng là chưa biết', soHoacGach(undefined) === '—');
ok('cả hai thứ tiếng đều có câu tổng', chuaNoi.en.length > 10 && cauRong.en.length > 10);

/* ④ lọc ------------------------------------------------------------------------ */
ok('đúng 4 trục lọc Hoà chốt', TRUC_LOC.length === 4);
ok('trục Loại lọc được ngay (đọc từ chính 8 gói)', TRUC_LOC.find((t) => t.khoa === 'loai')?.locDuoc === true);
ok(
  'trục KHÔNG lọc được thì BẮT BUỘC có lý do (§9 cấm nút giả)',
  TRUC_LOC.every((t) => t.locDuoc || (t.liDoMo && t.liDoMo.vi.length > 0 && t.liDoMo.en.length > 0)),
);
ok(
  'lý do nói cái ĐANG THIẾU, không hứa "sắp có"',
  TRUC_LOC.filter((t) => !t.locDuoc).every((t) => !/sắp|coming soon/i.test(t.liDoMo!.vi + t.liDoMo!.en)),
);
ok('đúng 3 mức quyền của gói', QUYEN_GOI.length === 3 && QUYEN_GOI.map((q) => q.khoa).join(',') === 'caNhan,chiaSeNhom,studio');

/* ⛔ chữ đã bị khai tử — "chợ đầu mối" (Hoà bỏ 16/08). Canh cả bảng chữ của màn này. */
const moiChu = [
  ...THU_MUC_HE_THONG.flatMap((t) => [t.ten.vi, t.vai.vi, t.quyen.vi, t.khiTrong.vi]),
  ...COLLECTION_GOI.flatMap((g) => [g.ten.vi, g.moTa.vi]),
].join(' ');
ok('không chỗ nào dùng lại chữ "chợ đầu mối"', !/chợ đầu mối/i.test(moiChu));

console.log(`\n${pass} pass · ${fail} fail`);
if (fail > 0) process.exit(1);
