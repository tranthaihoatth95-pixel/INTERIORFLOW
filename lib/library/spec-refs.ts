/**
 * lib/library/spec-refs.ts — NẠP DANH SÁCH `ProductSpec` TỐI THIỂU (id + sku) DÙNG CHUNG.
 *
 * VÌ SAO CÓ (03/09): `components/cad/LibraryDropBridge.tsx` gọi `resolveLibraryItem(item,
 * manifest, undefined, idfcGeom2d)` — bỏ trống tham số `specs`, nên NHÁNH KHỚP MÃ TỰ ĐỘNG bên
 * trong resolver (`item.specId ?? matchSpec(item.code, specs)`) không bao giờ chạy ở phía nghe.
 *
 * ⚠️ ĐO TẠI NGUỒN TRƯỚC KHI SỬA — phạm vi thật HẸP hơn lời audit:
 *   · `LIBRARY_INSTANTIATE_EVENT` chỉ có MỘT nơi phát (`LibrarySheet.tsx:505`), và nơi đó ĐÃ tự
 *     tính `specId` rồi gửi kèm ⇒ ca thường ngày KHÔNG mất `specId`.
 *   · Chỗ thủng là CỬA SỔ ĐUA: `specs` ở tấm Thư viện chỉ fetch KHI TẤM MỞ (`:351`), nên món
 *     thả trong lúc `/api/specs` chưa về thì `specId` là `undefined` — entity rơi xuống bản vẽ
 *     không mã, `lib/boq/model.ts:102` đếm vào `missing-specId-item`. Mạng chậm thì cửa sổ này
 *     rộng ra, và người dùng không có cách nào biết mình vừa rơi vào nó.
 * ⇒ Sửa theo hướng NƠI NGHE TỰ ĐỦ: bridge không phụ thuộc việc nơi phát đã kịp làm hay chưa.
 *   Đây là đường DỰ PHÒNG, không thay đường chính — `item.specId` (gán tay ở tấm Thư viện) vẫn
 *   thắng, đúng thứ tự ưu tiên resolver đã chốt R1 19/08.
 *
 * Khuôn cache chép ĐÚNG `loadManifest()` (`lib/cad/block-library.ts:59`): giữ promise theo phiên
 * trang, hỏng thì xoá cache cho lần sau thử lại. KHÔNG đẻ kiểu cache thứ hai.
 * Trả `SpecRef[]` — đúng hình dạng tối thiểu resolver cần, KHÔNG kéo cả DTO nặng vào tầng 2D.
 */

import type { SpecRef } from '@/lib/cad/library-item-resolve';

type Fetcher = typeof fetch;

let cache: Promise<SpecRef[]> | null = null;

/** Rút đúng 2 trường resolver dùng tới. Bản ghi thiếu `id` (hoặc `id` không phải chuỗi) bị LOẠI —
 * một `SpecRef` không có id thì `matchSpec` trả về thứ không gán được cho entity nào. */
export function toSpecRefs(raw: unknown): SpecRef[] {
  const arr = (raw as { specs?: unknown })?.specs;
  if (!Array.isArray(arr)) return [];
  const out: SpecRef[] = [];
  for (const s of arr) {
    const id = (s as { id?: unknown })?.id;
    if (typeof id !== 'string' || id === '') continue;
    const sku = (s as { sku?: unknown })?.sku;
    out.push({ id, sku: typeof sku === 'string' ? sku : null });
  }
  return out;
}

/**
 * Danh sách spec tối thiểu, nạp một lần cho cả phiên trang.
 *
 * KHÔNG BAO GIỜ NÉM: nơi gọi là đường thả món xuống bản vẽ — kho vật liệu hỏng/chưa đăng nhập thì
 * món vẫn phải rơi xuống được, chỉ là không mang mã. Mất mã là mất MỘT phần dữ liệu; ném lỗi là
 * mất CẢ thao tác. Lỗi ⇒ trả mảng rỗng và xoá cache để lần thả sau thử lại.
 */
export function loadSpecRefs(fetcher: Fetcher = fetch): Promise<SpecRef[]> {
  if (!cache) {
    cache = fetcher('/api/specs')
      .then((r) => (r.ok ? r.json() : null))
      .then(toSpecRefs)
      .catch(() => {
        cache = null;
        return [];
      });
  }
  return cache;
}

/** Chỉ dùng trong test — xoá cache giữa các ca. */
export function __resetSpecRefsCache(): void {
  cache = null;
}
