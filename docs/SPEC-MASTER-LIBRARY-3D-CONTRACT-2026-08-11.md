# SPEC — Master Library: dữ liệu ngành, tool và hệ quả ở 3D Thiết kế

> Trạng thái: đề xuất kiến trúc để triển khai nội bộ · 11/08/2026  
> Liên quan: `SPEC-STAGE-LIBRARIES.md`, `SPEC-MODE-PER-STAGE.md`, `SPEC-VITALS-UNIFIED-2026-08-11.md`, luật một Doc và trung tính của InteriorFlow.

## 1. Quyết định

**Master Library không phải kho file. Nó là catalogue các “đơn vị có nghĩa” của ngành**, mỗi đơn vị có một identity bền vững, nguồn gốc, dữ liệu chung và những dẫn xuất chuyên biệt cho từng chặng.

Một loại gạch, một mẫu tủ, một bộ đèn hay một cây xanh không được sao chép thành bốn bản rời cho CAD, render, BOQ và deck. Nó là **một Asset Definition**; mỗi chặng chỉ đọc/ghi vào phần dữ liệu thích hợp.

```text
Master definition  ──┬── 2D: ký hiệu · hatch · kích thước · layer
                     ├── 3D: hình học · vật liệu · shader · ánh sáng · LOD
                     ├── BOQ: đơn vị · hệ số hao hụt · mã hàng · quy cách
                     ├── Present: ảnh mẫu · mô tả · credit · layout token
                     └── Procurement: NCC · availability · lead time · báo giá theo thời điểm

Project instance    = “món này được dùng ở đâu, với override gì, số lượng bao nhiêu”
```

Đây là phần IF nên học từ Revit: category xác định hành vi; family/type có một bộ parameter nhất quán; instance chỉ mang khác biệt tại nơi đặt. Revit cũng tách parameter dùng chung để tag/schedule nhiều family — đó là nền đúng cho BOQ, không phải đọc tên layer để đoán. [Autodesk: category & parameters](https://help.autodesk.com/cloudhelp/2025/ENU/Revit-Customize/files/GUID-68EFCA67-4913-4E00-AB9E-F2E6A7BEF8C6.htm), [shared parameters](https://help.autodesk.com/cloudhelp/2022/ENU/Revit-Customize/files/GUID-ACDC1C99-0278-4FC8-9E42-19659D7534F9.htm)

## 2. Bốn tầng dữ liệu — không trộn trách nhiệm

| Tầng | Là gì | Ví dụ | Không được biến thành |
|---|---|---|---|
| **A. Chuẩn chung** | Từ điển category, unit, parameter, material role, classification | `finish.floor.tile`, `casework.base`, mm, m², `matId` | UI hay file của một chặng |
| **B. Asset Definition** | Món tái sử dụng có version, source, metadata và recipe | “Gạch porcelain 600×1200 · matte” | Một object đã đặt ở dự án |
| **C. Project Instance** | Vị trí sử dụng/override của asset trong một Doc | Gạch đó lát sàn phòng khách, pattern xương cá, hao hụt 7% | Bản sao độc lập của asset gốc |
| **D. Output Derivative** | Hình preview, shader bake, thumbnail, hatch, BOQ row, render mask | PBR sphere, hatch 1:50, `Material ID` | Nguồn sự thật mới |

Tầng A và B thuộc Master Library. C thuộc dự án và đi vào một Doc. D được sinh lại được từ A–C, có version/provenance để biết nó đến từ đâu.

## 3. Taxonomy: mỗi asset có một “nhà”, nhiều facet để tìm

Không làm thư viện kiểu thư mục thuần và cũng không làm một biển tag. Asset có **một primary class** để mọi người đặt đúng chỗ, sau đó tìm bằng facet xuyên lớp. Blender cho phép catalog lồng nhau, nhưng asset vẫn có catalog chính; cùng lúc metadata, preview, author và tags phục vụ duyệt/tìm. Đây là logic IF cần lấy, không phải giao diện Blender. [Blender Asset Browser](https://docs.blender.org/manual/en/4.1/editors/asset_browser.html), [Asset Catalogs](https://docs.blender.org/manual/en/3.3/files/asset_libraries/catalogs.html)

### 3.1. Cây chính của Master Library

1. **Vật liệu & hoàn thiện**
   - bề mặt: sơn, đá, gỗ, kim loại, kính, fabric, da, bê tông, terrazzo, wallpaper;
   - lớp cấu tạo: sàn, tường, trần, facade, joinery, ngoại thất;
   - pattern/ốp lát: tile layout, veneer direction, grout, moulding, profile.
2. **Cấu kiện kiến trúc & nội thất**
   - bao che: tường, cửa, cửa sổ, vách kính, opening;
   - hoàn thiện: floor build-up, ceiling system, wall panel, len–phào;
   - joinery: base/wall/tall cabinet, wardrobe, vanity, island, shelving;
   - FF&E: bàn, ghế, sofa, giường, đèn, thiết bị bếp/vệ sinh, decor.
3. **Cảnh quan nhẹ & bối cảnh**
   - cây, planter, đá/sỏi, mặt nước, paving, outdoor furniture, site light;
   - chỉ dùng để kể không gian và kiểm quy hoạch nhẹ; địa hình/hạ tầng phức tạp là model liên kết/import.
4. **Ánh sáng, camera & môi trường**
   - luminaire có IES/LDT khi có; sun/sky/HDRI; camera preset; render pass/preset;
   - không trộn vào “vật liệu”, dù đều có thumbnail đẹp.
5. **Công cụ tạo sinh & Modifier Recipe**
   - cabinet configurator, panelizer, ceiling grid, tile-layout, array, trim, scatter landscape;
   - đây là **tool asset**, không phải node graph lộ ra cho tất cả người dùng.
6. **Tri thức, detail & output template**
   - detail CAD, spec note, installation guideline, BOQ mapping, material-board/deck/word template.

### 3.2. Facet dùng chung để tìm và lọc

`discipline` (architecture/interior/landscape/light) · `primaryClass` · `stageSupport` · `style` · `materialRole` · `manufacturer` · `region` · `priceBand` · `availability` · `license` · `LOD` · `renderReady` · `project/shared/studio` · `lastVerified`.

Ví dụ tìm “đá travertine ốp tường, có stock tại HCM, render-ready, dùng được cho A3” không phải nhớ tên folder. Đó là truy vấn facet qua một asset contract chung.

## 4. Asset contract bắt buộc

Mọi loại asset có envelope chung trước khi có field riêng:

```ts
type AssetDefinition = {
  id: string; version: string; primaryClass: string; title: string;
  source: { kind: 'self' | 'manufacturer' | 'licensed' | 'project-import'; url?: string; license: string; verifiedAt?: string };
  identity: { manufacturer?: string; model?: string; sku?: string; classification?: string[] };
  capabilities: { stages: ('2d' | '3d' | 'present' | 'boq')[]; native: boolean; importKind?: 'linked' | 'baked' };
  preview: { coverId: string; thumbnailId: string; updatedAt: string };
  parameters: ParameterDefinition[];
  documents: AssetDocument[];
};
```

`ParameterDefinition` phải có id, label VI/EN, unit, data type, default/range, group UI, cấp `type | instance | project`, và cờ `scheduleable`. Không đưa mọi thông số vào panel; group quyết định panel nào lộ ra. Đây chính là điểm Revit làm đúng: parameter có type/instance và được gom theo nhóm logic, thay vì một cột property vô tận. [Autodesk: family parameters](https://help.autodesk.com/cloudhelp/2022/ENU/Revit-Customize/files/GUID-ACDC1C99-0278-4FC8-9E42-19659D7534F9.htm)

## 5. Material là một “hồ sơ kỹ thuật”, không chỉ là quả cầu

### 5.1. Dữ liệu gốc của Material Definition

| Nhóm | Ví dụ field |
|---|---|
| **Nhận diện** | material code, tên thương mại, category, manufacturer, collection, màu/finish |
| **Quy cách** | kích thước tấm/thanh/cuộn, độ dày, joint/grout, hướng vân, coverage unit |
| **Hình ảnh & render** | albedo/base color, normal/bump, roughness, metallic, opacity, displacement, AO, texture scale/rotation/UV, thumbnail sphere/cube |
| **Kỹ thuật** | ứng dụng phù hợp, chống trượt/cháy/nước khi có nguồn, độ bền, maintenance, install method |
| **Chuỗi cung ứng** | NCC, SKU, region, MOQ, unit price/currency và ngày báo giá, stock state, lead time, vận chuyển, substitution |
| **Hồ sơ** | CAD detail/section, datasheet, warranty, installation manual, credit/license |
| **BOQ** | đơn vị tính, diện tích phủ/đơn vị, waste default, quy tắc rounding, labour/adhesive phụ trợ |

**Stock, giá, lead time không phải thuộc tính vĩnh viễn của vật liệu.** Nó là `SupplyOffer` có vendor, khu vực, ngày kiểm và nguồn. Một `ProjectSupplyRecord` chọn một offer cho dự án; nhờ vậy cùng một gạch vẫn dùng được ở nhiều nơi mà không “nói dối” tồn kho.

### 5.2. Khi kéo vật liệu vào cảnh 3D

1. User kéo material từ kệ đang lọc theo chặng hoặc chọn trong Inspector.
2. App tạo **MaterialBinding** trên mặt/object/material role, không clone Material Definition.
3. Texture Editor resolve map + scale + UV theo mặt đích và tạo preview sphere/cube nếu thiếu.
4. Layer/Scene Structure hiện `material role → matId`; 2D hatch và BOQ mapping đồng bộ qua binding đó.
5. Nếu object là family có role `carcass`, `front`, `countertop`, user chỉ đổi đúng role, không phá các mặt khác.

Revit cũng cho gán material khác nhau cho từng phần geometry bằng family parameter; IF dùng cùng nguyên tắc nhưng phải cho thấy binding trực quan hơn. [Autodesk: material by family](https://help.autodesk.com/cloudhelp/2022/ENU/Revit-Customize/files/GUID-FB6FB0B3-BFFC-4884-BFB3-0369DA6AE905.htm)

### 5.3. Texture Editor = tool node của chặng 3D

Texture Editor không phải màn sửa ảnh rời. Nó nhận một Material Definition/binding, sau đó xuất một `MaterialRecipe` versioned:

`Input maps → color/levels → normal/bump/displacement → roughness/metal/opacity → UV scale & orientation → renderer material`

Giao diện mặc định chỉ có **Base color · Bề mặt · Scale/hướng · Opacity**. Phần `Advanced` mở AO, blend, channel packing, triplanar, displacement. Node graph như hình Blender chỉ dành cho **Edit recipe**; user thường làm việc bằng inspector group + preview trước/sau. Blender hữu ích ở cách shader/geometry node được đóng gói thành asset/tool tái sử dụng, không phải ở việc phơi mọi node. [Blender node-based tools](https://docs.blender.org/manual/ja/5.0/modeling/geometry_nodes/tools.html), [Geometry Nodes](https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/index.html)

## 6. Component/Family contract

Một component không phải chỉ là GLB. Nó chọn một trong bốn trạng thái để IF không hứa quá mức:

| Loại | Dùng khi | Người dùng sửa được |
|---|---|---|
| **Native parametric** | Tường, cửa, cabinet, trần, sàn, tile pattern | Type/instance parameter, material roles, constraint, recipe |
| **Library parametric** | Bàn/đèn/tủ có biến thể chuẩn | Các parameter nhà cung cấp mở cho phép |
| **Linked import** | Model phức tạp từ Revit/3ds Max/Blender/SKP/GLB | Transform, material binding, visibility, metadata; không giả mesh edit native |
| **Baked render asset** | Decor/cây nặng/asset chỉ phục vụ ảnh | Transform, LOD, material override hạn chế |

Mỗi family/component cần: identity + category, host/anchor (floor/wall/ceiling/free), work plane/level, bounding box/clearance, geometry/LOD, material roles, parameter groups, 2D representation, BOQ rule, asset docs, render IDs.

**Phức tạp được đóng gói thành workflow, không ép mọi thứ thành primitive.** Ví dụ `Kitchen Cabinet Tool` nhận layout, kích thước, module, vật liệu role và appliance; nó tạo các component chuẩn có `typeId/instanceId` và BOM. Muốn sửa sâu hơn thì mở Component Editor; model nhập phức tạp thì giữ linked import. Không cần làm Blender clone để dựng nội thất chuyên nghiệp.

## 7. Chặng 3D: bố cục làm việc và nhóm lệnh

### 7.1. Khung giao diện

```text
Navigator trái                 Canvas 3D                              Inspector phải
Tầng · Scene · Layer           ViewCube · selection · preview           ngữ cảnh đối tượng
Filter category                không card kính thường trực              Type | Instance | Material | BOQ

                 Dock đáy: Chọn · Tạo · Sửa · Thư viện · Đo/kiểm
                 Command line gọn + trạng thái/Vitals (không trùng CTA)
```

- **Navigator trái:** cấu trúc, tầng, collection/layer, visibility và filter; không biến thành catalogue asset.
- **Canvas:** chỉ scene, gizmo, selection, preview ghost và thông tin tạm thời.
- **Inspector phải:** chỉ mở khi có selection/tool active. Đây là “bản thông tin cấu kiện” giống logic Revit: `Type` chung bên trên, `Instance` bên dưới, group rõ theo mục đích.
- **Dock đáy:** các lệnh thường dùng, chỉ icon + tooltip/phím tắt; bấm một nhóm mở rollout/Inspector thay vì trải hàng chục tool.
- **Kệ Library theo chặng:** mở sheet/drawer đúng ngữ cảnh, có thể kéo vào canvas hoặc áp cho selection. Nó tự lọc asset compatible nhưng vẫn có “Xem toàn kho”.

### 7.2. Nhóm lệnh cần có — chỉ cho interior, architecture và landscape nhẹ

| Nhóm | Lệnh MVP | Mở rộng sau | Dữ liệu sinh ra |
|---|---|---|---|
| **Chọn & điều hướng** | select, multi-select, isolate, hide, frame, layer/level filter | scene sets, section box | selection scope |
| **Tạo cấu trúc** | wall, floor, ceiling, opening, room/level | stairs, roof, core structural | semantic entity + level + type |
| **Tạo nội thất** | box, panel, cabinet, shelf, counter, door | parametric joinery, profile/trim | family instance + material roles |
| **Biến đổi** | move, rotate, scale, align, array, mirror, copy | distribute, constraints, boolean | transform/constraint history |
| **Bề mặt** | apply material, UV scale/orient, paint face | Texture Editor, pattern/tiling | MaterialBinding + recipe |
| **Ánh sáng & camera** | room light, sun, camera, safe frame | IES/LDT, exposure, path | lighting/camera in Doc |
| **Đo & kiểm** | measure, clearance, dimensions, clash nhẹ | ruleset/accessibility | audit result, không tự sửa |
| **Nhập & liên kết** | GLB/OBJ/import supported, classify, place | IFC/SKP/RVT adapters khi thật sự hỗ trợ | link/provenance/LOD, không giả native edit |

Các thao tác mesh/boolean/modifier chuyên sâu vẫn cần, nhưng phải nằm trong **Component Editor / Edit geometry** — chỉ mở khi chọn một native parametric asset hay import đã được chuyển đổi. Nó không nằm cùng cấp với Wall/Move/Material của công việc hằng ngày.

### 7.3. Inspector cấu kiện: layout và dữ liệu

Inspector phải có hai tab đầu: **Loại** và **Trong dự án**. Nếu chọn nhiều object, chỉ hiện property giao nhau và biểu thị `—` cho giá trị khác nhau.

| Rollout | Type | Instance |
|---|---|---|
| Nhận diện | category, family/type, manufacturer, SKU, classification | name, level, room, status |
| Kích thước & neo | default dimensions, host rule, clearance rule | X/Y/Z, rotation, offset, override dimensions |
| Cấu tạo | material roles, recipe, LOD | material bindings/UV override |
| Kỹ thuật | performance/fire/acoustic khi có nguồn | installation note, issue, approval |
| BOQ & supply | unit, formula, waste default, mapping | quantity override, chosen offer, lead time, procurement status |
| Hồ sơ | detail/datasheet/source | tag, note, image/camera reference |

## 8. Luồng import → enrich → publish

Không cho “upload một file và xong”. Một asset mới qua sáu trạng thái:

1. **Collect:** upload/link/import; giữ original và license/source.
2. **Identify:** nhận dạng loại file, material maps, unit, geometry complexity, metadata có sẵn.
3. **Normalize:** đổi trục/đơn vị, tạo thumbnail/preview, hash file, phân loại sơ bộ.
4. **Enrich:** user hoặc Vitals điền field tối thiểu; tool gợi ý map, category và BOQ nhưng không tự xác nhận nhà cung cấp/stock.
5. **Validate:** kiểm required fields theo asset class, license, map thiếu, unit sai, LOD quá nặng, BOQ mapping thiếu.
6. **Publish:** vào scope `Project` trước; người có quyền mới nâng lên `Shared/Studio`. Version mới không âm thầm đổi instance cũ.

Mỗi class có “minimum viable record” khác nhau. Material cần `cover + unit + material role + source`; cabinet cần `category + dimensions + anchor + material roles + BOQ unit`; imported model cần `source + license + scale + LOD + usage limitation`.

## 9. Hệ quả sinh ra cho các chặng khác

| Sự kiện ở 3D | Hệ quả 2D | Hệ quả BOQ/Present |
|---|---|---|
| Áp material `matId` cho floor/wall | hatch/tag vật liệu cùng id | m² × coverage/waste; material board dùng ảnh/copy/source |
| Đặt cabinet type | footprint/annotation nếu view cần | module/BOM + manufacturer/SKU khi có |
| Đổi material role countertop | không đổi carcass/front | chỉ counter quantity và board item thay đổi |
| Import model linked | placeholder/footprint theo metadata nếu có | ghi rõ link/provenance, không tính BOQ nếu chưa map |
| Render material/object IDs | không thay đổi Doc | Photo Editor chọn đúng object/material mask để chỉnh cục bộ |

Render pass cần phát `objectId`, `materialId`, `categoryId`, `roomId` và mapping version. Đây là phiên bản IF của ý tưởng Cryptomatte/CMasking: hậu kỳ chọn đúng semantic target thay vì tô thủ công; nhưng chỉ khả dụng khi renderer xuất mask thật và mapping không đổi sau render. Không quảng bá nó trước khi pipeline đó có thật.

## 10. Vai của Vitals trong hệ này

Vitals đọc asset contract để hỗ trợ, không phải nguồn dữ liệu mới:

- “Gạch này có dùng được khu ướt không?” → trả nguồn/datasheet hoặc nói chưa có.
- “Áp loại đá này cho toàn bộ countertop” → liệt kê target, preview binding, áp dụng/undo.
- “Tủ này có sẵn không?” → hỏi `ProjectSupplyRecord`; nếu chưa chọn vendor, nói không có dữ liệu dự án.
- “Tạo tủ bếp 3,6 m” → gọi Cabinet Tool, tạo recipe/preview, không sinh mesh bí ẩn.

Vitals không được tạo SKU, giá, lead time, chứng chỉ, PBR map hay BOQ quantity không có rule/nguồn. Mọi action vẫn đi qua preview/apply/undo.

## 11. Thứ tự triển khai thực dụng

1. **Schema trước UI:** Asset Definition, MaterialBinding, component type/instance, provenance, BOQ mapping.
2. **Một vertical slice:** vật liệu sàn → kéo vào 3D → map/hatch 2D → quantity BOQ → A3 material board.
3. **Navigator/Inspector 3D:** level/layer trái; Type/Instance/Material/BOQ phải; dock gọn ở đáy.
4. **Texture Editor:** simple inspector trước, advanced recipe/editor sau.
5. **Component Tool:** cabinet/panel/tile layout trước; importer linked cho model phức tạp.
6. **Supply records + output:** chỉ sau khi asset/source/provenance đã đáng tin.
7. **Masks/render elements:** sau renderer output thật.

> Câu hỏi kiểm cuối: **“Món này là một định nghĩa dùng lại, một lần đặt trong dự án, hay một output sinh ra từ hai thứ đó?”** Nếu không trả lời được, ta chưa được tạo thêm bảng dữ liệu hoặc UI cho nó.
