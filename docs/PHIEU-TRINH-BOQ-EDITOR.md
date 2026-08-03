# PHIẾU CODE — EDITOR BOQ (loại hồ sơ #3, chặng Trình bày)
**COWORK-TRÌNH lập 03/08 (đợt 5). Nâng `SPEC-TRINH-BOQ-EDITOR.md` → phiếu code đánh số.**
**Vì sao nâng được:** `lib/boq/*` đã ở trên main (`892c927` theo dispatch — *phiên này KHÔNG chạy git,
xác minh bằng file trên cây làm việc*: `lib/boq/{model,compute,cache,from-project,xlsx}.ts` + 4 file test
+ `app/api/boq/[projectId]/route.ts` đều CÓ MẶT, đọc toàn văn 03/08). BOQ hết chặn engine.
**Vùng/người code:** UI = **G4** (`components/present-editor/boq/*` — đặt TRONG vùng G4 đã khai ở §2 sổ tổng,
KHÔNG mở thư mục gốc mới) · lib = **PHU** (`lib/boq/*`). Mỗi việc dưới ghi rõ chủ.
**Luật buộc:** §0 trung thực · §0c ba mảng (B10) · §0d giữ-cái-đang-tốt (KHÔNG đụng Deck editor đang chạy)
· luật VÒNG CUỐI "ba ống kính một nguồn" (B0 là hiện thân của luật này, xem `SPEC-TRINH-ONG-KINH-DU-LIEU.md`).

---

## §A · ĐÃ CÓ SẴN — TÁI DÙNG, CẤM VIẾT LẠI (đọc code thật 03/08, không đoán)

| Hàm/đường đã có | Ở đâu | Chữ ký / hành vi thật |
|---|---|---|
| `computeBoq(doc, specs)` | `lib/boq/compute.ts:89` | thuần; lọc `e.type==='hatch'`, gộp theo `specId`, `polygonArea` → m², `thanhTien = area×(1+hao hụt/100)×giá`, làm tròn đồng |
| `computeBoqCached(cacheKey, doc, specs)` | `lib/boq/cache.ts:68` | trả `{result, hit}`; fingerprint CHỈ theo id·specId·toạ độ đỉnh + giá/hao hụt → đổi màu/pattern KHÔNG tính lại |
| `boqFingerprint(doc)` · `invalidateBoqCache(key)` | `cache.ts:31` · `:85` | dùng cho nút "Tính lại" và cho việc phát hiện Doc đổi |
| `computeBoqForProject(projectId, doc, specDtos)` | `lib/boq/from-project.ts:66` | wrapper cache theo `projectId` |
| `specDtoToMaterialLite(dto)` | `from-project.ts:48` | DTO API → `MaterialSpecLite` |
| `boqResultToXlsxBuffer(result)` | `lib/boq/xlsx.ts:162` | dựng .xlsx bằng `jszip` (KHÔNG thêm package), 8 cột Việt + dòng TỔNG CỘNG |
| `POST /api/boq/[projectId]` | `app/api/boq/[projectId]/route.ts:25` | body `{doc}` (**POST không phải GET** — server không giữ Doc), auth `viewer`, tự tra `ProductSpec kind='material'`, trả `{rows,errors,totalAmount,hit}` |
| `BoqRow` 8 field + `entityIds` · `BoqError` 4 reason có `message` tiếng Việt | `lib/boq/model.ts:40` · `:53` | UI hiện thẳng `message`, KHÔNG tự viết câu lỗi mới |
| `useCadStore.select(ids: string[])` | `lib/cad/store.ts` (action `select`, `selection: string[]`) | **truy vết ngược ĐÃ CÓ ĐƯỜNG** — spec §2 ghi "cần hỏi CHINH" nay HẾT chặn |
| Tiền lệ bảng-đọc-live + click-hàng-highlight | `components/cad/SchedulePanel.tsx:153` (`onClick={() => select(r.ids)}`) | chép ĐÚNG khuôn này, đừng phát minh lại |
| Khổ giấy A4/A3 + `printResScale(id, dpi)` | `lib/present-editor/stage-presets.ts:42-45,87` | dùng cho bản in B9 |
| Font Việt cho PDF | `lib/pdf-font.ts:209 ensureVietnameseFont` | luật NC-pdf#3, bắt buộc |
| Nạp Doc theo dự án từ đĩa/IDB | `lib/sheets-persist.ts:122 loadSheets(userId, '/cad-editor', projectId)` | nền của B0 |

## §B · BA ĐIỂM SPEC PHẢI SỬA VÌ CODE THẬT NÓI KHÁC (trung thực §0)

| # | Spec viết | Code thật | Xử trong phiếu |
|---|---|---|---|
| 1 | §8.1 "xlsx đã có `SUM()` sống — **PHU kiểm**" | **KHÔNG có `SUM()`**: `xlsx.ts:93` ghi dòng TỔNG bằng `numberCell(...totalAmount...)` = **số chết**; grep `SUM\|<f>\|formula` trong `xlsx.ts` + `xlsx.test.ts` = **0 match** | HẾT CHỜ PHU — thành việc code **B8** (đã verify, không cần ai thẩm định nữa) |
| 2 | §2 `entityIds` v2 "cần CAD expose select-by-entityIds — hỏi CHINH" | `useCadStore.select(ids)` đã có và đã được `SchedulePanel` dùng | HẾT CHỜ CHINH — thành việc **B4** |
| 3 | §6 "Group theo **phòng/zone** · tầng · hạng mục" | `HatchEntity` KHÔNG có `roomId`; `Base.storey` CÓ (`model.ts:162`); "phòng" hiện chỉ suy được từ nhãn `TextEntity.roomType`/`classifyRoom` = **suy đoán** | **B6** làm tầng + hạng mục NGAY; nhóm-theo-phòng là **v2 có cờ `inferred` lộ mặt** (L4 `SPEC-TANG-DU-LIEU-CAU-KIEN`), KHÔNG hứa v1 |

## §C · CHƯA VERIFY / CÒN CHỜ (ghi thẳng, không tô hồng)
- **§4 mini-DSL ƒx** vẫn CHỜ PHU thẩm định độ khó parse → là việc **B11, GATED**, xếp cuối, KHÔNG ai được bắt đầu trước khi PHU trả lời. `BAO-CAO-PHU.md` grep `DSL` = 0 (kiểm 03/08).
- **Doc nhiều sheet**: 1 dự án có nhiều bản vẽ (`CadSheets` trần `MAX_SHEETS`), engine BOQ nhận **một** `Doc`. Câu hỏi cho TỔNG/Hoà ở §E-1 — B0 tạm khoá theo "sheet đang mở", ghi rõ trong UI.
- Chưa chạy app để nhìn (Cowork không code, không build) — mọi con số dưới là đọc-code, ô nghiệm thu là để **người code** đo.

---

## §D · CÁC VIỆC CODE — THỨ TỰ LÀM: **B0 → B1 → B2 → B3 → B4 → B5 → B6 → B8 → B10 → B7 → B9 → (B11 gated)**
Lý do thứ tự: B0 là cầu dữ liệu (không có thì mọi thứ sau là bịa) → B1-B3 ra được bảng có số thật + lỗi thật
(đã dùng được cho việc thật) → B4-B6 là 3 điểm khác biệt so với Excel → B8 xuất được file → B10 chuẩn §0c
(nghiệm thu chặn ship) → B7/B9 mở rộng → B11 khi PHU gật.

### B0 · CẦU DỮ LIỆU: BOQ đọc thẳng Doc, không qua ảnh 🔴 (chủ: G4, có 1 mẩu PHU)
- **File đích:** `lib/present-editor/project-doc.ts` (MỚI, thuần + hook mỏng) · dùng bởi `components/present-editor/boq/*`.
- **Gì:** hàm `getProjectDoc(projectId): Promise<{doc: Doc, source: 'store'|'idb'|'none', sheetId, sheetName}>`:
  1. `useCadStore.getState().doc` — nếu store đang giữ đúng dự án (tiền lệ `lib/nodes/defs/render-v2.ts:244`);
  2. rơi về `loadSheets(userId, '/cad-editor', projectId)` (`lib/sheets-persist.ts:122`) khi user vào thẳng
     `/projects/[id]/present` mà **chưa từng mở chặng 2D trong phiên** — đây là ca THẬT, đã kiểm:
     `components/cad/CadSheets.tsx:325` là NƠI DUY NHẤT gọi `loadSheets` cho CAD ⇒ không mở chặng Vẽ thì
     store rỗng/của dự án khác;
  3. không có gì → `source:'none'`, UI hiện empty-state có NÚT "Mở bản vẽ" (`SPEC-NGON-NGU-CHI-DAN` khuôn trống).
- **CẤM:** copy Doc vào state của Present, `syncDocToBoq`, đọc `dataUrl` của `present-handoff` để lấy số (L6).
- **Nghiệm thu đo được:** (a) hard-reload thẳng `/projects/<id>/present` → bảng BOQ vẫn ra số (source='idb');
  (b) sửa 1 vùng tô ở chặng 2D rồi quay lại → bấm "Tính lại" ra số MỚI (`hit:false`);
  (c) grep `dataUrl` trong `components/present-editor/boq/` = **0**.

### B1 · MÀN BOQ TRONG CHẶNG TRÌNH BÀY (chủ: G4)
- **File đích:** `components/present-editor/boq/BoqScreen.tsx` (MỚI) + nối vào màn chọn 5 loại hồ sơ
  (`PHIEU-PRESENT-G4` V6/H4 — nếu H4 chưa xong thì tạm treo 1 mục trong `PresentNavigator.tsx`, ghi TODO 1 dòng).
- **Gì:** khung màn trong `AppShell` (KHÔNG dựng shell riêng — `PresentStageScreen.tsx:44` là mẫu) · nút "Tạo BOQ"
  → `getProjectDoc` → `POST /api/boq/[projectId]` với `{doc}` → giữ `BoqResult` trong state màn · nút "Tính lại".
- **Tuyên bố mô hình (§1 spec):** lần đầu mở hiện 1 dòng mách nước ≤12 từ: *"Bảng theo dòng vật liệu — không phải Excel ô-B4."*
- **Nghiệm thu:** dự án demo có ≥1 vùng tô gán specId → bấm 1 lần ra bảng; 2 theme; không lỗi console.

### B2 · BẢNG 8 CỘT CỐ ĐỊNH + ĐỊNH DẠNG ₫ (chủ: G4)
- **File đích:** `components/present-editor/boq/BoqTable.tsx` (MỚI).
- **Gì:** đúng 8 cột `BoqRow` (STT hiển thị thêm, không phải field) · `donGia/thanhTien` ngăn nghìn 0 số lẻ ·
  `m2` 2 số lẻ · `tabular-nums` (`SPEC-DESIGN-SYSTEM-IF` §2c) · dòng TỔNG = `totalAmount` (KHÔNG tự cộng lại ở UI).
- **Nghiệm thu:** cộng tay 5 dòng `thanhTien` = số TỔNG hiển thị (engine đã làm tròn từng dòng — `compute.ts:18`);
  cột số căn phải, chữ số không nhảy khi đổi giá trị.

### B3 · LỖI LÀ DỮ LIỆU HẠNG NHẤT (chủ: G4)
- **File đích:** `components/present-editor/boq/BoqErrors.tsx` (MỚI).
- **Gì:** banner đếm lỗi + khối lỗi riêng dưới bảng; mỗi lỗi hiện **nguyên văn `err.message`** (đã tiếng Việt,
  `compute.ts:117,130,140,155`); nút hành động theo `reason`: `missing-specId`/`spec-not-found` → "Xem 3 vùng này"
  (dùng B4) · `missing-priceVnd` → "Mở vật liệu" · `overlapping-region` → "Xem 2 vùng chồng lấn".
- **CẤM:** cộng vùng lỗi vào tổng, ẩn lỗi vào tooltip, viết lại câu lỗi.
- **Nghiệm thu:** dựng dự án test đủ **4 reason** → 4 khối lỗi, đếm đúng; `totalAmount` KHÔNG đổi khi thêm vùng lỗi.

### B4 · TRUY VẾT NGƯỢC "XEM TRÊN BẢN VẼ" (chủ: G4)
- **File đích:** `BoqTable.tsx` + `BoqErrors.tsx` (nút) — dùng `useCadStore.getState().select(row.entityIds)`
  rồi `router.push('/projects/<id>/cad')` (thứ tự: select TRƯỚC, điều hướng SAU — store là singleton, sống qua route).
- **Nghiệm thu:** bấm 1 dòng BOQ → sang chặng 2D thấy ĐÚNG các vùng tô đó đang được chọn (đếm `selection.length`
  = `entityIds.length`); bấm dòng lỗi chồng lấn → 2 vùng cùng sáng.

### B5 · LIVE-LINK = TRIGGER-FORMULA (§5 spec — điểm ăn tiền) (chủ: G4)
- **File đích:** `lib/present-editor/boq-overrides.ts` (MỚI, thuần + test) + `BoqTable.tsx`.
- **Gì:** `BoqOverride = {matId, field:'m2'|'donGia', value:number, at:number, machineValue:number}` lưu theo
  `projectId` (cùng đường IDB đang dùng, KHÔNG bịa kho mới) · ô đã sửa tay = **badge chấm màu + nút revert**
  (nút HIỆN SẴN khi dòng được chọn, không chỉ-hover — §0c mảng 3) · khi số máy mới ≠ `machineValue` thì hiện
  cảnh báo nhỏ *"máy tính 42,5 — bạn đang giữ 40"*.
- **Luật:** override là **lớp phủ hiển thị**, KHÔNG ghi ngược vào Doc, KHÔNG sửa `lib/boq/compute.ts` (L5: ghi
  ngược chỉ qua lệnh của chặng 2D).
- **Nghiệm thu:** sửa tay 1 ô m² → đổi vùng tô ở 2D → Tính lại: ô sửa tay GIỮ + có cảnh báo; ô khác đổi theo;
  bấm revert → về đúng số máy; reload app → override còn.

### B6 · GROUP + SUBTOTAL = SUMMARY-BAR (chủ: G4)
- **File đích:** `lib/present-editor/boq-group.ts` (MỚI, thuần + test) + `BoqTable.tsx`.
- **Gì:** nhóm theo **tầng** (`Base.storey` của entity đầu trong `entityIds` — cùng dự án hiếm khi 1 dòng vắt 2 tầng;
  vắt thì đánh dấu "nhiều tầng", KHÔNG chia đôi số) và theo **hạng mục** (cột Choice của B7, khi có).
  Mỗi nhóm 1 dòng subtotal do hàm thuần tính; grand total vẫn = `result.totalAmount`.
- **CẤM:** cho công thức đọc subtotal (bẫy Airtable, §6 spec).
- **Nghiệm thu:** dự án 2 tầng → 2 subtotal, cộng 2 subtotal = grand total; đổi nhóm không gọi lại API (`hit` không đổi).

### B8 · XUẤT XLSX CÓ `SUM()` SỐNG (chủ: **PHU** — vùng `lib/`)
- **File đích:** `lib/boq/xlsx.ts` (`buildSheetXml` :65-108) + `lib/boq/xlsx.test.ts`.
- **Gì:** dòng TỔNG hiện là số chết (`:93`). Đổi ô `H<total>` thành ô công thức OOXML
  `<c r="H12" s="4"><f>SUM(H2:H11)</f><v>…</v></c>` — giữ `<v>` làm giá trị cache để mở được ngay cả khi
  Excel chưa tính lại. Bảng 0 dòng → giữ số 0 tĩnh (không `SUM()` rỗng). Khi B6 xong: subtotal nhóm cũng là
  `SUM()` theo dải dòng của nhóm.
- **Nghiệm thu đo được:** (a) test mới trong `xlsx.test.ts` unzip `xl/worksheets/sheet1.xml` và assert có chuỗi
  `<f>SUM(`; (b) mở file bằng Excel/LibreOffice thật, sửa 1 ô `Thành tiền` → dòng TỔNG tự đổi.

### B10 · BA MẢNG §0c — CỔNG CHẶN SHIP (chủ: G4)
- **Phím tắt:** ↑↓←→ di ô · Enter sửa/xuống · Tab sang phải · Esc huỷ sửa · ⌘Z undo override · ⌘K palette có
  "Tạo BOQ" / "Tính lại" / "Xuất xlsx" (nối `components/CommandPalette.tsx` có sẵn) · `:focus-visible` thấy rõ.
- **Lệnh tương tác:** StatusBar chặng Trình bày mách trạng thái: "3 vùng lỗi — bấm để xem" · "đang giữ 2 ô sửa tay"
  · "vừa tính lại (không dùng nhớ)" khi `hit:false`.
- **Cảm ứng:** `--row 44` qua `(hover:none) and (pointer:coarse)`; badge/revert/nút "Xem trên bản vẽ" đều bấm
  được bằng chạm (hiện sẵn khi dòng selected).
- **Nghiệm thu:** đi hết bảng bằng bàn phím KHÔNG chạm chuột (làm được trọn 1 vòng: tạo → sửa 1 ô → revert →
  xuất); trên tablet mọi nút ≥44px; thiếu 1 trong 3 mảng = 🔴 chưa xong.

### B7 · CỘT NGƯỜI DÙNG THÊM — 6 KIỂU, TRẦN 30 (chủ: G4)
- **File đích:** `lib/present-editor/boq-columns.ts` (MỚI, thuần + test) + `BoqTable.tsx`.
- **Gì:** 6 kiểu Grist-tối-giản (Text · Numeric ₫ · Integer · Choice · Reference→matId · Computed-để-trống-chờ-B11)
  · **trần 30 công bố NGAY trong nút thêm cột** · nhập sai kiểu = **cho nhập + highlight ô**, không chặn cứng,
  không mất ký tự đang gõ (NC#6).
- **Nghiệm thu:** thêm cột thứ **31** → UI báo trần NGAY (không lỗi ngầm, không thêm được); gõ chữ vào cột
  Numeric → ô đỏ nhưng chữ còn nguyên; cột thêm sống qua reload.

### B9 · BẢN IN PDF (chủ: G4)
- **File đích:** `lib/present-editor/boq-print.ts` (MỚI) — dùng lại `stage-presets.ts` (A4/A3) + `printResScale`
  + `lib/pdf-font.ts:209 ensureVietnameseFont`.
- **Gì:** 2 preset "In văn phòng" (A4/A3 RGB 300dpi) / "Gửi nhà in" (+3mm bleed + crop marks + 1 dòng ghi RGB);
  chữ KHÔNG flatten; lặp dòng tiêu đề khi bảng tràn trang.
- **Nghiệm thu:** bảng 60 dòng → nhiều trang, trang nào cũng có header cột; mở PDF tìm được chữ
  **"ẳ ỹ ợ"** bằng Ctrl+F (ca test font Việt bắt buộc).

### B11 · ƒx MINI-DSL — ⛔ GATED, CHỜ PHU (chủ: PHU lib + G4 UI)
- **KHÔNG BẮT ĐẦU** trước khi `BAO-CAO-PHU.md` có mục trả lời "mini-DSL BOQ". Phạm vi khi mở khoá: đúng 4 thứ
  (`+ − × ÷` · tham chiếu cột CÙNG DÒNG · `ROUND(x,n)` · `IF(đk,a,b)`), KHÔNG cell-ref, KHÔNG cross-row.
- Trước khi mở khoá, cột Computed của B7 chỉ **hiển thị công thức cột cố định dạng chữ**
  (`thành_tiền = khối_lượng × đơn_giá × (1 + hao_hụt%)`) — đọc, không sửa.

---

## §E · CÂU HỎI CHẶN — cần TỔNG/Hoà trả lời (không tự chốt)
| # | Câu hỏi | Chặn việc |
|---|---|---|
| 1 | 1 dự án nhiều bản vẽ (sheet): BOQ tính theo **sheet đang mở** hay **gộp cả dự án**? (gộp = nguy cơ cộng trùng vùng tô giữa các sheet — `computeBoq` không biết ranh giới sheet) | B0, B6 |
| 2 | Bảng BOQ có phải là 1 "hồ sơ" lưu trong bộ sheet của chặng Trình bày (như deck) không, hay là màn tính-lại-mỗi-lần-mở? Ảnh hưởng chỗ lưu override B5 | B1, B5 |

## §F · NGHIỆM THU TOÀN PHIẾU (khớp §10 spec, đo được)
| # | Kiểm | Đạt khi |
|---|---|---|
| N1 | Dự án demo có đủ 4 loại lỗi | 4 khối lỗi đúng `message` engine; tổng không gồm vùng lỗi |
| N2 | Sửa tay 1 ô m² → đổi CAD → Tính lại | ô sửa tay giữ + cảnh báo; ô khác cập nhật; revert đúng số máy |
| N3 | Group theo tầng | Σ subtotal = `totalAmount` |
| N4 | xlsx mở bằng Excel thật | có `<f>SUM(`; sửa 1 số → TỔNG tự đổi |
| N5 | Thêm cột thứ 31 | báo trần 30 ngay |
| N6 | Ba mảng §0c + 2 theme | đủ 3 mảng, tab-walk trọn vòng, tablet ≥44px |
| N7 | Một-nguồn | `grep -rn "dataUrl" components/present-editor/boq/` = 0 · không có hàm tên `sync*` |

*COWORK-TRÌNH 03/08. Append-only. B11 gated chờ PHU; §E chờ TỔNG/Hoà.*
