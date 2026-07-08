'use client';

/**
 * components/studio/PresentViewToggle.tsx — Toggle "cách xem" RIÊNG của chặng Present.
 *
 * User chốt: Concept/Render chỉ có canvas node; còn Form (nhập nhanh) và Window (dàn
 * trang tự do kiểu Figma/Canva) là 2 MẶT của Present → gộp 1 toggle, CHỈ Present mới có.
 *   - Nhập nhanh (Form): '/' + workspace=present + uiMode=form → FormSurface/PresentForm.
 *   - Dàn trang (Window): route /present-editor (slide studio).
 * Hành vi do parent quyết (onForm/onWindow) để dùng được cả ở header (có store) lẫn
 * StudioBar (điều hướng route + localStorage).
 */

import { FileText, LayoutTemplate } from 'lucide-react';

interface Props {
  current: 'form' | 'window';
  onForm: () => void;
  onWindow: () => void;
}

export default function PresentViewToggle({ current, onForm, onWindow }: Props) {
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
      <Seg on={current === 'form'} onClick={onForm} icon={<FileText size={13} />} label="Nhập nhanh" title="Nhập nhanh — chọn ảnh & nội dung (hợp cảm ứng)" />
      <Seg on={current === 'window'} onClick={onWindow} icon={<LayoutTemplate size={13} />} label="Dàn trang" title="Dàn trang — kéo-thả bố cục tự do (slide studio)" />
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
