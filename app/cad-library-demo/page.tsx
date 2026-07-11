/**
 * app/cad-library-demo/page.tsx — Route DEMO riêng cho thư viện block CAD mới.
 * Không đụng route/StudioBar của trình CAD chính — trang độc lập để xem + chèn thử ngay.
 */

import BlockLibraryDemo from '@/components/cad-library/BlockLibraryDemo';

export default function CadLibraryDemoPage() {
  return <BlockLibraryDemo />;
}
