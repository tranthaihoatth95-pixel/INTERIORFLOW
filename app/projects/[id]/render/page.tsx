'use client';

/**
 * /projects/[id]/render — CHẶNG 2 "Rendering" (canvas node) trong SCOPE DỰ ÁN
 * (Task #21 · ĐỔ NỀN 1B).
 *
 * Mount CHÍNH shell app (`HomeScreen`, trước là thân `app/page.tsx`) với `projectRouteId`
 * = `[id]` từ URL. Ở chế độ này HomeScreen:
 *   · KHÔNG hiện ProjectSelect (URL đã nói rõ dự án nào — không có bước "chọn dự án"),
 *   · KHÔNG auto-resume theo localStorage (chống mở nhầm dự án khác),
 *   · ép store nạp đúng flow của `[id]` (`ensureProjectScope`) khi mount.
 *
 * Vẫn giữ nguyên gate đăng nhập của HomeScreen: mở URL này khi chưa/hết phiên → màn đăng
 * nhập, đăng nhập xong vào lại đúng dự án này.
 */

import { useParams } from 'next/navigation';
import HomeScreen from '@/components/home/HomeScreen';

export default function ProjectRenderPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  return <HomeScreen projectRouteId={id} />;
}
