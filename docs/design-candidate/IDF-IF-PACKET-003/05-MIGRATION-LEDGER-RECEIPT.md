# 05 · BIÊN NHẬN ĐỐI SOÁT SỔ MIGRATION
`IF-MIGRATION-LEDGER-RECONCILIATION-001` · đo 26–27/08/2026 · Prisma 6.19.3 · SQLite 3.51.0

## VERDICT

> **`PARTIAL` — forensic hoàn tất trên BẢN SAO; chưa chạm DB thật (chỉ đọc byte để băm + chép).**

**Chưa đủ bằng chứng để cho phép chạy `prisma migrate resolve` trên DB thật ngay bây giờ** —
không phải vì lệnh đó nguy hiểm (diễn tập trên bản sao cho thấy nó an toàn, 0 hàng dữ liệu đổi),
mà vì **nó chữa sai bệnh**. Sổ lệch chỉ là TRIỆU CHỨNG; bệnh là **thư mục `prisma/migrations/`
không dựng lại được CSDL** — thiếu hẳn 3 bảng và 2 cột. Chữa sổ trước khi chữa thư mục sẽ **dán
nhãn XANH lên một cây migration đã gãy**, và làm mất luôn tín hiệu duy nhất đang báo động
(`migrate status` đang nói đúng sự thật là có thứ chưa áp). Chi tiết ở §F.

### Ranh giới đã tôn trọng
| Luật | Bằng chứng |
|---|---|
| Không chạm `prisma/dev.db` | mọi lệnh Prisma trỏ `file:…/scratchpad/mig-forensic/work.db`; `stat` + `shasum` DB thật trước/sau mỗi lệnh — xem §D.0 |
| Không `migrate`/`db push`/`generate` trên DB thật | `migrate status`, `resolve`, `deploy`, `diff` đều chạy với **bản sao schema** ở `…/scratchpad/mig-forensic/pj/prisma/schema.prisma` (datasource ghi cứng đường bản sao, không đọc `.env`) |
| Không sửa `prisma/schema.prisma`, không sửa mã nguồn | `git status` phần `prisma/` không đổi; tệp DUY NHẤT được ghi là chính biên nhận này |

**Thư mục đo đạc:** `/private/tmp/claude-501/-Users-tranben-Downloads-interiorflow/0ffcd43c-e632-46ff-9ebc-90f0a62c12c2/scratchpad/mig-forensic/` (ngoài repo).

```bash
$ cat .env | grep DATABASE_URL
DATABASE_URL="file:/Users/tranben/Downloads/interiorflow/prisma/dev.db"

$ ls -la prisma/dev.db dev.db
-rw-r--r--@ 1 tranben staff        0 Aug 16 08:01 dev.db          # ← GỐC repo, 0 byte, KHÔNG dùng
-rw-r--r--@ 1 tranben staff 38510592 Aug 26 23:44 prisma/dev.db   # ← DB thật

$ ls prisma/dev.db-wal prisma/dev.db-shm
ls: dev.db-wal: No such file or directory
ls: dev.db-shm: No such file or directory        # ← không có WAL/SHM để chép
$ sqlite3 work.db "PRAGMA journal_mode;"
delete                                            # ← xác nhận: không ở chế độ WAL

$ cp -p prisma/dev.db  …/mig-forensic/work.db
$ shasum -a 256 prisma/dev.db …/work.db
4edcc5d34a4c3a210780eec52108abe3f94608f1437608e4546d848394c8492e  prisma/dev.db
4edcc5d34a4c3a210780eec52108abe3f94608f1437608e4546d848394c8492e  …/work.db   # ← bản sao trung thực từng byte
```

---

## A · FORENSIC TRÊN BẢN SAO

### A.1 · Sáu thư mục migration — thời gian · kích thước · SHA-256

```bash
$ cd prisma/migrations
$ for d in */; do d=${d%/}; echo "$d | mtime=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$d/migration.sql") | bytes=$(stat -f%z "$d/migration.sql") | sha256=$(shasum -a 256 "$d/migration.sql" | cut -d' ' -f1)"; done
```

| # | Thư mục | mtime `migration.sql` | bytes | SHA-256 |
|---|---|---|---|---|
| 1 | `20260703141955_init` | 2026-07-03 21:19:55 | 3038 | `995b5626ae77c4bc699b00196b5b2d20c4e547642f6d5f4ce3c5535dc9613f2c` |
| 2 | `20260808000001_catchup_db_push_baseline` | 2026-08-08 06:21:29 | 11140 | `16455f4216833167fc3fad58d7eafe64b6ad44451feac22fdcf847db4446de9d` |
| 3 | `20260808000002_them_workflowstate_task_externalref` | 2026-08-08 06:21:29 | 2055 | `a0ecc27b13494e66ff56503f94585c38cf761fc58ecc61fbb25588b3db74b1e5` |
| 4 | `20260811170725_them_task_context` | 2026-08-12 00:07:25 | 155 | `bd23fd49829fcdf7fbcbad094e91f78ef214b0630613970ebc13255d0d64c4fa` |
| 5 | `20260811182705_them_project_profile` | 2026-08-12 01:27:05 | 584 | `69a80b2f2594a14106a80a727c1e61d8ee512903e26ee90776229b74feae6192` |
| 6 | `20260821140000_them_project_file_review_state` | **2026-08-21 13:22:58** | 1689 | `4ef8f179f51616d0aa3e902c6d38755a458e719a8d1928bf5d26ab8c7c0d74fd` |

`migration_lock.toml` → `provider = "sqlite"` (khớp datasource).

**Lệch tên ↔ mtime của #6:** tên thư mục nói `20260821140000` (21/08 14:00) nhưng tệp được ghi lúc
**13:22:58**, tức tên là **đặt tay**, không phải do `prisma migrate dev` sinh. Xác nhận thêm bằng git:

```bash
$ for d in prisma/migrations/*/; do echo "== $d"; git log --format="%h %ad %s" --date=short -- "$d" | tail -1; done
== …/20260703141955_init/                          d2b8825 2026-07-03 …
== …/20260808000001_catchup_db_push_baseline/      3578af2 2026-08-08 …
== …/20260808000002_them_workflowstate…/           3578af2 2026-08-08 …
== …/20260811170725_them_task_context/             1035f5a 2026-08-12 …
== …/20260811182705_them_project_profile/          4fc9c3c 2026-08-12 …
== …/20260821140000_them_project_file_review_state/ 147f66a 2026-08-26 feat(security): R3 …
```
⇒ #6 **mới vào git hôm 26/08**, năm ngày sau khi tệp được viết. Nó sống ngoài git suốt 5 ngày.

### A.2 · Dump `_prisma_migrations` — đủ 8 cột, 5 hàng

```bash
$ sqlite3 …/work.db ".schema _prisma_migrations"     # id · checksum · finished_at · migration_name
                                                      # logs · rolled_back_at · started_at · applied_steps_count
$ sqlite3 …/work.db "SELECT COUNT(*) FROM _prisma_migrations;"
5
$ sqlite3 -cmd ".mode line" …/work.db "SELECT id, checksum, migration_name, started_at, finished_at, applied_steps_count, logs, rolled_back_at FROM _prisma_migrations ORDER BY started_at;"
```

| id | migration_name | started_at (ms) → giờ | finished_at | steps | logs | rolled_back_at |
|---|---|---|---|---|---|---|
| `8dea9710-f2a7-4bd0-b491-b7439a64306d` | `20260703141955_init` | 1783088395122 → 03/07 21:19:55.122 | 1783088395127 (+5ms) | **1** | ∅ | ∅ |
| `974c2970-2e2b-450e-881f-e4bc911392c0` | `20260808000001_catchup_db_push_baseline` | 1786144912372 → 08/08 06:21:52.372 | 1786144912372 (**+0ms**) | **0** | ∅ | ∅ |
| `94b4dedf-70f7-458d-9634-cff3ebb5a413` | `20260808000002_them_workflowstate_task_externalref` | 1786144913121 → 08/08 06:21:53.121 | 1786144913121 (**+0ms**) | **0** | ∅ | ∅ |
| `7400bc43-d02f-4142-9272-8d5651bc6635` | `20260811170725_them_task_context` | 1786468045190 → 12/08 00:07:25.190 | 1786468045192 (+2ms) | **1** | ∅ | ∅ |
| `436cb44d-b736-4a9c-b60c-73fb7a0249a0` | `20260811182705_them_project_profile` | 1786472825708 → 12/08 01:27:05.708 | 1786472825738 (+30ms) | **1** | ∅ | ∅ |

(checksum của từng hàng ghi ở bảng §A.3.)

**Đọc được gì từ `applied_steps_count`:** hai hàng #2 và #3 có `steps = 0` và `finished_at =
started_at` chằn chặn ⇒ chúng **không hề chạy SQL**, chúng được **đánh dấu** bằng
`prisma migrate resolve --applied`. Đây không phải suy đoán — diễn tập §E.0 cho thấy `resolve`
sinh ra đúng dấu vân tay đó (`steps=0`, `finished_at == started_at`). Tên thư mục #2
(`catchup_db_push_baseline`) tự khai điều này: nó là bản "chép lại" của một chuỗi `db push`
đã làm trước đó.

### A.3 · Đối chiếu hash — Prisma dùng thuật toán nào?

**Xác minh, không đoán.** Hai bằng chứng độc lập:

1. **Khớp toàn phần 5/5** giữa `checksum` trong sổ và SHA-256 hex của `migration.sql`:

| migration | `checksum` trong sổ | SHA-256 tệp | khớp |
|---|---|---|---|
| `20260703141955_init` | `995b5626…13f2c` | `995b5626…13f2c` | ✅ |
| `20260808000001_catchup_db_push_baseline` | `16455f42…46de9d` | `16455f42…46de9d` | ✅ |
| `20260808000002_them_workflowstate…` | `a0ecc27b…74b1e5` | `a0ecc27b…74b1e5` | ✅ |
| `20260811170725_them_task_context` | `bd23fd49…d64c4fa` | `bd23fd49…d64c4fa` | ✅ |
| `20260811182705_them_project_profile` | `69a80b2f…eae6192` | `69a80b2f…eae6192` | ✅ |

2. **Thí nghiệm chủ động** (§E.0): chạy `migrate resolve --applied 20260821140000_…` trên bản sao,
   Prisma **tự ghi** `checksum = 4ef8f179f51616d0aa3e902c6d38755a458e719a8d1928bf5d26ab8c7c0d74fd`
   — bằng đúng `shasum -a 256` của tệp đó ở §A.1.

⇒ **Thuật toán = SHA-256 trên byte thô của `migration.sql`, hex thường.** Chuỗi `sha256` xuất hiện
21 lần trong `node_modules/prisma/build/index.js` (`grep -o "sha256" | sort | uniq -c`), nhất quán.

**Không có hàng nào lệch checksum ⇒ không có tệp migration nào bị sửa sau khi áp.**

### A.4 · Ai thừa, ai thiếu, ai dở dang

```bash
$ sqlite3 …/work.db "SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NULL OR rolled_back_at IS NOT NULL;"
(rỗng)
```

| Câu hỏi | Trả lời |
|---|---|
| Hàng trong sổ **không có** thư mục? | **KHÔNG CÓ.** Cả 5 hàng đều có thư mục cùng tên. |
| Thư mục **không có** hàng? | **CÓ 1** — `20260821140000_them_project_file_review_state`. |
| `finished_at IS NULL`? | **0 hàng.** |
| `rolled_back_at IS NOT NULL`? | **0 hàng.** |
| `logs` khác rỗng? | **0 hàng.** |

⇒ Sổ **không có hàng hỏng**; nó chỉ **thiếu đúng một hàng**. Bối cảnh đề bài đúng ở điểm này.

---

## B · SQL DIFF TỪNG MIGRATION ↔ DB THẬT

Đối chiếu bằng `sqlite_master` (bảng/index) và `pragma_table_info` (cột · kiểu · NOT NULL · DEFAULT),
chạy trên `work.db`.

```bash
$ sqlite3 …/work.db "SELECT type, COUNT(*) FROM sqlite_master GROUP BY type;"
index|69
table|25          # 24 bảng nghiệp vụ + _prisma_migrations
```

| migration | đối tượng khai | có trong DB | khớp kiểu/ràng buộc |
|---|---|---|---|
| **1 · init** | 7 bảng: `User` `Project` `Flow` `FlowVersion` `CreditTransaction` `ChatMessage` `LibraryAsset` | **CÓ (7/7)** | ⚠️ `User`/`Project`/`Flow`/`LibraryAsset` đã bị **#2 dựng lại** ⇒ hình dạng hiện tại là của #2, không phải của #1. `FlowVersion` `CreditTransaction` `ChatMessage` còn nguyên bản #1. |
| | 2 index: `User_email_key` `Flow_shareToken_key` | **CÓ (2/2)** | khớp |
| **2 · catchup_db_push_baseline** | 10 bảng: `GuModel` `IntegrationAccount` `LarkPersonRef` `LarkTaskRef` `LarkUserMap` `NotebookChunk` `NotebookSource` `ProductSpec` `ProjectMember` `ProjectNotebook` | **CÓ (10/10)** | khớp |
| | RedefineTable ×4 — `Flow` +`coverUrl,status,rev,deletedAt,lastEditedBy,lastEditedDevice` · `LibraryAsset` +`usage,palette,caption,content,w,h,rev,deletedAt,…` · `Project` +`larkProjectCode,currentStage,stageLocked,rev,deletedAt,…` · `User` +`phone,avatar` & `email` → NULL-được | **CÓ, đủ cột** | ✅ `pragma_table_info('User')` → `email:notnull=0`, `phone:notnull=0`, `avatar:notnull=0` — đúng ý #2 (nới `email` từ NOT NULL) |
| | 26 index (`GuModel_userId_kind_key` … `User_phone_key`) | **CÓ (26/26)** | khớp |
| **3 · them_workflowstate_task_externalref** | 3 bảng: `WorkflowState` `Task` `ExternalRef` | **CÓ (3/3)** | khớp |
| | 6 index: `WorkflowState_projectId_idx` `Task_projectId_idx` `Task_statusId_idx` `ExternalRef_entityType_entityId_idx` `ExternalRef_system_idx` `ExternalRef_system_externalId_key` | **CÓ (6/6)** | khớp |
| **4 · them_task_context** | 3 cột `Task`: `entityId` `stage` `workspaceId` | **CÓ (3/3)** | `TEXT`, `notnull=0` — khớp |
| **5 · them_project_profile** | bảng `ProjectProfile` (10 cột) + index `ProjectProfile_projectId_key` | **CÓ** | 10/10 cột: `id,projectId,loaiHinh,dienTichM2,nganSach,mocBanGiao,hienTrang,ghiChu,createdAt,updatedAt` |
| **6 · MỒ CÔI · them_project_file_review_state** | 3 cột `ProjectFile`: `reviewState` `reviewedAt` `reviewedBy` | **CÓ (3/3)** | `reviewState TEXT notnull=1 default='PENDING'` · `reviewedAt DATETIME null` · `reviewedBy TEXT null` — **khớp từng chữ với `migration.sql`** |

### B.6 · Soi kỹ migration mồ côi

```bash
$ sqlite3 …/work.db "SELECT name||' | notnull='||\"notnull\"||' | dflt='||COALESCE(dflt_value,'NULL') FROM pragma_table_info('ProjectFile') WHERE name IN ('reviewState','reviewedAt','reviewedBy');"
reviewState | notnull=1 | dflt='PENDING'
reviewedAt  | notnull=0 | dflt=NULL
reviewedBy  | notnull=0 | dflt=NULL

$ sqlite3 …/work.db "SELECT reviewState, COUNT(*) FROM ProjectFile GROUP BY reviewState;"
PENDING|1982
```

**Tái dựng được chuỗi sự kiện — bằng chứng nằm ở bản sao lưu mà chính `migration.sql` nhắc tên:**

```bash
$ ls -la backups/dev.db.bak-2026-08-21-1400
-rw-r--r--@ 1 tranben staff 38510592 Aug 21 13:13 backups/dev.db.bak-2026-08-21-1400
$ shasum -a 256 backups/dev.db.bak-2026-08-21-1400
d8bebdb0f1afd290e6ece8c13821093d61595c541b6d55d4274a00b60a6b2ad4     # ≠ dev.db hiện tại

$ sqlite3 bak2108.db "SELECT group_concat(name) FROM pragma_table_info('ProjectFile');"
id,projectId,name,mime,path,contentHash,uploadedBy,uploadedAt,updatedAt,rev,deletedAt,lastEditedBy,lastEditedDevice
                                                       # ← CHƯA có 3 cột review
$ sqlite3 bak2108.db "SELECT COUNT(*) FROM ProjectFile;"    → 19
$ sqlite3 bak2108.db "SELECT COUNT(*) FROM _prisma_migrations;" → 5
```

| mốc | trạng thái |
|---|---|
| 21/08 13:13 | sao lưu — **chưa** có 3 cột, `ProjectFile` = **19 hàng**, sổ 5 hàng |
| 21/08 13:22 | viết `migration.sql` (chú thích trong tệp nói đúng: "19 hàng ProjectFile hiện có") |
| ~21/08 14:00 | **3 câu `ALTER TABLE` được chạy THẲNG vào DB** (không qua `migrate deploy`) ⇒ cột có, **sổ không được ghi** |
| 21→26/08 | ứng dụng chạy tiếp, `ProjectFile` tăng **19 → 1982 hàng** |
| 26/08 | thư mục migration mới được `git add` (commit `147f66a`) |

⚠️ **Bối cảnh đề bài SAI một chỗ nhỏ**: chú thích trong `migration.sql` nói "19 hàng ProjectFile
hiện có" — đúng **tại thời điểm 21/08**, nhưng **hôm nay là 1982 hàng**. Ai đọc tệp đó hôm nay để
ước lượng rủi ro sẽ hụt 100 lần.

### B.7 · 🔴 PHÁT HIỆN LỚN HƠN CÂU HỎI — 3 bảng KHÔNG do migration nào tạo

```bash
$ sqlite3 …/work.db "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;"
… AssetRepresentation … ProjectAssetUsage … ProjectFile …
```

Ba bảng **`ProjectFile`** · **`AssetRepresentation`** · **`ProjectAssetUsage`** có trong DB nhưng
**không một migration nào trong 6 thư mục tạo ra chúng**. Chúng vào DB bằng `db push`.
Hệ quả trực tiếp: migration mồ côi `ALTER TABLE "ProjectFile"` **tham chiếu một bảng mà cây
migration không biết** ⇒ cây migration **không replay được** (chứng minh ở §C.3).

Định lượng độ trôi bằng `migrate diff` (bỏ migration mồ côi ra để nó không làm gãy shadow DB):

```bash
$ cp -R prisma/migrations …/migs5 && rm -rf …/migs5/20260821140000_them_project_file_review_state
$ npx prisma migrate diff --from-migrations …/migs5 --to-url "file:…/work.db" \
        --shadow-database-url "file:…/shadow2.db" --script      # → 86 dòng
```
Thiếu so với DB thật:
- `CREATE TABLE "AssetRepresentation"` (11 cột, FK → `LibraryAsset`)
- `CREATE TABLE "ProjectAssetUsage"` (10 cột, FK → `LibraryAsset` + `Project`)
- `CREATE TABLE "ProjectFile"` (16 cột — **đã gồm cả 3 cột review**, FK → `Project`)
- `ALTER TABLE "LibraryAsset" ADD COLUMN "contentHash" TEXT`
- `ALTER TABLE "ProductSpec" ADD COLUMN "matId" TEXT`
- 8 index: `AssetRepresentation_assetId_kind_idx` · `ProjectAssetUsage_projectId_assetId_usage_key`
  · `ProjectAssetUsage_projectId_idx` · `ProjectAssetUsage_assetId_idx` · `ProjectFile_deletedAt_idx`
  · `ProjectFile_projectId_idx` · `LibraryAsset_userId_contentHash_idx` · `ProductSpec_matId_key`

⇒ **Sổ thiếu 1 hàng. Thư mục thiếu 3 bảng + 2 cột + 8 index.** Lỗ thứ hai lớn hơn lỗ thứ nhất.

---

## C · PARITY schema.prisma ↔ DATABASE

```bash
# C1 · DB(bản sao) → schema.prisma
$ npx prisma migrate diff --from-url "file:…/work.db" --to-schema-datamodel prisma/schema.prisma --script
-- This is an empty migration.

# C2 · schema.prisma → DB(bản sao)
$ npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-url "file:…/work.db" --script
-- This is an empty migration.
```

### Rỗng cả hai chiều **CHỨNG MINH**
- `prisma/schema.prisma` và cấu trúc DB thật **trùng khớp hoàn toàn** — không thừa/thiếu bảng, cột,
  index, ràng buộc nào ở mức Prisma nhìn thấy.
- ⇒ Chạy `prisma generate` **sẽ không** gãy. "Mìn hẹn giờ" mà chú thích trong `migration.sql` cảnh
  báo (client mới `SELECT` cột không tồn tại) **đã được gỡ** — vì 3 cột đã thật sự có trong DB.

### Rỗng cả hai chiều **KHÔNG CHỨNG MINH** (dễ đọc nhầm nhất)
1. **Không nói gì về sổ.** `migrate diff --from-url` đọc `sqlite_master`; nó **không đọc**
   `_prisma_migrations`. Sổ thiếu 1 hàng vẫn cho "empty migration".
2. **Không nói thư mục `migrations/` đúng.** Cả hai chiều đều **không** đi qua thư mục migration —
   xem §C.3, nơi thư mục gãy thẳng.
3. **Không nói `migrate deploy` sẽ chạy được.** Ngược lại — §E.0 cho thấy nó **P3018**.
4. **Không nói gì về dữ liệu**, chỉ nói về hình dạng.
5. **Không nói môi trường khác cũng vậy.** Đây là kết luận về **một** tệp SQLite trên máy Hoà.

### C.3 · Chiều thứ ba — chiều duy nhất phát hiện bệnh
```bash
$ npx prisma migrate diff --from-migrations prisma/migrations --to-url "file:…/work.db" \
        --shadow-database-url "file:…/shadow.db" --script
Error: P3006
Migration `20260821140000_them_project_file_review_state` failed to apply cleanly to the shadow database.
Error: SQLite database error
no such table: ProjectFile
```
⇒ **Từ thư mục `migrations/` KHÔNG dựng lại được CSDL này.** `migrate reset` / `migrate dev` /
CI dựng DB mới / máy đồng đội mới clone — **tất cả sẽ gãy tại đây**.

---

## D · SAO LƯU + DIỄN TẬP KHÔI PHỤC (làm thật, không mô tả)

### D.0 · Canh DB thật trong suốt diễn tập
```bash
$ shasum -a 256 /Users/tranben/Downloads/interiorflow/prisma/dev.db     # trước mỗi bước, sau mỗi bước
```
DB thật giữ nguyên nội dung suốt phiên — xác minh ở §D.6.

### D.1–D.5 · Kịch bản đã chạy trên `work.db`

| bước | giờ | lệnh | kết quả thật |
|---|---|---|---|
| **B0** đo nền | 23:58:22.140 | `sqlite3 work.db "SELECT COUNT(*) …"` | `User=21 Project=25 ProjectFile=1982 LibraryAsset=1635 _prisma_migrations=5` |
| | 23:58:22.303 | `shasum -a 256 work.db` | `4edcc5d34a4c…c8492e` |
| **B1** sao lưu | 23:58:22.307→.433 (**0.121s**) | `sqlite3 work.db ".backup 'drill-backup.db'"` | `sha256(drill-backup.db) = e87b303c14204cfa5f797581703619fa8e675b83df358648f4bac72a4a825ecc` |
| | | `sqlite3 drill-backup.db "PRAGMA integrity_check;"` | **`ok`** |
| **B2** cố ý phá | 23:58:22.602→.625 | `DROP TABLE ProjectProfile;`<br>`DELETE FROM _prisma_migrations WHERE migration_name LIKE '2026081%';`<br>`DELETE FROM ProjectFile WHERE rowid % 3 = 0;` | `ProjectFile=1322` (−660) · `_prisma_migrations=3` (−2) · `ProjectProfile_tồn_tại=0`<br>`sha256 = 4e7b178801829c…f2b04f` |
| **B3** khôi phục | 23:58:37.432→.519 (**0.071s**) | `cp -f drill-backup.db work.db` | — |
| **B4** xác minh | 23:58:37.519→.610 | `PRAGMA integrity_check` | **`ok`** |
| | | đếm hàng | `User=21 Project=25 ProjectFile=1982 LibraryAsset=1635 _prisma_migrations=5` — **khớp B0 từng con số** |
| | | `ProjectProfile` phục hồi | `1` (bảng trở lại) |
| | | `shasum -a 256 work.db` | `e87b303c…25ecc` = **bằng đúng sha256 bản sao lưu** ✅ |
| **B5** so schema | 23:58:38.080 | `SELECT type,COUNT(*) FROM sqlite_master GROUP BY type` | `index=69 · table=25` — khớp nền |

**Tổng thời gian sao-lưu + khôi phục + xác minh: < 1 giây** cho tệp 38,5 MB.

### D.6 · Bài học đắt của diễn tập — hash sau `.backup` KHÁC hash nguồn
`sha256(work.db) = 4edcc5d3…` nhưng `sha256(drill-backup.db) = e87b303c…`, dù **nội dung y hệt**
(`.backup` dựng lại từng trang, freelist/page-order khác). ⇒ **Không được nghiệm thu khôi phục bằng
cách so hash với tệp GỐC.** Phải so với **chính tệp sao lưu** + `integrity_check` + đếm hàng. Nếu
dùng `cp` để sao lưu thì hash mới trùng nguồn.

### D.7 · 🔴 Quan sát ngoài kịch bản — DB thật ĐỔI BYTE giữa phiên
```bash
23:55  shasum prisma/dev.db → 4edcc5d34a4c3a210780eec52108abe3f94608f1437608e4546d848394c8492e
23:58  shasum prisma/dev.db → a807f9ce4a182d1af45de05d7fc2d565b3604ebac4087a37990acefdb31a5165
$ stat -f "mtime=%Sm ctime=%Sc size=%z" prisma/dev.db
mtime=2026-08-26 23:58:16  ctime=2026-08-26 23:58:43  size=38510592
```
Không một lệnh nào của phiên này ghi vào tệp đó. Đã kiểm chứng **nội dung không đổi**:
```bash
$ cp -p prisma/dev.db …/snap2.db
$ diff <(sqlite3 snap2.db "SELECT type||' '||name||' '||COALESCE(sql,'') FROM sqlite_master ORDER BY name;") \
       <(sqlite3 work.db  "…")                        → SCHEMA GIỐNG HỆT
$ diff <(sqlite3 snap2.db "SELECT id||'|'||checksum||'|'||migration_name FROM _prisma_migrations …") \
       <(sqlite3 work.db  "…")                        → SỔ GIỐNG HỆT
snap2: tables=25 idx=69 User=21 Project=25 ProjectFile=1982 LibraryAsset=1635 Flow=52 mig=5
work : tables=25 idx=69 User=21 Project=25 ProjectFile=1982 LibraryAsset=1635 Flow=52 mig=5
```
⇒ **Nội dung y nguyên, chỉ byte trang đổi** (header/change-counter — dấu vết của một tiến trình MỞ
tệp ở chế độ ghi). Ứng viên đang chạy:
```bash
$ ps -Ao pid,etime,command | grep -E "prisma"
 1630  15:09:34  node /Users/tranben/Downloads/interiorflow/node_modules/.bin/prisma mcp
 1318  15:09:39  node …/_npx/2778af9cee32ff87/node_modules/.bin/prisma mcp
 5844  14:15:53  node …/_npx/2778af9cee32ff87/node_modules/.bin/prisma mcp
$ lsof -nP -iTCP -sTCP:LISTEN | grep -E "3000|3001|3002|3004"      → (rỗng, không có dev server)
```
**Ba tiến trình `prisma mcp` đang sống với cwd = repo và đọc `DATABASE_URL` từ `.env`.** Chúng có
đường thẳng tới DB thật và **không nằm dưới quyền kiểm soát của phiên này**. Đây là rủi ro #1 ở §F.

**Lặp lại lần thứ hai — không phải ngẫu nhiên.** Đo cuối phiên:
```
00:04:44  shasum prisma/dev.db → a4e300fdccfcb9e0b7087241eb82936667143610a313da8a4dc6666b2d9774e1
```
Ba lần băm, ba giá trị khác nhau (`4edcc5d3…` 23:55 → `a807f9ce…` 23:58 → `a4e300fd…` 00:04),
nội dung **vẫn y nguyên cả ba lần**:
```bash
$ sqlite3 snap3.db "SELECT 'tables='||… ;"
tables=25 idx=69 ProjectFile=1982 mig=5 User=21 LibraryAsset=1635      # khớp snapshot 23:44 và 23:58
$ sqlite3 snap3.db "SELECT migration_name FROM _prisma_migrations ORDER BY started_at;"   # vẫn đúng 5 hàng cũ
```
⇒ **Có thứ gì đó mở `prisma/dev.db` ở chế độ ghi vài phút một lần.** Kết luận forensic của biên
nhận này không bị ảnh hưởng (nội dung bất biến suốt 20 phút đo), nhưng **mọi kế hoạch ghi đều phải
bắt đầu bằng BƯỚC 0 §E.1** — nếu không, bản sao lưu sẽ không còn là ảnh chụp của thứ ta sắp sửa.

---

## E · KẾ HOẠCH LÙI TƯỜNG MINH

### E.0 · Diễn tập đầy đủ đã chạy trên bản sao (không phải mô tả)

**E.0.a — `migrate status` trước khi chữa** (chạy với schema BẢN SAO, datasource ghi cứng đường
bản sao; `stat` DB thật trước/sau đều `23:58:16` ⇒ không chạm):
```bash
$ npx prisma migrate status --schema …/pj/prisma/schema.prisma
6 migrations found in prisma/migrations
Following migration have not yet been applied:
20260821140000_them_project_file_review_state
```
⚠️ **Bối cảnh đề bài / chú thích trong `migration.sql` SAI ở đây**: tệp đó viết *"`prisma migrate
status` vẫn báo up to date"*. **Hôm nay nó KHÔNG báo up to date** — nó báo đúng là chưa áp. Câu đó
đúng ngày 21/08 (khi thư mục chưa tồn tại/chưa vào git); nó **hết đúng từ lúc thư mục có mặt**.

**E.0.b — `migrate deploy` (thứ KHÔNG được chạy) — chạy thử trên bản sao để biết hậu quả:**
```bash
$ npx prisma migrate deploy --schema …/pj/prisma/schema.prisma
Applying migration `20260821140000_them_project_file_review_state`
Error: P3018   A migration failed to apply. New migrations cannot be applied before the error is recovered from.
Database error: duplicate column name: reviewState
```
Sổ sau đó (trên bản sao): hàng thứ 6 được ghi với `finished_at = NULL`, `logs` chứa toàn bộ stack
⇒ **CSDL rơi vào trạng thái "failed migration", mọi `migrate` sau đó bị chặn.** Đây chính là kịch
bản phải tránh trên DB thật.

**E.0.c — `migrate resolve --applied` (thứ NÊN chạy) — diễn tập:**
```bash
$ npx prisma migrate resolve --applied 20260821140000_them_project_file_review_state \
        --schema …/pj/prisma/schema.prisma
Migration 20260821140000_them_project_file_review_state marked as applied.      # 00:00:06 → 00:00:07 (~1s)
```
Sổ sau đó:
```
id=e09f3985-b215-48d7-9303-4440986464d9
checksum=4ef8f179f51616d0aa3e902c6d38755a458e719a8d1928bf5d26ab8c7c0d74fd   # = sha256 tệp ✅
migration_name=20260821140000_them_project_file_review_state
started_at=finished_at=1787763607483   applied_steps_count=0   logs=∅   rolled_back_at=∅
```
```bash
$ npx prisma migrate status …            → "Database schema is up to date!"
$ sqlite3 work.db "SELECT 'ProjectFile='||COUNT(*) FROM ProjectFile;"   → ProjectFile=1982   # 0 hàng đổi
$ sqlite3 work.db "SELECT COUNT(*) FROM sqlite_master WHERE type='table';" → 25              # 0 bảng đổi
```

**E.0.d — lệnh LÙI — diễn tập:**
```bash
$ sqlite3 work.db "DELETE FROM _prisma_migrations WHERE migration_name='20260821140000_them_project_file_review_state';"
$ sqlite3 work.db "SELECT COUNT(*) FROM _prisma_migrations;"   → 5      # trở về đúng nền
$ npx prisma migrate status …   → "Following migration have not yet been applied: 20260821140000_…"
$ sqlite3 work.db "SELECT COUNT(*) FROM ProjectFile;"          → 1982   # dữ liệu không suy suyển
```
⇒ **Lùi được, sạch, trong < 1 giây.**

**E.0.e — chữa sổ KHÔNG chữa được thư mục:**
```bash
# sau khi đã resolve xong, chạy lại C.3:
$ npx prisma migrate diff --from-migrations prisma/migrations --to-url "file:…/work.db" \
        --shadow-database-url "file:…/shadow9.db" --script
Error: P3006 … no such table: ProjectFile
```
**Vẫn gãy y nguyên.** Đây là lý do verdict là `PARTIAL` chứ không phải "cứ chạy resolve đi".

### E.1 · Kịch bản chữa — từng lệnh một

> **Ký hiệu:** 🤖 = máy chạy được · 🙋 = **Hoà phải bấm/quyết**.
> `$IF` = `/Users/tranben/Downloads/interiorflow`

---

#### BƯỚC 0 · 🙋 Dừng mọi tiến trình đang giữ DB
- **Chạy ở đâu:** máy Hoà, ngoài agent.
- **Tiên quyết:** không có gì.
- **Lệnh:** tắt 3 tiến trình `prisma mcp` (§D.7) + mọi `next dev` trỏ vào repo.
- **Xác minh:** `lsof $IF/prisma/dev.db` → rỗng · `ps -Ao command | grep -c "prisma mcp"` → 0
  · `shasum -a 256 $IF/prisma/dev.db` ghi lại, chờ 60 giây, băm lại → **phải bằng nhau**.
- **Lùi:** không cần (chỉ là dừng tiến trình).
- **Vì sao 🙋:** agent không được tự giết tiến trình của Hoà; và nếu bỏ qua bước này, một MCP ghi
  chen vào giữa `resolve` sẽ làm bản sao lưu ở BƯỚC 1 lỗi thời ngay khi vừa tạo.

#### BƯỚC 1 · 🤖 Sao lưu DB thật (chỉ ĐỌC DB, GHI ra tệp mới)
- **Chạy ở đâu:** `$IF`.
- **Tiên quyết:** BƯỚC 0 xanh.
- **Lệnh:**
  ```bash
  sqlite3 "$IF/prisma/dev.db" ".backup '$IF/backups/dev.db.bak-$(date +%Y-%m-%d-%H%M)-pre-ledger-fix'"
  ```
- **Xác minh:**
  ```bash
  sqlite3 <bak> "PRAGMA integrity_check;"                 # phải: ok
  sqlite3 <bak> "SELECT COUNT(*) FROM _prisma_migrations;" # phải: 5
  sqlite3 <bak> "SELECT COUNT(*) FROM ProjectFile;"        # phải: 1982 (hoặc lớn hơn nếu app đã chạy tiếp)
  shasum -a 256 <bak> | tee $IF/backups/<bak>.sha256       # ghi lại để nghiệm thu khôi phục
  ```
- **Lùi:** `rm <bak>` (tệp mới, không đụng gì).

#### BƯỚC 2 · 🙋 QUYẾT ĐỊNH — chữa sổ TRƯỚC hay chữa THƯ MỤC trước?
Đây là chỗ **phải có Hoà**, vì hai đường đi khác hẳn nhau:

| | **Đường A — chỉ chữa sổ** (`migrate resolve`) | **Đường B — chữa gốc** (dựng lại baseline) |
|---|---|---|
| làm gì | thêm 1 hàng vào `_prisma_migrations` | sinh 1 migration baseline mới bao trọn `ProjectFile` + `AssetRepresentation` + `ProjectAssetUsage` + `contentHash` + `matId` + 8 index, rồi `resolve --applied` cả nó lẫn #6 |
| `migrate status` sau đó | ✅ up to date | ✅ up to date |
| `migrate reset` / CI dựng DB mới | ❌ **vẫn gãy P3006** | ✅ chạy được |
| rủi ro | thấp (đã diễn tập, 0 hàng đổi) | trung bình (sinh SQL mới, phải rà tay) |
| hệ quả xấu | **tắt còi báo động mà không sửa xe** | không |

**Khuyến nghị của máy: Đường B.** Đường A chỉ nên dùng như **bước đầu của B**, không phải điểm dừng.
Lý do: §C.3 + §E.0.e — sổ xanh mà cây migration vẫn không replay được thì lần tới ai đó chạy
`migrate reset` (hoặc CI dựng DB sạch) sẽ gãy, và lúc đó **không còn tín hiệu nào cảnh báo trước**.

#### BƯỚC 3 · 🤖 (nếu chọn A hoặc bước đầu của B) Chữa sổ
- **Chạy ở đâu:** `$IF`.
- **Tiên quyết:** BƯỚC 1 xong · BƯỚC 2 Hoà đã chốt · `sqlite3 $IF/prisma/dev.db "SELECT COUNT(*) FROM _prisma_migrations;"` = **5** (nếu ≠ 5 → **DỪNG**, có người khác đã đụng).
- **Lệnh (một lệnh duy nhất):**
  ```bash
  cd "$IF" && npx prisma migrate resolve --applied 20260821140000_them_project_file_review_state
  ```
- **Xác minh sau lệnh:**
  ```bash
  sqlite3 $IF/prisma/dev.db "SELECT COUNT(*) FROM _prisma_migrations;"        # phải: 6
  sqlite3 $IF/prisma/dev.db "SELECT checksum FROM _prisma_migrations WHERE migration_name='20260821140000_them_project_file_review_state';"
  # phải: 4ef8f179f51616d0aa3e902c6d38755a458e719a8d1928bf5d26ab8c7c0d74fd
  sqlite3 $IF/prisma/dev.db "SELECT COUNT(*) FROM ProjectFile;"               # phải KHÔNG đổi
  npx prisma migrate status                                                   # phải: "Database schema is up to date!"
  ```
- **LỆNH LÙI CHÍNH XÁC nếu bước này hỏng:**
  ```bash
  sqlite3 "$IF/prisma/dev.db" "DELETE FROM _prisma_migrations WHERE migration_name='20260821140000_them_project_file_review_state';"
  sqlite3 "$IF/prisma/dev.db" "SELECT COUNT(*) FROM _prisma_migrations;"      # phải trở lại 5
  ```
  Nếu vì lý do nào đó `DELETE` không đủ (ví dụ lỡ chạy nhầm `migrate deploy` → hàng có `logs`):
  ```bash
  cp -f "$IF/backups/dev.db.bak-<mốc>-pre-ledger-fix" "$IF/prisma/dev.db"
  sqlite3 "$IF/prisma/dev.db" "PRAGMA integrity_check;"                       # phải: ok
  shasum -a 256 "$IF/prisma/dev.db"                                           # phải = hash ghi ở BƯỚC 1
  ```

#### BƯỚC 4 · 🤖 (Đường B) Sinh baseline bù cho 3 bảng + 2 cột + 8 index
- **Chạy ở đâu:** `$IF`, **nhưng sinh SQL từ BẢN SAO**, không từ DB thật.
- **Tiên quyết:** BƯỚC 3 xanh.
- **Lệnh:**
  ```bash
  cp -p "$IF/prisma/dev.db" /tmp/base.db
  mkdir -p "$IF/prisma/migrations/20260808000003_baseline_db_push_assets_files"
  npx prisma migrate diff \
      --from-migrations "$IF/prisma/migrations" \
      --to-url "file:/tmp/base.db" \
      --shadow-database-url "file:/tmp/shadow.db" --script > /tmp/baseline.sql
  ```
  ⚠️ Lệnh trên **sẽ gãy P3006** chừng nào #6 còn trong thư mục ⇒ phải tạm chuyển #6 ra ngoài, sinh
  SQL, đặt tên baseline **có thứ tự nhỏ hơn** `20260821140000`, rồi trả #6 về.
- **Xác minh:** `npx prisma migrate diff --from-migrations … --to-url file:/tmp/base.db …` → **empty migration**.
- **LÙI:** `rm -rf "$IF/prisma/migrations/20260808000003_baseline_db_push_assets_files"` — thư mục
  mới, chưa vào sổ, xoá là sạch.
- **🙋 Cần Hoà duyệt** nội dung `baseline.sql` trước khi commit (nó khai lại 3 bảng nghiệp vụ).

#### BƯỚC 5 · 🤖 `resolve --applied` cho baseline mới
```bash
npx prisma migrate resolve --applied 20260808000003_baseline_db_push_assets_files
npx prisma migrate status          # phải: up to date, 7 migrations found
```
**LÙI:** `sqlite3 $IF/prisma/dev.db "DELETE FROM _prisma_migrations WHERE migration_name='20260808000003_baseline_db_push_assets_files';"`

#### BƯỚC 6 · 🤖 NGHIỆM THU CUỐI — thứ chứng minh bệnh đã khỏi
```bash
cp -p "$IF/prisma/dev.db" /tmp/verify.db
npx prisma migrate diff --from-migrations "$IF/prisma/migrations" --to-url "file:/tmp/verify.db" \
    --shadow-database-url "file:/tmp/shadow-verify.db" --script
# BẮT BUỘC: "-- This is an empty migration."   ← KHÔNG được là P3006
npx prisma migrate diff --from-schema-datamodel "$IF/prisma/schema.prisma" --to-url "file:/tmp/verify.db" --script
# BẮT BUỘC: "-- This is an empty migration."
sqlite3 "$IF/prisma/dev.db" "SELECT COUNT(*) FROM ProjectFile;"    # KHÔNG đổi so với BƯỚC 1
```
Chỉ khi **cả ba** dòng trên xanh mới được ghi `PASS`.

### E.2 · Ai bấm gì — tóm tắt
| Bước | 🤖 máy | 🙋 Hoà |
|---|---|---|
| 0 · dừng `prisma mcp` + dev server | | ✅ |
| 1 · sao lưu + băm | ✅ | |
| 2 · chọn Đường A hay B | | ✅ |
| 3 · `migrate resolve` #6 | ✅ | |
| 4 · sinh baseline | ✅ sinh | ✅ duyệt SQL trước khi commit |
| 5 · `resolve` baseline | ✅ | |
| 6 · nghiệm thu 3 lệnh | ✅ | |

---

## F · VERDICT & KẾT LUẬN

### `PARTIAL` — forensic trên bản sao; chưa chạm DB thật

**Bề mặt đã chạm:** bản sao `work.db` (byte-identical với `prisma/dev.db` lúc 23:44) · bản sao
`backups/dev.db.bak-2026-08-21-1400` · 6 tệp `migration.sql` trong repo (chỉ đọc) ·
`prisma/schema.prisma` (chỉ đọc, bản sao dùng cho Prisma CLI) · `git log`.
**Bề mặt CHƯA chạm:** `prisma/dev.db` (ngoài `cp`/`shasum`/`stat`) · runtime ứng dụng · dữ liệu.

### Bảng đối chiếu 6 thư mục ↔ 5 hàng

| # | Thư mục trên đĩa | Hàng trong `_prisma_migrations` | SQL đã thực thi vào DB? | Trạng thái |
|---|---|---|---|---|
| 1 | `20260703141955_init` | ✅ `8dea9710…`, steps=1 | ✅ (sau bị #2 dựng lại 4 bảng) | **KHỚP** |
| 2 | `20260808000001_catchup_db_push_baseline` | ✅ `974c2970…`, **steps=0** | ⚠️ **KHÔNG chạy** — đánh dấu bằng `resolve`; đối tượng đã có sẵn do `db push` trước đó | **KHỚP (dạng baseline)** |
| 3 | `20260808000002_them_workflowstate_task_externalref` | ✅ `94b4dedf…`, **steps=0** | ⚠️ **KHÔNG chạy** — đánh dấu bằng `resolve`; 3 bảng + 6 index đã có | **KHỚP (dạng baseline)** |
| 4 | `20260811170725_them_task_context` | ✅ `7400bc43…`, steps=1 | ✅ | **KHỚP** |
| 5 | `20260811182705_them_project_profile` | ✅ `436cb44d…`, steps=1 | ✅ | **KHỚP** |
| 6 | `20260821140000_them_project_file_review_state` | ❌ **KHÔNG CÓ HÀNG** | ✅ 3 cột **đã có thật** trong DB (chạy tay 21/08) | 🔴 **MỒ CÔI** |
| — | *(không có thư mục)* | — | 🔴 `ProjectFile` · `AssetRepresentation` · `ProjectAssetUsage` · `LibraryAsset.contentHash` · `ProductSpec.matId` · 8 index — **trong DB nhưng KHÔNG migration nào khai** | 🔴 **TRÔI NGƯỢC** |

Checksum: **5/5 khớp SHA-256** · `finished_at IS NULL`: **0** · `rolled_back_at`: **0** · `logs`: **0**.

### Đã đủ bằng chứng để cho phép một lệnh sửa sổ trên DB thật chưa?

**CHƯA — thiếu ba thứ cụ thể:**

1. **Thiếu quyết định của Hoà giữa Đường A và Đường B (§E.2 BƯỚC 2).** Máy có đủ bằng chứng để nói
   *lệnh `migrate resolve` an toàn về kỹ thuật* (diễn tập §E.0.c: 0 hàng dữ liệu đổi, 0 bảng đổi,
   lùi được trong 1 giây). Máy **không** có thẩm quyền quyết định rằng *"chữa sổ rồi dừng"* là đủ —
   trong khi §C.3 chứng minh cây migration vẫn gãy sau đó. Chạy A rồi bỏ đó = **PASS giả**.
2. **Thiếu một DB thật đứng yên.** §D.7: byte của `prisma/dev.db` đổi lúc 23:58:16 **không do phiên
   này**, và 3 tiến trình `prisma mcp` đang sống với đường thẳng tới nó. Sao lưu tạo lúc T sẽ lỗi
   thời ở T+ε. **Không được chạy lệnh ghi khi chưa chốt được cửa.**
3. **Thiếu nội dung SQL baseline đã được duyệt** (§E.2 BƯỚC 4) — thứ thực sự chữa bệnh. Nó chưa
   được sinh (cố sinh sẽ gãy P3006 chừng nào #6 còn nằm trong thư mục), nên chưa ai đọc được.

Khi **cả ba** đủ, verdict bước tiếp theo có thể lên `PASS` — nhưng chỉ sau khi BƯỚC 6 (§E.1) cho
**empty migration ở CẢ chiều `--from-migrations`**, không phải chỉ chiều `--from-schema-datamodel`.

### Chỗ bối cảnh đề bài / tài liệu SAI
| Điều đã được nói | Sự thật đo được |
|---|---|
| *"`migrate status` vẫn báo up to date"* (chú thích trong `migration.sql`) | **SAI hôm nay** — §E.0.a: nó báo `20260821140000_… has not yet been applied` |
| *"19 hàng ProjectFile hiện có"* (cùng chú thích) | **hết hạn** — hôm nay **1982 hàng** (§B.6) |
| *"`migrate diff` cho empty ⇒ mọi thứ ổn"* | **chỉ đúng 2/3 chiều** — chiều `--from-migrations` gãy **P3006** (§C.3) |
| *"vấn đề là 6 thư mục ↔ 5 hàng"* | **chưa đủ** — lỗ lớn hơn là **3 bảng + 2 cột + 8 index không thư mục nào khai** (§B.7) |

---

## BA RỦI RO

**RR-1 · `prisma mcp` (3 tiến trình) có đường ghi thẳng vào `prisma/dev.db` — mọi sao lưu đều có thể lỗi thời ngay khi tạo.**
Bằng chứng: §D.7 — hash DB thật đổi lúc 23:58:16 mà không lệnh nào của phiên này ghi vào đó; `ps` liệt kê pid 1630 · 1318 · 5844 chạy `prisma mcp` với cwd = repo, đọc `DATABASE_URL` từ `.env`. Các MCP này có tool `migrate-dev`, `migrate-reset`, `Prisma-Studio` — tức có thể **`migrate reset` DB thật**, và `reset` sẽ **gãy giữa chừng** tại migration #6 (P3006), để lại CSDL dở dang. *Giảm thiểu:* BƯỚC 0 — tắt hết trước khi ghi; sau khi chữa xong, cân nhắc gỡ `plugin:prisma:Prisma-Local` khỏi cấu hình MCP hoặc trỏ nó vào DB nháp.

**RR-2 · `migrate reset` / CI / máy mới clone sẽ gãy — và chữa sổ KHÔNG cứu được.**
Bằng chứng: §C.3 và §E.0.e — `migrate diff --from-migrations` trả `P3006 … no such table: ProjectFile`, **trước và sau** khi `resolve`. Thư mục `migrations/` thiếu 3 bảng + 2 cột + 8 index (§B.7, 86 dòng SQL). Hôm nay chưa cháy chỉ vì mọi người dùng chung **một** tệp `dev.db` truyền tay. Ngày đầu tiên có đồng đội thứ hai / CI / môi trường staging là ngày nó nổ. *Giảm thiểu:* Đường B (§E.2 BƯỚC 4–6), nghiệm thu bằng chiều `--from-migrations`.

**RR-3 · Ai đó chạy `prisma migrate deploy` (hoặc `migrate dev`) trước khi sổ được chữa → CSDL rơi vào "failed migration", chặn mọi migrate về sau.**
Bằng chứng: §E.0.b — chạy thật trên bản sao: `Error: P3018 … duplicate column name: reviewState`, và sổ bị ghi hàng thứ 6 với `finished_at = NULL` + `logs` đầy stack. Đây là lệnh **rất dễ gõ nhầm** vì nó là lệnh "đúng" trong mọi hoàn cảnh bình thường, và `migrate status` đang **chủ động mời gọi** nó (`To apply migrations in production run prisma migrate deploy.`). *Giảm thiểu:* chữa sổ bằng `resolve --applied` (KHÔNG `deploy`) ngay khi Hoà chốt; trong lúc chờ, dán cảnh báo vào `docs/control/IF-CURRENT-STATE.md`.

---

## PHỤ LỤC · Dọn dẹp
Thư mục đo đạc `/private/tmp/claude-501/…/scratchpad/mig-forensic/` chứa: `work.db` · `snap2.db` ·
`bak2108.db` · `drill-backup.db` · `pre-resolve.db` · `shadow*.db` · `migs5/` · `pj/`.
**Toàn bộ nằm ngoài repo, xoá được tự do.** Không tệp nào trong repo bị ghi ngoài chính biên nhận này.
