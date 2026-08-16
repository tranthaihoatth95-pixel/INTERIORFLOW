# P-R · Hộp công cụ bám vật + cụm cửa sổ công cụ — báo cáo phiên

> Phiếu: `docs/phieu-giao/P-R-tool-bam-vat-tren-canvas.md` · mốc `544999f` · khuôn 6 phần `docs/CLAUDE.md`.
> Trong phiên T gửi **3 lượt nắn phạm vi** (cụm cửa sổ · ranh giới hai tầng · cửa sổ không cổng ra) — đã thi hành đủ cả ba.

---

## 1 · Tổng quan

Cửa sổ công cụ **thôi nổi TRÊN canvas, chuyển thành vật THUỘC canvas**: `ToolWindow` bỏ hẳn khung
`position:fixed` của riêng nó, trở thành mặt tiền mỏng gọi một **cụm** dùng chung (khung môi trường
+ panel vệ tinh). Kèm hộp công cụ bám vật đang chọn dựng bằng `NodeToolbar` có sẵn trong gói.
**V1 · V2 · V3 xong; V4 CẮT** vì cần sửa `components/FlowCanvas.tsx` — ngoài vùng phiếu.
`tsc` 0 · `npm test` 0 fail · 4 máy soi giữ đúng mốc · vòng tự đóng **đạt ở vòng 1/5**.

---

## 2 · Chi tiết từng mục

### ⓪b Tiền đề hạ tầng
`git log --oneline -1` → `544999f` · `git rev-list --count HEAD..main` → **0**. Không lệch, chạy tiếp.

### ⓪ Ba tiền đề nghiệp vụ — **XÁC NHẬN CẢ BA**, đo lại độc lập

| # | Phiếu nói | Đo được |
|---|---|---|
| 1 | xyflow v12.11.1 ship sẵn 3 addon, repo dùng 0 | ✅ `node -e require(...).version` → **12.11.1**; `ls .../additional-components/` → `EdgeToolbar` · `NodeResizer` · `NodeToolbar` (+Background/Controls/MiniMap); `grep` toàn `components lib app` → **0 dòng** |
| 2 | `ToolWindow` fixed · zIndex 31 · portal ra body | ✅ `:54,58,107` đúng nguyên văn; docstring `:15-17` tự thú *"1 window/lượt · KHÔNG kéo di chuyển · CHƯA nối subgraph"* |
| 3 | `InteriorNode` đã có 2 `<Handle>` | ✅ `:398` (target) · `:418` (source) |

### V1 · Hộp công cụ bám vật — `hopCongCuBamVat` ✅
`components/nodes/HopCongCuBamVat.tsx` (mới) — `NodeToolbar` + `ToolbarBar`/`ToolbarChip` đã hợp nhất
3 chặng. Hiện khi node được chọn, `position=Top`, `offset=10`. Năm lệnh: Chạy · Thu gọn · Mở cửa sổ ·
Nhân bản · Xoá. Nút mờ **bắt buộc kèm lý do**, đi `aria-describedby` (đường `ToolbarChip` vừa dựng
16/08), không đi `title`.

### V2 · Cụm cửa sổ công cụ — `masterToolTrongCanvas` ✅
**Tách khung khỏi ruột**, đây là chỗ [T2] ăn tiền:

| Tệp | Vai |
|---|---|
| `components/render-studio/CuaSoCongCu.tsx` (mới) | **CỤM**: khung môi trường + vệ tinh bám quanh (`trai`/`phai`/`duoi`). Ba biến thể `noi` (tháo rời, kéo cả cụm) · `neo` (trong canvas, **0 dòng `position:fixed`**) · `toanMan`. Không biết gì về node ⇒ dùng được ngoài chặng 2 |
| `components/render-studio/ThanCuaSoNode.tsx` (mới) | RUỘT cho mặt tiền node: `ParamField` + `NodeExtras` + `runNode()` — **0 bộ máy thứ hai** |
| `components/render-studio/ToolWindow.tsx` (đổi bản chất) | mặt tiền mỏng, 2 đường gọi: `cardId` → cụm **nổi** · `cardId+nodeId` → cụm **neo** |
| `components/nodes/ParamField.tsx` (tách ra) | cắt vòng import `InteriorNode → ToolWindow → Than → ParamField`. Re-export ở `InteriorNode` ⇒ 0 chỗ gọi cũ phải sửa |
| `lib/nodes/cua-so-cong-cu.ts` · `-ui.ts` (mới) | thang 3 nấc · ghim-trong-vùng · bảng môi trường · **bảng trạng thái theo khoá** (thay `useToolModeUi` singleton) |

- **Kéo**: pointer capture (chuột·bút·chạm một họ) + **phím mũi tên** dời cụm (16px, Shift ×4) — không có đường bàn phím thì "kéo được" chỉ đúng với người dùng chuột.
- **Đổi cỡ**: `NodeResizer` (có sẵn), chỉ hiện khi đang mở **và** đang chọn.
- **Nhiều cụm cùng lúc**: N node mở = N cụm, mỗi cụm đọc dữ liệu theo `nodeId`, chồng nhau có trên/dưới (`thuTu`).
- **Ranh giới hai tầng có MÁY GIỮ**: lệnh trong cửa sổ bắt buộc tiền tố `cua.<môi trường>.`; `lenhSaiKhongGian()` và `lenhDamChan()` phải luôn rỗng — **có test canh**, không phải lời dặn trong docstring.

### V3 · Cổng ra mang định nghĩa — `congRaDinhNghia` ✅ (phần thật) + khai phần chưa
`lib/nodes/dinh-nghia-ket-qua.ts` — ghép **loại · vai trò · nguồn gốc** từ dữ liệu **đã có**
(`PortDef.dataType` · `PortDef.label` · `defType` + dây nối). **0 trường mới, 0 đụng schema.**
Hai chỗ tiêu thụ thật: nhãn cổng ra trên node (thay `image` bằng *"Ảnh · Kết quả render · chờ chạy"*)
và dải chân cửa sổ có chấm màu theo kiểu dữ liệu.

### V4 · Nút `+` trên dây — **CẮT**
`EdgeToolbar` **bắt buộc** một edge type tự viết (nó cần `x`/`y` tâm dây từ `getBezierPath`).
`components/FlowCanvas.tsx:37` chỉ khai `nodeTypes`, **không có `edgeTypes`** — mà tệp đó **ngoài vùng
ghi** của phiếu. Làm được trong vùng chỉ còn cách tự viết định vị dây, đúng thứ phiếu cấm.
⇒ Cắt, không làm dở. Việc còn lại cho T: 1 edge type + 1 dòng `edgeTypes` ở `FlowCanvas`.

### V5 · Bản vẽ ✅
`docs/mocks/mock-tool-bam-vat.html` — `@dsCard group="Tool bám vật"`, 2 theme có nút gạt, token chép
nguyên văn `globals.css`, **0 hex ngoài khối khai token**, 1440×900 không tràn ngang.
Năm mục: hộp bám vật (chưa chọn ↔ đang chọn) · ba nấc · **hai môi trường khác loại (Ảnh ↔ Khối 3D)
đứng cùng canvas với MỘT thanh chung** · bảng ranh giới chung↔trong-cửa · **cửa sổ không có cổng ra**.
`node scripts/check-mocks.mjs` → **0 lỗi cho tệp này**.

### ⑥b Vòng tự đóng — đạt vòng 1/5

| Đích | Mốc | Kết |
|---|---|---|
| `tsc --noEmit` | 0 | ✅ 0 |
| `npm test` | 0 fail | ✅ 0 fail (test mới: **48 pass**) |
| `soi:frontier` | 0 lệch | ✅ 0 lệch |
| `soi:hinh-hoc` | giữ 10 | ✅ 10 (292 file, +4 tệp mới) |
| `soi:thao-tac` | giữ 31+193 | ✅ 31 + 193 — **tệp mới không dính chỗ nào** |
| `soi:tu-dien` | không tăng phần của mình | ✅ 252 (không đổi) |
| `grep NodeToolbar` > 0 | — | ✅ 4 chỗ (+`NodeResizer` 3 chỗ) |
| `ToolWindow` hết `position:fixed` nhánh trong-canvas | — | ✅ 0 dòng `position` trong cả tệp |
| Mở ≥2 cụm cùng lúc | — | ✅ theo kiến trúc (bảng theo khoá, không singleton) — **chưa chạy app thật**, xem ⑦b |

### Tự chấm bằng hai skill design
- **`design-critique`** bắt 2 lỗi thật, đã sửa: `gap: 2` **thiếu đơn vị** ⇒ CSS không hợp lệ, khai báo bị bỏ · nút `+` 26px lệch cỡ chạm với mọi nút khác ⇒ về `var(--tap)`.
- **`accessibility-review`** bắt 2 lỗi thật, đã sửa: `--t4` trên `--bg` đo **3,88:1** — dưới 4,5:1 của WCAG 1.4.3 cho chữ thường ⇒ đổi **token** sang `--t3` (**7,36:1**), không tự chế màu (L4); nút lệnh vệ tinh dùng `aria-disabled` nên **vẫn vào thứ tự Tab** ⇒ thêm `:focus-visible` (WCAG 2.4.7).

### Trích mã điều khoản `TRIET-LY-IF.md` (mở file đọc số)
`[T2]` **:18** một cỗ máy nhiều mặt tiền · `[N2]` **:60** đơn giản ngoài sâu trong · `[Đ2]` **:72**
nhìn vào trong trước. Phiếu ghi `[Đ2] :72` — **đúng**; `[N2]` phiếu để `:~`, số thật là **`:60`**.

---

## 3 · Tổng kết lại vấn đề

Gốc bệnh không phải "thiếu một cửa sổ đẹp hơn" mà là **cửa sổ đứng sai chỗ trong cây DOM**: portal ra
`document.body` thì nó vĩnh viễn không thể pan/zoom, không thể có cổng, không thể nối. Mọi giới hạn
docstring tự thú (1 window/lượt · không kéo · không nối) đều là **hệ quả của một dòng `createPortal`**,
không phải bốn việc riêng. Đưa nó về trong canvas là bốn giới hạn tan cùng lúc.

Thứ hai: **thang ba nấc và ranh giới hai tầng là hai luật khác nhau, dễ trộn**. Ba nấc nói *cửa sổ to
cỡ nào*; ranh giới nói *lệnh nào được ở đâu*. Trộn hai thứ sẽ ra thiết kế "mở to thì hiện thêm lệnh" —
tức bắt người dùng học hai bản đồ lệnh. Trong mã, hai luật nằm ở hai chỗ tách bạch và ranh giới có
test canh.

---

## 4 · Đánh giá khách quan

**Được**
- Bốn giới hạn cũ tan bằng một quyết định kiến trúc, không phải bốn miếng vá.
- Ranh giới "không đá nhau" thành **thứ máy bắt được** (`lenhDamChan()` rỗng · tiền tố `cua.<mt>.`), không phải câu dặn.
- 0 trường mới, 0 đụng schema, 0 chạm biên. `ParamField` tách ra mà 13 chỗ gọi cũ không sửa dòng nào.
- Cắt V4 có lý do đo được, không phải "hết giờ".

**Chưa được — nói thẳng**
- **Chưa chạy app thật một dòng nào.** Mọi kết luận về pan/zoom, định vị `NodeToolbar`, hai cụm chồng nhau đều là **đọc mã + đọc API xyflow**, chưa phải nhìn thấy.
- **Vệ tinh mang lệnh MỜ HẾT** — chưa lệnh nào nối bộ thi hành. Dây đã nối, chưa có dòng điện. Đúng luật §9 (mờ kèm lý do, không nút giả) nhưng phải khai là **khung chờ**, không phải tính năng chạy.
- **Đường cụm NỔI vẫn 1 cụm/lượt** vì `useToolModeUi` là singleton — trần của kho đó, không phải của khung; sửa phải vào `tool-mode-ui.ts`, ngoài vùng.
- `NodeResizer` ghi `width/height` vào node qua `applyNodeChanges` ⇒ **cỡ đã kéo đi vào bản lưu `.idf`**, trong khi *nấc* thì không. Hai nửa cùng một thứ đi hai đường — chưa hỏng gì, nhưng là chỗ lệch phải quyết.
- Môi trường `ban-bac` mới là **dòng khai**, chưa màn nào mở.

---

## 5 · Hướng xử lý — nhiều góc độ

**Hướng A — đi tiếp bề rộng**: mở V4 (`edgeTypes` + `+` trên dây) và nối cụm nổi vào 2D/Trình chiếu.
*Ưu*: thấy ngay ở nhiều chặng, đúng câu "sống ngoài node graph". *Nhược*: cộng thêm mặt chưa ai nhìn
bằng mắt — đúng cơ chế đẻ ra 70 việc xong-máy đối 1 việc qua mắt.

**Hướng B — đóng bề sâu trước**: chạy app thật, chụp 4 khung (chưa chọn · đang chọn có hộp · một cụm
mở · hai cụm nối nhau), bỏ vào `Drive/IF-duyet-mat/01-anh/`, rồi mới bàn tiếp.
*Ưu*: trả đúng món nợ đang là nút thắt, và bắt được loại lỗi mà `tsc`/test không bao giờ bắt (đè nhau,
vệ tinh tràn mép, kính chồng kính lúc zoom). *Nhược*: chậm hơn một lượt.

**Hướng C — nối dòng điện cho vệ tinh trước**: cho vài lệnh chuyên sâu chạy thật.
*Ưu*: vệ tinh thôi là khung chờ. *Nhược*: **đụng biên** — lệnh phải vào `lib/commands/registry.ts`,
và hợp đồng `CommandDef` đang đợi B1 của `TICKET-KIEN-TRUC-LENH-3-TANG`. Làm trước là đẻ sổ lệnh
thứ sáu, đúng thứ ticket đó sinh ra để dọn.

---

## 6 · Đề xuất — **hướng B**

Vì ba lý do, theo thứ tự sức nặng:

1. **Rủi ro lớn nhất của phiếu này nằm đúng chỗ mắt mới thấy.** Cụm có vệ tinh đặt tuyệt đối quanh
   khung; ở zoom nhỏ hoặc node sát mép, vệ tinh có đè nhau / tràn ra ngoài không thì **không máy nào
   trả lời được**. Đi tiếp bề rộng trên một nền chưa ai nhìn là nhân rủi ro lên, không chia nó ra.
2. **C đụng biên đang có chủ.** Nối lệnh vệ tinh trước B1 là tạo đúng cái sổ lệnh thứ sáu mà ticket
   lệnh 3 tầng đang đi dọn — trả giá hai lần cho một việc.
3. **B rẻ nhất và đúng cửa đang mở.** Cơ chế duyệt mắt qua Drive vừa chốt 16/08 và đang cần hàng;
   bốn khung ảnh là chi phí gần bằng không so với một lượt thi công.

Kèm theo, hai câu **chỉ Hoà trả lời được**, để sẵn trong lô duyệt mắt: ① vệ tinh nên **luôn hiện** khi
cụm mở, hay **thu vào một tay nắm** để canvas đỡ chật? ② cỡ đã kéo của cụm nên **theo bản lưu** (mở
máy khác vẫn đúng cỡ) hay **theo máy** như nấc mở/thu?
