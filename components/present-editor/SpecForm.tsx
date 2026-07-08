'use client';

/**
 * components/present-editor/SpecForm.tsx — BẢNG HỎI SỐ LIỆU khi sinh/áp bố cục.
 *
 * User (round 2): trước khi generate bố cục hỏi tối thiểu — min/max hình · tone màu ·
 * nền hình hay màu — KÈM tuỳ chọn nhanh (preset) trỏ thẳng vào xử lý. Spec áp thẳng
 * vào bố cục sinh ra (applySpecToSlide). Gọn, cuộn không cần.
 */

import type { LayoutSpec, ToneKey, BackgroundMode } from '@/lib/present-editor/spec';
import { SPEC_PRESETS, toneHint } from '@/lib/present-editor/spec';
import { Zap } from 'lucide-react';

interface Props {
  spec: LayoutSpec;
  palette: string[];
  onChange: (next: LayoutSpec) => void;
}

const TONES: ToneKey[] = ['light', 'warm', 'dark', 'accent'];
const TONE_LABEL: Record<ToneKey, string> = { light: 'Sáng', warm: 'Ấm', dark: 'Tối', accent: 'Nhấn' };

export default function SpecForm({ spec, palette, onChange }: Props) {
  const set = (patch: Partial<LayoutSpec>) => onChange({ ...spec, ...patch });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* tuỳ chọn nhanh */}
      <div>
        <Label>Tuỳ chọn nhanh</Label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {SPEC_PRESETS.map((p) => {
            const active =
              p.spec.minImages === spec.minImages &&
              p.spec.maxImages === spec.maxImages &&
              p.spec.tone === spec.tone &&
              p.spec.background === spec.background;
            return (
              <button
                key={p.id}
                type="button"
                title={p.hint}
                onClick={() => onChange({ ...p.spec })}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  padding: '7px 8px',
                  borderRadius: 8,
                  border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
                  background: active ? 'var(--accent-soft)' : 'var(--field)',
                  color: active ? 'var(--accent)' : 'var(--t2)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600 }}>
                  <Zap size={11} /> {p.label}
                </span>
                <span style={{ fontSize: 9.5, color: 'var(--t4)', lineHeight: 1.2 }}>{p.hint}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* số hình min / max */}
      <div style={{ display: 'flex', gap: 8 }}>
        <NumberField
          label="Tối thiểu hình"
          value={spec.minImages}
          min={0}
          max={12}
          onChange={(v) => set({ minImages: Math.min(v, spec.maxImages) })}
        />
        <NumberField
          label="Tối đa hình"
          value={spec.maxImages}
          min={0}
          max={12}
          onChange={(v) => set({ maxImages: Math.max(v, spec.minImages) })}
        />
      </div>

      {/* tone màu chủ đạo */}
      <div>
        <Label>Tone màu chủ đạo</Label>
        <div style={{ display: 'flex', gap: 6 }}>
          {TONES.map((t) => (
            <button
              key={t}
              type="button"
              title={toneHint(t)}
              onClick={() => set({ tone: t })}
              style={{
                flex: 1,
                padding: '7px 4px',
                borderRadius: 7,
                border: spec.tone === t ? '1px solid var(--accent)' : '1px solid var(--border)',
                background: spec.tone === t ? 'var(--accent-soft)' : 'var(--field)',
                color: spec.tone === t ? 'var(--accent)' : 'var(--t3)',
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              {TONE_LABEL[t]}
            </button>
          ))}
        </div>
      </div>

      {/* nền hình hay màu */}
      <div>
        <Label>Nền</Label>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['color', 'image'] as BackgroundMode[]).map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => set({ background: b })}
              style={{
                flex: 1,
                padding: '7px 4px',
                borderRadius: 7,
                border: spec.background === b ? '1px solid var(--accent)' : '1px solid var(--border)',
                background: spec.background === b ? 'var(--accent-soft)' : 'var(--field)',
                color: spec.background === b ? 'var(--accent)' : 'var(--t3)',
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              {b === 'color' ? 'Màu phẳng' : 'Ảnh nền'}
            </button>
          ))}
        </div>
      </div>

      <p style={{ fontSize: 10, color: 'var(--t4)', lineHeight: 1.4, margin: 0 }}>
        Bảng hỏi áp thẳng vào bố cục khi bạn bấm một mẫu bên dưới (đổi tone nền · giới hạn số
        hình · nền hình/màu). Sau đó vẫn chỉnh tay tự do.
      </p>
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 10.5, color: 'var(--t3)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} style={stepBtn}>
          −
        </button>
        <span
          style={{
            flex: 1,
            textAlign: 'center',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--t1)',
            padding: '4px 0',
            borderRadius: 6,
            background: 'var(--field)',
            border: '1px solid var(--border)',
          }}
        >
          {value}
        </span>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} style={stepBtn}>
          +
        </button>
      </div>
    </label>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10.5,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
        color: 'var(--t3)',
        margin: '0 0 6px',
      }}
    >
      {children}
    </div>
  );
}

const stepBtn: React.CSSProperties = {
  width: 26,
  height: 28,
  borderRadius: 6,
  border: '1px solid var(--border)',
  background: 'var(--field)',
  color: 'var(--t2)',
  fontSize: 15,
  cursor: 'pointer',
  lineHeight: 1,
};
