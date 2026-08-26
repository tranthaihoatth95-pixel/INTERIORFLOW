/**
 * components/filemanager/tep-nguon.ts — LÕI THUẦN của khu **Tệp nguồn dự án** (`TepNguonDuAn.tsx`):
 * chuỗi contract `ProjectFile → xem/duyệt mắt → Promote → LibraryAsset (+ ProjectAssetUsage)`
 * thành thao tác người dùng. API đứng sau ĐÃ LIVE: `app/api/project-files/**` (đọc code route
 * trước khi viết file này — POST nhận **JSON {projectId, name, dataUrl|url}**, KHÔNG multipart).
 *
 * ⚠️ VÌ SAO CÓ HAI HẰNG SỐ "CHÉP" TỪ `lib/server/**` (usages · trần 25MB · usage-theo-mime):
 * nguồn thật là `lib/server/library-save.ts` (`LIBRARY_USAGES`, `LIBRARY_MAX_BYTES`) và
 * `lib/server/promote.ts` (`usageTuMime`) — nhưng cả hai module đó import `fs/promises` +
 * PrismaClient ở top-level ⇒ client component import vào là vỡ bundle Next. KHÔNG sửa được
 * `lib/server/**` (vùng cấm của phiếu). ⇒ Khai lại ở đây cho client, và **KHOÁ ĐỒNG BỘ BẰNG
 * DRIFT-GUARD TEST** (`tep-nguon.test.ts` import cả hai phía, lệch một giá trị là test đỏ) —
 * cùng khuôn IF-RNA/drift-guard repo đã dùng. Đây không phải "chép danh sách rồi quên".
 *
 * Thuần — không React/DOM/fetch. Chuỗi trả {vi,en}, nơi gọi tự dịch (cùng quy ước `ngan-tho.ts`).
 * Import RELATIVE — bộ chạy test là `sucrase-node`, không đọc `paths` của tsconfig.
 */

export interface ChuHaiThu {
  vi: string;
  en: string;
}

/** Trần dung lượng — drift-guard với `LIBRARY_MAX_BYTES` (lib/server/library-save.ts:18). */
export const TEP_MAX_BYTES = 25 * 1024 * 1024;

/**
 * Nhãn hiển thị cho từng `usage` — KEY của map này phải trùng KHÍT `LIBRARY_USAGES`
 * (drift-guard trong test). Nhãn nói VIỆC DÙNG, không lặp lại tên kỹ thuật.
 */
export const USAGE_HIEN_THI: Record<string, ChuHaiThu> = {
  'ref-render': { vi: 'Ảnh tham chiếu render', en: 'Render reference' },
  slide: { vi: 'Ảnh cho slide', en: 'Slide image' },
  material: { vi: 'Vật liệu', en: 'Material' },
  layout: { vi: 'Bố cục / layout', en: 'Layout' },
  cad: { vi: 'Bản vẽ / CAD', en: 'Drawing / CAD' },
  brief: { vi: 'Đề bài / hồ sơ', en: 'Brief / document' },
  furniture: { vi: 'Đồ nội thất', en: 'Furniture' },
};

/** Danh sách usage cho dropdown — dẫn xuất từ map trên, MỘT nguồn phía client. */
export const USAGE_LIST = Object.keys(USAGE_HIEN_THI);

/**
 * Usage mặc định suy từ MIME — PHẢI cho cùng kết quả với `usageTuMime`
 * (lib/server/promote.ts:52, drift-guard trong test): PDF → brief, còn lại → ref-render.
 */
export function usageMacDinh(mime: string): string {
  return mime === 'application/pdf' ? 'brief' : 'ref-render';
}

/** Loại xem trước — quyết định ô preview vẽ gì. `khac` không xảy ra với dữ liệu server (sniff
 *  chỉ cho PNG/JPEG/WEBP/GIF/AVIF/PDF qua) nhưng vẫn phải xử để không vẽ bậy khi dữ liệu lạ. */
export function loaiTep(mime: string): 'anh' | 'pdf' | 'khac' {
  if (mime === 'application/pdf') return 'pdf';
  if (mime.startsWith('image/')) return 'anh';
  return 'khac';
}

/**
 * Chặn sớm phía client TRƯỚC khi encode base64 (encode 25MB rồi mới bị server 413 là phí một
 * lượt đọc file). Server vẫn là người quyết cuối — đây chỉ là fail-fast, cùng ngưỡng.
 */
export function kiemKichThuoc(bytes: number): ChuHaiThu | null {
  if (bytes <= TEP_MAX_BYTES) return null;
  return {
    vi: `Tệp ${(bytes / (1024 * 1024)).toFixed(1)}MB — quá trần 25MB, server sẽ từ chối.`,
    en: `File is ${(bytes / (1024 * 1024)).toFixed(1)}MB — over the 25MB cap, the server will refuse it.`,
  };
}

/**
 * Lý do nút "Đưa vào Thư viện" đang mờ — `null` = bấm được. Đây là human gate DUY NHẤT của
 * chuỗi (xem tệp bằng mắt rồi xác nhận), KHÔNG phải engine review: chưa "Đã xem" thì chưa gửi.
 * Chuỗi trả về đi vào `aria-describedby` (khuôn ToolbarChip 16/08 — không dùng `title` câm).
 */
export function lyDoChuaGui(o: { daXem: boolean; dangGui: boolean }): ChuHaiThu | null {
  if (o.dangGui) return { vi: 'Đang gửi — chờ máy chủ trả lời.', en: 'Sending — waiting for the server.' };
  if (!o.daXem) {
    return {
      vi: 'Xem tệp rồi đánh dấu "Đã xem" trước khi đưa vào Thư viện.',
      en: 'Open the file and tick "Reviewed" before promoting it to the Library.',
    };
  }
  return null;
}

/**
 * Nhãn kết quả promote — API idempotent trả `daCo: true` khi tệp đã promote trước đó (200,
 * không phải lỗi). UI phải phân biệt hai câu, không được báo lỗi giả cho ca `daCo`.
 */
export function nhanKetQua(daCo: boolean): ChuHaiThu {
  return daCo
    ? { vi: 'Đã có trong Thư viện — không nhân bản', en: 'Already in the Library — not duplicated' }
    : { vi: 'Đã vào Thư viện ✓', en: 'Added to the Library ✓' };
}
