export type OrgRole = 'admin' | 'member';

export function tenantContextV1Enabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.IF_TENANT_CONTEXT_V1 === '1';
}

export function isOrgRole(value: unknown): value is OrgRole {
  return value === 'admin' || value === 'member';
}

export function canManageOrganization(role: OrgRole): boolean {
  return role === 'admin';
}

export function sameTenant(
  context: { organizationId: string | null },
  resource: { organizationId: string | null },
): boolean {
  return !!context.organizationId && context.organizationId === resource.organizationId;
}

export function tenantRequestMatchesContext(
  context: { organizationId: string | null },
  requestedTenantId: unknown,
): boolean {
  return typeof requestedTenantId !== 'string' || requestedTenantId === context.organizationId;
}

/** organizationId selects organization authority; otherwise userId is the legacy authority. */
export function libraryAuthorityScope(asset: { userId?: string | null; organizationId?: string | null }) {
  if (asset.organizationId) return { kind: 'organization' as const, id: asset.organizationId };
  if (asset.userId) return { kind: 'user' as const, id: asset.userId };
  throw new Error('LibraryAsset phải có đúng một authority scope.');
}
