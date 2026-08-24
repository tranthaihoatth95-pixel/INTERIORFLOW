# BIÊN BẢN SOI MẮT — KHUÔN ĐIỀN

> Chép thành `docs/soi-mat/<màn>-<ngày>.md`.
> Chấm bằng `checks/visual-review-checklist.md` + `checks/human-centric-checklist.md`
> (+ `checks/touch-checklist.md` nếu bề mặt có cảm ứng).

---

## ⛔ HAI LUẬT CỦA BIÊN BẢN NÀY

**① NGƯỜI VẼ KHÔNG ĐƯỢC TỰ CHẤM.** `06-DESIGN-KNOWLEDGE-AUDIT` ghi thiếu sót này bằng chữ đỏ:
*"người vẽ đang tự chấm"*. Người soi phải là **phiên khác**.

**② KHÔNG CÓ ẢNH THÌ KHÔNG CÓ BIÊN BẢN.** Mọi dòng phải trỏ một ảnh **đã mở** hoặc một số
**đã đo**. Chưa mở thì ghi **"chưa mở"** — ⛔ **cấm mô tả một ảnh chưa nhìn.**

---

## ⓪ ĐỊNH DANH

| | |
|---|---|
| Màn / bề mặt | |
| Ngày · người soi | |
| Người soi có phải người vẽ không | *(bắt buộc: **KHÔNG**)* |
| Hợp đồng thiết kế | *(không có ⇒ ghi ra, đó đã là một phát hiện)* |
| Nguồn đang soi | `MÃ HIỆN TẠI` / `DEV SERVER` / `BẢN DỰNG SẢN XUẤT` / `BẢN ĐÔNG LẠNH` |

🔴 Ô cuối bắt buộc. `F-08`: hai lane từng được bảo nghiệm thu trên một bản dựng **đông lạnh
TRƯỚC khi họ sửa mã**. Mã mới soi trên bản đông lạnh là **`PENDING-REBUILD`, không bao giờ xanh**.

---

## ① BẰNG CHỨNG

| # | Ảnh (đường dẫn) | Khổ | Theme | **Đã mở?** | Cho thấy gì |
|---|---|---|---|---|---|
| | | | sáng/tối | ✅/❌ | |

| | |
|---|---|
| Có ảnh **cả hai theme** chưa | *(bắt buộc)* |
| Có thử **bàn phím thật** chưa | |
| Có thử **trình đọc màn hình** chưa | |
| Có thử `prefers-reduced-motion` chưa | |
| Có thử ở khổ hẹp chưa | |

🔴 *"Có trong mã"* **không bằng** *"tới được người dùng"*. Nút mờ kèm lý do từng được coi là
xong vì lý do **có trong mã** — nhưng nó nằm trong `title` (câm trên cảm ứng) và
`<button disabled>` **không nhận focus**. Chỉ **thao tác thật** mới bắt được lớp lỗi này;
năm máy soi hiện có đều mù với nó.

---

## ② SỐ ĐO

| Chỉ số | Đo được | Ngưỡng | Đạt |
|---|---|---|---|
| dải chrome ngang trên canvas | | ≤2 | |
| số cỡ chữ riêng biệt | | *(4 → 10 là **tích tụ**)* | |
| số nút nhìn thấy cùng lúc | | | |
| icon lucide / tổng | | 100% | |
| % bề ngang cho nhân vật chính | | | |
| tương phản chữ nhỏ nhất (**đo tại chân chữ**) | | ≥4,5:1 | |
| tương phản thành phần phi-văn-bản | | ≥3:1 | |
| chênh sáng ambient góc↔tâm | | *(thấy được)* | |
| G3: tâm vs rìa (**oklab**) | | rìa đặc hơn | |
| số vật mang G3 | | *(phân bổ đã chốt)* | |
| ô lưới trống / tổng | | | |
| chỗ **hoa toàn phần** | | 0 | |

⚠️ Đo **tại chân chữ**, không đo trung bình cả thẻ. Lớp phủ chuyển sắc cục bộ làm hai con số
này khác hẳn nhau.

---

## ③ HAI CHECKLIST

| | Số mục | Đạt | Trượt | Không áp dụng |
|---|---|---|---|---|
| `human-centric-checklist.md` | | | | |
| `visual-review-checklist.md` | | | | |
| `touch-checklist.md` | | | | |

🔴 **Cổng cứng:** `human-centric-checklist` có **CÂU CHẶN**. Trượt câu ấy ⇒ **DỪNG**, không
chấm tiếp. Bố cục đẹp cho một vật không nên tồn tại vẫn là **KHÔNG ĐẠT**.

---

## ④ PHÁT HIỆN

| # | Chỗ | Nhìn thấy gì | Luật nào | **CƠ CHẾ** | Mức |
|---|---|---|---|---|---|
| | | *(khách quan)* | `tệp` + ngày | *(vì sao nó xảy ra)* | 🔴/🟡/🔵 |

Mức: 🔴 vi phạm luật đã ghi thành văn · 🟡 lệch nguyên tắc, luật chưa có · 🔵 nhận xét.

⛔ **Cột "CƠ CHẾ" không được để trống, và không được ghi *"trông xấu"*.** Một phát hiện không
chỉ ra được cơ chế thì người sửa chỉ vá được **chỗ này**, và nó mọc lại chỗ khác — đúng cách
tường thẻ tái phát ba lần.

---

## ⑤ CÙNG LỚP LỖI ĐÃ TỪNG XẢY RA CHƯA

| Phát hiện | Cùng lớp với | Lần thứ mấy |
|---|---|---|

🔴 **Cùng một lớp hai lần = hỏng QUY TRÌNH, không hỏng lần này.** Lúc đó phải sửa **hệ thống**
(hợp đồng · máy canh · ví dụ), không sửa **thể hiện**. Đây là luật riêng của
`02-FAILURE-LEDGER`, và nó đã kích hoạt thật: F-12 lặp F-03 **cùng ngày**; F-13 là lần **thứ ba**
của lớp *khớp-văn-bản-thay-vì-khớp-cách-dùng*.

---

## ⑥ THỨ ĐÃ ĐÚNG

| Chỗ | Đúng ở điểm nào | Có nên nhân rộng không · **giới hạn ở đâu** |
|---|---|---|

⚠️ Ô cuối bắt buộc. Một quyết định đúng-cho-một-chỗ bị chép đi khắp nơi là cách nó thành một
luật sai — vì thế mọi ví dụ TỐT trong `examples/` đều có mục **KHÔNG ĐƯỢC CHÉP GÌ**.

---

## ⑦ CHƯA CHẮC / CHƯA KIỂM 🔴 *bắt buộc — trống cũng phải ghi*

| Thứ | Vì sao chưa kiểm | Nó có thể làm sai kết luận nào |
|---|---|---|

Ô này bắt buộc vì lý do đo được: `F-02` — một trạng thái hỏng được **cả MAIN lẫn lane QA khen
là đúng**, bằng đúng cụm từ mô tả chính căn bệnh của nó. Hai người soi độc lập cùng trượt.
Người soi phải khai **giới hạn của chính mình**, không chỉ khai lỗi của màn.

---

## ⑧ HẠN DÙNG CỦA KẾT LUẬN

| | |
|---|---|
| Kết luận này đúng tới khi nào | |
| Thứ gì đổi thì phải soi lại | |
| Số nào ở đây là **số đo một trạng thái**, không phải hằng số | |

---

## ⑨ PHÁN

| | |
|---|---|
| Hạng | `PASS` / `PARTIAL` / `FAIL` / `BLOCKED` |
| Nếu `BLOCKED`: chặn bởi gì | |
| Ba việc phải làm trước, theo thứ tự | |

⚠️ **Không hạng PASS chỉ vì thành phần tồn tại.** Thang: TỒN TẠI ENGINE → NỐI DÂY LÚC CHẠY →
NGƯỜI DÙNG TỚI ĐƯỢC → KIỂM TRÊN APP THẬT → **HOÀ DUYỆT MẮT**. Bốn nấc đầu **không** ngụ ý nấc
sau (`F-04`).

⚠️ **Chỉ Hoà mới đặt được `FINAL HUMAN APPROVED`.** Biên bản này nhiều nhất chỉ tới
`INTERNAL PASS`.
