/**
 * lib/home/trang-thai.test.ts — 16 tổ hợp (2⁴) của `tinhTrangThai`, không bỏ ca nào.
 *
 * Chạy: `npx tsx lib/home/trang-thai.test.ts`
 *
 * ⚠️ Ba ca dưới đây là LÝ DO file này tồn tại — chúng khoá đúng ba lỗi Home đang mắc, nên nếu
 * ai đó "dọn cho gọn" cái thứ tự ưu tiên thì test đỏ chứ không im lặng trôi:
 *   · đang tải + mất mạng  → 'dangTai'    (chưa có câu trả lời thì chưa được phép kết luận)
 *   · lỗi   + mất mạng     → 'ngoaiTuyen' (nút "Thử lại" là lời khuyên vô ích khi rớt mạng)
 *   · lỗi   + rỗng         → 'loi'        (không tải được ≠ studio chưa có gì)
 */

import { canKhoiThayThe, tinhTrangThai, type TrangThaiO } from './trang-thai';

let fail = 0;
function ok(ten: string, dieuKien: boolean) {
  if (!dieuKien) {
    fail++;
    console.error('  ✗ ' + ten);
  } else {
    console.log('  ✓ ' + ten);
  }
}

const B = [false, true];
/** Bảng mong đợi cho cả 16 tổ hợp, viết TAY (không sinh bằng chính hàm đang test). */
const MONG_DOI: Record<string, TrangThaiO> = {
  // dangTai,loi,rong,trucTuyen
  'F,F,F,F': 'ngoaiTuyen',
  'F,F,F,T': 'song',
  'F,F,T,F': 'ngoaiTuyen',
  'F,F,T,T': 'trong',
  'F,T,F,F': 'ngoaiTuyen',
  'F,T,F,T': 'loi',
  'F,T,T,F': 'ngoaiTuyen',
  'F,T,T,T': 'loi',
  'T,F,F,F': 'dangTai',
  'T,F,F,T': 'dangTai',
  'T,F,T,F': 'dangTai',
  'T,F,T,T': 'dangTai',
  'T,T,F,F': 'dangTai',
  'T,T,F,T': 'dangTai',
  'T,T,T,F': 'dangTai',
  'T,T,T,T': 'dangTai',
};

console.log('tinhTrangThai — 16 tổ hợp');
for (const dangTai of B)
  for (const loi of B)
    for (const rong of B)
      for (const trucTuyen of B) {
        const key = [dangTai, loi, rong, trucTuyen].map((b) => (b ? 'T' : 'F')).join(',');
        const got = tinhTrangThai({ dangTai, loi, rong, trucTuyen });
        ok(`${key} → ${MONG_DOI[key]}`, got === MONG_DOI[key]);
      }

console.log('ba ca là lý do file này tồn tại');
ok(
  'đang tải + mất mạng ⇒ dangTai (không đoán khi chưa có câu trả lời)',
  tinhTrangThai({ dangTai: true, loi: false, rong: false, trucTuyen: false }) === 'dangTai',
);
ok(
  'lỗi + mất mạng ⇒ ngoaiTuyen (không đẩy người dùng vào vòng bấm Thử lại)',
  tinhTrangThai({ dangTai: false, loi: true, rong: false, trucTuyen: false }) === 'ngoaiTuyen',
);
ok(
  'lỗi + rỗng ⇒ loi (không nói studio trắng tay khi chỉ là tải hỏng)',
  tinhTrangThai({ dangTai: false, loi: true, rong: true, trucTuyen: true }) === 'loi',
);

console.log('canKhoiThayThe');
ok('chỉ "song" là render dữ liệu thật', canKhoiThayThe('song') === false);
ok(
  'bốn trạng thái còn lại đều cần khối thay thế',
  (['dangTai', 'trong', 'loi', 'ngoaiTuyen'] as TrangThaiO[]).every(canKhoiThayThe),
);

if (fail) {
  console.error(`\n${fail} khẳng định FAIL`);
  process.exit(1);
}
console.log('\ntất cả PASS');
