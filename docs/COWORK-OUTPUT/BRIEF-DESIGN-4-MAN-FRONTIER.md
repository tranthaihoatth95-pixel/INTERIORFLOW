# BRIEF · 4 MÀN FRONTIER → Claude Design
### Dán TỪNG khối vào Claude Design (mỗi màn 1 lần). Sinh xong lưu `.dc` như các màn trước.

## HỆ THỐNG — dán KÈM mỗi màn (bắt buộc)
> Theme **Tối** làm chính (kèm bản Sáng). Màu & khoảng cách **dùng token var**
> (`--bg --card --panel --border --accent --accent-soft --t1..t5 --success --warning --danger --radius --ease-apple --shadow-pop`).
> **CẤM** hardcode hex/px · **CẤM** thương hiệu (TTT, #F06020, #002850) · **CẤM** lộ tên hàm/jargon nội bộ trên UI.
> Data mẫu **trung tính** (dự án mẫu "Căn hộ Thảo Điền", KHÔNG tên khách thật). Phong cách thẻ bo tròn, crisp — như trang "Bảng nút".

---

## 1 · NHẬN ĐỀ BÀI (brief intake)
Màn nhập đề bài để máy tự bố trí văn phòng. Gồm:
- Số nhân sự (ô số lớn).
- Phòng ban: danh sách thêm/xoá dòng — tên phòng + số người.
- Không gian chung cần có: chip chọn nhiều — lễ tân · phòng họp lớn · phòng họp nhỏ · pantry · booth gọi điện · lounge · kho · phòng máy chủ.
- Diện tích sàn (m²) · khổ/tỉ lệ.
- Nút **"Tạo bố trí"**.
- Panel phải: tóm tắt **tổng chỗ cần vs diện tích có** (đạt/thiếu).

## 2 · INSPECTOR CẤU KIỆN
Panel bên phải, hiện khi chọn 1 vật trên bản vẽ. Gồm:
- Tên + loại (cột / tường / cửa / nội thất) — **badge phân biệt "Khai báo" (chắc, đậm) vs "Suy đoán" (máy đoán, mờ hơn)**.
- Kích thước rộng × sâu × cao.
- Vật liệu + màu (ô màu) · layer · mã sản phẩm (nếu có) · phòng/vị trí.
- Nút **Sửa**.
- Chọn nhiều vật → hiện đếm + chỉ thuộc tính chung.

## 3 · KẾT QUẢ ZONING
Hai phần cạnh nhau:
- (Trái) mặt bằng chia khu, **tô màu theo khu** (làm việc / họp / chung).
- (Phải) bảng kiểm: Khu · Diện tích m² · Số chỗ · Chuẩn (m²/người) · **Đạt/Không (badge xanh/đỏ)**.
- Trên cùng: tổng diện tích · tổng chỗ · % đạt.

## 4 · BẢNG N MÓN FF&E
Bảng nhiều dòng, mỗi món:
- Ảnh thumbnail · mã · tên · finish · vendor · đơn giá · số lượng · **ô duyệt (checkbox "duyệt trước sản xuất")**.
- **Nhóm theo phòng** (header nhóm).
- Trên cùng: nút **Thêm món** · **Xuất (PDF/xlsx)**.
- Cuối bảng: tổng tiền. Dòng chưa duyệt highlight nhẹ.
