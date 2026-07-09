'use client';

/**
 * components/present-editor/LayerPanel.tsx — Ô QUẢN LÝ LAYER (góp ý #4 & #7).
 *
 * Danh sách element của slide theo thứ tự z (TRÊN CÙNG hiển thị đầu bảng). Mỗi dòng:
 *   - ẩn/hiện (mắt), khoá/mở (ổ khoá), đổi tên (double-click), chọn (click),
 *   - kéo dòng để đổi thứ tự z (kéo lên = đưa lên trước).
 *
 * Model có `hidden`/`locked`/`name`. Đổi z = sắp lại mảng elements (dưới→trên). Vì bảng
 * hiển thị NGƯỢC (trên cùng đầu bảng) nên map chỉ số cẩn thận khi reorder.
 */

import { useState } from 'react';
import type { SlideElement } from '@/lib/present-editor/model';
import { Eye, EyeOff, Lock, Unlock, Type, Image as ImageIcon, Square, GripVertical } from 'lucide-react';

interface Props {
  elements: SlideElement[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  onToggleHidden: (id: string) => void;
  onToggleLocked: (id: string) => void;
  onRename: (id: string, name: string) => void;
  /** reorder theo INDEX trong mảng gốc (dưới→trên): chuyển element từ from → to. */
  onReorder: (fromIndex: number, toIndex: number) => void;
}

export default function LayerPanel({
  elements,
  selectedIds,
  onSelect,
  onToggleHidden,
  onToggleLocked,
  onRename,
  onReorder,
}: Props) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  // Hiển thị TRÊN CÙNG ở đầu bảng → duyệt ngược mảng gốc. Giữ index gốc để reorder.
  const rows = elements.map((el, i) => ({ el, i })).reverse();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {rows.length === 0 && (
        <p style={{ fontSize: 11, color: 'var(--t4)', margin: '2px 0' }}>Slide chưa có phần tử.</p>
      )}
      {rows.map(({ el, i }) => {
        const selected = selectedIds.includes(el.id);
        const isOver = overIdx === i && dragIdx !== null && dragIdx !== i;
        return (
          <div
            key={el.id}
            className={`pe-layer-row${dragIdx === i ? ' dragging' : ''}`}
            draggable
            onDragStart={() => setDragIdx(i)}
            onDragOver={(e) => {
              e.preventDefault();
              setOverIdx(i);
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (dragIdx !== null && dragIdx !== i) onReorder(dragIdx, i);
              setDragIdx(null);
              setOverIdx(null);
            }}
            onDragEnd={() => {
              setDragIdx(null);
              setOverIdx(null);
            }}
            onClick={() => onSelect(el.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '5px 6px',
              borderRadius: 7,
              border: selected ? '1px solid var(--accent)' : '1px solid transparent',
              background: selected ? 'var(--accent-soft)' : isOver ? 'var(--hover)' : 'transparent',
              cursor: 'pointer',
              opacity: el.hidden ? 0.55 : 1,
            }}
          >
            <GripVertical size={12} style={{ color: 'var(--t4)', cursor: 'grab', flexShrink: 0 }} />
            <KindIcon kind={el.kind} />
            {editing === el.id ? (
              <input
                autoFocus
                defaultValue={displayName(el)}
                onBlur={(e) => {
                  onRename(el.id, e.target.value.trim());
                  setEditing(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                  if (e.key === 'Escape') setEditing(null);
                }}
                onClick={(e) => e.stopPropagation()}
                style={nameInput}
              />
            ) : (
              <span
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setEditing(el.id);
                }}
                title="Nhấp đúp để đổi tên"
                style={{
                  flex: 1,
                  fontSize: 11.5,
                  color: selected ? 'var(--accent)' : 'var(--t2)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {displayName(el)}
              </span>
            )}
            <div className="pe-layer-actions" style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
              <IconBtn
                title={el.hidden ? 'Hiện' : 'Ẩn'}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleHidden(el.id);
                }}
              >
                {el.hidden ? <EyeOff size={12} /> : <Eye size={12} />}
              </IconBtn>
              <IconBtn
                title={el.locked ? 'Mở khoá' : 'Khoá'}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLocked(el.id);
                }}
              >
                {el.locked ? <Lock size={12} /> : <Unlock size={12} />}
              </IconBtn>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KindIcon({ kind }: { kind: SlideElement['kind'] }) {
  const c = 'var(--t3)';
  if (kind === 'text') return <Type size={12} style={{ color: c, flexShrink: 0 }} />;
  if (kind === 'image') return <ImageIcon size={12} style={{ color: c, flexShrink: 0 }} />;
  return <Square size={12} style={{ color: c, flexShrink: 0 }} />;
}

function displayName(el: SlideElement): string {
  if (el.name) return el.name;
  if (el.kind === 'text') return (el.text || 'Chữ').split('\n')[0].slice(0, 24) || 'Chữ';
  if (el.kind === 'image') return 'Ảnh';
  return { rect: 'Chữ nhật', ellipse: 'Elip', line: 'Đường', triangle: 'Tam giác', polygon: 'Đa giác', arrow: 'Mũi tên' }[
    el.shape
  ];
}

function IconBtn({ children, onClick, title }: { children: React.ReactNode; onClick: (e: React.MouseEvent) => void; title: string }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        width: 22,
        height: 22,
        display: 'grid',
        placeItems: 'center',
        borderRadius: 5,
        border: 'none',
        background: 'transparent',
        color: 'var(--t3)',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

const nameInput: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  padding: '2px 5px',
  borderRadius: 5,
  border: '1px solid var(--accent)',
  background: 'var(--field)',
  color: 'var(--t1)',
  fontSize: 11.5,
};
