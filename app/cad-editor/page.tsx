'use client';

/**
 * app/cad-editor/page.tsx — ROUTE CŨ của chặng 1 "Drafting CAD", nay là REDIRECT
 * (Task #21 · ĐỔ NỀN 1B; sửa 26/07 — xem `LegacyStageRedirect`).
 *
 * Chặng đã dời xuống `/projects/[id]/cad` (URL = nguồn sự thật). Route này GIỮ LẠI để không
 * phá bookmark / link cũ / resume-state cũ: đọc dự án đang hoạt động (store → resume-state)
 * rồi `replace` sang `/projects/[id]/cad`. Chưa có dự án nào → đẩy về Dashboard kèm thông báo
 * "Chọn dự án trước" (KHÔNG còn render CadStageScreen tại chỗ như trước 26/07).
 */

import LegacyStageRedirect from '@/components/studio/LegacyStageRedirect';

export default function CadEditorPage() {
  return <LegacyStageRedirect stage="cad" />;
}
