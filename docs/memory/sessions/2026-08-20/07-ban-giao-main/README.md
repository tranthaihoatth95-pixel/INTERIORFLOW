# 07 · BÀN GIAO MAIN — đọc file này là nối được, không phải khảo cổ

> Cập nhật lần cuối: 20/08, cuối phiên MAIN. Nền lúc bàn giao:
> **tsc 0 · `npm test` EXIT=0 · 8551 pass / 0 fail · soi:frontier 0 lệch**.

## 1 · GIT
- Nhánh làm việc: **`backup/2026-08-19-batch0a`**, tip **`b92a6a7`**, đã push remote.
- **`main` = `2dfed16`** — ⛔ **CHƯA nhập**, đúng lệnh Hoà: chỉ nhập sau khi diễn tập demo loop xanh.
- Cách checkpoint đang dùng (giữ nguyên, đừng đổi): git plumbing với `GIT_INDEX_FILE` tạm →
  `read-tree` từ tip → `update-index --add --stdin` (⛔ **không bao giờ `git add -A`**) →
  `write-tree` → `commit-tree -p <tip>` → `branch -f` → `push`.
  🔴 **Sau mỗi checkpoint phải `git show --stat` soi lại danh sách tệp** — đã từng sót
  `lib/present-editor/to-ban-ve.ts` khiến nhánh thiếu file mà không ai biết.

## 2 · HAI LANE CHẾT GIỮA CHỪNG — ĐỌC KỸ TRƯỚC KHI LÀM TIẾP
Máy ngủ / luồng treo. **tsc và test vẫn xanh**, nhưng cả hai đang sửa DỞ một tính năng:

| Lane | Tệp còn thay đổi treo | Đang làm dở |
|---|---|---|
| Vitals neo vỏ | `components/studio/AppChrome.tsx` (+24) | header 3 vùng — chết ở *"Now the socket markup itself"* |
| Home lưới/thẻ | `components/ProjectSelect.tsx` (+54) | thẻ dự án liền mặt — chết ở *"merge text block into gradient overlay"* |

🔴 **MAIN CỐ Ý KHÔNG checkpoint hai phần này** — chúng là nửa tính năng, xanh về cú pháp nhưng
chưa xong về nghĩa. ⛔ Đừng vứt (là công thật), ⛔ đừng commit như thể đã xong.
**Việc đầu tiên của phiên sau**: mở hai tệp đó, xem phần dở, **làm nốt hoặc hoàn nguyên có chủ đích**.

## 3 · XẾP HÀNG (thứ tự ưu tiên)
1. **Làm nốt 2 lane chết** (mục 2).
2. **§33-34 Trung tâm Hoạt động** — chuông phải-trên → Peek gọn (`1 đang chạy · 2 chờ · 1 lỗi`) →
   **cột phải đầy đủ**; thay popup nhỏ xấu. Vùng `components/studio`.
3. **§3 sidebar KHÔNG tự thu** khi người dùng đã chủ động mở. Vùng `components/nav` + `Navigator`.
4. **§38 Page Setup toàn không gian**: TRÁI núm · **GIỮA xem trước tờ LỚN SỐNG** · PHẢI kiểm ·
   DƯỚI điều hướng tờ. Bản hiện có (`ThietLapTrangDayDu`) **chưa đủ** — phải thấy kết quả
   **trong lúc** chỉnh.
5. **§26 neo điều khiển quanh ToolWindow** — chưa làm dòng nào. Cửa nghiệm thu: **ruột
   `CuaSoCongCu` phải NHẸ ĐI**, không phải mép thêm nút.
6. Hai `window.print()` trùng: `BoqScreen:309` · `ScheduleScreen:168` (bỏ qua khổ/tỉ lệ/khung tên).
7. Hai panel tranh mép phải (Thiết lập nhanh ↔ BẢNG KIỂM) — đã chốt **một lúc chỉ một**;
   cần lane cầm `components/studio`.
8. Xem trước **nội dung** tờ · nhiều trang · xuất · nút 3D chưa nối.
9. **Diễn tập demo loop đầu-cuối** → rồi mới nhập `main`.

## 4 · CẦN HOÀ (cửa thật, agent không tự quyết được)
1. **Bật `prefers-reduced-motion`** — Trợ năng → Hiển thị → Giảm chuyển động. Agent **không được
   phép** đổi cài đặt hệ thống. Nợ trợ năng duy nhất còn treo.
2. **Glyph riêng cho Trang chủ** (mái dốc phá trục ngữ pháp; rà hết lucide **không có ứng viên**)
   + **Thư viện** (`SquareStack` đọc còn lửng).
3. **Phiên thiết kế native cho Home và Library** — GATE #4: HTML/DesignSync **không còn tính là
   duyệt thị giác**.

## 5 · LUẬT MỚI BAN TRONG PHIÊN (chưa vào tài liệu chính tắc — dễ rơi)
- **Vật liệu theo chức năng, kính phải ĐÁNG**: đặc (mặc định — biểu mẫu/kỹ thuật/đọc lâu) ·
  gần đặc (bảng thường trực/inspector) · kính mỏng (chỉ Vitals Peek · viên nhỏ · lớp phủ tạm).
  Base `.be-mat-noi` **thôi tự cấp nền kính**; không khai vai trò ⇒ **ĐẶC**.
- **Kích cỡ quyết định LOẠI bề mặt**, không chỉ toạ độ: quá lớn ⇒ inspector cắm bên;
  việc sâu ⇒ toàn không gian. Hộp thoại giữa màn **chỉ** cho quyết định ngắn-và-chặn.
- **Sáu vùng cấm che**: canvas · vật đang chọn · vật nguồn · vùng con trỏ · **Vitals** ·
  **dải hành động mép dưới**.
- **Bốn nghĩa kích thước**: measured · verified · **human-override** · inferred.
  ⛔ CẤM dán nhãn `measured` cho giá trị đến từ người. **Gõ lại số KHÔNG phải bằng chứng.**
- **Ba hệ tách bạch**: Vitals *nên biết gì* · Hoạt động *đang chạy / vừa đến* ·
  Dải hành động *vừa xảy ra*.
- **Trái chỉ có VIỆC** — hai đảo; Hồ sơ/Credit/Cài đặt ở **phải-trên**, cấm lặp.

## 6 · BÀI HỌC ĐẮT (đừng học lại bằng đường đau)
- **Test đỏ giả nguy hiểm hơn test thiếu** — `npm test` chạy `-P8`; một test khẳng định
  **đếm toàn cục** nên đỏ oan. Đã sửa sang kiểm **hàng của chính mình**.
- **Công thức chụp ảnh**: playwright import bằng **đường dẫn tuyệt đối**
  `node_modules/playwright/index.mjs` + `launchPersistentContext` profile `~/.if-phien-chup-man`.
  Headless vào `/` là **màn đăng nhập** ⇒ `AppChrome` không mount ⇒ tưởng "không chụp được".
- **`overflow-y:auto` + `overflow-x:visible` VẪN CẮT ngang** (spec CSS tự nâng trục kia thành
  `auto`) — chỉ ảnh mới lộ.
- **Đếm tại NGUỒN, không đếm ở bản chiếu** · **`tail -N` cắt kết quả grep** (MAIN từng kết luận
  sai "0 board có @dsCard", thật ra 19/19).
- **Lỗi "có trong mã mà không tới người dùng"** xảy ra 4 lần trong phiên (nút mờ · nhớ chỗ cửa sổ ·
  chip Vitals mồ côi · nút Thêm tường) ⇒ **nghiệm thu phải bằng trình duyệt tiền cảnh**, tsc/test mù.

## 7 · ẢNH ĐÃ CHỤP (Hoà duyệt mắt)
`docs/duyet-mat/anh-nav-2026-08-20/` — 5 ảnh: cả cột 240 · cụm Chặng cận cảnh · cả cột 52 ·
cụm Chặng 52 · viên nhãn khi rê.
