# SPEC · HOME BENTO v5 — bố cục · thông tin · nội dung (nghiên cứu 13/08, chờ Hoà duyệt phác)

> Hoà lệnh 13/08: *"nghiên cứu kỹ bố cục, thông tin, nội dung — dựa trên design pattern tốt rồi
> tuỳ biến sâu cho IF."* Hai bài NC nền (nguồn đầy đủ trong báo cáo agent phiên 13/08):
> ①BỐ CỤC (Apple HIG widget · SaaSFrame/Inkbot/Cometa bento · NNGroup · Refactoring UI · Tufte)
> ②THÔNG TIN/NỘI DUNG (NNGroup vanity-metrics · Monograph · Float · JTBD KTS · microcopy).
> Đây là HỢP ĐỒNG cho vòng code kế — mock duyệt xong mới code (luật L3, quay lại sau 3 vòng lật).

## 1 · Mười hai luật bố cục (rút gọn — bản đầy đủ trong báo cáo NC)

L1 MỘT anchor duy nhất, diện tích ≥2× ô kế · L2 cỡ ô = thứ hạng thông tin · L3 5-9 ô/màn ·
L4 ô to cấm "fill-style" kéo giãn nội dung mỏng (bệnh v3) · L5 padding tỉ lệ cỡ ô (16-32px),
đệm ≥ gap · L6 phân cấp bằng cỡ+đậm+màu, grayscale-first · L7 vị trí đoán được, tiết lộ dần ·
L8 data-ink Tufte: widget số không chartjunk, sparkline thay chart to · L9 **trang thưa dữ liệu
là MỘT TRẠNG THÁI THIẾT KẾ RIÊNG có bố cục riêng** (Notion/Linear), không phải bố-cục-đầy trừ
phần trống · L10 ô co giãn/ẩn theo mật độ dữ liệu thật · L11 bo góc tăng theo cỡ ô (map thang
IF: ô nhỏ --r-3, ô lớn --r-4, đồng tâm §2d) · L12 widget chỉ tồn tại nếu mang thông tin thời sự.

## 2 · Bảng IA — khối nào sống, nói gì (quyết theo NC, T chốt)

| Khối | Quyết | Ưu tiên | Nội dung viết lại (số-có-ngữ-cảnh) |
|---|---|---|---|
| **Dự án đang mở** | GIỮ — **HERO** khi có ≥1 dự án | 5 | card: tên · chặng đang dở · "1 bản vẽ · sửa 5 giờ trước" · presence; click → lastStage |
| **Hôm nay** | GIỮ (ẩn khi 0 tín hiệu) | 5 | "2 việc trễ hạn, gần nhất: mai — BOQ phòng khách" — KHÔNG "15 việc"; GỘP luôn sự kiện cần-hành-động (mention/chờ duyệt) |
| **Mốc sắp tới** | GIỮ | 4 | DayTicker chỉ ngày CÓ mốc |
| **Chào + Ánh sáng giờ** | GIỮ nhưng **HẠ CẤP**: thành dải header/hero-chrome khi có dự án; chỉ làm hero khi ngày-đầu | 3 | lời chào 3 khung giờ + 1 dòng việc thật (bộ microcopy §4); cung mặt trời = sparkline của trời |
| **Ghi chú Tot** | GIỮ, nhỏ | 3 | không cạnh tranh 2 khối đầu |
| **Vật liệu + Ảnh tuần** | GIỮ, **GỘP thành 1 ô "Tuần này"**, cuối lưới, cập nhật CHẬM (tuần) | 3 | ảnh/vật liệu THẬT của studio (cấm seed) — khác biệt visual-first của IF |
| **Biểu đồ chặng** | VIẾT LẠI thành **"Đang kẹt"**: chỉ hiện khi có dự án đứng yên ≥N ngày ("Nháp đứng yên 5 ngày ở 3D") | 2 | đếm-mỗi-chặng là vanity — trượt test "so what?" (NNGroup) |
| **Lưới tích luỹ** | **BỎ** | — | heatmap không ngưỡng = vanity kinh điển; thủ phạm "rối/rỗng" |
| **Bảng tin feed** | **BỎ ô riêng** — sự kiện cần-hành-động gộp vào Hôm nay | — | feed vô hướng = information overload |
| Vitals pill · VI/EN | chrome góc, không phải ô | — | trạng thái hệ thống |

**Tối đa 7 ô nhìn thấy kể cả hero — mọi nấc.**

## 3 · Ba nấc bố cục (grid 12 cột, khung 1440; sơ đồ chi tiết trong báo cáo NC)

- **MỎNG (0 dự án / ngày đầu):** 3 ô — HERO Chào+Ánh sáng giờ (8×2, thứ DUY NHẤT luôn có nội dung
  thật) · CTA "Tạo dự án đầu tiên" (4×2 — ô-mời-gọi có thiết kế, không phải ô thiếu) · Ghi chú (dải mỏng).
- **VỪA (1-3 dự án — máy Hoà hiện tại):** HERO Dự án (6×2) · Chào+Ánh sáng (3×2) · Hôm nay (3×2,
  ẩn nếu 0 tín hiệu → Mốc/Tuần này thế chỗ) · hàng dưới ≤4 ô nhỏ cùng cấp thật: Mốc · Ghi chú ·
  Tuần này · (Đang kẹt nếu có).
- **DÀY (nhiều dự án đủ dữ liệu):** HERO lưới con 2 dự án (6×2) · cột giữa gom widget nhỏ 2×2 ·
  vẫn ≤9 ô — gộp nhóm thay vì phình ô.

## 4 · Nội dung (microcopy chốt dùng — bộ đầy đủ trong báo cáo NC B)

Lời chào: sáng "Chào buổi sáng, Hoà — 3 việc đang chờ hôm nay." · khuya "Làm khuya vậy? 1 việc
cần xong trước sáng mai." · không việc: "Studio yên ắng, chưa có việc gấp." Câu trống mỗi khối:
thừa-nhận + bước-kế ("Chưa có mốc nào trong 2 tuần tới."), không bao giờ giọng lỗi. Nhãn khối:
"Hôm nay · Dự án · Sắp tới · Ghi chú · Tuần này" — đánh số mono 01-05 theo gu Swiss.

## 5 · Tuỳ biến sâu IF (khác mọi dashboard khác ở đâu)

① Ánh-sáng-kể-giờ là CHROME của trang (nền đổi theo giờ + cung mặt trời sparkline) — đúng nghề;
② Ô "Tuần này" visual-first: render + quả cầu vật liệu THẬT của studio (Milanote/Behance pattern,
nhưng dữ liệu một-nguồn của chính họ); ③ token IF: thang bo 6/10/14/20 đồng tâm, nhãn mono
uppercase, hairline, 1 accent; ④ mọi số click được → deep-link TaskContext (số không chỉ để nhìn);
⑤ tất cả trạng thái trống viết sẵn — cold-start là first-class.

## 6 · Nghiệm thu vòng code kế
Mock HTML 2 theme (đã gửi Hoà duyệt) là hợp đồng pixel; code xong T soi bằng mắt cả 2 theme ĐÚNG
trạng thái dữ liệu máy Hoà trước khi gọi; các ngưỡng ẩn/hiện có test; 7 ô trần cứng.
