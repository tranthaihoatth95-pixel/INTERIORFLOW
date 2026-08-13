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

## LÀN MÁY — render ST5 (13/08 sáng, 11 job fal qua đúng hàm submitJob của app)

**F2 🔴 [bug app · chốt được] Node sketch2render/clay2render hỏng control:** field `control_image_url` đúng,
nhưng ① node truyền `guidance_scale` mặc định **15** — FLUX chuẩn 3.5-4, mức 15 phá control;
② không truyền `image_size` khớp ảnh → fal ép landscape_4_3, depth/canny map méo → mất bám khối
(tái hiện: v1 làn máy lệch bố cục hoàn toàn; sửa 2 tham số → v4-v6 bám chuẩn). → mở phiếu sửa
`lib/nodes/registry.ts` (guidance theo model + image_size từ ảnh control).
**F3 [kỹ thuật] img2img strength 0.6-0.84 bị NEO tông clay tối** (v2-v3) — với clay tối muốn ra sáng
phải đi control-net, không đi img2img. **F4 [quy trình] clay phẳng ít cạnh → depth yếu**: lobby cần
canny; corridor depth ổn; **wireframe TỰ DỰNG (hộp 1 điểm tụ, chỉ đường thẳng) làm control canny =
chế độ "tham khảo THIẾT KẾ"** — đổi thiết kế giữ tỉ lệ không gian, chạy đẹp ngay v1 (cab).
**Spec bổ sung node tổng (Hoà chốt miệng trong buổi):** 2 CHẾ ĐỘ THAM KHẢO — ①tham khảo TONE (giữ
vật liệu/hình khối, lấy sắc độ-ánh sáng-nước hình) ②tham khảo THIẾT KẾ (wireframe giữ không gian,
đổi đường nét theo ref); + KHOÁ SẮC ĐỘ 3 LỚP (sàn đậm nhất · vách trung gian · trần trắng nhất)
là tham số cấp đợt; + seed chung cả đợt. **F5 [giới hạn model] "đậm" dễ bị gán nhầm lên tường**
(v6/v7 corridor ra wainscot dù prompt cấm) — node tổng nên có preset "khoá sắc độ" viết sẵn đã test.
Kết quả giao Hoà: sảnh thang v6 · hành lang v5 · cab 2 view v1. Nợ kế: upscale 300dpi ảnh được chọn
+ Sửa vùng xoá lỗi nhỏ (số 3 lặp) + import kết quả vào kho ST5.
