'use client';

/**
 * lib/usePageVisible.ts — tab có đang hiện không?
 *
 * Dùng để DỪNG các animation lặp vô hạn (quầng sáng ambient 24s ở ProjectSelect / StageSelect /
 * LoginBackdrop) khi người dùng chuyển sang tab khác. Animation nền không ai nhìn vẫn giữ một
 * layer gradient bán kính 34–54rem sống trong compositor, và vì phía trên còn các lớp
 * `backdrop-filter` nên mỗi khung hình lại ép chúng blur lại — tốn pin, không đổi lấy gì.
 *
 * Tiền lệ: slideshow ở LoginBackdrop đã tự kiểm `document.hidden` (kèm ghi chú vì sao) nhưng
 * mấy vòng lặp quầng sáng thì chưa theo. Hook này để mọi chỗ dùng chung một cách.
 *
 * SSR-safe: trả `true` khi chưa có `document` (không chớp lúc hydrate).
 */

import { useEffect, useState } from 'react';

export function usePageVisible(): boolean {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const sync = () => setVisible(!document.hidden);
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, []);

  return visible;
}
