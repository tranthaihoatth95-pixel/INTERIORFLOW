/**
 * lib/server/access-policy.ts — phần THUẦN của access control (không import Prisma/Next)
 * để test được bằng sucrase-node (cùng mẫu auth-policy.ts). lib/server/access.ts re-export
 * toàn bộ — caller cứ import từ access.ts như thường.
 */

export const ROLES = ['owner', 'crea', 'drafter', 'bim', 'viewer'] as const;
export type ProjectRole = (typeof ROLES)[number];

export function isProjectRole(x: unknown): x is ProjectRole {
  return typeof x === 'string' && (ROLES as readonly string[]).includes(x);
}

/** Thứ bậc — số lớn hơn = quyền cao hơn. Dùng cho minRole của assertProjectAccess. */
export const ROLE_RANK: Record<ProjectRole, number> = {
  viewer: 0,
  bim: 1,
  drafter: 2,
  crea: 3,
  owner: 4,
};

/** 3 chặng sản phẩm — ID nội bộ (lib/phases.ts), UI hiển thị Drafting CAD·Rendering·Presenting. */
export const STAGES = ['concept', 'render', 'present'] as const;
export type ProjectStage = (typeof STAGES)[number];

/**
 * Chặng nào do vai nào CẦM (chủ trạm) — relay pipeline BIGPICTURE §2:
 * CREA (sáng tạo) → Hoạ viên (kỹ thuật) → Team BIM (triển khai).
 * Lưu ý: RESEARCH-ACCESS-CONTROL.md §2.3 (code mẫu) ghi present:'crea' nhưng chính §2.4
 * (bảng role) + BIGPICTURE §2 đều chốt 3 vai ↔ 3 trạm 1-1 → chọn present:'bim'.
 */
export const STAGE_OWNER: Record<ProjectStage, ProjectRole> = {
  concept: 'crea',
  render: 'drafter',
  present: 'bim',
};

/**
 * GATE — vai `role` có được SỬA ở chặng `stage` không (BIGPICTURE §2: mỗi team sở hữu
 * đúng 1 chặng tại 1 thời điểm). owner toàn quyền; viewer read-only mọi chặng; 3 vai
 * giữa chỉ sửa được đúng trạm của mình. Stage lạ → false (an toàn mặc định).
 */
export function canEditStage(role: ProjectRole, stage: string): boolean {
  if (role === 'owner') return true;
  if (role === 'viewer') return false;
  return STAGE_OWNER[stage as ProjectStage] === role;
}

