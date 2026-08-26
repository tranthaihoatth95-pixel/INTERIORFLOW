# AUDIT 22/08/2026 — NỘI DUNG HOME + SIDEBAR
Phiên UX/UI **DESIGN-ONLY**. Toàn bộ số dưới đây **đọc từ DB thật + code thật**, không suy đoán.
**Không phá fixture** — chỉ đảm bảo chúng KHÔNG được phép định nghĩa mặc định production tương lai.

---

## A · 🔴 PHÁT HIỆN NẶNG NHẤT — "21/21" LÀ RÁC TEST, KHÔNG PHẢI DỰ ÁN

`sqlite3 prisma/dev.db` → **15 Project · 52 Flow**. Phân loại toàn bộ 15:

| Loại | Số | Ví dụ tên thật trong DB |
|---|---|---|
| **NOTEBOOK-PLACEHOLDER** | **5** | `__nb:untitled-flow` · `__nb:nonexistent-project` · `__nb:cmrqo009h0003w9ddwcuxaki6` |
| **TEST-FIXTURE** | **4** | `Dự án verify inline input` · `Enter test 2` · `Test B3 (phục hồi backup)` · `M-SCOPE test rỗng` |
| "CANDIDATE-REAL" | 6 | `Nháp` ×2 · `Dự án mới` · `Dự án guard` · `Căn hộ mẫu · Studio 48m²` ×2 |

⇒ Soi tiếp 6 cái "có vẻ thật": `Nháp` là **bản nháp trùng đôi** · `Dự án mới` là **vỏ rỗng** ·
`Dự án guard` là **fixture test guard** · `Căn hộ mẫu · Studio 48m²` là **seed demo, cũng trùng đôi**.

> ### **SỐ DỰ ÁN THẬT CỦA NGƯỜI DÙNG = 0.**
> Con số **21/21** và **"19 Bản nháp"** trên Home hiện nay được **đếm từ rác test + placeholder +
> bản trùng**. Nó **không đo cái gì có thật**.

Đây chính là bằng chứng cứng cho việc **TRẠNG THÁI DÙNG-LẦN-ĐẦU MỚI LÀ TRẠNG THÁI THẬT**, và
Home hiện tại đang che nó bằng một đống số vô nghĩa.

## B · BẢNG PHÂN LOẠI TỪNG THỨ ĐANG HIỆN TRÊN HOME

| Thứ đang hiện | Loại | Bằng chứng | Xử lý cho production |
|---|---|---|---|
| Lời chào **"Chào Tour"** | **DEMO** | `User demo_seed_001 · Demo Tour` | tên THẬT của người đăng nhập; seed thì không được làm mặc định |
| **21/21** | **RÁC TEST** | 9/15 là `__nb:`/fixture | **CẤM** làm số mặc định. Không có dự án thật ⇒ **ẨN**, không hiện `0/0` |
| **"19 Bản nháp"** | **RÁC TEST** | gộp từ cùng nguồn trên | như trên |
| Ảnh bìa dự án demo | **FIXTURE** | seed `Căn hộ mẫu · Studio 48m²` | chỉ hiện khi dự án THẬT có bìa thật |
| **"VIỆC ĐANG DỞ · Nháp · Thiết kế 2D · hôm nay"** | **THẬT — nhưng do PHIÊN NÀY tạo ra** | MAIN mở `/projects/…/cad` lúc 14:2x hôm nay | hành vi resume **đúng**; dữ liệu là của phiên kiểm thử |
| **"ẢNH ĐẸP TUẦN NÀY"** = ảnh render/viewport | **SAI NGUỒN** | `WeeklyImage.tsx:6` → `usage:'ref-render'` từ `/api/library` | phải là **Gallery/Explore có provenance**; không có ⇒ **ẨN** |
| ảnh bị cắt cụt/phóng to | **LỖI** | `WeeklyImage.tsx:58` `object-cover` | đổi sang hành vi **`contain`** |
| Vitals *"không có tín hiệu"* · Hoạt động *"không có gì đang chạy"* | ✅ **THẬT & ĐÚNG** | đo trên app | **GIỮ** — đây là mẫu khai-thật đáng nhân rộng |

### Luật rút ra
**Không có dữ liệu thật ⇒ ẨN Ô ĐÓ.** Không hiện `0`, không hiện khung rỗng, không bịa một tấm
ảnh/một con số cho đỡ trống. (Đúng luật đã chốt: *widget thiếu dữ liệu TỰ ẨN*.)

---

## C · SIDEBAR — BẢNG SO HÀNH VI (không sửa gì, chỉ đo)

**Target chính tắc:** `docs/mocks/mock-sidebar-ban-do-2026-08-22.html` (chỉ số ghi COMPLETE).
**Chủ sở hữu code:** `components/nav/RailDieuHuong.tsx` + `components/studio/AppShell.tsx`.

| Hành vi bắt buộc | Có trong code? | Bằng chứng |
|---|---|---|
| rail **52px nằm TRONG dòng chảy** | ✅ | đo app thật: rail wrap `w=52` |
| nấc mở **NỔI ĐÈ** lên nội dung | ✅ | `position:absolute` trong `RailDieuHuong` + `AppShell` |
| **không bóp** Home/canvas | ✅ | đo app thật: tấm 240 mở mà canvas `left=88` |
| **tự thu** sau ân hạn | ✅ | hằng số `320` (ms) có trong `RailDieuHuong` |
| **ghim** giữ tấm | ✅ | `ghim` trong `RailDieuHuong` |
| **Esc** thu | ✅ | `Escape` trong `RailDieuHuong` + `AppShell` |
| **focus bàn phím giữ mở** | ✅ | `onFocusCapture` trong `RailDieuHuong` |

> ### Kết luận sidebar — nói cho chính xác
> **HÀNH VI: ĐỦ 7/7, đã kiểm trên app thật.**
> **THỊ GIÁC: CHƯA PHẢI BẢN CUỐI** — vỏ mới (rail + top shell + Vitals Edge) đang nằm trong
> `claude-home-living-canvas-final.html`, và bản đó **chưa được Hoà duyệt mắt**.
> ⇒ **KHÔNG được để rail cũ nguyên đó rồi tuyên bố Home đã hội tụ.**
> Việc còn lại là **thị giác**, không phải hành vi — đừng đi sửa lại logic đang đúng.

---

## D · HỢP ĐỒNG ẢNH — KHOÁ LẠI (nhắc, chi tiết ở transfer note riêng)
Ảnh cảm hứng Home **PHẢI** đến từ **Gallery/Explore thật**, mang danh tính + nguồn (`img_…`).
**CẤM**: ảnh chụp app · ảnh chụp viewport 3D · "ảnh đẹp tuần này" bịa · ảnh fixture.
Trình bày: **giữ tỉ lệ · đọc được trọn bố cục · mặc định `contain`**, không cover-crop khổng lồ.
> **Ảnh là NỘI DUNG. Khung PHỤC VỤ ảnh.**

---

## E · ⛔ RÁC TEST KHÔNG ĐƯỢC LÀM ĐẦU VÀO THIẾT KẾ (chốt 22/08)

Mục A chứng minh **21/21 = rác fixture + placeholder + bản trùng**, số dự án THẬT = **0**.

⇒ Hệ quả bắt buộc, ghi để không ai hiểu nhầm:

| Thứ | Địa vị đúng |
|---|---|
| Bản vẽ "kệ lùi xa cho 21 dự án" (`claude-home-widget-system.html`) | **NGHIÊN CỨU TRÀN, TƯƠNG LAI** — thuộc *Active Home*, **KHÔNG** phải First-Use Home |
| Bộ 6 widget nói chung | **HỆ NỘI DUNG TƯƠNG LAI**, chỉ hiện khi trạng thái THẬT xứng đáng |

**Lời giải "kệ lùi xa" KHÔNG được trình bày như một giải pháp đã được thực tế sản phẩm xác nhận** —
đầu vào của nó (21 dự án) là rác. Nó vẫn có giá trị như một khảo sát tràn, và chỉ vậy.

> **Rác test không bao giờ được trở thành đầu vào thiết kế.**

### First-Use Home — phạm vi ĐÓNG BĂNG, chỉ 6 thứ
① trường ambient · ② Sidebar Map chính tắc · ③ vỏ trên nhẹ · ④ vạch Vitals mảnh, khoẻ ·
⑤ lời chào khẽ · ⑥ **MỘT** hành động vào chính.
Tuỳ chọn: **một** vật thể không-gian/vật-liệu do hệ tuyển chọn — **chỉ khi bố cục thật sự đẹp hơn nhờ nó.**

⛔ **CẤM trên màn dùng-lần-đầu:** kệ dự án · việc đang dở · ghi chú nhanh · widget vật liệu ·
món thư viện · cảm hứng · đầu ra gần đây · ảnh gallery · preview 3D dự án · lịch sử giả · số giả.

### Ánh sáng ngày KHÔNG phải một vật trên trang
**CẤM**: cung mặt trời · biểu đồ · `05:00` / `20:00` · nhãn `5600K` · mọi telemetry.
Ánh sáng ngày **chỉ được** tác động: hướng sáng · ấm/lạnh · độ mềm bóng đổ · phản ứng của kính ·
không khí. **Là VẬT LÝ MÔI TRƯỜNG, không phải số liệu đọc được.**

### Vỏ trên phải NÓI THẬT ở zero-state
Không `Untitled flow`, không tên dự án/workspace giả khi chưa có gì. Vỏ trên gần như tan vào ambient.

### Nhân vật chính
**Nhân vật chính của First-Use Home là CHÍNH KHÔNG GIAN AMBIENT.** Vỏ và hành động SỐNG BÊN TRONG nó.
Câu nghiệm thu: *"Hoà có sẵn lòng để app mở nguyên màn này, không dự án, không gì đang chạy, mà vẫn thấy dễ chịu không?"*
Nếu không ⇒ **bố cục ambient chưa đủ tốt**, và đó là chỗ phải sửa — không phải chrome.

---

## F · VITALS — ĐO LẠI 22/08, VỎ vs BẢN ĐANG CHẠY (Lane B trả claim, Lane A kiểm chứng)

🔴 **`components/home/widgets/VitalsPill.tsx` là VỎ MỒ CÔI — KHÔNG mount ở đâu cả.**

| Kiểm | Kết quả |
|---|---|
| tham chiếu ngoài chính tệp | **toàn là COMMENT** — 0 import, 0 JSX, **0 call site** |
| `AppChrome.tsx:362` | tự khai: *"`VitalsPill` bản chỉ-Home **đã thôi mount**"* |
| `git show HEAD:components/studio/AppChrome.tsx \| grep -c VitalsPill` | **0** ⇒ mồ côi **từ 17/08**, KHÔNG phải do việc tách 22/08 |
| số dòng | **67** — chỉ vỏ trình bày |
| bản ĐANG CHẠY | **`components/studio/VitalsAperture.tsx`** (`AppChrome.tsx:42` import thật) |
| hành vi | đã tách sang `components/studio/VitalsChatSurface.tsx` |

⛔ **Không lấy `VitalsPill.tsx` làm căn cứ thiết kế Home/Vitals** — một cái vỏ chưa từng có chỗ đứng
thì không phải bằng chứng về thứ đang ship. ⛔ **Không remount khi Hoà chưa có quyết định sản phẩm.**

> Bài học cùng họ với "21/21 là rác test": **thứ có trong mã ≠ thứ tới được người dùng.** Một tệp
> đọc như đang sống, có docstring đàng hoàng, mà **0 call site** — grep tên thấy có, nhưng nó chưa
> bao giờ lên màn. Phải đếm **nơi GỌI**, không đếm **nơi NHẮC TÊN**.

### Đính chính đề xuất zero-state của Lane A
Đề xuất *"ẩn Vitals + Hoạt động ở zero-state"* nhắm vào **bề mặt ĐANG CHẠY** (`VitalsAperture` +
điều khiển Hoạt động ở vỏ trên) — **KHÔNG** phải `VitalsPill`. Vẫn chỉ là **ỨNG VIÊN**, chưa thi công.
Lane B giữ **năng lực + hợp đồng trạng thái** của Vitals; nếu Hoà duyệt thì Lane A chỉ đổi **việc vỏ
Home có hiện hay không**, tuyệt đối không gỡ/đổi năng lực bên dưới.
