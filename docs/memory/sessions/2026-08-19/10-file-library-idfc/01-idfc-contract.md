# Trinh sát 01 — HỢP ĐỒNG `.idfc` (nguyên văn báo cáo agent, 19/08)

> Agent Explore đọc-only. T-lane đã spot-check độc lập: matId export = `displayItem.code`
> (`LibrarySheet.tsx:993`) ✅ · `resolveInputMatId` chỉ trong docstring `idfc.ts:138-139` ✅.

## 0. Bản đồ file lane

| File | Dòng | Vai |
|---|---|---|
| `lib/cad/idfc.ts` | 443 | Format core (đã đọc TRỌN) |
| `lib/cad/idfc.test.ts` | 219 | Test round-trip/migration |
| `lib/library/idfc-store.ts` | 92 | Kho studio |
| `lib/library/idfc-store.test.ts` | 157 | Test kho |
| `lib/cad/library-item-resolve.ts` | 156 | Kệ → hình thả xuống |
| `lib/idfc-import/from-photo.ts` | 267 | Ảnh → `.idfc` (cờ 3 nấc) |
| `lib/idfc-import/part-lock.ts` | 452 | Cây cấu kiện + khoá |
| `lib/idfc-import/surface-graph.ts` | ~1290 | Mesh → diện/vật liệu |
| `lib/idfc-import/chuan-net.ts` | 64KB | Fit primitive |
| `lib/idfc-import/glb-stats.ts` | 3KB | Đo GLB |

## 1. Hợp đồng hiện tại (`lib/cad/idfc.ts`)

### 1.1 Version
- `IDFC_VERSION = 3 as const` — `idfc.ts:48`; `IDFC_APP_VERSION = 'interiorflow-1.0.0'` — `:49`.
- `currentIdfcVersion` (`:54`) + cửa hậu test `__setCurrentIdfcVersionForTest` (`:57`) — chỉ ảnh
  hưởng import/migrate, KHÔNG ảnh hưởng export (export luôn ghi hằng, `:306`).

### 1.2 `IdfcFile` (`:201-206`)
`idfcVersion (literal 3) · meta: IdfcMeta · body: IdfcBody · commerce?: IdfcCommerce`.
**KHÔNG có `progress?`** — docstring `:16-17`, `:38-39` khai nhánh tiến độ hoãn (chờ model Task).
`ParsedIdfc` (`:208-212`) = IdfcFile trừ idfcVersion — kiểu kho lưu.

### 1.3 `IdfcMeta` — 12 trường (`:96-116`)
`id?` :98 · `name` :99 (bắt buộc) · `nameEn?` :100 · `code` :101 (bắt buộc, khoá danh tính kho)
· `kind` :103 (bắt buộc từ v2) · `scope?` :104 · `tags?` :105 · `room?` :108 · `author?` :109 ·
`createdAt` :110 · `modifiedAt` :111 · `appVersion` :112 · `sourceLibraryId?` :115 (provenance
duy nhất cấp meta — "CHỈ hiển thị, KHÔNG ghi ngược"). `IdfcScope = 'chung'|'studio'|'du_an'|'chang'` :94.

### 1.4 `IdfcKind` — 12 loại (`:69-76`)
`material · furniture · millwork · fitout · fixture · soft · page · video · doc · asset ·
brandkit · preset`. `SELLABLE_KINDS` = 6 đầu (`:81`) — **0 caller** toàn repo. `BODY_TYPE_OF_KIND`
(`:84-88`): 5 kind vật lý chung ruột `component`. Import KHÔNG drop commerce của kind không bán
được (`:440` nhận vô điều kiện).

### 1.5 `IdfcBody` — union 8 nhánh (`:170-185`)
| type | ruột | dòng |
|---|---|---|
| component | `geom2d` (BẮT BUỘC), `geom3d?`, `params?: ShapeVariant[]` | 171 |
| material | `pbr: MaterialPbr` (BẮT BUỘC), `hatch2d?`, `symbol2d?` | 172-179 |
| page | `slide: Record<string,unknown>` | 180 |
| video | `shots: unknown[]`, `music?` | 181 |
| doc | `template: Record<string,unknown>` | 182 |
| asset | `imageUrl`, `wPx?`, `hPx?`, `caption?` | 183 |
| brandkit | `logoUrl?`, `colors: string[]`, `fonts?` | 184 |
| preset | `params: Record<string,unknown>` | 185 |

- `IdfcGeom2d` (`:122-130`): `group: BlockGroup, w, h, prims: Prim[], variants?, anchors?,
  clearance?` — snapshot TỰ CHỨA, không phụ thuộc registry `BLOCKS` (`:120-121`).
- `IdfcGeom3d` (`:140-145`): `heightMm?, bevelMm?, matId?: string, pbr?` — KHÔNG mesh (K1 `:132`).
- `IdfcHatch2d` (`:149-154`): `hatchPattern, patternScale?, patternAngle?, color?`.
- 5 ruột K4 (page/video/doc/brandkit/preset) là khởi điểm tối thiểu (`:159-168`). ⚠️ Docstring
  nhắc `payload` (`:162`) nhưng union KHÔNG có field đó — comment lệch code.

### 1.6 `IdfcCommerce` (`:189-199`)
`brand? · sku? · vendor? · priceVnd?: number · priceNote? · currency?('VND'|'USD'|'EUR') ·
unit? · materials?: string[] · finishes?: string[]`. V2 đã bỏ `commerce.kind` (`:187-188`).

### 1.7 Cờ tin cậy — KHÔNG CÓ trong hợp đồng
Không tồn tại measured/inferred/verified trong idfc.ts. Cờ 3 nấc nằm NGOÀI: `from-photo.ts:35`
`ProvenanceFlag`, ghi vào khoá mở rộng `xFromPhoto` (`from-photo.ts:147`; lý do `:19-21`:
"đưa mesh vào ruột chính thức = migration v4, NGOÀI phạm vi").

### 1.8 `IDFC_MIGRATIONS` — migration THẬT (`:268-271`)
- v1→v2 (`:233-253`): `V1_KIND_MAP` (`lighting→fixture`, `:217-219`); thiếu commerce.kind ⇒
  `'furniture'`; xoá commerce.kind (`:237`); material ⇒ `{type:'material', pbr: geom3d?.pbr ?? {},
  symbol2d: geom2d}` (`:244`); còn lại ⇒ component (`:246`).
- v2→v3 (`:261-263`): thuần bump (preset additive, `:256-258`).
- `migrateIdfc` (`:273-289`): null khi không object/from>to/thiếu hàm; nâng 1 bậc/vòng.

### 1.9 Parse/serialize/validate
- `exportIdfc` (`:299-320`): đòi name/code/kind (`:300`); tự điền createdAt/modifiedAt(=now
  `:313`)/appVersion; **không validate body trước khi xuất**.
- `importIdfc` (`:381-443`): không throw. JSON.parse → isPlainObject → idfcVersion number →
  mới hơn ⇒ từ chối "bản IF mới hơn" (`:396-399`) → cũ hơn ⇒ migrate → name/code string →
  kind ∈ IDFC_KINDS → `bodyError()` → dựng meta sạch từng trường → commerce nhận nguyên khối.
- **Validate NÔNG không đều**: meta sanitize kỹ (scope whitelist :431, tags lọc :432,
  createdAt thiếu ⇒ TỰ BỊA now :435-436, appVersion ⇒ 'unknown' :437); body chỉ kiểm
  discriminant + 1 field/nhánh (`bodyError` :340-374; `isValidGeom2d` :328-336 — group chỉ cần
  string, w/h chỉ cần number, prims chỉ cần Array **không kiểm phần tử**; material chỉ cần
  pbr là object — `{}` hợp lệ); body sau đó **cast thẳng** (`:442`); commerce cast thẳng
  (`:440` — priceVnd string vẫn lọt). **Khoá lạ MẤT khi qua importIdfc** (chỉ trả
  {meta,body,commerce} — lý do from-photo giữ idfcJson riêng `:80-82`).
- `lastImportIdfcError` (`:293-295`): 3 nhánh sớm (parse hỏng :386, !plainObject :389,
  version không number :392) trả null **mà không set lý do**.

## 2. Kho `lib/library/idfc-store.ts`
- Canonical = **IndexedDB** (W0.3 19/08) qua `createStudioBlobStore` (`:18,41-46`) →
  `lib/storage/studio-persist.ts` — DB `interiorflow-sheets`/store `sheets`, khoá
  `studio::/studio-idfc` (`:22`). localStorage cũ `if.library.idfc.v1` (`:21`) chỉ là cầu
  di trú đọc-một-lần (`readLegacy` :29-39; không ghi mới, không xoá `:11-12`).
- `StoredIdfc extends ParsedIdfc {storedAt}` (`:24-27`) — **không lưu idfcVersion** ⇒ không
  version pinning; món cũ mất dấu version nguồn.
- CRUD: `hydrateIdfcStore` :49 · `loadIdfcStore` :53 (sync cache) · `saveIdfcItems` :59-68
  (**upsert theo `meta.code` — đè phẳng** :61-64) · `removeIdfc` :70-73 (không kiểm tham chiếu)
  · `exportIdfcStoreJson` :84-87 (gói {version:1, exportedAt, items} — **0 caller UI**, khai
  "năng lực trước, nút sau" :75) · `__resetIdfcStoreForTest` :90.
- **KHÔNG có import ngược/update-in-place** (một chiều :14-15). **KHÔNG where-used.**
- Test: FakeLocalStorage; chỉ phủ cầu localStorage + logic thuần (`:33-35` tự khai IDB no-op
  trong Node). Ca: kho rỗng · JSON hỏng ⇒ [] · không mảng ⇒ [] · upsert không nhân đôi ·
  cộng dồn · remove đúng 1 · remove mã lạ không throw. KHÔNG test IDB/hydrate/export.

## 3. `library-item-resolve.ts` — resolve ra BLOCK, không phải `.idfc`
- `ResolvedLibraryItem` (`:49-51`): `{via:'blockdef', def: BlockDef, keepsIdentity:true,
  approximate, specId?}` (kho `BLOCKS` ~46 block vector, `:18-19`) | `{via:'manifest',
  meta: LibraryBlockMeta, keepsIdentity:false, approximate, specId?}` (54 DXF, đường rời
  mất danh tính `:20-21`).
- Input `LibraryItemRef {name, code, kind?}` (`:33-39`) — **KHÔNG nhận ParsedIdfc, KHÔNG đọc
  body.geom2d, 0 import từ lib/cad/idfc**.
- specLinks: `specId = matchSpec(item.code, specs)?.id` (`:140`) — `code ↔ ProductSpec.sku`
  business-key lookup, KHÔNG phải material identity (`:128-131`). Không truyền specs ⇒ luôn
  undefined (`:126`).
- `DROPPABLE_ITEM_KINDS = ['block','furniture','symbol','cluster','sanitary','misc']` (`:55`)
  — là ThumbKind; material/preset/page bị loại sớm (`:138`).
- `matchByName` (`:90-116`): trùng khít ⇒ approximate:false; chặn tên <4 ký tự; kệ-chứa-kho ⇒
  lấy dài nhất; kho-chứa-kệ ⇒ chỉ khi duy nhất. 3 ca hồi quy đã vá ghi ở `:70-88`.

### 3.1 ĐỨT GÃY instance hoá (trace đầy đủ)
1. `LibrarySheet.tsx:288-296` dựng SheetItem từ StoredIdfc — chỉ lấy name/code/kind/scope,
   **bỏ body.geom2d**.
2. `use()` → `instantiate()` (`:446, :429-431`) — dispatch `LIBRARY_INSTANTIATE_EVENT` (`:68`)
   detail chỉ {name, code, kind}.
3. `LibraryDropBridge.tsx:29,100-113` nghe (mount `CadEditor.tsx:689`).
4. `:51` `resolveLibraryItem(item, manifest)` → khớp lại theo TÊN vào BLOCKS.
5. `:60-69` tạo `Entity {type:'block', block: hit.def.id}`.
⇒ `body.geom2d.prims` không bao giờ thành entity. `.idfc` có hình mà tên không khớp BLOCKS ⇒
"chưa có hình cho món này" (`:154-156`); khớp tên ⇒ thả ra block CỦA APP ĐÍCH, không phải hình
trong file — phá lý do tồn tại của snapshot tự chứa (`idfc.ts:120-121`).

## 4. Callers
### Sống
| Caller | file:line | Việc |
|---|---|---|
| BulkIngestMode | `BulkIngestMode.tsx:7,69,74` importIdfc+lastImportIdfcError; `:8,161` saveIdfcItems | NHẬP — mount LibrarySheet:522 → AppShell:202 |
| LibrarySheet nút "Xuất .idfc" | `:33` import exportIdfc; `:985-1005` gọi | XUẤT — chỉ hiện khi `via==='blockdef'` (`:975-976`) ⇒ món nhập ngoài không xuất lại được |
| LibrarySheet kệ common-idfc | `:31,290-291,286-296` | HIỆN kho |
| Lọc 12 kind | `:33,159,603-618` | |
| thumb-kinds | `thumb-kinds.ts:219,221,240,259` | map ThumbKind↔IdfcKind |
| Command3DPanel | `:108` | mở kệ |

### 0-caller production
`lib/idfc-import/from-photo.ts` (buildIdfcFromPhoto/importFromPhoto/classifyPhoto/generateMesh
— chỉ test; mặt tiền UI "CÒN CHỜ PHIẾU SAU" `frontier-registry.mjs:151`) · `part-lock.ts` 6
export · `surface-graph.ts` ~30 export (chỉ part-lock import type) · `chuan-net.ts` ·
`glb-stats.ts` · `exportIdfcStoreJson` · `SELLABLE_KINDS` · `migrateIdfc` (ngoài nội bộ).
`scripts/proof-ghe-3d-library.ts:88-108`: script tay, ghi `.idfc` thẳng `LibraryAsset.content`
(`:99`), KHÔNG gọi importIdfc (chỉ JSON.parse fail-sớm :89 + trần 20.000 ký tự :90) — đường
ghi `.idfc` vào DB duy nhất, không ai đọc ngược.

### Lincoln
- Pipeline đủ nhưng 0 nút UI. Model 3D hiện qua hardcode `LibrarySheet.tsx:91-92`
  `OBJECT_3D_MODELS = [{match:/lincoln 327/i, glbUrl:'/library-assets/lincoln-327/…obj',…}]`;
  tự khai chỗ tạm `:88-90` (đường đúng = tag `has3d:`).
- File thật: `public/library-assets/lincoln-327/*` + `public/__lincoln.glb`.

## 5. part-lock + surface-graph — cờ
- Cờ 3 nấc ở `from-photo.ts:35` `ProvenanceFlag = 'measured'|'inferred'|'verified'`;
  `ProvenancedValue{value,flag,source}` :37-42 (source: URL hãng · `vision:<model>` ·
  `fal:<model>#<requestId>`). Áp per-trường trong `xFromPhoto` (`:147-178`): mesh inferred
  :155 · classification inferred :161-165 · wMm/dMm/hMm verified+sourceUrl :169-171 ·
  seatHMm/weightKg chỉ khai khi có :172-173 ("thiếu thì KHÔNG khai") · geom2dFlag inferred
  :175 · `reviewStatus:'draft-pending-review'` :177 (0 UI đọc). Nấc `measured` khai nhưng
  KHÔNG dùng.
- `PartLockPart` (`part-lock.ts:127-136`): `khoa: boolean` (2 trạng thái, KHÔNG 3 nấc) +
  `provenance: string` (chuỗi tự do người đọc, vd :218,:285,:304,:328). `GeomRef` union
  meshSubset|buildOp (`:108-125`). `partContentHash` FNV-1a cố ý loại khoa+provenance
  (`:99-104`). `regenerateUnlocked` :425-435.
- `surface-graph.ts`: `VatLieuSuy.inferred: true` LUÔN true (`:801`); `Dien.nghiVanBongSan?`
  :874 (chỉ gắn cờ, không tự xoá); `CauKienVatLieu` :878-887. **Không type nào của 2 file này
  xuất hiện trong IdfcBody.**

## 6. `.idfc` ↔ material — 3 đường không thống nhất
`geom3d.matId?: string` tự do :143 · `geom3d.pbr?` :144 (chỉ khi chưa có matId :133-134) ·
ruột material `pbr + hatch2d? + symbol2d?` :172-179 (**không matId/specId**) · `commerce.sku?`/
`materials?: string[]` :191,196. **Không có specId ở đâu trong `.idfc`** (specId chỉ ở
entity/Doc `model.ts:674` + output resolver).

### MÂU THUẪN matId (đang mở)
Docstring :136-139 (sửa chưa commit): "v3+ export ghi UUID… importIdfc resolve qua
`resolveInputMatId`" — **code không import/gọi** (grep 0 caller, chỉ khai
`matid-identity.ts:94`). Export `LibrarySheet.tsx:993` ghi `matId: displayItem.code`
(business key). Test khoá hành vi cũ: `idfc.test.ts:37` 'W-102', `:126` 'FJ-PEL-01',
`:150` 'SW-TRV-BE'. `git diff --stat lib/cad/idfc.ts` = 9 dòng thuần comment.

## 7. Variant/override/instance trong idfc code — KHÔNG CÓ
`srcInsertId`: 0 hit trong file idfc nào (chỉ `model.ts:367` + helper, `dxf.ts:556`,
`CadEditor.tsx:2898-2911`). `override`: chỉ wall-types/paper-space/plan-drawon — 0 hit idfc*.
`variant` trong idfc = `ShapeVariant[]` hình học (:127, :171), không phải variant sản phẩm.
Không `instanceOf/parentId/baseId/overrides`. Upsert kho = đè phẳng mất bản cũ.

## 8. Viewer/preview/thumbnail
- `public/__lincoln-viewer.html` CÓ (30 dòng, three từ CDN unpkg, GLTFLoader `/__lincoln.glb`,
  hook `window.__spin`, title READY — artifact proof cho `_shot.mjs`). **0 tham chiếu từ app.**
- Viewer thật: `Object3DWindow.tsx` + `Object3DToggle.tsx`, URL từ regex tên món.
- **Thumbnail `.idfc`: KHÔNG SINH** — SheetItem từ StoredIdfc không set imageUrl
  (`LibrarySheet.tsx:290-296`) ⇒ `ItemThumb` luôn fallback vân/icon (`ItemThumb.tsx:53-61`).
  Kind `asset` có `body.imageUrl` cũng không được map. Ảnh thật duy nhất qua
  `LibraryAsset.path` do script proof ghi tay.

## 9. Bảng tổng trạng thái
(v3 migration thật · meta 12 trường sanitize · body 8 nhánh 5 placeholder · commerce không
validate · progress chưa khai · cờ tin cậy ngoài hợp đồng · provenance = sourceLibraryId+author
· validate nông · matId doc↔code mâu thuẫn mở · variant/override/instance chưa có · kho IDB
upsert-đè không pin không where-used · instance hoá ĐỨT · thumbnail không sinh · pipeline ảnh
0 caller · part-lock/surface-graph 0 caller chưa nối IdfcBody)

## 10. CHƯA CHẮC (nguyên văn agent)
1. surface-graph.ts chỉ đọc export + block 784-912; thân hàm fit chưa đọc.
2. chuan-net.ts chưa đọc trực tiếp (shape suy qua Extract ở part-lock:121-122).
3. part-lock.ts đoạn 215-414 chỉ grep.
4. LibrarySheet.tsx chỉ đọc lát liên quan.
5. idfc.test.ts chưa đọc trọn 219 dòng.
6. studio-persist.ts chỉ grep (race set/hydrate chưa xác minh).
7. `getPbr(displayItem.code)` normalize đường nào — chưa kết luận nút Xuất lấy đúng PBR không.
8. Chưa chạy runtime — mọi kết luận đọc tĩnh.
9. Worktrees agent-* có bản idfc riêng — cố ý bỏ qua.
10. Docs (AUDIT-Q0, M-IDFC-OUT, 00-CHOT §11) không đọc theo yêu cầu phiếu — chỉ báo code nói gì.
11. Working tree 20+ file sửa dở — đọc working tree không phải HEAD.
12. Chưa grep chuỗi "idfc" trong app/api/ để loại trừ route ẩn.
