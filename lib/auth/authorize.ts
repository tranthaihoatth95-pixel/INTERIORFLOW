/**
 * lib/auth/authorize.ts — QUYẾT ĐỊNH CẤP QUYỀN (grant) thuần + kiểm năng lực. Không Prisma —
 * phần đọc DB nằm ở `authorize-db.ts`, để bảng chân trị ở đây test được không cần dev.db.
 *
 * Luật: mọi route của slice cộng tác hỏi quyền qua `authorizeProject()` (authorize-db) → nhận
 * `Grant` → `requireCapability(grant, cap)`. Không route nào tự đọc ProjectMember, không route
 * nào suy quyền từ nhãn hiển thị.
 */

import {
  type Capability,
  type CollabRole,
  type Denial,
  type DenialReason,
  type StoredRole,
  can,
  capabilitiesOf,
  denialStatus,
  effectiveRole,
  isAssignable,
} from './roles';

export interface Grant {
  userId: string;
  projectId: string;
  role: CollabRole;
  /** vai LƯU (null khi là admin toàn cục không có hàng member) */
  storedRole: StoredRole | null;
  currentStage: string;
  capabilities: Capability[];
}

export interface GrantFacts {
  userId: string;
  projectId: string;
  /** null = dự án không tồn tại hoặc đã xoá mềm */
  project: { currentStage: string; deletedAt: Date | null } | null;
  /** null = không có hàng member CÒN HIỆU LỰC (deletedAt null) */
  memberRole: string | null;
  isAdmin: boolean;
}

/**
 * Lỗi từ chối mang lý do tường minh — route đổi thành JSON `Denial` + status đúng.
 * Cùng hình dạng `{status, message}` với `AccessError` của lib/server/access.ts (cố ý KHÔNG
 * extends nó: file đó kéo Prisma qua alias `@/` — phần thuần này phải chạy được không DB).
 */
export class DenialError extends Error {
  status: 401 | 403 | 404 | 503;
  constructor(public denial: Denial) {
    super(denialText(denial.reason));
    this.name = 'DenialError';
    this.status = denialStatus(denial.reason);
  }
}

function denialText(reason: DenialReason): string {
  switch (reason) {
    case 'anonymous':
      return 'unauthorized';
    case 'session-stale':
      return 'session expired';
    case 'not-member':
      return 'Không tìm thấy dự án.';
    case 'insufficient':
      return 'Không đủ quyền.';
    case 'revoked':
      return 'Quyền đã bị thu hồi.';
    case 'server-unavailable':
      return 'server unavailable';
  }
}

/**
 * Bảng chân trị: facts → Grant hoặc DenialError.
 *  - dự án không có / xoá mềm → not-member (404, không lộ tồn tại — giữ đúng assertProjectAccess)
 *  - không member + không admin → not-member (404)
 *  - còn lại → vai canonical qua `effectiveRole`
 */
export function decideGrant(f: GrantFacts): Grant {
  if (!f.project || f.project.deletedAt) throw new DenialError({ denied: true, reason: 'not-member' });
  const role = effectiveRole({ storedRole: f.memberRole, isAdmin: f.isAdmin, currentStage: f.project.currentStage });
  if (!role) throw new DenialError({ denied: true, reason: 'not-member' });
  const storedRole = (['owner', 'crea', 'drafter', 'bim', 'viewer'] as const).find((r) => r === f.memberRole) ?? null;
  return {
    userId: f.userId,
    projectId: f.projectId,
    role,
    storedRole,
    currentStage: f.project.currentStage,
    capabilities: capabilitiesOf(role),
  };
}

/** Ném DenialError(403 insufficient) nếu grant thiếu năng lực. Trả lại grant để chain. */
export function requireCapability(grant: Grant, cap: Capability): Grant {
  if (!can(grant.role, cap)) {
    throw new DenialError({ denied: true, reason: 'insufficient', capability: cap, role: grant.role });
  }
  return grant;
}

export function hasCapability(grant: Grant | null | undefined, cap: Capability): boolean {
  return !!grant && can(grant.role, cap);
}

/** Thành viên còn hiệu lực + vai canonical + cờ giao-được — nguồn cho picker giao việc. */
export interface MemberSummary {
  userId: string;
  name: string;
  storedRole: StoredRole;
  role: CollabRole;
  assignable: boolean;
}

export function summarizeMembers(
  rows: Array<{ userId: string; name: string; role: string }>,
  currentStage: string,
): MemberSummary[] {
  const out: MemberSummary[] = [];
  for (const r of rows) {
    const role = effectiveRole({ storedRole: r.role, isAdmin: false, currentStage });
    if (!role) continue; // vai lạ trong DB → không hiện, không bịa
    out.push({
      userId: r.userId,
      name: r.name,
      storedRole: r.role as StoredRole,
      role,
      assignable: isAssignable(role),
    });
  }
  return out;
}

/**
 * Kiểm danh sách giao việc: mọi id phải là thành viên còn hiệu lực CÓ `task:assignable`.
 * Trả về id không hợp lệ kèm lý do — route đổi thành 400, KHÔNG lặng lẽ lọc bớt (lọc bớt là
 * "giả thành công": người dùng tưởng đã giao mà thật ra không).
 */
export interface AssigneeCheck {
  ok: boolean;
  ineligible: Array<{ userId: string; reason: 'not-member' | 'not-assignable' }>;
}

export function checkAssignees(assigneeIds: string[], members: MemberSummary[]): AssigneeCheck {
  const byId = new Map(members.map((m) => [m.userId, m]));
  const ineligible: AssigneeCheck['ineligible'] = [];
  for (const id of new Set(assigneeIds)) {
    const m = byId.get(id);
    if (!m) ineligible.push({ userId: id, reason: 'not-member' });
    else if (!m.assignable) ineligible.push({ userId: id, reason: 'not-assignable' });
  }
  return { ok: ineligible.length === 0, ineligible };
}

/** Đổi lỗi bất kỳ thành payload từ chối JSON — null nếu không phải lỗi quyền. */
export function denialPayload(e: unknown): { status: number; body: Denial & { error: string } } | null {
  if (e instanceof DenialError) {
    return { status: e.status, body: { ...e.denial, error: e.message } };
  }
  // AccessError của lib/server/access.ts (duck-type theo hình dạng {status ∈ 401|403|404, message})
  if (e instanceof Error && e.name === 'AccessError') {
    const st = (e as { status?: number }).status;
    if (st === 401 || st === 403 || st === 404) {
      const reason: DenialReason = st === 401 ? 'anonymous' : st === 403 ? 'insufficient' : 'not-member';
      return { status: st, body: { denied: true, reason, error: e.message } };
    }
  }
  return null;
}
