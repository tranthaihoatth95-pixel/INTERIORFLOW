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
import { THU_TU, chonTinHieu, trangThaiAmbient, TRAN_TIN_HIEU, VI_SAO, type NguonTinHieu } from './vitals-tin-hieu';

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

/* 8 — MỌI tín hiệu phải mang câu "vì sao bị gắn cờ", và câu đó phải đến từ bảng hằng số
   `VI_SAO` (không có cửa nào cho chữ tự do / AI sinh lọt vào — cùng lý do mục 7). */
{
  const day = chonTinHieu({ dangChay: 2, chayLoi: 1, chuanCanXem: 4 });
  const hopLe = Object.values(VI_SAO);
  for (const t of day) {
    if (!t.viSao || !hopLe.includes(t.viSao)) {
      console.error('✗ tín hiệu thiếu/lệch câu vì sao:', t.loai, t.viSao);
      process.exit(1);
    }
    if (t.viSao !== VI_SAO[t.loai]) {
      console.error('✗ câu vì sao không khớp loại:', t.loai);
      process.exit(1);
    }
  }
  // 22/08 — BỎ SỐ GÕ CỨNG (`!== 4`). Ý ĐỊNH của kiểm này là ĐỘ PHỦ: mọi loại tín hiệu phải có
  // câu VÌ SAO. Neo vào một con số thì thêm một loại hợp lệ cũng làm đỏ, và người sửa dễ chỉnh
  // số cho qua — tức là làm hỏng đúng thứ nó canh. Nay so thẳng với danh sách loại chính tắc.
  const thieu = THU_TU.filter((l) => !(l in VI_SAO));
  const thua = Object.keys(VI_SAO).filter((k) => !(THU_TU as string[]).includes(k));
  if (thieu.length || thua.length) {
    console.error('✗ VI_SAO phải phủ ĐÚNG bộ loại tín hiệu — thiếu:', thieu, '· thừa:', thua);
    process.exit(1);
  }
}
console.log("  [8] ok  - mọi tín hiệu mang câu VÌ SAO, lấy từ bảng hằng số");

console.log('\n[9] demo-flow — tiến độ, KHÔNG phải cảnh báo');
ok('thiếu cả hai số ⇒ không có dòng demo-flow', !chonTinHieu({ ...RONG }).some((t) => t.loai === 'demo-flow'));
ok('demoTong=0 ⇒ không có dòng (mẫu số rỗng)', !chonTinHieu({ ...RONG, demoXong: 0, demoTong: 0 }).some((t) => t.loai === 'demo-flow'));
ok('đã xong hết (7/7) ⇒ im, không có gì để xem tiến độ nữa', !chonTinHieu({ ...RONG, demoXong: 7, demoTong: 7 }).some((t) => t.loai === 'demo-flow'));
ok('còn dở (7/9) ⇒ CÓ dòng demo-flow', chonTinHieu({ ...RONG, demoXong: 7, demoTong: 9 }).some((t) => t.loai === 'demo-flow'));
ok('nhãn mang đúng cặp số 7/9', /\b7\/9\b/.test(chonTinHieu({ ...RONG, demoXong: 7, demoTong: 9 }).find((t) => t.loai === 'demo-flow')?.nhan ?? ''));
ok(
  'demo-flow đứng SAU 3 loại kia (ưu tiên thấp nhất)',
  chonTinHieu({ dangChay: 1, chayLoi: 1, chuanCanXem: 1, demoXong: 1, demoTong: 2 }).map((t) => t.loai).indexOf('demo-flow') === -1, // trần 3 cắt trước khi tới demo-flow — đúng luật ưu tiên
);
ok(
  'demo-flow một mình (không gì khác) vẫn hiện — dưới trần 3',
  chonTinHieu({ ...RONG, demoXong: 1, demoTong: 2 }).some((t) => t.loai === 'demo-flow'),
);
ok('demo-flow KHÔNG kéo ambient sang alert', trangThaiAmbient(chonTinHieu({ ...RONG, demoXong: 1, demoTong: 2 })) === 'idle');
ok('demo-flow + lỗi thật thì ambient vẫn alert (lỗi thắng)', trangThaiAmbient(chonTinHieu({ dangChay: 0, chayLoi: 1, demoXong: 1, demoTong: 2 })) === 'alert');
