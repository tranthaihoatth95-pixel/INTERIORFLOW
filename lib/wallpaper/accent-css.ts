/**
 * lib/wallpaper/accent-css.ts — [marker: noiDayAccent] NỐI DÂY: bộ hình nền đang chọn → bốn
 * token CSS `--accent*` mà `app/globals.css` hôm nay khai làm HẰNG SỐ.
 *
 * Chỉ đạo Hoà 01/09 11:20: *"accent đi theo bộ hình nền người dùng chọn — người ta chọn hình
 * gì thì màu theo đó."* Đây là lượt NỐI DÂY của `docs/control/IF-HE-5-BO-MAU.md` §5 bước 2.
 * `mau-bo.ts` đã khai bảng màu 5 bộ + cổng WCAG (`accentDat`) từ 30/08 — tệp này KHÔNG đẻ luật
 * mới, KHÔNG đẻ máy đo tương phản mới. Nó chỉ gọi đúng cổng đã có rồi biến kết quả thành chuỗi
 * CSS, đúng luật B25 (REUSE trước khi NEW).
 *
 * ⛔ CỔNG BẮT BUỘC TRƯỚC KHI ÁP — dùng `accentDat()` của `mau-bo.ts`, KHÔNG tự viết lại phép đo
 * tương phản (đã có `tuongPhan()` cùng công thức WCAG với `contrastRatio()` của
 * `lib/adaptive-contrast.ts`, dùng qua `mau-bo.ts` để không tách hai nguồn sự thật).
 * `accentDat()` xanh nghĩa là ĐỦ CẢ BA: chữ trắng trên accent ≥ 4.5 (§1.4.3) · accent cạnh
 * `--card` SÁNG ≥ 3.0 (§1.4.11) · accent cạnh `--card` TỐI ≥ 3.0 (§1.4.11) — TRONG CÙNG MỘT LẦN
 * GỌI, không phụ thuộc theme đang hiện. Tức một accent qua cổng là qua cho SÁNG LẪN TỐI, đúng
 * đòi hỏi "sáng/tối đều phải đúng, kiểm ĐỦ HAI THEME" — không cần gọi hai lần theo theme đang
 * mở, vì DOI_CHUNG trong mau-bo.ts đã ôm cả hai màu card của cả hai theme cùng lúc.
 *
 * Trượt cổng ⇒ THOÁI LUI nguyên vẹn về hằng số đang ship `#6a57f5` — không kẹp, không suy diễn
 * ra một màu khác. Trong thực tế cả 5 bộ đều qua cổng (accent của mỗi bộ được `mau-bo.ts` chọn
 * chính xác để lọt `khoangSang()`), nên nhánh thoái lui chỉ là lưới đỡ — không phải đường chính.
 *
 * THUẦN — không import React/DOM, chạy được `sucrase-node` (xem accent-css.test.ts cạnh tệp
 * trong bản chạy thật). Nơi áp các giá trị này vào `document.documentElement` là
 * `components/wallpaper/AccentHydrator.tsx` — cùng khuôn `lib/wallpaper/css.ts`: lib TÍNH chuỗi,
 * component ĐẶT style, không trộn hai việc vào một tệp.
 */

import type { RGB } from '../adaptive-contrast';
import { accentDat, accentRgb, bangMauCua, rgbToHex } from './mau-bo';
import { hslToRgb } from './sets';

export interface AccentTokens {
  accent: string;
  accentStrong: string;
  accentSoft: string;
  accentRing: string;
}

/**
 * Hằng số hiện hành của `app/globals.css` (dòng 19-22) — điểm THOÁI LUI khi một bộ trượt cổng
 * WCAG. Gõ tay Ở ĐÂY CHỈ MỘT LẦN, không lặp lại trong `AccentHydrator.tsx`.
 */
export const ACCENT_MAC_DINH: AccentTokens = {
  accent: '#6a57f5',
  accentStrong: '#553ff3',
  accentSoft: 'rgba(106, 87, 245, 0.14)',
  accentRing: 'rgba(106, 87, 245, 0.55)',
};

/**
 * Độ lệch L giữa `--accent` và `--accent-strong` hiện hành — ĐO LẠI bằng dò số trên chính hàm
 * `hslToRgb` của repo (`sets.ts`), không gõ tay một số đẹp: giữ nguyên (h=247.2°, s=0.885) của
 * `#6a57f5` và giảm dần L cho tới khi ra ĐÚNG TỪNG BYTE `#553ff3` — khớp ở dải L∈[0.6004,0.6016],
 * tức lệch ∈[0.0484,0.0496] so với L=0.65 gốc. 0.049 là tâm dải, dùng làm hằng số.
 * Áp cùng độ lệch này cho MỌI bộ — hover/active của bộ nào cũng tối hơn bộ đó một mức thống
 * nhất, đúng tinh thần "accent-strong hạ tương ứng" mà comment gốc trong globals.css đã ghi.
 * 🟡 CHỐT-SẢN-PHẨM-CHƯA-CÓ-NGUỒN: suy ra từ giá trị ĐÃ SHIP bằng dò số, không phải một nghiên
 * cứu WCAG riêng cho hover state — không giấu nhãn. Xem `find-delta.test.ts` (scratchpad, không
 * đi vào repo) — script dò dải khớp, chạy qua `sucrase-node`, kết quả in ra bảy giá trị khớp.
 */
const DO_LECH_STRONG_L = 0.049;

function rgbaStr(c: RGB, a: number): string {
  return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`;
}

/**
 * Bốn token accent cho MỘT bộ hình nền, hoặc `ACCENT_MAC_DINH` nếu accent của bộ đó trượt cổng
 * WCAG. Thuần + tất định: cùng `setId` luôn ra cùng bốn chuỗi.
 */
export function tokenAccentCuaBo(setId: string): AccentTokens {
  const bo = bangMauCua(setId);
  const rgb = accentRgb(bo);
  if (!accentDat(rgb)) return ACCENT_MAC_DINH;

  const strongRgb = hslToRgb(
    bo.accent.h,
    bo.accent.s,
    Math.max(0, bo.accent.l - DO_LECH_STRONG_L),
  );

  return {
    accent: rgbToHex(rgb),
    accentStrong: rgbToHex(strongRgb),
    accentSoft: rgbaStr(rgb, 0.14),
    accentRing: rgbaStr(rgb, 0.55),
  };
}
