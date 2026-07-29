# Hai giao diện · một dữ liệu · một cơ chế chung — KHÁM + TƯ VẤN

> Hoà giao: chặng 2 tồn tại **2 giao diện**, chuyển qua lại **không đổi dữ liệu** (giống CAD);
> Tool Mode tối ưu **cảm ứng**, ô to rõ, **bố cục bento** phân rõ nhóm chức năng; và tìm **1 cơ chế
> giao diện chung** cho mọi tính năng, phần khác nhau tự thích ứng theo từng tính năng.
>
> Khám code thật trước (Luật #4/#5). Tin tốt: **cả 3 thứ đều đã có mầm trong code** — trong đó cơ
> chế chung thì gần như xong.

---

## 1. "Giống CAD" — CAD đang làm đúng, đây là bản mẫu để copy

`components/cad/CadToolbar.tsx:243,345,377` — CAD có `ModeSwitch` đổi `cadMode` giữa **Sketch**
(cảm ứng) và **Pro**, **trên cùng 1 canvas, cùng 1 dữ liệu**. Kèm `CadTouchDock` làm cầu
*"nút = phím"* cho cảm ứng (`CadCanvas.tsx:2113`) — tức nút cảm ứng phát ra đúng phím tắt mà bản Pro
dùng, nên **2 giao diện chạy trên cùng một bộ lệnh**, không phải 2 nhánh code song song.

**Đây chính là mô hình cần bê nguyên sang chặng 2.** Bài học rút ra: 2 giao diện chỉ an toàn khi
chúng **cùng gọi một lớp lệnh bên dưới** — không phải 2 luồng riêng cùng làm 1 việc.

## 2. Chặng 2 — đã có 60% "một dữ liệu", nhưng có 1 lỗ rò thật

### Phần đã đúng

`RenderToolModeOverlay.tsx:4-8`, nguyên văn:

> *"`position: absolute; inset:0` che kín canvas bên dưới khi `view !== 'canvas'` — canvas **GIỮ
> NGUYÊN mounted (không mất state / không remount)**, chỉ lùi xuống sau nút Mở canvas."*

Và `ToolModeForm.buildOrUpdateGraph()` (dòng 54-69) **dựng node THẬT** (`input.image` → node AI, nối
cạnh, chạy qua `runNode()` cùng đường với canvas). Comment đầu file nói rõ: *"KHÔNG có luồng 'giả'
riêng cho Tool Mode"*. → Nền tảng "1 dữ liệu" **đã đúng về nguyên tắc**.

### Lỗ rò 1 — đổi thẻ là XOÁ SẠCH phiên

`ToolModeForm.tsx:33-39`:

```
useEffect(() => {
  nodeIdsRef.current = null;
  setAiNodeId(null);
  setImageDataUrl(null);      // ← ảnh vừa thả BAY MẤT
  if (def) setValues(defaultParams(def));
}, [cardId]);
```

Thả ảnh vào thẻ *Đổi ánh sáng*, đổi sang thẻ *Đổi phong cách* để thử → **mất ảnh, phải thả lại**.
Đúng nghĩa "đổi dữ liệu khi chuyển" mà Hoà muốn cấm.

### Lỗ rò 2 — đường 1 chiều

Tool Mode → canvas: ✅ chạy. Canvas → Tool Mode: ❌ **không có**. Đang sửa 1 graph trên canvas, bấm
về Tool Mode thì thấy màn chọn thẻ trắng trơn — graph vẫn còn đó nhưng giao diện kia **không đọc
được nó**. Hai giao diện nhìn cùng 1 dữ liệu thì phải **cùng đọc được**, không chỉ cùng ghi.

### Sửa — 3 việc, đều nhỏ

1. **Ảnh và tham số lên store dùng chung**, không nằm trong state riêng của form (`useState` cục bộ
   là gốc của lỗ rò 1). Đổi thẻ chỉ đổi *node AI đích*, **giữ nguyên node ảnh nguồn**.
2. **Canvas → Tool Mode đọc ngược**: nếu graph hiện tại khớp mẫu `input.image → 1 node ai.*` thì mở
   thẳng đúng thẻ đó ở dạng form; nếu graph phức tạp hơn thì hiện dòng *"Flow này có 6 node — Tool
   Mode chỉ hiện được 1 việc, mở canvas để xem đủ"*, **không im lặng hiện màn trắng**.
3. **Ghi thành luật**: chuyển giao diện **không bao giờ** được xoá dữ liệu. Có test bảo vệ.

---

## 3. Cơ chế giao diện chung — **IF đã xây xong 80%, chỉ chưa gọi tên**

Đây là phần quan trọng nhất. Hoà hỏi *"tìm cơ chế giao diện chung cho tất cả tính năng, phần khác
nhau thay đổi thích ứng theo đúng tính năng"*. IF **đã có đúng cơ chế đó**: `ParamDef`.

`lib/types.ts:9-25` — union 9 kiểu điều khiển:

| `kind` | Điều khiển | Dùng ở |
|---|---|---|
| `text` | ô chữ (có `multiline`) | prompt, tả vật liệu, motif |
| `select` | chọn 1 trong danh sách | phong cách, ánh sáng, tỉ lệ |
| `slider` | thanh trượt có min/max/step/default | guidance, bám sketch, giữ motif |
| `image` | thả ảnh | ảnh gốc, ảnh reference |
| `mask` | vẽ mask | sửa vùng |
| `smartmask` | chọn vùng thông minh (lưu giống `mask`) | chọn nhanh |
| `sketch` | vẽ nhanh | phác thảo |
| `annotate` | chú thích trên ảnh | ghi chú |
| `corners` | kéo 4 góc | sửa phối cảnh |

Và `ToolModeForm.tsx:152-156` **đã render tổng quát**:

```
{editableParams.map((p) => <ParamControl key={p.id} param={p} … />)}
```

**Nghĩa là**: mỗi tính năng chỉ khai báo *nó cần ô nào*, giao diện tự dựng. Thêm node mới **không
phải viết giao diện mới**. Đây đúng là "cơ chế chung, phần khác nhau tự thích ứng" — **đã chạy**.

### Còn thiếu 20% — 3 thứ cần thêm vào `ParamDef`

Hiện `ParamDef` chỉ mô tả **kiểu dữ liệu**, chưa mô tả **cách bày**. Thêm 3 trường tuỳ chọn (không
phá node cũ — thiếu thì rơi về mặc định):

| Trường mới | Kiểu | Để làm gì |
|---|---|---|
| `span?: 1 \| 2 \| 4` | độ rộng ô bento | ảnh chiếm 4, slider chiếm 1 — bento tự xếp, không cần bố cục tay cho từng node |
| `group?: string` | tên nhóm | gom "Chất lượng" / "Phong cách" / "Nâng cao" trong cùng 1 form dài |
| `advanced?: boolean` | ẩn mặc định | tham số kỹ thuật (guidance, seed) gập lại — đúng progressive disclosure |

→ **Một schema, ba bộ mặt**: bento cảm ứng · node trên canvas · form hẹp trên mobile. Ba renderer
đọc **cùng một `ParamDef`**. Không có nhánh code song song nào để lệch nhau.

---

## 4. Tool Mode — quy chuẩn 3 dải màn

**Bản đầy đủ (desktop) là bản gốc; 2 dải kia là bản rút gọn của nó** — không phải 3 thiết kế rời.

| Hạng mục | < 8" (ngón tay) | 8"–laptop/tablet lớn | Desktop màn lớn |
|---|---|---|---|
| Cột | 1 | 2 | **3** — điều khiển trái, ảnh xem trước lớn giữa/phải |
| Ảnh xem trước | dưới cùng, cuộn tới | cạnh điều khiển | **luôn thấy, lớn** — đây là thứ làm bản desktop "trông chuyên nghiệp" |
| Vùng chạm | ≥44px | **≥44px** (giữ nguyên) | **≥44px** (giữ nguyên — không thu nhỏ) |
| Hover · tooltip · chuột phải | không có (thiết bị không hỗ trợ) | **có** | **có** |
| Phím tắt | không | **có đủ** | **có đủ** |
| Đọc số chính xác (ô nhập số cạnh slider) | ẩn | có | có |
| Nút chạy | **dính đáy màn** | cuối cột điều khiển | cuối cột điều khiển |
| Node Mode | **khoá** (`useIsSmallScreenForCanvas()` đã có) | mở | mở |

**Bất biến qua cả 3 dải** — đây là phần không được phép khác nhau:

- Vùng chạm **≥44px** — ở mọi dải, kể cả desktop.
- **Cùng một `ParamDef`** dựng ra cả 3 → không có dải nào thiếu tính năng.
- Mọi việc làm được bằng chuột phải / hover **đều phải làm được bằng nút hiện sẵn**.
- Nút chạy luôn kèm **giá credit** và **độ phân giải đầu ra** (nối luật ≥300dpi).

### Nút đổi giao diện

> **SỬA 29/07 — Hoà bác đúng, tôi đã đề xuất sai chỗ.** Bản đầu tôi vẽ nút switch vào **thanh đầu**
> — tức là thêm 2 nút vào đúng cái thanh mà chính tôi vừa chẩn đoán là **đang tràn khung** (mục 01).
> Tự mâu thuẫn. Dưới đây là phương án đã sửa.

### Đối chiếu lại code: CAD KHÔNG đặt ở thanh đầu

`components/cad/CadToolbar.tsx` — chú thích đầu file ghi rõ đây là *"**Thanh công cụ NỔI dạng
pill** (gu GU-PROFILE §2: liquid-glass, bo tròn, đơn sắc + 1 accent đồng)"*, và `ModeSwitch` nằm
**bên trong pill đó** (dòng 243), **không nằm ở `Header.tsx`**.

→ Tiền lệ IF đã có sẵn đúng như Hoà nghĩ: **switch mode là chuyện riêng của từng chặng, sống trong
không gian làm việc của chặng đó — không leo lên thanh đầu toàn app.**

### Phương án đúng: pill nổi riêng của chặng 2, và **giảm** tổng số nút

Chặng 2 hiện chưa có thanh công cụ nổi nào — nên tạo 1 pill nhỏ, cùng ngôn ngữ liquid-glass với
`CadToolbar`, chứa **đúng 1 thứ**: switch 2 ô **▦ Bảng việc ⇄ ⁂ Canvas**.

**Quan trọng — đây là phép TRỪ, không phải phép cộng.** Pill này thay thế 2 điều khiển đang tồn tại:

| Bỏ đi | Ở đâu |
|---|---|
| link chữ *"Mở canvas (nâng cao) →"* | `ToolModeHome.tsx:103-121` |
| nút *"Mở canvas ▾"* | `ToolModeForm.tsx` (góc phải cột kết quả) |

Hai cái này vừa **trùng chức năng**, vừa **khác kiểu nhau**, vừa **chỉ đi được 1 chiều**. Thay bằng
1 pill 2 chiều → **thanh đầu không thêm gì, tổng số điều khiển giảm 1**.

| Hạng mục | Quy định |
|---|---|
| Vị trí | nổi góc **dưới-trái** vùng làm việc, phía trên `StatusBar` — tránh Vitals (giữa) và tên dự án (trái đáy) |
| Kiểu | liquid-glass pill, y hệt `CadToolbar` — cùng họ thị giác, người dùng nhận ra ngay |
| Phím tắt | `⌘\` — ghi luôn trong pill |
| Nhớ lựa chọn | đã có sẵn (`tool-mode-ui.ts` lưu localStorage) |
| Chặng 1 và 3 | **không đụng tới** — chặng 1 đã có switch riêng trong `CadToolbar`; chặng 3 không có 2 chế độ nên không cần |

---

## 4b. SỬA LẠI — Tool Mode KHÔNG phải "chỉ cảm ứng"

> **Hoà chỉnh 2 lần, tôi ghi sai 2 chỗ:**
> ① Tool Mode **không** dành riêng cho cảm ứng — laptop và tablet có bàn phím + chuột cũng dùng nó.
> ② Phân vai đúng **không phải theo 2 giao diện**, mà theo **3 dải kích thước màn**.
>
> Chỗ tôi sai về nguyên tắc: tôi cột "giao diện" vào "thiết bị". Sai. **Giao diện là lựa chọn của
> người dùng** (thích bảng việc hay thích canvas); **thiết bị chỉ quyết định độ dày đặc và cách
> nhập liệu**. Hai trục **độc lập**, không được trộn.

### Hai trục độc lập

**Trục 1 — Giao diện** (người dùng chọn, nhớ qua localStorage):

| | **Tool Mode · Bảng việc** | **Node Mode · Canvas** |
|---|---|---|
| Dùng khi | biết rõ muốn làm 1 việc cụ thể | ghép nhiều bước, phân nhánh, tái dùng flow |
| Chạy trên | **mọi thiết bị** | màn ≥ 8 inch (nhỏ hơn thì không thao tác nổi) |

**Trục 2 — Dải thiết bị** (máy tự nhận, người dùng đè được):

| Dải | Nhập liệu chính | Tool Mode trông thế nào | Node Mode |
|---|---|---|---|
| **< 8 inch** — điện thoại, tablet nhỏ | **ngón tay, không bàn phím** | Nghiêng hẳn cảm ứng: 1 cột, ô ≥44px, nút Render dính đáy, không hover, không chuột phải | **Khoá** — đã có sẵn `useIsSmallScreenForCanvas()` ép về Tool Mode (`RenderToolModeOverlay.tsx:32-34`) |
| **8" – laptop / tablet lớn có bàn phím** | **cả hai** — chạm *và* chuột + phím | 2 cột, ô vẫn ≥44px (ngón tay vẫn chạm được) **nhưng có đủ hover, tooltip, chuột phải, phím tắt** | Mở, đủ phím tắt |
| **Desktop màn lớn** | chuột + bàn phím | **Bản đầy đủ**: 3 cột, ảnh xem trước lớn ngay trong thẻ, đọc số chính xác, mật độ dày — trông chuyên nghiệp | Mở, đầy đủ |

### Luật thiết kế rút ra — quan trọng nhất mục này

**Chạm và chuột KHÔNG loại trừ nhau — phải cùng chạy trên một giao diện.** Cụ thể:

1. **Vùng chạm ≥44px giữ ở MỌI dải.** Nút to không làm chuột khó bấm; nút nhỏ thì ngón tay không
   bấm nổi. Không có lý do gì phải thu nhỏ nút cho desktop.
2. **Hover và chuột phải là LỚP THÊM, không bao giờ là đường duy nhất.** Máy có chuột thì được thêm
   tooltip + menu phải; máy cảm ứng vẫn phải làm được đúng việc đó bằng nút hiện sẵn.
3. **Phím tắt luôn bật** ở mọi dải ≥8 inch — laptop dùng Tool Mode vẫn phải gõ được `⌘↵` để Render.
4. **Cái đổi theo dải màn là MẬT ĐỘ, không phải chức năng.** 1 cột → 2 cột → 3 cột; không dải nào
   bị cắt mất tính năng.
5. **Máy tự đoán, người dùng đè được.** Đoán theo `pointer: coarse/fine` + bề rộng; nhưng luôn có
   nút đổi, và nhớ lựa chọn.

> Đây chính là mô hình `CadTouchDock` đã làm ở chặng 1 — cầu *"nút = phím"*: nút cảm ứng phát ra
> đúng phím tắt mà bản phím-chuột dùng. **Một lớp lệnh, hai cách gọi, chạy song song trên cùng một
> màn** — không phải hai giao diện tách đôi theo thiết bị.

### Bảng cũ (giữ làm tham chiếu) — khác biệt phím/chuột vs chạm

| | Chạm | Phím + chuột |
|---|---|---|
| Chọn nhiều | chạm từng cái | **kéo khoanh vùng** · Shift-click |
| Di chuyển màn | 2 ngón kéo | **Space + kéo** · chuột giữa |
| Zoom | chụm 2 ngón | **con lăn** |
| Ngữ cảnh | nút hiện sẵn | **chuột phải** · hover tooltip |
| Tốc độ | tuần tự | **phím tắt** |

### Bộ phím/chuột tối thiểu cho Node Mode (chuẩn ngành — ComfyUI · Figma · Blender đều vậy)

| Thao tác | Phím/chuột |
|---|---|
| Kéo màn | giữ **Space** + kéo · hoặc chuột giữa |
| Zoom | **con lăn** · `Ctrl` `+/−` |
| Vừa màn hình | `Shift` `1` |
| Chọn nhiều | kéo khoanh vùng · `Shift` click |
| Xoá node | `Delete` / `Backspace` |
| Nhân bản | `Ctrl` `D` |
| Hoàn tác / làm lại | `Ctrl` `Z` / `Ctrl` `Shift` `Z` |
| Chạy node đang chọn | `Ctrl` `Enter` |
| Chạy cả flow | `Ctrl` `Shift` `Enter` |
| Thêm node | **chuột phải** ra menu · hoặc gõ `Tab` mở ô tìm node |
| Đổi giao diện | `Ctrl` `\` |

> **Luật ngầm bắt buộc — học từ `CadTouchDock`**: mọi phím tắt phải phát ra **đúng lệnh** mà nút cảm
> ứng bên Tool Mode gọi (`CadCanvas.tsx:2113` gọi đó là cầu *"nút = phím"*). Nếu Node Mode có phím
> tắt gọi hàm riêng, 2 giao diện sẽ lệch nhau sau vài tháng. **Một lớp lệnh, hai cách gọi.**

### Điều kiện tự chọn giao diện

`tool-mode-ui.ts` đã có `useIsSmallScreenForCanvas()` **ép** màn ≤7 inch ở Tool Mode
(`RenderToolModeOverlay.tsx:9-11,32-34`) — đúng, giữ nguyên. Bổ sung: mặc định lần đầu nên chọn theo
**thiết bị con trỏ**, không chỉ theo bề rộng — máy có chuột (`pointer: fine`) mở thẳng Node Mode;
máy cảm ứng (`pointer: coarse`) mở Tool Mode. Sau đó **tôn trọng lựa chọn của người dùng**, không
ép lại (cơ chế nhớ lựa chọn qua localStorage đã có sẵn).

---

## 5. Xếp hàng (Luật #8b)

| Mã đề xuất | Việc | Chi phí | Xếp vào |
|---|---|---|---|
| `2.2.77` | **Bịt 2 lỗ rò dữ liệu** — ảnh/tham số lên store chung; canvas → Tool Mode đọc ngược được; test bảo vệ | Rẻ-trung bình | **Sprint 3, LÀM TRƯỚC** — bento xây trên nền rò rỉ thì phải xây lại |
| `2.2.78` | **Mở rộng `ParamDef`**: `span` · `group` · `advanced` + gán cho 45 node | Rẻ (thuần schema + điền dữ liệu) | Sprint 3, sau 2.2.77 |
| `2.2.79` | **Renderer Tool Mode 3 dải màn** (1/2/3 cột) đọc `ParamDef` mở rộng — vùng chạm ≥44px bất biến, hover/chuột phải/phím tắt là lớp THÊM ở dải ≥8", không dải nào thiếu tính năng | Trung bình | Sprint 3, sau 2.2.78 |
| `2.2.80` | **Pill nổi switch mode RIÊNG chặng 2** (không đụng thanh đầu) — thay thế link *"Mở canvas (nâng cao)"* + nút *"Mở canvas ▾"*, phím `⌘\`, mặc định theo `pointer: fine/coarse` | Rẻ — **net −1 điều khiển** | Sprint 3, cùng 2.2.79 |
| `2.2.81` | **Bộ phím/chuột Node Mode** (11 phím tắt bảng §4b) — bắt buộc gọi CÙNG lớp lệnh với nút cảm ứng, theo mẫu cầu "nút = phím" của `CadTouchDock` | Trung bình | Sprint 3, cùng 2.2.80 |

**Thứ tự bắt buộc**: 2.2.77 → 2.2.78 → 2.2.79 + 2.2.80. Đây cũng là thứ tự "sửa nền trước, xây mặt
tiền sau" — làm ngược thì bento vừa xây xong đã phải sửa lại vì dữ liệu vẫn rơi.

**Ghi chú xếp hàng**: cụm 2.2.77-80 này **phải đi trước** `2.2.71` (màn chọn 4 nhóm) và `2.2.62`
(tái cấu trúc Tool Mode) — vì cả hai đều là *giao diện dựng trên cơ chế này*. Nếu Claude Code đã bắt
đầu 2.2.62 rồi thì dừng, làm 2.2.77-78 trước.

---

*Cowork, 29/07/2026. Đã đọc: `lib/types.ts:9-25`, `ToolModeForm.tsx:19-69,150-160`,
`RenderToolModeOverlay.tsx`, `CadToolbar.tsx:243,345-380`, `CadCanvas.tsx:2113`. Mã 2.2.77-2.2.80 là
ĐỀ XUẤT — Claude Code kiểm tra trùng số trước khi dán.*
