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
import { useSaveStatus } from './save-status';

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

/** Trần an toàn nếu autosave kẹt/không bao giờ báo xong — không được khoá treo mãi. */
const FORCE_SAVE_MAX_WAIT_MS = 2000;

/**
 * Khoá màn — ÉP AUTOSAVE CHẠY TRƯỚC (yêu cầu cứng của VIỆC 3: "khoá màn KHÔNG được làm mất
 * việc đang làm"). Tái dùng ĐÚNG 2 sự kiện ép-lưu sẵn có — 'cad:force-save-request'
 * (CadCanvas.tsx ⌘S, nghe ở CadSheets.tsx) và 'present:force-save-request' (PresentEditor.tsx
 * ⌘S, nghe ở PresentSheets.tsx) — KHÔNG dựng luồng lưu thứ hai. Bắn cả hai vô điều kiện (không
 * hại gì nếu chặng đó không mount — không ai nghe thì rơi vào chỗ trống); chặng Dựng
 * (flow-graph) chưa có khái niệm "ép lưu" riêng (đúng hiện trạng `lib/shortcuts.ts` VIỆC 2).
 *
 * G-M20-06: bản trước khoá cứng sau 200ms CỐ ĐỊNH — không biết autosave có kịp ghi xong hay
 * chưa (nguy cơ mất dữ liệu nếu ghi lâu hơn 200ms; phí thời gian nếu không có gì để lưu). Sửa
 * bằng cách đợi TÍN HIỆU THẬT thay vì đoán một con số: `useSaveStatus` (lib/save-status.ts) là
 * trạng thái CHUNG mà cả CAD lẫn Present đã ghi vào qua `onSavingChange` từ trước (KHÔNG dựng
 * cơ chế theo dõi mới, không cần sửa CadSheets.tsx/PresentSheets.tsx) — nếu đang `'saving'` thì
 * đợi tới khi rời trạng thái đó, có trần `FORCE_SAVE_MAX_WAIT_MS` phòng autosave kẹt/không mount.
 * Không có gì đang lưu (ca phổ biến nhất) ⇒ khoá gần như ngay, không đợi vô ích.
 */
export function lockScreenNow(): void {
  window.dispatchEvent(new CustomEvent('cad:force-save-request'));
  window.dispatchEvent(new CustomEvent('present:force-save-request'));

  if (useSaveStatus.getState().status !== 'saving') {
    useLockScreen.getState().lock();
    return;
  }

  let settled = false;
  const finish = () => {
    if (settled) return;
    settled = true;
    window.clearTimeout(safety);
    unsubscribe();
    useLockScreen.getState().lock();
  };
  const unsubscribe = useSaveStatus.subscribe((s) => {
    if (s.status !== 'saving') finish();
  });
  const safety = window.setTimeout(finish, FORCE_SAVE_MAX_WAIT_MS);
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
