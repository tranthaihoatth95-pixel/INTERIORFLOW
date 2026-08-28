'use client';

import { useFlowStore } from '@/lib/store';
import { isReadOnly } from '@/lib/execution';

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
  // SCOPE (Task #18): thread `projectId` của flow vào store để các chặng biết mình
  // thuộc dự án nào (nguồn sự thật scope 'project'). Flow row luôn có field projectId
  // (nullable) — xem GET /api/flows/[id].
  useFlowStore
    .getState()
    .loadGraph(
      body.flow.graphJson,
      body.flow.name,
      body.flow.id,
      body.flow.shareToken,
      body.flow.projectId ?? null,
      // H11 (19/08) — rev flow đang cầm; persistNow gửi lại đúng số này làm expectedRev.
      typeof body.flow.rev === 'number' ? body.flow.rev : undefined,
    );
}

/**
 * G-M14-01 (07/08, p12) — GỐC của 40 flow mồ côi: hàm này TRƯỚC ĐÂY không có tham số `projectId`
 * dù POST /api/flows đã đọc `body.projectId` + kiểm quyền đầy đủ từ lâu (route.ts:88-99) — nghĩa
 * là server chờ sẵn mà client không có cách nào truyền. 5 điểm gọi (đo ở `docs/M-SCOPE-OUT.md`
 * VIỆC 1) đều tạo flow trần. Thêm `projectId?` (optional — caller cũ gọi 2 tham số chạy y nguyên),
 * để các luồng tạo "dự án" thật sự gắn flow vào Project ngay lúc sinh, khỏi cần `assignProject`
 * vá sau. 4 điểm gọi ở `components/` thuộc phiên khác (p3) — phiếu riêng sẽ truyền tham số này.
 */
export async function createFlow(name: string, graphJson?: string, projectId?: string | null): Promise<string> {
  const res = await fetch('/api/flows', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, graphJson, projectId: projectId ?? undefined }),
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

/**
 * Ghi 1 `FlowVersion` mới — CHỈ gọi khi người dùng chủ động bấm "Đánh dấu bản này"
 * (CommandPalette.tsx). ④ đổi cò, 01/08, docs/QUYET-DINH-HA-TANG-2026-07-31.md §④ phương án C:
 * trước đây gọi tự động ở MỌI lượt "Chạy flow" (lib/execution.ts) — chụp mọi lượt, không tỉa,
 * không ai đọc, phình `dev.db`. Giờ ghi ít hơn NHƯNG có chủ đích hơn (cờ đánh dấu tay), kèm thang
 * lưu giữ phía server (xem app/api/flows/[id]/route.ts action=snapshot).
 */
export async function snapshotFlow(): Promise<void> {
  if (isReadOnly()) return;
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
    // 28/08 · F-NHAN-BIA — không đúc tên giả; rỗng nghĩa là chưa đặt tên.
    const firstName = carryOver ? flowName || '' : '';
    // G-M14-01 (07/08, p12) — bootstrapWorkspace là 1 trong 5 điểm tạo flow TRẦN sinh ra flow mồ
    // côi (M-SCOPE-OUT VIỆC 1 mục 2): tài khoản mới đăng nhập lần đầu nhận ngay 1 flow không
    // thuộc Project nào. Nay tạo Project bọc ngoài TRƯỚC rồi gắn flow đầu tiên vào — tài khoản
    // mới không còn đẻ mồ côi. Project tạo thất bại (mạng/API) thì vẫn tạo flow trần như cũ —
    // onboarding không được chết vì thiếu vỏ Project (flow đó gán tay lại được qua FlowsPanel).
    const project = await createProject(firstName).catch(() => null);
    const id = await createFlow(
      firstName,
      JSON.stringify(carryOver ? { nodes, edges } : { nodes: [], edges: [] }),
      project?.id ?? null,
    );
    store.setCurrentFlowId(id);
  } catch {
    store.setConnectError('Không kết nối được workspace — flow đang lưu tạm trên máy.');
  }
}
