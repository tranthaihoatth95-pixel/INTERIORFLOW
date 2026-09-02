/**
 * lib/wallpaper/types.ts — [marker: hinhNenNguon] kiểu dùng chung cho HÌNH NỀN HỆ THỐNG.
 *
 * QUYẾT ĐỊNH KIẾN TRÚC (V1, phiếu docs/phieu-giao/P-O-5-bo-hinh-nen-dong.md):
 * hình nền đi kèm hệ thống được **SINH BẰNG MÃ**, không phải tệp ảnh. Lập luận đầy đủ + số
 * đo ở `docs/bao-cao-phien/2026-08-16-P-O-hinh-nen-dong.md` §V1. Ba lý do quyết định:
 *
 *  ① **Tương phản trở thành thứ CHỨNG MINH ĐƯỢC BẰNG MÁY.** Nền là mã ⇒ ta BIẾT chính xác
 *    màu tại mọi điểm lúc build ⇒ `contrast.ts` + test tất định khẳng định được cả 40 tổ hợp
 *    (5 bộ × 4 thời điểm × 2 theme). Nền là ảnh thì chỉ đo được lúc chạy, bằng canvas, trên
 *    máy người dùng — không có cửa nào chặn lúc build. Đúng luật 15/08: *"kiểm tiêu chuẩn là
 *    việc của MÁY, không phải của AI"*.
 *  ② **Luật trung tính được bảo đảm bằng CẤU TRÚC, không bằng kỷ luật.** Không có tệp ảnh
 *    nào thì không có đường nào để ảnh dự án của một studio lọt vào bộ cài. `public/wallpapers/`
 *    đã một lần chứa 53 render khách (AUDIT-BRAND-PII 🔴 #2) — đó là bệnh của kiến trúc-ảnh.
 *  ③ **0 byte bộ cài · mọi độ phân giải · offline** — đúng local-first.
 *
 * THUẦN — không import React/DOM. Chạy được `sucrase-node` trực tiếp (xem *.test.ts cạnh file).
 */

import type { TimeOfDayPeriod } from '../home/time-of-day';

export type Rgb = [number, number, number];

/** Hai theme của app. Khoá kỹ thuật giữ nguyên `dark`/`light` như `globals.css`. */
export type WallpaperTheme = 'dark' | 'light';

/** Bốn thời điểm — DÙNG LẠI máy đã chạy thật `lib/home/time-of-day.ts`, không đẻ máy thứ hai. */
export type WallpaperPeriod = TimeOfDayPeriod;

export const PERIODS: WallpaperPeriod[] = ['dawn', 'day', 'dusk', 'night'];
export const THEMES: WallpaperTheme[] = ['dark', 'light'];

/**
 * Cơ chế hình học của một bộ — ĐÂY mới là thứ làm năm bộ "khác nhau về CHẤT".
 * Năm bộ KHÔNG phải năm màu của cùng một thứ: chúng là năm hiện tượng ánh sáng khác nhau.
 */
export type WallpaperLayer =
  /** vòm trời + quầng sáng nằm trên đường chân trời, chạy theo mặt trời thật */
  | 'horizon'
  /** vệt nắng lọt qua ô cửa — GÓC vệt nghiêng theo giờ */
  | 'aperture'
  /* 🔴 `'contour'` (đường đồng mức) GỠ 02/09. Bộ duy nhất dùng nó là `binh-do`, và bộ đó nay
     vẽ `caro` cho khớp danh tính của chính nó (*"Grid Systems" · cyanotype · "chỉ nét và lưới"*).
     ⛔ Không giữ lại làm "dự trữ": một nhánh `layer` không ai dùng là NỢ, không phải tài sản —
     nó vẫn phải được đọc, được kiểm, được cân nhắc mỗi lần ai đó sửa họ này, mà không trả lại
     gì. Cần đồng mức thật thì viết lại, rẻ hơn nuôi một nhánh chết. */
  /** nhiều lớp lùi dần, sương dày lên về đêm — chiều sâu khí quyển */
  | 'strata'
  /** một mặt phẳng vật liệu, ánh sáng liếm ngang từ mép */
  | 'plane'
  /**
   * giấy kẻ caro của bản vẽ nháp — hai lưới vuông lồng nhau, ô nhỏ và ô lớn theo nhịp 5.
   * ⚠️ KHÁC `contour`: bình độ là đường đồng mức (nét cong, thưa, chéo) — nó là BẢN ĐỒ.
   * Caro là lưới vuông đều — nó là GIẤY. Chốt 12 của Hoà nói *"giấy draft caro lam"*, và
   * suốt một thời gian `binh-do` bị đọc nhầm thành thứ đó chỉ vì cả hai đều "chỉ có nét".
   */
  | 'caro';

export interface WallpaperSet {
  id: string;
  /** [vi, en] — tên hiển thị. */
  ten: [string, string];
  /**
   * 📏 MỘT CÂU nó là gì (phiếu ④V2). Không nói được một câu ⇒ nó là hoa văn, phải bỏ.
   * Đây là cửa nghiệm thu, không phải chú thích cho đẹp.
   */
  cau: [string, string];
  layer: WallpaperLayer;
  /**
   * Góc màu nền (0–360). ⛔ PHẢI nằm NGOÀI phổ màu nghĩa — xem `KHOANG_CAM` ở `sets.ts`:
   * nền ngả đỏ thì cảnh báo đỏ mất trọng lượng.
   */
  hue: number;
  /**
   * Bão hoà trần (0–1). Cố ý RẤT THẤP (≤0.12) — hệ quả quan trọng: **không bộ nào bị khoá
   * vào màu nhấn**. Màu nhấn thứ hai (mòng két ↔ mận) chưa chốt; ở mức bão hoà này góc màu
   * gần như không đọc ra được nên bộ nào cũng sống với cả hai lựa chọn.
   */
  sat: number;
  /** Độ rộng dải sáng–tối trong một bộ (0–1). Bộ nào cũng có nhịp riêng, không chỉ khác màu. */
  spread: number;
}

/** Một bảng màu đã giải xong cho (bộ × thời điểm × theme). */
export interface WallpaperPalette {
  /** Các chặng màu, xếp từ SÁNG nhất → TỐI nhất. Lớp hình học tự chọn chiều dùng. */
  stops: Rgb[];
  /** Độ sáng tương đối WCAG nhỏ nhất trong bảng — dùng cho ca xấu nhất của chữ SÁNG. */
  lumMin: number;
  /** Độ sáng tương đối WCAG lớn nhất — ca xấu nhất của chữ TỐI. */
  lumMax: number;
}

/** Nấc giảm chói — bắt buộc có, và **cắt ánh kim chứ không bao giờ cắt độ đọc**. */
export type NacGiamChoi = 0 | 1 | 2;

export interface WallpaperPrefs {
  /** id bộ đang chọn. */
  setId: string;
  /** 0 = kính như thường · 1 = giảm chói · 2 = TẮT HẲN kính, về màu trơn. */
  nacGiamChoi: NacGiamChoi;
  /** false = tắt hình nền hệ thống, về nền trơn `--bg` như trước. */
  bat: boolean;
}
