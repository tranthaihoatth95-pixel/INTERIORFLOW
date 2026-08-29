# IF-DEC-CAI-DAT-BA-TRUC-001 — cài đặt người dùng sống ở đâu

| | |
|---|---|
| **Trạng thái** | ĐÃ QUYẾT · chưa thi công |
| **Ngày** | 29/08/2026 |
| **Đè lên** | `docs/phieu-giao/P-A-don-vi-ty-le.md:40` (16/08) — *"lưu per-user (localStorage… không thêm bảng DB)"* |
| **Ai quyết** | Hoà uỷ quyền 29/08: *"Cài đặt: phân loại theo ba trục Owner / Storage / Reach rồi mới quyết DB"* — không phải quyết định pháp lý, không chứa nội dung khách, nên không cần Hoà ký từng dòng |
| **Rollback** | Chưa đụng mã. Huỷ quyết định này = xoá tệp này; không có gì phải hoàn tác. |

## Quyết định

**Chỉ những khoá có `Reach hiện nay ≠ Reach đáng lẽ` mới là ứng viên đưa vào DB.**
Không phải "khoá nào quan trọng", không phải "khoá nào có `userId`". Đo được **10 nhóm** như thế
trên ~30 nhóm khảo sát; **18 nhóm còn lại giữ nguyên `localStorage`** vì chúng đúng bản chất
tiện nghi theo máy — đưa hết vào DB là phá đúng nguyên tắc local-first của sản phẩm.

**Mười nhóm ứng viên:** tên hiển thị · chỗ đang mở dở (`resume`) · Brand Kit · mẫu tự tạo ·
bảng màu & sổ màu · vật liệu PBR · luật CAD tuỳ biến của xưởng · sổ tay dự án · cột BOQ tuỳ biến ·
thư viện ảnh đầu ra · bình luận + hàng chờ duyệt trong quản lý tệp/thư viện.

## Ca đắt nhất, và nó lật ngược một giả định

`interiorflow.lockIdleMinutes.<userId>` **đính `userId` vào tên khoá** nên đọc mã lên trông như
đã "theo người". Hai câu hỏi tách bạch được:

- **Hai người chung một máy** → `userId` cho mỗi người một ngăn riêng. Đó là tác dụng của trục
  **Owner**.
- **Một người dùng hai máy** → `userId` giống nhau, nhưng `localStorage` của hai máy là **hai kho
  vật lý không nói chuyện với nhau**. Đặt 10 phút ở máy văn phòng, về nhà vẫn thấy mặc định.

⇒ **Đính `userId` KHÔNG đổi trục Reach.** Đây là ca *"sai lý do, đúng kết quả"*: chọn nhầm Owner
(đúng ra là **device**, vì máy để nơi công cộng cần khoá nhanh hơn máy ở nhà), nhưng đích cuối
(không đồng bộ) lại đúng ⇒ **không phải ứng viên DB**.

Còn **8 khoá khác** cũng đính `userId` theo kiểu này — `resume` · `tour` · `stageIntro` ·
`coachmark` · `galleryView` · `homeWidgetPrefs` · hai khoá model gợi ý. Trong đó chỉ `resume`
lệch trục Reach.

## Chỗ tự thú trong chính mã nguồn

Ba khoá tự khai mình là bản tạm: `interiorflow.notebook.<projectId>.**mock**.v1` ·
`filemanager_g4.local_state_v1` (chú thích đầu tệp: *"mock, chưa đụng DB"*) ·
`library_g4.local_state_v1` chứa **hàng chờ duyệt** — mà "chờ duyệt" chỉ có nghĩa nếu **người
duyệt ở máy khác** nhìn thấy. Đây là nhóm hỏng nặng nhất về mặt nghĩa, không chỉ về mặt mất dữ liệu.

## Số đo — và một đính chính về chính số đo

| đo cái gì | lệnh | kết quả |
|---|---|---|
| dòng **nhắc tới** chữ `localStorage` | `grep -rn "localStorage" lib components app` | **543** |
| **lời gọi thật** `localStorage.*Item` | `grep -rnE "localStorage\.(get\|set\|remove)Item" …` | **195** |
| lời gọi `sessionStorage.*Item` | cùng khuôn | **46** |
| tệp **mở IndexedDB thật** | `grep -rlE "indexedDB\.(open\|deleteDatabase)" …` | **5** |
| khoá literal `interiorflow.*` / `if.*` | `grep -rhoE … \| sort -u \| wc -l` | **193** (trần trên) |
| bảng cài đặt trong DB | `grep -cE "^model (UserSetting\|Setting\|Preference)" prisma/schema.prisma` | **0** / 24 model |

🔴 **Con số `543` từng được tôi dùng như thể là số chỗ lưu.** Nó không phải — nó đếm cả **chú
thích** và cả các tệp **giải thích vì sao không dùng** `localStorage`. Số chỗ lưu thật là **195**.
Cùng một lỗi đã trả giá hai lần trong ngày: máy soi quét chú thích như quét mã ([[M-55]]).
Và mệnh đề *"toàn bộ là `localStorage`, `IndexedDB` không xuất hiện"* — do một vùng khám báo về —
**sai**: `IndexedDB` được mở thật trong 5 tệp.

## Việc kế tiếp, theo thứ tự

1. Hai khoá còn dấu `?` phải xếp xong trước khi động vào schema:
   `interiorflow.canvas_wallpaper_v1` · `interiorflow.settings_g4.local_state_v1`.
2. Phép thử Reach cho `brandKits` — **chạy trước khi sửa**, để có số đo "trước":
   tạo Brand Kit ở trình duyệt A → mở cửa sổ ẩn danh (kho `localStorage` riêng) trên **cùng máy**
   → đăng nhập cùng tài khoản, cùng dự án → Brand Kit **không xuất hiện**. Nếu nó xuất hiện thì
   có cơ chế đồng bộ ẩn chưa ai tìm ra, và bảng phân loại phải làm lại.
3. Thi công là một packet riêng, có writer lease riêng. **Không sửa schema trong phiên khám.**
