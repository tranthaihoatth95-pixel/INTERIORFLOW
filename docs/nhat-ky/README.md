# NHẬT KÝ — khảo cổ, không phải bức tranh hiện tại

> ⛔ **Đừng đọc thư mục này để biết IF đang ở đâu.** Bức tranh hiện tại ở
> `docs/control/IF-CURRENT-STATE.md`. Câu hỏi nào cần tra thì mở `docs/control/IF-HOI-DAP.md`.
> Vào đây **chỉ khi** cần khảo cổ một quyết định: *"hồi đó ai chốt cái này, vì sao?"*

## Vì sao có thư mục này (28/08)

Đo được trên kho `docs/`: **907 tệp `.md`** · **173 mồ côi** (19% — không tệp nào trỏ tới) ·
**381 tên khảo cổ** (42% — tên mang ngày tháng hoặc tên máy sinh ra nó, không phải câu hỏi nó
trả lời) · **1 cặp trùng nội dung** (`AGENTS.md ≡ CLAUDE.md`, đúng thiết kế symlink).

Tin tốt: **không có phân kỳ nội dung.** Chỉ có lạc chỗ. Nhưng lạc chỗ đủ để đẻ ra đúng bệnh Hoà
mô tả 28/08 — *"nhiều nguồn cùng tự nhận là sự thật, người mới ngồi xuống đọc nhầm rồi phán sai"*.

**111 tệp** vừa **mồ côi** vừa **tên khảo cổ** được dồn về đây. Chúng không mất gì: `git mv`,
lịch sử nguyên vẹn, cây con giữ đúng như cũ (`bao-cao-phien/`, `nc/`, `COWORK-OUTPUT/`…).

## Điều thư mục này KHÔNG làm

· **Không xoá byte nào.** Đo trước/sau: `docs/**/*.md` = **889 → 889**.
· **Không đụng** `docs/control/` (não bền) và `docs/design-candidate/` (hợp đồng đang sống).
· **Không đổi tên tệp nào.** Đổi tên hàng loạt là gãy mọi tham chiếu — lớp lỗi B
  (*đúng thao tác, sai đối tượng*). Kho tự dọn theo nhu cầu thật, không dọn theo lịch.

## Lùi lại

```
git revert <commit dọn>
```
Một lệnh, mọi tệp về chỗ cũ. Không có migration dữ liệu, không có gì phải khôi phục.

## Đo lại bất cứ lúc nào

```
node scripts/soi-kho-tai-lieu.mjs
```
Chỉ đọc, không dời tệp nào.
