# SOI MẮT 05/09 — tự đăng ký · tự đi · tự chụp · tự đo

> **Cách làm.** Không đọc mã rồi đoán. Mở app thật ở `localhost:3210` (bản dựng hiện tại, BUILD_ID
> `FBwxn6Q1YihnH0BbRTH-8`), **tự đăng ký một tài khoản**, đi hết 8 màn, chụp 1440×900, rồi **đo trên
> DOM sống** — không đo bằng mắt nhìn ảnh. Script: `soi-mat.mjs` · `do-bo-cuc.mjs` · `do-chrome.mjs`.
> Ảnh + số thô: `docs/delivery/anh-duyet-mat/soi-mat-05-09/`.
>
> Vượt màn khoá bằng cách gieo `localStorage.if_intro_seen_v1='1'` (cờ chính `app/intro/page.tsx:18`
> đọc). ⚠️ Đây là **đường vòng của máy đo**, không phải bằng chứng bẫy intro 60s đã hết — bẫy đó vẫn
> sống, vẫn là P0 riêng.

## ⓪ 🔴 ĐÍNH CHÍNH — bản đầu của chính tệp này SAI Ở CHỖ NẶNG NHẤT

Bản đầu tôi viết: *"8/8 màn **không màn nào cuộn quá khung** — đóng đúng nỗi lo §30."*
**Sai hoàn toàn.** Tôi đo `document.documentElement`, mà app này để `html{overflow:visible}` và
cuộn thật nằm ở **container con** (`.main`, `.shelf`, các `div.overflow-y-auto`). Mọi màn vì thế
đều trả về `900/900` — kể cả màn Cài đặt 5482 ký tự. **Một con số bịp, và tôi đã đọc nó thành
"sạch".** Đo lại đúng chỗ (`scripts/soi-mat/do-cuon.mjs`):

| màn | khung | nội dung | THỪA | thấy được | phần tử bị cắt ở mép dưới |
|---|---|---|---|---|---|
| **Cài đặt** | 858 | **3737** | **+2879** | **23%** | 2 |
| **Files** | 858 | **2548** | **+1690** | **34%** | **22** |
| Thư viện | 858 | 1104 | +246 | 78% | 7 |
| Home · Vật liệu · Việc | — | — | 0 | 100% | 2 |
| **`.shelf` (sidebar) — MỌI màn** | 474 | **499** | **+25** | 95% | — |

⇒ Người dùng mở Cài đặt **chỉ thấy chưa tới một phần tư** những gì có ở đó. §30 đòi *"nội dung
ngoài tầm nhìn phải có DẤU HIỆU còn tiếp"* — câu hỏi đó **vẫn chưa ai trả lời**, tôi báo nhầm là
đã đóng.

⚠️ **Và nó lật một kết luận khác của tôi.** Tôi ghi *"cột trái CHẾT 40%"* như thể **thừa chỗ**.
Thật ra ở đúng cột đó, `.shelf` đang **THIẾU 25px** — nội dung nhiều hơn hộp chứa. **Có 380px cột
trống ngay cạnh, mà cái kệ vẫn không đủ chỗ để bày.** Đó là lỗi bố trí đo được, không phải chuyện gu.

📌 **Bài học, cùng họ với 4 ca 04/09:** máy trả `0` không có nghĩa là **sạch** — nó có thể nghĩa là
**đo nhầm chỗ**. Lần này tôi tự tin vì có bảng số; bảng số ấy đo sai node. **Trước khi tin một số
`0`, phải hỏi: nếu thứ này hỏng thật thì phép đo của tôi CÓ THẤY ĐƯỢC không?**

### ⓪b · 🔴 §30 KHÔNG ĐẠT — 2879px giấu sau MỘT MÉP KHÔNG CÓ DẤU HIỆU NÀO

Đo tiếp container cuộn (`scripts/soi-mat/do-dau-hieu-con-tiep.mjs`):

| | Cài đặt `.main` | Files |
|---|---|---|
| nội dung khuất | **2879px** | **1690px** |
| bề rộng máng thanh cuộn | **0** | **0** |
| `mask` / vệt mờ ở mép | **không** | **không** |
| mũi tên / chữ "còn tiếp" | **không** | **không** |

Không thanh cuộn chiếm chỗ, không vệt mờ, không mũi tên. **Mép dưới trông y hệt mép của một trang
đã hết.** §30 đòi *"nội dung ngoài tầm nhìn phải có DẤU HIỆU còn tiếp"* — đây là **ca hỏng đúng
loại §30 sinh ra để chặn**, chỉ khác chỗ: lần trước là `1293 vs 775`, lần này là `3737 vs 858`.

**Thứ đang bị giấu ở Cài đặt** (chụp sau khi cuộn xuống đáy —
`anh-duyet-mat/soi-mat-05-09/9-cai-dat-cuon-day.png`): mục **Độ chói của kính** (3 nấc, đúng NT-16)
· mục **Đơn vị & Tỉ lệ** trọn vẹn — đơn vị hiển thị · cách nhập số đo · ô gõ thử quy đổi ·
**tỉ lệ in mặc định 9 nấc ISO**. Tức **đúng cái Hoà chốt 15/08** (`don-vi-ty-le-toan-app`) đã dựng
xong, đang chạy, **và không ai nhìn thấy nó**.

⇒ Đây không phải "thiếu tính năng", là **thiếu một đường tới tính năng đã có**. Sửa rẻ hơn nhiều
so với dựng mới, và giá trị thu về lớn hơn — nhưng phải biết là nó tồn tại mới sửa được.

## ① Con số đo được (bảng cũ — cột "cuộn" đã bị ⓪ bác bỏ)

| màn | chữ | nút | cuộn | tràn ngang | lỗi console |
|---|---|---|---|---|---|
| Home `/` | 1519 | 48 | 900/900 | không | 0 |
| Files `/files` | 2946 | 67 | 900/900 | không | 0 |
| Thư viện `/library` | 2098 | 64 | 900/900 | không | 0 |
| Gallery | 714 | 50 | 900/900 | không | 0 |
| Vật liệu `/materials` | 1924 | 57 | 900/900 | không | 0 |
| Việc `/tasks` | 663 | 51 | 900/900 | không | 0 |
| Cài đặt `/settings` | 5482 | 116 | 900/900 | không | **8** |
| Về ứng dụng | **62** | **2** | 900/900 | không | 0 |

**Còn đúng sau đính chính:** 8/8 màn **không tràn NGANG**, 7/8 màn **0 lỗi console**.
⛔ Cột `cuộn 900/900` trong bảng dưới là **số đo sai**, giữ lại làm dấu vết — số thật ở mục ⓪.

## ② Bốn lỗi ĐO ĐƯỢC, không phải chuyện gu

### L1 · 🔴 15 nút chỉ-có-icon KHÔNG NHÃN — có mặt trên **3/3** màn đã đo
`.shrow` ở `x=261` (mép phải sidebar) và 11 nút khác: `innerText` rỗng · `aria-label` rỗng ·
`title` rỗng · bên trong là `<svg>`. Trình đọc màn hình đọc ra **"button"**, hết.
Trái **NT-8 "icon luôn có nhãn"** — và trái ở dạng nặng nhất: không phải nhãn xấu, là **không có nhãn**.

### L2 · 🔴 2 công tắc ở Cài đặt KHÔNG có nhãn nào
`.sw` 36×22 tại `(1239,775)` và `(1239,833)` — tức **"Giảm chuyển động"** và **"Tự sao lưu mỗi ngày"**.
Chữ nằm ở ô bên trái, **không nối vào công tắc** bằng `aria-labelledby`/`<label>`. Cùng họ L1 nhưng
nặng hơn: đây là công tắc **đổi hành vi app**, bấm nhầm không biết mình vừa tắt gì.

### L3 · 🔴 Cột trái CHẾT ~40% chiều cao — trên CẢ HAI màn đã đo
Đo bằng lưới 20px, "mực" = chữ · ảnh · svg · viền · **hoặc nền KHÁC nền trang** (nền trùng nền trang
không tính là mực — mắt không thấy gì):

| | Home | Cài đặt |
|---|---|---|
| dải trái `x<280` **trống** | **42%** | **38%** |
| dải phải `x>1120` trống | 0% | **33%** |
| toàn màn trống | 9% | 16% |

Sidebar nổi thành **hai viên rời** bắt đầu ở `y≈270`; từ `y=40→270` và `y=620→860` là **cột trắng
không có gì**. Đúng cờ đỏ **N-10 "hộp rỗng khổng lồ"**.

### L4 · 🔴 `/settings` ném **React #418 ×8** (hydration mismatch)
Chữ máy chủ dựng ≠ chữ trình duyệt dựng. Chưa truy được nguồn — 8 lần trong một lần tải là nhiều.

## ③ Ba thứ nhỏ hơn, ghi để không rơi

- **Nhãn chặng ở header SAI cả hai chiều**: ở Home nó **rỗng** (chỉ còn `⌄`); ở Cài đặt nó ghi
  **"Thiết kế 3D"** trong khi Cài đặt không phải một chặng.
- **Tay cầm mồ côi**: `‹` `›` `📌` ở đáy trái đứng trên nền trống; một `›` lẻ ở `(257,63)`;
  một `‹` lẻ ở mép phải `(1433,470)`.
- **Khẩu độ Vitals đọc ra như một ô xám rỗng** (`x≈795–905` trên thanh trên), glyph bên trong gần
  như không thấy. Nó **đúng chỗ** theo EXS §7, nhưng **không đọc ra là gì**.
- **Vùng chạm < 32px**: Home **34/49 (69%)** · Files 38/69 (55%) · Cài đặt 44/117 (38%).

## ④ Thứ tôi ĐO ĐƯỢC ở Home — KHÔNG phải lời phán "đúng/sai"

⛔ **N-16: máy không phán được bố cục/gu.** Chấm bố cục Home là **cửa của Hoà**, không phải của tôi.
Dưới đây chỉ là **số đếm được**, để Hoà chấm nhanh hơn — không phải kết luận:

| đếm gì | số |
|---|---|
| vật ở hạng TRỘI (chiếm ô lớn nhất, có nút chính) | **1** — thẻ "Bắt đầu" |
| cụm ở hạng dưới | 1 — "một dự án ở IF đi qua đâu" |
| thẻ ở hạng ngang nhau (dấu hiệu bento) | **0** |
| nấc hành động trong thẻ chính | 3 — *Tạo dự án mới* / *Mở dự án có sẵn* / *Nhập từ tệp* |

Bốn số này khớp hình dạng §26 `RESUME → BEGIN` và không khớp hình dạng bento. **Khớp hình dạng
không phải là đạt** — đạt hay không thì mắt Hoà nói.

## ⑤ Phiên bản + tự cập nhật (câu Hoà hỏi)

- **Xem bản mấy:** `Cài đặt → Về ứng dụng` → *"Phiên bản 0.1.0"* (`app/settings/about/page.tsx:61`).
  Màn đó **chỉ có 62 ký tự và 2 nút**, ~70% là khoảng trắng, và **không có app chrome** (không sidebar,
  không thanh trên). Có chỗ, nhưng chưa ai dựng gì lên đó.
- **OTA đã dựng gần xong mà đang TẮT**: `electron-updater@6.3.9` đã cài · `build.publish` đã trỏ
  GitHub Releases · `autoUpdater.checkForUpdatesAndNotify()` đã nối — nhưng khoá sau
  `process.env.INTERIORFLOW_AUTO_UPDATE === '1'` (`electron/main.js:570`) mà **không ai đặt biến đó**.
- 🔴 **VA VỚI VIỆC ĐƯA REPO VỀ PRIVATE**: nhà cung cấp cập nhật là **GitHub Releases của chính repo này**.
  Repo private thì bản tải về **đòi token**, tức phải **nhúng token vào app giao cho người dùng** —
  không làm được một cách an toàn. ⇒ **Private + OTA-qua-GitHub-Releases là hai thứ loại trừ nhau.**
  Đây là quyết định sản phẩm, không phải việc kỹ thuật: hoặc repo mã private còn **release để public**,
  hoặc dời bản cài sang chỗ khác (S3/R2/máy chủ riêng), hoặc hoãn OTA.
