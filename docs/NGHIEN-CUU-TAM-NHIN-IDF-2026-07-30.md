# Nghiên cứu: tầm nhìn IDF đứng ở đâu so với thế giới

> Tra cứu để kiểm ba trụ của tầm nhìn: ① một nguồn → nhiều đích · ② va chạm + thời gian ·
> ③ IFC/openBIM. Kết quả: **cả ba đều có tiền lệ ngành đã chín**, nghĩa là hướng đi không mạo hiểm.
> Nhưng chỗ IDF khác biệt thật thì **khác chỗ tôi tưởng** — và tôi phải sửa một chỗ mình nói quá.

---

## 1 · Trụ ① "Một nguồn → nhiều đích" — đây là một NGÀNH đã có 30 năm

Cách nói *"chặng 3 là trình biên dịch"* không phải ẩn dụ tôi nghĩ ra. Ngành xuất bản tài liệu kỹ
thuật đã làm đúng điều đó suốt ba thập kỷ, và có tên hẳn hoi:

| Thuật ngữ | Nghĩa |
|---|---|
| **Single-source publishing** | Viết một lần, xuất ra nhiều định dạng — không chép tay lần nào |
| **Structured content** | Nội dung mang **ý nghĩa** (đây là cảnh báo, đây là bước 3), không mang **định dạng** |
| **Separation of content from presentation** | Nguồn không biết nó sẽ trông thế nào; đích quyết định điều đó |
| **DITA** | Chuẩn mở (OASIS) để mô tả nội dung có cấu trúc, dùng rộng trong hàng không, y tế, phần mềm |

Các nền tảng thương mại (Heretto, Adobe AEM Guides) sống bằng đúng việc này: **một mô hình nội dung
→ web · PDF · trợ giúp trong app · in ấn**, mỗi đích có bộ tối ưu riêng.

### Ý nghĩa với IDF

**Hướng đi được xác nhận, không phải đánh cược.** Và quan trọng hơn, ngành này đã trả lời sẵn câu hỏi
khó nhất: **cái gì phải nằm trong nguồn?**

Câu trả lời của họ trùng khớp với 5 trường tôi đề xuất ở tài liệu trước — và họ nhấn mạnh đúng một
điều tôi cũng nhấn: **nguồn phải mô tả VAI TRÒ, không mô tả HÌNH THỨC.** Ghi *"đây là ghi chú cảnh báo"*
chứ không ghi *"chữ đỏ 12pt"*. Vì chữ đỏ 12pt đúng trên giấy nhưng sai khi chiếu máy chiếu.

→ **Luật cho `.idf`: không được lưu bất kỳ thuộc tính trình bày nào ở tầng nguồn.** Cỡ chữ, màu,
vị trí — tất cả thuộc về đích.

---

## 2 · Trụ ② Va chạm — ⚠️ tôi đã nói quá, xin đính chính

Tài liệu trước tôi viết loại va chạm thứ ba *"gần như không ai làm"*. **Sai.** Ngành đã đặt tên và
phân loại rõ ba loại:

| Loại | Tên ngành | Nội dung |
|---|---|---|
| 1 | **Hard clash** | Hai khối chiếm cùng một chỗ |
| 2 | **Soft clash** (clearance clash) | Không đủ khoảng trống thao tác/bảo trì — dù không chồng nhau |
| 3 | **4D clash** (workflow / schedule clash) | **Xung đột theo THỜI GIAN**: trình tự thi công khiến việc này chặn việc kia, hoặc hai đội cùng vào một chỗ một lúc |

Loại 3 chính là cái tôi gọi là "va chạm quy trình", và nó **có tên chuẩn là 4D clash**.

### Nhưng chỗ IDF khác biệt vẫn còn — chỉ là khác lý do tôi nghĩ

Không phải *"không ai làm"*. Sự thật là: **làm được 4D clash đòi hỏi mô hình phải gắn với TIẾN ĐỘ THẬT**,
và đó mới là chỗ hầu hết dự án đứt gãy — tiến độ nằm trong file Excel/MS Project của bên khác, cập
nhật tay, luôn lạc hậu so với công trường.

**IDF ở vị trí hiếm:** tiến độ **đã nằm trong Lark với dữ liệu thật của studio** (Gantt + 2 Kanban
đang chạy, có Chủ trì · Ngày giao · Deadline), và IF có thể **tự tính % tiến độ từ công việc thật**
(số vùng tô, số góc render, số trang slide) thay vì chờ người gõ.

→ **Khác biệt của IDF không phải "phát hiện 4D clash", mà là "4D clash chạy trên tiến độ TỰ CẬP NHẬT
thay vì tiến độ gõ tay".** Đó là một tuyên bố mạnh hơn và đúng hơn.

---

## 3 · Trụ ③ IFC / openBIM — thuật ngữ cần dùng cho đúng

| Thuật ngữ | Nghĩa | Dùng khi nói với ai |
|---|---|---|
| **IFC** (Industry Foundation Classes) | Chuẩn mở, **ISO 16739**, do buildingSMART quản | Tư vấn, chủ đầu tư quốc tế |
| **openBIM** | Triết lý làm việc mở, không khoá vào một hãng | Ban giám đốc — đây là từ chống lại nỗi lo "phụ thuộc phần mềm" |
| **Federated model** | **Mô hình hợp nhất**: chồng mô hình kiến trúc + kết cấu + cơ điện của nhiều bên thành một để soi va chạm | Đây là **từ khoá cho §7⑥** |
| **ISO 19650** | Chuẩn quốc tế về quản lý thông tin công trình | Khi dự thầu dự án lớn/quốc tế |

Đáng chú ý: **chính Autodesk cũng đẩy openBIM/IFC** dù họ có định dạng riêng — vì thị trường đòi hỏi.
Nghĩa là đi theo IFC là đi theo dòng chảy chung, không phải đi ngược.

→ Khẳng định ở tài liệu trước — **nhận IFC quan trọng hơn xuất IFC** — được củng cố: khái niệm
**federated model** tồn tại chính vì việc hằng ngày là **gom mô hình của người khác vào**, không phải
gửi mô hình của mình đi.

---

## 4 · Vậy giá trị thật của IDF nằm ở đâu — bản đã hiệu chỉnh

Sau khi tra, tôi xếp lại. Ba nhóm rõ ràng:

### 🟡 Nhóm A — Đã có ngoài thị trường, IDF chỉ cần làm ĐÚNG (không phải khác biệt)
Phát hiện va chạm cứng/mềm · xuất IFC · mô hình hợp nhất · cắt lớp trên tablet · single-source publishing.
**Đừng bán những cái này như phát minh.** Bán như "IDF có đủ, không thiếu so với chuẩn ngành".

### 🟢 Nhóm B — Khác biệt THẬT, đứng vững trước chất vấn
| Khác biệt | Vì sao đối thủ không có |
|---|---|
| **1.449 vật liệu có giá thật của TTT nối thẳng vào dự toán** | Họ không có bảng vật liệu của TTT |
| **4D clash chạy trên tiến độ TỰ TÍNH từ việc thật** | Đối thủ chạy trên tiến độ gõ tay, luôn lạc hậu |
| **Học kích thước từ chính số liệu TTT sửa** | Càng dùng càng đúng theo xưởng TTT, không phải theo trung bình thế giới |
| **Chạy offline, dữ liệu không rời máy** | Đối thủ đám mây cần mạng — công trường thường không có |
| **Là tài sản công ty, không phải thuê bao** | Ngừng trả tiền là mất, với họ |

### 🔵 Nhóm C — Khác biệt về TRIẾT LÝ, khó sao chép nhất
**IDF là nơi tri thức nghề của TTT được ghi thành dữ liệu chạy được.** Đối thủ bán công cụ; IDF tích luỹ
**tài sản**. Công cụ thì ai cũng mua được và giá về 0 theo thời gian. Tài sản thì càng dùng càng dày —
và nó thuộc về TTT.

---

## 5 · Ba điều chỉnh cho tài liệu trước

| Chỗ | Sửa thành |
|---|---|
| *"va chạm quy trình — gần như không ai làm"* | **"4D clash — ngành đã có tên; chỗ đứt gãy là tiến độ gõ tay. IDF chạy trên tiến độ tự tính"** |
| *"chặng 3 là trình biên dịch"* (như ẩn dụ) | Giữ, nhưng nói rõ đây là **single-source publishing** — ngành đã làm 30 năm, có chuẩn DITA |
| Chưa có luật về thuộc tính trình bày | **Thêm luật: `.idf` KHÔNG lưu cỡ chữ/màu/vị trí. Nguồn mô tả VAI TRÒ, đích quyết HÌNH THỨC** |

---

## 6 · Từ vựng nên dùng khi trình bày

**Với ban giám đốc:** openBIM · không khoá nhà cung cấp · mô hình hợp nhất · phát hiện va chạm sớm ·
tài sản dữ liệu công ty.

**Với tư vấn / chủ đầu tư:** IFC (ISO 16739) · federated model · clash detection (hard/soft/4D) ·
ISO 19650.

**Với đội kỹ thuật nội bộ:** single-source publishing · structured content · tách nội dung khỏi trình bày ·
preflight theo đích.

---

*Cowork, 30/07/2026. Nguồn tra cứu ghi ở phần trả lời kèm tài liệu này.*
