/**
 * lib/auth/roles.ts — VAI CỘNG TÁC + NĂNG LỰC (capability) của thành viên dự án. THUẦN: không
 * Prisma, không Next, không React — test bằng sucrase-node, dùng được cả client lẫn server.
 *
 * ── VÌ SAO CÓ HAI BỘ VAI (đọc kỹ trước khi "sửa cho gọn") ──────────────────────────────────
 * DB (`ProjectMember.role`, `lib/server/access-policy.ts`) lưu bộ vai RELAY theo trạm:
 *   owner · crea · drafter · bim · viewer   (chốt RESEARCH-ACCESS-CONTROL, BIGPICTURE §2)
 * Bộ này trả lời "ai CẦM chặng nào", KHÔNG trả lời "ai được duyệt / ai được giao việc / ai
 * được mời người". Slice cộng tác cần bộ vai CANONICAL theo NĂNG LỰC:
 *   owner · admin · editor · reviewer · viewer
 *
 * ⛔ KHÔNG đổi từ vựng cột `role` trong DB (schema là quyền của người khác — không migrate ở
 * đây, và `assertProjectAccess` trả 404 cho mọi chuỗi ngoài 5 vai lưu). Vai canonical là PHÉP
 * CHIẾU HIỆU DỤNG từ (vai lưu · isAdmin · chặng hiện tại của dự án):
 *   owner (lưu)                         → owner
 *   User.isAdmin (không cần là member)   → admin   (assertProjectAccess coi admin ≡ owner — giữ)
 *   crea/drafter/bim cầm ĐÚNG chặng     → editor  (canEditStage = true)
 *   crea/drafter/bim KHÔNG cầm chặng    → reviewer (thấy, góp ý, duyệt — không sửa nội dung)
 *   viewer                               → viewer
 * Hệ quả thật: một hoạ viên (drafter) ở chặng 2D là REVIEWER; dự án sang chặng 3D thì cùng
 * người đó thành EDITOR. Đây là đúng tinh thần relay — quyền theo trạm — không phải lỗi.
 *
 * KHOẢNG TRỐNG KHAI THẬT (không giả vờ có): chưa có cách gán 'reviewer'/'admin' BỀN cho một
 * thành viên độc lập với chặng (vd khách/CĐT chỉ duyệt) — cần mở rộng từ vựng cột `role` →
 * human gate schema. Cho tới đó, UI phải hiện vai canonical + vai lưu, không bịa.
 *
 * NĂNG LỰC quyết định mọi cửa: giao việc chỉ cho người CÓ `task:assignable` (không phải nhìn
 * nhãn), mời chỉ ai có `invite:create`, duyệt chỉ ai có `approval:decide`.
 */

import type { ProjectRole as StoredRole } from '../server/access-policy';
import { canEditStage, isProjectRole } from '../server/access-policy';

export type { StoredRole };

export const COLLAB_ROLES = ['owner', 'admin', 'editor', 'reviewer', 'viewer'] as const;
export type CollabRole = (typeof COLLAB_ROLES)[number];

export function isCollabRole(x: unknown): x is CollabRole {
  return typeof x === 'string' && (COLLAB_ROLES as readonly string[]).includes(x);
}

export const CAPABILITIES = [
  'project:read',
  'members:read',
  'members:manage',
  'invite:create',
  'invite:revoke',
  'share:manage',
  'content:edit',
  'comment:read',
  'comment:write',
  'comment:resolve',
  'approval:request',
  'approval:decide',
  'task:read',
  'task:write',
  'task:assign',
  'task:assignable',
] as const;
export type Capability = (typeof CAPABILITIES)[number];

const ALL: readonly Capability[] = CAPABILITIES;
const VIEWER: readonly Capability[] = ['project:read', 'members:read', 'comment:read', 'task:read'];
const REVIEWER: readonly Capability[] = [
  ...VIEWER,
  'comment:write',
  'comment:resolve',
  'approval:decide',
  'task:write',
  'task:assign',
  'task:assignable',
];
const EDITOR: readonly Capability[] = [
  ...VIEWER,
  'content:edit',
  'comment:write',
  'comment:resolve',
  'approval:request',
  'task:write',
  'task:assign',
  'task:assignable',
];

/** Ma trận vai → năng lực. Nguồn duy nhất — UI và API cùng đọc, không ai tự suy từ nhãn. */
export const ROLE_CAPABILITIES: Record<CollabRole, ReadonlySet<Capability>> = {
  owner: new Set(ALL),
  admin: new Set(ALL),
  editor: new Set(EDITOR),
  reviewer: new Set(REVIEWER),
  viewer: new Set(VIEWER),
};

export function can(role: CollabRole, cap: Capability): boolean {
  return ROLE_CAPABILITIES[role].has(cap);
}

export function capabilitiesOf(role: CollabRole): Capability[] {
  return CAPABILITIES.filter((c) => ROLE_CAPABILITIES[role].has(c));
}

export interface EffectiveRoleInput {
  /** vai lưu trong ProjectMember.role — null = không phải member (hoặc đã bị gỡ) */
  storedRole: string | null;
  isAdmin: boolean;
  /** Project.currentStage ('concept'|'render'|'present') */
  currentStage: string;
}

/**
 * Phép chiếu vai lưu → vai canonical (xem khối đầu file). Trả null = KHÔNG có quyền gì
 * (không member, không admin) — caller đổi thành 404 "không tìm thấy dự án", không lộ tồn tại.
 */
export function effectiveRole(input: EffectiveRoleInput): CollabRole | null {
  if (input.isAdmin) return input.storedRole === 'owner' ? 'owner' : 'admin';
  const r = input.storedRole;
  if (!isProjectRole(r)) return null;
  if (r === 'owner') return 'owner';
  if (r === 'viewer') return 'viewer';
  return canEditStage(r, input.currentStage) ? 'editor' : 'reviewer';
}

/** Có được GIAO VIỆC không — theo năng lực, không theo nhãn. */
export function isAssignable(role: CollabRole | null): boolean {
  return role !== null && can(role, 'task:assignable');
}

/** Vai lưu mà một lời mời được phép cấp. owner KHÔNG cấp qua link — chuyển owner là việc của members API. */
export const INVITABLE_STORED_ROLES = ['viewer', 'bim', 'drafter', 'crea'] as const;
export type InvitableStoredRole = (typeof INVITABLE_STORED_ROLES)[number];
export function isInvitableStoredRole(x: unknown): x is InvitableStoredRole {
  return typeof x === 'string' && (INVITABLE_STORED_ROLES as readonly string[]).includes(x);
}

/* ────────────────────────────── NHÃN SONG NGỮ ────────────────────────────── */

export interface Nhan { vi: string; en: string }

export const ROLE_LABELS: Record<CollabRole, Nhan> = {
  owner: { vi: 'Chủ dự án', en: 'Owner' },
  admin: { vi: 'Quản trị', en: 'Admin' },
  editor: { vi: 'Biên tập', en: 'Editor' },
  reviewer: { vi: 'Người duyệt', en: 'Reviewer' },
  viewer: { vi: 'Chỉ xem', en: 'Viewer' },
};

export const STORED_ROLE_LABELS: Record<StoredRole, Nhan> = {
  owner: { vi: 'Chủ dự án', en: 'Owner' },
  crea: { vi: 'Sáng tạo (cầm chặng 2D)', en: 'Creative (owns 2D stage)' },
  drafter: { vi: 'Hoạ viên (cầm chặng 3D)', en: 'Drafter (owns 3D stage)' },
  bim: { vi: 'Triển khai (cầm Trình chiếu)', en: 'Delivery (owns Presenting)' },
  viewer: { vi: 'Chỉ xem', en: 'Viewer' },
};

/** Ký hiệu hình dạng đi kèm vai — luật "màu không là kênh duy nhất": vai luôn có chữ + ký hiệu. */
export const ROLE_GLYPH: Record<CollabRole, string> = {
  owner: '◆',
  admin: '◈',
  editor: '●',
  reviewer: '◐',
  viewer: '○',
};

/* ─────────────────────────── TRẠNG THÁI TỪ CHỐI ─────────────────────────── */

/** Lý do từ chối TƯỜNG MINH — API trả về, UI nói đúng câu đó. Không có "lỗi không rõ". */
export type DenialReason =
  | 'anonymous' // chưa đăng nhập
  | 'session-stale' // cookie chết — phải đăng nhập lại
  | 'not-member' // không phải thành viên / dự án không tồn tại (gộp — không lộ tồn tại)
  | 'insufficient' // là thành viên nhưng thiếu năng lực
  | 'revoked' // quyền đã bị thu hồi (mất member giữa chừng)
  | 'server-unavailable';

export interface Denial {
  denied: true;
  reason: DenialReason;
  /** năng lực bị thiếu (khi reason = insufficient) */
  capability?: Capability;
  /** vai hiện có (khi insufficient) — để UI nói "bạn đang là Chỉ xem" */
  role?: CollabRole;
}

export const DENIAL_LABELS: Record<DenialReason, Nhan> = {
  anonymous: { vi: 'Bạn chưa đăng nhập.', en: 'You are not signed in.' },
  'session-stale': { vi: 'Phiên đăng nhập đã hết — đăng nhập lại.', en: 'Your session has expired — sign in again.' },
  'not-member': { vi: 'Bạn không phải thành viên dự án này (hoặc dự án không tồn tại).', en: 'You are not a member of this project (or it does not exist).' },
  insufficient: { vi: 'Vai của bạn không đủ quyền cho thao tác này.', en: 'Your role does not allow this action.' },
  revoked: { vi: 'Quyền của bạn trong dự án đã bị thu hồi.', en: 'Your access to this project has been revoked.' },
  'server-unavailable': { vi: 'Máy chủ chưa trả lời — quyền đang dùng bản đã lưu.', en: 'Server unreachable — using cached permissions.' },
};

export function denialStatus(reason: DenialReason): 401 | 403 | 404 | 503 {
  switch (reason) {
    case 'anonymous':
    case 'session-stale':
      return 401;
    case 'insufficient':
    case 'revoked':
      return 403;
    case 'not-member':
      return 404;
    case 'server-unavailable':
      return 503;
  }
}
