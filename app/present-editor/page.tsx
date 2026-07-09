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
import PresentEditor from '@/components/present-editor/PresentEditor';
import { makeSampleDeck } from '@/lib/present-editor/sample';
import StudioBar from '@/components/studio/StudioBar';
import { CommentLayer } from '@/components/CommentLayer';
import { ChatPanel } from '@/components/ChatPanel';

export default function PresentEditorPage() {
  const [deck] = useState(makeSampleDeck);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
      <StudioBar active="present" />
      <div style={{ flex: 1, minHeight: 0 }}>
        <PresentEditor initialDeck={deck} />
      </div>
      <ChatPanel />
      <CommentLayer />
    </div>
  );
}
