# NC · TỪ ĐANG DÙNG ĐA NGHĨA — rà 16/08 (phiên P-I)

> **Loại bệnh:** MỘT CHỮ ↔ NHIỀU KHÁI NIỆM. Ngược chiều với thứ `soi:tu-dien` đang bắt
> (một khái niệm ↔ nhiều nhãn). Cùng họ `may-soi-dong-dang` tín hiệu ②/⑤.
> **Phạm vi phiên:** CHỈ ĐO, KHÔNG SỬA. Không nhãn nào trong repo bị đổi.
> **Mã điều khoản áp dụng** (trích nguyên văn `docs/TRIET-LY-IF.md`):
> · **[T1] MỘT NGUỒN, NHIỀU ĐÍCH** *(vì sự thật phải ở một chỗ)* (`:14`)
> · **[Đ2] NHÌN VÀO TRONG TRƯỚC:** *"mọi bảng plan có cột 'NỘI LỰC ĐÃ CÓ' — IF có gì rồi mới
>   chốt build mới; build = ưu tiên chưng cất/nối dây, không sáng tác trùng"* (`:72`)
>
> 🔧 **ĐÍNH CHÍNH MÃ — phiếu ghi `[Đ1] nhìn-vào-trong-trước`, SAI.** `TRIET-LY-IF.md:70`
> **[Đ1]** = *"Tầng sau phải là hệ quả tầng trước"*; *nhìn-vào-trong-trước* là **[Đ2]** (`:72`).
> Chi tiết mức lan ở **V3-5** — nó tự nó là một ca của đúng bệnh đang nghiên cứu.

---

## ⓪b · ⓪ TIỀN ĐỀ

| Ô | Kết quả |
|---|---|
| ⓪b hạ tầng | ✅ `git log --oneline -1` = `895fbaf` · `git rev-list --count HEAD..main` = **0** |
| ⓪.1 *"soi:tu-dien soi nhãn lệch, chưa soi một-chữ-nhiều-nghĩa"* | ✅ ĐÚNG — `scripts/soi-tu-dien.mjs:18-28` mỗi entry là cặp `{sai → dung}`, tức **nhãn cũ→nhãn đúng**. Không cấu trúc nào khai được "một từ, N nghĩa" |
| ⓪.2 *"'icon' dùng cho 6 thứ trong ngày 16/08"* | ✅ ĐÚNG — bảng ở `docs/00-CHOT.md:1148-1156`, trạng thái *T ĐỀ XUẤT, CHỜ HOÀ DUYỆT* |
| ⓪.3 *"đúng họ `may-soi-dong-dang` tín hiệu ②/⑤"* | ✅ ĐÚNG — `scripts/frontier-registry.mjs:280` khai nguyên văn *"②hai union/enum cùng vai ngữ nghĩa khác từ vựng ⑤nhãn gần nghĩa"* |

**Không bác ý nào.** Bổ sung một giới hạn đo được của cỗ máy, cần cho V4:
`soi-tu-dien.mjs:30` `EXT = new Set(['.ts','.tsx','.html','.css'])` ⇒ **máy hiện KHÔNG quét
`.md`**. Mà `docs/phieu-giao/` mới là nơi agent đọc để thi hành. Lỗ này quan trọng hơn cả
việc thiếu luật đa nghĩa.

---

## V1 · KIỂM LẠI BẢNG 6 LOẠI "ICON" CỦA T

Mỗi loại phải có **ít nhất một ca thật trong repo**. Kết quả: **3 có thật · 1 chỉ có ở tầng
khác · 1 chỉ có trong mock · 1 KHÔNG có.**

| # | Loại T đặt | Ca thật | Phán |
|---|---|---|---|
| 1 | **Icon giao diện** | `components/ui/command-icon.tsx:18-21` — `MAP` danh sách trắng 11 icon lucide (`MousePointer2, Move, RotateCw, Copy, FlipHorizontal2, Trash2, Undo2, Redo2, MoveDiagonal, Type, HelpCircle`); 184 chỗ `import … from 'lucide-react'` | ✅ **CÓ THẬT**, và đã có một cỗ máy tập trung |
| 2 | **Ký hiệu nghề** | Có ở **tầng NÉT VẼ**: `lib/cad/commands.ts:491` ký hiệu cao độ (tam giác đặc + gạch chân) · `lib/cad/dossier-check.ts:62` pattern ký hiệu cao độ VN · `lib/cad/furniture.ts:12` ký hiệu đèn/ổ cắm | ⚠️ **CÓ, NHƯNG KHÔNG PHẢI ICON** — xem cảnh báo dưới |
| 3 | **Icon nén tin** | CHỈ trong mock: `docs/mocks/mock-bo-nen-chung.html:178-186` (`.kyhieu svg{width:13px}` + `.kyhieu i{font-variant-numeric:tabular-nums}`) | 🟡 **0 ca trong code chạy** |
| 4 | **Hình minh hoạ** | **KHÔNG CÓ.** `components/ui/Tooltip.tsx:41-50` khai đủ `label` · `desc` · `shortcut` · `side` — **không prop nào nhận hình** | ❌ **SUY TỪ LÝ THUYẾT** |
| 5 | **Dấu trạng thái** | `components/settings/AiDependencySettings.tsx:157-180` `AiStatusDot` — chấm 10px `bg-amber-400`, nghĩa mang bằng `title` + `aria-label`, **0 chữ nhìn thấy** | ✅ **CÓ THẬT** |
| 6 | **Nhãn loại tệp** | `app/library/ingest/page.tsx:16` `TYPE_BADGE: Record<string,string> = { pdf:'PDF', excel:'XLS', cad:'CAD', other:'FILE' }` | ✅ **CÓ THẬT** |

### 🔴 V1-a · Loại 2 "Ký hiệu nghề" — T mô tả SAI TẦNG

T viết loại này là *"ký hiệu bản vẽ ISO — cửa · tường · cầu thang"* và gọi nó là **loại icon
mạnh nhất của IF, thứ đối thủ đa dụng không có**. Đo ra: ký hiệu nghề trong IF **tồn tại như
NÉT VẼ ĐƯỢC SINH RA TRONG BẢN VẼ**, không phải hình trên nút.

- `lib/cad/commands.ts:491` — ký hiệu cao độ là **lệnh vẽ** ra tam giác + gạch chân trong Doc.
- `lib/cad/furniture.ts:300` — vòi sen là **hình học** (khay vuông + thoát sàn tròn).
- Đối chiếu phía nút: `components/ui/command-icon.tsx:13-16` — **11/11 icon là lucide chung**,
  0 ký hiệu ISO.

⇒ Câu *"KTS nhìn là hiểu, không cần học"* hiện **đúng với bản vẽ, sai với thanh công cụ**.
Không phải bác bỏ giá trị của ý — nó vẫn là lợi thế thật — nhưng phải khai đúng: **đây là việc
CHƯA LÀM, không phải tài sản đang có.** Ghi thành "loại icon" mà không nói rõ, phiên sau sẽ đi
tìm bộ ký hiệu tưởng đã có (đúng tội N8).

### 🔧 V1-b · Loại 1 và loại 3 khác nhau THẬT, nhưng T đặt sai tiêu chí phân biệt

T phân biệt bằng *"đứng thay MỘT TỪ ở chỗ chật"* — tiêu chí này **không đo được**, ai cũng cãi
được. Tiêu chí đo được đã nằm sẵn trong code: **BẤM ĐƯỢC HAY KHÔNG.**

| | Ở đâu | Bấm được | Kênh chữ đi kèm |
|---|---|---|---|
| Icon giao diện | trong `<button>` | ✅ | **NHÃN** (tên lệnh) |
| Icon nén tin | trong dòng dữ liệu | ❌ | **SỐ** (dữ liệu) |
| Dấu trạng thái | không tương tác | ❌ | **nhãn trạng thái** |

Dùng trục này thì máy grep được (icon nằm trong `<button>`/`role="button"` hay không), còn
trục "chỗ chật" thì không. **Đề xuất giữ 6 loại, sửa tiêu chí phân biệt của 1↔3.**

### 🆕 V1-c · LOẠI THỨ 7 T BỎ SÓT — **Ảnh đại diện người**

`components/ui/PresenceRow.tsx:53,71,85` — vòng tròn `borderRadius:'50%'` mang **ảnh người thật**
(`objectFit:'cover'`), xếp chồng thành dãy, có đường lùi khi không có ảnh.

Nó chiếm ĐÚNG ô mà icon chiếm, nhưng không thuộc loại nào trong 6: không phải quy ước chung
(mỗi người một hình), không phải ký hiệu nghề, không nén tin, không minh hoạ, không phải trạng
thái, không phải loại tệp. **Và luật của nó khác hẳn cả 6**: không được thay bằng chữ (mất
danh tính), phải có đường lùi khi thiếu ảnh, xếp chồng thì phải có "+N".

Ca này đang sống thật và Hoà vừa nhắc lại 16/08 (`docs/00-CHOT.md:1133`: *"mỗi dự án có chấm màu
+ dãy avatar"*). ⇒ **bảng phải là 7 loại.**

### V1-d · Có hai loại nào thực chất là một không?

**Không.** Đã thử gộp 5 (dấu trạng thái) vào 3 (icon nén tin) — cả hai đều không bấm được, đều
ở trong dòng dữ liệu. Nhưng luật ngược nhau: nén tin **luôn kèm SỐ** (số mới mang tin), trạng
thái **kèm NHÃN CHỮ** (chấm mới mang tin). Gộp thì mất đúng cái luật đang bảo vệ người mù màu.
Giữ tách.

---

## V2 · NĂM TỪ HOÀ CHỈ ĐÍCH DANH

### 1. `card` — 🔴

| # | Nghĩa | Ca thật |
|---|---|---|
| a | **vỏ giao diện** (nền + bo + bóng) | `app/globals.css:177` `--card:#1a1a1e` · `:117` `--pad-card` · `components/home/widgets/WidgetCard.tsx:20` |
| b | **thẻ dự án ở Home** | `components/home/ProjectOverviewCard.tsx:104` |
| c | **thẻ DNA** — dữ liệu gu thiết kế, 8 lớp | `lib/dna/types.ts:48` `DesignDnaCard` |
| d | **thẻ tác vụ master tool** — ánh xạ sang node AI | `lib/render-studio/task-cards.ts:15` `TaskCard` · `:32` `TASK_CARDS` |
| e | **vật liệu kính của tấm** | `app/globals.css:193` `--mat-card` |
| f | **thẻ việc kanban** (docs, chưa code) | `docs/00-CHOT.md:1120` |

**Vì sao 🔴, không phải 🟡:** chốt 16/08 *"card 3 nấc"* (`00-CHOT:1102`) và *"CARD SỔ RA KHI BẤM"*
(`:1057`) áp cho nghĩa **(a) vỏ**. Nhưng `TaskCard` và `DesignDnaCard` là **dữ liệu nghiệp vụ có
schema riêng**. Một phiếu ghi *"cho card sổ ra 3 nấc"* không phân biệt được là sửa `WidgetCard`
(một component) hay sửa 4 loại thẻ nghiệp vụ (bốn vùng file, có schema, có test). Hai việc khác
hẳn nhau về khối lượng và rủi ro.

**Tên riêng đề xuất:** (a) **khung thẻ** · (b) **thẻ dự án** · (c) **thẻ DNA** · (d) **thẻ tác vụ**
· (e) **nền mờ thẻ** · (f) **thẻ việc**.
⚠️ Cấm dùng chữ **"tấm"** — đã thuộc về tấm Thư viện (chốt 07/08).

---

### 2. `panel` — 🟡

| # | Nghĩa | Ca thật |
|---|---|---|
| a | **trục phải / bảng thông số** (nghĩa chính) | 35 tệp `components/**/*Panel*.tsx` — vd `components/cad/HistoryPanel.tsx` |
| b | **màu nền kính** — không phải một vùng, là một MÀU | `app/globals.css:192` `--mat-panel` · `:374` `.mat-panel` |
| c | **tay cầm thu/mở** — không phải panel, là cái CẦM panel | `components/ui/PanelFlank.tsx:3` |

🟡 chứ không 🔴 vì (a) áp đảo và (b)(c) đều có tiền tố phân biệt sẵn (`--mat-`, `Flank`). Rủi ro
là đọc lướt, không phải làm nhầm việc.

**Tên riêng:** (a) **bảng thông số** · (b) **nền mờ bảng** · (c) **tay cầm bảng**.

---

### 3. `kính` — 🔴

| # | Nghĩa | Ca thật |
|---|---|---|
| a | **VẬT LIỆU NỘI THẤT THẬT** — kính cường lực, có `transmission`/IOR, vào BOQ và render | `lib/materials/material-edit.ts:29` `\| 'kinh' \|` trong `MaterialTypeId` · `lib/materials/pbr-from-category.ts:65` `['kinh cuong luc','kinh trong','kinh mo','kinh']` · `lib/materials/material-edit.test.ts:53` *"kính có transmission khởi tạo 0.9/ior 1.5"* |
| b | **vật liệu giao diện** — vibrancy/blur | `app/globals.css:190` comment *"Materials trong suốt (vibrancy) cho header / panel / modal"* · `:374` `.mat-panel { backdrop-filter: blur(…) }` |

**Vì sao 🔴 — đây là ca nguy hiểm nhất trong 5 từ được giao:** IF là app **thiết kế nội thất**.
Kính là một vật liệu người dùng đặt vào công trình, có giá, có đơn vị m², vào bảng khối lượng.
Một phiếu ghi *"chỉnh độ trong của kính"*:
- đọc theo (a) ⇒ sửa `transmission.value` trong `lib/materials/` — đổi ảnh render và BOQ;
- đọc theo (b) ⇒ sửa `--mat-panel` alpha trong `app/globals.css` — đổi giao diện.

Hai vùng file khác hẳn, hai nghiệp vụ khác hẳn, **không câu nào trong phiếu phân biệt được**.

🔴 **KÈM MỘT LỆCH NẶNG HƠN, T CHƯA NÊU — tiền tố `mat-` bị hai nghĩa:**
`--mat-header/--mat-panel/--mat-card` (`globals.css:191-195`) lấy chữ **mat** từ *material* theo
nghĩa **Apple vibrancy**. Nhưng trong chính IF, `matId` là **mã vật liệu nội thất** —
`lib/cad/materials.ts:58` khai *"matId của IF = `ProductSpec.sku`"*, tức nó nối thẳng vào giá và
nhà cung cấp. Cùng một tiền tố, một bên là màu nền mờ, một bên là khoá nối tới tiền.
`--mat-card` chỉ cách `matId` đúng một dấu gạch.

**Tên riêng:** (a) giữ **kính** (đúng từ nghề, không nhường) · (b) **nền mờ** — và đổi tiền tố CSS
`--mat-*` → `--kinh-*` hoặc `--nen-mo-*`, **cấm để `mat-` đứng cạnh `matId`**.

---

### 4. `nấc` — 🔴 (đúng như phiếu nghi, và ca 🔴 là ca thứ ba)

| # | Nghĩa | Người dùng bấm? | Ca thật |
|---|---|---|---|
| a | **mức chi tiết trình bày** — card/sidebar/tool/Vitals | ✅ có | `docs/00-CHOT.md:1102` *"sidebar 3 nấc (thu 28 / vừa 240 / rộng 320) … card 3 nấc"* · `:1103` mặc định/vừa/full |
| b | **mức cường độ** — giảm chói kính, hai nấc màu | ✅ có | `docs/00-CHOT.md:1015` *"nấc giảm chói bắt buộc"* · `:1063` *"một-tím-hai-nấc"* |
| c | **cờ độ tin cậy DỮ LIỆU** — `measured/inferred/verified` | ❌ **KHÔNG** | `lib/dna/types.ts:88` `if (f.trangThai !== 'measured' && f.trangThai !== 'inferred' && f.trangThai !== 'verified')` · `lib/cad/model.ts:380` `inferred?: true` |

**Xác nhận nghi ngờ của phiếu: (c) khác hẳn bản chất.** (a) và (b) là **tuỳ chọn hiển thị người
dùng bấm**, lưu localStorage, đổi lúc nào cũng được. (c) là **nhãn nguồn gốc dữ liệu ghi vào
`.idf`/`.idfc`**, người dùng không bấm chọn được — máy suy ra hoặc người xác nhận, và nó quyết
định con số có được vào BOQ hay không (luật 15/08: *"BOQ chỉ nhận số đo được"*).

Gọi cả ba là "3 nấc" khiến một phiếu *"làm 3 nấc cho X"* đọc ra hai việc không liên quan.

**Tên riêng:** (a) **nấc chi tiết** · (b) **nấc cường độ** · (c) **cờ tin cậy** — (c) **phải bỏ hẳn
chữ "nấc"**, vì nó không phải một thang người dùng trượt.

---

### 5. `module` — ⛔ **T LIỆT KÊ THỪA. TÔI BÁC.**

Đo hết hai phía:
- **Trong code**, "module" xuất hiện **chỉ theo nghĩa ES-module**, không lệch một ca nào:
  `components/FlowCanvas.tsx:39` *"hằng số vẽ tay, module-level"* · `components/three/material-preview.ts:12`
  *"RIG GĂM VÀO globalThis, KHÔNG phải biến module"* · `components/studio/VitalsGesture.tsx:225`
  *"Lịch sử hội thoại sống ở mức MODULE"*.
- **Trong `docs/00-CHOT.md`**, "module" xuất hiện **đúng 3 dòng**, tất cả cùng ngày 16/08, tất cả
  cùng một nghĩa: `:1120` · `:1121` · `:1135` — *"khối nội dung kéo thả được"*.

Hai nghĩa **không bao giờ đứng cùng ngữ cảnh**: một là từ của thợ code không lộ ra UI/sổ, một là
từ Hoà mới dùng trong một ngày. ⚪ **vô hại — không đáng tốn một dòng duyệt của Hoà.**

🔴 **NHƯNG có vấn đề THẬT ở chỗ khác, và nặng hơn cái T đi tìm:**
"module" là **TÊN THỨ TƯ cho một thứ IF đã có ba tên**:

| Tên | Ở đâu |
|---|---|
| `widget` | `components/home/widgets/WidgetCard.tsx` + 10 tệp `components/home/widgets/` |
| `element` | `lib/present-editor/` — `elements: [...]` (vd `brand-kit.test.ts:53`) |
| `node` | canvas chặng 2 — `lib/nodes/` |
| **`module`** | Hoà, 16/08 (`00-CHOT:1121`) |

**Bằng chứng lệch đã lan vào code:** `components/home/widgets/WidgetCard.tsx:20` dùng token
`--shadow-node` (`app/globals.css:200`) — một token **đặt tên theo NODE đang tô bóng cho WIDGET**.
Không ai cố ý; nó xảy ra vì hai thứ vốn cùng bản chất mà mang hai tên.

⇒ Đây là **tín hiệu ④ của `may-soi-dong-dang`** (*"cùng một danh sách khai ở nhiều chỗ"*), không
phải bệnh đa nghĩa. Chốt 16/08 đã đi đúng hướng khi viết *"cùng một cơ chế, đừng đẻ ba kiểu kéo
thả"* (`:1121`) — **việc còn thiếu là chọn MỘT tên, không phải thêm tên thứ tư.**

---

## V3 · BA TỪ NỮA — chưa ai nêu

### V3-1. `khối` — 🔴🔴 **NẶNG NHẤT CẢ PHIẾU**

| # | Nghĩa | Ca thật |
|---|---|---|
| a | **node trên canvas** — nghĩa CHÍNH THỨC trong từ điển | `docs/SPEC-NGON-NGU-CHI-DAN.md:26` `\| Node \| **khối** \| block \|` · `:29` `\| Node Library \| **thư viện khối** \|` |
| b | **khối 3D đặc** — hình học dựng được | `docs/SPEC-NGON-NGU-CHI-DAN.md:61` *"'Thiết kế' = trục đẹp-xấu: khối, ánh sáng, vật liệu"* · `:76` *"'Dựng ảnh' bỏ rơi khối 3D"* · `lib/three/build-recipe.ts:3` *"Công Thức Khối (BuildRecipe)"* |
| c | **khối giao diện** — một mảng hình chữ nhật trên màn | `docs/00-CHOT.md:74` *"switch 'Vẽ 3D' CÙNG khối bar"* |

**Vì sao đây là ca tệ nhất:** nghĩa (a) và (b) **nằm trong CÙNG MỘT TỆP**, cách nhau 35 dòng —
và tệp đó chính là **cuốn từ điển sinh ra để chống lệch nghĩa**. Cuốn từ điển tự mâu thuẫn.

Hệ quả sống: `docs/00-CHOT.md:59` chốt *"Panel **Thư viện khối** sidebar là cửa DUY NHẤT
(node+vật liệu+template)"* — theo từ điển thì đây là **thư viện NODE**. Nhưng một KTS mở app,
đang ở chặng 3D Thiết kế, đọc *"Thư viện khối"* thì **chắc chắn hiểu là thư viện KHỐI 3D**
(ghế, tủ, khối dựng). Đây không phải suy đoán về người dùng — chính `:61` của từ điển dùng chữ
"khối" theo đúng nghĩa đó.

⇒ Từ điển đang **cấm lộ chữ "node"** mà thay bằng một chữ **đã có nghĩa nghề nặng hơn**. Đổi từ
lóng lấy từ nghề là đổi lỗi nhỏ lấy lỗi lớn.

**Tên riêng:** (a) → **ô lệnh** hoặc **bước** (đề xuất **bước**: chuỗi node là chuỗi bước, và nó
khớp chốt `nut-cong-tren-day` *"chèn bước vào giữa 2 node"*) · (b) giữ **khối** · (c) **mảng**.

⚠️ Đây là dòng duy nhất trong bảng V5 **đụng vào một chốt Hoà đã ký** (từ điển 02/08). Phải để
Hoà tự bấm, T không được tự quyết.

---

### V3-2. `lớp` / `layer` — 🔴

**Bốn thứ khác hẳn nhau, cả bốn đều mang tên `layer` trong code:**

| # | Nghĩa | Ca thật |
|---|---|---|
| a | **lớp bản vẽ CAD** — ẩn/khoá/bề dày nét in, chuẩn ISO | `lib/cad/model.ts:53` *"Lớp (layer) — entity mới rơi vào layer hiện hành; ẩn/khoá theo cờ"* · `:61` *"bề dày nét mặc định của layer (mm, khổ giấy in)"* |
| b | **phần tử theo thứ tự z trong slide** (nghĩa Photoshop) | `components/present-editor/LayerPanel.tsx:4-8` *"Danh sách element của slide theo thứ tự z … ẩn/hiện (mắt), khoá/mở (ổ khoá)"* |
| c | **8 chiều của Thẻ DNA** — không phải hình ảnh gì cả | `lib/dna/types.ts:22` `DNA_LAYER_KEYS` · `:33` `DnaLayerKey` |
| d | **lớp kiểm** — lớp LUẬT ↔ lớp GÓP Ý | `lib/review/types.ts:100` *"hai lớp TÁCH SẴN từ tầng dữ liệu"* · `:82` *"KHÔNG BAO GIỜ CHẶN … UI lớp này"* |

**Vì sao 🔴:** (a) và (b) **có cùng bộ thao tác** — ẩn/hiện, khoá/mở, đổi thứ tự — nhưng ở **hai
chặng khác nhau** và **hai model khác nhau**. Một phiếu *"sửa bảng Lớp"* mở nhầm tệp là sửa nhầm
cả một chặng, mà tsc và test đều xanh vì cả hai đều hợp lệ.

Và (c) là ca đau nhất về nhận thức: `DNA_LAYER_KEYS` **không có gì liên quan tới hình ảnh hay
thứ tự chồng** — nó là 8 trục mô tả gu. Gọi là "layer" chỉ vì lúc viết cần một chữ nghĩa "tầng
khái niệm".

**Tên riêng:** (a) **lớp bản vẽ** · (b) **lớp slide** · (c) **trục DNA** (bỏ chữ lớp) ·
(d) **tuyến kiểm** (bỏ chữ lớp).

---

### V3-3. `tầng` — 🔴

| # | Nghĩa | Ca thật |
|---|---|---|
| a | **TẦNG NHÀ** — Level kiểu Revit, có cao độ + thứ tự | `lib/cad/model.ts:168` *"LEVEL / TẦNG"* · `:171` *"TẦNG THẬT — object mang CAO ĐỘ + THỨ TỰ, đúng khái niệm Level của Revit"* · `:239` *"tầng chứa entity (BIM storey), VD 'GF'/'L1'/'L2'"* |
| b | **tầng năng lực AI** (tier) | `lib/ai/text-tier.ts:24` *"tầng đã chạy — route đưa thẳng ra `_tier`"* · `:40` *"Sinh chữ theo thứ tự tầng Cloud → Ollama"* |
| c | **tầng z giao diện** | `app/globals.css:197` *"Bóng đổ mềm kiểu Apple, sâu theo tầng"* · `:524` *"nhìn như tụt một tầng"* |
| d | **tầng ánh sáng của kính** (①②③) | `docs/00-CHOT.md:1095` *"tầng ② (trỏ vào) và tầng ③ (đang render) cùng ở VIỀN"* |
| e | **tầng kiến trúc tool** (thanh chung / gói lệnh / master node) | `docs/00-CHOT.md:1008` *"đúng tầng 'gói tác vụ' của kiến-trúc-tool-3-lớp"* |
| f | **tầng phân vai agent** | `docs/00-CHOT.md:927` *"giữ nguyên phân tầng 12/08"* |

**Vì sao 🔴, dù nghe như chỉ khó đọc:** (a) là **từ nghề có nghĩa cứng** trong app bán cho KTS.
"Tầng" trong hồ sơ xây dựng là tầng nhà, không có nghĩa thứ hai. IF đang mượn nó cho 5 việc
khác. Đây đúng luật `SPEC-NGON-NGU-CHI-DAN` **§5 CẤM jargon nội bộ lộ UI**, chỉ là chiều ngược:
**nội bộ đang mượn từ NGHỀ làm jargon**, và đó là hướng nguy hiểm hơn — vì người dùng đã có sẵn
một nghĩa trong đầu trước khi mở app.

**Tên riêng:** (a) giữ **tầng** (không nhường) · (b) **bậc AI** · (c) **độ sâu** · (d) **tầng sáng**
→ đổi thành **kiểu sáng** · (e) **lớp tool** → đổi thành **cấp tool** · (f) **cấp vai**.

---

### V3-4. `thẻ` — 🟡 (nêu để đủ, không đề nghị Hoà bấm riêng)

`thẻ` = card (mọi nghĩa V2-1) · **thẻ vai** agent (`docs/phieu-giao/P-I-tu-dien-tu-da-nghia.md:4`
*"THẺ VAI [Đ4]"*) · **thẻ lật** ở màn khoá (`STATUS.md`, mục 15/08) · **tab**.
Gộp vào dòng `card` của bảng V5 — giải quyết `card` là giải quyết luôn.

---

### V3-5. 🔴 **`[Đ1]` — mã điều khoản TỰ NÓ đã lệch, và đang lan**

Đây không phải một "từ" theo nghĩa thường, nhưng nó là **ca đắt nhất tìm được trong phiên**, vì
nạn nhân là **chính cơ chế sinh ra để chống mơ hồ**.

**Nguồn chuẩn** `docs/TRIET-LY-IF.md`:
- `:70` **[Đ1]** = *"Tầng sau phải là hệ quả tầng trước — tính năng/luật mới khai được 'đứng tầng
  nào, hệ quả điều nào' mới qua cửa plan."*
- `:72` **[Đ2] NHÌN VÀO TRONG TRƯỚC:** *"mọi bảng plan có cột 'NỘI LỰC ĐÃ CÓ' …"*

**MƯỜI HAI chỗ đang trích SAI** (`[Đ1]` gán cho *nhìn-vào-trong-trước*) — **và nó đã lan vào
CODE, không chỉ ở `docs/`**:

| Tệp | Dòng | Bằng chứng |
|---|---|---|
| `docs/00-CHOT.md` | `:944` | *"ĐỐI CHIẾU [Đ1 nhìn vào trong trước]"* |
| `docs/00-CHOT.md` | `:956` | *"đối chiếu [Đ1 nhìn vào trong trước]"* |
| `docs/bao-cao-phien/2026-08-16-P-E-sidebar-home.md` | `:89` | *"Đúng [Đ1] nhìn-vào-trong-trước"* |
| `docs/phieu-giao/P-G-o-giai-nghia.md` | `:105` | phiếu **đang chạy** |
| `docs/phieu-giao/P-H-thanh-tien-trinh.md` | `:114` | phiếu **đang chạy** |
| `docs/phieu-giao/P-I-tu-dien-tu-da-nghia.md` | `:91` | phiếu **đang chạy** |
| `components/settings/UnitsScaleSettings.tsx` | `:10-11` | *"[Đ1] nhìn vào trong trước, cấm đẻ khuôn mới"* |
| `lib/units/scale.ts` | `:6` | *"Đúng luật [Đ1] 'nhìn vào trong trước…'"* |
| `lib/units/index.ts` | `:9` | *"đúng luật [Đ1] 'nhìn vào trong trước, cấm đẻ khuôn…'"* |
| `lib/commands/toolbar-source.ts` | `:11` | *"KHÔNG viết registry thứ sáu ([Đ1] 'nhìn và…')"* |
| `scripts/frontier-registry.mjs` | `:304` | *"[Đ1] MỞ RỘNG components/ui/Tooltip"* — nghĩa dùng-lại-cái-có |
| `scripts/frontier-registry.mjs` | `:306` | *"[Đ1] LightArc"* — nghĩa dùng-lại-cái-có |

⚠️ Một chỗ **không phán được**: `scripts/frontier-registry.mjs:125` *"[Đ1] + THẺ VAI tự chứa 4
dòng [Đ4]"* — ngữ cảnh không đủ để biết đang gọi nghĩa nào. Không tính vào 12.

🔴 **Hai điều làm ca này nặng hơn tôi tưởng lúc đầu:**
1. **Ba trong sáu chỗ ở `docs/` là phiếu ĐANG CHẠY HÔM NAY.** Ba phiên phụ đang được dặn trích
   một mã sai; mỗi báo cáo trả về đóng dấu cái sai thêm một lần.
2. **Sáu chỗ nằm trong CODE và trong chính `frontier-registry.mjs`** — tức cái sai đã vào comment
   vĩnh viễn và vào sổ máy-đọc-được. `lib/units/*` còn **trích nguyên văn câu của [Đ2] rồi gán số
   [Đ1]** — dạng sai khó phát hiện nhất, vì câu trích đúng nên đọc lướt thấy hợp lý.

**Gốc lệch đo được:** `docs/00-CHOT.md` mục 13/08 liệt kê *"6 điều hành Đ1-Đ6 gồm: nhìn-vào-trong-trước,
ánh-xạ-2-giá-trị, ghim-cứng-vai-agent"* — **liệt kê tên mà không gán số**. Người/agent sau đọc
danh sách đó, thấy *nhìn-vào-trong-trước* đứng đầu, suy ra nó là Đ1. Sai từ một dấu phẩy.

⇒ Sửa 12 chỗ là việc ~15 phút. Nhưng bài học đắt hơn: **danh sách mã điều khoản mà liệt kê không
kèm số thì tự nó là máy đẻ lệch.**

---

## V4 · ĐỀ XUẤT LUẬT MÁY SOI (mô tả, KHÔNG code)

### V4-a · Nền có sẵn và lỗ phải vá trước

`scripts/soi-tu-dien.mjs` hiện: `TU_DIEN` là mảng `{sai: regex, dung: string, pham_vi: string[]}`
(`:18-28`), duyệt cây bằng `walk()` (`:32-40`), lọc bằng `EXT = ['.ts','.tsx','.html','.css']`
(`:30`), báo cáo mặc định exit 0, `--strict` exit 1 (`:65`).

🔴 **Lỗ phải vá TRƯỚC khi thêm luật nào:** `EXT` **không có `.md`** ⇒ máy không nhìn thấy
`docs/phieu-giao/` — **đúng nơi agent đọc để thi hành**. Bệnh đa nghĩa gây hại ở PHIẾU, không
phải ở CSS. Thêm luật mà không mở `.md` là dựng máy soi nhìn sai hướng.

### V4-b · Khai từ điển mới — không đụng cấu trúc cũ

Thêm mảng **thứ hai**, `TU_DA_NGHIA`, cạnh `TU_DIEN` (không sửa `TU_DIEN` — nó đang 0 lệch):

```
{ tu: 'nấc',
  nghia: [ { ten: 'nấc chi tiết',  dinh_ngu: /chi tiết|thu gọn|sổ ra|mặc định\/vừa\/full/ },
           { ten: 'nấc cường độ',  dinh_ngu: /cường độ|giảm chói|độ đậm/ },
           { ten: 'cờ tin cậy',    dinh_ngu: /measured|inferred|verified|tin cậy/ } ],
  pham_vi: ['docs/phieu-giao', 'docs/nc', 'components', 'lib'],
  ngoai_le: [ 'docs/nc/NC-TU-DA-NGHIA-2026-08-16.md' ] }
```

**Máy không cần hiểu nghĩa.** Nó chỉ kiểm một điều đo được: *từ đa nghĩa xuất hiện mà trong
cùng câu KHÔNG có định ngữ nào đã khai* → báo.

Trường `ngoai_le` là **bắt buộc**, và đã có tiền lệ trong chính hệ:
`docs/SPEC-NGON-NGU-CHI-DAN.md:104` — *"'Node' làm TÊN MODE chặng 3D là hợp lệ — ngoại lệ duy nhất"*.

### V4-c · Ba tín hiệu TẤT ĐỊNH (grep/AST — không AI)

| | Tín hiệu | Cách bắt | Bắt được ca nào ở trên |
|---|---|---|---|
| **TH1** | **từ trần, không định ngữ** trong `docs/phieu-giao/*.md` | regex thuần: có `tu` mà không có `dinh_ngu` nào trong ±1 câu | `nấc` · `card` · `lớp` — đúng chỗ đau nhất |
| **TH2** | **cùng gốc tên, khác vùng** (AST) | đếm khai báo `interface\|type\|const` chứa cùng gốc, gom theo thư mục cấp 2 của `lib/`; ≥2 vùng → báo | `Card` (3 vùng: `lib/dna` · `lib/render-studio` · `lib/adaptive-contrast`) · `Layer` (3 vùng) |
| **TH3** | **nhãn UI trần một từ** | chuỗi JSX/nhãn bằng đúng `"Lớp"`/`"Tầng"`/`"Khối"` không kèm bổ nghĩa | `khối` · `tầng` — nơi người dùng đọc ra hai thứ |

TH1 và TH3 là **regex thuần**, chạy được ngay trong cỗ máy hiện tại. TH2 cần đọc AST — đúng thứ
`may-soi-dong-dang` khai *"LÀM TRƯỚC ① và ④ — thuần AST không cần đoán"*
(`scripts/frontier-registry.mjs:280`). ⇒ **TH2 nên nằm ở `may-soi-dong-dang`, không nhét vào
`soi:tu-dien`** — nếu không, hai máy chồng việc nhau, đúng bệnh chúng sinh ra để chữa.

### V4-d · Máy KHÔNG thể bắt — phải để người

1. **Hai nghĩa có ĐÁNG tách hay không.** `panel` (a) và (c) khác nghĩa thật, nhưng tách ra có khi
   rối hơn để nguyên. Máy đếm được va chạm, không cân được chi phí.
2. **Đặt TÊN cho từng nghĩa.** Máy báo "có va chạm", tên thì phải người nghĩ và Hoà duyệt.
3. **Nghĩa nào là nghĩa GỐC được giữ chữ.** Ca `kính`: máy không biết vật liệu nội thất mới là
   chủ sở hữu chính đáng của chữ đó — biết được điều này phải hiểu IF bán cho ai.

### V4-e · CHI PHÍ — ước tính có cơ sở, và nói thẳng phần chưa chắc

Đếm thô số lần xuất hiện (`grep -oiI`, **không lọc định ngữ**, nên đây là **trần trên**, không
phải số sẽ báo đỏ):

| Từ | `docs/phieu-giao/` | `components`+`lib`+`app` |
|---|---|---|
| card | 94 | 1.314 |
| panel | 79 | 1.596 |
| khối | 36 | 972 |
| tầng | 34 | 779 |
| lớp | 46 | 756 |
| kính | 25 | 472 |
| nấc | 40 | 216 |
| module | 21 | 440 |

**Ước lượng sau khi lọc định ngữ:** phần lớn lần xuất hiện trong code nằm trong ngữ cảnh đã rõ
(tên tệp `LayerPanel.tsx`, biến `matId`) nên TH2/TH3 sẽ lọc còn **hàng chục, không hàng nghìn**.
Chỗ đau thật là **cột trái**: ~375 lần trong 3 phiếu đang mở. Nếu chỉ bật **TH1 cho
`docs/phieu-giao/`** với 4 từ 🔴 (`card` · `kính` · `nấc` · `khối`), tôi ước **50–120 chỗ báo**.
⚠️ Đây là **ước lượng, chưa chạy thử** — tôi không được sửa script nên không đo được số thật.

**Bật CẢNH BÁO, KHÔNG bật chặn.** Ba lý do:
1. Mốc hiện tại `soi:tu-dien` = **0 lệch**. Bật chặn là biến 0 thành hàng chục ngay lập tức, và
   chặn cả 3 phiếu đang chạy — trả giá lớn để đổi lấy một danh sách chưa ai duyệt.
2. Khác `TU_DIEN`: ở đó *"sai → đúng"* rõ ràng, sửa là xong. Ở đây **chưa có tên thay thế nào
   được Hoà duyệt** ⇒ chặn mà không có đường ra.
3. Lộ trình đúng: Hoà bấm bảng V5 → có tên → nạp từng từ vào `--strict` **theo từng từ đã duyệt**,
   không bật cả gói. Cùng kỷ luật *"thêm từ mới = thêm 1 entry lúc CHỐT TÊN"*
   (`scripts/soi-tu-dien.mjs:9`).

---

## V5 · BẢNG TRÌNH HOÀ DUYỆT — mỗi dòng một cái gật/lắc

> 🔴 lên đầu. **13 dòng** (trần 20). Mỗi dòng trả lời được bằng **gật / lắc**.
> Cột *"T khuyến nghị"* là đề xuất của phiên P-I sau khi đo, không phải điều đã quyết.

| # | Từ | Nghĩa hiện đang lẫn | Tên riêng đề xuất | Mức | Khuyến nghị |
|---|---|---|---|---|---|
| 1 | **khối** | ① node trên canvas (`SPEC-NGON-NGU-CHI-DAN.md:26,29`) ② khối 3D đặc (cùng tệp `:61,76`) | ① → **bước** · ② giữ **khối** | 🔴🔴 | **Gật.** Từ điển tự mâu thuẫn trong cùng một tệp; và nó đang lấy từ NGHỀ làm từ lóng — hướng nguy hiểm nhất |
| 2 | **kính** | ① vật liệu nội thất thật, có giá + vào BOQ (`lib/materials/material-edit.ts:29`) ② vibrancy giao diện (`app/globals.css:190`) | ① giữ **kính** · ② **nền mờ** | 🔴 | **Gật.** "Chỉnh độ trong của kính" hiện đọc ra hai vùng file khác hẳn |
| 3 | **mat-** (tiền tố) | ① `--mat-panel/card` = màu kính UI (`globals.css:191-195`) ② `matId` = mã vật liệu nối tới giá (`lib/cad/materials.ts:58`) | đổi `--mat-*` → **`--nen-mo-*`** | 🔴 | **Gật.** Cách nhau một dấu gạch, một bên là màu, một bên là tiền |
| 4 | **nấc** | ① mức chi tiết bấm được (`00-CHOT:1102`) ② mức cường độ (`:1015`) ③ cờ tin cậy dữ liệu, KHÔNG bấm được (`lib/dna/types.ts:88`) | ① **nấc chi tiết** ② **nấc cường độ** ③ **cờ tin cậy** | 🔴 | **Gật.** ③ phải bỏ hẳn chữ "nấc" — nó không phải thang người dùng trượt |
| 5 | **lớp** | ① lớp bản vẽ CAD (`lib/cad/model.ts:53`) ② phần tử z trong slide (`present-editor/LayerPanel.tsx:4`) ③ 8 trục Thẻ DNA (`lib/dna/types.ts:22`) ④ lớp luật/góp ý (`lib/review/types.ts:100`) | ① **lớp bản vẽ** ② **lớp slide** ③ **trục DNA** ④ **tuyến kiểm** | 🔴 | **Gật.** ①② cùng bộ thao tác ẩn/khoá/đổi thứ tự ⇒ mở nhầm tệp là sửa nhầm chặng, tsc vẫn xanh |
| 6 | **tầng** | ① tầng nhà kiểu Revit (`lib/cad/model.ts:171`) ② tier AI (`lib/ai/text-tier.ts:24`) ③ z UI (`globals.css:197`) ④⑤⑥ tầng sáng / tool / vai (docs) | ① giữ **tầng** · ② **bậc AI** · ③ **độ sâu** · ④ **kiểu sáng** · ⑤ **cấp tool** · ⑥ **cấp vai** | 🔴 | **Gật.** "Tầng" là từ nghề có nghĩa cứng — IF đang mượn cho 5 việc |
| 7 | **card** | ① vỏ giao diện (`globals.css:177`) ② thẻ dự án (`ProjectOverviewCard.tsx:104`) ③ Thẻ DNA (`lib/dna/types.ts:48`) ④ thẻ tác vụ (`task-cards.ts:15`) | ① **khung thẻ** ② **thẻ dự án** ③ **thẻ DNA** ④ **thẻ tác vụ** | 🔴 | **Gật.** "Card 3 nấc" hiện không phân biệt được sửa 1 component hay 4 schema |
| 8 | **[Đ1]** | mã điều khoản gán sai: `TRIET-LY-IF.md:70` [Đ1]=*hệ quả tầng trước*, `:72` [Đ2]=*nhìn-vào-trong-trước* — **12 chỗ ghi ngược**: 6 trong `docs/` (**3 là phiếu đang chạy**) + 6 trong **code** kể cả `frontier-registry.mjs:304,306` | sửa 12 chỗ về **[Đ2]** | 🔴 | **Gật.** Cơ chế chống mơ hồ đang tự trích sai, và đã vào comment code vĩnh viễn |
| 9 | **icon** | bảng 6 loại T đề xuất (`00-CHOT:1148-1156`) — đo lại: **3 có ca thật · 1 chỉ ở tầng nét vẽ · 1 chỉ trong mock · 1 KHÔNG có** | duyệt bảng nhưng **thành 7 loại** (thêm *Ảnh đại diện người*) | 🔴 | **Gật có sửa.** Xem #10, #11 trước khi bấm |
| 10 | **icon** ‹ký hiệu nghề› | T ghi là tài sản đang có; đo ra chỉ tồn tại như **nét vẽ trong bản vẽ** (`lib/cad/commands.ts:491`), thanh công cụ vẫn 11/11 lucide (`command-icon.tsx:13-16`) | khai lại là **việc CHƯA LÀM** | 🔴 | **Gật.** Không sửa thì phiên sau đi tìm bộ ký hiệu tưởng đã có |
| 11 | **icon** ‹loại 7› | `PresenceRow.tsx:53,71,85` ảnh đại diện người — không thuộc loại nào trong 6, luật riêng (không thay bằng chữ, có đường lùi, xếp chồng "+N") | thêm loại **Ảnh đại diện** | 🟡 | **Gật.** Đang sống thật, Hoà vừa nhắc 16/08 (`:1133`) |
| 12 | **module** | T xếp vào danh sách; đo ra code chỉ dùng nghĩa ES-module, docs chỉ 3 dòng cùng nghĩa — **hai nghĩa không bao giờ gặp nhau** | **BỎ khỏi danh sách** | ⚪ | **Lắc.** Vấn đề thật là #13, không phải đa nghĩa |
| 13 | **widget/element/node/module** | bốn tên cho **cùng một thứ** — `WidgetCard.tsx` · `present-editor` `elements:` · `lib/nodes/` · Hoà 16/08. Bằng chứng lệch đã lan: `WidgetCard.tsx:20` dùng token `--shadow-node` | chọn **MỘT** tên | 🔴 | **Gật.** Tín hiệu ④ `may-soi-dong-dang`; chốt `:1121` đã nói *"đừng đẻ ba kiểu"* — còn thiếu bước chọn tên |

### Nếu Hoà chỉ có băng thông cho BA dòng
**#1 (khối)** — nằm trong chính cuốn từ điển · **#5 (lớp)** — sửa nhầm chặng mà máy không bắt ·
**#8 ([Đ1])** — rẻ nhất, đang lan vào 3 phiếu chạy hôm nay.

---

## ✅ ĐÃ THI HÀNH — phiên P-K, 16/08

> Hoà duyệt **9 dòng 🔴** (`docs/00-CHOT.md:1177`). Dưới đây là phần đã vào máy/vào code.
> Báo cáo đầy đủ + số đo: `docs/bao-cao-phien/2026-08-16-P-K-tu-dien-may.md`.

| §V5 | Trạng thái | Bằng chứng |
|---|---|---|
| **#3 `--mat-*`** | ✅ **XONG** | đổi **114 dòng / 43 tệp** sang `--nen-mo-*`; `grep -- '--mat-'` trong `app`+`components`+`lib`+`scripts` = **0**. Giá trị màu giữ nguyên từng byte. ⚠️ `docs/mocks/` (622 dòng) và `docs/` nhật ký (690 dòng) **KHÔNG đổi** — mock bị phiên khác giữ, nhật ký thì cấm viết lại. ⚠️ Tên **CLASS** `.mat-*` (59 nơi) chưa đổi, ngoài phạm vi dòng #3 |
| **#8 mã điều khoản** | ✅ **XONG từ đợt trước** | P-K chỉ thêm **guard chặn tái phát**; chạy ra 0 hit. 🔴 Phát hiện thêm: `docs/00-CHOT.md:1163` trích `TRIET-LY-IF.md:69`/`:71` — **số dòng thật là `:70`/`:72`** (bản NC này ghi đúng). Chưa sửa vì `00-CHOT` nằm trong vùng cấm ghi của phiếu |
| **#1 #2 #4 #5 #6 #7 #13** | 🟡 **VÀO MÁY, CHƯA ĐỔI TÊN** | nạp thành lớp `TU_DA_NGHIA` mới trong `scripts/soi-tu-dien.mjs`, **mức CẢNH BÁO** — phát đầu **205 chỗ** dùng chữ trần trong `docs/phieu-giao/`: `card`/`thẻ` 72 · `khối` 33 · `nấc` 29 · `lớp` 27 · `tầng` 24 · `kính` 17 · `module` 3. Exit **0**, không chặn build |

**Lỗ máy soi mù `.md` (§V4-a) — ĐÃ VÁ.** Phạm vi quét `.md`: `docs/phieu-giao/` (59 tệp) +
`docs/mocks/` (3 tệp) = **62 / 561 tệp `.md`**. Loại trừ tường minh kèm lý do ghi trong code:
`CHANGELOG.md` · `docs/memory/` · `docs/bao-cao-phien/` · `docs/00-CHOT.md` · **chính tệp này**
(nơi định nghĩa các từ ⇒ dùng từ trần là đúng việc).

**Ba tên P-K thấy vướng khi bắt tay vào — nêu để Hoà biết, KHÔNG tự đổi:** `bước` (§V5 #1) đã bận
ở *"bước 1/4"*/`BuildOp`/*"bước thi công"* · `mảng` (§V5 #1 ③) đã bận nặng ở Grounded Render
(*"sinh từng mảng qua mask"*) và ở phân vùng mảng · `--nen-mo-hairline` là **đường kẻ** chứ không
phải nền (đã thi hành, tên hơi cấn).

**⛔ CỐ Ý KHÔNG LÀM:** không đổi tên KIỂU/UNION nào (`Layer` · `Card` · `Tang` · union trong
`lib/dna` · `lib/review` · `lib/cad/model.ts`). Bảng 8 cụm còn lại + số nơi dùng đo được + thứ tự
đề xuất nằm ở §V5 của báo cáo P-K, chờ T mở phiếu riêng.

---

## PHỤ LỤC · ĐÃ QUÉT GÌ, BỎ QUA GÌ

`docs/` đo được **554 tệp `.md` · 33 MB**. Không đọc hết, và không giả vờ đã đọc hết.

**Đã đọc kỹ:** `docs/00-CHOT.md` toàn bộ mục 16/08 (`:922-1159`) · `scripts/soi-tu-dien.mjs`
(65 dòng, hết) · `scripts/frontier-registry.mjs` 2 entry (`:87`, `:280`) ·
`docs/SPEC-NGON-NGU-CHI-DAN.md` phần từ điển (`:20-33`, `:61`, `:76`, `:93-104`) ·
`docs/TRIET-LY-IF.md` (`:14`, `:68-78`) · `docs/mocks/mock-bo-nen-chung.html` phần ba nấc
(`:165-190`) · `components/ui/command-icon.tsx` · `components/ui/Tooltip.tsx:25-70` ·
`components/ui/PanelFlank.tsx:1-25` · `lib/render-studio/task-cards.ts:1-40` ·
`lib/dna/types.ts:20-90` · `lib/review/types.ts` (grep) · `app/globals.css` các khối token.

**Quét bằng grep, KHÔNG đọc toàn văn:** `components/**` · `lib/**` · `app/**` cho 8 từ khảo sát.

**BỎ QUA HẲN:** `docs/nc/NC-NGUYEN-TAC-GIAO-DIEN-TOAN-APP-2026-08-14.md` (NT-1..18) và
`docs/nc/NC-TRIET-LY-GIAO-DIEN-2026-08-14.md` (KB-1..4) — ② phiếu bảo đọc, tôi **không đọc**,
vì đã có đủ ca thật từ code và 00-CHOT, và hai tệp đó là nơi ĐỊNH NGHĨA từ chứ không phải nơi
từ bị dùng lệch. **Rủi ro của việc bỏ qua:** nếu NT/KB đã định nghĩa sẵn tên riêng cho `card`
hay `nấc`, thì đề xuất tên ở V5 có thể trùng hoặc chọi — **phải đối chiếu trước khi thi hành.**

Cũng bỏ qua: `CHANGELOG.md` (220K) · `docs/bao-cao-phien/` trừ một tệp · toàn bộ `docs/memory/` ·
~540 tệp `.md` còn lại trong `docs/`.


---

## LỚP ③ — CẶP CHỮ ĐÁ NHAU (Hoà chỉ ra 29/08, và **sửa lại luật cùng ngày**)

### BA TRỤC — bảng chuẩn, Hoà chốt 29/08

Nói về "cài đặt sống ở đâu" thì phải nói đủ **ba trục rời nhau**. Thiếu một trục là chỗ hiểu sai chui vào:

| trục | hỏi gì | các giá trị |
|---|---|---|
| **① Owner** | của ai | `user` · `project` · `workspace` |
| **② Storage** | cất ở đâu | `localStorage` · `IndexedDB` · `DB` |
| **③ Reach** | **vươn tới đâu** | `browser-local` · `device-local` · `account-synced` |

**Câu nói đủ, mẫu để chép:**
> *"Thiết lập thuộc người dùng, lưu trong `localStorage`, chỉ có hiệu lực trên trình duyệt hiện tại."*

### #1 · `account-synced` ↔ `browser-local` — mâu thuẫn THẬT, mức CHẶN

Không thể cùng đúng: hứa **đổi máy vẫn còn** (trục ③) mà cất vào kho **chỉ sống trong một
trình duyệt** (trục ②).

### 🔴 BẢN ĐẦU CỦA MÁY ĐÃ SAI — giữ lại làm dấu vết

Tôi lấy cặp «`per-user` ↔ `localStorage`» làm mâu thuẫn. Hoà bác ngay trong ngày, bằng một
phản ví dụ phá được luật:

> *"`per-user` và `localStorage` không tuyệt đối loại trừ nhau. Dữ liệu có thể được phân vùng
> theo `userId` nhưng vẫn chỉ tồn tại trên một trình duyệt."*

Đúng: `per-user` trả lời **trục ①** (của ai), `localStorage` trả lời **trục ②** (cất ở đâu).
**Hai câu hỏi khác nhau thì không thể đá nhau.** Cổng cũ sẽ **báo đỏ oan** đúng câu mẫu ở trên.

⇒ Câu gốc `P-A-don-vi-ty-le.md:40` sai vì **THIẾU TRỤC ③**, không phải vì chứa `per-user`.
Nên nó xuống mức **🟡 nhắc "thiếu trục Reach"**, không chặn.

### Cổng và bằng chứng

Luật + hàm soi: `scripts/_cap-da-nhau.mjs` — **dùng chung** với `scripts/cap-da-nhau.test.ts`,
cố ý không để hai bản (test gọi bản sao thì nó chứng minh bản sao, không chứng minh luật).

`8 ok · 0 fail`, trong đó **có cả ca mong THẤY lẫn phản ví dụ của Hoà** (F-17: nhóm chỉ toàn
kỳ vọng phủ định là không tin được).

Ca đột biến trên repo thật: câu mâu thuẫn ⇒ **đỏ** · phản ví dụ ⇒ **im, không báo** ·
thiếu Reach ⇒ **nhắc mà không chặn** · ca gốc trong phiếu đã đóng ⇒ **miễn**.

**VAN AN TOÀN (Hoà đặt 29/08):** cặp mới chỉ được thêm khi có **ca thật · nguồn cụ thể ·
phản ví dụ · và một test chứng minh không báo nhầm**. Bốn thứ, thiếu một là không thêm.

---

## (bản đầu, đã bị đè — giữ để đối chiếu)

## LỚP ③ — CẶP CHỮ ĐÁ NHAU (Hoà chỉ ra 29/08)

Hai lớp cũ của sổ này nói về **một chữ**. Lớp thứ ba nói về **hai chữ đứng cạnh nhau mà loại
trừ lẫn nhau** — và nó **không mơ hồ**, nên máy chặn được, không cần người đặt tên hộ.

### #1 · `per-user` ↔ `localStorage` — trả giá 13 ngày

Câu gốc, `docs/phieu-giao/P-A-don-vi-ty-le.md:40` (16/08):

> *"Lưu lựa chọn **per-user** (**localStorage** cùng khuôn các cài đặt sẵn có — không thêm bảng DB)"*

| chữ | nghĩa thật |
|---|---|
| `per-user` | đi theo **NGƯỜI** — đổi máy vẫn còn (phải sống trong DB) |
| `localStorage` | ở lại **TRÌNH DUYỆT CỦA MÁY NÀY** — đổi máy là mất |

Người viết nghĩ mình đang dặn vế đầu. Máy làm đúng vế sau. **Không ai hỏi lại một dòng.**

**Đo 29/08:** 543 dòng `localStorage` trong `lib/ components/ app/` · **0 bảng cài đặt** trong
`prisma/schema.prisma` · ~9 khoá thuộc loại mất-là-đau (Brand Kit · bảng màu · đơn vị đo ·
ngôn ngữ · tên hiển thị). Đổi máy là mất sạch.

**Nó còn biết nguỵ trang:** `lib/lockscreen.ts:76` cất khoá là `interiorflow.lockIdleMinutes.<userId>`
— đính tên người dùng vào nên **đọc mã lên trông y như "theo người"**, trong khi vẫn nằm trong
trình duyệt. Ai soi nhanh sẽ gật đầu cho qua.

**Cổng:** `scripts/soi-tu-dien.mjs` lớp ③ — **CHẶN**, không cần cờ. Quét `docs/phieu-giao` ·
`docs/control` · `.claude/skills`.
Ca đột biến đã chạy: viết lại đúng câu gây bệnh ⇒ **đỏ** · nói rõ *"theo tài khoản, cất trong DB"*
⇒ **xanh** · ca gốc trong phiếu đã đóng vẫn được miễn ⇒ **xanh** (phiếu đóng thì không viết lại
lời khai của nó — giữ làm dấu vết).

**Cách chữa khi gặp:** không phải đổi chữ cho êm, mà **chọn một trong hai và nói thẳng ra**:
*"theo tài khoản, cất trong DB"* hoặc *"chỉ theo máy này, chấp nhận đổi máy là mất"*.
