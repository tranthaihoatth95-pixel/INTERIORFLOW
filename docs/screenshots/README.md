# docs/screenshots — ảnh chụp app thật cho COWORK-TỔNG

Chụp 05/08/2026 bằng Playwright (chromium headless), viewport **1440×900, deviceScaleFactor 2**,
server riêng của phiên ở `127.0.0.1:3007` (KHÔNG đụng cổng 3000 Hoà đang mở), tài khoản demo
`demo@if.local`, dự án có sẵn **"Dự án mẫu"** (`cms3350vn0001w9tu0vwby8y7`).

> ⚠️ Ảnh `.png` **bị `.gitignore:61` chặn** (`docs/**/*.png`) — đúng ý, ảnh không vào git.
> Chỉ file `.md`/`.txt` trong thư mục này là được track.

## Bộ 14 ảnh (VIỆC 1)

| File | Màn | Ghi chú cần biết |
|---|---|---|
| `01-gallery.png` | Thư viện dự án | 17 flow demo, chế độ lưới |
| `02-tao-du-an.png` | Tạo dự án mới | ⚠️ **Gallery KHÔNG có hộp thoại tạo dự án** — thẻ "+ Dự án mới" tạo & mở flow NGAY (`ProjectSelect.tsx:1199`). Ảnh này là ô nhập tên trong overlay Dashboard (Gallery → "Chi tiết" → "Dự án mới", `Dashboard.tsx:262-269`) — chỗ DUY NHẤT có form đặt tên. Chụp lúc form mở, **không bấm xác nhận** nên không sinh dự án rác |
| `03-2d-toan-man.png` | Thiết kế 2D toàn màn | Nạp "Bắt đầu → Mở bản demo" (căn hộ mẫu 117 entity) — dùng tính năng sẵn có của app, không tiêm store |
| `04-2d-thanh-cong-cu.png` | Zoom thanh công cụ 2D | Cắt riêng dock dưới (Sketch/Pro/Revit + Vẽ · Cấu kiện · Sửa · Đo & ghi chú + hàng Ortho/Số liệu/Lệnh/Kéo/Xong/Huỷ) |
| `05-kiem-chuan.png` | Kiểm chuẩn CÓ LỖI | Đã bấm nút khiên "Chạy kiểm tra" → **9 lỗi** (thấy ở góc phải thanh trạng thái), danh sách vi phạm IBC/TCVN hiện trong panel |
| `06-thu-vien.png` | Sheet Thư viện | **Đã chụp lại SAU VIỆC 2** (bản card rời) — trùng nội dung `16-sheet-mo.png` |
| `07-3d-toan-man.png` | Thiết kế 3D · chế độ 3D | ⚠️ Camera lúc mount **áp sát + lệch tâm** khỏi mô hình; phải cuộn zoom ra + pan tay mới thấy cả khối. Tái hiện được cả sau reload (scene đã có đủ 39 vật) ⇒ nghi lỗi khung camera ban đầu, KHÔNG phải do dữ liệu vào muộn |
| `08-3d-node.png` | Thiết kế 3D · chế độ Node | Canvas node của "Dự án mẫu" |
| `09-trinh-chieu.png` | Trình chiếu | Deck 8 slide, panel Magic/Reference/Motion |
| `10-boq.png` | Bảng khối lượng | 🔴 Báo **"Không tìm thấy dự án."** — xem mục "Phát hiện" bên dưới |
| `11-cai-dat.png` | Cài đặt | |
| `12-file-manager.png` | File Manager | |
| `13-vitals.png` | Vitals đang mở | Mở bằng ⌘J (bấm chip Vitals chỉ nở ô gõ, KHÔNG mở panel) |
| `14-phim-tat.png` | Bảng phím tắt | 66 lệnh gõ tay + 36 phím tắt |

Không có file `.SKIP.txt` nào — chụp đủ 14/14.

## Bộ nghiệm thu VIỆC 2 — sheet Thư viện thành card rời

| File | Nội dung |
|---|---|
| `15-sheet-dong.png` | Sheet đóng — ẩn hẳn dưới mép màn, không ló |
| `16-sheet-mo.png` | Sheet mở, theme Sáng — cách đáy 14px, bo đủ 4 góc 20px, rộng 720px canh giữa |
| `16b-sheet-mo-theme-toi.png` | Như trên, theme Tối (luật L5 nghiệm thu đủ 2 theme) |
| `17-sheet-man-hep.png` | Viewport 420×860 — card rộng 396px, cách mỗi bên 12px, cách đáy 14px |

## Phát hiện trong lúc chụp (không sửa, chỉ báo)

1. **BOQ không tính được cho flow** — `PresentStageScreen.tsx:50` truyền `projectId = params.id`,
   mà `[id]` trên route `/projects/[id]/present` thực tế là **flow id**; `app/api/boq/[projectId]/route.ts:33`
   lại tra `prisma.project` qua `assertProjectAccess` ⇒ luôn 404 "Không tìm thấy dự án.".
   Đối chiếu DB: **0/39 flow** có `projectId` (đã query `Flow where projectId is not null` = rỗng).
2. **Camera 3D lúc mount áp sát + lệch tâm** (xem `07`). `Scene3DViewer.tsx:191-203` tính khung từ
   `bboxMm`; chưa xác định được nguyên nhân, CHƯA sửa.
3. **Chip Vitals ở StatusBar không mở panel** — bấm chỉ nở thành ô gõ (`StatusBar.tsx:188-191`);
   panel chỉ mở qua ⌘J (`StageSwitcher.tsx:210`) hoặc sau khi gửi câu hỏi.
