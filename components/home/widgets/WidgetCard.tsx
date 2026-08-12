/**
 * components/home/widgets/WidgetCard.tsx — [marker: DongStudio] vỏ card dùng chung cho 6
 * widget Trang 2 (phiếu docs/phieu-giao/home-dong-studio.md, việc ④.5-10) — MỘT nơi định
 * nghĩa nền/viền/bo/khoảng đệm, tránh 6 file lặp cùng style (đúng luật "một cỗ máy nhiều mặt
 * tiền" CLAUDE.md). Token qua CSS var sẵn có, KHÔNG hardcode hex.
 */

import type { ReactNode } from 'react';

export default function WidgetCard({
  title,
  action,
  children,
  className = '',
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[var(--r-3)] p-4 ${className}`}
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h3 className="text-[length:var(--fs-xs)] font-semibold uppercase tracking-wide text-[var(--t4)]">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}
