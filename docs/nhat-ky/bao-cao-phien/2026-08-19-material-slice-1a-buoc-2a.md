# Báo cáo — Material Slice 1A, Bước 2A (19/08)

Phiên phụ, thi công theo phiếu điều phối "BƯỚC 2A của phiếu Material Slice 1A". Bước 1 (đã xong
trước phiên này): `lib/materials/matid-identity.ts` + `matid-identity.test.ts`, registry
`material-matid-uuid` cập nhật.

## ⓪ TIỀN ĐỀ

- **⓪a** — Bước 1 đã tạo `lib/materials/matid-identity.ts` với `isMatIdUuid` / `normalizeMatIdCanonical`
  (UUID, lowercase) / `normalizeSkuBusinessKey` (sku, upper+trim) / `resolveInputMatId` /
  `generateMatId`. **XÁC NHẬN — đọc file, 116 dòng, 32 test pass trước khi bắt đầu.**
- **⓪b (hạ tầng)** — `git log --oneline -1` = `3da4b8c` (main HEAD) · `git rev-list --count HEAD..main`
  = `0`. **XÁC NHẬN — không lệch mốc, tiếp tục.**
- **⓪c (cardinality — cửa chính)**:
  - `ProductSpec` là material khi `kind === 'material'` — trường phân loại có thật:
    `prisma/schema.prisma:395` `kind String // 'furniture' | 'material' | 'lighting' | 'millwork' | 'fixture'`,
    ràng buộc giá trị ở `lib/server/specs.ts:6` `SPEC_KINDS`.
  - Quan hệ 1 material ↔ 1 ProductSpec hay N↔1: **1↔1, KHÔNG có bằng chứng N↔1**. Đã grep toàn
    repo (`ProductSpec` 123 chỗ, `kind === 'material'`/`kind:'material'` ~15 chỗ) — không nơi nào
    biểu diễn "một material gồm nhiều ProductSpec". Quyết định gốc đã ghi sẵn trong registry
    (`scripts/frontier-registry.mjs:312`, nguyên văn Hoà 19/08): *"quan hệ matId UUID ↔
    ProductSpec.matId (KHÔNG tạo model mapping riêng cho tới khi audit chứng minh 1 material cần
    N ProductSpec)"*.
  - **XÁC NHẬN 1↔1 — dùng `ProductSpec.matId` trực tiếp, không dựng model mapping.** Đi tiếp.

Không tiền đề nào bị bác. Thi công theo kế hoạch, không rẽ nhánh DECISION CONFLICT.

## A. Evidence cardinality (file:line)

| Bằng chứng | Vị trí |
|---|---|
| Discriminator `kind` | `prisma/schema.prisma:395` |
| Danh sách `SPEC_KINDS` | `lib/server/specs.ts:6` |
| Quyết định 1↔1 (nguyên văn Hoà) | `scripts/frontier-registry.mjs:312` (entry `material-matid-uuid`) |
| 2 callsite thật đang gọi `getMaterial(sku, …)` | `components/materials/MaterialsScreen.tsx:90` · `app/files/_lib/ngan-tho.ts:142` |
| 0 nơi biểu diễn N ProductSpec/1 material | grep toàn repo, không ra kết quả |

## B. Files changed

**Sửa** (đường dẫn tuyệt đối rút gọn từ gốc repo):
- `prisma/schema.prisma` — thêm `ProductSpec.matId String? @unique`.
- `lib/materials/warehouse/dto.ts` — `MaterialSpecDto.matId: string | null`.
- `lib/server/specs.ts` — `specToDto()` đọc `matId`; `specNormalize`/`specPatch` **cố ý không**
  nhận `matId` từ body (docstring giải thích tại chỗ).
- `lib/materials/resolve.ts` — viết lại `getMaterial()`: 2 đường tường minh (`resolvedVia`).
- `lib/materials/resolve.test.ts` — thêm 6 block test cho đường UUID + non-regression đường legacy.
- `lib/materials/pbr-store.ts` — thêm `migratePbrLegacyToCanonical()` + type `PbrMigrationSpec` /
  `PbrMigrationReport`.
- `scripts/frontier-registry.mjs` — cập nhật entry `material-matid-uuid` (bước 2A).

**Tạo mới**:
- `lib/materials/pbr-migration.test.ts` — 22 ca cho helper PBR migration.
- `scripts/backfill-material-matid.ts` — script backfill (mặc định dry-run).

**KHÔNG đụng** (đúng ranh giới phiếu): `entity.matId`/`hatchOverride` behavior · `docToObjScene` ·
`lib/boq/*` · `lib/present-editor/*` (trừ việc đọc, không sửa) · `lib/library/spec-panel.ts`
(`matchSpec` — business key khác domain, ngoài phạm vi) · không commit, không push, không
`prisma db push`/`migrate`, không đọc secret.

## C. Schema change (diff)

```prisma
model ProductSpec {
  ...
  larkRecordId String?   @unique
  raw          String?
  note         String?
  createdAt    DateTime  @default(now())
  syncedAt     DateTime?

+ // ── matId — IDENTITY của MATERIAL (19/08, Hoà chốt hòa giải Decision Conflict, SUPERSEDES
+ // luật cũ 07/08 "matId = ProductSpec.sku")...
+ matId        String?   @unique
  ...
}
```

`@unique` cho phép nhiều `NULL` trên SQLite/Prisma (mọi dòng chưa backfill đều `matId = null`,
không đụng unique constraint).

## D. Command Hoà phải chạy tay

Đọc `package.json` scripts trước khi soạn — không có script `db:push`/`migrate` có sẵn, dùng
lệnh Prisma CLI trực tiếp (đúng convention `SPEC_ROOM_COLUMN_READY` comment cũ ở `lib/server/specs.ts`
đã ghi cho lần migrate trước):

```bash
npx prisma db push
npx prisma generate
node_modules/.bin/sucrase-node scripts/backfill-material-matid.ts            # dry-run, xem số liệu trước
node_modules/.bin/sucrase-node scripts/backfill-material-matid.ts --apply    # ghi thật
```

⚠️ **Quan trọng — thứ tự bắt buộc `db push` TRƯỚC `generate`** — đã tự kiểm chứng rủi ro ngược
lại ở mục H dưới đây (T đã lỡ chạy `prisma generate` trước khi có `db push` trong phiên này, gây
lỗi SQL runtime cho mọi phiên khác, đã hoàn nguyên — xem chi tiết mục H).

## E. Backfill status

**VIẾT ĐƯỢC** — `scripts/backfill-material-matid.ts`, đã soạn xong, **CHƯA CHẠY trên DB thật**.

- Phạm vi: **CHỈ `ProductSpec.kind === 'material'`** — theo đúng bằng chứng ⓪c (registry nói
  matId là "identity của MATERIAL", không có bằng chứng cần cho furniture/lighting/millwork/fixture).
- Mặc định **dry-run** (chỉ đếm, không ghi) — cần cờ `--apply` mới ghi thật. Đây là lớp an toàn
  T tự thêm (không có tiền lệ dry-run trong 2 script backfill cũ của repo —
  `backfill-project-members.ts` ghi thẳng — nhưng hợp lý vì cột `matId` CHƯA MIGRATE khi phiếu
  này viết ra; script sẽ lỗi cứng nếu ai chạy nó trước khi Hoà `db push`, dry-run không đổi điều
  đó nhưng giúp Hoà đếm số trước khi ghi thật).
- Idempotent: dòng đã có `matId` bị bỏ qua nguyên vẹn (`row.matId` truthy check).
- Report in ra console: `scanned / skipped (kind≠material) / alreadyHasMatId / generated / errors`.
- **Ép kiểu có chủ ý** trong script (`specClient` cast hẹp) — giải thích lý do ngay trong
  docstring: Prisma Client hiện tại (node_modules, dùng chung mọi phiên) CHƯA generate cho field
  `matId` (xem mục H), nên gọi trực tiếp `prisma.productSpec.findMany({ select: { matId: true } })`
  sẽ đỏ tsc. Cast hẹp giữ type safety NỘI BỘ file này mà không phụ thuộc Prisma Client type toàn
  cục — khi Hoà chạy `generate` thật, script vẫn chạy đúng (cast trở thành dư thừa vô hại, không
  bắt buộc xoá).

## F. Resolver behavior TRƯỚC/SAU

**TRƯỚC** (bước 1, chưa sửa `resolve.ts`): một đường duy nhất, `normalizeMatId` (upper+trim,
từ `pbr-store.ts`) áp cho MỌI input — kể cả UUID (sai theo luật hòa giải, vì UUID canonical phải
lowercase).

**SAU** (bước 2A):

```ts
getMaterial(input, sources) →
  isMatIdUuid(input)
    ? { resolvedVia: 'uuid', matId: normalizeMatIdCanonical(input), … tra qua ProductSpec.matId }
    : { resolvedVia: 'legacy-sku', matId: normalizeSkuBusinessKey(input), … tra qua sku (Y HỆT trước 19/08) }
```

- Đường UUID: `pbrMap[canonical]` · `specs.find(s.matId canonical-match)` ·
  `defs.find(d.matId canonical-match)` — không dùng `normalizeMatId` cũ (upper) cho nhánh này.
- Đường legacy: giữ **nguyên xi** thuật toán cũ (`trim+upper`), nên 2 callsite thật hiện tại
  (`MaterialsScreen.tsx` gọi `getMaterial(m.sku, …)`, `ngan-tho.ts` gọi `getMaterial(m.sku, …)`)
  **không đổi hành vi một bit nào** — đã verify bằng test non-regression (`resolve.test.ts`,
  block "đường legacy-sku... TIẾP TỤC hoạt động y hệt trước 19/08").
- `CommercialFacet.matId?: string | null` thêm mới (optional) — object literal cũ trong test
  không cần sửa (structural typing chấp nhận field vắng mặt).
- Không bao giờ trả một chuỗi "giả UUID" từ sku, và không bao giờ áp `normalizeMatIdCanonical`
  cho một chuỗi không phải UUID (kiểm bằng test "hai đường KHÔNG LẪN NHAU").

## G. PBR migration behavior + test results

`migratePbrLegacyToCanonical(pbrMap, specs)` — THUẦN, không tự đọc/ghi `localStorage`:

- Với mỗi `spec` có ĐỦ `sku` lẫn `matId`: nếu có PBR ở khoá legacy (`normalizeMatId(sku)`, upper)
  MÀ CHƯA có ở khoá canonical (`normalizeMatIdCanonical(matId)`, lower) → **copy**.
- Canonical đã có → **canonical thắng**, không ghi đè.
- Legacy key **KHÔNG BAO GIỜ bị xoá** trong cửa sổ migration này.
- Idempotent tự nhiên (không cần version marker) — verify bằng test rerun 2 lần, lần 2
  `migrated: 0`.
- **CHƯA cắm vào callsite thật** — đây là chủ ý của phiếu ("để callsite cho bước sau"), `pbr-store.ts`
  KHÔNG tự gọi hàm này ở đâu.

Test: `lib/materials/pbr-migration.test.ts` — **22 pass, 0 fail** (7 nhóm: copy cơ bản · canonical
thắng · rerun idempotent · legacy giữ lại · case-normalization chỉ áp phía sku · không có gì để
copy · dòng thiếu field bị bỏ qua sạch).

## H. Test results tổng

| Lệnh | Kết quả |
|---|---|
| `npx tsc --noEmit` | **0 lỗi** (sau khi hoàn nguyên Prisma Client — xem cảnh báo dưới) |
| `lib/materials/resolve.test.ts` | 22 pass, 0 fail |
| `lib/materials/ba-mat.test.ts` | 37 pass, 0 fail (không sửa file này, chỉ verify không hồi quy) |
| `lib/materials/matid-identity.test.ts` | 32 pass, 0 fail (bước 1, verify lại) |
| `lib/materials/pbr-migration.test.ts` | 22 pass, 0 fail (mới) |
| `app/files/_lib/ngan-tho.test.ts` | 25 pass, 0 fail (callsite thật, verify không hồi quy) |
| `npm run soi:frontier` | **0 LỆCH** (72 xong-máy · 1 qua mắt Hoà · 55 chờ) |
| `npm run soi:tu-dien` | exit 0, không thêm lệch mới (316 chỗ chữ trần cũ, không chặn — không liên quan phiếu này) |

⚠️ **SỰ CỐ TRONG PHIÊN, ĐÃ TỰ SỬA — khai thật, không giấu**: để viết `scripts/backfill-material-matid.ts`
đúng kiểu, T thử `npx prisma generate` (không phải `db push`/`migrate`, nghĩ là an toàn vì chỉ
sinh code từ `schema.prisma`, không mutate DB). **Hậu quả không lường trước**: `@prisma/client`
là artifact CHUNG một `node_modules` cho MỌI phiên/dev-server đang chạy trên repo này (STATUS.md
ghi nhận 3 phiên Claude Code + dev server 3001/3002/3004 đang mở song song). Regenerate client
theo schema MỚI (có `matId`) trong khi DB THẬT chưa có cột đó khiến **MỌI truy vấn `ProductSpec`
từ MỌI phiên khác lỗi runtime** `"The column main.ProductSpec.matId does not exist in the current
database"` — đã tự verify bằng script test trực tiếp trước khi biết mức độ nghiêm trọng.
**Đã hoàn nguyên ngay**: generate lại client từ bản schema GỐC (không có `matId`, lấy qua
`git show HEAD:prisma/schema.prisma`), verify lại bằng `prisma.productSpec.findMany()` chạy OK,
rồi mới khôi phục `schema.prisma` (chỉ file nguồn, KHÔNG generate lại) về bản có `matId` cho đúng
phạm vi phiếu. Hệ quả: `tsc` hiện tại thấy `scripts/backfill-material-matid.ts` KHÔNG có field
`matId` trên Prisma Client type — giải quyết bằng cast kiểu hẹp nội bộ script (mục E), **không
regenerate client lần nữa trong phiên này**.

## I. ⑦b CHƯA CHẮC / CHƯA KIỂM

- **Chưa chạy app thật** — không mở dev server, không verify qua UI/API thật (`GET /api/specs`
  chưa được gọi qua HTTP trong phiên này, chỉ verify qua Prisma Client trực tiếp cho mục đích
  kiểm tra sự cố ở mục H).
- **`specToDto()` với Prisma row THẬT sau khi migrate** — chưa kiểm chứng bằng dữ liệu thật (không
  thể, cột chưa tồn tại trên DB). Suy luận từ type + logic thuần, chưa chạy tích hợp.
- **Backfill script CHƯA chạy** — kể cả dry-run, vì cột `matId` chưa tồn tại trên DB thật; chạy
  ngay bây giờ sẽ lỗi Prisma runtime (đúng dự kiến, không phải bug).
- **`migratePbrLegacyToCanonical` chưa có callsite thật** — chỉ là hàm thuần đã test đơn vị, hành
  vi khi nối vào `loadPbrMap()`/`savePbr()` thật (side effect thật trên `localStorage`) chưa kiểm.
- **Không kiểm ATLAS sync path** (`lib/lark/atlas-material-map.ts`) — phiếu nói rõ "không đụng
  ATLAS sync", T tuân thủ, nhưng do đó CHƯA rõ ATLAS ghi `matId` thế nào khi sync material mới
  (cần phiếu riêng, đã ghi vào registry mục "CÒN NỢ").
- **316 chỗ "chữ trần" `soi:tu-dien` báo** — không phải của phiếu này (đã kiểm bằng thí nghiệm
  hoàn nguyên kiểu P-L: số trước/sau phiên không đổi do phần thêm của tôi), nhưng KHÔNG tự verify
  từng chỗ, chỉ tin vào exit code.
- **Có thể còn callsite `ProductSpec`/`matId` khác chưa grep hết** — đã grep bằng nhiều từ khoá
  (`MaterialFacets`, `CommercialFacet`, `from '.../resolve'`) nhưng không loại trừ 100% khả năng
  sót một import động/gián tiếp.

## J. ⑦c HẠN DÙNG KẾT LUẬN

- **⓪c (1↔1, không cần model mapping)**: đúng tại **19/08**, dựa trên grep toàn repo hiện tại.
  Nếu ATLAS sync (chưa code) sau này đẻ ra ca "1 material nhiều nhà cung cấp/nhiều ProductSpec"
  thì kết luận này PHẢI đọc lại — không tự động còn đúng.
- **"2 callsite thật gọi getMaterial bằng sku"** (mục F): đúng tại **19/08**, trước khi bước 2B
  cắm resolver UUID vào UI thật. Sau bước 2B, câu này sẽ sai (callsite sẽ đổi sang gọi bằng UUID).
- **Backfill "chỉ target kind==='material'"**: đúng theo bằng chứng hiện có. Nếu sau này có bằng
  chứng furniture/lighting cũng cần matId, phải mở phiếu riêng đổi phạm vi backfill — KHÔNG tự ý
  mở rộng domain của một cột đã @unique.
- **"Prisma Client hiện tại KHÔNG có field matId"** (mục H): đúng tại thời điểm kết phiên (đã
  hoàn nguyên). Sẽ SAI ngay khi Hoà chạy `prisma generate` thật — lúc đó cast kiểu hẹp trong
  backfill script trở thành dư thừa (vô hại, không bắt buộc xoá nhưng nên dọn ở phiếu sau).

## K. Bước kế tiếp đề xuất

1. **Hoà chạy tay** (mục D) — `db push` → `generate` → dry-run backfill → xem số → `--apply`.
2. **Bước 2B** (đúng như registry đã ghi "CÒN NỢ"): cắm `getMaterial()` đường UUID vào 2 callsite
   thật (`MaterialsScreen.tsx`, `ngan-tho.ts`) — đổi từ gọi bằng `m.sku` sang gọi bằng `m.matId`
   khi có, fallback `m.sku` khi chưa backfill (transition period).
3. Nối `migratePbrLegacyToCanonical()` vào một callsite thật (khả năng: chạy 1 lần lúc app khởi
   động sau khi `/api/specs` trả về, hoặc nút "Cập nhật kho vật liệu" trong `MaterialsScreen.tsx`).
4. Docstring SUPERSEDED ở 6 file cũ còn nợ từ bước 1 (comment-only, chưa vào phiếu này).
5. **KHÔNG** chạy `prisma generate` trong bất kỳ phiên phụ nào khác cho tới khi Hoà đã `db push`
   xong — bài học đắt của phiên này (mục H), nên ghi thành luật vận hành nếu chưa có.
