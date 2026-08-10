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

export type WallpaperId = 'none' | 'aura' | 'dots' | 'grid' | 'warm' | 'cool';

export const WALLPAPER_STORAGE_KEY = 'interiorflow.canvas_wallpaper_v1';
const STYLE_EL_ID = 'if-canvas-wallpaper';

export const WALLPAPERS: { id: WallpaperId; label: [string, string]; swatch: string }[] = [
  { id: 'none', label: ['Trơn', 'Plain'], swatch: '' },
  { id: 'aura', label: ['Dải sáng', 'Aura'], swatch: 'radial-gradient(ellipse at 48% 44%,rgba(103,85,245,.78),transparent 42%),repeating-linear-gradient(90deg,rgba(255,255,255,.13) 0 1px,transparent 1px 8px),#0c0c0e' },
  { id: 'dots', label: ['Chấm', 'Dots'], swatch: 'radial-gradient(circle at 1.5px 1.5px,var(--dots) 1px,transparent 0) 0 0/10px 10px,var(--bg)' },
  { id: 'grid', label: ['Kẻ ô', 'Grid'], swatch: 'repeating-linear-gradient(0deg,var(--border) 0 1px,transparent 1px 12px),repeating-linear-gradient(90deg,var(--border) 0 1px,transparent 1px 12px),var(--bg)' },
  { id: 'warm', label: ['Ấm', 'Warm'], swatch: 'linear-gradient(135deg,#f2ede4,#e5ddd0)' },
  { id: 'cool', label: ['Lạnh', 'Cool'], swatch: 'linear-gradient(135deg,#e8ecf2,#d8dfe9)' },
];

/**
 * CSS áp cho canvas thật. `none` = ẩn hẳn lớp chấm của React Flow; `grid` = thay chấm bằng lưới;
 * `warm`/`cool` = phủ màu nền ấm/lạnh (giữ chấm mờ để vẫn thấy lưới canh). Màu qua biến app nên
 * tự đúng cả 2 theme — trừ warm/cool là GRADIENT TRANG TRÍ cố ý giữ nguyên (chọn "ấm/lạnh" là
 * chọn màu cụ thể, đổi theo theme thì mất ý nghĩa lựa chọn).
 */
const CSS = `
:root[data-canvas-wallpaper="none"] .react-flow__background{opacity:0}
:root[data-canvas-wallpaper="aura"] .react-flow__background{opacity:.18}
:root[data-canvas-wallpaper="aura"] .react-flow__pane{
  background-color:var(--bg);
  background-image:
    radial-gradient(ellipse 56% 50% at 50% 43%,color-mix(in srgb,var(--accent) 43%,transparent),transparent 71%),
    radial-gradient(ellipse 26% 34% at 35% 38%,color-mix(in srgb,var(--accent) 24%,transparent),transparent 82%),
    repeating-linear-gradient(90deg,color-mix(in srgb,var(--t1) 8%,transparent) 0 1px,transparent 1px 9px);
  background-size:auto,auto,100% 100%;
}
:root[data-canvas-wallpaper="grid"] .react-flow__background{opacity:0}
:root[data-canvas-wallpaper="grid"] .react-flow__pane{
  background-image:repeating-linear-gradient(0deg,var(--dots) 0 1px,transparent 1px 22px),repeating-linear-gradient(90deg,var(--dots) 0 1px,transparent 1px 22px);
}
:root[data-canvas-wallpaper="warm"] .react-flow__pane{background-color:#f2ede4}
:root[data-canvas-wallpaper="cool"] .react-flow__pane{background-color:#e8ecf2}
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
export function applyWallpaper(id: WallpaperId, persist = true): void {
  if (typeof document === 'undefined') return;
  ensureStyleEl();
  document.documentElement.setAttribute('data-canvas-wallpaper', id);
  if (!persist) return;
  try {
    window.localStorage.setItem(WALLPAPER_STORAGE_KEY, id);
  } catch {
    // quota/private-mode — không chặn việc áp hình nền cho phiên hiện tại
  }
}

export function readStoredWallpaper(): WallpaperId {
  if (typeof window === 'undefined') return 'aura';
  try {
    const v = window.localStorage.getItem(WALLPAPER_STORAGE_KEY);
    return (WALLPAPERS.some((w) => w.id === v) ? v : 'aura') as WallpaperId;
  } catch {
    return 'aura';
  }
}
