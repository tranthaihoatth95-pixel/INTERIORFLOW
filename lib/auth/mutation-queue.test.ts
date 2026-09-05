/**
 * lib/auth/mutation-queue.test.ts — hàng đợi local-first: idempotent theo opId, danh tính,
 * denied KHÔNG bị vứt, reload giữ nguyên.
 * Chạy: node_modules/.bin/sucrase-node lib/auth/mutation-queue.test.ts
 */
import assert from 'node:assert';
import {
  emptyQueue, enqueue, nextToSend, markSending, markApplied, markDenied, markFailed, classifyResponse,
  pruneApplied, queueSummary, serializeQueue, parseQueue, newOpId,
} from './mutation-queue';

let pass = 0;
const ok = (l: string) => { pass += 1; console.log(`  ✓ ${l}`); };

const a = newOpId(); const b = newOpId();
assert.notStrictEqual(a, b);
let q = enqueue(emptyQueue(), { opId: a, actorUserId: 'u1', projectId: 'p', kind: 'comment', payload: { text: 'x' }, createdAt: 1 });
q = enqueue(q, { opId: a, actorUserId: 'u1', projectId: 'p', kind: 'comment', payload: { text: 'x' }, createdAt: 2 });
assert.strictEqual(q.items.length, 1);
ok('enqueue cùng opId hai lần → một mục (idempotent từ client)');

q = enqueue(q, { opId: b, actorUserId: 'u2', projectId: 'p', kind: 'comment', payload: {}, createdAt: 0 });
assert.strictEqual(nextToSend(q, 'u1')?.opId, a);
assert.strictEqual(nextToSend(q, 'u2')?.opId, b);
assert.strictEqual(nextToSend(q, 'u3'), null);
ok('nextToSend chỉ trả mục của ĐÚNG người đang đăng nhập (danh tính gắn vào op)');

q = markSending(q, a);
assert.strictEqual(q.items[0].state, 'sending'); assert.strictEqual(q.items[0].attempts, 1);
assert.strictEqual(nextToSend(q, 'u1'), null);
q = markDenied(q, a, 'insufficient');
assert.strictEqual(q.items[0].state, 'denied'); assert.strictEqual(q.items[0].lastError, 'insufficient');
assert.strictEqual(nextToSend(q, 'u1'), null);
assert.strictEqual(pruneApplied(q).items.length, 2);
ok('denied: không gửi lại, KHÔNG bị prune — người dùng còn thấy thao tác bị từ chối');

q = markSending(q, b); q = markFailed(q, b, 'network');
assert.strictEqual(nextToSend(q, 'u2')?.opId, b);
q = markSending(q, b); q = markApplied(q, b);
assert.strictEqual(q.items[1].attempts, 2);
assert.strictEqual(pruneApplied(q).items.length, 1);
ok('failed (mạng) → gửi lại được, đếm attempts; applied → prune được');

assert.strictEqual(classifyResponse(200), 'applied');
assert.strictEqual(classifyResponse(403), 'denied'); assert.strictEqual(classifyResponse(404), 'denied'); assert.strictEqual(classifyResponse(401), 'denied');
assert.strictEqual(classifyResponse(400), 'denied'); assert.strictEqual(classifyResponse(409), 'denied');
assert.strictEqual(classifyResponse(500), 'failed'); assert.strictEqual(classifyResponse(503), 'failed'); assert.strictEqual(classifyResponse(0), 'failed');
ok('classifyResponse: 2xx applied · 401/403/404/400/409 denied (gửi lại y hệt vẫn sai) · 5xx/0 failed');

assert.deepStrictEqual(queueSummary(q, 'u1'), { pending: 0, denied: 1 });

let q2 = enqueue(emptyQueue(), { opId: 'op:reload:0001', actorUserId: 'u1', projectId: 'p', kind: 'k', payload: {} });
q2 = markSending(q2, 'op:reload:0001');
const back = parseQueue(serializeQueue(q2));
assert.strictEqual(back.items[0].state, 'pending');
assert.strictEqual(back.items[0].opId, 'op:reload:0001');
assert.deepStrictEqual(parseQueue('garbage'), emptyQueue());
assert.deepStrictEqual(parseQueue(null), emptyQueue());
ok('reload giữa chừng: sending → pending, cùng opId (server không nhân bản); rác → rỗng');

console.log(`\n${pass} nhóm khẳng định pass`);
