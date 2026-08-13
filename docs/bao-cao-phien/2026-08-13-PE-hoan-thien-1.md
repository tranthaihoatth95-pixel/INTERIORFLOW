# BÁO CÁO PHIÊN · PE — present-editor hoàn thiện #1 (13/08/2026)

Phiếu: `docs/phieu-giao/present-editor-hoan-thien-1.md` · Vai PE, cấp Đ. KHÔNG git, KHÔNG dev server, KHÔNG dep. Vùng file đúng phiếu: `components/present-editor/**` + `lib/present-editor/export.ts` (KHÔNG đụng `lib/ho-so-song/**` — chỉ gọi interface `packHoSoSong({ pdf })` đã nhận sẵn).

## 1 · Kênh PDF cho Gói Hồ Sơ Sống — cách tách Blob trong export.ts

**Khả thi, không giới hạn mới.** `exportDeckToPdf` cũ dựng jsPDF rồi `doc.save()` thẳng — điểm tách nằm NGAY TRƯỚC save:

- Tách private `buildDeckPdfDoc(deck) → { doc: jsPDF, name }` — thân vòng lặp render CHÉP NGUYÊN từ hàm cũ (stage/orientation/renderEditorSlide/addPage/addImage, không đổi tham số nào).
- `exportDeckToPdf` (cũ) = builder + `doc.save(name.pdf)` — **0 đổi hành vi**, đường save giữ nguyên jsPDF.
- `exportDeckToPdfBlob` (MỚI, additive) = builder + `doc.output('blob')` — byte PDF y hệt bản người dùng bấm "Xuất PDF" (một cỗ máy hai mặt tiền [T2]).

**Giới hạn khai thật:** biến thể Blob vẫn **browser-only** (`renderEditorSlide` cần canvas/DOM) — ngoài browser NÉM lỗi rõ, không trả Blob rỗng giả [T0]. Node script/test không chạy được nhánh render; gói mẫu dùng PDF fixture (xem §4). T verify browser sau nếu muốn thấy byte thật.

## 2 · Nối kênh trong Toolbar#exportHoSoSong — ĐÃ NỐI

Bước 4 mới (sau images, trước `packHoSoSong`): import động `exportDeckToPdfBlob`, render deck ĐANG MỞ, try/catch **fail-open** — PDF lỗi thì `pdf === undefined` → kênh vắng, viewer khai rõ, gói vẫn ra. Đồng thời:
- `vang`: `'PDF'` hardcode-vắng → `!pdf && 'PDF'` (hết khai vắng khi xuất được).
- Toast thành công thêm `+ PDF` khi có; câu "Kênh vắng:" chỉ hiện khi thật sự còn kênh vắng.
- Docblock `exportHoSoSong` cập nhật (bỏ ghi chú "PDF = CHƯA GÓI").

## 3 · Trả 7 chỗ thao-tac (bảng chỗ → sửa gì)

| # | Chỗ | Luật | Sửa |
|---|---|---|---|
| 1 | `Toolbar.tsx:930` (comment) | kinh-webkit-prefix | Máy-bắt-nhầm: file KHÔNG dùng backdrop-filter thật, chỉ NHẮC trong comment K4 → viết lại chữ `backdrop-filter` → "backdrop blur" (đúng tiền lệ TT §2, không nhét prefix giả) |
| 2 | `EditorCanvas.tsx:157` | keydown-ne-o-nhap | Listener chỉ xử Escape huỷ Format Painter → marker `esc-only` (đúng ngoại lệ phán quyết T 13/08), KHÔNG guard |
| 3 | `SlidePlayer.tsx:58` | keydown-ne-o-nhap | Phím chức năng ←/→/Space → guard khuôn repo (`document.activeElement` + INPUT/TEXTAREA/SELECT/isContentEditable, chép `PresentViewer.tsx:66`). Overlay hiện không có ô nhập thật → **hành vi không đổi**, đúng ghi chú phiếu |
| 4 | `boq/BoqScreen.tsx:201` | keydown-ne-o-nhap | ⌘Z undo overrides → guard cùng khuôn. Đây là sửa THẬT: đang gõ trong ô sửa số của bảng BOQ thì ⌘Z về native-undo của ô nhập, không cướp lịch sử overrides |
| 5 | `Inspector.tsx:659` | cam-chu-tu-dong | title "Danh sách đánh số tự động" → **"Danh sách đánh số"** (đánh số tất định, chữ "tự động" thừa) |
| 6 | `Inspector.tsx:1168` | cam-chu-tu-dong | "(thủ công, không tự động)" → **"(thao tác tay một lần — máy không theo dõi file)"** — giữ đúng ý gốc (một lần, không auto-sync) mà không dùng từ cấm |
| 7 | `TextToolbar.tsx:272` | cam-chu-tu-dong | title "Đánh số tự động" → **"Danh sách đánh số"** (đồng bộ #5) |

i18n: cả 3 nhãn là `title` chuỗi trần, không qua `tr()` — không có cặp EN phải cập nhật.

## 4 · Nghiệm thu (chạy thật)

- `npm run soi:thao-tac` — 3 luật mục tiêu **✅ HOÀN TOÀN**: `kinh-webkit-prefix` ✅ · `keydown-ne-o-nhap` ✅ · `cam-chu-tu-dong` ✅. Dòng tổng nguyên văn: `🔴 2 LỆCH (trên 17 luật grep) · 👁 19 luật chờ mắt` — 2 lệch còn lại = đúng 2 luật hàng đợi có chủ ý phiếu CẤM đụng (`outline-can-focus-visible` 31+1 · `cam-hex-inline` 193).
- `npx tsc --noEmit` — **exit 0, 0 lỗi**.
- Test: **43/43 PASS** toàn bộ `lib/present-editor/*.test.ts` + `lib/ho-so-song/ho-so-song.test.ts` (sucrase-node, đúng cách `npm test` chạy).
- `npm run soi:tu-dien` — **0 lệch định nghĩa**.
- `npm run check:chot` — 9 luật · 0 vi phạm chặn · 0 cảnh báo.
- **Gói mẫu có kênh PDF**: script `scratchpad/tao-goi-mau-pdf.ts` (mượn nguyên `tao-goi-mau.ts` của HS + `pdf:` fixture — PDF tối thiểu HỢP LỆ tự dựng xref offset thật, 2 trang A4 ngang mở được bằng mắt) → `scratchpad/ho-so-mau-pdf.zip` (8.976 bytes). Manifest: `viewer · deck · pdf→out/ho-so.pdf · boq · anh-1..3` — ✅ kênh pdf CÓ MẶT, unzip kiểm `out/ho-so.pdf` header `%PDF-1.4` + `%%EOF` ok. Bản giải nén soi mắt: `scratchpad/ho-so-mau-pdf-mo/`.

## 5 · CHƯA LÀM / nói thẳng

1. **Chưa verify browser** — phiếu cấm dev server; đường PDF-Blob thật (render canvas → jsPDF → zip) mới qua tsc/test/máy soi + gói mẫu node-fixture. T bấm "Gói Hồ Sơ (.zip)" trên app thật để thấy `out/ho-so.pdf` từ deck thật.
2. PDF trong gói là bản **px-màn-hình 16:9/khổ đang chọn** (đường `exportDeckToPdf` chuẩn) — KHÔNG phải bản 300dpi `exportDeckToPdfAtPaperSize` (cần tier AI + chỉ chạy A4/A3; nếu muốn kênh PDF gói theo dpi in thật là quyết định riêng, phiếu sau).
3. Deck render 2 lần trong exportHoSoSong (một cho ảnh trang JPEG, một trong PDF-Blob) — chấp nhận để giữ additive/không đổi builder; nếu deck rất dài mà chậm thì tối ưu tái dùng render là việc đợt sau.
4. Viewer/pack thuộc `lib/ho-so-song` — KHÔNG đụng, đúng biên phiếu (pack đã nhận `pdf?` sẵn từ phiên HS).
