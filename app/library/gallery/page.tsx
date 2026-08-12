'use client';

/**
 * app/library/gallery/page.tsx — Gallery liên ngành (K · 12/08, phiếu
 * `docs/phieu-giao/gallery-lien-nganh.md`). Route THẬT (khác `/library`, đã là redirect-mở-sheet
 * từ 03/08 — "Thư viện là MỘT nơi duy nhất, và nó là sheet"). Gallery KHÔNG thay thế sheet: sheet
 * là nơi KÉO-THẢ vào bàn làm việc đang mở; Gallery là nơi DUYỆT/TUYỂN CHỌN đứng một mình, giống
 * `/materials` (`app/materials/page.tsx`) đứng cạnh sheet Thư viện chứ không phải bên trong nó.
 *
 * Bọc `<AppShell active="render">` — cùng lựa chọn `/files`/`/materials` đã làm cho route KHÔNG
 * phải 1-trong-3-chặng: header/Navigator/Thư viện sheet dùng chung, `openLibrarySheet()` từ trong
 * `GalleryLienNganh` (nút "Nhập từ Kho chung") hoạt động thật vì `<LibrarySheet>` được `AppShell`
 * mount sẵn ở đây.
 */
import { AppShell } from '@/components/studio/AppShell';
import { GalleryNavigator } from '@/components/library/GalleryNavigator';
import { GalleryLienNganh } from '@/components/library/GalleryLienNganh';
import { useT } from '@/lib/i18n';

export default function LibraryGalleryPage() {
  const tr = useT();
  return (
    <AppShell
      active="render"
      navigator={<GalleryNavigator />}
      navigatorAddLabel={tr('Gallery', 'Gallery')}
      navigatorCollapsedLabel={tr('Gallery', 'Gallery')}
    >
      <div className="min-h-0 flex-1 overflow-y-auto">
        <GalleryLienNganh />
      </div>
    </AppShell>
  );
}
