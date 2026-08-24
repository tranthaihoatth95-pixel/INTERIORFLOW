---
name: if-ui-convergence
description: Quy trình đưa MỘT bề mặt giao diện InteriorFlow đi trọn từ hiện trạng tới hội tụ — truy chủ sở hữu runtime, tái dùng khuôn canonical, đối chiếu đích Claude Design, thi công, soi trên app thật, giết bản legacy, ghi lại trạng thái. Dùng khi được giao "làm màn X", "sửa giao diện X", "đồng bộ X theo bản vẽ", hoặc khi đi lần lượt qua nhiều bề mặt. Đây là QUY TRÌNH; tri thức thiết kế nằm ở skill `if-design`, chấm điểm nằm ở skill `if-design-review`.
---

# IF · HỘI TỤ MỘT BỀ MẶT

> **Tệp này là QUY TRÌNH, không phải kho tri thức.** Mọi câu hỏi *"thiết kế thế nào cho đúng"*
> đều trả lời bằng cách **gọi skill `if-design`**, không chép luật vào đây. Mọi câu hỏi
> *"đã đạt chưa"* trả lời bằng **skill `if-design-review`**. Chép luật vào đây là đẻ nguồn
> thứ hai — hỏng việc.

---

## 0 · BA LUẬT KHOÁ CỨNG — đọc trước khi chạm bất cứ gì

### L1 · CHỈ CLAUDE DESIGN TRẢ LỜI CÂU HỎI THỊ GIÁC

| Tình huống | Việc phải làm |
|---|---|
| **Có** đích canonical trong `docs/mocks/CLAUDE-DESIGN-CURRENT.md` | **THI CÔNG** đúng bản đó |
| **Chưa có** | ghi **DESIGN MISSING** rồi **trả về Claude Design** — không tự vẽ |
| Sản xuất **lệch** đích | **so và sửa cho khớp** đích, không sửa đích cho khớp sản xuất |
| Design System **không diễn đạt nổi** thứ cần | đây là **vấn đề cấp hệ thống** ⇒ đưa lên **Foundation**, không vá tại chỗ |

⛔ **MAIN KHÔNG BAO GIỜ được âm thầm bịa ra câu trả lời thị giác còn thiếu.**
Bịa một lần là bản vẽ mất quyền làm nguồn sự thật, và không ai biết chỗ nào là bịa.

### L2 · BƯỚC ⑨ (TRÌNH DUYỆT THẬT) LÀ BẮT BUỘC, KHÔNG NGOẠI LỆ

Chụp **và tự nhìn** — đọc ảnh bằng công cụ Read, không suy từ số CSS.
**Ca thật 23/08:** một lane tính bố cục bằng số CSS, **chưa mở màn lần nào**, giao ra một
tường thẻ trắng. Chủ dự án mở app và nói đúng một chữ — *"XẤU"*.

### L3 · "XONG" NGHĨA LÀ GÌ — thiếu MỘT mục là chưa xong

☐ có bản vẽ canonical ☐ có mã ☐ có **ảnh app thật** ☐ **cả sáng lẫn tối**
☐ bàn phím ☐ giảm chuyển động ☐ **dữ liệu thật** ☐ đã so đích ↔ sản xuất
☐ đã qua **`if-design-review`**

---

## 1 · CHUỖI 17 BƯỚC — chạy đúng thứ tự, không nhảy cóc

### ① Trạng thái hiện tại
Đọc `docs/control/IF-CURRENT-STATE.md` — bề mặt này đang ở đâu, ai đã chạm, nợ gì.
Tệp chưa tồn tại ⇒ tạo ở bước ⑯, và khai **CHƯA CÓ SỔ TRẠNG THÁI** trong báo cáo.

### ② TRUY CHỦ SỞ HỮU — làm trước khi sửa một dòng nào
```
route  →  component runtime canonical  →  còn bản sao/legacy nào đang sống?
```
- Từ `app/**/page.tsx` lần theo import tới **đúng component đang render**, ghi `tệp:dòng`.
- Grep tên component: **>1 nơi mount** ⇒ có bản sao, phải xác định bản nào là canonical.
- ⚠️ **Sửa nhầm bản sao = sửa xong không thấy gì đổi.** Đây là chỗ mất thời gian nhiều nhất.

### ③ VIỆC CỦA CON NGƯỜI
Gọi skill **`if-design`** → `knowledge/human-centered-design.md`.
Trả lời trước khi vẽ: ai · họ đang cố làm gì · cái gì đáng được chú ý · **cái gì nên biến mất**.

### ④ Khuôn canonical đã có
Tra khuôn/primitive dùng chung **đang sống trong mã** (thanh công cụ, panel, thẻ, tooltip…)
rồi **tái dùng**. ⛔ **CẤM đẻ khuôn mới** khi khuôn cũ diễn đạt được — đẻ khuôn là đẻ nguồn thứ hai.
Cần khuôn thật sự mới ⇒ đó là việc **cấp hệ thống**, đi đường L1 (Foundation).

### ⑤ Đích Claude Design
`docs/mocks/CLAUDE-DESIGN-CURRENT.md` — tra trạng thái: `APPROVED TARGET` dựng · `IN DESIGN`
không bịa · `DESIGN REQUIRED` giao ngay · `SUPERSEDED` **cấm dựng**.

### ⑥ Hợp đồng thiết kế
Xuất theo `.claude/skills/if-design/contracts/design-contract-template.md`.

### ⑦ Thi công
Chỉ trong phạm vi chủ sở hữu đã truy ở ②.

### ⑧ DỮ LIỆU THẬT
⛔ Cấm fixture, cấm `0/0`, cấm khung rỗng chờ nội dung. Không có dữ liệu thật ⇒ thiết kế
**trạng thái rỗng có thật**, đừng bày dữ liệu giả.

### ⑨ TRÌNH DUYỆT THẬT — chụp và **TỰ NHÌN** (xem L2)
Ghi rõ **cổng nào · phục vụ mã nào** (`/api/dev-identity`), route, theme, bề rộng, đăng nhập chưa.

### ⑩ Bàn phím · ⑪ Cảm ứng · ⑫ `prefers-reduced-motion`
Ba bước, ba lượt riêng. ⚠️ *"đã có trong mã"* ≠ *"tới được người dùng"*.

### ⑬ So đích ↔ sản xuất
Đặt ảnh bản vẽ cạnh ảnh app. Lệch ⇒ **sản xuất sai**, sửa sản xuất (L1).

### ⑭ Sửa — quay lại ⑦, không tuyên bố xong giữa chừng.

### ⑮ CHỨNG MINH LEGACY ĐÃ CHẾT
Không đủ khi nói *"đã thay"*. Phải chứng minh **bản cũ không còn đường vào**: không route,
không mount, không cờ bật lại được. Còn đường vào ⇒ chưa xong (**ca F-01: ghi sổ rồi vẫn sống
trên app đến tận 23/08**).

### ⑯ Cập nhật `docs/control/IF-CURRENT-STATE.md`
Bề mặt · chủ sở hữu `tệp:dòng` · đích canonical · phần DESIGN MISSING · nợ còn lại.

### ⑰ Đi tiếp bề mặt kế — quay về ①.

---

## 2 · TRỌNG TÀI

Trước khi tuyên bố xong: chạy skill **`if-design-review`**.
Nó chấm, nó **không** thiết kế. Người vẽ không được là người duy nhất chấm.

## 3 · CẠN CONTEXT GIỮA CHỪNG

Dừng đúng chỗ, chạy skill **`if-handoff`** — ghi rõ đang đứng ở **bước nào trong 17 bước**.
