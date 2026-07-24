/**
 * resolveNotebookProject — trị bug NotebookLM 404 "Project vs Flow id mismatch".
 *
 * Vấn đề: `NotebookButton` truyền slug tên flow (vd "untitled-flow") vào URL
 * `/projects/[id]/notebook`, nhưng route notebook cũ dùng `prisma.project.findUnique
 * ({ where: { id: params.projectId }})` — cuid không khớp slug → luôn 404.
 *
 * Fix (option C an toàn nhất — không đổi contract client, không schema migration):
 * - Nếu `paramId` LÀ Project.id thật CỦA user → dùng luôn.
 * - Ngược lại (slug/free-text/không tồn tại) → tự tạo project "ẩn" cho user, tên
 *   deterministic `__nb:<paramId>` (unique theo user+name), thoả composite key
 *   người-dùng-này + slug-này → mỗi user một bucket riêng, cùng slug → cùng notebook.
 *
 * Project ẩn (name bắt đầu `__nb:`) được LOẠI khỏi `/api/flows` project list và
 * `/api/dashboard` để không xuất hiện ở Gallery (đã update ở các route đó).
 */
import { prisma } from '@/lib/server/db';

export const HIDDEN_NOTEBOOK_PREFIX = '__nb:';

/** Tên project ẩn cho user + slug (deterministic). */
export function hiddenNotebookProjectName(paramId: string): string {
  // Cắt 120 ký tự để tránh slug siêu dài; slug đã slugify từ NotebookButton nên chỉ [a-z0-9-].
  return `${HIDDEN_NOTEBOOK_PREFIX}${String(paramId ?? '').slice(0, 120) || 'default'}`;
}

/**
 * Trả về Project.id user sở hữu, ứng với `paramId`. Tự tạo bucket ẩn nếu cần.
 * Đảm bảo tính đúng đắn của FK cho ProjectNotebook.
 */
export async function resolveNotebookProjectId(userId: string, paramId: string): Promise<string> {
  const clean = String(paramId ?? '').trim();
  if (clean) {
    const real = await prisma.project.findUnique({
      where: { id: clean },
      select: { id: true, userId: true },
    });
    if (real) {
      if (real.userId !== userId) {
        // Có tồn tại nhưng KHÔNG phải của user → không được đọc/ghi. Rơi xuống bucket ẩn
        // của chính user (không throw để không gây 404 giả — user vẫn có notebook trống).
      } else {
        return real.id;
      }
    }
  }

  const bucketName = hiddenNotebookProjectName(clean || 'default');
  const existing = await prisma.project.findFirst({
    where: { userId, name: bucketName },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await prisma.project.create({
    // ACCESS-CONTROL M1: bucket ẩn cũng có owner membership — nhất quán luật "mọi Project
    // có đúng ≥1 owner" (backfill script), dù bucket không hiện ở Gallery/panel Members.
    data: { userId, name: bucketName, members: { create: { userId, role: 'owner' } } },
    select: { id: true },
  });
  return created.id;
}

/** Predicate để lọc hidden notebook projects ra khỏi Gallery/Dashboard. */
export const excludeHiddenNotebookProjects = {
  NOT: { name: { startsWith: HIDDEN_NOTEBOOK_PREFIX } },
} as const;
