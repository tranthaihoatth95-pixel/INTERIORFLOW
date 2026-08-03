/**
 * lib/cad/cad-doc-hydration.ts — cờ CHIA SẺ, module-level (KHÔNG persist — tự rỗng lại mỗi lần
 * tải trang, đúng ý muốn), giữa `components/cad/CadSheets.tsx` (chủ hydrate 2D) và
 * `lib/cad/cad3d-autosave.ts` (mode "3D Thiết kế") — biết `useCadStore.doc` ĐÃ được nạp đúng cho
 * 1 bucket (dự án) trong PHIÊN JS hiện tại hay chưa.
 *
 * Vì sao cần: `/projects/[id]/cad` và `/projects/[id]/render` là HAI route riêng (không layout
 * chung) — CadSheets unmount thật khi rời `/cad`, `useCadStore` (Zustand singleton) thì KHÔNG
 * (vẫn giữ đúng `doc` trong bộ nhớ suốt phiên). Nếu mode 3D CỨ nạp lại từ IndexedDB mỗi lần mount
 * (kể cả khi vừa rời 2D millisecond trước), sẽ đụng race với autosave-lúc-rời-route vừa flush
 * (ghi IDB là async, có thể chưa xong) — ĐỌC NHẦM bản cũ, "hoàn tác" ngược đúng chỉnh sửa vừa gõ.
 * Cờ này cho biết "bucket X đã nạp đúng RỒI trong phiên này" → mode 3D tin thẳng `useCadStore`
 * hiện có, KHÔNG nạp lại — chỉ nạp lại khi bucket CHƯA từng hydrate (F5 rơi thẳng vào mode 3D,
 * chưa ghé 2D lần nào phiên này).
 */

const hydratedBuckets = new Set<string>();

export function isBucketHydrated(bucketId: string): boolean {
  return hydratedBuckets.has(bucketId);
}

export function markBucketHydrated(bucketId: string): void {
  hydratedBuckets.add(bucketId);
}

/** CHỈ DÙNG TRONG TEST — mô phỏng "phiên JS mới" (chưa bucket nào hydrate). */
export function __resetHydrationForTest(): void {
  hydratedBuckets.clear();
}
