# BÁO CÁO PHIÊN SC — `smart-convert-pdf` (13/08/2026)

> Phiếu: `docs/phieu-giao/smart-convert-pdf.md` · Dây máy: `smart-convert-pdf` (dir
> `lib/present-editor`, mẫu `pdf-import|pdfToDeck`).
> Ràng buộc tuân thủ: KHÔNG git · KHÔNG dev server (dùng server sẵn có cổng 3000) · KHÔNG prisma ·
> KHÔNG dependency mới · KHÔNG commit file PDF dự án khách · KHÔNG sửa file ngoài VÙNG ③ · KHÔNG sửa
> `scripts/frontier-registry.mjs`.

## ⚠️ NÓI THẲNG NGAY ĐẦU — lệch so với phiếu gốc

Phiếu mô tả BA lớp (Nền raster · Chữ sống · Ảnh nhúng). Sau khi đọc kỹ `unpdf` (README + `.d.ts`),
**chỉ làm được lớp CHỮ** trong bậc 1 này — lý do kỹ thuật, không phải lười:

1. **Không có lớp Nền raster.** `unpdf.renderPageAsImage()` là hàm DUY NHẤT "chụp" cả trang ra PNG,
   nhưng README của chính `unpdf` ghi rõ nó **bắt buộc** gói `@napi-rs/canvas` để có Canvas ở Node.
   Gói này KHÔNG có trong `package.json`, KHÔNG có trong `node_modules` (đã kiểm `ls
   node_modules/@napi-rs` = rỗng), và phiếu ⑤ cấm thêm dependency. ⇒ Không có cách rasterize cả
   trang chỉ bằng `unpdf` không kèm canvas backend. Slide dùng nền trắng phẳng, không có ảnh "Nền
   gốc" đáy dưới như phiếu mô tả.
2. **Không có lớp Ảnh (XObject nhúng).** `unpdf.extractImages(pdf, pageNumber)` trích được PIXEL
   THÔ của ảnh nhúng nhưng **không trả toạ độ/kích thước đặt trên trang** (không có transform
   `cm`/`Do` của content stream) — chỉ biết "trang có ảnh gì", không biết "ảnh nằm ở đâu". Đặt bừa
   (vd full-bleed) là ĐOÁN, không phải TẤT ĐỊNH. Phiếu ①.3 cho phép bỏ qua trong tình huống này
   ("không moi được thì bỏ qua — KHÔNG cố, ghi thật trong báo cáo") — đã áp dụng, KHÔNG làm lớp Ảnh.
3. **Hệ quả lên lớp Chữ:** phiếu định "mặc định lớp chữ ẨN vì nền raster đã có chữ sẵn" — giả định
   này không còn đúng vì không có nền raster. Quyết định: **lớp Chữ MẶC ĐỊNH HIỆN** (đơn giản nhất,
   giữ đúng tinh thần luật nền §7② "đích đến phải sửa được, không phải file chết" — ẩn chữ thì slide
   trắng trơn, vô dụng).

Cả ba điểm đã ghi lại thành docstring dài ở đầu `lib/present-editor/pdf-import.ts` để phiên sau
không tưởng bở/đi tìm lớp Nền/Ảnh không tồn tại.

## ① Khuôn 2 giá trị

**① Kiến trúc app:** thêm 1 module thuần `lib/present-editor/pdf-import.ts` (gom ①ThuNT/②Grouping/
③unpdf-layer, tách bạch phần thuần-test-được khỏi phần đụng file thật — đúng khuôn `pptx-import.ts`
đã có) + cắm vào ĐÚNG cửa nhập gateway đã có (`Toolbar.tsx#onGatewayFile`), KHÔNG đẻ cửa nhập mới,
KHÔNG đụng `lib/gateway/**` (ngoài VÙNG, xem mục "đặc cách" dưới).

**② Vận hành & giá trị:** painpoint thật (Hoà: "deck cũ chỉ có PDF, muốn sửa phải dàn lại từ đầu —
mất buổi") nay còn: mở PDF → nhập → chữ đã SỐNG trong slide (kéo/sửa/đổi font được ngay), tiết kiệm
việc gõ lại chữ. Chưa giải được: hình ảnh/đường nét gốc của trang (vẫn phải tự chèn ảnh nền tay nếu
muốn giữ visual gốc) — nói rõ trong toast + docstring, không giấu.

## ② Việc đã làm

### 1 · Parser thuần `lib/present-editor/pdf-import.ts` (582 dòng + docstring)
- **Gom DÒNG** (`groupIntoLines`): item liên tiếp có Y gần nhau (< 35% chiều cao) HOẶC bị cắt bởi
  `hasEOL=true`. Dò THẬT bằng PDF tự viết tay: `hasEOL` chỉ đáng tin TRONG một khối `BT…ET` — giữa
  hai khối `BT` riêng (rất phổ biến, mỗi textbox PDF thường là 1 `BT…ET`) KHÔNG có `hasEOL` báo
  hiệu, phải dựa thêm khoảng cách Y mới bắt đúng ranh giới dòng.
- **Gom KHỐI** (`linesToBlocks`): dòng liên tiếp có khoảng trắng dọc (đáy dòng trên → đỉnh dòng
  dưới) < 1× cỡ chữ dòng trên VÀ mép trái không trôi quá 3× cỡ chữ (chặn gộp nhầm 2 cột cạnh nhau).
- **Quy đổi** `blockToFrame`/`fontSizeToPct`: PDF point (gốc dưới-trái) → `Frame` % sân khấu (gốc
  trên-trái) theo W/H THẬT của từng trang (`page.view`) — không giả định A4/16:9. Cùng công thức
  `pptx-import.ts#szToFontSizePct`. Có đệm an toàn `FRAME_WIDTH_PAD`/`FRAME_HEIGHT_PAD` (1.08/1.35)
  vì bounding-box PDF khít hơn cách trình duyệt dựng chữ thật (font thay thế + line-height 1.2).
- **Trang scan** (`items.length===0` sau lọc rỗng): 1 slide nền trắng + badge
  `"Trang N — trang scan, chữ cần OCR (bậc 2)"`, `templateId: 'pdf-import-scan'`. Không bịa chữ.
- **Provenance**: 1 `TextElement` ẨN (`hidden:true, locked:true`) chèn ở slide đầu tiên import —
  "Nguồn: … — chuyển đổi bậc 1", không chiếm chỗ nhìn thấy/không vào export nhưng vẫn đi theo dữ
  liệu deck (thấy được qua panel Lớp nếu bật hiện — đã soi thấy trên UI thật, xem ⑥).
- `pdfPageCount(data)`: đếm nhanh không trích chữ — UI gọi trước để quyết định hỏi phạm vi.
- `clampPageRange`/`parsePageRangeInput`: phân tích chuỗi `window.prompt` kiểu "1-10"/"5"/rỗng.
- `pdfImportSummary(fileName, res)`: câu báo cho người dùng, nói thẳng "CHỈ lớp CHỮ sống" ngay câu
  đầu — không giấu giới hạn.

### 2 · Cắm vào cửa nhập hiện có — `components/present-editor/Toolbar.tsx`
- `onGatewayFile` đặc cách bắt `format === 'pdf'` **TRƯỚC** khi gọi `routeFormat` (xem mục "đặc
  cách gateway" dưới) → gọi `openPdfFile(f)` (hàm mới, cùng khuôn `openPptxFile` đã có).
- `openPdfFile`: `pdfPageCount` → nếu > `PDF_RANGE_PROMPT_THRESHOLD` (30 trang) thì `window.prompt`
  hỏi phạm vi (cùng mức tương tác `window.confirm` của `openIdfpFile` sẵn có, không dựng dialog mới
  cho một lần hỏi đơn giản) → `pdfToDeck` với `onProgress` nuôi `LightArc` (state cục bộ
  `pdfProgress`, hiện ngay cạnh nút Nhập, không cần bắc cầu CustomEvent vì Toolbar sở hữu chỗ hiện) →
  dispatch `present:pdf-import-request` (bắc cầu sang PresentEditor, ĐÚNG pattern `.pptx`).
- Nhãn IOMenu "Chọn tệp — tự nhận định dạng" cập nhật thêm "PDF (chữ sống, bậc 1)".

### 3 · `components/present-editor/PresentEditor.tsx`
- Thêm listener `present:pdf-import-request` (nối slide vào CUỐI deck đang mở, giống `.pptx` — KHÔNG
  thay thế như `.idfp`, vì PDF là tài liệu nguồn khác) + `present:pdf-import-done` (toast lỗi/tiến
  trình, kênh RIÊNG không đè lên kênh `.pptx`).

### 4 · Đặc cách gateway — KHÔNG sửa `lib/gateway/**` (ngoài VÙNG FILE)
`lib/gateway/capabilities.ts` hiện khai `present.pdf.import = 'unavailable'` và
`lib/gateway/route.ts#STATIC_ROUTE` chưa có khoá `pdf` (dù dòng comment kiểu `RouteAction` ở đó
**đã ghi sẵn ý định** `// .pptx / .pdf — nhập làm slide`, `route.ts:18`). VÙNG FILE ticket này cấm
sửa `lib/gateway/**` nên `onGatewayFile` đặc cách bắt `pdf` trước khi gọi `routeFormat`, không đụng
gateway. Nợ ghi lại cho phiên sau: thêm `pdf: { kind: 'present-import-deck' }` vào `STATIC_ROUTE` +
đổi `capabilities.ts` `present.pdf.import` → `'lossy'`, rồi bỏ đặc cách trong `Toolbar.tsx`.

### 5 · Fixture + test — `lib/present-editor/pdf-import.test.ts` (47 assertion, 0 fail)
Fixture `lib/present-editor/__fixtures__/pdf-import-sample.pdf` (960 byte, **tự viết tay bytes**,
KHÔNG phải file dự án khách) — 2 trang khổ 400×800pt: trang 1 tiêu đề "Cà Phê Sáng" (28pt, dấu tiếng
Việt trong WinAnsiEncoding) + khối thân 2 dòng + đoạn tách rời; trang 2 content stream rỗng (trang
scan). Test phủ: gom dòng/khối thuần (item viết tay, không đụng `unpdf`) · vòng tròn thật đọc fixture
(số trang/số khối/text/frame/fontSize/scan/provenance/summary) · phạm vi trang · lỗi file hỏng · **1
regression test bắt được bug thật** (mục ③ dưới).

## ③ Sự cố bắt được bằng verify browser thật — ĐÃ SỬA

Sau khi wiring xong, verify bằng browser THẬT (không chỉ tsc/test) theo đúng luật `nhin-bang-mat-
nguoi-dung-cuoi`: dispatch file PDF qua `<input type=file>` ẩn của Toolbar (JS `DataTransfer`, vì
dialog chọn file OS không tự động hoá được), theo dõi `CustomEvent`.

**Bắt được:** `present:pdf-import-done` trả `{ok:false, text:"Cannot perform Construct on a
detached ArrayBuffer"}`. Nguyên nhân: `unpdf.getDocumentProxy()` (qua PDF.js) **transfer** buffer
gốc sang worker nội bộ để tránh copy → **detach** buffer gốc. `Toolbar.tsx#openPdfFile` gọi
`pdfPageCount(buf)` RỒI `pdfToDeck(buf, …)` **CÙNG MỘT** `ArrayBuffer` → lần gọi thứ hai đụng buffer
đã detach từ lần đầu → ném lỗi. Test tự viết trước đó KHÔNG bắt được vì mỗi test case đọc fixture
bằng `readFileSync` MỚI (không tái dùng buffer giữa 2 lệnh gọi unpdf) — đúng loại lỗi chỉ lộ ra khi
chạy UI thật với luồng gọi thật.

**Sửa tại nguồn** (`pdf-import.ts`): hàm `ownedCopy(data)` — LUÔN `.slice()` COPY bytes vào bộ nhớ
MỚI trước khi đưa cho `unpdf`, dùng trong CẢ `pdfPageCount` LẪN `pdfToDeck`. Buffer của caller không
bao giờ chạm `unpdf` nữa → an toàn gọi lại nhiều lần trên cùng 1 buffer gốc.

**Thêm regression test** (`pdf-import.test.ts`): gọi `pdfPageCount(sharedBuf)` rồi
`pdfToDeck(sharedBuf)` trên CÙNG MỘT `ArrayBuffer` — khoá lại hành vi, không cho tái phát.

**Verify lại sau sửa (browser thật, project `cmsl4b5ux0001w9jlrgo2q41t`):**
```
[pdf-import-request] slides=2 msg=Đã nhập 2 trang từ "ho-so-mau.pdf" — CHỈ lớp CHỮ sống
  (chưa raster hoá nền gốc, cần thêm bộ render ảnh — xem báo cáo). 1 trang scan cần OCR (bậc 2): trang 2.
```
Slide count deck 1→3 (nối đúng cuối, không đè slide có sẵn). Panel Lớp slide 1 hiện đúng 4 phần tử:
"Cà Phê Sáng" (title) · "Ly ca cao nay\nrat la ngon" (khối 2 dòng) · "Doan tach rieng biet" (đoạn
riêng) · "Nguồn nhập PDF" (provenance, có trong Lớp nhưng ẩn khỏi canvas — đúng thiết kế). Canvas
hiện đúng chữ tiếng Việt có dấu "Cà Phê Sáng". Slide 2 hiện badge "Trang 2 — trang scan, chữ cần OCR
(bậc 2)".

## ④ CHƯA LÀM — nói thẳng, không giấu

1. **Lớp Nền raster** — cần `@napi-rs/canvas` (dependency mới, ngoài phạm vi bậc 1 theo ⑤). Bậc 2.
2. **Lớp Ảnh nhúng đặt đúng vị trí** — `unpdf.extractImages` không trả transform/toạ độ; cần đọc
   operator-list PDF.js (`page.getOperatorList()`, theo dõi `cm`/`Do`) để suy vị trí — phức tạp,
   rủi ro sai vị trí cao (không còn "tất định"), để dành bậc 2 cùng lúc với Nền raster (2 việc cùng
   cần hiểu sâu render pipeline PDF, hợp lý gộp một đợt).
3. **OCR bậc 2** cho trang scan — đúng như tên gọi, badge chỉ BÁO, chưa chạy OCR.
4. **Bold/italic/font thật** — `unpdf.StructuredTextItem.fontFamily` chỉ trả CSS generic
   ('sans-serif'/'serif'/'monospace'), không lộ tên font/độ đậm thật qua API `extractTextItems`.
   Element dùng generic family này làm `fontFamily` (CSS hợp lệ, không phải tên font thật) — không
   suy bold/italic, mặc định `false`.
5. **Thứ tự đọc đa cột** — blocks giữ nguyên thứ tự đến từ content stream (đúng đa số PDF đơn giản/
   deck 1 cột); PDF nhiều cột phức tạp có thể ra thứ tự không đúng mắt đọc — chưa có thuật toán phát
   hiện cột.
6. **Kerning/spacing giữa item cùng dòng** — heuristic khoảng cách (`prev.fontSize*0.15`) để quyết
   định có dấu cách hay không giữa 2 item cùng dòng do đổi style; không hoàn hảo với mọi font.

## ⑤ Quyết định tự chọn khi gặp mơ hồ (khuôn "chọn đơn giản nhất")

- **Không rebuild lớp Nền/Ảnh bằng cách đoán vị trí** (vd full-bleed cho ảnh nhúng duy nhất) — chọn
  BỎ hẳn thay vì đoán sai trông như bug. Lý do trong mục ⚠️ đầu báo cáo.
- **Lớp Chữ mặc định HIỆN** (đảo ngược phiếu) — không có nền raster để so sánh, ẩn chữ = slide trắng
  vô dụng.
- **PDF nối vào CUỐI deck đang mở** (như `.pptx`), KHÔNG thay thế toàn bộ (như `.idfp`) — PDF là tài
  liệu nguồn khác, ít rủi ro mất việc đang làm dở hơn.
- **Đặc cách gateway trong `Toolbar.tsx`** thay vì sửa `lib/gateway/**` — VÙNG FILE cấm, chọn đường
  ít xâm lấn nhất, có ghi rõ nợ kỹ thuật để dọn sau.
- **Fixture PDF viết tay bytes, lưu file thật** (không sinh runtime như `pptx-import.test.ts` làm
  với `pptxgenjs`) — vì phiếu ⑤ chỉ định rõ "lưu `__fixtures__/`"; PDF viết tay đơn giản hơn nhiều so
  với dựng bằng thư viện (không có sẵn "pdf-lib" trong deps, viết tay 1 trang PDF ngắn hơn học API
  thư viện mới).
- **Không thêm bold/italic suy đoán** — `unpdf` không cho dữ liệu tin cậy, suy đoán sai còn tệ hơn
  không có.

## ⑥ Nghiệm thu tự làm (kết quả THẬT)

```
$ npx tsc --noEmit
(không có lỗi)

$ node_modules/.bin/sucrase-node lib/present-editor/pdf-import.test.ts
… 47 pass · 0 fail

$ grep -rn "pdfToDeck" lib/present-editor components/present-editor | head -5
lib/present-editor/pdf-import.test.ts:14: * đúng ranh giới hasEOL/khoảng cách Y; (b) `pdfToDeck` chạy THẬT trên fixture…
lib/present-editor/pdf-import.test.ts:21:  pdfToDeck,
lib/present-editor/pdf-import.test.ts:144:    const res = await pdfToDeck(bytes, {
lib/present-editor/pdf-import.test.ts:197:    const res = await pdfToDeck(bytes, { pageRange: { start: 1, end: 1 } });
lib/present-editor/pdf-import.test.ts:201:  /* ── BẮT THẬT bằng browser sống 13/08: …
```

Ngoài 3 lệnh phiếu yêu cầu, đã verify THÊM bằng browser thật (server sẵn có cổng 3000, project
`cmsl4b5ux0001w9jlrgo2q41t`) — xem mục ③, bắt và sửa 1 bug thật (detached ArrayBuffer) mà tsc/test
không bắt được. `pptx-import.test.ts` chạy lại xác nhận không hồi quy (75 pass · 0 fail).

## ⑦ Danh sách file đã sửa/tạo

| File | Loại | Ghi chú |
|---|---|---|
| `lib/present-editor/pdf-import.ts` | MỚI | 460 dòng, module thuần + lớp unpdf |
| `lib/present-editor/pdf-import.test.ts` | MỚI | 47 assertion |
| `lib/present-editor/__fixtures__/pdf-import-sample.pdf` | MỚI | 960 byte, tự viết tay |
| `components/present-editor/Toolbar.tsx` | SỬA | +`openPdfFile` +`onGatewayFile` đặc cách +LightArc |
| `components/present-editor/PresentEditor.tsx` | SỬA | +2 listener CustomEvent |

## ⑧ Đề xuất 3 việc tiếp theo

1. **Dọn nợ gateway**: thêm `pdf → present-import-deck` vào `lib/gateway/route.ts` +
   `capabilities.ts`, bỏ đặc cách trong `Toolbar.tsx` (VÙNG FILE của ticket kế phải MỞ RỘNG sang
   `lib/gateway/**`).
2. **Bậc 2**: thêm `@napi-rs/canvas` (cần Hoà duyệt dependency mới) để có lớp Nền raster thật + đọc
   operator-list cho lớp Ảnh đúng vị trí — 2 việc chung một hạ tầng "hiểu render pipeline PDF".
3. **OCR bậc 2** cho trang scan (badge hiện đã đúng, còn thiếu phần chạy OCR thật).
