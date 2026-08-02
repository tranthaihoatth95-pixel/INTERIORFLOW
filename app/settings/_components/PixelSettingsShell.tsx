'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, LogOut } from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import { AiDependencySettings } from '@/components/settings/AiDependencySettings';
import { GuModelSettings } from '@/components/settings/GuModelSettings';
import { ExperienceSettings } from '@/components/settings/ExperienceSettings';
import { RawStyle } from '@/components/filemanager/RawStyle';
import { SETTINGS_MOCK_CSS } from '../_lib/settings-mock-css';
import { useSettingsLocalState } from '../_lib/local-state';
import { CanvasWallpaper } from './CanvasWallpaper';
import { ProfileCard } from './ProfileCard';
import { AppearanceCard } from './AppearanceCard';
import { StorageCard } from './StorageCard';

/**
 * VẬT MẪU mock-settings-polished.html — port markup/CSS 1:1 (xem settings-mock-css.ts). Icon =
 * lucide-react (docs/LUAT-GIAO-DIEN-BAT-BUOC.md L4), không glyph. AI/Gu/Trải nghiệm (mock không
 * vẽ) dời xuống khu "Nâng cao" — tính năng thật, KHÔNG xoá (L6).
 */
export function PixelSettingsShell() {
  const router = useRouter();
  const user = useFlowStore((s) => s.user);
  const setUser = useFlowStore((s) => s.setUser);
  const { state, setWallpaper, setReducedMotion, setAutoBackup } = useSettingsLocalState();

  return (
    <div className="if-settings-outer">
      <RawStyle css={SETTINGS_MOCK_CSS} />
      <CanvasWallpaper />
      <div className="if-settings-app">
        {/* Rail (`components/LeftRail.tsx`) — XOÁ 03/08: `/settings` nay bọc trong `<AppShell>`
            (`app/settings/page.tsx`), Navigator = `SettingsNavigator` (nhảy neo tới từng nhóm,
            id khớp `#group-*` dưới đây). */}

        <div className="main">
          <button type="button" className="backlink" onClick={() => router.back()}>
            <ArrowLeft size={13} /> Quay lại
          </button>

          <h1>Cài đặt</h1>
          <div className="sub">Tài khoản · giao diện · nơi lưu file — áp cho cả app, màu dự án vẫn thuộc Brand Kit</div>

          <div id="group-profile" className="cols" style={{ scrollMarginTop: 16 }}>
            <ProfileCard />
            <div id="group-appearance" style={{ display: 'contents' }}>
              <AppearanceCard wallpaper={state.wallpaper} onPickWallpaper={setWallpaper} />
            </div>
            <div id="group-storage" style={{ display: 'contents' }}>
              <StorageCard
                reducedMotion={state.reducedMotion}
                autoBackup={state.autoBackup}
                onToggleReducedMotion={() => setReducedMotion(!state.reducedMotion)}
                onToggleAutoBackup={() => setAutoBackup(!state.autoBackup)}
              />
            </div>
          </div>

          {user && (
            <button
              type="button"
              onClick={async () => {
                await fetch('/api/auth/me', { method: 'DELETE' });
                setUser(null);
                router.push('/');
              }}
              className="ghost"
              style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 7 }}
            >
              <LogOut size={13} /> Đăng xuất
            </button>
          )}

          <div id="group-advanced" style={{ marginTop: 32, maxWidth: 1000, scrollMarginTop: 16 }}>
            <h2 style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--t2)' }}>Nâng cao</h2>
            <p style={{ margin: '4px 0 12px', fontSize: 11, color: 'var(--t2)' }}>
              Chưa có trong bản mẫu pixel — giữ nguyên tính năng cũ, chưa đổi giao diện.
            </p>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <AiDependencySettings />
              <GuModelSettings />
              <ExperienceSettings />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
