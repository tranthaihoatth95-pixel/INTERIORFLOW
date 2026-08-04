'use client';

/**
 * lib/lockscreen.ts — VIỆC 3 UI (04/08, docs/SO-KIEM-TONG.md). Khoá màn kiểu macOS: ⌃⌘Q hoặc
 * tự khoá sau N phút không thao tác. Store zustand thuần (`useLockScreen`) — chỉ 1 cờ `locked`,
 * đọc/ghi ở AppChrome.tsx (nơi TẬP TRUNG mọi phím tắt toàn cục, VIỆC 2) + LockScreen.tsx (UI).
 *
 * KHÔNG có cơ chế mật khẩu cục bộ riêng — `LockScreen.tsx` nhúng thẳng `LoginForm` (đường
 * auth CÓ SẴN, `components/entry/LoginForm.tsx`), đúng yêu cầu "mở khoá = đăng nhập lại qua
 * đường cũ". File này không tự chế xác thực gì cả.
 */

import { create } from 'zustand';

interface LockScreenState {
  locked: boolean;
  lock: () => void;
  unlock: () => void;
}

export const useLockScreen = create<LockScreenState>((set) => ({
  locked: false,
  lock: () => set({ locked: true }),
  unlock: () => set({ locked: false }),
}));

/**
 * Khoá màn — ÉP AUTOSAVE CHẠY TRƯỚC (yêu cầu cứng của VIỆC 3: "khoá màn KHÔNG được làm mất
 * việc đang làm"). Tái dùng ĐÚNG 2 sự kiện ép-lưu sẵn có — 'cad:force-save-request'
 * (CadCanvas.tsx ⌘S, nghe ở CadSheets.tsx) và 'present:force-save-request' (PresentEditor.tsx
 * ⌘S, nghe ở PresentSheets.tsx) — KHÔNG dựng luồng lưu thứ hai. Bắn cả hai vô điều kiện (không
 * hại gì nếu chặng đó không mount — không ai nghe thì rơi vào chỗ trống); chặng Dựng
 * (flow-graph) chưa có khái niệm "ép lưu" riêng (đúng hiện trạng `lib/shortcuts.ts` VIỆC 2).
 *
 * Đợi 1 nhịp ngắn (200ms) trước khi thật sự khoá — đủ cho debounce/IndexedDB kịp ghi (cùng tinh
 * thần "optimistic status" `CadSheets.tsx` `onForceSave` đã dùng, không có promise nào để await
 * xuyên qua CustomEvent).
 */
export function lockScreenNow(): void {
  window.dispatchEvent(new CustomEvent('cad:force-save-request'));
  window.dispatchEvent(new CustomEvent('present:force-save-request'));
  window.setTimeout(() => useLockScreen.getState().lock(), 200);
}

/* ---------- Số phút tự khoá khi không thao tác — theo user, chỉnh được ở Cài đặt ---------- */

const IDLE_MINUTES_PREFIX = 'interiorflow.lockIdleMinutes.';
export const DEFAULT_LOCK_IDLE_MINUTES = 15;

export function getLockIdleMinutes(userId: string): number {
  if (!userId) return DEFAULT_LOCK_IDLE_MINUTES;
  try {
    const raw = localStorage.getItem(IDLE_MINUTES_PREFIX + userId);
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) && n > 0 ? n : DEFAULT_LOCK_IDLE_MINUTES;
  } catch {
    return DEFAULT_LOCK_IDLE_MINUTES;
  }
}

export function setLockIdleMinutes(userId: string, minutes: number): void {
  if (!userId || !Number.isFinite(minutes) || minutes <= 0) return;
  try {
    localStorage.setItem(IDLE_MINUTES_PREFIX + userId, String(Math.round(minutes)));
  } catch {
    /* bỏ qua — localStorage bị chặn (private mode…), chỉ mất tiện nghi */
  }
}
