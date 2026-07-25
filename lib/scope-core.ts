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
