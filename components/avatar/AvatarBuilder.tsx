'use client';

/**
 * AvatarBuilder — editor 5 slot + preview realtime. Không phụ thuộc auth ở đây;
 * component nhận `value`/`onChange` để mỏng, dễ tái dùng (settings page hoặc signup modal).
 */

import { useState } from 'react';
import {
  AvatarConfig,
  BASE_TONES,
  HAIR_COLORS,
  HAIR_STYLES,
  GLASSES_STYLES,
  HAT_STYLES,
  SHIRT_STYLES,
  SHIRT_COLORS,
  DEFAULT_AVATAR,
  randomAvatarFromId,
} from '@/lib/avatar';
import { AvatarRenderer } from './AvatarRenderer';

interface Props {
  value?: AvatarConfig;
  onChange?: (a: AvatarConfig) => void;
  onSave?: (a: AvatarConfig) => Promise<void> | void;
  onSkip?: () => void;
  seedId?: string; // dùng khi Randomize
  saving?: boolean;
}

export function AvatarBuilder({ value, onChange, onSave, onSkip, seedId = 'seed', saving }: Props) {
  const [config, setConfig] = useState<AvatarConfig>(value ?? DEFAULT_AVATAR);

  const update = <K extends keyof AvatarConfig>(k: K, v: AvatarConfig[K]) => {
    const next = { ...config, [k]: v };
    setConfig(next);
    onChange?.(next);
  };

  const randomize = () => {
    const next = randomAvatarFromId(`${seedId}-${Date.now()}`);
    setConfig(next);
    onChange?.(next);
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '240px 1fr',
        gap: 32,
        padding: 24,
        background: '#FAF7F1',
        border: '1px solid #1B1512',
        borderRadius: 4,
        maxWidth: 720,
      }}
    >
      {/* Preview */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <AvatarRenderer config={config} size={200} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={randomize}
            style={btnStyle('ghost')}
          >
            Ngẫu nhiên · Random
          </button>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <SlotColorRow
          label="Tone da · Skin"
          items={[1, 2, 3, 4] as const}
          value={config.base}
          onChange={(v) => update('base', v as AvatarConfig['base'])}
          colorOf={(v) => BASE_TONES[v as AvatarConfig['base']]}
        />

        <SlotChipRow
          label="Kiểu tóc · Hair"
          items={HAIR_STYLES.map(String)}
          value={String(config.hair)}
          onChange={(v) => update('hair', Number(v) as AvatarConfig['hair'])}
        />

        <SlotColorRow
          label="Màu tóc · Hair color"
          items={Object.keys(HAIR_COLORS)}
          value={config.hairColor}
          onChange={(v) => update('hairColor', v as AvatarConfig['hairColor'])}
          colorOf={(v) => HAIR_COLORS[v as keyof typeof HAIR_COLORS]}
        />

        <SlotChipRow
          label="Kính · Glasses"
          items={GLASSES_STYLES}
          value={config.glasses}
          onChange={(v) => update('glasses', v as AvatarConfig['glasses'])}
        />

        <SlotChipRow
          label="Mũ / Tai nghe · Headwear"
          items={HAT_STYLES}
          value={config.hat}
          onChange={(v) => update('hat', v as AvatarConfig['hat'])}
        />

        <SlotChipRow
          label="Áo · Shirt"
          items={SHIRT_STYLES}
          value={config.shirt}
          onChange={(v) => update('shirt', v as AvatarConfig['shirt'])}
        />

        <SlotColorRow
          label="Màu áo · Shirt color"
          items={Object.keys(SHIRT_COLORS)}
          value={config.shirtColor}
          onChange={(v) => update('shirtColor', v as AvatarConfig['shirtColor'])}
          colorOf={(v) => SHIRT_COLORS[v as keyof typeof SHIRT_COLORS]}
        />

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          {onSave && (
            <button
              type="button"
              onClick={() => onSave(config)}
              disabled={saving}
              style={btnStyle('primary')}
            >
              {saving ? 'Đang lưu…' : 'Lưu · Save'}
            </button>
          )}
          {onSkip && (
            <button type="button" onClick={onSkip} style={btnStyle('ghost')}>
              Bỏ qua · Skip
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SlotChipRow({
  label,
  items,
  value,
  onChange,
}: {
  label: string;
  items: readonly string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div style={labelStyle}>{label}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {items.map((it) => (
          <button
            key={it}
            type="button"
            onClick={() => onChange(it)}
            style={chipStyle(it === value)}
          >
            {it}
          </button>
        ))}
      </div>
    </div>
  );
}

function SlotColorRow({
  label,
  items,
  value,
  onChange,
  colorOf,
}: {
  label: string;
  items: readonly (string | number)[];
  value: string | number;
  onChange: (v: string | number) => void;
  colorOf: (v: string | number) => string;
}) {
  return (
    <div>
      <div style={labelStyle}>{label}</div>
      <div style={{ display: 'flex', gap: 8 }}>
        {items.map((it) => (
          <button
            key={it}
            type="button"
            onClick={() => onChange(it)}
            aria-label={String(it)}
            style={{
              width: 28,
              height: 28,
              borderRadius: 3,
              background: colorOf(it),
              border: it === value ? '2px solid #F06020' : '1px solid #1B1512',
              cursor: 'pointer',
            }}
          />
        ))}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
  color: '#002850',
  marginBottom: 8,
  fontWeight: 500,
};

function chipStyle(active: boolean): React.CSSProperties {
  return {
    padding: '6px 10px',
    fontSize: 12,
    background: active ? '#002850' : 'transparent',
    color: active ? '#F1ECE3' : '#1B1512',
    border: '1px solid #1B1512',
    borderRadius: 3,
    cursor: 'pointer',
    textTransform: 'lowercase',
  };
}

function btnStyle(variant: 'primary' | 'ghost'): React.CSSProperties {
  if (variant === 'primary') {
    return {
      padding: '10px 20px',
      background: '#F06020',
      color: '#F1ECE3',
      border: 'none',
      borderRadius: 3,
      cursor: 'pointer',
      fontSize: 13,
      letterSpacing: '0.08em',
    };
  }
  return {
    padding: '10px 20px',
    background: 'transparent',
    color: '#1B1512',
    border: '1px solid #1B1512',
    borderRadius: 3,
    cursor: 'pointer',
    fontSize: 13,
  };
}
