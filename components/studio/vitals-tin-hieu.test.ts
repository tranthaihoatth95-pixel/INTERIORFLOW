/**
 * components/studio/vitals-tin-hieu.test.ts — khoá LUẬT "chỉ dữ liệu thật" của khẩu độ Vitals.
 * Chạy: `node_modules/.bin/sucrase-node components/studio/vitals-tin-hieu.test.ts`
 *
 * Mỗi mục là một cách hỏng đã lường trước:
 *  1. Không có gì ⇒ MẢNG RỖNG. Đây là ca quan trọng nhất — cách hỏng kinh điển của mọi bảng
 *     "insight" là lấp chỗ trống bằng câu chung chung khi không có dữ liệu.
 *  2. `undefined` (chưa đo) ≠ `0` (đo rồi, sạch) — nhưng CẢ HAI đều không ra dòng. Nhập hai
 *     thứ này là mở đường cho câu "bản vẽ không có lỗi", điều `violationsPromptBlock` đã cấm.
 *  3. Số trên nhãn PHẢI là số nguồn đưa vào — không làm tròn, không "vài", không "nhiều".
 *  4. Trần 3 và thứ tự ưu tiên cố định (chạy 2 lần ra 2 kết quả giống nhau).
 *  5. `chiTiet` chỉ có khi nguồn thật sự cấp nhãn — chuỗi rỗng không được thành dòng phụ rỗng.
 *  6. Chấm ambient ánh xạ về đúng bộ VitalsState sẵn có, không đẻ trạng thái thứ hai.
 *  7. Nguồn KHÔNG có cửa nào nhận chữ tự do (chống "insight AI" lọt vào bằng đường sau).
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { chonTinHieu, trangThaiAmbient, TRAN_TIN_HIEU, type NguonTinHieu } from './vitals-tin-hieu';

let fail = 0;
function ok(msg: string, cond: unknown) {
  if (cond) console.log('  ok  -', msg);
  else {
    fail += 1;
    console.log('  FAIL -', msg);
  }
}

console.log('\nvitals-tin-hieu — khẩu độ Vitals chỉ nói điều có thật');

const RONG: NguonTinHieu = { dangChay: 0, chayLoi: 0 };

console.log('\n[1] Không có gì thì KHÔNG hiện gì');
ok('nguồn rỗng ⇒ []', chonTinHieu(RONG).length === 0);
ok('rỗng + bản vẽ chưa đo ⇒ []', chonTinHieu({ ...RONG, chuanCanXem: undefined }).length === 0);
ok('số âm/NaN không lọt thành tín hiệu', chonTinHieu({ dangChay: -1, chayLoi: Number.NaN }).length === 0);

console.log('\n[2] `undefined` (chưa đo) ≠ `0` (đo rồi) — cả hai đều im');
ok('chuanCanXem undefined ⇒ không có dòng chuan-ve', !chonTinHieu({ ...RONG, chuanCanXem: undefined }).some((t) => t.loai === 'chuan-ve'));
ok('chuanCanXem 0 ⇒ không có dòng chuan-ve', !chonTinHieu({ ...RONG, chuanCanXem: 0 }).some((t) => t.loai === 'chuan-ve'));
ok('chuanCanXem 3 ⇒ CÓ dòng chuan-ve', chonTinHieu({ ...RONG, chuanCanXem: 3 }).some((t) => t.loai === 'chuan-ve'));

console.log('\n[3] Số trên nhãn là số nguồn đưa vào, không diễn đạt lại');
const ba = chonTinHieu({ dangChay: 2, chayLoi: 0, chuanCanXem: 17 });
ok('so khớp nguồn (2)', ba.find((t) => t.loai === 'dang-chay')?.so === 2);
ok('so khớp nguồn (17)', ba.find((t) => t.loai === 'chuan-ve')?.so === 17);
ok('nhãn chứa đúng con số 17', /\b17\b/.test(ba.find((t) => t.loai === 'chuan-ve')?.nhan ?? ''));
ok('không có chữ mơ hồ trong nhãn', !ba.some((t) => /vài|nhiều|một số|có thể/i.test(t.nhan)));

console.log('\n[4] Trần 3 + thứ tự ưu tiên cố định');
const du = chonTinHieu({ dangChay: 1, nhanDangChay: 'Phối cảnh phòng khách', chayLoi: 2, chuanCanXem: 5 });
ok(`không quá ${TRAN_TIN_HIEU} tín hiệu`, du.length <= TRAN_TIN_HIEU);
ok('thứ tự: đang chạy → lỗi → quy chuẩn', du.map((t) => t.loai).join(',') === 'dang-chay,chay-loi,chuan-ve');
ok('chạy lại ra kết quả y hệt', JSON.stringify(chonTinHieu({ dangChay: 1, nhanDangChay: 'Phối cảnh phòng khách', chayLoi: 2, chuanCanXem: 5 })) === JSON.stringify(du));

console.log('\n[5] `chiTiet` chỉ có khi nguồn thật sự cấp nhãn');
ok('có nhãn ⇒ có chiTiet', du[0].chiTiet === 'Phối cảnh phòng khách');
ok('không nhãn ⇒ KHÔNG có khoá chiTiet', !('chiTiet' in chonTinHieu({ dangChay: 1, chayLoi: 0 })[0]));
ok('nhãn rỗng ⇒ KHÔNG có khoá chiTiet', !('chiTiet' in chonTinHieu({ dangChay: 1, nhanDangChay: '', chayLoi: 0 })[0]));

console.log('\n[6] Chấm ambient dùng lại đúng bộ VitalsState sẵn có');
ok('rỗng ⇒ idle (im)', trangThaiAmbient([]) === 'idle');
ok('đang chạy ⇒ answering', trangThaiAmbient(chonTinHieu({ dangChay: 1, chayLoi: 0 })) === 'answering');
ok('chỉ có việc cần xem ⇒ alert', trangThaiAmbient(chonTinHieu({ dangChay: 0, chayLoi: 1 })) === 'alert');
{
  const HOP_LE = new Set(['idle', 'listening', 'thinking', 'answering', 'alert']);
  const badge = readFileSync(join(__dirname, 'VitalsStateBadge.tsx'), 'utf8');
  ok('mọi giá trị trả về đều nằm trong VitalsState của VitalsStateBadge.tsx', [[], chonTinHieu({ dangChay: 1, chayLoi: 0 }), chonTinHieu({ dangChay: 0, chayLoi: 1 })].every((t) => {
    const s = trangThaiAmbient(t);
    return HOP_LE.has(s) && badge.includes(`'${s}'`);
  }));
}

console.log('\n[7] Không có cửa sau cho chữ tự do (chống "insight AI")');
{
  const SRC = readFileSync(join(__dirname, 'vitals-tin-hieu.ts'), 'utf8');
  const khaiNguon = SRC.slice(SRC.indexOf('interface NguonTinHieu'), SRC.indexOf('const THU_TU'));
  // Mọi trường của NguonTinHieu phải là `number` (hoặc nhãn lượt chạy lấy thẳng từ FlowRun.label).
  ok('NguonTinHieu chỉ nhận số đếm + nhãn FlowRun', !/:\s*string\[\]/.test(khaiNguon) && (khaiNguon.match(/:\s*string/g) ?? []).length === 1);
  ok('nguồn không nhận hàm/callback sinh chữ', !/=>/.test(khaiNguon));
}

console.log(fail === 0 ? '\nTẤT CẢ ĐẠT\n' : `\n${fail} MỤC HỎNG\n`);
if (fail > 0) process.exit(1);
