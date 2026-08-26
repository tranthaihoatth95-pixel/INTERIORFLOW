# 01 · GOLDEN JOURNEY — asset dùng nhiều Project (N-N) — PASS trọn, browser + DB thật

> 20/08. Chuỗi Hoà chốt: Q5(schema) → … → **ProjectAssetUsage** → downstream. Đây là lần đầu
> nguyên tắc "một asset dùng cho NHIỀU project, không nhét projectId vào LibraryAsset" được
> **chứng minh chạy thật**, không phải suy từ test.

## Điều kiện chạy
Server 3001 restart lúc 00:5x (client Prisma cũ trong module cache là root cause FIX-500 — xem
`docs/bao-cao-phien/2026-08-20-FIX500-project-asset-usage.md`). Session thật, cookie thật.

## Từng checkpoint — bằng chứng đo được

| # | Bước | Kết quả thật |
|---|---|---|
| 1 | Project A ("Dự án mới") gắn asset X, usage `ref-render` | POST 200, relation `cmt0e7p8f0001w9rbg7as7utv` tạo thật trong DB |
| 2 | where-used sau bước 1 | 200, thấy A |
| 3 | Project B ("Nháp") dùng **CÙNG** asset X, usage `material` | POST 200, relation `cmt0e7wln0003w9rb6uunzjgg` |
| 4 | where-used sau bước 3 | **2 relation**: `["Nháp:material", "Dự án mới:ref-render"]` — usage KHÁC NHAU trên cùng asset, đúng nguyên tắc N-N |
| 5 | **KHÔNG nhân bản asset** | `libraryAsset.count({id: X}) = 1` · tổng LibraryAsset = 1613 (không tăng) |
| 6 | Reopen/persist | relation đọc lại từ DB thật (không phải state client): cả 2 `deletedAt: null` |
| 7 | Gỡ khỏi A | DELETE 200 → where-used còn `["Nháp:material"]` |
| 8 | Asset + relation B sống sau khi gỡ A | `assetAlive = 1` · A `deletedAt` có giá trị (soft-delete) · B `deletedAt: null` |

**Dọn sau thử**: 2 relation thử đã xoá, bảng `ProjectAssetUsage` về 0 hàng — không để rác.

## Ý nghĩa
Nguyên tắc ownership Hoà chốt đã sống thật:
- `LibraryAsset` KHÔNG mang `projectId` — vẫn là asset dùng chung.
- Quan hệ N-N qua `ProjectAssetUsage`, mỗi cặp (project, asset) mang usage RIÊNG.
- Gỡ khỏi 1 project chỉ xoá **relation**, không đụng asset và không đụng project khác.

## Còn thiếu (khai thật, không tô)
- Bước 1-8 chạy qua **API layer** (fetch từ browser có session thật), chưa bấm qua **nút UI**
  "Dùng cho dự án này" — nút đó cần asset là `LibraryAsset` DB thật trong kệ đang mở; lần thử
  trước nút không hiện với 2 item đã chọn (chưa rõ `dbAssetIdOf` trả null hay điều kiện khác).
  **Việc kế tiếp**: xác định đúng ca nút hiện, bấm thật, rồi mới coi UI-path là PASS.
- `workspaceId`/`canvasId` để `null` — đúng thiết kế TRANSITIONAL (chờ H9).
- Chưa test đồng thời 2 người cùng gắn (không có `rev` trên model này — đã khai từ đầu).

## HẠN DÙNG
Hết hạn khi UI-path được verify, hoặc khi H9 nâng workspaceId/canvasId thành FK thật.
