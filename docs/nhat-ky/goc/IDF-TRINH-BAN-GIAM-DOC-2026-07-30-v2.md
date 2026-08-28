# HỆ SINH THÁI IDF
### Báo cáo trình Ban Giám đốc · TTT Architects · 30/07/2026 · bản v2

---

## 1 · Tóm tắt cho lãnh đạo

**IDF không phải một phần mềm vẽ đẹp bằng AI.** Đó là thứ ngoài thị trường đã có nhiều và ai cũng
mua được.

**IDF là dây chuyền biến bản vẽ thành hồ sơ báo giá được** — chạy trên **bảng vật liệu 1.449 dòng
có giá thật của chính TTT**. Đó là thứ không công cụ nào ngoài kia có, vì họ không có bảng vật liệu
của mình.

Và đây là hệ thống **hai thế hệ**, đã được thiết kế từ đầu để đi tới đích:

> **IF1 — tầng ý tưởng** (đang chạy): phác thảo, phối cảnh, hồ sơ trình khách, dự toán.
> **IF2 — tầng kỹ thuật tuyệt đối** (đích đến): mô hình BIM chuẩn quốc tế, thông với Revit, và
> **kiến trúc sư ra công trường chỉ cần một chiếc tablet — vuốt là cắt lớp xem tiến độ, chỗ nào
> đụng nhau là thấy ngay.**

| | |
|---|---|
| **Đang có gì** | 3 sản phẩm: **InteriorFlow** (máy tính) · **ArchiNote** (điện thoại) · **ATLAS** (kho dữ liệu chung) |
| **Đã làm được bao nhiêu** | **505 hạng mục** đã định nghĩa · **161 xong** · **154 làm dở** · **246 chưa làm** (≈ 32%) |
| **Quy mô kỹ thuật** | 654 tệp mã nguồn · 104 bộ kiểm thử tự động · 769 lần cập nhật · 16 bảng dữ liệu |
| **Chi phí vận hành** | **0 đồng/tháng** ở chế độ tự chủ (§7) |
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
   (điện thoại)              (máy tính / tablet)        (Lark Base)
        │                          │                          │
        └──────────────────────────┴──────────────────────────┘
                     Cả hai đọc/ghi vào ATLAS
```

**Luật nền tảng — dữ liệu nặng ở lại máy, dữ liệu điều phối bay lên ATLAS.**

Và một quyết định kiến trúc quan trọng về mặt **kinh doanh**: **hai ứng dụng không gọi nhau.**
Chúng chỉ gặp nhau qua ATLAS. Nghĩa là **bán riêng từng cái được**, và hỏng cái này không kéo sập
cái kia.

---

## 4 · InteriorFlow IF1 — ba chặng, một tệp

Toàn bộ một dự án nằm trong **một tệp duy nhất**, đi qua ba chặng mà **không phải xuất/nhập lần nào**:

**Chặng 1 · Bản vẽ** — công cụ CAD 2D đầy đủ, nhiều tờ trong một tệp, mỗi tờ khổ giấy và tỉ lệ riêng,
xuất cả bộ hồ sơ ra **một PDF có mục lục**. Có **máy soát tiêu chuẩn** tự cảnh báo khi bản vẽ sai
quy chuẩn — nhưng chỉ **đề xuất, không tự sửa**, người vẫn quyết.

**Chặng 2 · Hình ảnh** — biến nét phác thảo hoặc khối 3D thành phối cảnh thật, đổi vật liệu, ánh sáng,
phong cách mà **giữ nguyên bố cục phòng**. Có **4 mức phụ thuộc AI**, kể cả **mức 0 đồng chạy hoàn
toàn trên máy công ty** (§7).

**Chặng 3 · Hồ sơ trình khách** — dàn trang, xuất PDF/PPTX. **Mọi sản phẩm in đạt tối thiểu 300dpi** —
luật cứng của sản phẩm, không phải tuỳ chọn.

**Xuyên suốt** — bảng khối lượng và dự toán tự sinh từ chính bản vẽ, nhân **giá thật trong ATLAS**.

---

## 5 · ⭐ IF2 — tầng kỹ thuật tuyệt đối, và đích đến của cả hệ sinh thái

IF1 giải quyết **giai đoạn ý tưởng**. IF2 khép kín phần còn lại: **giai đoạn kỹ thuật và thi công**.

### Khác biệt cốt lõi

| | IF1 · Tầng ý tưởng | IF2 · Tầng kỹ thuật |
|---|---|---|
| Bản vẽ là gì | **Nét** — đường, hình, ký hiệu | **Cấu kiện có ý nghĩa** — tường biết mình là tường, dày bao nhiêu, vật liệu gì |
| Khối lượng | Tính từ vùng tô | **Tự có sẵn** trong từng cấu kiện |
| Va chạm hệ thống | Người tự dò | **Máy tự phát hiện** |
| Thông với bên ngoài | PDF, ảnh | **Chuẩn quốc tế IFC — thông thẳng với Revit** |

### Đích đến: một chiếc tablet ngoài công trường

> Kiến trúc sư ra công trường chỉ mang **một tablet nhẹ**. **Vuốt là cắt lớp** qua mô hình để xem
> đúng chỗ mình đang đứng. Nhìn là biết **tiến độ hạng mục đó tới đâu**. **Chỗ nào đụng nhau là hiện
> lên ngay** — không phải về văn phòng mở máy trạm mới biết.

Đây là chỗ **lợi thế kiến trúc của IDF phát huy mạnh nhất, và đối thủ khó theo**:

**Công trường thường không có mạng.** Các phần mềm BIM đám mây phải tải mô hình về từ máy chủ mới xem
được. IDF **local-first ngay từ nền móng** — dữ liệu nặng nằm sẵn trong máy, mức AI tự chủ chạy offline.
**Mất sóng vẫn làm việc bình thường.**

### Nền móng cho IF2 đã được đặt sẵn — không phải làm lại từ đầu

Đây là điểm Ban Giám đốc nên chú ý: IF1 **được xây với IF2 trong đầu**, nên phần lớn nền móng đã có:

| Nền móng đã có | Phục vụ IF2 thế nào |
|---|---|
| Phân loại cấu kiện: tường · sàn · cột · dầm · cửa đi · cửa sổ · nội thất · không gian | **Trùng khớp với chuẩn IFC quốc tế** — đây là bảng chữ cái của BIM, đã viết sẵn |
| Ba giai đoạn bản vẽ: **Phác thảo → Kỹ thuật → BIM** | Khung chuyển giai đoạn đã dựng, hai giai đoạn sau **chỉ chờ mở** |
| Máy soát tiêu chuẩn (phát hiện vi phạm, phân mức nghiêm trọng) | **Chính là bộ khung của phát hiện va chạm** — cùng một cỗ máy, đổi luật |
| Dựng khối 3D đúng kích thước thật, **0 đồng, hoàn toàn tất định** | Nền hình học cho mô hình và cho việc cắt lớp |
| Kiến trúc local-first + mức AI tự chủ | **Chạy được ngoài công trường không cần mạng** |

→ IF2 **không phải một sản phẩm mới phải xây lại**. Nó là **mở khoá phần đã dựng sẵn bên trong IF1**.

### Vì sao điều này quan trọng với TTT về mặt kinh doanh

| | |
|---|---|
| **Thông với Revit chuẩn IFC** | TTT nhận và giao hồ sơ được với mọi tư vấn, mọi chủ đầu tư quốc tế — không bị khoá vào một phần mềm |
| **Phát hiện va chạm sớm** | Va chạm phát hiện trên bản vẽ tốn vài giờ. Phát hiện ngoài công trường tốn **hàng chục đến hàng trăm triệu** đập đi làm lại |
| **Tablet công trường** | Giảm số chuyến về văn phòng, rút ngắn vòng phản hồi giữa thiết kế và thi công |
| **Khép kín hệ sinh thái** | Từ ý tưởng → kỹ thuật → thi công → nghiệm thu, **một nguồn dữ liệu duy nhất** |

---

## 6 · Lộ trình ba thế hệ

| Thế hệ | Nội dung | Trạng thái |
|---|---|---|
| **IF1 · Tầng ý tưởng** | Bản vẽ · phối cảnh · hồ sơ trình khách · dự toán có giá thật | 🟡 **Đang chạy, ≈32%** |
| **ATLAS mở rộng** | Vật liệu · phong cách · nhân sự · tiến độ — nguồn dữ liệu chung | 🟡 Có dữ liệu thật, đang nối |
| **ArchiNote** | Ghi nhận hiện trường trên điện thoại, đẩy về ATLAS | ⬜ Chưa làm |
| **IF2 · Tầng kỹ thuật** | Cấu kiện có ngữ nghĩa · IFC/Revit · phát hiện va chạm · **tablet công trường** | ⬜ Nền móng đã đặt, chưa mở |

**Thứ tự mở khoá:** ATLAS (đang làm) → ArchiNote → IF2. Mỗi bước dùng lại nền của bước trước,
không có bước nào phải xây lại.

---

## 7 · Điều khác biệt — vì sao đối thủ không sao chép được

| Công cụ AI ngoài thị trường | IDF |
|---|---|
| Cho ra **ảnh đẹp** | Cho ra **hồ sơ báo giá được** |
| Không biết mã vật liệu nào TTT dùng | Nối thẳng **1.449 vật liệu có giá của TTT** |
| Không biết xưởng TTT làm ghế cao bao nhiêu | **Học từ chính số liệu TTT sửa**, càng dùng càng đúng |
| Ảnh và bản vẽ phải tải lên máy chủ nước ngoài | **Mức tự chủ: dữ liệu không rời máy công ty** |
| Cần mạng mới xem được mô hình | **Chạy offline — dùng được ngoài công trường** |
| Bán theo tháng, dừng trả tiền là mất | **Tài sản của TTT, không phụ thuộc nhà cung cấp** |

---

## 8 · Chi phí vận hành

| Mức | Chạy ở đâu | Chi phí | Dùng khi |
|---|---|---|---|
| **Không AI** | Máy công ty | **0 đ** | Bản vẽ kỹ thuật, dự toán — an toàn tuyệt đối |
| **Tự chủ** | **Máy công ty** | **0 đ** | Phần lớn việc hằng ngày. **Dữ liệu không rời máy** |
| AI Vừa | Dịch vụ ngoài | ~250 đ/ảnh | Thử nhanh nhiều phương án |
| AI Cao | Dịch vụ ngoài | ~1.200–12.000 đ/ảnh | Ảnh chốt gửi khách |

→ **Có thể vận hành ở mức 0 đồng/tháng.** Chi phí chỉ phát sinh khi chủ động chọn mức cao — và luôn
hiện giá trước khi chạy.

---

## 9 · Rủi ro và cách kiểm soát

| Rủi ro | Mức | Đang kiểm soát thế nào |
|---|---|---|
| **Phụ thuộc một người** | 🔴 **Cao** | Toàn bộ kiến trúc và quy tắc đã ghi thành tài liệu trong mã nguồn. Nhưng **vẫn cần thêm người** |
| Nhà cung cấp AI đổi giá / ngừng dịch vụ | 🟡 Vừa | Mức tự chủ 0 đ chạy độc lập |
| Số liệu AI sai đưa vào dự toán | 🟡 Vừa | Số suy đoán **hiển thị khác màu + đóng dấu cảnh báo bắt buộc**, không tắt được |
| Mất dữ liệu | 🟢 Thấp | Tự sao lưu 10 phút/lần, giữ 5 bản, đã kiểm chứng |
| **ATLAS hiện là tài sản cá nhân** | 🔴 **Cao** | **Cần Ban Giám đốc quyết** — §10① |

---

## 10 · Ba đề nghị với Ban Giám đốc

### ① Chính thức hoá ATLAS thành tài sản công ty

Bảng 1.449 vật liệu hiện nằm trong tài khoản cá nhân. **Đây là tài sản có giá trị nhất của cả hệ
thống.** Đề nghị chuyển về sở hữu công ty, có người phụ trách cập nhật giá và mã hàng định kỳ.

### ② Bổ sung nhân sự — giảm rủi ro phụ thuộc một người

Đề nghị bố trí thêm ít nhất một người kỹ thuật để tiếp nhận, và một người phụ trách dữ liệu vật liệu.

### ③ Chốt định hướng: dùng nội bộ hay thương mại hoá

Kiến trúc đã được thiết kế **để bán riêng từng sản phẩm** ngay từ đầu — có chủ ý, không tình cờ.

| Hướng | Nghĩa là |
|---|---|
| **A · Chỉ dùng nội bộ** | Tối ưu cho quy trình TTT. Nhanh hơn |
| **B · Thương mại hoá** | Cần thêm tài liệu hướng dẫn, hỗ trợ khách, mô hình cấp phép. Chậm hơn nhưng tạo doanh thu mới |

**Câu trả lời quyết định toàn bộ thứ tự ưu tiên 6 tháng tới.**

---

## 11 · Kết luận

IDF đang ở **32% của thế hệ thứ nhất**, nhưng phần đã xong là **phần khó nhất và phần nền móng**:
công cụ CAD, kho vật liệu có giá thật, kiến trúc dữ liệu, và cơ chế chạy 0 đồng không phụ thuộc nhà
cung cấp nước ngoài.

Quan trọng hơn: **nền móng đó đã được đặt sẵn cho IF2.** Bảng phân loại cấu kiện trùng chuẩn IFC
quốc tế, ba giai đoạn bản vẽ đã dựng khung, máy soát tiêu chuẩn chính là bộ khung phát hiện va chạm.
IF2 **không phải làm lại — nó là mở khoá thứ đã xây bên trong.**

**Giá trị lớn nhất không nằm ở công nghệ AI** — cái đó ai cũng mua được. Nó nằm ở chỗ IDF là nơi duy
nhất **tri thức nghề của TTT được ghi lại thành dữ liệu dùng được**: bảng vật liệu, gu thiết kế, kích
thước xưởng thật sự làm. Càng dùng, khoảng cách với công cụ ngoài càng xa — và khoảng cách đó **thuộc
về công ty**.

Đích đến không phải một phần mềm vẽ. Đích đến là: **kiến trúc sư TTT ra công trường với một chiếc
tablet, vuốt là thấy đúng lớp mình cần, chỗ nào sai là biết ngay** — và toàn bộ dữ liệu đằng sau nó
là của TTT.

---

*Báo cáo lập ngày 30/07/2026, bản v2 (bổ sung §5 IF2 và §6 lộ trình). Số liệu trích trực tiếp từ mã
nguồn và cây tính năng (505 hạng mục · 654 tệp · 104 bộ kiểm thử · 769 lần cập nhật) và từ ATLAS
(1.449 bản ghi vật liệu).*
