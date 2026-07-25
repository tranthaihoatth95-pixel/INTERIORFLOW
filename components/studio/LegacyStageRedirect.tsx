'use client';

/**
 * components/studio/LegacyStageRedirect.tsx — cầu BACKWARD-COMPAT cho các route chặng
 * TOÀN CỤC cũ (Task #21 · ĐỔ NỀN 1B).
 *
 * Chặng đã dời xuống `/projects/[id]/(cad|render|present|photo)` (URL = nguồn sự thật).
 * Route cũ `/cad-editor`, `/present-editor`, `/photo-editor` KHÔNG bị xoá — bookmark, link
 * dán trong chat, `window.open('/photo-editor')` và resume-state cũ đều phải còn chạy.
 * Chúng nay chỉ làm một việc: tra dự án đang hoạt động rồi `router.replace()` sang route
 * scope dự án tương ứng.
 *
 * Chưa xác định được dự án nào (user mới, chưa mở dự án nào, localStorage bị chặn) →
 * KHÔNG đá về đâu cả: render `fallback` = đúng màn cũ, để không ai bị kẹt.
 *
 * `replace` (không `push`): route cũ không nên nằm lại trong history — bấm Back phải về
 * chỗ trước đó, không rơi lại vào chính cầu redirect này.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { activeProjectRouteId } from '@/lib/project-scope';
import { stageRoutePath, type StageSegment } from '@/lib/scope-core';

export default function LegacyStageRedirect({
  stage,
  fallback,
}: {
  stage: StageSegment;
  fallback: React.ReactNode;
}) {
  const router = useRouter();
  // 'deciding' = đang tra id (1 tick, không fetch) · 'redirecting' = đã ra lệnh replace ·
  // 'inline' = không có dự án nào → hiện màn cũ tại chỗ.
  const [phase, setPhase] = useState<'deciding' | 'redirecting' | 'inline'>('deciding');

  useEffect(() => {
    const id = activeProjectRouteId();
    if (id) {
      setPhase('redirecting');
      router.replace(stageRoutePath(id, stage));
      return;
    }
    setPhase('inline');
  }, [router, stage]);

  if (phase === 'inline') return <>{fallback}</>;

  // Nhịp chờ rất ngắn (không gọi API) — chỉ một spinner trầm để không nháy nền trắng.
  return (
    <div style={{ display: 'grid', placeItems: 'center', height: '100dvh', background: 'var(--bg)' }}>
      <Loader2 size={22} className="animate-spin" style={{ color: 'var(--t4)' }} />
    </div>
  );
}
