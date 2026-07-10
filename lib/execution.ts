'use client';

import type { Edge } from '@xyflow/react';
import type { Job, PortValue } from '@/lib/types';
import { getDefinition } from '@/lib/nodes/registry';
import { useFlowStore, nextId, type FlowNode } from '@/lib/store';

function isFlowNode(n: FlowNode) {
  return n.type === 'interior';
}

/**
 * Dịch lỗi backend AI thô ("fetch failed", 502 workflow...) sang thông báo rõ + hướng xử lý,
 * để node không hiện chuỗi kỹ thuật khó hiểu cho người dùng.
 */
export function friendlyAiError(raw: string): string {
  const m = (raw || '').toLowerCase();
  if (/fetch failed|econnrefused|failed to fetch|network|connect|timed out|timeout|socket/.test(m))
    return 'Backend AI chưa chạy / không kết nối được. Bật ComfyUI (cổng 8188) rồi thử lại, hoặc đổi Mức AI ở góc phải header.';
  if (/text2img|workflow|not found.*json|\.json/.test(m))
    return 'Engine tự-host (ComfyUI) chưa có workflow cho tác vụ này. Dùng mức AI khác, hoặc bổ sung workflow tương ứng.';
  if (/provider_not_configured|not configured|chưa cấu hình/.test(m))
    return 'Chưa cấu hình nhà cung cấp AI cho mức này — chọn mức AI khác ở header.';
  if (/exhausted|balance|top up|top-up|quota|402|insufficient|payment required|user is locked|credit/.test(m))
    return 'Tài khoản AI (fal.ai) hết số dư — nạp credit tại fal.ai/dashboard/billing. Với ảnh, có thể đổi sang mức tự-host (ComfyUI); riêng video (Kling/Veo) chỉ chạy trên fal nên bắt buộc nạp.';
  if (/unauthorized|401|forbidden|403/.test(m))
    return 'Không có quyền truy cập ảnh/đầu vào (401/403). Thử tải ảnh trực tiếp vào node.';
  return raw;
}

/** Topo-sort: node đích + toàn bộ upstream của nó (DFS post-order). */
function upstreamOrder(targetId: string, nodes: FlowNode[], edges: Edge[]): string[] {
  const order: string[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  const visit = (id: string) => {
    if (visited.has(id)) return;
    if (visiting.has(id)) throw new Error('Flow có vòng lặp (cycle) — gỡ bớt edge để chạy.');
    visiting.add(id);
    for (const e of edges) {
      if (e.target === id) visit(e.source);
    }
    visiting.delete(id);
    visited.add(id);
    if (nodes.some((n) => n.id === id && isFlowNode(n))) order.push(id);
  };

  visit(targetId);
  return order;
}

/** Topo-sort toàn graph (Run flow). */
function fullOrder(nodes: FlowNode[], edges: Edge[]): string[] {
  const flowNodes = nodes.filter(isFlowNode);
  const order: string[] = [];
  const seen = new Set<string>();
  for (const n of flowNodes) {
    for (const id of upstreamOrder(n.id, nodes, edges)) {
      if (!seen.has(id)) {
        seen.add(id);
        order.push(id);
      }
    }
  }
  return order;
}

function hashOf(inputs: Record<string, PortValue | undefined>, params: Record<string, string | number>) {
  return JSON.stringify({ inputs, params });
}

/** Chạy 1 node: gom input từ upstream đã done, tạo job, trừ credit, execute. */
async function execNode(nodeId: string): Promise<boolean> {
  const store = useFlowStore.getState();
  const node = store.nodes.find((n) => n.id === nodeId);
  if (!node || !isFlowNode(node)) return true;
  const def = getDefinition(node.data.defType);

  // Gom input từ các edge đi vào
  const inputs: Record<string, PortValue | undefined> = {};
  for (const port of def.inputs) {
    const edge = store.edges.find((e) => e.target === nodeId && e.targetHandle === port.id);
    if (edge) {
      const source = useFlowStore.getState().nodes.find((n) => n.id === edge.source);
      inputs[port.id] = source?.data.run.outputs?.[edge.sourceHandle ?? ''];
    }
  }

  // Cache theo input-hash: không đổi thì không chạy lại, không trừ credit
  const hash = hashOf(inputs, node.data.params);
  if (node.data.run.status === 'done' && node.data.run.inputHash === hash) return true;

  const job: Job = {
    id: nextId('job'),
    nodeId,
    nodeTitle: def.title,
    status: 'queued',
    createdAt: Date.now(),
    creditCost: def.creditCost,
  };
  store.addJob(job);
  store.setRunState(nodeId, { status: 'queued', progress: 0, error: undefined });

  // Trừ credits — server-side ledger nếu đã đăng nhập, local nếu chưa
  if (def.creditCost > 0) {
    if (useFlowStore.getState().user) {
      try {
        const res = await fetch('/api/credits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'spend', amount: def.creditCost, reason: def.title, jobRef: job.id }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = body.error ?? 'Hết credits.';
          store.setRunState(nodeId, { status: 'error', error: msg });
          store.updateJob(job.id, { status: 'error', finishedAt: Date.now(), error: msg });
          return false;
        }
        store.setCredits(body.credits);
      } catch {
        store.setRunState(nodeId, { status: 'error', error: 'Mất kết nối server credits.' });
        store.updateJob(job.id, { status: 'error', finishedAt: Date.now(), error: 'Mất kết nối.' });
        return false;
      }
    } else {
      if (useFlowStore.getState().credits < def.creditCost) {
        store.setRunState(nodeId, { status: 'error', error: 'Hết credits.' });
        store.updateJob(job.id, { status: 'error', finishedAt: Date.now(), error: 'Hết credits.' });
        return false;
      }
      store.spendCredits(def.creditCost);
    }
  }

  try {
    store.updateJob(job.id, { status: 'running' });
    store.setRunState(nodeId, { status: 'running', progress: 0 });
    const outputs = await def.execute({
      nodeId,
      inputs,
      params: node.data.params,
      onProgress: (p) => store.setRunState(nodeId, { progress: p }),
      aiTier: useFlowStore.getState().aiTier,
      oneAiEngine: useFlowStore.getState().oneAiEngine,
      oneAiRuntime: useFlowStore.getState().oneAiRuntime,
    });
    store.setRunState(nodeId, { status: 'done', progress: 1, outputs, inputHash: hash });
    store.updateJob(job.id, { status: 'done', finishedAt: Date.now() });
    return true;
  } catch (err) {
    const message = friendlyAiError(err instanceof Error ? err.message : String(err));
    store.setRunState(nodeId, { status: 'error', error: message });
    store.updateJob(job.id, { status: 'error', finishedAt: Date.now(), error: message });
    // Hoàn credit khi job lỗi
    if (def.creditCost > 0) {
      if (useFlowStore.getState().user) {
        fetch('/api/credits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'refund', amount: def.creditCost, reason: `Hoàn: ${def.title} lỗi`, jobRef: job.id }),
        })
          .then((r) => r.json())
          .then((b) => typeof b.credits === 'number' && store.setCredits(b.credits))
          .catch(() => {});
      } else {
        useFlowStore.setState((s) => ({ credits: s.credits + def.creditCost }));
      }
    }
    return false;
  }
}

declare global {
  interface Window {
    __ifReadOnly?: boolean;
  }
}
const isReadOnly = () => typeof window !== 'undefined' && window.__ifReadOnly === true;

/** Nút ▶ trên node: chạy node + toàn bộ upstream. */
export async function runNode(nodeId: string) {
  if (isReadOnly()) return;
  const { nodes, edges } = useFlowStore.getState();
  let order: string[];
  try {
    order = upstreamOrder(nodeId, nodes, edges);
  } catch (err) {
    useFlowStore.getState().setConnectError(err instanceof Error ? err.message : String(err));
    return;
  }
  for (const id of order) {
    const ok = await execNode(id);
    if (!ok) break; // upstream lỗi thì dừng chuỗi
  }
}

/** "Run flow": topo-sort toàn graph + snapshot version lên server. */
export async function runFlow() {
  if (isReadOnly()) return;
  const store = useFlowStore.getState();
  if (store.isRunningFlow) return;
  store.setRunningFlow(true);
  // snapshot version trước khi chạy — giữ lịch sử _v(n) không ghi đè
  import('@/lib/workspace').then((w) => w.snapshotFlow()).catch(() => {});
  try {
    const order = fullOrder(store.nodes, store.edges);
    const failed = new Set<string>();
    for (const id of order) {
      const { edges } = useFlowStore.getState();
      const blockedByUpstream = edges.some((e) => e.target === id && failed.has(e.source));
      if (blockedByUpstream) {
        failed.add(id);
        continue;
      }
      const ok = await execNode(id);
      if (!ok) failed.add(id);
    }
  } catch (err) {
    store.setConnectError(err instanceof Error ? err.message : String(err));
  } finally {
    useFlowStore.getState().setRunningFlow(false);
  }
}
