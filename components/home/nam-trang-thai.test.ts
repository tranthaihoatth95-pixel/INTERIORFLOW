/**
 * components/home/nam-trang-thai.test.ts — canh những khẳng định mà bản chốt 23/08 dựa vào.
 * Mất một trong số này là Home lặng lẽ trôi về "một bố cục đẹp cho một tình huống".
 *
 *  ① Năm trạng thái phải THẬT SỰ khác nhau về MẬT ĐỘ (A thoáng · B gần trống · D dày nhất).
 *  ② Không dữ liệu ⇒ mục KHÔNG TỒN TẠI. Cấm khung rỗng, cấm dữ liệu giả.
 *  ③ Vitals im khi không có gì đáng nói — "Everything is fine" không được phép mọc ra.
 *  ④ Mỗi trạng thái có TỐI ĐA MỘT hero `2x2` (nhiều hero = không hero).
 *  ⑤ Chỉ tồn tại ĐÚNG BA cỡ ô — cửa chống "kéo giãn tự do".
 */

import assert from 'node:assert/strict';
import {
  chonTrangThai,
  keHoachHome,
  matDoCua,
  nhipCua,
  nhipO,
  TANG_CUA,
  type CoO,
  type TinHieu,
  type TrangThaiHome,
} from './nam-trang-thai';

const TRONG: TinHieu = {
  coDuAn: false, coViecDo: false, canToiXu: false, homNay: false, mocToi: false,
  bieuDo: false, dongTin: false, anhTuan: false, vatLieu: false, vitalsDangNoi: false,
};
const DAY: TinHieu = {
  coDuAn: true, coViecDo: true, canToiXu: true, homNay: true, mocToi: true,
  bieuDo: true, dongTin: true, anhTuan: true, vatLieu: true, vitalsDangNoi: true,
};

/* ── ① CHỌN TRẠNG THÁI ─────────────────────────────────────────────────────────────────── */
assert.equal(chonTrangThai({ tinHieu: TRONG, gio: 9, daQuayLai: false }), 'A',
  'chưa có gì ⇒ A, bất kể giờ — cấm giả lập dashboard');
assert.equal(chonTrangThai({ tinHieu: TRONG, gio: 20, daQuayLai: true }), 'A',
  'A thắng tất cả: không có dữ liệu thì mọi trạng thái khác đều phải bịa nội dung');

assert.equal(chonTrangThai({ tinHieu: DAY, gio: 9, daQuayLai: false }), 'B',
  'có phiên dở ⇒ B thắng C — ý định người dùng mạnh hơn giờ trong ngày');
assert.equal(chonTrangThai({ tinHieu: DAY, gio: 20, daQuayLai: false }), 'B',
  'có phiên dở ⇒ B thắng cả E');
assert.equal(chonTrangThai({ tinHieu: DAY, gio: 9, daQuayLai: true }), 'D',
  'đã vào workspace rồi quay về ⇒ hết cần lời mời "tiếp tục", cần tổng đài');

const KHONG_DO: TinHieu = { ...DAY, coViecDo: false };
assert.equal(chonTrangThai({ tinHieu: KHONG_DO, gio: 8, daQuayLai: false }), 'C', 'sáng ⇒ C');
assert.equal(chonTrangThai({ tinHieu: KHONG_DO, gio: 14, daQuayLai: false }), 'D', 'giữa ngày ⇒ D');
assert.equal(chonTrangThai({ tinHieu: KHONG_DO, gio: 19, daQuayLai: false }), 'E', 'tối ⇒ E');
assert.equal(chonTrangThai({ tinHieu: KHONG_DO, gio: 23, daQuayLai: true }), 'D',
  '"giữa giờ làm" là NGỮ CẢNH, không phải khung đồng hồ');

/* ── ② MẬT ĐỘ LÀ HÀM CỦA TRẠNG THÁI ────────────────────────────────────────────────────── */
const NAM: TrangThaiHome[] = ['A', 'B', 'C', 'D', 'E'];
const mats = NAM.map(matDoCua);
assert.equal(new Set(mats).size, 5,
  'mỗi trạng thái một mật độ riêng — trùng nhãn là dấu hiệu hai trạng thái đang dùng chung bố cục');

const oToiDa = NAM.map((t) => nhipCua(matDoCua(t)).oToiDa);
const [oA, oB, oC, oD, oE] = oToiDa;
assert.ok(oD > oE && oE > oC && oC > oB, `D phải dày nhất, B gần trống — đo được ${oToiDa.join('<')}`);
assert.equal(oA, oB, 'A và B đều là bề mặt rất trống');

const gapD = nhipCua('day').heSoGap;
const gapA = nhipCua('thoang').heSoGap;
assert.ok(gapA > gapD, 'thoáng phải thở rộng hơn dày — nếu bằng nhau thì mật độ chỉ là số thẻ');

/* ── ③ THIẾU DỮ LIỆU ⇒ TỰ ẨN, KHÔNG KHUNG RỖNG ─────────────────────────────────────────── */
for (const gio of [8, 14, 20]) {
  const kh = keHoachHome({ tinHieu: TRONG, gio, daQuayLai: false });
  for (const m of kh.bay) {
    assert.notEqual(m.ma, 'homNay', 'không có việc hôm nay thì KHÔNG được bày ô "Hôm nay"');
    assert.notEqual(m.ma, 'keDuAn', 'không có dự án thì kệ dự án không tồn tại');
    assert.notEqual(m.ma, 'anhTuan', 'không có ảnh thì không bày khung ảnh rỗng');
  }
}

// Có việc hôm nay nhưng KHÔNG có mốc tới ⇒ chỉ mất đúng mục đó, mục khác vẫn sống.
const motNua = keHoachHome({
  tinHieu: { ...DAY, coViecDo: false, mocToi: false },
  gio: 8,
  daQuayLai: false,
});
const maC = motNua.bay.map((m) => m.ma);
assert.ok(maC.includes('homNay'), 'C có việc hôm nay ⇒ vẫn bày');
assert.ok(!maC.includes('mocToi'), 'không mốc tới ⇒ mục đó biến mất, không thành ô "0"');

/* ── ④ VITALS IM KHI KHÔNG CÓ GÌ ĐÁNG NÓI ──────────────────────────────────────────────── */
for (const gio of [8, 14, 20]) {
  const kh = keHoachHome({
    tinHieu: { ...DAY, coViecDo: false, vitalsDangNoi: false },
    gio,
    daQuayLai: false,
  });
  assert.ok(!kh.bay.some((m) => m.ma === 'vitals'),
    'không insight đáng giá ⇒ KHÔNG card nào. Vitals không nói để chứng minh nó tồn tại');
}
const coVitals = keHoachHome({ tinHieu: { ...DAY, coViecDo: false }, gio: 14, daQuayLai: false });
assert.ok(coVitals.bay.some((m) => m.ma === 'vitals'), 'có insight thật ⇒ mới được lên tiếng');

/* ── ⑤ MỘT HERO, ĐÚNG BA CỠ ────────────────────────────────────────────────────────────── */
for (const tt of NAM) {
  const kh = keHoachHome({
    tinHieu: DAY,
    gio: tt === 'C' ? 8 : tt === 'E' ? 20 : 14,
    daQuayLai: tt === 'D',
  });
  const hero = kh.bay.filter((m) => m.co === '2x2');
  assert.ok(hero.length <= 1, `${kh.trangThai}: nhiều hơn một hero thì không còn hero nào`);
  for (const m of kh.bay) {
    const hopLe: CoO[] = ['1x1', '2x1', '2x2'];
    assert.ok(hopLe.includes(m.co), 'chỉ tồn tại ba cỡ định sẵn — cấm kéo giãn tự do');
    assert.equal(TANG_CUA[m.ma], m.tang, `${m.ma}: tầng khai ở bảng và ở kế hoạch phải khớp`);
  }
}

/* ── ⑥ CỬA MẬT ĐỘ CẮT THEO Ô, KHÔNG THEO SỐ MỤC ────────────────────────────────────────── */
for (const tt of NAM) {
  const kh = keHoachHome({
    tinHieu: DAY,
    gio: tt === 'C' ? 8 : tt === 'E' ? 20 : 14,
    daQuayLai: tt === 'D',
  });
  assert.ok(kh.oDaDung <= kh.nhip.oToiDa,
    `${kh.trangThai}: dùng ${kh.oDaDung} ô, trần ${kh.nhip.oToiDa}`);
  const tinh = kh.bay.reduce((a, m) => a + nhipO(m.co).cot * nhipO(m.co).hang, 0);
  assert.equal(tinh, kh.oDaDung, 'oDaDung phải là tổng thật, không phải số đếm mục');
}

/* ── ⑦ B KHÔNG ĐI QUA LƯỚI Ô ───────────────────────────────────────────────────────────── */
const b = keHoachHome({ tinHieu: DAY, gio: 10, daQuayLai: false });
assert.equal(b.trangThai, 'B');
assert.equal(b.bay.length, 0,
  'B là MỘT câu + MỘT nút trên nền công việc — rỗng ở đây là đúng, không phải thiếu');

/* ── ⑧ HỢP ĐỒNG THỊ GIÁC: bản vẽ EXS-C H1 · Studio Focus ───────────────────────────────────
   `docs/mocks/mock-exs-c-home-work-os.html` — *"Hero là Resume, không phải AI, không phải KPI."*
   Khoá lại để không ai lặng lẽ đổi hero sang một ô số liệu. */
const d = keHoachHome({ tinHieu: DAY, gio: 14, daQuayLai: true });
assert.equal(d.trangThai, 'D');
assert.equal(d.bay[0].ma, 'tiepTuc', 'bản vẽ EXS-C: ô ĐẦU TIÊN của Studio Focus là Việc đang dở');
assert.equal(d.bay[0].co, '2x2', 'bản vẽ EXS-C: hero là 2×2');
assert.ok(!d.bay.some((m) => m.ma !== 'tiepTuc' && m.co === '2x2'),
  'bản vẽ EXS-C: ngoài hero, mọi ô của Studio Focus đều nhỏ hơn 2×2');
assert.equal(nhipCua('day').cot, 4, 'bản vẽ EXS-C: lưới 4 cột');
assert.equal(nhipCua('day').heSoGap, 1, 'bản vẽ EXS-C: gap = đúng --gap, không nhân thêm');

// Không có phiên dở ⇒ hero KHÔNG được là một ô rỗng: mục đầu phải là mục KHÁC có dữ liệu thật.
const dKhongDo = keHoachHome({ tinHieu: { ...DAY, coViecDo: false }, gio: 14, daQuayLai: true });
assert.ok(!dKhongDo.bay.some((m) => m.ma === 'tiepTuc'),
  'không có việc dở ⇒ hero Resume biến mất, không đứng lại làm khung rỗng');

console.log('✓ nam-trang-thai: 5 trạng thái · mật độ theo trạng thái · tự ẩn · vitals im · hero theo bản vẽ EXS-C');
