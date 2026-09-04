'use client';

/**
 * components/render-studio/NumberField.tsx — ô nhập SỐ CÓ DẤU PHÂN CÁCH NGHÌN.
 *
 * VÌ SAO KHÔNG DÙNG `<input type="number">`: nó **không hiển thị được dấu phân cách** (spec HTML
 * bắt `value` phải là số hợp lệ theo dấu chấm thập phân, mọi ký tự nhóm đều làm `value` thành
 * rỗng). Cao độ tầng và quang thông đèn là số hồ sơ kỹ thuật — `3.300 mm` đọc trong nháy mắt,
 * `3300` phải đếm chữ số. Phiếu yêu cầu đúng chỗ này.
 *
 * Cách làm: `type="text"` + `inputMode="numeric"` (bàn phím số trên cảm ứng, §0c mảng 3) —
 * ĐANG GÕ thì giữ nguyên văn bản thô người dùng đánh (không nhảy con trỏ giữa chừng vì tự chèn
 * dấu chấm), RỜI Ô mới format lại. Chấp nhận cả '3.300' lẫn '3300' khi đọc vào.
 *
 * Cao `var(--tap)` (32 desktop → 44 cảm ứng, token có sẵn `globals.css:60,86`).
 */

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { formatThousands, parseThousands } from './scene3d-ui';

export interface NumberFieldProps {
  value: number;
  onCommit: (value: number) => void;
  /** đơn vị in mờ bên phải trong ô (mm · lm · K · °). */
  suffix?: string;
  ariaLabel: string;
  className?: string;
  /** ↑/↓ nhảy bấy nhiêu (giữ Shift = ×10) — bàn phím phải làm được việc của chuột (§0c mảng 1). */
  step?: number;
  min?: number;
  max?: number;
  disabled?: boolean;
  /** Số chữ số thập phân. **BẮT BUỘC khai > 0 cho đại lượng không nguyên** (vĩ độ/kinh độ) —
   * bỏ trống thì dấu `.` bị coi là dấu phân nhóm và `21.03` biến thành `2103`. Xem ca bệnh đã bắt
   * được lúc verify trong docstring `parseThousands()`. */
  decimals?: number;
}

export function NumberField({
  value,
  onCommit,
  suffix,
  ariaLabel,
  className,
  step = 1,
  min,
  max,
  disabled,
  decimals = 0,
}: NumberFieldProps) {
  const [draft, setDraft] = useState<string | null>(null);

  // Giá trị đổi từ NGOÀI (undo, preset, kéo gizmo) trong lúc ô đang mở → bỏ bản nháp, hiện số mới.
  // Không có dòng này thì kéo đèn bằng gizmo sẽ không thấy toạ độ chạy theo nếu con trỏ còn trong ô.
  useEffect(() => {
    setDraft(null);
  }, [value]);

  const clamp = (n: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n));

  const commit = (raw: string) => {
    const n = parseThousands(raw, decimals);
    setDraft(null);
    if (n !== null) onCommit(clamp(n));
  };

  return (
    <span className={cn('relative inline-flex w-full items-center', className)}>
      <input
        type="text"
        // decimals>0 → bàn phím cảm ứng phải có dấu chấm; `numeric` trên iOS KHÔNG có phím '.'
        inputMode={decimals > 0 ? 'decimal' : 'numeric'}
        disabled={disabled}
        aria-label={ariaLabel}
        value={draft ?? formatThousands(value, decimals)}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            commit((e.target as HTMLInputElement).value);
            return;
          }
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            const d = (e.key === 'ArrowUp' ? 1 : -1) * step * (e.shiftKey ? 10 : 1);
            const base = parseThousands(draft ?? String(value), decimals) ?? value;
            setDraft(null);
            onCommit(clamp(base + d));
            e.preventDefault();
          }
        }}
        className={cn(
          'h-[var(--tap)] w-full rounded-[6px] border border-[var(--border)] bg-[var(--field)] text-right font-mono text-[11px] leading-[1.6] text-[var(--t1)] focus:border-[var(--focus-ring)] focus:outline-none disabled:opacity-45',
          suffix ? 'pl-1.5 pr-[30px]' : 'px-1.5',
        )}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-1.5 text-[9px] leading-[1.6] text-[var(--t5)]">{suffix}</span>
      )}
    </span>
  );
}
