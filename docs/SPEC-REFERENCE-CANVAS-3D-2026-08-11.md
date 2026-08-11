# Reference Canvas → Spatial Model

## 1. Đây là tính năng gì

Tên trong IF: **Reference Canvas** (VI: *Lớp tham chiếu*). Nó là ảnh/PDF/drawing được đặt trong không gian 2D hoặc 3D có tỷ lệ, nguồn và vai trò cụ thể. Không gọi là “image to 3D” vì ảnh không tự tạo được mô hình/BOQ đáng tin.

Video *3D Canvas* người dùng gửi minh hoạ hướng dùng một ảnh 2D như nền để dựng một cảnh có chiều sâu. IF nên lấy tư duy canvas đó, nhưng đặt nó vào ngữ cảnh kiến trúc: ảnh là đầu vào có truy vết; geometry chỉ có giá trị sau khi người dùng xác nhận.

## 2. Sáu vai trò của một ảnh

| Vai trò | Dùng khi | Nó tạo ra | Không được suy diễn |
|---|---|---|---|
| **Underlay** | mặt bằng scan/PDF/ảnh tay | nền để trace, có thể đo tỷ lệ | tường/cửa đã đúng tuyệt đối |
| **Reference plane** | elevation, detail, furniture photo | ảnh treo trong world/camera plane để dựng theo | kích thước thật nếu chưa calibrate |
| **Texture source** | gỗ, đá, giấy dán tường, vải in | MaterialDefinition hoặc MaterialBinding | quy cách, nhà cung cấp, stock |
| **Projection / decal** | artwork, wallpaper, biển hiệu | layer mặt đứng hoặc decal có vị trí | structural geometry |
| **Backplate / image plate** | phối cảnh, bầu trời, site background | input FlowRender hoặc Present | object trong scene/BOQ |
| **Depth board** | concept nhanh, parallax, storyboard | các lớp depth để quay camera nhẹ | mô hình BIM hoặc lượng thi công |

Blender có cùng ý niệm ở mức cơ bản: Image-as-Plane tự tạo plane theo tỷ lệ ảnh, material texture và có thể là sequence; SketchUp cho nhập ảnh như entity, texture hoặc nền để trace. [Blender Mesh Plane](https://docs.blender.org/manual/en/4.4/modeling/meshes/import_images_as_planes.html) [SketchUp 2D images](https://help.sketchup.com/en/sketchup/importing-and-using-2d-images)

## 3. Bốn mức tin cậy — điều kiện để không sai hồ sơ

Mỗi output sinh từ Reference Canvas phải mang provenance:

1. **Reference** — ảnh chỉ để xem; không đi vào Doc/BOQ.
2. **Inferred** — app gợi ý line, vùng, depth, category; luôn có confidence và không đưa BOQ.
3. **Confirmed** — người dùng chỉnh/xác nhận; trở thành instance trong Doc, vẫn lưu link về ảnh nguồn.
4. **Measured** — được calibrate từ kích thước/đo thực/nguồn kỹ thuật; mới đủ điều kiện tính lượng, trừ khi người dùng override.

Không có đường tắt từ ảnh moodboard sang con số thi công.

## 4. Canvas workflow cho chặng Không gian & Phối cảnh

### A. Từ mặt bằng/scan thành không gian

1. Import ảnh/PDF → chọn **Underlay**.
2. Đặt hai điểm chuẩn và nhập kích thước thật; IF hiện sai số/tỷ lệ.
3. Khoá, chỉnh opacity/blend, chọn tầng và origin.
4. Trace tay hoặc nhận gợi ý đường tường; snap theo grid/axis.
5. Gán semantic: wall, opening, room boundary, floor, ceiling region.
6. Xác nhận → tạo Wall/Floor/Ceiling Type + Instance vào cùng Doc.
7. Vách hai điểm và room boundary mới là nguồn dựng 3D, không phải bitmap.

### B. Từ ảnh nội thất / elevation thành component

1. Import → chọn **Reference plane** và gắn vào wall/floor/camera plane.
2. Calibrate bằng một kích thước biết trước hoặc để `unmeasured`.
3. Dùng tool editor của category: Wall, Surface, FF&E hoặc Lighting.
4. Vẽ/truy dấu profile, opening, panel, đồ rời; mỗi phần mới có category riêng.
5. Texture/crop từ ảnh chỉ tạo *candidate Material*; tên/mã/nhà cung cấp không biết thì để trống.

### C. Từ ảnh concept thành depth scene

1. Segment foreground/midground/background thành layer, cho phép sửa mask.
2. Gán relative depth, camera, parallax range; canvas tạo proxy/card, không tạo kiến trúc.
3. FlowRender có thể quay camera nhẹ hoặc đưa vào Present storyboard.
4. Nếu muốn thành model, người dùng chọn các vùng và “Promote to component”; lúc đó mới mở editor/category.

## 5. Dữ liệu cần lưu

```text
ReferenceCanvas
  id, sourceAssetId, sourceUrl/license, role, revision
  coordinateSpace: paper | world | camera
  transform, calibrationPoints, scale, accuracy
  opacity, lock, visibility, stageScope

TraceLayer
  canvasId, strokes/polygons, semanticSuggestion, confidence

DerivedElement
  sourceCanvasId, sourceRegionId, provenance: inferred|confirmed|measured
  entityId/typeId, reviewer, createdAt

DepthBoard
  canvasId, depthLayers, masks, relativeDepth, parallaxLimit
```

`ReferenceCanvas` không được biến thành một `MaterialBinding` hay `ProjectInstance` chỉ vì nó cùng dùng file ảnh. Role là khác nhau.

## 6. UI tối giản

- Khi không chọn Reference Canvas: không thấy panel ảnh.
- Khi chọn: inspector chỉ có **Role · Tỷ lệ · Plane · Opacity · Lock · Provenance**.
- Chuột phải: *Calibrate · Trace · Tạo mask · Gắn vào mặt · Đổi vai trò · Hỏi Vitals*.
- Tool editor mở theo role: Trace Editor, Surface/Texture Editor, Projection Editor hoặc Depth Board Editor.
- Vitals chỉ có thể đề xuất semantic/scale và tạo **preview**; phải hiện “inferred” trước khi Promote to component.

Blender cũng tách drawing plane ra khỏi drawing và dùng canvas overlay để người dùng biết mình đang vẽ trên mặt phẳng nào. Đây là chi tiết IF nên học để tránh trace nhầm tầng/mặt. [Blender Drawing Planes](https://docs.blender.org/manual/en/3.0/grease_pencil/modes/draw/drawing_planes.html)

## 7. Liên kết với FlowRender và video

| Canvas role | FlowRender dùng thế nào | Ra output gì |
|---|---|---|
| Underlay / reference | chỉ làm guide, ẩn ở final mặc định | Doc/geometry đã confirm |
| Texture source / projection | resolve thành material/decal có scale | beauty render + material ID |
| Backplate | background hoặc camera plate | RGB/alpha theo rule output |
| Depth board | proxy theo camera, giới hạn parallax | concept still / motion preview |

**Video:** một ảnh là một `ShotCard` trong dữ liệu; UI có thể gọi là “Cảnh”. ShotCard giữ source image, camera, duration, motion recipe, prompt/seed nếu có, music decision và status review. Nhiều card tạo timeline nháp; chỉ sau preview mới cho “Xem” hoặc “Chỉnh trong Video Editor”. Nếu chọn chỉnh, Stage Present nhận timeline/footage, không tạo một scene 3D thứ hai.

Các render pass như depth/object ID là output có ích cho mask, hậu kỳ và trace back; không phải hiệu ứng trang trí. Movie Render Queue của Unreal tách final image, object IDs và các pass khác; PNG/EXR có thể hỗ trợ alpha theo thiết lập output. [Unreal cinematic render passes](https://dev.epicgames.com/documentation/unreal-engine/cinematic-render-passes-in-unreal-engine) [Unreal output formats](https://dev.epicgames.com/documentation/it-it/unreal-engine/rendering-high-quality-frames-with-movie-render-queue-in-unreal-engine)

## 8. MVP nên làm

1. Underlay ảnh/PDF + calibrate 2 điểm + lock/opacity + trace tay/snap.
2. Promote traced geometry thành Wall/Floor/Opening/Room có provenance.
3. Image-as-texture theo đơn vị thật, crop/repeat/orientation; không tự tạo thông tin mua hàng.
4. Backplate/camera plate của FlowRender, cùng source/license/revision.
5. Depth board chỉ cho concept/Present, đánh dấu `inferred`, không BOQ.
6. ShotCard và handoff sang Video Editor sau khi Present có timeline thật.

Không đưa MCP vào thao tác canvas mặc định. Nếu cần model vision/generate, IF gọi qua adapter có nguồn, preview, quota và undo; MCP không được tự ghi geometry/BOQ hay publish asset vào Master Library.
