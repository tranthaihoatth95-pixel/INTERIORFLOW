# Trinh sát 04 — DÂY MATERIAL "một vật nhiều mặt" (nguyên văn báo cáo agent, 19/08)

## 0. Git — cả lane NẰM TRONG WORKING TREE, chưa commit
HEAD `3da4b8c`. Sửa chưa commit: resolve/pbr-store/ba-mat/warehouse-dto/cad-materials/idfc/
boq model+compute/boq-overrides*/schema.prisma/MaterialsScreen. Untracked: matid-identity.ts
(+test) · pbr-migration.test.ts · scripts/backfill-material-matid.ts. Diffstat lane: 19 file
+503/−69.
**Migration CHƯA chạy — đo bằng dữ liệu**: `sqlite3 "file:prisma/dev.db?mode=ro"
"select count(*) from pragma_table_info('ProductSpec')"` → **34 cột**, có sku/room/confidence,
**không matId** (khớp schema :426-428 "Cột CHƯA MIGRATE"). `dev.db` ở root 0 cột — DB thật là
`prisma/dev.db`.

## 1. `matid-identity.ts` (115 dòng, UNTRACKED)
Docstring 1-19: chốt hoà giải 19/08 SUPERSEDES matId=sku 07/08; KHÔNG sửa normalizeMatId cũ
(KS4). API: `UUID_REGEX` :25 (v1-v8) · `isMatIdUuid` :34-38 · `normalizeMatIdCanonical` :50-52
(trim+lower) · `normalizeSkuBusinessKey` :61-63 (trim+UPPER) · `SkuToMatIdMapping` :76
(caller tự nạp, không đọc DB/localStorage) · `resolveInputMatId` :94-99 (UUID⇒canonical;
sku⇒tra mapping; không có⇒null, không fabricate) · `generateMatId` :110-115. Test 33 assertion,
có ca canh chéo namespace :64-71.
**Callers**: resolve.ts:34 · pbr-store.ts:24 · backfill script :26,78. **`resolveInputMatId`
0 caller production** (idfc.ts:138-139 chỉ NHẮC TÊN trong docstring).
Backfill script: chỉ kind material, DRY-RUN mặc định, `--apply` mới ghi, idempotent, cast tay
prisma vì client chưa generate.

## 2. `resolve.ts` — getMaterial()
`MaterialFacets` :53-68: matId(chuẩn hoá đúng namespace input) · `resolvedVia: 'uuid'|
'legacy-sku'` :61 · pbr :63 · commercial :65 (`CommercialFacet` :38-51 có matId? :43) ·
flat :67. `MaterialSources` :70-77 (pbrMap?/specs?/defs? mặc định MATERIALS).
**Hai đường chọn bằng isMatIdUuid(input) :93**: UUID :93-102 (pbr tra canonical; commercial
tra s.matId; flat tra d.matId CHỈ khi UUID :99) · LEGACY :104-109 (key UPPER; commercial khớp
s.sku; flat khớp sku-upper).
**CALLERS THẬT: 2, đều truyền sku ⇒ hôm nay 100% legacy-sku**:
1. `MaterialsScreen.tsx:98` — `baMatCuaVatLieu(getMaterial(m.sku, {pbrMap, specs, defs}))`
   (chỗ cắm điện 17/08; không sku ⇒ baMatChuaCoMa :97-99).
2. `app/files/_lib/ngan-tho.ts:142` — trong locMonTho (gọi từ NganPhanTho :118).
Test: resolve.test 23 ok (6 ca UUID mới :80-122) · ba-mat.test 38 ok.

## 3. MaterialPbr + pbr-store
### 3.1 `schema.ts:22-107` — 19 trường ALL optional
baseColor/roughness/metallic(0|1)/specular/normalUrl/heightUrl/aoUrl/baseColorMapUrl(sRGB,
map thắng)/roughnessMapUrl/metallicMapUrl/uvScaleMm{w,h}mm-thật/emissive{color,intensity,
kelvin?}/opacity{value,mode}/transmission{value,ior}/clearcoat/sheen/reflectance/suyDoan/typeId.
Máy canh drift: MATERIAL_PBR_KEYS :117-123 + MaterialPbrKeyDriftCheck :128-132. DEFAULT_PBR
:140-144. **Không trường nào trỏ ProductSpec/sku/matId — khoá nối nằm ở KEY của map.**

### 3.2 `pbr-store.ts` — localStorage, KHÔNG IDB
Key `'if.materials.pbr.v1'` :26; Record<matId, MaterialPbr>. `normalizeMatId` CŨ :30-32 =
UPPER (docstring :28-29 "cùng phép so sku"; đầu file :11-17 đánh dấu SUPERSEDED 19/08 nhưng
hành vi giữ — KS4). API: loadPbrMap/getPbr/savePbr/removePbr — đều qua UPPER.
W0.2 thêm: `migratePbrLegacyToCanonical(pbrMap, specs)` :105-132 (COPY key sku-UPPER →
UUID-lower; canonical thắng; legacy KHÔNG xoá) · `ensurePbrCanonicalKeys` :164-173 (chỉ ghi
khi migrated>0; SSR ⇒ null). Test pbr-migration 28 assertion.
**Callers pbr-store**: MaterialsScreen :72 (ensure) + :86 (load) · MaterialPbrEditor :69,81,
96,101 (prop matId = **pbrEditing.sku** — MaterialsScreen:255) · NganPhanTho :115,131 ·
LibrarySheet :404,406,983 (key = **SheetItem.code** — namespace thứ 3).

## 4. `ba-mat.ts`
"Ba mặt" = 3 CHẶNG nhìn cùng matId (MatKhoa :35): ve2d←flat · dung3d←pbr · trinhBay←commercial.
3 trạng thái `du|chuaDu|chuaCo` :43 (lý do :19-21). MatMotMat :45-60 · BaMat :62-68. Hàm:
dinhDangVnd/tomTatPbr/matVe2d :90/matDung3d :111 (ca chuaDu: có baseColorMapUrl thiếu uvScaleMm
:139-148)/matTrinhBay :152 (giá null ⇒ chuaDu :167)/baMatCuaVatLieu :188/baMatChuaCoMa :199
(SUPERSEDED note, logic giữ). Luật cấm chép giá sang thị giác :13-17. Consumers: MaterialsScreen
(+BaMatPanel :242) · ngan-tho :143 (thô = dung3d chưa du).

## 5. `lib/cad/materials.ts` — MaterialDef
Fields :29-76: id/name/category('Sàn'|'Tường/Ốp'|'Sơn')/hatchPattern/patternScale/patternAngle/
color/texture/tones[]/photoUrl?/**atlasRecordId?** :56 (neo larkRecordId — "CHỈ neo, không nhồi
giá")/**matId?** :67 (docstring 19/08: UUID, chờ migration; "hiện 0 preset khai")/pbr? :75.
**Đo lại: `grep -c "matId:"` = 0** — mảng MATERIALS :78-222 **13 preset**, 0 preset khai
matId/atlasRecordId/pbr ⇒ mặt flat của getMaterial hôm nay **luôn null** (resolve.test :58-61
khoá đúng). Lan sang 3D: surface-graph :842 `matId: best?.matId ?? null` — "chưa khai thì null,
KHÔNG bịa" (:794-796, :809).

## 6. ProductSpec + specs.ts + routes
Schema :393-490: id/kind/name/nameEn/brand/sku/vendor/w/d/hUp/materials(JSON)/finishes/colorHex/
imageAssetId/drawingBlock/priceNote/currency/larkRecordId @unique/raw/note/createdAt/syncedAt/
**matId String? @unique :429** (khối luật :418-428: chỉ kind material, 1 UUID↔1 spec, không
model mapping riêng, CHƯA MIGRATE)/unit/priceVnd Decimal?/wastagePercent/packagingSpec/altSku/
styleTags/scope/ownerId/supplierId/verified/room/confidence. Index kind/sku/drawingBlock/scope/
ownerId — **không @@index([matId])** (chỉ implicit unique).
`specs.ts`: SPEC_KINDS :6 · SPEC_ROOM_COLUMN_READY=true :33 (lịch sử mìn :8-31) · specToDto
:57-114 nhận matId?, trả `s.matId ?? null` :78 (comment :76-77 "??-chain trả null tới lúc đó,
KHÔNG throw") · **specNormalize :143-172 + specPatch :176-187 CỐ Ý KHÔNG có matId** (:137-142
— identity không cho client mass-assign).
Routes: GET/POST /api/specs (auth, lọc kind/drawingBlock, validate SPEC_KINDS) · /api/specs/[id]
PATCH/DELETE tồn tại (chưa đọc nội dung — CHƯA CHẮC #3). Không route riêng matId.

## 7. Warehouse
`MaterialSpecDto` (dto :10-45): …**matId: string|null :21** ("null = chưa backfill … KHÔNG bao
giờ = sku" :17-20)… helper materialSourceLabel :52 (ATLAS·Lark nếu larkRecordId) ·
dimensionLabel :59 · imageUrlOf :65. `MaterialWritePayload` :73-99 — **không matId, không qty**.
Nhập XLSX: parseSpreadsheetFile (xlsx-parse :43-70; detectFormat :19,47; vá mojibake CSV
:10-14,51). Callers: MaterialImportWizard :77 · boq-xlsx-import :371 · colors/user-csv :75.
Chuỗi wizard → buildImportRows/runImport → POST /api/specs → specNormalize (không matId).

## 8. ATLAS (`atlas-material-map.ts` + route)
Docstring :6-13: FIELD_NAMES **CHƯA XÁC MINH**, route đọc thật **blocked** (thiếu 4 env).
ATLAS_FIELD_NAMES :17-28 (10 cột). AtlasMaterialUpsertData :30-44 — **KHÔNG matId**.
Route sync: đã thử chạy thật 04/08 và CHẶN — Lark `code 131006 permission denied` tại
resolveWikiAppToken ⇒ field mapping vẫn chưa verify. Guard admin-only; atlasConfigured;
upsert theo larkRecordId (pull-only). ⇒ ATLAS chưa từng ghi được dòng nào; matId không nằm
trong đường ATLAS.

## 9. BOQ — VERIFY ĐÚNG W0.2
`BoqRow.specId` **required** :56 ("KHOÁ THẬT = ProductSpec.id, khớp entity.specId; BẤT BIẾN
specId === matId") · `BoqRow.matId` :66 @deprecated :58-65 ("KHÔNG PHẢI matId UUID canonical…
CẤM đưa vào getMaterial()/pbr-store"; giữ vì IDB persist + XLSX header + UI/test). m2 vs qty
+ unit song song. compute.ts: gom theo specId :274-292; lỗi missing-specId :309,325; mọi
row/error push matId=specId (17 chỗ); chuẩn hoá cuối :588-592.
`boq-overrides.ts`: BoqOverride.specId? :26-28 + matId :29-33 (deprecated, giữ vì đã persist
IDB) · `overrideKey(matId, field)` :41-43 = `${ProductSpec.id}::${field}` (docstring :38-40:
định dạng khoá KHÔNG ĐỔI ở W0.2) · normalizePersistedOverride :60-73 migration-on-read.
Persist: IDB `interiorflow-sheets` route `/boq-overrides` (boq-overrides-persist :17-31).

## 10. `.idfc` facet material
Ruột `{type:'material', pbr, hatch2d?, symbol2d?}` :172-179 — **KHÔNG matId, KHÔNG specId,
không trỏ ProductSpec**. IdfcHatch2d :147-153 (khuôn con MaterialDef). matId trong idfc chỉ ở
`IdfcGeom3d.matId?` :143 (đường component). Commerce :189-199 có sku, không matId/FK.
Migration v1→v2 :243-245 pbr rỗng hợp lệ. Nơi đọc: LibrarySheet :401-406.

## 11. `entity.hatchOverride` — CHƯA CÓ TRONG CODE
Grep toàn repo: **0 hit code**, chỉ 3 hit docs (Blueprint :183,:195 · BAN-GIAO :65 · báo cáo
Slice 1A :55 — mục KHÔNG đụng). Thực tế model.ts: HatchEntity :659-681 có specId? :680
(docstring gọi là "hiện thân của matId" — chữ cũ); specId khác ở BlockEntity :636 /
WallTypeLayer :747 / WallType :774. **Không entity.matId, không hatchOverride.**

## 12. `pbr-from-category.ts`
inferPbrFromCategory :80-89 → InferredPbr{roughness, metallic, suyDoan:true} (:27-32 "luôn
true"). CATEGORY_RULES 11 nhóm :49-71; FALLBACK :74; bẫy đá/da :18-23; cố ý không import
atlas-map :7-11. Callers: MaterialPbrEditor :72,103 (categoryHint = [note,name].join) ·
surface-graph :836 (suyVatLieu). material-edit.ts :14-18 khoá 11 loại khớp bảng.

## 13. BẢNG TỔNG (rút)
| Mặt | Nơi lưu | Khoá nối HIỆN TẠI | Caller |
|---|---|---|---|
| PBR | localStorage if.materials.pbr.v1 | key UPPER(sku); UUID chỉ được COPY sang | MaterialPbrEditor(sku) · MaterialsScreen · NganPhanTho · LibrarySheet(code) |
| Thương mại | ProductSpec→specToDto→DTO | sku; matId khai-chưa-migrate | /api/specs · MaterialsScreen · NganPhanTho |
| Hatch 2D | MaterialDef MATERIALS 13 preset | matId? 0 preset khai · atlasRecordId chưa thấy code tra | getMaterial(defs) · surface-graph |
| Hợp 3 mặt | MaterialFacets | input=sku ⇒ resolvedVia legacy-sku 100% | MaterialsScreen:98 · ngan-tho:142 |
| Vẽ 2D entity | Hatch/BlockEntity.specId | ProductSpec.id FK mềm | computeBoq |
| BOQ | BoqRow | specId required; matId alias cùng giá trị | compute |
| Override giá | IDB /boq-overrides | `${ProductSpec.id}::${field}` | load/save |
| idfc material | body material | KHÔNG khoá; commerce.sku | LibrarySheet:401 |
| idfc 3D | geom3d.matId? | doc nói UUID, export thật = code | LibrarySheet:404 |
| Node vật liệu | util.materialnote params | matId = **ProductSpec.id** (namespace 4) | NodeLibraryPanel:203-213 |
| Legend | matchSpec | code↔sku business key | resolver :141 |

**BỐN thứ cùng tên "matId" hôm nay**: (a) UUID canonical · (b) UPPER(sku) key PBR ·
(c) ProductSpec.id (BOQ/override/node) · (d) SheetItem.code (LibrarySheet→getPbr).

## 14. CHƯA CHẮC (nguyên văn agent)
Chưa chạy test (số assertion đếm tĩnh) · DATABASE_URL chưa đọc (kết luận đúng cho prisma/dev.db)
· /api/specs/[id] chưa đọc nội dung (glob bị zsh nuốt) · idfc-store diff chưa xem ·
atlasRecordId "chưa thấy caller" không phải "chắc 0" · ADR/frontier entry chưa mở (chỉ code tự
khai) · export idfc có ghi UUID chưa — chưa lần theo hàm export (T-lane đã lần: ghi
displayItem.code) · 13 preset đếm tay.
