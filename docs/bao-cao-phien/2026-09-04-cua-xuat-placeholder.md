# 04/09 · Lane 07 RELEASE — đóng F1 (placeholder lọt vào hồ sơ giao khách)

Mốc: `5cb4db6c` (ff-only từ `origin/integration/2026-09-04`, lệch 192 → 0).

---

## ⓪ TIỀN ĐỀ — xác nhận 4/4, kèm 2 đính chính

| Phiếu nói | Đo được | Kết |
|---|---|---|
| `model.ts:654` `makeText()` trả `text: 'Nhập nội dung'` | ĐÚNG y dòng (sau khi ff-only lên `5cb4db6c`) | ✅ |
| Là giá trị mặc định trong MODEL, không phải chữ mờ lúc hiển thị | ĐÚNG — nằm trong object trả về, đi thẳng vào `EditorSlide.elements` | ✅ |
| `grep "Nhập nội dung"` ngoài `model.ts` = 0 | ĐÚNG — 1 hit duy nhất toàn repo | ✅ |
| Trái `CHUAN-DAU-RA-NGHE.md` §4 | ĐÚNG — `:59` *"0 placeholder sót"*; và §6.1 `:68` còn **liệt kê đích danh "placeholder sót"** là việc của tầng máy-chặn | ✅ |

**Đính chính 1 — đường dẫn cổng xuất.** Phiếu ghi vùng ghi là `lib/cad/export-checks*`. **Đường đó không tồn tại.** Cổng thật là `lib/print/export-checks.ts` — đúng chỗ `CHUAN-DAU-RA-NGHE §6.1` chỉ định (*"mở rộng `lib/print/export-checks.ts` đã có"*).

**Đính chính 2 — mốc.** Phiếu ghi HEAD phải là `5cb4db6c`; HEAD thật lúc nhận việc là `f43de304` (192 commit sau lưng, cây sạch, `merge-base --is-ancestor` rc=0) ⇒ đủ điều kiện ⓪b, đã `merge --ff-only` lên đúng `5cb4db6c` rồi mới làm.

**Ai thật sự chạm đường này** (đo, không suy): **61/61** lời gọi `makeText` trong `templates.ts` đều truyền `text` tường minh ⇒ mặc định **không** rò qua template. Đường rò duy nhất là **người dùng bấm "Thêm chữ"** — `PresentEditor.tsx:584` `onAddText` → `makeText({...})` không có `text` → nếu không gõ gì thì in thẳng vào PDF. Đúng ca F1 lane G2 mở file thấy.

---

## ① Luật cắm vào đâu — EXTEND, không dựng mới

- **`lib/present-editor/model.ts:649`** — tách hằng số `DEFAULT_TEXT_CONTENT = 'Nhập nội dung'`; `makeText()` dùng nó. **Giá trị KHÔNG đổi** (đúng ③ của phiếu: không để mặc định rỗng).
- **`lib/present-editor/export-checks.ts`** (mới) — `buildDeckChuanDauRaChecks(deck)`. **REUSE hợp đồng đã có**: import `ChuanDauRaFinding` + marker `CHUAN_DAU_RA` từ `lib/print/export-checks`. Đọc chữ mặc định **từ `model.ts`**, không khoá cứng chuỗi.
- **`components/present-editor/PresentEditor.tsx:1489`** — `quaCongChuanDauRa()` cắm vào **3 cửa xuất**: `onExportPdf` · `onExportPptx` · `onExportPrint300`.

**Vì sao là tệp mới chứ không nhét vào `lib/print/export-checks.ts` (bằng chứng phủ định, §B25):**
1. `buildChuanDauRaChecks()` nhận `Doc` của CAD (entities · layers · khổ giấy). Deck là `EditorDeck` (slides · elements) — **hai mô hình dữ liệu khác hẳn**, không ép chung một chữ ký hàm.
2. Nhét hàm deck vào `lib/print/` buộc tệp đó import `lib/present-editor/model` ⇒ kéo trọn model Present vào gói xuất PDF của CAD (`ExportPdfDialog`) — thêm phụ thuộc chéo cho một việc thuần kiểm.
3. ⇒ **CONNECT, không phải NEW**: 0 khái niệm mới, 0 marker thứ hai, dùng lại đúng `ChuanDauRaFinding`. Test khoá `CHUAN_DAU_RA === 'CHUAN_DAU_RA'` để không ai đẻ marker riêng.

---

## ② Người dùng thấy gì — chép đúng câu chữ

Deck có 1 ô chữ chưa sửa ở trang 2, bấm **Xuất PDF**:

```
Hồ sơ còn nội dung mẫu chưa sửa:

• Trang 2: 1 ô chữ còn nội dung mẫu
  → Mở trang 2, nhập nội dung hoặc xoá ô chữ đó

Sửa xong hãy xuất — hoặc bấm OK để xuất luôn.
```

Bấm **Huỷ** → dừng, toast: `Đã dừng — sửa ô chữ còn nội dung mẫu rồi xuất lại.`
Bấm **OK** → **vẫn xuất** (người dùng cố ý thì cho đi — human-in-the-loop `[T5]`).

- Nói rõ **TRANG NÀO · MẤY Ô · CÁCH SỬA**; gộp theo trang (không bắn danh sách id máy).
- Nhãn ≤12 từ, hành động trước, không jargon (`SPEC-NGON-NGU-CHI-DAN`).
- Mức `'error'` = **màu đỏ, KHÔNG chặn** — đúng quy ước đang chạy: `ExportPdfDialog.tsx:384` chỉ dùng `level` để chọn `--danger` ↔ `--warn`, nút xuất **không hề bị khoá**. Nên "error" ở đây không mâu thuẫn với "không chặn tuyệt đối".
- **Không tự xoá nội dung người dùng** — hàm chỉ đọc và trả phát hiện, cùng kỷ luật `lib/cad/standards/checker.ts`.

---

## ③ Hiệu chuẩn — gỡ luật ⇒ ĐỎ, cắm luật ⇒ XANH

Cắm `if (slides) return findings;` vào đầu `buildDeckChuanDauRaChecks` (mô phỏng gỡ luật):

```
ERR_ASSERTION  actual: 0  expected: 1
```

đỏ ngay ca 1 (*"ô chữ mới tạo → bị bắt"*). Khôi phục ⇒ **10/10 pass**.

10 ca khoá: bắt ô chưa sửa (mức · trang · cách sửa) · gộp nhiều ô một trang · nhiều trang · **ô đã gõ thì đi qua** · deck rỗng/không chữ/chỉ hình → sạch · ô ẩn hoặc `opacity 0` **không báo oan** · chỉ khác khoảng trắng vẫn là chưa sửa · luật đọc hằng số chung (không gõ cứng chuỗi) · marker dùng lại của `lib/print`.

**Máy kiểm** (chạy tách, đọc rc riêng): `tsc` **0** · `npm test` **0 fail** · `soi:frontier` **rc 0, 0 lệch** · `git status --short` rỗng trước khi commit.

---

## ④ F3 · 300 dpi — KHÔNG SỬA, và **tiền đề của phiếu SAI**

Phiếu ghi: *"hàm `exportDeckToPdfAtPaperSize` … chưa hành trình nào chạm"* và *"chỉ có một nút 'Xuất PDF' âm thầm chọn hộ"*. **Đo được: sai cả hai vế.**

| | Đo được |
|---|---|
| Đường in có được gọi không | **CÓ** — `Toolbar.tsx:645` `onSelect: p.onExportPrint300` → `PresentEditor.tsx:1571` → `exportDeckToPdfAtPaperSize(ed.deck, 300, {tier})` |
| Người dùng có thấy hai đường khác nhau không | **CÓ, tách bạch** — `:628` mục **"PDF"** (*1:1 với editor · khổ màn hình/chiếu*) ↔ `:642` mục **"PDF in 300dpi (A3/A4)"** (*chữ/hình khối + ảnh đủ nguồn đạt 300dpi thật*). Hai mục riêng, nhãn tự nói, không có nút nào chọn hộ. |
| Nút giả khi deck 16:9 | **KHÔNG** — `:646` `disabled: !printReady` (`PresentEditor.tsx:562` tính từ `PAPER_SIZE_MM[stagePreset]`) + `disabledReason` *"Chỉ xuất được ở khổ giấy A4/A3 — đổi khổ trong 'Khổ trình bày' trước (16:9 là khổ màn hình, không phải khổ in)"* ⇒ đúng luật §9 nút-mờ-kèm-lý-do |

⇒ **Không có việc để sửa ở F3.** Ràng buộc còn lại là **thiết kế, không phải lỗi**: deck 16:9 không xuất 300 dpi được — và app đã nói thẳng điều đó bằng nút mờ + lý do, thay vì xuất ra file thiếu dpi. Nợ thật duy nhất còn treo ở đường này đã được chính JSDoc khai từ trước: **ảnh hero/nền chưa đạt dpi nguồn** (P3 phần 2) — nằm ngoài phiếu này.

---

## ⑦b CHƯA CHẮC / CHƯA KIỂM

- **Chưa mở app thật một lần nào.** Phiếu cho phép dev server 3093 nhưng cổng này thuần logic + một `window.confirm`; mọi kết luận về câu chữ hiển thị là **đọc mã**, không phải nhìn màn. Chưa ai xác nhận confirm hiện đúng xuống dòng trên Electron.
- **Chưa mở tệp PDF đầu ra** để xác nhận chuỗi `Nhập nội dung` biến mất — luật nghiệm thu 11/08 (*frontier sinh file xuất được thì nghiệm thu = MỞ FILE*) **chưa thi hành** ở lượt này. Cổng chặn ở tầng trước khi dựng PDF nên suy ra là hợp lý, nhưng **suy ra không phải đo**.
- **Chỉ bắt đúng một loại placeholder**: giá trị mặc định của `makeText`. §4 còn liệt `{{ }}` · lorem · `"Untitled"` · ảnh xám mẫu — **chưa bắt cái nào**. Đây là sàn, không phải trần.
- **`makeImage`/`makeShape` chưa soi**: `makeImage` nhận `src` bắt buộc nên không có mặc định rỗng; `makeShape` không mang chữ. Đã đọc, chưa test.
- **Ba cửa xuất, không phải mọi cửa**: PDF · PPTX · PDF-300dpi có cổng. **PNG (`onExportPng`) · Gói Hồ Sơ `.zip` · `.idfp` KHÔNG có** — chọn có ý thức (PNG/zip/idfp không phải "hồ sơ giao khách" theo nghĩa §4), nhưng chưa ai chốt ranh giới đó thành luật.
- **Vùng ghi lệch phiếu**: `components/present-editor/PresentEditor.tsx` không nằm trong ô ĐƯỢC GHI (phiếu ghi `lib/cad/export-checks*` — đường không tồn tại) và cũng không nằm trong ô CẤM. Đã sửa **3 dòng guard + 1 import + 3 dep array**. Lý do phải chạm: cổng không ai nhìn thấy thì đúng bằng *"dòng kiểm bịa sẵn"* mà chính `export-checks.ts:5` cảnh báo. Ba lane song song không ai giữ `present-editor`, đã kiểm.

## ⑦c HẠN DÙNG KẾT LUẬN

- Số dòng (`model.ts:654` · `Toolbar.tsx:642-646` · `ExportPdfDialog.tsx:384`) đúng tại **`5cb4db6c`**; hết hạn ngay khi các tệp đó đổi.
- Kết luận *"level `error` không chặn"* phụ thuộc `ExportPdfDialog` giữ nguyên cách dùng `level` **chỉ để chọn màu**. Ai cho `level` khoá nút xuất thì mức của luật này phải xét lại (đổi sang `warn`).
- Kết luận F3 *"không có việc để sửa"* hết hạn nếu bỏ `disabled: !printReady` hoặc gộp hai mục menu làm một.
- Câu *"61/61 template truyền `text` tường minh"* hết hạn khi thêm template mới — cổng vẫn bắt được, nhưng lúc đó placeholder sẽ **do template đẻ ra**, tức lỗi nặng hơn F1.
