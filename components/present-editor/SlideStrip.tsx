'use client';

/**
 * components/present-editor/SlideStrip.tsx — Dải thumbnail nhiều slide.
 * Thêm / xoá / nhân bản / đổi thứ tự (mũi tên) + chọn slide hiện tại.
 */

import type { EditorDeck } from '@/lib/present-editor/model';
import { Plus, Copy, Trash2, ChevronUp, ChevronDown } from 'lucide-react';

interface Props {
  deck: EditorDeck;
  current: number;
  onSelect: (i: number) => void;
  onAdd: () => void;
  onDuplicate: (i: number) => void;
  onDelete: (i: number) => void;
  onMove: (i: number, dir: -1 | 1) => void;
}

export default function SlideStrip({
  deck,
  current,
  onSelect,
  onAdd,
  onDuplicate,
  onDelete,
  onMove,
}: Props) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        overflowX: 'auto',
        padding: '10px 12px',
        borderTop: '1px solid var(--border)',
        background: 'var(--panel)',
        alignItems: 'stretch',
      }}
    >
      {deck.slides.map((s, i) => (
        <div key={s.id} style={{ flex: '0 0 auto', width: 150 }}>
          <button
            type="button"
            onClick={() => onSelect(i)}
            style={{
              width: '100%',
              aspectRatio: '16 / 9',
              borderRadius: 6,
              border: i === current ? '2px solid var(--accent)' : '1px solid var(--border)',
              background: s.background,
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
              backgroundImage: s.backgroundImage ? `url("${s.backgroundImage}")` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            title={`Slide ${i + 1}`}
          >
            {/* mini preview element chữ */}
            {s.elements
              .filter((e) => e.kind === 'text')
              .slice(0, 2)
              .map((e) => (
                <div
                  key={e.id}
                  style={{
                    position: 'absolute',
                    left: `${e.frame.x}%`,
                    top: `${e.frame.y}%`,
                    width: `${e.frame.w}%`,
                    height: 3,
                    background: 'currentColor',
                    color: (e as { color?: string }).color ?? '#000',
                    opacity: 0.5,
                    borderRadius: 2,
                  }}
                />
              ))}
            <span
              style={{
                position: 'absolute',
                left: 4,
                top: 4,
                fontSize: 10,
                padding: '1px 5px',
                borderRadius: 4,
                background: 'rgba(0,0,0,.55)',
                color: '#fff',
              }}
            >
              {i + 1}
            </span>
          </button>
          <div style={{ display: 'flex', gap: 4, marginTop: 4, justifyContent: 'center' }}>
            <IconBtn title="Lên" onClick={() => onMove(i, -1)} disabled={i === 0}>
              <ChevronUp size={13} />
            </IconBtn>
            <IconBtn title="Xuống" onClick={() => onMove(i, 1)} disabled={i === deck.slides.length - 1}>
              <ChevronDown size={13} />
            </IconBtn>
            <IconBtn title="Nhân bản" onClick={() => onDuplicate(i)}>
              <Copy size={13} />
            </IconBtn>
            <IconBtn
              title="Xoá"
              onClick={() => onDelete(i)}
              disabled={deck.slides.length <= 1}
            >
              <Trash2 size={13} />
            </IconBtn>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={onAdd}
        title="Thêm slide"
        style={{
          flex: '0 0 auto',
          width: 150,
          aspectRatio: '16 / 9',
          borderRadius: 6,
          border: '1px dashed var(--border-strong)',
          background: 'var(--card)',
          color: 'var(--t3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          cursor: 'pointer',
          fontSize: 13,
        }}
      >
        <Plus size={16} /> Thêm slide
      </button>
    </div>
  );
}

function IconBtn({
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
        width: 24,
        height: 24,
        display: 'grid',
        placeItems: 'center',
        borderRadius: 5,
        border: '1px solid var(--border)',
        background: 'var(--field)',
        color: 'var(--t2)',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.35 : 1,
      }}
    >
      {children}
    </button>
  );
}
