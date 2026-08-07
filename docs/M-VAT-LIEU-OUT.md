# M-VAT-LIEU-OUT — phiên P13 VẬT LIỆU · PHẦN A (khoá nối) + PHẦN B (VIỆC 5-7) · 07/08 tối

> Sở hữu gốc: `lib/materials/` · `lib/cad/materials.ts` · `prisma/schema.prisma` (chỉ khoá nối).
> PHẦN B mở thêm UI (`components/materials/`). **CHƯA COMMIT** (V6 — Hoà commit).
> Mỗi kết luận một dòng file:dòng (N8). Chỗ chưa kiểm ghi CHƯA VERIFY (N5).

## 0 · SỰ CỐ ĐẦU PHIÊN — 2 phiếu chồng nhau, đã DỪNG đúng lúc
Phiếu 2 (build-ops/csg) dán vào phiên này lúc **phiên P14 đang code đúng việc đó cùng working
tree**: `lib/three/build-ops.ts` mtime 15:05:07, `build-ops.test.ts` 15:06:40 — đo lúc 15:06:52
(lệch 12 giây), nội dung trên đĩa đã có đủ VIỆC 1-4 phiếu đó (`build-ops.ts:119` đề mục
"BỘ LỆNH DỰNG HÌNH MỞ RỘNG (G-M17-02)"). ⇒ KHÔNG code trùng, không đụng 2 file đó, báo Hoà và
được giao PHẦN B này. Ai nghiệm thu build-ops thì tìm phiên P14 (chưa thấy `M-BUILD-OPS-OUT.md`
lúc 15:06 — CHƯA VERIFY lại sau đó).

## PHẦN A — KHOÁ NỐI BA MẢNH (P13 VIỆC 1+2, nền cho VIỆC 5/6)

### Quyết định then chốt: **matId = `ProductSpec.sku`** (KHÔNG thêm cột DB)
- ATLAS đã có mã nghiệp vụ: cột "Mã vật liệu" → `sku` (`lib/lark/atlas-material-map.ts:26,71`).
- `LibrarySheet` cũng đã khớp `SheetItem.code ↔ ProductSpec.sku` (M-THU-VIEN-OUT VIỆC 3) — thêm
  cột `matId` riêng là **đẻ hệ mã thứ hai**, đúng điều phiếu cấm.
- Hệ quả tốt: **không đụng `prisma/schema.prisma`**, không migrate, không dẫm quả mìn cột
  (2 cột `room`/`confidence` hoá ra ĐÃ migrate xong — `lib/materials/warehouse/dto.ts:33-36` ghi
  06/08 "PRAGMA table_info = 34 cột"; cảnh báo đỏ trong schema.prisma là VỎ CŨ chưa gỡ).

### Dây đã nối (file:dòng)
| Mảnh | Khoá | Ở đâu |
|---|---|---|
| ① THỊ GIÁC `MaterialPbr` | key của kho PBR | `lib/materials/pbr-store.ts` (MỚI — localStorage studio, khuôn `lib/colors/store.ts`; lý do KHÔNG cột DB: 2.1.9.i cấm nhồi PBR vào ProductSpec) |
| ② THƯƠNG MẠI `ProductSpec` | `sku` (sẵn có) | so khớp `normalizeMatId()` — trim+UPPER |
| ③ 2D `MaterialDef` | field `matId?` MỚI | `lib/cad/materials.ts:66-75` (docstring ghi rõ khác `atlasRecordId`) |

- **`lib/materials/resolve.ts` (MỚI)** — `getMaterial(matId, sources)` trả `{pbr, commercial,
  flat}`, mảnh thiếu = null từng mảnh, không throw không bịa; THUẦN (nguồn tiêm qua tham số).
  Test `lib/materials/resolve.test.ts` **9/9** (đủ 3 mảnh · chuẩn hoá hoa/thường · thiếu từng
  mảnh · sku=null không khớp mã rỗng · catalog mặc định flat=null).
- VIỆC 3 PHẦN A (lan truyền 3 nơi khi đổi matId) **CHƯA LÀM TRỌN** — mới có tầng đọc hợp nhất;
  đường render 3D chưa ĐỌC `MaterialPbr` (grep 07/08: `MaterialPbr` chỉ được import ở
  `lib/cad/materials.ts` + `lib/cad/idfc.ts`; `components/three/material-preview.ts:22` tự khai
  "khi PHU xong schema thì thay materialFromSpec bằng đọc PBR thật" — đó là bước nối tiếp, đụng
  `components/three` nên cần phiên có quyền vùng đó).

## PHẦN B VIỆC 5 — LỚP CHỈNH VẬT LIỆU "GỌN VÀ ĐÚNG" ✅ (có ảnh, 2 theme)

### Tầng logic `lib/materials/material-edit.ts` (MỚI) — test **46/46**
- 11 loại đúng phiếu (`MATERIAL_TYPES:52-64`), roughnessInit/metallic **khoá cứng bằng test vào
  bảng suy đoán** `pbr-from-category.ts` qua `inferPbrFromCategory(categoryProbe)` — 2 bảng đổi
  lệch nhau là test đỏ, không lệch thầm lặng.
- 2 khoá vật lý đúng chốt: `metallic` CHỈ đổi qua `applyMaterialType()` (0/1 theo loại, không có
  API nào khác); `specular` ép `DEFAULT_PBR.specular` (= 0.04, MỘT nguồn số, `schema.ts:81`).
- Kính: `transmission` tự mở (`GLASS_TRANSMISSION_INIT` 0.9/IOR 1.5), rời kính bị **XOÁ** (sơn có
  khúc xạ là sai vật lý âm thầm — test chốt).
- K3: nguồn suy đoán giữ `suyDoan:true`; `applyMaterialType`/`setRoughness`/`setTransparency` xoá
  cờ (người dùng vừa khai báo); `setBaseColor` KHÔNG đụng cờ (màu độc lập bảng suy đoán).
- `MaterialPbr.typeId?` thêm ở `lib/materials/schema.ts` (K4: nơi tiêu thụ = editor + chọn cảnh
  quả cầu; export engine bỏ qua — ghi trong docstring).

### UI `components/materials/MaterialPbrEditor.tsx` (MỚI) — mount THẬT (N6)
- Nút "Chất liệu render" (icon Orbit) mỗi hàng CÓ SKU: `MaterialTable.tsx` (prop `onEditPbr`,
  nút chỉ render khi `m.sku`) ← `MaterialsScreen.tsx` (state `pbrEditing` + mount editor).
  Đếm trên trang thật: **10/10 hàng có nút** (read_page).
- 4 núm: ① select 11 loại · ② color · ③ range nhám · ④ range độ trong CHỈ hiện với kính.
  2 khoá HIỆN nhưng không có control (`🔒 metallic = x (theo loại) · specular = 0.04 (IOR 1.5)`).
  3 map Normal/AO/Height = nút NẠP ẢNH (FileReader→data-URI, không nhập số). "Nâng cao" giấu
  clearcoat/sheen/emissive/opacity.mode. Badge suy đoán khi `suyDoan` còn trên pbr.
  Quả cầu xem trước = `MaterialSphere` sẵn có (kind theo loại, đổi núm là render lại).
- Lưu = `savePbr(matId)` (kho studio); "Về mặc định" = `removePbr` → suy đoán lại (KS4 lùi được).

### Nghiệm thu N6 — browser thật 127.0.0.1:3006 (server riêng phiên, đã verify bằng mắt)
- `SW-TRV-BE` (Đá travertine ong vàng): mở editor → badge "SUY ĐOÁN từ tên/danh mục" hiện đúng.
- Chọn **Gỗ** → quả cầu nâu mờ, nhám 0.60, `metallic = 0 (theo loại)`, badge suy đoán TẮT (ảnh 1).
- Đổi **Kim loại** → quả cầu **vàng kim phản chiếu**, `metallic TỰ NHẢY 0→1`, nhám reset 0.30 —
  **không tồn tại control nào kéo được metallic** (ảnh 2).
- Đổi **Kính** → núm ④ "Độ trong · 0.90" xuất hiện, quả cầu sang cảnh nền checker (ảnh 3).
- Lưu → localStorage `if.materials.pbr.v1` = `{"SW-TRV-BE":{roughness:.5, metallic:0,
  typeId:"da-tu-nhien", specular:.04, baseColor:"#b5854e"}}` — transmission đã bị dọn khi rời
  kính, ĐÚNG. Theme tối chụp thêm 1 ảnh — chữ rõ, không vỡ (ảnh 4). Console: 0 lỗi MỚI (các lỗi
  hiện trong buffer là vết cũ của sự cố §V7-bug bên dưới, trước khi sửa).
- 🟡 CHƯA VERIFY: "render" theo nghĩa PHỐI CẢNH 3D đổi theo — vì đường đọc PBR vào scene 3D chưa
  nối (xem PHẦN A). Quả cầu render THẬT (three.js PMREM) là mức chứng minh được hôm nay.

## PHẦN B VIỆC 6 — PROBE 3 CỬA NẠP (đúng lệnh "chưa nạp hàng loạt trước khi biết cửa nào thông")

| Cửa | Kết quả | Bằng chứng |
|---|---|---|
| ① ATLAS sync | 🔴 TẮC — 2 tầng | POST `/api/atlas-materials/sync` từ session đăng nhập thật → **403 "Chỉ admin"** (user dev hiện tại không phải admin). Tầng sau còn nguyên: Lark **131006** app chưa được mời đọc Wiki ATLAS (route.ts:16-28 ghi 04/08, cần Hoà thao tác trong Lark; field mapping `ATLAS_FIELD_NAMES` vì thế CŨNG chưa verify được) |
| ② Bảng tính Excel/CSV | ✅ THÔNG | 4 bộ test warehouse **93+119+25+9 = 246/246 pass** (xlsx-parse/column-mapping/image-match/apply-import); UI wizard đã verify browser 04/08 (P3, STATUS.md). Đây là cửa NÊN dùng để nạp 30 món |
| ③ Tệp/ảnh `/api/library` | ✅ THÔNG | POST 1 ảnh probe `usage:'material'` → **200** (id `cmsiox6rs0001w9p0i4msaa8r`) → DELETE → **200**. `route.ts:52` nhận usage `material`/`furniture`. **0 rác để lại** |

→ **Kế hoạch nạp 30 món** (chưa làm — chờ Hoà gật cửa): soạn 1 file Excel 30 dòng (15 vật liệu ·
10 furniture · 5 fit-out) đi cửa ②; ảnh swatch đi cửa ③ hoặc ghép-ảnh-theo-SKU sẵn có của wizard;
PBR gán qua editor VIỆC 5 (matId=sku khớp tự động). Giá phải là SỐ THẬT vào `priceVnd` — 10 món
hiện trong DB **priceVnd=null hết** (chỉ có priceNote text "≈…tham khảo"), đúng bối cảnh phiếu.

## PHẦN B VIỆC 7 — GỠ MOCK KHỎI GIAO DIỆN

- **(b) + thumb ánh sáng: ĐÃ XONG TỪ P7 SÁNG NAY** — kiểm code thật (không tin báo cáo):
  `lib/library/shelves.ts:25` `LIBRARY_DATA_IS_MOCK=true` · 18 kệ `count:null` → UI "—" ·
  badge "Dữ liệu mẫu" `LibrarySheet.tsx:283-285` · 5 kind ánh sáng `thumb-kinds.ts:32,54-56`.
  Nhìn thấy bằng mắt trên browser phiên này (5 thẻ preset khác nhau rõ). KHÔNG làm lại.
- **(a) nối số đếm `/api/library` thật + (c) cấp `imageUrl`**: ⛔ CHƯA LÀM — lý do thật: file
  `components/library/*` đang bị ≥2 phiên khác ghi đè NGAY TRONG PHIÊN NÀY (xem §V7-bug), viết
  chồng lên là tái diễn đúng sự cố "hai phiên chung .git" lần thứ 6. Nhánh (c) đã có sẵn cửa:
  `ItemThumb.tsx:61` đọc `item.imageUrl`, `shelves.ts:116` đã khai field — chỉ còn bơm URL từ
  `/api/library` khi thay mock. Gom vào phiếu sau cùng người sở hữu vùng.

## 🔴 V7-BUG — 2 bug CHẶN vớ được & đã sửa (ngoài phiếu, bắt buộc để verify được)

1. **Tấm Thư viện đóng xong VẪN che nguyên màn** (`components/library/library-sheet-css.ts:70-79`)
   — bản "card nổi tại chỗ" sáng nay đổi transform đóng thành `translate(-50%,10px) scale(.97)`
   nhưng QUÊN ẨN (bản cũ trượt hẳn ra ngoài màn nên không cần). Đo: `data-open="false"` mà tấm
   hiện đủ, mọi trang mount AppShell (`/materials`…) bị che không thao tác được. Sửa đúng G1
   (không animate opacity): `visibility:hidden` TRỄ 200ms theo transform, mở thì delay 0.
   Verify: đóng tấm → bảng kho thao tác bình thường (ảnh chụp có bảng đầy đủ).
2. **Backtick trong comment CSS làm GÃY BUILD toàn app** (`library-sheet-css.ts:59,63,148,149,
   156,158,184` — chuỗi CSS là template literal, backtick trong comment "SỬA 07/08 CHIỀU" của
   phiên khác kết thúc chuỗi sớm ⇒ `/materials` 500/404, mọi route import AppShell chết). Đã gỡ
   toàn bộ backtick bên trong literal (giữ nguyên nội dung chữ). Phiên viết comment đó cần biết:
   **file này cấm backtick trong CSS**.
   Phụ: 5 dev server (3000/3001/3002/3006…) chung 1 thư mục `.next` giẫm manifest của nhau —
   `/materials` 200→404 xen kẽ; phải restart server 2 lần mới verify được. Đề nghị ghi luật
   session: mỗi phiên cần verify nên chờ phiên khác ngừng ghi, hoặc Hoà cân nhắc
   `distDir` riêng theo port (việc infra, chưa đụng).

## PHẦN A VIỆC 4 — BẢNG FURNITURE/FIT-OUT (chỉ bảng, ⛔ chưa code — chờ TỔNG duyệt)

| Loại | Hình học ở đâu | Dữ liệu ở đâu | Khoá nối hiện có | Còn thiếu |
|---|---|---|---|---|
| Furniture | `lib/cad/furniture.ts` `BLOCK_MAP` + 54 block `public/cad-library/*.dxf` | `ProductSpec{kind:'furniture'}` (7 món thật trong DB) | **`ProductSpec.drawingBlock`** (schema.prisma, "key BlockDef/manifest id") — dây hình↔giá ĐÃ CÓ SẴN, ít ai nhớ | dây VẬT LIỆU: món làm bằng matId nào (đề xuất: `materials` JSON string[] sẵn có đổi từ chữ tự do 'oak' sang matId — khi đó đổi 1 vật liệu → furniture đổi theo, đúng Hoà chốt "vật liệu là GỐC") |
| Fit-out | chưa có block riêng (dùng chung block/hatch) | `ProductSpec{kind:'millwork'/'fixture'}` (0 món trong DB) | như furniture | như furniture + chưa có món mẫu nào để thử |

## File đụng trong phiên
| File | Việc |
|---|---|
| `lib/materials/material-edit.ts` + `.test.ts` (MỚI) | VIỆC 5 logic — 46/46 |
| `lib/materials/pbr-store.ts` (MỚI) | kho PBR studio theo matId |
| `lib/materials/resolve.ts` + `.test.ts` (MỚI) | PHẦN A VIỆC 2 — 9/9 |
| `lib/materials/schema.ts` | +`typeId?` (docstring K4) |
| `lib/cad/materials.ts` | +`MaterialDef.matId?` (khoá nối ③) |
| `components/materials/MaterialPbrEditor.tsx` (MỚI) | VIỆC 5 UI |
| `components/materials/MaterialTable.tsx` · `MaterialsScreen.tsx` | mount editor (nút Orbit + state) |
| `components/library/library-sheet-css.ts` | 2 bug chặn (V7-BUG — vùng P7, sửa vì chặn verify, đã ghi rõ) |

KHÔNG đụng: `prisma/schema.prisma` (cố ý — matId=sku) · `lib/three/*` (P14) · `lib/boq` ·
`lib/ffe` · `lib/cad/*` khác. `npx tsc --noEmit -p .` sạch (chỉ còn lỗi CŨ đã biết
`lib/cad/render-layer-index.test.ts:36`, làn khác). Test mới+lân cận: 46+9+246+31+26+30(export-vray)
đều xanh, chạy trong phiên.

## Chờ Hoà quyết
1. Cửa ① ATLAS: mời app `cli_aae1f2a68178de15` làm collaborator đọc Wiki ATLAS (đã treo từ 04/08)
   + cho biết tài khoản admin để chạy sync thật.
2. Gật kế hoạch nạp 30 món qua cửa ② (tôi soạn file Excel mẫu ở phiên sau) — danh sách món "dùng
   nhiều nhất" nên do Hoà/NC chỉ định, tôi không bịa danh mục thương mại.
3. VIỆC 7a/7c + nối PBR vào scene 3D (`components/three`) — cần chốt ai sở hữu vùng đang bị nhiều
   phiên ghi chồng.
