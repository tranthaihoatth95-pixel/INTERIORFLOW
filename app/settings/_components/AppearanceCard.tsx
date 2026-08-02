'use client';

import { Check, SunMoon } from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import type { ThemePref } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { WALLPAPERS, type WallpaperId } from '../_lib/wallpaper';

const THEME_CARDS: { id: ThemePref; label: [string, string]; preview: string; inner: string }[] = [
  { id: 'light', label: ['Sáng', 'Light'], preview: '#edebe7', inner: '#fff' },
  { id: 'dark', label: ['Tối', 'Dark'], preview: '#1c1c20', inner: '#2a2a30' },
  { id: 'auto', label: ['Theo hệ thống', 'System'], preview: 'linear-gradient(90deg,#edebe7 50%,#1c1c20 50%)', inner: 'linear-gradient(90deg,#fff 50%,#2a2a30 50%)' },
];

/**
 * Giao diện — docs/mocks/mock-settings-polished.html `.thgrid`/`.wpgrid`. Theme = THẬT
 * (useFlowStore.themePref/setThemePref, đã có dark theme chuẩn trong app/globals.css — không tự
 * chế bảng tối riêng). Kích thước cố định px trong `settings-mock-css.ts` (KHÔNG 1fr) — sửa bug
 * "avatar/preview phình" đã gặp.
 */
export function AppearanceCard({ wallpaper, onPickWallpaper }: { wallpaper: WallpaperId; onPickWallpaper: (id: WallpaperId) => void }) {
  const pref = useFlowStore((s) => s.themePref);
  const setThemePref = useFlowStore((s) => s.setThemePref);
  const tr = useT();

  return (
    <div className="card">
      <h3><SunMoon size={15} /> {tr('Giao diện', 'Appearance')}</h3>
      <div className="hint">{tr('Theme áp cho CẢ APP · màu thương hiệu dự án nằm ở Brand Kit', 'Theme applies to the WHOLE app · project brand color lives in the Brand Kit')}</div>

      <div className="thgrid">
        {THEME_CARDS.map((t) => {
          const sel = pref === t.id;
          return (
            <button type="button" key={t.id} className={sel ? 'th sel' : 'th'} onClick={() => setThemePref(t.id)}>
              <div className="prev" style={{ background: t.preview }}>
                <div className="mb" style={{ background: t.inner, border: t.id === 'light' ? '1px solid #e4e1db' : undefined }} />
                {sel && <span className="tick"><Check size={10} /></span>}
              </div>
              <div className="lb">{tr(t.label[0], t.label[1])}</div>
            </button>
          );
        })}
      </div>

      <div className="hint" style={{ margin: '14px 0 8px' }}>
        {tr('Hình nền canvas — áp cho canvas cả 3 chặng', 'Canvas wallpaper — applies to all 3 stages')}
      </div>
      <div className="wpgrid">
        {WALLPAPERS.map((w) => (
          <button
            type="button"
            key={w.id}
            className={`wp${wallpaper === w.id ? ' sel' : ''}${w.swatch ? '' : ' none'}`}
            style={w.swatch ? { background: w.swatch } : undefined}
            onClick={() => onPickWallpaper(w.id)}
            aria-pressed={wallpaper === w.id}
            title={tr(w.label[0], w.label[1])}
          >
            {w.swatch ? '' : tr(w.label[0], w.label[1])}
          </button>
        ))}
      </div>
    </div>
  );
}
