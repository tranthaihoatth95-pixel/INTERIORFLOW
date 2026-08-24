# Thứ bậc thị giác — hệ QUYẾT ĐỊNH, không phải bảng cỡ chữ

## 1 · CÂU HỎI MODULE NÀY TRẢ LỜI
- Trên màn này thứ gì phải đập vào mắt trước? Làm sao chứng minh nó đúng?
- Tôi có sáu thứ đều "quan trọng" — xếp thế nào?
- Ngoài cỡ chữ, còn công cụ nào để đẩy một vật lên / dìm một vật xuống?
- Vì sao màn của tôi trông "đều đều, không biết nhìn đâu"?

## 2 · LUẬT DÙNG ĐƯỢC NGAY

**V-1 · SÁU BẬC, XẾP CỐ ĐỊNH.** Mọi bề mặt IF phân vai theo thang này:

| Bậc | Là gì | Ví dụ |
|---|---|---|
| ① | **NHÂN VẬT CHÍNH** — vật người dùng tới đây để làm | canvas 2D · viewport 3D · nội dung deck · việc dở ở Home |
| ② | **NGỮ CẢNH HIỆN TẠI** — tôi đang ở đâu, đang làm với cái gì | tên dự án/không gian · vật đang chọn |
| ③ | **HÀNH ĐỘNG CHÍNH** — đúng MỘT, mang accent | *Vào xưởng* · *Xuất* · *Dựng* |
| ④ | **CÔNG CỤ HỖ TRỢ** — thanh lệnh, thông số | toolbar · inspector |
| ⑤ | **ĐIỀU HƯỚNG TOÀN CỤC** | sidebar · rail |
| ⑥ | **TRẠNG THÁI HỆ THỐNG** | Vitals · hàng đợi · lưu lúc nào |

**Bậc dưới PHẢI LÙI RA SAU** — không chỉ "nhỏ hơn". Lùi = giảm tương phản, giảm độ nổi, giảm bão
hoà, tăng khoảng cách, hoặc **biến mất khi không dùng**.

**V-2 · PHÉP THỬ NHEO MẮT (bắt buộc, mọi màn).**
> Nheo mắt (hoặc làm mờ ảnh chụp màn 8px). **Thứ đầu tiên đập vào là gì?**
> Nếu là **sidebar · thanh công cụ · ô tìm kiếm · tường thẻ** thay vì **việc của người dùng** ⇒ **TRƯỢT.**

Đây là phép thử **đo được** (chụp màn + blur), không phải cảm nhận.

**V-3 · ĐÚNG MỘT ACCENT MỘT MÀN.** Một hành động chính mang màu nhấn; còn lại là chip thường
(NT-2). Hai nút accent cạnh nhau = không nút nào là chính.

**V-4 · TÁM KÊNH DỰNG THỨ BẬC — cỡ chữ chỉ là một.**

| Kênh | Dùng thế nào | Bẫy |
|---|---|---|
| **Cỡ** | chênh phải ≥ một nấc thang rõ | cả màn 11 cỡ = không phải thang, là tích tụ (B4) |
| **Tương phản** | dìm bằng hạ tương phản, không bằng thu nhỏ | dưới ngưỡng a11y (xem `accessibility.md`) |
| **Vị trí** | mắt đi từ trên-trái, tâm quang học cao hơn tâm hình học | |
| **Khoảng trống** | thứ quan trọng có nhiều không khí quanh nó | nhồi kín thì mọi thứ bằng nhau |
| **Chất liệu** | G0→G3 (`materials-g0-g3.md`) — nghĩa quyết định vật liệu | **cấm** thưởng kính cho vật TO |
| **Chiều sâu** | L0…L4 (`docking-and-panels.md`); càng cao càng tạm | bóng đổ tuỳ hứng |
| **Ánh sáng cục bộ** | glow = **đang sống**, không phải trang trí (NT-11) | glow tĩnh = cấm |
| **Mật độ** | vùng chính thoáng, vùng phụ đặc | mật độ CAD rò sang chữ giao diện |

**V-5 · SỐ LÀ NHÂN VẬT** (NT-7): số liệu nghề dùng big-number + `tabular-nums`; số thứ tự
(`01/`) làm xương cấu trúc. Nhưng số chỉ lên bậc ① khi **con số chính là việc**.

**V-6 · THỨ BẬC PHẢI CÒN ĐÚNG Ở TRẠNG THÁI RỖNG.** Màn không dữ liệu vẫn phải có nhân vật chính
(NT-17: 1 câu + 1 minh hoạ + 1 nút + mẫu kéo được). Rỗng là **một trạng thái**, không phải một màn
khác (F-11).

## 3 · VÌ SAO — cơ chế con người
Mắt không đọc màn hình, nó **quét** rồi mới đọc. Vòng quét đầu ~nửa giây, chạy trên tương phản
và khối lượng — chưa đọc chữ nào. Nếu vòng quét đó dừng ở chrome, người dùng đã trả một nhịp cho
việc **định vị lại bản thân** trước khi bắt đầu làm việc. Nhân lên vài trăm lần mỗi ngày.

Thứ bậc đều = **không có thứ bậc**. Sáu thẻ ngang trọng lượng buộc người dùng tự xếp hạng, mỗi
lần mở màn một lần xếp lại — đó chính là *"tốn chú ý để vận hành IF thay vì để thiết kế"*.

## 4 · CA HỎNG THẬT CỦA IF
- **23/08 · Trang chủ tường thẻ**: Tiếp-tục · Dự án · Ghi chú · Vật liệu · Cảm hứng ngang nhau
  ⇒ trượt V-2 và V-3. Luật *"cấm lưới thẻ đều"* đã có từ 20/08 mà vẫn ra tường thẻ — bằng chứng
  chữ không đủ, phải có hình đối chiếu (`06-DESIGN-KNOWLEDGE-AUDIT`).
- **`01-CLINICAL-UI-AUDIT.md` B4 · trôi cỡ chữ 4 → 11**: Files và Library mỗi màn **11 cỡ chữ**,
  2D 10 cỡ, vỏ chung 4 cỡ. Chênh gần 3 lần ⇒ không phải thang mà là tích tụ.
- **`01-CLINICAL-UI-AUDIT.md` · 2D là màn DUY NHẤT có nhân vật chính đúng**: canvas
  **1338×712 / 1440×900 = 93% bề ngang**, chrome không nuốt canvas. Đây là mốc so sánh có số.
  Nhưng cùng màn đó **101 nút** — mật độ cao nhất app: nhân vật chính đúng vẫn có thể quá tải bậc ④.
- **L6 (`NC-NGUYEN-TAC-GIAO-DIEN` mục 6)**: nút *"Xuất"* mang accent nhưng đứng lẫn giữa chip
  thường ⇒ phạm V-3 ở dạng ngược lại: accent có mà không đọc ra là hành động chính.
- **F-14**: một cơ chế chứng minh (lưới kẻ sau kính) đặt sau bề mặt **đục hoàn toàn**. Bài học cho
  thứ bậc: *có mặt ≠ có tác dụng* — luôn hỏi kênh mình dùng có tới được mắt người không.

## 5 · KIỂM THẾ NÀO
1. Chụp màn → blur 8px → thứ đầu tiên thấy có phải bậc ① không? (V-2)
2. Đếm nút mang accent trên màn: phải là **1**.
3. Đếm số cỡ chữ riêng biệt: quá 6 là báo động, quá 8 là trôi thang.
4. Đo bề ngang nhân vật chính / bề ngang màn — với màn có canvas, mốc tham chiếu **93%**.
5. Che bậc ⑤⑥ đi: màn có còn làm việc được không? Nếu không, chrome đang gánh việc của nội dung.
6. Ở trạng thái rỗng, nhân vật chính có còn không?

Máy soi liên quan: `npm run soi:foundation` (nhịp · icon · vật liệu) · `npm run soi:hinh-hoc`.

## 6 · ĐÀO SÂU
- `docs/IF-MOTION-VISUAL-LAW.md` §III Spotlight · §IV Depth · §VI UI sống
- `docs/nc/NC-NGUYEN-TAC-GIAO-DIEN-TOAN-APP-2026-08-14.md` — NT-1, NT-2, NT-7, NT-11, NT-17
- `docs/design-campaign/01-CLINICAL-UI-AUDIT.md` — bảng 13 bề mặt, B4
- `docs/SPEC-DESIGN-SYSTEM-IF.md` §2c luật chống ngô nghê · §7
