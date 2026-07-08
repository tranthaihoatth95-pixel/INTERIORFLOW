'use client';

/**
 * app/present-editor/page.tsx — Route standalone `/present-editor`.
 *
 * Mở thẳng trình dàn trang "Present" (Canva-level) với deck MẪU để phát triển & test
 * biệt lập. Editor tự nạp template từ thư viện Reference (/api/library) nếu có; nếu
 * trống thì dùng template builtin + ảnh /public/covers.
 *
 * Hydration-safe: deck mẫu dựng trong useState initializer (chạy 1 lần ở client).
 */

import { useState } from 'react';
import PresentEditor from '@/components/present-editor/PresentEditor';
import { makeSampleDeck } from '@/lib/present-editor/sample';

export default function PresentEditorPage() {
  const [deck] = useState(makeSampleDeck);
  return <PresentEditor initialDeck={deck} />;
}
