'use client';

/**
 * app/settings/_lib/wallpaper.ts — HÌNH NỀN CANVAS (thật, không phải mock).
 *
 * Canvas các chặng vẽ nền bằng React Flow `<Background variant={Dots} color="var(--dots)" />`
 * (`components/FlowCanvas.tsx:511`). Nên "đổi hình nền" = (1) đổi biến `--dots` và/hoặc (2) phủ
 * thêm `background-image` lên `.react-flow__pane`. Cả hai đều làm được từ CSS thuần, KHÔNG cần
 * sửa `FlowCanvas.tsx` (ngoài vùng file G4).
 *
 * Cách áp: đặt `data-canvas-wallpaper` lên `<html>` + tiêm 1 thẻ `<style>` DUY NHẤT vào `<head>`
 * (idempotent theo id). Điều hướng client-side của App Router KHÔNG xoá head đã tiêm ⇒ chọn hình
 * nền ở Cài đặt rồi đi sang canvas là thấy ngay. Sau khi TẢI LẠI CỨNG trang canvas thì thẻ style
 * mất — cần mount `<CanvasWallpaper/>` ở `app/layout.tsx` để áp lại từ localStorage; đó là 1 dòng
 * NGOÀI vùng file G4 nên chỉ ghi yêu cầu cho CHINH (xem `docs/BAO-CAO-FM.md`), không tự sửa.
 */

export type WallpaperId = 'none';

export const WALLPAPER_STORAGE_KEY = 'interiorflow.canvas_wallpaper_v1';
const STYLE_EL_ID = 'if-canvas-wallpaper';

export const WALLPAPERS: { id: WallpaperId; label: [string, string]; swatch: string }[] = [
  { id: 'none', label: ['Trơn', 'Plain'], swatch: '' },
];

/**
 * CSS áp cho canvas thật. 11/08 Hoà chốt: KHÔNG hình nền trang trí (aura/ảnh/gradient) ở mọi
 * chặng, nhưng canvas PHẢI GIỮ pattern kỹ thuật (dot grid `--dots` của React Flow Background,
 * FlowCanvas.tsx) để định hướng không gian — "PATTERN CANVAS ĐÂU?" là lỗi tắt quá tay đã bị
 * bắt. Vì vậy CSS này chỉ ép nền phẳng `--bg` + xoá background-image trang trí, TUYỆT ĐỐI
 * không đụng `.react-flow__background` (lớp chấm).
 */
const CSS = `
:root .react-flow__pane{background-color:var(--bg);background-image:none}
`;

function ensureStyleEl(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_EL_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_EL_ID;
  el.textContent = CSS;
  document.head.appendChild(el);
}

/** Áp hình nền lên toàn app (canvas mọi chặng) + ghi nhớ lựa chọn. */
export function applyWallpaper(_id: WallpaperId, persist = true): void {
  if (typeof document === 'undefined') return;
  ensureStyleEl();
  document.documentElement.setAttribute('data-canvas-wallpaper', 'none');
  if (!persist) return;
  try {
    window.localStorage.setItem(WALLPAPER_STORAGE_KEY, 'none');
  } catch {
    // quota/private-mode — không chặn việc áp hình nền cho phiên hiện tại
  }
}

export function readStoredWallpaper(): WallpaperId {
  return 'none';
}
