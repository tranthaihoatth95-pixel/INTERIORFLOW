/**
 * lib/cad/idfc-identity-flag.ts — MỘT cờ duy nhất cho IDFC-INTEGRITY-001 · danh tính component.
 *
 * Vì sao tách thành module riêng thay vì đọc `process.env` ở hai nơi: cờ này phải đúng **cùng một
 * giá trị** ở CẢ HAI đầu của một sợi dây —
 *   · đầu GHI: `components/cad/LibraryDropBridge.tsx` gắn `specId` lên nét rời (chạy ở TRÌNH DUYỆT),
 *   · đầu ĐỌC: `lib/boq/compute.ts` gom nét rời theo `srcInsertId` (chạy ở CẢ hai phía —
 *     `app/api/boq/[projectId]/route.ts` trên máy chủ, `boq-custom-columns.ts` ở trình duyệt).
 * Hai đầu lệch cờ là ca tệ nhất: gắn mà không đếm (món mất khỏi BOQ như cũ) hoặc đếm mà không
 * gắn (không sao, nhưng cờ nói dối). Nên chỉ có MỘT tên biến, và nó phải là `NEXT_PUBLIC_*` —
 * biến không có tiền tố đó KHÔNG tồn tại trong bundle trình duyệt, nghĩa là cờ sẽ **luôn tắt ở
 * đầu ghi** mà không ai nhận ra.
 *
 * Mặc định TẮT ⇒ BOQ và đường thả ra y hệt hôm nay.
 */
export function idfcIdentityEnabled(): boolean {
  return process.env.NEXT_PUBLIC_IF_IDFC_IDENTITY === '1';
}
