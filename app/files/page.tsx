'use client';

import { FileManagerShell } from '@/components/filemanager/FileManagerShell';
import { CanvasWallpaper } from '@/app/settings/_components/CanvasWallpaper';

export default function FilesPage() {
  return (
    <>
      {/* Áp lại hình nền canvas đã lưu — xem app/settings/_lib/wallpaper.ts (render null). */}
      <CanvasWallpaper />
      <FileManagerShell />
    </>
  );
}
