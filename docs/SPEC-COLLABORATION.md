# SPEC — CỘNG TÁC NHÓM *(bình luận ngữ cảnh)*

> **[CẦN HOÀ DUYỆT]** · App đã có: 10 thành viên · credit dùng chung · thư viện Reference chung
> — nhưng **không có chỗ nào để trao đổi**.

---

## 1. ⚠️ ĐỪNG làm chat CHUNG kiểu Slack (tán gẫu) — chat GẮN NGỮ CẢNH DỰ ÁN thì được

> **CHỐT 28/07 (Q2a, sau khi khám thấy `components/ChatPanel.tsx` + model `ChatMessage` đã tồn
> tại và đang dùng thật)**: luật cấm ở mục này nhắm tới **chat CHUNG, KHÔNG gắn ngữ cảnh** —
> kiểu kênh "general" của Slack, nơi ai cũng thấy mọi tin nhắn của mọi dự án, dùng để tán gẫu.
> Đó là thứ Lark/Zalo đã làm tốt, xây lại là lãng phí.
>
> **Chat GẮN NGỮ CẢNH DỰ ÁN (scoped theo project/flow đang mở) KHÔNG nằm trong luật cấm này** —
> đây là kênh trao đổi nhanh giữa người đang cùng làm chung 1 dự án ngay trong lúc thao tác, khác
> hẳn "kênh chat chung" mà Lark/Zalo cung cấp (2 app đó không biết "đang mở dự án nào", không thấy
> canvas/bản vẽ đang thao tác). `ChatPanel.tsx` hiện tại đúng loại này (gắn theo flow đang mở, không
> phải kênh toàn công ty) → **GIỮ NGUYÊN**, không phải nợ kỹ thuật.
>
> Ranh giới cụ thể — 1 tính năng có 2 câu hỏi để biết thuộc bên nào:
> 1. Tin nhắn có TỰ ĐỘNG gắn với 1 dự án/đối tượng cụ thể không? (có = được phép, không = cấm)
> 2. Mở tin nhắn ra có biết ngay "đang nói về cái gì trên sản phẩm" không, hay chỉ là chữ nổi?
>    (biết ngay = được phép, chỉ chữ nổi = cấm, thuộc về Lark/Zalo)
>
> Bảng dưới vẫn đúng để so sánh chat CHUNG (cấm) với bình luận GHIM ĐỐI TƯỢNG (mục 2, khác hẳn cả
> chat chung lẫn `ChatPanel` — ghim vào đúng mảng tường/slide/phòng, không phải chat theo dự án):

Team đã có Lark/Zalo cho chat chung. Thêm một kênh CHUNG nữa = **thêm chỗ để bỏ sót tin nhắn**.

| | Chat chung *(kiểu Slack, KHÔNG gắn ngữ cảnh)* | Chat gắn ngữ cảnh dự án (`ChatPanel.tsx`, GIỮ) | **Bình luận gắn vào đối tượng** ⭐ |
|---|---|---|---|
| Nội dung | "phòng khách render lại giúp" (ai đang nói về dự án nào?) | Trao đổi nhanh trong lúc cùng mở 1 flow | Ghim thẳng lên **đúng mảng tường** trong ảnh |
| Tìm lại sau 2 tuần | Không nổi | Nổi trong đúng dự án đó | Mở ảnh ra là thấy |
| Lark/Zalo làm được? | ✅ đã có rồi | ❌ không biết đang mở dự án nào | ❌ **không bao giờ** |
| Nên làm? | ❌ | ✅ đã làm, giữ | ✅ (bậc N, xem mục 3 — chưa làm) |

> **Nguyên tắc**: đừng xây lại cái đã có sẵn (chat chung). Xây cái Lark/Zalo không thể có —
> **bình luận neo vào đúng vị trí trên sản phẩm** (mục 2) VÀ chat biết ngữ cảnh dự án đang mở
> (đã có, giữ nguyên).

## 2. Ba nơi cần bình luận

| Nơi | Ghim vào gì | Ai dùng |
|---|---|---|
| **Ảnh render** | Vùng khoanh trên ảnh | Nội bộ QC · khách duyệt |
| **Slide deck** | Ô/khối trên slide *(O3 hồ sơ sống)* | **Khách** comment qua link |
| **Bản vẽ CAD** | Phòng / vùng / đối tượng | Nội bộ · chủ trì duyệt |

## 3. Bậc N

- Ghim bình luận vào vùng · trả lời theo luồng · **đánh dấu đã xử lý**
- **@nhắc tên** → gửi thông báo
- **"Việc của tôi"** — gom mọi bình luận nhắc đến mình, xuyên mọi dự án
- Bình luận mang `projectId` + id đối tượng *(luật output không id = mồ côi)*

## 4. Bậc P/L

| Bậc | Nội dung |
|---|---|
| P | Khách comment qua link không cần tài khoản · phiên bản có tên · so sánh v1↔v2 |
| L | Bình luận → **FeedbackRecord** nạp về T5 · gom bình luận thành "bài học dự án" trong KnowledgePack |

## 5. Local-first

Bình luận **nhẹ** (text + toạ độ) → thuộc nhóm **đồng bộ lên Lark/cloud** *(không phải dữ liệu nặng
ở máy)*. Đây là một trong những thứ đầu tiên cần Pha 2 sync — vì cộng tác thì bắt buộc phải online.

---

*v1.1 (28/07 — Q2a: làm rõ ranh giới "chat chung cấm" vs "chat gắn ngữ cảnh dự án được phép",
`ChatPanel.tsx` GIỮ nguyên) · 2026-07-28 · Hoà quyết, Claude ghi theo `docs/IF-MASTER-TREE.md`.*
*v1.0 · 2026-07-26 · Ben soạn theo ý Hoà.*
