# HƯỚNG DẪN SỬ DỤNG — InteriorFlow

> Dành cho người dùng trong team TTT — **không cần biết kỹ thuật**. Đọc lần lượt từ trên xuống;
> mỗi mục là một việc cụ thể, làm theo từng bước là được.

InteriorFlow là app làm việc theo **3 chặng** của một dự án nội thất:
**CAD (bản vẽ) → RENDER (ảnh phối cảnh) → PRESENT (dàn trang thuyết trình)** — tất cả trong một
chỗ, dữ liệu tự lưu, làm dở hôm nay mai mở lên làm tiếp.

---

## 1. Cài đặt / Mở app

Có 3 cách dùng — team phát cho bạn cách nào thì theo cách đó:

**a) Máy Mac — file `InteriorFlow-0.1.0-arm64.dmg`**
1. Mở file `.dmg`, kéo icon **InteriorFlow** vào thư mục **Applications**.
2. ⚠️ Lần đầu mở, macOS sẽ chặn vì app chưa ký số (app nội bộ, bình thường). Cách mở:
   **chuột phải (hoặc giữ Control + click) vào icon app → chọn Open → bấm Open** ở hộp thoại.
   Chỉ cần làm 1 lần, các lần sau mở bình thường.
   - Nếu vẫn bị chặn: mở **System Settings → Privacy & Security**, kéo xuống thấy dòng
     "InteriorFlow was blocked…" → bấm **Open Anyway**.

**b) Máy Windows — file `InteriorFlow Setup 0.1.0.exe`**
1. Chạy file Setup. Nếu hiện màn hình xanh "Windows protected your PC": bấm **More info**
   → **Run anyway** (app nội bộ chưa ký số — không phải virus).
2. Cài Next → Install, xong mở từ Start Menu.

**c) Trên web / iPad / điện thoại (bản PWA)**
1. Mở địa chỉ team đưa (dạng `https://….vercel.app`) trong Safari/Chrome.
2. Muốn thành app ở màn hình chính: Safari bấm nút **Share → Add to Home Screen**;
   Android bấm **⋮ → Install app**.

---

## 2. Đăng nhập

Màn hình đăng nhập nền kính mờ (có thể đổi nền: 4 màu có sẵn hoặc tự tải ảnh lên).

- **Tài khoản email công ty**: nhập email `…@ttt.vn` + mật khẩu do admin cấp.
- **Hoặc bấm "Đăng nhập với Google"**: chỉ nhận tài khoản Google thuộc domain **@ttt.vn**
  (vài tài khoản cũ ngoài domain đã được giữ lại theo danh sách — nếu bạn thuộc diện này thì
  vẫn vào bình thường).
- **Ghi nhớ đăng nhập**: tick ô **Ghi nhớ** → 30 ngày không phải đăng nhập lại.
  Không tick → đóng trình duyệt/app là phải đăng nhập lại (dùng khi ngồi máy chung).
- **Quên mật khẩu?** App không có nút tự đặt lại — **nhắn admin** (quản trị hệ thống) để được
  cấp mật khẩu mới, rồi đăng nhập lại như thường.
- Không có nút Đăng ký — tài khoản mới do admin tạo.

---

## 3. Gallery — nơi chứa các dự án

Đăng nhập xong là vào thẳng **Gallery**: mỗi ô là một dự án (flow) của bạn.

- **Mở dự án**: bấm vào ô. App **tự nhớ bạn đang làm dở ở đâu** — mở lại là về đúng chặng,
  đúng trang (sheet) lần trước.
- **Tạo dự án mới**: nút **Dự án mới**.
- **Đổi ảnh bìa**: mỗi dự án có thể tải ảnh bìa riêng cho dễ nhận.
- **Tìm kiếm**: khi có nhiều dự án (trên 8), Gallery chuyển thành lưới kèm **ô tìm kiếm** —
  gõ tên dự án để lọc nhanh.
- Ô có **icon người** = dự án bạn là chủ (owner).

---

## 4. Ba chặng làm việc & thanh Dock

Trong dự án, **thanh Dock** (dải kính mờ ở trên) là chỗ điều khiển chính:

- 3 nút chặng **CAD · RENDER · PRESENT** — bấm để chuyển chặng, có hiệu ứng chuyển cảnh nhẹ.
- Chặng nào làm xong sẽ được đánh dấu; chuyển qua lại thoải mái, không mất dữ liệu.

### 4a. Chặng CAD — vẽ / kiểm tra mặt bằng

- Vẽ hoặc mở bản vẽ mặt bằng (nhận DXF; PDF vector đã convert cũng dùng được).
- Gõ lệnh **trực tiếp bất kỳ đâu trên canvas** (kiểu AutoCAD): gõ chữ là hiện ô lệnh +
  gợi ý tự hoàn thành; **Enter lặp lệnh vừa dùng**; **F12** bật/tắt nhập số theo con trỏ.
- **App tự đoán loại không gian** (nhà ở / văn phòng / F&B…) từ đồ nội thất trong bản vẽ —
  hiện ở panel với độ tin cậy (vd "residential 59% — 1 giường").
- **Kiểm chuẩn (TCVN)**: panel Kiểm chuẩn đối chiếu bản vẽ với tiêu chuẩn Việt Nam
  (vd bếp tối thiểu 10m² theo TCVN 4451:2012) **theo đúng loại không gian đã đoán**.
  Mỗi cảnh báo có giải thích lý do — app **chỉ nhắc, không tự sửa** bản vẽ của bạn.

### 4b. Chặng RENDER — ra ảnh phối cảnh

- Canvas dạng **node**: kéo ảnh (clay 3ds Max, sketch tay…) vào, nối qua node AI để ra ảnh
  phối cảnh. Không có key AI thì node báo "chưa cấu hình" — các phần khác vẫn dùng bình thường.
- Ưng ảnh nào, bấm nút **"Đưa sang Present →"** ngay trên node ảnh — ảnh được gửi thẳng
  sang chặng Present (có toast xác nhận), khỏi phải export/import tay.

### 4c. Chặng PRESENT — dàn trang thuyết trình

- **Generate deck**: app tự dàn các trang thuyết trình từ nội dung + ảnh đã có.
- **Kệ layout (LayoutShelf)**: dải thẻ gợi ý bố cục (21 kiểu). Với mỗi gợi ý:
  - **Nhận** = dùng bố cục đó · **Bỏ** = không ưng.
  - App **học gu của bạn** từ các lần Nhận/Bỏ — sau khoảng 10 lần, thứ tự gợi ý tự xếp lại
    theo đúng gu, và **nhớ qua các lần mở app**. Di chuột lên thẻ có tooltip giải thích
    vì sao nó được gợi ý.
- Trang quá trống / quá chật / chữ tràn → app hiện **cảnh báo nhẹ** (toast) để bạn cân lại.

---

## 5. Trang (sheet) — tối đa 5, tự lưu

- Cả CAD lẫn Present đều làm việc theo **sheet** (trang) — tối đa **5 sheet** mỗi chặng.
- **Tự lưu liên tục** (khoảng 1 giây sau mỗi thay đổi) ngay trên máy — mất mạng, đóng app
  đột ngột cũng không mất bài. Mở lại là về đúng sheet đang làm.
- Mỗi người dùng có bản lưu riêng — không dẫm lên bài của người khác.

---

## 6. Xuất file

Ở chặng Present, mở menu **Export** — có 3 định dạng:

| Định dạng | Dùng khi |
|---|---|
| **PDF** | Gửi khách xem / in — trình bày cố định, mở đâu cũng giống nhau. |
| **PPTX** (PowerPoint) | Cần chỉnh tiếp trong PowerPoint — đúng khổ 16:9, ảnh nhúng sẵn trong file. |
| **PNG** | Lấy từng trang làm ảnh (gửi Zalo, chèn tài liệu khác). |

Chặng CAD xuất được **DXF** (mở lại trong AutoCAD).

---

## 7. Chế độ 2 khung (dual-pane) — màn rộng / máy gập

Thêm `?dualpane=1` vào cuối địa chỉ (vd `…/present-editor?dualpane=1`):

- Màn hình **rộng từ ~840px** (iPad ngang, máy gập mở, monitor): hiện **2 khung cạnh nhau**.
- Thu hẹp cửa sổ / gập máy lại: tự về 1 khung, **không mất trạng thái đang làm**.

---

## 8. Tour hướng dẫn trong app

Lần đầu vào, app có **tour 4 bước** chỉ tận nơi các nút chính. Lỡ tắt thì cứ dùng theo
hướng dẫn này — các mục ở trên theo đúng thứ tự thao tác thật.

---

## 9. Hỏi nhanh

| Câu hỏi | Trả lời |
|---|---|
| Mất mạng có làm được không? | Bản desktop (.dmg/.exe): được — mọi thứ chạy trên máy. Bản web: cần mạng. |
| Bài của tôi lưu ở đâu? | Desktop: trong máy (tự động). Web: trên server team. Sheet đang mở còn có bản tự-lưu cục bộ trên trình duyệt. |
| Render AI báo "chưa cấu hình"? | Máy đó chưa gắn key AI — nhắn admin, hoặc dùng máy render công ty (đã nối ComfyUI). |
| Muốn thêm tài khoản cho người mới? | Chỉ admin tạo được — nhắn admin kèm email @ttt.vn của người đó. |
| App Mac/Win báo chặn khi mở? | Xem lại mục 1 — chuột phải → Open (Mac) / More info → Run anyway (Windows). |
