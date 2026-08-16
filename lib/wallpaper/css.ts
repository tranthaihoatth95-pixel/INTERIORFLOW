/**
 * lib/wallpaper/css.ts — [marker: boHinhNen] bảng màu + cơ chế hình học → chuỗi CSS `background`.
 *
 * THUẦN, tất định: cùng đầu vào ra cùng chuỗi. Nhờ vậy bản vẽ (`docs/mocks/…`) và app dùng
 * **CÙNG MỘT hàm** — không có đường nào để mock và code phân kỳ (bệnh đã trả giá nhiều lần).
 *
 * ⚠️ Không có `animation` ở đây. Nền **đứng yên tuyệt đối** giữa hai mốc thời gian; phần
 * chuyển động duy nhất là lúc VÀO, và nó nằm ở `settle.ts` — xem lý do ở đó.
 */

import type { WallpaperPalette, WallpaperSet } from './types';
import { rgb, rgba, type NguonSang } from './sets';

/**
 * `stops` xếp sáng→tối. Đặt tên cho dễ đọc chỗ dùng.
 * s0 = sáng nhất (nguồn sáng) · s3 = tối nhất (đáy/bóng).
 */
function chang(p: WallpaperPalette) {
  const [s0, s1, s2, s3] = p.stops;
  return { s0, s1, s2, s3 };
}

/**
 * Sinh `background` cho một khung hình nền.
 *
 * @param sun vị trí mặt trời THẬT tại giờ đang xét — nền mang tin, không trang trí.
 */
export function nenCss(set: WallpaperSet, p: WallpaperPalette, sun: NguonSang): string {
  const { s0, s1, s2, s3 } = chang(p);

  switch (set.layer) {
    /* ① CHÂN TRỜI — vòm tối dần lên trên + quầng sáng nằm TRÊN đường chân trời, chạy
       theo mặt trời. Mặt trời lặn ⇒ quầng tắt, chỉ còn vòm đêm. */
    case 'horizon': {
      const quang = sun.daLan
        ? ''
        : `radial-gradient(64% 42% at ${sun.x.toFixed(1)}% ${(58 + sun.y * 0.28).toFixed(1)}%, ${rgba(s0, 0.85)} 0%, ${rgba(s1, 0.32)} 46%, transparent 74%),`;
      return (
        `${quang}` +
        `linear-gradient(180deg, ${rgb(s3)} 0%, ${rgb(s2)} 46%, ${rgb(s1)} 78%, ${rgb(s0)} 100%)`
      );
    }

    /* ② Ô CỬA — một vệt sáng nghiêng đổ vào, GÓC đổi theo giờ. Đêm thì không có vệt nắng,
       thay bằng một quầng đèn ấm-lạnh rất tiết chế hắt từ mép dưới (ánh sáng nhân tạo). */
    case 'aperture': {
      if (sun.daLan) {
        return (
          `radial-gradient(72% 46% at 50% 108%, ${rgba(s0, 0.5)} 0%, transparent 68%),` +
          `linear-gradient(168deg, ${rgb(s3)} 0%, ${rgb(s2)} 60%, ${rgb(s3)} 100%)`
        );
      }
      const g = sun.gocVet.toFixed(1);
      return (
        `linear-gradient(${g}deg, transparent 0%, transparent 28%, ${rgba(s0, 0.55)} 42%, ${rgba(s0, 0.62)} 52%, transparent 68%, transparent 100%),` +
        `linear-gradient(${g}deg, transparent 0%, transparent 58%, ${rgba(s1, 0.34)} 72%, transparent 88%),` +
        `linear-gradient(150deg, ${rgb(s2)} 0%, ${rgb(s3)} 55%, ${rgb(s2)} 100%)`
      );
    }

    /* ③ BÌNH ĐỘ — nét mảnh đều, không có bầu trời. Ánh sáng đổi làm dải nét nào lộ ra.
       Nét dùng `repeating-linear-gradient` 1px, bước 34px — thưa, không moiré ở 1×/2×. */
    case 'contour': {
      return (
        `repeating-linear-gradient(96deg, ${rgba(s0, 0.5)} 0px, ${rgba(s0, 0.5)} 1px, transparent 1px, transparent 34px),` +
        `repeating-linear-gradient(6deg, ${rgba(s1, 0.26)} 0px, ${rgba(s1, 0.26)} 1px, transparent 1px, transparent 96px),` +
        `radial-gradient(78% 62% at ${sun.x.toFixed(1)}% 34%, ${rgba(s1, 0.42)} 0%, transparent 72%),` +
        `linear-gradient(160deg, ${rgb(s2)} 0%, ${rgb(s3)} 100%)`
      );
    }

    /* ④ TẦNG SÂU — bốn lớp lùi dần; lớp càng xa càng nhạt (phối cảnh khí quyển).
       Sương dày lên về đêm: `daLan` ⇒ thêm một màng phủ đều. */
    case 'strata': {
      const suong = sun.daLan ? `linear-gradient(0deg, ${rgba(s2, 0.34)} 0%, ${rgba(s2, 0.34)} 100%),` : '';
      return (
        `${suong}` +
        `linear-gradient(178deg, transparent 0%, transparent 52%, ${rgba(s3, 0.9)} 52.4%, ${rgba(s3, 0.9)} 100%),` +
        `linear-gradient(174deg, transparent 0%, transparent 38%, ${rgba(s2, 0.82)} 38.4%, ${rgba(s2, 0.82)} 100%),` +
        `linear-gradient(182deg, transparent 0%, transparent 26%, ${rgba(s1, 0.7)} 26.4%, ${rgba(s1, 0.7)} 100%),` +
        `radial-gradient(90% 54% at ${sun.x.toFixed(1)}% 16%, ${rgba(s0, 0.8)} 0%, transparent 70%),` +
        `linear-gradient(180deg, ${rgb(s1)} 0%, ${rgb(s2)} 100%)`
      );
    }

    /* ⑤ MẶT PHẲNG — một tấm trơn, ánh sáng LIẾM NGANG từ mép; hạt vật liệu rất mịn.
       Hạt làm bằng hai lớp repeating lệch pha (không dùng nhiễu SVG — feTurbulence tốn CPU
       và trên màn hiDPI dễ ra moiré, đã cân nhắc và loại). */
    case 'plane':
    default: {
      const mep = sun.daLan ? 4 : 96 + sun.x * 0.6;
      return (
        `repeating-linear-gradient(0deg, ${rgba(s0, 0.05)} 0px, ${rgba(s0, 0.05)} 1px, transparent 1px, transparent 3px),` +
        `repeating-linear-gradient(90deg, ${rgba(s3, 0.05)} 0px, ${rgba(s3, 0.05)} 1px, transparent 1px, transparent 4px),` +
        `linear-gradient(${mep.toFixed(1)}deg, ${rgba(s0, 0.6)} 0%, transparent 34%),` +
        `linear-gradient(158deg, ${rgb(s1)} 0%, ${rgb(s2)} 48%, ${rgb(s3)} 100%)`
      );
    }
  }
}

/**
 * Ô xem trước nhỏ (picker / bản vẽ). CÙNG hàm `nenCss`, chỉ khác kích thước chỗ đặt —
 * đúng yêu cầu phiếu ④V5: *"hình xem trước phải cho thấy thật bộ đó trông ra sao,
 * không phải ô màu trơn"*.
 */
export const xemTruocCss = nenCss;
