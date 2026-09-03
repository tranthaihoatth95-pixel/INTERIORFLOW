/**
 * lib/auth/permission-cache.test.ts — hợp đồng ngoại tuyến/thu hồi (4 điều đầu file .ts).
 * Chạy: node_modules/.bin/sucrase-node lib/auth/permission-cache.test.ts
 */
import assert from 'node:assert';
import { reconcilePermission, canLocally, parseCachedGrant, OFFLINE_GRACE_MS, MAX_AGE_MS, type CachedGrant } from './permission-cache';

let pass = 0;
const ok = (l: string) => { pass += 1; console.log(`  ✓ ${l}`); };
const now = 1_000_000_000_000;
const grant = { userId: 'u', projectId: 'p', role: 'editor' as const, storedRole: 'crea', currentStage: 'concept', capabilities: ['content:edit' as const, 'comment:write' as const] };

// 1. server trả grant → nguồn server, cache mới
let r = reconcilePermission(null, { kind: 'grant', grant }, now);
assert.strictEqual(r.resolution.kind, 'grant');
assert.ok(r.resolution.kind === 'grant' && r.resolution.source === 'server' && !r.resolution.stale);
assert.strictEqual(r.nextCache?.fetchedAt, now);
const cached = r.nextCache as CachedGrant;
ok('server grant → resolution server, cache có fetchedAt');

// 2. ngoại tuyến trong grace → dùng cache, stale
r = reconcilePermission(cached, { kind: 'unreachable' }, now + OFFLINE_GRACE_MS - 1);
assert.ok(r.resolution.kind === 'grant' && r.resolution.source === 'cache' && r.resolution.stale);
assert.ok(canLocally(r.resolution, 'content:edit'));
assert.ok(!canLocally(r.resolution, 'invite:create'));
ok('ngoại tuyến trong 24h → dùng cache (stale=true), năng lực theo cache');

// 3. server từ chối → xoá cache, denied
r = reconcilePermission(cached, { kind: 'denied', denial: { denied: true, reason: 'revoked' } }, now + 5);
assert.ok(r.resolution.kind === 'denied' && r.resolution.denial.reason === 'revoked');
assert.strictEqual(r.nextCache, null);
assert.ok(!canLocally(r.resolution, 'content:edit'));
ok('THU HỒI: server denied → cache XOÁ ngay, không còn quyền cục bộ');

// 4. ngoại tuyến không cache → unknown; quá grace → cache-expired; quá MAX_AGE → xoá cache
r = reconcilePermission(null, { kind: 'unreachable' }, now);
assert.deepStrictEqual(r.resolution, { kind: 'unknown', reason: 'offline-no-cache' });
r = reconcilePermission(cached, { kind: 'unreachable' }, now + OFFLINE_GRACE_MS + 1);
assert.deepStrictEqual(r.resolution, { kind: 'unknown', reason: 'cache-expired' });
assert.strictEqual(r.nextCache, cached);
r = reconcilePermission(cached, { kind: 'unreachable' }, now + MAX_AGE_MS + 1);
assert.strictEqual(r.nextCache, null);
ok('không cache → unknown; quá 24h → cache-expired (giữ tệp); quá 7 ngày → xoá hẳn');

assert.strictEqual(parseCachedGrant(JSON.stringify(cached), 'u', 'p')?.role, 'editor');
assert.strictEqual(parseCachedGrant(JSON.stringify(cached), 'u2', 'p'), null);
assert.strictEqual(parseCachedGrant(JSON.stringify(cached), 'u', 'p2'), null);
assert.strictEqual(parseCachedGrant('{bad', 'u', 'p'), null);
ok('parseCachedGrant khoá theo (userId, projectId) — cache người khác/dự án khác không dùng');

console.log(`\n${pass} nhóm khẳng định pass`);
