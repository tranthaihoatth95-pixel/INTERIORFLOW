# Trinh sát 06 — PRIMITIVES REPRESENTATION (plan/elevation/3D/preview) (nguyên văn, 19/08)

## 1. 2D PLAN SYMBOL

### 1.1 Hai kho block ĐỘC LẬP
Kho ① "vẽ tay": `BlockDef` (furniture.ts:24-47) + BLOCKS :486/BLOCK_MAP :643 → BlockEntity
GIỮ danh tính. Kho ② DXF: `LibraryBlockMeta` (block-library.ts:24-38) + manifest 54 block →
entity rời MẤT danh tính. Ranh giới khai ở block-library :2-9 + library-item-resolve :16-24.

### 1.2 BlockDef
id/name/group/w/h/prims + variants? :36 + **anchors? :38 (SnapAnchor CÓ)** + clearance? :40 +
meta? :42 (ShapeMeta price/vendor/sku) + hosted? :46. `Prim` = line|poly|circle|arc :18-22 —
**không ellipse/spline/text/hatch**. **Insertion point = TÂM, ngầm định** (:4-6 "gốc ở TÂM").
**bbox = w/h KHAI TAY** ("kích thước danh nghĩa" :29-31; đối chiếu ClusterResult.sizeMm ĐO
thật). **KHÔNG detail level/LOD.** shared-types :19-63: BlockGroup 10 nhóm · ShapeVariant ·
SnapAnchor {kind wall-back|wall-side|floor, pt, normal} · ClearanceZone · ShapeMeta.

### 1.3 BlockEntity (model.ts:615-648)
type block/block/at/rot(rad)/sx/sy :617-623 · variant? :627 · collision? :630 (runtime, không
serialize) · specId? :636 · hostId? :647. Kế thừa Base :230-367 (…ops?/recipe?/srcInsertId?).
Phép biến hình scale→rotate→translate khai 3 chỗ phải khớp: model :1200-1210 blockToWorld ·
render :110-116 · block-library :120-128 transformPt.

### 1.4 Block DXF — KHÔNG insertion point khai báo
DXF chỉ $INSUNITS 4 (mm) + ENTITIES; grep INSBASE|BLOCKS|INSERT trên living-sofa-2seat = 0.
Toạ độ LOCAL quanh gốc nhưng **không đảm bảo tâm**: ca đo x∈[−800,800] đối xứng, y∈[−425,+1267]
lệch; w/h khai 1600×850 **không khớp bbox y thật 1692**. manifest không basePoint/anchors/
clearance/unit-per-block. InsertOptions {rot?,sx?,sy?,layer?} mặc định sx=1; bán kính/chữ nhân
scaleMag :140-169. Parse inferRules:null :89-96. flatten bỏ dim/block lồng :187-189. Sinh bởi
scripts/cad-library/generate-library từ blocks-data.

### 1.5 Hatch/poché
HatchPattern 5 giá trị :657 (SOLID/ANSI31/32/37/DOTS). HatchEntity :659-681 (points đa giác
đơn/solid?/pattern?/scale/angle/opacity/specId?). hatch.ts hatchDots :578/hatchLines :605;
dò biên :474-529. poche.ts: polyline CHỦ, hatch CON qua hostId (:18-22); syncPocheAnchors
:189/expandIdsWithPoche :236/propagatePocheEdits :274. MaterialDef mang hatch (materials
:29-56; tách THỊ GIÁC vs THƯƠNG MẠI :48-55). plan-present PresentRole :182 5 vai +
classifyPresentRole {role, inferred, why} :236.

## 2. ELEVATION / SECTION

### 2.1 CÓ primitive chiếu 3D→2D, ĐÃ NỐI UI
`lib/three/section-entities.ts` (462 dòng): sectionReport :310 · sectionToEntities :305 ·
**elevationToEntities(scene, axis, opts) :440-462** (mặt phẳng ở mép bao xa nhất, mode
elevation không sinh nhóm cắt :71-74). Thuật toán plane×tri :341-379 · chainSegments :142 ·
projectedOutline :223. project() :127-131 (x→(y,z) tung độ = CAO ĐỘ thật, cốt ±0.000 tại v=0).
threeToCadMm :108-110. **3 layer khác bề dày** :51-64: S-CUT 0.70 / S-VIEW 0.35 / S-FAR 0.18;
ngưỡng xa 3000mm = quy ước dựng hình KHÔNG phải tiêu chuẩn :78-80. Poché SOLID vòng cắt kín
:88-89,388-391. **Giới hạn khai thật**: ops boolean khoét chạy tầng three, KHÔNG trong
positions ⇒ mặt cắt CHƯA trừ lỗ, có cảnh báo đếm :333-335,419-425. Không import three :17-21.

### 2.2 SectionSpec
section.ts :16-20 {axis, at mm}; sectionPlane :30-35 chỉ clippingPlanes cho MẮT — không trích
đường 2D (:5-9 section-entities). Quy ước GIỮ ≤ at :6-9.

### 2.3 SectionPreviewOverlay = chỗ DUYỆT, không phải bộ chiếu
Hai vai (vỏ portal + preview SVG vẽ đúng entity sắp ghi :4-16); khung quyết định = Checkpoint
:5-11; màu map SECTION_LAYERS :29-38. Luồng: Command3DPanel :220 (tab banve) →
SectionExtractPanel :74 (elevation :120, section :129) → Overlay duyệt → Render3DModeSkeleton
:488-507 ghi Doc.
⚠️ **Ghi chú lỗi thời trong repo**: plan-depth.ts :22-29 khai "grep elevationToEntities trong
components = 0 ⇒ chưa mount" — **NAY SAI**: SectionExtractPanel :31-32 import cả hai.

### 2.4 plan-depth
DepthBand :37-41; DEFAULT_DEPTH_BANDS bám 3 layer; chỉ pha màu + bề dày, cấm blur/shadow/alpha
:9-14.

### 2.5 CamPath — không liên quan elevation
campath.ts :14-51 + planCamPath :224; camera.ts :10-26 CameraKind/CameraSpec (một ngôn ngữ cho
prompt AI + máy 3D — capture :8-9); CameraShotMeta trên polyline (model :217-227);
Base.campath? :270; blender.ts :42-46 nhận camPath.

## 3. 3D

### 3.1 docToObjScene (cad-to-obj.ts:566, thuần TS)
Tường: poché → extrude H; "khai báo thắng suy đoán" (elementType nghe, undefined suy theo layer
+ cờ inferred :578-590). Sàn/Phòng qua findHatchBoundary. **Nội thất: proxy box footprint +
cao theo bảng 9 dòng hardcode** furnitureHeightMm :290-300 (sofa 800 · bed 500 · desk 750 ·
wardrobe 2100 · kitchen 900 · toilet 750 · lavabo 850 · bathtub 550 · default 750);
blockFootprint :466. Kẹp tường [2000,6000] :559-561. MTL màu phẳng SceneTheme clay/warm/gu :100.
SceneGroup :130-199 (name/colorHex/positions tam giác phẳng mét Y-up/entityId?/semanticKind?/
semanticProvenance?/levelId?/typeId?/heightMm?/baseMm?/inferred?/storey?/specId?/ops?/
opCutters?/recipe?). ObjScene :201-209; Scene3DData :213-217. Hoán trục cadAxesToThree :223 /
cadToThreeM :229 / boxPositionsMm :49 (mm→m, (x,z,−y)). Hosted: hosting.ts OPENING_ELEVATION
:39 / isHostableBlock :52.

### 3.2 build-recipe evaluator
BuildOp 10 biến thể model :490-513 (3 cũ giữ nguyên văn :473-476; arrayRadial/mirror =
MODIFIER; bevelEx/taper/sweep/revolve/loft = THAY-HÌNH-GỐC nướng hình học vào op :481-489).
LƯU THAM SỐ KHÔNG MESH nói 2 lần :275-277,:284-288. evalRecipe :93 → {geometry, stepErrors};
bước lỗi bỏ qua :66-68,170-172; tối đa 1 bậc thay-hình-gốc :112-115. Tiêu thụ
resolveSceneGroupGeometry :188-194 ← obj-scene-to-geometry. build-ops.ts 702 dòng 9 hàm thuần.

### 3.3 csg.ts
Cổng DUY NHẤT three-bvh-csg :2-5; export đúng booleanOp :42-47; attributes bỏ uv :30-35;
không trả giao tuyến.

### 3.4 export-d5/vray = bộ dịch VẬT LIỆU
VRayMtlExport (theo doc Chaos :3-13) · D5MaterialExport (tên field "đặt hợp lý, chưa xác minh
D5 API" :9-15). Export hình học thật: OBJ+MTL → blender.ts obj2fbx (degrade tường minh khi
thiếu Blender :14-15; findBlender :31); node render-v2 :258.

### 3.5 Mesh import — BA đường
① glb-import.ts → viewer/scene: objectToScene3D :41-84 (bake matrixWorld, toNonIndexed,
SceneGroup "Import · mesh"; glTF đã mét+Y-up :39-40); parseGlb :86/.gltf :161/.obj+.mtl :203;
GlbImportReport :14-21; animation giữ chưa phát :95. ⚠️ SceneGroup từ đây **không entityId/
semanticKind/heightMm/specId** :60-64 — mesh ngoài KHÔNG danh tính trong Doc.
② lib/idfc-import (mesh AI → .idfc — xem trinh sát 05; mesh ở xFromPhoto, geom2d = nét bao
chữ nhật; chuan-net ChuanNetPart cylinder/torus có buildOp revolve + mesh giữ nguyên có
lyDoGiu + shadow-removed; saiSo per part).
③ Object3DWindow viewer (glb/gltf/obj+mtl, đuôi quyết loader :11-18).
⚠️ SPEC-3D-CORE.md :98 liệt "import OBJ/GLB ngoài" trong LOẠI TRỪ — code đã đi trước spec.

## 4. PARAMETRIC
CLUSTER_SPECS :533-619 — 6 cụm; ClusterParamDef :487-501 có **why?** (nguồn trị số, tooltip);
ClusterResult :47-74 (prims tách desk/chair để duyệt theo phần :50-55; sizeMm ĐO từ prims
:60-61; areaPerSeat…); clusterDefaults :622; clusterSeed FNV-1a :637 ("cùng seed ⇔ cùng cụm"
:628-635); TCVN_4601 1.8 :459 + checkMeetingArea :463; hằng Neufert :78-83,:291. Ra Doc:
clusterPrimsToEntities (block-library :210) — cố tình KHÔNG BlockEntity (lý do :201-205:
không blockId ổn định; đăng ký động mất hình khi mở lại).
Khác: WallRun :716-730 (location line SỐNG; entityIds DERIVE regen; thiếu: WallType catalog/
openings-nối-run/miter/Level :703-711) · WallTypeLayer :742-751 + **luật INSTANCE thắng TYPE**
:757-760 (resolveWallParams trả giá trị + NGUỒN) · ShapeVariant tĩnh · BuildRecipe ·
idfc params chỉ ShapeVariant[] (component) + Record (preset K4).

## 5. PREVIEW / THUMBNAIL
### 5.1 Quả cầu vật liệu — components/three/material-preview.ts
RoomEnvironment :24 + PMREM :118; MỘT renderer + env chung, swap material chụp PNG :7-10;
**rig găm globalThis** (sự cố 04/08 12/12 cầu chết vì Fast Refresh vượt 16 WebGL context
:12-17); **cache PNG dataURL Map RAM** :262 (khoá :290 gồm pbrCacheKey; toDataURL :315;
KHÔNG ghi đĩa); PreviewKind 6 :28 / PreviewScene 4 :29 / PreviewSpec :31-46 (pbr? :45 →
renderMaterialPreviewAsync :278); sceneForKind :57-61 (mọi vật liệu = quả cầu; kính + checker);
khung V-Ray/D5 (nền xám radial · bóng tiếp đất · fov 30 · NeutralToneMapping :1-5).
Object3DWindow cùng khuôn ánh sáng :10-12,63-65,84.

### 5.2 Thumbnail idfc/LibraryAsset — KHÔNG SINH
IdfcFile/Meta không field thumbnail (⚠️ docstring idfc :7-8 liệt "thumbnail" — schema không có).
LibraryAsset không cột thumbnail; path = gốc, serve /api/library/{id}/file. LibraryItem.thumbnail
= 2 màu gradient (types :26-27). Bậc thang thay thế (thumb-kinds :5-13; ItemThumb :6-9):
(c) imageUrl ATLAS → ảnh thật :60-70 · (a) vật liệu đúng kệ → MaterialSphere render thật
:73-84 (SPHERE_SHELVES :50 chỉ common-atlas) · (b) còn lại → vân procedural + icon (TINT theo
loại :41-58). ThumbKind 17 giá trị :19-32. Lịch sử :3-8: bản cũ "12 GRADIENT GIẢ" bị chê.

### 5.3 capture.ts (347 dòng)
CaptureOut png|depth|lineart :33-38; captureFrame :166 (placeCamera 1 lần/khung ⇒ 3 kind khớp
tuyệt đối :16-18; depth nuôi ControlNet; lineart EdgesGeometry); planCaptureSequenceFrames :215
(tách thuần khỏi WebGL :199-202); captureSequence :276 (sync png) + Async :316 (AbortSignal
:308-315; onFrame không gom RAM :269-271,297,339); EYE_HEIGHT_MM = 1650 :44; nearFarForScene :140.

## 6. DOC INSERTION
Ba đường: ① BlockDef→BlockEntity (placeBlock commands :233-236 — luôn sx=sy=1, không tham số
scale; CadCanvas :1224-1226; DropBridge :65-75) GIỮ danh tính · ② manifest DXF→rời
(placeLibraryBlock CadCanvas :206-217; DropBridge :87) MẤT · ③ cụm parametric→rời
(ClusterPanel :225) MẤT. Ghi store addEntities (store :310,:551 — 1 nấc Undo/cụm); palette
drop :1219-1230 + autoSnapToWall :1227. DropBridge thả giữa khung nhìn :43-48; báo approximate
:77-81; báo mất danh tính :91.
Snap: autoSnapToWall (shape-interactions :94-140) — ngưỡng 300mm :96; chỉ khi BlockDef.anchors
:98; chỉ wall-back/wall-side :103; pháp tuyến cùng phía :121-123; rot/at bù theo anchor
:126-134. Osnap chung ix.current.snap.pt; ghost block :3465 (R xoay 90° :213).
Đơn vị: mm khắp nơi; sang three chia 1000; DXF $INSUNITS 4; **không bước quy đổi đơn vị khi
chèn** (giả định mm).
Resolver: ResolvedLibraryItem :49-51; DROPPABLE :55; luật tên 3 bậc :81-116 (vá 06/08 3 cặp
khoá lồng nhau ra BLOCK SAI lên BOQ như thật :70-80); specId chỉ khi caller truyền specs :140.
**ĐO ĐƯỢC: .idfc đã lưu KHÔNG thả bằng geom2d của chính nó** — DropBridge :57 chỉ
resolveLibraryItem(item, manifest); resolver chỉ biết BLOCKS+manifest :27-28,16-21; món kệ
common-idfc đi cùng đường use()→instantiate() (LibrarySheet :446,429-439) khớp bằng tên/mã;
grep geom2d ngoài idfc.ts: chỉ from-photo (ghi) + LibrarySheet :990 (ghi khi XUẤT).

## 7. VOCABULARY CHẤT LƯỢNG — đã tồn tại gì
`REFERENCE`/`PROXY` hằng/enum: **0 kết quả** (proxy chỉ là từ trong comment cad-to-obj/capture).
`quality`: 2 chỗ không liên quan (metrology "method quality 1-4" tự khai riêng module :729,785;
JPEG quality). `grade`: chỉ color grading. **LOD/detailLevel/fidelity trong code: 0.**
5 hệ GẦN NHẤT đang tồn tại: ① SemanticProvenance declared|inferred|derived (semantic-contract
:23; luật :22 "UI must not present inferred data as authored data"; sống trên SceneGroup) ·
② **ProvenanceKind measurement|referenceBlock|projection** (ortho-projection :36-45 — map
{label, usage}: Đo từ ảnh→BOQ/đặt xưởng · Khối tham chiếu→dựng cảnh/render · Hình chiếu sơ
bộ→trình bày; **"BA NHÃN, KHÔNG ĐƯỢC TRỘN" chỉ đạo Hoà 05/08** :12-17; OrthoView có basis +
isBoundingOutlineOnly :68-84; HIDDEN_FACE_WARNING :97; nối UI ToolModeForm :1009) ·
③ ProvenanceFlag measured|inferred|verified (from-photo :35) · ④ FidelityLevel editable|lossy|
reference|storage|unavailable (gateway capabilities :11 — trục FILE FORMAT; nguyên tắc :3-6) ·
⑤ PresentRole (plan-present :182). Cờ boolean rời: SceneGroup.inferred (runtime, không lưu .idf
:162-165) · Base.inferred :370-378 · Level.inferred :194-197 · keepsIdentity/approximate ·
MaterialPbr.suyDoan.
**Vocabulary CHỈ TRONG SPEC, 0 code**: SPEC-MASTER-LIBRARY-3D-CONTRACT :64 facet (…LOD ·
renderReady…) · :126-129 **bảng 4 trạng thái: Native parametric | Library parametric | Linked
import | Baked render asset** · :131 danh mục family cần gì; SPEC-FLOWRENDER :30 "nguyên tắc
LOD: thumbnail, model proxy, model render, detail 2D — không bắt tải đủ bốn".
grep renderReady|primaryClass|stageSupport|materialRole = **0**.

## 8. `.idfc` body — geom2d/geom3d là gì
(khớp trinh sát 01) geom2d = ENTITIES Prim tự chứa (= BlockDef trừ id/name/meta/hosted; lý do
:120-121). geom3d = THAM SỐ {heightMm?,bevelMm?,matId?,pbr?} — K1 không mesh :132-134;
SUPERSEDED note matId UUID :137-139.
**Đối chiếu geom3d ↔ cad-to-obj — khớp một nửa, hụt một nửa**: có heightMm ✅ bevelMm ✅ matId/
pbr ✅; **thiếu baseMm · ops[] · recipe · opCutters · elementType/hosted/SpatialKind · mesh
(cố ý)**. ⇒ idfc furniture chỉ dựng lại được lăng trụ đùn cao heightMm vát bevelMm — không
đường chở BuildRecipe/ops dù cùng là JSON thuần cùng nguyên tắc lưu-tham-số. Bằng chứng hụt:
from-photo phải nhét mesh vào xFromPhoto; chuan-net sinh buildOp đúng khuôn nhưng chỉ ra
recipeJson rời. Migration + 3 ràng buộc bất khả xâm phạm :34-39 (một chiều · FK mềm specId ·
tiến độ chờ Task).

## 9. CHƯA CHẮC (nguyên văn agent)
ItemThumb/MaterialSphere có cache đĩa/IDB không (chỉ đo Map RAM; chưa đọc hết MaterialSphere/
pbr-three) · PlanPresentPanel nút mặt đứng còn disabled không · $INSBASE toàn thư mục (grep -rl
= 0 nhưng chưa đo bbox 54 file) · blocks-data.ts có anchors/clearance mà manifest không chở
không · tool3d/Object3DInspector/Command3DPanel vocabulary riêng chưa đọc thân · distill/rna/
dna types tham chiếu idfc chưa đọc · đường tự sinh idfc từ chuanNet ngoài script tay chưa thấy
· BulkIngestMode có sinh preview lúc nhập không · lighting.ts HDRI enum chưa đo.
