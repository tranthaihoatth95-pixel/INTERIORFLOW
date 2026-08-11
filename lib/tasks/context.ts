/**
 * lib/tasks/context.ts — TaskContext Link (chốt 11/08, `docs/SPEC-KHOI-TAO-DU-AN-2026-08-11.md`
 * §"Dây sang ngữ cảnh" + Phiếu 1 `docs/PHIEU-CHONG-RUI-RO-5-CHU-DE.md`): việc mang
 * {stage, workspaceId?, entityId?} → bấm là nhảy đúng chỗ trong dự án.
 *
 * Logic THUẦN (không React, không prisma) để test bằng sucrase-node như lib/tasks/board.ts.
 * ⚠️ Chỉ `import type` từ lib/server/tasks — không kéo prisma vào bundle client.
 *
 * Map stage → route dự án (route THẬT trong app/projects/[id]/):
 *   concept → /projects/{id}/cad      (Thiết kế 2D — tên thư mục kỹ thuật giữ 'cad')
 *   render  → /projects/{id}/render   (Thiết kế 3D)
 *   present → /projects/{id}/present  (Trình chiếu)
 * `?focusEntity={entityId}` chỉ là query param — việc các chặng ĐỌC nó để select đối tượng
 * là phiên sau (ghi ở phiếu), đây KHÔNG phải hợp đồng đã chạy.
 */

import type { TaskRow, TaskStage } from '../server/tasks';

/** Nhãn hiển thị chặng — ĐÚNG bộ tên chốt 07/08 (VI) / song ngữ EN. */
export const STAGE_LABELS: Record<TaskStage, { vi: string; en: string }> = {
  concept: { vi: 'Thiết kế 2D', en: '2D Design' },
  render: { vi: 'Thiết kế 3D', en: '3D Design' },
  present: { vi: 'Trình chiếu', en: 'Presenting' },
};

const STAGE_ROUTES: Record<TaskStage, string> = {
  concept: 'cad',
  render: 'render',
  present: 'present',
};

/** Phần task cần cho deep-link — nhận cả TaskRow đầy đủ. */
export type TaskContextSource = Pick<TaskRow, 'projectId' | 'stage' | 'entityId'>;

/**
 * Dựng deep-link từ ngữ cảnh việc. Không bịa:
 *  - thiếu `stage` (hoặc thiếu `projectId`) → null — không có chỗ để nhảy;
 *  - có `stage` không `entityId` → link chặng, KHÔNG kèm query;
 *  - có cả hai → link chặng + `?focusEntity=` (encode an toàn).
 */
export function buildTaskDeepLink(task: TaskContextSource): string | null {
  if (!task.projectId || !task.stage) return null;
  const seg = STAGE_ROUTES[task.stage];
  if (!seg) return null;
  const base = `/projects/${encodeURIComponent(task.projectId)}/${seg}`;
  return task.entityId ? `${base}?focusEntity=${encodeURIComponent(task.entityId)}` : base;
}
