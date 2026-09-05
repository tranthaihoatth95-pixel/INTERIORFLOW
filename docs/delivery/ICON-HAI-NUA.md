# Icon — HAI NỬA, cả hai đều chưa cắm điện

> Lập 05/09 khi định đưa `lib/ui/icon/` từ nhánh cũ sang nền mới. **Suýt đẻ bản thứ hai** —
> đúng bệnh `master tool` ↔ `ToolWindow` (16/08) mà chính sổ này sinh ra để chặn. Ghi lại
> để lượt sau không lặp, và để không ai tưởng "đã có icon riêng rồi".

## Đo tại nguồn 05/09

| | Ở đâu | Là gì | Nơi gọi |
|---|---|---|---|
| **NGỮ PHÁP** | `components/ui/Icon.tsx` (nền mới, 80 dòng) | cỡ quang học **chỉ** {14,16,18,20} · nét **1.5** một giá trị không ngoại lệ · lưới 0 0 24 24 · viền là trạng thái nghỉ hợp lệ duy nhất, tô đặc **chỉ** báo `selected`/`on` và phải **cùng một glyph** | `grep 'glyph={'` = **0** |
| **TỪ VỰNG** | `lib/ui/icon/` (còn ở `integration/2026-09-04`, 21 ký hiệu, hai họ) | hình vẽ thật, thay bộ ngoài | **0** |
| **THỰC TẾ** | 218 tệp `.tsx` | gọi **thẳng** `lucide-react` | 218 |

⇒ Hai mô-đun **không trùng job**: một cái ép **hình học**, một cái cấp **hình vẽ**.
Nhưng **cả hai đều chưa có ai gọi**, còn app thì vẫn đang hiện đúng bộ hình Hoà đã cấm
(*"bỏ visual icon hiện tại → tệ vô cùng tệ. tệ vì thiết kế nó xấu chứ ko phải bản chất của nó"*).

## Vì sao `Icon.tsx` MỘT MÌNH không đóng được lệnh cấm của Hoà
Nó chuẩn hoá **hình học** của icon lucide, nhưng **giữ nguyên nét vẽ** của lucide. Lệnh cấm nhắm
vào **nét vẽ**, không nhắm vào cỡ/độ dày. ⇒ chuẩn hoá xong vẫn là bộ hình đã bị cấm, chỉ đều tay hơn.

## Cách làm ĐÚNG khi thi công — một cửa, không hai
⛔ **KHÔNG** đưa `lib/ui/icon/` sang thành mô-đun đứng riêng cạnh `components/ui/Icon.tsx`.
✅ Từ vựng phải **đi XUYÊN QUA** ngữ pháp: mỗi ký hiệu tự vẽ là một `glyph` hợp lệ của `Icon.tsx`,
để `Icon.tsx` vẫn là **cổng duy nhất** ép cỡ/nét/trạng thái. Một cửa vào, không hai.

## Bẫy đã có người vấp, đừng vấp lại
`Icon.tsx` từng khai "8 assertion PASS" mà **primitive chưa từng chạy**: test cũ chỉ khoá HẰNG SỐ
(cỡ, nét, viewBox), **không ca nào truyền một icon thật vào**. Test xanh, dây chưa cắm.
⇒ Test của lượt thi công phải khẳng định **đường CHÍNH chạy được**, không chỉ khẳng định hằng số.
Đây đúng bài học 15/08 (bug Hough): *test khẳng định đường thoái lui mà không có test nào khẳng
định đường chính chạy được thì đó là test CHE bug, không phải test bảo vệ.*

## Quy mô, để không hứa hão
Đổi 218 tệp trong một lượt là không nghiệm thu nổi. Phải chia đợt theo **bề mặt**
(thanh công cụ → trục phải → rail → thân màn), mỗi đợt tự đứng được và đo lại bằng mắt máy.
