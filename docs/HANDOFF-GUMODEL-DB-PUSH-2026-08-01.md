# HANDOFF — áp bảng `GuModel` lên `dev.db` THẬT (chạy trên máy thật, không qua sandbox)

> Ghi bởi code phụ, 01/08/2026, sau Đợt C (`docs/QUYET-DINH-HA-TANG-2026-07-31.md` §③ phương án
> C) và sự cố `dev.db` cùng ngày (đã khép — `integrity_check` ok, không mất dữ liệu).
>
> **Lý do phải chạy tay trên máy thật:** sandbox của code phụ đã CHỨNG MINH (2 lần, không phải
> giả thuyết) rằng FUSE mount nối sandbox ↔ máy thật KHÔNG cho SQLite khoá file đúng chuẩn POSIX
> → `disk I/O error` giữa chừng `prisma db push`. Máy thật (filesystem gốc, không qua FUSE) không
> có giới hạn này. **Luật mới áp cho cả hai code:** không chạy `prisma db push`/`migrate` qua
> sandbox nữa — mọi thay đổi schema từ nay soạn sẵn ở đây, Hoà chạy tay.

---

## ⚠️ ĐÍNH CHÍNH 01/08 06:40 — bản lệnh đầu tiên SAI, đã thay bên dưới

Hoà chạy bản đầu, kết quả: `zsh: no such file or directory: node_modules/.bin/prisma`.

**Nguyên nhân:** git worktree dùng chung `.git` nhưng **KHÔNG dùng chung `node_modules`**.
`.worktrees/dot-b/` không có `node_modules/`, nên `cd .worktrees/dot-b` rồi gọi
`node_modules/.bin/prisma` là gọi vào chỗ trống.

**Hệ quả:** `db push` **chưa từng chạy**. `SELECT COUNT(*) FROM GuModel` báo *no such table* là
**kết quả đúng**, không phải hỏng dữ liệu. `PRAGMA integrity_check` = `ok`; backup 143.474.688 B
đã tạo thành công.

**Cách đúng:** chạy từ **root** (nơi có `node_modules`), trỏ `--schema` sang worktree.
`datasource url = env("DATABASE_URL")` nên biến môi trường ghi đè được — không cần tạo `.env` nào.

*Cowork đính chính, có kiểm: 🧮 `diff` hai schema = **27 dòng thêm / 0 dòng xoá**, model mới duy
nhất là `GuModel`. Lời "chỉ thêm bảng mới" của code phụ **đúng**.*

---

## Việc code đã xong (không cần sửa gì thêm)

`prisma/schema.prisma` trong worktree `.worktrees/dot-b` (nhánh `feat/dot-b-ha-tang`) đã có thêm
model `GuModel` — **CHỈ THÊM bảng mới, không sửa/xoá bảng nào đang có**. API + UI đọc/ghi bảng này
đã viết + test xong (20/20), chờ đúng 1 việc: bảng thật sự tồn tại trong `dev.db`.

## Trước khi chạy

1. Đóng app InteriorFlow (dev server) đang mở, nếu có — tránh 2 tiến trình cùng ghi `dev.db`.
2. Mở Terminal, `cd` vào đúng thư mục repo thật (KHÔNG phải qua Dispatch/sandbox).

## ✅ Lệnh ĐÚNG — dán nguyên khối vào Terminal

```bash
cd ~/Downloads/interiorflow

# 0) Gỡ lock git còn sót của tiến trình chết (sandbox không xoá được)
rm -f .git/index.lock

# 1) Backup ĐÚNG CÁCH — .backup của sqlite3, KHÔNG dùng `cp`.
#    (bỏ qua nếu đã có bản dev.db.bak-2026-08-01-truoc-gumodel)
sqlite3 prisma/dev.db ".backup 'prisma/dev.db.bak-2026-08-01-truoc-gumodel'"

# 2) Áp schema mới — chạy TỪ ROOT (nơi có node_modules), --schema trỏ sang worktree
DATABASE_URL="file:$HOME/Downloads/interiorflow/prisma/dev.db" \
  node_modules/.bin/prisma db push --skip-generate \
  --schema .worktrees/dot-b/prisma/schema.prisma

# 3) Kiểm ngay — PHẢI thấy "ok" và GuModel = 0
sqlite3 prisma/dev.db "PRAGMA integrity_check;"
sqlite3 prisma/dev.db "SELECT COUNT(*) FROM GuModel;"
```

### ❌ Bản CŨ — đừng chạy lại

```bash
cd .worktrees/dot-b
DATABASE_URL="..." node_modules/.bin/prisma db push --skip-generate   # ← worktree không có node_modules
```

## Nếu bước 2 hoặc 3 báo lỗi ⇒ DỪNG NGAY, đừng thử lại

Copy nguyên văn lỗi, dán vào chat. **Không** chạy `prisma migrate dev`/`migrate reset`, **không**
xoá tay `prisma/dev.db-journal` nếu nó xuất hiện, **không** chạy lại lệnh push lần 2 liên tiếp.
Bản backup ở bước 1 đã đủ để khôi phục nếu cần — việc khôi phục (nếu phải làm) cũng nên là quyết
định của Hoà, không phải chạy tự động.

## Sau khi push thành công

- Mở app / `npm run dev` như bình thường (Prisma Client tự generate lại trên máy thật).
- Báo "đã push xong" trong chat — code phụ sẽ merge nhánh `feat/dot-b-ha-tang` vào `main` (chỉ sau
  khi có xác nhận này, tránh merge code gọi bảng chưa tồn tại) rồi tiếp tục B3 (đo 136 MB còn lại
  trong `dev.db`, việc ĐỌC, cần `dev.db` đã ổn định).

---

## 📌 Bài học rút ra — áp cho mọi lệnh soạn sẵn từ nay

| Luật | Vì sao |
|---|---|
| **Worktree không có `node_modules`** — mọi lệnh gọi binary phải chạy từ root, dùng `--schema`/`--config` để trỏ | Lỗi 01/08 |
| **Lệnh soạn cho Hoà phải được kiểm đường dẫn từng phần trước khi gửi** | Cùng gốc với Luật 14h — chứng minh đường dẫn trước khi hành động |
| **Lệnh chạm DB luôn kèm bước kiểm ở cuối** (`integrity_check` + `COUNT`) | Nhờ nó mà lần này biết ngay là "chưa chạy" chứ không phải "chạy hỏng" |
