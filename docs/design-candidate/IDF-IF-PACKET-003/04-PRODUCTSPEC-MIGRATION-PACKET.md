# 04 · GÓI MIGRATION `ProductSpec`

## `SAFE-TO-RUN`

> **Không có gì để chạy.** Cả ba cột bị nghi là "chưa migrate" (`matId`, `room`, `confidence`) **đã tồn tại trên `prisma/dev.db` thật**, và `prisma migrate diff` giữa toàn bộ `schema.prisma` và DB trả về **empty migration** — độ lệch schema↔DB **bằng 0**.

⚠️ Một ngoại lệ, đọc trước khi gõ bất cứ lệnh Prisma nào: **sổ migration lệch** (§7 · Rủi ro #1). Bước sửa sổ đó là `RUN-WITH-BACKUP`, không phải `SAFE-TO-RUN`.

*Đo ngày 26/08/2026 · task `IF-PRODUCTSPEC-MIGRATION-PACKET-001` · mọi con số dưới đây đo trên **bản sao** `probe.db`, không chạm bản gốc.*

---

## 1 · ĐO SỰ THẬT — cột nào thiếu?

### Cách đo (nói rõ, để phiên sau lặp lại được)

```bash
SP=/private/tmp/.../scratchpad
cp /Users/tranben/Downloads/interiorflow/prisma/dev.db $SP/probe.db   # 38.510.592 byte
sqlite3 $SP/probe.db "PRAGMA integrity_check;"                        # → ok
sqlite3 $SP/probe.db "PRAGMA table_info(ProductSpec);"
```

`sqlite3` **CÓ** trong môi trường (`/usr/bin/sqlite3`, phiên bản 3.51.0) — không phải dùng đường vòng `$queryRawUnsafe`. Ghi chú này quan trọng vì `03-INTEGRATION-PLAN.md:113-114` khai *"chưa đọc được (không có `sqlite3` trong môi trường của lane)"* — câu đó **sai với môi trường phiên này**.

### Kết quả

| cột | có trong `schema.prisma`? | có trong bảng thật? | kết luận |
|---|---|---|---|
| `matId` | ✅ (dòng ~497) | ✅ **index 34** | **CÓ** |
| `room` | ✅ | ✅ **index 33** | **CÓ** |
| `confidence` | ✅ | ✅ **index 32** | **CÓ** |

```
PRAGMA table_info(ProductSpec)  →  35 cột (index 0..34)
…31|verified|BOOLEAN|1|false|0
   32|confidence|TEXT|0||0
   33|room|TEXT|0||0
   34|matId|TEXT|0||0
```

Chỉ mục cũng đã tạo đủ:

```
sqlite3 probe.db "SELECT name FROM sqlite_master WHERE tbl_name='ProductSpec';"
→ ProductSpec_matId_key | CREATE UNIQUE INDEX "ProductSpec_matId_key" ON "ProductSpec"("matId")
```

`CREATE TABLE` gốc kết thúc bằng `, "confidence" TEXT, "room" TEXT, "matId" TEXT)` — dấu hiệu điển hình của `ALTER TABLE ADD COLUMN` do `prisma db push` sinh ra, tức **ai đó đã push rồi và không cập nhật tài liệu**.

### Kiểm chéo ở tầng cao hơn — toàn schema, không riêng `ProductSpec`

```bash
node_modules/.bin/prisma migrate diff \
  --from-url "file:$SP/probe.db" \
  --to-schema-datamodel $SP/schema-probe.prisma --script
→ -- This is an empty migration.
```

**Toàn bộ 25 bảng của DB thật khớp 100% với `schema.prisma`.** Không có cột nào thiếu, ở bất cứ bảng nào.

### Prisma Client đã sinh cũng đã biết ba cột đó

```bash
grep -c matId      node_modules/.prisma/client/index.d.ts   → 31
grep -c confidence node_modules/.prisma/client/index.d.ts   → 30
diff <(sed -n '/model ProductSpec/,/^}/p' node_modules/.prisma/client/schema.prisma) \
     <(sed -n '/model ProductSpec/,/^}/p' prisma/schema.prisma)
→ chỉ 3 dòng khác nhau, TOÀN LÀ KHOẢNG TRẮNG căn cột. Không lệch nội dung.
```

Client (`node_modules/.prisma/client/schema.prisma`, 20/08 12:37) **đã generate sau khi có ba cột**. Nguy cơ P2022 kinh điển ("generate xong mà DB chưa push") **không tồn tại trên máy này** — cả hai vế đều đã mới.

```bash
npx tsc --noEmit → EXIT=0, không một dòng lỗi.
```

### ⇒ DANH SÁCH CỘT THẬT SỰ THIẾU

> **RỖNG. Không cột nào thiếu.**

### Tài liệu nào đang nói dối (phải sửa, xem §6)

| tệp:dòng | câu sai | sự thật đo được |
|---|---|---|
| `prisma/schema.prisma:~495` | `// Cột CHƯA MIGRATE — chủ dự án chạy npx prisma db push…` (về `matId`) | đã có, index 34 |
| `prisma/schema.prisma` (khối `room`/`confidence`) | `🔴🔴 CHƯA CHẠY prisma migrate — HAI CỘT DƯỚI ĐANG LÀ MỘT QUẢ MÌN` | đã có, index 32–33 |
| `lib/server/specs.ts:76-78` | `// cột chưa migrate trên DB thật nên s.matId có thể undefined` | phòng thủ thừa (vô hại, xem §5) |
| `scripts/backfill-material-matid.ts:1-45` | `⛔ CHỈ CHẠY SAU KHI… db push` + khối ép kiểu `as unknown as` "vì client chưa biết matId" | client đã biết; **và backfill đã chạy xong rồi** (§2) |
| `docs/design-candidate/IDF-IF-PACKET-003/03-INTEGRATION-PLAN.md:81` | `ProductSpec.room/confidence đã khai schema chưa db push — quả mìn` | mìn đã gỡ từ trước 26/08 |
| `03-INTEGRATION-PLAN.md:113-114` | `Trạng thái thật của cột matId: chưa đọc được` | đọc được, đã đo |

`lib/server/specs.ts:33` là chỗ **duy nhất đã đúng**: `SPEC_ROOM_COLUMN_READY = true`, kèm docblock ✅ "ĐÃ MỞ KHOÁ 06/08 … PRAGMA table_info(ProductSpec) → 34 cột". Cùng một tệp mang cả câu đúng (dòng 33) lẫn câu sai (dòng 76) — chính là cơ chế đẻ ra sự lẫn lộn này.

---

## 2 · ĐO ĐỘ RỦI RO

### Khối lượng dữ liệu

```bash
sqlite3 probe.db "SELECT COUNT(*) FROM ProductSpec;"                              → 10
sqlite3 probe.db "SELECT COUNT(*) FROM ProductSpec WHERE larkRecordId IS NOT NULL;" → 0
sqlite3 probe.db "SELECT kind, COUNT(*) FROM ProductSpec GROUP BY kind;"
  → furniture 7 · lighting 1 · material 2
```

| chỉ số | số đo | ý nghĩa |
|---|---|---|
| tổng hàng `ProductSpec` | **10** | dữ liệu hạt giống (`scripts/seed-specs.ts`), **không phải dữ liệu khách** |
| hàng có `larkRecordId` | **0** | **không có bản ghi nào đến từ Larkbase/ATLAS** — mất hết cũng không mất nguồn ngoài |
| `matId IS NULL` | 8 | **đúng thiết kế** — 8 hàng đó là furniture/lighting, domain matId chỉ là `kind='material'` |
| `kind='material' AND matId IS NULL` | **0** | ✅ **backfill ĐÃ CHẠY XONG** |
| `room IS NULL` | 10/10 | chưa ai ghi — đúng, chưa có cửa nhập |
| `confidence IS NULL` | 10/10 | như trên |

Hai hàng material đã mang UUID thật:

```
SW-TRV-BE    → acefe46b-7ef1-498f-a2d2-bc2771450e74
AC-ENG-OAK15 → e2d9a757-e77c-4c23-855d-d665dd071fbd
```

⇒ **`scripts/backfill-material-matid.ts` KHÔNG cần chạy lại.** Script idempotent nên chạy lại cũng chỉ trả `generated: 0`, nhưng chạy lại là hành động thừa trên DB thật — đừng.

**Rủi ro mất dữ liệu của gói này: gần bằng 0.** 10 hàng seed, 0 liên kết ngoài, 38MB DB kia là ảnh/asset của bảng khác, không phải `ProductSpec`.

### Ai đọc-ghi `ProductSpec` (file:dòng — đo bằng `grep -rn "productSpec\." app lib components scripts`)

| file:dòng | thao tác | vỡ nếu cột thiếu? |
|---|---|---|
| `app/api/specs/route.ts:19` | `findMany` (GET, không `select`) | 🔴 **VỠ** — Prisma tự SELECT mọi cột scalar |
| `app/api/specs/route.ts:44` | `create` (POST) | 🔴 VỠ |
| `app/api/specs/[id]/route.ts:32` | `findUnique` | 🔴 VỠ |
| `app/api/specs/[id]/route.ts:51` | `update` (PATCH) | 🔴 VỠ |
| `app/api/specs/[id]/route.ts:64` | `delete` | 🟡 DELETE không SELECT → có thể sống |
| `app/api/boq/[projectId]/route.ts:58` | `findMany()` **không lọc, không select** — nạp CẢ BẢNG cho BOQ | 🔴 **VỠ — đây là đường tiền thật** |
| `app/api/atlas-materials/sync/route.ts:72` | `upsert` (ATLAS sync) | 🔴 VỠ |
| `lib/capabilities/manufacturer-import-apply.ts:177,182` | `tx.productSpec.update/create` trong transaction | 🔴 VỠ |
| `scripts/seed-specs.ts:164-173` | `findFirst/update/create/count` | 🔴 VỠ |

**Cơ chế vỡ, nói cho rõ một lần:** không cần ai viết tên cột ra. Prisma Client tự sinh `SELECT` liệt kê **mọi cột scalar có trong schema đã generate**. Client mới + DB cũ ⇒ `P2022: The column main.ProductSpec.<x> does not exist in the current database` ở **mọi** truy vấn trên. Cờ `SPEC_ROOM_COLUMN_READY` chỉ chặn code của IF, **không chặn được câu SELECT do Prisma sinh**.

Bán kính nổ nếu điều đó xảy ra: **kho vật liệu · BOQ (`/api/boq/*`) · `/api/specs` · ATLAS sync · seed** — gần trọn nhánh vật tư.
Hôm nay bán kính đó **không nổ**, vì cả hai vế đã đồng bộ.

### Dev server đang chạy

```bash
lsof -nP -iTCP -sTCP:LISTEN | grep ':300[0-9]'  → (rỗng)
```

Không có dev server nào trên 3000–3009 tại thời điểm đo. (Ghi nhớ vận hành: CHINH=3001, PHU=3002, G4=3004.)

---

## 3 · KẾ HOẠCH MIGRATION

Vì §1 đã chứng minh **drift = 0**, phần expand→backfill→contract cho `matId`/`room`/`confidence` **đã hoàn tất trong quá khứ**. Kế hoạch dưới đây vì thế có hai phần: phần **A** ghi lại trạng thái đã xong (để không ai làm lại), phần **B** là việc *thật sự* còn phải làm — sửa sổ migration.

### A · Ba cột `ProductSpec` — TRẠNG THÁI: XONG

| pha | việc | trạng thái đo được |
|---|---|---|
| **expand** | thêm 3 cột nullable + unique index `matId` | ✅ có trong `PRAGMA table_info` + `sqlite_master` |
| **generate** | Prisma Client biết 3 cột | ✅ `node_modules/.prisma/client/schema.prisma` 20/08 12:37, khớp `diff` |
| **backfill** | `matId` cho mọi `kind='material'` | ✅ `kind='material' AND matId IS NULL` = **0** |
| **contract** | — | **KHÔNG CÓ** và **không được có**: `room`/`confidence` là hợp đồng đã chốt (G-M3-08), schema comment ghi rõ *"TUYỆT ĐỐI KHÔNG xoá 2 cột"*. `@unique` trên `matId` giữ NULL cho nhiều dòng — SQLite cho phép. Không cần siết `NOT NULL`. |

**Lệnh cần chạy cho phần A: KHÔNG CÓ.** Ai định gõ `prisma db push` "cho chắc" thì dừng lại — nó không thêm gì, mà là một lượt ghi thừa lên DB 38MB.

### B · Sửa sổ migration — `RUN-WITH-BACKUP`

Đo được:

```bash
sqlite3 probe.db "SELECT migration_name, started_at, finished_at FROM _prisma_migrations;"
→ 5 hàng: 20260703141955_init · 20260808000001_catchup_db_push_baseline
          · 20260808000002_them_workflowstate_task_externalref
          · 20260811170725_them_task_context · 20260811182705_them_project_profile

ls prisma/migrations → 6 thư mục

DATABASE_URL="file:$SP/probe.db" node_modules/.bin/prisma migrate status
→ 6 migrations found in prisma/migrations
  Following migration have not yet been applied:
    20260821140000_them_project_file_review_state
```

Nhưng cột của migration đó **đã có trên DB**:

```bash
sqlite3 probe.db "PRAGMA table_info(ProjectFile);" | tail -3
→ 13|reviewState|TEXT|1|'PENDING'|0
  14|reviewedAt|DATETIME|0||0
  15|reviewedBy|TEXT|0||0
```

Tức: SQL đã chạy bằng `db push`, nhưng **không ai ghi vào sổ `_prisma_migrations`**. Đây là quả mìn thật sự còn lại của repo — xem §7 · Rủi ro #1.

**Ai chạy:** chủ dự án (Hoà), trên máy thật, **không** qua sandbox/FUSE (FUSE không khoá được file SQLite — `docs/00-CHOT.md` LUẬT VẬN HÀNH).
**Chạy ở đâu:** `/Users/tranben/Downloads/interiorflow` (ROOT), **không** trong worktree.
**Điều kiện tiên quyết:** `lsof -nP -iTCP -sTCP:LISTEN | grep ':300'` phải rỗng — không dev server nào đang mở `dev.db`.

```bash
cd /Users/tranben/Downloads/interiorflow

# B0 · sao lưu (bắt buộc — xem §3.1)
sqlite3 prisma/dev.db ".backup 'backups/dev.db.bak-2026-08-26-ledger'"

# B1 · thử trên DB thử TRƯỚC (xem §3.3) — bắt buộc, không bỏ qua
# B2 · chỉ khi B1 xanh, mới chạy trên bản thật:
node_modules/.bin/prisma migrate resolve \
  --applied 20260821140000_them_project_file_review_state

# B3 · xác minh
node_modules/.bin/prisma migrate status      # phải nói "Database schema is up to date!"
node_modules/.bin/prisma migrate diff --from-url "file:./prisma/dev.db" \
  --to-schema-datamodel prisma/schema.prisma --script   # phải là "empty migration"
```

> ⛔ **KHÔNG chạy `prisma migrate dev`.** Nó sẽ cố **thi hành** file SQL đó, gặp `duplicate column name: reviewState`, đánh dấu migration **failed**, rồi đề nghị `migrate reset` — tức **xoá sạch `dev.db` 38MB**. `migrate resolve --applied` chỉ chèn một hàng vào `_prisma_migrations`, **không chạy SQL nào**.

### 3.1 · SAO LƯU

**Chép gì:** `prisma/dev.db` (38.510.592 byte). **Ra đâu:** `backups/` — repo đã có tiền lệ `backups/dev.db.bak-2026-08-21-1400` (đúng 38.510.592 byte). Đặt tên `dev.db.bak-<YYYY-MM-DD>-<việc>`.

**Dùng `.backup` chứ đừng `cp`:** `sqlite3 … ".backup"` chạy qua Online Backup API, an toàn cả khi có kết nối khác đang mở; `cp` một DB đang có WAL/journal có thể ra bản sao rách.

**Cách xác minh bản sao dùng được — ba bước, đủ cả ba mới tính là có sao lưu:**

```bash
B=backups/dev.db.bak-2026-08-26-ledger
ls -l $B                                            # 1. cùng cỡ 38.510.592 byte
sqlite3 $B "PRAGMA integrity_check;"                # 2. phải in đúng chữ  ok
sqlite3 $B "SELECT COUNT(*) FROM ProductSpec;"      # 3. phải ra 10
sqlite3 $B "SELECT COUNT(*) FROM pragma_table_info('ProductSpec');"  # phải ra 35
```

*(Bước 2 là bước hay bị bỏ — `probe.db` trong phiên này đã qua `integrity_check` → `ok`, nên biết chắc bản gốc lành.)*

⚠️ **Đừng dùng `prisma/dev.db.bak-*` cũ làm bản lùi.** 12 tệp `.bak` đang nằm lẫn trong `prisma/`, cũ nhất 01/08, mới nhất 20/08, cỡ từ 12MB đến 143MB — không tệp nào là ảnh chụp của trạng thái hôm nay. Bản lùi hợp lệ duy nhất là bản vừa chụp ở B0.

### 3.2 · ROLLBACK

Chỉ có một thao tác ghi (B2), và nó chỉ chèn một hàng, nên lùi rất gọn:

```bash
# Lùi mềm — gỡ đúng hàng vừa chèn:
sqlite3 prisma/dev.db \
  "DELETE FROM _prisma_migrations WHERE migration_name='20260821140000_them_project_file_review_state';"

# Lùi cứng — nếu DB có dấu hiệu hỏng, KHÔNG sửa tại chỗ, thay nguyên tệp:
#   (dừng mọi dev server trước)
mv prisma/dev.db prisma/dev.db.HONG-2026-08-26
cp backups/dev.db.bak-2026-08-26-ledger prisma/dev.db
sqlite3 prisma/dev.db "PRAGMA integrity_check;"   # phải  ok
```

**Điều kiện BUỘC phải lùi (thấy một dấu là lùi, không thương lượng):**

1. `PRAGMA integrity_check` trả về bất cứ thứ gì khác chữ `ok`.
2. `SELECT COUNT(*) FROM ProductSpec` ≠ **10**, hoặc `PRAGMA table_info(ProductSpec)` ≠ **35 cột**.
3. `prisma migrate status` báo có migration ở trạng thái **failed** (`rolled_back_at` NULL mà `finished_at` NULL).
4. Bất kỳ route nào ở §2 ném `P2022` / `no such column` sau khi chạy.
5. Xuất hiện tệp `prisma/dev.db-wal` hoặc `-journal` **mồ côi** sau khi đã đóng hết tiến trình.
6. `npm run tsc` từ EXIT=0 chuyển thành non-zero.

### 3.3 · DB THỬ

**Dựng thế nào:** chép bản thật ra `/tmp`, y hệt cách phiên này đã làm.

```bash
SP=/private/tmp/claude-501/<session>/scratchpad
mkdir -p $SP
sqlite3 /Users/tranben/Downloads/interiorflow/prisma/dev.db ".backup '$SP/probe.db'"
sqlite3 $SP/probe.db "PRAGMA integrity_check;"   # ok
```

**Chạy lệnh Prisma lên nó bằng cách ghi đè biến môi trường, KHÔNG sửa `.env`:**

```bash
cd /Users/tranben/Downloads/interiorflow
DATABASE_URL="file:$SP/probe.db" node_modules/.bin/prisma migrate status
DATABASE_URL="file:$SP/probe.db" node_modules/.bin/prisma migrate resolve --applied 20260821140000_them_project_file_review_state
DATABASE_URL="file:$SP/probe.db" node_modules/.bin/prisma migrate status   # kỳ vọng: up to date
```

Đã xác minh trong phiên này: biến môi trường đặt ở shell **thắng** `.env` — output in ra `SQLite database "probe.db" at "file:/private/tmp/…"`, không phải `prisma/dev.db`. Đây là cách an toàn duy nhất để thử mà không chạm bản thật.

**Dữ liệu lấy từ đâu:** từ chính bản thật (10 hàng, không có PII khách — 0 `larkRecordId`, toàn hàng seed). Không cần bịa dữ liệu, không được bịa.

⚠️ **`prisma/dev-sach.db` KHÔNG dùng được làm DB thử cho việc này.** Đo:

```bash
sqlite3 prisma/dev-sach.db "SELECT COUNT(*) FROM pragma_table_info('ProductSpec');"  → 34   (thiếu 1)
sqlite3 prisma/dev-sach.db "SELECT name FROM pragma_table_info('ProductSpec')
        WHERE name IN ('matId','room','confidence');"                                → confidence, room  (KHÔNG có matId)
sqlite3 prisma/dev-sach.db "SELECT COUNT(*) FROM ProductSpec;"                        → 0
```

Nó là ảnh chụp 08/08 — **có `room`/`confidence` nhưng thiếu `matId`**, và rỗng hàng. Dùng nó để thử sẽ cho kết quả sai theo hướng làm người ta yên tâm nhầm (nó *sẽ* báo cần thêm cột `matId` — đúng với chính nó, sai với DB thật).

### 3.4 · `node_modules` DÙNG CHUNG + P2022 — ai bị ảnh hưởng

Đo lại hiện trạng, vì bối cảnh giao việc mô tả bằng thì cũ:

```bash
ls -ld node_modules                                   → thư mục THẬT (681 mục), KHÔNG phải symlink
git worktree list                                     → ROOT + 2 worktree
ls -ld .claude/worktrees/*/node_modules
  → agent-a54fc5a8884c021bd/node_modules  (thư mục THẬT, 678 mục, 16/08)
  → agent-a919414f6dd76cb2e               (KHÔNG có node_modules)
grep -c matId .claude/worktrees/agent-a54fc5a8884c021bd/node_modules/.prisma/client/index.d.ts → 0
ls -l  .claude/worktrees/agent-a54fc5a8884c021bd/node_modules/.prisma/client/schema.prisma
  → 37.797 byte, 16/08 14:58   (ROOT: 48.748 byte, 20/08 12:37)
```

**Kết luận đo được — khác với giả định trong đề bài:**

- `node_modules` ở ROOT **không phải symlink**; worktree `a54f` có **bản sao riêng, độc lập**. ⇒ `prisma generate` ở ROOT **không** đụng tới worktree, và ngược lại.
- Client trong worktree `a54f` là bản **cũ 16/08, không biết `matId`** (grep = 0). Nếu chạy ở đó thì nó **không** SELECT `matId` ⇒ không P2022 vì lý do đó.
- Cả hai worktree **không có `.env`** và `dev.db` của chúng **0 byte**. Chúng không kết nối được DB thật, cũng không có DB riêng.

**Ai thật sự bị ảnh hưởng: không ai, ở hiện trạng này.** Nhưng ba đường tái sinh nguy cơ, phải chặn:

1. **`postinstall: "prisma generate"`** trong `package.json`. Bất kỳ ai chạy `npm install`/`npm ci` ở ROOT sẽ regenerate client — hôm nay **vô hại** (DB đã có đủ cột), nhưng sẽ **thành mìn ngay** khi có người thêm cột mới vào `schema.prisma` mà chưa push. Luật: **thêm cột vào `schema.prisma` và `db push` phải là MỘT lượt liền nhau, không được để qua đêm.**
2. Ai copy `.env` của ROOT vào worktree `a54f` → worktree đó dùng **client 16/08** đọc **DB 35 cột**: client cũ SELECT ít cột hơn nên vẫn *chạy*, nhưng `matId`/`room`/`confidence` sẽ **im lặng trả `undefined`**. `lib/server/specs.ts:76` `s.matId ?? null` sẽ nuốt gọn, BOQ mất matId mà **không báo lỗi**. Đây là kiểu sai tệ hơn P2022.
3. Chạy `npm install` **trong worktree** `a54f` → regenerate client mới ở đó; nếu lúc đó nó đã có `.env` trỏ DB thật thì mọi thứ lại đồng bộ. Nếu trỏ `dev.db` 0 byte của chính nó → gãy ngay từ bảng đầu tiên.

**Cách tránh, một câu:** worktree nào không cần DB thì **đừng cho nó `.env`** (hiện trạng đang đúng — giữ nguyên); worktree nào cần thì phải `npm install` + `prisma generate` **của riêng nó** rồi trỏ `.env` vào **bản sao** DB, không bao giờ vào `prisma/dev.db`.

---

## 4 · MA TRẬN TEST

Ký hiệu: **T0** = trước khi chạy B2 · **T1** = sau khi chạy B2 · **T2** = sau khi rollback.

| # | ca | dựng thế nào | mong đợi | thời điểm |
|---|---|---|---|---|
| **1** | Sổ migration khớp | `DATABASE_URL=…probe.db prisma migrate status` | **T0:** `Following migration have not yet been applied: 20260821140000_…` · **T1:** `Database schema is up to date!` | T0, T1 |
| **2** | Drift schema↔DB = 0 | `prisma migrate diff --from-url file:…probe.db --to-schema-datamodel prisma/schema.prisma --script` | `-- This is an empty migration.` — **không đổi ở cả T0/T1/T2** (B2 không chạy SQL) | T0, T1, T2 |
| **3** | Hình dạng bảng bất biến | `sqlite3 X "SELECT COUNT(*) FROM pragma_table_info('ProductSpec');"` | **35** ở cả ba thời điểm | T0, T1, T2 |
| **4** | Dữ liệu bất biến | `sqlite3 X "SELECT COUNT(*) FROM ProductSpec;"` | **10** ở cả ba thời điểm | T0, T1, T2 |
| **5** | **Đọc `ProductSpec` khi cột vừa thêm chưa backfill** | Không dựng lại được từ hiện trạng (đã backfill). Dựng bằng DB thử: `sqlite3 probe.db "UPDATE ProductSpec SET matId=NULL WHERE kind='material';"` rồi `GET /api/specs?kind=material` trỏ probe.db | HTTP **200**, `specs[].matId === null` cho cả 2 hàng, **không** exception, **không** P2022. Đây chính là ca `s.matId ?? null` ở `lib/server/specs.ts:76` sinh ra để đỡ | T0 (chỉ trên DB thử) |
| **6** | **`specToDto` với `matId` null** | `node_modules/.bin/sucrase-node` một tệp gọi `specToDto({…, matId: null, …})` **và** `specToDto({…})` (bỏ hẳn khoá `matId`) | cả hai trả `matId: null`; không throw. **Ghi nhận: `grep -rln specToDto --include=*.test.ts` = 0 — hàm này CHƯA CÓ test nào.** Ca này là test **phải viết mới**, không phải test sẵn có | T0, T1 |
| **7** | **BOQ vẫn ra đúng số** | `npm run tsc && node_modules/.bin/sucrase-node lib/boq/compute.test.ts` (+ `cache` · `from-project` · `xlsx`) | 4 tệp test PASS. Sau đó chạy runtime: `POST /api/boq/<projectId>` với `{doc}` thật, so `totalAmount` T0 vs T1 — **phải bằng nhau đến từng đồng**. `priceVnd` là `Decimal`, so bằng chuỗi, **không** so bằng float | T0, T1 |
| **8** | **Rollback rồi app vẫn chạy** | Chạy §3.2 lùi mềm trên DB thử, rồi: `prisma migrate status` · `GET /api/specs` · `POST /api/boq/<id>` · `npm run tsc` | `migrate status` **quay lại** trạng thái T0 (báo 1 migration chưa áp) — đúng, không phải lỗi; `/api/specs` **200**; `totalAmount` **y hệt** T0; `tsc` **EXIT=0**. Chứng minh B2 không phải cửa một chiều | T2 |
| **9** | Không sinh mìn P2022 | `grep -c matId node_modules/.prisma/client/index.d.ts` và `diff` khối `model ProductSpec` giữa client-schema và repo-schema | grep ≥ 1 · `diff` chỉ khác khoảng trắng | T0, T1 |
| **10** | Toàn bộ cổng nghiệm thu repo | `npm run test` (đã gồm `tsc` + `license:check` + `check:chot` + `soi:foundation` + mọi `*.test.ts`) | PASS. Nền tham chiếu: `npx tsc --noEmit` **EXIT=0** đo được ở phiên này | T1 |

**Không có PASS giả ở đây:** ca 5 và ca 6 hiện **chưa có test tương ứng trong repo** — đã nói rõ, và chúng được liệt kê là *việc phải viết*, không phải kết quả đã có.

---

## 5 · QUAN HỆ VỚI W2-1 TENANCY

### Trạng thái `tenantId` — đo, không đoán

```bash
grep -n "tenantId" prisma/schema.prisma                                     → 0 kết quả
sqlite3 probe.db "SELECT name FROM sqlite_master WHERE sql LIKE '%tenantId%';" → 0 hàng
sqlite3 probe.db "SELECT COUNT(*) FROM sqlite_master WHERE type='table';"      → 25
```

`tenantId` **chưa tồn tại ở đâu cả** — không trong schema, không trong DB, không có bảng `Tenant`. W2-1 là việc **hoàn toàn ở phía trước**.

### Trả lời: **TÁCH. Một migration riêng cho W2-1, không gộp với gì cả.**

Lý do — ba cái, xếp theo sức nặng:

1. **Tiền đề của việc "gộp" đã bị bác bỏ bằng số đo.** `03-INTEGRATION-PLAN.md:81` viết nguyên văn *"kéo theo quả mìn: `ProductSpec.room`/`confidence` đã khai schema chưa `db push` … Phải gộp cùng một lần push"*. Câu đó **sai hiện trạng**: ba cột đã có, drift = 0. **Không còn gì để gộp cùng.** Gộp một thứ đã xong vào một thứ chưa làm chỉ tạo ra một migration mô tả sai lịch sử.

2. **Sổ migration phải sạch TRƯỚC khi thêm 9 bảng.** Hôm nay repo đang mang một migration chưa ghi sổ (§3B). Chồng một thay đổi 9 bảng lên trên một cái sổ đã lệch = lúc có sự cố **không lùi được từng nấc**, vì `_prisma_migrations` không còn kể đúng chuyện gì đã xảy ra. Thứ tự bắt buộc: **sửa sổ (B2) → xác minh `up to date` → rồi mới sinh migration `tenantId`.**

3. **W2-1 tự nó là một đơn vị lùi được, đừng làm nó to hơn.** `tenantId String?` nullable trên 9 bảng + `Tenant` + backfill 1 tenant + **chưa ai đọc cột** — đó là expand thuần, additive, `ALTER TABLE ADD COLUMN` không viết lại bảng trên SQLite. Lùi = `DROP` các cột đó (hoặc thay tệp DB). Trộn thêm bất cứ thay đổi nào khác vào cùng một migration là biến một bước lùi-được thành một bước lùi-tất-cả-hoặc-không.

**Nhưng có MỘT thứ của gói này W2-1 phải thừa hưởng — quy trình, không phải nội dung:**

`ProductSpec` là một trong 9 bảng sẽ nhận `tenantId`, và nó là bảng có **bán kính nổ rộng nhất** (§2: BOQ nạp cả bảng bằng `findMany()` trần). Nên khi làm W2-1, ba luật rút ra từ đây áp nguyên:

- **Thêm cột vào `schema.prisma` và `db push`/`migrate` phải cùng MỘT lượt**, không được để qua đêm — vì `postinstall: prisma generate` có thể chạy bất cứ lúc nào mà không ai chủ ý gõ.
- **Dùng `prisma migrate dev --name tenant-expand` để sinh file SQL**, nhưng sinh trên **DB thử**, đọc SQL bằng mắt, rồi mới áp lên bản thật. Không bao giờ `migrate dev` thẳng lên `prisma/dev.db`.
- **Không đẻ cờ `*_COLUMN_READY` thứ hai.** Cờ `SPEC_ROOM_COLUMN_READY` đã tự chứng minh là không cứu được ca P2022 (nó chặn code IF, không chặn SELECT của Prisma) mà lại để lại một tệp mang cả câu đúng lẫn câu sai. Luật 7: lỗi hệ thống chữa bằng hệ thống — cách chữa đúng là *push và generate đi liền nhau*, không phải thêm một biến boolean.

---

## 6 · VIỆC PHẢI LÀM (ngoài phạm vi ghi của gói này — giao cho lượt thi công)

Không sửa trong phiên này vì phạm vi ghi chỉ có một tệp. Xếp theo mức nguy hiểm:

| # | việc | tệp |
|---|---|---|
| 1 | `prisma migrate resolve --applied 20260821140000_…` (§3B) | `prisma/dev.db` |
| 2 | Xoá khối cảnh báo "CHƯA MIGRATE"/"quả mìn" của `matId`·`room`·`confidence`, thay bằng một dòng ghi ngày đã push | `prisma/schema.prisma` |
| 3 | Xoá comment sai ở đường `matId` (giữ `?? null`, chỉ sửa lời giải thích — nó vẫn đúng cho ca client cũ ở worktree, §3.4) | `lib/server/specs.ts:76-78` |
| 4 | Đánh dấu script **ĐÃ CHẠY XONG 2/2 hàng material**, gỡ khối `as unknown as` (client đã biết `matId`) | `scripts/backfill-material-matid.ts` |
| 5 | Sửa dòng W2-1 và mục "chưa đọc được" | `03-INTEGRATION-PLAN.md:81,113-114` |
| 6 | Viết test cho `specToDto` (hôm nay **0 test**) — ca `matId: null` và ca thiếu hẳn khoá | tệp mới `lib/server/specs.test.ts` |
| 7 | Dọn 12 tệp `prisma/dev.db.bak-*` (tổng ~700MB, cũ nhất 01/08) — hỏi Hoà trước, đừng tự xoá | `prisma/` |

---

## 7 · BA RỦI RO LỚN NHẤT

### 🔴 #1 — `prisma migrate dev` gặp sổ lệch → Prisma đề nghị `reset` → mất `dev.db` 38MB

**Cơ chế:** `20260821140000_them_project_file_review_state` **có trong thư mục** nhưng **không có trong `_prisma_migrations`**, trong khi ba cột của nó **đã tồn tại**. Ai chạy `migrate dev` sẽ khiến Prisma thi hành `ALTER TABLE "ProjectFile" ADD COLUMN "reviewState"…` → `duplicate column name` → migration **failed** → Prisma đề nghị `migrate reset`. Ấn "yes" một lần là mất toàn bộ DB thật.

**Vì sao dễ dính:** `migrate status` từng báo *"up to date"* trong quá khứ (chính comment đầu tệp migration đó đã ghi lại bẫy này), nên người ta tin sổ mà không so schema với DB.

**Dấu hiệu sớm:**
- `prisma migrate status` in `Following migration have not yet been applied:` **trong khi** `migrate diff` lại nói `empty migration`. Hai câu đó mâu thuẫn = sổ lệch, **không phải** thiếu cột.
- `SELECT COUNT(*) FROM _prisma_migrations` (**5**) ≠ `ls prisma/migrations | grep -v migration_lock | wc -l` (**6**).
- Bất kỳ output nào của Prisma chứa chữ `reset`, `drift detected`, hoặc `failed migration`.

**Chặn:** chỉ dùng `migrate resolve --applied` (§3B). Không bao giờ `migrate dev` trên `prisma/dev.db`.

---

### 🟠 #2 — Tài liệu nói dối khiến phiên sau "sửa" một thứ đã xong

**Cơ chế:** **sáu** chỗ trong repo (§1, bảng cuối) vẫn khẳng định ba cột "CHƯA MIGRATE", trong đó có cả `schema.prisma` — tệp mà ai cũng đọc — với mấy dòng `🔴🔴 QUẢ MÌN`. Một phiên nguội đọc đúng theo tài liệu sẽ kết luận "phải push" rồi gõ `npx prisma db push` (hoặc chạy lại `backfill-material-matid.ts --apply`) lên DB thật, có thể lúc dev server đang mở. Đúng cơ chế mà luật M-24 mô tả: **não bền viết ra mà không ai cập nhật thì tệ hơn không viết**.

Nguy hiểm gấp đôi vì `lib/server/specs.ts` mang **cả hai** câu: dòng 33 nói đã mở khoá, dòng 76 nói chưa migrate. Người đọc tin dòng nào là ngẫu nhiên.

**Dấu hiệu sớm:**
- `grep -rn "CHƯA MIGRATE\|chưa migrate\|chưa db push" prisma/schema.prisma lib/ scripts/ docs/` còn ra kết quả **cạnh tên** `matId`/`room`/`confidence`.
- Có ai đó đề xuất chạy `backfill-material-matid.ts` (dấu hiệu chắc chắn họ chưa đo `kind='material' AND matId IS NULL` = **0**).
- `git log -1 --stat prisma/dev.db` cho thấy DB vừa bị ghi mà không có commit tài liệu đi kèm.

**Chặn:** §6 việc #2–#5, làm **trước** khi mở lượt W2-1.

---

### 🟡 #3 — Client Prisma cũ ở worktree đọc DB mới → mất field **im lặng**, không lỗi

**Cơ chế:** `.claude/worktrees/agent-a54fc5a8884c021bd/node_modules/.prisma/client` sinh **16/08**, `grep -c matId` = **0**. Hôm nay worktree đó không có `.env` và `dev.db` 0 byte nên vô hại. Nhưng nếu ai copy `.env` sang: client cũ SELECT **thiếu** cột ⇒ **không** ném P2022 (đó là ca client mới + DB cũ, ngược chiều) — nó chỉ trả về object thiếu khoá. `lib/server/specs.ts:76` `s.matId ?? null` **nuốt gọn** thành `null`, và BOQ chạy tiếp với vật liệu mất danh tính. **Sai mà không kêu** — đúng loại lỗi mà `docs/00-CHOT.md` xếp nặng hơn lỗi to tiếng.

**Dấu hiệu sớm:**
- Kích cỡ `node_modules/.prisma/client/schema.prisma` lệch giữa ROOT (**48.748** byte, 20/08 12:37) và worktree (**37.797** byte, 16/08 14:58).
- `GET /api/specs?kind=material` trả `matId: null` cho hàng mà `sqlite3` cho thấy có UUID (`acefe46b-…` / `e2d9a757-…`).
- Xuất hiện `.env` trong `.claude/worktrees/*/`, hoặc `dev.db` của worktree lớn hơn 0 byte.
- BOQ báo `spec-not-found` cho vật liệu vẫn đang tồn tại trong bảng.

**Chặn:** giữ worktree **không có `.env`** (hiện trạng đúng); worktree nào cần DB thì `npm install` riêng + `.env` trỏ **bản sao**, không bao giờ trỏ `prisma/dev.db`.

---

## PHỤ LỤC · Lệnh đã chạy trong phiên này (đều chỉ-đọc hoặc chạy trên bản sao)

```bash
cp prisma/dev.db $SP/probe.db
sqlite3 $SP/probe.db "PRAGMA integrity_check;"                                   → ok
sqlite3 $SP/probe.db "PRAGMA table_info(ProductSpec);"                           → 35 cột
sqlite3 $SP/probe.db "SELECT name,sql FROM sqlite_master WHERE tbl_name='ProductSpec';"
sqlite3 $SP/probe.db "SELECT COUNT(*) FROM ProductSpec;"                         → 10
sqlite3 $SP/probe.db "SELECT COUNT(*) FROM ProductSpec WHERE larkRecordId IS NOT NULL;" → 0
sqlite3 $SP/probe.db "SELECT kind, COUNT(*) FROM ProductSpec GROUP BY kind;"     → furniture 7 · lighting 1 · material 2
sqlite3 $SP/probe.db "SELECT COUNT(*) FILTER (WHERE kind='material' AND matId IS NULL) FROM ProductSpec;" → 0
sqlite3 $SP/probe.db "SELECT * FROM _prisma_migrations;"                         → 5 hàng
sqlite3 $SP/probe.db "SELECT name FROM sqlite_master WHERE sql LIKE '%tenantId%';" → rỗng
prisma migrate diff --from-url "file:$SP/probe.db" --to-schema-datamodel …       → empty migration
DATABASE_URL="file:$SP/probe.db" prisma migrate status                           → 1 migration chưa áp
npx tsc --noEmit                                                                  → EXIT=0
lsof -nP -iTCP -sTCP:LISTEN | grep ':300[0-9]'                                    → rỗng
grep -rn "productSpec\." app lib components scripts                               → 13 điểm chạm
```

**KHÔNG chạy** (và không được chạy trong lượt kế hoạch): `prisma db push` · `prisma migrate dev` · `prisma migrate deploy` · `prisma generate` · `backfill-material-matid.ts --apply` · mọi lệnh ghi vào `prisma/dev.db`.
