'use client';

/**
 * components/present-editor/SlideSorter.tsx — "Xem lưới" (Slide Sorter / Light Table).
 *
 * Overlay toàn màn (giống ImageEditor.tsx: position:fixed, inset:0) hiện TẤT CẢ slide
 * trong deck dạng LƯỚI — bổ sung cho SlideStrip (dải ngang dưới cùng), KHÔNG thay thế.
 * Mỗi ô = 1 thumbnail LỚN dựng bằng renderEditorSlide (cùng hàm SlidePlayer dùng để trình
 * chiếu — ảnh tĩnh trung thực đúng khổ, thay vì mini-preview thô của SlideStrip).
 *
 * Hành động mỗi ô: click chọn làm current (đóng lưới — xử lý ở PresentEditor qua onSelect),
 * kéo-thả đổi thứ tự (native HTML5 DnD, gọi onReorder(from,to) — logic thuần ở
 * lib/present-editor/reorder.ts), nút nhân bản/xoá (tái dùng onDuplicate/onDelete đã có ở
 * PresentEditor cho SlideStrip). Cuối lưới: ô "Thêm slide". Đóng bằng nút X hoặc Esc.
 */

import { useEffect, useState } from 'react';
import type { EditorDeck } from '@/lib/present-editor/model';
import { renderEditorSlide } from '@/lib/present-editor/render';
import { stageFor } from '@/lib/present-editor/stage-presets';
import { LayoutGrid, Copy, Trash2, Plus, X } from 'lucide-react';

interface Props {
  deck: EditorDeck;
  current: number;
  /** chọn slide i làm current (PresentEditor tự đóng lưới sau khi chọn). */
  onSelect: (i: number) => void;
  onAdd: () => void;
  onDuplicate: (i: number) => void;
  onDelete: (i: number) => void;
  /** kéo-thả đổi thứ tự: từ chỉ số from → to. */
  onReorder: (from: number, to: number) => void;
  onClose: () => void;
}

export default function SlideSorter({
  deck,
  current,
  onSelect,
  onAdd,
  onDuplicate,
  onDelete,
  onReorder,
  onClose,
}: Props) {
  const stage = stageFor(deck.stagePreset);
  const aspect = `${stage.w} / ${stage.h}`;

  // Dựng thumbnail THẬT (renderEditorSlide) cho từng slide — cache theo id, cùng cách
  // SlidePlayer.tsx làm khi trình chiếu. Không chặn UI: ô nào chưa có ảnh hiện "Đang dựng…".
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  useEffect(() => {
    let alive = true;
    (async () => {
      for (const s of deck.slides) {
        if (!alive) return;
        if (thumbs[s.id]) continue;
        try {
          const url = await renderEditorSlide(s, deck.fonts, deck.watermark, stage);
          if (!alive) return;
          setThumbs((prev) => ({ ...prev, [s.id]: url }));
        } catch {
          /* ảnh lỗi — bỏ qua, ô giữ trạng thái "Đang dựng…" */
        }
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deck.slides, deck.fonts, deck.watermark, stage]);

  // Esc để thoát (giống ImageEditor.tsx).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    }
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  // Kéo-thả (HTML5 DnD native — đủ gọn cho phạm vi này, không cần thư viện thêm).
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 65,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg)',
      }}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* thanh trên */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 16px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--panel)',
        }}
      >
        <LayoutGrid size={16} style={{ color: 'var(--accent)' }} />
        <strong style={{ fontSize: 13, color: 'var(--t1)' }}>Xem lưới · Slide Sorter</strong>
        <span style={{ fontSize: 12, color: 'var(--t3)' }}>{deck.slides.length} slide</span>
        <div style={{ flex: 1 }} />
        <button type="button" onClick={onClose} style={iconBtn} title="Đóng (Esc)">
          <X size={16} />
        </button>
      </div>

      {/* lưới */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 28 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 24,
            maxWidth: 1600,
            margin: '0 auto',
          }}
        >
          {deck.slides.map((s, i) => (
            <div key={s.id} style={{ opacity: dragFrom === i ? 0.4 : 1 }}>
              <div
                draggable
                onDragStart={(e) => {
                  setDragFrom(i);
                  try {
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', String(i));
                  } catch {
                    /* ignore */
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragFrom !== null) setDragOver(i);
                }}
                onDragLeave={() => setDragOver((v) => (v === i ? null : v))}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragFrom !== null && dragFrom !== i) onReorder(dragFrom, i);
                  setDragFrom(null);
                  setDragOver(null);
                }}
                onDragEnd={() => {
                  setDragFrom(null);
                  setDragOver(null);
                }}
                onClick={() => onSelect(i)}
                title={`Slide ${i + 1} — click để chọn · kéo để đổi thứ tự`}
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: aspect,
                  borderRadius: 8,
                  overflow: 'hidden',
                  cursor: 'grab',
                  backgroundColor: s.background,
                  border:
                    i === current
                      ? '2px solid var(--accent)'
                      : dragOver === i
                        ? '2px dashed var(--accent)'
                        : '1px solid var(--border)',
                  backgroundImage: thumbs[s.id] ? `url("${thumbs[s.id]}")` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  boxShadow: i === current ? '0 6px 20px rgba(0,0,0,.18)' : undefined,
                }}
              >
                {!thumbs[s.id] && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'grid',
                      placeItems: 'center',
                      color: 'var(--t4)',
                      fontSize: 11.5,
                    }}
                  >
                    Đang dựng…
                  </div>
                )}
                <span
                  style={{
                    position: 'absolute',
                    left: 6,
                    top: 6,
                    fontSize: 11,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: 'rgba(0,0,0,.55)',
                    color: '#fff',
                  }}
                >
                  {i + 1}
                </span>
                <div style={{ position: 'absolute', right: 6, top: 6, display: 'flex', gap: 4 }}>
                  <TileBtn
                    title="Nhân bản"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate(i);
                    }}
                  >
                    <Copy size={13} />
                  </TileBtn>
                  <TileBtn
                    title="Xoá"
                    disabled={deck.slides.length <= 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(i);
                    }}
                  >
                    <Trash2 size={13} />
                  </TileBtn>
                </div>
              </div>
              <div style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--t3)', marginTop: 6 }}>
                Slide {i + 1}
              </div>
            </div>
          ))}

          {/* ô "Thêm slide" ở cuối lưới. */}
          <div>
            <button
              type="button"
              onClick={onAdd}
              title="Thêm slide"
              style={{
                width: '100%',
                aspectRatio: aspect,
                borderRadius: 8,
                border: '1px dashed var(--border-strong)',
                background: 'var(--card)',
                color: 'var(--t3)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              <Plus size={22} />
              Thêm slide
            </button>
            <div style={{ height: 21 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function TileBtn({
  children,
  onClick,
  title,
  disabled,
}: {
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
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
        width: 26,
        height: 26,
        display: 'grid',
        placeItems: 'center',
        borderRadius: 6,
        border: 'none',
        background: 'rgba(0,0,0,.55)',
        color: '#fff',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {children}
    </button>
  );
}

const iconBtn: React.CSSProperties = {
  width: 32,
  height: 32,
  display: 'grid',
  placeItems: 'center',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--field)',
  color: 'var(--t2)',
  cursor: 'pointer',
};
