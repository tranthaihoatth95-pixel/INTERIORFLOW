# RUNBOOK DB — Wave 0 · 19/08/2026 (W0.1 soạn, Hoà chạy TAY trên máy thật)

> **Phiên soạn KHÔNG chạy bất kỳ lệnh mutation nào** — mọi lệnh dưới đây là để Hoà chạy.
> Mốc soạn: HEAD `3da4b8c`. Mọi con số trong file này ĐO TẠI NGUỒN lúc soạn (19/08 sáng),
> có thể lệch nếu DB/schema đổi sau đó — chạy lại bước ⓪ trước khi tin.

## ⓪ HIỆN TRẠNG ĐÃ ĐO (19/08) — ĐỌC TRƯỚC, ĐỠ LO THỪA

**Toàn bộ drift schema ↔ `prisma/dev.db` = ĐÚNG MỘT CỘT: `ProductSpec.matId`.**
Đã diff TẤT CẢ 21 model trong `prisma/schema.prisma` với `PRAGMA table_info` từng bảng
(loại trừ relation field): chỉ `ProductSpec` thiếu `matId`. Nghĩa là `db push` lần này
làm ĐÚNG MỘT việc: thêm cột nullable + unique index. Không đụng dữ liệu nào.

Ba nhóm "pending" cũ trong sổ **THẬT RA ĐÃ MIGRATE RỒI** (đo bằng PRAGMA, không bằng lời khai):

| Nhóm | Bảng/cột trong DB? | Cờ code | Trạng thái thật |
|---|---|---|---|
| `room`/`confidence` (ProductSpec) | ✅ có (cột 32, 33) | `SPEC_ROOM_COLUMN_READY = true` — `lib/server/specs.ts:33` | **XONG từ 06/08** — không việc gì phải làm |
| `Task` + `WorkflowState` | ✅ có (5 Task · 16 WorkflowState bản ghi) | `TASK_TABLES_READY = true` — `lib/server/tasks.ts:19` | **XONG từ 08/08** (migration `20260808000002`) — không việc gì phải làm |
| `ExternalRef` | ✅ **bảng ĐÃ CÓ** (0 bản ghi) | `EXTERNAL_REF_TABLE_READY = false` — `lib/integrations/external-ref.ts:47` | ⚠️ **CỜ STALE** — bảng có thật từ migration 08/08 mà cờ chưa flip. Việc CODE (bước 4), KHÔNG cần push gì |
| `ProductSpec.matId` (schema:429) | ❌ **CHƯA có** | không có cờ gate — script backfill dùng cast hẹp, chạy được ngay sau generate | **ĐÂY là thứ duy nhất `db push` sẽ làm** |

Kiểm chứng nhanh trước khi chạy (read-only, chạy ở gốc repo):

```bash
sqlite3 prisma/dev.db "PRAGMA table_info(ProductSpec);" | grep matId
# Mong đợi: KHÔNG in gì (cột chưa có). Nếu in ra dòng matId → push đã chạy rồi, nhảy tới Bước 3.
```

## ⚠️ ĐIỀU KIỆN TRƯỚC KHI CHẠY — CÁC PHIÊN KHÁC PHẢI NGHỈ

Máy đang có **nhiều phiên Claude Code + dev server (3001/3002/3004) dùng CHUNG một
`node_modules`**. `npx prisma generate` ghi đè Prisma Client chung — bài học 19/08 (mục H
báo cáo bước 2A): generate khi DB chưa push làm MỌI phiên khác lỗi SQL `no such column`
tức thì. **Chạy runbook này khi các phiên agent nghỉ + không dev server nào mở**
(`lsof -iTCP -sTCP:LISTEN | grep node` để kiểm). Sau khi push xong thì generate an toàn
vĩnh viễn (kể cả `postinstall` tự gọi generate).

---

## Bước 1 — BACKUP (bắt buộc, đúng luật 00-CHOT: `.backup`, KHÔNG `cp`)

```bash
cd /Users/tranben/Downloads/interiorflow/prisma && sqlite3 dev.db ".backup 'dev.db.bak-2026-08-19-wave0'"
# Mong đợi: im lặng, exit 0. File mới ~36MB xuất hiện cạnh dev.db.
```

Verify backup TRƯỚC khi đi tiếp:

```bash
sqlite3 prisma/dev.db.bak-2026-08-19-wave0 "PRAGMA integrity_check;"
# Mong đợi: ok
```

```bash
sqlite3 prisma/dev.db "SELECT count(*) FROM ProductSpec; SELECT count(*) FROM Task;" && sqlite3 prisma/dev.db.bak-2026-08-19-wave0 "SELECT count(*) FROM ProductSpec; SELECT count(*) FROM Task;"
# Mong đợi: hai cặp số GIỐNG HỆT nhau. Số đo 19/08 sáng: ProductSpec=10 · Task=5.
```

## Bước 2 — DB PUSH

```bash
cd /Users/tranben/Downloads/interiorflow && npx prisma db push
# Mong đợi: "Your database is now in sync with your Prisma schema." — thêm cột matId + unique index.
# KHÔNG được hỏi về data loss (thêm cột nullable là non-destructive). Nếu nó cảnh báo
# mất dữ liệu / đòi reset → DỪNG NGAY, đừng gõ y — nghĩa là drift đã khác lúc soạn runbook.
```

**Vì sao `db push` chứ không `migrate dev`:** repo dùng lối lai — `prisma/migrations/` có
tồn tại nhưng lịch sử đã có baseline "catchup" (`20260808000001_catchup_db_push_baseline`)
chứng tỏ dev.db được quản bằng `db push` rồi vá sổ migration sau. `migrate dev` lúc này sẽ
phát hiện drift với sổ migration và **đề nghị RESET database** (mất 10 ProductSpec + 5 Task
+ dữ liệu thật khác). Đây cũng là lệnh mà chính comment schema (`schema.prisma` vùng :477),
`lib/integrations/external-ref.ts:66` và báo cáo bước 2A §D đều chỉ định. Đối soát xong:
**`db push` là đúng, `migrate dev` là sai cho DB này.**

## Bước 3 — GENERATE (CHỈ sau khi Bước 2 báo thành công)

```bash
cd /Users/tranben/Downloads/interiorflow && npx prisma generate
# Mong đợi: "Generated Prisma Client". Từ lúc này Prisma Client biết field matId —
# các phiên/dev server khởi động lại sau đó đều nhất quán với DB.
```

## Bước 4 — FLIP CỜ (việc CODE, Hoà KHÔNG tự sửa — giao phiên code sau)

Liệt kê để không rơi, KHÔNG nằm trong phần Hoà gõ lệnh:

1. `lib/integrations/external-ref.ts:47` — `EXTERNAL_REF_TABLE_READY: false → true`.
   Bảng đã có trong DB từ 08/08; cờ đang stale. Flip phải sửa KÈM test guard
   `lib/integrations/external-ref.test.ts:111-116` (test đang khẳng định nguồn chứa
   `= false` — flip mà quên test là `npm test` đỏ, theo đúng khuôn `tasks.test.ts` đã đổi).
   Sau flip, các đường sống dậy: `lib/integrations/lark-bridge.ts:44,64` ·
   `lib/integrations/providers/lark-write.ts:40` ·
   `app/api/lark-tasks/[recordId]/status/route.ts:72,79` · 2 script backfill
   `scripts/migrate-lark-user-map-to-external-ref.ts` + `scripts/migrate-lark-project-code-to-external-ref.ts`.
2. `matId` — **KHÔNG có cờ nào phải flip** (thiết kế bước 2A: script dùng cast hẹp,
   resolver `lib/materials/resolve.ts` đường UUID tra qua sources truyền vào). Việc code
   tuỳ chọn sau generate: xoá khối cast `specClient` trong `scripts/backfill-material-matid.ts`
   (docstring tự khai "không bắt buộc").
3. `SPEC_ROOM_COLUMN_READY` (`lib/server/specs.ts:33`) và `TASK_TABLES_READY`
   (`lib/server/tasks.ts:19`) — **đã true, không đụng**.

## Bước 5 — BACKFILL matId (dry-run trước, apply sau)

```bash
cd /Users/tranben/Downloads/interiorflow && node_modules/.bin/sucrase-node scripts/backfill-material-matid.ts
# DRY-RUN, không ghi gì. Đọc report console: scanned / skipped / alreadyHasMatId / generated / errors.
# Số mong đợi theo DB 19/08 sáng: scanned=10 · kind='material'=2 → generated=2 · errors=0.
# generated lệch xa 2 hoặc errors>0 → DỪNG, đừng --apply, báo lại phiên T.
```

```bash
cd /Users/tranben/Downloads/interiorflow && node_modules/.bin/sucrase-node scripts/backfill-material-matid.ts --apply
# GHI THẬT. Mong đợi: generated=2 (hoặc đúng số dry-run vừa báo), errors=0.
# Idempotent: chạy lại lần nữa phải ra generated=0.
```

## Bước 6 — VERIFY

```bash
sqlite3 prisma/dev.db "SELECT count(*) FROM ProductSpec WHERE matId IS NOT NULL; SELECT kind, matId FROM ProductSpec WHERE matId IS NOT NULL;"
# Mong đợi: 2 · cả hai dòng kind='material', matId là UUID lowercase, không trùng nhau.
```

```bash
cd /Users/tranben/Downloads/interiorflow && npm test
# Mong đợi: tsc 0 lỗi · license pass · check:chot pass · 0 test fail.
```

---

## ROLLBACK — từng bước

**Push hỏng / muốn hoàn nguyên DB** (khi KHÔNG server nào mở):

```bash
cd /Users/tranben/Downloads/interiorflow/prisma && sqlite3 dev.db ".restore 'dev.db.bak-2026-08-19-wave0'"
# Trả dev.db về đúng trạng thái trước Bước 2. Verify lại bằng PRAGMA integrity_check + 2 count ở Bước 1.
```

⚠️ Nếu đã lỡ chạy `generate` (Bước 3) rồi mới restore DB → client biết `matId` mà DB không có
→ mọi truy vấn ProductSpec chết runtime (đúng ca 06/08). Cách gỡ: hoặc push lại (đi tiếp),
hoặc gỡ tạm khối `matId` trong `prisma/schema.prisma` rồi `npx prisma generate` lại.
Lưu ý: `prisma/schema.prisma` đang là **thay đổi working-tree CHƯA commit** — `git checkout`
file này là mất luôn khối matId + comment 19/08, chỉ làm khi cố ý bỏ cả slice.

**Generate hỏng** (hiếm — lỗi mạng tải engine): chạy lại `npx prisma generate`. Nếu client
nát hẳn: `rm -rf node_modules/.prisma && npx prisma generate`. Không cần đụng cả
`node_modules` (checkout node_modules không tồn tại — nó không nằm trong git).

**Backfill hỏng / muốn xoá matId đã sinh:**

```bash
sqlite3 prisma/dev.db "UPDATE ProductSpec SET matId = NULL;"
# AN TOÀN Ở THỜI ĐIỂM NÀY: matId nullable, unique index chấp nhận nhiều NULL, và chưa có
# dữ liệu nào THAM CHIẾU các UUID này (ExternalRef=0 bản ghi; .idfc/BOQ chưa nối matId UUID).
# ⚠️ NGOẠI LỆ DUY NHẤT: nếu đã mở app và migration PBR localStorage
# (migratePbrLegacyToCanonical) đã chạy trong trình duyệt — khoá PBR canonical đang trỏ vào
# đúng các UUID này; xoá rồi backfill lại sẽ sinh UUID MỚI, mồ côi các khoá PBR đó.
# Trường hợp đó: đừng NULL hàng loạt, báo lại phiên T xử từng dòng.
```

## CHƯA VERIFY ĐƯỢC (vì phiên soạn bị cấm chạy mutation)

- Chưa chạy thử `db push`/`generate`/backfill ở bất kỳ dạng nào — kể cả dry-run backfill
  (nó mở PrismaClient đọc DB thật; để nguyên cho Hoà chạy lần đầu có kiểm soát).
- `DATABASE_URL` trong `.env` không được đọc giá trị (luật phiếu) — runbook GIẢ ĐỊNH nó trỏ
  `file:./dev.db` (tương đối thư mục `prisma/`). Mọi bằng chứng gián tiếp khớp (các bản
  `.bak` lịch sử đều nằm ở `prisma/`, dev.db có đủ dữ liệu thật), nhưng nếu Hoà từng đổi
  URL thì các lệnh `sqlite3 prisma/dev.db` phải đổi đường dẫn theo.
- Hành vi chính xác của `db push` với sổ migration lai chỉ suy từ lịch sử repo + tài liệu
  Prisma, chưa chạy `prisma migrate status` để đối chiếu (tránh mọi lệnh prisma theo phiếu).

*Hạn dùng: các con số (10 ProductSpec · 2 material · 5 Task · 16 WorkflowState · 0 ExternalRef ·
drift=1 cột) đúng tại 19/08 sáng, HEAD `3da4b8c`. DB là file sống — đo lại bước ⓪ trước khi chạy.*
