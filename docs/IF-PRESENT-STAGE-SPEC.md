# IF Present Stage — Feature Spec (chặng 3: Dàn trang / Present)
# Triết lý: Trình bày hồ sơ nội thất cho khách hàng — KHÔNG phải công cụ đồ hoạ tổng quát

> **Present KHÔNG PHẢI Canva/Figma/Photoshop thu nhỏ.**
> Việc của Present = lấy dữ liệu mặt bằng CAD (chặng 1) + ảnh render (chặng 2)
> → dựng **slide/board trình khách**: ảnh, mặt bằng, chú thích vật liệu, chữ →
> xuất PDF/PPTX/PNG, gói trong ≤5 sheet. Human-in-the-loop: AI cho ĐIỂM XUẤT PHÁT,
> designer sửa tự do.
>
> **Benchmark tham chiếu**: Gamma (auto-layout) · Canva (Brand Kit/template) ·
> Figma (component/style/review) · Photoshop (layer/mask không phá huỷ) —
> nhưng CHỈ lấy phần chuyển giao được cho việc dựng deck nội thất.
>
> Trạng thái: ✅ Đã có (đã đọc mã) | 🔜 Có phần, chưa đủ | 🆕 Chưa làm (gap thật) | ⚠️ Cần xác minh | ⛔ Không làm (chủ đích)

> **⟳ ĐỐI SOÁT 2026-07-17** — Mọi ✅ dưới đây đã đối chiếu MÃ NGUỒN thật
> (repo `interiorflow`, nhánh `feat/present-layout-ml-p1`, `4a73a5b`):
> `lib/present-editor/*`, `components/present-editor/*`, `lib/photo-editor/*`,
> `components/photo-editor/*`, `lib/gu*`. KHÔNG mark ✅ chỉ dựa CHANGELOG.

---

## KẾT LUẬN NGẮN (đọc trước)

Present **đã là một trình dàn trang thật, không phải khung sườn**. Đã có: model
slide đầy đủ, canvas kéo–thả–resize–xoay + guide căn, 25 template (nhiều template
**đặc thù nội thất**: mặt bằng, bảng vật liệu, moodboard, so sánh before/after),
bộ chuẩn định lượng `DECK_STANDARDS` (đã rút từ Gamma/Canva/Figma), guardrail
trống/chật/tràn, gợi ý bố cục + perceptron học, xuất PDF/PPTX(chữ sửa được)/PNG,
handoff Render→Present, và **một trình chỉnh ảnh raster riêng `/photo-editor`**
đủ layer/mask/blend/curve/clone-heal (gần trọn phần Photoshop cần cho việc ghép ảnh render).

Vì vậy phần lớn "tính năng Photoshop/Canva/Figma" mà brief lo là thiếu thì **đã có**.
Gap thật còn lại **ít nhưng có giá trị**, gom vào 5 nhóm (xem cuối + sprint plan):
Brand Kit bền vững · lưu template tự tạo · liên kết tài sản (logo/watermark/ảnh
render dùng lại nhiều slide, sửa 1 nơi) · đa khổ (A3/A4 board ngoài 16:9) ·
review-với-khách (share deck + ghi chú + version).

---

## P-A — LÕI EDITOR (Model & Canvas)

| # | Tính năng | Trạng thái | Bằng chứng mã |
|---|---|---|---|
| A.1 | Model slide phẳng, toạ độ %0..100, serialize JSON | ✅ | `model.ts` (Frame/EditorSlide/EditorDeck) |
| A.2 | Element: ảnh / chữ / shape | ✅ | `model.ts` ElementKind |
| A.3 | Chữ: cỡ, màu, căn, đậm/nghiêng/gạch chân, tracking, line-height, bullet/số, font riêng, vai trò (title/kicker/body) | ✅ | `model.ts` TextElement |
| A.4 | Shape: rect/ellipse/line/tam giác/đa giác(n cạnh)/mũi tên + fill/stroke/bo góc + gradient mờ | ✅ | `model.ts` ShapeElement, `shape-geometry.ts` |
| A.5 | Ảnh: crop, adjust (sáng/tương phản/bão hoà/nhiệt), bo góc | ✅ | `model.ts` ImageElement, `ImageEditor.tsx` |
| A.6 | Kéo / resize (giữ tỉ lệ ảnh) / xoay bằng handle | ✅ | `Element.tsx` |
| A.7 | **Guide căn thông minh khi kéo** (smart guides) | ✅ | `EditorCanvas.tsx` guides + `Element.tsx` Guides |
| A.8 | Căn nhanh (trái/giữa/phải/trên/giữa/dưới theo sân khấu) | ✅ | `PresentEditor.tsx` `onAlign` |
| A.9 | Chọn nhiều + move nhóm | ✅ | `PresentEditor.tsx` groupStartRef |
| A.10 | Khoá / ẩn-hiện / đổi tên / z-order (panel Lớp) | ✅ | `LayerPanel.tsx`, `model.ts` locked/hidden/name |
| A.11 | Nhân bản (Ctrl+D) + copy/paste | ✅ | `model.ts` duplicateElement |
| A.12 | Undo/Redo | ✅ | `Toolbar.tsx`, `useEditor.ts` |
| A.13 | Zoom (nút, Ctrl+lăn, Ctrl+0 fit) | ✅ | `PresentEditor.tsx`, `EditorCanvas.tsx` |
| A.14 | Panel trái/phải resize + ẩn/hiện (gu Photoshop/Canva) | ✅ | `PresentEditor.tsx` LS_INSPECTOR_* |
| A.15 | TextToolbar nổi, clamp theo viewport | ✅ | `TextToolbar.tsx` |
| A.16 | Inspector thuộc tính element | ✅ | `Inspector.tsx` |

---

## P-B — TEMPLATE & THƯ VIỆN BỐ CỤC

25 template dựng sẵn (`templates.ts`), gom theo **category** (Bìa & Mở đầu · Nội dung
· Moodboard & Vật liệu · Kỹ thuật · Trưng bày) và **kệ 4 hàng cuộn ngang** (Bìa / Bìa phụ
/ Nội dung / Trang kết).

| # | Nhóm template | Id | Trạng thái |
|---|---|---|---|
| B.1 | Bìa / mở đầu | cover · dark-cover · full-bleed · section-divider · agenda | ✅ |
| B.2 | Nội dung | content-image · two-column · grid · quote · big-stat · triptych | ✅ |
| B.3 | **Nội thất — moodboard/vật liệu** | moodboard-board · material-palette · material-flatlay · collage-watermark | ✅ |
| B.4 | **Nội thất — kỹ thuật/trưng bày** | plan-sheet (mặt bằng) · catalog-index · compare (before/after) | ✅ |
| B.5 | Kết | closing · closing-thanks | ✅ |
| B.6 | LayoutShelf: preview thật (renderEditorSlide) + gợi ý ghim đầu hàng + feedback Nhận/Bỏ | ✅ | `LayoutShelf.tsx` |
| B.7 | Template từ Reference (ảnh thư viện tag 'layout'/'slide' → template) | ✅ | `templates.ts` templatesFromLibrary |
| B.8 | **Lưu slide đang dàn thành template tái dùng** (custom template) | 🆕 | không có `saveTemplate`/persist |
| B.9 | Đồng bộ thư viện template theo team (TTT) | 🆕 | phụ thuộc B.8 |

> Điểm mạnh cần ghi nhận: bộ template **đã phủ đúng nhu cầu hồ sơ nội thất** (mặt bằng,
> bảng vật liệu, moodboard, so sánh phương án). Đây là phần "component/template có sẵn theo
> use-case" mà Canva/Figma làm — Present **đã có ở dạng builtin**, chỉ thiếu khả năng
> người dùng **tự lưu** template riêng (B.8).

---

## P-C — TRÍ THÔNG MINH BỐ CỤC (Layout Intelligence)

| # | Tính năng | Trạng thái | Bằng chứng |
|---|---|---|---|
| C.1 | **`DECK_STANDARDS`** — chuẩn định lượng: lưới 12 cột, margin/gutter, bậc spacing 8px, whitespace mục tiêu, budget/archetype | ✅ | `standards.ts` (đã rút từ Gamma/Canva/Figma — **KHÔNG đề xuất lại**) |
| C.2 | Guardrail: cảnh báo slide TRỐNG/CHẬT/TRÀN + toast | ✅ | `layout-check.ts` |
| C.3 | Gợi ý template theo #ảnh + độ dài chữ + gu + hình học lưới | ✅ | `suggest.ts` + `grid-geometry.ts` |
| C.4 | Ảnh reference → dò lưới (detectRegions) → dàn deck theo lưới | ✅ | `detect-regions.ts`, `region-layout.ts`, `reference-layout.ts` |
| C.5 | Dán text markdown → auto deck (cover/quote/content, tách "(tiếp)") | ✅ | `content-deck.ts` |
| C.6 | Bảng hỏi số liệu (min/max ảnh, tone, nền màu/ảnh) áp vào bố cục sinh | ✅ | `spec.ts` |
| C.7 | Flow Generate (điểm xuất phát từ nội dung/ảnh/reference) | ✅ | `GenerateFlow.tsx` |
| C.8 | Auto-shrink/reflow chữ khi tràn (không chỉ cảnh báo mà tự sửa) | 🔜 | `layout-check` phát hiện tràn, chưa tự co |
| C.9 | **AI sinh chữ cho 1 text-layer theo vai trò** (title/kicker/body/free) | ✅ | `app/api/present/text/route.ts` — `completeTextTiered` (Cloud NVIDIA→Ollama→lõi tất định), giọng quiet-luxury TV, human-in-loop |
| C.10 | **AI khởi thảo OUTLINE deck + call-out vật liệu + narrative từ CAD/Gu** | 🆕 | mở rộng C.9; outline qua `content-deck.ts` (C.5); vật liệu từ `materials.ts`. Việc = **PS-8**. ⚠️ giữ human-in-loop; KHÔNG auto-deck 1-click |

> ⚠️ **Không được "phát hiện lại"**: lưới, safe-zone, whitespace, bố cục bento, budget ô —
> `standards.ts` đã mã hoá hết. Nếu định đề xuất "thêm hệ lưới/quy tắc khoảng trắng kiểu
> Canva/Figma" thì **đã có rồi**.

---

## P-D — CHỈNH & GHÉP ẢNH (phần Photoshop)

Hai tầng: (1) `ImageEditor.tsx` — chỉnh nhanh kiểu Canva ngay trên slide; (2) route
riêng **`/photo-editor`** — chỉnh raster không phá huỷ kiểu Photoshop.

| # | Tính năng | Trạng thái | Bằng chứng |
|---|---|---|---|
| D.1 | Chỉnh nhanh: crop kéo khung, fit/fill, preset lọc, slider sáng/tương phản/bão hoà/nhiệt, bo góc, thay ảnh | ✅ | `ImageEditor.tsx` |
| D.2 | **Lớp raster + lớp adjustment (không phá huỷ)** | ✅ | `lib/photo-editor/model.ts` Layer |
| D.3 | 15 blend mode (multiply/screen/overlay/…) | ✅ | `photo-editor/model.ts` BLEND_MODES |
| D.4 | **Mask theo lớp** (grayscale, vẽ được) | ✅ | `model.ts` mask + tool `mask` |
| D.5 | Adjustment: brightness/contrast/saturation/exposure/temperature/tint/**levels**/**gamma**/hue/**curve LUT** | ✅ | `photo-editor/model.ts` AdjustParams |
| D.6 | Preset grade (relight ấm / quiet-luxury / trung tính) | ✅ | `ADJUST_PRESETS` |
| D.7 | Công cụ: move/brush/eraser/**clone**/**heal**/mask/**marquee**/**lasso** | ✅ | `photo-editor/tools.ts` |
| D.8 | Panel: DocCanvas · LayersPanel · AdjustPanel · Toolbar · chọn ảnh từ thư viện | ✅ | `components/photo-editor/*` |
| D.9 | **Round-trip: ảnh sửa ở `/photo-editor` ghi ngược về đúng element slide** | 🆕 | **PS-0 chốt: CHƯA nối** — `openAdvancedEditor` chỉ `window.open('/photo-editor')` (`PresentEditor.tsx:937–938`), không truyền `src`, không đường ghi về; `/photo-editor` mở `makeSampleDoc` trắng, output chỉ tải PNG tay. Việc = **PS-3** |
| D.10 | **Smart-object / tài sản liên kết**: sửa nguồn (logo/watermark/ảnh render) → cập nhật MỌI nơi đã đặt | 🆕 | mỗi ImageElement giữ `src` độc lập, không có liên kết nguồn. Việc = **PS-3** |
| D.11 | Kênh màu / CMYK / bleed / gallery filter / toàn bộ họ selection Photoshop | ⛔ | không cần cho deck trình khách |
| D.12 | **Usability "gần PTS": phím tắt + non-destructive rõ + tool-discovery** | 🆕 | `/photo-editor` **gần như KHÔNG phím tắt** (chỉ Space=pan + Ctrl/Cmd+lăn=zoom, `DocCanvas.tsx:380–405`); **không có ⌘/Ctrl+Z/Y**, không phím chọn tool. CAD đã có (`CadCanvas.tsx:1388–1411`) + `lib/kbd.ts`. Việc = **PS-7** (tái dùng convention CAD, CHẶN bởi PS-3) |

> Kết luận P-D: **phần Photoshop mà brief lo (layer chồng không phá huỷ, mask, ghép
> before/after, cắt đồ nội thất) về cơ bản ĐÃ CÓ** trong `/photo-editor`. Việc còn thiếu
> đáng làm chỉ là **D.9 nối liền round-trip** và **D.10 tài sản liên kết** (trùng với
> "component instance" của Figma — xử lý chung một lần).

---

## P-E — GU / ML

| # | Tính năng | Trạng thái | Bằng chứng |
|---|---|---|---|
| E.1 | GuProfile (operator, styles, palette, moods) | ✅ | `lib/gu.ts` |
| E.2 | Color-psychology (LAB + ΔE) | ✅ | `lib/gu/color-psychology.ts` |
| E.3 | Perceptron pairwise (learning-to-rank bố cục, degrade <10 cặp) | ✅ | `lib/gu/pairwise-perceptron.ts` |
| E.4 | Feedback Nhận/Bỏ tại LayoutShelf → re-rank | ✅ | `LayoutShelf.tsx` + `feature-dict.ts` |
| E.5 | Palette/fonts từ gu bơm vào template | ✅ | `suggest.ts`, `templates.ts` |

---

## P-F — XUẤT BẢN & HANDOFF

| # | Tính năng | Trạng thái | Bằng chứng |
|---|---|---|---|
| F.1 | Xuất PDF WYSIWYG 1920×1080 | ✅ | `export.ts` exportDeckToPdf |
| F.2 | Xuất PNG từng slide | ✅ | `export.ts` exportDeckToPng |
| F.3 | Xuất PPTX — **chữ vẫn sửa được** (map role→SlideContent) + fallback ảnh full-bleed | ✅ | `export.ts` exportDeckToPptxFromModel + `lib/pptx` |
| F.4 | Handoff Render→Present (sessionStorage + mem fallback, consume-once) | ✅ | `handoff.ts` |
| F.5 | Multi-sheet ≤5 + persist IndexedDB | ✅ | `PresentSheets.tsx` + sheets-persist |
| F.6 | Motion: transition (fade/slide/push/zoom/rise) + reveal + trình chiếu + "áp cả deck" | ✅ | `motion-present.ts`, `MotionPanel.tsx`, `SlidePlayer.tsx` |

---

## P-G — THƯƠNG HIỆU / FONT (Brand)

| # | Tính năng | Trạng thái | Bằng chứng |
|---|---|---|---|
| G.1 | FontPairing deck (Editorial/Modern/Elegant) | ✅ | `lib/slides.ts` |
| G.2 | Font riêng per-element (dropdown curated serif/sans quiet-luxury) | ✅ | `fonts.ts` |
| G.3 | **Tải font người dùng** (.ttf/.otf/.woff, persist localStorage) | ✅ | `custom-fonts.ts` |
| G.4 | Palette gu 6 màu cấp deck | ✅ | `model.ts` EditorDeck.palette |
| G.5 | **Brand Kit bền vững**: logo + màu + font lưu 1 lần, TỰ áp cho mọi deck mới | 🆕 | chỉ có `deck.brand` (chuỗi tên) + palette per-deck; không persist cross-deck |
| G.6 | **Áp lại theme/palette cho MỌI slide đang có** (đổi gu → nhuộm lại cả deck) | 🔜 | `onGenerated` cập nhật `deck.palette` nhưng slide cũ giữ màu đã "nướng"; chưa có re-theme toàn deck |
| G.7 | Chèn logo/watermark dùng chung nhiều slide | 🔜 | có template `collage-watermark`; chưa có logo-asset cấp deck |

---

## P-H — CỘNG TÁC / REVIEW VỚI KHÁCH

| # | Tính năng | Trạng thái | Ghi chú |
|---|---|---|---|
| H.1 | Share link xem online (chặng Render, ReactFlow) | ✅ | `app/share/[token]` — **chỉ cho flow Render, KHÔNG cho deck Present** |
| H.2 | **Share deck Present cho khách xem** (view-only) | 🆕 | chưa có route share deck |
| H.3 | **Ghi chú/bình luận của khách trên slide** (comment pin, thread) | 🆕 | CAD có markup overlay (F3.2); Present chưa |
| H.4 | **Version có tên** ("v1 gửi khách", "v2 sau feedback") | 🆕 | chỉ undo/redo + autosave IDB; Render có FlowVersion, Present chưa |

---

## P-I — QUẢN LÝ DECK · TÀI SẢN · HỒ SƠ HÀNH CHÁNH *(thêm 17/07 — 6 luồng yêu cầu chủ dự án)*

| # | Tính năng | Trạng thái | Bằng chứng / ghi chú |
|---|---|---|---|
| I.1 | **Bảng deck** (thư viện nhiều deck: mở lại/nhân bản/xoá, thumbnail) | 🆕 | CHƯA có. `Gallery` = ảnh render (`lib/gallery.ts`), `Dashboard` liệt kê Dự án+Flow **không có deck Present**, `sheets-persist` = **1 record/(userId,route)** = 1 workspace ≤5 sheet. Việc = **PS-9** |
| I.2 | **Thư viện tài sản** (ảnh/render/logo/ảnh vật liệu dùng chung, tag) | 🔜 | rời rạc: `Gallery` + `LibraryPickerModal` + Reference (`templatesFromLibrary`). Gộp = **PS-10**; nối hook `materials.ts:46 photoUrl?` (ảnh vật liệu thật) |
| I.3 | **Mẫu hồ sơ hành chánh 1 trang A4** (memo/đề xuất/thư/biên bản chữ-layout) | 🆕 | dùng lại canvas+text+shape+A4(PS-4)+PDF. Việc = **PS-11** (CHẶN bởi PS-4) |
| I.4 | **Form hành chánh CÓ BẢNG** (hoá đơn dòng-mục, BOQ) | ⛔/hoãn | `ElementKind='image'\|'text'\|'shape'` (`model.ts:17`) — **không có element bảng**. REDIRECT sang `du-toan-noi-that` hoặc hoãn tới khi quyết định thêm element bảng |
| I.5 | **"Design system" hình thức đầy đủ** (component-library sống, governance) | ⛔ | over-engineering cho team nhỏ. `DECK_STANDARDS` (token) + Brand Kit (PS-1) + font/palette đã cho ~90%. Lát mỏng tuỳ chọn: 1 màn "Tham chiếu nhận diện" chỉ-đọc (ưu tiên thấp) |

> **Ghi chú luồng 5 (deck mẫu vs form hành chánh)**: "deck mẫu" client-facing = PS-2 (user tự
> lưu) + bộ starter TTT-branded (sub-item nội dung PS-2, không cần engine). "Form mẫu hành chánh"
> nội bộ = **khác thật** → I.3/PS-11 (chữ-layout) và I.4 (bảng — hoãn/redirect).

## TỔNG KẾT GAP (chỉ giữ gap THẬT, đã lọc)

| Gap | Nhóm | Giá trị cho TTT | Ưu tiên |
|---|---|---|---|
| **Brand Kit bền vững + áp lại theme cả deck** (G.5, G.6, G.7) | Canva + Figma-styles | Cao — nhiều deck khách, giữ nhận diện TTT nhất quán | 🔴 Cao |
| **Lưu template tự tạo + đồng bộ team** (B.8, B.9) | Canva Brand Templates | Cao — designer tái dùng bố cục nhà làm | 🟠 Cao–vừa |
| **Round-trip photo-editor ↔ slide + tài sản liên kết** (D.9, D.10) | Photoshop smart-object + Figma instance | Vừa — sửa render/logo 1 nơi, cập nhật mọi slide | 🟡 Vừa |
| **Đa khổ: board A3/A4 (dọc/ngang) ngoài 16:9** | Canva Magic Resize (bản gọn) | Vừa — hồ sơ nội thất có board in, không chỉ slide 16:9 | 🟡 Vừa |
| **Review với khách: share deck + comment + version** (H.2–H.4) | Figma comments/history | Cao — vòng phản hồi khách hàng | 🟠 Cao–vừa (nặng hạ tầng) |
| **Photo-editor usability "gần PTS"** (D.12: phím tắt + non-destructive + discovery) | Photoshop UX | Vừa — nhưng **CHẶN bởi PS-3** (đảo hoang) | 🟡 Vừa → **PS-7** |
| **AI khởi thảo nội dung deck** (C.10: outline + call-out vật liệu + narrative) | Gamma/Canva AI (bản gọn) | Cao–vừa — điểm xuất phát nhanh, human-in-loop | 🟠 → **PS-8** |
| **Bảng deck / quản lý nhiều deck** (I.1) | — (nhu cầu vận hành TTT) | Cao–vừa — mở lại deck cũ theo dự án | 🟠 → **PS-9** |
| **Thư viện tài sản** (I.2) | Canva/DAM (bản gọn) | Vừa–thấp — gộp Gallery+Reference, nối ảnh vật liệu | 🟡 → **PS-10** |
| **Mẫu hồ sơ hành chánh 1 trang A4** (I.3) | — (nội bộ TTT) | Vừa — tái dùng editor+A4; bảng thì redirect dự toán | 🟡 → **PS-11** (chặn PS-4) |
| Auto-shrink/reflow chữ khi tràn (C.8) | Figma auto-layout (slice nhỏ) | Thấp–vừa — tiện, không chặn | ⚪ Thấp |

## ⛔ KHÔNG LÀM (chủ đích — feature-parity theater cho việc dựng deck)

- Figma: vector pen, prototyping/interaction, dev-mode/code export, **hệ component +
  variant + props đầy đủ** (deck ≤5 sheet + template một-lần đã đủ; instance liên kết chỉ
  cần cho logo/ảnh dùng lại — gộp vào D.10, không dựng cả engine component).
- Canva: định dạng mạng xã hội, video editor, print-on-demand marketplace, Magic Resize
  full (chỉ cần vài khổ cố định).
- Photoshop: kênh màu/curves-per-channel nâng cao, CMYK/bleed/print production,
  animation/timeline, họ selection chi tiết (magic-wand/quick-select) — `/photo-editor`
  hiện tại đã đủ cho ghép ảnh render.
- Canva AI content-fill / Magic Design: **CẬP NHẬT 17/07** — chủ dự án yêu cầu rõ giao diện AI
  sinh nội dung → **PS-8 LÀM** (mở rộng `present/text` C.9 + outline qua `content-deck.ts`,
  human-in-loop). Cái ⛔ THẬT còn giữ = **auto-deck-from-nothing 1-click** (Magic Design không
  người duyệt) + **generative-fill ẢNH** (inpaint/outpaint — thuộc chặng Render/ComfyUI, không Present).

## Nguồn tham chiếu ngoài (đối soát tính năng)

- Figma — [Auto Layout & Variants](https://help.figma.com/hc/en-us/articles/360056440594-Create-and-use-variants) · [Design Systems guide](https://www.door3.com/blog/design-systems-guide)
- Canva — [Brand Kit](https://www.canva.com/help/brand-kit/) · [Magic Resize](https://www.canva.com/pro/magic-resize/) · [Brand Templates](https://www.canva.com/help/create-on-brand-designs/)
- Photoshop — [Smart Objects overview (Adobe)](https://helpx.adobe.com/photoshop/desktop/create-manage-layers/smart-objects/smart-objects-overview-and-benefits.html) · [Nondestructive editing (Adobe)](https://helpx.adobe.com/photoshop/using/nondestructive-editing.html)
