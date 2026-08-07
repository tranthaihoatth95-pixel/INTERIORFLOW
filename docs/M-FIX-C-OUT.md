# M-FIX-C-OUT — Phiếu FIX ĐỎ · GỐC C (món rời / BOQ / FF&E)

> Phiên 06/08. Vùng: `lib/ffe` · `lib/boq` · `lib/materials` · `lib/vision` · `prisma` ·
> `lib/nodes/defs/ffe-table.ts`. **CHƯA COMMIT** (luật V6 — Hoà commit). **KHÔNG sửa `GAP-IF.md`**
> (§0u). Không chạm `lib/cad`, `components/cad` (M1 giữ).
>
> ⚠️ Đọc dòng này trước: **phiên này KHÔNG viết mới phần lớn code** — mẻ 06/08 trước đó (đã nằm
> trong `8a850f5` + `7df4421`) đã viết, nhưng **chưa có lượt nghiệm thu chạy thật nào và chưa có
> sổ**. Việc của phiên này là **chứng minh nó chạy thật (N6) hoặc chỉ ra chỗ vỡ**, cộng phản biện
> săn lỗi im lặng còn sót. Bảng dưới ghi đúng mức bằng chứng của từng mục, không quy đổi "file đã
> đổi" thành "đã đóng đỏ".

---

## 0 · Bảng chốt — mục nào ĐÓNG được, mục nào CÒN ĐỎ

> **Phiên này có HAI vòng**: ① nghiệm thu mẻ 06/08 có sẵn (§1-§2) · ② phản biện tìm ra **4 đường
> tiền-sai-im-lặng MỚI mà mẻ đó chưa đóng**, và **sửa tiếp 12 mục** (§3, §3g). Bảng dưới là trạng
> thái SAU cả hai vòng.

| Mục | Kết luận | Mức bằng chứng cao nhất đạt được |
|---|---|---|
| **G-M3-06** ghép cột sai | ✅ ĐÓNG (vá lần 2) | **Trình duyệt thật** + 119 test + 14 ca gán-sai đảo đúng |
| **G-M3-09** BOQ nuốt món rời | ✅ ĐÓNG (mức engine) | Chạy `computeBoq` thật trên Doc 11 entity + 120 test. **Chưa bấm được trên UI** — xem §4 |
| **G-M3-05** mở cửa nhập kho | ✅ ĐÓNG | **Trình duyệt thật**: 16 ô ghép cột hiện đủ, vật liệu·màu·phòng·độ tin cậy vào đúng ô |
| **G-M3-07** chọn loại | ✅ ĐÓNG | **Trình duyệt thật**: ô "Nhập vào ngăn nào của kho" tự đoán **Nội thất rời**, đổi được |
| **G-M3-11** cột ảnh + .xlsx nhúng ảnh | 🟡 ĐÓNG mức file | File .xlsx thật có `xl/media/` + `xl/drawings/`, openpyxl đọc được. **Chưa mở bằng Excel thật, chưa bấm nút xuất trên UI** |
| **G-M3-04** hồ sơ FF&E nhiều món | 🟡 ĐÓNG mức file | `buildFfeSheet` → .xlsx 14.083B có 2 ảnh neo đúng ô. Nút thật đã có trong cửa nhập; chưa bấm được |
| **G-M3-01** bốc N món/ảnh | 🟠 **THU HẸP, KHÔNG ĐÓNG** | Khối `util.ffetable` gom từng lượt thành bảng chạy trên dây. **Máy vẫn chỉ tách được 1 món/lượt** — giới hạn mô hình tách nền, không phải thiếu code. Khai thẳng trong `description` người dùng đọc |
| **G-M3-08** trường phòng/vị trí | 🔴 **CÒN ĐỎ** | Cột `room`/`confidence` mới **khai schema**, `sqlite3` xác nhận **DB chưa có cột**. Chờ Hoà chạy lệnh ở §5 |

---

## 1 · Hai bug im lặng (ưu tiên phiếu) — đã sửa và đã nghiệm thu

### 1a. G-M3-06 · ghép cột sai, mất chiều cao không báo

Gốc bệnh: vòng "khớp chứa" dùng `header.includes(kw)` cho **mọi** từ khoá, kể cả từ khoá **một
chữ cái** (`'h'` của Cao, `'d'` của Sâu, `'w'` của Rộng) ⇒ `"Phòng"` → `"phong"` **chứa 'h'** ⇒ ăn
mất ô **Cao**; cột "Cao (H mm)" thật đứng sau bị bỏ luôn (mỗi field chỉ lấy cột đầu tiên khớp).

Bản vá (`lib/materials/warehouse/column-mapping.ts:113-118`): từ khoá **≤2 ký tự chỉ khớp khi là
MỘT TỪ RIÊNG** trong tiêu đề (cắt theo ranh giới không-phải-chữ-số), từ khoá dài giữ khớp-chứa.
Cộng thêm `EXACT_ONLY_KEYWORDS` cho `'anh'`/`'hinh'` (nếu không "Thành tiền" → `"thanh tien"` chứa
`"anh"` ⇒ rơi vào ô Ảnh) và `unmappedColumns()` để **cột không map được phải hiện ra màn hình**.

**Nghiệm thu trình duyệt thật** (127.0.0.1:3005, màn Kho vật liệu → "Nhập Excel/CSV", nạp file
`.csv` 14 cột tiêu đề tiếng Việt có dấu qua đúng `input[type=file]` của cửa nhập):

| Cột trong file | Ô IF ghép vào | Chốt |
|---|---|---|
| `Cao (H mm)` | **Cao (mm)** | đúng — KHÔNG bị "Phòng" chiếm |
| `Phòng` | **Phòng** | đúng — trước đây rơi vào Cao |
| `Sâu (D mm)` | **Sâu (mm)** | đúng |
| `Độ tin cậy` | **Độ tin cậy** | đúng — trước đây rơi vào Sâu ('d') |
| `Ảnh` | **Ảnh (tên file / URL)** | đúng |
| `Vật liệu` · `Màu` · `Số lượng` · `Đơn vị` · `Đơn giá` · `Tên sản phẩm` · `Mã SP` | đúng ô | 12/12 |
| `Thành tiền` | **không ô nào** | đúng — hiện dòng cảnh báo **"1 cột trong file KHÔNG được nhập: «Thành tiền»"** |

Xem trước ngay trên màn: **"5/5 dòng · 4 hợp lệ · 1 dòng lỗi"**, dòng 5 báo `Thiếu "Tên" — bỏ qua
dòng này.` ⇒ dòng hỏng **không kéo theo 4 dòng lành**, và không có gì rơi im lặng.

🟡 **Còn hở, ghi thẳng**: bảng viết tắt kiểu VN `D (mm) | R (mm) | C (mm)` — chỉ `D` được ghép,
`R`/`C` rơi vào danh sách "cột bị bỏ rơi" (phải ghép tay 2 ô). Ngoài ra `D` trong "DxRxC" nghĩa
là **Dài** còn IF hiểu là **Sâu** — trùng chữ khác nghĩa. Kiểu gộp một ô `"Kích thước (DxRxC)"`
cũng chỉ báo bỏ rơi, chưa tách được. **Không im lặng nên không tính là vỡ**, nhưng là việc còn lại.

### 1b. G-M3-09 · BOQ nuốt món rời, báo giá thiếu âm thầm

`computeBoq` trước đây **chỉ quét `type === 'hatch'`** ⇒ 8 cái ghế đã gán mã + đơn giá cho ra
**0 dòng, 0 lỗi**, bảng vẫn trông đủ. Nay quét thêm `BlockEntity.specId` → dòng `kind:'count'`,
có `qty` + `unit`, và món chưa gán mã sinh lỗi `missing-specId-item`.

**Chạy `computeBoq` thật** trên `Doc` 11 entity (1 vùng tô sàn + 8 ghế cùng mã + 1 bàn chưa gán mã
+ 1 cửa hosted) — 14/14 chốt đạt:

- dòng đếm: **qty = 8 cái · 19.600.000đ**, gom đủ 8 `entityIds`;
- dòng diện tích: **20 m² × 1,05 hao hụt × 1.250.000 = 26.250.000đ**;
- `totalAmount = 45.850.000đ`;
- bàn chưa gán mã → đúng lỗi `missing-specId-item` trỏ `["b_ban_chua_ma"]` (**không im lặng**);
- cửa hosted bị loại khỏi cả `rows` lẫn lỗi (`classifyBlock` = `opening` — cửa tính qua bảng
  thống kê cửa, không phải dòng "món rời"), và câu lỗi **nói rõ đã bỏ qua bao nhiêu cửa/ký hiệu**
  để người đọc đối chiếu được với mắt mình khi đếm trên bản vẽ.

Ba chốt chặn "số sai trông như đúng" đi kèm, đều có test khoá: đơn giá âm/NaN → `invalid-price`;
**lệch đơn vị 2 chiều** (mã 'cái' gán cho vùng tô, hoặc mã 'm²' gán cho món rời) → `unit-mismatch`,
không tính; đơn vị lạ ('thùng') → **giữ nguyên chữ người dùng** + cảnh báo, vẫn tính.

---

## 2 · Bốn mục còn lại của phiếu

- **G-M3-05** — `MATERIAL_FIELDS` 9 → **16 trường** (thêm SL · vật liệu · hoàn thiện · màu · phòng ·
  độ tin cậy · ảnh). Đúng chỉ đạo "kho đã có sẵn `materials`/`colorHex`/`hUp` — chỉ nối cửa Excel
  tới, đừng thêm field mới": 3 trường có sẵn cột DB nối thẳng xuống; `qty`/`room`/`confidence`
  KHÔNG có cột trong `ProductSpec` nên đi vào `FfeTable` (`lib/ffe/item.ts`) — xem §4 mục 3.
- **G-M3-07** — bỏ ép cứng `kind:'material'`. `guessImportKind` đoán theo dữ liệu, người nhập
  **đổi được** trên UI; câu dưới ô nói rõ máy đoán gì và bạn đã đổi hay chưa. Nghiệm thu trình
  duyệt: file ghế/bàn/sofa/đèn → đoán **"Nội thất rời"** (`furniture`), 5/5 POST mang đúng `kind`.
- **G-M3-11** — `lib/boq/xlsx.ts` nay dựng được `xl/drawings/drawing1.xml` + `xl/media/imageN.png`
  + `<Default Extension="png">` trong `[Content_Types].xml`; `BoqTable` có **cột "Ảnh"** (10 → 11
  cột), ô trống có viền + gạch nối chứ không để trống trơn; `BoqScreen` nạp ảnh thật, có **trần số
  ảnh** và **báo thẳng số ảnh không nhúng được** trước khi người dùng gửi khách. File .xlsx thật
  10.808B đã mở bằng **openpyxl 3.1.5**: đọc đủ ô tiếng Việt, 2 ảnh neo đúng ô, công thức
  `=SUM(J2:J3)` còn sống, PNG trong zip byte-identical với nguồn. File đối chứng không ảnh
  (6.885B) không có `media/`/`drawings/` ⇒ không phải "lúc nào cũng có sẵn".
- **G-M3-04** — `lib/ffe/sheet.ts` dựng hồ sơ FF&E nhiều món (mã · ảnh · tên · quy cách · vật
  liệu-hoàn thiện · NCC · đơn giá · SL · đơn vị · thành tiền · **ô duyệt trước sản xuất**), gộp
  theo phòng, dùng chung máy .xlsx của BOQ (không viết OOXML lần hai). Nút thật nằm trong cửa nhập
  Excel — không còn là hàm mồ côi.
- **G-M3-01** — 🟠 **không đóng được như phiếu mong**. Khối `util.ffetable` (đã đăng ký trong
  `lib/nodes/defs/index.ts`) biến mỗi lượt bốc tách/đo thành **một dòng** nối vào bảng của khối
  trước ⇒ xâu N khối là có bảng N món chạy trên dây, không phải gõ lại. Nhưng **bộ tách nền hiện
  tại trả đúng một vùng tiền cảnh mỗi lượt** — muốn "N món trong một ảnh" phải đổi mô hình
  (detection/segmentation nhiều đối tượng), không nằm trong vùng phiếu này.

---

## 3 · Phản biện — 🔴 mẻ 06/08 vá xong VẪN CÒN đường tiền-sai-im-lặng

Agent phản biện chạy hàm thật (không đọc suông) trên 45 bộ tiêu đề + hàng chục ca BOQ/xlsx.
**Tôi tự chạy lại 4 phát hiện nặng nhất, cả 4 đều tái hiện được** — không lấy báo cáo làm bằng.

### 3a. Bốn lỗi TIỀN SAI, `errors: []` (tôi tự đo lại, đầu ra dán nguyên)

| # | Lỗi | Đầu ra thật |
|---|---|---|
| 1 | `normalizeQty` là **bộ đọc số thứ hai, yếu hơn** `parseNumberCell` | `normalizeQty('1.200','cai') = 1` · `'2,450' = 2` ⇒ hồ sơ FF&E ra `300.000đ` thay vì `300.000.000đ` — **sai 1000×, 0 lỗi 0 cảnh báo** |
| 2 | Vùng tô + đơn vị ĐO **khác m²** vẫn nhân | `unit='m'` → `qty 9 · unit "m2" · 900.000đ · errors: []`; y hệt `'m3'`, `'thùng'`. Len chân tường/phào/đá bậc bán theo mét dài là chuyện hàng ngày |
| 3 | Khối lượng in ra ≠ khối lượng dùng để nhân | dòng in `10 m² × 1.000.000đ` nhưng thành tiền `9.998.244đ` — Hoà nhân tay ra số khác, không ghi chú gì |
| 4 | Kết quả nhân tràn số | `wastagePercent` khổng lồ → `thanhTien: Infinity`, `errors: 0`; xuất .xlsx thì ném lỗi bằng tiếng lập trình viên |

⇒ Bản vá 06/08 chặn đúng **một nửa** của mỗi cặp: chặn đơn vị ĐẾM gán cho vùng tô nhưng quên đơn vị
ĐO khác m²; kiểm ĐẦU VÀO của phép nhân nhưng không kiểm KẾT QUẢ.

### 3b. Ghép cột: sửa xong vẫn còn 14 ca gán SAI, im lặng

`SHORT_KEYWORD_MAX = 2` chỉ chữa từ khoá 1-2 chữ cái. Từ khoá 3-4 ký tự vẫn khớp-chuỗi-con, và
thuật toán "duyệt field theo thứ tự, mỗi field vồ cột đầu tiên khớp" khiến field đứng trước cướp
cột của field đặc hiệu hơn. Ca đã chạy thật (nặng nhất trước):

- `['Tên hàng','Đánh giá','Giá bán lẻ']` → **đơn giá ← "Đánh giá"** (ô đánh giá ghi `4,5` đọc ra
  4.5 ⇒ **cả kho vào với giá 4 đồng**), cột giá thật bị bỏ rơi;
- `['Extended Price','Product Name','Unit Price']` → **đơn vị ← "Unit Price"** + **đơn giá ←
  "Extended Price"** (đưa **thành tiền** vào ô đơn giá — số vẫn to, vẫn trông như giá);
- `'Đơn giá sau thuế'` → **ô Sâu** ('sau') · `'Báo cáo tồn kho'`/`'Cao su'` → **ô Cao** ('cao') ·
  `'Trọng lượng'` → **ô Rộng** ('rong') · `'Đại lý phân phối'` → **ô Sâu** ('dai');
- `'Mã màu'`/`'Bản mã thép'` → **ô Mã (SKU)** · `'Item Code'` → **ô Tên** · `'Số lượng hàng'`/
  `'Nhóm hàng'`/`'Hàng tồn'` → **ô Hãng** · `'Khu vực'` cướp ô Phòng của cột `'Phòng'`.

🟢 Giảm nhẹ (tôi kiểm trên trình duyệt): màn ghép cột **hiện đủ 16 ô kèm cột nguồn đang chọn** nên
người dùng NHÌN THẤY và sửa được — khác hẳn ca G-M3-06 gốc (rơi hẳn, không ô nào hiện). Nhưng UI
chỉ liệt kê cột **bị bỏ rơi**, **không nói gì về cột bị gán sai** ⇒ vẫn phải sửa thuật toán.

### 3c. Lời khai trong code ≠ sự thật (kiểm bằng cách ĐẢO NGƯỢC từng bản vá rồi chạy test)

6/8 khẳng định đúng (đảo bản vá thì test đỏ ngay — có khoá thật). **2 sai**:

- `ffe-table.ts:34-37` khai *"4 đơn vị đầu là ĐẾM"* cho `['cái','bộ','chiếc','tấm',…]` —
  `isCountUnit('tấm') = false`. Người dùng chọn **'tấm' ngay trong dropdown của chính app** rồi bị
  BOQ cảnh báo *"IF chưa biết đơn vị này"*.
- `xlsx.ts:114-118` khai chặn `NaN`/`Infinity` (và `lib/vision/to-cad.ts:127` viện dẫn như bảo
  đảm) — **không test nào khoá**: sửa `if (!Number.isFinite…)` thành `if (false)` mà 2 file test
  vẫn xanh.
- Thêm: `FfeSheet.invalidQtyItemIds` ("phải báo") có **0 nơi tiêu thụ ngoài test** ⇒ món bị loại vì
  số lượng hỏng **biến mất khỏi hồ sơ xuất ra** mà file không nói gì.

### 3d. Lỗi im lặng mức 2 khác (đều tái hiện được)

- **Màu / Độ tin cậy ghép đúng cột rồi vẫn rơi GIÁ TRỊ**: `normalizeColorHex('Trắng sữa'|'RAL 9010')
  = undefined`, `parseConfidenceCell('Cao'|'90%') = undefined`, payload không có `colorHex`,
  `warnings: []`. Đúng cảnh G-M3-05 sinh ra để chữa, chỉ dời chỗ rơi xuống một tầng.
- **Ký tự điều khiển trong tên món ⇒ .xlsx hỏng**: `\x01` lọt qua `xmlEscape` ⇒ XML not well-formed
  ⇒ Excel báo "file bị lỗi". (`&`, `<`, `>`, `"`, `'`, emoji, xuống dòng, tab đều đã đúng.)
- **Ảnh trùng tên ở 2 thư mục** (`phong-khach/ghe.jpg` + `phong-ngu/ghe.jpg`) → cả 2 dòng lấy CÙNG
  một ảnh, không cảnh báo — mà kéo cả cây thư mục theo phòng lại là cách dùng được khuyến khích.
- **`groupByRoom` phân biệt hoa/thường + khoảng trắng kép** ⇒ một phòng tách thành 3 mục.
- **Entity trùng `id`** bị cộng đôi im lặng. **Vùng tô/món trên layer đã TẮT vẫn tính tiền**
  (`errors: []`) — "phương án B" tắt đi vẫn vào báo giá.

### 3e. 🔴 BOM HẸN GIỜ — `prisma generate` một mình sẽ giết mọi đường ProductSpec

Cờ `SPEC_ROOM_COLUMN_READY` **không chặn được**: nó chỉ ngăn *lập trình viên nhắc tên cột*, còn
Prisma **tự SELECT mọi cột scalar** của model. Agent dựng client thật từ chính schema này + DB
thiếu cột:

```
findMany LỖI: The column `main.ProductSpec.room` does not exist in the current database.
create   LỖI: The column `room` does not exist in the current database.
```

Hôm nay chưa nổ chỉ vì client sinh từ 04/08 còn cũ (`grep -c room node_modules/.prisma/client/
schema.prisma` = **0**). Chỉ cần một lần `npm install` (postinstall = `prisma generate`) là kho vật
liệu, BOQ, `/api/specs`, ATLAS sync **chết cùng lúc**. Docblock `lib/server/specs.ts:8-27` mô tả
nguy cơ là "vỡ tsc" — **sai bản chất**, nguy cơ thật là vỡ RUNTIME toàn bộ. ⇒ §5 không còn là việc
"khi nào tiện", mà là việc **phải làm trước lần `npm install` kế tiếp**.

### 3f. Đã kiểm — KHÔNG phải lỗi (khỏi kiểm lại)

`priceVnd` kiểu Decimal Prisma → bắt đúng `invalid-price`, không NaN im lặng · đơn vị viết
hoa/có dấu ('Cái'/'M2'/'m²') xử lý đúng cả 2 chiều · nhóm hatch chồng lấn bị bỏ **nhưng có lỗi** ·
`cellRef` cột > 26 ra `AA/AB/AC` đúng · escape `& < > " '` + emoji + xuống dòng + tab đúng · ô số
NaN/Infinity trong `buildXlsxBuffer` ném lỗi rõ kèm địa chỉ ô · ảnh nhiều hơn số dòng vẫn hợp lệ ·
cổng `'table'` roundtrip 5000 món không mất ký tự nào, rác rơi êm về bảng rỗng · `parseNumberCell`
đọc đúng `2.450.000`/`2,450,000`/`1.234,5`, từ chối ỒN ÀO `2.45tr`/`50k`, bắt đúng số âm kế toán.

---

### 3g. VÒNG 3 — đã sửa 12 mục, số liệu TRƯỚC → SAU (tôi tự chạy lại, không lấy báo cáo agent)

| # | Sửa ở đâu | Trước → Sau |
|---|---|---|
| 1 | **`lib/ffe/parse-number.ts` (MỚI)** — một cỗ máy đọc số dùng chung; `apply-import` re-export, `normalizeQty` dùng nó | `normalizeQty('1.200','cai')` **1 → 1200** · `'2,450'` **2 → 2450** · `'2.45tr'`/`'50k'` **2/50 → null** (từ chối ồn ào thay vì đoán) · `'(1.500)'` kế toán **+2 → null** |
| 2 | `lib/boq/compute.ts` `AREA_UNITS` + nhánh vùng tô đối xứng 3 nhánh với món rời | vùng tô `unit='m'`/`'m3'`/`'kg'`/`'md'`: **9 m² · 900.000đ · errors:[] → 0 dòng · `unit-mismatch`** · `'thùng'` → **vẫn tính + `unknown-unit`, giữ nguyên chữ** · `m2`/`m²`/`sqm`/rỗng không đổi |
| 3 | `compute.ts` — nhân từ `m2` ĐÃ làm tròn | dòng `10 m² × 1.000.000đ`: thành tiền **9.998.244đ → 10.000.000đ** (Hoà nhân tay ra đúng số in trên bảng) |
| 4 | `compute.ts` — kiểm `Number.isFinite` sau phép nhân, cả 2 nhánh | `wastagePercent=1e308`: **`Infinity` + 0 lỗi → 0 dòng + `invalid-price`, tổng 0**; nút Xuất .xlsx hết ném lỗi bằng tiếng lập trình viên |
| 5 | `column-mapping.ts` — **chấm điểm mọi cặp (field, cột) rồi gán tham lam** thay cho "field đứng trước vồ cột đầu tiên", cộng `BLOCKED_HEADER_PHRASES` | **14/14 ca đảo đúng** (tôi chạy lại toàn bộ): `"Đánh giá"` → nhả ô Đơn giá cho `"Giá bán lẻ"` · `"Extended Price"`/`"Unit Price"` → đúng ô · `"Item Code"` → ô Mã, `"Item Name"` → ô Tên · `"Khu vực"` → nhả ô Phòng cho `"Phòng"` · `"Cao su"`/`"Báo cáo"`/`"Trọng lượng"`/`"Đại lý"`/`"sau thuế"` → không cướp ô kích thước nữa. **Không hồi quy**: bảng 14 cột đã verify trình duyệt vẫn ghép y hệt |
| 6 | `lib/boq/xlsx.ts` — lọc control char + làm sạch tên sheet | tên món chứa `\x01`: **XML hỏng (Excel báo "file bị lỗi") → sạch**, tab/xuống dòng/emoji **không** bị lọc oan · tên sheet 51 ký tự còn `/ [ ] :` → **30 ký tự, 0 ký tự cấm** |
| 7 | `apply-import.ts` — màu/độ tin cậy đọc không được thì **cảnh báo + giữ chữ gốc vào Ghi chú** | `'Trắng sữa'`: **rơi im lặng → dòng cảnh báo hiện trên bảng xem trước** (ảnh chụp UI ở §3h) |
| 8 | `lib/ffe/item.ts` + `ffe-table.ts` — thêm `tấm`, `cặp` vào đơn vị ĐẾM, sửa comment sai | `isCountUnit('tấm')` **false → true** · BOQ món rời `unit='tấm'` **`unknown-unit` → hết cảnh báo**. `md` (mét dài) vẫn là đơn vị ĐO — đúng |
| 9 | `item.ts` — `groupByRoom` gộp theo khoá chuẩn hoá, **nhãn giữ bản gặp đầu tiên** | 4 cách gõ "Phòng khách" → **3 nhóm → 1 nhóm**, không tự viết hoa lại chữ người dùng |
| 10 | `compute.ts` — khử trùng `id` + báo rõ đã bỏ mấy bản | 2 hatch cùng id **18 m²/1.800.000đ/errors:[] → 9 m²/900.000đ + lỗi** · 2 block cùng id **qty 2 → 1** |
| 11 | `image-match.ts` — `matchImagesForRowsEx` trả `duplicateNames` | ảnh trùng tên 2 thư mục: **không có đường nào để biết → có danh sách trùng kèm đường dẫn**. 🟡 **UI chưa đọc** (`components/**` ngoài vùng) ⇒ người dùng VẪN chưa thấy cảnh báo |
| 12 | `prisma/schema.prisma` — viết lại cảnh báo 2 cột `room`/`confidence` | docblock cũ nói nguy cơ "vỡ tsc" (SAI) → nay ghi đúng: **`prisma generate` mà chưa `db push` ⇒ chết RUNTIME toàn bộ ProductSpec**, kèm lệnh §5 |

**Hai chỗ cố ý làm khác chỉ đạo, ghi rõ để Hoà bác được nếu không đồng ý:**

1. **Không thêm `BoqErrorReason` mới** cho ca tràn số và ca trùng id — `actionLabel()` trong
   `components/present-editor/boq/BoqErrors.tsx` là `switch` **không có `default`** (tôi kiểm:
   `grep -c "default:"` = 0), thêm lý do mới là **vỡ `tsc` toàn repo**, mà `components/**` ngoài
   vùng phiếu. Nên dùng lại `invalid-price` (tràn số — cùng việc phải làm: sửa giá trong kho) và
   `invalid-geometry` (trùng id — cùng việc: soi đúng đối tượng hỏng trên bản vẽ), có ghi 2 sub-ca
   vào docblock `lib/boq/model.ts`. **Việc còn thiếu**: tách `'duplicate-entity-id'` riêng + 1 `case`
   ở `BoqErrors.tsx` khi ai đó đụng được vùng đó.
2. **Một test cũ bị VIẾT LẠI, không giữ xanh nguyên trạng**: `compute.test.ts` [8] trước đây khoá
   **đúng cái bug** — nẹp chân tường 45.000đ/mét dài × 6 m² = 270.000đ, `errors: []` — và tự ghi
   nhãn *"SAI Ý NGHĨA… đây CHÍNH LÀ giới hạn cần biết"*. Test khoá một giới hạn đã biết là đúng khi
   chưa sửa được; nay sửa được rồi thì nó phải đổi. Phần lịch sử giữ trong comment.

### 3h. Nghiệm thu vòng 3 (tôi tự chạy, không qua agent)

- **Test vùng**: compute 157 · xlsx 71 · item 44 (mới) · sheet 71 · port 31 · column-mapping 119 ·
  apply-import 93 · image-match 25 · xlsx-parse 9 · ffe-table 40 — **660 pass, 0 fail**.
- **Trình duyệt thật** (127.0.0.1:3005, cửa nhập Excel/CSV, file `.csv` có cột "Đánh giá" ghi `4,5`
  và Số lượng ghi `1.200`):
  - bảng xem trước hiện **`1200 cái`** (trước vòng 3 hiện `1`) ⇒ lỗi sai 1000× chết ở đúng chỗ
    người dùng nhìn;
  - **"Đánh giá" không còn cướp ô Đơn giá** — hiện trong *"2 cột trong file KHÔNG được nhập:
    «Đánh giá» · «Thành tiền»"*, ô Giá vẫn ← "Đơn giá";
  - màu `Trắng sữa` → *"không phải mã màu dạng #rrggbb — món vẫn được nhập, chữ gốc giữ trong Ghi
    chú, ô Màu để trống (IF không đoán mã màu từ tên gọi)"*;
  - 16 ô ghép cột vẫn đúng y như lần verify trước ⇒ **không hồi quy**.
- **`git status`** vùng C: đúng 14 file sửa + 2 file mới (`lib/ffe/item.test.ts`,
  `lib/ffe/parse-number.ts`), không file nào ngoài vùng.

---

## 4 · CHƯA VERIFY ĐƯỢC / CÒN HỞ — nói thẳng

1. **Chưa bấm được BOQ trên trình duyệt.** Đang nghiệm thu thì dev server dùng chung (cổng 3005,
   của phiên khác) **trả 500 ở MỌI route** — `curl` xác nhận cả `/materials` lẫn
   `/projects/…/present` cùng 500, trong khi vài phút trước `/materials` chạy tốt. Nguyên nhân:
   phiên khác đang sửa dở `components/library/*`, `components/print/*`, `app/globals.css`. **Không
   dựng server thứ hai** (cùng cây mã ⇒ cùng vỡ, và luật cấm tự mở dev server mới). ⇒ dòng "món
   rời lên BOQ" mới chứng minh ở mức **engine chạy thật**, chưa ở mức mắt nhìn trên bảng.
2. **Chưa mở .xlsx bằng Excel/LibreOffice thật.** Bằng chứng dừng ở cấu trúc ZIP + openpyxl.
   Không loại trừ Excel khó tính hơn.
3. **`room` · `qty` · `confidence` nhập vào rồi KHÔNG lưu xuống đâu cả.** `ProductSpec` chưa có
   cột (§5), `FfeTable` chỉ sống trong state React của cửa nhập để tải file hồ sơ FF&E — **rời màn
   hình là mất**. Nhập 100 món xong đóng tab thì phòng/độ tin cậy bay sạch. Đây là **cái đỏ thật
   còn lại** của G-M3-08, không phải chi tiết nhỏ.
4. **Chưa thử file `.xlsx` thật qua hộp thoại** (mới `.csv` thật + test đơn vị cho nhánh xlsx).
5. **`buildFfeTable`** (`apply-import.ts:234`) không có nơi gọi ngoài test — `runImport` tự dựng
   bảng. Hàm thừa, vô hại, ghi để phiên sau không tưởng là đường chạy thật.
6. 🔴 **Cảnh báo về mọi câu "tsc sạch" trong sổ các phiên gần đây**: lúc chạy `npx tsc --noEmit -p .`
   có **lỗi CÚ PHÁP** trong file của phiên khác (`components/library/library-sheet-css.ts`), và khi
   gặp lỗi cú pháp **tsc bỏ qua toàn bộ kiểm ngữ nghĩa** (đã thử nghiệm riêng để xác nhận). Chạy
   lại bằng cấu hình loại đúng file đó: **vùng của phiếu này 0 lỗi** (36 file gốc + 563 file phụ
   thuộc), toàn repo còn **đúng 1 lỗi ngữ nghĩa ngoài vùng**: `lib/cad/render-layer-index.test.ts:36`
   (TS2352, ép `{scale,tx,ty}` → `Viewport` thiếu `panX/panY`) — **không sửa** vì `lib/cad` là vùng
   M1 giữ. Phiên nào sửa xong file cú pháp kia sẽ thấy lỗi này nhảy ra, đừng tưởng mình vừa gây ra.

---

## 5 · 🔴 Việc Hoà phải chạy tay — G-M3-08 (sandbox không làm được)

Cột `room` + `confidence` đã khai trong `prisma/schema.prisma` (cuối `model ProductSpec`) nhưng
`sqlite3 prisma/dev.db "PRAGMA table_info(ProductSpec)"` xác nhận **DB chưa có**. Luật cấm chạy
`prisma db push`/`migrate` qua sandbox (FUSE không khoá được file SQLite, và có phiên khác đang
chạy dev server trên cùng `dev.db`). Lệnh soạn sẵn — **tắt hết dev server trước khi chạy**:

```bash
cd /Users/tranben/Downloads/interiorflow && sqlite3 prisma/dev.db ".backup 'prisma/dev.db.bak-truoc-cot-room'" && npx prisma db push && npx prisma generate
```

Chạy xong mới được mở khoá đường ghi (3 chỗ, đã ghi sẵn trong docblock `lib/server/specs.ts:8-27`):

1. `SPEC_ROOM_COLUMN_READY` → `true`;
2. thêm `room: str(b.room)` + `confidence: str(b.confidence)` vào `specNormalize` và `specPatch`;
3. thêm 2 dòng tương ứng vào `specToDto`.

⛔ Bật cờ khi **chưa** migrate = vỡ ngay ở lần ghi đầu, và làm hỏng mọi truy vấn `ProductSpec` của
các phiên khác đang chạy.

---

## 6 · Trạng thái phiếu

- **Đã nghiệm thu chạy thật**: G-M3-06 (trình duyệt, 2 vòng) · G-M3-05 · G-M3-07 (trình duyệt) ·
  G-M3-09 (engine) · G-M3-11 · G-M3-04 (file .xlsx thật).
- **Còn đỏ**: G-M3-08 (chờ lệnh §5) · G-M3-01 (thu hẹp, cần đổi mô hình tách) · và **chỗ chứa
  `room`/`qty`/`confidence` sau khi nhập** (§4 mục 3).
- **Việc nhỏ còn nợ, đã ghi rõ chỗ**: nối `duplicateNames` (ảnh trùng tên) vào UI cửa nhập · tách
  `'duplicate-entity-id'` thành `BoqErrorReason` riêng + 1 `case` ở `BoqErrors.tsx` · tiêu thụ
  `FfeSheet.invalidQtyItemIds` khi xuất hồ sơ (món bị loại vì số lượng hỏng hiện vẫn biến mất khỏi
  file mà file không nói gì) — cả ba đều nằm ở `components/**`, ngoài vùng phiếu này.
- **Không làm** (đúng phiếu, chờ M1): G-M3-10 · 12 · 13 · 14 · 16.
- **Không commit** (V6). **Không sửa `GAP-IF.md`** (§0u) — trạng thái các dòng G-M3 trong đó vẫn
  ghi "🔴 chưa sửa", người giữ sổ cập nhật theo tài liệu này.

---
---

# PHẦN BỔ SUNG — VÒNG 2 (06/08 tối, sau khi chủ dự án chạy `db push` + `generate`)

> Bổ sung, **không sửa phần trên**. Bối cảnh đổi: cột `room`/`confidence` nay CÓ THẬT trong DB
> (`PRAGMA table_info(ProductSpec)` = **34 cột**), `SPEC_ROOM_COLUMN_READY = true`, 3 đường
> `specNormalize`/`specPatch`/`specToDto` đã nối. Bom hẹn giờ ở §3e **đã được gỡ**.

## 7 · G-M3-08 — ĐÓNG. Phòng + độ tin cậy lưu thật, sống qua vòng đóng-mở tab

**Việc thiếu đúng 2 dòng**: `specNormalize()` đã biết ăn `room`/`confidence` từ lúc TỔNG mở khoá,
nhưng `payload` mà cửa nhập gửi lên **không có 2 trường đó** ⇒ đường thông mà không ai đi.

| File | Sửa gì |
|---|---|
| `lib/materials/warehouse/apply-import.ts` | `payload` gửi thêm `room` + `confidence`. `confidence` gửi MỨC đã nhận ra ('measured'/'inferred'/'manual'); chữ không khớp mức nào ('Cao', '90%') để TRỐNG + đã cảnh báo — **không bịa mức tin** |
| `lib/materials/warehouse/dto.ts` | `MaterialWritePayload` + `MaterialSpecDto` khai 2 trường. Docblock ghi rõ **vì sao `qty` KHÔNG có và sẽ không có** |
| `components/materials/MaterialTable.tsx` | **cột "Phòng"** — chỗ NHÌN THẤY được rằng phòng đã xuống DB |
| `components/materials/MaterialImportWizard.tsx` | câu dưới nút nhập trước ghi cả 3 cột "chưa lưu được" — nay SAI với Phòng/Độ tin cậy. Sửa: chỉ còn Số lượng, và nói thẳng "Phòng và Độ tin cậy thì đã lưu vào kho" |

**Nghiệm thu N6 trên app thật** (127.0.0.1:3006, `demo@if.local`, nhập .csv 2 dòng qua đúng
`input[type=file]` của cửa nhập, bấm nút "Nhập 2 dòng"):

1. Cửa nhập báo **"Đã thêm 2 nội thất rời"**.
2. `sqlite3 prisma/dev.db` ngay sau đó:
   `ZZ-CH-01 | cái | 2450000 | Phòng làm việc | measured` · `ZZ-FL-01 | m2 | 1250000 | Sảnh chờ | inferred`.
3. **Tải lại toàn trang** → bảng kho hiện đủ 2 dòng, cột **Phòng** = "Phòng làm việc" / "Sảnh chờ".
   ⇒ đúng nghiệm thu "nhập → đóng tab → mở lại, phòng và độ tin cậy CÒN NGUYÊN".
4. Đã xoá sạch dữ liệu thử sau khi nghiệm thu (`ProductSpec` về đúng 10 dòng seed, `select count(*)
   where name like 'ZZTEST%'` = 0).

⚠️ **`qty` (số lượng) CỐ Ý không lưu vào `ProductSpec`** — đó là DANH MỤC dùng chung nhiều dự án,
số lượng là của TỪNG dự án (`FfeItem.qty`). Nhét vào danh mục là đẻ ra "một mã hàng hai số lượng
khác nhau ở hai dự án". Câu trên UI nay nói đúng điều này thay vì gộp chung "cả 3 chưa lưu được".

## 8 · Hai lỗi MỚI bắt được **trong lúc nghiệm thu** (không có trong phiếu)

### 8a. 🔴 Nhập vào ngăn "Nội thất rời" xong thì hàng BIẾN MẤT khỏi màn kho
`MaterialsScreen` hard-code `fetch('/api/specs?kind=material')`. G-M3-07 vừa cho người dùng chọn
ngăn (và tự đoán đúng "Nội thất rời"), nhập xong báo "Đã thêm 2 nội thất rời" — rồi **màn hình duy
nhất xem được kho không hiện chúng**. Người dùng thấy đúng cảnh "nhập xong không thấy đâu", tưởng
mất dữ liệu. Đây là cửa ra của chính G-M3-07, không sửa thì việc đó coi như chưa đóng.
→ Sửa: nạp MỌI loại + thêm ô lọc **"Tất cả loại"** (nhãn lấy từ `IMPORT_KIND_LABEL`, cùng nguồn chữ
với ô chọn ngăn của cửa nhập). Verify: sau khi sửa, 13 mục hiện đủ, lọc đổi được.

### 8b. 🔴 Nút "Bảng khối lượng (BOQ)" bấm KHÔNG RA GÌ khi vào thẳng URL dự án
`PresentStageScreen` render BOQ khi `mode === 'boq' && userId`. Vào thẳng
`/projects/[id]/present` (dán link, hard-reload, hoặc điều hướng không qua Home) thì
`useFlowStore.hydrate()` chưa chạy lần nào và `lastUserId` rỗng ⇒ `userId` rỗng ⇒ **bấm 3 lần, màn
hình đứng nguyên ở deck, không một dòng báo**. Đo được: `window.__flowStore.getState().user =
undefined`. Đúng thứ luật §9 cấm ("cấm nút giả bấm không ra gì"); cũng chính là cái bẫy STATUS.md
đã ghi ở mục "PHÁT HIỆN QUAN TRỌNG", nay có hậu quả cụ thể nhìn thấy được.
→ Sửa tại gốc (phiên đăng nhập VẪN CÒN, chỉ là store chưa biết): hỏi `/api/auth/me` một lần rồi
`setUser` — dùng đúng endpoint `SessionWatch` đang dùng, không chế đường xác thực thứ hai.

## 9 · G-M3-09 · 11 · 04 — ba nút: ĐÃ CÓ SẴN VÀ CÓ CHỮ, nay đã bấm thật

Phiếu giả định 3 nút chưa nối. Kiểm bằng `grep` + bấm thật: **cả ba đã có, đều có CHỮ (đúng luật
G6, không icon trần)** — `In A4 ngang` · `Xuất xlsx` · `Tính lại từ bản vẽ` (`BoqScreen`) ·
`Tải hồ sơ FF&E (N món)` (cửa nhập). Việc thật còn thiếu là **chưa ai bấm chúng**. Nay đã bấm:

Dựng bối cảnh: tiêm vào bản vẽ 1 vùng tô sàn (5000×4000, mã ZZ-FL-01) + 8 ghế cùng mã ZZ-CH-01 +
1 bàn CHƯA gán mã, qua `window.__cadStore.addEntities()` (**không bao giờ `setState({doc})`** —
luật rút ra từ sự cố 04/08), rồi bấm "Bảng khối lượng (BOQ)".

**Bảng hiện ra (ảnh chụp trong transcript phiên):** 11 cột kể cả **Ảnh** và **Khối lượng · Đơn vị**.

| # | Mã | Hạng mục | Quy cách | Đơn vị | Khối lượng | Đơn giá | Thành tiền |
|---|---|---|---|---|---|---|---|
| 1 | ZZ-FL-01 | ZZTEST Sàn gỗ sồi | — | m² | 20.00 | 1 250 000 | 25 000 000 |
| 2 | ZZ-CH-01 | ZZTEST Ghế xoay lưới | 620×600×1150mm | **cái** | **8** | 2 450 000 | **19 600 000** |

Tổng · engine **44 600 000 ₫**; dòng subtotal ghi rõ *"(m² — món tính theo cái không cộng vào cột
này)"*; và có dòng lỗi **"1 món rời … chưa gán mã hàng (specId) — KHÔNG có dòng nào trong báo giá,
tiền của chúng đang bị thiếu"** kèm nút "Xem 1 món chưa gán mã" ⇒ **món rời lên được BOQ có số
lượng, và món thiếu mã không im lặng**.

### Mở `.xlsx` bằng **Numbers THẬT** (không chỉ openpyxl)

Bấm nút **"Xuất xlsx"**, tóm đúng `Blob` nút tạo ra (6.878 byte, MIME
`…spreadsheetml.sheet`), ghi ra đĩa, `file` nhận **"Microsoft Excel 2007+"**, rồi `open -a Numbers`.
Đọc ngược bằng AppleScript trên tài liệu Numbers đang mở:

```
docs=BOQ-tu-nut-Xuat-xlsx | sheet=BOQ | rows=10 cols=10 | A1=Mã vật liệu
B3=ZZTEST Ghế xoay lưới | F3=8,0 | G3=cái | J3=1,96E+7 | J4(SUM)=4,46E+7
```

⇒ Numbers mở được, **không báo file hỏng**, dấu tiếng Việt nguyên vẹn, **công thức `SUM` còn sống**.
(File .xlsx CÓ ẢNH thì bằng chứng vẫn dừng ở mức cấu trúc zip + openpyxl như §2 — lô test này không
có ảnh gắn vào mã hàng nên nút xuất không nhúng ảnh nào.)

## 10 · Nghiệm thu vòng 2

- **Test vùng**: 660 pass, 0 fail (compute 157 · xlsx 71 · item 44 · sheet 71 · port 31 ·
  column-mapping 119 · apply-import 93 · image-match 25 · xlsx-parse 9 · ffe-table 40).
- **`npx tsc --noEmit -p .`**: đúng **1 lỗi CÓ SẴN** — `lib/cad/render-layer-index.test.ts:36`
  (TS2352), thuộc `lib/cad` là vùng M1 giữ, không chạm. **Ít hơn mức 3 lỗi phiếu cho phép** (2 file
  `2407-Test` không còn nằm trong tầm `tsc` nữa).
- **Dữ liệu thử đã dọn sạch**: 3 dòng `ZZTEST` xoá khỏi `dev.db` (còn đúng 10 dòng seed) · 10
  entity `zz_*` gỡ khỏi bản vẽ bằng `removeIds` · bản sao .xlsx trong `~/Downloads` đã xoá, Numbers
  đã đóng.

## 11 · CHƯA LÀM ĐƯỢC — nói thẳng

1. **Không có file PNG trong `docs/screenshots/`.** Trình duyệt xem trước trong phiên **chỉ trả ảnh
   về khung chat, không ghi được ra đĩa**; `screencapture -l <window>` bị chặn ("could not create
   image from window" — thiếu quyền ghi màn hình); Chrome headless + CDP thì **đăng nhập được
   (200) và API trả đúng dữ liệu, nhưng bảng không bao giờ render** (đứng ở vòng xoay, đã thử
   `Page.setWebLifecycleState('active')`, `visibilityState=visible`, reload trong trang — quirk của
   headless, không phải lỗi app: cùng URL đó trên trình duyệt xem trước hiện đủ dữ liệu). Ảnh chụp
   THẬT của 2 màn (kho vật liệu có cột Phòng · bảng BOQ có dòng 8 cái) **nằm trong transcript phiên
   này**, chủ dự án xem trực tiếp được; tôi **không** để lại file rác chỉ có vòng xoay.
2. **Chưa mở .xlsx CÓ ẢNH bằng Numbers** (lô test không có ảnh gắn mã hàng) — mức bằng chứng cho
   ảnh nhúng vẫn là zip + openpyxl.
3. **G-M3-01 giữ nguyên, không làm vòng này** (đúng chỉ đạo) — xem §12.
4. **Dev server cổng 3005 của phiên khác đang ôm Prisma client CŨ** (khởi động 14:04, client
   generate lại lúc 22:00) ⇒ mọi `POST /api/specs` trên cổng đó trả **500**. Không phải lỗi code:
   cùng lệnh ghi qua Prisma từ CLI chạy sạch, và server mới (3006) trả 201. **Chủ phiên đó phải
   khởi động lại dev server của mình**, nếu không sẽ tưởng bản vá này hỏng.

## 12 · G-M3-01 — cần đổi cái gì để TỔNG mở phiếu riêng

Chỗ tắc **không nằm ở code IF** mà ở NĂNG LỰC MÔ HÌNH đang dùng:

- Hiện tại `ai.furnitureextract` (`lib/nodes/defs/render-v2.ts`) gọi BiRefNet — mô hình **tách nền
  (salient object segmentation)**: 1 ảnh vào → **đúng 1 vùng tiền cảnh** ra. Không có khái niệm
  "có mấy món trong ảnh".
- Muốn "bốc N món/ảnh" phải thêm một bước **phát hiện đối tượng nhiều mục** trước bước tách nền:
  mô hình kiểu detection/instance-segmentation (vd họ Grounding-DINO + SAM, hoặc dịch vụ có sẵn
  API trả bbox+mask theo nhãn) → ra danh sách bbox → **mỗi bbox chạy lại đúng dây chuyền đã có**
  (`furnitureextract` cắt món → `vision.measureobject` đo → `util.ffetable` gom thành bảng).
- Nghĩa là **phần sau của dây chuyền KHÔNG phải làm lại** — chỉ thiếu mắt xích đầu. Phiếu riêng
  cần quyết 3 điều: (a) dùng mô hình/dịch vụ nào (có khoá API chưa, giá mỗi lượt bao nhiêu — ảnh
  hưởng bảng giá credit ở `lib/ai/tiers.ts`); (b) chạy trên máy hay gọi dịch vụ ngoài (luật
  local-first); (c) ngưỡng tin cậy bao nhiêu thì hiện món cho người dùng xác nhận, vì detection
  sai thì cả bảng FF&E sai theo.

---

## 13 · ĐỢT 07/08 — VIỆC 1-7 theo phiếu mới, kiểm lại + 2 vá thật

### VIỆC 1+2+3 (BOQ nút · xuất xlsx · FF&E) — ĐÃ ĐÓNG TỪ 06/08, sổ `GAP-IF.md` G-M3-09/11/04 CŨ
Đọc lại code trước khi làm theo đúng N9/§0o (không tin mô tả cũ) — cả ba đã có nút thật, không
phải mock:
- `components/present-editor/boq/BoqScreen.tsx:303` nút "Xuất xlsx" gọi `exportXlsx()` →
  `boqResultToXlsxBuffer` (`lib/boq/xlsx.ts:368`) — tải file `.xlsx` thật qua Blob+`<a download>`.
  Nút "Tính lại từ bản vẽ" (`:306`) gọi `compute()` → `POST /api/boq/[projectId]` →
  `computeBoqForProject` (`lib/boq/from-project.ts:66`) → `computeBoq` (`lib/boq/compute.ts:231`).
  `BoqScreen` mount tại `components/present-editor/PresentStageScreen.tsx:95` (route Trình chiếu).
- `components/materials/MaterialImportWizard.tsx:441` nút "Tải hồ sơ FF&E" gọi `exportFfeSheet()`
  → `buildFfeSheet` (`lib/ffe/sheet.ts:135`) + `ffeSheetToXlsxBuffer` (`lib/ffe/sheet.ts:241`).
  Wizard mount qua `MaterialsScreen` (`/materials`, đã có từ P3).
⇒ Dòng "🔴 chưa sửa" trong `docs/GAP-IF.md` G-M3-09/G-M3-11 **lệch với code thật** (đã sửa 06/08,
sổ chưa cập nhật — đúng cơ chế §0u một-người-ghi, TỔNG chưa gộp). Không tự sửa `GAP-IF.md`, ghi
delta ở đây để TỔNG gộp.
**CHƯA làm được trong phiên này:** bấm-thật-qua-trình-duyệt bị chặn bởi sự cố môi trường ngoài
tầm việc này — xem mục "Trở ngại môi trường" cuối phần này. Bằng chứng thay thế: đọc trực tiếp
mã nguồn xác nhận nút → hàm → API/engine nối liền một mạch, không đứt đoạn; `npx tsc --noEmit -p .`
sạch (không tính 1 lỗi CŨ không liên quan ở `lib/cad/render-layer-index.test.ts`).

### VIỆC 4 — G-M13-03 · dựng trang cho `components/print`
Kiểm lại bằng `grep -rna` (đúng §0t) trước khi kết luận, khác với ghi chú cũ trong sổ:
```
grep -rna "PaperSheetFrame\b" components app lib | grep -v "components/print/PaperSheetFrame.tsx"
grep -rna "LineweightTable\b" components app lib | grep -v "components/print/LineweightTable.tsx"
grep -rna "RadialToolMenu" components app lib
```
Kết quả: `PaperSheetFrame` (variant `preview`) và `LineweightTable` **ĐÃ mount thật** trong
`components/print/ExportPdfDialog.tsx:241,252` — không phải comment như sổ `GAP-IF.md` ghi (mô tả
đó lệch thời điểm: đúng lúc viết sổ, sai sau khi `ExportPdfDialog` được dựng). Chỉ **`RadialToolMenu`
(Màn 9)** thật sự chưa có nơi mount nào — đây là phần còn thiếu thật của G-M13-03.

**Đã làm:** mount `RadialToolMenu` — nút tròn "Công cụ" (icon `Wand2`) nổi góc dưới-phải bản xem
trước trong `ExportPdfDialog` (`components/print/ExportPdfDialog.tsx`, prop mới `onPickTool?`).
KHÔNG dựng engine vẽ tay mới lên bản xem trước tĩnh (việc đó lớn, ngoài phạm vi "nối nút", và
`docs/00-BAT-DAU-DOC-DAY.md` §0d cấm đập-làm-lại phần đang chạy). Bấm một công cụ trong đĩa tròn
→ đóng hộp thoại → chuyển THẲNG sang công cụ CAD **thật** tương ứng qua `useCadStore` (nối ở
`components/cad/CadSheets.tsx`, hàm `PaperExportDialogHost`):
`pen→polyline` · `shape→rect` · `eraser→select` · `measure→measure` · `text→text` · `undo→undo()`.
Không truyền `onPickTool` (đường mount còn lại ở `components/present-editor/Toolbar.tsx`) thì nút
ẩn hẳn — đúng luật §9 "cấm nút giả bấm không ra gì", vì chặng Trình chiếu không có khái niệm công
cụ CAD để chuyển sang.
File sửa: `components/print/ExportPdfDialog.tsx` · `components/cad/CadSheets.tsx`.

### VIỆC 5 — G-M13-01 · 9 chỗ gọi mạng không bắt lỗi (phần mảng này)
Hai chỉ điểm cũ lệch dòng do repo đổi liên tục (đúng cảnh báo §0i "chiếu dòng phải kèm chuỗi grep
được"), kiểm lại tận nơi:
- `components/present-editor/PresentEditor.tsx:263,268` — **ĐÃ có `try/catch` thật** (catch ở
  dòng 284, cách chỗ gọi 21 dòng — NGOÀI cửa sổ ±14 dòng mà script quét gốc dùng, nên bị báo
  dương tính giả). Không sửa gì — không phải bug.
- `components/render-studio/ToolModeForm.tsx:570` (nay `:570` trong `MeasurementExportButton`) —
  **BUG THẬT**: `await exportMeasurementSpecSheet(...)` chỉ có `try/finally`, không `catch`. Dựng
  file hỏng (canvas lỗi, đĩa đầy…) thì nút kẹt "Đang dựng spec sheet…" rồi hết trạng thái bận mà
  không nói gì — đúng mô tả "màn hình im lặng, không báo, không lùi được". **Đã sửa**: thêm
  `catch` + state `error` hiện dòng đỏ ngay dưới nút. File sửa:
  `components/render-studio/ToolModeForm.tsx`.
- `components/entry/LoginForm.tsx` · `components/notebook/useNotebook.ts` ·
  `components/entry/LoginBackdrop.tsx` — **KHÔNG đụng**, đúng chỉ đạo "thuộc phiếu khác".

### VIỆC 6 — G-M3-17 · nối đường ghi FfeTable → DB
Đọc code trước khi làm (N9): **đã đóng từ 06/08 VÒNG 2**, cùng đợt với VIỆC 1-3, KHÔNG phải việc
mới. Bằng chứng — `lib/materials/warehouse/apply-import.ts:14` (docstring) + `:190-201`: `room`
và `confidence` được gửi thật trong payload `POST /api/specs`, ProductSpec đã có cột DB (G-M3-08).
`components/materials/MaterialImportWizard.tsx:419-434` nói rõ với người dùng: Phòng + Độ tin cậy
ĐÃ lưu vào kho; chỉ Số lượng KHÔNG lưu (cố ý — số lượng thuộc dự án, không thuộc danh mục dùng
chung). Sổ `GAP-IF.md` G-M3-17 ghi "🔴 chưa sửa — đã giao ở phiếu vòng 2" **lệch với code thật**
(việc đó đã làm xong trong đúng phiếu vòng 2 được nhắc tới) — ghi delta ở đây, không tự sửa sổ.

### VIỆC 7 — tự soát hàm lib/boq · lib/ffe có nơi gọi không
Lệnh đã chạy (`grep -rna`, đúng §0t):
```
grep -rna "<tênHàm>" components app | grep -v "/lib/boq/\|/lib/ffe/"      # gọi trực tiếp từ UI/route
grep -rna "<tênHàm>" lib | grep -v "\.test\.ts:" | grep -v "export function <tênHàm>"  # gọi từ lib khác
```
33 hàm/const export trong `lib/boq/*.ts` + `lib/ffe/*.ts` (trừ `*.test.ts`) — **32/33 có ít nhất
một nơi gọi thật** (trực tiếp từ `components`/`app`, hoặc gián tiếp qua lib khác rồi lib đó được
UI dùng — vd `normalizeQty`/`makeFfeItem`/`emptyFfeTable` dùng trong `lib/materials/warehouse/
apply-import.ts`, `lib/nodes/defs/ffe-table.ts`).

**1 hàm mồ côi thật:** `mergeFfeTables` (`lib/ffe/port.ts:88`) — 0 nơi gọi ngoài
`lib/ffe/port.test.ts`. Có test (`port.test.ts:93-97`, gộp N bảng FF&E bỏ qua null/undefined) nhưng
không nơi nào trong sản phẩm gộp nhiều `FfeTable`. Không tự xoá (có thể là hạ tầng cho việc gộp
nhiều lượt nhập FF&E sau này) — ghi vào đây làm M-OUT delta cho TỔNG cân nhắc đưa vào `GAP-IF.md`
hoặc xoá nếu xác nhận không còn dùng tới.

### Trở ngại môi trường — nói thẳng, không giấu
Phiên này chạy trên `interiorflow-p2` (cổng 3002, theo quy ước cổng PHU). Giữa lúc verify trình
duyệt thật, `components/library/library-sheet-css.ts` bị MỘT PHIÊN KHÁC sửa dở (lỗi cú pháp tạm
thời — không phải file của mảng này, cấm chạm theo chỉ đạo) làm webpack cache hỏng
("incorrect header check", `ENOENT` khi rename pack file) → sau đó cả `.next` dev server rối loạn
(`__webpack_require__.C is not a function`, mọi route kể cả `/api/auth/me` trả 500). Đã dừng hẳn
server (`preview_stop`) thay vì để lại trạng thái hỏng. **Chưa kịp bấm-thật qua trình duyệt cho
VIỆC 1-3 và nút "Công cụ" mới ở VIỆC 4** trước khi sự cố xảy ra — bằng chứng đang có chỉ ở mức đọc
mã nguồn + `tsc` sạch, KHÔNG phải N6 đầy đủ. Đề nghị: Hoà (hoặc phiên sau, cổng khác) bấm thật lại
2 nút BOQ/FF&E (đã biết chạy từ 06/08, chỉ cần xác nhận lại) + nút "Công cụ" mới trong hộp thoại
Xuất PDF (chặng Thiết kế 2D → Xuất → icon đũa phép góc dưới-phải bản xem trước).

### File đã sửa trong ĐỢT 07/08 (chưa commit, đúng V6)
- `components/print/ExportPdfDialog.tsx` — thêm `onPickTool` + nút "Công cụ" + mount `RadialToolMenu`.
- `components/cad/CadSheets.tsx` — nối `onPickTool` vào `useCadStore` (tool thật + `undo()`).
- `components/render-studio/ToolModeForm.tsx` — bắt lỗi `exportMeasurementSpecSheet`, hiện thông báo đỏ.
- `docs/M-FIX-C-OUT.md` — mục này.
