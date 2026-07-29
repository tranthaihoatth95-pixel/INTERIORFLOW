# SPEC TỔNG — phiên Cowork 29/07/2026 → giao Claude Code

> Gộp toàn bộ phiên. Mọi kết luận đã đối chiếu code thật trên máy Hoà (Luật #4). Phần nào là
> **ĐỀ XUẤT** đều ghi rõ. Claude Code **kiểm tra trùng mã** trong `docs/IF-FEATURE-TREE.md` trước
> khi dán.
>
> **Đọc theo thứ tự**: §1 (phát hiện, quyết định mọi thứ khác) → §2 (luật) → §3 (bảng việc) →
> §4-8 (chi tiết từng mảng).

---

# §1 · SÁU PHÁT HIỆN LÕI — nền của mọi việc bên dưới

| # | Phát hiện | Bằng chứng | Hệ quả |
|---|---|---|---|
| **1.1** | **IF có 45 node, Tool Mode chỉ lộ 6 (13%)** | đếm `lib/nodes/` : 20 `ai.` · 5 `input.` · 11 `util.` · 3 `out.` · 3 `slide.` · 2 `three.` · 1 `render.`; `lib/render-studio/task-cards.ts` ánh xạ 6 | Vấn đề chặng 2 **không phải thiếu tính năng** mà là **thiếu mặt tiền**. Mọi việc UI bên dưới xuất phát từ đây |
| **1.2** | **`three.cad2fbx` — cầu CAD→Render, 0 credit, 100% tất định, đang vô hình** | `lib/nodes/defs/render-v2.ts:231-237`: *"Đọc bản vẽ chặng 1 (tường WALL + block nội thất) → dựng khối 3D **đúng kích thước thật**, xuất OBJ/MTL; nút Xuất FBX qua Blender local"* | **Thứ khác biệt nhất IF có so với mọi app AI**. Phải lộ ra mặt tiền, ưu tiên cao |
| **1.3** | **Cơ chế giao diện chung ĐÃ CÓ — `ParamDef`** | `lib/types.ts:9-25` union 9 kiểu (`text·select·slider·image·mask·smartmask·sketch·annotate·corners`); `ToolModeForm.tsx:152-156` render tổng quát bằng `editableParams.map(…)` | **Không phát minh cơ chế mới.** Chỉ thêm 3 trường bày biện và viết thêm renderer |
| **1.4** | **Rule engine đạt chuẩn ĐÃ CÓ — ở chặng 1** | `lib/cad/standards/` 17 file: `checker.ts` (`Violation{ruleId·source·severity·category·message·verified·at}`), `registry.ts`, `fix-suggest.ts`, 9 bộ luật VN+quốc tế | Cơ chế "chấm điểm trước khi xuất" cho chặng 2-3 là **mở rộng cái này**, không xây mới |
| **1.5** | **Cộng tác: đồng bộ "ai ở đâu" nhưng KHÔNG đồng bộ "ai sửa gì"** | `components/collab/LiveCursors.tsx` (69d, viết tốt) + `PresenceBar.tsx` (85d) + `ChatPanel.tsx` polling 3s — nhưng **không có** đồng bộ `nodes`/`edges`/`params` | Con trỏ đang **hứa thứ hệ thống không giao được**. Lỗi tin cậy, phải xử lý ngay |
| **1.6** | **Đang xuất ~116 dpi, cần ≥300** | A3@300dpi = 4961×3508 (`stage-presets.test.ts:60`); ảnh AI max ~1344px, composite ~1920px (`StagePresetPanel.tsx:13`); 2 nút "In 300dpi" **đang bị khoá** (`RenderIOMenus.tsx:140`, `Toolbar.tsx:143`) | `ai.upscale` ×4 = 5376px → **thừa sức**. Vấn đề là quy trình xuất chưa bắt buộc đi qua |

### Đính chính 2 chỗ Cowork nói sai giữa phiên

- ~~"Đa góc nhìn nhất quán — THIẾU"~~ → **SAI**, `three.camera` đã có (`render-v2.ts:203-209`, preset tầm mắt/góc rộng/cận vật liệu/trên cao, 0 credit). Thiếu là **cách đóng gói**, không phải năng lực.
- ~~"Sửa phối cảnh — thiếu"~~ → **SAI**, `util.warp` = *Perspective Warp (4 góc)* đã có.

→ **Chỉ còn ĐÚNG 1 khoảng trống năng lực thật: bộ map PBR** (normal/roughness/AO/height).

---

# §2 · PHẦN E — LUẬT VẬN HÀNH, trạng thái cuối phiên

Dán đè khối này vào `docs/IF-FEATURE-TREE.md` PHẦN E. Giữ 5 luật gốc 28/07 bên trên làm lịch sử.

| # | Luật | Trạng thái |
|---|---|---|
| 1 | Mã bắt buộc trước khi code | ~~BÃI BỎ~~ 29/07 |
| 2 | Ý mới qua `IDEAS-BACKLOG.md` trước | ~~BÃI BỎ~~ 29/07 |
| 3 | Cây chỉ mở rộng khi hết pha | ~~BÃI BỎ~~ 29/07 |
| **4** | **Cột "Code" là sự thật duy nhất** | **GIỮ — LUẬT CỨNG.** Mọi "đã xong" phải đối chiếu `file:dòng` |
| **5** | **KHÁM → TƯ VẤN → SPEC → CODE** | **GIỮ** (đổi "QUYẾT"→"TƯ VẤN", không còn là cổng chặn) |
| **6** | **Luật Đồng Bộ** | Tính năng gần giống / là hệ quả của nhau → **phải đề xuất GỘP**, không để tồn tại rời rạc |
| **7** | **Luật đọc ảnh — 2 lớp giá trị** | Ảnh Hoà gửi phải tách rõ **(a) giá trị TÍNH NĂNG** và **(b) giá trị GIAO DIỆN**, rồi nói rõ **NÊN LẤY gì / NÊN TRÁNH gì** cho IF |
| **8a** | **Checklist 6 bước = định nghĩa "xong"** | **BÀN → APPROVE → CODE → XÁC NHẬN → COMMIT → GIT.** Thiếu bước nào thì ghi 🟡, **không được ghi ✅** |
| **8b** | **Luật xếp hàng gia phả** | Mỗi tính năng mới: ① gắn mã đúng khối ② **kiểm tra phụ thuộc** — làm sớm có phải đập đi làm lại không ③ xếp vào sprint; **SPEC và CODE được phép ở 2 sprint khác nhau** |
| **9** | **Luật ≥300 dpi** *(mới 29/07)* | Mọi sản phẩm **giao khách hoặc in** phải ≥300dpi ở khổ đích: A3 ≥4961×3508 · A4 ≥3508×2480 · A5 ≥2480×1754. Sản phẩm chỉ xem màn hình (16:9) được miễn **nhưng phải ghi nhãn "độ phân giải màn hình"**. Nút xuất phải **hiện dpi thật**; không đạt thì **không im lặng xuất bừa, cũng không khoá cứng** — báo số và mời nâng cấp |

---

# §3 · BẢNG VIỆC TỔNG — mọi mã đề xuất, đã xếp hàng theo Luật 8b

## Sprint 1 — đang chạy, CHEN THÊM 4 việc rẻ mà quan trọng

| Mã | Việc | Vì sao chen |
|---|---|---|
| *(đang chạy)* | license page · CI gate · `.ifpack` auto-backup · 4 item Bảng Tổng 3 | — |
| **`2.2.60`** | **Sửa tràn khung thanh đầu** — xem §4.1 | **Lỗi chặn thao tác**, không phải việc đẹp-xấu: ở 1183px nút *Chạy flow* + avatar **văng khỏi màn** |
| **`2.2.61`** | **Dời `AiTierMenu` vào Cài đặt** — xem §4.2 | Cùng file `Header.tsx` với 2.2.60 → Luật Đồng Bộ |
| **`2.2.75`** | Sửa `lib/imaging.ts:61` board → **4961×3508** + sửa chú thích sai *"A4 300dpi-ish"* (thực tế 212dpi) | 1 dòng số, đang ghi sai chuẩn ngay trong code |
| **`7.24`** | **Chốt A hay B cho `LiveCursors`** — xem §7.4 | Lỗi **tin cậy**, sửa bằng 1 cờ |

## Sprint 2 — Present UX (mới)

| Mã | Việc |
|---|---|
| `2.3.30-2.3.42` | Toolkit thiếu: gradient cho shape/ảnh · mask tự do · group · blur · khoá tỉ lệ · flip |
| `2.3.58` | **Gộp Photo-editor vào Present** — bỏ round-trip tab mới + localStorage, nhúng `AdjustPanel`/`LayersPanel` làm panel phụ cùng app-shell |
| `2.3.59` | **Tách `GenerateFlow` khỏi tab "Mẫu"** thành lối vào riêng — AI và tự-chỉnh phải nhìn ra ngay |
| `SPEC 2.3.60` | Viết SPEC catalogue→template→batch export (**chưa code**) |

## Sprint 3 — nền giao diện chặng 2 · thứ tự trong sprint là BẮT BUỘC

| Thứ tự | Mã | Việc |
|---|---|---|
| ① | **`2.2.77`** | **Bịt 2 lỗ rò dữ liệu** — xem §5.1. *Xây bento lên nền rò rỉ thì phải xây lại* |
| ② | **`2.2.69`** | **Quy chuẩn thoại 5 luật** + đổi tên 45 node + 4 tên nhóm — xem §6.3. *Mọi màn sau đều hiện tên này* |
| ③ | **`2.2.65`** | `lib/products.ts` — 1 danh mục sản phẩm đầu ra **dùng chung chặng 2 + 3** — xem §5.4 |
| ④ | **`2.2.78`** | Mở rộng `ParamDef`: `span` · `group` · `advanced` + gán cho 45 node |
| ⑤ | **`7.23`** | Nâng `Violation`/`Severity`/`registry` từ `lib/cad/standards/` → **`lib/standards/`** dùng chung 3 chặng |
| ⑥ | `2.2.71` | Trường `group` 4 nhóm + màn chọn **bố cục cross** — xem §6.1 |
| ⑥ | `2.2.70` | Hệ minh hoạ nét — 45 bìa SVG, ưu tiên 24 thẻ hay dùng — xem §6.2 |
| ⑥ | `2.2.79` | Renderer Tool Mode **3 dải màn** — xem §5.2 |
| ⑥ | `2.2.80` | **Pill nổi switch mode riêng chặng 2** — xem §5.3 |
| ⑥ | `2.2.81` | Bộ 11 phím/chuột Node Mode — xem §5.2 |
| ⑦ | `2.2.72` | **Lộ `three.cad2fbx` + `three.camera` ra mặt tiền** ⚑ ưu tiên cao (§1.2) |
| ⑦ | `2.2.66` `2.2.67` | Gói combo kéo-thả + **3 trạng thái thẻ** — xem §5.5 |
| ⑦ | `2.3.61` `3.30` | Màn chọn đầu chặng 3 (6 ô, ô thứ 6 = Kho mẫu) — xem §5.6 |
| ⑦ | `7.20` | **Lấp đầy tầng 3 chỉ dẫn**: nối 45 `description` vào `coachmarkSeen` — xem §7.1. *Rẻ nhất, giá trị cao nhất* |
| ⑦ | `2.2.84` | Vitals visual mới — xem §8 |

## Sprint 4 — audit Render (điều kiện Q7 đã chốt)

KHÁM toàn bộ tool Render đối chiếu code thật, theo đúng phương pháp `AUDIT-EDITOR-TOOLKIT.md`.
**Không được chỉ audit 3 tool đắt** — đây là điều kiện Hoà đã chốt ở Q7.

## Sprint 5 — SPEC+CODE tool Render · `2.2.16-2.2.21` + phần còn lại, dựa trên audit Sprint 4

## Sprint 6

`2.2.76` tự chèn upscale ×4 vào đường xuất in + hiện dpi thật + mở khoá 2 nút "In 300dpi" ·
`2.3.62` tách sân khấu làm-việc / sân khấu xuất ở Present ·
`2.3.63` **preflight chặng 3** (§7.5) · `2.2.82` preflight chặng 2 + **SSIM/LPIPS đo lệch bố cục** ·
`2.2.68` nâng `out.board` thành node xuất thật (nhúng `AdjustPanel` + chọn định dạng/DPI/khổ) ·
`7.25` **ghim góp ý** · `7.26` khoá mềm "ai đang mở" · `7.21` chỉ dẫn theo hành vi ·
`7.22` Vitals trả lời "làm sao để…" · `3.31` nội dung kho mẫu đợt 1 · `2.2.73` Gallery công thức ·
`2.2.74` chia sẻ gói `.ifpack`

## Sprint 7 — BOQ `2.1.9.p` (thêm field `matId`) · NT1 → NT5 Pha 1 → `4.18` Gateway/IOMenu · **CODE `2.3.60`**

## Sprint 8 — NT5 Pha 3+4 · DWG server-side migration

## Backlog / khuyến nghị KHÔNG làm

`2.2.63` bộ map PBR (đắt, cần provider mới) · `2.2.64` đóng gói bộ đa góc nhìn ·
`7.27` CRDT Yjs (**chỉ khi Tầng 1-2 cộng tác đã dùng thật mà vẫn thiếu**) ·
Video/Film Present [v2] ·
❌ **Điểm số thẩm mỹ AI (NIMA/CLIP-IQA) — khuyến nghị KHÔNG làm**, không đủ tin cậy để đặt trước
mặt người làm nghề · ❌ **Không mở hệ extension cho bên thứ ba** — bậc L trong khi bậc N chưa xong

---

# §4 · SỬA GẤP — thanh đầu

## 4.1 · `2.2.60` Tràn khung

**Gốc lỗi, 3 tầng cộng dồn:**

1. `Header.tsx:49` — `flex ... gap-2` **không `overflow-hidden`, không `flex-wrap`**
2. `Header.tsx:90` — tên flow là phần tử **duy nhất** co được (`max-w-28 shrink truncate`) → co hết còn 1 chữ
3. `Header.tsx:101·106·111·118·130` — PhaseSwitcher · UploadButton · RenderIOMenus · AiTierMenu · Chạy flow đều `shrink-0`; spacer `min-w-2 flex-1` (d.122) sập còn 8px

**Nghịch lý phải sửa**: breakpoint chạy **ngược chiều** — `RenderIOMenus` (d.111) và tên engine
(d.530) chỉ hiện **từ `lg` (1024px)**. Càng rộng càng **bồi thêm** vào thanh đã chật. 1183px của Hoà
rơi đúng giữa dải đó.

**Sửa:**
- Gộp *Thêm vào canvas* + *Mở tệp* + *Xuất* → **1 menu "Tệp"**
- Nhãn `— 02 · RENDERING` rút còn `02`
- Áp **priority+ overflow** (PatternFly): **Chạy flow + avatar khoá cứng bên phải, KHÔNG BAO GIỜ bị đẩy ra**; mọi thứ khác tự chui vào `⋯` khi hẹp
- Thêm `overflow-hidden` + `min-w-0` cho header

## 4.2 · `2.2.61` Dời AiTierMenu vào Cài đặt

`Header.tsx:117-120`, thân 496-640. Đây là **cấu hình toàn cục** (`aiTier`/`oneAiEngine`/
`oneAiRuntime` ở store, áp cả 3 chặng, popover `w-72` 3 tầng lồng), không phải nút thao tác. Nó
chiếm ~180px thanh đầu chỉ để hiện trạng thái.

→ Chuyển toàn bộ vào Cài đặt. Thanh đầu giữ **1 chấm trạng thái nhỏ, chỉ hiện khi bất thường**
(logic `avail === false` đã có ở `Header.tsx:509,531`). Ai cần đổi engine cho 1 việc thì đổi trong
hàng "Nâng cao" của chính thẻ việc đó.

---

# §5 · CHẶNG 2 — kiến trúc giao diện

## 5.1 · `2.2.77` Hai lỗ rò dữ liệu (làm TRƯỚC mọi việc UI khác)

**Đã đúng**: `RenderToolModeOverlay.tsx:4-8` giữ canvas mounted, không remount;
`ToolModeForm.buildOrUpdateGraph()` (d.54-69) dựng **node thật**, chạy qua `runNode()` cùng đường
với canvas — *"KHÔNG có luồng giả riêng"*.

**Lỗ rò 1** — `ToolModeForm.tsx:33-39`: đổi `cardId` là `setImageDataUrl(null)` → **ảnh vừa thả bay
mất**. Sửa: ảnh + tham số lên **store dùng chung**, không nằm ở `useState` cục bộ; đổi thẻ chỉ đổi
**node AI đích**, giữ nguyên node ảnh nguồn.

**Lỗ rò 2** — Tool Mode → canvas ✅ nhưng canvas → Tool Mode ❌. Sửa: nếu graph khớp mẫu
`input.image → 1 node ai.*` thì mở đúng thẻ đó dạng form; graph phức tạp hơn thì hiện
*"Flow này có N node — Tool Mode chỉ hiện được 1 việc, mở canvas để xem đủ"*, **không im lặng hiện
màn trắng**.

**Ghi thành luật + test**: chuyển giao diện **không bao giờ** được xoá dữ liệu.

## 5.2 · `2.2.78/79/81` Một schema, ba dải màn

**Hai trục ĐỘC LẬP — không được trộn:**
- **Giao diện** (Bảng việc ⇄ Canvas) = **người dùng chọn**, nhớ qua localStorage
- **Dải màn** = **máy nhận**, chỉ quyết định **mật độ và cách nhập liệu**

| Hạng mục | < 8" ngón tay | 8"–laptop/tablet lớn | Desktop màn lớn |
|---|---|---|---|
| Cột | 1 | 2 | **3** — điều khiển trái, ảnh xem trước lớn |
| Vùng chạm | ≥44px | **≥44px** | **≥44px** (KHÔNG thu nhỏ) |
| Hover · tooltip · chuột phải | không | **có** | **có** |
| Phím tắt | không | **đủ** | **đủ** |
| Node Mode | **khoá** (`useIsSmallScreenForCanvas()` đã có) | mở | mở |

**Bất biến qua cả 3 dải:** vùng chạm ≥44px · cùng một `ParamDef` → **không dải nào thiếu tính
năng** · mọi việc làm được bằng chuột phải/hover **đều phải làm được bằng nút hiện sẵn** · nút chạy
luôn kèm **giá credit + độ phân giải đầu ra**.

**`ParamDef` thêm 3 trường tuỳ chọn** (thiếu thì rơi về mặc định, không phá node cũ):
`span?: 1|2|4` · `group?: string` · `advanced?: boolean`

**`2.2.81` — 11 phím/chuột Node Mode**: Space+kéo (kéo màn) · con lăn (zoom) · ⇧1 (vừa màn) ·
kéo khoanh vùng + ⇧click (chọn nhiều) · Delete · ⌘D (nhân bản) · ⌘Z / ⌘⇧Z · ⌘↵ (chạy node) ·
⌘⇧↵ (chạy flow) · Tab hoặc chuột phải (thêm node) · ⌘\\ (đổi giao diện).

> **Luật ngầm bắt buộc** — theo mẫu `CadTouchDock` (`CadCanvas.tsx:2113`, cầu *"nút = phím"*):
> mọi phím tắt phải gọi **đúng lớp lệnh** mà nút cảm ứng gọi. **Một lớp lệnh, hai cách gọi.**

## 5.3 · `2.2.80` Pill nổi switch mode — KHÔNG đụng thanh đầu

Tiền lệ: `CadToolbar.tsx` là *"Thanh công cụ **NỔI dạng pill** — liquid-glass, bo tròn"*, và
`ModeSwitch` nằm **bên trong pill đó** (d.243), **không ở `Header.tsx`**.

→ Tạo pill nhỏ cùng ngôn ngữ liquid-glass (`backdrop-filter: blur(18px) saturate(1.4)`), chứa
**đúng 1 thứ**: `▦ Bảng việc ⇄ ⁂ Canvas`, phím `⌘\\`, đặt **góc dưới-trái** vùng làm việc (tránh
Vitals ở giữa và tên dự án ở trái đáy).

**Đây là phép TRỪ**: pill thay thế 2 điều khiển đang có — link *"Mở canvas (nâng cao) →"*
(`ToolModeHome.tsx:103-121`) và nút *"Mở canvas ▾"* (`ToolModeForm.tsx`). Hai cái này trùng chức
năng, khác kiểu, **chỉ đi 1 chiều**. → **Thanh đầu không thêm gì, tổng số điều khiển giảm 1.**

Mặc định lần đầu chọn theo `pointer: fine/coarse`, sau đó **tôn trọng lựa chọn người dùng**.

## 5.4 · `2.2.65` `lib/products.ts` — một danh mục, hai mặt tiền

Chặng 2 có "gói combo = 1 sản phẩm đầu ra"; chặng 3 có "chọn loại file cần tạo". **Phải là CÙNG
MỘT DANH SÁCH**, nếu không 3 tháng nữa chúng lệch nhau.

Mỗi mục khai báo: tên · khổ mặc định · gói node (`DemoModule`) dựng ra nó · template Present tương ứng.

| Sản phẩm | Gói node chặng 2 | Khổ chặng 3 |
|---|---|---|
| Board concept / moodboard | guref → moodboard → out.moodboard | A3 ngang |
| Bộ ảnh phương án (3 option) | input → sketch2render → batchvariants → out.board | 16:9 |
| Hồ sơ trình bày khách | input → render → relight → upscale → out.board | A3 dọc |
| Spec sheet nội thất | furnitureextract → removebg → materialnote → out.board | A4 dọc |
| Bảng vật liệu | guref → palette → pattern → out.moodboard | A4 ngang |
| Ảnh in khổ lớn | input → render → upscale → out.board | A3 · 300dpi |

## 5.5 · `2.2.66/67/68` Gói combo node

**Ba mảnh đã có, chỉ cần ghép** (Luật #6):
- Gói node = **`DemoModule`** (`lib/demos/_shared.ts:38-41` + 4 gói `sketch·clay·concept·present`)
- Node xuất = **`out.board`** (`registry.ts:952-962`, *"Export Board — ghép tối đa 4 output, tải PNG/PDF"*)
- Tool chỉnh sáng-màu = **`AdjustPanel`** (`components/photo-editor/AdjustPanel.tsx:7,48-54` — Phơi
  sáng · Độ sáng · Tương phản · Bão hoà · Nhiệt độ · White Balance · Levels · Hue · mini-Curves)

**`2.2.66`** — `loadDemoFlow()` (`store.ts:656`) hiện **thay thế toàn bộ canvas**. Đổi thành
**merge theo điểm thả** (build() đã trả `{nodes,edges}` có toạ độ — chỉ cần cộng offset).

**`2.2.67` — phần THIẾU HẲN và giá trị cao nhất**: 3 trạng thái thẻ trong gói vừa bung

| Loại thẻ | Hiện gì |
|---|---|
| **Cần import** | viền đứt + *"Thả ảnh vào đây"* |
| **Cần điền chữ** | ô chữ nhấp nháy nhẹ + placeholder gợi ý sẵn |
| **Đã đủ, chỉ Start** | nút ▶ sáng, sẵn sàng |

\+ **1 nút "▶ Chạy cả gói"** — chạy tuần tự theo dây, bỏ qua thẻ chưa đủ dữ liệu và **báo rõ thẻ nào
còn thiếu**. Đây là thứ biến một đống node thành **phiếu điền vào chỗ trống**.

**`2.2.68`** — `out.board` mới làm được 60%: thiếu ① nhúng `AdjustPanel` (không viết slider mới)
② chọn định dạng PNG·JPG·PDF·WebP + **DPI** + **khổ giấy** (dùng lại `stage-presets.ts`) ③ bỏ giới
hạn 4 ảnh.

## 5.6 · `2.3.61` + `3.30` Màn chọn đầu chặng 3

**Khám**: 5 khổ đã có (`StagePresetPanel.tsx:6-7`: 16:9 · A4 ngang/dọc · A3 ngang/dọc) nhưng **lối
vào sai chỗ** — là nút trên toolbar (`Toolbar.tsx:198`), phải vào trong trình sửa mới chọn được.
Màn trống chỉ là 1 dòng chữ (`PresentEditor.tsx:1644`). Hệ quả: dàn xong 7 trang 16:9 mới biết khách
cần in A3 dọc.

**Quy luật chung**: chặng 2 và 3 cần **cùng một thứ** — màn chọn đầu chặng, chỉ khác trục chọn
(việc / khổ giấy). → Làm **1 component dùng chung `StageEntryScreen`**, không viết 3 lần.

**6 ô**: 16:9 · A4 ngang · A4 dọc · A3 ngang · A3 dọc · **Kho mẫu** (ô thứ 6, khác màu, dẫn sang
Thư viện lọc sẵn nhóm Template).

**Tự nhận khổ khi vào từ ▶ Chạy flow** — không hỏi lại:

| Tín hiệu đã có | Suy ra |
|---|---|
| tỉ lệ ảnh render (16:9 / 3:2 / 4:3) | 16:9 → trình chiếu; 3:2·4:3 → A4/A3 ngang |
| đích xuất đã chọn ở Render (`Toolbar.tsx:139` đã có mục PDF in 300dpi) | chọn PDF in → A3/A4 |
| số ảnh trong lượt chạy | 1 → trang bìa; nhiều → board nhiều trang |

Tự đoán **có thể sai** → luôn hiện 1 dòng đổi được trên đầu trình sửa: *"Đang dùng **A3 dọc** —
đổi khổ"*. **Không bắt quay lại màn chọn.**

**`3.31` Kho mẫu — 4 nhóm**: Hồ sơ thiết kế (A3·A4) · Văn phòng·Giấy tờ (A4) ·
**Tem nhãn·Bảng mẫu** (tem 40×25 / 70×37mm, in nhiều tem/tờ A4) · Trình bày (16:9·A3).

> **Nhóm "Tem nhãn · Bảng mẫu" là nhóm khác biệt nhất** — không app trình bày nào có, vì nó là nhu
> cầu riêng nghề nội thất (dán tem lên bảng mẫu vật liệu giao khách). **Đây là thứ khiến kho mẫu IF
> không thể thay bằng Canva.**

**3 luật kho mẫu**: ① sửa được, là `EditorSlide` thật, không phải ảnh chết ② **tự ăn theo phong cách
+ Nhận diện** qua `TemplateContext.palette/fonts` (`templates.ts:29-37`) — chọn 1 mẫu là **tự đổi
màu theo brand**, Canva không làm được ở mức này ③ có mã trong Library như mọi asset.

> ⚠️ **Bản quyền**: kho mẫu "tuyển chọn đẹp" rất dễ chép bố cục có bản quyền. `SPEC-IF-LIBRARY.md`
> đã có mục giấy phép — **mọi mẫu phải ghi rõ nguồn + giấy phép**, tự vẽ hoặc nguồn tự do. Không
> ngoại lệ, vì đây là thứ đem giao khách.

---

# §6 · CHUẨN THIẾT KẾ

*(Chi tiết đầy đủ ở `docs/IF-DESIGN-STANDARD-2026-07-29.md` — Claude Code đọc file đó trước khi vẽ
bất kỳ giao diện nào. Dưới đây là phần bắt buộc.)*

## 6.1 · `2.2.71` Bốn nhóm, bố cục cross

Chia theo **thứ tự nghề**, không theo loại kỹ thuật. Giữ `category` cũ trong code (máy dùng), thêm
trường **`group`** mới (người dùng thấy).

| | Nhóm | Câu hỏi người dùng đang hỏi | Số node |
|---|---|---|---|
| 01 | **Ý TƯỞNG · Ideate** | "Làm theo gu gì?" | 8 |
| 02 | **DỰNG · Build** | "Ra ảnh đầu tiên bằng gì?" | 9 *(gồm `three.cad2fbx`, `three.camera` ⚑)* |
| 03 | **SỬA · Refine** | "Chưa ưng chỗ nào?" | 11 |
| 04 | **XUẤT · Deliver** | "Giao khách thế nào?" | 15 |

*(2 node video để riêng — đã hoãn [v2] theo Q5.)*

**Bố cục cross**: 4 ô ở 4 góc, **chữ thập là 2 đường hairline thật**, giữa giao điểm là **ô phong
cách đang áp**. Cross nói đúng điều mà 4 cột nói sai: **phong cách là trục xoay, 4 nhóm là 4 hướng,
không phải 4 bước tuần tự** (thực tế Hoà nhảy qua lại Dựng↔Sửa hàng chục lần). Màn <820px: xếp
thành 1 cột, ô phong cách lên đầu và dính khi cuộn.

**Ô giữa cố ý KHÔNG có nhãn.** Gọi nó là "Thẻ Gu" thì người dùng thường không hiểu — đặt một từ khó
hiểu ngay giữa màn là phản tác dụng. Để **nội dung tự nói**: 4 ô màu + *travertine · sồi · đồng* +
*Tối giản ấm, Á Đông · 12 ảnh tham chiếu*. Bên dưới vẫn là `input.guref` (`gu-reference.ts:2-6`,
0 credit). **Tên trong code giữ nguyên `GuProfile`; chỉ nhãn người dùng thấy là đổi.**

**Danh sách dưới mỗi nhóm**: dòng gần icon rõ nhất, **chìm dần vào nền**, cuộn được, không thanh
cuộn — `mask-image: linear-gradient(180deg,#000 0,#000 24%,rgba(0,0,0,.55) 58%,rgba(0,0,0,.16) 88%,transparent 100%)`
\+ `scrollbar-width:none`. Mask **neo vào khung**, không neo vào nội dung.

**Bỏ khung**: không viền quanh ô nhóm, không nền sau icon, không hộp quanh từng dòng. Khoảng trắng
và hairline làm việc phân vùng.

## 6.2 · `2.2.70` Hệ minh hoạ nét

| Hạng mục | Quy định |
|---|---|
| Kỹ thuật | SVG inline, `stroke-width:1.5`, `fill:none`, màu bằng token → tự theo sáng/tối |
| Màu | nét chính `--t2` · nét phụ `--t4` · **đúng 1** điểm `--accent` cho phần "AI làm gì" |
| Nội dung | Vẽ **phép biến đổi**, không vẽ căn phòng đẹp |
| Khung | **không có** |
| Cấm | không gradient · không bóng · không icon mua sẵn · không hình bo tròn đều nhau |

| Nhóm | Hình | Ghi chú |
|---|---|---|
| 01 Ý tưởng | **ảnh xé dán chồng lệch góc + hàng swatch** | ~~vòng tròn lồng nhau~~ là **biểu đồ Venn / lý thuyết màu**, sai tinh thần moodboard |
| 02 Dựng | khối hộp phối cảnh + chấm máy ảnh, nét đứt từ bản vẽ | |
| 03 Sửa | khung ảnh + vùng chọn nét đứt + con trỏ + thanh trượt | |
| 04 Xuất | nhiều tờ xếp lớp + mũi tên ra | |

**Vì sao nét vẽ chứ không ảnh thật**: 45 node × ảnh trước/sau = 90 tấm phải chụp/render, và đổi
model là lỗi thời · ảnh thật **dạy sai** (tưởng đó là kết quả sẽ nhận) · nét đọc được ở 90px ·
**là bản sắc** — mọi app AI 2026 đều dùng ảnh mẫu bóng bẩy giống nhau.

## 6.3 · `2.2.69` Quy chuẩn thoại — 5 luật, áp cho cả 45 node

**Vấn đề đo được**: 45 `title` hiện chạy **4 quy ước song song** — thuần Anh (~25: `Batch Variants`,
`Empty Room Staging`, `Relight`…) · thuần Việt (3) · Việt-Anh trộn trong ngoặc (~8:
`Pattern Studio (hoa văn)`, `ID Mask (phân vùng)`…) · mũi tên (~5). Ca tệ nhất:
**`So sánh model (xịn)`** — "xịn" là tiếng lóng, không dịch được.

| # | Luật | Trước | Sau |
|---|---|---|---|
| 1 | **Việt dẫn · Anh theo**, ngăn bằng `·` | `Empty Room Staging` | `Phòng trống → Bày đồ · Empty Room Staging` |
| 2 | Node biến đổi dùng `→`, **hai vế cùng ngôn ngữ** | `Clay → Photoreal` | `Khối trắng → Ảnh thật · Clay to Render` |
| 3 | **Bỏ ngoặc giải thích** khỏi tên → đẩy xuống mô tả | `ID Mask (phân vùng)` | `Phân vùng ID · ID Mask` |
| 4 | **Cấm tiếng lóng / từ đánh giá** | `So sánh model (xịn)` | `So sánh model · Model Compare` |
| 5 | Tên là **việc người dùng làm**, không phải tên kỹ thuật | `BiRefNet v2` | `Cắt nền · Remove BG` |

**Vì sao giữ tiếng Anh**: người làm nghề tra cứu, xem YouTube, đọc ComfyUI đều bằng thuật ngữ Anh.
Bỏ hẳn tiếng Anh = cắt người dùng khỏi cả thế giới tài liệu. Bỏ hẳn tiếng Việt = người mới không
hiểu. **Song ngữ có thứ tự cố định** là cách duy nhất vừa dễ hiểu vừa global.

## 6.4 · Thang chữ · khoảng cách · bo góc — bắt buộc

**Chữ — 7 bậc, không hơn.** Chỉ **Be Vietnam Pro**, phân cấp bằng cỡ + sắc độ + tracking, **không
thêm typeface thứ hai** (Apple HIG).

| Bậc | px | Weight | Tracking |
|---|---|---|---|
| Display | 20 | 600 | −.02em |
| Title | 15 | 600 | −.01em |
| Body | 13 | 400 | 0 |
| Body nhấn | 13 | 500 | 0 |
| Caption | 11.5 | 400 | 0 |
| Micro | 10.5 | 500 | +.02em |
| Eyebrow (VIẾT HOA) | 9.5 | 700 | **+.10em** |

Số đo dùng `font-variant-numeric: tabular-nums`. Mỗi cụm **≤3 bậc sắc độ** chữ.

**Khoảng cách — bội số 4**: `4 · 8 · 12 · 16 · 24 · 32 · 48`.
**Luật gần-xa**: khoảng **trong** cụm phải nhỏ hơn khoảng **giữa** cụm **≥2 lần**.

**Bo góc — đúng 3 bậc**: `6px` điều khiển nhỏ · `10px` tấm/panel · `999px` pill. Không dùng 9/11/12/14.

**Vùng chạm ≥44×44px** ở **mọi** dải màn.

## 6.5 · Nền chấm màu — quyết định kỹ thuật, không phải sở thích

**ISO 3664** quy định môi trường quan sát để chấm màu phải là **xám trung tính**. Nền kem ấm
`#f2efe9` rất hợp chặng 3 (làm tài liệu, giấy in) nhưng **sai cho chặng 2** — nó hắt sắc ấm lên mắt,
làm mọi render trông ấm hơn thực tế, và người dùng sẽ chỉnh màu bù trừ theo một cái nền đang nói dối.

→ **Chặng 2 mặc định nền tối trung tính; chặng 3 giữ nền giấy ấm.**

## 6.6 · Danh sách kiểm — chạy trước khi trình BẤT KỲ giao diện nào

- [ ] Chỉ dùng 7 bậc chữ · 7 bậc khoảng cách · 3 bậc bo góc?
- [ ] Khoảng **trong cụm** < **giữa cụm** ≥2 lần?
- [ ] Mỗi cụm ≤3 bậc sắc độ?
- [ ] Màu nhấn xuất hiện ở **đúng 1 vai trò** (đang chọn / hành động chính)?
- [ ] Có **đúng một** điểm nhấn thị giác trên màn?
- [ ] **Nội dung (ảnh/dữ liệu) chiếm phần lớn diện tích, không phải điều khiển?**
- [ ] Đã thay viền hộp bằng khoảng trắng hoặc hairline ở mọi chỗ có thể?
- [ ] Vùng chạm ≥44px ở mọi dải?
- [ ] **Không còn nhãn spec/debug nào?**
- [ ] Số đo có `tabular-nums`?
- [ ] Nền chấm màu chặng 2 là xám trung tính?

---

# §7 · CHỈ DẪN · CHẤM CHUẨN · CỘNG TÁC

## 7.1 · `7.20/7.21/7.22` Hệ chỉ dẫn 5 tầng

**Khám**: IF đã có hệ 3 tầng, kiến trúc **đúng** (không hiện chình ình) nhưng **rỗng ruột** —
`resume.ts:227` nguyên văn: `export const COACHMARKS: readonly string[] = ['selectMove'];`
**Một coachmark duy nhất** cho app có 45 node · 3 chặng · 2 trình sửa. Và cả 3 tầng chỉ có **một
loại kích hoạt: "lần đầu nhìn thấy X"** — không có kích hoạt theo **hành vi**.

| Tầng | Kích hoạt | Trạng thái |
|---|---|---|
| 1 Chào (`tourDone`) | lần đầu vào app | ✅ chạy |
| 2 Vào chặng (`stageIntroSeen`) | lần đầu mở chặng | ✅ chạy |
| 3 Coachmark (`coachmarkSeen`) | lần đầu chạm 1 thao tác | 🟡 **có khung, 1 cái** |
| **4 Theo hành vi** *(mới)* | dừng ≥8s không thao tác · bấm Render lỗi 2 lần liên tiếp · thả file sai định dạng · mở node lần đầu | ❌ |
| **5 Tra cứu chủ động** *(mới)* | user tự hỏi | ❌ |

**Hai thứ tái dùng — không viết mới:**

**① `7.20` — 45 `description` đã viết sẵn = 45 bài chỉ dẫn.** Ví dụ nguyên văn `ai.pattern`:
*"Hoa văn cho vách · giấy dán tường · thảm · gạch · rèm. **Nối ẢNH MẪU vào input Reference để giữ
đúng motif (Chăm/Khmer/Đông Sơn…) — chỉ tả bằng chữ thì AI hay chệch sang mandala/damask.**"* → Đó
**chính là** nội dung coachmark tầng 3. Chỉ cần nối `description` vào `coachmarkSeen` sẵn có. Lấp
đầy tầng 3 từ 1 lên 45 với chi phí gần bằng 0.

**② `7.22` — Vitals làm HelpBar.** IF đã có Vitals là entry point AI duy nhất. **Đừng xây hệ help
thứ hai** — tầng 5 chính là Vitals, dạy nó đọc `docs/IF-FEATURE-TREE.md` + 45 description.

**4 luật "không chình ình"**: ① không bao giờ 2 lớp chỉ dẫn cùng lúc ② mọi thứ tự bật đều tự tắt
≤8s và có "Đừng nhắc nữa" ③ tầng 4 tối đa **1 lần/phiên/loại** ④ **không có checklist onboarding** —
người dùng IF là dân nghề, vào để làm việc thật.

## 7.5 · `2.3.63/2.2.82/2.2.83` Chấm chuẩn trước khi xuất

**Không thiết kế cơ chế mới** — mở rộng `lib/cad/standards/` (§1.4) sang chặng 2-3: cùng `Violation`,
cùng `severity`, cùng `verified`, cùng nút **bấm-nhảy-tới** (`at?: Pt`), cùng **điều khoản hiến
pháp** ghi ở `checker.ts`: *"CHỈ ĐỌC và TRẢ VỀ đề xuất — KHÔNG BAO GIỜ tự sửa."*

**Prior art để tra cứu**: **Preflight** (Acrobat · Enfocus PitStop · chuẩn PDF/X) — sát IF nhất ·
**Linter** (ESLint, Figma design lint) · **No-Reference IQA** (BRISQUE·NIQE·PIQE·MUSIQ·CLIP-IQA) ·
**Full-Reference** (SSIM·LPIPS) · **Brand check** (Canva).

**LUẬT QUAN TRỌNG NHẤT — tách 2 loại, đừng trộn:**

| | **Cổng cứng** (deterministic) | **Lời khuyên** (fuzzy) |
|---|---|---|
| Ví dụ | dpi · khổ · bleed · font thiếu · chữ tràn khung · ảnh kéo méo tỉ lệ · tương phản <4.5:1 · còn ô placeholder chưa điền · màu ngoài brand | BRISQUE/NIQE nhiễu-mờ · NIMA "đẹp" |
| Chặn xuất? | **Có** (`error`) | **KHÔNG BAO GIỜ** |

**Và: một con số 0-100 duy nhất là cái bẫy** — 82 điểm thì thiếu gì, sửa cái nào trước? Dùng đúng
cách chặng 1 đang làm: `✗ 2 lỗi · ⚠ 5 cảnh báo · ℹ 3 gợi ý`, **bấm nhảy tới từng chỗ**. Muốn có số
thì suy ra từ bảng đó và để **nhỏ, phụ**.

**Chặng 2** — `error`: <300dpi ở khổ đích · **bố cục lệch quá ngưỡng so với ảnh gốc** (SSIM/LPIPS —
*báo khách một mặt bằng, giao một mặt bằng khác là lỗi chết người trong nghề*). `warning`: độ bám
sketch thấp · ảnh mờ/nhiễu (BRISQUE) · vật liệu lệch phong cách (so palette với `GuProfile.palette`).

**Chặng 3** — `error`: ảnh <300dpi · **còn ô placeholder chưa điền** · chữ tràn khung · ảnh méo tỉ
lệ · font chưa nhúng. `warning`: chữ cách mép <5mm · thiếu bleed 3mm · tương phản <4.5:1 · màu/font
ngoài Nhận diện.

**Đặt ở nút Xuất** (`IOMenu`), theo mẫu preflight — **không** làm panel riêng mà người dùng phải nhớ
mở. Có nút *"Xuất kèm lỗi"* cho trường hợp cố ý.

## 7.4 · Cộng tác — `7.24/7.25/7.26/7.27`

**Chẩn đoán (§1.5)**: hai người mở cùng dự án → **thấy con trỏ nhau bay** nhưng người kia thêm node,
đổi tham số, chạy render thì **màn bên này không đổi gì**. Trạng thái này **tệ hơn không có con
trỏ** — không có gì thì người dùng biết phải gọi điện; có con trỏ bay thì họ tưởng đang cộng tác
thật rồi **ghi đè lên nhau và mất việc**.

**IF phải chọn CRDT (Yjs), không phải OT.** OT (Figma/Google Docs) **bắt buộc máy chủ trung tâm** —
mâu thuẫn trực tiếp với local-first (`.ifpack` được `SPEC-FILE-MANAGER.md` gọi là *"điều kiện sống"*).
Và nhược điểm lớn nhất của CRDT — tốn bộ nhớ **17-33×** — **không áp vào IF**, vì con số đó là cho
**văn bản dài hàng triệu ký tự**; tài liệu IF là **đồ thị node vài chục phần tử**.

**Miro là hình mẫu SAI.** Miro là công cụ **động não** — không ai chịu trách nhiệm bản cuối. IF là
dây chuyền **sản xuất hồ sơ giao khách**. Nhu cầu thật của studio, xếp theo giá trị:

| Hạng | Nhu cầu | Miro có? | Giá trị/chi phí |
|---|---|---|---|
| **1** | Sếp/khách **ghim góp ý đúng chỗ**, gán người, đánh dấu đã xử lý | ✅ | **Cao nhất, rẻ nhất — không cần realtime** |
| **2** | **Biết ai đang mở dự án**, cảnh báo trước khi 2 người cùng sửa | ❌ | Cao, rẻ |
| **3** | Sửa đồng thời thật | ✅ cốt lõi Miro | **Thấp nhất, đắt nhất** |

→ **IF đang cố làm hạng 3 — ít giá trị nhất — trong khi hạng 1 và 2 còn trống.**

**`7.24` (Sprint 1, 1 cờ)** — chốt một trong hai, **không được để nguyên**:
**A · Tạm ẩn `LiveCursors`** cho tới khi có đồng bộ thật, giữ `PresenceBar` (avatar "ai online" là
thông tin **thật**) — *khuyến nghị* · **B · Gắn nhãn** *"Đang xem cùng — nội dung chưa đồng bộ, cần
tải lại"*.

**`7.25` Tầng 1 — Ghim góp ý** (async, polling 3s như `ChatPanel` là đủ): ghim vào **toạ độ cụ thể**
(điểm trên ảnh render · trên trang Present · 1 node trên canvas), mỗi ghim là **một mạch trao đổi**
(nội dung · người · thời gian · trả lời · **✓ Đã xử lý**), **gán người** + đếm ghim chưa xử lý trên
thanh đầu. Tái dùng `util.annotate` để khoanh vùng. → **Giải 90% nhu cầu với 10% chi phí.**

**`7.26` Tầng 2 — Khoá mềm**: đọc `lastSeenAt` (`lib/server/auth.ts:108,130`) → dải báo *"Hoà đang
mở dự án này (2 phút trước)"* + **Mở chỉ xem** / **Mở để sửa**. **Khoá mềm, không khoá cứng** —
local-first không bao giờ chặn người dùng khỏi file của chính họ.

**`7.27` Tầng 3 — CRDT** chỉ khi Tầng 1-2 đã dùng thật mà vẫn thiếu. Presence **giữ đường riêng** —
đồng bộ tài liệu và presence là **hai bài toán tách rời**. `LiveCursors.tsx` **giữ nguyên, không
viết lại** — nó đã đúng.

---

# §8 · `2.2.84` VITALS — visual mới

**Thay `components/studio/VitalsIcon.tsx` (67 dòng).** Bản hiện tại là *vòng tròn chứa ô vuông bo
góc, gradient cam `#F06020` → navy `#002850`* — **2 màu không thuộc hệ màu IF**. ⚠️ Nếu cam-navy là
chủ ý giữ dấu ấn TTT thì **hỏi Hoà trước khi đổi**.

## 8.1 · Hình — 2 electron cuộn nhau, lớp ngoài là CUNG chạy

- **Không phải** vòng kín bao ngoài → là **cung hở** chạy quanh, nên hình **thở được**
- Quỹ đạo elip `rx 24 · ry 9.5`, tâm (36,36) trong viewBox 72×72, các nhánh xoay lệch
- Electron chạy bằng `offset-path` + `offset-distance`
- **Cả hình chỉ gồm 1 cung + vài elip + vài chấm** → ở **20px vẫn rõ**, ở **132px vẫn sang**, cùng
  một file cho cả 3 cỡ. *(Ruy-băng Siri / cầu ánh sắc đều **vỡ khi thu nhỏ** nên phải vẽ 2 icon.)*

## 8.2 · Số electron = kênh thông tin

| Trạng thái | Số hạt | Nhịp | Cung ngoài |
|---|---|---|---|
| **Nghỉ** | **2** | quỹ đạo ~9,3s | cung ngắn, trôi 24s, mờ (.30). Quỹ đạo **ẩn hẳn** |
| **Nghe** | **3** | 6,6s | cung dài hơn, sáng (.8), cả cụm hít thở 3,2s biên độ 1.025 |
| **Nghĩ** | **5** | 4,4s, **chạy đều tuyệt đối (linear)** | xem 8.3 |
| **Trả lời** | **3** | 5,4s | + xung lan từ tâm 2,8s |
| **Cần xem** | **2** | 16s | 1 hạt hổ phách `#c79a63`, hạt kia xám `#6e6e78`, cung 30s |

**Tương phản có chủ đích**: nghỉ/nghe chạy **nhịp leo thang hữu cơ**, nghĩ chạy **đều như máy**.
Mắt đọc ra ngay: *đang lưỡng lự* vs *đang xử lý ổn định*. **Nhịp nói được thứ màu sắc không nói được.**

## 8.3 · Trạng thái NGHĨ — hoa văn sinh từ chỗ quỹ đạo giao nhau

Kiểu màn khởi động Apple Watch, nhưng **tránh 5 cánh tròn đều kiểu hoa mai** bằng 4 điều chỉnh:

1. **Elip nghiêng, không phải vòng tròn** → cánh hình hạt hạnh nhân, thanh hơn
2. **Vòng KHÔNG đi qua đúng tâm** (`cy:21.5 · rx:14.5 · ry:10.5`) → chừa lõi trống, hoa văn thành
   **một vành**, không đặc — và **chừa chỗ cho chữ**
3. **Viền quỹ đạo gần tàng hình** (opacity .13) → hình do **vệt sáng vẽ ra**, không do nét vẽ sẵn.
   *Đây là khác nhau giữa "đồ hoạ" và "hiện tượng"*
4. **Tuế sai 26s** + hạt lệch pha 1/10 chu kỳ → nở **cuộn thành sóng**, **không bao giờ đứng yên
   thành bông hoa cân đối**. *Đối xứng tĩnh làm nó thành hoa mai; đối xứng đang trôi thì thành hoa văn*

## 8.4 · Nhịp leo thang — không đoạn nào chạy đều (trừ trạng thái Nghĩ)

Keyframe chia **2 chặng/vòng**, timing `cubic-bezier(.42,0,.66,.55)` → mỗi nửa vòng **khởi chậm rồi
nhanh dần** rồi dịu xuống. Chu kỳ lệch nhau bằng **số lẻ** (9,3s · −3,7s · −1,3s · −6,1s · −7,9s) →
**không bao giờ lặp lại y hệt**.

⚠️ Bản đầu đặt 4 chặng + `cubic-bezier(.58,0,.92,.22)` → Hoà phản hồi **"cực đoan quá"**. Con số ở
trên là bản đã hạ biên độ. **Không tăng lại.**

## 8.5 · Khối cầu kính

- Thân cầu: 2 lớp `radial-gradient` — highlight lệch trên-trái + tối dần ra rìa
- `box-shadow` **inset** 3 lớp (viền sáng · đáy tối · phản quang trên) + glow ngoài
- Lớp `::after` specular `mix-blend-mode: screen`
- **Chiều sâu**: hạt **to và sáng khi ra mặt trước, nhỏ và mờ khi lùi ra sau** —
  `@keyframes depth{0%{r:2.05;opacity:.66} 25%{r:1.6;opacity:.44} 50%{r:2.05;opacity:.66} 75%{r:2.55;opacity:1}}`.
  **Đây là thứ làm mắt đọc ra khối cầu thay vì cái đĩa phẳng.**
- Cầu phồng rất nhẹ (`scale 1.018`, 9s) — có sinh khí, không giật
- **Bản nền sáng bắt buộc có** — IF mặc định nền giấy ấm; đảo highlight thành phản quang trắng +
  viền hairline + bóng đổ nhẹ

## 8.6 · Nét — không dùng nét đơn

Mọi cung là **dải sáng có gradient tắt dần** (`<linearGradient>` 0% trong → 100% đậm), chồng lớp
nhoè `feGaussianBlur`, các lớp cộng vào nhau bằng `mix-blend-mode: screen` → **hoà thành một khối**.

**Vệt kéo electron**: 3 bản sao chạy sau trên cùng quỹ đạo, lệch pha `−.09s / −.19s / −.31s`, nhỏ
và mờ dần. Lệch pha nhỏ → **vệt mềm và tan dần, không thành đuôi cứng**. Vệt cũng mờ đi đồng bộ khi
hạt lùi ra sau kính.

## 8.7 · Xuất hiện — xoắn thiên hà

Mỗi lần gọi Vitals, chạy **đúng một lần**, ~1,35s:
`armIn`: nhánh khởi ở `rotate(+240deg) scale(1.75) blur(1.4px) opacity 0` → về `rotate(--a) scale(1)`,
`cubic-bezier(.22,.8,.3,1)`, **stagger 0 / .07 / .14 / .21 / .28s** → vệt sáng kéo thành xoắn ốc.
Cung: `arcIn` từ `rotate(-160deg) scale(1.4)`. Cầu: `ballIn` từ `scale(.62)`.

⚠️ Bản đầu 460° / scale 2.9 → **quá cực đoan**. Số trên là bản đã hạ.

## 8.8 · Chữ trong lõi — bụi sáng (chỉ cỡ L)

**Chạy ở cỡ L (màn chờ, panel mở), KHÔNG chạy ở viên 20px** → chi phí nặng chỉ trả đúng lúc màn
hình đang chờ.

| Thông số | Giá trị |
|---|---|
| Số hạt | **2.600** |
| Vẽ hạt | **sprite gradient dựng sẵn** (`drawImage`), stop `1 → .72 → .26 → .07 → 0` — **KHÔNG dùng `arc()`** vì arc có mép cứng → thô |
| Cỡ hạt | 3,1px (trong chữ) / 4,2px (bụi nền) × hệ số lệch `.55–1.3` |
| Lấy mẫu chữ | canvas ẩn ở **độ phân giải ×2**, bước 2px, ngưỡng alpha >60 |
| Mép chữ | alpha hạt **tỉ lệ theo alpha pixel gốc** → viền tan dần, không răng cưa |
| Chuyển động | lò xo tắt dần `k=.013`, `damp=.905` → **tụ lại**, không nhảy vào |
| Trôi | ±0,45px (trong chữ) / ±2,2px (bụi nền) |
| **Bloom** | vẽ xong toàn khung → **chồng chính khung đó 2 lần** với `blur(3.2×DPR)` α.5 và `blur(8×DPR)` α.26, `globalCompositeOperation='lighter'`. **KHÔNG vẽ hào quang từng hạt** — đó là thứ gây lốm đốm thô |
| Đổi chữ | hạt **không tắt rồi bật lại** — nhận toạ độ mới và trôi thẳng sang → nghĩa chuyển liền mạch |

## 8.9 · Ba cỡ, một DNA

**S 20-22px** status bar (glyph, không có chữ) · **M 56px** đầu panel · **L 96-132px** màn chờ /
panel vừa mở (có chữ bụi sáng bên trong).

## 8.10 · Ràng buộc kỹ thuật

- Glyph: **SVG + CSS thuần**, không thư viện, không Lottie, không video
- Chữ bụi: canvas 2D, ~90 dòng JS, chỉ ở cỡ L
- Màu: **đúng 1 accent `#6a57f5`** (+ `#8f80f8` là sắc độ sáng của chính nó), cộng `#c79a63` đã có
  sẵn trong token IF **chỉ cho cảnh báo**
- **`prefers-reduced-motion`**: glyph ngừng quay, hạt bụi đứng tại vị trí chữ — **chữ vẫn đọc được**

---

# §9 · CHỈ MỤC FILE PHIÊN NÀY

| File | Nội dung |
|---|---|
| **`SPEC-TONG-COWORK-2026-07-29.md`** | **file này — đọc trước** |
| `IF-DESIGN-STANDARD-2026-07-29.md` | **Chuẩn thiết kế đầy đủ** — 10 tật "mùi AI" + luật chữa, thang chữ/khoảng cách/bo góc, Swiss + Apple HIG, danh sách kiểm. **Đọc trước khi vẽ bất kỳ giao diện nào** |
| `if-chang2-mockup.html` | Bản vẽ ý 5 màn: thanh đầu sửa tràn · cross 4 nhóm · chặng 3 6 ô · gói combo node · thẻ việc bản sửa |
| `if-vitals-visual.html` | **Vitals chạy thật** — 5 trạng thái, orb chứa chữ, 3 cỡ, xoắn thiên hà (có nút Gọi lại), bụi sáng (có nút đổi chữ) |
| `KHAM-CHANG2-RENDER-2026-07-29.md` | Khám tràn khung · nút AI · 6 thẻ · gộp Ý tưởng vào chặng 2 |
| `KHAM-CHANG2-PHU-LUC-GOI-NODE-2026-07-29.md` | Gói combo node + node xuất |
| `KHAM-4NHOM-THOAI-ANHXA-2026-07-29.md` | 4 nhóm · bìa vẽ nét · ánh xạ Google Flow/Weave/ComfyUI/Firefly · audit thoại |
| `KHAM-CHIDAN-THONGMINH-KHOMAU-2026-07-29.md` | Hệ chỉ dẫn 5 tầng · kho mẫu biểu mẫu |
| `KHAM-2GIAODIEN-BENTO-2026-07-29.md` | 2 giao diện 1 dữ liệu · `ParamDef` · 3 dải màn · pill switch |
| `KHAM-CHAMDIEM-DATCHUAN-2026-07-29.md` | Chấm chuẩn trước khi xuất · 5 họ prior art |
| `KHAM-COLLAB-CROSS-2026-07-29.md` | Bố cục cross · cộng tác OT vs CRDT |
| `LUAT-300DPI-2026-07-29.md` | Luật ≥300dpi + 4 việc để thành sự thật |
| `AUDIT-PRESENT-UX-2026-07-29.md` | 4 khiếu nại Present đối chiếu code |
| `PHAN-E-HIEN-TAI-2026-07-29-v4.md` | PHẦN E (luật 1-8; **luật 9 ở §2 file này**) |
| `FILEMANAGER-SPRINT-2026-07-29-v2.md` | Q8 (NT1+NT5) · Q9 (BOQ) · catalogue→template |

---

# §10 · BA VIỆC LÀM ĐẦU TIÊN

1. **`2.2.60` + `2.2.61`** — sửa tràn thanh đầu + dời AiTierMenu. *Đang có người dùng không bấm được
   nút Chạy flow ở 1183px.*
2. **`7.24`** — chốt ẩn hay gắn nhãn `LiveCursors`. *1 cờ, sửa một lời hứa suông.*
3. **`2.2.77`** — bịt 2 lỗ rò dữ liệu Tool Mode. *Mọi việc UI chặng 2 đứng trên nền này.*

---

*Cowork, 29/07/2026. Toàn bộ trích dẫn `file:dòng` đọc trực tiếp trên máy Hoà. Nghiên cứu ngoài:
Apple HIG · International Typographic Style · PatternFly · Google Flow · Figma Weave · Flora ·
ComfyUI · Adobe Firefly · Enfocus PitStop / PDF-X · IQA-PyTorch · Chameleon contextual help ·
Taskade OT-vs-CRDT · ISO 3664. Mọi mã `2.2.6x`–`2.2.8x`, `2.3.5x`–`2.3.6x`, `3.3x`, `7.2x` là
**ĐỀ XUẤT** — kiểm tra trùng số trong `docs/IF-FEATURE-TREE.md` trước khi dán.*
