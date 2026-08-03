# NC-8 · FIRST-RUN APP CÙNG NGÀNH — D5 Render / SketchUp / Enscape
**COWORK-NC · 03/08/2026 sáng (đợt 3).** Nuôi: **Smart Tour v2** + **empty-state Vẽ 3D** (G4 hàng đợi mục 5 đang áp khuôn "trống" toàn app).
**Nối bài trước:** `NC-onboarding-2026-08-02.md` đã phủ app pro tổng quát (Linear/Notion/Figma — checklist học-bằng-làm, chống tour ép). Bài này trả lời câu treo ở đó: *app CÙNG NGÀNH archviz/CAD làm first-run thế nào* — vì user IF mang muscle memory từ chính các app này (§0b bước 3).

---

## 1 · Ba app cùng ngành mở màn thế nào

| | D5 Render | SketchUp | Enscape |
|---|---|---|---|
| Màn đầu tiên | **Launcher/homepage**: tạo project mới + duyệt **demo scenes & case studies** ngay từ cửa | **Welcome dialog 3 tab: Learn · License · Template** — chọn template là chọn **ĐƠN VỊ (mm/inch)** + nền + kiểu nét; bấm ♥ để đặt mặc định lần sau | Không có màn riêng — sống trong host (SketchUp/Revit): bật toolbar → nút **Start Enscape** |
| Sample/template | **D5 Scene Express: 300+ file scene .drs miễn phí** (kiến trúc·nội thất·landscape) — tải, mở, render được ngay; demo scene **cố ý chừa khoảng TRỐNG** để user tự lấy asset (kho 10.000+) lấp vào | template = file mẫu thiết lập, không phải scene nội dung; nội dung mẫu đi qua 3D Warehouse | **Free sample projects chính hãng** cho từng host (Revit/SU/Rhino/ArchiCAD) + HDRI + project standalone — guide chính hãng dặn "chưa có file thì tải sample" |
| Dạy tool | doc + blog khuyên dùng demo scene như "**hands-on lesson**": bật/tắt từng đèn, đổi vật liệu, đổi HDRI để hiểu từng nút làm gì | **Instructor panel** ⭐: chọn tool nào → panel hiện **animation lặp** cách dùng + mô tả ngắn + **modifier keys** (các chế độ của tool) + link help sâu; gọi từ dấu **?** ở status bar; đóng được, mở lại từ Default Tray | không dạy trong app — dựa host + blog "getting started" |
| Trạng thái chờ | — | — | **Nút Start XÁM cho tới khi đủ điều kiện** (Revit: phải có 3D view hợp lệ) — disabled có lý do, không giấu nút |

Nguồn: [D5 Quick Start (manual chính hãng)](https://docs.d5render.com/getting-started/quick-start) · [D5 Scene Express](https://www.d5render.com/posts/free-download-render-files-from-d5-scene-express) · [D5 forum demo scenes](https://forum.d5render.com/t/all-d5-render-demos-scenes/6225) · [SketchUp Getting Started (help chính hãng)](https://help.sketchup.com/en/sketchup/getting-started-sketchup) · [SketchUp Model Templates](https://help.sketchup.com/en/sketchup/setting-templates) · [Enscape for SketchUp get started (blog Chaos chính hãng)](https://blog.chaos.com/enscape-for-sketchup-get-started) · [Enscape sample projects](https://wp-sandbox.enscape3d.com/free-sample-projects/) · [Enscape trong Revit](https://blog.chaos.com/how-to-use-enscape-in-revit)

**Đọc ra bản chất:** cùng ngành hội tụ với NC-4 — KHÔNG app nào dùng tour chiếu phim; vũ khí là **SCENE MẪU MỞ-LÀ-NGHỊCH-ĐƯỢC**. Hai phát minh riêng của ngành đáng chép: (i) **chọn ĐƠN VỊ là nghi thức mở đầu** của dân CAD (SketchUp), (ii) **Instructor gắn theo TOOL** — dạy đúng lúc cầm tool, không dạy trước.

---

## 2 · ĐIỀU IF NÊN LÀM (nuôi Smart Tour v2 + empty-state Vẽ 3D)

| # | Đề xuất | Căn cứ |
|---|---|---|
| 1 | **"Instructor mini" cho bộ lệnh vẽ** — chọn lệnh L·PL·REC·C·ROOM (hoặc tool 3D) → 1 ô nhỏ hiện: hình động ngắn lặp + 1 câu ≤12 từ + modifier (Shift khoá trục, gõ số sau...) + phím tắt; gọi/tắt từ dấu **?** trên status bar. Đây là bản NÂNG của §0c mảng 2 ("status bar mách lệnh đang chờ gì") từ text lên khuôn SketchUp — thứ designer 10 năm nghề thấy QUEN TAY ngay | Instructor là contextual-help được yêu suốt ~20 năm SketchUp; khớp NN/g (NC-4 §2); dạy lúc CẦM TOOL, không phải lúc login |
| 2 | **Chọn đơn vị lúc tạo dự án đầu tiên** (mm mặc định, ft-in cho thị trường khác) — 1 dropdown trong màn tạo mới, nhớ lựa chọn kiểu ♥ SketchUp. Dân CAD coi đây là nghi thức chuẩn; thiếu nó = "đồ chơi" | SketchUp template = đơn vị là lựa chọn ĐẦU TIÊN của mọi phiên bản 20 năm; §0b bước 3 |
| 3 | **Empty-state Vẽ 3D (việc G4 mục 5):** 1 câu + 2 NÚT — "Mở cảnh mẫu" (chính) · "Bắt đầu vẽ" (phụ). Cảnh mẫu = căn hộ mẫu trung tính (đề xuất NC-4 §3.2, dùng CHUNG một dự án mẫu, đừng đẻ nhiều) | D5/Enscape đều đẩy sample làm lối vào chính; khuôn TRỐNG `SPEC-NGON-NGU-CHI-DAN` |
| 4 | **Cảnh mẫu thiết kế như BÀI HỌC, không phải hàng trưng bày** — chép mẹo D5: chừa 1 phòng TRỐNG cố ý + gợi ý "kéo nội thất từ Thư viện vào phòng này"; mỗi yếu tố (lớp, vật liệu matId, camera, đèn) đặt để bật/tắt là hiểu 1 khái niệm | D5 demo scene có "empty spaces" chủ đích; hands-on lesson là cách ngành này học |
| 5 | **Nút xám PHẢI có lý do nói được** (pattern Enscape): Render xám khi canvas trống → tooltip khuôn mách-nước "Vẽ ít nhất một phòng để render" + nút đi kèm. Cấm nút xám câm | Enscape Start xám tới khi có 3D view — user ngành đã quen đọc trạng thái này; khớp khuôn MÁCH NƯỚC |
| 6 | **Màn tạo mới = 3 lựa chọn, không hơn**: Trống (mm) · Căn hộ mẫu · Nhập DXF/DWG — khớp câu hỏi định tuyến NC-4 §3.5, không dựng template gallery lớn ở v1 | D5 có 300+ scene vì là kho cộng đồng — IF v1 không cần kho, cần 1 mẫu tốt |
| 7 | **Smart Tour v2 KHÔNG thay Instructor** — tour = 1 lượt giới thiệu bố cục (3 chặng, ⌘K); Instructor mini = sống mãi theo tool. Hai tầng, đừng gộp | SketchUp tách Welcome (1 lần) khỏi Instructor (mãi mãi) — cấu trúc 2 tầng đã được kiểm chứng |

**Giới hạn nghiên cứu:** mô tả từ doc + guide chính hãng, chưa cài lại 3 app để chụp từng màn (không chặn kết luận — pattern hội tụ rõ); D5 Launcher flow chi tiết từng nút có thể đã đổi theo version 2.6+; Instructor hiện đại (SketchUp 2024-25) vẫn giữ cấu trúc animation+modifier như mô tả nhưng nên xem 1 ảnh màn hình thật khi COWORK-UI viết đặc tả mock cho "Instructor mini".
