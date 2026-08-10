# CHỐT · Design DNA + Camera/Video — 10/08/2026

## 1. Design DNA không phải “copy hình tham khảo”

Ảnh cây, hoa, logo, địa phương hoặc vật thể được phân rã thành dữ liệu có nguồn:

`Nguồn → hình thái/đường nét → motif → quy tắc lặp/biến thể → ứng dụng đề xuất`

Kết quả là một **Design DNA Draft** nằm trong Thẻ gu, gồm SVG/path chỉnh được, palette, nhịp,
tỉ lệ, từ khoá, nguồn và quyền sử dụng. Designer duyệt rồi mới cho chảy sang:

- pattern/hatch 2D;
- vật liệu và texture có tỉ lệ;
- vách, sàn, trần, tay nắm, decor hoặc cấu kiện tuỳ biến;
- Shape Magic/Render Magic;
- trang concept trong Present.

Không tự bịa ý nghĩa văn hoá. Không tự coi ảnh Internet là tài sản dùng thương mại. Mỗi biến thể phải
truy ngược được ảnh nguồn và quyết định của designer.

## 2. Tách hai engine để dữ liệu không lẫn

- **Material Intelligence** đọc bề mặt: màu, texture/PBR, mapping, mã/spec, nhà cung cấp.
- **Design DNA** đọc ngôn ngữ tạo hình: contour, module, nhịp, đối xứng, lặp, biến dạng, ứng dụng.

Hai engine có thể cùng đọc một ảnh nhưng tạo hai loại dữ liệu khác nhau, rồi liên kết qua Thẻ gu và
ProductSpec/MaterialSpec đã duyệt.

## 3. Camera/Video MVP

Người dùng chọn ý đồ nghề thay vì viết prompt kỹ thuật:

1. Đi thấp sát sàn.
2. Bám theo.
3. Hé lộ không gian.
4. Tiến vào điểm nhấn.
5. Orbit quanh đối tượng.

Preset sinh ra chiều cao máy, lens, tốc độ, easing, stabilization, look-at và **polyline/keyframe thường**.
Người dùng luôn kéo sửa được; preset không khoá shot. Dùng chung một camera source cho preview 3D,
render video và đoạn media đưa sang Present.

MVP chỉ cảnh báo hình học suy được từ đường quay. Xuyên tường/sàn/đồ phải kiểm lại trên scene 3D thật;
không tuyên bố “đã an toàn” chỉ từ prompt.

