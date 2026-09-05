'use client';

/**
 * app/library/page.tsx — TRANG TỔNG THƯ VIỆN (mặt thứ nhất của Master Library).
 *
 * LỊCH SỬ ROUTE NÀY, để phiên sau không lật qua lật lại:
 *   · 03/08 Hoà chốt "Thư viện là MỘT nơi duy nhất, và nó là SHEET" ⇒ route thành redirect
 *     `router.back()` + mở tấm (`markOpenLibraryOnLoad`).
 *   · 10/08 Hoà chốt "Master Library có 2 MẶT: TRANG TỔNG là gallery/collection; trong mỗi chặng
 *     là sidebar tự lọc theo ngữ cảnh" — mặt trang tổng ĐÈ chốt 03/08 ở đúng điểm này.
 *   · 16/08 rail điều hướng có mục "Thư viện" → `/library` (`components/nav/muc-dieu-huong.ts`),
 *     nhưng tới 02/09 bấm vào vẫn bị redirect đẩy ngược về trang trước — bản đồ trỏ vào chỗ trống.
 * ⇒ 02/09: route là TRANG THẬT. Tấm `LibrarySheet` vẫn là nơi kéo-thả (AppShell mount sẵn, nút
 * "Mở tấm Thư viện" + phím L trên trang này mở nó); trang tổng là nơi đứng nhìn toàn kho.
 *
 * Bọc `<AppShell active="render">` như `/files`, `/materials`, `/library/gallery` — route không
 * phải 1-trong-3-chặng, mặc định về Render để tấm Thư viện + segmented control có nghĩa.
 */
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/studio/AppShell';
import { LibraryOverviewNavigator } from '@/components/library/LibraryOverviewNavigator';
import { LibraryOverview } from '@/components/library/LibraryOverview';
import { useT } from '@/lib/i18n';

export default function LibraryPage() {
  const tr = useT();
  const router = useRouter();
  return (
    <AppShell
      active="render"
      navigator={<LibraryOverviewNavigator trang="tong" />}
      navigatorAddLabel={tr('Nhập tài sản', 'Ingest assets')}
      navigatorCollapsedLabel={tr('Thư viện', 'Library')}
      onNavigatorAdd={() => router.push('/library/ingest')}
    >
      <div className="min-h-0 flex-1 overflow-y-auto">
        <LibraryOverview />
      </div>
    </AppShell>
  );
}
