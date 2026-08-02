'use client';

import { useEffect } from 'react';
import { applyWallpaper, readStoredWallpaper } from '../_lib/wallpaper';

/**
 * Áp lại hình nền canvas đã lưu ngay khi app mở — render `null`, chỉ có tác dụng phụ.
 *
 * Mount ở `/files` và `/settings` (vùng G4). Để hình nền sống sót cả khi TẢI LẠI CỨNG thẳng vào
 * trang canvas, cần thêm 1 dòng `<CanvasWallpaper />` vào `app/layout.tsx` — file ngoài vùng G4
 * nên đã ghi yêu cầu cho CHINH trong `docs/BAO-CAO-FM.md`, không tự sửa.
 */
export function CanvasWallpaper() {
  useEffect(() => {
    applyWallpaper(readStoredWallpaper(), false);
  }, []);
  return null;
}
