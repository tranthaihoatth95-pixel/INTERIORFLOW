/**
 * lib/wallpaper/contrast.ts — [marker: kinhTrenNen] ĐO TƯƠNG PHẢN **TẠI CHÂN CHỮ**.
 *
 * 📏 Điểm nghiệm thu của phiếu (④V4): *"đo tương phản TẠI CHÂN CHỮ, KHÔNG đo trung bình cả
 * thẻ — và phải đạt ở cả 5 bộ × 4 thời điểm × 2 theme"*.
 *
 * "Tại chân chữ" nghĩa là gì, cụ thể: chữ không đứng thẳng trên nền, nó đứng trên một BỀ MẶT
 * (thẻ đặc hoặc pill kính). Nền hiệu dụng ngay dưới nét chữ =
 *      blend(màu bề mặt, độ đục bề mặt, MÀU NỀN NGAY TẠI ĐIỂM ĐÓ).
 * Ta không lấy độ sáng trung bình của cả tấm nền — lấy **chặng màu cực trị** của bảng màu
 * (sáng nhất và tối nhất), vì chữ có thể rơi đúng vào chỗ đó. Trung bình là cách giấu lỗi.
 *
 * ⭐ VÌ SAO ĐO ĐƯỢC LÚC BUILD: nền sinh bằng mã (quyết định V1) nên màu tại mọi điểm là số
 * đã biết. Nếu nền là ảnh thì chỉ đo được lúc chạy, bằng canvas, trên máy người dùng — không
 * có cửa nào chặn trước khi ship. Đây là **lập luận kiến trúc mạnh nhất cho V1**, và nó thi
 * hành đúng luật 15/08: *"kiểm tiêu chuẩn là việc của MÁY, không phải của AI"*.
 *
 * [Đ2] Máy tính tương phản KHÔNG viết lại — dùng `lib/adaptive-contrast.ts` đã chạy thật.
 */

import { AA_NORMAL, blend, contrastRatio, relLuminance, type RGB } from '../adaptive-contrast';
import { bangMau, WALLPAPER_SETS } from './sets';
import { PERIODS, THEMES, type NacGiamChoi, type Rgb, type WallpaperPeriod, type WallpaperSet, type WallpaperTheme } from './types';

/* ------------------------------------------------------------------ *
 * BẢN SAO TOKEN — có DRIFT-GUARD
 * ------------------------------------------------------------------ */

/**
 * ⚠️ Đây là **bản sao** các token màu của `app/globals.css`, cần vì phép tính phải chạy được
 * ở Node (không có trình duyệt để hỏi `getComputedStyle`).
 * 🔒 `contrast.test.ts` **đọc thẳng `app/globals.css`** và khẳng định từng giá trị ở đây khớp.
 * Ai đổi token mà quên chỗ này thì test đỏ — bản sao không được phép trôi âm thầm.
 */
export const TOKEN: Record<
  WallpaperTheme,
  { t1: RGB; t2: RGB; t3: RGB; card: RGB; nenMoHeader: RGB }
> = {
  dark: {
    t1: [245, 245, 247], // --t1 #f5f5f7
    t2: [214, 214, 219], // --t2 #d6d6db
    t3: [158, 158, 168], // --t3 #9e9ea8
    card: [26, 26, 30], // --card #1a1a1e
    nenMoHeader: [20, 20, 23], // --nen-mo-header rgba(20,20,23,.72)
  },
  light: {
    t1: [33, 30, 25], // --t1 #211e19
    t2: [71, 66, 58], // --t2 #47423a
    t3: [114, 108, 98], // --t3 #726c62
    card: [255, 255, 255], // --card #ffffff
    nenMoHeader: [250, 248, 244], // --nen-mo-header rgba(250,248,244,.72)
  },
};

/** Độ đục thật của `--nen-mo-header` trong `globals.css` (cả hai theme đều 0.72). */
export const ALPHA_KINH_GOC = 0.72;

/**
 * Nấc giảm chói — **cắt ánh kim, KHÔNG BAO GIỜ cắt độ đọc** (bài học lượt trước, ghi ở phiếu ⑤).
 * Cơ chế: nấc càng cao thì kính càng ĐẶC ⇒ nền càng ít ảnh hưởng ⇒ chữ càng chắc đọc.
 * Nấc 2 = tắt hẳn kính về màu trơn ⇒ tương phản thành hằng số, không phụ thuộc nền chút nào.
 */
export const ALPHA_THEO_NAC: Record<NacGiamChoi, number> = {
  0: ALPHA_KINH_GOC,
  1: 0.88,
  2: 1,
};

/* ------------------------------------------------------------------ *
 * BỀ MẶT chữ đứng lên
 * ------------------------------------------------------------------ */

export type BeMat =
  /** thẻ bento — ruột ĐẶC (luật B1 *"kính là VỎ, ruột ĐẶC"*) ⇒ nền không lọt vào */
  | 'the-dac'
  /** pill/thanh kính nổi TRỰC TIẾP trên nền — đây là chỗ tương phản phụ thuộc hình nền */
  | 'pill-kinh';

export type BacChu = 't1' | 't2' | 't3';
export const BAC_CHU: BacChu[] = ['t1', 't2', 't3'];

export interface HangDoChanChu {
  setId: string;
  period: WallpaperPeriod;
  theme: WallpaperTheme;
  beMat: BeMat;
  bac: BacChu;
  nac: NacGiamChoi;
  /** Độ sáng nền hiệu dụng NGAY DƯỚI nét chữ (không phải trung bình thẻ). */
  lumChanChu: number;
  /** Tỉ số tương phản WCAG, làm tròn 2 chữ số. */
  ratio: number;
  dat: boolean;
}

/** Ngưỡng bắt buộc cho MỌI bậc chữ, kể cả nhãn mờ nhất được dùng. */
export const NGUONG = AA_NORMAL; // 4.5

/**
 * Nền hiệu dụng tại chân chữ, cho MỘT chặng màu nền cụ thể.
 * `the-dac` ⇒ alpha 1 ⇒ nền bị chặn hoàn toàn (đúng thiết kế, và đó là lý do thẻ số liệu
 * KHÔNG được làm bằng kính — chốt A2: *"kính rất trong chỉ dùng chỗ ít chữ"*).
 */
export function nenChanChu(
  theme: WallpaperTheme,
  beMat: BeMat,
  nac: NacGiamChoi,
  mauNen: Rgb,
): RGB {
  const tk = TOKEN[theme];
  if (beMat === 'the-dac') return tk.card as RGB;
  return blend(tk.nenMoHeader, ALPHA_THEO_NAC[nac], mauNen as RGB);
}

/**
 * Đo một tổ hợp. Trả về hàng cho MỌI bậc chữ, lấy **ca xấu nhất** trong bảng màu:
 * thử cả chặng sáng nhất lẫn tối nhất rồi giữ tỉ số THẤP hơn.
 */
export function doChanChu(
  set: WallpaperSet,
  period: WallpaperPeriod,
  theme: WallpaperTheme,
  beMat: BeMat,
  nac: NacGiamChoi,
): HangDoChanChu[] {
  const pal = bangMau(set, period, theme);
  const cucTri: Rgb[] = [pal.stops[0], pal.stops[pal.stops.length - 1]];
  return BAC_CHU.map((bac) => {
    const chu = TOKEN[theme][bac];
    let xau = { ratio: Infinity, lum: 0 };
    for (const mau of cucTri) {
      const bg = nenChanChu(theme, beMat, nac, mau);
      const r = contrastRatio(chu, bg);
      if (r < xau.ratio) xau = { ratio: r, lum: relLuminance(bg) };
    }
    return {
      setId: set.id,
      period,
      theme,
      beMat,
      bac,
      nac,
      lumChanChu: Math.round(xau.lum * 10000) / 10000,
      ratio: Math.round(xau.ratio * 100) / 100,
      dat: xau.ratio >= NGUONG,
    };
  });
}

/**
 * BẢNG ĐẦY ĐỦ — 5 bộ × 4 thời điểm × 2 theme × 2 bề mặt × 3 bậc chữ = **240 phép đo**,
 * ở nấc giảm chói mặc định. Không tổ hợp nào được bỏ; bỏ là phải nói thẳng là đã bỏ.
 */
export function bangDayDu(nac: NacGiamChoi = 0): HangDoChanChu[] {
  const out: HangDoChanChu[] = [];
  for (const set of WALLPAPER_SETS) {
    for (const period of PERIODS) {
      for (const theme of THEMES) {
        for (const beMat of ['the-dac', 'pill-kinh'] as BeMat[]) {
          out.push(...doChanChu(set, period, theme, beMat, nac));
        }
      }
    }
  }
  return out;
}

/** Các hàng TRƯỢT — rỗng là điều kiện đích của phiếu. */
export function hangTruot(nac: NacGiamChoi = 0): HangDoChanChu[] {
  return bangDayDu(nac).filter((h) => !h.dat);
}
