# NC · Đ2 + Đ3 — VẬT LIỆU BA MẶT & CỬA CHỌN LÚC ĐANG LÀM

> **Bàn NGHIÊN CỨU (A) · 05/09/2026 · nhánh `nen-checkpoint`.**
> Đề do bàn CHUYÊN MÔN (B) giao: `docs/delivery/HUONG-DUNG-LAI-GIAO-DIEN.md` dòng 148 (Đ2) · 149 (Đ3).
> Bàn này **không vẽ màn, không sửa mã**. Đầu ra là: ca global đã đào · cái bê được / **không** bê
> được · **ngưỡng đo được** · và chỗ bác lại đề.
>
> **Ba kết luận đắt nhất, đọc trước rồi mới đọc bảng:**
> 1. 🔴 **Revit KHÔNG phải "có 2 mặt, thiếu mặt tiền" — nó có ĐỦ BA MẶT, đúng ba mặt của IF.**
>    Graphics = hatch 2D · Appearance = PBR · Identity = Cost/Manufacturer/Keynote → Material Takeoff.
>    ⇒ Hào của IF **không phải** "có ba mặt". Prior art đã có ba mặt và vẫn bị dân nghề ghét.
>    Hào thật nằm ở **chỗ nối ba mặt** và ở **con số có dám ký không**.
> 2. 🔴 **Figma KHÔNG có "Where used" native cho component.** Chỉ có `Go to main component`
>    (đi NGƯỢC, instance→main) và **Library Analytics** (báo cáo tổng hợp 30 ngày, cấp
>    Organization/Enterprise). Liệt kê từng instance là **plugin cộng đồng**.
>    ⇒ Ca so sánh đúng cho `MaterialImpactPreview` **không phải Figma** mà là
>    **Refactoring Preview của IDE** (IntelliJ) — và ca đó có một cơ chế IF đang thiếu: **bỏ tick
>    từng chỗ trước khi áp**.
> 3. ⭐ **Ngưỡng "168px" của chốt 07/08 đúng, nhưng ĐO THIẾU MỘT VẾ.** Cỡ px một mình không quyết
>    được gì: 168px trải trên 3000mm tường thì vẫn không phân biệt được sồi với óc chó. Ngưỡng
>    đúng là **cặp (px, khoảng mm thật)** — và IF **đã lưu sẵn vế thứ hai** (`MaterialPbr.uvScaleMm`),
>    nên đây là ngưỡng **máy tự tính được cho từng vật liệu**, không phải con số gõ tay.

---

## 0 · ĐÃ CÓ — KHÔNG NGHIÊN CỨU LẠI

[Đ2 · `TRIET-LY-IF.md:72` nhìn-vào-trong-trước]. Đo tại nguồn 05/09, không chép sổ.

| Thứ | Ở đâu | Trạng thái đo được |
|---|---|---|
| **Hàm đọc ba mảnh** | `lib/materials/resolve.ts::getMaterial` | **ĐÃ CẮM ĐIỆN** — 2 nơi gọi thật (`MaterialsScreen.tsx:145` · `app/files/_lib/ngan-tho.ts:149`). Hai namespace tách bạch (`uuid` ↔ `legacy-sku`), không giả sku thành UUID |
| **Đọc ra CHỮ ba mặt** | `lib/materials/ba-mat.ts` | **BA trạng thái** `du · chuaDu · chuaCo` — có sẵn chỗ nói *thiếu gì* + *lối ra*. Không mảnh nào rơi về mặc định |
| **Xếp chồng ba tầng** | `lib/materials/tang-phan-giai.ts` | hạt giống → studio → dự án, **ghi đè theo VẬT không theo TRƯỜNG**, một chiều, trả cả `tang` thắng |
| **Xem trước tác động** | `lib/materials/impact.ts` + `components/materials/MaterialImpactPreview.tsx` | 6 nơi tiêu thụ, **con số thật**, Trình bày cố ý **không bịa số** |
| **Cửa chọn lúc đang vẽ** | `components/cad/MaterialPalette.tsx` | tách ①kho (mang **danh tính** `specId`) ↔ ②preset thị giác (**cố ý không** tự gán mã) |
| **Schema PBR** | `lib/materials/schema.ts` | chuẩn glTF metal/rough · `uvScaleMm` · cờ `suyDoan` · `typeId` · guard drift 2 chiều |
| **11 loại vật liệu + 6 kiểu quả cầu** | `lib/materials/material-edit.ts:50` `MATERIAL_TYPES` | mỗi loại có `roughnessInit` + `previewKind` (`metal·stone·wood·fabric·glass·paint`) |
| **Chốt quả cầu + cảnh xem trước + nấc phân giải** | `docs/SPEC-VAT-LIEU-PBR-IF.md` §2, §3b | đã tra doc Chaos/D5/Adobe, có bảng dịch V-Ray từng công tắc |
| **Chốt 3 nấc thẻ 122/168/232** | `docs/00-CHOT.md:545-548` | mặc định **Vừa 168px**; 141px được phán *"không đủ phân biệt vân sồi với óc chó"* |
| **Luật cứng** | `00-CHOT` 07/08 + 15/08 | vật liệu **TRỎ TỚI** thương mại, **không chép giá** · **BOQ chỉ nhận số ĐO ĐƯỢC** |
| **NT-15** | `NC-NGUYEN-TAC-GIAO-DIEN-TOAN-APP-2026-08-14.md:126` | *quả cầu + macro texture; spec 4 phần bìa-thông số-chi tiết-ứng dụng* |

**⇒ Không nghiên cứu lại:** chuẩn PBR nào để lưu · bảng dịch V-Ray · vì sao quả cầu chứ không ô
phẳng · vì sao tách giá khỏi texture · ba tầng phân giải. **Tất cả đã chốt và đã có mã.**

### Hiện trạng ĐO ĐƯỢC — chỗ hỏng nằm ở HÌNH THỨC, không ở lõi

| Đo | Số | Nguồn |
|---|---|---|
| Ô ảnh vật liệu ở `/materials` | **32 × 32 px**, bo 6 | `MaterialTable.tsx:72` |
| Ảnh hỏng thì thay bằng | biểu tượng **14 px** | `:77` |
| Chiều cao hàng | **46 px** | `:70` |
| Ô mẫu ở cửa chọn `MaterialPalette` | **≈154 × 115 px** (panel 360 − đệm 16 − 4, 2 cột gap 8, đệm ô 5, viền 1) | `:175` `:303` `:327` `:406` |
| Ô xem trước khi rê chuột | **152 px** | `:421` |
| Chấm màu ở danh sách kho | **22 × 22 px** | `:260` |
| Vật liệu ship theo bản cài | **2** — *Gỗ sồi tự nhiên* · *Gỗ óc chó* | `lib/materials/hat-giong.ts:83,105` |
| Preset thị giác 2D | 13, trong đó **0 preset khai `matId`** | `lib/cad/materials.ts:61` (tự khai) |

> ⭐ Chú ý cái trùng hợp: hai vật liệu duy nhất ship theo sản phẩm **chính là cặp sồi ↔ óc chó** —
> đúng cặp mà chốt 07/08 lấy làm thước. Nghĩa là ca kiểm ngưỡng **có sẵn dữ liệu thật để chạy**,
> không phải dựng giả.

---

## 1 · Đ2 · VẬT LIỆU BA MẶT — ca global

### 1.1 · Bảng chính

| ca global | cơ chế | điều kiện để nó đứng được | **bê được sang IF** | ⭐ **KHÔNG bê được vì** | ngưỡng đo | nguồn |
|---|---|---|---|---|---|---|
| **Revit Material Browser** *(ca XẤU của ngành — và là ca DUY NHẤT có đủ ba mặt)* | Một dialog, trái = danh sách vật liệu của dự án, phải = **Material Editor** với 5 tab: **Identity** (Keynote · Manufacturer · Model · URL · **Cost** · Mark) · **Graphics** (Surface Pattern + Cut Pattern = hatch) · **Appearance** (render) · Physical · Thermal. Identity chảy thẳng vào **Material Takeoff schedule** | ① Dữ liệu vật liệu là **một bản ghi trong tệp dự án**, không phải ba tệp rời ② có **schedule engine** để mặt tiền có nơi đổ về ③ chấp nhận **dialog chặn**: người dùng ra khỏi việc để vào quản vật liệu | ⭐ **Mô hình dữ liệu**: một vật liệu = nhiều **asset** khác ngành, mỗi asset thay được độc lập. IF đã cùng hình dạng (`pbr`/`flat`/`commercial`). Xác nhận IF **không sai đường**, chỉ sai hình thức · **Nút "replace asset"** (đổi một mặt mà giữ danh tính) là cơ chế IF nên có ở tầng `tang-phan-giai` | ① **Dialog CHẶN** — bê nguyên là giết đúng thứ Đ3 tồn tại để giải ② **Thumbnail sinh đồng loạt lúc mở** ⇒ `AdPreviewGenerator` ăn 100% CPU, mở 30 giây, nhiều đời không chữa được ⇒ **IF không được render quả cầu theo hàng lúc mở danh sách** ③ Ba mặt nằm **ba tab chồng nhau** ⇒ nhìn một mặt là mù hai mặt kia; IF đã đi khác (cột *Ba mặt* hiện cả ba cùng lúc) — **giữ, đừng đổi sang tab** ④ Cost là **một con số trần**, không đơn vị, không nguồn, không ngày ⇒ đúng thứ luật *BOQ chỉ nhận số đo được* cấm | mở danh sách **N mục** thì số quả cầu render đồng bộ phải = **0**; ảnh chỉ sinh khi ô vào khung nhìn, và có cache theo `hash(params)` | [About the Material Browser](https://help.autodesk.com/cloudhelp/2023/ENU/Revit-Customize/files/GUID-0AA0E65D-55A4-4391-AA29-C53C06C048F4.htm) · [Change the Identity Data of a Material](https://help.autodesk.com/cloudhelp/2018/ENU/Revit-Customize/files/GUID-7EA4E8B7-C0FD-4056-AFEF-E922EDED4E74.htm) · [Change the Graphics Properties](https://help.autodesk.com/cloudhelp/2019/ENU/Revit-Customize/files/GUID-5DFA9F47-B6FF-4D79-A240-FA27BEA7C7AB.htm) · [Create a Material Takeoff Schedule](https://help.autodesk.com/cloudhelp/2025/ENU/Revit-DocumentPresent/files/GUID-9165A53A-C6B8-48EB-8F22-38DFDCD6496B.htm) · [Slow performance refreshing material thumbnails](https://www.autodesk.com/support/technical/article/caas/sfdcarticles/sfdcarticles/Slow-performance-when-refreshing-material-thumbnails-in-Revit.html) |
| **Substance 3D Assets / Designer** | Vật liệu là **hàm tham số** (`.sbsar`), không phải bộ ảnh chết. Tác giả **"expose" (phơi)** một nhúm tham số ra ngoài; người dùng cuối chỉ thấy nhúm đó (age · wear · color · roughness). Thư viện ~13.000 material, lọc bằng **Filter boolean + attribute của graph** | ① Có **engine sinh texture** chạy tại chỗ ② Có **tác giả vật liệu** tách khỏi **người dùng vật liệu** ③ Người dùng là hoạ sĩ 3D, chấp nhận học tham số | ⭐⭐ **"Phơi tham số theo LOẠI" là lời giải sạch nhất cho câu Đ3 *cái gì hiện, cái gì để dành*** — và **IF đã có phôi**: `MATERIAL_TYPES` 11 loại, mỗi loại có `roughnessInit` + `previewKind`. Chỉ cần loại **cũng khai luôn tập trường hiện ra**, đúng câu SPEC §3 đã chốt (*"đổi template = đổi bộ trường hiện"*) ⇒ **EXTEND, không NEW** · Lọc bằng **thuộc tính có sẵn**, không đẻ hệ tag thứ hai | ① Substance **không có mặt thương mại và không có mặt 2D** ⇒ mọi bố cục của nó chỉ giải bài *một mặt* ② Vật liệu của nó **sinh ra được**; vật liệu của IF **mua được** — thứ IF phải bày là *cái này lấy ở đâu, bao nhiêu tiền*, Substance không có ô đó ③ Người dùng IF là **KTS nội thất**, không phải hoạ sĩ texture ⇒ ~40 núm là sai đối tượng (SPEC đã chốt theo D5 ~8 núm) | mỗi `typeId` khai **≤ 8 trường** hiện mặc định; số trường hiện ra phải **đổi theo `typeId`**, kiểm bằng test: `MATERIAL_TYPES.every(t => truongHien(t.id).length <= 8)` | [Parametric materials on Substance 3D Assets](https://www.adobe.com/products/substance3d/magazine/parametric-materials-on-substance-3d-assets.html) · [Exposing a parameter](https://helpx.adobe.com/substance-3d-designer/substance-compositing-graphs/exposing-a-parameter.html) · [Managing custom content and filters](https://helpx.adobe.com/substance-3d-designer/interface/the-library/managing-custom-content-and-filters.html) |
| **D5 Render — Asset Library** | Nút *Assets* trên thanh trên mở **ngăn kéo** ~2.000 vật liệu. Áp bằng **kéo-thả thẳng lên mặt vật**, hoặc double-click tải về rồi click để áp. Áp xong chỉnh tại chỗ: color · pattern size · roughness · round corner · emissive | ① Vật đích là **mặt 3D lớn trên viewport** — kéo-thả có chỗ mà rơi ② Vật liệu **không mang hệ quả tiền bạc** ⇒ áp sai chỉ tốn một lần undo ③ Toàn màn hình, không phải Electron 1440 | **Ngăn kéo mở từ thanh trên, đóng lại là mất hẳn** (không chiếm chỗ thường trực) · **chỉnh tại chỗ ngay sau khi áp** — đúng nhịp *đổi rồi thấy ngay* của Đ3 · **`uvScaleMm`/pattern size là núm HẠNG NHẤT**, không chôn trong panel con | ① **Kéo-thả**: đo được là **chậm hơn và sai nhiều hơn** bấm-chọn, và **ô đích càng nhỏ thì kéo-thả càng tệ trong khi bấm-chọn càng tốt** ⇒ với hatch 2D nhỏ trên bản vẽ 1:50, kéo-thả là **sai cơ chế** ② D5 áp là **áp luôn**; IF đổi vật liệu là **đụng BOQ** ⇒ cửa xác nhận của IF **không phải chỗ để tối ưu bớt bấm** | tỉ lệ áp-nhầm khi ô đích < 44 px: phải đo bằng ca thật, **không được lấy số của D5 làm chuẩn** · bấm-chọn là **đường mặc định**, kéo-thả (nếu có) là đường **phụ** | [Material · D5 User Manual](https://docs.d5render.com/getting-started/d5-workflow/material) · [D5 Asset Library](https://www.d5render.com/posts/d5-asset-library-for-rapid-high-quality-scene-building) · MacKenzie/Sellen/Buxton 1991 (dưới) |
| **Enscape Material Library + Editor** | Thư viện PBR làm sẵn; **import vào Material Editor** rồi mới dùng. Đổi vật liệu có sẵn: **ba chấm bên cạnh → "Replace with Enscape Material"** → mở thư viện chọn cái thay | ① Enscape sống **ký sinh trên CAD chủ** (Revit/SketchUp) ⇒ nó cố ý **không** đụng mặt 2D/thương mại, phần đó là của app chủ ② Danh sách vật liệu là **của mô hình**, không phải của thế giới | ⭐ **"Thay bằng…" đứng ngay trên MỤC ĐANG DÙNG, không phải ở kho** — đây là đúng lối nghề: KTS xuất phát từ *"mảng tường này"*, không từ *"kho có gì"*. IF nên có cùng lối vào từ vật đang chọn · **Editor mở được kể cả khi engine không chạy** ⇒ sửa vật liệu **không đòi có scene 3D** | ① Nó **không phải nguồn sự thật** — nó là lớp phủ lên nguồn của app khác. IF **là** nguồn ⇒ IF không được phép có hai bản vật liệu "bên trong / bên ngoài" ② Không mặt tiền, không hatch ⇒ bố cục 2 cột của nó không cõng nổi ba mặt | mọi đường đổi vật liệu đều phải đi qua **cùng một hàm ghi** — IF đã đúng (`replaceMaterialReferences`, `MaterialPalette.tsx:150` tự khai). Cổng: `grep` số hàm ghi vật liệu = **1** | [Material Library — Enscape](https://documentation.chaos.com/space/ENSCAPE/841220107/Material+Library) · [Managing Custom Materials](https://blog.chaos.com/managing-custom-materials) · [How to Replace Materials in Enscape](https://blog.chaos.com/how-to-replace-materials-in-enscape) |
| **Figma — component + Library Analytics** *(ca đề bài nêu; ⚠️ đề bài mô tả sai, xem §3)* | Native: `Go to main component` (instance → main, **đi ngược**), `Swap instance`, `Detach`. **Không** có lệnh native liệt kê mọi instance. **Library Analytics**: báo cáo tổng hợp 30 ngày (inserts · detaches · file nào dùng), cấp Organization/Enterprise, có REST API | ① Quan hệ **một chiều, cùng loại** (main → instance) ② "Where used" là **báo cáo quản trị hệ thiết kế**, không phải bước trong lúc làm việc | **Tách hai câu hỏi**: *"đổi cái này thì ảnh hưởng ai"* (lúc làm — phải tức thì) ≠ *"vật liệu nào của studio đang được dùng nhiều"* (báo cáo — chạy nền, 30 ngày). IF đang gộp; nên tách như Figma đã tách | ⭐ **Không bê được vì nó KHÔNG TỒN TẠI như đề bài mô tả.** Instance-level "find all" ở Figma là **plugin cộng đồng**. Lấy Figma làm mốc cho `MaterialImpactPreview` là lấy mốc thấp hơn thứ IF đã có ⇒ **đổi ca đối chiếu sang Refactoring Preview** | — | [Create and insert component instances](https://help.figma.com/hc/en-us/articles/360039150173-Create-and-insert-component-instances) · [View and explore library analytics](https://help.figma.com/hc/en-us/articles/360039238353-View-and-explore-library-analytics) · [Instance Finder (plugin)](https://www.figma.com/community/plugin/741895659787979282/instance-finder) · [Forum: show where a component is used](https://forum.figma.com/suggest-a-feature-11/show-where-a-component-is-being-used-51009) |
| ⭐ **IntelliJ IDEA — Refactoring Preview** *(ca A thay vào chỗ Figma)* | Đổi tên một ký hiệu → **Preview** → mở cửa sổ *Find* liệt kê **mọi nơi dùng, gom theo tệp**, có số đếm. Người dùng **bỏ tick từng chỗ không muốn đổi**, rồi mới *Do Refactor* | ① Có **chỉ mục toàn dự án** đọc được tức thì ② Thao tác **phá huỷ, xuyên nhiều nơi, người dùng không nhớ hết** — đúng hình dạng ca đổi vật liệu của IF ③ Có undo | ⭐⭐⭐ **BA thứ, và IF mới có một:** ⓐ **đếm theo nhóm** — IF **ĐÃ CÓ** (6 nơi tiêu thụ, số thật) ⓑ **nhảy tới chỗ dùng** — IF **CHƯA CÓ** ⓒ **bỏ tick từng chỗ trước khi áp** — IF **CHƯA CÓ**, và đây là thứ biến bảng-tác-động từ *thông báo* thành *công cụ*. Hiện IF chỉ có hai nút toàn-hoặc-không (`Áp dụng` ↔ `Áp toàn dự án`) | ① IDE gom theo **tệp**; IF phải gom theo **nơi tiêu thụ** (2D · 3D · BOQ · mặt đứng · bảng vật liệu · hồ sơ) — cùng cơ chế, khác trục ② IDE đổi tên là **không mất tiền**; IF đổi vật liệu **đổi dòng tiền** ⇒ cửa xác nhận của IF phải **nặng hơn**, không nhẹ hơn | bảng tác động **đọc được** khi mỗi hàng đủ ba việc: **(a) có số** · **(b) bấm được để tới chỗ đó** · **(c) bỏ tick được**. Đo: IF hiện **1/3** | [Rename refactorings](https://www.jetbrains.com/help/idea/rename-refactorings.html) · [Code refactoring](https://www.jetbrains.com/help/idea/refactoring-source-code.html) |
| ⭐ **Fohlio / phần mềm FF&E spec** *(ca A thêm — đây mới là nơi "mặt tiền" sống thật)* | Một thư viện sản phẩm tập trung: **spec · giá · nhà cung cấp · duyệt** trong một bản ghi. **Web clipper** kẹp thông tin thẳng từ trang nhà sản xuất. Nhập XLS/CSV/TSV/XML/JSON/PDF. Xuất **báo cáo tuỳ biến cho từng loại hồ sơ giao** | ① Chấp nhận **không có mặt 3D và không có mặt 2D** — nó là công cụ *đặc tả & mua hàng*, không phải công cụ vẽ ② Dữ liệu tới từ **nhà cung cấp**, không tự sinh | ⭐ **Web clipper** = đường nạp rẻ nhất cho mặt thương mại, đúng chỗ IF đang trống (kho hạt giống mới **2 mục**) · **"Specify once, iterate forever"**: một bản ghi, nhiều báo cáo — trùng khít luật *một nguồn nhiều mặt tiền* `[T2]` · Bảng trường của họ là **danh sách kiểm** cho mặt ③ của IF | ① Họ **không phải chịu** cảnh cùng một bản ghi vừa ra hatch vừa ra PBR ⇒ họ được phép để mặt tiền là **bảng**, IF thì không (bảng chính là lỗi đang đo được ở `/materials`) ② Không có luật *BOQ chỉ nhận số đo được* — họ nhập tay thoải mái | mặt ③ của IF phải phân biệt được **giá kho chung** ↔ **giá chốt dự án** (`boq-overrides`). Đo: mọi con số tiền hiện ra phải trả lời được *"ở đâu ra"* — 0 con số không nguồn | [Fohlio — FF&E Specification Software](https://www.fohlio.com/ga/fohlio-ff-e-specification-software) · [Centralized product & materials management](https://www.fohlio.com/products/products-product-and-materials) |

### 1.2 · Vì sao Revit bị chê — học ca xấu, rẻ hơn học ca tốt

Đây là câu hỏi số 5 của đề. Bốn lỗi, **ba trong bốn IF đang lặp lại**:

| # | Lỗi của Revit | Bằng chứng | IF đang lặp? |
|---|---|---|---|
| 1 | **Sinh thumbnail đồng loạt lúc mở** ⇒ `AdPreviewGenerator` 100% CPU, mở 30 giây, sống qua nhiều đời sản phẩm | Autodesk tự ra bài *"Slow performance when refreshing material thumbnails"* và *"Material browser is slow to open or freezes"* | **CHƯA** — nhưng **sắp**, nếu dựng quả cầu theo hàng. SPEC §2 đã chặn sẵn (cache PNG theo hash + nấc 100/50/25%) ⇒ **phải thi hành, không được bỏ** |
| 2 | **Ba mặt nằm ba tab chồng nhau** ⇒ đứng ở tab này thì mù hai mặt kia | 5 tab Identity/Graphics/Appearance/Physical/Thermal | **KHÔNG** — IF hiện cả ba cùng lúc ở cột *Ba mặt*. ⭐ **Đây là chỗ IF đang hơn Revit. Giữ.** |
| 3 | **Dialog chặn** — phải rời việc để vào quản vật liệu | dialog modal | **CÓ, một nửa** — `/materials` là **một route riêng**. Đúng thứ Đ3 phải chữa |
| 4 | **Nhân vật chính là DANH SÁCH CHỮ, mẫu vật là ô nhỏ bên cạnh** | bố cục trái-danh-sách / phải-editor | 🔴 **CÓ, nặng hơn Revit** — ô mẫu của IF là **32 px**, và khi thiếu ảnh thì thành **biểu tượng ảnh-hỏng 14 px** (`MaterialTable.tsx:72,77`; thấy trên `05-vat-lieu.png`) |

> ⭐ **Câu rút ra, đắt nhất của cả Đ2:** Revit **đã có đủ ba mặt từ lâu** và vẫn là ca xấu của ngành.
> ⇒ **Có ba mặt không phải là hào.** Hào là: ba mặt **nhìn thấy cùng lúc** · mẫu vật **đủ to để phán**
> · đổi một mặt thì **thấy trước hệ quả rồi mới ghi** · và **con số dám ký tên**.
> Đúng ba thứ đó IF đã có mã. Chỉ thiếu **hình thức** — và một cửa duyệt còn thiếu tick.

---

## 2 · Đ3 · CỬA CHỌN VẬT LIỆU LÚC ĐANG LÀM

### 2.1 · Bảng chính

| ca global | cơ chế | điều kiện để nó đứng được | **bê được sang IF** | ⭐ **KHÔNG bê được vì** | ngưỡng đo | nguồn |
|---|---|---|---|---|---|---|
| **Photoshop — Swatches** | Panel thường trực. Áp = **chọn layer rồi bấm swatch**, hoặc **kéo swatch thả xuống canvas**. Nhóm bằng **folder** (RGB/CMYK/Pastels…). Menu panel đổi cỡ: **Tiny · Small · Large Thumbnail**, và **Small List · Large List** (list = thumbnail **+ TÊN**) | ⭐ **Swatch là MÀU PHẲNG** — một màu nhận ra được ở 12 px vì nó không có cấu trúc bên trong | ⭐⭐ **Ba nấc cỡ + hai nấc "có tên / không tên" là cơ chế đã chạy 20 năm** — trùng khít luật *ba nấc = ba công năng* của IF, và **hợp thức hoá chốt 122/168/232** · **Nhóm bằng folder do người dùng tự đặt** — kho của KTS là *"bộ vật liệu dự án Thảo Điền"*, không phải taxonomy của app | 🔴 **Đây là chỗ chép mù sẽ chết**: vật liệu **KHÔNG PHẢI màu phẳng**. Cái làm swatch nhỏ vẫn dùng được (không có cấu trúc bên trong) đúng là **cái vật liệu không có**. ⇒ **cấm lấy cỡ Tiny/Small của Photoshop làm cỡ cho vật liệu** — lấy *cơ chế ba nấc*, **không** lấy *con số* | nấc nhỏ nhất của IF **không được nhỏ hơn ngưỡng ở §4** — vì nấc nhỏ nhất của Photoshop hợp lệ với màu mà **không** hợp lệ với vân | [Use the Color and Swatches panels](https://helpx.adobe.com/photoshop/using/choosing-colors-color-swatches-panels.html) |
| **Blender — Material Slots** | Danh sách **slot gắn vào object** (không phải vào thế giới). Vào **Edit Mode → chọn mặt → chọn slot → nút `Assign`** (kèm `Select`/`Deselect`). Muốn vật liệu mới thì thêm slot rồi **Browse** trong danh sách vật liệu đã có | ① Người dùng chấp nhận **đổi chế độ** (Object ↔ Edit) ② Danh sách chọn lúc làm việc **ngắn** — vài slot của đúng vật đó | ⭐⭐ **Phạm vi danh sách hẹp lại theo vật đang chọn.** Đây là lời giải mạnh nhất cho *"kho 2.000 món nhưng lúc làm chỉ cần 5"*: cửa chọn mở ra thì **món của dự án này lên trước**, kho lớn là **bước thứ hai**. IF đã có phôi: `loadMaterialPicks` (kho) tách khỏi `MATERIALS` (preset) · **`Select`/`Deselect`** = *cho tôi xem chỗ nào đang dùng cái này* — cùng họ với "nhảy tới chỗ dùng" ở Đ2 | ① **Đổi chế độ (Edit Mode) là chi phí học lớn** và IF đã có luật *`Esc` luôn huỷ · `Space` lặp lệnh* — không đẻ mode thứ ba ② Slot là **của object**; vật liệu của IF là **của dự án** và phải truy về kho ⇒ không bê mô hình sở hữu ③ Blender **không có mặt tiền, không có mặt 2D** | số món ở nấc "đang làm" phải **≤ số ô lọt màn không cuộn** — xem §4.3 | [Assignment — Blender Manual](https://docs.blender.org/manual/en/latest/render/materials/assignment.html) |
| **D5 — asset drawer** | (đã tả ở §1.1) kéo-thả thẳng lên mặt vật, chỉnh ngay sau khi áp | vật đích to, áp sai không mất tiền | ngăn kéo **gọi ra rồi biến mất**; **chỉnh ngay tại chỗ sau khi áp** | 🔴 **kéo-thả sai cơ chế cho hatch 2D** — xem số ở §2.2 | tỉ lệ nhầm khi ô đích < 44 px | như trên |
| **Figma — fill picker** | Bấm ô màu trong panel phải → picker nổi ngay cạnh, đổi là **thấy tức thì trên canvas** | thay đổi **rẻ và lùi được ngay** | **Đổi là thấy ngay trên canvas, không qua hộp thoại** — đúng nhịp Đ3 mong muốn | thay đổi ở Figma **không có hệ quả tiền**; IF thì có ⇒ **không được bỏ cửa xác nhận** để chạy theo nhịp này | thấy kết quả trên canvas **≤ 100 ms** sau khi chọn (ngưỡng "tức thì" của Nielsen) | [Progressive Disclosure — NN/g](https://www.nngroup.com/articles/progressive-disclosure/) (cho luật ẩn/hiện) |

### 2.2 · Trả lời thẳng câu ⓒ của đề — **kéo-thả hay bấm-chọn khi vật đích nhỏ?**

**BẤM-CHỌN. Có số, không phải ý kiến.**

- MacKenzie, Sellen & Buxton (CHI '91) đo *pointing* vs *dragging*: **thời gian di chuyển ngắn hơn
  và tỉ lệ lỗi thấp hơn khi pointing**; chỉ số hiệu năng **4,2 bits/s (pointing) vs 3,0 bits/s
  (dragging)** — **kém 29%**.
- Quinn/Inkpen (ACM TOCHI 2001) đo tiếp và ra chiều ngược nhau theo cỡ đích: **cỡ đích nhỏ làm
  pointing tệ đi ÍT, làm dragging tệ đi NHIỀU** (chậm hơn *và* sai nhiều hơn).

⇒ Với IF: mảng hatch trên bản vẽ 1:50 là **đích nhỏ**. **Kéo-thả kiểu D5 là chép sai điều kiện** —
D5 thả lên mặt 3D chiếm nửa viewport, IF thả lên một mảng vài chục px. Mặc định phải là
**chọn vật → bấm mẫu**. Kéo-thả nếu có thì là đường **phụ**, và chỉ ở 3D nơi đích to.

**Nguồn:** [MacKenzie, Sellen & Buxton — A Comparison of Input Devices in Elemental Pointing and Dragging Tasks, CHI '91](https://www.billbuxton.com/fitts91.html) · [Drag-and-drop versus point-and-click mouse interaction styles, ACM TOCHI](https://dl.acm.org/doi/abs/10.1145/371127.371146)

### 2.3 · Trả lời thẳng câu ⓓ — **có ca nào cho xem trước hệ quả TÀI CHÍNH ngay lúc chọn không?**

**KHÔNG. Không app nào trong năm ca được nêu, và tôi không tìm được ca nào khác.**
Gần nhất là hai nửa rời:
- Revit: đổi vật liệu **rồi** mở lại Material Takeoff schedule mà xem — **sau, không phải trước**.
- Fohlio: có tiền, nhưng **không có canvas để "lúc đang làm"**.

⇒ **Đây là chỗ IF không có ai để chép, và cũng là chỗ IF đang đi trước**: `MaterialImpactPreview`
trình con số **TRƯỚC** khi ghi. Ghi rõ để bàn B không đi tìm mốc bên ngoài nữa — **không có mốc**.
Việc còn lại là **hoàn thiện cửa đã có** (thêm (b) nhảy tới, (c) bỏ tick), không phải đi học ai.

⚠️ **Ràng buộc không được phá:** hàng *BOQ / dự toán* trong bảng tác động **chỉ được hiện số đếm
tham chiếu**, **không được hiện tiền chênh lệch**, chừng nào con số chưa đến từ khối lượng đo được
(luật 15/08). Hiện "±12.400.000 đ" ở đó là **bịa** — và là loại bịa đắt nhất trong cả sản phẩm.

### 2.4 · Trả lời thẳng câu chính — **cái gì hiện ngay, cái gì để dành**

Luật nền có nguồn: **Progressive disclosure** — *"initially, show users only a few of the most
important options; offer a larger set of specialized options upon request"* (Nielsen, NN/g 2006).
Ba ca trên cho ba **cách chia** khác nhau; ghép lại ra **trục chia đúng cho IF**:

| chia theo | ai làm thế | hợp với IF? |
|---|---|---|
| **tần suất dùng** (hay dùng ↔ ít dùng) | Photoshop | một phần |
| **LOẠI vật liệu** (gỗ mở núm khác kính) | Substance *exposed parameters* · D5 template | ⭐ **ĐÚNG NHẤT** — và IF **đã có** `MATERIAL_TYPES` 11 loại + `previewKind` |
| **phạm vi vật đang chọn** | Blender slots | ⭐ đúng cho **danh sách món**, không cho **danh sách núm** |

⇒ **IF chia hai trục, không một trục:**
- **món nào hiện** → theo **phạm vi** (món của dự án này trước, kho lớn là bước hai) — Blender.
- **núm nào hiện** → theo **`typeId`** (gỗ hiện vân + bước lặp; kính hiện IOR + độ trong) — Substance/D5.
- **mặt nào hiện** → **cả ba mặt luôn hiện ở dạng CHỈ BÁO**, mặt tiền chỉ mở rộng khi hỏi.
  Đây là chỗ **không** được progressive-disclose: giấu mặt tiền đi chính là quay về Revit-tab.
  IF đã đúng (`ChiBaoBaMat`) — **giữ**.

---

## 3 · Ô BẮT BUỘC — CỘT "KHÁC" CỦA CHUYÊN MÔN ĐÚNG / SAI CHỖ NÀO

| # | Câu trong đề | Phán | Căn cứ |
|---|---|---|---|
| ① | *"Substance/D5 chỉ có mặt thị giác — không giá, không NCC, không hatch 2D"* | ✅ **ĐÚNG** | Doc của cả hai chỉ mô tả tham số render + thư viện; không trường thương mại, không fill pattern |
| ② | *"các app kia chỉ có mặt thị giác; **không app nào phải bày mặt tiền**"* (câu tóm trong phiếu giao) | 🔴 **SAI nếu đọc là câu tổng quát** | **Revit có đủ ba mặt**: Graphics = Surface/Cut Pattern (**hatch**) · Appearance = render · Identity = **Cost · Manufacturer · Model · Keynote · URL · Mark** → chảy vào Material Takeoff. Và **Fohlio** bày mặt tiền còn kỹ hơn IF. ⇒ Câu đúng phải là: *"không app nào phải bày **cả ba mặt cùng lúc, trong lúc đang vẽ, với ràng buộc số phải đo được**"* |
| ③ | *"Revit **có** mặt thương mại nhưng bày kiểu bảng — đúng thứ IF đang làm, đúng thứ dân nghề ghét"* | ✅ **ĐÚNG, và đúng hơn đề tưởng** | IF không chỉ *"bày kiểu bảng"* mà còn **tệ hơn Revit ở đúng chỗ đau nhất**: ô mẫu **32 px** + biểu tượng ảnh-hỏng **14 px**. Revit ít nhất có ô xem trước render thật (dù chậm) |
| ④ | *"Where Used của Figma là **cùng loại** (component→instance)"* | 🔴 **SAI về sự tồn tại** | Figma **không có** lệnh native liệt kê instance. Có `Go to main component` (**ngược chiều**), `Swap instance`, và **Library Analytics** (báo cáo tổng hợp 30 ngày, Org/Enterprise). Liệt kê từng instance = **plugin**. ⇒ vế *"của IF là xuyên loại"* vẫn **đúng**, nhưng **vế so sánh thì rỗng** — phải thay ca đối chiếu bằng **Refactoring Preview** |
| ⑤ | *"IF có luật BOQ chỉ nhận số đo được ⇒ mặt thương mại phải phân biệt đã đo ↔ chưa đo; chưa app nào phải làm việc này"* | ✅ **ĐÚNG, và đã có mã** | `ba-mat.ts` có **ba** trạng thái `du · chuaDu · chuaCo` — chính là chỗ phân biệt đó, và lý do ba-chứ-không-hai được ghi ngay trong docstring (*"bản ghi thương mại TỒN TẠI nhưng bỏ trống giá"*). Không app nào trong 7 ca có khái niệm này |
| ⑥ | Đ3: *"lúc đang làm, KTS không muốn đọc BOQ"* | 🟡 **ĐÚNG một nửa, và nửa sai là nửa quan trọng** | Đúng: không ai muốn đọc **bảng dự toán** lúc đang vẽ. Sai: KTS **rất** muốn biết *"đổi cái này thì có phá vỡ ngân sách không"* — đó là câu hỏi nghề, chỉ là **không được hỏi bằng một cái bảng**. ⇒ Câu đúng: *"lúc đang làm, mặt tiền phải nói bằng **một CHỈ BÁO**, không bằng một bảng"* — và IF đã có đúng vật đó (`ChiBaoBaMat` — chip `Giá !`, thấy trên `05-vat-lieu.png`) |
| ⑦ | Đ3: *"các app trên không có mặt thứ ba nên không trả lời hộ được"* | ✅ **ĐÚNG** — xác nhận bằng tìm kiếm, không tìm ra ca nào | xem §2.3 |

---

## 4 · NGƯỠNG ĐO ĐƯỢC

### 4.1 · ⭐ Cỡ ô xem trước — chốt 07/08 **giữ nguyên**, nhưng thêm vế thứ hai

**Không có chuẩn công bố nào nói "thumbnail vật liệu phải ≥ N px".**
Ghi thẳng: **KHÔNG CÓ NGUỒN cho một con số px — chưa được thành chuẩn.**
Cái **có** nguồn là bốn dữ kiện dưới; phép ghép chúng lại là **suy luận của tôi (INFERENCE)**, khai rõ:

| dữ kiện | số | nguồn |
|---|---|---|
| 1 CSS px = góc nhìn **0,0213°** (**1,28 phút cung**) ở tầm tay 28 in; ≈ **0,26 mm** | — | [W3C CSS Values & Units — reference pixel](https://www.w3.org/TR/css-values-4/) |
| Mắt bình thường (20/20) phân giải được chi tiết **~1 phút cung** | — | định nghĩa thị lực Snellen |
| Vòng năm gỗ sồi ôn đới: **2–4 mm/năm**; dải lỗ mạch sớm sồi **0,3–0,5 mm**; óc chó là **bán vòng-mạch** (lỗ mạch đổi cỡ *dần*) | — | [Growth Rings — ScienceDirect](https://www.sciencedirect.com/topics/agricultural-and-biological-sciences/growth-rings) · [Black Walnut — The Wood Database](https://www.wood-database.com/black-walnut/) |
| Mẫu vật liệu nghề giao tận tay: **100×100 mm** và **300×300 mm** | — | [Mrs Stone Store — sample service](https://mrs-stone-store.com/collections/sample-service) |

**Suy ra (INFERENCE):** 1 CSS px ≈ 1,28× giới hạn phân giải của mắt ⇒ **một chi tiết muốn ĐỌC
CHẮC cần ~2–3 px**. Thứ phân biệt sồi ↔ óc chó **không phải màu** (màu thì 32 px là đủ) mà là
**cấu trúc lỗ mạch**: sồi có **dải lỗ mạch sớm đứt gãy**, óc chó **chuyển dần**. Dải đó rộng
**0,3 mm**.

> ### ⇒ NGƯỠNG: một ô xem trước vật liệu phải đạt **CẢ HAI**, không phải một
> | vế | công thức | ví dụ |
> |---|---|---|
> | **A · độ nét** | `px ÷ spanMm ≥ 6,7 px/mm` (0,3 mm ≥ 2 px) | ô 168 px ⇒ **spanMm ≤ 25 mm** |
> | **B · đủ nhịp** | `spanMm ≥ 12 mm` (≥3 chu kỳ vòng năm 4 mm) | ⇒ sàn cứng **px ≥ 80** |
>
> **Kết luận về chốt 07/08: `168 px` mặc định NẰM ĐÚNG KHOẢNG (80 sàn → ~200 thoải mái). GIỮ.**
> Cái phải thêm là **`spanMm`** — và IF **đã lưu sẵn** (`MaterialPbr.uvScaleMm`, `schema.ts`).
> ⇒ ngưỡng này **máy tính được cho từng vật liệu**, không phải con số gõ tay.

🔴 **Hệ quả bắt buộc — MỘT ẢNH KHÔNG LÀM ĐƯỢC HAI VIỆC.** `spanMm ≤ 25 mm` cho ra **CHẤT** (vân,
độ nhám) nhưng **giấu mất KHỔ** (viên gạch 600 mm, mạch, hướng lát). Nghề dùng **hai cỡ mẫu**
(100 và 300 mm) đúng vì lý do này, và V-Ray/D5 dùng **nhiều cảnh xem trước** cũng vì thế
(SPEC §2 đã chốt 3 cảnh Cầu/Sàn/Vải; `MATERIAL_TYPES` đã có **6 `previewKind`**).
⇒ **Nấc to nhất của ô vật liệu KHÔNG phải "ảnh y hệt nhưng to hơn"** — đúng luật *ba nấc = ba công
năng*: nấc gọn = **nhận dạng** · nấc vừa = **CHẤT** (crop ≤25 mm) · nấc to = **KHỔ** (1–2 module thật).

🔴 **Ô hiện tại 32 px là dưới sàn 80 px 2,5 lần** ⇒ nó **không mang tin**, chỉ chiếm chỗ.
Và khi thiếu ảnh nó thành **biểu tượng ảnh-hỏng 14 px** — tệ hơn để trống, vì nó **trông như lỗi**.

**Cổng máy đề xuất (`scripts/soi-vat-lieu.mjs`, họ `soi:` sẵn có):**
```
đọc mọi nơi render ô xem trước vật liệu →
  báo ĐỎ nếu cạnh ngắn < 80 px
  báo ĐỎ nếu có uvScaleMm mà px/spanMm < 6,7
  báo VÀNG nếu spanMm < 12
tự-kiểm: MaterialTable 32px ⇒ phải ĐỎ · MaterialPalette 154px ⇒ phải XANH
```
(khuôn bắt buộc: `process.exitCode`, **không** `process.exit`; có `--tu-kiem` với ca biết trước
kết quả; máy soi **tự loại trừ chính nó** khỏi vùng quét — luật §5 vai A.)

### 4.2 · Bao nhiêu tin hiện ở nấc gọn

Trục chia **không phải "bao nhiêu chữ"** mà **"trả lời câu nào"**:

| nấc | trả lời câu | nội dung | ngưỡng |
|---|---|---|---|
| gọn | *đây là vật gì* | mẫu vật + tên + **3 chỉ báo ba mặt** | mẫu ≥ **80 px**; **≤ 3 mẩu chữ**; đọc xong ≤ 1 s |
| vừa | *dùng được chưa, thiếu gì* | + `chuaDu` thiếu gì + **lối ra** + tầng thắng (hạt giống/studio/dự án) | mỗi mặt `chuaDu` **bắt buộc** có `thieu` **và** `loiRa` — `ba-mat.ts` đã ép |
| đầy | *ký được chưa* | + 4 phần của NT-15 (bìa · thông số · chi tiết · ứng dụng) + nơi đang dùng | mọi con số tiền phải trả lời được *"ở đâu ra"* — **0 số không nguồn** |

**Ràng buộc màu (luật màu-không-là-kênh-duy-nhất):** ba chỉ báo `du/chuaDu/chuaCo` **phải phân biệt
được khi bỏ hết màu** — hiện `ChiBaoBaMat` dùng ✓ / ! / – ⇒ **đạt**. Giữ.

### 4.3 · Ngưỡng chuyển từ lưới-nổi sang panel

**KHÔNG CÓ NGUỒN cho một con số món — chưa được thành chuẩn.**
Cái có nguồn: **Hick–Hyman**, `RT = a + b·log₂(n)`, `b ≈ 0,155 s` ⇒ **8 món → 64 món chỉ tốn thêm
~0,46 s để QUYẾT**. ⇒ **Số món không phải là biến gây đau; TÌM mới là.**

⇒ Ngưỡng đúng là **hình học, tính được**, không phải con số cảm tính:

```
n_lot = floor(rongPanel / oCell) × floor(caoPanel / oCell)
```
Đo IF hôm nay: panel **360 px**, ô ~**166 px** ⇒ **2 cột**; cao khả dụng ~500 px ⇒ 3 hàng ⇒
**n_lot ≈ 6**.

- `n ≤ n_lot` → lưới nổi, **không cần tìm kiếm**.
- `n > n_lot` → **bắt buộc có ô tìm + lọc**, và **món của dự án này lên đầu** (bài học Blender).
- **Cấm** cách chữa bằng thu nhỏ ô để nhét thêm món — vi phạm §4.1.

**Nguồn:** [Hick's law](https://en.wikipedia.org/wiki/Hick's_law) · [Proctor & Schneider, *Hick's law for choice reaction time: A review*, QJEP 2018](https://web.ics.purdue.edu/~dws/pubs/ProctorSchneider_2018_QJEP.pdf)

### 4.4 · Mấy cú bấm từ *"đang vẽ"* tới *"đã đổi vật liệu"* — **đo tại nguồn**

| đường | số bấm | đo ở đâu |
|---|---|---|
| Đặt vật liệu **trước khi vẽ** (chưa chọn gì) | **2** — mở panel → bấm mẫu (tự chuyển sang lệnh Hatch luôn) | `MaterialPalette.tsx:162` `pick()` nhánh `else reallyApply` |
| Đổi vật liệu của **mảng đang chọn** | **4** — chọn mảng → mở panel → bấm mẫu → **Áp dụng** | `:162` nhánh `setPendingPick` → `MaterialImpactPreview` |
| Đổi **toàn dự án** | **4** (nút thứ hai trong cùng cửa) | `:154` `applyProject` |
| *(đối chiếu)* D5 | **1 kéo** | doc D5 |
| *(đối chiếu)* Photoshop | **2** bấm (hoặc 1 kéo) | doc Adobe |
| *(đối chiếu)* Blender | **3+** và phải đổi sang Edit Mode | doc Blender |

> ⭐ **Khuyến nghị đi ngược trực giác: ĐỪNG tối ưu con số 4 xuống 3.**
> Cú bấm thứ tư **không phải ma sát, nó là cửa duyệt** — và nó **chỉ xuất hiện khi có vật được
> chọn**, tức chỉ khi thao tác thật sự đụng vào thứ đã có (`pick()` đã làm đúng). Cắt nó đi là
> phá `[T5]` *con người quyết cuối* và phá luật `KS3` *duyệt từng phần*.
> **2 bấm cho ca không phá gì · 4 bấm cho ca đụng BOQ — đây là thiết kế đúng, ghi lại để đợt sau
> không ai "tối ưu" nó đi.**

### 4.5 · Ngưỡng "where-used đọc được"

Mỗi hàng nơi-tiêu-thụ phải đủ **ba** việc: **(a) có số thật** · **(b) bấm được để tới chỗ đó** ·
**(c) bỏ tick được trước khi áp**.
**IF hiện: (a) ✅ · (b) ❌ · (c) ❌ ⇒ 1/3.** (`MaterialImpactPreview.tsx` — hàng chỉ hiển thị;
chỉ có `Áp dụng` / `Áp toàn dự án` / `Huỷ`, không có tick từng hàng, không có lệnh nhảy.)
Số hàng: **6** — nằm trong khoảng đọc-một-lượt, **không cần cắt**.
⚠️ Hàng *Hồ sơ trình bày* cố ý **không có số** (`count: null`) — **đúng**, giữ; đó là chỗ IF từ chối bịa.

### 4.6 · Vùng bấm

Ô mẫu vừa là **hiển thị** vừa là **nút** ⇒ chịu cả hai ngưỡng: WCAG 2.2 SC 2.5.8 (AA) **≥24×24 CSS
px**, 2.5.5 (AAA) và Apple HIG **44×44**, Material 3 **48×48 dp**.
Sàn §4.1 (**80 px**) đã vượt xa cả ba ⇒ **không xung đột**. Nhưng **chấm 22×22 px ở danh sách kho**
(`MaterialPalette.tsx:260`) **dưới cả ngưỡng AA 24 px** nếu nó là đích bấm — cần kiểm vùng bấm thật
của hàng đó.
**Nguồn:** [WCAG 2.2 SC 2.5.8](https://www.w3.org/TR/WCAG22/#target-size-minimum) · Apple HIG · Material 3.

---

## 5 · §6 IF-TRI-THUC-NGHE — vế ③ TIÊU CHUẨN cho hai mảng này

Ba câu của §6 là cửa bắt buộc trước khi dựng. **Câu ① (muốn thấy gì) và ② (thao tác thế nào) là
việc của bàn CHUYÊN MÔN** — trả lời hộ là tôi vẽ màn, vượt ranh giới vai A. Tôi nộp **vế ③**, đủ
cả hai vế A/B:

```
MẢNG: Kho vật liệu (/materials) + Cửa chọn vật liệu (MaterialPalette)

③A FRONTIER  · ô mẫu ≥ 80 px cạnh ngắn VÀ px/spanMm ≥ 6,7   → soi:vat-lieu (đề xuất §4.1)
             · 3 chỉ báo ba mặt phân biệt được khi BỎ HẾT MÀU → đã đạt (✓ ! –)
             · vùng bấm ≥ 24 px (AA) / 44 px (AAA)           → soi:thao-tac
             · 0 quả cầu render đồng bộ lúc mở danh sách      → bài học Revit AdPreviewGenerator
             · bảng tác động: mỗi hàng (a)số (b)nhảy (c)tick  → hiện 1/3
             · tương phản · thang bo · nhịp lưới              → IF-CHUAN-NEN, soi:hinh-hoc

③B OUTPUT    CÓ SINH FILE — mảng này nuôi 3 đầu ra giao khách:
             · Bảng vật liệu A3   → CHUAN-DAU-RA-NGHE: 300dpi · nhãn không đè hình · 0 placeholder
             · BOQ / dự toán      → đơn vị đúng (m²·md·m³·cái) · hao hụt (gạch 5-10%, gỗ 10-15%)
                                    · CHỈ số đo được · có nguồn giá
             · Hồ sơ trình bày    → PPTX chữ sửa được
             🔴 AI ĐÃ MỞ FILE ĐÓ: CHƯA AI. Đây là cửa nghiệm thu còn trống của Đ2.
```

> 🔴 **Nhắc lại luật 11/08, vì Đ2 rơi đúng vào nó:** mảng nào sinh file thì nghiệm thu = **MỞ FILE
> ĐẦU RA soi theo vế B**. `tsc` xanh · test xanh · ảnh chụp đẹp — **cả ba đều không đủ**.
> Đ2 làm xong mà chưa ai mở một bảng vật liệu A3 thật thì **chưa xong**.

---

## 6 · ⑦b · CHƯA CHẮC / CHƯA KIỂM

1. 🔴 **Không mở được trực tiếp 5 tên miền tài liệu gốc** — `autodesk.com`, `help.autodesk.com`,
   `docs.d5render.com`, `documentation.chaos.com`, `helpx.adobe.com`, `docs.blender.org`,
   `help.figma.com`, `yorku.ca` đều **bị chặn ở cổng ra** (`EGRESS_BLOCKED`). Nội dung của chúng
   tới qua **công cụ tìm kiếm trích lại trang chính thức**. URL trong bảng là URL chính thức và
   **kiểm lại được**, nhưng tôi **chưa tự mắt đọc toàn văn** — nguy cơ trích thiếu ngữ cảnh.
   **Ưu tiên kiểm lại:** con số **4,2 vs 3,0 bits/s** của MacKenzie (đây là số tôi dùng để phán
   kéo-thả sai cơ chế) và danh sách trường **Identity** của Revit.
2. 🔴 **Ngưỡng §4.1 là SUY LUẬN của tôi, không phải chuẩn.** Bốn dữ kiện đầu vào có nguồn; **phép
   ghép thì không**. Chưa ai thử bằng mắt người thật với đúng hai ảnh sồi/óc chó của
   `hat-giong.ts`. **Cách bác rẻ nhất:** dựng một trang ba cỡ (32 / 80 / 168 px) × hai vật liệu,
   hỏi 3 người nghề *"hai cái này khác nhau ở đâu"*. Nếu 80 px họ đã tách được thì **hạ sàn**;
   nếu 168 px vẫn không thì **nâng**. Chưa làm.
3. 🟡 **Không đo trên app đang chạy.** Mọi số px lấy từ **mã** (`MaterialTable.tsx` `MaterialPalette.tsx`)
   + **một ảnh tĩnh** (`05-vat-lieu.png`). Chưa mở `localhost:3255`, chưa `getComputedStyle`.
   Số **154×115** của ô mẫu là **tính tay** từ chuỗi CSS (360 − 16 − 4, 2 cột gap 8, đệm 5, viền 1)
   — chưa đo trên DOM; có lớp nào chen vào là lệch.
4. 🟡 **Chỉ đo trên `05-vat-lieu.png` (theme sáng, 1440×900, 3 mục).** Kho **3 mục** không phơi được
   bài "kho 2.000 món" mà §4.3 bàn tới. Ngưỡng `n_lot ≈ 6` **chưa thử với danh sách dài thật**.
5. 🟡 **Chưa kiểm phần 3D.** Cả Đ2 lẫn Đ3 đều nói *"cửa chọn ở 3D"* nhưng tôi chỉ đọc đường 2D
   (`MaterialPalette` cho lệnh Hatch). Đường chọn vật liệu trong `Viewport3D` / Command Panel
   **chưa mở một dòng nào** ⇒ mọi kết luận Đ3 hiện là **cho 2D**, suy sang 3D là suy.
6. 🟡 **"Không app nào cho xem trước hệ quả tài chính lúc chọn"** là kết luận từ **7 ca đã tra**,
   không phải từ một khảo sát đầy đủ. Chưa tra: Vectorworks, Archicad (Attribute Manager),
   SketchUp + extension dự toán, Cove.tool, Speckle. **Có thể có ca tôi chưa thấy.**
7. 🟡 **Số vật liệu hạt giống = 2** đọc từ `VAT_LIEU_HAT_GIONG`; **chưa kiểm** kho studio thật của
   Hoà (`localStorage`) có bao nhiêu — con số thật lúc chạy có thể khác hẳn.
8. ⚪ **Kích thước mẫu nghề (100/300 mm)** lấy từ trang bán đá của một hãng, **không phải tiêu chuẩn
   ISO**. Nó là **thông lệ thương mại**, tôi dùng nó làm *mốc cảm giác*, không làm luật.
9. ⚪ **`MATERIAL_TYPES` = 11** đếm tay từ `material-edit.ts:50-60`; một lần `grep -c` trước đó ra
   **12** vì mẫu quét chạm dòng ngoài khối. Số đúng là **11** (đã đọc từng dòng). Ghi lại vì đây
   đúng họ lỗi *máy soi báo quá tay* mà sổ đã ghi ba ca trong ngày 04/09.

---

## 7 · Ô KẾT (MẪU 6)

### ① VẤN ĐỀ
Vật liệu của IF **có đủ lõi ba mặt và đã cắm điện**, nhưng **hình thức làm mất hết giá trị đó**:
ô mẫu ở `/materials` là **32×32 px** — **dưới sàn phân giải 80 px 2,5 lần** — và khi thiếu ảnh thì
thành biểu tượng ảnh-hỏng **14 px**; bảng tác động xuyên-chặng mới đạt **1/3** tiêu chí đọc-được
(có số, **không** nhảy tới được, **không** bỏ tick được); và **chưa ai mở một file đầu ra nào**
(bảng vật liệu A3 · BOQ) để nghiệm thu theo vế B.

### ② GIẢI PHÁP
Đây là báo cáo nghiên cứu — **việc của tôi là giao ngưỡng, không phải dựng**. Đã giao:
1. **Ngưỡng ô xem trước tính được cho từng vật liệu**: `px ≥ 80` **và** `px/spanMm ≥ 6,7`, dùng
   `MaterialPbr.uvScaleMm` **đã có sẵn** ⇒ không đẻ trường mới. Kèm khuôn cổng máy `soi:vat-lieu`
   có `--tu-kiem` (32 px phải ĐỎ · 154 px phải XANH). → *bàn THỰC THI dựng cổng; xong thì thấy một
   dòng số trong `npm run soi:*`.*
2. **Ba nấc = ba công năng cho ô vật liệu**: nhận dạng → **CHẤT** (crop ≤25 mm) → **KHỔ** (1–2
   module thật). Nối vào `previewKind` **đã có 6 giá trị**. → *bàn CHUYÊN MÔN ra bố cục.*
3. **Trục ẩn/hiện**: món theo **phạm vi** (Blender), núm theo **`typeId`** (Substance/D5), **ba mặt
   thì KHÔNG ẩn** (đó là lỗi tab của Revit). → *bàn CHUYÊN MÔN.*
4. **Bảng tác động thêm (b) nhảy tới + (c) bỏ tick** theo khuôn Refactoring Preview. → *THỰC THI.*
5. **Bấm-chọn là mặc định, kéo-thả là phụ** — có số của MacKenzie chống lưng.
6. **Đổi ca đối chiếu** trong phiếu Đ2: bỏ Figma, thay bằng **IntelliJ Refactoring Preview** +
   **Fohlio**. → *bàn CHUYÊN MÔN sửa phiếu.*

### ③ RỦI RO — của **chính sáu đề xuất trên**, kèm cách chặn
| rủi ro | vì sao nó có thật | cách chặn |
|---|---|---|
| 🔴 **Ngưỡng 80 px / 6,7 px/mm là số TÔI suy ra.** Đóng nó thành cổng máy rồi mới phát hiện sai thì cả app đã bị nắn theo một con số bịa | ⑦b-2: chưa ai thử bằng mắt người | **Chạy phép thử ba cỡ × hai vật liệu (đã có sẵn sồi/óc chó) TRƯỚC khi cổng máy đi từ VÀNG lên ĐỎ.** Cổng ra đời ở mức **cảnh báo**, không chặn build — đúng cách `soi:tu-dien` đã làm (212 chỗ, exit 0) |
| 🔴 **Ô to hơn ⇒ dễ trượt sang render quả cầu theo hàng ⇒ tái hiện đúng `AdPreviewGenerator` của Revit** (mở 30 giây, 100% CPU) — và đó là ca xấu tôi vừa đi bắt | ô 32→168 px là **27× diện tích**; render 100 vật liệu × 168² là việc thật | **Cổng phải đếm luôn số ảnh sinh đồng bộ lúc mở = 0.** Thi hành SPEC §2 đã chốt: cache PNG theo `hash(params)` + nấc 100/50/25% + chỉ sinh khi ô vào khung nhìn. Ghi thành tiêu chí nghiệm thu, không để phiếu tự nhớ |
| 🟠 **Thêm (c) bỏ tick vào bảng tác động = thêm đường ghi thứ hai** (áp một phần), dễ đẻ hàm ghi thứ hai và làm bảng-đếm ≠ việc-đã-ghi | `MaterialPalette.tsx:150` đã tự cảnh báo đúng bệnh này | **Bỏ tick chỉ được lọc `entityIds` truyền vào `replaceMaterialReferences` — cấm viết nhánh ghi mới.** Cổng: `grep` số hàm ghi vật liệu phải **= 1** |
| 🟠 **"Ba nấc" bị hiểu thành ba cỡ ảnh** ⇒ nấc to thành ảnh y hệt phóng to = kéo dãn, đúng lỗi Hoà đã bắt hai lần | tôi đang đề xuất một thang cỡ; thang cỡ **rất dễ** đọc thành kéo dãn | Ngưỡng viết theo **`spanMm`**, không theo px: nấc vừa `≤25 mm`, nấc to `1–2 module`. **Hai nấc khác nhau ở KHOẢNG THẬT, nên không thể là cùng một ảnh phóng to** |
| 🟡 **Kết luận Đ3 đo trên đường 2D, đem áp cho 3D** | ⑦b-5 | Phiếu thi công Đ3 **phải khai riêng đường 3D**, hoặc khai thẳng là ngoài phạm vi. Không im lặng suy |
| 🟡 **Bỏ Figma khỏi phiếu ⇒ mất một mốc mà bàn B đã dựa vào** | phiếu Đ2 đang trích Figma ở hai chỗ | Không xoá — **đóng dấu tại chỗ** (luật 15/08: văn bản bị thay phải đóng dấu, không bỏ hoang) và trỏ sang ca thay |

### ④ ĐẠT ĐƯỢC — đo được / nhìn thấy được
| đạt gì | biết bằng cách nào |
|---|---|
| **Ngưỡng ô xem trước thôi là ý kiến, thành công thức** — `px ≥ 80` ∧ `px/spanMm ≥ 6,7` | chạy được thành một dòng số; ca 32 px hôm nay **phải đỏ**, ca 154 px **phải xanh** |
| **Chốt 07/08 (168 px) được xác nhận bằng dữ kiện ngoài, không phải bằng trí nhớ** — và **không phải đổi** | 168 nằm trong khoảng 80 (sàn) – 200 (thoải mái) tính từ giải phẫu gỗ + góc nhìn W3C |
| **Một tiền đề sai của phiếu bị bắt trước khi thành mã**: Figma **không có** Where-Used native | 3 nguồn: help.figma.com (chỉ `Go to main component`) · Library Analytics là báo cáo · liệt kê instance là plugin |
| **Một tiền đề sai thứ hai bị bắt**: Revit **có đủ ba mặt**, không phải hai | doc Autodesk 3 trang: Identity (Cost/Manufacturer/Keynote) · Graphics (Surface/Cut Pattern) · Appearance |
| **Định vị hào được sửa cho đúng**: hào **không phải** "có ba mặt" (Revit có rồi) mà là *ba mặt thấy cùng lúc · mẫu đủ to để phán · thấy hệ quả trước khi ghi · số dám ký* | 4 câu này **đều đo được**, không phải khẩu hiệu |
| **Con số 4-cú-bấm được bảo vệ thay vì bị "tối ưu"** | đọc `pick()`: cửa duyệt **chỉ hiện khi có vật được chọn** — 2 bấm cho ca vô hại, 4 cho ca đụng BOQ |
| **Bảng tác động có thước chấm**: (a)(b)(c) — hiện **1/3**, biết còn thiếu đúng hai thứ và thiếu ở đâu | `MaterialImpactPreview.tsx` không có tick, không có lệnh nhảy |
| **Một ca đối chiếu tốt hơn được đưa vào** (Refactoring Preview) và **một ca ngành bị bỏ sót được đưa vào** (Fohlio — nơi mặt tiền sống thật) | hai mục mới trong bảng §1.1, có nguồn |
| **Cửa nghiệm thu còn trống được chỉ tên**: chưa ai **mở file đầu ra** của Đ2 | §5 vế ③B |

---

*Bàn NGHIÊN CỨU (A) lập 05/09/2026. Không sửa mã, không sửa tệp của bàn khác.
Nguồn đã trích trong từng ô; chỗ không tra được ghi thẳng **KHÔNG CÓ NGUỒN**.*
