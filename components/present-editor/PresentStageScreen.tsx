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
import StudioBar from '@/components/studio/StudioBar';
import { StageEnter } from '@/components/studio/StageTransition';
import { CommentLayer } from '@/components/CommentLayer';
import { ChatPanel } from '@/components/ChatPanel';

export default function PresentStageScreen() {
  const [deck] = useState(makeSampleDeck);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
      <StudioBar active="present" />
      {/* C-4: vào chặng bằng crossfade + scale "dynamic wallpaper" (StageEnter). */}
      <StageEnter style={{ display: 'block' }}>
        {/* Tầng multi-sheet (phụ-thêm): thanh tab + PresentEditor. 1 sheet ⇒ y hệt bản cũ. */}
        <PresentSheets initialDeck={deck} />
      </StageEnter>
      <ChatPanel />
      <CommentLayer />
    </div>
  );
}
