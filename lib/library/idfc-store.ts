/**
 * lib/library/idfc-store.ts — KHO CẤU KIỆN `.idfc` tầng studio, phiếu M-IDFC
 * VIỆC 1 (07/08): format `.idfc` (lib/cad/idfc.ts, P7 dựng) đến nay CHƯA có nơi tiêu thụ nào —
 * không nút xuất, không nút nhập, không kệ nào hiện nó (K4 chưa đóng, hàng đợi V7 của
 * M-THU-VIEN-OUT ghi rõ). File này là NỬA KHO của sợi dây: BulkIngestMode nhập `.idfc` → lưu vào
 * đây → kệ "Cấu kiện" của LibrarySheet đọc ra hiện THẬT (không phải mock ITEMS_BY_SHELF).
 *
 * ⚠️ W0.3 (19/08, FINAL-AUDIT A-4): kho canonical DỜI localStorage → IndexedDB
 * (`lib/storage/studio-persist.ts`, tái dùng DB `interiorflow-sheets`). Lý do: clear-site-data /
 * trần 5MB của localStorage = mất tài sản studio vĩnh viễn. Chữ ký public GIỮ NGUYÊN (sync) —
 * cache-in-memory + hydrate async, đúng khuôn sheets-persist. Bản localStorage cũ (`if.library.
 * idfc.v1`) chỉ còn là CẦU đọc-một-lần lúc di trú, KHÔNG ghi mới vào đó nữa, và KHÔNG bị xoá.
 *
 * MỘT CHIỀU (ràng buộc 1 của idfc.ts): kho này chỉ NHẬN ParsedIdfc và TRẢ ra để hiển thị/chèn —
 * không có hàm nào sửa nội dung một `.idfc` đã lưu tại chỗ (muốn đổi: nhập file mới cùng mã, đè).
 */
import type { ParsedIdfc } from '../cad/idfc';
import { createStudioBlobStore } from '../storage/studio-persist';

/** Key localStorage CŨ — chỉ đọc làm cầu di trú, không ghi mới. */
const LS_KEY = 'if.library.idfc.v1';
const IDB_ROUTE = '/studio-idfc';

export interface StoredIdfc extends ParsedIdfc {
  /** thời điểm đưa vào kho (khác meta.createdAt — lúc TẠO file ở máy nguồn) */
  storedAt: string;
}

function readLegacy(): StoredIdfc[] | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredIdfc[]) : undefined;
  } catch {
    return undefined; // JSON hỏng — coi như chưa có, không throw giữa render
  }
}

const store = createStudioBlobStore<StoredIdfc[]>({
  route: IDB_ROUTE,
  readLegacy,
  empty: [],
  parse: (v) => (Array.isArray(v) ? (v as StoredIdfc[]) : undefined),
});

/** Chờ IDB nạp xong (UI cần dữ liệu tươi nhất thì await rồi gọi loadIdfcStore lại). */
export function hydrateIdfcStore(): Promise<void> {
  return store.hydrate();
}

export function loadIdfcStore(): StoredIdfc[] {
  return store.get();
}

/** Upsert theo `meta.code` (mã cấu kiện là danh tính — nhập lại cùng mã = bản mới đè bản cũ,
 * đúng ngữ nghĩa "cập nhật mẫu trong kho"). Trả về số món sau khi lưu. */
export function saveIdfcItems(items: readonly ParsedIdfc[], now = new Date()): number {
  if (typeof window === 'undefined') return 0;
  const byCode = new Map(store.get().map((s) => [s.meta.code, s]));
  for (const it of items) {
    byCode.set(it.meta.code, { ...it, storedAt: now.toISOString() });
  }
  const next = [...byCode.values()];
  store.set(next);
  return next.length;
}

export function removeIdfc(code: string): void {
  if (typeof window === 'undefined') return;
  store.set(store.get().filter((s) => s.meta.code !== code));
}

/* ---------------- XUẤT .json (W0.3 — năng lực trước, nút UI gọi sau, luật 7) ---------------- */

export interface IdfcStoreExport {
  version: 1;
  exportedAt: number;
  items: StoredIdfc[];
}

/** Xuất TOÀN BỘ kho cấu kiện studio thành chuỗi JSON (backup tay / đem sang máy khác). */
export function exportIdfcStoreJson(): string {
  const pkg: IdfcStoreExport = { version: 1, exportedAt: Date.now(), items: loadIdfcStore() };
  return JSON.stringify(pkg, null, 2);
}

/** Test-only: reset cache để mô phỏng phiên trình duyệt mới. */
export function __resetIdfcStoreForTest(): void {
  store.__resetForTest();
}
