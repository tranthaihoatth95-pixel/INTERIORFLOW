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
}

const DAWN: TimeOfDayInfo = {
  period: 'dawn',
  label: ['Bình minh', 'Dawn'],
  gradient: 'linear-gradient(165deg, #f4ddce 0%, #e3b7a0 45%, #b98268 100%)',
  textOnGradient: 'dark',
};
const DAY: TimeOfDayInfo = {
  period: 'day',
  label: ['Ban ngày', 'Day'],
  gradient: 'linear-gradient(165deg, #eef0ea 0%, #dee2d9 50%, #c7cbc0 100%)',
  textOnGradient: 'dark',
};
const DUSK: TimeOfDayInfo = {
  period: 'dusk',
  label: ['Hoàng hôn', 'Dusk'],
  gradient: 'linear-gradient(165deg, #d59d67 0%, #a9673f 45%, #54301f 100%)',
  textOnGradient: 'light',
};
const NIGHT: TimeOfDayInfo = {
  period: 'night',
  label: ['Ban đêm', 'Night'],
  gradient: 'linear-gradient(165deg, #24283a 0%, #171a26 55%, #0c0c0e 100%)',
  textOnGradient: 'light',
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
