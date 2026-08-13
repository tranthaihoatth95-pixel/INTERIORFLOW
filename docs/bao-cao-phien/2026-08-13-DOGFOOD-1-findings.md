# VÒNG NGƯỜI DÙNG THẬT #1 — sổ vướng (task: deck ST5 PDF→sửa→PPTX) · 13/08/2026

> Người dùng: Hoà (chủ trì). Task thật: deck concept ST5 Sảnh thang–Hành lang (16 trang) —
> nhập PDF, dàn lại bố cục, thay 2 phối cảnh (render lại từ mặt đứng), xuất PPTX.
> T ghi từng vướng theo khuôn [bug] / [lệch thiết kế] / [thiếu năng lực].

## F1 🔴 [lệch thiết kế · nặng] "Giao diện quá rối rắm — đang gấp không biết đường mà lần"
- Ngữ cảnh: Hoà mở Trình chiếu, định nhập file cho task (ảnh chụp 08:24 13/08).
- Chẩn đoán T từ ảnh: ① toolbar 2 hàng ~20 nút NGANG CẤP, không phân biệt 3 việc chính của
  người đang gấp (Nhập → Sửa → Xuất) với việc phụ (shape/mũi tên/16:9/lưới); ② banner
  "máy học gu bắt đầu lại" chiếm mặt tiền panel trái (noise, không phải việc); ③ cột phải
  LỚP(0)+Nền slide+9 swatch+«Tạo việc từ đây» hiện cả khi slide TRỐNG — chưa có gì để chỉnh;
  ④ empty-state canvas trắng không dẫn lối (trái luật X2 "empty state làm được việc").
- Bệnh gốc (cấp app, không riêng Trình chiếu): **UI liệt kê CÔNG CỤ, không dẫn THEO VIỆC** —
  thiếu tầng "lối vào theo việc" cho người gấp. Khớp lời chê 13/08 "luồng thao tác chung chưa
  tối ưu" — phần LUỒNG của đợt Giao diện thống nhất chưa làm.
- Xử lý: tầng 1 sửa NÓNG màn Trình chiếu (entry `present-task-first`): empty-state 3 lối to
  giữa canvas (Nhập tệp · Dàn từ mẫu · Trang trống) · toolbar phân cấp còn ~6 nút chính + nhóm
  gộp · banner học-gu dời vào menu · panel phải chỉ hiện khi có phần tử được chọn/slide có nội
  dung. Tầng 2: chuẩn "LUỒNG THEO VIỆC" toàn app (nghiên cứu + spec, áp cả 2D/3D) — entry
  `luong-theo-viec` mở, thi công đợt kế.

## Chuẩn bị input task (T làm xong 13/08 sáng)
- PDF ST5: cấu trúc 10 trang nội dung; text THẬT moi được (unpdf) → Smart Convert bậc 1 sẽ ăn.
- Moi từ PDF đủ bộ ảnh gốc full-res (không cần Hoà chụp lại): 2 phối cảnh render HIỆN TẠI
  (hành lang · sảnh thang, watermark) + mặt đứng sảnh thang 2251×817 + 2 mặt đứng hành lang.
- Spec vật liệu thật cho prompt render: inox hộp xám xước mờ · gạch Viglacera NY18 GC15904
  150×900 · cửa gỗ EP-02 · sơn EPA-04.
- FAL_KEY đã cấu hình (node Sketch→Ảnh thật chạy được thật).
