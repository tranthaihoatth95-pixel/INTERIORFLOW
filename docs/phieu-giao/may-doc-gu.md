# PHIẾU GIAO — MÁY ĐỌC GU (thiết kế, không thi công)

> **Người nhận:** tuyến thiết kế bên ChatGPT/Codex — nơi đã có sẵn các phiên chuyên về nghiên cứu
> chuẩn nghề. **Bên đó THIẾT KẾ, bên này (Claude Code) THI CÔNG.** Hoà chốt 30/08/2026.
>
> **Đầu ra mong đợi: MỘT BẢN ĐẶC TẢ.** Không cần mã. Bên này sẽ dựng từ đặc tả đó.
>
> Tệp này viết cho người **không có quyền đọc repo** — mọi thứ cần biết đều nằm trong đây.

---

## 0 · BỐI CẢNH — chỉ cần biết ba câu

**InteriorFlow (IF)** là *design OS chạy tại máy* cho kiến trúc sư nội thất. Bốn giá trị nền:
*own your data · own your workflow · own your memory · replace your AI*. Sản phẩm **bán ra toàn
cầu, trung tính thương hiệu** — không nhúng nhận diện của bất kỳ studio nào.

Trong IF có màn **Cảm hứng** (Gallery). Nó sinh ra để **thay Pinterest** cho việc tìm cảm hứng:
kiến trúc sư hiện lên Pinterest/Google, tải về ảnh không nguồn, không giấy phép, không tái dùng
được cho hồ sơ khách. Chốt 12/08: Gallery = kho ảnh **tuyển liên ngành** có nguồn và giấy phép.

Hôm nay nó **chưa làm được việc đó**, và Hoà (chủ sản phẩm) nói rõ vì sao ở §2.

---

## 1 · ĐỀ BÀI — nguyên văn của Hoà, 30/08

> *"thiết kế 1 cái máy đọc gu, hiểu thẩm mỹ, bố cục, tỉ lệ, ánh sáng — dựa trên nghiên cứu chuẩn
> đàng hoàng. Design có bao nhiêu ngành, mỗi ngành điểm chung là gì? Cái gì là đặc trưng riêng?
> Tóm lại: **nhìn hình → hiểu hình → xác lập cái nào import hay không import**, dựa trên ngữ cảnh
> trong hình, đạt tiêu chuẩn bố cục màu sắc v.v.
> Nói chung ở đây có **1 senior design với quy chuẩn chung của ngành design**, và **mỗi tag phân
> loại là một thang đo quy chuẩn cho ngành nghề con** như nội thất, kiến trúc, cảnh quan, graphic,
> mood/feeling v.v.
> Hình ảnh nội dung **rộng** để người ta còn research sử dụng — chỗ này look like Pinterest.
> **Phải rộng thì người ta mới tìm, phải đẹp thì người ta mới có hứng.**"*

### Bốn câu hỏi phải trả lời bằng nghiên cứu, không bằng ý kiến
1. **Design có bao nhiêu ngành?** Lấy phân loại nào làm chuẩn, và vì sao chuẩn đó chứ không phải
   chuẩn khác. Nêu nguồn.
2. **Điểm CHUNG của mọi ngành design là gì?** — tức thang đo áp được cho mọi ảnh, bất kể ngành.
3. **Đặc trưng RIÊNG của từng ngành con là gì?** — nội thất · kiến trúc · cảnh quan · graphic ·
   mood/feeling, và các ngành khác mà nghiên cứu chỉ ra là thiếu.
4. **Ngưỡng nào là ĐẠT?** Một ảnh phải đạt gì mới được nhận vào kho tuyển. Con số, không tính từ.

---

## 2 · HIỆN TRẠNG ĐO ĐƯỢC — vì sao phải làm việc này

Đo trên máy Hoà ngày 30/08, dữ liệu thật:

| Đo | Số |
|---|---|
| Tài sản trong kho ảnh (`LibraryAsset`) | **1.635** |
| Trong đó: ảnh Hoà tự nạp để dạy gu (`tag: gu-đích`) | **1.580** |
| Đã gắn đủ nhóm ngành + giấy phép ⇒ đủ tiêu chuẩn lên mặt tiền | **5** |
| Chiều cao vùng cuộn trước khi sửa | **401.805 px** |
| Số thẻ dựng cùng lúc trong DOM | **1.634** |

Nói cách khác: **1.580 ảnh nguyên liệu, 5 ảnh đã tuyển.** Việc gắn nhãn bằng tay không bao giờ
đuổi kịp. Và 5 ảnh còn lại hoá ra là **render dự án khách** (`ST5 · render cũ sảnh thang`) — hợp
lệ về xuất xứ nhưng **không phải ảnh cảm hứng**; Hoà xem xong nói *"thấy ghê"*.

⇒ Đó là lý do cần **máy**, không cần thêm quy trình tay.

---

## 3 · ĐÃ CÓ SẴN — đừng thiết kế lại (luật B25: nhìn vào trong trước)

Bên này đã có những mảnh sau. Đặc tả mới phải **nối vào chúng**, chỉ đẻ mới khi chứng minh được
là không nối được.

| Mảnh | Là gì | Trạng thái |
|---|---|---|
| `docs/GU-PROFILE.md` | **Gu của Hoà, đã chưng cất 11/07** từ 4 board Pinterest (`pinterest.com/Bentran_tth`, ~1.500+ pin, cluster màu k-means → đọc 12 ảnh đại diện). §1 gu nội thất (3 cực: GLAM sảnh lớn 40% · TĨNH Aman/Japandi 30% · ZEN Á Đông 25%; palette *greige – kem – champagne – nâu óc chó – đen nhấn – xanh cây điểm*). §2 gu giao diện app. §3 gu slide | ✅ dùng được ngay — đây là **tập nhãn vàng** để hiệu chuẩn máy |
| `lib/gu.ts` (229 dòng) | Gu Engine: `MATERIAL_TERMS` · `STYLE_TERMS` · `ROOM_TERMS` · `buildGuProfile()` · `guProfileFromPicked()` · `guToPrompt()` | ✅ có từ điển thuật ngữ, đang chạy |
| `lib/library/gallery-tags.ts` (110 dòng) | Quy ước tag đã chốt: `nganh:<kien-truc\|noi-that\|canh-quan\|graphic\|art>` · `license:<cc0\|unsplash\|studio\|ai\|user>` · `nguon:<tự do>` · `bosuutap:<slug>` | ✅ **đây chính là chỗ "mỗi tag = một thang đo"** phải cắm vào |
| `scripts/soi-anh-the.py` (184 dòng) | Cổng chọn ảnh đã dựng 29/08 cho màn khoá: **5 cổng chặn** + **1 tiêu chí bố cục** (*độ tĩnh* = `1 − rối/0.40`) | ✅ **nguyên mẫu của đúng việc này**, quy mô nhỏ — mở rộng thay vì viết lại |
| `scripts/nhuom-anh-the.py` (183 dòng) | Lọc điện ảnh **ASC CDL** (`out = (slope×in + offset)^power`) + chuẩn hoá thích ứng (điểm đen/trắng theo phân vị, gamma trung gian về `0.455`), có chế độ `--quet` chạy dải sáng-tối | ✅ dùng cho bước "cho đẹp" sau khi đã "cho đúng" |
| `docs/ML-GU-ENGINE-PROPOSAL.md` (365 dòng) | Đề xuất ML cho Gu Engine | ⚠️ **chưa ai đọc lại** — bên nhận nên đọc trước khi đề xuất kiến trúc mới |
| `lib/dna/` (5 tệp) · `lib/distill/` (3 tệp) | Thẻ DNA + chưng cất | ⚠️ chưa khảo sát trong phiên này |
| `docs/IMAGE-SOURCES.md` (82 dòng) | Nguồn ảnh hợp lệ + **chặn Pinterest** (dán link `pinterest.com/pin/…` bị từ chối kèm hướng thay thế) | ✅ đang thi hành |

---

## 4 · RÀNG BUỘC CỨNG — vi phạm là phải làm lại

1. **Luật trung tính.** Sản phẩm bán ra toàn cầu. Không nhúng thương hiệu studio nào. Gu của Hoà
   là **tập hiệu chuẩn**, KHÔNG được thành gu ép lên người dùng. Người dùng phải nạp được gu riêng.
2. **Không ảnh khách, không PII.** Render dự án khách không được lên mặt tiền cảm hứng.
3. **Giấy phép sạch, và chặn Pinterest.** Nguồn hợp lệ: CC0 · Unsplash License · studio tự chụp ·
   AI sinh · người dùng thêm. Ảnh thiếu nguồn/giấy phép **không vào được bộ sưu tập** — luật đã
   thi hành ở tầng hàm, không phải chỉ ở giao diện.
4. **Local-first.** IF chạy tại máy (Next.js 14 + Electron, SQLite). Đặc tả nên nói rõ phần nào
   chạy được offline, phần nào bắt buộc gọi mạng, và **hạ cấp thế nào khi mất mạng**.
5. **Không PASS giả.** Mọi ngưỡng phải đo được và **chứng minh bằng ca đột biến**: trồng một ảnh
   cố tình vi phạm ⇒ máy phải bắt; đưa một ảnh hợp lệ dễ nhầm ⇒ máy phải cho qua.
6. **Rộng và đẹp là YÊU CẦU, không phải mong muốn.** *"Phải rộng thì người ta mới tìm, phải đẹp
   thì người ta mới có hứng."* Một cổng quá chặt giết mất cái rộng; quá lỏng giết mất cái đẹp.
   Đặc tả phải nói **đánh đổi này giải quyết ra sao** — đây là câu khó nhất của phiếu.

---

## 5 · MONG ĐỢI Ở BẢN ĐẶC TẢ

Đủ chi tiết để bên này dựng mà không phải đoán:

1. **Bảng ngành** — bao nhiêu ngành, tên, ranh giới, nguồn của phân loại.
2. **Thang đo CHUNG** — áp cho mọi ảnh. Mỗi trục: tên · cách đo · khoảng giá trị · ngưỡng đạt ·
   vì sao ngưỡng đó. Bố cục, tỉ lệ, ánh sáng, màu là bốn trục Hoà nêu đích danh.
3. **Thang đo RIÊNG từng ngành** — cắm vào đúng `nganh:*` đã có ở §3.
4. **Đường đi của một tấm ảnh** — *nhìn → hiểu → quyết import/không*. Nêu rõ mỗi bước đọc gì từ
   ảnh, dùng phương pháp gì (thị giác máy tính cổ điển? mô hình? cả hai?), trả ra gì.
5. **Ngưỡng nhận** — con số. Kèm cách hiệu chuẩn bằng `GU-PROFILE.md` làm nhãn vàng.
6. **Xử lý mơ hồ** — ảnh nằm giữa hai ngành, ảnh không thuộc ngành nào, ảnh đẹp mà sai ngữ cảnh.
7. **Việc con người còn phải làm** — nói thẳng máy KHÔNG quyết được cái gì. Đừng hứa quá.

---

## 6 · CÂU HỎI NGƯỢC — bên nhận nên hỏi lại nếu thấy phiếu thiếu

- Kho ảnh nguồn lấy từ đâu để có **cái rộng**? Unsplash/Openverse/Wikimedia đủ chưa cho kiến trúc
  và nội thất chất lượng nghề? Nếu chưa thì đề xuất nguồn nào.
- Máy đọc chạy **lúc nạp** (một lần cho mỗi ảnh) hay **lúc duyệt** (mỗi lần mở màn)? Ảnh hưởng
  thẳng tới việc local-first có gánh nổi không.
- 1.580 ảnh `gu-đích` của Hoà: **hiệu chuẩn máy**, hay **cũng cho lên mặt tiền**? Hai đường khác
  hẳn nhau.

---

## 7 · NGUỒN GỐC PHIẾU

Viết bởi lane `00 · MAIN · điều phối` (Claude Code), 30/08/2026, theo yêu cầu trực tiếp của Hoà:
*"sao không giao cho phiên nào chuyên cái này làm đi — bạn đi sâu vô cái này rồi app lệch nữa"*.

Mọi số trong phiếu đo trên máy Hoà cùng ngày. Chỗ nào chưa đo đều đã ghi rõ là **chưa đo**.
