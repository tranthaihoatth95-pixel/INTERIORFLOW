'use client';

/**
 * components/ui/LightArc.tsx — [marker: LightArc] cung tròn tiến độ dùng chung.
 *
 * - Determinate: truyền `value` 0–100 → cung stroke màu accent chạy trên track `--border`.
 *   Chỉ animate `stroke-dashoffset` (transition), KHÔNG animate opacity (luật G1 — component
 *   này hay nằm trên panel kính).
 * - Indeterminate: KHÔNG truyền `value` → cung 1/4 quay đều (animate transform rotate, không
 *   opacity) — dùng cho trạng thái "đang chạy" THẬT nhưng chưa đo được % (không bịa số).
 * - `prefers-reduced-motion`: determinate đứng yên ở đúng % (bỏ transition); indeterminate
 *   đứng yên ở cung tĩnh — khung tĩnh tương đương, chữ trạng thái bên cạnh vẫn nói rõ đang chạy.
 * - `state='warn'` → dùng `--accent-warm` (token sẵn, globals.css:26), mặc định `--accent`.
 * - Glow: drop-shadow filter trên chính đường stroke — không blur layer mới.
 */

import { useId } from 'react';

export interface LightArcProps {
  /** 0–100. Bỏ trống = indeterminate (quay đều, không hiện %). */
  value?: number;
  /** Đường kính px. Mặc định 28. */
  size?: number;
  strokeWidth?: number;
  state?: 'normal' | 'warn';
  /** Nhãn cho screen reader — mặc định "Tiến độ". */
  label?: string;
}

export default function LightArc({
  value,
  size = 28,
  strokeWidth = 3,
  state = 'normal',
  label = 'Tiến độ',
}: LightArcProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const indeterminate = value == null || !Number.isFinite(value);
  const pct = indeterminate ? 0 : Math.max(0, Math.min(100, value as number));
  const color = state === 'warn' ? 'var(--accent-warm)' : 'var(--accent)';
  // Indeterminate: cung ~28% chu vi quay đều. Determinate: dashoffset theo %.
  const dashOffset = indeterminate ? c * 0.72 : c * (1 - pct / 100);
  const spinName = `ifla-spin-${uid}`;

  return (
    <span
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      {...(indeterminate ? {} : { 'aria-valuenow': Math.round(pct) })}
      style={{ display: 'inline-flex', width: size, height: size, flex: 'none' }}
    >
      {/* keyframes cục bộ theo instance — không đụng globals.css, tự tắt khi reduce-motion */}
      <style>{`
        @keyframes ${spinName} { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) {
          .ifla-${uid} { animation: none !important; transition: none !important; }
        }
      `}</style>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ display: 'block', overflow: 'visible' }}
        aria-hidden
      >
        {/* track nền */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
        />
        {/* cung tiến độ — bắt đầu từ 12h (rotate -90 quanh tâm). Glow = drop-shadow trên chính
            stroke, rất nhẹ, không tạo blur layer mới. */}
        <g
          className={`ifla-${uid}`}
          style={{
            transformOrigin: '50% 50%',
            ...(indeterminate ? { animation: `${spinName} 1.1s linear infinite` } : {}),
          }}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            className={`ifla-${uid}`}
            style={{
              filter: `drop-shadow(0 0 ${Math.max(2, strokeWidth)}px ${color})`,
              // determinate: chỉ dashoffset chuyển động (luật G1 — không opacity)
              transition: indeterminate ? undefined : 'stroke-dashoffset 320ms var(--ease-apple, ease)',
            }}
          />
        </g>
      </svg>
    </span>
  );
}
