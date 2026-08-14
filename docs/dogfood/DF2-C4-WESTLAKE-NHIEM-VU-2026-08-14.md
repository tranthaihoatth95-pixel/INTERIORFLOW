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

## ✅ CHECKLIST THI HÀNH — xếp theo MỨC ĐỘ (Hoà chốt 14/08: xong cái nào gạch cái đó)

- [ ] **1 · PHÒNG KHÁCH (nặng nhất — "đem bán hàng chắc ko bán dc")**: bố trí lại fur + bộ fur mix cho ăn nhau theo MỘT định hướng (C4-3)
- [x] **2 · BẾP/KHÁCH BẾP ĂN — PROOF vòng cục bộ ĐẠT (DF 14/08)**: ảnh bếp trang 294 (phối cảnh C4 bán hàng) chạy trọn vòng ✨→node Grounded→mask→phiếu duyệt→inpaint 2 mảng (mặt đảo → đá vân xám khói ĐẬM · thân đảo → nan gỗ óc chó) — sắc độ tách 3 vật liệu rõ, hết dính nhau; ĐÈN RAY GIỮ nguyên ✓, ghế/sàn/tủ ngoài mask nguyên ✓; ảnh về ĐÚNG khung slide + vào PDF xuất. 3 job fal (trần 4). Bằng chứng: scratchpad phiên DF `df2c4/bep-truoc.png` → `bep-sau3.jpg` + trang 11 `DF2-C4-out.pdf`. ⚠️ Lưu ý phạm vi: proof chạy trên ảnh 849×600 trích từ trang lưới 294 (trang render đơn khổ lớn 295-299 hiện nhập không nổi — xem findings DF2-F3/F4 báo cáo DF); bản áp thật cho C4-1 cần chạy lại trên ảnh gốc độ phân giải cao khi F3/F4 vá xong.
- [x] **3 · NỀN ĐỊNH HƯỚNG — Thẻ DNA C4 ghi NHANH (DF 14/08, GHI TAY — DNA panel chưa với tới từ vòng Trình chiếu, khai rõ)**: xem đoạn "THẺ DNA C4 (nháp tay)" cuối file. Chuẩn này đã dùng làm phiếu 4 cấp cho proof mục 2 (flag verified, nguồn = C4-1/C4-2/C4-6).
- [ ] **4 · VỆ SINH**: trẻ hoá vật liệu + trục nhấn chính-phụ (C4-4)
- [ ] **5 · PASS THỐNG NHẤT CẤP BỘ**: hết cảnh view bóng bẩy ↔ view mộc thô, hài hoà toàn tập (C4-8)
- [ ] **6 · CLOSET ("như 1 cái hẻm")**: cần đổi VIEW — ngoài vòng inpaint cục bộ → đề xuất ẨN theo chỉ đạo a T., ghi rõ trong PDF cuối (C4-5)
- [x] **7 · XUẤT PDF — vòng tròn ĐÓNG trên deck demo (DF 14/08)**: deck DF2-C4 (11 trang: 15-22 + 293-294) → `Xuất → PDF` → 11 trang đúng thứ tự, trang 11 (=trang 294 gốc) có ảnh bếp BẢN CHỈNH thay đúng vị trí đúng khung, 6 ảnh còn lại + tiêu đề nguyên vẹn. File: scratchpad phiên DF `DF2-C4-out.pdf` (3,7MB). ⚠️ 2 vấp ghi findings: tên file xuất là "Hồ sơ 2.pdf" (không theo tên sheet đã đổi "DF2-C4" — DF2-F8) · PDF xuất nướng mỗi trang thành 1 ảnh JPEG, lớp chữ sống không còn là text (DF2-F9, đối chiếu CHUAN-DAU-RA-NGHE). So trang-đối-trang FULL 477 trang chưa làm (demo chỉ 11 trang).
- [x] **Đèn ray (C4-2)** — ĐÃ CHỐT 14/08: các không gian C4 ĐỀU DÙNG → không xoá đèn ray ở bất kỳ khu nào khi chỉnh trần

Luật áp xuyên suốt (không phải mục riêng): không gian hẹp xử MẢNG LỚN, đồng nhất 1 vật liệu trên vách (C4-7) · chất lượng > số lượng (C4-9).

## CHỜ HOÀ
(hết — 2 câu cũ đã trả lời: đèn ray dùng mọi khu · phạm vi = checklist trên, xong đâu gạch đó)

## THẺ DNA C4 (nháp tay — DF ghi 14/08 từ bộ render phương án bán hàng tr.293-294; DNA panel chưa dùng được từ vòng này)
1. **Nền trung tính ấm 3 lớp sắc độ**: trần trắng sáng nhất → tường/tủ kem-greige trung → sàn đá vân xám trầm; mảng lớn đồng nhất 1 vật liệu trên vách (luật C4-7), cấm chia vụn.
2. **Điểm nhấn gỗ ấm**: óc chó/teak vân dọc ở 1-2 khối mỗi khung hình (thân đảo, vách TV, đầu giường) — là trục "chính" của nhấn chính-phụ.
3. **Kim loại + thuỷ tinh ấm**: pendant đồng/amber, đèn hắt kệ ấm 2700-3000K; **đèn ray đen mọi không gian** (Hoà chốt 14/08) = chữ ký trần, không xoá.
4. **Đá vân mạnh dùng CÓ CHỦ ĐÍCH**: mặt đảo/bàn đá vân khói đậm tương phản khối trắng kề bên — mỗi phòng đúng 1 mảng đá "nói", còn lại lặng.
5. **Vải & da nâu ghi ấm** (ghế bar, sofa, rèm) nối các phòng thành MỘT giọng — mọi phiếu chỉnh per-khu phải truy về 5 dòng này (SuggestBlend 20% DNA).
