# AUDIT THAO TÁC · LÀN A1 — Trang chủ · thanh điều hướng · khẩu độ Vitals

> **Ngày** 05/09/2026 · **Bản chạy** `next start` tại `http://localhost:3210` · nhánh `nen-checkpoint`
> **Cách làm:** thao tác thật bằng Playwright (Chromium 1194) như một người dùng — bấm, gõ, Tab,
> chạm. Đọc mã **chỉ** dùng để giải thích một lỗi đã THẤY, không dùng để khẳng định thứ gì chạy đúng
> (luật `N6`). Ảnh: `/tmp/a1-anh/` (42 khung).
> **Tài khoản:** `audit@if.test`.

---

## ⚠️ ĐIỀU KIỆN CHẠY ẢNH HƯỞNG TỚI KẾT QUẢ — đọc trước

1. **Tài khoản dùng CHUNG với các làn audit khác.** Lúc mở phiên tài khoản có **0 dự án** (ca RỖNG
   thật, đã chụp). Giữa lượt, làn A2 tạo dự án — cuối lượt là **3 dự án**. Vì vậy ca RỖNG chỉ đi
   được bằng **chuột**; bàn phím và cảm ứng trên nền RỖNG **không đi được nữa** (khai ở bảng phủ).
2. **Cây làm việc đang bị các làn khác sửa LIÊN TỤC trong lúc tôi đo.** Đầu lượt `git status` =
   ` M app/globals.css`; cuối lượt = ` M components/studio/VitalsAperture.tsx`,
   ` M lib/site/vitals-site.ts`, ` M components/site/dia-diem-client.ts`. Tức **chính khẩu độ Vitals
   đang được sửa dở** khi tôi audit nó. Mọi số và hành vi ghi ở đây là **ảnh chụp tại thời điểm
   chạy** (05/09, ~07:20–07:45); trước khi sửa theo báo cáo này, **đo lại**.
   ⚠️ Riêng `A1-01`, `A1-02`, `A1-11`, `A1-13` chạm đúng vùng đang sửa — khả năng lệch cao nhất.

---

## BẢNG PHỦ — 4 ca × 2 lối nhập × bề mặt

| Bề mặt | Ca | Chuột + bàn phím | Cảm ứng (không hover) |
|---|---|---|---|
| **Trang chủ** | ① sung sướng | ✅ đi | ✅ đi (1024 · 1440) |
| | ② RỖNG | ✅ chuột · ⚠️ **bàn phím CHƯA** | ❌ **chưa đi được** |
| | ③ vào ngang | ✅ `/?mo=du-an` | ❌ chưa đi |
| | ④ quay về | ✅ Back trình duyệt | ✅ rail |
| **Rail điều hướng** | ① | ✅ Tab 20 chặng, đo vòng focus | ✅ |
| | ② RỖNG | ✅ chuột (mục Chặng → `/?mo=du-an`) | ❌ chưa đi |
| | ③ | ✅ mở thẳng `/projects/<id>/cad` · id bịa | ❌ chưa đi |
| | ④ | ✅ rail "Trang chủ" · nấc thu/mở | ✅ nhãn đọc được không cần hover |
| **Khẩu độ Vitals** | ① | ✅ hover · bấm · `⌘J` · Esc · ⤢ | ✅ chạm mở |
| | ② không tín hiệu | ✅ hover 1,4s và 3,2s | ✅ chạm |
| | ③ | ✅ `/projects/default/notebook` | ❌ chưa đi |
| | ④ | ✅ Esc · Đóng | ⚠️ chưa thử vuốt/nhấn giữ |
| **Thanh trạng thái** | ① | ✅ mở ô hỏi · gõ · Enter | ✅ chạm mở |
| | ② | ✅ (không tín hiệu) | ✅ |
| | ③ | — không có đường vào ngang | — |
| | ④ | ✅ Esc | ❌ chưa đi |
| **Đăng nhập/xuất/vào lại** | ① | ✅ đủ vòng | ❌ chưa đi |
| | ③ vào ngang khi đã đăng xuất | ✅ (phiên trắng, 0 cookie) | ❌ chưa đi |

**Ô chưa đi + lý do:** mọi ô RỖNG ngoài chuột — tài khoản hết rỗng giữa lượt do làn A2 (xem trên).
Ca ③ trên cảm ứng — cắt để dồn thời gian cho 4 chỗ Hoà chỉ đích danh. Cử chỉ nhấn-giữ/vuốt trên
khẩu độ Vitals — chưa thử.

---

## ✅ BỐN CHỖ HOÀ CHỈ ĐÍCH DANH — kết quả

| # | Chỗ | Kết quả |
|---|---|---|
| 1 | **Khẩu độ Vitals, không tín hiệu** | ✅ **ĐẠT phần Hoà cấm.** Rê chuột 1,4s và 3,2s → **không tấm nào bật ra**. Tấm *"Không có tín hiệu nào / Mở Vitals…"* **không xuất hiện ở bất kỳ đường nào đã đi** (Trang chủ · chặng 2D · Trình chiếu · chuột · cảm ứng). Bấm → mở đúng Vitals ngay tại chỗ, con trỏ nhảy vào ô nhập. ⚠️ **Nhưng nút ⤢ trong tấm đó lại đưa đi chỗ khác — xem A1-01/A1-02.** |
| 2 | **Đường quay về từ màn vẽ** | ✅ **ĐẠT.** Icon trên cùng rail là **hình ngôi nhà** kèm chữ **"Trang chủ"** *hiện sẵn*, không cần rê chuột — đúng cả trên cảm ứng. Bấm → về `/`. Back trình duyệt → về `/`. **Không đọc ra "bảng ứng dụng".** (Icon lưới ⊞ là của mục *Thiết kế 2D*, không phải mục trên cùng.) |
| 3 | **Năm mục chặng khi CHƯA có dự án** | ✅ **ĐẠT.** Khi 0 dự án, 3 mục Chặng trỏ `/?mo=du-an` và mang chú thích *"Chưa có dự án — bấm để tạo dự án đầu tiên"*. Không mục nào chết hay mờ câm; đích đến có sẵn nút **"Tạo dự án mới"**. |
| 4 | **Ô gõ nhanh ở thanh trạng thái** | ✅ **Câu KHÔNG bị mất.** Bấm pill → nở thành ô *"Hỏi Vitals… ⌘J"*; gõ câu + Enter → `POST /api/ai-assist-chat`, tấm Vitals mở kèm **đúng câu vừa gõ**. ⚠️ Hai lỗi phụ đi kèm: ô **không tự nhận con trỏ** (A1-10) và câu trả lời **lộ tên biến môi trường** (A1-08). |

---

## DANH SÁCH LỖI

### 🔴 P0 — chặn việc

#### `A1-01` · P0 · Vitals (tấm đầy đủ) · chuột · **CA③ vào ngang**
**Thấy gì.** Mở `http://localhost:3210/projects/default/notebook` rồi bấm **"Quay lại"** — nút duy
nhất trên màn — trình duyệt nhảy tới **`about:blank`**. Trang trắng hoàn toàn, không còn gì của IF,
không có đường nào quay lại ứng dụng ngoài gõ tay URL.
Ảnh: `13-vitals-expand.png`.
**Đáng lẽ phải gì.** Nút thoát duy nhất của một màn phải đưa về một chỗ CÓ THẬT trong app.
*Căn cứ: lẽ thường của người dùng — không có điều khoản riêng.* Đây cũng đúng họ "hộp rỗng khổng lồ"
và "nút nói dối việc nó vừa làm" (§10 chống chỉ định).
**Tái hiện.** ① Đăng nhập ② dán thẳng `/projects/default/notebook` vào thanh địa chỉ ③ bấm "Quay lại"
→ `about:blank`. (Nếu tới màn này bằng nút ⤢ từ Vitals thì "Quay lại" chạy đúng — lỗi **chỉ** lộ ra
khi vào ngang, tức đúng lúc người ta mở từ link người khác gửi.)

#### `A1-02` · P0 · Khẩu độ Vitals · chuột · **CA② RỖNG**
**Thấy gì.** Tài khoản có **0 dự án**. Bấm khẩu độ Vitals → tấm mở đúng. Bấm nút ⤢ trong tấm
(nhãn trợ năng: *"Mở NotebookLM đầy đủ · Full"*) → **rời hẳn Trang chủ**, nhảy tới
`/projects/default/notebook`, đầu trang ghi **`DỰ ÁN · PROJECT #DEFAULT`** — một dự án **không tồn
tại** trên tài khoản này. Màn đó **không có rail, không có khẩu độ Vitals**, giữa màn trống ~570px,
cột phải trống hẳn.
Ảnh: `12-vitals-click.png` → `13-vitals-expand.png`.
**Đáng lẽ phải gì.** ① `docs/ACTIVE-DESIGN-CONTEXT.md` §4 **D-DR1**: *"Sau di trú phải còn **đúng một**
chỗ đứng vật lý"* — đây là chỗ đứng **thứ hai** của Vitals, ở một route khác, không có khẩu độ để
quay lại. ② §2 **Morph giữ định danh**: *"aperture→peek→engage: **cùng một vật nở ra**, không phải
vật khác thay chỗ"* — đây là teleport sang màn khác. ③ §10 cờ đỏ **"hộp rỗng khổng lồ"**.
④ Nhãn lộ tên sản phẩm ngoài (**"NotebookLM"**) — §4 *"mặt AI là Vitals, không có mặt AI thứ hai"*.
**Tái hiện.** ① Tài khoản chưa có dự án ② bấm khẩu độ Vitals ở mép trên ③ bấm nút ⤢ góc phải tấm.

---

### 🟠 P1 — khó dùng rõ rệt

#### `A1-03` · P1 · Trang chủ · cả hai lối nhập · CA① và CA②
**Thấy gì.** Ở bề rộng **1024px** (cả chuột lẫn cảm ứng), thẻ *"Chọn chỗ để vào việc"* **chồng chữ
lên nhau**, không đọc được: dòng tiêu đề *"Chọn …"* bị đè bởi thân *"Máy này chưa giữ dấu vết…"*;
dải chân thẻ *"2 thứ đang chờ bạn / 0 việc xong hôm nay / chọn một dự á…"* vẽ **đè lên nút "Mở dự án
có sẵn"**; dòng *"Đang trong xưởng 1"* bị cắt ngang ở đáy thẻ.
Ảnh: `80-1024-desktop.png` · `80-1024-touch.png` (1440 thì không bị — `05-home-empty-clean.png`).
**Đáng lẽ phải gì.** Chữ không được đè chữ. Và §5-**A** *"Ngày dày việc — vẫn đọc được"*, §5-**§30**
*"nội dung ngoài tầm nhìn phải có dấu hiệu còn tiếp"*. Đây là **trượt vì bố cục**, nên theo **N-17**
cấm chữa bằng màu/bóng/bo/độ mờ.
**Tái hiện.** Mở `/` ở cửa sổ rộng 1024px, tài khoản có ≥1 dự án.

#### `A1-04` · P1 · Rail · **cảm ứng** · CA①
**Thấy gì.** Trên cảm ứng, mỗi mục rail hiện **nhãn hai lần**: "Trang chủ" cỡ 15px, rồi ngay dưới
"Trang chủ" lần nữa **cỡ 9px**. Đúng như vậy với Dự án · Cảm hứng · Thư viện · Thiết kế 2D/3D ·
Trình chiếu, và cả hai nút đáy rail. Đo được: bản thứ hai là `.if-tooltip-static` ở `y=188`,
`font-size: 9px`; trên chuột nó là `.if-tooltip-tag` đậu ở `y=-32` (ngoài màn, chỉ hiện khi hover) —
tức **chỉ hỏng ở cảm ứng**.
Ảnh: `80-1024-touch.png` (đối chiếu `80-1024-desktop.png`).
**Đáng lẽ phải gì.** §10 chống chỉ định: *"Icon ở lại khi chữ đã hiện — **nói cùng một điều hai lần**"*.
Chú thích tĩnh chỉ nên hiện khi nhãn **chưa** hiện (rail đang thu). Thêm: §7 *"Chữ Việt: dấu chồng
mang nghĩa"* — 9px thì dấu tiếng Việt không đọc nổi.
**Tái hiện.** Mở `/` trong ngữ cảnh `hasTouch` (hoặc máy cảm ứng thật) — có ở cả 1024 và 1440.

#### `A1-05` · P1 · Khẩu độ Vitals · **bàn phím** · CA①
**Thấy gì.** Vitals nằm ở **giữa** mép trên (x=821) nhưng Tab tới nó **cuối cùng**: thứ tự thực tế là
logo → ngữ cảnh → ô tìm (x=981) → chuông (x=1226) → avatar (x=1262) → **Vitals (x=821)**. Người dùng
bàn phím đi hết sang phải rồi bị quăng ngược về giữa. Lặp lại y hệt trong chặng 2D (Vitals là chặng 5,
sau chuông và avatar).
Ảnh: `30-tab-focus.png`.
**Đáng lẽ phải gì.** Thứ tự Tab phải theo thứ tự đọc. *Căn cứ: WCAG 2.4.3 Focus Order — đây là chuẩn
ngoài, không phải điều khoản trong `ACTIVE-DESIGN-CONTEXT`; §7 chỉ đặt ngưỡng tương phản.*
**Tái hiện.** Mở `/`, bấm Tab liên tiếp, đếm chặng.

#### `A1-06` · P1 · Bảng "Dự án mới" (mở từ Trang chủ) · **bàn phím** · CA①
**Thấy gì.** Bảng khai báo `role="dialog"` và **`aria-modal="true"`**, nhưng khi mở, con trỏ bàn phím
**vẫn ở ngoài**. Bấm Tab thì đi qua **11 nút của trang nền** — "Mở dự án có sẵn", "Nhập từ tệp",
các thẻ dự án, các nút ‹ › ✕ — **rồi mới** tới nút "Đóng" của bảng. Không có bẫy focus: Tab tiếp tục
chạy ra ngoài bảng.
Ảnh: `20-create-project.png`.
**Đáng lẽ phải gì.** `aria-modal="true"` là lời khai rằng phần còn lại đã trơ; ở đây nó **khai sai** —
đúng họ *"nút nói dối việc nó vừa làm"* (§10). Mở bảng thì con trỏ phải vào trong bảng và ở lại đó.
*Căn cứ: WCAG 2.4.3 + mâu thuẫn nội tại của `aria-modal` — không có điều khoản riêng trong
`ACTIVE-DESIGN-CONTEXT`.*
**Tái hiện.** `/` → "Tạo dự án mới" → bấm Tab và đếm.

#### `A1-07` · P1 · Đăng xuất / vào ngang · chuột · **CA③**
**Thấy gì.** Phiên trắng, **0 cookie**. Dán `/projects/<id>/cad` → **màn vẽ dựng ra đầy đủ**: rail,
thanh công cụ, "Bản vẽ 1", "1 sheet", "Gửi sang Trình chiếu". Không chuyển về đăng nhập, không câu
nào bảo phải đăng nhập. Nền thì mọi API trả **401** và bị **gọi lại liên tục** (14 lượt 401 trong 5
giây). Hệt như vậy sau khi bấm "Đăng xuất". Đối chiếu: `/` **có** chuyển đúng về `/intro`.
Ảnh: `99-anon-stage.png` · `98-protected-loggedout.png`.
**Nói cho đúng mức:** **dữ liệu KHÔNG lộ** — mọi API đều 401, các chữ nhìn thấy ("Bản vẽ 1") là giá
trị mặc định phía trình duyệt. Đây là lỗi **trải nghiệm + tải**, không phải lỗ hổng dữ liệu.
**Đáng lẽ phải gì.** Cùng một cổng vào phải cư xử như nhau: `/` đã chuyển về `/intro` thì
`/projects/*` cũng phải vậy, hoặc phải nói rõ "cần đăng nhập". *Căn cứ: lẽ thường + tính nhất quán;
không có điều khoản riêng.*
**Tái hiện.** Cửa sổ ẩn danh → dán `/projects/<id>/cad`.

#### `A1-08` · P1 · Vitals · chuột · CA①
**Thấy gì.** Gõ *"phong khach nen dung vat lieu gi"* vào ô Vitals ở thanh trạng thái → Enter → tấm
Vitals trả: *"AI chưa được cấu hình — Chưa cấu hình AI: thêm **NVIDIA_API_KEY** (build.nvidia.com)
hoặc chạy **Ollama** local (**ollama serve**)."* Không có nút nào.
Ảnh: `61-ask-after-enter.png`.
**Đáng lẽ phải gì.** `SPEC-NGON-NGU-CHI-DAN` (chốt 02/08, hạng ④ trong thứ tự thắng §0): 5 luật viết —
**cấm jargon nội bộ lộ UI · ≤12 từ · luôn kèm NÚT**. Một KTS không biết `NVIDIA_API_KEY` hay
`ollama serve` là gì, và câu này không cho họ việc gì để làm.
**Tái hiện.** Bấm pill "Vitals" ở thanh trạng thái trong chặng 2D → gõ một câu → Enter.

#### `A1-09` · P1 · Dòng lệnh CAD · chuột · CA①
**Thấy gì.** Gõ một câu tiếng Việt vào ô `Lệnh…` rồi Enter → ô bị **xoá trắng**, câu **mất hẳn**, chỉ
còn dòng: *"Lệnh không rõ: "phong khach nen dung vat lieu gi". Thử L, PL, REC, C, A, W, ROOM, D, WIN,
M, CO, RO, MI, O, DIM, T, E, U."* Không có nút nào, kể cả nút *"Hỏi Vitals câu này"* — dù Vitals đang
đứng ngay cạnh trên cùng thanh đó và **nhận được đúng loại câu này**.
Ảnh: `50-cmd-enter.png`.
**Đáng lẽ phải gì.** `SPEC-NGON-NGU-CHI-DAN` — khuôn thông điệp lỗi **luôn kèm NÚT**. Câu người dùng
đã gõ không nên bị vứt khi ngay bên cạnh có chỗ nhận nó.
**Tái hiện.** Chặng 2D → bấm ô `Lệnh…` → gõ câu thường → Enter.

#### `A1-10` · P1 · Thanh trạng thái · chuột · CA①
**Thấy gì.** Bấm pill "Vitals" → nó nở thành ô *"Hỏi Vitals…"*, nhưng **con trỏ không vào ô**
(`activeElement` vẫn là chính cái pill). Phải bấm lần thứ hai mới gõ được. Khẩu độ Vitals ở mép trên
thì **có** tự nhận con trỏ — hai cửa vào cùng một thứ, cư xử khác nhau.
Ảnh: `51-pill-after-click.png`.
**Đáng lẽ phải gì.** Mở một ô nhập là để gõ. Và §3 EXS-1 *"một trải nghiệm, một mental model"*.
*Căn cứ: lẽ thường + tính nhất quán nội bộ.*
**Tái hiện.** Chặng 2D → bấm pill "Vitals" ở đáy màn → gõ ngay, chữ không vào.

#### `A1-11` · P1 · Vitals · chuột + cảm ứng · CA①
**Thấy gì.** Trong chặng 2D có **hai** cửa vào Vitals cùng lúc trên một màn: khẩu độ ở **mép trên**
(x=748, y=11) và pill "Vitals" ở **thanh trạng thái đáy** (x=674, y=873). Hai cái mở ra hai kiểu khác
nhau (xem A1-10) và ở hai đầu màn hình.
Ảnh: `40-stage-2d.png`.
**Đáng lẽ phải gì.** §4 **D-DR1**: *"Sau di trú phải còn **đúng một** chỗ đứng vật lý"*, và §3 EXS-7
Vitals nằm **vật lý ở mép trên**. Hành vi hữu ích của pill đáy (ô hỏi nhanh) nên được **hấp thu** vào
khẩu độ mép trên chứ không đứng song song.
**Tái hiện.** Mở `/projects/<id>/cad`, nhìn mép trên và thanh đáy.

#### `A1-12` · P1 · Rail + thanh trạng thái · **cảm ứng** · CA①
**Thấy gì.** Trên cảm ứng token `--tap` **đúng là 44px**, nhưng nhiều đích chạm không theo:
| Vật | Cỡ đo được |
|---|---|
| 3 mục Chặng trên rail (2D · 3D · Trình chiếu) | **224×32** (các mục Việc thì đã 44) |
| Ô "Hỏi Vitals…" ở thanh trạng thái | **218×17** |
| Pill "Vitals" ở thanh trạng thái | **92×24** |
| Mục trong menu tài khoản (kể cả "Đăng xuất") | cao **19–31** |
| Ô "Tìm trong kho" | **201×17** |
Ảnh: `70-touch-home.png` · `73-touch-pill.png` · `96-account-menu.png`.
**Đáng lẽ phải gì.** §7: *"Ô chạm `--tap` 32 · `--tap-lg` 44; cảm ứng override `--tap` lên 44"* — token
đã đổi nhưng những chỗ này không đọc nó.
**Tái hiện.** Mở `/` và `/projects/<id>/cad` trong ngữ cảnh cảm ứng, đo chiều cao các vật trên.

---

### 🟡 P2 — cấn mắt

#### `A1-13` · P2 · Khẩu độ Vitals · cảm ứng · CA①
Ô chạm của khẩu độ là 44×44 nhưng đặt ở **`y = -7`** — **7px trên cùng nằm ngoài màn**, chỉ còn 37px
thật sự chạm được. Ảnh: `71-touch-vitals.png`. *Nhận định của tôi, không có điều khoản.*

#### `A1-14` · P2 · Trang lỗi dự án · chuột · CA③
`/projects/<id-bịa>/cad` → trang lỗi trơ, không có rail. Câu chữ bảo *"Quay về **Thư viện dự án** để
chọn lại"* nhưng nút duy nhất ghi **"Home"** — tiếng Anh, giữa một giao diện tiếng Việt, và **không
khớp** với việc câu chữ vừa dặn. (Tương phản chữ đo được **15,01:1** — phần này đạt.)
Ảnh: `91-bogus-project.png`. *Căn cứ: `SPEC-NGON-NGU-CHI-DAN` — hành động trước, giọng tự nhiên,
cấm jargon; nhãn nút phải khớp câu dẫn.*

#### `A1-15` · P2 · Dòng lệnh CAD · chuột · CA①
Chữ mờ trong ô lệnh là: *"Gõ lệnh: L · PL · REC · C · W 200 · ROOM · D · WIN · M · CO · RO · MI ·
O 150 · DIM · T · E · U…"* — 20 chữ viết tắt nội bộ trong một ô rộng 84px. Ảnh: `46-cmd-mid.png`.
*Căn cứ: `SPEC-NGON-NGU-CHI-DAN` — ≤12 từ, cấm jargon nội bộ lộ UI.*

#### `A1-16` · P2 · Màn `/projects/default/notebook` · chuột · CA③
Mọi nhãn in **cả hai thứ tiếng cùng lúc** (*"Chưa có nguồn nào / Add sources to begin"*, *"Câu chuyện
thiết kế cho dự án này? · Design story for this project?"*), khác hẳn phần còn lại của app vốn chỉ
hiện một ngôn ngữ theo công tắc VI/EN. Hình khối cũng khác hệ: tab vuông, chip đen đặc, gạch 1px —
**trượt phép thử cứng "che logo, đặt 9 màn cạnh nhau vẫn nhận ra cùng một hệ"** (§4 HÌNH HỌC 20/08).
Ảnh: `13-vitals-expand.png`.

#### `A1-17` · P2 · Mép trên · chuột · CA①
Ở bề rộng 1024px, **ô tìm kiếm biến mất hoàn toàn** khỏi mép trên, không để lại nút kính lúp hay dấu
hiệu nào; ở 1024 cảm ứng thì nó bị khẩu độ Vitals **đè lên**, chỉ ló một nửa cái kính lúp.
Ảnh: `80-1024-desktop.png` · `70-touch-home.png`. *Nhận định của tôi, không có điều khoản.*

---

## 📌 KHÔNG PHẢI LỖI — nhưng phải ghi lại

**`A1-N1` · Token `--accent` chạy khác tài liệu.** `ACTIVE-DESIGN-CONTEXT` §7 ghi `--accent #6a57f5`
(tím); bản đang chạy trả **`#186adc`** (lam). Vòng focus **đọc đúng token** và **nhìn thấy rõ** (ảnh
`31-focus-rail.png`) — nên đây **không phải lỗi vòng focus**. Nhưng `app/globals.css` đang bị một làn
khác sửa dở, nên tôi **không kết luận** bên nào đúng; chỉ báo để người chốt màu đối chiếu.

**`A1-N2` · Một báo động giả của chính tôi, ghi để người sau không lặp.** Tôi từng đo ra *"ô `Lệnh…`
biến mất khỏi DOM khi gõ"*. **Sai** — bộ chọn của tôi bắt theo `placeholder`, mà placeholder đổi ngay
khi ô có chữ. Ô vẫn ở nguyên đó. Bài học: đừng nhận diện phần tử bằng thứ chính nó thay đổi.

## ✅ Những chỗ chạy đúng — ghi để khỏi sửa nhầm
- Tấm *"Không có tín hiệu nào / Mở Vitals…"* Hoà cấm: **không xuất hiện** trên mọi đường đã đi.
- Rê chuột vào khẩu độ khi không có tín hiệu (1,4s và 3,2s): **không bật gì**.
- `⌘J` mở Vitals và **biết ngữ cảnh** (ở chặng 2D đề mục là *"VITALS · THIẾT KẾ 2D"* với gợi ý riêng
  của chặng: *kiểm chuẩn tờ này · phòng nào chưa có vật liệu*). `Esc` đóng.
- Vòng focus **nhìn thấy rõ** ở cả hai kiểu đang dùng (viền 2px, và viền trong suốt + quầng 4px).
- Đường về nhà từ chặng: nhãn chữ hiện sẵn, **không cần hover**, chạy trên cả cảm ứng.
- Mục Chặng khi 0 dự án: **không chết**, có chú thích và dẫn tới chỗ tạo dự án.
- `--tap` **đổi đúng** 32 → 44 khi con trỏ thô.
- Back của trình duyệt từ chặng → về `/` đúng.

---

## CHƯA CHẮC / CHƯA ĐI ĐƯỢC

1. **Khẩu độ Vitals khi CÓ tín hiệu — chưa đi.** Suốt lượt aperture luôn ở trạng thái *"không có gì
   cần xem"*. Muốn có tín hiệu thật phải chạy một việc nền (render/hàng đợi) — tốn credit và đụng làn
   khác, nên tôi dừng. **Ba mức Ambient→Peek→Engage vì vậy chỉ kiểm được hai.**
2. **Ca RỖNG trên bàn phím và cảm ứng — chưa đi**, vì tài khoản hết rỗng giữa lượt (làn A2 tạo dự án).
3. Chỉ đo trên **Chromium 1194**. Safari/Firefox là suy đoán, không đo.
4. **Chưa thử trình đọc màn hình thật.** Các nhận định trợ năng dựa trên thuộc tính ARIA và hành vi
   Tab quan sát được, không dựa trên VoiceOver/NVDA.
5. **Chưa thử `prefers-reduced-motion`** — không nhánh chuyển động nào được kiểm.
6. Cử chỉ **nhấn giữ / vuốt** trên khẩu độ Vitals — chưa thử; chỉ thử chạm đơn.
7. `A1-07` tôi **không** kiểm hết xem có chữ nào của dự án thật rò ra màn ẩn danh hay không; tôi chỉ
   xác nhận **mọi API đều 401**. Kết luận "không lộ dữ liệu" chỉ chắc tới mức đó.
8. Danh sách đích chạm nhỏ ở `A1-12` là **sàn, không phải trần** — tôi liệt kê những cái gặp trên
   đường đi, không quét toàn bộ app.
