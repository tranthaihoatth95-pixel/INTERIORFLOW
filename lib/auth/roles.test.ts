/**
 * lib/auth/roles.test.ts — bảng chân trị vai canonical + năng lực. THREAT/CONTRACT tests:
 *  - viewer KHÔNG BAO GIỜ giao được việc / mời / duyệt
 *  - vai canonical chiếu đúng theo chặng (relay), admin không cần member
 *  - lời mời không cấp được owner
 * Chạy: node_modules/.bin/sucrase-node lib/auth/roles.test.ts
 */
import assert from 'node:assert';
import {
  COLLAB_ROLES, CAPABILITIES, ROLE_CAPABILITIES, can, capabilitiesOf, effectiveRole, isAssignable,
  isInvitableStoredRole, denialStatus, ROLE_LABELS, DENIAL_LABELS, ROLE_GLYPH,
} from './roles';

let pass = 0;
const ok = (l: string) => { pass += 1; console.log(`  ✓ ${l}`); };

// [1] chiếu vai theo chặng
assert.strictEqual(effectiveRole({ storedRole: 'owner', isAdmin: false, currentStage: 'concept' }), 'owner');
assert.strictEqual(effectiveRole({ storedRole: 'viewer', isAdmin: false, currentStage: 'render' }), 'viewer');
assert.strictEqual(effectiveRole({ storedRole: 'crea', isAdmin: false, currentStage: 'concept' }), 'editor');
assert.strictEqual(effectiveRole({ storedRole: 'crea', isAdmin: false, currentStage: 'render' }), 'reviewer');
assert.strictEqual(effectiveRole({ storedRole: 'drafter', isAdmin: false, currentStage: 'render' }), 'editor');
assert.strictEqual(effectiveRole({ storedRole: 'drafter', isAdmin: false, currentStage: 'present' }), 'reviewer');
assert.strictEqual(effectiveRole({ storedRole: 'bim', isAdmin: false, currentStage: 'present' }), 'editor');
assert.strictEqual(effectiveRole({ storedRole: 'bim', isAdmin: false, currentStage: 'concept' }), 'reviewer');
ok('crea/drafter/bim → editor đúng trạm, reviewer ngoài trạm; owner/viewer giữ nguyên');

assert.strictEqual(effectiveRole({ storedRole: null, isAdmin: false, currentStage: 'concept' }), null);
assert.strictEqual(effectiveRole({ storedRole: 'hacker', isAdmin: false, currentStage: 'concept' }), null);
assert.strictEqual(effectiveRole({ storedRole: 'admin', isAdmin: false, currentStage: 'concept' }), null);
ok('không member / vai lạ / chuỗi "admin" trong DB → null (không bịa quyền)');

assert.strictEqual(effectiveRole({ storedRole: null, isAdmin: true, currentStage: 'concept' }), 'admin');
assert.strictEqual(effectiveRole({ storedRole: 'viewer', isAdmin: true, currentStage: 'concept' }), 'admin');
assert.strictEqual(effectiveRole({ storedRole: 'owner', isAdmin: true, currentStage: 'concept' }), 'owner');
ok('User.isAdmin → admin (kể cả không member); admin đồng thời là owner → owner');

// [2] năng lực — bảng chân trị các cửa nhạy cảm
for (const r of COLLAB_ROLES) {
  assert.ok(can(r, 'project:read') && can(r, 'comment:read') && can(r, 'task:read'), r);
}
ok('mọi vai đều đọc được dự án / góp ý / việc');
assert.ok(!can('viewer', 'comment:write') && !can('viewer', 'task:write') && !can('viewer', 'task:assignable'));
assert.ok(!can('viewer', 'approval:decide') && !can('viewer', 'invite:create') && !can('viewer', 'content:edit'));
ok('viewer: KHÔNG viết góp ý · KHÔNG tạo việc · KHÔNG giao được · KHÔNG duyệt · KHÔNG mời');
assert.ok(can('reviewer', 'approval:decide') && can('reviewer', 'comment:write') && can('reviewer', 'task:assignable'));
assert.ok(!can('reviewer', 'content:edit') && !can('reviewer', 'invite:create') && !can('reviewer', 'approval:request'));
ok('reviewer: duyệt + góp ý + giao được, nhưng KHÔNG sửa nội dung, KHÔNG mời, KHÔNG tự xin duyệt');
assert.ok(can('editor', 'content:edit') && can('editor', 'approval:request') && can('editor', 'task:assignable'));
assert.ok(!can('editor', 'approval:decide') && !can('editor', 'invite:create') && !can('editor', 'members:manage'));
ok('editor: sửa + xin duyệt + giao được, nhưng KHÔNG tự duyệt, KHÔNG mời, KHÔNG quản thành viên');
for (const r of ['owner', 'admin'] as const) {
  assert.strictEqual(capabilitiesOf(r).length, CAPABILITIES.length, r);
}
ok('owner/admin: đủ mọi năng lực');
assert.deepStrictEqual([...ROLE_CAPABILITIES.viewer].sort(), ['comment:read', 'members:read', 'project:read', 'task:read']);
ok('bộ năng lực viewer đóng: đúng 4 quyền đọc, không lọt gì thêm');

// [3] giao việc theo năng lực, không theo nhãn
assert.ok(isAssignable('editor') && isAssignable('reviewer') && isAssignable('owner') && isAssignable('admin'));
assert.ok(!isAssignable('viewer') && !isAssignable(null));
ok('isAssignable: viewer/null → false; còn lại true');

// [4] lời mời không cấp owner
assert.ok(!isInvitableStoredRole('owner') && !isInvitableStoredRole('admin') && !isInvitableStoredRole('editor'));
assert.ok(isInvitableStoredRole('viewer') && isInvitableStoredRole('crea'));
ok('link mời chỉ cấp vai LƯU viewer/bim/drafter/crea — không owner, không tên canonical');

// [5] denial → status + nhãn song ngữ đủ
assert.strictEqual(denialStatus('anonymous'), 401);
assert.strictEqual(denialStatus('not-member'), 404);
assert.strictEqual(denialStatus('insufficient'), 403);
assert.strictEqual(denialStatus('revoked'), 403);
assert.strictEqual(denialStatus('server-unavailable'), 503);
for (const r of COLLAB_ROLES) assert.ok(ROLE_LABELS[r].vi && ROLE_LABELS[r].en && ROLE_GLYPH[r]);
for (const k of Object.keys(DENIAL_LABELS)) assert.ok(DENIAL_LABELS[k as keyof typeof DENIAL_LABELS].vi.length > 0);
ok('mọi vai có nhãn VI+EN + ký hiệu; mọi lý do từ chối có nhãn + status đúng');

console.log(`\n${pass} nhóm khẳng định pass`);
