'use client';

/**
 * components/studio/LegacyStageRedirect.tsx — cầu BACKWARD-COMPAT cho các route chặng
 * TOÀN CỤC cũ (Task #21 · ĐỔ NỀN 1B; sửa lại — Sprint "ĐỔ NỀN 1B — dọn route song song",
 * 26/07).
 *
 * Chặng đã dời xuống `/projects/[id]/(cad|render|present|photo)` (URL = nguồn sự thật).
 * Route cũ `/cad-editor`, `/present-editor`, `/photo-editor` KHÔNG bị xoá — bookmark, link
 * dán trong chat, `window.open('/photo-editor')` và resume-state cũ đều phải còn chạy.
 * Chúng nay chỉ làm một việc: tra dự án đang hoạt động rồi `router.replace()` sang route
 * scope dự án tương ứng.
 *
 * ⚠️ ĐỔI HÀNH VI 26/07: chưa xác định được dự án nào (user mới, chưa mở dự án nào,
 * localStorage bị chặn) — TRƯỚC ĐÂY render `fallback` = màn cũ tại chỗ (CadStageScreen/
 * PresentStageScreen/PhotoEditorScreen KHÔNG có projectId nào, vi phạm §1B "màn hình
 * scope:'project' bắt buộc nhận projectId"). NAY: đẩy về Dashboard (`/`) kèm query
 * `?notice=choose-project` — `HomeScreen` đọc cờ này và hiện banner "Chọn dự án trước"
 * trên đúng màn ProjectSelect. KHÔNG còn `fallback` prop — 3 component màn cũ chỉ còn được
 * dùng bởi route scope thật (`/projects/[id]/...`), không còn đường nào render chúng thiếu
 * projectId nữa.
 *
 * `replace` (không `push`): route cũ không nên nằm lại trong history — bấm Back phải về
 * chỗ trước đó, không rơi lại vào chính cầu redirect này.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { activeProjectRouteId } from '@/lib/project-scope';
import { stageRoutePath, type StageSegment } from '@/lib/scope-core';

export default function LegacyStageRedirect({ stage }: { stage: StageSegment }) {
  const router = useRouter();

  useEffect(() => {
    const id = activeProjectRouteId();
    router.replace(id ? stageRoutePath(id, stage) : '/?notice=choose-project');
  }, [router, stage]);

  // Nhịp chờ rất ngắn (không gọi API) — chỉ một spinner trầm để không nháy nền trắng,
  // dù đích là route scope dự án hay Dashboard.
  return (
    <div style={{ display: 'grid', placeItems: 'center', height: '100dvh', background: 'var(--bg)' }}>
      <Loader2 size={20} className="animate-spin" style={{ color: 'var(--t4)' }} />
    </div>
  );
}
