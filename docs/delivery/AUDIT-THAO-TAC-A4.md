# AUDIT THAO TÁC — LÀN A4
**Files · Thư viện · Vật liệu · Bảng việc · Cài đặt · vòng đời tài khoản**

- Bản chạy: `next start` trên `http://localhost:3210`, nhánh `nen-checkpoint`, HEAD `b9f00873`.
- Cách làm: **thao tác thật bằng Playwright/Chromium** (không kết luận bằng đọc mã). Mã chỉ dùng để *giải thích* lỗi đã thấy.
- Ảnh: `docs/delivery/anh-audit-a4/` (60 khung) — **⚠️ đường này bị `.gitignore:95` (`docs/**/*.png`) chặn, nên ảnh KHÔNG được git theo dõi.** Bản thứ hai còn ở `/tmp/a4-anh/`. Muốn giữ thì phải chép ra chỗ được theo dõi hoặc thêm ngoại lệ — đây đúng cơ chế đã làm mất lô `home-that-*.png` ngày 04/09 (*git không cứu thứ nó không theo dõi*).
- Tài khoản: `audit@if.test` (có dữ liệu) và **`a4moi1788593273132@if.test`** (tạo mới trong phiên này, cho ca RỖNG).

---

## BẢNG PHỦ

Ký hiệu: ✅ đã đi · ⬜ chưa đi (kèm lý do)

| Bề mặt | ① Sung sướng | ② RỖNG (tài khoản mới) | ③ Vào ngang (chưa đăng nhập) | ④ Quay về / bỏ dở | Chuột+bàn phím | Cảm ứng |
|---|---|---|---|---|---|---|
| `/files` | ✅ | ✅ | ✅ | ✅ | ✅ 43 chặng Tab | ✅ 834×1112 |
| `/library` | ✅ | ✅ | ✅ | ✅ | ✅ 27 chặng Tab | ✅ |
| `/library/ingest` | ✅ | ⬜ *(cần dự án; tài khoản mới chưa có — chính nó là phát hiện `A4-05`)* | ✅ | ✅ | ✅ | ✅ |
| `/library/gallery` | ✅ | ✅ | ✅ | ✅ | ⬜ *chỉ soi tĩnh, không đi Tab riêng* | ⬜ |
| `/library/knowledge` | ⬜ *ngoài phạm vi 6 màn chính, chỉ kiểm tải được (200)* | ⬜ | ✅ | ⬜ | ⬜ | ⬜ |
| `/materials` | ✅ | ✅ | ✅ | ✅ | ✅ 28 chặng Tab | ✅ |
| `/tasks` | ✅ | ✅ | ✅ | ✅ | ✅ 31 chặng Tab | ✅ |
| `/settings` | ✅ | ✅ | ✅ | ✅ | ⬜ *không đi Tab hết 87 điều khiển* | ✅ |
| `/settings/avatar` | ✅ | ⬜ | ✅ | ✅ | ⬜ | ⬜ |
| `/settings/about` · `/licenses` | ✅ | ⬜ | ✅ | ⬜ | ⬜ | ⬜ |
| `/colors` (URL cũ) | — | — | ✅ | ✅ | ⬜ | ⬜ |
| **Vòng đời tài khoản** | ✅ đăng ký → đăng nhập → tạo dữ liệu → **đăng xuất** → **đăng nhập lại** → dữ liệu còn nguyên | | | | | |

**Tổng: 14 lỗi** — P0: 0 · **P1: 6** · **P2: 8**.

---

## KẾT QUẢ CA ② — TÀI KHOẢN HOÀN TOÀN MỚI

Đăng ký `a4moi…@if.test` qua `/api/auth/register` (200), rồi đi 7 màn. Kết quả **tốt hơn tôi chờ đợi**: đây **không** phải một dàn hộp rỗng nói *"chưa có gì"*. Hầu hết màn trống đều đưa được một hành động ngay tại chỗ:

| Màn | Màn trống nói gì | Làm được việc tại chỗ? |
|---|---|---|
| `/` | *"Bắt đầu — chưa có việc nào đang dở, xưởng thì đã sẵn sàng"* + **3 lối vào** | ⚠️ **1/3** — xem `A4-04` |
| `/tasks` | *"Chưa có dự án nào để giao việc… Tạo dự án đầu tiên rồi thêm việc"* | ✅ có nút **Tạo dự án đầu tiên** |
| `/library/gallery` | *"Gallery chưa có ảnh nào… Nhập ảnh sạch (CC0/Unsplash) vào Kho chung"* | ✅ **Nhập từ Kho chung** + sổ nguồn ghi được ngay |
| `/files` TẦNG② | 8 gói `COL-*` mô tả rõ mỗi gói để làm gì | ⚠️ mô tả tốt, **không gói nào có đường thêm mục đầu tiên** (`A4-09`) |
| `/materials` | **không trống** — 2 vật liệu "theo bản cài" | ✅ **Thêm vật liệu** chạy thật |
| `/settings` | đầy đủ | ✅ |

Câu chữ trống viết đúng khuôn *"nói rõ + kèm nút"*. Vấn đề còn lại của ca này nằm ở **`A4-04`** (2/3 lối vào của màn mở đầu là nút mờ) và **`A4-09`** (Collection+ mô tả hay nhưng không vào được).

---

# LỖI

## P1

### `[A4-01]` P1 · `/colors` · chuột · **CA③ vào ngang**
**Thấy gì.** Dán `http://localhost:3210/colors` vào một tab mới: trang tải (200) rồi **tự chuyển sang `about:blank`** — tab trắng trơn, `document.body.innerText` rỗng, không còn gì của IF. Đo: `window.history.length === 2` ngay sau khi tải, `router.back()` lùi về `about:blank`. Ảnh `colors-tab-moi.png`.
Đi từ trong app thì đúng: `/materials → /colors` lùi về `/materials`. Ảnh `colors-co-history.png`.
**Đáng lẽ phải gì.** Bookmark/link cũ phải rơi vào chỗ màu thật sự sống (kệ Vật liệu, bước Chọn theo màu). Chính docstring của `app/colors/page.tsx` khai đúng ý đó — *"KHÔNG XOÁ ROUTE — xoá là vỡ bookmark"* — nhưng lá chắn `window.history.length > 1` không đỡ được ca này. Căn cứ: **lẽ thường** (một URL của sản phẩm không được dẫn tới tab trắng), cộng chính ý định ghi trong mã.
**Tái hiện.** Tab mới → dán `/colors` → Enter → chờ 2 giây.
**⚠️ Chưa chắc.** `history.length = 2` là số đo **trong Playwright** (tab khởi tạo ở `about:blank`). Chrome thật gõ URL ở trang New Tab có thể *thay thế* chứ không *đẩy* mục lịch sử, khi đó `length = 1` và nhánh `router.replace('/')` chạy đúng. **Nhưng ca hỏng vẫn còn nguyên và còn rộng hơn**: đến từ một trang ngoài (mail/chat/Drive) thì `history.length > 1` là chắc chắn, và `router.back()` khi đó **ném người dùng ra khỏi IF, về lại trang ngoài đó**. Cần kiểm tay trên Chrome có cửa sổ.

### `[A4-02]` P1 · `/library/ingest` · **bàn phím + cảm ứng** · CA①
**Thấy gì.** Nút **“Nhận diện từ tệp khối”** ở trạng thái mờ mà **không có một kênh lý do nào**: `title = null`, `aria-describedby = null`, `aria-label = null`, và rê chuột **không** sinh phần tử `[role="tooltip"]` nào (đếm trước/sau đều `0`). Ảnh `ingest-nutmo-cam.png`.
Ngay cạnh nó, nút **“Dựng khối từ ảnh”** làm đúng: `aria-describedby` trỏ tới *“Chưa dựng khối từ ảnh được — máy chủ thiếu NVIDIA_API_KEY và FAL_KEY…”*. Hai nút cùng hàng, một nút nói, một nút câm.
**Đáng lẽ phải gì.** `docs/ACTIVE-DESIGN-CONTEXT.md` giữ luật đã chốt *“lệnh chưa đủ điều kiện phải hiện mờ **kèm lý do**, không gán phím giả”*, và bài học 16/08 đã ghi rõ lý do phải đi qua `aria-describedby` chứ không qua `title`. Đây là ca **không có kênh nào cả** — tệ hơn cả ca `title`.
**Tái hiện.** Đăng nhập → `/library/ingest` → Tab tới nút, hoặc chạm trên tablet → không có gì giải thích vì sao bấm không được.

### `[A4-03]` P1 · `/tasks` · **cảm ứng** · CA①
**Thấy gì.** 10 nút **“‹ Lùi một cột”** / “›” trên thẻ việc ở trạng thái mờ, lý do chỉ nằm trong **`title="Lùi một cột"`** — không `aria-describedby`, không nhãn nhìn thấy. Trên cảm ứng `title` **câm hoàn toàn**. Cả màn `/tasks` có **91 phần tử chỉ có `title`** làm nhãn. Ảnh `CHAM_tasks.png`.
**Đáng lẽ phải gì.** Đúng cái bẫy đã trả giá một lần và đã ghi thành luật (16/08: *“`title` câm trên cảm ứng và `Tab` bỏ qua nút disabled ⇒ đúng nút cần giải thích nhất lại mất sạch kênh”*). `/files` đã sửa theo `aria-describedby`; `/tasks` **chưa** được sửa cùng đợt.
**Tái hiện.** Chromium `hasTouch:true, isMobile:true` 834×1112 → `/tasks` → chạm nút `‹` mờ trên thẻ ở cột đầu.

### `[A4-04]` P1 · `/` (màn mở đầu) · chuột · **CA② RỖNG**
**Thấy gì.** Tài khoản mới, màn mở đầu chào bằng **“3 lối vào”**, nhưng **2 trong 3 là nút mờ**:
- *“Mở dự án có sẵn”* → *“Cột bên chưa có gì để mở — tạo dự án mới trước.”*
- *“Nhập từ tệp · dwg · pdf · ảnh”* → ***“Chưa có đường tạo dự án thẳng từ tệp. Tạo dự án trước, rồi nhập tệp vào bản vẽ của dự án đó.”***
Ảnh `RONG_.png`.
**Đáng lẽ phải gì.** Lối ② mờ là **đúng và trung thực** (chưa có dự án thì chưa mở được gì). Lối ③ thì khác hẳn: lý do tự khai là **năng lực chưa tồn tại**, không phải *chưa đủ điều kiện lúc này* — mờ mãi mãi chứ không mờ tạm. Bày một năng lực chưa có thành một trong “3 lối vào” của màn đầu tiên là **hứa cái không có**, trái luật *cấm nút giả bấm không ra gì* / *không hứa suông* (`ACTIVE-DESIGN-CONTEXT`, luật giao diện bắt buộc L2).
Người dùng mới thấy 3 cửa, đẩy 2 cửa không mở. Đây là ấn tượng đầu tiên của sản phẩm.
**Tái hiện.** Đăng ký tài khoản mới → mở `/` → Tab tới 3 thẻ lối vào.

### `[A4-05]` P1 · `/settings` khi để **English** · chuột · CA①
**Thấy gì.** Bật **English** trong Cài đặt: phần lớn app dịch đúng (`Home`, `Library`, `Task board`, `TIER ① System folders`…), **nhưng chính trang Cài đặt còn kẹt 41 chuỗi tiếng Việt**, gồm cả tiêu đề của nó: `Quay lại` · `Cài đặt` · *“Tài khoản · giao diện · nơi lưu file — áp cho cả app, màu dự án vẫn thuộc Brand Kit”* · `Đăng xuất` · `Nâng cao` · `Bố cục panel` · `Đặt lại bố cục panel` · `Kho vật liệu` · `Bảng việc`…
Kèm: `/files` **11** chuỗi kẹt (cả bảng dung lượng: `Dự án · Sao lưu · Thư viện · Khác`, và *“Cây thư mục thật trên đĩa — mở Finder vẫn hiểu”*), `/tasks` kẹt tên cột `Chưa làm · Đang làm · Chờ duyệt`. `/library` và `/library/gallery` **sạch 0**. Ảnh `ngonngu-EN-settings.png`, `ngonnguEN_files.png`, `ngonnguEN_tasks.png`.
**Đáng lẽ phải gì.** *“UI song ngữ VI/EN”* là luật nền (`CLAUDE.md`, LUẬT NỀN TẢNG mục 5). Đây là **ảnh gương** của ca Hoà đã bắt (*“Shared raw stock”* kẹt tiếng Anh trong UI Việt) — cùng một bệnh, chiều ngược lại. Nút **Đăng xuất** kẹt tiếng Việt là nặng nhất: nó là đường thoát của người dùng.
**Tái hiện.** `/settings` → bấm **English** → ở lại `/settings` và đọc; rồi sang `/files`.
✅ *Ghi nhận đã sửa*: chuỗi **“Shared raw stock”** Hoà bắt trước đây **không còn** — `/files` nay ghi **“Nhà cung cấp”**, kèm câu *“Ngăn ‘phần thô’ cũ đã gộp vào Nhà cung cấp.”*

### `[A4-06]` P1 · `/files` · chuột · CA①/②
**Thấy gì.** Vùng nội dung chính cuộn **2548px trong khung 858px** (gấp ~3), mà **không có thanh cuộn dựng ra**: `offsetWidth − clientWidth = 0`. Trang bị cắt **giữa chừng ngay ở tiêu đề “Files”** sát mép dưới, không vệt mờ, không mũi tên, không dấu hiệu nào là còn tiếp. Ảnh `files-day.png` (đã gọi `window.scrollTo(0, scrollHeight)` — **màn không nhúc nhích**, vì cuộn nằm ở khung con).
Cuộn **có** hoạt động khi lăn chuột (`scrollTop` 0→700) và `PageDown` sau khi Tab vào (→750). Tức nội dung **tới được**, chỉ là **không ai biết là còn**.
**Đáng lẽ phải gì.** Hoà chốt 04/09 **§30**: *“nội dung ngoài tầm nhìn phải có **dấu hiệu còn tiếp** — cấm lặp lỗi `scrollHeight 1293 vs clientHeight 775` không dấu hiệu.”* Ở đây là **2548 vs 858**, tỷ lệ xấu hơn ca bị cấm.
**Tái hiện.** `/files` ở 1440×900 → nhìn mép dưới → không có gì báo còn TẦNG ② Collection+ bên dưới.
**⚠️ Chưa chắc.** Chromium headless có thể dùng thanh cuộn phủ (overlay) nên phép đo gutter = 0 chưa chứng minh được trình duyệt có cửa sổ cũng không vẽ thanh cuộn. **Phần chắc chắn**: trong ảnh chụp không thấy thanh cuộn, và nội dung bị cắt ngang một tiêu đề — đó tự nó đã là thiếu dấu hiệu.

---

## P2

### `[A4-07]` P2 · toàn app · **cảm ứng** · CA①
**Thấy gì.** Nút chỉ có biểu tượng, nhãn nằm trong `title` nên **cảm ứng mất sạch**: `/files` 7 · `/settings` 20 · `/tasks` 91. Ví dụ `title="Thêm"`, `title="Ghim"`, `title="Tổng quan · Dự án · Files · Thư viện"`, `title="Mở bảng kiểm"` — tất cả `innerText` rỗng, không `aria-label`. Ảnh `CHAM_files.png`, `CHAM_settings.png`.
**Đáng lẽ phải gì.** Luật loại “Icon giao diện”: **luôn có nhãn**; và *“tablet không giấu sau hover”* (`SPEC-HOVER-FOCUS-IDF`, 8 luật chung).
**Tái hiện.** Cảm ứng 834×1112 → `/files` → chạm biểu tượng ghim/thêm ở rail: không có gì cho biết nó là gì.

### `[A4-08]` P2 · `/tasks` · **cảm ứng** · CA①
**Thấy gì.** **74/97** điều khiển dưới 44px, gồm: `Thêm thẻ (24×24)` · `Chưa giao ai (20×20)` · `Đặt ngày (22×22)` · `‹ › (22×22)`. Tay cầm panel `Mở bảng kiểm` là dải **14×1070**. Ảnh `CHAM_tasks.png`.
**Đáng lẽ phải gì.** Vùng chạm ≥44px (token `--tap`, chốt 03/08 mật độ theo con trỏ). 20–24px trên tablet là không bấm trúng.
**Tái hiện.** Cảm ứng → `/tasks` → thử chạm chấm “Chưa giao ai” trên một thẻ.

### `[A4-09]` P2 · `/files` TẦNG② Collection+ · chuột · **CA② RỖNG**
**Thấy gì.** 8 gói (`COL-MAT-001`…`COL-PRO-001`) đều hiện `—`, nhãn *“chưa nối kho”*, và **không gói nào có đường thêm mục đầu tiên**. Ba bộ lọc Nguồn/Trạng thái/Cập nhật đều mờ (*“Chưa gói nào có mục để đọc…”*). Dòng tổng tự khai: *“8 gói đã có mặt, chưa gói nào nối kho — mã COL-MAT-001 sẽ cấp khi có mục đầu tiên.”* Ảnh `RONG_files.png`, `files-sau-den-collection.png`.
**Đáng lẽ phải gì.** Luật trống 04/09: *“trống thì phải **HÀNH ĐỘNG ĐƯỢC**, không phải một câu chết.”* Mô tả từng gói viết rất tốt và **không** phải hộp rỗng câm — nhưng cả tầng ② không có một cửa nào để bắt đầu, nên với người dùng nó vẫn đứng yên.
**Tái hiện.** Tài khoản mới → `/files` → cuộn xuống TẦNG ② → tìm đường thêm vật liệu vào `COL-MAT-001`.

### `[A4-10]` P2 · `/files` (chưa đăng nhập) · chuột · **CA③**
**Thấy gì.** Không có cửa xác thực ở tầng trang (`middleware.ts` chỉ chắn `/api/*`, `matcher: '/api/:path*'`). Người chưa đăng nhập mở thẳng `/files` `/library` `/materials` `/tasks` `/settings` đều **200 và render đủ vỏ app**, rail đầy đủ, và màn nói **“Chưa có dự án — bấm để tạo dự án đầu tiên”** — một câu **sai sự thật**: app không biết có dự án hay không, nó chỉ đang bị 401. `/materials` còn hiện *“Kho vật liệu 2 mục”* (2 mẫu theo bản cài, không phải dữ liệu người khác — **không lộ dữ liệu**).
Có đỡ: sau khi API 401, một dải hiện ở đáy — *“Phiên đăng nhập đã kết thúc · bản vẽ của bạn vẫn được giữ nguyên tại máy. **[Đăng nhập lại]**”*. Ảnh `anon-files.png`.
**Đáng lẽ phải gì.** Dải cứu đó **đúng và tốt**, nhưng nó tới **sau** và nằm **dưới cùng**, trong khi thứ đập vào mắt trước là một câu khẳng định sai về dữ liệu của người dùng. Căn cứ: **nhận định của tôi, không có điều khoản** — không tìm thấy điều khoản nào về cửa xác thực tầng trang.
**Tái hiện.** Cửa sổ ẩn danh → dán `/files`.

### `[A4-11]` P2 · `/files` (chưa đăng nhập) · chuột · CA③
**Thấy gì.** Hộp lỗi đỏ giữa màn: **“Không tải được danh sách flow.”** — `flow` là từ nội bộ, người dùng không có khái niệm đó ở màn Files. Ảnh `anon-files.png`.
**Đáng lẽ phải gì.** `SPEC-NGON-NGU-CHI-DAN` luật 2: **CẤM jargon nội bộ lộ ra UI**; khuôn lỗi phải nói việc + kèm nút.
**Tái hiện.** Như `A4-10`.

### `[A4-12]` P2 · `/settings/avatar` · chuột · **CA④ bỏ dở**
**Thấy gì.** Màn avatar **không có đường huỷ**: chỉ `Ngẫu nhiên` và `Xong`; không `Quay lại`, không `Huỷ`; `Escape` **không làm gì** (URL đứng nguyên `/settings/avatar`). Nó cũng **không bọc AppShell** (`coAppShell: false`) nên không còn rail để đi chỗ khác. `Xong` đưa về `/` (trang chủ), **không** về `/settings` là nơi vừa đi ra. Ảnh `dn_settings_avatar.png`.
**Đáng lẽ phải gì.** CA④: vào sâu thì phải có đường ra không-cam-kết. Căn cứ: **lẽ thường** + luật *Undo trước hỏi sau* (nếu không lùi được thì phải có xác nhận; ở đây không có cả hai).
**Tái hiện.** `/settings` → `Chỉnh avatar` → bấm `Ngẫu nhiên` → muốn bỏ, tìm đường huỷ.
**⚠️ Chưa chắc.** Tôi **chưa xác minh** đổi rồi rời đi (không bấm `Xong`) thì thay đổi có bị ghi hay không — đã chụp `avatar-sau-ngaunhien.png` và `avatar-quaylai-sau-boDo.png` nhưng chưa so bằng mắt hai ảnh đó.

### `[A4-13]` P2 · `/settings/avatar` · chuột · CA①
**Thấy gì.** Hai chỗ:
1. Dưới ba ảnh xem trước có ba nhãn trần **`44` `28` `20`** — số pixel lộ thẳng ra UI, không đơn vị, không lời.
2. Các thẻ chọn của **TÀN NHANG** (2 thẻ) và **MÁ ỬNG** (3 thẻ) trông **giống hệt nhau** ở cỡ đang hiển thị — không phân biệt được đang chọn khác gì. Ảnh `dn_settings_avatar.png`.
**Đáng lẽ phải gì.** (1) trái *CẤM jargon nội bộ lộ UI*. (2) chốt 07/08 đã đo được rằng ảnh xem trước dưới ngưỡng thì **mất công năng** (141px *“quá nhỏ để phân biệt vân gỗ sồi với óc chó”*); ở đây thẻ ~90px cho một khác biệt còn tinh hơn nhiều.
**Tái hiện.** `/settings/avatar` → tab **Khuôn mặt** → so hai thẻ mục TÀN NHANG.

### `[A4-14]` P2 · `/files` · chuột · CA①
**Thấy gì.** Bấm **“Đọc lại”** — không có phản hồi nào: `document.body.innerHTML` dài y hệt trước/sau, không con quay, không dải tiến trình, không dòng *“đã cập nhật lúc…”*. Người dùng không biết nó đã chạy hay chưa. (Quét 21 nút trên `/files`: mọi nút khác **đều** có phản ứng; các nút cây thư mục ban đầu tưởng chết hoá ra chỉ **nằm dưới vùng cắt** của `A4-06` — cuộn tới thì bấm được.)
**Đáng lẽ phải gì.** Luật 16/08: *“cái gì đang chạy cũng phải có thanh thể hiện tiến trình”* — việc không đo được thì dùng dạng chạy vô hạn, **cấm bịa %**.
**Tái hiện.** `/files` → bấm `Đọc lại` → quan sát.

---

## THỨ ĐI QUA ĐƯỢC — ghi lại để khỏi soi lại

- **Bền vững dữ liệu ✅** — tạo vật liệu *“A4 Đá Marble 473564”* trên `/materials` (2→3 mục) → **Đăng xuất** (về `/intro`, `/api/auth/me` trả `401 anonymous`) → **đăng nhập lại** → **vẫn còn 3 mục, vật liệu còn nguyên**. Ảnh `benvung-1…5`.
- **Cài đặt ngôn ngữ bền ✅** — chọn English rồi tải lại **và** sau đăng xuất/đăng nhập lại đều **giữ nguyên**.
- **Vòng focus ✅** — Tab qua `/files` `/tabs` `/materials` `/library` (129 chặng dừng): chỉ **1** phần tử không thấy vòng focus (một `<select>` trên `/files`). **Không** chặng nào nhảy ra ngoài tầm nhìn, **không** bẫy focus. Thứ tự Tab hợp lý (đỉnh → rail → nội dung).
- **Nút mờ trên `/files` đã tới được bằng bàn phím ✅** — 4/4 dùng `aria-disabled` (còn trong luồng Tab) + `aria-describedby` có nội dung thật. Đây là chỗ bài học cũ **đã được sửa đúng**. ⚠️ *Nhưng* nút *“Tải tệp lên”* có nút mô tả **ẩn khỏi mắt** (`NGƯỜI SÁNG MẮT THẤY = false`) → người dùng cảm ứng không có trình đọc màn hình vẫn không biết lý do; 3 nút lọc còn lại thì **hiện thành chữ nhìn thấy được**.
- **Không tràn ngang** ở 834px trên cả 5 màn đã đo.
- **Files hai tầng thấy được ✅** — TẦNG ① *Thư mục hệ thống* (5 thư mục theo QUYỀN) và TẦNG ② *Collection+* (theo LOẠI VẬT) là **hai khối tách bạch, có tiêu đề riêng**, không bị rút thành một bộ lọc. Neo **“Đến Collection+”** nhảy đúng (`scrollTop` 0 → 1216).
- **“Bảng màu” không đi qua `/colors`** — nó mở hộp thoại ngay trên `/materials`, nên lỗi `A4-01` **không** chạm luồng trong app.
- **`/library/ingest` có “Quay lại”** — nhưng đưa về `/` chứ không về `/library` (đã gộp vào ghi chú, không tách lỗi riêng vì trang này không bọc AppShell nên `/` là đích hợp lý thứ hai).

---

## CHƯA CHẮC / CHƯA ĐI ĐƯỢC

1. **Chưa dùng trình đọc màn hình thật.** Mọi kết luận trợ năng dựa trên cây DOM + `getComputedStyle` + Tab thật, **không** phải VoiceOver/NVDA.
2. **Chỉ Chromium 1194, chỉ headless.** Safari/Firefox là suy đoán. Ảnh hưởng trực tiếp `A4-06` (thanh cuộn phủ) và `A4-01` (`history.length`).
3. **`A4-01` cần kiểm tay trên Chrome có cửa sổ** — xem gõ URL ở tab mới có đẩy mục lịch sử không.
4. **`A4-12`**: chưa so hai ảnh để biết đổi avatar rồi bỏ đi có bị ghi không.
5. **Kéo–thả bằng ngón trên `/tasks` chưa thử.** Màn trống hứa *“đổi cột bằng nút trên thẻ hoặc kéo thả”*; tôi mới kiểm nhánh nút (và nhánh đó dính `A4-03`), **chưa** kiểm nhánh kéo thả, cũng **chưa** kiểm kéo–thả bằng bàn phím.
6. **Ô tìm kiếm: chưa kiểm gõ-tiếp.** Có ô tìm ở `/materials` (*“Tìm tên, mã, hãng…”*), `/tasks`, `/library/gallery`; **chưa** kiểm gợi ý gõ-tiếp và **chưa** kiểm phím mũi tên trên danh sách dài.
7. **`/settings` chưa đi hết Tab** — 87 điều khiển, tôi chỉ soi tĩnh.
8. **`/library/knowledge` gần như chưa đi** — chỉ biết nó trả 200 và nặng (~37 000 ký tự).
9. **`/library/ingest` chưa đi ca RỖNG** — cần một dự án, mà tài khoản mới chưa có.
10. **Chưa nạp tệp thật** — `Tải tệp lên` và `Nhập Excel/CSV` chưa chạy với tệp thật, nên nhánh nạp/hỏng/nạp-trùng chưa biết.
11. **Chưa kiểm cách ly giữa hai tài khoản** — chưa xác nhận vật liệu do `audit@` tạo có lộ sang tài khoản mới không. (Dấu hiệu gián tiếp: sau đăng xuất số mục tụt 3→2, nên phần do người dùng tạo **có vẻ** theo tài khoản — nhưng **chưa** kiểm trực tiếp bằng hai phiên.)
12. **Lỗi console lặp trên mọi màn, chưa truy nguyên**: React **#418** và **#423** (đều là lỗi hydration) trên tất cả các màn đã đi, cộng `Failed to fetch RSC payload for /projects` và `/library/gallery` → *“Falling back to browser navigation”*, và một `404` chưa xác định nguồn. Chưa rõ chúng có gây triệu chứng nhìn thấy được không.
13. **Số 74/97 điều khiển <44px ở `A4-08` là số máy đếm**, có gộp cả những thứ không phải đích chạm (nhãn có `tabindex`). Con số cần soi lại từng cái trước khi dùng làm chỉ tiêu.
