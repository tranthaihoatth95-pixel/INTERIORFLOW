'use client';

/**
 * components/ui/EmptyState.tsx — KHUÔN MÀN TRỐNG dùng chung (P5, 04/08).
 *
 * Rút từ mock đã duyệt `docs/mocks/mock-if-thu-vien-trong.html`: màn trống KHÔNG phải khoảng
 * trắng — vẫn hiện CẤU TRÚC THẬT nơi đồ sẽ nằm (ngăn kệ nét đứt + bóng lõm kiểu kệ gỗ / hàng
 * bảng ghost), kèm tối đa 2 nút LÀM ĐƯỢC VIỆC TẠI CHỖ.
 *
 * ⛔ Luật (theo phiếu P5 + luật X2 trong 00-CHOT):
 *   - CẤM đá người dùng sang màn khác rồi bảo quay lại ("sang chặng 2D vẽ rồi quay lại" = sai).
 *     Action của EmptyState phải làm được việc NGAY TẠI MÀN NÀY (mở dialog, mở file picker,
 *     tải mẫu…). Không có việc tại chỗ thật → truyền action `disabled` KÈM `disabledReason`
 *     (luật §9 — cấm nút giả, cấm giấu ô trống).
 *   - Màu/bo/bóng qua token theme (--field · --border · --t1..t5 · --accent · --radius-sm/md) —
 *     tự đúng cả 2 theme.
 *
 * Ghost structure: `ghost="bays"` = lưới ngăn kệ 4:3 nét đứt (mock Thư viện) · `ghost="rows"` =
 * 3 hàng bảng ghost (bảng vật liệu/BOQ) · `ghost="none"` = chỉ icon+chữ+nút (panel hẹp).
 */

import type { ReactNode, CSSProperties } from 'react';

export interface EmptyStateAction {
  label: string;
  /** Việc làm được NGAY TẠI CHỖ — mở dialog/picker/tải mẫu. KHÔNG điều hướng sang màn khác. */
  onClick?: () => void;
  primary?: boolean;
  icon?: ReactNode;
  /** dòng phụ nhỏ dưới nhãn (vd "hoặc kéo thả vào đây"). */
  hint?: string;
  disabled?: boolean;
  /** BẮT BUỘC khi disabled — lý do tại chỗ, hiện ở title (luật §9: cấm nút giả không lý do). */
  disabledReason?: string;
}

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  desc?: string;
  actions?: EmptyStateAction[];
  ghost?: 'bays' | 'rows' | 'none';
  /** số ngăn ghost khi ghost="bays" (mặc định 10 = 2 hàng × 5). */
  bayCount?: number;
  /** nhãn mờ trong vài ngăn đầu (vd ['bàn','ghế','sofa']) — cho thấy kệ sẽ đựng GÌ. */
  bayCaptions?: string[];
  /** gọn cho panel hẹp (padding nhỏ, ghost thu lại). */
  compact?: boolean;
  style?: CSSProperties;
}

const dashedBox: CSSProperties = {
  border: '1px dashed var(--border-strong)',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--field)',
};

export function EmptyState({
  icon,
  title,
  desc,
  actions = [],
  ghost = 'none',
  bayCount = 10,
  bayCaptions = [],
  compact = false,
  style,
}: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
        padding: compact ? '18px 14px' : '28px 26px', gap: 0, minWidth: 0, ...style,
      }}
    >
      {/* ── cấu trúc thật: kệ có ngăn (mock .shelf/.bays) hoặc hàng bảng ghost ── */}
      {ghost === 'bays' && (
        <div
          aria-hidden
          style={{
            position: 'relative', width: '100%', maxWidth: 560, padding: '12px 12px 16px',
            borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
            background: 'linear-gradient(180deg, var(--field), transparent)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,.18)', marginBottom: 18,
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${compact ? 2 : 5}, 1fr)`, gap: 8 }}>
            {Array.from({ length: bayCount }, (_, i) => (
              <div
                key={i}
                style={{
                  ...dashedBox, aspectRatio: '4 / 3', display: 'grid', placeItems: 'center',
                  background: 'transparent',
                }}
              >
                <span style={{ fontSize: 9, lineHeight: 1.5, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--t5)' }}>
                  {bayCaptions[i] ?? 'trống'}
                </span>
              </div>
            ))}
          </div>
          {/* mép kệ dưới — bóng mờ giả gỗ, đúng mock .shelf::after */}
          <div style={{ position: 'absolute', left: 10, right: 10, bottom: 5, height: 5, borderRadius: 3, background: 'linear-gradient(180deg, var(--border-strong), transparent)', opacity: 0.6 }} />
        </div>
      )}
      {ghost === 'rows' && (
        <div aria-hidden style={{ width: '100%', maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 18 }}>
          {[0.9, 0.65, 0.4].map((op, i) => (
            <div key={i} style={{ ...dashedBox, height: compact ? 22 : 28, opacity: op }} />
          ))}
        </div>
      )}

      {icon && (
        <div
          style={{
            width: 44, height: 44, display: 'grid', placeItems: 'center', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-strong)', background: 'var(--field)', color: 'var(--t4)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,.14)', marginBottom: 12,
          }}
        >
          {icon}
        </div>
      )}

      <p style={{ margin: 0, fontSize: 'var(--fs-sm)', fontWeight: 'var(--fw-semi)' as never, color: 'var(--t1)', lineHeight: 1.5 }}>
        {title}
      </p>
      {desc && (
        <p style={{ margin: '5px 0 0', maxWidth: 420, fontSize: 'var(--fs-2xs)', color: 'var(--t4)', lineHeight: 1.65, textWrap: 'pretty' as never }}>
          {desc}
        </p>
      )}

      {actions.length > 0 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 14 }}>
          {actions.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={a.disabled ? undefined : a.onClick}
              disabled={a.disabled}
              title={a.disabled ? a.disabledReason : a.hint}
              style={{
                height: 32, padding: '0 14px', borderRadius: 999,
                display: 'inline-flex', alignItems: 'center', gap: 6,
                cursor: a.disabled ? 'not-allowed' : 'pointer',
                opacity: a.disabled ? 0.45 : 1,
                fontSize: 'var(--fs-2xs)', fontWeight: 'var(--fw-semi)' as never, lineHeight: 1.5,
                border: a.primary ? '1px solid var(--accent)' : '1px solid var(--border-strong)',
                background: a.primary ? 'var(--accent)' : 'var(--field)',
                color: a.primary ? '#fff' : 'var(--t1)',
              }}
            >
              {a.icon}
              {a.label}
              {a.hint && !a.disabled && (
                <small style={{ fontWeight: 400, opacity: 0.75 }}>{a.hint}</small>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
