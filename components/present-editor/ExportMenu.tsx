'use client';

/**
 * components/present-editor/ExportMenu.tsx — Nút "Export" gộp (góp ý #7).
 *
 * Gom PDF · PowerPoint (.pptx) · Ảnh PNG vào 1 menu chọn định dạng thay vì nhiều nút rời.
 * Bấm 1 định dạng → gọi handler tương ứng (đóng menu). Đang xuất → hiện nhãn "Đang xuất…".
 */

import { useEffect, useRef, useState } from 'react';
import { Download, FileDown, FileText, Image as ImageIcon, ChevronDown } from 'lucide-react';

interface Props {
  onExportPdf: () => void;
  onExportPptx: () => void;
  onExportPng: () => void;
  busy: string | null;
}

export default function ExportMenu({ onExportPdf, onExportPptx, onExportPng, busy }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const label = busy === 'pdf' ? 'Đang xuất PDF…' : busy === 'pptx' ? 'Đang xuất PPTX…' : busy === 'png' ? 'Đang xuất PNG…' : 'Export';

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={!!busy}
        title="Xuất file: PDF · PowerPoint · Ảnh PNG"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 12px',
          borderRadius: 8,
          fontSize: 13,
          cursor: busy ? 'default' : 'pointer',
          border: '1px solid var(--accent)',
          background: 'var(--accent)',
          color: '#fff',
          opacity: busy ? 0.6 : 1,
        }}
      >
        <Download size={15} /> {label}
        <ChevronDown size={13} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            zIndex: 30,
            minWidth: 210,
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: 5,
            boxShadow: '0 10px 30px rgba(0,0,0,.35)',
          }}
        >
          <Item icon={<FileDown size={15} />} title="PDF" sub="1:1 với editor (WYSIWYG)" onClick={() => { setOpen(false); onExportPdf(); }} />
          <Item icon={<FileText size={15} />} title="PowerPoint (.pptx)" sub="Chữ còn chỉnh được trong PPT" onClick={() => { setOpen(false); onExportPptx(); }} />
          <Item icon={<ImageIcon size={15} />} title="Ảnh PNG" sub="Mỗi slide 1 ảnh, tải lần lượt" onClick={() => { setOpen(false); onExportPng(); }} />
        </div>
      )}
    </div>
  );
}

function Item({ icon, title, sub, onClick }: { icon: React.ReactNode; title: string; sub: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '9px 10px',
        borderRadius: 7,
        border: 'none',
        background: 'transparent',
        color: 'var(--t2)',
        cursor: 'pointer',
        textAlign: 'left',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--field)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <span style={{ color: 'var(--accent)', display: 'grid', placeItems: 'center' }}>{icon}</span>
      <span style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 13, color: 'var(--t1)' }}>{title}</span>
        <span style={{ fontSize: 10.5, color: 'var(--t4)' }}>{sub}</span>
      </span>
    </button>
  );
}
