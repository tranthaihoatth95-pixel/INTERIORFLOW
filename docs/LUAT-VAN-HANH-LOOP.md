# LUẬT VẬN HÀNH LOOP — chạy chuỗi dài, báo cáo qua FILE

> Hoà chốt 01/08 ("gật, và tôi vẫn theo dõi"). Mục tiêu: giảm ~20 vòng dán/ngày còn 2–3,
> KHÔNG giảm chuẩn kiểm. Áp cho cả hai phiên Claude Code + Cowork.

## 1 · Cách chạy

1. Mỗi phiên nhận MỘT chuỗi việc (3–6 việc) thay vì từng việc lẻ.
2. Sau MỖI việc: KHÔNG dừng chờ — GHI báo cáo vào file của mình rồi tự sang việc kế:
   - Code chính  → `docs/BAO-CAO-CHINH.md`
   - Code phụ    → `docs/BAO-CAO-PHU.md` (trong worktree của nó)
3. File báo cáo APPEND-ONLY, mỗi việc một mục theo khuôn:
   `## [HH:MM] <tên việc> — <trạng thái>` rồi 4 dòng: commit · test/số đo · chỗ chưa chắc (💭) ·
   CẦN HOÀ/COWORK (nếu có).
4. Cowork tự thức dậy theo lịch, ĐỌC hai file báo cáo, kiểm chọn lọc (14f), soạn sẵn khối lệnh
   kế → Hoà chỉ dán 2–3 lần/ngày.

## 2 · BẮT BUỘC DỪNG — loop không được vượt

- Đụng quyết định cơ chế · giao diện · chuẩn nghề · tính năng · tiền/credit → GHI mục
  `⛔ CẦN HOÀ` vào báo cáo, DỪNG chuỗi tại đó (làm tiếp việc khác không phụ thuộc nếu có).
- Hỏng 2 lần cùng một việc (luật 14e) → dừng việc đó, ghi tiền đề nghi sai, sang việc kế.
- Mọi lệnh máy-thật (git merge · prisma push/migrate · VACUUM) → soạn lệnh vào báo cáo, không chạy.
- tsc/eslint/test PHẢI sạch trước khi ghi "xong" — không tích lỗi sang việc sau.

## 3 · Worktree — hết chiến tranh lock

- Code CHÍNH làm ở `~/Downloads/interiorflow` (main).
- Code PHỤ làm ở `~/Downloads/interiorflow-phu` (worktree, nhánh `nhanh-phu`,
  node_modules + .env symlink về bản chính — KHÔNG npm install lại).
- Hết mỗi sprint: code phụ soạn lệnh merge cho Hoà chạy trên máy thật. Không merge qua sandbox.
- Code phụ KHÔNG đụng dev server (chạy ở bản chính); test bằng sucrase-node như cũ.

## 4 · Luật cũ giữ nguyên toàn bộ

Code là sự thật · số là đầu ra lệnh · trung tính · nhãn 🔍/🧮/💭 · Claude Code cấp mã ·
quyết định chốt thì thêm 1 dòng vào 00-CHOT.md · Hoà vẫn theo dõi và có quyền cắt ngang bất kỳ lúc nào.

*Cowork lập 01/08/2026 theo chốt của Hoà.*
