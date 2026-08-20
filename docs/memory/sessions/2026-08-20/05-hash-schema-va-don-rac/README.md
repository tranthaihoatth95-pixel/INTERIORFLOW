# 05 · Hoà duyệt 4 cửa + dọn demo rác (20/08)

## Hoà chốt (nguyên văn rút gọn)
1. đồng ý — **+ xoá nội dung demo rác khỏi IF** · 2. đồng ý · 3. nhận · 4. nhập NHƯNG **chờ 3 lane Frontier xong**.

## Schema đã soạn (CHỜ Hoà chạy lệnh — human gate)
`LibraryAsset.contentHash String?` + `@@index([userId, contentHash])` · model mới `AssetRepresentation`.
`npx prisma validate` = valid. **CHƯA push, CHƯA generate** (luật: không chạy trong phiên).
Lệnh Hoà chạy khi đã đóng hết dev server:
```
cd ~/Downloads/interiorflow && sqlite3 dev.db ".backup 'dev.db.bak-truoc-hash-20-08'" && npx prisma db push && npx prisma generate
```
Ba lý do CẤM thêm `@unique` (ghi cả trong schema để phiên sau không tiện tay): trùng-bytes-khác-license
là ca hợp lệ · kho có trùng thật (Westlake ×7) · dedupe đúng chỗ là tầng code lúc nhập.

## Dọn rác — ĐÃ LÀM (xoá MỀM, lùi được)
4 dự án test lọt danh sách người dùng, đều 0 flow/task/asset/file, kiểm lại ngay trước khi đụng:
`Dự án verify inline input` (18/07) · `Enter test 2` (18/07) · `Test B3 (phục hồi backup)` (30/07) ·
`Dự án guard` (19/08). Danh sách còn: Nháp · Nháp · Dự án mới.

## KHÔNG đụng, có lý do
- **5 bucket `__nb:`** — KHÔNG phải rác: cơ chế Notebook sống (`lib/notebook/resolveProject.ts:19`
  `HIDDEN_NOTEBOOK_PREFIX`), đã bị loại khỏi Gallery/danh sách từ trong code. Xoá = đụng cơ chế
  đang chạy để đổi lấy 0 thay đổi mà người dùng thấy.
- **`M-SCOPE test rỗng`** — đã xoá mềm từ trước.
- 🔴 **682/1612 asset mang tên khách** (`detech` 609 · `westlake` 73) — CHỜ HOÀ QUYẾT, xem dưới.

## 🔴 CHỜ HOÀ: 682 asset mang tên khách hàng
Khác hẳn loại "test rơi rớt": đây là **tư liệu dự án thật**, và đụng LUẬT TRUNG TÍNH
(IF bán ra không được mang dữ liệu/brand khách). 42% kho. Ba đường:
① xoá mềm hết (kho về 930, lùi được) ② giữ nguyên trong `dev.db` máy Hoà + chặn ở khâu đóng gói
phát hành ③ đổi nhãn trung tính, giữ ảnh. MAIN nghiêng ②: `dev.db` là máy làm việc của Hoà,
không phải bản phát hành; cắt tư liệu thật khỏi máy đang dùng là mất mát thật để đổi lấy rủi ro
chưa xảy ra. Nhưng phải có cổng chặn thật lúc phát hành, không chỉ lời hứa.

## HẠN DÙNG
Hết hạn khi Hoà chạy lệnh schema (chuyển sang phiếu backfill) và khi Hoà quyết 682 asset.
