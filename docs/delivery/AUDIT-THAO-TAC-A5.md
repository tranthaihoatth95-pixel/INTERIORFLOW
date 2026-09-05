# AUDIT THAO TÁC — LÀN A5
**Máy sạch → việc đầu tiên · vòng đời tài khoản · Gallery · canvas node chặng 2 · WorkHub**

- **Mốc đo:** nhánh `nen-checkpoint`, HEAD `a2a8c6e8`, cây sạch lúc sao chép (chỉ `?? lib/nav/`).
- **Bản chạy:** ⚠️ **KHÔNG dùng cổng 3210 như phiếu giao.** Kiểm chứng đầu phiên: `http://localhost:3210/` trả HTML 200 nhưng **mọi chunk JS trả 500** (`/_next/static/chunks/webpack-*.js` = 500, 21 byte) — dev server của các làn khác đã ghi đè `.next` trong cùng thư mục, `BUILD_ID` biến mất. Đo trên đó là đo một trang **không hydrate**. Đây đúng bệnh `§0aa` đã ghi trong sổ (*nhiều server một thư mục → `.next` hỏng*).
  ⇒ Tôi dựng **bản cô lập** `/tmp/a5-app` (sao chép nguồn tại mốc trên, `node_modules` symlink), **CSDL trắng** dựng bằng `prisma migrate deploy`, chạy `next dev -p 3217`.
- **Cách làm:** thao tác thật bằng Playwright/Chromium 1194. Mã chỉ dùng để *giải thích* lỗi đã thấy, không dùng để kết luận.
- **Ảnh:** `docs/delivery/anh-duyet-mat/audit-a5/` — đường này **được git theo dõi** (ngoại lệ `.gitignore:117`), khác với đường ảnh của lượt A4.
- **Hồ sơ trình duyệt:** `launchPersistentContext` trên `/tmp/a5-hoso` — hồ sơ **thật trên đĩa**, nên "đóng app rồi mở lại" là đóng/mở thật, không phải giả lập bằng `storageState`.

---

## ⓪b TIỀN ĐỀ HẠ TẦNG
`git log --oneline -1` = `a2a8c6e8`. Không sửa một dòng mã nguồn nào. Không `git add/stash/checkout/reset`.

---

## KHẲNG ĐỊNH CỦA SỔ MÀ LƯỢT NÀY KIỂM LẠI ĐƯỢC

| Sổ nói | Đo được 05/09 | |
|---|---|---|
| 04/09: *"máy chủ mới chạy `migrate deploy` dựng đủ 24/24 bảng"* | `migrate deploy` trên tệp trắng chạy sạch 8 migration, dựng **26 bảng** (số bảng tăng sau `tenant_context_v1`), `User=0 Project=0` | ✅ đúng, con số nay là 26 |
| 04/09: *"gỡ mặt AI thứ hai khỏi WorkHub"* | `grep "fetch("` trong `WorkHubShell.tsx` = **1**, và dòng duy nhất đó nằm **trong chú thích** mô tả lỗi cũ. Không còn ngăn trợ lý, không còn câu trả lời gõ cứng. Docstring `:8-21` ghi rõ lý do gỡ | ✅ **đã hết** |

---

## BẢNG PHỦ

✅ đã đi · ⬜ chưa đi (kèm lý do)

| Vùng | ① thuận | ② RỖNG | ③ vào ngang | ④ bỏ dở | chuột+bàn phím | cảm ứng | 1024×768 |
|---|---|---|---|---|---|---|---|
| **Intro (màn đầu tiên đời máy)** | ✅ | ✅ | ✅ `/intro` | ✅ bỏ mặc 200 s | ✅ Tab+Enter+Esc | ⬜ | ⬜ |
| **Màn khoá / đăng ký** | ✅ | ✅ | ✅ | ✅ | ✅ | ⬜ | ⬜ |
| **Trang chủ người mới (0 dự án)** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Tạo dự án đầu tiên** | ✅ | ✅ | — | ✅ Esc | ✅ 40 Tab | ⬜ | ⬜ |
| **Đóng app → mở lại** | ✅ hồ sơ đĩa thật | ✅ | — | — | — | — | — |
| **Vòng đời tài khoản** | ✅ đăng ký · sai mật khẩu · trùng email · mật khẩu ngắn | ✅ | ✅ | — | ⬜ *đo qua API* | ⬜ | ⬜ |
| **Người dùng THỨ HAI cùng máy** | ✅ | ✅ | ✅ 4 endpoint + trang HTML | — | — | — | — |
| **Gallery** | ✅ | ✅ | ✅ | ✅ | ⬜ *không đi Tab riêng* | ✅ chạm CDP | ✅ |
| **Chặng 2 lối NODE** | ⚠️ *chỉ tới cửa — xem `A5-03`* | ✅ | ✅ | — | ✅ 38 Tab | ✅ | ✅ |
| **WorkHub** | ✅ *chỉ xác nhận lỗi cũ* | — | ✅ | — | — | — | — |

**Tổng: 8 lỗi** — **P0: 1** · **P1: 3** · **P2: 4**.
Kèm **10 lần tôi tự bác kết luận của chính mình** (mục cuối) — 10 lỗi đó là của **bộ đo**, không phải của sản phẩm; nếu không đo lại thì 10 báo cáo sai đã lọt vào đây.

---

## ⭐ CHUỖI CHÍNH — MÁY SẠCH LÀM ĐƯỢC VIỆC KHÔNG?

**CÓ.** Đi trọn, không gãy đoạn nào:

| Bước | Kết quả |
|---|---|
| CSDL trắng (26 bảng, `User=0`, `Project=0`) | ✅ `migrate deploy` dựng đủ |
| Hồ sơ trình duyệt trắng → `/` | ✅ (rơi vào intro — xem `A5-01`) |
| Đăng ký tài khoản đầu tiên | ✅ 200, **tự đăng nhập**, về `/` |
| Trang chủ người mới | ✅ nói rõ *"chưa có việc nào đang dở — xưởng thì đã sẵn sàng"* + **1 tiêu điểm** (đúng D-DR2) |
| Tạo dự án đầu tiên | ✅ 23 s, ghi vào CSDL, nhảy thẳng vào `/projects/<id>/render` |
| Trang chủ sau đó | ✅ hiện thẻ **"Căn hộ A5 · gần đây nhất"** + *"Việc đang dở… mở lại chỗ cũ"* |
| **ĐÓNG HẲN trình duyệt → mở lại** | ✅ **còn đăng nhập · còn dự án · còn chỗ cũ** |

⇒ Nút cổ chai của bản cài **không** nằm ở chuỗi này. Nó nằm ở **cửa vào** (`A5-01`) và ở **việc thứ hai** (`A5-03`).

---

# LỖI

## P0

### `[A5-01]` P0 · Intro · **cửa sổ 9 giây, trượt là màn đen vĩnh viễn**

**Thấy gì.** Máy sạch mở app → `/` chuyển sang `/intro` → chạy một chuỗi hoạt hình ~60 s. Nút thoát chính thức **"Bắt đầu · Get started"** xuất hiện ở **giây 56** và **biến mất ở giây 65** — **cửa sổ bấm 9 giây**. Ai không bấm kịp thì từ giây ~65 trở đi màn hình **chỉ còn đúng hai chữ "SKIP →" ở góc trên phải**, không tiêu đề, không nội dung, không nút nào khác. Đo hai lần độc lập, **170 s** và **200 s** — không tự thoát, không tự về `/login`, cờ `if_intro_seen_v1` vẫn `null`.

```
  3s  scene 1 "Mười file. Năm tool…"      nút: [Skip]
 33s  "BA MÀN — MỘT MẠCH"                 nút: [Skip]
 56s  "Sáng tạo là của bạn…"              nút: [Skip | Bắt đầu · Get started]   ← 9 giây
 65s  (trống)                             nút: [Skip]
168s  (trống)                             nút: [Skip]      ← vẫn thế
```

**Đáng lẽ phải gì.**
1. `docs/00-CHOT.md` → `CHOT-INTRO-VIDEO-2026-08-02`: *"BỎ intro code (998 dòng), thay bằng VIDEO… Thay = **1 video 8s** + 1 dòng chữ + nút Bỏ qua."* Cái đang chạy là **60 s**, gấp **7,5 lần** con số đã chốt, và là intro **code** — đúng thứ chốt đó ra lệnh bỏ.
2. `docs/00-CHOT.md` 14/08: *"**Cắt hẳn `intro-day-chuyen` khỏi hàng đợi hiện tại** — Hoà chốt làm SAU khi app xong."* Nó vẫn đang là màn đầu tiên của bản cài.
3. Trạng thái cuối là **màn trống không lối ra** — `ACTIVE-DESIGN-CONTEXT §10` (N-10) liệt *"hộp rỗng khổng lồ"* vào 13 cờ đỏ.

**Tái hiện.** Hồ sơ trình duyệt trắng → `http://<host>/` → **không bấm gì** → đợi 70 s → nhìn màn hình.
**Ảnh.** `10-intro-cuoi-170s-bo-mac.png` (màn trống) · `11-nut-bat-dau-hien-56s.png` (nút lúc còn) · loạt `08-intro-toan-man-*.png` (7 s → 90 s).

**Vì sao xếp P0.** Đây là **màn hình đầu tiên của đời máy**. Người mở bộ cài lần đầu **không skip** — họ xem, vì đó là ấn tượng đầu về sản phẩm. Xem xong thì mất luôn nút vào. Cái duy nhất còn lại là chữ "SKIP →" mờ ở góc, lúc đó **không còn ngữ cảnh gì để hiểu nó dẫn đi đâu**.

**⚠️ Chưa chắc.** Máy đo đang nghẽn nặng (5 dev server của làn khác, RAM 14/15 Gi) nên **thời lượng từng cảnh có thể dài hơn máy thật**. Nhưng *thứ tự* và *hình dạng* lỗi thì không phụ thuộc tốc độ: nút hiện rồi mất, sau đó trống. Nên đo lại trên máy chủ dự án để lấy con số 9 s cho đúng.

---

## P1

### `[A5-02]` P1 · `/api/flows` · **người mới tinh thấy tên MỌI tài khoản trên máy**

**Thấy gì.** Đăng ký tài khoản thứ hai (`Người Lạ`) trên cùng bản cài — 0 dự án, 0 lời mời, 0 quan hệ. Gọi `GET /api/flows`:

```json
{"flows":[],"projects":[],
 "team":[{"name":"Người Lạ","online":true},
         {"name":"Chị Lan Bí Mật","online":true},   ← không quen biết gì
         {"name":"Người Hai","online":true},
         {"name":"Người Một","online":true}, …6 người]}
```
`flows` và `projects` **cách ly đúng** (rỗng). Nhưng `team` trả **toàn bộ danh bạ người dùng** kèm **tên thật** và **đang online hay không**.

**Đáng lẽ phải gì.** Chính docstring của tệp đã khai đây là lỗi: `app/api/flows/route.ts:18-19` — *"**SIẾT**: roster `prisma.user.findMany()` không điều kiện… trả toàn bộ người dùng của cài đặt — **rò rỉ ngang khi nhiều studio**"*. Bản vá **đã viết**, nhưng đứng sau cờ `IF_PROJECT_SCOPE_ENFORCE`, và `:24` ghi *"Cờ chưa đặt ⇒ hành vi y hệt hôm nay"* — tức **bản mặc định ship ra là bản rò**. Cộng `LUẬT NỀN TẢNG` (`CLAUDE.md`): IF là sản phẩm bán ra toàn cầu, không phải tool nội bộ LAN — mà lý do giữ nguyên truy vấn này (`:18`, comment cũ *"roster cả team (app nội bộ LAN)"*) chính là giả định "nội bộ LAN" đã bị luật đó bãi bỏ.

**Tái hiện.** Đăng ký 2 tài khoản bất kỳ → tài khoản 2 gọi `GET /api/flows` → đọc mảng `team`.
**Sửa rẻ nhất.** Bật `IF_PROJECT_SCOPE_ENFORCE` làm **mặc định** thay vì opt-in.

### `[A5-03]` P1 · chặng 3D · **nút duy nhất trên canvas trống bấm không ra gì**

**Thấy gì.** Tạo dự án xong, app **tự đưa** vào `/projects/<id>/render`. Canvas trống, chữ trên màn: *"Canvas đang trống — kéo khối từ Thư viện vào đây"*, kèm đúng **một** nút: **"Mở Thư viện khối"**. Bấm nó — bằng chuột thật tại toạ độ (767, 493) **và** bằng bàn phím (38 lần Tab → Enter):

| | trước | sau |
|---|---|---|
| chữ trên trang | 267 ký tự | **267** |
| panel đang hiện | 21 | **21** |
| điều khiển đang hiện | 37 | **37** |
| gọi mạng mới | — | **không có** |

Tấm `role="dialog" aria-label="Thư viện"` vẫn nguyên `visibility:hidden`, `inert`, `aria-hidden="true"` trước **và** sau khi bấm.

**Đáng lẽ phải gì.** `docs/00-CHOT.md` §9 (luật Hoà đặt 03/08): ***"Cấm nút giả bấm không ra gì."*** Và `ACTIVE-DESIGN-CONTEXT §10` cấm *"hộp rỗng khổng lồ"* — màn này là một canvas trống với lối ra duy nhất bị hỏng.

**Tái hiện.** Tài khoản mới → tạo dự án → app tự vào chặng 3D → bấm "Mở Thư viện khối".
**Ảnh.** `25-01-bam-mo-thu-vien-khoi-khong-mo.png` · `24-01-sau-bam-mo-thu-vien-khoi.png`.

**Vì sao đau.** Đây là **việc thứ hai** người dùng làm, ngay sau việc đầu tiên. App **tự chọn** đưa họ tới đây, rồi khoá cửa. `A5-01` chặn ở lối vào, `A5-03` chặn ở bước kế tiếp — hai cái cộng lại là toàn bộ ấn tượng của 5 phút đầu.

### `[A5-04]` P1 · hộp thoại "Bảng khởi tạo dự án" · **khai `aria-modal` nhưng không giữ focus**

**Thấy gì.** Hộp thoại khai đúng `role="dialog"` + `aria-modal="true"` + `aria-label="Bảng khởi tạo dự án"`, và **Esc đóng được** ✅. Nhưng bấm Tab **40 lần**: **22 lần focus rơi ra ngoài** hộp thoại, xuống các nút của trang nền — *"Mở dự án có sẵn"*, *"Nhập từ tệp"*, header *"InteriorFlow"* — rồi mới vòng lại. Nền **không** được đặt `inert`.

**Đáng lẽ phải gì.** `aria-modal="true"` là một lời hứa với trình đọc màn hình rằng phần còn lại của trang **không tồn tại** trong lúc hộp thoại mở. Khai mà không giữ thì người dùng bàn phím tưởng mình đã ra khỏi hộp thoại trong khi nó vẫn đang phủ màn. Căn cứ: **lẽ thường + hợp đồng của chính thuộc tính** — không có điều khoản riêng trong sổ; nối vào lỗ ❌ *"a11y audit 1 lượt"* đang mở ở `STATUS.md`.

**Tái hiện.** Trang chủ → "Tạo dự án mới" → bấm Tab liên tục, xem `document.activeElement`.

---

## P2

### `[A5-05]` P2 · Intro · **5 giây đầu không có đường thoát**
Nút "SKIP →" tồn tại trong DOM ngay từ đầu nhưng `opacity: 0` cho tới **giây ~6**. Trong ~3,3 s đầu trang còn đang chuyển `/` → `/intro`, nên cú bấm hoặc cú Tab rơi vào khoảng đó **bị cuốn trôi** theo lần điều hướng (đo được: bấm ở 2,2 s → không có gì xảy ra; bấm ở 4,5 s → ra `/login` ở 5,6 s). Tương phản của nút thì **tốt suốt** — 15,01:1 đo bằng pixel ở cả 8 mốc 7 s → 90 s, không có vấn đề đọc.
**Đáng lẽ.** Lối thoát của màn đầu tiên phải dùng được **ngay giây đầu**. Lẽ thường — không có điều khoản riêng.

### `[A5-06]` P2 · chặng 3D · **4 lần `404 /api/cursors` mỗi lần vào**
Vào `/projects/<id>/render`: **4 lỗi 404 trong 5 giây đầu** (2 POST + 2 GET), sau đó **im hẳn** — 30 s tiếp theo: 0 lỗi. Không phải vòng lặp.
Nguồn: client gửi `flowId: "local"` (`lib/collabStore.ts:106,121`) — một id giả. Cổng an ninh phía máy chủ **làm đúng**: `app/api/cursors/route.ts:48` không tìm thấy flow → `404 {"denied":true,"reason":"not-member"}`. Lỗi ở phía **gọi**, không ở phía chặn.
**Đáng lẽ.** Không gửi khi chưa có flow thật. Hại: 4 dòng đỏ trong console mỗi lần vào chặng — ai mở devtools sẽ tưởng app hỏng.

### `[A5-07]` P2 · cảm ứng · **token `--tap: 44px` áp đúng nhưng nhiều nút vẫn dưới 44px**
Ngữ cảnh cảm ứng khớp thật (`(hover:none) and (pointer:coarse)` = `true`, `--tap: 44px`, `--row: 44px`) và cơ chế **có tác dụng** — số nút dưới 44px ở Trang chủ tụt **22 → 4** khi chuyển sang cảm ứng. Nhưng còn sót:

| màn (1024×1366, cảm ứng) | nút dưới 44px | nhỏ nhất |
|---|---|---|
| Trang chủ | 4 | `Thiết kế 2D/3D/Trình chiếu` cao **32** |
| Gallery | 10 | `Mở lại bảng` **28×28** |
| chặng 3D | 24 | `AI đang chạy mock` **10×10** |

**Đáng lẽ.** Chốt 03/08 (`SPEC-MAT-DO-CON-TRO §5`): 5 token đổi theo con trỏ, cảm ứng override. Token đã có và đã chạy — chỗ thiếu là **nơi tiêu thụ chưa đọc token**.

### `[A5-08]` P2 · `/api/auth/me` **gọi 3–4 lần mỗi lần tải trang**
Đăng nhập rồi, mã trả về đều `200` (✅ không phải lỗi quyền), nhưng mỗi lần tải trang gọi **3 lần**, trang thứ hai **4 lần**. Trùng lặp thuần tuý.
**Đáng lẽ.** Lẽ thường — không có điều khoản riêng. Ảnh hưởng nhỏ; ghi để khỏi rơi.

---

## ⑦b · CHƯA CHẮC / CHƯA KIỂM

- **Chỉ Chromium 1194.** Không thử Safari/Firefox, **không thử Electron thật** — mà bản cài chủ dự án bấm là Electron, nơi `/` được nạp khác (`file://` + `WebContentsView`). Ca `A5-01` cần đo lại ở đó.
- **Không thử trình đọc màn hình thật.** `A5-04` đo bằng `document.activeElement`, không bằng VoiceOver/NVDA.
- **Không thử tablet thật** — cảm ứng là ngữ cảnh giả lập, dù đã xác minh media query khớp và `--tap` áp đúng.
- **Máy đo nghẽn nặng suốt phiên**: 5 dev server của các làn khác, RAM 14/15 Gi, một lần **OOM cgroup giết cả loạt** (`dmesg`: `oom-kill … task=next-server pid=1329`). ⇒ **mọi con số THỜI GIAN trong báo cáo này là trần trên, không phải số của máy thật.** Con số *hình dạng* (nút hiện/mất, 404, tương phản, số nút dưới 44px) thì không bị ảnh hưởng.
- **Nút nhà cung cấp Microsoft**: một lượt đo thấy nó **mờ ở tab ĐĂNG KÝ** nhưng **bấm được ở tab ĐĂNG NHẬP**; lượt kiểm lại **không tái hiện được** (bộ lọc theo `textContent` không bắt được nút vì nút có cả icon). **Không đủ bằng chứng ⇒ không tính là lỗi.** Ai đi lượt sau kiểm giúp bằng `aria-label`.
- **Chặng 2 lối NODE mới đi tới cửa.** Thêm node / nối dây / mở cửa sổ công cụ / xoá node **chưa đi được**, vì lối vào duy nhất (`A5-03`) hỏng. Không có đường vòng nào lộ ra trên giao diện.
- **Không bấm nút AI nào** (luật credit). Node `AI đang chạy mock` chỉ đo kích thước, không kích hoạt.
- Ca ④ *"quay lại / bỏ dở"* của Gallery và chặng 3D chỉ đi bằng `goto` + `back`, **chưa thử bỏ dở giữa một thao tác đang ghi**.

---

## ⭐ MƯỜI LẦN TÔI TỰ BÁC KẾT LUẬN CỦA CHÍNH MÌNH

Ghi đủ, vì đây là phần dễ giấu nhất và cũng là phần đáng tiền nhất: **10 lỗi dưới đây đều là lỗi của BỘ ĐO, không phải của sản phẩm.** Nếu không đo lại, báo cáo này đã có 10 lỗi ma — mà mỗi lỗi ma là một làn đi sửa hư không.

| # | Tôi đã định báo | Đo lại ra | Gốc bệnh của bộ đo |
|---|---|---|---|
| 1 | *"Máy sạch mở app ra TRANG TRẮNG"* | Không trắng — là intro | `offsetParent !== null` **luôn null với `position:fixed`** ⇒ lọc mất sạch điều khiển |
| 2 | *"Nút Skip không chạy"* | Chạy — ra `/login` sau 1,1 s | Tôi bấm ở 2,2 s, trước cú chuyển `/`→`/intro` ở 3,3 s |
| 3 | *"Nút Skip mất tương phản khi nền đổi"* | 15,01:1 suốt 8 mốc | Tôi đọc `color` mà không đọc nền — nền lật cùng lúc nên vẫn nghịch nhau |
| 4 | *"Skip không đi được bằng bàn phím (15 Tab)"* | Tab **lần 1** trúng, ring 2px | Đo lúc 4 s, trang đang điều hướng nên focus bị reset |
| 5 | *"Intro phát lại mỗi lần mở"* | Không — có cờ `if_intro_seen_v1` | Lần trước cú Skip bị nuốt nên cờ chưa kịp ghi |
| 6 | *"Có tấm Thư viện lạ hiện trên Home người mới"* | Đã ẩn đúng (`inert` + `aria-hidden`) | Tôi kiểm sự tồn tại trong DOM, không kiểm độ hiện |
| 7 | *"Esc không đóng hộp thoại"* | Esc **đóng** | Lỗi thứ tự toán tử trong chính biểu thức kiểm của tôi |
| 8 | *"404 /api/cursors chạy vòng lặp không dừng"* | Cụm 4 lần lúc vào, rồi im | Tôi chỉ quan sát 5 s đầu rồi suy ra "không dừng" |
| 9 | *"10 nút không có tên"* | 0 nút — chúng có `title` | Bộ liệt kê của tôi đọc `aria-label`/`textContent`, **quên `title`** |
| 10 | *"401 /api/auth/me dù đã đăng nhập"* | 200 khi đã đăng nhập | 401 là ở màn **chưa** đăng nhập — đúng hành vi |

**Điểm chung của 8/10 ca:** tôi kết luận từ **một lần đo, trong một cửa sổ thời gian hẹp, bằng một phép kiểm không đủ**. Ba lỗi (#1, #9, #6) là cùng một họ: **phép kiểm "có hiện không" viết sai**. Đây đúng bài học `00-CHOT` 04/09 — *máy soi báo quá tay vì mẫu quét bắt sai* — nay có thêm ba ca.

> 🔁 Cùng phiên còn dính lại chính bài học đó một lần nữa ngoài phạm vi audit: `pkill -f "3217"` **tự khớp chính nó** và giết luôn shell đang chạy. *Máy soi nào quét văn bản thì phải tự loại trừ chính nó.*

---

## SỰ CỐ MÔI TRƯỜNG DO LÀN NÀY GÂY RA — đã khắc phục, khai đầy đủ

`/tmp/a5-app/.env` sau khi sao chép là **symlink trỏ về `/home/user/INTERIORFLOW/.env`** dùng chung. Lệnh `cat > .env` của tôi **ghi xuyên qua symlink**, đổi `DATABASE_URL` của **mọi làn** sang CSDL riêng của tôi trong khoảng **08:20 → 09:00**. Dấu vết: 4 dự án lạ (`CA1` `CA3` `CA4` `phim`) xuất hiện trong CSDL "cô lập" của tôi — đó là dữ liệu của làn khác.

**Đã sửa:** khôi phục `/home/user/INTERIORFLOW/.env` đúng nội dung mà `scripts/dung-moi-truong-kiem.sh:23-30` sinh ra (gồm cả `AUTH_SECRET` và `INTEGRATION_ENC_KEY` — đều là khoá kiểm thử, không phải khoá thật); thay symlink trong bản của tôi bằng **tệp thật**; dựng lại CSDL trắng. `.env` nằm trong `.gitignore` nên **không có thiệt hại nào vào repo**.

**Làn nào khởi động lại dev server trong cửa sổ 40 phút đó có thể đã ghi vào CSDL của tôi và cần kiểm lại dữ liệu của mình.** Bài học cho phiếu sau: **sao chép cây thì phải kiểm symlink trước khi ghi đè bất cứ tệp cấu hình nào** — `cat >` đi xuyên symlink, `rm` thì không.

---

## GHI NHẬN — thứ làm ĐÚNG, để không ai đi sửa nhầm

- **Cách ly dữ liệu giữa hai người dùng: đúng.** Người 2 gọi 4 endpoint dự án của người 1 → **404 cả 4** (`overview`, `profile`, `members`, `dna`) — và là 404 chứ không phải 403, tức **không xác nhận dự án có tồn tại**. Trang HTML `/projects/<id>/cad` cũng **không lộ tên dự án**. `flows`/`projects` rỗng đúng.
- **Kiểm hợp lệ khi đăng ký/đăng nhập: đủ và nói tiếng người.** Sai mật khẩu → `401 "Sai email/SĐT hoặc mật khẩu."` · trùng email → `409 "Email đã đăng ký."` · mật khẩu 5 ký tự → `400 "Cần tên và mật khẩu ≥ 6 ký tự."`
- **Bền vững qua đóng/mở app: đúng** trên hồ sơ trình duyệt thật.
- **WorkHub: lỗi cũ ĐÃ HẾT.** Không còn mặt AI thứ hai. Trang nay nói thẳng *"Bề mặt này chưa được bật… Không phải lỗi, và cũng không phải do quyền của bạn"* — đúng khuôn *nói-thật* thay vì nút giả.
- **Gallery: màn trống làm được việc tại chỗ** — *"Nhập từ Kho chung"* phản hồi thật khi **chạm** (điều khiển 53→54, chữ 449→1013), và sổ nguồn khai rõ *"Lưu ở máy này"*.
- **1024×768: không tràn ngang** ở cả 3 màn đã đo (`scrollWidth === clientWidth`), không cuộn dọc ngoài ý muốn.
- **Không có `.md` nào bị sửa ngoài báo cáo này. Không sửa một dòng mã nguồn nào.**
