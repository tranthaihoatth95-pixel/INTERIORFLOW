# Ai là ai, chữ là gì — bản cho máy đọc

> Bản cho **mắt Hoà** là một trang xem được (artifact). Agent **không đọc được** trang đó.
> Tệp này là **cùng nội dung, cho máy**. Sửa một bên phải sửa bên kia — hoặc bỏ hẳn một bên.

## 1 · Ai đang ngồi ở bàn

Tất cả đều tên "Claude" hoặc "GPT". Khác nhau đúng hai chỗ: **có sửa được tệp trên máy Hoà không**,
và **tiêu tiền gói nào**.

| Có tay | Tên | Thật ra là gì | Tiền |
|---|---|---|---|
| ✅ | **Claude Code** | chạy trên máy Hoà: đọc/ghi tệp, chạy lệnh, git, trình duyệt. Nơi mã thật được viết | gói Claude |
| ✅ | Sub-agent | **vẫn là Claude Code**, thêm một đầu với trí nhớ trắng. Không phải chuyên gia khác | cùng gói |
| ❌ | claude.ai | chat trong trình duyệt. Không thấy repo, không chạy được gì | cùng gói |
| ❌ | Claude Design | mặt bằng vẽ. Không đụng repo | cùng gói |
| ❌ | ChatGPT | chat. Không tay | Plus |
| ✅ | Codex | agent lập trình OpenAI, có tay nếu được cấp repo | Plus |
| ✅ | "lane 00/04/07/30…" | **KHÔNG phải 9 chuyên gia.** Là **một Codex** được bảo 9 lần đóng 9 vai. Mỗi vai nạp lại toàn bộ bối cảnh mới nói được một câu | Plus **×9** |

> **Vai thì rẻ. Phiên thì đắt.** Đo 28/08 khi đọc 7 lane: khối `AUTHORITY RESET` dán nguyên văn
> **4 lần**, khối chỉ thị điều phối **3 lần**, và **4 lane dừng để rà backlog của chính chúng**.
> Đó là chỗ hoá đơn của Hoà đi mất — không phải Hoà tiêu hoang.

## 2 · Hai câu sàng — công cụ của Hoà, dùng được với mọi AI

Khi ai đó mang một quyết định tới bàn:

> **① "Cho tôi xem thứ tôi tự kiểm được."**
> **② "Nếu tôi im lặng thì chuyện gì xảy ra, và gỡ lại bằng cách nào?"**

**Không trả lời được cả hai ⇒ đó không phải quyết định của Hoà.** Đó là việc của máy — máy phải
tự quyết, chọn đường lùi được, rồi ghi lại.

Ba loại **thật sự** là của Hoà: **mắt** (đẹp/xấu, đúng gu nghề) · **tiền · pháp lý · riêng tư** ·
**việc không lùi được**. Mọi thứ khác đang xếp hàng chờ Hoà, phần lớn là **máy lười quyết**.

⛔ **Luật cho mọi agent:** không được đưa Hoà một quyết định mà không kèm đủ ① và ②.

## 3 · Vòng làm việc — Hoà chỉ ở hai nhịp

| | Nhịp | Ai |
|---|---|---|
| 01 | **Hoà chỉ việc** — một câu, bằng tiếng của Hoà, không cần đúng thuật ngữ | Hoà |
| 02 | **Đọc lại đề cho Hoà nghe** — tóm tắt hiểu đề + đề xuất. Nếu chính yêu cầu có vấn đề hoặc lệch mục đích chung, **nói ngay ở nhịp này**, không chạy xong mới kể | máy |
| 03 | **Làm** — đo → viết → chạy → tự cố bác bỏ | máy |
| 04 | **Đưa thứ nhìn được** — ảnh app thật, tệp mở được — **trước** báo cáo | máy |
| 05 | **Hoà nhìn và phán** — bằng mắt, không cần đọc mã | Hoà |

Thấy Hoà xuất hiện ở nhịp khác 01/05 ⇒ máy đang trút việc sang Hoà.

## 3b · NHẮC VIỆC — bắt buộc khi đổi chủ đề

Hoà 28/08: *"mỗi một trả lời mà nội dung sắp bị dẫn dắt sang chủ đề khác, thì tóm lại những việc
cũ đang còn, những gì đạt được những gì chưa — tất cả gói gọn trong **ngưỡng chống phình**."*

**Khi nào:** lượt trả lời mà chủ đề khác lượt trước. Không phải mọi lượt — đổi chủ đề mới nhắc.

**Khuôn — bốn dòng, mỗi dòng MỘT dòng. Đây là trần, không phải gợi ý:**

```
⏸ NHẮC VIỆC
đang dở  · …
đạt      · …
chưa     · …
chờ Hoà  · …        ← chỉ ghi mục ĐANG CHẶN, không liệt kê cả bảy
```

**Ngưỡng chống phình:** ≤ 4 dòng · ≤ 60 từ · **không bảng, không liên kết, không giải thích**.
Cần giải thích thì đó không phải nhắc việc, đó là một lượt trả lời khác.

**Vì sao có trần:** nhắc việc mà dài thì bị bỏ qua như mọi thứ dài khác — và lúc đó nó thành thứ
tệ hơn im lặng, vì nó tạo cảm giác đã nhắc. Dài quá trần ⇒ cắt, không xin phép.

Nguồn để điền: `docs/control/IF-CON-THIEU-GI.md` (chờ Hoà) · `IF-CURRENT-STATE.md` (đang dở).

## 4 · Ba công thức — 21 lỗi rút gọn

Sổ lỗi có 21 mục và chính nó ghi *"cùng lớp với F-03"* **sáu lần** — nhận ra trùng tính chất rồi
vẫn ghi thêm mục mới. Rút gọn thật chỉ có ba. Máy tra: `npm run tra "<vấn đề>"`.

| | Lớp | Thuốc chung — một thuốc cho cả lớp |
|---|---|---|
| **A** | **CÓ MẶT ≠ CÓ TÁC DỤNG** — thứ gì đó tồn tại nên tưởng nó đang chạy. Máy soi rỗng vẫn báo xanh | mọi máy canh phải có **ca đột biến**: cố tình làm hỏng, máy **phải** đỏ |
| **B** | **ĐÚNG THAO TÁC ≠ ĐÚNG ĐỐI TƯỢNG** — lệnh chạy hoàn hảo, vào nhầm chỗ | mọi thao tác có hậu quả phải **in ra đích thật**, dừng chờ xác nhận. Không tin biến môi trường, không tin ý định |
| **C** | **KHẲNG ĐỊNH VƯỢT QUÁ BẰNG CHỨNG** — nói chắc hơn thứ đã đo | mọi kết luận phải **mang theo phạm vi**; chữ PASS chỉ do **người khác** nói sau khi chạy thật |

## 5 · Luật là gì

> **Luật là thứ mà vi phạm thì không làm xong được việc của mình.**
> Tài liệu là lời chúc. **Cổng** mới là luật.

Mọi luật trí nhớ trước nay đã chết vì chúng nằm trong tài liệu, mà tài liệu không chặn ai làm gì.
⇒ Nối vào **đúng cái cổng đã chặn mã** (`npm test`). Đó là **tác động chéo** (Hoà, 28/08).

Đang nối: `soi:quan-tri` L6 (quên đóng mốc) · `soi:thu-muc` (thư mục chưa ai quyết) ·
`soi:giay-phep` (GPL trong bộ cài) · `check:chot` · `soi:foundation`.
