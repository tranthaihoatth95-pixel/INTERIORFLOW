/**
 * lib/ui/dat-cho.test.ts — khoá LUẬT ĐẶT CHỖ.
 * Chạy: `node_modules/.bin/sucrase-node lib/ui/dat-cho.test.ts`
 *
 * Ca 1 là ca chính và cũng là cách hỏng phổ biến nhất: overlay nhỏ mặc định ra giữa màn.
 * Ca 6-7 khoá điểm đắt nhất: KÍCH CỠ ĐỔI LOẠI, không chỉ đổi toạ độ.
 */

import { datCho, hangCo, loaiTheoHang, NGUONG, LE, CAM_TREN, CAM_DUOI, type Hop } from './dat-cho';

const KHUNG = { rong: 1440, cao: 900 };
let sai = 0;
const ok = (dieu: boolean, ten: string) => {
  if (!dieu) {
    sai += 1;
    console.error('✗', ten);
  }
};
const giua = (a: { x: number; rong: number }) => Math.abs(a.x + a.rong / 2 - KHUNG.rong / 2) < 40;

/* 1 — overlay NHỎ không bao giờ mặc định ra giữa màn khi có nguồn ở mép */
{
  const nguon: Hop = { x: 400, y: 120, rong: 90, cao: 30 };
  const r = datCho({ nguon, beMat: { rong: 300, cao: 180 }, khung: KHUNG });
  ok(r.loai === 'popover', 'nhỏ ⇒ popover');
  ok(!giua(r), 'popover KHÔNG được rơi vào giữa màn');
  ok(Math.abs(r.x + 150 - (nguon.x + 45)) < 1, 'popover phải neo theo tâm nguồn');
  ok(r.y === nguon.y + nguon.cao + 10, 'nở XUỐNG khi dưới còn nhiều chỗ');
}

/* 2 — nguồn sát mép DƯỚI ⇒ LẬT lên trên */
{
  const nguon: Hop = { x: 700, y: 840, rong: 90, cao: 30 };
  const r = datCho({ nguon, beMat: { rong: 300, cao: 260 }, khung: KHUNG });
  ok(r.huong === 'tren', 'sát mép dưới ⇒ lật lên trên');
  ok(r.y + r.cao <= nguon.y, 'lật rồi thì không được đè lên nguồn');
  ok(r.y >= LE, 'vẫn nằm trong khung nhìn');
}

/* 3 — nguồn sát mép PHẢI ⇒ kẹp, không tràn */
{
  const nguon: Hop = { x: 1400, y: 60, rong: 30, cao: 30 };
  const r = datCho({ nguon, beMat: { rong: 320, cao: 200 }, khung: KHUNG });
  ok(r.x + r.rong <= KHUNG.rong - LE, 'không tràn mép phải');
  ok(r.x >= LE, 'không tràn mép trái');
}

/* 4 — TRÁNH CHE vật đang chọn: phải dời NGANG, và vẫn còn trong khung */
{
  const nguon: Hop = { x: 600, y: 100, rong: 80, cao: 28 };
  const vatDangChon: Hop = { x: 520, y: 138, rong: 260, cao: 200 };
  const r = datCho({ nguon, beMat: { rong: 300, cao: 180 }, khung: KHUNG, tranhChe: [vatDangChon] });
  ok(r.daNeChe, 'phải nhận ra là đang che vật đang chọn');
  const chong =
    r.x < vatDangChon.x + vatDangChon.rong &&
    r.x + r.rong > vatDangChon.x &&
    r.y < vatDangChon.y + vatDangChon.cao &&
    r.y + r.cao > vatDangChon.y;
  ok(!chong, 'sau khi dời thì KHÔNG còn che vật đang chọn');
}

/* 5 — không có nguồn ⇒ góc, KHÔNG phải giữa màn */
{
  const r = datCho({ nguon: null, beMat: { rong: 300, cao: 180 }, khung: KHUNG });
  ok(!giua(r), 'không có nguồn cũng KHÔNG được ra giữa màn');
}

/* 6 — KÍCH CỠ ĐỔI LOẠI: vừa ⇒ inspector cắm bên, canvas vẫn thấy */
{
  const nguon: Hop = { x: 1300, y: 60, rong: 90, cao: 30 };
  const r = datCho({ nguon, beMat: { rong: 460, cao: 700 }, khung: KHUNG });
  ok(r.loai === 'inspector-canh', 'hạng vừa ⇒ inspector cắm bên, KHÔNG phải popover to');
  ok(r.huong === 'phai', 'nguồn bên phải ⇒ cắm phải');
  ok(r.x + r.rong <= KHUNG.rong, 'inspector nằm trong khung');
  ok(KHUNG.rong - r.rong >= 700, 'canvas chính vẫn còn hơn nửa màn');
}

/* 7 — LỚN ⇒ toàn không gian làm việc, vẫn chừa lề (là một LỚP, không phải trang khác) */
{
  const r = datCho({ nguon: { x: 10, y: 10, rong: 40, cao: 40 }, beMat: { rong: 900, cao: 860 }, khung: KHUNG });
  ok(r.loai === 'toan-khong-gian', 'hạng lớn ⇒ toàn không gian');
  ok(r.x === LE && r.y === LE + CAM_TREN, 'vẫn chừa lề, và KHÔNG đè vùng Vitals mép trên');
  ok(r.rong === KHUNG.rong - LE * 2, 'chiếm gần trọn bề rộng');
}

/* 8 — GIỮA MÀN chỉ đến từ khai tay `quyetDinhChan`, không bao giờ suy ra từ kích cỡ */
{
  const r = datCho({ nguon: null, beMat: { rong: 380, cao: 180 }, khung: KHUNG, quyetDinhChan: true });
  ok(r.loai === 'giua-man' && giua(r), 'quyết định chặn ⇒ giữa màn');
  // và không ca kích-cỡ nào tự nhảy vào 'giua-man'
  for (const co of [
    { rong: 100, cao: 80 },
    { rong: 460, cao: 700 },
    { rong: 1200, cao: 880 },
  ]) {
    ok(
      datCho({ nguon: null, beMat: co, khung: KHUNG }).loai !== 'giua-man',
      `cỡ ${co.rong}×${co.cao} không được tự thành hộp thoại giữa màn`,
    );
  }
}

/* 10 — VÙNG CẤM THƯỜNG TRỰC: nguồn sát mép TRÊN không được đè Vitals, sát ĐÁY không được
   đè dải hành động. Hai mục này là VÙNG CẤM, không phải "né nếu tiện". */
{
  const satTren: Hop = { x: 700, y: 8, rong: 90, cao: 28 };
  const a = datCho({ nguon: satTren, beMat: { rong: 300, cao: 200 }, khung: KHUNG });
  ok(a.y >= LE + CAM_TREN, `sát mép trên: y=${a.y} phải ≥ ${LE + CAM_TREN} (không đè Vitals)`);

  const satDay: Hop = { x: 700, y: 870, rong: 90, cao: 26 };
  const b = datCho({ nguon: satDay, beMat: { rong: 300, cao: 200 }, khung: KHUNG });
  ok(
    b.y + b.cao <= KHUNG.cao - LE - CAM_DUOI,
    `sát đáy: đáy bề mặt ${b.y + b.cao} phải ≤ ${KHUNG.cao - LE - CAM_DUOI} (không đè dải hành động)`,
  );
  ok(b.huong === 'tren', 'sát đáy ⇒ nở LÊN');

  // inspector và toàn-không-gian cũng phải tôn trọng hai dải
  const ins = datCho({ nguon: satTren, beMat: { rong: 460, cao: 900 }, khung: KHUNG });
  ok(ins.y >= LE + CAM_TREN && ins.y + ins.cao <= KHUNG.cao - LE - CAM_DUOI, 'inspector nằm trong dải hợp lệ');
  const lon = datCho({ nguon: satTren, beMat: { rong: 900, cao: 900 }, khung: KHUNG });
  ok(lon.y >= LE + CAM_TREN && lon.y + lon.cao <= KHUNG.cao - LE - CAM_DUOI, 'toàn không gian nằm trong dải hợp lệ');
}

/* 11 — KHÔNG BAO GIỜ che chính vật nguồn */
{
  const nguon: Hop = { x: 600, y: 400, rong: 120, cao: 40 };
  for (const cao of [120, 240, 340]) {
    const r = datCho({ nguon, beMat: { rong: 300, cao }, khung: KHUNG });
    const chong = r.x < nguon.x + nguon.rong && r.x + r.rong > nguon.x && r.y < nguon.y + nguon.cao && r.y + r.cao > nguon.y;
    ok(!chong, `cao ${cao}: bề mặt không được che chính vật nguồn`);
  }
}

/* 9 — ngưỡng hạng: đúng biên */
{
  ok(hangCo({ rong: NGUONG.NHO_RONG, cao: 100 }, KHUNG) === 'nho', 'đúng biên rộng vẫn là nhỏ');
  ok(hangCo({ rong: NGUONG.NHO_RONG + 1, cao: 100 }, KHUNG) === 'vua', 'quá biên rộng ⇒ vừa');
  ok(hangCo({ rong: 300, cao: KHUNG.cao * NGUONG.NHO_CAO + 1 }, KHUNG) === 'vua', 'quá biên cao ⇒ vừa');
  ok(hangCo({ rong: 600, cao: 100 }, KHUNG) === 'lon', 'rộng quá trần vừa ⇒ lớn');
  ok(loaiTheoHang('nho') === 'popover' && loaiTheoHang('vua') === 'inspector-canh', 'ánh xạ hạng → loại');
}

if (sai > 0) {
  console.error(`\n${sai} khẳng định hỏng`);
  process.exit(1);
}
console.log('dat-cho.test.ts — OK');
