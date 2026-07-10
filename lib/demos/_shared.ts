// lib/demos/_shared.ts — helper dùng chung cho các demo module (concept / sketch / clay).
//
// Mỗi demo là 1 module `{ meta, build }`. build() trả { nodes, edges } đã dựng sẵn
// node + edge + params, và (với node AI) NƯỚNG output thật từ /public/demo qua done().
// sealHashes() "niêm" inputHash cho node đã done để "Chạy flow" BỎ QUA (không gọi API
// server-side → tránh lỗi fetch URL tương đối khi provider chưa có balance).

import { getDefinition, defaultParams } from '@/lib/nodes/registry';
import { nextId, edgeStyleFor, type FlowNode } from '@/lib/store';
import type { Phase } from '@/lib/phases';

export interface DemoSeedMeta {
  id: string;
  /** Nhãn ngắn (VI) cho nút launcher */
  label: string;
  /** Mô tả 1 dòng cho tooltip / phụ đề */
  desc: string;
  /** Emoji/glyph nhỏ đứng đầu nút */
  glyph: string;
  /** Chặng (phase) mà demo thuộc về — dùng để lọc launcher theo workspace. */
  phase: Phase;
}

export interface DemoEdge {
  id: string;
  source: string;
  sourceHandle: string;
  target: string;
  targetHandle: string;
  style: ReturnType<typeof edgeStyleFor>;
}

export interface Seed {
  nodes: FlowNode[];
  edges: DemoEdge[];
}

export interface DemoModule {
  meta: DemoSeedMeta;
  build: () => Seed;
}

/** Dựng 1 node theo defType tại (x,y) với params mặc định. */
export function mk(defType: string, x: number, y: number): FlowNode {
  const def = getDefinition(defType);
  return {
    id: nextId('node'),
    type: 'interior',
    position: { x, y },
    data: { defType, params: defaultParams(def), run: { status: 'idle', progress: 0 } },
  };
}

/** Nối edge a.ah → b.bh (dataType để tô màu edge). */
export function edge(a: FlowNode, ah: string, b: FlowNode, bh: string, dt = 'image'): DemoEdge {
  return {
    id: nextId('edge'),
    source: a.id,
    sourceHandle: ah,
    target: b.id,
    targetHandle: bh,
    style: edgeStyleFor(dt),
  };
}

/** data:image/svg+xml — chỉ dùng cho phần MINH HOẠ (ví dụ note/nền), KHÔNG cho sản phẩm thật. */
export function svg(body: string, w = 768, h = 512): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${body}</svg>`,
  )}`;
}

/** run đã DONE với 1 output ảnh thật (url trong /public/demo, ví dụ '/demo/sketch-out.png'). */
export function done(url: string) {
  return {
    status: 'done' as const,
    progress: 1,
    outputs: { image: { dataType: 'image' as const, value: url } },
  };
}

/** run đã DONE với 1 output text (ví dụ prompt nguồn) — giữ ổn định, không re-exec. */
export function doneText(value: string) {
  return {
    status: 'done' as const,
    progress: 1,
    outputs: { text: { dataType: 'text' as const, value } },
  };
}

/** run đã DONE với nhiều output (ví dụ moodboard image1..image4). */
export function doneMulti(outputs: Record<string, string>) {
  const out: Record<string, { dataType: 'image'; value: string }> = {};
  for (const [k, v] of Object.entries(outputs)) out[k] = { dataType: 'image', value: v };
  return { status: 'done' as const, progress: 1, outputs: out };
}

/**
 * "Niêm" inputHash cho mọi node đã done — khớp đúng công thức execNode.hashOf trong
 * execution.ts để nút ▶ / "Chạy flow" BỎ QUA (coi như đã done). Gọi 1 lần sau khi
 * dựng xong nodes+edges. Mutates node.data.run.inputHash tại chỗ.
 */
export function sealHashes(nodes: FlowNode[], edges: DemoEdge[]): void {
  for (const n of nodes) {
    if (n.data.run.status !== 'done') continue;
    const def = getDefinition(n.data.defType);
    const inputs: Record<string, unknown> = {};
    for (const port of def.inputs) {
      const e = edges.find((ed) => ed.target === n.id && ed.targetHandle === port.id);
      if (e) {
        const srcNode = nodes.find((x) => x.id === e.source);
        inputs[port.id] = srcNode?.data.run.outputs?.[e.sourceHandle ?? ''];
      }
    }
    n.data.run.inputHash = JSON.stringify({ inputs, params: n.data.params });
  }
}
