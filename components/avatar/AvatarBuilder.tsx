'use client';

/**
 * AvatarBuilder — VIỆC 3 (`docs/CHOT-AVATAR-MEMOJI-2026-08-02.md` §3/§3c): PORT NGUYÊN VĂN
 * `docs/mocks/mock-avatar-picker-v2.html` (vật mẫu pixel, LUẬT L3 "mock là hợp đồng"). Thay
 * hẳn bản cũ dùng nút SỐ "1..16" + chữ suông "hoodie/len" — mọi lựa chọn giờ là THUMBNAIL VẼ
 * THẬT: `<AvatarRenderer size={62}>` render đúng đặc điểm đang xét trên cùng khuôn mặt hiện
 * tại (rẻ — filter nỉ đã bỏ, mỗi thumbnail chỉ là SVG gradient thuần).
 *
 * Bố cục mock: sheet bo 28 grid 300px|1fr — TRÁI preview 172 + hàng cỡ thật 44/28/20 + Ngẫu
 * nhiên/Xong · PHẢI tabs icon (Khuôn mặt · Tóc · Kính · Mũ · Áo · Biểu cảm) + nhóm nội dung.
 * Màu = chấm tròn 34px, chọn = viền accent + halo accent-soft. Icon tab dùng SVG stroke 1.75
 * port nguyên văn từ mock (phong cách lucide, mock tự vẽ vì có hình không tồn tại trong bộ
 * lucide — vd "tóc"). Hover ô 1.04/150ms qua CSS transition, `prefers-reduced-motion` tắt
 * (khối <style> port từ mock, đúng media query gốc).
 *
 * Ánh xạ 13 slot config → 6 tab (mock chỉ minh hoạ 1 tab, phần chia slot là quyết định port —
 * theo ngữ nghĩa gần nhất): Khuôn mặt = tông da · tàn nhang · má ửng · khuyên tai · nền ·
 * Tóc = kiểu + màu · Kính · Mũ · Áo = kiểu + màu + phụ kiện · Biểu cảm.
 */

import { useMemo, useState, type ReactNode } from 'react';
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
  SHIRT_COLORS,
  SHIRT_COLOR_KEYS,
  SHIRT_STYLES,
  SKIN_TONES,
  randomAvatarFromId,
} from '@/lib/avatar';
import { AvatarRenderer } from './AvatarRenderer';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface Props {
  value?: AvatarConfig;
  onChange?: (a: AvatarConfig) => void;
  onSave?: (a: AvatarConfig) => Promise<void> | void;
  onSkip?: () => void;
  seedId?: string; // dùng khi Randomize
  saving?: boolean;
}

type TabId = 'face' | 'hair' | 'glasses' | 'hat' | 'shirt' | 'expression';

/* Icon tab — SVG port NGUYÊN VĂN từ mock (viewBox 24, stroke 1.75, round caps). */
const TAB_ICONS: Record<TabId, ReactNode> = {
  face: (
    <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></svg>
  ),
  hair: (
    <svg viewBox="0 0 24 24"><path d="M4 13a8 8 0 0116 0" /><path d="M4 13v4M20 13v4" /><path d="M8 5c2-2 6-2 8 0" /></svg>
  ),
  glasses: (
    <svg viewBox="0 0 24 24"><circle cx="7" cy="13" r="3.2" /><circle cx="17" cy="13" r="3.2" /><path d="M10.2 13h3.6M2.5 11.5L4 11M21.5 11.5L20 11" /></svg>
  ),
  hat: (
    <svg viewBox="0 0 24 24"><path d="M3 14h18" /><path d="M6 14a6 6 0 0112 0" /></svg>
  ),
  shirt: (
    <svg viewBox="0 0 24 24"><path d="M8 4l4 3 4-3 4 3v14H4V7z" /></svg>
  ),
  expression: (
    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M9 14c1.6 1.4 4.4 1.4 6 0M9 10h.01M15 10h.01" /></svg>
  ),
};

export function AvatarBuilder({ value, onChange, onSave, onSkip, seedId = 'seed', saving }: Props) {
  const [config, setConfig] = useState<AvatarConfig>(value ?? DEFAULT_AVATAR);
  const [tab, setTab] = useState<TabId>('face');
  const tr = useT();

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

  const TABS: { id: TabId; label: string }[] = useMemo(
    () => [
      { id: 'face', label: tr('Khuôn mặt', 'Face') },
      { id: 'hair', label: tr('Tóc', 'Hair') },
      { id: 'glasses', label: tr('Kính', 'Glasses') },
      { id: 'hat', label: tr('Mũ', 'Hat') },
      { id: 'shirt', label: tr('Áo', 'Outfit') },
      { id: 'expression', label: tr('Biểu cảm', 'Expression') },
    ],
    [tr],
  );

  /* Ô thumbnail = avatar THẬT với đúng 1 đặc điểm override — cấm số, cấm chữ suông (mock). */
  const Opt = <K extends keyof AvatarConfig>({ k, v }: { k: K; v: AvatarConfig[K] }) => {
    const active = config[k] === v;
    return (
      <button
        type="button"
        onClick={() => update(k, v)}
        aria-pressed={active}
        className={cn('if-avb-opt', active && 'on')}
      >
        <span className="if-avb-thumb">
          <AvatarRenderer config={{ ...config, [k]: v }} size={62} frame={false} />
        </span>
      </button>
    );
  };

  const Dot = <K extends keyof AvatarConfig>({ k, v, color }: { k: K; v: AvatarConfig[K]; color: string }) => (
    <button
      type="button"
      onClick={() => update(k, v)}
      aria-pressed={config[k] === v}
      className={cn('if-avb-dot', config[k] === v && 'on')}
      style={{ background: color }}
    />
  );

  const Group = ({ title, children }: { title: string; children: ReactNode }) => (
    <div className="if-avb-grp">
      <h3>{title}</h3>
      {children}
    </div>
  );

  return (
    <div className="if-avb-sheet">
      {/* CSS port nguyên văn từ mock (đổi tên class có tiền tố if-avb-, giá trị giữ nguyên).
          Token radius dùng số thật của mock (28/20/14/10) — khớp thang bo góc app 10/14/20/28. */}
      <style>{`
        .if-avb-sheet{background:var(--panel);border:1px solid var(--border);border-radius:28px;
          box-shadow:0 8px 30px -8px rgba(40,38,35,.22);overflow:hidden;display:grid;grid-template-columns:300px 1fr;max-width:1000px;width:100%}
        .if-avb-left{padding:26px 22px;border-right:1px solid var(--border);display:flex;flex-direction:column;align-items:center;gap:16px;background:var(--card)}
        .if-avb-preview{width:172px;height:172px;border-radius:50%;background:var(--field);border:1px solid var(--border);overflow:hidden;display:flex;align-items:flex-start;justify-content:center}
        .if-avb-sizes{display:flex;align-items:flex-end;gap:12px}
        .if-avb-sz{border-radius:50%;background:var(--field);border:1px solid var(--border);overflow:hidden;display:flex;align-items:flex-start;justify-content:center}
        .if-avb-szlb{font-size:10px;color:var(--t3);text-align:center;margin-top:5px}
        .if-avb-leftbtns{display:flex;flex-direction:column;gap:8px;width:100%;margin-top:auto}
        .if-avb-btn{border-radius:14px;height:40px;font-size:14px;font-weight:600;border:1px solid var(--border);
          background:var(--panel);color:var(--t1);cursor:pointer;transition:background .18s cubic-bezier(.32,.72,0,1)}
        .if-avb-btn:hover{background:var(--hover)}
        .if-avb-btn.primary{background:var(--accent);color:#fff;border-color:transparent}
        .if-avb-btn:disabled{opacity:.5;cursor:default}
        .if-avb-right{padding:18px 22px 24px;min-width:0}
        .if-avb-tabs{display:flex;gap:4px;overflow-x:auto;padding-bottom:12px;border-bottom:1px solid var(--border);scrollbar-width:none}
        .if-avb-tabs::-webkit-scrollbar{display:none}
        .if-avb-tab{flex:none;display:flex;flex-direction:column;align-items:center;gap:5px;padding:8px 14px;border-radius:14px;
          background:transparent;border:0;color:var(--t3);font-size:11px;cursor:pointer;transition:background .18s cubic-bezier(.32,.72,0,1)}
        .if-avb-tab:hover{background:var(--hover)}
        .if-avb-tab.on{background:var(--field);color:var(--t1);font-weight:600}
        .if-avb-tab svg{width:20px;height:20px;stroke:currentColor;fill:none;stroke-width:1.75;stroke-linecap:round;stroke-linejoin:round}
        .if-avb-grp{margin-top:18px}
        .if-avb-grp h3{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--t3);margin:0 0 10px;font-weight:700}
        .if-avb-dots{display:flex;gap:10px;flex-wrap:wrap}
        .if-avb-dot{width:34px;height:34px;border-radius:50%;border:2px solid transparent;cursor:pointer;position:relative;
          box-shadow:inset 0 0 0 1px rgba(0,0,0,.06);transition:transform .18s cubic-bezier(.32,.72,0,1);padding:0}
        .if-avb-dot:hover{transform:scale(1.04)}
        .if-avb-dot.on{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft), inset 0 0 0 1px rgba(0,0,0,.06)}
        .if-avb-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(84px,1fr));gap:10px}
        .if-avb-opt{aspect-ratio:1;border-radius:20px;background:var(--field);border:2px solid transparent;
          display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative;padding:0;
          transition:transform .18s cubic-bezier(.32,.72,0,1),border-color .18s cubic-bezier(.32,.72,0,1)}
        .if-avb-opt:hover{transform:scale(1.04)}
        .if-avb-opt.on{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
        .if-avb-thumb{width:62px;height:62px;border-radius:50%;background:var(--card);overflow:hidden;display:flex;align-items:flex-start;justify-content:center}
        @media (prefers-reduced-motion:reduce){.if-avb-sheet *{transition:none!important;transform:none!important}}
        @media (max-width:760px){.if-avb-sheet{grid-template-columns:1fr}.if-avb-left{border-right:0;border-bottom:1px solid var(--border)}}
      `}</style>

      {/* TRÁI — preview */}
      <div className="if-avb-left">
        <div className="if-avb-preview">
          <AvatarRenderer config={config} size={172} detail frame={false} />
        </div>
        <div>
          <div className="if-avb-sizes">
            {([44, 28, 20] as const).map((s) => (
              <div key={s}>
                <div className="if-avb-sz" style={{ width: s, height: s }}>
                  <AvatarRenderer config={config} size={s} frame={false} />
                </div>
                <div className="if-avb-szlb">{s}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="if-avb-leftbtns">
          <button type="button" className="if-avb-btn" onClick={randomize}>
            {tr('Ngẫu nhiên', 'Random')}
          </button>
          {onSkip && (
            <button type="button" className="if-avb-btn" onClick={onSkip}>
              {tr('Để sau', 'Skip')}
            </button>
          )}
          <button type="button" className="if-avb-btn primary" disabled={saving} onClick={() => onSave?.(config)}>
            {saving ? tr('Đang lưu…', 'Saving…') : tr('Xong', 'Done')}
          </button>
        </div>
      </div>

      {/* PHẢI — tabs + nhóm */}
      <div className="if-avb-right">
        <div className="if-avb-tabs" role="tablist">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={cn('if-avb-tab', tab === id && 'on')}
            >
              {TAB_ICONS[id]}
              {label}
            </button>
          ))}
        </div>

        {tab === 'face' && (
          <>
            <Group title={tr('Tông da', 'Skin tone')}>
              <div className="if-avb-dots">
                {SKIN_TONES.map((t) => (
                  <Dot key={t} k="base" v={t} color={BASE_TONES[t]} />
                ))}
              </div>
            </Group>
            <Group title={tr('Tàn nhang', 'Freckles')}>
              <div className="if-avb-grid">
                <Opt k="freckles" v={false} />
                <Opt k="freckles" v={true} />
              </div>
            </Group>
            <Group title={tr('Má ửng', 'Blush')}>
              <div className="if-avb-grid">
                {BLUSH_STYLES.map((b) => (
                  <Opt key={b} k="blush" v={b} />
                ))}
              </div>
            </Group>
            <Group title={tr('Khuyên tai', 'Earrings')}>
              <div className="if-avb-grid">
                {EARRING_STYLES.map((e) => (
                  <Opt key={e} k="earring" v={e} />
                ))}
              </div>
            </Group>
            <Group title={tr('Nền', 'Background')}>
              <div className="if-avb-dots">
                {BG_COLOR_KEYS.map((b) => (
                  <Dot key={b} k="bg" v={b} color={BG_COLORS[b]} />
                ))}
              </div>
            </Group>
          </>
        )}

        {tab === 'hair' && (
          <>
            <Group title={tr('Kiểu tóc', 'Hair style')}>
              <div className="if-avb-grid">
                {HAIR_STYLES.map((h) => (
                  <Opt key={h} k="hair" v={h} />
                ))}
              </div>
            </Group>
            <Group title={tr('Màu tóc', 'Hair color')}>
              <div className="if-avb-dots">
                {HAIR_COLOR_KEYS.map((c) => (
                  <Dot key={c} k="hairColor" v={c} color={HAIR_COLORS[c]} />
                ))}
              </div>
            </Group>
          </>
        )}

        {tab === 'glasses' && (
          <Group title={tr('Kính', 'Glasses')}>
            <div className="if-avb-grid">
              {GLASSES_STYLES.map((g) => (
                <Opt key={g} k="glasses" v={g} />
              ))}
            </div>
          </Group>
        )}

        {tab === 'hat' && (
          <Group title={tr('Mũ / tai nghe', 'Headwear')}>
            <div className="if-avb-grid">
              {HAT_STYLES.map((h) => (
                <Opt key={h} k="hat" v={h} />
              ))}
            </div>
          </Group>
        )}

        {tab === 'shirt' && (
          <>
            <Group title={tr('Kiểu áo', 'Outfit')}>
              <div className="if-avb-grid">
                {SHIRT_STYLES.map((s) => (
                  <Opt key={s} k="shirt" v={s} />
                ))}
              </div>
            </Group>
            <Group title={tr('Màu áo', 'Outfit color')}>
              <div className="if-avb-dots">
                {SHIRT_COLOR_KEYS.map((c) => (
                  <Dot key={c} k="shirtColor" v={c} color={SHIRT_COLORS[c]} />
                ))}
              </div>
            </Group>
            <Group title={tr('Phụ kiện', 'Accessory')}>
              <div className="if-avb-grid">
                {ACCESSORY_STYLES.map((a) => (
                  <Opt key={a} k="accessory" v={a} />
                ))}
              </div>
            </Group>
          </>
        )}

        {tab === 'expression' && (
          <Group title={tr('Biểu cảm', 'Expression')}>
            <div className="if-avb-grid">
              {EXPRESSION_STYLES.map((e) => (
                <Opt key={e} k="expression" v={e} />
              ))}
            </div>
          </Group>
        )}
      </div>
    </div>
  );
}
