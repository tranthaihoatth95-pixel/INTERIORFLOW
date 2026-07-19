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
 *
 * Kéo-thả đổi thứ tự dùng Pointer Events tự viết (KHÔNG phải HTML5 native DnD — API đó
 * không phát sinh sự kiện gì trên thiết bị cảm ứng, giới hạn trình duyệt đã biết, không có
 * polyfill). Pattern setPointerCapture try/catch + phân biệt ngưỡng di chuyển tham khảo
 * components/cad/CadCanvas.tsx (onPointerDown/Move/Up/Cancel). Nút Lên/Xuống ở
 * SlideStrip.tsx vẫn là lối thoát cảm ứng dự phòng — giữ nguyên, không đụng.
 */

import { useEffect, useRef, useState } from 'react';
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

  // Kéo-thả bằng Pointer Events (mouse + touch + pen cùng 1 cơ chế).
  // dragFrom/dragOver: CHỈ set sau khi vượt ngưỡng di chuyển — dùng cho visual feedback
  // (border/opacity), giữ đúng style đã có từ bản HTML5 DnD cũ.
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  // activeCard: set NGAY từ pointerdown (trước khi biết có phải kéo hay không) — chỉ dùng để
  // bật touch-action:none đúng lúc ngón tay chạm xuống, tránh trình duyệt tự scroll/pinch
  // trước khi ngưỡng kéo của mình kịp phát hiện gesture.
  const [activeCard, setActiveCard] = useState<number | null>(null);
  // Vị trí khởi tạo cho ảnh kéo nổi (ghost) — chỉ dùng để mount đúng chỗ lần đầu; các lần
  // move sau đó cập nhật trực tiếp qua ref (KHÔNG qua setState) để tránh re-render mỗi pixel.
  const [ghostStart, setGhostStart] = useState<{ x: number; y: number } | null>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);
  // State ephemeral của gesture đang chạy — sống trong ref (không re-render), đọc lại ở
  // pointerup để biết đích thả CHÍNH XÁC tại thời điểm nhả tay (tránh lệch do setState bất đồng bộ).
  const dragRef = useRef<{
    pointerId: number;
    from: number;
    startX: number;
    startY: number;
    dragging: boolean;
    over: number;
  } | null>(null);

  const DRAG_THRESHOLD_PX = 7;

  function handleCardPointerDown(e: React.PointerEvent, i: number) {
    // Chuột: chỉ nút trái. Cảm ứng/bút: button luôn là 0 ở pointerdown, không cần lọc thêm.
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    // setPointerCapture có thể throw DOMException nếu pointerId không còn hợp lệ (input tổng
    // hợp/tự động hoá) — bọc try/catch để không chặn thao tác phía sau, giống CadCanvas.tsx.
    try {
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {
      /* bỏ qua — không nghiêm trọng */
    }
    dragRef.current = {
      pointerId: e.pointerId,
      from: i,
      startX: e.clientX,
      startY: e.clientY,
      dragging: false,
      over: i,
    };
    setActiveCard(i);
  }

  function handleCardPointerMove(e: React.PointerEvent) {
    const st = dragRef.current;
    if (!st || e.pointerId !== st.pointerId) return;
    const dx = e.clientX - st.startX;
    const dy = e.clientY - st.startY;
    if (!st.dragging) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
      st.dragging = true;
      setDragFrom(st.from);
      setDragOver(st.from);
      setGhostStart({ x: e.clientX, y: e.clientY });
    }
    // Ghost đi theo con trỏ — cập nhật style trực tiếp qua ref, không qua React state.
    if (ghostRef.current) {
      ghostRef.current.style.left = `${e.clientX}px`;
      ghostRef.current.style.top = `${e.clientY}px`;
    }
    // Tìm card nào đang ở dưới con trỏ hiện tại (đơn giản & chắc chắn hơn tính toán bằng grid).
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const cardEl = el?.closest<HTMLElement>('[data-slide-index]');
    if (cardEl) {
      const idx = Number(cardEl.dataset.slideIndex);
      if (!Number.isNaN(idx) && idx !== st.over) {
        st.over = idx;
        setDragOver(idx);
      }
    }
    // Không tìm thấy card (con trỏ đang ở khoảng trống lưới/thanh trên/ngoài lưới) → giữ
    // nguyên "over" lần cuối hợp lệ. Nếu thả ở đây, onReorder(from, over-cuối) — nếu chưa
    // từng đổi over thì over === from, PresentEditor tự bỏ qua (from === to).
  }

  function endDrag(commit: boolean) {
    const st = dragRef.current;
    dragRef.current = null;
    setActiveCard(null);
    setDragFrom(null);
    setDragOver(null);
    setGhostStart(null);
    if (!st) return;
    if (!commit) return; // pointercancel: gesture bị huỷ — KHÔNG reorder, KHÔNG select.
    if (st.dragging) {
      if (st.from !== st.over) onReorder(st.from, st.over);
    } else {
      // Chưa vượt ngưỡng kéo → coi như tap/click chọn slide, KHÔNG có onClick riêng nữa.
      onSelect(st.from);
    }
  }

  function handleCardPointerUp(e: React.PointerEvent) {
    const st = dragRef.current;
    if (!st || e.pointerId !== st.pointerId) return;
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      /* bỏ qua */
    }
    endDrag(true);
  }

  function handleCardPointerCancel(e: React.PointerEvent) {
    const st = dragRef.current;
    if (!st || e.pointerId !== st.pointerId) return;
    // Cancel = gesture bị huỷ (vd hệ thống cướp pointer) — KHÔNG commit reorder lẫn select,
    // chỉ dọn sạch trạng thái ephemeral (cùng tinh thần onPointerCancel của CadCanvas.tsx).
    endDrag(false);
  }

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
                data-slide-index={i}
                onPointerDown={(e) => handleCardPointerDown(e, i)}
                onPointerMove={handleCardPointerMove}
                onPointerUp={handleCardPointerUp}
                onPointerCancel={handleCardPointerCancel}
                title={`Slide ${i + 1} — tap/click để chọn · kéo (chuột hoặc ngón tay) để đổi thứ tự`}
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: aspect,
                  borderRadius: 8,
                  overflow: 'hidden',
                  cursor: dragFrom === i ? 'grabbing' : 'grab',
                  // Chỉ chặn touch-action trên card ĐANG có pointer nhấn xuống (từ pointerdown
                  // tới pointerup/cancel) — không chặn scroll dọc của toàn lưới lúc không kéo.
                  touchAction: activeCard === i ? 'none' : undefined,
                  userSelect: activeCard === i ? 'none' : undefined,
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

      {/* Ảnh kéo nổi (ghost) — chỉ mount khi đang kéo (dragFrom !== null). Vị trí lần đầu tới
          từ ghostStart (React), các lần move sau cập nhật trực tiếp qua ghostRef (không qua
          setState) để tránh re-render dồn dập theo pixel. pointerEvents:'none' BẮT BUỘC — nếu
          không, ghost sẽ chắn document.elementFromPoint() và không bao giờ tìm ra card bên dưới. */}
      {dragFrom !== null &&
        ghostStart &&
        (() => {
          const draggingSlide = deck.slides[dragFrom];
          const thumbUrl = draggingSlide ? thumbs[draggingSlide.id] : undefined;
          return (
            <div
              ref={ghostRef}
              style={{
                position: 'fixed',
                left: ghostStart.x,
                top: ghostStart.y,
                width: 180,
                aspectRatio: aspect,
                borderRadius: 8,
                overflow: 'hidden',
                pointerEvents: 'none',
                zIndex: 200,
                transform: 'translate(-50%, -50%) scale(0.95)',
                border: '2px solid var(--accent)',
                boxShadow: '0 14px 36px rgba(0,0,0,.4)',
                opacity: 0.92,
                backgroundColor: draggingSlide?.background,
                backgroundImage: thumbUrl ? `url("${thumbUrl}")` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          );
        })()}
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
      // Chặn pointerdown/pointerup nổi bọt lên card cha — nếu không, việc chọn card (xử lý ở
      // onPointerUp của card từ khi bỏ onClick native DnD cũ) sẽ chạy song song với hành động
      // nhân bản/xoá của nút này.
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
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
