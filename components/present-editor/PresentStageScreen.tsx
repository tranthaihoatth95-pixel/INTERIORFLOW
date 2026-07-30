'use client';

/**
 * components/present-editor/PresentStageScreen.tsx — MÀN chặng 3 "Presenting" dùng chung
 * (tách khỏi app/present-editor/page.tsx ở Task #21 · ĐỔ NỀN 1B).
 *
 * Hai route mount CÙNG component này:
 *   · `/projects/[id]/present` — scope dự án (route chính thức).
 *   · `/present-editor`        — route cũ, nay redirect; chưa xác định được dự án nào đang
 *                                hoạt động thì render thẳng màn này (giữ hành vi cũ).
 *
 * Nội dung giữ NGUYÊN: StudioBar (active='present') + PresentSheets với deck MẪU (editor tự
 * nạp template từ thư viện Reference nếu có). Hydration-safe: deck dựng trong useState
 * initializer (chạy 1 lần ở client).
 */

import { useState } from 'react';
import PresentSheets from '@/components/present-editor/PresentSheets';
import { makeSampleDeck } from '@/lib/present-editor/sample';
import { AppChrome } from '@/components/studio/AppChrome';
import StatusBar from '@/components/studio/StatusBar';
import { StageEnter } from '@/components/studio/StageTransition';
import { CommentLayer } from '@/components/CommentLayer';
import { ChatPanel } from '@/components/ChatPanel';
import { StageIntroCard } from '@/components/onboarding/StageIntroCard';
import { useFlowStore } from '@/lib/store';
import { usePlayStatus } from '@/lib/present-editor/play-status';
import { effectiveUserId } from '@/lib/resume';

export default function PresentStageScreen() {
  const [deck] = useState(makeSampleDeck);
  // Route studio KHÔNG nạp `user` vào store khi vào bằng hard-reload/URL trực tiếp — rơi về
  // lastUserId (cùng pattern PresentSheets.tsx/ResumeTracker), nếu không StageIntroCard im
  // lặng không bao giờ hiện cho user mở thẳng `/projects/[id]/present`.
  const storeUserId = useFlowStore((s) => s.user?.id);
  const userId = effectiveUserId(storeUserId);
  // VIỆC A3 (28/07): StatusBar tự ẩn khi trình chiếu toàn màn hình (SlidePlayer che hết,
  // playing nay ở store dùng chung để đọc được từ NGOÀI PresentEditor).
  const playing = usePlayStatus((s) => s.playing);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
      <AppChrome active="present" />
      {/* C-4: vào chặng bằng crossfade + scale "dynamic wallpaper" (StageEnter). */}
      <StageEnter style={{ display: 'block' }}>
        {/* Tầng multi-sheet (phụ-thêm): thanh tab + PresentEditor. 1 sheet ⇒ y hệt bản cũ. */}
        <PresentSheets initialDeck={deck} />
      </StageEnter>
      <StatusBar stage="present" hidden={playing} />
      <ChatPanel />
      <CommentLayer />
      {/* Tầng 2 onboarding — thẻ giới thiệu lần đầu chặng Presenting. */}
      <StageIntroCard stage="present" userId={userId} />
    </div>
  );
}
