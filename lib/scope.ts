'use client';

/**
 * lib/scope.ts — KHÁI NIỆM SCOPE (Task #18 · nền T0).
 *
 * Mọi màn hình trong InteriorFlow thuộc đúng MỘT trong hai phạm vi:
 *   - 'global'  : toàn cục, không gắn 1 dự án cụ thể (Gallery/chọn dự án, login,
 *                 settings, thư viện chung, các route showcase demo).
 *   - 'project' : thuộc-1-dự-án — CAD/Render/Present/Notebook/Dashboard của `[id]`.
 *                 Ở scope này MỌI truy vấn/hiển thị chỉ được lấy dữ liệu của đúng
 *                 dự án đó (chống rò dữ liệu chéo giữa các dự án).
 *
 * Route THỰC TẾ của scope project là `/projects/[id]/…` (KHÔNG đổi tên URL —
 * `/prj/` chỉ là ký hiệu logic trong tài liệu, xem docs/IF-CORE-SCHEMA.md §1B).
 *
 * Hai nguồn "tôi đang ở dự án nào?":
 *   1) URL — khi đứng trên route `/projects/[id]/…` thì `[id]` là chân lý (dùng
 *      `parseScope`/`useScope`). Đây là scope "cứng" theo địa chỉ.
 *   2) Store `currentProjectId`/`currentFlowId` — các CHẶNG hiện chạy trên route
 *      toàn cục (`/`, `/cad-editor`, `/present-editor`) chưa nằm dưới `/projects/[id]`
 *      nên URL không mang `[id]`; chúng đọc scope từ store (flow đang mở gắn dự án
 *      nào). Đây là scope "mềm" theo phiên làm việc. (Việc DỜI các chặng này xuống
 *      dưới `/projects/[id]/…` là nợ kiến trúc — xem báo cáo audit Task #18.)
 */

import { usePathname } from 'next/navigation';
import { useFlowStore } from '@/lib/store';
import { parseScope, pickStableRouteId, type ScopeInfo } from '@/lib/scope-core';

// Phần thuần (parseScope, pickStableRouteId, AppScope, ScopeInfo) sống ở
// lib/scope-core.ts để test bằng sucrase-node không cần React/store.
export type { AppScope, ScopeInfo } from '@/lib/scope-core';
export { parseScope, pickStableRouteId } from '@/lib/scope-core';

/**
 * Hook scope THEO URL — dùng ở các trang đã nằm dưới `/projects/[id]/…`
 * (Notebook, Overview…). Trên route toàn cục trả về 'global'.
 */
export function useScope(): ScopeInfo {
  const pathname = usePathname();
  return parseScope(pathname);
}

/**
 * id dự án ỔN ĐỊNH cho ĐIỀU HƯỚNG sang `/projects/[id]/…` từ một CHẶNG toàn cục.
 * Ưu tiên `currentProjectId` (id Project thật, cuid). Nếu flow chưa gán dự án thì
 * dùng `currentFlowId` (cuid duy nhất theo flow) làm khoá ổn định — KHÔNG bao giờ
 * dùng slug tên flow (mutable + trùng tên = rò dữ liệu chéo). `fallback` chỉ khi
 * chưa mở flow nào.
 *
 * `resolveNotebookProjectId` (server) hiểu cả hai: cuid Project thật của user →
 * dùng thẳng; cuid khác (flowId) → bucket ẩn duy nhất theo id đó.
 */
export function stableProjectRouteId(fallback = 'default'): string {
  const s = useFlowStore.getState();
  return pickStableRouteId(s.currentProjectId, s.currentFlowId, fallback);
}

/**
 * Hook phiên bản reactive của `stableProjectRouteId` (re-render khi đổi flow/dự án).
 */
export function useActiveProjectRouteId(fallback = 'default'): string {
  const projectId = useFlowStore((s) => s.currentProjectId);
  const flowId = useFlowStore((s) => s.currentFlowId);
  return pickStableRouteId(projectId, flowId, fallback);
}
