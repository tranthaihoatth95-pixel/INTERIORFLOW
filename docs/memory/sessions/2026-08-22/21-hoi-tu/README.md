# Wave 17 — HỘI TỤ §24A: HOME (một Home · gỡ widget bị bác)

## Trạng thái 5 trục (§19)
| Frontier | DESIGN | IMPLEMENTATION | FUNCTION | REAL BROWSER | VISUAL MATCH |
|---|---|---|---|---|---|
| **HOME — widget ánh sáng** | SUPERSEDED (Hoà bác) | **COMPLETE** — gỡ hẳn, không tắt bằng cờ | PASS | **PASS** (bằng chứng bundle) | n/a — thứ bị gỡ |
| HOME — tổng thể | APPROVED/PARTIAL BY STATE | PARTIAL | PARTIAL | **BLOCKED** (Home thật sau đăng nhập) | FAIL |
| VITALS | — | — | **FAIL** (false calm) | FAIL | — |

## ① Một Home duy nhất — đã truy, không đoán
`app/page.tsx → HomeScreen → DongStudioHome`. **Không có `FirstUseHome`** trong production
(`grep FirstUse|first-use` = 0). `LivingCanvas`/`BatDauNgaySoKhong` là THÀNH PHẦN bên trong
`DongStudioHome`, không phải Home thứ hai. ⇒ §7 "một Home" đã đúng sẵn ở tầng cấu trúc.

## ② Widget ánh sáng — GỠ HẲN, và vì sao không dùng cờ
🔴 Đo được: Home mount `LightClock` ở **BA chỗ**, chỉ **MỘT** truyền cờ `truong`.
⇒ Hai chỗ kia **vẫn dựng nguyên** cung mặt trời · 05:00/20:00 · nhãn kelvin — tức nhánh Hoà đã bác
**VẪN VỚI TỚI ĐƯỢC**. Cờ che được một chỗ, không che được cả cây.
§17: đánh dấu superseded trong sổ mà mã còn render được = **LỖI SẢN XUẤT**, không phải nợ giấy tờ.
⇒ Xoá 34 dòng khối đo + bỏ hậu tố `· 5600K` trong nhãn + gỡ biến chết `arcX/arcY`.
Ánh sáng ngày Ở LẠI dưới dạng **môi trường** (tên buổi · độ ấm) — thứ người dùng CẢM.

## ③ BẰNG CHỨNG KHAI TỬ (§17 đòi chứng minh, không đòi lời hứa)
Soi **bundle đang phục vụ** trên `:3778` (tôi tự chạy, không nhận lời phiên khác):
| chuỗi | số chunk |
|---|---|
| `05:00` | **0** |
| `20:00` | **0** |
⇒ Hai đầu mút của cung **không tồn tại** trong JS được phục vụ ⇒ không nhánh nào dựng lại được.
Mạnh hơn một ảnh chụp: ảnh chỉ chứng minh MỘT trạng thái, bundle chứng minh MỌI trạng thái.
+ máy canh `components/home/widgets/light-clock.test.ts` chặn nó quay lại bằng bất kỳ cờ nào.

⚠️ Chưa chụp được Home THẬT: `/` chưa đăng nhập ⇒ ra màn đăng nhập. Tôi không gõ mật khẩu.

## ④ Kelvin còn MỘT chỗ — CỐ Ý KHÔNG XOÁ, chờ Hoà phán
`components/wallpaper/WallpaperSettings.tsx:77` — `Đang là: BAN NGÀY · 5600K`. **Nơi đọc duy nhất**
(`lightLabel` nay 0 nơi đọc).
Lập luận của `interiorflow-1f`, tôi đồng ý: đây là **màn CÀI ĐẶT**, nơi người dùng đang chỉnh chính
hành vi ánh sáng — bày ra hệ đang làm gì là **đúng**, không phải vi phạm. Luật nhắm vào **Home**
(cảm được giờ mà không phải đọc thiết bị đo). Xoá một readout hợp lệ chỉ vì nó **trùng chuỗi** với
widget bị bác là **khớp mẫu, không phải phán đoán**.
⇒ Ghi làm **câu hỏi mở cho Hoà/design**, không chặn.

## ⑤ Dữ liệu rác vào Home — NHẸ HƠN báo cáo của Lane A
`app/api/home/summary/route.ts:42` **đã lọc** `NOT: { name: { startsWith: '__nb:' } }` + `deletedAt: null`
+ `userId: user.id`. ⇒ 5 placeholder và 5 fixture (thuộc `demo@if.local` · `smallfixes-verify@ttt.vn`
· `guard-*@test.local`) **không vào Home của Hoà**. Con số "21/21 · 19 bản nháp" đến từ `flow`, mà
flow "Untitled flow" là **tên mặc định THẬT** khi người dùng tạo flow — không phải fixture.

## ⑥ Cần tay Hoà — tôi bị chặn
Bốn tiến trình dev lạc còn sống, cùng ghi `.next`: `11452/11453` (`:3000`) · `18745/18746` (`:57104`).
`kill 11452 18745` — **bộ phân loại chặn, tôi không lách**. Không đụng `39030` (`:3777` của 1f).
📌 Bài học đo: `pgrep "next dev"` khớp **TÊN** tiến trình ⇒ trả rỗng ⇒ tôi báo nhầm "đã chết".
Phải dùng `pgrep -f "next dev"`. (Lỗi đo thứ 7 trong ngày; 1f bắt được.)

## ⑦ Cổng
tsc 0 · npm test exit 0 · light-clock 8/8 ĐẠT.
