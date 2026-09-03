/**
 * lib/auth/authorize-db.ts — phần ĐỤNG DB của cấp quyền: gom facts từ Prisma rồi giao cho
 * `decideGrant` (thuần). Đây là CỬA DUY NHẤT các route của slice cộng tác dùng để hỏi quyền (qua `authorize-request.ts`
 * khi cần đọc phiên). File này KHÔNG import next/headers để test được bằng sucrase-node + DB.
 *
 * Giữ cùng ngữ nghĩa với `lib/server/access.ts#assertProjectAccess` (deletedAt: null bắt buộc,
 * dự án xoá mềm = 404, admin toàn cục = quyền cao) — không mở đường thứ hai với luật khác.
 */

import { prisma } from '../server/db';
import { decideGrant, summarizeMembers, type Grant, type MemberSummary } from './authorize';

export async function loadGrantFacts(userId: string, projectId: string) {
  const [m, u, p] = await Promise.all([
    prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId }, deletedAt: null },
      select: { role: true },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } }),
    prisma.project.findUnique({ where: { id: projectId }, select: { currentStage: true, deletedAt: true } }),
  ]);
  return {
    userId,
    projectId,
    project: p ? { currentStage: p.currentStage, deletedAt: p.deletedAt } : null,
    memberRole: m?.role ?? null,
    isAdmin: !!u?.isAdmin,
  };
}

/** Grant của user trên project — ném DenialError (404 not-member / …). */
export async function authorizeProject(userId: string, projectId: string): Promise<Grant> {
  return decideGrant(await loadGrantFacts(userId, projectId));
}

/** Thành viên còn hiệu lực của dự án, kèm vai canonical theo chặng hiện tại. */
export async function listMemberSummaries(projectId: string, currentStage: string): Promise<MemberSummary[]> {
  const rows = await prisma.projectMember.findMany({
    where: { projectId, deletedAt: null },
    orderBy: { joinedAt: 'asc' },
    select: { userId: true, role: true, user: { select: { name: true } } },
  });
  return summarizeMembers(
    rows.map((r) => ({ userId: r.userId, name: r.user.name, role: r.role })),
    currentStage,
  );
}
