'use client';

import { useEffect, useState } from 'react';

/**
 * lib/kbd.ts — Nhãn phím tắt ĐỒNG BỘ Mac ↔ Windows.
 *
 * Logic phím đã nhận cả metaKey (⌘) lẫn ctrlKey (Ctrl) ở các handler; file này lo phần
 * HIỂN THỊ nhãn cho đúng nền: Mac thấy "⌘/⇧/⌥", Windows thấy "Ctrl/Shift/Alt".
 * SSR trả về nhãn Windows (navigator undefined) → client Mac tự chỉnh.
 */
export const IS_MAC =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent || '');

export const MOD = IS_MAC ? '⌘' : 'Ctrl';
export const SHIFT = IS_MAC ? '⇧' : 'Shift';
export const ALT = IS_MAC ? '⌥' : 'Alt';

/** '⌘Z' (Mac) / 'Ctrl+Z' (Win). */
export function modKey(key: string): string {
  return IS_MAC ? `${MOD}${key}` : `${MOD}+${key}`;
}
/** '⌘⇧Z' (Mac) / 'Ctrl+Shift+Z' (Win). */
export function modShiftKey(key: string): string {
  return IS_MAC ? `${MOD}${SHIFT}${key}` : `${MOD}+${SHIFT}+${key}`;
}

/**
 * Biến thể HOOK của modKey/modShiftKey — dùng khi nhãn rơi vào một thuộc tính
 * (vd. `title` tooltip) mà React SO SÁNH cả server lẫn client dù có
 * `suppressHydrationWarning` (prop đó chỉ nuốt cảnh báo cho TEXT CONTENT, không
 * áp dụng cho attribute). Render đầu tiên luôn trả nhãn Windows (khớp SSR), rồi
 * `useEffect` chỉnh lại đúng hệ SAU khi mount ở client — không còn mismatch để
 * React log warning. Cùng pattern "nạp SAU mount" đã dùng ở CadToolbar (lựa chọn
 * Sketch/Pro) và PresentEditor.tsx.
 */
function useMacAfterMount(): boolean {
  const [isMac, setIsMac] = useState(false);
  useEffect(() => {
    setIsMac(IS_MAC);
  }, []);
  return isMac;
}

/** Hook: '⌘Z' (Mac) / 'Ctrl+Z' (Win) — an toàn hydration khi dùng trong `title`. */
export function useModKey(key: string): string {
  const isMac = useMacAfterMount();
  return isMac ? `${MOD}${key}` : `Ctrl+${key}`;
}
/** Hook: '⌘⇧Z' (Mac) / 'Ctrl+Shift+Z' (Win) — an toàn hydration khi dùng trong `title`. */
export function useModShiftKey(key: string): string {
  const isMac = useMacAfterMount();
  return isMac ? `${MOD}${SHIFT}${key}` : `Ctrl+Shift+${key}`;
}
