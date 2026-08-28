# W5 — rev optimistic-concurrency cho ProjectMember + LibraryAsset (19/08)

## ① Tiền đề đã xác nhận
- `Project.rev` không có route nào update → chết, ngoài phạm vi phiếu (đúng như phiếu ghi).
- `ProjectMember.rev` tăng ở 3 chỗ (POST/PATCH/DELETE, `app/api/projects/[id]/members/route.ts`).
- `LibraryAsset.rev` tăng ở 1 chỗ (DELETE, `app/api/library/[id]/route.ts`).
- Helper H11 (`RevConflictError`/`revWhere`/`updateFlowWithRevCheck`/`REV_CONFLICT_RESPONSE`) đã
  tồn tại nhưng local + hard-code `prisma.flow` trong `app/api/flows/[id]/route.ts`.

## ② Việc đã làm
1. **Trích xuất** 4 hàm helper thành `lib/server/rev-guard.ts` — generic hoá bằng cách nhận vào
   `updateFn(where) => Promise<T>` (closure gọi `prisma.<model>.update({where, data})`), không
   hard-code delegate Prisma nào. `revWhere` giữ nguyên logic gốc (`{id}` nếu không có
   `expectedRev`, `{id, rev}` nếu có — "extended whereUnique").
2. **Refactor `app/api/flows/[id]/route.ts`** để IMPORT từ `rev-guard.ts` thay vì giữ bản local —
   `updateFlowWithRevCheck` nay chỉ là 1 wrapper mỏng gọi `updateWithRevCheck`. Không còn
   `class RevConflictError` cục bộ trong file này (verify bằng test cấu trúc mới).
3. **`app/api/projects/[id]/members/route.ts`** — cả 3 route (POST mời/hồi-sinh, PATCH đổi vai,
   DELETE gỡ mềm) nhận thêm `expectedRev?: number` (POST/PATCH: body; DELETE: query
   `?expectedRev=`), khoá theo `ProjectMember.id` (PK riêng của hàng — rev-guard chỉ biết
   `id`+`rev`, không biết composite `projectId_userId`). Không gửi `expectedRev` → hành vi y hệt
   cũ (backward-compatible).
4. **`app/api/library/[id]/route.ts` DELETE** — nhận `?expectedRev=` trên query, cùng cơ chế.
5. Test mới `lib/server/rev-guard.test.ts` (khuôn `app/api/flows/[id]/route.test.ts`): tầng ①
   integration Prisma thật cho CẢ HAI model (ProjectMember + LibraryAsset) — rev khớp/lệch/không
   gửi; tầng ② cấu trúc kiểm cả 3 route file import rev-guard dùng chung, không khai lại
   `RevConflictError` cục bộ, đếm đủ số nhánh trả 409.
6. `app/api/flows/[id]/route.test.ts` — 2 assertion cấu trúc (② tầng) đổi từ "route.ts khai
   `class RevConflictError`" sang "route.ts import từ rev-guard.ts, và rev-guard.ts khai class +
   bắt P2025" — phản ánh đúng cấu trúc mới sau refactor. Đây là thay đổi CHỦ Ý (chính refactor
   này đổi cấu trúc), KHÔNG phải nới lỏng test.

## ③ Phạm vi KHÔNG đụng
- `prisma/schema.prisma` — không sửa, `rev` đã có sẵn cả 2 model.
- UI/component client wiring gửi `expectedRev` — CHƯA làm (giống H11 để lại `snapshotFlow`/
  `toggleShare` client chưa wire). Server-side xong, client-side để ngỏ có chủ ý.
- Git: không add/commit/push/stash/checkout/reset.

## ④ Nghiệm thu đã chạy
- `npm run tsc` — **pass, 0 lỗi** (2 lần, trước và sau khi thêm test).
- `node_modules/.bin/sucrase-node lib/server/rev-guard.test.ts` — **11/11 PASS** (Prisma thật,
  tự tạo + dọn user/project/member/asset tạm trong `finally`).
- `node_modules/.bin/sucrase-node "app/api/flows/[id]/route.test.ts"` (test CŨ, chỉnh 2 assertion
  cấu trúc theo cấu trúc mới) — **10/10 PASS**, xác nhận refactor KHÔNG phá hành vi Flow route.

## ⑤ Browser-pending (chưa chạy — server-side only theo scope phiếu)
Kịch bản 2-tab cần verify tay khi client wiring xong:
1. **ProjectMember**: mở 2 tab cùng đăng nhập owner, cùng vào `/projects/[id]` → tab A đổi vai
   thành viên X (PATCH), tab B (đang cầm `rev` cũ) cũng đổi vai/xoá thành viên X → tab B phải
   nhận 409 `REV_CONFLICT`, không âm thầm ghi đè.
2. **LibraryAsset**: mở 2 tab cùng xem 1 asset trong Thư viện, tab A xoá asset trước → tab B xoá
   lại (đang cầm rev cũ) → tab B phải nhận 409, không lỗi 500/không nhầm "ok".
3. Cả hai kịch bản cần client gửi `expectedRev` — hiện API sẵn sàng nhận, UI CHƯA gửi (xem ③).

## ⑥ Bàn giao / còn lại
- Wire `expectedRev` từ client cho ProjectMember (danh sách thành viên dự án) và LibraryAsset
  (Thư viện) — theo đúng khuôn `lib/store.ts persistNow` đã làm cho Flow.
- Khi wire xong, chạy lại kịch bản 2-tab ở ⑤ trên app thật.

## ⑦b Chưa chắc / chưa kiểm
- Chưa chạy app thật một dòng nào (phiếu không yêu cầu browser cho phần server-side này).
- `updateWithRevCheck` generic qua closure — chưa có ca dùng thứ 3 (ngoài Flow/ProjectMember/
  LibraryAsset) để chứng minh generic hoá đủ tổng quát cho các hình dạng `where` khác (vd model
  không có PK tên `id`). Hiện tại cả 3 model dùng đều có `id` là `@id`, nên chưa lộ giới hạn này.
- Không kiểm được liệu `expectedRev` gửi dạng string (vd từ query string bị parse sai) có lọt qua
  `Number.isFinite` check hay không trong mọi trình duyệt — chỉ test logic thuần trong Node.

## ⑦c Hạn dùng kết luận
Kết luận "refactor không phá hành vi Flow" dựa trên bộ test hiện có (10 case) — nếu sau này có
thêm nhánh PUT/logic mới trong `flows/[id]/route.ts` mà không thêm test tương ứng, hạn này không
tự động mở rộng.

## Trạng thái git
Không commit — theo đúng luật "KHÔNG git add/commit/push/stash/checkout/reset" của phiếu.
