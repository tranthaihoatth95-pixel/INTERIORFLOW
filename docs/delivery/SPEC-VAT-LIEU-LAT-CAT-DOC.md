# SPEC · LÁT CẮT DỌC **VẬT LIỆU** — đủ để build một mạch

> **Bàn CHUYÊN MÔN (B) · 05/09/2026 · nhánh `nen-checkpoint`.**
> Vào từ: `docs/delivery/NC-D2-D3-VAT-LIEU.md` (nghiên cứu, 413 dòng) ·
> `docs/delivery/HUONG-DUNG-LAI-GIAO-DIEN.md` (Đ2+Đ3 hạng 1) ·
> `docs/delivery/KIEM-KE-NANG-LUC.md` (năng lực phải giữ).
> Ra: bàn **THỰC THI** build theo tệp này, **không hỏi lại**. Bàn **AUDIT** chấm bằng đúng §5.
>
> **Ba câu phải đọc trước khi đọc bảng:**
> 1. 🔴 **Kho vật liệu của IF hôm nay có 0 pixel vật liệu.** Đo sống 05/09 trên `localhost:3277`,
>    tài khoản mới tinh: `/materials` có **3 hàng · `<img>` = 0 · `<canvas>` = 0**; ô xem trước là
>    **32×32 px chứa một SVG biểu tượng ảnh-hỏng**. Màn duy nhất có nhiệm vụ *bày vật liệu* đang
>    bày **một dòng bản ghi CSDL** — đúng thứ **N-5** cấm.
> 2. 🔴 **Mặt 2D CHẾT trên 100% vật liệu ship theo bản cài.** Chỉ báo ba mặt đọc sống ra
>    `2D – · 3D ✓ · Giá !` cho **cả hai** hạt giống. Nguyên nhân đo được: `MATERIALS`
>    (`lib/cad/materials.ts`) có **0/13 preset khai `matId`**, và **không có hàm nào** dựng mặt 2D
>    từ `hat-giong.hatch2d` — trong khi mặt 3D đã có `pbrMapHatGiong()` và mặt thương mại đã có
>    `hangHatGiong()`. **Thiếu đúng một chân trong kiềng ba chân.**
> 3. ⭐ **Máy xem trước ĐÃ CÓ và đang chạy ở nơi khác.** `renderMaterialPreviewAsync` (quả cầu PBR
>    thật, cache PNG, nấc phân giải 0.25/0.5/1) sống ở Thư viện · widget Home · panel 3D — **chỉ
>    riêng Kho vật liệu là không được cắm.** ⇒ Việc của lát cắt này phần lớn là **NỐI**, không phải
>    **DỰNG** ([Đ2] · §B25 NO-REBUILD: vùng Material là vùng **DÀY**, mặc định REUSE/CONNECT).

---

## §0 · ĐÃ CÓ — KHÔNG DỰNG LẠI

[Đ2] `TRIET-LY-IF.md:72` *nhìn vào trong trước*. Đo tại nguồn 05/09, không chép sổ.

### 0.1 · Lõi dữ liệu — đủ, đã cắm điện, **cấm đụng hình dạng**

| Thứ | Ở đâu | Trạng thái đo được |
|---|---|---|
| **Hàm đọc hợp nhất ba mảnh** | `lib/materials/resolve.ts:87` `getMaterial()` | ✅ **2 nơi gọi thật** (`MaterialsScreen.tsx:145` · `app/files/_lib/ngan-tho.ts:149`). Hai namespace tách bạch `uuid` ↔ `legacy-sku`, không giả sku thành UUID |
| **Đọc ra CHỮ ba mặt** | `lib/materials/ba-mat.ts:216` `baMatCuaVatLieu()` | ✅ **BA** trạng thái `du · chuaDu · chuaCo`; mỗi mặt `chuaDu` **bắt buộc** có `thieu` **và** `loiRa` |
| **Xếp chồng ba tầng** | `lib/materials/tang-phan-giai.ts:90,116` | ✅ hạt giống → studio → dự án, ghi đè **theo VẬT không theo TRƯỜNG**, một chiều |
| **Kiểm kê + thay tham chiếu** | `lib/materials/impact.ts:48,131` | ✅ `inspectMaterialImpact` + `replaceMaterialReferences`; `scope.entityIds` **đã có sẵn** — đây là chỗ (c) bỏ-tick cắm vào, **không cần nhánh ghi mới** |
| **Schema PBR** | `lib/materials/schema.ts` | ✅ chuẩn glTF metal/rough · `uvScaleMm` · `suyDoan` · `typeId` · guard drift 2 chiều (`MATERIAL_PBR_KEY_DRIFT_OK`) |
| **Tầng hạt giống** | `lib/materials/hat-giong.ts:79` | ✅ 2 vật liệu, UUID **gõ cứng vĩnh viễn**, 3 ràng buộc có test canh (không sinh UUID · không chép giá · không texture map) |
| **Trộn hạt giống vào 4 mặt tiền** | `lib/materials/kho-mo-dau.ts:102,111,156,171` | ✅ `hangHatGiong` · `tronHatGiong` · `pickHatGiong` · `tronPickHatGiong` |
| **11 loại + 6 kiểu quả cầu** | `lib/materials/material-edit.ts:50` | ✅ mỗi loại có `roughnessInit` + `previewKind` |
| **Máy render xem trước** | `components/three/material-preview.ts:262,269,278` | ✅ **cache `Map` theo hash tham số** · nấc `resolution 0.25/0.5/1` · rig **singleton trên `globalThis`** (bài học sự cố 04/08 tràn WebGL context) |
| **Vân procedural, an toàn giấy phép** | `lib/cad/material-texture.ts` (433 dòng) | ✅ vân gỗ nhiều lớp + mắt gỗ · mạch gạch · vân đá midpoint-displacement… tách **phần thuần** (`generateTexturePixels`) khỏi **phần DOM** (`materialTextureDataUrl`, có cache) |
| **Dựng vật liệu three.js từ PBR** | `lib/three/pbr-three.ts:72,91` | ✅ `loadPbrTextures` + `buildPbrMaterial` (đọc đủ 7 map + `uvScaleMm`) |
| **Cửa duyệt trước khi ghi** | `components/materials/MaterialImpactPreview.tsx` | ✅ portal ra body (luật K4) · phạm vi hẹp `autoFocus` · phạm vi rộng phải bấm có chủ ý · dòng *"vẫn hoàn tác được (⌘Z)"* |
| **Sửa tay BOQ** | `lib/present-editor/boq-overrides.ts` | ✅ lớp phủ hiển thị, **không ghi ngược Doc**; `machineValue` cố ý **không** snapshot |
| **Cờ danh tính `.idfc`** | `lib/cad/idfc-identity-flag.ts` | ✅ **MỘT** biến `NEXT_PUBLIC_IF_IDFC_IDENTITY`, đúng cho cả đầu ghi lẫn đầu đọc |
| **Proof vòng đời** | `scripts/proof/idfc-identity-boq.mjs` · `idfc-roundtrip.mjs` | ✅ chạy trên bundle mã sản xuất thật, có cổng harness F-15 |

### 0.2 · Chuẩn/luật đã chốt — **trích, không viết lại**

`docs/SPEC-VAT-LIEU-PBR-IF.md` §1 (chuẩn lưu) · §2 (quả cầu + 3 cảnh) · §3b (nấc phân giải) ·
`docs/control/IF-CHUAN-BO-CUC.md` BC-1 lưới 4 · VB-1 24px AA · VB-3 44px chỉ khi con trỏ thô ·
`docs/ACTIVE-DESIGN-CONTEXT.md` §7 token (bo 6/10/14/20 · `--tap 32/--tap-lg 44` · 4.5:1 chữ · 3:1 giao diện) ·
`docs/CHUAN-DAU-RA-NGHE.md` §2 §3 §4 · `00-CHOT` 07/08 ba nấc thẻ **122/168/232** ·
NT-15 (quả cầu + macro texture; spec 4 phần) · NT-10 (học bằng hình).

### 0.3 · ⛔ BỐN THỨ CẤM ĐỤNG TRONG LÁT CẮT NÀY

1. **Vật liệu TRỎ TỚI bản ghi thương mại — CẤM chép giá vào mặt thị giác** (luật 2.1.9.i 30/07,
   `ba-mat.ts` docstring đã canh). *"Hiểu được thông tin" = trỏ tới được, không phải chứa.*
2. **BOQ chỉ nhận số ĐO ĐƯỢC** (Hoà 15/08). Bảng tác động hàng *BOQ / dự toán* **chỉ được hiện số
   đếm tham chiếu**, **cấm hiện tiền chênh lệch**. Hàng *Hồ sơ trình bày* giữ `count: null`.
3. **Cú bấm thứ tư là CỬA DUYỆT, không phải ma sát.** `pick()` (`MaterialPalette.tsx:162`) chỉ dựng
   cửa khi **có vật được chọn**. **Cấm tối ưu 4→3.** ([T5] người quyết cuối · KS3 duyệt từng phần)
4. **CẤM dựng máy soi mới.** Ngưỡng của lát cắt này sống thành **hàm thuần + test** (§5.4), không
   thành `soi:vat-lieu`. Chỗ nào còn thiếu chỗ đo thì **ghi vào `docs/control/IF-CON-THIEU-GI.md`**,
   không tự đẻ máy. (Đề xuất `soi:vat-lieu` ở `NC-D2-D3` §4.1 — **BÁC**, lý do ở §7-2.)

---

## §1 · ĐO TẠI NGUỒN — hiện trạng 05/09, không chép sổ

### 1.1 · Đo SỐNG trên app thật (`localhost:3277`, 1440×900, tài khoản mới tạo trong chính lượt đo)

```
/materials  →  soHang 3 · bangRong 1142 · tongImg 0 · tongCanvas 0
  hàng 1  Gỗ sồi tự nhiên     IF-MAT-GO-SOI      ba mặt "2D – 3D ✓ Giá !"  ô 32×32 (svg)  cao 46
  hàng 2  Gỗ óc chó           IF-MAT-GO-OC-CHO   ba mặt "2D – 3D ✓ Giá !"  ô 32×32 (svg)  cao 46
  hàng 3  A4 Đá Marble 473564 (không mã)         ba mặt "2D – 3D – Giá –"  ô 32×32 (svg)  cao 46
API: 200 /api/specs · 200 /api/flows · 200 /api/auth/me — không lỗi, không console error
```

**Bốn điều con số này nói, mà đọc mã không nói ra được:**

| # | Đo được | Nghĩa |
|---|---|---|
| ① | `tongImg 0` · `tongCanvas 0` | **không một pixel vật liệu nào** trên màn kho vật liệu. `coSvg: true` cả ba hàng = ô nào cũng là **biểu tượng ảnh-hỏng 14px** — *tệ hơn để trống, vì nó trông như lỗi* |
| ② | ba mặt `2D –` ở **cả hai** hạt giống | mặt 2D **chết trên 100% vật liệu ship theo sản phẩm** |
| ③ | ô **32×32** | dưới sàn phân giải **80 px** của `NC-D2-D3` §4.1 **2,5 lần** |
| ④ | hàng 3 xuất hiện trên **tài khoản mới tinh** | `A4 Đá Marble 473564` giá `999 000 đ` — **rác thử nghiệm nằm trong kho chung**. Chưa rõ do `/api/specs` không cắt theo người dùng hay do CSDL dev bẩn ⇒ **§7-1** |

### 1.2 · Ba chỗ đứt, đo bằng `grep`, mỗi chỗ một câu

| Đứt | Bằng chứng | Hệ quả người dùng thấy |
|---|---|---|
| 🔴 **A · mặt 2D không có chân hạt giống** | `grep -c 'matId:' lib/cad/materials.ts` = **0** (13 preset, 0 khai mã). `pbrMapHatGiong()` có · `hangHatGiong()` có · **`defsHatGiong()` KHÔNG TỒN TẠI** | chỉ báo `2D –`; và vùng tô vẽ theo preset **không mang mã** |
| 🔴 **B · chọn vật liệu ở 3D là ngõ cụt** | `grep -rn matDangCam` toàn repo = **đúng 2 dòng, cả hai ở `Render3DModeSkeleton.tsx:86`** (`useState` + `setMatDangCam`). **0 nơi đọc.** Chú thích tại chỗ tự khai: *"chọn mặt khối trong khung nhìn 3D (raycast) CHƯA làm"* | bấm ô vật liệu ở panel 3D → **không có gì xảy ra**, và không có dòng nào nói vì sao |
| 🔴 **C · khung nhìn 3D không đọc PBR** | `grep -rn 'buildPbrMaterial'` = **chỉ `material-preview.ts`**. `Scene3DViewer.tsx:478,491` dựng `MeshStandardMaterial({ color: colorHex, roughness: 0.78, metalness: 0.02 })` — **gõ cứng**, bỏ qua `MaterialPbr` | đổi vật liệu ở 3D **đổi được MÀU, không đổi được VẬT LIỆU**; `roughness 0.6` của gỗ sồi chưa bao giờ tới màn hình |
| 🟠 **D · bảng vật liệu A3 rỗng nghĩa** | `PresentSheets.tsx:784` `onChooseMaterialBoard` = `chooseDeck('blank', { docType:'material-a3' })`. `grep 'material-board'` trong `lib/` = **0 tệp dựng nội dung** | *"Bảng vật liệu A3"* mở ra là **một trang A3 trắng** — không món nào của dự án chảy vào |
| 🟡 **E · cờ danh tính `.idfc` TẮT** | `grep IDFC_IDENTITY .env .env.example` = **0 dòng** ⇒ `idfcIdentityEnabled()` false | lỗ **C18/L4** của bản kiểm kê **đã có mã sửa, chưa bật** — xem §4.1 |

> ⭐ **Vì sao `soi:moat` nói `vat-lieu-mot-vat — sống` mà màn hình lại chết.** Chạy 05/09:
> `9 tuyên bố · 9 sống · 0 chưa nối`. Máy đó hỏi *"mã có đường nào tới cửa vào người dùng không"* —
> và câu trả lời **đúng**: `getMaterial()` có đường tới. Nó **không hỏi**, và không nên hỏi,
> *"tới nơi rồi thì người dùng có nhìn thấy gì không"*. ⇒ **Không nới máy đó, không đẻ máy mới.**
> Chỗ trả lời câu ấy là **§5.2 hành trình mắt người** — và đó là lý do §2 tồn tại.

---

## §2 · A · HÀNH TRÌNH NGHIỆM THU — đây là định nghĩa **ĐẠT**

> ⛔ *"Trình duyệt trông đẹp"* **không phải** ĐẠT. ĐẠT = **đi hết 12 chặng dưới đây trên app thật,
> bằng đúng 2 vật liệu đang ship** (Gỗ sồi tự nhiên · Gỗ óc chó — luật NỘI DUNG THẬT), và chặng
> cuối phải trả về **cùng vật liệu · cùng định danh · cùng gốc gác**.
> Mỗi chặng: **làm gì · thấy gì · dữ liệu đọc/ghi ở đâu · kiểm bằng cách nào.**

| # | LÀM GÌ | THẤY GÌ (sau khi làm xong lát cắt) | ĐỌC / GHI Ở ĐÂU | KIỂM BẰNG CÁCH NÀO |
|---|---|---|---|---|
| **A1** | Mở `/materials` trên **máy sạch, chưa đăng nhập** | ≥2 hàng: *Gỗ sồi tự nhiên · Gỗ óc chó*, mỗi hàng có **mẫu vật nhìn ra chất gỗ**, không phải biểu tượng hỏng | ĐỌC `hangHatGiong()` `kho-mo-dau.ts:102` → `tronHatGiong()` `:111`; `GET /api/specs` hỏng vẫn còn hạt giống | mở app **chưa đăng nhập** · `tongImg + tongCanvas ≥ 2` · `soHang ≥ 2` |
| **A2** | Nhìn một hàng, **không bấm gì** | mẫu vật ≥ **80 px** cạnh ngắn, phân biệt được sồi ↔ óc chó; cạnh nó là **3 chỉ báo ba mặt**; ô mẫu **không bao giờ trắng/hỏng** | ĐỌC `pbrMapBaTang({studio: loadPbrMap()})` `tang-phan-giai.ts:116` → `getMaterial()` → `baMatCuaVatLieu()`. VẼ: `renderMaterialPreviewAsync()` (`material-preview.ts:278`), rớt về `materialTextureDataUrl()` (`material-texture.ts`) khi WebGL tắt | đo DOM: cạnh ngắn ô ≥80 · chụp 2 hàng cạnh nhau, **hỏi 1 người nghề**: *"hai cái này khác nhau ở đâu"* (§5.2-N1) |
| **A3** | Gõ `sồi` vào ô tìm · đổi bộ lọc loại | danh sách rút còn 1 hàng; **kết quả rỗng thì nói vì sao + lối ra**, không câm | `MaterialsScreen.tsx:161` `filtered` (tên/sku/hãng) + `timVatLieuHatGiong()` `hat-giong.ts` (bỏ dấu) | gõ `soi` **không dấu** vẫn ra *Gỗ sồi* · gõ `zzz` ra câu có lối ra |
| **A4** | Bấm vào một vật liệu → soi kỹ | tấm **MỘT VẬT BA MẶT**: mỗi mặt nói *đứng ở chặng nào · đang có gì · thiếu gì · **lối ra*** — không mặt nào là ô trống câm | `BaMatPanel.tsx` đọc `BaMat`; mặt `chuaDu` **bắt buộc** có `thieu` + `loiRa` (ép ở `ba-mat.ts`) | với gỗ sồi hôm nay: mặt Giá phải ghi *"có bản ghi thương mại nhưng bỏ trống giá"* + lối ra |
| **A5** | Đọc **tỉ lệ · độ hoàn thiện · nguồn** | **tỉ lệ**: `1200 × 190 mm` hiện thành CHỮ **và** thành **cỡ mẫu vật** ở nấc INSPECT · **độ hoàn thiện**: nhám `0,60`, phi kim · **nguồn**: *theo bản cài · CC0 · tự dựng* | `MaterialPbr.uvScaleMm` `schema.ts` · `roughness/metallic` · `VatLieuHatGiong.source`/`license` `hat-giong.ts:65` · `materialSourceLabel()` `warehouse/dto` | nấc INSPECT của gỗ sồi phải thấy **mạch ván**, nấc JUDGE phải thấy **vân**; hai nấc **không được là cùng một ảnh phóng to** |
| **A6** | Sang chặng 2D, chọn một vùng tô, mở ô chọn vật liệu, bấm *Gỗ sồi* | cửa **Ảnh hưởng khi đổi** bật lên (vì đang có vật được chọn) — 6 hàng nơi tiêu thụ, **có số thật** | `MaterialPalette.tsx:162` `pick()` → `setPendingPick` → `MaterialImpactPreview`; ÁP: `applyMaterial(..., specId)` `store.ts:885` → `HatchEntity.specId` | **không chọn gì** thì **2 bấm** (không hỏi) · **có chọn** thì **4 bấm** (có hỏi) — cả hai đều phải đúng |
| **A7** | Trong cửa đó: **bỏ tick 1 chỗ** rồi bấm *Chỉ N vùng đang chọn* | hàng nào bỏ tick thì **không đổi**; con số trên nút giảm theo tick **ngay lúc tick** | GHI: `replaceMaterial(from, to, { entityIds })` `store.ts:929` → `replaceMaterialReferences` `impact.ts:131`. **Tick chỉ được lọc `entityIds`** — cấm nhánh ghi mới | `grep -c 'replaceMaterialReferences\|applyMaterial('` số **đường ghi vật liệu không tăng** so với trước lát cắt |
| **A8** | Từ một hàng trong bảng tác động, **bấm để nhảy tới chỗ đó** | canvas cuộn/zoom tới, vật đó **được chọn và sáng lên**; cửa xem trước vẫn mở | ĐỌC `MaterialImpact.usages[].ownerId` (đã có sẵn, chưa ai tiêu thụ) → chọn qua store `selection` | bấm hàng *Bản vẽ 2D* → đúng entity trong `usages` được chọn; bấm hàng `count: null` (Hồ sơ trình bày) → **không có nút nhảy**, không nút giả |
| **A9** | Sang 3D xem kết quả | mặt đó **đổi CHẤT LIỆU** — nhám/màu theo `MaterialPbr` của mã, **không phải chỉ đổi màu** | ĐỌC: `specId` đi từ Doc qua `cad-to-obj.ts:792,840` vào `SceneGroup.specId` → tra `pbrMapBaTang` → `buildPbrMaterial()` `pbr-three.ts:91`. Điểm sửa: `Scene3DViewer.tsx:478,491` | so hai lượt: gỗ sồi (`roughness .60`) ↔ gỗ óc chó (`.55`, `reflectance .18`) — **phải nhìn ra khác nhau**, không chỉ khác sắc độ |
| **A10** | Đổi sang *Gỗ óc chó*, rồi kiểm **vật ngữ nghĩa** | vẫn đúng bức tường/vùng tô ấy: `id` · `layer` · `semanticKind` · `srcInsertId` · `storey` **không đổi**; **chỉ `specId` đổi** | `impact.ts:158` `{...entity, specId}` — spread giữ nguyên mọi field khác | trước/sau: `JSON.stringify(entity)` khác **đúng một khoá** · `⌘Z` một nhịp là về nguyên |
| **A11** | Mở BOQ + Bảng vật liệu A3 | BOQ: đúng vật liệu mới · đơn vị chuẩn · **hao hụt khai rõ %** · dòng thiếu mã **báo thành lời**, không biến mất. Bảng A3: **các món của dự án đã đứng sẵn trên trang**, không phải trang trắng | `computeBoq` `lib/boq/compute.ts:269-363` (`missing-specId` · `missing-specId-item`) · `boq-overrides.ts` · `PresentSheets.tsx:784` | **MỞ FILE ĐẦU RA** — xuất `.xlsx` + PDF A3, soi theo `CHUAN-DAU-RA-NGHE` §3 §4 (§5.3) |
| **A12** | Lưu → đóng tab → mở lại | **cùng vật liệu · cùng mã · cùng gốc gác**; mẫu vật vẽ lại y hệt; ba mặt y hệt | `.idf` = `JSON.stringify(Doc)` `lib/cad/idf.ts:153` (specId nằm trên `Base`, `model.ts:362`) · PBR studio ở `if.materials.pbr.v1` · hạt giống trong repo | `scripts/proof/idfc-roundtrip.mjs` + đối chiếu mắt: chụp trước/đóng/mở/chụp sau |

### 2.1 · Bảy điều **một vật liệu phải tự nói ra** — và trường nào nói

Luật thi công 05/09: *cấm mặc định mọi thứ thành thẻ chung chung.* Bảy điều, mỗi điều một trường
thật — **6/7 đã có dữ liệu trong chính hai hạt giống đang ship**:

| # | Vật liệu phải nói | Trường thật | Gỗ sồi hôm nay | Nói ở nấc nào |
|---|---|---|---|---|
| ① | **bề mặt** — nó là họ gì | `MaterialPbr.typeId` + `MATERIAL_TYPES[].previewKind` + `hoPbr` | `go` → `wood` → cảnh **quả cầu** | SCAN (hình dạng mẫu vật) |
| ② | **vân** | `baseColorMapUrl` · **khuyết thì** vân procedural theo họ | 🔴 **KHÔNG CÓ MAP** (ràng buộc 3 hạt giống: 0 byte, 0 rủi ro giấy phép) ⇒ **bắt buộc dựng bằng `material-texture.ts`** | JUDGE |
| ③ | **tỉ lệ** | `uvScaleMm {w,h}` | `1200 × 190 mm` | INSPECT (cỡ thật) + CHỮ ở A5 |
| ④ | **độ hoàn thiện** | `roughness` · `metallic` · `specular` · `clearcoat` · `sheen` | `0.60 · 0 · 0.04` | JUDGE (thấy) + A4 (đọc) |
| ⑤ | **màu** | `baseColor` | `#b98a54` | SCAN |
| ⑥ | **nguồn** | `source` · `license` · `materialSourceLabel()` · DataOrigin | *theo bản cài · CC0 · tự dựng* | A4/A5 |
| ⑦ | **trạng thái** | `BaMat.mats[].trangThai` + `suyDoan` | `2D – · 3D ✓ · Giá !` | SCAN (chỉ báo) |

> 🔴 **Hệ quả thiết kế lớn nhất của cả lát cắt, rút ra từ ô ②:** vật liệu của IF **ship THAM SỐ,
> không ship ẢNH**. ⇒ **Ô xem trước phải được VẼ RA, không phải được TẢI VỀ.** Đó là lý do
> `imageUrlOf()` trả rỗng ở `MaterialTable.tsx:72` và ô rơi về biểu tượng hỏng. Đường đúng đã có
> sẵn hai nhánh: **quả cầu PBR** (`renderMaterialPreviewAsync`) và **vân procedural**
> (`materialTextureDataUrl`) — cả hai đều **0 byte tài sản, 0 rủi ro giấy phép**.

### 2.2 · Ba nấc xem trước — **ba công năng, không phải ba cỡ**

Luật Hoà 16/08: *"size to là BỔ SUNG CHI TIẾT cho size nhỏ"*; cửa nghiệm thu **hai vế** — nấc nhỏ
đứng được một mình **và** nấc to có thứ nấc nhỏ **không thể** có.

| nấc | trả lời câu | cho thấy | công thức | ngưỡng |
|---|---|---|---|---|
| **SCAN** | *hàng này là món nào* | màu + họ bề mặt + tên + mã + 3 chỉ báo | bản **cache**, `resolution 0.25` | mẫu vật ≥ **44 px** cạnh ngắn (đủ nhận dạng, chưa đòi phán) |
| **JUDGE** | *hai món này khác nhau ở đâu* | **CHẤT** — vân, độ nhám | `spanMm = min(25, uvScaleMm.w)` · `repeat = spanMm / uvScaleMm.w` | **px ≥ 80** ∧ **px / spanMm ≥ 6,7** · mặc định **168 px** (`00-CHOT` 07/08) |
| **INSPECT** | *nó lát ra thì trông thế nào* | **KHỔ** — mạch, hướng, module | `spanMm = 1,5 × uvScaleMm.w` | ≥ **1 module thật** trong khung; **cấm** dùng lại ảnh JUDGE phóng to |

Gỗ sồi (`uvScaleMm.w = 1200`): JUDGE `spanMm 25` ⇒ `repeat 0,021` · INSPECT `spanMm 1800` ⇒
`repeat 1,5`. **Hai con số khác nhau ⇒ hai ảnh khác hẳn nhau về BẢN CHẤT, không thể là một ảnh
phóng to** — đây chính là cơ chế chặn lỗi *"ba nấc thành kéo dãn"* mà Hoà đã bắt hai lần.

> ⚠️ `uvScaleMm` **là optional**. Thiếu nó ⇒ **không được đoán**: hiện nấc JUDGE ở `spanMm` mặc
> định + **chỉ báo `!` ở mặt 3D** với đúng câu `ba-mat.ts` đã viết sẵn (*"có ảnh vân nhưng chưa
> khai bước lặp vân (mm)"*), và **khoá nấc INSPECT** kèm lý do — không mở một nấc nói dối về khổ.

---

## §3 · B · KHỐI BA CÂU HỎI — sáu mảng

Khuôn: `docs/control/IF-TRI-THUC-NGHE.md` §6. **Mảng nào chưa đủ ba câu thì không vào plan.**

### M-A · KHO VẬT LIỆU (`/materials` · `MaterialsScreen` + `MaterialTable`)

```
① THẤY      nhân vật chính: MẪU VẬT (một, to nhất hàng — người ta tìm vật liệu bằng MẮT, không bằng mã)
            đọc từ xa:     tên + 3 chỉ báo ba mặt (đủ/thiếu/chưa có)
            chỉ khi soi kỹ: hãng · kích thước · giá · đơn vị · phòng · nguồn
② THAO TÁC  việc nghề: "tìm gỗ tối màu cho tủ bếp, xem đã đủ dữ liệu để dựng chưa"
            → gõ ô tìm (1) → mắt quét cột mẫu vật (0 bấm) → bấm hàng (1) = 2 cú bấm
            phím: `/` hoặc `⌘F` vào ô tìm · `↑↓` chạy hàng · `Enter` mở · `Esc` đóng
            rời chuột: KHÔNG (ô tìm và danh sách cùng một cột mắt)
③A FRONTIER mẫu vật ≥80px ∧ px/spanMm ≥6,7 (§5.4 hàm thuần + test) · vùng bấm ≥24px AA
            (IF-CHUAN-BO-CUC VB-1) · nhịp 4 (BC-1) · chỉ báo đọc được khi BỎ HẾT MÀU (đã đạt: ✓ ≈ ! –)
            · KHÔNG ô nào rơi về biểu tượng ảnh-hỏng
③B OUTPUT   KHÔNG sinh file trực tiếp. Nhưng nó là NGUỒN của 3 đầu ra (M-F) ⇒ vẫn chịu §5.3 gián tiếp.
```

🔴 **Lệch nặng nhất của mảng này** không phải cỡ ô mà là **hình thức**: bảng CSDL 11 cột cho một
màn mà việc chính là **nhìn**. Cột mẫu vật đang là cột **hẹp nhất** (32px trong bảng 1142px = **2,8%**).
⇒ Bố cục phải đảo trọng số, **không** đảo bằng cách bỏ cột — không gian nghề *được phép dày*.

### M-B · TẤM MỘT VẬT BA MẶT (`BaMatPanel` · `ChiBaoBaMat`)

```
① THẤY      nhân vật chính: BA KHỐI cạnh nhau — 2D · 3D · Giá, mỗi khối tự nói đủ/thiếu/lối ra
            đọc từ xa:     dấu ✓ ≈ ! – (bốn hình khác hẳn nhau, không cần màu)
            chỉ khi soi kỹ: giá trị thật từng mặt (hatch nào · nhám bao nhiêu · giá nào)
② THAO TÁC  việc nghề: "món này dùng được ở chặng nào rồi, thiếu gì thì đi đâu vá"
            → bấm chỉ báo ở hàng (1) → đọc → bấm lối ra của mặt thiếu (1) = 2 cú bấm tới nơi sửa
            phím: `Esc` đóng · `Tab` đi qua ĐÚNG BA điểm dừng (một điểm mỗi mặt)
            rời chuột: KHÔNG
③A FRONTIER mỗi mặt `chuaDu`/`chuaCo` BẮT BUỘC có `thieu` + `loiRa` (ba-mat.ts đã ép, giữ)
            · mặt không làm được việc tại chỗ thì KHÔNG mọc nút (luật §9 cấm nút giả)
            · cụm chỉ báo = MỘT nút (một điểm dừng Tab mỗi hàng), `aria-label` kể trọn ba mặt
③B OUTPUT   KHÔNG sinh file.
```

### M-C · CỬA CHỌN LÚC ĐANG VẼ 2D (`MaterialPalette`)

```
① THẤY      nhân vật chính: KHO VẬT LIỆU (phần mang DANH TÍNH) — phải đứng TRÊN preset thị giác
            đọc từ xa:     mẫu vật + tên + mã; ô đang cầm có viền nhấn
            chỉ khi soi kỹ: giá/đơn vị, pattern kỹ thuật (tỉ lệ · góc)
② THAO TÁC  việc nghề: "đang tô sàn, đổi sang gỗ óc chó"
            → (chưa chọn gì) mở panel (1) → bấm mẫu (1) = 2 cú bấm, tự chuyển sang lệnh Hatch
            → (đang chọn vùng) thêm cửa duyệt: bấm nút phạm vi (1) + tick nếu cần = 4 cú bấm
            phím: `Esc` huỷ cửa duyệt · `Enter` = phạm vi HẸP (nút autoFocus)
            rời chuột: có 1 lần (canvas → panel phải). Làm 40 lần/ngày ⇒ mỏi ở quãng canvas↔mép phải
              ⇒ đường rút ngắn ĐÃ CHỐT là "cạnh vật đang chọn" (HUONG-DUNG-LAI §BƯỚC 1)
              — NGOÀI phạm vi lát cắt này, ghi để không ai tưởng đã xong.
③A FRONTIER chấm màu kho 22×22 (`:260`) DƯỚI sàn AA 24px ⇒ phải đo lại vùng bấm THẬT của cả hàng
            (VB-2 miễn trừ khoảng cách có thể cứu — phải ĐO, không suy)
            · ô mẫu preset ~154px ĐẠT · lưới 2 cột trong panel 360px: n_lot ≈ 6 ⇒ n>6 BẮT BUỘC có ô tìm
            · panel kính: portal ra body, CẤM kính chồng kính (luật K4 — đang đúng, giữ)
③B OUTPUT   gián tiếp: quyết định specId của mọi vùng tô ⇒ quyết định BOQ có dòng hay không.
```

⛔ **Kéo-thả KHÔNG phải mặc định.** Đích trên bản vẽ 1:50 là đích **nhỏ**; MacKenzie/Sellen/Buxton
CHI'91 đo pointing **4,2 bits/s** vs dragging **3,0** (kém 29%), và Quinn/Inkpen 2001 cho thấy
đích nhỏ làm **dragging tệ đi nhiều hơn hẳn**. Bấm-chọn là chính; kéo-thả nếu có thì chỉ ở 3D nơi
đích to. (Đây là chỗ **cấm chép D5**.)

### M-D · BẢNG TÁC ĐỘNG (`MaterialImpactPreview`)

```
① THẤY      nhân vật chính: SÁU HÀNG NƠI TIÊU THỤ kèm con số thật
            đọc từ xa:     tổng "N tham chiếu trong dự án đọc lại"
            chỉ khi soi kỹ: từng usage cụ thể (sau khi bấm nhảy tới)
② THAO TÁC  việc nghề: "đổi gỗ cho 3 mảng, KHÔNG đụng bức tường mẫu đã duyệt"
            → tick bỏ hàng không muốn (n) → bấm "Chỉ N vùng đang chọn" (1)
            phím: `Esc` huỷ · `Enter` phạm vi hẹp · `Space` tick hàng đang focus
            rời chuột: KHÔNG (cửa nổi giữa màn)
③A FRONTIER mỗi hàng phải đủ BA việc: (a) có số thật · (b) BẤM ĐƯỢC để tới chỗ đó · (c) BỎ TICK ĐƯỢC
            → hôm nay 1/3. Sau lát cắt: 3/3.
            · hàng `count: null` (Hồ sơ trình bày) GIỮ NGUYÊN không số — và do đó KHÔNG có nút nhảy
            · tick phải thao tác được BẰNG BÀN PHÍM (ACTIVE-DESIGN-CONTEXT §6)
③B OUTPUT   KHÔNG sinh file — nhưng là CỬA CUỐI trước khi con số vào BOQ.
            ⛔ hàng "BOQ / dự toán" CHỈ số đếm tham chiếu. CẤM tiền chênh lệch (luật 15/08).
```

### M-E · CHỌN & THẤY VẬT LIỆU Ở 3D (`Command3DPanel` MaterialTab · `Scene3DViewer`)

```
① THẤY      nhân vật chính: MẶT KHỐI ĐANG ĐỔI trong khung nhìn — không phải ô swatch trong panel
            đọc từ xa:     vật liệu đang cầm (ô nào đang nhấn)
            chỉ khi soi kỹ: thông số PBR (đã có RnaPanel/MaterialPbrEditor, không dựng lại)
② THAO TÁC  việc nghề: "cầm gỗ óc chó, bấm lên mặt tủ"
            → bấm ô vật liệu (1) → bấm mặt khối (1) = 2 cú bấm
            phím: `Esc` bỏ vật liệu đang cầm
            rời chuột: KHÔNG
③A FRONTIER 🔴 hôm nay KHÔNG ĐẠT ở mức nặng nhất: `matDangCam` đặt mà 0 nơi đọc ⇒ NÚT GIẢ (§9 cấm)
            ⇒ luật thi công: hoặc NỐI (raycast + gán specId), hoặc LÀM MỜ + NÓI LÝ DO. Cấm giữ nguyên.
            · panel 3D phải đọc PBR THẬT: nay `MaterialTab` suy `kind` từ TÊN (`kindFromName`)
              trong khi `typeId` đã có sẵn trong `MaterialPbr` ⇒ đoán trong khi đã biết
③B OUTPUT   CÓ — ảnh phối cảnh. Soi CHUAN-DAU-RA-NGHE §2: ≥300dpi · sRGB · provenance img_.
            🔴 AI ĐÃ MỞ FILE ĐÓ: CHƯA AI.
```

### M-F · ĐẦU RA (Bảng vật liệu A3 · BOQ)

```
① THẤY      nhân vật chính: BẢNG MẪU VẬT — theo chốt Hoà 15/08: các mẫu XẾP CHỒNG ĐÈ NHAU,
                             có bố cục đầy đủ; trỏ vào mẫu nào hiện thông tin mẫu đó
            đọc từ xa:     tên dự án + nhóm vật liệu theo phòng/thầu
            chỉ khi soi kỹ: spec từng món (mã · hãng · đơn vị · hao hụt)
            🔴 RÀNG BUỘC CỨNG: BẢN TRÊN MÀN = BẢN NỘP. Cấm dựng bố cục hai lần.
② THAO TÁC  việc nghề: "gom vật liệu dự án thành bảng A3 gửi khách"
            → mở Trình chiếu (1) → chọn "Bảng vật liệu A3" (1) → các món ĐÃ ĐỨNG SẴN → sửa/xuất
            phím: `⌘P` xem trước/xuất PDF (chốt hệ phím 10/08)
③A FRONTIER 0 placeholder · nhãn không đè hình · lưới nhất quán với hệ (BC-1)
③B OUTPUT   CÓ — soi CHUAN-DAU-RA-NGHE:
            §3 BOQ:  mã · tên · ĐƠN VỊ CHUẨN · khối lượng TRUY được về bản vẽ · đơn giá CÓ NGUỒN+NGÀY
                     · hao hụt khai rõ % không cộng ngầm · số sửa tay MANG BADGE · tổng khớp tổng dòng
                     · mở bằng Excel thật không lỗi
            §4 A3:   chữ body ≥18pt · tương phản AA trên MỌI nền ảnh · ảnh đủ pixel không vỡ
                     · Brand Kit DỰ ÁN (0 vết thương hiệu studio khác) · 0 `{{ }}`/lorem/"Untitled"
                     · có số trang + revision
            🔴 AI ĐÃ MỞ FILE ĐÓ: CHƯA AI — đây là cửa nghiệm thu còn trống của cả Đ2.
```

---

## §4 · C · NĂNG LỰC PHẢI GIỮ — trích từng dòng `KIEM-KE-NANG-LUC.md`

### 4.1 · 🔴 LỖ CHẶN mà hành trình này **phải đóng**

> **C18** — *"thả cấu kiện `.idfc` từ Thư viện vào bản vẽ · `LibraryDropBridge.tsx` · 🔴 LỖ CHẶN đã
> đo (J14): cấu kiện thả ra **nét rời**, `specId` KHÔNG gắn được (`LibraryDropBridge.tsx:112`) ⇒
> **không bao giờ lên BOQ, và BOQ cũng không báo lỗi**"*
> **L4** — *"kéo-thả món ra bản vẽ / canvas · 🔴 xem C18 — `specId` không gắn được"*

🔧 **ĐÍNH CHÍNH BẢN KIỂM KÊ — đo 05/09, mã đã đổi sau khi bản kiểm kê viết:**
`LibraryDropBridge.tsx:131-137` **đã gắn `specId` lên nét rời** (`specId` nay nằm ở `Base`,
`model.ts:362`), `compute.ts:311` **đã gom theo `srcInsertId` thành MỘT dòng/bản chèn**, và có
proof runtime `scripts/proof/idfc-identity-boq.mjs`. Cả hai đầu treo sau **một** cờ
`NEXT_PUBLIC_IF_IDFC_IDENTITY` — **`grep` trong `.env` và `.env.example` = 0 dòng ⇒ đang TẮT.**

⇒ **Việc thật KHÔNG phải viết mã, mà là BẬT + CHỨNG MINH.** Đúng ba bước, không hơn:
1. khai cờ trong `.env.example` (kèm câu giải thích) và bật ở môi trường nghiệm thu;
2. chạy `node scripts/proof/idfc-identity-boq.mjs` — phải xanh **cả hai** khẳng định:
   *một bản chèn = MỘT dòng BOQ* **và** *cờ TẮT ⇒ BOQ y hệt hôm nay*;
3. đi chặng **A11** trên app thật: thả một `.idfc` → mở BOQ → **thấy dòng của nó**.

⚠️ Hai đầu **lệch cờ là ca tệ nhất** (docstring `idfc-identity-flag.ts` đã cảnh báo): gắn mà không
đếm = món mất khỏi BOQ như cũ. ⇒ nghiệm thu phải kiểm **cả hai chiều bật/tắt**.

### 4.2 · Năng lực phải còn nguyên sau lát cắt (trích, không diễn giải)

| # | Dòng kiểm kê | Chạm ở chặng nào | Giữ bằng cách nào |
|---|---|---|---|
| **M1** | *liệt kê + lọc + tìm theo tên/hãng/loại · `MaterialsScreen.tsx:41-50`* | A1 A3 | đổi **hình thức hàng**, không đổi `filtered` |
| **M2** | *thêm/sửa/xoá · `DELETE /api/specs/:id` · `MaterialFormModal`* | A4 | dòng `chiDocThuongMai` **giữ nguyên** — hạt giống không có nút Sửa/Xoá, có **nhãn CHỮ** *"theo bản cài"* |
| **M3** | *nhập Excel/CSV có bước ghép cột tay · 17 tệp test* | — | không chạm |
| **M4** | *sửa PBR 14 thông số — panel **TỰ SINH từ định nghĩa** (IF-RNA v0)* | A5 | ⛔ **cấm khai tay lại panel**; muốn thêm trường thì sửa `material-pbr.rna.ts` |
| **M5** | ⭐ *BA MẶT — một `matId`, không tách · `resolve.ts:52`* | A2 A4 | mọi đường đọc đi qua `getMaterial()`; **cấm đường đọc thứ hai** |
| **M6** | *xem tác động khi đổi vật liệu* | A7 A8 | nâng 1/3 → 3/3, **không thay engine** |
| **M7** | *bảng màu là MỘT BƯỚC trong chọn vật liệu, không phải trang riêng* | A4 | nút `/colors` giữ vai một bước |
| **M8** | *quả cầu xem trước (three.js + RoomEnvironment PMREM, cache PNG)* | A2 A5 | **đây là máy chính được nối vào**; giữ rig singleton |
| **M9** | *màn hỏng nói rõ lý do (401 · mất mạng · không quyền)* | A1 | `lyDoHong` `:126-129` giữ nguyên |
| **C19** | *bảng vật liệu 2D (hatch/màu theo `matId`)* | A6 | mảnh còn thiếu: `defsHatGiong()` (§6 V1) |
| **C23** | *đưa bản vẽ sang Trình chiếu · **J11 PASS 3/3 lượt*** | A11 | đường handoff **không được đụng** |
| **P9** | *BOQ: sinh từ Doc sống · nhóm theo tầng · **sửa tay từng ô (override)** · undo override · xuất `.xlsx` kèm ảnh · nhập `.xlsx`* | A11 | override là **lớp phủ**, **cấm ghi ngược Doc** |
| **P10** | *phụ lục BOQ từ bản vẽ · `boq-appendix.test.ts`* | A11 | không chạm |
| **§2 resume** | *đường lưu-và-vào-lại — **họ bệnh đã trả giá 4 lần*** | A12 | `.idf` là `JSON.stringify(Doc)`; **thêm field lên entity là thêm vào tệp người dùng** ⇒ không thêm field mới trong lát cắt này |

### 4.3 · Nợ CSDL còn mở — **không bị lát cắt này chặn, nhưng phải khai**

> *"`ProductSpec.matId` **null** trên dữ liệu thật ⇒ nhánh matId-UUID của BOQ **chưa chạy sống lần
> nào**. Migration đã có sẵn (`fd83f343`), việc còn lại là `migrate deploy` + backfill
> (`scripts/backfill-material-matid.ts`, mặc định dry-run)."*

Hành trình A **chạy được mà không cần backfill** vì hạt giống đi đường `matId` UUID còn dòng DB cũ
đi đường `legacy-sku` — `resolve.ts` đã tách hai namespace. ⇒ **Không chặn.** Nhưng chặng **A11**
trên **dữ liệu DB cũ** thì đi nhánh legacy; muốn nghiệm thu nhánh UUID phải chạy backfill trước.
**Khai rõ trong báo cáo nghiệm thu đã đi nhánh nào** — im lặng là ca *"test che bug"* (bài học 15/08).

---

## §5 · D · TIÊU CHÍ NGHIỆM THU ĐO ĐƯỢC — bàn audit chấm bằng đúng bảng này

### 5.1 · Vế **A · FRONTIER** — máy chấm được

| # | Tiêu chí | Ngưỡng | Đo bằng | Hôm nay |
|---|---|---|---|---|
| F1 | Kho vật liệu có pixel vật liệu thật | `tongImg + tongCanvas ≥ số hàng` trên `/materials` | đo DOM sống, 1440×900 | 🔴 **0** |
| F2 | Không ô nào là biểu tượng ảnh-hỏng | số ô rơi về `ImageIcon` = **0** | đo DOM | 🔴 **3/3** |
| F3 | Mẫu vật nấc JUDGE đủ nét | `px ≥ 80` **∧** `px / spanMm ≥ 6,7` | **hàm thuần + test** (§5.4) | 🔴 32px |
| F4 | Nấc INSPECT khác BẢN CHẤT nấc JUDGE | `spanMm(INSPECT) ≥ 10 × spanMm(JUDGE)` | cùng hàm + test | ❌ chưa có nấc |
| F5 | Mặt 2D sống trên vật liệu ship sẵn | chỉ báo 2 hạt giống ≠ `–` | đo DOM chuỗi ba mặt | 🔴 `2D –` cả hai |
| F6 | Bảng tác động đủ ba việc mỗi hàng | (a) số ∧ (b) nhảy ∧ (c) tick = **3/3** | mở cửa, bấm từng hàng | 🟡 **1/3** |
| F7 | Không đường ghi vật liệu thứ hai | số hàm ghi specId **không tăng** | `grep -c 'replaceMaterialReferences\|applyMaterial('` trước/sau | ✅ giữ |
| F8 | Cửa duyệt còn nguyên | không chọn → **2** bấm · có chọn → **4** bấm | đếm tay trên app | ✅ giữ |
| F9 | 3D không còn nút giả | `matDangCam` có nơi đọc **hoặc** nút mờ kèm lý do | `grep -c matDangCam` ≥3 nơi | 🔴 ngõ cụt |
| F10 | 3D đọc PBR thật | `buildPbrMaterial` có nơi gọi ngoài `material-preview.ts` | `grep` | 🔴 0 |
| F11 | Vùng bấm | mọi đích ≥ **24×24** (AA); chấm 22px `MaterialPalette:260` phải đo lại vùng bấm THẬT của hàng | `scripts/soi-mat/do-chuan-bo-cuc.mjs` → `duoi24` | 🟡 chưa đo |
| F12 | Màu không là kênh duy nhất | bỏ hết màu vẫn đọc được ✓ ≈ ! – | chụp ảnh xám | ✅ đạt, giữ |
| F13 | Nhịp lưới | mọi `padding/margin/gap` gõ cứng là **bội số 4** | `npm run soi:bo-cuc -- --tran` | — |
| F14 | Nợ nền không tăng | `soi:foundation` ≤ **185** | `npm run soi:foundation -- --tran` | mốc 185 |
| F15 | Mọi cổng chung xanh | `npm run tsc` · `npm test` · `test:ky-thuat` | — | — |
| F16 | Kéo/tick làm được bằng bàn phím | `Tab` tới tick, `Space` bật/tắt | thao tác thật, không chuột | ❌ chưa có tick |

### 5.2 · Vế **A′ · MẮT NGƯỜI** — máy **không** chấm được (N-16), khai thẳng

| # | Câu hỏi | Cách hỏi | Đạt là gì |
|---|---|---|---|
| N1 | *hai cái này khác nhau ở đâu* | bày **ba cỡ (32 / 80 / 168 px) × hai vật liệu thật** cạnh nhau, hỏi **3 người nghề** | ≥2/3 tách được ở **168**; nếu tách được ngay ở **80** thì **HẠ SÀN**, nếu 168 vẫn không thì **NÂNG** — con số 80/6,7 là **SUY LUẬN**, không phải chuẩn (§7-2) |
| N2 | *nhìn hàng này biết món dùng được tới đâu chưa* | che cột giá đi, hỏi *"món này dựng 3D được chưa"* | trả lời đúng trong **≤ 3 giây** |
| N3 | *thứ bậc trên màn có đúng không* | mắt Hoà, theo `VISUAL-APPROVAL-QUEUE` | mẫu vật đọc ra là nhân vật chính, không phải cột mã |

### 5.3 · Vế **B · OUTPUT** — 🔴 **cửa còn trống của cả Đ2**

> Luật 11/08: **mảng nào sinh file thì nghiệm thu = MỞ FILE ĐẦU RA.** `tsc` xanh · test xanh ·
> ảnh chụp đẹp — **cả ba đều không đủ.**

| # | File | Soi mục nào | Đạt là gì |
|---|---|---|---|
| B1 | **BOQ `.xlsx`** (sau A10, đã đổi sồi→óc chó) | `CHUAN-DAU-RA-NGHE` §3 | 6 gạch đầu dòng của §3 · **mở bằng Excel thật không lỗi** · dòng sửa tay có **badge** · hao hụt khai **%** không cộng ngầm |
| B2 | **Bảng vật liệu A3** (PDF) | §4 + §2 | 0 placeholder · nhãn không đè hình · Brand Kit **dự án** · ≥300dpi · có số trang + revision |
| B3 | **Ảnh phối cảnh** (nếu chạm 3D) | §2 | sRGB · ≥300dpi tại khổ đích · có `img_` + provenance |
| B4 | **Câu kết bàn audit** | `IF-TRI-THUC-NGHE` §7 | *"tôi có dám giao hồ sơ này cho khách không — CÓ / KHÔNG, vì sao"* |

⛔ **Lát cắt chưa xong chừng nào chưa có người MỞ B1 và B2 bằng mắt.** Ghi tên người mở và ngày.

### 5.4 · **HIỆU NĂNG — tiêu chí BẮT BUỘC**, không phải "nice to have"

Ca xấu phải chống: **`AdPreviewGenerator` của Revit** — mở thư viện vật liệu **30 giây, 100% CPU**.
Ô 32→168 px là **27× diện tích**; render đồng loạt là việc thật, không phải lo xa.

| # | Tiêu chí | Ngưỡng | Đo bằng |
|---|---|---|---|
| **P1** | **Chỉ render mục ĐANG THẤY** | với danh sách **200 món**, số lượt gọi `renderMaterialPreviewAsync` khi mở màn ≤ **số ô trong khung nhìn + 6 đệm** (≈30), **không phải 200** | đếm lượt gọi (đặt bộ đếm tạm khi đo). 🔴 hôm nay **chưa có `IntersectionObserver` nào trong repo** — `grep` = 0 ⇒ đây là phần **phải dựng** |
| **P2** | **Cache theo vật liệu + tham số + nấc** | mở → rời → mở lại cùng danh sách: lượt render **= 0** | `cache` `Map` đã có `material-preview.ts:262`; **khoá phải gồm nấc** (`size`+`resolution` đã vào khoá) |
| **P3** | **Chất lượng tăng dần** | SCAN dùng `resolution 0.25`; chỉ nâng lên `1` khi mở JUDGE/INSPECT | tham số `resolution` đã có sẵn — **cấm mở màn ở `1`** |
| **P4** | **Nâng cấp lúc rảnh** | nâng nấc chạy trong `requestIdleCallback`/rAF, **huỷ được** khi cuộn qua | `MaterialSphere` đã đẩy qua rAF + `cancelAnimationFrame` — mở rộng, không thay |
| **P5** | ⛔ **Cấm dựng shader đắt cho cả thư viện ngay từ đầu** | **0** lượt render đồng bộ lúc mount; **0** `WebGLRenderer` mới sinh thêm | rig **singleton trên `globalThis`** (bài học 04/08 tràn ~16 context) — **cấm** đổi sang biến module |
| **P6** | **Chỉ vô hiệu hoá đúng bản bị ảnh hưởng** | sửa PBR của **một** vật liệu ⇒ đúng **các ô của mã đó** vẽ lại; ô của mã khác **không** đổi | khoá cache của ô phải trộn `pbrCacheKey`/phiên bản (editor đã làm vậy) |
| **P7** | **Trần đồng thời** | ≤ **4** lượt render chạy cùng lúc; phần còn lại xếp hàng | hàng đợi trong lớp gọi, **không** trong `material-preview.ts` |
| **P8** | **Không tác vụ dài** | cuộn 200 hàng: **0** long task > **200 ms**; hàng đầu đọc được ≤ **1 s** | đo sống bằng playwright |

> 🔴 **Ràng buộc kiến trúc để P1–P8 không đánh nhau với A1:** ô mẫu vật **phải có nền chờ có
> nghĩa ngay từ frame đầu** — `MaterialSphere` đã nhận `fallback`, và fallback đúng ở đây là
> **vân procedural** (`materialTextureDataUrl`, đồng bộ, rẻ, không WebGL), **không** phải ô trơn.
> ⇒ Cuộn nhanh thì thấy vân; dừng lại thì quả cầu PBR nâng lên. **Không có khoảnh khắc nào ô trống.**

### 5.5 · Ngưỡng thi hành ở đâu — **KHÔNG máy soi mới**

```ts
// lib/materials/nac-xem-truoc.ts  — THUẦN, không DOM
export type NacXem = 'scan' | 'judge' | 'inspect';
export function nacXemTruoc(pbr: MaterialPbr | null, nac: NacXem, px: number):
  { px: number; spanMm: number | null; repeat: number | null; datNguong: boolean; lyDo: string | null }
```
· `judge` ⇒ `spanMm = min(25, uvScaleMm.w)`; `datNguong = px >= 80 && px / spanMm >= 6.7`
· `inspect` ⇒ `spanMm = 1.5 * uvScaleMm.w`; thiếu `uvScaleMm` ⇒ `spanMm: null` + `lyDo` (khoá nấc)
· **Test khoá cứng, đây là chỗ ngưỡng SỐNG:**
  - `nacXemTruoc(pbrSoi,'judge',168).datNguong === true`
  - `nacXemTruoc(pbrSoi,'judge',32).datNguong === false` ← ca hôm nay **phải đỏ**
  - `spanMm(inspect) >= 10 * spanMm(judge)` với **mọi** vật liệu hạt giống ← chặn *"ba nấc = kéo dãn"*
  - thiếu `uvScaleMm` ⇒ `inspect.spanMm === null` ∧ `lyDo !== null` ← chặn *nói dối về khổ*

⇒ Ngưỡng **không thể bị đi vòng**, vì mọi ô xem trước phải qua hàm này để lấy `repeat`.
Đây là khuôn *"nguyên tắc thành một khẳng định test"* đã dùng ở P-R, và nó **rẻ hơn + chặt hơn**
một máy soi tĩnh (máy tĩnh không đọc được `uvScaleMm` của từng vật liệu lúc chạy).

---

## §6 · E · THỨ TỰ THI CÔNG — và **vì sao thứ tự đó**

**Nguyên tắc xếp:** cái **chặn nhiều thứ nhất** đi trước; trong cùng hạng thì **nội dung thật**
trước **hình thức** (luật 05/09: *nội dung → cách vật tự thể hiện → thao tác → bố cục → hệ thị
giác → chuyển động → đánh bóng*).

| V | Việc | Vì sao đứng đây | Chạm tệp | Xong thì **thấy** gì |
|---|---|---|---|---|
| **V1** | **`defsHatGiong()` — dựng mặt 2D từ `hat-giong.hatch2d`**, trộn vào `defs` của `getMaterial()` | **Chặn nhiều nhất.** Thiếu nó thì mặt 2D chết trên 100% vật liệu ship sẵn ⇒ A2 · A4 · A6 · A11 đều nói dối. Và nó là **một hàm 15 dòng, đối xứng y hệt `pbrMapHatGiong()` đã có** | `lib/materials/kho-mo-dau.ts` (hoặc `hat-giong.ts`) · nơi gọi `getMaterial` | chỉ báo đổi `2D –` → **`2D ✓`** cho cả hai hạt giống |
| **V2** | **`nac-xem-truoc.ts` + test** (§5.5) | Là **hợp đồng** mà V3 và V4 phải tuân. Viết sau V3 thì V3 sẽ tự chế con số | tệp mới thuần + test | `npm test` có 4 khẳng định mới; ca 32px **đỏ** |
| **V3** | **Nối máy xem trước vào Kho vật liệu** — ô mẫu 32px → mẫu vật nấc SCAN có nền vân procedural, nâng lên quả cầu PBR khi rảnh | Đây là **nội dung thật lên màn**. Nó phải đứng **trước** mọi việc bố cục — nếu không sẽ lại vẽ bố cục quanh ô trống | `MaterialTable.tsx:72` · `MaterialsScreen.tsx` | `tongImg/tongCanvas` từ **0** → ≥ số hàng |
| **V4** | **Hiệu năng P1–P8** — cửa sổ hiển thị + hàng đợi ≤4 + nâng nấc lúc rảnh | Đi **liền** V3, không tách đợt: nối xong mà không có cửa sổ hiển thị là **tự dựng lại `AdPreviewGenerator`** trong cùng một lượt | lớp gọi quanh `MaterialSphere` | 200 món: ≤30 lượt render, 0 long task >200ms |
| **V5** | **Ba nấc SCAN/JUDGE/INSPECT** + bố cục hàng đảo trọng số về mẫu vật | Chỉ có nghĩa sau khi có ảnh thật (V3) và có ngưỡng (V2) | `MaterialTable` · `BaMatPanel` | nấc INSPECT của gỗ sồi thấy **mạch ván 1200mm**; JUDGE thấy **vân** |
| **V6** | **Bảng tác động 1/3 → 3/3**: (b) nhảy tới · (c) bỏ tick | Chặn A7 A8. `usages[].ownerId` và `scope.entityIds` **đã có sẵn** ⇒ chỉ nối, không thêm nhánh ghi | `MaterialImpactPreview.tsx` · `MaterialPalette.tsx` | bấm hàng → vật sáng lên; bỏ tick → số trên nút giảm ngay |
| **V7** | **BẬT cờ `.idfc` + chạy proof + đi A11** | Đóng lỗ **C18/L4**. Mã đã có; đây là bật + chứng minh (§4.1) | `.env.example` · chạy `scripts/proof/idfc-identity-boq.mjs` | món `.idfc` thả xuống bản vẽ **có dòng trong BOQ** |
| **V8** | **3D: hết ngõ cụt + đọc PBR thật** — `matDangCam` có nơi đọc (raycast → gán `specId`) **hoặc** nút mờ kèm lý do; `Scene3DViewer` dựng vật liệu qua `buildPbrMaterial` | Chặn A9. Nặng nhất về mã, nhưng **không chặn V1–V7** ⇒ xếp sau. **Cấm để nguyên nút giả** | `Render3DModeSkeleton.tsx` · `Scene3DViewer.tsx:478,491` · `Command3DPanel.tsx` | đổi sồi ↔ óc chó ở 3D **nhìn ra khác chất**, không chỉ khác màu |
| **V9** | **Đầu ra**: bảng A3 nhận vật liệu dự án; **MỞ B1 + B2 bằng mắt** | Cửa nghiệm thu cuối. Không có V1–V8 thì mở file ra cũng chỉ soi được trang trắng | `PresentSheets.tsx:784` + đường gom vật liệu | *"Bảng vật liệu A3"* mở ra **có món**; có người ký tên đã mở file |

### 6.1 · Hai chỗ **cố ý xếp sau**, nói rõ để không ai tưởng bị quên

- **Cửa chọn "cạnh vật đang chọn"** (near-pointer, `HUONG-DUNG-LAI` §BƯỚC 1): đúng, đáng làm,
  **ngoài lát cắt này** — nó là việc của kiến trúc *cửa sổ công cụ*, không phải của vật liệu.
- **Bộ vật liệu phủ đủ 17 họ**: là **DỮ LIỆU thêm vào bảng `VAT_LIEU_HAT_GIONG`**, KHÔNG phải máy
  móc mới (docstring `hat-giong.ts:72` đã ghi). Làm sau khi hai món chạy trọn vòng — làm trước là
  nhân bản một vòng đời chưa được chứng minh lên 17 lần.

---

## §7 · ⑦b · CHƯA CHẮC / CHƯA KIỂM

1. 🔴 **Hàng `A4 Đá Marble 473564` xuất hiện trên tài khoản MỚI TINH.** Đo sống 05/09: tạo tài khoản
   trong chính lượt đo, `/materials` vẫn ra **3 hàng**, hàng thứ ba là rác thử nghiệm giá
   `999 000 đ`, nhãn *Studio tự nhập*. **Chưa xác định** là do `GET /api/specs` không cắt theo người
   dùng/studio, hay do CSDL dev bẩn. Nếu là cái thứ nhất thì đây là **lỗ phạm vi dữ liệu**, nặng hơn
   mọi thứ trong tệp này và **ngoài phạm vi lát cắt** — phải mở phiếu riêng, không im lặng bỏ qua.
2. 🔴 **Ngưỡng `80 px` / `6,7 px/mm` là SUY LUẬN của bàn nghiên cứu, KHÔNG phải chuẩn công bố.**
   Bốn dữ kiện đầu vào có nguồn (góc nhìn W3C · thị lực Snellen · giải phẫu vòng năm gỗ · cỡ mẫu
   nghề 100/300mm); **phép ghép thì không**. **Chưa ai thử bằng mắt người** với đúng hai ảnh sồi/óc
   chó. ⇒ §5.5 khoá nó thành test, nhưng **N1 (§5.2) phải chạy trước khi coi con số này là bất
   biến**. Đây cũng là lý do **bác đề xuất `soi:vat-lieu`**: đóng một con số chưa kiểm thành cổng
   máy toàn repo là nắn cả app theo một con số có thể sai — hàm+test thì sửa một chỗ.
3. 🔴 **Chưa ai mở một file đầu ra nào** (BOQ `.xlsx` · bảng A3 PDF). Mọi kết luận về vế ③B là
   **suy từ mã và từ chuẩn**, không phải từ file thật. §5.3 là **cửa còn trống**, không phải cửa đã qua.
4. 🟡 **Số đo hiệu năng P1–P8 chưa có ca cơ sở.** Kho thật hôm nay **3 món**; ngưỡng "200 món" là
   **giả định tải**, chưa ai dựng danh sách 200 để đo. Con số ≤30 lượt render là **suy từ hình học
   khung nhìn**, chưa đo.
5. 🟡 **Đường 3D mới đọc mã, chưa chạy tay.** Kết luận "ngõ cụt `matDangCam`" và "viewport không đọc
   PBR" đến từ `grep` + đọc `Scene3DViewer.tsx:478,491`. **Chưa mở chặng 3D trên app thật** để xác
   nhận người dùng thấy gì khi bấm ô vật liệu (có toast? có im lặng?). Trước khi thi công V8 phải
   đo chặng đó **một lượt bằng tay**.
6. 🟡 **`Scene3DViewer` có thể không phải nơi duy nhất dựng vật liệu 3D.** Chỉ mới grep
   `MeshStandardMaterial` trong `Viewport3D.tsx` + `Scene3DViewer.tsx`. Còn `Object3DWindow.tsx`,
   `Scene3DPreviewModal.tsx`, đường export D5/V-Ray — **chưa soi**. V8 phải liệt kê hết trước khi sửa.
7. 🟡 **Chưa kiểm nhánh `prefers-reduced-motion`** cho phần nâng nấc chất lượng. Nâng dần là một
   dạng chuyển động thị giác; luật *reduce-motion thắng tất cả* có thể đòi hiện thẳng nấc cuối.
   Chưa quyết, chưa đo.
8. 🟡 **Vùng bấm thật của hàng kho trong `MaterialPalette` chưa đo.** Chấm màu `22×22` (`:260`) dưới
   sàn AA 24, nhưng cả **hàng** là nút — miễn trừ VB-2 có thể cứu. **Phải đo sống**, không suy.
9. ⚪ **Cỡ mẫu nghề 100/300 mm** lấy từ trang bán đá của **một hãng** — thông lệ thương mại, **không
   phải ISO**. Dùng làm mốc cảm giác cho nấc INSPECT, **không làm luật**.
10. ⚪ **Đo sống chỉ một lần, một khổ (1440×900), theme tối, Chromium.** Chưa đo khổ hẹp, chưa đo
    theme sáng, chưa đo con trỏ thô (nơi `--tap` nhảy lên 44 và toàn bộ mật độ đổi).

---

## §8 · Ô KẾT (MẪU 6)

### ① VẤN ĐỀ
Hào của IF — *một vật liệu, ba mặt, một nguồn* — **có đủ lõi và đã cắm điện**, nhưng **vô hình trên
màn**. Đo sống 05/09 tại `localhost:3277`, tài khoản mới: kho vật liệu có **`<img>` = 0 · `<canvas>`
= 0**, ô xem trước **32×32 px** chứa **biểu tượng ảnh-hỏng 14 px** (dưới sàn phân giải 80 px **2,5
lần**); mặt 2D **chết trên 100% vật liệu ship theo bản cài** (`2D –`, vì `MATERIALS` có **0/13**
preset khai `matId` và **không có `defsHatGiong()`**); bảng tác động xuyên-chặng mới đạt **1/3**
(có số, **không** nhảy tới được, **không** bỏ tick được); chọn vật liệu ở 3D là **ngõ cụt đo được**
(`matDangCam` — 2 dòng khai, **0 nơi đọc**); khung nhìn 3D **không đọc `MaterialPbr`** (gõ cứng
`roughness 0.78`); và **chưa ai mở một file đầu ra nào** để nghiệm thu theo vế B.

### ② GIẢI PHÁP
Chín việc, đúng thứ tự §6, **phần lớn là NỐI chứ không DỰNG** (vùng Material là vùng DÀY — §B25):

| | việc | ai làm · xong thì thấy gì |
|---|---|---|
| V1 | `defsHatGiong()` — chân thứ ba của kiềng ba chân | THỰC THI · chỉ báo `2D –` → **`2D ✓`** trên cả hai hạt giống |
| V2 | `nac-xem-truoc.ts` + 4 test khoá ngưỡng | THỰC THI · ca 32 px **đỏ**, ca 168 px **xanh** |
| V3 | nối máy xem trước đã có vào kho vật liệu | THỰC THI · `tongImg+tongCanvas` từ **0** → ≥ số hàng |
| V4 | hiệu năng P1–P8 (cửa sổ hiển thị · hàng đợi ≤4 · nâng nấc lúc rảnh) | THỰC THI · 200 món ⇒ ≤30 lượt render, 0 long task >200 ms |
| V5 | ba nấc SCAN/JUDGE/INSPECT + đảo trọng số hàng về mẫu vật | THỰC THI · INSPECT thấy **mạch ván 1200 mm**, JUDGE thấy **vân** |
| V6 | bảng tác động 1/3 → **3/3** (nhảy tới · bỏ tick) | THỰC THI · bấm hàng thì vật sáng lên; bỏ tick thì số trên nút giảm ngay |
| V7 | **bật** cờ `.idfc` + chạy proof + đi A11 | THỰC THI · món `.idfc` thả xuống bản vẽ **có dòng BOQ** |
| V8 | 3D hết nút giả + đọc PBR thật | THỰC THI · sồi ↔ óc chó ở 3D **khác chất**, không chỉ khác màu |
| V9 | bảng A3 nhận vật liệu dự án + **MỞ FILE** B1/B2 bằng mắt | THỰC THI + AUDIT · có tên người mở và ngày |

Kèm hai việc **không phải mã**: chạy phép thử mắt **N1** (3 cỡ × 2 vật liệu × 3 người nghề) trước
khi coi ngưỡng 80/6,7 là bất biến; và **mở phiếu riêng** cho nghi vấn phạm vi dữ liệu (⑦b-1).

### ③ RỦI RO — của **chính chín việc trên**, kèm cách chặn

| rủi ro | vì sao có thật | cách chặn |
|---|---|---|
| 🔴 **V3+V4 tái hiện `AdPreviewGenerator` của Revit** (30 s, 100% CPU) — và đó đúng là ca xấu vừa đi bắt | 32→168 px là **27× diện tích**; repo **chưa có `IntersectionObserver` nào** (`grep`=0) ⇒ mặc định là render tất | **V4 đi liền V3, cấm tách đợt.** P1 là tiêu chí ĐẠT chứ không phải tối ưu sau. Giữ rig **singleton `globalThis`** (bài học tràn 16 WebGL context 04/08) |
| 🔴 **Đóng ngưỡng 80/6,7 rồi mới biết nó sai** ⇒ cả app bị nắn theo một con số suy luận | ⑦b-2: chưa ai thử bằng mắt người | Ngưỡng sống ở **hàm thuần + test**, **không** thành máy soi toàn repo. Sai thì sửa **một** hằng số. N1 chạy **trước** khi coi nó bất biến |
| 🔴 **V6 đẻ đường ghi vật liệu thứ hai** (áp một phần) ⇒ bảng-đếm ≠ việc-đã-ghi | `MaterialPalette.tsx:150` đã tự cảnh báo đúng bệnh này | **Bỏ tick CHỈ được lọc `entityIds`** truyền vào `replaceMaterialReferences`. Cổng **F7**: số hàm ghi specId không tăng |
| 🟠 **"Ba nấc" bị hiểu thành ba cỡ ảnh** ⇒ nấc to = ảnh phóng to = kéo dãn (lỗi Hoà đã bắt **hai lần**) | thang cỡ rất dễ đọc thành kéo dãn | Ngưỡng viết theo **`spanMm`** không theo px, và **test F4** ép `spanMm(inspect) ≥ 10 × spanMm(judge)` — hai nấc **không thể** là cùng một ảnh |
| 🟠 **V8 sửa `Scene3DViewer` làm vỡ khung nhìn 3D đang chạy** | đây là đường vẽ chính của cả chặng 3D | Đo **hết** các nơi dựng vật liệu 3D trước khi sửa (⑦b-6); giữ nhánh `colorHex` làm **đường lùi** khi không tra được PBR — **không** ném lỗi, không ô đen |
| 🟠 **V7 bật cờ nhưng hai đầu lệch** ⇒ gắn mà không đếm = món **mất khỏi BOQ như cũ**, tệ hơn vì cờ nói dối | `idfc-identity-flag.ts` docstring đã cảnh báo đúng ca này | Chạy proof **cả hai chiều**: bật ⇒ 1 bản chèn = **1** dòng · tắt ⇒ BOQ **y hệt hôm nay** |
| 🟠 **V1 làm hạt giống đè lên preset 2D người dùng đang dùng** | trộn thêm nguồn vào `defs` của `getMaterial` | Đi đúng luật nhường đã có: **dòng có mã thắng**, một chiều, hạt giống **chỉ-đọc**; test round-trip `.idf` cũ phải xanh |
| 🟡 **Ô mẫu to hơn ⇒ hàng cao lên ⇒ ít hàng/màn ⇒ mất "duyệt nhanh"** | 46 px/hàng lên ~96 px là **giảm hơn nửa** số hàng nhìn thấy | Đó đúng là việc của **nấc SCAN** (≥44 px, đủ nhận dạng) — nấc JUDGE **không** phải nấc mặc định của bảng. Không gian nghề *được phép dày*, nhưng phải **chọn nấc**, không phóng to tất |
| 🟡 **Nợ nền 185 tăng lên vì lát cắt này** | vùng chạm rộng (bảng · panel · 3D · present) | Cổng **F14**: `soi:foundation ≤ 185`. Chạm vùng nào thì **dọn nợ vùng đó nếu tiện**, không để tăng |

### ④ ĐẠT ĐƯỢC — đo được / nhìn thấy được

| đạt gì | biết bằng cách nào |
|---|---|
| **Kho vật liệu có pixel vật liệu** | `tongImg + tongCanvas`: **0 → ≥ số hàng** (đo DOM, cùng phép đo đã chạy 05/09) |
| **Không còn ô biểu tượng ảnh-hỏng** | số ô rơi về `ImageIcon`: **3/3 → 0** |
| **Kiềng ba chân đủ chân** | chỉ báo hai hạt giống: `2D – 3D ✓ Giá !` → **`2D ✓ 3D ✓ Giá !`** (mặt Giá **vẫn `!` là ĐÚNG** — hạt giống cố ý không chép giá) |
| **Ngưỡng thôi là ý kiến, thành khẳng định máy** | 4 test của `nac-xem-truoc`; ca **32 px hôm nay phải đỏ**, ca **168 px phải xanh** |
| **Ba nấc chứng minh được là ba công năng** | test F4: `spanMm(inspect) ≥ 10 × spanMm(judge)` với **mọi** vật liệu hạt giống — kéo dãn **không lọt qua được** |
| **Bảng tác động đọc được trọn** | (a)(b)(c): **1/3 → 3/3**, bấm được bằng **bàn phím** |
| **Lỗ chặn C18/L4 đóng bằng chứng cớ, không bằng lời** | `scripts/proof/idfc-identity-boq.mjs` xanh **cả hai chiều cờ** + một dòng `.idfc` thật trong BOQ trên app |
| **Hào thôi vô hình** | đi trọn **12 chặng §2** trên app thật với **đúng 2 vật liệu đang ship** — không dựng dữ liệu giả một lần nào |
| **Không tái hiện ca xấu của Revit** | 200 món ⇒ **≤30** lượt render lúc mở · **0** long task > 200 ms · **0** `WebGLRenderer` mới sinh thêm |
| **Cửa nghiệm thu còn trống được đóng** | có **tên người** và **ngày** đã mở BOQ `.xlsx` và bảng A3 PDF, chấm theo `CHUAN-DAU-RA-NGHE` §3 §4, và trả lời câu của bàn audit: *"tôi có dám giao hồ sơ này cho khách không"* |
| **Không đẻ máy móc mới** | 0 máy soi mới · 0 sổ mới · 0 chuẩn mới · `soi:foundation` **≤ 185** |

---

*Bàn CHUYÊN MÔN (B) lập 05/09/2026. Số trong tệp này đo tại nguồn (mã + DOM sống trên `:3277`),
không chép sổ; chỗ nào là suy luận đã ghi thẳng là suy luận. Không sửa mã sản phẩm trong lượt này.*

---

## §9 · SIẾT LẠI 05/09 — sau probe đường ống ảnh (chủ dự án chốt)

Probe `docs/delivery/PROBE-DUONG-ONG-ANH.md` đổi hai chỗ trong kế hoạch. Ghi vào đây chứ không
đẻ tệp mới — đây vẫn là **một** lát cắt, không phải một dự án thứ hai.

### 9.1 · V5 nhận thêm: nối 9 ảnh mồ côi — QUA HỢP ĐỒNG, không qua giao diện

`public/mau-vat-lieu/` có **9 ảnh vật liệu thật**, gồm đúng hai món đang ship
(`go-soi-trang.png` · `go-oc-cho.png`). `grep -rn "mau-vat-lieu" lib/ components/ app/ prisma/`
= **0 dòng** ⇒ chưa ai trỏ tới. Vân không hiện **không phải** vì quả cầu che, mà vì **chưa có
ảnh nào đi vào hệ**.

| ⛔ cấm | ✅ đúng |
|---|---|
| `<img src="/mau-vat-lieu/…">` trong component | `baseColorMapUrl` khai ở tầng hạt giống / `MaterialPbr` |
| hằng số đường dẫn ảnh nằm trong giao diện | ảnh vào hệ đúng **một cửa**, giao diện chỉ **đọc** |
| vẽ vân bằng CSS | ảnh thật, `uvScaleMm` thật |
| cho 3D một cách biểu diễn vật liệu **thứ hai** | Kho · Xem trước · 3D cùng đọc **một** `MaterialPbr` |

**Mặt 2D GIỮ NGUYÊN là hatch VECTOR.** Chủ dự án nói rõ: *cùng một sự thật vật liệu KHÔNG đòi
hỏi cùng một cách biểu diễn ở 2D và 3D.* Bản vẽ kỹ thuật dùng **ký hiệu**, không dùng ảnh raster.
Cái chung giữa hai chặng là **`matId`**, không phải pixel.

### 9.2 · V8 nhận thêm ba ràng buộc

1. **Đi qua máy dựng ĐÃ CÓ** — `lib/three/pbr-three.ts` (`buildPbrMaterial` · `loadPbrTextures`).
   Nó đã đúng: 7 map · `uvScaleMm → repeat` · colorSpace tách sRGB/linear · `RepeatWrapping`.
   Việc của V8 là **cho scene đi qua nó**, không phải viết lại nó.
2. **Giữ cache / dùng lại / giải phóng texture** như `pbr-three.ts` đang làm.
   ⛔ **Cấm mỗi mesh một `TextureLoader` riêng.** Một cảnh có 200 khối cùng vật liệu phải dùng
   **một** texture, không phải 200 lượt tải — đây đúng là ca `AdPreviewGenerator` của Revit ở
   quy mô scene.
3. **Cầu 2D→3D phải mang `matId`/`specId` xuống tới `Scene3DViewer`**, thay vì bóp thành một
   `colorHex` ở `lib/three/cad-to-obj.ts:361`. Sửa **ranh giới**, không vá từng vật liệu.

### 9.3 · HAI PHÉP NGHIỆM THU TÁCH BẠCH — một phép KHÔNG thay được phép kia

| | đo cái gì | dùng ảnh nào |
|---|---|---|
| **ĐÚNG** | hướng · tỉ lệ vật lý UV · các map → lưu → **thoát hẳn** → mở lại → **y hệt** | ảnh chẩn đoán `public/textures/chan-doan/` (1 chu kỳ = **400×400 mm**) |
| **DÙNG ĐƯỢC** | KTS **phán được** thớ · **chiều vân** · **cỡ vân** ở nấc JUDGE và ở 3D | gỗ sồi + gỗ óc chó thật |

Ảnh chẩn đoán chứng minh **máy không nói dối**. Ảnh gỗ chứng minh **người dùng được việc**.
⇒ Ô cờ đúng hướng mà vân gỗ vẫn không phán được thì **CHƯA XONG**. Và ngược lại: vân gỗ trông
đẹp mà ô cờ lật/sai tỉ lệ thì cũng **CHƯA XONG** — chỉ là hỏng ở chỗ mắt không bắt được.

### 9.4 · Nền / Wallgallery — **NOT IMPLEMENTED**, cấm gấp vào lát cắt vật liệu

`lib/wallpaper/css.ts` là `linear-gradient`; `SystemWallpaper.tsx` có **0** `<img>`. Khai thẳng
là chưa làm. ⛔ Không lấy gradient CSS gọi là PASS, và không mượn công việc vật liệu để làm nó.
