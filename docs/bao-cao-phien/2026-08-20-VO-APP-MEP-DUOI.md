# Báo cáo · Mẫu vỏ app — 3 nấc sidebar + mép dưới ngữ nghĩa (20/08)

Tệp: `docs/mocks/mock-exs-vo-app-mep-duoi.html` — nguyên mẫu **kỹ thuật/tương tác**, không phải bản duyệt thị giác (ghi rõ ở đầu tệp và trên chính khung nhìn).

## 1 · Dựng được mấy trong 6 — 6/6, cùng một khung nhìn

| # | Thứ | Trạng thái |
|---|---|---|
| ① | Rail 56 | ✅ sống, mặc định |
| ② | Thềm 248 | ✅ sống (đổi nấc bằng nút, do người dùng gây ra) |
| ③ | Bảng làm việc 320–440 | ✅ sống + **kéo giãn thật** (pointer drag, kẹp 320–440) |
| ④ | Dải hành động mép dưới | ✅ 4 biến thể đổi được: `Đã áp vật liệu · 4 đối tượng · Hoàn tác` / `Spec đã cập nhật · 1 mục cần kiểm · Xem mục` / `Kết xuất xong · Mở` / `3 đầu ra đã cũ · Xem lại` |
| ⑤ | Viên ngữ cảnh | ✅ `Đã kiểm · Ghế F-01 · 3 nơi dùng · Thay · Nguồn` — **2 hành động**, bật/tắt được |
| ⑥ | Chế độ bản sửa | ✅ dải trượt *trước đó / hiện tại / đề xuất*, ảnh nhỏ + nguồn + ảnh hưởng, mặc định **tắt** |

Kèm: chú giải **trách nhiệm 6 mép** đọc ra được, và khối “Luật đọc ra được từ mẫu này” (7 luật, gồm 3 điều cấm của Hoà viết thẳng dạng cấm).

**Hai đảo** giữ ở cả ba nấc, kể cả rail — tách bằng khoảng thở 26px, không đường kẻ. Ở rail chỉ ẩn *nhãn cụm* và *chữ*, không gộp đảo.

**Ràng buộc kỹ thuật đã đạt**: 0 hex gõ cứng ngoài khối token chép nguyên văn từ `app/globals.css` (đã grep xác minh) · chỉ dùng thang bo `--r-1/2/3/4/--r-full` · 2 theme sống (nút Nền sáng) · line-height ≥1.5 toàn bộ · không `text-transform:uppercase` chỗ nào · tracking = 0 · mọi chấm màu đều kèm chữ (Đã kiểm / Máy suy / Đã cũ / 1 chờ) · có khối `prefers-reduced-motion`.

## 2 · Chỗ luật không nói rõ — tôi chọn gì

1. **Nấc ③ thêm lớp tin gì?** Luật chỉ nói “sửa thế nào”. Tôi chọn: khối thông số vật liệu đang áp **+ mục “Đang dùng ở”** (2D 4 mặt bằng · Trình chiếu bảng A3) — để nấc to mang thứ nấc nhỏ *không thể* có, không phải cùng nội dung phóng to.
2. **Rail có nhãn cụm không?** Chọn: **ẩn nhãn cụm ở rail**, giữ khoảng thở. Đảo vẫn đọc được bằng vị trí + khoảng cách.
3. **Dải hành động có nút chính đậm không?** Chọn: **chỉ ca “Hoàn tác”** dùng nút nền accent (việc có cửa sổ thời gian); ba ca còn lại nút trung tính — để mép dưới không tự nâng mình thành trục hành động thường trực.
4. **Bản sửa đặt đâu?** Chọn: **ngay trên** dải hành động, trong cùng khung, và **mặc định tắt** — bật là một chế độ, không phải một thanh thường trực.
5. **Nút đổi nấc/theme/biến thể** đặt **ngoài khung app**, khai rõ là điều khiển của bản mẫu — không được đọc nhầm thành thành phần sản phẩm.
6. **Kéo giãn**: chỉ hiện tay kéo ở nấc ③; nấc ①② không kéo được (chúng là *nghĩa*, không phải cỡ).

## 3 · Chỗ luật tự mâu thuẫn — nói thẳng

1. 🔴 **HAI đảo (brief này) ↔ BA cụm (bàn giao 20/08 mục 1).** `BAN-GIAO-UXUI-EXS-2026-08-20.md` ghi *“Sidebar 3 CỤM (Workspace chung · ba chặng · cá nhân) — ĐÈ bản hai-cụm”*; brief của việc này ghi **hai đảo**, không có cụm cá nhân. Tôi **theo brief (hai đảo)** và đưa danh tính người dùng lên **mép phải-trên** (avatar + presence) — đúng bảng trách nhiệm mép trong chính brief (*phải-trên = tôi là ai / ai đang ở đây*). Nếu Hoà giữ bản ba cụm thì hoặc mép phải-trên mất vai, hoặc app có **hai chỗ** nói “tôi là ai” — tức nhân bản. **Cần một câu chốt.**
2. 🟡 **“Ba nấc là ba nghĩa” ↔ “bảng kéo giãn được”.** Nếu nấc là nghĩa chứ không phải cỡ, thì cho kéo 320–440 là hành vi *của cỡ*. Cách tôi hoà: bề rộng kéo tay là **chuyện màn hình của từng người** (thuộc máy, không vào bản lưu) — đúng luật lưu chung↔máy 16/08; nấc thì là ý định làm việc. Không mâu thuẫn nếu ghi rõ như vậy, nhưng hiện **chưa văn bản nào ghi**.
3. 🟡 **“Mép dưới thoáng qua, tĩnh lặng” ↔ “hành động theo thời điểm”.** Một dải luôn có nút bấm thì rất dễ trượt thành thanh hành động thường trực — đúng thứ ba điều cấm nhắm tới. Cần một luật còn thiếu: **khi không có việc gì vừa xảy ra thì dải nói gì, hay biến mất?** Mẫu này hiện luôn có nội dung; tôi đề xuất trạng thái **im lặng** (dải rỗng/ẩn) và ghi vào luật, nhưng chưa dựng vì chưa có chốt.

## 4 · Chưa chắc / chưa kiểm

- **Chưa mở trên trình duyệt** — pane trình duyệt đang bận app thật ở `localhost:3001`, không được restart server và không mở được tab mới. Mọi kết luận về bố cục là **đọc mã**, không phải nhìn. Hai chỗ rủi ro nếu render lệch: chiều cao khung 560px có thể chật khi bật đồng thời ⑥ bản sửa; viên ngữ cảnh đặt `bottom:74px` có thể chạm dải bản sửa khi bật cả hai.
- Chưa thử trình đọc màn hình; `role="status" aria-live="polite"` trên dải hành động là suy theo chuẩn, chưa nghe thật.
- Chưa đo tương phản từng cặp màu trên bản mẫu (dùng nguyên token đã đo sẵn của app, không tự chế giá trị nào).

## 5 · Hạn dùng kết luận

Luật hành vi ở đây bám vào bản **hai đảo** và bảng trách nhiệm mép của brief 20/08. Nếu Hoà chốt lại theo **ba cụm**, mục ①②③ và mép phải-trên phải vẽ lại; phần ④⑤⑥ không đổi.
