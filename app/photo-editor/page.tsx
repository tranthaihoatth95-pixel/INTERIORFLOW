'use client';

/**
 * app/photo-editor/page.tsx — ROUTE CŨ của công cụ "Chỉnh ảnh", nay là REDIRECT
 * (Task #21 · ĐỔ NỀN 1B; sửa 26/07 — xem `LegacyStageRedirect`).
 *
 * Công cụ đã dời xuống `/projects/[id]/photo` (URL = nguồn sự thật). Route này GIỮ LẠI vì
 * `window.open('/photo-editor', '_blank')` trong PresentEditor (nút "Chỉnh ảnh nâng cao")
 * và bookmark cũ vẫn dùng: đọc dự án đang hoạt động rồi `replace` sang route scope.
 *
 * Handoff ảnh từ Present KHÔNG bị ảnh hưởng: `lib/photo-editor/handoff.ts` stash vào
 * sessionStorage, chỉ được consume bởi `PhotoEditorScreen` mount ở route ĐÍCH
 * (`/projects/[id]/photo`) sau khi redirect — không đụng gì tới cầu handoff.
 *
 * ⚠️ Không xác định được dự án nào → đẩy về Dashboard kèm thông báo "Chọn dự án trước"
 * (KHÔNG còn render PhotoEditorScreen tại chỗ như trước 26/07). Vì handoff ảnh LUÔN đi
 * kèm một request mở ảnh từ PresentEditor — mà PresentEditor chỉ chạy được bên trong scope
 * dự án (`/projects/[id]/present`) — nên trên thực tế lúc gọi `window.open('/photo-editor')`
 * store LUÔN có project đang hoạt động; nhánh "không có dự án" chỉ xảy ra khi ai đó bookmark
 * link trần mà chưa từng mở dự án nào.
 */

import LegacyStageRedirect from '@/components/studio/LegacyStageRedirect';

export default function PhotoEditorPage() {
  return <LegacyStageRedirect stage="photo" />;
}
