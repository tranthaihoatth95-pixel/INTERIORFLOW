'use client';

/**
 * app/present-editor/page.tsx — Route standalone `/present-editor`.
 *
 * Mở thẳng trình dàn trang "Present" (Canva-level) với deck MẪU để phát triển & test
 * biệt lập. Editor tự nạp template từ thư viện Reference (/api/library) nếu có; nếu
 * trống thì dùng template builtin + ảnh /public/covers.
 *
 * StudioBar ở đầu để chuyển Node ↔ Dàn trang ↔ Chỉnh ảnh + luôn có đường về app chính.
 * Hydration-safe: deck mẫu dựng trong useState initializer (chạy 1 lần ở client).
 */

import { useState } from 'react';
import PresentSheets from '@/components/present-editor/PresentSheets';
import { makeSampleDeck } from '@/lib/present-editor/sample';
import StudioBar from '@/components/studio/StudioBar';
import { StageEnter } from '@/components/studio/StageTransition';
import { CommentLayer } from '@/components/CommentLayer';
import { ChatPanel } from '@/components/ChatPanel';

export default function PresentEditorPage() {
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
