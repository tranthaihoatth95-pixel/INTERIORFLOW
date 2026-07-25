'use client';

/**
 * app/cad-editor/page.tsx — ROUTE CŨ của chặng 1 "Drafting CAD", nay là REDIRECT
 * (Task #21 · ĐỔ NỀN 1B).
 *
 * Chặng đã dời xuống `/projects/[id]/cad` (URL = nguồn sự thật). Route này GIỮ LẠI để không
 * phá bookmark / link cũ / resume-state cũ: đọc dự án đang hoạt động (store → resume-state)
 * rồi `replace` sang `/projects/[id]/cad`. Chưa có dự án nào (user mới) → render thẳng màn
 * CAD như trước, không kẹt.
 *
 * Nội dung màn nằm ở `components/studio/CadStageScreen.tsx` (dùng chung với route scope).
 */

import CadStageScreen from '@/components/studio/CadStageScreen';
import LegacyStageRedirect from '@/components/studio/LegacyStageRedirect';

export default function CadEditorPage() {
  return <LegacyStageRedirect stage="cad" fallback={<CadStageScreen />} />;
}
