# ④-XẤU · AUTH — MÀN KHOÁ TO TRỐNG RỖNG, CỤM NỘI DUNG BÉ TÍ

**XẤU** · 22/08/2026 · ảnh **tôi đã mở**: `artifacts/visual-review/K2-lock-face.png`
*(cùng bộ, **tôi CHƯA mở**: `K1-cold-ambient.png` · `K2b-the-xac-thuc.png` ·
`K2c-reduce-motion.png` · `K3-unlock-resume.png` — liệt kê để biết chúng tồn tại,
đừng trích mô tả về chúng từ tệp này.)*

## Nhìn thấy gì

Màn 1440×900. Nền kem gần trắng, có vài vệt mờ rất nhạt (một vệt tím phớt dưới-phải giữa,
vài vệt xám ở góc) — **mờ tới mức phải nhìn kỹ mới thấy**.

Chính giữa màn, một cụm dọc:

- một vòng tròn nhỏ có ổ khoá (đường kính ≈ 46px);
- `10:14` — chữ số lớn, đậm, đen;
- `Mặt bằng · Studio 48m²  ·  2D Kỹ thuật`;
- *"Đo hai lần, dựng một lần."* — chữ nghiêng, nhạt;
- một nút viền `Mở lại ↵`.

Cụm ấy **cao ≈ 270px, rộng ≈ 210px**, tức khoảng **4–5% diện tích màn** *(ước lượng từ ảnh)*.
Toàn bộ phần còn lại — trên, dưới, trái, phải — là nền trơn.

Không có gì khác trên màn. Không logo, không tên app, không đường viền, không ảnh.

## VIỆC CON NGƯỜI

Người dùng vừa rời máy và quay lại. Việc của họ:

| Câu | Màn trả lời? |
|---|---|
| *máy này của tôi chứ?* | 🟡 gián tiếp — `Mặt bằng · Studio 48m²` là việc của họ |
| *tôi đang dở cái gì?* | 🟡 một dòng chữ nhỏ, **cỡ nhỏ thứ ba trên màn** |
| *vào lại thế nào?* | ✅ một nút |
| *bao lâu rồi?* | ❌ `10:14` là **giờ hiện tại**, không phải *"khoá 20 phút trước"* |

Và câu hỏi lớn nhất: **thứ to nhất trên màn là `10:14`.** Người dùng có cần biết giờ không?
Đồng hồ hệ điều hành đang ở góc màn, cách đó vài chục pixel.

⇒ **Thông tin duy nhất được nhấn mạnh là thông tin duy nhất người dùng đã có sẵn.**

## NGUYÊN TẮC bị vi phạm

| # | Luật | Nguồn |
|---|---|---|
| 1 | *"Vật này phục vụ VIỆC GÌ của con người?"* — `10:14` không trả lời được | `checks/human-centric-checklist.md`, luật nền `SKILL.md §0` |
| 2 | Khoảng trống là **vật liệu bố cục**, và vật liệu phải **làm việc** | chốt 20/08 |
| 3 | Nội dung **đứng thẳng trên MÔI TRƯỜNG** — mà ở đây môi trường gần như không tồn tại | `REF-DNA` S1 |
| 4 | *"Màn rất trống vẫn sang, không nghèo"* — điều kiện là **có môi trường** | `REF-DNA` S4 |
| 5 | Thứ bậc bằng **kích thước + độ trong** — dùng đúng cơ chế, **sai đối tượng** | `REF-DNA` S2 |
| 6 | Hình minh hoạ toàn app: ưu tiên **đúng nội dung → điện ảnh → quiet luxury**; màn trống không để trắng khi có thể minh hoạ | chốt Hoà 10/08, `docs/00-CHOT.md` |
| 7 | Màn khoá là chỗ KTS **thả ảnh render của mình** (ranh giới đã chốt: màn khoá dùng ảnh, Home dùng ánh sáng) | chốt Hoà 16/08 |
| 8 | Nút *"Vào xưởng"* là **G3** — hành động chữ ký | `docs/mocks/LUAT-VAT-LIEU-KINH-G0-G3.md` §Phân bổ chốt |

## VÌ SAO NÓ HỎNG — CƠ CHẾ

### ① Trống không phải là tội; trống KHÔNG LÀM GÌ mới là tội

Đây là chỗ dễ rút sai bài học nhất, nên phải tách bạch.

`REF-DNA` S4 ghi ảnh `VOID` có nội dung chiếm **~20% màn** — và nó **sang**. Ảnh `FUJI`,
`HK` cũng rất trống. Vậy vì sao chúng sang mà màn này nghèo?

| | Ảnh tham chiếu | `K2-lock-face.png` |
|---|---|---|
| phần trống là gì | **một môi trường** — ảnh núi, ảnh thành phố, một trường xám có sắc độ | **giấy trắng** |
| nó làm gì | chở không khí, giờ giấc, tâm trạng | không gì |
| nội dung đứng trên nó | **thuộc về** nó | **nổi trên** nó |

⇒ **Cơ chế: khoảng trống chỉ là vật liệu khi nó CÓ CHẤT.** Trống + có chất = rộng rãi.
Trống + không chất = **bỏ hoang**. Cùng một tỉ lệ diện tích, hai kết quả ngược nhau.

Và vệt mờ trong ảnh này chứng minh **ai đó đã biết điều đó** — có ý định làm ambient. Nó chỉ
**quá nhạt để tồn tại**. Đúng họ bệnh với nền Home: gradient `rgba(254,254,255,.85)` trên nền
`rgb(242,242,247)`, chênh **3 điểm sáng** — vẽ đúng, và vô hình.

> **Một hiệu ứng dưới ngưỡng nhìn thấy không phải là một hiệu ứng nhẹ. Nó là không có.**
> Và nó tệ hơn không làm gì, vì nó khiến ta tin rằng đã làm rồi.

### ② Kích thước đang đánh dấu sai thứ

Thang cỡ chữ trên màn, từ to xuống nhỏ:

| Hạng | Nội dung | Giá trị với người dùng |
|---|---|---|
| 1 | `10:14` | **họ đã có** — đồng hồ hệ điều hành cách đó vài chục px |
| 2 | `Mặt bằng · Studio 48m²` | **cao** — đây là việc của họ |
| 3 | `2D Kỹ thuật` | cao |
| 4 | *"Đo hai lần, dựng một lần."* | **bằng không** — một câu châm ngôn |

Thứ tự cỡ chữ **gần như ngược** thứ tự giá trị.

⇒ **Cơ chế: kích thước là một lời khẳng định về mức quan trọng, và nó phát ra dù ta có định
hay không.** Cho `10:14` cỡ lớn nhất là nói *"giờ là thứ quan trọng nhất ở đây"* — và người
dùng tin, rồi thất vọng.

Đối chiếu `REF-DNA` S2: ảnh tham chiếu cũng có **chữ số giờ khổng lồ**. Nhưng ở đó, màn khoá
điện thoại **chỉ có đúng một thông tin**, nên giờ *là* nội dung. Ở IF, màn khoá có **việc
đang dở** — và việc phải thắng giờ. Chép hình mà không chép hoàn cảnh là cách một tham chiếu
đúng biến thành một quyết định sai.

### ③ Cụm 4–5% diện tích: mọi thứ đều là một hạng

Cả năm phần tử nằm trong một cột hẹp 210px, cùng căn giữa, cách nhau đều. Ổ khoá, giờ, việc,
châm ngôn, nút — **cùng một khối**.

Khi mọi thứ chen vào một cụm nhỏ, chúng thành **một vật duy nhất**, và mắt không phân tích
nội bộ nữa. Người dùng đọc *"có gì đó ở giữa màn"*, rồi tìm nút.

⇒ **Cơ chế: nén nội dung vào một cụm nhỏ là xoá thứ bậc bên trong nó**, dù từng phần tử vẫn
khác cỡ chữ. Thứ bậc cần **khoảng cách** để đọc được, và ở 210px thì không còn khoảng cách nào.

### ④ Châm ngôn — vật thứ hai không phục vụ việc nào

*"Đo hai lần, dựng một lần."* Nó hay. Nó không trả lời câu nào của người dùng lúc ấy.

Chốt 23/08 gọi tên đúng lớp này:

> ⛔ Cấm card kiểu *"Have a productive day!"* — **không mang tin thì không được chiếm chỗ.**

⇒ **Cơ chế: một câu hay là một chi phí ẩn — nó chiếm một dòng, một lượt đọc, và một bậc trong
thang thứ bậc.** Chi phí ấy trả **mỗi lần khoá màn**.

### ⑤ Đây là màn thứ hai trong app mắc cùng một lỗi

Home: 480px trống dồn xuống đáy. Màn khoá: ~95% màn trống. Hai màn khác nhau, **cùng một cơ chế**:
bố cục cho một lượng nội dung, nội dung thật ít hơn, và **không ai thiết kế phần dư**.

⇒ Theo luật `02-FAILURE-LEDGER`: **same class twice = process failure.** Chữa từng màn không
đủ — phải chữa ở **hợp đồng**: mọi hợp đồng thiết kế phải có ô **RỖNG** trả lời *"nội dung ít
hơn dự kiến thì phần dư làm gì"*. Ô ấy nay bắt buộc trong `contracts/design-contract-template.md`.

## HỌC GÌ

1. **Trống phải CÓ CHẤT.** Trống + môi trường = rộng rãi; trống + giấy trắng = bỏ hoang.
2. **Hiệu ứng dưới ngưỡng nhìn thấy = không có hiệu ứng.** Nghiệm thu ambient bằng **số** —
   chênh sáng, chênh sắc — không bằng *"đã bật chưa"*.
3. **Cỡ chữ phải xếp theo giá trị với người dùng**, không theo *"cái gì trông hợp làm tiêu đề"*.
4. **Đừng nhấn mạnh thứ người dùng đã có sẵn ở nơi khác.**
5. **Thứ bậc cần khoảng cách để đọc được.** Nén hết vào một cụm nhỏ là xoá thứ bậc.
6. **Câu hay mà không mang tin thì không được chiếm chỗ.**
7. **Hợp đồng phải thiết kế trạng thái ÍT NỘI DUNG**, không chỉ trạng thái đủ nội dung.

## KHÔNG ĐƯỢC CHÉP GÌ

- ⛔ **Đừng đọc bài này thành "màn khoá phải dày nội dung".** Ngược hẳn: nó **nên** rất trống.
  Thứ phải sửa là **chất của phần trống**, không phải lượng nội dung.
- ⛔ **Đừng chữa bằng cách thêm widget vào màn khoá.** Đó là cơ chế ① của cặp Home — lấp ô
  trống bằng nội dung bịa.
- ⛔ **Đừng gỡ `10:14` đi.** Giờ trên màn khoá là quy ước quen thuộc và có ích. Lỗi là **hạng**
  của nó, không phải **sự tồn tại**.
- ⛔ **Đừng lấy số 4–5% / 210×270px làm chuẩn ngược** (kiểu *"cụm phải chiếm ≥30%"*). Đó là
  ước lượng bằng mắt trên một ảnh. Chúng chứng minh cơ chế, không định nghĩa tỉ lệ.
- ⛔ **Đừng chép "chữ số khổng lồ" từ `REF-DNA` S2 vào đây rồi coi là đã theo tham chiếu.**
  Tham chiếu ấy là màn khoá **chỉ có một thông tin**. IF có việc đang dở — hoàn cảnh khác.

## NGUYÊN TẮC THAY THẾ ĐÚNG

> **Màn khoá là MỘT MÔI TRƯỜNG có một việc đang chờ — không phải một tờ giấy trắng có một
> cụm chữ ở giữa.**

Bốn câu thi hành được:

1. **Phần trống phải là môi trường thật** — ảnh render của chính KTS (đây đúng là ranh giới
   đã chốt 16/08: **màn khoá dùng ảnh**, Home dùng ánh sáng), hoặc một trường có sắc độ đo
   được. Nghiệm thu bằng số, không bằng *"đã bật"*.
2. **Việc đang dở là thứ to nhất**, không phải giờ. Giờ hạ xuống hạng phụ.
3. **Chữ đọc được nhờ lớp phủ chuyển sắc CỤC BỘ đúng dải có chữ**, nền để **nét** — không bôi
   mờ cả ảnh (chốt A2 16/08). **Đo tương phản TẠI CHÂN CHỮ**, không đo trung bình cả màn.
4. **Nút vào lại là G3** — hành động chữ ký, và là **thứ duy nhất** trên màn được mang G3.
   Xem `GOOD/kinh-g1-g3-dung-cau-tao.md`.

Xem tiếp: `GOOD/auth-ambient-lien-tuc.md`.
