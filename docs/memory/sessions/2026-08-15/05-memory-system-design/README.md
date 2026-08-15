# 05 · Dựng hệ trí nhớ bối cảnh LLM 2 lớp — chính việc đang ghi lại đây

## Bối cảnh
Hoà nhận thấy `docs/` phẳng, 399 file, 32MB — lo "nhiễm commit rác" và khó truy vấn. Yêu cầu dựng
cây thư mục 2 lớp: (1) chi tiết đầy đủ theo phiên, đặt tên NGÀY-PHIÊN-NHÁNH VIỆC, KHÔNG SÓT bối
cảnh; (2) 1 file nén mới nhất DUY NHẤT, ghi đè. Ví von rõ: giống nhiều worktree trong 1 repo, mỗi
worktree là 1 mảng lớn có đủ gia phả con — lớn quản lý nhỏ thuộc lớn. Mục tiêu: truy vấn nhanh,
không tốn token đọc lan man.

## Quyết định thiết kế
- **Lớp 1** (`docs/memory/sessions/YYYY-MM-DD/NN-nhanh-viec/README.md`) — TÁI DÙNG tinh thần
  `docs/bao-cao-phien/` đã có sẵn (48 file, đúng hướng nhưng phẳng) — nâng cấp thành cây phân cấp
  ngày→nhánh, mỗi nhánh 1 thư mục tự chứa trọn bối cảnh, không phụ thuộc nhánh khác.
- **Lớp 2** (`docs/memory/LATEST.md`) — 1 file duy nhất, ghi đè mỗi phiên lớn, dòng đầu luôn là
  ngày mới nhất — vai trò: phiên sau đọc CHỈ file này trước để biết đích cần mở tiếp, không quét
  399 file cũ.
- **KHÔNG di dời 399 file cũ trong `docs/` ngay** — rủi ro vỡ tham chiếu (00-CHOT.md/CLAUDE.md
  trỏ đúng đường dẫn hàng chục chỗ). Hệ mới áp dụng CHO TỪ NAY VỀ SAU; dọn/di dời file cũ là việc
  RIÊNG, cần agent quét toàn bộ tham chiếu trước khi động, không làm ẩu trong phiên đang chạy dở.
- **Chống nhiễm commit rác**: thêm `.gitignore` mẫu `public/__*.html` (đúng họ file scratch vừa
  dọn hôm nay — `__cn2-compare.html`, `__lincoln-viewer.html`).

## Việc đã làm
1. Tạo `docs/memory/sessions/2026-08-15/{01..05}-*/README.md` — 5 nhánh việc hôm nay, viết ĐẦY ĐỦ
   không tóm tắt cụt.
2. Tạo `docs/memory/LATEST.md` — bản nén, trỏ vào 5 thư mục trên + trạng thái tổng.
3. Sửa `.gitignore` thêm dòng chặn `public/__*.html`.
4. Nối `STATUS.md`/`docs/00-CHOT.md` trỏ tới `docs/memory/LATEST.md` như điểm vào phụ (không thay
   thế STATUS.md/00-CHOT.md/CHANGELOG.md — 3 file đó vẫn giữ vai trò đã có, LATEST.md là lớp NÉN
   THÊM, tổng hợp cả 3 + phiên gần nhất, không phải bản thay thế).

## CHƯA làm — nói thẳng, việc lớn riêng
- Chưa di dời 48 file `bao-cao-phien/` cũ vào cấu trúc mới (chỉ áp cho phiên mới từ nay).
- Chưa dọn/phân lớp 399 file gốc trong `docs/` — đó là việc dọn dẹp lớn, cần quét tham chiếu kỹ,
  đề xuất làm riêng có agent chuyên trách, không lẫn vào phiên đang dở việc khác.
