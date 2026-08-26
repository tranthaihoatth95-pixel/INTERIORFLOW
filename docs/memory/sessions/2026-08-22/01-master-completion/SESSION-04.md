# SESSION-04 · ẢNH CHỤP + BẰNG CHỨNG DECK

MISSION
Bộ ảnh THẬT, sạch, rồi thay bằng chứng yếu trong deck 25 slide bằng bằng chứng mạnh.

START COMMIT: 83ff452

GREEN — DON'T TOUCH
Deck 25 slide "Giới thiệu IF" đã có và đã khôi phục được. ⛔ KHÔNG DỰNG LẠI DECK.
Giữ: id slide hiện tại · tài sản · ghế Lincoln · 2 render ComfyUI thật · Demo Index · deep link ·
quay-về-đúng-slide · present-demo/dung-deck.js (công thức cứu hộ).

OPEN
Chụp sạch, thật, đủ dùng: Home · Dự án · Files · Thư viện · Soát duyệt · 2D Sơ phác · 2D Chuyên ·
3D khung nhìn sạch · 3D dựng trực tiếp · 3D chọn+gizmo · Boolean/chi tiết · Form Recipe ·
AI Form (nếu sống) · Lincoln Ảnh→3D · Generate · Sửa có kiểm soát · Ảnh→Spec · Spec · Present ·
Auto Grid/Cutout · Thiết lập trang · Hoạt động · Live Guide · Nguồn/Where Used.
Riêng chuỗi 2D: 2D SOURCE | LINKED PRESENT PAGE | PAGE SETUP (Auto Grid editorial nếu hợp).

⛔ CẤM đưa vào deck: toast hết phiên · deck rỗng do tai nạn · ảnh pane sai tỉ lệ · màn giả ·
tạo tác QA tổng hợp.

CÁCH CHỤP (đã đo, đừng thử lại đường chết)
· Cookie phiên HttpOnly ⇒ Playwright KHÔNG đăng nhập được. CẤM hỏi mật khẩu Hoà.
· Dùng pane trình duyệt ĐÃ ĐĂNG NHẶP. Nếu ảnh ra nhỏ ~288px: resize_window về preset desktop rồi
  chụp lại — đã chữa được đúng cách này.
· Chỉ MỘT dev server mỗi thư mục, nếu không `.next` hỏng và app "bấm không ăn".

FILES TO OPEN
present-demo/screens/            (21 ảnh đã có — kiểm trước khi chụp lại)
present-demo/dung-deck.js        (công thức deck; sửa slide thì sửa ở đây rồi chạy lại)
scripts/kiem-3d-contro-that.js   (bộ chụp/kiểm 3D)

TESTS TO RUN
Mở deck trên app thật, đếm 25 slide, bấm thử 1 deep link + viên "Quay về Trình bày".

ACCEPTANCE
Mọi ảnh trong deck là app THẬT, không lỗi, không rỗng.
Số slide KHÔNG tăng trừ khi có khe hở tự sự thật.

STOP CONDITION
Ảnh nào cần trạng thái chưa build (vd AI Form chưa sống) → ghi PENDING trong README, đừng dựng giả.
