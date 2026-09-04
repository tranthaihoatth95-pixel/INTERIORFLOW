/**
 * lib/library/tai-ve-json.ts — ĐƯA MỘT CHUỖI JSON XUỐNG MÁY NGƯỜI DÙNG, một đường duy nhất.
 *
 * VÌ SAO TÁCH (03/09): thao tác này sắp có HAI nơi gọi — nút "Xuất .idfc" của tấm Thư viện
 * (`LibrarySheet.tsx:1128`, đã chạy thật) và nút "Xuất JSON" của trang tổng. Chép lần thứ hai là
 * đúng thứ `may-soi-dong-dang` sinh ra để bắt (tín hiệu ③: cùng một chuỗi thao tác ở hai nơi).
 *
 * 🔧 SỬA LUÔN MỘT LỖI THẦM CỦA BẢN CHÉP TAY: bản cũ gọi `URL.revokeObjectURL()` NGAY sau
 * `a.click()`. Trình duyệt đọc blob ở lượt sự kiện kế tiếp, nên thu hồi ngay có thể cắt ngang
 * đúng lúc nó đang đọc — tệp lớn thì tải hụt hoặc không tải gì, và hỏng KHÔNG BÁO. Ở đây thu hồi
 * sau một nhịp: đủ để trình duyệt cầm được dữ liệu, vẫn không rò bộ nhớ.
 */

/** Tên tệp an toàn cho cả ba hệ điều hành: bỏ ký tự cấm, không để rỗng, không thành tệp ẩn. */
export function tenTepAnToan(ten: string, macDinh = 'if-export'): string {
  const sach = ten.replace(/[\\/:*?"<>|]/g, '-').replace(/^\.+/, '').trim();
  return sach === '' ? macDinh : sach;
}

/** Đưa `json` xuống máy dưới tên `fileName`. Không có `document` (SSR/test) ⇒ không làm gì. */
export function taiVeJson(json: string, fileName: string): void {
  if (typeof document === 'undefined') return;
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = tenTepAnToan(fileName);
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
