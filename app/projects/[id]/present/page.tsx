'use client';

/**
 * /projects/[id]/present — CHẶNG 3 "Presenting" trong SCOPE DỰ ÁN (Task #21 · ĐỔ NỀN 1B).
 *
 * Nội dung y hệt route cũ `/present-editor` (cùng component `PresentStageScreen`); chỉ thêm
 * lớp scope: `[id]` từ URL là nguồn sự thật, `useProjectScopeSync` ép store về đúng dự án đó.
 * `/present-editor` giữ nguyên làm REDIRECT.
 */

import { useParams } from 'next/navigation';
import PresentStageScreen from '@/components/present-editor/PresentStageScreen';
import { useProjectScopeSync } from '@/lib/project-scope';

export default function ProjectPresentPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  useProjectScopeSync(id, 'present');
  return <PresentStageScreen />;
}
