'use client';

// app/settings/_lib/local-state.ts — phần Cài đặt CHƯA có nguồn thật (avatar quick-pick, hình
// nền canvas, 2 switch mới) — cục bộ localStorage, KHÔNG đụng lib/store.ts (theme/lang đã có
// nguồn thật ở đó, dùng thẳng useFlowStore, xem PixelSettingsShell.tsx). Theo mẫu
// lib/library/local-state.ts / lib/filemanager/local-state.ts (G4) — nhưng đặt trong
// app/settings/_lib (thư mục `_` không thành route) vì "lib/settings/**" không nằm trong vùng
// file cứng được giao (chỉ app/settings/** + components/filemanager/**).

import { useEffect, useState } from 'react';
import { applyWallpaper, readStoredWallpaper, type WallpaperId } from './wallpaper';

const STORAGE_KEY = 'interiorflow.settings_g4.local_state_v1';

export type { WallpaperId };

interface LocalState {
  avatarSwatch: number;
  wallpaper: WallpaperId;
  reducedMotion: boolean;
  autoBackup: boolean;
}

const DEFAULTS: LocalState = { avatarSwatch: 0, wallpaper: 'none', reducedMotion: false, autoBackup: true };

function readStorage(): LocalState {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<LocalState>) };
  } catch {
    return DEFAULTS;
  }
}

export function useSettingsLocalState() {
  const [state, setState] = useState<LocalState>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Hình nền có KHOÁ LƯU RIÊNG (`wallpaper.ts`) vì canvas phải đọc được nó mà không cần kéo
    // theo cả cục state Cài đặt — đọc từ đó làm chuẩn, không lấy bản trong cục state cũ.
    const next = { ...readStorage(), wallpaper: readStoredWallpaper() };
    setState(next);
    applyWallpaper(next.wallpaper, false);
    setHydrated(true);
  }, []);

  const mutate = (fn: (prev: LocalState) => LocalState) => {
    setState((prev) => {
      const next = fn(prev);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // quota/private-mode — mock không cần bền tuyệt đối
      }
      return next;
    });
  };

  const setAvatarSwatch = (i: number) => mutate((prev) => ({ ...prev, avatarSwatch: i }));
  const setWallpaper = (id: WallpaperId) => {
    applyWallpaper(id); // áp NGAY lên canvas + tự ghi localStorage (khoá riêng)
    mutate((prev) => ({ ...prev, wallpaper: id }));
  };
  const setReducedMotion = (v: boolean) => mutate((prev) => ({ ...prev, reducedMotion: v }));
  const setAutoBackup = (v: boolean) => mutate((prev) => ({ ...prev, autoBackup: v }));

  return { state, hydrated, setAvatarSwatch, setWallpaper, setReducedMotion, setAutoBackup };
}
