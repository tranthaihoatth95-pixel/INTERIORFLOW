import { notFound } from 'next/navigation';

/**
 * CỔNG CHẶN PHÁT HÀNH — màn này là BÀN THỬ NỘI BỘ, không phải bề mặt sản phẩm.
 *
 * Vì sao có tệp này: một lượt audit chỉ-đọc 23/08 đếm được **4 route dev/demo vẫn nằm trong cây
 * route sản phẩm** (`/dev-bench-3d-2` · `/demo/ghe-3d` · `/thu-be-mat` · `/thu-trang-thai`).
 * Chúng không có lối vào từ giao diện, nên không ai thấy — nhưng trong bản đóng gói thì **ai gõ
 * đúng đường dẫn là vào được**, và thứ họ thấy là bàn thử với dữ liệu bịa. Đúng họ lỗi "có mặt
 * mà không ai biết là có mặt".
 *
 * 🔴 CẬP NHẬT 31/08 — QĐ-1 "demo sạch": BA route kia đã bị XOÁ HẲN (`/demo/ghe-3d` ·
 * `/thu-be-mat` · `/thu-trang-thai`, cùng `/thu-the-khoa` mọc sau lượt audit). Danh sách bốn
 * route ở trên nay là LỊCH SỬ, không phải hiện trạng — giữ lại vì nó là lời chứng cho vì sao
 * cổng này tồn tại. Chốt chặn không còn là cách xử duy nhất: xoá mạnh hơn chặn, vì thứ không
 * có trong cây thì không cần ai nhớ chặn nó.
 * `/dev-bench-3d-2` được GIỮ vì nó là bàn thử đang dùng thật, và nó có cổng này.
 *
 * Cách chặn: layout là SERVER component, nên `notFound()` chạy TRƯỚC khi trang client được dựng —
 * bản phát hành trả 404 thật, không phải giấu bằng CSS.
 * Giữ nguyên ở môi trường dev: đây là bàn thử đang dùng, xoá đi là mất công cụ.
 *
 * ⚠️ Muốn biến màn này thành bề mặt sản phẩm thật thì XOÁ tệp này có chủ ý,
 * đừng lách bằng cách đổi biến môi trường.
 *
 * Máy canh đếm cây thư mục, không đọc danh sách nào: `node scripts/soi-route-dev.mjs --chan`.
 */
export default function Layout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === 'production') notFound();
  return <>{children}</>;
}
