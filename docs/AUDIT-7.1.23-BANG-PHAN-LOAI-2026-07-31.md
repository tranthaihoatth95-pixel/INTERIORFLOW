# 7.1.23 — BẢNG PHÂN LOẠI (BƯỚC 1, chưa sửa gì)

> Quét toàn bộ `components/` + `app/` theo đúng 5 mục `docs/LUAT-CHU-VIET-7.1.23-2026-07-31.md`.
> **CHƯA SỬA DÒNG NÀO** — tài liệu này chỉ để Hoà soát và gật trước khi vào Bước 2.
> 3 agent quét song song (đọc từng chỗ, không suy đoán từ tên biến) — tôi đã lướt lại kết quả,
> không đọc lại từng dòng 1-1 (khối lượng quá lớn để tự tay đối chiếu hết trong thời gian hợp lý —
> nói rõ điều này thay vì giả vờ đã tự kiểm từng dòng).

## Tóm tắt số

| Mục | Tổng chỗ quét | VI PHẠM (cần sửa) | Miễn trừ hợp lệ | Dynamic/không chắc |
|---|---|---|---|---|
| ① `uppercase` | 108 | ~65 | ~25 | 3 (+ 3 false-positive: 2 comment, 1 giá trị `<option>`) |
| ② `line-height` | 33 | ~29 | 4 (wordmark Latin) | — |
| ③ `letter-spacing` âm | 17 | ~14 | 3 (wordmark Latin) | — |
| ④ font-mono | 3 file | **0** | 3 (toạ độ mm/độ, lệnh CAD ASCII) | — |
| ⑤a `leading-none` trong badge | 2 | 2 | — | — |
| ⑤b `line-clamp`+leading chặt | 2 | 2 | — | — |
| ⑤c cỡ chữ <12px trên chữ có dấu | ~150 chỗ quét | **~100+** | ~50 (tiếng Anh/số/mã) | — |
| ⑤d hộp `h-cố định`+`overflow-hidden` cắt dấu | 48 (33 file) | **0** | 48 | — |

**Phát hiện quan trọng nhất**: mục ⑤c (cỡ chữ) là vấn đề **có hệ thống**, không phải rải rác — hơn
100 chỗ dùng `text-[9px]`/`text-[10px]`/`text-[11px]` làm cỡ chữ MẶC ĐỊNH cho nhãn phụ/hint/badge
trên khắp app (login flow, NodeLibraryPanel, Dashboard, LarkPanels, node canvas...). Đây gần như
chắc chắn là **1 token thiết kế sai** ("cỡ chữ phụ" = 10-11px) được dùng lặp lại, không phải 100
quyết định riêng lẻ. **Đề xuất sửa TẬN GỐC bằng cách nâng token, không sửa tay từng dòng** — xem
mục "Đề xuất cách sửa" cuối file.

Mục ④ (font-mono) và ⑤d (hộp cắt dấu) — **0 vi phạm thật**. `2.2.85` đã dọn sạch trước đó; 2 chỗ
`ui-monospace` còn lại chỉ vẽ toạ độ mm/góc độ và lệnh CAD ASCII (`L`/`REC`/`PL`...) — đúng phạm vi
được luật cho phép, không đụng.

---

## ① `uppercase` trên chuỗi CÓ DẤU — CẤM

| Tệp:dòng | Chuỗi/label | Phán quyết | Đề xuất |
|---|---|---|---|
| app/library/ingest/page.tsx:180 | "AI · Chiến lược content" | CÓ DẤU | Sửa: bỏ uppercase |
| app/library/ingest/page.tsx:197 | RANK_META: "Tốt nhất"/"Phân vân"/"Để loại" | CÓ DẤU | Sửa |
| app/library/ingest/page.tsx:217 | "Hình minh hoạ · thác nguồn" | CÓ DẤU | Sửa |
| app/library/ingest/page.tsx:240 | "Reference"/"Unsplash · <license>"/"Openverse · CC" | KỸ THUẬT | Miễn trừ |
| app/projects/[id]/notebook/page.tsx:81 | "InteriorFlow / Dự án · Project #{id} /" | CÓ DẤU | Sửa |
| app/projects/[id]/notebook/page.tsx:100 | "Mock mode" | KỸ THUẬT | Miễn trừ |
| app/projects/[id]/overview/page.tsx:131 | t('Dự án','Project') | CÓ DẤU | Sửa |
| app/projects/[id]/overview/page.tsx:189 | t('Tổng quan · Overview',...) | CÓ DẤU | Sửa |
| app/projects/[id]/overview/page.tsx:265 | t('Số flow','Flows')/t('Thành viên',...)/t('Chặng',...) | CÓ DẤU | Sửa |
| app/projects/[id]/overview/page.tsx:273 | t('Bản vẽ · Flows trong dự án',...) | CÓ DẤU | Sửa |
| app/settings/avatar/page.tsx:61 | "Cài đặt · Settings" | CÓ DẤU | Sửa |
| components/ChatPanel.tsx:80 | "Chat team" | KỸ THUẬT | Miễn trừ |
| components/CommandPalette.tsx:211 | {group} — 'Hành động' + CATEGORY_META | CÓ DẤU | Sửa |
| components/Dashboard.tsx:83 | {label} — "Dự án"/"Flow"/"Thành viên"/"Credit dùng 30 ngày" | CÓ DẤU | Sửa |
| components/FlowsPanel.tsx:64 | "Projects & Flows" | KỸ THUẬT | Miễn trừ |
| components/GalleryPanel.tsx:37 | "Gallery (local)" | KỸ THUẬT | Miễn trừ |
| components/IntroSequence.tsx:155 | "Sign in →"/"Đăng nhập →" | CÓ DẤU | Sửa |
| components/IntroSequence.tsx:205 | kicker vi: "Giấy nháp"/"Sống dậy"/"Trình khách"/"Vào xưởng" | CÓ DẤU | Sửa |
| components/IntroSequence.tsx:235 | "Next →"/"Tiếp →" | CÓ DẤU | Sửa |
| components/IntroSequence.tsx:362 | "Concept · Bedroom" | KỸ THUẬT | Miễn trừ |
| components/IntroSequence.tsx:378 | "16:9 · PDF" | KỸ THUẬT | Miễn trừ |
| components/IntroSequence.tsx:389 | STAGE_LABEL: "Draft · pencil"/"AI · coloring"/... | KỸ THUẬT | Miễn trừ |
| components/LangToggle.tsx:50 | 'vi'/'en' | KỸ THUẬT | Miễn trừ |
| components/LibraryPanel.tsx:101 | "Reference (team)" | KỸ THUẬT | Miễn trừ |
| components/LoginScreen.tsx:124 | "InteriorFlow" | KỸ THUẬT | Miễn trừ (thương hiệu) |
| components/LoginScreen.tsx:165 | tagline: "Gieo ý tưởng"/"Dựng nên hình"/"Trình cho khách" | CÓ DẤU | Sửa |
| components/MobileMenu.tsx:125 | {label} — "Chặng làm việc"/"Mức phụ thuộc AI"/"Công cụ"/"Việc N" | CÓ DẤU | Sửa |
| components/NodeLibraryPanel.tsx:134 | "Node Library" | KỸ THUẬT | Miễn trừ |
| components/NodeLibraryPanel.tsx:218 | "Chặng {phase.label}" | CÓ DẤU | Sửa |
| components/NodeLibraryPanel.tsx:232 | TAG_META: "Đầu vào"/"Sinh ảnh AI"/"Chỉnh sửa"/"Vật liệu"/"Bố cục / Trình bày"/"Tiện ích"/"Video" | CÓ DẤU | Sửa |
| components/ProjectSelect.tsx:930 | timeAgo(): "vừa xong"/"N phút trước"/... | CÓ DẤU | Sửa |
| components/ProjectSelect.tsx:1586 | "Chào .../Hi ..." | CÓ DẤU | Sửa |
| components/ProjectSelect.tsx:1659 | "Vitals AI" | KỸ THUẬT | Miễn trừ |
| components/ProjectSelect.tsx:1750 | "Vitals · hội thoại" | CÓ DẤU | Sửa |
| components/ProjectSelect.tsx:1909 | "Mặc định"/"Defaults" | CÓ DẤU | Sửa |
| components/ProjectSelect.tsx:1927 | "Từ thư viện"/"From library" | CÓ DẤU | Sửa |
| components/ShapePalette.tsx:82 | {g} — "Phòng khách"/"Phòng ăn"/"Phòng ngủ"/"Làm việc"/"Vệ sinh" | CÓ DẤU | Sửa |
| components/ShapePalette.tsx:167 | "Biến thể" | CÓ DẤU | Sửa |
| components/StageSelect.tsx:131 | "Chào .../Hi ..." | CÓ DẤU | Sửa |
| components/StageSelect.tsx:172 | tagline[lang]: "Gieo ý tưởng"/... | CÓ DẤU | Sửa |
| components/TasksDropdown.tsx:81 | GroupLabel — "Đang chạy"/"Đang chờ"/"Đã xong" | CÓ DẤU | Sửa |
| components/avatar/AvatarBuilder.tsx:270 | labelStyle — "Tàn nhang · Freckles","Tông da · Skin",... | CÓ DẤU | Sửa |
| components/cad-library/BlockLibraryDemo.tsx:243 | categoryLabel — "Phòng khách"/"Bếp"/"Vệ sinh"/"Cầu thang" | CÓ DẤU | Sửa |
| components/cad/CadEditor.tsx:730 | categoryLabel (cùng trên) | CÓ DẤU | Sửa |
| components/cad/CadEditor.tsx:1265 | reportLabel — "Studio · Đơn vị lập"/"Dự án · Project"/"Ngày · Date"/"Người lập" | CÓ DẤU | Sửa |
| components/cad/CadEditor.tsx:1393 | sectionTitle — "D1.1 — Chiếu sáng theo phòng"/... | CÓ DẤU | Sửa |
| components/cad/MaterialPalette.tsx:146 | "Pattern kỹ thuật (chỉnh tay)" | CÓ DẤU | Sửa |
| components/cad/ZonePanel.tsx:11 | chỉ là comment, không áp CSS | — | Bỏ qua (false-positive) |
| components/cad/ZonePanel.tsx:32 | headStyle dùng chung — "Zone · Diagram" (không dấu) + "Nhóm chức năng · Legend" (có dấu) | CÓ DẤU | Sửa (style dùng chung, 1 nhánh có dấu là đủ vi phạm) |
| components/cad/ZonePanel.tsx:302 | ZONE_GROUP_META: "Khu ướt"/"Khu sinh hoạt chung"/"Khu riêng tư"/"Khu làm việc"/"Ban công / loggia"/"Phụ trợ / kỹ thuật" | CÓ DẤU | Sửa |
| components/cad/ZonePanel.tsx:324 | "Giao thông" | CÓ DẤU | Sửa |
| components/dashboard/LarkPanels.tsx:118 | {label} — "Dự án"/"Chủ trì"/"Trạng thái"/"Deadline"/"Cảnh báo" | CÓ DẤU | Sửa |
| components/dashboard/LarkPanels.tsx:141 | "Công việc" | CÓ DẤU | Sửa |
| components/dashboard/LarkPanels.tsx:146 | "% tiến độ" | CÓ DẤU | Sửa |
| components/entry/LoginBackdrop.tsx:672 | "Nền đăng nhập"/"Backdrop" | CÓ DẤU | Sửa |
| components/entry/LoginBackdrop.tsx:723 | "Sinh bằng code"/"Generated · code" | CÓ DẤU | Sửa |
| components/entry/LoginBackdrop.tsx:800 | "Thư viện ảnh"/"Image library" | CÓ DẤU | Sửa |
| components/entry/LoginBackdrop.tsx:931 | "Ảnh trong bộ · N/N" | CÓ DẤU | Sửa |
| components/entry/LoginForm.tsx:175 | tab — "Đăng nhập"/"Đăng ký" | CÓ DẤU | Sửa |
| components/entry/LoginForm.tsx:348 | "hoặc tiếp tục với" | CÓ DẤU | Sửa |
| components/entry/LoginScreen.tsx:120 | "InteriorFlow" | KỸ THUẬT | Miễn trừ |
| components/entry/cardFaces.tsx:39 | CoverPhoto label — "Present · Deck"/"Concept · Material"/"Render · 3D" | KỸ THUẬT | Miễn trừ |
| components/entry/cardFaces.tsx:57 | "Concept · Bedroom" | KỸ THUẬT | Miễn trừ |
| components/entry/cardFaces.tsx:130 | "Material board" | KỸ THUẬT | Miễn trừ |
| components/intro/IntroSequence.tsx:106 | "Skip →" | KỸ THUẬT | Miễn trừ |
| components/intro/IntroSequence.tsx:215 | "Một dòng chảy · One flow" | CÓ DẤU | Sửa |
| components/intro/IntroSequence.tsx:237 | "Ba màn — Một mạch · Three stages, one flow" | CÓ DẤU | Sửa |
| components/intro/IntroSequence.tsx:253 | 'Drafting'/'Rendering'/'Presenting' | KỸ THUẬT | Miễn trừ |
| components/intro/IntroSequence.tsx:348 | "Bắt đầu · Get started" | CÓ DẤU | Sửa |
| components/intro/TitleSequence.tsx:255 | "Bỏ qua"/"Skip" | CÓ DẤU | Sửa |
| components/intro/TitleSequence.tsx:322 | "Phối cảnh · AI"/"Render · AI" | CÓ DẤU | Sửa |
| components/nodes/GroupOverlay.tsx:51,108 | {group.label} — tên nhóm node do NGƯỜI DÙNG đặt | DYNAMIC | Sửa (an toàn) — dữ liệu tự do, nhiều khả năng có dấu |
| components/nodes/InteriorNode.tsx:43,67,88 | {param.label} — nhãn tham số node, đa số có dấu ("Phong cách","Loại phòng","Diện tích (m²)","Hướng sáng","Trần cao (m)"...) | CÓ DẤU | Sửa |
| components/notebook/NotebookChatPanel.tsx:168 | "Sổ tay dự án · RAG trên nguồn" | CÓ DẤU | Sửa |
| components/notebook/NotebookChatPanel.tsx:227 | "Bạn · You"/"Vitals" | CÓ DẤU | Sửa |
| components/notebook/NotebookChatPanel.tsx:257 | "General mode · không có nguồn" | CÓ DẤU | Sửa |
| components/notebook/NotebookChatPanel.tsx:347 | "Gửi" | CÓ DẤU | Sửa |
| components/notebook/NotebookSourceViewer.tsx:69 | "Xem nguồn · Source" | CÓ DẤU | Sửa |
| components/notebook/NotebookSourcesSidebar.tsx:58 | **StatusBadge — "Đang xử lý"/"Sẵn sàng"/"Lỗi" (chỗ Hoà đã chỉ đích danh từ đầu)** | CÓ DẤU | Sửa |
| components/notebook/NotebookSourcesSidebar.tsx:115 | "Nguồn · Sources" | CÓ DẤU | Sửa |
| components/notebook/NotebookSourcesSidebar.tsx:251 | FILTERS.vi — "Tất cả"/"PDF"/"Ảnh"/"Văn bản"/"Liên kết"/"Cuộc họp" | CÓ DẤU | Sửa |
| components/notebook/NotebookSourcesSidebar.tsx:386 | pillBtn dùng chung — "URL"/"Text" + "Huỷ"/"Thêm nguồn" | CÓ DẤU | Sửa |
| components/photo-editor/AdjustPanel.tsx:102 | Divider — "Cân bằng trắng"/"Levels"/"HSL"/"Curves" | CÓ DẤU | Sửa |
| components/present-editor/ImageEditor.tsx:489 | Section — "Bộ lọc"/"Tinh chỉnh"/"Bo góc"/"Cắt ảnh"/"Thay ảnh" | CÓ DẤU | Sửa |
| components/present-editor/Inspector.tsx:161 | "Lớp (N)" | CÓ DẤU | Sửa |
| components/present-editor/Inspector.tsx:645 | chỉ là comment | — | Bỏ qua (false-positive) |
| components/present-editor/Inspector.tsx:714 | "Thu gọn"/"Tinh chỉnh · Fine-tune" | CÓ DẤU | Sửa |
| components/present-editor/Inspector.tsx:734 | `<option value="uppercase">CHỮ HOA</option>` | — | Bỏ qua (đây là TÍNH NĂNG cho người dùng chọn kiểu chữ CHO NỘI DUNG SLIDE của họ, không phải CSS app tự áp — ngoài phạm vi luật này) |
| components/present-editor/Inspector.tsx:836 | "Bóng đổ" | CÓ DẤU | Sửa |
| components/present-editor/Inspector.tsx:1401 | Panel — "Căn & phân bố"/"Nền slide"/"Sắp xếp"/"Chữ"/"Hiệu ứng chữ"/"Ảnh"/"Hình" | CÓ DẤU | Sửa |
| components/present-editor/LayoutShelf.tsx:664 | "Của tôi"/"Từ thư viện Reference"/SHELF_LABEL | CÓ DẤU | Sửa |
| components/present-editor/LibraryBrowser.tsx:312 | {name} — tên nhóm/tag người dùng đặt | DYNAMIC | Sửa (an toàn) |
| components/present-editor/MotionPanel.tsx:264 | Head — "Chuyển vào slide này"/"Phần tử xuất hiện (build-in)"/... | CÓ DẤU | Sửa |
| components/present-editor/PresentSheets.tsx:49 | "Đang mở dàn trang…" | CÓ DẤU | Sửa |
| components/present-editor/ShapeQuickPanel.tsx:31 | "Chỉnh shape" | CÓ DẤU | Sửa |
| components/present-editor/SpecForm.tsx:196 | Label — "Tuỳ chọn nhanh"/"Tone màu chủ đạo"/"Nền" | CÓ DẤU | Sửa |
| components/present-editor/TemplatePicker.tsx:202 | Header — "Gợi ý cho slide này"/"Của tôi"/"Từ thư viện Reference"/category | CÓ DẤU | Sửa |
| components/settings/AiDependencySettings.tsx:97 | "oneAI — Engine" | KỸ THUẬT | Miễn trừ |
| components/settings/AiDependencySettings.tsx:124 | "Runtime" | KỸ THUẬT | Miễn trừ |
| components/studio/RenderIOMenus.tsx:182 | "Nhập"/"Import" | CÓ DẤU | Sửa |
| components/studio/RenderIOMenus.tsx:189 | "Xuất"/"Export" | CÓ DẤU | Sửa |
| components/studio/StageSwitcher.tsx:293 | "Soon" | KỸ THUẬT | Miễn trừ |
| components/studio/StageSwitcher.tsx:408 | "01"/"02"/"03" | KỸ THUẬT | Miễn trừ |
| components/studio/StageTransition.tsx:127 | "Đang mở {label}" | CÓ DẤU | Sửa |
| components/studio/VitalsGesture.tsx:244 | "Vitals · " + STAGE_LABEL (tiếng Anh) | KỸ THUẬT | Miễn trừ |

## ② `line-height < 1.5` — CẤM trên chữ có dấu

| Tệp:dòng | Chuỗi/label | Phán quyết | Đề xuất |
|---|---|---|---|
| components/DemoLauncher.tsx:25 | "Chặng này chưa có demo dựng sẵn — kéo node từ Node Library để bắt đầu." | CÓ DẤU | leading-snug→normal |
| components/DemoLauncher.tsx:49 | {demo.glyph} — icon 1 ký tự | KỸ THUẬT | Miễn trừ |
| components/DemoLauncher.tsx:52 | {demo.desc} — vd "Brief sảnh khách sạn 5★ → 4 concept..." | CÓ DẤU | Sửa |
| components/IntroSequence.tsx:366 | "SERENE" | LATIN | Miễn trừ |
| components/ProjectSelect.tsx:849 | {f.name} — tên flow/dự án người dùng đặt | DYNAMIC | Sửa (an toàn) |
| components/ProjectSelect.tsx:1593 | "Chọn dự án để bắt đầu" | CÓ DẤU | Sửa |
| components/NodeLibraryPanel.tsx:295 | {def.description} — mô tả node có dấu | CÓ DẤU | Sửa |
| components/StageSelect.tsx:137 | "Bắt đầu ở chặng nào?" | CÓ DẤU | Sửa |
| components/StageSelect.tsx:180 | {m.title} — "Concept"/"Render"/"Present" | LATIN | Miễn trừ |
| components/cad-library/BlockLibraryDemo.tsx:258 | {b.name} — "Sofa góc chữ L","Ghế bành" | CÓ DẤU | Sửa (kèm ⑤b, xem dưới) |
| components/LoginScreen.tsx:130 | "Bắt đầu ở chặng nào?" | CÓ DẤU | Sửa |
| components/LoginScreen.tsx:177 | {m.title} | LATIN | Miễn trừ |
| components/settings/AiDependencySettings.tsx:88 | {m.blurb} — "Chất lượng tối đa (fal FLUX pro, cloud)..." | CÓ DẤU | Sửa |
| components/intro/TitleSequence.tsx:316 | {w.title[lang]} — "Sảnh khách sạn 5★" | CÓ DẤU | Sửa |
| components/intro/TitleSequence.tsx:349 | "Thiết kế · Render · Trình bày" | CÓ DẤU | Sửa |
| components/form/ConceptForm.tsx:223 | {v.hint} — "Đăng đối: vòng ở tâm..." | CÓ DẤU | Sửa |
| components/nodes/NoteNode.tsx:27 | textarea ghi chú tự do | DYNAMIC | Sửa (an toàn) |
| components/nodes/InteriorNode.tsx:320 | {error} — "Provider không trả về media..." | CÓ DẤU | Sửa |
| components/entry/LoginBackdrop.tsx:754 | {d.vi} — "Cực quang ấm" v.v. | CÓ DẤU | Sửa (kèm ⑤a) |
| components/entry/LoginBackdrop.tsx:761 | "Rất chậm, nhẹ GPU. Tôn trọng reduced-motion." | CÓ DẤU | Sửa |
| components/entry/LoginBackdrop.tsx:793 | {p.vi} — "Đêm ấm" v.v. | CÓ DẤU | Sửa (kèm ⑤a) |
| components/entry/cardFaces.tsx:61,81,155 | "SERENE"/"Materials"/"Japandi" | LATIN | Miễn trừ |
| components/entry/cardFaces.tsx:100 | dấu ngoặc kép trang trí | KỸ THUẬT | Miễn trừ |
| components/nodes/NodeExtras.tsx:116,272,347,381,399 | "Nối 2 ảnh A/B..."/tier label/thông báo FBX/AI output | CÓ DẤU/DYNAMIC | Sửa |
| components/nodes/NodeExtras.tsx:419 | mã màu hex | KỸ THUẬT | Miễn trừ |
| components/entry/WelcomeIntro.tsx:118 | "InteriorFlow — từ bản vẽ tới hồ sơ trình khách." | CÓ DẤU | Sửa |
| components/onboarding/StageIntroCard.tsx:146 | "Gõ L vẽ tường · F8 khoá ngang dọc" | CÓ DẤU | Sửa |

## ③ `letter-spacing` âm — CẤM trên chữ có dấu

| Tệp:dòng | Chuỗi/label | Phán quyết | Đề xuất |
|---|---|---|---|
| components/Dashboard.tsx:85 | {value} — số liệu | KỸ THUẬT | Miễn trừ |
| components/Dashboard.tsx:210 | "Tổng quan" | CÓ DẤU | tracking-tight→normal |
| components/studio/AppChrome.tsx:136 | "InteriorFlow" | LATIN | Miễn trừ |
| app/settings/page.tsx:34 | "Cài đặt"/"Settings" | CÓ DẤU | Sửa |
| components/IntroSequence.tsx:215 | "Bắt đầu bằng một nét phác." | CÓ DẤU | Bỏ letterSpacing âm |
| components/IntroSequence.tsx:367 | "SERENE" | LATIN | Miễn trừ |
| components/ProjectSelect.tsx:1594 | "Chọn dự án để bắt đầu" | CÓ DẤU | Sửa |
| components/StageSelect.tsx:138 | "Bắt đầu ở chặng nào?" | CÓ DẤU | Sửa |
| components/StageSelect.tsx:181 | {m.title} | LATIN | Miễn trừ |
| components/LoginScreen.tsx:119 | "IF" (logo) | LATIN | Miễn trừ |
| components/LoginScreen.tsx:131 | "Bắt đầu ở chặng nào?" | CÓ DẤU | Sửa |
| components/LoginScreen.tsx:178 | {m.title} | LATIN | Miễn trừ |
| components/intro/IntroSequence.tsx:168 | "Mười file. Năm tool. Ba lần sếp hỏi 'chưa xong à?'" | CÓ DẤU | Sửa (⚠️ dòng này còn `lineHeight:1.4` inline — cũng vi phạm ②, ngoài phạm vi grep ban đầu, đã bắt được nhờ đọc cả dòng) |
| components/entry/cardFaces.tsx:61,81,155 | "SERENE"/"Materials"/"Japandi" | LATIN | Miễn trừ |
| app/settings/avatar/page.tsx:74 | "Avatar của bạn · Your avatar" | CÓ DẤU | Sửa |

## ④ Font không phủ tiếng Việt — 0 vi phạm

Font sản phẩm xác nhận: **Be Vietnam Pro** (`app/layout.tsx`, `next/font/google`, subset
`['latin','vietnamese']`, biến `--font-sans`, áp `font-sans` lên `<body>`).

| Tệp:dòng | Nội dung | Phán quyết |
|---|---|---|
| components/nodes/InteriorNode.tsx:264-266 | chỉ là comment nhắc lại việc đã sửa `2.2.85` | Không áp dụng |
| components/cad/CadCanvas.tsx:2306 | HUD "Dynamic Input" — `${dynBuf} mm`, góc độ | KỸ THUẬT — giữ nguyên |
| components/cad/CadEditor.tsx:1895 | `{s.cmd}` — mã lệnh CAD (`L`/`REC`/`PL`...) | KỸ THUẬT — giữ nguyên |
| components/cad/CadEditor.tsx:1908 | ô nhập lệnh CAD | KỸ THUẬT — giữ nguyên |

## ⑤a `leading-none` trong badge/chip

| Tệp:dòng | Chuỗi | Đề xuất |
|---|---|---|
| components/entry/LoginBackdrop.tsx:754 | "Cực quang ấm"/"Lưới thở"/"Bình độ"/"Bụi sáng"/"Lụa chuyển sắc" (`text-[9.5px] leading-none`) | Bỏ leading-none, nâng cỡ chữ ≥12px |
| components/entry/LoginBackdrop.tsx:793 | "Đêm ấm"/"Mực đêm"/"Đá ấm"/"Lụa sáng" (`text-[9.5px] leading-none`) | Như trên |

## ⑤b `line-clamp` + leading chặt

| Tệp:dòng | Chuỗi | Đề xuất |
|---|---|---|
| components/cad-library/BlockLibraryDemo.tsx:258 | {b.name} — tên block nội thất, `line-clamp-2 leading-tight text-[11px]` | Bỏ tổ hợp, nâng ≥12px, leading-snug+ |
| components/NodeLibraryPanel.tsx:295 | {def.description}, `line-clamp-2 leading-snug text-[10px]` | Nâng ≥12px |

## ⑤c cỡ chữ <12px trên chữ CÓ DẤU — vấn đề CÓ HỆ THỐNG

**~100+ chỗ** dùng `text-[8px]`…`text-[11px]` cho nhãn/nút/badge/hint tiếng Việt có dấu, trải khắp:
luồng đăng nhập (`LoginBackdrop`/`LoginScreen`/`LoginForm`/`IntroSequence`/`StageSelect`),
`NodeLibraryPanel`, `Dashboard`, `LarkPanels`, `ProjectMembersPanel`, node canvas (`NodeExtras`,
`InteriorNode`, `GroupOverlay`), `WarpCornersModal`, `SmartSelectModal`, `form/shared.tsx`,
`ChatPanel`, `FlowsPanel`, `LibraryPanel`/`GalleryPanel`, `CommandPalette`, `TasksDropdown`,
`collab/LiveCursors`, `sketch/SketchStudioModal`, `app/share/[token]/page.tsx`.

Danh sách ĐẦY ĐỦ từng dòng (file:dòng + chuỗi + phán quyết) nằm trong transcript agent quét —
**KHÔNG chép hết vào đây vì đây là 1 lớp lỗi lặp lại cùng nguyên nhân, không phải 100 quyết định
riêng** (xem "Đề xuất cách sửa" bên dưới). Nhóm nhỏ nhất tìm được: `components/entry/cardFaces.tsx:39`
ở **8px**. Miễn trừ hợp lệ (~50 chỗ): số liệu thuần, mã màu hex, phím tắt, nhãn tiếng Anh
("FBX (Blender)", "PDF", "Esc", chặng "Drafting CAD"/"Rendering"/"Presenting").

## ⑤d hộp `h-cố định` + `overflow-hidden` cắt dấu — 0 vi phạm

Rà 33 file / 48 chỗ `overflow-hidden` đi kèm chiều cao cố định — toàn bộ là avatar tròn/thumbnail
ảnh/thanh tiến trình/khung layout, không phải hộp text 1 dòng bị kẹp. Không có gì cần sửa ở mục này.

---

## Đề xuất cách sửa (chờ Hoà gật trước khi làm)

1. **① uppercase, ②③ line-height/tracking, ⑤ab (badge)**: sửa TAY từng dòng theo bảng trên —
   số lượng vừa phải (~65+29+14+4 ≈ 112 chỗ), đổi class trực tiếp, không cần trừu tượng hoá gì thêm.
2. **⑤c cỡ chữ <12px (~100+ chỗ)**: đề xuất **KHÔNG sửa tay từng dòng** — thay vào đó thêm 1 rule
   ESLint/quét (không phải runtime) hoặc đơn giản nhất: **thống nhất 1 hằng số Tailwind tối thiểu**
   cho "cỡ chữ phụ" (đổi các chỗ `text-[9px]`/`text-[10px]`/`text-[11px]`/`text-[8px]` đang dùng làm
   "size phụ mặc định" thành `text-xs` = 12px, hoặc 1 utility class riêng `text-vi-min` = 13px nếu
   Hoà muốn dư margin theo khuyến nghị "13px"). Cách này sửa đúng gốc (token), tránh format lại
   100+ dòng riêng lẻ dễ sót/dễ tạo review noise khổng lồ. Cần Hoà xác nhận hướng này trước khi tôi
   động vào — đây là quyết định SẢN PHẨM (đổi 1 token ảnh hưởng rất nhiều nơi cùng lúc), không phải
   thuần kỹ thuật.
3. **Test cưỡng chế (Bước 3)**: viết SAU khi Bước 2 xong, đúng khuôn `idf-neutrality.test.ts` —
   regex dấu tiếng Việt dùng chung (U+1EA0–U+1EF9 + Latin-1 Supplement/Extended-A/-B liên quan) +
   EXEMPTIONS tường minh kèm lý do + meta-test xác nhận exemption còn tồn tại trong mã.

**Câu hỏi cần Hoà quyết trước khi vào Bước 2**:
- Cách sửa ⑤c: đổi token cỡ chữ tối thiểu (nhanh, rủi ro layout dồn chữ ở vài chỗ chật) hay sửa
  tay từng dòng (chậm hơn nhiều, an toàn hơn từng chỗ)?
- Sàn cỡ chữ chọn 12px (đúng luật ghi) hay 13px (khuyến nghị) làm token chung?
