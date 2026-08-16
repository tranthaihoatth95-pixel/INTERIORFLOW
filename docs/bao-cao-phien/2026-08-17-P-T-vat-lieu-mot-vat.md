# P-T · VẬT LIỆU — CẮM ĐIỆN CHO SỢI DÂY ĐÃ CÓ

> Phiên phụ P-T · 17/08 · cây chính, mốc `e57e2f6` · vùng `lib/materials/` + `components/materials/` + mock.

---

## 1 · Tổng quan

`getMaterial()` viết 07/08 nối đủ ba mảnh vật liệu nhưng **10 ngày không nơi nào gọi ngoài test của chính nó**. Phiên này cắm điện: kho vật liệu (`/materials`) nay đọc hợp ba mặt cho từng dòng và **nói ra trên màn** mặt nào đủ, mặt nào thiếu, thiếu gì, làm sao có. Đích ⑥b đạt trọn — `tsc` 0 lỗi · `npm test` EXIT 0 (258 khối, 8252 phép kiểm, 0 fail) · `soi:hinh-hoc` giữ nguyên mốc 10 · `soi:tu-dien` 0 lệch từ file của P-T · `getMaterial` có **2 nơi gọi thật** trong `MaterialsScreen.tsx`, và màn đó mount trên route thật `app/materials/page.tsx:26`.

---

## 2 · Chi tiết từng mục

### ⓪b Tiền đề hạ tầng — PASS

```
$ git log --oneline -1
e57e2f6 docs(memory): lệnh mở phiên bản 17/08 — 6 luật đắt nhất + hàng đợi đã chốt
$ git rev-list --count HEAD..main
0
```
Đúng mốc phiếu ghi (`e57e2f6`), lệch main = 0. Không tái diễn ca 167-commit hôm 16/08.

### ⓪ Tiền đề nghiệp vụ — **XÁC NHẬN**, đo tại nguồn

| Vế của tiền đề | Đo được | Kết |
|---|---|---|
| hàm tồn tại ở `resolve.ts:52` | `export function getMaterial(matId, sources)` — đúng dòng 52 | ✅ |
| trả đủ ba mặt | `MaterialFacets { matId, pbr, commercial, flat }` (`resolve.ts:33-41`) | ✅ |
| có test | `resolve.test.ts`, chạy lại: **9 pass, 0 fail** | ✅ |
| **0 nơi gọi ngoài test** | `grep -rn getMaterial lib components app` → nơi gọi duy nhất là `resolve.test.ts` (5 lần); còn lại là 1 dòng định nghĩa + 2 dòng **chú thích** (`ba-mat.ts:4`, `lib/cad/materials.ts:60`) + `docs/` | ✅ |

⚠️ Phiếu dặn *"sổ đang ghi sai, đo tại nguồn"*. Đo xong thì **sổ đã được T sửa rồi**: `IF-KIEN-TRUC.md:118-128` bản hiện tại ghi đúng (*"DÂY CÓ, CHƯA CẮM ĐIỆN… 0 nơi gọi ngoài chính test của nó, đo 17/08"*) kèm hẳn khối đính chính. Nên **không có gì để bác** — bản đồ và phép đo của tôi khớp nhau. Câu *"= 0 code"* chỉ còn nằm trong khối đính chính, đúng chỗ của nó.

### ④ Việc — 5 mục, làm đủ

| # | Việc | Làm gì | Bằng chứng |
|---|---|---|---|
| 1 | **Cắm điện** | `MaterialsScreen` nạp thêm ① `loadPbrMap()` + ③ `MATERIALS`, ghép với ② `specs` đã fetch sẵn, gọi `getMaterial` cho từng dòng | `MaterialsScreen.tsx:21` (import) · `:90` (gọi thật) |
| 2 | **Chỉ báo ba mặt** | 3 ô `2D · 3D · Giá`, mỗi ô **chữ + dấu + màu** — ba kênh chồng nhau | `ChiBaoBaMat.tsx` |
| 3 | **Chỗ sờ được** | Panel *"Một vật, ba mặt"*: cùng `matId` này ở 2D ra ký hiệu gì · 3D ra PBR gì · Trình bày ra giá nào, mỗi mặt ghi rõ *đứng ở chặng nào* | `BaMatPanel.tsx` |
| 4 | **Bản vẽ** | 2 theme · token thật · 0 hex ngoài khối token · 4 ca + hàng bỏ-hết-màu | `docs/mocks/mock-vat-lieu-ba-mat.html` |
| 5 | **Test** | 37 phép kiểm, trọng tâm là *mảnh thiếu ⇒ nói thiếu, không rơi về giá trị bịa* | `lib/materials/ba-mat.test.ts` |

**Ba trạng thái chứ không hai.** Hai thì phải nói dối một ca có thật: bản ghi thương mại **tồn tại** nhưng bỏ trống giá — gắn ✓ là bịa, gắn ✗ là sai. Nên có `du` / `chuaDu` / `chuaCo`. Bốn dấu phân biệt: `✓` đủ · `≈` đủ nhưng **máy suy đoán** (`MaterialPbr.suyDoan`) · `!` có mà chưa đủ · `–` chưa có.

Hai ca `chuaDu` tìm được từ chính domain, không phải bịa ra cho đủ trạng thái:
- bản ghi thương mại có mà **giá trống** → BOQ chỉ nhận số đo được, nên đây là thiếu thật;
- PBR **có ảnh vân mà không khai `uvScaleMm`** → theo docstring `schema.ts`, viên gạch 600 mm render thành 3 m. Hỏng thấy được, không phải thiếu vặt.

### Tệp đụng vào

| Tệp | |
|---|---|
| `lib/materials/ba-mat.ts` | **tạo** — lõi thuần, biến `MaterialFacets` thành ba dòng đọc được |
| `lib/materials/ba-mat.test.ts` | **tạo** — 37 phép kiểm |
| `components/materials/ChiBaoBaMat.tsx` | **tạo** — chỉ báo trong bảng |
| `components/materials/BaMatPanel.tsx` | **tạo** — panel một-vật-ba-mặt |
| `components/materials/MaterialsScreen.tsx` | sửa — nơi cắm điện |
| `components/materials/MaterialTable.tsx` | sửa — thêm cột *Ba mặt* ngay sau Tên; `fmtVnd` cục bộ bỏ đi, dùng chung `dinhDangVnd` (**giảm** một nguồn định dạng trùng) |
| `docs/mocks/mock-vat-lieu-ba-mat.html` | **tạo** — có `<!-- @dsCard group="Vật liệu" -->` |

⛔ **Không đụng**: `prisma/schema.prisma` · `lib/materials/schema.ts` · `scripts/` · `components/home/` · `--accent*`. Kiểm bằng `git diff --stat` trên đúng các đường đó → **rỗng**.

### ⑤ Ràng buộc gắt nhất — giá TRỎ TỚI, không CHÉP

```
$ grep -c "savePbr" lib/materials/ba-mat.ts components/materials/{ChiBaoBaMat,BaMatPanel,MaterialsScreen}.tsx
lib/materials/ba-mat.ts:0
components/materials/ChiBaoBaMat.tsx:0
components/materials/BaMatPanel.tsx:0
components/materials/MaterialsScreen.tsx:0
```
`priceVnd`/`vendor` xuất hiện đúng **2 dòng** trong toàn bộ mã mới (`ba-mat.ts:166,168`), cả hai là **đọc để dựng chuỗi hiển thị tại lúc render**. `MaterialPbr` không mọc thêm trường nào — `lib/materials/schema.ts` 0 thay đổi. Không đường ghi nào chạm bên thị giác. Luật 2.1.9.i nguyên vẹn.

Kèm hai chỗ giữ đúng ranh giới bằng CHỮ, không chỉ bằng ý định: nhãn mặt ③ là *"Giá **kho chung** & đơn vị"*, và chân panel nói thẳng giá không được chép sang chất liệu render, giá chốt từng dự án là chuyện của dự án.

### ⑥ Nghiệm thu — nguyên văn

```
$ npx tsc --noEmit
(không dòng nào — exit 0)

$ node_modules/.bin/sucrase-node lib/materials/resolve.test.ts
9 pass, 0 fail

$ node_modules/.bin/sucrase-node lib/materials/ba-mat.test.ts
37 pass, 0 fail

$ npm test
EXIT=0
$ grep -oE "[0-9]+ fail" test.log | sort | uniq -c
 258 0 fail
$ grep -oE "[0-9]+ (pass|ok)" test.log | awk '{s+=$1} END {print s}'
8252

$ npm run soi:hinh-hoc
Đã quét 297 file · 996 khai báo radius · 10 ngoài thang (6 giá trị lẻ)
   (mốc gốc đầu phiên: 295 file · 10 ngoài thang → +2 file, +0 lệch)

$ npm run soi:tu-dien
🟡 260 chỗ dùng chữ trần — KHÔNG chặn
   (mốc gốc đầu phiên: 259)
```

**+1 của `soi:tu-dien` KHÔNG phải của P-T** — chứng minh bằng thí nghiệm chứ không bằng lập luận: bỏ mock của tôi ra khỏi `docs/mocks/` rồi chạy lại vẫn **260**; và không đường dẫn nào của tôi xuất hiện trong danh sách máy soi in ra. Nguồn thật là `docs/phieu-giao/P-S2-vá-và-nới-soi-that.md`, tạo lúc 05:39 — sau khi tôi lấy mốc gốc, thuộc phiên P-S chạy song song.

### Đích ⑥b — `getMaterial` có nơi gọi thật ngoài test

```
$ grep -rn "getMaterial" lib components app --include='*.ts' --include='*.tsx' | grep -v "\.test\.ts"
lib/materials/ba-mat.ts:4:       * `resolve.ts` `getMaterial()` (07/08) đã trả đủ ba mảnh — …   ← chú thích
lib/materials/resolve.ts:52:     export function getMaterial(matId, sources): MaterialFacets   ← định nghĩa
lib/cad/materials.ts:60:         ⇒ `lib/materials/resolve.ts` `getMaterial(matId)` …            ← chú thích
components/materials/MaterialsScreen.tsx:8:   ⚡ [marker: vatLieuBaMat] ĐÂY LÀ NƠI CẮM ĐIỆN …    ← chú thích
components/materials/MaterialsScreen.tsx:12:  … `getMaterial` ⇒ mỗi dòng kho nói được …          ← chú thích
components/materials/MaterialsScreen.tsx:21:  import { getMaterial } from '@/lib/materials/resolve';   ← ⭐ IMPORT THẬT
components/materials/MaterialsScreen.tsx:82:  ⚡ NƠI GỌI THẬT của `getMaterial()` …               ← chú thích
components/materials/MaterialsScreen.tsx:90:  ? baMatCuaVatLieu(getMaterial(m.sku, { pbrMap, specs: items ?? [], defs: MATERIALS }))  ← ⭐ GỌI THẬT
```

Và nó **tới được người dùng**, không dừng ở tầng mã:
```
$ grep -rn "MaterialsScreen" app --include='*.tsx'
app/materials/page.tsx:13:import { MaterialsScreen } from '@/components/materials/MaterialsScreen';
app/materials/page.tsx:26:        <MaterialsScreen />
```

### Tự chấm 2 skill design — 5 lỗi bắt được, sửa cả 5

| # | Lỗi | Mức | Sửa |
|---|---|---|---|
| 1 | chữ 11px màu `--warning` trên `--field`, theme **SÁNG** = **4,48:1** — hụt ngưỡng 4,5 | 🔴 chặn | đổi **NỀN** ô sang `--card` → **5,05:1**. Không đụng màu nghĩa |
| 2 | `--t4` làm chữ = **3,88:1** (Tối) / **2,65:1** (Sáng) | 🔴 chặn | mọi chữ mới của P-T chuyển sang `--t3` (6,12 / 4,61) |
| 3 | nút chỉ báo cao 24px cứng — hụt vòng chạm khi cầm tablet | 🟡 | `height: var(--tap)` (32 chuột / 44 cảm ứng), vẫn lọt hàng bảng 46 |
| 4 | `role="dialog"` gắn ở **nền mờ**; không có tiêu điểm ban đầu, không trả tiêu điểm khi đóng | 🟡 | chuyển `role` vào **tấm**; `tabIndex=-1` + nhảy tiêu điểm vào, đóng thì trả về chỗ cũ |
| 5 | tấm `width: 460` cứng — cửa sổ hẹp là tràn mép, nút ✕ đi mất | 🟡 | thêm `maxWidth: calc(100vw - 32px)` |

Thêm một điểm từ critique, không phải lỗi mà là **thừa**: viền vẽ ở **mọi** trạng thái là viền không mang tin — 10 hàng × 3 ô là 30 khung kêu như nhau. Nay mặt **đủ** dùng viền trong suốt (giữ nguyên kích thước, im lặng); viền chỉ mọc khi có chuyện. Đúng nguyên tắc *mọi chi tiết thị giác đều phải mang tin*.

Kèm: `focus-visible` ring cho cả 3 nút mới — không để lại nợ mới cho `soi:thao-tac`.

---

## 3 · Tổng kết lại vấn đề

Trước phiên này, ba mảnh vật liệu đã có **sợi dây** nối (`getMaterial`) và sợi dây đó **đúng** — nhưng nó chấm dứt ở tầng dữ liệu. Người dùng mở kho vật liệu thấy một bảng thương mại thuần: tên, hãng, giá. Không cách nào biết mã này đã dùng được ở chặng 3D chưa, đã có ký hiệu 2D chưa.

Việc thật của phiên không phải "nối ba mảnh" — mảnh đã nối rồi. Việc thật là **dịch kết quả nối đó ra chữ người đọc hiểu**, rồi đặt nó vào đúng chỗ mắt người dùng đi qua. Đó là lý do phần lõi mới (`ba-mat.ts`) không tính toán gì về vật liệu cả: nó chỉ trả lời ba câu *đủ chưa · thiếu gì · làm sao có*.

Và đây đúng là ca mẫu cho bài học 16/08 mà phiếu trích: `resolve.ts` có `tsc` xanh, test xanh, docstring đẹp, suốt 10 ngày — **và giá trị bằng 0** cho tới hôm nay. Cửa nghiệm thu của loại việc này không phải test xanh, mà là *thứ đó có hiện ra trên màn không*.

---

## 4 · Đánh giá khách quan

**Được:**
- Đích ⑥b đạt trọn, không phải vòng nào cũng sửa lại — chạy 1 vòng, 5 lỗi design tự bắt tự sửa trong vòng đó.
- Lõi **thuần** (0 React, 0 DOM, 0 localStorage) nên test được thẳng; 37 phép kiểm phần lớn khẳng định **cái không được xảy ra** (không bịa `0 ₫`, không rơi về `DEFAULT_PBR`, không mặt nào thiếu mà im lặng).
- Ràng buộc đắt nhất giữ được **và kiểm được bằng lệnh**, không phải bằng lời hứa.
- Ròng lại **giảm** một nguồn trùng (`fmtVnd`), không thêm.

**Chưa được / rủi ro:**
- 🔴 **Chưa chạy app thật một dòng nào** (phiếu cấm dev server). Mọi kết luận về hiển thị là **đọc mã**, không phải nhìn. Xem ⑦b.
- 🟡 Ba trạng thái làm chỉ báo giàu tin hơn nhưng **khó hơn để liếc**. Chưa ai thử với người dùng thật xem `!` và `–` có phân biệt được trong một nhịp mắt không.
- 🟡 Mặt ③ **hầu như luôn `du`** trên dữ liệu thật, vì nguồn của nó chính là bảng đang hiển thị. Giá trị thật của chỉ báo nằm ở mặt ① và ②.
- 🟡 Mặt ① gần như **luôn `chuaCo`**: `MATERIALS` chỉ có **4** dòng nhắc `matId` và `resolve.test.ts:61` đã khẳng định sẵn *"flat null trên catalog mặc định hiện tại"*. Tức cột mới sẽ hiện một dải `2D –` gần như toàn bộ. **Đúng sự thật** — nhưng lần đầu Hoà mở màn này sẽ thấy nhiều dấu `–`, và cần biết trước rằng đó là *kho thật đang thiếu*, không phải chỉ báo hỏng.
- 🟡 Kho PBR sống ở `localStorage` ⇒ chỉ báo mặt ② là **của riêng máy đang mở**. Máy khác nhìn cùng vật liệu sẽ thấy `3D –`. Vướng luật lưu chung ↔ máy (`IF-KIEN-TRUC.md` §9): **vật** phải lưu chung, mà PBR là vật. Nợ có sẵn từ 07/08, phiên này không tạo ra nhưng nay nó **nhìn thấy được**.

---

## 5 · Hướng xử lý nhiều góc độ

**Chuyện trước mắt — làm sao biết cột mới thật sự đọc được:**

- **Hướng A · chụp màn app thật rồi đổ vào `Drive/IF-duyet-mat/01-anh/`.** Rẻ, đúng cơ chế Hoà chốt 16/08, bắt được đúng loại lỗi mã không lộ (ô chật, ba ô xuống dòng, cột đẩy bảng tràn ngang). Nhược: cần chạy dev server — phiếu này cấm, nên phải là lượt riêng.
- **Hướng B · đẩy bản vẽ lên Claude Design để Hoà duyệt mắt trước.** Không cần server, đúng đường đã nối 14/08. Nhược: bản vẽ là **dữ liệu dựng sẵn** — nó không bày ra cảnh 40 dòng thật với `2D –` chạy dài, mà đó mới là ấn tượng đầu tiên thật.

**Chuyện gốc — mặt ① rỗng gần hết:**

- **Hướng C · gán `matId` cho các preset trong `MATERIALS`.** Mặt ① sống dậy ngay, chỉ báo mới có ba mặt thật để so. Nhược: động vào catalog 2D, đúng ra là quyết định nghiệp vụ (mã nào ứng preset nào) — không phải việc một phiên phụ tự quyết.
- **Hướng D · để nguyên, coi dải `–` là kết quả đo.** Cột mới lúc này làm đúng việc của một máy soi: nó vừa **đo được** một lỗ hổng mà trước nay không ai thấy. Nhược: màn hình trông nghèo ở lần mở đầu.

---

## 6 · Đề xuất hướng tốt nhất

**Đi B trước, rồi A ngay lượt sau; mặt ① chọn D và khai thẳng con số.**

Vì sao **B trước A**: băng thông duyệt-mắt của Hoà là tài nguyên khan nhất của cả dự án (đã ghi thành cảnh báo đỏ 13/08). Bản vẽ đã sẵn sàng, đủ 2 theme, đủ 4 ca — hỏi được câu đắt nhất (*ba trạng thái có đọc được trong một nhịp mắt không*) mà **không tốn lượt chạy server nào**. Nếu Hoà bác cách thể hiện thì mọi ảnh chụp app đều thành rác — chụp trước là làm ngược thứ tự.

Nhưng B **không thay được** A, nên A phải đi ngay sau chứ không phải "khi nào rảnh": bản vẽ có đúng 4 hàng do tôi tự dựng, còn app thật có dữ liệu thật với độ dài tên thật và số dòng thật. Đúng chỗ đó là nơi mã không lộ ra được cái gì hỏng — và cũng đúng chỗ mà bài học *"có trong mã không bằng tới được người dùng"* sẽ tính sổ lần nữa nếu bỏ qua.

Vì sao mặt ① chọn **D chứ không C**: gán `matId` cho preset là quyết định **nghiệp vụ** — mã nào ứng hoạ tiết nào là chuyện của người biết vật liệu, không phải của phiên đi cắm dây. Và dải `–` chạy dài không phải là lỗi cần che: nó là **phép đo đầu tiên** cho biết cầu nối 2D↔kho hiện rỗng tới mức nào. Che nó đi bằng vài dòng gán vội là đúng thứ luật khai-thật cấm. Điều cần làm là **nói trước con số** để không ai tưởng chỉ báo hỏng — đã ghi ở mục 4.

---

## ⑦b CHƯA CHẮC / CHƯA KIỂM

- 🔴 **Chưa chạy app thật một dòng nào.** Phiếu cấm dev server ⇒ mọi kết luận về hiển thị, về bố cục cột, về cảm giác đọc đều là **đọc mã + dựng bản vẽ**, **không phải nhìn**. Cụ thể chưa ai xác nhận: ba ô có lọt trong bề rộng cột không (chưa đo trên dữ liệu thật) · bảng thêm cột thứ 11 có đẩy tràn ngang ở 1440×900 không (có `overflow:auto` nên chỉ hiện thanh cuộn, chứ không phải không tràn) · ô giải nghĩa của `Tooltip` có bị hàng cuối bảng cắt mất không.
- **Số tương phản là TÍNH, không ĐO trên màn.** Công thức WCAG trên hex lấy thẳng từ `app/globals.css`. Ba giả định chưa kiểm: nền thật sau ô đúng là `--card` (không có lớp bán trong suốt chen giữa) · trình duyệt không chỉnh gì thêm · chưa thử ở màn hình có hiệu chỉnh màu.
- **Chưa thử trình đọc màn hình thật** (VoiceOver/NVDA). `aria-label` đọc ra sao, câu ghép ba mặt có dài quá không — chưa ai nghe.
- **Chưa thử nhánh `prefers-reduced-motion`** — phần mới không có chuyển động riêng nào, nhưng `Tooltip` mượn lại thì chưa kích hoạt lần nào trong phiên này.
- **Chỉ Chromium**, và cũng chỉ là suy từ mã — Safari/Firefox chưa mở.
- **Mặt nào chưa có dữ liệu thật trong kho để thử**: ① `MATERIALS` chỉ **4** dòng nhắc `matId`, và test cũ đã khẳng định `flat === null` trên catalog mặc định ⇒ mặt 2D gần như chưa từng chạy nhánh `du` trên dữ liệu thật. ② kho PBR ở `localStorage` — **rỗng** trên máy sạch, nên mặt 3D cũng chưa chạy nhánh `du` thật. Cả hai nhánh `du` mới chỉ được chứng minh **trong test bằng dữ liệu tự dựng**.
- **Ca `≈` (suy đoán) chưa gặp ngoài đời**: `suyDoan` do `inferPbrFromCategory` đặt; phiên này chưa chạy đường đó lần nào.
- **Không kiểm** liệu có màn nào khác cũng nên có chỉ báo này (Thư viện, chặng 3D) — ngoài vùng phiếu.

## ⑦c HẠN DÙNG KẾT LUẬN

Kết luận của báo cáo này **hết đúng khi** một trong các điều sau xảy ra:

1. **`matId` thôi bằng `ProductSpec.sku`.** Toàn bộ phép tra dựa vào đúng đẳng thức đó (`getMaterial` khớp `specs.sku`; `MaterialsScreen` truyền thẳng `m.sku`). Đổi khoá nối là mọi con số *đủ N/3* trong báo cáo này thành vô nghĩa, và `baMatChuaCoMa()` (nhánh "chưa có mã") phải định nghĩa lại.
2. **PBR rời `localStorage` sang DB.** Lúc đó mặt ② thôi là *của riêng máy này*, mọi nhận định ở mục 4 về "máy khác thấy `3D –`" hết hiệu lực — và `napPbr()` gọi tay sau khi đóng cửa sổ phải đổi thành cơ chế đồng bộ thật.
3. **`MaterialPbr` mọc thêm trường giá/NCC.** Cả kiến trúc ba mặt lẫn ranh giới ⑤ dựng trên giả định hai bên vẫn tách. Nếu luật 2.1.9.i bị lật thì `ba-mat.ts` phải viết lại từ gốc, không phải vá.
4. **Bảng kho đổi cách nạp** (phân trang / nạp dần thay vì lấy trọn `/api/specs`). `getMaterial` nhận `specs: items` — tức **danh sách đang hiển thị**. Nạp từng phần thì một mã có thật trong DB nhưng chưa nạp sẽ bị báo `Giá –` **sai sự thật**. Đây là chỗ mong manh nhất của cách cắm điện hiện tại; ghi ra để phiên sau không phải tự phát hiện.
5. **Ba trạng thái bị Hoà bác** khi duyệt mắt (muốn về đủ/thiếu hai trạng thái). Khi đó bảng dấu 4 hình và toàn bộ nhánh `chuaDu` trong `ba-mat.ts` phải gỡ.

## ⑧ Dây máy

Entry registry `vat-lieu-mot-vat` — **T tự mở sau khi audit**. Agent không đụng `frontier-registry.mjs`; đã giữ đúng.
