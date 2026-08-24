# THAM CHIẾU · FIGMA

## BÀI TOÁN CON NGƯỜI
Nhiều người làm chung trên một mặt phẳng vô hạn, mà vẫn biết **ai đang ở đâu**, **thứ nào là bản
gốc**, và **sửa một chỗ thì cái gì đổi theo**.

## CÁI GÌ CHẠY ĐƯỢC
- **Một sidebar có CHỮ**, không phải rail icon câm — cả Figma lẫn Keynote/Final Cut đều thế.
- **Inspector chỉ hiện khi có vùng chọn.**
- **Dock công cụ nổi ở DƯỚI** thay cho một thanh 20 icon ở trên.
- **Component / instance / override**: một định nghĩa, nhiều bản chèn, mỗi bản đè được cục bộ.
- **Hiện diện người khác**: con trỏ có tên, màu riêng.
- Bảng lệnh gõ nhanh, phím tắt hiện ngay cạnh lệnh.

## VÌ SAO CHẠY ĐƯỢC
Vì nó **giảm số phần tử nhìn thấy được** mà không giảm năng lực: thứ chỉ dùng khi có vùng chọn thì
chỉ hiện khi có vùng chọn. Và vì mô hình *định nghĩa → bản chèn → đè cục bộ* trả lời được câu đắt
nhất của mọi kho tài sản: **sửa bản gốc thì ai đổi theo, và ai được giữ nguyên.**

## LUẬT CHUNG
*Ít phần tử thấy được hơn, không ít năng lực hơn · công cụ theo ngữ cảnh · một định nghĩa nhiều bản
chèn · dạy phím tắt tại chỗ dùng.*

## CÁI GÌ RIÊNG CỦA HỌ
Mô hình cộng tác thời gian thực đầy đủ (đắt: máy chủ, đồng bộ, giải xung đột) · canvas vector vô hạn
· hệ plugin · văn hoá "mọi người đều xem được".

## LẤY GÌ CHO IF
- **Sidebar có chữ + inspector theo vùng chọn + dock dưới** — IF đã áp: vỏ 2D rút **55 → 26** phần
  tử nhìn thấy được.
- **Định nghĩa → bản chèn → đè cục bộ** cho cấu kiện: bản chèn **giữ liên kết VÀ giữ đè cục bộ**;
  đổi một món trong dự án A **không** được đổi món mẫu của cả kho — muốn đổi mẫu gốc phải vào Thư
  viện, **có xác nhận**.
- **Ghi đè thắng biến thể** (đã chốt 19/08: hiệu lực = mẫu → biến thể → ghi đè).
- **Thay món mà GIỮ NGUYÊN VỊ TRÍ**, và câu hỏi *"đang dùng ở đâu"* phải trả lời được.
- Phím tắt hiện trong menu.

## KHÔNG LẤY GÌ
- **Cộng tác thời gian thực đầy đủ theo kiểu Figma** — IF đã chốt hướng khác: **chủ đầu tư KHÔNG vào
  hệ bình luận**; luồng khách giữ truyền thống. Thứ IF làm là **cổng duyệt nội bộ**.
- Văn hoá xem-được-hết · hệ plugin · canvas vector vô hạn như một đích tự thân.

## IF DIỄN GIẢI
Figma trả lời *"sửa một chỗ, cái gì đổi theo"* cho **hình**. IF phải trả lời câu đó cho **hình + số
+ tiền + tiến độ** cùng lúc — đổi vật liệu một cái ghế thì bản vẽ 2D · phối cảnh 3D · hồ sơ khách ·
bảng khối lượng · thời gian đặt hàng **cùng đổi**. Đó là chỗ IF đi xa hơn, và cũng là chỗ IF **nợ
nhiều nhất** (định danh vật liệu còn đứt ở mắt cuối — xem `product/material.md`).

⚠️ Và một chi tiết Figma làm mà IF phải làm **ngược lại**: Figma cho kéo giãn panel tự do. IF **cấm
kéo giãn tự do cho widget** — chỉ ba cỡ định sẵn, vì đó là điều kiện để cùng một widget chạy trên
máy tính · tablet · điện thoại.
