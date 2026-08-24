# KHUÔN BÁO CÁO SOI THỊ GIÁC — điền đủ, không bỏ ô

> Chép nguyên khuôn này. Ô nào không có dữ liệu thì ghi **CHƯA CÓ** kèm lý do — **cấm xoá ô**.
> Ô trống là bằng chứng còn việc; xoá ô cho gọn mắt là che việc.

---

## ⓪ ĐỀ BÀI ĐÃ VIẾT LẠI

Người gọi nhờ: `<chép nguyên văn lời nhờ>`
Skill viết lại thành: **"Tìm vi phạm trên `<bề mặt>` và giải thích."**

> Nếu lời nhờ là "duyệt giúp" / "xem hộ" / "chốt giúp" ⇒ **bắt buộc** viết lại. Skill này không
> nhận vai người duyệt. Người duyệt duy nhất là Hoà.

## ① BỀ MẶT ĐANG SOI

| | |
|---|---|
| Màn / route | |
| Theme | sáng / tối / cả hai |
| Bề rộng đo | |
| Trạng thái đăng nhập | |
| Dữ liệu | thật / rỗng / hỗn hợp |
| Ảnh đã nhìn | `<đường dẫn từng tệp>` |
| **Agent đã tự mở ảnh?** | **CÓ / KHÔNG** — KHÔNG ⇒ báo cáo không hợp lệ |

## ② HỢP ĐỒNG MÀN

- Tệp: `.claude/skills/if-design/product/<màn>.md` — **CÓ / MISSING**
- MISSING ⇒ nguồn thay thế đã dùng: `<ghi rõ>`
- Màn này **được phép chứa**: `<liệt kê theo hợp đồng>`

## ③ VÍ DỤ XẤU ĐÃ ĐỐI CHIẾU

| Ví dụ (`examples/BAD/…`) | Giống chỗ nào trên ảnh đang soi |
|---|---|
| | |

Không có ví dụ cùng loại ⇒ ghi vào ⑦b. **Đối chiếu bằng hình, không bằng trí nhớ.**

## ④ MÁY SOI — phần đo được

| Lệnh | Kết quả | Ghi chú |
|---|---|---|
| `npm run soi:foundation` | | |
| `npm run soi:hinh-hoc` | | |
| `npm run soi:tu-dien` | | |
| `npm run soi:thao-tac` | | |

> Máy sạch **không** cứu được mắt trượt, và mắt thấy đẹp **không** cứu được máy đỏ.
> Hai cột riêng, cấm gộp.

## ⑤ 23 TRỤC — bảng trạng thái

| Nhóm | Trục | Kết quả | Ghi chú ngắn |
|---|---|---|---|
| **A** | A1 việc của con người | ĐẠT / TRƯỢT | |
| **A** | A2 nhân vật chính | | thứ đập vào mắt: `<viết ra>` |
| **A** | A3 cái gì biến mất được | | |
| **A** | A4 tường thẻ | | 4 dấu hiệu: `<mấy/4>` |
| **A** | A5 SaaS chung chung | | |
| **A** | A6 sự thật dữ liệu | | |
| B | B1 thứ bậc · B2 khung viền · B3 mật độ · B4 lộ dần · B5 workspace | | CHƯA SOI nếu không nạp |
| C | C1 chữ · C2 icon · C3 chất liệu · C4 chuyển động · C5 cảm ứng · C6 co giãn · C7 thuật ngữ | | |
| D | D1 dữ liệu · D2 tác giả AI · D3 truy nguồn · D4 khớp Claude Design | | |
| E | E1 Apple · E2 tiền lệ nghề · E3 cá tính IF | | |

Nhóm không nạp ⇒ ghi **CHƯA SOI**. Cấm im lặng bỏ qua rồi cho điểm như đã soi.

## ⑥ PHÁT HIỆN — xếp theo mức hại, không liệt kê phẳng

Thứ tự bắt buộc: **H1 → H2 → H3 → H4**.
`H1 chặn việc · H2 sai sự thật · H3 hỏng kiến trúc (chạm ≥2 bề mặt, sẽ mọc lại) · H4 hao mòn`

### [H_] PH-01 · `<tên ngắn>`
- **THẤY GÌ** — `<mô tả thị giác cụ thể, chỉ đúng vùng trên ảnh, đo được>`
- **LUẬT BỊ PHẠM** — `<tệp + ngày>` hoặc **TRI THỨC MỚI** (chưa có luật — nói thẳng, đừng bịa)
- **HẠI CHO AI, MẤT VIỆC GÌ** — `<người dùng nào, đang làm gì, hỏng ra sao>`
- **SỬA THEO NGUYÊN TẮC NÀO** — `<nguyên tắc, KHÔNG phải bản thiết kế>`

*(lặp cho từng phát hiện)*

⛔ Cấm: *"trông cao cấp"* · *"khá ổn"* · *"cần trau chuốt"* · *"chưa tinh tế"* · *"nhìn hơi rối"*.
Câu nào không chỉ được vào một vùng cụ thể trên ảnh ⇒ xoá.

## ⑦ KẾT LUẬN

**PASS · PARTIAL · FAIL** — `<chọn một>`

Luật xếp hạng, không được nới:
- **FAIL** — có bất kỳ H1/H2, **hoặc** trượt bất kỳ cổng nhóm A.
- **PARTIAL** — chỉ có H3/H4; **hoặc** chưa nhìn được ảnh app thật (trần cứng, nói rõ lý do trần).
- **PASS** — 0 phát hiện **VÀ** đã nhìn ảnh app thật **VÀ** máy soi sạch.

⛔ Skill này **không bao giờ** đặt `FINAL HUMAN APPROVED` — chỉ Hoà. PASS ở đây chỉ mở đường tới
`INTERNAL PASS`.

## ⑦b CHƯA CHẮC / CHƯA KIỂM — bắt buộc, trống cũng phải ghi

- Trục **chưa soi**: `<liệt kê>`
- Trạng thái **chưa xem** (hover · focus · rỗng · lỗi · đang tải · reduce-motion · theme còn lại):
- Bề rộng **chưa đo**:
- Thứ **suy chứ không đo**:
- Hợp đồng màn / ví dụ xấu **thiếu**:
- Luật **chưa tra được nguồn** (đang ghi là TRI THỨC MỚI):

## ⑦c HẠN DÙNG KẾT LUẬN

Bản soi này hết hiệu lực khi: `<mã nguồn màn đổi / bản vẽ nguồn đổi / token nền ban hành / …>`
Ảnh đã soi chụp lúc: `<ngày giờ>`.
