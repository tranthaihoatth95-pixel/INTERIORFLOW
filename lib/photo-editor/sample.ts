/**
 * lib/photo-editor/sample.ts — Tài liệu mẫu để mở /photo-editor test biệt lập.
 *
 * Dựng 1 tài liệu rỗng (nền trắng) — người dùng import ảnh render vào. Không nhồi ảnh
 * mặc định để tránh phụ thuộc asset. Hydration-safe: chỉ gọi trong useState initializer.
 */

import { makeEmptyDoc, type PhotoDoc } from './model';

export function makeSampleDoc(): PhotoDoc {
  const doc = makeEmptyDoc(1280, 800);
  doc.name = 'Hậu kỳ ảnh render';
  return doc;
}
