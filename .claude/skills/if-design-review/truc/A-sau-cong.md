# TRỤC NHÓM A · SÁU CỔNG — hỏi trước mọi thứ khác

Sáu câu này chạy **trước** khi nhìn tới chữ, icon, màu, khoảng cách. Lý do: một màn sai ở đây thì
mọi thứ tinh chỉnh bên dưới đều là tô son cho cái sai. Trượt bất kỳ cổng nào ⇒ **không PASS**.

Mỗi cổng: **CÂU HỎI NHỊ PHÂN** (chỉ có/không) + **CÁCH ĐO** (làm được trên ảnh, không suy từ mã).

---

## A1 · VIỆC CỦA CON NGƯỜI

**CÂU HỎI:** Mọi vật nhìn thấy trên màn có phục vụ một việc của con người không? — CÓ / KHÔNG

**Danh sách trắng.** Một vật chỉ được tồn tại nếu rơi vào **đúng một** trong năm ô:

| # | Ô hợp lệ | Ví dụ đạt |
|---|---|---|
| 1 | **hiện diện con người** | ai đang ở đây, ai vừa sửa, ai đang chờ mình |
| 2 | **việc đang làm** | dự án dở, bước đang chạy, thứ chờ mình quyết |
| 3 | **điều cần chú ý** | cảnh báo, xung đột, hết hạn, sai chuẩn |
| 4 | **Design DNA** | vật liệu · ảnh · gu · bằng chứng thị giác của dự án |
| 5 | **tiện ích người dùng CHỦ ĐỘNG bật** | widget họ tự thêm, tự đặt chỗ |

**CÁCH ĐO:** liệt kê **từng khối** trên ảnh (không gộp "khu vực"), gán cho mỗi khối đúng một số
1–5. Khối nào không gán được ⇒ **vi phạm**. Khối nào phải gán hai số mới biện minh nổi ⇒ cũng là
vi phạm (nó đang làm hai việc, người đọc không biết nhìn nó để làm gì).

⚠️ Ô 5 là ô **bị lạm dụng nhất**. "Người dùng có thể bật" ≠ "người dùng đã chủ động bật". Widget
hiện **mặc định** mà biện minh bằng ô 5 ⇒ **vi phạm**, ghi rõ là biện minh sai ô.

**HẠI:** đây chính là cơ chế đẻ ra widget lấp chỗ — thứ `06-DESIGN-KNOWLEDGE-AUDIT.md` xếp là
**tri thức MỚI thật sự**, chưa từng có luật trước 23/08.

---

## A2 · NHÂN VẬT CHÍNH

**CÂU HỎI:** Nheo mắt nhìn, thứ đầu tiên đập vào có phải **việc của người dùng** không? — CÓ / KHÔNG

**CÁCH ĐO** (làm thật, không tưởng tượng):
1. Nhìn ảnh ở cỡ nhỏ / mờ (thu nhỏ ảnh, hoặc nhìn lướt 1 giây rồi ngoảnh đi).
2. Viết ra **một** thứ đập vào mắt trước tiên. Một, không phải ba.
3. Nếu phải nghĩ quá 2 giây mới trả lời được ⇒ **không có nhân vật chính** ⇒ TRƯỢT.

**TRƯỢT NGAY** nếu thứ đập vào là: **sidebar** · **thanh công cụ** · **ô tìm kiếm** ·
**tường thẻ** · header · logo · nút thêm · nền/hoạ tiết.

**Vì sao đây là trượt chứ không phải chuyện gu:** `if-design/SKILL.md` §1 chốt SIDEBAR là **bản
đồ**, không phải điểm đến; §4 chốt *"QUIET FIELD + ONE MEANINGFUL SIGNAL"*. Chrome giành vai
chính nghĩa là nội dung đã thua chrome — `if-design/SKILL.md` §16 hỏi thẳng
*"Does content dominate chrome?"*.

---

## A3 · CÁI GÌ CÓ THỂ BIẾN MẤT MÀ KHÔNG MẤT GÌ

**CÂU HỎI:** Có vật nào xoá đi mà người dùng **không mất khả năng nào** không? — CÓ / KHÔNG
(CÓ = trượt)

**CÁCH ĐO:** với **từng** khối, hỏi *"xoá nó thì người dùng mất việc gì cụ thể?"*.
Trả lời được bằng một **việc** (không phải bằng một **thông tin**) ⇒ giữ.
Trả lời kiểu *"mất thông tin tổng quan"* / *"màn trông trống"* ⇒ **thừa**.

Dấu hiệu vật thừa, đếm được trên ảnh:
- ô chỉ hiện **một con số** không dẫn tới hành động nào
- biểu đồ / heatmap không ai đọc để quyết gì (ca thật 02/08: *heatmap phù phiếm*)
- ô lặp lại điều đã nói ở nơi khác trên **cùng** màn
- ô tồn tại để **lấp lưới** cho cân đối

**Câu chốt:** *"màn sẽ trống"* **không phải** lý do giữ. Trống là kết quả đúng khi chưa có việc —
`if-design/SKILL.md` §11: *"Silence beats fabrication."*

---

## A4 · PHÁT HIỆN TƯỜNG THẺ

**CÂU HỎI:** Đây có phải một tường thẻ không? — CÓ / KHÔNG (CÓ = TRƯỢT)

**ĐỊNH NGHĨA ĐO ĐƯỢC — trượt khi hội đủ cả bốn:**

| # | Dấu hiệu | Đo thế nào trên ảnh |
|---|---|---|
| 1 | **nhiều thẻ** | ≥ 4 khối cùng hạng nằm trên một lưới |
| 2 | **ngang trọng lượng** | không thẻ nào to hơn / đậm hơn / sáng hơn rõ rệt |
| 3 | **cùng chất liệu** | cùng nền, cùng viền, cùng bo, cùng đổ bóng |
| 4 | **chia đều diện tích** | các ô xấp xỉ bằng nhau, khe đều nhau |

Hội đủ bốn ⇒ **không có nhân vật chính theo cấu tạo** — không phải "chưa chỉnh xong", mà là
**lưới đã cấm nhân vật chính tồn tại**. Đây là lý do A4 tách khỏi A2.

**LUẬT:** chốt 20/08 + 22/08 cấm lưới thẻ đều. `06-DESIGN-KNOWLEDGE-AUDIT.md` ghi rõ vì sao luật
này vẫn bị phạm: *"luật nằm trong chú thích một tệp `.ts`, không ai đọc lúc dựng"* ⇒
**bắt buộc đối chiếu bằng HÌNH** với `examples/BAD/**`, chữ không đủ.

**Ca thật:** 23/08 lane HOME ⇒ tường thẻ trắng ⇒ Hoà: **"XẤU"**.

---

## A5 · CÓ GIỐNG DASHBOARD SaaS CHUNG CHUNG KHÔNG?

**CÂU HỎI:** Che logo đi, màn này có thể là của bất kỳ sản phẩm nào không? — CÓ / KHÔNG
(CÓ = trượt)

**CÁCH ĐO — bài kiểm che nhãn:** che logo + che mọi chữ tiếng Việt/tên riêng. Hỏi:
*"còn dấu vết nào nói đây là công cụ của người làm nội thất không?"*
Không còn ⇒ trượt. Dấu vết hợp lệ: bản vẽ · vật liệu thật · ảnh không gian · ký hiệu nghề ·
số đo · gu dự án. Dấu vết **không** hợp lệ: màu tím, tên "InteriorFlow", font.

**Danh sách cấm — thấy là trượt** (`if-design/SKILL.md` §4):
rainbow UI · neon · gradient khởi nghiệp · card farm · blur khắp nơi · kính bóng khổng lồ ·
glow trên mọi thứ · trang trí "AI magic" giả · dashboard viễn tưởng · KPI row bốn ô ·
vòng tròn tiến độ trang trí · biểu đồ mọc lên không ai đọc.

---

## A6 · SỰ THẬT DỮ LIỆU (cổng — bản sâu ở `truc/D-su-that.md`)

**CÂU HỎI:** Mọi con số và mọi dòng chữ trên màn có thật không? — CÓ / KHÔNG

**TRƯỢT NGAY khi thấy:** số bịa · fixture · `0/0` · `21/21` · `19 drafts` kiểu debris ·
`Untitled flow` làm danh tính · `__nb:` · khung rỗng chờ nội dung · ảnh mẫu đứng thay ảnh dự án ·
tên người bịa · thời gian bịa · thời tiết · nhiệt độ · "trending".

**CÁCH ĐO:** phân loại **từng** giá trị thành **REAL / DEMO / FIXTURE / PLACEHOLDER**.
Chỉ **REAL** được phép định hình bố cục. Có ≥1 giá trị không-REAL đang chiếm chỗ trong bố cục
⇒ trượt, và xếp **H2 · sai sự thật**.

⚠️ **Bẫy đã đo** (`if-design/SKILL.md` §11): *"Measured on the running app ≠ product truth"* —
15 hàng `Project` = 5 placeholder + ~4–5 fixture ⇒ dự án thật ≈ 0. Nhìn app thật thấy "có dữ
liệu" **không** chứng minh dữ liệu thật; phải hỏi dữ liệu đó từ đâu ra.

**Khung rỗng chờ nội dung** cũng trượt: nó là lời hứa hình ảnh cho thứ chưa tồn tại. Trạng thái
rỗng trung thực (nói rõ chưa có gì, và làm gì tiếp) thì **đạt** — hai thứ này khác nhau, đừng lẫn.
