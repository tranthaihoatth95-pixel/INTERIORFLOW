'use client';

/**
 * app/settings/_components/SettingsNavigator.tsx — danh sách nhóm cài đặt cho ổ ② Navigator
 * (Hoà chỉ đạo 03/08: "Navigator của /settings = danh sách nhóm cài đặt"). Nhảy neo tới từng
 * `id="group-*"` trong `PixelSettingsShell.tsx` — không state riêng, không route riêng (mọi
 * nhóm sống trên CÙNG 1 trang, khớp cách `PixelSettingsShell` đã dựng theo mock pixel).
 */

import { User, Palette, HardDrive, SlidersHorizontal } from 'lucide-react';
import { useT } from '@/lib/i18n';

const GROUPS = [
  { id: 'group-profile', icon: User, label: ['Hồ sơ', 'Profile'] as [string, string] },
  { id: 'group-appearance', icon: Palette, label: ['Giao diện', 'Appearance'] as [string, string] },
  { id: 'group-storage', icon: HardDrive, label: ['Nơi lưu file', 'Storage'] as [string, string] },
  { id: 'group-advanced', icon: SlidersHorizontal, label: ['Nâng cao', 'Advanced'] as [string, string] },
];

export function SettingsNavigator() {
  const tr = useT();
  return (
    <div className="px-1.5 py-1">
      {GROUPS.map((g) => (
        <button
          key={g.id}
          type="button"
          onClick={() => document.getElementById(g.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          className="flex h-[30px] w-full items-center gap-2.5 rounded-[8px] px-2 text-[12.5px] text-[var(--t2)] transition-colors duration-100 hover:bg-[var(--hover)] hover:text-[var(--t1)]"
        >
          <g.icon size={14} strokeWidth={1.75} className="shrink-0 text-[var(--t4)]" />
          {tr(g.label[0], g.label[1])}
        </button>
      ))}
    </div>
  );
}
