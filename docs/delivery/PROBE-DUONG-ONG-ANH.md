# PROBE · ĐƯỜNG ỐNG ẢNH / TEXTURE — pixel biến mất ở đâu

**05/09/2026 · P0 capability probe.** Không phải audit rộng, không đẻ máy soi mới.
Triệu chứng chủ dự án báo: *"IF không dùng được ảnh/texture thật — nền, vật liệu và 3D thường
thành phẳng lì, trơn, chỉ còn màu."*

---

## RANH GIỚI HỎNG ĐẦU TIÊN

> # PIXEL KHÔNG BIẾN MẤT. NÓ CHƯA BAO GIỜ ĐƯỢC MỜI VÀO.
>
> **9 ảnh vật liệu thật nằm sẵn trong `public/mau-vat-lieu/`** — gồm đúng hai món đang ship
> (`go-soi-trang.png` · `go-oc-cho.png`), 512×512, vân gỗ thật, lát được.
> **`grep -rn "mau-vat-lieu" lib/ components/ app/ prisma/` = 0 dòng.**
>
> Không một dòng mã nào trỏ tới chúng. Thư mục ảnh **mồ côi hoàn toàn**.

Đây là ranh giới **sớm nhất**, và nó giải thích trọn triệu chứng: mọi tầng phía sau đều **có khả
năng** dùng ảnh; chúng chỉ chưa bao giờ nhận được một ảnh nào.

**Ranh giới hỏng THỨ HAI, độc lập** — sửa cái trên xong vẫn còn cái này:

> **Scene 3D chỉ tiêu thụ MÀU.** `components/three/Scene3DViewer.tsx` — đếm mọi tham chiếu
> `.map=` · `map:` · `TextureLoader` · `buildPbrMaterial` · `MaterialPbr` = **0**.
> Nó dựng `MeshStandardMaterial({ color: b.colorHex, roughness: 0.78, metalness: 0.02 })`
> (`:478`, `:491`). Cầu 2D→3D `lib/three/cad-to-obj.ts:361` chỉ chuyển tiếp **một `colorHex`**.
>
> Máy dựng vật liệu ĐỦ MAP **đã tồn tại và đúng** — `lib/three/pbr-three.ts`: 7 map, `uvScaleMm`
> → `repeat`, colorSpace tách sRGB/linear đúng chỗ, `RepeatWrapping`. Nhưng **nơi gọi duy nhất là
> quả cầu xem trước** (`components/three/material-preview.ts:301`). Scene thật không gọi.

---

## BẢNG TẦNG

| tầng | trạng thái | bằng chứng | ai sửa |
|---|---|---|---|
| **A · NẠP ẢNH** | **PASS** | `/textures/chan-doan/chan-doan-512.png` trả `200 · 8376 byte · image/png` trên app thật | — |
| **B · ẢNH TRONG GIAO DIỆN** | **PASS** | `/materials` render `<img>` thật: 2/2 vật liệu có mã | — |
| **C · NỀN / WALLGALLERY** | **NOT IMPLEMENTED** | `lib/wallpaper/css.ts` là `linear-gradient` + `repeating-linear-gradient`; `SystemWallpaper.tsx` có **0** `<img>` · **0** `url(` · **0** `next/image`. Không có kho ảnh nền nào | ngoài lát cắt vật liệu |
| **D · XEM TRƯỚC VẬT LIỆU** | **PARTIAL** | đường map **có** (`material-preview.ts:301` gọi `buildPbrMaterial` khi `spec.pbr` có map) nhưng **không vật liệu nào ship map** ⇒ luôn rơi về `twoToneTexture` — hai màu, không vân | **V5** |
| **E · MẶT 2D** | **PASS** | V1 `defsHatGiong()` — hatch vector, không cần pixel. `2D ✓` trên 2/2 món | xong |
| **F · 3D TIÊU THỤ MAP** | **FAIL** | 0 tham chiếu map trong `Scene3DViewer.tsx`; `cad-to-obj.ts:361` chỉ mang `colorHex` | **V8** |
| **F1 · baseColor map** | **FAIL** | như trên | V8 |
| **F2 · normal map** | **FAIL** | như trên | V8 |
| **F3 · roughness map** | **FAIL** | như trên | V8 |
| **F4 · metallic map** | **FAIL** | như trên | V8 |
| **F5 · AO map** | **FAIL** | như trên | V8 |
| **F6 · height/displacement** | **FAIL** | như trên | V8 |
| **G · TỈ LỆ VẬT LÝ (`uvScaleMm`)** | **PARTIAL** | công thức đúng và có test (`uvRepeatOf`, `pbr-three.ts:23`), nhưng chỉ tới quả cầu; **chưa tới scene** vì F FAIL | V8 |
| **H · LƯU / MỞ LẠI** | **PASS** (tham số) · **UNVERIFIED** (map) | `MaterialPbr` sống qua đóng-hẳn-mở-lại (0.6→0.17, đã chứng minh). Map **chưa từng được lưu** vì chưa từng có | V5 rồi V8 |
| **I · `.idfc` mang đi** | **UNVERIFIED cho map** | vòng đời `.idfc` PASS 28/28, nhưng **chưa ca nào mang `baseColorMapUrl`** | sau V8 |

⛔ **Không có ô "xanh gộp".** *Màu + độ nhám vô hướng* **không phải** bằng chứng texture chạy.

---

## ẢNH CHẨN ĐOÁN — `public/textures/chan-doan/`

Cố ý **xấu** và **bất đối xứng**, vì ảnh gỗ đẹp là ảnh dò tồi: mất map thì vẫn ra một mảng nâu,
lật thì vẫn "trông giống gỗ", sai tỉ lệ thì vẫn là gỗ. Ảnh này hỏng kiểu gì cũng lộ ngay:

| yếu tố | bắt được kiểu hỏng nào |
|---|---|
| ô cờ 4×4 tương phản cao | **mất map** ⇒ còn đúng một màu xám trung bình |
| chữ `IF` + tam giác `▲` | **lật** ngang/dọc |
| bốn góc đánh số `1 2 3 4` | **xoay** 90° |
| 24 sọc dọc **mảnh dần** | **sai tỉ lệ UV** ⇒ bệt ở dải nào cho biết sai bao nhiêu |
| vạch xanh `100 mm` | **sai tỉ lệ vật lý** |
| chấm đỏ **lệch tâm** | mọi phép lật/xoay đều đổi chỗ nó |

Quy ước: **1 chu kỳ = 400×400 mm** ⇒ dán lên tường 4000 mm phải thấy **đúng 10 chu kỳ**, không
phải một ảnh kéo giãn phủ cả tường. Sinh lại: `node scripts/sinh-anh-chan-doan.mjs`.

---

## ẢNH HƯỞNG NGƯỜI DÙNG

Kiến trúc sư đặt gỗ óc chó lên tường rồi mở 3D — **thấy một mảng nâu phẳng**. Không thớ, không
hướng vân, không cỡ thật. Không phán được vật liệu, không trình khách được, và không phát hiện
được lỗi *"vân chạy sai chiều"* — lỗi thi công tốn tiền thật.

Cùng gốc với chỗ V5 đang vướng: nấc **JUDGE** không có gì để phán, vì **chưa có ảnh nào đi vào hệ**.

## CÁCH SỬA — sửa RANH GIỚI, không vá từng vật liệu

1. **Nối 9 ảnh mồ côi vào vật liệu ship** (`baseColorMapUrl` + `uvScaleMm` thật) — **thuộc V5**.
   Đây là *cắm dây*, không phải *tạo nội dung mới*: ảnh đã có, hợp đồng đã có, máy dựng đã có.
   Vá xong thì nấc JUDGE có vân THẬT, không phải vân vẽ bằng CSS.
2. **Cho scene 3D đi qua `buildPbrMaterial`** — **thuộc V8**. Cầu `cad-to-obj` phải mang
   `matId`/`specId` xuống tới `Scene3DViewer` thay vì bóp thành `colorHex`.
3. **Nền/Wallgallery**: khai thẳng **NOT IMPLEMENTED**. ⛔ Không lấy gradient CSS gọi là PASS.

⛔ **Cấm** nhúng cứng texture vào Home · vẽ vân giả bằng CSS · cho 3D một cách biểu diễn vật liệu
**thứ hai**. Một sự thật vật liệu nuôi mọi cách biểu diễn của nó.

## KẾT QUẢ VÀO LẠI

**Chưa đo được** — không thể chứng minh *"mở lại thấy đúng texture/tỉ lệ"* khi chưa có texture nào
đi vào hệ. Sẽ đo sau bước 1 và 2, bằng chính ảnh chẩn đoán này.
