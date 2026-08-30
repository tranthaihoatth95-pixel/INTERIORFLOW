# PHIẾU ĐỊNH HƯỚNG — UX/UI CHUẨN TOÀN CẦU CHO INTERIORFLOW

> Trả phiếu giao `docs/phieu-giao/khao-sat-ux-toan-cau.md` (Hoà giao 30/08/2026).
> Người viết: lane `05 · THIẾT KẾ/NC`. Bằng chứng: **soi tận mắt đủ 24/24 ảnh** `artifacts/man-30-08/`
> + đối chiếu luật đã có (GU-PROFILE §2 · V-1/2/3/6 · 6 cổng duyệt mắt · Motion-Visual Law).
> Tự chứa: người không đọc được repo vẫn dùng được phiếu này cùng bộ ảnh.

---

## 0 · NGUỒN KHẢO — nêu nguồn, không nêu ý kiến

| Nguồn | Dùng cho |
|---|---|
| **Apple HIG** (Foundations: Layout · Typography · Color · Materials; macOS patterns) | thấu kính chất lượng — cách đặt câu hỏi, KHÔNG phải lớp da (đúng luật nội bộ "Apple là thấu kính") |
| **WCAG 2.2** (1.4.3 contrast text 4.5:1 · 1.4.11 non-text 3:1 · 2.5.8 target ≥24px · 1.4.12 text spacing) | sàn khả dụng đo được |
| **NN/g** (10 heuristics: visibility of status · match real world · recognition over recall) | chấm điều hướng/ngữ cảnh |
| **ISO 9241-110** (self-descriptiveness · conformity with expectations) | chấm "đang ở đâu, làm gì tiếp" |
| **Quy ước công cụ chuyên nghiệp** (Figma/Blender/Rhino/Affinity: canvas là vua · toolbar nổi · numeric-first · phím tắt ổn định · panel dock) | phần HIG không phủ: desktop pro dùng 8–10h |
| **Luật nội bộ đã chốt** (V-1/2/3/6 chữ Việt · 6 cổng duyệt mắt · GU-PROFILE §2 · nhịp motion 5 dải) | ràng buộc cứng, thắng mọi nguồn ngoài khi vênh |

---

## 1 · NÓI TRƯỚC: CÁI **KHÔNG NÊN ĐỔI** (đọc kỹ trước khi đọc lỗi)

1. **Màn đăng nhập (`00-01`)** — nền nâu ấm có khí + thẻ kính + pill: đúng gu chốt §3a, có "chất nội thất" hiếm hoi của cả bộ. Giữ làm chuẩn khí quyển. (Chỉ sửa: chữ HOA có dấu + màu nút, xem §3.)
2. **Màn mở Present (`30-01`)** — "Trình bày dự án này." typographic hero + 6 lối vào: nhân-vật-chính rõ nhất bộ ảnh. Giữ nguyên khuôn, nhân bản tinh thần này cho 2D/3D.
3. **Empty state có cấu trúc** — Bảng việc (`01-03`: ghost rows + 1 câu + 2 CTA + 5 mẫu) và hint card 2D (`10-01`: "Gõ W để vẽ tường…"): đúng chuẩn "empty là bề mặt làm việc". Giữ khuôn.
4. **Sự trung thực dữ liệu** — `02-02` "Còn 1629 ảnh… chưa lên mặt tiền, không mất" · `50-04` cảnh báo đỏ "KÊNH LIÊN HỆ CHƯA CHỐT" · trạng thái "chưa nối kho" ở `01-02`: thật thà hiếm có, là tài sản văn hoá sản phẩm. **Cấm đánh bóng mất.**
5. **Bảng vật liệu (`02-04`)** — bảng kỹ thuật đúng nghề (mã · ba mặt · hãng · kích thước · giá tham khảo · nguồn). Cấu trúc giữ; chỉ sửa tín hiệu lặp (§3).
6. **Settings (`50-01`)** — gọn, giải thích tử tế ("Đổi nơi lưu sẽ di chuyển toàn bộ dự án — IF tự chuyển và kiểm đủ file trước khi xoá chỗ cũ"): giọng đúng. Giữ.
7. **Toolbelt 2D hai hàng (`10-01`)** — Sơ phác↔Chuyên + nhóm lệnh + hàng trạng thái vẽ: cấu trúc đúng hướng công-cụ-pro, không đổi kiến trúc, chỉ sửa nhãn HOA.
8. **Nút "Ẩn gợi ý"** cạnh CTA (`10-01`) — cho tắt hướng dẫn = tôn trọng người thạo việc. Giữ nguyên tắc này toàn app.

---

## 2 · CHẤM 24 KHUNG THEO SÁU CỔNG — bảng phán quyết

Ký hiệu cổng: ①việc-con-người ②nhân-vật-chính ③thừa-thì-gỡ ④tường-thẻ ⑤SaaS-chung-chung ⑥sự-thật-dữ-liệu.
(Trước khi chấm: đo lại md5 — **3 cặp trùng byte** [`20-01↔20-02` · `30-01↔30-02` · `30-03↔30-04`] + cặp `00-01↔00-02` trùng; **cặp `10-01↔10-02` phiếu giao ghi trùng nhưng thực tế KHÁC byte** — khác vài pixel render lưới, vẫn là một mặt về nghĩa. Cặp bí ẩn giải ở §5-C.)

| Màn | Trượt cổng | Vùng cụ thể trên ảnh |
|---|---|---|
| `00-01`/`00-02` đăng nhập | ⑤ nhẹ | nút "Vào xưởng" + switcher VI/EN + checkbox: tím indigo — màu SaaS duy nhất trên một màn rất có khí; "ĐĂNG NHẬP · ĐĂNG KÝ · HOẶC TIẾP TỤC VỚI" phạm V-1 |
| `01-01` Home | ②③ | thẻ "Việc đang dở" chiếm ~60% bề ngang nhưng ~70% ruột thẻ là khoảng trống chết (từ dòng chip tới "Mở lại→"); cả dải trên của màn (từ header tới "Chào hoa") trống ~300px; "Ghi chú nhanh" 4 chấm màu (tím/lục/vàng/hồng) phạm đơn-sắc+1-accent khi chưa ai bật tiện ích đó |
| `01-02` Files | ④③ | 5 thẻ thư mục ngang trọng lượng, cùng chất liệu, icon nhỏ lọt thỏm giữa thẻ ~200px trống (cổng tường-thẻ đúng nghĩa đen); header ghi "Thiết kế 3D" trong khi đang ở Files (⑥ ngữ cảnh sai — xem §3-B1) |
| `01-03` Bảng việc | qua ①②⑥ | "HOẶC BẮT ĐẦU TỪ MẪU" phạm V-1; còn lại là empty state chuẩn |
| `02-01` Thư viện (sheet) | ③ nhẹ | nhãn kệ "CẤU KIỆN · VẬT LIỆU · ẢNH THAM CHIẾU · MẪU & HỒ SƠ" phạm V-1; 6 kệ đếm 0 bày cùng hàng với kệ có đồ (frontier thật — được phép, nhưng cần phân tầng thị giác kệ-rỗng) |
| `02-02` Cảm hứng | ①⑤ | 5 ảnh "Nội thất" là **render hành lang thang máy dự án khách** — không phải cảm hứng (đúng ca Hoà nói "thấy ghê"); dưới fold trống lớn. Dòng "còn 1629 ảnh…" là ⑥ ĐẠT — giữ |
| `02-03` Reference Ingest | ⑤②⑥ | **màn lệch hệ nhất bộ**: đen tuyền + chip cam, ngoài shell, chữ máy-nói-với-máy lộ ra người dùng ("chưng cất JSON nhẹ", "Feed AI bằng AI manifest (bỏ thumbnail) → không vỡ context"); che logo đi thì đây là app khác — FAIL hard test |
| `02-04` Kho vật liệu | ⑥ nhẹ | chip "Giá !" vàng lặp trên **cả 10/10 hàng** → tín hiệu cảnh báo mất nghĩa (cảnh báo cái gì khi tất cả cùng cảnh báo?); 10 mục là dữ liệu demo (IKEA/Muuto/Louis Poulsen) trong bản ship — nợ demo-data đã ghi, quyền Hoà |
| `02-05` Bảng màu | qua, ③ nhẹ | khuôn empty đúng (10 ô TRỐNG + giải thích trung tính); hai lớp modal chồng (sheet đè bảng đè màn) — depth vượt L3 không cần |
| `10-01`/`10-02` 2D | qua ①②⑥ | tốt nhất nhóm authoring; phạm V-1 ở "CẤU KIỆN · SỬA · ĐO & GHI CHÚ"; hai đảo sidebar nổi che góc trái canvas (xem §3-B2) |
| `20-01`/`20-02` 3D | ② nhẹ | 1 node "Nhập ảnh" lơ lửng giữa canvas trống — chưa có "bắt đầu từ đâu" như 2D có hint card; sidebar nổi che trái canvas |
| `30-01`/`30-02` Present | **QUA cả 6** | chuẩn nhân-vật-chính của bộ |
| `30-03`/`30-04` Sửa ảnh | ⑤ nhẹ | toolbar/panel kiểu riêng (không ToolbarChip hệ); "LỚP (0)" phạm V-1; header vẫn "Thiết kế 3D" |
| `40-01` Tổng quan dự án | ③⑥ | 3 thẻ đếm "SỐ FLOW 2 · THÀNH VIÊN 1 · CHẶNG" — đếm-để-đếm (gỡ đi người dùng không mất việc nào, cổng ③ nguyên văn); chữ "flow" là từ kỹ thuật lộ; form Thẻ DNA 6 ô trống lặp cùng placeholder — nên là 1 lối "Chưng cất từ ảnh" + ô gọn; "TỔNG QUAN DỰ ÁN · THÀNH VIÊN…" phạm V-1. Dải "Thêm vị trí để IF hiểu khí hậu…" ĐẠT ① — giữ |
| `40-02` Sổ tay | ⑤⑥ | ngoài shell hoàn toàn (mất Việc/Chặng, mất đường về); breadcrumb lộ `PROJECT #CMSL4B5UX0001W9JLRGO2Q41T` (cuid kỹ thuật trước mặt khách); song ngữ VI·EN bày CẢ HAI cùng lúc ("Nguồn · Sources") — trái cơ chế switcher của phần còn lại; chips "TẤT CẢ · ẢNH · VĂN BẢN · CUỘC HỌP" phạm V-1. Ruột RAG grounded + gợi ý câu = ĐẠT ① — giữ |
| `50-01` Cài đặt | qua, ⑥ nhẹ | "0 B / 10 GB" — 10GB là quota gì khi app local-first đọc thẳng thư mục máy? nếu không có thật thì phạm ⑥ (số bịa) — cần truy nguồn số này |
| `50-02` Avatar | qua | kỹ (preview 44/28/20 đúng cỡ dùng thật); headings "TÔNG DA…" phạm V-1 |
| `50-03` Giới thiệu | ③ | một title + version + 1 hàng trên màn trống mênh mông, lệch trái — thiếu tối thiểu "kiểm tra cập nhật / kênh hỗ trợ / bản quyền" để xứng một màn |
| `50-04` Giấy phép | qua ⑥ ĐẠT | trung thực mẫu mực; headings phạm V-1 |

**Tổng V-1 (HOA có dấu)**: bắt gặp trên ≥12/20 mặt — đây là **lỗi hệ thống của một khuôn heading/nhãn**, không phải lỗi từng màn; sửa một khuôn là sạch cả bộ (khớp đo 772/850 vi phạm cỡ chữ đã có hướng "nâng sàn 12px giữ tỉ lệ").

---

## 3 · XẾP HẠNG THEO MỨC HẠI (không liệt kê phẳng)

### A · CHẶN VIỆC — sửa trước tiên
1. **`02-02` Cảm hứng không làm được việc cảm hứng** — 5 ảnh khách + 1629 ảnh chờ nhãn. Người dùng tới để tìm hứng, ra về tay không. Đường xử đã có phiếu riêng (máy đọc gu — phiếu anh em); về UX: trong lúc kho chưa tuyển đủ, màn phải nói thật + cho làm ngay việc **nạp nguồn sạch** (khuôn "Sổ nguồn" đã có ở đúng màn này — nâng nó thành lối chính thay vì phần phụ dưới fold).
2. **`40-02` Sổ tay mất đường về** — ngoài shell, không sidebar: người dùng vào sổ tay rồi phải bấm "Quay lại" mù. Đưa Notebook về TRONG shell (giữ 3 cột ruột), là việc điều hướng, không phải redesign.
3. **Header ngữ cảnh nói sai chỗ đang đứng** (mọi màn ngoài chặng: Files/Bảng việc/Kho vật liệu/Cài đặt/Sửa ảnh đều ghi "Thiết kế 3D") — phạm NN/g #1 visibility of status; người mới sẽ tin app đang ở 3D. Sửa: label này chỉ hiện khi ĐANG ở một chặng; ngoài chặng hiện đúng tên nơi đang đứng.

### B · SAI SỰ THẬT — phá lòng tin
1. **"Thiết kế 3D" dính trên 8+ màn không phải 3D** (như trên — vừa chặn việc vừa sai sự thật).
2. **"0 B / 10 GB"** (`50-01`) — nếu 10GB không phải quota thật của một cơ chế thật ⇒ số bịa, phạm cổng ⑥. Truy nguồn; không có thật thì bỏ mẫu số.
3. **Chip "Giá !" đồng loạt 10/10 hàng** (`02-04`) — cảnh báo phải là ngoại lệ; đồng loạt = mất nghĩa. Đổi: chỉ chấm hàng THIẾU giá; hàng có giá tham khảo hiện giá trần lặng.
4. **`00-02-intro-mo-app` không phải màn intro** — trùng byte với màn khoá (giải thích §5-C): bộ ảnh tự nó đang khai sai một khung. Ghi chú lại tên ảnh khi giao cho bên ngoài.

### C · HỎNG KIẾN TRÚC TRẢI NGHIỆM — "nhiều app trong một app"
1. **`02-03` Reference Ingest**: hệ màu riêng (đen + cam), giọng riêng (jargon máy), shell riêng. Một màn như vậy phá câu "mỗi stage là một chế độ của CÙNG một OS". Xử: đưa về token hệ + giọng người + vào shell; chức năng giữ nguyên.
2. **`30-03` Sửa ảnh**: toolbar/panel tự chế ngoài ToolbarChip/khuôn hệ — cùng bệnh nhẹ hơn.
3. **`40-02` Sổ tay**: shell riêng + song ngữ kép + lộ cuid (trên: A2/B).
4. **Hai đảo sidebar nổi che canvas 2D/3D** (`10-01`, `20-01`): đảo "Việc/Chặng" bản chữ-đầy nổi ĐÈ lên canvas thay vì rail 52px compact đã chốt — trên màn authoring, canvas là vua mà bị chiếm góc thường trực. (Rail 52 đã là code — ảnh cho thấy bản đang chạy chưa phải bản đó, hoặc đang ở trạng thái mở-ghim; định hướng: mặc định vào chặng = rail compact, đảo chữ chỉ khi người dùng mở.)
5. **Ba biểu hiện của MỘT khuôn thiếu**: heading/nhãn HOA có dấu khắp nơi (V-1) — sửa Ở KHUÔN (component nhãn nhóm + text-transform), cấm sửa từng chỗ.

### D · HAO MÒN — sửa theo đợt token/khuôn
1. Khoảng trống chết trong thẻ (`01-01` hero ~70% rỗng; `01-02` icon giữa ~200px trống) — thẻ phải co theo ruột hoặc ruột phải xứng thẻ (mật độ Home "roomy" ≠ rỗng).
2. Chấm màu Ghi chú nhanh 4 màu (`01-01`) — về 1 accent + mức xám, màu chỉ khi người dùng chủ động gán nghĩa.
3. `50-03` Giới thiệu trống — thêm tối thiểu: kiểm tra bản mới · kênh hỗ trợ · dòng bản quyền, hoặc gộp vào `50-01`.
4. Hai lớp modal chồng (`02-05`) — sheet Library nên thay nội dung trong MỘT lớp, không đắp lớp thứ hai.
5. Node đơn lẻ giữa canvas 3D (`20-01`) thiếu hint "bắt đầu từ đâu" như 2D — nhân bản khuôn hint card của 2D.

---

## 4 · APPLE HIG — ÁP TỚI ĐÂU, DỪNG Ở ĐÂU (phần giá trị nhất)

| Nguyên lý HIG | Áp cho IF? | Khi lệch, lệch theo chuẩn nào |
|---|---|---|
| **Clarity — nội dung trước chrome** | ÁP TRỌN — đúng cổng ② nhân-vật-chính; `30-01` là mẫu | — |
| **Deference — chrome nhường nội dung** | ÁP cho 3 chặng authoring (canvas là vua) | trên desktop pro, "nhường" = **dock/thu được**, không phải "ẩn hẳn sau hover" (luật nội bộ: cảm ứng hạng nhất, không tính năng chỉ-hover) — theo quy ước Figma/Blender |
| **Typography SF/Dynamic Type** | ÁP thang có nhịp, KHÔNG áp con số | tiếng Việt thắng: **sàn 12px (V-6) · line-height ≥1.5 (V-2) · letter-spacing ≥0 (V-3) · cấm HOA có dấu (V-1)** — HIG cho phép caption 10-11pt và tracking âm, IF thì KHÔNG. Small-caps/HOA của HIG chỉ dùng cho chuỗi KHÔNG dấu (mã, đơn vị) |
| **Color — ít màu, màu mang nghĩa** | ÁP TRỌN (khớp gu đơn sắc + 1 accent) | semantic color của nghề rộng hơn HIG: cờ truth (measured/verified/inferred/stale) là hệ màu THÊM, phải giữ chỗ trong ngân sách màu |
| **Materials/vibrancy (kính)** | ÁP có ngân sách | WebGL/Electron ≠ compositor macOS: kính có TRẦN hiệu năng (luật G0–G3 + trần 4 tấm/viewport đã có) — theo thực đo, không theo cảm hứng visionOS |
| **Platform conventions (menu bar, traffic lights, sheet)** | KHÔNG chép | IF đa nền tảng (Electron, bán toàn cầu): quy ước riêng ổn định của app thắng quy ước một OS; phím tắt hiển thị theo nền tảng (⌘/Ctrl) |
| **Touch target 44pt** | LỆCH CÓ CHỦ ĐÍCH | desktop pro mật độ cao: sàn WCAG 2.5.8 **24px** cho control thường, 44 giữ cho cảm ứng thật (`--tap` đã làm đúng: 32 desktop/44 coarse pointer) |
| **Progressive disclosure** | ÁP TRỌN (Peek→Inspect→Deep đã chốt) | thêm chuẩn pro-tool: người thạo phải có đường TẮT (phím, gõ lệnh) chứ không đi qua từng lớp lộ dần |
| **Animation tinh tế** | ÁP theo nhịp đã chốt (100–160/140–200/180–260/240–380/300–700ms) | Reduced Motion bắt buộc (đã có token thoát) |
| **Onboarding tối giản** | ÁP: hint-tại-chỗ (`10-01` đúng) thay tour | công cụ 8–10h: mọi hint phải "Ẩn gợi ý" được và NHỚ lựa chọn |

**Câu chốt phần này:** HIG trả lời "*app tiêu dùng Apple nên cảm thấy thế nào*"; IF phải trả lời "*công cụ nghề 8–10h đa nền tảng nên LÀM VIỆC thế nào*". Mượn HIG ở **kỷ luật** (thứ bậc, tiết chế, vật liệu có nghĩa), lấy chuẩn pro-tool + WCAG + luật chữ Việt ở **con số**.

---

## 5 · HUMAN-CENTRIC CHO NGHỀ NÀY — 3 sự thật + 1 ca bí ẩn

**A · Ngồi 8–10 tiếng** ⇒ (i) nền làm việc trung tính, độ chói thấp — bản sáng `#f2f2f7` đạt; (ii) mọi trạng thái "đang chú ý" phải là tín hiệu NHỎ (aperture chấm — đúng hướng hiện tại), cấm badge đỏ hét; (iii) phím + gõ lệnh là đường chính của người thạo (2D đã có dòng lệnh — giữ và nhân rộng grammar); (iv) motion không được gây mỏi — nhịp đã chốt, tôn trọng Reduced Motion.

**B · Khách ngồi cạnh** ⇒ có những màn là "mặt tiền trước khách": Present (`30-01` ✅), Tổng quan (`40-01` — đang lộ "flow", cuid ở `40-02`), Cảm hứng (`02-02` — đang lộ render dự án KHÁC trước mặt khách: rủi ro thật). Định hướng: mọi chuỗi kỹ thuật (cuid, "flow", "node", tên máy) **không được xuất hiện** trên các màn thuộc nhóm trước-khách; cần một nhãn nội bộ "màn trước khách" trong hợp đồng thiết kế từng màn.

**C · Ca bí ẩn `00-01 ↔ 00-02` — giải xong.** Hai tệp trùng từng byte (md5 `da57d5f6…`, 1.048.038 byte). Ảnh là **màn đăng nhập** — nghĩa là lúc chụp khung "intro mở app", app **chưa có session** nên `/intro` đổ về đăng nhập: intro không bao giờ render cho khách chưa đăng nhập; kịch bản chụp đăng nhập từ khung 01 trở đi. **Không phải bug sản phẩm — là khai sai tên khung trong bộ ảnh.** Việc còn lại (nếu muốn ảnh intro thật): chụp `/intro` SAU khi đã có session. Bài học kèm: cặp `10-01↔10-02` phiếu giao khai "trùng khít" nhưng md5 KHÁC (lệch vài pixel render) — số liệu trong phiếu giao nên đo lại trước khi trích tiếp.

**D · Người mới ↔ người thạo:** người mới đang được đỡ tốt (empty states, mẫu bắt đầu, "Tạo bằng AI"); người thạo chưa có gì nhanh hơn — chưa thấy palette lệnh toàn cục/⌘K trên ảnh nào, chưa có "mở lại đúng chỗ hôm qua" ngoài 1 thẻ Home. Định hướng: mọi việc làm-mỗi-ngày phải có đường ≤2 cú bấm hoặc 1 phím.

---

## 6 · BA CHẶNG = MỘT DÒNG CHẢY — làm bằng gì, đo bằng gì

Hiện trạng ảnh: ba chặng đã CÙNG shell + cùng sidebar (tốt hơn 23/08), nhưng còn 4 vết nứt: header nói sai chặng (§3-A3) · Sửa ảnh/Sổ tay/Ingest là ốc đảo (§3-C) · chuyển chặng chưa thấy mang-ngữ-cảnh (mỗi chặng tự đứng: "Gửi sang Trình chiếu" ở 2D là đúng hướng — giữ và làm sâu) · Untitled flow/Hồ sơ 1 không nói thuộc dự án nào.

**Định hướng (khớp luật chuyển-stage đã chốt):** shell đứng yên; đổi chặng = canvas morph + toolbar đổi working set; **selection/nguồn đi theo** (chọn tường ở 2D → sang 3D thấy đúng khối đó; render ở 3D → sang Present thành source có nhãn nguồn + revision). Vết khâu cụ thể nhìn thấy được: dòng "nguồn: bản vẽ X · R03" trên mọi vật đã sang chặng khác.

**Đo bằng:** (1) **đếm cú bấm** 2D→3D→Present cho một luồng chuẩn (mở dự án → vẽ 1 phòng → dựng → 1 trang present): mục tiêu chuyển chặng ≤1 cú, không mất selection; (2) **test che-logo**: chụp 3 chặng đặt cạnh — một người lạ phải nói "một app" (hard test đã chốt); (3) **giữ-ngữ-cảnh**: sang chặng rồi quay lại, viewport/selection/tool còn nguyên (stage memory); (4) chấm màn theo 6 cổng mỗi lần đổi lớn — cổng đã có, đừng chế thước mới.

---

## 7 · CÂU ACCENT TÍM `#6a57f5` — trả lời có nghiên cứu

**Chẩn đoán:** tím indigo là accent mặc định của cả một thế hệ SaaS (họ Linear/Notion/Figma-marketing) ⇒ phạm trực tiếp cổng ⑤ ở mức token: che logo đi, màu này nói "công cụ SaaS", không nói "công cụ của người làm nội thất". Nó cũng KHÔNG có trong phổ gu đã chưng cất (greige–kem–champagne–óc chó–đen–xanh cây). NHƯNG: luật trung tính cấm lấy gu Hoà làm gu ép người dùng, và tím đang gánh 2 vai trộn lẫn trên ảnh: (a) action chính (Vào xưởng, Thêm việc, Bắt đầu trình bày, Mở canvas) và (b) nhận diện AI (Tạo bằng AI, Soạn việc với Vitals, Đề xuất kịch bản).

**Ba phương án (đều giữ "ít màu: trung tính + MỘT accent"):**

| PA | Nội dung | Được | Mất |
|---|---|---|---|
| **A (khuyến nghị)** | **Tách vai**: action chính = **mực trung tính** (đen than trên nền sáng / trắng ngà trên tối — nút "JPEG" ở `30-03` và chips đen ở `40-02` cho thấy hướng này đã sống lác đác); **MỘT accent duy nhất chỉ còn cho AI + trạng thái chọn**, lấy từ cặp ứng viên `--mau-ai` đã chờ sẵn (mòng két `#1f7f88` ↔ mận `#8f5a72`) | thoát mùi SaaS ở 90% bề mặt; AI được nhận diện tách bạch (đúng "AI là engine bên trong"); đổi = 2 dòng token đã chuẩn bị | phải kiểm tương phản mực-trên-sáng cho trạng thái disabled; mòng két cần đo khoảng cách với `--success #46b876` (cùng họ lạnh — đo ΔE + không dùng đơn-màu làm tín hiệu, đã là luật) |
| B | Giữ MỘT accent cho mọi thứ nhưng đổi tông sang **ấm khoáng** (đồng/đất nung ~`#a86b3c`) — hợp nghề nội thất toàn cầu, không riêng gu Hoà | ấm, có "mùi vật liệu" | đụng vùng `--warning #d9a34a` (cùng dải vàng-cam) — rủi ro nhầm tín hiệu, cần tách kỹ; vẫn là "một màu gánh mọi vai" |
| C | Giữ nguyên tím | 0 công | giữ nguyên mùi SaaS + tiếp tục trộn vai action/AI — chính là bệnh đang chấm |
| | | | |

**Ai quyết:** đổi accent = đổi diện mạo ⇒ **quyền Hoà** (đã thành luật). Phiếu này chỉ khuyến nghị A + cách đo: chọn xong, chạy 3 phép kiểm — text 4.5:1, non-text 3:1, khác biệt cảm nhận với 3 màu trạng thái; và **một ảnh app thật** trước/sau để mắt chấm.

---

## 8 · CHƯA CHẮC · HẠN DÙNG

**CHƯA CHẮC:** (1) mọi phán quyết từ ẢNH TĨNH — hover/focus/motion/phím chưa chấm, cần một lượt browser thật khi sửa; (2) "0 B / 10 GB" chưa truy code — có thể là quota thật của một cơ chế tôi chưa thấy; (3) trạng thái sidebar trên ảnh có thể là trạng thái MỞ của rail 52px (code đã ship) chứ không phải thiếu rail — cần xác nhận trên app chạy; (4) bộ ảnh chụp viewport 2880×1800 — chưa chấm màn hẹp/tablet; (5) đề xuất mực-trung-tính (PA-A) chưa dựng thử trên màn thật nào.

**HẠN DÙNG:** đúng cho bản chụp 30/08 (HEAD `27140602`). Files/Vitals/rail đổi hằng ngày bởi các lane code — chấm màn nào TRƯỚC KHI sửa màn đó phải chụp lại. Sáu cổng + V-luật + nhịp motion là phần bền; bảng chấm §2 là phần dễ cũ nhất.
