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

import { create } from 'zustand';
import { isPhase, type Phase } from './phases';
import { useSaveStatus } from './save-status';
import { parseStageRoute, LEGACY_STAGE_ROUTE } from './scope-core';

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

/**
 * CONTINUITY-1 (19/08) — tính patch ghi resume TỪ PATHNAME, tách thuần khỏi ResumeTracker.tsx
 * để test được không cần DOM/usePathname (sucrase-node).
 *
 * Bug đã sửa: khi đứng trên route scope dự án (`/projects/[id]/cad`…), patch cũ chỉ có
 * `{ route }` (route TOÀN CỤC cũ, vd '/cad-editor') mà KHÔNG kèm id dự án. Nếu resume trước đó
 * chưa từng có `flowId` (case "vào thẳng URL/bookmark"), `buildResumeCard()`
 * (components/home/widgets/resume-card.ts) tính `routeId = currentProjectId || resume.flowId
 * || null` ra `null` ⇒ `resumeHref()` trả route toàn cục cũ thay vì `/projects/<id>/<stage>` ⇒
 * `LegacyStageRedirect` tra lại cũng null ⇒ dội về `/?notice=choose-project`.
 *
 * Trả `null` nếu route này không nên ghi resume (route '/' do app/page.tsx tự ghi kèm
 * flowId+chặng riêng — xem docstring `ResumeTracker`; hoặc route không nằm trong
 * `RESUMABLE_ROUTES`).
 */
export function computeResumePatch(
  pathname: string,
): { route: ResumableRoute; flowId?: string } | null {
  const scoped = parseStageRoute(pathname);
  const route = scoped ? LEGACY_STAGE_ROUTE[scoped.stage] : pathname;
  if (route === '/') return null;
  if (!isResumableRoute(route)) return null;
  return scoped ? { route, flowId: scoped.projectId } : { route };
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

/**
 * userId "tốt nhất có được" cho onboarding Tầng 2/3 — CÁC ROUTE STUDIO (`/projects/[id]/cad`,
 * `/present`, hay `/cad-editor`/`/present-editor` cũ) KHÔNG nạp `user` vào store khi vào bằng
 * hard-reload/URL trực tiếp (xem ghi chú `lastUserId` phía trên + components/entry/ResumeTracker.tsx
 * + components/cad/CadSheets.tsx/PresentSheets.tsx — cùng 1 pattern rơi về `lastUserId`).
 * Thiếu bước này thì StageIntroCard/coachmark IM LẶNG không bao giờ hiện khi user mở thẳng
 * route studio (F5, bookmark, mở tab mới) thay vì điều hướng qua Gallery trong cùng phiên SPA.
 */
export function effectiveUserId(storeUserId: string | null | undefined): string | null {
  if (storeUserId) return storeUserId;
  return getLastUserId();
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

/** Xoá cờ tourDone — dùng cho "Xem lại hướng dẫn" (help menu) để Tầng 1 hiện lại từ đầu. */
export function resetTourDone(userId: string): void {
  if (!userId) return;
  try {
    localStorage.removeItem(TOUR_PREFIX + userId);
  } catch {
    /* bỏ qua */
  }
}

/* ---------- Onboarding Tầng 2 — thẻ giới thiệu LẦN ĐẦU mỗi chặng (thay 3 bước 'canvas'
   cũ của SmartTour) — cờ theo (chặng, user), key `interiorflow.stageIntro.<stage>.<userId>`. */

export type OnboardingStage = 'cad' | 'render' | 'present';

const STAGE_INTRO_PREFIX = 'interiorflow.stageIntro.';

export function isStageIntroSeen(stage: OnboardingStage, userId: string): boolean {
  if (!userId) return true; // không xác định user → đừng làm phiền
  try {
    return localStorage.getItem(STAGE_INTRO_PREFIX + stage + '.' + userId) === '1';
  } catch {
    return true;
  }
}

export function markStageIntroSeen(stage: OnboardingStage, userId: string): void {
  if (!userId) return;
  try {
    localStorage.setItem(STAGE_INTRO_PREFIX + stage + '.' + userId, '1');
  } catch {
    /* bỏ qua */
  }
}

/** Xoá cờ 1 chặng — dùng bởi "Xem lại hướng dẫn" (loop cả 3 chặng). */
export function resetStageIntroSeen(stage: OnboardingStage, userId: string): void {
  if (!userId) return;
  try {
    localStorage.removeItem(STAGE_INTRO_PREFIX + stage + '.' + userId);
  } catch {
    /* bỏ qua */
  }
}

export const ONBOARDING_STAGES: readonly OnboardingStage[] = ['cad', 'render', 'present'];

/* ---------- Onboarding Tầng 3 — coachmark tương tác vi mô (vd chọn 1 đối tượng CAD lần
   đầu), cờ theo (tên coachmark, user), key `interiorflow.coachmark.<name>.<userId>`. */

const COACHMARK_PREFIX = 'interiorflow.coachmark.';

export function isCoachmarkSeen(name: string, userId: string): boolean {
  if (!userId) return true;
  try {
    return localStorage.getItem(COACHMARK_PREFIX + name + '.' + userId) === '1';
  } catch {
    return true;
  }
}

export function markCoachmarkSeen(name: string, userId: string): void {
  if (!userId) return;
  try {
    localStorage.setItem(COACHMARK_PREFIX + name + '.' + userId, '1');
  } catch {
    /* bỏ qua */
  }
}

/** Xoá cờ 1 coachmark — dùng bởi "Xem lại hướng dẫn" (loop qua `COACHMARKS`, cùng cách
 * `resetStageIntroSeen` được loop qua `ONBOARDING_STAGES`). */
export function resetCoachmarkSeen(name: string, userId: string): void {
  if (!userId) return;
  try {
    localStorage.removeItem(COACHMARK_PREFIX + name + '.' + userId);
  } catch {
    /* bỏ qua */
  }
}

/** Mọi coachmark Tầng 3 đã đăng ký trong app — thêm tên mới vào đây khi có coachmark mới, để
 * "Xem lại hướng dẫn" tự reset đủ (xem CadCanvas.tsx `markCoachmarkSeen('selectMove', ...)`). */
export const COACHMARKS: readonly string[] = ['selectMove'];

/* ---------- Gallery Home — ghi đè thủ công Carousel 3D ↔ Grid (01/08, luật 2.1.10
   "một năng lực, hai lối vào") — J-4c (ProjectSelect.tsx) tự đổi carousel→grid khi >8 dự án;
   cờ này là LỰA CHỌN CỦA NGƯỜI DÙNG đè lên quyết định tự động đó, theo user, key
   `interiorflow.galleryView.<userId>`. `null`/thiếu = chưa ghi đè, dùng nguyên hành vi J-4c. */

const GALLERY_VIEW_PREFIX = 'interiorflow.galleryView.';

export type GalleryViewOverride = 'carousel' | 'grid';

export function getGalleryViewOverride(userId: string): GalleryViewOverride | null {
  if (!userId) return null;
  try {
    const v = localStorage.getItem(GALLERY_VIEW_PREFIX + userId);
    return v === 'carousel' || v === 'grid' ? v : null;
  } catch {
    return null;
  }
}

export function setGalleryViewOverride(userId: string, mode: GalleryViewOverride | null): void {
  if (!userId) return;
  try {
    if (mode) localStorage.setItem(GALLERY_VIEW_PREFIX + userId, mode);
    else localStorage.removeItem(GALLERY_VIEW_PREFIX + userId);
  } catch {
    /* bỏ qua */
  }
}

/* ---------- "Về Home" (Gallery) — nút Home + logo IF (docs/RESEARCH-HOME-GALLERY-DASHBOARD.md
   §5.1 quyết định 3) ----------
 * Vấn đề: route '/' KHÔNG luôn hiện Gallery — returning-user có `stageFlag`/`resume` đã lưu
 * thì `enterAfterAuth()` (app/page.tsx) tự resume THẲNG vào canvas, bỏ qua ProjectSelect
 * (đúng phát hiện §1.6 điểm 2 báo cáo). Bấm "Home" cần MỘT LẦN bỏ qua auto-resume đó, dù bấm
 * từ route studio (StudioBar → cần router.push('/') rồi remount đọc lại) hay từ chính route
 * '/' (Header → component Home đã mount sẵn, không remount nếu push cùng route).
 *
 * `requestGallery()` xử lý CẢ HAI: ghi cờ sessionStorage (đọc lại sau khi remount) VÀ bắn 1
 * CustomEvent (nghe được ngay nếu đang cùng trang, không cần đợi remount).
 */
const FORCE_GALLERY_KEY = 'interiorflow.forceGallery';
export const GO_HOME_EVENT = 'if:go-home';

export function requestGallery(): void {
  try {
    sessionStorage.setItem(FORCE_GALLERY_KEY, '1');
  } catch {
    /* bỏ qua */
  }
  try {
    window.dispatchEvent(new Event(GO_HOME_EVENT));
  } catch {
    /* bỏ qua (SSR/no window) */
  }
}

/** Đọc + XOÁ cờ (dùng 1 lần) — gọi trong enterAfterAuth() lúc route '/' vừa mount. */
export function consumeForceGallery(): boolean {
  try {
    const v = sessionStorage.getItem(FORCE_GALLERY_KEY) === '1';
    if (v) sessionStorage.removeItem(FORCE_GALLERY_KEY);
    return v;
  } catch {
    return false;
  }
}

/* ---------- Xác nhận rời trang khi có thay đổi CHƯA LƯU (VIỆC 1 UI, 04/08) ----------
 * `goHomeConfirmed()` là CỬA DUY NHẤT rời chặng về Gallery — `HomeButton.tsx` và mục "Về Thư
 * viện dự án" (`AppLogoMenu.tsx`) đều gọi hàm này, không tự viết `router.push('/')` riêng.
 *
 * Tín hiệu "chưa lưu" bám ĐÚNG `useSaveStatus` sẵn có (autosaver CAD/Present, `status==='saving'`
 * = còn thay đổi đang chờ debounce ghi) — KHÔNG dựng cơ chế theo dõi dirty mới. Render (flow
 * graph) chưa có autosave debounce tương đương nên `status` không bao giờ là 'saving' ở đó — đi
 * thẳng, không hỏi (đúng hiện trạng StatusBar, không bịa trạng thái cho chặng chưa có).
 *
 * Không dùng `window.confirm` (chặn thread JS, treo webview nhúng — cùng lý do CadEditor.tsx đã
 * bỏ, xem `ConfirmBar` ở đó) — `useLeaveConfirm` là store xếp hàng 1 hành động đang chờ, UI hỏi
 * thật nằm ở `components/studio/LeaveConfirmBar.tsx` (portal, mount 1 lần trong `AppChrome`).
 */
interface LeaveConfirmState {
  /** hành động đang chờ xác nhận (điều hướng thật) — null = không có hộp hỏi nào đang mở. */
  pending: (() => void) | null;
  ask: (action: () => void) => void;
  confirm: () => void;
  cancel: () => void;
}

export const useLeaveConfirm = create<LeaveConfirmState>((set, get) => ({
  pending: null,
  ask: (action) => set({ pending: action }),
  confirm: () => {
    const { pending } = get();
    set({ pending: null });
    pending?.();
  },
  cancel: () => set({ pending: null }),
}));

/**
 * Về Gallery — hỏi trước nếu có thay đổi chưa lưu, KHÔNG lặng lẽ rời trang.
 * `push:false` (chỉ AppChrome dùng, route '/' bấm logo khi ĐANG Ở '/' — HomeScreen tự lắng
 * `GO_HOME_EVENT` đổi view tại chỗ, `router.push('/')` sẽ là điều hướng thừa/no-op).
 */
export function goHomeConfirmed(router: { push: (href: string) => void }, opts?: { push?: boolean }): void {
  const navigate = () => {
    requestGallery();
    if (opts?.push !== false) router.push('/');
  };
  if (useSaveStatus.getState().status === 'saving') {
    useLeaveConfirm.getState().ask(navigate);
    return;
  }
  navigate();
}
