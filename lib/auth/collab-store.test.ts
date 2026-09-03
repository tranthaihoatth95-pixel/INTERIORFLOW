/**
 * lib/auth/collab-store.test.ts — kho JSON theo dự án: đọc rỗng, ghi nguyên tử, applyOp idempotent,
 * tuần tự hoá, chặn projectId lạ. Dùng thư mục tạm qua IF_COLLAB_DIR — không đụng uploads thật.
 * Chạy: node_modules/.bin/sucrase-node lib/auth/collab-store.test.ts
 */
import assert from 'node:assert';
import { mkdtempSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const dir = mkdtempSync(path.join(tmpdir(), 'if-collab-'));
process.env.IF_COLLAB_DIR = dir;

import { readCollab, mutateCollab, applyOp, isValidOpId, newId, isInviteRevoked, safeProjectId } from './collab-store';

let pass = 0;
const ok = (l: string) => { pass += 1; console.log(`  ✓ ${l}`); };

async function main() {
  try {
    const f0 = await readCollab('projA');
    assert.deepStrictEqual(f0.comments, []); assert.strictEqual(f0.rev, 0);
    ok('chưa có tệp → kho rỗng, không ném');

    const r1 = await applyOp('projA', 'op:00000001', (f) => { f.comments.push({ id: newId('c'), projectId: 'projA', authorId: 'u', authorName: 'U', text: 'a', anchor: {}, resolved: false, createdAt: 'x', updatedAt: 'x', opId: 'op:00000001' }); return f.comments.length; });
    assert.deepStrictEqual(r1, { duplicate: false, result: 1 });
    const r2 = await applyOp('projA', 'op:00000001', (f) => { f.comments.push({ ...f.comments[0], id: 'dup' }); return f.comments.length; });
    assert.deepStrictEqual(r2, { duplicate: true, result: 1 });
    assert.strictEqual((await readCollab('projA')).comments.length, 1);
    ok('applyOp cùng opId lần 2 → duplicate=true, kết quả cũ, KHÔNG chạy fn (không nhân bản)');

    // tuần tự hoá: 20 mutation song song cùng dự án
    await Promise.all(Array.from({ length: 20 }, (_, i) => mutateCollab('projB', (f) => { f.approvals.push({ id: `a${i}`, projectId: 'projB', title: 't', requesterId: 'u', requesterName: 'U', status: 'pending', createdAt: 'x', updatedAt: 'x', opId: `op:b:${i}` }); })));
    const fb = await readCollab('projB');
    assert.strictEqual(fb.approvals.length, 20); assert.strictEqual(fb.rev, 20);
    assert.ok(!readdirSync(dir).some((n) => n.endsWith('.tmp')));
    ok('20 mutation song song → đủ 20 mục, rev=20, không tệp .tmp sót (ghi nguyên tử)');

    assert.ok(isValidOpId('op:abc:12345678') && !isValidOpId('short') && !isValidOpId('bad/../x'.padEnd(10, 'x')) && !isValidOpId(42));
    await assert.rejects(applyOp('projA', 'bad', () => 1));
    ok('opId phải hợp lệ (8..128, không ký tự đường dẫn)');

    assert.throws(() => safeProjectId('../etc'));
    assert.throws(() => safeProjectId(''));
    await assert.rejects(readCollab('../../x'));
    ok('THREAT: projectId chứa ../ → ném, không thoát thư mục');

    await mutateCollab('projA', (f) => { f.invites.push({ jti: 'j1', role: 'viewer', inviterId: 'u', inviterName: 'U', createdAt: 'x', expiresAt: 'y' }); f.invites.push({ jti: 'j2', role: 'viewer', inviterId: 'u', inviterName: 'U', createdAt: 'x', expiresAt: 'y', revokedAt: 'z' }); });
    const fa = await readCollab('projA');
    assert.ok(!isInviteRevoked(fa, 'j1') && isInviteRevoked(fa, 'j2') && !isInviteRevoked(fa, 'unknown'));
    ok('isInviteRevoked: đúng jti có revokedAt');

    console.log(`\n${pass} nhóm khẳng định pass`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
