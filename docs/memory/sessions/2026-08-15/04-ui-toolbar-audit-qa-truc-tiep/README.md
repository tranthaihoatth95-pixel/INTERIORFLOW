# 04 · Kiểm toolbar 3 chặng + màn khoá + đi tay luồng thật (kịch bản A) + phát hiện lỗ V

> Nhánh việc DÀY nhất trong ngày — nhiều lần tự sửa sai giữa chừng, ghi đủ để phiên sau không lặp
> lại đúng những chỗ đã vấp.

## 1 · Màn khoá (LockScreen) — ĐÃ LÀM XONG, đã commit-ready
Hoà yêu cầu (nhắn giọng, nhiều lỗi gõ): hiệu ứng "lật" khi tự khoá + dòng "thông điệp đẹp/động
lực trong ngày" phía dưới + hỏi thêm icon thông báo/mail.
- **Đã làm**: `components/studio/LockScreen.tsx` — thẻ đăng nhập flip 3D (`rotateX -55°→0`, spring
  `springPop` có sẵn trong `lib/motion.ts`) + 12 câu động lực xoay theo ngày-trong-năm (không
  random mỗi lần khoá).
- **CHỦ ĐỘNG TỪ CHỐI làm icon thông báo/mail** — grep xác nhận app CHƯA có hệ Notification/Mail
  thật nào (0 model) — thêm icon lúc này là nút giả, phạm luật cứng "không nút giả". Để trống có
  ghi chú code, chờ Hoà xác nhận nối vào hệ thật nào.
- Verify: browser thật, `⌃⌘Q` trigger lock, đọc DOM xác nhận dòng chữ + animation chạy, console
  sạch (1 warning duplicate-key có sẵn từ trước, không phải do sửa lần này).

## 2 · L1 "3 khuôn toolbar khác nhau" — điều tra ra PHỨC TẠP HƠN dự đoán
Research hôm nay (NC-NGUYEN-TAC-GIAO-DIEN-TOAN-APP, NC-TRIET-LY-GIAO-DIEN — cả hai ĐÃ ĐƯỢC T DUYỆT
thành hiến pháp giao diện, dùng quyền "tổng kiến trúc sư" Hoà giao) xếp L1 là lệch nặng nhất: 2D
chip ngang · 3D dock capsule · Present chip wrap 4 hàng.

**Sai lầm tự sửa quan trọng**: ban đầu kết luận nhầm "Trình bày sống NGOÀI AppShell hoàn toàn,
không Vitals, không Workspace-nav" — dựa trên đọc nhầm route CŨ (`PresentEditor.tsx`/
`app/present-editor`, đã là redirect). Đọc lại đúng route THẬT (`PresentStageScreen.tsx`, route
`/projects/[id]/present`) → **XÁC NHẬN NÓ CÓ mount `<AppShell>`** y hệt 2D. Đã báo sai + sửa ngay
trong hội thoại, không im lặng.

**Phạm vi L1 thật (thu hẹp đúng)**: KHÔNG phải thiếu tầng vỏ (AppShell) — là tầng RUỘT: 3 component
(`CadToolbar.tsx`, `ToolDock3D.tsx`, `present-editor/Toolbar.tsx`) tự viết style riêng, 0% chia sẻ
code, không ai dùng token `lib/geometry.ts` (RADIUS đã duyệt §2d) dù đã có sẵn.

**Đã bắt tay làm**: `components/ui/ToolbarChip.tsx` — component nút công cụ dùng chung, trích
NGUYÊN kiểu từ `CadToolbar.tsx` (đã đúng NT-5 nhất: pill/capsule, ghost-khi-bật, size 44/36 theo
mật độ con trỏ) — CHƯA áp vào 3 nơi, mới xong bước 1/4 (dựng component chuẩn).

## 3 · Đi tay Kịch bản A ("KTS thật vẽ 1 phòng khách-bếp") — CHƯA hoàn thành hết luồng
Yêu cầu Hoà: đóng vai KTS, soi từng màn/nút, nhiều kịch bản từ thường tới gấp, viết rõ Vai/Tình
huống trước khi làm, đánh giá cả yếu tố vật lý/ergonomics (không chỉ chức năng).

**Kết quả — DỪNG Ở BƯỚC VẼ TƯỜNG 2D**, chưa chạm 3D/render/trình bày. Trung thực: không đi hết
luồng như yêu cầu ban đầu.

**Phát hiện chắc chắn** (có bằng chứng DOM/code):
- Cổng chặn màn hẹp: viewport hẹp → tự chuyển "Tổng quan — bản xem nhanh (CHỈ ĐỌC)".
- 21 nút công cụ chính 2D **0 nhãn thường trực** (không `title`/`aria-label`, chỉ tooltip custom
  hiện khi hover) — VI PHẠM TRỰC TIẾP nguyên tắc NT-10/K14 mà chính nghiên cứu hôm nay vừa đặt ra.
- Dock công cụ đặt sát đáy màn (y≈716-814/900) trong khi canvas làm việc ở giữa/trên — quãng di
  chuột thật mỗi lần đổi công cụ, đúng ý Hoà "2 tay 2 mắt di chuyển qua lại khó chịu".
- Zoom mặc định bản vẽ mới = 8% (`viewport.scale: 0.08`).
- Chuyển tab chặng có độ trễ ~1-2s trước khi URL đổi — dễ tưởng "bấm không ăn" rồi bấm lại.

**Nghi vấn SUÝT BÁO SAI, được V cứu** (xem mục 4): tưởng "vẽ tường bị lỗi" — thật ra là lỗi công
cụ debug của chính T (2 lỗi riêng biệt: phím "Return" tạo `KeyboardEvent.key=""` thay vì
`"Enter"`; và lỗi hiệu chỉnh toạ độ của Browser pane sau `resize_window` lên 1440×900).

## 4 · Cơ chế V (kiểm chéo độc lập) — LẦN ĐẦU THỰC SỰ CHẠY
Hoà hỏi thẳng "có kiểm T chưa, lỡ ông sai?" → xác nhận: **V đã THIẾT KẾ từ 12/08
(`HOP-DONG-PHOI-HOP-T`) nhưng CHƯA TỪNG CHẠY THẬT cho tới hôm nay.**

Phóng 1 agent độc lập (không đọc báo cáo của T trước), tự bấm lại từ đầu → **kết luận: vẽ tường
HOẠT ĐỘNG ĐÚNG** (entities 0→6, đúng cấu trúc polyline+hatch trên layer l-wall), lỗi hoàn toàn ở
phía công cụ test của T. Đây là bằng chứng sống cho giá trị của việc kiểm chéo — T tự báo cáo
"chưa xác định được" có thể đã để lọt 1 nghi vấn sai vào sổ nếu không có V.

**Câu hỏi còn treo, Hoà chưa trả lời**: có nên áp dụng V cho MỌI nghi vấn (tốn kém) hay chỉ cho
phát hiện có khả năng ảnh hưởng quyết định kiến trúc/chốt lớn (đề xuất của T)?

## 5 · Luật báo cáo mới (Hoà chốt 15/08, ĐÃ GHI)
Ghi vào `docs/CLAUDE.md` mục "LUẬT CỨNG BÁO CÁO" — khuôn 6 phần bắt buộc: Tổng quan → Chi tiết
từng mục → Tổng kết vấn đề → Đánh giá khách quan → Hướng xử lý nhiều góc độ → Đề xuất hướng tốt
nhất. Áp dụng cho MỌI báo cáo, kể cả agent con gửi T.

## Việc CÒN DANG DỞ, chưa xong — phiên sau tiếp tục ở đây
1. Áp `ToolbarChip` vào 3 nơi thật (mới dựng xong component, chưa nối dây).
2. Trình bày ra AppShell — KHÔNG cần làm (đã xác nhận nó ĐÃ ở trong AppShell, việc này ĐÓNG).
3. Đi tiếp Kịch bản A: 3D → render → xuất trình bày (dừng ở bước vẽ tường, giờ đã xác nhận vẽ
   tường OK — có thể tiếp tục ngay).
4. Kịch bản B/C (gấp/khó) theo yêu cầu "nhiều kịch bản" — CHƯA làm cái nào ngoài Kịch bản A.
5. Quyết định phạm vi áp dụng V (câu hỏi treo mục 4).
