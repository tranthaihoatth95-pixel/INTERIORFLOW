/**
 * lib/ui/hien-dan.test.ts — canh THỨ TỰ HIỆN và luật NÉN DẦN.
 * Chạy: node_modules/.bin/sucrase-node lib/ui/hien-dan.test.ts
 *
 * Thứ tự sáu bậc là hợp đồng CẤP HỆ, không phải chuyện gu của một màn hình: đổi nó là đổi cách
 * CẢ APP trao thông tin. Test này khoá đúng chỗ đó.
 */
import {
  BAC_HIEN,
  GIAN_BAC_MS,
  chiMotDong,
  hienONac,
  tiTrongMuc,
  treTheoBac,
  TRANG_THAI_MUC,
  type BacHien,
} from './hien-dan';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

const tangDan = (xs: number[]) => xs.every((v, i) => i === 0 || xs[i - 1] <= v);

/* ---------- THỨ TỰ HIỆN DẦN ---------- */
{
  console.log('\n[1] thứ tự hiện dần theo nghĩa');
  ok('đúng sáu bậc, đúng thứ tự đã chốt',
    JSON.stringify(BAC_HIEN) ===
      JSON.stringify(['danhTinh', 'ketQua', 'doChac', 'quyetDinh', 'chiTiet', 'thongTinSau']));

  const tre = BAC_HIEN.map((b) => treTheoBac(b));
  ok('độ trễ tăng đều — không bậc nào vượt mặt bậc trước', tangDan(tre));
  ok('bậc ① hiện NGAY — không ai phải chờ để biết đang xem cái gì', tre[0] === 0);
  ok('bậc cuối vẫn dưới nửa giây — hiện dần không được thành bắt chờ',
    treTheoBac('thongTinSau') < 500 && treTheoBac('thongTinSau') === 5 * GIAN_BAC_MS);
  ok('giảm chuyển động ⇒ MỌI bậc trễ 0 (không ai bị giấu thông tin)',
    BAC_HIEN.every((b) => treTheoBac(b, true) === 0));
}

/* ---------- BẬC NÀO HIỆN Ở NẤC NÀO ---------- */
{
  console.log('\n[2] bậc theo nấc');
  const NAC = ['vien', 'bang', 'bangSau'] as const;
  const BA_BAC_DAU: BacHien[] = ['danhTinh', 'ketQua', 'doChac'];

  ok('ba bậc đầu có mặt ở MỌI nấc — nấc gọn phải tự đứng được một mình',
    NAC.every((nac) => BA_BAC_DAU.every((b) => hienONac(b, nac))));

  const dem = (nac: (typeof NAC)[number]) => BAC_HIEN.filter((b) => hienONac(b, nac)).length;
  ok('nấc sâu hơn KHÔNG bao giờ hiện ít hơn nấc nông',
    dem('vien') < dem('bang') && dem('bang') < dem('bangSau'));
  ok('nấc sâu nhất hiện ĐỦ sáu bậc — không giấu gì',
    BAC_HIEN.every((b) => hienONac(b, 'bangSau')));
  ok('nấc gọn KHÔNG mang bậc quyết định — quyết thì phải thấy đủ ngữ cảnh trước',
    hienONac('quyetDinh', 'vien') === false);
}

/* ---------- NÉN DẦN KHI ĐÃ XONG ---------- */
{
  console.log('\n[3] nén dần');
  ok('đang làm chiếm chỗ nhất, đã xong chiếm ít nhất',
    tiTrongMuc('dangLam') > tiTrongMuc('dangToi') && tiTrongMuc('dangToi') > tiTrongMuc('daXong'));
  ok('đã xong vẫn CÒN CHỖ, không về 0 — ẩn hẳn là cắt mất bằng chứng đã duyệt cái gì',
    tiTrongMuc('daXong') > 0);
  ok('chỉ đúng trạng thái đã-xong bị ép về một dòng',
    TRANG_THAI_MUC.every((t) => chiMotDong(t) === (t === 'daXong')));
}

console.log(`\nKẾT QUẢ: ${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
