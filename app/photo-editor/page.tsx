'use client';

/**
 * app/photo-editor/page.tsx — Route standalone `/photo-editor`.
 *
 * Mở thẳng trình chỉnh ảnh raster "Photoshop-level" với tài liệu MẪU (rỗng, nền trắng)
 * để phát triển & test biệt lập. Người dùng import ảnh render vào rồi hậu kỳ.
 *
 * Hydration-safe: tài liệu mẫu dựng trong useState initializer (chạy 1 lần ở client).
 */

import { useState } from 'react';
import PhotoEditor from '@/components/photo-editor/PhotoEditor';
import { makeSampleDoc } from '@/lib/photo-editor/sample';

export default function PhotoEditorPage() {
  const [doc] = useState(makeSampleDoc);
  return <PhotoEditor initialDoc={doc} />;
}
