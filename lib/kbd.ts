'use client';

/**
 * lib/kbd.ts — Nhãn phím tắt ĐỒNG BỘ Mac ↔ Windows.
 *
 * Logic phím đã nhận cả metaKey (⌘) lẫn ctrlKey (Ctrl) ở các handler; file này lo phần
 * HIỂN THỊ nhãn cho đúng nền: Mac thấy "⌘/⇧/⌥", Windows thấy "Ctrl/Shift/Alt".
 * SSR trả về nhãn Windows (navigator undefined) → client Mac tự chỉnh; nhãn nằm trong
 * thuộc tính title (tooltip) nên chênh SSR không ảnh hưởng người dùng.
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
