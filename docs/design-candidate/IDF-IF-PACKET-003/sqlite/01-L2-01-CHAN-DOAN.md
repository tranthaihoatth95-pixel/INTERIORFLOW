# L2-01 · chẩn đoán SQLite — BIÊN NHẬN THÔ

`IF-RELEASE-QA-001` · đo 28/08/2026 · HEAD `2798731` · máy `scripts/proof/chan-doan-sqlite.mjs`
3 arm × 900 s × 8 worker · trần kẹt 30 s · mỗi arm một tiến trình riêng, một bản sao DB riêng.

## Số thô

| arm | journal | sync | lượt | thông lượng | p50 | p95 | **max** | kẹt |
|---|---|---|---|---|---|---|---|---|
| `truoc` — đúng điều kiện 27/08 | `delete` | 2 (FULL) | 968.244 | 1.075/s | 2 ms | 24 ms | **4.337 ms** | không |
| `wal` — chỉ đổi journal | `wal` | 1 | 3.329.886 | 3.697/s | 2 ms | 5 ms | **908 ms** | không |
| `moi` — WAL + `connection_limit=1` + `socket_timeout=10` | `wal` | 1 | 1.941.171 | 2.156/s | 3 ms | 5 ms | **413 ms** | không |

Tổng **6.239.301 lượt**. Mỗi lượt = 1 GHI (`User.lastSeenAt` — nguồn ghi thật của IF, `auth.ts`
cập nhật nó ở gần như mọi request) + 3 ĐỌC (`Project.findMany` · `Flow.count` · `LibraryAsset.findMany`).

## Điều KHÔNG chứng minh được — và đây là kết luận chính

**Cú kẹt L2-01 KHÔNG tái hiện được.** Không arm nào đứng quá 30 giây, kể cả arm mang **đúng**
điều kiện của ngày 27/08 (`journal=delete`, không tham số kết nối), chạy trọn 15 phút với tải
nặng hơn hẳn một người dùng thật.

⇒ Verdict giữ nguyên, nguyên văn:
`PARTIAL — cấu hình WAL/connection mới không gây regression; nguyên nhân L2-01 chưa xác định.`

⛔ **CẤM** gọi WAL hoặc `connection_limit=1` là *root cause* của L2-01. Chúng chưa được chứng minh
chữa cái gì — vì bệnh chưa tái hiện. Đây đúng là cái bẫy đã đẻ ra F-20: một câu chuyện nhân quả
nghe hợp lý, không kiểm.

## Điều CHỨNG MINH được

**① WAL là một cải thiện thật, đo được.** Chỉ đổi journal, không đổi gì khác:
thông lượng **×3,4** (1.075 → 3.697 lượt/s) · đuôi xấu nhất **4.337 ms → 908 ms**.
`journal=delete` khoá độc quyền toàn tệp khi ghi; với IF — vừa đọc vừa ghi liên tục — đó là
cấu hình sai. Kết luận này **độc lập** với câu chuyện L2-01.

**② `connection_limit=1` ĐÁNH ĐỔI, không miễn phí.** So với WAL trần:
thông lượng **−42 %** (3.697 → 2.156 lượt/s) · nhưng đuôi xấu nhất **908 ms → 413 ms**, tức
**×10,5 tốt hơn** so với cấu hình cũ. Với một sản phẩm local-first, một người dùng một tiến
trình, đổi thông lượng lấy đuôi ổn định là **đúng hướng** — 2.156 lượt/s vẫn gấp hàng nghìn lần
nhu cầu thật. Nhưng phải gọi đúng tên nó: **đánh đổi có chủ ý**, không phải bữa trưa miễn phí.

**③ `socket_timeout=10` vẫn đúng dù nguyên nhân là gì.** Hết 10 giây thì ném lỗi thay vì treo.
Một lỗi nói được còn hơn một con quay quay mãi, và nó là điều kiện tiên quyết để tầng giao diện
có "tải hỏng" thật mà vẽ.

## Tải này KHÁC tải thật ở đâu — nói ra, không giấu

Không HTTP/Next · không nhiều `PrismaClient` trong một tiến trình · không phiên đăng nhập ·
không ghi ảnh/tệp · không middleware · không React Server Components.

Cú kẹt 27/08 xảy ra trên **`next dev`**, và `sample` chỉ ra **9 luồng `tokio-runtime-worker`**
đứng chết cùng stack. Chín luồng nghĩa là chín kết nối — tức arm `moi` (một kết nối) **không thể**
tái hiện được hình dạng đó dù có cố. Đây là gợi ý mạnh, **không** phải bằng chứng.

## Việc kế tiếp — bậc bằng chứng duy nhất còn đáng tin

Đo trên chính `next start`: dựng appRoot tạm (không `.env`), DB bản sao, phiên đăng nhập thật,
tải hỗn hợp qua HTTP 15 phút, arm `truoc` vs `moi`. Đó là nơi bệnh đã xảy ra; mọi phép đo ngoài
nó chỉ thu hẹp được không gian nghi ngờ chứ không đóng được ca.

Tái lập biên nhận này: `node scripts/proof/chan-doan-sqlite.mjs --giay 900 --worker 8 --tran-ket 30`
