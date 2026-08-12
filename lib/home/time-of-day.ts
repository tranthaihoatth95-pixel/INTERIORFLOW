/**
 * lib/home/time-of-day.ts — [marker: DongStudio] ánh sáng theo giờ thật cho Home "Dòng Studio"
 * (phiếu docs/phieu-giao/home-dong-studio.md, việc ④.1 — cơ chế BỀN NHẤT trong NC-HOME-CAM-NHAN
 * §5 tầng 2 "Triển lãm": nền Trang 1 đổi sắc độ theo giờ hệ thống thay vì đứng yên một màu).
 *
 * THUẦN — không import React/DOM/store, chạy được `sucrase-node` trực tiếp (xem test cạnh file).
 * Không đọc `app/globals.css` (file đó thuộc phiếu H3) — bảng màu ở đây là giá trị literal,
 * áp qua inline style trong `components/home/DongStudioHome.tsx`, không phải token CSS mới.
 *
 * 4 khung giờ, biên KHÔNG chồng lấn, phủ đủ 24h:
 *   đêm   [20:00–04:59) · bình minh [05:00–07:59) · ngày [08:00–16:59) · hoàng hôn [17:00–19:59)
 */

export type TimeOfDayPeriod = 'dawn' | 'day' | 'dusk' | 'night';

export interface TimeOfDayInfo {
  period: TimeOfDayPeriod;
  /** [vi, en] — dùng cho label ẩn (aria) nếu cần, KHÔNG bắt buộc hiện chữ trên nền. */
  label: [string, string];
  /** CSS `background` — gradient literal, quiet-luxury (giảm bão hoà, không loè loẹt). */
  gradient: string;
  /** Chữ đặt TRÊN nền này nên sáng hay tối để đủ tương phản. */
  textOnGradient: 'light' | 'dark';
  /**
   * v3 (13/08 home-bento-v3.md, widget B "Đồng hồ ánh sáng") — nhiệt độ màu XẤP XỈ đúng nghề
   * (ánh sáng ban ngày trung tính ~5600K, hoàng hôn/bình minh ấm ~3000-3200K, đêm rất ấm ~2700K
   * kiểu đèn phòng) — con số THAM KHẢO nghề chiếu sáng, KHÔNG đo bằng cảm biến thật (khác lux/IES
   * thật — cùng tinh thần "ước tính, ghi rõ" của STATUS.md mục Lighting).
   */
  kelvin: number;
  /** [vi, en] — câu mô tả sắc ánh sáng, vd "ánh sáng chiều ấm 3200K". */
  lightLabel: [string, string];
}

const DAWN: TimeOfDayInfo = {
  period: 'dawn',
  label: ['Bình minh', 'Dawn'],
  gradient: 'linear-gradient(165deg, #f4ddce 0%, #e3b7a0 45%, #b98268 100%)',
  textOnGradient: 'dark',
  kelvin: 3000,
  lightLabel: ['ánh sáng bình minh ấm · 3000K', 'warm dawn light · 3000K'],
};
const DAY: TimeOfDayInfo = {
  period: 'day',
  label: ['Ban ngày', 'Day'],
  gradient: 'linear-gradient(165deg, #eef0ea 0%, #dee2d9 50%, #c7cbc0 100%)',
  textOnGradient: 'dark',
  kelvin: 5600,
  lightLabel: ['ánh sáng ban ngày trung tính · 5600K', 'neutral daylight · 5600K'],
};
const DUSK: TimeOfDayInfo = {
  period: 'dusk',
  label: ['Hoàng hôn', 'Dusk'],
  gradient: 'linear-gradient(165deg, #d59d67 0%, #a9673f 45%, #54301f 100%)',
  textOnGradient: 'light',
  kelvin: 3200,
  lightLabel: ['ánh sáng chiều ấm · 3200K', 'warm evening light · 3200K'],
};
const NIGHT: TimeOfDayInfo = {
  period: 'night',
  label: ['Ban đêm', 'Night'],
  gradient: 'linear-gradient(165deg, #24283a 0%, #171a26 55%, #0c0c0e 100%)',
  textOnGradient: 'light',
  kelvin: 2700,
  lightLabel: ['ánh sáng đêm dịu · 2700K', 'soft night light · 2700K'],
};

/** Giờ (0-23, giờ ĐỊA PHƯƠNG máy đang chạy) → khung ánh sáng. Thuần, không side-effect. */
export function timeOfDayFromHour(hour: number): TimeOfDayInfo {
  const h = ((hour % 24) + 24) % 24; // an toàn với input âm/lệch
  if (h >= 5 && h < 8) return DAWN;
  if (h >= 8 && h < 17) return DAY;
  if (h >= 17 && h < 20) return DUSK;
  return NIGHT;
}

/** Tiện dùng trực tiếp trong component — mặc định giờ hệ thống hiện tại. */
export function timeOfDayNow(now: Date = new Date()): TimeOfDayInfo {
  return timeOfDayFromHour(now.getHours());
}

/**
 * v3 (13/08 home-bento-v3.md, widget B "Đồng hồ ánh sáng") — vị trí chấm mặt trời trên MỘT cung
 * SVG "bình minh → hoàng hôn" (không phải vòng tròn 24h đầy đủ — đúng chữ phiếu "cung SVG bình
 * minh→hoàng hôn"). Cung phủ đúng khung [DAY_ARC_START, DAY_ARC_END) — ngoài khung đó (đêm) mặt
 * trời coi như LẶN, `belowHorizon=true`, toạ độ neo về đầu/cuối cung gần nhất (widget tự đổi
 * sang hiển thị trạng thái đêm thay vì chấm trên cung — xem LightClock.tsx).
 *
 * Tham số hoá thuần bằng sin — x chạy tuyến tính 0→100 (trái=bình minh, phải=hoàng hôn), y hạ
 * thấp dần về 2 đầu (đường chân trời) và cao nhất (0) đúng ĐỈNH cung — KHÔNG dùng góc/độ để giữ
 * công thức đơn giản, dễ test bằng số.
 */
const DAY_ARC_START = 5; // trùng biên dawn (timeOfDayFromHour) — mặt trời "mọc" lúc 5:00
const DAY_ARC_END = 20; // trùng biên cuối dusk — mặt trời "lặn" lúc 20:00

export interface SunPosition {
  /** 0 (trái, bình minh) → 100 (phải, hoàng hôn). */
  xPercent: number;
  /** 0 (đỉnh cung) → 100 (chân trời, 2 đầu cung). */
  yPercent: number;
  /** Tiến độ trong ngày, 0→1, ĐÃ CLAMP về [0,1] kể cả khi đang là đêm (dùng để định vị chấm). */
  progress: number;
  /** true khi giờ truyền vào nằm NGOÀI cung (đêm — mặt trời lặn dưới chân trời). */
  belowHorizon: boolean;
}

/** Giờ (0-23, có thể lẻ — vd 17.5) → vị trí mặt trời trên cung. Thuần, không side-effect. */
export function sunPosition(hour: number): SunPosition {
  const h = ((hour % 24) + 24) % 24;
  const span = DAY_ARC_END - DAY_ARC_START;
  const raw = (h - DAY_ARC_START) / span;
  const belowHorizon = raw < 0 || raw >= 1;
  const progress = Math.min(1, Math.max(0, raw));
  return {
    xPercent: progress * 100,
    yPercent: 100 - Math.sin(progress * Math.PI) * 100,
    progress,
    belowHorizon,
  };
}
