'use client';

/**
 * app/present-editor/page.tsx — ROUTE CŨ của chặng 3 "Presenting", nay là REDIRECT
 * (Task #21 · ĐỔ NỀN 1B).
 *
 * Chặng đã dời xuống `/projects/[id]/present` (URL = nguồn sự thật). Route này GIỮ LẠI để
 * không phá bookmark / link cũ / resume-state cũ: đọc dự án đang hoạt động (store →
 * resume-state) rồi `replace` sang `/projects/[id]/present`. Chưa có dự án nào → render thẳng
 * trình dàn trang như trước (deck MẪU) để phát triển/test biệt lập vẫn được.
 *
 * Nội dung màn nằm ở `components/present-editor/PresentStageScreen.tsx` (dùng chung với
 * route scope).
 */

import PresentStageScreen from '@/components/present-editor/PresentStageScreen';
import LegacyStageRedirect from '@/components/studio/LegacyStageRedirect';

export default function PresentEditorPage() {
  return <LegacyStageRedirect stage="present" fallback={<PresentStageScreen />} />;
}
