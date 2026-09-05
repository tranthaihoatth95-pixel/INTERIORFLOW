# `app/library/ingest` — một màn sơn cứng đúng bảng màu anh vừa bỏ

> Tìm ra khi đi đóng cổng `T-cam-hex-inline` 05/09. **Đây không phải chuyện lint.**

## Con số

`app/` có **45 tệp** dính hex gõ cứng. **40/45 nằm trong ĐÚNG MỘT tệp**: `app/library/ingest/page.tsx`.

Các giá trị hay gặp nhất trong đó:

| hex | là gì | token tương ứng |
|---|---|---|
| `#C79A63` ×6 | **vàng đồng** | `--accent-warm` — **anh đã BỎ chiều 05/09** |
| `#EFE9DC` ×7 · `#CFC7B8` ×3 · `#E9D9BE` · `#A88A5B` | kem ấm | **không token nào** |
| `#1B1712` ×7 · `#151109` ×3 · `#0B0906` ×3 | nâu đen | **không token nào** |
| `#8B887F` ×6 | xám ngả ấm | **không token nào** |

## Vì sao đáng báo

1. **Nó mang đúng hướng màu anh vừa loại.** Anh nói *"bỏ màu vàng đấy… tone vàng mà thêm xám vào
   là thảm hoạ"* và *"nền sáng cứ canh theo apple"* (ngả LAM nhẹ). Màn này đang là **kem + nâu +
   đồng**, tức ngả VÀNG — ngược hẳn.
2. **Sơn cứng nên không lối thoát.** Vì là hex chứ không phải token, **đổi theme không cứu được**,
   **đổi màu nhấn không cứu được**. Màn này sẽ giữ nguyên bảng màu cũ kể cả sau khi cả app đổi.
3. **Nó có bảng màu RIÊNG.** 5 trong các màu trên **không khớp bất kỳ token nào** — tức đây không
   phải "quên dùng token", mà là **một hệ màu thứ hai sống song song** trong một màn.

## Vì sao tôi KHÔNG tự sửa

Đổi 40 hex này là **sơn lại cả một màn**, không phải thay tên biến. N-16: máy không phán được
bố cục/gu — đây đúng là gu. Và ba lựa chọn dưới đây cho ra **ba kết quả nhìn khác hẳn nhau**:

| | làm gì | được gì | mất gì |
|---|---|---|---|
| **A** | ánh xạ sang token hiện có (`--bg`/`--panel`/`--t1`/`--accent`) | màn này **theo theme** như mọi màn khác; hết hệ màu thứ hai | mất hẳn cái "chất ấm" của nó — có thể anh cố ý muốn màn nhập liệu ấm hơn |
| **B** | giữ ấm nhưng **khai thành token riêng** (`--ingest-*`) | vẫn ấm, nhưng đổi được ở MỘT chỗ | hợp thức hoá một hệ màu thứ hai — trái luật một-màu-nhấn |
| **C** | để nguyên, khai miễn trừ có lý do | 0 rủi ro thị giác | màn này vĩnh viễn không theo theme; nợ vẫn còn tên |

Tôi nghiêng **A** — vì lý do anh vừa nêu hôm nay (kem trên xám ra xỉn; nền sáng canh theo Apple)
áp cho cả app, và một màn nhập liệu không phải chỗ để có bản sắc riêng. Nhưng đây là **mắt anh**.

⚠️ Trước khi đổi phải **chụp màn này trước/sau** — 40 hex là thay đổi nhìn thấy rõ, không phải
đổi tên biến.
