# Lô `sau-va-hydrat` (05/09) — GIỮ LÀM DẤU VẾT, **KHÔNG PHẢI BẰNG CHỨNG HỒI QUY**

Bảy tệp `*sau-va-hydrat*` trong thư mục này sinh ra từ một lần chạy
`scripts/nghiem-thu-ban-lam-viec/tai-hien-d8.mjs` **lỗi thời**. Chúng báo `MẤT · đĩa=null`.

⚠️ **Đừng đọc con số đó.** Kịch bản ấy lái `input[type=number][min=1][max=180]`, mà ô số tự do
**đã bị thay bằng dải nấc bấm** (Lane K, 22/08). Nó không tìm thấy ô nhập (`coONhap:false`) nên
kết cục luôn là `ghi-bi-nuot` — **phép đo không chạm được thứ nó định đo**.

Phép đo ĐÚNG cho ca này: `scripts/soi-mat/do-nac-khoa-man.mjs` (hồ sơ đĩa mới tinh, vào thẳng
`/settings` ở tab mới, bấm nấc 30, **đóng hẳn** trình duyệt, mở lại). Kết quả 05/09:
đĩa `interiorflow.lockIdleMinutes.<uid> = "30"` · màn hiện `30 phút` ⇒ **CÒN**.

Giữ lại vì xoá bằng chứng của một phép đo hỏng là xoá luôn lý do người sau tin nhầm nó.
