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
  if (storeMatchesRouteId(routeId, s.currentProjectId, s.currentFlowId)) return 'ready';

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
  }, [routeId, stage, router]);

  return status;
}
