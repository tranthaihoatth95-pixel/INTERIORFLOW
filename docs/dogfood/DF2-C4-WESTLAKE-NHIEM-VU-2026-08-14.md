# DOGFOOD #2 · SỔ NHIỆM VỤ — căn C4 Westlake: comment sếp → phiếu chỉnh per-khu → PDF chuẩn chỉnh

> Nguồn: 6 ảnh chat Hoà gửi 14/08 (T chưng cất — tên người viết tắt theo luật trung tính).
> File gốc: `~/Downloads/260810_Westlake-Residential_Public-...-FULL.pdf` (47 trang, KHÔNG đưa vào repo — CONTENT-RULES).
> Giá trị cuối Hoà chốt: **file PDF thay chuẩn chỉnh các hình phối cảnh đã sửa** — vòng tròn
> PDF→deck→Grounded Render→thay-đúng-chỗ→XUẤT PDF MỚI (entry demo-pdf-render-roundtrip).

## BẢNG PHIẾU ĐIỀU CHỈNH (comment sếp V. + a T., 07:18-07:40 hôm nay)

| # | Khu (trang ~) | Comment nguyên ý | Ý định chỉnh (dịch sang mảng Grounded) | Mức |
|---|---|---|---|---|
| C4-1 | Bếp/khách bếp ăn (~tr.16) | "Vật liệu quá mờ nhạt vì các sắc độ cứ DÍNH NHAU, bộ màu phối ko sang. Chưa thấy góc này cải thiện" | tách sắc độ 3 lớp trần/tường/sàn (đúng khoá-sắc-độ đã có trong spec node tổng); đảo tương phản đảo bếp ↔ tủ; mảng: sàn đá + mặt đảo + tủ bếp | mạnh |
| C4-2 | Bếp | "Xem lại ĐÈN RAY a D. cho dùng ở khu nào và khu nào ko dùng" | kiểm/loại đèn ray ở khu không được duyệt — mảng trần; cần Hoà xác nhận danh sách khu được dùng đèn ray | hỏi Hoà |
| C4-3 | Phòng khách | "Bố trí fur + chọn fur MIX KO ĂN. Đem bán hàng chắc ko bán dc" | thay/đồng bộ bộ fur theo MỘT định hướng (mảng fur từng món qua mask); tham chiếu 2 không gian được khen của team | mạnh |
| C4-4 | Vệ sinh | "Quá GIÀ CŨ, thiếu sắc độ nhấn chính phụ" | trẻ hoá vật liệu + lập trục nhấn chính-phụ (mảng vách + sàn + mặt lavabo) | vừa |
| C4-5 | Closet | "Ko ổn — hẹp thì có giải pháp hoặc đặt VIEW để giải quyết, đằng này như 1 CÁI HẺM" | đổi GÓC MÁY/view (không phải chỉ vật liệu) — vượt phạm vi inpaint, cần render lại góc → ghi nhận là ca NGOÀI vòng chỉnh cục bộ, đề xuất ẩn bớt theo chỉ đạo a T. | ẩn/hoãn |
| C4-6 | Toàn bộ | "Mix xào từ nhiều căn — KO thành 1 sản phẩm có ĐỊNH HƯỚNG cụ thể… final C4 phong cách là gì anh ko nhận biết được" | GỐC BỆNH = thiếu Thẻ DNA định hướng → trước khi chỉnh từng ảnh phải CHỐT 1 định hướng (Thẻ DNA C4) làm chuẩn cho mọi phiếu áp — đúng SuggestBlend 20% DNA | nền |
| C4-7 | Toàn bộ | "Ko gian hẹp: xử lý MẢNG LỚN, đồng nhất 1 vật liệu trên vách" (nguyên tắc sếp) | luật áp khi chỉnh: mảng vách gộp 1 vật liệu, không chia vụn | luật |
| C4-8 | Toàn bộ | "Diễn vật liệu đang RỐI: view quá bóng bẩy, view quá mộc thô — ko hài hoà" | pass thống nhất finish/ánh sáng CẤP BỘ (B6 pass thống nhất + kiểm sắc độ) sau khi chỉnh từng ảnh | bộ |
| C4-9 | Chỉ đạo a T. | "Sửa cái CÓ THỂ sửa, chưa đạt thì ẨN BỚT. Chất lượng > số lượng" | phạm vi demo: chọn 4-6 ảnh sửa được bằng vòng cục bộ (C4-1,3,4) + danh sách đề xuất ẩn (C4-5...) | phạm vi |
| C4-10 | Ghi nhận | "Trong cả bộ anh chỉ thấy KO GIAN NÀY ổn" (+2 ảnh tham chiếu team làm được khen) | các ảnh được khen = ẢNH THAM KHẢO B cho phiếu đọc 4 cấp — chuẩn nội bộ, không lấy mẫu ngoài | chuẩn |

## LUỒNG DEMO (khi D1+D2 về, T chạy end-to-end)
1. Import PDF FULL → deck (lớp chữ + LỚP ẢNH phả hệ D1) — soi trang bếp/khách/vệ sinh có element ảnh đúng bbox.
2. Lập Thẻ DNA C4 nhanh từ 2 ảnh được khen (C4-10) — làm chuẩn 20% DNA cho phiếu.
3. Với C4-1/3/4: bấm "Chỉnh phối cảnh ✨" từng ảnh → node Grounded chặng 2 → mask mảng theo bảng trên → phiếu duyệt → inpaint → ảnh về ĐÚNG CHỖ trong deck (D2).
4. Pass kiểm sắc độ cấp bộ (C4-8) — tối thiểu soi mắt theo khoá 3 lớp.
5. **Xuất PDF mới từ deck** (exportDeckToPdf sẵn) — file giá trị cuối, so trang-đối-trang với bản gốc.
6. Sổ findings DF2-F* như ST5; C4-2 chờ Hoà trả lời khu nào được dùng đèn ray.

## CHỜ HOÀ
① Danh sách khu ĐƯỢC/KHÔNG được dùng đèn ray (C4-2) ② gật phạm vi "sửa 4-6 ảnh + ẩn phần chưa đạt" theo chỉ đạo a T. (C4-9).
