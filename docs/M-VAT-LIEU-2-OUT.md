# M-VAT-LIEU-2-OUT — P13 vòng 2: ẢNH VÂN cho vật liệu (G-M17-03) · 07/08 tối muộn

> Vùng: `lib/materials/` · `components/materials/` · chạm `lib/three/`/`components/three/` ĐÚNG
> chỗ đọc map (đã kiểm mtime trước khi đụng: `material-preview.ts` 03/08 · `MaterialSphere.tsx`
> 03/08 · `lib/three/materials.ts` 02/08 — không phiên nào đang ghi). **CHƯA COMMIT** (V6).
> Trạng thái cuối lượt: **VIỆC 1·2·3 XONG có ảnh verify · VIỆC 4 XONG (bảng) · VIỆC 5 XONG từ
> vòng 1, bổ sung bảng nguồn-trường · 1 mục CHƯA VERIFY ghi rõ.**

## VIỆC 1 — MaterialPbr thêm 4 trường ✅ (`lib/materials/schema.ts`)
- `baseColorMapUrl?` — docstring ghi ĐẬM: nạp **sRGB**, khác 5 map linear; đặt nhầm colorSpace là
  màu lệch toàn cục (gamma 2 lần); glTF: có map thì `baseColor` thành tint/factor.
- `roughnessMapUrl?` · `metallicMapUrl?` — linear, kênh xám; có map thì số thành hệ số nhân.
- `uvScaleMm? {w,h}` — bước lặp vân MM THẬT, áp CHUNG 7 map (một lưới UV); không có nó viên gạch
  600mm hiện thành 3m (đúng câu phiếu, ghi vào docstring).
- Đúng chuẩn glTF metal/rough như đầu file đã chốt; KHÔNG đụng giá/NCC/hao hụt (2.1.9.i).

## VIỆC 3 — chỗ đọc map: `lib/three/pbr-three.ts` (MỚI) ✅
Một file — MỘT nơi gán colorSpace/repeat, quả cầu xem trước và scene 3D sau này cùng đi qua,
không rải công thức 2 nơi rồi lệch:
- `loadPbrTextures(pbr)` — tải 7 map qua cache promise theo URL (mỗi ảnh decode 1 lần); map hỏng
  bị bỏ qua RIÊNG map đó, không kéo sập cả cụm; ảnh lỗi không găm cache vĩnh viễn.
- `buildPbrMaterial(pbr, tex)` — MeshPhysicalMaterial đủ: baseColor(tint khi có map)/roughness/
  metallic (+3 map mới) · normal/ao/height(bump) · transmission+ior · clearcoat · sheen ·
  emissive · opacity(cutout/blend). Texture cache dùng CHUNG ⇒ **clone trước khi đổi repeat**
  (2 vật liệu cùng ảnh không giẫm repeat của nhau — bug loại này rất khó truy sau).
- `uvRepeatOf(pbr)` — quy ước vật 1 mét: repeat = 1000/w × 1000/h (comment tại chỗ).
- `pbrCacheKey(pbr)`/`cheapUrlKey` — khoá cache render không nhét nguyên data-URI trăm KB.
Nối vào lõi quả cầu (`components/three/material-preview.ts`):
- `PreviewSpec.pbr?` mới + **`renderMaterialPreviewAsync()`** (map là ảnh phải chờ decode) — cùng
  lõi `renderCore`, cùng cache PNG; caller cũ (`renderMaterialPreview` sync) Y NGUYÊN. Đây đúng
  lời hẹn tự khai ở đầu file ("khi PHU xong schema thì thay materialFromSpec bằng đọc PBR thật").
- `MaterialSphere.tsx` chuyển sang gọi bản async (không pbr thì tương đương sync, fallback giữ
  nguyên lúc chờ) — kệ Thư viện/Inspector không đổi hành vi.
- Dọn tài nguyên: dispose ĐỦ 6 map clone của lượt render (map gốc sống trong cache).

## VIỆC 2 — editor 6 nút nạp ảnh + bước lặp vân ✅ (`components/materials/MaterialPbrEditor.tsx`)
- Hàng 1 (mới, đặt TRÊN vì là thứ người dùng cần nhất): **Ảnh vân màu · Ảnh nhám · Ảnh kim loại**
  — cùng khuôn `mapBtn()` sẵn có, nạp ảnh không nhập số. Hàng 2: Normal/AO/Height như cũ.
- Ô "Bước lặp vân (mm)" w×h — CHỈ hiện khi đã có ≥1 map (chưa có ảnh thì số chưa có nghĩa);
  nhập 1 chiều tự gương sang chiều kia lần đầu.
- Quả cầu nhận `pbr` thật (`PreviewSpec.pbr`), id trộn `pbrCacheKey` ⇒ nạp map là cầu render lại.

### VERIFY — ảnh TRƯỚC/SAU trên browser thật (server 3000 dùng lại theo memory dev-server-ports)
- **TRƯỚC**: mở editor `SW-TRV-BE` → quả cầu **MÀU TRƠN xám** (đúng bệnh Hoà bắt — ảnh 1).
- Nạp ảnh vân travertine (canvas 512px dải ngang + lỗ rỗ — sinh tại chỗ, không ảnh ngoài, không
  vướng license) qua ĐÚNG input UI (DataTransfer → `input.files` → change): **SAU**: quả cầu
  **HIỆN VÂN dải ngang rõ** (ảnh 2), nút đổi thành "Loaded — click to replace", ô bước lặp hiện.
- `uvScaleMm` 250×250 → vân **mịn/dày hẳn** (~4 chu kỳ/m so 1 — ảnh 3, so bằng mắt được).
- 0 lỗi console · KHÔNG bấm Lưu trên origin 3000 (localStorage thật của Hoà — đường lưu đã verify
  vòng 1 trên 3006) · localStorage 3000 xác nhận `null` sau khi đóng.
- 🟡 CHƯA VERIFY: roughnessMap/metallicMap bằng ảnh thật qua UI (cùng đường code `loadPbrTextures`
  với color map — chỉ khác colorSpace; suy ra chạy nhưng chưa chụp); normal/ao/height đã có từ
  trước, không kiểm lại.
- `npx tsc --noEmit -p .` sạch **phần của mình** (còn: 1 lỗi CŨ `render-layer-index.test.ts` +
  lỗi `ve3d-css.ts` của PHIÊN KHÁC đang sửa sống — xem mục sự cố).

## VIỆC 4 — ĐỐI CHIẾU `docs/mocks/Thư viện.dc.html` ↔ code màn Thư viện (KHÔNG sửa mock)

| Mock có gì | Code có chưa | Lệch ở đâu (file:dòng) |
|---|---|---|
| 4 chip phạm vi **Của tôi · Của studio · Dự án này · Kho chung** | có chip phạm vi nhưng bộ KHÁC: Tất cả · Chung · Studio · Chặng này · Dự án này · Gần đây | `LibrarySheet.tsx:462` — khác TÊN + khác TẬP ("Của tôi"/"Kho chung" grep = 0); cần Hoà chốt bộ nào là chuẩn |
| 6 kệ LOẠI: Vật liệu **248** · Đồ đạc **412** · Khối ba chiều · Ký hiệu bản vẽ · Mẫu hồ sơ · Bộ nhận diện | kệ chia THEO CHẶNG + kệ chung (`shelves.ts:47-…`), count = null hiện "—" | mock đếm SỐ THẬT, code cố ý "—" vì `LIBRARY_DATA_IS_MOCK` (`shelves.ts:25`) — lệch NGHIỆP VỤ đã biết, đóng khi nối `/api/library` (VIỆC 7a vòng 1, còn treo) |
| **Nhóm vật liệu** con: Gỗ tự nhiên · Sơn và vữa · Đá tự nhiên · Vải và da · Kim loại | CÓ — grep "Nhóm vật liệu" ra `LibrarySheet.tsx` + `shelves.ts` | khớp (không kiểm từng nhóm một — CHƯA VERIFY chi tiết 5 nhóm) |
| Nhãn nguồn per item: **ATLAS / TỰ TẠO / PLACEHOLDER** | có badge PHẠM VI (`SCOPE_BADGE_TEXT`, `LibrarySheet.tsx:532`) | khác NGỮ NGHĨA: mock phân theo NGUỒN GỐC, code phân theo PHẠM VI; "PLACEHOLDER" grep = 0 — chưa có khái niệm món giữ-chỗ |
| Cột thông số: Hãng · Đơn vị · Giá/m² · **Độ nhám 0.42 · Độ bóng 0.18** | khung CÓ đủ 6 dòng (`spec-panel.ts:6,95`) nhưng `buildSpecRows(displayItem, displaySpecSource)` gọi **2 tham số** — tham số 3 `surface` không ai truyền ⇒ Độ nhám/Độ bóng LUÔN "—" | `LibrarySheet.tsx:260`. NAY ĐÃ CÓ NGUỒN THẬT: `getPbr(matId)` (`lib/materials/pbr-store.ts`) — nối 1 dòng là xong, chưa làm vì vùng library đang nhiều phiên ghi (đề xuất phiếu sau) |
| "Dùng cho vật đang chọn" · "Sửa bản sao" | CÓ cả hai (grep ra `LibrarySheet.tsx`) + bấm đúp = dùng (`:509-516`) | khớp |
| Tạo nhanh "Gõ tên vật liệu rồi bấm Enter" · "Thêm vật liệu mới" | "Thêm vật liệu mới" CÓ | ô gõ-Enter: CHƯA VERIFY từng bấm thử (chỉ grep thấy chuỗi nút) |
| Header ngữ cảnh "Căn hộ Thảo Điền · Khung nhìn ba chiều · **Đang chọn: Tường sau**" | sheet mở qua `openLibrarySheet({stage, shelfId})` — KHÔNG nhận "vật đang chọn" trong scene | `use-library-sheet.ts:22-27` — thiếu kênh selection-context; là tiền đề của nút "Dùng cho vật đang chọn" hoạt động đúng nghĩa |
| Footer "Đã lưu 14:32" | footer có đếm kệ; nhãn giờ-tự-lưu chưa thấy | CHƯA VERIFY sâu (không chặn gì) |

## VIỆC 5 — G-M17-01: KHOÁ NỐI đã dựng vòng 1, bảng NGUỒN-CỦA-TRƯỜNG (không gộp, 2.1.9.i)

Khoá: **matId = `ProductSpec.sku`** (vòng 1, `docs/M-VAT-LIEU-OUT.md`). Ba mảnh giữ vai trò:

| Trường | Mảnh NGUỒN duy nhất | Ai được đọc |
|---|---|---|
| giá `priceVnd` · `unit` · vendor · hao hụt · quy cách | **ProductSpec** (DB) | BOQ · cột thông số ④ · tấm thông số kệ |
| baseColor + 7 map + roughness/metallic/transmission/uvScaleMm | **MaterialPbr** (kho `pbr-store.ts` theo matId) | quả cầu preview · scene 3D (qua `pbr-three.ts`) · export V-Ray/D5 |
| hatch 2D `hatchPattern/Scale/Angle` · màu bản vẽ · tones swatch | **MaterialDef** (`lib/cad/materials.ts`) | bản vẽ 2D · MaterialPalette |
| Độ nhám/Độ bóng trên cột thông số ④ | MaterialPbr (KHÔNG phải ProductSpec) | spec-panel qua tham số `surface` — hiện chưa ai truyền, xem bảng VIỆC 4 |
Đọc gộp 3 mảnh: `lib/materials/resolve.ts` `getMaterial(matId)` — mảnh thiếu = null, không bịa.

## 🔴 Sự cố phiên (ghi để TỔNG thấy hệ đang chảy máu ở đâu)
1. `components/three/ve3d-css.ts` bị phiên khác ghi backtick vào template literal (16:23:47, tôi
   bắt được khi tsc) → họ TỰ SỬA 90 giây sau (16:25:17). Tôi KHÔNG đụng file (đúng luật phiếu
   "vùng có phiên khác đang mở ⇒ DỪNG, BÁO"). Đây là lần THỨ BA trong ngày họ bệnh
   backtick-trong-css-literal (2 lần trước ở `library-sheet-css.ts`, vòng 1 đã vá) — đề nghị
   TỔNG phát luật: **file `*-css.ts` cấm backtick trong comment**.
2. §0aa tái diễn: server 3006 của phiên treo "Starting..." >3 phút rồi route 200→404 xen kẽ (5
   next-server chung `.next`). Giải theo memory `dev-server-ports`: **dùng lại server 3000 sẵn
   có** để verify — chạy ổn, 0 lỗi console, không để dấu vết (không Save, localStorage sạch).

## File đụng vòng 2
| File | Việc |
|---|---|
| `lib/materials/schema.ts` | VIỆC 1 — 4 trường mới |
| `lib/three/pbr-three.ts` (MỚI) | VIỆC 3 — nơi DUY NHẤT đọc map/colorSpace/repeat |
| `components/three/material-preview.ts` | `PreviewSpec.pbr` + `renderMaterialPreviewAsync` + dispose đủ map |
| `components/three/MaterialSphere.tsx` | gọi bản async |
| `components/materials/MaterialPbrEditor.tsx` | VIỆC 2 — 3 nút map mới + ô bước lặp vân + pbr vào preview |

Không đụng: `lib/three/materials.ts` (catalog mock — không phải chỗ đọc map) · `lib/cad` ·
`components/library` (chỉ đọc để đối chiếu VIỆC 4) · mock (VIỆC 4 cấm sửa — không sửa).

## Cuối lượt
- **Đã xong**: VIỆC 1 · VIỆC 2 (verify ảnh trước/sau + uvScale) · VIỆC 3 (điểm nối chuẩn, caller
  cũ nguyên vẹn) · VIỆC 4 (bảng 9 dòng) · VIỆC 5 (bảng nguồn-trường).
- **Còn treo** (việc mới lộ ra, chưa được giao): nối `surface` (Độ nhám/Độ bóng từ `getPbr`) vào
  cột thông số ④ — 1 dòng ở `LibrarySheet.tsx:260`, chờ vùng library hết kẹt phiên · scene 3D
  thật dùng `buildPbrMaterial` (cần gắn matId lên bề mặt khối — việc lớn hơn, K4 chờ UI gán).
- **CHƯA VERIFY**: roughnessMap/metallicMap qua UI bằng ảnh thật · ô gõ-tên-Enter của mock ·
  chi tiết 5 nhóm vật liệu con.
