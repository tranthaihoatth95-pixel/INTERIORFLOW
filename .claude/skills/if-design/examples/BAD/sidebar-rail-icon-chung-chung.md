# ②-XẤU · SIDEBAR — RAIL ICON CỦA MỘT APP CAD BẤT KỲ

**XẤU** · 22/08/2026 · ảnh **tôi đã mở**:
`artifacts/visual-review/02-sidebar-collapsed.png` (nấc thu) ·
`artifacts/visual-review/04-2d-full.png` (nấc mở) ·
`artifacts/visual-review/ui-authority/home-production/real-home-1440.png` (nấc mở, trên Home)

## Nhìn thấy gì

### Nấc thu — `02-sidebar-collapsed.png`

Một dải dọc rộng ~52px, tối, chạy **suốt chiều cao màn**. Trong đó, từ trên xuống:

- một vòng tròn `HO` (ảnh đại diện) và một mũi tên `›`;
- **12 glyph, không glyph nào có chữ** *(đếm bằng mắt trên ảnh)*;
- chúng chia làm ba cụm, ngăn nhau **chỉ bằng khoảng trống** — không đường kẻ, không nhãn cụm;
- đúng **một** glyph có vạch tím mảnh bên trái;
- đáy: một mũi tên `›` thứ hai.

Cạnh nó, dựng đứng theo chiều dọc: chữ `LỚP`.

### Nấc mở — `04-2d-full.png` và `real-home-1440.png`

Danh sách có chữ, chia ba cụm bằng nhãn nhóm **HOA TOÀN PHẦN**: `VIỆC` · `DỰ ÁN MỚI` ·
`CHẶNG` (trên Home là `VIỆC` · `NHÁP` · `CHẶNG` · và thêm `DỰ ÁN` trong vùng nội dung).

Mỗi hàng là: một icon + một chữ. **Hết.** Không hàng nào mang thêm gì.

Trên `real-home-1440.png`: dải sidebar là khối kem **đặc**, và nó **đè lên** vùng nội dung —
chữ *"Tiếp tục Nháp"*, *"hôm nay"*, *"DỰ ÁN"*, *"Nháp"* đều bị mép phải của nó **cắt ngang**.

## VIỆC CON NGƯỜI nào bị đánh mất

Sidebar phải trả lời ba câu, theo đúng thứ tự người ta hỏi:

| Câu | Nấc thu (52px) trả lời | Nấc mở (240px) trả lời |
|---|---|---|
| **tôi đang ở đâu?** | 🟡 một vạch tím — nói được *ô nào*, không nói được *đó là gì* | ✅ |
| **tôi đi đâu được?** | ❌ 12 hình không nhãn | ✅ |
| **ở đó đang có gì?** | ❌ | ❌ **cả hai nấc đều không trả lời** |

Câu thứ ba mới là câu đắt. Người dùng bấm vào một mục **để biết trong đó có gì**. Nếu bản đồ
không nói được, họ phải **đi vào để xem, rồi quay ra** — mỗi lần là một lần đứt mạch.

Và trên Home, sidebar còn lấy mất một thứ nữa: **nó cắt chữ của nội dung.** Việc con người
lúc đó là *đọc xem tôi đang dở gì* — bản đồ đang chặn đúng việc ấy.

## NGUYÊN TẮC bị vi phạm

| # | Luật | Nguồn |
|---|---|---|
| 1 | `SIDEBAR` **là BẢN ĐỒ**, **KHÔNG** là *launcher* | `.claude/skills/if-design/SKILL.md:41` |
| 2 | Sidebar là **hệ router toàn app**; 3 chặng chỉ là **một** nhóm stage | chốt Hoà 16/08, `docs/00-CHOT.md` |
| 3 | Ba nấc = **ba CÔNG NĂNG**, không phải ba cỡ; **nấc to BỔ SUNG lớp tin, không phóng to lớp cũ** | chốt Hoà 16/08 |
| 4 | Nấc to nhất là **MẶT NHÌN của nội dung nó dẫn tới**, không phải "chữ to hơn" | chốt Hoà 16/08 |
| 5 | Icon giao diện **luôn có nhãn** (NT-8) | `docs/nc/NC-NGUYEN-TAC-GIAO-DIEN-TOAN-APP-2026-08-14.md` |
| 6 | Chữ Việt: **cấm hoa toàn phần** | `docs/LUAT-CHU-VIET-7.1.23-2026-07-31.md` |
| 7 | **Cấm auto-hide**; thu về dải mỏng **có nhãn** — thứ bị chửi nhất ở cả 4 app đối thủ đã khảo | `docs/SPEC-PANEL-ROLLOUT-IDF.md`, 03/08 |
| 8 | Lệnh chưa đủ điều kiện thì **hiện MỜ KÈM LÝ DO**, không biến mất, không câm | chốt 10/08 |
| 9 | **Sidebar mở rộng đẩy nội dung** — nằm trong OPEN CLASSES của ledger | `02-FAILURE-LEDGER.md` §OPEN CLASSES |

## VÌ SAO NÓ HỎNG — CƠ CHẾ

### ① Đây là hình mặc định của "app chuyên nghiệp", nên không ai phải chọn nó

Rail icon dọc suốt chiều cao là chữ ký thị giác của **mọi** phần mềm CAD/3D/đồ hoạ. Nó tới
mà không cần ai quyết định — hỏi *"để điều hướng ở đâu"* thì bộ nhớ trả về đúng hình này.

Bằng chứng nó là **mặc định chứ không phải lựa chọn**: `REF-DNA` S8 ghi rail-icon-trái xuất
hiện ở **5/15** ảnh tham chiếu. Một hình lặp nhiều tới mức đó thì nó là *nền văn hoá*, không
phải *quyết định thiết kế*. Chép nó = **không thiết kế gì cả**, và kết quả là IF trông giống
mọi app khác ở đúng chỗ đáng khác nhất.

### ② Nấc thu là nấc mở BỊ CẮT CHỮ — đó là kéo dãn, không phải công năng

Đây là gốc bệnh, và nó đã bị Hoà bắt **hai lần** (một lần cho card, một lần cho sidebar):

> *"3 size nó phải thật sự có công năng đúng của nó. Và size to là **BỔ SUNG CHI TIẾT** cho
> size nhỏ."* — Hoà, 16/08

Đối chiếu:

| | Nấc thu hiện tại | Nấc mở hiện tại | Thêm được gì |
|---|---|---|---|
| tin mang theo | 1 icon | 1 icon + 1 chữ | **chỉ có chữ** |

Một lớp tin. Bảy lần chiều rộng. Đó là định nghĩa của **kéo dãn**.

⇒ **Cơ chế: khi hai nấc chỉ khác nhau ở lượng chữ hiển thị, chúng là một nấc bị cắt xén —
và cái bị cắt luôn là cái nhỏ.** Nấc nhỏ vì thế không bao giờ *đủ tự thân*; nó luôn là
phiên bản thiếu.

### ③ 12 glyph không nhãn là 12 câu đố, và người dùng trả giá mỗi lần

Không có chữ thì phải nhớ. Nhớ 12 thứ là chi phí, và chi phí ấy trả **mỗi lần dùng**, không
trả một lần lúc học — vì 12 hình na ná nhau không hình thành trí nhớ vị trí bền.

Nặng hơn: **ba cụm ngăn nhau chỉ bằng khoảng trống.** Cấu trúc *cụm* là thông tin thật (đây
là việc của xưởng, kia là việc của dự án) — mà thông tin ấy bị mã hoá bằng một khoảng trắng,
tức bằng **sự vắng mặt của cái gì đó**. Sự vắng mặt không đọc được.

⇒ **Cơ chế: một khoảng trống không nói được nó ngăn cái gì với cái gì.** Muốn nói cấu trúc
thì phải có vật mang cấu trúc.

### ④ Vạch tím một chiều: nói được "ô nào", không nói được "cái gì"

Ở nấc thu, thứ duy nhất trả lời *"tôi ở đâu"* là một vạch tím **4px**. Nó nói được **vị trí
tương đối** (ô thứ 10). Nó **không** nói được **danh tính** (ô đó là *Thiết kế 2D*).

Với người đã thuộc rail thì đủ. Với người chưa thuộc thì vạch tím chỉ ra: *"bạn đang ở một
chỗ nào đó"*. Và người chưa thuộc chính là người cần bản đồ nhất.

⇒ **Cơ chế: dấu hiệu vị-trí-tương-đối không thay được nhãn danh tính.** Chúng trả lời hai câu
khác nhau, và app đang chỉ trả lời câu dễ.

### ⑤ Nhãn nhóm HOA TOÀN PHẦN — giết dấu, rồi giết luôn thứ bậc

`VIỆC` · `NHÁP` · `CHẶNG` · `DỰ ÁN`. Hai hỏng cùng lúc:

- **Chữ Việt** có dấu chồng mang nghĩa; hoa toàn phần làm dấu chen chúc, đọc chậm hơn.
  Đây là luật từ **31/07** — hơn ba tuần, và vẫn phạm.
- **Bốn nhãn hoa + mono + giãn chữ trông giống hệt nhau** ⇒ **không nhãn nào nổi**. Định
  dùng chữ hoa để tạo thứ bậc, kết quả là xoá thứ bậc.

⇒ **Cơ chế: một kiểu nhấn dùng ở mọi chỗ thì thôi là nhấn.** Nhấn là quan hệ, không phải
thuộc tính.

### ⑥ Bản đồ đè lên lãnh thổ

Trên `real-home-1440.png`, sidebar **cắt ngang chữ** của nội dung. Không phải lỗi z-index —
lỗi là **quyết định**: sidebar chiếm chỗ cố định, nội dung tự lo.

Điều này lật đúng thứ bậc phải có. Sidebar là **hạ tầng**: nó phục vụ việc đi lại. Nội dung
là **việc**. Khi hạ tầng đọc rõ hơn việc, người dùng đọc hạ tầng — và IF trở thành một thứ
để *vận hành*, chứ không phải để *làm việc trong đó*. Đó chính là câu mà `SKILL.md §0` cấm:

> *The designer should spend attention on the design problem, not on operating InteriorFlow.*

## HỌC GÌ

1. **Bản đồ phải nói được "ở đó có gì", không chỉ "đi đâu được".** Đó là ranh giới giữa
   *map* và *launcher*.
2. **Mỗi nấc trả lời một CÂU KHÁC.** Nấc to thêm **một lớp tin**, không phóng to lớp cũ.
   Cửa nghiệm thu có **hai vế**: (a) che nấc to đi, nấc nhỏ vẫn đứng được một mình;
   (b) nấc to phải có thứ nấc nhỏ **KHÔNG THỂ** có.
3. **Không phải mục nào cũng xứng có ba nấc.** *Cài đặt* không có gì để nhìn ⇒ nấc thứ ba
   của nó **là kéo dãn** ⇒ **bỏ**, để nó dừng ở hai nấc. Ba nấc là **NHỊP CHUNG, không phải
   HẠN NGẠCH**.
4. **Cấu trúc cụm cần vật mang nó** — khoảng trống không nói được nó ngăn cái gì.
5. **Mục chưa mở được thì hiện MỜ KÈM LÝ DO**, không ẩn, không câm.
6. **Sidebar không được cắt nội dung.** Bản đồ không đè lên lãnh thổ.

## KHÔNG ĐƯỢC CHÉP GÌ

- ⛔ **Đừng đọc bài này thành "bỏ rail icon".** Nấc 28px **vẫn cần** — nó là nấc *định vị*, và
  nó là nấc duy nhất chừa gần hết màn cho việc. Thứ hỏng là **nấc thu không có công năng
  riêng**, không phải sự tồn tại của nó.
- ⛔ **Đừng chữa bằng cách nhét tooltip vào 12 icon rồi coi là xong.** Tooltip là *chữa cháy
  cho người đã rê chuột tới*; nó không giúp người **quét mắt** một lượt. Và trên cảm ứng,
  `title` **câm hoàn toàn**.
- ⛔ **Đừng lấy con số 52px / 12 glyph làm chuẩn.** Chúng là số đo một ảnh 22/08. Nấc chuẩn
  đã chốt là **28 / 240 / 320**.
- ⛔ **Đừng sửa nhãn hoa bằng cách đổi sang chữ thường rồi giữ nguyên `letter-spacing`.**
  Giãn chữ sinh ra để **đỡ cho chữ hoa**; bỏ hoa mà giữ giãn thì chữ rời rạc. Hai thứ đi
  cùng nhau (đã thi hành: `.12em` → `.02em`).

## NGUYÊN TẮC THAY THẾ ĐÚNG

> **Sidebar là BẢN ĐỒ của toàn app, và mỗi nấc là một MỨC ĐỘ CHI TIẾT CỦA BẢN ĐỒ —
> không phải cùng một bản đồ in to nhỏ khác nhau.**

| Nấc | Câu nó trả lời | Thêm gì so với nấc trước |
|---|---|---|
| **28 · định vị** | *tôi đang ở đâu* | — (đọc bằng vị trí + hình) |
| **240 · điều hướng** | *tôi đi đâu được* | **TÊN** |
| **320 · duyệt** | *ở đó đang có gì* | **TRẠNG THÁI SỐNG** hoặc **HÌNH** |

Ở nấc 320, một mục thôi là một dòng menu — nó thành **mặt nhìn của chính nội dung nó dẫn tới**:
Thư viện → cột ô tròn vật liệu · một chặng → màn dang dở · Bảng việc → việc tới hạn + ai đang
làm · Files → thư mục gần đây + ảnh xem trước · **Cài đặt → không có gì để nhìn ⇒ không có
nấc ba**.

⚠️ Nấc-hình có **ngưỡng dưới đo được**: IF đã đo 07/08 rằng ảnh xem trước ở **141px** là *"quá
nhỏ để phân biệt vân gỗ sồi với óc chó"*. Dưới ngưỡng thì nấc-hình **mất công năng** và lại
thành kéo dãn. Mọi thiết kế nấc-hình phải nêu ngưỡng đo được — không nêu là chưa xong.

Xem tiếp: `GOOD/sidebar-ban-do.md`.
