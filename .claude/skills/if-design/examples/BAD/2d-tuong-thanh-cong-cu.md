# ③-XẤU · 2D — BỐN DẢI CHROME CHỒNG LÊN CANVAS

**XẤU** · 22/08/2026 · ảnh **tôi đã mở**: `artifacts/visual-review/04-2d-full.png` ·
`artifacts/visual-review/02-sidebar-collapsed.png` (cùng màn, rail thu) ·
số đo: `docs/design-campaign/01-CLINICAL-UI-AUDIT.md:23`

## Nhìn thấy gì

**Đếm trên ảnh, từ đỉnh màn xuống canvas — bốn dải ngang, mỗi dải một hàng:**

| # | Dải | Nội dung |
|---|---|---|
| ① | vỏ app | logo · `InteriorFlow` · `Dự án mới` · `Thiết kế 2D ⌄` · viên Vitals · chuông · avatar |
| ② | tab bản vẽ | `Bản vẽ 1` · `+` · (mép phải) `1 sheet` |
| ③ | dải nhắc | `Gửi sang Trình chiếu` · *"Khổ giấy · tỉ lệ · lệ · khung tên đặt bên Trình chiếu."* |
| ④ | thanh công cụ | `Mở tệp ⌄` · `Xuất ⌄` · `Bắt đầu ⌄` · `Công cụ bản vẽ ⌄` · `Tỉ lệ ⌄` · `Trình bày` |

Canvas bắt đầu ở khoảng **y ≈ 166** trên màn cao 900.

**Dưới canvas, ba dải nữa:**

| # | Dải | Nội dung |
|---|---|---|
| ⑤ | dock nổi, hàng 1 | `Sơ phác`/`Chuyên` · nhóm `VẼ` (5 nút) · `CẤU KIỆN` (5) · `SỬA` (2) · `ĐO & GHI CHÚ` (2) |
| ⑥ | dock nổi, hàng 2 | `Ortho` · `Số liệu` · `Lệnh` · `Kéo` · `Ngón vẽ` · `Hoàn tác` · `Làm lại` · `Xong` · `Huỷ` |
| ⑦ | dòng lệnh + trạng thái | `⌘` · ô `Lệnh…` · (đáy) `Dự án mới` · `Đã lưu lúc 02:34` |

Cộng thêm: một dải chữ **dựng đứng** `LỚP` ở mép trái canvas, và một cụm ba nút nổi lơ lửng
**giữa canvas** (`🖼` · `✨` · `⬡`), không neo vào gì.

**Nhãn nhóm trong dock HOA TOÀN PHẦN**: `VẼ` · `CẤU KIỆN` · `SỬA` · `ĐO & GHI CHÚ`.

**Số đo lâm sàng** (`01-CLINICAL-UI-AUDIT.md:23`, 1440×900):

| | 2D | So với app |
|---|---|---|
| nút | **101** | **cao nhất toàn app** trừ Settings (107) |
| cỡ chữ | **10** | vỏ chung chỉ có **4** |
| icon lucide / tổng | **103/108** | 5 icon ngoài hệ |
| canvas | **1338×712** | **93% bề ngang** |

## VIỆC CON NGƯỜI

Việc là: **vẽ**. Và phải nói công bằng — cùng bản audit chấm:

> **2D — nhân vật chính ĐÚNG.** Canvas 1338×712 / 1440×900 = **93% bề ngang**, chrome không
> nuốt canvas. Đây là màn **duy nhất** có PROTAGONIST rõ và đúng. Nhưng **101 nút** là mật độ
> cao nhất toàn app.

⇒ Màn này **không hỏng ở chỗ nhân vật chính**. Nó hỏng ở chỗ **đường vào nhân vật chính bị
lát bằng bảy dải hạ tầng**, và ở chỗ 101 nút **hiện cùng lúc** dù việc đang làm chỉ cần vài cái.

Đây là lý do phải đọc kỹ: một màn có thể **đúng ở trục quan trọng nhất mà vẫn mệt**, và nếu
chỉ nhìn "canvas có to không" thì không thấy được gì.

## NGUYÊN TẮC bị vi phạm

| # | Luật | Nguồn |
|---|---|---|
| 1 | **Nhiều lớp chrome quanh canvas** — nằm trong OPEN CLASSES chưa root-cause | `02-FAILURE-LEDGER.md` §OPEN CLASSES |
| 2 | Kiến trúc tool **3 lớp**: thanh chung ≤9-10 lệnh · nhóm lệnh gói theo tần suất · cửa sổ công cụ | chốt Hoà 13/08 |
| 3 | Tiêu chí vào **tầng ①** là *hành vi giống nhau ở cả 3 chặng*, **KHÔNG** phải *"hay dùng"* | chốt Hoà 16/08 |
| 4 | Tầng ② (nhóm lệnh) **chưa dựng** — và *"cảm giác rối đến từ chỗ trống ở tầng ②"* | chốt Hoà 16/08 |
| 5 | **Trôi cỡ chữ 4 → 10** ⇒ *"không phải một thang, mà là tích tụ"* | `01-CLINICAL-UI-AUDIT.md` §B4 |
| 6 | **Icon trộn nguồn** 103/108 — chạm 13/13 bề mặt ⇒ lỗi hệ thống | `01-CLINICAL-UI-AUDIT.md` §B3 |
| 7 | Chữ Việt: **cấm hoa toàn phần** | `LUAT-CHU-VIET-7.1.23-2026-07-31.md` |
| 8 | Ngôn ngữ chỉ dẫn: **≤12 từ**, hành động trước | `SPEC-NGON-NGU-CHI-DAN.md`, 02/08 |
| 9 | `STAGE` = *focus / view / mode*, **KHÔNG** là *a separate app shell* | `SKILL.md:34` |
| 10 | Bộ ảnh tham chiếu: **không ảnh nào có HAI hàng thanh công cụ ngang** | `REF-DNA` S8 |

## VÌ SAO NÓ HỎNG — CƠ CHẾ

### ① Mỗi dải là một quyết định hợp lý; bảy dải là một quyết định không ai đưa ra

Từng dải đều biện hộ được: tab bản vẽ vì có nhiều sheet · dải nhắc vì người dùng đi tìm khổ
giấy · thanh công cụ vì có lệnh tệp · dock vì có lệnh vẽ · dòng lệnh vì dân AutoCAD gõ lệnh.

Không dải nào sai. **Tổng của chúng thì sai.**

⇒ **Cơ chế: chrome tích tụ theo THỜI GIAN, và không có bước nào trong quy trình hỏi "tổng
cộng đang có mấy dải".** Mỗi lần thêm là một quyết định cục bộ, đúng cục bộ. Vì thế
`SPEC-PANEL-ROLLOUT-IDF` không cứu được: nó nói *"panel nên thế nào"*, không ai đếm tổng.

Bằng chứng đây là bệnh tích tụ chứ không phải bệnh thiết kế: **cỡ chữ trôi 4 → 10**. Không ai
thiết kế một thang 10 bậc; nó **mọc ra**, mỗi lần một bậc.

### ② Tầng ② trống, nên tầng ① phình

Kiến trúc đã chốt là **ba tầng**: ①thanh chung luôn hiện · ②nhóm lệnh gói theo tần suất ·
③cửa sổ công cụ. IF dựng ① và (một phần) ③, **để trống ②**.

Hệ quả cơ học: lệnh nào cũng phải nằm đâu đó. Không có tầng ② thì mọi lệnh dồn lên tầng ①.
Kết quả là **101 nút phơi cùng lúc**.

Hoà nói thẳng chỗ này khi bác một đề xuất của T:

> *"Cảm giác rối KHÔNG đến từ vệ tinh, nó đến từ chỗ trống ở tầng ②."*

⇒ **Cơ chế: thiếu một tầng gói thì tầng còn lại gánh hết.** Chữa bằng cách giấu bớt nút ở
tầng ① là **chữa triệu chứng ở sai tầng** — nút vẫn phải ở đâu đó, và giấu đi thì người dùng
mất luôn.

Hai khuôn tầng ② đã chốt (`TICKET-KIEN-TRUC-LENH-3-TANG` §2b), cho hai loại người ở cùng một chỗ:

| Khuôn | Mặt ô là | Bấm vào thì | Hợp nhóm |
|---|---|---|---|
| **thư mục iOS** | lưới 2×2 xem trước cả nhóm | **MỞ** | lệnh **chưa thuộc**, tra thỉnh thoảng |
| **ổ Photoshop** | **một lệnh vừa dùng** | **CHẠY LUÔN** | lệnh **dùng liên tục**, tay đã quen |

### ③ Tiêu chí vào thanh chung bị đọc thành "hay dùng"

Tiêu chí đúng: **hành vi giống nhau ở cả 3 chặng**. `Chọn` · `Xoay` · `Chép` · `Đo` là cùng
một động tác nghề ở 2D, 3D và Trình chiếu — chúng thuộc thanh chung.

`Mở tệp` · `Xuất` · `Tỉ lệ` · `Trình bày` **hay dùng**, nhưng chúng **không phải cùng một
động tác ở ba chặng**. Chúng lên thanh chung vì đọc sai tiêu chí.

⇒ **Cơ chế: đổi tiêu chí từ *bản chất* sang *tần suất* thì hàng rào biến mất** — vì luôn có
thứ hay dùng tiếp theo, và thanh chung phình vô hạn. Hàng rào phải là một **thuộc tính của
lệnh**, không phải một **thứ hạng**.

Hậu quả đo được: **5 sổ lệnh song song** trong app (`lib/commands/registry.ts` 55 lệnh chỉ
`AppCommandPalette` đọc · CadToolbar 10 mảng tự khai · ToolDock3D 6 nhóm + 16 phím gõ cứng ·
Present tự khai · một CommandPalette thứ hai). `grep "lib/commands"` trong cả ba toolbar =
**0**. Phân kỳ thật: **Xoay** `RO`/`RO`/**`Q`** · **Chép** `CO`/`CO`/**`D`** · **Đo**
`DI`/`DI`/**`T`**. Học phím ở 2D, sang 3D bấm sai.

### ④ Ba nút nổi lơ lửng giữa canvas, không neo vào gì

Cụm `🖼 · ✨ · ⬡` đứng giữa canvas. Không cạnh vật đang chọn, không ở mép, không trong dock.

Người dùng phải học nó bằng **trí nhớ tuyệt đối** (*"chỗ đó có ba nút"*), vì không có gì
trên màn giải thích vì sao nó ở đó. Và nó **che canvas** — thứ nó lơ lửng bên trên chính là
nhân vật chính.

⇒ **Cơ chế: điều khiển không neo vào ngữ cảnh thì trở thành đồ nội thất.** Đúng luật đã chốt:
điều khiển ngữ cảnh phải **bám vật đang chọn** (`NodeToolbar`), không đứng ở toạ độ cố định.

### ⑤ Một dải chrome dùng để nói rằng chức năng nằm ở chỗ khác

Dải ③ tồn tại để nói: *"Khổ giấy · tỉ lệ · khung tên đặt bên Trình chiếu."*

Một dải ngang **vĩnh viễn**, chiếm chiều cao **vĩnh viễn**, để trả lời một câu hỏi người dùng
hỏi **một lần trong đời**. Và câu ấy dài **12 từ** — sát trần của `SPEC-NGON-NGU-CHI-DAN`
(≤12 từ), tức là một câu giải thích, không phải một nhãn.

⇒ **Cơ chế: một câu trả lời cho câu hỏi hỏi-một-lần không được chiếm chỗ vĩnh viễn.** Chỗ
đúng của nó là ô giải nghĩa, hoặc trạng thái rỗng, hoặc lần đầu dùng.

### ⑥ `LỚP` dựng đứng — chữ xoay 90° là chữ phải nghiêng đầu mới đọc

Một dải mảnh mép trái canvas, chữ xoay dọc. Với chữ Việt có dấu, xoay dọc còn tệ hơn tiếng
Anh: dấu chồng nằm sang cạnh, mất hẳn đường chân chữ.

⇒ **Cơ chế: chữ dọc là cách tiết kiệm bề ngang bằng cách tiêu tiền của người đọc.** Có
cách rẻ hơn: icon + ô giải nghĩa, hoặc tay nắm không chữ + nhãn khi rê.

## HỌC GÌ

1. **Đếm dải chrome, và đếm nó thành một con số trong hợp đồng.** Không có ai đếm thì nó tăng.
2. **Không dựng tầng ① nếu chưa biết tầng ② gói cái gì.** Thiếu tầng gói thì tầng chung phình.
3. **Tiêu chí vào thanh chung là BẢN CHẤT (*cùng động tác ở 3 chặng*), không phải TẦN SUẤT.**
4. **Điều khiển ngữ cảnh phải neo vào vật**, không đứng ở toạ độ cố định giữa canvas.
5. **Câu hỏi hỏi-một-lần không được chiếm chỗ vĩnh viễn.**
6. **Cỡ chữ trôi 4 → 10 là dấu hiệu tích tụ, không phải dấu hiệu phong phú.** Đếm cỡ chữ là
   một phép đo rẻ và bắt được bệnh sớm.
7. **Một màn có thể đúng ở trục chính mà vẫn mệt.** Canvas 93% là đúng; 101 nút vẫn sai.
   Đừng dừng ở một phép đo.

## KHÔNG ĐƯỢC CHÉP GÌ

- ⛔ **Đừng đọc bài này thành "giảm số nút".** Lệnh vẽ là **vốn của IF** — chốt 03/08 bác
  thẳng đề xuất cắt bộ lệnh dựng hình: *"dựng nội thất mà không có mấy cái đó là vứt"*.
  Việc phải làm là **GÓI**, không phải **CẮT**.
- ⛔ **Đừng gộp dải bằng cách nhét mọi thứ vào một hàng dài hơn.** Một hàng chật là một dải
  đã nén, không phải một tầng đã gói.
- ⛔ **Đừng lấy 101/10/103-108 làm chỉ tiêu.** Chúng là số đo **22/08, 1440×900, chưa đăng
  nhập**. Chúng chứng minh xu hướng, không định nghĩa ngưỡng.
- ⛔ **Đừng chép dock hai hàng sang 3D/Present cho "nhất quán".** Nhất quán phải ở **sổ lệnh
  chung**, không ở hình dạng thanh — chép hình dạng mà mỗi nơi một tập lệnh là làm nặng thêm
  đúng bệnh 5-sổ-lệnh.
- ⛔ **Đừng lấy "canvas 93%" làm bằng chứng màn này ổn.** Cùng bản audit chấm nó `PARTIAL`,
  và **không màn nào trong 13 màn đạt PASS**.

## NGUYÊN TẮC THAY THẾ ĐÚNG

> **Canvas là nhân vật chính. Chrome là thứ CHỈ hiện khi việc đang làm cần tới nó.**

Bốn ràng buộc thi hành được:

1. **Trần dải chrome trên canvas: 2.** Vỏ app + một dải ngữ cảnh. Muốn dải thứ ba thì phải
   nêu dải nào biến mất. *(đã đạt một lần — xem `BEFORE-AFTER/2d-gop-dai-4-band-xuong-2.md`)*
2. **Ba tầng lệnh, và dựng theo thứ tự ② trước khi tỉa ①.**
   ① thanh chung ≤9-10 lệnh, **giống hệt ở 3 chặng** ·
   ② nhóm lệnh, hai khuôn theo tần suất ·
   ③ cửa sổ công cụ cho tác vụ sâu.
3. **Một sổ lệnh, nhiều mặt tiền.** Toolbar **ĐỌC** `lib/commands/registry.ts`, thôi sở hữu
   danh sách. Cùng id · cùng nhãn · cùng icon · cùng phím tắt; khác `run`.
4. **Điều khiển ngữ cảnh bám vật đang chọn**, xuất hiện khi có chọn, biến mất khi bỏ chọn.

Xem tiếp: `GOOD/2d-canvas-truoc.md` · `BEFORE-AFTER/2d-gop-dai-4-band-xuong-2.md`.
