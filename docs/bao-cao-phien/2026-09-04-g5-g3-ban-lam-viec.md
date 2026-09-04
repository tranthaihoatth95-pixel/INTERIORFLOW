# 04 · DESIGN — đóng ba lỗi Home, rồi đi bằng tay bàn làm việc nghề (04/09)

## 1 · Tổng quan

Đóng **2/3 lỗi Home** (lỗi thứ ba đóng được nửa — nửa còn lại nằm ngoài vùng ghi, đã ghi sổ với
số đo và cách sửa một dòng), rồi **mở app thật đi hết một luồng nghề** Home → dự án → 2D → 3D →
Trình chiếu → Home. Luồng **đứt đúng một chỗ**, và chỗ đó **năm máy soi không bắt được**:
thẻ mách nước onboarding nằm đè lên công tắc *"Vẽ 3D"* ⇒ bấm vào không có gì xảy ra, không báo gì.
Đã sửa; sau sửa vào được mode 3D bằng chuột thật.

Cách làm: mọi con số dưới đây **đo bằng pixel/DOM trên app đang chạy** (Chromium 1194 · 1600×900 ·
dev 3081 · CSDL nháp của worktree · dữ liệu THẬT: 3 dự án + 12 việc có hạn), **không suy từ mã**.

---

## 2 · Chi tiết từng mục

### PHẦN A · Ba lỗi Home

| # | Lỗi | Kết quả | Bằng chứng đo được |
|---|---|---|---|
| 1 | Dải môi trường gần như vô hình ở nền sáng | 🟡 **ĐÓNG NỬA** | xem A1 |
| 2 | Rail 240 thay vì 52 · bản khoá tính sân 1148, thực tế 960 | ✅ **ĐÓNG** | xem A2 |
| 3 | Bậc NỀN chưa lần nào chạy với dữ liệu THẬT | ✅ **ĐÓNG** | xem A3 |

#### A1 · Dải môi trường — chẩn được gốc, sửa được phần trong lane

Đo pixel ở **cột lề trái của sân** (dải trần, không vật nào đè):

| | nền TỐI | nền SÁNG |
|---|---|---|
| thân dải | `rgb(19,22,24)` | `rgb(222,226,229)` |
| nền trang `--bg` | `rgb(12,12,14)` | `rgb(242,239,233)` |
| chiều | dải **SÁNG hơn** nền ✅ | dải **TỐI hơn** nền 🔴 |
| biến thiên trong dải | 1,078 | **1,039** (bằng nửa) |

**Gốc thật, tra tới dòng:** `lib/wallpaper/sets.ts` `NEO_DO_SANG.light` neo độ sáng theo buổi —
`day [0.930,0.998]` ≥ `--bg` (L≈0,931) nên **ban ngày đúng chiều**; `dusk [0.874,0.950]` và
`night [0.862,0.935]` **phần lớn nằm DƯỚI** `--bg` ⇒ chiều/đêm thì lớp *"ánh sáng theo giờ"*
**tối hơn trang** ⇒ đọc ra **một tấm xám**, không đọc ra ánh sáng. Ảnh chụp lúc 18:44 = `dusk`,
đúng buổi hỏng.

⛔ `lib/wallpaper/**` **ngoài ALLOWED FILES** ⇒ theo đúng lệnh *"chạm biên miền khác thì ghi vào
bảng, đừng vá"*: đã ghi `DESIGN-LOCK-HOME.md §14` kèm cách sửa một dòng (cận dưới `light.dusk` /
`light.night` phải ≥ L của `--bg`).

**Phần sửa được trong lane, và nó là sửa GỐC chứ không đánh bóng:** ba mép cứng của dải (đỉnh giáp
thanh trên · trái giáp rail · phải giáp thang) là thứ **khoá cái đọc sai đó lại thành một hình chữ
nhật**. Bản khoá §4.3 vốn đã lập luận *"mép cứng đọc ra là một vệt lạ"* — nhưng chỉ áp cho mép đáy.
Lý do đó đúng cho **cả bốn mép**. Đã cho dải tan ở mọi mép tự do (`mask-composite: intersect`).
⇒ hết hình chữ nhật; còn lại một vùng nhạt dần. **Vẫn giữ "có biên"**: dải vẫn chỉ chiếm `--daiH`
đầu sân, không phủ cả màn.

#### A2 · Rail — sửa BẢN KHOÁ cho khớp thực tế, và sửa một lỗi thật của Home

Rail là **hệ router toàn app** (chốt 16/08), **ba nấc 52/240/320** do người dùng bấm, **mặc định
240** (`components/nav/RailDieuHuong.tsx:76`). Bản khoá ghi "rail 52 · sân 1148" — con số đó chỉ
đúng ở nấc hẹp nhất. **Home không có thẩm quyền trên rail** ⇒ sửa bản khoá.

Nhưng đo tiếp thì Home **sai thật** ở chỗ nó CÓ thẩm quyền:

| nấc rail | rail | khung Home | thang | hiện vật | ghi chú |
|---|---|---|---|---|---|
| `dinhVi` | 52 | 1548 | 400 | 1036 | rộng ✅ |
| `dieuHuong` ⭐ | 240 | 1360 | 400 | 848 | rộng ✅ |
| `duyet` | 320 | **1280** | **400** 🔴 | **768** 🔴 | đáng lẽ HẸP |

Ngưỡng khổ hẹp hỏi `@media` = hỏi **cửa sổ trình duyệt**, trong khi chỗ Home thật sự có là
**cửa sổ trừ rail**. Khung 1280 (hẹp hơn cả ca 1040 mà bản khoá gọi là hẹp) vẫn nhận bố cục RỘNG.
**Sửa:** điều kiện hỏi **chính khung** — `container-type:inline-size` + `@container xuong`, ngưỡng
**1348 = 1400 − 52** (dịch đúng ngưỡng cũ sang hệ toạ độ khung).
Sau sửa: rail 320 → thang **320**, hiện vật **896** (+17%); **cấu hình mặc định ra y hệt trước**
(0 delta cho mắt). ⚠️ Ràng buộc của cơ chế: truy vấn khung không tô được cho chính phần tử dựng ra
khung ⇒ hai khối `@container` nhắm vào **con trực tiếp** (`.san` · `.thang`), thừa kế phủ đủ.

#### A3 · Bậc NỀN với dữ liệu thật

Nạp **12 việc thật có hạn** vào CSDL nháp (không phải đường `?demo=`). Đo lại: bậc **KỀ BÊN 3** ·
bậc **NỀN 5 dòng thật** ("Gửi bảng vật liệu cho chủ đầu tư · <dự án> · 3 ngày") · bậc **KHI GỌI**
đếm "còn 3 việc đang ngủ · gọi ra". Trước khi nạp: NỀN = **0** ở mọi nấc rail.

🔴 **Khai rõ phần chưa có nguồn:** bản khoá §5 nói bậc NỀN gồm ba nguồn; `vatTuThat()` chỉ đọc
**một** (`recentProjects` + `upcoming`). **Hàng đợi render** (`dang-chay`) và **lệch chuẩn
`lib/review`** (`lech`) — **chưa có nguồn nào nối vào**. Không phải hỏng, là **chưa nối**.

### PHẦN B · Bàn làm việc nghề — đi bằng tay

Chi tiết đầy đủ + bảng trạm: `docs/delivery/G3-BAN-LAM-VIEC-2D-3D.md` §E (mới).

| Trạm | Kết quả |
|---|---|
| Home → dự án | ✅ |
| 2D bật công cụ · vẽ tường · panel "Chỉnh lệnh vừa chạy" | ✅ |
| 2D **LUẬT PASS** (thao tác → ghi → tải lại → cùng một sự thật) | ✅ **ĐẠT** — lần đầu chứng minh bằng tay |
| 2D → 3D | 🔴 **GÃY** → đã sửa |
| 3D mở môi trường dựng (Command3DPanel · CẤU KIỆN · BIẾN ĐỔI · WebGL 824×781) | ✅ sau sửa |
| 3D thấy tường vừa vẽ ở 2D | ❌ không — xem §4 |
| Trình chiếu · "Tạo hồ sơ trống" → trình dàn trang | ✅ |

---

## 3 · Tổng kết lại vấn đề

**Ba ca TRƯỢT theo chuẩn vi-tương-tác. Cả ba do TAY bắt; máy soi bắt được 0/3.**

| # | Ca | Máy soi có bắt? | Trạng thái |
|---|---|---|---|
| ① | Công tắc **"Vẽ 3D"** bị `StageIntroCard` đè trọn ⇒ bấm im lặng | ❌ `soi:cong-cu-chet` báo **H2 phím câm = 0 · H3 tay cầm rỗng = 0** — nó soi *đường mount*, nút này mount đủ, chỉ bị **che** | ✅ ĐÃ SỬA |
| ② | `⌘J / Ctrl+J` (Vitals) — **không mặt nào tiêu thụ** ở cả 4 màn, mà Trình chiếu có nút ghi hẳn *"Vitals — hỏi trợ lý (⌘J / Ctrl+J)"* | ❌ | 📋 ngoài lane (Vitals) |
| ③ | Hai thẻ trên **cùng một màn 2D** dạy **hai phím khác nhau** cho cùng một việc: `StageIntroCard` *"Gõ L vẽ tường"* ↔ registry `L = cad.draw.line`, `W = cad.draw.wall`; và cả hai đều **thiếu nhịp Enter** | ❌ | ✅ ĐÃ SỬA |

**⇒ 3 ca TRƯỢT · 3/3 máy soi không bắt được.** Đây là giá trị thật của lượt này: cả ba đều thuộc
loại *"có trong mã nhưng không tới được người dùng"* — thứ `tsc`/test/grep **theo thiết kế** không
thấy. Chính `soi:cong-cu-chet` tự khai đúng giới hạn đó ở dòng cuối:
*"Máy chứng minh CÓ ĐƯỜNG MOUNT, KHÔNG chứng minh BẤM VÀO CÓ VIỆC XẢY RA."*

Ca ① đắt nhất và đáng nhớ: một **thẻ mách nước** — thứ sinh ra để **giúp** người mới — lại **chặn
đúng cánh cửa** mà người mới cần đi qua, trong khi docstring của nó viết *"Thẻ nhỏ, KHÔNG chặn
thao tác"*. Lời hứa nằm trong mã, không nằm trong sản phẩm.

---

## 4 · Đánh giá khách quan

**Tốt hơn dự đoán:** bàn 2D **dày và chạy thật** — 56 lệnh một sổ, tường vẽ được, có panel
*"Chỉnh lệnh vừa chạy"* (đúng khuôn Blender-F9 mà ticket 15/08 ghi là **IF CHƯA CÓ** — hoá ra **đã
có**), autosave sống, sống sót tải lại. Trình chiếu vào được trình dàn trang thật với kệ mẫu đủ 19
mẫu. Không phải app rỗng.

**Chưa tốt:**
- **Mạch nghề đứt ở 2D → 3D.** Vẽ xong một bức tường rồi sang 3D thì đọc *"Không gian trống"* /
  *"Chưa có khối nào trong cảnh"*. Về **câu chữ** thì đúng luật X1 (X1 nói chiều 3D→2D phải tự có;
  chiều 2D→3D là bước đùn có chủ ý, và app có sẵn ba lối: *"Bắt đầu trong 3D"* · *"Vẽ / nhập mặt
  bằng →"* · node *"Bản vẽ → Khối 3D"*). Nhưng về **cảm nhận người đi luồng** thì đây là chỗ gãy
  rõ nhất. Không tự lật luật; đưa vào lô duyệt mắt.
- **Nút quảng cáo phím không ai nghe** (`⌘J`) vẫn đang sống trên Trình chiếu.
- Ba mục còn `CHƯA ĐO` của bàn 3D (gán vật liệu · ẩn/cô lập · hover) **vẫn chưa đo** — cảnh rỗng
  nên không có mặt nào để gán.

**Rủi ro của chính lượt này:**
- `@container` đổi cách Home đo khổ. Cấu hình mặc định **đo lại ra y hệt**, nhưng ca rail 320 là
  **delta thị giác thật** (thang 400→320) — cần mắt.
- `pointer-events-none` trên thẻ mách nước: click vào **thân thẻ** nay xuyên xuống lớp dưới. Ruột
  thẻ chỉ có chữ + 2 ảnh nên không mất chức năng, nhưng nếu ai đó thêm nút vào thân thẻ sau này mà
  quên `pointer-events-auto` thì nút đó chết. Đã ghi chú tại chỗ.

---

## 5 · Hướng xử lý — hai góc

**Hướng A · Đóng nốt phần thị giác của dải môi trường trước.** Sửa `NEO_DO_SANG.light` (một dòng,
2 buổi) rồi chụp lại lô Home. Ưu: đóng trọn lỗi #1, Home sạch hẳn, hợp mục tiêu "hoàn tất thị
giác". Nhược: chạm `lib/wallpaper/**` — lane khác; và nó chỉ đẹp thêm, **không mở thêm việc gì cho
người dùng**.

**Hướng B · Đóng nốt phần CHỨC NĂNG mà lượt này vừa lộ ra.** Ba việc: ⌘J về khẩu độ mép trên (đóng
ca TRƯỢT ② đang sống) · nối nguồn còn thiếu cho bậc NỀN · làm rõ mạch 2D→3D. Ưu: đánh vào chỗ
người dùng **mất việc**, không phải chỗ mất đẹp. Nhược: cả ba đều chạm lane khác, cần điều phối.

---

## 6 · Đề xuất

**Chọn B, và trong B thì `⌘J` đi trước.** Lý do: lỗi #1 còn lại là **lệch sắc độ 1,10 ↔ 1,13** —
sau khi hết mép cứng thì nó đã thôi đọc ra như một tấm xám, tức phần **hỏng** đã đóng, phần còn
lại là **chưa đẹp**. Còn `⌘J` là **một lời hứa in trên nút mà app không giữ** — theo N-20 thì
"chạy được?" đã trượt, không cần bàn tới câu thứ hai. Và nó **rẻ**: khẩu độ mép trên đã có thẩm
quyền (D-DR1), việc chỉ là nối phím vào mặt đang sống thay vì hai mặt đã chết.

Kèm một việc cho MÁY, rẻ và trả lãi ngay: `soi:cong-cu-chet` hiện soi *đường mount*. Ca ① chứng
minh có một họ lỗi nó **không thể** thấy — **nút bị che**. Thêm một luật H5 chạy trên trình duyệt
thật: với mỗi phần tử bấm được đang hiện, `document.elementFromPoint` tại tâm phải trả về chính nó
(hoặc con nó). Rẻ, tất định, và bắt đúng loại lỗi vừa làm gãy luồng nghề.

---

## 7 · CHƯA CHẮC / CHƯA KIỂM

1. Chỉ **Chromium 1194**. Safari/Firefox là **suy**, không đo. `mask-composite: intersect` có
   đường lùi `-webkit-mask-composite: source-in` nhưng **chưa thử ngoài Chromium**.
2. **`prefers-reduced-motion` chưa kích hoạt lần nào** trong lượt này.
3. Đo màu dải là **pixel ảnh chụp**, đúng thứ mắt thấy — nhưng chỉ lấy ở **cột lề trái**; chưa
   quét toàn dải, nên "biến thiên 1,039" là số của **một lát cắt**, không phải của cả dải.
4. **Ngưỡng 1348 là DỊCH ngưỡng cũ, không phải ngưỡng đo lại từ nội dung.** Nếu bản khoá muốn
   ngưỡng theo *chỗ hiện vật bắt đầu vỡ* thì phải đo riêng — chưa làm.
5. Ô chạm mới của nút ✕ trên thẻ mách nước (`--tap`) **chưa soi bằng mắt** xem có đè chữ không.
6. **Chưa đo bằng bàn phím thuần và trình đọc màn hình.** Ba ca TRƯỢT tìm bằng chuột + phím tắt;
   lớp trợ năng còn nguyên chưa soi.
7. Chỉ **một dự án · một tờ · một bức tường**. Chưa thử nhiều tờ, nhiều tầng, tài liệu nặng.
8. **Chưa gán vật liệu trong 3D** (cảnh rỗng) ⇒ dòng "vật liệu" của bảng B vẫn `CHƯA ĐO`.

---

## 8 · Cách chạy lại (bộ đo là scratch, không commit)

```
PORT=3081 npx next dev -p 3081            # DATABASE_URL trỏ TUYỆT ĐỐI vào prisma/dev.db của worktree
# đăng nhập qua /api/auth/login, tắt WelcomeIntro bằng localStorage interiorflow.tourDone.<uid>
# playwright: executablePath /opt/pw-browsers/chromium-1194/chrome-linux/chrome
```
Ba phép đo cốt lõi, tái lập được bằng bất kỳ script nào:
① `getBoundingClientRect` của `nav` · `.xuong-home` · `.san` · `.thang` · `.vat` ở ba nấc
`localStorage['interiorflow.rail.nac_v1']` = `dinhVi|dieuHuong|duyet`;
② chụp màn → đọc pixel thô (sharp `.raw()`) ở cột lề trái sân, so `--bg`;
③ `document.elementFromPoint(tâm nút)` cho mỗi nút đang hiện — **đây là phép đo bắt được ca ①**.
