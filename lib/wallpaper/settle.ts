/**
 * lib/wallpaper/settle.ts — [marker: chamDanDung] CHẬM DẦN RỒI **DỪNG HẲN**.
 *
 * Yêu cầu Hoà (16/08): *"đăng nhập vô là chậm và dừng hẳn ở màn home dashboard"*.
 *
 * ⭐ VÌ SAO CHUYỂN ĐỘNG NÀY KHÔNG PHẢI TRANG TRÍ (NT-11 cấm trang trí): nó mang tin —
 * **việc nó DỪNG LẠI chính là câu "đã tới nơi, bắt đầu làm việc"**. Một vòng lặp chạy mãi
 * thì không nói được gì và vi phạm NT-11. Cho nên "dừng" ở đây không phải chi tiết kỹ thuật,
 * nó là *nội dung* của hiệu ứng.
 *
 * 🔴 "DỪNG HẲN" ĐƯỢC ĐỊNH NGHĨA CHẶT (phiếu ⑤): dừng = **ngừng tiêu CPU/GPU**, không phải
 * vẽ tiếp một khung hình không đổi. Thi hành bằng ba việc, cả ba kiểm được:
 *   ① hết pha vào ⇒ style trả về `transition:'none'` và `animation:'none'` — **không còn
 *      thuộc tính hoạt hoạ nào** để trình duyệt phải giữ compositor layer;
 *   ② `willChange` gỡ về `'auto'` (giữ `transform` là ép trình duyệt nuôi một lớp GPU vĩnh viễn);
 *   ③ KHÔNG có `requestAnimationFrame`, KHÔNG có `setInterval` trong toàn bộ hệ hình nền —
 *      nhịp thời gian dùng **một `setTimeout` hẹn tới mốc kế tiếp** (`msToiMocSau`), thường
 *      cách hàng chục phút. Giữa hai mốc, khung hình đứng yên tuyệt đối.
 *
 * ⚠️ `prefers-reduced-motion` ⇒ **KHÔNG chuyển động chút nào**, vào thẳng khung cuối. Không
 * phải "chậm hơn" — là **không có**.
 *
 * ⚠️ Hiệu ứng vào **không khoá tay người dùng**: lớp nền luôn `pointer-events:none` và không
 * có overlay nào chặn; người dùng bấm được ngay từ khung hình đầu.
 */

/**
 * 2400ms. Vì sao con số này:
 * - chuyển cảnh NHỎ đã chốt là 180–220ms (mở/đóng tấm) — cái đó là *đổi trạng thái*;
 * - đây là *hạ cánh của cả một màn*, dài hơn hẳn mới đọc ra được là "đang chậm lại";
 * - trần trên là kiên nhẫn: quá ~3s thì thành phải-chờ. 2400ms nằm dưới trần đó.
 */
export const SETTLE_MS = 2400;

/**
 * `cubic-bezier(.16,1,.3,1)` — quãng đường đi gần hết trong ~1s đầu, ~1.4s sau là phần
 * **lắng**. Chính đoạn đuôi dài đó tạo cảm giác "chậm dần rồi đứng lại", chứ không phải
 * tổng thời lượng. Không "bật cụp" vì đạo hàm về 0 ở cuối.
 */
export const SETTLE_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

/** Biên độ: nền nở 1.045 → 1 và nhích lên 8px → 0. Rất nhẹ — nền không được cướp sự chú ý. */
export const SETTLE_SCALE = 1.045;
export const SETTLE_DY_PX = 8;

export type PhaChuyenDong = 'entering' | 'stopped';

export interface StyleNen {
  transform: string;
  transition: string;
  animation: string;
  willChange: string;
}

/**
 * Style của lớp nền theo pha.
 *
 * `stopped` trả về một object **không còn transition/animation** — đó là bằng chứng máy đọc
 * được của "đã dừng hẳn" (xem `settle.test.ts`).
 */
export function styleNen(pha: PhaChuyenDong, giamChuyenDong: boolean): StyleNen {
  if (giamChuyenDong || pha === 'stopped') {
    return {
      transform: 'none',
      transition: 'none',
      animation: 'none',
      willChange: 'auto',
    };
  }
  return {
    transform: `scale(${SETTLE_SCALE}) translate3d(0, ${SETTLE_DY_PX}px, 0)`,
    transition: `transform ${SETTLE_MS}ms ${SETTLE_EASE}`,
    animation: 'none',
    willChange: 'transform',
  };
}

/** Đã dừng thật chưa — dùng cho test và cho thuộc tính `data-wp-motion` trên DOM. */
export function daDungHan(s: StyleNen): boolean {
  return (
    s.transition === 'none' &&
    s.animation === 'none' &&
    s.willChange === 'auto' &&
    s.transform === 'none'
  );
}

/* ------------------------------------------------------------------ *
 * NHỊP THỜI GIAN — một setTimeout, không interval
 * ------------------------------------------------------------------ */

/** Bước cập nhật ánh sáng: 30 phút. 48 lần/ngày, mỗi lần một chuyển tiếp rồi lại đứng yên. */
export const BUOC_PHUT = 30;

/**
 * Số mili-giây tới mốc cập nhật kế tiếp.
 *
 * Vì sao không dùng `setInterval` mỗi giây (như `DongStudioHome` đang làm cho đồng hồ):
 * đồng hồ PHẢI nhảy từng phút nên nó có lý do; nền thì không — nuôi một interval để đổi
 * một thứ 30 phút mới đổi một lần là tiêu CPU vô ích, và mâu thuẫn thẳng với "dừng hẳn".
 */
export function msToiMocSau(now: Date = new Date(), buocPhut: number = BUOC_PHUT): number {
  const b = Math.max(1, Math.round(buocPhut));
  const phutTrongNgay = now.getHours() * 60 + now.getMinutes();
  const mocSau = (Math.floor(phutTrongNgay / b) + 1) * b;
  const conLaiPhut = mocSau - phutTrongNgay;
  return conLaiPhut * 60_000 - now.getSeconds() * 1000 - now.getMilliseconds();
}

/** Giờ thập phân (17.5 = 17:30) — đầu vào của `sunPosition`/`timeOfDayFromHour`. */
export function gioThapPhan(now: Date = new Date()): number {
  return now.getHours() + now.getMinutes() / 60;
}
