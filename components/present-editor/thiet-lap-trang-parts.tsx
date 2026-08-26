'use client';

/**
 * components/present-editor/thiet-lap-trang-parts.tsx — mảnh dùng CHUNG cho hai bề mặt Thiết lập
 * trang (NHANH bên cạnh · ĐẦY ĐỦ toàn không gian).
 *
 * ⛔ Vì sao tách file: tách vai làm hai bề mặt thì hai bên đều cần `Muc`/`Chip`/ô nhập. Chép sang
 * cả hai là đẻ nguồn thứ hai — đúng thứ luật cấm. Một chỗ khai, hai bề mặt gọi.
 *
 * 🔴 VẬT LIỆU: mọi mảnh ở đây là BIỂU MẪU KỸ THUẬT ⇒ nền ĐẶC (`--card`/`--panel`), không kính,
 * không lớp bán trong suốt. Sắc nhấn (`color-mix`) chỉ tô TRÊN nền đặc, không phải lớp kính.
 */

import type { CSSProperties } from 'react';

export const MONO = 'ui-monospace, Menlo, monospace';

export function Muc({ nhan, children }: { nhan: string; children: React.ReactNode }) {
  return (
    <section>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '.06em',
          textTransform: 'uppercase',
          color: 'var(--t3)',
          marginBottom: 6,
        }}
      >
        {nhan}
      </div>
      {children}
    </section>
  );
}

export function HangNut({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>{children}</div>;
}

export function Chip({
  chon,
  onClick,
  children,
}: {
  chon: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={chon}
      style={{
        padding: '5px 10px',
        minHeight: 'var(--tap, 32px)',
        borderRadius: 'var(--r-2)',
        border: `1px solid ${chon ? 'var(--accent)' : 'var(--vien-mo)'}`,
        background: chon ? 'color-mix(in srgb, var(--accent) 16%, transparent)' : 'var(--card)',
        color: chon ? 'var(--t1)' : 'var(--t2)',
        fontSize: 11,
        fontWeight: chon ? 600 : 500,
        fontFamily: MONO,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

export function Ghi({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 5, fontFamily: MONO, fontSize: 10, color: 'var(--t3)' }}>{children}</div>
  );
}

export const oNhap: CSSProperties = {
  width: 56,
  padding: '4px 6px',
  borderRadius: 'var(--r-2)',
  border: '1px solid var(--vien-mo)',
  background: 'var(--bg)',
  color: 'var(--t1)',
  fontFamily: MONO,
  fontSize: 11,
};

export function OKhungTen({
  nhan,
  gt,
  doi,
}: {
  nhan: string;
  gt: string;
  doi: (v: string) => void;
}) {
  return (
    <label style={{ display: 'grid', gap: 3 }}>
      <span style={{ fontSize: 10, color: 'var(--t3)' }}>{nhan}</span>
      <input value={gt} onChange={(e) => doi(e.target.value)} style={{ ...oNhap, width: '100%' }} placeholder="—" />
    </label>
  );
}
