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
import { excludeHiddenNotebookProjects } from '@/lib/notebook/resolveProject';
import { projectScopeEnforced } from './access-scope';

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
  const [m, u, p] = await Promise.all([
    // 26/07 local-first (docs/IF-CORE-SCHEMA.md §2C): deletedAt: null BẮT BUỘC — member đã bị
    // gỡ (soft-delete) không được coi là còn quyền, dù hàng vẫn nằm trong DB.
    prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId }, deletedAt: null },
      select: { role: true },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } }),
    // Project bị xoá mềm cũng không còn truy cập được, kể cả admin coi như owner ở nhánh trên.
    prisma.project.findUnique({ where: { id: projectId }, select: { deletedAt: true } }),
  ]);
  if (!p || p.deletedAt) throw new AccessError(404, 'Không tìm thấy dự án.');
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

/**
 * ⚙️ SHARED ACCESS PRIMITIVE — Wave 1 (26/08, Hoà mở lane).
 *
 * Bản CŨ của hàm này lệch ngữ nghĩa với `assertProjectAccess()` ở BA điểm, và vì nó có **0 nơi
 * gọi** nên chỗ lệch chưa bao giờ nổ. Bật nguyên trạng là tạo hai định nghĩa "thấy được" mâu
 * thuẫn nhau trong cùng một hệ — nguy hiểm hơn không lọc gì, vì nó *trông như* đã lọc:
 *
 *   ① KHÔNG lọc `Project.deletedAt` → dự án xoá mềm vẫn lọt vào list, trong khi route đơn lẻ
 *     trả 404. Hai cửa nói hai chuyện khác nhau về cùng một dự án.
 *   ② KHÔNG có nhánh `isAdmin` → `assertProjectAccess` coi admin là `owner` mọi dự án, còn hàm
 *     này trả **rỗng** cho admin không phải member. Bật lọc là admin **mất sạch dashboard**.
 *   ③ KHÔNG loại bucket ẩn `__nb:*` → mỗi route list phải tự nhớ, và hôm nay đúng là 4 chỗ
 *     chép tay cùng một mệnh đề.
 *
 * Nay hàm này là **cửa DUY NHẤT** trả phạm vi dự án cho truy vấn dạng list, và phải cho **cùng
 * câu trả lời** với `assertProjectAccess` trên bốn ca: admin · dự án xoá mềm · member bị gỡ ·
 * bucket ẩn. `lib/server/access-scope.test.ts` canh đúng bốn ca đó.
 *
 * ⚠️ Chưa route nào gọi hàm này tại commit thêm nó — CỐ Ý. Lát W1-2 chỉ cứng hoá primitive
 * (0 caller ⇒ 0 rủi ro hành vi); việc bật lọc là các lát sau, mỗi lát một route, có cờ.
 */
export interface PhamViDuAn {
  /** `true` = user là admin: thấy MỌI dự án sống. Khi đó `ids` là toàn bộ dự án sống. */
  laAdmin: boolean;
  /** Danh sách projectId user được thấy — đã loại xoá mềm và (mặc định) bucket ẩn. */
  ids: string[];
}

export interface TuyChonPhamVi {
  /** `true` = giữ lại bucket ẩn `__nb:*`. Mặc định `false` (Gallery/Dashboard không được thấy). */
  includeHidden?: boolean;
}

/**
 * Phạm vi dự án của user, kèm cờ admin. Dùng cái này khi cần biết "vì sao thấy".
 */
export async function projectScope(userId: string, opts: TuyChonPhamVi = {}): Promise<PhamViDuAn> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } });
  const anBucket = opts.includeHidden ? {} : excludeHiddenNotebookProjects;

  // Cửa hậu admin: giữ NGUYÊN ngữ nghĩa `assertProjectAccess` (admin ≡ owner mọi dự án).
  // Không có nhánh này thì bật lọc = admin mất sạch dashboard — chính là hồi quy ②.
  if (u?.isAdmin) {
    const all = await prisma.project.findMany({
      where: { deletedAt: null, ...anBucket },
      select: { id: true },
    });
    return { laAdmin: true, ids: all.map((r) => r.id) };
  }

  const rows = await prisma.projectMember.findMany({
    // deletedAt trên CẢ HAI phía: member bị gỡ không còn thấy, và dự án xoá mềm thì không ai
    // thấy — kể cả member còn sống. Bản cũ thiếu vế thứ hai (①).
    where: { userId, deletedAt: null, project: { deletedAt: null, ...anBucket } },
    select: { projectId: true },
  });
  return { laAdmin: false, ids: rows.map((r) => r.projectId) };
}

/**
 * Danh sách projectId user được thấy. Vỏ mỏng của `projectScope` cho caller không cần cờ admin.
 */
export async function visibleProjectIds(userId: string, opts: TuyChonPhamVi = {}): Promise<string[]> {
  return (await projectScope(userId, opts)).ids;
}

/**
 * Mệnh đề `where` cho `prisma.project.findMany` — để route KHÔNG tự ghép `{ id: { in: [...] } }`
 * mỗi nơi một kiểu. Đây là điểm mà "cửa duy nhất" thật sự có hiệu lực: một helper, không phải
 * 18 mệnh đề chép tay.
 */
export async function projectScopeWhere(
  userId: string,
  opts: TuyChonPhamVi = {},
): Promise<{ id: { in: string[] }; deletedAt: null }> {
  return { id: { in: await visibleProjectIds(userId, opts) }, deletedAt: null };
}

/**
 * Mệnh đề `where` cho `prisma.flow.findMany` theo phạm vi. Flow thuộc về user (`userId`) HOẶC
 * thuộc một dự án (`projectId`) — nên "thấy được" là hợp của hai vế, không phải một.
 *
 * Cờ TẮT → trả mệnh đề y hệt hôm nay (`{ deletedAt: null }`), không đổi hành vi.
 */
export async function flowScopeWhere(userId: string): Promise<Record<string, unknown>> {
  if (!projectScopeEnforced()) return { deletedAt: null };
  const pv = await projectScope(userId);
  if (pv.laAdmin) return { deletedAt: null };
  return {
    deletedAt: null,
    OR: [{ userId }, { projectId: { in: pv.ids } }],
  };
}

/**
 * Danh sách userId **cùng phạm vi** với `userId` — chính mình + mọi người là member của một dự án
 * mà mình thấy được. Dùng cho roster: hôm nay `dashboard` trả `prisma.user.findMany()` **không
 * điều kiện**, tức là danh sách toàn bộ người dùng của cài đặt.
 *
 * Cờ TẮT → `null`, caller giữ nguyên truy vấn cũ.
 */
export async function visibleUserIds(userId: string): Promise<string[] | null> {
  if (!projectScopeEnforced()) return null;
  const pv = await projectScope(userId);
  if (pv.laAdmin) return null; // admin thấy toàn bộ roster — cùng cửa hậu với assertProjectAccess
  const rows = await prisma.projectMember.findMany({
    where: { projectId: { in: pv.ids }, deletedAt: null },
    select: { userId: true },
  });
  return Array.from(new Set([userId, ...rows.map((r) => r.userId)]));
}

/* ===================== PHẠM VI TÀI NGUYÊN NGOÀI CÂY PROJECT ===================== */

// Phần THUẦN nằm ở `access-scope.ts` (test bằng sucrase-node, không cần Prisma); re-export tại
// đây để route chỉ có MỘT import path cho mọi câu hỏi về quyền — đúng khuôn `access-policy.ts`.
export * from './access-scope';

/** Helper tiện dùng trong route: đổi AccessError thành {status,message} — còn lại re-throw. */
export function accessErrorPayload(e: unknown): { status: 401 | 403 | 404; message: string } | null {
  return e instanceof AccessError ? { status: e.status, message: e.message } : null;
}
