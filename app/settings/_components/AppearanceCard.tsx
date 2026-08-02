'use client';

import { Check, Plus, SunMoon } from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import type { ThemePref } from '@/lib/store';
import { useT } from '@/lib/i18n';
import type { WallpaperId } from '../_lib/local-state';

const THEME_CARDS: { id: ThemePref; label: [string, string]; preview: string; inner: string }[] = [
  { id: 'light', label: ['Sáng', 'Light'], preview: '#edebe7', inner: '#fff' },
  { id: 'dark', label: ['Tối', 'Dark'], preview: '#1c1c20', inner: '#2a2a30' },
  { id: 'auto', label: ['Theo hệ thống', 'System'], preview: 'linear-gradient(90deg,#edebe7 50%,#1c1c20 50%)', inner: 'linear-gradient(90deg,#fff 50%,#2a2a30 50%)' },
];

const WALLPAPERS: { id: WallpaperId; bg?: string; label?: string }[] = [
  { id: 'none', label: 'Trơn' },
  { id: 'dots', bg: 'radial-gradient(circle at 1.5px 1.5px,#cdcac4 1px,transparent 0) 0 0/10px 10px,#edebe7' },
  { id: 'grid', bg: 'repeating-linear-gradient(0deg,#e8e5e0 0 1px,transparent 1px 12px),repeating-linear-gradient(90deg,#e8e5e0 0 1px,transparent 1px 12px),#edebe7' },
  { id: 'warm', bg: 'linear-gradient(135deg,#f2ede4,#e5ddd0)' },
  { id: 'cool', bg: 'linear-gradient(135deg,#e8ecf2,#d8dfe9)' },
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

      <div className="hint" style={{ margin: '14px 0 8px' }}>{tr('Hình nền canvas', 'Canvas wallpaper')}</div>
      <div className="wpgrid">
        {WALLPAPERS.map((w) => (
          <button
            type="button"
            key={w.id}
            className={`wp${wallpaper === w.id ? ' sel' : ''}${w.label ? ' none' : ''}`}
            style={w.bg ? { background: w.bg } : undefined}
            onClick={() => onPickWallpaper(w.id)}
          >
            {w.label}
          </button>
        ))}
        <button type="button" className="wp none" title={tr('Thêm hình nền tuỳ chỉnh — chưa nối', 'Add custom wallpaper — not wired yet')}><Plus size={14} /></button>
      </div>
    </div>
  );
}
