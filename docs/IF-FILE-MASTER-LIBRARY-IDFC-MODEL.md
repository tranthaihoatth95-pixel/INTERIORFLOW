# IF · FILE MANAGER → MASTER LIBRARY → IDFC — SPECIALIST MODEL (Lane 4)

> **Lập 19/08/2026** · Lane 4 (File/Master Library/IDFC specialist) trong mô hình 4 phiên.
> HEAD `3da4b8c` + working tree chưa commit (Wave 0 + Slice 1A 2A). Đo bởi 6 agent Explore
> đọc-only + T-lane spot-check độc lập 7 claim nặng nhất (tất cả khớp).
>
> **Vai file**: hợp đồng CURRENT → TARGET cho chuỗi `FILE → UNDERSTAND → NORMALIZE → PROMOTE
> → MASTER LIBRARY → CANONICAL IDFC → REPRESENTATIONS → PROJECT INSTANCE`, đủ sạch để MAIN
> chia Wave. **KHÔNG phải CHỐT** — mọi mục TARGET là ĐỀ XUẤT theo khuôn B25 (REUSE/CONNECT/
> EXTEND, NEW kèm negative evidence), chờ MAIN hợp nhất + Hoà duyệt.
> **KHÔNG reopen architecture** — mọi TARGET neo vào 9 ADR đã ACCEPTED (Q1–Q9) + 4 chốt C1–C4
> + Blueprint B25. **KHÔNG production code** trong phiên này.
>
> Bằng chứng đầy đủ (6 báo cáo trinh sát): `docs/memory/sessions/2026-08-19/10-file-library-idfc/`.
> Báo cáo phiên: `docs/bao-cao-phien/2026-08-19-file-library-idfc.md`.

---

## 1 · CURRENT REALITY — một câu và mười sự thật đo được

**Một câu**: mọi mảnh của pipeline đều ĐÃ có primitive (nhiều mảnh có cả test), nhưng chuỗi
`file → hiểu → thư viện → dùng trong dự án` **đứt ở BỐN khớp nối**, và không khớp nào cần NEW
để vá — toàn CONNECT/EXTEND.

Mười sự thật (file:line trong các mục dưới):

1. **Hai đường upload không gặp nhau và không đường nào là pipeline**: `/files` ghi thẳng đĩa
   người dùng qua FS Access (0 fetch, 0 DB); `/library/ingest` ghi IDB manifest, chưa bao giờ
   POST `/api/library`. Đường tạo `LibraryAsset` duy nhất chỉ nhận ảnh raster.
2. **`promote` / `normalize` / lifecycle RAW→UNDERSTOOD→PROMOTED = 0 code** (grep 0 hit toàn repo).
   `FmFile.lifecycle` có type 3 trạng thái nhưng mọi nguồn gán cứng `'nhap'`, 0 đường chuyển.
3. **`.idfc` v3 là hợp đồng thật** (12 kind, vỏ+ruột union, migration v1→v2→v3 chạy thật) — nhưng
   **đường instance hoá vào Doc bị đứt**: thả món kệ đi vòng KHỚP-TÊN vào `BLOCKS`/manifest;
   `body.geom2d` tự chứa **không bao giờ** được dựng thành entity (`LibraryDropBridge.tsx:57`
   không đọc idfc; `library-item-resolve.ts` không import idfc).
4. **`specId` không bao giờ được gán khi thả từ Thư viện** (caller không truyền `specs`, entity
   dựng không gán `hit.specId`) ⇒ món thả không lên BOQ/legend — trái chính docstring của nó.
5. **Đường ảnh→cấu kiện là HAI pipeline rời nối bằng file trên đĩa**: `from-photo.ts` (ảnh→GLB,
   cờ 3 nấc per-trường) và `chuan-net.ts` (GLB→OBJ+recipeJson). **Toàn bộ `lib/idfc-import/**`
   ≈ 3.341 dòng + test = 0 caller runtime.** Món 3D duy nhất trong app là hardcode regex
   `/lincoln 327/i`.
6. **4 namespace cùng mang tên `matId`** đang sống: UUID canonical (`matid-identity.ts`) ·
   UPPER(sku) key PBR localStorage (`pbr-store.ts:30`) · `ProductSpec.id` (BOQ/override/node) ·
   `SheetItem.code` (LibrarySheet gọi `getPbr`). Ruột `.idfc` kind `material` **không có
   matId/specId nào**. Cột `ProductSpec.matId` đã khai schema, **DB thật chưa có** (đo
   `pragma_table_info` = 34 cột, không matId).
7. **8 hệ provenance độc lập, không hệ nào biết hệ nào**; `sourceAssetId`/`origin` = 0 hit toàn
   repo. `LibraryAsset` 19 cột, **0 cột provenance/hash**; nguồn+license nhồi vào `tags` CSV
   (7 namespace tiền tố ký sinh trên một cột).
8. **3 taxonomy phân loại file song song**: Format Router 23 format magic-byte (`lib/gateway/`) ·
   `refingest.classify` 5 loại mime/đuôi · `kindFromName` 10 loại đuôi. `detectFormat` có
   **5 caller thật**, nhưng bảng capability (`capabilityFor`) **0 caller** và đã bị **bypass
   hard-code** (`Toolbar.tsx:268-273` "ĐẶC CÁCH GATEWAY").
9. **Ba chỗ UI báo thành công giả**: BulkIngestMode toast "đã đưa N tệp vào kho" cho file
   không-`.idfc` mà không ghi đâu cả; `applyPreset` toast "Đã áp…" trong khi event 0 listener;
   spotlight "Chọn cho dự án này" = `items[0]`.
10. **Human-review khuôn đang chạy thật chỉ có 2**: `Checkpoint` (3 mount, không persist) và
    `DistillEngine` cờ `inferred` + người-duyệt-thắng-máy (2 caller, 1 sống). **ProposalSheet
    = 0 dòng code** (chỉ hiến pháp trong docs).

---

## 2 · TARGET MODEL — sơ đồ một trang

```
RAW SOURCE (upload · drag · paste · URL · clip · file khách)
   │  [Format Router detect — REUSE, magic-byte đã có]
   ▼
FILE (raw record: identity + contentHash + origin + status)         ← ADR Q5 + Q4
   │  UNDERSTAND (per-format understander; VLM = proposal, cờ inferred)
   ▼
UNDERSTANDING (draft-pending-review — đã có mẫu ở from-photo.ts:177)
   │  HUMAN REVIEW (Checkpoint hiện tại → ProposalSheet Wave 3)
   ▼
NORMALIZE + PROMOTE (hành động tường minh, không tự động)
   ▼
MASTER LIBRARY ITEM
   ├─ content kinds → .idfc (canonical template, meta.id + lineage sourceFileId)
   └─ ảnh/asset    → LibraryAsset (+contentHash +origin — ADR Q4)
   │
   ├─ REPRESENTATIONS (một vật, nhiều mặt, MỘT truth — B10):
   │    semantic · plan 2D (geom2d) · elevation (OrthoView, INFERRED có nhãn)
   │    · 3D (parametric-first: geom3d/recipe; mesh = managed blob ref)
   │    · material assignment (matId UUID) · commerce (TRỎ TỚI ProductSpec)
   │    · preview (MaterialSphere/thumb) · provenance per-trường
   ▼
PROJECT INSTANCE = reference (specId/matId) + variant? + overrides (đè cuối — C2)
   │  KHÔNG ghi ngược về template (ràng buộc 1 giữ nguyên)
   ▼
2D Doc · 3D scene (derived) · Present bảng vật liệu · BOQ (specId)
```

Cảm giác người dùng phải đạt: **"MỘT VẬT ĐƯỢC HIỂU DẦN"** — mỗi bước thêm định nghĩa, mỗi giá
trị máy suy mang cờ, người duyệt mới thành canonical. Không phải "copy file sang thư viện".

---

## 3 · FILE MANAGER

**CURRENT**: `/files` hai NGĂN (`HaiNgan.tsx`): ngăn ① = FS Access ghi/đọc/xoá/đổi tên đĩa
người dùng thật (`real-fs.ts:113-127`), 0 DB, 0 index, fallback localStorage khi lỗi; ngăn ② =
đọc `/api/specs` + PBR, chỉ-đọc, 0 action. Vision "hai TẦNG + Collection+ 8 gói" (17/08) chỉ
có mock, `COL-` = 0 hit code. `lifecycle` chết (mục 1.2). Vòng dung lượng luôn 0
(`queries.ts:69-71`). `/files` KHÔNG dùng `disk-sync.ts` (không throttle/presence/so-nguồn).

**TARGET** (Q5): Files = raw/project inputs có **bản ghi identity** (không chỉ là entry đĩa):
mỗi file khi vào IF (dù nằm đĩa người dùng) có record `{id, contentHash, origin, projectId?,
status}` — ADR Q5 đã đề xuất model `ProjectFile` (T-ADR nghiêng model riêng, xem `ADR-Q0
§Q5 Code impact`). Ba nguồn dữ liệu chồng nhau hiện tại (queries rỗng + localStorage session +
đĩa) hợp về một danh mục. Hai đường upload (`/files` · `/library/ingest`) hợp nhất qua Format
Router: **một cửa nhận, phân loại bằng magic-byte, đổ về đúng ngăn**.

**Hành động**: CONNECT (nối `/files` ↔ record) + EXTEND (`ProjectFile` per Q5 — Q5 đã ACCEPTED
nên không cần negative evidence mới; hình thù cột chờ MAIN gộp với Manifest Q1).

## 4 · FILE INSPECTOR

**CURRENT** (đối chiếu checklist §22 phiếu):

| Mục | Trạng thái | Evidence |
|---|---|---|
| Preview | **GAP** — chỉ in chữ đuôi file | `FileManagerShell.tsx:703` |
| Metadata | PARTIAL — tên/size/badge/người thêm; `lastModified` đọc rồi vứt | `:639-755`, `real-fs.ts:146` |
| Source/Provenance | GAP — `source:'local'` gán cứng | `:344` |
| Project relationship | GAP — 0 liên kết project | — |
| Understanding / Extracted entities / Material clues | GAP | — |
| Canonical links (matId/brand/price) | có Ô nhưng 0 nguồn set — ô chết | `:709-715` |
| Used where | GAP (toàn hệ — mục 9) | — |
| Promotion state | GAP | — |
| Actions CÓ | upload/rename/download/delete/multi-select/tìm/lọc/bình-luận(localStorage) | §1.5 báo cáo agent-2 |
| Actions GAP | OPEN-in-IF (nút câm `:750-752`) · UNDERSTAND · RE-RUN · PROMOTE · CREATE COMPONENT/MATERIAL · LINK EXISTING · ATTACH TO DECISION · COMPARE · ARCHIVE | — |

**TARGET**: Inspector đọc từ record Q5 + understanding kết quả; actions map vào pipeline (mục 5-7).
Preview ảnh thật là việc rẻ nhất có sẵn primitive (`makeThumb` refingest.ts:79 — REUSE).

## 5 · UNDERSTAND

**CURRENT**: không có bước UNDERSTAND chung. Mảnh rời: VLM caption (`captionImage`, 3 caller
sống) · palette/caption tự động lúc POST /api/library · PDF extract (`/api/pdf/extract`) ·
DWG/DXF parser · xlsx parse (warehouse) · **from-photo ①classify (0 caller)** · metrology node
(`vision.measureobject`, 0 credit, sống).

**TARGET**: UNDERSTAND = **bảng understander theo format**, khai qua Format Router (EXTEND
`FORMAT_CAPABILITIES` thêm op `understand` hoặc bảng kề — MAIN quyết hình thù; KHÔNG viết
detector mới). Mọi output understand là **proposal mang cờ** (`inferred`), đi khuôn DistillEngine
(`ProvenanceInput` → `DistilledField` — REUSE, engine đã chạy thật 2 mặt tiền). Ảnh vật thể →
pipeline from-photo (REUSE nguyên trạng, chỉ CONNECT mặt tiền UI).

## 6 · NORMALIZE

**CURRENT**: 0 code nghĩa pipeline (grep xác nhận; ~40 hit `normalize` toàn là chuẩn hoá
chuỗi/số). Adapter duy nhất tồn tại: photo→`.idfc` furniture (from-photo) — 1 chiều, không tổng quát.

**TARGET**: NORMALIZE = đưa understanding đã duyệt về **đúng ruột kind `.idfc`** (hoặc
MaterialSpec/LibraryAsset). Mỗi kind một normalizer nhỏ; KHÔNG một super-converter. Ưu tiên
thứ tự theo nơi tiêu thụ có thật: `furniture/fixture` (from-photo có sẵn) → `material`
(warehouse wizard có sẵn) → còn lại theo nhu cầu.

## 7 · PROMOTE

**CURRENT**: 0 code. Hành vi thật hôm nay: upload = LibraryAsset NGAY (không raw stage);
`.idfc` do người kéo tay vào BulkIngest; PublishModal chỉ localStorage ("publish thật chưa có
backend" — tự khai `PublishModal.tsx:19-21`).

**TARGET** (Q5): PROMOTE = hành động tường minh, tạo Library item mới **giữ lineage**
(`sourceFileId` → record Q5; `meta.sourceLibraryId` hiện có nhưng 0 nơi đọc — CONNECT nó thành
lineage thật). Không auto-promote: máy chỉ ĐỀ XUẤT promote (cờ inferred), người bấm.
Toast giả của BulkIngestMode (file không-idfc) phải sửa thành nói thật **trước khi** có promote
— đó là bug khai-thật, không phải feature.

## 8 · MASTER LIBRARY

**CURRENT**: MỘT sheet (LibrarySheet, mount AppShell — đúng "một thư viện duy nhất"), 16+1 kệ
khai, **6 kệ có dữ liệu thật** (kyhieu 12 hardcode · idfc IDB rỗng-mặc-định · clusters 6
parametric · atlas 14 DB · render-preset 5 seed · asset ~1592 cap 240), 12 kệ empty-state.
Spotlight/trending giả (mục 1.9). Hai mô hình dữ liệu song song: `LibraryItem` (types.ts —
**mã chết**) vs `SheetItem` (shelves.ts — thật). 3 mặt tiền độc lập trên cùng bảng
`LibraryAsset` (LibraryPanel · kệ sheet · Gallery) — 3 phân loại khác nhau.

**TARGET**: giữ MỘT sheet + kệ; việc là **cấp dữ liệu thật cho kệ** qua pipeline promote
(không dựng kệ mới); dọn mã chết `LibraryItem`; spotlight đổi thành logic ngữ cảnh thật hoặc
gỡ nhãn (không được hứa quá code). Library item phải inspect được đủ: identity · category ·
source · provenance · confidence · các representation · variants · preview · where-used ·
version · external refs (bảng khả năng hiện tại: chỉ identity/category/preview-bậc-thang có).

## 9 · IDENTITY

**CURRENT**: `.idfc` identity = `meta.code` (upsert key kho, đè phẳng) + `meta.id?` optional.
`LibraryAsset.id` cuid + `img_<cuid>` dẫn xuất. **Where-used: KHÔNG TỒN TẠI** ở mọi dạng
(usageCount mã chết, bumpUsage 0 caller, 0 query ngược `specId`). `meta.code` mutable = identity
yếu (Blueprint B8 đã ghi "đè im lặng khi trùng = GAP").

**TARGET** (nguyên tắc §20 phiếu + Q3): canonical identity = **IF-owned, immutable** —
`meta.id` bắt buộc khi vào kho (generate lúc promote), `meta.code` là business key hiển thị/tra.
URL/filename/SKU/Lark record = ExternalRef/business key, không bao giờ là identity. Where-used =
**derived index** (quét `BlockEntity.specId`/`HatchEntity.specId` trong các Doc + deck), không
bảng ghi tay. Upsert kho đổi từ đè-phẳng sang so-`meta.id`-trước (mục 24).

## 10 · IDFC — CURRENT CONTRACT (VERIFIED)

Đọc trọn `lib/cad/idfc.ts` (443 dòng):

- **Version**: `IDFC_VERSION = 3`; migrations THẬT `{1: v1→v2 (biến đổi dữ liệu), 2: v2→v3
  (bump)}` (`idfc.ts:268-271`); import từ chối version mới hơn kèm thông điệp.
- **Vỏ**: `{idfcVersion, meta(12 trường), body(union 8 nhánh), commerce?}` — **không có
  `progress?`** (hoãn cố ý, chờ model Task). `meta.sourceLibraryId` + `meta.author` là
  provenance duy nhất trong hợp đồng.
- **Kind**: 12 (`material·furniture·millwork·fitout·fixture·soft·page·video·doc·asset·
  brandkit·preset`); 5 kind vật lý chung ruột `component`; 5/8 ruột là placeholder K4
  (page/video/doc/brandkit/preset).
- **Ruột component**: `geom2d` (BẮT BUỘC — snapshot tự chứa: group/w/h/prims/variants/anchors/
  clearance) + `geom3d?` (`heightMm/bevelMm/matId?/pbr?` — THAM SỐ, cấm mesh K1) + `params?`.
- **Ruột material**: `pbr` (bắt buộc, `{}` rỗng hợp lệ) + `hatch2d?` + `symbol2d?` —
  **KHÔNG có matId/specId** trong ruột material.
- **Validate NÔNG**: meta sanitize từng trường; body chỉ kiểm discriminant + 1 field/nhánh
  (`prims` không kiểm phần tử, `commerce` cast thẳng); khoá lạ MẤT khi qua importIdfc.
- **Cờ tin cậy**: KHÔNG có trong hợp đồng — sống ở khoá ngoài schema `xFromPhoto`
  (per-trường, `measured|inferred|verified`, nấc `measured` chưa dùng).
- **DRIFT đang mở**: docstring (sửa chưa commit) nói "importIdfc resolve matId qua
  `resolveInputMatId`" — **code không import/gọi hàm đó** (0 caller); export từ LibrarySheet
  ghi `matId: displayItem.code` (business code, không UUID); test khoá hành vi sku-style.
- **Callers sống**: BulkIngestMode (nhập) · LibrarySheet (kệ + xuất — xuất CHỈ cho món khớp
  `BLOCKS`) · thumb-kinds. **0-caller**: toàn bộ `lib/idfc-import/**` · `exportIdfcStoreJson` ·
  `SELLABLE_KINDS`.

**Verdict**: hợp đồng VERIFIED — v3 dùng được cho slice; ba lỗ đã đo: validate nông ·
cờ tin cậy ngoài schema · material không khoá nối.

## 11 · IDFC — TARGET MULTI-REPRESENTATION

Nguyên tắc: **một vật, nhiều mặt, một truth** (B10) — KHÔNG tạo truth riêng per representation.
Đề xuất (v4 additive, đi qua `IDFC_MIGRATIONS` — đường nâng cấp đã tồn tại; KHÔNG NEW format):

| Mặt | v3 hiện có | v4 đề xuất (additive) | Action |
|---|---|---|---|
| semantic | `meta.kind/tags/room` | + `meta.id` bắt buộc-khi-trong-kho | EXTEND |
| plan 2D | `geom2d` tự chứa ✅ | giữ nguyên | REUSE |
| elevation | ❌ | KHÔNG nhét vào file — derived từ geom3d/mesh qua `elevationToEntities`/`OrthoView` (mục 13); file chỉ mang tham số | REUSE (derived) |
| 3D parametric | `geom3d {heightMm,bevelMm}` | + `recipe?: BuildRecipe` (reuse type `model.ts:539` — chuan-net đã sinh đúng khuôn `BuildOp.revolve`) | EXTEND |
| 3D mesh | ❌ (K1 cấm inline) | `meshRef?` = tham chiếu **managed blob** (Q4 contentHash), KHÔNG inline GLB; embed dataURI chỉ là tuỳ chọn export "tự chứa" | EXTEND (chờ Q4) |
| material | `geom3d.matId` string tự do | matId = UUID (Slice 1A); ruột `material` thêm khoá canonical | EXTEND (đi cùng Slice 1A) |
| commerce | `commerce` snapshot | giữ TRỎ TỚI qua sku/matId; số trong file là snapshot có ngày | REUSE + ghi rõ semantics |
| provenance | `xFromPhoto` ngoài schema | nâng thành khối chính thức `provenance?` per-trường (`ProvenancedValue` — reuse type from-photo) | EXTEND |
| preview | ❌ | KHÔNG vào file — thumbnail thuộc KHO (store-level, sinh từ geom2d/mesh/pbr) | store-level |
| review | `xFromPhoto.reviewStatus` | trạng thái duyệt thuộc KHO/record, không thuộc file trao tay | store-level |

⚠️ **ĐIỂM CẦN MAIN QUYẾT (không tự quyết)**: ADR Q3 ghi "`.idfc` format v3 — giữ". Đề xuất v4
ở trên là NEW-version theo đúng nghĩa §12 phiếu ("EXTEND / NEW VERSION") — cần MAIN xác nhận
thứ tự (trước/sau Wave 1) và phạm vi tối thiểu (T-lane đề xuất tối thiểu = `provenance` +
`recipe`; `meshRef` chờ Q4 thi công).

## 12 · PLAN / MẶT BẰNG

**CURRENT**: primitive ĐỦ và TỐT — `geom2d.prims` (line/poly/circle/arc) + `anchors` (snap
wall-back/wall-side/floor) + `clearance` + `variants`; `BlockDef` cùng schema; insertion point
= tâm (ngầm định); bbox = w/h khai tay. Block DXF (54): KHÔNG có insertion point khai báo,
có ca bbox lệch tâm (`living-sofa-2seat`: y ∈ [−425,+1267] vs h khai 850). Hatch 5 pattern.
KHÔNG có detail level/LOD.

**GAP THẬT KHÔNG PHẢI FORMAT MÀ LÀ TIÊU THỤ**: `.idfc.geom2d` không bao giờ được dựng thành
entity (mục 1.3). **Fix = CONNECT**: resolver nhận thêm nguồn thứ ba (kho `.idfc` đã hydrate) —
`resolveLibraryItem` mọc nhánh `via:'idfc'` dựng `prims` trực tiếp (hoặc register BlockDef
runtime từ geom2d); + truyền `specs` để `specId` sống; + set `srcInsertId` khi thả.

**TARGET thêm**: symbolic detail theo scale = [DESIGN DIRECTION] (spec LOD đã có chữ trong
SPEC-MASTER-LIBRARY-3D-CONTRACT, 0 code) — KHÔNG làm trong slice đầu.

## 13 · ELEVATION

**CURRENT — có primitive thật, đã nối UI (phát hiện đắt: ghi chú cũ "chưa mount" đã lỗi thời)**:
- `elevationToEntities(scene, axis)` + `sectionToEntities` (`lib/three/section-entities.ts:440,305`)
  — chiếu ObjScene → `Entity[]`, 3 layer S-CUT/S-VIEW/S-FAR, poché SOLID cho vòng cắt kín; đã
  nối `SectionExtractPanel` → duyệt qua `SectionPreviewOverlay` (khuôn Checkpoint) → ghi Doc.
- `OrthoView` (`lib/vision/ortho-projection.ts`) — `plan|front|side`, mỗi view mang
  `ProvenanceKind` (`measurement|referenceBlock|projection`) + `basis` + `isBoundingOutlineOnly`
  — **"ba nhãn, không được trộn" (chốt Hoà 05/08) — đây chính là khuôn cho elevation suy từ ảnh**.

**TARGET**: elevation của component = **DERIVED representation** (không lưu trong `.idfc`):
- từ geom3d parametric/mesh → `elevationToEntities` (deterministic, nhãn `projection`);
- từ ảnh → `OrthoView front/side` (nhãn `referenceBlock`/`projection` — INFERRED, không phải
  technical truth cho tới khi validate).
Action: REUSE cả hai; CONNECT vào Library item viewer.

## 14 · 3D REPRESENTATION

**CURRENT**: `docToObjScene` (extrude Doc, proxy box nội thất theo bảng 9 dòng); `BuildRecipe`
evaluator 10 op sống (Command3DPanel); `csg.booleanOp`; GLB/OBJ import vào viewer
(`glb-import.ts` — SceneGroup KHÔNG danh tính); chuan-net parametrize GLB→cylinder/torus+
`buildOp revolve` (0 caller); export vật liệu D5/VRay (dịch PBR, không phải scene).

**Vocabulary chất lượng — KHÔNG invent enum mới** (kiểm negative evidence: `REFERENCE_ONLY…
MANUFACTURER_GRADE` = 0 hit; enum gần nhất ĐÃ TỒN TẠI):
- **4 trạng thái component** trong `SPEC-MASTER-LIBRARY-3D-CONTRACT-2026-08-11.md:126-129`:
  `Native parametric | Library parametric | Linked import | Baked render asset` — REUSE làm
  trục "geometry đến từ đâu";
- **`ProvenanceKind` 3 nhãn** (ortho-projection) làm trục "được phép dùng cho gì" (BOQ/đặt
  xưởng ↔ dựng cảnh ↔ trình bày);
- **`ProvenanceFlag` 3 nấc** per-trường cho giá trị số.
Ba trục này phủ đúng thang REFERENCE_ONLY→MANUFACTURER_GRADE của phiếu mà không đẻ enum thứ tư.
Luật giữ: **AI-generated mesh không bao giờ mang nhãn `measurement`/manufacturer** — nó là
`Baked render asset` + `inferred`.

**TARGET**: parametric-first cho vật cấu trúc đơn giản (mục 16); mesh = managed blob (Q4);
scene vẫn DERIVED không persist (Q6 — giữ).

## 15 · MATERIAL

**CURRENT** (bảng đầy đủ trong báo cáo agent-4): matId UUID đã có luật + helper
(`matid-identity.ts`, 32 test) nhưng `resolveInputMatId` 0 caller; `getMaterial()` 2 caller
sống, cả hai truyền sku ⇒ 100% đường `legacy-sku`; PBR store localStorage key UPPER(sku);
`MATERIALS` 13 preset 2D — **0 preset khai matId** ⇒ mặt hatch của resolver luôn null;
`hatchOverride` 0 code; ATLAS chưa từng chảy dữ liệu (permission denied 04/08); DB chưa có cột.

**TARGET** (đã chốt, chỉ nhắc để nối): Component `→ material assignment → matId (UUID) → 2D
facet · PBR · commerce/spec`. matId IF-owned immutable; sku/vendor = business/external key;
**KHÔNG hồi sinh matId=sku** (SUPERSEDED #1). `.idfc` v4 material facet mang khoá canonical
(mục 11). **Không chép giá vào vật liệu** — trỏ tới ProductSpec (luật 2.1.9.i giữ).
Toàn bộ phần này là **Slice 1A đang chạy** — lane này KHÔNG đụng, chỉ khai dependency.

## 16 · FURNITURE SEMANTICS

**CURRENT**: rải ở 4 nơi — `meta` idfc (name/kind/tags/room) · `commerce` (brand/sku/vendor/
price/materials/finishes) · `ProductSpec` 34 cột (dims w/d/hUp, room, confidence, scope,
supplierId, verified) · `BlockDef` (anchors/clearance/hosted = placement+mounting thật).
`VerifiedSpec` from-photo (wMm/dMm/hMm/seatHMm/weightKg + sourceUrl).

**TARGET — phân 4 lớp, không ép mọi field cho mọi category**:
- **required**: identity (id/code/name) · kind · dims chính (theo category);
- **optional**: brand/model/finish/room-suitability/variants/adjustable params;
- **derived**: footprint/bbox/area (đo từ prims — khuôn `ClusterResult.sizeMm` đã làm đúng);
- **external**: supplier/manufacturer codes/giá (TRỎ TỚI ProductSpec/ExternalRef).
Placement/mounting: REUSE `anchors` + `hosted` + `clearance` (đã có, đã chạy autoSnapToWall).
Schema-driven panel: REUSE khuôn IF-RNA v0 (MaterialPbr panel tự sinh từ định nghĩa — tiền lệ 14/08).

## 17 · VARIANT / OVERRIDE

**CURRENT**: **hoàn toàn chưa có** ở tầng idfc/entity — `variant` trong idfc chỉ là
`ShapeVariant[]` hình học; `BlockEntity.variant?: string` chọn preset; `overrides` 0 hit;
`srcInsertId` chỉ DXF-import ghi. Override có thật duy nhất trong hệ: wall Type↔instance
(`wall-types.ts` — INSTANCE thắng TYPE, có `resolveWallParams` trả cả nguồn) và BOQ overrides.

**TARGET** ([CHỐT C2] + ADR Q3): `Template → Variant → Instance Override`, cùng field thì
**Override thắng Variant**; effective = template → variant → overrides đè cuối. Thi công theo
Q3-3a: `BlockEntity.overrides?` additive typed theo kind + merge helper trong
`library-item-resolve` — **khuôn resolve có sẵn để chép là `resolveWallParams`** (một cỗ máy
nhiều mặt tiền). Không sửa project instance rồi silently mutate Master item (ràng buộc 1 giữ).

## 18 · SOURCE / PROVENANCE

**CURRENT**: 8 hệ độc lập (bảng agent-5 §8): `ProvenanceFlag` (from-photo, chưa cắm) ·
`SemanticProvenance` declared/inferred/derived (sống, trên SceneGroup) · `DistilledField.nguon`
(sống) · `ProvenanceKind` ortho (sống) · `PerspectiveProvenanceStep` (sống, tự khai lỗ rơi
round-trip) · `LinkedAssetProvenance` (present, sống) · `HoSoSongProvenance` (sống) ·
`PartLockPart.provenance` chuỗi tự do (chưa cắm). `origin/sourceAssetId` = 0 hit.
Asset-level: nguồn+license trong `tags` CSV; clip route nhét sourceUrl vào caption.

**TARGET** (Q4 + mục 32 phiếu): trả lời được "từ đâu · ai tạo · model nào · user sửa gì ·
duyệt chưa · quality nào" bằng **một khoá chung**:
- asset-level: `contentHash + origin{user-upload|supplier-import|project-generated|
  external-download|clip} + originSource` (Q4 — cột/AssetBlob, MAIN chọn nhẹ/sạch);
- value-level: `ProvenancedValue{value, flag, source}` (REUSE from-photo type) làm khuôn chung;
- KHÔNG gom 8 hệ thành một model đại thống nhất trong slice đầu (over-engineering) — chỉ
  chuẩn hoá khoá nguồn (`sourceAssetId` trỏ record Q5/LibraryAsset) để các hệ trỏ về cùng gốc.
- **Copyright**: KHÔNG copy source asset ngoài vào canonical item redistributable mặc định —
  reference image giữ vai evidence/provenance (mục 29).

## 19 · VLM

**CURRENT**: `captionImage` NVIDIA (3 caller sống); SAM2 SmartSelect (sống, internal-free);
BiRefNet removeBg (sống, 1cr); idmask median-cut (tất định, sống); from-photo classify
(0 caller). Local backbone = 0 (entry `vision-backbone-cuc-bo` chờ). Route caption **không có
credit gate** (cross-lane).

**TARGET**: VLM output = semantic understanding proposal (category/parts/materials/hidden-part
hypothesis), **luôn `inferred` + source `vision:<model>`**, không bao giờ ghi thẳng canonical
(luật 8 — hiện 0 RED, giữ). Model/route đi qua AI Gateway facade khi Wave 2 mở — lane này
không chờ: chỉ cần mọi call mới đi qua route có gate.

## 20 · DETERMINISTIC ROLE

**CURRENT — dày và thật**: metrology 4-nấc tự tụt (anchorScale, cấm bịa mm) · Hough/vanishing
points (bug đã vá + test hồi quy) · ortho-projection · chuan-net fit RANSAC + mirror-completion
PCA (không đạt ngưỡng ⇒ GIỮ mesh, khai ghiChu) · build-ops 9 hàm + evaluator cô lập lỗi từng
bước · section/elevation chiếu · autoSnapToWall · TCVN check cụm họp.

**TARGET**: giữ đúng phân vai phiếu §34: AI proposal → deterministic build khi có thể → human
correction. Cụ thể cho slice: VLM đề xuất category/parts → chuan-net/metrology cho số đo →
recipe (BuildOp) là "ý định có cấu trúc" (luật 8) → evaluator dựng. **Mắt xích cần nối duy
nhất**: `chuan-net.recipeJson` → `BuildRecipe` chính thức (hình dạng đã khớp, chỉ thiếu import
type + đường đọc — CONNECT).

## 21 · HUMAN REVIEW

**CURRENT**: khuôn sống = `Checkpoint` (3 mount: ClusterPanel · PlanPresentPanel · CadEditor
DXF; seed+undoLabel bắt buộc bằng type; KHÔNG persist) + DistillEngine merge "người xác nhận
thắng máy suy lại". `reviewStatus:'draft-pending-review'` đã có trong from-photo, 0 UI đọc.
ProposalSheet = 0 code (Wave 3).

**TARGET**: `UNDERSTAND → PROPOSAL → HUMAN REVIEW → EDIT → APPROVE → CANONICAL`. Slice đầu
dùng **Checkpoint làm cửa duyệt** (REUSE — UX lane cũng kết luận Checkpoint là primitive gần
nhất của ProposalSheet); trạng thái duyệt persist ở record kho (không ở component state — lỗ
không-persist đã đo). Không auto-promote geometry/material độ bất định cao thành truth.

## 22 · QUALITY / CONFIDENCE

**CURRENT**: 4 hệ confidence rời (classify number 0..1 · FfeConfidence · warehouse
string+3-mức · metrology residualPx) + các cờ boolean `inferred` rải.

**TARGET**: hai trục đủ dùng, đều REUSE: `ProvenanceFlag` (3 nấc, per-giá-trị) × `ProvenanceKind`
(3 nhãn, per-representation). `PROVEN/INFERRED/ESTIMATED/UNKNOWN` của phiếu ánh xạ:
PROVEN→`verified|measured` · INFERRED→`inferred` có model-source · ESTIMATED→`inferred` +
range (khuôn `needs-reference`/`parametric assumption` khai trong ghiChu/basis) · UNKNOWN→
**không khai field** (luật "thiếu thì KHÔNG khai, không đoán bừa" — from-photo:167 đã đúng).

## 23 · PROJECT INSTANCE

**CURRENT**: instance = `BlockEntity{block, at, rot, sx, sy, variant?, specId?}` — nhưng đường
thả từ Thư viện KHÔNG gán specId/srcInsertId (mục 1.4); `.idfc`→instance đứt; 3D không có
listener instantiate; ClusterPanel là đường parametric trọn vẹn duy nhất (mất danh tính có
chủ ý). Present/BOQ đọc qua specId khi có.

**TARGET** (Q3 + C2): `MASTER ITEM → INSTANCE = reference(meta.id/specId) + variant? +
overrides + placement`. KHÔNG clone truth per project. Thi công tối thiểu (toàn CONNECT):
① resolver nhận kho idfc ② truyền specs ③ gán `specId` + `srcInsertId` lúc thả ④ mặt 3D đọc
merged spec khi Q3-3a có. Template xoá mà instance còn ⇒ hiển thị từ snapshot geom2d đã
được chép? — **KHÔNG**: hiện entity chỉ mang `block` id; ca này rơi về Q2 snapshot mode
(ghi nhận, không giải ở lane này).

## 24 · VERSION / UPDATE

**CURRENT**: kho idfc upsert theo `meta.code` **đè phẳng, mất bản cũ vĩnh viễn**, không lưu
`idfcVersion` nguồn, không pin, không lịch sử. `IDFC_MIGRATIONS` là version của FORMAT, không
phải của ITEM.

**TARGET** (contract, không framework — §26 phiếu): item update = `v1 proxy → v2 better
geometry → v3 supplier model` với hành vi project: **PIN mặc định** (bản chèn giữ liên kết +
ghim phiên bản — ràng buộc `.idfc` thứ 3 ĐÃ chốt trong MAP §2.7, code chưa làm) · FOLLOW/
REVIEW-UPDATE/MIGRATE là hành động tường minh. **Không silent overwrite** — kho giữ
`storedAt` + bản trước (tối thiểu: 1 bản gần nhất hoặc log JSONL). Hình thù cụ thể chờ MAIN
gộp với "xương sống lưu chung 4 format" ([DESIGN DIRECTION] B12).

## 25 · STORAGE

**CURRENT authority (đo)**: 5 kho song song — đĩa người dùng (FS Access, /files) · `./uploads/`
1616 file phẳng + Prisma (LibraryAsset/ProductSpec/…) · IDB `interiorflow-sheets` (sheets +
4 studio blob routes: idfc/màu/brand-kit/refManifest — W0.3 bridge) · IDB phụ (fonts/upscale/
2×handle) · localStorage còn lại (PBR store! · FM comments · prefs). `uploads/` trộn 4 hệ
khác bản chất (blob + JSON stores). **0 bảng ánh xạ giữa 3 kho ảnh** (đĩa ↔ LibraryAsset ↔
refManifest).

**TARGET**: KHÔNG invent storage mới. Việc: ① provenance/hash vào LibraryAsset (Q4) ② record
Q5 cho file thô ③ PBR store theo lộ trình W0.2 dời IDB (đã có trong sổ) ④ refManifest hợp
nhất vào đường LibraryAsset khi promote (hiện là kho ảnh thứ ba không rebuild được).

## 26 · PORTABILITY / OFFLINE

**CURRENT**: `.idfc` tự chứa geom2d ✅, mesh chỉ là URL fal có hạn (chết theo provider) ·
`exportIdfcStoreJson` có, 0 nút UI · kho per-MÁY (per-browser IDB), không per-user/studio
sync (F-C-02 Audit Q0).

**TARGET** (§28 + §37 phiếu): promoted item sống khi mất source URL / mất Lark / mất provider —
điều kiện: mesh về managed blob (Q4) + provenance giữ nguyên trong file/record. Export/import
kho: CONNECT nút cho `exportIdfcStoreJson` (năng lực có sẵn). Identity preservation qua
`meta.id` (mục 9).

## 27 · LARK / SUPPLIER CATALOG

**CURRENT**: ATLAS material sync viết xong, **chưa từng chạy thật** (blocked 131006 04/08;
field mapping chưa verify; 4 env chờ Hoà); pull-only, upsert theo `larkRecordId`; đường nhập
NCC thật đang sống là **XLSX wizard** (`MaterialImportWizard` → POST /api/specs từng dòng).

**TARGET** ([CHỐT 19/08]): Lark = OPTIONAL EXTERNAL ADAPTER; supplier = external source;
`SUPPLIER → INGEST → NORMALIZE → IF CANONICAL` — mọi record ngoài giữ ở business key
(`larkRecordId`/`altSku`), **không sở hữu identity** (matId sinh phía IF khi upsert — đã nằm
trong Slice 1A bước 2 kế hoạch). Không việc mới cho lane ngoài khai dependency.

## 28 · AI / CREDIT

**CURRENT**: gate thật ở `/api/jobs` (spendCredits nguyên tử + refund; vá lịch sử "curl đốt
provider free"); bảng giá 1 nguồn `TASK_CREDIT_COST`; `estimateRunCredit` client + badge.
**Ba đường ngoài gate đo được**: `/api/render/nvidia-image` (0 spendCredits) ·
`/api/vision/caption` (0) · `from-photo.generateMesh` gọi `fal.subscribe` trực tiếp (0 route —
hiện vô hại vì 0 caller). Cờ `internal` do client khai (whitelist 3 task đã chặn phần nặng).
`imageTo3d` khai 6cr **chưa bao giờ bị trừ** (tự khai trong tiers.ts).

**TARGET cho lane**: khi cắm mặt tiền UNDERSTAND/mesh — **bắt buộc đi route có
`spendCredits`** (mở rộng jobStatus cho output `model_mesh`, hoặc route riêng có gate — quyết
ở Execution lane). Lane này KHÔNG bypass cost control; ghi CROSS-LANE EXECUTION NOTE (mục 34).

## 29 · VISUAL PIPELINE

**CURRENT**: quả cầu vật liệu (RoomEnvironment PMREM, 1 renderer chung, cache RAM) sống trong
ItemThumb bậc thang ảnh-thật→cầu→vân; Object3DWindow viewer; capture png/depth/lineart;
Grounded Render concept-lane.

**TARGET**: render/preview = **derived visual capability** — KHÔNG canonicalize render thành
geometry truth (render là `Baked render asset`, nhãn `projection`); preview thuộc kho, sinh lại
được. Visual Pipeline facade = Wave 2, lane chỉ tiêu thụ.

## 30 · ARCHINOTE READINESS

**CURRENT**: 0 code ArchiNote (đúng kế hoạch). Cửa đã chừa: `ExternalRef.system` chuỗi tự do.

**TARGET**: các contract lane này sinh ra phải dùng lại được cho ArchiNote (Component ·
Material · Photo evidence · Installed item ↔ instance · Issue ↔ observation): cụ thể =
canonical identity (mục 9) + provenance khoá chung (mục 18) + instance reference+overrides
(mục 23) chính là 3 thứ ArchiNote cần. Không build gì thêm.

---

## 31 · CURRENT → TARGET MATRIX (bảng bắt buộc B25)

| # | Need | Existing Primitive | Evidence | Coverage | Action | Why |
|---|---|---|---|---|---|---|
| 1 | Nhận diện format một cửa | Format Router 23 format magic-byte | `lib/gateway/detect.ts:105-133` | PARTIAL (5 caller detect, 0 caller capability, 1 bypass) | **CONNECT** | dây có, bảng capability chưa ai đọc; sửa bảng thay vì đặc cách |
| 2 | Bản ghi file thô (identity/status/project) | `FmFile` type + ADR Q5 `ProjectFile` đề xuất | `lib/filemanager/types.ts:46-64` · ADR-Q0 §Q5 | NONE (type có, record 0) | **EXTEND** (theo Q5 đã ACCEPTED) | Q5 đã quyết Files=raw; negative evidence nằm trong ADR |
| 3 | contentHash + origin asset | LibraryAsset 19 cột · `imgIdFromKey` | `schema.prisma:278-314` (0 cột hash/origin) | NONE | **EXTEND** (theo Q4 đã ACCEPTED) | Q4 đã quyết managed copy+hash+provenance |
| 4 | UNDERSTAND ảnh vật thể | `from-photo.ts` 3 bước + cờ 3 nấc | `lib/idfc-import/from-photo.ts:35,147-178` | PARTIAL (code+test, 0 caller) | **CONNECT** | pipeline nguyên vẹn, chỉ thiếu mặt tiền + route có gate |
| 5 | GLB → parametric part | `chuan-net.ts` + `part-lock` + `surface-graph` | `chuan-net.ts:1237`, 3.341 dòng | PARTIAL (0 caller) | **CONNECT** | đã chạy thật 14/08 (Lincoln), artifact còn |
| 6 | part → BuildRecipe chính thức | `BuildOp` union + `evalRecipe` + `chuanNet.recipeJson` | `model.ts:490-513` · `build-recipe.ts:93` · `chuan-net.ts:863-867,1200-1220` | PARTIAL (hình dạng khớp, 0 đường đọc) | **CONNECT** | hai đầu dây khớp khuôn `revolve`, chỉ thiếu import type + reader |
| 7 | Human review gate cho understand | `Checkpoint` + `checkpoint-core` · DistillEngine merge | `components/studio/Checkpoint.tsx` (3 mount) · `lib/dna/distiller.ts:162-164` | PARTIAL (không persist) | **REUSE + EXTEND** (persist trạng thái ở record kho) | ProposalSheet 0 code (Wave 3); Checkpoint là primitive gần nhất — negative evidence chống NEW |
| 8 | PROMOTE hành động + lineage | `meta.sourceLibraryId` (ghi, 0 đọc) · PublishModal localStorage | `idfc.ts:115,438` · `PublishModal.tsx:19-21` | NONE (hành vi) | **CONNECT + EXTEND** | trường lineage có sẵn trong format; backend promote là phần thiếu duy nhất |
| 9 | `.idfc` instance hoá vào Doc | `resolveLibraryItem` + `LibraryDropBridge` + `geom2d` tự chứa | `library-item-resolve.ts:142-148` · `LibraryDropBridge.tsx:57` · `idfc.ts:120-130` | PARTIAL (đứt khớp nối) | **CONNECT/EXTEND** (nhánh `via:'idfc'`) | phá đúng lý do tồn tại của snapshot tự chứa; không cần format mới |
| 10 | specId/srcInsertId lúc thả | resolver đã trả `specId?`; `matchSpec`; `srcInsertId` trên Base | `library-item-resolve.ts:140` · `model.ts:367` | PARTIAL | **CONNECT** | caller thiếu 1 tham số + 2 dòng gán |
| 11 | Variant/Override instance | `BlockEntity.variant?` · khuôn `resolveWallParams` INSTANCE-thắng-TYPE · BOQ overrides | `model.ts:627` · `wall-types.ts:31-85` | NONE (cho block/idfc) | **EXTEND** (Q3-3a + C2) | Q3/C2 đã ACCEPTED; khuôn resolve chép từ wall-types |
| 12 | Provenance per-trường chính thức trong `.idfc` | `ProvenancedValue`/`xFromPhoto` | `from-photo.ts:35-42,147` | PARTIAL (ngoài schema) | **EXTEND** (v4 additive qua IDFC_MIGRATIONS) | đường nâng cấp format là thứ duy nhất trong 4 format có migration thật |
| 13 | Mesh lưu bền cho item 3D | Q4 managed blob (đề xuất ACCEPTED) · `glb-import.ts` | ADR-Q0 §Q4 · `lib/three/glb-import.ts` | NONE (URL fal hết hạn) | **EXTEND** (chờ Q4 thi công) | K1 cấm inline mesh là đúng; blob ref giữ file nhẹ |
| 14 | Elevation representation | `elevationToEntities` · `OrthoView` 3 nhãn | `section-entities.ts:440` · `ortho-projection.ts:36-97` | FULL (primitive) / PARTIAL (chưa nối Library) | **REUSE + CONNECT** | đã có cả deterministic lẫn inferred, có nhãn chống trộn |
| 15 | Quality vocabulary 3D | 4 trạng thái spec + `ProvenanceKind` + `ProvenanceFlag` | `SPEC-MASTER-LIBRARY-3D-CONTRACT:126-131` · `ortho-projection.ts:36` · `from-photo.ts:35` | PARTIAL (spec 0 code, 2 enum sống) | **REUSE** | NEGATIVE EVIDENCE: đã tìm `REFERENCE_ONLY/PROXY/grade/LOD` = 0 hit; 3 vocab hiện hữu phủ đủ; enum mới = island |
| 16 | Thumbnail kho | `makeThumb` (refingest) · MaterialSphere · ItemThumb bậc thang | `refingest.ts:79-89` · `ItemThumb.tsx:53-84` | PARTIAL (idfc/asset-kind không có ảnh) | **CONNECT** (map `body.imageUrl`→`SheetItem.imageUrl`; sinh thumb lúc promote) | mọi mảnh sinh ảnh đã tồn tại |
| 17 | Where-used | `BlockEntity.specId` FK mềm (65 file dùng entity) | `model.ts:636` | NONE (0 query ngược) | **EXTEND** (derived index, không bảng mới) | dữ liệu nguồn đã nằm trong Doc; chỉ cần scanner |
| 18 | Item version pin/update | `storedAt` · ràng buộc "ghim phiên bản" đã chốt trong MAP | `idfc-store.ts:24-27,61-64` | NONE (đè phẳng) | **EXTEND** | contract nhỏ; không framework |
| 19 | Credit gate cho understand/mesh | `/api/jobs` spendCredits + `TASK_CREDIT_COST.imageTo3d` | `app/api/jobs/route.ts:58-62` · `tiers.ts:150` | PARTIAL (2 route + 1 direct-call ngoài gate) | **CONNECT** (Execution lane) | gate + giá đã khai, chỉ chưa chạm |
| 20 | Nói thật ở UI (3 toast giả, nút câm) | luật khai-thật + khuôn unresolvedMessage | `BulkIngestMode.tsx:167-170` · `LibrarySheet.tsx:441-444,414` | — | **FIX (CONNECT hoặc gỡ nhãn)** | vi phạm luật cấm-nút-giả đang sống |

**0 dòng NEW thuần.** Hai dòng gần NEW nhất (#2, #3) đều là thi công ADR đã ACCEPTED —
negative evidence nằm trong chính ADR Q4/Q5.

---

## 32 · VERTICAL SLICE — "một ảnh Internet → một cấu kiện dùng được"

Input: **một ảnh tham chiếu thật Hoà cung cấp** (chair/sofa/table/…). Không fixture giả.
Mapping 16 bước phiếu §36 → primitive (trạng thái hôm nay):

| # | Bước | Primitive | Hôm nay |
|---|---|---|---|
| 1 | Raw reference vào IF | POST `/api/library` (raster) hoặc clip | ✅ chạy (thiếu origin/hash) |
| 2 | File/reference metadata | LibraryAsset + tags `nguon:/license:` | 🟡 tags CSV; record Q5 chưa có |
| 3 | Understanding | `classifyPhoto` (VLM, inferred) + metrology 4-nấc | 🔴 0 caller — CONNECT |
| 4 | Human review | Checkpoint + `reviewStatus:'draft-pending-review'` | 🟡 khuôn có, cửa cụ thể chưa |
| 5 | Canonical identity | `meta.id` + `meta.code` | 🟡 id optional — siết lúc promote |
| 6 | Semantic metadata | `meta.kind/tags/room` + classification | ✅ format đủ |
| 7 | Plan | `geom2d` (nay: chữ nhật w×d inferred; sau: silhouette→prims) | 🟡 |
| 8 | Front elevation | `OrthoView 'front'` — nhãn projection/referenceBlock | ✅ primitive, chưa nối |
| 9 | Side elevation | `OrthoView 'side'` | ✅ primitive, chưa nối |
| 10 | 3D | Trellis GLB (inferred) → chuan-net parametric (`Baked render asset`/`Library parametric`) | 🔴 0 caller — CONNECT |
| 11 | Material assignments | `suyVatLieu` (inferred, matId null nếu preset chưa khai) → người gán matId | 🟡 chờ Slice 1A |
| 12 | Preview | thumb + Object3DWindow (bỏ hardcode regex → tag `has3d:` như code tự khai) | 🟡 |
| 13 | Provenance | `xFromPhoto` per-trường → v4 chính thức | 🟡 |
| 14 | IDFC | export v3 ĐÃ hỗ trợ (mesh qua extension — khai thật) | ✅ |
| 15 | Project instance | thả → BlockEntity + specId + srcInsertId (sau fix #9/#10) | 🔴 CONNECT |
| 16 | Present usage | bảng vật liệu qua matId (Slice 1B) | 🟡 dependency |

**4 việc mở khoá slice, đều CONNECT**: ① mặt tiền UI gọi from-photo qua route có credit gate
② nhánh `via:'idfc'` trong resolver + truyền specs ③ đường đọc `recipeJson`→`BuildRecipe`
④ cửa duyệt Checkpoint đọc `reviewStatus`.

## 33 · ACCEPTANCE (theo §37 phiếu — giữ nguyên, thêm cách đo)

- **ONE SOURCE (hoặc nhiều view) → ONE CANONICAL OBJECT**: nhiều ảnh cùng vật = 1 `meta.id`,
  source assets là danh sách provenance (`sourceAssetId[]` + `viewType` — khai ở record kho,
  KHÔNG đẻ object per ảnh). Đo: đếm item sau ingest 3 view = 1.
- **MANY REPRESENTATIONS, SAME IDENTITY**: plan/elevation/3D/material/preview đều truy về
  `meta.id`; đo: mọi representation resolve ngược ra cùng id.
- **PROJECT INSTANCE, NO DUPLICATE TRUTH**: instance = reference+overrides; đo: sửa instance
  không đổi template (test round-trip); overrides thắng variant (C2).
- **Source URL chết → item sống**: mesh/ảnh đã là managed blob; đo: ngắt mạng mở item.
- **Lark chết → item sống**: identity không phụ thuộc larkRecordId; đo: Lark env rỗng.
- **Override không phá Master**: ràng buộc 1 giữ (không hàm ghi ngược — hiện ĐÃ đúng).

## 34 · CROSS-LANE NOTES

**→ EXECUTION lane** (không sửa hộ, chỉ báo):
- E1. 2 route AI không credit gate: `/api/render/nvidia-image` · `/api/vision/caption`
  (chỉ 401 auth). E2. `from-photo.generateMesh` = direct `fal.subscribe`, ngoài mọi gate —
  khi cắm phải qua route. E3. Cờ `internal` client-khai (đã whitelist 3 task — ghi nhận).
- E4. `GET /api/library` không phân trang, bảng 1611 rows chỉ index `deletedAt`.
- E5. `clip/route.ts` SSRF-shaped (fetch URL tuỳ ý, không sniff, không allowlist) — lệch chính
  sách với route chính.
- E6. `prisma/dev.db` là DB thật (34 cột ProductSpec, chưa matId); `dev.db` root 0 byte — mìn
  cho script trỏ nhầm.

**→ UX lane**:
- U1. 3 chỗ hứa-quá-code phía Library (toast BulkIngest không-idfc · toast "Đã áp" 0 listener ·
  spotlight/trending giả) — cùng họ với 3 nhãn UX lane đã bắt.
- U2. Nút câm "Mở trong InteriorFlow" (/files) · vòng dung lượng luôn 0 · preview /files chỉ
  in đuôi file.
- U3. Cột thông số kệ: 4/6 dòng `—` với dữ liệu thật (priceVnd/unit NULL toàn DB, sku∩code=∅)
  — thiết kế cột phải tính ca dữ-liệu-nghèo.

**→ MAIN (decision cần chốt, KHÔNG phải conflict kiến trúc mới)**:
- M1. `.idfc` v4 additive (provenance + recipe + meshRef) — chạm câu "v3 giữ" của Q3; cần
  xếp Wave + phạm vi tối thiểu.
- M2. Q4 chọn cách nhẹ (cột inline) hay sạch (AssetBlob) — U-Q4-01 còn mở.
- M3. Q5 `ProjectFile` model riêng hay `stage` cột trên LibraryAsset — U-Q5 còn mở; lane
  nghiêng theo T-ADR (model riêng) nhưng cần khớp Manifest Q1.
- M4. DRIFT sổ↔code cần đóng dấu: docstring idfc nói `resolveInputMatId` mà code chưa gọi
  (đúng kế hoạch Slice 1A nhưng đọc như đã-có) · "46 block" vs đếm 41 · `plan-depth.ts:22-29`
  ghi chú "chưa mount" đã lỗi thời · docstring idfc nhắc `payload`/`thumbnail` không có trong
  schema.

**KHÔNG có DECISION CONFLICT** theo nghĩa Blueprint (không evidence nào đá 9 ADR / C1–C4).

## 35 · CHƯA CHẮC

1. **Toàn bộ là phân tích TĨNH** — 0 phút browser/runtime; các claim "0 mount/0 caller" là
   grep + đọc chuỗi import, có thể sót đường động (string import, feature flag).
2. Working tree chưa commit + 2-3 phiên Claude khác đang mở cùng repo — số đo có hạn dùng ngắn;
   worktrees `.claude/worktrees/agent-*` có bản `lib/idfc-import` riêng, cố ý bỏ qua.
3. Chưa chạy test suite nào ngoài `library-item-resolve.test.ts` (33 ok — agent-3 chạy);
   số assertion khác là đếm tĩnh.
4. `surface-graph.ts`/`chuan-net.ts` chưa đọc trọn thân hàm (chỉ signature + block chính);
   `LibrarySheet.tsx`/`GalleryLienNganh.tsx` đọc theo lát.
5. `prisma/dev.db` = DB dev cục bộ; chưa xác nhận `DATABASE_URL` runtime (không đọc `.env`).
6. Số "1616 file uploads ↔ 1611 rows" chưa đối chiếu mồ côi từng file.
7. Đề xuất v4 chưa ước công (dòng/migration) — để MAIN ước khi xếp Wave.
8. `app/api/specs/[id]/route.ts` chưa đọc nội dung (glob bị shell nuốt) — chưa loại trừ đường
   lọt matId qua PATCH.

## 36 · HẠN DÙNG

Kết luận đo tại HEAD `3da4b8c` + working tree 19/08. **Hết hạn khi**: ① Hoà chạy runbook DB /
commit Wave 0 (cột matId xuất hiện) ② Slice 1A bước 2 thi công (resolver/pbr-store đổi hành vi)
③ bất kỳ phiếu nào chạm `lib/cad/idfc.ts` / `library-item-resolve.ts` / `LibraryDropBridge` /
`app/api/library/**` ④ MAIN ra Wave plan cho lane này. Mọi con số grep phải **đo lại tại
nguồn** trước khi làm tiền đề phiếu — không trích file này như sự thật vĩnh viễn (đúng luật
Heatmap B25: "cấm nhớ hộ code").
