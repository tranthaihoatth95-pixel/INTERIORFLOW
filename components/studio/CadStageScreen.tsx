'use client';

/**
 * components/studio/CadStageScreen.tsx — MÀN chặng 1 "Drafting CAD" dùng chung
 * (tách khỏi app/cad-editor/page.tsx ở Task #21 · ĐỔ NỀN 1B).
 *
 * Hai route mount CÙNG component này:
 *   · `/projects/[id]/cad` — scope dự án (route chính thức).
 *   · `/cad-editor`        — route cũ, nay redirect; khi chưa xác định được dự án nào đang
 *                            hoạt động thì render thẳng màn này (giữ hành vi cũ).
 *
 * Nội dung giữ NGUYÊN: StudioBar (active='cad') + tầng multi-sheet CadSheets bọc trong
 * StageEnter (C-4 crossfade) và FoldableDualPane (D-1 pane Reference khi máy gập mở).
 */

import StudioBar from '@/components/studio/StudioBar';
import CadSheets from '@/components/cad/CadSheets';
import { StageEnter } from '@/components/studio/StageTransition';
import FoldableDualPane from '@/components/studio/FoldableDualPane';
import ReferencePane from '@/components/studio/ReferencePane';
import StatusBar from '@/components/studio/StatusBar';
import { StageIntroCard } from '@/components/onboarding/StageIntroCard';
import { useFlowStore } from '@/lib/store';
import { effectiveUserId } from '@/lib/resume';

export default function CadStageScreen() {
  // Route studio KHÔNG nạp `user` vào store khi vào bằng hard-reload/URL trực tiếp — rơi về
  // lastUserId (cùng pattern CadSheets.tsx/ResumeTracker), nếu không StageIntroCard im lặng
  // không bao giờ hiện cho user mở thẳng `/projects/[id]/cad` (F5, bookmark, tab mới).
  const storeUserId = useFlowStore((s) => s.user?.id);
  const userId = effectiveUserId(storeUserId);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--bg)' }}>
      <StudioBar active="cad" />
      <StageEnter>
        {/* Tầng multi-sheet (phụ-thêm): thanh tab + CadEditor. 1 sheet ⇒ y hệt bản cũ. */}
        <FoldableDualPane primary={<CadSheets />} secondary={<ReferencePane />} />
      </StageEnter>
      <StatusBar stage="concept" />
      {/* Tầng 2 onboarding — thẻ giới thiệu lần đầu chặng CAD (góc màn, không chặn thao tác). */}
      <StageIntroCard stage="cad" userId={userId} />
    </div>
  );
}
