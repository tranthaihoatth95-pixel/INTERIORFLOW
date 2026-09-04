'use client';

/**
 * lib/project-scope.ts — CẦU NỐI "URL → store" cho scope dự án (Task #21 · ĐỔ NỀN 1B).
 *
 * NGUYÊN TẮC (user chốt): **URL là nguồn sự thật, store chỉ là cache.** Mọi trang chặng
 * nằm dưới `/projects/[id]/(cad|render|present|photo)` phải đọc `[id]` từ URL TRƯỚC, rồi
 * ÉP store đồng bộ theo id đó. Nếu store đang giữ flow của dự án khác → nạp lại đúng flow
 * của `[id]`; không tìm được flow nào thuộc `[id]` → DỌN canvas (tuyệt đối không để graph
 * dự án A hiện dưới URL dự án B).
 *
 * Phần thuần (parse/resolve) nằm ở `lib/scope-core.ts` để test bằng sucrase-node.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFlowStore } from '@/lib/store';
import { fetchFlows, openFlow } from '@/lib/workspace';
import { getLastUserId, loadResume } from '@/lib/resume';
import {
  LEGACY_STAGE_ROUTE,
  parseScope,
  pickStableRouteId,
  resolveFlowForRouteId,
  stageRoutePath,
  storeMatchesRouteId,
  type StageSegment,
} from '@/lib/scope-core';

export type ScopeSyncStatus = 'idle' | 'syncing' | 'ready' | 'missing' | 'error';

/**
 * M-SCOPE VIỆC 5 (07/08) — `[id]` trong URL nhận CẢ Flow.id lẫn Project.id (`resolveFlowForRouteId`
 * ở trên cố ý khớp cả hai). Khi status='missing', UI KHÔNG được hiện màn trắng im lặng — phải NÓI
 * RÕ đây là dự án THẬT chưa có bản vẽ nào (còn sửa được tại chỗ) hay id không khớp gì cả (đường
 * dẫn hỏng/đã xoá — sửa tại chỗ vô nghĩa, phải điều hướng đi nơi khác).
 */
export interface ScopeMissingInfo {
  kind: 'empty-project' | 'unknown';
  projectName?: string;
}

export async function describeMissingScope(routeId: string): Promise<ScopeMissingInfo> {
  try {
    const { projects } = await fetchFlows();
    const p = projects.find((pr) => pr.id === routeId);
    return p ? { kind: 'empty-project', projectName: p.name } : { kind: 'unknown' };
  } catch {
    return { kind: 'unknown' };
  }
}

/**
 * "Dự án đang hoạt động" để REDIRECT từ route toàn cục cũ (`/cad-editor`…).
 * Thứ tự: store (điều hướng trong phiên) → resume-state theo user gần nhất
 * (mở lại tab/bookmark). Null = user mới/chưa mở dự án nào → giữ hành vi cũ.
 */
export function activeProjectRouteId(): string | null {
  const s = useFlowStore.getState();
  const fromStore = pickStableRouteId(s.currentProjectId, s.currentFlowId, '');
  if (fromStore) return fromStore;
  const uid = getLastUserId();
  const resumed = uid ? loadResume(uid) : null;
  return resumed?.flowId ?? null;
}

/**
 * Đường dẫn ĐI TỚI một chặng, tính từ chỗ đang đứng. Ưu tiên `[id]` của URL hiện tại
 * (nguồn sự thật — chuyển chặng trong CÙNG dự án không bao giờ nhảy dự án khác), rồi tới
 * dự án đang hoạt động trong store/resume. Không xác định được → route toàn cục CŨ (hành
 * vi cũ, không kẹt).
 */
export function stageHrefFrom(pathname: string | null | undefined, stage: StageSegment): string {
  const id = parseScope(pathname).projectId || activeProjectRouteId();
  return id ? stageRoutePath(id, stage) : LEGACY_STAGE_ROUTE[stage];
}

/**
 * ÉP store khớp `routeId` của URL. Idempotent — khớp sẵn thì trả 'ready' ngay,
 * không tốn request.
 */
export async function ensureProjectScope(routeId: string): Promise<ScopeSyncStatus> {
  if (!routeId) return 'missing';
  const s = useFlowStore.getState();
  // ⚠️ ĐƯỜNG TẮT PHẢI ĐÒI CÓ FLOW THẬT (sửa 04/09, lỗi chặn D-J04b).
  // Nhánh 'missing' bên dưới tự đặt `currentProjectId = routeId` để dọn canvas ⇒ chỉ hỏi
  // `storeMatchesRouteId` thôi thì trạng thái RỖNG cũng "khớp", và lượt đồng bộ kế tiếp sẽ
  // trả 'ready' cho một dự án KHÔNG có bản vẽ nào — canvas trắng, đúng thứ màn rỗng sinh ra
  // để chặn. Đường tắt chỉ đúng khi store đang GIỮ một flow.
  if (s.currentFlowId && storeMatchesRouteId(routeId, s.currentProjectId, s.currentFlowId)) return 'ready';

  try {
    const { flows } = await fetchFlows();
    const targetFlowId = resolveFlowForRouteId(
      routeId,
      flows.map((f) => ({ id: f.id, projectId: f.project?.id ?? null })),
    );
    if (targetFlowId) {
      // openFlow() tự thread `projectId` của flow vào store (lib/workspace.ts). Flow chưa
      // gán Project mà URL mang chính flowId → currentProjectId=null, `storeMatchesRouteId`
      // vẫn khớp qua currentFlowId nên không lặp vòng đồng bộ.
      await openFlow(targetFlowId);
      return 'ready';
    }
    // Dự án chưa có flow nào (hoặc id lạ) → DỌN canvas để không rò dữ liệu chéo.
    useFlowStore.setState({
      nodes: [],
      edges: [],
      groups: [],
      past: [],
      future: [],
      flowName: 'Untitled flow',
      currentFlowId: null,
      currentProjectId: routeId,
      shareToken: null,
    });
    return 'missing';
  } catch {
    return 'error';
  }
}

/**
 * Hook dùng ở mọi trang `/projects/[id]/<stage>`: chạy `ensureProjectScope` lúc mount
 * và mỗi khi `[id]` đổi. `stage` chỉ để ghi chặng vào store (header/theme chặng đúng
 * ngay từ khung hình đầu).
 */
export function useProjectScopeSync(routeId: string, stage?: StageSegment): ScopeSyncStatus {
  const [status, setStatus] = useState<ScopeSyncStatus>('idle');
  const router = useRouter();
  // GỐC của lỗi chặn D-J04b (04/09): `status` trước đây chỉ tính lại khi `[id]` trên URL đổi.
  // Màn "dự án chưa có bản vẽ" tạo bản vẽ xong thì URL KHÔNG đổi (nó đang đứng đúng ở đó),
  // nên hook không chạy lại, `status` kẹt ở 'missing', màn rỗng không bao giờ nhường chỗ cho
  // chặng thật ⇒ người dùng đọc ra là app treo dù máy chủ đã ghi xong.
  // Sửa Ở GỐC: coi "flow đang mở" là một ĐẦU VÀO của phép đồng bộ. Ai mở/đổi flow (màn rỗng ·
  // FlowsPanel · lệnh khác) thì scope tự tính lại — không nơi nào phải nhớ gọi hàm làm mới.
  // Không có vòng lặp: nhánh 'missing' đặt `currentFlowId = null` (vốn đã null ở ca đó) nên
  // giá trị chọn không đổi ⇒ hook không tự kích lại chính nó.
  const currentFlowId = useFlowStore((s) => s.currentFlowId);

  useEffect(() => {
    if (!routeId) return;
    let alive = true;
    setStatus('syncing');
    if (stage && stage !== 'photo') {
      useFlowStore.getState().setWorkspace(stage === 'cad' ? 'concept' : stage);
    }
    void ensureProjectScope(routeId).then((r) => {
      if (!alive) return;
      setStatus(r);
      // CHUẨN HOÁ URL: vào bằng Flow.id (vd cầu redirect từ route cũ đọc resume-state) mà
      // flow ĐÃ thuộc một Project → thay bằng Project.id thật. `replace` + so sánh id nên
      // không có vòng lặp: lượt sau routeId đã khớp.
      const pid = useFlowStore.getState().currentProjectId;
      if (r === 'ready' && stage && pid && pid !== routeId) {
        router.replace(stageRoutePath(pid, stage));
      }
    });
    return () => {
      alive = false;
    };
  }, [routeId, stage, router, currentFlowId]);

  return status;
}

/**
 * M-SCOPE VIỆC 5 — dùng CẠNH `useProjectScopeSync`. Chỉ fetch khi `status==='missing'` (không
 * tốn request ở đường 'ready' bình thường, vốn chiếm tuyệt đại đa số lượt vào trang).
 * Trả `null` khi chưa cần hỏi (status khác 'missing') hoặc đang chờ trả lời.
 */
export function useScopeMissingInfo(routeId: string, status: ScopeSyncStatus): ScopeMissingInfo | null {
  const [info, setInfo] = useState<ScopeMissingInfo | null>(null);

  useEffect(() => {
    if (status !== 'missing' || !routeId) {
      setInfo(null);
      return;
    }
    let alive = true;
    void describeMissingScope(routeId).then((r) => {
      if (alive) setInfo(r);
    });
    return () => {
      alive = false;
    };
  }, [routeId, status]);

  return info;
}
