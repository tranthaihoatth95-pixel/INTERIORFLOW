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

## ĐỢT 3 (TỔNG bơm — sổ ghi "03/08 ~02:1x", nhận SÁNG 03/08 ~09:00 giờ thật)
Ghi chú nhận lệnh: Hoà dán cả CỤM 5 dòng nhận vai (NC·UI·VẼ·DỰNG·TRÌNH) vào phiên này — theo hiến chương "mỗi phiên đúng 1 dòng", phiên này chỉ nhận dòng **NC**; 4 dòng kia cần dán vào 4 phiên mới (đã báo Hoà).
*(Đính chính §0: dòng tiêu đề cũ ước "nhận 02/08 ~23:5x" là SAI — kiểm `date` lúc xong NC-9 ra 03/08 09:21 sáng; 2 file NC-8/NC-9 đã đổi tên sang `2026-08-03` cho đúng ngày.)*
| # | Đề tài | Nuôi cho | Trạng thái |
|---|---|---|---|
| NC-8 | First-run app CÙNG NGÀNH: D5 Render · SketchUp · Enscape (màn đầu, template gallery, sample project) | Smart Tour v2 + empty-state Vẽ 3D | ✅ `nc/NC-firstrun-cung-nganh-2026-08-03.md` |
| NC-9 | Presence/collab Figma/Miro/FigJam (avatar dải, cursor, follow mode, comment thread) | code G2 của G4 | ✅ `nc/NC-presence-collab-2026-08-03.md` |

- [03/08 ~09:00] Nhận đợt 3. ✅ NC-8 → `nc/NC-firstrun-cung-nganh-2026-08-03.md`: cùng ngành hội tụ "scene mẫu mở-là-nghịch-được", KHÔNG tour; 2 phát minh đáng chép: chọn ĐƠN VỊ là nghi thức mở đầu (SketchUp template) + **Instructor gắn theo TOOL** (animation + modifier keys + phím — nâng cấp thẳng cho §0c mảng 2); Enscape dạy "nút xám phải có lý do". 7 đề xuất §2.
- [03/08 09:21] ✅ NC-9 → `nc/NC-presence-collab-2026-08-03.md`: kiến trúc Figma — presence (cursor·selection·viewport) là DỮ LIỆU PHÙ DU tách khỏi persistence, cursor throttle ~80ms local-first; reaction G2 nên là STAMP-GẮN-OBJECT (FigJam) = dữ liệu duyệt phương án đếm được; comment pin bám object + Resolve ẩn-không-xoá + notification mặc định mentions-only; toggle ẩn cursor ĐƯỢC NHỚ (sửa pain Figma bị than). 11 đề xuất §4 rót thẳng vào phiếu G2 của G4.
- **[03/08 09:21] HẾT VIỆC đợt 3** — NC-8 + NC-9 ✅. Hàng đợi trống.

## CHỐT PHIÊN đợt 3 — 03/08/2026 09:2x
**Đã xong:** đợt 3 trọn 2/2. Tổng phiên NC (3 đợt): **9 bài** trong `docs/nc/`.
**Dang dở:** không.
**Đề xuất cho COWORK-TỔNG:**
1. Dòng `00-CHOT` cập nhật: "`docs/nc/` — 9 bài NC (02–03/08): camera-campath · timeline · spreadsheet · onboarding · xuất-PDF · lark-permission · pm-studio-nhỏ · firstrun-cùng-ngành · presence-collab."
2. Báo **G4**: NC-9 đã về — phiếu G2 (mục 3 hàng đợi G4) nên đọc `NC-presence-collab` §4 trước khi dựng `lib/collab/` (nhất là #1 ephemeral-vs-persist và #6 stamp-gắn-object).
3. Báo **G4/CHINH** (empty state, mục 5 G4): đọc `NC-firstrun-cung-nganh` §2.3–2.5 (2 nút + cảnh mẫu + nút xám có lý do).
4. Nhắc lại 2 việc treo từ đợt 1–2: Hoà chạy checklist Lark (`NC-lark-permission` §2) · 4 dòng vai UI/VẼ/DỰNG/TRÌNH cần dán vào 4 phiên mới.
**Hàng đợi còn lại:** trống — chờ TỔNG bơm đợt 4 hoặc Hoà giao trực tiếp.

## ⚠️ PHIÊN THỨ 2 NHẬN TRÙNG BRIEF ĐỢT 3 — 03/08/2026 (bằng chứng chạy song song thật)
**Phát hiện:** một phiên COWORK-NC KHÁC (tôi) nhận đúng nguyên văn brief ĐỢT 3 (① first-run cùng ngành, ② presence/collab) — y hệt brief mà mục ngay trên đây đã làm và CHỐT PHIÊN lúc 09:2x sáng nay. Bằng chứng đây KHÔNG phải suy đoán: tôi đọc `docs/nc/*.md` lúc bắt đầu → chỉ thấy 8 file (thiếu `NC-presence-collab`); grep code xong quay lại đọc thì đã thấy file đó xuất hiện; đến lúc APPEND vào chính sổ này thì bị lỗi "File has been modified since read" — đọc lại thì thấy mục CHỐT PHIÊN đợt 3 (09:2x) đã được điền đầy đủ. Tức là **2 phiên COWORK-NC chạy đúng lúc nhau, cùng nhận 1 brief**, chỉ lệch nhau khoảng chục phút.
**Xử lý theo §0b ("đừng viết lại cái đã có") + §0 (luật trung thực):** KHÔNG viết lại NC-8/NC-9 (đã đọc trọn cả hai, xác nhận đạt chuẩn — nguồn thật, số liệu thật, "Điều IF nên làm" đầy đủ). Thay vào đó soi đúng **1 câu NC-9 tự loại khỏi phạm vi** ở dòng "Giới hạn nghiên cứu": *"cơ chế CRDT/conflict-resolution của document sync KHÔNG nằm trong bài này"*. Grep `app/api/flows/[id]/route.ts` + `lib/store.ts` để trả lời đúng câu đó thì phát hiện đây **không phải câu hỏi lý thuyết**: autosave `graphJson` (debounce 2s, gộp `nodes+edges+groups+comments+strokes` vào 1 blob) ghi đè thẳng qua `prisma.flow.update` mà **không so `rev`** dù field này đã có sẵn và đang được tăng — tức 2 người sửa cùng flow (đúng kịch bản G2 hứa hẹn) có thể **mất dữ liệu thật, im lặng, không cảnh báo, không có bản cứu** (vì `FlowVersion` chỉ tạo khi bấm tay "Đánh dấu bản này", không tạo khi autosave). Viết bài mới đúng lỗ hổng đó, so 4 mô hình ngành (Figma property-level CRDT · Miro object-lock + 2 thread cộng đồng thật · Revit worksharing borrow/Editing-Request — muscle memory kiến trúc sư · bài học phản diện Webflow nhiều năm than trước khi vá bằng Page branching) + kịch bản cụ thể dựng trên đúng code IF + 6 đề xuất xếp độ khẩn.

| # | Đề tài | Nuôi cho | Trạng thái |
|---|---|---|---|
| NC-10 | Xung đột khi 2 người sửa `graphJson` đồng thời (Figma CRDT · Miro lock · Revit worksharing · bài học Webflow) — đúng lỗ hổng NC-9 tự loại khỏi phạm vi | G2 Mood+Collab + autosave `graphJson` (`lib/store.ts` + `app/api/flows/[id]/route.ts`) | ✅ `nc/NC-conflict-simultaneous-edit-2026-08-03.md` |

**Vì sao chỉ 1 file mới, không phải 2 như brief yêu cầu:** đã kiểm kỹ — mọi câu hỏi cụ thể của đề bài ① (wizard/progressive disclosure · template gallery · sample project · cách dạy thao tác cơ bản) đều đã có câu trả lời đầy đủ trong `NC-firstrun-cung-nganh-2026-08-03.md`. Thử tìm góc phụ "viewport 3D trống theo đúng nghĩa đen" (SketchUp scale-figure, Blender default cube) nhưng nguồn tra được mỏng, không có "than phiền cộng đồng thật" đạt chuẩn hệ (`SO-KIEM-TONG` §0b) — quyết định KHÔNG ép viết để tránh bài chung chung/PR. Ưu tiên 1 bài có sức nặng thật hơn 2 bài trong đó 1 bài là lấp chỗ trống cho đủ số.

### CHỐT PHIÊN — 03/08/2026 (phiên thứ 2, bài bổ sung)
**Đã xong:** xác minh ĐỢT 3 (① + ②) đã xong bởi phiên COWORK-NC song song — đọc trọn cả 2 file để verify, không chỉ tin tên file/dòng ✅ trong sổ. Vì §0b cấm viết lại cái đã có, đào đúng lỗ hổng NC-9 tự khai + grep code thật xác nhận đây là rủi ro CÓ THẬT (không phải giả thuyết) → viết `nc/NC-conflict-simultaneous-edit-2026-08-03.md` (NC-10).
**Dang dở:** không.
**Đề xuất cho COWORK-TỔNG (TỔNG duyệt mới ghi vào `00-CHOT`):**
1. +1 dòng `00-CHOT`: "`docs/nc/NC-conflict-simultaneous-edit-2026-08-03.md` (NC-10) — autosave `graphJson` (`lib/store.ts` ~dòng 1118-1130 + `app/api/flows/[id]/route.ts` ~dòng 74-81) ghi-đè-mù, không kiểm `rev` dù field đã có sẵn → rủi ro mất dữ liệu THẬT khi G2 cho nhiều người sửa cùng flow. Đề xuất: dùng `rev` làm optimistic-concurrency guard + toast 'có người vừa sửa' + tải lại, TRƯỚC khi G2 mở nhiều người dùng thật."
2. **Báo PHU/G4 trực tiếp** (không chỉ nằm trong sổ NC) — NC-10 §3 mục 1+2+4 nên vào hàng đợi G4/PHU mức 🔴: đây là lỗi mất-dữ-liệu-im-lặng, KHÔNG thuộc diện an toàn của cơ chế "ship trước sửa sau" (dữ liệu mất không "sửa sau" được).
3. **Sửa quy trình dispatch cho COWORK-NC** — xem Nghi vấn dưới, tránh lặp lãng phí công sức lần nữa (và kiểm xem 4 vai UI/VẼ/DỰNG/TRÌNH có bị lặp tương tự không).
**Nghi vấn liên vai (đúng 1 câu cho Hoà chuyển TỔNG):** Cơ chế "Hạm đội Cowork" vừa lặp dispatch — 2 phiên COWORK-NC nhận đúng 1 brief ĐỢT 3 cùng lúc (bằng chứng: sổ này đổi nội dung giữa 2 lần đọc trong cùng 1 phiên) — có phải TỔNG đang bơm việc theo chu kỳ cố định mà không kiểm phiên nào đã nhận, và nếu đúng thì 4 vai còn lại (UI/VẼ/DỰNG/TRÌNH) có cùng rủi ro?
**Hàng đợi còn lại:** trống — phiên NC kế tiếp đọc file này rồi nhận đề tài MỚI thật từ TỔNG/Hoà, không nhận lại nguyên văn brief ĐỢT 3 (đã xong đủ, xem bảng trên).
