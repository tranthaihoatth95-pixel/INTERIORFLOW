# PHIẾU GIAO — BẢN ĐỒ NGHIÊN CỨU CHUẨN · 38 lĩnh vực

> **Lane `05 · THIẾT KẾ/NC`.** Hoà chốt 30/08/2026. Viết cho người **không đọc được repo**.
> **Bản đồ đã lướt bao quát rồi** — việc của bạn là **tra đúng chỗ, không lan man**, và **bổ sung
> nếu thấy thiếu**. Đây là chốt kỹ lưỡng để an toàn cho cả hai phía, không phải mở lại đề bài.

## 0 · MỆNH ĐỀ TRUNG TÂM — đọc trước, mọi thứ dưới bám vào nó

> Muốn thiết kế ra thứ **hơn tiêu chuẩn**, thì **cái app thiết kế nên chúng** phải được lập trình
> từ **tiêu chuẩn + những điều làm tốt hơn tiêu chuẩn**. "Tốt hơn" đến từ *kiến trúc có sẵn* +
> *lợi thế người đi sau, đứng trên vai người khổng lồ*.
> ⇒ **Thước đo không được thấp hơn thứ nó đo.**

**IF phục vụ ngành nào:** thiết kế thị giác cho không gian người ở và làm việc — **lõi là nội thất
và kiến trúc**, mở ra toàn bộ Design vì mọi nhánh đều phục vụ cùng một cơ quan: **thị giác**.
Người dùng IF là người *biến ý định thành không gian, rồi biến không gian thành hồ sơ thuyết phục*.

⚠️ **SỬA 30/08 — đừng đọc "ba chặng" thành toàn bộ nghề.** Bản đầu của phiếu này viết *"ba chặng
chính là ba trạng thái của một việc"*, và đó là hiểu hẹp. Hoà chỉnh:
**2D · 3D · Trình bày là TRỤC CÔNG CỤ** — ba luồng sản xuất chính.
**Trục QUY TRÌNH là xương sống 12 bước** chạy xuyên qua chúng, **có bước trước 2D và bước sau
Trình bày, không bước nào thiếu được** (`docs/control/IF-CANONICAL.md` §8).
Nghiên cứu chuẩn phải phủ **cả trục quy trình**, không chỉ ba stage — nếu không sẽ hổng đúng chỗ
tender · thi công · bàn giao.

**Sáu trụ của một hồ sơ nội thất xuất sắc** (Hoà): kỹ thuật · mỹ thuật · khoa học lý-hoá · ngôn ngữ
· logic học · tính toán. **Không mỹ thuật bay bổng hoá, không kỹ thuật khô cứng hoá.**

**Hai thứ tạo ra trải nghiệm** — và đây là điều dễ bỏ sót nhất:
① **cảm giác** (mắt và các giác quan còn lại nạp vào não)
② **bối cảnh tác động** — *quá trình lớn lên của một người, một nhóm, một cộng đồng, một quốc gia
qua các sự kiện và biến động, hình thành nét riêng trong nhận thức và tính cách.*
**② mới là thứ cốt lõi ngành design phục vụ.** Ví dụ Hoà đưa: hình tròn + hồng ấm ⇒ an toàn, không
gai góc, bao bọc — vì tone ấm và hình tròn tác động lên thị giác qua nhiều thời kỳ tiến hoá.

---

## 0b · THỨ TỰ — Hoà chốt 30/08, đọc trước khi bắt tay

```
①  CHUẨN NGÀNH   ← VIỆC CỦA PHIẾU NÀY.  Làm cho xong trước.
②  ĐIỀU HƠN CHUẨN
③  HỌC GU        ← HOÃN.  Sau cùng, vì nó làm IF khác biệt chứ không làm nền.
```

> *"Xong hết phần chuẩn → cuối cùng chúng ta sẽ học gu."*

⇒ **Trong phiếu này: không hiệu chuẩn gu, không dùng `GU-PROFILE.md` làm nguồn, không đụng 1.580
ảnh.** Chúng vẫn đang nuôi prompt dựng ảnh nên **không xoá** — chỉ ra khỏi phạm vi.
Phần §7 của `IF-DEC-GU-READER-001` (dataset split 60/20/20) ⇒ **HOÃN**, không phải huỷ.

---

## 1 · BA BƯỚC, HAI ĐÍCH

```
LOOK INSIDE → LOOK OUTSIDE → xác lập chuẩn, áp thang đo
                                    ↓
                      IF làm TỐT HƠN được ở đâu
                                    ↓
                        thiết kế thang tiêu chuẩn
                                    ↓
            ┌──────────── HAI ĐÍCH ────────────┐
      đo chính IF                    đo sản phẩm IF làm ra
```

**Mỗi lĩnh vực phải trả về đúng bốn ô** — thiếu ô nào thì lĩnh vực đó chưa xong:

| ô | nội dung |
|---|---|
| **NGUỒN** | chuẩn tên gì, ai ban hành, năm, còn hiệu lực không |
| **NGƯỠNG** | con số. Không có số thì ghi `CHƯA CÓ SỐ`, cấm ghi tính từ |
| **ĐO THẾ NÀO** | đo được bằng máy hay bắt buộc người · đo trên IF hay trên sản phẩm IF làm ra |
| **HƠN Ở ĐÂU** | IF vượt chuẩn được chỗ nào nhờ kiến trúc sẵn có + lợi thế đi sau. Không thấy thì ghi `KHÔNG` |

---

## 2 · HỌ ① — CHUẨN HỆ THỐNG (IF là phần mềm) · 12 lĩnh vực

**Đo 30/08: 8/12 đã có cổng chạy trong `npm test`.** Lane 05 chỉ cần lo **4 chỗ trống**:

| # | trống | cần tra |
|---|---|---|
| **6** | **UX** | tải nhận thức (Cognitive Load), số bước tới đích, luật Fitts/Hick — ngưỡng đo được |
| **8** | **Tiếp cận** | WCAG 2.2 AA đã chốt làm sàn; cần **vùng bấm** (2.5.8 · 24px vs Apple HIG 44px — chọn cái nào, vì sao) |
| **9** | **Hiệu năng** | ngân sách tải, ngân sách khung hình cho app desktop dựng hình nặng |
| **10** | **Bảo mật & riêng tư** | chuẩn cho app local-first giữ dữ liệu khách; đối chiếu luật vùng |

Tám lĩnh vực còn lại **đã có cổng, đừng đụng**: kiến trúc · codebase · router · kho dữ liệu ·
phân loại tệp · UI đo được · song ngữ · bằng chứng phát hành.

⚠️ **Một phát hiện đã có, dùng làm ví dụ mẫu:** thang chữ IF `12·14·16·20·28` có tỉ lệ
`1,167 · 1,143 · 1,25 · 1,400`; thang bo `6·10·14·20` có `1,667 · 1,400 · 1,429`. Thang mô-đun
đúng nghĩa có **một** tỉ lệ — IF có bốn. **Cả hai thang là số chọn bằng mắt.** Cần khuyến nghị
tỉ lệ nào, và **lưới bố cục** đi kèm — lưới ảnh hưởng cả IF lẫn thứ IF tạo ra.

---

## 3 · HỌ ② — CHUẨN NGÀNH · 26 lĩnh vực

**19 NỀN TẢNG** — không thương lượng được (cơ thể · vật lý · tri giác · số học). Đúng bất kể gu ai.
**7 DIỄN ĐẠT** — có chuẩn nhưng cho phép khác biệt. **Đây là chỗ duy nhất gu cá nhân được sống.**

| nhóm | # | lĩnh vực | loại |
|---|---|---|---|
| Con người | 1 · 2 · 3 | nhân trắc học *(tĩnh + động)* · công thái học · thiết kế phổ quát | nền tảng |
| Thị giác | 4 · 5 · 6 | khoa học thị giác *(sinh lý mắt)* · Gestalt · độ sâu và phối cảnh | nền tảng |
| | 7 · **8** | tâm lý thị giác + cảm giác hình học · **bối cảnh văn hoá–tiến hoá** | diễn đạt |
| Ánh sáng | 9 · 10 | khoa học ánh sáng và nguồn sáng *(IES)* · trắc quang, mức rọi | nền tảng |
| Màu | 11 · 12 | khoa học màu, không gian màu · **màu dưới ánh sáng** *(CRI · TM-30 · CCT)* | nền tảng |
| Hình học | 13 · 14 · 15 | hệ tỉ lệ *(modular · vàng · Modulor)* · **lưới và bố cục không gian** · hình học dựng hình | nền tảng |
| Vật liệu | 16 · 17 · 18 | lý-hoá tính, bề mặt, phản xạ · âm học · nhiệt và tiện nghi | nền tảng |
| Ngôn ngữ | 19 · 21 | typography trong không gian · **từ ngữ–thị giác–hình học** | diễn đạt |
| | 20 | ký hiệu và quy ước bản vẽ | nền tảng |
| Trình bày | 22 · 23 · 24 | ngôn ngữ điện ảnh · dựng ảnh PBR, tone mapping · kể chuyện hồ sơ | diễn đạt |
| Tính toán | 25 · 26 | đo bóc khối lượng BOQ · logic ràng buộc, kiểm va chạm | nền tảng |

**Sáu lĩnh vực Hoà chưa nêu, tôi thêm vì thiếu là hổng:** `3` thiết kế phổ quát · `12` màu dưới
ánh sáng · `17` âm học · `18` nhiệt · `23` dựng ảnh · `26` logic ràng buộc.
**Bạn thấy còn thiếu nữa thì THÊM** — đó là việc của phiếu này.

### Ba lĩnh vực ưu tiên trước, vì IF đang chạm vào chúng ngay
- **13 · 14 hệ tỉ lệ + lưới** — đang sai, đã đo, và nó lan sang cả sản phẩm IF tạo ra
- **1 nhân trắc học** — IF vẽ mặt bằng; sai kích thước người là sai gốc. Kho Neufert **đã tách ra
  ngoài repo** (gói nạp), cần chuẩn để nạp lại có kiểm
- **9 · 11 · 12 ánh sáng và màu** — chặng render và chặng trình bày đều đứng trên đây

---

## 4 · NGOÀI HAI HỌ — LUẬT QUY ĐỊNH

Xây dựng · phòng cháy · tiếp cận · điện · môi trường, **theo vùng và quốc gia**.
Hoà tách riêng: **không phải chuẩn, không vào thang đo.** IF **đọc và cảnh báo**, không tự quyết.
Cần: danh mục theo vùng + cách IF nhận biết đang ở vùng nào.

---

## 5 · RÀNG BUỘC

- **Trung tính thương hiệu.** Chuẩn là chuẩn ngành, không phải gu một studio.
  🔴 **SỬA 30/08 — bản đầu viết "gu Hoà sống trong 7 lĩnh vực diễn đạt". Vẫn còn xếp gu ngang
  hàng với chuẩn, và Hoà bác:** *"không cần gu trong giai đoạn này vì chuẩn ngành nên đang chuẩn
  bị thiết lập. Gu của tôi chỉ là thứ khiến IF trở nên khác biệt, và là một trong những design DNA
  được trích xuất từ một designer đầu tiên IF học thôi."*
  ⇒ **`GU-PROFILE.md` KHÔNG phải nguồn cho bất kỳ ô `NGUỒN` nào trong phiếu này.** Nó là **mẫu DNA
  số 1**, dữ liệu hiệu chuẩn. Lĩnh vực nào chưa có chuẩn thì ghi `CHƯA CÓ SỐ` — **cấm lấy gu lấp**.
- **Local-first.** Chuẩn nào cần mạng phải nói rõ và nêu đường hạ cấp.
- **Không tính từ.** `NGƯỠNG` phải là số hoặc chữ `CHƯA CÓ SỐ`. Câu như *"cần hài hoà"* là câu rỗng.
- **Nêu nguồn.** Chuẩn không truy được nguồn thì ghi `KHÔNG TRUY ĐƯỢC`, đừng viết như thể có.
- **SỰ THẬT BẨN.** Số đã bị nói lại và vá nhiều lượt thì **đo lại từ nguồn**, không vá tiếp.
  Ca thật: *"1.580 ảnh tag `gu-đích`"* — 1.580 đúng nhưng đến từ **category**; tag `gu-đích` chỉ
  có **43**. Lane 00 viết sai, lane 05 kế thừa. Gặp số kiểu này thì dừng lại đo, đừng dùng.
- **Nói thẳng chỗ không biết.** Phiếu thiếu một lĩnh vực còn chữa được; phiếu **đoán** thì không.

## 6 · VÌ SAO HOÀ MUỐN VIỆC NÀY

> *"Điều này cho phép đội build IF có kiến thức tư vấn ngược lại cho Hoà, thay vì cứ chờ Hoà."*

Đó là thước đo thành công của phiếu: xong việc này, đội phải **nói được cho Hoà điều anh chưa biết**,
chứ không phải hỏi anh thêm một vòng nữa.
