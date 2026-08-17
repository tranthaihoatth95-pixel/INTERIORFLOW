# PHIẾU WT-CHOT — chốt một quy ước worktree + soi cả họ máy quét cây

> Giao: T · 17/08 · vùng ghi: `CLAUDE.md` · `.claude/launch.json` · `scripts/*.mjs` (đọc + có thể vá nếu cùng bug) · báo cáo. ⛔ KHÔNG đụng `lib/**` `components/**` `app/**` `--accent*`.

## ⓪b `git log -1` + `HEAD..main` = 0.
## ⓪ TIỀN ĐỀ (có quyền BÁC → DỪNG)
> Đo 17/08: `.worktrees/` **rỗng mồ côi** (git không quản lý, .gitignore chặn) · `.claude/worktrees/` **1.5GB — thật, 2 worktree** · `interiorflow-wt-*` trong CLAUDE.md **chưa dùng lần nào**. Ba quy ước cho một thứ ⇒ 3 máy soi bị bug (package.json vá 16/08 · soi-that vá 17/08 · check-chot vá 17/08).

## ② ĐỌC TRƯỚC
`CLAUDE.md` (mục "Quy tắc worktree") · `.claude/launch.json` · TẤT CẢ `scripts/*.mjs` — grep `worktrees` xem còn máy nào mắc bug.

## ③ VIỆC
1. **Chốt đường thật là `.claude/worktrees/`** — cập nhật CLAUDE.md: bỏ pattern `interiorflow-wt-*`, khai đường Claude Code dùng thật.
2. Sửa `.claude/launch.json` — entry `interiorflow-p3mock-worktree` trỏ `.worktrees/p3-mock` (không tồn tại) → xoá entry đó vì không có mục đích.
3. Grep `grep -rn "worktrees" scripts/*.mjs` — kiểm mọi máy soi khác. Cùng bug (loại thư mục theo chuỗi cứng `.worktrees` mà không có `.claude/worktrees`) thì **vá cùng khuôn với soi-that/check-chot** (loại theo *"tên chứa chữ `worktrees`"*).
4. `.gitignore` — thêm dòng `.claude/worktrees/` nếu chưa có (git đã tự loại vì đó là worktree đăng ký, nhưng ghi rõ ràng phòng khi ai đó tạo dir dạng đó không qua git worktree).

## ⑤ RÀNG BUỘC
· KHÔNG git ghi · KHÔNG chạy `git worktree remove` (cần Hoà chạy tay theo luật CLAUDE.md an toàn) · KHÔNG sửa `git config`.
· Chỉ đọc + sửa CLAUDE.md + launch.json + gitignore + scripts nếu có bug cùng loại.

## ⑥b ĐÍCH trần 5 vòng
Sau khi vá: `for s in scripts/*.mjs; do grep -l "worktrees" $s; done` — mọi kết quả phải có pattern loại-theo-chữ-chứa-worktrees hoặc là comment. `check:chot` và `soi:that` cùng in con số tệp quét **không đổi** so với trước (nghĩa là không quét thêm/bớt tệp thật). `soi:frontier` 0 lệch.

## ⑦ báo cáo `docs/bao-cao-phien/2026-08-17-WT-CHOT.md`. Ghi cần Hoà chạy tay lệnh dọn worktree ở phần TỔNG KẾT.
