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
/** Export riêng (7.3.33) — dùng khi cần render NHIỀU nhãn phím khác `${MOD}${key}`/`${MOD}${SHIFT}${key}`
 * (vd bảng tra phím tắt), tránh gọi hook lặp lại cho từng dòng. Cùng SSR-safe pattern useModKey. */
export function useMacAfterMount(): boolean {
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

// ── PHÍM CHÍNH (PrimaryModifier) — MỘT NGUỒN CHUNG ───────────────────────────
// 04/09 · macOS là nền tảng chính. Trước lượt này mỗi handler tự viết
// `e.metaKey || e.ctrlKey`; đo được 50 chỗ, tất cả cùng một biểu thức nhưng
// KHÔNG chỗ nào đọc từ một nguồn ⇒ đúng bệnh "cùng một danh sách khai nhiều nơi".
// Từ nay: mọi nơi hỏi "người dùng có đang giữ phím chính không" đều gọi vào đây.
//
// ⚠️ HAI CÂU HỎI KHÁC NHAU, ĐỪNG TRỘN — đây là chỗ dễ sai nhất:
//   · laPhimChinh(e)   — "đây CÓ PHẢI phím tắt của mình không?"  → theo hệ:
//                        macOS chỉ ⌘ · Windows/Linux Ctrl (và ⊞ Win, giữ nguyên
//                        hành vi cũ để không đổi thói quen người dùng Windows).
//                        Trên Mac, Ctrl KHÔNG còn kích hoạt phím tắt của app —
//                        đúng quy ước macOS, và giữ ⌃⌘Q tách bạch được.
//   · coPhimHeThong(e) — "người dùng có đang giữ phím sửa đổi nào không, để mình
//                        TRÁNH ĐƯỜNG?" → luôn nhận CẢ HAI trên mọi hệ, vì phím
//                        tắt của trình duyệt/OS đến từ cả hai phía.
// Dùng nhầm laPhimChinh cho nhánh "tránh đường" sẽ làm app cướp phím của OS.
type PhimSuaDoi = Pick<KeyboardEvent, 'metaKey' | 'ctrlKey'>;

/** Nhãn phím chính theo hệ — '⌘' trên macOS, 'Ctrl' nơi khác. */
export const PHIM_CHINH = MOD;

/** Người dùng đang giữ ĐÚNG phím chính của hệ này? (dùng cho phím tắt của app) */
export function laPhimChinh(e: PhimSuaDoi): boolean {
  return IS_MAC ? e.metaKey : e.ctrlKey || e.metaKey;
}

/** Có phím sửa đổi hệ thống nào đang giữ? (dùng cho nhánh "bỏ qua, nhường OS") */
export function coPhimHeThong(e: PhimSuaDoi): boolean {
  return e.metaKey || e.ctrlKey;
}
