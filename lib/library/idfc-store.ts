/**
 * lib/library/idfc-store.ts — KHO CẤU KIỆN `.idfc` tầng studio (localStorage), phiếu M-IDFC
 * VIỆC 1 (07/08): format `.idfc` (lib/cad/idfc.ts, P7 dựng) đến nay CHƯA có nơi tiêu thụ nào —
 * không nút xuất, không nút nhập, không kệ nào hiện nó (K4 chưa đóng, hàng đợi V7 của
 * M-THU-VIEN-OUT ghi rõ). File này là NỬA KHO của sợi dây: BulkIngestMode nhập `.idfc` → lưu vào
 * đây → kệ "Cấu kiện" của LibrarySheet đọc ra hiện THẬT (không phải mock ITEMS_BY_SHELF).
 *
 * Mẫu localStorage-studio đi theo `lib/materials/pbr-store.ts` / `lib/colors/store.ts` — KHÔNG
 * cột DB mới (kho 3 tầng scope='global' chưa có luật duyệt; localStorage đủ cho tầng studio hôm
 * nay, dời lên server là việc riêng — hình dạng dữ liệu giữ nguyên).
 *
 * MỘT CHIỀU (ràng buộc 1 của idfc.ts): kho này chỉ NHẬN ParsedIdfc và TRẢ ra để hiển thị/chèn —
 * không có hàm nào sửa nội dung một `.idfc` đã lưu tại chỗ (muốn đổi: nhập file mới cùng mã, đè).
 */
import type { ParsedIdfc } from '../cad/idfc';

const LS_KEY = 'if.library.idfc.v1';

export interface StoredIdfc extends ParsedIdfc {
  /** thời điểm đưa vào kho (khác meta.createdAt — lúc TẠO file ở máy nguồn) */
  storedAt: string;
}

export function loadIdfcStore(): StoredIdfc[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredIdfc[]) : [];
  } catch {
    return []; // JSON hỏng — kho rỗng, không throw giữa render
  }
}

/** Upsert theo `meta.code` (mã cấu kiện là danh tính — nhập lại cùng mã = bản mới đè bản cũ,
 * đúng ngữ nghĩa "cập nhật mẫu trong kho"). Trả về số món sau khi lưu. */
export function saveIdfcItems(items: readonly ParsedIdfc[], now = new Date()): number {
  if (typeof window === 'undefined') return 0;
  const store = loadIdfcStore();
  const byCode = new Map(store.map((s) => [s.meta.code, s]));
  for (const it of items) {
    byCode.set(it.meta.code, { ...it, storedAt: now.toISOString() });
  }
  const next = [...byCode.values()];
  window.localStorage.setItem(LS_KEY, JSON.stringify(next));
  return next.length;
}

export function removeIdfc(code: string): void {
  if (typeof window === 'undefined') return;
  const next = loadIdfcStore().filter((s) => s.meta.code !== code);
  window.localStorage.setItem(LS_KEY, JSON.stringify(next));
}
