'use client';

import { FileManagerShell } from '@/components/filemanager/FileManagerShell';
import { CanvasWallpaper } from '@/app/settings/_components/CanvasWallpaper';
import { LibrarySheet } from '@/components/library/LibrarySheet';

export default function FilesPage() {
  return (
    <>
      {/* Áp lại hình nền canvas đã lưu — xem app/settings/_lib/wallpaper.ts (render null). */}
      <CanvasWallpaper />
      <FileManagerShell />
      {/* `/files` dùng `LeftRail` nhưng KHÔNG qua `StageShell` (nơi sheet mount cho 3 chặng) —
          thiếu dòng này thì nút "Thư viện" ở rail bấm không ra gì. Chặng mặc định: dựng ảnh. */}
      <LibrarySheet stage="render" />
    </>
  );
}
