'use client';

/**
 * components/present-editor/EditorCanvas.tsx — Sân khấu 16:9 chứa các element.
 *
 * Giữ tỉ lệ 16:9 bằng aspect-ratio + width 100%. `containerType:'size'` để cỡ chữ
 * dùng đơn vị cqh (co giãn theo sân khấu). Click nền = bỏ chọn. Vẽ guide căn khi kéo.
 * Sửa text inline: double-click → textarea phủ đúng khung element.
 */

import { useRef, useState } from 'react';
import type { EditorSlide, Frame, TextElement } from '@/lib/present-editor/model';
import { adjustToCssFilter } from '@/lib/present-editor/model';
import Element, { type Guides } from './Element';

/** Bộ chữ hiển thị trên canvas (khớp Element.tsx + render.ts). */
const CANVAS_FONT: Record<string, string> = {
  Editorial: '"Avenir Next", "Helvetica Neue", Helvetica, Arial, sans-serif',
  Modern: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  Elegant: 'Optima, "Avenir Next", "Helvetica Neue", sans-serif',
};

interface Props {
  slide: EditorSlide;
  fonts: string;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onFrame: (id: string, frame: Frame, live: boolean) => void;
  onEditTextCommit: (id: string, text: string) => void;
  /** thao tác cho menu chuột phải trên element. */
  onDuplicate: () => void;
  onDelete: () => void;
  onZOrder: (dir: 'front' | 'back' | 'forward' | 'backward') => void;
  onToggleLock: () => void;
}

/** Trạng thái menu chuột phải: vị trí (px trong khung stage) + id element. */
interface MenuState {
  x: number;
  y: number;
  id: string;
  locked: boolean;
}

export default function EditorCanvas({
  slide,
  fonts,
  selectedId,
  onSelect,
  onFrame,
  onEditTextCommit,
  onDuplicate,
  onDelete,
  onZOrder,
  onToggleLock,
}: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [guides, setGuides] = useState<Guides | null>(null);
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);
  const [menu, setMenu] = useState<MenuState | null>(null);

  const editingEl =
    editing && (slide.elements.find((e) => e.id === editing.id) as TextElement | undefined);

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 1100,
        margin: '0 auto',
        aspectRatio: '16 / 9',
        position: 'relative',
        background: slide.background,
        containerType: 'size',
        boxShadow: '0 10px 40px rgba(0,0,0,.35)',
        borderRadius: 8,
        overflow: 'hidden',
        userSelect: 'none',
      }}
      ref={stageRef}
      onPointerDown={(e) => {
        if (e.target === stageRef.current) onSelect(null);
        setMenu(null); // click ra ngoài đóng menu chuột phải
      }}
      onContextMenu={(e) => {
        // chuột phải trên nền → không hiện menu trình duyệt, chỉ bỏ chọn
        if (e.target === stageRef.current) {
          e.preventDefault();
          setMenu(null);
        }
      }}
    >
      {/* ảnh nền full-bleed */}
      {slide.backgroundImage && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url("${slide.backgroundImage}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: adjustToCssFilter(slide.backgroundAdjust),
            pointerEvents: 'none',
          }}
        />
      )}

      {slide.elements.map((el) => (
        <Element
          key={el.id}
          el={el}
          fonts={fonts}
          selected={el.id === selectedId}
          stageRef={stageRef}
          onSelect={() => onSelect(el.id)}
          onFrame={(frame, live) => onFrame(el.id, frame, live)}
          onGuides={setGuides}
          onEditText={(id) => {
            const t = slide.elements.find((x) => x.id === id) as TextElement | undefined;
            if (t) setEditing({ id, text: t.text });
          }}
          onContextMenu={(e) => {
            // chuột phải trên element → chọn nó + mở menu tại vị trí con trỏ (px trong stage)
            e.preventDefault();
            e.stopPropagation();
            onSelect(el.id);
            const rect = stageRef.current?.getBoundingClientRect();
            setMenu({
              x: rect ? e.clientX - rect.left : 0,
              y: rect ? e.clientY - rect.top : 0,
              id: el.id,
              locked: !!el.locked,
            });
          }}
        />
      ))}

      {/* menu chuột phải trên element */}
      {menu && (
        <div
          style={{
            position: 'absolute',
            left: menu.x,
            top: menu.y,
            zIndex: 20,
            minWidth: 160,
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: 4,
            boxShadow: '0 8px 24px rgba(0,0,0,.35)',
            userSelect: 'none',
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <MenuItem onClick={() => { onDuplicate(); setMenu(null); }}>Nhân bản</MenuItem>
          <MenuItem onClick={() => { onZOrder('front'); setMenu(null); }}>Đưa lên trước</MenuItem>
          <MenuItem onClick={() => { onZOrder('forward'); setMenu(null); }}>Tiến 1 bậc</MenuItem>
          <MenuItem onClick={() => { onZOrder('backward'); setMenu(null); }}>Lùi 1 bậc</MenuItem>
          <MenuItem onClick={() => { onZOrder('back'); setMenu(null); }}>Đưa ra sau</MenuItem>
          <MenuItem onClick={() => { onToggleLock(); setMenu(null); }}>
            {menu.locked ? 'Mở khoá' : 'Khoá'}
          </MenuItem>
          <MenuItem danger onClick={() => { onDelete(); setMenu(null); }}>Xoá</MenuItem>
        </div>
      )}

      {/* guide căn */}
      {guides?.v.map((v, i) => (
        <div
          key={`v${i}`}
          style={{
            position: 'absolute',
            left: `${v}%`,
            top: 0,
            bottom: 0,
            width: 1,
            background: 'var(--accent)',
            opacity: 0.9,
            pointerEvents: 'none',
          }}
        />
      ))}
      {guides?.h.map((h, i) => (
        <div
          key={`h${i}`}
          style={{
            position: 'absolute',
            top: `${h}%`,
            left: 0,
            right: 0,
            height: 1,
            background: 'var(--accent)',
            opacity: 0.9,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* editor text inline */}
      {editing && editingEl && (
        <textarea
          autoFocus
          value={editing.text}
          onChange={(e) => setEditing({ id: editing.id, text: e.target.value })}
          onBlur={() => {
            onEditTextCommit(editing.id, editing.text);
            setEditing(null);
          }}
          style={{
            position: 'absolute',
            left: `${editingEl.frame.x}%`,
            top: `${editingEl.frame.y}%`,
            width: `${editingEl.frame.w}%`,
            height: `${editingEl.frame.h}%`,
            transform: `rotate(${editingEl.frame.rotation}deg)`,
            color: editingEl.color,
            fontFamily: editingEl.fontFamily || CANVAS_FONT[fonts] || CANVAS_FONT.Editorial,
            fontSize: `${editingEl.fontSize}cqh`,
            fontWeight: editingEl.bold ? 700 : 400,
            fontStyle: editingEl.italic ? 'italic' : 'normal',
            textDecoration: editingEl.underline ? 'underline' : undefined,
            textAlign: editingEl.align,
            letterSpacing: editingEl.tracking ? `${editingEl.tracking * 0.09}vh` : undefined,
            lineHeight: editingEl.lineHeight ?? 1.2,
            background: 'rgba(255,255,255,.06)',
            border: '1.5px dashed var(--accent)',
            outline: 'none',
            resize: 'none',
            padding: 0,
          }}
        />
      )}
    </div>
  );
}

/** 1 dòng trong menu chuột phải. */
function MenuItem({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '7px 10px',
        borderRadius: 6,
        border: 'none',
        background: 'transparent',
        color: danger ? '#e5674f' : 'var(--t2)',
        fontSize: 13,
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--field)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {children}
    </button>
  );
}
