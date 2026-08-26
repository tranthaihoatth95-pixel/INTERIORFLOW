# ⑤ DATA CLASSIFICATION MATRIX

> `PROPOSED` — phân loại để tách ranh giới. HEAD `a08378a`.
> Mục tiêu: **không lẫn** bảy vùng dữ liệu mà đề bài liệt kê.

## 1 · BẢY VÙNG — ranh giới cứng

| # | vùng | ở đâu | ai sở hữu | rời khỏi máy được? |
|---|---|---|---|---|
| 1 | **Builder OS** (Drive · GitHub · control plane) | ngoài sản phẩm | Hoà / đội build | có — đó là mục đích |
| 2 | **IF global** (token, thang, khuôn, luật) | trong bundle | IF | có — bán ra kèm sản phẩm |
| 3 | **Product cloud/storage** | ⛔ **CHƯA TỒN TẠI** | — | — |
| 4 | **Tenant** (cấu hình khách, adapter, cờ) | local, theo cài đặt | khách | **chỉ khi khách bật** |
| 5 | **HRM/Lark** (tên, chức danh, phòng ban) | local, nhập vào | khách | **KHÔNG** mặc định |
| 6 | **Project** (bản vẽ, vật liệu, deck) | local | khách | khi khách chia sẻ |
| 7 | **PII / nhạy cảm** (email, avatar, workload, OT) | local | **cá nhân** | **KHÔNG** |

**Luật chống lẫn:** dữ liệu vùng 4–7 **không bao giờ** được đi vào vùng 1 hoặc 2.
Cụ thể: **cấm** đưa dữ liệu khách vào repo global, fixture, mock, analytics, hay bundle bán ra.

## 2 · MỨC NHẠY CẢM — bốn bậc

| bậc | ví dụ | luật tải | luật log | luật xuất |
|---|---|---|---|---|
| **P0 công khai** | tên team, số lượng tổng hợp | tự do | được | được |
| **P1 nội bộ** | chức danh, phòng ban, ai ở dự án nào | **permission-before-load** | không log giá trị | có audit |
| **P2 cá nhân** | email, số ĐT, avatar thật | permission-before-load | **cấm log** | audit + lý do |
| **P3 nhạy cảm** | workload, OT, đánh giá, lương | quyền RIÊNG, không kế thừa | **cấm log** | **cấm xuất hàng loạt** |

**Suy ra một luật giao diện:** cụm avatar ở thẻ dự án là **P1**.
Người không có `people.read.basic` ⇒ **chỉ thấy SỐ**, không tải ảnh và tên.
(Khớp `IF-PO-14` §4 — đã dựng.)

## 3 · PERMISSION-BEFORE-LOAD — định nghĩa chính xác

```
ĐÚNG:  kiểm quyền → truy vấn CHỈ trường được phép → trả về
SAI:   truy vấn tất cả → lọc ở tầng API → trả về
SAI NẶNG: truy vấn tất cả → trả về → che ở giao diện
```
Ca thứ ba là **rò dữ liệu**, kể cả khi màn hình trông đúng.

## 4 · PII TRONG MOCK VÀ FIXTURE

- Mock **bắt buộc** synthetic. Không tên thật, không avatar thật, không email thật.
- Fixture test **không được** chứa dữ liệu khách.
- **Rủi ro tồn dư đã khai:** tên tiếng Việt synthetic có thể **trùng ngẫu nhiên** người thật.
  Giảm bằng cách dùng bộ tên cố định, khai trong manifest.

## 5 · Ⓘ CHỜ BẰNG CHỨNG TỪ PHIÊN A/B/D

Các ô sau **chưa xác nhận**, sẽ điền bằng bằng chứng file:dòng:

- [ ] Schema hiện tại **có** khái niệm tenant không?
- [ ] Truy vấn Prisma nào **không lọc** theo `userId`/`projectId`?
- [ ] SQLite **có** mã hoá không? `uploads/` có bảo vệ không?
- [ ] Có **audit trail** nào đang tồn tại không?
- [ ] Route nào **over-fetch** (trả nhiều trường hơn cần)?
- [ ] Server loopback bind `127.0.0.1` hay `0.0.0.0`?

Chưa có sáu câu trả lời trên thì **ma trận này chưa dùng để cấp PASS được**.
