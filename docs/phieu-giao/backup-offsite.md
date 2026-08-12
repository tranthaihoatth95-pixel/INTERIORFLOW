# PHIẾU backup-offsite — Backup tự động ra ngoài máy
①NGÀNH: toàn bộ dev.db + uploads đang một-đĩa — cháy đĩa là mất studio. Rủi ro vật lý lớn nhất hiện tại.
②ĐỌC TRƯỚC: docs/00-CHOT.md mục "LUẬT VẬN HÀNH" (sao lưu SQLite bằng sqlite3 .backup, KHÔNG cp) · prisma/.env DATABASE_URL · scripts/db-sach.mjs (nếp script repo).
③VÙNG FILE: scripts/backup-offsite.mjs (MỚI) · package.json (1 dòng npm script) · docs/VAN-HANH-BACKUP.md (MỚI, ngắn).
④VIỆC: [marker: backup-offsite] script: nhận đích qua env IF_BACKUP_DIR hoặc argv (vd /Volumes/... hay ~/Library/Mobile Documents/iCloud); sqlite3 .backup dev.db → <đích>/if-backup/YYYY-MM-DD-HHmm/dev.db + rsync uploads/ (—link-dest tiết kiệm nếu có bản trước) + giữ N bản mới nhất (mặc định 7, xoá cũ) + ghi manifest.json (thời điểm, dung lượng, số file) + kiểm integrity_check sau backup. Đích chưa gắn/không ghi được → thoát mã 1 với thông điệp rõ, KHÔNG im lặng. npm script `backup:offsite`. Doc 10 dòng: cách đặt IF_BACKUP_DIR + gợi ý cron/launchd (chỉ hướng dẫn, không tự cài).
⑤RÀNG BUỘC: không git · không server · KHÔNG đụng dev.db ngoài lệnh .backup read-only.
⑥NGHIỆM THU: chạy thật với đích /tmp/if-backup-test → dán output + ls đích; integrity ok; chạy lần 2 kiểm rotation.
⑦BÁO CÁO: docs/bao-cao-phien/2026-08-12-N-backup.md (khuôn chuẩn + 2 GIÁ TRỊ).
⑧DÂY MÁY: backup-offsite. Agent KHÔNG sửa registry.
