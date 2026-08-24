# Bố cục kiểu ấn phẩm — IF không phải dashboard SaaS

## 1 · CÂU HỎI MODULE NÀY TRẢ LỜI
- Vì sao Trang chủ IF không được là một lưới thẻ?
- "Trường ambient" nghĩa là gì khi dựng thật, khác gì một ảnh nền?
- Có nhiều mục tin muốn hiện — bày thế nào cho ra một trang, không ra một bảng điều khiển?
- Khi nào được dùng lưới đều?

## 2 · LUẬT DÙNG ĐƯỢC NGAY

**E-0 · LUẬT NỀN CHO HOME.**
> **Trường ambient LÀ CĂN PHÒNG. Các mục tin là VẬT TRONG PHÒNG — không phải THẺ TRONG LƯỚI.**

Hệ quả trực tiếp: vật trong phòng **không đều nhau**, không cùng cỡ, không cùng độ nổi, và **phần
lớn nằm sát nền**. `LUAT-VAT-LIEU-KINH-G0-G3` §5 nói đúng điều này bằng vật liệu: *"lúc nghỉ,
ranh giới phần lớn widget gần như biến mất; chỉ việc đang làm nhô lên một chút."*

**E-1 · CẤM NGANG TRỌNG LƯỢNG.** Cấm đặt **Tiếp-tục · Dự án · Ghi chú · Vật liệu · Cảm hứng**
cùng trọng lượng thị giác. Phải **chọn một nhân vật chính** (Home: *Tiếp tục việc dở*), phần còn
lại **lùi** hoặc **biến mất** khi không có dữ liệu thật.

**E-2 · BA LỚP CHIỀU SÂU.** Mọi bố cục IF khai được ba lớp:
- **Hậu cảnh** — trường ambient: ánh sáng, sắc độ, hướng sáng. Không chi tiết cạnh tranh chữ.
- **Trung cảnh** — nội dung thứ cấp, nằm sát nền, ranh giới mờ.
- **Tiền cảnh** — đúng một hai vật: việc đang làm + hành động chính.

**E-3 · TRỤC VÀ NEO.** Mỗi trang có **một trục thị giác** (mép trái nội dung, hoặc một cột mạnh),
mọi vật căn theo nó. **Neo** = vật nặng nhất, đặt lệch tâm chứ không giữa; các vật khác đọc ra là
quay quanh nó. Không trục ⇒ mắt trôi.

**E-4 · KHOẢNG TRỐNG LÀ VẬT LIỆU, KHÔNG PHẢI CHỖ THỪA.** Khoảng trống lớn quanh nhân vật chính là
thứ **tạo ra** nhân vật chính. Cấm lấp trống bằng widget (xem `human-centered-design.md` H-0).
⚠️ Ngược lại cũng sai: trống **đều khắp** thì lại thành lưới rỗng — trống phải **không đều**.

**E-5 · NHỊP.** Đổi nhịp giữa các cụm (một mảng lớn, hai mảng nhỏ, một dải ngang) thay vì lặp cùng
một ô. Nhịp đều = bảng; nhịp đổi = trang.

**E-6 · KHỐI LƯỢNG THỊ GIÁC ≠ KÍCH THƯỚC.** Một mảng nhỏ nhưng tương phản cao nặng hơn một mảng to
nhạt. Cân trang bằng **khối lượng**, không bằng diện tích. Đây cũng là lý do `LUAT-VAT-LIEU §4`
cấm cho độ sâu quang học tỉ lệ với độ to.

**E-7 · TIÊU ĐIỂM CỤC BỘ.** Trong một vật lớn vẫn phải có một điểm dừng mắt (một con số, một
ảnh, một dòng). Vật lớn không tiêu điểm = mảng chết.

**E-8 · KHI NÀO ĐƯỢC DÙNG LƯỚI ĐỀU.** Được, và chỉ khi **các mục THẬT SỰ ngang hàng và có ảnh
thật để so sánh**: lưới thumbnail vật liệu · Gallery · kết quả render · món Thư viện (NT-3). Đó
là lưới **để so sánh**, không phải lưới để lấp trang. Home không thuộc loại này.

**E-9 · TẦNG SẢN PHẨM NÓI GIỌNG KHÁC** (NT-12): hồ sơ/deck/bảng vật liệu dùng giọng editorial —
serif, khoảng thở rộng, macro vật liệu — **tách hẳn** khỏi giọng chrome của app. Đừng bê ngôn ngữ
dashboard vào bản nộp cho khách, và ngược lại.

## 3 · VÌ SAO — cơ chế con người
Lưới đều là mặc định của **báo cáo**: nó nói *"đây là N mục cùng loại, bạn tự chọn"*. Đó là đúng
cho một bảng điều khiển giám sát, và sai cho một **bàn làm việc**: người tới bàn làm việc đã biết
mình muốn làm gì, họ cần **thấy chỗ tiếp tục**, không cần được hỏi lại mỗi sáng.

Bố cục ấn phẩm giải đúng chuyện đó: nó **trả lời trước** câu "nhìn đâu", nhờ chênh lệch khối
lượng. Đổi lại, nó đòi người dựng phải **quyết** — và đó là lý do lưới đều hấp dẫn: nó cho phép
hoãn quyết định. Hoãn quyết định ở tầng bố cục = đẩy quyết định đó xuống cho người dùng, mỗi ngày.

Với KTS nội thất còn một lý do nghề: khách hàng của họ đọc **hồ sơ**, không đọc dashboard. App
nói cùng ngôn ngữ với sản phẩm nó tạo ra thì cả hai cùng đáng tin.

## 4 · CA HỎNG THẬT CỦA IF
- **23/08 · tường thẻ trắng trên Trang chủ** — ca gốc của module này. Luật *"cấm lưới thẻ đều"*
  có từ 20/08, vẫn tái phạm 23/08. Chẩn ở `06-DESIGN-KNOWLEDGE-AUDIT`: luật nằm trong **chú thích
  một tệp `.ts`**, không ai đọc lúc dựng.
- **F-01** — cung mặt trời vẽ thành **thiết bị đo** đặt trên trang. Đúng bài học E-0: ánh sáng
  thuộc **căn phòng**, nó không được đóng vai một **vật** trong phòng.
- **F-14** — kính lỏng dựng sai lớp: `background: var(--accent)` biến màu tím thành **thân** khối
  kính. Bố cục ba lớp bị gộp làm một ⇒ ra nhựa. Xem `materials-g0-g3.md`.
- **`01-CLINICAL-UI-AUDIT` B1** — `Untitled flow` hiện trên **10/13** bề mặt ở lớp vỏ: một chuỗi
  vô nghĩa được đặt vào vị trí **ngữ cảnh hiện tại** (bậc ②), tức bố cục dành chỗ trang trọng cho
  thứ không có nội dung.
- **Materials — 4 lớp chrome** trong khi 10 màn khác 3 lớp: một lớp bọc thừa quanh nội dung là
  lỗi bố cục, không phải lỗi component.

## 5 · KIỂM THẾ NÀO
1. Chụp màn, blur 8px: có đọc ra **một** khối nặng không, hay ra một bàn cờ?
2. Đếm số vật có **cùng cỡ + cùng độ nổi**. Trên Home, quá 3 là báo động lưới thẻ.
3. Nhân vật chính có chiếm khối lượng thị giác rõ rệt hơn phần còn lại không? (không cần to nhất
   — cần **nặng nhất**)
4. Có trục căn chung không? Kẻ một đường dọc thử: bao nhiêu vật bám trục?
5. Che nền ambient đi: bố cục có sập thành lưới trần không? (nếu có thì nền đang gánh việc của bố cục)
6. Mục nào không có dữ liệu thật? Nó có **tự ẩn** không? (chốt 13/08: widget thiếu dữ liệu tự ẩn)
7. Lưới đều đang dùng ở đâu — các mục ở đó có **thật sự ngang hàng và cần so sánh** không? (E-8)

## 6 · ĐÀO SÂU
- `docs/mocks/LUAT-VAT-LIEU-KINH-G0-G3.md` §5 — Home đọc ra phải là gì
- `docs/CHOT-EXPERIENCE-SYSTEM-2026-08-20.md` — Home = Personal Work OS, hero = Resume
- `docs/design-campaign/dna/HOME-SPEC-2026-08-23.md`
- `docs/nc/NC-NGUYEN-TAC-GIAO-DIEN-TOAN-APP-2026-08-14.md` NT-3 · NT-12 · NT-17
- `docs/IF-MOTION-VISUAL-LAW.md` §II HOME
