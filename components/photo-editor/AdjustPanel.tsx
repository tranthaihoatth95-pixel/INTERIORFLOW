'use client';

/**
 * components/photo-editor/AdjustPanel.tsx — Bảng chỉnh màu cho ADJUSTMENT LAYER đang chọn.
 *
 * Hiển thị khi lớp chọn là adjustment: Exposure/Brightness/Contrast/Saturation,
 * White Balance (temp/tint), Levels (black/white/gamma), Hue, và mini-Curves.
 * Áp không phá huỷ (đổi params → composite lại các lớp dưới). Kèm preset grade.
 */

import type { AdjustmentLayer, AdjustParams, AdjustPreset, CurvePoint } from '@/lib/photo-editor/model';
import { ADJUST_PRESETS } from '@/lib/photo-editor/model';

interface Props {
  layer: AdjustmentLayer;
  onParams: (patch: Partial<AdjustParams>, live: boolean) => void;
  onPreset: (preset: AdjustPreset) => void;
}

export default function AdjustPanel(p: Props) {
  const pr = p.layer.params;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t3)' }}>CHỈNH MÀU (không phá huỷ)</div>

      {/* preset */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {ADJUST_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => p.onPreset(preset)}
            style={{
              fontSize: 11.5,
              padding: '5px 9px',
              borderRadius: 999,
              border: '1px solid var(--border)',
              background: 'var(--field)',
              color: 'var(--t2)',
              cursor: 'pointer',
            }}
          >
            {preset.name}
          </button>
        ))}
      </div>

      <Slider label="Phơi sáng" min={-100} max={100} value={pr.exposure} onChange={(v, live) => p.onParams({ exposure: v }, live)} />
      <Slider label="Độ sáng" min={-100} max={100} value={pr.brightness} onChange={(v, live) => p.onParams({ brightness: v }, live)} />
      <Slider label="Tương phản" min={-100} max={100} value={pr.contrast} onChange={(v, live) => p.onParams({ contrast: v }, live)} />
      <Slider label="Bão hoà" min={-100} max={100} value={pr.saturation} onChange={(v, live) => p.onParams({ saturation: v }, live)} />

      <Divider label="Cân bằng trắng" />
      <Slider label="Nhiệt độ (lạnh↔ấm)" min={-100} max={100} value={pr.temperature} onChange={(v, live) => p.onParams({ temperature: v }, live)} />
      <Slider label="Tint (lá↔hồng)" min={-100} max={100} value={pr.tint} onChange={(v, live) => p.onParams({ tint: v }, live)} />

      <Divider label="Levels" />
      <Slider label="Điểm đen" min={0} max={254} value={pr.blackPoint} onChange={(v, live) => p.onParams({ blackPoint: Math.min(v, pr.whitePoint - 1) }, live)} />
      <Slider label="Điểm trắng" min={1} max={255} value={pr.whitePoint} onChange={(v, live) => p.onParams({ whitePoint: Math.max(v, pr.blackPoint + 1) }, live)} />
      <Slider label="Gamma" min={0.1} max={3} step={0.01} value={pr.gamma} onChange={(v, live) => p.onParams({ gamma: v }, live)} />

      <Divider label="HSL" />
      <Slider label="Xoay Hue" min={-180} max={180} value={pr.hueShift} onChange={(v, live) => p.onParams({ hueShift: v }, live)} />

      <Divider label="Curves" />
      <CurveEditor curve={pr.curve} onChange={(c, live) => p.onParams({ curve: c }, live)} />
    </div>
  );
}

function Slider(props: {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number, live: boolean) => void;
}) {
  return (
    <label style={{ fontSize: 11.5, color: 'var(--t3)', display: 'block' }}>
      <span style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>{props.label}</span>
        <span style={{ color: 'var(--t4)' }}>{round(props.value)}</span>
      </span>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step ?? 1}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value), true)}
        onPointerUp={(e) => props.onChange(Number((e.target as HTMLInputElement).value), false)}
        style={{ width: '100%' }}
      />
    </label>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
      <span style={{ fontSize: 10.5, color: 'var(--t4)', letterSpacing: 0.4, textTransform: 'uppercase' }}>{label}</span>
      <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  );
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * CurveEditor — mini editor đường cong luminance. Kéo điểm giữa (midtone) đơn giản:
 * 3 điểm (đen, giữa kéo được, trắng). Đủ để nâng/hạ midtone kiểu S-curve nhẹ.
 */
function CurveEditor({
  curve,
  onChange,
}: {
  curve: CurvePoint[];
  onChange: (c: CurvePoint[], live: boolean) => void;
}) {
  const SIZE = 150;
  // lấy điểm giữa nếu có (thứ 2), không thì mặc định (128,128)
  const mid = curve.length >= 3 ? curve[1] : { x: 128, y: 128 };

  function handle(e: React.PointerEvent) {
    const rect = (e.currentTarget as SVGElement).getBoundingClientRect();
    const x = clamp(((e.clientX - rect.left) / rect.width) * 255, 8, 247);
    const y = clamp(255 - ((e.clientY - rect.top) / rect.height) * 255, 0, 255);
    onChange(
      [
        { x: 0, y: 0 },
        { x: Math.round(x), y: Math.round(y) },
        { x: 255, y: 255 },
      ],
      true,
    );
  }

  const px = (v: number) => (v / 255) * SIZE;
  const py = (v: number) => SIZE - (v / 255) * SIZE;

  return (
    <div>
      <svg
        width={SIZE}
        height={SIZE}
        style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, touchAction: 'none' }}
        onPointerDown={(e) => {
          (e.currentTarget as SVGElement).setPointerCapture(e.pointerId);
          handle(e);
        }}
        onPointerMove={(e) => {
          if (e.buttons) handle(e);
        }}
        onPointerUp={() => onChange([{ x: 0, y: 0 }, { ...mid }, { x: 255, y: 255 }], false)}
      >
        {/* lưới */}
        {[0.25, 0.5, 0.75].map((f) => (
          <g key={f}>
            <line x1={f * SIZE} y1={0} x2={f * SIZE} y2={SIZE} stroke="var(--border)" strokeWidth={0.5} />
            <line x1={0} y1={f * SIZE} x2={SIZE} y2={f * SIZE} stroke="var(--border)" strokeWidth={0.5} />
          </g>
        ))}
        {/* đường chéo tham chiếu */}
        <line x1={0} y1={SIZE} x2={SIZE} y2={0} stroke="var(--border-strong, var(--border))" strokeWidth={0.5} />
        {/* đường cong 3 điểm (quadratic qua mid) */}
        <path
          d={`M ${px(0)} ${py(0)} Q ${px(mid.x)} ${py(mid.y)} ${px(255)} ${py(255)}`}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={1.5}
        />
        <circle cx={px(mid.x)} cy={py(mid.y)} r={5} fill="var(--accent)" />
      </svg>
      <button
        type="button"
        onClick={() => onChange([{ x: 0, y: 0 }, { x: 255, y: 255 }], false)}
        style={{
          marginTop: 6,
          fontSize: 11,
          padding: '4px 8px',
          borderRadius: 6,
          border: '1px solid var(--border)',
          background: 'var(--field)',
          color: 'var(--t3)',
          cursor: 'pointer',
        }}
      >
        Reset cong
      </button>
    </div>
  );
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
