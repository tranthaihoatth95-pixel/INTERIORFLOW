# FIX-P0-GIAY — hai lỗi P0 của bản vẽ in ra (05/09)

Làn **P0-GIAY**. Đóng `A2-01` (khung tên tràn, chữ cắt cụt thành giá trị SAI) và `A2-02`
("Vừa khổ" sinh tỉ lệ ngoài dãy chuẩn, cổng máy vẫn tick xanh). Kèm theo đóng luôn `A2-04`
(chữ đè hình) vì cùng một gốc bệnh.

Nghiệm thu theo luật 11/08 (`docs/00-CHOT.md`): **mở file đầu ra soi**, không chỉ chạy test.
16 tệp PDF qua 8 tổ hợp × 2 đường xuất + 1 ca không chèn khung tên, mỗi tệp trích chữ thật bằng
`pypdf` rồi đo toạ độ.

---

## 1 · Tổng quan

| | |
|---|---|
| Tái hiện | **Được cả hai**, bằng số, trên PDF thật |
| Gốc bệnh | **MỘT gốc chung**: cùng một đại lượng ("tỉ lệ in" · "khung tên") được tính/vẽ ở **ba nơi không liên hệ nhau** |
| Sửa | 3 tệp sản xuất (`lib/cad/model.ts` · `lib/cad/pdf.ts` · `lib/print/export-checks.ts`) |
| Khoá | `lib/cad/pdf-p0-giay.test.ts` — **14 ca**, + sửa 1 kỳ vọng cũ đang ghi nhận hành vi hỏng |
| Máy | `tsc` **0 lỗi** · **149/149** test `lib/cad` + `lib/print` + `lib/present-editor` pass |
| Kết quả đo | chữ khung tên vượt mép giấy: **trước 3+ chuỗi/tờ → sau 0/77 chuỗi** · tỉ lệ ngoài dãy chuẩn: **trước 0/10 tổ hợp đạt → sau 10/10 đạt** |

---

## 2 · Lỗi 1 · `A2-01` — khung tên tràn khỏi mép giấy, chữ cắt cụt

### 2.1 · Tái hiện — ĐƯỢC

Đo lại chính tang chứng của A2 (`docs/delivery/anh-a2/dau-ra-A3-ngang.pdf`, trang 2 = 1190,6×841,9pt):

| Chuỗi | x bắt đầu | x kết thúc | mép giấy | kết |
|---|---|---|---|---|
| `SỐ · NO` | 1172,98 | 1188,4 | 1190,6 | sát mép |
| `IF-01` | 1172,98 | 1196,4 | 1190,6 | **vượt 5,8pt** |
| `Tỷ lệ 1:47` | 1172,98 | 1199,5 | 1190,6 | **vượt 8,9pt** |
| `Ngày · Date 2026-09-05` | 1172,98 | 1221,4 | 1190,6 | **vượt 30,8pt** |

Khớp từng con số với A2. Bộ đo được **hiệu chuẩn trên chính tệp của A2 trước khi dùng** cho tệp mới.

Dựng lại bằng mã (`buildDemoPlan` → đúng đường `CadEditor.insert()` → `buildSheetSetPdf`):
chèn 1 lần ra **hai tỉ lệ mâu thuẫn cùng tờ** (`1:100` và `1:47`); chèn 2 lần ra chuỗi ở
**x = 1489pt trên trang 1190pt** — cả cột phải nằm ngoài giấy.

### 2.2 · Gốc bệnh — ĐO ĐƯỢC

**Khung tên là entity của MODEL SPACE, đặt theo một tỉ lệ ĐOÁN, in theo một tỉ lệ KHÁC.**

`components/cad/CadEditor.tsx:1977-1978` (vùng cấm chạm, chỉ đọc):
```
const k = doc.printScale ?? suggestedN;
const tbAt = { x: box.maxX + 500 + 180 * k, y: box.minY };
```
`components/cad/CadSheets.tsx:261` thì gán cứng `scale: 100` cho ô nhìn của tờ.

Hai con số không liên hệ nhau. Đo trên bản demo A3:

| | |
|---|---|
| `k` lúc chèn | **50** ⇒ khối rộng `180 × 50 = 9000mm` world |
| tỉ lệ tờ in thật | **1:100** |
| ⇒ khung tên in ra | `9000/100 =` **90mm** thay vì 180mm — **đúng một nửa** |
| ⇒ chữ "Tỷ lệ" 3,4mm | in ra **1,70mm** — chính con số `A2-05` đo được |
| chèn lần 2 (`box.maxX` đã nở) | khối văng tới world **x=32230**, cửa sổ ô nhìn chỉ tới **24485** ⇒ rơi ngoài vùng cắt |

Và đường xuất Paper (`lib/cad/pdf.ts:526 drawPaperSheetOntoPdfPage`) **bỏ qua cả ba bước hậu kỳ**
mà đường Doc (`drawDocOntoPdfPage`) vẫn chạy: `applyRealScaleToTitleBlock` · `stripJargonFromEntities`
· `planExportLabelShifts`. `grep` trong thân hàm đó = **0** cho cả ba. Đó là lý do bản nộp mang
`(đã rà công năng)` và mang hai con số tỉ lệ khác nhau.

### 2.3 · Sửa

Ô nhìn cắt hình mô hình là chuyện **bình thường** của CAD. Khung tên bị cắt thì **không bao giờ**
bình thường. Nên cách chữa không phải nới ô nhìn (thế là phá "plot to scale") mà là trả khung tên
về đúng chỗ của nó trong nghề: **paper space**.

`lib/cad/pdf.ts`:
1. `timCacKhungTen()` — nhận diện khối khung tên đã bake (một `rect` tỉ lệ khung 1,5–8 ôm trọn một
   ô `Tỷ lệ 1:N`, ≥2 dòng chữ). Chữ thuộc khối tính theo **điểm neo**, bao hình khối là **hợp**
   bao hình mọi thành viên.
2. `viewportKhopO()` — ép bao hình khối vào ô giấy 180×42mm ⇒ cỡ in **không còn phụ thuộc `k`**.
3. `drawPaperSheetOntoPdfPage` — loại **mọi** khối khung tên khỏi ô nhìn, xoá nền dưới ô khung tên
   (khung tên là lớp trên cùng của tờ giấy), rồi vẽ khối chính ở góc phải-dưới; chạy đủ 3 bước hậu
   kỳ cho cả phần mô hình lẫn phần khung tên.

### 2.4 · Bằng chứng — TỪ FILE PDF ĐÃ MỞ

`giay-A3-ngang-vuakho-chen2.pdf` (ca chèn 2 lần — ca xưa văng khỏi giấy):

| | trước | sau |
|---|---|---|
| `IF-01` vị trí | x=1489,5…1536,2 / trang 1190,6 → **ngoài giấy** | x=1034,7…1081,4 → **trong giấy** |
| `IF-01` cỡ chữ | 8,50pt (3,0mm) ở khối bị cắt | **17,01pt (6,0mm)** = cỡ thiết kế |
| `Tỷ lệ` cỡ chữ | 4,82pt (1,70mm) | **9,64pt (3,40mm)** = đúng template |
| số tỉ lệ trên tờ | `1:100` **và** `1:47` | `1:100` (một con số duy nhất) |

Quét toàn bộ 8 tệp đường Paper: **77 chuỗi khung tên, 0 chuỗi vượt khung viền 8mm.**

Ảnh: `anh-duyet-mat/p0-giay/` — `02-TRUOC-…` (chỉ còn khối metadata rỗng `Bản vẽ 1 · Người vẽ: — ·
Rev: —`, khung tên thật bị vùng cắt nuốt) ↔ `04-SAU-…` (khung tên 9 ô đủ chữ, đúng cỡ) ·
`03-SAU-…-toan-trang.png` (cả tờ) · `07-SAU-chua-chen-khung-ten-9-o.png` (ca chưa chèn).
Tệp đầu ra kèm theo: `dau-ra-SAU-A3-ngang.pdf`, `dau-ra-SAU-A3-ngang-chen2lan.pdf`.

---

## 3 · Lỗi 2 · `A2-02` — tỉ lệ ngoài dãy chuẩn, cổng vẫn tick xanh

### 3.1 · Tái hiện — ĐƯỢC

Chạy đúng đường `CadEditor` tính nhãn khung tên: **1:47 · 1:70 · 1:32 · 1:62 · 1:22** — khớp
danh sách A2 (0/10 tổ hợp đạt).

### 3.2 · Gốc bệnh (a) — HAI phép tính cho cùng MỘT con số

| ai đọc | hàm | kết quả A3 ngang |
|---|---|---|
| bảng Khung tên trên màn + chữ bake vào entity | `model.ts:docScaleLabel` → `fitScaleLabel` (auto-fit **THÔ**) | **1:47** |
| đường xuất PDF | `pdf.ts:resolveExportScaleN` (**CÓ** bắt nấc chuẩn) | **1:100** |

Trong khi dòng chữ trên màn tự khẳng định *"khung tên + PDF dùng CÙNG con số này"*
(`CadEditor.tsx:2069`). Nó không cùng.

### 3.3 · Gốc bệnh (b) — VÌ SAO CỔNG GẬT

`lib/print/export-checks.ts` mục ① gọi `resolveExportScaleN()` — mà hàm đó **đã tự bắt về nấc
chuẩn rồi mới trả về** ⇒ `isStandardPrintScale(n)` gần như **luôn đúng** ⇒ cổng **không thể** đỏ
trên nhánh "Vừa khổ". Cổng kiểm một con số **khác** con số in ra giấy.

Thêm một lỗ thứ ba chưa ai chạm: tờ Paper in theo `Sheet.viewports[].scale` — **không mục kiểm nào
đọc tới nó**.

### 3.4 · Sửa

Không thêm mục kiểm thứ hai (thế là ba con số), mà **gộp về một**:

1. `model.ts:resolveDocPrintScaleN()` — phép tính **duy nhất**; `docScaleLabel` và
   `pdf.ts:resolveExportScaleN` nay chỉ là vỏ gọi vào nó ⇒ số trên màn = số bake = số in = số cổng kiểm.
2. `export-checks.ts` — thêm tham số `tiLeInThat` để nơi có `Sheet` truyền tỉ lệ ô nhìn vào; tờ
   1:47 nay **đỏ**.
3. Thêm cảnh báo "bản vẽ có N khung tên" để việc bỏ khối thừa khỏi tờ **không im lặng**.

> Cố ý **KHÔNG** đối chiếu thêm chuỗi đã bake với `n`: đường xuất ghi đè ô tỉ lệ ngay trước khi vẽ
> nên chuỗi bake cũ không bao giờ tới được giấy — báo nó là **báo động giả** về thứ người dùng
> không sửa được.

### 3.5 · Bảng trước/sau (tổ hợp → tỉ lệ sinh ra → có trong dãy chuẩn → chữ có bị cắt)

| Tổ hợp | TRƯỚC nhãn app | dãy chuẩn? | SAU nhãn app | dãy chuẩn? | tỉ lệ đường xuất | khớp? | chữ khung tên bị cắt |
|---|---|---|---|---|---|---|---|
| A3 ngang · Vừa khổ | `1:47` | ❌ | **`1:50`** | ✅ | 1:100 | ✅ | trước **có** → sau **không** |
| A4 ngang · Vừa khổ | `1:70` | ❌ | **`1:100`** | ✅ | 1:200 | ✅ | trước có → sau không |
| A2 ngang · Vừa khổ | `1:32` | ❌ | **`1:50`** | ✅ | 1:50 | ✅ | trước có → sau không |
| A3 dọc · Vừa khổ | `1:62` | ❌ | **`1:100`** | ✅ | 1:200 | ✅ | trước có → sau không |
| A1 ngang · Vừa khổ | `1:22` | ❌ | **`1:25`** | ✅ | 1:50 | ✅ | trước có → sau không |
| A3 ngang · 1:100 tay | `1:100` | ✅ | `1:100` | ✅ | 1:100 | ✅ | trước có → sau không |
| A3 ngang · chèn 2 lần | `1:47` | ❌ | **`1:50`** | ✅ | 1:100 | ✅ | trước **ngoài giấy** → sau trong giấy |
| A4 dọc · chèn 2 lần | `1:92`* | ❌ | **`1:100`** | ✅ | 1:200 | ✅ | trước có → sau không |

\* con số A2 đo cho A4 dọc. Cột "khớp?" so nhãn sau chèn với `resolveExportScaleN` — **trước khi
sửa lệch ở 5/6 tổ hợp** (67≠100 · 131≠200 · 46≠50 · 131≠200 · 26≠50), **sau khi sửa khớp 8/8**.

---

## 4 · Ba chuỗi A2 nêu

| chuỗi | thuộc vùng tôi không? | xử lý |
|---|---|---|
| `(đã rà công năng)` | **Có** — đường Paper không chạy `stripJargonFromEntities` | **đã xử**, quét 16 tệp = 0 lần xuất hiện |
| `Untitled flow` | Không — là `opts.title` do nơi gọi truyền vào (`CadSheets.tsx`) | **ghi lại**, không tự sửa |
| `CĂN HỘ MẪU — DEMO` | Không — là **tên dự án của chính bản demo**, nội dung hợp lệ | không phải lỗi; vòng đầu bộ đo của tôi bắt nhầm, đã sửa bộ đo |

---

## 5 · Đánh giá khách quan

**Được:** cả hai P0 tái hiện được rồi mới sửa; gốc bệnh đo được tới `file:dòng`; lời giải đi theo
đúng luật *"một cỗ máy, nhiều mặt tiền"* — **bớt** một phép tính chứ không thêm; nghiệm thu mở file
thật; sửa được cả `A2-04` và phần lớn `A2-05` như hệ quả, không phải vá riêng.

**Chưa được:**
- Bộ đo không thấy được `clip` của PDF, nên tôi phải tách "vắt qua mép" (= cắt cụt, P0) khỏi "nằm
  hẳn ngoài" (= bị clip, vô hình). Vòng đầu tôi gộp hai thứ và báo quá tay 16/16 tệp.
- `centerMm` của tờ vẫn tính từ bao hình **có** khung tên ⇒ bản vẽ lệch trái, chừa mảng trống lớn
  (thấy rõ ở `03-SAU-…-toan-trang.png`). Nằm ở `CadSheets.tsx` — ngoài vùng ghi.
- Chưa chạy trên app thật qua trình duyệt (xem §7b).

---

## 6 · Hướng xử lý — các góc đã cân

| hướng | ưu | nhược | chọn? |
|---|---|---|---|
| **A** · Nới ô nhìn cho vừa khung tên | sửa ít dòng | phá "plot to scale" — bản vẽ thôi đúng tỉ lệ, tức đổi một lỗi nhẹ lấy một lỗi nặng hơn | ✗ |
| **B** · Chỉ thêm mục kiểm để cổng báo khi khung tên rơi ra ngoài | rất rẻ, không đổi hình ảnh | báo rồi người dùng **không có cách sửa** — vị trí do mã tính, không do họ đặt | ✗ |
| **C** · Đưa khung tên về paper space | đúng nghề (khung tên vốn thuộc tờ giấy, không thuộc mô hình); sửa trọn cỡ chữ + vị trí + đè hình bằng một thay đổi; không đụng vùng cấm | phải nhận diện khối bằng heuristic; đổi hình ảnh đầu ra đáng kể | ✅ |

## 7 · Đề xuất — vì sao chọn C

Vì nó **sửa nguyên nhân, không sửa triệu chứng**. A và B đều để nguyên cái sai gốc (một vật của tờ
giấy bị đặt trong mô hình và định cỡ bằng một tỉ lệ chẳng liên quan). C bỏ hẳn sự phụ thuộc vào `k`
— nên các ca chưa ai thử (khổ khác, chèn nhiều lần, đổi tỉ lệ sau khi chèn) **không thể tái phát**,
thay vì phải vá từng ca. Đây cũng là lý do một thay đổi đóng luôn `A2-04` và phần lớn `A2-05`.

---

## 7b · ⑦b CHƯA CHẮC / CHƯA KIỂM — bắt buộc ghi

1. **Chưa mở app thật.** Máy đang tải rất nặng (loadavg **73**, 4 làn chạy song song); tôi chạy
   `buildCadPdf`/`buildSheetSetPdf` **thẳng bằng Node qua đúng mã sản xuất**, không qua `next dev`.
   Đường UI (`CadSheets` gọi hàm nào, truyền `opts` gì) là **đọc mã**, không phải quan sát.
2. **Chỉ mở PDF.** Chưa mở PNG · DXF · `.idf` · PPTX. Nếu đường xuất DXF/`.idf` cũng bake khung tên
   thì chưa ai kiểm.
3. **Bộ đo không đọc được `clip`.** "Không bị cắt" ở đây nghĩa là *không chuỗi nào vắt qua mép giấy
   hay mép ô nhìn*. Chữ nằm hẳn ngoài thì bị clip → vô hình → tôi coi là không phải giá trị sai;
   đó là **phán đoán của tôi**, không phải phép đo.
4. **261/16 tệp chuỗi KHÔNG đọc được vị trí** — `pypdf` không phát lại ma trận chữ cho run nối tiếp
   nên trả `x=0,y=0`. Tôi bỏ qua chúng và khai số. Chúng phần lớn là chữ ngắn (`Rev —`, nhãn trục).
5. **Bề rộng chuỗi là ƯỚC LƯỢNG** (0,55–0,62 × cỡ chữ), không phải đo font metrics thật. Ngưỡng
   "vượt mép" vì thế có sai số vài pt. Các ca P0 vượt 6–300pt nên kết luận không đổi, nhưng ca sát
   mép thì con số của tôi không đủ sắc.
6. **Heuristic nhận diện khung tên** (tỉ lệ khung 1,5–8 · ôm ô `Tỷ lệ 1:N` · ≥2 dòng chữ) là do tôi
   cân, **chưa có ai duyệt**. Ngưỡng ≥2 là **đo** (khung tên cũ của demo chỉ có 2 dòng nằm trọn
   trong hộp) chứ không phải đoán, nhưng bản vẽ nhập từ DWG/DXF ngoài có thể có `rect` lọt tiêu chí.
7. **Chưa thử `.idf` cũ** đã lưu từ trước — không biết khối khung tên trong đó có khớp heuristic không.
8. **Ca nhiều ô nhìn khác tỉ lệ**: tôi lấy tỉ lệ ô **lớn nhất** ghi lên khung tên. Đúng thông lệ hồ
   sơ, nhưng **chưa ai chốt** cho IF.

---

## 8 · Phát hiện ngoài phạm vi — GHI, KHÔNG TỰ SỬA

| # | phát hiện | bằng chứng | vì sao không sửa |
|---|---|---|---|
| N-1 | **Tờ giấy căn giữa theo bao hình CÓ khung tên** ⇒ bản vẽ lệch hẳn sang trái, chừa mảng trống lớn; ca A4 dọc chèn 2 lần thì gần như không thấy bản vẽ | `CadSheets.tsx:260` `centerMm` lấy từ `docBox(doc)`; đo: bản vẽ nằm ở world x −332pt trên tờ 595pt | `components/cad/CadSheets.tsx` ngoài vùng ghi |
| N-2 | **`Tỷ lệ (m)` (nhãn thước) và chuỗi kích thước `1500` vắt qua mép ô nhìn** ở A3 dọc / A4 ngang | 3/16 tệp, xem `soi.py` | hệ quả của N-1 (khung ngắm của tờ), cùng chủ sở hữu |
| N-3 | **`fitTextHeightMm()` có sàn 60% nên CHẤP NHẬN chữ tràn khỏi ô của nó** — 2/5 dòng khung tên cũ của demo tràn | `lib/cad/commands.ts:378-382` | `commands.ts` ngoài vùng ghi. Tôi chỉ chặn hậu quả (khối vẫn lọt giấy), không chữa nguyên nhân |
| N-4 | **`Untitled flow`** làm tiêu đề bộ hồ sơ trong bản nộp | `dau-ra-A3-ngang.pdf` trang 1 | `opts.title` do `CadSheets.tsx` truyền |
| N-5 | **Cổng kiểm nhận `paper`/`orientation` từ hộp thoại, không từ `Sheet`** ⇒ có thể kiểm một khổ giấy khác khổ đang in | `CadSheets.tsx:1350` `buildExportChecks(doc, paper, orientation)` | tôi đã mở sẵn tham số `tiLeInThat`; nối dây là một dòng ở `CadSheets.tsx` — ngoài vùng ghi |
| N-6 | **Khối metadata cũ (`Bản vẽ 1` · `Người vẽ: —` · `Rev: —` · `1 ô nhìn`)** vẫn in khi bản vẽ chưa có khung tên — toàn giá trị rỗng | `pdf.ts` nhánh `else` của khung tên | giữ nguyên hành vi cũ có chủ đích; đổi nó là quyết định trình bày, cần người duyệt |

---

## 9 · Tệp đã đổi (CHƯA COMMIT)

| tệp | việc |
|---|---|
| `lib/cad/model.ts` | thêm `resolveDocPrintScaleN()`; `docScaleLabel()` gọi vào nó |
| `lib/cad/pdf.ts` | `resolveExportScaleN` thành vỏ; thêm `timCacKhungTen`/`timKhungTen`/`viewportKhopO`; viết lại `drawPaperSheetOntoPdfPage` |
| `lib/print/export-checks.ts` | tham số `tiLeInThat`; ghi chú ①b; cảnh báo nhiều khung tên |
| `lib/cad/cad-core-b1.test.ts` | **sửa 1 kỳ vọng cũ** đang ghi nhận hành vi hỏng (fallback trả số thô `1:26`) |
| `lib/cad/pdf-p0-giay.test.ts` | **mới** — 14 ca khoá |
| `docs/delivery/FIX-P0-GIAY.md` | **mới** — báo cáo này |
| `docs/delivery/anh-duyet-mat/p0-giay/` | **mới** — 7 ảnh + 2 PDF đầu ra |

⚠️ Cây làm việc còn thay đổi của **4 làn khác** (`components/cad/CadSheets.tsx`, `lib/save-status.ts`,
`lib/sheets-persist.ts`, `components/studio/*`, …). Tôi **không chạm** tệp nào trong số đó.
