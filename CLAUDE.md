## Bắt đầu session
Đọc @STATUS.md TRƯỚC TIÊN. Cập nhật nó cuối mỗi task.

## Quy tắc worktree & context

### Giới hạn cứng
- **Tối đa 3 worktree cùng lúc** (= 3 agent song song). Nếu đã có 3, KHÔNG tạo thêm — hỏi chủ dự án worktree nào dọn trước.
- Mỗi worktree PHẢI đặt tên theo pattern: `interiorflow-wt-{tên-nhánh}` (vd: `interiorflow-wt-ui-motion`).

### Sau khi merge nhánh vào main
1. Chạy test + tsc trên main — PASS mới tiếp.
2. **Xoá worktree đã merge NGAY** — `git worktree remove interiorflow-wt-{tên}`.
3. Xoá nhánh remote nếu đã push: `git branch -d feat/{tên} && git push origin --delete feat/{tên}`.
4. Cập nhật STATUS.md: chuyển mục "đang chạy" sang "vừa xong" hoặc CHANGELOG.md.

### Trước khi bắt đầu sprint mới
- Chạy `git worktree list` — nếu còn worktree cũ từ sprint trước → **DỪNG, báo chủ dự án**, không tự tạo worktree mới chồng lên.
- Kiểm tra ~/Downloads (hoặc folder chứa repo) không có folder `interiorflow-*` rác.

### Chống tràn context
- STATUS.md **dưới 800 từ**. Lịch sử đã xong chuyển sang CHANGELOG.md.
- KHÔNG đọc CHANGELOG.md mỗi đầu phiên — chỉ đọc khi được yêu cầu.
- Nếu gặp lỗi "autocompact thrashing" → nguyên nhân là file quá lớn hoặc quá nhiều file trong context. Báo ngay, KHÔNG tự retry liên tục.
