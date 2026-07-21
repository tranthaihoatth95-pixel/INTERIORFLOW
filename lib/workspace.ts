'use client';

import { useFlowStore } from '@/lib/store';

export interface FlowMeta {
  id: string;
  name: string;
  version: number;
  updatedAt: string;
  shareToken: string | null;
  project: { id: string; name: string; larkProjectCode?: string | null } | null;
}
export interface ProjectMeta {
  id: string;
  name: string;
  clientName: string | null;
  larkProjectCode?: string | null;
}

export async function fetchFlows(): Promise<{ flows: FlowMeta[]; projects: ProjectMeta[] }> {
  const res = await fetch('/api/flows');
  if (!res.ok) throw new Error('Không tải được danh sách flow.');
  return res.json();
}

export async function openFlow(id: string) {
  const res = await fetch(`/api/flows/${id}`);
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? 'Không mở được flow.');
  useFlowStore.getState().loadGraph(body.flow.graphJson, body.flow.name, body.flow.id, body.flow.shareToken);
}

export async function createFlow(name: string, graphJson?: string): Promise<string> {
  const res = await fetch('/api/flows', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, graphJson }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? 'Không tạo được flow.');
  return body.flow.id;
}

/** larkProjectCode: bước tuỳ chọn "Liên kết Larkbase" (docs/RESEARCH-HOME-GALLERY-DASHBOARD.md §2.4). */
export async function createProject(name: string, larkProjectCode?: string | null): Promise<{ id: string } | null> {
  const res = await fetch('/api/flows', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'project', name, larkProjectCode: larkProjectCode ?? undefined }),
  });
  const body = await res.json().catch(() => null);
  return body?.project?.id ? { id: body.project.id as string } : null;
}

export async function deleteFlow(id: string): Promise<void> {
  await fetch(`/api/flows/${id}`, { method: 'DELETE' });
}

export async function assignProject(flowId: string, projectId: string | null): Promise<void> {
  await fetch(`/api/flows/${flowId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId }),
  });
}

/** Snapshot version khi Run flow. */
export async function snapshotFlow(): Promise<void> {
  const { currentFlowId, user } = useFlowStore.getState();
  if (!currentFlowId || !user) return;
  await fetch(`/api/flows/${currentFlowId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'snapshot' }),
  }).catch(() => {});
}

export async function toggleShare(): Promise<string | null> {
  const { currentFlowId, shareToken, setShareToken } = useFlowStore.getState();
  if (!currentFlowId) return null;
  const res = await fetch(`/api/flows/${currentFlowId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: shareToken ? 'unshare' : 'share' }),
  });
  const body = await res.json();
  setShareToken(body.shareToken ?? null);
  return body.shareToken ?? null;
}

/**
 * Canvas hiện tại (hydrate từ localStorage) có thuộc về user này không?
 * Bản lưu đóng dấu `owner` (persistNow): 'anon' = việc làm lúc chưa đăng nhập —
 * ĐƯỢC mang theo vào tài khoản đầu tiên; id user khác → KHÔNG bê sang (rò dữ liệu
 * giữa 2 tài khoản trên cùng máy). Bản lưu cũ chưa có owner → coi như anon.
 */
function localFlowBelongsTo(userId: string): boolean {
  try {
    const raw = localStorage.getItem('interiorflow.flow.v1');
    if (!raw) return true; // không có bản lưu — canvas là của phiên này
    const owner = (JSON.parse(raw) as { owner?: string }).owner ?? 'anon';
    return owner === 'anon' || owner === userId;
  } catch {
    return true;
  }
}

/**
 * Sau đăng nhập: tải flow gần nhất; nếu chưa có flow nào thì đẩy flow đang có
 * trên máy (localStorage/canvas) lên server làm flow đầu tiên — TRỪ khi bản lưu
 * local thuộc về user khác (tài khoản mới nhận canvas sạch).
 */
export async function bootstrapWorkspace() {
  const store = useFlowStore.getState();
  try {
    const { flows } = await fetchFlows();
    if (flows.length > 0) {
      await openFlow(flows[0].id);
      return;
    }
    const { nodes, edges, flowName, user } = useFlowStore.getState();
    const carryOver = !user || localFlowBelongsTo(user.id);
    if (!carryOver) useFlowStore.setState({ nodes: [], edges: [], flowName: 'Untitled flow' });
    const id = await createFlow(
      carryOver ? flowName || 'Untitled flow' : 'Untitled flow',
      JSON.stringify(carryOver ? { nodes, edges } : { nodes: [], edges: [] }),
    );
    store.setCurrentFlowId(id);
  } catch {
    store.setConnectError('Không kết nối được workspace — flow đang lưu tạm trên máy.');
  }
}
