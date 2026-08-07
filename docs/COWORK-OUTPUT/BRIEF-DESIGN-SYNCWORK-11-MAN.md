# BRIEF · CỤM SYNCWORK + KHÁCH (11 màn) → Claude Design
### Dán TỪNG khối vào Claude Design (kèm HỆ THỐNG). Lưu `.dc` vào cùng project.

## HỆ THỐNG — dán kèm mỗi màn (bắt buộc)
> Theme **Tối** chính (kèm Sáng). Màu & khoảng cách **dùng token var** (`--bg --card --panel --border --accent --accent-soft --t1..t5 --success --warning --danger --radius --ease-apple --shadow-pop`).
> CẤM hardcode hex/px · CẤM brand (TTT, #F06020, #002850) · CẤM jargon nội bộ trên UI.
> Data mẫu trung tính (dự án "Căn hộ Thảo Điền"). Phong cách crisp như "Bảng nút".
> **SyncWork = lớp workspace của IDF** (đồng bộ IF·ArchiNote·Larkbase) — không phải app rời.

---

## A · QUẢN LÝ CÔNG VIỆC (SyncWork lõi)

**1 · Kanban** — cột Việc: Cần làm · Đang làm · Chờ duyệt · Xong. Thẻ: tiêu đề · dự án · người · nhãn màu · hạn. Kéo thả giữa cột. Lọc theo dự án/người. Nút thêm thẻ mỗi cột.

**2 · Gantt / tiến độ** — trục thời gian ngang, mỗi dòng một việc/giai đoạn (thanh kéo dài theo ngày), có mốc (diamond), đường phụ thuộc. Nhóm theo dự án. Hôm nay = đường dọc. Zoom ngày/tuần/tháng.

**3 · Lịch / nhắc việc** — lịch tháng + danh sách "hôm nay/tuần này". Sự kiện: hạn việc · mốc dự án · họp. Ô nhắc nhở bên phải.

**4 · Tổng quan dự án (dashboard)** — thẻ tổng: số dự án · việc trễ hạn · % tiến độ. Danh sách dự án (ảnh · tên · trạng thái · % · người). Biểu đồ nhỏ tiến độ. Việc cần chú ý.

## B · CỘNG TÁC & TRI THỨC

**5 · Chat nhóm / cộng tác** — khung chat theo dự án/kênh: tin nhắn · đính kèm (ảnh/bản vẽ) · trích dẫn node/màn IF · phản hồi. Danh sách kênh trái. Nút gắn việc từ tin nhắn.

**6 · Vitals (trợ lý AI)** — panel trợ lý: ô chat AI + gợi ý theo ngữ cảnh dự án (chấm điểm thiết kế, nhắc chuẩn, tra vật liệu). Thẻ "sức khoẻ dự án" (vitals). Không lộ tên model/hàm.

**7 · Notebook** — trang ghi chú dạng khối (text · ảnh · bản vẽ nhúng · checklist). Cây trang bên trái. Gắn được vào dự án.

**8 · Knowledge base** — thư viện tri thức: chuẩn ngành · brand kit studio · case study. Ô tìm + thẻ chủ đề. Bài chi tiết bên phải.

## C · ĐÓNG VÒNG KHÁCH

**9 · Khách duyệt / bàn giao** — trang khách xem: bộ bản vẽ/ảnh render theo tờ · nút Duyệt / Yêu cầu sửa · ô comment gắn lên từng ảnh · trạng thái duyệt. Sạch, ít nút (cho khách không rành).

**10 · Báo giá / proposal** — tài liệu báo giá từ BOQ: đầu trang thương hiệu studio (từ brand kit, KHÔNG hardcode) · bảng hạng mục (mã·ảnh·mô tả·SL·đơn giá·thành tiền) · tổng · điều khoản · chữ ký. Xuất PDF.

**11 · Phiên bản / so trước–sau** — dòng thời gian phiên bản của hồ sơ · nút so 2 phiên (chia đôi màn, tô khác biệt) · ghi chú mỗi bản · nút phát hành lại.

---
Vẽ xong 11 `.dc` này + 4 frontier = **phủ gần trọn giao diện IF**, đủ nền để build không sót.
