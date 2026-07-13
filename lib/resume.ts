/**
 * lib/resume.ts — PERSISTENT STATE nhẹ theo user (B-3/B-4/B-5 Sprint 1).
 *
 * Lưu "đang đứng ở đâu" để login lại là về đúng chỗ: CHỈ route + id (flowId, chặng)
 * — KHÔNG serialize document/graph (doc đã có autosave riêng ở store/DB).
 *
 * Pattern key theo user.id (giống C1 `interiorflow.stageDone`): trên máy dùng chung,
 * mỗi user một resume-state riêng, user mới không kế thừa của user cũ.
 *
 * `lastUserId`: các route studio (/cad-editor…) KHÔNG nạp user vào store — ResumeTracker
 * cần biết "user gần nhất là ai" để ghi resume mà không tốn thêm request /api/auth/me.
 * Ghi khi auth thành công; chỉ là id định danh cục bộ, không phải dữ liệu nhạy cảm.
 */

import { isPhase, type Phase } from '@/lib/phases';

const RESUME_PREFIX = 'interiorflow.resume.';
const TOUR_PREFIX = 'interiorflow.tourDone.';
const LAST_USER_KEY = 'interiorflow.lastUserId';

/** Các route được phép resume — tránh khôi phục vào route lạ/đã gỡ. */
export const RESUMABLE_ROUTES = ['/', '/cad-editor', '/present-editor', '/photo-editor'] as const;
export type ResumableRoute = (typeof RESUMABLE_ROUTES)[number];

export interface ResumeState {
  /** route đang đứng khi thoát */
  route: ResumableRoute;
  /** flow đang mở trên canvas '/' (id thôi, graph tự nạp lại từ DB) */
  flowId?: string;
  /** chặng workspace (concept | render | present) */
  phase?: Phase;
  /**
   * sheet đang mở trên route studio multi-sheet (J-3 Sprint 2) — resume trỏ TẬN sheet.
   * Chỉ là id ('cadsheet-2'…); nội dung sheet nằm ở IndexedDB (lib/sheets-persist).
   * Caller khôi phục phải TỰ kiểm tra id còn tồn tại trong bộ sheet đã lưu.
   */
  sheetId?: string;
  /** thời điểm ghi — để debug / dọn sau này, chưa dùng làm expiry */
  ts: number;
}

function isResumableRoute(v: unknown): v is ResumableRoute {
  return typeof v === 'string' && (RESUMABLE_ROUTES as readonly string[]).includes(v);
}

/** Ghi resume-state (merge nông lên bản cũ để route studio không xoá flowId đã lưu). */
export function saveResume(userId: string, patch: Partial<Omit<ResumeState, 'ts'>>): void {
  if (!userId) return;
  try {
    const prev = loadResume(userId);
    const next: ResumeState = {
      route: patch.route ?? prev?.route ?? '/',
      flowId: patch.flowId ?? prev?.flowId,
      phase: patch.phase ?? prev?.phase,
      sheetId: patch.sheetId ?? prev?.sheetId,
      ts: Date.now(),
    };
    localStorage.setItem(RESUME_PREFIX + userId, JSON.stringify(next));
  } catch {
    /* localStorage bị chặn (private mode…) — resume chỉ là tiện nghi, bỏ qua */
  }
}

/** Đọc resume-state — null nếu chưa có / hỏng / route không hợp lệ. */
export function loadResume(userId: string): ResumeState | null {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(RESUME_PREFIX + userId);
    if (!raw) return null;
    const j = JSON.parse(raw) as Partial<ResumeState>;
    if (!isResumableRoute(j.route)) return null;
    return {
      route: j.route,
      flowId: typeof j.flowId === 'string' && j.flowId ? j.flowId : undefined,
      phase: isPhase(j.phase) ? j.phase : undefined,
      sheetId: typeof j.sheetId === 'string' && j.sheetId ? j.sheetId : undefined,
      ts: typeof j.ts === 'number' ? j.ts : 0,
    };
  } catch {
    return null;
  }
}

export function clearResume(userId: string): void {
  if (!userId) return;
  try {
    localStorage.removeItem(RESUME_PREFIX + userId);
  } catch {
    /* bỏ qua */
  }
}

/* ---------- lastUserId — cho ResumeTracker ở route không có user trong store ---------- */

export function setLastUserId(userId: string): void {
  try {
    localStorage.setItem(LAST_USER_KEY, userId);
  } catch {
    /* bỏ qua */
  }
}

export function getLastUserId(): string | null {
  try {
    return localStorage.getItem(LAST_USER_KEY);
  } catch {
    return null;
  }
}

/* ---------- Smart Tour (B-5) — cờ "đã xem/bỏ qua" theo user ---------- */

export function isTourDone(userId: string): boolean {
  if (!userId) return true; // không xác định user → đừng làm phiền
  try {
    return localStorage.getItem(TOUR_PREFIX + userId) === '1';
  } catch {
    return true;
  }
}

export function markTourDone(userId: string): void {
  if (!userId) return;
  try {
    localStorage.setItem(TOUR_PREFIX + userId, '1');
  } catch {
    /* bỏ qua */
  }
}
