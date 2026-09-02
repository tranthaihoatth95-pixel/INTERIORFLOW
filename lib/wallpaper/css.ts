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
import { rgb, rgba, hslToRgb, type NguonSang } from './sets';

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

    /* ③ GIẤY CARO — giấy kẻ ô của bản vẽ nháp (chốt 12 Hoà: *"nền = giấy draft caro lam"*).
       Hai lưới vuông LỒNG NHAU theo nhịp 5: ô nhỏ 8px mảnh, ô lớn 40px đậm hơn. Nhịp 5 là thứ
       làm nó đọc ra GIẤY KẺ chứ không ra một tấm lưới đều — mắt bắt được nhóm, không phải đếm
       từng ô. Bốn lớp `repeating-linear-gradient` (ngang + dọc × nhỏ + lớn) trên một nền phẳng.

       📌 Layer này THAY `contour` (đường đồng mức, nét chéo thưa 34/96px) đã gỡ 02/09. Hai thứ
       cùng "chỉ có nét" nên bị đọc lẫn nhau suốt một thời gian — đồng mức vẽ một BẢN ĐỒ, caro
       vẽ một TỜ GIẤY — và đó chính là lý do `binh-do` bị nhận nhầm là đã thoả chốt 12.

       ⛔ KHÔNG hạt, KHÔNG chuyển động: đây là NỀN của một app làm việc — nó phải đứng yên phía
       sau và không cướp một chút chú ý nào. Ánh sáng theo giờ chỉ đổi ĐỘ ĐẬM của nét (qua `s0…s3`
       vốn đã tính theo `period`), không đổi hình học. Nét không nhoè theo giờ thì người dùng
       luôn nhận ra cùng một tờ giấy. */
    case 'caro': {
      const o = 8;
      const oLon = o * 5;
      /* 🔴 SỬA 02/09 SAU KHI NHÌN ẢNH 20:36 — LƯỚI VÔ HÌNH Ở CẢ 6 ẢNH.
         Bản trước vẽ nét bằng `s1`, tức lấy MỰC TỪ TRONG BẢNG MÀU CỦA NỀN. Tôi đã tự trấn an
         bằng một chú thích nghe rất hợp lý: *"nét vẽ bằng s1 mà s1 đã theo theme nên tương phản
         tự đúng chiều"*. Đúng CHIỀU, **sai ĐỘ LỚN** — và không ai tính con số đó, kể cả tôi.
         Tính ra thì: `NEO_DO_SANG` cố ý HẸP (dark night [0.05 … 0.17]) để chữ trên kính còn qua
         AA. Với `spread` .42, `s1` và `s3` chênh ~0,034 đơn vị L ⇒ **~8 đơn vị kênh sRGB**, nhân
         alpha .16 còn **~1,3 đơn vị**. Theme sáng còn tệ hơn: ~0,8. Mắt không phân giải nổi.
         ⇒ Mực lấy từ trong dải nền thì KHÔNG BAO GIỜ hiện, dù alpha bao nhiêu — nới alpha chỉ
         làm nét dày lên chứ không làm nó khác màu.
         📌 Đây là lần THỨ HAI cùng một bệnh: `sets.ts:172-177` đã ghi ca y hệt hôm 26/08 ("qua
         hết cửa tương phản nhưng mở ra thì năm bộ gần như đen tuyền"). Bài học chung: **một chú
         thích hay đứng cạnh một con số chưa ai tính vẫn là một con số chưa ai tính.**

         NAY: mực là MÀU RIÊNG, đứng NGOÀI dải palette.
         · hue = `set.hue` — lam của chính tờ giấy, nên nét vẫn thuộc về bộ, không phải màu lạ.
         · sat .40 — cao hơn nền (.05) rất nhiều: nền là GIẤY, nét là MỰC. Lam nằm ở NÉT.
         · L theo theme: giấy sáng thì mực phải TỐI hơn giấy; giấy tối thì mực phải SÁNG hơn.
           Đây đúng là thứ cặp alpha chung không làm được, và là lý do `theme` được đóng dấu vào
           `WallpaperPalette` ở lát này — đúng "lát riêng có cổng" mà chú thích cũ đã hẹn.
         ⚠️ Trần kênh 138 của `sets.ts:164` vẫn phải giữ ở theme tối (chữ `--t3` trên pill kính
         cần nền hiệu dụng đủ tối). Mực .58 với alpha ≤ .22 nằm dưới trần đó — và cổng
         `caro-hien.test.ts` đo lại, không tin dòng này. */
      const toi = p.theme === 'dark';
      const muc = hslToRgb(set.hue, 0.4, toi ? 0.58 : 0.62);
      /* Nét ô lớn phải ĐẬM HƠN RÕ nét ô nhỏ, nếu không nhịp 5 biến mất và lưới thành đều tăm
         tắp. Tỉ lệ ~2,1× là chỗ mắt còn thấy nhóm mà nét lớn chưa thành khung kẻ bảng. */
      const mo = toi ? 0.1 : 0.2;
      const dam = toi ? 0.22 : 0.42;
      const luoi = (buoc: number, a: number) =>
        `repeating-linear-gradient(0deg, ${rgba(muc, a)} 0px, ${rgba(muc, a)} 1px, transparent 1px, transparent ${buoc}px),` +
        `repeating-linear-gradient(90deg, ${rgba(muc, a)} 0px, ${rgba(muc, a)} 1px, transparent 1px, transparent ${buoc}px)`;
      return (
        `${luoi(oLon, dam)},` +
        `${luoi(o, mo)},` +
        `linear-gradient(180deg, ${rgb(s3)} 0%, ${rgb(s2)} 100%)`
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
