# Output capability matrix · internal R1

Mục tiêu: một hành động trong Trình chiếu chỉ được bật khi người dùng có thể hoàn tất nó, lưu lại và biết đầu ra nhận được. Bảng này là gate nghiệm thu nội bộ; không dùng nhãn “sắp có” như một CTA.

| Loại hồ sơ | Tình trạng R1 | Luồng thật | Đầu ra / giới hạn phải nói rõ |
|---|---|---|---|
| Deck | Sẵn sàng nội bộ | chọn mẫu hoặc trang trống → dàn trang → lưu `.idfp` / project state | PDF, PNG, PPTX theo những đường export hiện có; fidelity PPTX có giới hạn |
| Bảng vật liệu A3 | Sẵn sàng như workspace dàn trang | mở canvas A3 ngang → tự thêm ảnh, chữ, bảng màu → lưu `.idfp` | Đây là board thủ công trên editor chung, chưa phải hệ thống tự lập schedule vật liệu |
| BOQ | Sẵn sàng nội bộ | dữ liệu dự án → BOQ → chỉnh / nhập bảng tính | XLSX; kiểm lại số liệu nguồn trước phát hành |
| Văn bản / thuyết minh / biểu mẫu | Khoá | không có editor hoặc export tài liệu | Không mở slide để thay thế một văn bản pháp lý hay biểu mẫu |
| Video | Khoá | footage/camera path xem ở Thiết kế 3D | Không có trim, timeline hoặc xuất MP4 tại Trình chiếu |
| HTML / web page | Khoá | không có route hay bundle | Không tuyên bố hỗ trợ import/export HTML |

## Kiểm trước khi đưa cho studio

- Tạo mới Deck, Board A3 và BOQ; đóng/mở lại dự án, nội dung vẫn còn.
- Mỗi nút export bật phải tạo đúng tệp; nếu thiếu nguồn/khổ hợp lệ, nêu lý do tại chỗ.
- Văn bản, Video, HTML không có CTA tạo, tải lên hoặc export giả.
- Không dùng tên studio, logo, palette hoặc hình ảnh khách làm mặc định. Brand Kit chỉ lấy từ dự án đang mở.
- Kiểm VI/EN, bàn phím, màn tablet; tooltip và icon có nhãn trợ năng.
- Chạy typecheck và suite test trước merge; nghiệm thu lại trên build desktop sạch.

## Không thuộc R1

Document editor có revision/approval, biểu mẫu nghiệm thu, hợp đồng song ngữ, dựng video/timeline/MP4, import DOCX/PDF, review link và cộng tác realtime. Các mục này chỉ được mở lại khi có model lưu trữ, undo và export kiểm chứng được.
