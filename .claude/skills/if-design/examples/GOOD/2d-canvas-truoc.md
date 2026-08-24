# ③-TỐT · 2D — CANVAS TRƯỚC, CHROME LỘ DẦN THEO NGỮ CẢNH

**TỐT (một bước thật, chưa trọn)** · 22/08/2026 · ảnh **tôi đã mở**:
`artifacts/visual-review/S5-2d-gop-dai.png`

## 🔴 TÌNH TRẠNG — tệp này mô tả MỘT BƯỚC, không mô tả đích

Ảnh `S5` là bản **đã gộp dải**: bốn dải chrome trên canvas còn **hai**. Đó là một cải thiện
đo được và có ảnh hai bên.

**Nhưng nó chưa phải đích.** Trên chính ảnh ấy vẫn còn: dock hai hàng · ba nút nổi giữa
canvas · nhãn nhóm HOA (`VẼ` · `CẤU KIỆN` · `SỬA` · `ĐO & GHI CHÚ`) · và tầng ② vẫn trống.

⇒ Đọc tệp này như *"đây là hướng, và đây là một bước đã đi được"* — không phải *"màn này đạt"*.

## Nhìn thấy gì — so với `04-2d-full.png`

| | TRƯỚC (`04-2d-full.png`) | SAU (`S5-2d-gop-dai.png`) |
|---|---|---|
| dải chrome trên canvas | **4** | **2** |
| tab `Bản vẽ 1` + `+` | dải riêng ② | **biến mất khỏi dải riêng** |
| `1 sheet` | mép phải dải ② | **trôi lên hàng cùng** `Gửi sang Trình chiếu`, mép phải |
| `Gửi sang Trình chiếu` | dải riêng ③, mép **trái** | **mép PHẢI**, cùng hàng với `1 sheet` |
| câu 12 từ *"Khổ giấy · tỉ lệ…"* | có, chiếm cả một dải | **đã gỡ** |
| thanh công cụ | dải ④ | vẫn còn, nay là dải thứ 2 |
| canvas bắt đầu ở | y ≈ **166** | y ≈ **124** |
| nền canvas | tối | sáng, lưới nhạt |

Bốn thứ khác **giữ nguyên**, và phải nói ra: dock hai hàng · cụm ba nút nổi giữa canvas ·
nhãn nhóm HOA · rail trái.

## VIỆC CON NGƯỜI được phục vụ

Việc là **vẽ**. Ba thứ nó lấy lại được:

| | |
|---|---|
| **42px chiều cao** trả về cho canvas | không lớn, nhưng nó là chiều cao mà **không dải nào cần** |
| **hai dải ít hơn để mắt phải bỏ qua** | mỗi dải là một hàng mắt phải quét rồi loại. Loại hai hàng là loại hai lần |
| **một câu giải thích không còn thường trực** | *"Khổ giấy · tỉ lệ · khung tên đặt bên Trình chiếu"* — hỏi một lần, không được chiếm chỗ vĩnh viễn |

## NGUYÊN TẮC có mặt

| # | Nguyên tắc | Nguồn |
|---|---|---|
| 1 | Canvas là **nhân vật chính**; chrome không nuốt canvas | `01-CLINICAL-UI-AUDIT.md` §C |
| 2 | `STAGE` = *focus / view / mode*, không phải app shell riêng | `SKILL.md:34` |
| 3 | **Không ảnh tham chiếu nào có hai hàng thanh công cụ ngang** | `REF-DNA` S8 |
| 4 | Rail-icon-trái + canvas giữa + panel phải là khung được chống lưng | `REF-DNA` S8 |
| 5 | Câu hỏi hỏi-một-lần không chiếm chỗ vĩnh viễn | `SPEC-NGON-NGU-CHI-DAN.md`, 02/08 |
| 6 | **Cấm auto-hide** — gộp dải ≠ giấu dải | `SPEC-PANEL-ROLLOUT-IDF.md`, 03/08 |

## GIÁ TRỊ NẰM Ở ĐÂU — cơ chế

### ① Gộp, không giấu — và đây là ranh giới quan trọng nhất của cả tệp

Có hai cách làm chrome bớt đi, và chúng khác nhau về bản chất:

| | Giấu | **Gộp** |
|---|---|---|
| điều khiển | biến mất, phải rê/bấm mới hiện | **vẫn thấy** |
| người dùng | mất một thứ | **không mất gì** |
| luật | ⛔ vi phạm cấm-auto-hide | ✅ hợp lệ |

`S5` **gộp**: `1 sheet` và `Gửi sang Trình chiếu` vẫn trên màn, cùng một hàng. Số hàng giảm,
số thứ nhìn thấy **không giảm**.

⇒ **Cơ chế: chiều cao chrome là hàm của SỐ HÀNG, không phải số điều khiển.** Vì thế bao giờ
cũng nên hỏi *"hai dải này có thật sự cần hai hàng không"* **trước khi** hỏi *"bỏ bớt cái gì"*.
Câu hỏi thứ nhất thường miễn phí; câu thứ hai luôn tốn.

`SPEC-PANEL-ROLLOUT-IDF` khảo 3dsMax/Blender/Rhino/SketchUp và ghi: **auto-hide là thứ bị
chửi nhiều nhất ở cả bốn app**. Giấu là con đường dễ và nó đã bị bốn app trả giá thay ta rồi.

### ② Bỏ một dải bằng cách bỏ một CÂU, không bằng cách bỏ một chức năng

Dải ③ chứa **một câu** và **hai điều khiển**. Cách xử: bỏ câu, giữ điều khiển, cho điều khiển
đi ké hàng khác. **Không chức năng nào mất.**

Câu ấy trả lời *"khổ giấy ở đâu?"* — hỏi một lần khi mới học. Chỗ đúng của nó là **ô giải
nghĩa** hoặc **lần đầu dùng**, không phải một dải vĩnh viễn.

⇒ **Cơ chế: trước khi bỏ một chức năng, kiểm xem dải ấy có bao nhiêu phần là CHỮ GIẢI THÍCH.**
Chữ giải thích thường là phần lớn, và nó gỡ được mà không mất gì.

### ③ Mép phải là chỗ của thứ ít dùng — vị trí đã mang thông tin

`Gửi sang Trình chiếu` dời từ mép **trái** sang mép **phải**. Không phải chuyện thẩm mỹ:
trong chữ trái-sang-phải, mắt bắt đầu ở trái. Đặt một hành động **chuyển chặng** ở điểm bắt
đầu là để nó chặn đường tới việc chính.

Ở mép phải, cùng hàng với `1 sheet`, nó thành đúng cái nó là: **một lối ra**, không phải một
lời mời.

⇒ **Cơ chế: vị trí là một kênh thông tin, và nó luôn phát dù ta có định hay không.** Đặt sai
chỗ thì nó nói sai, miễn phí và liên tục.

### ④ Nền canvas sáng, lưới nhạt — nét vẽ thắng lưới

Ở `04-2d-full.png` nền tối và lưới rõ; nét tường màu be nổi lên nhưng phải cạnh tranh với
lưới. Ở `S5` nền sáng, lưới nhạt hơn, nét tường thành nét **đậm nhất trong khung**.

⇒ **Cơ chế: trong một bản vẽ kỹ thuật, thứ đậm nhất phải là NÉT NGƯỜI DÙNG VẼ.** Lưới là hệ
quy chiếu — nó phải đọc được và phải chịu thua nét. Đây là quy ước nghề, không phải gu:
`CHUAN-DAU-RA-NGHE.md` là chỗ nó thành luật.

## KHÔNG ĐƯỢC CHÉP GÌ

- ⛔ **Đừng chép ảnh này làm chuẩn cho 2D.** Nó vẫn còn **bốn** lỗi đã liệt kê ở đầu tệp.
  Nó chứng minh **một cơ chế** (gộp thay vì giấu), không chứng minh một màn đạt.
- ⛔ **Đừng đọc "gộp dải" thành "gộp mọi thứ vào một hàng".** Gộp đúng là khi hai dải **có
  cùng vai** (cả hai đều là ngữ cảnh của bản vẽ). Gộp thanh công cụ vào vỏ app là gộp hai vai
  khác nhau ⇒ ra một hàng chật và **lẫn cấp**.
- ⛔ **Đừng lấy "2 dải" thành hạn ngạch cho mọi bề mặt.** Present có nhu cầu khác. Con số
  chung là **trần**, và trần thì được phép dùng ít hơn.
- ⛔ **Đừng chép "nền sáng, lưới nhạt" sang 3D.** 3D là môi trường **không gian**, quan hệ
  hình/nền ở đó khác hẳn. Chép sang là áp một quy ước bản-vẽ-phẳng lên một viewport.
- ⛔ **Đừng dùng tệp này để hoãn tầng ②.** Gộp dải là bước rẻ. Bài thật vẫn là **101 nút phơi
  cùng lúc**, và nó chỉ giải được bằng nhóm lệnh.

## NGUYÊN TẮC THAY THẾ ĐÚNG

> **Giảm SỐ HÀNG trước, giảm SỐ ĐIỀU KHIỂN sau — và không bao giờ giảm bằng cách giấu.**

Thứ tự làm việc, rẻ dần tới đắt:

1. **Đếm dải.** Ghi con số vào hợp đồng. Không ai đếm thì nó tăng.
2. **Gỡ chữ giải thích thường trực.** Đưa vào ô giải nghĩa / lần đầu dùng. *Không mất gì.*
3. **Gộp các dải cùng vai.** Điều khiển vẫn thấy, số hàng giảm. *Không mất gì.*
4. **Dựng tầng ② (nhóm lệnh).** Đây là bước đắt, và là bước duy nhất giải được 101 nút.
5. **Chỉ sau bốn bước trên** mới bàn tới việc bỏ chức năng — và ở IF, câu trả lời gần như
   luôn là **không bỏ**: lệnh vẽ là vốn.

Đối chiếu: `BAD/2d-tuong-thanh-cong-cu.md` · số đo hai bên: `BEFORE-AFTER/2d-gop-dai-4-band-xuong-2.md`.
