# RESEARCH — Hệ thống XUẤT chặng CAD (Transparent PNG → Present + Hộp thoại PLOT chuẩn AutoCAD)

> Task #13 · docs-only · nhánh `research/cad-export`. KHÔNG code — chỉ audit + đề xuất.
> Nguồn sự thật đã đọc: `lib/cad/pdf.ts`, `lib/cad/render.ts`, `lib/cad/model.ts` (B1 paper/scale),
> `lib/cad/present-handoff.ts`, `components/cad/CadEditor.tsx`, `components/present-editor/{PresentEditor,Element}.tsx`.

---

## A. AUDIT — Export CAD hiện tại đang có gì

### A.1 · Ba đường xuất PNG (đều RASTER, đều NỀN ĐẶC — đây là gốc lỗi user báo)

| Hàm | File | Nền tô | Định dạng | Dùng ở đâu |
|---|---|---|---|---|
| `renderDocToDataURL(doc, maxPx, pad)` | `lib/cad/render.ts:594` | `#ffffff` **ĐẶC** (`ctx.fillRect`) | `canvas.toDataURL('image/png')` | Export PNG · "Đưa sang Rendering" · **"Đưa sang Presenting"** (`toPresent`) |
| `renderZoneMapToDataURL(doc, maxPx, pad)` | `lib/cad/render.ts:567` | `#FAF7F1` **ĐẶC** (beige) | PNG | Zone panel → "Xuất Presenting" (`exportZoneMapToPresent`) |
| `buildCadPdf` / `exportCadToPdf` | `lib/cad/pdf.ts` | không tô nền (giấy) | **PDF vector** | Menu Xuất → PDF |

Cả hai hàm PNG **luôn `ctx.fillStyle=<màu>; ctx.fillRect(0,0,W,H)`** trước khi vẽ entity ⇒ ảnh ra là
PNG có kênh alpha nhưng **mọi pixel đục** (nền trắng/beige phủ kín). PNG format hỗ trợ trong suốt,
nhưng code chủ động lấp nền.

### A.2 · Đường đi vào slide Presenting (xác nhận nền che bố cục)

`CadEditor.toPresent()` (`CadEditor.tsx:274`):
```
renderDocToDataURL(doc, 2000)  →  stashCadPresentHandoff(dataUrl, {snapshot, fromRole})
                               →  router.push('/present-editor')
```
`PresentEditor.tsx:283` consume-once, tạo **1 slide mới**:
```
d.slides.push({
  background: '#F1ECE3',                       // nền slide beige TTT
  elements: [ makeText(kicker…),
              makeImage(dataUrl, {frame:{x:5,y:12,w:90,h:84}}) ]   // ảnh CAD 90%×84% slide
})
```
Ảnh render bằng `ImageInner` (`Element.tsx:422`): `backgroundImage:url(...)`, `backgroundSize:'cover'`,
**KHÔNG áp nền trắng riêng**. Nghĩa là:

- **Hiện tại:** PNG nền trắng đục ⇒ 1 khối trắng 90×84 đè lên nền slide `#F1ECE3` và mọi element bên dưới → đúng lỗi user ("nền trắng che mất bố cục slide").
- **Nếu PNG trong suốt:** `cover` sẽ cho nền slide + element phía dưới **lộ qua vùng trống** của bản vẽ → đúng ý user. (Lưu ý `cover` có thể crop mép nếu tỉ lệ khung ≠ tỉ lệ ảnh — xem C1.)

Kết luận A: **Xuất sang Present hiện là PNG NỀN ĐẶC (trắng cho bản kỹ thuật, beige cho zone map), KHÔNG transparent.** Wiring để hiển thị trong suốt đã sẵn (ImageInner không lấp nền) — chỉ cần đổi tầng render ra ảnh.

### A.3 · PDF hiện tại (B1 đã làm — KHÔNG làm lại)

`exportCadToPdf` đã có sẵn, TÁI DÙNG được nhiều:
- **Khổ giấy:** `opts.paper` > `docPaperMm(doc)` (`paperKey` A3/A2/A1 per-sheet) > A3 mặc định.
- **Tỉ lệ:** `doc.printScale` (1:N chuẩn) + `fitsAtScale` → `fixedScaleViewport` ("plot to scale"); không đặt/không lọt → `fitBox` auto-fit. Nhãn "1:N" tính lại thật, ghi đè ô tỉ lệ khung tên.
- **Lề:** `opts.margin` > `DEFAULT_PDF_MARGIN_MM = 15` (CỐ ĐỊNH, chưa cho chỉnh).
- **Lineweight:** mm giấy thật (không nhân zoom) — chuẩn plot.
- **Layer ẩn:** layer `visible=false` → không vẽ (`pdf.ts:398`). KHÔNG có OCG (jsPDF 4.2.1) → không bật/tắt layer trong PDF viewer.
- **Vector thật:** vẽ lại từng entity bằng jsPDF (line/rect/circle/triangle/text), text chọn được.

**Thiếu (so với PLOT AutoCAD):** không có hộp thoại — mọi thứ hardcode. Không chọn: vùng in (luôn full extents), hướng giấy (khổ luôn ngang), mono/màu, lề tuỳ biến, center/offset, custom paper (A4/A1/A0), multi-sheet publish, khổ dọc.

---

## B. AUTOCAD PLOT / PUBLISH — Bản đồ tính năng tham chiếu

Hộp thoại **PLOT** (Ctrl+P) của AutoCAD, ánh xạ mức độ cần cho IF (mức "sơ phác hồ sơ DD"):

| # | Tuỳ chọn AutoCAD | Ý nghĩa | IF cần? | Ghi chú map |
|---|---|---|---|---|
| 1 | **Printer/Plotter** | Chọn thiết bị/DWG-to-PDF | ✅ (cố định = PDF) | IF chỉ 1 "máy in ảo" = jsPDF. Không cần dropdown. |
| 2 | **Paper Size** | A4/A3/A2/A1/A0 + custom | ✅ **M1** | B1 có A3/A2/A1. **Bổ sung A4, A0 + custom W×H.** |
| 3 | **Plot Area** | Display / **Extents** / **Window** / Limits(Layout) | ✅ **M1** (Extents + Window) | Hiện luôn Extents (`docBox`). Thêm **Window** (khoanh vùng) rất giá trị cho hồ sơ. Display/Limits bỏ (IF không có paper-space layout). |
| 4 | **Plot Scale** | Fit to paper ↔ 1:N chuẩn | ✅ **ĐÃ CÓ** (B1) | `printScale` + `STANDARD_SCALES`. Thêm A4/A0 vào bảng fit. |
| 5 | **Plot Offset** | Center the plot / X-Y offset | 🟡 **M1** (chỉ "center") | `fixedScaleViewport` đã center sẵn. Chỉ cần **checkbox "Căn giữa"** (mặc định bật). X/Y offset thủ công → M2. |
| 6 | **Plot Style Table (CTB/STB)** | Ánh xạ màu→nét/màu in, **monochrome/grayscale** | 🟡 M1 chỉ **Monochrome**, phần còn lại M2 | Mono = ép toàn bộ nét đen (`forceColor` đã có ở render.ts, PDF thêm cờ). Grayscale + bảng CTB đầy đủ → M2, ít giá trị ở mức DD. |
| 7 | **Lineweights** | Bật hiện lineweight, scale theo tỉ lệ | ✅ **ĐÃ CÓ** | `lineWidthMmOf` = mm giấy thật. Thêm **checkbox "In theo lineweight"** vs "nét đồng nhất". |
| 8 | **Drawing Orientation** | Portrait / **Landscape** / plot upside-down | ✅ **M1** (P/L) | Hiện khổ luôn ngang. Thêm **toggle Dọc/Ngang** = hoán đổi `[w,h]`. Upside-down bỏ. |
| 9 | **Shaded Viewport Options** | Render/hidden/wireframe của 3D viewport | ❌ bỏ | IF 2D thuần, không liên quan. |
| 10 | **Number of copies** | Số bản in | ❌ bỏ | Vô nghĩa với file PDF. |
| 11 | **What to plot / PUBLISH** | Nhiều sheet → 1 PDF nhiều trang | 🟡 **M2** | IF có nhiều sheet (`CadSheets.tsx` + `.idf`). Publish = 1 PDF nhiều trang rất hợp hồ sơ, nhưng để M2. |
| 12 | **Preview** | Xem trước bản in | ✅ **M1** (nên có) | Preview thu nhỏ trước khi tải — tránh in sai khổ. |
| — | **Margin / lề** | (AutoCAD qua printable area) | ✅ **M1** | Hiện cố định 15mm. Cho chỉnh (0–30mm) hoặc preset. |

---

## C. ĐỀ XUẤT CHO IF

### C1 · Transparent PNG → Present (ưu tiên CAO — đúng lỗi user)

**Vấn đề:** `renderDocToDataURL`/`renderZoneMapToDataURL` lấp nền đục.

**Giải pháp — thêm tham số `background`, KHÔNG phá caller cũ:**

Sửa `lib/cad/render.ts` (additive, mặc định giữ hành vi cũ):
```ts
// render.ts
export function renderDocToDataURL(
  doc: Doc, maxPx = 2000, pad = 80,
  opts: { background?: string | null } = {},   // MỚI; undefined ⇒ '#ffffff' (cũ)
): string {
  ...
  const bg = opts.background === undefined ? '#ffffff' : opts.background;
  if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H); }   // bg=null ⇒ BỎ fillRect ⇒ trong suốt
  ...
}
```
Tương tự `renderZoneMapToDataURL` (mặc định `'#FAF7F1'`, cho phép `null`).

**Canvas alpha:** `document.createElement('canvas')` mặc định `getContext('2d')` đã có alpha — không cần `{alpha:true}`. Bỏ `fillRect` là đủ để `toDataURL('image/png')` giữ vùng chưa vẽ trong suốt. **Nét/màu layer giữ nguyên** (drawEntities không đổi).

**Lưu ý poché tường (hatch SOLID):** vùng tường vẫn tô đặc theo màu layer (đúng — đó là nét vẽ, không phải nền trang). Chỉ vùng GIẤY TRỐNG mới trong suốt.

**Wiring vào Present — cho user CHỌN nền khi bàn giao.** Sửa `CadEditor.toPresent()`:
```ts
// thêm state: presentBg: 'transparent' | 'white' | 'beige' (mặc định 'transparent')
const dataUrl = renderDocToDataURL(doc, 2000, 80, {
  background: presentBg === 'transparent' ? null
            : presentBg === 'beige' ? '#F1ECE3' : '#ffffff',
});
```
UI: đổi nút "Đưa sang Presenting" thành **split-button / menu nhỏ** 2–3 lựa chọn:
- **Nền trong suốt (ghép slide)** — mặc định, đúng ý user.
- **Nền trắng (nguyên trang)** — khi muốn 1 tấm độc lập.

**`objectFit` crop:** `ImageInner` dùng `backgroundSize:'cover'` → ảnh tỉ lệ khác khung 90×84 sẽ **bị cắt mép**. Với PNG trong suốt điều này càng lộ (mất 1 phần bản vẽ). **Khuyến nghị:** khi chèn slide CAD, set frame khớp tỉ lệ ảnh HOẶC đổi element này sang `contain`. Đơn giản nhất ở C1: trong `PresentEditor` block consume, tính `w/h` frame theo aspect ratio thật của bản vẽ (`docBox`) để không phải đụng `ImageInner`. (Snapshot Doc đã kèm trong payload `present-handoff` → tính được aspect.)

**Files đụng:** `lib/cad/render.ts` (2 hàm, thêm opts) · `components/cad/CadEditor.tsx` (`toPresent`, `exportZoneMapToPresent`, nút) · `components/present-editor/PresentEditor.tsx` (frame theo aspect — tuỳ chọn). **Effort: S.**

**Bảng nền theo bối cảnh (cho user chọn):**

| Nền | Khi nào | Giá trị `background` |
|---|---|---|
| Trong suốt | Ghép vào slide có bố cục/nền sẵn (mặc định) | `null` |
| Trắng | Tấm bản vẽ độc lập, nguyên trang | `'#ffffff'` |
| Beige TTT | Zone map / muốn khối ảnh liền nền TTT | `'#F1ECE3'` |

---

### C2 · Hộp thoại Xuất PDF đầy đủ (kiểu PLOT)

**Nguyên tắc:** tận dụng tối đa B1 (`printScale`, `paperKey`, `docPaperMm`, `fixedScaleViewport`,
`fitsAtScale`, `STANDARD_SCALES`, `docScaleLabel`). Thêm **state cấu hình PLOT tách khỏi Doc**
(không lưu per-sheet vì là lựa chọn lúc in, trừ paper/scale đã ở Doc).

**Schema mới (additive) — `lib/cad/plot.ts`:**
```ts
export interface PlotConfig {
  paper: PaperKey | { w: number; h: number };   // mở rộng: + 'A4' | 'A0' | custom
  orientation: 'landscape' | 'portrait';         // hoán [w,h]
  scale: number | 'fit';                          // = doc.printScale hoặc 'fit'
  area: { kind: 'extents' } | { kind: 'window'; box: Box };  // Extents | Window
  center: boolean;                                // Plot offset "center the plot"
  marginMm: number;                               // lề (mặc định 15)
  monochrome: boolean;                            // ép nét đen (plot style tối thiểu)
  useLineweights: boolean;                        // true=mm thật · false=nét đồng nhất
  title?: string;
}
```
Map sang `CadPdfOptions` hiện có (mở rộng `buildCadPdf` để nhận `area`/`orientation`/`monochrome`):
- `paper`+`orientation` → `opts.paper = orientation==='portrait' ? [h,w] : [w,h]`.
- `scale` → `doc.printScale` tạm override (hoặc thêm `opts.printScale`).
- `area.window` → thay `docBox(doc)` bằng `box` do user khoanh (thêm `opts.box?`).
- `center` → đã mặc định trong `fixedScaleViewport`; auto-fit `fitBox` cũng center.
- `monochrome` → thêm `opts.forceColor='#111'` → `drawEntityPdf` bỏ `layerColorOf`.
- `useLineweights=false` → `lineWidthMmOf` trả hằng số (vd 0.25mm).

**PANEL UI (mock ASCII):**
```
┌─ XUẤT PDF · Plot to PDF ───────────────────────────┐
│ Khổ giấy   [A3 ▼] (420×297)     Hướng [◉ Ngang ○ Dọc]│
│ Tỉ lệ      [1:100 ▼  — gợi ý]   ☑ Căn giữa trang     │
│ Vùng in    [◉ Toàn bản vẽ  ○ Khoanh vùng…]           │
│ Lề (mm)    [ 15 ]───────○                            │
│ Nét        ☑ In theo lineweight   ☐ Đen trắng (mono) │
│ ─────────────────────────────────────────────────── │
│  ⚠ 1:100 lọt khổ A3 · nhãn khung tên: 1:100          │
│                                                       │
│  [ Xem trước ]              [ Huỷ ]  [ Xuất PDF ]     │
└───────────────────────────────────────────────────────┘
```
- Tái dùng nguyên `<select>` khổ giấy + tỉ lệ đang có trong `TitleBlockPanel` (CadEditor.tsx:804–830) — tách thành component `PlotPanel` dùng chung, để "khung tên" và "xuất PDF" đọc CÙNG state (không lệch số như lỗi §1.6 đã fix).
- Cảnh báo "không lọt khổ" tái dùng `fitsAtScale`/`suggestStandardScale` (đã có).
- "Khoanh vùng" = tool tạm trên canvas trả `Box` (giống rubber-band select đã có).

**Ưu tiên trong C2:**
- **M1 (làm trước):** khổ (thêm A4/A0/custom) · orientation · tỉ lệ (có sẵn) · vùng in Extents/Window · center · lề chỉnh được · monochrome · useLineweights · preview.
- **M2 (sau):** plot style table CTB đầy đủ + grayscale · X/Y offset thủ công · **Publish nhiều sheet → 1 PDF** (cần `CadSheets` cấp danh sách Doc; jsPDF `addPage` mỗi sheet).

---

### C3 · Bảng ưu tiên + effort + thứ tự

| Thứ tự | Hạng mục | Effort | Files chính | Ghi chú |
|---|---|---|---|---|
| **1** | C1 transparent PNG → Present (opts.background=null) + nút chọn nền | **S** | `render.ts`, `CadEditor.tsx` | **Đúng lỗi user #1**, rẻ, độc lập. Làm ngay. |
| **2** | C1b frame Present theo aspect (khỏi crop `cover`) | **S** | `PresentEditor.tsx` | Đi kèm #1 cho tròn; hoặc để riêng. |
| **3** | C2-M1 `PlotPanel` + `PlotConfig` (khổ+hướng+area+center+lề+mono) | **M** | `plot.ts` (mới), `pdf.ts` (mở rộng opts), `CadEditor.tsx`, tách `PlotPanel` | Tái dùng B1; công lớn nhất ở `buildCadPdf` nhận `box`/`orientation`/`forceColor`. |
| **4** | C2-M1 thêm khổ A4/A0 + custom W×H | **S** | `model.ts` (`PAPER_SIZES_MM`), `PlotPanel` | `PaperKey` thành union rộng hơn hoặc tách bảng. |
| **5** | C2-M1 tool "Khoanh vùng" (Window) trả Box | **M** | canvas tool + `PlotPanel` | Có thể tái dùng rubber-band hiện có. |
| **6** | C2-M2 Publish nhiều sheet → 1 PDF | **M** | `pdf.ts` (`addPage` loop), `CadSheets.tsx` | Cần API list Doc từ sheets. |
| **7** | C2-M2 Plot style table (CTB) + grayscale | **L** | `plot.ts`, `pdf.ts`, `render.ts` | Giá trị thấp ở mức DD — làm cuối. |

**Tận dụng từ B1 (KHÔNG làm lại):** `PAPER_SIZES_MM`, `STANDARD_SCALES`, `suggestStandardScale`,
`fixedScaleViewport`, `fitsAtScale`, `docPaperMm`, `docScaleLabel`, `fitScaleLabel`, `applyRealScaleToTitleBlock`,
toàn bộ `drawEntityPdf` (chỉ thêm cờ `forceColor`), layer-hidden filter, `printScale`/`paperKey` per-sheet.

**Mới hoàn toàn:** `opts.background` (render PNG trong suốt) · `PlotConfig` + `PlotPanel` · `orientation` (hoán w/h) · `area.window` (box tuỳ chọn thay `docBox`) · monochrome cờ ở PDF · preview thu nhỏ · (M2) multi-page publish.

**Giới hạn giữ nguyên (đã tài liệu hoá ở `pdf.ts`):** jsPDF 4.2.1 KHÔNG OCG → PDF không bật/tắt layer trong viewer. Muốn OCG thật phải đổi `pdf-lib` — ngoài phạm vi, không đề xuất ở đây.

---

## TÓM TẮT 1 DÒNG
Xuất sang Present hiện là **PNG nền ĐẶC** (trắng/beige) → che slide; sửa rẻ (S) bằng `opts.background=null` để ra **PNG trong suốt** (wiring `ImageInner` đã sẵn). PDF đã có nền B1 vững (khổ+tỉ lệ+lineweight+layer-hidden) — chỉ cần bọc **`PlotPanel`** map các tuỳ chọn PLOT (khổ/hướng/vùng-in/center/lề/mono) ở M1, publish-multi-sheet + CTB ở M2.
