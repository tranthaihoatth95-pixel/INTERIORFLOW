# 05/09 · SIẾT BA MẮT "SO GƯƠNG" — và nó lộ ra một khối 3D sai từ đầu mà cổng vẫn xanh 60/60

> **Trả lời một câu: mắt so gương không phải BA mà là BẢY (số của lượt trước chỉ đếm một bộ).
> Siết chúng KHÔNG lộ lỗi trong mã sản phẩm — nhưng lộ ra một thứ nặng hơn: bộ nghiệm thu G6
> suốt thời gian qua chứng nhận "kệ 5 tầng dựng được" trong khi khối nó dựng là 5 tấm ván
> CHỒNG KHÍT lên nhau, cao 25 mm thay vì 1525 mm.** Không mắt nào thấy vì mọi mắt đếm ĐỈNH
> (180 = 5×36 ✅) chứ không đo VỊ TRÍ — đúng khuôn so gương.

Mốc: `f43de304` → ff-only lên `origin/integration/2026-09-04` (lệch 240, cây sạch,
`merge-base --is-ancestor` rc=0) ⇒ `1ebce8ac`.

---

## ⓪ TIỀN ĐỀ CỦA PHIẾU — nhận, và một chỗ phải sửa số

Phiếu mô tả đúng khuôn bệnh và đúng cơ chế. **Sửa một chỗ: con số "ba".**
Báo cáo 04/09 viết *"Ba mắt so gương ở `g4-moat`"* — câu đó đúng **trong phạm vi `g4-moat`**,
nhưng bị đọc thành "ba mắt trong toàn hệ". Đếm lại bằng máy + đọc tay: **7 ca**, ở **hai bộ**.
Và trong lúc dạy máy canh (mục E) nó tìm thêm **2 ca nữa người soi tay bỏ sót** ⇒ **9**.

---

## ① BẢY MẮT SO GƯƠNG — mỗi ca một thí nghiệm bẻ mã, chạy được

Cách chứng minh: bẻ **mã sản phẩm** (đột biến có `process.env` canh, gỡ sạch sau khi đo — kiểm
`grep BE_* lib app components` = 0 ở cuối lượt), rồi xem mắt có **VẪN XANH** không.

### `nghiem-thu-g4-moat.mjs` — 3 ca, đột biến `computeBoq` / `boqFingerprint`

| # | Mắt | Điều kiện cũ | Bẻ gì | Kết quả |
|---|---|---|---|---|
| 1 | `① .idf — BOQ sau mở lại RA ĐÚNG SỐ CŨ` `:410` | `boqSauMo.totalAmount === boq2.totalAmount && …rows.length === …` | `computeBoq` → `{rows:[],totalAmount:0}` | **VẪN XANH** (0₫ === 0₫ · 0 dòng === 0 dòng) — 6 mắt khác đỏ, riêng nó không |
| 2 | `① .idf — vân tay khớp ⇒ deck KHÔNG báo cũ oan` `:412` | `boqFingerprint(docMoLai) === vanTaySau` | `boqFingerprint` → hằng `'VAN-TAY-HANG-SO'` | **VẪN XANH** |
| 3 | `② IndexedDB — BOQ sau nạp lại ra đúng số` `:470` | `… === boq2.totalAmount && boq2.totalAmount > 0` | `computeBoq` → `{rows:[], totalAmount:999}` | **XANH TRỞ LẠI** |

⭐ **Ca 3 là bài học riêng: neo `> 0` KHÔNG cứu được so gương.** Lượt trước thêm nó vì lo
"hai số 0 bằng nhau"; đo ra thì hàm trả **bất kỳ hằng số dương nào** cũng qua được ngưỡng đó.
Neo yếu tạo cảm giác an toàn mà không mua được gì.

### `nghiem-thu-g6-kho-mo-dau.mjs` — 4 ca, đột biến `evalRecipe` → hình rỗng

Bẻ `evalRecipe` trả `geometry: null` ⇒ toàn bộ chạy chính chỉ **2 mắt đỏ**, còn **4 mắt XANH**:

| # | Mắt | Vì sao xanh |
|---|---|---|
| 4 | `tắt bậc lặp ⇒ còn đúng MỘT tấm ván` `:233` | `0 === 0/5` → `0 === 0` |
| 5 | `bật lại ra ĐÚNG hình cũ (lùi được)` `:237` | `0 === 0` |
| 6 | `① .idfc — dựng lại TỪ TỆP ra ĐÚNG khối cũ` `:286` | `0 === 0` |
| 7 | `① .idfc — sau mở lại vẫn SỬA ĐƯỢC BẰNG THAM SỐ` `:294` | `0 === 0` |

---

## ② 🔴 LỘ RA GÌ — trả lời thẳng: **KHÔNG có lỗi trong mã sản phẩm, nhưng CÓ một lỗ nặng ở phép đo**

### 🔴 PHÁT HIỆN CHÍNH — bộ G6 đo trên một khối KHÔNG PHẢI CÁI KỆ

Trong lúc dựng neo hình học tôi đo hộp bao thay vì đếm đỉnh, và nó ra thế này:

```
5 tầng | 180 đỉnh | x −450…450 | y −175…176.4 | z 100…125
                                     ↑ lệch 1,4mm      ↑ CAO ĐỘ KHÔNG ĐỔI
```

Recipe là `arrayLinear{n:5, dz:350}` — lặp 5 tầng, mỗi tầng cách nhau **350 mm theo chiều cao**.
Thực tế: **cao độ đứng yên** (100→125, đúng một tấm dày 25 mm), chỉ **chiều sâu lệch 1,4 mm**
(= 4 × 0,35). Với n=7 thì lệch 2,1 mm (= 6 × 0,35).

**Gốc: `daysToPositions` trong CHÍNH bộ đo (`nghiem-thu-g6-kho-mo-dau.mjs:461`)** dựng nền bằng
**mm, hệ CAD (cao độ ở Z)** rồi chú thích tự khai là *"đúng hình dạng `SceneGroup.positions` mà
`cad-to-obj.ts` sinh ra"*. Hợp đồng thật (`lib/three/cad-to-obj.ts:124-129`) là **mét, Y-up
`(x, cao, −y)`**. Sai **hai tầng cùng lúc**: đơn vị (1000 lần) và trục.
`repeatGeometry` đi qua `cadToThreeM` đúng hợp đồng ⇒ `dz:350` thành **0,35 trên trục Y** ⇒ với
nền mm thì đó là **0,35 mm theo chiều sâu**.

**Kiểm chiều ngược lại trước khi kết tội ai** — và đây là phần quan trọng:
- `grep evalRecipe` trong `lib|app|components`: mọi nơi sản xuất đều truyền `g.positions` của
  `SceneGroup` (mét, Y-up) ⇒ `repeatGeometry` **ĐÚNG**.
- `grep congThucKe|daGiacVan` ngoài `hat-giong-3d.ts` = **0** ⇒ không đường sản xuất nào dựng
  nền kiểu mm.
- Dựng lại nền đúng hợp đồng (qua chính `cadToThreeM`) rồi chạy lại: **rộng 900 · sâu 350 ·
  cao 100→1525 mm** — khớp từng số với tính tay `100 + 25 + 4×350`.

⇒ **Mã sản phẩm đúng. Bộ đo sai.** Nhưng đừng đọc nhẹ: một cổng nghiệm thu chứng nhận 60/60
trên một hình học sai hoàn toàn thì **cái nó bảo vệ không được bảo vệ**. Nếu `arrayLinear` có
hỏng thật, bộ này cũng không phát hiện được.

### Không lộ lỗi sản phẩm nào khác

Bốn phép siết ở `g4-moat` đều **đạt ngay** trên mã hiện tại — `computeBoq` ra đúng
102.340.000₫ tính tay, `boqFingerprint` phân biệt đúng Doc. Khai thẳng: nếu siết mà lộ lỗi,
tôi đã để cổng đỏ và báo lên, không vá.

---

## ③ SIẾT BẰNG NEO NGOÀI — chọn gì, vì sao

**Nguyên tắc: neo phải là một vế KHÔNG đi qua hàm đang nghi.** Ba loại đã dùng:

| Loại neo | Dùng cho | Vì sao chọn |
|---|---|---|
| **Con số tính TAY** từ hình học + bảng giá | 3 mắt BOQ | `20 m² × 2.400.000₫ × 1,08 + 18.500.000 + 32.000.000 = 102.340.000₫` — tính bằng phép nhân trong bộ đo, `computeBoq` không tham gia. Đỏ ngay khi hàm trả rỗng, trả hằng, quên hao hụt, hay đổi đơn vị |
| **Kích thước hình học** tính từ tham số | 4 mắt recipe + 2 neo mới | Số đỉnh không nói gì về vị trí — đó chính là chỗ vừa để lọt cả một khối sai. Hộp bao thì có: `rong=900 · sau=350 · cao 100→1525` |
| **Sức phân biệt** của hàm băm | mắt vân tay | Hàm băm không có "số tính tay". Bất biến độc lập: cùng Doc ⇒ cùng vân tay, **khác Doc ⇒ khác vân tay** (thêm ca xê dịch 1 mm). Hằng số trượt cả hai vế sau |

**Không nới một khẳng định nào** — cả 9 phép siết đều làm phép đo KHÓ hơn. Hai neo mới thêm hẳn
(`NEO NGOÀI · BOQ khớp con số tính tay` · `NEO NGOÀI · khối ra ĐÚNG KÍCH THƯỚC` ·
`NEO NGOÀI · 5 tầng thật sự CÁCH NHAU`).

### Hiệu chuẩn — bẻ mã sản phẩm, đòi ĐỎ

| Đột biến | Trước siết | Sau siết |
|---|---|---|
| `computeBoq` → rỗng | 6 đỏ, 2 mắt gương xanh | **8 đỏ** (`58/66`) |
| `computeBoq` → hằng 999 | 3 mắt gương xanh | **7 đỏ** (`59/66`) |
| `boqFingerprint` → hằng | mắt `:412` xanh | **3 đỏ** (`63/66`) |
| `evalRecipe` → rỗng | 2 đỏ, 4 mắt gương xanh | **8 đỏ** (`54/62`) |
| `cadAxesToThree` → không đổi trục ⭐ | *(không mắt nào bắt)* | **4 đỏ** (`58/62`) |
| `sheetsKey` → rơi userId | *(G6 không chạm hàm này)* | **1 đỏ** (`62/63`) |

⭐ Hàng thứ 5 là hiệu chuẩn đáng giá nhất: neo mới bắt được **đúng loại lỗi vừa che giấu**
(lệch trục), thứ mà đếm đỉnh không bao giờ thấy.

**Xác minh đã bẻ đúng chỗ** (phiếu cảnh báo ca bẻ-trượt): mỗi đột biến `grep -c` = **1**, chèn
bằng sửa có ngữ cảnh chứ không thay-chuỗi-dòng-đầu, và chạy baseline không-bật-cờ để chắc mã
vẫn 66/66 trước khi tin số của ca bẻ.

---

## ④ CỔNG CÓ ĐỔI MÀU KHÔNG — **không, và không có cổng nào phải chuyển đỏ**

| Cổng | Trước | Sau |
|---|---|---|
| `g4-moat` | 65/65 · rc=0 | **66/66 · rc=0** (+1 neo ngoài, 3 mắt siết lên) |
| `g6-kho-mo-dau` | 60/60 · rc=0 | **63/63 · rc=0** (+3 khẳng định, 6 mắt siết lên, nền sửa hệ toạ độ) |
| `tsc` · `npm test` | — | **0 lỗi · 0 fail · rc=0** |
| `soi-frontier` | 77 xong · 0 lệch | **77 xong · 0 lệch** |
| `soi-tu-dien` · `soi-cong-cu-chet` | 322 · 40 | **322 · 40** |

🔴 **Nhưng "không đỏ" ở đây KHÔNG phải tin tốt trọn vẹn**: nghĩa là suốt thời gian qua hai bộ
này xanh **mà không đo được thứ chúng hứa**. Chúng che một khoảng trống, không che một bug.

---

## ⑤ MỤC D — MỞ VÙNG QUÉT: mốc xấu đi, và **thế là đúng**

| Máy soi | Mốc cũ | **Mốc mới** | Vì sao đổi |
|---|---|---|---|
| `soi-hinh-hoc` | 32 ngoài thang · 368 tệp | **51 ngoài thang · 507 tệp** | `SCAN_DIRS` từ `['components']` → `['components','app']`; trước chỉ soi đúng một tệp `app/globals.css` |
| `soi-thao-tac` (luật `cam-hex-inline`) | 186 hex | **231 hex** (186 + **45** ở `app/`) | Thêm `{ dir: 'app' }` — hai luật khác trong cùng registry đã quét `app/` từ lâu, riêng luật hex thì không |

🔧 **Đính chính con số của sổ**: 04/09 ước `app/` có **59 hex**; đo bằng CHÍNH mẫu của luật ra
**45**. Số dùng là 45 — ước tính cũ đếm bằng mẫu rộng hơn.

**Số LUẬT lệch vẫn là 2** ⇒ `soi-thao-tac` giữ rc=1 (vốn đã 1 từ trước, không phải do lượt này);
`soi-hinh-hoc` giữ rc=0, không chặn build. Dòng giải thích ghi **tại chỗ trong script**
(`scripts/soi-hinh-hoc.mjs` ngay trên `SCAN_DIRS` · `scripts/thao-tac-registry.mjs` ngay trên
mảng `soi` của luật hex) để lượt sau không tưởng có ai làm hỏng.

---

## ⑥ MỤC E — dạy máy canh: **CÓ**, và nó lập tức tìm ra 2 ca người bỏ sót

`scripts/soi-mat-tu-cham.mjs` mọc tín hiệu thứ ba **🪞 SO GƯƠNG**: trong một mệnh đề `===`, hai
vế cùng truy về **một hàm sản phẩm**. `!==` không tính (hàm trả hằng làm nó ĐỎ, tức đang đo thật).

**Hiệu chuẩn bắt buộc — chấm bản TRƯỚC khi siết (ca đã biết kết luận):**
- `g4-moat` cũ → bắt **3/3**, phân biệt đúng hai ca "KHÔNG neo ngoài" ↔ một ca "có neo kèm".
- `g6` cũ → vòng 1 bắt **0/4**: hàm sản phẩm nằm sau một hàm bọc cục bộ (`soDinh(evalRecipe(x))`)
  mà máy chỉ truy một bậc ⇒ **HIỆU CHUẨN TRƯỢT**. Nới đúng một bậc bọc (trần 3, KHÔNG mở thành
  BFS — bản đầu BFS báo quá tay tới mức chính khối NEO NGOÀI cũng bị chấm là "qua `computeBoq`")
  ⇒ vòng 2 bắt **6 ca**.

⭐ **Hai trong sáu ca đó người soi tay BỎ SÓT, và một ca là hàng thật:**
`nghiem-thu-g6-kho-mo-dau.mjs:356` — `JSON.stringify(quaIdb.sheets[0].doc) === JSON.stringify(doiVL.doc)`
là **đúng cái tautology JSON round-trip đã siết ở `g4-moat` hôm 04/09**. Lượt đó chữa một bộ,
**quên bộ kia**. Đã siết cùng cách (đếm khoá đệ quy trên object thật + gọi `sheetsKey()` thật),
và hiệu chuẩn bằng đột biến `sheetsKey`. Ca còn lại (`cumMoLai.length === cum.length`) xanh trên
một bản vẽ TRỐNG vì `0 === 0` và `.every()` trên mảng rỗng = `true` — đã neo `cum.length > 0`.

**Trạng thái cuối**: 9 ca 🪞, **8 có neo kèm · 1 không neo** — và ca không-neo đó là **báo nhầm**
(`coGiaPha === datVaoBanVe.length`: một vế là mảng literal của bộ đo, máy truy 3 bậc nên gán nhầm
nguồn). **Tỉ lệ báo nhầm 1/9, in thẳng trong máy.**

⚠️ Giới hạn đã ghi tại chỗ: chữ *"có neo kèm"* chỉ nói **CÓ** neo, **không** nói neo đủ mạnh —
`> 0` là neo hợp lệ về cú pháp mà vẫn để lọt hàm trả hằng số dương. Máy không chấm được sức
mạnh của neo; **người vẫn phải đọc**.

---

## ⑦b CHƯA CHẮC / CHƯA KIỂM — bắt buộc

- 🔴 **Con số 9 là SÀN, không phải trần** — và tôi có bằng chứng cho chính câu này: người soi tay
  ra 7, máy ra 9. Hai bộ `nghiem-thu-g1.mjs` (8 ca) và `nghiem-thu-g2-hanh-trinh.mjs` (13 hành
  trình) dùng khuôn `ghi()` nên **máy vẫn mù hoàn toàn** — tôi **không soi tay hai bộ đó lượt
  này**. Nếu có mắt so gương ở đó thì chúng chưa được đếm.
- 🔴 **Máy canh là HEURISTIC hai chiều**: báo nhầm đã đo 1/9; **chiều bỏ sót thì chưa đo được**
  — nó chỉ nhận hàm sản phẩm ở nguồn TRỰC TIẾP (≤3 bậc, một bậc bọc), nên khuôn gương sâu hơn
  hoặc đi qua mảng/vòng lặp sẽ lọt.
- 🟡 **Không chạy `g4-moat-danh-tinh` và `g6-dot-2`** (cần dev server + Chromium) — cùng lý do
  lượt trước: ưu tiên ngân sách cho phần đo. Máy chấm chúng qua ĐỌC MÃ, không qua chạy thật.
  Hai bộ đó có 40 khẳng định, máy báo 0 ca 🪞 — **chưa xác minh bằng tay**.
- 🟡 **Ca "kệ 5 tầng chồng khít" tôi kết luận là lỗi phép đo, không phải lỗi sản phẩm** — dựa
  trên: hợp đồng docstring + `grep` nơi gọi = 0 đường sản xuất dùng nền mm. **Chưa chạy app thật
  để nhìn cái kệ trên màn.** Nếu có đường nào dựng nền không qua `SceneGroup` mà `grep` không
  thấy (ghép chuỗi động, gọi gián tiếp), kết luận này phải đọc lại.
- 🟡 **Cấu kiện kệ sách hạt giống chưa có đường dựng trong app**: `grep congThucKe|daGiacVan`
  ngoài file định nghĩa = **0**. Tức nó có công thức, có `.idfc`, nhưng **chưa nơi nào trong app
  dựng nó ra hình**. Đây là quan sát ngoài phạm vi, chưa kiểm sâu — có thể là nợ thật, có thể là
  đường đi qua `resolveSceneGroupGeometry` mà tôi chưa lần tới.
- 🟡 **Ba mốc mới (51 · 231 · 63/63) chưa ai sửa một chỗ nào trong đó.** Mở vùng quét là làm cho
  số nói thật, không phải làm cho số đẹp.
- 🟡 Toàn bộ đột biến chạy bằng `process.env` chèn tạm rồi gỡ; đã kiểm `grep BE_*` = 0 và
  `git status` chỉ còn 5 tệp `scripts/`. Nhưng **không chạy lại full `npm test` sau lần gỡ cuối
  cùng của `sheetsKey`** — chỉ chạy `tsc` (rc=0) và hai bộ nghiệm thu (rc=0).

## ⑦c HẠN DÙNG KẾT LUẬN

- **Bảy/chín ca so gương hết hạn ngay khi ai sửa bộ đo** — chúng đã được siết trong lượt này nên
  **không tái hiện được nữa**; đó là mục đích. Muốn đếm lại thì chạy `npm run soi:mat-tu-cham`,
  đừng trích số từ đây.
- **Mốc 51 và 231 hết hạn ngay khi có người sửa radius/hex trong `app/`** — và mong là sớm.
- **Câu "mã sản phẩm đúng" chỉ đúng cho 6 đột biến đã chạy.** Nó không phải chứng minh
  `computeBoq`/`evalRecipe`/`boqFingerprint` đúng nói chung.
- **Câu "không lộ lỗ sản phẩm" hết hiệu lực nếu ai tìm được đường sản xuất dựng nền 3D không qua
  `SceneGroup.positions`** — đó là mắt xích cả kết luận này treo lên.
