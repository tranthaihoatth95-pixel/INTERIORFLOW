# 20/08 — TRÌNH CHIẾU LÀM TRUNG TÂM TRANG GIẤY · IN · PHÁT HÀNH

> Lane: dồn **trang giấy · in · xuất · phát hành** về chặng Trình chiếu.
> Vùng ghi: `components/present-editor/**` · `components/print/**` · `components/cad/CadSheets.tsx` ·
> `lib/present-editor/**`. Không đụng vùng lane khác.

---

## ⓪ TIỀN ĐỀ — KIỂM CHỨNG LẠI, XÁC NHẬN CẢ HAI

| Tiền đề MAIN đưa | Kiểm tại nguồn | Kết luận |
|---|---|---|
| Máy in KHÔNG bị nhân đôi — `ExportPdfDialog` dùng chung | `grep ExportPdfDialog` → đúng 2 nơi mount: `present-editor/Toolbar.tsx:647` · `cad/CadSheets.tsx:1127` | ✅ ĐÚNG. Việc là đổi ĐIỂM VÀO, không gộp engine |
| `CadSheets` giữ metadata tờ, KHÔNG giữ bản sao hình học | `CadSheets.tsx:5-12` tự khai; `Sheet`/`Viewport2D` (`lib/cad/model.ts:1414-1463`) chỉ có `centerMm` + `scale` + `rectOnPaper` | ✅ ĐÚNG — **không xoá gì** |

⇒ Đã thi hành đúng §I: **không gỡ một dòng in/xuất nào đang chạy.** Hộp thoại xuất PDF ở 2D
giữ nguyên 100%, chỉ **thêm** một điểm vào mới.

---

## VIỆC 1 · BẢNG PHÂN LOẠI ĐIỂM VÀO IN / KHỔ GIẤY / TỈ LỆ

Đo bằng grep tại nguồn 20/08 (không tin danh sách sẵn — và danh sách MAIN **thiếu 3 mục**:
`UnitsScaleSettings`, `PlanPresentPanel`, và đường `⌘P` trong `CadCanvas`).

| # | Điểm vào | file:dòng | Là gì | **Phân loại** |
|---|---|---|---|---|
| 1 | Nút "Gửi sang Trình chiếu" (MỚI) | `cad/CadSheets.tsx` `GuiSangTrinhChieu` | đẩy tờ có neo nguồn sang Present | **CHUYỂN SANG PRESENT** ✅ đã làm |
| 2 | `ExportPdfDialog` mở từ 2D | `cad/CadSheets.tsx:1127` | chọn khổ/xem trước/xuất tờ | **GIỮ LÀM GỬI-NHANH** — in nhanh tại chỗ vẫn là nhu cầu thật |
| 3 | `ExportPdfDialog` mở từ Present | `present-editor/Toolbar.tsx:647` | y trên, khổ bị khoá kèm lý do | **GIỮ LÀM GỬI-NHANH** |
| 4 | `⌘P` / `Ctrl+P` | `cad/CadCanvas.tsx:2566` | chặn hộp in trình duyệt, mở đúng dialog trên | **GIỮ LÀM GỬI-NHANH** (đã tái dùng, không đẻ đường mới) |
| 5 | `CadToolbelt` nút giấy | `cad/CadToolbelt.tsx:106` | bắn `cad:paper-export-dialog-request` | **GIỮ LÀM GỬI-NHANH** (chỉ là cầu sự kiện, không phải engine) |
| 6 | Khổ giấy + Tỉ lệ in trong Inspector 2D | `cad/CadEditor.tsx:1875,1908` | ghi thẳng `Doc.paperKey/printScale` | **GIỮ** — đây là **tỉ lệ Ô NHÌN của bản vẽ**, không phải trang giấy hồ sơ. Hai thứ khác nhau, đừng gộp |
| 7 | "Khổ trình bày" | `present-editor/StagePresetPanel.tsx` | 16:9 · A4/A3 — khổ MÀN HÌNH/chiếu | **GIỮ** (khác trục: khổ trình chiếu ≠ khổ in) |
| 8 | Thiết lập trang (MỚI) | `present-editor/ThietLapTrang.tsx` | khổ · hướng · tỉ lệ · lề · khung tên · tầng sâu | **CHUYỂN SANG PRESENT** ✅ đã làm |
| 9 | `RenderIOMenus.exportPdf` | `studio/RenderIOMenus.tsx:59,116` | xuất PDF từ chặng 3D | **CHUYỂN SANG PRESENT** 🔶 CHƯA làm (xem "còn nợ") |
| 10 | `window.print()` — BOQ | `present-editor/boq/BoqScreen.tsx:309` | in bảng khối lượng qua hộp in trình duyệt | **GỠ BẢN TRÙNG** 🔶 CHƯA — đây là đường in **thứ hai** thật sự, đi vòng qua toàn bộ luật khổ/tỉ lệ |
| 11 | `window.print()` — Bảng thống kê | `present-editor/table/ScheduleScreen.tsx:168` | y trên | **GỠ BẢN TRÙNG** 🔶 CHƯA |
| 12 | "Xuất PDF báo cáo quy chuẩn" | `cad/CadEditor.tsx:2094,2167,2192` | báo cáo kiểm chuẩn, không phải bản vẽ | **LEGACY** — giữ, khác loại đầu ra |
| 13 | Tỉ lệ in mặc định (cài đặt app) | `settings/UnitsScaleSettings.tsx:181` | mặc định cấp app | **GIỮ** — là mặc định, không phải điểm in |
| 14 | Hiển thị "Tỉ lệ in 1:N" | `cad/PlanPresentPanel.tsx:278` | chỉ đọc | **GIỮ** (không phải điểm vào) |
| 15 | `StageIntroCard` "→ Xuất PDF/PPTX" | `onboarding/StageIntroCard.tsx:52` | chỉ là chữ giới thiệu | **LEGACY** — không phải nút |

**Hai mục đáng chú ý nhất**: #10 và #11 dùng `window.print()` — đó mới là **bản in trùng** thật
sự trong app (bỏ qua khổ giấy, tỉ lệ, khung tên, tiền kiểm). #6 thoạt nhìn giống trùng nhưng
**không phải**: nó là tỉ lệ của ô nhìn trong bản vẽ, thuộc chặng sáng tác.

---

## VIỆC 2 · GỬI SANG TRÌNH CHIẾU

`lib/present-editor/to-ban-ve.ts` (mới) — model **tờ** + cầu chuyển, **không chứa bản sao hình
học** (cùng nguyên lý `Sheet`/`Viewport2D`). Cầu dùng lại **đúng pattern** `handoff.ts`
(sessionStorage + fallback module + consume-once), không viết cầu thứ hai.

- 2D: `GuiSangTrinhChieu` trong `CadSheets.tsx` — tờ mang theo **khổ · hướng · tỉ lệ ô nhìn ·
  khung tên · `noiDungMm` · NEO NGUỒN** (`chang/docId/sheetId/dauVet/luc`).
- Present: `CongThietLapTrang` nhận, mount ở **tầng chặng** (`PresentStageScreen`).
- 3D → Present: kiểu `NeoNguon.chang` đã có `'model3d'` và test phủ, **chưa nối nút** (còn nợ).

---

## VIỆC 3 · THIẾT LẬP TRANG (NHANH ↔ SÂU)

`components/present-editor/ThietLapTrang.tsx`, dựng trên `BeMatNoi` (không tự chế kính).

- **NHANH** (chạy thật): khổ A0–A4 · hướng + số mm · tỉ lệ · lề (thanh trượt) · khung tên.
- **SÂU** (thu lại): 11 mục, **tất cả đi qua `KhaNang`**.

⛔ **Cấm bày núm cho thứ backend không làm được** — thi hành bằng kiểu dữ liệu: mỗi mục sâu nhận
`string | false`; `string` ⇒ mờ + **đúng lý do đó**, `false` ⇒ có thật. Lý do đi đường
`aria-disabled` + `aria-describedby`, **không dùng `title`** (title câm trên cảm ứng).
Bảng lý do thật nằm ở `CongThietLapTrang.KHA_NANG`.

---

## VIỆC 4 · TỈ LỆ BẢN VẼ — LUẬT KHOÁ BẰNG MÁY

`TY_LE_BAN_VE = [20,25,50,100]` + tuỳ chỉnh + "Vừa khung". Có **test canh nó là TẬP CON của
`STANDARD_SCALES`** ⇒ không đẻ dãy tỉ lệ thứ hai, đúng LUẬT `CHUAN-DAU-RA-NGHE.md`.

🔴 **CẤM CO GIÃN ÂM THẦM** — `tyLeApDung()` khi nội dung tràn giấy **vẫn trả về đúng N người dùng
chọn**, kèm `tranKhung: true` + câu cảnh báo nói rõ *"giữ nguyên tỉ lệ (không tự co giãn)"*.
"Vừa khung" **chỉ chạy khi chọn tường minh**. Và ngay cả khi vừa-khung, nó chỉ lấy số **trong dãy
chuẩn** — không bịa `1:47`. Ba test khoá đúng ba nhánh này.

---

## VIỆC 7 · NGUỒN & BẢN SỬA

Present và 2D là **hai route**, store không hydrate chéo ⇒ Present không tự đọc `Doc` được.
Giải bằng **sổ dấu vết**: 2D ghi `ghiDauVetNguon(docId, dauVet)` (hoãn 600ms, không chạy theo
từng khung kéo chuột); Present đọc `docDauVetNguon()`.

- Nguồn đổi ⇒ **`'cu'` — chỉ ĐÁNH DẤU**, không có nhánh nào tự ghi lại tờ.
- Đọc không được ⇒ `'khong-ro'`, **không đoán thành `'hien-hanh'`**.
- Người chọn **Cập nhật · So sánh · Giữ bản hiện tại**.
- `coTheTuCapNhat()` là **cổng duy nhất**: tờ đã phát hành ⇒ luôn `false`.

---

## 🔴 ĐÍNH CHÍNH GIỮA LƯỢT — LUẬT VẬT LIỆU (MAIN gửi 20/08)

Luật mới: **vật liệu theo chức năng** — biểu mẫu · cài đặt · **thiết lập trang** · dữ liệu kỹ
thuật ⇒ **ĐẶC**, không phải kính mỏng. Khuôn cho ca này: **VỎ KÍNH + RUỘT GẦN ĐẶC**.

**Kết quả rà: KHÔNG PHẢI ĐẬP ĐI LÀM LẠI.** Panel dựng bằng `BeMatNoi bac="bangSau"`, mà
`bangSau` ánh xạ sẵn sang `doDac: 'dac'` ⇒ đo trên app thật: `class="kinh-noi kinh-noi--dac"`,
nền `rgba(253,252,250,0.96)`. Tức nó **đã ở nấc đặc nhất** từ đầu, đúng khuôn B.

Hai chỗ siết thêm cho khớp luật:

1. **Khai `doDac="dac"` TƯỜNG MINH** thay vì để suy từ `bac`. Lý do: ai đổi `bac` về sau sẽ vô
   tình hạ độ đặc xuống `vua`/`mong` mà không ai thấy — đó đúng là cách một luật vật liệu bị phá
   trong im lặng.
2. **Gỡ một lớp bán trong suốt trong ruột**: hàng trạng thái nguồn đang là
   `color-mix(--panel 70%, transparent)` — một lớp trong suốt **nằm trên** bề mặt kính
   (kính-chồng-kính, §11 cấm), và nó làm nhoè đúng dòng chữ *"Hiện hành / Có bản mới"* — chỗ ít
   được phép nhoè nhất trong cả panel. Nay `background: var(--panel)` đặc.

`color-mix` còn lại (2 chỗ) là **tô sắc nhấn trên nền đặc** — dải cảnh báo tràn khung và chip
đang chọn — không phải lớp kính, giữ nguyên.

**§13 thứ bậc — chưa đến lượt, và ghi lại để không quên**: luật *"trang giấy là CHÍNH, núm là
phụ"* áp cho **VIỆC 5 (xem trước trang)**, mà việc đó chưa làm. Panel hiện chỉ là bảng thiết lập
độc lập nên chưa vi phạm. ⚠️ Khi nối xem trước: **tờ giấy phải lớn hơn bảng núm**, không được để
bảng 340px lấn tờ.

---

## VERIFY

- **tsc**: 0 lỗi.
- **test khuôn nhà** (`sucrase-node`, không vitest): `to-ban-ve.test.ts` **22 pass / 0 fail**;
  quét lại toàn bộ `lib/present-editor` + `lib/cad` + `lib/print` → **0 FAIL**.
- **`npm run soi:frontier`**: **0 LỆCH**, exit 0.
- **BROWSER THẬT** (server :3001 sẵn có, không restart), `/projects/<id>/cad` → `/present`:
  1. Bấm "Gửi sang Trình chiếu" → SPA nhảy đúng `/projects/<id>/present`.
  2. Nút hiện: **`Thiết lập trang · A3 · 1:100 · Hiện hành`**, panel mở.
  3. Panel dựng đủ: khổ A0–A4 · Ngang/Dọc + `420 × 297 mm` · 1:20/25/50/100 + Vừa khung +
     tuỳ chỉnh · lề 10 mm · khung tên · tầng sâu.
  4. **Chứng minh nguồn đổi ⇒ CŨ**: đổi sổ dấu vết (giả lập 2D vừa sửa) → nhãn đổi thành
     **"Có bản mới"**, hiện 3 lối xử, **tờ vẫn nguyên A3 · 1:100 — không tự sửa**.
  5. "So sánh" `aria-disabled="true"` + `aria-describedby` trỏ lý do thật.
- **Dọn dữ liệu thử**: localStorage **27 → 27**, sessionStorage **0 → 0**; giá trị dấu vết bịa
  đã trả về giá trị thật do 2D tính.

### 🐛 Hai bug thật bắt được lúc nghiệm thu (không phải chuyện gu)

1. **StrictMode ăn mất tờ.** Cầu là consume-once, React dựng component hai lần → lần đầu tiêu thụ
   rồi bị vứt, lần thật sự hiển thị thì cầu đã rỗng ⇒ nút **không bao giờ hiện**. Vá bằng biến
   module `toDaNhan`. Cùng họ bẫy với fallback bộ nhớ của `handoff.ts`.
2. **Nút mờ có ô lý do RỖNG** — đúng thứ luật này sinh ra để cấm: khi năng lực CÓ THẬT
   (`ly === false`) mà nơi gọi quên truyền `onClick`, nút mờ mà không nói được vì sao. Nay ca đó
   có câu riêng: *"Năng lực này có thật trong app nhưng màn Trình chiếu chưa nối nút mở."*

Kèm: bắt chính mình chép lại bảng ISO A0–A4 trong `ThietLapTrang` → đã đổi sang gọi
`paperSizeMm()` của `lib/cad/model.ts` (đúng luật cấm nguồn thứ hai).

---

## 📌 VỀ TIN THỨ HAI — MÀN CHỜ PRESENT BỊ BÁC

Đọc để không xây tiếp lên nền đã bị bác. **Không mở rộng phạm vi lượt này** theo đúng dặn dò.

**Lane này KHÔNG chạm `NguonLienKet.tsx`** — kiểm bằng `git status`: tệp đó đang `??` (do lane
khác tạo), không nằm trong danh sách tệp lượt này sửa.

**Phần lượt này thêm vào chặng Present KHÔNG góp vào "bức tường thẻ"**: `CongThietLapTrang` trả
`null` khi chưa ai gửi tờ nào ⇒ màn chờ Present **y hệt trước**, không thêm một thẻ nào. Chỉ khi
người dùng vừa bấm "Gửi sang Trình chiếu" thì mới hiện **đúng một nút**.

⚠️ **Một chỗ cần MAIN phán khi xếp thứ tự**: panel **tự mở** khi nhận tờ (`setMo(true)`). Lập
luận giữ: người dùng vừa **chủ động** bấm gửi, nên mở panel là *nối tiếp việc họ đang làm*, không
phải *ép một bước cài đặt* — khác hẳn ca màn chờ. Nhưng nếu MAIN thấy nó vẫn đọc ra như
"phải cài đặt xong mới cho làm việc" thì đổi thành **không tự mở, chỉ hiện nút** là sửa một dòng.

---

## 🟡 CHƯA CHẮC / CHƯA KIỂM

- **`noiDungMm` = 0×0 trong lần thử browser** vì bản vẽ trống ⇒ **nhánh cảnh báo tràn khung chưa
  chạy trên app thật**, mới chỉ chứng minh bằng 5 test đơn vị. Cần một lượt với bản vẽ có nội dung.
- **Tờ chưa persist**: sống trong state React ⇒ tải lại trang là mất. v0 cố ý; muốn tờ sống qua
  phiên thì phải chốt **tờ thuộc bản lưu hay thuộc máy** (luật lưu chung ↔ máy 16/08).
- **Dấu vết nguồn dùng `JSON.stringify(doc.entities)`** — đúng và tất định, nhưng là O(n) trên
  doc lớn. Đã hoãn 600ms; chưa đo trên doc thật vài nghìn entity.
- Chỉ thử Chromium, chỉ theme sáng; **chưa thử trình đọc màn hình**, chưa chạy nhánh
  `prefers-reduced-motion`.
- Chưa chạy `npm test` đầy đủ (gồm `license:check` + `check:chot`) — mới quét 3 thư mục test liên quan.

## 🔶 CÒN NỢ (khai thẳng, không giả vờ xong)

- **VIỆC 5 XEM TRƯỚC TRANG THẬT** — chưa làm. `PaperSheetFrame` đã có sẵn, nên đây là việc nối.
- **VIỆC 6 TIỀN KIỂM** — chưa nối. `lib/print/export-checks.ts` (marker `CHUAN_DAU_RA`) đã có,
  **cố ý không viết bộ kiểm thứ hai**; việc còn lại là gọi nó từ Thiết lập trang.
- **VIỆC 8 NHIỀU TRANG** — chưa làm (cầu đã chịu được nhiều tờ, `MAX_TO = 12`).
- **3D → Present** — kiểu đã có, nút chưa nối.
- **#10, #11 `window.print()`** — hai bản in trùng, chưa gỡ.
- **Chưa thêm entry `frontier-registry`** vì `scripts/frontier-registry.mjs` **ngoài vùng ghi**
  của lane này. Đề nghị MAIN mở entry (gợi ý id: `present-trung-tam-in`).
