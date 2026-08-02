'use client';

// app/settings/_lib/local-state.ts — phần Cài đặt CHƯA có nguồn thật (avatar quick-pick, hình
// nền canvas, 2 switch mới) — cục bộ localStorage, KHÔNG đụng lib/store.ts (theme/lang đã có
// nguồn thật ở đó, dùng thẳng useFlowStore, xem PixelSettingsShell.tsx). Theo mẫu
// lib/library/local-state.ts / lib/filemanager/local-state.ts (G4) — nhưng đặt trong
// app/settings/_lib (thư mục `_` không thành route) vì "lib/settings/**" không nằm trong vùng
// file cứng được giao (chỉ app/settings/** + components/filemanager/**).

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'interiorflow.settings_g4.local_state_v1';

export type WallpaperId = 'none' | 'dots' | 'grid' | 'warm' | 'cool';

interface LocalState {
  avatarSwatch: number;
  wallpaper: WallpaperId;
  reducedMotion: boolean;
  autoBackup: boolean;
}

const DEFAULTS: LocalState = { avatarSwatch: 0, wallpaper: 'dots', reducedMotion: false, autoBackup: true };

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

/** Áp hình nền lên canvas — ghi thuộc tính DOM để canvas thật đọc (chưa nối, xem BAO-CAO-FM.md). */
function applyWallpaperToDocument(id: WallpaperId): void {
  document.documentElement.setAttribute('data-canvas-wallpaper', id);
}

export function useSettingsLocalState() {
  const [state, setState] = useState<LocalState>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const next = readStorage();
    setState(next);
    applyWallpaperToDocument(next.wallpaper);
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
    applyWallpaperToDocument(id);
    mutate((prev) => ({ ...prev, wallpaper: id }));
  };
  const setReducedMotion = (v: boolean) => mutate((prev) => ({ ...prev, reducedMotion: v }));
  const setAutoBackup = (v: boolean) => mutate((prev) => ({ ...prev, autoBackup: v }));

  return { state, hydrated, setAvatarSwatch, setWallpaper, setReducedMotion, setAutoBackup };
}
