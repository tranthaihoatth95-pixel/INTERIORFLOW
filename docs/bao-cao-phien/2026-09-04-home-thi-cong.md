# Home · THI CÔNG BẢN KHOÁ — báo cáo lane 04 DESIGN (04/09)

> Nguồn thẩm quyền: `docs/delivery/DESIGN-LOCK-HOME.md` · `docs/delivery/HOME-IMPLEMENTATION-SPEC.md`
> · `docs/mocks/mock-home-lock-*.html` + `_home-lock-nen.css` · `docs/ACTIVE-DESIGN-CONTEXT.md`
> Mốc: `84ff9e57` (ff-only từ `origin/integration/2026-09-04`) → 3 commit → `0f6d5e79`

---

## 1 · Tổng quan

Bản khoá Home đã thành mã sản phẩm chạy được: **thang chú ý bốn bậc** với bậc **tính ra từ trạng
thái** (hàm thuần có test), thay bố cục bento ở đường vào `/`. Chạy trên app thật ở 8 trạng thái ×
2 nền × 2 khổ; **hình học khung 14 dự án trùng khít khung 3 việc tới từng pixel**, và **luật PASS
đi trọn chuỗi bằng bàn phím**. Ba lỗ chỉ app thật mới lộ đã vá. `tsc` 0 · 313 tệp test 0 fail ·
mọi máy soi giữ nguyên mốc, 0 chỗ vi phạm đến từ tệp mới.

---

## 2 · Chi tiết từng mục

### 2.1 · Hàm tính bậc — cơ chế lõi

| | |
|---|---|
| Tệp | `lib/home/thang-chu-y.ts` |
| Chữ ký | `xepThang(vat: readonly VatHome[], khoHep = false): KetQuaThang` |
| Phụ trợ | `bacTuTrangThai(t: TrangThai): Bac` · `cauKhiGoi(k: readonly DemKhiGoi[]): string \| null` |
| Test | `lib/home/thang-chu-y.test.ts` — **30 ok · 0 fail** |
| Thuần? | có — 0 import React/DOM, không đọc `Date.now()`, cùng đầu vào cho cùng đầu ra (test ⑦) |

**Đầu vào không có trường nào tên "bậc" hay "ưu tiên"** — người gọi chỉ khai `trangThai`
(`dang-do` · `can-toi` · `dang-chay` · `dang-cho` · `lech` · `ngu`). Bậc do hàm tính.

**Trần cứng** `TRAN = {keBen:3, nen:5}` · `TRAN_HEP = {keBen:2, nen:4}`. Vật vượt trần **tụt xuống
bậc dưới**; thứ rơi khỏi bậc NỀN được **đếm theo LOẠI** ở bậc KHI GỌI. Không nhánh nào nới trần.

### 2.2 · Hình học không đổi khi mật độ tăng — ĐO, không khẳng định

Đo bằng `getBoundingClientRect()` trên app thật, không phải bản vẽ:

| Khổ 1600×900 | thang | dải ảnh | hiện vật | dải ngữ cảnh | kề bên | nền |
|---|---|---|---|---|---|---|
| `co-viec` — 3 việc | 400×858 @1200,42 | 960×420 @240,42 | 848×462 @296,210 | 848×184 @296,704 | 3 | 5 |
| `day-du` — **14 dự án · 11 việc** | **400×858 @1200,42** | **960×420 @240,42** | **848×462 @296,210** | **848×184 @296,704** | **3** | **5** |

⇒ **Không lệch một pixel nào.** Thứ đổi là câu đếm ở bậc KHI GỌI:
`"còn 4 việc và 6 dự án đang ngủ"` ↔ `"còn 6 việc và 11 dự án đang ngủ"`.

Khổ 1280×800: thang 320 · dải 720×330 · vật 656×436 · ngữ cảnh 656×161 · kề bên **2** · nền **4**
— đúng §6 (đổi SỐ NGƯỜI trên bậc, không đổi hệ), và phần bị thu **được đếm**:
`"còn 7 việc và 12 dự án đang ngủ"`. `cuonNgang: false` ở cả 8 trạng thái.

### 2.3 · Bất biến "bỏ dải ảnh đi thì không chữ nào mất đọc"

Kiểm bằng máy: gỡ hẳn `.dai` khỏi DOM rồi duyệt **mọi nút lá có chữ**, leo cây tìm
`backgroundColor` không trong suốt đầu tiên. Nút nào không tìm ra nền = chữ nổi trên hư không.

**Kết quả: 0.** Ảnh: `1600-co-viec-BO-DAI-ANH-CHUNG-MINH-BAT-BIEN.png`.

Lý do nó đạt là **cấu trúc**, không phải may: chữ hoặc nằm trên nền APP (`--panel`/`--bg`), hoặc
trên nền NỘI DUNG riêng của hiện vật (`--paper`/`--canh-0`). Đúng **hai** nhãn được đặt lên ảnh,
mỗi nhãn có **scrim đặc** riêng. Tính lại tương phản scrim (`/tmp/contrast.mjs`, công thức WCAG):

| ảnh nằm dưới | nền hoà sau scrim `.86` | `--muc-tren-anh-3` | `--muc-tren-anh-1` |
|---|---|---|---|
| trắng 255 (xấu nhất) | `#2b2b2d` | **8,21:1** | 12,98:1 |
| xám 180 | `#202123` | 9,37:1 | 14,80:1 |
| đen 0 | `#070809` | 11,65:1 | 18,41:1 |

⇒ tương phản là **hằng số do cấu trúc**, không phụ thuộc tấm ảnh. ⚠️ Bản khoá §4.5 ghi ca xấu
nhất là 8,58:1; tôi đo được **8,21:1** vì thử với **trắng thuần** — vẫn vượt xa ngưỡng, nhưng
con số trong bản khoá nên đọc là 8,21 chứ không phải 8,58.

### 2.4 · Luật PASS — chứng minh trên app thật, bằng BÀN PHÍM

Thứ Home ghi xuống: **kệ widget** (thứ tự + ô đã cất) — đúng luật chung↔máy: *cách bày trên màn
của tôi* → `localStorage`, không lên máy chủ, không vào `.idf`.

```
kệ TRƯỚC          ["dự án trong xưởng","đang trong xưởng"]
thao tác          focus nút "Dời sang phải" → Enter   (KHÔNG dùng chuột)
vòng tiêu điểm    outline 2px solid rgb(106,87,245) · :focus-visible = true
SAU THAO TÁC      ["đang trong xưởng","dự án trong xưởng"]
ĐÃ GHI XUỐNG      {"thuTu":["đang trong xưởng#1","dự án trong xưởng#0"],"an":[]}
SAU TẢI LẠI       ["đang trong xưởng","dự án trong xưởng"]
SAU VÀO LẠI       ["đang trong xưởng","dự án trong xưởng"]   (đi /files rồi về /)
⇒ thao-tác-có-đổi = true · tải-lại-và-vào-lại-giữ-nguyên = true ⇒ PASS
```

Phần thuần có test riêng: `lib/home/ke-widget-store.test.ts` — **23 ok · 0 fail**, gồm ba ca thật
(widget mới xếp cuối không mất · widget đã bỏ khỏi app rơi lặng lẽ · widget đã cất vẫn ĐẾM ĐƯỢC).

### 2.5 · Luồng nghề — mở app → Home → vào dự án → về Home

```
② Home dữ liệu THẬT · kề bên 3 dự án · nhãn demo: false (đúng — đường thật)
③ bấm một dự án → /projects/cmtn8uoz7000g7dzh2edipcls/overview
③ về Home → tiêu điểm đọc đúng trạng thái mới
```
Ảnh `luong-1…4`. ⚠️ Hai lượt đầu ghi `③ URL: /` — **không phải nút chết**: màn chào lần-đầu
(`WelcomeIntro`, z-95) ăn cú bấm. Truy vết riêng (`framenavigated`) cho lịch sử
`["/","/","/projects/<id>/overview"]` ⇒ đường có thật. Đã đổi phép đo sang `waitForURL` —
**chờ mù một khoảng thời gian thì lúc bắt được lúc không, và phép đo lúc được lúc không không
phải bằng chứng.**

### 2.6 · Ba lỗ chỉ app thật mới lộ — đã vá

| Lỗ | Bằng chứng | Vá |
|---|---|---|
| **Hàng cao cố định bị TRÀN** ở 1280: tên vật xuống 2 dòng, chip "còn khoảng 22 phút" vỡ trong viên nang, chân vật xuống dòng | ảnh `1280-day-du-toi` bản đầu | chữ ở `.vat-dau`/`.vat-chan` đi **một dòng + cắt đuôi**; **con SỐ không co** (cắt đuôi một con số là nói dối), chỉ câu giải thích mới co; chip `white-space:nowrap` |
| **Hộp rỗng khổng lồ** ở đường thật: chưa có việc dở ⇒ thân bậc 1 có 3 dòng, bỏ trống 2/3 (cờ đỏ N-10) | ảnh `luong-1` bản đầu | dùng thân lời-mời (lời mời + cột "xưởng đang có"), **số thật** từ `/api/home/summary` |
| **Dải môi trường trống nhãn** ở đường thật | ảnh `luong-1` bản đầu | hai nhãn đều là **tin thật**: dự án gần nhất + số dự án · giờ thật + sắc ánh sáng từ `time-of-day` |

Máy canh thêm vào bộ đo để lỗ #1 không tái phát: `hangTran` — `scrollHeight > clientHeight` trên
`.vat-dau`/`.vat-chan`/`.muc`/`.o-nen`/`.hang-vl`/`.ke-ben`. Sau vá: **`[]` ở cả 8 trạng thái**.

### 2.7 · Năng lực cũ — giữ gì, cố ý bỏ gì

| Năng lực | Trạng thái |
|---|---|
| `SystemWallpaper` (5 bộ nền sinh bằng mã, dừng hẳn sau khi vào) | **GIỮ** — đổi từ nền toàn màn sang **dải có biên 420px + tan đáy `mask-image`**. Đo tại nguồn: nó thật sự vẽ (`data-wp-set="chan-troi"` · `data-wp-period="dusk"` · `background: radial-gradient…`) |
| `loadResume` · `buildResumeCard` · `resumeHref` | **GIỮ**, chỉ đọc — `lib/resume.ts` không bị sửa một dòng |
| `/api/home/summary` + `lib/home/aggregate.ts` | **GIỮ** — nuôi cả bốn bậc |
| `time-of-day` | **GIỮ** — nay nuôi nhãn phải của dải môi trường |
| Đường vào dự án | **GIỮ** — `/projects/<id>/overview`, một cú bấm |
| `components/home/DongStudioHome.tsx` + `widgets/` | **CÒN NGUYÊN trong cây, THÔI MOUNT.** Không xoá: NO-REBUILD §B25 bảo vệ năng lực; nhưng nó **không còn định nghĩa thứ bậc Home ở desktop** (D-DR2 + N-10 đã đè bố cục bento) |

**Cố ý bỏ, và vì sao**: lưới bento 9 thẻ · cột widget kiểu dashboard · thẻ cho ghi chú/hoạt
động/lời chào/tin tức — cả ba nằm trong bảng §9 "cố ý không làm" của bản khoá và trong 13 cờ đỏ
N-10. Widget **không mất**: chúng tụt xuống bậc KHI GỌI (kệ "tôi tự đặt"), đúng câu *"widget đứng
ở bậc thấp nhất vì nó không đòi hỏi gì ở người dùng"*.

### 2.8 · Token — thêm gì, và vì sao không đẻ hex thứ hai

Thêm một khối **TÔNG NỘI DUNG** cạnh `--illus-*`/`--paper-*` sẵn có trong `app/globals.css`
(đúng chỗ `HOME-IMPLEMENTATION-SPEC` §1 chỉ). **Ba màu mặt sáng khai BÍ DANH**, không hex mới:

```css
--nen-sang: var(--paper);       --net-sang: var(--paper-edge);      --muc: var(--paper-ink);
```

Mới thật sự: `--muc-2` (**đo 5,37:1** trên `--paper`) · `--canh-0..7` · `--vl-*` ·
`--muc-tren-anh-1/3` · `--scrim-manh/vua/nhe` · `--phu-chan-chu`. **Không sửa token nào đang có.**

---

## 3 · Tổng kết

Bản khoá đứng được trên app thật, và điểm chết của H2 (*hết chỗ ở ~9 món*) đã đóng **bằng số chứ
không bằng lời**: 3 vật và 25 vật cho ra cùng một bộ toạ độ. Cơ chế nằm ở **một hàm thuần có
test**, không nằm trong JSX — nên nó không thể trôi khi ai đó sửa giao diện.

Điều app thật dạy mà bản vẽ không dạy được: **ba lỗ đều ở chỗ nội dung dài hơn dự tính**. Bản vẽ
dùng chuỗi vừa khít nên hàng cao cố định không bao giờ tràn; app thật có tên dự án dài, có trạng
thái rỗng, có ngày chưa ai làm gì. Đó là lý do luật nghiệm thu đòi thao tác thật.

---

## 4 · Đánh giá khách quan

**Được**: cơ chế có máy canh · bất biến kiểm được bằng máy · luật PASS đi trọn chuỗi bằng bàn phím
· `prefers-reduced-motion` là nhánh THẬT (đo: `animation: none` + `transition: none`) · 0 hex gõ
tay · 0 giá trị bo ngoài thang · 0 vi phạm mới ở mọi máy soi.

**Chưa được / phải nói thẳng**:

1. 🔴 **Đã ghi nhầm vào CSDL repo chính** — xem §6, có khai báo đầy đủ.
2. 🟡 **Dải môi trường gần như vô hình ở nền SÁNG.** `SystemWallpaper` là lớp khí quyển sinh bằng
   mã (gradient), không phải ảnh chụp; ở nền sáng nó sát màu `--bg` nên 420px đầu sân đọc ra như
   khoảng trống. Bất biến thì đạt (bỏ nó đi không mất chữ nào) — nhưng **nó gần như không đóng
   góp gì về mặt thị giác ở nền sáng**. Đây là **quyết định của mắt Hoà**, tôi không tự chế nền
   khác: bịa một lớp nền không có trong thẩm quyền chính là thứ CONTEXT DETOX cấm.
3. 🟡 **Rail ngoài rộng 240 chứ không phải 52 như bản vẽ.** `AppShell`/`RailDieuHuong` đang ở nấc
   *shelf*; sân vì thế còn **960** thay vì 1148. Tỉ lệ TRONG Home đúng bản vẽ từng pixel, nhưng
   khung ngoài thì khác. Rail nằm ngoài vùng ghi của phiếu ⇒ tôi không đụng.
4. 🟡 **Nhãn demo đứng ở đỉnh thang, không ở mép trên** như bản vẽ — mép trên là `AppChrome`,
   ngoài vùng ghi. Đỉnh thang là chỗ cao nhất Home sở hữu.
5. 🟡 **Thân bậc 1 ở đường thật chưa phải hiện vật thật.** IF chưa có nguồn cho *"hiện vật đang dở
   kèm số đo được"* — `HOME-IMPLEMENTATION-SPEC` §2 khai sẵn đây là nợ bàn giao. Đường thật hiện
   dựng khung + số thật; **bảng vật liệu có m² đo từ khối 3D chỉ sống ở `?demo=`**.
6. 🟡 **Ngưỡng mặt nhìn 104×64 chưa được mắt phán** (nợ bàn giao §8.3). Kho vật liệu từng đo 141px
   là *"quá nhỏ để phân biệt vân"*; ở đây mặt chỉ cần **nhận ra vật**. Mắt phán ngược thì nới
   thang 400 → ~360 cho phần hình.

---

## 5 · Hướng xử lý — hai góc

**Hướng A — trình mắt ngay, để lô này đóng.** Ưu: nút cổ chai là 77 xong-máy / 1 qua mắt; món này
đã qua hết những gì máy phán được. Nhược: hai câu hỏi thị giác (dải môi trường ở nền sáng · ngưỡng
mặt nhìn) sẽ quay lại thành một vòng sửa nữa.

**Hướng B — dựng thêm biến thể dải môi trường rồi mới trình.** Ưu: Hoà quyết một lần. Nhược:
**tự chế hướng thị giác không có trong thẩm quyền** — đúng thứ N-16 cấm (*máy không phán được bố
cục/gu*), và là cơ chế đã làm nhiễm mấy đợt Home trước.

---

## 6 · 🔴 KHAI BÁO — dữ liệu tôi đã ghi nhầm vào CSDL repo chính

**Nguyên nhân**: `node_modules` trong worktree là **symlink sang repo chính** ⇒ Prisma neo
`file:./dev.db` vào schema của repo chính. Đã sửa: `.env` nay dùng **đường dẫn tuyệt đối** tới
`<worktree>/prisma/dev.db`, dev server khởi động lại với `DATABASE_URL` tuyệt đối đó.
**Tôi KHÔNG xoá gì trong CSDL repo chính** (luật zero-loss: giữ trước, dọn sau).

Trong `/home/user/INTERIORFLOW/prisma/dev.db`:

| Bảng | Số hàng tôi tạo | Định danh · mốc |
|---|---|---|
| `User` | 1 | `cmtn86c2100007deiuh21z371` · `tho@interiorflow.test` · "Thợ thi công" · 2026-09-04T17:25:52.394Z |
| `Project` | 3 | `cmtn8kufw00017dulerr9xv7s` "Thảo Điền · căn hộ 96 m²" · `cmtn8kuhu00077dultmkh4j1k` "Nam Long · nhà phố" · `cmtn8kujr000d7dul5vxby7dx` "An Phú · văn phòng" — đều 17:37:09 |
| `Flow` | 3 | `cmtn8kugw00057dulb435vq7t` · `cmtn8kuiw000b7dulx8er01ih` · `cmtn8kuks000h7dulemzatbn2` (đuôi "· bản vẽ") — đều 17:37:09 |
| `ProjectMember` | 3 | `cmtn8kufw00037duli0kw1z0d` · `cmtn8kuhu00097duljaaq8ftz` · `cmtn8kujs000f7dul10rmb9uq` |
| `CreditTransaction` | 1 | `cmtn86c4e00027dei0ujge095` · 17:25:52.478Z (cấp credit lúc đăng ký) |

⚠️ **Ba tên dự án đó đọc ra như dự án KHÁCH THẬT** ("Thảo Điền" · "Nam Long" · "An Phú" là địa
danh/chủ đầu tư có thật) mà **không mang dấu hiệu nào nói là mẫu** — vi phạm CONTENT-RULES
(dữ liệu app · demo · khách hàng không được trộn). Trong CSDL của worktree tôi đã đổi hẳn sang
**`DEMO · Căn hộ mẫu A` · `DEMO · Nhà phố mẫu B` · `DEMO · Văn phòng mẫu C`** — nhìn màn là biết
ngay (ảnh `luong-1-home-that.png`). **Đề nghị MAIN xoá 11 hàng trên khỏi CSDL repo chính.**

---

## 7 · CHƯA CHẮC / CHƯA KIỂM

- **Chỉ đo Chromium 1194.** Safari/Firefox là suy — `mask-image` có tiền tố `-webkit-`, nhưng
  `:root:has()` và `backdrop-filter` chưa thử ngoài Chromium.
- **Chưa thử trình đọc màn hình thật.** Vòng tiêu điểm đo bằng `getComputedStyle` +
  `matches(':focus-visible')`; `role="progressbar"`/`aria-valuenow`/`aria-label` mới đọc trong mã.
- **Ngữ pháp chuyển động §7 mới kiểm được nhánh TẮT.** `prefers-reduced-motion` đo thật
  (`animation:none` + `transition:none`); phần thời lượng/đường cong lúc BẬT thì chưa đo — mắt
  người là thứ duy nhất phán được nó "êm" hay "giật".
- **Mặt nhìn bậc KỀ BÊN là hình SINH BẰNG MÃ**, tất định theo id vật — **không phải ảnh thật của
  dự án**. `/api/home/summary` không trả `coverUrl`; tôi cố ý không thêm lượt gọi thứ hai. Nó
  không hứa là ảnh chụp, nhưng cũng chưa ai phán nó có đủ *nhận ra vật* không.
- **Bậc NỀN ở đường thật đang rỗng** trong lần đo (0 việc có hạn trong CSDL sạch) ⇒ nhánh
  `dang-chay`/`lech` với dữ liệu THẬT chưa lần nào chạy trên màn; chỉ chạy ở `?demo=`.
- **`.nen-chup/` KHÔNG được commit** (ngoài ALLOWED FILES) — 3 tệp harness
  (`chup-home.mjs` chụp + đo · `luong-home.mjs` luồng + luật PASS · `do-duong-vao.mjs` truy vết
  điều hướng). Chúng nằm ngoài git ⇒ **git không cứu được**, đúng bài học 04/09. Lượt sau muốn
  chạy lại phải dựng lại, hoặc MAIN cho phép commit chúng.
- **Con số 8,21:1 là TÍNH theo công thức WCAG, không ĐO trên màn.** Giả định chưa kiểm: scrim hoà
  đúng như mô hình alpha, và không có lớp bán trong suốt nào chen giữa.

---

## 8 · Đề xuất

**Hướng A — trình mắt ngay**, gộp đúng **hai** quyết định thị giác vào một lô:

1. **Dải môi trường ở nền SÁNG** — giữ nguyên (khí quyển tiết chế, đúng "C chỉ là lớp khí
   quyển"), hay cần nó hiện diện hơn?
2. **Mặt nhìn 104×64** — đủ để nhận ra vật, hay nới thang 400 → ~360 cho phần hình?

Chọn A vì ba lẽ: món này **đã qua hết những gì máy phán được** nên giữ lại thêm cũng không sạch
hơn; hai câu trên **thuộc loại máy không phán được** (N-16) nên trả lời sớm rẻ hơn trả lời muộn;
và tự dựng thêm biến thể là **tự chế hướng thị giác ngoài thẩm quyền** — đúng cơ chế đã làm nhiễm
mấy đợt Home trước. Ảnh trình mắt: `1600-that-sang` · `1600-co-viec-sang` · `1600-day-du-toi` ·
`1600-rong-toi` (4 ảnh, đủ bốn trạng thái, hai nền).
