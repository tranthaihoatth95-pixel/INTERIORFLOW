# PLAN CONTROL TỔNG — MỘT KHUNG NHÌN

> **Vì sao có tệp này** (Hoà nhắc 05/09: *"không được quên plan control tổng"*): việc đang nằm rải
> ở **52 dòng danh sách** + 7 cổng phát hành + hàng duyệt thị giác + sổ chặn. Không chỗ nào trả lời
> được **"đang làm gì, chờ gì, cái nào chặn cái nào"** trong một màn.
>
> **Luật giữ tệp**: **VIẾT LẠI, không cộng dồn.** Thấy nó dài ra là nó đang biến thành nhật ký —
> nhật ký thuộc `docs/00-CHOT.md`. Chi tiết + bằng chứng đặt ở `docs/memory/sessions/<ngày>/`.

---

## ① ĐÍCH — một câu

> **MỘT app InteriorFlow, MỘT bộ cài, chạy được trên máy Hoà (Mac M1) · máy em Hoà (Mac M3) ·
> máy công ty (Windows).** Không phải hai bản. Không phải bản thử.

---

## ② ĐƯỜNG GĂNG — thứ tự này là hệ quả của nhau, không đảo được

```
A. CHUYỂN NỀN sang checkpoint        ← ✅ XONG 05/09 (b9f00873)
        │  (integration thiếu 69 bản sửa · thiếu 2 bảng công ty · mang bảng màu đã bị bác)
        ▼
B. NGÔN NGỮ THIẾT KẾ toàn app        ← ĐANG NGHIÊN CỨU song song (không chặn A)
        │  (đồng bộ · áp tất tần tật · kèm ký hiệu nghề làm điểm nhấn)
        ▼
C. SỬA THEO MẮT HOÀ + cổng N1-N6     ← ba việc đã có tên, xem ④
        ▼
D. DỰNG MỘT BỘ CÀI + 7 CỔNG          ← G7 phải mở gói trên máy thật
        ▼
E. GIAO
```

---

## ③ ĐANG CHẠY NGAY LÚC NÀY

| Làn | Việc | Trạng thái |
|---|---|---|
| **L1–L4b** | hoà 100 xung đột, 4 làn tập tệp rời nhau | ✅ xong |
| **MAIN** | 19 tệp nền + hoà cuối + đường nâng cấp CSDL | ✅ xong |
| **DS** | ngôn ngữ thiết kế toàn app + 21 ký hiệu hai họ | ✅ xong |

**Nghiệm thu nền A:** 0 dấu xung đột · `tsc` 0 lỗi · **0 tệp test đỏ** (tuần tự, CSDL thật) ·
`design-tokens` 181/0 · `nang-cap-csdl` 28/0 · migrations dựng **đúng 26 bảng**, `migrate diff` rỗng.

---

## ④ HOÀ CHỈ MẶT, CHƯA SỬA — bốn việc, có bằng chứng ảnh

| # | Việc | Bằng chứng | Vì sao chưa động |
|---|---|---|---|
| 1 | **Hộp rỗng Vitals** — Peek mở tấm chỉ để nói *"không có tín hiệu"* | ảnh 05/09 | ✅ **ĐÃ SỬA + khoá test** |
| 2 | **Không thấy đường quay về** từ màn vẽ — phải rê chuột mới biết; icon lưới đọc ra *"bảng ứng dụng"* chứ không ra *"về"* | Hoà kẹt, phải hỏi | nền A đã xong ⇒ **mở được ngay** |
| 3 | **Bộ icon xấu** — Hoà cấm | ảnh 05/09 | luật đã có (xem ⑧); thi công theo Q1-Q3 đã quyết |
| 4 | **Khung tên bản vẽ chữ đè nhau** (`1:100` đè khổ giấy) | ảnh 05/09 | đúng lớp lỗi `CHUAN-DAU-RA-NGHE` cấm; **mở được ngay** |

---

## ⑤ CỔNG NGHIỆM THU — mọi việc ở ④ và sau đó phải qua

Luật đầy đủ ở `docs/ACTIVE-DESIGN-CONTEXT.md` mục `N1`–`N6`. Rút gọn:

```
N1  "máy không phán được" là VIỆC CHƯA LÀM  → quy về SỐ → quy về LUẬT NHỊ PHÂN → hỏi
N2  spec phải trả lời "nhìn vào đâu biết nó SAI"
N3  không biết thì HỎI (ngoại lệ của luật thôi-hỏi-chuyện-gu)
N4  ⭐ CỔNG = BỐN CỘT ĐO ĐƯỢC, KHÔNG PHẢI MẮT HOÀ
      ① tầm nhìn (N-1..N-20)  ② chuẩn ngành (NT · KB · HIG)
      ③ spec (EXS 12 điều)     ④ visual chưng cất (board EXS-*)
N5  tự chấm bảng bốn cột trước khi giao, ô nào không tra được ghi [KHÔNG TRA ĐƯỢC]
N6  ⭐ CỔNG CUỐI = THAO TÁC THẬT, hai lối nhập (chuột+phím · cảm ứng),
      bốn ca: sung sướng · RỖNG · VÀO NGANG · QUAY VỀ. Cấm thay bằng grep.
```

---

## ⑥ ĐANG CHẶN — thật sự chặn, không phải việc còn lại

| Chặn | Ai gỡ được | Ghi chú |
|---|---|---|
| ~~G7 · chưa ai mở bộ cài trên máy thật~~ | — | ✅ **ĐÓNG 05/09** — Hoà đã mở, và đó chính là cách bốn lỗi ở ④ lộ ra. Việc còn lại là **dựng bản đúng**, không phải chờ ai mở. |
| ~~Đường nâng cấp cho bản Hoà đã cài~~ | — | ✅ **ĐÓNG** — trạng thái CSDL thứ tư `lichSuLech`; tái hiện được lỗi thật rồi vá, dữ liệu còn nguyên, khoá bằng ca ⑤ |
| **`hex inline 244/trần 194`** sau khi nhập ~950 tệp | MAIN | luật cấm nới trần ⇒ phải sửa mã. **Chặn `npm test` toàn phần.** |
| **chưa chạy `next build`** trên nền mới | MAIN | điều kiện cần trước khi đóng gói |
| **chưa mở app thật một dòng nào** trên nền mới | MAIN | mọi kết luận thị giác của 5 làn là ĐỌC MÃ (`N6` đòi thao tác thật) |

---

## ⑧ NGÔN NGỮ THIẾT KẾ — luật đã chốt 05/09

**Gốc bệnh đo được**, không phải cảm giác: **1.188** lượt vẽ ký hiệu · **35 cỡ khác nhau** (1…520) ·
**92%** render ở ≤16px trên bộ vẽ cho lưới 24 · **91%** không khai độ dày nét ⇒ **năm độ đậm nét
trên cùng một màn**, không cỡ nào tròn điểm ảnh.
⇒ Việc thật **không phải** "vẽ bộ đẹp hơn" mà là **khai nét theo QUAN HỆ thay vì theo pixel, rồi
đóng thang cỡ lại**. Vẽ bộ mới mà vẫn đặt ở 35 cỡ thì bộ mới xấu y hệt.

**Bộ tham số chốt:** lưới **16** · đệm **1** · vùng an toàn **14** · nét **1 đơn vị = 6,25%** ·
bo trong ký hiệu **= nét** · đầu nét **vuông** + góc **nhọn** · thang cỡ **16/20/24/32**.
Nét khai theo *đơn vị lưới* ⇒ tỉ lệ nét/lưới là **hằng số**, độ đậm không trôi (16→1,00 · 24→1,50).

⭐ **Vì sao nó gỡ nút thắt**: số tuyệt đối thì **chỉ mắt phán được**; quan hệ thì **máy phán được**.
Mỗi lần đổi một luật gu thành một quan hệ là bớt một mục khỏi hàng chờ mắt Hoà — đó là cơ chế
thật sự thu hẹp khoảng cách *xong-máy ↔ qua-mắt*.

**Ba câu MAIN tự quyết** (suy được từ luật đã ghi, không tốn lượt bấm của Hoà):
| | Quyết | Căn cứ |
|---|---|---|
| Q1 sàn cỡ | ký hiệu **bấm được** → sàn 16px; ký hiệu **nén tin** (luôn kèm số) → cho 12–14 | đúng hai loại đầu trong bảng 7 loại icon Hoà duyệt 16/08 |
| Q2 năm nhãn sự thật | phân biệt bằng **hình dạng + chữ**, màu là kênh phụ | luật *"màu không bao giờ là kênh duy nhất"* |
| Q3 thứ tự đổi | đổi **theo bề mặt**, **không** lẫn hai bộ trong cùng một màn | hai bộ cạnh nhau tệ hơn một bộ xấu — lệch thành nhìn thấy được |

**Cái riêng của IF, có bằng chứng**: trong 9 khái niệm nghề, **5 chưa có ký hiệu nào**; 4 cái còn
lại mượn hình chung chung — lệnh **Tường** đang vẽ bằng **hình vuông** (`Command3DPanel.tsx:260`),
**Sàn** bằng `Minus`, **Mái** bằng `PanelTop`. Họ nghề dùng **cặp nét cắt/thấy 2:1** — bề dày
**mang nghĩa** (*cái bị cắt qua* ↔ *cái chỉ nhìn thấy*), tỉ lệ lấy từ bảng nét của chính IF.

**Tài liệu:** `docs/nc/NC-DESIGN-PATTERN-TOAN-APP-2026-09-05.md` · bản vẽ
`docs/mocks/mock-design-pattern-toan-app.html` · bộ ký hiệu `lib/ui/icon/` (**chưa cắm vào app**).

## ⑦ NỢ ĐÃ ĐẾM, CHƯA LÀM — không chặn phát hành nhưng không được quên

`docs/delivery/SHIP-BLOCKERS.md` giữ bản đầy đủ. Ba con số đáng nhớ:
- **7/52 năng lực khai "xong" không tới được người dùng** (13,5%), sáu trong bảy mang vai ⭐MVP.
- **Nợ nghiệm thu mắt**: xong-máy ≫ qua-mắt. Đây là nút cổ chai thật, không phải thiếu tính năng.
- **Gói ~400 MB thừa**, chưa bật `asar`.
