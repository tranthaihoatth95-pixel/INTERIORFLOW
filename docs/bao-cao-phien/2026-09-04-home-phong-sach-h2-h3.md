# BÁO CÁO · LÀN B — Home vòng phòng sạch: H2 · H3 + dọn mực-trên-ảnh

Ngày 04/09/2026 · nhánh `integration/2026-09-04` · mốc `0183d7c6` · **không commit, không push**.
Phiếu: `docs/phieu-giao/P-HOME-PHONG-SACH.md`. Thẩm quyền: `docs/ACTIVE-DESIGN-CONTEXT.md`.

## 1 · Tổng quan
Dựng xong **H2 Personal Studio** và **H3 Quiet Desktop**, mỗi hướng 3 khung (ngày thường · xưởng
rỗng · bảy dự án), gộp với H1 có sẵn thành bộ 9 khung dùng **chung một vỏ**. Gom **9 giá trị hex
mực-trên-ảnh** của H1 về **3 token vai trò** dùng chung cho cả ba hướng. Máy tiền kiểm sạch trên
**18 lượt** (9 khung × 2 nền). Kèm hai lỗi thật bắt được khi thi công, một trong đó **đã sống từ
lượt H1 mà không ai thấy**.

## 2 · Chi tiết

### 2.1 · Ba cơ chế — mỗi cơ chế một câu, và đường lập luận ra nó
| | Cơ chế (một câu) | Đi từ §5 nào ra |
|---|---|---|
| **H1** (đã có) | Home là **bức tường xưởng**; việc treo lên đó, thứ bậc đọc bằng **chiều sâu và cỡ** trong một không gian phối cảnh. | §5 G (nền động) + §9 (nền vẫn có hình) làm trục chính |
| **H2** | Home là **mặt bàn nhìn từ trên xuống**; việc đang làm là **chồng giấy dưới tay**, mọi thứ khác đặt **xa dần theo tầm với** và **nén dần** (hiện vật → vật có nhãn → ô cỡ định sẵn → một dòng). | §5 ràng buộc §24 (*"thứ phụ xếp theo liên quan × tần suất × giá trị quyết định × ngữ cảnh; được nén · gập · hé dần"*) — biến bốn động từ đó thành **bốn nấc nén nhìn thấy được**, thay vì một hàng ngang |
| **H3** | Home là **một trang chữ có kỷ luật**; chỉ mục xếp theo **mức cần bạn quyết**, **đúng một hiện vật hiện hình**, phần còn lại là **chữ có số** cho tới khi được gọi về. | §5 câu mở (*"trả lời được, không cần bấm: đang làm gì · dở tới đâu · cần xử gì · làm gì tiếp"*) + D-DR2 (**đúng một tiêu điểm**) — trục sắp xếp lấy thẳng từ *"cần xử gì"* |

Ba hướng khác nhau ở **trục tổ chức** (không gian · tầm với · mức cần quyết), ở **cách lộ dần**
(lùi xa · nén dần · gọi về từ chữ) và ở **vai của môi trường** (ảnh là mặt phẳng · ánh sáng bàn ·
gần như không có). Không hướng nào là hướng kia đổi màu.

### 2.2 · Máy tiền kiểm — 18/18 lượt sạch
`node scripts/soi-ban-ve.mjs <9 tệp>:1600x900` — mã thoát bắt trực tiếp, **0**.
Tràn khung **0** · vượt khổ **0** · chữ dưới ngưỡng **0** ở **cả hai nền, cả chín khung**.

Số đoạn chữ **máy không đo được** (chữ nằm trên ảnh — cái giá của việc chữ đè hình, **chỉ mắt Hoà
phán được**), giống nhau ở hai nền:

| | a · ngày thường | b · xưởng rỗng | c · bảy dự án |
|---|---|---|---|
| H1 | 23 | 26 | 28 |
| H2 | 6 | 14 | 6 |
| **H3** | **0** | **0** | **0** |

Con số này **không phải điểm chất lượng** — nó đo **bao nhiêu phần của bản vẽ nằm ngoài tầm máy**.
H1 cao vì nền là ảnh phủ kín; H3 bằng 0 vì nó cố ý gần như không có môi trường.

### 2.3 · Dọn mực-trên-ảnh (việc gộp cho cả bộ)
- `_home-ps-nen.css`: thêm `--muc-tren-anh-1/2/3` · `--chan-dam/vua/nhat` + `--phu-chan-chu` ·
  `--net-tren-anh(-mo)`. Ba tệp H1 rewire hết: `color:#` còn **0**, `rgba(8,9,11…)` còn **0**,
  hai biến cục bộ `--treo/--treo-day` của H1 bị xoá (trùng vai với token chung).
- **Là đổi tên, không đổi giá trị — có bằng chứng máy**: 9 hex cũ đều nằm trong ba cụm sát nhau
  (sáng/thân/phụ); sau khi gom, số "không đo được" của H1 **vẫn đúng 23/26/28** như trước khi sửa.
- Ghi vào chú thích tệp nền rằng luật ① (*"chữ chỉ lấy từ --t1/--t2/--t3"*) có **một ngoại lệ khai
  báo được**: chữ đè ảnh. Không ghi thì luật đó **tự mâu thuẫn với chính bản vẽ**.

### 2.4 · Hai lỗi thật bắt được khi thi công
**① `--vl-go` đã CHẾT từ lượt H1 — do một chú thích CSS tự đóng sớm.**
Dòng chú thích chứa cụm `--illus-*/--paper-*`; chuỗi `*` `/` **đóng chú thích ngay tại đó**, phần
còn lại thành rác cú pháp và **nuốt luôn khai báo đứng ngay sau** là `--vl-go`.
Đo được: `getPropertyValue('--vl-go')` trả **chuỗi rỗng**, `getComputedStyle(rect).fill` = `rgb(0,0,0)`
⇒ ô vật liệu gỗ trong bản vẽ tô **đen**. H1 không lộ vì nó **gõ thẳng `#9c7449`** vào `<pattern>`;
H2 là bản đầu tiên gọi token nên mới lòi ra. Đã vá + ghi cảnh báo tại chỗ; kiểm lại 16 token đều
trả giá trị đúng.
> Bài học: **token không dùng thì không ai biết nó đã chết.** Đây đúng họ với ca *"có trong mã ≠
> tới được người dùng"* — chỉ khác là ở đây nó còn chẳng có trong mã, mà không máy soi nào kêu.

**② `.hien`/`.hien-nho` để `line-height` 1,2 và 1,25** — vi phạm §7 (*chữ Việt cấm `line-height < 1.5`,
vì dấu chồng mang nghĩa). Lọt ở lượt H1 vì chỉ dùng cho **một câu một dòng**; H2/H3 có câu nhiều
dòng nên phải sửa. Đã đưa cả hai về **1.5**, H1 kiểm lại vẫn sạch.

### 2.5 · Nội dung — đa dạng và trần một-lần
9 khung cộng lại bày **12 loại mảnh việc sống**: bảng vật liệu · khối 3D · trang hồ sơ trình ·
đường máy quay · moodboard · **mặt bằng 2D** · bảng khối lượng · phiếu duyệt có ghi chú ghim ·
ảnh hiện trường có số đo · mẫu hồ sơ · hàng đợi render đang chạy · thẻ DNA · chi tiết cấu tạo.
**Mặt bằng 2D dùng ĐÚNG MỘT LẦN** (H2 · ngày thường) theo §D.
Mọi khung mang thẻ `demo · dữ liệu mẫu` (§28) và có **dấu còn tiếp** (§30).

## 3 · Tổng kết lại vấn đề
Bộ ba nay là **ba câu trả lời khác nhau cho cùng một câu hỏi**, không phải ba lớp sơn: chúng khác
ở *lấy gì làm trục sắp xếp* và *thứ phụ lộ ra bằng cơ chế nào*. Phần dọn token làm ba hướng dùng
**chung một bảng mực**, để khi Hoà so thì mắt so **bố cục**, không bị nhiễu vì mỗi bản một tông —
đúng lý do việc dọn được giao. Hai lỗi bắt được đều thuộc loại **im lặng**: một token chết mà
không ai kêu, một luật chữ Việt bị vi phạm ở chỗ không ai nhìn ra.

## 4 · Đánh giá khách quan
**Được:** ba cơ chế tách bạch, kiểm được bằng lời; máy sạch 18/18; H3 đưa phần chữ về **100% đo
được**; hai lỗi cũ được vá tại gốc chứ không vá tại chỗ dùng.
**Chưa được:**
- H2 dùng ẩn dụ vật lý ⇒ **có trần**: cơ chế "ló chân trang" hết dư địa quanh ~9 tờ. Đã bày ở
  khung `c` để Hoà thấy trước, chứ không giấu.
- H3 **cố ý trái §9** ở chỗ "nền vẫn có hình". Đây là đánh đổi có chủ ý, không phải sơ suất — nhưng
  nếu Hoà thấy lạnh thì **không chữa được bằng đánh bóng** (N-17), phải đổi hướng.
- H1 vẫn là hướng có nhiều chữ-trên-ảnh nhất; nền sáng của H1/H2 vẫn tối vì ảnh không lật theo theme.
- `scripts/soi-ban-ve.mjs` in dòng cuối **"✅ 6/6 khung sạch" gõ cứng**, chạy 18 lượt vẫn báo 6/6.
  **Không sửa** (nằm trong DO_NOT_TOUCH) — nêu để làn khác xử: một máy kiểm nói sai số lượng việc
  nó vừa làm là thứ ăn mòn niềm tin vào chính nó.

## 5 · Hướng xử lý — nhiều góc
- **(a) Chọn một hướng rồi thi công thẳng.** Nhanh nhất, nhưng ba hướng đều có một điểm mạnh riêng
  mà hai hướng kia không có.
- **(b) Ghép trục H3 vào thân H2**: lấy **chỉ mục theo mức cần quyết** (H3) làm cột phải của
  **mặt bàn** (H2). Được cả *cảm giác studio* lẫn *trả lời đúng câu "cần xử gì"*; giá phải trả là
  hai ẩn dụ sống chung, dễ thành nửa vời.
- **(c) Giữ ba hướng làm ba **mật độ** của cùng một Home** (§2 *một hệ, bốn mật độ*): H1 cho màn
  rất rộng, H2 cho desktop thường, H3 cho khổ hẹp / ngày ít việc. Đắt nhất, và dễ đẻ ba bản phải nuôi.

## 6 · Đề xuất
**Đưa nguyên ba hướng cho mắt Hoà, kèm bốn câu một-từ** (đã soạn trong bản trình), **chưa chọn hộ**.
Lý do: phần máy phán được đã phán hết và cả ba đều sạch; phần còn lại là **bố cục · thứ bậc · gu** —
đúng thứ N-16 nói máy không phán được. Nếu buộc phải nghiêng, tôi nghiêng **(b)**: trục *"cần bạn
quyết"* của H3 là thứ duy nhất trong ba hướng trả lời thẳng câu hỏi mở đầu §5, còn thân mặt bàn của
H2 là thứ duy nhất khiến Home đọc ra **studio đang sống** thay vì bảng điều khiển.

---

## ⑦b · CHƯA CHẮC / CHƯA KIỂM
- **Chưa mở app thật một dòng nào.** Toàn bộ là tệp HTML tĩnh; không biết hành vi khi có dữ liệu
  thật, khi tên dự án dài hơn, khi ảnh là ảnh chụp thật thay vì hình vẽ.
- **Chỉ đo ở đúng một khổ 1600×900.** Khổ hẹp hơn **chưa dựng, chưa đo** — cả ba hướng đều đặt
  tuyệt đối theo pixel, gần như chắc chắn vỡ nếu thu khổ.
- **Chỉ Chromium** (bản trong `/opt/pw-browsers`). Safari/Firefox là suy.
- **Không thử `prefers-reduced-motion`, không thử trình đọc màn hình, không thử bàn phím** — bộ mock
  gần như tĩnh, nhưng "gần như" không phải "đã kiểm".
- **Số "không đo được" là số của MÁY, không phải phán quyết.** Trong H1/H2 có những đoạn chữ nằm
  trên vùng SÁNG của hình mà máy lại so với `<rect>` nền TỐI của cùng svg ⇒ **máy có thể đang báo
  đẹp hơn sự thật**. Tôi đã né bằng cách vẽ dải nền tối ngay dưới chữ trong các hiện vật mới, nhưng
  **không rà lại toàn bộ H1**.
- **Con số "12 loại mảnh việc sống"** là tôi tự đếm theo cách tôi tự phân loại; chưa ai duyệt cách
  phân loại đó.
- **"H2 hết dư địa ở ~9 tờ"** là ước lượng hình học từ bước 33px hiện tại, **không phải phép thử**.
- Hai lỗi ở §2.4 đã vá và đã kiểm lại bằng máy; **chưa soi bằng mắt** xem ô gỗ nay có đúng tông không.

## ⑦c · HẠN DÙNG KẾT LUẬN
- Mọi kết luận **thị giác** ở đây hết hạn ngay khi Hoà phán bằng mắt — đó mới là cửa thật.
- Số đo máy (18/18 sạch, bảng "không đo được") **chỉ đúng với mốc `0183d7c6`** và với bản
  `_home-ps-nen.css` sau lượt này. Ai sửa tệp nền thì phải **chạy lại**, không được chép số này.
- Kết luận "H3 đo được 100% chữ" **hết hiệu lực ngay** nếu H3 được thêm nền ảnh — đó chính là cái
  giá của việc bỏ môi trường.
- Bảng đối chiếu A–K là **đọc bản vẽ**, không phải đọc app; khi thi công thật phải chấm lại.
