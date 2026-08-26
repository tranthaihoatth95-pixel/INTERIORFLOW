-- ProjectFile: CỬA DUYỆT THẬT cho Promote (Hoà chốt 20/08, schema.prisma:731-742).
--
-- VÌ SAO CÓ TỆP NÀY (đo 21/08): ba cột dưới đây đã nằm trong `schema.prisma` nhưng KHÔNG có
-- migration nào tạo chúng, và DB đang chạy cũng KHÔNG có chúng. `prisma migrate status` vẫn báo
-- "up to date" vì nó chỉ đối chiếu THƯ MỤC migrations với bảng `_prisma_migrations`, KHÔNG so
-- schema.prisma với DB thật ⇒ lệch này im lặng. Thứ đang che nó là Prisma Client CŨ (sinh trước
-- khi thêm cột): client không biết cột nên không SELECT, mọi truy vấn vẫn chạy.
-- ⚠️ Hệ quả: lần ai đó chạy `prisma generate`, client mới sẽ SELECT cả ba cột và MỌI truy vấn
-- ProjectFile gãy "no such column". Đây là mìn hẹn giờ, không phải lỗi đang cháy.
--
-- AN TOÀN: thuần THÊM CỘT (additive) — không đụng cột cũ, không đụng ràng buộc, không đụng dữ
-- liệu. 19 hàng ProjectFile hiện có giữ nguyên và nhận mặc định 'PENDING' (đúng ngữ nghĩa: chưa
-- ai duyệt). SQLite ALTER TABLE ADD COLUMN không viết lại bảng nên không mất index/khoá ngoại.
-- Đã sao lưu trước: `backups/dev.db.bak-2026-08-21-1400` (38.510.592 byte, integrity_check = ok).
-- Chưa có dòng code nào đọc ba cột này (grep app/ components/ lib/ = 0) ⇒ chạy xong không đổi
-- hành vi hiện tại, chỉ gỡ mìn.
ALTER TABLE "ProjectFile" ADD COLUMN "reviewState" TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE "ProjectFile" ADD COLUMN "reviewedAt" DATETIME;
ALTER TABLE "ProjectFile" ADD COLUMN "reviewedBy" TEXT;
