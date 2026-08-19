/**
 * lib/present-editor/boq-overrides.ts — B5 (`docs/PHIEU-TRINH-BOQ-EDITOR.md`): LIVE-LINK =
 * TRIGGER-FORMULA. Sửa tay 1 ô (m² hoặc đơn giá) là LỚP PHỦ HIỂN THỊ trên `BoqRow` do
 * `lib/boq/compute.ts` tính ra — KHÔNG ghi ngược vào Doc, KHÔNG sửa `computeBoq`. Dòng chưa sửa
 * tay chạy qua NGUYÊN VẸN số máy; dòng đã sửa tay giữ giá trị người dùng + tự tính lại `thanhTien`
 * từ giá trị đó, cùng công thức `roundVnd(m2×(1+haoHụt%)×đơnGiá)` của `compute.ts`.
 *
 * QUYẾT ĐỊNH TỰ CHỌN (khác 1 chữ so với phiếu, có lý do — §0 LUẬT TRUNG THỰC): phiếu mô tả
 * `BoqOverride` có field `machineValue` PERSIST cùng override. Ở đây `machineValue` CHỈ tính LIVE
 * (lấy từ `BoqRow` mới nhất mỗi lần áp override), KHÔNG lưu snapshot cũ — lưu snapshot dễ sinh lỗi
 * "hiện số máy cũ" nếu bản vẽ đổi TIẾP sau lần sửa tay đầu; so trực tiếp với lần tính mới nhất
 * luôn đúng và đơn giản hơn, vẫn khớp mọi nghiệm thu B5 (badge/cảnh báo/revert đều dùng số máy
 * HIỆN TẠI). Phần PERSIST xuống IDB (`BoqOverride`) chỉ giữ đúng field cần để khôi phục override,
 * không có `machineValue`.
 *
 * File này CHỈ chứa phần THUẦN (test được bằng sucrase-node — không import giá trị chạy-được nào
 * qua alias `@/`, sucrase-node không resolve alias, xem `boq-overrides.test.ts`). Phần đọc/ghi
 * IDB tách sang `boq-overrides-persist.ts` (import cả 2 file này từ UI, không đụng gì nhau).
 */
import type { BoqRow } from '../boq/model';

export type BoqOverrideField = 'm2' | 'donGia';

/** 1 override đã lưu — `at` = epoch ms lúc sửa, hiện ở Inspector "Sửa lúc". */
export interface BoqOverride {
  /** ⭐ W0.2 (19/08) — tên đúng bản chất: `ProductSpec.id` (= `BoqRow.specId`). Optional vì bản
   * ghi IDB CŨ chỉ có `matId`; `normalizePersistedOverride` điền đủ cả hai khi load. */
  specId?: string;
  /** @deprecated dùng `specId`. Thực chất là `ProductSpec.id`, KHÔNG phải matId UUID canonical
   * (`lib/materials/matid-identity.ts`) — xem docblock `BoqRow.matId`. GIỮ vì đã persist xuống
   * IndexedDB dưới tên này; compat window ghi CẢ HAI field (xem `setOverride`). */
  matId: string;
  field: BoqOverrideField;
  value: number;
  at: number;
}

/** Khoá map override. THAM SỐ là GIÁ TRỊ `ProductSpec.id` (`BoqRow.specId` — tên tham số giữ
 * `matId` vì mọi caller UI đang truyền `row.matId`, cùng giá trị). Định dạng khoá `${id}::${field}`
 * KHÔNG ĐỔI ở W0.2 — vì thế override đã lưu trước 19/08 áp đúng row mà không cần migrate khoá. */
export function overrideKey(matId: string, field: BoqOverrideField): string {
  return `${matId}::${field}`;
}

/**
 * ⭐ W0.2 (19/08) — chuẩn hoá 1 bản ghi override ĐỌC TỪ IDB về hình dạng compat-window (có ĐỦ
 * `specId` lẫn `matId`, cùng giá trị). Nhận được:
 *  · bản CŨ  `{matId, field, value, at}`            (persist trước 19/08)
 *  · bản MỚI `{specId, matId, field, value, at}`     (persist từ 19/08)
 *  · bản chỉ-specId (phòng xa — nguồn tương lai)
 * Trả `null` cho bản ghi hỏng (thiếu id/field lạ/value không hữu hạn) — KHÔNG ném, kho hỏng 1
 * dòng không được giết cả map. Idempotent: normalize(normalize(x)) ≡ normalize(x).
 * THUẦN — persist (`boq-overrides-persist.ts`) gọi hàm này; test bằng sucrase-node tại đây.
 */
export function normalizePersistedOverride(raw: unknown): BoqOverride | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<BoqOverride> & { specId?: unknown; matId?: unknown };
  const id = typeof r.specId === 'string' && r.specId
    ? r.specId
    : typeof r.matId === 'string' && r.matId ? r.matId : null;
  if (!id) return null;
  if (r.field !== 'm2' && r.field !== 'donGia') return null;
  if (typeof r.value !== 'number' || !Number.isFinite(r.value)) return null;
  const at = typeof r.at === 'number' && Number.isFinite(r.at) ? r.at : 0;
  return { specId: id, matId: id, field: r.field, value: r.value, at };
}

export type BoqOverrideMap = Record<string, BoqOverride>;

/** Thông tin hiển thị 1 override đang áp — `machineValue` LUÔN live (xem quyết định đầu file). */
export interface BoqOverrideInfo {
  value: number;
  machineValue: number;
  at: number;
}

export interface BoqDisplayRow extends BoqRow {
  m2Override?: BoqOverrideInfo;
  donGiaOverride?: BoqOverrideInfo;
}

/**
 * Áp override lên kết quả `computeBoq` — THUẦN, không đọc IDB. Dòng không override trả về Y NGUYÊN
 * tham chiếu gốc (không tạo object mới) để UI/test so sánh identity biết dòng nào KHÔNG bị đụng.
 */
export function applyBoqOverrides(rows: BoqRow[], overrides: BoqOverrideMap): BoqDisplayRow[] {
  return rows.map((row) => {
    // W0.2 (19/08): tra bằng `specId` (tên đúng); `?? matId` phòng row deserialize từ nguồn cũ
    // chưa có field mới. Hai field LUÔN cùng giá trị trên row do computeBoq sinh.
    const rowKey = row.specId ?? row.matId;
    const m2Ov = overrides[overrideKey(rowKey, 'm2')];
    const donGiaOv = overrides[overrideKey(rowKey, 'donGia')];
    if (!m2Ov && !donGiaOv) return row;

    const m2 = m2Ov ? m2Ov.value : row.m2;
    const donGia = donGiaOv ? donGiaOv.value : row.donGia;
    const thanhTien = Math.round(m2 * (1 + row.haoHutPhanTram / 100) * donGia);

    // `qty` đi KÈM `m2` (xem docblock `BoqRow.m2`: chúng luôn là MỘT con số, `unit` mới nói nó là
    // m² hay cái). Không cập nhật `qty` ở đây thì mọi thứ đọc `qty` (xuất xlsx, hồ sơ FF&E) sẽ
    // dùng số MÁY trong khi bảng hiện số người dùng vừa sửa — đúng kiểu lệch âm thầm G-M3-09.
    const out: BoqDisplayRow = { ...row, m2, qty: m2, donGia, thanhTien };
    if (m2Ov) out.m2Override = { value: m2Ov.value, machineValue: row.m2, at: m2Ov.at };
    if (donGiaOv) out.donGiaOverride = { value: donGiaOv.value, machineValue: row.donGia, at: donGiaOv.at };
    return out;
  });
}

/** Grand-total ĐÃ áp override — KHÔNG dùng `result.totalAmount` gốc (đó là số máy thuần). */
export function totalWithOverrides(rows: BoqDisplayRow[]): number {
  return rows.reduce((sum, r) => sum + r.thanhTien, 0);
}

/** Đếm cho sidebar "Lấy từ mô hình N / Đã sửa tay M" (mock `mock-trinh-bay.html` §Nguồn số liệu) —
 * 1 dòng có ÍT NHẤT 1 field override tính là "đã sửa tay" (khớp cách đếm ô, không đếm field). */
export function countOverrideStatus(rows: BoqDisplayRow[]): { fromModel: number; handEdited: number } {
  let handEdited = 0;
  for (const r of rows) if (r.m2Override || r.donGiaOverride) handEdited += 1;
  return { fromModel: rows.length - handEdited, handEdited };
}

/** Đặt/xoá 1 override — hàm thuần tiện dụng cho UI (immutable update). `value` NaN/không hữu hạn
 * → coi như revert (xoá override), không lưu giá trị hỏng vào IDB. `now` truyền vào bởi caller
 * (component gọi `Date.now()`) — giữ hàm này THUẦN/test được, không tự đọc giờ hệ thống. */
export function setOverride(
  map: BoqOverrideMap,
  matId: string,
  field: BoqOverrideField,
  value: number,
  now: number,
): BoqOverrideMap {
  const key = overrideKey(matId, field);
  if (!Number.isFinite(value)) {
    if (!(key in map)) return map;
    const { [key]: _omit, ...rest } = map;
    return rest;
  }
  // W0.2 (19/08) — ghi CẢ HAI field cùng giá trị trong compat window: code cũ đọc `matId` vẫn
  // thấy, code mới đọc `specId` cũng thấy; bản IDB ghi ra tự thành hình dạng mới mà không cần
  // một lượt migrate riêng. Rollback = code cũ đọc lại vẫn chạy nguyên (nó chỉ nhìn `matId`).
  return { ...map, [key]: { specId: matId, matId, field, value, at: now } };
}

/** Revert 1 field về số máy — xoá override khỏi map. */
export function revertOverride(map: BoqOverrideMap, matId: string, field: BoqOverrideField): BoqOverrideMap {
  const key = overrideKey(matId, field);
  if (!(key in map)) return map;
  const { [key]: _omit, ...rest } = map;
  return rest;
}
