/**
 * components/home/widgets/nav.ts — [marker: DongStudio] điều hướng dùng chung cho widget Trang 2
 * — "click nhảy đúng ngữ cảnh" (phiếu ④.5, dây TaskContext Link đã ship 11/08). `router` là kết
 * quả `useRouter()` gọi Ở COMPONENT (hook), truyền vào đây như một object thường — không phải
 * gọi hook lại trong hàm này.
 */

import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { stageRoutePath, stageSegmentForPhase } from '@/lib/scope-core';
import type { Phase } from '@/lib/phases';

/** Chưa biết đúng chặng (Task.stage null) → mặc định 'render' (Thiết kế 3D, chặng dùng nhiều
 * nhất — cùng DEFAULT_PHASE của lib/phases.ts). */
export function goToProjectStage(router: AppRouterInstance, projectId: string, stage: Phase | null): void {
  router.push(stageRoutePath(projectId, stageSegmentForPhase(stage ?? 'render')));
}
