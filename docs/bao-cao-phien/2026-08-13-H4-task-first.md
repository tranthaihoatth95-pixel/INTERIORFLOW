# BÁO CÁO PHIÊN H4 — sửa nóng dogfood F1 "Trình chiếu rối rắm" (13/08/2026)

> Nguồn: `docs/bao-cao-phien/2026-08-13-DOGFOOD-1-findings.md` mục F1 (4 bệnh: toolbar 2 hàng ~20
> nút ngang cấp · banner học-gu chiếm mặt tiền panel trái · cột phải hiện cả khi slide trống ·
> canvas trắng không dẫn lối). Entry registry: `present-task-first`.
> VÙNG FILE: `components/present-editor/**` — chỉ sửa `Toolbar.tsx` · `PresentEditor.tsx` ·
> `LayoutShelf.tsx`. Không đụng git/dev server/prisma/globals.css/registry. Đọc trước luồng
> Smart Convert PDF (`docs/bao-cao-phien/2026-08-13-SC-smart-convert-pdf.md`) để không phá — đã
> giữ nguyên `openPdfFile`/`onGatewayFile`/CustomEvent, chỉ thêm 1 cách gọi mới (ref) tới nút Nhập
> đã có, không đẻ cửa nhập tệp thứ hai.

## ① Khuôn 2 giá trị

**① Kiến trúc app:** không thêm engine/route/schema mới — 4 sửa đều là tổ chức lại UI đã có
(gộp nút vào popover, đổi nơi hiện banner, gate hiển thị theo state có sẵn). `ToolbarHandle`
(interface + `forwardRef`/`useImperativeHandle`) là API nội bộ MỚI duy nhất — cho phép
`PresentEditor.tsx` gọi đúng cửa "Mở tệp" của `Toolbar.tsx` từ nơi khác trong cây component mà
không cần bắc CustomEvent hay nhân bản input file.

**② Vận hành & giá trị:** giải đúng lời chê thật của Hoà 13/08 ("đang gấp không biết đường mà
lần") — mở Trình chiếu lúc cần NHẬP FILE GẤP thì có ngay nút "Nhập tệp" to giữa canvas (trước đây
2 lối "Tạo từ ảnh đã dựng"/"Bắt đầu bằng slide trắng" không có lối nhập file nào); toolbar từ ~20
nút ngang cấp còn 8 nhóm nhìn thấy (Quay lại/Nhập/Xuất/Chữ/Ảnh/Hình/Thiết kế/Undo/Redo/⋯/Trình
chiếu) — KHÔNG mất lệnh nào, chỉ gộp; banner học-gu hết chắn kệ mẫu; cột phải hết bày "Lớp (0)"
vô nghĩa trên slide trống.

## ② Việc đã làm — đúng 4 sửa, marker `TaskFirstStart`

### 1 · `components/present-editor/Toolbar.tsx` — toolbar phân cấp
- Chuyển `Toolbar` sang `forwardRef<ToolbarHandle, Props>` + `useImperativeHandle` lộ
  `openGatewayPicker()` (click hộ input file gateway) — để canvas trống gọi ĐÚNG cửa Mở tệp có
  sẵn (`onGatewayFile`/`openPdfFile`/`openPptxFile`… nguyên vẹn từ phiên SC 13/08), không tạo input
  file thứ hai.
- 6 nút shape (rect/ellipse/triangle/polygon/arrow/line) → gộp vào 1 nút **"Hình"** mở popover
  (đổi tên `ArrangePopover` → `AnchoredPopover` dùng chung, thêm `width`/`layout` prop).
- 4 mục **Sắp xếp / Brand Kit / Khổ trình bày / Xem lưới** → gộp vào 1 menu **"⋯"** (icon
  `MoreHorizontal`, KHÔNG đặt tên "Bố cục" — nút "Thiết kế" ngay cạnh đã mang tên chính thức "Bố
  cục" theo comment 07/08 trong chính file này; 2 nút cùng tên trên 1 toolbar đúng là kiểu rối
  đang sửa, nên tránh trùng). "Sắp xếp" trong menu vẫn mở ĐÚNG popover 14 nút cũ (căn lề · thứ tự
  lớp · nhóm · khoá · ẩn), chỉ đổi điểm neo — 0 lệnh nào bị xoá.
- Hàng chính còn lại: Quay lại · Mở tệp · Xuất · Chữ · Ảnh · Trình chiếu (đúng 6 việc phiếu yêu
  cầu) + 4 nhóm phụ liền kề (Hình · Thiết kế · Undo/Redo · ⋯) — không ẩn, chỉ không rải phẳng.
- `MenuRow` — component menu-item mới (icon + nhãn + mô tả nhỏ), cùng khuôn `Item` của
  `components/ui/IOMenu.tsx` nhưng viết riêng trong file (IOMenu dùng chung 3 chặng, ngoài VÙNG).

### 2 · `components/present-editor/PresentEditor.tsx` — TaskFirstStart + cột phải ẩn khi trống
- **TaskFirstStart** (marker code, grep được): thay M-EMPTY-2 cũ (2 lối, không có lối "Nhập tệp")
  bằng **3 lối to** giữa canvas — "Nhập tệp" (gọi `toolbarRef.current.openGatewayPicker()`) ·
  "Dàn từ mẫu" (`setPanelOpen(true); setTab('layout')` — mở đúng panel Thiết kế) · "Trang trống"
  (vào thẳng, dùng lại `onAddBlankSlide` đã có). Hiện khi **0 slide** HOẶC **đúng 1 slide trống
  (0 phần tử, 0 ảnh nền)** — deck có nội dung/nhiều trang thì KHÔNG đụng.
  "Tạo từ ảnh đã dựng" (năng lực cũ, `onAddSlidesFromRenders`) **giữ nguyên, hạ xuống lối phụ**
  bên dưới — không xoá, đúng CLAUDE.md luật 4 ("thừa/lạc hướng → cắt, ghi vào STATUS", ở đây
  không cắt hẳn mà chỉ đổi bậc nên ghi thẳng vào báo cáo này).
- Dismiss theo `taskFirstDismissedId` (state cục bộ, không đụng schema `Deck`/`.idfp`) — bấm
  "Trang trống" khi đã có sẵn 1 slide trống thì chỉ đánh dấu dismissed, không tạo slide thừa.
- **Cột phải ẩn khi trống**: `hasInspectorContent = !!ed.slide && (elements.length>0 ||
  selectedIds.length>0)`; điều kiện render đổi từ `inspectorOpen ? … : …` thành
  `inspectorOpen && hasInspectorContent ? … : …`. KHÔNG đụng state `inspectorOpen` đã lưu
  localStorage — nên khi slide có nội dung trở lại, panel tự hiện lại đúng như lựa chọn cũ của
  người dùng (verify sống: thêm 1 chữ vào slide trống → panel tự mở lại, xem mục ⑥).

### 3 · `components/present-editor/LayoutShelf.tsx` — banner học-gu → toast tự tắt
- Banner "Máy học 'gu' bắt đầu lại…" (đứng đầu panel Thiết kế, chắn kệ mẫu) → portal ra
  `document.body`, `position:fixed` góc dưới-trái màn hình, **tự tắt sau 6 giây** (hoặc bấm X).
  Giữ NGUYÊN điều kiện hiện gốc (`guFreshStart`, set 1 lần khi phát hiện model gu mới cho tài
  khoản) — chỉ đổi NƠI + THỜI GIAN hiện, không đụng logic học gu.

## ③ Quyết định tự chọn khi gặp mơ hồ (khuôn "chọn đơn giản nhất")

1. **Không đặt tên menu gộp "⋯" là "Bố cục"** dù phiếu gợi ý — vì nút "Thiết kế" (mở kệ mẫu) đã
   được 1 comment 07/08 trong chính file gọi là "Bố cục" chính thức. Trùng tên 2 nút khác nhau
   trên 1 toolbar là đúng loại rối đang sửa (F1). Chọn "⋯" — phiếu cho phép ("Bố cục" **hoặc**
   menu "⋯").
2. **TaskFirstStart thay hẳn M-EMPTY-2** (không giữ song song 2 empty-state) — cả hai đều là
   "canvas trống, gợi ý bước tiếp", giữ hai bản chỉ gây rối thêm. "Tạo từ ảnh đã dựng" của bản cũ
   được giữ lại làm lối phụ, không mất năng lực.
3. **`taskFirstDismissedId` là state cục bộ (RAM), không lưu vào Deck** — đơn giản nhất, không
   cần thêm field vào `EditorSlide`/`.idfp`; hệ quả duy nhất: refresh trang thì 1 slide trống lại
   hiện TaskFirstStart lần nữa — chấp nhận được, vì lúc đó đúng là chưa có gì để mất.
4. **Toast học-gu KHÔNG thêm cơ chế nhớ theo ngày/tài khoản mới** — tái dùng nguyên `guFreshStart`
   đã có, chỉ đổi vỏ hiển thị. Ít rủi ro nhất, đúng phạm vi ticket (không thêm tính năng).
5. **`hasInspectorContent` không tự đổi `inspectorOpen`** — chọn gate hiển thị thuần suy diễn
   thay vì mutate state đã lưu, để không đá vào lựa chọn thu/mở panel người dùng đã tự đặt.

## ④ CHƯA LÀM / còn treo

1. Toast học-gu (③) xác nhận đúng bằng ĐỌC CODE + tsc, **chưa bắt được bằng mắt trên browser**:
   điều kiện `guFreshStart` phụ thuộc `presentTemplateModelKey(userId)` — trong phiên verify,
   `storeUserId` không resolve kịp ở route test (`modelKey` null → nhánh set `guFreshStart` không
   chạy, y hệt hành vi TRƯỚC khi sửa). Không phải hồi quy do ticket này — cùng gate với bản gốc.
2. Chưa dọn nợ registry `luong-theo-viec` (tầng 2, "chuẩn LUỒNG THEO VIỆC toàn app") — đúng như
   phiếu ghi, đó là việc đợt sau, ngoài phạm vi sửa nóng này.
3. Radius: dùng `var(--r-2, 10px)`/`var(--r-3, 14px)` (đọc theo thang §12/08 trong `globals.css`,
   không sửa file đó — ngoài VÙNG) cho UI mới (popover/menu row); phần code gốc không đụng (nút
   `Btn`/`IconOnly` vẫn `borderRadius:10` như cũ, không nằm trong 4 việc được giao).

## ⑤ Nghiệm thu (lệnh dán nguyên văn)

```
npx tsc --noEmit
# → không lỗi (exit 0)

grep -rn "TaskFirstStart" components/present-editor
# → 8 chỗ (Toolbar.tsx handle + PresentEditor.tsx state/JSX/marker)

for f in lib/present-editor/*.test.ts; do node_modules/.bin/sucrase-node "$f"; done
# → 42/42 file pass, 0 fail (không hồi quy — không sửa lib/, chỉ components/)
```

### Verify browser THẬT (server sẵn có cổng 3000, project `cmsl4b5ux0001w9jlrgo2q41t`)
- Toolbar: nút "Hình" mở popover đúng 6 nút (rect/ellipse/triangle/polygon/arrow/line, width 168).
- Toolbar: nút "⋯" (title `"Thêm — Sắp xếp · Brand Kit · Khổ trình bày · Xem lưới"`) mở menu 4
  dòng đúng nhãn; bấm dòng "Sắp xếp" → menu 4 dòng đóng, mở đúng popover 14 nút Sắp xếp cũ.
- Tạo "Hồ sơ 2" mới (qua UI, "Tạo hồ sơ trống") → canvas hiện đúng TaskFirstStart: tiêu đề "Bắt
  đầu hồ sơ trình khách", 3 nút "Nhập tệp / Dàn từ mẫu / Trang trống" + dòng phụ "Hoặc tạo từ ảnh
  đã dựng"; đồng thời cột phải chỉ còn nút "Hiện panel Lớp" (thu gọn) — đúng thiết kế.
- Bấm "Trang trống" → TaskFirstStart biến mất, cột phải VẪN thu gọn (slide còn 0 phần tử, đúng).
- Bấm "Thêm chữ" (thêm 1 element) → cột phải TỰ MỞ LẠI ("Ẩn panel Lớp" xuất hiện) — không cần
  người dùng tự bấm mở, đúng hasInspectorContent.
- Dọn sạch: đóng "Hồ sơ 2" test sau khi verify — project trở lại đúng trạng thái ban đầu ("Hồ sơ 1"
  duy nhất, 3 slide, không có element chữ test nào sót lại).

## ⑥ Danh sách file đã sửa

| File | Loại | Ghi chú |
|---|---|---|
| `components/present-editor/Toolbar.tsx` | SỬA | `forwardRef`+`ToolbarHandle`, gộp "Hình"+"⋯", đổi tên `ArrangePopover`→`AnchoredPopover`, thêm `MenuRow` |
| `components/present-editor/PresentEditor.tsx` | SỬA | `TaskFirstStart` (thay M-EMPTY-2), `hasInspectorContent`, `toolbarRef`, `TaskFirstBtn` |
| `components/present-editor/LayoutShelf.tsx` | SỬA | banner học-gu → toast portal tự tắt 6s |

## ⑦ Đề xuất 3 việc tiếp theo

1. Verify toast học-gu (③) bằng mắt trong 1 phiên có `storeUserId` resolve sẵn (vd sau login đầy
   đủ, không phải route test nguội) — xác nhận vị trí/độ dễ đọc trên nền thật.
2. Mở phiếu `luong-theo-viec` (tầng 2 đã ghi trong F1) — áp mẫu "lối vào theo việc" của
   TaskFirstStart sang 2D/3D nếu Hoà thấy đúng hướng.
3. Dọn nợ radius: đưa `Btn`/`IconOnly` (Toolbar.tsx, đang `borderRadius:10` hardcode) về
   `var(--r-2)` cho nhất quán với popover/menu mới thêm — việc nhỏ, ngoài phạm vi 4 sửa lần này.
