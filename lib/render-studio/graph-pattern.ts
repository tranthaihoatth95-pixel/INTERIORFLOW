/**
 * lib/render-studio/graph-pattern.ts — nhận diện graph hiện tại có khớp mẫu "Tool Mode đơn giản"
 * hay không (LỖ RÒ 2, mã 2.2.77, 29/07 — docs/CHOT-SO-MA-2026-07-29.md §D).
 *
 * Dùng khi Tool Mode overlay hiện lại ở `view==='home'` (vd sau khi rời canvas, hoặc màn thu nhỏ
 * ép về Tool Mode — `useIsSmallScreenForCanvas`): nếu graph khớp đúng 1 node `input.image` nối
 * thẳng vào đúng 1 node `ai.*` có thẻ Tool Mode tương ứng → mở lại ĐÚNG thẻ đó dạng form, không
 * mất ngữ cảnh. Phức tạp hơn (nhiều node, rẽ nhánh, node lạ...) → KHÔNG được giả vờ Tool Mode
 * hiểu hết — phải báo rõ có N node đang chờ trên canvas, không im lặng hiện lưới 6 thẻ trống như
 * chưa từng có gì (đúng luật "chuyển giao diện không được xoá dữ liệu").
 */

import type { Edge } from '@xyflow/react';
import type { FlowNode } from '@/lib/store';
import { TASK_CARDS } from './task-cards';

export type GraphPattern =
  | { kind: 'empty' }
  | { kind: 'single'; cardId: string }
  | { kind: 'complex'; nodeCount: number };

/** Node 'note' (sticky note) không tính vào độ phức tạp — không phải bước xử lý. */
function isFunctionalNode(n: FlowNode): boolean {
  return n.data.defType !== 'note';
}

export function detectGraphPattern(nodes: FlowNode[], edges: Edge[]): GraphPattern {
  const real = nodes.filter(isFunctionalNode);
  if (real.length === 0) return { kind: 'empty' };

  if (real.length === 2) {
    const [a, b] = real;
    const imgNode = a.data.defType === 'input.image' ? a : b.data.defType === 'input.image' ? b : null;
    if (imgNode) {
      const aiNode = imgNode === a ? b : a;
      const isDirectLink = edges.length === 1 && edges[0].source === imgNode.id && edges[0].target === aiNode.id;
      if (isDirectLink) {
        const card = TASK_CARDS.find((c) => c.nodeType === aiNode.data.defType);
        if (card) return { kind: 'single', cardId: card.id };
      }
    }
  }

  return { kind: 'complex', nodeCount: real.length };
}
