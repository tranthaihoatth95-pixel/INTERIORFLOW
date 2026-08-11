# ⛔ CHUẨN ĐẦU RA NGHỀ — LUẬT CỨNG cho MỌI SẢN PHẨM IF XUẤT RA (lập 11/08/2026)

> Hoà đặt bài: *"chưa một lần đặt ra tiêu chuẩn khắt khe của ngành làm luật cứng — thế nào là
> chuẩn sản phẩm của một cỗ máy được tối ưu sâu cho ngành nghề."*
> Bài học sinh ra luật: 11/08 lần đầu MỞ FILE ĐẦU RA bằng mắt (layout.pdf) — engine đủ giải
> phẫu bản vẽ nghề nhưng chết vì 3 lỗi trình bày (chữ đè hình · tỷ lệ 1:47 · khung tên lộ
> jargon). Kiểm code không bắt được loại lỗi này — chỉ CHUẨN ĐẦU RA + MỞ FILE mới bắt được.
>
> **LUẬT NGHIỆM THU MỚI (đứng trên mọi phiếu):** frontier nào sinh sản phẩm xuất được thì
> nghiệm thu = MỞ FILE ĐẦU RA soi theo checklist dưới — tsc/test/screenshot KHÔNG đủ.
> Mỗi gạch đầu dòng là điều kiện NHỊ PHÂN (đạt/trượt), ưu tiên máy chặn được.

## §1 · BẢN VẼ KỸ THUẬT (PDF · DXF · in) — khuôn ISO 128 / TCVN 8-30 / thói quen hồ sơ VN

**Tỷ lệ & khổ giấy**
- [ ] Tỷ lệ THUỘC DÃY CHUẨN: 1:1 · 1:2 · 1:5 · 1:10 · 1:20 · 1:25 · 1:50 · 1:100 · 1:200 · 1:500.
      Fit-trang phải BẮT về nấc chuẩn gần nhất (về phía nhỏ hơn) — cấm in số lẻ kiểu "1:47".
- [ ] Khổ giấy đúng ISO 216 (A0–A4), khung viền đủ, mép gáy 20mm khi hồ sơ đóng tập.

**Khung tên** (đọc Brand Kit dự án — không hardcode)
- [ ] Đủ 9 ô: tên dự án · hạng mục · tên bản vẽ · MÃ SỐ bản vẽ · tỷ lệ · ngày · người vẽ ·
      người kiểm · revision. Thiếu ô nào = trượt.
- [ ] KHÔNG jargon nội bộ trong tên bản vẽ (bắt được: "(đã rà công năng)" 11/08).

**Chữ & nhãn**
- [ ] Chiều cao chữ khi IN: dim ≥1.8mm · nhãn phòng ≥2.5mm · tiêu đề ≥3.5mm.
- [ ] Nhãn KHÔNG đè hình học, KHÔNG đè nhau — máy phải né hoặc dùng leader
      (bắt được: "PHÒNG NGỦ" gạch qua giường, "WC 3.6m²" đè thiết bị, 11/08).
- [ ] Nhãn phòng kèm diện tích m² 1 số lẻ; đơn vị dim là mm KHÔNG ghi hậu tố.

**Kích thước (dim)**
- [ ] Dim nằm NGOÀI hình, chuỗi thẳng hàng, tổng ở lớp ngoài cùng
      (bắt được: chuỗi 1850/850/1700/1290/510 nằm trong phòng + chồng nhau, 11/08).
- [ ] Không dim trùng lặp cùng một cạnh; không dim đè trục/bong bóng trục.

**Nét & ký hiệu**
- [ ] Lineweight theo bảng (đã có LineweightTable): tường cắt ~0.5 · thấy ~0.25 · dim/hatch 0.13.
- [ ] In THỬ trắng-đen vẫn phân biệt được mọi lớp (không dựa vào màu).
- [ ] Đủ ký hiệu tối thiểu: cửa có cánh mở · cốt ±0.000 · hoa gió · trục bong bóng · thước tỷ lệ.
- [ ] Poché tường cắt nhất quán toàn bản vẽ.

## §2 · ẢNH RENDER / PHỐI CẢNH
- [ ] ≥300dpi tại khổ in đích (LUAT-300DPI đã có — nay là một dòng của chuẩn này).
- [ ] Tầm mắt 1500–1650mm trừ khi chủ đích ghi rõ góc khác; đứng thẳng 2 điểm tụ (không đổ tường).
- [ ] Soi 100%: không artifact AI (tay ghế biến dạng, vân trôi, chữ giả); không watermark.
- [ ] sRGB; ảnh trong hồ sơ có mã img_ + provenance (từ scene/recipe nào).

## §3 · BOQ / BẢNG TÍNH (XLSX)
- [ ] Mỗi dòng đủ: mã · tên · ĐƠN VỊ CHUẨN (m²/m/cái/bộ) · khối lượng · đơn giá · thành tiền.
- [ ] Khối lượng TRUY được về bản vẽ (provenance); số sửa tay phải mang badge sửa-tay.
- [ ] Đơn giá có NGUỒN + NGÀY; wastage khai rõ %, không cộng ngầm.
- [ ] Tổng cộng khớp tổng dòng; không ô trống lặng lẽ; số tabular, VND không lẻ đồng.
- [ ] File mở bằng Excel thật không lỗi, không mất định dạng cột.

## §4 · DECK / HỒ SƠ TRÌNH CHIẾU (PDF · PPTX)
- [ ] Chữ body ≥18pt cho trình chiếu; tương phản đạt AA trên MỌI nền ảnh (autoColor P6a).
- [ ] Ảnh đủ pixel cho khổ xuất (không vỡ); chữ trong PPTX SỬA ĐƯỢC sau xuất.
- [ ] Brand Kit dự án áp đúng (logo/màu/font khách) — 0 vết thương hiệu studio khác.
- [ ] 0 placeholder sót: `{{ }}` · lorem · "Untitled" · ảnh xám mẫu.
- [ ] Trang có số trang + revision hồ sơ.

## §5 · VĂN BẢN / HỒ SƠ GIẤY (khi editor Văn bản ra đời — chuẩn viết TRƯỚC, đúng luật §9)
- [ ] Font nhúng trong PDF; lề chuẩn; >10 trang phải có mục lục; số trang từ trang 2.
- [ ] Biến động (tên dự án/khách/ngày) điền từ dữ liệu dự án — 0 chỗ gõ tay trùng lặp.

## §6 · CƠ CHẾ THI HÀNH — hai tầng, rẻ
1. **Máy chặn lúc xuất** (mở rộng `lib/print/export-checks.ts` đã có): tỷ lệ ∉ dãy chuẩn ·
   khung tên thiếu ô · nhãn giao hình học (bbox test) · placeholder sót · dpi thiếu · tổng BOQ
   lệch → chặn kèm lý do + nút sửa. Marker code: `CHUAN_DAU_RA`.
2. **Mắt người theo checklist** — dialog xuất hiện checklist §1-§5 thu gọn; người xuất tick.
   Registry frontier: mọi entry sinh file xuất phải kèm dòng "nghiệm thu = mở file".

> Luật này là con đẻ của LUẬT 300DPI + §2c chống-ngô-nghê + LUẬT NGÔN NGỮ — gom về MỘT cửa:
> sản phẩm ra khỏi IF là mang chuẩn nghề, không mang dấu "máy làm".
