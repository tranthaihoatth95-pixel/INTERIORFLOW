'use client';

import { useFlowStore } from '@/lib/store';
import type { ThemePref } from '@/lib/store';
import { FM } from '@/components/filemanager/fm-tokens';
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
 * VẬT MẪU mock-settings-polished.html card "Giao diện" — 3 thẻ theme + lưới 6 hình nền.
 * Theme = THẬT (useFlowStore.themePref/setThemePref, đã có sẵn CSS var dark trong app + persist
 * localStorage qua store). Hình nền = state cục bộ, ghi `data-canvas-wallpaper` lên
 * `<html>` NGAY khi chọn (thật, xem `_lib/local-state.ts`) — canvas CAD/Render/Present chưa đọc
 * thuộc tính này (ngoài vùng file cứng G4), xem docs/BAO-CAO-FM.md mục "Cần nối tay".
 */
export function AppearanceCard({ wallpaper, onPickWallpaper }: { wallpaper: WallpaperId; onPickWallpaper: (id: WallpaperId) => void }) {
  const pref = useFlowStore((s) => s.themePref);
  const setThemePref = useFlowStore((s) => s.setThemePref);
  const tr = useT();

  return (
    <div className="rounded-2xl p-[18px]" style={{ background: FM.panel, border: `1px solid ${FM.line}`, boxShadow: FM.shadowSoft }}>
      <h3 className="m-0 mb-[3px] flex items-center gap-2 text-[13px]">◑ {tr('Giao diện', 'Appearance')}</h3>
      <p className="mb-3.5 text-[11px]" style={{ color: FM.mut }}>
        {tr('Theme áp cho CẢ APP · màu thương hiệu dự án nằm ở Brand Kit', 'Theme applies to the WHOLE app · project brand color lives in the Brand Kit')}
      </p>

      <div className="grid grid-cols-3 gap-2.5">
        {THEME_CARDS.map((t) => {
          const sel = pref === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setThemePref(t.id)}
              className="relative overflow-hidden rounded-[13px] border-2 text-left"
              style={{ borderColor: sel ? FM.accent : FM.line, boxShadow: sel ? `0 0 0 3px ${FM.accentSoft}` : 'none' }}
            >
              <div className="relative h-16" style={{ background: t.preview }}>
                <div className="absolute inset-2 rounded-lg" style={{ background: t.inner, border: t.id === 'light' ? `1px solid ${FM.line}` : undefined }} />
                {sel && (
                  <span className="absolute right-[7px] top-[7px] flex h-[17px] w-[17px] items-center justify-center rounded-full text-[10px] text-white" style={{ background: FM.accent }}>
                    ✓
                  </span>
                )}
              </div>
              <div className="p-[7px] text-center text-[11px] font-semibold">{tr(t.label[0], t.label[1])}</div>
            </button>
          );
        })}
      </div>

      <p className="mb-2 mt-3.5 text-[11px]" style={{ color: FM.mut }}>{tr('Hình nền canvas', 'Canvas wallpaper')}</p>
      <div className="grid grid-cols-6 gap-[9px]">
        {WALLPAPERS.map((w) => {
          const sel = wallpaper === w.id;
          if (w.id === 'none') {
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => onPickWallpaper(w.id)}
                className="flex items-center justify-center rounded-[10px] border-[1.5px] border-dashed text-[10px]"
                style={{ aspectRatio: '4/3', borderColor: sel ? FM.accent : FM.mut, color: FM.mut, background: FM.chip, boxShadow: sel ? `0 0 0 3px ${FM.accentSoft}` : 'none' }}
              >
                {w.label}
              </button>
            );
          }
          return (
            <button
              key={w.id}
              type="button"
              onClick={() => onPickWallpaper(w.id)}
              className="rounded-[10px] border-2"
              style={{ aspectRatio: '4/3', background: w.bg, borderColor: sel ? FM.accent : 'transparent', boxShadow: sel ? `0 0 0 3px ${FM.accentSoft}` : 'none' }}
            />
          );
        })}
        <button
          type="button"
          title={tr('Thêm hình nền tuỳ chỉnh — chưa nối', 'Add custom wallpaper — not wired yet')}
          className="flex items-center justify-center rounded-[10px] border-[1.5px] border-dashed text-[10px]"
          style={{ aspectRatio: '4/3', borderColor: FM.mut, color: FM.mut, background: FM.chip }}
        >
          ＋
        </button>
      </div>
    </div>
  );
}
