# Wave 14 (Lane B) — CHUỖI SITE CHẠY THẬT: SEE → UNDERSTAND → TRACE → ACT → RESOLVE

## 1 · Tổng quan
Chuỗi này **đứt ở hai chỗ**, cả hai đều làm Vitals câm vĩnh viễn mà tsc/test/5 máy soi đều mù.
Đã nối và chứng minh trên app bằng SỐ ĐỔI THẬT, không phải bằng "nút bấm được".

## 2 · Hai chỗ đứt (đo được)
| # | Đứt ở đâu | Hệ quả |
|---|---|---|
| ① | `lib/site/suy-luan.ts` có TRỌN máy suy nhưng `grep` ngoài `lib/site/` = **0 nơi gọi**; PATCH chỉ ghi toạ độ/hướng | `suThat` rỗng vĩnh viễn ⇒ `caiGiCu()` không có gì đánh dấu ⇒ `daCu` luôn rỗng ⇒ **Vitals không bao giờ báo** |
| ② | `tinhLai()` **chỉ xoá dấu cũ**, không tính lại gì | Nút "Tính lại" = **nút tắt cảnh báo**. Trạng thái nói "đã tươi" mà 0 phép tính chạy — cùng họ với bịa phần trăm |

Vì sao mọi cổng mù: hai hàm đều **có thật**, tsc xanh, test cũ xanh. Đây là **hai đầu dây không nối**,
chỉ lộ khi chạy thật — cùng họ ca kéo-thả `.idfc` sáng nay.

## 3 · Cách nối, và ranh giới với §32
`lib/site/dan-xuat.ts` (mới) tách **hai đường bằng hai hàm**, không bằng một cờ:
- `suyLanDau()` — CHỈ điền chỗ trống. Đã có sự thật thì **không đụng** ⇒ đổi hướng lần sau chỉ
  ĐÁNH DẤU CŨ, máy không tự tính. Giữ đúng §32 *"không tự tính lại — người quyết"*.
- `tinhLaiThat()` — người bấm mới chạy: **TÍNH TRƯỚC, GỠ DẤU SAU** (gỡ trước mà tính hỏng thì mất
  cảnh báo trong khi sự thật vẫn cũ); chỉ gỡ dấu **đúng miền được yêu cầu**; đề xuất/quyết định của
  người giữ nguyên.

## 4 · Bằng chứng app thật — từng mắt xích một số đo
| Mắt xích | Đo được |
|---|---|
| **Site truth** | PATCH toạ độ TP.HCM + mặt đứng ⇒ **7 sự thật dẫn xuất** sinh ra (trước: 0) |
| **derived stale** | Đổi hướng 210→60 ⇒ `daCu` = **3 mục miền nắng** |
| **SEE · Vitals Edge** | `data-vitals-state` = **`attention`** |
| **PEEK** | dòng tín hiệu *"Phân tích nắng"* |
| **UNDERSTAND · Detail** | đủ **CÁI GÌ · VÌ SAO · NGUỒN · ẢNH HƯỞNG** + 2 nút |
| **TRACE · deep-link** | tới `/projects/<id>/overview#ngu-canh-dia-diem`, khối **tồn tại và thấy được** |
| **ACT · Tính lại** | giá trị **64.875 → 140.742** — TÍNH THẬT |
| **RESOLVE** | `daCu` → **[]**, khẩu độ về **`calm`** |

⭐ Mắt xích quan trọng nhất: **trước khi bấm Tính lại, giá trị GIỮ NGUYÊN 64.875** dù hướng đã đổi.
Đó là bằng chứng máy KHÔNG tự tính lén — nếu nó tự tính thì §32 đã bị phá và người dùng mất quyền
quyết mà không biết.

## 5 · Máy suy có thật sự suy không
`ketLuan = 0` ở hướng 210° từng làm tôi nghi luật hỏng. Kiểm bằng dải hướng:
| mặt đứng | góc tới | kết luận |
|---|---|---|
| 240° | 51,0° | 0 — im |
| 255° | 36,0° | 1 — *Mặt đứng chính hứng nắng chiều gần trực diện* |
| 285° | 6,0° | 1 |
⇒ **im lặng trung thực**, không phải luật chết: góc vượt ngưỡng thì không có gì để kết luận.
Trạng thái để lại cho Hoà xem: mặt đứng **285°**, góc tới **5,7°**, **1 kết luận thật**, `daCu` = 0.

## 6 · Máy canh
`lib/site/dan-xuat.test.ts` — 6 nhóm, khoá cả hai cách hỏng: *sinh ra sự thật thật* · *không toạ độ
thì im* · *§32 không đè* · *tính lại phải ĐỔI GIÁ TRỊ* · *chỉ gỡ đúng miền* · *bấm nhầm không đổi gì*.

## 7 · Đánh giá khách quan
- ✅ Chuỗi đủ 5 nấc, mỗi nấc một số đo, không nấc nào suy từ nấc khác.
- ⚠️ **Tôi đo sai một lần**: dò `.gia` thay vì `.giaTri` nên tưởng sự thật rỗng và suýt báo lỗi oan
  cho sản phẩm. Đọc đúng trường thì giá trị có thật. Ghi lại: *đếm sai đơn vị thì số nào cũng vô nghĩa*
  — lỗi thứ hai cùng loại trong ngày (trước đó là đếm `<img>` ở Gallery).
- ⚠️ Chỉ chứng minh miền **nắng**. `khi-hau`/`gio`/`dia-ly` chưa có nguồn dữ liệu ⇒ chưa chạy.
- ⚠️ Deep-link mới chứng minh **tới đúng khối**; chưa đối chiếu nội dung khối với hồ sơ từng trường.

## 8 · Cổng
tsc 0 · npm test exit 0 · soi:frontier exit 0 · dan-xuat 6/6.
