'use client';

/**
 * components/colors/ColorAccuracyNotice.tsx — VIỆC 4: câu cảnh báo độ chính xác màu.
 *
 * ⛔ **KHÔNG CÓ NÚT TẮT. KHÔNG CÓ PROP `dismissible`. KHÔNG NHỚ "đã đọc".** Cố ý — đây là câu
 * bảo vệ cả người dùng lẫn IF (màn hình ≠ sơn thật + phủ nhận liên kết thương hiệu). Ai định
 * thêm nút ✕ cho "gọn mắt" thì đọc `lib/colors/disclaimer.ts` trước.
 *
 * Đặt cạnh MỌI nút chỉ định / xuất / đặt hàng. `variant='short'` chỉ dành cho chú thích dưới
 * bảng kết quả — màn có nút ra tiền thật PHẢI có bản đầy đủ.
 *
 * Chữ lấy từ `lib/colors/disclaimer.ts` (một nguồn chữ, còn dùng cho PDF/BOQ sau này), song ngữ
 * qua `useT` như phần còn lại của app. Màu/bo qua token ⇒ tự đúng cả 2 theme; `line-height` khai
 * rõ ≥1.5 (luật G4 — thiếu là cắt dấu tiếng Việt).
 */

import { Info } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { COLOR_ACCURACY_NOTICE, COLOR_ACCURACY_NOTICE_SHORT } from '@/lib/colors/disclaimer';

export function ColorAccuracyNotice({ variant = 'full' }: { variant?: 'full' | 'short' }) {
  const tr = useT();
  const text = variant === 'short' ? COLOR_ACCURACY_NOTICE_SHORT : COLOR_ACCURACY_NOTICE;
  return (
    <div
      role="note"
      style={{
        display: 'flex',
        gap: 8,
        alignItems: 'flex-start',
        padding: variant === 'short' ? '7px 10px' : '10px 12px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border)',
        background: 'var(--field)',
      }}
    >
      <Info size={14} strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 2, color: 'var(--t4)' }} />
      <p style={{ margin: 0, fontSize: variant === 'short' ? 11.5 : 12, lineHeight: 1.6, color: 'var(--t3)' }}>
        {tr(text.vi, text.en)}
      </p>
    </div>
  );
}
