# 02 · REFERENCE UI GOLDEN JOURNEY — PASS qua CLICK UI thật (không gọi API thay nút)

> 20/08, server 3001 (đã restart, Prisma Client mới). Packet P0 Hoà đặt: biến contract backend
> đã PASS thành workflow NGƯỜI DÙNG thật.

## 0 · ROOT CAUSE của "gap" báo lần trước — LÀ KẾT LUẬN SAI CỦA MAIN, không phải bug

MAIN từng báo "nút Dùng cho dự án này không xuất hiện". **Sai.** Runtime evidence (React fiber
walk trên DOM thật):
- `item.id` = `db:cmt0e1ykl000hw9jaujzoem14` — **đúng tiền tố `db:`**, `dbAssetIdOf()` trả đúng id,
  KHÔNG rơi ID, KHÔNG cần sửa mapper.
- `currentProjectId` = đúng project đang mở.
- `.spact` chứa đủ 3 nút, nút thứ 3 là **"Dùng cho dự án này", `disabled: false`**.
- Lý do MAIN không thấy: nút nằm ở **y=1169px, ngoài viewport 900px** — screenshot cắt mất, và
  lần dò trước panel đang ở trạng thái 503 (server giữ Prisma Client cũ).

⇒ **Không có root cause nào phải fix ở phần identity/context/render condition.** Phân loại asset
(A: LibraryAsset DB thật `db:` · B: built-in `cad-kyhieu-*` · C/D: khác) vốn đã đúng từ đầu:
"Ghế bar Lincoln 327" hoá ra **là LibraryAsset DB thật**, không phải hardcoded như MAIN từng nghĩ.

## 1 · Golden Journey qua CLICK UI — từng checkpoint có bằng chứng

| # | Bước | Bằng chứng đo được |
|---|---|---|
| SOURCE | Project A ("Dự án mới") → Thư viện → kệ Ảnh & tài sản | 240 thẻ, id đều `db:*` |
| SELECT | click card "asset guard" | `.spact` mở, 3 nút, CTA enabled |
| ATTACH A | **click nút thật** | POST 200 · nút → **"Đã dùng ✓" disabled** · UI where-used cập nhật NGAY, không reload: "ĐANG DÙNG Ở DỰ ÁN \| Dự án mới" |
| WHERE-USED A | GET `?assetId=` | `["Dự án mới:ref-render"]` |
| ATTACH SAME X TO B | đổi sang Project B ("Nháp"), mở CÙNG card | nút hiện lại **"Dùng cho dự án này"** (trạng thái theo từng project, không lẫn) → click → 200 |
| WHERE-USED A+B | GET `?assetId=` | `["Nháp:ref-render", "Dự án mới:ref-render"]` |
| KHÔNG DUPLICATE | Prisma count | asset `=1` · tổng LibraryAsset giữ **1613** (không tăng) · 2 relation trỏ chung 1 asset |
| REOPEN | reload trang → mở lại card | where-used UI persist đúng: "Nháp \| Dự án mới" |
| BẤM LẠI khi đã gắn | click CTA lần hai | 409 xử đúng — vẫn **2 relation** (không nhân bản), nút → "Đã dùng ✓" |
| REMOVE A | soft-delete relation A | asset sống (`=1`) · A `deletedAt` có · **B `deletedAt: null` nguyên vẹn** |

**Dọn sau thử**: 2 relation thử đã xoá, bảng `ProjectAssetUsage` về **0 hàng**, asset vẫn còn.

## 2 · BUG UX THẬT phát hiện được nhờ bước REOPEN (đang sửa — phiếu PREFETCH-ATTACH)

Sau reload, nút hiện lại "Dùng cho dự án này" (enabled) **dù DB đã có relation** — vì
`attachedUsage` là state cục bộ, không pre-fetch lúc mở panel. Không sai dữ liệu (409 chặn đúng)
nhưng **UI nói sai trạng thái** cho tới khi người dùng bấm thử. `AssetWhereUsed` đã fetch sẵn
danh sách usages — chỉ cần dùng lại 1 request đó cho cả hai chỗ (không thêm API/state mới).

## 3 · Kết luận trạng thái

**Reference N-N = LIVE end-to-end** (không còn chỉ "API verified"): người dùng bấm nút thật →
relation thật → nhiều project dùng chung một asset, usage riêng, gỡ một bên không ảnh hưởng bên
kia và không giết asset.

## ⑦b CHƯA CHẮC
- Chưa test 2 người dùng đồng thời (model không có `rev` — đã khai từ đầu, ngoài phạm vi).
- `usage` cố định `ref-render` từ UI (chưa có picker) — API hỗ trợ usage khác, đã verify bằng API
  (`material` ở GJ trước), chỉ UI chưa lộ.
- Chưa có nút REMOVE trên UI (remove verify qua Prisma) — CTA gỡ là việc kế tiếp nếu Hoà cần.

## HẠN DÙNG
Hết hạn khi PREFETCH-ATTACH đóng, hoặc khi thêm usage-picker / nút remove lên UI.
