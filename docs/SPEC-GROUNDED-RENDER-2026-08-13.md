# SPEC · GROUNDED RENDER — thuật toán render BÁM Ý kiến trúc sư (Hoà đặt bài 13/08)

> Bệnh gốc (Hoà chẩn đúng cơ chế diffusion): ảnh A = trọng tâm, ảnh B = tham khảo → model chỉ
> lấy tham số chung chung gần giống A rồi TRỘN TOÀN CỤC → kết quả chung chung, "chỉnh không
> được, mô tả lại cũng không xong". Bằng chứng thật: 15 job dogfood ST5 13/08 (findings F2-F5).
>
> Nguyên lý chữa: **KHÔNG BAO GIỜ trộn hai ảnh toàn cục. Mọi giá trị chỉ được chuyển theo
> TỪNG MẢNG ĐÃ ĐỊNH DANH, qua mask cứng, với mức bám riêng từng mảng.** Muốn vậy thuật toán
> phải HIỂU + THỂ HIỆN RA những gì nó đọc được để KTS duyệt trước khi áp (explainable).

## 1 · Định vị (Hoà chốt — thành luật)

- Grounded Render phục vụ **CONCEPT**: idea nhanh/chính xác theo mẫu/mood để trình CĐT —
  **KHÔNG có giá trị technical thi công**.
- Technical thi công = mode **Dựng khối 3D** với tham số chính xác (BuildRecipe/Doc).
- **Sứ mệnh 2 mode chặng 2**: Node (Dựng ảnh) = concept có kiểm soát · 3D = sự thật kỹ thuật.
  Khớp SPEC-CHANG2-UI-2MODE; từ nay mô tả 2 mode theo câu này.

## 2 · Thuật toán — 6 bước, mỗi bước đều có preview/sửa/undo (luật 6+8)

```
A = ảnh/khung TRỌNG TÂM (thiết kế của mình)      B = ảnh THAM KHẢO
┌─────────────────────────────────────────────────────────────────┐
│ B1 · ĐỌC KHUNG A (grounding hình học)                           │
│  tiêu cự · góc view · điểm tụ · đường chân trời · hộp không gian│
│  → TÀI SẢN CÓ SẴN: lib/vision/single-view-metrology.ts (958     │
│    dòng, tính đúng các giá trị này) + wireframe hộp tụ (F4)     │
├─────────────────────────────────────────────────────────────────┤
│ B2 · WIRE-COLOR MẢNG A (định danh cấp pixel)                    │
│  segmentation → mỗi mảng một MÀU + một ĐỊNH DANH có nền:        │
│  sàn / tường trái·phải·cuối / trần / cửa / panel / fur / đèn    │
│  mảng nào máy suy → cờ inferred, KTS sửa được từng vùng          │
│  → CÓ SẴN: BiRefNet (Cắt nền) · idmask-core.ts · mask Sửa vùng; │
│    THÊM: model segment (SAM2 qua fal) cho đa mảng               │
├─────────────────────────────────────────────────────────────────┤
│ B3 · ĐỌC B RA PHIẾU 4 CẤP (explainability — điều làm KTS yên tâm)│
│  ①tổng thể (tone·ánh sáng·nước hình) ②trần/tường/sàn (sắc độ    │
│  từng lớp — khoá 3 lớp nằm ở đây) ③mảng vật liệu ④chi tiết/     │
│  cấu kiện/fur — máy PHẢI TRÌNH phiếu này ra, KTS duyệt/sửa      │
│  từng dòng TRƯỚC khi áp                                          │
│  → CÓ SẴN: DistillEngine (lib/distill — cờ 3 nấc + nguồn) +      │
│    Bảng gu node + khuôn Thẻ DNA 8 lớp                            │
├─────────────────────────────────────────────────────────────────┤
│ B4 · BẢNG ÁNH XẠ MẢNG↔MẢNG + NÚM MỨC BÁM (bảng editor Hoà tả)   │
│  mỗi mảng A một DÒNG: [mảng A] ← lấy gì từ [cấp/mảng B] · núm    │
│  0-100% · hoặc gán matId từ Thư viện (spec thật đè tham khảo)    │
│  Trọng số giá trị khi máy đề xuất dòng: 70% nguyên lý chuẩn      │
│  ngành (lib/cad/standards + CHUAN-THIET-KE-v7.6) · 20% tư duy    │
│  KTS (Thẻ DNA dự án) · 10% đặc trưng dự án/gu CĐT (Project       │
│  Profile + Company DNA Pack) — sửa được, không hộp đen           │
├─────────────────────────────────────────────────────────────────┤
│ B5 · SINH THEO MẢNG (không trộn toàn cục)                        │
│  từng mảng inpaint RIÊNG với mask cứng của nó + control khung    │
│  B1 (wireframe/canny/depth, guidance 3.5-4, image_size khớp —    │
│  fix F2) + seed chung đợt → mảng nào hỏng chạy lại RIÊNG mảng đó │
├─────────────────────────────────────────────────────────────────┤
│ B6 · PASS THỐNG NHẤT ÁNH SÁNG + KIỂM                             │
│  IC-Light (node Đổi ánh sáng có sẵn) chạy cuối để bóng đổ/GI     │
│  nhất quán; máy kiểm lại phiếu B3 vs kết quả (sắc độ 3 lớp đúng  │
│  chưa) → lệch thì báo, không ship im (luật 8)                    │
└─────────────────────────────────────────────────────────────────┘
```

**Kéo-thả giới hạn vùng (Hoà yêu cầu, đúng hành vi nghề):** KTS vẽ/kéo các ĐƯỜNG THEO KHÔNG
GIAN (bám điểm tụ/chân trời từ B1, không phải lasso tự do) để giới hạn vùng áp — về bản chất là
SỬA mask B2 bằng ngôn ngữ phối cảnh. Engine: mask editor sẵn có + snap theo đường tụ B1.

## 3 · Vì sao hết "chung chung" — trả lời thẳng chẩn bệnh

1. B không bao giờ vào model như "ảnh tham khảo mù" — nó được ĐỌC RA THAM SỐ CÓ ĐỊNH DANH
   (phiếu 4 cấp), và chỉ tham số được KTS DUYỆT mới đi tiếp.
2. Việc áp diễn ra TRONG TỪNG MASK — mảng sàn không thể "lây" lên tường (hết bệnh v6/v7
   corridor: "đậm" nhảy lên tường thành wainscot).
3. Mức bám là NÚM TỪNG MẢNG chứ không phải một strength toàn ảnh (hết bệnh v2-v3: strength
   thấp thì neo tông cũ, cao thì mất thiết kế).
4. Khung hình học (tiêu cự/tụ/chân trời) đo bằng toán — metrology, không nhờ model "đoán".

## 4 · Bậc thang thi công (trung thực về độ khó)

| Bậc | Gồm | Dựa trên | Trạng thái |
|---|---|---|---|
| v0 (tuần này) | mask bán tự động (Cắt nền + vẽ tay) · inpaint theo mảng · phiếu đọc B do máy sinh dạng text duyệt được · fix F2 node | toàn đồ có sẵn | phục vụ ngay ST5 |
| v1 | SAM2 đa mảng tự động + wire-color UI · BẢNG ÁNH XẠ + núm per-mảng (bảng editor) · seed/khoá-sắc-độ preset đợt | render-set-node-tong | 1-2 đợt |
| v2 | metrology khung tự động từ ảnh (nối single-view-metrology) · kéo-thả đường vùng bám phối cảnh · kiểm B6 tự động | metrology + mask editor | sau v1 |

Phản biện giữ lại: segmentation không bao giờ hoàn hảo → phiếu duyệt B3 + sửa mask là BẮT BUỘC
trong luồng, không phải tuỳ chọn; nhiều pass = nhiều credit hơn 1 job (concept đáng giá đó);
chi tiết cực nhỏ (tay nắm, khe chỉ) vẫn cần Sửa vùng tay — nói rõ với người dùng.

## 5 · Dây máy
Entry `grounded-render` (L, ⭐MVP). Ăn theo/nuôi: render-set-node-tong (B4-B5 là ruột node
tổng) · dna-card (20%) · company-dna-pack (10%) · chuẩn ngành (70%) · fix F2 = việc con đầu.
