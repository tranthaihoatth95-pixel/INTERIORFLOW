/**
 * lib/nodes/macro.test.ts — phép tính thuần của NÚT TỔNG (không đụng store/React/registry thật —
 * `lookupDef` giả lập `getDefinition()`, xem lý do tiêm phụ thuộc trong `macro.ts`).
 * Chạy: node_modules/.bin/sucrase-node lib/nodes/macro.test.ts
 */
import { collectExposableParams, computeBoundaryPorts, terminalNodeIds, totalCreditCost, type DefLookup } from './macro';
import type { FlowNode } from '../store';
import type { Edge } from '@xyflow/react';
import type { NodeDefinition } from '../types';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) {
    pass += 1;
    console.log(`  ok  - ${label}`);
  } else {
    fail += 1;
    console.log(`  FAIL - ${label}`);
  }
}

/** node giả tối thiểu — đủ field mà macro.ts đọc (`id`/`type`/`data.defType`). */
function node(id: string, defType: string): FlowNode {
  return {
    id,
    type: 'interior',
    position: { x: 0, y: 0 },
    data: { defType, params: {}, run: { status: 'idle', progress: 0 } },
  } as unknown as FlowNode;
}

function edge(id: string, source: string, target: string, sourceHandle: string, targetHandle: string): Edge {
  return { id, source, target, sourceHandle, targetHandle } as Edge;
}

/** 3 NodeDefinition GIẢ — cùng hình dạng cổng với 3 node thật trong registry.ts (input.image →
 * ai.upscale → out.gallery, toàn dataType 'image') để test đúng KIẾN TRÚC (đọc def qua lookupDef,
 * không đụng registry.ts thật — xem macro.ts). */
const FAKE_DEFS: Record<string, NodeDefinition> = {
  'input.image': {
    type: 'input.image', title: 'Nhập ảnh', category: 'INPUT', description: '',
    inputs: [], outputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    params: [{ kind: 'image', id: 'file', label: 'Image' }],
    creditCost: 0, async execute() { return {}; },
  },
  'ai.upscale': {
    type: 'ai.upscale', title: 'Phóng to ảnh', category: 'AI_EDIT', description: '',
    inputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    outputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    params: [{ kind: 'select', id: 'scale', label: 'Scale', options: ['2', '4'] }],
    creditCost: 2, async execute() { return {}; },
  },
  'out.gallery': {
    type: 'out.gallery', title: 'Lưu vào Gallery', category: 'OUTPUT', description: '',
    inputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    outputs: [{ id: 'image', label: 'Image', dataType: 'image' }],
    params: [{ kind: 'text', id: 'name', label: 'Tên asset' }],
    creditCost: 0, async execute() { return {}; },
  },
};
const lookupDef: DefLookup = (defType) => {
  const def = FAKE_DEFS[defType];
  if (!def) throw new Error(`unknown defType ${defType}`);
  return def;
};

// 3 node giả nối thành 1 chuỗi ảnh: input.image (A) → ai.upscale (B) → out.gallery (C)
const A = node('a', 'input.image');
const B = node('b', 'ai.upscale');
const C = node('c', 'out.gallery');
const nodes = [A, B, C];

console.log('collectExposableParams — gom đủ tham số 3 node, không sập khi 1 node lạ');
const rows = collectExposableParams(nodes, ['a', 'b', 'c'], lookupDef);
ok('có ít nhất 1 dòng cho mỗi 3 node', new Set(rows.map((r) => r.nodeId)).size === 3);
// 06/08 — hợp đồng màu ĐỔI: `DATA_TYPE_COLORS` nay trả BIẾN token `var(--p-*)` cho các kiểu có
// trong mock Bảng nút (image/mask/number), hex chỉ còn ở text/video/table. Test khoá lại đúng
// điều thật sự cần: dotColor là MÀU CSS DÙNG ĐƯỢC (hex hoặc var(--…)), không rỗng — chứ không
// khoá riêng dạng hex nữa (khoá dạng hex = cấm token hoá, ngược luật L4).
ok('mỗi dòng có dotColor là màu CSS dùng được (hex hoặc var(--…))',
  rows.every((r) => /^#[0-9a-f]{3,8}$/i.test(r.dotColor) || /^var\(--[\w-]+\)$/.test(r.dotColor)));
const rowsWithBad = collectExposableParams([...nodes, node('x', 'khong.ton.tai')], ['a', 'b', 'c', 'x'], lookupDef);
ok('defType lạ bị bỏ qua, không throw, không thêm dòng nào', rowsWithBad.length === rows.length);

console.log('computeBoundaryPorts — chỉ cạnh XUYÊN BIÊN mới sinh cổng');
const outsideNode = node('z', 'out.gallery');
const edges: Edge[] = [
  edge('e1', 'a', 'b', 'image', 'image'),
  edge('e2', 'b', 'c', 'image', 'image'),
  edge('e3', 'c', 'z', 'image', 'image'), // xuyên biên: c trong nhóm, z ngoài nhóm
];
const boundary = computeBoundaryPorts([...nodes, outsideNode], ['a', 'b', 'c'], edges, lookupDef);
ok('0 cổng vào (không node ngoài nào bơm vào nhóm)', boundary.inputs.length === 0);
ok('đúng 1 cổng ra (c → z)', boundary.outputs.length === 1);
ok('cổng ra đúng childNodeId = c', boundary.outputs[0]?.childNodeId === 'c');
ok('cổng ra đọc đúng dataType image từ def', boundary.outputs[0]?.dataType === 'image');
ok('cạnh nội bộ (a→b, b→c) không sinh cổng nào', boundary.inputs.length + boundary.outputs.length === 1);

console.log('computeBoundaryPorts — cạnh vào từ ngoài');
const edgesIn: Edge[] = [
  edge('e0', 'z', 'a', 'image', 'image'), // xuyên biên: z ngoài, a trong nhóm
  edge('e1', 'a', 'b', 'image', 'image'),
  edge('e2', 'b', 'c', 'image', 'image'),
];
const boundaryIn = computeBoundaryPorts([...nodes, outsideNode], ['a', 'b', 'c'], edgesIn, lookupDef);
ok('đúng 1 cổng vào (z → a)', boundaryIn.inputs.length === 1);
ok('0 cổng ra', boundaryIn.outputs.length === 0);

console.log('terminalNodeIds — chỉ node cuối nhánh TRONG nhóm mới cần runNode()');
const term = terminalNodeIds(['a', 'b', 'c'], edges);
ok('c là node cuối (không có a/b nào), b/a có downstream nội bộ', term.length === 1 && term[0] === 'c');

const parallelEdges: Edge[] = [edge('p1', 'a', 'b', 'image', 'image'), edge('p2', 'a', 'c', 'image', 'image')];
const termParallel = terminalNodeIds(['a', 'b', 'c'], parallelEdges);
ok('nhánh song song: cả b lẫn c đều là cuối nhánh', termParallel.length === 2 && termParallel.includes('b') && termParallel.includes('c'));

console.log('totalCreditCost — cộng đúng creditCost 3 node, bỏ qua defType lạ');
const cost3 = totalCreditCost(nodes, ['a', 'b', 'c'], lookupDef);
const costWithBad = totalCreditCost([...nodes, node('x', 'khong.ton.tai')], ['a', 'b', 'c', 'x'], lookupDef);
ok('tổng credit đúng 2 (chỉ ai.upscale có creditCost)', cost3 === 2);
ok('node lạ không cộng thêm (không throw)', cost3 === costWithBad);

console.log(`\n${pass} pass, ${fail} fail`);
if (fail) process.exit(1);
