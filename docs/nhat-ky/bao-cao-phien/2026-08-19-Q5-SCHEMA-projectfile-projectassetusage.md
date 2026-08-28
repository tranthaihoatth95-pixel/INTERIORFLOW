# Q5-SCHEMA — thêm `ProjectFile` + `ProjectAssetUsage` vào văn bản schema.prisma (19/08)

## 1. Tổng quan
Đã thêm 2 model Prisma mới (`ProjectFile`, `ProjectAssetUsage`) CHỈ vào văn bản
`prisma/schema.prisma`, theo đúng field Hoà đã chốt ở spec `16-project-asset-ownership-spec`.
KHÔNG chạy `db push`/`migrate`/`generate`, KHÔNG viết route/lib code nào gọi 2 model này.
`npm run tsc` vẫn pass 0 lỗi.

## 2. Chi tiết từng mục
| Mục | Kết quả |
|---|---|
| ⓪ tiền đề | `grep "^model ProjectFile\|ProjectAssetUsage"` trước phiếu = rỗng — đúng điều kiện, tiếp tục |
| ⓪b HEAD | `c7f3ac8`, main — khớp |
| `ProjectFile` | Thêm dòng 656-680 `prisma/schema.prisma`; field đúng phiếu + đủ bộ mutable-convention (`rev`/`deletedAt`/`lastEditedBy`/`lastEditedDevice`) theo mẫu `Project`/`ProjectMember`/`LibraryAsset` |
| `ProjectAssetUsage` | Dòng 685-728; field đúng phiếu; comment bắt buộc trên `workspaceId`/`canvasId` (transitional, không FK, chờ H9) và trên `usage` (khác câu hỏi với `LibraryAsset.usage`, REUSE `LIBRARY_USAGES`) |
| Relation ngược | `Project.files` + `Project.assetUsages` (dòng ~110-113); `LibraryAsset.usages` (dòng ~311-313) — chỉ APPEND, không sửa field khác |
| Re-verify unique/soft-delete | Xác nhận `ProjectAssetUsage.@@unique([projectId,assetId,usage])` có CÙNG vấn đề với `ProjectMember` (deletedAt ngoài unique) — ghi comment tại chỗ trong schema + chi tiết đầy đủ trong migration-plan §C |
| tsc | `npm run tsc` → 0 lỗi (chạy 2 lần, trước và sau khi viết xong) |
| grep code gọi client mới | `grep -rn "prisma.projectFile\|prisma.projectAssetUsage" app lib components` → **0 kết quả** |
| Doc migration-plan | `docs/memory/sessions/2026-08-19/18-q5-schema-migration-plan/README.md` — khuôn ⓪/backup/push/generate/verify/rollback theo mẫu `docs/bao-cao-phien/2026-08-19-wave0-runbook-db.md` |
| Git | Không add/commit/push — chỉ để lại working-tree change |

## 3. Tổng kết lại vấn đề
Bước ĐẦU của chuỗi Q5 → Understand/Review → Promote → LibraryAsset → ProjectAssetUsage → H9 đã
xong ở đúng phạm vi được giao: schema có hình dạng đúng theo negative-evidence đã chốt (không
REUSE được `ProjectMember`/`ExternalRef`/`Task.stage` cho quan hệ N-N Project↔LibraryAsset kèm
usage-theo-quan-hệ), nhưng CHƯA đấu nối gì xuống DB hay code — đúng ranh giới "schema-only" của
phiếu. Việc kế tiếp (push/generate/route) đã được liệt kê rõ trong migration-plan, không rơi.

## 4. Đánh giá khách quan
- Tốt: ràng buộc cứng nhất (không generate, không viết route) được tuân thủ nghiêm — đã grep
  xác nhận 2 lần (trước khi viết doc, sau khi viết doc) để chắc không có code rò ra.
- Tốt: tận dụng đúng bài học từ `ProjectMember` (soft-delete ngoài unique) thay vì lặp lại lỗi
  đó ở model mới — ghi rõ cả trong schema comment lẫn migration-plan.
- Chưa làm được: `npx prisma format --check` không chạy (không muốn động tới prisma CLI theo
  bất kỳ hình thức nào trong phiếu schema-only, kể cả lệnh chỉ format/lint) — thay vào đó đọc
  lại bằng mắt 2 lần, đối chiếu ngoặc/kiểu/quan hệ 2 chiều với các model hiện có. Rủi ro: một
  lỗi cú pháp Prisma tinh vi (ví dụ thiếu `@relation` chiều ngược) có thể không bị tsc bắt vì
  tsc không parse `.prisma`; chỉ `prisma validate`/`generate` mới bắt được — cả hai đều bị cấm ở
  phiếu này.
- Rủi ro nhỏ: `workspaceId`/`canvasId` là string tự do không FK — nếu route sau này gán sai giá
  trị (id không tồn tại ở đâu cả) sẽ không có ràng buộc DB nào chặn; đây là đánh đổi cố ý theo
  đúng chỉ đạo Hoà (transitional, chờ H9), không phải sơ sót.

## 5. Hướng xử lý nhiều góc độ
- **Hướng A (đã chọn ở phiếu này)**: dừng đúng biên schema-only, để Hoà tự chạy migration-plan
  khi rảnh tay + không phiên nào khác đang mở dev server. An toàn tuyệt đối cho các phiên song
  song, nhưng chuỗi Q5 vẫn "treo" — code Understand/Review/Promote chưa viết được cho tới khi
  push xong.
- **Hướng B (không chọn)**: tự chạy `db push`+`generate` ngay trong phiếu này rồi viết luôn
  route Promote. Nhanh hơn về tổng thời gian, nhưng VI PHẠM ràng buộc cứng nhất của phiếu và
  rủi ro sự cố 19/08 sáng lặp lại nếu có phiên khác đang mở — không chọn.

## 6. Đề xuất hướng tốt nhất
Giữ Hướng A. Khi Hoà sẵn sàng chạy migration-plan (`18-q5-schema-migration-plan/README.md`),
nên gộp chung một đợt với bất kỳ thay đổi schema nào khác đang chờ (nếu có) để giảm số lần
`generate` làm gián đoạn các phiên song song — nhưng đó là quyết định vận hành của Hoà, không
phải kỹ thuật.

## ⑦b Chưa chắc / chưa kiểm
- Chưa chạy `prisma validate`/`format` dưới bất kỳ hình thức nào (bị cấm bởi chính phiếu này) —
  chỉ đọc bằng mắt. Nếu có lỗi cú pháp `.prisma` tinh vi, nó sẽ lộ ra ở lần `generate` đầu tiên
  Hoà chạy, không phải bây giờ.
- Chưa xác nhận SQLite sẽ đặt tên index/constraint gì cho `@@unique` 3 cột — chỉ suy từ hành vi
  đã biết với `ProjectMember` 2 cột.
- Chưa kiểm `.env` / `DATABASE_URL` thật (đúng luật phiếu, không đọc secret).

## ⑦c Hạn dùng kết luận
Đúng tại HEAD `c7f3ac8`, 19/08. Nếu có phiên khác sửa `prisma/schema.prisma` sau thời điểm này
(nhiều phiên song song đang mở theo ghi nhận 17/08 "SendMessage giữa các phiên"), phải đo lại
`grep "^model ProjectFile\|ProjectAssetUsage"` trước khi tin file này mô tả đúng hiện trạng.
