# VERIFY-B4 — Phép thử tay: mất quyền thư mục GIỮA PHIÊN (Hoà tự làm)

> 31/07. B4 (`4.1.d`, đảo nguồn sự thật) đã verify được phần lớn bằng browser thật + handle OPFS
> thay `showDirectoryPicker()` (xem bằng chứng đủ ở `docs/IF-FEATURE-TREE.md` `4.1.d`). CHỈ 1 lớp
> không tự động hoá được trong môi trường phiên làm việc: quyền `readwrite` bị THU HỒI GIỮA MỘT
> PHIÊN ĐANG MỞ (không phải sau reload — B3 đã verify ca reload rồi) trên thư mục dự án THẬT, và
> việc Hoà TỰ SỬA TIẾP trong lúc mất quyền rồi quyền được khôi phục lại. Cần tay thật, thư mục
> thật, trình duyệt thật.

## Vì sao phải thử — điều gì đang được bảo vệ

Bài học từ sự cố 31/07 (Brand Kit): mất quyền mà không báo là **mất-dữ-liệu-im-lặng**. B4 nâng
mức rủi ro lên vì đối tượng bây giờ là **bản vẽ CAD/deck Present thật**, không chỉ Brand Kit. Quy
tắc bắt buộc đã code:
- Đĩa MỚI HƠN cache → đĩa luôn thắng (không hỏi).
- Cache MỚI HƠN đĩa (ca mất quyền — bạn sửa tiếp trong lúc app không ghi ra đĩa được) → cache
  LUÔN thắng, ĐẨY ra đĩa ngay khi có thể — **không bao giờ để đĩa cũ đè lên bản đang sửa**.
- Ghi đĩa thất bại → StatusBar hiện "⚠ Chưa ghi ra đĩa" (đỏ, không tự tắt) — không im lặng.

Phép thử dưới đây xác nhận CẢ BA điều này đúng khi mất quyền là tình huống THẬT (browser thu hồi
quyền, không phải giả lập).

## Chuẩn bị

1. Chrome/Edge, đăng nhập `demo@if.local` / `demo1234` (hoặc tài khoản thật của anh).
2. Vào `Cài đặt` → `Lưu trữ` → chọn 1 thư mục gốc THẬT trên đĩa (không phải Desktop/Documents/
   Downloads gốc — trình duyệt chặn các thư mục đó, chọn 1 thư mục con bất kỳ, vd
   `~/InteriorFlow`).
3. Bấm "Kiểm tra kết nối thư mục" — phải báo ✓ thành công trước khi thử tiếp (nếu báo lỗi, dừng
   lại, đó là vấn đề khác không thuộc phạm vi thử này).
4. Mở 1 dự án bất kỳ → chặng CAD (hoặc Present) → vẽ/sửa vài chỗ → đợi StatusBar hiện "Đĩa đồng
   bộ" (xác nhận đã ghi đĩa ít nhất 1 lần).
5. Mở Finder/File Explorer, xác nhận thấy file thật: `<thư mục gốc>/<mã dự án> — <tên>/ban-ve.idf`
   (hoặc `trinh-bay.idfp` nếu đang thử Present).

## Bước thử — mô phỏng mất quyền giữa phiên

**Cách A (khuyến nghị, gần thật nhất)**: giữ nguyên tab đang mở, vào Cài đặt hệ điều hành → thu
hồi quyền của trình duyệt với thư mục đó (macOS: System Settings → Privacy & Security → Files and
Folders → tắt quyền cho Chrome/Edge với thư mục vừa chọn). Quay lại tab CAD/Present.

**Cách B (dễ làm hơn, cũng hợp lệ)**: đổi tên hoặc di chuyển thư mục gốc ra khỏi vị trí cũ ngay
trong lúc tab vẫn đang mở (không đóng tab). Việc ghi đĩa tiếp theo sẽ thất bại vì handle cũ trỏ
vào đường dẫn không còn tồn tại — tương đương mất quyền về mặt hệ quả quan sát được.

Sau khi làm MỘT trong hai cách trên:

1. **Sửa tiếp** trong CAD/Present (vẽ thêm 1 đường, đổi 1 chữ) — đợi ~10-15 giây (nhịp ghi đĩa).
2. **Quan sát StatusBar**: phải chuyển sang "⚠ Chưa ghi ra đĩa" (đỏ). Nếu KHÔNG thấy — ĐÂY LÀ LỖI,
   dừng lại, báo ngay, đừng làm tiếp.
3. **Sửa thêm 1-2 chỗ nữa** trong lúc vẫn đang mất quyền (mô phỏng "làm việc bình thường không
   biết đĩa đang hỏng" — đúng kịch bản thực tế nhất).
4. **Khôi phục quyền**: Cách A → bật lại quyền trong System Settings. Cách B → đặt tên/vị trí thư
   mục về y hệt cũ.
5. Vào Cài đặt → Lưu trữ → bấm lại "Kiểm tra kết nối thư mục" (nút này CHÍNH LÀ đường cấp lại
   quyền, đã giải thích ở sự cố 31/07) — phải báo ✓ thành công.
6. Quay lại CAD/Present, đợi ~10-15 giây tiếp — StatusBar phải quay lại "Đĩa đồng bộ".
7. Mở file thật trong Finder (`ban-ve.idf`/`trinh-bay.idfp`) hoặc bấm "Mở tệp" nhập lại — xác nhận
   nội dung TRÊN ĐĨA khớp ĐÚNG những gì anh vừa sửa ở bước 1+3 (không thiếu, không phải bản cũ từ
   trước khi mất quyền).

## Bước thử thêm (khép vòng B4↔B2, khuyến nghị làm luôn)

8. Tải lại trang (F5) NGAY SAU bước 7 — bản vừa sửa phải hiện lại ĐÚNG (không rơi về bản cũ, không
   kẹt màn hình trắng/loading mãi). Đây là phép thử remount cho chính dự án CAD/Present THẬT của
   anh, khác đợt B2 chỉ thử trên deck mẫu.

## Nghiệm thu

| Bước | Đạt/Không | Ghi chú |
|---|---|---|
| 2. StatusBar báo lỗi đĩa RÕ RÀNG khi mất quyền (không im lặng) | | |
| 4-5. "Kiểm tra kết nối thư mục" cấp lại quyền thành công | | |
| 6-7. Đồng bộ lại đúng, KHÔNG mất nội dung sửa trong lúc mất quyền | | |
| 7. Đĩa chứa bản MỚI (không phải bản cũ đè lên) | | |
| 8. Reload lại đúng, không kẹt/không rơi về bản cũ | | |

**"Chưa ghi ra đĩa" không hiện ở bước 2, hoặc bước 7 cho thấy đĩa có bản CŨ HƠN những gì vừa sửa —
KHÔNG được tính là đạt, báo ngay, đừng tự cho qua.**
