'use client';

import { useEffect } from 'react';
import { useFlowStore } from '@/lib/store';

/**
 * StoreHydrator — nạp state đã lưu (aiTier · credits · theme · lang · workspace · flow local)
 * từ localStorage vào store ngay khi app mở, BẤT KỂ route nào.
 *
 * SỬA BUG THẬT (02/08, C7): `store.hydrate()` trước đây CHỈ được gọi từ
 * `components/home/HomeScreen.tsx` ('/'). Deep-link/hard-reload thẳng vào route con
 * (`/present-editor`, `/cad-editor`…) bỏ qua bước này — store luôn khởi động lại từ giá trị mặc
 * định cứng trong `create()` (`aiTier=2` dù Settings đã chọn mức khác), bất kể localStorage đã
 * có gì. Phát hiện khi verify P3 phần 2 bằng cách deep-link (xem STATUS.md).
 *
 * Mount 1 lần ở `app/layout.tsx`, CÙNG khuôn `ResumeTracker` (render null, chạy mọi route).
 * `HomeScreen.tsx` KHÔNG còn tự gọi `hydrate()` — 1 nguồn nạp state duy nhất, tránh 2 nơi cùng
 * đọc localStorage (vô hại vì hydrate() idempotent, nhưng 1 nguồn dễ verify hơn 2).
 */
export function StoreHydrator() {
  useEffect(() => {
    useFlowStore.getState().hydrate();
  }, []);

  return null;
}
