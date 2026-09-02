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
  coDuLieu,
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
/* 🔴 ĐẢO CA NÀY 02/09 — Vitals KHÔNG còn chiếm một ô của lưới Home.
   Ca cũ khoá: "có insight thật ⇒ vitals PHẢI lên tiếng trên Home". Luật đó đúng khi Home còn
   là một bảng widget; nay Home là springboard kiểu iPad (chốt 14) và mỗi ô phải trả giá bằng
   một ô vuông. `vitalsDangNoi` gần như luôn `false` trên dữ liệu thật ⇒ ô đó hầu hết thời gian
   là một tấm kính rỗng chiếm chỗ. Cộng thêm Hoà 09:08 nói thẳng vào chính bề mặt Vitals.
   ⚠️ Đây là gỡ CHỖ ĐỨNG, không phải gỡ năng lực: `vitals` vẫn còn trong `MaWidget` và
   `coDuLieu` vẫn chấm nó, nên trả lại một dòng trong `BAY_THEO_TRANG_THAI` là nó về. Ca dưới
   khoá đúng điều đó — để lượt sau biết mình đang bỏ gì. */
const coVitals = keHoachHome({ tinHieu: { ...DAY, coViecDo: false }, gio: 14, daQuayLai: false });
assert.ok(!coVitals.bay.some((m) => m.ma === 'vitals'),
  'Vitals KHÔNG chiếm ô trên Home nữa, kể cả khi có insight thật — nó nói ở bề mặt khác');
assert.ok(coDuLieu('vitals', { ...DAY, coViecDo: false }),
  'nhưng NĂNG LỰC vẫn còn: coDuLieu vẫn chấm được vitals ⇒ trả lại một dòng là nó về');

/* ── ⑤ MỘT HERO, ĐÚNG BA CỠ ────────────────────────────────────────────────────────────── */
for (const tt of NAM) {
  const kh = keHoachHome({
    tinHieu: DAY,
    gio: tt === 'C' ? 8 : tt === 'E' ? 20 : 14,
    daQuayLai: tt === 'D',
  });
  /* Đổi tên biến cho đúng nghĩa 02/09: `2x2` KHÔNG còn là hero — nó là khổ của lưới ảnh.
     Trần "nhiều nhất một ô 2x2 mỗi màn" thì GIỮ: hai mảng vuông lớn trên một lưới 4 cột là
     mất hết nhịp. Và khoá thêm điều mới: đúng MỘT hero theo `vai`. */
  const oLon = kh.bay.filter((m) => m.co === '2x2');
  assert.ok(oLon.length <= 1, `${kh.trangThai}: nhiều nhất MỘT ô 2x2 mỗi màn`);
  const hero = kh.bay.filter((m) => m.vai === 'hero');
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
/* 🔴 CẬP NHẬT 02/09 — GIỮ phần mang NGHĨA của hợp đồng EXS-C, đổi phần chỉ là QUY ƯỚC CỠ.
   Điều EXS-C thật sự bảo vệ, và vẫn được bảo vệ nguyên vẹn: *"Hero là Resume, không phải AI,
   không phải KPI"* ⇒ ô ĐẦU TIÊN vẫn là `tiepTuc`, và ca đó giữ y nguyên.
   Điều đổi: con số `2x2`. Nó là cách bản vẽ NÓI "hero to nhất" dưới luật cũ (cỡ = mức quan
   trọng). Chốt 14 đổi luật cỡ sang LOẠI NỘI DUNG, nên hero — một dòng tiêu đề + vài chip —
   thuộc `2x1`, còn `2x2` để dành cho lưới ảnh (`keDuAn`). Thứ bậc nay đi bằng `vai` + VỊ TRÍ.
   ⇒ Ca mới khoá đúng cái đáng khoá: hero là Resume, đứng đầu, và KHÔNG phải ô số liệu. */
assert.equal(d.bay[0].ma, 'tiepTuc', 'bản vẽ EXS-C: ô ĐẦU TIÊN của Studio Focus là Việc đang dở');
assert.equal(d.bay[0].vai, 'hero', 'EXS-C giữ nguyên: Resume là HERO, không phải AI/KPI');
assert.equal(d.bay[0].co, '2x1', 'chốt 14: hero mang tiêu đề + chip ⇒ 2x1, không phải 2x2');
/* 🔴 SIẾT 02/09 — ca cũ là `m.co === '2x2' && m.ma !== 'keDuAn'`, tức nó MIỄN TRỪ sẵn cho
   `keDuAn`. Miễn trừ ấy đúng theo KẾ HOẠCH (keDuAn sẽ là lưới 2×2 bìa dự án) nhưng SAI theo
   app thật: `keDuAn` đang vẽ một DANH SÁCH CHỮ, và trong ô 2x2 nó cho ra 3 dòng chữ + ~40% vỏ
   rỗng — đúng lỗi F4 mà chốt 14 sinh ra để chữa.
   ⇒ Ca cũ là một cổng MÙ: nó canh mọi ô KHÁC nhưng bỏ trống đúng ô đang phạm luật, và nó xanh
   suốt trong khi ảnh thật đỏ. ⇒ Bỏ miễn trừ. Hôm nay KHÔNG ô nào được `2x2`.
   ⛳ Dựng xong lưới bìa ảnh thật thì mở lại miễn trừ cho `keDuAn` — nhưng lúc đó phải kèm một
   ca chứng minh nó ĐANG vẽ ảnh, chứ không phải chỉ khai tên. */
/* 🔴 NỚI CÓ TÊN 02/09 (R-3c) — nói rõ đây là ĐỔI LUẬT, không phải lách cổng đang đỏ.
   Luật cũ *"2x2 CHỈ cho lưới ảnh"* đúng ở Ý ĐỊNH (đừng cho ô chữ mượn khổ lớn) nhưng sai ở
   PHẠM VI: nó mô tả một HÌNH THỨC (ảnh) trong khi thứ cần canh là một RÀNG BUỘC (nội dung có
   thật sự cần hai hàng không). `mocToi` mang 5 mốc ngày + 6 dòng việc — nhét vào một hàng đơn
   vị thì hoặc cắt mất nửa danh sách, hoặc vỡ ô vuông.
   ⛔ Nới nghĩa mà không nêu TÊN là mở cửa cho mọi ô đòi khổ lớn. Nên cổng nay là DANH SÁCH
   ĐÍCH DANH: thêm một ô vào đây phải là một quyết định có người ký, không phải một dòng sửa
   nhanh cho test hết đỏ. */
const DUOC_2X2: readonly string[] = ['mocToi'];
assert.ok(!d.bay.some((m) => m.co === '2x2' && !DUOC_2X2.includes(m.ma)),
  `2x2 chỉ cho ô ĐÍCH DANH (${DUOC_2X2.join(', ')}) — ô khác lấy khổ đó là phạm chốt 14`);
/* Và ca ngược lại: ô có tên trong danh sách phải THẬT SỰ đang dùng khổ đó. Thiếu ca này thì
   danh sách trên có thể mục ruỗng dần — ai đó hạ `mocToi` về 2x1 mà tên vẫn nằm đây, và cổng
   vẫn xanh trong khi nó đang canh một ngoại lệ không còn tồn tại. */
assert.ok(d.bay.some((m) => m.ma === 'mocToi' && m.co === '2x2'),
  'mocToi có tên trong danh sách 2x2 thì nó phải đang thật sự dùng khổ đó');
/* Khoá riêng `keDuAn` — nó là ô DUY NHẤT từng mang 2x2, nên nếu ai trả nó về thì phải trả có ý
   thức. Tách ca vì "không ô nào 2x2" và "keDuAn là 2x1" là HAI luật: luật đầu là nhịp lưới,
   luật sau là cỡ đúng cho một danh sách. Một con số đừng chở hai luật. */
const keD = d.bay.find((m) => m.ma === 'keDuAn');
assert.equal(keD?.co, '2x1', 'keDuAn đang vẽ DANH SÁCH ⇒ 2x1; 2x2 chỉ khi nó thật sự vẽ lưới bìa');
for (const [ten, kh2] of [['C', keHoachHome({ tinHieu: KHONG_DO, gio: 8, daQuayLai: false })],
                          ['E', keHoachHome({ tinHieu: KHONG_DO, gio: 19, daQuayLai: false })]] as const) {
  const k = kh2.bay.find((m) => m.ma === 'keDuAn');
  if (k) assert.equal(k.co, '2x1', `trạng thái ${ten}: keDuAn cũng phải 2x1, luật cỡ không đổi theo giờ`);
}
assert.equal(nhipCua('day').cot, 4, 'bản vẽ EXS-C: lưới 4 cột');
assert.equal(nhipCua('day').heSoGap, 1, 'bản vẽ EXS-C: gap = đúng --gap, không nhân thêm');

// Không có phiên dở ⇒ hero KHÔNG được là một ô rỗng: mục đầu phải là mục KHÁC có dữ liệu thật.
const dKhongDo = keHoachHome({ tinHieu: { ...DAY, coViecDo: false }, gio: 14, daQuayLai: true });
assert.ok(!dKhongDo.bay.some((m) => m.ma === 'tiepTuc'),
  'không có việc dở ⇒ hero Resume biến mất, không đứng lại làm khung rỗng');

console.log('✓ nam-trang-thai: 5 trạng thái · mật độ theo trạng thái · tự ẩn · vitals im · hero theo bản vẽ EXS-C');
