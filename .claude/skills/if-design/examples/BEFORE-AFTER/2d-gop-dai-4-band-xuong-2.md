# TRƯỚC / SAU · 2D — BỐN DẢI CHROME XUỐNG CÒN HAI

**Ảnh thật ở CẢ HAI BÊN. Tôi đã mở cả hai.**

| | Ảnh | Ngày |
|---|---|---|
| **TRƯỚC** | `artifacts/visual-review/04-2d-full.png` | 22/08, 02:34 (theo dòng *"Đã lưu lúc 02:34"* trên ảnh) |
| **SAU** | `artifacts/visual-review/S5-2d-gop-dai.png` | 22/08, 10:56 |

Cùng màn (`Thiết kế 2D`, dự án `Dự án mới`), cùng khổ 1440×900, cùng nội dung vẽ (hai đoạn
tường vuông góc).

## ĐO ĐƯỢC — đếm trên ảnh

| Chỉ số | TRƯỚC | SAU | Đổi |
|---|---|---|---|
| **dải chrome ngang trên canvas** | **4** | **2** | **−2** |
| canvas bắt đầu ở y ≈ | 166 | 124 | **−42px** |
| dải riêng cho tab `Bản vẽ 1` + `+` | có | **không** | gộp |
| dải riêng cho `Gửi sang Trình chiếu` | có | **không** | gộp |
| câu *"Khổ giấy · tỉ lệ · lệ · khung tên đặt bên Trình chiếu."* | có (12 từ, thường trực) | **gỡ** | −1 câu |
| `1 sheet` | mép phải dải tab | cùng hàng với `Gửi sang Trình chiếu`, mép phải | dời |
| `Gửi sang Trình chiếu` | mép **trái**, dải riêng | mép **phải**, đi ké | dời |
| số điều khiển nhìn thấy được | *(không đếm chính xác)* | *(không giảm rõ rệt)* | ~0 |
| dock dưới canvas | 2 hàng | **2 hàng** | không đổi |
| cụm 3 nút nổi giữa canvas | có | **có** | không đổi |
| nhãn nhóm HOA (`VẼ`·`CẤU KIỆN`·`SỬA`·`ĐO & GHI CHÚ`) | có | **có** | không đổi |
| nền canvas | tối, lưới rõ | sáng, lưới nhạt | đổi |

## THỨ ĐÃ ĐỔI THẬT

**Hai dải biến mất, không chức năng nào biến mất.** `1 sheet` và `Gửi sang Trình chiếu` vẫn
trên màn, chỉ đi ké một hàng đã có. Thứ duy nhất **mất hẳn** là một **câu giải thích 12 từ**.

## VÌ SAO NÓ ĂN TIỀN — cơ chế

### ① Chiều cao chrome là hàm của SỐ HÀNG, không phải số điều khiển

Trước khi hỏi *"bỏ bớt cái gì"* — một câu hỏi luôn tốn — hãy hỏi *"hai dải này có thật sự cần
hai hàng không"*. Câu hỏi ấy thường **miễn phí**: nó lấy lại chiều cao mà không lấy đi gì.

Ở đây nó lấy lại **42px** và **hai lượt quét mắt**.

### ② Gộp ≠ giấu — và đây là ranh giới không được nhoè

| | Giấu | **Gộp** |
|---|---|---|
| điều khiển | biến mất, phải rê/bấm mới hiện | **vẫn thấy** |
| người dùng | mất một thứ | **không mất gì** |
| luật | ⛔ vi phạm cấm-auto-hide (`SPEC-PANEL-ROLLOUT-IDF`) | ✅ hợp lệ |

`SPEC-PANEL-ROLLOUT-IDF` khảo 3dsMax/Blender/Rhino/SketchUp và ghi: auto-hide là thứ **bị chửi
nhiều nhất ở cả bốn app**. Con đường dễ đã có bốn app trả giá thay ta rồi.

### ③ Phần lớn một dải chrome thường là CHỮ GIẢI THÍCH, và chữ ấy gỡ được

Dải ③ chứa **một câu** và **hai điều khiển**. Bỏ câu, giữ điều khiển. Câu ấy trả lời một câu
hỏi người dùng hỏi **một lần khi mới học** — chỗ đúng của nó là ô giải nghĩa hoặc lần đầu dùng,
không phải một dải vĩnh viễn chiếm chiều cao mỗi ngày.

⇒ **Trước khi bỏ chức năng, đo xem dải ấy có bao nhiêu phần là chữ giải thích.**

### ④ Vị trí là kênh thông tin, và nó phát dù ta có định hay không

`Gửi sang Trình chiếu` dời từ mép **trái** sang mép **phải**. Trong chữ trái-sang-phải, mắt
bắt đầu ở trái; đặt một hành động **chuyển chặng** ở điểm bắt đầu là để nó chặn đường tới việc
chính. Ở mép phải nó thành đúng cái nó là: **một lối ra**, không phải một lời mời.

## 🔴 THỨ CHƯA ĐỔI — phải nói ra

Đây là **một bước**, không phải đích. Bốn thứ giữ nguyên trên ảnh SAU:

1. **Dock hai hàng** — `REF-DNA` S8: *không ảnh tham chiếu nào có hai hàng thanh công cụ ngang*.
2. **Cụm ba nút nổi giữa canvas**, không neo vào gì, che canvas.
3. **Nhãn nhóm HOA TOÀN PHẦN** — vi phạm `LUAT-CHU-VIET-7.1.23` (31/07).
4. **Tầng ② (nhóm lệnh) vẫn trống** — nên **101 nút** vẫn phơi cùng lúc. Đây là bài thật, và
   gộp dải **không chạm tới nó**.

## HỌC GÌ — thứ tự làm việc, rẻ dần tới đắt

| # | Bước | Giá |
|---|---|---|
| 1 | **đếm dải**, ghi con số vào hợp đồng | miễn phí |
| 2 | **gỡ chữ giải thích thường trực** → ô giải nghĩa / lần đầu dùng | miễn phí |
| 3 | **gộp các dải CÙNG VAI** | miễn phí |
| 4 | **dựng tầng ② (nhóm lệnh)** | đắt — và là bước duy nhất giải được 101 nút |
| 5 | bàn tới bỏ chức năng | ở IF câu trả lời gần như luôn là **không bỏ** — lệnh vẽ là vốn |

⚠️ Bước 3 chỉ hợp lệ khi hai dải **cùng vai**. Ở đây cả hai đều là *ngữ cảnh của bản vẽ*.
Gộp thanh công cụ vào vỏ app là gộp **hai vai khác nhau** ⇒ ra một hàng chật và **lẫn cấp**.

## KHÔNG ĐƯỢC CHÉP GÌ

- ⛔ **Đừng lấy "2 dải" thành hạn ngạch cho mọi bề mặt.** Nó là **trần**, và trần thì được
  phép dùng ít hơn.
- ⛔ **Đừng dùng ảnh SAU làm chuẩn cho 2D** — bốn lỗi ở trên vẫn còn nguyên.
- ⛔ **Đừng dùng cặp này để hoãn tầng ②.** Bước rẻ đã xong; bài đắt còn nguyên.

Đọc kèm: `BAD/2d-tuong-thanh-cong-cu.md` · `GOOD/2d-canvas-truoc.md`.
