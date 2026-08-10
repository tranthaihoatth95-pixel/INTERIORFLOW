# KẾ HOẠCH MVP TỔNG — 10/08/2026

> Mục tiêu: ít tính năng nhưng mỗi tính năng giải trọn một việc thật. Một `Doc` + `ProductSpec`
> là nguồn sự thật; AI tạo bản nháp có provenance/confidence, người dùng duyệt trước khi lan rộng.

## Trục chung toàn app

1. **Vitals hợp nhất**: một điểm vào, gọi đúng Design/Shape/Render/BOQ/Present Magic theo ngữ cảnh.
2. **Project flow và chặng lẻ ngang nhau**: vào chặng nào cũng làm được; file có sẵn nhập thẳng tại đó.
3. **Cấu kiện nhiều ngữ nghĩa**: hình học 2D/3D, `specId`, vật liệu, thương mại, lịch sử và trạng thái duyệt.
4. **Master Library thật**: ProductSpec, MaterialSpec, custom furniture, Layout Kit; bỏ dần dữ liệu mock.
5. **Lưu trữ độc lập**: thư mục dự án là nguồn thật; Lark chỉ là adapter, không phải lõi dài hạn.

## Thứ tự thi công

### P0 — Khóa nguồn dữ liệu xuyên chặng

- Material Impact: xem trước nơi bị ảnh hưởng; đổi một món/phòng/loại/toàn dự án; Undo một nấc.
- `matId/specId` nuôi 2D, 3D, BOQ, Material Board, mặt đứng và Present.
- Manifest/phiên bản/backup và kiểm tra file thiếu trước khi mở rộng AI.

### P1 — Magic hữu dụng, không tốn credit vô ích

- BOQ Form + BOQ Magic: form dựng sẵn sinh bảng thật; nhập/xuất XLSX; dữ liệu gắn entity.
- Present Magic: nội dung quyết định số slide; thiếu ảnh dùng placeholder có nghĩa; Brand Kit tự áp.
- Vitals hợp nhất hai affordance hiện tại thành một trợ lý, giữ Notebook là chế độ sâu.

### P2 — Element & Material Intelligence

- Smart Select/Brush → tách furniture, decor, tường, trần, sàn và nhóm bố trí.
- Ảnh → Visual Asset/ProductSpec nháp; phân biệt Visual/Estimated/Verified.
- Trích vật liệu từ ảnh → ảnh tham chiếu, mô tả, PBR ước đoán; không bịa hãng/mã/giá.
- Dùng lại `single-view-metrology`: điểm tụ + neo tỉ lệ + sai số; không viết lại thuật toán hình học.
- Sinh plan/front/side có nhãn độ tin cậy; chỉ số đã neo/xác nhận mới được dùng như kích thước thật.

### P3 — Chặng 2 đắt giá

- Mood/Collab kiểu bảng làm việc; kết quả duyệt đóng thành Thẻ gu có ảnh, palette, matId và ràng buộc.
- Shape Magic: mô tả → khối tham số + lịch sử phép dựng, sửa tay được.
- Render Magic: clay/depth khóa hình học, mask cục bộ, đổi vật liệu, before/after, camera/light, hàng đợi.
- Góc render và vật liệu đã chốt nuôi trực tiếp Spec, Material Board và Present.

### P4 — Hồ sơ nghề hoàn chỉnh

- Spec mua sẵn, configurable và custom furniture; Product Sheet + Design Specification.
- Mặt bằng/mặt đứng/chi tiết có mã; Material Board A3; FF&E/BOQ; axonometric và video ngắn.
- Nhập/xuất nghề theo độ trung thực thật: FBX → IFC; PDF/DOCX/media/HTML; tăng fidelity PPTX.

## Cửa an toàn

- AI không tự ghi đè phương án đã duyệt; luôn có impact preview, version và Undo.
- `Estimated` không được đổi nhãn thành `Verified` nếu chưa có neo kích thước/nguồn kỹ thuật.
- Không nhúng asset tham khảo, thương hiệu studio hay dữ liệu khách vào sản phẩm global.
- Không thêm ngữ nghĩa nếu chưa có nơi tiêu thụ; không thêm định dạng chỉ để hiện tên hỗ trợ.

