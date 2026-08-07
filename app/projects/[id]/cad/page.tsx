'use client';

/**
 * /projects/[id]/cad — CHẶNG 1 "Drafting CAD" trong SCOPE DỰ ÁN (Task #21 · ĐỔ NỀN 1B).
 *
 * Nội dung y hệt route cũ `/cad-editor` (cùng component `CadStageScreen`) — chỉ KHÁC lớp
 * routing bao quanh: `[id]` trên URL là NGUỒN SỰ THẬT, `useProjectScopeSync` ép store nạp
 * đúng flow của dự án đó khi mount (store đang giữ dự án khác → nạp lại, không lẫn dữ liệu).
 *
 * `/cad-editor` giữ nguyên làm REDIRECT (không phá bookmark cũ).
 */

import { useParams } from 'next/navigation';
import CadStageScreen from '@/components/studio/CadStageScreen';
import { useProjectScopeSync, useScopeMissingInfo } from '@/lib/project-scope';
import { ProjectScopeEmptyState } from '@/components/studio/ProjectScopeEmptyState';

export default function ProjectCadPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const status = useProjectScopeSync(id, 'cad');
  const missingInfo = useScopeMissingInfo(id, status);
  if (status === 'missing' && missingInfo) {
    return <ProjectScopeEmptyState routeId={id} stage="cad" info={missingInfo} />;
  }
  return <CadStageScreen />;
}
