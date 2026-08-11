# TƯ VẤN HỆ LÕI & LUỒNG — 11/08/2026 (kiến trúc sư trưởng, kiểm code thật từng dòng)

> Trả lời yêu cầu Hoà: "kiểm thật kỹ, tư vấn ngọn nguồn dựa trên sự thật tất định của app;
> luồng từ cấp lớn nhất đến nhỏ nhất, bảng có cột quan hệ; mâu thuẫn phải nêu".
> Mọi ô Trạng thái đều grep/đọc code 11/08 — không chép spec, không chép báo cáo cũ.
> Tên hệ CẤP 1 đã ghi `00-CHOT.md` cùng ngày.

## §1 · BẢNG TỔNG — luồng/tính năng từ cấp lớn nhất → nhỏ nhất

Cột **ĐỌC** = ăn từ lõi nào · cột **NUÔI** = đầu ra của nó ai dùng tiếp — hai cột này là
"mối quan hệ": một hàng mà cột NUÔI trống là tính năng mồ côi, phải xét lại.

### A · LUỒNG CẤP APP (lớn nhất)

| Luồng | Nhu cầu designer giải quyết | Trạng thái (bằng chứng) | ĐỌC | NUÔI |
|---|---|---|---|---|
| **Pipeline 0→3** (ý tưởng→2D→3D→hồ sơ) | một dự án đi trọn không xuất-nhập | 🟡 2D→3D→Trình chiếu chạy; chặng 0 Ý tưởng ⬜ (route không tồn tại) | DocCore | mọi chặng sau |
| **Task lẻ nhảy thẳng** (có file sẵn → vào đúng chặng) | không bị ép đi từ đầu | ✅ luật X2/X3 chạy — mọi chặng mở độc lập, empty state làm được việc tại chỗ | DocCore | Bảng việc (khi có TaskContext) |
| **Cộng tác / chia sẻ** | nhiều người một dự án, khách xem | 🟡 presence + trang share có; comment là công cụ dev (ghi JSON gốc repo), ChatMessage KHÔNG projectId (schema:246), khách-qua-link bị chặn auth | — | Trình chiếu, Chat |
| **Quản trị & R1 desktop** | dùng nội bộ ổn định | 🟡 Electron bind 127.0.0.1, snapshot DB trước schema, preflight có; GPL DWG treo | — | phát hành |

### B · WORKSPACE (CẤP 0.5)

| Workspace | Nhu cầu | Trạng thái | ĐỌC | NUÔI |
|---|---|---|---|---|
| Tổng quan · Dự án&Flow | vào việc nhanh, quản phiên bản | ✅ | DocCore | mọi chặng |
| Files (chợ đầu mối) | file thật trên đĩa | ✅ UI · 🔴 ruột đọc `mock-data.ts` (queries.ts:3) | đĩa thật (real-fs có) | Library, các chặng |
| Master Library (cửa hàng) | món có ngữ nghĩa, tái dùng | ✅ UI tấm nổi · 🔴 `LIBRARY_DATA_IS_MOCK=true` (shelves.ts:25) | .idfc (tương lai) | 2D·3D·BOQ·Trình chiếu |
| Bảng việc / Lịch / Gantt | luồng việc của team | ✅ Bảng + template 2 luồng (11/08) · Lịch/Gantt ⬜ (mock `.dc.html` có) · 🔴 Task không biết workspace/entity (schema:539-554 chỉ title/status/assignee/due) | — | **đáng lẽ nuôi mọi chặng — hiện là ỐC ĐẢO** |
| Chat nhóm | trao đổi tại chỗ | 🟡 toàn-công-ty, không theo dự án | — | — |
| Chặng-workspace (Sơ phác/Chuyên/Paper · Node/3D/Chiếu sáng/Render Studio · 6 hồ sơ) | đúng bộ tool đúng lúc | 🟡 2D đủ · Chiếu sáng dùng chung Doc.lighting (chốt 10/08) · Render Studio = mock Figma · hồ sơ 1/6 thật | DocCore | lẫn nhau qua Doc |

### C · TÁM HỆ XUYÊN APP (CẤP 1)

| Hệ | Nhu cầu | Trạng thái (bằng chứng 11/08) | ĐỌC | NUÔI |
|---|---|---|---|---|
| Một Nguồn (DocCore) | sửa 1 nơi, mọi nơi thấy | ✅ X1 chạy: dựng 3D ghi Doc, 2D tự có | — | TẤT CẢ — đây là lợi thế gốc |
| Hợp đồng 4 câu | chặn tính năng mồ côi | ⬜ mới ghi sổ 11/08 | — | quy trình nghiệm thu |
| Ánh Sáng Trạng Thái | thấy ngay việc đang chạy/cần chú ý | 🟡 glyph 3 quỹ đạo ✅ · LightPulse alert ✅ (VitalsStateBadge) · **LightArc/LightRing ⬜ (grep 0 hit)** | trạng thái job/queue | upload, render queue, xuất file, Vitals |
| Nấc Suy Nghĩ (ThinkDial) | trả đúng giá cho từng câu hỏi, tiết kiệm usage | ⬜ cần gạt chưa có · 4 engine dưới ✅ (nhanh · docContext đã nối · violations đã nối · RAG trích nguồn) | Doc + chuẩn + RAG | mọi lời Vitals |
| Công Thức Khối (BuildRecipe) | sửa lại tham số sau khi dựng | 🟡 9 lệnh chạy một-lần + UI · **stack sửa-lại ⬜** | BuildOp union (đã mở) | .idfc, Impact preview, BOQ |
| Lắp Trước Dựng Sau | 80% cảnh là lắp món có sẵn | 🟡 kéo-thả có · instance THAM SỐ ⬜ · kho mock | Library | 3D, BOQ, Trình chiếu |
| Bắt Điểm Hợp Nhất | vẽ nhanh mà đúng | 🟡 2D đủ (inference+ortho+dynamic input) · 3D có snap/trục riêng · chưa MỘT engine | hình học Doc | mọi thao tác vẽ/dựng |
| Undo Trước Hỏi Sau | không sợ sai | 🟡 undo phủ rộng · chưa quét confirm thừa | history Doc | mọi thao tác ghi |

### D · BỘ NHẬP LỆNH (CẤP 2 — bốn mặt của MỘT registry)

| Mặt | Nền chính | Trạng thái |
|---|---|---|
| Dòng lệnh + VCB (`L`, `W 200`, `3x`, `/3`) | Desktop | ✅ 2D chạy (parseVcbToken nối CadCanvas) |
| HotkeyMap | Desktop | 🟡 registry 97 alias, 59 khai surfaces nhưng mới dùng **2/6 mặt** (statusbar 51 + shortcut 4); dock/chuột-phải/⌘K/LLM chưa ăn từ registry |
| Đĩa lệnh chạm-giữ (pie menu) | Touch | 🟡 `RadialToolMenu.tsx` ✅ nhưng mới mount ở In ấn — chưa nạp lệnh theo đối tượng cho 3D/2D touch |
| Dải số nổi (NumStrip) | Touch | ⬜ chưa có — VCB lib sẵn, thiếu UI tại điểm thả |

### E · TOOL THEO CHẶNG (nhỏ nhất — chỉ liệt kê mục ĐANG LỆCH, đủ bộ xem `IF-FEATURE-TREE.md` 461 mục)

| Tool | Trạng thái đáng chú ý |
|---|---|
| Dock 3D | ✅ 11/08 thu gọn chỉ nút thật (5/5 bấm được); 12 lệnh chờ máy-trạng-thái-công-cụ ở bảng "Thêm" |
| Xuất PNG sequence (video nguồn) | 🟡 `captureSequence` chạy thật nhưng kẹt ở route bench tạm — thiếu 1 nút |
| Camera mức V-Ray | ⬜ tab Camera placeholder (2 điểm tụ, DOF, safe frame) |
| Hồ sơ Trình chiếu | Deck ✅ · A3/BOQ/Văn bản/Video/HTML lộ frontier ở màn chọn (PresentDocTypePicker ✅) |

## §2 · MÂU THUẪN PHẢI NÊU (10 điểm, có bằng chứng)

1. **Task ốc đảo ↔ triết lý "mật thiết"** — Bảng việc vừa có template nhưng `Task` không mang
   `{stage, workspaceId, entityId}` ⇒ việc không trỏ được vào cảnh/bản vẽ, workspace không tạo
   được việc có ngữ cảnh. Đây là mâu thuẫn NẶNG NHẤT với lợi thế một-nhà. → TaskContext Link.
2. **BuildOp một-lần ↔ lời hứa `.idfc` "đổi 1 chỗ lan 5 nơi"** — không có stack non-destructive
   thì lan truyền chết ở cấp hình học (đổi profile chân bàn = dựng lại từ đầu).
3. **Library/FM: mặt tiền thật, kho giả** — UI ship rồi nhưng `LIBRARY_DATA_IS_MOCK=true`, FM đọc
   mock-data trong khi `LibraryAsset` DB + `real-fs.ts` chạy được. "Lắp Trước Dựng Sau" chưa có kho.
4. **ChatMessage không projectId** — trái SPEC-COLLABORATION §1 (câu treo từ 08/08, Hoà chưa quyết).
5. **Neufert đang ship trong repo** — trái SPEC-KNOWLEDGE-BASE §5 "không ship kèm app"
   (`lib/cad/standards/neufert.ts` tồn tại). Cùng họ rủi ro Pantone/GPL.
6. **GPL libredwg ↔ định vị bán global** — chốt tạm "nội bộ trước" ổn cho R1, nhưng là bom hẹn
   giờ của định vị; lộ trình thay đã nghiên cứu ở RESEARCH-DWG-LICENSE.
7. **"5 loại hồ sơ" trong spec/mock cũ ↔ 6 loại đã chốt** (thêm HTML) — drift tên, sửa khi chạm.
8. **Ánh sáng trạng thái ↔ lệnh 11/08 bỏ trang trí** — giải bằng luật "ánh sáng CHỈ mang nghĩa"
   (đã ghi 00-CHOT); thiếu luật này là aura quay lại bằng cửa sau.
9. **IF-FEATURE-TREE cột Code là ảnh chụp 28/07** — nhiều mục ⬜ nay đã ✅; "nguồn sự thật duy
   nhất" đang lỗi thời nhẹ. Cần một lượt tái-audit trước R1 (không cần mỗi tuần).
10. **Mock tool-first ↔ engine gizmo-first ở 3D** — mock vẽ kiểu bấm-tool-rồi-làm (AutoCAD),
    engine chạy gizmo-trực-tiếp (SketchUp). 11/08 đã xử phần dock; cần CHỐT mô hình thao tác
    chính thức: gizmo-first, lệnh rời chỉ thêm khi máy trạng thái công cụ ra đời (M1).

## §3 · KHUYẾN NGHỊ — thứ tự đòn bẩy (giải đúng "all-in-one, cắt thao tác, đồng bộ năng lực nhân viên")

1. **TaskContext Link** — 3 field additive vào `Task` + deep-link 2 chiều. Rẻ, khâu Bảng việc
   vào mọi workspace; sếp giao việc là giao kèm ngữ cảnh ⇒ nhân viên yếu không phải tự mò —
   đúng bài "rút ngắn phạm vi năng lực không đồng bộ".
2. **Đổi ruột Library + FM sang dữ liệu thật** — flip nguồn, không xây UI. Mở đường LibraryFirst.
3. **BuildRecipe stack** — làm trong M1 khi máy trạng thái công cụ ra đời; nền của .idfc.
4. **ThinkDial** — 1 dropdown, 4 tổ hợp engine sẵn; tiết kiệm usage cho cả team.
5. **LightArc** — component nhỏ, áp ngay upload/render-queue/xuất file; ánh sáng có nghĩa đầu tiên.
6. **Hai câu Hoà quyết, 0 phiên code**: ChatMessage thêm projectId? · Neufert gỡ hay mua quyền?

> Nguyên tắc chung rút từ toàn bộ kiểm: lợi thế IF không nằm ở từng tool — nằm ở chỗ MỌI tool
> đọc/ghi một nguồn và NUÔI nhau. Vậy tiêu chí nghiệm thu mọi tính năng mới = Hợp đồng 4 câu;
> hàng nào cột NUÔI trống thì hoặc nối dây, hoặc cắt.
