# DESIGN LOCK · HOME — bản khoá thiết kế

> **Trạng thái: KHOÁ 04/09/2026.** Chủ dự án đã rút khỏi cửa duyệt gu (*"SYNTHESIZE, DO NOT ASK"*).
> Ba bản H1/H2/H3 là **bản thăm dò nghiên cứu**, không phải ba ứng viên chờ chọn — bản này chưng
> cất ra MỘT. **Không mở thêm vòng ba-phương-án.** Chỉ thị hoàn thành 04/09 nói rõ: Home **không
> được trở lại đường găng**; khoá ở ngưỡng chuyên nghiệp mạnh rồi đi tiếp.
>
> Bản vẽ: `docs/mocks/mock-home-lock-{co-viec,rong,day-du}.html` + `_home-lock-nen.css`
> Ảnh: `docs/delivery/anh-duyet-mat/home-lock/` (10 ảnh · 2 nền · 2 khổ)
> Thi công: `docs/delivery/HOME-IMPLEMENTATION-SPEC.md`

---

## 1 · CƠ CHẾ — một câu

> **THANG CHÚ Ý bốn bậc — `NGAY BÂY GIỜ · KỀ BÊN · NỀN · KHI GỌI` — trong đó bậc do TRẠNG THÁI
> tính ra, và bậc quyết định một vật được cấp BAO NHIÊU THÂN: một thân đầy đủ · một mặt nhìn ·
> một dòng có số · một con số đếm.**

Bốn tên là của chủ dự án (chỉ thị C, thứ bậc thích ứng). Phần bản khoá thêm vào là **ánh xạ
bậc → hình thức biểu diễn**, và đó là chỗ nó trở nên thi công được.

---

## 2 · VÌ SAO CƠ CHẾ NÀY — đối chiếu thẳng ba điểm chết

Ba bản thăm dò đo **ba thứ khác nhau**: H1 đo *khoảng cách trong không gian*, H2 đo *khoảng cách
tới tay*, H3 đo *áp lực phải quyết*. H1 và H2 đều là **ẩn dụ không gian** ⇒ cùng chết một kiểu:
không gian vật lý hữu hạn nên **mật độ giết chúng**. H3 xếp theo **trạng thái ngữ nghĩa** nên co
giãn vô hạn — nhưng trạng thái ngữ nghĩa **không có thân xác** nên đọc ra lạnh.

⇒ Lời giải không phải ghép cơ học, mà là: **dùng trạng thái để QUYẾT ĐỊNH ai được cấp thân xác.**

| Điểm chết | Bản khoá xử thế nào | Bằng chứng |
|---|---|---|
| **H1** — 23–28 đoạn chữ nằm trên ảnh, máy không phán được; nền sáng vẫn tối vì ảnh không lật | Ảnh là **NỀN mà việc đứng lên**, không phải mặt phẳng dán chữ. Chữ sống trên **nền nội dung riêng** của hiện vật (tờ sáng / khung hình) hoặc trên panel app. Dải ảnh **có biên** nên nền sáng vẫn đọc ra là nền sáng | **0 đoạn không đo được** (H1: 23–28) — xem §12 để biết con số này đến từ đâu. Ảnh nền sáng: rail · cột phải · dải ngữ cảnh đều lật, chỉ ảnh giữ tông nội dung |
| **H2** — hết chỗ ở ~9 món, cơ chế "ló chân trang" sập | Mật độ tăng thì vật **TỤT BẬC**, không đòi thêm chỗ. Bậc 1 luôn đúng 1 · bậc 2 luôn 2–3 · bậc 3 nở ít · bậc 4 nuốt phần còn lại thành **một con số có tên loại** | Khung `day-du` = 14 dự án · 11 việc chờ, **hình học không đổi một pixel** so với khung `co-viec` |
| **H3** — gần như bỏ môi trường, đọc ra lạnh | Môi trường **còn nguyên** và là khối lớn thứ hai trên màn; nhưng nó đỡ việc chứ không tranh việc | Dải ảnh chiếm 420px đầu sân, hiện vật bậc 1 **chồng lên nó** để tạo chiều sâu thật |

**Bất biến chốt cả ba (luật ⑤ trong `_home-lock-nen.css`):** *bỏ hẳn dải môi trường đi thì
KHÔNG một chữ nào mất đọc — chỉ mất không khí.* Kiến trúc thông tin **không phụ thuộc** ảnh nền.
Đây là câu kiểm được, và là ranh giới giữa bản khoá và H1.

---

## 3 · THỨ BẬC · LƯỚI · MẬT ĐỘ · CHỮ

**Đúng một tiêu điểm** (D-DR2). Ba tầng độ nổi, giảm dần theo bậc — *"gần về không gian"* của H2
giữ nguyên, bỏ hẳn ẩn dụ mặt bàn (chỉ thị A):

| Bậc | Được cấp gì | Độ nổi | Nói bằng |
|---|---|---|---|
| **NGAY BÂY GIỜ** | THÂN đầy đủ: đầu · thân · chân có số thật | bóng đổ thật, chồng lên dải ảnh | hiện vật |
| **KỀ BÊN** | MẶT NHÌN — hình thức đổi theo **nghĩa của vật** (chỉ thị E) | không bóng, đứng trên panel | hình + 1 số sống |
| **NỀN** | MỘT DÒNG có số, không tranh chỗ | phẳng | chữ + số + dấu |
| **KHI GỌI** | MỘT CON SỐ có tên loại | mờ | đếm |

**Lưới (1600×900):** mép trên **42** (đo thật, `AppChrome`) · rail **do rail quyết, không do Home** ·
khung Home = `viewport − rail` · thang 400 (trong dải Work Panel 320–440 của EXS §4). Sân: dải ảnh
420 · hiện vật `top 168`, cao còn lại · dải ngữ cảnh 184.

> 🔴 **SỬA BẢN KHOÁ 04/09 — vì thực tế đúng, bản khoá sai.** Bản này từng ghi *"rail 52 · sân co
> giãn 1148"* như thể Home định đoạt bề rộng rail. Không phải: rail là **hệ router toàn app**
> (chốt 16/08) với **ba nấc 52 / 240 / 320** (EXS §4 rail 52-56 · shelf 220-280 · panel 320-440),
> **người dùng tự bấm** và **mặc định là 240** (`components/nav/RailDieuHuong.tsx:76` `dieuHuong`).
> Con số 1148 chỉ đúng ở nấc HẸP NHẤT. Đo trên app thật ở màn 1600×900:
>
> | nấc rail | rail | khung Home | sân | thang | hiện vật |
> |---|---|---|---|---|---|
> | `dinhVi` | 52 | 1548 | **1148** | 400 | 1036 |
> | `dieuHuong` ⭐ mặc định | 240 | 1360 | 960 | 400 | 848 |
> | `duyet` | 320 | 1280 | 960 | 320 | 896 |
>
> **Sửa bản khoá chứ không sửa rail** vì rail có thẩm quyền riêng và cao hơn: Home không được ra
> lệnh cho một hệ dùng chung. Cái Home ĐƯỢC quyết là **hình học của chính nó theo khung nó có**.
>
> ⚠️ Và chỗ đó thì Home đang SAI THẬT, đã sửa cùng lượt: ngưỡng khổ hẹp hỏi `@media` tức hỏi
> **cửa sổ trình duyệt**, trong khi chỗ Home thật sự có là **cửa sổ trừ rail**. Hệ quả đo được
> trước khi sửa: rail 320 trên màn 1600 cho khung **1280** — hẹp hơn cả ca khung 1040 mà bản khoá
> gọi là hẹp — nhưng vẫn nhận bố cục RỘNG, hiện vật tụt **1036 → 768 px (−26%)** mà thang vẫn 400.
> Nay điều kiện hỏi **chính khung** (`@container`, ngưỡng 1348 = 1400 − 52, tức dịch đúng ngưỡng
> cũ sang hệ toạ độ khung). Cấu hình mặc định ra **y hệt trước** — lượt này chỉ sửa ca hỏng.
> Bằng chứng: `components/home/home-lock-css.ts` khối `@container xuong`.

**Mật độ:** Home **thoáng** — và chỉ Home. Chỉ thị mật-độ-không-đồng-nhất: xưởng 2D/3D phải
**DÀY** hơn, đi qua token `--tap/--row/--gap/--pad-card/--fs-ui`, **không đổi hệ**.

**Chữ:** `line-height ≥ 1.5` mọi nơi · không hoa toàn phần · giãn chữ dương. Nhãn mono chỉ dùng
cho **tên mục và nhãn phụ**, không dùng cho câu. Chữ trên nền app **chỉ lấy `--t1/--t2/--t3`** —
đo tại nguồn `--t4` trên `--bg` nền sáng chỉ **2,66:1**, nên `--t4/--t5` chỉ cho đường kẻ và hình.

---

## 4 · MÔI TRƯỜNG · ẢNH · WALLGALLERY

Chủ dự án đã lật một lần: *"nền vẫn nên có hình, filter sao cho hợp lý"* — và **nền để SẮC NÉT**.
⛔ Chỉ thị D cấm giải bằng **một lớp phủ tối khổng lồ**. Bản khoá dùng năm kỹ thuật, không dùng
lớp phủ toàn màn:

1. **Có biên** — dải ảnh chiếm 420px đầu sân, không phủ cả màn. Nhờ có biên nên **nền sáng vẫn
   đọc ra là nền sáng** (chỗ H1 hỏng).
2. **Mặt phẳng chiều sâu** — hiện vật chồng lên dải, có bóng đổ. Ảnh lùi ra sau, việc tiến lên.
3. **Tan dần ở đáy** (`mask-image`) — không cắt ngang một nhát. Mép cứng đọc ra là *một vệt lạ*,
   không đọc ra là chiều sâu. **Đây là lỗi chỉ soi bằng mắt mới thấy; máy báo sạch cả trước lẫn sau.**
4. **Vùng an toàn ngữ nghĩa** — chỉ **hai nhãn** được đặt lên ảnh, ở hai ô cố định. Cắt ảnh thông
   minh phải giữ hai ô đó "lặng".
5. **Scrim ĐẶC cục bộ cho nhãn, không chuyển sắc.** 🔴 Đo được, và nó bác một kỹ thuật tôi định
   dùng: lớp phủ chuyển sắc mỏng dần về `.46` ở **chân chữ**; đặt trên vùng sáng nhất của ảnh thì
   nền hoà ra `rgb(131,127,119)` ⇒ **2,32:1 — TRƯỢT**. Scrim đặc `.86` thì nền hoà luôn nằm trong
   `rgb(10,11,13)…rgb(40,40,39)` với **mọi** ảnh ⇒ **8,58:1 … 11,44:1**.

> ⭐ **Đây là câu trả lời cho yêu cầu H** (*đọc được ở mọi ảnh của người dùng*): tương phản là
> **HẰNG SỐ do cấu trúc**, không phải kết quả may rủi theo từng tấm ảnh. Chuyển sắc ở chân chữ
> vẫn đúng cho **dải chữ lớn** (chuyển sắc trải dài quá thân chữ) — token `--phu-chan-chu` giữ
> lại cho đúng ca đó, **cấm dùng cho chip nhỏ**.

**LightClock** = lớp khí quyển, rất tiết chế: cung mặt trời + chấm giờ trong dải ảnh, và hướng
sáng của cảnh. Nó **đổi theo giờ, không chạy liên tục** — thứ chạy vô hạn là thứ đầu tiên phải
tắt khi bật giảm chuyển động.

---

## 5 · BỐN TRẠNG THÁI

| Trạng thái | Bậc 1 là gì | Thang chở gì | Ghi chú |
|---|---|---|---|
| **Có việc** (`co-viec`) | Bảng vật liệu bản 4 — nền nội dung SÁNG | 3 kề bên · 5 nền · đếm 4+6 | Bậc 1 **không mặc định là mặt bằng 2D** (đính chính ngữ nghĩa 04/09) |
| **Nhiều dự án** (`day-du`) | Mẻ render đêm — nền nội dung TỐI, có thanh tiến trình **đo được** | 3 · 6 · đếm 9+11 | **Hình học y hệt** khung có-việc. Đây là bằng chứng cho mật độ |
| **Rỗng** (`rong`) | **Bắt đầu** — `RESUME → BEGIN`: chính *Tạo dự án* · phụ *Mở/Nhập* · thứ ba *xem thư viện* | Thang **không biến mất**, đổi từ *"việc cần tôi"* sang *"vốn tôi có"* | §26: **không** phải "Home trừ ảnh hero", **không** 6 thẻ onboarding |
| **Thiếu dữ liệu** | Vật thiếu số hiện **"— m · chưa đo được"**, không bịa | Bậc trống thì **không vẽ mục rỗng**, hạ số đếm | Nối luật BOQ: chỉ nhận số đo được |

**Rỗng vẫn ra studio đang sống** vì ba thứ: dải ảnh còn (lấy từ kho ảnh tuyển, **nói rõ nguồn**) ·
thang bày **vốn thật của xưởng** (248 vật liệu · 12 mẫu hồ sơ · 12 bộ quy chuẩn) · dải ngữ cảnh
nói **đường đi sắp tới** thay vì gia phả đã qua.

---

## 6 · KHỔ HẸP — thang không đổi, chỉ đổi SỐ NGƯỜI ĐỨNG TRÊN MỖI BẬC

1280×800: thang 400→320 · dải ảnh 420→330 · lề 56→32 · khe 32→24. **Không mục nào biến mất im
lặng** — thứ bị thu tụt xuống bậc `KHI GỌI` và được **đếm ở đó** (§30 dấu hiệu còn tiếp).

Bento **không phải bản sắc Home**. Nếu sau này khổ hẹp thật sự cần lưới bento thì nó chỉ được
sống ở đó, và **thứ bậc trội → đỡ → nền phải giữ nguyên**.

---

## 7 · NGỮ PHÁP CHUYỂN ĐỘNG

⚠️ Chỉ thị hoàn thành 04/09 nâng phần này thành **ngữ pháp của cả app**, không riêng Home.

**Nguyên tắc gốc: mọi chuyển cảnh ở Home là một lần LÊN hoặc XUỐNG BẬC.** Kích hoạt một dòng ở
bậc `NỀN` thì nó **mọc ra thân** ngay tại chỗ nó đang đứng, và hiện vật bậc 1 đang giữ chỗ
**tụt xuống bậc `KỀ BÊN`**. Người dùng thấy *cái mới đến từ đâu* và *cái cũ đi đâu* — không vật
nào dịch chuyển tức thời.

| Việc | Thời lượng | Đường cong | Phục vụ |
|---|---|---|---|
| Bấm / nhấn | 120 ms | ease-out | phản hồi tức thì |
| Trỏ vào | vào 160 ms · ra 90 ms | ease | khả năng |
| Lên/xuống bậc | 320 ms | spring nhẹ (bounce 0) | **nhân quả + liên tục** |
| Hé (peek) | 180 ms | ease-out | thứ bậc |
| Khẩu độ Vitals `Ambient→Peek` | 200 ms | spring nhẹ | hiện diện nền |
| Xếp so le | 30–40 ms, **tối đa 3 vật** | — | định hướng |

**Bốn luật cứng:** ① mở **TỪ TÂM/nguồn của chính nó** — panel mọc ra từ ngữ cảnh liên quan, không
teleport ② **morph giữ định danh** — cùng một vật nở ra, không phải vật khác thay chỗ ③ **một bộ
easing cho cả app**, cấm mỗi tính năng một ngôn ngữ ④ `prefers-reduced-motion` **thắng tất cả**:
bỏ hết di chuyển, đổi bậc thành thay-thế-tức-thì, LightClock thành tĩnh.

⛔ Cấm: hoạt hoạ trang trí · parallax vô cớ · chuyển cảnh điện ảnh chậm · **chuyển động nền chạy
suốt**. Hiệu năng là một phần của chất lượng chuyển động: chỉ chuyển `transform`/`opacity`.

---

## 8 · TRỢ NĂNG

Vòng focus dùng `--accent` **đặc**, không bị `overflow:hidden` xén · ô chạm `--tap-lg 44` cho
mọi lối vào chính · **màu không bao giờ là kênh duy nhất** — mọi dấu trạng thái có **hình dạng
riêng** (tròn = đang chạy · vuông bo = đang chờ · tam giác = lệch) kèm chữ · thanh tiến trình đo
được có `role="progressbar"` + `aria-valuenow`; **loại không đo được thì KHÔNG có `aria-valuenow`
và không có con số** (cấm bịa phần trăm) · dải ảnh `aria-hidden` vì nó là khí quyển, mọi tin thật
đều có bản chữ.

---

## 9 · CỐ Ý KHÔNG LÀM — và vì sao

| Không làm | Vì sao |
|---|---|
| Lưới bento 9 thẻ | N-10 cờ đỏ · D-DR2 đòi một tiêu điểm. **Không giữ chỉ vì mã đã có sẵn** |
| Thẻ cho ghi chú · hoạt động · lời chào · tin tức | Ngôn ngữ A: gom nhóm bằng canh lề · cỡ · vị trí · vạch mảnh. Thẻ dành cho **vật**, không dành cho *mục* |
| Cột widget kiểu dashboard | Thang xếp theo **trạng thái**, không xếp theo loại widget. Widget đứng ở bậc thấp nhất vì nó **không đòi hỏi gì ở người dùng** |
| Ép thứ phụ thành MỘT HÀNG NGANG | §24 — *nghĩa địa widget không được thành nghĩa địa toolbar* |
| Ẩn dụ mặt bàn · chồng giấy · kệ | Chỉ thị A: H2 đóng góp **hành vi không gian**, không đóng góp ẩn dụ vật thật |
| Ảnh phủ toàn màn | H1 chết vì nó |
| Kéo giãn widget tự do | Cỡ định sẵn theo **ô lưới** là điều kiện để cùng một widget chạy trên máy tính · tablet · điện thoại |
| Nấc thứ ba cho mục không có gì để nhìn | Ba nấc là **nhịp**, không phải hạn ngạch. Không có lớp tin thứ ba thì dừng ở hai nấc |

---

## 10 · NGHIÊN CỨU — mỗi nguyên lý mượn về trả lời đủ bốn câu

| Nguồn | Nguyên lý mượn | Vì sao nó hiệu quả | Vì sao hợp IF | IF diễn giải thế nào | ⛔ TUYỆT ĐỐI không chép |
|---|---|---|---|---|---|
| **Apple HIG** | Chiều sâu = thứ bậc; mở từ tâm; morph giữ định danh | Mắt đọc lớp nhanh hơn đọc nhãn | IF đã có depth ladder + luật hình học 14 mục | Bậc 1 chồng lên dải ảnh, có bóng thật; bậc 3 phẳng tuyệt đối | Skin. Kính lỏng vô cớ — iOS 27 đã tự sửa vì khó đọc |
| **Linear** | Xếp theo **áp lực quyết định**, không theo thời gian | Danh sách theo thời gian bắt người tự lọc lại mỗi lần mở | Trùng đúng bài học H3 | Bậc do trạng thái tính; `NỀN` = đang chạy/đang chờ, không tranh chỗ | Mật độ SaaS phẳng lì · thẩm mỹ bảng-điều-khiển |
| **Raycast** | Thứ phụ **tồn tại nhưng chờ được gọi** | Không mất thứ gì mà cũng không chiếm chỗ | Trả lời §30 | Bậc `KHI GỌI` = con số có tên loại + dấu còn tiếp | Biến Home thành thanh lệnh |
| **Figma** | Một khung, mật độ đổi theo ngữ cảnh | Cùng ADN mà xưởng vẫn dày được | Đúng chỉ thị mật-độ-không-đồng-nhất | Home thoáng · workspace dày · công cụ tức thì — **qua token, không qua hệ khác** | Chrome xám công cụ ở màn tổng quan |
| **Milanote · Are.na** | Hiện vật nhận ra **bằng mắt**, không bằng đọc | Người sáng tạo nhớ bằng hình | Bậc `KỀ BÊN` | Hình thức mặt nhìn **đổi theo nghĩa của vật** (chỉ thị E) | Bảng ghim tự do — IF cần thứ bậc, không cần collage |
| **Adobe** | Panel chuyên sâu vây quanh mặt làm việc | Việc sâu cần công cụ trong tầm mắt | Đúng kiến trúc cửa sổ công cụ đã chốt | **Không áp vào Home** — Home là tổng quan, không phải xưởng | Nhồi panel vào màn tổng quan |

---

## 11 · CÁI GÌ NÂNG THÀNH LUẬT TOÀN APP · CÁI GÌ RIÊNG HOME

**Nâng lên luật tái dùng** (Home chỉ là nơi thử đầu tiên):
- **Bậc quyết định hình thức biểu diễn** — dùng được cho Thư viện, Bảng việc, Duyệt-Sửa lại.
- **Scrim đặc cho chữ trên ảnh**, chuyển sắc chỉ cho dải chữ lớn — áp cho mọi chỗ có ảnh.
- **Ngữ pháp chuyển động §7** — toàn app.
- **Dấu trạng thái có hình dạng riêng**, màu không là kênh duy nhất.
- **Bất biến "bỏ ảnh đi thì không chữ nào mất đọc"** — áp cho mọi màn có nền ảnh.

**Riêng Home, không mang đi:** mật độ thoáng · dải môi trường 420px · dải ngữ cảnh của một hiện
vật · thang bốn bậc **theo trạng thái toàn xưởng** (workspace xếp theo đối tượng đang chọn, khác
trục hẳn). ⛔ **Cấm ép cả app trông giống Home.**

---

## 12 · MÁY KIỂM

| | |
|---|---|
| `soi-ban-ve` tràn khung | **0** |
| `soi-ban-ve` vượt khổ | **0** |
| `soi-ban-ve` chữ dưới ngưỡng | **0** — 12/12 lượt (3 khung × 2 khổ × 2 nền) |
| **Chữ máy không phán được** | **0** · H1 23–28 · H2 6–14 · H3 0 |
| `soi:hinh-hoc` | không chạm tệp mới (0 giá trị bo gõ tay) |
| `soi:tu-dien` | 0 lệch nhãn |
| Hex gõ tay trong bản vẽ | **0** |

**Con số 0 đến từ đâu — nói cho đúng, đừng khoe.** Ban đầu là **3 đoạn/khung** (hai nhãn trên dải
ảnh). Sau khi đổi scrim từ **chuyển sắc** sang **đặc `.86`** ở §4.5, máy tra ra một `background-color`
thật nên nó **đo được** và báo đạt ⇒ về 0.

⚠️ **Nhưng máy bỏ qua kênh alpha** — nó chấm với `rgb(8,9,11)` đặc, tức **lạc quan hơn thực tế**.
Thứ thật sự bảo đảm không phải con số của máy mà là **phép tính tay ở §4.5**: nền hoà thật nằm
trong `rgb(10,11,13)…rgb(40,40,39)` với mọi ảnh ⇒ **8,58:1 ở ca xấu nhất**. Hai đường độc lập cùng
kết luận đạt, nên tin được; nhưng **đừng đọc số 0 này thành "máy đã chứng minh"** — máy chỉ chứng
minh sau khi con người đã chọn đúng cấu trúc để máy đo được.

⭐ Bài học đáng giữ: **sửa cho đúng thì máy soi tự đo được thứ trước đó nó phải bó tay.** Chỗ nào
máy nói *"không đo được"* thường là chỗ thiết kế đang dựa vào may rủi.

---

## 13 · CHƯA CHẮC / CHƯA KIỂM — bắt buộc khai

- ✅ **04/09 — ĐÃ CHẠY TRÊN APP THẬT.** Home dựng bằng **dữ liệu THẬT** (`/api/home/summary`:
  3 dự án · 12 việc có hạn trong CSDL), đo ở 1600×900 · hai nền · ba nấc rail; bậc NỀN nay có
  **5 dòng thật** và bậc KHI GỌI đếm **3 việc đang ngủ**. Ảnh:
  `docs/delivery/anh-duyet-mat/g3-ban-lam-viec/00-home-nen-{sang,toi}-sau-sua.png`.
  🔴 Còn MỘT mục chưa đóng: **dải môi trường ở nền SÁNG vẫn TỐI HƠN trang** — xem §14.
  ~~*(bản gốc: "Chưa chạy trên app thật. Toàn bộ là bản vẽ tĩnh…" — giữ để truy nguyên.)*~~
- **Chuyển động chưa chạy lần nào.** §7 là **quy cách**, không phải thứ đã đo. Nhánh
  `prefers-reduced-motion` chưa kích hoạt.
- **Chỉ đo Chromium.** Safari/Firefox là suy. `mask-image` có tiền tố `-webkit-`, nhưng
  `:root:has()` chưa thử ngoài Chromium.
- **Ba con số ở khung `rong` (248 · 12 · 12) là DEMO**, đã đeo nhãn *demo · dữ liệu mẫu* trên mép
  trên. Số thật phải đọc từ kho lúc thi công.
- **Ngưỡng dưới của mặt nhìn chưa đo cho Home.** Kho vật liệu đã đo 141px là *quá nhỏ để phân biệt
  vân*; mặt nhìn bậc `KỀ BÊN` ở đây là **104×64** — nhỏ hơn ngưỡng đó, và tôi chấp nhận vì nó chỉ
  cần **nhận ra vật**, không cần **so vân**. Nếu mắt phán ngược thì phải nới thang lên ~360.
- 🔴 **Một lệch tên trong tệp thẩm quyền, tôi không được sửa:** `docs/ACTIVE-DESIGN-CONTEXT.md`
  ghi chặng ba là **"Trình bày"** ở 3 chỗ (`:67` `:104` `:141`), nhưng `lib/phases.ts:101`,
  `lib/tasks/context.ts:23` (kèm test `:41`) và từ điển máy đều là **"Trình chiếu"** (P7 đổi tên
  04/08, sau chốt 03/08). Bản vẽ đã theo code. **Người sở hữu tệp đó cần sửa một nhãn.**

---

## 14 · CHẠM BIÊN MIỀN KHÁC — GHI SỔ, KHÔNG VÁ (04/09)

Một mục, đo đủ, **cố ý không sửa** vì nó nằm ngoài vùng ghi của lượt này (`lib/wallpaper/**`).

### Dải môi trường ở nền SÁNG đi NGƯỢC CHIỀU ÁNH SÁNG

Đo bằng pixel thật trên app (không suy từ CSS), lấy ở **cột lề trái của sân** — dải trần, không
vật nào đè:

| | nền TỐI | nền SÁNG |
|---|---|---|
| thân dải | `rgb(19,22,24)` | `rgb(222,226,229)` |
| nền trang `--bg` | `rgb(12,12,14)` | `rgb(242,239,233)` |
| **chiều** | dải **SÁNG hơn** nền ✅ | dải **TỐI hơn** nền 🔴 |
| biến thiên BÊN TRONG dải | 1,078 | **1,039** — bằng nửa |

**Vì sao đây là lỗi chứ không phải gu.** Lớp này tự khai là *"ánh sáng theo giờ"* (LightClock).
Một lớp ánh sáng mà **tối hơn trang** thì không đọc ra ÁNH SÁNG — nó đọc ra **một tấm xám**. Cộng
với biến thiên bên trong chỉ 1,039 (phẳng lì), nó mất luôn cấu trúc để mắt bám vào.

**Gốc, tra được tới dòng.** `lib/wallpaper/sets.ts` `NEO_DO_SANG.light` neo độ sáng theo buổi:

```
day   [0.930, 0.998]   ≥ --bg  ✅ ban ngày đúng chiều
dawn  [0.892, 0.966]   straddle
dusk  [0.874, 0.950]   🔴 phần lớn DƯỚI --bg
night [0.862, 0.935]   🔴 phần lớn DƯỚI --bg
```
`--bg` nền sáng `#f2efe9` có L ≈ **0,931**. ⇒ **ban ngày thì đúng, chiều và đêm thì lật ngược.**
Ảnh bằng chứng chụp lúc 18:44 (`dusk`) — đúng buổi hỏng.

**Sửa một dòng, KHÔNG phải tôi sửa:** cận dưới của `light.dusk`/`light.night` phải **≥ L của
`--bg`**; buổi tối trên nền sáng nghĩa là *ánh sáng ấm hơn và dịu hơn*, không phải *tối hơn trang*.

**Lượt này đã làm được gì trong vùng của mình.** Ba mép cứng (đỉnh giáp thanh trên · trái giáp
rail · phải giáp thang) là thứ **khoá cái đọc sai đó lại thành một hình chữ nhật**. Đã cho dải
**tan ở mọi mép tự do**, đúng lý lẽ §4.3 vốn đã đúng cho mép đáy — lý do đó đúng cho cả bốn mép.
⇒ Hết hình chữ nhật; còn lại là một vùng nhạt dần. **Nửa còn lại (chiều của ánh sáng) vẫn mở.**

### Hai mục nhỏ hơn, cùng loại

- **`--bg` nền sáng vẫn là kem `#f2efe9`** — đúng giá trị `00-CHOT` 16/08 gọi là "sến" và Hoà đã
  chốt *"nền sáng canh theo Apple"* (`#F2F2F7`, ngả LAM). Dải hình nền thì đã trung tính-lạnh
  (đúng chốt), `--bg` thì chưa ⇒ **mối nối giữa chúng là một mối nối LỆCH SẮC**, không chỉ lệch
  độ sáng. Đổi `--bg` là đổi token đang dùng toàn app ⇒ ngoài vùng, và cần mắt Hoà.
- **Bậc NỀN mới có 1/3 nguồn được nối.** `vatTuThat()` (`components/home/XuongHome.tsx`) chỉ đọc
  `recentProjects` + `upcoming`; bản khoá §5 khai bậc NỀN gồm **hàng đợi render** (`dang-chay`) và
  **lệch chuẩn `lib/review`** (`lech`) — cả hai **CHƯA CÓ NGUỒN NÀO** nối vào. Không phải hỏng:
  là **chưa nối**. Nói thẳng ở đây để đừng ai đọc bậc NỀN đang chạy là "đã đủ nguồn".
