# HỆ SINH THÁI IDF
### Báo cáo trình Ban Giám đốc · TTT Architects · 30/07/2026

---

## 1 · Tóm tắt cho lãnh đạo

**IDF không phải một phần mềm vẽ đẹp bằng AI.** Đó là thứ ngoài thị trường đã có nhiều và ai cũng
mua được.

**IDF là dây chuyền biến bản vẽ thành hồ sơ báo giá được** — và nó chạy trên **bảng vật liệu 1.449
dòng có giá thật của chính TTT**. Đó là thứ không công cụ AI nào ngoài kia có, vì họ không có bảng
vật liệu của mình.

| | |
|---|---|
| **Đang có gì** | 3 sản phẩm: **InteriorFlow** (máy tính) · **ArchiNote** (điện thoại) · **ATLAS** (kho dữ liệu chung) |
| **Đã làm được bao nhiêu** | **505 hạng mục** chức năng đã định nghĩa · **161 xong** · **154 làm dở** · **246 chưa làm** (≈ 32% hoàn thành) |
| **Quy mô kỹ thuật** | 654 tệp mã nguồn · 104 bộ kiểm thử tự động · 769 lần cập nhật · 16 bảng dữ liệu |
| **Chi phí vận hành** | **0 đồng/tháng** ở chế độ tự chủ (xem §7) |
| **Đề nghị Ban Giám đốc** | 3 quyết định ở §9 |

---

## 2 · Vấn đề đang tồn tại

Một hồ sơ nội thất ở TTT hiện đi qua **4–6 phần mềm rời nhau**, và **đứt gãy ở mỗi lần chuyển**:

| Khâu | Công cụ | Chỗ mất thời gian |
|---|---|---|
| Bản vẽ kỹ thuật | AutoCAD | Xuất tay từng tờ, ghép PDF thủ công |
| Phối cảnh | 3ds Max / SketchUp + V-Ray/D5 | Render lại từ đầu mỗi lần đổi vật liệu |
| Hồ sơ trình khách | PowerPoint / InDesign | Chép tay thông số, sai lệch so bản vẽ |
| Dự toán | Excel | **Gõ lại toàn bộ khối lượng bằng tay** |
| Vật liệu | File rời / trí nhớ | Không ai chắc mã nào còn hàng, giá nào mới |
| Theo dõi việc | Lark / Zalo | Tiến độ do người tự gõ, không phản ánh việc thật |

Hệ quả đo được: **cùng một con số bị nhập lại 3–4 lần**, mỗi lần là một cơ hội sai. Và **sai một
dòng dự toán là mất tiền thật**.

---

## 3 · IDF là gì — mô hình 3 mảnh

```
   ARCHINOTE 📱              INTERIORFLOW 💻            ATLAS ☁️
   Ghi nhận hiện trường      Sản xuất hồ sơ             Kho dữ liệu chung
   (điện thoại)              (máy tính)                 (Lark Base)
        │                          │                          │
        └──────────────────────────┴──────────────────────────┘
                     Cả hai đọc/ghi vào ATLAS
```

**Luật nền tảng — dữ liệu nặng ở lại máy, dữ liệu điều phối bay lên ATLAS.**

Và một quyết định kiến trúc quan trọng về mặt **kinh doanh**: **hai ứng dụng không gọi nhau.**
Chúng chỉ gặp nhau qua ATLAS. Nghĩa là **bán riêng từng cái được**, và hỏng cái này không kéo sập
cái kia.

| Mảnh | Vai trò | Trạng thái |
|---|---|---|
| **InteriorFlow** | Dây chuyền sản xuất hồ sơ: bản vẽ → phối cảnh → hồ sơ trình khách → dự toán | Đang chạy được, ≈32% |
| **ATLAS** | 1.449 vật liệu có **giá tham khảo · đơn vị · mã thay thế · nhà cung cấp · thẻ phong cách** | **Đã có dữ liệu thật, đang dùng** |
| **ArchiNote** | Đo đạc, chụp ảnh, ghi chú hiện trường trên điện thoại | Ưu tiên sau |

---

## 4 · InteriorFlow — ba chặng, một tệp

Toàn bộ một dự án nằm trong **một tệp duy nhất**, đi qua ba chặng mà **không phải xuất/nhập lần nào**:

**Chặng 1 · Bản vẽ kỹ thuật** — công cụ CAD 2D đầy đủ, nhiều tờ trong một tệp, mỗi tờ khổ giấy và
tỉ lệ riêng, xuất cả bộ hồ sơ ra **một PDF có mục lục**. Có **máy soát tiêu chuẩn** tự cảnh báo khi
bản vẽ sai quy chuẩn — nhưng chỉ **đề xuất, không tự sửa**, người vẫn quyết.

**Chặng 2 · Hình ảnh** — biến nét phác thảo hoặc khối 3D thành phối cảnh thật, đổi vật liệu, đổi
ánh sáng, đổi phong cách mà **giữ nguyên bố cục phòng**. Có **4 mức phụ thuộc AI** cho phép chọn
giữa chất lượng và chi phí — kể cả **mức 0 đồng chạy hoàn toàn trên máy công ty** (§7).

**Chặng 3 · Hồ sơ trình khách** — dàn trang, xuất PDF/PPTX. **Mọi sản phẩm in đạt tối thiểu 300dpi**
— đây là luật cứng của sản phẩm, không phải tuỳ chọn.

**Xuyên suốt** — bảng khối lượng và dự toán tự sinh từ chính bản vẽ, nhân với **giá thật trong ATLAS**.

---

## 5 · Điều khác biệt — vì sao đối thủ không sao chép được

Đây là phần quan trọng nhất với Ban Giám đốc.

| Công cụ AI ngoài thị trường | IDF |
|---|---|
| Cho ra **ảnh đẹp** | Cho ra **hồ sơ báo giá được** |
| Không biết mã vật liệu nào TTT dùng | Nối thẳng **1.449 vật liệu có giá của TTT** |
| Không biết xưởng TTT làm ghế cao bao nhiêu | **Học từ chính số liệu TTT sửa**, càng dùng càng đúng |
| Ảnh và bản vẽ phải tải lên máy chủ nước ngoài | **Mức tự chủ: dữ liệu không rời máy công ty** |
| Bán theo tháng, dừng trả tiền là mất | **Tài sản của TTT, không phụ thuộc nhà cung cấp** |

**Ba tài sản này cộng lại là hàng rào cạnh tranh thật**, vì chúng không mua được — chúng đến từ
nhiều năm làm nghề của TTT.

---

## 6 · Trạng thái thật — báo cáo trung thực

| | Số hạng mục | Tỉ lệ |
|---|---|---|
| ✅ Đã xong, chạy được | **161** | 32% |
| 🟡 Làm dở / một phần | **154** | 30% |
| ⬜ Chưa làm | **246** | 38% |

**Đã chạy được và dùng được ngay hôm nay:** công cụ CAD nhiều tờ · xuất bộ hồ sơ PDF có mục lục ·
tự sao lưu chống mất dữ liệu · máy soát tiêu chuẩn bản vẽ · phối cảnh AI 4 mức · dàn trang trình khách ·
kho tri thức dự án có hỏi–đáp · kết nối Lark.

**Đang làm:** dự toán tự động nối giá ATLAS · đo kích thước món đồ từ ảnh · xuất hồ sơ vật liệu ra
Excel theo đúng mẫu TTT đang dùng.

**Chưa làm:** ArchiNote · quản lý nhiều đơn vị · một số công cụ nâng cao chặng 2.

---

## 7 · Chi phí vận hành

IDF có **4 mức phụ thuộc AI**, chọn được theo từng việc:

| Mức | Chạy ở đâu | Chi phí | Dùng khi |
|---|---|---|---|
| **Không AI** | Máy công ty | **0 đ** | Bản vẽ kỹ thuật, dự toán — an toàn tuyệt đối |
| **Tự chủ** | **Máy công ty** | **0 đ** | Phần lớn công việc hằng ngày. **Dữ liệu không rời máy** |
| AI Vừa | Dịch vụ ngoài | ~250 đ/ảnh | Thử nhanh nhiều phương án |
| AI Cao | Dịch vụ ngoài | ~1.200–12.000 đ/ảnh | Ảnh chốt gửi khách |

→ **Có thể vận hành ở mức 0 đồng/tháng.** Chi phí chỉ phát sinh khi chủ động chọn mức cao cho ảnh
chốt — và luôn hiện giá trước khi chạy.

---

## 8 · Rủi ro và cách kiểm soát

| Rủi ro | Mức | Đang kiểm soát thế nào |
|---|---|---|
| **Phụ thuộc một người** | 🔴 **Cao** | Toàn bộ kiến trúc, quy tắc, tiến độ đã ghi thành tài liệu trong mã nguồn. Nhưng **vẫn cần thêm người** |
| Nhà cung cấp AI đổi giá / ngừng dịch vụ | 🟡 Vừa | Mức tự chủ 0 đ chạy độc lập, không phụ thuộc ai |
| Số liệu AI sai đưa vào dự toán | 🟡 Vừa | Mọi số suy đoán **hiển thị khác màu + đóng dấu cảnh báo bắt buộc**, không thể tắt |
| Mất dữ liệu | 🟢 Thấp | Tự sao lưu 10 phút/lần, giữ 5 bản, đã kiểm chứng |
| ATLAS hiện là tài sản cá nhân | 🔴 **Cao** | **Cần Ban Giám đốc quyết** — xem §9 |

---

## 9 · Ba đề nghị với Ban Giám đốc

### ① Chính thức hoá ATLAS thành tài sản công ty

Bảng 1.449 vật liệu hiện đang nằm trong tài khoản cá nhân. **Đây là tài sản có giá trị nhất của cả
hệ thống** — nó là thứ khiến IDF khác mọi công cụ ngoài thị trường. Đề nghị chuyển về sở hữu công ty,
có người phụ trách cập nhật giá và mã hàng định kỳ.

### ② Bổ sung nhân sự — giảm rủi ro phụ thuộc một người

Hiện toàn bộ do một người xây. Đề nghị bố trí thêm ít nhất một người kỹ thuật để tiếp nhận, và một
người phụ trách dữ liệu vật liệu.

### ③ Chốt định hướng: dùng nội bộ hay thương mại hoá

Kiến trúc đã được thiết kế **để bán riêng từng sản phẩm** ngay từ đầu — đây là quyết định có chủ ý,
không phải tình cờ. Ban Giám đốc cần chốt:

| Hướng | Nghĩa là |
|---|---|
| **A · Chỉ dùng nội bộ** | Tối ưu cho quy trình TTT, không cần chuẩn hoá cho bên ngoài. Nhanh hơn |
| **B · Thương mại hoá** | Cần thêm: tài liệu hướng dẫn, hỗ trợ khách, mô hình cấp phép. Chậm hơn nhưng tạo doanh thu mới |

**Câu trả lời này quyết định toàn bộ thứ tự ưu tiên 6 tháng tới.**

---

## 10 · Kết luận

IDF đang ở **32% hoàn thành**, nhưng phần đã xong là **phần khó nhất và phần nền móng**: công cụ CAD,
kho vật liệu có giá thật, kiến trúc dữ liệu, và cơ chế chạy 0 đồng không phụ thuộc nhà cung cấp
nước ngoài.

Phần còn lại phần lớn là **mở mặt tiền cho những gì đã xây bên trong** — chi phí thấp hơn nhiều so
với giai đoạn vừa qua.

**Giá trị lớn nhất không nằm ở công nghệ AI** — cái đó ai cũng mua được. Nó nằm ở chỗ IDF là nơi duy
nhất **tri thức nghề của TTT được ghi lại thành dữ liệu dùng được**: bảng vật liệu, gu thiết kế, kích
thước xưởng thật sự làm. Càng dùng, khoảng cách với công cụ ngoài càng xa — và khoảng cách đó **thuộc
về công ty**, không thuộc về nhà cung cấp nào.

---

*Báo cáo lập ngày 30/07/2026. Số liệu trích trực tiếp từ mã nguồn và cây tính năng dự án
(505 hạng mục · 654 tệp · 104 bộ kiểm thử · 769 lần cập nhật) và từ ATLAS (1.449 bản ghi vật liệu).*
