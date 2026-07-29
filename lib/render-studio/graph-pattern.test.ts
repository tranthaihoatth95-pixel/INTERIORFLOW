/**
 * lib/render-studio/graph-pattern.test.ts — chạy: node_modules/.bin/sucrase-node
 * lib/render-studio/graph-pattern.test.ts
 *
 * Test cho LỖ RÒ 2 (2.2.77, 29/07 — docs/CHOT-SO-MA-2026-07-29.md §D): rời canvas về Tool Mode
 * không được lờ đi graph đang có — khớp mẫu đơn giản thì mở lại đúng thẻ, phức tạp hơn thì báo
 * rõ, không im lặng hiện lưới trống.
 */
import assert from 'node:assert';
import { detectGraphPattern } from './graph-pattern';
// type-only — bị xoá hoàn toàn lúc biên dịch (sucrase), không kéo theo require('@xyflow/react')
// hay chuỗi import '@/...' của lib/store.ts thật (xem chú thích trong graph-pattern.ts).
import type { Edge } from '@xyflow/react';
import type { FlowNode } from '../store';

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ok  ${name}`);
}

// Chỉ cần đúng field `id`/`data.defType` mà detectGraphPattern đọc — không cần FlowNode đầy đủ.
function node(id: string, defType: string): FlowNode {
  return { id, data: { defType } } as unknown as FlowNode;
}
function edge(source: string, target: string): Edge {
  return { id: `${source}-${target}`, source, target } as unknown as Edge;
}

test('graph rỗng → empty', () => {
  assert.deepStrictEqual(detectGraphPattern([], []), { kind: 'empty' });
});

test('graph rỗng nhưng còn sticky note → vẫn tính là empty (note không phải bước xử lý)', () => {
  const nodes = [node('n1', 'note')];
  assert.deepStrictEqual(detectGraphPattern(nodes, []), { kind: 'empty' });
});

test('đúng mẫu 1 ảnh → 1 node AI có thẻ Tool Mode → single, đúng cardId', () => {
  const nodes = [node('n1', 'input.image'), node('n2', 'ai.sketch2render')];
  const edges = [edge('n1', 'n2')];
  assert.deepStrictEqual(detectGraphPattern(nodes, edges), { kind: 'single', cardId: 'sketch2render' });
});

test('thứ tự node đảo ngược (AI trước, ảnh sau) vẫn nhận đúng mẫu', () => {
  const nodes = [node('n1', 'ai.upscale'), node('n2', 'input.image')];
  const edges = [edge('n2', 'n1')];
  assert.deepStrictEqual(detectGraphPattern(nodes, edges), { kind: 'single', cardId: 'upscale' });
});

test('2 node nhưng node AI KHÔNG có thẻ Tool Mode tương ứng → complex, không giả vờ hiểu', () => {
  const nodes = [node('n1', 'input.image'), node('n2', 'ai.furnitureextract')];
  const edges = [edge('n1', 'n2')];
  assert.deepStrictEqual(detectGraphPattern(nodes, edges), { kind: 'complex', nodeCount: 2 });
});

test('2 node đúng loại nhưng KHÔNG nối nhau → complex (không phải mẫu Tool Mode)', () => {
  const nodes = [node('n1', 'input.image'), node('n2', 'ai.sketch2render')];
  assert.deepStrictEqual(detectGraphPattern(nodes, []), { kind: 'complex', nodeCount: 2 });
});

test('3 node trở lên → complex, báo đúng số node THẬT SỰ (loại note khỏi đếm)', () => {
  const nodes = [node('n1', 'input.image'), node('n2', 'ai.sketch2render'), node('n3', 'ai.upscale'), node('n4', 'note')];
  const edges = [edge('n1', 'n2'), edge('n2', 'n3')];
  assert.deepStrictEqual(detectGraphPattern(nodes, edges), { kind: 'complex', nodeCount: 3 });
});

console.log(`\n${passed} pass / 0 fail`);
