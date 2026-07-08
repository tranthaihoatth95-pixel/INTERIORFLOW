'use client';

/**
 * components/studio/StudioBar.tsx — Thanh chuyển "không gian làm việc" dùng chung.
 *
 * Ba studio là 3 route riêng (app chính '/', dàn trang '/present-editor', chỉnh ảnh
 * '/photo-editor'). Bar này luôn hiển thị ở đầu 2 studio editor để:
 *   - LUÔN có đường về app chính (không kẹt trong route),
 *   - chuyển qua lại 3 không gian như một sản phẩm liền mạch.
 *
 * Điều hướng bằng next/link (soft nav) — mượt hơn reload cứng. Về '/' vào thẳng canvas
 * nhờ persist stageDone (xem app/page.tsx).
 */

import Link from 'next/link';
import { Workflow, LayoutTemplate, Wand2 } from 'lucide-react';

export type StudioKey = 'node' | 'present' | 'photo';

const MODES: { key: StudioKey; href: string; label: string; icon: React.ReactNode }[] = [
  { key: 'node', href: '/', label: 'Node canvas', icon: <Workflow size={15} /> },
  { key: 'present', href: '/present-editor', label: 'Dàn trang', icon: <LayoutTemplate size={15} /> },
  { key: 'photo', href: '/photo-editor', label: 'Chỉnh ảnh', icon: <Wand2 size={15} /> },
];

export default function StudioBar({ active }: { active: StudioKey }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        height: 46,
        flex: '0 0 auto',
        padding: '0 12px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--panel)',
      }}
    >
      {/* wordmark */}
      <span
        style={{
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: 1,
          color: 'var(--t2)',
          userSelect: 'none',
        }}
      >
        IF
      </span>
      <span style={{ width: 1, height: 20, background: 'var(--border)' }} />

      {/* segmented control 3 mode */}
      <div
        style={{
          display: 'flex',
          gap: 2,
          padding: 3,
          borderRadius: 10,
          background: 'var(--field)',
          border: '1px solid var(--border)',
        }}
      >
        {MODES.map((m) => {
          const on = m.key === active;
          const seg = (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 7,
                fontSize: 12.5,
                fontWeight: on ? 600 : 500,
                color: on ? 'var(--accent)' : 'var(--t3)',
                background: on ? 'var(--card)' : 'transparent',
                boxShadow: on ? '0 1px 2px rgba(0,0,0,.08)' : 'none',
                cursor: on ? 'default' : 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {m.icon}
              {m.label}
            </span>
          );
          return on ? (
            <div key={m.key} aria-current="page">
              {seg}
            </div>
          ) : (
            <Link key={m.key} href={m.href} style={{ textDecoration: 'none' }} title={`Sang ${m.label}`}>
              {seg}
            </Link>
          );
        })}
      </div>

      <div style={{ flex: 1 }} />
    </div>
  );
}
