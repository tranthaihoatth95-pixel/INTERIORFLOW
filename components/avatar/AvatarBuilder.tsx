'use client';

/**
 * AvatarBuilder — editor đầy đủ 13 slot + preview realtime. Không phụ thuộc auth ở đây;
 * component nhận `value`/`onChange` để mỏng, dễ tái dùng (settings page hoặc signup modal).
 */

import { useState } from 'react';
import {
  AvatarConfig,
  ACCESSORY_STYLES,
  BASE_TONES,
  BG_COLORS,
  BG_COLOR_KEYS,
  BLUSH_STYLES,
  DEFAULT_AVATAR,
  EARRING_STYLES,
  EXPRESSION_STYLES,
  GLASSES_STYLES,
  HAIR_COLORS,
  HAIR_COLOR_KEYS,
  HAIR_STYLES,
  HAT_STYLES,
  LABELS,
  SHIRT_COLORS,
  SHIRT_COLOR_KEYS,
  SHIRT_STYLES,
  SKIN_TONES,
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
        maxWidth: 780,
      }}
    >
      {/* Preview */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ position: 'sticky', top: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <AvatarRenderer config={config} size={200} />
          {/* cỡ nhỏ — xem trước đúng cách avatar hiện trên header */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
            <AvatarRenderer config={config} size={48} />
            <AvatarRenderer config={config} size={28} />
          </div>
          <button type="button" onClick={randomize} style={btnStyle('ghost')}>
            Ngẫu nhiên · Random
          </button>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <SlotColorRow
          label="Tông da · Skin"
          items={SKIN_TONES}
          value={config.base}
          onChange={(v) => update('base', Number(v) as AvatarConfig['base'])}
          colorOf={(v) => BASE_TONES[v as AvatarConfig['base']]}
        />

        <SlotChipRow
          label="Kiểu tóc · Hair (16)"
          items={HAIR_STYLES.map(String)}
          value={String(config.hair)}
          onChange={(v) => update('hair', Number(v) as AvatarConfig['hair'])}
        />

        <SlotColorRow
          label="Màu tóc · Hair color"
          items={HAIR_COLOR_KEYS}
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
          items={SHIRT_COLOR_KEYS}
          value={config.shirtColor}
          onChange={(v) => update('shirtColor', v as AvatarConfig['shirtColor'])}
          colorOf={(v) => SHIRT_COLORS[v as keyof typeof SHIRT_COLORS]}
        />

        <SlotChipRow
          label="Biểu cảm · Expression"
          items={EXPRESSION_STYLES}
          value={config.expression}
          onChange={(v) => update('expression', v as AvatarConfig['expression'])}
        />

        <SlotChipRow
          label="Khuyên tai · Earring"
          items={EARRING_STYLES}
          value={config.earring}
          onChange={(v) => update('earring', v as AvatarConfig['earring'])}
        />

        <SlotChipRow
          label="Má ửng · Blush"
          items={BLUSH_STYLES}
          value={config.blush}
          onChange={(v) => update('blush', v as AvatarConfig['blush'])}
        />

        <SlotChipRow
          label="Phụ kiện · Accessory"
          items={ACCESSORY_STYLES}
          value={config.accessory}
          onChange={(v) => update('accessory', v as AvatarConfig['accessory'])}
        />

        <SlotColorRow
          label="Nền · Background"
          items={BG_COLOR_KEYS}
          value={config.bg}
          onChange={(v) => update('bg', v as AvatarConfig['bg'])}
          colorOf={(v) => BG_COLORS[v as keyof typeof BG_COLORS]}
        />

        <div>
          <div style={labelStyle}>Tàn nhang · Freckles</div>
          <button
            type="button"
            onClick={() => update('freckles', !config.freckles)}
            style={chipStyle(config.freckles)}
          >
            {config.freckles ? 'có' : 'không'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          {onSave && (
            <button type="button" onClick={() => onSave(config)} disabled={saving} style={btnStyle('primary')}>
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
          <button key={it} type="button" onClick={() => onChange(it)} style={chipStyle(it === value)}>
            {LABELS[it] ?? it}
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
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {items.map((it) => (
          <button
            key={it}
            type="button"
            onClick={() => onChange(it)}
            aria-label={String(it)}
            title={String(it)}
            style={{
              width: 28,
              height: 28,
              borderRadius: 3,
              background: colorOf(it),
              border: it === value ? '2px solid var(--accent)' : '1px solid #1B1512',
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
  color: 'var(--accent-strong)',
  marginBottom: 8,
  fontWeight: 500,
};

function chipStyle(active: boolean): React.CSSProperties {
  return {
    padding: '6px 10px',
    fontSize: 12,
    background: active ? 'var(--accent-strong)' : 'transparent',
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
      background: 'var(--accent)',
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
