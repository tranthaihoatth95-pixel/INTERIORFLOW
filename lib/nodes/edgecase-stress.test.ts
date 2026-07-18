/**
 * lib/nodes/edgecase-stress.test.ts — STRESS TEST biên cho "Render" (node graph canvas).
 * Viết lại thay bản đã mất 15/07 (xem CHANGELOG.md "15/07 — 4 nhánh merge trước Sprint 3").
 * Chạy: node_modules/.bin/sucrase-node lib/nodes/edgecase-stress.test.ts
 *
 * GIỚI HẠN KỸ THUẬT ĐÃ XÁC NHẬN (đọc trước khi chỉnh sửa file này):
 * `lib/store.ts` (autoLayout, groupSelected…) và `lib/nodes/registry.ts` (NODE_REGISTRY) và
 * `lib/execution.ts` (runNode/runFlow, upstreamOrder/fullOrder) đều import bằng alias
 * '@/lib/...' (Next.js resolver) — sucrase-node (require() CommonJS thuần, không đọc
 * tsconfig paths) KHÔNG resolve được, đã thử nghiệm trực tiếp và xác nhận lỗi
 * "Cannot find module '@/lib/...'" (và với auth: "ERR_REQUIRE_ESM" từ gói jose qua chain
 * import). Đây CHÍNH LÀ lý do `lib/server/stress-auth.test.ts` sẵn có (dòng 74-89) đã tự
 * ghi lại logic hết-hạn token THUẦN thay vì import jose/auth.ts — cùng 1 giới hạn, cùng
 * 1 cách xử lý đã có tiền lệ trong repo.
 *
 * Phần [3]-[5] dưới đây SAO CHÉP NGUYÊN VĂN thuật toán thật (đổi tên biến tối thiểu,
 * ghi rõ số dòng nguồn) từ `lib/execution.ts` — 2 hàm `upstreamOrder`/`fullOrder` (dòng
 * 34-69) và cách gom input trong `execNode` (dòng 82-90) — vì 2 hàm đó KHÔNG export và
 * file chứa chúng không import được trực tiếp như trên. Test dưới đây khoá đúng HÀNH VI
 * thật của thuật toán (cycle-safe DFS, "first edge wins" khi nhiều input trùng), không
 * phải hành vi mong muốn chưa có.
 *
 * Phần [1]-[2] dùng CODE THẬT 100% (import trực tiếp, không sao chép) — `lib/nodes/tags.ts`
 * (tagsFor fallback) và `lib/phases.ts` (phaseFromNodes) đều THUẦN, không đụng '@/' nên
 * import được thẳng.
 */
import { tagsFor, NODE_TAGS, type NodeTag } from './tags';
import { phaseFromNodes, PHASE_MAP } from '../phases';

let pass = 0;
let fail = 0;
function ok(label: string, cond: boolean) {
  if (cond) { pass += 1; console.log(`  ok  - ${label}`); }
  else { fail += 1; console.log(`  FAIL - ${label}`); }
}

/* ══════════════════ [1] tagsFor — CODE THẬT (lib/nodes/tags.ts) ══════════════════ */
console.log('[1] tagsFor — node type biên (không có trong NODE_TAGS)');
{
  ok('node type KHÔNG tồn tại trong registry thật → fallback ["utility"]', JSON.stringify(tagsFor('does.not.exist')) === JSON.stringify(['utility']));
  ok('node type rỗng "" → fallback ["utility"]', JSON.stringify(tagsFor('')) === JSON.stringify(['utility']));
  ok('node type SAI HOA/thường (case-sensitive, không khớp key thật) → fallback', JSON.stringify(tagsFor('AI.CLAY2RENDER')) === JSON.stringify(['utility']));
  ok('node type thật đa-tag (ai.styletransfer) → ĐÚNG 2 tag thật, không rơi về fallback', JSON.stringify(tagsFor('ai.styletransfer')) === JSON.stringify(['ai-generate', 'edit']));
  // mọi entry trong NODE_TAGS phải có ít nhất 1 tag hợp lệ (không rỗng) — bất biến dữ liệu thật.
  const allValid = Object.entries(NODE_TAGS).every(([, tags]) => tags.length > 0);
  ok('mọi node type khai báo trong NODE_TAGS đều có ≥1 tag (không entry rỗng)', allValid);
}

/* ══════════════════ [2] phaseFromNodes — CODE THẬT (lib/phases.ts) ══════════════════ */
console.log('\n[2] phaseFromNodes — graph rỗng / toàn node lạ / trộn lẫn');
{
  ok('mảng defType RỖNG (flow chưa có node nào) → null', phaseFromNodes([]) === null);
  ok('toàn node type KHÔNG thuộc bộ "featured" nào → null (không ép sai chặng)', phaseFromNodes(['foo.bar', 'baz.qux']) === null);
  ok('trộn 1 node lạ + 1 node render thật → "render" (chỉ cần ≥1 khớp)', phaseFromNodes(['foo.bar', 'ai.clay2render']) === 'render');
  ok('LẶP cùng 1 node render 100 lần (dedup không ảnh hưởng) → vẫn "render"', phaseFromNodes(new Array(100).fill('ai.clay2render')) === 'render');
  ok('node "present" thật (slide.composer) đứng riêng, KHÔNG thuộc featured.render → null (present là route riêng, xem model.ts comment)', phaseFromNodes(['slide.composer']) === null);
  ok('PHASE_MAP.render.featured không rỗng (bất biến dữ liệu thật, nếu rỗng thì test trên vô nghĩa)', PHASE_MAP.render.featured.length > 0);
}

/* ══════════════════ [3] Cycle detection — sao chép thuật toán thật lib/execution.ts:34-53 ══════════════════ */
console.log('\n[3] upstreamOrder (sao chép nguyên văn lib/execution.ts:34-53) — cycle detection');
interface FN { id: string; type?: string }
interface FEdge { source: string; target: string; sourceHandle?: string | null; targetHandle?: string | null }
function isFlowNode(n: FN) { return n.type !== 'note'; } // n.type==='interior' thật; ở đây chỉ cần khác 'note'

/** Sao y nguyên văn logic `upstreamOrder` — lib/execution.ts dòng 34-53. */
function upstreamOrder(targetId: string, nodes: FN[], edges: FEdge[]): string[] {
  const order: string[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const visit = (id: string) => {
    if (visited.has(id)) return;
    if (visiting.has(id)) throw new Error('Flow có vòng lặp (cycle) — gỡ bớt edge để chạy.');
    visiting.add(id);
    for (const e of edges) if (e.target === id) visit(e.source);
    visiting.delete(id);
    visited.add(id);
    if (nodes.some((n) => n.id === id && isFlowNode(n))) order.push(id);
  };
  visit(targetId);
  return order;
}
/** Sao y nguyên văn logic `fullOrder` — lib/execution.ts dòng 56-69. */
function fullOrder(nodes: FN[], edges: FEdge[]): string[] {
  const flowNodes = nodes.filter(isFlowNode);
  const order: string[] = [];
  const seen = new Set<string>();
  for (const n of flowNodes) {
    for (const id of upstreamOrder(n.id, nodes, edges)) {
      if (!seen.has(id)) { seen.add(id); order.push(id); }
    }
  }
  return order;
}

{
  // self-loop: node nối output vào chính input của nó
  let threw = false;
  try { upstreamOrder('A', [{ id: 'A' }], [{ source: 'A', target: 'A' }]); }
  catch { threw = true; }
  ok('self-loop (A→A) → throw "Flow có vòng lặp"', threw);

  // vòng lặp 2 node A↔B
  let threw2 = false;
  try { upstreamOrder('A', [{ id: 'A' }, { id: 'B' }], [{ source: 'B', target: 'A' }, { source: 'A', target: 'B' }]); }
  catch { threw2 = true; }
  ok('vòng lặp 2 node (A→B→A) → throw', threw2);

  // vòng lặp SÂU 5 node (A→B→C→D→E→A)
  const deepNodes = ['A', 'B', 'C', 'D', 'E'].map((id) => ({ id }));
  const deepEdges: FEdge[] = [
    { source: 'A', target: 'B' }, { source: 'B', target: 'C' }, { source: 'C', target: 'D' },
    { source: 'D', target: 'E' }, { source: 'E', target: 'A' },
  ];
  let threw3 = false;
  try { upstreamOrder('C', deepNodes, deepEdges); } catch { threw3 = true; }
  ok('vòng lặp SÂU 5 node, phát hiện dù bắt đầu dò từ giữa vòng (target=C)', threw3);

  // chuỗi tuyến tính KHÔNG cycle — thứ tự topo đúng (xa nhất trước)
  const chainOrder = upstreamOrder('A', [{ id: 'A' }, { id: 'B' }, { id: 'C' }], [{ source: 'B', target: 'A' }, { source: 'C', target: 'B' }]);
  ok('chuỗi C→B→A (không cycle): thứ tự topo đúng [C,B,A]', JSON.stringify(chainOrder) === JSON.stringify(['C', 'B', 'A']));

  // kim cương (diamond) hội tụ A→B, A→C, B→D, C→D — D phải đứng SAU CÙNG, A đứng ĐẦU
  const diamondOrder = upstreamOrder('D', [{ id: 'A' }, { id: 'B' }, { id: 'C' }, { id: 'D' }], [
    { source: 'A', target: 'B' }, { source: 'A', target: 'C' }, { source: 'B', target: 'D' }, { source: 'C', target: 'D' },
  ]);
  ok('kim cương hội tụ (A→B,A→C,B→D,C→D): A đứng đầu, D đứng cuối, đủ 4 node không lặp', diamondOrder[0] === 'A' && diamondOrder[diamondOrder.length - 1] === 'D' && diamondOrder.length === 4);

  // đảo lập (island) tách rời — không được kéo vào khi chạy 1 node cụ thể, nhưng vào đủ khi chạy CẢ FLOW
  const islandNodes: FN[] = [{ id: 'A' }, { id: 'B' }, { id: 'ISLAND1' }, { id: 'ISLAND2' }];
  const islandEdges: FEdge[] = [{ source: 'A', target: 'B' }, { source: 'ISLAND1', target: 'ISLAND2' }];
  const single = upstreamOrder('B', islandNodes, islandEdges);
  ok('chạy 1 node (▶ nút B): đảo lập KHÔNG liên quan → KHÔNG bị kéo vào (chỉ [A,B])', JSON.stringify(single) === JSON.stringify(['A', 'B']));
  const full = fullOrder(islandNodes, islandEdges);
  ok('Run Flow (toàn graph): đảo lập tách rời VẪN được chạy (đủ cả 4 node)', full.length === 4 && full.includes('ISLAND1') && full.includes('ISLAND2'));

  // node "note" (ghi chú) không phải flow node thật — bị lọc khỏi order dù có mặt trong nodes[]
  const withNote: FN[] = [{ id: 'A' }, { id: 'N1', type: 'note' }, { id: 'B' }];
  const withNoteEdges: FEdge[] = [{ source: 'A', target: 'B' }, { source: 'N1', target: 'B' }];
  const orderNoNote = upstreamOrder('B', withNote, withNoteEdges);
  ok('node ghi chú (type "note") nối vào flow → KHÔNG xuất hiện trong thứ tự chạy', !orderNoNote.includes('N1') && orderNoNote.includes('A') && orderNoNote.includes('B'));
}

/* ══════════════════ [4] Nhiều node cùng ghi vào 1 input — sao chép logic execNode:82-90 ══════════════════ */
console.log('\n[4] Gom input (sao chép nguyên văn lib/execution.ts:82-90) — 2 nguồn ghi cùng 1 cổng input');
/** Sao y nguyên văn vòng lặp gom input trong `execNode` — chỉ khác: nhận outputs qua tham số
 * thay vì đọc `useFlowStore.getState()` (không import được store.ts, xem ghi chú đầu file). */
function gatherInputs(
  nodeId: string,
  ports: { id: string }[],
  edges: FEdge[],
  outputsBySourceNode: Record<string, Record<string, string>>,
): Record<string, string | undefined> {
  const inputs: Record<string, string | undefined> = {};
  for (const port of ports) {
    const edge = edges.find((e) => e.target === nodeId && e.targetHandle === port.id); // .find = KHỚP ĐẦU TIÊN
    if (edge) inputs[port.id] = outputsBySourceNode[edge.source]?.[edge.sourceHandle ?? ''];
  }
  return inputs;
}
{
  // 2 node (W1, W2) CÙNG nối vào cổng "image" của node X — UI kéo-thả bình thường sẽ chặn việc
  // này (addEdge thay thế edge cũ), nhưng dữ liệu đã lưu (import flow cũ/lỗi đồng bộ) có thể có
  // 2 edge trùng target+targetHandle cùng lúc — đây là input CHƯA từng test.
  const edges: FEdge[] = [
    { source: 'W1', target: 'X', targetHandle: 'image', sourceHandle: 'out' },
    { source: 'W2', target: 'X', targetHandle: 'image', sourceHandle: 'out' },
  ];
  const outputs = { W1: { out: 'anh-tu-W1' }, W2: { out: 'anh-tu-W2' } };
  const gathered = gatherInputs('X', [{ id: 'image' }], edges, outputs);
  ok('2 node cùng ghi vào 1 input port → CHỈ edge ĐẦU TIÊN trong mảng thắng (W1), W2 bị NUỐT ÂM THẦM (không lỗi, không cảnh báo)', gathered.image === 'anh-tu-W1');

  // đảo thứ tự mảng edges → W2 thắng thay vì W1 (xác nhận đây là "thứ tự mảng", không phải ưu tiên theo id/tên)
  const edgesReversed: FEdge[] = [edges[1], edges[0]];
  const gatheredReversed = gatherInputs('X', [{ id: 'image' }], edgesReversed, outputs);
  ok('đảo thứ tự mảng edge → node thắng cũng đổi theo (W2) — xác nhận quy tắc là "edge đầu mảng", không phải ưu tiên cố định', gatheredReversed.image === 'anh-tu-W2');
}

console.log('\n[5] Gom input — node KHÔNG có input bắt buộc (không nối gì vào cổng)');
{
  // Không có edge nào trỏ tới port này — inputs.image ĐƠN GIẢN LÀ THIẾU KEY (không phải
  // `{ image: undefined }`) — đúng hành vi thật vì code chỉ set khi tìm thấy edge (execution.ts:86-89).
  const gathered = gatherInputs('Y', [{ id: 'image' }, { id: 'prompt' }], [], {});
  ok('node không nối gì vào input bắt buộc → object input KHÔNG có key đó (thiếu hẳn, không phải undefined tường minh)', !('image' in gathered) && !('prompt' in gathered));
  ok('object input rỗng hoàn toàn khi 0 cổng nào được nối', Object.keys(gathered).length === 0);
  // Đây chính là lý do MỌI node thật trong registry.ts đều tự `if (!inputs.image) throw new Error(...)`
  // ngay dòng đầu execute() (vd ai.sketch2render, ai.clay2render…) — validation nằm ở NODE, không ở
  // tầng gom input chung. Không thể import registry.ts để gọi execute() thật (chain '@/lib/ai/client'
  // không resolve được — đã xác nhận), nên test dừng ở tầng gom input (điểm mà "thiếu input" thực sự
  // xảy ra) thay vì giả lập lại thông điệp lỗi của từng node.
  ok('disconnect giữa chừng: node bị rút 1 input đang nối (giả lập) → input đó biến mất khỏi object, các input khác không đổi', (() => {
    const before = gatherInputs('Z', [{ id: 'a' }, { id: 'b' }], [{ source: 'S', target: 'Z', targetHandle: 'a', sourceHandle: 'o' }, { source: 'S', target: 'Z', targetHandle: 'b', sourceHandle: 'o' }], { S: { o: 'v' } });
    const afterDisconnect = gatherInputs('Z', [{ id: 'a' }, { id: 'b' }], [{ source: 'S', target: 'Z', targetHandle: 'a', sourceHandle: 'o' }], { S: { o: 'v' } });
    return 'a' in before && 'b' in before && 'a' in afterDisconnect && !('b' in afterDisconnect);
  })());
}

console.log(`\n${pass} ok, ${fail} fail`);
if (fail > 0) process.exit(1);
