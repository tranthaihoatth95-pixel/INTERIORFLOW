export const PALM_CONTACT_PX = 24;
export const PEN_RELEASE_GUARD_MS = 300;
export const FINGER_DRAW_STORAGE_KEY = 'if:cad:finger-draw';
export const FINGER_DRAW_EVENT = 'cad:finger-draw-change';

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
  return window.localStorage.getItem(FINGER_DRAW_STORAGE_KEY) === '1';
}

export function writeFingerDrawPreference(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(FINGER_DRAW_STORAGE_KEY, enabled ? '1' : '0');
  window.dispatchEvent(new CustomEvent(FINGER_DRAW_EVENT, { detail: enabled }));
}
