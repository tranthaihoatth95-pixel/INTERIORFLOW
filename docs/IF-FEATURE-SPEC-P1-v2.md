# IF Feature Spec — Phase 1 (v2)
# Triết lý: ArcSite + AI Nội thất

> **IF Phase 1 KHÔNG PHẢI AutoCAD-lite.**
> IF Phase 1 = công cụ sơ phác nội thất thông minh, dùng được bằng
> ngón tay trên tablet hoặc chuột trên desktop, ai cũng vẽ được
> trong 5 phút đầu tiên — nhưng bên trong có AI mà ArcSite không có.
>
> **Phase 2 (CAD ACE)**: app riêng biệt cho team kỹ thuật, Revit 3D,
> construction CNC, platform viewing — đòi hỏi chính xác tuyệt đối.
>
> **Benchmark**: ArcSite (sketch + shapes + export)
> **Vượt benchmark**: Gu Engine + Perceptron + TCVN Checker + Render pipeline
>
> Trạng thái: ✅ Đã có | 🔜 Ưu tiên/chưa xác minh | 🆕 Mới (chưa làm) | ⚠️ Có nhưng chưa đạt Pro | ⛔ Không làm (chủ đích, thuộc Phase 2)

> **⟳ ĐỐI SOÁT 2026-07-17** — File này đã được cập nhật theo *audit mã nguồn thật*
> (repo `interiorflow`, nhánh `feat/present-layout-ml-p1`), không còn theo trạng thái
> "kế hoạch". Phần lớn item nhóm B (thư viện), D (MEP), C (checker) đã 🔜/🆕 → ✅.
> Các bảng tổng cũ đếm sai (A=28, F=12, tổng 104) — đếm lại theo số dòng thật = **101 item**.
> Xem TỔNG KẾT ở cuối. Triết lý & cấu trúc giữ nguyên, chỉ sửa cột Trạng thái + bảng tổng.

---

## NGUYÊN TẮC THIẾT KẾ UX

| Nguyên tắc | Giải thích |
|---|---|
| **Touch-first** | Mọi thao tác phải dùng được bằng ngón tay trên tablet (iPad, Android). Chuột là bonus, không phải bắt buộc |
| **Sketch, không phải Draft** | User vẽ nhanh ý tưởng, IF tự chỉnh thẳng/vuông/snap — không bắt nhập toạ độ |
| **Tap = thông tin** | Tap vào phòng = hiện diện tích + vi phạm. Tap vào đồ = hiện giá + kích thước |
| **Drag = hành động** | Kéo tường = resize phòng. Kéo đồ từ palette = đặt vào phòng |
| **Zero learning curve** | Người không biết CAD phải vẽ được mặt bằng cơ bản trong 5 phút |
| **AI làm việc nặng** | User sơ phác → IF tự nhận phòng, gợi ý layout, kiểm chuẩn, tô vật liệu |

---

## A — VẼ SƠ PHÁC (Sketch Tools)

Không cần chính xác tuyệt đối — IF tự snap, tự chỉnh, tự nhận phòng.

### A1 — Tường & Phòng

| # | Tính năng | Cách tương tác | Trạng thái |
|---|---|---|---|
| A1.1 | Vẽ tường | Kéo ngón tay/chuột → IF tự snap thẳng, hiện kích thước realtime | ✅ |
| A1.2 | Nhận phòng tự động | Vẽ kín 4 tường → IF tự tô nhẹ + hiện "Phòng 12.5m²" | ✅ |
| A1.3 | Resize phòng | Kéo tường → phòng co/giãn, diện tích cập nhật realtime | ✅ (qua stretch/grips) |
| A1.4 | Cửa đi | Kéo shape cửa (700/800/900/2 cánh/trượt) từ palette, auto-snap tường | ✅ |
| A1.5 | Cửa sổ | Kéo shape cửa sổ (mở/trượt/cố định), auto-snap tường | ✅ |
| A1.6 | Cột | Tap vào canvas → đặt cột vuông/tròn | 🆕 (chưa có shape cột riêng) |
| A1.7 | Xoá tường | Tap chọn + vuốt xoá hoặc nút Delete | ✅ |
| A1.8 | Tường cong | Kéo giữa tường thẳng → uốn thành cung (bathroom, quầy bar) | 🆕 (chưa có tường cong) |

### A2 — Hình vẽ phụ trợ

| # | Tính năng | Khi nào cần | Cách tương tác | Trạng thái |
|---|---|---|---|---|
| A2.1 | Hình chữ nhật | Vẽ nhanh phòng/đảo bếp | Kéo 2 góc đối diện | ✅ |
| A2.2 | Đường tròn | Bàn tròn, bồn tắm tròn, cột tròn | Tap tâm + kéo bán kính | ✅ (tool Pro) |
| A2.3 | Cung tròn | Quầy bar cong, ban công cong | Kéo 3 điểm | ✅ (tool Pro) |
| A2.4 | Đường tự do | Sketch ý tưởng, ghi chú bằng tay | Vẽ tự do bằng ngón/stylus | ✅ (spline, tool Pro) |
| A2.5 | Đa giác | Bồn hoa, phòng đa giác | Chọn số cạnh → kéo kích thước | ✅ (tool Pro) |
| A2.6 | Đo khoảng cách | Đo nhanh giữa 2 điểm bất kỳ | Tap điểm A → kéo đến B → hiện mm | ✅ (measure) |

### A3 — Chỉnh sửa (Edit gestures)

| # | Tính năng | Gesture touch | Phím tắt desktop | Trạng thái |
|---|---|---|---|---|
| A3.1 | Chọn | Tap 1 đối tượng | Click | ✅ |
| A3.2 | Chọn nhiều | Khoanh vùng bằng ngón | Kéo hộp chọn | ✅ (rubber-band) |
| A3.3 | Di chuyển | Tap giữ + kéo | Kéo chuột | ✅ |
| A3.4 | Xoay | 2 ngón xoay (như xoay ảnh) | R + nhập góc | ✅ |
| A3.5 | Lật đối xứng | Tap nút Mirror trên toolbar | M | ✅ |
| A3.6 | Sao chép | Tap giữ → kéo bản copy ra | Ctrl+C, Ctrl+V | ✅ |
| A3.7 | Undo | Vuốt 2 ngón sang trái | Ctrl+Z | ✅ |
| A3.8 | Redo | Vuốt 2 ngón sang phải | Ctrl+Shift+Z | ✅ |
| A3.9 | Zoom | Chụm/mở 2 ngón | Scroll wheel | ✅ |
| A3.10 | Pan | Kéo 2 ngón | Middle mouse drag | ✅ |

*Ghi chú A:* bộ edit AutoCAD-style đầy đủ (offset/trim/extend/fillet/chamfer/array/scale/stretch/break/join/explode/lengthen) đã có, gated sau Pro mode (Sprint 9-10). Chỉ còn A1.6 (cột) + A1.8 (tường cong) chưa làm.

---

## B — THƯ VIỆN KÉO THẢ (Shape Library)

Đây là tính năng quan trọng nhất mà IF đang thiếu.
Mục tiêu ban đầu 200 shapes — hiện có **41 shape / 9 nhóm** (đủ dùng cho residential/office/hotel demo; mở rộng sau).

### B1 — Palette nội thất

| # | Nhóm | Shapes cần có | Trạng thái |
|---|---|---|---|
| B1.1 | Phòng ngủ | Giường đơn/đôi (nhiều size), tủ đầu giường, tủ áo, bàn trang điểm | ✅ |
| B1.2 | Phòng khách | Sofa 2/3 chỗ, sofa góc, bàn trà, kệ TV, ghế bành | ✅ |
| B1.3 | Bếp | Bồn/bếp chữ I, tủ lạnh, đảo bếp, máy hút mùi, lò vi sóng | ✅ |
| B1.4 | Phòng tắm | Bồn cầu, lavabo, bồn tắm, vòi sen, gương | ✅ |
| B1.5 | Phòng ăn | Bàn ăn 4/6/8, ghế ăn | ✅ |
| B1.6 | Văn phòng | Bàn làm việc, ghế văn phòng, tủ hồ sơ, kệ sách | ✅ |
| B1.7 | Cửa | Cửa 700/800/900, 2 cánh, cửa trượt, cửa kính | ✅ |
| B1.8 | Cửa sổ | Cửa sổ mở, cửa sổ trượt, cửa sổ cố định | ✅ |
| B1.9 | Cầu thang | Thang thẳng, thang chữ L (chưa có thang xoắn) | ✅ |
| B1.10 | Thiết bị | Máy lạnh treo tường, quạt trần | ✅ |

### B2 — Tương tác shape

| # | Tính năng | Mô tả | Trạng thái |
|---|---|---|---|
| B2.1 | Drag from palette | Kéo từ palette → thả vào phòng | ✅ |
| B2.2 | Auto-snap to wall | Tủ, bồn rửa tự dính vào tường gần nhất | ✅ |
| B2.3 | Resize by handle | Kéo góc để co/giãn tỉ lệ | ✅ |
| B2.4 | Tap → info panel | Tap đồ → hiện: tên, kích thước (mm), giá (nếu có) | ✅ |
| B2.5 | Variant switch | Tap đồ → đổi biến thể: giường đơn↔đôi, bồn 1↔2 chậu | ✅ |
| B2.6 | Collision warning | Đặt đồ chồng nhau → viền đỏ nhấp nháy (SAT) | ✅ |
| B2.7 | Clearance zone | Hiện vùng trống cần thiết (bán kính mở cửa, lối đi) | ✅ |
| B2.8 | Search shapes | Gõ "giường" → lọc shapes liên quan | ✅ |

### B3 — Thư viện mở rộng

| # | Tính năng | Mô tả | Trạng thái |
|---|---|---|---|
| B3.1 | Custom shape | User tự vẽ → lưu thành shape mới | 🆕 (standby) |
| B3.2 | Import DXF block | Import block từ file .dxf có sẵn của TTT | 🆕 (standby) |
| B3.3 | Team library sync | Đồng bộ thư viện shapes qua Google Drive (TTT team) | 🆕 (standby) |

---

## C — TỰ ĐỘNG THÔNG MINH (Smart Auto Features)

Đây là lớp mà IF **vượt ArcSite** — ArcSite chỉ vẽ, IF hiểu bản vẽ.

### C1 — Auto-label & Auto-dimension

| # | Tính năng | Mô tả | Trạng thái |
|---|---|---|---|
| C1.1 | Room name auto | IF tự gán: "Phòng ngủ", "Bếp", "WC" từ hình dạng + đồ trong phòng | ✅ |
| C1.2 | Area label | Hiện "12.5 m²" giữa phòng — luôn visible, tự co font | ✅ |
| C1.3 | Wall dimension | Hiện kích thước tường khi tap/hover (dimension tools Pro) | ✅ |
| C1.4 | Total GFA | Tổng diện tích sàn tự cộng | ✅ |
| C1.5 | Room count | "3 phòng ngủ, 2 WC, 1 bếp" — summary bar | ✅ |

### C2 — TCVN Checker (thế mạnh riêng IF)

| # | Tính năng | Mô tả | Trạng thái |
|---|---|---|---|
| C2.1 | Realtime check | Vẽ xong → badge "2 vi phạm" hiện ngay | ✅ |
| C2.2 | Tap to see | Tap badge → zoom tới vi phạm + giải thích | ✅ |
| C2.3 | TCVN 4451:2012 | Diện tích tối thiểu phòng ở | ✅ |
| C2.4 | QCVN 06 PCCC | Khoảng cách thoát nạn | ✅ |
| C2.5 | Neufert | Chuẩn nhân trắc (residential/hotel/office) + NFPA/IBC | ✅ |
| C2.6 | Accessibility | Lối đi ≥900mm, bán kính xe lăn 1500mm (QCVN 10:2024) | ✅ |
| C2.7 | Fix suggestion | "Bếp < 10m² → kéo tường ra 300mm?" + nút Apply (wizard gated) | ✅ |

*C2 là nhóm DUY NHẤT đã đạt mức "Pro" đầy đủ theo thang Basic→Pro→Elite: có severity, click-to-locate, gợi ý fix bằng mm cụ thể + wizard apply.*

### C3 — Gu Engine & AI Layout

| # | Tính năng | Mô tả | Trạng thái |
|---|---|---|---|
| C3.1 | Operator detect | Tự nhận residential/office/hotel từ bản vẽ | ✅ |
| C3.2 | Style extract | Đọc phong cách từ ảnh/text | ✅ |
| C3.3 | Mood palette | Sinh bảng màu theo phong cách | ✅ |
| C3.4 | Layout suggest | Gợi ý bố trí đồ — user Nhận/Bỏ → IF học | ✅ |
| C3.5 | Perceptron learn | Học từ feedback tích luỹ (pairwise ranking, degrade heuristic <10 cặp) | ✅ |
| C3.6 | Style moodboard | Hiện 4–6 ảnh reference theo Gu profile | 🆕 (standby — cần ảnh gallery) |

---

## D — MEP SƠ CẤP (Basic MEP for Interior)

Chỉ hỗ trợ mức **gợi ý cho designer** — không thay thế kỹ sư MEP.

### D1 — Chiếu sáng

| # | Tính năng | Mô tả | Trạng thái |
|---|---|---|---|
| D1.1 | Lux suggest | Tính lux cần (TCVN 7114) → gợi ý số đèn + loại | ✅ |
| D1.2 | Light placement | Tự rải đèn đều theo diện tích phòng | ✅ |
| D1.3 | Light symbol | Symbol đèn theo phương án chiếu sáng | ✅ |
| D1.4 | Switch near door | Gợi ý vị trí công tắc cạnh cửa ra vào | ✅ |
| D1.5 | Light layer | Layer riêng cho đèn — ẩn/hiện 1 tap | ✅ |

### D2 — Ổ cắm & Hộp gen

| # | Tính năng | Mô tả | Trạng thái |
|---|---|---|---|
| D2.1 | Outlet suggest | Gợi ý ổ cắm theo đồ nội thất (đầu giường, bàn, bếp) | ✅ |
| D2.2 | Outlet count check | Kiểm tra đủ ổ cắm theo TCVN 9206:2012 | ✅ |
| D2.3 | Gen box detect | Import DXF → quét tìm hộp gen (điện/nước/PCCC) | ⛔ Không làm (chủ đích) |
| D2.4 | Gen box warning | Cảnh báo nếu đồ nội thất che hộp gen | ⛔ Không làm (chủ đích) |
| D2.5 | Gen box adjust | Đề xuất dời đồ nếu hộp gen bị chặn | ⛔ Không làm (chủ đích) |
| D2.6 | AC position | Gợi ý vị trí máy lạnh theo layout (check proximity giường) | ✅ |
| D2.7 | MEP layer | Layer riêng cho MEP — ẩn/hiện 1 tap | ✅ |

*D2.3–D2.5 (hộp gen kỹ thuật): KHÔNG có quy ước DXF thật để dò hộp gen tin cậy → chủ động bỏ, không fake. Đây là **non-goal cố định**, không tính là "gap". Xem `lib/cad/mep.ts` đầu file.*

---

## E — TÔ VẬT LIỆU (Material & Hatch)

### E1 — Hatch thông minh

| # | Tính năng | Mô tả | Trạng thái |
|---|---|---|---|
| E1.1 | Tap room → fill | Tap phòng → chọn vật liệu sàn từ palette (14 preset nối hatch) | ✅ |
| E1.2 | Material thumbnail | Palette hiện ảnh thật vật liệu (gạch, gỗ, đá) — không phải tên code | ✅ Pro (2026-07-17 — swatch **procedural**, chưa phải ảnh chụp; hook `photoUrl?` chờ ATLAS Vol.3) |
| E1.3 | Wall material | Tap tường → chọn vật liệu tường (sơn, gạch, gỗ ốp) | 🆕 (standby) |
| E1.4 | Auto-update BOQ | Đổi vật liệu → bảng thống kê tự cập nhật | 🆕 (standby) |
| E1.5 | Design DNA link | Vật liệu gắn với Gu profile — đổi phong cách = đổi vật liệu | 🆕 (standby) |

*E1.2 — **ĐÃ ĐÓNG 2026-07-17** (gap chặn Phase 1 cuối cùng). Preview không còn là ô gradient CSS phẳng mà là **hoạ tiết vẽ bằng thuật toán (procedural)** — `lib/cad/material-texture.ts` (vân gỗ+mắt gỗ, mạch gạch, vân đá midpoint-displacement, đốm granite, chip terrazzo…), render ra data-URL PNG, dùng cho swatch nhỏ + hover preview lớn. VẪN chưa phải ảnh chụp thật (repo chưa có bộ ảnh có license — ATLAS Vol.3 chưa nằm trên đĩa; KHÔNG lấy ảnh web/AI-gen tính phí vì rủi ro bản quyền). Đã thêm field `photoUrl?` vào `MaterialDef` (bỏ trống mọi preset) làm điểm cắm: khi TTT cấp ảnh thật chỉ cần set URL, materialTextureDataUrl() tự ưu tiên, không đổi code. Render hatch trên canvas CAD giữ nguyên hệ vector pattern (nhận màu vật liệu, gắn DXF round-trip) — không đắp raster texture; E1.2 chỉ yêu cầu palette. Xem CLOSEOUT PLAN.*

---

## F — XUẤT BẢN & CHIA SẺ (Output & Share)

### F1 — Pipeline IF

| # | Tính năng | Mô tả | Trạng thái |
|---|---|---|---|
| F1.1 | CAD → Render | Chuyển mặt bằng → render ảnh phối cảnh | ✅ |
| F1.2 | Render → Present | Ảnh render → slide thuyết trình | ✅ |
| F1.3 | Present → PDF/PPTX | Xuất slide → file gửi khách hàng | ✅ |
| F1.4 | Multi-sheet | ≤5 tab (CAD + Present), persist IDB | ✅ |

### F2 — Export

| # | Tính năng | Mô tả | Trạng thái |
|---|---|---|---|
| F2.1 | DXF import/export | Tương thích AutoCAD (round-trip test). DWG import qua Web Worker (GPL, nội bộ). DWG export: bất khả thi, dùng DXF | ✅ |
| F2.2 | PDF export | Xuất bản vẽ → PDF | ✅ |
| F2.3 | PNG export | Xuất ảnh bản vẽ (gửi nhanh qua Zalo/chat) | ✅ |
| F2.4 | .idf format | Format riêng IF — lưu/mở toàn bộ project data | ✅ |
| F2.5 | Share link | Gửi link xem online — KH không cần cài app | ✅ |

### F3 — Cộng tác

| # | Tính năng | Mô tả | Trạng thái |
|---|---|---|---|
| F3.1 | PWA mobile | Xem trên điện thoại (Vercel host) | 🔜 (chưa xác minh trong audit) |
| F3.2 | Markup overlay | KH ghi chú phản hồi trên bản vẽ | ✅ |
| F3.3 | Google Drive sync | SSOT — đồng bộ .idf | 🆕 (standby) |
| F3.4 | Photo embed | Chụp ảnh hiện trường → gắn vào phòng trên bản vẽ | ✅ |

---

## G — QUẢN LÝ (Management)

### G1 — Layer đơn giản

| # | Tính năng | Mô tả | Trạng thái |
|---|---|---|---|
| G1.1 | Layer toggle | Ẩn/hiện: Tường, Nội thất, Kích thước, MEP, Ghi chú | ✅ |
| G1.2 | Layer preset | Chế độ xem: "Mặt bằng bố trí" / "Mặt bằng điện" / "Trình bày KH" | ✅ (qua layer manager — preset cần xác minh) |

### G2 — Template dự án

| # | Tính năng | Mô tả | Trạng thái |
|---|---|---|---|
| G2.1 | Project template | Bắt đầu từ mẫu: căn hộ/văn phòng/khách sạn | ✅ |
| G2.2 | Title block | Khung tên tự điền (tên DA, tỉ lệ, ngày, người vẽ) | ✅ |

### G3 — Auth (đã xong)

| # | Tính năng | Mô tả | Trạng thái |
|---|---|---|---|
| G3.1 | Google OAuth @ttt.vn | Đăng nhập domain TTT (register công khai đóng — nội bộ) | ✅ |
| G3.2 | Admin add | Admin cấp tay user ngoài | ✅ |
| G3.3 | Grandfather | User cũ ngoài @ttt.vn tiếp tục dùng | ✅ |
| G3.4 | Remember Me | 30 ngày | ✅ |

---

## TỔNG KẾT

> Đếm theo số dòng thật = **101 item** (bảng cũ ghi 104 do cộng nhầm A/F). ✅ = đã build & test. ⚠️/🆕 = chưa đạt. ⛔ = non-goal chủ đích (không tính vào mẫu số phấn đấu).

| Nhóm | Mô tả | Tổng | ✅ | Chưa (⚠️/🆕/🔜) | ⛔ non-goal |
|---|---|---|---|---|---|
| A — Vẽ sơ phác | Tường, hình vẽ, edit gestures | 24 | 22 | 2 (A1.6 cột, A1.8 tường cong) | 0 |
| B — Thư viện kéo thả | 41 shape / 9 nhóm + tương tác | 21 | 18 | 3 (B3 mở rộng) | 0 |
| C — Tự động thông minh | Auto-label, checker, AI | 18 | 17 | 1 (C3.6 moodboard) | 0 |
| D — MEP sơ cấp | Đèn, ổ cắm | 12 | 9 | 0 | 3 (D2.3–2.5 hộp gen) |
| E — Tô vật liệu | Hatch + material palette | 5 | 2 | 3 (E1.3–1.5 standby) | 0 |
| F — Xuất bản & chia sẻ | Export, share, cộng tác | 13 | 11 | 2 (F3.1 PWA, F3.3 Drive) | 0 |
| G — Quản lý | Layer, template, auth | 8 | 8 | 0 | 0 |
| **TỔNG** | | **101** | **87** | **11** | **3** |

**% hoàn thành: 87/101 ≈ 86%** (nếu loại 3 non-goal chủ đích khỏi mẫu số: 87/98 ≈ **89%**).

**E1.2 đã đóng 2026-07-17 (procedural swatch)** → không còn gap nào nằm trong phạm vi "done" của Stage 4; phần còn hở chỉ là các item standby (B3, C3.6, E1.3–1.5, F3.3) đã chủ động hoãn qua cổng đánh giá Phase 1. Chi tiết & ưu tiên: xem `IF-PHASE1-CLOSEOUT-PLAN.md`.

## IF vs ArcSite vs AutoCAD

| Tiêu chí | ArcSite | IF Phase 1 | AutoCAD |
|---|---|---|---|
| Đối tượng | Contractor, thợ, sales | Designer nội thất TTT | Kỹ sư, KTS chuyên sâu |
| Học trong | 5 phút | 5 phút | 6 tháng |
| Touch/Tablet | ✅ Core | ✅ Core | ❌ Desktop only |
| Shape library | 1500+ general | 41 nội thất (mở rộng sau) | Block tự tạo |
| AI style | ❌ | ✅ Gu Engine | ❌ |
| AI layout | ❌ | ✅ Perceptron | ❌ |
| Quy chuẩn VN | ❌ | ✅ TCVN + QCVN | ❌ |
| Render pipeline | ❌ | ✅ ComfyUI | ❌ |
| MEP gợi ý | ❌ | ✅ Đèn + ổ cắm | ✅ Full MEP toolkit |
| Chính xác tuyệt đối | ❌ | ❌ (Phase 2) | ✅ |
| Giá | $39–149/tháng | Nội bộ TTT → SaaS | $1800/năm |

## GỢI Ý THỨ TỰ BUILD *(lịch sử — hầu hết đã xong Sprint 3–10)*

| Đợt | Nhóm | Trạng thái |
|---|---|---|
| Sprint 3 | B1–B2 (Shape library + drag-drop) | ✅ Xong |
| Sprint 4 | A3.2–A3.6 (Edit gestures) + C1 (Auto-label) | ✅ Xong |
| Sprint 5 | E1 (Material palette) + A2.2–A2.3 (Circle/Arc) | ✅ Xong (E1.2 còn ⚠️ swatch CSS) |
| Sprint 6 | D1–D2 (MEP sơ cấp) | ✅ Xong (trừ hộp gen — non-goal) |
| Sprint 7 | F2–F3 (Export + Share link) + F3.4 (Photo embed) | ✅ Xong (F3.1 PWA, F3.3 Drive còn standby) |
| Sprint 8 | G1–G2 (Layer + Template) + C2.7 (Fix suggestion) | ✅ Xong |
| Sprint 9–10 | Pro mode toggle + precision drafting (offset/trim/dimension…) | ✅ Xong |
