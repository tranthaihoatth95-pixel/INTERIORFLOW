# ⑤-TỐT · KÍNH — G1 PHẲNG THUỘC MÔI TRƯỜNG · G3 BA TẦNG CÓ CẤU TẠO

**TỐT (G3 đã dựng, chờ mắt Hoà trên Electron)** · 23/08/2026 ·
ảnh **tôi đã mở**: `artifacts/visual-review/G3-vao-xuong-truoc-sau.png` (cột **SAU** và **V2**) ·
`artifacts/visual-review/M1-login-sang.png` (thẻ đăng nhập = G1/G2 trên app thật) ·
luật: `docs/mocks/LUAT-VAT-LIEU-KINH-G0-G3.md` · thi hành: `app/globals.css` `.if-vao-xuong`

## Nhìn thấy gì

### G3 — cột SAU và V2 của `G3-vao-xuong-truoc-sau.png`

Cả ba cột (TRƯỚC · SAU · V2) **cùng một màu gốc `#6a57f5`, cùng cỡ, cùng nền**. Bản vẽ nói
thẳng: *"Khác duy nhất ở CẤU TẠO."*

**Cột SAU** — *phim tím mỏng dưới khối kính trong*. Viên nang tím, nhưng **rìa rõ ràng đậm
hơn tâm**: hai đầu viên nang có một dải tím đặc, nhạt dần vào giữa. Dải đo hai ô bên dưới ghi
`TÂM · nhạt` / `RÌA · đặc` — và **hai ô nay khác màu thật**, không như cột TRƯỚC.

Chú thích kèm số: **oklab `L 0.647 → 0.353`**.

**Cột V2** — *phim thụt vào, kính có vành + bề dày*. Dải đo bên dưới có **BA** ô, không phải
hai: `TÂM` · `MÉP PHIM` · `VÀNH KÍNH` — ô thứ ba là một dải **trắng-xanh nhạt**, tức vành kính
trong bao ngoài phim tím. Chú thích: *"Ba vùng phân biệt được… Đây mới là CẤU TẠO, không phải
gradient."*

**Hàng dưới cùng — cỡ thật 326×44.** Bản vẽ tự cảnh báo:

> ⚠️ *Hàng dưới mới là thứ người dùng thật sự thấy. Bản vẽ to ở trên chỉ để soi cấu tạo.*

Ở cỡ thật, ba nút khác nhau **ít hơn hẳn** — nhưng vẫn phân biệt được: TRƯỚC phẳng, SAU và V2
có mép đặc.

### G1 — thẻ đăng nhập trên `M1-login-sang.png`

Thẻ bo góc lớn, viền **rất mảnh**, thân trong suốt. Quầng sáng của nền **đi xuyên qua** thân
thẻ: phần thẻ trên vùng sáng thì sáng hơn, phần trên vùng tối thì tối hơn. **Không phồng,
không thấu kính lồi, không quầng sáng ngoài.**

## VIỆC CON NGƯỜI được phục vụ

| Ai | Việc | Vật liệu làm gì cho họ |
|---|---|---|
| người dùng | *đâu là hành động chính* | **đúng một** vật trên màn có G3 ⇒ không cần mũi tên, không cần chú thích |
| người dùng | *đây có phải công cụ nghiêm túc* | vật liệu có cấu tạo đọc ra **tinh xảo**; vật liệu tô phẳng đọc ra **rẻ** |
| người duyệt | *bản vẽ này tin được không* | phép đo **một câu**, và cả **hàng cỡ thật** |
| người thi công | *dựng thế nào cho đúng* | **ba tầng có tên**, không phải một mô tả cảm tính |

## NGUYÊN TẮC có mặt

| # | Nguyên tắc | Nguồn |
|---|---|---|
| 1 | Thang **G0 → G3**, phân bổ đã chốt từng bề mặt | `LUAT-VAT-LIEU-KINH-G0-G3.md` §1 |
| 2 | G3 = **ba tầng không được gộp**: phim màu · khối kính trong · mép | cùng nguồn §G3 |
| 3 | Nghiệm thu: **rìa đặc hơn tâm; bằng nhau ⇒ trượt** | cùng nguồn |
| 4 | **CƯỜNG ĐỘ THEO NGHĨA, KHÔNG THEO KÍCH THƯỚC** | cùng nguồn §4 |
| 5 | **HIẾM MỚI CÓ GIÁ** — G3 khắp nơi ⇒ cả thang sụp | cùng nguồn §6 |
| 6 | G1 phải đọc ra là **HOÀ VÀO** trường ambient, không phải **đặt lên** nó | cùng nguồn §2 |
| 7 | G3 **không cần lưới nền** — bằng chứng nằm trong nút | cùng nguồn §Hệ quả |
| 8 | **G3 ≠ quầng sáng.** G3 với zero glow vẫn là G3 | `SKILL.md §5` |
| 9 | Bộ ảnh tham chiếu: kính **phẳng, mỏng, viền rất mảnh**; **không ảnh nào có G3 khối dày** | `REF-DNA` S7 |

## GIÁ TRỊ NẰM Ở ĐÂU — cơ chế

### ① Ba biến thể, một biến — nên kết luận là về CẤU TẠO, không về gu

Cả ba cột giữ **cùng màu, cùng cỡ, cùng nền**. Chỉ cấu tạo đổi.

Đây là thiết kế thí nghiệm, không phải trình bày phương án. Nếu ba cột khác cả màu lẫn cỡ thì
người xem không thể biết cái gì gây ra khác biệt, và mọi tranh luận rơi về *"tôi thích cái này
hơn"*. Giữ mọi thứ cố định trừ một biến thì kết luận **thuộc về biến ấy**.

⇒ **Cơ chế: một bản vẽ so sánh chỉ có giá trị khi nó cô lập đúng một biến.** Đây là khuôn nên
dùng cho mọi lượt trình phương án vật liệu.

### ② Phép đo một câu, và nó là hệ quả của quang học chứ không phải quy ước

> **Lấy màu ở TÂM và ở SÁT RÌA. Rìa phải ĐẶC hơn tâm. Bằng nhau ⇒ TRƯỢT.**

Vì sao đây là phép thử **đúng**, không phải một quy ước tuỳ tiện: nhìn thẳng xuống tâm là
xuyên qua **ít** kính; nhìn qua rìa cong thì đường quang **dài hơn**, màu cộng dồn nên đặc
lại. **Mọi** khối kính trong đặt trên phim màu đều có tính chất này, không ngoại lệ.

Tô phẳng thì tâm = rìa — và đó chính xác là thứ khiến mắt đọc ra **nhựa**.

⇒ **Cơ chế: một phép nghiệm thu tốt phải suy ra được từ vật lý của thứ nó kiểm.** Khi đó nó
không cãi được, và nó cũng **dạy** người thi công vì sao — nên họ dựng đúng ngay từ đầu thay
vì dựng rồi sửa.

Bản vẽ còn kèm số: **oklab `L 0.647 → 0.353`**. Đo trong **oklab** chứ không phải HSL là có
lý do đã trả giá: ngưỡng tồn tại để **MẮT** phân biệt được, mà HSL chia không gian theo toán
chứ không theo mắt.

### ③ Bằng chứng nằm TRONG chủ thể

Đây là lời giải trực tiếp cho F-14. Ở bản mới, bằng chứng khúc xạ **không cần nền**:
**mép phim màu bị khối kính nén lại ở hai đầu viên nang**. Đó là một nét thẳng bị bẻ, và nó
**không phụ thuộc thứ gì phía sau**.

⇒ **Cơ chế: khi bằng chứng nằm trong chủ thể, nó không thể bị chặn.** Bằng chứng ở ngoài luôn
có rủi ro *"bề mặt không nhận được nó"* — đúng cái bẫy F-14. Đây là nguyên tắc tổng quát, áp
được cho mọi mẫu vật chứng minh, không riêng kính.

### ④ Hàng cỡ thật — bản vẽ tự chống lại chính sức thuyết phục của nó

Dòng ⚠️ *"Hàng dưới mới là thứ người dùng thật sự thấy"* là chi tiết trung thực nhất của bản vẽ.

Nút phóng to gấp sáu lần thì mọi cấu tạo đều rõ và mọi phương án đều thuyết phục. Ở **326×44**
thì phần lớn khác biệt biến mất. Bản vẽ **tự đặt cỡ thật ngay bên dưới** để người duyệt không
bị bản phóng to đánh lừa.

⇒ **Cơ chế: bản vẽ phóng to là công cụ SOI, không phải công cụ DUYỆT.** Mọi bản vẽ vật liệu
phải kèm hàng cỡ thật — nếu không, ta đang duyệt một thứ không ai sẽ nhìn thấy.

### ⑤ G1 và G3 khác nhau về VAI, không về "lượng kính"

| | G1 (thẻ đăng nhập) | G3 (`Vào xưởng`) |
|---|---|---|
| vai | **thuộc về môi trường** | **hành động chữ ký** |
| cấu tạo | thân trong, mép sáng mảnh, gần như không phồng | ba tầng: phim · khối · mép |
| kích thước | **lớn** | **nhỏ** |
| cường độ | **thấp** | **cao** |

Chú ý cặp cuối: vật **lớn** mang vật liệu **nhẹ**, vật **nhỏ** mang vật liệu **mạnh** —
ngược hẳn phản xạ tự nhiên. Luật nói thẳng:

> **Cường độ theo NGHĨA, không theo KÍCH THƯỚC. Đây là chỗ dễ sai nhất: mắt hay thưởng kính
> cho vật to.**

⇒ **Cơ chế: gắn cường độ vào diện tích thì thang bậc sụp**, vì diện tích do bố cục quyết định,
còn tầm quan trọng thì không. Trên `M1-login-sang.png` điều này đúng: thẻ to gần như phẳng,
nút nhỏ là thứ duy nhất mang G3 — nên chỉ có **một** đích trên cả màn.

## KHÔNG ĐƯỢC CHÉP GÌ

- ⛔ **Đừng chép cột V2 rồi coi là bản chốt.** Bản vẽ bày **hai** hướng đã đạt phép thử (SAU
  và V2). Trạng thái: 🟡 **CANDIDATE — chờ mắt Hoà trên Electron**. Sắc độ và độ đặc cụ thể là
  **quyền của Claude Design**; MAIN chỉ dựng đúng mô hình vật lý, **không tự chọn thẩm mỹ**.
- ⛔ **Đừng lấy `L 0.647 → 0.353` làm hằng số.** Đó là số đo của **một** cấu tạo với **một**
  màu. Thứ mang đi được là **phép thử** (rìa đặc hơn tâm), không phải cặp số.
- ⛔ **Đừng chép G3 sang bề mặt thứ hai.** Phân bổ đã chốt: `Vào xưởng` là G3; *thấu kính
  đang-chọn của segmented* là **G2–G3, chỉ khi thật đáng*. Hết. Widget Home · sidebar · vỏ
  trên đều là **G0–G1**.
- ⛔ **Đừng đọc "kính có cấu tạo" thành "kính dày hơn".** `REF-DNA` S7: **không ảnh tham chiếu
  nào có G3 khối dày**. Ở G1 gần như **không phồng**; cấm thấu kính lồi dày, khúc xạ cường
  điệu, vành bóng nặng, vành caustic dày, vẻ thạch/nhựa.
- ⛔ **Đừng thêm quầng sáng ngoài để nút "nổi hơn".** Cấm tường minh, và G3 zero-glow vẫn là G3.
- ⛔ **Đừng đi sửa bố cục đã có CHỈ để nhét thêm kính.**

## NGUYÊN TẮC THAY THẾ ĐÚNG

> **Vật liệu là CẤU TẠO có tên, đo được bằng một câu, và HIẾM.**

Bốn ràng buộc mang đi được:

1. **Dựng theo tầng, không theo hiệu ứng.** Phim màu ở đáy · khối kính trong · mép. Màu
   **không bao giờ** là thân.
2. **Nghiệm thu bằng một phép đo suy ra được từ vật lý.** Rìa đặc hơn tâm. Đo trong **oklab**.
3. **Cường độ theo NGHĨA.** Vật lớn được phép gần như phẳng; hành động nhỏ mà hệ trọng được
   mang vật liệu mạnh.
4. **Mọi bản vẽ vật liệu phải có hàng CỠ THẬT.** Bản phóng to là để soi, không phải để duyệt.

Đối chiếu: `BAD/kinh-soc-thu-va-gel-tim.md` · số đo hai bên:
`BEFORE-AFTER/g3-vao-xuong-nhua-thanh-kinh.md`.
