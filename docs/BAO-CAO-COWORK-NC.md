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

---

## ĐỢT 4 — NC-11 · IFC + NGHỊ ĐỊNH BIM VIỆT NAM — 03/08/2026
**Giao bởi:** `CHOT-TEN-CHANG-MODE-2026-08-03.md` §6 mục 2 (Hoà chốt trực tiếp: *"chuẩn ifc theo nghị định nữa"*).

| # | Đề tài | Nuôi cho | Trạng thái |
|---|---|---|---|
| NC-11 | ① Nghị định BIM VN (IFC có bắt buộc không) · ② IFC 4.3 cho nội thất · ③ thư viện JS đọc-ghi IFC + giấy phép · ④ bảng ánh xạ entity IF ↔ IFC | `SPEC-TANG-DU-LIEU-CAU-KIEN` §2.4 (`'covering'` chờ chốt) · `lib/cad/model.ts` · `LICENSE-NOTES.md` | ✅ `nc/NC-11-ifc-nghi-dinh-bim-2026-08-03.md` |

### Ba câu trả lời gọn
1. **① IFC CÓ BẮT BUỘC — và luật vừa ĐỔI.** `NĐ 175/2024/NĐ-CP` (từng ghi cứng "IFC 4.0" + trần 500 MB/tệp) **đã hết hiệu lực 01/7/2026**. Luật hiện hành là **`NĐ 217/2026/NĐ-CP` Điều 8 khoản 3 điểm a**: *"Dữ liệu BIM được nộp theo các định dạng chuẩn mở **IFC** hoặc các định dạng mở khác phù hợp…"* — bỏ ghim phiên bản, bỏ trần dung lượng, **bỏ điều kiện "dự án nhóm B trở lên"**, ngưỡng còn lại là **công trình cấp II trở lên**, không phân biệt vốn công/tư. `QĐ 258/QĐ-TTg` chỉ là lộ trình, KHÔNG phải nguồn quy định định dạng. ⚠️ Nghĩa vụ nộp đặt lên **chủ đầu tư** — studio nội thất bị chạm **gián tiếp qua hợp đồng** (Điều 8.2), không trực tiếp. Marketing phải nói đúng chỗ này.
2. **③ THẮNG: `web-ifc` (ThatOpen) — MPL-2.0.** Đọc + ghi (`CreateModel`/`WriteLine`/`SaveModel` có thật trong `.d.ts`), schema `IFC2X3|IFC4|IFC4X3`, wasm **1,30 MB** (đo thật từ tarball npm 0.0.77, 06/3/2026). MPL copyleft **theo file** ⇒ IF đóng nguồn được, chỉ cần đừng fork-sửa rồi giấu. **LOẠI `xeokit-sdk` (AGPL-3.0 — lan qua mạng, nuốt cả bản web)**; `IfcOpenShell` (LGPL-3.0, ~10 MB qua pyodide) để dự phòng server-side; `web-ifc-three` đã chết (bản cuối 01/2024).
3. **④ `elementType:'covering'` — CÓ, THÊM.** `IfcCovering` là entity IFC hạng nhất, ví dụ chính hãng đúng 4 thứ IF làm (ốp tường · sàn · trần thả · phào/len). Ép thành `slab` là **sai tiền BOQ** (IfcSlab tính m³ kết cấu, IfcCovering tính m² `Qto_CoveringBaseQuantities`). **NHƯNG phải kèm `coveringKind?: 'ceiling'|'flooring'|'cladding'|'molding'|'skirtingboard'|'topping'`** — vì `IfcCovering` luôn cần `PredefinedType`, thiếu field này exporter buộc phải ĐOÁN (vi phạm luật "không đoán mò").

### Đề xuất cho COWORK-TỔNG (TỔNG duyệt mới ghi vào `00-CHOT`)
1. +1 dòng `00-CHOT`: "`docs/nc/NC-11-ifc-nghi-dinh-bim-2026-08-03.md` — luật hiện hành là **NĐ 217/2026/NĐ-CP Điều 8** (không phải NĐ 175, đã hết hiệu lực 01/7/2026); IFC là định dạng nộp bắt buộc; chọn `web-ifc` MPL-2.0; duyệt thêm `elementType:'covering'` + `coveringKind`."
2. **Báo COWORK-DỰNG / PHU: câu chờ ở `SPEC-TANG-DU-LIEU-CAU-KIEN` §2.4 ĐÃ CÓ TRẢ LỜI** — thêm `'covering'`, kèm `coveringKind`, và cập nhật luôn nhánh suy đoán §2.3.b (suy được `covering` nhưng KHÔNG suy `coveringKind`, để undefined + gắn `inferred`).
3. **Việc rẻ làm ngay (PHU, 1 dòng):** `lib/cad/model.ts:101` nhãn `'Nội thất · IfcFurnishingElement'` **SAI** — buildingSMART đánh `IfcFurnishingElement` *"deprecated for instantiation"*. Đổi thành `'Nội thất · IfcFurniture'`.
4. **Cảnh báo giấy phép (bài học libredwg):** `LICENSE-NOTES.md` còn 4 dòng nghĩa vụ ⬜ CHƯA LÀM cho GPL-3 của libredwg. Đừng thêm dependency thứ 2 (web-ifc) trước khi có trang "Third-party licenses" trong app — gộp thành MỘT việc cho CHINH.
5. **10 khoản IF còn thiếu để xuất IFC hợp lệ** (bảng §4.2 của bài) — 5 khoản mức 🔴 chặn: cây `IfcProject→Site→Building→Storey` (`Doc` hiện KHÔNG có bảng tầng), `IfcUnitAssignment`, `IfcGuid` bền, `thicknessMm`, `IfcOpeningElement` cho cửa.

**Nghi vấn liên vai (1 câu cho Hoà):** xuất IFC có nên **mặc định loại bỏ giá** không? IFC không có Pset chuẩn nào chứa giá (giá thuộc `IfcCostItem`), và file IFC thường gửi thẳng cho chủ đầu tư/tổng thầu — xuất kèm `priceVnd` là lộ giá vốn. Đề xuất: mặc định KHÔNG kèm giá, có công tắc riêng.

### CHỐT PHIÊN — 03/08/2026 (COWORK-NC, đợt 4)
**Đã xong:** NC-11 đủ 4 phần đề bài, tra tận nguồn (vanban.chinhphu.vn · qlda.gxd.vn toàn văn NĐ 217 · ifc43-docs.standards.buildingsmart.org · registry npm + tarball đo thật · thảo luận license GitHub của IfcOpenShell).
**Phát hiện ngoài đề bài (đáng giá nhất):** đề bài giả định NĐ 175/2024 — nhưng nó **đã hết hiệu lực 5 tuần trước ngày viết bài**. Nếu tin brief mà không kiểm thì cả bài sẽ trích luật chết.
**Dang dở / chưa verify (ghi rõ, không giấu):** ⓐ PDF ký số NĐ 217 là ảnh scan, chưa đối chiếu bằng mắt; ⓑ chưa đọc được toàn văn hướng dẫn kỹ thuật BIM của Bộ Xây dựng ⇒ chưa biết VN có đòi MVD/IDS/Pset cụ thể không; ⓒ **chưa chạy thử web-ifc lần nào** — mọi số là số đo gói, không phải kết quả chạy; ⓓ ánh xạ PBR→`IfcSurfaceStyleRendering` là SUY ĐOÁN.
**Hàng đợi còn lại:** trống — chờ TỔNG bơm đợt 5.

---

## ĐỢT 5 — NC-12 · DỰNG BỘ LỆNH HÌNH HỌC 3D BẰNG GÌ — 03/08/2026
**Giao bởi:** `SPEC-DUNG-BO-LENH-3D.md` (Hoà chốt 03/08, bác đề xuất cắt gọn của TỔNG) — 6 tầng lệnh + camera mức V-Ray.

| # | Đề tài | Nuôi cho | Trạng thái |
|---|---|---|---|
| NC-12 | ① boolean · ② sweep/lathe/loft · ③ bắt điểm 3D · ④ modifier không phá huỷ · ⑤ cấu kiện tham số · ⑥ camera V-Ray | `SPEC-DUNG-BO-LENH-3D` · `SPEC-DUNG-3D-THONG-NHAT` §10 · `lib/cad/model.ts` · `lib/three/*` · `LICENSE-NOTES.md` | ✅ `nc/NC-12-bo-lenh-3d-2026-08-03.md` |

### Sáu câu trả lời gọn
1. **① BOOLEAN — `three-bvh-csg` 0.0.18 (MIT) THẮNG.** Đo thật (Node v22, three 0.185.1): subtract **63,2 ms** ở 32k tam giác/mesh · **119,1 ms** ở 65k. Giữ nguyên `position+uv+normal` và `groups.length===2` ⇒ **UV/material sống sót**. Chi phí **33,5 KB gzip biên** (peer dep `three-mesh-bvh` dù sao cũng phải có cho ③). **`three-csg-ts` LOẠI**: 3 968 tam giác đã **3 722 ms**, 16 128 tam giác **quá 120 s phải giết tiến trình**, và phình mesh **6,9 lần**. **`manifold-3d` 3.5.1 (Apache-2.0) làm phương án B cho đường XUẤT** — đo được nó **từ chối `THREE.SphereGeometry`/`IcosahedronGeometry` với `ManifoldError: Not manifold`** kể cả sau `mergeVertices`, phải xoá uv/normal mới nạp được ⇒ sai với hình người dùng vẽ tay, nhưng đúng cho khối kín (in 3D/CNC/IFC solid). **Cả 4 ứng viên đều MIT/Apache — không lặp ca GPL libredwg.**
2. **② SWEEP/LOFT — three KHÔNG đủ, không thư viện nào bù, phải tự viết.** Đo thật: `extrudePath` dùng Frenet frame nên tiết diện **tự xoay 90°** khi chạy quanh chu vi phòng phẳng (normal đi từ `(0,0,-1)` → `(0,1,0)`); `CatmullRomCurve3` khép kín **vọt ra ngoài góc phòng 442 mm** (bo tròn góc). Docstring three ghi thẳng *"Bevels not supported for path extrusion"*. Không có loft (`mrdoob/three.js#23708` vẫn mở). **Phần khó nhất = MITER JOINT** (tiết diện lõm sinh mặt tự giao · góc nhọn nổ vô hạn cần miter limit · góc trong≠ngoài · đoạn ngắn hơn miter). **Đường vòng rẻ: sweep rời + boolean nêm phân giác ⇒ đây là lý do kỹ thuật để ① đi TRƯỚC ②.**
3. **③ BẮT ĐIỂM — `three-mesh-bvh` 0.9.14 (MIT) là đường đúng, không có đường thứ hai.** Đo thật ở **100 820 tam giác**: raycast thuần của three **5 776,8 µs/tia** (1 tia ăn 35% ngân sách khung 60fps) → BVH **21,6 µs/tia** = **nhanh 267 lần**; dựng cây 69,5 ms. 62 KB gzip. **IF ĐÃ CÓ thang ưu tiên đúng ở 2D** — `lib/cad/query.ts findSnap()` + test `snap-priority.test.ts` (endpoint > intersection > center > midpoint > perp/tangent > quadrant > node > nearest > grid) ⇒ **mở rộng, cấm đẻ bản 3D riêng**. Hai bài học ngoài: đo dung sai **bằng pixel màn hình** (Blender), mỗi loại có **dấu + chữ** riêng và `⇧` khoá suy luận (SketchUp inference).
4. **④ MODIFIER STACK sống Ở ĐÂU — trong `Doc`, là `ops?: BuildOp[]` trên `interface Base` (`lib/cad/model.ts`), cạnh `heightMm`/`elementType`.** `Doc` **không đổi cấu trúc** ⇒ K1/L1 thoả, không có kho 3D riêng. Optional+additive ⇒ `.idf` cũ parse nguyên vẹn, **không cần bump `IDF_VERSION`**. **Lưu THAM SỐ, không lưu mesh**: một tường 65k tam giác ≈ **2,3 MB** nếu bake, vài trăm byte nếu lưu tham số. Cache mesh derive sống **trong module ống kính**, khoá bằng băm `(hình học+ops)`, **KHÔNG vào `Doc`, KHÔNG vào `.idf`**. Undo **miễn phí** vì `ops` nằm trong `Doc` (`store.ts` snapshot ≤50) — 3ds Max sai chỗ cho stack lịch sử undo riêng. Chi phí mở file: 20-60 boolean × 63-119 ms = **1,3-7 s** ⇒ bắt buộc **Web Worker + dựng dần dần** (đã verify `three-bvh-csg` chạy được không cần WebGL). **Đợt đầu chỉ khai 3 phép có nơi tiêu thụ ngay: `extrude`·`boolean`·`arrayLinear`** (luật K4/L7), 11 phép còn lại để trong tài liệu.
5. **⑤ CẤU KIỆN — không thư viện JS nào, tự viết (thuần toán).** Cầu thang xoắn cần **12 tham số**; luật cứng: `riserMm` và `n` ràng buộc nhau chỉ cho nhập MỘT; **chiều sâu mặt bậc phải nói rõ đo ở bán kính nào** (chuẩn quốc tế: 305 mm từ mép hẹp). **🔴 ĐÍNH CHÍNH SỐ CỦA ĐỀ BÀI: `2h+b` KHÔNG phải 600-640.** Có **hai dải khác nhau** — **VN 600-630 mm** (dẫn TCVN 4319:2012 + QCVN 04:2021/BXD) và **Blondel quốc tế 630-650 mm** (ArchDaily: *"2 Risers + 1 Tread = 63-65 cm"*), chỉ chồng nhau ở đúng 630. Cao bậc 150-180 mm ✅ và mặt bậc 250-300 mm ✅ (đề bài ghi ≥250) là **đúng**. **Cầu thang XOẮN có bộ số riêng hẳn** (IRC R311.7.10.1: rộng ≥660 mm · sâu ≥190 mm tại 305 mm · cao bậc ≤241 mm) — đừng dùng số thang thẳng.
6. **⑥ CAMERA — hai điểm tụ làm được bằng `pitch=0` + `setViewOffset`, KHÔNG phải sửa ma trận chiếu, 0 thư viện mới.** Đo thật (chiếu 5 đường đứng cao 2,7 m, đo chênh NDC-x): ngửa 15° = **0,14273** (hội tụ, ảnh nghiệp dư) → ngang+shift = **0,00000**, mà vẫn kéo được trần vào khung (điểm trần NDC-y 0,381→0,072). **`filmOffset` chỉ dịch NGANG** (đọc mã: chỉ cộng vào `left`); dịch **đứng** bắt buộc qua `setViewOffset` và nó **vừa dịch vừa cắt** ⇒ phải hiện **tiêu cự hiệu dụng** cho người dùng. ⚠️ `setViewOffset` cũng là field three dùng cho render lát — **ghi cảnh báo va chạm ngay**. DOF: **`BokehPass` của chính three, +5,4 KB gzip, 0 dependency** (gói `postprocessing` Zlib nặng hơn cho một hiệu ứng), **mặc định TẮT**. Safe frame = 0 dòng three, chỉ thêm 3 tỉ lệ vào `CAMERA_RATIOS`. Tầm mắt `camera.ts` đang **1,5 m**, spec đòi **1,6-1,65 m** — lệch, sửa 1 dòng.

### Đề xuất cho COWORK-TỔNG (TỔNG duyệt mới ghi vào `00-CHOT`)
1. +1 dòng `00-CHOT`: "`docs/nc/NC-12-bo-lenh-3d-2026-08-03.md` — boolean chọn **`three-bvh-csg` (MIT)** + **`three-mesh-bvh` (MIT)**, loại `three-csg-ts`, giữ `manifold-3d` (Apache-2.0) cho đường xuất; **modifier stack = `ops?: BuildOp[]` trên `Base`, trong `Doc`, không kho thứ hai**; hai điểm tụ = `pitch=0` + `setViewOffset`; đính chính `2h+b` là **VN 600-630 / Blondel 630-650**, không phải 600-640."
2. **🔴 VIỆC CỦA TỔNG, GẤP, không phải việc code: chèn dòng đính chính vào `SPEC-DUNG-3D-THONG-NHAT.md` §2.3 và §9.** Hai mục đó đang ghi *"Boolean — KHÔNG vào bộ công cụ"* và *"Modifier stack — không làm"*, **ngược thẳng với quyết định Hoà chốt 03/08** (`SPEC-DUNG-BO-LENH-3D` mở đầu: *"bác đề xuất cắt gọn của TỔNG"*). Để nguyên thì phiên code kế tiếp đọc §9 sẽ **từ chối làm ① và ④** với lý do "spec cấm rồi" — và không ai biết là đang đọc bản viết trước khi Hoà bác. Theo luật §0d "không đập, chỉ ghi" mà chính file đó dùng ở §12.
3. **Báo PHU/G4 — ba việc khởi động NGAY, song song, không chờ nhau:** ⓐ `npm i three-mesh-bvh` (một dòng, mở khoá cả boolean lẫn bắt điểm); ⓑ camera §6 (độc lập hoàn toàn, rẻ nhất, Hoà nhìn thấy ngay); ⓒ `ops?: BuildOp[]` vào `Base` — **nhưng ⓒ CHẶN BỞI D0/D1 của `SPEC-DUNG-3D-THONG-NHAT` §10** (`entityId` mọi nhóm + đọc `elementType`): không có `entityId` thì bấm vào vật trong 3D **không biết sửa `ops` của entity nào**.
4. **Phụ thuộc dễ bỏ sót nhất: miter joint (②) cần boolean (①) làm trước.** Ai làm ② trước ① sẽ đâm vào miter tiết diện lõm và mất nhiều ngày cho thứ mà boolean giải gần như miễn phí.
5. **Cảnh báo giấy phép (lặp lại cảnh báo NC-11, chưa ai xử):** `LICENSE-NOTES.md` §2 còn **4 dòng nghĩa vụ GPL-3 ⬜ CHƯA LÀM**. Bài này chọn **toàn MIT/Apache** nên không thêm nợ, và **cố ý loại `opencascade.js` (LGPL-2.1)** dù nó có sweep/loft/fillet BREP thật — không thêm dep copyleft thứ hai trước khi trả xong nợ thứ nhất.
6. **Việc rẻ làm ngay (PHU, 1 dòng):** `lib/three/camera.ts` `heightM = 1.5` → **1.65** cho preset 'eye' (và 1.6 cho 'wide'). `SPEC-DUNG-BO-LENH-3D` §2 đòi tầm mắt 1600-1650 mm; hiện lệch 100-150 mm ở mọi ảnh clay gửi AI.

**Nghi vấn liên vai (1 câu cho Hoà):** `SPEC-DUNG-BO-LENH-3D` (Hoà, 03/08) và `SPEC-DUNG-3D-THONG-NHAT` (COWORK-DỰNG, ghi 04/08) mâu thuẫn trực tiếp ở 3 hạng mục lớn (boolean · modifier stack · sweep) — có phải vai DỰNG viết spec mà **chưa đọc quyết định Hoà vừa chốt**, và nếu đúng thì cơ chế nào bảo đảm 5 vai Cowork đọc `00-CHOT` trước khi viết spec mới?

### CHỐT PHIÊN — 03/08/2026 (COWORK-NC, đợt 5)
**Đã xong:** NC-12 đủ 6 phần đề bài. **Không tra tay số nào — tự cài 4 thư viện rồi tự chạy benchmark**: 3 engine boolean × 3 mức mesh × 3 phép · raycast BVH vs thuần ở 100 820 tam giác · Frenet frame trên chu vi phòng · miter trên 2 kiểu đường · chiếu 5 đường đứng để đo hai điểm tụ · nạp `THREE.SphereGeometry` vào manifold. Đọc thẳng mã nguồn `three/src/geometries/ExtrudeGeometry.js` và `cameras/PerspectiveCamera.js` đã cài, không tin docs.
**Phát hiện ngoài đề bài (đáng giá nhất, 2 cái):** ⓐ **hai spec của IF đang mâu thuẫn trực tiếp** ở đúng hai câu hỏi ① và ④ của đề bài — nếu không đính chính thì phiên code sẽ từ chối làm; ⓑ **con số `2h+b=600-640` trong đề bài không có nguồn nào** — thực tế là hai dải khác nhau (VN 600-630, Blondel 630-650), tin theo đề bài là in số sai vào cảnh báo trong app.
**Dang dở / chưa verify (11 mục, liệt kê đủ ở bảng cuối bài):** nổi bật — ⓐ **mọi số đo trên container Linux/Node, KHÔNG phải máy Hoà, KHÔNG phải browser** (dùng để so thư viện thì đúng, dùng để hứa "app mượt" thì sai); ⓑ **chi phí GPU của `BokehPass` chưa đo được** (container không có WebGL) — PHU/G4 phải đo trước khi bật DOF; ⓒ **đường vòng miter bằng boolean nêm chưa dựng thử**; ⓓ **chưa đọc bản gốc TCVN 4319:2012 / QCVN 04:2021/BXD**, số VN lấy từ trang chuyên ngành dẫn lại; ⓔ **không tìm được quy định VN riêng cho cầu thang xoắn** — bảng xoắn là IRC (Mỹ), **cấm ghi nhãn "chuẩn VN"**; ⓕ ngày commit GitHub không tra được (API bị chặn), dùng ngày phát hành npm thay.
**Hàng đợi còn lại:** trống — chờ TỔNG bơm đợt 6.
