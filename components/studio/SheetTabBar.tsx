'use client';

/**
 * components/studio/SheetTabBar.tsx — Thanh TAB nhiều SHEET dùng CHUNG cho chặng CAD & Present.
 *
 * Thuần presentational (parent quyết hành vi): mô hình "mỗi tab = một tài liệu độc lập" (Excel),
 * kéo tab để sắp xếp (VS Code/Figma). KHÔNG tự bind phím tắt cấp window → không đụng listener của
 * editor bên dưới.
 *
 * - Click tab: chọn. Double-click: đổi tên tại chỗ (Enter/blur lưu, Esc huỷ).
 * - Nút "+": thêm sheet; ẩn khi đạt `max`.
 * - Nút "×": đóng; ẩn khi chỉ còn 1 sheet.
 * - Kéo-thả tab trái/phải: onReorder(from, to). (Kéo-gộp single-window = pha 2, xem docs/MULTI-SHEET-PROPOSAL.md.)
 */

import { useEffect, useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';

export interface SheetTab {
  id: string;
  name: string;
}

interface Props {
  sheets: SheetTab[];
  activeId: string;
  /** số sheet tối đa (giai đoạn đầu = 5). */
  max: number;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onRename: (id: string, name: string) => void;
  onClose: (id: string) => void;
  /** kéo sắp xếp: di sheet ở vị trí `from` tới `to`. */
  onReorder: (from: number, to: number) => void;
  /** nhãn nút thêm (tooltip). */
  addLabel?: string;
}

export default function SheetTabBar({
  sheets,
  activeId,
  max,
  onSelect,
  onAdd,
  onRename,
  onClose,
  onReorder,
  addLabel = 'Thêm sheet',
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const startRename = (t: SheetTab) => {
    setEditingId(t.id);
    setDraft(t.name);
  };
  const commitRename = () => {
    if (editingId) {
      const name = draft.trim();
      if (name) onRename(editingId, name);
    }
    setEditingId(null);
  };

  const canAdd = sheets.length < max;
  const canClose = sheets.length > 1;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        height: 36,
        flex: '0 0 auto',
        padding: '0 8px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg)',
        overflowX: 'auto',
      }}
    >
      {sheets.map((t, i) => {
        const on = t.id === activeId;
        const isOver = overIdx === i && dragIdx !== null && dragIdx !== i;
        return (
          <div
            key={t.id}
            draggable={editingId !== t.id}
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
            onClick={() => t.id !== activeId && onSelect(t.id)}
            onDoubleClick={() => startRename(t)}
            title={`${t.name} — nhấp đúp để đổi tên`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              height: 26,
              padding: '0 8px 0 10px',
              borderRadius: 7,
              border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
              borderLeft: isOver ? '2px solid var(--accent)' : undefined,
              background: on ? 'var(--accent-soft)' : 'var(--field)',
              color: on ? 'var(--accent)' : 'var(--t2)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              userSelect: 'none',
              flex: '0 0 auto',
              opacity: dragIdx === i ? 0.5 : 1,
            }}
          >
            {editingId === t.id ? (
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename();
                  else if (e.key === 'Escape') setEditingId(null);
                  e.stopPropagation();
                }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: Math.max(60, draft.length * 8),
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  color: 'var(--t1)',
                  fontSize: 12.5,
                  fontWeight: 600,
                }}
              />
            ) : (
              <span style={{ fontSize: 12.5, fontWeight: on ? 600 : 500 }}>{t.name}</span>
            )}
            {canClose && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose(t.id);
                }}
                title="Đóng sheet"
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--t4)',
                  cursor: 'pointer',
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={() => canAdd && onAdd()}
        disabled={!canAdd}
        title={canAdd ? addLabel : `Tối đa ${max} sheet`}
        style={{
          display: 'grid',
          placeItems: 'center',
          width: 26,
          height: 26,
          borderRadius: 7,
          border: '1px solid var(--border)',
          background: 'var(--field)',
          color: canAdd ? 'var(--t2)' : 'var(--t4)',
          cursor: canAdd ? 'pointer' : 'not-allowed',
          flex: '0 0 auto',
          opacity: canAdd ? 1 : 0.5,
        }}
      >
        <Plus size={14} />
      </button>

      <div style={{ flex: 1 }} />
      <span style={{ fontSize: 11, color: 'var(--t4)', flex: '0 0 auto', paddingRight: 4 }}>
        {sheets.length}/{max}
      </span>
    </div>
  );
}
