# M-NEN-DL-OUT — p12 · NỀN DỮ LIỆU (08/08)

Sở hữu: `prisma/` · `lib/server/` · `lib/workspace.ts` · `scripts/`. Không đụng `components/` ·
`lib/three/` · `lib/review/` · `lib/cad/` (diff cuối phiên xác nhận — xem mục Tệp). **V6 — CHƯA
COMMIT.** Một ngoại lệ phạm vi tự khai: `app/api/flows/route.ts` (VIỆC 2 ①) — không nằm trong 4
vùng sở hữu NHƯNG là cuống họng DUY NHẤT mọi client tạo Flow đi qua; sửa ở đó là cách duy nhất
bịt đường mồ côi mà không chạm `components/` (vùng cấm). Route này thuộc p12 ở phiếu sáng cùng
ngày, không phiếu song song nào (`p3c`·`p14`·`p2`·`p3`) sở hữu nó.

⚠️ Ghi chú công cụ đo: lệnh đo trong phiếu dùng `node:sqlite` — máy này Node **v20.18.1**, module
đó chỉ có từ Node 22 ⇒ đo bằng `sqlite3` CLI, CÙNG câu SQL, cùng bộ lọc (`sqlite_%`/`_prisma%`).

---

## VIỆC 1 — Ba bảng khai mà không tồn tại ✅ (KHÔNG reset, dữ liệu nguyên vẹn)

### TRƯỚC / SAU (đo bằng máy)
| Phép đo | TRƯỚC | SAU |
|---|---|---|
| Bảng DB / model schema | **17 / 20** — THIẾU `ExternalRef · Task · WorkflowState` | **20 / 20 — THIEU: (rỗng)** ✅ đúng nghiệm thu |
| Project · User · LibraryAsset · Flow · FlowVersion | 9 · 10 · 1516 · 46 · 14 | **9 · 10 · 1516 · 46 · 14** (không mất 1 dòng) |
| `npx prisma migrate status` | 1 migration, "up to date" (nhưng drift ẩn) | **3 migrations, "Database schema is up to date!"** — sạch THẬT |

### Vì sao KHÔNG dùng `prisma migrate dev` như phiếu gợi ①②
Đo drift trước khi làm (`migrate diff --from-migrations → --to-url dev.db`): DB đã tiến hoá bằng
`db push` nhiều tháng — **10 bảng + 4 bảng redefine nằm ngoài migration history** (chỉ có mỗi
`init`). `migrate dev` gặp drift cỡ này **chắc chắn đòi RESET** = mất 1.516 tài sản thư viện ⇒ đi
thẳng đường phiếu ③ ưu tiên (`migrate diff` + `migrate resolve`), không cần dừng chờ vì phiếu đã
cho sẵn lối này:
1. **Backup**: `prisma/dev.db.bak-p12-nendl-2026-08-08` (21.1MB, `.backup` chuẩn sqlite3).
2. `20260808000001_catchup_db_push_baseline` — SQL sinh bằng `migrate diff` (migrations cũ → DB
   thật), **KHÔNG BAO GIỜ CHẠY**, chỉ `migrate resolve --applied` làm mốc lịch sử (DB vốn đã ở
   trạng thái đó). Từ nay `migrate dev` tương lai hết kêu drift/reset.
3. `20260808000002_them_workflowstate_task_externalref` — SQL sinh bằng `migrate diff` (DB thật →
   schema), **thuần additive** (3 CREATE TABLE + 6 index; 3 hit "DROP/DELETE" khi grep chỉ là mệnh
   đề `ON DELETE CASCADE` trong khai FK, không phải lệnh xoá). Áp bằng `prisma db execute` (SQL do
   công cụ sinh, không gõ tay) rồi `migrate resolve --applied`.
4. **Thử trọn trên BẢN SAO trước** (scratchpad `nendl/dev.copy.db`): 20/20 bảng · 5 bảng dữ liệu
   quý khớp 100% · migrate status sạch — RỒI mới áp DB thật, và **đo lại ngay sau khi chạy** (bảng
   TRƯỚC/SAU ở trên — bài học 08/08).

### ④ Hai test chạy được + 1 lỗ hổng thật bắt được khi viết test
- `lib/server/tasks.ts:22` — `TASK_TABLES_READY` **đã bật `true`** (bảng có thật rồi).
- `lib/server/tasks.test.ts` — **VIẾT LẠI** thành integration test Prisma thật (khuôn
  `credits.test.ts`): tạo user+project tạm → gieo 4 trạng thái mặc định → tạo việc → đổi trạng
  thái → đọc lại → xoá → tự dọn (đo sau khi chạy: 0 dòng test sót trong DB). **7/7 pass.**
- `lib/server/credits.test.ts` — 14/14 pass (không sửa gì, chạy xác nhận).
- 🔍 **Lỗ thật bắt được nhờ test**: docblock `tasks.ts` khai *"statusId sai project là lỗi"* nhưng
  `createTask`/`updateTask` KHÔNG hề kiểm — truyền statusId của project khác vẫn ghi êm. Đã vá:
  `assertStatusBelongsToProject()` (`lib/server/tasks.ts`, gọi ở cả 2 cửa), có ca test riêng.

## VIỆC 2 — 45/46 flow mồ côi

### Đo lại + giải thích lệch 43 vs 45
| Thước | Số |
|---|---|
| `Flow` toàn bộ | **46** |
| mồ côi (`projectId is null`, ĐẾM CẢ xoá mềm — đúng lệnh phiếu) | **45** |
| mồ côi CHƯA xoá mềm (`and deletedAt is null`) | **42** |

Lệch vì **hai thước khác bộ lọc**: lệnh phiếu không lọc `deletedAt` (ra 45/46);
`scripts/soi-app.py` 43/43 gần với thước lọc-xoá-mềm đo ở thời điểm cũ hơn (Flow tăng thêm 2
"Untitled flow" mới sinh 08/08 — xem 2 dòng đầu bảng top-8, `createdAt` 1786110141386/1786109822899).
**Từ đây dùng thước của phiếu (45/46, không lọc) làm chuẩn.**

### Ba câu a·b·c (mỗi câu kèm file:dòng)
**a) Đường tạo Flow không truyền projectId** — server chỉ có ĐÚNG 1 chỗ
`prisma.flow.create`: `app/api/flows/route.ts:101`, nhận `body.projectId ?? null`
(`route.ts:88`) và ghi thẳng null. Client không truyền gồm: `components/FlowsPanel.tsx:85` ·
`components/ProjectSelect.tsx:616` (nhánh không liên kết Lark) · `components/entry/WelcomeIntro.tsx:51`.
Riêng `lib/workspace.ts:158` (`bootstrapWorkspace`) đã được vá 07/08 (tạo Project bọc trước).

**b) `projectId` optional — CỐ Ý, nhưng cố ý cho ca KHÁC**: `prisma/schema.prisma` model `Flow`
khai `projectId String?` + quan hệ `project Project? ... onDelete: SetNull` — SetNull là lựa chọn
chủ đích để *xoá Project không kéo chết Flow* (mồ côi HẬU KỲ hợp lệ). Cái KHÔNG cố ý là mồ côi
TIỀN KỲ: không dòng chú thích nào trong model nói "flow sinh ra được phép không có chủ", và toàn
bộ luồng UI gọi nơi tạo flow đều tự nhận là "tạo dự án" (`WelcomeIntro.tsx:30` comment). ⇒ optional
GIỮ (vì SetNull cần nó) — nhưng đường TẠO phải luôn có chủ.

**c) Mở dự án thấy flow bằng truy vấn** `app/api/projects/[id]/overview/route.ts:44-45`:
`prisma.flow.findMany({ where: { projectId: id, deletedAt: null } })` — **lọc chặt theo
projectId** ⇒ flow mồ côi vĩnh viễn vô hình ở màn dự án. Trong khi `GET /api/flows`
(`app/api/flows/route.ts:15`) lọc theo `userId` nên gallery vẫn thấy — hai màn nhìn hai kiểu,
đúng cơ chế sinh ra cảm giác "app tự mở flow không thuộc dự án nào" (G-M14-01).

### ① Bịt đường tạo mồ côi ✅
- `lib/server/draft-project.ts` (MỚI) — `ensureDraftProject(userId)`: get-or-create dự án
  **"Nháp"** mỗi user (kèm ProjectMember owner, đúng khuôn POST type:'project').
- `app/api/flows/route.ts` — POST không truyền `projectId` ⇒
  `newProjectId ?? (await ensureDraftProject(user.id))`. **Không còn lối API nào tạo được Flow
  không chủ.** Client cũ (3 chỗ components chưa sửa được — vùng cấm) tự động hết đẻ mồ côi vì đi
  qua cùng cuống họng.
- **Test kèm** (`lib/server/draft-project.test.ts`, 7/7): integration (get-or-create idempotent,
  có owner member, tự dọn) + cấu trúc (route PHẢI qua `ensureDraftProject`, pattern cũ
  `projectId: newProjectId` bị CẤM — kèm đối chứng snippet cũ bị bắt).

### ② Dữ liệu cũ — script chạy khô, CHỜ HOÀ DUYỆT (KS3/KS4)
`scripts/gan-flow-mo-coi.mjs` (MỚI) — mặc định **chạy khô**, `--that` mới ghi (tự backup trước,
tự ĐO LẠI SAU, sai đích in THẤT BẠI + exit 1 — đúng bài học 08/08). Bằng chứng R1 (tên trùng) →
R2 (user chỉ có 1 dự án thật) → R3 (±3 ngày) → R0 "Chưa phân loại"; flow đã xoá mềm không suy
đoán, thẳng "Chưa phân loại".

**Kết quả chạy khô 08/08** (bảng đầy đủ in ở terminal, tóm tắt):
`45 flow — 19 có bằng chứng (toàn R2) · 26 về "Chưa phân loại"`.
⚠️ **Điểm Hoà cần nhìn kỹ trước khi duyệt**: cả 19 ca R2 đều trỏ về **"Test B3 (phục hồi
backup)"** — dự án DUY NHẤT của user đó nhưng bản thân nó cũng là rác test. Nếu Hoà thấy gán vào
đó vô nghĩa thì phương án sạch hơn: Hoà xoá mềm dự án Test B3 trước, chạy khô lại — 19 ca đó sẽ
tự rơi về "Chưa phân loại" (R0). Script không tự quyết việc này.
**CHƯA chạy `--that`** — mồ côi vẫn 45/45 (TRƯỚC = SAU, đúng thiết kế chờ duyệt).

### Nghiệm thu VIỆC 2 — trạng thái
- Đường tạo mới không đẻ thêm mồ côi: ✅ (route vá + test 7/7 khoá cấu trúc).
- Mồ côi cũ = 0: ⏳ chờ Hoà duyệt bảng khô → chạy `node scripts/gan-flow-mo-coi.mjs --that`.

## VIỆC 3 — binaryTargets ✅ (kèm số MB cho TỔNG quyết)

§0ab: phiếu ghi "hiện chỉ có native" — **sổ cũ**, thực tế đã là `["native", "windows"]`
(`prisma/schema.prisma:7`, có sẵn cho bản .exe). Đã thêm 2 target Linux:
`["native", "windows", "linux-arm64-openssl-3.0.x", "linux-musl-arm64-openssl-3.0.x"]` + chạy
`npx prisma generate` thành công.

**Số MB tăng (đo `node_modules/.prisma/client`):** 43.4MB → **74.5MB (+30.3MB)** — 2 engine mới
`libquery_engine-linux-arm64…so.node` 14.9MB + `…musl…` 15.0MB. Electron builder đang đóng
`node_modules/**/*` với `asar:false` (`package.json > build.files`) ⇒ **gói .dmg/.exe sẽ phình
~30MB** nếu giữ nguyên. KHÔNG tự bỏ — 2 lựa chọn cho TỔNG: (a) chấp nhận +30MB; (b) thêm exclude
`libquery_engine-linux-*` vào `build.files` của electron-builder (desktop không bao giờ chạy
engine Linux) — 1 dòng config, phiên nào sở hữu `package.json` làm.

## Cửa kiểm cuối (đủ 3, đo sau TẤT CẢ sửa đổi)
```
npx tsc --noEmit -p .        → exit 0, 0 lỗi
node scripts/check-chot.mjs  → 9 luật · 🔴 0 vi phạm chặn · 🟡 0 cảnh báo
npm test                     → exit 0, không lỗi mới (dòng "FAIL" duy nhất trong log là NHÃN
                               của test khác đang khẳng định hành vi đúng, không phải lỗi)
```

## Tệp đã tạo / đã sửa
**Mới:** `prisma/migrations/20260808000001_catchup_db_push_baseline/migration.sql` ·
`prisma/migrations/20260808000002_them_workflowstate_task_externalref/migration.sql` ·
`lib/server/draft-project.ts` · `lib/server/draft-project.test.ts` · `scripts/gan-flow-mo-coi.mjs` ·
`prisma/dev.db.bak-p12-nendl-2026-08-08` (backup, Hoà xoá khi yên tâm) · file này.
**Sửa:** `prisma/schema.prisma` (binaryTargets) · `lib/server/tasks.ts` (bật cờ + vá
statusId-sai-project) · `lib/server/tasks.test.ts` (viết lại thành integration) ·
`app/api/flows/route.ts` (fallback Nháp — ngoại lệ phạm vi tự khai ở đầu file).
**DB thật đã đổi:** +3 bảng rỗng (Task/WorkflowState/ExternalRef) + 2 dòng `_prisma_migrations`.
0 dòng dữ liệu cũ bị đụng. Hoàn tác toàn phần: `cp prisma/dev.db.bak-p12-nendl-2026-08-08 prisma/dev.db`
+ xoá 2 thư mục migration mới.

## CHƯA VERIFY (N5)
- `--that` của `gan-flow-mo-coi.mjs` — CỐ Ý chưa chạy, chờ Hoà duyệt bảng khô (KS3).
- 2 engine Linux mới — chưa chạy thật trên máy Linux nào (máy này darwin; lỗi gốc chỉ tái hiện
  được trong hộp cát Linux). Generate thành công + file engine nằm đúng chỗ là bằng chứng gián
  tiếp duy nhất đo được từ đây.
- Cờ `EXTERNAL_REF_TABLE_READY` (`lib/integrations/external-ref.ts:47`) — bảng ExternalRef nay ĐÃ
  có nhưng **`lib/integrations/` KHÔNG thuộc sở hữu phiếu này** ⇒ chưa bật, chưa chạy 2 script
  backfill Lark (điều kiện chạy chúng đã đủ — xem `docs/M-DATA-OUT.md` 07/08). Cần 1 phiếu mở
  quyền `lib/integrations/` bật cờ + chạy 2 script.

---
Tệp OUT: `docs/M-NEN-DL-OUT.md` · dán vào phiên `p12`
