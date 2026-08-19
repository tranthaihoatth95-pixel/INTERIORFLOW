# Trinh sát 03 — MASTER LIBRARY (nguyên văn báo cáo agent, 19/08)

> T-lane spot-check: spotlight `items[0]` (`LibrarySheet.tsx:414`) ✅ · `LIBRARY_APPLY_EVENT`
> 1 phát (`:442`) / 0 listener ✅ · DropBridge không truyền specs, entity không specId ✅.

## 1. `lib/library/**`

### 1.1 HAI mô hình dữ liệu song song
- **A (legacy, mã chết)**: `LibraryItem`/`LibraryShelf` (`types.ts:15-38`) — usageCount/author/
  version/thumbnail gradient/matId? — **0 nơi dùng** ngoài chính file. Thứ SỐNG trong file:
  ScopeLevel/StageKey/SCOPE_META/STAGE_META/PublishDraft/CommentEntry.
- **B (thật)**: `SheetItem` (`shelves.ts:136-151`) `{id, shelfId, name, code, kind: ThumbKind,
  scope, mechanic, imageUrl?, recent?}`. `ShelfDef` :27-44 — `count` luôn null, số thật tính runtime.

### 1.2 Kệ (`shelves.ts:47-84`)
STAGE: cad 5 kệ (kyhieu/sheet/room/hatch/form) · render 4 (preset/mood/chain/form) · present 5
(page/mata3/boq/doc/video). COMMON 6: idfc :76 · atlas :78 · brand :80 · asset :81 ·
direction :82 · theme :83. Kệ 16+1: `cad-clusters` khai cục bộ `LibrarySheet.tsx:72`, xếp ngăn
qua `BAY_OF_SHELF` :124. Bay 5 ngăn :115-121. `MATERIAL_GROUPS` 5 nhóm :94-100 (chỉ ở
common-atlas :104). `BUILTIN_ITEMS` :165-174 — CHỈ cad-kyhieu 12 dòng. `LIBRARY_DATA_IS_MOCK
= false` :25. `APPLY_SHELVES` :184 = {cad-hatch, render-preset, common-atlas, common-theme} →
mechanic 'ap'; còn lại 'keo'. `itemsFor` :222-237.

### 1.3 Files còn lại
db-items (SỐNG — GET /api/library → SheetItem, trần 240/kệ :103) · idfc-store (SỐNG, IDB) ·
spec-panel (SỐNG — buildSpecRows :74-98, matchSpec code↔sku :51-55) · thumb-kinds (SỐNG) ·
use-library-sheet (SỐNG — openLibrarySheet :29-32) · local-state (NỬA SỐNG —
`interiorflow.library_g4.local_state_v1`; specLinks :25; **bumpUsage :71 + addComment :103 =
0 caller**) · gallery-data (SỐNG) · gallery-tags (SỐNG) · gallery-local-state (cục bộ, tự khai
không ghi kho chung :13-14) · gallery-source-guard (SỐNG — chặn Pinterest :20-22).

### 1.4 Mount
Sheet mount DUY NHẤT `AppShell.tsx:40,202` (mọi màn bọc AppShell). Rail "Thư viện"
`muc-dieu-huong.ts:153-158` → `/library` redirect + mở sheet.

## 2. LibrarySheet (1039+ dòng)

### 2.1 Kệ nào THẬT có dữ liệu — đo `prisma/dev.db`
| kệ | nguồn | số đo |
|---|---|---|
| cad-kyhieu | hardcode | 12 |
| common-idfc | idfc-store IDB | 0 mặc định |
| cad-clusters | CLUSTER_SPECS | 6 |
| common-atlas | DB usage=material | 14 |
| render-preset | DB tag shelf: | 5 seed |
| common-asset | DB usage khác | ~1592 → cap 240 |
| 12 kệ còn lại | không nguồn | 0 → empty-state :753-777 |

DB: LibraryAsset (deletedAt null) **1611** — furniture 6 · layout 521 · material 14 ·
ref-render 540 · slide 530; tag `shelf:*` 18 dòng (seed + Lincoln). **Không manifest tĩnh nào
cấp món cho kệ** (manifest chỉ ở tầng thả — resolver).

### 2.2 Spotlight — XÁC NHẬN GIẢ
`:414` `spotlightItem = items[0] ?? null`; chỉ hiện khi discoverMode ≠ browse (`:708`);
'featured' = slice(0,4); 'trending' sort theo `recent` mà **recent không bao giờ được gán**
(builtin bỏ :194; db-items :83-97 không set; idfc :301-304 không set).

### 2.3 Cột thông số ④ — dữ liệu thật NGHÈO
Đường: fetch /api/specs :341-356 → displaySpecSource :379-391 (① idfc commerce · ② linkedSpec
gán tay localStorage · ③ matchSpec) → buildSpecRows :410 → render :900-912.
DB: **ProductSpec 10 dòng** (furniture 7 · lighting 1 · material 2); sku 10/10;
**priceVnd NOT NULL = 0; unit rỗng toàn bộ**. Mã món trên kệ (DOOR-S-800…, SOFA-VEL, LIB-XXXXXX)
∩ sku = ∅ ⇒ **4/6 dòng hiện `—` trên mọi món** (Hãng/Đơn vị/Giá/nhám-bóng); nhám/bóng đọc
`getPbr(code)` từ localStorage rỗng user mới. App nói thật chỗ trống (`:916-923`;
spec-panel :8-11 cấm bịa). w×d×h nấc Lớn :781-782 cùng lý do — không bao giờ hiện.

### 2.4 Panels
LibrarySheet SỐNG · ClusterPanel SỐNG chạy thật (addEntities :225) · ItemThumb SỐNG (bậc thang
ảnh→cầu→vân) · BulkIngestMode NỬA SỐNG · PublishModal CÓ-MÃ-CHƯA-CẮM (tự khai "publish thật
chưa có backend" :19-21; chỉ localStorage :1022) · Object3DToggle/Window SỐNG nhưng hardcode
1 món (regex /lincoln 327/i :91-93; asset + obj/mtl thật) · GalleryLienNganh SỐNG.

### 2.5 🔴 BulkIngestMode — nhánh không-idfc là TOAST GIẢ
`:159` good = files có idfc → `:161` saveIdfcItems(good); `:167-169` rest → toast "Đã đưa
{rest} tệp vào kho — chờ chủ studio duyệt" — **không fetch/POST nào**. `:522` còn refreshDb()
sau đó. Docstring :44-51 khai phạm vi nhưng KHÔNG khai toast này.

## 3. Panels khác
- `LibraryPanel.tsx` SỐNG — kho ảnh ref ở Home (lazy heavy-panels :67-68; gate panel==='assets');
  cùng bảng LibraryAsset, mặt tiền khác (5 category riêng, ASSET_MIME → FlowCanvas).
  ⇒ **LibraryAsset có 3 mặt tiền độc lập, 3 phân loại khác nhau**.
- `NodeLibraryPanel.tsx` SỐNG — thư viện NODE (registry + kệ vật liệu /api/specs?kind=material;
  DND_MIME/MAT_MIME/MINDMAP_MIME → FlowCanvas). Ghi chú de-dup: vật liệu từng hiện 3 chỗ, đã
  xoá 1 (`Object3DTree.tsx:8-10`).
- `components/cad-library/**` **KHÔNG TỒN TẠI** — thứ có: `public/cad-library/**` (54 dxf +
  54 svg + manifest) · `scripts/cad-library/*` (bộ sinh chạy tay) · UI duyệt block sống ở
  `CadEditor.tsx:1527-1570` (FurniturePanel tab basic/lib).

## 4. Block library + CLUSTER_SPECS
- manifest.json: version 1 · 2026-08-06 · unit mm · 54 block/12 nhóm · schema
  {id,name,category,categoryLabel,w,h,file,thumb,source,license} — **0 dữ liệu thương mại**.
  DXF thật, parse `inferRules: null` (:96, lý do G-M1-19 :89-95). `insertBlockById` :239-250 →
  `flattenBlockEntities` :135-193 = đường rời MẤT danh tính.
- `BLOCKS` furniture.ts :486 — đếm **41 BlockDef** (47 `id:` − 6 của ShapeVariant); variants ×3,
  clearance ×13, hosted ×9, **meta ×0** (giá/mã/NCC chưa dòng nào khai). ⚠️ Docstring nhiều nơi
  ghi "46" (`library-item-resolve.ts:17`, `CadEditor.tsx:1531`) — lệch số đo 41 (chưa chạy
  runtime xác nhận).
- CLUSTER_SPECS :533-619 — 6 cụm (spine-l/bench-row/cluster-y/cluster-120/cluster-cross/
  meeting-table); ClusterParamDef có `why` (nguồn trị số); meeting đối chiếu TCVN 4601
  (1.8 m²/người, checkMeetingArea :463); hằng Neufert SEAT_WIDTH 600/CHAIR_ACCESS 700/
  MEETING_AISLE 900; clusterSeed FNV-1a :637-643.

## 5. Đường instance hoá
### 5.1 Flow 2D (SỐNG)
click=chọn :812 · dblclick=use :813 · dragEnd=instantiate :810 · nút "Kéo ra bàn" :962 ·
use = mechanic==='ap' ? applyPreset : instantiate :446 · instantiate dispatch
`if:library-instantiate` {name,code,kind,claimed:false} :429-439 → `LibraryDropBridge.tsx:104-113`
(mount CadEditor:689 — CHỈ màn 2D đón) → loadManifest :56 → `resolveLibraryItem(item, manifest)`
:57 **KHÔNG truyền specs** → blockdef ⇒ BlockEntity {block, at giữa viewport, rot 0, sx/sy 1}
:66-85 → addEntities :77; manifest ⇒ entity rời :88-94; không khớp ⇒ toast unresolvedMessage.
`claimed` false ⇒ toast "màn đang mở không có bản vẽ" :432.

### 5.2 🔴 Ba lỗ đo được
1. **specId không bao giờ gán khi thả** — caller thiếu tham số specs; entity dựng không gán
   hit.specId ⇒ món thả không lên BOQ/legend (trái docstring :17-18 hai file).
2. **srcInsertId không được đặt** — nơi ghi duy nhất `dxf.ts:556`; store :585 chỉ GỠ ⇒ món thả
   không có bản-chèn, không nở cụm.
3. **Kệ .idfc thả không ra hình** — resolver chỉ biết BLOCKS+manifest; `.idfc` nhập ngoài không
   nằm 2 kho đó ⇒ luôn unresolvedMessage; `IdfcBody.geom2d` không đường dựng entity.

### 5.3 Áp preset — CHƯA CẮM
`LIBRARY_APPLY_EVENT` :69; applyPreset :441-444 dispatch + toast "Đã áp… lên vật đang chọn"
VÔ ĐIỀU KIỆN — **1 phát, 0 nghe** ⇒ mọi món kệ 'ap' bấm chỉ ra toast. Docstring :66-67 tự khai.

### 5.4 MIME thật 0 consumer
`application/x-if-library-item` :805 — 1 hit duy nhất. Đường thả thực = onDragEnd.

### 5.5 Cụm bàn — đường trọn vẹn duy nhất
ClusterPanel :215-232: clusterPrimsToEntities → addEntities, 1 nấc Undo, status nói kích
thước/chỗ/m²/seed. Không event/resolver. Sinh prims rời — không BlockEntity/specId/srcInsertId
(lý do block-library :201-205).

### 5.6 3D — 0 listener instantiate
Command3DPanel :108-109 / Object3DInspector :88 chỉ MỞ kệ; thả ở 3D ⇒ toast "Mở chặng 2D rồi
thả lại" :435.

### 5.7 model.ts liên quan
BlockEntity :615-648 (block/at/rot/sx/sy/variant?/collision?/specId? :636/hostId?) ·
srcInsertId :367 + nở cụm :426-461 · HatchEntity.specId :680 ("Chưa có UI gán ở IF1") ·
WallRun.specId :747 · WallType.specId :774. **KHÔNG hatchOverride (grep 0), KHÔNG entity.matId**
(:674 chỉ nhắc; field song song chờ Slice 1A — `library-item-resolve.ts:128-131`).

### 5.8 Test chạy thật
`sucrase-node lib/cad/library-item-resolve.test.ts` → **33 ok, 0 fail**; dòng đo: kệ Ký hiệu
12 món → **8/12 thả được**, còn lại báo "chưa có hình".

## 6. Where-used — KHÔNG CÓ CƠ CHẾ NÀO
usageCount (mã chết) · bumpUsage 0 caller · Prisma 0 model/cột nối LibraryAsset/ProductSpec↔
Project · BlockEntity.specId FK mềm một chiều 0 query ngược · `sourceLibraryId` ghi khi xuất
(:987), 0 nơi đọc.

## 7. ProductSpec / warehouse
- schema :393-… 34 cột; `matId String? @unique` :429 **CHƯA MIGRATE** (docstring :427-428);
  specToDto fallback null :76-78; specNormalize/specPatch cố ý loại matId :137-140.
- Routes: /api/specs GET/POST; /api/specs/[id] PATCH/DELETE (requireAdmin — ghi chú
  local-state :21).
- seed-specs: 10 spec upsert theo sku; giá chỉ priceNote text — khớp DB đo.
- warehouse: xlsx-parse (detectFormat + vá mojibake) · column-mapping · image-match
  (**POST /api/library** :188 — ảnh vật liệu vào LibraryAsset) · apply-import (**POST /api/specs
  từng dòng** :298-299) · dto (matId :20 · room/confidence :41-42 · materialSourceLabel).
- MaterialsScreen: nạp specs KHÔNG lọc kind :64 (lý do :53-60); lối vào /materials =
  Settings→Nâng cao (`PixelSettingsShell.tsx:73`) + BoqErrors :80; **không mục rail riêng**
  (muc-dieu-huong :250 sáng chung ô Thư viện). MaterialFormModal cũng gọi từ LibrarySheet
  :643,1028-1037.
- ATLAS: app/api/atlas-materials + atlas-material-map — sync 1 chiều theo larkRecordId.

## 8. Gallery — SỐNG
`app/library/gallery/page.tsx` (AppShell active render; GalleryNavigator; GalleryLienNganh).
Đọc đúng LibraryAsset qua GET /api/library (`gallery-data.ts:72-102`) — không bảng/cột mới.
Phân loại qua tags. Luật thật: collectionsFrom bỏ ảnh thiếu nguồn/license :130-143. Chặn
Pinterest. Gallery = mặt tuyển chọn của kệ common-asset (lối ra sheet :567-582, cố ý không
thành shrow :564-566; chiều ngược GalleryLienNganh :244 openLibrarySheet). Đề xuất nguồn chỉ
localStorage máy người xem.

## 9. Bảng tổng SỐNG vs CHƯA-CẮM
(nguyên văn agent — SỐNG 18 dòng: rail/phím L/⌘K · 6 kệ dữ liệu · thả 2D · nhập/xuất idfc ·
lọc/3 nấc thẻ · ItemThumb 3 bậc · Object3DWindow 1 món · buoc-mau · gán tay spec · gallery ·
/materials wizard · LibraryPanel · NodeLibraryPanel · FurniturePanel 54 DXF.
CHƯA-CẮM 18 dòng: applyPreset · bulk-ingest không-idfc toast giả · Publish localStorage ·
specId lúc thả · srcInsertId · thả idfc geom2d · sourceLibraryId 0 đọc · cột thông số
Hãng/Giá/Đơn vị/nhám/bóng · w×d×h nấc Lớn · Nổi bật/Top tuần/Spotlight · bumpUsage/addComment ·
LibraryItem/Shelf chết · MIME 0 consumer · ShapeMeta 0/41 · HatchEntity.specId 0 UI ·
ProductSpec.matId chưa migrate · instantiate 3D 0 listener · đề xuất nguồn Gallery cục bộ ·
where-used không tồn tại.)

## 10. CHƯA CHẮC (nguyên văn agent)
Số 46 vs 41 (chưa runtime BLOCKS.length) · prisma/dev.db là DB nào (còn dev-sach.db; chưa đọc
DATABASE_URL) · 240 nào lọt cap theo createdAt desc chưa verify UI · cột matId trên DB thật
chưa PRAGMA (lane khác đã đo: chưa có) · ClusterPanel/Object3DWindow/GalleryLienNganh chỉ đọc
phần đầu · clip route chưa đọc · buoc-mau/ColorLibraryScreen chưa trace nguồn màu ·
studio-persist chưa verify implementation · test khác chưa chạy · proof-ghe-3d chưa đọc.
