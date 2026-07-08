'use client';

/**
 * components/present-editor/Toolbar.tsx — Thanh công cụ trên cùng.
 * Thêm chữ / ảnh / hình, mở template, undo/redo, xuất PDF & PPTX.
 */

import { useRef, useState } from 'react';
import {
  ArrowLeft,
  Type,
  Image as ImageIcon,
  Square,
  Circle,
  Minus,
  LayoutTemplate,
  Undo2,
  Redo2,
  FileDown,
  FileText,
} from 'lucide-react';
import type { ShapeKind } from '@/lib/present-editor/model';

interface Props {
  onAddText: () => void;
  onAddImageUrl: (src: string) => void;
  onAddShape: (shape: ShapeKind) => void;
  onToggleTemplates: () => void;
  templatesOpen: boolean;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onExportPdf: () => void;
  onExportPptx: () => void;
  busy: string | null;
}

export default function Toolbar(p: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [libOpen, setLibOpen] = useState(false);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => p.onAddImageUrl(String(reader.result));
    reader.readAsDataURL(f);
    e.target.value = '';
  }

  // Thoát Canva mode: quay lại trang trước, không có lịch sử thì về app chính '/'.
  function onBack() {
    if (typeof window === 'undefined') return;
    if (window.history.length > 1) window.history.back();
    else window.location.href = '/';
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 12px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--panel)',
        flexWrap: 'wrap',
      }}
    >
      <Btn onClick={onBack} title="Quay lại app chính">
        <ArrowLeft size={15} /> Quay lại
      </Btn>
      <Divider />
      <Btn onClick={p.onAddText} title="Thêm chữ">
        <Type size={15} /> Chữ
      </Btn>
      <Btn onClick={() => fileRef.current?.click()} title="Thêm ảnh (tải lên)">
        <ImageIcon size={15} /> Ảnh
      </Btn>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />

      <Divider />
      <IconOnly onClick={() => p.onAddShape('rect')} title="Hình chữ nhật">
        <Square size={15} />
      </IconOnly>
      <IconOnly onClick={() => p.onAddShape('ellipse')} title="Hình elip">
        <Circle size={15} />
      </IconOnly>
      <IconOnly onClick={() => p.onAddShape('line')} title="Đường thẳng">
        <Minus size={15} />
      </IconOnly>

      <Divider />
      <Btn onClick={p.onToggleTemplates} active={p.templatesOpen} title="Chọn mẫu bố cục">
        <LayoutTemplate size={15} /> Mẫu
      </Btn>

      <Divider />
      <IconOnly onClick={p.onUndo} title="Hoàn tác" disabled={!p.canUndo}>
        <Undo2 size={15} />
      </IconOnly>
      <IconOnly onClick={p.onRedo} title="Làm lại" disabled={!p.canRedo}>
        <Redo2 size={15} />
      </IconOnly>

      <div style={{ flex: 1 }} />

      <Btn onClick={p.onExportPdf} title="Xuất PDF" disabled={!!p.busy}>
        <FileDown size={15} /> {p.busy === 'pdf' ? 'Đang xuất…' : 'PDF'}
      </Btn>
      <Btn onClick={p.onExportPptx} title="Xuất PowerPoint (.pptx)" disabled={!!p.busy} primary>
        <FileText size={15} /> {p.busy === 'pptx' ? 'Đang xuất…' : 'PowerPoint'}
      </Btn>

      {/* nút ẩn giữ chỗ cho lib open state (tránh unused) */}
      {libOpen && <span hidden onClick={() => setLibOpen(false)} />}
    </div>
  );
}

function Btn({
  children,
  onClick,
  title,
  active,
  primary,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  active?: boolean;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 12px',
        borderRadius: 8,
        fontSize: 13,
        cursor: disabled ? 'default' : 'pointer',
        border: primary ? '1px solid var(--accent)' : '1px solid var(--border)',
        background: primary
          ? 'var(--accent)'
          : active
            ? 'var(--accent-soft)'
            : 'var(--field)',
        color: primary ? '#fff' : active ? 'var(--accent)' : 'var(--t2)',
        opacity: disabled ? 0.45 : 1,
      }}
    >
      {children}
    </button>
  );
}

function IconOnly({
  children,
  onClick,
  title,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 38,
        height: 36,
        display: 'grid',
        placeItems: 'center',
        borderRadius: 8,
        border: '1px solid var(--border)',
        background: 'var(--field)',
        color: 'var(--t2)',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span style={{ width: 1, height: 22, background: 'var(--border)', margin: '0 3px' }} />;
}
