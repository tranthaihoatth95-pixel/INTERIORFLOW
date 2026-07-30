'use client';

/**
 * components/settings/AppearanceSettings.tsx — nhóm "Giao diện" của /settings (7.3.30, 30/07,
 * docs/TICKET-SETTINGS-GOM-CAU-HINH-2026-07-29.md §5). Sáng/Tối/Tự động đổi NHIỀU lần/phiên
 * (theo ánh sáng phòng, theo chặng) nên GIỮ nút nhanh ở Header/StudioBar/MobileMenu — đây là
 * nơi đặt CỐ ĐỊNH, không thay thế nút nhanh. Ngôn ngữ (đổi gần như không bao giờ trong 1
 * phiên) dời HẲN về đây — gỡ khỏi Header MoreMenu + MobileMenu.
 *
 * Chỗ trống dành cho `2.2.79` (mật độ hiển thị theo dải màn) — chưa code, xem
 * docs/IF-FEATURE-TREE.md mã đó.
 */

import { useFlowStore } from '@/lib/store';
import type { ThemePref } from '@/lib/store';
import { LangToggle } from '@/components/LangToggle';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const THEME_OPTIONS: { id: ThemePref; label: [string, string] }[] = [
  { id: 'auto', label: ['Tự động', 'Auto'] },
  { id: 'light', label: ['Sáng', 'Light'] },
  { id: 'dark', label: ['Tối', 'Dark'] },
];

export function AppearanceSettings() {
  const pref = useFlowStore((s) => s.themePref);
  const setThemePref = useFlowStore((s) => s.setThemePref);
  const tr = useT();

  return (
    <section>
      <h2 className="text-[15px] font-semibold text-[var(--t1)]">{tr('Giao diện', 'Appearance')}</h2>

      <div className="mt-4">
        <p className="text-[12.5px] text-[var(--t3)]">{tr('Sáng / Tối / Tự động', 'Light / Dark / Auto')}</p>
        <div className="mt-1.5 inline-flex rounded-[10px] border border-[var(--border)] bg-[var(--field)] p-0.5">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setThemePref(opt.id)}
              className={cn(
                'rounded-[8px] px-3 py-1.5 text-[12.5px] font-medium transition-colors',
                pref === opt.id
                  ? 'bg-[var(--card)] text-[var(--t1)] shadow-sm'
                  : 'text-[var(--t4)] hover:text-[var(--t2)]',
              )}
            >
              {tr(opt.label[0], opt.label[1])}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-3.5">
        <span className="text-[12.5px] text-[var(--t3)]">{tr('Ngôn ngữ', 'Language')}</span>
        <LangToggle />
      </div>
    </section>
  );
}
