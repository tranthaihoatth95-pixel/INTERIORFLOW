/**
 * lib/scope-core.test.ts — chạy: node_modules/.bin/sucrase-node lib/scope-core.test.ts
 */
import assert from 'node:assert';
import { parseScope, pickStableRouteId } from './scope-core';

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ok  ${name}`);
}

// ── parseScope ───────────────────────────────────────────────────────────────
test('global khi pathname rỗng/null', () => {
  assert.deepStrictEqual(parseScope(null), { scope: 'global', projectId: null });
  assert.deepStrictEqual(parseScope(''), { scope: 'global', projectId: null });
  assert.deepStrictEqual(parseScope('/'), { scope: 'global', projectId: null });
});

test('global cho route không phải /projects', () => {
  assert.strictEqual(parseScope('/cad-editor').scope, 'global');
  assert.strictEqual(parseScope('/settings/avatar').scope, 'global');
  assert.strictEqual(parseScope('/present').scope, 'global');
});

test('project + id cho /projects/[id] và các sub-route', () => {
  assert.deepStrictEqual(parseScope('/projects/abc123'), { scope: 'project', projectId: 'abc123' });
  assert.deepStrictEqual(parseScope('/projects/abc123/overview'), { scope: 'project', projectId: 'abc123' });
  assert.deepStrictEqual(parseScope('/projects/abc123/notebook'), { scope: 'project', projectId: 'abc123' });
});

test('bỏ query/hash, giải mã id', () => {
  assert.strictEqual(parseScope('/projects/xyz?tab=1').projectId, 'xyz');
  assert.strictEqual(parseScope('/projects/xyz#top').projectId, 'xyz');
  assert.strictEqual(parseScope('/projects/a%20b').projectId, 'a b');
});

test('/projects không có id → global (không vỡ)', () => {
  assert.strictEqual(parseScope('/projects').scope, 'global');
  assert.strictEqual(parseScope('/projects/').scope, 'global');
});

// ── pickStableRouteId ────────────────────────────────────────────────────────
test('ưu tiên Project.id, rồi Flow.id, rồi fallback', () => {
  assert.strictEqual(pickStableRouteId('proj1', 'flow1'), 'proj1');
  assert.strictEqual(pickStableRouteId(null, 'flow1'), 'flow1');
  assert.strictEqual(pickStableRouteId(null, null), 'default');
  assert.strictEqual(pickStableRouteId(undefined, undefined, 'fb'), 'fb');
  assert.strictEqual(pickStableRouteId('', ''), 'default'); // chuỗi rỗng không phải id
});

console.log(`\n${passed} passed`);
