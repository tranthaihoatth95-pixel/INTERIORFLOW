# BÁO CÁO · COWORK-VẼ
**Vai:** VAI 4 theo `HAM-DOI-COWORK.md` — spec nghiệp vụ chặng Vẽ, kinh là `SPEC-LENH-VE-IF.md`.
**Luật:** không code, không mock. Chỉ ghi vào file này. Append-only.

---

## PHIÊN 03/08/2026 — nhận vai

### Đã đọc theo trình tự hiến chương
`HAM-DOI-COWORK.md` → `SO-KIEM-TONG.md` → `00-CHOT.md` → `SPEC-LENH-VE-IF.md`. Kiểm trùng: `SPEC-VE-INFERENCE.md` / `SPEC-VE-REVIT-MODE.md` chưa tồn tại, `git log --all` sạch — không ai làm trước.

### Khảo sát hiện trạng (luật L1 — trước khi viết spec)
Đã grep/đọc `lib/cad/store.ts` · `lib/cad/query.ts` · `components/cad/CadCanvas.tsx` (3441 dòng). Kết luận đưa vào §1 của spec — điểm chính:

| Đã có sẵn (KHÔNG vẽ lại) | Ở đâu |
|---|---|
| OSNAP 10 loại bật/tắt từng loại (`SnapSettings`) | `store.ts:179` |
| `findSnap()` → `SnapResult{pt,type}` | `lib/cad/query.ts:28` |
| Glyph snap phân biệt HÌNH theo loại (vuông/tam giác/tròn/X…) — nhưng MỘT màu accent | `CadCanvas.tsx:2923 drawSnap()` |
| Dynamic input `dynBuf`: số đơn = độ dài theo hướng, `X,Y` tuyệt đối, `@dx,dy` tương đối, F12 toggle | `CadCanvas.tsx:443-470 effectivePoint()` |
| Enter đặt tham số fillet/chamfer/lengthen/offset | `CadCanvas.tsx:928 commitEnter()` |
| Shift = ortho TẠM · F8 = `orthoLock` (store) · polar tracking + `polarStep` | `CadCanvas.tsx:423-441` + store |
| Space tap = lặp lệnh · Esc reset chuỗi | `CadCanvas.tsx` onKey |

**Thiếu thật (spec phải đắp):** màu inference theo loại · khoá Shift-giữ-inference · phím mũi tên khoá trục · gõ-số-SAU-chốt (chỉnh lại được) · `3x` `/3` cho Move-copy · đường gióng thước dây.

### Trạng thái hàng đợi
1. ✅ **`SPEC-VE-INFERENCE.md`** — TỔNG duyệt ĐẠT (BAO-CAO-DEM 00:0x, cơ chế ship-trước-sửa-sau).
2. ✅ **`SPEC-VE-REVIT-MODE.md` — VIẾT XONG** cùng phiên. Phát hiện gốc: `wallChain` sinh per-đoạn rồi VỨT tim tường → không parametric được; giải bằng lớp `WallRun` (tim sống lại) đứng trên lớp hình học, additive theo khuôn IF2. Kèm thuật toán room trace **ngân sách cứng 50ms** (bài học `findHatchBoundary` treo — TECH-DEBT).
3. ⛔ Rà 10 khuyết ①-⑩ → phiếu — **CHẶN: `BAO-CAO-PHU.md` chưa có kết quả grep §4** (đã kiểm 03/08, chỉ có match không liên quan dòng 609/614). Chờ PHU xong mục 5 của họ.

### Đề xuất cho `00-CHOT.md` (TỔNG duyệt mới ghi)
- [03/08] `SPEC-VE-INFERENCE.md` (COWORK-VẼ): inference đắp MÀU lên glyph sẵn có · Shift hợp nhất khoá-ràng-buộc · mũi tên khoá trục · VCB gõ-số-sau + `3x` `/3` — chi tiết tới điểm móc code, PHU làm lib, CHINH/G4 nối UI.
- [03/08] `SPEC-VE-REVIT-MODE.md` (COWORK-VẼ): tường parametric qua lớp `WallRun` optional (tim + type/instance + location line) · nối tự sạch MỘT kiểu (miter, không UI sửa nối) · cửa/cửa sổ hosted Space đảo chiều · ROOM click-vùng-kín + `l-room-sep` · seed 4 WallType VN — mode revit đổi hành vi lệnh qua `when`, `.idf` cũ không breaking.

### Việc TỔNG cần phân khi phát phiếu (nêu ở cả 2 spec §5/§8)
- `components/cad/CadCanvas.tsx` **chưa gán mảng** trong `SO-KIEM-TONG` §2 — phần wiring (lastOp/lockedSnap/axisLock/drawGuides + tool door/window/roomsep) cần chủ. Đề xuất: cùng người làm lib để khỏi handoff giữa chừng.
- Danh sách 4 WallType seed (gạch 110/220 · thạch cao 100 · kính 12) — Hoà/TỔNG chỉnh lúc duyệt.

### Nghi vấn liên vai (Hoà chuyển TỔNG khi tiện)
- Token màu inference (4 nhóm + 2 trục) chưa có trong `globals.css` — spec đặt TÊN token + giá trị đề xuất, **giá trị cuối thuộc SPEC-DESIGN-SYSTEM-IF của COWORK-UI** (TỔNG duyệt). Một câu cần chuyển: *"COWORK-UI chốt giá trị 6 token `--snap-*`/`--axis-*` theo §2 SPEC-VE-INFERENCE rồi ghi vào SPEC-DESIGN-SYSTEM-IF."*

### CHỐT PHIÊN (đợt 1)
- Xong: nhận vai · khảo sát code 2 vòng · `SPEC-VE-INFERENCE.md` (TỔNG duyệt ĐẠT) · `SPEC-VE-REVIT-MODE.md` (chờ hậu kiểm ca đêm) · sổ này.
- Dở: việc 3 hàng đợi vẫn CHẶN chờ PHU grep §4 — hết việc khả thi trong hàng đợi vai.
- Không đụng file vai khác, không code. Token `--snap-*`/`--axis-*` đã thành việc 0 của COWORK-UI (TỔNG bơm) — 2 spec dùng `var()` có fallback, không chờ.

---

## PHIÊN 04/08 (cùng session) — hàng đợi đợt 2

### Việc 4 ✅ — `SPEC-VE-LAYOUT-PAPER.md`
- §0b đủ 3 bước: SEARCH grep pdf.ts/model.ts/CadSheets · NGHIÊN CỨU đọc trọn `NC-xuat-pdf-in` · NGƯỜI DÙNG = hoạ viên nộp hồ sơ.
- **Kiểm thật phát hiện `SPEC-CAD-MODES` (26/07) LỖI THỜI 2 mục** (luật §0 — kiểm bằng lệnh rồi mới nói): "Xuất bộ hồ sơ ⬜" thật ra ĐÃ CÓ (`buildSheetSetPdf` pdf.ts:490 — mục lục + bookmark + khổ/tỉ lệ riêng từng tờ, 2.1.8.k) · "tỉ lệ 🟡" đã có nền đủ (`printScale`+`fixedScaleViewport`+`fitsAtScale`). Lỗ thủng thật đúng 1 thứ: các tờ không nhìn cùng model.
- Spec chốt: layout = LOẠI TAB MỚI cạnh model tab (additive vào CadSheets) · `ViewportEntity` type mới (hưởng free select/grips/undo) · **VP mặc định KHOÁ, không MSPACE-trong-VP** (né nỗi sợ lớn nhất của dân AutoCAD, theo chuẩn Revit/ArchiCAD) · đồng bộ model→layout zero-code (render đọc doc đích qua resolver lúc vẽ) · preset xuất "In văn phòng"/"Gửi nhà in" theo NC-5, KHÔNG bleed cho hồ sơ CAD · DXF paper space = pha 2 ghi rõ.

### Việc 5 ✅ — `SPEC-VE-SKETCH-TOUCH.md`
- Khảo sát: pinch 2 ngón + `pointers` map + dock 6 nút `cad:synth-key` + Delete FAB ĐÃ CÓ — spec chỉ đắp 5 lớp thiếu.
- Chốt: pen-priority + palm rejection 2 tầng (pen active nuốt touch mới + 300ms sau pen-up) · 2-chạm-undo/3-chạm-redo (sửa DUY NHẤT điểm kích hoạt pinch: thêm ngưỡng 8px/250ms) · radial 8 múi giữ-450ms, vị trí múi cố định theo nhóm (12h=chốt, 6h=huỷ), gọi qua sổ lệnh surface 'radial' · nắn nét `recognizeStroke` lib thuần có bảng ngưỡng · snap ×1.5 pen/×2.5 ngón · **pressure KHÔNG đổi lineweight entity CAD** (chỉ markup) · §0c: mọi cử chỉ có nút tương đương (dock +Undo/Redo).

### Đề xuất cho `00-CHOT.md` (TỔNG duyệt mới ghi)
- [04/08] `SPEC-VE-LAYOUT-PAPER.md` (COWORK-VẼ): layout tab + ViewportEntity khoá mặc định, in đúng thước, preset 2 nút — kèm ĐÍNH CHÍNH `SPEC-CAD-MODES` §4: bộ hồ sơ + tỉ lệ đã có sẵn trong code, chỉ thiếu layout.
- [04/08] `SPEC-VE-SKETCH-TOUCH.md` (COWORK-VẼ): pen-priority/palm · tap-undo · radial 8 múi · nắn nét · snap theo pointer — Sketch-only, chuột/Pro 0 thay đổi.

---

## ĐỢT 3 (cùng session — TỔNG bơm ~02:1x)
### ✅ Rà 4 spec VẼ × `lib/commands/registry.ts` (389 dòng, sau merge) → `PHIEU-REGISTRY-VE-2026-08-04.md` giao PHU
- **Va chạm bắt được:** `cad.draw.door`/`window` (alias D/WIN) đã tồn tại nhưng = block RỜI — spec REVIT cần hosted. Xử: giữ id/alias, `run` phân nhánh theo `ctx.mode` (1 lệnh 1 nhãn, không tách def).
- Thiếu: 4 lệnh mới (`RS`·`RU`·`VP`·`TB`) + surface `'radial'` + nhóm `cad.act.*` cho múi radial (synth-key cùng nhánh CadTouchDock). `WhenCtx.mode` đã đủ, không cần mở rộng ctx. VCB/cử chỉ/Shift xác nhận KHÔNG thuộc registry (§4 phiếu).
- Lưu ý phiên nhận 5 dòng dán: phiên này chỉ nhận đúng dòng VẼ theo hiến chương "mỗi phiên 1 vai" — 4 dòng NC/UI/DỰNG/TRÌNH cần dán vào 4 phiên riêng.

### CHỐT PHIÊN — **HẾT VIỆC 23:41 02/08** (giờ máy; nhãn ca đêm 04/08 theo sổ TỔNG)
- Hàng đợi vai VẼ: 1✅ 2✅ 4✅ 5✅ · 3⛔ (vẫn chờ PHU grep §4 — kiểm lại lần 2 phiên này, BAO-CAO-PHU chưa có).
- 4 spec của vai đều là file MỚI trong `docs/` chưa vào git — CHINH gom theo mục 5b của họ ("gác cổng docs").
- Nghi vấn lặp lần 3 đã ghi ở cả 3 spec: `components/cad/*` (CadCanvas·CadSheets·CadTouchDock) CHƯA gán chủ mảng trong §2 — TỔNG cần chốt một lần để 3 spec có người wiring.

---

## ĐỢT 4 (phiên mới, session Cowork riêng) — §0 LUẬT TRUNG THỰC: phát hiện TRÙNG VIỆC với ĐỢT 3

### ⚠️ Sự cố quy trình — ghi nhận không giấu
Bước đầu bắt buộc có yêu cầu Glob `docs/BAO-CAO-COWORK-VE.md` "đọc để biết đã làm gì, tránh
lặp" — tôi Glob (kiểm file tồn tại) nhưng **không Read nội dung TRƯỚC khi bắt tay việc ①**, nên
không thấy mục "ĐỢT 3" (trên) đã làm ĐÚNG việc "rà 4 spec VẼ × `registry.ts`" và đã ra
`PHIEU-REGISTRY-VE-2026-08-04.md`. Chỉ phát hiện ra SAU KHI viết xong 1 phiếu mới
(`PHIEU-VE-REGISTRY-BOSUNG-2026-08-03.md`). Xử lý: **không xoá phiếu cũ** (append-only), đã thêm
khối ghi chú ⚠️ đầu phiếu mới trỏ sang phiếu cũ + liệt kê rõ chỗ giống (kiểm chứng độc lập 2 lần,
đáng tin hơn) và chỗ khác (3 lệnh radial mới phiếu cũ chưa có: Nhân bản/Khoá-Mở/Snap± · cảnh báo
`CadEditor.tsx` chưa nối `findByAlias()` nên registry mới chỉ ăn qua ⌘K · 2 hướng xử D/WIN khác
nhau, chưa chốt hướng nào). PHU/TỔNG cần đọc CẢ HAI phiếu, không chỉ 1.

### Việc ① — rà 4 spec VẼ × `lib/commands/registry.ts` → `PHIEU-VE-REGISTRY-BOSUNG-2026-08-03.md`
- Tự đếm lại `CAD_COMMANDS` bằng grep (không tin số cũ): pattern thô ra 98 dòng, trừ 1 dòng khai
  báo type (dòng 18, không phải entry) = **97 alias, đúng số cũ, không lệch**.
- SPEC-VE-INFERENCE: không thiếu gì ở registry (cơ chế nằm dưới CadCanvas, không sinh alias mới).
- SPEC-VE-REVIT-MODE: thiếu `roomsep`/`roomupdate` (2 lệnh mới hoàn toàn) + thiếu when-guard
  `mode==revit` (WhenCtx.mode đã có dữ liệu thật qua AppCommandPalette nhưng chưa ai dùng) + cảnh
  báo mâu thuẫn tiềm tàng giữa spec §7 ("door/window chỉ revit") và registry hiện tại (D/WIN sống
  ở mọi mode từ trước — đổi theo nghĩa đen sẽ RỚT tính năng generic-block ở Sketch/Pro).
- SPEC-VE-LAYOUT-PAPER: thiếu `VP`/`TB` (2 lệnh mới) — xác nhận `titleBlockPro()` đã chạy được
  nhưng chỉ qua nút UI riêng trong CadEditor.tsx, không qua sổ lệnh gõ tay. Xác nhận
  `shouldShowProTools()` coi revit như pro (store.ts:144) nên `proToolsAllowed` tự động = {pro,
  revit}, khớp yêu cầu spec — chỉ thiếu field `sheetKind` (tab model/layout) trong WhenCtx.
- SPEC-VE-SKETCH-TOUCH: thiếu giá trị `'radial'` trong type `Surface` + 3 lệnh thực sự thiếu
  (Nhân bản — thiếu cả store action; Khoá/Mở — mơ hồ tầng model, `Base` entity không có field
  `locked`, chỉ `Layer` có; Snap± — store action `setSnap()` đã có sẵn, chỉ thiếu CommandDef,
  **làm ngay được không cần hỏi ai**).
- Phát hiện thêm (không có ở phiếu cũ): `registry.ts` **chưa được `CadEditor.tsx` dùng** để
  dispatch gõ-lệnh ở status-bar (`findByAlias` = 0 nơi gọi ngoài chính registry/test) — mọi lệnh
  mới thêm vào registry chỉ hiện ở ⌘K palette cho tới khi CHINH nối `CadEditor.tsx`'s `run()` map
  (vùng CHINH, PHU không tự sửa) hoặc TỔNG ưu tiên TODO#1 sẵn có cuối `registry.ts`.

### Việc ② — gap-check 10 khuyết ①-⑩ SPEC-LENH-VE-IF §4 → **KHÔNG LÀM ĐƯỢC, CHƯA MỞ KHOÁ**
Đọc hết `docs/BAO-CAO-PHU.md` (1108 dòng, toàn bộ file) + grep từ khoá `gap-check|eyedropper|
VCB|khuyết|①…⑩` = chỉ 2 match không liên quan (dòng 608-614, đánh số chú thích trong mục P5
"toolbar nổi", không phải danh sách 10 khuyết CAD). Toàn bộ nội dung `BAO-CAO-PHU.md` là công
việc **present-editor** (P1-P6c: mask ảnh, group/resize nhóm, fill overlay, z-order nhóm, filter
phần tử, toolbar nổi, AA màu chữ, kính lỏng) — **không có dòng nào về gap-check CAD**. Đây là lần
**THỨ TƯ liên tiếp** (đợt 1 dòng 30, đợt 2/3 dòng 74, đợt này) tình trạng "PHU chưa gap-check"
không đổi qua nhiều phiên — đáng để TỔNG/Hoà biết đây là điểm nghẽn dai, không phải PHU quên ghi.
Theo đúng chỉ dẫn: bỏ qua việc ②, không bịa phiếu khuyết.

### CHỐT PHIÊN
- Xong: việc ① (1 file phiếu mới, có ghi chú liên kết phiếu cũ) · sổ này.
- Không làm: việc ② (lý do trên, không phải lỗi của phiên này).
- Không đụng file vai khác, không code (đúng luật hạm đội). Không xoá/sửa đè phiếu cũ nào.
- Đề nghị TỔNG: (a) xác nhận PHU đọc CẢ HAI phiếu registry (cũ 04/08 + mới 03/08) trước khi code,
  chọn 1 hướng cho D/WIN; (b) cân nhắc escalate việc gap-check 10 khuyết CAD cho PHU — đã treo
  4 lần kiểm liên tiếp không nhúc nhích.

---

## PHIÊN 03/08 — ĐỢT 5 · BỔ SUNG TRỌNG TÂM NỘI THẤT vào `SPEC-VE-REVIT-MODE.md`

**Việc nhận:** `SO-KIEM-TONG.md` §3 đợt 5 / `CHOT-TEN-CHANG-MODE-2026-08-03.md` §6 mục 4 —
append phần trọng tâm NỘI THẤT (tủ bếp · trần · sàn lát · lớp hoàn thiện là chính; tường/cửa là
vỏ chứa), KHÔNG đập bản cũ (§0d).

**Đã làm:** append `# PHỤ LỤC 03/08 — TRỌNG TÂM NỘI THẤT (đợt 5)` (§A0-§A13) vào cuối
`SPEC-VE-REVIT-MODE.md`. File 151 → **694 dòng**; §0-§8 bản gốc **nguyên vẹn từng dòng** (kiểm lại
sau khi ghi). Không đụng `lib/`/`components/`, không chạy lệnh git.

### Đã spec 6 hạng mục + 1 trục phân loại
- **Trục nền §A1 "KIỂU ĐO"** (MẶT · TUYẾN · CỤM · CÁI · VỎ CHỨA) — thay câu hỏi *"hình này là hình gì"*
  (nguồn của bug đùn sơn) bằng *"hạng mục này đo bằng gì"*. 3 luật N1-N3.
- **§A2 Ranh giới Nội thất ↔ Kỹ thuật:** Nội thất sở hữu **hạng mục thi công**, Kỹ thuật sở hữu **tờ bản vẽ**.
  Ba câu "không ôm": không dựng tờ · không hiện giá · không render.
- **§A3 Lớp hoàn thiện** (sơn/ốp/giấy) — kèm **vá tối thiểu** cho bug §0.3.
- **§A4 Sàn lát** — hướng lát · gốc lát · mạch · kiểu lát · hao hụt theo kiểu lát · số thùng (CEIL).
- **§A5 Trần** — mỗi cấp = 1 vùng có `elevationMm` riêng; **BOQ 2 dòng: m² trần + m² CỔ TRẦN**.
- **§A6 Tủ bếp** — `CabinetRun` + `CabinetModule` đối xứng khuôn `WallRun`; 1 cụm → 4-6 dòng BOQ khác đơn vị.
- **§A7 Phào / len chân tường** — m dài, không vẽ lên mặt bằng.
- **§A8 Đồ rời** — đường ống gần đủ, thiếu đúng 2 mắt xích.
- **§A9** bảng tái-dùng (20 mục có `file:dòng`) + **thiếu thật T1-T15** · **§A10** 6 lệnh mới + §0c ba mảng ·
  **§A11** lộ trình đan vào P0-P7 spec nền + **12 ca nghiệm thu đo được** · **§A12** 5 câu treo · **§A13** không-làm.

### Phát hiện đáng chú ý khi đọc code (đều có bằng chứng lệnh)
1. 🔴 **Vá bug đùn-sơn rẻ hơn tưởng — làm được NGAY, không cần chờ NC-11.**
   `commands.ts:64` `wallSegment()` trả hatch đúng 5 field, **không có `specId`**; còn `HatchEntity.specId`
   (`model.ts:318`) sinh ra chính là để neo vật liệu. ⇒ luật *"hatch có `specId` ⇒ không bao giờ là tường"*
   loại đúng 100% vùng đã gán vật liệu và **không thể** loại nhầm tường cũ. Đề xuất chèn **P0.5** giữa
   P0/P1 của `SPEC-TANG-DU-LIEU-CAU-KIEN` §9.
2. 🔴 **`edgeMask` KHÔNG đủ cho len chân tường.** `polygonPerimeter(poly, edgeMask?)` (`hatch.ts:72`)
   bật/tắt **cả cạnh**, trong khi cửa 900 nằm **giữa** cạnh 5000 (phải ra 4100). ⇒ thiếu thật hàm
   `openingsWidthOnBoundary()`, đối xứng `openingsAreaInPolygon` (`hatch.ts:112`) đã có.
3. 🔴 **BOQ engine chưa có nhánh `m` và `cai`.** `BoqRow` (`lib/boq/model.ts`) chỉ có field số lượng `m2`;
   `computeBoq` (`compute.ts:89`) chỉ quét `HatchEntity`. ⇒ **chặn cứng cùng lúc** tủ bếp · phào · đồ rời.
   Đây là việc lớn nhất bị bỏ sót trong định vị BIM nội thất.
4. **Kích thước viên (mm) không tồn tại trong `materials.ts`.** `MaterialDef` (`materials.ts:31-66`) chỉ có
   `patternScale` (tỉ lệ nét hatch tương đối), không có mm — trong khi `SPEC-TANG-DU-LIEU-CAU-KIEN` §7 đòi
   *"tiling size (mm) là bắt buộc"*. Chốt: đọc từ `ProductSpec.w/d`, **không đẻ field thứ hai**.
5. **Hai nguồn cho cùng con số cao đồ.** `furnitureHeightMm()` (`cad-to-obj.ts:167-178`) hardcode if/else
   theo tiền tố id (`sofa*`→800…) trong khi `ProductSpec.hUp` đã khai *"cao thật 3D"*. Vá 1 dòng, additive.
6. **Trần hiện là 1 tấm bbox toàn nhà** (`cad-to-obj.ts:421-424`, `prism(floorPoly, H, H+100)`) — không phòng,
   không cao độ, không vật liệu. Spec giữ nó làm **fallback** (§0d), không đập.
7. **SUY ĐOÁN (chưa verify): đèn `mep.ts` biến mất khỏi 3D** — `cad-to-obj.ts:357-360` lọc theo `BLOCK_MAP`
   của `furniture.ts:639`, mà 4 ký hiệu đèn (`mep.ts:84-96`) không nằm trong map đó. PHU verify 2 phút.
8. **Tin tốt — không phải xây từ đầu:** `polygonPerimeter` + `openingsAreaInPolygon` +
   `OPENING_STANDARD_HEIGHT_MM` + `BOQ_OPENING_MIN_AREA_M2` đã có sẵn (`hatch.ts:72/112/97/84`);
   `ProductSpec` đã có `unit`('m2'|'m'|'cai'|'bo'|'m3') · `wastagePercent` · `packagingSpec`;
   `SPEC_KINDS` đã có `millwork`/`fixture`/`lighting` (`lib/server/specs.ts:6`) ⇒ **không cần đổi schema DB**.

### Chuyển cho phiên CODE (theo thứ tự, đã đan vào P0-P7 spec nền)
| Bậc | Việc | Ai | Cỡ |
|---|---|---|---|
| **P0.5** | **T1** — vá lọc tường bằng `specId` (`cad-to-obj.ts:350-355`) | PHU | rất nhỏ, giá trị cao nhất |
| P1.5 | **T12** `hUp` · **T13** 3 layer hoàn thiện · **T15** hằng số nghề vào CONFIG | PHU | rất nhỏ, gộp 1 commit |
| P5.5 | **T2** `covering`+`coveringHost` · **T3** `thicknessMm`/`elevationMm`/`roomId` · **T4** `openingsWidthOnBoundary` | PHU | nhỏ (T2 chờ NC-11) |
| P6 | **T9** 3D dán MẶT (không `prism`) · **T10** trần theo vùng | PHU | trung bình |
| **P6.5** | **T5** BOQ nhánh `m` + `cai` — mở khoá tủ bếp/phào/đồ rời | PHU | **trung bình, chặn cứng 3 hạng mục** |
| P7+ | **T11** `CabinetRun` → **T6/T7** tham số lát → **T8** `tileGrid` (pha 2) | PHU | T11 lớn nhất |
| — | 6 lệnh mới `FINISH·FLOORFIN·CEILREG·CAB·SKIRT·CORNICE` vào `registry.ts` (`when: mode=='revit'`) | PHU (lib) + CHINH (nối `CadEditor.run()`) | nhỏ |
| — | Verify **SUY ĐOÁN #7** (đèn mất khỏi 3D) | PHU | 2 phút |

### Cần TỔNG/Hoà chốt (§A12) — 5 câu
(A) `coveringHost` field riêng hay chẻ `elementType`? · (B) bảng hao hụt theo kiểu lát — số của ai? ·
(C) tủ bếp báo giá m dài hay m² cánh+thùng? · (D) `CabinetRun` bảng phụ hay entity union? ·
(E) phào/len **không vẽ lên mặt bằng** — đúng ý Hoà chưa?

### Trung thực (§0)
- Không chạy app, không chạy test — Cowork không code. Mọi kết luận runtime là **đọc code**, chỗ nào
  chưa chắc đã ghi **SUY ĐOÁN** ngay trong spec (§A0 có bảng ký hiệu mức tin cậy).
- Mọi con số nghề Cowork tự đề xuất đều gắn nhãn **SỐ ĐỀ XUẤT** + yêu cầu vào CONFIG, không hardcode.
- Không đụng file của vai khác. Không chạy git (theo lệnh phiên). File docs mới/sửa chờ CHINH gom
  commit theo hàng đợi CHINH mục 5b.

---

## PHIÊN 06/08 — CÒN NỢ: 3 block nhóm NHÀ Ở (Hoà đổi ưu tiên sang nhóm văn phòng)

Hoà chốt 06/08: **dự án văn phòng đang chờ thư viện** ⇒ dồn toàn bộ cho nhóm `van-phong`.
Ba block nhà ở dưới đây **vẫn còn ở dạng cũ** (toàn `rect`/`line` thẳng, chưa qua đợt nâng cấp
06/08 đã áp cho sofa · ghế bành · ghế ăn · tủ áo · bồn cầu · bidet · cây · xe). Ghi vào đây để
không rơi, **làm sau khi xong 4 đợt văn phòng**.

| Block | File:hàm | Bệnh đo được | Hướng sửa (chưa làm) |
|---|---|---|---|
| `kitchen-island` (Đảo bếp) | `scripts/cad-library/blocks-data.ts` → `kitchenIsland()` | `box` + 1 `rect` + 1 `circ` r=30 — 3 nét, không cung nào. Chấm r=30 (vòi) nhỏ hơn nét vẽ ở thumbnail ⇒ coi như vô hình | mặt đảo bo góc · chậu rửa bo góc thật · gờ mặt bàn nhô; bỏ chấm vòi hoặc cho r đủ thấy |
| `bath-shower` (Phòng tắm đứng) | `showerStall()` | `box` 900 + 1 cung + `circ` r=40. Cung quét cửa vẽ **bán kính 810 từ GÓC** — không phải ký hiệu cửa mở, nhìn ra hình quạt lạc | cửa lùa/cánh mở đúng quy ước (đoạn cánh + cung 90° từ bản lề, giống `wardrobe()`) · phễu thoát nước · dốc sàn gợi |
| `stairs-straight` (Thang thẳng) | `stairsStraight()` | 12 vạch bậc đều + 1 mũi tên gấp khúc 3 điểm. Thiếu **đường cắt** (ký hiệu bắt buộc của thang trên mặt bằng tầng) và mũi tên không có đầu | thêm đường cắt zigzag + ký hiệu LÊN/XUỐNG có đầu mũi tên · tay vịn |

Ba block này **vẫn dùng được** (parse DXF sạch, kích thước đúng) — chỉ là chưa đạt chất lượng
thẩm mỹ theo `docs/00-PHAN-TICH-NGUON-THAM-CHIEU.md` §1-§2. Không xoá, không chặn ai.
