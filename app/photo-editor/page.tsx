'use client';

/**
 * app/photo-editor/page.tsx — Route standalone `/photo-editor`.
 *
 * Mở thẳng trình chỉnh ảnh raster "Photoshop-level" với tài liệu MẪU (rỗng, nền trắng)
 * để phát triển & test biệt lập. Người dùng import ảnh render vào rồi hậu kỳ.
 *
 * StudioBar ở đầu để chuyển Node ↔ Dàn trang ↔ Chỉnh ảnh + luôn có đường về app chính.
 * Hydration-safe: tài liệu mẫu dựng trong useState initializer (chạy 1 lần ở client).
 */

import { useState } from 'react';
import PhotoEditor from '@/components/photo-editor/PhotoEditor';
import { makeSampleDoc } from '@/lib/photo-editor/sample';
import StudioBar from '@/components/studio/StudioBar';

export default function PhotoEditorPage() {
  const [doc] = useState(makeSampleDoc);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
      <StudioBar active="photo" />
      <div style={{ flex: 1, minHeight: 0 }}>
        <PhotoEditor initialDoc={doc} />
      </div>
    </div>
  );
}
