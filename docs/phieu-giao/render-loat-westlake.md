# PHIẾU GIAO · RW — RENDER 5 VIEW WESTLAKE C4 (giữ nguyên thiết kế, chỉ nâng ánh sáng + chất vật liệu)

## THẺ VAI [Đ4]
- VAI: RW — agent làn máy, chạy loạt render thật cho Hoà theo luật đã chốt.
- PHẠM VI: chỉ CHẠY (script scratchpad + đường fal sẵn có) + ghi kết quả vào `~/Downloads/WESTLAKE-C4-RENDER/ket-qua/` + báo cáo. KHÔNG sửa code app. ⛔ KHÔNG đụng components/render-studio (agent RQ đang làm).
- **TRẦN CHI PHÍ: 5 job** (1 job/view). Vượt = dừng, báo T.

## ① LUẬT CỨNG HOÀ CHỐT (đọc kỹ, vi phạm = hỏng task)
GIỮ NGUYÊN THIẾT KẾ — cấm đổi/thêm/bớt đồ, bố cục, vật liệu, hình dạng. CHỈ nâng: ánh sáng thật
(hướng + GI + bóng mềm + đèn bật có quầng ấm) · chất vật liệu thật (vân gỗ, sợi vải, hạt đá,
phản chiếu satin) · sắc độ 3 lớp tách bạch (trần sáng > tường trung > sàn/thảm đậm) · nước hình sạch.
Ảnh ra phải nhận ra NGAY là cùng căn phòng đó.

## ② ĐẦU VÀO
`~/Downloads/WESTLAKE-C4-RENDER/loat-A-screenshot/V1..V5.jpg` (5 screenshot SketchUp).
Mô tả tham chiếu: `docs/dogfood/DF4-PHIEU-ANH-XA-D5.md` mục A (4 cấp T đã đọc từ 2 ảnh D5 thật)
— dùng làm nội dung prompt về ÁNH SÁNG + CHẤT LIỆU. Ngăn `tham-chieu-B/` có thể trống: chấp nhận,
dùng mô tả; nếu CÓ file `CHUAN-TONE-*` thì đo pixel lấy sắc độ/WB chính xác hơn (ưu tiên).

## ③ CÁCH CHẠY
1. Nhận diện từng view (V1 khách+vách TV · V2 khách sofa · V3 phòng ăn · V4/V5 bếp) — soi ảnh trước khi viết prompt, prompt riêng từng view theo ĐÚNG đồ có trong ảnh đó.
2. Dùng đường render có control image của repo (`lib/ai/models.ts` — task sketch2render/clay2render hoặc tương đương): **control = chính screenshot**, guidance/denoise THẤP để giữ hình học (theo hằng CONTROL_GUIDANCE_DEFAULT đã chốt), image_size khớp tỉ lệ gốc.
3. Prompt: CHỈ tả ánh sáng + chất liệu + nước hình (theo mục A phiếu DF4). Bài học F7 (DF2): **KHÔNG viết mệnh lệnh "giữ nguyên X"** vào prompt — làm model trơ; giữ hình học bằng control+strength, không bằng chữ.
4. **CÙNG seed cho cả 5 view** (nhất quán bộ) — ghi seed vào báo cáo.
5. Lưu `ket-qua/V1-render.jpg`…`V5-render.jpg` + `ket-qua/doi-chieu.html` (ghép trước/sau từng view để soi mắt).
6. **Tự soi mắt từng ảnh** trước khi khai xong: đúng phòng đó không? mất đồ nào không? sắc độ thảm/sàn có đậm hơn vách không? — ảnh nào lệch luật thì ghi rõ, KHÔNG tô hồng.

## ⑦
Báo cáo `docs/bao-cao-phien/2026-08-14-RW-render-loat.md`: model+seed+tham số, bảng 5 view đạt/lệch theo luật, số job dùng, đường dẫn ảnh. Trả T ≤10 dòng.
