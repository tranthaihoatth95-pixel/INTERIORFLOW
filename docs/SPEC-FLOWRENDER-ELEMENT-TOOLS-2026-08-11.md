# FlowRender & Element Tools — chặng 2

## 1. Một nguyên lý duy nhất

IF không coi ảnh phối cảnh là một tệp tách rời. Nó là kết quả có thể truy lại:

`Definition → Type → Project instance → Stage adapter → FlowRender recipe → Output`.

- **Definition** giữ sự thật dùng chung: tên, phân loại, đơn vị, metadata, nguồn, phiên bản.
- **Type** giữ cấu hình có thể tái dùng: vách 100 mm, sofa 3 chỗ, đèn thả cụ thể.
- **Project instance** giữ việc xảy ra tại dự án: đặt ở đâu, quay bao nhiêu, áp vật liệu nào, thuộc phòng/tầng nào.
- **Stage adapter** chỉ lấy phần từng chặng cần: hatch/DXF cho 2D; geometry/PBR/light cho 3D; quantity/spec cho BOQ; ảnh/caption cho Present.
- **FlowRender recipe** gom scene, góc máy, ánh sáng, nền và output thành một công thức có version.

Không clone dữ liệu khi chuyển chặng. Một thay đổi phải báo impact: ảnh, BOQ, material board, bản vẽ hoặc output nào cần cập nhật.

## 2. Ranh giới dựng hình cho IF

IF ưu tiên nội thất, kiến trúc nhẹ và cảnh quan nhẹ. Công cụ native chỉ phục vụ các thao tác lặp lại, đo được và đi tới hồ sơ/BOQ. Model phức tạp nhập/link thay vì giả làm editor tổng quát như Blender.

| Nhóm | Native trong IF | Library / import | Dữ liệu buộc có |
|---|---|---|---|
| **Không gian & kết cấu nhẹ** | room, wall, floor, ceiling, opening, stair/railing đơn giản | façade, roof phức tạp, kết cấu chuyên ngành | level, room, host, kích thước, build-up, type ID |
| **Hoàn thiện** | panel, tile, paint, trim, skirting, pattern | shader/node phức tạp | material role, quy cách, coverage, waste, detail, PBR binding |
| **Đồ rời & joinery** | place, align, array, clearance, cabinet đơn giản | FF&E/hardware/nhà bếp/vendor model | category, anchor, clearance, dimensions, LOD, BOM/BOQ mapping |
| **Ánh sáng & MEP nhìn thấy** | fixture, cove, switch zone, camera, sun | MEP routing/thiết bị kỹ thuật chi tiết | host, mounting, CCT, lumen, beam, IES/LDT provenance |
| **Cảnh quan nhẹ** | planter, terrain patch, paving, path, light | cây/địa hình nặng, vegetation scatter | coverage, season, species/asset, material, maintenance |
| **Tham chiếu & nhập** | place/reference/section/clipping | SKP/FBX/MAX/RVT/IFC khi app chưa hỗ trợ native | source file, author, transform, revision, licence, LOD |

**Nguyên tắc LOD:** chỉ tạo geometry đến mức có ích cho góc nhìn, BOQ hoặc detail cần xuất. Một catalogue asset có thể có thumbnail, model proxy, model render và detail 2D — không bắt mọi dự án tải đủ cả bốn.

## 3. Bộ tool theo đối tượng

Tool chỉ lộ khi chọn đúng đối tượng hoặc mở tool riêng. Dock không chứa hết các lệnh; chuột phải mở thao tác ngữ cảnh, inspector giữ thông số, shortcuts phục vụ thao tác lặp.

| Đối tượng | Dock / chuột phải | Inspector tối ưu | Kết quả liên chặng |
|---|---|---|---|
| **Vách** | tạo hai điểm, layer, opening, offset, đo, replace finish | location line, dài/cao, core, lớp hoàn thiện, opening, fire/acoustic nếu có, detail | room boundary, mặt cắt, diện tích finish, wall schedule |
| **Sàn** | boundary, split, pattern, direction, threshold, apply finish | cao độ, build-up, tile/board size, grout, hướng vân, waste | hatch, area, BOQ đặt hàng, material board |
| **Trần** | boundary, height, grid, cove, fixture, ceiling plan | cao độ, system, service void, hốc sáng, maintenance/access | RCP, fixture schedule, diện tích, lux source |
| **Đồ rời / joinery** | place, align, rotate, mirror, array, clearance, replace type | anchor/host, kích thước, variant, material roles, clearance, LOD, BOM | furniture schedule, layout, camera collision, BOQ |
| **Đèn** | place, aim, copy, group, daylight, camera exposure | host/mounting, lumen, CCT, beam, dimming, IES/LDT, target lux | lighting layout, estimate lux, render recipe, fixture schedule |
| **Material binding** | apply, sample, UV scale/orient, pattern, paint face | PBR maps, scale, rotation, finish, mapping, supplier/spec, detail | render surface, hatch, coverage, BOQ waste |

Các nhóm này mượn đúng phần đáng giá: category/parameter theo họ đối tượng của Revit, panels modeless theo ngữ cảnh của SketchUp, và asset có metadata thay vì chỉ là file. Category quyết định parameter/hành vi; panel giữ sẵn vật liệu, component, tag và scene khi đang dựng. [Revit Family Category and Parameters](https://help.autodesk.com/cloudhelp/2025/ENU/Revit-Customize/files/GUID-68EFCA67-4913-4E00-AB9E-F2E6A7BEF8C6.htm) [SketchUp Dialog Boxes and Trays](https://help.sketchup.com/en/sketchup/dialog-boxes-and-trays)

## 4. Master Library: dữ liệu trước, thumbnail sau

### 4.1 Các object chung

| Object | Sự thật nó giữ | Không giữ |
|---|---|---|
| **AssetDefinition** | taxonomy, tags, author/provenance, licence, versions, preview, default type | vị trí trong từng dự án |
| **ElementType** | category, param schema, host rules, geometry recipe, 2D symbol, BOQ rules | transform của instance |
| **ProjectInstance** | level/room/host, transform, overrides, selection state | không copy Type |
| **MaterialDefinition** | maps PBR, physical/display properties, size, datasheet, quality/provenance | giá/stock mặc định toàn cầu |
| **MaterialBinding** | material role gắn vào face/object, UV, orientation, coverage | tạo bản sao material |
| **SupplyOffer** | vendor, region, currency, lead time, stock, MOQ, valid-from/to | không trộn vào material definition |
| **ToolRecipe** | input schema, safe defaults, preview, output schema, version | không phải một lệnh bí ẩn |
| **RenderRecipe** | camera, light, environment, passes, background, resolution, format | geometry gốc |

### 4.2 Một vật liệu đủ để làm việc

Vật liệu trong kho không phải quả cầu đẹp. Nó gồm: thumbnail; PBR maps (base color, roughness, normal/bump, metalness/opacity khi có); quy cách/kích thước; hướng/pattern; hãng, mã, datasheet; chứng nhận/provenance; 2D hatch/detail; units/coverage/waste; `SupplyOffer` theo nơi và thời điểm; và mapping BOQ. Khi kéo lên vách, IF tạo `MaterialBinding`, để cùng definition có thể hiện khác trên sàn, trần hoặc đồ rời mà không nhân bản dữ liệu.

### 4.3 Nhập kho

1. Người dùng kéo file, ảnh, link hoặc folder vào **Inbox**.
2. App đọc metadata có thể đọc được; người dùng xác nhận category và licence/nguồn.
3. Chọn “đóng gói thành”: material, component, luminaire, preset, detail, template hoặc linked model.
4. Tool editor phù hợp mở schema tối thiểu; field không biết để `unknown`, không bịa dữ liệu.
5. Preview proxy, 2D representation, BOQ mapping và stage adapters được sinh/rà soát.
6. Publish lên Master Library; mỗi dự án chỉ instantiate/bind. Mọi version và provenance còn nguyên.

## 5. FlowRender là bảng kết quả, không phải lớp AI

### Đầu vào

- **Scene resolution:** room/level, các instance, visibility/tags, linked models, mặt bằng/Doc.
- **Surface resolution:** MaterialBinding, UV, pattern, maps PBR, coverage.
- **Camera:** lens, eye height, crop, safe frame, target/DOF nếu render engine có.
- **Lighting:** sun/time/location khi được khai báo, fixture placement, CCT/lumen/IES-LDT, environment; preset chỉ là recipe được “giải nén” thành các tham số này.
- **Images/boards:** ảnh tham chiếu chỉ là reference hoặc backplate có quyền rõ, không bị biến thành geometry không truy vết.

### Công việc FlowRender

1. Resolve Doc → type → instance → bindings; chỉ báo thiếu input thật.
2. Dựng preview; người dùng khoá camera/seed/region nếu engine hỗ trợ.
3. Chạy check: missing map, scale lỗi, không có host, IES thiếu, asset licence không rõ, BOQ mapping thiếu.
4. Render nháp hoặc final; final tạo revision không ghi đè mù.

### Đầu ra

| Output | Bắt buộc còn liên kết |
|---|---|
| RGB still / sequence | camera, RenderRecipe, source Doc revision |
| PNG alpha / EXR | alpha rule, background rule, pass set |
| Depth / normal | render engine + camera revision |
| Material / object / room ID | MaterialBinding, instance ID, room/level |
| Present board | output frame + caption/source/date/revision |
| BOQ delta | instances + type + material coverage, không suy đoán từ pixel |

## 6. Vitals ở chuỗi này

Vitals không được thay thế tool editor. Nó chỉ giúp tìm đúng recipe, chuyển mô tả thành **preview có thể xem**, hỏi phần còn thiếu và nêu impact trước khi ghi. Ví dụ: “vách gỗ nan cao 2,7 m, cách 20 mm” mở Wall/Finish recipe, tạo preview + các câu hỏi về host, material, profile; người dùng xác nhận rồi mới tạo Type/Instance. Vitals có thể gọi MCP qua adapter có allowlist và provenance, nhưng không để MCP tự ghi Master Library/Doc hay tự render-final không có preview/undo.

## 7. MVP để đưa vào app

1. Schema và identity: 6 category trên, type/instance, MaterialBinding, source/provenance.
2. Vách/sàn/trần/đồ rời/đèn có dock + inspector đúng bảng trên; context menu + shortcut trước khi làm mesh editor.
3. Material import → binding → 3D preview, hatch/coverage/BOQ mapping.
4. FlowRender recipe versioned: camera, light preset đã giải nghĩa, resolution/format/alpha/background; xuất RGB trước, IDs/passes sau.
5. Linked import có revision/provenance; model phức tạp vẫn dùng được mà không hứa native edit.

Mesh/node editor tổng quát chỉ mở sau khi 5 bước này chạy được qua cùng một Doc. Không dựng “rừng node” cho thao tác mà một field/type/recipe giải được.
