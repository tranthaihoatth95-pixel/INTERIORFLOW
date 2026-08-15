# LATEST — bản nén trí nhớ bối cảnh IF (ghi đè mỗi phiên lớn)

> **Đọc file này ĐẦU TIÊN nếu cần biết nhanh "đang ở đâu, vừa xong gì, làm gì tiếp" — không tốn
> token quét `docs/` (399 file). Cần chi tiết đầy đủ 1 nhánh việc → mở đúng thư mục trong
> `docs/memory/sessions/<ngày>/<nhánh>/`. File này KHÔNG thay thế `STATUS.md`/`docs/00-CHOT.md`/
> `CHANGELOG.md` — 3 file đó vẫn là nguồn sự thật cho trạng thái/quyết định/lịch sử; đây là lớp
> NÉN THÊM, tổng hợp nhanh phiên gần nhất.**

**Cập nhật lần cuối: 2026-08-15**

## Đang ở đâu
IF là app desktop (Electron bọc Next.js/React), local-first, gọi AI ngoài (Flux qua fal.ai,
TRELLIS cho ảnh→3D) cho vài tác vụ cụ thể. **Chưa có dự án thật hoàn chỉnh nào chạy trọn qua app**
— vẫn ở giai đoạn xây + tự kiểm. "Vòng người dùng thật TTT" vẫn ⬜ chưa làm, đặt làm điều kiện
trước Cửa B.

Ưu tiên hiện tại theo Hoà (15/08): **dứt điểm giao diện — nguyên nhân cốt lõi tạo rào cản dùng
IF trực tiếp.** Đã duyệt NT-1..18 + KB-1..4 (`docs/nc/NC-NGUYEN-TAC-GIAO-DIEN-TOAN-APP-2026-08-14.md`,
`docs/nc/NC-TRIET-LY-GIAO-DIEN-2026-08-14.md`) thành hiến pháp giao diện — dùng làm chuẩn nghiệm
thu mọi UI từ nay.

## 5 nhánh việc phiên 2026-08-15 (chi tiết đầy đủ trong `sessions/2026-08-15/`)
| # | Nhánh | Trạng thái |
|---|---|---|
| 01 | Nam Long Mizuki spec cross-check (việc khách ngoài IF) | ✅ Xong, đã giao file |
| 02 | Furniture-slot chặng 3D — chốt hướng A (Revit-style) | 🟡 Chỉ mới chốt hướng, chưa spec/code |
| 03 | Mirror-completion cho chuan-net | ✅ Code xong, 178 test pass, đã commit `f423652`, chưa push |
| 04 | Toolbar 3 chặng + màn khoá + đi tay QA + phát hiện lỗ V | 🟡 LockScreen xong; ToolbarChip mới dựng component chưa nối; QA đi tay dừng giữa luồng |
| 05 | Dựng hệ trí nhớ 2 lớp (chính việc này) | 🟡 Đang làm |
| 07 | T đóng 2 lệch đỏ + nghiệm thu hàng đợi render trên app thật | ✅ Xong — 4 commit, kết phiên 0 lệch; nút thắt thật là **64 nợ mắt / 1 đã duyệt** |
| 08 | T xử bản tư vấn vai vận hành (Hoà giao quyền chốt) | ✅ NHẬN 4 (⓪TIỀN ĐỀ+⑦b+⑦c vào khuôn phiếu · AGENTS.md thành symlink · 2 entry mới) · BÁC 2 (SIM-LEDGER · agent thứ 6) · đóng dấu ⛔LỖI THỜI lên SPIRAL |

## Việc DANG DỞ — phiên sau nhặt lại ở đây, theo thứ tự ưu tiên
1. Áp `components/ui/ToolbarChip.tsx` (đã dựng) vào 3 nơi thật: `CadToolbar.tsx`, `ToolDock3D.tsx`,
   `present-editor/Toolbar.tsx` — CHƯA nối dây.
2. Tiếp Kịch bản A (KTS vẽ 1 phòng khách-bếp) — đã xác nhận vẽ tường 2D hoạt động đúng (V kiểm
   chéo xác nhận), có thể đi tiếp 3D → render → xuất trình bày ngay.
3. Làm thêm Kịch bản B/C (gấp/khó) — Hoà yêu cầu nhiều kịch bản, mới làm đúng 1.
4. Quyết định phạm vi áp dụng cơ chế V (kiểm chéo độc lập) — áp mọi nghi vấn hay chỉ chốt lớn?
   (Câu hỏi T đang treo, Hoà chưa trả lời.)
5. Viết spec ngắn cho furniture-slot (nhánh 02) nếu Hoà duyệt tiếp.
6. KHÔNG cần làm: "gộp Trình bày vào AppShell" — đã xác nhận nó ĐÃ ở trong AppShell từ trước,
   việc này đóng, đừng mở lại nhầm.

## Luật/quyết định MỚI trong phiên này (đã ghi vào file gốc, liệt kê để không quên tồn tại)
- **Luật báo cáo 6 phần** (`docs/CLAUDE.md` mục "LUẬT CỨNG BÁO CÁO") — mọi báo cáo phải theo khuôn
  Tổng quan→Chi tiết→Tổng kết→Đánh giá khách quan→Hướng xử lý nhiều góc độ→Đề xuất tốt nhất.
- **Cơ chế V lần đầu thực chạy** — thiết kế từ 12/08, chưa từng dùng thật tới hôm nay.
- **`.gitignore` chặn `public/__*.html`** (file scratch/debug tạm).
- **Hệ trí nhớ 2 lớp này** — quy ước mới cho MỌI phiên từ nay: viết chi tiết vào
  `docs/memory/sessions/<ngày>/<NN-nhánh-việc>/README.md`, cập nhật `docs/memory/LATEST.md`
  cuối phiên lớn.
- **Khuôn phiếu §3 nay là ⓪ + 8 ô** — thêm ⓪ TIỀN ĐỀ · ⑦b CHƯA CHẮC/CHƯA KIỂM · ⑦c HẠN DÙNG
  KẾT LUẬN (T chốt 15/08 sau khi kiểm chứng bản tư vấn ngoài).
- **`AGENTS.md` = symlink vào `CLAUDE.md`** — một nguồn duy nhất, cấm dựng bản sao thứ hai của
  luật nền.
- **`QUY_TRINH_SPIRAL_v1.md` đã đóng dấu ⛔LỖI THỜI** — không phải quy trình đang chạy. Luật
  chung: văn bản quy trình bị thay PHẢI đóng dấu tại chỗ, không im lặng bỏ hoang.
- **BÁC vĩnh viễn: khởi tạo SIM-LEDGER · đẻ agent thứ 6 vai tư vấn vận hành** (lý do đầy đủ ở
  `00-CHOT` 15/08) — phiên sau định làm 1 trong 2, đọc lại dòng đó trước.
