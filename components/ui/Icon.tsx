/**
 * components/ui/Icon.tsx — PRIMITIVE ICON CHÍNH TẮC CỦA IF.
 *
 * ─── VÌ SAO CÓ ────────────────────────────────────────────────────────────────
 * Đo 23/08 bằng `soi:foundation`: **1.079 / 1.164 vi phạm nền là icon** — 93%.
 * Nhưng phân bố nói rõ đây KHÔNG phải 213 tệp cẩu thả:
 *   cỡ:  13×332 · 15×186 · 12×183 · 11×83 · 10×31 · 22×21
 *   nét: 2×32 · 1.8×26 · 1.75×21 · 1.9×8 · 2.2×8 · 1.7×8
 * 13/15/12/11 không phải nhiễu — chúng là **những thang thay thế nhất quán**. Nhiều người mỗi
 * người chọn một cỡ hợp lý, và **không có gì giữ một thang**. Gốc bệnh là THIẾU PRIMITIVE,
 * không phải thiếu cẩn thận. ⇒ Sửa ở đây, một chỗ, thay vì sửa 213 chỗ.
 *
 * ─── LUẬT (Foundation System Sheet, mục "The grammar — every clause measurable") ──
 * Trích nguyên văn, KHÔNG tự chế giá trị:
 *   · lưới `0 0 24 24`, vùng sống 20×20, lề 2px
 *   · `stroke-width 1.5` — *"One value, no exceptions."*
 *   · cỡ quang học **chỉ** {14, 16, 18, 20} — buộc theo hạng điều khiển, không chọn tự do
 *   · `stroke-linecap` / `stroke-linejoin` = `round`
 *   · **VIỀN là mặc định và là trạng thái nghỉ HỢP LỆ DUY NHẤT.** Tô đặc chỉ để báo
 *     `selected`/`on`, và phải là **CÙNG MỘT glyph** — không phải hai hình khác nhau.
 *
 * ─── VÌ SAO KHÔNG DÙNG `LucideIcons[name]` ĐỘNG ──────────────────────────────
 * Cùng lý do `command-icon.tsx` đã ghi: tra động thì bundler phải gói TOÀN BỘ bộ icon, và gõ
 * sai tên chỉ lộ lúc render trắng bệch. Ở đây caller truyền THẲNG component đã import.
 *
 * ─── DÙNG ─────────────────────────────────────────────────────────────────────
 *   <Icon glyph={Move} />                    // 16, viền, currentColor
 *   <Icon glyph={Move} size={20} />
 *   <Icon glyph={Star} selected />           // tô đặc — CHỈ khi đang chọn/bật
 *   <Icon glyph={Move} label="Dời" />        // có nhãn ⇒ không còn aria-hidden
 */
import type { ComponentType, SVGProps } from 'react';

/** Bốn cỡ quang học. Kiểu này là CỔNG: truyền 13 là `tsc` đỏ, không phải chờ máy soi bắt. */
export const ICON_SIZES = [14, 16, 18, 20] as const;
export type IconSize = (typeof ICON_SIZES)[number];

/** Một giá trị, không ngoại lệ. Xuất ra để test khoá lại được. */
export const ICON_STROKE = 1.5;

export interface IconProps {
  /** Component glyph đã import sẵn (vd `import { Move } from 'lucide-react'`). */
  /* 🔴 SỬA 23/08 — `strokeWidth?: number` LÀM PRIMITIVE NÀY VÔ DỤNG VỚI MỌI ICON LUCIDE.
     `LucideProps` khai `strokeWidth?: string | number`; hẹp hơn ở đây là `tsc` đỏ ngay dòng dùng.
     ⭐ Vì sao sống được tới hôm nay dù tôi khai "8 assertion PASS": test cũ chỉ khoá HẰNG SỐ
     (cỡ, nét, viewBox) — **không ca nào truyền một icon lucide thật vào**. Test xanh, primitive
     chưa từng chạy. `grep 'glyph={'` = 0 nơi dùng, tức nó chưa bao giờ được cắm.
     Đúng bài học 15/08 (bug Hough): test khẳng định đường THOÁI LUI mà không có test nào khẳng
     định đường CHÍNH chạy được thì đó là test CHE bug, không phải test bảo vệ. */
  glyph: ComponentType<SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number | string }>;
  /** Cỡ quang học — buộc theo hạng điều khiển. Mặc định 16. */
  size?: IconSize;
  /**
   * TÔ ĐẶC. Chỉ dùng cho `selected`/`on`. KHÔNG phải "icon này thiết kế kiểu đặc" —
   * tô là một TRẠNG THÁI mà cùng một glyph đi vào rồi đi ra.
   */
  selected?: boolean;
  /** Có nhãn ⇒ icon mang nghĩa, đọc được cho trình đọc màn hình. Không có ⇒ trang trí, ẩn đi. */
  label?: string;
  className?: string;
}

export function Icon({ glyph: Glyph, size = 16, selected = false, label, className }: IconProps) {
  return (
    <Glyph
      size={size}
      strokeWidth={ICON_STROKE}
      // currentColor: màu do ngữ cảnh quyết, icon không tự chọn màu.
      color="currentColor"
      fill={selected ? 'currentColor' : 'none'}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
      focusable="false"
    />
  );
}
