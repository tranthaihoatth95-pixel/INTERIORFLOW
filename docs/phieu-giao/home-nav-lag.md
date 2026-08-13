# PHIẾU GIAO · home-nav-lag — đo rồi giảm lag điều hướng về Home (finding duyệt mắt 13/08)

## THẺ VAI [Đ4]
- **VAI:** NL — agent hiệu năng vỏ app, xử finding "bấm về Home bị lag" Hoà bắt khi duyệt mắt.
- **PHẠM VI/TRẦN:** cấp Đ. Vùng: `components/home/HomeScreen.tsx` (+ file wrapper dynamic nhỏ trong `components/home/` nếu cần) + báo cáo. KHÔNG file nào khác.
- **BIÊN → DỪNG:** KHÔNG đổi hành vi/logic/thứ tự render có điều kiện — CHỈ đổi cách nạp module · KHÔNG đụng AppShell/FlowCanvas ruột · KHÔNG mở dev server MỚI (dùng server ĐANG CHẠY cổng 3000) · ⛔ TUYỆT ĐỐI KHÔNG đăng nhập/nhập mật khẩu — mọi phép đo làm ở tầng chunk/network TRƯỚC đăng nhập · nếu đo xong thấy nguyên nhân chính KHÔNG phải bundle (mà là data-fetch/animation sau login) thì DỪNG SỬA, ghi số đo + chẩn đoán lên T.
- **ĐIỀU KHOẢN RUỘT:** [T6] đo được mới tin — số trước/sau, không sửa theo cảm giác · [T0] khai thật cái chưa đo được (hành vi sau login) · [N1] tội ③ lỗi thao tác.

## ① BỐI CẢNH
Hoà đang đi Lô duyệt mắt #1, bấm mục điều hướng về Home (route `/`) thấy LAG. Nghi phạm số 1 (T soi 13/08): `components/home/HomeScreen.tsx` import TĨNH toàn bộ dàn nặng — `FlowCanvas` (ReactFlow), `Dashboard`, `CommandPalette` (cần ReactFlow), `MaskPainterModal`, `AnnotateModal`, `MoodboardModal`, `Lightbox`, `Object3DTree/Inspector`, `Render3DModeSkeleton`… — tất cả vào chunk route `/`, dù phần lớn gated theo state (modal đóng, panel ẩn) và không cần cho first paint.

## ② ĐỌC TRƯỚC
`components/home/HomeScreen.tsx` (721 dòng — đọc kỹ component nào gated-by-state) · cách repo dùng `next/dynamic` sẵn có (grep `dynamic(` trong components/app lấy 2-3 tiền lệ) · `lib/resume.ts` `goHomeConfirmed` (đường điều hướng).

## ③ VÙNG FILE
`components/home/HomeScreen.tsx` + (tuỳ chọn) 1 file `components/home/heavy-panels.tsx` gom wrapper dynamic + `docs/bao-cao-phien/2026-08-14-NL-home-nav-lag.md`.

## ④ VIỆC
1. **ĐO TRƯỚC** (browser pane, KHÔNG login): mở `http://localhost:3000` tab mới, đọc network — ghi tổng KB/chunk JS của route `/` + thời gian tới first paint màn (dev mode nhiễu thì ghi rõ là số dev, so tương đối trước/sau cùng điều kiện).
2. **SỬA**: chuyển sang `next/dynamic` (ssr:false) các import CHỈ render theo điều kiện: modals (MaskPainter/Annotate/Moodboard/Lightbox) · Dashboard · CommandPalette · Object3DTree/Object3DInspector · Render3DModeSkeleton · RenderToolModeOverlay · các panel gated (`GalleryPanel`/`LibraryPanel`/`ChatPanel`/`NodeLibraryPanel`) — TỪNG CÁI kiểm nó có nằm trên đường first-paint không, cái nào luôn hiện (AppShell, StatusBar, LoginScreen, FlowCanvas nếu là thân chính) thì GIỮ TĨNH. Loading fallback: null hoặc skeleton sẵn có — không chế UI mới.
3. **ĐO SAU** cùng điều kiện; bảng trước/sau. Kiểm console 0 lỗi mới, màn login render bình thường, HMR không vỡ.
4. Chạy `npx tsc --noEmit` + test liên quan nếu có; `npm run soi:tu-dien` 0 lệch mới.

## ⑤ RÀNG BUỘC
KHÔNG git · KHÔNG server mới · KHÔNG dep · KHÔNG login/điền form · không đổi thị giác first-paint.

## ⑥ NGHIỆM THU TỰ LÀM
Bảng số trước/sau (KB chunk + cảm quan thời gian) · tsc 0 · console sạch · khai thật phần chưa đo được (hành vi hậu-login do Hoà cảm nhận lại).

## ⑦ BÁO CÁO
`docs/bao-cao-phien/2026-08-14-NL-home-nav-lag.md` — khuôn chuẩn + bảng đo + danh sách component đổi dynamic kèm lý do từng cái.

## ⑧ DÂY MÁY
Entry `home-nav-lag` (đợt 7, Workspace, 🧰đỡ) — T flip sau audit + sau khi Hoà xác nhận hết lag.
