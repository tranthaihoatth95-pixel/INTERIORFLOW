# NGHIÊN CỨU · Dàn trang bản vẽ kỹ thuật + Cầu nối CAD→Presenting — InteriorFlow

> **Trạng thái: ĐỀ XUẤT, CHƯA THỰC THI.** Tài liệu này KHÔNG kèm thay đổi code nào.
> Mọi khối code bên dưới là **mẫu minh hoạ**, chưa áp vào repo.
> Nhánh: `feat/research-technical-drawing` · Ngày: 2026-07-20 · Mọi khẳng định về code đã verify
> bằng đọc file thật (đường dẫn + số dòng trích dẫn trực tiếp).

## Mục lục

0. [Tóm tắt cho người bận](#0-tóm-tắt-cho-người-bận)
1. [Hiện trạng đã verify](#1-hiện-trạng-đã-verify)
   - 1.1 [Xuất bản vẽ CAD — đã có gì](#11-xuất-bản-vẽ-cad--đã-có-gì)
   - 1.2 [Hệ đo/tỉ lệ/kích thước trong CAD](#12-hệ-đotỉ-lệkích-thước-trong-cad)
   - 1.3 [Chuẩn hiện có — `lib/cad/standards/`](#13-chuẩn-hiện-có--libcadstandards)
   - 1.4 [Presenting — khổ trình bày & xuất PDF/PPTX](#14-presenting--khổ-trình-bày--xuất-pdfpptx)
   - 1.5 [Cầu nối CAD→Present ĐÃ CÓ (raster, không phải kỹ thuật)](#15-cầu-nối-cadpresent-đã-có-raster-không-phải-kỹ-thuật)
   - 1.6 [🔴 Phát hiện quan trọng nhất — tỉ lệ khai báo KHÔNG khớp tỉ lệ in thật](#16--phát-hiện-quan-trọng-nhất--tỉ-lệ-khai-báo-không-khớp-tỉ-lệ-in-thật)
   - 1.7 [Đối chiếu docs cũ — độ trôi tài liệu](#17-đối-chiếu-docs-cũ--độ-trôi-tài-liệu)
2. [Đề xuất kiến trúc](#2-đề-xuất-kiến-trúc)
   - 2.1 [Khung tên (title block) chuẩn hoá thương hiệu TTT](#21-khung-tên-title-block-chuẩn-hoá-thương-hiệu-ttt)
   - 2.2 [Khổ giấy & tỉ lệ in — auto-fit + override](#22-khổ-giấy--tỉ-lệ-in--auto-fit--override)
   - 2.3 [Chế độ trang in trong Presenting — paper-mode vs luồng riêng](#23-chế-độ-trang-in-trong-presenting--paper-mode-vs-luồng-riêng)
   - 2.4 [Cầu nối CAD→Presenting: "technical sheet object"](#24-cầu-nối-cadpresenting-technical-sheet-object)
   - 2.5 [Yêu cầu KHÔNG mất độ chính xác kích thước](#25-yêu-cầu-không-mất-độ-chính-xác-kích-thước)
3. [Rủi ro & giới hạn](#3-rủi-ro--giới-hạn)
4. [Phân kỳ đề xuất](#4-phân-kỳ-đề-xuất)
5. [Đối chiếu với yêu cầu gốc](#5-đối-chiếu-với-yêu-cầu-gốc)
6. [Câu hỏi cần chủ dự án quyết](#6-câu-hỏi-cần-chủ-dự-án-quyết)

---

## 0. TÓM TẮT CHO NGƯỜI BẬN

**InteriorFlow đã có nhiều mảnh ghép rời cho pipeline in ấn kỹ thuật, nhưng chưa mảnh nào nối
với nhau, và một mảnh đang có lỗi bản chất về độ chính xác tỉ lệ.**

| # | Phát hiện | Mức |
|---|---|---|
| 1 | 🔴 **`titleBlock()` (`lib/cad/commands.ts:174`) nhận `scale` là CHUỖI TỰ DO người dùng gõ tay** (VD "1:100"), trong khi PDF xuất ra (`lib/cad/pdf.ts`) dùng `fitBox()` tự tính một hệ số scale HOÀN TOÀN KHÁC để nhét bản vẽ vừa khổ giấy. **Hai con số này không liên hệ gì với nhau.** Nếu người dùng gõ sai hoặc không cập nhật, bản in ra ghi "1:100" nhưng đo bằng thước lại ra tỉ lệ khác — đúng rủi ro chí mạng mà chủ dự án nêu ("gửi công trường… đo bằng thước phải khớp"). Xem §1.6. |
| 2 | 🟡 **Cầu nối CAD→Present ĐÃ TỒN TẠI** (`lib/cad/present-handoff.ts`, nút "Đưa sang Present" ở `CadEditor.tsx:248-262`) — nhưng đi qua **`renderDocToDataURL()` (raster PNG, tối đa 2000px cạnh dài)**, chèn thành ảnh nền 1 slide mới. Với khổ A1 in 300dpi (~9933×7015px thật) thì 2000px là **rõ ràng không đủ** — đây chính là khoảng trống cần lấp bằng luồng SVG vector mới (§2.4), KHÔNG phải xây từ số 0. |
| 3 | 🟢 **Đã có vector PDF thật cho CAD** (`lib/cad/pdf.ts`, Sprint 7) — vẽ lại từng entity bằng API hình học jsPDF (không phải ảnh), giữ nét sắc + text chọn được. Nhưng: khổ giấy **cố định A3 ngang** (không chọn A0-A4), **không có UI chọn khổ**, và **không đi qua Presenting** (nút riêng, tải thẳng). |
| 4 | 🟡 **Presenting đã có khổ A4/A3** (`lib/present-editor/stage-presets.ts`, 5 preset) nhưng **PDF xuất ra là RASTER JPEG nhúng nguyên trang** (`lib/present-editor/export.ts:31-42`, `renderEditorSlide` → `canvas.toDataURL('image/jpeg', 0.92)`), và code tự ghi rõ đây là **"khổ trình bày màn hình/chiếu ~116dpi trên A3, KHÔNG phải in 300dpi"** (comment `stage-presets.ts:9-13`). PPTX thì **luôn xuất 16:9 bất kể khổ đang chọn** (`export.ts:14-24`) — không dùng được cho bản vẽ kỹ thuật khổ dọc/ngang A-series. |
| 5 | 🟢 **`iso-drafting.ts` đã tra sẵn số liệu ISO 216** (khổ giấy A0-A4, `verified:true`) và ISO 7200 (trường khung tên tối thiểu, `verified:false` — chưa tra điều khoản gốc) — dùng làm nguồn hằng số ngay, không cần tra lại. |
| 6 | 🟢 **Khung tên (cajetín) đã có** (`titleBlock()`, panel "Khung tên" trong CAD) nhưng field còn thiếu so với chuẩn hồ sơ kỹ thuật: không có **số bản vẽ**, không có **người kiểm/duyệt** riêng người vẽ, không có **logo công ty**, không có **khổ giấy** là 1 field tường minh. |

**Đề xuất cốt lõi:** SVG là định dạng trung gian CAD→Presenting (giữ vector, không raster hoá
sớm) · thêm 1 "paper-mode" mới trong Presenting (khác slide 16:9) · sửa lỗi tỉ lệ khai báo NGAY
(rẻ, không phá gì) trước khi làm gì khác — đây là lỗi niềm tin nghiêm trọng nhất nếu bản vẽ đã
lọt ra công trường.

---

## 1. HIỆN TRẠNG ĐÃ VERIFY

### 1.1 Xuất bản vẽ CAD — đã có gì

| Định dạng | File | Trạng thái |
|---|---|---|
| DXF | `lib/cad/dxf.ts` | Xuất/nhập đầy đủ — entity thật (DIMENSION/HATCH), lineweight/linetype theo layer (group 370/LTYPE). BLOCK/INSERT furniture bị phẳng hoá (cố ý, ghi rõ trong file). |
| PNG raster | `lib/cad/render.ts:388` `renderDocToDataURL(doc, maxPx=2000)` | Canvas 2D, cạnh dài giới hạn **2000px cứng**, nền trắng, `fitBox()` auto-scale để vừa khung. Dùng cho nút "Xuất PNG", VÀ cho cả 2 handoff "Đưa sang Render"/"Đưa sang Present" (§1.5). |
| PDF vector | `lib/cad/pdf.ts` (Sprint 7 Việc 1, `buildCadPdf`/`exportCadToPdf`) | **THẬT SỰ vector** — vẽ lại line/rect/circle/arc/text/dim/hatch bằng API hình học của jsPDF (`pdf.line/rect/circle/triangle/text`), không phải `addImage`. Nét không bể khi zoom trong Preview/Acrobat, text chọn/copy được. |

Chi tiết `lib/cad/pdf.ts` (đọc toàn văn, 315 dòng):

- **Khổ giấy:** `opts.paper ?? [420, 297]` — mặc định A3 ngang, **hardcode**, không có tham số nào
  đi qua tới UI để đổi (`CadEditor.tsx:105`: `exportCadToPdf(st.doc, 'layout.pdf', { title: '…',
  dimStyle: st.dimStyle })` — không truyền `paper`).
- **Tỉ lệ:** `fitBox(box, pw, ph, margin)` (dùng lại nguyên hàm của `model.ts`) — tính `scale =
  min((width-2*margin)/bw, (height-2*margin)/bh)`, tức LUÔN co giãn bản vẽ để **vừa khít khổ giấy
  đã chọn**, không neo theo một tỉ lệ kiến trúc chuẩn nào (1:50/1:100/…). Xem thêm §1.6 — đây là
  gốc của lỗi độ chính xác.
- **Lineweight:** dùng trực tiếp làm mm nét trên giấy (KHÔNG nhân thêm hệ số zoom) — comment đầu
  file giải thích rõ khác biệt với `render.ts` (px màn hình theo zoom). Đây là điểm ĐÚNG, đáng
  giữ nguyên khi mở rộng.
- **Giới hạn đã tự ghi nhận:** jsPDF 4.2.1 không có Optional Content Groups (OCG) → layer ẩn/hiện
  không "sống" được trong PDF đã xuất (chỉ layer đang ẩn trong app thì không vẽ vào PDF).
- **Không có khung tên trong PDF** — `opts.title` chỉ là 1 dòng chữ nhỏ góc dưới-trái
  (`pdf.text(opts.title, margin, ph - 6)`), khác hẳn cajetín đầy đủ trong `titleBlock()`. Nếu user
  đã chèn `titleBlock()` vào bản vẽ (entity thật, layer `l-wall`/`l-text`) thì nó **VẪN được vẽ**
  vào PDF như mọi entity khác (vì PDF export duyệt `doc.entities`) — nghĩa là khung tên "sống"
  hiện tại đã đi qua PDF được, chỉ là không tự động, người dùng phải tự chèn trước khi xuất.

Chỗ gọi PDF export duy nhất trong UI: nút trong menu xuất, `CadEditor.tsx:96-108` (`doExportPdf`).
Không có UI chọn khổ giấy nào ở tầng này.

### 1.2 Hệ đo/tỉ lệ/kích thước trong CAD

Đơn vị nội bộ: **mm** (world units) — xác nhận qua comment `lib/cad/pdf.ts:17-28` và toàn bộ
`model.ts` (Entity toạ độ là số mm, `TextEntity.h`/`DimStyle.textHeight` cũng mm thật).

DIMENSION đã đầy đủ 4 kiểu (Nấc 3 CAD-LT-parity, xác nhận đúng memory dự án):

```ts
// lib/cad/model.ts:121
export type DimKind = 'aligned' | 'radius' | 'diameter' | 'angular';
```

`DimStyle` (`store.ts:32-…`, mặc định `{ textHeight: 120, arrowSize: 80, dimScale: 1 }`) điều
khiển cỡ chữ/mũi tên — các giá trị này là mm thật, **nhân thêm `v.scale`** khi vẽ ra màn hình/PDF
để luôn đúng cỡ tương đối theo tỉ lệ bản vẽ hiện tại (đúng nguyên tắc CAD chuẩn: kích thước chữ
số/kích thước ghi không đổi theo zoom, chỉ đổi theo tỉ lệ in).

`dimensionChain()` (`commands.ts:272`) đã có tiện ích ghi chuỗi kích thước liên tiếp — dùng được
ngay cho cạnh ngoài mặt bằng khi làm bản vẽ kỹ thuật hoàn chỉnh.

**Không có khái niệm "tỉ lệ bản vẽ" (drawing scale) là 1 field tường minh ở bất kỳ đâu trong
store/model** — tỉ lệ hiện chỉ tồn tại dưới 2 dạng KHÔNG liên kết nhau: (a) chuỗi tự do trong
`TitleBlockInfo.scale`, và (b) hệ số hình học ẩn tính ra bởi `fitBox()` lúc xuất PDF/PNG. Đây là
khoảng trống kiến trúc cần lấp (§2.2).

### 1.3 Chuẩn hiện có — `lib/cad/standards/`

`lib/cad/standards/iso-drafting.ts` (68 dòng, đọc toàn văn) đã có sẵn 5 rule liên quan trực tiếp
đến việc này — **dùng ngay làm nguồn hằng số, không cần tra lại**:

| Rule id | Nội dung | verified |
|---|---|---|
| `iso128-lineweight-set` | Bộ bề dày nét chuẩn 0.13→2.0mm | `true` |
| `iso128-thick-thin-ratio` | Tỉ lệ nét đậm/mảnh ≥2:1 | `true` |
| `iso216-paper-sizes` | Khổ giấy A0-A4 đầy đủ (mm), params sẵn `a0w/a0h…a4w/a4h` | `true` — **"dùng cho layout in ấn (Nấc 7, chưa triển khai trong app)"**, tự ghi nhận đúng khoảng trống này |
| `iso129-dimension-style-minimal` | Ghi kích thước tối thiểu | `false` — chưa tra điều khoản cụ thể, chỉ định tính |
| `iso7200-titleblock-fields` | Trường khung tên tối thiểu | `false` — liệt kê "tên/mã dự án, tên bản vẽ, tỉ lệ, ngày, người vẽ/kiểm tra", đối chiếu đã khớp field hiện có của `titleBlock()` nhưng chưa tra bảng trường chính thức ISO 7200 |

`params` của `iso216-paper-sizes` đã có sẵn số mm cho cả 5 khổ — **đề xuất tái dùng trực tiếp
làm nguồn chân lý duy nhất** cho khổ giấy in CAD, thay vì định nghĩa lại một bảng khác (tránh
lặp lại đúng loại lỗi "2 nguồn kích thước" mà `stage-presets.ts` đã từng gặp và phải dọn — xem
comment đầu file đó, §1.4).

### 1.4 Presenting — khổ trình bày & xuất PDF/PPTX

`lib/present-editor/stage-presets.ts` (đọc toàn văn) là **nguồn duy nhất** cho kích thước "sân
khấu", đã hợp nhất từ 2 nguồn trùng lặp trước đó (nợ kỹ thuật cũ, đã dọn — xem comment đầu file).
5 khổ hiện có:

```ts
export const STAGE_PRESETS: Record<StagePresetId, StageSize> = {
  '16:9':          stage('16:9', '16:9', 1920, 1080),
  'a4-landscape':  stage('a4-landscape', 'A4 ngang', 1920, 1358),
  'a4-portrait':   stage('a4-portrait', 'A4 dọc', 1358, 1920),
  'a3-landscape':  stage('a3-landscape', 'A3 ngang', 2716, 1920),
  'a3-portrait':   stage('a3-portrait', 'A3 dọc', 1920, 2716),
};
```

File **tự ghi chú rất rõ** (đáng trích nguyên văn vì đúng trọng tâm brief này):

> "Đây là khổ TRÌNH BÀY (màn hình/chiếu) — độ phân giải screen-scale, KHÔNG phải in 300dpi
> (PS-0 audit: render hiện chỉ ~116dpi khi áp lên khổ A3 giấy thật — in nét thật chờ chặng
> Render nâng độ phân giải, NGOÀI PHẠM VI PS-4)."

UI (`components/present-editor/StagePresetPanel.tsx:67`) hiển thị đúng disclaimer này cho người
dùng: "Khổ trình bày (màn hình/chiếu) — dùng để xem trên màn hình/máy chiếu hoặc xuất…". Team
trước đã CHỦ Ý không hứa in production ở đây — đúng kỷ luật, và là tiền đề tốt để xây `paper-mode`
mới (§2.3) mà không phá kỳ vọng người dùng hiện tại về A4/A3 trong Presenting.

Xuất PDF/PNG/PPTX (`lib/present-editor/export.ts`, đọc toàn văn 267 dòng):

- **PDF** (`exportDeckToPdf`): mỗi slide → `renderEditorSlide()` → JPEG full-page →
  `doc.addImage(img, 'JPEG', 0, 0, stage.w, stage.h)`. **Đây là ẢNH, không phải vector** — đúng
  hệt giới hạn mà `lib/cad/pdf.ts` (§1.1) đã tránh được cho CAD. Trung thực 1:1 với editor (mọi
  filter/crop/text-fx) nhưng đổi lại mất khả năng zoom-không-bể + text không chọn được.
- **PNG**: tương tự, đúng W×H của khổ đang chọn (VD A3 ngang = 2716×1920px).
- **PPTX** (`exportDeckToPptx`, `lib/pptx.ts`): **LUÔN xuất khổ 16:9 bất kể `deck.stagePreset`**.
  Comment tại chỗ (`export.ts:8-24`) giải thích rõ nguyên nhân: `lib/pptx.ts` định vị mọi
  text/ảnh bằng **số inch tuyệt đối neo cứng** vào canvas `13.333×7.5in` —

  ```ts
  // lib/pptx.ts:21-22
  const SLIDE_W = 13.333;
  const SLIDE_H = 7.5;
  // …rồi hàng chục nơi dùng trực tiếp: SLIDE_W*0.56, SLIDE_H-0.6, SLIDE_W-2.85…
  ```

  Đổi khung PPTX sang A4/A3 dọc sẽ làm lệch tỉ lệ mọi con số neo cứng này — đúng như comment tự
  nhận, "ngoài phạm vi" đợt trước (PS-4). Với bản vẽ kỹ thuật (thường A3/A1 dọc hoặc ngang, không
  phải 16:9) thì đường PPTX **không dùng được**, PDF là đường duy nhất khả dĩ nhưng đang raster.

### 1.5 Cầu nối CAD→Present ĐÃ CÓ (raster, không phải kỹ thuật)

Đây là phát hiện quan trọng: **brief đề bài coi "cầu nối CAD→Presenting" là việc cần dựng mới,
nhưng một phiên bản đơn giản ĐÃ TỒN TẠI** — chỉ là dùng raster thay vì vector, và không mang theo
dimension/khung tên như dữ liệu có cấu trúc.

`lib/cad/present-handoff.ts` (đọc toàn văn 51 dòng) + nút "Đưa sang Present →"
(`CadEditor.tsx:248-262`):

```ts
// CadEditor.tsx:252-262 — toPresent()
const toPresent = () => {
  const doc = useCadStore.getState().doc;
  if (!doc.entities.length) { /* báo lỗi bản vẽ trống */ return; }
  const dataUrl = renderDocToDataURL(doc, 2000);   // ← RASTER, cạnh dài tối đa 2000px
  stashCadPresentHandoff(dataUrl);
  router.push('/present-editor');
};
```

Cơ chế stash/consume: `sessionStorage` (key `interiorflow.cadPresentHandoff`) + fallback biến
module khi sessionStorage bị chặn — **CÙNG PATTERN** đã dùng cho CAD→Render
(`lib/cad/handoff.ts`) và Render→Present (`lib/present-editor/handoff.ts`). Consume-once: đọc
xong xoá ngay cả 2 nguồn, tránh chèn trùng khi `PresentEditor` remount. `/present-editor` tự
chèn ảnh nhận được thành **1 slide mới**, giống hệt hành vi người dùng tự upload ảnh — không đè
deck có sẵn.

**Kết luận:** hạ tầng "stash + consume qua route SPA" đã có sẵn, ổn định, đã dùng cho 2 luồng
khác. Việc cần làm ở §2.4 là **thay nội dung mang qua** (raster dataURL → SVG có cấu trúc +
metadata khổ giấy/tỉ lệ), **không phải dựng lại cơ chế chuyển route**.

### 1.6 🔴 PHÁT HIỆN QUAN TRỌNG NHẤT — tỉ lệ khai báo KHÔNG khớp tỉ lệ in thật

Đây là điểm phải sửa **trước tiên**, độc lập với mọi kiến trúc mới ở §2, vì nó là lỗi đang tồn
tại ngay trong tính năng CAD PDF export hiện có (`lib/cad/pdf.ts`, đã ship từ Sprint 7):

1. Người dùng mở panel "Khung tên", tự gõ chuỗi **`scale`** (VD `"1:100"`) —
   `components/cad/CadEditor.tsx:720`, `TitleBlockPanel`. Chuỗi này chỉ là TEXT, không có logic
   nào validate hay tính lại từ hình học thật.
2. Khi xuất PDF, `buildCadPdf()` gọi `fitBox(box, pw, ph, margin)` — hàm này tính
   `scale = min((pw-2*margin)/bw, (ph-2*margin)/bh)` để **co giãn bản vẽ vừa khít khổ giấy đã
   chọn** (`model.ts:385-392`). Hệ số `scale` này là một **số thực tuỳ ý** (VD 1:83.4) quyết định
   bởi kích thước mặt bằng thật và khổ giấy — **hoàn toàn không đọc, không liên hệ gì với chuỗi
   `"1:100"`** đã gõ ở bước 1.
3. Kết quả: khung tên trên PDF ghi "Tỷ lệ 1:100", nhưng nếu lấy thước đo khoảng cách trên PDF in
   ra và nhân với tỉ lệ khai báo 100, con số **không khớp** kích thước thật của mặt bằng — sai
   lệch bằng đúng tỉ số giữa `fitBox scale` thật và số đã gõ tay.

**Đây chính xác là rủi ro chủ dự án nêu trong đề bài:** *"gửi bản vẽ ra công trường… thi công cần
đọc được kích thước chính xác… test: đo bằng thước trên PDF in ra phải khớp tỉ lệ khai báo."*
Hiện trạng **KHÔNG đạt test này** — không phải vì thiếu tính năng, mà vì 2 con số tồn tại độc
lập trong code.

**Vì sao chưa ai phát hiện qua sản phẩm thật:** dimension entity (`DimEntity`) tự ghi đúng
khoảng cách đo được bằng mm — nên nếu bản vẽ có ghi kích thước dạng "3200" cạnh tường, con số đó
vẫn ĐÚNG (đơn vị mm thật, không phụ thuộc tỉ lệ trang). Người dùng chỉ bị lừa khi **dùng thước đo
trực tiếp trên tờ giấy** thay vì đọc số ghi kích thước — đúng kịch bản thi công thực tế mà công
trường hay làm khi thiếu con số ghi sẵn ở đúng chỗ cần đo.

→ **Khuyến nghị sửa ngay, độc lập với M1 ở §4:** hoặc (a) tính `scale` thật từ `fitBox()` rồi tự
điền/ghi đè vào khung tên (bỏ ô tự gõ), hoặc (b) đảo chiều — cho user CHỌN tỉ lệ kiến trúc chuẩn
(1:50/1:100/…) rồi `fitBox` phải tôn trọng đúng con số đó (không tự auto-fit nữa, có thể tràn lề
nếu bản vẽ quá lớn cho khổ đã chọn → cảnh báo thay vì âm thầm co giãn). Phương án (b) đúng tinh
thần CAD chuẩn hơn — xem §2.2.

### 1.7 Đối chiếu docs cũ — độ trôi tài liệu

`docs/CAD-LT.md:16` (bảng "Nấc") ghi Nấc 7 *"Layout & in ấn (paper space, khổ giấy, PDF)"* =
**"Chưa — có hằng số ISO 216 tham chiếu nhưng chưa pipeline"**. Đây là **tài liệu đã trôi**:
`lib/cad/pdf.ts` (Sprint 7 Việc 1, đọc header file, rõ ràng làm SAU khi CAD-LT.md được viết) đã
làm xong phần "PDF vector thật", chỉ còn thiếu đúng phần "paper space/khổ giấy chọn được" — tức
Nấc 7 nay ở trạng thái **một phần**, không phải "chưa" toàn bộ. `STATUS.md` (nợ kỹ thuật) ghi
ngắn gọn *"in A3/A4 300dpi chưa khả dụng (đúng phạm vi cũ)"* — câu này **đúng cho Presenting**
(§1.4) nhưng **không hoàn toàn đúng cho CAD** (đã có PDF vector, chỉ thiếu khổ đổi được + khung
tên tự động + validate tỉ lệ). Đề xuất cập nhật STATUS.md/CAD-LT.md sau khi chủ dự án chốt phạm
vi ở tài liệu này (không tự sửa ở đây, đúng luật "báo cáo nghiên cứu không kèm code").

`docs/MULTI-SHEET-PROPOSAL.md` (đã implement Pha 1) xác lập sẵn mô hình "sheet = tab, ≤5
sheet/chặng, snapshot state khi chuyển tab" cho cả CAD và Present. Khái niệm "trang in" đề xuất ở
§2.3 dưới đây **nên tái dùng đúng mô hình sheet này** ở tầng Present (1 "trang in" = 1 sheet đặc
biệt), tránh phát minh lại khái niệm điều hướng đa-tài-liệu lần thứ hai.

---

## 2. ĐỀ XUẤT KIẾN TRÚC

### 2.1 Khung tên (title block) chuẩn hoá thương hiệu TTT

Field hiện có của `TitleBlockInfo` (`commands.ts:165-171`): `project, drawing, scale, author?,
date?`. Đối chiếu ISO 7200 (định tính, `iso7200-titleblock-fields`, chưa verified) + thực hành hồ
sơ DD kiến trúc VN, đề xuất bộ field đầy đủ:

| Field | Có sẵn? | Ghi chú |
|---|---|---|
| Tên dự án / công trình | ✅ `project` | |
| Tên hạng mục (VD "Tầng 1 — Khu A") | ❌ mới | Dự án lớn thường nhiều hạng mục — 1 dự án nhiều bản vẽ |
| Tên bản vẽ (VD "Mặt bằng bố trí nội thất") | ✅ `drawing` | |
| **Số bản vẽ** (VD "KT-01", mã hồ sơ) | ❌ mới | Bắt buộc cho hồ sơ gửi công trường — dùng để tham chiếu chéo giữa các bản vẽ |
| Tỉ lệ | ⚠️ có nhưng SAI (§1.6) | Phải là giá trị **tính ra**, không phải gõ tay |
| Khổ giấy (A0-A4) | ❌ mới, tường minh | Nên hiện luôn trong khung tên — công trường cần biết in đúng khổ nào |
| Ngày | ✅ `date` | |
| Người vẽ | ✅ `author` (field tên chung `VẼ:`) | |
| **Người kiểm** | ❌ mới | Tách khỏi người vẽ — quy trình QA hồ sơ chuẩn luôn có ≥2 người |
| **Người duyệt** | ❌ mới | Có thể optional cho M1, thêm ở M2 khi có luồng duyệt hồ sơ |
| **Logo công ty** | ❌ mới | Tham chiếu `knowledge/ttt-brand/` — logo dạng framed đã chốt cho IF nói chung (`STATUS.md`), nên dùng lại đúng asset đó cho nhất quán, KHÔNG tạo biến thể logo riêng cho khung tên |
| Số hiệu revision | ❌ để M2/M3 | Không cấp bách cho v1 |

Về mặt kỹ thuật, `titleBlock()` hiện sinh **entity CAD thật** (rect/line/text trên layer
`l-wall`/`l-text`) — chèn thẳng vào `doc.entities`, đi qua mọi export (PNG/DXF/PDF) tự động vì
chúng đều duyệt `doc.entities`. **Giữ nguyên cách tiếp cận này cho field text mới** (số bản vẽ,
người kiểm/duyệt) — chỉ mở rộng `TitleBlockInfo` + thêm dòng trong bảng vẽ, không đổi kiến trúc.

Riêng **logo công ty** không nên là CAD entity (ảnh logo là PNG/SVG bitmap phức tạp, không hợp
vẽ lại bằng line/rect) — cần entity mới hoặc dùng ảnh chèn ở layer riêng chỉ hiện trong khung tên
(CAD hiện chưa có "image entity" kiểu này — DXF/canvas vẽ line thuần; ảnh nền chỉ có ở "ảnh hiện
trường" gắn theo pick-point, không phải overlay cố định góc trang). Đơn giản hơn: xử lý logo ở
**tầng Presenting** (SVG/canvas chèn ảnh dễ hơn CAD nhiều) — tức khung tên "sống" đầy đủ (kèm
logo) chỉ hoàn chỉnh ở bước Present, còn khung tên trong CAD giữ vai trò placeholder kỹ thuật
(dùng để canh chỗ, tham chiếu kích thước, không cần đẹp). Đây là lý do §2.3/§2.4 tách rõ trách
nhiệm: **CAD lo đúng số đo, Presenting lo đúng thương hiệu**.

### 2.2 Khổ giấy & tỉ lệ in — auto-fit + override

Đề xuất tách rõ 2 khái niệm hiện đang bị `fitBox()` gộp làm một:

- **Khổ giấy** — kích thước vật lý tờ giấy (mm), lấy trực tiếp từ `params` của rule
  `iso216-paper-sizes` (đã verified, có sẵn số liệu A0-A4) — không định nghĩa lại.
- **Tỉ lệ bản vẽ** — tỉ số mm-giấy : mm-thật, phải là 1 trong **tập giá trị kiến trúc chuẩn**
  (1:20, 1:50, 1:100, 1:200, 1:500 — các mức phổ biến cho mặt bằng nội thất/kiến trúc VN), KHÔNG
  phải số thực tuỳ ý do `fitBox` tính ra.

Cơ chế đề xuất (mẫu, chưa áp):

```ts
// lib/cad/print-scale.ts (MẪU)
export const ARCHITECTURAL_SCALES = [20, 50, 100, 200, 500] as const; // 1:N

/** Tự đề xuất tỉ lệ NHỎ NHẤT (zoom to nhất) trong danh sách chuẩn mà vẫn vừa khổ giấy.
 *  Khác fitBox(): KHÔNG tự do — chỉ chọn trong tập số kiến trúc hợp lệ. */
export function suggestScale(box: Box, paperMm: [number, number], margin: number): number {
  const [pw, ph] = paperMm;
  const bw = box.maxX - box.minX, bh = box.maxY - box.minY;
  const fits = (n: number) => bw / n <= pw - margin * 2 && bh / n <= ph - margin * 2;
  return ARCHITECTURAL_SCALES.find(fits) ?? ARCHITECTURAL_SCALES[ARCHITECTURAL_SCALES.length - 1];
}

/** Viewport THẬT theo tỉ lệ đã chọn — thay fitBox() khi xuất bản vẽ kỹ thuật.
 *  Có thể TRÀN khổ giấy nếu user ép tỉ lệ quá nhỏ số cho bản vẽ quá lớn — đó là hành vi
 *  ĐÚNG (báo lỗi rõ ràng), không âm thầm co giãn như fitBox(). */
export function viewportAtScale(box: Box, scaleN: number, paperMm: [number, number]): Viewport {
  const scale = 1 / scaleN; // mm-giấy / mm-world
  const cx = (box.minX + box.maxX) / 2, cy = (box.minY + box.maxY) / 2;
  return { scale, panX: paperMm[0] / 2 - cx * scale, panY: paperMm[1] / 2 + cy * scale };
}
```

**UX đề xuất:** panel "Khung tên"/"Xuất PDF" hiện dropdown khổ giấy (A0-A4, dùng số liệu
`iso216-paper-sizes`) + dropdown tỉ lệ, **mặc định** gợi ý bằng `suggestScale()` (auto-fit trong
tập chuẩn), cho phép user override tay. Khi override khiến bản vẽ tràn khổ → banner cảnh báo +
gợi ý khổ giấy lớn hơn, **không tự ý đổi tỉ lệ user đã chọn** (giữ quyền quyết định cho người
dùng, đúng "hiến pháp" của `lib/cad/standards/` — chỉ đề xuất, không tự sửa). Giá trị tỉ lệ này
**là nguồn duy nhất** ghi vào khung tên — xoá bỏ hoàn toàn ô `scale` tự gõ tay, khoá lỗi §1.6 tận
gốc.

### 2.3 Chế độ trang in trong Presenting — paper-mode vs luồng riêng

Hai phương án, đối chiếu:

| | **A · "Paper-mode" mới trong Presenting** (đề xuất) | **B · Luồng xuất riêng, không qua Presenting** |
|---|---|---|
| Cách làm | Thêm 1 `StagePresetId` mới nhóm "khổ in kỹ thuật" (khác nhóm "khổ trình bày" hiện có) — layout khác hẳn slide: vùng vẽ cố định + khung tên cố định + lề theo chuẩn, KHÔNG có background/hero image tự do kiểu slide | Trang riêng (VD `/technical-sheet-editor` hoặc modal) chỉ sửa chữ khung tên + bìa, xuất thẳng PDF, không đụng gì tới `EditorDeck`/slide |
| Tái dùng gì | `useEditor`, `TextToolbar`, `Inspector`, hệ thống `EditorSlide.elements` (text/image) đã có sẵn — chỉ thêm 1 `SlideLayout` mới | Chỉ tái dùng `renderEditorSlide()`/jsPDF ở tầng thấp, viết lại toolbar/inspector riêng |
| Chỉnh chữ khung tên + bìa (yêu cầu đề bài) | ✅ Miễn phí — đã có `TextElement` sửa tại chỗ, `Inspector` panel | Phải viết lại từ đầu |
| Đa-trang (nhiều bản vẽ 1 hồ sơ) | ✅ Miễn phí — `PresentSheets.tsx`/`SheetTabBar` đã có (§1.7, Multi-Sheet Pha 1) | Phải tự làm |
| Rủi ro trộn lẫn với slide 16:9 | Cần chặn: paper-mode không cho chọn ảnh nền full-bleed kiểu slide, không cho gõ `stagePreset` khác trong cùng sheet | Không có rủi ro này (tách hẳn) |
| Xuất PPTX | Tự động **loại trừ** paper-mode khỏi luồng PPTX (đã 16:9-only, không hợp bản vẽ kỹ thuật) — cần 1 check ở `export.ts` | Không liên quan PPTX ngay từ đầu |
| Chi phí | Trung bình — thêm field + 1 nhánh layout, không viết lại UI | Cao hơn — trùng lặp toolbar/inspector, 2 nơi bảo trì logic sửa chữ |

**Chọn A.** Lý do chính: yêu cầu đề bài *"chuyển sang chặng Presenting để chỉnh sửa chữ/bìa"* —
đúng nghĩa đen là muốn TÁI DÙNG bộ máy chỉnh sửa đã có của Presenting, không phải xây một trình
soạn thảo riêng. `EditorSlide.elements` đã là model tổng quát (text/image/shape với `frame`) —
"trang in kỹ thuật" chỉ là 1 slide có ràng buộc layout chặt hơn (vùng vẽ cố định theo tỉ lệ đã
khai từ CAD, khung tên là các `TextElement` đặt sẵn vị trí neo lề), không phải một loại dữ liệu
khác. Mô hình sheet đã có (§1.7) cho luôn khả năng "nhiều bản vẽ trong 1 hồ sơ" mà không cần thiết
kế thêm.

**Ràng buộc paper-mode cần có (khác slide thường):**
- Grid layout cố định: vùng ảnh bản vẽ (từ CAD) + dải khung tên dưới/phải + lề theo chuẩn ISO
  216 khuyến nghị (thường ~10mm lề thường, ~20-25mm lề đóng gáy nếu có) — KHÔNG tự do kéo-thả như
  slide 16:9.
- Không hero-image full-bleed kiểu bìa deck — layout kỹ thuật cần lề trắng đều quanh vùng vẽ.
- `deck.stagePreset` cho paper-mode phải phản ánh đúng khổ giấy đã chọn bên CAD (kế thừa, không
  chọn lại tuỳ ý — tránh lệch tỉ lệ khi mang bản vẽ đã fit theo A3 nhưng Presenting lại đặt A4).

### 2.4 Cầu nối CAD→Presenting: "technical sheet object"

**Định dạng trung gian: SVG**, không phải raster PNG/JPEG như handoff hiện có (§1.5) hay export
PDF hiện có của Presenting (§1.4). Lý do:

- **Giữ vector qua toàn bộ chuỗi** — SVG là format vector chuẩn web, browser render native (không
  cần lib ngoài để hiển thị trong `EditorCanvas`), và **`lib/cad/pdf.ts` đã chứng minh khả thi**
  vẽ lại từng entity bằng API hình học — chuyển từ "vẽ ra lệnh jsPDF" sang "vẽ ra path SVG" là
  cùng một tư duy, tái dùng gần như nguyên bộ hàm `drawEntityPdf`/`drawDimPdf`/`drawHatchPdf` chỉ
  đổi target output (path string thay vì lệnh jsPDF).
- **300dpi không còn là vấn đề raster** — SVG không có khái niệm DPI, in ở bất kỳ khổ nào cũng
  sắc nét (khác PNG 2000px hiện tại của handoff CAD→Present, vốn vỡ nét ở khổ lớn — §1.5).
  Raster (PNG 300dpi) chỉ cần thiết nếu Presenting cuối cùng vẫn nhúng ảnh full-page vào PDF như
  hiện tại (`export.ts:31-42`) — SVG giải quyết tận gốc bằng cách **không raster hoá cho tới bước
  cuối cùng** (browser/PDF renderer tự rasterize lúc in, ở độ phân giải máy in thật, không phải ở
  độ phân giải cố định 2000px chọn trước).
- **Giữ được text thật + layer** — SVG `<text>` node giữ nguyên chữ (khác raster nuốt hết thành
  pixel), và có thể gắn `<g id="layer-...">` để giữ khái niệm layer nếu cần mở/tắt sau này.

**Luồng dữ liệu đề xuất:**

```
CAD (doc: Doc)
  │  buildCadSvg(doc, { paperMm, scaleN, dimStyle })   ← MẪU, cùng vị trí lib/cad/pdf.ts
  │  (tái dùng: docBox/fitBox→viewportAtScale (§2.2), BLOCK_MAP, hatchLines/hatchDots,
  │   arcPoints — TOÀN BỘ helper hình học của pdf.ts, chỉ đổi "vẽ ra lệnh SVG" thay vì "lệnh jsPDF")
  ▼
TechnicalSheet {                                        ← MẪU — "technical sheet object"
  svg: string,               // toàn bộ mặt bằng + dimension + hatch, path vector
  paperMm: [number, number], // khổ giấy đã chọn khi xuất từ CAD
  scaleN: number,             // tỉ lệ THẬT (1:N) — nguồn chân lý duy nhất, không phải chuỗi gõ tay
  titleBlock: TitleBlockInfo, // field khung tên đã điền (§2.1) — mang qua để Present prefill, KHÔNG bắt gõ lại
  sourceDocId?: string,       // tham chiếu ngược, phục vụ "cập nhật lại từ CAD" (M3, xem §4)
}
  │  stash qua sessionStorage — TÁI DÙNG NGUYÊN pattern present-handoff.ts (§1.5),
  │  chỉ đổi payload: JSON.stringify(TechnicalSheet) thay vì dataURL PNG
  ▼
Presenting → nút "Đưa sang Presenting" hiện có (CadEditor.tsx:248) mở rộng: nếu đã có
  titleBlock() trong doc.entities → dùng luồng TechnicalSheet (paper-mode, §2.3);
  nếu KHÔNG (bản vẽ thường, như hiện tại) → giữ NGUYÊN hành vi raster cũ (không phá đường demo).
  │  consume → tạo 1 sheet MỚI ở chế độ paper-mode (không phải slide 16:9 thường):
  │    - SVG chèn làm 1 element loại mới `svgElement` (hoặc bọc trong `imageElement` dùng
  │      data:image/svg+xml — cách rẻ hơn nếu không muốn thêm element type mới cho M1) tại vùng
  │      vẽ cố định của layout
  │    - titleBlock prefill vào các TextElement neo sẵn vị trí (project/drawing/scale/date/…)
  │      — người dùng SỬA CHỮ TẠI ĐÂY (đúng yêu cầu đề bài), không sửa trong CAD nữa
  ▼
Xuất PDF chuẩn in — export.ts thêm nhánh: sheet ở paper-mode → dùng lại logic `buildCadPdf`-style
  (vẽ vector) cho vùng SVG + vẽ text layer khung tên bằng jsPDF text thường (đã chỉnh sửa được ở
  Present) → KHÔNG addImage() JPEG như exportDeckToPdf hiện tại. Nếu M1 chưa kịp làm nhánh vector
  riêng, fallback tạm: nhúng SVG rasterize ở độ phân giải TÍNH RA từ khổ giấy × 300dpi (không
  phải số cố định 2000px) — xem §2.5.
```

**Vì sao dùng data:image/svg+xml (data URI) làm phương án rẻ cho M1 thay vì thêm element type
mới ngay:** `ImageElement` (`lib/present-editor/model.ts`) đã có `src: string` nhận bất kỳ URL
nào — trình duyệt render `<img src="data:image/svg+xml;base64,...">` ra ĐÚNG như ảnh vector
(zoom không bể trên màn hình/canvas Present), và khi tới bước xuất PDF thì nhánh vector-thật
(§2.5) mới cần phân biệt "đây là SVG, vẽ lại bằng path" thay vì raster nó. Cách này **không cần
sửa `EditorSlide`/`model.ts`** cho bước hiển thị — chỉ cần sửa ở bước export cuối cùng. Đánh đổi:
M1 nếu chưa kịp làm nhánh export-vector thì tạm raster hoá SVG lúc xuất PDF (fallback), vẫn hơn
hẳn hiện trạng 2000px vì tính DPI theo khổ giấy thật (§2.5) — có thể ship M1 mà không chặn bởi
việc viết renderer SVG→jsPDF-path đầy đủ (việc đó dời sang M2).

### 2.5 Yêu cầu KHÔNG mất độ chính xác kích thước

Nguyên tắc xuyên suốt: **mm là đơn vị neo, không phải pixel**. Toàn bộ chuỗi trên giữ đúng
nguyên tắc này nếu tuân thủ:

1. CAD giữ world units = mm thật (đã đúng, không đổi).
2. `scaleN` (1:N) là số nguyên rời rạc trong tập chuẩn kiến trúc (§2.2) — không phải số thực suy
   ra từ `fitBox`. Đây là con số **duy nhất** quyết định mm-giấy từ mm-world, dùng lại y hệt ở
   MỌI bước sau (SVG, khung tên, PDF cuối) — không được tính lại/suy diễn lại ở bước nào khác.
3. SVG trung gian **không có DPI** (vector) — không mất gì ở bước này.
4. Bước raster hoá CUỐI CÙNG (nếu dùng fallback raster ở §2.4, hoặc khi in) phải tính pixel từ
   công thức: `pixelSize = (paperMm / 25.4) * targetDpi` — VD A1 (841×594mm) ở 300dpi =
   `(841/25.4)*300 ≈ 9933px × (594/25.4)*300 ≈ 7016px`. **Không dùng số cố định như `maxPx=2000`
   hiện tại của `renderDocToDataURL`** (§1.5) — đó chính là nguồn gây vỡ nét khi khổ giấy lớn.
5. **Test chấp nhận (khớp đúng yêu cầu đề bài):** dựng 1 bản vẽ có 1 cạnh tường biết trước chiều
   dài thật (VD 3200mm), xuất PDF ở tỉ lệ đã chọn (VD 1:100), đo bằng công cụ đo trong PDF viewer
   (Acrobat có sẵn "Measure tool" hoạt động đúng nếu PDF là vector đúng đơn vị mm khai trong
   `unit:'mm'` của jsPDF — `lib/cad/pdf.ts:290` đã dùng đúng `unit:'mm'`) → khoảng cách đo được
   phải = 3200/100 = 32mm trên trang, sai số ≤ làm tròn hiển thị. Nên viết test tự động dạng
   "dựng Doc có 1 line biết trước độ dài → build SVG/PDF → parse lại toạ độ path → so khớp" thay
   vì chỉ test bằng mắt — đúng tinh thần `checker.test.ts`/`pdf.node-check.mjs` đã có sẵn trong
   repo cho các tính năng khác.

---

## 3. RỦI RO & GIỚI HẠN

| Rủi ro | Chi tiết | Giảm thiểu |
|---|---|---|
| **Dung lượng file** | PDF vector không phụ thuộc DPI như raster, nhưng bản vẽ nhiều hatch/dimension phức tạp (hàng nghìn path) ở khổ A0/A1 vẫn có thể sinh PDF vài-vài chục MB nếu duyệt trực tiếp; nếu dùng fallback raster 300dpi cho A0 (~10500×7400px) thì 1 JPEG đã ~5-15MB, nhân với nhiều trang trong 1 hồ sơ | Ưu tiên đường vector thật (§2.4 nhánh chính) cho M2 trở đi; nếu fallback raster thì nén JPEG quality vừa phải (đã có tiền lệ `0.92` ở `render.ts:667`, có thể hạ xuống ~0.85 cho bản kỹ thuật vì đây là line-art trắng-đen, không cần chất lượng ảnh màu) |
| **Hiệu năng browser** | jsPDF vẽ hàng nghìn lệnh `line()`/`text()` riêng lẻ (không batch) cho bản vẽ phức tạp — `lib/cad/pdf.ts` hiện chưa có giới hạn/cảnh báo khi doc quá lớn; canvas rasterize ở độ phân giải 300dpi×A0 (~78 triệu pixel) có thể chạm giới hạn bộ nhớ canvas của một số trình duyệt (Safari giới hạn ~16384px/cạnh hoặc ~4096×4096 tuỳ phiên bản — CẦN kiểm tra thực tế trên máy công ty trước khi cam kết A0/A1) | Test thực tế A1/A0 trên Chrome + Safari trước khi công bố hỗ trợ; cân nhắc giới hạn M1 ở A3/A2, mở A1/A0 sau khi đã đo hiệu năng thật (không đoán) |
| **jsPDF có đủ cho khổ kỹ thuật lớn?** | jsPDF hỗ trợ `format: [w, h]` tuỳ ý (đã dùng cho A3 420×297 ở `pdf.ts:290`) — về mặt API đủ cho A0/A1. Rủi ro thật nằm ở (a) hiệu năng vẽ nhiều entity (trên), (b) thiếu OCG (đã ghi nhận, §1.1) không phải giới hạn khổ giấy | Không cần đổi thư viện cho riêng vấn đề khổ giấy; chỉ cân nhắc `pdf-lib` nếu sau này cần OCG/layer bật-tắt thật trong PDF (ngoài phạm vi đợt này) |
| **SVG→PDF-path cho M2** | Viết lại renderer "SVG string → lệnh jsPDF path" (hoặc dùng thẳng file SVG gốc, không qua bước trung gian String) là việc mới, chưa có tiền lệ trong repo — khác với `lib/cad/pdf.ts` vốn vẽ THẲNG từ `Doc` (không qua SVG) | Cân nhắc: có thể KHÔNG cần bước "SVG→PDF" riêng nếu xuất PDF cuối cùng vẫn gọi thẳng `buildCadPdf(doc, {...})` với `doc` gốc (CAD giữ nguyên, không mất) thay vì parse lại từ SVG đã render — SVG chỉ cần thiết cho **hiển thị/chỉnh sửa vị trí trong Presenting**, còn xuất PDF cuối có thể đi thẳng CAD-Doc→PDF, bỏ qua khâu SVG. Cần quyết định ở M2 (xem câu hỏi §6-Q4) |
| **Đồng bộ khi CAD sửa sau khi đã đưa sang Presenting** | Handoff hiện tại (mọi luồng) là **snapshot 1 chiều** — sửa CAD sau đó không tự cập nhật sheet đã tạo ở Presenting. Với bản vẽ kỹ thuật gửi công trường, đây là rủi ro thực (sửa CAD, quên xuất lại PDF, gửi bản cũ) | Ngoài phạm vi M1 (giữ đúng pattern 1-chiều hiện có, nhất quán 3 handoff đã có); đề xuất M3 thêm cảnh báo "bản vẽ nguồn đã đổi kể từ lần đưa sang gần nhất" dựa vào `sourceDocId` + timestamp/hash — KHÔNG tự động đồng bộ ngầm (nguyên tắc "chỉ đề xuất" quen thuộc của `lib/cad/standards/`) |
| **Test đo bằng thước là thủ công** | §2.5 mục 5 đề xuất test tự động parse path, nhưng test "đo bằng thước trên bản in thật" (giấy thật, không phải PDF viewer) vẫn cần làm thủ công ít nhất 1 lần trước khi công bố tính năng — máy in công ty/khổ giấy thật có thể có sai số riêng (fit-to-page mặc định của driver máy in có thể ÂM THẦM co giãn lại nếu người dùng không tắt "Fit to printable area" khi in) | Ghi rõ hướng dẫn "khi in PDF phải chọn 'Actual size / 100%', KHÔNG chọn 'Fit to page'" trong UI xuất PDF — đây là lỗi người dùng thường gặp nằm NGOÀI khả năng kiểm soát của code, nhưng đáng cảnh báo rõ |

---

## 4. PHÂN KỲ ĐỀ XUẤT

| Mốc | Nội dung | Phụ thuộc | Rủi ro |
|---|---|---|---|
| **M0** | 🔴 Sửa lỗi §1.6 NGAY: khoá ô `scale` tự gõ, thay bằng giá trị tính từ `fitBox`/`viewportAtScale`. Việc RẺ NHẤT, ĐỘC LẬP hoàn toàn với M1-M3, nên làm trước hết bất kể M1 có được duyệt hay không | Không | Thấp — sửa 1 điểm, không đổi kiến trúc |
| **M1** | Khổ giấy chọn được trong CAD PDF export (dropdown A0-A4, dùng `iso216-paper-sizes`) + `suggestScale()`/`viewportAtScale()` thay `fitBox` mặc định + mở rộng `TitleBlockInfo` (số bản vẽ, người kiểm/duyệt) — TOÀN BỘ vẫn nằm trong CAD, chưa đụng Presenting | M0 | Thấp — additive, không đổi hành vi PDF export hiện tại nếu giữ default A3 |
| **M2** | Cầu nối `TechnicalSheet` (SVG) + paper-mode trong Presenting (§2.3, §2.4) — nút "Đưa sang Presenting" phân nhánh theo có/không `titleBlock()`. PDF xuất từ paper-mode: fallback raster-đúng-DPI trước (§2.4 nhánh fallback), vector-thật sau nếu kịp | M1 | Trung bình — thêm nhánh layout mới trong Present, cần test kỹ không phá slide 16:9 hiện có |
| **M3** | Vector-thật cho PDF paper-mode (bỏ fallback raster) + logo công ty trong khung tên (Presenting) + cảnh báo "nguồn CAD đã đổi" (đồng bộ 1 chiều có cảnh báo) + test tự động đo path (§2.5 mục 5) | M2 | Trung bình-cao — renderer SVG/vector mới, cần đo hiệu năng A0/A1 thật trước khi mở khổ lớn |
| **M4 (mở, chưa cam kết)** | Revision number, luồng duyệt hồ sơ nhiều cấp, đồng bộ 2 chiều CAD↔Presenting | M3 | Chưa ước lượng — phụ thuộc câu trả lời §6 |

Không ước lượng số ngày công cụ thể ở đây (khác `RESEARCH-ACCESS-CONTROL.md`) vì phạm vi M2/M3
còn phụ thuộc câu trả lời §6-Q4 (vector-thật ngay hay fallback trước) — đề xuất ước lượng công cụ
thể SAU khi chủ dự án chọn hướng.

---

## 5. ĐỐI CHIẾU VỚI YÊU CẦU GỐC

| Yêu cầu chủ dự án | Trả lời ở |
|---|---|
| "Khung tên, trích xuất/canh tỉ lệ, canh lề" | §2.1 (field khung tên) + §2.2 (tỉ lệ chuẩn hoá, khoá lỗi §1.6) + §2.3 (layout paper-mode có lề chuẩn) |
| "Chuyển sang Presenting để chỉnh chữ/bìa" | §2.3 (chọn phương án A — tái dùng bộ máy sửa chữ có sẵn của Presenting, không viết editor riêng) |
| "Xuất PDF bản vẽ kỹ thuật đúng chuẩn in ấn" | §2.4 (SVG trung gian, giữ vector) + §2.5 (nguyên tắc không mất độ chính xác) + §3 (giới hạn 300dpi/hiệu năng) |
| "Cầu nối CAD→Presenting" | §1.5 (đã có 1 phiên bản raster, dùng làm nền) + §2.4 (nâng cấp lên `TechnicalSheet` SVG) |
| "Không được mất độ chính xác kích thước" | §1.6 (lỗi hiện có, ưu tiên sửa M0) + §2.5 (nguyên tắc + test chấp nhận cụ thể) |
| Đúng phạm vi cũ (`/cad-editor` chỉ cần mức sơ phác DD, không thành CAD pro) | Toàn bộ đề xuất KHÔNG thêm CAD pro feature (không OCG thật, không paper-space AutoCAD-style đầy đủ) — chỉ đủ để 1 bộ hồ sơ DD ra được PDF đúng tỉ lệ, đúng tinh thần `docs/CAD-ROADMAP.md`/scope đã chốt |

---

## 6. CÂU HỎI CẦN CHỦ DỰ ÁN QUYẾT

| # | Câu hỏi | Khuyến nghị |
|---|---|---|
| **Q1** | Khổ giấy công trường thực tế dùng là **A3 hay A1**? (ảnh hưởng trực tiếp ưu tiên M1 mở khổ nào trước, và mức độ khẩn của rủi ro hiệu năng §3) | Chưa có dữ liệu thật — cần hỏi. Nếu công trường chủ yếu in A3 (phổ biến hơn cho hồ sơ nội thất VN), M1 có thể dừng ở A3/A2, hoãn A1/A0 sang M3 sau khi đo hiệu năng. |
| **Q2** | Mẫu khung tên chuẩn thật của TTT — có file mẫu (VD từ hồ sơ đã gửi công trường trước đây) để đối chiếu field/bố cục không? Hiện đề xuất ở §2.1 suy từ ISO 7200 định tính + thực hành chung, chưa có mẫu thật của công ty. | Cần mẫu thật trước khi khoá field cuối cùng — tránh làm 2 lần. |
| **Q3** | Logo trong khung tên — dùng **logo framed** đã chốt chung cho IF (`STATUS.md`), hay cần 1 biến thể logo riêng "chế độ in ấn" (VD đơn sắc, không nền, để không tốn mực khi in đen-trắng)? | Khuyến nghị đơn sắc/outline cho khung tên in — logo màu đầy đủ trên PDF đen-trắng in ra sẽ chỉ ra 1 khối xám, không đẹp. Nhưng đây là quyết định thương hiệu, cần chủ dự án/TTT Brand xác nhận. |
| **Q4** | M2 nên xuất PDF paper-mode qua **nhánh vector-thật ngay** (chi phí cao hơn, đúng chuẩn ngay từ đầu) hay **fallback raster-đúng-DPI trước** (rẻ hơn, ship nhanh, nâng cấp sau ở M3)? | Khuyến nghị fallback trước — cho phép M2 ship sớm hơn để chủ dự án thấy luồng đầu-cuối hoạt động, miễn là DPI tính đúng theo khổ giấy (§2.5 mục 4) chứ không phải số cố định 2000px như hiện tại. |
| **Q5** | Người kiểm/người duyệt trong khung tên — có cần gắn với tài khoản đăng nhập thật (dropdown chọn từ danh sách user công ty) hay chỉ là ô text tự gõ như `author` hiện tại? | Nếu `RESEARCH-ACCESS-CONTROL.md` (đã có, chờ quyết) được triển khai với `ProjectMember`, có thể liên kết thật (chọn từ thành viên dự án) — nhưng đó là phụ thuộc chéo giữa 2 báo cáo nghiên cứu, cần chủ dự án xác nhận thứ tự làm trước. Tạm thời **text tự gõ** cho M1, không chặn lẫn nhau. |
| **Q6** | Bản vẽ kỹ thuật gửi công trường có cần watermark/bảo mật (chỉ xem, không chỉnh sửa được) như `deck.watermark` đã có cho Present, hay đây là tài liệu chính thức không cần watermark? | Khuyến nghị KHÔNG watermark cho hồ sơ kỹ thuật chính thức (khác tài liệu trình bày/pitch) — nhưng nêu để xác nhận, vì cơ chế watermark đã có sẵn (`deck.watermark`, dùng trong `renderEditorSlide`) nên bật/tắt là việc rẻ nếu cần. |
| **Q7** | "Trang in" trong Presenting có cần persist riêng biệt khỏi deck slide thường (VD file `.idf` tách "hồ sơ kỹ thuật" khỏi "deck trình bày"), hay chung 1 deck có cả 2 loại sheet trộn lẫn? | Đề xuất **chung 1 deck**, khác biệt chỉ ở `SlideLayout`/`stagePreset` của từng sheet (đúng mô hình Multi-Sheet Pha 1 đã có, §1.7) — tránh thêm 1 loại file mới. Cần xác nhận không có yêu cầu nghiệp vụ nào buộc tách riêng (VD phân quyền khác nhau giữa 2 loại tài liệu — liên quan Q5/`RESEARCH-ACCESS-CONTROL.md`). |

---

*Hết. Không có thay đổi code nào kèm theo tài liệu này.*
