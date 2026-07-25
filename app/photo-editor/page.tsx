'use client';

/**
 * app/photo-editor/page.tsx — ROUTE CŨ của công cụ "Chỉnh ảnh", nay là REDIRECT
 * (Task #21 · ĐỔ NỀN 1B).
 *
 * Công cụ đã dời xuống `/projects/[id]/photo` (URL = nguồn sự thật). Route này GIỮ LẠI vì
 * `window.open('/photo-editor', '_blank')` trong PresentEditor (nút "Chỉnh ảnh nâng cao")
 * và bookmark cũ vẫn dùng: đọc dự án đang hoạt động rồi `replace` sang route scope.
 *
 * Handoff ảnh từ Present KHÔNG bị ảnh hưởng: `lib/photo-editor/handoff.ts` stash vào
 * sessionStorage (sống qua điều hướng client-side trong CÙNG tab) và chỉ được consume bởi
 * `PhotoEditorScreen` — mount ở route đích. Không xác định được dự án nào → render thẳng
 * màn cũ tại chỗ, handoff vẫn chạy y như trước.
 */

import PhotoEditorScreen from '@/components/photo-editor/PhotoEditorScreen';
import LegacyStageRedirect from '@/components/studio/LegacyStageRedirect';

export default function PhotoEditorPage() {
  return <LegacyStageRedirect stage="photo" fallback={<PhotoEditorScreen />} />;
}
