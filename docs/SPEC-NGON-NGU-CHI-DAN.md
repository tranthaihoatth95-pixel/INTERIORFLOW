# SPEC — HỆ NGÔN NGỮ CHỈ DẪN (semantic guidance · UX writing)

> Hoà 02/08, chê dải cảnh báo *"Flow này có 2 node — chọn Node MASTER ở sidebar chỉ hiện được 1
> việc, mở Node Library để xem đủ"*: **"nói vậy chả ai hiểu gì cả."** Gốc bệnh: câu nói CƠ CHẾ
> bằng THUẬT NGỮ NỘI BỘ. Spec này là luật cho MỌI chữ hiện ra trước người dùng.

## 1 · Năm luật viết (mọi thông điệp)
1. **Hành động trước, cơ chế sau (hoặc bỏ)** — nói người dùng LÀM GÌ và ĐƯỢC GÌ, không giải thích hệ thống vận hành.
2. **Cấm thuật ngữ nội bộ lộ ra UI** — dùng Từ điển §3. Người dùng là KTS/designer, không phải dev.
3. **Ngắn**: 1 câu = 1 ý, ≤ 12 từ, động từ đứng đầu. Tối đa 2 câu/thông điệp.
4. **Kèm NÚT làm ngay** — đừng bảo "mở X để xem"; đặt nút [Xem tất cả] ngay cạnh. Chỉ-chữ-không-nút = thiết kế hỏng.
5. Giọng: tiếng Việt tự nhiên, không sến, không emoji, không "vui lòng" (luật `chat-assist` dùng chung).

## 2 · Bốn loại thông điệp — khuôn cố định
| Loại | Khi nào | Khuôn | Ví dụ |
|---|---|---|---|
| **Trống** (empty state) | chưa có gì | [icon] + 1 câu mời + [nút bắt đầu] | "Chưa có ảnh nào — kéo ảnh vào đây" [Chọn ảnh] |
| **Mách nước** (coach mark) | lần đầu gặp tính năng | 1 câu + [nút thử] + tự tắt sau khi làm 1 lần | "Kéo công cụ ra giữa để mở bảng làm việc" [Thử ngay] |
| **Nhắc trạng thái** (hint strip) | có gì đó user nên biết | 1 câu kết quả + [nút xử] · chỉ hiện khi THẬT SỰ cần | xem §4 |
| **Lỗi chặn** | không đi tiếp được | điều gì hỏng + cách thoát, KHÔNG đổ lỗi user | "Ảnh quá 20MB — chọn ảnh nhỏ hơn hoặc để IF nén lại" [Nén giúp tôi] |

## 3 · TỪ ĐIỂN — nội bộ (cấm lộ) → chữ người dùng thấy
| Nội bộ (code/docs) | UI tiếng Việt | UI EN |
|---|---|---|
| Flow / graph | **bảng làm việc** | board |
| Node | **khối** | block |
| Node MASTER | **công cụ** | tool |
| Node thường | khối | block |
| Node Library | **thư viện khối** | block library |
| Tool window | **cửa sổ công cụ** | tool window |
| campath | **đường máy quay** | camera path |
| subgraph | (không bao giờ lộ) | — |
| stage/mode | **chặng / chế độ** | stage / mode |
| render v2 tier | (không lộ — chỉ hiện "AI" / "tự tính, 0 credit") | — |

## 4 · Sửa mẫu — chính câu Hoà chê
- ✗ Gốc: "Flow này có 2 node — chọn 'Node MASTER' ở sidebar bên trái chỉ hiện được 1 việc, mở Node Library để xem đủ."
- ✓ Mới: **"Còn công cụ khác chưa hiện."** [Xem tất cả] — nút mở thẳng thư viện khối.
- Hoặc nếu ý là flow đơn giản: **"Bảng này mới có 2 khối — thêm công cụ để làm tiếp."** [Thêm công cụ]

## 5 · Thi công
- `lib/i18n.ts` giữ MỌI chuỗi (EN+VI đủ cặp) — không hardcode chữ trong component.
- Coach mark ghi localStorage `seen:*`, hiện đúng 1 lần.
- Nghiệm thu: đọc to câu cho người KHÔNG làm dev nghe — hiểu ngay trong 3 giây mới đạt.

---
*Cowork soạn 02/08/2026 theo yêu cầu Hoà. Nối SPEC-DESIGN-SYSTEM-IF §5 (chữ cũng là thiết kế) · LUAT-CHU-VIET-7.1.23.*
