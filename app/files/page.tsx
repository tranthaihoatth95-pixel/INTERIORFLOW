'use client';

import { useState } from 'react';
import { AppShell } from '@/components/studio/AppShell';
import { FilesNavigator } from '@/components/filemanager/FilesNavigator';
import { FileManagerShell } from '@/components/filemanager/FileManagerShell';
import { CanvasWallpaper } from '@/app/settings/_components/CanvasWallpaper';
import { HaiTang } from './_components/HaiTang';
import { NganPhanTho } from './_components/NganPhanTho';
import { TepNguonDuAn } from '@/components/filemanager/TepNguonDuAn';
import { useT } from '@/lib/i18n';

/**
 * [marker: filesHaiTang] 17/08 tối — Files có **HAI TẦNG KHÁC BẢN CHẤT** (Hoà đưa bố cục, hợp
 * đồng §3 · bản đồ `IF-KIEN-TRUC.md` §5):
 *   **Tầng ①** THƯ MỤC HỆ THỐNG — 5 loại, mỗi loại một QUYỀN (Dự án · Studio dùng chung ·
 *      Nhà cung cấp · Đã duyệt · Lưu trữ).
 *   **Tầng ②** COLLECTION+ — 8 gói component mã `COL-<LOẠI>-NNN`, gom theo LOẠI VẬT.
 * Một route, cuộn dọc, tầng ② nối tiếp tầng ①. Vỏ ở `_components/HaiTang.tsx`; vì sao nó KHÔNG
 * được rút thành một bộ lọc: đọc docstring ở đó.
 *
 * 🔴 Bản **"hai NGĂN dự án ↔ phần thô"** (chốt sáng 17/08) **HẾT HIỆU LỰC**. Logic phần thô
 * không mất — `NganPhanTho` nay là **nội dung của thư mục "Nhà cung cấp"** ở tầng ①, đúng lời
 * chốt. `_components/HaiNgan.tsx` + `_lib/ngan-tho.ts` giữ lại: lõi thô vẫn chạy, chỉ đổi chỗ
 * treo. Đừng dựng lại nó lần thứ ba.
 *
 * `FilesNavigator` (cây thư mục) chỉ có nghĩa cho thư mục *Dự án*. Cố ý **KHÔNG ẩn nó** khi mở
 * thư mục khác: Navigator là bộ phận của vỏ `AppShell` dùng chung, ẩn/hiện theo tầng sẽ thành
 * "màn hình tự đổi ý" — đúng thứ luật cấm auto-hide chặn. Mỗi thư mục tự mang đủ ngữ cảnh trên thân.
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
        {/* Cuộn nằm ở VỎ `HaiTang` (một trang dọc, tầng ② nối tiếp tầng ①) — nội dung truyền vào
            KHÔNG tự cuộn nữa, nếu không sẽ thành hai vùng cuộn lồng nhau và nút "Đến Collection+"
            hết đường tới đích. */}
        <HaiTang
          duAn={
            <>
              {/* 20/08 — khu Tệp nguồn dự án (ProjectFile server thật) đứng TRÊN cây thư mục đĩa:
                  mắt xích đầu của dòng chảy §5, xem docstring TepNguonDuAn.tsx. */}
              <TepNguonDuAn />
              <FileManagerShell currentFolderId={currentFolderId} onSelectFolder={setCurrentFolderId} />
            </>
          }
          nhaCungCap={<NganPhanTho />}
        />
      </AppShell>
    </>
  );
}
