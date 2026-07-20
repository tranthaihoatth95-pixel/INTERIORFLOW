# NGHIÊN CỨU · Mở file Office thật (PPTX/Keynote/Word) để chỉnh tiếp + Bảng tính Excel thật — InteriorFlow

> **Trạng thái: ĐỀ XUẤT, CHƯA THỰC THI.** Tài liệu này KHÔNG kèm thay đổi code/dependency nào.
> Mọi khối code bên dưới là **mẫu minh hoạ**, chưa áp vào repo. `package.json` KHÔNG bị sửa.
>
> Nhánh: `feat/research-office-file-interop` · Ngày: 2026-07-21 · Mọi khẳng định về code đã verify
> bằng đọc file thật (đường dẫn + số dòng trích dẫn trực tiếp) hoặc bằng lệnh `grep`/`find` thật
> trong repo chính (`/Users/tranben/Downloads/interiorflow`) + `node_modules` đã cài, không đoán
> tên thư viện.

## Mục lục

0. [Tóm tắt cho người bận](#0-tóm-tắt-cho-người-bận)
1. [Hiện trạng đã verify](#1-hiện-trạng-đã-verify)
   - 1.1 [`lib/pptx.ts` — xuất 1 chiều, `pptxgenjs` không có API đọc](#11-libpptxts--xuất-1-chiều-pptxgenjs-không-có-api-đọc)
   - 1.2 [🟢 Phát hiện quan trọng nhất — UI đã có sẵn 1 mục menu STUB cho đúng tính năng này](#12--phát-hiện-quan-trọng-nhất--ui-đã-có-sẵn-1-mục-menu-stub-cho-đúng-tính-năng-này)
   - 1.3 [Model `EditorSlide` — đích cần map nội dung vào](#13-model-editorslide--đích-cần-map-nội-dung-vào)
   - 1.4 [`content-deck.ts` — pipeline dàn text→slide ĐÃ CÓ, kể cả né bảng markdown](#14-content-deckts--pipeline-dàn-textslide-đã-có-kể-cả-né-bảng-markdown)
   - 1.5 [`pptxTemplate` — 1 field ma trong `GenerateFlow.tsx`](#15-pptxtemplate--1-field-ma-trong-generateflowtsx)
   - 1.6 [Tiền lệ đáng chú ý — CAD đã import DWG (nhị phân, đóng) qua WASM](#16-tiền-lệ-đáng-chú-ý--cad-đã-import-dwg-nhị-phân-đóng-qua-wasm)
   - 1.7 [Tiền lệ đáng chú ý #2 — `jszip` đã vá ruột 1 file `.pptx` thật](#17-tiền-lệ-đáng-chú-ý-2--jszip-đã-vá-ruột-1-file-pptx-thật)
   - 1.8 [Tiền lệ đáng chú ý #3 — route trích chữ PDF phía server](#18-tiền-lệ-đáng-chú-ý-3--route-trích-chữ-pdf-phía-server)
   - 1.9 [`package.json` — kiểm chứng đã có gì, chưa có gì](#19-packagejson--kiểm-chứng-đã-có-gì-chưa-có-gì)
   - 1.10 [Prisma schema — 0 model liên quan bảng tính/dự toán](#110-prisma-schema--0-model-liên-quan-bảng-tínhdự-toán)
   - 1.11 [Skill `du-toan-noi-that` — chỉ tồn tại NGOÀI repo, không có code trong app](#111-skill-du-toan-noi-that--chỉ-tồn-tại-ngoài-repo-không-có-code-trong-app)
2. [Đề xuất kiến trúc — tách 4 mảng](#2-đề-xuất-kiến-trúc--tách-4-mảng)
   - 2.1 [Mảng A · Import PPTX thật (.pptx) — khả thi nhất](#21-mảng-a--import-pptx-thật-pptx--khả-thi-nhất)
   - 2.2 [Mảng B · Import Keynote (.key) — KHÔNG khả thi trực tiếp](#22-mảng-b--import-keynote-key--không-khả-thi-trực-tiếp)
   - 2.3 [Mảng C · Import Word (.docx) — rẻ nhất, tái dùng gần 100%](#23-mảng-c--import-word-docx--rẻ-nhất-tái-dùng-gần-100)
   - 2.4 [Mảng D · Bảng tính Excel thật — tính năng MỚI, không phải import](#24-mảng-d--bảng-tính-excel-thật--tính-năng-mới-không-phải-import)
3. [Rủi ro & giới hạn](#3-rủi-ro--giới-hạn)
4. [Phân kỳ đề xuất](#4-phân-kỳ-đề-xuất)
5. [Đối chiếu với yêu cầu gốc](#5-đối-chiếu-với-yêu-cầu-gốc)
6. [Câu hỏi cần chủ dự án quyết](#6-câu-hỏi-cần-chủ-dự-án-quyết)

---

## 0. TÓM TẮT CHO NGƯỜI BẬN

**Đề bài xin 2 việc gộp chung ("mở file Office thật để sửa tiếp" + "bảng tính Excel thật"), nhưng
đây thực chất là 4 việc có độ khó và tính khả thi HOÀN TOÀN KHÁC NHAU — không nên gộp 1 kế hoạch.**

| # | Phát hiện | Mức |
|---|---|---|
| 1 | 🟢 **UI đã có sẵn 1 mục menu STUB đúng tên tính năng này**: `components/present-editor/Toolbar.tsx:115-122` — nút "Nhập" ở Presenting có mục `label: 'Mở deck (.pptx / .pdf)'`, `disabled: true`, `disabledReason: 'Chưa hỗ trợ mở lại file deck — Present hiện chỉ nhập ảnh'`. Team trước đã DỰ TRÙ chỗ cắm cho đúng việc chủ dự án đang xin — chỉ cần thay `onSelect: () => {}` bằng logic thật + gỡ `disabled`. |
| 2 | 🔴 **`pptxgenjs` (thư viện xuất PPTX hiện có, `lib/pptx.ts`) 100% một chiều — không có API đọc.** Đã đọc toàn bộ `node_modules/pptxgenjs/types/index.d.ts`: chỉ có `addSlide/addText/addImage/addShape/addTable/addChart/addMedia/write()/writeFile()` — không một hàm `open/read/import/load/parse` nào tồn tại. Muốn đọc `.pptx` cần viết parser riêng (§2.1), không có sẵn trong lib đang dùng. |
| 3 | 🟡 **`EditorSlide.elements` (`lib/present-editor/model.ts:241`) chỉ có 3 loại phần tử: `image` \| `text` \| `shape`.** Không có `table`/`chart` — verify bằng `grep -rn "TableElement\|'table'"` trên toàn `lib/present-editor/` + `components/present-editor/`: 0 kết quả. Đây là model đích cần map nội dung PPTX/Word/bảng tính vào — hiện chưa có "chỗ chứa" cho bảng. |
| 4 | 🟢 **Word→slide đã có sẵn ~90% pipeline, chỉ thiếu bước "lấy chữ ra khỏi .docx".** `lib/present-editor/content-deck.ts` (`parseBlocks`/`slidesFromContent`, đã đọc toàn văn 146 dòng) parse text markdown-like (heading `#`/`##`, bullet, blockquote) → `EditorSlide[]` — ĐANG CHẠY THẬT, gọi từ `PresentEditor.tsx:756`, nhưng đầu vào hiện tại chỉ là 1 `<textarea>` copy-paste tay (`GenerateFlow.tsx`, `bodyText` state) — không có upload file nào. Việc cần làm cho Mảng C gần như chỉ là "đọc `word/document.xml` ra text có cấu trúc heading", KHÔNG cần viết lại pipeline dàn slide. |
| 5 | 🟡 **`pptxTemplate` trong `GenerateFlow.tsx` là field MA** — kiểu tồn tại (`GenerateResult.pptxTemplate: string \| null`, dòng 37) và UI hiện chip hiển thị nó (dòng 181-190), nhưng KHÔNG có bất kỳ nơi nào gọi `setPptxTemplate(...)` với giá trị thật — chỉ set về `null` (dòng 63, 89, 186). Tức là: khung UI cho "đính kèm template .pptx" đã được vẽ sẵn nhưng chưa từng nối dây — code chết, không phải tính năng ẩn đã hoạt động. |
| 6 | 🟢 **Đã có tiền lệ import định dạng nhị phân ĐÓNG khó hơn nhiều** — CAD đã import `.dwg` thật (`lib/cad/dwg-worker.ts` + `@mlightcad/libredwg-web`, WASM chạy trong Web Worker riêng) — DWG là định dạng AutoCAD gần-đóng, khó hơn hẳn PPTX (OOXML mở, có tài liệu công khai). Nếu team đã đầu tư công sức cho DWG, PPTX (Mảng A) là việc RẺ HƠN về bản chất kỹ thuật. |
| 7 | 🔴 **0 dependency nào cho đọc Office/spreadsheet đã có trong `package.json`.** Đã grep `package.json` + `node_modules` top-level: không có `docx`, `xlsx`, `mammoth`, `officeparser`, `unzipper`, `exceljs`, `adm-zip`, `hyperformula`, `handsontable`. CHỈ có `jszip` (đã dùng để vá ZIP `.pptx` xuất ra, không phải đọc) và `jspdf`. Mọi thứ ở Mảng A/C/D đều cần thêm ít nhất 1 lib mới (chỉ đề xuất tên, không cài). |
| 8 | 🔴 **Bảng tính (Mảng D) không tồn tại dưới bất kỳ hình thức nào trong app** — 0 model Prisma liên quan (`schema.prisma` chỉ có 8 model: User/IntegrationAccount/Project/Flow/FlowVersion/CreditTransaction/ChatMessage/LibraryAsset), 0 component lưới ô. Skill Claude `du-toan-noi-that` (bóc khối lượng, xuất .xlsx) chỉ tồn tại ở `~/.claude/skills/du-toan-noi-that/` — **hoàn toàn NGOÀI repo `interiorflow`**, viết bằng Python (`openpyxl`), không có 1 dòng code nào dùng chung được với app Next.js/TypeScript. |

**Đề xuất cốt lõi:** 4 mảng đi 4 tốc độ khác nhau — **C (Word) rẻ nhất, làm trước**; **A (PPTX) khả
thi, làm sau, cam kết rõ "đủ tốt cho slide đơn giản" chứ không phải "trung thực 100%"**; **B
(Keynote) KHÔNG làm trực tiếp — chỉ dẫn user xuất PPTX từ Keynote rồi đi qua đường A**; **D (bảng
tính) là 1 tính năng MỚI hoàn toàn, tách khỏi 3 việc import ở trên, cần quyết định riêng về độ
mạnh cần thiết** (§2.4, §6-Qb).

---

## 1. HIỆN TRẠNG ĐÃ VERIFY

### 1.1 `lib/pptx.ts` — xuất 1 chiều, `pptxgenjs` không có API đọc

`lib/pptx.ts` (334 dòng, đọc toàn văn) là **con đường xuất PPTX duy nhất** của app —
`exportDeckToPptx(slides, opts)`:

```ts
// lib/pptx.ts:21-22
const SLIDE_W = 13.333;
const SLIDE_H = 7.5;
```

- Nhận `PptxSlide[]` (union `PptxSlideContent` — title/body/kicker/hero ánh xạ từ
  `SlideContent`/`SlideTheme`, hoặc `PptxSlideImage` — fallback ảnh full-bleed).
- Dựng file bằng `new PptxGen()` → `slide.addText/addImage/addShape` → `pptx.write({outputType:
  'arraybuffer'})` (dòng 316) → `injectEmbeddedFonts()` vá thêm font nhúng → tải xuống trình
  duyệt. **100% một chiều: app → file**. Không có hàm nào đọc ngược lại.
- Comment đầu file tự ghi rõ: *"Xuất deck sang PowerPoint (.pptx) chỉnh sửa được"* — nghĩa là
  "chỉnh sửa được" ở đây chỉ nói tới việc **PowerPoint thật** mở file ra sửa được (vì dùng text
  box thật, không phải ảnh) — KHÔNG phải InteriorFlow đọc lại được file đó.

Đã đọc toàn bộ `node_modules/pptxgenjs/types/index.d.ts` (2800+ dòng) để xác nhận API bề mặt:

```
write(props?): Promise<...>
writeFile(props?): Promise<string>
addSlide(props?): Slide
Slide.addChart / addImage / addMedia / addShape / addTable / addText
```

**Không có `readFile`/`open`/`import`/`load`/`parse` ở bất kỳ đâu trong file này** (chỉ có các
`.d.ts` của `@types/node`/`undici-types` nằm trong `node_modules` lồng của `pptxgenjs` khớp từ
khoá "file" — đó là kiểu Node.js `fs` chung, không liên quan tới đọc PPTX). Kết luận: `pptxgenjs`
là thư viện **chuyên tạo mới**, đúng như brief đã dự đoán — cần viết parser hoàn toàn riêng cho
Mảng A, không mượn được API đọc có sẵn từ lib đang dùng.

### 1.2 🟢 PHÁT HIỆN QUAN TRỌNG NHẤT — UI đã có sẵn 1 mục menu STUB cho đúng tính năng này

`components/present-editor/Toolbar.tsx:103-124` — cặp nút "Nhập"/"Xuất" dùng chung cho 3 chặng
(`components/ui/IOMenu.tsx`). Mục "Nhập" của Presenting:

```tsx
// components/present-editor/Toolbar.tsx:107-123
items={[
  {
    id: 'image',
    label: 'Ảnh vào slide',
    sub: 'Ảnh NỘI DUNG — đưa thẳng vào slide đang dàn',
    icon: <ImageIcon size={15} />,
    onSelect: () => fileRef.current?.click(),
  },
  {
    id: 'deck',
    label: 'Mở deck (.pptx / .pdf)',
    icon: <FileUp size={15} />,
    onSelect: () => {},
    disabled: true,
    disabledReason: 'Chưa hỗ trợ mở lại file deck — Present hiện chỉ nhập ảnh',
  },
]}
```

Đây gần như là bằng chứng bằng văn bản rằng **team trước đã dự trù đúng nhu cầu chủ dự án đang
nêu** ("mở deck .pptx để chỉnh sửa tiếp") nhưng chưa có hạ tầng để làm — `onSelect` là hàm rỗng,
`disabled: true` khoá cứng. Đây chính xác là **điểm cắm** cho Mảng A/B của đề xuất này: thay
`onSelect: () => {}` bằng logic mở file picker + gọi parser (§2.1), gỡ `disabled`. Không cần tạo
UI mới — chỉ nối dây vào chỗ đã vẽ sẵn.

Đáng chú ý: label ghi `.pptx / .pdf` — mở `.pdf` để "sửa tiếp" thực chất KHÔNG khả thi (PDF không
có khái niệm "text box còn sửa được" trừ khi PDF đó được dựng có cấu trúc — mọi PDF từ máy in/scan
là ảnh raster). Đề xuất bỏ `.pdf` khỏi label này khi triển khai, hoặc làm rõ hành vi PDF chỉ là
"chèn làm ảnh nền 1 slide" (giống cầu nối CAD→Present đã có, xem
`docs/RESEARCH-TECHNICAL-DRAWING-PIPELINE.md §1.5`), không phải "mở lại để sửa chữ".

### 1.3 Model `EditorSlide` — đích cần map nội dung vào

`lib/present-editor/model.ts` (490 dòng, đọc toàn văn). `ElementKind` (dòng 20):

```ts
export type ElementKind = 'image' | 'text' | 'shape';
```

3 loại phần tử, đủ chi tiết cho phần lớn nhu cầu deck-đơn-giản:

| Loại | Field chính | Ghi chú liên quan Mảng A/C |
|---|---|---|
| `TextElement` (dòng 192-226) | `text, fontSize(%chiều cao sân khấu), color, align, bold, italic, underline, tracking, lineHeight, bullet/listStyle, fontFamily, role('title'\|'kicker'\|'body'\|'free'), fx(hiệu ứng)` | `role` đã có sẵn ý niệm "vai trò ngữ nghĩa" — dùng đúng để map run text PPTX (title placeholder → role:'title') |
| `ImageElement` (dòng 178-190) | `src(URL/data URI), adjust, crop, radius, assetId` | `src` nhận bất kỳ URL/data URI nào — ảnh trích từ `ppt/media/` chỉ cần base64 hoá là chèn được ngay, không cần đổi model |
| `ShapeElement` (dòng 228-239) | `shape('rect'\|'ellipse'\|'line'\|'triangle'\|'polygon'\|'arrow'), fill, stroke, strokeWidth, radius, sides, gradient` | Danh sách shape có sẵn KHÔNG khớp hết shape PPTX (PPTX có ~180 preset geometry: `star`, `callout`, `chevron`,...) — chỉ map được các auto-shape cơ bản, còn lại phải fallback |

`Frame` (dòng 139-145) là % của sân khấu (0-100), không phải pixel/EMU tuyệt đối — nghĩa là mọi
toạ độ PPTX (đơn vị EMU — 914400/inch) phải quy đổi qua `% = emu / slideWidthEmu * 100` khi map
vào, có sẵn 1 phép chia đơn giản, không phức tạp.

**KHÔNG có `TableElement`/`ChartElement`** — verify:

```
grep -rniE "TableElement|'table'|\"table\"" lib/present-editor/ components/present-editor/
→ 0 kết quả
```

Đây là khoảng trống kiến trúc quan trọng cho cả Mảng A (PPTX thật hay có bảng/chart, VD bảng so
sánh vật liệu) lẫn Mảng D (bảng tính) — bàn ở §2.1 và §2.4.

### 1.4 `content-deck.ts` — pipeline dàn text→slide ĐÃ CÓ, kể cả né bảng markdown

`lib/present-editor/content-deck.ts` (146 dòng, đọc toàn văn). `parseBlocks(text)` tách văn bản
theo heading cấp 1-2 (`#`/`##`) hoặc dòng UPPERCASE dạng "CHƯƠNG/CAO TRÀO/GHI CHÚ", gom bullet +
blockquote vào `body[]`. Đáng chú ý — dòng 38:

```ts
// lib/present-editor/content-deck.ts:38
if (!line || /^-{3,}$/.test(line) || line.startsWith('|')) continue; // trống / hr / hàng bảng
```

**Hàng bảng markdown (`| ... |`) bị BỎ QUA HOÀN TOÀN, không lỗi, không cảnh báo** — nếu convert
Word có bảng ra markdown/text thô rồi chạy qua `parseBlocks`, mọi nội dung trong bảng biến mất im
lặng. Đây là giới hạn CỤ THỂ cần biết trước khi hứa "Word import giữ được bảng" (§2.3).

`slidesFromContent(text, images, palette, fonts)` (dòng 87-146) sinh `EditorSlide[]`: block đầu →
Cover, block ngắn/blockquote → Quote, còn lại → Content (+ảnh, tự tách "(tiếp)" nếu dài — dòng
130). Đã CHẠY THẬT trong sản phẩm:

```
grep -rn "slidesFromContent" .
→ components/present-editor/PresentEditor.tsx:756
     if (!built.length) built = slidesFromContent(r.bodyText, r.contentImages, pal, ed.deck.fonts);
```

`r.bodyText` đến từ `GenerateResult` do `components/present-editor/GenerateFlow.tsx` tạo ra —
kiểm tra ngược nguồn: **chỉ có 1 `<textarea>` copy-paste tay** (dòng 165-173, `bodyText` state,
placeholder *"Dán nội dung deck: tiêu đề, ý chính, mô tả concept…"*). Không có `<input
type="file">` nào nhận `.docx`/`.txt`/`.md` — người dùng phải tự mở Word, copy, dán tay. Đây
chính là khoảng trống Mảng C cần lấp: **thêm 1 bước "đọc .docx → text có cấu trúc heading" TRƯỚC
`bodyText`**, còn từ `bodyText` trở đi bộ máy đã chạy đúng, không cần viết lại.

### 1.5 `pptxTemplate` — 1 field ma trong `GenerateFlow.tsx`

`components/present-editor/GenerateFlow.tsx`:

```ts
// dòng 32-40
export interface GenerateResult {
  ...
  /** template .pptx đã chọn từ thư viện (nếu có) — hiện chỉ ghi nhận tên. */
  pptxTemplate: string | null;
  ...
}
```

```ts
// dòng 63
const [pptxTemplate, setPptxTemplate] = useState<string | null>(null);
```

`setPptxTemplate` chỉ được gọi 2 lần trong toàn file: dòng 89 (`setPptxTemplate(null)` khi user
chọn ảnh reference — "chọn ảnh → bỏ chọn pptx") và dòng 186 (nút X trên chip — cũng set về
`null`). **KHÔNG có nơi nào set giá trị THẬT** — không có file picker `.pptx`, không có danh sách
template để chọn. UI vẫn render chip hiển thị `pptxTemplate` (dòng 181-190) nếu nó có giá trị,
nhưng giá trị đó không bao giờ khác `null` trong luồng hiện tại — **code chết** (dead state), có
lẽ là phần dở dang từ 1 tính năng "chọn mẫu .pptx làm khung dàn trang" đã dự tính nhưng chưa hoàn
thiện. Đáng ghi chú vì dễ nhầm là "đã có 1 phần import PPTX" khi đọc lướt — thực tế chưa hoạt động
gì.

### 1.6 Tiền lệ đáng chú ý — CAD đã import DWG (nhị phân, đóng) qua WASM

`components/cad/CadEditor.tsx` (~dòng 272) — menu "Nhập" của Drafting CAD:

```
{ id: 'dxf', label: 'Mở DXF', ... }
{ id: 'dwg', label: 'Mở DWG', sub: 'Parse trong Web Worker riêng — chưa hỗ trợ block INSERT/DIMENSION', ... }
{ id: 'idf', label: 'Mở .idf', ... }
```

`.dwg` là định dạng AutoCAD **gần-đóng** (không có spec chính thức đầy đủ công khai, ngược hẳn với
độ mở của DXF/OOXML) — app đã đầu tư `lib/cad/dwg-worker.ts` (đọc toàn văn xác nhận) dùng
`@mlightcad/libredwg-web` (WASM, GPL-3.0, cô lập trong Web Worker riêng — ghi rõ trong
`licenseNotes` của `package.json`) để parse thật. Đây là **tiền lệ tốt** cho Mảng A: nếu team đã
chấp nhận độ phức tạp/rủi ro license của việc parse 1 định dạng nhị phân đóng như DWG, việc parse
PPTX (OOXML — zip + XML, có tài liệu công khai đầy đủ từ Microsoft/ECMA-376, không cần thư viện
nhị phân bên thứ 3 cồng kềnh) **rẻ hơn về bản chất kỹ thuật**, dù vẫn cần viết mới hoàn toàn.

### 1.7 Tiền lệ đáng chú ý #2 — `jszip` đã vá ruột 1 file `.pptx` thật

`lib/pptx-zip-fonts.ts` (đọc toàn văn) — hậu xử lý buffer `.pptx` do `pptxgenjs` xuất ra để nhúng
font thật, bằng cách **mở lại chính file `.pptx` vừa tạo** bằng `jszip` và sửa 4 mảnh XML bên
trong: `[Content_Types].xml`, `ppt/_rels/presentation.xml.rels`, `ppt/presentation.xml`, cộng
thêm `ppt/fonts/font{N}.fntdata`. Comment đầu file (dòng 18-22) giải thích rõ lựa chọn kỹ thuật:

> *"VÌ SAO VÁ XML BẰNG CHUỖI CHỨ KHÔNG PARSE DOM: ... Kéo DOMParser/XMLSerializer vào chỉ để chèn
> 4 chuỗi là đổi rủi ro này lấy rủi ro khác (serializer viết lại namespace/self-closing tag khác
> đi)."*

Đây là bằng chứng **`jszip` đã có sẵn trong cây phụ thuộc và đã dùng thật để đọc/ghi cấu trúc ZIP
bên trong 1 file `.pptx`** — chỉ khác là hiện tại thao tác trên `ppt/presentation.xml` (font), còn
Mảng A cần thao tác thêm trên `ppt/slides/slideN.xml` (nội dung slide) + `ppt/media/` (ảnh). Cùng
1 lib, cùng 1 kỹ thuật (string/regex patch thay vì DOM đầy đủ) — rủi ro kỹ thuật đã được đội trước
chấp nhận và ghi lại lý do, dùng lại tư duy này cho parser đọc là hợp lý, không phải hướng mới.

### 1.8 Tiền lệ đáng chú ý #3 — route trích chữ PDF phía server

`app/api/pdf/extract/route.ts` (23 dòng, đọc toàn văn):

```ts
// dòng 1-22
import { extractText, getDocumentProxy } from 'unpdf';
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Thiếu file PDF.' }, { status: 400 });
  const buf = new Uint8Array(await file.arrayBuffer());
  const pdf = await getDocumentProxy(buf);
  const { text, totalPages } = await extractText(pdf, { mergePages: true });
  ...
  return NextResponse.json({ text: clean.slice(0, 20000), pages: totalPages, truncated: ... });
}
```

Route có auth (`getSessionUser()`), nhận `FormData` chứa 1 `File`, parse **phía server (Node,
không cần native deps** — comment dòng 5), trả JSON text đã dọn + cắt trần 20.000 ký tự + cờ
`truncated`. Đây là **khuôn mẫu sẵn có, đúng hình dạng** cho 1 route mới `/api/office/extract`
(Mảng A/C): cùng auth pattern, cùng shape input/output, chỉ đổi thư viện parse bên trong
(jszip+regex XML cho pptx/docx thay vì `unpdf`). Không cần phát minh lại luồng upload/auth/giới
hạn kích thước.

### 1.9 `package.json` — kiểm chứng đã có gì, chưa có gì

```json
"dependencies": {
  "jspdf": "^4.2.1",
  "jszip": "^3.10.1",
  "pptxgenjs": "^3.12.0",
  "unpdf": "^1.6.2",
  ...
}
```

Grep toàn bộ `package.json` + `ls node_modules` (top-level) cho các từ khoá: `docx`, `xlsx`,
`mammoth`, `officeparser`, `unzipper`, `exceljs`, `node-xlsx`, `sheetjs`, `hyperformula`,
`handsontable`, `luckysheet`, `x-spreadsheet`, `adm-zip`, `yauzl`, `xml2js`, `fast-xml-parser`,
`cheerio` → **0 kết quả cho tất cả**. Xác nhận đúng như đề bài dự đoán: hoàn toàn chưa có hạ tầng
đọc Office/spreadsheet nào, kể cả gián tiếp qua transitive dependency (đã kiểm `node_modules` của
`pptxgenjs` — chỉ kéo theo `@types/node`/`undici-types`, không có lib XML/zip nào khác ngoài
`jszip` mà app đã tự khai trực tiếp).

### 1.10 Prisma schema — 0 model liên quan bảng tính/dự toán

`prisma/schema.prisma` — 8 model: `User, IntegrationAccount, Project, Flow, FlowVersion,
CreditTransaction, ChatMessage, LibraryAsset`. Grep `spreadsheet|budget|dự toán|dutoan|Sheet\b` →
0 kết quả. `LibraryAsset` (model gần nhất) có field `content: String?` — comment tại chỗ: *"chữ
bóc từ PDF (đề bài/hồ sơ) cho AI đọc"* — đây là **tiền lệ dùng được** cho việc lưu text đã trích
từ `.docx`/`.pptx` (Mảng A/C) theo đúng pattern hiện có, không cần field mới nếu chỉ cần lưu text
thô đã bóc; nhưng KHÔNG có field nào phù hợp cho dữ liệu bảng tính có cấu trúc (ô/hàng/cột/công
thức) — Mảng D cần model Prisma hoàn toàn mới (§2.4).

### 1.11 Skill `du-toan-noi-that` — chỉ tồn tại NGOÀI repo, không có code trong app

```
find /Users/tranben/Downloads/interiorflow -iname "*du-toan*" -o -iname "*dutoan*"
→ (rỗng)
find ~/.claude -iname "*du-toan*"
→ /Users/tranben/.claude/skills/du-toan-noi-that
```

Đây là **1 Claude Skill độc lập**, không phải feature của app `interiorflow`:

- `SKILL.md` mô tả 3 mode CLI: `km` (khái toán theo m², suất đầu tư cơ bản/trung/cao cấp),
  `bom` (bóc khối lượng từ DXF theo quy ước tên layer), `bang` (áp đơn giá vào CSV khối lượng có
  sẵn).
- `scripts/dutoan.py` — Python thuần (`argparse, csv, json, math`), xuất `.xlsx` bằng
  **`openpyxl`** (dòng 9 comment *"Xuat .xlsx (openpyxl)"*, `write_xlsx()` dòng 100-104 `import
  openpyxl`).
- `assets/don_gia_mau.csv` — bảng đơn giá MẪU (sàn/trần/vách/cửa/nội thất/MEP), cột
  `ma_hang_muc,ten_hang_muc,don_vi,don_gia,nhom,ghi_chu`.

**Kết luận: 0 dòng code chia sẻ được với app Next.js/TypeScript.** Skill này chạy hoàn toàn bên
ngoài, bằng Python, gọi tay qua CLI — không phải 1 API/route trong `interiorflow`, không dùng
được làm "cơ chế bảng tính thô có sẵn để tái dùng" như đề bài gợi ý khả năng. Điều DÙNG ĐƯỢC duy
nhất từ skill này cho Mảng D: (a) cấu trúc cột đơn giá (`ma_hang_muc/ten_hang_muc/don_vi/don_gia/
nhom`) là 1 tham khảo tốt cho schema `SpreadsheetElement`/bảng dự toán trong app nếu chủ dự án
muốn 2 nơi cùng ngôn ngữ dữ liệu; (b) nếu sau này muốn "bảng tính trong app xuất ra đúng định dạng
skill này đọc được", cần khớp đúng tên cột CSV này ở bước export — nhưng đây là việc TÍCH HỢP 2
chiều, ngoài phạm vi 1 tính năng bảng tính đơn giản trong app.

---

## 2. ĐỀ XUẤT KIẾN TRÚC — TÁCH 4 MẢNG

### 2.1 Mảng A · Import PPTX thật (.pptx) — khả thi nhất

**Định dạng:** OOXML — 1 file `.pptx` là 1 zip chứa XML (`ppt/slides/slide1.xml`,
`ppt/presentation.xml`, `ppt/media/image1.png`, ...), có spec công khai (ECMA-376/ISO 29500).
`jszip` đã có sẵn trong `package.json` (§1.9) và đã CHỨNG MINH khả năng đọc/ghi ruột 1 file
`.pptx` thật (§1.7) — chỉ cần mở rộng sang các path khác trong cùng zip.

**Luồng đề xuất (mẫu, chưa áp):**

```ts
// lib/office/pptx-import.ts (MẪU) — chạy client-side hoặc trong route /api/office/import-pptx
import JSZip from 'jszip';
import type { EditorSlide, SlideElement } from '@/lib/present-editor/model';
import { makeText, makeImage } from '@/lib/present-editor/model';

export async function importPptxToSlides(file: File): Promise<EditorSlide[]> {
  const zip = await JSZip.loadAsync(file);
  // 1. Đọc ppt/presentation.xml → lấy sldSz (kích thước slide, EMU) để quy đổi % .
  const presXml = await zip.file('ppt/presentation.xml')!.async('string');
  const [, cxStr, cyStr] = presXml.match(/<p:sldSz cx="(\d+)" cy="(\d+)"/) ?? [];
  const slideW = Number(cxStr) || 12192000; // mặc định 16:9 chuẩn PPTX (EMU)
  const slideH = Number(cyStr) || 6858000;

  // 2. Liệt kê slide theo thứ tự thật (KHÔNG dùng tên file — dùng ppt/_rels/presentation.xml.rels
  //    để map rId → path đúng thứ tự trong <p:sldIdLst>, tránh lệch thứ tự khi PowerPoint đặt
  //    tên file không tuần tự sau nhiều lần sửa).
  const slideFiles = await resolveSlideOrder(zip); // helper, đọc rels — xem ghi chú rủi ro §3

  const slides: EditorSlide[] = [];
  for (const path of slideFiles) {
    const xml = await zip.file(path)!.async('string');
    const elements: SlideElement[] = [];

    // 3. Mỗi <p:sp> (shape) có text: lấy <a:off>/<a:ext> (vị trí/cỡ, EMU) + nối các <a:t> trong
    //    <a:p> (đoạn văn) thành 1 chuỗi text (giữ \n giữa các <a:p>).
    for (const spMatch of xml.matchAll(/<p:sp>[\s\S]*?<\/p:sp>/g)) {
      const sp = spMatch[0];
      const off = sp.match(/<a:off x="(-?\d+)" y="(-?\d+)"/);
      const ext = sp.match(/<a:ext cx="(\d+)" cy="(\d+)"/);
      const texts = [...sp.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => m[1]);
      if (!texts.length || !off || !ext) continue;
      elements.push(
        makeText({
          text: texts.join(' '),
          frame: {
            x: (Number(off[1]) / slideW) * 100,
            y: (Number(off[2]) / slideH) * 100,
            w: (Number(ext[1]) / slideW) * 100,
            h: (Number(ext[2]) / slideH) * 100,
            rotation: 0, // TODO: đọc <a:xfrm rot="..."> (đơn vị 1/60000 độ) — bỏ qua ở M1
          },
        }),
      );
    }

    // 4. Ảnh: <p:pic> trỏ qua r:embed (rId) → ppt/slides/_rels/slideN.xml.rels → ppt/media/imageX.*
    //    → đọc base64 từ zip, chèn làm ImageElement.src = data URI.
    for (const picMatch of xml.matchAll(/<p:pic>[\s\S]*?<\/p:pic>/g)) {
      // ...resolve rId → media path qua slide N .rels, base64 hoá, makeImage({ src, frame })
    }

    slides.push({ id: newId(), background: '#FFFFFF', elements });
  }
  return slides;
}
```

**Giới hạn THẬT — không cam kết 100% fidelity:**

- PPTX thật có: SmartArt (`<p:graphicFrame>` chứa diagram XML riêng, không phải shape thường),
  gradient nhiều điểm dừng, animation (`<p:timing>`), master-slide/layout inheritance (style thừa
  kế qua 3 tầng `slideMaster` → `slideLayout` → `slide`, phải trace ngược nếu shape không tự ghi
  màu/font), bảng (`<a:tbl>` trong `<p:graphicFrame>` — cấu trúc riêng, khác `<p:sp>`), biểu đồ
  (`<c:chart>`, tham chiếu XML rời).
- **Đề xuất cam kết:** "đủ tốt cho phần lớn slide đơn giản (text + ảnh + hình cơ bản: chữ nhật,
  ellipse, mũi tên)" — khớp đúng 3 loại `SlideElement` hiện có (§1.3). Mọi thứ KHÔNG map được
  (SmartArt/chart/bảng/animation phức tạp, style thừa kế từ master) → **fallback**: hoặc (a) bỏ
  qua phần tử đó (mất nội dung, nhưng không vỡ layout tổng thể), hoặc (b) rasterize CẢ SLIDE gốc
  thành 1 ảnh nền (cần renderer PPTX→ảnh phía server, chưa có sẵn — xem rủi ro §3) rồi user tự vẽ
  lại phần chi tiết trên nền đó. Khuyến nghị (a) cho M1 (rẻ hơn, không cần renderer mới), (b) để
  ngỏ cho M2 nếu user thấy mất quá nhiều nội dung.
- **Bảng (`<a:tbl>`) trong PPTX gốc:** vì `EditorSlide` chưa có `TableElement` (§1.3), M1 đề xuất
  bỏ qua bảng khi import (đúng tinh thần "đủ tốt cho slide đơn giản"), liên hệ chéo với Mảng D —
  nếu D làm trước và có `SpreadsheetElement`/`TableElement` chung, M2 của Mảng A có thể map
  `<a:tbl>` vào đúng loại phần tử đó.

**UI:** nối vào đúng chỗ `Toolbar.tsx:115-122` đã stub sẵn (§1.2) — gỡ `disabled`, `onSelect` mở
file picker `.pptx` → gọi `importPptxToSlides()` → chèn slide mới vào cuối deck đang mở (không đè
deck — giữ đúng hành vi "consume, không phá state hiện có" mà mọi handoff khác trong app đã dùng,
xem `RESEARCH-TECHNICAL-DRAWING-PIPELINE.md §1.5`).

### 2.2 Mảng B · Import Keynote (.key) — KHÔNG khả thi trực tiếp

`.key` là 1 package (thư mục nén dạng zip) chứa `Index.apxl` (hoặc `.iwa`, tuỳ phiên bản Keynote)
— định dạng **protobuf nội bộ của Apple, không có spec công khai chính thức**, và đã đổi cấu trúc
nhiều lần giữa các phiên bản Keynote (Apple không cam kết ổn định ngược). Không có thư viện
JS/TS/Python nào ổn định để đọc định dạng này (khác iWork cũ hơn dùng XML — bản hiện tại đã
chuyển hẳn sang protobuf từ nhiều năm trước).

**Kết luận thẳng thắn: KHÔNG làm parser trực tiếp cho `.key`.** Đây là giới hạn THẬT của hệ sinh
thái (đóng, không tài liệu), không phải thiếu cố gắng hay thiếu thời gian — đầu tư reverse-engineer
định dạng protobuf riêng của Apple là rủi ro vô hạn (Apple đổi format bất kỳ lúc nào, không có ai
chịu trách nhiệm bảo trì spec).

**Đường khả thi duy nhất:** yêu cầu người dùng tự xuất Keynote → PowerPoint bằng tính năng có sẵn
của Keynote (**File > Export To > PowerPoint**, hoặc `⇧⌘E` r) rồi nhập file `.pptx` kết quả qua
Mảng A. Đây KHÔNG phải giải pháp né việc — Keynote's PPTX export do chính Apple viết, chất lượng
convert cao hơn nhiều so với InteriorFlow tự đoán mò định dạng `.key`. Đề xuất: UI chỉ hiện dòng
hướng dẫn ngắn ("File Keynote? Xuất sang PowerPoint trong Keynote rồi nhập file .pptx ở đây") thay
vì cố nhận diện `.key` và báo lỗi mập mờ.

### 2.3 Mảng C · Import Word (.docx) — rẻ nhất, tái dùng gần 100%

`.docx` cũng là OOXML (zip + `word/document.xml`) — cùng họ định dạng, cùng công cụ (`jszip`) như
Mảng A, nhưng **rẻ hơn nhiều** vì đích đến không phải toạ độ hình học (PPTX) mà là **text có cấu
trúc heading**, đúng đầu vào mà `parseBlocks()`/`slidesFromContent()` (§1.4) đã xử lý sẵn.

**Luồng đề xuất (mẫu, chưa áp):**

```ts
// lib/office/docx-import.ts (MẪU)
import JSZip from 'jszip';

/** word/document.xml: mỗi <w:p> là 1 đoạn; pStyle 'Heading1'/'Heading2' → map ra '#'/'##'
 *  để tái dùng ĐÚNG parseBlocks() hiện có — không viết bộ nhận diện heading mới. */
export async function docxToMarkdownLike(file: File): Promise<string> {
  const zip = await JSZip.loadAsync(file);
  const xml = await zip.file('word/document.xml')!.async('string');
  const lines: string[] = [];
  for (const pMatch of xml.matchAll(/<w:p\b[\s\S]*?<\/w:p>/g)) {
    const p = pMatch[0];
    const styleMatch = p.match(/<w:pStyle w:val="Heading(\d)"/);
    const runsText = [...p.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]).join('');
    if (!runsText.trim()) continue;
    const isBullet = /<w:numPr>/.test(p); // đoạn có đánh số/bullet (danh sách Word)
    if (styleMatch) {
      const level = Math.min(Number(styleMatch[1]), 2); // chỉ #/## được parseBlocks tách slide
      lines.push(`${'#'.repeat(level)} ${runsText}`);
    } else if (isBullet) {
      lines.push(`- ${runsText}`);
    } else {
      lines.push(runsText);
    }
  }
  return lines.join('\n');
}

// Dùng lại NGUYÊN hàm đã có — không viết pipeline dàn slide mới:
// const text = await docxToMarkdownLike(file);
// const slides = slidesFromContent(text, [], deck.palette, deck.fonts);
```

**Xác nhận bằng đọc code thật:** `slidesFromContent()` nhận đúng chữ ký `(text, images, palette,
fonts)` (§1.4, dòng 87-92) — hàm `docxToMarkdownLike()` chỉ cần trả về đúng 1 chuỗi text có
heading `#`/`##`/bullet `-`, KHÔNG cần biết gì về `EditorSlide`/template — tách bạch đúng ranh
giới đã có sẵn trong code.

**Giới hạn:**

- **Bảng trong Word** (`<w:tbl>`) — nếu convert phẳng thành text, cách tự nhiên nhất là markdown
  pipe-table (`| a | b |`), nhưng `parseBlocks()` **loại bỏ dòng bắt đầu bằng `|`** (§1.4, dòng
  38 đã trích) — nghĩa là PHẢI xử lý bảng RIÊNG trước khi đưa vào `slidesFromContent`, không thể
  đi qua nguyên luồng hiện có nếu muốn giữ bảng. Đề xuất M1: bỏ qua bảng (đúng hành vi mặc định
  hiện tại của `parseBlocks`, không cần sửa gì), ghi rõ giới hạn cho user; M2 nếu cần giữ bảng thì
  phải có `TableElement` trong model trước (liên hệ Mảng D).
- **Ảnh trong Word** (`word/media/`) — dễ lấy (giống PPTX, base64 hoá rồi chèn `ImageElement`),
  nhưng vị trí/kích thước ảnh trong Word (inline với dòng chữ, không phải toạ độ tuyệt đối như
  PPTX) khó map "đúng chỗ" — đề xuất đơn giản hoá: kéo hết ảnh ra khỏi dòng chảy text, rải vào
  từng slide content giống `nextImg()` đã làm cho ảnh dán tay hiện tại (§1.4, dòng 102, 108, 131),
  KHÔNG cố giữ đúng vị trí ảnh-cạnh-đoạn-văn như trong Word gốc.
- Style Word cầu kỳ (màu chữ riêng từng run, font riêng, size riêng theo `<w:rPr>`) — M1 CHỈ lấy
  cấu trúc heading/bullet/text thô, bỏ qua style trực tiếp trong file (deck vẫn dùng theme/font
  của template Present đang chọn, không "nhại" lại định dạng Word gốc) — đúng tinh thần "trích
  xuất nội dung", không phải "trung thực thị giác" (khác Mảng A, vốn cần giữ vị trí hình học).

### 2.4 Mảng D · Bảng tính Excel thật — tính năng MỚI, không phải import

Đây là hạng mục KHÁC BẢN CHẤT với A/B/C — không có file nguồn cần đọc trước, mà là xây MỘT TÍNH
NĂNG chưa từng tồn tại. Tách làm 2 việc con:

**D1 — Đọc dữ liệu thô từ `.xlsx` có sẵn (nếu user muốn NHẬP 1 bảng Excel cũ vào app):**

Thư viện phổ biến, chưa có trong `package.json` (đề xuất, KHÔNG cài):

| Lib | Kích thước (ước lượng) | Ghi chú |
|---|---|---|
| `xlsx` (SheetJS, bản Community) | ~1MB minified | Đọc/ghi `.xlsx`/`.xls`/`.csv`, API đơn giản (`XLSX.read`/`utils.sheet_to_json`), KHÔNG đọc lại công thức đã tính (chỉ giá trị cache sẵn trong file — đủ dùng nếu chỉ cần "nhập dữ liệu ô", không cần "nhập công thức đang sống") |
| `exceljs` | ~1.5MB | API rườm rà hơn nhưng giữ được style ô (màu nền/border) + đọc được công thức dạng chuỗi (không tính lại) — hợp nếu cần hiện lại bảng dự toán có format màu như Excel gốc |

Đề xuất M1: `xlsx` (SheetJS) — đơn giản hơn, đủ cho "đọc ô, không cần giữ style Excel gốc".

**D2 — Bảng tính "hẳn hoi" trong app (lưới ô + công thức):**

Đây là phần lớn công sức thật của Mảng D. 2 hướng, đối chiếu:

| | **Tự viết tối giản** (đề xuất cho M1) | **Dùng thư viện có sẵn** |
|---|---|---|
| Model dữ liệu | 1 `SpreadsheetElement` mới trong `lib/present-editor/model.ts` — `cells: Record<string, {value: string\|number, formula?: string}>`, `rows/cols` số lượng, `colWidths?/rowHeights?` | Tuỳ lib — thường có model riêng, phải viết lớp chuyển đổi 2 chiều sang `EditorSlide` nếu muốn bảng tính SỐNG được trên slide Presenting (không phải cửa sổ tách biệt) |
| Engine công thức | Tự viết parser nhỏ: tách `=A1+B2`, `=SUM(A1:A5)`, `=A1*B1` bằng regex/recursive-descent đơn giản — ĐỦ cho dự toán nội thất (cộng/trừ/nhân/chia + SUM/AVERAGE theo dải ô). Không cần hỗ trợ hàm tài chính/ngày tháng/tra cứu phức tạp của Excel thật | `HyperFormula` (MIT, ~500KB, hỗ trợ 380+ hàm Excel thật, engine tính toán đầy đủ kể cả circular-ref detection) hoặc `formulajs` (nhẹ hơn, chỉ là tập hàm thuần, không tự quản lý dependency graph — phải tự viết phần "ô nào phụ thuộc ô nào") |
| UI lưới ô | Tự dựng `<table>`/CSS Grid + input contentEditable từng ô — kiểm soát hoàn toàn giao diện, khớp Design System TTT (`knowledge/ttt-design-system/`) dễ hơn vì tự vẽ | `Handsontable` (có bản MIT cũ hơn hết hạn tính năng mới, bản mới có phí non-commercial license — CẦN kiểm tra điều khoản trước khi dùng cho công cụ nội bộ công ty) hoặc `x-spreadsheet` (MIT, nhẹ, nhưng ít được bảo trì gần đây — kiểm tra ngày commit cuối trước khi chọn) |
| Chi phí tích hợp | Thấp — code ít, dễ khớp theme/màu TTT, dễ nhúng làm 1 element trong `EditorSlide` (giống Text/Image hiện có) | Cao hơn — hầu hết lib bảng tính là widget ĐỘC LẬP (full page), không thiết kế để làm "1 element trong 1 slide 1920×1080" — cần bọc/ép khung, có thể xung đột CSS/font với app |
| Đủ mạnh tới đâu | Đủ cho dự toán nội thất (bảng vài chục dòng, công thức cộng-trừ-nhân theo hạng mục × đơn giá × khối lượng — đúng hình dạng `assets/don_gia_mau.csv` của skill `du-toan-noi-that`, §1.11) | Dư thừa nếu chỉ cần mức dự toán — hữu ích hơn nếu sau này Mảng D mở rộng thành "bảng tính đa dụng" (không chỉ dự toán nội thất) |

**Khuyến nghị:** tự viết tối giản cho M1 (engine công thức + UI lưới) — đúng tinh thần dự án hiện
tại (nhiều chỗ khác trong app cũng chọn "viết nhỏ, đủ dùng" thay vì kéo lib nặng, VD `lib/cad/pdf.ts`
tự vẽ vector thay vì dùng thư viện CAD lớn). Cân nhắc `HyperFormula` CHỈ nếu chủ dự án xác nhận
Mảng D cần trở thành bảng tính đa dụng thật (không chỉ dự toán) — xem câu hỏi §6-Qb.

**Vị trí trong kiến trúc:** đề xuất `SpreadsheetElement` là 1 loại `SlideElement` MỚI (song song
`image`/`text`/`shape`, §1.3) — cho phép 1 bảng dự toán nằm ngay trên 1 slide Presenting như mọi
phần tử khác (kéo-thả, resize, xuất PDF/PNG cùng lúc với slide). Phương án khác — 1 route/editor
riêng tách biệt hoàn toàn khỏi Presenting — bị loại vì lặp lại đúng bài học đã rút ra ở
`RESEARCH-TECHNICAL-DRAWING-PIPELINE.md §2.3` (phương án "tái dùng bộ máy sửa/layout đã có" luôn
rẻ hơn "viết editor riêng"), và vì bảng dự toán thực tế THƯỜNG cần xuất hiện CHUNG 1 trang PDF với
mặt bằng/hình ảnh dự án (đúng nhu cầu hồ sơ trình bày, không phải bảng tính đứng riêng như Excel
thật).

**Liên hệ chéo `docs/RESEARCH-MATERIAL-BRIDGE.md` (đã merge, KHÔNG phải phụ thuộc cứng):** báo cáo
đó đề xuất model `MaterialRef` (mirror vật liệu từ Larkbase — code/name/priceNote/...) và tự ghi
chú: *"`MaterialRef.priceNote` là text tự do, không chuẩn hoá số... nếu sau này cần tính dự toán
tự động (liên quan skill `du-toan-noi-that` đã có) thì cần chuẩn hoá số + đơn vị"*. Nếu Mảng D
triển khai, bảng dự toán trong app có thể lấy giá từ `MaterialRef` làm nguồn tham chiếu (dropdown
chọn vật liệu → tự điền đơn giá vào ô) — NHƯNG đây là 2 quyết định độc lập của 2 báo cáo khác
nhau, không nên coi D phụ thuộc cứng vào việc `MaterialRef`/Larkbase đã triển khai xong (Q1 của
báo cáo đó vẫn đang treo — Larkbase sai workspace, theo `STATUS.md`).

---

## 3. RỦI RO & GIỚI HẠN

| Rủi ro | Chi tiết | Giảm thiểu |
|---|---|---|
| **Regex/string-match XML dễ vỡ khi input phức tạp** | Cách tiếp cận §2.1/§2.3 dùng `matchAll` regex trên XML thay vì parser XML đầy đủ (theo đúng tiền lệ `pptx-zip-fonts.ts`, §1.7) — rủi ro thật: nested `<p:sp>` (VD group shape `<p:grpSp>` chứa nhiều `<p:sp>` con), hoặc text chứa ký tự `<`/`>` đã escape sai cách, có thể làm regex match sai ranh giới | Giới hạn phạm vi rõ: M1 chỉ xử lý shape KHÔNG lồng nhau (bỏ qua group shape, ghi log "đã bỏ qua N group phức tạp"); cân nhắc `fast-xml-parser` (nhẹ, ~50KB) nếu regex tỏ ra không đủ tin cậy khi test với file PPTX thật đa dạng — quyết định sau khi có bộ test file mẫu thật (không đoán trước) |
| **Thứ tự slide/rId không đơn giản như tên file** | `ppt/slides/slide1.xml, slide2.xml...` KHÔNG đảm bảo đúng thứ tự hiển thị thật (PowerPoint có thể đặt tên không tuần tự sau khi sắp xếp lại slide nhiều lần) — thứ tự THẬT nằm ở `<p:sldIdLst>` trong `ppt/presentation.xml`, map qua `ppt/_rels/presentation.xml.rels` | Bắt buộc đọc qua `sldIdLst` + rels thay vì sort tên file theo số — đã ghi chú trong code mẫu §2.1 (`resolveSlideOrder`), cần viết đúng ngay từ M1, đây là lỗi ÂM THẦM dễ bị bỏ sót (slide vẫn hiện ra, chỉ sai thứ tự) |
| **Font PPTX gốc gần như chắc chắn KHÔNG khớp bộ Archivo/Archivo Expanded của TTT** | File PPTX/Word người dùng có sẵn dùng font tuỳ ý (Calibri, Times New Roman, font công ty khác…) — import vào Presenting mà giữ nguyên tên font sẽ VI PHẠM quy tắc thiết kế TTT (chỉ Archivo, §Design System). | Đề xuất: M1 LUÔN ép về font/theme hiện tại của deck Present (bỏ qua font gốc hoàn toàn, chỉ lấy text+layout+ảnh) — nói rõ với user đây là hành vi CHỦ Ý (giữ chuẩn thương hiệu), không phải bug "font bị mất". Không cố gắng nhúng font gốc như cơ chế `customFonts` đã có cho font user tự chọn (đó là tính năng khác — user CHỌN tải font, không phải font "lỡ dính theo" từ file import) |
| **File PPTX/DOCX lớn (nhiều ảnh độ phân giải cao) làm nặng deck** | Ảnh trong `ppt/media/`/`word/media/` có thể vài chục MB tổng cộng cho 1 file — base64 hoá trực tiếp vào `ImageElement.src` (giữ nguyên pattern hiện tại) sẽ làm deck IndexedDB phình to nhanh (khác nguyên tắc "lưu-theo-tham-chiếu" đã áp dụng cho ảnh Reference qua `lib/refingest.ts`, xem `RESEARCH-MATERIAL-BRIDGE.md`) | M1 chấp nhận base64 trực tiếp (nhất quán với cách `ImageElement` hoạt động hiện tại, không có hạ tầng "ảnh theo tham chiếu" cho Present); cân nhắc nén/resize ảnh về giới hạn hợp lý (VD cạnh dài ≤2000px, giống `renderDocToDataURL` bên CAD) trước khi nhúng, tránh 1 file import làm deck nặng gấp nhiều lần |
| **Bảng tính tự viết (Mảng D) có thể không đủ khi nhu cầu thật phức tạp hơn dự đoán** | Nếu dự toán nội thất thật cần hàm VLOOKUP/điều kiện IF lồng nhau/tham chiếu chéo sheet — engine tự viết tối giản (§2.4) sẽ KHÔNG đủ, phải viết thêm nhiều lần thay vì đổi hẳn sang `HyperFormula` ngay từ đầu | Đề xuất chốt yêu cầu công thức TỐI THIỂU cần có (§6-Qc) TRƯỚC khi chọn hướng tự viết hay dùng lib — tránh vừa viết vừa phát hiện thiếu, phải đổi kiến trúc giữa chừng |
| **License `Handsontable`** | Bản mới của `Handsontable` chuyển sang non-commercial license cho nhiều tính năng — dự án `interiorflow` đang là "công cụ nội bộ TTT Architects" (ghi rõ trong `licenseNotes` của `package.json`) nhưng vẫn là dùng trong hoạt động kinh doanh công ty, cần đọc kỹ điều khoản trước khi cân nhắc, KHÔNG mặc định coi "nội bộ" = miễn phí theo license của lib này | Nếu chọn hướng dùng lib thay vì tự viết, ưu tiên xác nhận license (MIT thật sự, không phải "free for non-commercial") trước khi đề xuất cụ thể — hiện tại đề xuất CHÍNH vẫn là tự viết (§2.4), tránh rủi ro này hoàn toàn |
| **Không có renderer PPTX→ảnh phía server cho fallback "raster hoá slide gốc"** | §2.1 nhắc tới phương án (b) "rasterize cả slide làm nền" cho phần không map được — nhưng App hiện KHÔNG có bất kỳ renderer PPTX→ảnh nào (LibreOffice headless, hoặc dịch vụ cloud) — đây là hạ tầng MỚI HOÀN TOÀN nếu muốn làm, không phải mở rộng cái có sẵn | Không cam kết phương án (b) cho M1/M2; chỉ để ngỏ làm sau nếu đo thực tế thấy tỉ lệ "nội dung mất khi import" quá cao — cần LibreOffice headless (Docker) hoặc dịch vụ convert cloud trả phí, chi phí vận hành đáng kể, cần bàn riêng |

---

## 4. PHÂN KỲ ĐỀ XUẤT

| Mốc | Nội dung | Phụ thuộc | Rủi ro |
|---|---|---|---|
| **M1** | **Mảng C (Word→slide)** — `docxToMarkdownLike()` + nối vào `slidesFromContent()` có sẵn, thêm 1 mục "Nhập .docx" vào đúng menu đã stub (`Toolbar.tsx`). RẺ NHẤT, tái dùng ~90% pipeline đã có (§1.4), không đụng model | Không | Thấp — additive, không đổi hành vi `slidesFromContent` hiện tại nếu input vẫn là text thường |
| **M2** | **Mảng A (PPTX→slide)** — parser `ppt/slides/*.xml` (text+ảnh+shape cơ bản), nối vào đúng mục "Mở deck (.pptx / .pdf)" đã disabled sẵn (`Toolbar.tsx:115-122`) — gỡ `disabled`, bỏ `.pdf` khỏi label (hoặc làm rõ hành vi PDF = chèn ảnh nền, không sửa chữ). Cam kết rõ "đủ tốt cho slide đơn giản", fallback bỏ qua phần không map được | Không phụ thuộc M1, có thể làm song song | Trung bình — cần bộ file PPTX mẫu thật (đơn giản → phức tạp dần) để đo tỉ lệ map thành công trước khi công bố tính năng |
| **M3** | **Mảng D1 (đọc `.xlsx` thô)** — thêm `xlsx` (SheetJS), route/hàm đọc ô → hiện dữ liệu dạng bảng tĩnh (chưa cần công thức sống) trong 1 panel riêng hoặc chèn thành ảnh/bảng tĩnh vào slide | Không phụ thuộc M1/M2 | Thấp — đọc dữ liệu, không cần UI chỉnh sửa phức tạp |
| **M4** | **Mảng D2 (bảng tính sống trong app)** — `SpreadsheetElement` mới trong model, UI lưới ô, engine công thức tối giản (cộng/trừ/nhân/chia + SUM/AVERAGE dải ô), xuất PDF/PNG/PPTX cùng slide (PPTX: map sang `addTable` sẵn có của `pptxgenjs` — xem §1.1, `addTable` ĐÃ có trong API, chỉ chưa dùng) | M3 nên xong trước (để có đường "nhập .xlsx cũ" nạp dữ liệu ban đầu vào bảng mới), nhưng có thể làm độc lập nếu chủ dự án ưu tiên bảng tính TRỐNG (không cần nhập từ Excel cũ) trước | Trung bình-cao — việc mới hoàn toàn, cần chốt câu hỏi §6-Qb/Qc trước khi bắt đầu, tránh viết rồi phải đổi kiến trúc |
| **M5 (mở, chưa cam kết)** | Mảng A nâng cấp: giữ bảng (`<a:tbl>`) từ PPTX gốc bằng cách map vào `SpreadsheetElement` (nếu M4 đã có); renderer PPTX→ảnh fallback (LibreOffice headless) cho phần không map được; liên kết `MaterialRef` (nếu đã triển khai) làm nguồn giá cho bảng dự toán | M2, M4 | Chưa ước lượng — phụ thuộc câu trả lời §6 và tiến độ `RESEARCH-MATERIAL-BRIDGE.md` |

Không ước lượng số ngày công cụ thể (khác `RESEARCH-ACCESS-CONTROL.md`) vì phạm vi thật của M2/M4
phụ thuộc trực tiếp câu trả lời §6 (mức trung thực PPTX chấp nhận được, độ mạnh công thức cần
thiết) — đề xuất ước lượng công cụ thể SAU khi chủ dự án chọn hướng, giống cách
`RESEARCH-TECHNICAL-DRAWING-PIPELINE.md §4` đã làm cho M2/M3 của báo cáo đó.

---

## 5. ĐỐI CHIẾU VỚI YÊU CẦU GỐC

| Yêu cầu chủ dự án | Trả lời ở |
|---|---|
| "Mở deck trực tiếp, PPTX hoặc Keynote... vào để chỉnh sửa tiếp" | §2.1 (Mảng A — PPTX khả thi, giới hạn fidelity rõ ràng) + §2.2 (Mảng B — Keynote KHÔNG khả thi trực tiếp, đường vòng qua PPTX) + §1.2 (UI đã có chỗ cắm sẵn, chỉ cần nối dây) |
| "Tương tự với định dạng Word" | §2.3 (Mảng C — rẻ nhất, tái dùng ~90% pipeline `content-deck.ts` đã có) |
| "Bổ sung tính năng kẻ ô Excel với bảng tính hẳn hoi" | §2.4 (Mảng D — tính năng MỚI, tách 2 việc con D1/D2, so sánh tự viết vs lib có sẵn) |
| "Không chỉ xem/trích nội dung 1 chiều — chỉnh sửa tiếp" | Toàn bộ §2.1/§2.3 đề xuất map THẲNG vào `EditorSlide.elements` (không phải render ảnh tĩnh 1 chiều) — nội dung sau import là các `TextElement`/`ImageElement` THẬT, sửa được y hệt phần tử tự tạo trong Presenting |
| "Bảng tính thật, có công thức/tính toán, không phải bảng tĩnh" | §2.4-D2 (engine công thức tối giản tự viết, hoặc `HyperFormula` nếu cần mạnh hơn — 2 phương án nêu rõ đánh đổi) |
| Không đoán tên thư viện, kiểm chứng `package.json`/`node_modules` thật | §1.9 (grep xác nhận 0 dependency liên quan Office/spreadsheet đã có, ngoại trừ `jszip`/`jspdf`/`pptxgenjs`/`unpdf` đã dùng cho việc khác) |

---

## 6. CÂU HỎI CẦN CHỦ DỰ ÁN QUYẾT

| # | Câu hỏi | Khuyến nghị |
|---|---|---|
| **Qa** | Mức độ trung thực khi import PPTX chấp nhận được tới đâu — chỉ cần lấy được **text + ảnh** (bỏ qua layout hình học chính xác, chữ tự xếp lại theo template Present có sẵn — giống hệt Mảng C), hay cần **giữ đúng vị trí/kích thước từng shape** như file gốc (cách làm ở §2.1, phức tạp hơn nhiều)? | Khuyến nghị bắt đầu ở mức "giữ vị trí hình học cơ bản" (đúng §2.1) vì đây là điểm khác biệt chính so với Mảng C — nếu chỉ cần text/ảnh không cần vị trí, hai mảng A và C gộp làm một, rẻ hơn hẳn. Cần xác nhận trước khi code vì ảnh hưởng trực tiếp độ phức tạp parser. |
| **Qb** | Bảng tính (Mảng D) dùng **RIÊNG cho dự toán nội thất** (bảng hạng mục × khối lượng × đơn giá, công thức cộng/nhân đơn giản là đủ — khớp `du-toan-noi-that`/`MaterialRef`), hay là **tính năng bảng tính ĐA DỤNG** (người dùng tự do dựng bảng bất kỳ, cần công thức mạnh hơn, gần giống Excel/Google Sheets thật)? | Ảnh hưởng trực tiếp lựa chọn engine công thức (tự viết tối giản vs `HyperFormula`, §2.4) và UI (bảng dự toán có thể có layout cố định — cột hạng mục/đơn vị/khối lượng/đơn giá/thành tiền — trong khi bảng đa dụng cần lưới ô tự do hoàn toàn tuỳ ý). Khuyến nghị: nếu chỉ cần dự toán, làm M4 GỌN theo đúng khuôn `assets/don_gia_mau.csv` (§1.11) — rẻ hơn nhiều so với 1 bảng tính tổng quát. |
| **Qc** | Nếu Qb trả lời "dự toán" — công thức tối thiểu cần có là gì? Chỉ `SUM`/nhân đơn giá×khối lượng, hay cần thêm chiết khấu %/thuế VAT/làm tròn? | Đề xuất chốt danh sách hàm CỤ THỂ trước khi viết engine — tránh vừa viết vừa phát hiện thiếu (rủi ro đã nêu ở §3). |
| **Qd** | Word import — chỉ cần **lấy text** (heading/đoạn văn/bullet, đúng §2.3 M1), hay bắt buộc phải **giữ bảng và ảnh đúng vị trí** trong file `.docx` gốc? | Nếu chỉ cần text, M1 §2.3 đã đủ, rất rẻ. Nếu bắt buộc giữ bảng, cần làm Mảng D (có `TableElement`/`SpreadsheetElement`) TRƯỚC — đẩy Word import từ M1 xuống sau M4, đổi hẳn thứ tự ưu tiên đề xuất ở §4. |
| **Qe** | Độ ưu tiên giữa 4 mảng A/B/C/D — theo đề xuất ở §4 thì **C trước (rẻ nhất) → A → D1 → D2**, Keynote (B) không có mốc riêng (chỉ là hướng dẫn UI, làm cùng lúc với A). Chủ dự án có nhu cầu cấp bách hơn ở mảng nào (VD: sắp có 1 bộ hồ sơ PPTX cũ cần đưa vào ngay) khiến thứ tự này cần đảo? | Không có dữ liệu thật về nhu cầu cấp bách — cần hỏi trước khi khoá thứ tự M1-M4. |
| **Qf** | File PPTX/Word cần import thực tế đến từ đâu — phần lớn do chính TTT tự làm trước đây (font/style tương đối nhất quán, dễ đoán cấu trúc), hay đa dạng nguồn (khách hàng/đối tác gửi, style bất kỳ)? | Ảnh hưởng độ ưu tiên đầu tư cho parser "khoẻ" (§3, rủi ro regex vỡ khi input đa dạng) — nếu chỉ file nội bộ TTT, có thể thu hẹp bộ test case, giảm rủi ro đáng kể so với việc phải chịu được MỌI kiểu PPTX ngoài kia. |

---

*Hết. Không có thay đổi code/dependency nào kèm theo tài liệu này.*
