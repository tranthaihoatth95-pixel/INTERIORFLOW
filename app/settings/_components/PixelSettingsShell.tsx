'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, LogOut, LayoutGrid, FolderKanban, FolderOpen, LibraryBig, Settings as SettingsIcon } from 'lucide-react';
import { useFlowStore } from '@/lib/store';
import { UserAvatar } from '@/components/avatar/UserAvatar';
import { AiDependencySettings } from '@/components/settings/AiDependencySettings';
import { GuModelSettings } from '@/components/settings/GuModelSettings';
import { ExperienceSettings } from '@/components/settings/ExperienceSettings';
import { RawStyle } from '@/components/filemanager/RawStyle';
import { SETTINGS_MOCK_CSS } from '../_lib/settings-mock-css';
import { useSettingsLocalState } from '../_lib/local-state';
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
      <div className="if-settings-app">
        <div className="rail">
          <div className="railcap">
            <Link href="/" className="ri" aria-label="Dashboard"><LayoutGrid size={17} /><span className="tip">Dashboard</span></Link>
            <span className="ri" aria-label="Dự án" title="Chưa có trang riêng"><FolderKanban size={17} /><span className="tip">Dự án</span></span>
            <Link href="/files" className="ri" aria-label="Files"><FolderOpen size={17} /><span className="tip">Files</span></Link>
            <Link href="/library" className="ri" aria-label="Master Library"><LibraryBig size={17} /><span className="tip">Master Library</span></Link>
            <div className="sep" />
            <Link href="/settings" className="ri on" aria-label="Cài đặt"><SettingsIcon size={17} /><span className="tip">Cài đặt</span></Link>
          </div>
          <div className="bottom">
            <span className="bigav"><UserAvatar id={user?.id} avatar={user?.avatar} name={user?.name} size={40} frame={false} /></span>
          </div>
        </div>

        <div className="main">
          <button type="button" className="backlink" onClick={() => router.back()}>
            <ArrowLeft size={13} /> Quay lại
          </button>

          <h1>Cài đặt</h1>
          <div className="sub">Tài khoản · giao diện · nơi lưu file — áp cho cả app, màu dự án vẫn thuộc Brand Kit</div>

          <div className="cols">
            <ProfileCard />
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
              className="ghost"
              style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 7 }}
            >
              <LogOut size={13} /> Đăng xuất
            </button>
          )}

          <div style={{ marginTop: 32, maxWidth: 1000 }}>
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
