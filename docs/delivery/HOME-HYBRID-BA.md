# HOME · HYBRID B×A (khí quyển C) — NGHIÊN CỨU CHI TIẾT · CHỜ MẮT HOÀ

> **Quyết định của Hoà 04/09:** không chọn nguyên A, B hay C. Bản chính thức là
> **xương sống B × ngôn ngữ A × khí quyển C**. Ba nghiên cứu A/B/C thành **ứng viên đã xét**
> (`HOME-NGHIEN-CUU-BO-CUC.md`, đã đóng dấu).
>
> **Trạng thái: 0 DÒNG MÃ.** Bốn khung dưới đây là bản vẽ HTML, khổ thật, token chép từ
> `app/globals.css`. Máy đã soi hết phần máy phán được. **Hoà chỉ cần đánh ĐẠT hoặc SỬA.**
>
> Bản vẽ: `docs/mocks/mock-home-hybrid.html` · `-rong.html` · nền chung `_home-hybrid.css`
> Ảnh: `docs/delivery/anh-duyet-mat/lo-03-home-hybrid/` (6 tệp — 4 khung quyết định + 2 biến thể nền)

## BỐN KHUNG QUYẾT ĐỊNH

| # | Trạng thái | Phán gì | Giới hạn đã biết |
|---|---|---|---|
| **1** | **1600×900 · CÓ VIỆC DỞ** (nền tối) | Bản vẽ có **trội** đúng mức không? Cột chữ trái có **đủ nặng** để cân với nó không? | Bản vẽ là **dữ liệu DEMO** (đã đóng dấu trên ảnh) — hình học thật, số liệu bịa |
| **2** | **1600×900 · TRẠNG THÁI RỖNG** (nền sáng) | `RESUME → BEGIN` có ra **studio tĩnh** không, hay ra màn onboarding? Khoảng trống phải nửa màn: **có chủ ý** hay **bỏ hoang**? | Chưa có chuyển động; chưa có trạng thái *"đang tải"* |
| **3** | **1280×800 · CÓ VIỆC DỞ** (nền sáng) | Thứ bậc **trội → đỡ → nền** có giữ nguyên khi hẹp lại không? | Eyebrow xuống dòng lẻ chữ *"QUA"*; chưa vẽ dưới 1280 |
| **4** | **1600×900 · CÓ VIỆC DỞ** (nền sáng) | Cùng bố cục ở nền sáng — khí quyển LightClock có **quá tay** không? | Khí quyển mới có **một** thời điểm (chiều muộn); chưa vẽ sáng/trưa/đêm |

## BẢN NÀY THI HÀNH ĐIỀU GÌ

**§21 · XƯƠNG SỐNG B** — không còn cột widget phải. Đối tượng trội là **hiện vật công việc thật**:
mặt bằng tầng 2 với tường, cửa có cung mở, cửa sổ, đường kích thước, tên phòng và diện tích — và
**vùng khoanh đỏ đứt nét ngay chỗ chưa xong**. Nhìn phát biết *đang làm gì · đang ở đâu · còn gì*.

**§22 · QUAY LẠI** — nhãn nói chặng và giờ dừng · tên dự án 52px · ba dữ kiện ngữ cảnh · **một
dòng "vì sao nên quay lại"** (*khu bếp + ăn chưa gán vật liệu sàn*) · CTA cụ thể
**"Mở lại mặt bằng tầng 2 →"**. Không có ô đánh dấu, không danh sách việc — không phải thẻ quản lý việc.

**§23 · NGÔN NGỮ A** — **không một thẻ nào** cho lời chào · ghi chú · hoạt động · số chặng · tin tức.
Gom nhóm bằng **canh lề · cỡ chữ · khoảng trắng · vạch mảnh · vị trí**. Lời chào + giờ + ánh sáng
gộp thành **một dòng** ở đỉnh.

**§24 · KHÔNG BIẾN THÀNH THANH CÔNG CỤ** — thứ phụ **xếp hạng**, không dàn đều:
· *Dự án khác* = **danh sách đọc được**, có thumbnail nhỏ (chuyển việc là hành vi tần suất cao)
· *Số chặng + tin xưởng* = **cụm chữ căn phải**, nhỏ hơn hẳn
· *Ghi nhanh* = **theo yêu cầu** — một dòng mời gõ kèm phím `N`, không chiếm chỗ thường trực.

**§25 · KHÍ QUYỂN C** — một vệt sáng ấm rất nhạt ở góc trên-trái, đọc ra là *chiều muộn* chứ không
đọc ra *hiệu ứng*. Không ảnh nền, không landing page.

**§26 · TRẠNG THÁI RỖNG** — `RESUME → BEGIN`. Một lời mời, **một** hành động chính (*Tạo dự án
mới →*), hai lối phụ là **chữ có gạch chân** chứ không phải nút, một dòng thứ ba dẫn sang thư
viện cảm hứng. **Không sáu thẻ onboarding.**

**§27 · CHROME LÙI** — rail 52px, không nền, không viền đậm; icon mờ 34%.
**§30 · DẤU HIỆU CÒN TIẾP** — *"còn 4 dự án nữa ↓"* nói bằng **chữ**, không trông vào thanh cuộn.

## MÁY ĐÃ KIỂM GÌ (§33)
```
6/6 khung sạch — 1600×900 và 1280×800, cả hai nền
  tràn khung        0
  vượt khổ          0  (scrollWidth/Height khớp viewport)
  chữ dưới ngưỡng   0  (WCAG 4.5:1 chữ thường · 3:1 chữ lớn)
```
Máy chạy bằng `scripts/soi-ban-ve.mjs`.

🔴 **Máy bắt được 2 lỗi thật ở lượt đầu, đã sửa trước khi trình:**
1. **13 chuỗi chữ nhỏ dùng `--t4` chỉ đạt 2,65:1 (sáng) / 3,88:1 (tối)** — dưới ngưỡng. Đổi sang
   `--t3`. Nhãn `DỮ LIỆU DEMO` 3,04:1 cũng sửa: nó là **lời khai**, phải đọc được.
2. **Ba nút ở trạng thái rỗng cùng một hình dạng đầy màu** ⇒ *thông tin ngang hạng*, đúng cờ đỏ
   N-10. Nay chỉ nút đầu là hành động chính; hai lối kia thành chữ gạch chân.

⚠️ **Và máy tự đẻ một lỗi giả, ghi lại vì nó suýt làm hỏng việc:** lượt soi đầu chấm chữ **trong
bản vẽ** là **1,04:1**. Bản vẽ không hỏng — **máy đo hỏng**: SVG tô bằng `fill` chứ không phải
`color`, máy đọc `color` kế thừa từ body nên so nhầm mực tối với nền tối. Nếu tin nó, tôi đã đi
"sửa" một bản vẽ đang đúng. Đã tách nhánh SVG và ghi lý do ngay trong máy soi.
**Máy đo cũng phải được hiệu chuẩn trước khi tin nó** — đây là lần thứ tư trong ngày bài học này quay lại.

## ⚠️ CHƯA CHỨNG MINH — khai thẳng
1. **Chưa chạy trên app thật.** Đây là bản vẽ tĩnh; chưa có dữ liệu thật, chưa có trạng thái tải.
2. **Bản vẽ là DEMO** — hình học đúng kiểu mặt bằng nội thất, số liệu bịa. Bản thật vào có thể
   rối hơn (nhiều lớp, ghi chú, ký hiệu) và **có thể phải cắt khung hoặc chọn vùng đáng nhìn**.
3. **Khí quyển mới một thời điểm.** Chưa vẽ sáng · trưa · đêm; chưa biết ban đêm còn đủ tĩnh không.
4. **Chưa có trỏ vào / chuyển động / focus bàn phím.**
5. **Chưa vẽ dưới 1280.** Bento ở khổ hẹp chưa đối chiếu với bản này.
6. **Chưa đo bằng trình đọc màn hình.**
7. Trạng thái rỗng để trống gần nửa màn bên phải — **có chủ ý**, nhưng đây đúng là chỗ Hoà đã bắt
   lỗi *"khoảng trống tình cờ"* lần trước, nên xin phán riêng.

## SAU KHI HOÀ ĐÁNH
· **ĐẠT** → mới thi công: `code → máy kiểm → ảnh app thật → so bản vẽ ↔ app → mắt duyệt cuối`.
· **SỬA** → nói chỗ lệch, sửa **bản vẽ** rồi trình lại; **không** đụng mã.
