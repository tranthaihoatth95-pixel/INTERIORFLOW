'use client';

/**
 * app/present-editor/page.tsx — ROUTE CŨ của chặng 3 "Presenting", nay là REDIRECT
 * (Task #21 · ĐỔ NỀN 1B; sửa 26/07 — xem `LegacyStageRedirect`).
 *
 * Chặng đã dời xuống `/projects/[id]/present` (URL = nguồn sự thật). Route này GIỮ LẠI để
 * không phá bookmark / link cũ / resume-state cũ: đọc dự án đang hoạt động (store →
 * resume-state) rồi `replace` sang `/projects/[id]/present`. Chưa có dự án nào → đẩy về
 * Dashboard kèm thông báo "Chọn dự án trước" (KHÔNG còn render deck MẪU tại chỗ như trước
 * 26/07 — muốn xem deck mẫu demo, dùng route `/present` riêng, KHÁC route này, xem
 * docs/APP-MAP.md mục 4/T3).
 */

import LegacyStageRedirect from '@/components/studio/LegacyStageRedirect';

export default function PresentEditorPage() {
  return <LegacyStageRedirect stage="present" />;
}
