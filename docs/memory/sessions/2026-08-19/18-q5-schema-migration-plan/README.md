# 18 · Q5-SCHEMA — migration plan cho `ProjectFile` + `ProjectAssetUsage`

> Phiếu soạn **SCHEMA-ONLY** — KHÔNG chạy `db push`/`migrate`/`generate`. Mọi lệnh dưới đây
> là để Hoà chạy sau, khi các phiên/dev-server khác nghỉ (đúng luật `CLAUDE.md` "An toàn dữ
> liệu": generate khi DB chưa push làm chết Prisma Client chung — sự cố thật 19/08 sáng).
> Mốc soạn: HEAD `c7f3ac8`. Số đo trong file này đo TẠI NGUỒN lúc soạn — chạy lại bước ⓪
> trước khi tin, đúng khuôn `docs/bao-cao-phien/2026-08-19-wave0-runbook-db.md`.

## ⓪ HIỆN TRẠNG ĐÃ ĐO (19/08, phiếu Q5-SCHEMA)

```bash
grep -n "^model ProjectFile\|^model ProjectAssetUsage" prisma/schema.prisma
# Trước phiếu này: RỖNG. Sau phiếu này: 2 dòng (model mới ở cuối file, sau ExternalRef).
```

Hai model mới **CHỈ tồn tại trong văn bản `prisma/schema.prisma`** — chưa push nên:
- `prisma/dev.db` **KHÔNG có** 2 bảng `ProjectFile` / `ProjectAssetUsage`.
- Prisma Client hiện tại (sinh lần gần nhất, trước phiếu này) **không biết** 2 model này —
  `prisma.projectFile.*` / `prisma.projectAssetUsage.*` sẽ lỗi TypeScript nếu ai gọi (đã grep
  xác nhận 0 chỗ gọi trong repo tại thời điểm soạn — xem báo cáo phiên).
- `npm run tsc` **vẫn pass 0 lỗi** — đúng dự kiến, vì thêm text schema không phát sinh type mới
  cho tới khi `generate` chạy.

## A · Negative evidence — tóm tắt từ spec `16-project-asset-ownership-spec`

(Trích đủ để đứng độc lập, không copy nguyên văn — xem file gốc để đọc đầy đủ bảng đối chiếu.)

- **`ProjectMember`** là join-table N-N thật duy nhất trong schema hiện có (2 FK + `@@unique`
  composite) — dùng làm KHUÔN HÌNH DẠNG cho `ProjectAssetUsage`, không REUSE được trực tiếp vì
  nối 2 model khác nhau (Project↔User vs Project↔LibraryAsset).
- **`ExternalRef`** là mirror 1-1 ra hệ ngoài (`@@unique([system, externalId])`) — sai mục đích
  nếu ép dùng cho N-N nội bộ Project↔Asset.
- **`Task.stage/workspaceId/entityId`** (TaskContext Link) là pattern 3-cột-string-optional
  KHÔNG FK — đây là nguồn REUSE cho `workspaceId`/`canvasId` transitional trên
  `ProjectAssetUsage` (không phải một type `ContextPointer` có sẵn để import — grep xác nhận
  type đó không tồn tại, chỉ có pattern field).
- **`ProductSpec.imageAssetId`** là FK mềm 1 chiều 1-1, không giúp N-N.
- Kết luận (Hoà đã chốt ở spec `16-...`): **cần model MỚI**, không REUSE/EXTEND primitive nào có
  sẵn cho quan hệ N-N Project↔LibraryAsset kèm usage theo-từng-quan-hệ.
- **`ProjectFile`** đến từ quyết định Q5 (`docs/ADR-Q0-ARCHITECTURE-DECISIONS-2026-08-19.md`):
  *"Files = raw/project inputs. Master Library = understood reusable content"*, pipeline
  `FILES → UNDERSTAND → NORMALIZE → PROMOTE → MASTER LIBRARY`. Chưa có model nào trong schema
  hiện tại đóng vai "raw file thuộc đúng 1 project trước khi promote" — `LibraryAsset` đã là
  bản ĐÃ hiểu (post-promote), không đóng vai này được.

## B · Các bước Hoà sẽ chạy (KHÔNG chạy trong phiếu này)

### Điều kiện trước khi chạy — giống hệt runbook Wave 0

Máy dùng chung `node_modules` giữa nhiều phiên Claude Code + dev server (3001/3002/3004).
`npx prisma generate` ghi đè Prisma Client chung cho MỌI phiên đang mở. Kiểm trước:

```bash
lsof -iTCP -sTCP:LISTEN | grep node
# Mong đợi khi an toàn để push: không dev server IF nào đang listen, không phiên agent khác
# đang chạy lệnh prisma song song.
```

### Bước 1 — BACKUP (bắt buộc, `.backup` KHÔNG `cp`)

```bash
cd /Users/tranben/Downloads/interiorflow/prisma && sqlite3 dev.db ".backup 'dev.db.bak-2026-08-19-q5schema'"
sqlite3 prisma/dev.db.bak-2026-08-19-q5schema "PRAGMA integrity_check;"
# Mong đợi: ok
```

Verify số dòng KHÔNG đổi sau backup (so sánh với chính dev.db):

```bash
sqlite3 prisma/dev.db "SELECT count(*) FROM Project;" && \
sqlite3 prisma/dev.db.bak-2026-08-19-q5schema "SELECT count(*) FROM Project;"
# Mong đợi: hai số giống hệt.
```

### Bước 2 — DB PUSH

```bash
cd /Users/tranben/Downloads/interiorflow && npx prisma db push
# Mong đợi: "Your database is now in sync with your Prisma schema." — tạo MỚI 2 bảng
# ProjectFile + ProjectAssetUsage (bảng rỗng, 0 dữ liệu tham chiếu — non-destructive tuyệt đối,
# không đổi cột nào trên bảng đã có).
# Nếu nó cảnh báo mất dữ liệu / đòi reset → DỪNG NGAY, đừng gõ y — nghĩa là drift đã khác lúc
# soạn plan này (kiểm lại bước ⓪ trước).
```

Vì sao `db push` chứ không `migrate dev`: đúng lý do đã ghi trong runbook Wave 0 — repo dùng
lối lai (`prisma/migrations/` có baseline "catchup" từ `db push`), `migrate dev` sẽ phát hiện
drift với sổ migration và đề nghị RESET database (mất dữ liệu thật). `db push` là đúng cho DB
này.

### Bước 3 — GENERATE (CHỈ sau khi Bước 2 báo thành công)

```bash
cd /Users/tranben/Downloads/interiorflow && npx prisma generate
# Mong đợi: "Generated Prisma Client". Từ lúc này prisma.projectFile.* và
# prisma.projectAssetUsage.* mới tồn tại trong Prisma Client — CODE GỌI 2 MODEL NÀY CHỈ ĐƯỢC
# VIẾT SAU BƯỚC NÀY, không phải trước (đúng ràng buộc cứng của phiếu Q5-SCHEMA).
```

### Bước 4 — VERIFY

```bash
sqlite3 prisma/dev.db "PRAGMA table_info(ProjectFile);"
sqlite3 prisma/dev.db "PRAGMA table_info(ProjectAssetUsage);"
# Mong đợi: đủ cột đúng như khối model trong prisma/schema.prisma (đối chiếu bằng mắt).
```

```bash
cd /Users/tranben/Downloads/interiorflow && npm test
# Mong đợi: tsc 0 lỗi · 0 test fail (2 bảng mới không có test nào đụng tới ở bước này —
# test cho code GỌI 2 model này thuộc phiếu SAU, không phải phiếu này).
```

### Bước 5 — VIỆC CODE tiếp theo (KHÔNG làm ở phiếu này, giao phiếu sau)

Liệt kê để không rơi:

1. Route ghi/đọc `ProjectFile` (upload raw file thuộc project) — CHỈ viết sau khi Bước 3 xong.
2. Route "Promote" `ProjectFile → LibraryAsset` (đúng pipeline Q5) — sinh kèm 1 dòng
   `ProjectAssetUsage` đầu tiên (`usage` khởi điểm theo ngữ cảnh promote).
3. Route "attach existing LibraryAsset vào project" (N-N, không qua ProjectFile — ca asset từ
   Unsplash/Openverse đã tồn tại sẵn ở cấp kho) — ghi `ProjectAssetUsage` trực tiếp.
4. Chỗ gọi PHẢI "hồi sinh" hàng `ProjectAssetUsage` cũ (`deletedAt: null`) thay vì `create` mới
   khi gỡ-rồi-gắn-lại CÙNG `(projectId, assetId, usage)` — xem mục C bên dưới, cùng khuôn xử lý
   đã áp cho `ProjectMember` (`app/api/projects/[id]/members/route.ts` POST).
5. Sau khi H9 (Workspace/Canvas) chốt: audit lại `workspaceId`/`canvasId` trên
   `ProjectAssetUsage` — cân nhắc nâng cấp thành relation FK thật nếu Workspace/Canvas trở
   thành bảng. KHÔNG tự động nâng cấp lúc đó mà không đo lại.

## C · Vấn đề unique + soft-delete — re-verify theo yêu cầu Hoà

Đối chiếu `ProjectMember.@@unique([projectId, userId])` (`schema.prisma` quanh dòng 140,
comment tại chỗ): `deletedAt` KHÔNG nằm trong khối `@@unique`, nên gỡ thành viên rồi mời lại
CÙNG user sẽ đụng constraint vì hàng cũ (đã set `deletedAt`) vẫn tồn tại — nơi gọi (route POST)
đã biết phải "hồi sinh" hàng cũ thay vì tạo mới.

**`ProjectAssetUsage` có CÙNG vấn đề, xác nhận bằng cấu trúc giống hệt**:
`@@unique([projectId, assetId, usage])` không chứa `deletedAt` ⇒ gỡ một usage-relation rồi gắn
lại CÙNG `(projectId, assetId, usage)` sẽ đụng unique constraint vì hàng cũ (deletedAt đã set)
còn đó. Đã ghi comment tại chỗ trong `prisma/schema.prisma` ngay trên khối `@@unique` của model
này, chỉ rõ route sau này phải theo đúng khuôn "hồi sinh hàng cũ" như `ProjectMember`.

**Vì sao KHÔNG sửa bằng cách bỏ `deletedAt` khỏi thiết kế / đổi thành hard-delete**: soft-delete
là convention xuyên suốt repo (`docs/IF-CORE-SCHEMA.md` §1D/§2C — mọi model mutable đều
`deletedAt` để còn khôi phục được), đổi riêng model này là phá tính nhất quán. Đường xử lý đúng
nằm ở LỚP GỌI (route), không ở LỚP SCHEMA — giống cách `ProjectMember` đã giải.

## D · Rollback

**Muốn hoàn nguyên DB về trước Bước 2** (khi KHÔNG server nào mở):

```bash
cd /Users/tranben/Downloads/interiorflow/prisma && sqlite3 dev.db ".restore 'dev.db.bak-2026-08-19-q5schema'"
# Verify: PRAGMA integrity_check + so count(*) một vài bảng lớn (Project, LibraryAsset) với
# số trước khi restore.
```

**Cách gỡ 2 model an toàn (bảng mới, 0 dữ liệu tham chiếu tại thời điểm tạo)** — nếu Hoà đã push
nhưng muốn bỏ hẳn hướng này thay vì chỉ restore:

```bash
# An toàn vì KHÔNG model nào khác có FK trỏ VÀO ProjectFile/ProjectAssetUsage (chỉ chúng trỏ
# RA Project/LibraryAsset) — drop 2 bảng này không làm mồ côi dữ liệu ở bảng khác.
sqlite3 prisma/dev.db "DROP TABLE IF EXISTS ProjectAssetUsage;"
sqlite3 prisma/dev.db "DROP TABLE IF EXISTS ProjectFile;"
```

Sau đó gỡ khối 2 model + 2 relation-array (`Project.files`/`Project.assetUsages`,
`LibraryAsset.usages`) khỏi `prisma/schema.prisma`, rồi `npx prisma generate` lại để Client
đồng bộ với DB đã gỡ.

⚠️ **Nếu đã lỡ chạy code (route) dùng `prisma.projectFile.*`/`prisma.projectAssetUsage.*` trước
khi rollback**: xoá code đó TRƯỚC khi drop bảng, nếu không route sẽ lỗi runtime "table not
found" ngay lần gọi kế tiếp.

## CHƯA VERIFY ĐƯỢC (phiếu này bị cấm chạy mutation)

- Chưa chạy thử `db push`/`generate` ở bất kỳ dạng nào — kể cả dry-run (không có dry-run cho
  `db push` tạo bảng mới; lệnh này luôn ghi thật nếu chạy).
- `DATABASE_URL` trong `.env` không được đọc giá trị (luật phiếu) — plan GIẢ ĐỊNH nó trỏ
  `file:./dev.db` (tương đối thư mục `prisma/`), khớp với runbook Wave 0 cùng ngày.
- Chưa xác nhận bằng SQL thật rằng `@@unique([projectId, assetId, usage])` sinh đúng index tên
  gì trên SQLite — chỉ suy từ hành vi Prisma đã biết với `ProjectMember`.

*Hạn dùng: đúng tại 19/08, HEAD `c7f3ac8`. Schema là file sống — đo lại bước ⓪ trước khi chạy
bất kỳ lệnh nào trong file này, nhất là nếu có phiếu khác đã đụng `prisma/schema.prisma` sau
thời điểm soạn.*
