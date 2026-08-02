'use client';

import { useState } from 'react';
import { AppShell } from '@/components/studio/AppShell';
import { FilesNavigator } from '@/components/filemanager/FilesNavigator';
import { FileManagerShell } from '@/components/filemanager/FileManagerShell';
import { CanvasWallpaper } from '@/app/settings/_components/CanvasWallpaper';
import { useT } from '@/lib/i18n';

/**
 * /files — Hoà chỉ đạo 03/08: rail capsule PHẢI biến mất khỏi CẢ app, không chỉ 3 chặng
 * (`components/LeftRail.tsx` dùng chung sẽ xoá — grep 0 tham chiếu trước khi xoá). `/files`
 * nay bọc trong CÙNG `<AppShell>` như CAD/Render/Present — Navigator = cây thư mục
 * (`FilesNavigator`), `currentFolderId` sống Ở ĐÂY (nguồn chung cho cả Navigator lẫn
 * `FileManagerShell`, trước đây là state riêng bên trong shell — xem `FileManagerShell.tsx`).
 *
 * `active="render"` — `/files` không phải 1 trong 3 chặng, mặc định về Render (khớp
 * `LeftRail` cũ: `active = 'render'`) để segmented control có nghĩa khi bấm quay lại canvas.
 */
export default function FilesPage() {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const tr = useT();

  return (
    <>
      <CanvasWallpaper />
      <AppShell
        active="render"
        navigator={<FilesNavigator currentFolderId={currentFolderId} onSelect={setCurrentFolderId} />}
        navigatorAddLabel={tr('Thư mục mới', 'New folder')}
      >
        <div className="min-h-0 flex-1 overflow-y-auto">
          <FileManagerShell currentFolderId={currentFolderId} onSelectFolder={setCurrentFolderId} />
        </div>
      </AppShell>
    </>
  );
}
