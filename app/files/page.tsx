'use client';

import { useState } from 'react';
import { AppShell } from '@/components/studio/AppShell';
import { FilesNavigator } from '@/components/filemanager/FilesNavigator';
import { FileManagerShell } from '@/components/filemanager/FileManagerShell';
import { CanvasWallpaper } from '@/app/settings/_components/CanvasWallpaper';
import { HaiNgan } from './_components/HaiNgan';
import { NganPhanTho } from './_components/NganPhanTho';
import { TepNguonDuAn } from '@/components/filemanager/TepNguonDuAn';
import { useT } from '@/lib/i18n';

/**
 * [marker: filesHaiNgan] 17/08 — Files có **HAI NGĂN KHÁC BẢN CHẤT** (Hoà chốt, hợp đồng §3):
 *   ① *Tệp dự án* — `FileManagerShell` như cũ, người trong dự án thấy.
 *   ② *Phần thô dùng chung* — nguyên liệu nhiều người góp, **chưa đủ định nghĩa để render**;
 *      đầu vào của dòng chảy `Files → cửa sổ công cụ → Thư viện` (`IF-KIEN-TRUC.md` §5).
 * Vỏ hai ngăn ở `_components/HaiNgan.tsx`; vì sao nó KHÔNG được là một bộ lọc: đọc docstring ở đó.
 *
 * `FilesNavigator` (cây thư mục) chỉ có nghĩa cho ngăn ①. Cố ý **KHÔNG ẩn nó** khi mở ngăn ②:
 * Navigator là bộ phận của vỏ `AppShell` dùng chung, ẩn/hiện theo ngăn sẽ thành "màn hình tự đổi
 * ý" — đúng thứ luật cấm auto-hide chặn. Ngăn ② tự mang đủ ngữ cảnh của nó trên thân.
 *
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
        navigatorCollapsedLabel={tr('Thư mục', 'Folders')}
      >
        <HaiNgan
          duAn={
            <div className="min-h-0 flex-1 overflow-y-auto">
              {/* 20/08 — khu Tệp nguồn dự án (ProjectFile server thật) đứng TRÊN cây thư mục đĩa:
                  mắt xích đầu của dòng chảy §5, xem docstring TepNguonDuAn.tsx. */}
              <TepNguonDuAn />
              <FileManagerShell currentFolderId={currentFolderId} onSelectFolder={setCurrentFolderId} />
            </div>
          }
          thoChung={
            <div className="min-h-0 flex-1 overflow-y-auto">
              <NganPhanTho />
            </div>
          }
        />
      </AppShell>
    </>
  );
}
