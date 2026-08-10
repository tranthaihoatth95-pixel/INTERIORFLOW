# 3D Modeling MVP — Shell & tool hierarchy

## Quyết định

InteriorFlow không sao chép nguyên một DCC. Workspace 3D chia theo bản chất công việc, cùng một `Doc`:

1. **Model** — dựng nhanh kiểu SketchUp: Select · Line/Rectangle/Arc · Push/Pull · Offset · Move/Rotate/Scale · Tape Measure. Mọi lệnh nhận số tức thời; một thao tác tạo một bản ghi hoàn tác.
2. **Components** — cấu kiện kiểu Revit: Wall · Floor · Ceiling · Door · Window · Stair · Casework. Mỗi cấu kiện có Type và Instance; theo tầng, phòng, trần/tường/sàn; gắn BOQ và vật liệu.
3. **Edit Mesh** — dựng chi tiết kiểu Blender/3ds Max: Object / Vertex / Edge / Face, Extrude · Inset · Bevel · Loop Cut · Bridge · Knife · Weld · Mirror · Array · Solidify. Đây là editor phụ, chỉ mở khi người dùng “Convert to mesh”; không chen vào luồng làm nội thất thông thường.

## Điều học được và áp dụng

| Nguồn | Điểm dùng được | Áp dụng cho IF |
|---|---|---|
| SketchUp | thanh công cụ ngắn, lựa chọn → thao tác trực tiếp trên viewport, Push/Pull + nhập số | Dock thu gọn chỉ giữ lệnh đang dùng; `P` Push/Pull; dấu số là điểm vào chính xác, không dựng một form nặng |
| Revit | cấu kiện có ngữ nghĩa, Type/Instance, Levels và Category | Cây 3D luôn theo **Tầng → Category → Component**; thêm bộ lọc Sàn/Tường/Trần/Đồ rời và visibility riêng |
| 3ds Max | ribbon phụ thuộc selection, cấp sub-object và modifier stack | Khi mesh được chọn mới hiện nhóm Edit Mesh; màn trống không có ribbon lệnh chết; modifier stack giữ khả năng quay lại |
| Blender | mode Object/Edit rõ ràng, công cụ đặt gần canvas, phím tắt nhất quán | `Tab` đổi Object/Edit Mesh, `1/2/3` đổi Vertex/Edge/Face khi đang Edit; thanh công cụ chỉ hiển thị công cụ hợp lệ |

## Shell đã chốt

- Canvas là trung tâm; không đặt checklist/trình tự nổi trên canvas.
- Dock là kính lỏng, thu gọn mặc định; mở rộng theo nhóm công việc, không phải danh sách icon dài.
- Inspector/cây đối tượng không phải kính: nền đặc để đọc số liệu, layer và cấu kiện.
- Vitals là cửa vào cho mô tả ngôn ngữ tự nhiên; không gọi là Magic và không có nút giả. Khi tạo được lệnh, Vitals phải hiện Type + kích thước + vị trí để duyệt trước.
- ViewCube nhỏ, trong suốt, chỉ là định hướng; không cạnh tranh thị giác với mô hình.

## MVP build theo thứ tự

### M1 — Dựng nội thất có thể làm việc (ưu tiên)

- Lệnh tạo tường bằng hai điểm + nhập chiều dài/dày/cao; không dùng “tường mẫu”.
- Push/Pull mặt trên có sẵn; nối chọn đối tượng, Move/Rotate, duplicate và snap.
- Tạo Floor/Ceiling từ biên phòng; cây 3D category filter theo Floor/Wall/Ceiling/Furniture/Lighting.
- Hotkeys: Space chọn, L line, R rectangle, P push/pull, M move, Q rotate, S scale, B material, Ctrl/Cmd+Z undo.

### M2 — Cấu kiện chuyên nghiệp

- Door/window host vào tường; cầu thang/cabinet/ceiling parametric; Type/Instance + level/room.
- Inference/snap: endpoint, midpoint, face, axis, perpendicular; số nhập theo đơn vị dự án.
- Visibility theo tầng/category, isolate/hide, section box; material assignment theo face/category.

### M3 — Edit Mesh (không trước M1/M2)

- Convert component → editable mesh có cảnh báo mất liên kết Type/BOQ.
- Object/Vertex/Edge/Face, Extrude/Inset/Bevel/Loop Cut/Mirror/Array/Knife/Weld.
- Modifier stack không phá huỷ: Mirror, Array, Bevel, Solidify; Bake/Apply có xác nhận.

## Ranh giới

- Chưa làm sculpt, simulation, UV hoặc node material; chúng không giải quyết điểm nghẽn dựng nội thất MVP.
- Không hiện nút “chưa có” trong dock compact. Các công cụ chưa nối chỉ hiện khi người dùng mở nhóm Edit Mesh, với trạng thái disabled và lý do.
- Trình tự nghề nằm trong Vitals/Help theo ngữ cảnh, không thành hộp nổi thường trực.

## Nguồn nghiên cứu

- SketchUp Main Toolbar + Push/Pull: https://help.sketchup.com/en/sketchup-web/sketchup-web-main-toolbar
- 3ds Max Graphite Modeling Tools: https://help.autodesk.com/cloudhelp/2021/ENU/3DSMax-Modeling/files/GUID-1D637181-862A-49C9-B6BE-4E7982549C57.htm
- 3ds Max ribbon context/selection: https://help.autodesk.com/cloudhelp/2025/ENU/3DSMax-Basics/files/GUID-F2C0C6D6-968E-40F1-9474-5A7FC44FBC06.htm
- Blender Modeling manual: https://docs.blender.org/manual/en/latest/modeling/index.html
