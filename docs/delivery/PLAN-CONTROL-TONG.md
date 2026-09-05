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
A. CHUYỂN NỀN sang checkpoint        ← ĐANG CHẠY, chặn mọi thứ phía sau
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
| **L1** | hoà 20 tệp `lib/` | 🔵 chạy |
| **L2** | hoà 20 tệp giao diện (Vitals · rail · Home · WorkHub) | 🔵 chạy |
| **L3** | hoà 29 tệp 2D · 3D · Trình chiếu · thư viện | 🔵 chạy |
| **L4b** | hoà 12 tệp `app/api` + 2 máy soi | 🔵 chạy |
| **DS** | nghiên cứu **ngôn ngữ thiết kế toàn app** + bộ icon riêng | 🔵 chạy |
| **MAIN** | đã tự hoà 19 tệp nền: `schema.prisma` · `package.json` · `electron/main.js` · `globals.css` · `.gitignore` · docs · migrations | ✅ xong |

---

## ④ HOÀ CHỈ MẶT, CHƯA SỬA — bốn việc, có bằng chứng ảnh

| # | Việc | Bằng chứng | Vì sao chưa động |
|---|---|---|---|
| 1 | **Hộp rỗng Vitals** — Peek mở tấm chỉ để nói *"không có tín hiệu"* | ảnh 05/09 | ✅ **ĐÃ SỬA + khoá test** |
| 2 | **Không thấy đường quay về** từ màn vẽ — phải rê chuột mới biết; icon lưới đọc ra *"bảng ứng dụng"* chứ không ra *"về"* | Hoà kẹt, phải hỏi | chờ nền A xong (đụng `RailDieuHuong`, L2 đang giữ) |
| 3 | **Bộ icon xấu** — Hoà cấm | ảnh 05/09 | làn DS đang dựng luật trước, cấm vá lẻ |
| 4 | **Khung tên bản vẽ chữ đè nhau** (`1:100` đè khổ giấy) | ảnh 05/09 | đúng lớp lỗi `CHUAN-DAU-RA-NGHE` cấm; chờ nền A |

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
| **G7 · chưa ai mở bộ cài trên máy thật** | **chỉ Hoà** | phiên đám mây không có máy Mac |
| **Đường nâng cấp cho bản integration Hoà đã cài** | MAIN | sổ migration của nó lệch với nền mới ⇒ `migrate deploy` sẽ gãy; phải thêm nhánh nhận diện + `migrate resolve` |
| **`hex inline 244/trần 194`** sau khi nhập ~950 tệp | MAIN | luật cấm nới trần ⇒ phải sửa mã |

---

## ⑦ NỢ ĐÃ ĐẾM, CHƯA LÀM — không chặn phát hành nhưng không được quên

`docs/delivery/SHIP-BLOCKERS.md` giữ bản đầy đủ. Ba con số đáng nhớ:
- **7/52 năng lực khai "xong" không tới được người dùng** (13,5%), sáu trong bảy mang vai ⭐MVP.
- **Nợ nghiệm thu mắt**: xong-máy ≫ qua-mắt. Đây là nút cổ chai thật, không phải thiếu tính năng.
- **Gói ~400 MB thừa**, chưa bật `asar`.
