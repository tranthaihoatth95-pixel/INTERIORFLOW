# Bộ đo Home — CỨU TỪ NGOÀI GIT 04/09

Bốn kịch bản này do lane thi công Home viết và chạy **trên app thật**; chúng là thứ đo ra bằng
chứng cho hai khẳng định cốt lõi của bản khoá:

| Kịch bản | Đo gì |
|---|---|
| `chup-home.mjs` | chụp 8 trạng thái × 2 nền × nhiều khổ; xuất **số hình học** ra JSON |
| `do-nen.mjs` | gỡ hẳn dải ảnh khỏi DOM rồi leo cây tìm nền thật của từng nút chữ — chứng minh bất biến *"bỏ ảnh nền vẫn đọc được"* |
| `do-duong-vao.mjs` | đo đường vào dự án |
| `luong-home.mjs` | chạy **luồng** Home → dự án → về Home, và luật PASS (thao tác → ghi → tải lại → vào lại) |

🔴 **Vì sao tệp này tồn tại**: chúng từng nằm trong `.nen-chup/` — thư mục **bị gitignore, ngoài
vùng ghi của phiếu** ⇒ sẽ mất khi worktree bị gỡ. Đúng cơ chế đã làm mất một lô ảnh trước đó.
Luật zero-loss §5: *ignored KHÔNG có nghĩa là không quan trọng* — thứ cần cho tái lập, duyệt hay
gỡ lỗi về sau phải có **địa chỉ bền vững**.

Số hình học đo được nằm ở `docs/delivery/anh-duyet-mat/home-that/do-hinh-hoc/`.
Ảnh đã tracked ở `docs/delivery/anh-duyet-mat/home-that/`.

⚠️ Chạy cần dev server đang bật; đọc đầu mỗi tệp để biết cổng và biến môi trường.
