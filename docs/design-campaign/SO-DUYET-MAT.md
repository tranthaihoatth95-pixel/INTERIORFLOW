# SỔ DUYỆT MẮT — Hoà nhìn Electron, nói; MAIN ghi
Khuôn cố định. **Không sửa ngay** — ghi rồi đi tiếp; cuối đợt chỉnh một lượt.

```
[N] MÀN · TRẠNG THÁI — nguyên văn Hoà nói
    LOẠI: thị giác | hành vi | dữ liệu | ngôn ngữ | hiệu năng
    HỆ THỐNG? có/không
    TRẠNG THÁI: mở | đã sửa | bác (kèm lý do)
```

Luật: mục `HỆ THỐNG? có` sửa ở **token/primitive**, cấm vá màn lẻ.
Mục bị **bác** phải ghi lý do — không im lặng bỏ qua ý của Hoà.

---
## Đợt 1

```
[1] G3 · nút "Vào xưởng" (4 trạng thái) — "cụm này màu tím làm nền là đã ko thấy
    mấy cái line r, nên bỏ line."
    LOẠI: thị giác
    HỆ THỐNG? CÓ — không phải chuyện một bản vẽ
    TRẠNG THÁI: đã sửa (bản vẽ) · CÒN MỞ (đặt tên vật liệu)
```
**Vì sao đây là chuyện hệ thống, không phải xoá hai dòng CSS.** Lưới nét thẳng trong bộ
kính có MỘT việc: nét thẳng bị bẻ là bằng chứng khúc xạ duy nhất không cãi được. Ở ô tím
nó không làm được việc đó — `.if-vao-xuong` là nền TÍM ĐẶC (`globals.css:2120`) cộng
`isolation:isolate` CHỦ Ý cắt nút khỏi nền sau. Lưới nằm sau mặt đục ⇒ không nét nào vào
được quang học của nút. Bản vẽ vẫn bày lưới ra và chú thích rằng thiếu nó thì *"luật ④
trượt ngay"* — tức nó khai một phép chứng minh mà chính nó không chạy được.
⇒ Hoà nhìn ra bằng mắt cái mà máy soi không bắt: **cơ chế chứng minh không với tới được
thứ nó nhận là đang chứng minh.** Ghi thành F-14.

```
[2] ĐĂNG NHẬP · nút "Vào xưởng" — "nút tím login bề ngang nên gọn lại là dc."
    LOẠI: thị giác
    HỆ THỐNG? KHÔNG — một nút, một bề mặt
    TRẠNG THÁI: đã sửa
```
Đo runtime: **384×60 (6,4:1) → 268×60 (4,5:1)**, canh giữa. Nút cao 60px là hệ quả của chốt
23/08 (kính lỏng cần diện tích mới đọc được) — nhưng cao 60 mà kéo hết bề ngang thì ra tỉ lệ
của một THANH, không phải một NÚT. Hai chốt đúng riêng lẻ, ghép lại thành sai: **nâng chiều cao
mà không xem lại chiều ngang.** Giữ `w-full` làm trần cho khổ hẹp.
