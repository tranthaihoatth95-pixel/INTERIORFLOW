'use client';

import type { Edge } from '@xyflow/react';
import type { Job, PortValue } from '@/lib/types';
import { getDefinition } from '@/lib/nodes/registry';
import { useFlowStore, nextId, type FlowNode } from '@/lib/store';
import { AiJobError } from '@/lib/ai/client';

function isFlowNode(n: FlowNode) {
  return n.type === 'interior';
}

/**
 * Dịch lỗi backend AI thô ("fetch failed", 502 workflow...) sang thông báo rõ + hướng xử lý,
 * để node không hiện chuỗi kỹ thuật khó hiểu cho người dùng.
 */
export function friendlyAiError(raw: string): string {
  const m = (raw || '').toLowerCase();
  // 20/08 — PHẢI đứng TRƯỚC nhánh "không kết nối được" bên dưới: thông báo timeout của chính
  // `runImageJob()` (lib/ai/client.ts, "Timeout N phút — job chưa xong…") tự nó CHỨA chữ
  // "timeout", nên trước đây rơi thẳng vào nhánh mạng/kết nối và biến thành "Backend AI chưa
  // chạy" — SAI: job vẫn đang chạy thật ở ComfyUI (đo được: một lượt tự-host nguội mất 25 phút
  // vẫn chạy xong và ra ảnh thật SAU KHI client đã bỏ cuộc), không phải backend chết. Hai tình
  // huống khác hẳn nhau, cần hai lời khuyên khác nhau — người dùng đọc "chưa chạy" sẽ đi tắt/bật
  // lại ComfyUI giữa chừng, huỷ mất job đang tính gần xong.
  if (/^timeout \d+ phút/.test(m))
    return 'Việc dựng ảnh đang chạy lâu hơn dự kiến (máy tự-host không có GPU rời thường mất nhiều phút cho lượt đầu). Job VẪN ĐANG CHẠY ở ComfyUI — đừng tắt, thử lại sau vài phút để xem đã xong chưa.';
  if (/fetch failed|econnrefused|failed to fetch|network|connect|timed out|socket/.test(m))
    return 'Backend AI chưa chạy / không kết nối được. Bật ComfyUI (cổng 8188) rồi thử lại, hoặc đổi Mức AI ở góc phải header.';
  if (/text2img|workflow|not found.*json|\.json/.test(m))
    return 'Engine tự-host (ComfyUI) chưa có workflow cho tác vụ này. Dùng mức AI khác, hoặc bổ sung workflow tương ứng.';
  if (/missing_node_type|custom node may not be installed/.test(m))
    return 'Server ComfyUI tự-host thiếu custom node cần cho tác vụ này (chưa cài đủ). Cài custom node còn thiếu trên máy chạy ComfyUI, hoặc đổi sang mức AI khác ở header.';
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

  const isLoggedIn = Boolean(useFlowStore.getState().user);
  // Trừ credits — CHỈ khi CHƯA đăng nhập (ví local, client tự giữ sổ). Đăng nhập rồi thì KHÔNG
  // tự trừ ở đây nữa: `/api/jobs` (gọi bên trong `def.execute()` qua `runImageJob`) nay TỰ
  // spend/refund credit nguyên tử tại server (vá `docs/AUDIT-BACKEND-2026-08-03.md` §5.2/R2 —
  // trước route đó không đụng credit, kế toán chỉ ở client, curl thẳng bypass được). Trừ ở CẢ
  // hai nơi sẽ tính tiền 2 LẦN cho cùng 1 lượt chạy — bỏ hẳn nhánh trừ phía client khi đăng nhập.
  if (def.creditCost > 0 && !isLoggedIn) {
    if (useFlowStore.getState().credits < def.creditCost) {
      store.setRunState(nodeId, { status: 'error', error: 'Hết credits.' });
      store.updateJob(job.id, { status: 'error', finishedAt: Date.now(), error: 'Hết credits.' });
      return false;
    }
    store.spendCredits(def.creditCost);
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
    if (def.creditCost > 0 && isLoggedIn) void refreshServerCredits();
    return true;
  } catch (err) {
    // 402 từ /api/jobs (server hết credit) — thông báo trực tiếp, KHÔNG qua friendlyAiError:
    // message chứa chữ "credit" sẽ bị nhánh fal.ai (regex) nuốt mất, hiện nhầm "nạp credit tại
    // fal.ai/dashboard/billing" — sai hoàn toàn (đây là credit NỘI BỘ app, không phải fal.ai).
    const insufficientCredits = err instanceof AiJobError && err.code === 'INSUFFICIENT_CREDITS';
    const message = insufficientCredits
      ? 'Hết credits — liên hệ admin nạp thêm.'
      : friendlyAiError(err instanceof Error ? err.message : String(err));
    store.setRunState(nodeId, { status: 'error', error: message });
    store.updateJob(job.id, { status: 'error', finishedAt: Date.now(), error: message });
    // Hoàn credit khi job lỗi — LOCAL: cộng lại ngay (đã tự trừ ở trên). ĐĂNG NHẬP: `/api/jobs`
    // đã tự hoàn atomically bên trong route (xem catch của `submitJob` ở đó) — không tự cộng lại
    // ở đây nữa (tránh cộng 2 lần), chỉ làm mới số hiển thị cho khớp server.
    if (def.creditCost > 0) {
      if (isLoggedIn) void refreshServerCredits();
      else useFlowStore.setState((s) => ({ credits: s.credits + def.creditCost }));
    }
    return false;
  }
}

/** Làm mới số dư hiển thị từ server sau khi 1 lượt chạy AI kết thúc (thành công hay lỗi) — server
 * (`/api/jobs`, `/api/credits`) đã là nguồn sự thật DUY NHẤT cho việc trừ/hoàn khi đã đăng nhập;
 * hàm này CHỈ đọc lại số, không tự trừ/cộng gì (tránh lệch sổ 2 nguồn). Lỗi mạng thì im lặng bỏ
 * qua — không chặn kết quả job chỉ vì không refresh được số hiển thị. */
async function refreshServerCredits(): Promise<void> {
  try {
    const res = await fetch('/api/credits');
    const body = await res.json().catch(() => ({}));
    if (res.ok && typeof body.credits === 'number') useFlowStore.getState().setCredits(body.credits);
  } catch {
    // im lặng — chỉ là làm mới hiển thị
  }
}

declare global {
  interface Window {
    __ifReadOnly?: boolean;
  }
}
export const isReadOnly = () => typeof window !== 'undefined' && window.__ifReadOnly === true;

/**
 * 2.2.86 (30/07, Hoà chốt — bỏ pill nổi trên canvas, thay bằng hàng đợi trong menu "Việc") —
 * TÁCH khởi chạy khỏi theo dõi: mọi lượt chạy (▶ trên node, "Kết xuất" thẻ Tool Mode, "Run flow"
 * ở Command Palette) đều tạo 1 `FlowRun` (lib/types.ts) và đi qua HÀNG ĐỢI DUY NHẤT dưới đây —
 * tuần tự tuyệt đối, 1 lượt một lúc. Bấm khi đang bận KHÔNG bị từ chối (khác code cũ: `if
 * (store.isRunningFlow) return` im lặng) — xếp hàng, "Việc" tự hiện "đứng thứ N".
 *
 * `execNode()` GIỮ NGUYÊN 100%, không đụng — hàm dưới đây chỉ ĐIỀU PHỐI bên ngoài nó (khi nào
 * gọi, gọi node nào tiếp theo, dừng ở đâu khi lỗi/huỷ), đúng yêu cầu "đã có, đừng làm lại".
 */
let draining = false;

async function drainQueue() {
  if (draining) return; // đã có 1 vòng rút hàng đợi đang chạy — không mở vòng thứ 2 chồng lên.
  draining = true;
  try {
    for (;;) {
      const next = useFlowStore.getState().flowRuns.find((r) => r.status === 'queued');
      if (!next) break;
      await executeRun(next.id);
    }
  } finally {
    draining = false;
  }
}

async function executeRun(runId: string) {
  const store = useFlowStore.getState();
  const run = store.flowRuns.find((r) => r.id === runId);
  if (!run) return;
  store.updateFlowRun(runId, { status: 'running', startedAt: Date.now() });
  // ④ đổi cò (01/08, docs/QUYET-DINH-HA-TANG-2026-07-31.md §④ phương án C) — KHÔNG còn tự động
  // snapshot FlowVersion mỗi lượt chạy ở đây. Ghi bản chỉ xảy ra khi người dùng bấm "Đánh dấu bản
  // này" (lib/workspace.ts snapshotFlow(), gọi từ CommandPalette.tsx) — xem lý do ở đó.
  const failed = new Set<string>();
  try {
    for (let i = 0; i < run.nodeIds.length; i++) {
      const fresh = useFlowStore.getState().flowRuns.find((r) => r.id === runId);
      if (!fresh || fresh.cancelRequested) {
        store.updateFlowRun(runId, { status: 'cancelled', finishedAt: Date.now() });
        return;
      }
      store.updateFlowRun(runId, { currentIndex: i });
      const id = run.nodeIds[i];
      if (run.stopOnFirstFailure) {
        // Đúng hành vi cũ runNode(): 1 node lỗi thì dừng CẢ chuỗi ngay (upstream lỗi → hạ nguồn vô nghĩa).
        const ok = await execNode(id);
        if (!ok) {
          store.updateFlowRun(runId, { status: 'error', finishedAt: Date.now(), currentIndex: i });
          return;
        }
      } else {
        // Đúng hành vi cũ runFlow(): bỏ qua NHÁNH bị chặn bởi node lỗi, chạy tiếp nhánh khác.
        const { edges } = useFlowStore.getState();
        const blockedByUpstream = edges.some((e) => e.target === id && failed.has(e.source));
        if (blockedByUpstream) {
          failed.add(id);
          continue;
        }
        const ok = await execNode(id);
        if (!ok) failed.add(id);
      }
    }
  } catch (err) {
    store.setConnectError(err instanceof Error ? err.message : String(err));
    store.updateFlowRun(runId, { status: 'error', finishedAt: Date.now() });
    return;
  }
  store.updateFlowRun(runId, {
    status: failed.size > 0 ? 'error' : 'done',
    finishedAt: Date.now(),
    currentIndex: run.nodeIds.length,
  });
}

/**
 * Ước tính credit của 1 lượt chạy TRƯỚC khi chạy (2.2.86, "nói giá trước khi tiêu tiền") — tổng
 * `creditCost` các node CHƯA `done` (node đã `done` sẽ bị `execNode()` cache-skip qua inputHash,
 * xem execNode() ở trên — không tính tiền node sẽ bị bỏ qua). Xấp xỉ có chủ đích: hash THẬT chỉ
 * biết được lúc chạy (phụ thuộc input từ node upstream chạy trước đó trong CÙNG lượt) — dùng
 * trạng thái `done` hiện tại làm tín hiệu đủ tốt cho số hiển thị TRƯỚC khi chạy.
 */
export function estimateRunCredit(nodeIds: string[]): number {
  const { nodes } = useFlowStore.getState();
  let total = 0;
  for (const id of nodeIds) {
    const node = nodes.find((n) => n.id === id);
    if (!node || node.data.run.status === 'done') continue;
    const def = getDefinition(node.data.defType);
    if (def) total += def.creditCost;
  }
  return total;
}

function enqueueRun(
  label: string,
  nodeIds: string[],
  opts: { stopOnFirstFailure: boolean },
): string {
  const runId = useFlowStore.getState().enqueueFlowRun({ label, nodeIds, ...opts });
  void drainQueue();
  return runId;
}

/** Nút ▶ trên node / "Kết xuất" thẻ Tool Mode: xếp hàng node + toàn bộ upstream. */
export async function runNode(nodeId: string): Promise<string | null> {
  if (isReadOnly()) return null;
  const { nodes, edges } = useFlowStore.getState();
  let order: string[];
  try {
    order = upstreamOrder(nodeId, nodes, edges);
  } catch (err) {
    useFlowStore.getState().setConnectError(err instanceof Error ? err.message : String(err));
    return null;
  }
  const def = getDefinition(nodes.find((n) => n.id === nodeId)?.data.defType ?? '');
  return enqueueRun(def?.title ?? 'Node', order, { stopOnFirstFailure: true });
}

/** "Run flow": xếp hàng toàn graph. Trước im lặng từ chối khi đang bận — nay LUÔN xếp hàng,
 * không bao giờ từ chối, chỉ khác nhau ở CHẠY NGAY (hàng đợi rỗng) hay ĐỢI (đang có lượt khác). */
export async function runFlow(): Promise<string | null> {
  if (isReadOnly()) return null;
  const store = useFlowStore.getState();
  const order = fullOrder(store.nodes, store.edges);
  return enqueueRun(store.flowName || 'Flow', order, { stopOnFirstFailure: false });
}
