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
