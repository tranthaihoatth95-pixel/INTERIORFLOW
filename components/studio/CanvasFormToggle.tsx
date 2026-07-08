'use client';

/**
 * components/studio/CanvasFormToggle.tsx — Toggle cách xem của Concept/Render:
 * Canvas (node-graph, desktop) ↔ Form (biểu mẫu cảm ứng, hợp điện thoại/foldable).
 *
 * Ở chặng Present dùng PresentViewToggle (Nhập nhanh/Dàn trang) thay cho toggle này.
 * Cùng phong cách segmented với StageSwitcher để header đồng nhất.
 */

import { LayoutGrid, Rows3 } from 'lucide-react';

interface Props {
  current: 'node' | 'form';
  onPick: (m: 'node' | 'form') => void;
}

export default function CanvasFormToggle({ current, onPick }: Props) {
  return (
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
      <Seg on={current === 'node'} onClick={() => onPick('node')} icon={<LayoutGrid size={13} />} label="Canvas" title="Canvas node — kéo-nối (desktop)" />
      <Seg on={current === 'form'} onClick={() => onPick('form')} icon={<Rows3 size={13} />} label="Form" title="Form — biểu mẫu cảm ứng (điện thoại / màn gập)" />
    </div>
  );
}

function Seg({
  on,
  onClick,
  icon,
  label,
  title,
}: {
  on: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        borderRadius: 7,
        border: 'none',
        fontSize: 12.5,
        fontWeight: on ? 600 : 500,
        color: on ? 'var(--t1)' : 'var(--t4)',
        background: on ? 'var(--card)' : 'transparent',
        boxShadow: on ? '0 1px 2px rgba(0,0,0,.08)' : 'none',
        cursor: on ? 'default' : 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {icon} {label}
    </button>
  );
}
