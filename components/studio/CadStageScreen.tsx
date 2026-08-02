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
 * 03/08 (SPEC-APP-SHELL-CHUNG §3): chuyển sang `<StageShell>` dùng chung — CAD từ nay CÓ RAIL
 * TRÁI + avatar/AccountMenu + Dashboard/FlowsPanel như Rendering (trước đây thiếu, "lệch nặng
 * nhất" §1). Nội dung vùng làm việc giữ NGUYÊN: CadSheets bọc StageEnter + FoldableDualPane.
 */

import CadSheets from '@/components/cad/CadSheets';
import { StageEnter } from '@/components/studio/StageTransition';
import FoldableDualPane from '@/components/studio/FoldableDualPane';
import ReferencePane from '@/components/studio/ReferencePane';
import StatusBar from '@/components/studio/StatusBar';
import { StageShell } from '@/components/studio/StageShell';
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
    <StageShell active="cad" statusBar={<StatusBar stage="concept" />}>
      <StageEnter>
        {/* Tầng multi-sheet (phụ-thêm): thanh tab + CadEditor. 1 sheet ⇒ y hệt bản cũ. */}
        <FoldableDualPane primary={<CadSheets />} secondary={<ReferencePane />} />
      </StageEnter>
      {/* Tầng 2 onboarding — thẻ giới thiệu lần đầu chặng CAD (góc màn, không chặn thao tác). */}
      <StageIntroCard stage="cad" userId={userId} />
    </StageShell>
  );
}
