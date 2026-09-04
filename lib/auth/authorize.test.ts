/**
 * lib/auth/authorize.test.ts — decideGrant/requireCapability/checkAssignees (thuần, không DB).
 * THREAT: dự án xoá mềm / không member → 404 (không lộ tồn tại); giao việc cho người ngoài
 * hoặc viewer → bị nêu tên, không lặng lẽ lọc.
 * Chạy: node_modules/.bin/sucrase-node lib/auth/authorize.test.ts
 */
import assert from 'node:assert';
import { decideGrant, DenialError, requireCapability, checkAssignees, summarizeMembers, denialPayload, hasCapability } from './authorize';

let pass = 0;
const ok = (l: string) => { pass += 1; console.log(`  ✓ ${l}`); };
const alive = { currentStage: 'concept', deletedAt: null };

function denialOf(fn: () => unknown) {
  try { fn(); } catch (e) { if (e instanceof DenialError) return e; throw e; }
  throw new Error('không ném DenialError');
}

let d = denialOf(() => decideGrant({ userId: 'u', projectId: 'p', project: null, memberRole: 'owner', isAdmin: true }));
assert.strictEqual(d.denial.reason, 'not-member'); assert.strictEqual(d.status, 404);
d = denialOf(() => decideGrant({ userId: 'u', projectId: 'p', project: { currentStage: 'concept', deletedAt: new Date() }, memberRole: 'owner', isAdmin: true }));
assert.strictEqual(d.denial.reason, 'not-member');
ok('dự án không có / xoá mềm → 404 not-member, kể cả admin/owner');

d = denialOf(() => decideGrant({ userId: 'u', projectId: 'p', project: alive, memberRole: null, isAdmin: false }));
assert.strictEqual(d.status, 404);
ok('không member → 404 (không phải 403 — không lộ dự án tồn tại)');

const g = decideGrant({ userId: 'u', projectId: 'p', project: alive, memberRole: 'drafter', isAdmin: false });
assert.strictEqual(g.role, 'reviewer'); assert.strictEqual(g.storedRole, 'drafter');
assert.ok(g.capabilities.includes('approval:decide') && !g.capabilities.includes('content:edit'));
ok('drafter ở chặng concept → grant reviewer (đủ duyệt, không sửa)');

d = denialOf(() => requireCapability(g, 'content:edit'));
assert.strictEqual(d.status, 403); assert.strictEqual(d.denial.reason, 'insufficient');
assert.strictEqual(d.denial.capability, 'content:edit'); assert.strictEqual(d.denial.role, 'reviewer');
assert.strictEqual(requireCapability(g, 'comment:write'), g);
ok('requireCapability: thiếu → 403 nêu rõ năng lực + vai; đủ → trả lại grant');

const ga = decideGrant({ userId: 'a', projectId: 'p', project: alive, memberRole: null, isAdmin: true });
assert.strictEqual(ga.role, 'admin'); assert.strictEqual(ga.storedRole, null);
assert.ok(hasCapability(ga, 'members:manage') && !hasCapability(null, 'members:manage'));
ok('admin toàn cục không member → grant admin, storedRole null (không bịa vai lưu)');

const members = summarizeMembers(
  [{ userId: 'o', name: 'Owner', role: 'owner' }, { userId: 'c', name: 'Crea', role: 'crea' }, { userId: 'v', name: 'View', role: 'viewer' }, { userId: 'x', name: 'Lạ', role: 'ghost' }],
  'concept',
);
assert.deepStrictEqual(members.map((m) => [m.userId, m.role, m.assignable]), [['o', 'owner', true], ['c', 'editor', true], ['v', 'viewer', false]]);
ok('summarizeMembers: vai lạ bị bỏ, viewer assignable=false');

const chk = checkAssignees(['o', 'c', 'v', 'stranger', 'c'], members);
assert.strictEqual(chk.ok, false);
assert.deepStrictEqual(chk.ineligible, [{ userId: 'v', reason: 'not-assignable' }, { userId: 'stranger', reason: 'not-member' }]);
assert.ok(checkAssignees(['o', 'c'], members).ok);
assert.ok(checkAssignees([], members).ok);
ok('checkAssignees: nêu tên viewer + người ngoài với lý do; hợp lệ → ok; trùng id không nhân đôi');

const p = denialPayload(d);
assert.ok(p && p.status === 403 && p.body.denied === true && p.body.reason === 'insufficient');
assert.strictEqual(denialPayload(new Error('x')), null);
const legacy = Object.assign(new Error('Không tìm thấy dự án.'), { name: 'AccessError', status: 404 });
const p2 = denialPayload(legacy);
assert.ok(p2 && p2.status === 404 && p2.body.reason === 'not-member');
ok('denialPayload: DenialError + AccessError cũ đều thành JSON {denied, reason}; lỗi thường → null');

console.log(`\n${pass} nhóm khẳng định pass`);
