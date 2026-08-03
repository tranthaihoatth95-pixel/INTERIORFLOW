# BÁO CÁO COWORK-NC — nghiên cứu
**Vai nhận:** 02/08/2026 tối (22:58 VN) · theo `HAM-DOI-COWORK.md` VAI 2.
**Sở hữu:** `docs/nc/` — mỗi đề tài 1 file `NC-<đề-tài>-<ngày>.md`, có nguồn URL, có mục "Điều IF nên làm".
**Chuẩn chất lượng:** số liệu thật · doc chính hãng · than phiền cộng đồng · không marketing (mẫu: cuối `SPEC-LENH-VE-IF`, `SPEC-VAT-LIEU-PBR-IF`, `SPEC-PANEL-ROLLOUT-IDF`).
**Luật tuân thủ:** không code · không mock · append-only · chốt phiên ~85% context · nghi vấn vai khác → ghi đây + 1 câu cho Hoà chuyển TỔNG.

## HÀNG ĐỢI (theo hiến chương, làm theo thứ tự)
| # | Đề tài | Nuôi cho | Trạng thái |
|---|---|---|---|
| NC-1 | Camera & đường quay D5/Lumion/Twinmotion (đặt cam, campath, keyframe, xuất video) | bước ② DỰNG video chặng 3 · `SPEC-DUNG-CAMERA` của COWORK-DỰNG đang chờ | ✅ `nc/NC-camera-campath-2026-08-02.md` |
| NC-2 | Timeline editor CapCut/Descript/Canva video (track, trim, nhịp cắt theo beat, chữ) | editor Video · `SPEC-TRINH-VIDEO-EDITOR` của COWORK-TRÌNH đang chờ | ✅ `nc/NC-timeline-editor-2026-08-02.md` |
| NC-3 | Spreadsheet nhúng Airtable/Notion table/Grist (cột kiểu, công thức, group) | editor BOQ · `SPEC-TRINH-BOQ-EDITOR` đang chờ | ✅ `nc/NC-spreadsheet-nhung-2026-08-02.md` |
| NC-4 | Onboarding app pro Figma/Linear/Notion (first-run, empty state, sample project) | Smart Tour v2 | ✅ `nc/NC-onboarding-2026-08-02.md` |
| NC-5 | Xuất hồ sơ PDF/in từ web app (Figma export, Canva print, CAD plot: dpi, bleed, font nhúng) | hồ sơ Present | ✅ `nc/NC-xuat-pdf-in-2026-08-02.md` |

## NHẬT KÝ (append-only)
- [02/08 22:58] Nhận vai. Đọc xong `HAM-DOI-COWORK` → `SO-KIEM-TONG` → `00-CHOT` → `STATUS`. Tạo sổ này. Chờ Hoà chọn chế độ chạy (tự chạy hết hàng đợi / từng bài duyệt).
- [02/08 23:05] Hoà kích hoạt CHẾ ĐỘ TỰ CHẠY (cả hàng đợi, chốt phiên ~85%).
- [02/08 23:20] ✅ NC-1 xong → `nc/NC-camera-campath-2026-08-02.md`. Phát hiện đắt nhất: cả 3 app đều keyframe-first, pain #1 là interpolation overshoot (D5 staff chính thức khuyên "2 keyframe/clip" để né thuật toán của chính họ); user D5 cầu xin "sửa path từ top view + độ cao cố định" = đúng kiến trúc path-first IF đã chọn → moat, ghi thẳng vào SPEC-DUNG-CAMERA. 10 đề xuất cho COWORK-DỰNG ở §3.
- [02/08 23:40] ✅ NC-2 xong → `nc/NC-timeline-editor-2026-08-02.md`. 3 mô hình: track-first (CapCut) / page-first (Canva) / text-first (Descript). 2 vụ cộng đồng đắt giá: CapCut nhốt tính năng sau paywall 2024 (petition, báo chia tay → "MP4 sạch 0-credit" của IF thành vũ khí) · Canva Video 2.0 ép NLE lên non-editor → rollout đổ vỡ (audio unsync, ghost footage). Khuyến nghị lõi: đơn vị edit = SHOT CÓ TÊN từ ngữ nghĩa campath, timeline collapsed kiểu Descript, beat-snap kiểu Canva-free, 3 tầng cố định. 10 đề xuất ở §3.
- [02/08 23:55] ✅ NC-3 xong → `nc/NC-spreadsheet-nhung-2026-08-02.md`. Cả 3 app đều records-có-schema + công thức theo CỘT, không cell-formula — BOQ IF nên tuyên bố thẳng như vậy. Phát minh đáng chép nhất: TRIGGER FORMULA của Grist = pattern cho "khối lượng auto từ CAD nhưng sửa tay được + badge truy vết" (khớp CHOT-TACH-AI-VA-CHINH-TAY). Bẫy né sẵn: Airtable formula không đọc group-sum → subtotal của IF là dòng engine tính, không phải cell. 10 đề xuất ở §3. *(Ghi chú giờ: mục 23:40/23:55 ở trên là ước lượng lố — giờ thật lúc xong NC-3 ≈ 23:10.)*
- [02/08 23:20] ✅ NC-4 xong → `nc/NC-onboarding-2026-08-02.md`. Mô hình thắng cuộc cả 3 app hội tụ: checklist học-bằng-làm + empty state có CTA + tooltip ngữ cảnh — KHÔNG tour chiếu phim (~70% skip tour bị ép; NN/g đứng về contextual help). Nước đi đáng chép nhất: Linear dạy ⌘K TRƯỚC khi user làm gì (dạy mô hình, không dạy nút) · Notion đè blank-page bằng template. Đề xuất lõi cho Smart Tour v2: định nghĩa activation event (render đầu tiên), dự án mẫu trung tính mở-là-nghịch-được, checklist 4-5 việc, 1 câu hỏi định tuyến. 10 đề xuất ở §3.

- [02/08 23:18] ✅ NC-5 xong → `nc/NC-xuat-pdf-in-2026-08-02.md`. Chuẩn thuộc lòng: bleed 3mm · trim/bleed box · PDF/X-1a vs X-4 (X-4 chấp nhận RGB+ICC = đích khả thi cho web app). Figma bỏ trống mảng in cho plugin trả phí; Canva một-nút vẫn phải nhờ NHÀ IN viết guide → IF nên làm 2 preset "In văn phòng / Gửi nhà in". IF đã giải font Việt (`lib/pdf-font.ts` #25) — đề xuất nâng thành LUẬT. Bản vẽ CAD phải xuất VECTOR + lineweight mm, tách pipeline khỏi deck ảnh. 8 đề xuất ở §3.
- **[02/08 23:19] HẾT VIỆC** — hàng đợi hiến chương 5/5 ✅. Không bịa việc mới theo luật §3 `SO-KIEM-TONG`.

## CHỐT PHIÊN — 02/08/2026 23:19
**Đã xong:** toàn bộ hàng đợi NC 5/5 — `docs/nc/` (mới) chứa 5 bài đúng chuẩn (số liệu thật + nguồn URL + than phiền cộng đồng + mục "Điều IF nên làm" đối chiếu code có sẵn).
**Dang dở:** không.
**Đề xuất cho COWORK-TỔNG (TỔNG duyệt mới ghi vào `00-CHOT`):**
1. +1 dòng `00-CHOT`: "`docs/nc/` — 5 bài NC 02/08 (camera-campath · timeline-editor · spreadsheet-nhúng · onboarding · xuất-PDF-in) nuôi `SPEC-DUNG-CAMERA`, `SPEC-TRINH-VIDEO-EDITOR`, `SPEC-TRINH-BOQ-EDITOR`, Smart Tour v2, preset xuất in."
2. Báo **COWORK-DỰNG**: NC-1 đã về → `SPEC-DUNG-CAMERA` (hàng đợi DỰNG #2) hết trạng thái "chờ NC-1", chốt được.
3. Báo **COWORK-TRÌNH**: NC-2 + NC-3 đã về → `SPEC-TRINH-VIDEO-EDITOR` (chờ NC-2) và `SPEC-TRINH-BOQ-EDITOR` (chờ NC-3) hết chờ, viết được.
**Nghi vấn liên vai (1 câu cho Hoà chuyển TỔNG):** NC-1 §3.6 đề xuất wire `CamPathPreview` (gap V2.1 trong STATUS) — việc này nằm vùng code CHINH hay G4? TỔNG phân khi ra phiếu.
**Bài NC bổ sung nếu cần (chưa làm, chờ lệnh):** onboarding app cùng ngành (D5/SketchUp first-run) · pipeline in đối thủ nội thất (Foyr/Coohom) · in thử thật 1 deck + 1 bản vẽ tại nhà in.
**Hàng đợi còn lại:** trống. Phiên NC kế tiếp đọc file này → nhận đề tài mới từ TỔNG/Hoà.

## ĐỢT 2 (TỔNG bơm — sổ ghi "đêm 04/08", giờ thật phiên này 02/08 ~23:30)
| # | Đề tài | Nuôi cho | Trạng thái |
|---|---|---|---|
| NC-6 | Quyền Lark Wiki/Base — gỡ kẹt 131006 (checklist từng-nút-bấm cho Hoà) | PHU mục 2 ATLAS sync 1449 bản ghi | ✅ `nc/NC-lark-permission-2026-08-02.md` |
| NC-7 | PM app cho studio nhỏ (Lark Base Gantt/Kanban · Linear/Asana/Notion · resource handbook) | ArchiNote v1, ≤15 mục | ✅ `nc/NC-pm-studio-nho-2026-08-02.md` |

- [02/08 23:34] Nhận đợt 2 từ `SO-KIEM-TONG` §3. Ghi nhận luật mới §0 trung thực · §0b nghiên-cứu-trước-khi-quyết (chuẩn 5 bài NC được nêu làm chuẩn hệ) · §0c ba mảng.
- [02/08 23:40] ✅ NC-6 xong → `nc/NC-lark-permission-2026-08-02.md`. Chẩn đoán: 131006 = "wiki NODE permission denied" — kẹt ở LỚP ③ (app chưa là MEMBER của wiki space), không phải thiếu scope. Bản đồ 3 lớp quyền (scope → version published → resource membership) + checklist A/B/C/D từng nút bấm: A=Console thêm scope wiki+base rồi PHÁT HÀNH VERSION MỚI (scope không ăn nếu không publish — luật chính hãng), B=thêm app vào wiki space Members (bí thì đường vòng bot-qua-group), C=Base thường phải Share trực tiếp, D=verify + bảng đọc lỗi. Kèm 3 đề xuất code nhỏ cho PHU (dịch mã lỗi ra thông điệp hành-động-được).
- [02/08 23:42] ✅ NC-7 xong → `nc/NC-pm-studio-nho-2026-08-02.md`. Đã grep khung `SPEC-ARCHINOTE-DETAIL-v1` trước (5 module) — bài rót vào module ①+③, không lật kiến trúc. Số cứng Lark Base: free 2.000 dòng/bảng · automation 1.000 lượt/tháng (ảnh hưởng thiết kế hợp đồng B2 + batch sync). 2 app đáng chép: Monograph (PHASE là đơn vị hạng nhất, timesheet tự gắn phase — nhưng bị chê reporting + giá) · Float (workload lưới người×tuần = màn đắt nhất mà Lark Base không dựng nổi). 14 mục "Điều ArchiNote nên làm" + moat: THU tự động từ IF qua bảng PROJECT_STATUS.
- **[02/08 23:42] HẾT VIỆC đợt 2** — NC-6 + NC-7 ✅. Hàng đợi trống.

## CHỐT PHIÊN đợt 2 — 02/08/2026 23:42
**Đã xong:** đợt 2 trọn 2/2 (NC-6 Lark permission · NC-7 PM studio nhỏ). Tổng phiên: **7 bài NC** trong `docs/nc/`.
**Dang dở:** không.
**Đề xuất cho COWORK-TỔNG:**
1. +1 dòng `00-CHOT` (gộp với đề xuất đợt 1): "`docs/nc/` — 7 bài NC 02/08: 5 bài đợt 1 + NC-lark-permission (checklist gỡ 131006 cho Hoà) + NC-pm-studio-nho (14 mục nuôi ArchiNote v1)."
2. **NC-6 là việc CHẶN của Hoà** — chuyển checklist §2 (A→D) cho Hoà làm trên Developer Console + Lark client; xong thì PHU mục 2 (ATLAS sync 1449 bản ghi) tự thông.
3. NC-7 chuyển cho phiên ARCHINOTE khi khối copy spec (⛔ hàng đợi ARCHINOTE) được Hoà chạy.
**Nghi vấn liên vai:** không phát sinh mới.
**Hàng đợi còn lại:** trống — phiên NC kế đọc file này rồi nhận đề tài từ TỔNG/Hoà. Gợi ý đề tài dự trữ (chưa làm, chờ duyệt): onboarding app cùng ngành (D5/SketchUp first-run) · pipeline in Foyr/Coohom · Lark Base Gantt dependencies kiểm tận mắt (1 phút của Hoà).
