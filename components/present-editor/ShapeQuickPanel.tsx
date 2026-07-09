'use client';

/**
 * components/present-editor/ShapeQuickPanel.tsx — Bảng chỉnh SHAPE nhanh (góp ý #6).
 *
 * Hiện trong menu chuột-phải trên 1 shape: 1 shape cơ bản → vô vàn biến thể (đổi loại,
 * số cạnh đa giác, góc bo chữ nhật, độ dày viền) mà không vướng bản quyền. Human-in-loop:
 * chỉnh trực tiếp, thấy ngay. Trái = kéo dùng bình thường (đã có ở Element).
 */

import type { ShapeElement, ShapeKind } from '@/lib/present-editor/model';
import { Square, Circle, Triangle, Pentagon, MoveRight, Minus } from 'lucide-react';

interface Props {
  el: ShapeElement;
  onUpdate: (mutate: (el: ShapeElement) => void, live?: boolean) => void;
}

const KINDS: { id: ShapeKind; icon: React.ReactNode; title: string }[] = [
  { id: 'rect', icon: <Square size={13} />, title: 'Chữ nhật' },
  { id: 'ellipse', icon: <Circle size={13} />, title: 'Elip' },
  { id: 'triangle', icon: <Triangle size={13} />, title: 'Tam giác' },
  { id: 'polygon', icon: <Pentagon size={13} />, title: 'Đa giác' },
  { id: 'arrow', icon: <MoveRight size={13} />, title: 'Mũi tên' },
  { id: 'line', icon: <Minus size={13} />, title: 'Đường' },
];

export default function ShapeQuickPanel({ el, onUpdate }: Props) {
  return (
    <div style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 8, minWidth: 190 }} onPointerDown={(e) => e.stopPropagation()}>
      <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 0.4 }}>
        Chỉnh shape
      </div>

      {/* đổi loại shape */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {KINDS.map((k) => (
          <button
            key={k.id}
            type="button"
            title={k.title}
            onClick={() =>
              onUpdate((s) => {
                s.shape = k.id;
                if (k.id === 'polygon' && !s.sides) s.sides = 5;
                // line không có fill → cho stroke mặc định thấy được
                if (k.id === 'line' && !s.strokeWidth) s.strokeWidth = 3;
              })
            }
            style={{
              width: 28,
              height: 26,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 6,
              border: el.shape === k.id ? '1px solid var(--accent)' : '1px solid var(--border)',
              background: el.shape === k.id ? 'var(--accent-soft)' : 'var(--field)',
              color: el.shape === k.id ? 'var(--accent)' : 'var(--t2)',
              cursor: 'pointer',
            }}
          >
            {k.icon}
          </button>
        ))}
      </div>

      {/* số cạnh (đa giác) */}
      {el.shape === 'polygon' && (
        <MiniSlider
          label={`Số cạnh ${el.sides ?? 5}`}
          min={3}
          max={12}
          step={1}
          value={el.sides ?? 5}
          onChange={(v, live) => onUpdate((s) => (s.sides = v), live)}
        />
      )}

      {/* góc bo (chữ nhật) */}
      {el.shape === 'rect' && (
        <MiniSlider
          label={`Bo góc ${el.radius ?? 0}%`}
          min={0}
          max={50}
          step={1}
          value={el.radius ?? 0}
          onChange={(v, live) => onUpdate((s) => (s.radius = v), live)}
        />
      )}

      {/* độ dày viền/đường */}
      <MiniSlider
        label={`Viền ${el.strokeWidth}`}
        min={0}
        max={20}
        step={0.5}
        value={el.strokeWidth}
        onChange={(v, live) => onUpdate((s) => (s.strokeWidth = v), live)}
      />
    </div>
  );
}

function MiniSlider({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number, live: boolean) => void;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ fontSize: 10.5, color: 'var(--t3)' }}>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value, true)}
        onPointerUp={(e) => onChange(+(e.target as HTMLInputElement).value, false)}
        style={{ width: '100%' }}
      />
    </label>
  );
}
