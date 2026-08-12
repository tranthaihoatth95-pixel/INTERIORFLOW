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
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
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
          <h3 className="flex items-baseline gap-1.5 font-mono text-[length:var(--fs-xs)] font-semibold uppercase tracking-wide text-[var(--t4)]">
            {index && <span style={{ color: 'var(--t5)' }}>{index}</span>}
            {title}
          </h3>
          {action}
        </div>
      )}
      <div className={`min-h-0 flex-1 ${bodyClassName}`}>{children}</div>
    </div>
  );
}
