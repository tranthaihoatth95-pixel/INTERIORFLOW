# KHO HOÀ NÓI · sổ tổng

> Máy giữ ý, chống trôi. T commit khi Hoà bấm "Sao chép cho T" trên artifact.
> Cách đọc: `mau` (họ) → dòng dưới là các ý cụ thể, sắp theo họ đông nhất.
>
> Artifact: https://claude.ai/code/artifact/c369a03d-6fd0-4eed-b2ba-c2aa13a49d80

## file-manager  (1)

- **Files có HAI TẦNG khác chức năng** (Hoà đưa mock 17/08 tối):
  · **Tầng trên · Thư mục hệ thống có QUYỀN** — 5 thư mục:
    ① Dự án (24 thư mục · Theo dự án · avatar+cập nhật)
    ② Studio dùng chung (186 tệp · Toàn studio)
    ③ Nhà cung cấp (42 nguồn · Biên tập giới hạn)
    ④ Đã duyệt (328 nội dung · Chỉ đọc)
    ⑤ Lưu trữ (1.204 tệp · Quản trị viên)
  · **Tầng dưới · Collection+** (bỏ "My" hoặc giữ, tuỳ) — các gói component:
    ① Vật liệu (126, PBR · Cá nhân · COL-MAT-001)
    ② Furniture (54 · 2D/3D · Chia sẻ nhóm · COL-FUR-003)
    ③ Chi tiết điển hình (36 · Studio · COL-DET-002)
    ④ Cây · người (22 · Chia sẻ nhóm · COL-PLC-001)
    ⑤ Design DNA (8 thẻ · Studio · COL-DNA-001)
    ⑥ Gói học từ dự án (12 · Chia sẻ nhóm · COL-LEA-001)
    ⑦ Mẫu trình bày (18 · Chia sẻ nhóm · COL-PRE-001)
    ⑧ Cách làm (7 quy trình · Cá nhân · COL-PRO-001)
  · **Collection+ = KHO NGUỒN của IF** — nơi dữ liệu được **chưng cất** thành vật liệu/mẫu áp cho dự án.
  · Bộ lọc: Loại · Nguồn · Trạng thái · Cập nhật.
  · Mã collection dạng `COL-<LOẠI>-NNN`.
  · Ảnh preview thư mục = folder + content peek (kiểu Apple Files).

## design-system / toolbar  (1)

- **Toolbar nên NỔI, không dính thành** (Hoà 17/08 tối):
  · Neo TRÊN hoặc GIỮA (theo chiều dọc), tuỳ nhiều hay ít item
  · **Auto grid** — tự sắp lưới theo số item
  · **Kính lỏng** — liquid glass
  · **Auto hide** — tự ẩn khi không dùng
  · ⚠️ Có ảnh Hoà gửi kèm — chưa nhìn được (message chưa upload lên chat)

## vitals  (1)

- **Vitals thành icon TRÒN NHỎ nằm TRÊN thanh tìm kiếm** (Hoà 17/08 tối):
  · Tìm bình thường → không có gì lạ
  · Bấm Vitals → thanh tìm chuyển sang chế độ "tối" + **effect viên linh sáng nhiều màu**
  · Đây là chi tiết hoá chốt 16/08 (Vitals cạnh ô tìm → nay cụ thể là "trên" + có effect chuyển chế độ)

## bug  (1)

- **Dashboard Home sai HOÀN TOÀN hệ design system** (Hoà chê 17/08 tối, ảnh chụp app thật cổng 3000):
  · Card không kính lỏng (backdrop-filter = 0 chỗ)
  · Không ambient tint chuyển sắc mép
  · Chữ số ô 01/02/03 mono khai lộ, không mang tin
  · Widget đè nhau, khoảng thở lệch
  · Ảnh render (03 THIS WEEK'S FRAME) placeholder không khung
  · Ghi chú: rail router V1 (vừa dựng chiều) CHƯA MOUNT vào HomeScreen → dashboard không có sidebar
  · Đợt C đang chạy (2 phiên): P-ROUTER-HOME + P-DASHBOARD-DS
