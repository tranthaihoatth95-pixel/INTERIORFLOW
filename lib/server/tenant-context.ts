import { prisma } from '@/lib/server/db';
import { AccessError } from './access';
import { isOrgRole, tenantContextV1Enabled, type OrgRole } from './tenant-context-policy';
import type { ProjectRole } from './access-policy';

export interface TenantContext {
  userId: string;
  organizationId: string | null;
  orgRole: OrgRole | null;
  projectId: string | null;
  projectRole: ProjectRole | null;
  mode: 'legacy' | 'tenant-v1';
}

export interface ContextEnvelope<T> { context: TenantContext; data: T }

export async function assertOrganizationAccess(
  userId: string,
  organizationId: string,
  required: OrgRole = 'member',
): Promise<OrgRole> {
  const membership = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId }, deletedAt: null },
    select: { orgRole: true },
  });
  if (!membership || !isOrgRole(membership.orgRole)) throw new AccessError(404, 'Không tìm thấy tổ chức.');
  if (required === 'admin' && membership.orgRole !== 'admin') throw new AccessError(403, 'Không đủ quyền quản trị tổ chức.');
  return membership.orgRole;
}

export async function deriveTenantContext(userId: string, projectId: string): Promise<TenantContext> {
  const project = await prisma.project.findUnique({
    where: { id: projectId, deletedAt: null },
    select: { organizationId: true, members: { where: { userId, deletedAt: null }, select: { role: true }, take: 1 } },
  });
  if (!project) throw new AccessError(404, 'Không tìm thấy dự án.');
  const projectRole = project.members[0]?.role as ProjectRole | undefined;
  if (!projectRole) throw new AccessError(404, 'Không tìm thấy dự án.');
  if (!tenantContextV1Enabled()) return { userId, organizationId: null, orgRole: null, projectId, projectRole, mode: 'legacy' };
  const orgRole = project.organizationId
    ? await assertOrganizationAccess(userId, project.organizationId, 'member')
    : null;
  return { userId, organizationId: project.organizationId, orgRole, projectId, projectRole, mode: 'tenant-v1' };
}
