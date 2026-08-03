# ATLAS — 4 BƯỚC BẤM LARK (Hoà làm, không cần terminal)

Hoà chốt ĐƯỜNG A (03/08): chuyển ATLAS sang **Base thường ngoài Wiki**.
Lý do: lỗi `131006` sinh ra ở bước wiki `get_node`. Base ngoài wiki bỏ hẳn bước đó
⇒ 9 bước của NC-6 rút còn 4. Code đã sẵn sàng: `lark.ts:55` nhận `LARK_ATLAS_APP_TOKEN`
thẳng, có token này thì KHÔNG gọi `get_node` nữa.

---

## ☐ BƯỚC 1 · Nhân bản base ra ngoài wiki
Mở "ATLAS Material Library" → `⋯` (More) → **Duplicate** / **Save as**
→ khi hỏi lưu ở đâu, chọn **My Space** hoặc folder thường (KHÔNG để trong Wiki).

⚠️ Nếu Lark CHỈ cho Export CSV, không cho Duplicate → **DỪNG**.
CSV mất sạch ảnh (attachment không qua được CSV). Thay bằng: tạo base trống rồi
copy-paste từng bảng ngay trong Lark (chọn hết ô → Ctrl+C → dán) — cách này giữ ảnh.

Xong: mở base MỚI, chép `app_token` từ URL — đoạn sau `/base/`, dạng `bascn...`
Đếm luôn: đủ ~1449 dòng chưa · cột ảnh có hiện không.

## ☐ BƯỚC 2 · Share base mới cho app
Trong base MỚI → **Share** (hoặc `⋯` → Collaborators) → **Add** → gõ tên app/bot của IF.
Quyền **Can view** là đủ. KHÔNG cấp quyền sửa — sync là pull-only.

## ☐ BƯỚC 3 · Cấp scope
open.larksuite.com → Developer Console → app của IF
→ **Permissions & Scopes** → tìm `bitable` → tick quyền ĐỌC Base
(`bitable:app:readonly`; nếu console tách quyền record thì tick cả quyền xem record).
Nếu hiện mục **Data permission** → cấu hình + Submit.

## ☐ BƯỚC 4 · Publish version ⚠️ BƯỚC HAY QUÊN NHẤT
**Version Management & Release** → **Create version** → điền số version + mô tả
"thêm quyền bitable đọc ATLAS" → **Submit for release**.
Tenant bắt duyệt thì sang admin.larksuite.com tự duyệt (Hoà là admin TTT).

**Tick scope mà KHÔNG publish = scope CHƯA CÓ HIỆU LỰC.** Rất nhiều người kẹt ở đây
mà tưởng đã cấp quyền rồi. Kiểm lại: version ONLINE phải là version MỚI và có chứa quyền vừa tick.

---

## ☐ BƯỚC 5 · Sửa `.env.local` (Hoà, 10 giây)
```
LARK_ATLAS_APP_TOKEN=bascn...        ← token base MỚI
# LARK_ATLAS_NODE_TOKEN=...          ← comment lại, không dùng nữa
```

## ☐ BƯỚC 6 · Dán cho phiên code
```
Hoà đã chuyển ATLAS sang Base thường ngoài wiki (bỏ đường get_node) và cắm
LARK_ATLAS_APP_TOKEN mới vào .env.local.

VIỆC 1: chạy sync (app/api/atlas-materials/sync/route.ts). Báo cáo SỐ THẬT:
  bao nhiêu bản ghi vào DB · bao nhiêu món đủ giá+đơn vị+ảnh · thiếu trường nào, đếm từng trường.
VIỆC 2: kiểm kỹ ẢNH có về không — chỗ dễ mất nhất khi chuyển base.
VIỆC 3: sửa comment đầu route (đang ghi "CHƯA CHẠY THẬT LẦN NÀO") + ghi 3 lớp quyền Lark
  vào comment đầu lib/integrations/providers/lark.ts (NC-6 §3 mục 1 dặn, chưa ai làm).

Ra 99991672 → scope chưa ăn, xem NC-6 A4-A6. KHÔNG đổi sang user_access_token (NC-6 §2 đã bác).
```

---
⛔ **ĐỪNG XOÁ base cũ trong wiki** cho tới khi sync mới chạy đúng và đếm đủ 1449 món CÓ ẢNH.
Giữ thêm vài ngày.
