# IF · RUNTIME UI GAP MAP
`IF-UXUI-RUNTIME-001` · gói `IDF-IF-PACKET-003` · trạng thái **CANDIDATE** · lập 27/08/2026

---

## 0 · ⚠️ BẬC BẰNG CHỨNG — ĐỌC TRƯỚC MỌI DÒNG BÊN DƯỚI

> 🔴 **BẰNG CHỨNG Ở BẬC WEB DEV SERVER, KHÔNG PHẢI ELECTRON ĐÓNG GÓI.**
> Mọi ảnh trong `ux/anh/` chụp từ `npx next dev -p 3061` chạy **từ gốc repo**
> (`.env` thật ⇒ `prisma/dev.db` thật, cookie `if_session`), xem bằng Chromium (playwright
> 1.62.1) và Browser pane. **Không một pixel nào trong tệp này là ảnh cửa sổ Electron.**

**Ưu tiên A (Electron thật) đã THỬ và THẤT BẠI vì hai chặn độc lập — khai đủ, không im lặng đổi bậc:**

| # | Chặn | Đo được ở đâu | Cần gì để mở |
|---|---|---|---|
| A-1 | `npx next build` **XONG** (exit 0, bảng route đủ) và `npx electron .` **mở được** (server con `next-server v14.2.35` chiếm `127.0.0.1:3777`, `/` trả 200). Nhưng **quyền chụp màn hình cho binary Electron bị TỪ CHỐI**: `request_access(["com.github.Electron"])` trả `denied: user_denied`. Chỉ app **đóng gói** `com.ttt.interiorflow` (bản 22/08, **KHÔNG phải HEAD**) được cấp — dùng nó là nghiệm thu trên bản dựng cũ, đúng thứ `IF-CURRENT-STATE` cấm | kết quả `request_access` trong phiên | Hoà cấp quyền điều khiển cho **Electron chạy từ mã nguồn**, hoặc tự chạy `node scripts/chup-man-duyet-mat.mjs` |
| A-2 | Trong lúc phiên đang chạy, **`.next` bị một tiến trình khác ghi đè**: `BUILD_ID` biến mất, `.next/server/app/` chỉ còn `api`, và `.next/static/development/` xuất hiện lúc 11:04–11:06. `next start` từ đó trả **500 cho mọi route** | `next-start.log` (`Cannot find module '.next/server/app/page.js'`) · `ls .next/server/app` | một người ghi tại một thời điểm (luật 2 của `CLAUDE.md`) |

**Đăng nhập: KHÔNG mở được. Mọi bề mặt sau đăng nhập là `NOT ASSESSED`.**
Hai đường đều đóng, khai chính xác:
1. **Ký cookie phiên** như chỉ thị (`HS256`, `{sub:<userId>}`, `AUTH_SECRET` của `.env`) — script đã viết
   nhưng **bị bộ phân loại quyền của Claude Code chặn 3 lần** (`Blocked by classifier`). Đây là hàng
   rào bảo mật của chính máy, **tôi không lách**.
2. **Đăng ký/đăng nhập bằng cửa thật** — cần mật khẩu của một trong 10 user trong `prisma/dev.db`
   (`hoa@ttt.vn`, `integrator@ttt.vn`, …). Tôi **không có** mật khẩu, và `POST /api/auth/register`
   là **GHI vào DB thật** ⇒ vi phạm mệnh lệnh chỉ-đọc.

> **Capture flow cần thiết (một lần, do Hoà chạy):**
> `IF_EMAIL='<email>' IF_PASSWORD='<mật khẩu>' node scripts/chup-man-duyet-mat.mjs --dang-nhap`
> (`scripts/chup-man-duyet-mat.mjs:13,39,161-163` — mật khẩu KHÔNG lên dòng lệnh nếu dùng biến môi trường).
> Đúng bằng mục ② "CHẶN NGƯỜI, không chặn việc" của `docs/control/IF-CURRENT-STATE.md`.

### 0.1 · Danh tính runtime của mọi ảnh
| | |
|---|---|
| Repo | `/Users/tranben/Downloads/interiorflow` |
| Nhánh | `checkpoint/2026-08-24-control-plane` |
| HEAD lúc **bắt đầu** | `16ead1c` · cây bẩn **582 tệp** |
| HEAD lúc **kết thúc** | `ebc19ec` · cây **sạch (0 tệp)** |
| Runtime | `npx next dev -p 3061` từ gốc repo · Next **14.2.35** · `.env` + `.env.local` |
| Cổng phụ | `127.0.0.1:3777` = server con của `npx electron .` (do tôi bật, **không phải** server đóng băng mà `IF-CURRENT-STATE` cảnh báo). Đã tắt cuối phiên |
| Phiên | **CHƯA ĐĂNG NHẬP** ở mọi ảnh |
| Viewport | `1440×900` (chính) · `1100×800` · `393×852` |

⚠️ **HEAD DI CHUYỂN GIỮA PHIÊN — khai theo M-05, không giấu.** Ba commit của một người ghi khác
(`2110828` 10:58 · `a10040c` 11:00 · `ebc19ec` 11:08) đã landing trong lúc tôi chụp, và **582 tệp
bẩn biến mất khỏi cây**. Đã kiểm ảnh hưởng:
`git diff --name-only 16ead1c..ebc19ec -- app components lib electron` = **0 tệp**.
⇒ Mã giao diện **không đổi** giữa hai mốc; ảnh hợp lệ cho HEAD. Nhưng **nội dung bẩn 582 tệp
(có `app/` và `components/`) đã bị bỏ khỏi cây**, nên ảnh phản ánh **mã đã commit**, không phải
bản làm dở. Ai cần bản làm dở phải hỏi người ghi kia.

### 0.2 · Hợp đồng thiết kế đã đối chiếu
| Nguồn | Trạng thái tìm thấy |
|---|---|
| `docs/mocks/CLAUDE-DESIGN-CURRENT.md` | **CÓ** (132 dòng) — con trỏ bản vẽ đang hiệu lực |
| `docs/design-authority/IF-FINAL-DESIGN-CONTRACT-CANDIDATE.md` | **CÓ** (314 dòng) — *Final Design Contract v0.9 Candidate*. Đây là "Final Design Contract" mà chỉ thị hỏi |
| `docs/SPEC-DESIGN-SYSTEM-IF.md` · `docs/design-authority/IF-UX-COMPLETE-SPEC-010.md` | **CÓ** — tham chiếu phụ |
| `vitals/01-TARGET-REJECT-STORYBOARD.md` · `vitals/02-STATE-CONTRACT.md` | **CÓ** — trục S1–S5 lấy từ đây |
| `docs/mocks/*.dc.html` | **ĐỌC LÀM HỢP ĐỒNG**, không dùng làm bằng chứng hiện trạng (đúng cấm) |

⚠️ Cả ba tệp hợp đồng đều mang nhãn **CANDIDATE, chưa APPROVED**. Mọi dòng "hợp đồng đòi" dưới đây
là **đòi hỏi của một bản ứng viên**, không phải luật đã duyệt mắt.

---

## 1 · BẢNG PHÁT HIỆN — RUNTIME UI GAP MAP

**hạng**: `P0` chặn dùng / sai dữ liệu / lộ thông tin · `P1` dùng được nhưng sai hợp đồng ·
`P2` đánh bóng · `DESIGN MISSING` runtime có mà hợp đồng chưa nói · `ALIGNED` · `NOT ASSESSED`.
**loại**: `OBSERVED` thấy trên runtime · `INFERENCE` suy từ mã · `PROPOSED` đề xuất của tôi.

| # | bề mặt | route | state | viewport | hạng | điều thấy | điều hợp đồng đòi | loại | ảnh |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Projects | `/projects` | KHÔNG CÓ QUYỀN (401) | 1440×900 | **P0** | Ô chính viết: *"Không tải được danh sách dự án — **Máy vẫn có mạng nhưng dịch vụ dự án không trả lời.**"* Nguyên nhân THẬT là 401 (10 lỗi 401 trong console). Câu này khai **sai nguyên nhân** cho người dùng. Neo: `components/ProjectSelect.tsx:1388` | Hợp đồng §11: *"permission denied/revoked: filter before load"* và *"error: what happened, why if known"*. `02-STATE-CONTRACT.md` §2.2: `dang-tai → khong-do-duoc` khi 401 — **cấm** đọc thành sự cố mạng | OBSERVED | `anh/04-projects-1440x900.png` |
| 2 | Projects | `/projects` | TẢI HỎNG (server chết thật) | 1440×900 | **P0** | **Phép A/B quyết định:** tắt hẳn dev server rồi bấm "Thử lại" ⇒ **chữ y hệt, pixel y hệt** dòng 1. ⇒ *KHÔNG CÓ QUYỀN* và *TẢI HỎNG* dùng **chung một màn**. Trục S3≠S4 sập tại đây | Trục xương sống: 5 trạng thái phải **tách bạch**. `01-TARGET-REJECT-STORYBOARD.md` §2 bẫy 4: *"có chỗ nào `0` và 'không đo được' trông giống nhau?"* | OBSERVED | — *(quan sát trực tiếp trên Browser pane; không lưu được PNG vì server phải chết sau khi trang đã tải)* |
| 3 | Vitals (thanh trên) | mọi route có vỏ | KHÔNG CÓ QUYỀN (401) | 1440×900 | **P0** | Nút Vitals khai `aria-label = "Vitals — **không có tín hiệu**"` trong khi **mọi** nguồn đều 401. Neo: `components/studio/VitalsAperture.tsx:389` — nhãn rơi về `'không có tín hiệu'` cho **mọi** trạng thái không phải `answering`/`alert` | **F-02 nguyên văn** (`02-FAILURE-LEDGER.md`, `FAIL, open`): *"`calm` không phải sự im lặng, nó là khẳng định 'đã kiểm, không có gì cần chú ý'"*. `IF-CANONICAL` §11: *"401 ⇒ **không bao giờ** ánh xạ thành calm"* | OBSERVED | `anh/04-projects-1440x900.png` (nút ở góc trên giữa) |
| 4 | Vitals | `/projects` | KHÔNG CÓ QUYỀN | 1440×900 | **P0** | Bấm nút Vitals ⇒ **không có gì xảy ra** (chờ 3 s, không khẩu độ, không panel, không tooltip). Đây đúng lời khai ở `VitalsAperture.tsx:20-28` (*"`VitalsGesture` mồ côi… bấm vào không ra gì"*) — nay **đã đo trên runtime**, không còn là lời khai | Hợp đồng §10: *"No silent click"* · §7: L1 → L2 Speech Capsule → L3 | OBSERVED | — *(hành vi, không có delta hình)* |
| 5 | Vật liệu | `/materials` | KHÔNG CÓ QUYỀN | 1440×900 | **P0** | Banner đỏ in **`HTTP 401`** — mã giao thức thô lên mặt người dùng. **Cùng lúc** bảng bên dưới nói *"Không có vật liệu nào khớp."* ⇒ hai trạng thái mâu thuẫn (S3 + S1) cùng một màn. Neo: `components/materials/MaterialFormModal.tsx:118` họ `HTTP ${res.status}` | §11: *"error: what happened, why if known, next action; never fake success"*. `khong-do-duoc` **cấm** ánh xạ sang `khong-co-du-lieu` | OBSERVED | `anh/11-materials-1440x900.png` |
| 6 | Bảng việc | `/tasks` | KHÔNG CÓ QUYỀN | 1440×900 | **P0** | Banner **`HTTP 401`** + *"Chưa có dự án nào để giao việc"* + nút chính *"Tạo dự án đầu tiên"* + **3 hàng skeleton đứng yên vĩnh viễn**. ⇒ 401 được kể như "kho rỗng", và skeleton là **tiến độ giả**. Neo: `components/tasks/TaskBoardScreen.tsx:157` | `IF-CANONICAL` §3 luật 5 *"không tiến độ giả"*; S1 (`khong-co-du-lieu`) ≠ S3 (`khong-do-duoc`) | OBSERVED | `anh/13-tasks-1440x900.png` |
| 7 | Thư viện · Màu | `/library` · `/colors` | ĐANG TẢI → trắng | 1440×900 | **P0** | Mở **thẳng** (bookmark / deep-link) hai route này ⇒ **TRANG TRẮNG TINH, giữ nguyên 12 giây, không chữ, không nút, không đường về**. Nguyên nhân trong mã: cả hai `return null` rồi `router.back()` — bật NGƯỢC ra khỏi app khi `history.length > 1`. Neo: `app/colors/page.tsx:29-31` · `app/library/page.tsx:28-29` | `01-TARGET-REJECT-STORYBOARD` C-03 REJECT: *"canvas trắng không lý do"*; `ProjectScopeEmptyState.tsx:5-9` đã trả giá đúng lỗi này | OBSERVED | `anh/12-colors-1440x900.png` · `anh/05-library-1440x900.png` |
| 8 | WorkHub | `/workhub` | KHÔNG CÓ QUYỀN | 1440×900 | **P0** | Một **sản phẩm khác hẳn** mở ra, **không đăng nhập, không rail IF, không thanh trên IF**: "Trợ lý công việc · ChatGPT", hai cửa sổ nhúng `outlook.office.com` + `pinterest.com`. Chào **đích danh một người**: *"Chào **Hoa**…"* (`components/workhub/WorkHubShell.tsx:58`) và ngày **đóng băng** *"Thứ Hai, 17 tháng 8"* (`:232`) — hôm nay 27/08 | Hợp đồng §1.1 *"one global professional app, not a bundle of mini-apps"* · §1.7 *"no TTT/client hardcode"* · §1.8 *"real data only"* · M-34 *dữ liệu fixture không được định nghĩa giao diện sản xuất* · M-35 *route dev/demo không được ship tới được* | OBSERVED | `anh/14-workhub-1440x900.png` |
| 9 | Cài đặt | `/settings` | KHÔNG CÓ QUYỀN | 1440×900 | **P0** | Người **chưa đăng nhập** thấy đủ: thẻ **Hồ sơ** với tên *"Khách"*, **8 avatar bấm được**, "Nơi lưu file", và **hạn mức "Đã dùng 0 B / 10 GB"**. Con số 10 GB là **hằng số đóng cứng** `STORAGE_QUOTA_BYTES = 10 * 1024³` (`app/settings/_components/StorageCard.tsx:13`) — app local-first không có hạn mức nào như thế | §13 *"tenant/project isolation and least privilege apply **before fetch/render**"* · §11 *"permission denied: filter before load"* · bẫy 1 của storyboard: *"có con số nào bạn không chỉ được nguồn đo?"* | OBSERVED | `anh/09-settings-1440x900.png` |
| 10 | Vỏ / thoát hiểm | `/projects` | TẢI HỎNG | 1440×900 | **P0** | Nút **"Vào canvas trống"** — chính cái nút được viết ra để *"user không bao giờ kẹt"* (`components/ProjectSelect.tsx:124`) — bấm xong **18 giây sau vẫn y nguyên màn lỗi cũ**. Không điều hướng, không thông báo, không lỗi. Neo handler: `:1392` · `:1406` · `:2706` | §10 *"No silent click"* + *input states … visible unavailable **with reason**"* | OBSERVED | `anh/04-projects-1440x900.png` |
| 11 | Vỏ ứng dụng | mọi route | KHÔNG CÓ QUYỀN | 1440×900 | **P1** | Người chưa đăng nhập nhận **toàn bộ vỏ**: rail hai cụm, thanh trên, ô tìm "Tìm tên, ghi chú, dự án…", nút Vitals, và **tên ngữ cảnh "Chưa đặt tên"** cho một dự án không tồn tại. Chỉ có toast đáy nói đúng sự thật | §11 *"filter before load, no leaked thumbnail/team/activity"*; `lib/server/access.ts:31` đã đặt luật *404 thay 403 — không tiết lộ project có tồn tại* | OBSERVED | `anh/04-projects-1440x900.png` |
| 12 | Ingest | `/library/ingest` | KHÔNG CÓ QUYỀN | 1440×900 | **P1** | **Vỏ thứ hai**: nền đen, chữ vàng đồng, chip vàng, **không rail, không thanh trên, không Vitals**, tự có nút "Quay lại". Ba khối AI ("Đề xuất 3 kịch bản content", "Pick hình") bật sẵn cho người chưa đăng nhập | §3.1 *persistent chrome* dùng chung; M-26 *"cái gì đã gọi là dùng chung thì phải THẬT SỰ dùng chung"*, cấm đẻ khuôn thứ hai | OBSERVED | `anh/07-ingest-1440x900.png` |
| 13 | Rail · từ vựng | mọi route | mọi state | 1440×900 | **P1** | Cụm WORKSPACE runtime chỉ có **4 mục**: Trang chủ `/` · Dự án `/projects` · Cảm hứng `/library/gallery` · Thư viện `/library` (`components/nav/muc-dieu-huong.ts:211,229,246,255`). **KHÔNG có Tri thức / Knowledge** | Hợp đồng §2: *"WORKSPACE vocabulary currently includes Home, Projects, Inspiration, **Knowledge** and Library"* · `DA-RESOURCE-027.1`: một ô **Nguồn & Tri thức / Resources** với ba chế độ nhìn thấy được | OBSERVED | `anh/04-projects-1440x900.png` |
| 14 | Rail · lệnh chết | mọi route | mọi state | 1440×900 | **P1** | Mục **"Tạo bằng AI"** nằm trong rail chính, luôn hiện, và lý do là *"Cửa tạo bằng AI đang dựng — **chưa nối**"* (`components/nav/RailDieuHuong.tsx:621`) | §1.3 *"no dead interaction"* · §10 *"hidden only by permission/security; visible unavailable **with reason**"* — "chưa dựng xong" không phải một lý do hợp lệ để chiếm chỗ trong bản đồ app | OBSERVED | `anh/04-projects-1440x900.png` |
| 15 | Rail · trợ năng | mọi route | KHÔNG CÓ QUYỀN | 1440×900 | **P1** | Ba nút chặng (Thiết kế 2D · 3D · Trình chiếu) đọc ra cây trợ năng là `button [ref_9] / [ref_10] / [ref_11]` — **không tên khả truy cập**. Lý do vô hiệu (*"Chưa mở dự án — chọn một dự án ở Trang chủ"*) chỉ tới được bằng hover/`title` | §12 *"visible focus, screen-reader labels/order"*, *"no hover-only critical path"* · **M-03**: lý do nằm trong `title` ⇒ *"câm trên cảm ứng, Tab bỏ qua nút `disabled`"* | OBSERVED | `anh/04-projects-1440x900.png` |
| 16 | Login | `/login` · `/` | KHÔNG CÓ QUYỀN | 1440×900 | **P1** | Một **thẻ auth kính giữa màn** trên nền nâu ambient: hai tab ĐĂNG NHẬP/ĐĂNG KÝ, 2 ô, checkbox, nút "Vào xưởng", ba nút SSO | `CLAUDE-DESIGN-CURRENT.md` §1 ghi thẳng bản `claude-login-home-ambient-final.html` **BỊ BÁC 22/08, verdict: "đọc như SaaS auth card"**, và có **3 phương án dựng lại A/B/C** đang chờ. Runtime đang là **đúng thứ đã bị bác** | OBSERVED | `anh/01-login-1440x900.png` |
| 17 | Login → Home | `/login` → `/` | chuyển cảnh | 1440×900 | **P1** | Login = nâu tối ambient. Home/Projects sau đó = **trắng-lavender sáng**. Hai thế giới, không có trường liên tục | Bản vẽ *LOGIN → HOME · liên tục ambient*; hợp đồng §1.3 *"interface lives in space"* | OBSERVED | `anh/01-login-1440x900.png` ↔ `anh/04-projects-1440x900.png` |
| 18 | Cold open | `/` (lần đầu) | ĐANG TẢI | 1440×900 | **P1** | Người mở app lần đầu bị giữ trong **intro kể chuyện 60 giây**: `SCENE_DURATIONS = [15000, 10000, 25000, 10000]` (`components/intro/IntroSequence.tsx:45`). Chỉ có chữ "SKIP →" mờ ở góc, và `skip()` **khoá 1 giây đầu** (`:79`) | `CLAUDE-DESIGN-CURRENT.md` §1 · bản `claude-cold-open.dc.html`: **320 ms tới lúc gõ được**, 6 trạng thái COLD→HOME_READY, *thay* `IntroSequence` | OBSERVED | `anh/03-intro-1440x900.png` |
| 19 | Gallery / Cảm hứng | `/library/gallery` | KHÔNG CÓ QUYỀN | 1440×900 | **P1** | 401 ⇒ *"**Không đọc được kho — kiểm tra kết nối rồi thử lại.**"* (`components/library/GalleryLienNganh.tsx:231`). **Lần thứ ba** một lỗi quyền được kể thành lỗi mạng. Đồng thời form *"Đề xuất nguồn mới"* + nút **"Thêm nguồn"** bật sẵn cho người chưa đăng nhập | §11 *permission denied ≠ error*; §10 *"visible unavailable with reason"* | OBSERVED | `anh/06-gallery-1440x900.png` |
| 20 | Thư viện · kệ | `/library` (qua vỏ) | KHÔNG CÓ QUYỀN | 1440×900 | **P1** | Sheet Thư viện mở đầy đủ **khi chưa đăng nhập**: kệ *"Cấu kiện (.idfc)"* khai **73**, mọi kệ khác khai **0**. 73 là **kho mầm đóng gói trong app** (`lib/idfc-seed/index.ts:4`), 0 là *"chưa đăng nhập nên không đọc được"*. Hai nghĩa khác hẳn nhau, **một cách hiện** | S1 (`khong-co-du-lieu`) ≠ S4 (`khong-quyen`); §4.3 *every item declares scope; owner; permission; provenance* | OBSERVED | `anh/05-library-1440x900.png` *(bản chụp qua vỏ, xem cột ghi chú dòng 7)* |
| 21 | Thư viện · bước Màu | `/colors` (qua vỏ) | KHÔNG CÓ DỮ LIỆU | 1440×900 | **P1** | Bước "Chọn theo màu" bày **lưới 10 ô ma in chữ "TRỐNG"** giữ nguyên kích thước, rồi bên dưới mới nói *"Chưa có bảng màu nào"* | **M-12**: *widget thiếu dữ liệu phải TỰ ẨN, ô co theo nội dung* · **M-10** *"vật tồn tại vì có chỗ trống"* | OBSERVED | — *(quan sát trên Browser pane; bản chụp đĩa của `/colors` là trang trắng, xem dòng 7)* |
| 22 | Toast phiên | mọi route | 401 **và** server chết | 1440×900 | **P1** | Toast đáy luôn nói *"**Phiên đăng nhập đã kết thúc** · bản vẽ của bạn vẫn được giữ nguyên tại máy."* — kể cả khi nguyên nhân là **server chết** chứ không phải phiên hết hạn | §11 *"stale/offline: last verified time and available local actions"*. Câu về *"bản vẽ giữ tại máy"* là **đúng và tốt** (local-first); cái sai là **nguyên nhân** | OBSERVED | `anh/04-projects-1440x900.png` |
| 23 | Adaptive Work Dock | mọi route | mọi state | 1440×900 | **P1** | **Không có** dock ngang ở đáy. Đáy trái chỉ có cụm ghim/thu-mở của rail | §3.1: *"Adaptive Work Dock: stable universal anchors; real running/recent tasks; current Stage package; one morphing dynamic control zone"* · §10 *Persistent Dock candidate: Select + Undo/Redo + true Recent/Running Tasks* | OBSERVED | `anh/04-projects-1440x900.png` |
| 24 | Share công khai | `/share/<token sai>` | KHÔNG CÓ QUYỀN | 1440×900 | **P1** | Một câu xám giữa màn trắng: *"Link không tồn tại hoặc đã tắt."* Không vỏ, không logo, không hành động kế tiếp, không đường về app | §11 *"missing source/license: stop display/use, retain provenance and **recovery/report path**"*. Việc **không tiết lộ token có tồn tại hay không** là **đúng** (`lib/server/access.ts:31`) | OBSERVED | `anh/18-share-token-sai-1440x900.png` |
| 25 | Login · tương phản | `/login` | KHÔNG CÓ QUYỀN | 1440×900 | **P2** | Nhãn "ĐĂNG KÝ", placeholder, "Ghi nhớ đăng nhập", "Quên mật khẩu?" đều là chữ mảnh, độ sáng thấp trên nền nâu; *"HOẶC TIẾP TỤC VỚI"* gần chìm. **Chưa đo số tương phản** | §12 *WCAG 2.2 AA … contrast* | OBSERVED (chưa đo số) | `anh/01-login-1440x900.png` |
| 26 | Login · 393px | `/login` | KHÔNG CÓ QUYỀN | 393×852 | **P2** | Bố cục giữ được, nhưng nút VI/EN dính sát mép trên-phải và nút ảnh nền dính mép dưới-phải; card chiếm gần trọn bề ngang | §12 *tablet/portrait, touch targets* | OBSERVED | `anh/23-login-393x852.png` |
| 27 | Files | `/files` | KHÔNG CÓ QUYỀN | 1440×900 | **DESIGN MISSING** | Runtime có một màn *"Thư mục hệ thống"* với 5 thẻ (Dự án · Studio dùng chung · Nhà cung cấp · Đã duyệt · Lưu trữ), mỗi thẻ mang nhãn trạng thái *"đã nối kho"/"chưa nối kho"* và nhãn quyền *"Theo dự án / Toàn studio / Biên tập giới hạn / Chỉ đọc / Quản trị viên*". Bên dưới: hộp viền đỏ *"Không tải được danh sách flow"* | **Không có `.dc.html` nào cho màn này.** `CLAUDE-DESIGN-CURRENT.md` ghi thẳng *"`/files` mồ côi — rail là lối vào duy nhất, mà danh sách chốt 23/08 không có Files"* (mục 6 "Chờ CON NGƯỜI quyết") | OBSERVED | `anh/08-files-1440x900.png` |
| 28 | WorkHub | `/workhub` | — | 1440×900 | **DESIGN MISSING** | Xem dòng 8. Toàn bộ bề mặt này **không xuất hiện** trong `CLAUDE-DESIGN-CURRENT.md`, không có `.dc.html`, không có trong Final Design Contract | Hợp đồng chưa nói gì ⇒ MAIN + Hoà phải quyết: **giữ, giấu, hay gỡ** | OBSERVED | `anh/14-workhub-1440x900.png` |
| 29 | Ingest · khối AI | `/library/ingest` | — | 1440×900 | **DESIGN MISSING** | "AI · CHIẾN LƯỢC CONTENT" và "HÌNH MINH HOẠ · THÁC NGUỒN" là hai cỗ máy AI có mặt trên runtime | `CLAUDE-DESIGN-CURRENT.md` §2 liệt kê D5 (Present Template Browser) và D8 (Visual Pipeline) là DESIGN REQUIRED — **không có mục nào cho Ingest AI** | OBSERVED | `anh/07-ingest-1440x900.png` |
| 30 | Cửa API | `/api/*` | KHÔNG CÓ QUYỀN | — | **ALIGNED** | 7/7 endpoint thử (`library` `flows` `projects` `assets` `idfc` `library/items` `home/notes`) đều trả **401** với thân `{"error":"unauthorized"}`. Lưới đỡ `middleware.ts` + `getSessionUser()` đứng vững | §13 *least privilege before fetch*. **Máy chủ đúng — cái sai nằm ở cách giao diện KỂ LẠI cái 401 đó** (dòng 1,3,5,6,19) | OBSERVED | — |
| 31 | Vỏ · phân biệt lý do đứt phiên | mọi route | 503 ↔ mạng ↔ 401 | — | **ALIGNED (mã) / PARTIAL (mắt)** | `components/home/HomeScreen.tsx:365-395` **đã** tách ba ca: `503` ⇒ `authOffline` (*"KHÁC 'chưa đăng nhập', không được đá về login"*), `catch` mạng ⇒ `authOffline`, `reason !== 'anonymous'` ⇒ câu giải thích riêng | Đây là **đúng** thứ hợp đồng §11 đòi. Nhưng sự phân biệt đó **chết ở tầng dưới**: `ProjectSelect` vẫn in một câu duy nhất cho mọi ca (dòng 1–2) ⇒ **M-03 "có trong mã ≠ tới được người dùng"** | INFERENCE + OBSERVED | — |
| 32 | Rail · nấc 52px | mọi route | — | 1440×900 | **NOT ASSESSED** | `components/nav/muc-dieu-huong.ts:133` khai `BE_RONG_NAC = { dinhVi: 52, dieuHuong: 240, duyet: 320 }`, và runtime có hai nút "Thu gọn — Định vị" / "Mở rộng — Duyệt". Tôi **không đo được** bề rộng thật ở nấc thu gọn (server đã tắt trước khi đo) | `IF-CANONICAL` §10 `[CHỐT]` 52px · Hợp đồng §2 *"compact 52px icon-only state"* | INFERENCE | — |
| 33 | Home có dữ liệu | `/` | CÓ DỮ LIỆU | — | **NOT ASSESSED** | Chặn: **không đăng nhập được** (xem §0). 25 `Project` + 52 `Flow` trong `prisma/dev.db` chưa bao giờ lên màn | §5 Factory/Starter ↔ Personalized/My Home; §5.3 Project Reel L1→L2 Lens→L3 | — | — |
| 34 | Project Lens / Overview | `/projects/[id]/overview` | mọi | — | **NOT ASSESSED** | Chặn: đăng nhập. Route đòi `[id]` thật + quyền | §5.3 `DA-REEL-018.3a` fan-deck ngang, vertical slices là fallback | — | — |
| 35 | 2D | `/projects/[id]/cad` | mọi | — | **NOT ASSESSED** | Chặn: đăng nhập. `/cad-editor` (route cũ) chỉ **đá về `/`** rồi ra màn đăng nhập | §6.1 canvas-centered, Context Dock, deterministic measurement | OBSERVED (chỉ phần đá về) | `anh/15-cad-editor-1440x900.png` |
| 36 | Visual + 3D | `/projects/[id]/render` | mọi | — | **NOT ASSESSED** | Chặn: đăng nhập | §6.2 Deep Focus giữ selection/units/save/Undo/Escape | — | — |
| 37 | Present | `/projects/[id]/present` | mọi | — | **NOT ASSESSED** | Chặn: đăng nhập. `/present-editor` chỉ đá về `/` | §6.3 Present Hybrid + PDF/PPTX/HTML/video declaration | OBSERVED (chỉ phần đá về) | `anh/16-present-editor-1440x900.png` |
| 38 | AI / Context Studio | — | mọi | — | **NOT ASSESSED** | Chặn: đăng nhập. Không tìm được lối vào Context Studio ở trạng thái chưa đăng nhập | §3.1 hidden by default, dock/pin/move/resize/collapse/remember | — | — |
| 39 | asset / image / material / document | `/library` các kệ | CÓ DỮ LIỆU | — | **NOT ASSESSED** | Chặn: đăng nhập. Chỉ thấy được kho mầm 73 món và các kệ 0 (dòng 20) | §4.3 scope · owner · permission · provenance · freshness · where-used | — | — |
| 40 | Profile thật | `/settings` · `/settings/avatar` | ĐÃ ĐĂNG NHẬP | — | **NOT ASSESSED** | Chỉ thấy được biến thể "Khách" (dòng 9) | §8 *Personnel Profile is permission-filtered L2; avatar never implies permission* | — | — |
| 41 | Offline thật (mất mạng OS) | mọi | OFFLINE | — | **NOT ASSESSED** | Tôi mô phỏng được **server chết** (dòng 2) nhưng **không** mô phỏng được *mất mạng ở tầng hệ điều hành khi đã có dữ liệu trong tay* — cần phiên đăng nhập | §11 *"stale/offline: last verified time and available local actions"* | — | — |
| 42 | Electron đóng gói | — | mọi | — | **NOT ASSESSED** | Xem §0, chặn A-1 + A-2 | §16 *"screenshots/video from real Electron/runtime at target displays and input modes"* | — | — |
| 43 | Present export / golden files | — | — | — | **NOT ASSESSED** | Chặn: đăng nhập + không được ghi tệp | §16 *golden exports for PDF/PPTX/HTML/video* | — | — |

### Đếm
| hạng | số dòng |
|---|---|
| **P0** | **10** (1 · 2 · 3 · 4 · 5 · 6 · 7 · 8 · 9 · 10) |
| **P1** | **14** (11 → 24) |
| **P2** | **2** (25 · 26) |
| **DESIGN MISSING** | **3** (27 · 28 · 29) |
| **ALIGNED** | **2** (30 · 31 — trong đó 31 là ALIGNED ở mã, PARTIAL ở mắt) |
| **NOT ASSESSED** | **12** (32 → 43) |

---

## 2 · MÂU THUẪN GIỮA RUNTIME VÀ HỢP ĐỒNG — GHI CẢ HAI, KHÔNG TỰ HOÀ GIẢI

> Ba chỗ dưới đây **hợp đồng nói một đằng, runtime làm một nẻo**, và tôi **không có thẩm quyền**
> chọn bên. Việc của MAIN + Hoà.

**M-1 · Login.** Hợp đồng (`CLAUDE-DESIGN-CURRENT.md` §1) ghi bản ambient-final **BỊ BÁC 22/08**
với verdict *"đọc như SaaS auth card"*, và đã có ba phương án dựng lại A/B/C **đang chờ Hoà duyệt mắt**.
Runtime đang chạy **chính cái card đã bị bác**. ⇒ Hoặc verdict chưa được thi hành, hoặc bản A/B/C
chưa được chọn. Cả hai đều là **quyết định của người**, không phải việc mã.

**M-2 · Cold open.** Hợp đồng: **320 ms tới lúc gõ được**. Runtime: **60 000 ms**
(`IntroSequence.tsx:45`). Chênh lệch **×187**. Bản `claude-cold-open.dc.html` mang nhãn
*APPROVED TARGET CANDIDATE — chờ Hoà duyệt mắt* ⇒ **chưa được phép thi công**. Nhưng để nguyên 60 giây
cũng không phải trạng thái trung lập — nó là trải nghiệm đầu tiên của mọi người dùng mới.

**M-3 · Resources.** `DA-RESOURCE-027.1` đòi **một ô "Nguồn & Tri thức / Resources"** với ba chế độ
nhìn thấy được (Inspiration · Knowledge · Library). Runtime có **hai** mục rời (Cảm hứng ·
Thư viện) và **không có Knowledge**. Cùng lúc, `docs/design-authority/...` §14 mục 1 ghi rõ đây
**vẫn là câu hỏi chưa quyết của Hoà** (*"Approve Resource umbrella … or choose 3 top-level / 2-route model"*).
⇒ Runtime hiện tại **không khớp bản ứng viên**, nhưng bản ứng viên **cũng chưa được duyệt**.
Cấm dựng theo bên nào cho tới khi Hoà chốt.

---

## 3 · IMPLEMENTATION ORDER — 6 LAYER, KHÔNG ĐẢO

> 🟠 **LƯỢT 2 ĐÃ THAY MỤC NÀY BẰNG §3B Ở CUỐI TỆP.** Giữ nguyên bản dưới đây làm dấu vết lượt 1; bản thi hành là **§3B**.

> Mỗi layer: **P0 phải đóng trước** + **một câu nghiệm thu bằng mắt**.
> Không layer nào được bắt đầu khi layer trước còn P0 mở.

### ① Shell + navigation + trạng thái runtime
**P0 phải xong:** #1 · #2 · #3 · #5 · #6 (một máy trạng thái duy nhất cho 401 ↔ 5xx ↔ mạng đứt ↔
rỗng ↔ bằng không; **gỡ mọi chuỗi `HTTP ${status}` khỏi mặt người dùng**) · #7 (deep-link
`/library` `/colors` không bao giờ được rơi ra trang trắng) · #10 (nút thoát hiểm phải đi tới đâu đó) ·
#11 (lọc quyền **trước** khi render vỏ).
👁 **Nghiệm thu bằng mắt:** *Mở app ở bốn tình huống — chưa đăng nhập · phiên hết hạn · server tắt ·
mạng rút dây — và nhìn thấy **bốn màn khác nhau**, mỗi màn nói đúng nguyên nhân của nó, không màn nào
in mã HTTP, không màn nào trắng.*

### ② Home + Projects
**P0 phải xong:** #9 (Cài đặt/hồ sơ không được render cho người chưa đăng nhập; **gỡ hằng số 10 GB**).
Rồi mới tới Home hai trạng thái (§5) và Project Reel (§5.3) — **cả hai đang `NOT ASSESSED`, phải có
ảnh sau đăng nhập trước khi chấm**.
👁 **Nghiệm thu bằng mắt:** *Một tài khoản có 25 dự án và một tài khoản trắng mở cùng một Home; thấy
**cùng một hệ**, khác nhau ở nội dung chứ không ở bố cục, và màn trắng **không** bày một con số 0 nào.*

### ③ Resources (Cảm hứng · Tri thức · Thư viện)
**P0 phải xong:** #7 (đã đóng ở ①) · #19 · #20 (kho mầm 73 phải phân biệt được với "chưa đọc được").
**Chặn người:** M-3 ở §2 — **không dựng ô Resources khi Hoà chưa chốt** §14 mục 1.
👁 **Nghiệm thu bằng mắt:** *Trên một màn Thư viện, chỉ được ngón tay vào từng con số và nói ngay
nó **đến từ đâu**; kệ nào chưa đọc được thì **không mang số nào**.*

### ④ 2D + Visual/3D
**P0 phải xong:** không P0 nào của layer này **đã đo được** — toàn bộ đang `NOT ASSESSED` (#35 · #36).
⇒ **Việc đầu tiên của layer này là lấy được ảnh runtime**, không phải viết mã.
👁 **Nghiệm thu bằng mắt:** *Vào 2D rồi sang 3D của **cùng một dự án** mà không mất selection, không
mất đơn vị, không mất đường về — và cả hai chặng dùng **cùng một vỏ** với ①.*

### ⑤ Present + export
**P0 phải xong:** phụ thuộc ④. `NOT ASSESSED` (#37 · #43).
👁 **Nghiệm thu bằng mắt:** *Xuất một hồ sơ ra PDF và PPTX rồi mở bằng phần mềm của khách; thứ mở ra
**giống thứ trên màn**, và chỗ nào không giống thì app **đã nói trước** khi xuất.*

### ⑥ Vitals / AI — **chỉ sau visual gate**
**P0 phải xong:** #3 · #4 (Vitals đang **nói dối bằng chữ "không có tín hiệu"** và **bấm không ra gì**;
sửa hai cái đó là việc của ① vì nó nằm ở vỏ). Layer ⑥ là phần **hình thái và chuyển động** —
`Vitals 025` mang nhãn `STORYBOARD/ANIMATIC · DESIGN MISSING` và **chỉ Hoà mở được cổng mắt**.
👁 **Nghiệm thu bằng mắt:** *Chụp **khung tĩnh** của cả 8 trạng thái Vitals cạnh nhau; phân biệt được
đủ 8 mà không cần xem chuyển động và không cần đọc nhãn.*

---

## 4 · THẨM QUYỀN

Tệp này chốt **HIỆN TRẠNG ĐO ĐƯỢC**, không chốt hình thái, không chốt màu, không chốt bố cục.
Mọi dòng "hợp đồng đòi" là **trích bản CANDIDATE**, chưa APPROVED.

⛔ **Tôi không duyệt Vitals, không duyệt brand, không nâng bất kỳ CANDIDATE nào.**
Mắt cuối cùng là quyền của Hoà (`IF-CANONICAL` §2 · `01-TARGET-REJECT-STORYBOARD` §4).

Nhãn tổng của gói này: **`PARTIAL — runtime proof ở bậc web dev server, chưa đăng nhập`**.
⛔ **Cấm đọc bất kỳ dòng nào ở đây thành PASS.** 12 bề mặt `NOT ASSESSED` không phải là "đạt" —
chúng là **chưa nhìn**.

---

# 🟠 LƯỢT 2 — bổ sung 27/08/2026, phiên `IF-UXUI-RUNTIME-001 · L2`

> **Mọi dòng mang tiền tố `L2-` dưới đây là của LƯỢT 2.** Phần trên (dòng 1–43, §2, §3) là LƯỢT 1,
> **giữ nguyên, không sửa một chữ**. §3 của lượt 1 nay được **thay** bằng §3B ở cuối tệp.

## L2.0 · BẬC BẰNG CHỨNG CỦA LƯỢT 2 — ĐỌC TRƯỚC

| mục | giá trị đo được |
|---|---|
| Runtime | `next-server (v14.2.35)`, PID `31278`, nghe `*:3080` — **web dev server**, MAIN dựng sẵn, tôi **không** dựng lại |
| ⚠️ Bậc | **WEB DEV SERVER.** ⛔ **Không một pixel nào của lượt 2 là Electron đóng gói.** Bản `.app` cũ `com.ttt…` (22/08) **không được dùng** và **không được dùng** |
| HEAD | `6ce3db7` lúc bắt đầu **và** lúc kết thúc · cây bẩn **5 tệp** (MAIN đang ghi song song) |
| Phiên | **ĐÃ ĐĂNG NHẬP** — cookie `if_session` do MAIN đúc, `sub = cmr517o9d0000w9tmzcicsgni`, user `Hoà`, `isAdmin = true` |
| Viewport | `1440×900` |
| Cửa sổ đo được | ~**6 phút** (12:2x–12:3x). Sau đó **server kẹt cứng** — xem dòng `L2-01`, đây là phát hiện chứ không chỉ là sự cố |
| Dữ liệu thật | `prisma/dev.db` 38.5 MB · `Project` **25 hàng / 17 sống** · `User` **21** |

### 🔴 KHAI ĐỦ VỀ ẢNH — LƯỢT 2 KHÔNG THÊM ĐƯỢC MỘT TỆP PNG NÀO
`ux/anh/` vẫn đúng **23 ảnh của lượt 1**. Lý do chính xác, không giấu:

1. Đường lưu ảnh ra tệp là **Playwright** (`node_modules/playwright` 1.62.1). Chromium của Playwright
   **không mở nổi** `http://127.0.0.1:3080` — `net::ERR_ABORTED` sau 20 s, cả khi bỏ proxy
   (`--no-proxy-server --proxy-bypass-list=<-loopback>`) lẫn khi bỏ hộp cát. `curl` cùng lúc **200**.
   ⇒ chặn ở tầng công cụ, **chưa gỡ được trong phiên này**.
2. Đường còn lại là **Browser pane** — nó **mở được và hiển thị đúng** (tôi đã đọc cây trợ năng và
   văn bản trang từ đó), nhưng ảnh của nó **không ghi ra tệp** được.
3. Trước khi kịp tìm đường thứ ba, **server kẹt** (`L2-01`) và **mọi route ngừng trả lời vĩnh viễn**.

⇒ **Bằng chứng của lượt 2 là: cây trợ năng (accessibility tree) + văn bản trang đọc trực tiếp từ
runtime đã đăng nhập, + truy vấn CHỈ-ĐỌC vào `prisma/dev.db`, + `sample(1)` tiến trình server.**
Đây **KHÔNG** phải mock, **KHÔNG** phải canvas, **KHÔNG** phải đọc mã suông — nhưng nó **cũng không
phải ảnh**. Ai cần ảnh phải chạy lại sau khi MAIN dựng lại cổng 3080.

---

## L2.1 · BẢNG PHÁT HIỆN — LƯỢT 2

| # | bề mặt | route | state | viewport | hạng | điều thấy | điều hợp đồng đòi | loại | ảnh |
|---|---|---|---|---|---|---|---|---|---|
| L2-01 | Toàn app · lớp dữ liệu | mọi route | TẢI HỎNG → thoái hoá thành ĐANG TẢI **vĩnh viễn** | — | **P0** | Sau ~6 phút dùng bình thường, server **vẫn sống** (`/manifest.webmanifest` → **200**, tiến trình 31278 còn nghe cổng) nhưng **mọi route app và API treo vô hạn**: `/api/dashboard` `/api/health` `/login` `/thu-trang-thai` đều **không trả lời**, không lỗi, không timeout, không mã trạng thái (`curl` `%{http_code}` = `000` sau 6/8/15/20/25 s). `sample 31278` (37 luồng): main-thread **rảnh** ở `kevent`, còn **9 luồng `tokio-runtime-worker` của `libquery_engine-darwin-arm64.dylib.node` đứng chết cùng một stack** ⇒ pool truy vấn Prisma kẹt, không tự gỡ sau 15 phút. Neo: `lib/server/db.ts:5` — `new PrismaClient()` **trần**, không `connection_limit`, không `pool_timeout`, không `log`, không xử lý `P2024` | Trục xương sống: **TẢI HỎNG phải TỚI ĐƯỢC MẮT NGƯỜI DÙNG.** Ở đây nó không tới được — app không bao giờ đạt trạng thái lỗi, người dùng chỉ thấy con quay quay mãi. `IF-CANONICAL` §3 luật 5 *"không tiến độ giả"* — một trang tải mãi mãi **là** tiến độ giả ở mức hệ thống. Hợp đồng §11 đòi *"error: what happened, why if known, next action"* — không có gì trong ba thứ đó | OBSERVED | — |
| L2-02 | Rail · ba nút Chặng | mọi route | **ĐÃ ĐĂNG NHẬP · CÓ DỮ LIỆU** | 1440×900 | **P0** | Ba mục điều hướng chính của app render `href` thật là `/projects/cmrfb3apo00kmw9484m490qcn/cad` · `/render` · `/present`. **Id đó KHÔNG PHẢI một dự án.** Truy vấn chỉ-đọc `prisma/dev.db`: `select … from Project where id='cmrfb3apo…'` ⇒ **0 hàng**; `select … from Flow where id='cmrfb3apo…'` ⇒ **1 hàng**, tên **`Untitled flow`**, `projectId` **rỗng**. Cơ chế đúng trong mã: `components/nav/RailDieuHuong.tsx:270-281` gọi `/api/flows`, lấy `moiNhat` **từ `d.flows`**, rồi `setDuAnMayChu(moiNhat.id)` — **id của một FLOW gán vào biến DỰ ÁN**; `:300` `duAnHieuLuc = … ?? duAnMayChu`; rồi id đó bị ghép vào đường `/projects/<id>/…`. ⇒ **lẫn kiểu id ở tầng điều hướng**, ba lối vào chính của app trỏ vào một dự án **không tồn tại**, và người dùng chưa hề chọn gì | Hợp đồng §1.3 *"no dead interaction"* · §2 rail là **bản đồ app**, không phải chỗ đoán mò · `IF-CANONICAL` §3 luật 5 *"không dữ liệu giả"*. Chú thích ngay trên đầu khối này (`:255-263`) tự khai mục đích là *"không bịa đường vào"* — runtime cho thấy nó **đang bịa đúng thứ nó thề không bịa** | OBSERVED (href thật) + OBSERVED (DB) + INFERENCE (cơ chế) | — |
| L2-03 | Vitals (thanh trên) | `/` | **ĐÃ ĐĂNG NHẬP · CÓ DỮ LIỆU · MỌI THỨ LÀNH** | 1440×900 | **P0** | `aria-label` đọc ra **`"Vitals — không có tín hiệu"`** trong khi phiên hợp lệ và các API cùng cookie vừa trả **200** (`/api/dashboard` `/api/flows` `/api/library` `/api/home/notes`). ⇒ lượt 1 chứng minh nhãn này sai ở chiều **401**; **lượt 2 chứng minh nó sai cả ở chiều LÀNH MẠNH** — tức nhãn là **hằng số**, không phải trạng thái. Neo: `components/studio/VitalsAperture.tsx:385-389` (mọi thứ không phải `answering`/`alert` ⇒ `'không có tín hiệu'`) + `components/studio/vitals-tin-hieu.ts:198-202` (`trangThaiAmbient` chỉ có 3 giá trị, mặc định `idle`). **Nặng hơn:** cùng một phần tử, `:500` ghi `data-vitals-state="calm"` cho `idle` — **DOM nói "calm", trình đọc màn hình nói "không có tín hiệu"**. Hai sự thật trong một nút | **F-02 nguyên văn** (`02-FAILURE-LEDGER.md`, `FAIL, open`): *"`calm` không phải sự im lặng, nó là khẳng định 'đã kiểm, không có gì cần chú ý'"*. Hợp đồng §12 *"screen-reader labels"* — nhãn trợ năng phải **là** trạng thái, không được là mặc định | OBSERVED | — |
| L2-04 | Fixture kiểm thử rò lên bề mặt sản phẩm | `/` · `/api/dashboard` | **CÓ DỮ LIỆU** | 1440×900 | **P0** | `/api/dashboard` (200, phiên thật) trả **21 user** và **10 dự án**, trong đó: **6/10 dự án** mang tên `__proof_scope_1787760247602 thường` · `… có khách` · `… đã gỡ khách` (và bản `…238131` y hệt); chủ sở hữu là các user tên `__proof_scope_…_chu`, `__proof_scope_…_admin`, `__proof_scope_…_khach`; một dự án khác thuộc user `demo_seed_001` tên **`Demo Tour`**. Đối chiếu DB chỉ-đọc: **8/17 dự án còn sống (47%) là fixture `__proof_*`**, **9/21 user là fixture** (`__proof_*` hoặc `demo*`). Không một mục nào mang dấu hiệu "đây là dữ liệu kiểm thử" | **M-34** *dữ liệu fixture không được định nghĩa giao diện sản xuất* · §1.8 *"real data only"* · storyboard bẫy 1 *"có con số nào bạn không chỉ được nguồn đo?"* — con số "10 dự án" trên Dashboard **không chỉ được nguồn** vì quá nửa là rác kiểm thử | OBSERVED | — |
| L2-05 | Home · ngữ cảnh thanh trên | `/` | **ĐÃ ĐĂNG NHẬP** | 1440×900 | **P1** | Nút ngữ cảnh đọc ra `"Ngữ cảnh: **Chưa đặt tên**. Mở bộ chuyển ngữ cảnh."` — người đã đăng nhập, chưa mở dự án nào, mà thanh trên vẫn **bịa một cái tên** cho một dự án không có. Neo: `components/studio/DaiNguCanh.tsx:79` — `tenDuAn \|\| tr('Chưa đặt tên','Untitled')`. **Đây là hai-nguồn-sự-thật với `L2-02`**: cùng một khung hình, thanh trên nói *"Chưa đặt tên"* còn rail trỏ vào `cmrfb3apo…`. Hai bộ phận của **cùng một vỏ** trả lời khác nhau câu *"tôi đang ở đâu"* | Commit `66981c3` (25/08) tự khai đã *"bỏ tên bịa 'Untitled flow'"* — runtime cho thấy tên bịa **vẫn còn** ở `DaiNguCanh`, và `Untitled flow` **vẫn là tên thật trong DB** (xem `L2-02`). §3.1 *persistent chrome* phải có **một** nguồn ngữ cảnh | OBSERVED | — |
| L2-06 | Home có dữ liệu · lời chào lần đầu | `/` | **CÓ DỮ LIỆU** | 1440×900 | **P1** | Một **modal đè giữa màn** mở ngay trên Home của tài khoản đã có dữ liệu: *"InteriorFlow — từ bản vẽ tới hồ sơ trình khách."* + *"Vẽ mặt bằng → dựng ảnh phối cảnh → dàn deck thuyết trình…"* + nút chính **"Tạo dự án của tôi"** + "Bỏ qua". Nền sau modal **đã có** dải Dự án đang vẽ. ⇒ **trạng thái BẰNG KHÔNG (người mới) được bày cho một tài khoản CÓ DỮ LIỆU** — đúng cặp trục xương sống mà nhiệm vụ này đi tìm. Neo: `components/home/HomeScreen.tsx` (chuỗi *"Tạo dự án của tôi"*) · `components/entry/WelcomeIntro.tsx` | §5 *Factory/Starter ↔ Personalized/My Home* — **hai** trạng thái phải phân biệt được. `KHÔNG CÓ DỮ LIỆU ≠ BẰNG KHÔNG`: ở đây app chọn nhánh "người mới" mà **không hỏi dữ liệu** | OBSERVED | — |
| L2-07 | Home có dữ liệu · dải Dự án | `/` | **CÓ DỮ LIỆU** | 1440×900 | **P1** | Văn bản dải Dự án đọc được nguyên văn: `Dự án` · `Tất cả dự án` · `Chưa gắn dự án` · **`2/2`** · `Dự án mới` · `2` · `Bản nháp` · `Chưa gắn dự án`. Bộ lọc (`combobox`) chỉ có **2 lựa chọn**: *Tất cả dự án* và *Chưa gắn dự án*. DB cùng lúc: **17 dự án sống**. ⇒ Home của một tài khoản 17 dự án hiện ra như một tài khoản **2 mục**, và không có chỗ nào nói *"đang lọc"* hay *"còn 15 mục nữa"* | §5.3 *Project Reel L1→L2 Lens→L3*. `IF-CANONICAL` §3 luật 5 — con số `2/2` **khẳng định là toàn bộ**, và nó không phải toàn bộ | OBSERVED | — |
| L2-08 | Phạm vi · ai sở hữu cái gì | `/` · `/api/dashboard` | **CÓ DỮ LIỆU** | — | **P1** | Session user `Hoà` (`cmr517o9d…`) sở hữu **0 dự án** (DB: `select count(*) from Project where userId='cmr517o9d…'` ⇒ **0**). Mọi dự án hiện trên Home/Dashboard là **của người khác**: user `hoa` (`cmr8nuzzs…` — **một tài khoản khác, tên gần giống**), `demo_seed_001`, và các `__proof_scope_*`. Đường đi hợp lệ về mặt mã: `lib/server/access.ts:50` *"`u?.isAdmin` ⇒ coi như `owner`"*, và `app/api/dashboard/route.ts:29-33` — cờ `IF_PROJECT_SCOPE_ENFORCE` **không đặt trong `.env`** ⇒ `duAnWhere = { deletedAt: null }` = **mọi dự án của mọi người**. ⚠️ **GHI CẢ HAI VẾ, không tự hoà giải:** (a) **runtime đúng mã** — user này là admin, cửa hậu admin là thiết kế đã ghi; (b) **hợp đồng đòi** §13 *"tenant/project isolation and least privilege apply **before** fetch/render"* và §11 *"filter before load"*. Vế (a) không trả lời được câu của vế (b): *một màn "Chào Hoà" bày 17 dự án mà Hoà không sở hữu cái nào thì đang kể chuyện gì?* | §13 · §5 · M-34 | OBSERVED (DB + API) + INFERENCE (cơ chế) | — |
| L2-09 | Cold open | `/` (lần vào đầu) | **ĐÃ ĐĂNG NHẬP** | 1440×900 | **P1** | Lần mở đầu tiên của phiên, `http://127.0.0.1:3080` **tự chuyển sang `/intro`** (đọc `location.href` ngay sau khi tải: `http://127.0.0.1:3080/intro`). ⇒ lượt 1 đo intro 60 s ở chiều **chưa đăng nhập** (dòng 18); lượt 2 xác nhận **cổng intro vẫn đứng chắn ngay cả với phiên hợp lệ** | `claude-cold-open.dc.html`: **320 ms tới lúc gõ được**. Mâu thuẫn M-2 của lượt 1 **chưa được đóng**, và nay biết thêm nó **không né được bằng cách đăng nhập** | OBSERVED | — |
| L2-10 | Rail · lệnh chết (kiểm lại khi đã đăng nhập) | mọi route | **ĐÃ ĐĂNG NHẬP** | 1440×900 | **P1** | Mục **"Tạo bằng AI"** vẫn ở trong rail chính, vẫn kèm đúng câu *"Cửa tạo bằng AI đang dựng — chưa nối"*. ⇒ dòng 14 của lượt 1 **không phải hệ quả của việc chưa đăng nhập**; nó là hằng số | §1.3 *"no dead interaction"* | OBSERVED | — |
| L2-11 | Rail · nấc 52px | mọi route | ĐÃ ĐĂNG NHẬP | 1440×900 | **NOT ASSESSED** | Đọc được **hai nút** `"Thu gọn — Định vị"` và `"Mở rộng — Duyệt"` trên runtime đã đăng nhập (dòng 32 lượt 1 mới chỉ suy từ mã). Nhưng **chưa đo được bề rộng thật** ở nấc thu gọn: cần bấm nút rồi đo `getBoundingClientRect()` — server kẹt (`L2-01`) trước khi tôi bấm | `IF-CANONICAL` §10 `[CHỐT]` 52px · Hợp đồng §2 *"compact 52px icon-only state"* | INFERENCE (bề rộng) + OBSERVED (hai nút có thật) | — |
| L2-12 | Project Lens/Overview · 2D · Visual+3D · Present · AI Studio · asset/material/document · profile thật · offline có dữ liệu · export golden | 8 bề mặt | mọi | — | **NOT ASSESSED** | **Đường vào đã thông** (cookie chạy, `/api/dashboard` 200) nhưng **cửa sổ đo chỉ mở ~6 phút** rồi server kẹt cứng (`L2-01`). Không một bề mặt nào trong 8 cái này kịp mở. Xem bảng blocker §L2.4 | — | — | — |

### L2.2 · ĐẾM — LƯỢT 1 + LƯỢT 2 GỘP

| hạng | lượt 1 | lượt 2 | **TỔNG** | dòng của lượt 2 |
|---|---|---|---|---|
| **P0** | 10 | **4** | **14** | `L2-01` · `L2-02` · `L2-03` · `L2-04` |
| **P1** | 14 | **7** | **21** | `L2-05` → `L2-10`, và `L2-08` |
| **P2** | 2 | 0 | **2** | — |
| **DESIGN MISSING** | 3 | 0 | **3** | — |
| **ALIGNED** | 2 | **0** | **2** | ⚠️ lượt 2 **không nâng được** một dòng nào lên ALIGNED |
| **NOT ASSESSED** | 12 | — | **10** | 2 dòng đóng lại (Home có dữ liệu · nấc 52px một phần), 10 dòng còn mở — xem §L2.4 |

> ⚠️ **Không có dòng nào của lượt 1 được hạ hạng.** Lượt 2 chỉ **thêm** và **xác nhận**: dòng 3 (Vitals),
> dòng 14 (lệnh chết) và dòng 18 (cold open) của lượt 1 nay đã được đo **cả ở chiều đã-đăng-nhập,
> có-dữ-liệu, mọi-thứ-lành** — tức chúng **không phải** hệ quả của việc chưa đăng nhập.

### L2.3 · TRỤC XƯƠNG SỐNG — MÀN NÀO PHÂN BIỆT ĐÚNG, MÀN NÀO GỘP (đo ở chiều CÓ DỮ LIỆU)

`KHÔNG CÓ DỮ LIỆU ≠ ĐANG TẢI ≠ TẢI HỎNG ≠ KHÔNG CÓ QUYỀN ≠ BẰNG KHÔNG`

| bề mặt | phân biệt được? | gộp cái nào vào cái nào | bằng chứng |
|---|---|---|---|
| **Toàn app (lớp dữ liệu)** | ❌ **FAIL** | **TẢI HỎNG → ĐANG TẢI vĩnh viễn.** Hỏng không bao giờ trở thành một màn, nó ở lại làm con quay | `L2-01` |
| **Home** | ❌ **FAIL** | **CÓ DỮ LIỆU → BẰNG KHÔNG.** Modal "người mới" đè lên tài khoản 17 dự án | `L2-06` |
| **Home · dải Dự án** | ❌ **FAIL** | **CÓ DỮ LIỆU (17) → hiện như 2.** `2/2` khẳng định là toàn bộ | `L2-07` |
| **Vitals** | ❌ **FAIL** | **LÀNH MẠNH → KHÔNG CÓ TÍN HIỆU.** Và trong cùng một nút, DOM `calm` ≠ nhãn trợ năng | `L2-03` |
| **Rail · Chặng** | ❌ **FAIL** | **CHƯA CHỌN DỰ ÁN → ĐÃ CHỌN (một id không tồn tại).** Trạng thái "chưa có" bị kể thành "có" | `L2-02` |
| **Thanh ngữ cảnh** | ❌ **FAIL** | **CHƯA CÓ TÊN → "Chưa đặt tên"** (một cái tên) | `L2-05` |
| **Cửa API (`/api/*`)** | ✅ **PASS ở tầng máy chủ** | 200 khi có quyền, 401 khi không, 404 khi không tồn tại — lưới đỡ đứng vững (xác nhận lại dòng 30 lượt 1). **Cái sai vẫn nằm ở tầng kể lại** | `/api/dashboard` 200 · `/api/projects` 404 · `/api/tasks` 400 |

⇒ **7 bề mặt đo được ở chiều có dữ liệu, 6 gộp trạng thái, 1 đạt.** Trục xương sống **không** hỏng
riêng ở nhánh 401 như lượt 1 tưởng — **nó hỏng đối xứng ở cả nhánh thành công.**

### L2.4 · CÒN `NOT ASSESSED` — BLOCKER CHÍNH XÁC TỪNG DÒNG

| # | bề mặt | blocker chính xác | gỡ bằng cách nào |
|---|---|---|---|
| N-1 | Project Lens / Overview (`/projects/[id]/overview`) | **Server 3080 kẹt pool Prisma** (`L2-01`) trước khi mở được route. Cookie và quyền **đã thông** — đây thuần là blocker hạ tầng | MAIN dựng lại cổng 3080; dùng lại đúng cookie; mở `/projects/cmt10d9lg0016w9rbvnkt9xh3/overview` (dự án thật, 1 flow) |
| N-2 | 2D (`/projects/[id]/cad`) | như N-1 | như N-1 |
| N-3 | Visual + 3D (`/projects/[id]/render`) | như N-1 | như N-1 |
| N-4 | Present (`/projects/[id]/present`) | như N-1 | như N-1 |
| N-5 | AI / Context Studio | như N-1 + **chưa tìm được lối vào**: cây trợ năng của vỏ đã-đăng-nhập ở `/` **không có** mục nào tên Context Studio | như N-1, và cần MAIN chỉ đúng route/cử chỉ mở nó — nếu không có thì đây là `DESIGN MISSING`, không phải `NOT ASSESSED` |
| N-6 | asset / material / document (kệ có dữ liệu) | như N-1. `/api/library` đã trả **200** ⇒ dữ liệu tới được, chỉ chưa lên màn | như N-1; mở `/library` rồi từng kệ, đối chiếu số trên kệ với `select count(*) from LibraryAsset` |
| N-7 | Profile thật (`/settings` đã đăng nhập) | như N-1 | như N-1; kiểm riêng hằng số `STORAGE_QUOTA_BYTES` (`app/settings/_components/StorageCard.tsx:13`) ở phiên thật |
| N-8 | Offline có dữ liệu (mất mạng OS **sau khi** đã tải xong) | như N-1. Kịch bản đòi: tải xong trang có dữ liệu → chặn mạng → xem app nói gì | như N-1; chặn bằng ghi đè `window.fetch` cho đúng route, **sau khi** trang đã có dữ liệu trên tay |
| N-9 | Export golden (PDF/PPTX/HTML/video) | như N-1 **và** lượt này **CẤM ghi tệp ngoài `ux/`** ⇒ không được sinh tệp golden | cần MAIN mở một thư mục đích và dựng lại server |
| N-10 | Nấc rail 52px (bề rộng thật) | Hai nút *Thu gọn — Định vị* / *Mở rộng — Duyệt* **có thật** trên runtime (`L2-11`), nhưng server kẹt trước khi bấm và đo | như N-1; bấm "Thu gọn — Định vị" rồi đọc `getBoundingClientRect().width` của rail, đối chiếu `BE_RONG_NAC.dinhVi = 52` (`components/nav/muc-dieu-huong.ts:133`) |
| N-11 | **Electron đóng gói** | ⛔ **Vẫn `NOT ASSESSED`, và lượt 2 không thử.** Bậc bằng chứng của cả tệp này là **web dev server**. Bản `.app` cũ `com.ttt…` (22/08) **không phải HEAD** ⇒ **cấm dùng** | Hoà cấp quyền điều khiển cho Electron chạy **từ mã nguồn tại HEAD**; hoặc MAIN đóng gói lại từ HEAD |
| N-12 | Ảnh PNG cho **mọi** dòng `L2-*` | Playwright-Chromium `net::ERR_ABORTED` với `127.0.0.1:3080` (xem §L2.0); Browser pane hiển thị được nhưng không ghi ra tệp | dựng lại server rồi thử `channel:'chrome'` thay Chromium bundled, hoặc chạy `scripts/chup-man-duyet-mat.mjs` mà `IF-TOOLING-RECEIPT` đã ghi nhận |

---

## L2.5 · MÂU THUẪN MỚI GIỮA RUNTIME VÀ HỢP ĐỒNG — GHI CẢ HAI VẾ

**M-4 · Cửa hậu admin ↔ "isolation before render".**
Runtime: `Hoà` là `isAdmin` ⇒ `lib/server/access.ts:50` trả `'owner'` cho **mọi** dự án, và
`app/api/dashboard/route.ts:29-33` không bật `IF_PROJECT_SCOPE_ENFORCE` ⇒ Home bày 17 dự án của
người khác dưới dòng chào *"Chào Hoà"*. Hợp đồng §13 đòi *isolation và least privilege **trước**
fetch/render*. **Mã đang đúng với chính chú thích của nó** (chú thích ở `route.ts:9-18` đã tự khai
định vị cũ *"app nội bộ team (LAN)"* **đã hết đúng**). ⇒ Đây là **một quyết định của người**:
bật cờ phạm vi, hay định nghĩa lại admin. Tôi **không** chọn bên.

**M-5 · Fixture sống chung bảng với dữ liệu thật.**
Runtime: 8/17 dự án sống và 9/21 user là `__proof_*`/`demo*`. Không hợp đồng nào cho phép, và cũng
**không hợp đồng nào cấm bằng chữ**. M-34 chỉ cấm *fixture định nghĩa giao diện* — ở đây fixture
đang **định nghĩa nội dung**. ⇒ Cần một luật mới, hoặc một cửa lọc. **Quyết định của người.**

---

## 3B · IMPLEMENTATION ORDER — BẢN LƯỢT 2 (**thay §3**), 6 LAYER, KHÔNG ĐẢO

> Thứ tự **cố định**: ① Shell + navigation/runtime states → ② Home + Projects → ③ Resources →
> ④ 2D/Visual+3D → ⑤ Present + export → ⑥ Vitals/AI (chỉ sau visual gate).
> Không layer nào được bắt đầu khi layer trước còn P0 mở.

### ① Shell + navigation + trạng thái runtime
**P0 chặn:** `L2-01` (một route treo vĩnh viễn = app không bao giờ đạt trạng thái lỗi; phải có
`pool_timeout`/`connection_limit` ở `lib/server/db.ts:5` **và** một màn hỏng ở tầng vỏ) ·
`L2-02` (rail trỏ id **flow** vào đường **project** — sửa `RailDieuHuong.tsx:270-281`) ·
`L2-05` (một nguồn ngữ cảnh duy nhất) · và của lượt 1: #1 · #2 · #3 · #5 · #6 · #7 · #10 · #11.
👁 **Nghiệm thu bằng mắt:** *Mở app ở **năm** tình huống — có dữ liệu · kho rỗng · đang tải · server
kẹt · hết quyền — và thấy **năm màn khác nhau**; không màn nào in mã HTTP, không màn nào trắng, và
**không màn nào quay mãi**.*

### ② Home + Projects
**P0 chặn:** `L2-04` (gỡ fixture `__proof_*`/`demo_seed_001` khỏi mọi bề mặt sản phẩm) · `L2-06`
(modal người-mới không được mở trên tài khoản có dữ liệu) · `L2-07` (`2/2` phải là con số thật của
17) · `L2-08` (chốt M-4 trước khi dựng) · và #9 của lượt 1.
👁 **Nghiệm thu bằng mắt:** *Hai tài khoản — một có 17 dự án, một trắng — mở cùng một Home; thấy
**cùng một hệ**, khác ở nội dung chứ không ở bố cục; màn trắng **không** bày con số 0 nào, và màn
có dữ liệu **không** bày lời chào người mới.*

### ③ Resources (Cảm hứng · Tri thức · Thư viện)
**P0 chặn:** #7 (đã đóng ở ①) · #19 · #20. **Chặn người:** M-3 — không dựng ô Resources khi Hoà
chưa chốt.
👁 **Nghiệm thu bằng mắt:** *Chỉ ngón tay vào từng con số trên kệ và nói ngay **nó đến từ đâu**;
kệ nào chưa đọc được thì **không mang số nào**.*

### ④ 2D + Visual/3D
**P0 chặn:** chưa biết — **N-2 · N-3 vẫn `NOT ASSESSED`**, và blocker nay **chỉ còn là hạ tầng**
(server), không còn là đăng nhập. ⇒ **Việc đầu tiên của layer này vẫn là lấy được ảnh runtime.**
👁 **Nghiệm thu bằng mắt:** *Vào 2D rồi sang 3D của **cùng một dự án** mà không mất selection,
không mất đơn vị, không mất đường về — và cả hai chặng dùng **cùng một vỏ** với ①.*

### ⑤ Present + export
**P0 chặn:** phụ thuộc ④. **N-4 · N-9** `NOT ASSESSED`.
👁 **Nghiệm thu bằng mắt:** *Xuất một hồ sơ ra PDF và PPTX rồi mở bằng phần mềm của khách; thứ mở ra
**giống thứ trên màn**, và chỗ nào không giống thì app **đã nói trước** khi xuất.*

### ⑥ Vitals / AI — **chỉ sau visual gate**
**P0 chặn:** `L2-03` (nhãn là hằng số, và DOM `calm` cãi nhãn trợ năng) · #3 · #4 của lượt 1.
Ba cái đó nằm ở **vỏ** ⇒ phải đóng trong ①; layer ⑥ chỉ còn **hình thái và chuyển động**.
👁 **Nghiệm thu bằng mắt:** *Chụp **khung tĩnh** của cả 8 trạng thái Vitals cạnh nhau; phân biệt
được đủ 8 mà không cần xem chuyển động và không cần đọc nhãn.*

⛔ **Cổng mắt của ⑥ là của Hoà.** Tôi không duyệt Vitals, không duyệt brand, không nâng CANDIDATE nào.

---

## L2.6 · NHÃN TỔNG SAU LƯỢT 2

**`PARTIAL — runtime proof ở bậc web dev server, ĐÃ ĐĂNG NHẬP, có dữ liệu thật, cửa sổ đo ~6 phút,
KHÔNG có ảnh mới.`**

⛔ Cấm đọc bất kỳ dòng nào ở đây thành PASS. 10 bề mặt còn `NOT ASSESSED` là **chưa nhìn**, không phải "đạt".
⛔ Electron đóng gói vẫn `NOT ASSESSED` — **không** được dùng bản `.app` `com.ttt…` (22/08) để chứng minh HEAD `6ce3db7`.
