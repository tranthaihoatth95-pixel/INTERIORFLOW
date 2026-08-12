# Vận hành backup ra ngoài máy — [marker: backup-offsite]

Lệnh: `IF_BACKUP_DIR=/Volumes/<ổ-rời> npm run backup:offsite` (hoặc truyền đích qua argv).
Đích cũng có thể là thư mục iCloud: `IF_BACKUP_DIR="$HOME/Library/Mobile Documents/com~apple~CloudDocs/if-backup-den"`.

Mỗi lần chạy tạo `<đích>/if-backup/YYYY-MM-DD-HHmm/` gồm: `dev.db` (sao bằng `sqlite3 .backup`, an toàn khi app đang chạy) + `uploads/` (rsync `--link-dest` — file không đổi chỉ hardlink, không tốn thêm chỗ) + `manifest.json` (thời điểm, dung lượng, số file, kết quả `integrity_check`).

Giữ **7 bản mới nhất** (đổi bằng `IF_BACKUP_KEEP=14`). Ổ chưa gắn/không ghi được → thoát mã 1, nói rõ lý do.

Muốn chạy tự động hằng ngày (tự cài, app không tự làm): `crontab -e` thêm dòng
`30 21 * * * IF_BACKUP_DIR=/Volumes/<ổ> /usr/local/bin/node /Users/tranben/Downloads/interiorflow/scripts/backup-offsite.mjs`
(cron chỉ chạy khi máy thức + ổ đang gắn; muốn bền hơn dùng launchd `StartCalendarInterval`).

Khôi phục: chép `dev.db` của bản muốn lấy về `prisma/dev.db` (app đang TẮT) + rsync `uploads/` ngược lại.
