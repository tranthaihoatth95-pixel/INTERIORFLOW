# AUDIT — Editor Toolkit Present thật sự có gì (28/07)

> **Mục đích**: trả lời câu hỏi CẦN HOÀ QUYẾT #1 trong `docs/IF-MASTER-TREE.md` — spec
> (`SPEC-EDITOR-TOOLKIT.md`) ghi ⬜ cho nhiều món, nhưng code Present cho thấy khác. File này
> KHÁM code thật (`file:dòng`), KHÔNG sửa spec, KHÔNG sửa code. Quyết định (nếu có) ghi ở
> `IF-MASTER-TREE.md`, không ghi ở đây.
>
> **Phạm vi đọc**: `lib/present-editor/model.ts`, `shape-geometry.ts`, `align.ts`, `text-fx.ts` ·
> `components/present-editor/Element.tsx`, `EditorCanvas.tsx`, `Inspector.tsx`, `LayerPanel.tsx`,
> `ImageEditor.tsx`, `PresentEditor.tsx` · `components/photo-editor/AdjustPanel.tsx` + grep toàn
> `lib/photo-editor/`, `components/photo-editor/`. KHÔNG tìm thấy thư mục/route "Graphic editor"
> nào tách biệt khỏi Present/Photo trong repo — chỉ có 2 tool: **Present** (dàn slide) và
> **Photo-editor** (chỉnh ảnh sâu, `/photo-editor`).

| Món | Có trong code? (file:dòng) | Dùng được ở đâu | Chất lượng |
|---|---|---|---|
| **Mask ảnh** (theo hình tuỳ ý, không chỉ chữ nhật) | ⬜ KHÔNG có. `ImageInner()` (`components/present-editor/Element.tsx:422-444`) chỉ có `borderRadius` (bo góc) + `backgroundSize/Position` (crop chữ nhật) — không có `clip-path`/mask nào áp cho ảnh. `shapeClipPath()` (`lib/present-editor/shape-geometry.ts:65-69`) chỉ dùng cho `ShapeElement` (tam giác/đa giác/mũi tên), KHÔNG bao giờ gọi cho `ImageElement`. | — | **Chưa có** |
| **Bo góc ảnh** | ✅ `ImageElement.radius?: number` (`lib/present-editor/model.ts:183`) → áp `borderRadius` ở `Element.tsx:439` VÀ `ImageEditor.tsx:250` (preview khi crop). Slider chỉnh ở `Inspector.tsx` (panel Ảnh). | Present | **Đủ dùng** — field+UI+3 nơi render đồng bộ (editor/export qua `render.ts`, không kiểm riêng lần này nhưng comment model xác nhận quy ước "phản chiếu 3 nơi") |
| **Crop trong khung** | ✅ `CropRect{x,y,w,h}` (`model.ts:129-136`), UI kéo khung trực tiếp trên ảnh — `ImageEditor.tsx:99-139` (drag 8 handle, `clampCrop`, live preview `:256-270`), tab "Cắt" riêng (`:201`). | Present | **Đủ dùng** — UI kéo-thả thật, không phải chỉ số nhập tay |
| **Gradient** | 🟡 KHÔNG đồng nhất theo loại phần tử: **Text** có gradient MÀU thật (`TextGradient{from,to,angle}`, `model.ts:64-69`, CSS ở `text-fx.ts:79` `gradientCss()`) — đủ dùng cho chữ. **Shape** chỉ có `OpacityGradient` (`model.ts:33-39`) — đây là **mặt nạ ĐỘ MỜ** (alpha fade 0..1), KHÔNG đổi màu, tự code/comment xác nhận "Chỉ đổi độ mờ theo trục, KHÔNG đổi màu" (`model.ts:31`). **Ảnh** hoàn toàn không có gradient nào. | Present (text ✅, shape 🟡, ảnh ⬜) | **Thô sơ** — tên gọi "gradient" gây hiểu lầm cho shape (thực chất là opacity-fade, không phải color-gradient); ảnh không có gì |
| **Overlay** (phủ màu/ảnh lên trên 1 phần tử) | ⬜ KHÔNG tìm thấy khái niệm "overlay" độc lập nào trong `model.ts`/`Element.tsx`. Cái gần nhất là `OpacityGradient` của shape (không phải overlay đúng nghĩa: overlay thường là 1 LỚP MÀU/ẢNH riêng phủ lên trên, có blend mode/opacity riêng — ở đây không có lớp thứ 2 nào). | — | **Chưa có** |
| **Độ trong suốt** | ✅ `BaseElement.opacity?: number` (`model.ts:153`) — áp cho MỌI loại phần tử (ảnh/chữ/shape), slider ở `Inspector.tsx:317-318`. | Present | **Đủ dùng** |
| **Căn chỉnh** (align, nhiều phần tử theo bounding-box chung) | ✅ `alignFrames()` (`lib/present-editor/align.ts:50-73`) — 6 chế độ (left/hcenter/right/top/vcenter/bottom), canh theo bounding-box CHUNG của các phần tử đã chọn (kiểu Figma "Align Selected", không phải canh theo biên sân khấu). Có test riêng `align.test.ts`. | Present | **Đủ dùng** — logic thuần, tested, không side-effect |
| **Phân bố đều** (distribute) | ✅ `distributeFrames()` (`align.ts:82-103`) — cần ≥3 phần tử, chia đều khoảng cách GIỮA CÁC MÉP theo trục ngang/dọc, giữ đúng 2 mốc biên ngoài cùng. Cùng file, cùng test. | Present | **Đủ dùng** |
| **Khoá tỉ lệ** (lock aspect ratio khi resize) | ⬜ KHÔNG có. Grep `lockAspect\|keepRatio\|aspect.*lock` trên toàn `components/present-editor/` + `lib/present-editor/` = **0 kết quả**. | — | **Chưa có** |
| **Blend mode** | 🟡 CHỈ có cho **TEXT** — `TextFx.blend?: 'normal'\|'multiply'\|'screen'\|'overlay'\|'difference'\|'luminosity'` (`model.ts:99`), áp `mixBlendMode` ở `Element.tsx:526` (chỉ trong nhánh render chữ). `ImageInner()` (`Element.tsx:422-444`) KHÔNG có `mixBlendMode` nào. `ShapeElement` cũng không có field blend. | Present (chỉ text) | **Thô sơ** — đúng như tên "blend mode" gợi ý (multiply/screen/overlay đều có), nhưng phạm vi hẹp bất ngờ (chỉ chữ, không ảnh/shape — 2 loại phần tử hay cần blend nhất lại thiếu) |
| **Nhân bản có căn** (smart duplicate) | 🟡 `duplicateElement()` (`model.ts:473-485`) — sao sâu + id mới + dời CỐ ĐỊNH (2%, 2%) "để thấy được bản mới" (comment dòng 470). Gọi qua Ctrl/Cmd+D (`Inspector.tsx:368`, `PresentEditor.tsx:661-665`) và paste (`:583`, `:680`, offset=false khi paste sang slide khác). | Present | **Thô sơ** — có "nhân bản" và có "dời để thấy", nhưng KHÔNG phải "smart duplicate" đúng nghĩa Figma/Illustrator (lặp lại khoảng cách của lần dịch chuyển trước, canh theo lưới/phần tử khác) — chỉ là offset chéo cố định |
| **Text tracking/leading/tràn viền** | ✅ CẢ 3: `tracking?: number` (letter-spacing, `model.ts:214`) · `lineHeight?: number` (`model.ts:215`) · `TextFx.strokeWidth/strokeColor/outlineOnly` (viền chữ + chữ rỗng chỉ giữ viền, `model.ts:87-91`). Hệ `TextFx` đầy đủ hơn nữa: `shadows[]`, `gradient`, `transform` (hoa/thường), `blend`, `curve` (uốn chữ) — dựng ở `lib/present-editor/text-fx.ts` (preset `FX_PRESETS`, hàm `shadowCss/gradientCss/applyTransform`), phản chiếu ĐỒNG BỘ 3 nơi (editor canvas, player trình chiếu, export canvas — tự comment model xác nhận quy ước này). | Present | **Đủ dùng** — hệ thống trưởng thành nhất trong toàn bộ audit này, có preset + test ngầm định qua 3-nơi-đồng-bộ |
| **Layer thứ tự/nhóm/khoá/ẩn** | 🟡 3/4 có: **thứ tự** ✅ (kéo-thả đổi z, `LayerPanel.tsx:57-72` `onReorder`) · **khoá** ✅ (`onToggleLocked`, icon Lock/Unlock, `:132-140`) · **ẩn** ✅ (`onToggleHidden`, icon Eye/EyeOff, `:122-131`, cũng ẩn khỏi export). **Nhóm** (group nhiều phần tử thành 1 khối di chuyển/khoá chung) ⬜ — grep `group\|Group` trong `LayerPanel.tsx` = 0 kết quả, không có khái niệm nhóm nào trong `model.ts` (`BaseElement` không có `groupId`). | Present | **Thô sơ tổng thể** — 3/4 đủ dùng riêng lẻ, nhưng thiếu "nhóm" là gap thật (spec liệt kê "nhóm" như 1 trong 4 việc ngang hàng) |
| **Đổ bóng** | 🟡 CHỈ có cho **TEXT** — `TextShadowLayer[]` (nhiều lớp, `model.ts:53-61`, tối đa 3 lớp theo UI), CSS ở `text-fx.ts:69` `shadowCss()`. `ShapeElement`/`ImageElement` KHÔNG có field shadow nào. | Present (chỉ text) | **Thô sơ** — chất lượng cao cho chữ (nhiều lớp, x/y/blur/color đầy đủ), nhưng ảnh/shape hoàn toàn không có |
| **Làm mờ** (blur filter trên nội dung — khác backdrop-blur của UI chrome) | ⬜ KHÔNG có. Grep `blur(` trong `lib/present-editor/`+`components/present-editor/` chỉ trúng: `TextShadowLayer.blur` (độ nhoè CỦA bóng đổ, không phải blur độc lập trên phần tử) và `ImageEditor.tsx:180` `backdropFilter: 'blur(6px)'` (hiệu ứng chrome của modal, không phải công cụ cho user). Không có filter `blur()` nào áp lên nội dung ảnh/shape/text theo ý người dùng chỉnh. | — | **Chưa có** |
| **Pattern real-world scale** (fill lặp lại theo tiling mm thật, xuất tile PNG/SVG cho 3ds Max/CNC) | ⬜ KHÔNG có. Grep `tiling\|realWorldScale\|mmPerTile\|patternScale` trong toàn `lib/present-editor/`+`components/present-editor/` = **0 kết quả**. | — | **Chưa có** |
| **Bảng số liệu** (data table, hàng/cột biên tập được) | ⬜ KHÔNG có. `ElementKind = 'image' \| 'text' \| 'shape'` (`model.ts:20`) — không có `'table'`. Xác nhận khớp nợ kỹ thuật PS-11 đã ghi trong `IF-MASTER-TREE.md` (2.3.16). | — | **Chưa có** |
| **Crop/xoay/lật ảnh** | 🟡 **Crop**: ✅ đủ dùng (xem hàng "Crop trong khung" ở trên — CÙNG cơ chế, không phải 2 thứ khác nhau). **Xoay (rotate)**: `Frame.rotation: number` tồn tại trong model (`model.ts:144`) và ĐƯỢC ÁP khi render (`Element.tsx`, `EditorCanvas.tsx:492` `transform: rotate(...)`) — nhưng grep toàn `components/present-editor/` cho thấy **KHÔNG có UI/gesture nào set giá trị này** (mọi nơi khởi tạo đều `rotation: 0` cố định, `PresentEditor.tsx:309,314,873,1963`) → trường tồn tại nhưng ĐỨNG YÊN, không dùng được thật. **Lật (flip/mirror)**: grep `flip\|mirror` trên CẢ Present LẪN Photo-editor = **0 kết quả** — hoàn toàn không có ở đâu trong app. | Present (crop) / KHÔNG NƠI NÀO (xoay/lật) | **Hỗn hợp** — crop đủ dùng; xoay chỉ có khung (field chết); lật hoàn toàn chưa có, kể cả ở Photo-editor (bất ngờ cho 1 tool marketing "gần Photoshop") |
| **Sáng/tương phản/nhiệt độ (+bão hoà)** | 🟡/✅ 2 tầng chất lượng khác hẳn nhau: **Present** — `ImageAdjust{brightness,contrast,saturate,temperature}` (`model.ts:113-119`), áp qua 1 chuỗi CSS `filter` đơn giản (`adjustToCssFilter()`, `model.ts:488-499` — nhiệt độ chỉ là `sepia()`/`hue-rotate()` xấp xỉ, không phải color-science thật). **Photo-editor** — `AdjustPanel.tsx` đầy đủ: exposure + brightness + contrast + saturation + temperature + tint + black/white point + gamma + hue-shift + **curve editor** (đường cong luminance kéo tay), non-destructive (adjustment layer riêng, composite lại khi đổi), có preset grade. | Present (🟡 thô sơ) · Photo-editor (✅ đủ dùng) | **Thô sơ ở Present, đủ dùng ở Photo-editor** — 2 công cụ khác hẳn tầm, không nên gộp chung 1 dòng đánh giá nếu bàn tới "sản phẩm" nói chung |

---

## Kết luận — 3 nhóm

### ✅ ĐÃ ĐỦ (đủ dùng, không cần làm thêm để coi là "xong")
1. Bo góc ảnh
2. Crop trong khung (= crop ảnh, gộp chung với mục 18)
3. Độ trong suốt
4. Căn chỉnh (align)
5. Phân bố đều (distribute)
6. Text tracking/leading/tràn viền (viền chữ)
7. Sáng/tương phản/nhiệt độ — **chỉ đúng ở Photo-editor**, KHÔNG đúng ở Present (xem nhóm THÔ)

### 🟡 CÓ MÀ THÔ (tồn tại thật, nhưng thiếu/hẹp/khác spec đáng kể)
1. Gradient — có cho chữ (đủ), có cho shape (chỉ opacity-fade, không phải màu), KHÔNG có cho ảnh
2. Blend mode — CHỈ có cho chữ, không có ảnh/shape
3. Nhân bản có căn — chỉ offset cố định 2%/2%, không phải smart-duplicate thật
4. Layer nhóm — thứ tự/khoá/ẩn đủ dùng, "nhóm" thiếu hẳn (1/4 gap trong 1 dòng spec)
5. Đổ bóng — CHỈ có cho chữ, không có ảnh/shape
6. Crop/xoay/lật ảnh — crop đủ dùng, xoay có field nhưng KHÔNG có UI (chết), lật không có
7. Sáng/tương phản/nhiệt độ ở **Present** (Photo-editor thì đủ dùng — xem nhóm ĐỦ)

### ⬜ THẬT SỰ CHƯA CÓ (0 bằng chứng trong code)
1. Mask ảnh (theo hình tuỳ ý)
2. Overlay (lớp màu/ảnh phủ riêng)
3. Khoá tỉ lệ (lock aspect ratio)
4. Làm mờ (blur filter trên nội dung)
5. Pattern real-world scale (tiling mm + xuất tile)
6. Bảng số liệu (data table element)
7. Lật ảnh (flip/mirror) — **ở CẢ Present lẫn Photo-editor**

---

## Phát hiện đáng chú ý (ngoài phạm vi 19 món, ghi lại để không quên)

- **"Xoay ảnh" là field chết** — `Frame.rotation` tồn tại trong model và được RENDER đúng nếu có
  giá trị, nhưng không có bất kỳ UI/gesture nào trong `components/present-editor/` từng SET giá
  trị khác 0. Đây là ví dụ "chỉ có khung" điển hình — khác với "chưa có" (0 bằng chứng gì) và
  khác với "thô sơ" (có dùng được, chỉ hẹp/thiếu).
- **Photo-editor không có rotate/flip** — bất ngờ vì đây là tool được định vị "gần Photoshop"
  (`SPEC-EDITOR-TOOLKIT.md`, xem `IF-MASTER-TREE.md` 2.1.10.c) nhưng thiếu 2 thao tác ảnh cơ bản
  nhất (xoay 90°, lật ngang/dọc) mà hầu như mọi tool ảnh — kể cả ứng dụng xem ảnh miễn phí — đều
  có.
- **4 món (blend/shadow/gradient-màu) chỉ có cho TEXT** — không phải ngẫu nhiên rải rác, đây là
  MỘT khoảng trống có hình dạng rõ: hệ `TextFx` (`text-fx.ts`) được đầu tư kỹ hơn hẳn phần
  ảnh/shape. Nếu coi "một canvas engine dùng chung" (`IF-MASTER-TREE.md` 2.1.10.c) là mục tiêu,
  đây là bằng chứng cụ thể engine CHƯA thật sự dùng chung — text có bộ hiệu ứng riêng, ảnh/shape
  có bộ field riêng, không chia sẻ 1 lớp "effects" chung.

---

*v1.0 · 2026-07-28 · Khám code trực tiếp (Read+Grep), không dựa lời spec. Thuần khám — không sửa
`SPEC-EDITOR-TOOLKIT.md`, không sửa code. Quyết định dựa trên khám này ghi ở `IF-MASTER-TREE.md`.*
