# PHIẾU GIAO · LP — LOOK PROFILE: ánh xạ 1 ảnh tham chiếu → thông số ĐO ĐƯỢC → áp NHẤT QUÁN cả loạt

> Hoà giao 14/08 (luồng công việc thật): *"render 1 loạt ảnh chụp màn hình không gian 3D nội thất,
> vật liệu đầy đủ, với CÙNG 1 hình tham chiếu → ánh xạ giá trị về thông số ánh sáng, chi tiết,
> màu sắc vật liệu → render giống tinh thần ánh xạ đấy cho LOẠT ảnh."*
> Đây là Grounded Render CẤP BỘ: điểm sống-chết là NHẤT QUÁN GIỮA CÁC ẢNH, không phải đẹp lẻ 1 tấm.

## THẺ VAI [Đ4]
- VAI: LP — agent lõi Grounded Render, xây tầng LookProfile (đo → ánh xạ → áp loạt → kiểm nhất quán).
- PHẠM VI/TRẦN: `lib/grounded-render/look-profile.ts` + test (MỚI) · `lib/grounded-render/types.ts`
  CHỈ THÊM type (không đổi type cũ) · script proof scratchpad · báo cáo.
  ⛔ KHÔNG đụng `region-inpaint.ts`/`reference-sheet.ts` ruột (chỉ GỌI) · KHÔNG đụng components ·
  KHÔNG đụng lib/idfc-import (2 agent khác đang ở đó).
- CHI PHÍ: **0 job fal ở phần ĐO** (thuần pixel). Phần áp thử: tối đa **2 job** trên đúng 2 ảnh để
  chứng minh nhất quán — không chạy cả loạt khi chưa có Hoà duyệt phiếu [bài học 14/08].
- ĐIỀU KHOẢN RUỘT: [T6] "ánh xạ giá trị về thông số" = SỐ ĐO ĐƯỢC, cấm mô tả chữ suông ·
  [T5] phiếu trình người duyệt TRƯỚC khi áp loạt · [T2] tái dùng phiếu-4-cấp + mask sẵn có.

## ① NGUYÊN LIỆU PROOF (có sẵn trên đĩa, KHÔNG cần Hoà gửi thêm)
- Ảnh tham chiếu B: chọn 1 ảnh nội thất chất lượng cao trong `~/Downloads/ANH-THAM-KHAO/` (chọn ảnh
  có đủ trần/tường/sàn + ánh sáng rõ; ghi tên file đã chọn).
- "Loạt ảnh" A: 4-6 ảnh cùng một không gian/dự án trong `~/Downloads/ST5-input/` hoặc
  `~/Downloads/ST5-input/nhom anh tham khao/` (ưu tiên ảnh screenshot 3D/render nội thất cùng bộ).
  Nếu không đủ đồng bộ, ghi rõ đã chọn gì và vì sao.

## ④ VIỆC — LookProfile 4 phần
1. **ĐO ảnh tham chiếu → `LookProfile` (thuần pixel, tất định):**
   - **Ánh sáng**: khoá SẮC ĐỘ 3 LỚP (median luminance vùng trần / tường / sàn — chia vùng theo
     dải ngang ước lượng hoặc mask nếu có; ghi rõ cách chia), tỉ số tương phản giữa 3 lớp,
     hướng sáng ước từ gradient sáng ngang, độ gắt (độ dốc chuyển sáng-tối), độ sáng tổng (EV lệch).
   - **Màu**: nhiệt độ màu/WB (tỉ lệ R:G:B vùng trung tính), độ bão hoà trung vị, palette 5 màu
     chủ đạo (k-means) + tỉ trọng, sắc độ da/gỗ nếu tách được.
   - **Chi tiết**: độ sắc (variance of Laplacian), mức grain/noise, độ mịn chuyển sắc (banding),
     ước DOF (sắc trung tâm vs rìa).
   → tất cả ra SỐ + đơn vị, kèm ngưỡng dung sai khuyến nghị cho mỗi thông số.
2. **PHIẾU ÁNH XẠ** (`ProposalSheet`-tương thích, khuôn đã có ở reference-sheet): trình bảng
   "thông số đo được → giá trị đích áp cho loạt", mỗi dòng sửa được, cờ `inferred`, người duyệt
   mới đi tiếp. Kèm 2-3 PHƯƠNG ÁN cường độ áp (bám sát 100% / cân bằng 70% / gợi hướng 40%) —
   KHÔNG tự chọn hộ [bài học phê bình 14/08].
3. **ÁP CHO LOẠT** (`applyLookToBatch`): mỗi ảnh trong loạt — ①chỉnh tất định trước (WB/exposure/
   contrast/saturation về đích, thuần pixel, 0 credit) ②nếu cần AI thì gọi đường inpaint/relight
   SẴN CÓ với **cùng preset + cùng seed cả loạt** (đây là chốt nhất quán). Proof chỉ chạy 2 ảnh.
4. **PostGate NHẤT QUÁN**: sau khi áp, ĐO LẠI từng ảnh và so với LookProfile đích → bảng lệch
   từng thông số/từng ảnh + kết luận đạt/không theo dung sai. Đây là bằng chứng "loạt ảnh nhất
   quán", không nói mồm.

## ⑤ OUTPUT (scratchpad)
`look-profile.json` (thông số đo) · `look-phieu.md` (phiếu ánh xạ 3 phương án) · ảnh trước/sau của
2 ảnh proof · `look-consistency.md` (bảng PostGate) · nếu rẻ: 1 ảnh ghép contact-sheet cả loạt
sau khi chỉnh tất định (0 credit) để soi nhất quán bằng mắt.

## ⑥ NGHIỆM THU
tsc 0 · test thuần cho phần đo (ảnh fixture tự sinh: gradient/WB lệch biết trước → đo phải ra đúng
±2%) · test cũ lib/grounded-render không vỡ · **tự soi mắt** contact-sheet trước khi khai xong.

## ⑦
Báo cáo `docs/bao-cao-phien/2026-08-14-LP-look-profile.md`: bảng thông số ảnh tham chiếu · phiếu ·
bảng nhất quán trước/sau · nhận định thật (thông số nào áp tất định là đủ, thông số nào bắt buộc
cần AI) · phần chưa làm. Trả T ≤12 dòng.
