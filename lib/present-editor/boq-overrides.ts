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
  matId: string;
  field: BoqOverrideField;
  value: number;
  at: number;
}

export function overrideKey(matId: string, field: BoqOverrideField): string {
  return `${matId}::${field}`;
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
    const m2Ov = overrides[overrideKey(row.matId, 'm2')];
    const donGiaOv = overrides[overrideKey(row.matId, 'donGia')];
    if (!m2Ov && !donGiaOv) return row;

    const m2 = m2Ov ? m2Ov.value : row.m2;
    const donGia = donGiaOv ? donGiaOv.value : row.donGia;
    const thanhTien = Math.round(m2 * (1 + row.haoHutPhanTram / 100) * donGia);

    const out: BoqDisplayRow = { ...row, m2, donGia, thanhTien };
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
  return { ...map, [key]: { matId, field, value, at: now } };
}

/** Revert 1 field về số máy — xoá override khỏi map. */
export function revertOverride(map: BoqOverrideMap, matId: string, field: BoqOverrideField): BoqOverrideMap {
  const key = overrideKey(matId, field);
  if (!(key in map)) return map;
  const { [key]: _omit, ...rest } = map;
  return rest;
}
