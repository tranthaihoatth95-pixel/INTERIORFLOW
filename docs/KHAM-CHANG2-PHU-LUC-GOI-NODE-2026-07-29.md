# Phụ lục — "Gói combo node" + "Node xuất cuối" cho canvas chặng 2

> Nối tiếp `KHAM-CHANG2-RENDER-2026-07-29.md`. Ý Hoà: *hero của giao diện node = những **combo
> node gói sẵn**, 1 gói = 1 flow sản phẩm đầu ra; kéo thả vào màn hình là **bung cả gói**; thẻ nào
> cần import thì import, thẻ nào cần text/prompt thì điền, còn lại chỉ bấm Start; cuối flow có
> **1 node xuất** kèm tool tinh chỉnh sáng tối màu sắc + chọn định dạng.*
>
> Đã khám code thật trước khi nhận định (Luật #4/#5).

---

## Kết luận ngắn: ý này đúng, và IF đã xây sẵn ~75% — đang nằm rời ở 3 chỗ

| Mảnh Hoà cần | IF đã có gì | Ở đâu |
|---|---|---|
| **Gói node dựng sẵn** (nhiều node + dây + tham số + vị trí) | `DemoModule` — 4 gói đã chạy được: `sketch` · `clay` · `concept` · `present` | `lib/demos/_shared.ts:38-41` + `lib/demos/*.ts` |
| **Node xuất cuối** | `out.board` — *"Export Board: ghép tối đa 4 output thành presentation board — tải PNG / PDF"* | `registry.ts:952-962` |
| **Tool tinh chỉnh sáng tối màu sắc** | `AdjustPanel` — Phơi sáng · Độ sáng · Tương phản · Bão hoà · Nhiệt độ · White Balance · Levels · Hue · mini-Curves | `components/photo-editor/AdjustPanel.tsx:7,48-54` |

**Việc cần làm không phải xây mới — mà là GHÉP 3 mảnh này lại** (đúng Luật #6 Đồng Bộ). Đây là lần
thứ ba trong phiên hôm nay ý của Hoà trùng khớp với thứ đã code xong nhưng chưa có mặt tiền.

---

## Khoảng cách thật giữa "đã có" và "ý Hoà"

### 1. Gói node: đang là "demo thay canvas", cần thành "gói kéo-thả"

`loadDemoFlow()` (`store.ts:656`) hiện **thay thế toàn bộ canvas** — nạp gói là mất flow đang làm.
Ý Hoà là **kéo 1 gói thả vào canvas → bung ra tại chỗ**, cộng thêm vào flow đang có.

Sửa thực chất rất nhỏ: `build()` đã trả `{nodes, edges}` với toạ độ sẵn — chỉ cần **cộng offset
theo điểm thả** rồi `merge` thay vì `replace`. Không phải viết lại hệ thống.

### 2. Trạng thái từng thẻ trong gói — phần THIẾU HẲN, và là phần hay nhất của ý Hoà

Hoà mô tả 3 loại thẻ trong 1 gói vừa bung:

| Loại thẻ | Người dùng phải làm gì | IF cần hiện gì |
|---|---|---|
| **Cần import** | Thả ảnh vào (sketch, ảnh phòng, ảnh ref) | Viền đứt + chữ "Thả ảnh vào đây" |
| **Cần điền chữ** | Gõ prompt / mô tả / tiêu đề | Ô chữ nhấp nháy nhẹ + placeholder gợi ý sẵn |
| **Đã đủ, chỉ Start** | Không làm gì, bấm chạy | Nút ▶ sáng, xanh — sẵn sàng |

Hiện tại canvas **không phân biệt 3 trạng thái này**. Người dùng nạp demo xong nhìn 4 node giống
hệt nhau, không biết bắt đầu từ đâu. Đây chính là thứ biến 1 gói node từ "đống node" thành
"phiếu điền vào chỗ trống" — **đúng tinh thần "không dây, không node" của Tool Mode nhưng làm
được ngay trên canvas**, không phải chuyển chế độ.

Kèm theo: **1 nút "▶ Chạy cả gói"** ở đầu gói — chạy tuần tự đúng thứ tự dây, bỏ qua thẻ chưa đủ
dữ liệu và báo rõ thẻ nào còn thiếu.

### 3. Node xuất cuối: `out.board` mới làm được 60%

| Ý Hoà | `out.board` hiện có | Còn thiếu |
|---|---|---|
| Gom output cuối flow | ✅ tối đa 4 ảnh | Không giới hạn 4 · nhận cả text/palette |
| Tinh chỉnh sáng tối màu sắc | ❌ | **Nhúng `AdjustPanel` có sẵn vào node** — không viết slider mới |
| Xuất định dạng user muốn | 🟡 chỉ PNG/PDF cứng | Chọn PNG · JPG · PDF · WebP + **DPI** + **khổ giấy** (16:9 · A4 · A3 — dùng lại `stage-presets.ts` của chặng 3) |

---

## Phát hiện kèm theo — danh mục gói phải TRÙNG danh sách loại file chặng 3

Hoà vừa nói ở tin trước: chặng 3 cho chọn *"khổ giấy hoặc loại file cần tạo"*. Và giờ: *"1 gói =
1 flow sản phẩm đầu ra"*.

**Hai cái này phải là CÙNG MỘT DANH SÁCH.** Nếu chặng 2 có gói "Spec sheet nội thất" thì chặng 3
phải có loại file "Spec sheet nội thất" — cùng tên, cùng khổ, cùng cấu trúc. Nếu để 2 danh sách
rời, 3 tháng nữa chúng lệch nhau và không ai biết gói nào ra file nào.

**Đề xuất**: 1 file dữ liệu duy nhất — `lib/products.ts` — khai báo N "sản phẩm đầu ra", mỗi mục
gồm: tên · khổ mặc định · gói node (`DemoModule`) dựng ra nó · template Present tương ứng. Chặng 2
đọc nó để hiện hero gói; chặng 3 đọc nó để hiện màn chọn loại file. Một nguồn, hai mặt tiền.

**Danh sách sản phẩm đề xuất (bám nghề nội thất, không bịa):**

| Sản phẩm | Gói node chặng 2 | Khổ chặng 3 |
|---|---|---|
| Board concept / moodboard | guref → moodboard → out.moodboard | A3 ngang |
| Bộ ảnh phương án (3 option) | input → sketch2render → batchvariants → out.board | 16:9 |
| Hồ sơ trình bày khách | input → render → relight → upscale → out.board | A3 dọc |
| Spec sheet nội thất | furnitureextract → removebg → materialnote → out.board | A4 dọc |
| Bảng vật liệu | guref → palette → pattern → out.moodboard | A4 ngang |
| Ảnh in khổ lớn | input → render → upscale → out.board | A3 · 300dpi |

*(6 gói này ánh xạ 1-1 sang 6 loại file ở màn chọn chặng 3 trong bản vẽ ý.)*

---

## Xếp hàng (Luật #8b) — bổ sung vào bảng ở doc chính

| Mã đề xuất | Việc | Chi phí | Xếp vào |
|---|---|---|---|
| `2.2.65` | **`lib/products.ts`** — 1 danh mục sản phẩm đầu ra dùng chung chặng 2 + chặng 3 | Rẻ (thuần dữ liệu) | **Sprint 3, LÀM TRƯỚC** 2.2.62/2.3.61 — vì cả hai đều đọc file này |
| `2.2.66` | **Gói kéo-thả**: `loadDemoFlow` merge-theo-điểm-thả thay vì replace + hero danh mục gói trên canvas | Trung bình | Sprint 3, sau 2.2.65 |
| `2.2.67` | **3 trạng thái thẻ trong gói** (cần import · cần điền chữ · sẵn sàng Start) + nút "▶ Chạy cả gói" | Trung bình — phần giá trị cao nhất | Sprint 3, cùng 2.2.66 |
| `2.2.68` | **Nâng cấp `out.board` thành node xuất thật**: nhúng `AdjustPanel` + chọn định dạng/DPI/khổ | Trung bình (tái dùng 2 component có sẵn) | Sprint 4 |

**Thứ tự bắt buộc**: `2.2.65` → `2.2.66`+`2.2.67` → `2.2.68`. Làm ngược thì phải sửa lại danh mục
hai lần.

---

*Cowork, 29/07/2026. Đã đọc: `lib/demos/_shared.ts`, `lib/demos/sketch.ts`, `lib/store.ts:656-690`,
`lib/nodes/registry.ts:907-995`, `components/photo-editor/AdjustPanel.tsx`. Mã 2.2.65-2.2.68 là ĐỀ
XUẤT — Claude Code kiểm tra trùng số trước khi dán vào cây.*
