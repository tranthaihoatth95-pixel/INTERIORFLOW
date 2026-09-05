'use client';

/**
 * app/library/gallery/page.tsx — Gallery liên ngành (K · 12/08, phiếu
 * `docs/phieu-giao/gallery-lien-nganh.md`). Route THẬT (khác `/library`, đã là redirect-mở-sheet
 * từ 03/08 — "Thư viện là MỘT nơi duy nhất, và nó là sheet"). Gallery KHÔNG thay thế sheet: sheet
 * là nơi KÉO-THẢ vào bàn làm việc đang mở; Gallery là nơi DUYỆT/TUYỂN CHỌN đứng một mình, giống
 * `/materials` (`app/materials/page.tsx`) đứng cạnh sheet Thư viện chứ không phải bên trong nó.
 *
 * Bọc `<AppShell active="home">`: đây là bề mặt Workspace độc lập, không mượn chrome/Navigator
 * của chặng Render. `LibrarySheet` vẫn được AppShell mount nên lối “Nhập từ Kho chung” giữ nguyên.
 */
import { AppShell } from '@/components/studio/AppShell';
import { GalleryLienNganh } from '@/components/library/GalleryLienNganh';

export default function LibraryGalleryPage() {
  return (
    <AppShell
      active="home"
      /* DẢI CHỮ DỌC "GALLERY" ĐÃ BỎ 30/08 — Hoà đã yêu cầu một lần trước đó và nó vẫn còn.
         Nó là nhãn của Navigator lúc thu gọn: một cột chữ HOA xoay dọc chiếm chỗ cạnh lưới ảnh,
         nói đúng cái tên đã có ở thanh điều hướng bên trái. Trên một mặt CẢM HỨNG, mọi pixel
         không phải ảnh đều phải trả giá bằng lý do. Cột này không có lý do. */
    >
      <div className="min-h-0 flex-1 overflow-y-auto">
        <GalleryLienNganh />
      </div>
    </AppShell>
  );
}
