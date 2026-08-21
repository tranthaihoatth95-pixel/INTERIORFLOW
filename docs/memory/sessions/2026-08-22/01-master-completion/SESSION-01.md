# SESSION-01 · UI / HỆ THỊ GIÁC

MISSION
Chất lượng giao diện là một phần luận đề sản phẩm IF, không phải đánh bóng.
Đưa Trang chủ · 2D · 3D · Present về MỘT hệ thị giác: điềm tĩnh · kiến trúc · editorial · cao cấp.
Claude Design đề xuất bố cục; MAIN là người tích hợp và giữ kiến trúc/state/route/persistence.

START COMMIT: 83ff452 · nhánh backup/2026-08-19-batch0a

GREEN — DON'T TOUCH
Profile/Settings đã gom xong (Ngôn ngữ + Giới thiệu trong menu avatar; Home không còn ⓘ/VI-EN lơ lửng).
Mọi thứ ở mục GREEN của README. Đừng chứng minh lại.

OPEN
1. HOME = CON NGƯỜI. Bố cục: KHÔNG KHÍ → TIẾP TỤC (một đích) → KỆ DỰ ÁN → MỘT vùng cảm hứng.
   Dự án KHÔNG được chiếm khung hình đầu. Không đánh số mục kiểu dashboard, không tường widget.
   Tuỳ biến về Cài đặt → Màn hình chính (Calm/Editorial/Compact/Custom).
2. VITALS không phải pill. Neo ở MÉP TRÊN vùng làm việc, mảnh gần như vô hình; chú ý = hổ phách
   nhẹ; rê chuột = Peek thả xuống; bấm = ghim; Esc = đóng.
3. 2D: mặt vẽ trước. Sơ phác ⇄ Chuyên trong MỘT môi trường. Đừng thành AutoCAD đổi màu.
4. 3D: khung nhìn trước. Thường trực ĐÚNG 7: Chọn·Dời·Xoay·Tạo·Vật liệu·Máy ảnh·Thêm.
   Catalogue tạo hình mở theo ngữ cảnh.
5. Present: editorial, ảnh mạnh, khoảng âm; Auto Grid chỉ khi có ích.

FILES TO OPEN
docs/mocks/mock-he-thi-giac-3-man.html      (bản vẽ đã đẩy Claude Design — hợp đồng thị giác)
components/home/DongStudioHome.tsx          (Home)
components/studio/AppChrome.tsx             (thanh trên · Vitals · Profile)
components/home/widgets/VitalsPill.tsx      (đang là PILL — phải đổi thành mép trên)
components/nav/RailDieuHuong.tsx            (rail 3 nấc)
components/cad/CadToolbelt.tsx              (thanh 2D)
components/render-studio/ToolDock3D.tsx     (dock 3D)
app/globals.css                             (token — KHÔNG chế màu mới)

TESTS TO RUN
npm test && npx tsc --noEmit
npm run soi:hinh-hoc && npm run soi:tu-dien
Chụp màn thật qua pane ĐÃ ĐĂNG NHẬP (cookie HttpOnly, Playwright không đăng nhập được).

ACCEPTANCE (thiếu một là FAIL)
· Home đọc ra như dashboard → FAIL
· 2D giống AutoCAD → FAIL
· 3D nặng panel → FAIL
· Present giống slide chung chung → FAIL
· Ba màn đọc ra như ba app → FAIL
· Chrome lấn nội dung → FAIL
· Mọi thứ đều là thẻ bo tròn → FAIL
· Kính dùng dày → FAIL
Phải có ẢNH CHỤP APP THẬT mới được PASS.

STOP CONDITION
Hoà duyệt mắt bộ 3 bản vẽ (blocker thật). Nếu chưa duyệt: vẫn làm được phần KHÔNG phụ thuộc gu —
Vitals về mép trên, dọn chrome thừa, đo lại diện tích khung nhìn trước/sau.
