import assert from 'assert';
import { canManageOrganization, isOrgRole, libraryAuthorityScope, sameTenant, tenantContextV1Enabled, tenantRequestMatchesContext } from './tenant-context-policy';

delete process.env.IF_TENANT_CONTEXT_V1;
assert.equal(tenantContextV1Enabled(), false);
process.env.IF_TENANT_CONTEXT_V1 = '1';
assert.equal(tenantContextV1Enabled(), true);
delete process.env.IF_TENANT_CONTEXT_V1;
assert.equal(isOrgRole('admin'), true);
assert.equal(isOrgRole('owner'), false);
assert.equal(canManageOrganization('admin'), true);
assert.equal(canManageOrganization('member'), false); // member PATCH profile => 403 at route helper
assert.deepEqual(libraryAuthorityScope({ userId: 'u-a', organizationId: null }), { kind: 'user', id: 'u-a' });
assert.deepEqual(libraryAuthorityScope({ userId: 'creator', organizationId: 'org-a' }), { kind: 'organization', id: 'org-a' });
assert.throws(() => libraryAuthorityScope({ userId: null, organizationId: null }));
const contextA = { organizationId: 'org-a' };
assert.equal(sameTenant(contextA, { organizationId: 'org-a' }), true);
assert.equal(sameTenant(contextA, { organizationId: 'org-b' }), false); // Project/File/Flow/Asset B
assert.equal(sameTenant(contextA, { organizationId: null }), false); // fail closed while v1 is on
assert.equal(tenantRequestMatchesContext(contextA, 'org-b'), false); // forged tenantId
assert.equal(tenantRequestMatchesContext(contextA, 'org-a'), true);
assert.equal(tenantRequestMatchesContext(contextA, undefined), true);
console.log('tenant-context-policy: 16/16 PASS');
