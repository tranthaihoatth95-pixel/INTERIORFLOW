# ADR Q0 · QUYẾT ĐỊNH KIẾN TRÚC INTERIORFLOW

> **Q1–Q9** — ngày chốt 19/08/2026 (Hoà chốt sau khi đọc [Audit Q0](AUDIT-Q0-SOURCE-OF-TRUTH-LIBRARY-IDFC-2026-08-19.md)) · `ACCEPTED` · mốc code `3da4b8c`.
> **Q10–Q13** — `CANDIDATE`, còn ở `docs/design-candidate/IF-ARCH-LOCAL-FIRST-LARK-001/08-ADR-CANDIDATE.md`. Chưa chốt, **đừng đọc như đã chốt**.
> **Q14** — ngày chốt 27/08/2026 · `ACCEPTED` · mốc code `2a454b4`. Xem §Q14 cuối tệp.
>
> ⚠️ Tệp này là **DÃY ADR DUY NHẤT** của IF. Cấm mở dãy thứ hai — đã suýt xảy ra một lần
> (phiên 24/08 định đánh số lại từ `ADR-001` trong khi Q1–Q9 đang sống), và hai dãy song song là
> hai lịch sử quyết định mâu thuẫn nhau. Quyết định mới **nối tiếp số**, không đẻ tệp mới.
> Tiêu đề cũ ghi "9 QUYẾT ĐỊNH" — bỏ số đó đi vì nó sai ngay lần thêm đầu tiên.
# ADR Q0 · 9 QUYẾT ĐỊNH KIẾN TRÚC INTERIORFLOW

> **Ngày chốt**: 19/08/2026 (Hoà chốt sau khi đọc [Audit Q0](AUDIT-Q0-SOURCE-OF-TRUTH-LIBRARY-IDFC-2026-08-19.md))
> **Trạng thái**: ACCEPTED (Hoà đã quyết) — nhiệm vụ T là **ghi lại + đối chiếu code + migration plan**, KHÔNG tự đổi quyết định.
> **Mốc code**: `3da4b8c` (main HEAD)

---

## 0 · RANH GIỚI PHIÊN NÀY

**T KHÔNG được**:
- Sửa production code trong bước này.
- Migration schema trong bước này (không đổi Prisma, không viết migration mới).
- Tự đổi quyết định Hoà đã chốt.
- Diễn giải quyết định thành phương án khác.

**T LÀM**:
- Ghi lại nguyên văn 9 quyết định (§Q1-Q9).
- Đối chiếu với code hiện tại (file:line evidence).
- Đo migration impact bằng số cụ thể.
- Lập migration dependency graph.
- Xác định thứ tự refactor an toàn.
- Nếu code lộ mâu thuẫn mới với quyết định → **ghi lại để Hoà quyết**, không tự hoà giải.

**Nguyên tắc bao trùm (Hoà nêu 19/08)**:
- **Deterministic Core**: mọi mutation quan trọng đi qua core tất định. AI/ML không ghi thẳng geometry/data canonical.
- **AI Layer L0–L5**: Deterministic → Adaptive ML → Assist → Collaborate → Delegate → Autopilot. Mọi level bị giới hạn bởi rule/policy.
- **AI Gateway**: gateway quản provider/runtime. Intelligence Policy quản: có được gọi AI không · dữ liệu nào gửi · privacy · AI level · checkpoint · mutation authority.
- **Ownership**: chấp nhận phụ thuộc công cụ. KHÔNG chấp nhận phụ thuộc dữ liệu.

---

## Q1 · Source of Truth của Project

### Current state

**Đo tại Audit Q0 §3-§4**: có 5 surface persistence đang cùng chịu trách nhiệm cho Project, KHÔNG có Source of Truth chung. Không có "Project Manifest" — muốn biết dự án X có domain nào ở đâu phải grep code.

| Surface | Domain | Evidence |
|---|---|---|
| Prisma SQLite | Project metadata, Task, Flow.graphJson, Notebook, ProductSpec, LibraryAsset metadata | `prisma/schema.prisma` (21 model) |
| `.idf` file | CAD Doc | `lib/cad/idf.ts` |
| `.idfp` file | Present deck | `lib/present-editor/idfp.ts` |
| `.idfc` studio | Kho cấu kiện studio | `lib/library/idfc-store.ts` (localStorage) |
| IndexedDB `interiorflow-sheets` | Autosave CAD + Present | `lib/sheets-persist.ts` |
| `./uploads/dna/<projectId>/cards.json` | Design DNA | `lib/dna/store.ts:21` |
| `./uploads/<random>` | LibraryAsset binary | `LibraryAsset.path` |
| localStorage (~20 key) | BOQ overrides · Brand Kit · preferences · workspace · AI tier | 6 file scattered |

### Decision

> **Domain Authority + Project Manifest.**
> Không ép toàn bộ IF vào một database hay một file duy nhất.
> Mỗi domain có một authority rõ: CAD · Present · Tasks · Assets · Decisions · DNA · Project metadata.
> `Project Manifest` là bản đồ cho biết domain nào do nguồn nào sở hữu.
> **Nguyên tắc**: một project có thể có nhiều physical storage, nhưng mỗi semantic domain chỉ có một authority rõ ràng.

### Why

Chốt B4 31/07 (`disk-sync.ts:11-30`) đã giải bài "đĩa vs cache" đúng cho CAD/Present — không muốn phá công đó. Nhưng thiếu **bản đồ chung** để biết domain nào do surface nào sở hữu → mỗi phiên mới phải grep để hiểu. Manifest giải chỗ thiếu đó mà không đảo ngược B4.

Khớp nguyên tắc OS 18/08 "Own your data" (file rõ ràng, không opaque blob) và "Own your workflow" (không phụ thuộc DB duy nhất).

### Code impact

**Cần thêm** (chưa có trong code hiện tại):
- `lib/project-manifest.ts` (mới) — kiểu `ProjectManifest` + hàm `resolveManifest(projectId)` trả về danh sách domain → authority.
- Ràng buộc: manifest là DERIVED (đọc từ surface, không tự lưu) hay CANONICAL (Prisma model riêng)? → cần Hoà quyết (Unknown U-Q1-01 bên dưới).

**Không cần sửa**:
- `disk-sync.ts` — chốt B4 giữ.
- Cấu trúc `.idf`/`.idfp`/`.idfc` — giữ.
- Prisma models hiện có — giữ.

**Cần đối chiếu**:
- Tất cả tuyên bố *"file X sở hữu domain Y"* trong docstring code phải khớp Manifest. Grep hiện đo:
  - `prisma.project.*` xuất hiện ở **12 file** (readers)
  - `exportIdf|importIdf` ở **16 file**
  - `exportIdfp|importIdfp` ở **5 file**

### Data impact

Không có data mới, không xoá data cũ. Manifest là **metadata cấp app**, không phải cấp project. Có thể lưu 1 lần trong `docs/PROJECT-MANIFEST.md` (readable) hoặc là runtime derive.

### Migration impact

🟢 **TRIVIAL** ở tầng data. 🟡 **SMALL** ở tầng code.

| Việc | File sửa | Dòng ước | Migration Prisma | Rủi ro |
|---|---|---|---|---|
| Định nghĩa `ProjectManifest` type | 1 mới (`lib/project-manifest.ts` ~100 dòng) | 100 | 0 | 🟢 |
| Docstring `disk-sync.ts` bổ sung *"CAD/Present authority per Manifest §..."* | 1 | ~20 | 0 | 🟢 |
| Tương tự cho `lib/dna/store.ts`, `lib/library/idfc-store.ts`, `lib/present-editor/boq-overrides.ts` | 3 | ~30 | 0 | 🟢 |
| Docs: viết `docs/PROJECT-MANIFEST.md` | 1 mới | 300 | 0 | 🟢 |

**Ước tổng**: ~5 file, ~500 dòng, 0 Prisma migration.

### Risks

- **R-Q1-01**: Manifest chỉ là docs → phiên sau có thể quên đồng bộ. Giảm rủi ro: viết test khoá tên khoá localStorage + tên format file, cảnh báo khi code đổi mà docs không đổi.
- **R-Q1-02**: Nếu có domain thứ 8/9 sinh ra (Client · Supplier · Contractor...) mà Manifest chưa nhắc → Manifest lỗi thời. Giảm rủi ro: Manifest có `## Chưa phủ` section.

### Unknowns

- **U-Q1-01**: Manifest là data (Prisma model / JSON per project) hay là docs cấp app? T nghiêng docs cấp app (rẻ hơn) nhưng Hoà quyết.
- **U-Q1-02**: Multi-device sync trong tương lai — mỗi device có 1 Manifest riêng hay chung? Chưa cần quyết ngay.

---

## Q2 · Prisma vs `.idf` sở hữu phần nào

### Current state

**Đo tại Audit Q0 §8, §22-§23**:
- Prisma `Project` chứa metadata (id, name, currentStage, stageLocked, rev, deletedAt, ...).
- `.idf` chứa CAD Doc: `IdfFile { idfVersion, meta { projectName, createdAt, modifiedAt, appVersion }, sheets[] }` — mỗi sheet có `id, name, doc, paperSheets?` (`idf.ts:124-128`).
- CAD entity `BlockEntity.specId` (FK MỀM → `ProductSpec.id`) — 20 file có `.specId`, 53 occurrences. Comment `model.ts` gọi là "Hệ Legend X1".
- `BlockEntity.hostId` (id `HatchEntity` tường chủ) và `HatchEntity.hostId` (id `PolylineEntity`) — reconcile idempotent, không lưu vào `.idf` v1 vì auto-suy được lúc mở.
- 53 occurrences `.specId` là live reference; ProductSpec chi tiết chỉ ở Prisma.

Nếu chỉ còn `.idf`: mở được Doc, thấy các entity nhưng KHÔNG biết `specId` trỏ vào material/furniture nào (mất tên, giá, brand). Nếu chỉ còn Prisma: có tất metadata, không có Doc.

### Decision

> **Live reference + portable snapshot.**
> - Prisma giữ relational/query/index data.
> - `.idf` giữ portable design state của CAD.
> - Khi online/in-studio: object tham chiếu canonical data bằng ID.
> - Khi share/offline/archive: file phải có snapshot đủ để tái dựng trạng thái lúc lưu.
> Không để `.idf` phụ thuộc tuyệt đối vào Prisma.
> Không biến `.idf` thành bản sao toàn database.

### Why

Bảo toàn cả hai lợi ích:
- **Live reference**: sửa `ProductSpec` 1 chỗ, mọi dự án dùng nó nhìn thấy đổi ngay (đúng "một sự thật một chỗ"). Nay đang có: 43 file reference ProductSpec, 53 occurrences `.specId`.
- **Portable snapshot**: chia sẻ `.idf` cho người khác — họ mở được ngay cả khi không có DB của bạn. Nay chưa có: `.idf` v2 chỉ có `matId` FK, không có snapshot ProductSpec.

Khớp OS 18/08 "Own your workflow" (không lock vào DB) và "Own your data" (share được).

### Code impact

**Cần bổ sung** vào `.idf` v3 (bump version):
- Trong `IdfFile.meta`, thêm `productSpecSnapshots?: Record<matId, ProductSpecSnapshot>` — chỉ những spec có entity đang dùng (tránh phồng).
- Chỉ khi export "share mode" hoặc "archive mode" → tự nhúng snapshots. Khi export "live mode" (autosave đĩa nội bộ studio) → không cần.
- Hàm `exportIdf(sheets, opts: { mode: 'live' | 'share' })` — thêm option.
- Hàm `importIdf` — nếu file có `productSpecSnapshots` thì dùng để hydrate view khi Prisma không có spec đó.

**Không sửa**:
- `.specId` FK mềm — giữ (là live reference).
- `.hostId` — giữ.
- `BlockEntity` shape — giữ.

**Files phải đọc/sửa** (theo grep):
- `lib/cad/idf.ts` (245): bump v2→v3, thêm migration v2→v3 identity + hàm `hydrateSnapshots`.
- `lib/cad/idfc.ts`: xem có cần cùng luật? — `.idfc` là template, khác `.idf` (project). Chốt tại ADR-Q3.
- 16 file dùng `IdfFile`/`exportIdf`/`importIdf`: check các nơi export xem có phân biệt được "live" vs "share" chưa. Grep sơ bộ: `exportIdf` gọi ở `CadSheets.tsx` (chưa đọc) — cần chọn opts. Có thể chỉ 1-2 call site quyết định mode.
- 20 file dùng `.specId`: chỉ đọc để đảm bảo không có nơi nào giả định spec luôn ở DB.

### Data impact

**Format `.idf` bump v2 → v3**:
- v2 files vẫn mở được (migration identity).
- v3 files có thêm `productSpecSnapshots` (optional).
- Bảng migration `IDF_MIGRATIONS[2]`: identity hoặc thêm field rỗng.

**Prisma**: KHÔNG đổi. `ProductSpec` shape giữ.

**Files user đã tạo**: `.idf` v2 hiện có → mở được (migrate identity), không mất dữ liệu.

### Migration impact

🟡 **SMALL-MEDIUM**.

| Việc | File sửa | Dòng ước | Migration Prisma | Rủi ro |
|---|---|---|---|---|
| Bump `IDF_VERSION` 2→3 + migrateV2ToV3 identity | `lib/cad/idf.ts` | +30 | 0 | 🟢 |
| Thêm `ProductSpecSnapshot` type | `lib/cad/idf.ts` hoặc `lib/materials/snapshot.ts` mới | +50 | 0 | 🟢 |
| Thêm `mode: 'live' | 'share'` param cho `exportIdf` | `lib/cad/idf.ts` + call sites | +100 | 0 | 🟡 |
| Thêm hàm `collectSpecsForSnapshot(sheets)` — quét `.specId` unique | `lib/materials/snapshot.ts` mới | +80 | 0 | 🟢 |
| Import: hydrate snapshot khi không có DB | `lib/cad/idf.ts` + `lib/materials/resolve.ts` | +100 | 0 | 🟡 |
| Test round-trip v2→v3 + share/live mode | `lib/cad/idf.test.ts` | +200 | 0 | 🟢 |

**Ước tổng**: ~4-5 file, ~400-500 dòng mới. 0 Prisma migration.

### Risks

- **R-Q2-01**: Nếu spec snapshot có, mà user sửa spec trong DB → mở file cũ thấy giá cũ. Cần luật rõ *"snapshot chỉ hiển thị khi Prisma không có spec"* hay *"snapshot luôn thắng"*. Hoà quyết (Unknown).
- **R-Q2-02**: Snapshot chỉ chứa ProductSpec — không đủ cho toàn cảnh. Còn thiếu: LibraryAsset (ảnh, GLB), custom fonts, brand kit → phải mở rộng dần từng loại.
- **R-Q2-03**: File `.idf` v3 lỡ mở ở app cũ (chưa update) — hiện tại đã có logic *"file mới hơn app"* (`idf.ts:210-215`) từ chối kèm thông báo. OK.

### Unknowns

- **U-Q2-01**: Snapshot có nên bao gồm LibraryAsset (ảnh, GLB) không? Có thì file to lên rất nhanh. T nghiêng KHÔNG (chỉ ProductSpec), share ảnh gửi kèm.
- **U-Q2-02**: Khi mở file có snapshot mà DB đã có spec khác — hiển thị nào (snapshot cũ hay DB mới)? Hoà quyết.

---

## Q3 · `.idfc` là gì?

### Current state

**Đo tại Audit Q0 §18-§25**:
- `.idfc` là **content item** trong Master Library — 1 file = 1 mẫu (chữ C = CONTENT từ 07/08 khuya, `idfc.ts:2-3`).
- 12 kind (`idfc.ts:69-72`): material · furniture · millwork · fitout · fixture · soft · page · video · doc · asset · brandkit · preset.
- Vỏ chung `meta {id?, name, code, kind, scope?, tags?, room?, ...}` + ruột discriminated union theo kind (`idfc.ts:151-180`).
- **Đường một chiều**: `.idfc` chỉ export/import, KHÔNG có "ghi ngược" từ bản chèn về gốc (ràng buộc 1, `idfc.ts:35`).
- **FK mềm bản chèn ↔ template**: `BlockEntity.specId` = `idfc.meta.id` (hoặc `ProductSpec.id` cho matId), reconcile theo comment `model.ts` "Hệ Legend X1".
- **KHÔNG có override layer** cấp entity ở code hiện tại: `BlockEntity` có `variant?: string` (`model.ts:BlockEntity`) — variant ID có sẵn trong template, nhưng KHÔNG có "override finish/size ad-hoc". Comment `idfc.ts:36-37` chỉ nói *"Bản chèn giữ liên kết qua FK MỀM"*, không nhắc override.
- 65 file dùng BlockEntity/HatchEntity.

### Decision

> **`.idfc` = canonical reusable content definition.**
> Template và instance tách riêng.
>
> ```
> IDFC TEMPLATE
>      ↓
> INSTANCE = reference + overrides
> ```
>
> Ví dụ: Chair CH-001 là canonical `.idfc`, instance trong project chỉ reference CH-001 + override finish/size nếu cần.
> Không tạo `.idfc` mới cho mỗi instance.

### Why

Giữ tinh thần *"tất cả trong thư viện là `.idfc`"* (chốt 07/08 khuya) — không đẻ format thứ hai cho instance. Đồng thời giải bài "sửa 1 ghế trong 1 dự án không ảnh hưởng ghế template mẫu": có `overrides` cấp entity.

Ràng buộc 1 (`.idfc` một chiều) vẫn giữ — override sống ở entity, không ghi lên template.

### Code impact

**Cần bổ sung**:
- Field mới `overrides` cho entity dùng template. Có 2 cách:
  - **3a**: mở rộng `BlockEntity` (và `HatchEntity` nếu áp cho material) — thêm `overrides?: Partial<IdfcBody>` hoặc typed đúng cho từng kind.
  - **3b**: model riêng `EntityOverride { entityId, path, value }` — flex hơn, phức tạp hơn.

**T nghiêng 3a** — additive, đúng tinh thần Base (`model.ts` mở đầu comment nêu additive), dễ backward-compatible.

**Không sửa**:
- `.idfc` format v3 — giữ. Overrides không nằm trong `.idfc` (đó là entity trong Doc).
- Ràng buộc 1 (một chiều) — giữ.

**Files phải sửa**:
- `lib/cad/model.ts` (1466 dòng): thêm `BlockEntity.overrides?: EntityOverrides` typed theo kind. **KHÔNG đổi hình dạng field cũ** (bump `IDF_VERSION`? Không, additive).
- `lib/cad/library-item-resolve.ts` (chưa đọc chi tiết): merge template + overrides khi resolve entity.
- Nếu áp cho material (HatchEntity): tương tự.
- `lib/three/build-recipe.ts` hoặc `docToObjScene`: đọc merged spec khi build 3D.
- Present editor: bảng vật liệu hiện instance override (nếu có).
- Test round-trip overrides trong `.idf`.

**Files phải đọc**:
- 65 file dùng BlockEntity/HatchEntity — check có nơi nào giả định "spec là fixed" mà không đọc overrides.

### Data impact

**`.idf` v2 file cũ**: không có `overrides` field → parse bình thường (additive). Không migration.

**Prisma**: không đổi. Overrides sống trong Doc, không có bảng riêng.

**`.idfc` file cũ**: không đổi.

### Migration impact

🟡 **SMALL-MEDIUM**.

| Việc | File sửa | Dòng ước | Migration Prisma | Rủi ro |
|---|---|---|---|---|
| Thêm `BlockEntity.overrides` type | `lib/cad/model.ts` | +30 | 0 | 🟢 |
| Định nghĩa `EntityOverrides<Kind>` typed union | `lib/cad/model.ts` hoặc mới `lib/cad/overrides.ts` | +150 | 0 | 🟡 |
| Merge helper `resolveInstanceSpec(entity, template)` | `lib/cad/library-item-resolve.ts` | +80 | 0 | 🟡 |
| Đọc merged spec ở nơi build 3D | `lib/three/build-recipe.ts`, `lib/three/cad-to-obj.ts` (chưa đọc) | +50 | 0 | 🟡 |
| Đọc merged spec ở BOQ + Present bảng vật liệu | `lib/boq/*.ts`, `lib/present-editor/*.ts` | +80 | 0 | 🟡 |
| UI edit overrides (Inspector) | components/ — ngoài phạm vi ADR | +? | 0 | (không tính) |
| Test | `lib/cad/*.test.ts` | +200 | 0 | 🟢 |

**Ước tổng**: ~6-8 file, ~600-800 dòng mới. 0 Prisma migration.

### Risks

- **R-Q3-01**: Overrides can be *"ghi đè finish"* nhưng cũng có thể *"ghi đè kích thước"* — nếu kích thước đổi thì hình học đổi → phải re-compute geometry. Có thể phức tạp cho materials có hatch pattern.
- **R-Q3-02**: Có thể xung đột với `BlockEntity.variant?: string` — variant đã là 1 dạng "chọn preset". Overrides đè lên variant thế nào? Cần luật: overrides thắng variant, hay variant thắng overrides. Hoà quyết (Unknown).
- **R-Q3-03**: Nếu template `.idfc` bị xóa mà instance có `specId` trỏ vào + overrides — instance hiển thị gì? Đã có luật: `sourceLibraryId` chỉ để display (`idfc.ts:113-114`). Nhưng thực tế: entity không tự chứa geometry cho template đã xóa → mất hiển thị. Cần Q2 snapshot mode.

### Unknowns

- **U-Q3-01**: Overrides có được lưu vào `.idfc` khi promote instance thành template mới không? (Có: người dùng có thể *"Save as new component"* — trong app hiện chưa có UI này, nhưng có thể có sau.)
- **U-Q3-02**: Overrides của material (HatchEntity) shape thế nào? Chỉ đổi hatch pattern hay cả PBR? Chưa quyết.

---

## Q4 · Master Library sở hữu binary/source thế nào

### Current state

**Đo tại Audit Q0 §14, §17**:
- `LibraryAsset.path: String` — trỏ vào `./uploads/<random>` (`schema.prisma:LibraryAsset:`).
- File **COPY** vào `./uploads/`, không reference file gốc (Audit Q0 §17.2 #4).
- **KHÔNG có content addressing (hash)** — grep không tìm được dedupe logic (Unknown U08 Audit Q0).
- **Provenance limited**: `LibraryAsset.usage: string` (ref-render|slide|material|layout|cad|brief) — phân biệt purpose, KHÔNG phân biệt origin (upload · supplier · generated · imported).
- `xFromPhoto` extension trong `.idfc` từ `from-photo.ts:147` có `sourceImageUrl` + `pipeline` + `flag` + `source` — provenance đầy đủ, NHƯNG chỉ cho `.idfc` sinh từ ảnh, KHÔNG áp dụng cho LibraryAsset chung.
- 19 file dùng LibraryAsset. 7 occurrences path `./uploads/`.
- `id` cuid ổn định, `imgIdFromKey(id) = img_<cuid>` dẫn xuất tất định — canonical asset id có sẵn.

### Decision

> **Managed copy + content addressing + provenance.**
> Master Library không phụ thuộc file gốc còn tồn tại.
> Pipeline mục tiêu:
>
> ```
> RAW SOURCE
>    ↓
> CONTENT HASH
>    ↓
> MANAGED BLOB
>    ↓
> CANONICAL ASSET
> ```
>
> Giữ provenance: user upload · supplier · project · generated · imported · external source.
> Nếu hai file giống nội dung thì có khả năng dedupe.

### Why

- **Managed copy** đã tuân từ trước (`./uploads/` là copy, không reference).
- **Content addressing**: cho phép dedupe (2 project cùng dùng 1 ảnh render → 1 blob thật) và tránh corrupt (path đổi tên không vỡ liên kết).
- **Provenance**: nghiêm túc phân biệt "user upload" vs "AI generated" cho luật OS 18/08 — dữ liệu nhạy cảm (upload user) không được gửi cloud giống dữ liệu chung.

### Code impact

**Cần bổ sung**:
- Prisma `LibraryAsset.contentHash: String?` (SHA-256 hex) — nullable ban đầu để backfill.
- Prisma `LibraryAsset.origin: String @default("unknown")` — enum: `user-upload`, `supplier-import`, `project-generated`, `external-download`, `unknown`.
- Prisma `LibraryAsset.originSource: String?` — URL/user id/pipeline id.
- Có thể tạo bảng `AssetBlob { hash, path, size, mime, createdAt }` để dedupe.
  - Nếu có: LibraryAsset trở thành thin metadata + FK vào AssetBlob.
  - Nếu không: LibraryAsset giữ `path`, thêm `contentHash` + trước khi save check hash trùng → soft-link.

**Cách nhẹ (không có bảng AssetBlob)**: hash tại upload → nếu trùng → tạo LibraryAsset mới trỏ vào path cũ (soft-link).
**Cách sạch (có AssetBlob)**: hash → upsert vào AssetBlob → LibraryAsset trỏ vào AssetBlob.id. Query tất LibraryAsset dùng blob X = 1 SQL.

**T nghiêng cách sạch** (AssetBlob riêng) — vì:
- Query "asset nào đang dùng blob X" là ca thật (khi xóa blob mồ côi).
- Đúng "một sự thật một chỗ" — blob là data, LibraryAsset là metadata.
- Chi phí thêm 1 model không quá cao.

### Data impact

**Prisma migration mới** (nếu chọn AssetBlob):
- Model mới: `AssetBlob { id, hash, path, size, mime, createdAt }` với `hash @unique`.
- LibraryAsset: thêm `blobId String?` FK. Deprecate `path` sang giữ cho backward compat.
- **Backfill script**: quét toàn bộ `./uploads/`, tính hash mỗi file, tạo AssetBlob, gán `blobId` cho LibraryAsset tương ứng. Deep-quét file: nếu 2 file trùng hash → giữ 1 blob, LibraryAsset trỏ vào cùng.

**Nếu chọn cách nhẹ**: chỉ thêm `contentHash` vào LibraryAsset. Backfill: tính hash cho từng file → điền cột. Không cần AssetBlob.

**File binary trong `./uploads/`**: không đụng lúc backfill (không rename, không dedupe vật lý). Dedupe vật lý là job riêng SAU KHI verify không cản.

### Migration impact

🟡 **MEDIUM** (cách nhẹ) hoặc 🔴 **LARGE** (cách sạch).

| Việc | Cách nhẹ | Cách sạch (T đề xuất) |
|---|---|---|
| Prisma migration | 1 (thêm 2-3 cột LibraryAsset) | 2 (thêm AssetBlob + FK LibraryAsset) |
| Backfill script | `scripts/backfill-content-hash.ts` (~100 dòng) | `scripts/backfill-asset-blob.ts` (~200 dòng, upsert) |
| Files sửa (upload endpoints) | `/api/library/ingest/route.ts` + `lib/refingest.ts` — hash trước khi save | như cách nhẹ + query AssetBlob |
| Files đọc LibraryAsset (19 file) | Ít đụng (path vẫn hoạt động) | Cần chuyển `libraryAsset.path` → `libraryAsset.blob.path` (breaking, migration script sửa hoặc thêm getter) |
| Rủi ro dedup xoá nhầm | 🟢 chưa xoá gì | 🟡 dedupe vật lý sau — cần rất cẩn thận |

**Ước tổng** (cách sạch):
- 2 Prisma migration
- 1 script backfill 200 dòng
- 3-5 file API sửa
- ~10-15 file đọc LibraryAsset cần rà (không nhất thiết sửa nếu giữ `path` getter)
- ~600-800 dòng code + 200 dòng migration

**Files phải sửa**:
- `prisma/schema.prisma`
- Prisma migration file mới
- `scripts/backfill-asset-blob.ts` mới
- `/api/library/ingest/route.ts` (chưa đọc chi tiết)
- `lib/refingest.ts`
- Nếu deprecate `path`: 19 file readers cần rà

### Risks

- **R-Q4-01**: Backfill hash cho hàng nghìn asset lớn → chậm. Chạy 1 lần, có thể chạy trong maintenance window.
- **R-Q4-02**: Có file giống hash nhưng ngữ nghĩa khác (VD: 2 project dùng cùng ảnh render, một là generated, một là uploaded). Provenance cứu: giữ 2 LibraryAsset riêng, cùng trỏ vào AssetBlob, phân biệt qua `origin`.
- **R-Q4-03**: Dedupe vật lý (xoá file trùng khỏi `./uploads/`) là bước RIÊNG SAU. Nếu làm chung với migration → rủi ro cao. Tách phase.
- **R-Q4-04**: Content hash bị collide (SHA-256 collide → gần bằng 0 xác suất) — không lo.

### Unknowns

- **U-Q4-01**: Chọn cách nhẹ (contentHash inline) hay cách sạch (AssetBlob model)? T đề xuất cách sạch nếu có thời gian, cách nhẹ nếu muốn ship v1 nhanh. Hoà quyết.
- **U-Q4-02**: `origin` enum — có cần thêm `"studio-curated"` (asset studio duyệt), `"lark-sync"` (từ ATLAS Larkbase), ...? Cần khảo sát thực tế các nguồn asset đang có.
- **U-Q4-03**: Content hash cho file `.idfc` (json) — hash trên bytes JSON (nhạy với key order) hay hash trên canonical form? Ảnh hưởng dedupe. T đề xuất hash trên `JSON.stringify(parsed)` — canonical.

---

## Q5 · File Manager vs Master Library

### Current state

**Đo tại Audit Q0 §15-§17**:
- Route `/library` (redirect SHEET nổi) + `/library/gallery` + `/library/ingest` — 3 file `app/library/`.
- Route `/files` — 5 file `app/files/` (chưa đọc chi tiết).
- `lib/filemanager/` — 7 file (real-fs.ts, selection.ts, ...).
- **HIỆN TẠI: Files = LibraryAsset ngay** — file upload → LibraryAsset created ngay (`/api/library/ingest`) → hiển thị ở Library. Không có "raw stage".
- Historical decision 17/08 tối chốt: *"Files có hai TẦNG: tầng ① thư mục hệ thống 5 loại có quyền (Dự án · Studio · NCC · Đã duyệt · Lưu trữ) + tầng ② Collection+ 8 gói component"* — **CHƯA IMPLEMENT** ở code hiện tại (Unknown).

### Decision

> **Files = raw/project inputs. Master Library = understood reusable content.**
> Files: PDF · DWG · ảnh hiện trạng · audio · Excel · file khách gửi · source chưa chuẩn hóa
> Master Library: content đã hiểu · đã normalize · có identity · có metadata · tái sử dụng được
>
> Pipeline:
>
> ```
> FILES → UNDERSTAND → NORMALIZE → CURATE / PROMOTE → MASTER LIBRARY
> ```
>
> Không phải file upload nào cũng lập tức là Library knowledge.

### Why

Fix mismatch giữa vision (17/08 tối) và code (Files = LibraryAsset ngay). Files hiện tại nhét đủ mọi loại — cần tách:
- **Raw**: PDF khách gửi, ảnh hiện trạng, DWG chưa parse → không phải "reusable content", chỉ input.
- **Library**: mẫu ghế Volumen đã có geometry+material+brand+price → tái sử dụng nhiều dự án.

### Code impact

**Cần bổ sung**:
- Prisma model mới `ProjectFile` (raw) — hoặc mở rộng `LibraryAsset` với cột `stage: 'raw' | 'library'`.

**T nghiêng model riêng** `ProjectFile`:
- Semantically khác nhau: ProjectFile bound to project, LibraryAsset scope studio/global.
- Query "file thô của project X" vs "thư viện chung" là 2 use case rõ.

**Hoặc mở rộng LibraryAsset**:
- `stage: 'raw' | 'library' @default('raw')` — bắt đầu là raw, promote sau.
- Bớt phức tạp migration nhưng semantics kém rõ ràng.

**Nếu chọn ProjectFile riêng**:
- `ProjectFile { id, projectId (FK), name, mime, path, contentHash, uploadedBy, uploadedAt }`
- Có luồng "Promote to Library": tạo LibraryAsset mới từ ProjectFile (hoặc từ hàm normalize).

**Files phải sửa**:
- Prisma migration: model ProjectFile mới hoặc mở rộng LibraryAsset.
- `/api/library/ingest/route.ts`: nay upload → tạo ProjectFile (không phải LibraryAsset). LibraryAsset chỉ tạo qua promote.
- `/api/files/*` mới hoặc mở rộng route `/files`.
- `app/files/*` UI: tạo view riêng cho raw files.
- Pipeline understand/normalize: **CẦN Hoà chốt ở ADR-Q9 và ADR-Q4** (content hash, provenance).
- 19 file dùng LibraryAsset: **KHÔNG đổi** — LibraryAsset vẫn là canonical library asset.

### Data impact

**Nếu chọn ProjectFile riêng**:
- 1 Prisma migration: thêm model.
- Backfill: LibraryAsset có `usage='brief'` (PDF khách gửi cho đọc AI) hoặc `usage='ref-render'` (ảnh tham chiếu) có thể là RAW theo semantics mới. **Cần Hoà quyết**: những asset đã có có phải là raw hay library?
- Hoặc: giữ nguyên tất cả cũ là LibraryAsset, chỉ upload MỚI đi qua ProjectFile → đơn giản.

### Migration impact

🟡 **MEDIUM**.

| Việc | File sửa | Dòng ước | Migration Prisma |
|---|---|---|---|
| Prisma ProjectFile model | `prisma/schema.prisma` + migration | ~30 | 1 |
| `/api/files/*` mới cho ProjectFile | 3-5 route mới | 400-600 | 0 |
| Refactor `/api/library/ingest` | 1 file | +100 | 0 |
| UI Files view | `app/files/*` (out of scope ADR) | +? | 0 |
| Promote endpoint | 1 mới | 100 | 0 |
| Backfill (nếu cần) | 1 script | 100 | 0 |
| Test | 2 file test | 300 | 0 |

**Ước tổng**: ~5-8 file, ~1000-1200 dòng mới. 1 Prisma migration.

### Risks

- **R-Q5-01**: Users đã upload thứ vào Library nay chia đôi → có thể hoang mang. Cần thông báo rõ + wizard chuyển.
- **R-Q5-02**: Pipeline UNDERSTAND (nếu có AI classify) → phụ thuộc AI Gateway (Q7). Cần chờ chốt ADR-Q7 (Runtime store + Deterministic Core) trước khi build pipeline.
- **R-Q5-03**: Promote button — user chọn ngay, hay AI đề xuất? Nếu AI → phải qua Gateway.

### Unknowns

- **U-Q5-01**: Bao nhiêu asset đã có phải phân loại RAW vs LIBRARY? Cần đọc data thực (out of scope ADR).
- **U-Q5-02**: Pipeline UNDERSTAND cho từng loại (PDF · DWG · ảnh) — cần định nghĩa chi tiết. Ngoài phạm vi ADR (design later).

---

## Q6 · Representation theo chặng là canonical hay derived

### Current state

**Đo tại Audit Q0 §21-§26**:
- **KHÔNG có canonical object xuyên chặng** (Audit Q0 §21.1). Có 3 vật khác nhau:
  - CAD entity trong Doc (`.idf`) với `id`, `specId?`
  - 3D mesh derive từ `docToObjScene(Doc)` — runtime, không persist
  - Present slide element trong `EditorDeck.slides` (`.idfp`) — có thể là ảnh render (LibraryAsset ref) hoặc text/table.
- Identity qua `specId` (2D↔template), `matId` (entity↔material), nhưng không có "canonical Object X" xuyên chặng.
- **KHÔNG có "frozen revision"** — mọi export (PDF, PPTX) là snapshot 1 lần, không persist "revision" object.
- `FlowVersion.graphJson` snapshot per Run (11 file dùng), nhưng chỉ cho Flow node graph, không phải toàn Project.

### Decision

> **Live representation là DERIVED; approved/issued state là FROZEN SNAPSHOT.**
> Một canonical object có thể sinh:
>
> ```
> Canonical Object
> ├── 2D
> ├── 3D
> ├── Present
> └── BOQ
> ```
>
> Trong lúc thiết kế: representation live theo canonical state.
> Khi client approve · issue · tender · export · construction · handover → **Frozen Revision**.
> Không để output đã phát hành tự đổi theo design hiện tại.

### Why

- Live derived đảm bảo consistency (đổi vật liệu 1 chỗ, mọi chỗ đổi theo).
- Frozen snapshot bảo vệ commitment (hồ sơ đã phát hành cho khách hàng không được đổi ngầm).
- Kết hợp giải cả bài "đồng bộ" và bài "audit trail" cùng lúc.

### Code impact

**Cần bổ sung**:
- Prisma model mới `ProjectRevision { id, projectId, purpose, frozenAt, frozenBy, snapshotUrl }`.
- `purpose: string` — `'client-approval' | 'issue' | 'tender' | 'export' | 'construction' | 'handover'`.
- `snapshotUrl` — path tới file snapshot (`.idf` v3 với snapshot mode ADR-Q2 + `.idfp` + BOQ overrides frozen + ...).
- Có thể thêm `ProjectRevisionAsset { revisionId, kind, path }` cho từng output (PDF, PPTX, PNG, XLSX...).

**Cần định nghĩa "Canonical Object"**:
- Nếu chọn cách hẹp: canonical = tuple `(projectId, specId)` — link đủ để derive 4 representation.
- Nếu chọn cách rộng: bảng `CanonicalObject` mới. Nhưng làm phồng schema.
- T nghiêng cách hẹp — tuple, không cần bảng.

**Files phải sửa/tạo**:
- Prisma migration: `ProjectRevision` + `ProjectRevisionAsset`.
- `/api/projects/[id]/revisions/*` route mới: create/list/download.
- UI: nút "Freeze Revision" (out of scope ADR).
- Logic freeze: gọi `exportIdf(sheets, mode='share')` (ADR-Q2) + `exportIdfp(...)` + snapshot BOQ overrides + zip → lưu snapshotUrl.
- Nếu chọn: frozen revision xuất ra `.idf` v3 với snapshot ProductSpec (ADR-Q2).

### Data impact

- 2 Prisma migration mới (ProjectRevision + ProjectRevisionAsset).
- Snapshot file: mỗi frozen revision có 1 zip trong `./uploads/revisions/<projectId>/<revisionId>/`.

### Migration impact

🟡 **MEDIUM**.

| Việc | File sửa | Dòng ước | Migration Prisma |
|---|---|---|---|
| Prisma ProjectRevision + ProjectRevisionAsset | schema + migration | +50 | 2 |
| `/api/projects/[id]/revisions/*` | 3-5 route mới | 400-500 | 0 |
| Freeze logic (kết hợp `.idf`/`.idfp` snapshot mode) | `lib/project-revision.ts` mới | 200-300 | 0 |
| UI Freeze button + list revisions | components/ (out of scope) | +? | 0 |
| Test | 2 test file | 300 | 0 |

**Ước tổng**: ~5-8 file, ~1000-1100 dòng. 2 Prisma migration.

### Risks

- **R-Q6-01**: Nếu file snapshot bị mất (`./uploads/revisions/`) — revision mất. Cần backup off-site cho revisions.
- **R-Q6-02**: Live editing có thể vô tình đè lên frozen revision (nếu user không hiểu). Cần luật rõ: revision là read-only, có thể "roll back" nhưng phải tạo revision mới.
- **R-Q6-03**: Frozen revision to (deck + 3D + BOQ) — có thể MB đến GB. Cần compress + verify integrity.

### Unknowns

- **U-Q6-01**: Frozen revision có bao gồm 3D scene (mesh) không? Nếu 3D là derived (không persist), có thể regenerate. Nhưng cần chốt.
- **U-Q6-02**: Có mối liên hệ với `FlowVersion` (đã có snapshot Flow)? Hoà quyết: FlowVersion trở thành 1 phần của ProjectRevision, hay giữ song song.
- **U-Q6-03**: BOQ overrides freeze thế nào? Snapshot phiên bản overrides tại lúc freeze.

---

## Q7 · Zustand có quyền mutate canonical state trực tiếp không

### Current state

**Đo tại Audit Q0 §11, §3.6**:
- **19 Zustand store** (bản đồ 18/08 ghi 3 — sai). Đo được: `useCadStore`, `useFlowStore`, `useCollabStore`, `useVitalsUi`, `useSaveStatus`, `useLeaveConfirm`, `useRenderModeStore`, `useHomeSearch`, `useSmartSelectStore`, `useCuaSoCongCuUi`, `usePlayStatus`, `useCadLiveStatus`, `useWarpStore`, `useToolModeUi`, `useTool3D`, `useSketchStore`, `useTree3DUi`, `useProjectPresence`, `useLockScreen`.
- `useCadStore.setState()` — có 16 occurrence direct setState (grep). Cấu trúc `useCadStore` (`lib/cad/store.ts` 1037 dòng, chưa đọc full).
- **Runtime store MUTATE Doc trực tiếp** — chưa qua "command" trung gian rõ ràng. Có `lib/cad/commands.ts` (chưa đọc), nhưng grep cho thấy setState direct 16 chỗ ⇒ chưa 100% command pattern.
- **162 file dùng useCadStore/useFlowStore** — surface rộng.
- Không có "Domain Event" khái niệm rõ. Không có event bus.

### Decision

> **KHÔNG.**
> Zustand là: runtime state · UI state · selection · tool state · panel state · temporary editing projection.
> Canonical mutation phải đi:
>
> ```
> USER / AI / ML INTENT
>         ↓
> COMMAND
>         ↓
> DETERMINISTIC CORE
>         ↓
> VALIDATE
>         ↓
> CANONICAL MUTATION
>         ↓
> DOMAIN EVENT
>         ↓
> ZUSTAND / UI UPDATE
> ```
>
> Không để `store.setState()` trở thành business authority.

### Why

- Đảm bảo mọi thay đổi canonical qua **rule/policy** (khớp OS 18/08 §Deterministic Core).
- AI/ML không thể ghi thẳng vào geometry/data (khớp luật OS 18/08 #8).
- Domain Event cho phép: audit, replay, sync, subscribe → nền cho ADR-Q8 (DesignDecision) và ADR-Q6 (Frozen Revision).

### Code impact

**Cần bổ sung**:
- `lib/cad/commands.ts` (đã có — chưa đọc) — mở rộng thành **Command pattern chính thức**:
  - Type `CadCommand = { kind, params, invoke, undo }`.
  - Executor: `executeCommand(cmd, ctx)` — validate + call deterministic core + emit event + update store.
- **Deterministic Core**: hàm THUẦN theo domain (đã có nhiều: `lib/cad/geometry.ts`, `lib/cad/hosting.ts`, `lib/cad/poche.ts`, `lib/three/build-recipe.ts`, ...). Cần rà xem có tất cả không qua Zustand không.
- **Validate**: `lib/cad/standards/*` đã có 3074 dòng rules — nhưng chưa integrate vào command pipeline (bản đồ 18/08 §5.1 #4).
- **Domain Event**: Event Bus mới `lib/events.ts`?
  - Kiểu: `type DomainEvent = { kind, at, payload }`.
  - Subscribe: `useEventSubscribe(kind, handler)`.
  - Publish: `emitEvent(event)`.
- Zustand chuyển thành **subscriber** — nhận domain event → update UI.

**Files phải sửa**:
- `lib/cad/store.ts` (1037 dòng): refactor rất lớn. 16 setState direct → chuyển qua command.
- `lib/store.ts` (1257 dòng — `useFlowStore`): tương tự.
- **162 file dùng useCadStore/useFlowStore**: rà xem chỗ nào đọc (giữ), chỗ nào write (chuyển qua command).
- Command definitions: cần định nghĩa mỗi command với schema Zod.
- Event bus: 1 file mới ~200 dòng.
- Deterministic core validation: kết nối `lib/review/*` (2 tier LUẬT + GÓP Ý — chốt 07/08) vào command pipeline.

### Data impact

- 0 Prisma migration ban đầu (data không đổi).
- Nếu emit domain event và log vào Prisma cho audit → thêm `DomainEventLog { id, kind, at, projectId, userId, payload }`. Optional.

### Migration impact

🔴 **LARGE-XLARGE**.

Đây là **refactor kiến trúc lớn** — 162 file surface, 16 setState direct, cần rewrite từng use case.

| Việc | File sửa | Dòng ước | Migration Prisma |
|---|---|---|---|
| Command pattern skeleton | `lib/cad/command-runtime.ts` mới | 300 | 0 |
| Event bus | `lib/events.ts` mới | 200 | 0 |
| Định nghĩa commands cho CAD (100+ command khả dĩ) | `lib/cad/commands/*.ts` phân file | 1500-3000 | 0 |
| Refactor `useCadStore` thành pure runtime | `lib/cad/store.ts` | -500/+800 (~net +300) | 0 |
| Refactor `useFlowStore` | `lib/store.ts` | -300/+400 (~net +100) | 0 |
| Cắm `lib/review/luat` vào command pipeline (validate) | `lib/cad/command-runtime.ts` + review | +200 | 0 |
| Update 100-160 file readers/writers | 100-160 file (rà từng file) | +50 mỗi file trung bình | 0 |
| Optional: DomainEventLog Prisma | schema + migration | +30 | 1 |
| Test | 20+ test file mới/sửa | +2000 | 0 |

**Ước tổng**: ~150-200 file sửa, ~6000-10000 dòng thay đổi. 0-1 Prisma migration.
**Thời gian**: 6-12 tuần cho 1 dev fulltime (dự đoán không chắc — phụ thuộc scope commands).

### Risks

- **R-Q7-01**: Refactor 1037 dòng `useCadStore` — nếu không giữ backward compat, mọi editor breaks. Cần strangler pattern: giới thiệu command mới song song, migrate từng use case, xoá path cũ khi hết ref.
- **R-Q7-02**: Định nghĩa command đủ (100+ command) sẽ tốn thời gian. Có thể chọn scope hẹp: chỉ CAD editor Doc mutations trước; UI/tool state (`useSmartSelectStore`, `useToolModeUi`) giữ setState direct (vì đây đúng là "UI projection" không phải "canonical").
- **R-Q7-03**: Validate không tất định (nếu gọi review AI) → không thể là hard-gate. Chỉ luật máy được gate. AI gợi ý cảnh báo.
- **R-Q7-04**: Event bus subscribe/emit có overhead. Cần benchmark.

### Unknowns

- **U-Q7-01**: Scope refactor — chỉ CAD Doc mutations (khả thi ~4-6 tuần) hay toàn 19 store (12+ tuần)? T đề xuất scope hẹp trước (chỉ Doc mutations), UI store giữ.
- **U-Q7-02**: DomainEventLog có bắt buộc? Nếu chỉ cho audit thì optional. Nếu cần cho ADR-Q8 (Design Decision) và ADR-Q6 (Frozen Revision) thì bắt buộc.
- **U-Q7-03**: Command replay (event sourcing full) — có làm không? Nếu có, cần event = deterministic (không có `at: Date.now()` tự do). T đề xuất KHÔNG event sourcing full (quá tốn), chỉ audit log.

---

## Q8 · DesignDecision có cần canonical persistence không

### Current state

**Đo tại Audit Q0 §12**:
- **KHÔNG có DesignDecision model** trong Prisma (21 model, không có).
- **Undo history**: có ở CAD (`lib/cad/commands.ts` — chưa đọc chi tiết), grep chỉ 1 file dùng "undo/history" pattern.
- **Version history file**: `.idf` mỗi lần export → có `meta.modifiedAt`.
- **FlowVersion**: snapshot per Run (11 file dùng), có `createdAt`, không có "vì sao đổi B1 → B2".
- **AI generated vs human modified**: có cờ `measured|inferred|verified` tại `from-photo.ts:34-35` cho `.idfc` cấu kiện, và `MaterialPbr.suyDoan` — nhưng chỉ cho 2 case cụ thể, không phổ cập.
- **Selected vs Rejected**: KHÔNG có model.
- **Approved vs Client Approved**: KHÔNG có model.

### Decision

> **CÓ. DesignDecision là first-class domain.**
> Decision cần lưu được: ai quyết · cái gì đổi · trước/sau · lý do · evidence · trạng thái · quan hệ với decision trước · timestamp.
>
> Status tối thiểu: `proposed | selected | rejected | approved | clientApproved`.
>
> Decision Log phải: portable · archive được · restore được · query được · dùng cho Creative Timeline · dùng cho AI learning · dùng cho audit/approval.
>
> Prisma có thể index, nhưng **không được để Decision history chỉ sống trong một DB cục bộ**.

### Why

- Vision OS 18/08 §"Creative Timeline" cần Decision history.
- ADR-Q6 (Frozen Revision) cần Decision để nói *"vì sao freeze"*.
- ADR-Q9 (DNA delta learning) cần Decision để phân biệt "AI generated → human modified" — signal cho DNA.

### Code impact

**Cần bổ sung**:
- Prisma model `DesignDecision`:
  ```
  DesignDecision {
    id, projectId, kind, targetEntityId?, targetMatId?,
    proposedBy (user/ai model),
    reason (text),
    evidence (JSON — ref to prompts, images, docs),
    status (proposed|selected|rejected|approved|clientApproved),
    beforeState (JSON — snapshot),
    afterState (JSON — snapshot),
    parentDecisionId (self-reference),
    createdAt, updatedAt
  }
  ```

- **Portable Decision Log** ngoài DB: file JSON `uploads/decisions/<projectId>/decisions.jsonl` (append-only) — mirror của Prisma, cho backup/restore.

- **Integration**:
  - Với ADR-Q7 command pattern: mỗi command tạo Decision (proposed).
  - Với ADR-Q6 Frozen Revision: mỗi revision có snapshot của tất cả Decision (status=approved).
  - Với ADR-Q9 DNA: DNA distill từ (approved - rejected) deltas.

- **UI**: Creative Timeline component (out of scope ADR — implement sau).

**Files phải sửa/tạo**:
- Prisma migration mới: DesignDecision + có thể ProjectRevisionDecisionSnapshot (link n-m).
- `lib/decisions/store.ts` mới: read/write Prisma + append JSONL file mirror.
- `lib/decisions/types.ts` mới.
- `/api/projects/[id]/decisions/*` route.
- Integration point với command pattern: mỗi command → decision auto proposed.
- Test.

### Data impact

- 1 Prisma migration lớn: DesignDecision + có thể có RevisionDecisionLink.
- File mirror: `uploads/decisions/<projectId>/decisions.jsonl` — mỗi decision 1 dòng JSON.
- Backfill: KHÔNG cần backfill dữ liệu cũ (chưa có decision nào trước đây).

### Migration impact

🔴 **LARGE**.

| Việc | File sửa | Dòng ước | Migration Prisma |
|---|---|---|---|
| Prisma DesignDecision | schema + migration | +50 | 1 |
| Type + validator | `lib/decisions/types.ts` mới | 200 | 0 |
| Store (Prisma + JSONL mirror) | `lib/decisions/store.ts` mới | 300 | 0 |
| `/api/projects/[id]/decisions/*` route | 3-5 file mới | 500 | 0 |
| Integration với command pattern (ADR-Q7) | `lib/cad/command-runtime.ts` (bổ sung) | +150 | 0 |
| Integration với ProjectRevision (ADR-Q6) | `lib/project-revision.ts` (bổ sung) | +100 | 0 |
| Test | 3 test file | 500 | 0 |

**Ước tổng**: ~10 file, ~1800-2000 dòng mới. 1 Prisma migration.

**Phụ thuộc**: ADR-Q1 (Project Manifest) + ADR-Q6 (Frozen Revision) + ADR-Q7 (Command pattern) chốt trước.

### Risks

- **R-Q8-01**: Decision granularity — mỗi command tạo 1 decision → phồng nhanh. Có thể cần "auto-consolidate" (merge deposits liên tiếp giống nhau).
- **R-Q8-02**: `evidence` JSON có thể chứa base64 lớn (VD reference image) — làm decision to. Cần luật: evidence có url ref, không embed nếu > 100KB.
- **R-Q8-03**: Portable — nếu dùng đúng JSONL mirror thì portable. Nhưng nếu chỉ Prisma → phụ thuộc dev.db cục bộ. **Cần đảm bảo JSONL luôn sync sau mỗi write** — race condition nguy hiểm.

### Unknowns

- **U-Q8-01**: `beforeState`/`afterState` snapshot — cỡ nào? Toàn Doc là quá to. Chỉ diff (JSON Patch)? T nghiêng JSON Patch — nhỏ hơn nhiều.
- **U-Q8-02**: Ai được emit Decision? User + AI (proposedBy). Có emit ngầm khi command chạy (auto proposed) hay chỉ khi user explicit "flag as decision"? T nghiêng auto proposed cho tất, UI cho phép mark quan trọng.
- **U-Q8-03**: Client approval — cần workflow riêng (email/link/OTP)? Ngoài phạm vi ADR.

---

## Q9 · Design DNA scope thế nào

### Current state

**Đo tại Audit Q0 §13**:
- **CHỈ Project scope** hiện có: `uploads/dna/<projectId>/cards.json` (`dna/store.ts:21`).
- KHÔNG có Person DNA, Studio DNA, Client DNA.
- DistillEngine generic (`lib/distill/engine.ts:60` `DistillEngine.distill`) — nhưng grep: **0 caller ngoài test**. Nghĩa là **chưa cắm điện**.

> ⚠️ ĐÍNH CHÍNH 19/08 (FINAL-AUDIT Gate C): DistillEngine ĐÃ có 2 production caller — `CuaSoThaoLuan.tsx:182` · `DesignDnaCardPanel.tsx:297`. Dòng "0 caller" là số đo cũ.
- 5 file dùng DesignDnaCard functions (readDnaCards/upsertDnaCard/deleteDnaCard).
- Learning signal: KHÔNG. `DistilledField.trangThai` chỉ 2 nấc `inferred|verified`, không có "corrected".

### Decision

> **4 scope, phối hợp thành Contextual DNA.**
>
> ```
> Studio DNA
> Person DNA
> Client DNA
> Project DNA
>         ↓
> Contextual DNA
> ```
>
> DNA không chỉ học final output.
> Learning signal mục tiêu:
>
> ```
> AI generated → Human modified → DELTA → Selected / Rejected → Approved → Client Approved → Built / Delivered
> ```
>
> Không coi mọi hành động là signal ngang nhau.

### Why

- Vision OS 18/08 §4c "Company Design Intelligence" cần Studio DNA (500 project, 50k material records, ...).
- Person DNA hỗ trợ career intelligence (§4e OS).
- Client DNA hỗ trợ preference learning cross-project.
- Contextual DNA khi start dự án mới: gộp DNA của Studio + Designer + Client → seed cho DNA dự án.

### Code impact

**Cần bổ sung**:
- Prisma models mới hoặc mở rộng cách persist:
  - **Option A**: 4 model Prisma riêng: `PersonDna`, `StudioDna`, `ClientDna`, `ProjectDna`. Query dễ, phức tạp schema.
  - **Option B**: 1 model `DnaCard { id, scope: 'person'|'studio'|'client'|'project', scopeId, cards: JSON }`. Đơn giản hơn.
  - T nghiêng Option B — additive, dễ mở rộng scope thứ 5 sau này.

- **Contextual DNA resolver**: `resolveContextualDna(projectId, userId, clientId?)` → gộp 4 scope theo priority.

- **Learning signal integration**: khi Decision `status = approved` (ADR-Q8) → có "delta" (before → after) → distill vào DNA scope tương ứng.
  - Ai correction → Studio hoặc Person DNA (tuỳ config).
  - Client approve → Client DNA.

- **Cắm điện DistillEngine**: hiện 0 caller. Cần integrate qua Decision events (ADR-Q8) hoặc explicit "distill this decision" button.

**Files phải sửa/tạo**:
- Prisma migration: `DnaCard` model (hoặc 4 model riêng).
- `lib/dna/store.ts` (86 dòng): mở rộng để đọc/ghi theo 4 scope.
- `lib/dna/resolver.ts` mới: Contextual DNA merge logic.
- `lib/distill/*` (60 dòng engine.ts): cắm với Decision events.
- `/api/projects/[id]/dna` (đã có): mở rộng cho scope khác.
- Test.

### Data impact

- 1 Prisma migration mới.
- File mirror (nếu giữ JSON per-scope): `uploads/dna/<scope>/<scopeId>/cards.json`.
- Backfill: Project DNA hiện tại giữ nguyên (đã có `uploads/dna/<projectId>/cards.json`).

### Migration impact

🟡 **MEDIUM**.

| Việc | File sửa | Dòng ước | Migration Prisma |
|---|---|---|---|
| Prisma DnaCard model | schema + migration | +30 | 1 |
| Mở rộng `lib/dna/store.ts` cho 4 scope | 1 file | +200 | 0 |
| `lib/dna/resolver.ts` (Contextual DNA merge) | 1 mới | 300 | 0 |
| Cắm DistillEngine vào Decision events | `lib/distill/engine.ts` + integration | +150 | 0 |
| Route mở rộng | `/api/projects/*` | +200 | 0 |
| Test | 2 test file | 400 | 0 |

**Ước tổng**: ~6 file, ~1200-1400 dòng mới. 1 Prisma migration.

**Phụ thuộc**: ADR-Q8 (Decision) chốt trước.

### Risks

- **R-Q9-01**: 4 scope × N users × M projects → data phồng nhanh. Cần luật: DNA cards tối đa/scope, auto-consolidate khi vượt.
- **R-Q9-02**: Learning signal chỉ từ Approved deltas nhưng cần đủ Signal. Nếu 1 studio có 5 project × 10 approved decision → chỉ 50 signal, không đủ ML. Cần chờ scale.
- **R-Q9-03**: Person DNA → privacy. Users có thể muốn opt-out. Cần switch per user.
- **R-Q9-04**: Client DNA → GDPR/dữ liệu khách hàng. Nhạy cảm. Cần chốt policy.

### Unknowns

- **U-Q9-01**: DNA cards trong scope nào áp lên Project? Priority: Client override Studio override Person override generic (T đề xuất). Cần Hoà chốt.
- **U-Q9-02**: Contextual DNA sync giữa devices? Nếu Studio DNA cần cross-team → cần cloud sync. Ngoài phạm vi.
- **U-Q9-03**: Learning signal weight — Approved = 1.0, Rejected = -0.5 (ám chỉ *"không như thế nữa"*)? Cần thử nghiệm.

---

## MIGRATION DEPENDENCY GRAPH

```
                    ┌──────────────────────┐
                    │  ADR-Q1              │
                    │  Domain Authority    │
                    │  + Project Manifest  │
                    └──────────┬───────────┘
                               │
      ┌─────────┬──────────────┼──────────────┬─────────────┐
      │         │              │              │             │
      ▼         ▼              ▼              ▼             ▼
┌─────────┐┌─────────┐  ┌─────────────┐┌──────────┐  ┌──────────┐
│ ADR-Q2  ││ ADR-Q4  │  │ ADR-Q6      ││ ADR-Q7   │  │ ADR-Q9   │
│ Prisma  ││ Library │  │ Frozen      ││ Command  │  │ DNA scope│
│ vs .idf ││ binary  │  │ Revision    ││ pattern  │  │          │
└────┬────┘└────┬────┘  └──────┬──────┘└─────┬────┘  └──────┬───┘
     │          │              │             │              │
     ▼          ▼              │             │              │
┌─────────┐┌─────────┐         │             │              │
│ ADR-Q3  ││ ADR-Q5  │         │             │              │
│ IDFC    ││ Files ↔ │         │             │              │
│ template││ Library │         │             │              │
│ +over-  │└─────────┘         │             │              │
│ rides   │                    │             │              │
└─────────┘                    │             │              │
                               └──────┬──────┘              │
                                      │                     │
                                      ▼                     │
                              ┌──────────────┐              │
                              │ ADR-Q8       │◄─────────────┘
                              │ DesignDecision│
                              │ (first-class) │
                              └──────────────┘
```

**Đọc**:
- ADR-Q1 là nền → tất cả phụ thuộc.
- ADR-Q2 blocks ADR-Q3 (IDFC template + override cần snapshot logic).
- ADR-Q4 blocks ADR-Q5 (Files → Library cần content hash + provenance).
- ADR-Q6 + ADR-Q7 blocks ADR-Q8 (Decision cần Command pattern để capture, và Frozen Revision là consumer chính của Decision).
- ADR-Q9 depends on ADR-Q8 (DNA distill từ Decision deltas).

---

## THỨ TỰ REFACTOR AN TOÀN (khi chuyển sang thi công)

Sau khi tất cả 9 ADR đều Accepted, thi công theo thứ tự:

### Phase 1 — Foundation (nền cho tất)

**Wave 1a — Docs & Manifest (0 code IF)**
- Viết `docs/PROJECT-MANIFEST.md` (ADR-Q1)
- Bổ sung docstring 4-5 file surface (`disk-sync.ts`, `dna/store.ts`, `idfc-store.ts`, `boq-overrides.ts`)
- Rủi ro: 🟢 LOW

**Wave 1b — Content Hash + Provenance (ADR-Q4 cách nhẹ trước)**
- Prisma migration: thêm `LibraryAsset.contentHash` + `origin` + `originSource`
- Backfill hash script
- Cập nhật `/api/library/ingest` để tính hash khi upload
- Chưa dùng AssetBlob model (giữ path)
- Rủi ro: 🟡 MEDIUM

**Wave 1c — Snapshot mode `.idf` (ADR-Q2)**
- Bump IDF_VERSION 2→3, thêm `productSpecSnapshots?` field
- `exportIdf(mode: 'live' | 'share')`
- Hydrate snapshot khi Prisma không có spec
- Test round-trip
- Rủi ro: 🟡 MEDIUM

### Phase 2 — Structural (thay đổi model)

**Wave 2a — ProjectFile riêng (ADR-Q5)**
- Prisma migration: `ProjectFile` model
- `/api/files/*` mới, refactor `/api/library/ingest` để upload → ProjectFile
- Promote endpoint
- Rủi ro: 🟡 MEDIUM (users cần adjust)

**Wave 2b — IDFC Override cấp entity (ADR-Q3)**
- Thêm `BlockEntity.overrides?`
- Merge helper `resolveInstanceSpec`
- Đọc merged spec ở build 3D + BOQ + Present
- Test
- Rủi ro: 🟡 MEDIUM

**Wave 2c — Command Pattern chỉ CAD Doc (ADR-Q7 scope hẹp)**
- Command runtime + event bus
- Chuyển 16 setState direct trong CAD sang command
- Cắm luật validate (`lib/review/luat/cad.ts`)
- Rủi ro: 🔴 HIGH (surface 100+ file, cần strangler)

### Phase 3 — Advanced Domains

**Wave 3a — DesignDecision model (ADR-Q8)**
- Prisma migration DesignDecision
- Store + JSONL mirror
- Integration với Command Pattern (auto-proposed)
- Rủi ro: 🟡 MEDIUM

**Wave 3b — Frozen Revision (ADR-Q6)**
- Prisma migration ProjectRevision + ProjectRevisionAsset
- Freeze logic (kết hợp `.idf` share mode + `.idfp` + BOQ + zip)
- UI Freeze button
- Rủi ro: 🟡 MEDIUM

**Wave 3c — 4-scope DNA (ADR-Q9)**
- Prisma migration DnaCard multi-scope
- Contextual DNA resolver
- Cắm DistillEngine vào Decision events
- Rủi ro: 🟡 MEDIUM

### Phase 4 — Optional Cleanup

- AssetBlob model riêng (ADR-Q4 cách sạch) — nếu cần dedupe query nặng
- Full command pattern (ADR-Q7) — mở rộng ra 19 store nếu Phase 2c đạt target
- DomainEventLog (ADR-Q7 audit)

### Timeline ước lượng

| Phase | Wave | Effort (1 dev fulltime) |
|---|---|---|
| 1a | 0.5 tuần |
| 1b | 2 tuần |
| 1c | 2 tuần |
| 2a | 3 tuần |
| 2b | 3 tuần |
| 2c | **6-8 tuần** (bottleneck) |
| 3a | 3 tuần |
| 3b | 3 tuần |
| 3c | 3 tuần |
| 4 | (optional, 4-6 tuần) |

**Tổng Phase 1-3**: ~26-30 tuần với 1 dev fulltime.

---

## MÂU THUẪN LỘ RA (code hiện tại vs quyết định) — CHỜ HOÀ QUYẾT

### M-01: `lib/gateway/` tên đã dùng — không phải AI Gateway

- **Code**: `lib/gateway/` (capabilities.ts 96 + detect.ts 134 + route.ts 47) — **format gateway** (detect .dxf/.dwg/.pdf/... → capability).
- **Decision (nguyên tắc bao trùm 19/08)**: *"AI Gateway"* mới cần xây.
- **Mâu thuẫn**: 2 nghĩa "Gateway". Rename `lib/gateway/` thành `lib/format-router/` hay giữ và đặt `lib/ai-gateway/`? Hoà quyết.

> ✅ **RESOLVED 19/08 (Hoà chốt qua trắc nghiệm, DECISION CONFLICT C1)**: GIỮ code nguyên; từ điển
> chốt "Gateway" trần = AI Gateway; `lib/gateway/` gọi là **Format Router** trong mọi docs; AI Gateway
> tương lai = `lib/ai/gateway.ts` (Wave 2). Ghi tại `IF-ARCHITECTURE-BLUEPRINT.md` B3.

### M-02: `lib/ai/text-tier.ts` — đã có "AI Gateway" một phần

- **Code**: `lib/ai/text-tier.ts` (88 dòng) — điều phối 3 tầng cho **text**: Cloud NVIDIA → Ollama → Lõi tất định.
- **Decision**: AI Gateway thống nhất provider/runtime.
- **Mâu thuẫn**: text-tier là "AI Gateway" partial cho text. Có mở rộng thành đường chung cho vision/image/audio (thay thế `from-photo.ts` gọi thẳng `NVIDIA_VLM_MODEL`) không? Hoà quyết.

### M-03: `BlockEntity.variant?` đã có, tương tự override

- **Code**: `BlockEntity.variant?: string` — chọn 1 variant có sẵn trong template `.idfc`.
- **Decision Q3**: Instance có override finish/size riêng.
- **Mâu thuẫn**: variant (pick từ preset) khác override (freeform). Q3 chốt override thì variant vẫn tồn tại? Hoà quyết: overrides thắng variant, hay coexist.

> ✅ **RESOLVED 19/08 (Hoà chốt qua trắc nghiệm, DECISION CONFLICT C2)**: **overrides THẮNG variant**.
> Effective = template → variant → overrides đè cuối. Variant = điểm xuất phát, override = chỉnh sau
> cùng của người dùng. Ghi tại `IF-ARCHITECTURE-BLUEPRINT.md` B7/B10.

### M-04: DistillEngine chưa cắm điện

- **Code**: `lib/distill/engine.ts` (60 dòng) đã có, **0 caller ngoài test**.

> ⚠️ ĐÍNH CHÍNH 19/08 (FINAL-AUDIT Gate C): DistillEngine ĐÃ có 2 production caller — `CuaSoThaoLuan.tsx:182` · `DesignDnaCardPanel.tsx:297`. Dòng "0 caller" là số đo cũ.

- **Decision Q9**: DNA 4 scope, cắm DistillEngine với Decision events.
- **Mâu thuẫn**: engine có sẵn nhưng chờ trigger. Có cần refactor engine không (thêm event listener) hay giữ engine pure + caller wrap? Hoà quyết.

### M-05: `lib/materials/resolve.ts` có mà chưa cắm điện

- **Code**: `lib/materials/resolve.ts:52` `getMaterial()` trả đủ ba mặt PBR·thương mại·hatch 2D. **0 caller ngoài test**.
- **Decision Q3 + Q6**: Live representation derived từ canonical → resolve chính là live-derive.
- **Mâu thuẫn**: đường thẳng có sẵn để làm "một vật ba mặt" nhưng chưa cắm. Có nên cắm ngay trong Phase 1 không? T đề xuất CÓ — ROI cao.

### M-06: `lib/cad/model.ts` 1466 dòng — cần refactor cho ADR-Q3 và ADR-Q7

- **Code**: `lib/cad/model.ts` 1466 dòng chứa tất Entity types.
- **Decision Q3**: thêm `overrides` field. **Decision Q7**: command pattern.
- **Mâu thuẫn**: 1466 dòng là barrier. Có nên chia file trước không? T đề xuất giữ 1 file, add ọve, sau đó nếu quá lớn mới chia.

### M-07: 19 Zustand store — bản đồ tay 18/08 SAI (ghi 3)

- **Code**: 19 store measurable.
- **Bản đồ tay**: 3.
- **Mâu thuẫn**: đã fix trong Audit Q0 §3.6 nhưng cần update lại bản đồ tay `docs/BAN-DO-KIEN-TRUC-2026-08-18.md`. Đây là docs, không code. Hoà đồng ý sửa docs? (T nghiêng CÓ — docs sai kéo phiên sau lệch).

---

## APPENDIX A · Số grep evidence

Được lấy trong phiên viết ADR (mốc `3da4b8c`):

| Query | Count |
|---|---|
| `prisma.project.*` file | 12 |
| `exportIdf|importIdf` file | 16 |
| `exportIdfp|importIdfp` file | 5 |
| `.specId` file | 20 |
| `.specId` occurrences | 53 |
| ProductSpec refs file | 43 |
| BlockEntity/HatchEntity file | 65 |
| idfc-store file | 4 |
| LibraryAsset refs file | 19 |
| uploads/ path refs | 7 |
| app/library file | 3 |
| app/files file | 5 |
| lib/filemanager file | 7 |
| FlowVersion/graphJson file | 11 |
| useCadStore/useFlowStore file | 162 |
| setState direct | 16 |
| DesignDnaCard callers | 5 |
| DistillEngine callers | 0 |
| localStorage keys distinct | ~20 |
| IndexedDB stores | 5 |
| FileSystem API files | 3 |

---

## APPENDIX B · Ranh giới thi công (bắt buộc khi bắt đầu code)

Khi Hoà + T duyệt 9 ADR xong, Claude được đụng Prisma và persistence với ràng buộc:

1. **Không sửa Prisma migration cũ** — chỉ thêm migration mới.
2. **Không xoá field đã deprecated mà còn nơi đọc** (KS4 "lùi được"). `larkProjectCode`: 13 file đọc → không xoá lúc này.
3. **Không đổi hình dạng `.idf` v2 / `.idfp` v1 / `.idfc` v3** mà không bump version + viết migration.
4. **Không đổi tên khoá `interiorflow.*` trong localStorage** (bản đồ 18/08 §Ranh giới).
5. **Không đổi tên `.idf`/`.idfp`/`.idfc`** — quá nhiều nơi dùng.
6. **Mọi ADR có "cần Hoà quyết" (Unknown) → chờ chốt trước khi thi công**.
7. **Không ship Phase 2c (Command Pattern) mà chưa có test-coverage đủ** — refactor to nhất, rủi ro to nhất.
8. **Mọi migration Prisma → chạy `sqlite3 dev.db ".backup 'ten'"` trước khi migrate** (luật CLAUDE.md §An toàn dữ liệu).

---

## Cross-references

- Audit gốc: [`AUDIT-Q0-SOURCE-OF-TRUTH-LIBRARY-IDFC-2026-08-19.md`](AUDIT-Q0-SOURCE-OF-TRUTH-LIBRARY-IDFC-2026-08-19.md)
- Bản đồ tay: [`BAN-DO-KIEN-TRUC-2026-08-18.md`](BAN-DO-KIEN-TRUC-2026-08-18.md)
- Hiến pháp OS: [`IF-KIEN-TRUC-OS.md`](IF-KIEN-TRUC-OS.md)
- Sổ chốt: [`00-CHOT.md`](00-CHOT.md)

---

## Q14 · Mô hình dữ liệu & đồng bộ của IF

> **Chốt 27/08/2026 · `ACCEPTED` · Hoà quyết.**
> Nguồn bằng chứng: [`06-SYNC-OPTIONS.md`](design-candidate/IF-ARCH-LOCAL-FIRST-LARK-001/06-SYNC-OPTIONS.md)
> (ba đường A/B/C, đo trên HEAD `a08378a`). Quyết định này **chốt Đường B**.

### Current state

Đo được, không suy luận:

- **SQLite một tệp**, `provider = "sqlite"` (`prisma/schema.prisma:16`). Không server, không cổng
  mạng, không dịch vụ đám mây nào. Trong bản Electron đóng gói, tệp nằm ở
  `app.getPath('userData')/dev.db` (`electron/main.js:118-129`) — **trên máy người dùng**.
- **Không có tầng đồng bộ nào**. `06-SYNC-OPTIONS.md` khai thẳng: hiện trạng là **Đường A ·
  LOCAL-ONLY**, và cảnh báo *"local-first không có nghĩa local-only — phải có đường đi tiếp,
  nhưng không được giả vờ đã có"*.
- **Chưa có khái niệm tenant.** `grep tenantId` toàn schema = 0. Phạm vi duy nhất đang chạy là
  `ProjectMember` quanh cây `Project`; sáu bảng nằm **ngoài** nó (`LibraryAsset`, `ProductSpec`,
  `AssetRepresentation`, `ChatMessage`, `LarkPersonRef`, roster `User`).
- **Lark**: `POST /api/atlas-materials/sync` là đường **PULL-ONLY**, không có route ghi ngược, và
  **chưa chạy thật lần nào** (`0` nơi gọi, tên cột còn là placeholder chưa xác minh).
- Bốn cửa phạm vi đã dựng nhưng **đang TẮT sau cờ**: `IF_LIBRARY_SCOPE_ENFORCE`,
  `IF_PROJECT_SCOPE_ENFORCE`, `NEXT_PUBLIC_IF_IDFC_IDENTITY`, `IF_PERSIST_XUATXU`.

### Decision

**IF = LOCAL-FIRST + OPT-IN SELECTIVE SYNC.** Bảy điều, tất cả đều ràng buộc:

**① Máy người dùng giữ bản gốc.** Bản gốc, cache, render trung gian, texture/model/video nặng, và
mọi dữ liệu **chưa được chọn chia sẻ** — nằm trên máy. Đây là mặc định, không phải tuỳ chọn.

**② Đồng bộ NHẸ, theo quyền và theo VÙNG.** Chỉ những vùng này được rời máy khi người dùng bật:
identity/account · project metadata · cấu trúc · quyết định · task/note · thông số · version ·
manifest/hash · provenance · permission · thumbnail/preview.
**Không** đồng bộ mặc định: bản vẽ, ảnh, tệp dự án, asset nặng.

**③ Library/Knowledge chung đi bằng CATALOG, không bằng asset.** Đồng bộ: metadata + quyền +
nguồn + version + hash + preview. **Asset gốc nặng tải theo yêu cầu**, và **chỉ khi người dùng
có quyền** — quyền kiểm TRƯỚC khi byte rời máy chủ (luật đã thi hành ở
`app/api/comments/image/[id]/route.ts` và `app/api/asset-representation/route.ts`).

**④ Năm scope, tách bạch, không lẫn:**
`Global Product` · `Studio/Tenant` · `Project` · `Personal` · `Candidate/Quarantine`.
⛔ **Builder OS memory / Drive / agent / session TUYỆT ĐỐI không lẫn vào Product Knowledge.**
Bộ nhớ của cỗ máy dựng ra sản phẩm không phải là tri thức của sản phẩm. Lẫn một lần là sản phẩm
mang theo dấu vết của một studio cụ thể — vi phạm thẳng LUẬT NỀN TẢNG (IF trung tính, toàn cầu).

**⑤ Lark là EXTERNAL CONNECTOR.** Không phải nguồn chân lý, không phải backend IF. Dữ liệu Lark
vào IF qua cửa nhập có preview + xác nhận của người, không đồng bộ hai chiều tự động.

**⑥ Không tự đồng bộ toàn bộ. Không ghi đè im lặng.**
Xung đột **metadata**: hiện rõ + có đường khôi phục, **cấm last-writer-wins**.
Asset **nặng**: version bất biến + hash, **preview trước khi tải**, kiểm nguồn gốc và quyền trước.

**⑦ Cloud Sync là LỚP TƯƠNG LAI, bật dần qua adapter + feature flag.**
⛔ **Không cài Supabase. Không chuyển database lúc này.** SQLite ở lại.

### Why

- **Đường A không đủ, Đường C quá sớm.** `06-SYNC-OPTIONS.md` đo rồi: A "đúng cho studio nhỏ,
  **không đủ** cho bài toán People & Organization quy mô lớn"; C mở bề mặt tấn công mạng và chi
  phí vận hành mà hôm nay chưa ai cần.
- **Cái đang chặn không phải loại database.** Ba thứ chặn thật là: chưa có `tenant`, bốn cờ phạm
  vi vẫn tắt, sáu bảng ngoài mô hình quyền. Đổi sang Postgres/Supabase lúc này chỉ **đổi chỗ
  chứa**, không đóng được lỗ nào trong ba lỗ đó — và còn thêm một tầng phải bảo mật.
- **Catalog-trước-asset là cách duy nhất giữ được cả hai vế.** Thư viện chung cần tìm kiếm được
  từ mọi máy; asset gốc thì nặng và có ràng buộc bản quyền (Lane C đo: bản ghi vật liệu hôm nay
  **trắng rights/license**). Đồng bộ metadata + hash + preview cho phép tìm, còn byte thì đi sau
  một lần kiểm quyền.
- **Cấm last-writer-wins cho metadata** là bài học đã trả giá, không phải sở thích: cùng luật đã
  chốt cho HRM import (preview + human confirm), và cùng lý do `atlas-materials/sync` bị chặn —
  upsert thẳng không preview thì **ghi giá sai vào BOQ, âm thầm**.
- **Tách Builder OS khỏi Product Knowledge** đóng lại đúng cái lỗ mà `knowledge/ttt-design-system`
  từng mở: tài sản của MỘT studio nằm trong sản phẩm bán ra.

### Code impact

| việc | nơi | trạng thái |
|---|---|---|
| Phạm vi dự án (cửa duy nhất) | `lib/server/access.ts` `projectScope`/`visibleProjectIds`/`projectScopeWhere` | ✅ có, proof 19/19 |
| Phạm vi tài nguyên ngoài cây Project | `lib/server/access-scope.ts` `canReadLibraryAsset`, `assetTrongPhamVi` | ✅ có, proof 20/20 + 12/12 |
| Hash/manifest dùng chung | `lib/cad/sha256.ts` ← `ifpack.ts` + `idfc-integrity.ts` | ✅ có, proof 48/48 |
| Provenance bền | `lib/capabilities/xuat-xu-ben.ts` + `AssetRepresentation.provenance` | ✅ có, proof 23/23 + 28/28 |
| `tenantId` trên 9 bảng gốc | `prisma/schema.prisma` | ❌ chưa — Wave 2 |
| Adapter đồng bộ + hàng đợi ngoại tuyến | chưa có tệp | ❌ chưa |
| Cửa preview + xác nhận cho mọi nhập từ ngoài | `atlas-materials/sync` upsert thẳng | ❌ chưa — Adapter Sandbox |

### Data impact

**Không** thay đổi dữ liệu ở lượt chốt này. Quyết định ràng buộc **hình dạng tương lai**:
mọi bảng sắp thêm phải khai trước nó thuộc scope nào trong năm scope §④, và mọi trường sắp thêm
phải khai trước nó thuộc vùng **được đồng bộ** hay **ở lại máy** theo §②.

### Migration impact

**Không migration nào ở lượt này.** Ràng buộc cho các lượt sau:

- `tenantId` **nullable** trên 9 bảng gốc, expand → backfill → contract, mỗi bảng lùi được riêng.
- ⛔ Không chạm Prisma khi chưa có **backup + rollback đã diễn tập + parity đã chứng minh**.
  Điều kiện này **đã đạt** cho `IF-MIGRATION-LEDGER-RECONCILIATION-001` (xem Q14 · Risks).
- Đổi `provider` sang `postgresql` **không nằm trong kế hoạch nào** cho tới khi có ADR riêng.

### Risks

1. **Đồng bộ chọn lọc khó hơn đồng bộ tất cả.** "Vùng nào đi, vùng nào ở" là quyết định phải ra
   cho **từng trường**, và sai một trường là rò rỉ. Giảm thiểu: mặc định **ở lại máy**; một
   trường chỉ được đồng bộ khi có người khai tường minh.
2. **Catalog và asset lệch nhau.** Metadata nói có, byte thì mất. Giảm thiểu: `hash` bắt buộc
   trong manifest, và **cảnh báo chứ không chặn** khi lệch (đúng ngữ nghĩa `restoreIfpack`).
3. **Feature flag sống quá lâu thành nợ.** Bốn cờ đang tắt. Mỗi cờ phải có ngày bật hoặc ngày gỡ.
4. **Sổ migration đã từng lệch một lần.** 6 thư mục / 5 hàng, và thư mục không dựng lại được CSDL
   (`P3006`). Đã chữa gốc bằng `20260820000000_baseline_bu_ba_bang` — parity chứng minh bằng
   `"This is an empty migration"`. Bài học ở `docs/design-campaign/02-FAILURE-LEDGER.md`.

### Unknowns

- **Dịch vụ đồng bộ chạy ở đâu** khi bật — tự vận hành hay thuê. Chưa cần trả lời để làm Wave S1/S2.
- **Đơn vị thu phí** của lớp đồng bộ. Chưa ảnh hưởng kiến trúc.
- **Ngưỡng "asset nặng"** — bao nhiêu MB thì không đồng bộ. Đề xuất đo trên dữ liệu thật trước
  khi chốt số, KHÔNG đoán.
