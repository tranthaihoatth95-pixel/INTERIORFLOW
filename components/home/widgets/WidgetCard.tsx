/**
 * components/home/widgets/WidgetCard.tsx — [marker: DongStudio] vỏ card dùng chung cho widget
 * Home (phiếu docs/phieu-giao/home-dong-studio.md ④.5-10, nâng BENTO v3
 * docs/phieu-giao/home-bento-v3.md) — MỘT nơi định nghĩa nền/viền/bo/khoảng đệm, tránh N file
 * lặp cùng style (đúng luật "một cỗ máy nhiều mặt tiền" CLAUDE.md). Token qua CSS var sẵn có,
 * KHÔNG hardcode hex. Thang bo `--r-3` (14px, `lib/geometry.ts` RADIUS.r3) — một-khối-một-bóng
 * (SPEC-DESIGN-SYSTEM-IF §2c).
 *
 * v3 — mỗi ô bento phải LẤP ĐẦY đúng khung lưới cha (grid area cố định ở DongStudioHome.tsx) và
 * không tràn: `h-full flex flex-col`, phần thân `noPad` cho widget ảnh full-bleed (ô D), `dense`
 * giảm đệm cho ô hẹp (B/C), `bodyClassName` cho phần cuộn riêng (KHÔNG cuộn cả card — chỉ danh
 * sách bên trong, giữ tiêu đề cố định).
 *
 * GU (chỉ đạo giữa phiên, `docs/nc/NC-GU-BENTRAN-PINTEREST-2026-08-13.md` mạch #1 Swiss/editorial)
 * — `index` là số thứ tự ô (đúng chữ Hoà pin nhiều lần: "SỐ THỨ TỰ to làm nhân vật, nhãn mono nhỏ
 * uppercase") — hiện TRƯỚC tiêu đề, `font-mono`, KHÔNG phải badge/pill riêng (giữ hairline, tránh
 * bo bubbly). border hairline `1px solid var(--border)` + `--r-3` (14px) đã đúng gu — không đổi.
 *
 * v4 (13/08, phiếu home-bento-v4.md ④.6, lỗi #6 "theme sáng trắng-trên-trắng thiếu phân tầng") —
 * thêm `box-shadow: var(--shadow-node)` (token SẴN CÓ, đủ cả 2 theme — `globals.css`, không đụng
 * file đó). Ở theme tối card gần như không đổi (nền đã tối, viền đã đủ); ở theme sáng `--card`
 * (#fff) đứng trên `--bg` (#f2efe9, giấy ấm) chỉ cách nhau ~14 điểm sáng — viền `--border` mỏng
 * dễ chìm, bóng 1 lớp là thứ TÁCH card ra khỏi nền rõ ràng nhất (đúng "một-khối-một-bóng" §2c).
 */

import type { ReactNode } from 'react';

export default function WidgetCard({
  title,
  index,
  action,
  children,
  className = '',
  dense = false,
  noPad = false,
  bodyClassName = '',
}: {
  title?: string;
  /** Số thứ tự ô, vd "01" — gu Swiss (xem comment đầu file). Bỏ trống = không đánh số. */
  index?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Đệm nhỏ hơn — cho ô hẹp (B/C, ~2-3 cột). */
  dense?: boolean;
  /** Bỏ hẳn đệm/tiêu đề mặc định — widget tự vẽ layout riêng (ô D ảnh full-bleed). */
  noPad?: boolean;
  bodyClassName?: string;
}) {
  if (noPad) {
    return (
      <div
        className={`relative h-full overflow-hidden rounded-[var(--r-3)] ${className}`}
        style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-node)' }}
      >
        {children}
      </div>
    );
  }
  return (
    <div
      className={`flex h-full flex-col rounded-[var(--r-3)] ${dense ? 'p-3' : 'p-4'} ${className}`}
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      {title && (
        <div className={`flex items-center justify-between gap-2 ${dense ? 'mb-1.5' : 'mb-2.5'} shrink-0`}>
          {/* P-X ⑤ (17/08) — tương phản: tiêu đề `--t4` đo được 3,44 (tối) / 3,26 (sáng) và số
              `--t5` 1,98 / 2,21, ĐỀU dưới ngưỡng 4,5:1 — mà đây là tiêu đề của CẢ 10 widget Home.
              Cả hai lên `--t3` (7,24 / 5,20 ✓). Số vẫn tách khỏi nhãn, nhưng bằng CÂN NẶNG chữ
              (`font-normal` cạnh `font-semibold`) chứ không bằng màu nhạt — màu/độ nhạt không
              được là kênh phân biệt duy nhất. Đổi TOKEN, không tự chế màu. */}
          <h3 className="flex items-baseline gap-1.5 font-mono text-[length:var(--fs-xs)] font-semibold uppercase tracking-wide text-[var(--t3)]">
            {index && <span className="font-normal">{index}</span>}
            {title}
          </h3>
          {action}
        </div>
      )}
      <div className={`min-h-0 flex-1 ${bodyClassName}`}>{children}</div>
    </div>
  );
}
