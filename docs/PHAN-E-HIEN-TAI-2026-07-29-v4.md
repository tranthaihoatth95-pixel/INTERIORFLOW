# PHẦN E — Luật vận hành, trạng thái hiện tại (v4, thêm Luật #8 — 29/07/2026)

> Bản v4 = v3 + 1 luật mới (#8). Dán tiếp/đè bản v3 vào `docs/IF-FEATURE-TREE.md` PHẦN E — giữ
> nguyên lịch sử 5 luật gốc (28/07) + luật #6/#7 (29/07) bên trên, đây chỉ append thêm #8.
> Đọc file này là đủ, không cần mở lại v1/v2/v3.

---

## Trạng thái từng luật (không đổi so với v3)

1. ~~Mã bắt buộc trước khi code~~ — **BÃI BỎ.**
2. ~~Ý mới phải qua `IDEAS-BACKLOG.md` trước~~ — **BÃI BỎ.**
3. ~~Cây chỉ mở rộng khi hết pha~~ — **BÃI BỎ.**
4. **Cột "Code" là sự thật duy nhất** — **GIỮ, LUẬT CỨNG.**
5. **Thứ tự: KHÁM → TƯ VẤN → SPEC → CODE** — **GIỮ.**
6. **Luật Đồng Bộ** — tính năng gần giống/hệ quả của nhau → phải tư vấn GỘP. **GIỮ.**
7. **Luật đọc ảnh — 2 lớp giá trị** (tính năng vs giao diện) khi Hoà gửi ảnh tham khảo. **GIỮ.**

## Luật MỚI — 8 · Checklist hoàn thành + Luật xếp hàng gia phả (29/07)

Gồm 2 phần, gắn chặt với nhau:

### 8a — Checklist 6 bước = định nghĩa DUY NHẤT của "đã xong"

Một tính năng chỉ được đánh dấu ✅ trong cây khi đi đủ 6 bước, theo đúng thứ tự — thiếu bước nào,
dừng ở đó, không được nhảy cóc lên ✅:

| # | Bước | Nghĩa | Ai xác nhận |
|---|---|---|---|
| 1 | **BÀN** | Đã thảo luận hướng đi (đúng bước TƯ VẤN của luật #5) | Cowork/Claude Code đề xuất |
| 2 | **APPROVE** | Hoà chốt hướng (lời nói, không cần văn bản dài) | Hoà |
| 3 | **CODE** | Đã viết code thật | Claude Code |
| 4 | **XÁC NHẬN** | Đối chiếu code thật chạy đúng — đúng luật #4, không tin lời báo cáo | Cowork hoặc Claude Code, bằng `file:dòng` hoặc chạy thử |
| 5 | **COMMIT** | `git commit` với message rõ nội dung | Claude Code |
| 6 | **GIT** | `git push` lên `origin/main` (hoặc nhánh đang dùng) | Claude Code |

**Hệ quả**: cây (`IF-FEATURE-TREE.md`) và `STATUS.md` chỉ nên ghi ✅ khi cả 6 bước xong. Nếu mới
tới bước 3-4 (code xong, chưa push) → ghi 🟡 "code xong, chưa commit" thay vì ✅. Việc này biến
luật #4 (Code = sự thật) từ 1 nguyên tắc chung chung thành 1 quy trình kiểm tra được — dễ audit,
dễ biết đang kẹt ở bước nào khi có việc "báo xong" mà thực tế chưa push.

### 8b — Luật xếp hàng gia phả (áp dụng cho MỌI tính năng mới thêm vào cây)

Mỗi khi có tính năng mới (dù qua luật Đồng Bộ gộp vào cái cũ, hay hoàn toàn mới), trước khi ghi
vào cây phải làm 2 việc, không được bỏ qua việc nào:

1. **Phân loại đúng gia phả** — xác định đúng vị trí trong cây 4 cấp (Khối.Nhóm.Tính năng.Nhánh
   con), đặt cạnh nhóm tính năng liên quan nhất (không rải rác, không tự tạo nhóm mới nếu đã có
   nhóm phù hợp) — đúng tinh thần luật #6 (Đồng Bộ) nhưng áp dụng rộng hơn: kể cả tính năng KHÔNG
   trùng/không phải hệ quả của cái nào, vẫn phải xếp đúng chỗ trong gia phả, không thả nổi ở cuối
   file hay ở mục "khác".
2. **Xếp hàng đợi** — gắn tính năng vào đúng vị trí trong chuỗi ưu tiên đang chạy (vd chuỗi 7
   sprint đã lập), không để tồn tại dạng "đã ghi nhận nhưng không biết bao giờ làm". Nếu chưa rõ
   ưu tiên ngay, tối thiểu phải ghi rõ "chờ xếp hàng, đợt sau" — không được để trống hoàn toàn.

**Vì sao cần**: đây chính là cơ chế ngăn tình trạng Hoà mô tả nhiều lần trong nhật ký — ý tưởng bị
lạc, bị làm 2 lần, hoặc nằm im không ai biết ưu tiên tới đâu. Luật #1-3 cũ (mã bắt buộc/backlog/
đóng băng theo pha) đã bị bỏ vì quá cứng nhắc thủ tục; luật #8b thay thế phần **giá trị thật** của
3 luật đó (không bị lạc, không bị trùng, có thứ tự) mà không cần thủ tục nặng.

---

*Cowork, 29/07/2026. Luật #8 áp dụng ngay cho các mục đang treo: 2.3.58/2.3.59 (Present UX B/C) và
ý "catalogue→template batch export" — cả 3 hiện chưa qua đủ bước 8a (mới ở bước 1 BÀN) và chưa
được xếp hàng rõ trong 7 sprint (8b) — sẽ xử lý ở lượt kế tiếp.*
