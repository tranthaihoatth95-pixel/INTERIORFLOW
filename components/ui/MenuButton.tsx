'use client';

/**
 * components/ui/MenuButton.tsx — nút xổ menu dùng chung (không phải Nhập/Xuất — cái đó là
 * components/ui/IOMenu.tsx, xây cùng ngôn ngữ thị giác).
 *
 * Dùng để GOM NHÓM toolbar thay vì bày hết nút ngang hàng (yêu cầu user 19/07: "toolbar tràn
 * ngang, rối mắt"). Mỗi nhóm = 1 nút + 1 menu xổ; item nào đang bật (panel đang mở) thì hiện
 * chấm nhấn, và nút nhóm cũng sáng lên để user biết trong nhóm đang có thứ đang bật.
 *
 * Ngôn ngữ thiết kế: keyline 1px mảnh, bo góc gần vuông, nền var(--panel)/var(--field).
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

export interface MenuItemSpec {
  id: string;
  label: string;
  sub?: string;
  icon?: ReactNode;
  onSelect: () => void;
  /** panel/chế độ tương ứng đang bật — hiện chấm nhấn bên phải. */
  active?: boolean;
  disabled?: boolean;
  disabledReason?: string;
}

interface Props {
  label: string;
  icon?: ReactNode;
  items: MenuItemSpec[];
  align?: 'left' | 'right';
  size?: 'sm' | 'md';
  title?: string;
}

export default function MenuButton({ label, icon, items, align = 'left', size = 'sm', title }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const anyActive = items.some((i) => i.active);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open]);

  const pad = size === 'md' ? '8px 12px' : '5px 10px';
  const fontSize = size === 'md' ? 13 : 12;

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={title ?? label}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: pad,
          borderRadius: 8,
          fontSize,
          cursor: 'pointer',
          border: `1px solid ${anyActive ? 'var(--accent)' : 'var(--border)'}`,
          background: anyActive ? 'color-mix(in srgb, var(--accent) 14%, var(--field))' : 'var(--field)',
          color: anyActive ? 'var(--t1)' : 'var(--t2)',
          whiteSpace: 'nowrap',
        }}
      >
        {icon}
        {label}
        <ChevronDown
          size={size === 'md' ? 13 : 12}
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}
        />
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            [align]: 0,
            zIndex: 40,
            minWidth: 246,
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: 5,
            boxShadow: '0 10px 30px rgba(0,0,0,.28)',
          }}
        >
          {items.map((it) => (
            <Row key={it.id} item={it} onDone={() => setOpen(false)} />
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ item, onDone }: { item: MenuItemSpec; onDone: () => void }) {
  const [hover, setHover] = useState(false);
  const dim = !!item.disabled;
  return (
    <button
      type="button"
      role="menuitem"
      disabled={dim}
      title={dim ? item.disabledReason ?? 'Chưa khả dụng' : item.sub ?? item.label}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => {
        if (dim) return;
        onDone();
        item.onSelect();
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '9px 10px',
        borderRadius: 7,
        border: 'none',
        background: hover && !dim ? 'var(--field)' : 'transparent',
        color: dim ? 'var(--t3)' : 'var(--t2)',
        cursor: dim ? 'not-allowed' : 'pointer',
        textAlign: 'left',
        opacity: dim ? 0.55 : 1,
      }}
    >
      {item.icon && <span style={{ display: 'grid', placeItems: 'center', flexShrink: 0 }}>{item.icon}</span>}
      <span style={{ minWidth: 0, flex: 1 }}>
        <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: dim ? 'var(--t3)' : 'var(--t1)' }}>
          {item.label}
        </span>
        {(dim ? item.disabledReason ?? item.sub : item.sub) && (
          <span style={{ display: 'block', fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>
            {dim ? item.disabledReason ?? item.sub : item.sub}
          </span>
        )}
      </span>
      {item.active && (
        <span
          aria-hidden
          style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--accent)', flexShrink: 0 }}
        />
      )}
    </button>
  );
}
