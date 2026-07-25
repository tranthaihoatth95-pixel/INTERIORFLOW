/**
 * lib/scope-core.ts — phần THUẦN của khái niệm scope (Task #18).
 *
 * Không 'use client', không import React/store — test được bằng sucrase-node.
 * `lib/scope.ts` (client) re-export từ đây + thêm hook React.
 */

export type AppScope = 'global' | 'project';

export interface ScopeInfo {
  scope: AppScope;
  /** id dự án khi scope === 'project'; null khi 'global'. */
  projectId: string | null;
}

/**
 * Bóc scope TỪ URL. Khớp `/projects/<id>[/...]` (route THỰC TẾ — KHÔNG dùng `/prj/`,
 * xem docs/IF-CORE-SCHEMA.md §1B). Trả `{ scope:'project', projectId }` nếu là route
 * dự án; ngược lại `{ scope:'global', projectId:null }`.
 */
export function parseScope(pathname: string | null | undefined): ScopeInfo {
  if (!pathname) return { scope: 'global', projectId: null };
  const path = pathname.split(/[?#]/)[0]; // bỏ query/hash
  const segs = path.split('/').filter(Boolean);
  if (segs[0] === 'projects' && segs[1]) {
    return { scope: 'project', projectId: decodeURIComponent(segs[1]) };
  }
  return { scope: 'global', projectId: null };
}

/**
 * Chọn id ổn định cho điều hướng `/projects/[id]/…`: Project.id thật ưu tiên, rồi
 * Flow.id, cuối cùng fallback. KHÔNG bao giờ slug tên (mutable → rò dữ liệu chéo).
 */
export function pickStableRouteId(
  currentProjectId: string | null | undefined,
  currentFlowId: string | null | undefined,
  fallback = 'default',
): string {
  return currentProjectId || currentFlowId || fallback;
}

/* ══════════════════════════════════════════════════════════════════════════
 * Task #21 (ĐỔ NỀN 1B) — CHẶNG nằm dưới `/projects/[id]/…`, URL = nguồn sự thật.
 * ══════════════════════════════════════════════════════════════════════════ */

/** Bốn chặng/công cụ có route riêng dưới `/projects/[id]/`. */
export type StageSegment = 'cad' | 'render' | 'present' | 'photo';

export const STAGE_SEGMENTS: readonly StageSegment[] = ['cad', 'render', 'present', 'photo'];

/**
 * Route TOÀN CỤC cũ ↔ chặng. Giữ để (a) route cũ redirect sang scope dự án,
 * (b) resume-state tiếp tục ghi tên route cũ (backward-compat bookmark &
 * `RESUMABLE_ROUTES` trong lib/resume.ts không phải đổi kiểu).
 */
export const LEGACY_STAGE_ROUTE: Record<StageSegment, string> = {
  cad: '/cad-editor',
  render: '/',
  present: '/present-editor',
  photo: '/photo-editor',
};

export function isStageSegment(v: unknown): v is StageSegment {
  return typeof v === 'string' && (STAGE_SEGMENTS as readonly string[]).includes(v);
}

/** Đường dẫn chặng trong scope dự án. `id` được encode để an toàn với id lạ. */
export function stageRoutePath(projectId: string, stage: StageSegment): string {
  return `/projects/${encodeURIComponent(projectId)}/${stage}`;
}

/**
 * Bóc `{ projectId, stage }` từ `/projects/<id>/<stage>`. Trả null nếu không phải
 * route chặng trong scope dự án (vd `/projects/<id>/overview`, `/cad-editor`).
 */
export function parseStageRoute(
  pathname: string | null | undefined,
): { projectId: string; stage: StageSegment } | null {
  if (!pathname) return null;
  const segs = pathname.split(/[?#]/)[0].split('/').filter(Boolean);
  if (segs[0] !== 'projects' || !segs[1] || !isStageSegment(segs[2])) return null;
  return { projectId: decodeURIComponent(segs[1]), stage: segs[2] };
}

/** Phase của store ↔ segment URL. Chặng 1 giữ id 'concept' (xem lib/phases.ts). */
export function stageSegmentForPhase(phase: 'concept' | 'render' | 'present'): StageSegment {
  return phase === 'concept' ? 'cad' : phase;
}

/**
 * Flow nào phải mở để URL `/projects/<routeId>/…` hiển thị ĐÚNG dự án?
 *
 * `routeId` có thể là Project.id thật HOẶC Flow.id (flow chưa gán dự án —
 * `pickStableRouteId`). Ưu tiên khớp theo dự án (mọi flow của dự án đó, lấy cái
 * đầu tiên) rồi mới tới khớp thẳng Flow.id: nếu routeId là Project.id thì flow
 * của dự án LUÔN đúng hơn. Không tìm được → null (caller phải DỌN canvas, tuyệt
 * đối không giữ nguyên graph của dự án khác).
 */
export function resolveFlowForRouteId(
  routeId: string,
  flows: readonly { id: string; projectId: string | null }[],
): string | null {
  if (!routeId) return null;
  const byProject = flows.find((f) => f.projectId && f.projectId === routeId);
  if (byProject) return byProject.id;
  const byFlow = flows.find((f) => f.id === routeId);
  return byFlow ? byFlow.id : null;
}

/**
 * Store hiện tại đã trỏ đúng `routeId` chưa? (dùng để bỏ qua vòng đồng bộ tốn
 * request khi vừa điều hướng nội bộ trong CÙNG dự án).
 */
export function storeMatchesRouteId(
  routeId: string,
  currentProjectId: string | null | undefined,
  currentFlowId: string | null | undefined,
): boolean {
  if (!routeId) return false;
  return currentProjectId === routeId || currentFlowId === routeId;
}
