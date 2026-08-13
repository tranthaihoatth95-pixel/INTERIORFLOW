# REVIEW ĐỒNG BỘ CƠ CHẾ TOÀN APP — Grounded Render mổ thành 7 cơ chế lõi (13/08/2026)

> Hoà chốt Grounded Render rồi đặt bài: *"review cấp toàn app xem có cơ chế/thuật toán tương tự
> để thi hành luật đồng bộ cơ chế"*. Kết quả: 7 cơ chế lõi của Grounded Render đều CÓ ANH EM
> RUỘT trong app — hợp nhất được thành 5 ENGINE CHUNG. Grounded Render vì thế không phải tính
> năng mới đứng riêng, mà là MẶT TIỀN ẢNH của 5 cỗ máy xuyên app. Dây đã xác minh bằng grep 13/08.

## Bảng đẳng cấu — cơ chế Grounded Render ↔ cái đã có trong app

| # | Cơ chế lõi (trong Grounded Render) | Anh em ruột ĐÃ CÓ | Anh em CHỜ (registry) | Hợp nhất thành |
|---|---|---|---|---|
| 1 | **Grounding đo toán trước khi máy đoán** (B1: tiêu cự/tụ/chân trời) | `single-view-metrology.ts` · SnapCore/bắt điểm · detectRooms · **LUẬT 8 hiến pháp** (AI ra ý định, CODE tính, CODE kiểm) | snap-hop-nhat | — (luật 8 là gốc; Grounded Render là ca áp cho ảnh) |
| 2 | **Định danh vùng cấp đơn vị** (B2 wire-color mảng) | `entityId` trên SceneGroup (`cad-to-obj.ts:140`) · `matId` hợp nhất · tag quy ước gallery (nganh:/license:/nguon:) · cờ inferred K3 | nhan-nguon-reset (DataOrigin) · auto-define | **ENGINE ĐỊNH DANH VÙNG (RegionId)** — xem §2 |
| 3 | **Máy trình PHIẾU, người duyệt, cờ 3 nấc** (B3 phiếu 4 cấp) | `DistillEngine` (lib/distill) · `MaterialImpactPreview` (hỏi trước khi áp, liệt kê ảnh hưởng) · `scaffolder.ts` (gợi ý KÈM CĂN CỨ, thiếu thì im) · BOQ re-sync không đè ô tay | auto-define · meeting-distill · review-gate | **ENGINE PHIẾU-DUYỆT (ProposalSheet)** — xem §1 |
| 4 | **Bảng ánh xạ + NÚM mức độ per-item** (B4) | **BuildRecipe stack** (per-bước enabled+tham số+thứ tự, non-destructive) · ThinkDial 4 nấc · bậc thang 4 nấc + seed khoá (CHOT-RENDER-TOOL-WINDOW 01/08 — tiền thân trực tiếp!) | render-set-node-tong | **KHUÔN NÚM-STACK** — xem §3 |
| 5 | **Áp theo VÙNG cứng, không toàn cục** (B5) | node Sửa vùng (mask inpaint) · "render vùng" (Hoà duyệt 01/08) · khoá giữ vùng 2B · E2 mask ảnh (nguyên liệu editor chặng 3) | grounded-render v0 | dùng chung mask engine với RegionId |
| 6 | **Máy KIỂM SAU KHI ÁP** (B6 đối chiếu phiếu) | gate `CHUAN_DAU_RA` lúc xuất PDF (chặn + nút sửa) · lib/review 2 lớp LUẬT/GÓP Ý · soi:frontier/hinh-hoc (phía build — đẳng cấu §9 cũ) | — | **KHUÔN KIỂM-SAU-ÁP (PostGate)** — xem §4 |
| 7 | **Trộn trọng số nguồn giá trị 70/20/10** (B4 đề xuất) | các NGUỒN có đủ: chuẩn ngành (lib/cad/standards 3.074 dòng) · Thẻ DNA · ProjectProfile | company-dna-pack · Magic prompt→build (chờ spec) | **HÀM SuggestBlend** — xem §5 |

## 5 engine chung — hợp đồng interface là việc cấp L của T (thi công theo đợt)

### §1 · ProposalSheet — "mọi đề xuất của máy đi qua MỘT khuôn phiếu"
`{ items: [{ id, nhãn, giá_trị, căn_cứ, trangThai: measured|inferred|verified, nguồn[] }],
duyệt/sửa từng dòng → áp → undo }`. Mặt tiền hiện tại: phiếu 4 cấp (render) · Material Impact
(vật liệu) · Scaffolder (việc) · sau này: auto-define (cấu kiện) · meeting-distill (biên bản) ·
review-gate (checklist). Hiện 3 mảnh đã tồn tại RỜI — khi làm phiếu B3 v0, T thiết kế contract
chung, 3 mảnh cũ migrate DẦN (không đập).

### §2 · RegionId — "mảng trong ảnh = entity trong không gian ảnh"
`Region { id, nguồn: 'entity-projection'|'sam'|'tay', dinhDanh?: entityId|matId, cờ }`.
**Insight đắt nhất của review:** khi ảnh render sinh TỪ scene IF, mask KHÔNG cần SAM —
**chiếu entity ra ảnh là có mask hoàn hảo 100%** (SceneGroup đã giữ entityId), lại tự mang
elementType + matId → phiếu B3/B4 tự điền. SAM chỉ dành cho ảnh NGOẠI LAI (screenshot, ảnh
khách đưa). Đây là lợi thế một-nguồn mà đối thủ (chạy trên ảnh rời) không thể có.

### §3 · Khuôn NÚM-STACK
`{ item, enabled, mức/tham số, thứ tự }` + UI stack — BuildRecipe (hình học) và bảng ánh xạ
mảng (ảnh) là HAI mặt tiền của cùng khuôn; ThinkDial là bản 1-núm. Không viết UI stack lần hai:
bảng ánh xạ B4 tái dùng khuôn UI BuildRecipeSection vừa ship (Command3DPanel).

### §4 · PostGate
`{ checklist đo được → đạt/chặn/báo + nút sửa }` — CHUAN_DAU_RA (xuất 2D) · kiểm sắc độ B6
(render) · sau này: kiểm khối 3D (khối hở), BOQ nguồn giá. Cắm vào lib/review (khung Finding
sẵn có) — thêm loại đích, không thêm khung mới.

### §5 · SuggestBlend(nganh 70, dnaKts 20, guDuAn 10)
MỘT hàm đề xuất có gia phả nguồn (mỗi đề xuất trả về: giá trị + tỉ trọng nguồn + trích dẫn),
dùng cho: dòng đề xuất B4 · Scaffolder · góp ý concept (12.4) · Magic prompt→build sau này.
Trọng số là mặc định, chỉnh được per-dự-án; hàm PHẢI trả provenance — cấm hộp đen (luật 12.3).

## Thi hành
1. Đợt kế (v0 Grounded Render): T viết contract ProposalSheet + RegionId TRƯỚC phiếu v0
   (việc cấp L); fix F2 là việc con đầu.
2. BuildRecipeSection được trích khuôn UI stack dùng chung khi làm B4 (không đập, chỉ tách).
3. 5 đẳng cấu này ghi vào HOP-DONG-PHOI-HOP-T §9 (bảng mở rộng) — thành luật soi của T:
   từ nay tính năng mới nào rơi vào 1 trong 5 khuôn mà tự chế cơ chế riêng = vi phạm đồng bộ.
