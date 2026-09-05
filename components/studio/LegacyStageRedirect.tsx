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
import { activeProjectRouteIdCho } from '@/lib/project-scope';
import { stageRoutePath, type StageSegment } from '@/lib/scope-core';

export default function LegacyStageRedirect({ stage }: { stage: StageSegment }) {
  const router = useRouter();

  /**
   * ⛔ D7 (04/09) — CHỜ ĐỊNH DANH RỒI MỚI ĐIỀU HƯỚNG, đừng đọc đồng bộ.
   *
   * Bản cũ gọi `activeProjectRouteId()` ĐỒNG BỘ ngay đây. Effect này có deps `[router, stage]`
   * — cả hai bất biến trên một lượt vào — nên nó chạy đúng MỘT lần và không bao giờ chạy lại.
   * Mở bookmark cũ `/cad-editor` bằng tab mới: store rỗng (chưa điều hướng gì trong phiên) và
   * bộ đệm `lastUserId` chưa được gieo (trình duyệt chưa đi qua Home/đăng nhập) ⇒ hàm trả
   * `null` ⇒ dội người dùng về `/?notice=choose-project` DÙ resume trên đĩa đã đủ `flowId` và
   * phiên máy chủ vẫn hợp lệ. Tái hiện có đối chứng, hai thế giới khác nhau đúng một biến:
   * `scripts/nghiem-thu-ban-lam-viec/tai-hien-d7.mjs`.
   *
   * `activeProjectRouteIdCho` hỏi store trước (điều hướng trong phiên vẫn nhanh như cũ, không
   * chờ mạng), chỉ chờ định danh khi store rỗng — tức đúng ca bookmark/deep-link.
   *
   * KHÔNG LOÉ HOME: chỉ có MỘT lần `router.replace`, và nó xảy ra SAU khi đã biết đích. Trong
   * lúc chờ, trang vẫn là spinner bên dưới — người dùng không bao giờ thấy Home hiện lên rồi
   * biến mất. Bộ đo canh đúng điều này bằng `framenavigated` (`loeHome`), không bằng ảnh chụp.
   */
  useEffect(() => {
    let conSong = true;
    void activeProjectRouteIdCho(() => conSong).then((id) => {
      if (!conSong) return;
      router.replace(id ? stageRoutePath(id, stage) : '/?notice=choose-project');
    });
    return () => {
      conSong = false;
    };
  }, [router, stage]);

  // Spinner trầm để không nháy nền trắng, dù đích là route scope dự án hay Dashboard.
  // ⚠️ 04/09 — chú thích cũ ghi "nhịp chờ rất ngắn (không gọi API)": KHÔNG CÒN ĐÚNG. Đường
  // bookmark nay chờ `/api/auth/me` (đã single-flight, thường ~vài chục ms; trần `HAN_HOI_MS`
  // 8s khi máy chủ không với tới). Đổi một lượt chờ ngắn lấy việc không dội nhầm người dùng về
  // Home là đánh đổi cố ý — và ở ca máy chủ không với tới thì MỌI câu trả lời đều là phỏng đoán.
  return (
    <div style={{ display: 'grid', placeItems: 'center', height: '100dvh', background: 'var(--bg)' }}>
      <Loader2 size={20} className="animate-spin" style={{ color: 'var(--t4)' }} />
    </div>
  );
}
