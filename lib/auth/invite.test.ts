/**
 * lib/auth/invite.test.ts — token mời: ký/verify/hết hạn/giả mạo/sai loại/rút token từ link.
 * Chạy: node_modules/.bin/sucrase-node lib/auth/invite.test.ts
 */
import assert from 'node:assert';
import { SignJWT } from 'jose';
import { createInviteToken, verifyInviteToken, extractInviteToken, clampInviteHours, INVITE_MAX_HOURS, INVITE_DEFAULT_HOURS, inviteSecret } from './invite';

let pass = 0;
const ok = (l: string) => { pass += 1; console.log(`  ✓ ${l}`); };
const key = new TextEncoder().encode('test-secret-A');
const otherKey = new TextEncoder().encode('test-secret-B');

async function main() {
  const t0 = Date.parse('2026-09-01T00:00:00Z');
  const { token, payload } = await createInviteToken({ projectId: 'proj1', role: 'drafter', inviterId: 'u_inv', hours: 48 }, key, t0);
  assert.strictEqual(payload.exp - payload.iat, 48 * 3600);
  const v = await verifyInviteToken(token, key, t0 + 1000);
  assert.ok(v.ok);
  if (v.ok) {
    assert.strictEqual(v.payload.projectId, 'proj1'); assert.strictEqual(v.payload.role, 'drafter');
    assert.strictEqual(v.payload.inviterId, 'u_inv'); assert.strictEqual(v.payload.jti, payload.jti);
  }
  ok('ký rồi verify: đúng project/role/inviter/jti, hạn 48h');

  const exp = await verifyInviteToken(token, key, t0 + 49 * 3600 * 1000);
  assert.deepStrictEqual(exp, { ok: false, reason: 'expired' });
  ok('quá hạn → expired (không phải invalid — UI nói đúng câu)');

  const forged = await verifyInviteToken(token, otherKey, t0);
  assert.deepStrictEqual(forged, { ok: false, reason: 'invalid' });
  const tampered = token.slice(0, -3) + 'abc';
  assert.strictEqual((await verifyInviteToken(tampered, key, t0)).ok, false);
  ok('sai secret / sửa chữ ký → invalid');

  const session = await new SignJWT({ sub: 'u_x' }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('30d').sign(key);
  assert.deepStrictEqual(await verifyInviteToken(session, key), { ok: false, reason: 'wrong-type' });
  ok('THREAT: cookie phiên (cùng secret) KHÔNG dùng được làm lời mời — sai typ');

  const badRole = await new SignJWT({ typ: 'if-invite', v: 1, pid: 'p', role: 'owner', inv: 'u' }).setProtectedHeader({ alg: 'HS256' }).setJti('j').setIssuedAt().setExpirationTime('1h').sign(key);
  assert.deepStrictEqual(await verifyInviteToken(badRole, key), { ok: false, reason: 'bad-role' });
  ok('THREAT: token tự chế role=owner → bad-role (kể cả ký đúng secret)');

  assert.strictEqual(clampInviteHours(undefined), INVITE_DEFAULT_HOURS);
  assert.strictEqual(clampInviteHours(0), 1);
  assert.strictEqual(clampInviteHours(99999), INVITE_MAX_HOURS);
  assert.strictEqual(clampInviteHours('x' as unknown as number), INVITE_DEFAULT_HOURS);
  ok('clampInviteHours: mặc định 7 ngày, trần 30 ngày, sàn 1 giờ');

  assert.strictEqual(extractInviteToken(`https://x.local/api/share/invite/accept?token=${token}&a=1`), token);
  assert.strictEqual(extractInviteToken(`  ${token}\n`), token);
  assert.strictEqual(extractInviteToken('not a token'), null);
  assert.strictEqual(extractInviteToken(''), null);
  ok('extractInviteToken: từ link đầy đủ hoặc token trần; rác → null');

  const s = inviteSecret();
  assert.ok(s.key.length > 0 && typeof s.insecure === 'boolean');
  ok('inviteSecret khai `insecure` khi thiếu AUTH_SECRET');

  console.log(`\n${pass} nhóm khẳng định pass`);
}
main().catch((e) => { console.error(e); process.exit(1); });
