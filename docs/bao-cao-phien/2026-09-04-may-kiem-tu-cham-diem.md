# 04/09 · KIỂM CHÍNH BỘ MÁY KIỂM — "những con số ta đang tin có đáng tin không?"

> **Trả lời một câu: phần lớn thì đáng tin, nhưng có bốn chỗ KHÔNG — và ba trong bốn chỗ đó
> tôi chứng minh được bằng cách RÚT RUỘT hoặc XOÁ HẲN một tệp mà cổng vẫn báo xanh.**
> Không phải "nghi ngờ chung chung". Mỗi ca dưới đây đều có một thí nghiệm chạy được.

Mốc: `c556c6ff` → ff-only lên `origin/integration/2026-09-04` (lệch 235, cây sạch, `merge-base` rc=0).

---

## ⓪ TIỀN ĐỀ CỦA PHIẾU — nhận, có sửa một chỗ

Phiếu mô tả khuôn bệnh là *"khẳng định đọc một thứ mà đường từ chỗ DỰNG tới chỗ ĐỌC không kiểm
thứ đó"*. **Nhận** — và đo xong thì thấy nó có **hai biến thể**, phiếu chỉ nêu một:

| | Biến thể | Dấu hiệu | Ca thật |
|---|---|---|---|
| ① | **tự chấm điểm** (phiếu nêu) | đường dựng→đọc không qua hàm sản phẩm nào | `san.specId === 'ps-go-soi'` |
| ② | **tautology qua hàm pass-through** ⭐ | *có* đi qua hàm sản phẩm, nhưng hàm đó không quyết định kết quả | mắt `.idfc` cũ · **hai mắt IndexedDB** |

Biến thể ② nguy hiểm hơn hẳn: nó **trông như đo hành vi**. Ca `.idfc` mà phiếu lấy làm ví dụ
thuộc loại này, và tôi tìm thêm được ca **nặng hơn ca gốc** cùng loại (xem 🔴-3).

Và một biến thể thứ ba lộ ra lúc đột biến, phiếu không nêu, tôi cũng không lường:

| ③ | **so gương** | hai vế cùng đi qua ĐÚNG MỘT hàm hỏng ⇒ luôn bằng nhau | `boqSauMo.totalAmount === boq2.totalAmount` — bẻ `computeBoq` trả rỗng thì **cả hai bên = 0**, mắt vẫn xanh |

---

## ① BẢNG ĐẦY ĐỦ — mỗi máy kiểm × số khẳng định × phân bố

### A · Bộ nghiệm thu (máy `npm run soi:mat-tu-cham` đọc được)

| bộ đo | tổng | 🟢 hành vi | 🟡 hình dạng | 🔴 tự chấm | ⭕ vòng tròn |
|---|---:|---:|---:|---:|---:|
| `nghiem-thu-g4-moat.mjs` | 63 | 57 | 0 | 6 | 8 |
| `nghiem-thu-g4-moat-danh-tinh.mjs` | 9 | 9 | 0 | 0 | 1 |
| `nghiem-thu-g6-kho-mo-dau.mjs` | 74 | 72 | 0 | 2 | 4 |
| `nghiem-thu-g6-dot-2.mjs` | 31 | 30 | 0 | 1 | 0 |
| **TỔNG (máy phủ)** | **177** | **168** | **0** | **9** | **13** |
| `nghiem-thu-g1.mjs` | — | — | — | — | — |
| `nghiem-thu-g2-hanh-trinh.mjs` | — | — | — | — | — |

🔵 **g1 + g2: máy KHÔNG phủ được, và số 0 ở đó là "máy mù", không phải "bộ rỗng".** Chúng dùng
khuôn khác (`const dat = …` → `ghi(ma, ten, dat?PASS:FAIL)`; g2 gom mọi phán quyết vào MỘT lời
gọi `ghi` trong khung chung). **Soi tay**: g1 = 8 ca · g2 = 13 hành trình, cả hai **lái trình
duyệt thật**, phán quyết đọc từ IndexedDB / đĩa / số thực thể sau reload ⇒ hạng **🟢**. Ca đáng
chú ý: J20 (nâng cấp) **trích hàm `snapshotBeforeUpgrade` từ `electron/main.js` rồi CHẠY nó**,
đọc lại bản sao bằng SQL thật — mạnh, dù đường trích hơi lạ.

⚠️ Sau khi sửa, `🔴 9` còn lại **6 là BÁO NHẦM của chính máy soi tôi vừa viết** (xem ⑦b).
Số 🔴 thật sự đáng lo, sau khi đọc tay: **0 ở g6 · 0 ở g6-dot-2 · 2 ở g4-moat**, và cả hai đã
được **đổi nhãn thành `TIỀN ĐỀ ·`** thay vì giả vờ là bằng chứng sản phẩm.

### B · Máy soi tĩnh (không có khẳng định kiểu `doi()` — hạng theo bản chất)

| máy soi | cơ chế | hạng | mốc hiện tại |
|---|---|---|---|
| `soi-frontier` | grep mẫu theo registry | 🟡 **và có 2 lỗ thật, xem 🔴-1/🔴-2** | 77 xong-máy · 0 lệch |
| `soi-tu-dien` | grep nhãn | 🟡 | 322 chữ trần |
| `soi-hinh-hoc` | grep radius | 🟡 **+ vùng mù, xem 🟡-A** | 32 ngoài thang |
| `soi-thao-tac` | grep luật thao tác | 🟡 **+ vùng mù, xem 🟡-B** | 2 lệch · 19 chờ mắt |
| `soi-contract` | đối chiếu FeatureContract ↔ nơi gọi | 🟢-yếu | 21 có dây · 0 lệch |
| `soi-cong-cu-chet` | dò đường mount | 🟡 — **tự khai đúng giới hạn** | 40 ca |

`soi-cong-cu-chet` đáng khen riêng: nó tự in *"Máy chứng minh CÓ ĐƯỜNG MOUNT, KHÔNG chứng minh
BẤM VÀO CÓ VIỆC XẢY RA"*. Đó là cách một máy soi 🟡 nên tự khai.

---

## ② TỪNG CA 🔴 — làm nó xanh-giả thế nào, bằng chứng

### 🔴-1 · `soi-frontier`: một tính năng "xong-MÁY" được chứng minh bằng **regex `'.'`**

`frontier-registry.mjs:23` (bản cũ) — entry `h4-picker`:
```js
bangChung: [{ file: 'components/present-editor/PresentDocTypePicker.tsx', mau: '.' }]
```
`'.'` khớp **bất kỳ ký tự nào** ⇒ điều kiện thật sự chỉ là *"tệp tồn tại và không rỗng"*.

**Thí nghiệm** — thay 185 dòng tệp bằng một chữ `x`:
```
printf 'x\n' > components/present-editor/PresentDocTypePicker.tsx
node scripts/soi-frontier.mjs
→ 👁 1 qua mắt Hoà · ✅ 77 xong-MÁY · ⬜ 56 chờ · 🔴 0 LỆCH     ← VẪN XANH
```

### 🔴-2 · `soi-frontier`: bằng chứng sống trong **CHÚ THÍCH**

`soi-frontier` khớp trên văn bản thô, không bóc chú thích. Ca thật: entry `scaffolder`, mẫu
`ProjectScaffolder` — chuỗi đó xuất hiện **đúng 2 lần, cả hai trong docstring**
(`lib/tasks/scaffolder.ts:2` · `scaffolder.test.ts:2`), **0 lần trong mã chạy**.

**Thí nghiệm** (ca khác, cùng cơ chế): gỡ `RadialToolMenu` khỏi `CadCanvas.tsx` (bỏ import
default, comment chỗ dùng, chỉ để tên trong chú thích) → `soi-frontier` **vẫn 0 LỆCH**, entry
`pie-menu-2d` vẫn "xong-MÁY".

⚠️ **Không kết tội oan**: `scaffolder` là tính năng **CÓ THẬT** — `suggestScaffold` được
`ProjectInitBoard.tsx:85` gọi thật. Đây là **bằng chứng yếu**, không phải khai láo. Đo được
**6/77** entry "xong" mất bằng chứng khi bóc chú thích; ≥4 trong đó chỉ là *diễn đạt kém*
(mẫu trỏ tên tệp/tên máy soi).

### 🔴-3 · `g4-moat`: hai mắt mang nhãn **IndexedDB** mà **không đọc IndexedDB** — và là **tautology tuyệt đối**

Bản cũ (`:414-416`):
```js
const quaIdb = JSON.parse(JSON.stringify({ …, sheets: [{ …, doc: doc2 }], … }));
const docIdb = quaIdb.sheets[0].doc;
doi('② IndexedDB — Doc qua vòng JSON không rơi trường nào',
    JSON.stringify(docIdb) === JSON.stringify(doc2), …);
```
`JSON.stringify(JSON.parse(JSON.stringify(x))) === JSON.stringify(x)` **đúng với MỌI input**.

**Thí nghiệm:**
```
node -e "const x={a:1,b:new Date(),c:undefined,d:new Map([[1,2]]),e:()=>1,f:[1,undefined,NaN]};
         const y=JSON.parse(JSON.stringify(x));
         console.log(JSON.stringify(y)===JSON.stringify(x), Object.keys(x).length, Object.keys(y).length)"
→ true 6 4          ← MẤT 2/6 khoá, Date→chuỗi, Map→{}, NaN→null … mắt VẪN XANH
```
Tức mắt **không thể phát hiện đúng thứ nhãn nó hứa** ("không rơi trường nào").

Và nó **không gọi `sheets-persist` một dòng nào** — `grep "require.*sheets-persist"` = **0**,
trong khi tệp đó được nhắc **4 lần trong chú thích** của chính bộ moat.

**Thí nghiệm nặng nhất của cả lượt** — xoá hẳn tệp lõi persistence:
```
mv lib/sheets-persist.ts /tmp/ && node scripts/nghiem-thu-g4-moat.mjs
→ ✅ ② IndexedDB — Doc qua vòng JSON không rơi trường nào
→ ── KẾT: 63/63 khẳng định ĐẠT ──        ← cổng G4 XANH TRỌN khi mất một tệp lõi
```

### 🔴-4 · `g4-moat`: tautology thuần — `bịaInferred === 0`

`inferred` xuất hiện trong bộ moat **đúng 4 lần: 2 trong chú thích, 1 chỗ ĐỌC, 1 chỗ khẳng
định — 0 chỗ GHI**. `doc.entities` là literal do chính bộ đo dựng. ⇒ **Không thao tác nào
trong `lib/` làm nó đỏ được.** Nó chỉ đỏ nếu ai sửa chính bộ đo.

### 🔴-5 · `g4-moat`: `san.specId === 'ps-go-soi'` — ca sách giáo khoa

**Thí nghiệm hai chiều, `git diff -- lib app components` = 0 tệp cả hai lần:**
1. đổi literal `specId: 'ps-go-soi'` → `'ps-XXX-hong'` ⇒ mắt **ĐỎ** (52/63)
2. đổi thêm literal trong điều kiện thành `'ps-XXX-hong'` ⇒ mắt **XANH lại**

⇒ Làm nó xanh **chỉ cần sửa dữ liệu mẫu**, mã sản phẩm đứng yên.

### 🟡-A · `soi-hinh-hoc` mù thư mục `app/`
`SCAN_DIRS = ['components']` + đúng một tệp `app/globals.css`. Đo `app/` (trừ globals.css):
**19 khai báo radius ngoài thang** (7×2 · 8×8 · 9×4 · 12×4 · 22×1). ⇒ **mốc 32 là SÀN,
thực tế ≥51.** *(Tôi tự báo quá tay một lần ở đây — lần đầu đọc nhầm số dòng grep thành giá
trị radius; đã đếm lại đúng.)*

### 🟡-B · `soi-thao-tac` quét không đều
Luật `cam-hex-inline` chỉ khai `{ dir: 'components' }`, trong khi hai luật khác
(`backdrop-filter`, `outline`) đã khai cả `components` **lẫn** `app`. Đo `app/`:
**59 hex gõ cứng** không ai thấy. ⇒ **mốc 193 là SÀN, thực tế ≥252.**

---

## ③ SIẾT ĐƯỢC MẤY — và siết xong LỘ RA gì

| # | Siết gì | Hiệu chuẩn (bẻ MÃ SẢN PHẨM ⇒ phải đỏ) |
|---|---|---|
| S1 | hai mắt IndexedDB: so **SÂU trên object thật** (đếm khoá đệ quy, không qua JSON) + gọi **`sheetsKey()` thật** của `sheets-persist`, đòi khoá không rơi vào kho mơ hồ | bẻ `sheetsKey` đánh rơi `projectId` ⇒ **64/65 ĐỎ** ✅ (trước lượt này: không mắt nào của G4 đỏ) |
| S2 | `bịaInferred` → đòi **nhóm 3D neo vào entity ĐÃ KHAI không được mang `derived`/`inferred`** (qua `docToObjScene`) | bẻ `spatialIdentity` gắn `'inferred'` oan ⇒ **64/65 ĐỎ** ✅ |
| S3 | mắt `.idfc recipe`: bỏ `/recipe/.test(readFileSync(...))`, chuyển sang **round-trip ngăn xếp thật**, đòi bậc `enabled:false` giữ đủ tham số | bẻ `exportIdfc` lọc rớt `recipe` ⇒ **64/65 ĐỎ** ✅ (mắt CŨ vẫn xanh trong ca này — chữ "recipe" còn trong chú thích) |
| S4 | `soi-frontier` mọc **tầng cảnh báo chất lượng bằng chứng**: mẫu-khớp-mọi-thứ + bằng-chứng-trong-chú-thích | tự bắt được 1 + 6 entry, **không chặn** (lý do ở ⑤) |
| S5 | mẫu `h4-picker`: `'.'` → `export function PresentDocTypePicker` + đủ 6 đường `onChoose*` | rút ruột tệp còn `x` ⇒ **🔴 1 LỆCH** ✅ (trước: 0 lệch) |
| S6 | phần KẾT của `g4-moat` **đếm riêng** bằng-chứng-sản-phẩm ↔ kiểm-tiền-đề; 3 khẳng định tiền đề đổi nhãn `TIỀN ĐỀ ·` | — |

**Lộ ra lỗ sản phẩm thật nào? KHÔNG.** Cả bốn phép siết đều **đạt ngay** — tức mã sản phẩm
vốn đã đúng, chỉ có **phép đo** là sai. Đây là kết quả tốt và tôi khai thẳng: nếu siết mà lộ
lỗ, tôi đã để cổng đỏ và báo lên chứ không vá.

**Không nới một khẳng định nào.** Cả 6 phép siết đều làm phép đo KHÓ hơn.

---

## ④ CỔNG NÀO ĐỔI MÀU

| Cổng | Trước | Sau | Ghi chú |
|---|---|---|---|
| `g4-moat` | 63/63 · rc=0 | **65/65 · rc=0** | +2 mắt mới (khoá kho), 3 mắt siết lên. **Cùng con số xanh nhưng nay nói đúng hơn**: 62 bằng chứng sản phẩm + 3 tiền đề |
| `soi-frontier` | 77 xong · 0 lệch · rc=0 | **77 xong · 0 lệch · rc=0** + 🟡 6 entry bằng-chứng-yếu | mốc **không đổi** — cố ý |
| `g6-kho-mo-dau` | 60/60 | 60/60 | không đụng |
| `soi-hinh-hoc` / `tu-dien` / `cong-cu-chet` | 32 / 322 / 40 | **32 / 322 / 40** | giữ mốc |
| `soi-thao-tac` | 2 lệch | 2 lệch | nợ cũ |
| `tsc` · `npm test` | — | **0 lỗi · 0 fail (143 tệp test)** | |

🔴 **Không cổng nào phải chuyển sang đỏ.** Nhưng đó **không phải tin hoàn toàn tốt**: nghĩa là
bốn ca hỏng ở trên **hỏng ở phép đo, không hỏng ở sản phẩm** — chúng che một khoảng trống
(*"cổng này không đo thứ nó nói"*), chứ không che một bug.

---

## ⑤ MỤC E — máy canh: **CÓ, và đã dựng**

`scripts/soi-mat-tu-cham.mjs` · `npm run soi:mat-tu-cham`. Hai tín hiệu tất định:

1. **Không chạm mã sản phẩm** — truy ngược định danh trong biểu thức điều kiện qua bản đồ gán
   (`const`/`let`/`push`/`for…of`/`.map`), xem có chạm hàm nhập từ `lib|app|components`,
   hoặc lời gọi trình duyệt (`page.evaluate` · `goto` · `request`) không.
2. ⭐ **VÒNG TRÒN GIÁ TRỊ** — khẳng định đọc trường `T` rồi so với literal `V`, mà chính bộ đo
   có dòng nạp `T: V` vào dữ liệu mẫu; và `hasOwnProperty(x,'T')` trên object tự dựng.

**Hiệu chuẩn — bắt buộc, và đây là phần đắt nhất:** tôi chấm máy trên **bản `g4-moat` TRƯỚC
04/09**, tức ca đã biết kết luận.
- Vòng 1: máy chấm mắt `.idfc` cũ là **🟢** (vì nó chạm `importIdfc`) ⇒ **HIỆU CHUẨN TRƯỢT.**
  Đó chính là lý do tín hiệu ⭕ ra đời.
- Vòng 2: máy chấm **`🟢⭕ · hasOwnProperty — hỏi hình dạng, không hỏi hành vi`** ⇒ **ĐẠT.**

**Máy này báo quá tay 3 lần trong lúc tôi viết nó**, cả ba tôi bắt và sửa: ① chấm 🔴 gần như
toàn bộ hai bộ lái trình duyệt (không nhận `page.evaluate` là mã sản phẩm) ② không nhận
`const NS = require('lib/…')` dạng namespace ⇒ `g6` đỏ oan hàng loạt ③ RHS đa dòng
(`const taiSan = [` nội dung ở dòng sau) truy về rỗng.

⇒ Đúng khuôn bệnh sổ đã ghi ba lần trong ngày (*máy soi báo quá tay*). Máy này in thẳng
**tỉ lệ báo nhầm đã đo** trong phần chú thích cuối, để không ai dùng con số của nó làm số nộp.

---

## ⑥ VIỆC BÀN GIAO, KHÔNG LÀM TRONG LƯỢT NÀY

1. **`soi-hinh-hoc` + `soi-thao-tac` mở vùng quét sang `app/`** — mốc sẽ nhảy 32→≥51 và
   193→≥252. **Cố ý không làm**: đổi mốc là việc cần lượt riêng có phiếu, không lén trong
   lượt đo.
2. **6 entry frontier bằng-chứng-yếu** — siết từng mẫu; `scaffolder` là ca đáng làm trước
   (đổi mẫu sang `suggestScaffold\\(` là xong).
3. **Ba mắt "so gương"** ở `g4-moat` (`boqSauMo === boq2` · `computeBoq(docIdb) === boq2`):
   tôi đã thêm `&& boq2.totalAmount > 0` cho một mắt; hai mắt còn lại cần **neo vào một con
   số cố định** thay vì so hai kết quả của cùng một hàm.
4. **Dạy `soi-mat-tu-cham` khuôn `ghi()`** để phủ g1/g2.

---

## ⑦b CHƯA CHẮC / CHƯA KIỂM — bắt buộc

- 🔴 **Tôi KHÔNG quét hết mọi khẳng định.** Máy phủ **177/`~198`**; g1 (8 ca) và g2 (13 hành
  trình) **soi bằng tay, đọc mẫu chứ không đọc hết** — tôi đọc khung chung + 5-6 chỗ `dat:`
  của g2, không đọc trọn 13 hành trình. ⇒ **Mọi con số trong báo cáo này là SÀN.**
- 🔴 **Máy soi mới là HEURISTIC, đã đo tỉ lệ báo nhầm cao**: 6/10 ca 🔴 ở phát đầu là báo
  nhầm. Nó **khoanh vùng**, không phán.
- 🔴 **Chiều ngược lại chưa đo được**: máy có **false-negative** — ít nhất một ca tôi bắt bằng
  tay mà máy chấm 🟢: `coKhai === doc.entities.length` (`elementType` cũng là literal của bộ
  đo, `doc` chỉ chạm sản phẩm qua `resolveLibraryItem` ở nhánh khác). **Không biết còn bao
  nhiêu ca như vậy.**
- 🟡 **Đột biến chỉ chạy 7 lần**, chọn tay theo nghi ngờ — **không phải mutation testing đầy
  đủ**. Một mắt "không đỏ" trong 7 lần đó **không chứng minh** nó vô dụng.
- 🟡 **Không chạy `g4-moat-danh-tinh` và `g6-dot-2`** (cần dev server + Chromium; phiếu cho
  cổng 3103 nhưng tôi ưu tiên ngân sách cho phần đo). Hạng 🟢 của hai bộ đó đến từ **đọc mã**
  (`p.evaluate`, `p.on('pageerror')`, `page.request`), không từ chạy thật trong lượt này.
- 🟡 **Hiệu chuẩn nội bộ của `g4-moat` bẻ dây TRONG BỘ ĐO**, không bẻ mã sản phẩm — nó chứng
  minh *phép đo nhạy*, không chứng minh *phép đo nối đúng vào sản phẩm*. Phép thử mạnh hơn là
  đột biến mã sản phẩm, và đó là thứ tôi dùng trong ③.
- 🟡 **Phân loại 🟡/🟢 cho 6 máy soi tĩnh là PHÁN ĐOÁN của tôi**, không có phép đo tất định —
  chúng không có khẳng định kiểu `doi()` nên máy không chấm được.

## ⑦c HẠN DÙNG KẾT LUẬN

- **Bảng ① hết hạn khi có bộ nghiệm thu mới** hoặc khi ai đổi khuôn `doi()`/`ok()` — chạy lại
  `npm run soi:mat-tu-cham`, đừng trích số từ báo cáo này.
- **Ba mốc 32/322/40 hết hạn ngay khi ai mở vùng quét sang `app/`** (việc bàn giao #1).
- **Ba thí nghiệm "xoá tệp / rút ruột tệp" hết hạn khi mẫu bằng chứng đổi** — cả hai đã được
  siết trong lượt này (S1, S5), nên chúng nay là **bằng chứng lịch sử**, không tái hiện được
  nữa. Đó là mục đích.
- **Câu "không lộ lỗ sản phẩm nào" chỉ đúng cho 4 phép siết đã làm.** Ba mắt "so gương" chưa
  siết — siết chúng có thể lộ lỗ thật.
