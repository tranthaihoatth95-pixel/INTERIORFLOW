# IF Present Stage — Sprint Plan (đóng gap chặng 3)

> Kèm theo `IF-PRESENT-STAGE-SPEC.md` (spec đã đối soát mã) và
> `IF-MASTER-ARCHITECTURE.md` (roadmap tổng). Chặng CAD dùng Sprint 3–12;
> chặng Present là **stage riêng** nên đánh số track riêng **PS-1…PS-6**
> ("Present Sprint") cho khỏi lẫn với sprint CAD.
>
> **Bối cảnh (đọc trước khi giao việc)**: Present KHÔNG phải khung sườn — đã là trình
> dàn trang thật (25 template, canvas đủ, `DECK_STANDARDS`, guardrail, xuất
> PDF/PPTX/PNG, `/photo-editor` layer/mask/curve). Các sprint dưới **chỉ đóng gap thật**,
> không dựng lại thứ đã có. Luật chung IF vẫn áp: agent nghiên cứu → user lọc → agent sửa
> trên nhánh (không tự merge) → integrator verify browser → merge; ≤3 worktree; STATUS<800 từ.

## Bảng roadmap (khớp cột với IF-MASTER-ARCHITECTURE)

| Track | Sprint | Nội dung | Ưu tiên | Phụ thuộc | Trạng thái |
|---|---|---|---|---|---|
| Present | **PS-0** | Audit + verify điểm mờ (round-trip photo-editor, khớp 16:9) | Gate | — | ✅ (17/07) |
| Present | **PS-1** | Brand Kit bền vững + áp lại theme cả deck | 🔴 Cao | PS-0 | ✅ (17/07) |
| Present | **PS-2** | Lưu template tự tạo + thư viện team | 🟠 Cao–vừa | PS-1 | 🆕 |
| Present | **PS-3** | Round-trip `/photo-editor` ↔ slide + tài sản liên kết (smart-object) | 🟡 Vừa | PS-0, PS-1 | 🆕 |
| Present | **PS-4** | Đa khổ: board A3/A4 (dọc/ngang) ngoài 16:9 | 🟡 Vừa | `DECK_STANDARDS`, Render output res | 🆕 |
| Present | **PS-5** | Review với khách: share deck + version có tên | 🟠 Cao–vừa | hạ tầng share/auth | 🆕 |
| Present | **PS-6** | Comment/ghi chú của khách trên slide | 🟠 Cao–vừa | PS-5 | 🆕 |
| Present | **PS-7** | Photo-editor "gần PTS": phím tắt + quy ước panel + rõ non-destructive + tool-discovery | 🟡 Vừa | **PS-3 (chặn)** | 🆕 (17/07) |
| Present | **PS-8** | AI khởi thảo nội dung deck (outline + call-out vật liệu + narrative từ CAD/Gu) | 🟠 Cao–vừa | `present/text` route, `content-deck.ts` | 🆕 (17/07) |
| Present | **PS-9** | Bảng deck (thư viện + quản lý nhiều deck, mở lại/nhân bản) | 🟠 Cao–vừa | sheets-persist IDB, Dashboard | 🆕 (17/07) |
| Present | **PS-10** | Thư viện tài sản (ảnh/render/logo/ảnh vật liệu dùng chung) | 🟡 Vừa–thấp | Gallery + Reference hiện có | 🆕 (17/07) |
| Present | **PS-11** | Mẫu hồ sơ hành chánh 1 trang A4 (memo/đề xuất/biên bản chữ-layout) | 🟡 Vừa | **PS-4 (khổ A4)** | 🆕 (17/07) |
| Present | *(gate)* | Đánh giá: deck dùng thật với khách chưa? Có cần PS-4/5/6 không? | — | — | ⏳ |

> Có thể chạy song song tối đa 3 nhánh (luật worktree). Thứ tự đề xuất tuần tự theo
> giá trị/ít phụ thuộc: **PS-0 → PS-1 → PS-2 → PS-3 → (gate) → PS-4/PS-5→PS-6**.
>
> **Bổ sung 17/07 (6 luồng yêu cầu chủ dự án)**: PS-7…PS-11 dưới đây. **Trình tự bắt buộc**:
> PS-3 (nối photo-editor về slide) là **điều kiện tiên quyết** của PS-7 — đánh bóng một trình
> chỉnh ảnh CÒN LÀ HÒN ĐẢO (mở tab trắng, output chỉ tải PNG tay — PS-0) gần như vô giá trị.
> PS-8/PS-9/PS-10 độc lập, không chặn nhau. PS-11 chờ PS-4 (khổ A4).

---

## PS-0 — Audit & verify điểm mờ *(gate, ~0.5 sprint)*

**Bao gồm**
- Xác minh **D.9**: mở ảnh slide sang `/photo-editor`, sửa (thêm lớp/mask/grade), rồi
  kiểm tra kết quả có **ghi ngược đúng element slide** không, hay `/photo-editor` là doc
  độc lập không có đường về. Kết luận rõ: đã nối / chưa nối.
- Đo mức "khoá 16:9": liệt kê mọi chỗ hardcode `1920×1080` / `aspectRatio:16/9`
  (`export.ts`, `EditorCanvas.tsx`, `SlideStrip.tsx`, `LayoutShelf.tsx`, render.ts) →
  ước lượng công tách khổ ra tham số (đầu vào cho PS-4).
- Xác nhận độ phân giải ảnh render đầu ra (chặng 2) có đủ cho in A3 300dpi không
  (đầu vào cho PS-4).

**Vì sao trước tiên**: 2 gap (D.9, PS-4) đang ở trạng thái ⚠️ *cần xác minh* — không nên
lập kế hoạch chi tiết khi chưa biết đường về của photo-editor và mức coupling 16:9.

**Đầu ra**: ghi chú ngắn (STATUS.md / nợ kỹ thuật) chốt phạm vi thật của PS-3, PS-4.

### ✅ KẾT QUẢ PS-0 (17/07 — audit, không đổi code)

1. **D.9 = NỐI MỘT PHẦN** (không phải "đã nối" cũng không "tách hoàn toàn"):
   - **Đã nối (phần nhẹ)**: `ImageEditor.tsx` (Canva, mở khi nhấp đúp) ghi THẲNG lên
     `ImageElement` qua `onUpdate` — crop (`CropRect`), chỉnh màu bằng CSS-filter
     (`ImageAdjust`: sáng/tương phản/bão hoà/nhiệt), thay ảnh (`src`), bo góc. Phản chiếu
     đúng ở canvas (`render.ts`) + export. Round-trip nhẹ CHẠY TỐT.
   - **Chưa nối (phần nặng)**: nút "Chỉnh ảnh nâng cao" chỉ gọi
     `window.open('/photo-editor', '_blank')` (`PresentEditor.tsx:937`) — **KHÔNG truyền
     `src` của element, KHÔNG đường ghi về**. `/photo-editor` mở tài liệu MẪU trắng
     (`makeSampleDoc`), state cục bộ trong `useDoc` (cố ý KHÔNG dùng lib/store), output DUY
     NHẤT là **tải file PNG/JPEG** (`exportDoc` + `<a download>`). ⇒ layer/mask/clone/heal/
     adjustment-layer HOÀN TOÀN tách rời; muốn dùng phải import tay → sửa → xuất file → quay
     lại tab Present "Thay ảnh" upload tay.

2. **Khoá 16:9** — hardcode GOM 3 file (job PS-4 vừa-nhỏ vì toạ độ element đã là %):
   - `lib/present-editor/standards.ts:69` — `stage:{w:1920,h:1080,pxPerPctW:19.2,pxPerPctH:10.8}` (nguồn "chính tắc").
   - `lib/present-editor/render.ts:28-29` — `const W=1920; const H=1080` **RIÊNG, không đọc
     standards** ⇒ hiện có **2 nguồn sự thật** cho khổ sân khấu (nợ kỹ thuật — PS-4 gộp về 1).
   - `lib/present-editor/export.ts:26,29,30` — jsPDF `format:[1920,1080]` + addPage + addImage.
   - Toạ độ mọi element = **% của sân khấu (0..100)** ⇒ đổi khổ thì reflow gần như "free"
     (chỉ cần re-run margin/grid của `DECK_STANDARDS`/`region-layout`).
   - 6 chỗ CSS `aspectRatio:'16 / 9'` chỉ để HIỂN THỊ (EditorCanvas · SlideStrip · SlidePlayer
     · LayoutShelf · TemplatePicker) — đổi thành biến theo khổ, không phải logic.
   - (Các `aspectRatio` trong `ImageEditor.tsx` là nút tỉ-lệ-CROP, KHÔNG liên quan khổ sân khấu.)

3. **Độ phân giải render (chặng 2)**:
   - `slide.composer` → `renderSlide` (`lib/slides.ts`) xuất canvas **1920×1080** JPEG.
   - Ảnh hero AI bên trong: NVIDIA FLUX NIM tối đa **1344px** cạnh dài (768–1344 bước 64,
     `nvidiaFluxDims`); fal/SD còn thấp hơn (~768×512 / ~1MP). Handoff truyền dataURL các ảnh này.
   - A3 300dpi cần ~**3508×4961px**. 1920px in lên A3 landscape ≈ **116 dpi** (thiếu ~2.6×
     tuyến tính, ~7× pixel). Ngay cả upscale canvas cũng không thêm chi tiết vì nguồn AI đã
     bị chặn ở 1344px. ⇒ **KHÔNG đủ in A3/A4 300dpi hôm nay.**

---

## PS-1 — Brand Kit bền vững + áp lại theme cả deck 🔴

**Bao gồm** (gap G.5, G.6, G.7)
- **Brand Kit** cấp người dùng/TTT: lưu **logo · bộ màu · cặp font** một lần (persist —
  tái dùng hạ tầng `custom-fonts.ts` localStorage + gu palette; nếu có auth thì gắn userId).
- Deck **mới tự nạp** Brand Kit (thay vì palette mặc định quiet-luxury cứng).
- **"Áp lại theme cho cả deck"**: một nút nhuộm lại background/màu chữ/palette của MỌI
  slide đang có theo Brand Kit hiện hành (hiện `onGenerated` chỉ set `deck.palette`, slide
  cũ giữ màu đã nướng → cần hàm re-map màu theo vai trò).
- Chèn **logo/watermark** như tài sản cấp deck (đặt góc slide, bật/tắt).

**Vì sao ưu tiên cao nhất**: giá trị/công tốt nhất. TTT làm nhiều deck khách → nhất quán
nhận diện là nhu cầu lặp hằng ngày. Building block đã có (deck.brand/palette, custom-fonts,
gu palette) → chủ yếu là "gom + persist + áp", không từ số 0.

**Phụ thuộc**: PS-0 (nhẹ). Không phụ thuộc Render.

**Ranh giới**: KHÔNG dựng "Brand Kit 100 brand" như Canva — TTT chỉ cần 1–vài brand.

> **✅ KẾT QUẢ PS-1 (17/07 — nhánh `feat/present-ps1-brandkit` đã merge vào `feat/present-layout-ml-p1` @ `db08340`)**
> - **G.5 Brand Kit persist** — `lib/present-editor/brand-kit.ts` (MỚI): lưu logo·6 màu·font·watermark
>   vào localStorage (tái dùng pattern `custom-fonts.ts`), danh sách PHẲNG + activeId (KHÔNG kiểu
>   Canva 100-brand). localStorage-first, chưa gắn userId (kit gọn, client-only). Deck MỚI tự nạp kit
>   đang chọn — nối ở `PresentSheets.blankDeck()` → `seedDeckWithBrandKit`.
> - **G.6 Áp lại theme cả deck** — `lib/present-editor/theme-roles.ts` (MỚI) `rethemeDeck()`: nhuộm
>   lại nền + màu chữ + fill/stroke MỌI slide theo **vai trò** (gần role nào nhất trong palette cũ →
>   màu cùng role palette mới), KHÔNG find-replace hex. Dựa vị trí thật của màu nên slide nền TỐI
>   (chữ sáng) vẫn nhuộm đúng, không đảo tương phản. `templates.pal()` nay gọi chung `paletteRoles`
>   (gộp 1 nguồn sự thật vai trò màu, hết drift với hàm nhuộm).
> - **G.7 Logo/watermark cấp deck** — `model.ts` `deck.watermark {src,corner,sizePct,opacity,enabled}`,
>   vẽ ở `render.ts` (PDF/PNG/export) + `SlidePlayer` + overlay xem-trước `EditorCanvas`. Bật/tắt +
>   góc + cỡ + mờ trong panel.
> - **UI**: `BrandKitPanel.tsx` (MỚI, modal "Nhận diện") + nút "Nhận diện" ở `Toolbar`.
> - **Verify**: tsc 0 · 43/43 file test (2 mới: `theme-roles.test.ts` 25 ok, `brand-kit.test.ts` 13 ok).
>   Browser 127.0.0.1:4040 (account test riêng, tuần tự): đổi palette xanh → "Áp lại theme" nhuộm
>   đúng cả slide nền tối ('IKI VILLAGE') lẫn nền sáng ('Cơ sở hình thành ý tưởng'); upload logo →
>   watermark hiện mọi slide + đổi góc/toggle chạy; Lưu Brand Kit persist; "Thêm trang" MỚI tự nạp
>   kit (palette xanh + watermark logo tự hiện). 0 lỗi console mới.
> - **Nợ nhỏ (ghi lại, không chặn)**: mở lại BrandKitPanel LUÔN nạp kit đang-active (ghi đè giá trị
>   watermark/logo của deck hiện tại trong panel-view) — chủ ý để sửa kit, nhưng nếu deck có watermark
>   khác kit đã lưu thì panel không phản chiếu; chấp nhận cho v1.

---

## PS-2 — Lưu template tự tạo + thư viện team 🟠

**Bao gồm** (gap B.8, B.9)
- **"Lưu slide này thành template"**: bắt element hiện tại thành `EditorTemplate.build`
  tham số hoá (giữ khung %, thay nội dung/ảnh/palette) → thêm vào picker nhóm "Của tôi".
- Persist template tự tạo (localStorage → sau nối server nếu có).
- (Tuỳ chọn, nếu có Google Drive/team sync ở backlog) **đồng bộ thư viện template TTT**.

**Vì sao**: đây là phần "component/Brand Template" mà Canva/Figma mạnh — Present đã có 25
builtin (kể cả template nội thất), chỉ THIẾU khả năng **người dùng tự lưu**. Đóng gap này
là biến Present từ "chọn mẫu có sẵn" thành "nhà TTT tự dựng bộ mẫu".

**Phụ thuộc**: PS-1 (template nên mang Brand Kit). `templates.ts` `EditorTemplate` interface
đã sẵn cấu trúc để cắm thêm nguồn.

**Ranh giới**: KHÔNG làm hệ component + variant + props đầy đủ kiểu Figma (deck ≤5 sheet +
template một-lần đủ dùng; liên kết instance để ở PS-3).

---

## PS-3 — Round-trip photo-editor ↔ slide + tài sản liên kết 🟡

> **Cập nhật sau PS-0**: D.9 xác nhận phần nặng **CHƯA nối chút nào** — `/photo-editor` mở
> doc trắng, không nhận `src`, không có đường ghi về (chi tiết ở KẾT QUẢ PS-0). Vậy PS-3
> KHÔNG phải "chỉnh sửa nhẹ đường về đã có" mà là **dựng đủ 3 mảnh**: (a) TRUYỀN ẢNH VÀO —
> `openAdvancedEditor` phải đẩy `src`+id element sang `/photo-editor` (query/sessionStorage
> handoff, tái dùng pattern `lib/present-editor/handoff.ts`) và seed vào `useDoc` thay
> `makeSampleDoc`; (b) COMPOSITE RA — dùng `exportDoc` sẵn có ra PNG dataURL; (c) GHI VỀ —
> route ảnh về đúng `ImageElement.src` (postMessage giữa 2 tab, HOẶC chuyển `/photo-editor`
> thành overlay trong `/present-editor` như `ImageEditor` để khỏi lo cross-tab). Engine chỉnh
> ảnh (layer/mask/curve/clone) đã xong — **công thật của PS-3 nằm ở lớp handoff + writeback**,
> không phải editor. Ước lượng: vẫn mức "vừa" nhưng nghiêng về hạ tầng truyền/ghi hơn là UI.

**Bao gồm** (gap D.9, D.10)
- **Nối đường về**: sửa ảnh ở `/photo-editor` → composite ra PNG → ghi lại đúng
  ImageElement trên slide — **3 mảnh (a)(b)(c) ở ghi chú trên** (PS-0 đã chốt: chưa có mảnh nào).
- **Tài sản liên kết (smart-object / instance gộp làm một)**: ảnh/logo dùng lại nhiều
  slide tham chiếu chung một nguồn (assetId) — **sửa nguồn 1 lần, cập nhật mọi nơi**.
  Ưu tiên use-case thật: logo/watermark TTT, ảnh render dùng ở nhiều slide (before/after,
  moodboard), grade màu đồng loạt.

**Vì sao mức vừa**: `/photo-editor` đã làm sẵn phần nặng (layer/mask/curve/clone). Đây là
tính năng "tiện + nhất quán" chứ không chặn việc dựng deck (designer vẫn kéo lại tay được).
Gộp smart-object (Photoshop) và component-instance (Figma) thành MỘT khái niệm "tài sản
liên kết" để không dựng 2 engine.

**Phụ thuộc**: PS-0 (đường về), PS-1 (logo asset). Nếu dùng ảnh render liên kết → cần
Render stage phát **id ổn định** cho ảnh (hiện handoff truyền dataURL, chưa có id) — ghi
là điều kiện.

---

## PS-4 — Đa khổ: board A3/A4 ngoài 16:9 🟡

**Bao gồm**
- Tách khổ sân khấu ra tham số (kết quả PS-0): thêm preset **16:9 · A4 ngang · A4 dọc ·
  A3 ngang · A3 dọc** (board trình bày nội thất hay in A3 dọc).
- Reflow khi đổi khổ: **tái dùng `DECK_STANDARDS` + `region-layout`** để đặt lại element
  theo margin/lưới của khổ mới (bản gọn của Magic Resize, không cần AI).
- `export.ts` xuất PDF/PNG theo khổ mới (đổi format trang jsPDF; PPTX giữ 16:9 hoặc map khổ gần nhất).

**Vì sao mức vừa**: hồ sơ nội thất có board in thật, không chỉ slide 16:9 — nhưng phần lớn
deck khách vẫn 16:9, nên đây là mở rộng, không chặn.

> **Cập nhật sau PS-0 (QUYẾT ĐỊNH PHẠM VI)**:
> - **Coupling 16:9 THẤP** — magic-number gom ở 3 file (standards/render/export) + 6 chỗ CSS
>   hiển thị; toạ độ element đã %-based nên reflow gần free. Việc tách khổ ra tham số là
>   **vừa-nhỏ**. LƯU Ý phải gộp 2 nguồn stage-size (`standards.ts` vs `render.ts`) về 1 trước.
> - **Render KHÔNG đủ in 300dpi** (1920×1080 composite, hero AI max 1344px ⇒ ~116 dpi trên A3).
>   ⇒ **PS-4 CHỈ làm board XEM MÀN HÌNH / xuất PDF-PNG độ phân giải màn hình, KHÔNG phải print
>   production 300dpi.** Nhãn UI phải nói rõ "khổ trình bày (màn hình/chiếu)", không hứa in nét.
>   In A3 300dpi thật = **bị chặn** tới khi chặng Render nâng res (gen tiled/upscale > 3500px) —
>   ghi thành điều kiện riêng, KHÔNG nằm trong PS-4.

**Phụ thuộc**:
- `DECK_STANDARDS` (đã có — budget/archetype tái dùng cho khổ mới).
- **Render stage**: PS-0 đã xác minh — res hiện tại chỉ đủ MÀN HÌNH (xem trên). Print 300dpi chờ Render nâng cấp.

**Ranh giới**: KHÔNG làm bộ khổ mạng xã hội (IG/FB story…). Chỉ khổ trình bày. **KHÔNG hứa
in production 300dpi** ở sprint này (giới hạn từ res Render — PS-0).

---

## PS-5 — Review với khách: share deck + version có tên 🟠

**Bao gồm** (gap H.2, H.4)
- **Share deck Present** (view-only) qua link — tách khỏi `app/share/[token]` hiện chỉ
  phục vụ flow Render (ReactFlow); cần route/serialize riêng cho `EditorDeck`.
- **Version có tên**: chốt snapshot "v1 gửi khách", "v2 sau feedback" (tái dùng ý tưởng
  FlowVersion của chặng Render + sheets-persist IDB đã có).

**Vì sao**: vòng phản hồi khách là giá trị lớn cho deck trình bày, nhưng **nặng hạ tầng**
(share backend, auth, lưu bản) → đặt sau các sprint editor thuần. Có thể tách PS-5a (share
view-only + version) trước, PS-6 (comment) sau.

**Phụ thuộc**: hạ tầng share/auth (đã có một phần cho Render — kế thừa, không dựng lại).

---

## PS-6 — Comment/ghi chú của khách trên slide 🟠

**Bao gồm** (gap H.3)
- Ghim comment (pin toạ độ %) + thread trên từng slide; khách bình luận trên link share
  (PS-5); designer thấy + resolve.
- Tham khảo markup overlay CAD (F3.2) đã có — cùng pattern ghim ghi chú theo toạ độ.

**Vì sao sau PS-5**: comment cần lớp share + danh tính người xem trước. Là bước hoàn thiện
vòng review, không phải nền tảng.

**Phụ thuộc**: PS-5 (share + identity).

---

## PS-7 — Photo-editor "gần Photoshop" nhưng DÙNG ĐƯỢC 🟡 *(CHẶN bởi PS-3)*

> **Chốt phạm vi (anchor từ PS-0)**: engine chỉnh ảnh ĐÃ SÂU (P-D.2–D.8: lớp raster +
> adjustment không phá huỷ, 15 blend mode, mask vẽ được, levels/gamma/curve-LUT, clone/heal/
> marquee/lasso). Cái brief lo "thiếu tính năng Photoshop" phần lớn **đã có**. Vấn đề THẬT của
> `/photo-editor` KHÔNG phải thêm tính năng — mà là (1) nó vẫn là **hòn đảo** (PS-3 chưa nối →
> chưa ai dùng thật) và (2) **usability/consistency yếu**. ⇒ **KHÔNG làm PS-7 trước PS-3.**
> "Thêm sức mạnh cho một công cụ không ai với tới" = giá trị gần 0.

**Bao gồm** (đóng gap usability, KHÔNG thêm engine mới)
- **Phím tắt kiểu Photoshop** — hiện `/photo-editor` **gần như KHÔNG có phím tắt**: chỉ
  Space=pan + Ctrl/Cmd+lăn=zoom (`components/photo-editor/DocCanvas.tsx:380–405`). **KHÔNG có
  Ctrl/Cmd+Z/Y** (undo/redo chỉ nút trên `PhotoToolbar`, `useDoc` có action nhưng không nối
  keydown), **KHÔNG có phím chọn tool** (V/B/E/C/M/L…). Trong khi chặng CAD ĐÃ nối
  Ctrl/Cmd+Z/Y/C/V (`components/cad/CadCanvas.tsx:1388–1411`) và dùng `lib/kbd.ts` để hiện
  nhãn ⌘ (Mac) / Ctrl (Win). ⇒ **TÁI DÙNG `lib/kbd.ts` + copy pattern keydown của CadCanvas**,
  KHÔNG tự chế convention mới: nối ⌘/Ctrl+Z/Y, ⌘/Ctrl+0 fit, chữ chọn tool (V move, B brush,
  E eraser, S clone, J heal, M marquee, L lasso — muscle memory Photoshop), `[`/`]` cỡ cọ.
- **Rõ ràng non-destructive**: LayersPanel cần cho user THẤY rõ "lớp này là adjustment ảnh
  hưởng mọi lớp bên dưới" khác lớp raster phẳng (icon riêng + gợi ý phạm vi). ⚠️ *cần xác
  minh* `LayersPanel.tsx` hiện phân biệt tới đâu (chưa đọc kỹ trong audit này).
- **Tool-discovery cho người không rành PTS** (designer TTT không phải ai cũng là power-user):
  tool hiện chỉ icon + `title=TOOL_LABELS` (tooltip). Thêm nhãn/nhóm tool + 1 dòng "làm gì".
- **Quy ước panel**: giữ bố cục hiện tại (Toolbar trên · LayersPanel · AdjustPanel — P-D.8),
  chỉ chuẩn hoá cho khớp gu Photoshop (rail tool trái / thuộc-tính phải) NẾU rẻ; không đập lại.

**Vì sao mức vừa & vì sao SAU PS-3**: toàn bộ là lớp UX mỏng, chi phí thấp — nhưng chỉ sinh
lời SAU khi PS-3 biến editor thành công cụ thật trong luồng slide. Làm PS-7 trước = đánh bóng
đảo hoang.

**Phụ thuộc**: **PS-3 (cứng)**. `lib/kbd.ts`, pattern `CadCanvas` keydown (tái dùng, không chế mới).

**Ranh giới**: ⛔ KHÔNG thêm họ selection PTS (magic-wand/quick-select), CMYK, timeline,
curves-per-channel — đã chốt ⛔ ở spec D.11. PS-7 = **chỉ interaction & discovery**, không engine.

---

## PS-8 — AI khởi thảo nội dung deck 🟠

> **Cập nhật guidance (thay chốt ⛔ cũ "AI content-fill lặp lại")**: chủ dự án nay YÊU CẦU rõ
> một giao diện AI sinh nội dung. Quan trọng: **một phần ĐÃ TỒN TẠI** — `app/api/present/text/
> route.ts` sinh chữ cho 1 text-layer theo vai trò (title/kicker/body/free) qua
> `completeTextTiered` (Cloud NVIDIA → Ollama → route tự lo lõi tất định), giọng quiet-luxury
> TV, human-in-loop (đổ vào layer, user sửa). ⇒ PS-8 **MỞ RỘNG pattern nhà đã có**, KHÔNG chế
> cơ chế gọi AI mới. Cái ⛔ thật vẫn giữ = "auto-deck-from-nothing kiểu Canva Magic Design" +
> generative-fill ẢNH — xem ⛔ list.

**Bao gồm** (mỗi mục đã cân nhắc, chỉ giữ cái đáng làm)
- ✅ **Outline deck sơ thảo từ CAD+Render+Gu** (giá trị cao nhất): AI đề xuất DÀN Ý — slide nào,
  thứ tự nào — từ `project type / style / room list / #ảnh render`. **Tái dùng đường ống có
  sẵn**: AI chỉ cần phát ra **markdown** rồi cho `content-deck.ts` (C.5, đã biến markdown→deck
  tất định) dựng; hoặc list `{template, role, seed-copy}` để `suggest.ts` (C.3) chọn khung.
  KHÔNG viết engine deck mới.
- ✅ **Call-out mô tả vật liệu** (đặc thù nội thất, giá trị cao): sinh chú thích vật liệu từ
  preset `lib/cad/materials.ts` (tên/nhóm) → thả vào template `material-palette`/`material-flatlay`.
- ✅ **Narrative copy slide từ dữ liệu dự án**: mở rộng `present/text` route để nhận thêm
  ngữ cảnh `roomList/style` (hiện đã có `brand/project/current/hint`).
- ⛔ **REJECT — AI chọn template theo loại nội dung**: `suggest.ts` (C.3) **đã** gợi ý template
  tất định theo #ảnh + độ dài chữ + gu + hình học lưới. Thêm AI vào chỗ deterministic đang chạy
  tốt = thừa. Giữ deterministic.
- ⛔ **REJECT — auto-sinh cả deck hoàn chỉnh không cần người**: giữ human-in-loop.

**Human-in-loop (gu nhà)**: dự án đã có tiền lệ "AI đề xuất, người chốt" = perceptron pairwise
learning-to-rank ở LayoutShelf (E.3) — TRÍCH DẪN làm chuẩn "AI đề xuất thế nào ở đây". NHƯNG
**không ép rank-by-so-sánh cho chữ**: text chỉ cần **draft → user sửa/duyệt → mới final** (outline:
AI ra dàn ý → user kéo-thả/sửa/bỏ slide → mới generate). Đơn giản, hợp tác vụ chữ.

**Kỹ thuật**: mọi tầng qua `completeTextTiered` (Cloud→Ollama→lõi tất định của route). Outline
có 2 lựa chọn: (a) *rẻ/ít rủi ro* — AI phát markdown, parse bằng `content-deck.ts` sẵn có; (b)
*chặt hơn* — thêm sibling `completeJsonTiered` trả JSON schema (giống đề xuất structured-output
CAD). Khuyến nghị **(a) trước** (không đổi text-tier), (b) chỉ khi cần typed.

**Phụ thuộc**: `present/text` route + `content-deck.ts` + `suggest.ts` (đều đã có). PS-1 (Brand
Kit) để copy sinh ra mang giọng/nhận diện đúng.

**Ranh giới**: ⛔ KHÔNG generative-fill ẢNH (inpaint/outpaint) — đó là chặng Render/ComfyUI, không
phải Present. ⛔ KHÔNG auto-deck 1-click không người duyệt.

---

## PS-9 — Bảng deck (quản lý nhiều deck) 🟠

> Giải nghĩa yêu cầu "slide desk" của chủ dự án = **slide DECK management** (bảng tổng các deck),
> KHÔNG phải một view editor.

**Hiện trạng (audit 17/07)**: **CHƯA có bảng deck.**
- `GalleryPanel` = ảnh OUTPUT render lưu qua node "Save to Gallery" (`lib/gallery.ts`,
  localStorage) — **không phải deck**.
- `Dashboard.tsx` liệt kê **Dự án + Flow (Render)** — **KHÔNG liệt kê deck Present**.
- `sheets-persist` IDB lưu **1 record cho mỗi (userId, route='present-editor')** = **một** workspace
  ≤5 sheet, **không phải thư viện nhiều deck có tên**.

**Bao gồm**
- **Bảng deck**: liệt kê deck đã lưu (thumbnail từ `renderEditorSlide` · tên · sửa lúc nào ·
  thuộc dự án nào) — mở lại / nhân bản / xoá.
- Cho phép **nhiều deck** (đổi khoá `sheets-persist` theo `deckId` thay vì 1 record cứng) +
  surface trong `Dashboard` (thêm mục "Deck Present" cạnh "Flow").

**Vì sao**: TTT làm nhiều dự án → cần thấy/mở lại các deck cũ, không chỉ 1 workspace duy nhất.
Tái dùng hạ tầng (sheets-persist, renderEditorSlide, Dashboard) → chủ yếu là "khoá đa-deck +
1 màn danh sách".

**Phụ thuộc**: `sheets-persist` (mở khoá đa-record), `Dashboard`. Bổ trợ tốt cho PS-5 (version)
nhưng độc lập — làm trước được.

**Ranh giới**: ⛔ KHÔNG dựng hệ folder/tag/permission phức tạp — 1 danh sách phẳng theo dự án đủ.

---

## PS-10 — Thư viện tài sản 🟡

> Phân biệt rõ với PS-2 (lưu **template slide** tự tạo). PS-10 = **thư viện TÀI SẢN**: ảnh upload,
> ảnh render, logo, ảnh vật liệu, phần tử đồ hoạ tái dùng.

**Hiện trạng**: rời rạc — `Gallery` (output render, local), `LibraryPickerModal` trong photo-editor
("Từ thư viện Reference"), Reference library tag-based (`templatesFromLibrary`). Chưa có MỘT kho
tài sản chung mà present + photo-editor + MaterialPalette cùng đọc.

**Bao gồm**
- Gộp Gallery/Reference thành **1 "Thư viện tài sản"** cấp dự án/team: upload ảnh/logo/render,
  tag, chọn lại từ mọi nơi (slide "Thay ảnh", photo-editor import, logo Brand Kit PS-1).
- **NỐI ĐIỂM VỚI VẬT LIỆU**: `lib/cad/materials.ts:46` đã chừa hook `photoUrl?`; khi TTT cấp
  ảnh vật liệu thật (ATLAS), ảnh nằm ở thư viện này và `photoUrl` trỏ vào — `materialTextureDataUrl()`
  tự ưu tiên ảnh thật (`material-texture.ts:413`) **không đổi code CAD**. Đây là chỗ 2 luồng chạm nhau.

**Vì sao vừa–thấp**: tiện + nhất quán, không chặn dựng deck (kéo ảnh tay vẫn được). Chủ yếu
**gộp hạ tầng đã có**, không dựng DAM.

**Phụ thuộc**: `Gallery` + Reference hiện có. PS-1 (logo là 1 loại tài sản). PS-3/D.10 (tài sản
liên kết) là consumer tự nhiên của kho này.

**Ranh giới**: ⛔ KHÔNG dựng DAM đầy đủ (version tài sản, quyền chi tiết, CDN). Kho phẳng + tag đủ.

---

## PS-11 — Mẫu hồ sơ hành chánh 1 trang A4 🟡 *(CHẶN bởi PS-4)*

> **Tách bạch 2 thứ chủ dự án gộp chung**:
> - "**Deck mẫu**" (client-facing) = PS-2 đã lo ("user tự lưu"). Nếu muốn thêm **bộ starter
>   TTT-branded theo loại dự án** thì đó là **việc soạn nội dung nhẹ** (tác giả vài template
>   qua Brand Kit PS-1 + cơ chế lưu PS-2), **KHÔNG cần sprint engine mới** — ghi là sub-item PS-2.
> - "**Form mẫu hành chánh**" (nội bộ: đề xuất, hợp đồng, biên bản họp, hoá đơn, memo) = **YÊU
>   CẦU MỚI THẬT**, khác client-deck.

**Đánh giá tái dùng editor hiện tại**:
- ✅ Dùng LẠI ĐƯỢC cho form **nặng chữ-layout 1 trang**: canvas + text + shape + %-coords +
  khổ A4 (PS-4) + export PDF/PNG. Memo/thư/đề xuất/cover hợp đồng hợp.
- ⚠️ **HẠN CHẾ THẬT**: `ElementKind = 'image' | 'text' | 'shape'` (`model.ts:17`) — **KHÔNG có
  element BẢNG**. Hoá đơn / biên bản có dòng-mục / BOQ cần bảng tính → editor hiện KHÔNG kham.

**Khuyến nghị (rõ ràng)**:
- **LÀM**: PS-11 = category template "Hồ sơ hành chánh 1 trang A4" trên CÙNG editor, phạm vi
  **văn bản chữ-layout** (memo · đề xuất · thư · biên bản đơn giản không bảng), chạy sau PS-4.
- **KHÔNG nhét vào Present**: form **tài chính có bảng** (hoá đơn dòng-mục, BOQ) — cần element
  bảng (scope lớn) HOẶC thuộc về công cụ **dự toán** (`du-toan-noi-that`) vốn đã theo bảng.
  ⇒ **REDIRECT sang dự toán / hoãn** tới khi có quyết định thêm element bảng. Ghi là điều kiện riêng.

**Phụ thuộc**: **PS-4 (khổ A4 dọc)**. Export PDF (đã có). Brand Kit PS-1 (đầu trang/logo công ty).

**Ranh giới**: ⛔ KHÔNG dựng element bảng ở PS-11. ⛔ KHÔNG làm form field/điền tự động/ký số
(đó là `pdf2office`). PS-11 chỉ là **template layout 1 trang**, không phải hệ biểu mẫu.

---

## Đã cân nhắc & LOẠI (ghi lại để không đề xuất lại)

- **AI chọn template theo nội dung** → LOẠI: `suggest.ts` (C.3) đã làm deterministic, tốt hơn.
- **Auto-deck 1-click không người duyệt** (Canva Magic Design) → LOẠI: phá human-in-loop.
- **Generative-fill / inpaint ẢNH trong Present** → LOẠI: thuộc chặng Render/ComfyUI.
- **"Design system" hình thức đầy đủ** (Storybook component-library, governance, doc pattern) →
  **LOẠI (over-engineering)**: TTT là team nhỏ, không phải tổ chức đa-sản-phẩm. `DECK_STANDARDS`
  (`standards.ts` — lưới 12 cột, margin/gutter, bậc 8px, whitespace) **ĐÃ là tầng token của một
  design system**, cộng Brand Kit (PS-1) + font-pairing (G.1) + palette (G.4) → đã cho ~90% giá trị
  thực với chi phí nhỏ. *Lát mỏng tuỳ chọn (ưu tiên thấp)*: 1 màn "Tham chiếu nhận diện" chỉ để
  ĐỌC — hiện Brand Kit đang dùng + type scale + spacing từ DECK_STANDARDS + vài "nên/không nên".
  Không phải hệ component sống.
- **Element bảng trong Present** (cho hoá đơn/BOQ) → HOÃN: redirect sang `du-toan-noi-that`; chỉ
  mở lại nếu quyết định biến Present thành trình soạn tài liệu hành chánh đầy đủ.
- **Bộ starter deck TTT-branded** → KHÔNG cần sprint riêng: là sub-item nội dung của PS-2 (soạn
  vài template qua PS-1+PS-2), không phải engine.

---

## Ghi chú xuyên suốt

- **Không đụng** phần đã đủ: canvas core (P-A), `DECK_STANDARDS` (P-C.1), template builtin
  (P-B), `/photo-editor` engine (P-D.2–D.8), export (P-F). Sprint chỉ THÊM, không viết lại.
- **Không dựng** (⛔ đã chốt trong spec, **cập nhật 17/07**): component/variant engine đầy đủ,
  Magic Resize full, CMYK/print-production, video/social. **AI content-fill**: ⛔ CŨ "không lặp
  lại" đã ĐƯỢC SỬA — chủ dự án yêu cầu rõ → **PS-8 làm** (mở rộng `present/text` + outline qua
  `content-deck.ts`, human-in-loop). Cái ⛔ THẬT còn giữ = auto-deck-from-nothing 1-click +
  generative-fill ẢNH (thuộc Render).
- Mỗi sprint: nhánh riêng `feat/present-{tên}`, verify browser tuần tự host 127.0.0.1 +
  account test riêng, không tự merge main.
- 4 file stress test present từng mất (STATUS nợ kỹ thuật) — nếu sprint chạm vùng đó, viết
  lại test trước.
