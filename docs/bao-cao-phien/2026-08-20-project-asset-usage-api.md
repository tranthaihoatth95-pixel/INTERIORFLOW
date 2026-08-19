# ProjectAssetUsage API — 20/08

Phiếu: bước đầu chuỗi Reference/Asset (Q5→Understand→Promote→LibraryAsset→**ProjectAssetUsage(đây)**→H9→downstream). H6 (DB push) đã xong trước phiên này — model đã tồn tại trong `dev.db`, Prisma Client generate khớp.

## ① Việc đã làm
- `app/api/project-asset-usage/route.ts` — POST (tạo/hồi-sinh usage) + GET (`?projectId=` list · `?assetId=` where-used, lọc theo project user còn là member).
- `app/api/project-asset-usage/[id]/route.ts` — DELETE (soft-delete, không xoá `LibraryAsset` liên quan).
- `app/api/project-asset-usage/route.test.ts` — 10 assertion, integration test trên `dev.db` thật, tự dọn.

## ② Vì sao làm vậy
- Khuôn hoàn toàn theo `app/api/projects/[id]/members/route.ts` (POST xử lý "hồi sinh hàng đã xoá mềm" — đúng chỉ dẫn phiếu và đúng comment tại `schema.prisma:719-724`).
- `ProjectAssetUsage` không có field `rev` → **không** áp `lib/server/rev-guard.ts` (đã tự đo tại ⓪ tiền đề, xác nhận đúng như phiếu cảnh báo).
- GET `?assetId=` (where-used) không dùng `assertProjectAccess` per-project (asset có thể nằm ở nhiều project) — thay vào đó lọc kết quả theo tập `projectId` mà user hiện là `ProjectMember` còn sống, để không rò rỉ project của người khác.
- Quyền tối thiểu cho POST/DELETE: `viewer` — gắn/gỡ một tham chiếu asset không phải là sửa nội dung một chặng cụ thể (`canEditStage` không áp dụng ở đây), nên không siết theo `STAGE_OWNER`.

## ③ Bằng chứng đo được
- ⓪ tiền đề: `grep "^model ProjectAssetUsage"` ra đúng block (686 field + comment TRANSITIONAL + comment usage-vocabulary + `@@unique([projectId,assetId,usage])`).
- `node -e "...projectAssetUsage.findMany()..."` → `OK 0` trước khi code, xác nhận DB/client đồng bộ.
- `npm run tsc` → 0 lỗi (chạy 2 lần, trước và sau khi thêm test).
- `node_modules/.bin/sucrase-node app/api/project-asset-usage/route.test.ts` → **10/10 PASS**, gồm đúng ca rủi ro nhất phiếu yêu cầu: POST → DELETE → POST lại CÙNG `(projectId, assetId, usage)` → thành công, không 409, không lỗi unique constraint, và vẫn đúng 1 hàng vật lý (không phình bảng).
- Đếm hàng `projectAssetUsage` trước/sau test: **0 → 0** (dev.db sạch, không rác để lại).

## ④ Rủi ro / giới hạn đã biết
- **BROWSER-PENDING** — route chưa gọi qua HTTP thật (cần cookie session, giống giới hạn đã ghi ở `draft-project.test.ts`/`flows/[id]/route.test.ts`). Test mô phỏng đúng logic lõi bằng Prisma trực tiếp, không mock.
- GET `?assetId=` lọc "hậu kỳ" bằng JS (`Array.filter`) sau khi query — chấp nhận được ở quy mô hiện tại (whereUsed thường ít hàng), chưa tối ưu bằng SQL `IN` hai chiều nếu số lượng lớn.
- Không có UI gọi route này — đây chỉ là lớp API.

## ⑤ Việc còn treo cho phiếu sau
- Nối route này vào UI/thao tác thật (ví dụ nút "gắn vào dự án" trong Thư viện) — nằm ngoài scope phiếu này.
- H9 (bước kế trong chuỗi) — chưa động tới.

## ⑥ Scope tuân thủ
- KHÔNG đụng `prisma/schema.prisma`, `app/api/library/**`, `app/api/projects/[id]/members/route.ts` (chỉ đọc làm mẫu).
- KHÔNG chạy git add/commit/push/stash/checkout/reset.

## ⑦b Chưa chắc / chưa kiểm
- Chưa kiểm hành vi khi `workspaceId`/`canvasId` là chuỗi rác tuỳ ý (theo đúng thiết kế TRANSITIONAL — không validate FK, nhưng chưa có test riêng cho trường hợp này).
- Chưa kiểm race condition thật (hai POST đồng thời cùng bộ ba khoá) — Prisma sẽ tự báo lỗi unique ở tầng DB nếu xảy ra, nhưng route hiện chưa bắt riêng lỗi đó thành response có cấu trúc (sẽ rơi vào catch chung → 500 nếu race thật xảy ra). Rủi ro thấp cho single-user local-first nhưng chưa đo.

## ⑦c Hạn dùng kết luận
Kết luận "0 lỗi tsc, 10/10 test pass, dev.db sạch" đúng tại thời điểm chạy (20/08, commit nền `c7f3ac8`). Nếu schema `ProjectAssetUsage` đổi sau này (ví dụ thêm `rev`), phần "không áp rev-guard" phải đo lại.
