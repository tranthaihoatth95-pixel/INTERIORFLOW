'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, LogOut } from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import { AiDependencySettings } from '@/components/settings/AiDependencySettings';
import { GuModelSettings } from '@/components/settings/GuModelSettings';
import { ExperienceSettings } from '@/components/settings/ExperienceSettings';
import { AppRail } from '@/components/filemanager/AppRail';
import { FM, FmThemeVars } from '@/components/filemanager/fm-tokens';
import { useT } from '@/lib/i18n';
import { useSettingsLocalState } from '../_lib/local-state';
import { ProfileCard } from './ProfileCard';
import { AppearanceCard } from './AppearanceCard';
import { StorageCard } from './StorageCard';

/**
 * VẬT MẪU mock-settings-polished.html — làm giống hệt 3 card (Hồ sơ · Giao diện · Nơi lưu+khác).
 * AI/Gu (AiDependencySettings·GuModelSettings) KHÔNG có trong mock (mock chỉ vẽ 4 nhóm Hoà nêu)
 * nhưng là tính năng THẬT đang hoạt động ở /settings cũ — GIỮ LẠI dưới mục "Nâng cao" riêng thay
 * vì xoá âm thầm (đúng luật CLAUDE.md "tính năng thừa → cắt, ghi vào STATUS, không xoá âm thầm";
 * ở đây không phải thừa, chỉ ngoài phạm vi mock nên tách khu, không xoá).
 */
export function PixelSettingsShell() {
  const router = useRouter();
  const tr = useT();
  const user = useFlowStore((s) => s.user);
  const setUser = useFlowStore((s) => s.setUser);
  const { state, setAvatarSwatch, setWallpaper, setReducedMotion, setAutoBackup } = useSettingsLocalState();

  return (
    <div className="flex h-dvh w-full" style={{ background: FM.bg, color: FM.ink, fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif' }}>
      <FmThemeVars />
      <AppRail active="settings" />

      <main className="flex-1 overflow-auto py-[26px] pl-2.5 pr-[34px]">
        <button type="button" onClick={() => router.back()} className="mb-3 flex items-center gap-1.5 text-[12px]" style={{ color: FM.mut }}>
          <ArrowLeft size={14} /> {tr('Quay lại', 'Back')}
        </button>

        <h1 className="m-0 text-[22px]" style={{ letterSpacing: '-0.02em' }}>{tr('Cài đặt', 'Settings')}</h1>
        <p className="mt-[3px] text-[12px]" style={{ color: FM.mut }}>
          {tr('Tài khoản · giao diện · nơi lưu file — áp cho cả app, màu dự án vẫn thuộc Brand Kit', 'Account · appearance · file location — app-wide, project color still lives in the Brand Kit')}
        </p>

        <div className="mt-[22px] grid max-w-[1000px] grid-cols-2 gap-4">
          <ProfileCard swatch={state.avatarSwatch} onPickSwatch={setAvatarSwatch} />
          <AppearanceCard wallpaper={state.wallpaper} onPickWallpaper={setWallpaper} />
          <StorageCard
            reducedMotion={state.reducedMotion}
            autoBackup={state.autoBackup}
            onToggleReducedMotion={() => setReducedMotion(!state.reducedMotion)}
            onToggleAutoBackup={() => setAutoBackup(!state.autoBackup)}
          />
        </div>

        {user && (
          <button
            type="button"
            onClick={async () => {
              await fetch('/api/auth/me', { method: 'DELETE' });
              setUser(null);
              router.push('/');
            }}
            className="mt-4 flex max-w-[1000px] items-center gap-2 rounded-xl border px-3.5 py-2.5 text-[12.5px]"
            style={{ borderColor: FM.line, background: FM.panel, color: '#3a3a42' }}
          >
            <LogOut size={14} /> {tr('Đăng xuất', 'Sign out')}
          </button>
        )}

        <div className="mt-8 max-w-[1000px]">
          <h2 className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: FM.mut }}>{tr('Nâng cao', 'Advanced')}</h2>
          <p className="mb-3 mt-1 text-[11px]" style={{ color: FM.mut }}>
            {tr('Chưa có trong bản mẫu pixel — giữ nguyên tính năng cũ, chưa đổi giao diện.', 'Not covered by the pixel mock yet — kept as-is, visual style unchanged.')}
          </p>
          <div className="flex flex-col gap-5 rounded-2xl p-[18px]" style={{ background: FM.panel, border: `1px solid ${FM.line}`, boxShadow: FM.shadowSoft }}>
            <AiDependencySettings />
            <GuModelSettings />
            <ExperienceSettings />
          </div>
        </div>
      </main>
    </div>
  );
}
