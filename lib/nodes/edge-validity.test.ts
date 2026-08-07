/**
 * lib/nodes/edge-validity.test.ts — bộ đếm "M nối sai" trên thanh trạng thái bảng nút.
 * Chạy: node_modules/.bin/sucrase-node lib/nodes/edge-validity.test.ts
 *
 * Thứ file này khoá: con số hiện cho người dùng phải là DÂY SAI KIỂU THẬT. Đếm lố (gộp cả dây
 * hỏng dữ liệu, ghi chú, defType lạ) thì người dùng đi tìm một dây đỏ không tồn tại; đếm thiếu
 * thì flow cũ mang dây sai chạy tiếp rồi vỡ giữa lượt gọi mô hình.
 */
import type { NodeDefinition } from '../types';
import {
  countBoardNodes, countMistypedEdges, findMistypedEdges,
  type EdgeValidityEdge, type EdgeValidityNode,
} from './edge-validity';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

// ── Bộ định nghĩa giả: 1 node ra ảnh, 1 node nhận ảnh + nhận số ────────────────────────────
const DEFS: Record<string, NodeDefinition> = {
  src: {
    type: 'src', title: 'Nguồn', category: 'INPUT', description: '',
    inputs: [], outputs: [{ id: 'out', label: 'Ảnh', dataType: 'image' }],
    params: [], creditCost: 0, execute: async () => ({}),
  },
  sink: {
    type: 'sink', title: 'Đích', category: 'OUTPUT', description: '',
    inputs: [
      { id: 'image', label: 'Ảnh', dataType: 'image' },
      { id: 'amount', label: 'Mức', dataType: 'number' },
    ],
    outputs: [], params: [], creditCost: 0, execute: async () => ({}),
  },
};
const lookup = (t: string): NodeDefinition => {
  const d = DEFS[t];
  if (!d) throw new Error(`node lạ: ${t}`);
  return d;
};

const nodes: EdgeValidityNode[] = [
  { id: 'a', data: { defType: 'src' } },
  { id: 'b', data: { defType: 'sink' } },
  { id: 'note1', type: 'note', data: { defType: 'note' } },
  { id: 'ghost', data: { defType: 'khong-ton-tai' } },
];
const e = (id: string, p: Partial<EdgeValidityEdge>): EdgeValidityEdge =>
  ({ id, source: 'a', target: 'b', sourceHandle: 'out', targetHandle: 'image', ...p });

// ── [1] Đúng kiểu → 0 ─────────────────────────────────────────────────────────────────────
{
  ok('ảnh → ảnh: không tính sai', countMistypedEdges(nodes, [e('ok1', {})], lookup) === 0);
}

// ── [2] Sai kiểu → đếm + báo đúng 2 đầu ───────────────────────────────────────────────────
{
  const bad = findMistypedEdges(nodes, [e('bad1', { targetHandle: 'amount' })], lookup);
  ok('ảnh → số: tính 1 dây sai', bad.length === 1);
  ok('ghi đúng kiểu 2 đầu', bad[0]?.sourceType === 'image' && bad[0]?.targetType === 'number');
  ok('ghi đúng id dây (để tô đỏ đúng dây)', bad[0]?.edgeId === 'bad1');
}

// ── [3] Hỏng dữ liệu KHÔNG được gộp vào con số "nối sai" ──────────────────────────────────
{
  const junk: EdgeValidityEdge[] = [
    e('mat-node', { source: 'khong-co' }),          // node không tồn tại
    e('ghi-chu', { target: 'note1' }),              // ghi chú, không có cổng
    e('def-la', { target: 'ghost' }),               // defType tra không ra
    e('thieu-handle', { targetHandle: null }),      // thiếu handle
    e('handle-cu', { targetHandle: 'da-xoa' }),     // handle trỏ cổng không còn
  ];
  ok('5 ca hỏng dữ liệu → vẫn 0 "nối sai"', countMistypedEdges(nodes, junk, lookup) === 0);
  ok('trộn chung: chỉ đếm đúng 1 dây sai thật',
    countMistypedEdges(nodes, [...junk, e('bad2', { targetHandle: 'amount' })], lookup) === 1);
}

// ── [4] Đếm khối: giấy nhớ không phải nút ─────────────────────────────────────────────────
{
  ok('4 phần tử, 1 giấy nhớ → 3 nút', countBoardNodes(nodes) === 3);
  ok('bảng trống → 0 nút', countBoardNodes([]) === 0);

  // 06/08 — đếm thứ NHÌN THẤY: thu gọn nút tổng thì node con mang cờ `hidden`, còn mặt nút tổng
  // vẽ từ `groups[]` chứ không có node nào. Hai vế phải bù nhau, nếu không con số nói dối đúng
  // lúc người dùng vừa gom xong.
  const hiddenNodes: EdgeValidityNode[] = nodes.map((n) => ({ ...n, hidden: true }));
  ok('mọi node bị ẩn, không cụm nào → 0 nút', countBoardNodes(hiddenNodes) === 0);
  ok(
    'gom 3 nút thành 1 nút tổng thu gọn → 1 nút',
    countBoardNodes(hiddenNodes, [{ isMacro: true, collapsed: true }]) === 1,
  );
  ok(
    'nút tổng ĐANG MỞ không cộng thêm (node con hiện lại rồi)',
    countBoardNodes(nodes, [{ isMacro: true, collapsed: false }]) === 3,
  );
  ok(
    'cụm thường (không phải nút tổng) không cộng thêm',
    countBoardNodes(nodes, [{ isMacro: false, collapsed: true }]) === 3,
  );
}

console.log(`\n${pass} pass · ${fail} fail`);
if (fail > 0) process.exit(1);
