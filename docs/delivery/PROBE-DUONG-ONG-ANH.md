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
> (`:478`, `:491`).
>
> Máy dựng vật liệu ĐỦ MAP **đã tồn tại và đúng** — `lib/three/pbr-three.ts`: 7 map, `uvScaleMm`
> → `repeat`, colorSpace tách sRGB/linear đúng chỗ, `RepeatWrapping`, cache theo URL. Nhưng **nơi
> gọi duy nhất là quả cầu xem trước** (`components/three/material-preview.ts:301`).

> ### 🔧 ĐÍNH CHÍNH 05/09 — TÔI ĐỔ LỖI SAI TẦNG, CẦU KHÔNG HỀ ĐỨT
>
> Bản đầu của probe này viết: *"Cầu 2D→3D `cad-to-obj.ts:361` chỉ chuyển tiếp **một `colorHex`**"*.
> **SAI.** Đo lại tại nguồn:
> · `SceneGroup.specId` khai ở `cad-to-obj.ts:178` và **được gán ở 6 chỗ** (`:679` `:792` `:840`
>   `:885` `:894` và mặt sàn `:292`), đi qua `flushGroup():372` vào `groupList`.
> · `Scene3DData = Pick<ObjScene,'groups'> & {…}` (`:213`) ⇒ **không tầng nào rơi mất `specId`**.
>   Nó nằm sẵn trong dữ liệu `Scene3DViewer` đang cầm.
> · Chú thích của chính hợp đồng (`:174-178`) đã ghi sẵn chuỗi tiêu thụ định làm:
>   *"Panel phải tra `ProductSpec` qua id này…"*, và `:284` ghi thẳng
>   `SceneGroup.specId → panel vật liệu → getMaterial`.
>
> ⇒ Lỗ **không phải** ở cầu, mà ở **NGƯỜI ĐỌC**: `Scene3DViewer` chọn đọc `colorHex` và
> **chưa bao giờ đọc `specId`** (`grep specId Scene3DViewer.tsx` = **0**).
> Điều này làm V8 **nhỏ hơn hẳn**: không phải luồn thêm trường qua nhiều tầng, không đổi hợp đồng —
> chỉ là **đọc trường đã có** rồi tra qua `getMaterial` (`lib/materials/resolve.ts:88`, đang sống).
> Ghi lại nguyên văn chẩn đoán sai thay vì lặng lẽ sửa cho khớp: sai ở chỗ tôi **suy từ triệu chứng
> ra nguyên nhân** (viewer chỉ dùng màu ⇒ *"chắc nó chỉ nhận được màu"*) thay vì đọc hợp đồng.

> **NGƯỜI ĐỌC THỨ BA, probe đầu bỏ sót:** `lib/three/capture.ts:94` dựng cảnh ngoài màn cho
> **ảnh chụp / video / depth nuôi ControlNet** — cũng `MeshBasicMaterial({ color: b.colorHex })`.
> Sửa mỗi `Scene3DViewer` thì **khung hình xuất ra vẫn phẳng**. Ba nơi tiêu thụ cùng một
> `SceneGroup[]`: viewer · capture · (panel vật liệu). Một sự thật vật liệu, ba nơi đọc —
> nên đường tra phải là **hàm dùng chung**, không phải mã dán vào viewer.

---

## BẢNG TẦNG

| tầng | trạng thái | bằng chứng | ai sửa |
|---|---|---|---|
| **A · NẠP ẢNH** | **PASS** | `/textures/chan-doan/chan-doan-512.png` trả `200 · 8376 byte · image/png` trên app thật | — |
| **B · ẢNH TRONG GIAO DIỆN** | **PASS** | `/materials` render `<img>` thật: 2/2 vật liệu có mã | — |
| **C · NỀN / WALLGALLERY** | **NOT IMPLEMENTED** | `lib/wallpaper/css.ts` là `linear-gradient` + `repeating-linear-gradient`; `SystemWallpaper.tsx` có **0** `<img>` · **0** `url(` · **0** `next/image`. Không có kho ảnh nền nào | ngoài lát cắt vật liệu |
| **D · XEM TRƯỚC VẬT LIỆU** | **PARTIAL** | đường map **có** (`material-preview.ts:301` gọi `buildPbrMaterial` khi `spec.pbr` có map) nhưng **không vật liệu nào ship map** ⇒ luôn rơi về `twoToneTexture` — hai màu, không vân | **V5** |
| **E · MẶT 2D** | **PASS** | V1 `defsHatGiong()` — hatch vector, không cần pixel. `2D ✓` trên 2/2 món | xong |
| **F · 3D TIÊU THỤ MAP** | **FAIL** | 0 tham chiếu map trong `Scene3DViewer.tsx`; `grep specId` = 0 ⇒ **trường có sẵn mà không ai đọc** (không phải cầu đứt — xem đính chính) | **V8** |
| **F0 · CHỤP ẢNH / VIDEO** | **FAIL** | `capture.ts:94` cũng chỉ `color: b.colorHex` ⇒ khung xuất ra phẳng dù viewer đã sửa | **V8** |
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
2. **Cho scene 3D đi qua `buildPbrMaterial`** — **thuộc V8**. ⚠️ Sửa theo đính chính ở trên:
   **KHÔNG phải luồn `specId` xuống** (nó đã ở đó rồi) mà là **đọc nó**: `specId → getMaterial →
   buildPbrMaterial`, viết MỘT hàm dùng chung cho cả `Scene3DViewer` **và** `capture.ts`.
   Thiếu `specId`/thiếu map ⇒ rơi về `colorHex` như hôm nay — không bịa vân, không chặn cảnh.
3. **Nền/Wallgallery**: khai thẳng **NOT IMPLEMENTED**. ⛔ Không lấy gradient CSS gọi là PASS.

⛔ **Cấm** nhúng cứng texture vào Home · vẽ vân giả bằng CSS · cho 3D một cách biểu diễn vật liệu
**thứ hai**. Một sự thật vật liệu nuôi mọi cách biểu diễn của nó.

## KẾT QUẢ VÀO LẠI

**Chưa đo được** — không thể chứng minh *"mở lại thấy đúng texture/tỉ lệ"* khi chưa có texture nào
đi vào hệ. Sẽ đo sau bước 1 và 2, bằng chính ảnh chẩn đoán này.

---

## 🔬 ĐO LẦN HAI 05/09 — CHẠY TRÊN WEBGL THẬT, KHÔNG CÒN SUY LUẬN

Hai lượt V8 liên tiếp dừng ở ô ⓪ và **bác phiếu của tôi**, cả hai lần đều đúng. Lần thứ ba tôi
thôi đọc mã đoán hành vi, và đo bằng GL thật.

### Chặn A — THIẾU UV: đo được, và nó HỎNG IM LẶNG

`geometryOf()` (`lib/three/build-ops.ts:23-29`) — **nơi DUY NHẤT** dựng `BufferGeometry` từ dữ liệu
`cad-to-obj` — chỉ `setAttribute('position')` + `computeVertexNormals()`. **Không có `uv`.**
`csg.ts:30` còn cố ý gỡ `uv` khỏi danh sách attribute bắt buộc.

Dựng đúng khuôn đó trong Chromium + WebGL 2.0 (swiftshader), dán chính ảnh chẩn đoán:

| hình học | biến thiên RGB toàn khung | số màu khác nhau |
|---|---|---|
| **không `uv`** | `[0, 0, 0]` | **1** |
| có `uv`, repeat 1 | `[255, 222, 255]` | 50+ |
| có `uv`, repeat 4 | `[255, 222, 252]` | 50+ |

⇒ **Gán `material.map` lên hình học không UV cho ra ĐÚNG MỘT MÀU trên toàn mặt, và KHÔNG ném lỗi.**
`pageerror` = 0. Không cảnh báo, không màu tím báo hỏng — nó **im lặng trông y hệt hôm nay**.

🔴 **Vì sao đây là cái bẫy đắt nhất trong cả đường ống**: làm xong V8 kiểu cũ thì `tsc` sạch, test
xanh, ảnh chụp *"trông như cũ"* — và **không máy soi nào của IF bắt được**, vì không có gì sai để
bắt. Đúng loại lỗi mà ảnh chẩn đoán sinh ra để chống: dò bằng ảnh gỗ thì một mảng nâu phẳng vẫn
"trông như gỗ".

⇒ **UV phải làm TRƯỚC mọi việc gán vật liệu.** Thứ tự cũ (trường dữ liệu trước, người tiêu thụ sau)
là thứ tự đẻ ra dây chết.

### Chặn B — khoá gộp mesh VỨT danh tính, và gộp mọi tường làm một

`BuiltGroup = { name, geometry, colorHex }` (`obj-scene-to-geometry.ts:21-25`); `buildMergedGeometries`
gom `byColor.get(g.colorHex)` (`:63-76`) rồi xuất `merged_${colorHex}`. Đây là đường của **cả hai**
người đọc (`Scene3DViewer.tsx:454` · `capture.ts:92,106,118`).
⇒ Tới chỗ dựng mesh thì `group` **không còn**, chỉ còn một màu. Và vì mọi tường dùng chung một hex
(`cad-to-obj.ts:244/254/263`), **hai bức tường không thể mang hai vật liệu khác nhau** chừng nào
khoá gộp còn là màu. (Sàn là ngoại lệ — `slabMat()` `:290` đọc `e.color` nên đã tách sẵn.)

### Chặn C — nguồn `matId` ở mặt 2D chưa tồn tại
`MATERIALS` — **0/13** preset khai `matId`; `MaterialPick`/`PickHatGiong` **cố ý chưa mang** `matId`
(`kho-mo-dau.ts:135-141` tự khai là việc của lượt sau). ⇒ Thêm trường hôm nay = trường vĩnh viễn
`undefined`.

### ⓪.3 của phiếu SAI — entity CÓ danh tính, chết vì 7 KÝ TỰ

Tôi viết *"chọn hạt giống ở 2D thì entity không nhận danh tính nào"*. Sai. Nó nhận
`specId = 'hat-giong:<uuid>'` (`kho-mo-dau.ts:230`). `pbr` null vì **tiền tố `hat-giong:` đá chuỗi
khỏi nhánh `isMatIdUuid`**. Cùng một chuỗi, bỏ 7 ký tự đầu ⇒ `resolvedVia:'uuid'` + ảnh
`/mau-vat-lieu/go-soi-trang.png` + `uvScaleMm {190,1200}`.

### 🛠 CHROMIUM CÓ SẴN — hai lượt trước kết luận nhầm là không có
Playwright của repo đòi build **1234**, máy có **1194** ⇒ `chromium.launch()` trần **thất bại**, và
`~/.cache/ms-playwright` thì trống nên dễ tưởng là không có trình duyệt. Đường chạy được:
```
chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] })
```
Đo được `WebGL 2.0 (OpenGL ES 3.0 Chromium)`. ⇒ **Kiểm bằng GL thật là làm được**, đừng khai là
không kiểm được nữa.

### 📄 BẢN THI HÀNH — đường ống này đã được nối, 05-06/09
Phiếu: **`docs/phieu-giao/P-V8c-UV-TRUOC-VAT-LIEU-SAU.md`** (thay `P-V8` và `P-V8b`, cả hai đã
đóng dấu lỗi thời tại chỗ).
Kết quả đo sau khi thi công, cùng phép đo với bảng trên: tường 4000 mm, bước 400 mm ⇒
**1 màu → 570 màu · 20 dải tối trên hàng quét = đúng 10 chu kỳ**; tường có cửa (qua CSG) cũng
**đúng 10 chu kỳ**, vân liền mạch hai bên hố cửa.
⇒ Hàng **F · 3D TIÊU THỤ MAP** và **F0 · CHỤP ẢNH/VIDEO** trong bảng tầng chuyển **FAIL → PASS
(máy)**; vế **HỮU DỤNG** vẫn chờ mắt nghề.

---

## ✅ NGHIỆM THU TRÊN APP THẬT — 06/09 (lượt V8-PASS)

Mọi số dưới đây đo **qua Next/React chạy thật** (dev server, Chromium 1194 + WebGL 2.0
swiftshader), không phải mã đã transpile chạy ngoài app. Kịch bản đi trọn một mạch:
**2D vẽ → gán vật liệu → 3D → đo → xuất ảnh → lưu → ĐÓNG HẲN trình duyệt → mở lại.**

Bối cảnh: tài khoản mới đăng ký qua `/api/auth/register`, dự án tạo bằng **bảng khởi tạo thật**
(`POST /api/flows`), tường vẽ bằng công cụ `W` + gõ độ dài, vật liệu gán bằng **panel Vật liệu
(Hatch) → kệ "Kho vật liệu · gán mã"**. Không gọi thẳng hàm nào của app để dựng dữ liệu.

**Bàn thử:** ba tường, mỗi tường **đúng 4000 mm** (đo trong `doc`), cao mặc định 2700 mm, đặt
cạnh nhau, **ba `matId` khác nhau**.

### A · ĐÚNG — ảnh chẩn đoán, quy ước 1 chu kỳ = 400×400 mm

| phép đo | kết quả | phán |
|---|---|---|
| số chu kỳ trên tường 4000 mm | đếm dấu `IF`: **10 cụm**, tâm cách đều **68,4 px** (lệch max **0,5 px** trên 9 bước) ⇒ **9,97 chu kỳ**, 1 chu kỳ = **401,1 mm** | **ĐẠT** |
| bước lặp theo phương ĐỨNG | 68,0–69,0 px — **bằng phương ngang** ⇒ không kéo giãn một chiều | **ĐẠT** |
| lật / xoay | khớp hình 8 phép nhị diện, **chỉ lấy phần CÓ MÀU** (ô cờ đối xứng nên không phân biệt được): **"gốc (0°)" thắng, hơn á quân (lật ngang) 31%** | **ĐẠT** |
| ô cờ còn không (mất map?) | biến thiên RGB toàn mặt lớn, 4×4 ô/chu kỳ đọc rõ | **ĐẠT** |

⚠️ Ảnh chẩn đoán vào hệ qua **tầng STUDIO** (`localStorage` `if.materials.pbr.v1`, thứ
`nguonVatLieuMacDinh()` đọc) — **KHÔNG có ô nhập ảnh nào trong UI**: `MaterialPbrEditor` chỉ lộ
`uvScaleMm` khi vật liệu ĐÃ có map, không có trường `baseColorMapUrl`. Đây là fixture, khai thẳng.

### A′ · ĐÚNG — kiểm lại bằng VẬT LIỆU THẬT ship kèm (không dùng fixture)

| vật liệu | `uvScaleMm` khai | đo trên ảnh dựng | phán |
|---|---|---|---|
| **Gạch terrazzo xám** | 400×400 | tự tương quan đỉnh trội **68 px = 400 mm** | **ĐẠT** |
| **Gỗ sồi tự nhiên** | 190×1200 | đỉnh **32 px = 188 mm**; biến thiên ngang 3,75 ≫ dọc 0,68 ⇒ **vân chạy ĐỨNG**, đúng chiều dài tấm ván | **ĐẠT** |

⇒ Tỉ lệ vật lý đúng **không phụ thuộc fixture**.

### B · HỮU DỤNG — kiến trúc sư phán được vật liệu chưa?

**ĐẠT phần máy đo được, CHƯA ĐẠT phần chỉ mắt nghề phán được** (còn nợ mắt Hoà):
· ba mặt cạnh nhau **phân biệt được ngay** — ô cờ · thớ gỗ dọc · hạt terrazzo (`v8pass-02`)
· gỗ ra **đúng khổ ván 190 mm, vân chạy đúng chiều** — thứ người nghề nhìn một nhịp là thấy sai
· panel phải trong 3D **gọi đúng tên** vật liệu kèm quả cầu xem trước ("Tường 2 · Cao 2.700 mm ·
  Vật liệu: Gỗ sồi tự nhiên", `v8pass-03`) ⇒ danh tính gán ở 2D đọc lại được ở 3D bằng CHỮ.
⛔ **Chưa phán được**: đẹp/không, hợp/không — đó là mắt nghề, máy không thay được.

### C · ĐƯỜNG ẢNH XUẤT RA (F0) — thứ khách nhìn

Bấm **Kết xuất khung nhìn này** ở chế độ **"Xem trước thiết kế · 0 credit"** (đường
`capture-live.ts`), lấy PNG 1280×720 app trả về:

| tường | chu kỳ kỳ vọng | đo trên ẢNH APP XUẤT RA | phán |
|---|---|---|---|
| chẩn đoán | 400 mm | **394 mm** | **ĐẠT** |
| gỗ sồi | 190 mm | **190 mm** | **ĐẠT** |
| terrazzo | 400 mm | **396 mm** | **ĐẠT** |

⚠️ Ở 1280×720 một chu kỳ chỉ còn ~21 px nên **đỉnh tự tương quan MẠNH NHẤT là bội số** (789/1183
mm) — đó là giới hạn độ phân giải của phép đo, không phải lỗi dựng: đỉnh ở đúng chu kỳ vẫn có mặt.

### D · LƯU → ĐÓNG HẲN → MỞ LẠI

| phép thử | kết quả | phán |
|---|---|---|
| `browser.close()` rồi mở **tiến trình Chromium mới**, cùng hồ sơ | entity + `matId` **giống hệt**; ảnh 3D chính diện **trùng TỪNG BYTE** (`sha256` 16 ký tự đầu `8ed4cae1b8304e4e` ↔ `8ed4cae1b8304e4e`) | **ĐẠT** |
| **hồ sơ trình duyệt MỚI TINH** (xoá sạch localStorage/IndexedDB/cookie, đăng nhập lại) | ba `matId` **còn nguyên**; **gỗ sồi + terrazzo vẫn có vân** | **ĐẠT** |
| cũng ở hồ sơ mới — tường chẩn đoán | **rơi về màu phẳng** | **ĐẠT có điều kiện** (xem dưới) |

🔴 **PHÁT HIỆN — tầng STUDIO của PBR KHÔNG ĐI THEO DỰ ÁN.** Bản chỉnh vật liệu nằm ở
`localStorage` (`lib/materials/pbr-store.ts` tự khai lý do và tự khai đây là chỗ tạm). Hệ quả đo
được: studio chỉnh vật liệu ở máy A, mở dự án ở máy B ⇒ **mặt đó phẳng lại**. Vật liệu **hạt
giống** thì không dính vì chúng đi theo bản cài. Đây là **nợ đã khai trong mã**, không phải hồi
quy của lượt này — nhưng nay có **con số và ảnh** (`v8pass-06`).

### E · GIÁ PHẢI TRẢ

| mục | đo được |
|---|---|
| **draw call/khung** (đếm thẳng trên GL, bọc `drawElements`/`clear`, không sửa mã app) | 3 tường **cùng 1** vật liệu: **10** · 3 tường **3** vật liệu: **10** ⇒ **+0** |
| vì sao +0 | ở mode **Vẽ 3D**, tường đi đường `buildMassingWalls` — **mỗi tường một mesh, CỐ Ý không gộp** (`Scene3DViewer.tsx:446-452`, để raycast push-pull). Khoá gộp `colorHex\|matId` **không tác động ở mode này**. |
| trần rủi ro của khoá gộp | khoá chỉ đẻ thêm nhóm khi hai vật liệu **trùng `colorHex`**. Đo 7 vật liệu ship: **7 màu khác nhau, 0 trùng** ⇒ với hàng ship, chi phí = **0**. Trùng chỉ xảy ra ở dòng kho studio tự nhập. |
| texture GL (tạo − xoá) qua 5 lượt mở/đóng | +32/lượt (cảnh có 3 vật liệu) · **+18/lượt cảnh RỖNG** ⇒ phần lớn **không thuộc đường vật liệu** |
| giải thích | mỗi lượt mở/đóng tạo **5 context WebGL mới**, và sau khi đóng **0 canvas còn trong DOM** ⇒ con số tăng là **churn context**, không phải texture chồng đống trong một context |

### F · CÒN SAI — nhãn nói dối việc app vừa làm

Ba chỗ chữ vẫn khai cảnh là **"khối xám, chưa vật liệu"** trong khi màn hình đang có vân:
· chip trên khung nhìn: *"**Khối xám** · 3/4 đã gán vật liệu"*
· chú thích góc dưới trái: *"**Khối xám trơn — chưa vật liệu**, chưa đèn. Vật liệu chỉ lưu matId;
  ảnh thật do D5 dựng."*
· bảng Kết xuất, chế độ 0 credit: *"Chụp đúng khung nhìn 3D đang mở — **khối xám, chưa vật liệu**,
  chưa đèn."*
⇒ Không phải lỗi dựng, nhưng **trái luật "nút không được nói dối việc nó vừa làm"**. Việc chữ,
chưa làm ở lượt này (lượt này là nghiệm thu, không thi công).

### G · ẢNH BẰNG CHỨNG
`docs/ship/anh/v8pass-01..06` — 2D ba tường ba mã · 3D chính diện ba vật liệu · panel 3D gọi tên
vật liệu · một chu kỳ ảnh chẩn đoán · ảnh app xuất ra · hồ sơ trình duyệt mới.

### ⑦b CHƯA CHẮC / CHƯA KIỂM (lượt này)
1. **MẶT SAU của tường chưa soi** — không lái được camera tới hướng SAU (ViewCube chỉ tới
   TRƯỚC/PHẢI; chuột giữa là **PAN chứ không orbit**). UV toạ độ thế giới **về lý thuyết** làm
   mặt sau đọc ngược, nhưng **tôi KHÔNG đo được**, nên không khai là đã kiểm.
2. **AO** — không kiểm; `uv1` vẫn chưa có đường (nợ đã nhận). Không tuyên bố hỗ trợ AO.
3. Chỉ **Chromium 1194 + swiftshader**, một cỡ màn 1440×900. Không thử GPU thật, Safari, Firefox.
4. Texture GL: con số là **tạo − xoá**, **không** chứng minh được GPU đã trả bộ nhớ — chỉ chứng
   minh được canvas rời DOM và context được tạo mới mỗi lượt.
5. **Khối ĐANG CHỌN** ở 3D bị phủ lớp tím chọn ⇒ lúc đó không nhìn được vân (hành vi đã khai
   trong mã, không phải lỗi mới).
6. 2D: ba tường mang **ba màu hatch khác nhau** (`#ece7dd`/`#b98a54`/`#c9c7c1`) nhưng **cùng hoạ
   tiết ANSI31** và màu đều nhạt ⇒ trên màn 2D **rất khó phân biệt bằng mắt**. Chưa hỏi người dùng
   thật xem đó có phải vấn đề không.

### ⑦c HẠN DÙNG
Kết luận A/A′/C/D đúng cho `nen-checkpoint` @ `b71f2a0d`. Hết hiệu lực khi: đổi `geometryOf()` ·
đổi khoá gộp · đổi `uvScaleMm` của vật liệu ship · dời tầng studio khỏi `localStorage` · đổi
`buildMassingWalls`. Số draw call chỉ đúng cho **mode Vẽ 3D**; mode tĩnh chưa đo.
