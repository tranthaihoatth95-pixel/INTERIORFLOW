# IF Feature Spec — Phase 1 (.idf)

> ⚠️ **BẢN CŨ — ĐÃ THAY THẾ (superseded).** Spec canonical hiện hành là **`IF-FEATURE-SPEC-P1-v2.md`** (triết lý ArcSite "Sketch not Draft", touch-first, 101 item, trạng thái đã đối soát mã nguồn 2026-07-17). File này giữ làm lịch sử — KHÔNG dùng làm nguồn tham chiếu trạng thái nữa.

> **Mục đích**: Liệt kê TOÀN BỘ tính năng IF cần build (Phase 1), học hỏi từ
> AutoCAD nhưng tối ưu cho quy trình nội thất. Dùng làm đầu vào cho Claude Code.
>
> **Phạm vi Phase 1**: Thiết kế nội thất end-to-end (CAD → Render → Present)
> **Phase 2 (riêng biệt)**: CAD ACE — Revit 3D, platform 3D viewing,
> construction/CNC management cho team kỹ thuật công trường.
>
> **Trạng thái**: ✅ Đã có | 🔜 Build tiếp | 🆕 Tính năng mới

---

## A — VẼ & HÌNH HỌC (Drawing & Geometry)

Công cụ tạo hình trên canvas CAD. IF dùng DCEL half-edge topology
thay vì flat entity như AutoCAD — mọi đối tượng đều "biết" nó thuộc
phòng nào, giáp tường nào.

### A1 — Vẽ tường & phân vùng (Wall & Room — core)

| # | Tính năng | Mô tả | Trạng thái |
|---|---|---|---|
| A1.1 | Wall tool | Vẽ tường thẳng, gõ kích thước chính xác | ✅ |
| A1.2 | Room detection | DCEL tự nhận diện vùng kín → phòng | ✅ |
| A1.3 | Room area calc | Tính diện tích phòng tự động từ boundary | ✅ |
| A1.4 | Wall thickness | Đặt độ dày tường (single/double line) | 🔜 |
| A1.5 | Wall join auto | Tự nối góc tường chữ L, T, + | ✅ |
| A1.6 | Door/Window insert | Chèn cửa đi/cửa sổ vào tường — tự cắt opening | 🔜 |
| A1.7 | Column/Pillar | Đặt cột vuông/tròn — DCEL tự tránh | 🔜 |

### A2 — Vẽ hình học cơ bản (Geometry Primitives)

| # | Tính năng | Mô tả | Trạng thái |
|---|---|---|---|
| A2.1 | Line | Đường thẳng tự do + snap | ✅ |
| A2.2 | Polyline | Đường đa tuyến liên tục | ✅ |
| A2.3 | Rectangle | Hình chữ nhật (nhập W×H) | ✅ |
| A2.4 | Circle | Đường tròn (tâm + bán kính hoặc 3 điểm) | 🆕 |
| A2.5 | Arc | Cung tròn (3 điểm hoặc tâm + góc) | 🆕 |
| A2.6 | Ellipse | Hình elip (2 trục) | 🆕 |
| A2.7 | Polygon | Đa giác đều (3–12 cạnh) | 🆕 |
| A2.8 | Spline / Curve | Đường cong Bézier (dùng cho: bồn tắm cong, quầy bar cong, vách cong) | 🆕 |
| A2.9 | Fillet / Chamfer | Bo góc tròn / vát góc cho tường và đồ nội thất | 🆕 |
| A2.10 | Offset | Tạo đường song song (vẽ viền, lề) | 🆕 |

### A3 — Tô vật liệu & Mặt cắt (Hatch & Material Fill)

| # | Tính năng | Mô tả | Trạng thái |
|---|---|---|---|
| A3.1 | Hatch pattern fill | Tô mặt cắt theo mẫu (gạch, gỗ, đá...) | ✅ |
| A3.2 | Hatch boundary auto | Tự nhận biên phòng từ DCEL | ✅ |
| A3.3 | Material library hatch | Mẫu tô gắn với thư viện vật liệu IF | 🔜 |
| A3.4 | Gradient fill | Tô chuyển màu (dùng cho: sơ đồ chiếu sáng, phân vùng nhiệt) | 🆕 |
| A3.5 | Transparency | Độ trong suốt hatch (overlay nhiều lớp thông tin) | 🆕 |
| A3.6 | Hatch edit | Chỉnh sửa hatch đã tô: scale, góc xoay, origin | 🔜 |

### A4 — Chỉnh sửa hình học (Edit & Transform)

| # | Tính năng | Mô tả | Trạng thái |
|---|---|---|---|
| A4.1 | Move | Di chuyển đối tượng | ✅ |
| A4.2 | Copy | Sao chép | ✅ |
| A4.3 | Rotate | Xoay (nhập góc hoặc kéo) | ✅ |
| A4.4 | Scale | Thu phóng tỉ lệ | 🔜 |
| A4.5 | Mirror | Lật đối xứng (dùng nhiều cho layout đối xứng) | 🆕 |
| A4.6 | Array (rectangular) | Nhân bản theo lưới hàng × cột | 🆕 |
| A4.7 | Array (polar) | Nhân bản theo vòng tròn (bàn tròn, đèn chùm) | 🆕 |
| A4.8 | Trim / Extend | Cắt / kéo dài nét đến giao điểm | 🆕 |
| A4.9 | Break | Ngắt đoạn tại điểm chọn | 🆕 |
| A4.10 | Stretch | Kéo giãn 1 phía (resize phòng) | 🆕 |
| A4.11 | Undo / Redo | Hoàn tác không giới hạn | ✅ |

### A5 — Snap & Hỗ trợ vẽ chính xác (Precision Aids)

| # | Tính năng | Mô tả | Trạng thái |
|---|---|---|---|
| A5.1 | Grid snap | Bắt điểm lưới | ✅ |
| A5.2 | Endpoint snap | Bắt đầu/cuối nét | ✅ |
| A5.3 | Midpoint snap | Bắt trung điểm | 🔜 |
| A5.4 | Intersection snap | Bắt giao điểm | 🔜 |
| A5.5 | Perpendicular snap | Bắt vuông góc | 🆕 |
| A5.6 | Center snap | Bắt tâm đường tròn/cung | 🆕 |
| A5.7 | Ortho mode | Khoá vẽ ngang/dọc | ✅ |
| A5.8 | Polar tracking | Khoá vẽ theo góc (30°, 45°, 60°...) | 🆕 |
| A5.9 | Dynamic input | Hiện kích thước realtime khi vẽ | 🔜 |
| A5.10 | Construction line | Đường dóng phụ trợ (không in) | 🆕 |

---

## B — GHI CHÚ & KÍCH THƯỚC (Annotations & Dimensions)

### B1 — Đo kích thước (Dimensions)

| # | Tính năng | Mô tả | Trạng thái |
|---|---|---|---|
| B1.1 | Linear dimension | Đo khoảng cách ngang/dọc | 🆕 |
| B1.2 | Aligned dimension | Đo theo phương xiên | 🆕 |
| B1.3 | Radius / Diameter | Đo bán kính / đường kính | 🆕 |
| B1.4 | Angular dimension | Đo góc | 🆕 |
| B1.5 | Auto-dimension room | **IF riêng**: tự đo toàn bộ phòng từ DCEL — 1 click | 🆕 |
| B1.6 | Dimension style | Preset kiểu đo (font, mũi tên, offset) theo TCVN | 🆕 |
| B1.7 | Dimension association | Dim tự cập nhật khi resize tường/phòng | 🆕 |
| B1.8 | Area label | Nhãn diện tích tự động giữa phòng (tên + m²) | 🔜 |

### B2 — Chú thích & Đường dẫn (Labels & Leaders)

| # | Tính năng | Mô tả | Trạng thái |
|---|---|---|---|
| B2.1 | Text annotation | Ghi chú tự do (single line) | 🆕 |
| B2.2 | Multi-line text | Ghi chú dài, có format | 🆕 |
| B2.3 | Leader line | Mũi tên chỉ dẫn + text (vật liệu, thiết bị) | 🆕 |
| B2.4 | Room label auto | **IF riêng**: tên phòng + diện tích tự đặt giữa room | 🔜 |
| B2.5 | Material callout | Chỉ dẫn vật liệu: tên + mã + link thư viện | 🆕 |
| B2.6 | Revision cloud | Mây đánh dấu vùng sửa đổi (review với KH) | 🆕 |
| B2.7 | Level / Elevation mark | Ký hiệu cao độ sàn (±0.00, +0.15...) | 🆕 |

### B3 — Bảng biểu (Tables)

| # | Tính năng | Mô tả | Trạng thái |
|---|---|---|---|
| B3.1 | Table insert | Chèn bảng vào bản vẽ | 🆕 |
| B3.2 | BOQ auto-generate | **IF riêng**: bảng thống kê vật tư tự tạo từ room data | 🆕 |
| B3.3 | Schedule export | Xuất bảng → Excel (.xlsx) | 🆕 |

---

## C — THƯ VIỆN NỘI THẤT (Furniture & Symbol Library)

Thay thế Block system của AutoCAD bằng hệ thống symbol thông minh
gắn liền với metadata thiết bị.

### C1 — Symbol cơ bản (Furniture Symbols)

| # | Tính năng | Mô tả | Trạng thái |
|---|---|---|---|
| C1.1 | Drag & drop | Kéo thả từ palette vào phòng | 🆕 |
| C1.2 | Preset library | Thư viện sẵn: giường, bàn, ghế, tủ, bếp, WC, bồn tắm | 🆕 |
| C1.3 | Resize handle | Kéo co giãn theo tỉ lệ thực (nhập mm) | 🆕 |
| C1.4 | Rotate in-place | Xoay tại chỗ (snap 15° hoặc tự do) | 🆕 |
| C1.5 | Flip / Mirror | Lật trái-phải / trên-dưới | 🆕 |
| C1.6 | Auto-align to wall | Bắt dính vào tường gần nhất (tủ áp tường, bàn sát tường) | 🆕 |

### C2 — Symbol thông minh (Smart Symbols — vượt AutoCAD)

| # | Tính năng | Mô tả | Trạng thái |
|---|---|---|---|
| C2.1 | Metadata | Mỗi symbol chứa: tên, mã, kích thước, giá, nhà cung cấp | 🆕 |
| C2.2 | Clearance zone | Hiện vùng trống cần thiết (khoảng mở cửa, lối đi) | 🆕 |
| C2.3 | Variant switch | Chuyển biến thể: giường đơn↔đôi, bồn rửa 1↔2 chậu | 🆕 |
| C2.4 | Material link | Gắn với Design DNA — symbol đổi theo phong cách | 🆕 |
| C2.5 | Collision detect | Cảnh báo khi 2 đồ chồng nhau hoặc chặn lối đi | 🆕 |
| C2.6 | Operator suggest | **IF riêng**: Gu Engine gợi ý đồ nội thất phù hợp phong cách | 🆕 |

### C3 — Quản lý thư viện (Library Management)

| # | Tính năng | Mô tả | Trạng thái |
|---|---|---|---|
| C3.1 | Category browser | Duyệt theo nhóm: phòng ngủ, phòng khách, bếp, WC... | 🆕 |
| C3.2 | Search | Tìm theo tên hoặc mã | 🆕 |
| C3.3 | Custom symbol | User tự tạo symbol mới từ hình vẽ | 🆕 |
| C3.4 | Import from DXF | Import block từ file .dxf có sẵn | 🆕 |
| C3.5 | Cloud sync | Đồng bộ thư viện qua Google Drive (TTT team) | 🆕 |

---

## D — KIỂM TRA QUY CHUẨN (Standards & Compliance)

Tính năng **AutoCAD không có** — thế mạnh riêng IF.

### D1 — Quy chuẩn Việt Nam & Quốc tế

| # | Tính năng | Mô tả | Trạng thái |
|---|---|---|---|
| D1.1 | TCVN 4451:2012 | Diện tích tối thiểu phòng ở | ✅ |
| D1.2 | QCVN 06:2022 | Phòng cháy chữa cháy — khoảng cách thoát nạn | ✅ |
| D1.3 | Neufert residential | Chuẩn nhân trắc nhà ở | ✅ |
| D1.4 | Neufert hospitality | Chuẩn nhân trắc khách sạn | ✅ |
| D1.5 | Neufert office | Chuẩn nhân trắc văn phòng | ✅ |
| D1.6 | NFPA / IBC | Chuẩn PCCC quốc tế | ✅ |
| D1.7 | Accessibility check | Kiểm tra tiếp cận người khuyết tật (lối đi ≥900mm, bán kính xe lăn) | 🆕 |

### D2 — Checker tự động

| # | Tính năng | Mô tả | Trạng thái |
|---|---|---|---|
| D2.1 | One-click check | Quét toàn bộ bản vẽ — liệt kê vi phạm | ✅ |
| D2.2 | Inline highlight | Tô đỏ vùng vi phạm ngay trên CAD | ✅ |
| D2.3 | Fix suggestion | Gợi ý cách sửa (tăng diện tích, dời cửa...) | 🔜 |
| D2.4 | Report export | Xuất báo cáo vi phạm → PDF | 🆕 |
| D2.5 | Custom rule | Team tự thêm quy tắc riêng (nội quy chủ đầu tư) | 🆕 |

---

## E — MEP SƠ CẤP (Basic MEP for Interior)

Chỉ hỗ trợ **mức nội thất** — không thay thế MEP chuyên sâu (Phase 2).

### E1 — Chiếu sáng (Lighting Layout)

| # | Tính năng | Mô tả | Trạng thái |
|---|---|---|---|
| E1.1 | Lux calculator | Tính lux cần thiết theo diện tích + công năng phòng | 🆕 |
| E1.2 | Light placement suggest | Gợi ý vị trí đèn đạt tiêu chuẩn (TCVN 7114, EN 12464) | 🆕 |
| E1.3 | Light symbol | Symbol đèn downlight, đèn treo, đèn ray, đèn tường | 🆕 |
| E1.4 | Switch position | Đề xuất vị trí công tắc theo cửa ra vào | 🆕 |
| E1.5 | Circuit group hint | Gợi ý nhóm mạch (đèn chính, đèn accent, đèn đêm) | 🆕 |

### E2 — Ổ cắm & Hộp gen (Power & Utility Box)

| # | Tính năng | Mô tả | Trạng thái |
|---|---|---|---|
| E2.1 | Outlet placement | Gợi ý vị trí ổ cắm theo đồ nội thất (đầu giường, bàn làm việc, bếp) | 🆕 |
| E2.2 | Outlet density check | Kiểm tra đủ ổ cắm theo quy chuẩn (TCVN 9206:2012) | 🆕 |
| E2.3 | Gen box detect | Quét vị trí hộp gen (điện, nước, PCCC) từ DXF gốc | 🆕 |
| E2.4 | Gen box clearance | Cảnh báo nếu nội thất che hộp gen | 🆕 |
| E2.5 | Gen box relocate suggest | Đề xuất điều chỉnh nội thất nếu hộp gen bị chặn | 🆕 |
| E2.6 | AC unit position | Gợi ý vị trí cục lạnh/nóng điều hoà theo layout | 🆕 |

---

## F — AI & HỌC MÁY (AI & Machine Learning)

Tính năng **vượt AutoCAD** — lõi cạnh tranh của IF.

### F1 — Gu Engine (Style Intelligence)

| # | Tính năng | Mô tả | Trạng thái |
|---|---|---|---|
| F1.1 | Operator profile | Nhận diện loại công trình từ bản vẽ (residential/office/hotel) | ✅ |
| F1.2 | Style extraction | Đọc phong cách từ ảnh/text input | ✅ |
| F1.3 | Mood palette | Sinh bảng màu theo mood (ấm/lạnh/tối giản/luxury) | ✅ |
| F1.4 | guToPrompt | Chuyển profile → prompt render | ✅ |
| F1.5 | Design DNA link | Gắn Gu profile với thư viện Design DNA (ATLAS Vol.2) | 🔜 |

### F2 — Perceptron Layout Engine

| # | Tính năng | Mô tả | Trạng thái |
|---|---|---|---|
| F2.1 | Pairwise ranking | So sánh 2 layout — user chọn tốt hơn | ✅ |
| F2.2 | Learning-to-rank | Học từ feedback tích luỹ | ✅ |
| F2.3 | Degrade to heuristic | Fallback khi chưa đủ data | ✅ |
| F2.4 | Serialize model | Lưu/load model đã train | ✅ |
| F2.5 | Layout suggest UI | Nút Nhận/Bỏ trên LayoutShelf | 🔜 |
| F2.6 | Correction Log | Ghi lại mọi chỉnh sửa user → competitive moat | 🔜 |

### F3 — Nhận diện thông minh (Smart Detection)

| # | Tính năng | Mô tả | Trạng thái |
|---|---|---|---|
| F3.1 | Room type auto-label | Tự gán tên phòng (bedroom/kitchen/bath) từ hình dạng + đồ nội thất | 🔜 |
| F3.2 | Furniture auto-detect | Nhận diện đồ nội thất từ DXF import | 🆕 |
| F3.3 | Flow analysis | Phân tích luồng di chuyển (circulation path) | 🆕 |

---

## G — CỘNG TÁC & XUẤT BẢN (Collaboration & Output)

### G1 — Pipeline IF (CAD → Render → Present)

| # | Tính năng | Mô tả | Trạng thái |
|---|---|---|---|
| G1.1 | CAD stage | Vẽ mặt bằng | ✅ |
| G1.2 | Render stage | ComfyUI self-hosted (MacBook M1 Max) | ✅ |
| G1.3 | Present stage | Slide builder → PDF/PPTX | ✅ |
| G1.4 | Handoff bridge | Chuyển data CAD→Render→Present tự động | ✅ |
| G1.5 | Multi-sheet | Tab ≤5 sheet (CAD + Present) | ✅ |

### G2 — Import / Export

| # | Tính năng | Mô tả | Trạng thái |
|---|---|---|---|
| G2.1 | DXF import | Đọc file .dxf từ AutoCAD | ✅ |
| G2.2 | DXF export | Xuất .dxf để gửi team khác | ✅ |
| G2.3 | PDF export | Xuất bản vẽ → PDF (có layer) | 🔜 |
| G2.4 | PNG / SVG export | Xuất ảnh bản vẽ | 🔜 |
| G2.5 | .idf save/load | Format riêng IF — lưu toàn bộ: geometry + metadata + gu profile + corrections | 🆕 |
| G2.6 | PDF import | Đọc PDF bản vẽ → vector (basic) | 🆕 |

### G3 — Cộng tác & Chia sẻ

| # | Tính năng | Mô tả | Trạng thái |
|---|---|---|---|
| G3.1 | PWA mobile | Xem bản vẽ trên điện thoại (Vercel host) | 🔜 |
| G3.2 | Share link | Gửi link cho KH xem — không cần cài app | 🆕 |
| G3.3 | Markup overlay | KH ghi chú phản hồi trên bản vẽ (như Trace) | 🆕 |
| G3.4 | Version compare | So sánh 2 phiên bản thiết kế — highlight thay đổi | 🆕 |
| G3.5 | Google Drive sync | Đồng bộ .idf với Google Drive (SSOT) | 🔜 |

---

## H — TIỆN ÍCH & QUẢN LÝ (Utilities & Management)

### H1 — Quản lý bản vẽ (Drawing Management)

| # | Tính năng | Mô tả | Trạng thái |
|---|---|---|---|
| H1.1 | Layer manager | Quản lý layer: tường, nội thất, kích thước, MEP, ghi chú | 🔜 |
| H1.2 | Layer visibility | Ẩn/hiện từng layer | 🔜 |
| H1.3 | Layer lock | Khoá layer (chống sửa nhầm) | 🆕 |
| H1.4 | Drawing template | Bản vẽ mẫu theo loại dự án (nhà ở, văn phòng, khách sạn) | 🆕 |
| H1.5 | Title block | Khung tên tự động (tên DA, tỉ lệ, ngày, người vẽ) | 🆕 |

### H2 — Dọn dẹp & Tối ưu (Cleanup)

| # | Tính năng | Mô tả | Trạng thái |
|---|---|---|---|
| H2.1 | Duplicate remove | Xoá nét trùng (tương đương Overkill) | ✅ |
| H2.2 | Purge unused | Dọn symbol/layer không dùng | 🆕 |
| H2.3 | File size optimize | Nén .idf (gỡ undo history khi save-as) | 🆕 |

### H3 — Người dùng & Quyền (User & Access)

| # | Tính năng | Mô tả | Trạng thái |
|---|---|---|---|
| H3.1 | Google OAuth | Đăng nhập bằng Google @ttt.vn | ✅ |
| H3.2 | Admin manual add | Admin cấp tay cho user ngoài domain | ✅ |
| H3.3 | Grandfather rule | User cũ ngoài @ttt.vn tiếp tục dùng | ✅ |
| H3.4 | Remember Me | Nhớ đăng nhập 30 ngày | ✅ |
| H3.5 | Role-based access | Phân quyền: viewer / editor / admin | 🆕 |

---

## Tổng kết số lượng

| Nhóm | Tổng tính năng | ✅ Đã có | 🔜 Sắp làm | 🆕 Mới |
|---|---|---|---|---|
| A — Vẽ & Hình học | 31 | 11 | 5 | 15 |
| B — Ghi chú & Kích thước | 17 | 0 | 2 | 15 |
| C — Thư viện Nội thất | 17 | 0 | 0 | 17 |
| D — Kiểm tra Quy chuẩn | 12 | 8 | 1 | 3 |
| E — MEP Sơ cấp | 11 | 0 | 0 | 11 |
| F — AI & Học máy | 14 | 9 | 3 | 2 |
| G — Cộng tác & Xuất bản | 14 | 7 | 4 | 3 |
| H — Tiện ích & Quản lý | 13 | 5 | 2 | 6 |
| **TỔNG** | **129** | **40** | **17** | **72** |

> **IF đã hoàn thành 31%** — phần lõi mạnh nhất là AI + Quy chuẩn + Pipeline.
> Phần còn thiếu nhiều nhất: Thư viện nội thất (C) và Ghi chú/Kích thước (B).

---

## Gợi ý thứ tự build (cho Claude Code)

| Đợt | Nhóm | Lý do ưu tiên |
|---|---|---|
| Sprint 3 | B1 (Dimensions) + A2.4–A2.6 (Circle/Arc) | User thấy ngay: bản vẽ có kích thước = chuyên nghiệp |
| Sprint 4 | C1–C2 (Furniture library) | Giá trị lớn nhất: kéo thả đồ nội thất |
| Sprint 5 | A4.5–A4.10 (Mirror/Array/Trim) + A5 (Snap mở rộng) | Tăng tốc vẽ |
| Sprint 6 | E1–E2 (MEP sơ cấp) | Differentiator — AutoCAD không làm được cho nội thất |
| Sprint 7 | G2.5 (.idf format) + G3 (Collaboration) | Khoá người dùng vào hệ sinh thái IF |
| Sprint 8 | H1 (Layer manager) + B2–B3 (Labels/Tables/BOQ) | Hoàn thiện workflow chuyên nghiệp |
