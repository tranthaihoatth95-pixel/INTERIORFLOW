/**
 * lib/server/access.ts — ACCESS-CONTROL M1 (docs/RESEARCH-ACCESS-CONTROL.md §2-3,
 * IF1_IF2_BIGPICTURE.md §2 "dây chuyền tiếp sức").
 *
 * Cửa DUY NHẤT để hỏi "user này có quyền gì trên project này". Route KHÔNG được tự
 * query ProjectMember rải rác — mọi kiểm tra quyền đi qua đây để không sót chốt chặn.
 *
 * Phần thuần nằm ở lib/server/access-policy.ts (test bằng sucrase-node, không cần DB);
 * re-export tại đây để giữ 1 import path duy nhất.
 */
import { prisma } from '@/lib/server/db';
import { ROLE_RANK, canEditStage, isProjectRole, type ProjectRole } from './access-policy';

export * from './access-policy';

/* ============================== PHẦN ĐỤNG DB ============================== */

export class AccessError extends Error {
  constructor(
    public status: 401 | 403 | 404,
    msg: string,
  ) {
    super(msg);
  }
}

/**
 * Trả về role của user trên project, hoặc ném AccessError.
 * - 404 chứ không 403 khi không phải member: không tiết lộ "project này có tồn tại".
 * - `User.isAdmin` là cửa hậu (giữ nguyên thiết kế cũ): admin được coi như 'owner'.
 */
export async function assertProjectAccess(
  userId: string,
  projectId: string,
  minRole: ProjectRole = 'viewer',
): Promise<ProjectRole> {
  const [m, u] = await Promise.all([
    prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { role: true },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } }),
  ]);
  if (u?.isAdmin) return 'owner';
  if (!m || !isProjectRole(m.role)) throw new AccessError(404, 'Không tìm thấy dự án.');
  const role = m.role;
  if (ROLE_RANK[role] < ROLE_RANK[minRole]) throw new AccessError(403, 'Không đủ quyền.');
  return role;
}

/**
 * GATE helper chính của M1: user có được SỬA ở chặng `stage` của project không.
 * (Đọc = cứ là member là được — dùng assertProjectAccess minRole 'viewer'.)
 * Không ném lỗi — trả boolean để caller tự quyết 403 hay chỉ ẩn UI.
 */
export async function canAccessStage(
  userId: string,
  projectId: string,
  stage: string,
): Promise<boolean> {
  try {
    const role = await assertProjectAccess(userId, projectId, 'viewer');
    return canEditStage(role, stage);
  } catch {
    return false;
  }
}

/** Danh sách projectId user được thấy — dùng cho truy vấn dạng list (bật lọc ở wave sau). */
export async function visibleProjectIds(userId: string): Promise<string[]> {
  const rows = await prisma.projectMember.findMany({
    where: { userId },
    select: { projectId: true },
  });
  return rows.map((r) => r.projectId);
}

/** Helper tiện dùng trong route: đổi AccessError thành {status,message} — còn lại re-throw. */
export function accessErrorPayload(e: unknown): { status: 401 | 403 | 404; message: string } | null {
  return e instanceof AccessError ? { status: e.status, message: e.message } : null;
}
