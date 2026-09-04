# SỔ LỖI SẢN PHẨM — tách riêng, không chôn dưới việc thị giác

> Lệnh Hoà 04/09: *"Maintain a separate PRODUCT DEFECT QUEUE… Do not bury it under visual work."*
> Lỗi P0/P1 được xếp lịch **độc lập**, miễn không làm hỏng các nghiên cứu thị giác đang chạy.

## D1 · P0 — MẤT DỮ LIỆU ÂM THẦM KHI VÀO THẲNG DEEP-LINK

**Triệu chứng.** Người dùng **đã đăng nhập** (phiên máy chủ hợp lệ) mở thẳng một route studio —
tab mới · bookmark · F5 — làm việc, và **việc không được lưu**. Không báo lỗi. Không có dấu hiệu nào.

**Cơ chế, đo tại nguồn 04/09.** Định danh dùng để ghép khoá lưu trữ đọc từ `localStorage`
(`lib/resume.ts:22` `interiorflow.lastUserId`), mà khoá đó **chỉ được GHI ở đúng hai chỗ**:
```
components/home/HomeScreen.tsx:264   ← phải đi qua Home
components/entry/LoginForm.tsx:135   ← phải đăng nhập TRONG chính trình duyệt đó
```
⇒ Vào thẳng deep-link mà không qua hai cửa đó thì `getLastUserId()` trả **`null`**, và
`lib/project-scope.ts:62` cùng các `*Sheets.tsx` rơi về đường không-có-user.

**Vì sao là P0.** Máy chủ **BIẾT** người này là ai (có `app/api/auth/me`). Việc mất mát xảy ra
**không phải vì thiếu thông tin**, mà vì lưu trữ neo vào **nguồn yếu hơn** (localStorage) trong khi
**nguồn mạnh hơn** (phiên máy chủ) nằm ngay đó. Đây đúng cái Hoà gọi tên: *storage identity depends
on localStorage instead of server auth state*.

**Hướng sửa.** Định danh lấy từ **trạng thái đăng nhập máy chủ**; `localStorage` hạ xuống vai **bộ
nhớ đệm**, không phải nguồn sự thật. Không đổi hình dạng khoá đã ghi ra đĩa của người dùng.
⚠️ Cấm sửa kiểu vá điểm: đây là **lần thứ ba** cùng một họ bệnh (⌘Z · Delete · lần này) — phải sửa
ở tầng nguồn, không thêm một chỗ gọi `getLastUserId()` nữa.

**Trạng thái:** 🔵 đang sửa — làn A.

---

## D2 · P2 — WorkHub có mặt AI thứ hai, và nó nói dối việc nó vừa làm
`components/workhub/WorkHubShell.tsx:140` trả lời gõ cứng, `grep "fetch("` = **0**; `:150`/`:195`
khẳng định *"đang dùng ngữ cảnh từ …"* mà **không dòng nào đọc nội dung pane**.
Trái chốt 04/09 *trong IF mặt AI là Vitals*. **Không chặn ship** (WorkHub không nằm trong luồng nghề
lõi), nhưng nút-nói-dối tệ hơn nút-chết ⇒ gỡ mặt trợ lý khi mở phiếu WorkHub. ⬜ chưa mở.

---

## D3 · P1 — ĐỆM ĐỊNH DANH KHÔNG ĐƯỢC RỬA KHI ĐĂNG XUẤT

**Phát hiện 04/09, ngoài phạm vi phiếu D1** — và nó là **ca ghi-nhầm-khoá**, thứ mà D1 kết luận
*không* xảy ra ở đường deep-link. Nó tới bằng một cửa khác.

**Đo tại nguồn.** Bốn chỗ đăng xuất — `AccountSettings:54` · `AccountMenu:137` · `MobileMenu:160` ·
`PixelSettingsShell:191` — chỉ xoá cookie và `setUser(null)`. **Không chỗ nào xoá `lastUserId`.**
`quenDemTrongBoNho()` tự khai *"chỉ dùng trong test"*. Cộng thêm `danh-tinh-phien.ts:82-83` trả
`da-co` **không xác thực lại**.

**Hệ quả trên MÁY DÙNG CHUNG:** A đăng xuất → B đăng nhập → việc trong tab cũ vẫn còn của A có thể
ghi vào **bucket của A**. Đây đúng thứ docstring của chính mô-đun đó cấm.

**Vì sao nay mới thành nghiêm trọng:** bệnh có sẵn từ trước, nhưng D1 vừa nâng định danh lên vai
**nguồn sự thật** cho đường lưu trữ — nên một đệm bẩn nay kéo theo hậu quả nặng hơn nhiều so với
khi nó chỉ phục vụ coachmark.

**Hướng sửa.** Đăng xuất phải rửa đệm ở **một chỗ dùng chung** (bốn chỗ tự rửa là mọc chỗ thứ năm),
và `docDem()` không được tin đệm mà không đối chiếu phiên máy chủ khi phiên đã đổi.

**Trạng thái:** ⬜ chưa mở phiếu — **không chặn ship** cho bản dùng một-người-một-máy, nhưng phải
đóng trước khi có studio nhiều người dùng chung máy.

---

## D4 · P4 — NĂM NƠI ĐỘC LẬP CÙNG GỌI `/api/auth/me`

`HomeScreen:366` · `SessionWatch:36` · `PresentStageScreen:66` · `danh-tinh-phien:143` — không dùng
chung một lượt gọi, **mỗi nơi tự diễn giải 401/503 theo kiểu riêng**. Và `SessionWatch` **biết**
người dùng là ai nhưng không nói cho ai biết.
Đúng cụm *"một cỗ máy nhiều mặt tiền"*. Không chặn ship; gom khi mở phiếu phiên đăng nhập.
