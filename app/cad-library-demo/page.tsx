/**
 * app/cad-library-demo/page.tsx — Route DEMO riêng cho thư viện block CAD mới.
 * Không đụng route/StudioBar của trình CAD chính — trang độc lập để xem + chèn thử ngay.
 *
 * ⚠️ Gắn cờ demo (Sprint "ĐỔ NỀN 1B — dọn route song song", T2, 26/07): route dev-only,
 * không có entry UI (docs/APP-MAP.md §2) — CHỈ vào được khi `NEXT_PUBLIC_DEMO=true`. Build
 * production (biến không set/khác 'true') → `redirect('/')` ngay ở server, không render gì.
 */

import { redirect } from 'next/navigation';
import BlockLibraryDemo from '@/components/cad-library/BlockLibraryDemo';

export default function CadLibraryDemoPage() {
  if (process.env.NEXT_PUBLIC_DEMO !== 'true') redirect('/');
  return <BlockLibraryDemo />;
}
