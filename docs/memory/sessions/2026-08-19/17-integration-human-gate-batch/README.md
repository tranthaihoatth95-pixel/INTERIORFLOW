# 17 · Integration + Human Gate Batch — 19/08 khuya muộn

## ⓪ Reality
main `c7f3ac8` (0 commit nhận) · backup `10e34ee`→(sau checkpoint này) local=remote, 26 commit
ahead · dirty 145 (toàn bộ có chủ, không file lạ) · 5 peer session, không ai ACTIVE-WRITING trong
40 phút gần nhất (mtime check) · server 3001 sống, không đẻ mới · DB thật: drift 1 cột (`matId`)
đúng như runbook đã ghi, không đổi thêm.

## Pre-integration verify (GỘP, không tin checkpoint lẻ)
- `npx tsc --noEmit` → **0 lỗi**
- `npm test` (tsc+license+chot+toàn bộ *.test.ts) → **exit 0, 0 fail thật** (8 "fail" chỉ là tên ca test)
- `npm run soi:frontier` → **0 LỆCH**
- `npm run soi:cam-dien` → khớp baseline đã biết (2 kho chưa mở = idfc-import family, không bất ngờ)

## Golden Loop Browser E2E (server 3001, live)
| Checkpoint | Kết quả |
|---|---|
| Home → Resume | **LIVE, verified** — widget "VIỆC ĐANG DỞ" hiện, bấm "Mở lại" → nhảy thẳng `/projects/<id>/present` (route SCOPE thật, KHÔNG qua `/present-editor`→LegacyStageRedirect→choose-project). Console sạch. |
| → Present | LIVE — trang tải đúng, ReviewPanel mount bên phải ("BẢNG KIỂM — chưa kiểm", đúng R7) |
| → 2D | LIVE — CAD editor tải, layer panel, toolbar Sơ phác/Chuyên, LibrarySheet mở được (Cấu kiện/Vật liệu/Ảnh tham chiếu đủ kệ) |
| → Library drop (specId/geom2d, R1/R8) | **KHÔNG EXERCISE ĐƯỢC round này** — double-click không kích hoạt drop ở mode hiện tại (cần drag thật); đã có bằng chứng từ phiên W1 verify trước (double-click hoạt động, entity đúng geom2d) — không lặp lại vì risk thao tác giả |
| → 3D | LIVE — scene viewer tải, Tool3DBar (R4/R4-L1) hiện đúng khuôn capsule |
| → GOTO-3D (review→3D) | **KHÔNG EXERCISE ĐƯỢC** — dự án test rỗng, không có violation để bấm; code-verified (worker test 10+27+61 pass) nhưng CHƯA có bằng chứng browser sống |
| Reference/Image pick | không thử round này (đã có bằng chứng riêng từ CONNECT-1 worker test + tsc) |
| Task/context/goto-source | không thử — cần dữ liệu Task thật |
| Undo/reload/resume lại | Resume-lại đã thử (checkpoint đầu) — LIVE |

**Kết luận E2E**: khung xương (Home→2D→3D→Present, resume) chạy trọn, console sạch mọi bước.
2 checkpoint (Library-drop thao tác thật, GOTO-3D thao tác thật) cần dữ liệu populated hơn — để
lại cho lô duyệt mắt của Hoà thay vì tự dựng dữ liệu giả tốn thời gian.

## ⚠️ CẬP NHẬT 19/08 khuya muộn — H6 nay gồm 2 slice schema, PUSH MỘT LẦN

Sau khi Hoà chốt contract Reference/Asset, đã thêm **Q5-SCHEMA** (`ProjectFile` +
`ProjectAssetUsage`, text-only, checkpoint `f0696a9`) — CÙNG nằm trong diff `prisma/schema.prisma`
chưa push với `matId` (Slice 1A). `npx prisma db push` chạy MỘT LẦN sẽ áp cả 2 slice cùng lúc
(Prisma diff toàn bộ schema so DB, không phân biệt "slice nào"). Không cần Hoà chạy 2 lượt.
Chi tiết migration-plan riêng cho Q5-SCHEMA (rollback nếu muốn tách): `docs/memory/sessions/
2026-08-19/18-q5-schema-migration-plan/README.md`.

**Sau khi Hoà push xong**, MAIN mở tiếp packet Promote-transaction + `ProjectAssetUsage` API +
Reference UI attach/reuse + browser Golden Journey (asset X dùng Project A → reuse Project B →
usage khác nhau → reopen giữ → where-used thấy cả A/B) — đúng thứ tự Hoà đã chốt, không hỏi lại.

## H6 — DB RUNBOOK, phân loại

| Bước | Ai chạy |
|---|---|
| 1 Backup · 2 db push · 3 generate · 5 backfill --apply | **HOÀ MUST RUN LOCALLY** (luật CLAUDE.md cấm generate/db push trong sandbox) |
| 4 Flip cờ (`EXTERNAL_REF_TABLE_READY`) · 6 Verify | MAIN làm SAU khi Hoà báo xong (không tin lời, tự verify PRAGMA) |

### BLOCK COPY-PASTE CHO HOÀ (đúng khuôn: backup → command → verify → rollback)

```bash
# 1. BACKUP
cd /Users/tranben/Downloads/interiorflow/prisma && sqlite3 dev.db ".backup 'dev.db.bak-2026-08-19-wave0'"
sqlite3 dev.db.bak-2026-08-19-wave0 "PRAGMA integrity_check;"
sqlite3 dev.db "SELECT count(*) FROM ProductSpec; SELECT count(*) FROM Task;" && sqlite3 dev.db.bak-2026-08-19-wave0 "SELECT count(*) FROM ProductSpec; SELECT count(*) FROM Task;"

# 2. DB PUSH (chỉ chạy khi KHÔNG phiên/dev-server nào khác đang mở — lsof -iTCP -sTCP:LISTEN | grep node)
cd /Users/tranben/Downloads/interiorflow && npx prisma db push

# 3. GENERATE (chỉ sau khi bước 2 báo "in sync")
npx prisma generate

# 4. BACKFILL — dry-run trước, đọc report, generated=2 mới --apply
node_modules/.bin/sucrase-node scripts/backfill-material-matid.ts
node_modules/.bin/sucrase-node scripts/backfill-material-matid.ts --apply

# VERIFY
sqlite3 prisma/dev.db "SELECT count(*) FROM ProductSpec WHERE matId IS NOT NULL;"
npm test
```

**ROLLBACK** (nếu bước 2 cảnh báo mất dữ liệu → DỪNG, đừng gõ y):
```bash
cd /Users/tranben/Downloads/interiorflow/prisma && sqlite3 dev.db ".restore 'dev.db.bak-2026-08-19-wave0'"
```

Sau khi Hoà báo xong → nhắn lại, MAIN tự verify + flip cờ bước 4.

## H7 — INTEGRATION PLAN (chờ Hoà bấm hoặc cấp quyền)

26 commit là CHUỖI TUYẾN TÍNH SẠCH trên `backup/2026-08-19-batch0a` (đã verify từng bước lúc
checkpoint — không có commit chen ngang phá dependency). An toàn để integrate NGUYÊN CHUỖI.

**Lệnh cho Hoà** (không force, không rewrite history):
```bash
cd /Users/tranben/Downloads/interiorflow
git status                                    # xác nhận working tree Hoà đang đứng đâu
git log --oneline main..backup/2026-08-19-batch0a   # soát lại 26 commit trước khi nhận
git merge --ff-only backup/2026-08-19-batch0a       # fast-forward THUẦN — main tiến thẳng, không tạo merge commit
git push origin main                                # chỉ khi Hoà đồng ý đẩy remote
```
Nếu `--ff-only` báo lỗi (nghĩa là `main` đã có commit khác từ lúc backup tách ra) → DỪNG, báo MAIN,
đừng tự ý `git merge` thường (tạo merge commit) hay `rebase`.

## PACKET LEDGER (đầy đủ, 26 commit)

| Packet | Commit | Machine | Browser |
|---|---|---|---|
| R1 specId drop | `bcb13c5` | ✅ | ✅ (W1) |
| R3 glyph/tooltip | `f25716e` | ✅ | ✅ |
| R4 + R4-L1 | `a1a8533`+`0be972e` | ✅ | ✅ (W1) |
| R5 LightBar+ResumeWork | `073881e` | ✅ | ✅ (W1, + round này: ResumeWork LIVE) |
| R6 một-cửa-upload | `bf14485` | ✅ | ✅ (W2, 5 kịch bản) |
| R7 reviewDeck | `355459d` | ✅ | ✅ (round này: mount xác nhận) |
| R8 geom2d reader | `388a893` | ✅ | ✅ (W1) |
| R9a nhãn+lux | `3ba7b9e` | ✅ | pending (text-only) |
| R9b | HUỶ đúng | — | — |
| CONTINUITY-1 | (trong `10e34ee` chain, xem `06739c5` gốc) | ✅ | ✅ **round này verify sống** |
| CONNECT-1 | `dee7ee8` | ✅ | pending |
| H9 spec | `daf3073` | — | — (audit, không code) |
| H11 rev-enforcement | `a2e1747` | ✅ 10 test DB thật | pending (kịch bản 2-tab) |
| GOTO-3D | `42ab5c2` | ✅ | pending (cần data) |
| Guardian fix | `daf3073` | — | — |

## WAVE DEPENDENCY GRAPH (candidate, KHÔNG tự build)

```
[Hoà: H6 runbook] ──► Slice 1A-2B (matId cắm 2D/3D/BOQ)
[Hoà: H7 integrate] ──► baseline sạch cho mọi wave sau
[Hoà: H9-A resolve-rule + H9-B tên] ──► W1 Workspace/Canvas additive
                                    ──► W4 Project↔Asset N-N (sau W2/W3)
[Hoà: chờ Q5 code] ──► W2 ProjectFile raw-source ──► W3 Promote→LibraryAsset ──► W4
W5 rev-enforcement 3 model còn lại: độc lập, không chờ ai
W6 Reference where-used/provenance: sau W4
W7 image→3D reconnect: chờ Hoà quyết #11 (idfc-import sống/chết)
W8-W12: xa hơn, chưa đủ evidence ưu tiên
```

## HẠN DÙNG
Hết hạn khi: Hoà chạy H6, Hoà bấm/cấp quyền H7, hoặc bất kỳ Wave nào mở phiếu thật.

## ⚠️ CẬP NHẬT 20/08 — điều tra warning Prisma "unique constraint [matId]" tại H6

Hoà dừng đúng lúc thấy cảnh báo, KHÔNG push. Điều tra migration-gate hẹp (không đụng DB):

**Kết luận: warning là boilerplate chuẩn của Prisma cho MỌI `@unique` mới — không phải phát hiện
trùng lặp thật.** Bằng chứng:
- `ProductSpec` 10 hàng thật (furniture=7 · lighting=1 · material=2), cột `matId` **chưa tồn tại**
  trong `dev.db` — chưa backfill. Sau push, cả 10 hàng có `matId=NULL`.
- Thực nghiệm SQLite 3.51.0 (đúng bản dev.db) trên DB TẠM riêng: 3 hàng cùng `matId=NULL` chèn
  được dưới UNIQUE index, 0 lỗi — NULL ≠ NULL trong UNIQUE index, hành vi SQL chuẩn.
- ⇒ Không thể có duplicate vì chưa có giá trị non-NULL nào. UNIQUE **đúng theo contract**
  (matId = IF-owned identity, buộc phải unique) — schema KHÔNG khai nhầm.
- `ProjectFile`/`ProjectAssetUsage`: đọc lại toàn văn schema — 2 bảng mới hoàn toàn, cascade chỉ
  ảnh hưởng hành vi delete tương lai, không đụng dữ liệu `Project`/`LibraryAsset` hiện có.

**Lệnh READ-ONLY để Hoà tự xác nhận trước khi push (không mutate)**:
```bash
sqlite3 prisma/dev.db "PRAGMA table_info(ProductSpec);" | grep matId
# Mong đợi: KHÔNG in gì (cột chưa có — khớp điều tra trên)
sqlite3 prisma/dev.db "SELECT kind, count(*) FROM ProductSpec GROUP BY kind;"
# Mong đợi: furniture 7 · lighting 1 · material 2 (khớp số đã đo)
```

**Nếu 2 lệnh trên khớp đúng số** → warning là bình thường, an toàn tiếp tục `npx prisma db push`
và gõ `y` khi được hỏi xác nhận. Không cần thao tác gì khác ngoài chạy lại đúng runbook H6 gốc.
