'use client';

/**
 * components/present-editor/SlideStrip.tsx — Dải thumbnail nhiều slide.
 * Thêm / xoá / nhân bản / đổi thứ tự (mũi tên) + chọn slide hiện tại.
 *
 * LỖI CŨ ĐÃ SỬA (#3 — "chữ ở dải thumbnail hiện thành thanh xám/be"):
 * bản trước KHÔNG hề vẽ chữ. Nó lọc 2 text element đầu rồi vẽ mỗi cái thành một <div>
 * `height: 3px` tô đặc `background: currentColor` — tức placeholder kiểu skeleton, cố ý
 * dựng như vậy từ đầu chứ không phải chữ bị co nhỏ hay font chưa tải. Vì thế deck nào cũng
 * ra hai thanh ngang, và chúng ăn màu chữ của element (chữ be → thanh be) đúng như ảnh user
 * gửi. Ảnh nền/shape cũng không được vẽ.
 *
 * Cách sửa: dựng thumbnail bằng CHÍNH `Inner` của Element.tsx — cùng một bộ code vẽ với
 * editor canvas và player. Mấu chốt là `containerType: 'size'` trên khung thumbnail: cỡ chữ
 * trong Element.tsx dùng đơn vị `cqh` (% chiều cao container), nên đặt container ở đây là
 * chữ tự co đúng tỉ lệ trong ô 150px mà không cần đường code riêng nào cho thumbnail.
 *
 * Vì sao KHÔNG rasterize như SlideSorter (renderEditorSlide → dataURL): dải này cập nhật
 * theo TỪNG thao tác sửa; render canvas lại toàn bộ mỗi keystroke sẽ giật. DOM tái dựng rẻ
 * hơn nhiều và luôn đồng bộ tức thì.
 */

import type { EditorDeck } from '@/lib/present-editor/model';
import { stageFor } from '@/lib/present-editor/stage-presets';
import { Inner, textOverImage } from './Element';
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
  // PS-4: khung thumbnail theo ĐÚNG tỉ lệ khổ trình bày đang chọn (mặc định 16:9).
  const aspect = (() => {
    const s = stageFor(deck.stagePreset);
    return `${s.w} / ${s.h}`;
  })();
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
              aspectRatio: aspect,
              borderRadius: 6,
              border: i === current ? '2px solid var(--accent)' : '1px solid var(--border)',
              // dùng backgroundColor (không phải shorthand 'background') để không đụng
              // backgroundImage/Size/Position → tránh cảnh báo mix shorthand của React.
              backgroundColor: s.background,
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
              backgroundImage: s.backgroundImage ? `url("${s.backgroundImage}")` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            title={`Slide ${i + 1}`}
          >
            {/* Bản thu nhỏ THẬT của slide — xem ghi chú "LỖI CŨ" ở đầu file. */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                // container-query: cho phép `fontSize: Ncqh` trong Element.tsx quy chiếu vào
                // CHÍNH khung thumbnail này ⇒ chữ tự co đúng tỉ lệ, không cần code riêng.
                containerType: 'size',
                pointerEvents: 'none',
              }}
            >
              {s.elements
                .filter((e) => !e.hidden)
                .map((e) => (
                  <div
                    key={e.id}
                    style={{
                      position: 'absolute',
                      left: `${e.frame.x}%`,
                      top: `${e.frame.y}%`,
                      width: `${e.frame.w}%`,
                      height: `${e.frame.h}%`,
                      transform: e.frame.rotation ? `rotate(${e.frame.rotation}deg)` : undefined,
                      opacity: e.opacity ?? 1,
                    }}
                  >
                    <Inner
                      el={e}
                      fonts={deck.fonts}
                      overImage={textOverImage(e, s.elements, !!s.backgroundImage)}
                    />
                  </div>
                ))}
            </div>
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
      className="pe-strip-btn"
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
