# LANE C — nghiệm thu 2D/3D/Trình chiếu ở TIỀN CẢNH + empty-state nguồn-liên-kết

**Ngày** 20/08 · **Mốc** `c7f3ac8` · **Server** `http://localhost:3001` (không restart, không git, không prisma)
**Dự án thử** `cmt10d9lg0016w9rbvnkt9xh3` — “Mặt bằng · Studio 48m²”

---

## ⓪ TIỀN ĐỀ — bằng chứng TIỀN CẢNH (đọc dòng này trước mọi kết luận về canvas)

Lượt trước chạy trong tab ẩn ⇒ `requestAnimationFrame` không có nhịp ⇒ mọi kết luận về canvas vô giá trị.
Lần này chạy Playwright **headed** (`headless: false`, cửa sổ thật 1600×1000, profile
`~/.if-phien-chup-man`). Mỗi màn đo lại trạng thái hiển thị **ngay tại màn đó**, không suy từ màn khác:

| Màn | `document.visibilityState` | `document.hidden` | nhịp `rAF` / 500ms |
|---|---|---|---|
| `/` | `visible` | `false` | 57 |
| `/projects/:id/cad` | `visible` | `false` | 61 |
| `/projects/:id/render` (Node) | `visible` | `false` | 56 |
| `/projects/:id/render` (Vẽ 3D) | `visible` | `false` | 61–64 |
| `/projects/:id/present` | `visible` | `false` | 63 |

≈ 120 nhịp/giây ở mọi màn ⇒ **rAF có nhịp thật**, đạt điều kiện nghiệm thu canvas.
(`hasFocus() === true` ở lượt đo đầu.)

---

## ① TRẢ MAIN — ba kết luận

| | Kết luận |
|---|---|
| **2D foreground** | **PASS** (1 gap của Thư viện, không thuộc 2D) |
| **3D foreground** | **PASS** ở vẽ/xoay/zoom · **FAIL ở PHẢN HỒI KHI CHỌN** (bấm vào khối không có viền chọn, không panel nào nêu tên khối đang chọn) |
| **Trình chiếu** | **PASS** sau khi vá — trước khi vá thiếu mô hình nguồn-liên-kết + có một chỉ dẫn trỏ vào hư không |

---

## ② VIỆC 1 — số đo từng mục

### 2D (`/projects/:id/cad`)

| Mục | Số đo | Kết |
|---|---|---|
| Canvas **vẽ ra pixel** (đọc `getImageData`, không phải chỉ thấy thẻ `<canvas>`) | backing **2107×1214**, **2.557.898/2.557.898 pixel `alpha ≠ 0`**, **12 màu riêng biệt** (lưới + nền) | ✅ |
| Vẽ tường: `W` → `Enter` → 2 lần bấm → `Enter` | `tool` `select`→**`wall`**; entity **0 → 2** (`hatch` 1 poché + `polyline` 1); màu canvas **12 → 88** | ✅ |
| Chọn đối tượng | bấm lên tường → `selection.length` = **2**, inspector hiện “2 đối tượng” + panel BIM·IFC | ✅ |
| Thả món từ Thư viện | 3/3 món khớp tên thả được, mỗi món **+1 entity** | ✅ (xem gap dưới) |

Thả từ Thư viện, nguyên văn câu app báo:
- `Sofa 3 chỗ` → Δ+1 · *“Đã thả "Sofa 3 chỗ" vào giữa màn hình — ⌘Z để lùi.”*
- `Cửa sổ trượt` → Δ+1 · *“Đã thả "Cửa sổ trượt" vào giữa màn hình — ⌘Z để lùi.”*
- `Bàn ăn 6 ghế` → Δ+1 · *“Đã thả **"Bàn ăn 6" (gần đúng với "Bàn ăn 6 ghế")** — kiểm lại trước khi dùng.”*
  → khớp gần đúng **có khai ra**, đúng luật khai-thật.

### 3D (`/projects/:id/render` → bật “Vẽ 3D”)

| Mục | Số đo | Kết |
|---|---|---|
| Viewport vẽ ra pixel | canvas **1104×1009 WebGL** + ViewCube **95×95**; ảnh canvas **542.647 byte** nội dung thật (2 tường + sàn dựng lên từ bản vẽ 2D) | ✅ |
| Xoay camera (kéo chuột trái) | sha1 ảnh canvas `f3cdbe5bf3bb` → `953bc2c47c31` — **đổi** | ✅ |
| Zoom (cuộn) | `953bc2c47c31` → `e024a62ef79e` — **đổi** | ✅ |
| **Chọn khối** — xem ô riêng ngay dưới | không có phản hồi chọn nào | ❌ |
| Món đặt từ 2D hiện ra ở 3D | panel Tầng liệt kê **Sàn · Tường 1 · Tường 2** = 3 khối, khớp đúng thứ vẽ ở 2D | ✅ |

**Ca “chọn khối” — đo hai lượt, kết luận đã siết lại (không lấy lượt đầu làm chuẩn):**

- Lượt 1 (camera zoom sát, một mặt tường phủ kín màn): bấm giữa viewport → sha1 ảnh canvas
  `e024a62ef79e` → `e024a62ef79e`, **không đổi một pixel nào**.
- Lượt 2 (bấm “Toàn cảnh” trước, thấy trọn 4 tường + sàn, bấm 3 điểm khác nhau): pixel **CÓ đổi**
  cả 3 lần — **nhưng** soi ảnh thì thứ đổi là **tooltip hover “Lưới sàn”** hiện cạnh con trỏ,
  **không phải viền chọn**: không khối nào đổi màu/viền, panel Tầng không đánh dấu khối nào,
  và chữ duy nhất đọc được vẫn là câu mô tả chung *“Khối xám · chưa vật liệu”* — không có tên khối.

⇒ Kết luận đúng: **bấm trong viewport 3D không cho phản hồi chọn nào**. Pixel đổi ở lượt 2 giải
thích được bằng hover, nên **không** được dùng làm bằng chứng “chọn chạy”. Chưa phân định được
state bên trong có đổi hay không — xem ⑦b.

**🔧 Đính chính một hiểu nhầm của chính LANE C:** vài lượt đo thấy “màn 3D không có canvas nào”.
Nguyên nhân **không phải** cảnh rỗng: “Vẽ 3D” là **công tắc có nhớ trạng thái**
(`aria-pressed="false"` khi tắt) — lượt trước tắt thì lượt sau vào vẫn tắt. Bật lên là canvas
hiện ngay (2 canvas: viewport + ViewCube). Đừng ghi đây là lỗi.

### Trình chiếu (`/projects/:id/present`)
Đã có sẵn cửa vào tử tế (`PresentDocTypePicker`: 6 loại hồ sơ, 4 mẫu/loại, thẻ *Tạo hồ sơ trống*,
mẫu chưa làm được thì khoá + nêu lý do). Hai lỗ đã vá — xem §④.

---

## ③ HAI VIỆC NGOÀI VÙNG — ghi file:dòng, **không tự sửa**

### 🔴 N-1 · Kệ “Ký hiệu · khối” quảng cáo 12 món mà **3/6 món hàng đầu không thả xuống được**

Thả `Cửa 1 cánh 800`: sự kiện `if:library-instantiate` bắn đúng, bridge **nhận việc**
(`claimed: true`), nhưng **Δ = 0 entity**. Thanh trạng thái nói thật, nguyên văn:

> *“Chưa có hình vẽ cho "Cửa 1 cánh 800" — kho block chưa có món này. Dùng panel Nội thất để chọn block gần đúng.”*

**Gốc bệnh = LỆCH TÊN giữa hai danh sách**, không phải thiếu hình:

| Kệ khai (`lib/library/shelves.ts:167-169`) | Kho block có (`lib/cad/furniture.ts:486+`) | Khớp? |
|---|---|---|
| `Cửa 1 cánh 800` · `DOOR-S-800` | `doorRoom` = **“Cửa mở 800 (cửa phòng)”** | ❌ |
| `Cửa 2 cánh 1600` · `DOOR-D-1600` | `doubleDoor` = **“Cửa 2 cánh”** | ❌ |
| `Cửa sổ trượt` · `WIN-SL-1800` | `slidingWindow` = **“Cửa sổ trượt”** | ✅ |
| `Sofa 3 chỗ` · `SOFA-3S` | `sofa3` = **“Sofa 3 chỗ”** | ✅ |
| `Bàn ăn 6 ghế` · `TBL-D6` | `dining6` = **“Bàn ăn 6”** | ✅ gần đúng |
| `Giường 1m6` · `BED-160` | `queen-1500` / `king-1800` | ❌ |

Hình CÓ ĐỦ (`doorRoom` chính là cửa 800). Chỉ là resolver khớp theo **TÊN**
(`normalizeKey`, `lib/cad/library-item-resolve.ts:76`) mà hai bên đặt tên khác nhau, còn **mã**
(`DOOR-S-800` ↔ `doorRoom`) thì không có bảng nối nào.
Vùng phải sửa: `lib/library/shelves.ts` hoặc `lib/cad/library-item-resolve.ts` — **cả hai ngoài vùng LANE C**.

⭐ Điểm sáng đáng ghi: app **không nói dối**. Cơ chế `claimed` (`LibraryDropBridge.tsx:170`) làm
đúng việc nó sinh ra để làm — thất bại được nói ra, không có toast “đã tạo xong” giả.

### 🟡 N-2 · Doc 2D nạp xong sau ~13–14 giây; trong khoảng đó app **im lặng nói “trống”**

Đo lặp 4 lượt: mở `/projects/:id/cad`, `__cadStore.doc.entities.length` đứng **0** suốt ~13s rồi
mới nhảy lên số thật (nguồn là IndexedDB — `saveSheets`/`loadSheets`, `CadSheets.tsx:790+`).
Trong cửa sổ đó **không có chỉ báo đang-nạp nào**: bản vẽ trống trơn, thanh trạng thái im.

Rủi ro thật, không phải chuyện thẩm mỹ: người dùng mở dự án, thấy trống, vẽ đè lên → autosave
debounce chạy → có đường ghi đè bản vẽ cũ. LANE C **không tái hiện được mất dữ liệu** trong phiên
này (mọi lượt kết thúc đúng số), nên khai đây là **rủi ro suy ra từ cơ chế**, chưa phải sự cố đã xảy ra.
Vùng: `components/cad/CadSheets.tsx` (trong vùng LANE C) nhưng đường sửa đúng là chỉ báo nạp cấp
màn — đụng `components/studio/StatusBar.tsx` (**LANE A**) ⇒ để MAIN quyết ai làm.

---

## ④ VIỆC 2 — Trình chiếu: empty-state có chủ đích

### Hai lỗ đo được (tiền cảnh, dự án rỗng)
1. Màn trống bày **thư viện mẫu** rất tử tế nhưng **không chỗ nào nói hồ sơ lấy số/hình TỪ ĐÂU** —
   người dùng đứng trước kho mẫu mà không biết mẫu được nuôi bằng gì, nên không hiểu vì sao mở ra trống.
2. Ổ Navigator trái in *“Chuyển trang ở dải thumbnail dưới canvas”* trong khi **0 slide và 0 canvas** —
   chỉ dẫn đúng ngữ pháp, **trỏ vào hư không**.

### Đã làm
**`components/present-editor/NguonLienKet.tsx` (mới)** — khối “HỒ SƠ NÀY LẤY TỪ ĐÂU”, 4 nguồn,
mỗi nguồn nói ba điều: *tên · số thật · nó góp gì vào hồ sơ*. Dưới đầu đề, trước lưới mẫu (người
dùng đọc “lấy từ đâu” **trước** khi chọn mẫu).

**NO-REBUILD** — mọi con số đọc từ cỗ máy đang chạy, không dựng kho thứ hai:
- `getProjectDoc()` (`lib/present-editor/project-doc.ts:52`) — **cùng đường BOQ trong Trình chiếu vẫn đi**
- `docToObjScene().groups.length` (`lib/three/cad-to-obj.ts:566`) — **cùng engine màn 3D dựng cảnh**
- `POST /api/boq/:projectId` — **cùng đường `BoqScreen` đi**

**`components/present-editor/ho-so-status.ts` (mới, 27 dòng)** — cờ “đã có hồ sơ chưa” cho
Navigator (là **anh em** của `PresentSheets`, không phải con). Đúng khuôn `lib/present-editor/play-status.ts`
đã dùng cho ca y hệt (cờ `playing` cho StatusBar) — một cờ, một `set`, không state-lift xuyên lớp.
Điều kiện `dangOThuVienMau` khai **một lần** rồi dùng cho **cả** cờ lẫn điều kiện mount picker —
không chép công thức ra hai nơi để chúng phân kỳ.

### Nghiệm thu trên app thật — hai trạng thái

**A · dự án RỖNG** — cả 4 nguồn = 0, mỗi ô có lý do thật + MỘT hành động kế tiếp:
```
Bản vẽ 2D        0 đối tượng    → Chưa có gì. Sang Thiết kế 2D vẽ trước →
Khối 3D          0 khối         → Chưa có gì. Sang Thiết kế 3D dựng khối →
Vật liệu         0 mã đang dùng → Chưa có gì. Gán vật liệu ở Thiết kế 2D →
Khối lượng (BOQ) 0 dòng         → Chưa có gì. Cần bản vẽ có vật liệu để ra số →
```
Navigator đổi đúng câu: *“Chưa chọn hồ sơ — chọn một mẫu ở giữa màn, danh sách trang sẽ hiện ở đây.”*

**B · sau khi vẽ 2 đoạn tường ở 2D** (không sửa gì thêm, chỉ quay lại Trình chiếu):
```
Bản vẽ 2D        4 đối tượng    (hết dòng lý do, hết aria-describedby)
Khối 3D          3 khối         (hết dòng lý do)
Vật liệu         0 mã đang dùng → vẫn nêu lý do thật
Khối lượng (BOQ) 0 dòng         → vẫn nêu lý do thật
```
⭐ **Số “3 khối” khớp ĐÚNG panel Tầng của màn 3D (Sàn · Tường 1 · Tường 2)** — cùng một engine,
hai mặt tiền, không phải hai phép đếm.

### Ràng buộc đã tuân
- **Cấm bịa %**: lúc chờ BOQ dùng `LightBar` **bỏ trống `value`** ⇒ nhánh không-đo-được của
  `lib/ui/tien-trinh.ts`, không phát ra con số nào (`aria-valuenow` tự bị bỏ).
- **Nút mờ**: `aria-disabled` + `aria-describedby` trỏ tới phần tử **có chữ thật** (đo trong DOM:
  4/4 `aria-describedby` resolve ra text khi rỗng, tự biến mất khi có số). Không dùng `title`.
- **Token**: `--r-2`/`--r-3` (đúng thang 6/10/14/20) · `--card`/`--border`/`--t1..t4`/`--accent` ·
  `--mo-vo-hieu` cho trạng thái chưa-đo-xong. **0 hex cứng** (grep + đo DOM đều sạch).
- **Không canvas trắng trơn**, không nút giả, không hứa tất định.

---

## ⑤ DỌN DỮ LIỆU THỬ — đếm trước = sau

Doc 2D lưu ở **IndexedDB của profile trình duyệt thử**, không phải DB dùng chung.

| Mốc | Số entity |
|---|---|
| Trước khi LANE C chạm vào (đo sau khi doc nạp xong) | **0** |
| Cao nhất trong lúc thử (2 tường + 3 món thả) | 4 |
| **Sau khi dọn, kiểm bằng cách nạp lại trang** | **0** |

Một lượt chạy bị đứt giữa chừng (nav timeout) để lại **8 entity**; lượt kế dọn về **0** và xác
nhận bằng reload. Kiểm **4 lần độc lập** ở 4 lượt chạy khác nhau, lần nào cũng về **0**. Không đụng DB dùng chung
(không prisma, không migration). Không tạo/xoá dự án.

---

## ⑥ VERIFY

| | |
|---|---|
| `npx tsc --noEmit` | **0 lỗi** |
| test nhóm Trình chiếu (42 file) | **toàn bộ pass, 0 fail** |
| `lib/boq/compute.test.ts` | 160 pass · 0 fail |
| `lib/cad/library-item-resolve.test.ts` | 57 ok · 0 fail |
| `npm run soi:frontier` | **🔴 0 LỆCH** (76 xong-máy · 57 chờ) |
| `npm run soi:hinh-hoc` | 26 ngoài thang — **nợ cũ, file mới không dính** |
| `npm run soi:thao-tac` | 4 lệch — **nợ cũ nguyên si** (32 focus-visible · 187 hex); 3 file LANE C **sạch cả hai** |

---

## ⑦b CHƯA CHẮC / CHƯA KIỂM — khai thẳng

1. **Chọn khối 3D: đã đo là KHÔNG có phản hồi, CHƯA đo là state có đổi hay không.** Có thể app
   *có* chọn mà chỉ không vẽ viền/highlight. Phân định được bằng cách đọc
   `useTree3DUi.selectedName` sau cú bấm — kho đó **không expose ra `window`** nên không đọc
   được từ ngoài như `__cadStore`; **chưa làm**. Kết luận đúng vẫn là *“bấm trong viewport 3D
   không cho phản hồi chọn nào”*, chưa phải *“chức năng chọn hỏng”*.
2. **Chỉ đo Chromium**, một cỡ cửa sổ 1600×1000, **chỉ theme sáng**. Chưa mở theme tối, chưa
   `prefers-reduced-motion`, chưa trình đọc màn hình thật, chưa khổ hẹp.
3. **`NguonLienKet` chưa thử ở dự án có vật liệu và có BOQ ≠ 0** — hai ô đó mới chỉ chạy qua
   nhánh 0. Nhánh BOQ lỗi mạng (`boqLoi`) **chưa kích hoạt lần nào**, chỉ đọc mã.
4. **Nhánh `LightBar` chờ-BOQ hiếm khi thấy được** — máy chạy nhanh nên nó thoáng qua; chưa
   chụp được nó ở trạng thái đang chạy.
5. **N-2 (nạp 13–14s) là số đo trên máy này, profile này, dự án này.** Chưa tách được bao nhiêu
   phần là IndexedDB, bao nhiêu là dev-server biên dịch lười.
6. Bảng lệch-tên ở N-1 dựng từ **6 món đầu** của kệ; **6 món còn lại (12 mục) chưa soi từng cái**
   ⇒ con số “3/6 hỏng” là mẫu, không phải kiểm toán đủ kệ.
7. Cleanup xác nhận “về 0” bằng `__cadStore` sau reload; **chưa mở thẳng IndexedDB** để chắc
   không còn bản ghi mồ côi ở sheet khác.

## ⑦c HẠN DÙNG KẾT LUẬN

- **Số đo hiển thị/rAF**: đúng cho phiên headed này. Đổi cách chạy (headless, tab nền, CI) là
  **vô hiệu toàn bộ** kết luận canvas — phải đo lại.
- **N-1 (lệch tên kệ↔kho)**: hết hiệu lực ngay khi ai sửa `shelves.ts` hoặc resolver. LANE B đang
  đứng ở `components/library/**` ⇒ khả năng đổi cao.
- **N-2 (13–14s)**: hết hiệu lực khi build production hoặc khi đường nạp doc đổi.
- **“Trình chiếu PASS”**: đúng cho **màn trống**. Đường trong hồ sơ (dàn trang, xuất PDF/PPTX)
  **chưa đụng tới** trong phiên này.
