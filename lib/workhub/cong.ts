/**
 * lib/workhub/cong.ts — CỔNG cho bề mặt `/workhub` (`IF-WORKHUB-CONTAINMENT-001`, 27/08).
 *
 * ── VÌ SAO CÓ TỆP NÀY ──────────────────────────────────────────────────────────────────────────
 * Lane `IF-UXUI-RUNTIME-001` đo được trên runtime thật: `/workhub` **mở được khi chưa đăng nhập**,
 * chào đích danh *"Chào Hoa"*, hiện một ngày **đóng băng** ("Thứ Hai, 17 tháng 8"), và nhúng
 * `outlook.office.com` · `pinterest.com` · `chat.zalo.me` · `microsoft365.com` · `canva.com` ·
 * `youtube.com` bằng `<iframe>`.
 *
 * Ba thứ sai, mỗi thứ một loại:
 *   ① **Tên riêng nhúng cứng** — vi phạm thẳng LUẬT NỀN TẢNG (`CLAUDE.md`): IF là sản phẩm toàn
 *      cầu, trung tính; không nhúng cứng tên người hay studio nào. Một studio khác mở app ra và
 *      được chào bằng tên người lạ.
 *   ② **Bề mặt chưa xác thực** — `middleware.ts` cố ý chỉ chạy trên `/api/*` (xem docstring của
 *      nó), nên **không route trang nào** có lưới đỡ. `/workhub` không tự kiểm phiên ⇒ ai cũng mở.
 *   ③ **iframe ra miền ngoài ở mặc định sản xuất** — mở một cửa ra ngoài trong chính vỏ app.
 *
 * ── ĐÂY LÀ CÔ LẬP, KHÔNG PHẢI THIẾT KẾ LẠI ─────────────────────────────────────────────────────
 * Hoà chốt: **không xoá route, không xoá dữ liệu**. Chỉ đóng ba lỗ trên, additive và lùi được
 * bằng biến môi trường. Verdict của `/workhub` **chỉ nâng khi có bằng chứng runtime**.
 *
 * ── VÌ SAO KHÔNG DÙNG MIDDLEWARE ───────────────────────────────────────────────────────────────
 * Nới `middleware.ts` ra trang là áp lưới lên **mọi** trang, gồm cả cửa đăng nhập và các trang
 * công khai có chủ ý ⇒ gãy chính đường vào. Nên: **canh tại trang**, đúng chỗ, có test.
 */

/** Cờ chính. Chưa đặt ⇒ `/workhub` KHÔNG phục vụ. Mặc định TẮT là chủ ý. */
export function workhubBat(): boolean {
  return process.env.NEXT_PUBLIC_IF_WORKHUB === '1';
}

/**
 * Cờ RIÊNG cho việc nhúng miền ngoài. Tách khỏi cờ chính có chủ ý: bật `/workhub` để xem bố cục
 * là một quyết định; mở một cửa ra `outlook.office.com` ngay trong vỏ app là **một quyết định
 * khác, nặng hơn**. Gộp hai cờ là buộc người bật phải nhận cả hai mà không biết.
 */
export function workhubNhungNgoaiBat(): boolean {
  return process.env.NEXT_PUBLIC_IF_WORKHUB_EXTERNAL === '1';
}

/** Ba trạng thái của cổng — **tách bạch**, đúng trục mà lane UX đo được là đã sập ở nơi khác. */
export type TrangThaiCong =
  /** cờ chưa bật — KHÔNG phải lỗi, KHÔNG phải thiếu quyền. */
  | 'chua-bat'
  /** cờ bật nhưng chưa có phiên đăng nhập. */
  | 'chua-dang-nhap'
  /** đủ điều kiện. */
  | 'mo';

export function trangThaiCong(daDangNhap: boolean): TrangThaiCong {
  if (!workhubBat()) return 'chua-bat';
  if (!daDangNhap) return 'chua-dang-nhap';
  return 'mo';
}
