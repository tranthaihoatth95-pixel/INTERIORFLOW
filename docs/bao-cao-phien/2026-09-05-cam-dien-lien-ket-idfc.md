# 05/09 · 05·ASSET — CẮM ĐIỆN LIÊN KẾT `.idfc` → BẢN GHI THƯƠNG MẠI

## 1 · Tổng quan

`resolveIdfcCommerceToSpec` dựng 04/09 có thứ tự ưu tiên đúng, có cờ `ben`, có 8 ca test —
và **0 nơi gọi trong mã sản phẩm**. Lượt này cắm nó vào **cột thông số ④ của tấm Thư viện**,
chứng minh đầu-cuối trên app thật (nhập tệp qua đúng cửa nhập → đổi `sku` trong kho → đóng hẳn
trình duyệt → vào lại → khoá bất biến còn đúng, khoá mỏng đứt), và thêm một máy canh hỏi đúng
câu mà cổng moat chưa hỏi. **16/16 khẳng định trên trình duyệt · tsc 0 · test 0 fail · moat rc=0.**

---

## 2 · Chi tiết

### ⓪ Tiền đề — xác nhận, không có chỗ nào phải bác

| Điều phiếu khai | Đo lại | Kết |
|---|---|---|
| `resolveIdfcCommerceToSpec` 0 nơi gọi | `grep` `app/`+`components/`+`lib/`: 1 chỗ khai · 8 dòng test · 1 dòng **chú thích** (`lib/cad/idfc.ts:219`) · **0 nơi gọi** | ✅ đúng |
| thứ tự specId → matId → sku, cờ `ben` | `catalog-link.ts:59-88` | ✅ đúng |
| `hat-giong-3d.ts` cố ý không có `commerce` | `:135` docstring + `cauKienKeSach()` không trả `commerce` | ✅ đúng |

⓪b **MỐC**: HEAD `f43de304`, lệch `origin/integration/2026-09-04` **240**, cây sạch,
`merge-base --is-ancestor` rc=0 ⇒ `git merge --ff-only` → **`1ebce8ac`**, lệch về **0**.
Đây là lô thứ mười bốn cắt lệch — làm ⓪b trước tiên là đúng.

### A · Chọn mặt tiền

**CHỌN: cột thông số ④ của `LibrarySheet`** (`components/library/LibrarySheet.tsx` +
`lib/library/spec-panel.ts`).

Ba lý do, theo thứ tự trọng lượng:

1. **Đây là nơi câu hỏi thật sự được hỏi.** Cột thông số là chỗ duy nhất trong app người dùng
   mở một cấu kiện `.idfc` ra xem *Hãng · Mã · Đơn vị · Giá* trước khi kéo nó vào bản vẽ.
2. **Nó đang trả lời SAI câu đó, và sai theo đúng cách hàm này sinh ra để chữa.** Nhánh
   `displayIdfc?.commerce` (`:462-466` bản cũ) lấy thẳng `brand/unit/priceVnd` **nhúng trong
   tệp** rồi dừng — 0 lần tra về kho. Đường còn lại là `matchSpec(code, specs)`, khớp
   `SheetItem.code` ↔ `ProductSpec.sku` — **khoá mỏng, đúng thứ `ben=false` cảnh báo**.
3. **Dữ liệu đã sẵn ở cả hai đầu.** `specs` đã fetch `/api/specs` (`:369`), `idfcItems` đã
   hydrate từ IndexedDB (`:296`). Đây là **cắm điện**, không phải kéo dây mới.

**Loại «đặt cấu kiện vào bản vẽ rồi hỏi giá»** — hai lý do độc lập, mỗi lý do đủ để loại:
- `lib/boq/**` nằm trong **CẤM GHI** (lane khác giữ) — ô ④ của phiếu.
- Đường `.idfc` thả xuống hiện làm phẳng thành **nét rời**, và `LibraryDropBridge.tsx:114-115`
  tự khai: *"specId KHÔNG gắn được lên nét rời — schema chỉ cho Block/Hatch entity mang specId"*.
  Nối được ở đó cũng không hiện ra cho người dùng mà không sửa `model.ts` — **cấm ③**.

**Loại «bảng vật liệu»** (`components/materials/MaterialTable.tsx`): nó liệt kê `ProductSpec` —
tức các hàng **đã ở trong kho**. Không có `.idfc` nào để nối về. Sai đối tượng.

### B · Người dùng thấy đúng câu gì

Bốn tình trạng, bốn câu — chép nguyên từ ảnh chụp app thật:

| Ca | Câu chính | Câu phụ |
|---|---|---|
| **`ben=true`** | `Nối chắc với kho — đổi mã hàng vẫn đúng` | `Hãng, đơn vị và giá đang đọc sống từ "Ghế ăn gỗ sồi" trong kho.` |
| **`ben=false`** | `Nối tạm bằng mã hàng — đổi mã là đứt` | `Đang đọc từ "Ghế ăn gỗ sồi". Nhà cung cấp đổi mã hàng này là mất nối.` |
| **kho không có** | `Kho chưa có món này` | `Số dưới đây chép trong tệp lúc nhập, không phải giá sống của kho.` |
| **chưa có thông tin** | `Mẫu này chưa khai thông tin mua hàng` | `Chưa có gì để nối về kho — hãng, đơn vị và giá còn trống.` |

Ràng buộc đã giữ:
- **Không lộ chữ máy** — máy đo khẳng định `!/\b(specId|matId|sku)\b/` trên cả bốn câu, xanh.
- **`chua-khai` ≠ `khong-thay`.** Cấu kiện hạt giống (Kệ sách 900) ra câu *"chưa khai thông tin
  mua hàng"*, KHÔNG ra *"không tìm thấy"* — hai sự thật khác nhau, hai câu khác nhau, có
  khẳng định canh `nhanA !== nhanB`.
- **Màu không phải kênh duy nhất**: nghĩa nằm trọn trong câu chữ; chấm 6px chỉ để quét mắt trên
  cột 236px. Bỏ hết màu vẫn đọc đủ.
- **Không nói hai lần chọi nhau**: `.spwhy` (câu §9 giải thích ô trống) khi có dòng nối-kho thì
  **rút về đúng nửa còn lại** (độ nhám · độ bóng) — nếu giữ nguyên câu cũ thì sẽ có *"Nối chắc
  với kho"* nằm ngay trên *"Chưa món nào khớp mã trong kho"*.

### C · Chuỗi đầu-cuối, số thật, đọc từ nơi lưu

`scripts/nghiem-thu-ban-lam-viec/noi-kho-idfc-song-sot.mjs --url=http://localhost:3106`
→ **16 pass · 0 FAIL · 0 LỖI**.

| Bước | Số thật |
|---|---|
| nhập 2 tệp qua **đúng cửa nhập** (`lib-ingest-input` → *Đưa vào kho*) | không ghi thẳng vào kho |
| ca `ben` lượt 1 | `Hãng=Xưởng Kiểm · Giá mỗi cái=4 200 000` (kho), **không** `3 100 000` chép trong tệp |
| ca `mong` lượt 1 | `kieu=mong`, vẫn đọc giá sống 4 200 000 |
| hạt giống lượt 1 | `kieu=chua-khai` |
| **đổi `sku`** trong kho (trình duyệt ĐANG ĐÓNG) | `NK-GHE-01` → `NK-GHE-01-V2` |
| IndexedDB `studio::/studio-idfc` sau khi vào lại | `["NK-GHE-BEN","NK-GHE-MONG"]` — hai bản ghi còn sống |
| ca `ben` lượt 2 | `kieu=ben` · `Hãng=Xưởng Kiểm` · **`4 200 000`** — vẫn đúng |
| ca `mong` lượt 2 | `kieu=khong-thay` · `Hãng=Hãng ghi trong tệp` · **`3 100 000`** — **đứt** |

Kỷ luật đã giữ: `launchPersistentContext` trên hồ sơ **đĩa** (không `newContext()`) · đọc từ
**IndexedDB thật** không đọc chữ trên màn · **không `reload()`** đi vòng qua lỗi.

⭐ **Phép đo tự mang đối chứng**: hai tệp khác nhau **đúng một điểm** (có/không `commerce.specId`)
và đi qua **cùng một lần đổi mã**. Chúng phải rẽ hai hướng — khẳng định
`ben.kieu !== mong.kieu` là chốt chặn hiệu-chuẩn-thoái-hoá ngay trong bộ đo.

Ảnh: `docs/delivery/anh-duyet-mat/idfc-lien-ket/` (5 khung, đã kiểm `git check-ignore` rc=1 từng tệp).

### D · Máy canh mới — `moat-co-mat-tien-chua.mjs`

Hỏi đúng câu cổng G4 chưa hỏi: *"hàm moat này có mặt tiền không, và mặt tiền đó có đổi kết quả
không?"* — **hai vế**, vế ② chống xanh-giả:

- **① mặt tiền**: đếm nơi gọi trong mã sản phẩm, **bỏ test · bỏ chính tệp khai · bỏ chú thích**
  (nếu không bỏ chú thích thì `lib/cad/idfc.ts:219` sẽ bị đếm là "nơi gọi" — báo quá tay).
- **② hành vi**: chạy đúng hàm mặt tiền gọi (`noiIdfcVeKho`) trên **hai thế giới khác nhau đúng
  một điểm** (kho có / không có món) và đòi **hai kết quả khác nhau ở CẢ trạng thái LẪN con số**.
  Hàm bị gọi mà kết quả không đổi ⇒ ĐỎ.

Vế ② là câu trả lời trực tiếp cho ca `hasOwnProperty` ghi ở `2026-09-04-dong-mat-d2.md`: mắt cũ
xanh trên object do chính bộ đo vừa dựng. Ở đây, thế giới B do **hàm sản phẩm** dựng ra, và nếu
hàm không tham gia quyết định thì A ≡ B.

### ② Hiệu chuẩn — cả ba, có xác minh bẻ đúng dòng

| Bộ đo | Cách bẻ | Xác minh bẻ đúng | Kết quả |
|---|---|---|---|
| Trình duyệt (16 khẳng định) | `resolveIdfcCommerceToSpec<S>(khoa, specs)` → `(khoa, [])` | `grep -c` = **1** · in trước/sau · `diff` chỉ 1 dòng | **10 FAIL**, gồm cả khẳng định HIỆU CHUẨN (`ben=khong-thay · mong=khong-thay`) |
| `moat-co-mat-tien-chua` vế ② | cùng phép bẻ trên | như trên | vế ① vẫn xanh, **vế ② ĐỨT** — `A: khong-thay/111 ↔ B: khong-thay/111`, rc=1 |
| `moat-co-mat-tien-chua` vế ① | thêm `lib/library/idfc-noi-kho.ts` vào `tepKhai` (giả lập trạng thái TRƯỚC lượt này) | `cp` bản gốc + `diff` sau hoàn nguyên | **vế ① ĐỨT** `0 nơi gọi`, vế ② vẫn xanh, rc=1 |

Sau hoàn nguyên: `diff` với bản gốc **RỖNG** ở cả hai tệp; chạy lại → **16/16 pass**, moat check
**1/1 rc=0**.

📌 Ca `chua-khai` **vẫn xanh khi bẻ dây** — và đó là đúng: nó không đi qua kết quả của resolver.
Bộ khẳng định không nhạy đồng đều, và biết chỗ nào nhạy chỗ nào không cũng là một phần của hiệu chuẩn.

### ⑥ Verify — tách lệnh, đọc rc riêng

| Lệnh | rc | Số |
|---|---|---|
| `npx tsc --noEmit` | 0 | — |
| `npm test` | 0 | 0 fail (test mới `idfc-noi-kho.test.ts` **28 pass**) |
| `node scripts/nghiem-thu-g4-moat.mjs` | 0 | **66** ✅ · đỏ chỉ trong 2 khối HIỆU CHUẨN |
| `npm run soi:frontier` | 0 | **0 LỆCH** (👁1 · ✅77 · ⬜56) |
| `npm run soi:cong-cu-chet` | 0 | **40** |
| `npm run soi:hinh-hoc` | 0 | **32** |
| `npm run soi:tu-dien` | 0 | **322** |
| `curl :3106` | **7** | server đã tắt |
| CSDL repo chính | — | `User 1 · Project 4 · Flow 5 · Member 3 · File 2 · Credit 1` — **đúng mốc sạch** |

⚠️ Moat ra **66** ✅ chứ không 65 như mốc phiếu. Không phải do lượt này: `nghiem-thu-g4-moat.mjs`
chỉ `require` 15 module (`lib/cad`, `lib/three`, `lib/boq`, `lib/materials`, `lib/present-editor`,
`lib/idfc-import`, `lib/sheets-persist`) — **không module nào là tệp lượt này sửa**. Chênh 1 đến
từ 240 commit vừa ff-merge.

---

## 3 · Tổng kết

Đây là lần thứ năm cùng một ngày gặp nấc **"dây có, chưa cắm điện"**, và lần này khép được ba
việc cùng lúc: ① cắm hàm vào một mặt tiền người dùng chạm được ② sửa luôn một chỗ đang làm
**ngược luật 2.1.9.i** (cột thông số đọc giá chép trong tệp thay vì trỏ về kho) ③ dựng máy canh
để nấc này không tái diễn lặng lẽ.

Điểm đáng giữ nhất không phải đoạn dây, mà là **cách chứng minh**: hai tệp khác nhau đúng một
điểm, đi qua cùng một biến động của thế giới, và **buộc phải rẽ hai hướng**. Số nào cũng vô nghĩa
nếu bộ đo không phân biệt được hai thế giới.

---

## 4 · Đánh giá khách quan

**Được**
- Đường đi trọn: nhập qua đúng cửa nhập của app → đọc trên app thật → sống sót qua một lần tắt
  trình duyệt → đọc lại từ IndexedDB. Không khâu nào mô phỏng.
- Kho **thắng** tệp khi nối được — đúng luật 2.1.9.i và đúng docstring của chính `IdfcCommerce`.
  Không chép giá vào đâu cả: `MaterialPbr` không mọc trường nào, `schema.prisma` không đụng.
- Đường cũ **không bị bỏ**: kho không có món thì vẫn rơi về số của tệp (chốt G-M16-03), chỉ khác
  là nay nói ra đó là ảnh chụp. Đây là đổi thứ tự, không phải lật chốt.

**Chưa được / phải nói thẳng**
- **Có một thay đổi hành vi nhìn thấy được**: với `.idfc` mang `commerce` mà kho **có** món đó,
  Hãng/Đơn vị/Giá nay hiện **số của kho** thay vì số trong tệp. Đúng luật, nhưng là delta cần mắt.
- Bộ đo chỉ chạy Chromium 1194, một cỡ màn 1600×900, theme mặc định.
- `moat-co-mat-tien-chua.mjs` mới có **1 mục**. Nó là khuôn, chưa phải sổ đủ.
- Vế ① của máy canh vẫn là **grep có bỏ chú thích**, không phải AST — `const f = resolveIdfc…;`
  gọi qua biến trung gian thì nó vẫn đếm là "có gọi" (chấp nhận được: nhầm về phía khoan dung),
  nhưng ghép chuỗi động thì mù.

---

## 5 · Hướng xử lý — hai góc

**Hướng A · nối tiếp cùng mặt tiền**: đưa cờ `ben` xuống **đường thả vào bản vẽ** (`LibraryDropBridge`)
để entity rơi xuống mang đúng `specId` bất biến thay vì đoán qua `matchSpec`.
*Được*: đóng luôn đường BOQ. *Mất*: đụng `lib/boq/**` (lane khác giữ) và cần field trên nét rời —
tức phải sửa `model.ts`, việc lớn hơn hẳn.

**Hướng B · nhân bản máy canh trước**: nạp thêm các hàm moat khác vào `MUC` của
`moat-co-mat-tien-chua.mjs` (`baMatCuaVatLieu` · `inspectMaterialImpact` · `boqFingerprint`…)
để soi ngay xem còn hàm nào đang treo.
*Được*: rẻ, tất định, và trả lời được câu *"còn bao nhiêu dây chưa cắm"* bằng số thay vì bằng
tình cờ. *Mất*: không thêm gì người dùng chạm được lượt này.

---

## 6 · Đề xuất

**Chọn B trước, rồi A.** Lý do: bốn nấc "dây có chưa cắm điện" trong hai ngày đều lộ ra **do tình
cờ có người đi đo lại**, không do máy nào báo. Chạy B trước cho ra **danh sách** thay vì tiếp tục
bắt từng ca — và danh sách đó chính là thứ quyết định A nên cắm vào đâu trước. A vẫn cần làm,
nhưng nó chạm hai vùng lane khác đang giữ nên phải đi qua MAIN xếp lịch, không tự khởi động được.

---

## ⑦b CHƯA CHẮC / CHƯA KIỂM

- **Chỉ đo Chromium 1194**, cỡ 1600×900, theme mặc định. Safari/Firefox và theme sáng là **suy**.
- **Chưa thử trình đọc màn hình.** Dòng nối-kho là `<div>` chữ thường, không có `role`/`aria-live`
  — người dùng bàn phím phải tự Tab tới vùng đó mới nghe được; chưa ai kiểm nó đọc ra thế nào.
- **Tương phản dòng nối-kho là TÍNH chứ không ĐO trên màn**: dùng token có sẵn (`--t2`/`--t4`/
  `--success`/`--warning`) chưa đo lại bằng máy tính tương phản trên nền `--card` thật.
- **Ca `via='matId'` chưa chạy trên trình duyệt** — chỉ có test thuần. `ProductSpec.matId` trong
  CSDL kiểm là `null` (chưa backfill), nên đường matId của app thật **chưa từng chạy sống**.
  Ca `body.type === 'material'` mượn danh tính từ ruột cũng vậy: **0 tệp `.idfc` loại material**
  trong kho hạt giống, nên nhánh `khoaTuRuot` chỉ có test che.
- **Số 4 dòng "—" (nhám/bóng)** trong ảnh là vì `.idfc` kiểm không mang PBR — đúng, nhưng nghĩa là
  ca "có PBR + có nối kho cùng lúc" chưa nhìn thấy.
- **`prefers-reduced-motion` không liên quan lượt này** (không thêm chuyển động nào) — khai để trống.
- **Vệt lệch tiềm ẩn chưa đo**: `LibrarySheet` **không** trộn tầng hạt giống vật liệu
  (`tronHatGiong`) như `MaterialsScreen`/`NganPhanTho` làm. Trên máy sạch `/api/specs` trả rỗng ⇒
  mọi `.idfc` sẽ ra *"Kho chưa có món này"* dù bản cài có sẵn vật liệu hạt giống. **Cố ý không sửa**
  — đó là mặt tiền thứ sáu của cùng bài "một cỗ máy nhiều mặt tiền" đã ghi ở `G4-MOAT-SLICE`
  04/09, và sửa nó là mở phạm vi ngoài phiếu.

## ⑦c HẠN DÙNG KẾT LUẬN

- Kết luận **"kho thắng tệp"** hết hiệu lực nếu có chốt mới lật thứ tự ưu tiên của
  `IdfcCommerce` (docstring `lib/cad/idfc.ts:229-230` là căn cứ hiện tại).
- Số **66/32/322/40** là ảnh chụp tại `1ebce8ac` + thay đổi lượt này; ba lane khác đang mở vùng
  quét ⇒ đọc lại tại nguồn, đừng chép.
- Câu **"`resolveIdfcCommerceToSpec` có 1 nơi gọi"** đúng tại thời điểm này; `moat-co-mat-tien-chua.mjs`
  là thứ giữ nó đúng về sau — nếu máy đó bị gỡ khỏi vòng chạy thì câu này hết bảo chứng.
- Ca `via='matId'` sẽ đổi kết quả ngay khi `scripts/backfill-material-matid.ts` chạy thật trên CSDL.

---

## 7 · Phần MÁY của G4 đóng được chưa?

**Chưa — và thiếu đúng hai thứ, nói thẳng.**

1. **Chưa ai biết còn bao nhiêu dây chưa cắm.** Cổng moat đo *hàm chạy đúng không*, không đo
   *có ai gọi hàm không*. Lượt này thêm được máy hỏi câu đó nhưng mới nạp **1/nhiều** hàm moat.
   Chừng nào `MUC` chưa phủ hết danh sách moat thì con số "xong" của cổng vẫn là **sàn, không
   phải trần** — y hệt cách `soi:thao-tac` 21 tệp là sàn.
2. **Đường `matId` chưa chạy sống lần nào.** `ProductSpec.matId` toàn `null` trong CSDL kiểm;
   backfill là việc còn treo từ 19/08. Một trong ba khoá của chính hàm moat này **chưa có ca
   thật** — gọi là đóng thì đóng trên hai phần ba.

Ngoài ra là nợ mắt, không phải nợ máy: `soi:frontier` đang ghi **77 xong-máy đối 1 qua mắt**.
