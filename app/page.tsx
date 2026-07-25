'use client';

/**
 * app/page.tsx — route TOÀN CỤC `/` (lối vào app: đăng nhập → Gallery/chọn dự án → canvas).
 *
 * Task #21 (ĐỔ NỀN 1B): thân trang đã tách sang `components/home/HomeScreen.tsx` để route
 * scope dự án `/projects/[id]/render` mount ĐÚNG một component (không nhân bản logic).
 *
 * Route này GIỮ NGUYÊN — bookmark `/` không vỡ. Nó vẫn là màn đăng nhập + Gallery; khi đã
 * xác định được dự án đang mở (chọn ở ProjectSelect, hoặc auto-resume), HomeScreen tự
 * `router.replace()` sang `/projects/[id]/render` để URL trở thành nguồn sự thật.
 */

import HomeScreen from '@/components/home/HomeScreen';

export default function Home() {
  return <HomeScreen />;
}
