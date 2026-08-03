# SPEC · VE-LAYOUT-PAPER — Layout/Paper Space cho mode Chuyên
**Ngày:** 04/08/2026 · **Vai lập:** COWORK-VẼ · **Trạng thái:** ĐỀ XUẤT (ship-trước-sửa-sau, hậu kiểm ca đêm)
**Kinh gốc:** `SPEC-CAD-MODES` §4 (lỗ thủng lớn nhất của Pro) · **Nguồn NC:** `docs/nc/NC-xuat-pdf-in-2026-08-02.md` · **Nối:** `MULTI-SHEET-PROPOSAL` · `CHOT-BRAND-KIT` (khung tên đọc Brand Kit dự án)
**§0b đã chạy đủ 3 bước:** SEARCH (grep pdf.ts·model.ts·commands.ts·CadSheets.tsx 04/08) · NGHIÊN CỨU (NC-5 + chuẩn AutoCAD plot/Revit sheet) · NGƯỜI DÙNG THẬT (§0d dưới).

## 0 · NGƯỜI DÙNG ĐÍCH + NGUYÊN TẮC
**§0d — nghĩ như hoạ viên nộp hồ sơ:** thứ họ cần cuối ngày là BỘ GIẤY: mỗi tờ đúng khổ, khung tên đủ, số tờ chạy đúng, và **đặt thước lên bản in đo được đúng tỉ lệ**. Thứ họ SỢ nhất ở AutoCAD paper space: lỡ zoom trong viewport → tỉ lệ sai cả tờ mà không biết, in ra mới lòi. Revit/ArchiCAD giải bằng khoá view trên sheet — dân nghề 10 năm nay đã quen chuẩn đó.
1. **Đắp không đập:** multi-sheet tab (mỗi tab 1 Doc) GIỮ NGUYÊN làm model space. Layout = LOẠI TAB MỚI đứng cạnh, additive.
2. **Viewport mặc định KHOÁ** — không có "double-click vào VP chỉnh model" kiểu MSPACE (nguồn lỗi kinh niên AutoCAD). Một kiểu, giống quyết định nối tường MỘT kiểu.
3. In từ layout = 1:1 mm giấy, **CẤM fit-to-paper** (NC-5 §3 #4).

## 1 · HIỆN TRẠNG — kiểm bằng lệnh 04/08, SỬA nhận thức SPEC-CAD-MODES (26/07)
| SPEC-CAD-MODES ghi | Sự thật code hôm nay | Bằng chứng |
|---|---|---|
| "Xuất bộ hồ sơ ⬜" | **ĐÃ CÓ**: nhiều tờ → 1 PDF, trang mục lục (số tờ·tên·khổ·tỉ lệ), bookmark jsPDF outline, tôn trọng khổ/tỉ lệ riêng từng tờ | `buildSheetSetPdf` `lib/cad/pdf.ts:490` (2.1.8.k) |
| "Tỉ lệ viewport 🟡 chưa rõ mức nào" | **ĐÃ CÓ nền**: `Doc.printScale` + `fixedScaleViewport()` + `fitsAtScale()` (fallback auto-fit an toàn) + `applyRealScaleToTitleBlock` ghi đè ô tỉ lệ lúc xuất | `model.ts:563-596` · `pdf.ts:70` |
| "Khung tên ✅" | Đúng — `titleBlockPro` ISO 7200 song ngữ, kích thước theo KHỔ GIẤY (180×42mm nhân scaleN), Brand Kit per-project | `commands.ts:251` |
| Lineweight/font | mm-giấy ISO 128 trực tiếp + font Việt nhúng `ensureVietnameseFont` (fix #25) | `pdf.ts:22-35` |
**⇒ Lỗ thủng còn lại ĐÚNG MỘT THỨ** (chẩn đoán 26/07 vẫn đúng): các tờ là Doc rời — sửa model phải sửa từng tab tay; không có tờ nhiều-viewport nhiều-tỉ-lệ. Spec này chỉ xây đúng mảnh đó, mọi thứ khác CẮM vào hạ tầng sẵn.

## 2 · KIẾN TRÚC — Layout tab + ViewportEntity
### 2a · Loại tab mới trong CadSheets (additive)
```ts
// CadSheets.tsx / sheets-persist: SheetTab thêm
kind?: 'model' | 'layout';          // undefined = 'model' (bộ sheet cũ không breaking)
// Layout tab vẫn giữ 1 Doc — nhưng QUY ƯỚC ĐƠN VỊ = MM GIẤY (không phải mm world):
// entities của layout-doc = ghi chú giấy + khung tên + ViewportEntity. paperKey/orientation dùng field Doc sẵn có.
```
Không đổi cơ chế hoán store của CadSheets — layout tab hoán như mọi tab. Trần 5 sheet hiện tại: layout tính chung trần (đủ cho hồ sơ nội thất nhỏ; nới trần = việc riêng, không thuộc spec này).
### 2b · `ViewportEntity` — type mới trong union (tiền lệ zone/room: additive, `.idf` cũ không breaking)
```ts
interface ViewportEntity extends Base {   // type: 'viewport' — CHỈ hợp lệ trong layout-doc
  x: number; y: number; w: number; h: number; // rect trên GIẤY (mm giấy)
  targetSheetId: string;   // model sheet được nhìn
  centerWorld: Pt;         // tâm vùng nhìn (mm world của sheet đích)
  scaleN: number;          // 1:N — thang chuẩn: 1·2·5·10·20·25·50·100·200·500, mặc định 50
  locked: boolean;         // mặc định TRUE từ lúc tạo
  layerVis?: Record<string, boolean>; // override ẩn/hiện layer RIÊNG viewport này (VD tờ chi tiết tắt l-dim của MB)
}
```
Là Entity ⇒ hưởng FREE toàn bộ pipeline sẵn có: select/move/grips resize/undo/copy — không chế hệ thao tác mới.
### 2c · Render viewport (điểm móc)
- `render.ts` nhận thêm resolver optional: `renderDoc(…, { getSheetDoc?: (id) => Doc | null })` — CadSheets truyền xuống (nó đã giữ snapshot mọi sheet trong ref).
- Vẽ VP: clip theo rect → vẽ doc đích bằng viewport suy từ `fixedScaleViewport(box quanh centerWorld, [w,h], scaleN)` (hàm SẴN, đổi input paperMm = rect VP) → viền mảnh `--muted` + nhãn góc "1:50" nhỏ.
- `targetSheetId` không còn tồn tại (tab bị xoá) → VP vẽ nền gạch chéo + nhãn "Tờ nguồn đã xoá" (khuôn lỗi `SPEC-NGON-NGU-CHI-DAN`), KHÔNG crash, KHÔNG tự xoá VP.
- Đồng bộ: KHÔNG cần cơ chế observer — render layout luôn đọc doc đích MỚI NHẤT qua resolver tại thời điểm vẽ ⇒ "sửa model, mọi tờ tự cập nhật" tự có, zero code sync.

## 3 · HÀNH VI
| Việc | Cách làm |
|---|---|
| Tạo layout | nút ＋ tab có 2 lựa: "Tờ vẽ (model)" / "Tờ in (layout)" — layout hỏi 1 câu: khổ (A4/A3/A2/A1 + ngang/dọc, mặc định A3 ngang = `DEFAULT_PDF_PAPER_MM`) |
| Tạo layout NHANH từ model sheet | chuột phải tab model → "Tạo tờ in từ tờ này": layout mới + 1 VP full-giấy-trừ-lề + khung tên, scaleN tự chọn = nấc chuẩn LỚN NHẤT mà `fitsAtScale` đạt (không bao giờ lấy tỉ lệ lẻ) |
| Đặt VP mới | lệnh `VP` (chỉ hiện trong layout tab): kéo rect trên giấy → chọn sheet đích (danh sách tab model) → tự căn `centerWorld` = tâm docBox, scaleN như trên |
| Chỉnh vùng nhìn | chọn VP → Inspector: dropdown scaleN thang chuẩn · nút "Căn vùng nhìn" = nhảy sang tab model đích với overlay khung mờ đúng cỡ VP (kéo thả đặt vị trí, Enter chốt `centerWorld`, Esc huỷ) — KHÔNG pan/zoom trực tiếp trong VP (nguyên tắc 2) |
| locked | VP luôn locked với pan/zoom; unlock CHỈ mở khoá move/resize RECT trên giấy (đổi cửa sổ nhìn, không đổi tỉ lệ) — đổi scaleN luôn qua Inspector, có chủ đích |
| Layer override | Inspector VP: bảng layer của sheet đích + toggle mắt riêng VP (`layerVis`) — đúng nhu cầu tờ chi tiết tắt dim/hatch của MB |
| Khung tên | lệnh `TB` trong layout đặt `titleBlockPro(at, info, …, scaleN = 1)` — layout là mm giấy nên k=1, khung ĐÚNG 180×42mm, không đụng hàm |
| Số tờ | `drawingNo` trống → tự đánh theo thứ tự tab layout "A-01, A-02…" lúc xuất bộ (chỉ điền vào PDF, không ghi ngược vào Doc) |
| Vẽ tự do trên giấy | mọi tool vẽ thường HOẠT ĐỘNG trong layout-doc (ghi chú, mây revcloud sau này…) — đơn vị hiểu là mm giấy, không cần chặn gì |

## 4 · IN — cắm vào pipeline sẵn, thêm đúng 2 thứ
1. `buildCadPdf`/`drawDocOntoPdfPage` thêm nhánh layout-doc: trang PDF = ĐÚNG khổ giấy layout, entity giấy vẽ 1:1 mm, ViewportEntity vẽ bằng chính logic render VP (§2c) — vector toàn phần, không raster (giữ đúng ghi chú "không addImage" của `buildSheetSetPdf`).
2. `buildSheetSetPdf` nhận lẫn model + layout sheets (SheetSetEntry thêm `kind`); mục lục ghi khổ + "tờ in/tờ vẽ"; cột tỉ lệ của layout = liệt kê tỉ lệ các VP ("1:100 · 1:20").
3. **Preset xuất** (NC-5 §3 #1/#5, khuôn ngôn ngữ `SPEC-NGON-NGU-CHI-DAN`): nút xuất 2 lựa — **"In văn phòng"** (pipeline hiện tại, mặc định) · **"Gửi nhà in"** (+crop marks 4 góc vẽ bằng jsPDF line, + 1 dòng trung thực: "PDF màu RGB — in kỹ thuật số tốt; in offset cần CMYK, IF chưa hỗ trợ"). **KHÔNG bleed cho hồ sơ CAD** — bản vẽ kỹ thuật có lề trắng, không nội dung tràn mép (bleed là chuyện deck chặng Trình bày, NC-5 §3 #2 — ghi rõ để không ai bê nhầm sang đây).
4. Luật font giữ nguyên: mọi chữ qua `ensureVietnameseFont` — thêm ca test chuỗi "ẳ ỹ ợ" theo NC-5 §3 #3.

## 5 · LÁT CẮT MODE + ROUND-TRIP
- `when`: lệnh `VP`/`TB`/tab "Tờ in" chỉ hiện `cadMode ∈ {pro, revit}` — Sketch KHÔNG thấy layout (đúng bảng phân vai `SPEC-CAD-MODES` §2: Sketch ra ý tưởng, Pro ra hồ sơ). Cơ chế = `PRO_ONLY_TOOLS` sẵn có, thêm `'viewport'` vào danh sách.
- `.idf`: ViewportEntity + `kind` tab đi theo serialize sheet sẵn có (`IdfSheetData`) — PHU thêm case round-trip: bộ có layout → save/load nguyên vẹn; `.idf` cũ không kind → mọi tab = model, không lỗi.
- DXF: xuất layout = pha 2 (DXF paper space là hệ ENTITIES/PAPER_SPACE riêng — KHÔNG làm vội, ghi để khỏi ai hứa nhầm); pha 1 chỉ model sheet xuất DXF như cũ.

## 6 · CHIA VIỆC + NGHIỆM THU
**PHU (lib + test):** `ViewportEntity` vào `model.ts` + union · render VP + resolver trong `render.ts` · nhánh layout trong `pdf.ts` (+crop marks) · `fitsAtScale`-picker (nấc chuẩn lớn nhất) thuần + test · case `idf.test.ts`.
**CadSheets/CadEditor wiring + Inspector VP + overlay "Căn vùng nhìn"** — UI: TỔNG phân (CadSheets nằm `components/cad/*`, cùng ghi chú chưa-gán-chủ như 2 spec trước; Inspector pages CHINH đã sở hữu `CadInspectorPages.tsx` — phần trang VP thuộc CHINH).
**Đặc tả mock bằng chữ (cho phiên nhận mảng tự dựng — luật mock mới §2):** tab layout có icon 🗎 phân biệt · VP viền 1px `--muted` nhãn tỉ lệ góc phải-dưới · overlay căn vùng = khung `--accent-ring` mờ 40% + crosshair tâm · preset xuất = 2 nút to khuôn `SPEC-MAT-DO-CON-TRO`, không dropdown chôn.

**Nghiệm thu (đo được — chuẩn hoạ viên):**
1. Layout A3 ngang, VP 1:50 nhìn model có tường 5000mm → xuất PDF → đo trên giấy (hoặc đo pt trong Acrobat) = **100.0mm ±0.5** — CẤM lệch.
2. Sửa tường ở tab model → chuyển tab layout: thấy thay đổi NGAY, không bấm gì thêm.
3. 1 tờ chứa VP 1:100 (toàn MB) + VP 1:20 (góc bếp) — cùng model, 2 tỉ lệ, cả hai đúng thước đo như (1).
4. VP locked: scroll/pinch/pan trong vùng VP → KHÔNG đổi vùng nhìn (viewport giấy pan bình thường); đổi scaleN chỉ được qua Inspector.
5. Tắt layer `l-dim` riêng 1 VP → VP kia và tab model KHÔNG đổi.
6. Xoá tab model đích → VP hiện "Tờ nguồn đã xoá", app không crash, undo trả lại đủ.
7. Xuất bộ 2 model + 2 layout: mục lục 4 dòng đúng loại/khổ/tỉ lệ, bookmark nhảy đúng trang, số tờ tự đánh A-01/A-02 khi `drawingNo` trống.
8. "Gửi nhà in": crop marks 4 góc NGOÀI vùng vẽ + dòng ghi chú RGB; "In văn phòng": không crop marks — diff 2 file khác đúng 2 điểm đó.
9. Mở `.idf` cũ (không layout) → như trước, 0 lỗi console; save mới → load lại nguyên bộ.
10. Mode Sketch: không thấy tab "Tờ in", không gọi được `VP`/`TB` (⌘K palette cũng ẩn).
11. §0c: `VP`/`TB` có trong sổ lệnh + phím tắt; mọi thao tác VP làm được bằng bàn phím (Tab tới VP, Enter mở Inspector); nút chạm ≥ `--tap` trên cảm ứng.

---
*Nguồn: NC-5 (`docs/nc/NC-xuat-pdf-in-2026-08-02.md`, đã đọc đủ) · chuẩn AutoCAD plot 1:1/CTB + mô hình sheet-view lock của Revit/ArchiCAD (kiến thức chuẩn ngành, khớp kết luận NC-5 §2 cột 3). Đối chiếu code 04/08/2026.*
