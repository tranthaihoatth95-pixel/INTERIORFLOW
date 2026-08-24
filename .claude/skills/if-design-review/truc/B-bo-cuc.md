# TRỤC NHÓM B · BỐ CỤC & CẢNH QUAN

Năm trục máy **không** chấm được. Làm bằng mắt trên ảnh app thật.

---

## B1 · THỨ BẬC THỊ GIÁC

**CÂU HỎI:** Có đọc ra thứ tự **1 → 2 → 3** mà không cần suy nghĩ không? — CÓ / KHÔNG

**CÁCH ĐO — bài ba tầng:** nhìn ảnh, viết ra ba thứ theo thứ tự mắt chạm.
Đạt khi ba thứ đó **khác hạng rõ rệt** và đúng thứ tự người dùng cần.
Trượt khi: hai thứ tranh nhau hạng nhất · thứ tự mắt đi ngược thứ tự việc · phải đọc chữ mới
biết cái nào quan trọng.

**Kênh tạo hạng — đếm xem màn dùng mấy kênh:** kích thước · trọng lượng chữ · độ tương phản ·
diện tích · khoảng trống bao quanh · vị trí. Dùng **≤1 kênh** cho toàn màn ⇒ hạng quá yếu, trượt.
Dùng **màu** làm kênh duy nhất ⇒ trượt (`if-design/SKILL.md` §6:
*"Colour must never be the only carrier of meaning"*).

⚠️ Khoảng trống là **kênh mạnh nhất và bị bỏ quên nhiều nhất**: vật quan trọng cần **nhiều thở
quanh nó hơn**, không phải viền dày hơn.

---

## B2 · TRỌNG LƯỢNG KHUNG VIỀN

**CÂU HỎI:** Đường kẻ / viền / nền thẻ có đang **nặng hơn** nội dung nó chứa không? — CÓ / KHÔNG
(CÓ = trượt)

**CÁCH ĐO:** nheo mắt tới khi chữ nhoè. Còn nhìn thấy gì?
- Còn thấy **lưới đường kẻ và khung hộp** ⇒ trượt — khung đang là hình, nội dung là nền.
- Còn thấy **các mảng nội dung** ⇒ đạt.

Đếm trên một khối bất kỳ: nó đang được **bao nhiêu** lớp phân định? (viền + nền + bóng + bo +
đường kẻ trong). **≥3 lớp cho cùng một ranh giới** ⇒ thừa — một ranh giới chỉ cần một kênh.

**Luật nền:** chốt 16/08 — *"không thích đường kẻ ngăn một cái rẹt chia card"*, tách vùng bằng
**chuyển sắc / khoảng trống**, không bằng đường kẻ. Ranh giới: cấm **đường kẻ NGANG chia card
thành khối**; **không** cấm vạch dọc mảnh tách các con số cùng hàng.

---

## B3 · MẬT ĐỘ THÔNG TIN

**CÂU HỎI:** Mật độ có khớp với **loại việc** của màn này không? — CÓ / KHÔNG

**Bốn mật độ hợp lệ** (`IF-MOTION-VISUAL-LAW` + chốt 20/08 luật hình học mục ④):

| Bề mặt | Mật độ đúng |
|---|---|
| Home | roomy — thoáng, ít vật, thở nhiều |
| Files · Library | balanced |
| 2D · 3D | compact — nhiều lệnh, tay đang làm việc |
| Present | editorial |

**CÁCH ĐO:** ước lượng tỉ lệ **mực / khoảng trống** trong vùng nội dung chính, so với bảng trên.
Home mà chật như 2D ⇒ trượt. 2D mà thoáng như Home ⇒ cũng trượt (lãng phí tay nghề, bắt người
dùng đi tìm lệnh).

⚠️ **Khác mật độ KHÔNG được khác hệ thiết kế**: mật độ đi qua token `--tap/--row/--gap` có sẵn
(`globals.css:105`), không phải bằng cách tự chế cỡ mới cho từng màn. Thấy màn tự chế thang riêng
⇒ trượt, xếp **H3 · hỏng kiến trúc**.

---

## B4 · LỘ DẦN

**CÂU HỎI:** Nấc mặc định có **đủ tự thân** không, và nấc to có mang thứ nấc nhỏ **không thể**
mang không? — CÓ / KHÔNG

**Hai vế nghiệm thu, phải đạt CẢ HAI** (chốt 16/08):
1. Che các nấc to đi ⇒ **nấc mặc định vẫn đứng được một mình**, gọn và tươm tất.
2. Nấc to phải có thứ nấc nhỏ **KHÔNG THỂ** có — **không phải** thứ nấc nhỏ có mà bé hơn.

**⛔ Vế 2 là vế chặn kéo giãn.** Ba nấc phải là **ba công năng**, không phải ba cỡ:
mỗi nấc trả lời **một câu hỏi khác**, nấc to **thêm một lớp tin**, không phóng to lớp cũ.

**CÁCH ĐO:** đặt hai nấc cạnh nhau. Liệt kê thông tin có ở nấc to mà **không** có ở nấc nhỏ.
Danh sách rỗng, hoặc chỉ toàn "cùng thứ nhưng to hơn / dài hơn" ⇒ **trượt** — nấc đó không đáng
tồn tại, và kết luận đúng là **bỏ nấc**, không phải chỉnh nấc.

**Bảng nhịp chung IF** (đối chiếu, đừng để mọc nhịp thứ hai): sidebar 28 / 240 / 320 ·
card gọn / vừa / đầy · tool: thanh chung / gói lệnh / cửa sổ công cụ.
Ở card: **icon biến mất từ nấc vừa trở đi** khi đã có chữ — giữ cả hai là nói một điều hai lần.

⚠️ **Không phải mục nào cũng xứng đáng có ba nấc.** Mục không có gì để nhìn (vd Cài đặt) thì nấc
thứ ba là kéo giãn ⇒ bỏ. Ba nấc là **nhịp chung**, không phải **hạn ngạch bắt buộc**.

---

## B5 · MỀM DẺO WORKSPACE

**CÂU HỎI:** Người dùng có làm chủ được cách bày bàn làm việc của mình không? — CÓ / KHÔNG

**CÁCH ĐO — chín khả năng của ToolWindow** (`if-design/SKILL.md` §10). Với bề mặt có panel/cửa
sổ công cụ, đánh dấu từng cái **thấy được trên ảnh / thao tác được / không có**:
`move · dock · undock · resize · collapse · pin · auto-hide · focus · close`.

Trượt khi:
- panel **cố định cứng**, không thu/mở được, không có tay nắm
- **auto-hide** áp đặt (thứ bị chửi nhiều nhất ở cả 3dsMax/Blender/Rhino/SketchUp —
  `SPEC-PANEL-ROLLOUT-IDF.md`); thu thì phải còn **dải mỏng có nhãn**, không được biến mất
- IF **tự sắp lại** bàn của người dùng mà không hoàn tác được
- trạng thái thu/mở **không nhớ** giữa các phiên

**Nguyên tắc chốt:** *"The user owns final arrangement; IF may recommend, never override."*
Và tay nắm thu/mở là **MẪU CHUNG toàn app** (chốt 07/08 mục 10) — mỗi vùng tự chế một kiểu tay
nắm ⇒ trượt, xếp **H3**.
