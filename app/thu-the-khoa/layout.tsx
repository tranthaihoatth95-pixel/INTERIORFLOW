import { notFound } from 'next/navigation';

/**
 * CỔNG CHẶN PHÁT HÀNH — màn này là MẪU SỐNG NỘI BỘ, không phải bề mặt sản phẩm.
 *
 * Cùng khuôn với `app/dev-bench-3d-2/layout.tsx` (lượt audit 23/08 dựng ra, bịt 4 route dev).
 * ⚠️ VÌ SAO CÓ THÊM TỆP NÀY, VÀ VÌ SAO ĐÓ LÀ BÀI HỌC:
 * `app/thu-the-khoa` được tạo ngày 29/08 — SAU lượt audit — nên nó KHÔNG có chốt. Chú thích của
 * bản audit liệt kê đích danh bốn route, và danh sách viết bằng tay thì không tự lớn theo repo.
 * Đo 30/08: 4/5 route có chốt, route mới nhất là route hở. Luật không có cổng thì luật chỉ giữ
 * được đúng những thứ có mặt lúc luật ra đời.
 * ⇒ Kèm theo tệp này là `scripts/soi-route-dev.mjs` — nó ĐẾM, không đọc danh sách tay.
 *
 * Layout là SERVER component nên `notFound()` chạy TRƯỚC khi trang client dựng — bản phát hành
 * trả 404 thật, không phải giấu bằng CSS. Giữ nguyên ở dev: đây là mẫu sống đang dùng.
 */
export default function Layout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === 'production') notFound();
  return <>{children}</>;
}
