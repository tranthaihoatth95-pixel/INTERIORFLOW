'use client';

/**
 * /projects/[id]/photo — công cụ "Chỉnh ảnh" (con của chặng Rendering) trong SCOPE DỰ ÁN
 * (Task #21 · ĐỔ NỀN 1B).
 *
 * Nội dung = `PhotoEditorScreen` (đúng component route cũ `/photo-editor` dùng, tách ra
 * dùng chung). Lớp scope: `[id]` từ URL là nguồn sự thật; `useProjectScopeSync` ép store
 * về đúng dự án đó để StudioBar/Chat/Comment gắn đúng dự án.
 */

import { useParams } from 'next/navigation';
import PhotoEditorScreen from '@/components/photo-editor/PhotoEditorScreen';
import { useProjectScopeSync } from '@/lib/project-scope';

export default function ProjectPhotoPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  useProjectScopeSync(id, 'photo');
  return <PhotoEditorScreen />;
}
