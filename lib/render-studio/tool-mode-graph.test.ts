/**
 * lib/render-studio/tool-mode-graph.test.ts — chạy: node_modules/.bin/sucrase-node
 * lib/render-studio/tool-mode-graph.test.ts
 *
 * Test cho luật "chuyển giao diện không được xoá dữ liệu" (2.2.77, 29/07 —
 * docs/CHOT-SO-MA-2026-07-29.md §D, LỖ RÒ 1): đổi thẻ việc Tool Mode KHÔNG được làm mất node
 * ảnh nguồn (ảnh đã thả gắn ở đó) — chỉ node AI đích đổi theo thẻ.
 *
 * Dùng FAKE store (không import `lib/store.ts` thật — kéo theo chuỗi `@/...` mà sucrase-node
 * không resolve, xem chú thích trong `tool-mode-graph.ts`) — nhưng gọi ĐÚNG hàm sản phẩm dùng
 * (`ensureToolModeGraph`), không phải bản mô phỏng lại logic.
 */
import assert from 'node:assert';
import { ensureToolModeGraph, type ToolModeGraphStore } from './tool-mode-graph';

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ok  ${name}`);
}

/** Fake graph store tối thiểu — mảng node trong bộ nhớ, id tăng dần, ghi lại cạnh đã nối. */
function makeFakeStore() {
  let seq = 0;
  const nodes: { id: string; defType: string }[] = [];
  const edges: { source: string; target: string }[] = [];

  const store: ToolModeGraphStore = {
    addNode: (defType) => {
      nodes.push({ id: `n${++seq}`, defType });
    },
    deleteNode: (id) => {
      const i = nodes.findIndex((n) => n.id === id);
      if (i >= 0) nodes.splice(i, 1);
      for (let j = edges.length - 1; j >= 0; j--) {
        if (edges[j].source === id || edges[j].target === id) edges.splice(j, 1);
      }
    },
    onConnect: (p) => {
      edges.push({ source: p.source, target: p.target });
    },
    lastNodeId: () => nodes.at(-1)!.id,
  };

  return { store, nodes, edges };
}

// ── lần đầu: dựng cả 2 node ────────────────────────────────────────────────
test('current=null → dựng node ảnh nguồn + node AI, nối đúng cạnh', () => {
  const { store, nodes, edges } = makeFakeStore();
  const refs = ensureToolModeGraph(store, null, 'sketch2render', 'ai.sketch2render');

  assert.strictEqual(nodes.length, 2, 'phải có đúng 2 node');
  assert.strictEqual(nodes.find((n) => n.id === refs.imgId)?.defType, 'input.image');
  assert.strictEqual(nodes.find((n) => n.id === refs.aiId)?.defType, 'ai.sketch2render');
  assert.strictEqual(edges.length, 1, 'phải có đúng 1 cạnh nối ảnh → node AI');
  assert.strictEqual(edges[0].source, refs.imgId);
  assert.strictEqual(edges[0].target, refs.aiId);
  assert.strictEqual(refs.cardId, 'sketch2render');
});

// ── LỖ RÒ 1: đổi thẻ → GIỮ node ảnh, chỉ thay node AI ───────────────────────
test('đổi cardId → giữ NGUYÊN imgId (node ảnh không mất), chỉ đổi aiId', () => {
  const { store, nodes, edges } = makeFakeStore();
  const first = ensureToolModeGraph(store, null, 'sketch2render', 'ai.sketch2render');

  const second = ensureToolModeGraph(store, first, 'clay2render', 'ai.clay2render');

  assert.strictEqual(second.imgId, first.imgId, 'node ảnh nguồn phải GIỮ NGUYÊN id, không dựng lại');
  assert.notStrictEqual(second.aiId, first.aiId, 'node AI đích phải đổi (thẻ khác = node khác)');
  assert.strictEqual(second.cardId, 'clay2render');

  // Node AI CŨ phải biến mất khỏi graph (không rác), node ảnh vẫn còn nguyên trong danh sách.
  assert.strictEqual(nodes.find((n) => n.id === first.aiId), undefined, 'node AI cũ phải bị xoá');
  assert.ok(nodes.find((n) => n.id === second.imgId), 'node ảnh nguồn KHÔNG được biến mất khi đổi thẻ');
  assert.strictEqual(nodes.find((n) => n.id === second.aiId)?.defType, 'ai.clay2render');

  // Cạnh nối phải trỏ ĐÚNG imgId cũ → aiId mới (không đứt dây, không còn cạnh của aiId cũ).
  assert.strictEqual(edges.length, 1);
  assert.strictEqual(edges[0].source, second.imgId);
  assert.strictEqual(edges[0].target, second.aiId);
});

// ── đổi thẻ nhiều lần liên tiếp — không tích rác node AI cũ ─────────────────
test('đổi thẻ 3 lần liên tiếp → graph luôn đúng 2 node, không tích luỹ rác', () => {
  const { store, nodes } = makeFakeStore();
  let refs = ensureToolModeGraph(store, null, 'sketch2render', 'ai.sketch2render');
  const imgId = refs.imgId;
  refs = ensureToolModeGraph(store, refs, 'clay2render', 'ai.clay2render');
  refs = ensureToolModeGraph(store, refs, 'relight', 'ai.relight');
  refs = ensureToolModeGraph(store, refs, 'upscale', 'ai.upscale');

  assert.strictEqual(nodes.length, 2, 'không được tồn đọng node AI của các thẻ đã rời bỏ');
  assert.strictEqual(refs.imgId, imgId, 'node ảnh nguồn sống xuyên suốt mọi lần đổi thẻ');
  assert.strictEqual(nodes.find((n) => n.id === refs.aiId)?.defType, 'ai.upscale');
});

// ── quay lại ĐÚNG thẻ đang mở → không đổi gì (idempotent) ───────────────────
test('gọi lại cùng cardId đang mở → trả nguyên refs cũ, không mutate graph', () => {
  const { store, nodes } = makeFakeStore();
  const first = ensureToolModeGraph(store, null, 'sketch2render', 'ai.sketch2render');
  const nodesBefore = nodes.length;

  const again = ensureToolModeGraph(store, first, 'sketch2render', 'ai.sketch2render');

  assert.strictEqual(again, first, 'cùng cardId thì trả về CÙNG object refs (không tạo lại)');
  assert.strictEqual(nodes.length, nodesBefore, 'không thêm/xoá node nào');
});

console.log(`\n${passed} pass / 0 fail`);
