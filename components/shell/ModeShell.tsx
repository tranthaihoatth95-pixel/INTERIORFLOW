'use client';

/**
 * components/shell/ModeShell.tsx — H1 (`docs/TICKET-UI-HATANG-2026-08-02.md`,
 * `docs/SPEC-MODE-PER-STAGE.md` §1): khung chuyển mode DÙNG CHUNG — thanh chọn mode (segmented
 * control, cùng ngôn ngữ hình `ModeSwitch` của CadToolbar.tsx) + đổi TOÀN BỘ nội dung bên dưới
 * theo mode đang chọn (không phải hiện/ẩn thêm nút trong 1 layout cố định).
 *
 * `content` là hàm (mode) => ReactNode — nơi gọi tự quyết định layout cho TỪNG mode (kể cả khác
 * hẳn nhau về cấu trúc DOM, không bị ép chung 1 khung). Component này CHỈ lo phần "vỏ chọn mode +
 * chỗ trống hiện nội dung", không biết gì về nội dung từng mode.
 */

import type { ReactNode } from 'react';

export interface ModeOption<M extends string> {
  value: M;
  label: string;
}

export interface ModeShellProps<M extends string> {
  modes: ModeOption<M>[];
  active: M;
  onChange: (m: M) => void;
  /** nội dung ĐÚNG mode đang chọn — hàm để nơi gọi lazy-tính, không dựng cả 2 nhánh cùng lúc. */
  content: (mode: M) => ReactNode;
  /** hiện cạnh thanh chọn mode (vd nút "Mở canvas", badge trạng thái) — tuỳ chọn. */
  toolbarExtra?: ReactNode;
  /** neo thanh chọn mode trên/dưới — mặc định 'top'. Render dùng 'bottom' vì 'top' đang bị
   * `RenderToolTabs` (D3) chiếm gần hết bề rộng — xem RenderToolModeOverlay.tsx. */
  barPosition?: 'top' | 'bottom';
  className?: string;
}

export default function ModeShell<M extends string>({ modes, active, onChange, content, toolbarExtra, barPosition = 'top', className }: ModeShellProps<M>) {
  return (
    <div className={className} style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div
        style={{
          position: 'absolute',
          ...(barPosition === 'top' ? { top: 12 } : { bottom: 12 }),
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 33,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div
          style={{
            display: 'flex',
            background: 'color-mix(in srgb, var(--panel) 92%, transparent)',
            backdropFilter: 'blur(14px)',
            border: '1px solid var(--border)',
            borderRadius: 999,
            padding: 2,
            gap: 1,
            boxShadow: '0 8px 24px rgba(0,0,0,.14)',
          }}
        >
          {modes.map((m) => {
            const isActive = m.value === active;
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => onChange(m.value)}
                aria-pressed={isActive}
                style={{
                  appearance: 'none',
                  border: isActive ? '1px solid var(--accent-ring)' : '1px solid transparent',
                  background: isActive ? 'var(--accent-soft)' : 'transparent',
                  color: isActive ? 'var(--accent)' : 'var(--t2)',
                  fontSize: 12,
                  fontWeight: 650,
                  height: 30,
                  padding: '0 14px',
                  borderRadius: 999,
                  cursor: 'pointer',
                }}
              >
                {m.label}
              </button>
            );
          })}
        </div>
        {toolbarExtra}
      </div>
      <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>{content(active)}</div>
    </div>
  );
}
