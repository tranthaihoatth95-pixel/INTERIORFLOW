/**
 * lib/materials/pbr-store.ts — KHO PBR THEO matId, tầng STUDIO (localStorage), VIỆC 5 PHẦN B 07/08.
 *
 * VÌ SAO localStorage chứ không cột DB: `ProductSpec` là bảng THƯƠNG MẠI — nhồi PBR vào là phá
 * luật 2.1.9.i (30/07, đã chốt); còn thêm bảng/cột mới thì dẫm đúng quả mìn migrate đang treo
 * (2 cột `room`/`confidence` chưa `db push`, xem cảnh báo đỏ trong `prisma/schema.prisma` — thêm
 * cột nữa lúc này là chồng mìn). Mẫu "studio = localStorage" đi theo `lib/colors/store.ts`
 * (05/08) đã chạy thật. Khi Hoà chạy migrate xong, dời kho này lên server là việc RIÊNG — hình
 * dạng dữ liệu (Record<matId, MaterialPbr>) giữ nguyên, chỉ đổi chỗ đặt.
 *
 * KHOÁ = matId. matId của IF **CHÍNH LÀ `ProductSpec.sku`** (cột "Mã vật liệu" ATLAS,
 * `atlas-material-map.ts` `ATLAS_FIELD_NAMES.sku`) — TÁI DÙNG mã ATLAS sẵn có, không đẻ hệ mã
 * thứ hai (chỉ đạo phiếu P13 VIỆC 1). Cùng mã này `LibrarySheet` đã dùng để khớp
 * `SheetItem.code ↔ ProductSpec.sku` (M-THU-VIEN-OUT VIỆC 3) — một mã xuyên ba mảnh.
 */
import type { MaterialPbr } from './schema';

const LS_KEY = 'if.materials.pbr.v1';

/** Chuẩn hoá matId trước khi làm khoá — cùng phép so `sku` nơi khác: trim + UPPER (mã ATLAS viết
 * hoa, người gõ tay hay lẫn thường). */
export function normalizeMatId(matId: string): string {
  return matId.trim().toUpperCase();
}

export function loadPbrMap(): Record<string, MaterialPbr> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, MaterialPbr>) : {};
  } catch {
    return {}; // JSON hỏng — coi như kho rỗng, KHÔNG throw giữa render
  }
}

export function getPbr(matId: string): MaterialPbr | null {
  return loadPbrMap()[normalizeMatId(matId)] ?? null;
}

export function savePbr(matId: string, pbr: MaterialPbr): void {
  if (typeof window === 'undefined') return;
  const map = loadPbrMap();
  map[normalizeMatId(matId)] = pbr;
  window.localStorage.setItem(LS_KEY, JSON.stringify(map));
}

/** Xoá bản chỉnh của 1 matId (KS4 — lùi về "chưa có PBR", suy đoán lại từ danh mục nếu cần). */
export function removePbr(matId: string): void {
  if (typeof window === 'undefined') return;
  const map = loadPbrMap();
  delete map[normalizeMatId(matId)];
  window.localStorage.setItem(LS_KEY, JSON.stringify(map));
}
