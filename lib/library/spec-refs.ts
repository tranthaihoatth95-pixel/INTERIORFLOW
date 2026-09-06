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

let cache: Promise<unknown> | null = null;

/**
 * G4 · MOAT (04/09) — HÌNH LÁT DÀY HƠN `SpecRef`, cho ô CHỌN VẬT LIỆU ở chặng 2D.
 *
 * ⚠️ Vì sao EXTEND tệp này chứ không mở tệp mới: đây đã là "nơi nạp `ProductSpec` dùng chung", và
 * hai danh sách phải đến từ **CÙNG MỘT lượt fetch** — nếu ô chọn vật liệu tự fetch riêng thì nó và
 * `resolveLibraryItem` có thể nhìn hai ảnh chụp khác nhau của kho, đúng loại lệch mà cả tệp này
 * sinh ra để chống. `toSpecRefs` giữ NGUYÊN 2 trường (có test khoá đúng điều đó).
 *
 * `id` là `ProductSpec.id` — khoá BẤT BIẾN mà `HatchEntity.specId` neo vào. `sku` là business key
 * (ATLAS được phép sync đổi) ⇒ **chỉ để hiện cho người đọc**, không bao giờ dùng làm danh tính.
 * KHÔNG chép giá đi đâu khác: `priceVnd` ở đây chỉ để người dùng thấy mình đang chọn hàng nào
 * trước khi bấm — vật liệu vẫn TRỎ TỚI bản ghi thương mại qua `id`, không mang giá theo mình
 * (luật 2.1.9.i, 30/07).
 */
export interface MaterialPick {
  /** `ProductSpec.id` — thứ ghi xuống `HatchEntity.specId`. */
  id: string;
  /** 05/09 (V8c bước 4) — `ProductSpec.matId`, **UUID** IF sở hữu, thứ ghi xuống `Base.matId` và
   * là khoá 3D tra vật liệu PBR. KHÁC `id` ở trên (cuid) — xem `Base.matId` trong `lib/cad/model.ts`.
   * `null` = bản ghi kho chưa backfill matId ⇒ entity không nhận danh tính vật liệu, 3D rơi về màu
   * phẳng. Đó là SỰ THẬT của bản ghi đó, KHÔNG bịa UUID từ cuid để lấp chỗ trống. */
  matId?: string | null;
  name: string;
  sku: string | null;
  /** màu chủ đạo do kho khai (`ProductSpec.colorHex`) — null = kho chưa khai, KHÔNG bịa màu. */
  colorHex: string | null;
  unit: string | null;
  /** null = kho chưa có giá. Hiện "—", KHÔNG đoán giá (cùng luật `computeBoq`). */
  priceVnd: number | null;
}

/** Rút hình lát dày cho ô chọn vật liệu. Bản ghi thiếu `id` bị LOẠI — cùng lý do `toSpecRefs`:
 * một dòng không có id thì không gán được cho entity nào. Chỉ nhận `kind === 'material'`; món rời
 * (ghế/đèn) đi đường Thư viện, không phải ô tô vật liệu. */
export function toMaterialPicks(raw: unknown): MaterialPick[] {
  const arr = (raw as { specs?: unknown })?.specs;
  if (!Array.isArray(arr)) return [];
  const out: MaterialPick[] = [];
  for (const s of arr) {
    const o = s as Record<string, unknown>;
    if (typeof o?.id !== 'string' || o.id === '') continue;
    if (o.kind !== 'material') continue;
    const gia = typeof o.priceVnd === 'number' && Number.isFinite(o.priceVnd) ? o.priceVnd : null;
    out.push({
      id: o.id,
      matId: typeof o.matId === 'string' && o.matId ? o.matId : null,
      name: typeof o.name === 'string' && o.name ? o.name : o.id,
      sku: typeof o.sku === 'string' ? o.sku : null,
      colorHex: typeof o.colorHex === 'string' && o.colorHex ? o.colorHex : null,
      unit: typeof o.unit === 'string' ? o.unit : null,
      priceVnd: gia,
    });
  }
  return out;
}

/** Danh sách vật liệu chọn được của kho — CÙNG lượt fetch với `loadSpecRefs`. Không bao giờ ném
 * (cùng lý do đã ghi ở `loadSpecRefs`): kho hỏng thì panel hiện danh sách rỗng kèm lý do, người
 * dùng vẫn vẽ được. */
export function loadMaterialPicks(fetcher: Fetcher = fetch): Promise<MaterialPick[]> {
  return loadRaw(fetcher).then(toMaterialPicks);
}

function loadRaw(fetcher: Fetcher): Promise<unknown> {
  if (!cache) {
    cache = fetcher('/api/specs')
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => {
        cache = null;
        return null;
      });
  }
  return cache;
}

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
  return loadRaw(fetcher).then(toSpecRefs);
}

/** Chỉ dùng trong test — xoá cache giữa các ca. */
export function __resetSpecRefsCache(): void {
  cache = null;
}
