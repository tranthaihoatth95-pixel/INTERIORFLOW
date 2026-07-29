/**
 * lib/render-studio/tool-mode-graph.ts — dựng/giữ graph 2 node (input.image → node AI) cho
 * Tool Mode (LỖ RÒ 1, mã 2.2.77, 29/07 — docs/CHOT-SO-MA-2026-07-29.md §D).
 *
 * Nhận `store` qua tham số (port tối thiểu, không import thẳng `useFlowStore`) để test được
 * bằng `sucrase-node` (repo chưa có Jest/Vitest, xem `lib/scope-core.test.ts`) — `lib/store.ts`
 * kéo theo cả chuỗi import `@/...` mà sucrase-node không resolve được (không alias). Component
 * thật (`ToolModeForm.tsx`) truyền `useFlowStore.getState()` làm `store` — cùng một hàm, không
 * phải bản mô phỏng lại riêng cho test.
 *
 * Luật: đổi thẻ việc (`cardId`) KHÔNG được xoá ảnh đã thả — chỉ node ẢNH NGUỒN (`imgId`) sống
 * xuyên suốt phiên Tool Mode; node AI ĐÍCH (`aiId`) đổi theo thẻ đang chọn, nối lại vào ĐÚNG
 * `imgId` cũ (không dựng node ảnh mới, không mất ảnh).
 */

export interface ToolModeNodeRefs {
  imgId: string;
  aiId: string;
  cardId: string;
}

/** Cổng tối thiểu vào graph store — đúng 3 hàm `ensureToolModeGraph` cần, đủ để fake trong test. */
export interface ToolModeGraphStore {
  addNode: (defType: string, position: { x: number; y: number }) => void;
  deleteNode: (id: string) => void;
  onConnect: (p: { source: string; sourceHandle: string; target: string; targetHandle: string }) => void;
  /** id của node vừa `addNode()` xong (node cuối trong danh sách). */
  lastNodeId: () => string;
}

/**
 * Đảm bảo graph khớp đúng `cardId`/`nodeType` đang chọn, giữ nguyên node ảnh nguồn nếu đã có.
 * - `current === null` → dựng mới cả 2 node (lần đầu vào Tool Mode / sau khi dọn phiên).
 * - `current.cardId !== cardId` → xoá node AI cũ, dựng node AI mới đúng `nodeType`, nối lại vào
 *   ĐÚNG `current.imgId` (không đụng node ảnh).
 * - `current.cardId === cardId` → không đổi gì, trả nguyên `current` (idempotent).
 */
export function ensureToolModeGraph(
  store: ToolModeGraphStore,
  current: ToolModeNodeRefs | null,
  cardId: string,
  nodeType: string,
): ToolModeNodeRefs {
  if (!current) {
    store.addNode('input.image', { x: 40, y: 160 });
    const imgId = store.lastNodeId();
    store.addNode(nodeType, { x: 480, y: 160 });
    const aiId = store.lastNodeId();
    store.onConnect({ source: imgId, sourceHandle: 'image', target: aiId, targetHandle: 'image' });
    return { imgId, aiId, cardId };
  }

  if (current.cardId !== cardId) {
    store.deleteNode(current.aiId);
    store.addNode(nodeType, { x: 480, y: 160 });
    const newAiId = store.lastNodeId();
    store.onConnect({ source: current.imgId, sourceHandle: 'image', target: newAiId, targetHandle: 'image' });
    return { imgId: current.imgId, aiId: newAiId, cardId };
  }

  return current;
}
