# SESSION-05 · HOÀ GIẢI DB

MISSION
Gỡ mìn hẹn giờ: schema.prisma có 3 cột mà DB sống KHÔNG có. Client Prisma CŨ đang che nó.

START COMMIT: 83ff452

⛔ LUẬT CỨNG
· KHÔNG chạy `prisma generate` khi DB sống còn lệch — client mới sẽ SELECT 3 cột đó và MỌI truy
  vấn ProjectFile gãy "no such column".
· KHÔNG reset. KHÔNG mất dữ liệu. KHÔNG migrate diện rộng.
· KIỂM TRẠNG THÁI THẬT TRƯỚC, đừng tin tệp này hơn DB.

HIỆN TRẠNG (đo 21/08, phải xác minh lại)
DATABASE_URL: file:/Users/tranben/Downloads/interiorflow/prisma/dev.db
Sao lưu: backups/dev.db.bak-2026-08-21-1400 (38.510.592 byte, integrity_check ok)
Thiếu trong DB: ProjectFile.reviewState · reviewedAt · reviewedBy
Artifact sẵn: prisma/migrations/20260821140000_them_project_file_review_state/migration.sql
`prisma migrate status` nói "up to date" — nó CHỈ so lịch sử migration, KHÔNG so schema với DB thật.
grep reviewState trong app/ components/ lib/ = 0 ⇒ chạy xong không đổi hành vi, chỉ gỡ mìn.

BLOCKER THẬT: lệnh ghi DB bị classifier chặn. Đây là MỘT hành động của Hoà:
  sqlite3 prisma/dev.db "ALTER TABLE ProjectFile ADD COLUMN reviewState TEXT NOT NULL DEFAULT 'PENDING'; ALTER TABLE ProjectFile ADD COLUMN reviewedAt DATETIME; ALTER TABLE ProjectFile ADD COLUMN reviewedBy TEXT;"

SAU KHI HOÀ CHẠY
1. sqlite3 prisma/dev.db "PRAGMA table_info(ProjectFile);"  → xác nhận 3 cột
2. npx prisma migrate resolve --applied 20260821140000_them_project_file_review_state
3. npx prisma generate
4. Kiểm khói: đọc/ghi ProjectFile · khôi phục Present · khôi phục 2D · /api/project-files GET+POST
5. npm test && npx tsc --noEmit

FILES TO OPEN
prisma/schema.prisma:725-745
prisma/migrations/20260821140000_them_project_file_review_state/migration.sql
app/api/project-files/route.ts · app/api/project-files/[id]/file/route.ts

ACCEPTANCE
3 cột có thật · migration đánh dấu đã áp · client sinh lại · 2 đường khôi phục vẫn chạy · 19 hàng
ProjectFile còn nguyên.

STOP CONDITION
Classifier vẫn chặn → giữ nguyên HUMAN-GATED, ĐỪNG làm phiền Hoà nhiều lần. Mọi wave khác không
phụ thuộc mục này.
