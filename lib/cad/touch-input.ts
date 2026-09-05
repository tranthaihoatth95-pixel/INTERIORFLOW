export const PALM_CONTACT_PX = 24;
export const PEN_RELEASE_GUARD_MS = 300;
export const FINGER_DRAW_STORAGE_KEY = 'if:cad:finger-draw';
export const FINGER_DRAW_EVENT = 'cad:finger-draw-change';
export const MULTI_TAP_MS = 250;
export const TOUCH_MOVE_THRESHOLD_PX = 8;
export const RADIAL_HOLD_MS = 450;

export interface TouchGuardInput {
  pointerType: string;
  width: number;
  height: number;
  now: number;
  penActive: boolean;
  penSeen: boolean;
  penUpAt: number;
  fingerDrawEnabled: boolean;
}

/**
 * Tầng chống tì tay thuần: vùng tiếp xúc lớn, touch chen lúc bút chạm hoặc vừa nhấc bị loại.
 * Quyết định "ngón chỉ điều hướng" tách riêng để pointer đó vẫn vào được pan/pinch.
 */
export function shouldRejectTouch(input: TouchGuardInput): boolean {
  if (input.pointerType !== 'touch') return false;
  if (input.width >= PALM_CONTACT_PX || input.height >= PALM_CONTACT_PX) return true;
  if (input.penActive) return true;
  if (input.penUpAt > 0 && input.now - input.penUpAt < PEN_RELEASE_GUARD_MS) return true;
  return false;
}

export function shouldUseTouchForNavigation(input: Pick<TouchGuardInput, 'pointerType' | 'penSeen' | 'fingerDrawEnabled'>): boolean {
  return input.pointerType === 'touch' && input.penSeen && !input.fingerDrawEnabled;
}

export function readFingerDrawPreference(): boolean {
  if (typeof window === 'undefined') return false;
  // Kho bị chặn hẳn thì `getItem` NÉM chứ không trả null (ca 3 nghiệm thu G1). Một tuỳ chọn
  // vẽ bằng ngón tay không đáng để làm sập màn — không đọc được thì lấy mặc định.
  try {
    return window.localStorage.getItem(FINGER_DRAW_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function writeFingerDrawPreference(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FINGER_DRAW_STORAGE_KEY, enabled ? '1' : '0');
  } catch {
    /* kho bị chặn — lựa chọn chỉ sống trong phiên này, KHÔNG chặn sự kiện bên dưới:
       giao diện vẫn phải đổi theo cú bấm, chỉ là lần mở sau không nhớ. */
  }
  window.dispatchEvent(new CustomEvent(FINGER_DRAW_EVENT, { detail: enabled }));
}

export type MultiTouchAction = 'undo' | 'redo' | 'navigate' | 'none';

export function classifyMultiTouchGesture(input: {
  pointerCount: number;
  durationMs: number;
  maxMovePx: number;
}): MultiTouchAction {
  if (input.pointerCount < 2) return 'none';
  if (input.durationMs >= MULTI_TAP_MS || input.maxMovePx >= TOUCH_MOVE_THRESHOLD_PX) return 'navigate';
  if (input.pointerCount === 2) return 'undo';
  if (input.pointerCount === 3) return 'redo';
  return 'none';
}
