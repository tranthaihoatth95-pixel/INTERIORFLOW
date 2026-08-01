# HANDOFF — áp bảng `GuModel` lên `dev.db` THẬT (chạy trên máy thật, không qua sandbox)

> Ghi bởi code phụ, 01/08/2026, sau Đợt C (`docs/QUYET-DINH-HA-TANG-2026-07-31.md` §③ phương án
> C) và sự cố `dev.db` cùng ngày (đã khép — `integrity_check` ok, không mất dữ liệu).
>
> **Lý do phải chạy tay trên máy thật:** sandbox của code phụ đã CHỨNG MINH (2 lần, không phải
> giả thuyết) rằng FUSE mount nối sandbox ↔ máy thật KHÔNG cho SQLite khoá file đúng chuẩn POSIX
> → `disk I/O error` giữa chừng `prisma db push`. Máy thật (filesystem gốc, không qua FUSE) không
> có giới hạn này. **Luật mới áp cho cả hai code:** không chạy `prisma db push`/`migrate` qua
> sandbox nữa — mọi thay đổi schema từ nay soạn sẵn ở đây, Hoà chạy tay.

## Việc code đã xong (không cần sửa gì thêm)

`prisma/schema.prisma` trong worktree `.worktrees/dot-b` (nhánh `feat/dot-b-ha-tang`) đã có thêm
model `GuModel` — **CHỈ THÊM bảng mới, không sửa/xoá bảng nào đang có** (xem diff, đặc biệt
`User.guModels` chỉ là 1 dòng relation array, không đổi field nào cũ). API + UI đọc/ghi bảng này
đã viết + test xong (20/20), chờ đúng 1 việc: bảng thật sự tồn tại trong `dev.db`.

## Trước khi chạy

1. Đóng app InteriorFlow (dev server) đang mở, nếu có — tránh 2 tiến trình cùng ghi `dev.db` cùng lúc.
2. Mở Terminal, `cd` vào đúng thư mục repo thật (KHÔNG phải qua Dispatch/sandbox).

## Lệnh — dán nguyên khối vào Terminal

```bash
cd ~/Downloads/interiorflow

# 1) Backup ĐÚNG CÁCH — dùng .backup của sqlite3, KHÔNG dùng `cp`.
#    (cp đọc tuần tự 1 file 143 MB đang có thể bị ghi cùng lúc — không đáng tin cho SQLite;
#    .backup là API sao lưu CHÍNH THỨC của SQLite, nhất quán transaction.)
sqlite3 prisma/dev.db ".backup 'prisma/dev.db.bak-2026-08-01-truoc-gumodel'"

# 2) Áp schema mới — chạy từ worktree dot-b (đang giữ schema.prisma có GuModel),
#    trỏ DATABASE_URL về dev.db THẬT ở root (không đụng .env nào, không cần tạo .env).
cd .worktrees/dot-b
DATABASE_URL="file:$HOME/Downloads/interiorflow/prisma/dev.db" node_modules/.bin/prisma db push --skip-generate

# 3) Kiểm tra ngay sau khi push — PHẢI thấy "ok" và GuModel = 0 (bảng mới, rỗng, không ai dùng cho tới lúc code merge)
cd ~/Downloads/interiorflow
sqlite3 prisma/dev.db "PRAGMA integrity_check;"
sqlite3 prisma/dev.db "SELECT COUNT(*) FROM GuModel;"
```

## Nếu bước 2 hoặc 3 báo lỗi ⇒ DỪNG NGAY, đừng thử lại

Copy nguyên văn lỗi, dán vào chat. **Không** chạy `prisma migrate dev`/`migrate reset`, **không**
xoá tay `prisma/dev.db-journal` nếu nó xuất hiện, **không** chạy lại lệnh push lần 2 liên tiếp.
Bản backup ở bước 1 đã đủ để khôi phục nếu cần — việc khôi phục (nếu phải làm) cũng nên là quyết
định của Hoà, không phải chạy tự động.

## Sau khi push thành công

- Mở app / `npm run dev` như bình thường (Prisma Client tự generate lại bình thường trên máy
  thật, không có giới hạn FUSE như sandbox).
- Báo lại "đã push xong" trong chat — code phụ sẽ merge nhánh `feat/dot-b-ha-tang` vào `main` (chỉ
  sau khi có xác nhận này, để tránh merge code gọi bảng chưa tồn tại) rồi tiếp tục B3 (đo 136 MB
  còn lại trong `dev.db`, việc ĐỌC, cần `dev.db` đã ổn định).
