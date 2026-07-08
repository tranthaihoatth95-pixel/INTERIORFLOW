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

interface Props {
  slide: EditorSlide;
  fonts: string;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onFrame: (id: string, frame: Frame, live: boolean) => void;
  onEditTextCommit: (id: string, text: string) => void;
}

export default function EditorCanvas({
  slide,
  fonts,
  selectedId,
  onSelect,
  onFrame,
  onEditTextCommit,
}: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [guides, setGuides] = useState<Guides | null>(null);
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);

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
        />
      ))}

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
            fontSize: `${editingEl.fontSize}cqh`,
            fontWeight: editingEl.bold ? 700 : 400,
            fontStyle: editingEl.italic ? 'italic' : 'normal',
            textAlign: editingEl.align,
            lineHeight: editingEl.lineHeight ?? 1.2,
            background: 'rgba(255,255,255,.06)',
            border: '1.5px dashed var(--accent)',
            outline: 'none',
            resize: 'none',
            padding: 0,
            fontFamily: 'inherit',
          }}
        />
      )}
    </div>
  );
}
