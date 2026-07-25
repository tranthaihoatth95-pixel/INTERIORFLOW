'use client';

import type { Edge } from '@xyflow/react';
import { useFlowStore, type FlowNode } from '@/lib/store';

/**
 * Tìm ảnh nguồn đang nối vào 1 input của node: output đã chạy của node upstream, hoặc
 * file đã chọn ở `input.image` dù chưa chạy (người dùng vừa upload là muốn dùng ngay).
 *
 * Tách ra khỏi MaskPainterModal (nơi logic này ra đời) vì giờ có 3 chỗ cần:
 *  - MaskPainterModal   — ảnh để vẽ mask
 *  - SmartSelectModal   — ảnh để chọn vùng bằng SAM
 *  - InteriorNode       — biết CÓ ảnh chưa để **disable nút mở modal** (trước đây modal mở
 *    ra rồi mới báo "chưa có ảnh nguồn" — user gặp thật, khó hiểu).
 */
export function resolveSourceImage(
  nodes: FlowNode[],
  edges: Edge[],
  nodeId: string | null,
  handle = 'image',
): string | null {
  if (!nodeId) return null;
  const edge = edges.find((e) => e.target === nodeId && e.targetHandle === handle);
  if (!edge) return null;
  const source = nodes.find((n) => n.id === edge.source);
  if (!source) return null;
  const fromRun = source.data.run.outputs?.[edge.sourceHandle ?? ''];
  if (fromRun && fromRun.dataType === 'image') return String(fromRun.value);
  if (source.data.defType === 'input.image' && source.data.params.file) {
    return String(source.data.params.file);
  }
  return null;
}

/** Hook tiện dụng — subscribe nodes/edges rồi resolve. */
export function useSourceImage(nodeId: string | null, handle = 'image'): string | null {
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  return resolveSourceImage(nodes, edges, nodeId, handle);
}
