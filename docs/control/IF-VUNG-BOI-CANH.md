# VÙNG BỐI CẢNH — mỗi phiên một vùng, không chồng lấn

> Hoà chốt 29/08: *"đặt tên các ss với các nhiệm vụ chuyên sâu, 1 vùng bối cảnh, không chồng lấn."*
> Lý do anh nêu ngay trước đó: *"1 phiên không nên nắm ngữ cảnh quá nhiều."*
> Bằng chứng trả giá cùng ngày: [[M-59]] — một phiên ôm nghiên cứu + máy canh + tài liệu + CAD
> + cài đặt cùng lúc, và **bỏ qua đúng cái rẻ nhất**: vẽ ra mà nhìn.

## Luật vùng — ba câu, không thêm

1. **Một vùng = một tập tệp được ghi.** Hai vùng không được chạm cùng một tệp. Vùng nào cần
   tệp của vùng khác thì **báo về**, không tự sửa.
2. **Chỉ MỘT vùng được GHI SẢN XUẤT tại một thời điểm** (luật nền 2). Các vùng còn lại chạy ở
   chế độ **KHÁM** — đọc · đo · đề xuất, không commit.
3. **Control plane (`docs/control/`) không thuộc vùng nào.** Chỉ phiên chủ ghi vào đây, sau khi
   nhận báo cáo. Đây là chỗ duy nhất mọi vùng cùng nhìn ⇒ để nhiều tay ghi là đẻ phân kỳ (luật 6).

## Bảng vùng

| tên vùng | ghi được những gì | câu hỏi vùng đó sở hữu | chế độ |
|---|---|---|---|
| **Z-CAD** | `scripts/proof/tuong-tu-hinh-hoc.ts` · `docs/nc/` | đọc ngược thao tác người vẽ — tường · lỗ cửa · phòng · 3D | **GHI** |
| **Z-GIAY-PHEP** | *(khám)* | 19,1 MB GPL trong bộ cài — gỡ thế nào mà không mất khả năng đọc DWG | KHÁM |
| **Z-CONG** | *(khám)* | ba cổng `T2 · T6 · T7` đang hở — cổng nào dựng được, dựng ở đâu trên đường `npm test` | KHÁM |
| **Z-TAI-KHOAN** | *(khám)* | 90 chỗ `localStorage`, 0 bảng cài đặt — cài đặt người dùng nên sống ở đâu | KHÁM |

Vùng KHÁM đổi sang GHI khi vùng GHI hiện tại đóng lại. **Không bao giờ hai vùng GHI cùng lúc.**

## Cái mỗi vùng phải mang về

Không phải bản tóm tắt. Đúng bốn thứ, thiếu một là chưa xong:
**① số đo thật** (lệnh chạy được, không phải ước lượng) · **② tệp:dòng** cụ thể ·
**③ đường sai đã loại** kèm lý do loại · **④ một phép thử** ai chạy lại cũng ra cùng kết quả.
