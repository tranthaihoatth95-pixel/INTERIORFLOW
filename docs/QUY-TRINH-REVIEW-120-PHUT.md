# Quy trình review mắt IF · 120 phút (Hoà chốt 18/08)

> Đây là **nguồn sự thật** cho vòng đóng nợ mắt. Mọi audit từ nay dùng khuôn này, không tự chế thước khác. Ai định "audit khác kiểu" là vi phạm.

## Định nghĩa lại "trả nợ mắt"

**Nợ mắt** = **quyết định về HƯỚNG** ("màn này có đúng hướng không"), KHÔNG phải kiểm thao tác/edge case. Hai tiếng đủ chốt hướng + phân loại 64 mục cũ, không đủ tự tay kiểm mọi trạng thái/theme/màn hình.

**Bốn loại nợ, không trộn**:
- Chưa biết NÚT có chạy → **nợ QA**
- Chưa biết MÀN đúng hướng → **nợ mắt**
- Biết sai chưa sửa → **nợ triển khai**
- Đã sửa chưa đối chiếu → **nợ nghiệm thu lại**

## Ba nhóm phán quyết

- ✅ **Đúng hướng** — đóng nợ mắt
- 🟡 **Đúng khung, sai chi tiết** — Hoà ghi ĐÚNG MỘT CÂU lệch
- 🔴 **Sai hướng** — trả lại thiết kế, chưa bàn tiểu tiết

## Bốn câu hỏi thước đo (áp cho MỌI màn)

1. IF có đơn giản bên ngoài, sâu bên trong không?
2. Có cảm giác thật, có nghề, hay đang giống mock/demo?
3. Mỗi màn có làm rõ "tôi đang ở đâu, đang làm gì, kết quả đi đâu"?
4. Ba chặng có thực sự giống ba mặt của MỘT dự án hay ba app ghép lại?

## Bảy loại lỗi (mọi finding phải gắn vào 1 loại)

1. Giao diện
2. Chất lượng đầu ra
3. Thao tác
4. Nội dung giả
5. Gò ép / thiếu tuỳ chỉnh
6. Phân loại kém
7. Thẩm mỹ kém

## Lộ trình 120 phút

| Phút | Việc | Đầu ra |
|---|---|---|
| 0–10 | Khoá thước đo — đọc 4 câu + 7 lỗi | Sẵn sàng chấm |
| 10–25 | Shell tổng thể (Intro/Login · Home · Sidebar · Files · Library · Settings · chuyển 3 chặng) | Chốt shell 1 lần |
| 25–50 | Chặng 2D — đi 1 luồng: mở dự án → vẽ mặt bằng → chọn → gõ kích thước → gán loại/tầng/vật liệu → xem 3D → xuất | Kiến trúc thao tác 2D đúng/sai |
| 50–75 | Chặng 3D — mặt bằng → khối 3D → sửa hình → vật liệu → camera/ánh sáng → render/xuất | Đọc ra 2 cách điều khiển cùng năng lực |
| 75–95 | Trình chiếu — chọn dữ liệu → tạo hồ sơ → deck/BOQ/board → chỉnh tay → xuất PDF | Đầu ra thật hay template rời |
| 95–110 | Một nguồn — chọn 1 vật (ghế/đá): Files → định nghĩa → Library → 2D → 3D → PBR → bảng vật liệu → BOQ | Đồng bộ thật hay nhập lại |
| 110–120 | Đóng phiên · 5 bảng | Phán quyết cuối |

## 5 bảng đóng phiên (không viết 64 nhận xét rời)

1. **Phán quyết tổng** — IF thống nhất chưa · giá trị đặc trưng thấy chưa · sẵn cho người thứ 2 dùng chưa
2. **5 lỗi cấp hệ thống** — chỉ lỗi xuất hiện trên NHIỀU màn (sửa 1 lỗi hệ thống đóng nhiều finding lẻ)
3. **3 khoảnh khắc tốt nhất** — bảo vệ, không được làm mất khi sửa
4. **3 blocker trước pilot** — chỉ 3, không hơn
5. **Quyết định từng trạm** — Shell/Home/Files/Library/2D/3D/Present/Một-nguồn — mỗi trạm ✅/🟡/🔴 + 1 câu

## Điều kiện đóng nợ mắt

Sau 2 giờ, đóng được nếu:
- Mỗi bề mặt lớn có ✅/🟡/🔴
- Mọi 🟡/🔴 có ĐÚNG MỘT CÂU nói cái lệch
- Hoà không cần mô tả cách sửa
- Không còn mục "chờ Hoà nhìn" không phân loại
- Ca cần thao tác thật → chuyển **nợ QA**, thôi gọi nợ mắt

## Ràng buộc T (agent phụ)

- Chấm giúp Hoà = **đóng vai người dùng đi luồng**, chụp mỗi bước, đo bằng thước 4 câu + 7 lỗi
- **KHÔNG** thay được vai gu Hoà — nói rõ chỗ "suy từ ảnh" vs "thao tác được thật"
- Console error phải kèm **message + stack + file:line + có lặp không**
- Login xuyên suốt (không chụp mù kiểu v1)
- 2 theme sáng + tối
- Hover/focus/panel mở-đóng/ba nấc — evaluate bằng script

## Lưu ý con số

Con số "N lỗi console" không có nội dung = **vô nghĩa**. Ba lỗi giống nhau trên nhiều màn thường là lỗi nền dùng chung, không phải mỗi màn 3 bug riêng.

## Nguồn

- Hoà chốt trong chat 18/08 (chi tiết đầy đủ trên).
- Áp cho mọi phiên T + agent con từ nay.
