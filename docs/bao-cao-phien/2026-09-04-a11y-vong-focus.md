# 04/09 — A11y vòng focus bàn phím: đo thật ra **8 lỗ**, không phải 32

> Câu hỏi phiếu: *người dùng Tab tới phần tử trong 32 tệp đó có THẤY vòng focus không?*
> Trả lời: **24 tệp CÓ thấy · 8 tệp KHÔNG**. Máy soi gộp ba cơ chế khác hẳn nhau vào một rọ.

---

## 1 · ⓪ TIỀN ĐỀ — xác nhận cả ba

| # | Giả định | Phán | Bằng chứng |
|---|---|---|---|
| 1 | `app/globals.css:435` có luật `:where(...):focus-visible` | ✅ ĐÚNG | `grep -n focus-visible app/globals.css` → `435:` đúng selector, `outline: var(--stroke-focus) solid var(--focus-ring)` |
| 2 | 32 tệp có `outline:none`/`outline-none` mà thiếu `focus-visible` | ✅ ĐÚNG số, ❌ **SAI Ý NGHĨA** | lệnh grep của phiếu trả đúng **32**; nhưng xem §2 — 24/32 không phải lỗ |
| 3 | HEAD không lệch, cây sạch | ✅ ĐÚNG lúc mở | `8d631056` · `git status --short` rỗng · nhánh `integration/2026-09-04` |

⚠️ Tiền đề 2 **đúng chữ, sai ý**: nó ngầm định "có `outline-none` = mất ring". Phép đo bác bỏ điều đó.

---

## 2 · KẾT QUẢ ĐO — Chromium thật, không suy từ đặc hiệu

**Cách đo.** Trang HTML tĩnh nạp **CSS bundle THẬT của Next** (`.next/static/css/a805bf6b4c7a46e4.css`
— chứa cả Tailwind utilities lẫn luật globals, đúng thứ tự thật), Chromium
`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, focus **bằng phím Tab**, đọc
`getComputedStyle(el).outlineWidth/outlineStyle/outlineColor`.

### Số thật

| Cơ chế | Đặc hiệu | `outlineWidth` | `outlineStyle` | `outlineColor` | Người dùng THẤY? |
|---|---|---|---|---|---|
| *(đối chứng)* `<button>` trơn | — | `2px` | `solid` | `rgb(106,87,245)` | ✅ |
| class `outline-none` | 0-1-0 | `2px` | `solid` | `rgb(106,87,245)` | ✅ **THẤY** |
| `[tabindex]` + `outline-none` | 0-1-0 | `2px` | `solid` | `rgb(106,87,245)` | ✅ |
| `<input>` + `outline-none` | 0-1-0 | `2px` | `solid` | `rgb(106,87,245)` | ✅ |
| **`focus:outline-none`** | **0-2-0** | `2px` | `solid` | **`rgba(0,0,0,0)`** | ❌ **MẤT** |
| **CSS `outline:none` trong chuỗi/inline** | 0-1-1 hoặc sau về thứ tự | **`0px`** | **`none`** | — | ❌ **MẤT** |

### Kết luận một câu

> **`outline-none` (class) KHÔNG thắng luật toàn app — ring vẫn hiện. Chỉ `focus:outline-none` và
> `outline:none` viết thẳng trong CSS/inline mới giết ring.**

### Vì sao — và chỗ mong manh phải ghi lại

- Tailwind **v3** (`tailwindcss ^3.4.1`) định nghĩa `.outline-none{outline:2px solid transparent;outline-offset:2px}`
  — **không phải** `outline:none`. Nó không xoá outline, nó làm outline **trong suốt**.
- `.outline-none` = **0-1-0**. Luật globals `:where(...):focus-visible` cũng **0-1-0** (`:where()` cho 0,
  `:focus-visible` là pseudo-class = 1 class). **Hoà specificity ⇒ thứ tự quyết định.**
- `app/globals.css` mở đầu bằng `@tailwind utilities` rồi mới tới luật focus ⇒ trong bundle thật
  `.outline-none` ở **byte 37.724**, luật focus ở **byte 47.057** ⇒ **globals đứng SAU ⇒ globals thắng.**
- 🔴 **Thế cân bằng này dựa vào THỨ TỰ, không phải đặc hiệu.** Đảo `@tailwind utilities` xuống cuối,
  hoặc lên **Tailwind v4** (utilities vào `@layer`, thua mọi thứ ngoài layer), là **24 tệp kia thành lỗ
  thật ngay trong một lần nâng phiên bản**. Đã ghi cảnh báo này vào chú thích registry.
- `focus:outline-none` = `.focus\:outline-none:focus` = **0-2-0** ⇒ **thắng** globals ⇒ outline trong suốt.

---

## 3 · QUYẾT ĐỊNH — làm CẢ HAI, vì số liệu chỉ ra hai bệnh khác nhau

Phiếu cho hai đường: sửa tệp, hoặc sửa máy soi. Phép đo nói **cả hai đều đúng, cho hai tập khác nhau**.

| | Việc | Vì sao |
|---|---|---|
| **A** | **Sửa 8 tệp lỗ thật** | Đo được là mất ring. Đây là lỗ WCAG 2.4.7 sống. |
| **B** | **Thu hẹp máy soi** | 24/32 là **báo nhầm**. Báo nhầm 75% là cách nhanh nhất giết một máy soi — người ta học cách bỏ qua nó. |

⛔ **KHÔNG làm** phần "NHÓM A (19 tệp): đổi `focus:` → `focus-visible:`" của phiếu.
Lý do: 13 trong 19 tệp đó dùng `focus:border-…` **cạnh** một `outline-none` vô hại ⇒ ring accent
**đã hiện**. Đổi `focus:`→`focus-visible:` ở đó **không thêm một chút trợ năng nào**, chỉ **đổi hình
lúc bấm chuột** — tức là việc THỊ GIÁC, đúng thứ phiếu cấm ("Đây là việc TRỢ NĂNG, không phải việc thị giác").
6 tệp còn lại của nhóm A **là lỗ thật** và đã sửa (chúng dùng `focus:outline-none`).

🔴 **Trục phân nhóm của phiếu (có `focus:` hay không) là SAI TRỤC.** Trục đúng là **cơ chế**.
Bằng chứng: nhóm B của phiếu (13 tệp, gọi là "lỗ thật") hoá ra **11 tệp không phải lỗ**; còn nhóm A
(gọi là "đã có affordance") lại **chứa 6 lỗ thật**.

---

## 4 · ĐÃ SỬA GÌ

### A · Tám tệp lỗ thật

| Tệp | Cơ chế giết ring | Cách sửa | Số chỗ |
|---|---|---|---|
| `components/SearchProjectsInput.tsx` | `focus:outline-none` | **gỡ** class → ring toàn app nhận việc | 1 |
| `components/render-studio/LevelManagerPanel.tsx` | `focus:outline-none` | gỡ | 2 |
| `components/render-studio/LightTab.tsx` | `focus:outline-none` | gỡ | 4 |
| `components/render-studio/NumberField.tsx` | `focus:outline-none` | gỡ | 1 |
| `components/render-studio/Object3DInspector.tsx` | `focus:outline-none` | gỡ | 1 |
| `components/render-studio/WallTypePanel3D.tsx` | `focus:outline-none` | gỡ | 2 |
| `components/library/gallery-css.ts` | CSS `.gal-search input{outline:none}` (0-1-1) · `.gal-source-row input{…outline:none}` | **thêm `:focus-visible`** dùng token | 2 |
| `components/project-init/ProjectInitBoard.tsx` | CSS `.pib-input,.pib-select{…outline:none}` | thêm `:focus-visible` dùng token | 1 |

**Vì sao GỠ chứ không đổi thành `focus-visible:outline-none`:** đổi thế vẫn giết ring lúc gõ phím.
Gỡ hẳn thì globals lo trọn cả hai chiều — bàn phím có ring, chuột không có
(`:focus:not(:focus-visible){outline:none}` đã có sẵn ở `globals.css:439`).

**Màu/độ dày:** 100% token `var(--stroke-focus)` + `var(--focus-ring)`. **0 hex, 0 màu tự chế.**
`.gal-search input` dùng **ring TRONG** (`outline-offset: calc(-1 * var(--stroke-focus))`) theo đúng
khuôn `.if-focus-inset` của globals, vì input cao bằng vỏ pill — ring ngoài sẽ đè viền vỏ.

**Đo lại sau khi sửa** (cùng phương pháp, dùng **chuỗi className THẬT** lấy bằng `sed` từ tệp, và
**`GALLERY_CSS` xuất thật** import từ module, không phải bản dựng lại):

| Phần tử | Trước | Sau |
|---|---|---|
| `NumberField` | `2px solid rgba(0,0,0,0)` | **`2px solid rgb(106,87,245)`** |
| `SearchProjectsInput` | `2px solid rgba(0,0,0,0)` | **`2px solid rgb(106,87,245)`** |
| `.gal-search input` | `0px none` | **`2px solid rgb(106,87,245)`** (offset −2px) |
| `.gal-source-row input` | `0px none` | **`2px solid rgb(106,87,245)`** |
| `.pib-input` / `.pib-select` | `0px none` | **`2px solid rgb(106,87,245)`** |

### B · Máy soi `scripts/thao-tac-registry.mjs`

```
cũ :  outline:\s*none|outline-none
mới:  [\w-]+:outline-none|outline:\s*['"`]?none
```
Nhánh 1 bắt **mọi biến thể có tiền tố** (`focus:`, `sm:focus:`…) — thứ đặc hiệu 0-2-0 thắng globals.
Nhánh 2 bắt **khai báo CSS thật** (chuỗi CSS lẫn `style={{ outline: 'none' }}`).
Class `outline-none` trần **không còn bị soi**.
Kèm **chú thích 14 dòng** ghi lại số đo, lý do, và **hai cảnh báo** (thứ tự bundle · `mauThieu` xét theo tệp)
— để phiên sau không nới lại vì tưởng mẫu bị siết ẩu.

**Tự kiểm mẫu mới bằng 8 ca** (`node rex.mjs`): `outline-none` trần → skip · `focus:outline-none` → match ·
`sm:focus:outline-none` → match · `.x input{outline:none}` → match · `outline: 'none',` → match ·
`outline: none; }` → match · `focus-visible:outline-none` → match · `className="w-full outline-none"` → skip. **8/8 đúng.**

---

## 5 · NGHIỆM THU

| Cổng | Trước | Sau | |
|---|---|---|---|
| `npx tsc --noEmit` | 0 lỗi | **0 lỗi** | ✅ |
| `npm test` | — | **136 tệp test · 0 fail · exit 0** | ✅ |
| `soi:thao-tac` — số **lệch** | **2** | **2** | ➖ giữ nguyên |
| `soi:thao-tac` — số tệp luật `outline-can-focus-visible` | **32** | **21** | ✅ −11 |
| `soi:hinh-hoc` | 37 ngoài thang | **37 ngoài thang** | ➖ 8 tệp tôi sửa **không** xuất hiện |
| `soi:tu-dien` | 322 chỗ chữ trần | **322 chỗ** | ➖ 8 tệp tôi sửa **không** xuất hiện |

**Vì sao lệch vẫn là 2, không phải 1:** luật `outline-can-focus-visible` **vẫn đỏ**, nhưng nay đỏ vì
**21 tệp KHÁC** — đều dùng `style={{ outline: 'none' }}` inline thật (`CommentLayer` · `FlowCanvas` ·
`CadCanvas` · `TaskBoardScreen` · `Viewport3D` …). **Đó là lỗ thật, nằm NGOÀI `FILES_ALLOWED`** nên
tôi không đụng. Xem §7.

**Chứng minh máy soi vẫn bắt được** (cắm rồi gỡ):
cắm `focus:outline-none` vào `NumberField.tsx` → **21 → 22 tệp**; gỡ ra → **22 → 21**.
Tệp đã khôi phục nguyên trạng (`grep -c focus:outline-none` = 0).

**Chứng minh hai máy soi kia không tệ đi bằng SỐ, không bằng lời:** trích toàn bộ 41 dòng THÊM của diff
→ `grep` các từ đa nghĩa (`card|thẻ|khối|nấc|lớp|tầng|kính|module`) = **0**; `border-radius` mới = **0**;
`rounded-[…]` ở dòng xoá và dòng thêm **trùng khít** (3× `10px`, 7× `6px`) ⇒ radius không đổi một giá trị nào.

---

## 6 · CHƯA CHẮC / CHƯA KIỂM

1. 🔴 **Chưa mở app Next thật.** Đo trên trang tĩnh nạp **đúng bundle CSS đã build**, nhưng bundle đó
   là bản build sẵn trong `.next/` — **nếu ai đó đổi thứ tự `@tailwind` trong `globals.css` rồi build
   lại, kết luận §2 đổi theo.** Đây là giả định mong manh nhất của cả báo cáo.
2. 🔴 **Ring có bị cắt không — CHƯA BIẾT.** 10 chỗ đã gỡ `focus:outline-none` đều nằm trong panel hẹp
   của render-studio. `outline-offset: 2px` vẽ **ra ngoài** phần tử; nếu cha có `overflow:hidden` thì
   ring bị xén. Globals có sẵn `.if-focus-inset` cho ca này, **tôi chưa cắm** vì chưa dựng được app để
   nhìn. **Cần mắt kiểm 6 tệp render-studio.**
3. ⚠️ **Ring nay cũng hiện khi BẤM CHUỘT ở 10 chỗ đã sửa** — đo được: `<button>` bấm chuột **không**
   khớp `:focus-visible` (`0px none`), nhưng `<input>`/`<select>` **luôn khớp** (`2px solid`), đó là
   hành vi chuẩn của Chromium cho ô nhập chữ. **Cả 10 chỗ tôi sửa đều là `<input>`/`<select>`** ⇒ chúng
   nay giống hệt mọi ô nhập khác trong app (24 tệp `outline-none` trần vốn đã hiện ring khi bấm).
   Tức là **nhất quán hơn trước**, nhưng vẫn là **một thay đổi nhìn thấy được** — xin ghi vào lô duyệt mắt.
4. **Chỉ đo Chromium 1194.** Safari/Firefox là **suy**, không phải đo. `:focus-visible` cho ô nhập
   chữ có khác biệt giữa các máy duyệt.
5. **Chưa thử trình đọc màn hình.** Vòng focus là kênh **thị giác**; báo cáo này không nói gì về
   nhãn/announce.
6. **Chưa đo tương phản của ring so với nền thật** ở 8 tệp. `--focus-ring` = accent đặc — token đã
   được chọn cho việc này (chú thích globals ghi rõ ring alpha .55 chỉ ~2:1 nên mới dùng accent đặc),
   nhưng **tôi không tự đo lại** trên nền `--panel`/`--field` của từng panel.
7. **Con số 21 là SÀN, không phải TRẦN** — xem §7 lý do.

---

## 7 · PHÁT HIỆN NGOÀI PHẠM VI

### 7.1 🔴 Máy soi xét theo TỆP nên bỏ lọt lỗ thật — số 21 là sàn
`mauThieu: 'focus-visible'` miễn trừ **cả tệp** nếu tệp có chữ `focus-visible` ở **bất kỳ đâu**.
Hệ quả: tệp vừa **tự dựng ring cho vật A** vừa **giết ring của vật B** thì **lọt sạch**. Ca thật đo được:

| Tệp | Dòng lọt | Nội dung |
|---|---|---|
| `components/three/ve3d-css.ts:34` | `.if-ve3d .search input{…outline:none}` | ô tìm, **không ring** — nhưng tệp có 8 chỗ `:focus-visible` khác nên được miễn cả tệp |
| `components/three/ve3d-css.ts:105` | `.if-ve3d .fld input{…outline:none}` | như trên |
| `components/library/library-sheet-css.ts:101` | `.if-lib-root .srch input{…outline:none}` | như trên |
| `components/filemanager/files-mock-css.ts:89` | `.if-files-app .searchbox input{…outline:none}` | như trên |
| `components/dna/inspiration-css.ts:19` | `.ins-search input{…outline:none}` | như trên |

⇒ Muốn hết lọt thì luật phải chuyển từ **tệp** sang **dòng** (soi theo occurrence, mỗi `outline:none`
phải có `:focus-visible` cho **cùng selector**). Đó là một phiếu riêng — **tôi không tự mở rộng.**

### 7.2 🔴 21 tệp lỗ thật ngoài `FILES_ALLOWED`
`CommentLayer` · `FlowCanvas` · `ShortcutsPanel` · `cad/AiBriefPanel` · `cad/CadCanvas` · `cad/CadEditor` ·
`collab/BaHoiStorylineForm` · `colors/ColorImportWizard` · `colors/ColorLibraryScreen` · `colors/ColorMatchPanel` ·
`materials/MaterialsScreen` · `notebook/NotebookChatPanel` · `notebook/NotebookSourcesSidebar` ·
`present-editor/EditorCanvas` · `present-editor/boq/BoqTable` · `render-studio/Tool3DBar` ·
`studio/SheetTabBar` · `studio/StatusBar` · `studio/VitalsGesture` · `tasks/TaskBoardScreen` · `three/Viewport3D`.
Tất cả dùng `style={{ outline: 'none' }}` **inline** — inline thắng **mọi** selector, không có đường
nào cứu bằng CSS. Phải sửa tại chỗ. **Đề nghị một phiếu kế tiếp.**
⚠️ `present-editor/boq/BoqTable.tsx:228` đáng chú ý nhất: `<div tabIndex={0} onKeyDown={…} outline:'none'>` —
một **bảng điều khiển hoàn toàn bằng bàn phím** mà **không có dấu focus nào**.

### 7.3 ⚠️ `components/ProjectSelect.tsx` — chưa kiểm
Có `focus:outline-none` (cơ chế giết ring) nhưng **không** nằm trong 32 tệp vì tệp có chữ `focus-visible`
ở chỗ khác. **Chưa mở ra xem ring thay thế có đúng chỗ không.**

### 7.4 ⚠️ Bẫy đã sập một lần: backtick trong chú thích CSS
Hai tệp CSS của IF viết CSS trong **template literal**. Tôi viết chú thích có dấu ` `` ` (trích tên
selector) → **đóng sớm template literal** → `tsc` đỏ 5 lỗi. Đã sửa (dùng nháy kép).
📌 **Luật rút ra: trong `*-css.ts` cấm dùng backtick trong chú thích.** Và: bài kiểm của tôi ban đầu
**trích mảnh CSS bằng cách lọc dòng** nên nó **xác nhận CSS đúng mà không hề chạm tới lỗi cú pháp TS**
— chỉ `tsc` mới bắt được. Đo đúng một tầng không có nghĩa là tầng kia lành.

### 7.5 ℹ️ HEAD đổi giữa lượt
Mở phiên ở `8d631056`, kết ở `d563ba3d` — MAIN đã gom thay đổi của tôi vào commit
`d563ba3d` trong lúc tôi chạy nghiệm thu. Đã xác minh **toàn bộ 9 tệp còn nguyên** sau commit
(`focus:outline-none` = 0 · ring mới còn · chú thích registry còn). Tôi **không** commit, **không** push.
