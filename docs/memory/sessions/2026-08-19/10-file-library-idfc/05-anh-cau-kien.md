# Trinh sát 05 — ĐƯỜNG "ẢNH → HIỂU VẬT → CẤU KIỆN" (nguyên văn báo cáo agent, 19/08)

> Quy ước: SỐNG = có đường gọi từ UI/route thật · CHƯA-CẮM = code+test, 0 caller runtime.

## 1. `lib/idfc-import/**` — đường "ghế Lincoln 327"

### 1.1 Phát hiện cấu trúc quan trọng nhất
**Không có pipeline "ảnh→nét" liền mạch. HAI pipeline rời, nối bằng FILE GLB trên đĩa:**
A `from-photo.ts` (ảnh → .idfc furniture + URL GLB) · B `chuan-net.ts` (GLB Uint8Array →
OBJ+MTL+PNG+recipeJson — `chuanNet(glb, opts)` :1237). "Trích nét" thực chất là slab-cut hình
học trên mesh 3D đã có.

### 1.2 Pipeline A — from-photo (266 dòng)
① classify — classifyPhoto :194 → captionImage NVIDIA VLM (model env ?? llama-3.2-11b-vision) ·
② mesh — generateMesh :208 gọi **thẳng fal.subscribe** :221 (AI_TASKS.imageTo3d.falModel; cố ý
không qua /api/jobs :203-206 vì jobStatus chỉ trích image/video) · ③ VerifiedSpec :47-59 người
tra trang hãng, cờ verified + sourceUrl.
**Cờ 3 nấc CÓ THẬT tại đây**: ProvenanceFlag :35; ProvenancedValue{value,flag,source} :37-42;
prov() :188. Per-trường :161-174 (caption/style/materials/room/kind inferred+vision:model ·
wMm/dMm/hMm verified+URL · mesh inferred+fal:model#requestId :155-156 · geom2dFlag inferred :175).
Xuất kind **furniture** :129; vỏ exportIdfc :124; ruột component :135; geom2d = poly chữ nhật
w×d suy :103-119. Mesh+cờ ở khoá mở rộng xFromPhoto :147 (:18-21 "vào ruột chính thức =
migration v4"). reviewStatus 'draft-pending-review' :177. Round-trip tự kiểm importIdfc :181-184.

### 1.3 Pipeline B — chuan-net (1242 dòng), thứ tự bước
parse GLB :64 (+extractGlbImage :118) → part segmentation `chuanNetGeometry` :732 (slabs 25
:735; clusterSlab single-linkage :671; chuỗi cụm ≥30% lát → chân :791-792) → fit
fitCylinderPts :184 / fitTorusPts :210 / fitRingRansac :312 (coverage :293; vòng hở <300° loại
:627) → **mirror-completion** `mirrorCompleteShapes` :435 (PCA tâm part cùng vai trò
partKindOf :413; kiểm 1-1 hai chiều :493; union-find :495; COPY shape từ part RMS thấp hơn,
KHÔNG fit lại :402-409) → RMS `saiSoPct` :851, ngưỡng fitTolPct 2 :736 — **không đạt ⇒ GIỮ
mesh + ghiChu, không ép** :877-879 → màu medianKdOfTris :582 (null ⇒ Kd xám + khai thật
:1196-1198) → xuất ChuanNetResult :634-646 {obj, mtl, recipeJson, texture, ghiChu}.
recipeJson :1200-1220: marker 'chuanNet', donVi mm :1202, part mang **buildOp {op:'revolve',
profileMm,…}** :863-867, saiSoMm/Pct, mirroredFrom. UV_FLIP_V :666 (bug CN-F1 đo thật :649-665).

### 1.4 PartLock — cờ KHÔNG 3 nấc
`khoa: boolean` :133 + `provenance: string` tự do :135 (mẫu :218). Hash FNV-1a loại khoa+
provenance :99-104. buildPartLockFromChuanNet :163 thuần (import type :44). Registry tự khai
phần chưa làm: `frontier-registry.mjs:247` "độ tin cậy mỗi nét nạp thẳng cờ 3 nấc PartLock"
trong CÒN CHỜ — đo khớp.

### 1.5 AI GỌI TỪ UI? — KHÔNG AI CẢ
grep "idfc-import" ngoài .ua = 0 file nguồn; grep importFromPhoto|buildIdfcFromPhoto|
chuanNetGeometry|mirrorCompleteShapes|parseGlbGeometry|generateMesh|classifyPhoto trong
app/components/lib/scripts = 0 ngoài chính module + test. 2 hit "chuanNet" ngoài thư mục là
comment/chuỗi (LibrarySheet :87 · proof script :46). **Toàn bộ lib/idfc-import CHƯA-CẮM.**

### 1.6 Cái SỐNG duy nhất của Lincoln
Hardcode `OBJECT_3D_MODELS` regex /lincoln 327/i → obj/mtl trong public (LibrarySheet :91-98;
tự khai :86-90 đường đúng = tag has3d:). Artifact chạy tay 14/08 copy vào public. Viewer
Object3DWindow :40 ← Object3DToggle :61. `proof-ghe-3d-library.ts` ghi thẳng
prisma.libraryAsset.create :5-8, KHÔNG route; :41-42 trỏ scratchpad phiên khác — chạy lại hỏng.

### 1.7 Kho idfc — SỐNG nhưng không nối from-photo
idfc-store IDB :8-13; nhập BulkIngestMode (người kéo file); đọc LibrarySheet kệ :284-287.
Nguồn .idfc = file người dùng đưa, không có đường máy-sinh.

## 2. Trellis / 3D-from-image
**Không node nào trong registry nhận ảnh ra mesh** (grep trellis|imageTo3d|model_mesh trong
lib/nodes = 0; 2 hit "3d" là mô tả văn bản clay). Task `imageTo3d` `models.ts:117-119`
(fal-ai/trellis, 60s) · giá 6cr `tiers.ts:150` — **"chưa bao giờ bị trừ… Giá CHƯA chốt với
Hoà — tạm, có ghi sổ"** :147-149; test :47 khoá số 6. Đường chạy duy nhất = from-photo
server-only direct. **Không tầng tải-về/lưu GLB** — glbUrl là URL fal có hạn (:68-73, :229).
⇒ CHƯA-CẮM hoàn toàn.

## 3. VLM / image understanding
- captionImage (nvidia.ts:50) — 3 caller sống: /api/vision/caption :3,20 · notebook extract
  :50-51 · (grounded-render reference-sheet dùng caption có sẵn); from-photo ① chưa cắm.
  Route caption có auth **không spendCredits**.
- BiRefNet removeBg — SỐNG: node ai.removebg (registry :775-787, 1cr) · ai.furnitureextract
  (render-v2 :368-415, fallback lõi tách màu nền khi không key).
- SAM2 — SỐNG: fal-ai/sam2/image (models :103-104); task segment 1cr; SmartSelectModal :29 ←
  NodeLibraryPanel :12,564; mở qua ParamField :126; gọi cờ internal :286 ⇒ free (whitelist
  tiers :161-165). ⚠️ models :101 "CHƯA có workflow tự-host (comfy)".
- idmask-core — SỐNG: median-cut tất định (:4,:33,:67-80; refine 2 tầng alpha BiRefNet :169);
  node ai.idmask render-v2 :299-341 (removeBg internal:true :330,335).

## 4. single-view-metrology (966 dòng) — SỐNG
Hàm: vanishingPointFromLines :210 (residualPx) · calibrateFromVanishingPoints :251 (Manhattan
:245-246) · anchorScale :377 · measureObject :463 · toGray :546 · detectLineSegments :587
(Sobel+Hough) · calibrateFromImage :683 (needsManualScale) · measureObjectTiered :942.
Đơn vị: ảnh KHÔNG chứa thang tuyệt đối — mọi mm PHẢI qua anchorScale (:6-8). ANCHOR_CONFIG
:129 — 9 AnchorKind :91 min/max/typical; tolerance .05 :142; depth prior .55 :146 ("prior
không phải phép đo" :145). Luật ĐO/SUY :23-27 (depth LUÔN SUY trừ silhouette.side).
4 nấc tụt :942-966; "KHÔNG BAO GIỜ throw vì thiếu neo" :936-940.
Mount: node vision.measureobject (defs/metrology — 0cr :104; measureObjectTiered :149; barrel
defs/index :26,39; extractForeground :22, thiếu mặt nạ ⇒ nấc 1 :121).
**hough-line.ts KHÔNG tồn tại** — chỉ hough-line.test.ts, import detectLineSegments từ
single-view-metrology :13. Là test hồi quy bug đã sửa (commit f1a9b3d); docblock :1-11 kể
"test cũ khẳng định needsManualScale làm kỳ vọng — test xanh, bug sống".
Vision khác SỐNG: horizon (ToolModeForm :44) · to-cad/match-template/ortho-projection
(ToolModeForm :31-32; lịch sử :929-932 từng 0-caller trước 06/08, nay đã cắm).

## 5. BuildRecipe / BuildOp
Union 10 nhánh model.ts :490-513 (extrude/boolean/arrayLinear/arrayRadial/mirror/bevelEx/
taper/sweep/revolve/loft); BuildRecipeStep :530-535; BuildRecipe :539-541; lý do khai ở
model.ts (lõi thuần không phụ thuộc three) :525-529; ops[] và recipe cùng tồn tại :284,:296
(:519-523 không nâng cấp tại chỗ vì .idf cũ persist).
Evaluator build-recipe.ts :93 evalRecipe — case :103-:156; không viết lại toán (gọi build-ops
:29-40 + csg :41); stepErrors cô lập :66-68; tiêu thụ resolveSceneGroupGeometry :188 ←
obj-scene-to-geometry. UI SỐNG: Command3DPanel :54,:664,:1262,:1278.
**Đường AI sinh BuildRecipe = 0** (grep BuildRecipe trong lib/ai + lib/nodes = 0 — chốt cũ đúng).
**Mắt xích đứt §1↔§5**: chuan-net :863-867 sinh buildOp đúng hình dạng revolve (model :510)
nhưng khai lại literal inline :611, recipeJson là chuỗi ghi đĩa :1229, **0 code đọc lại**.
00-CHOT :870 khai đúng 3 thứ thiếu (BuildOp 2D/hoạ văn · ProposalSheet · vòng tự-sửa-3-lần).

## 6. Credit / cost
- Client: estimateRunCredit `lib/execution.ts:263-273` (xấp xỉ có chủ đích :256-262); hiển thị
  TasksDropdown :14,47 · MobileMenu :13,360.
- Server gate: /api/jobs :10-11 auth · :58 costOfTask · :60 spendCredits · :62 402 · refund :54;
  docblock :51-53 kể lịch sử vá "curl đốt provider free". Bảng giá 1 nguồn TASK_CREDIT_COST
  tiers :133-151.
- Node giá: import/prompt/context/metrology 0 · sketch2render 4 · clay2render 4 · staging 3 ·
  styleTransfer 3 · moodboard 2 · sketch-v2 4 · image2video 8 · text2video 8 · materialSwap 4 ·
  furnitureEdit 4 · relight 3 · upscale 2 · removeBg 1 · deck/text 0 · imageTo3d 6 (chưa dùng).
- **Đường vòng đo được 3 chỗ**: (a) compare-models :11 → /api/render/premium — CÓ GATE
  (spendCredits :41; mock khi thiếu FAL_KEY :37; docblock :39-40 khai node creditCost=0 client
  bypass được — đã vá server). (b) render-v2 :154 → **/api/render/nvidia-image — KHÔNG GATE**
  (chỉ auth :19-20). (c) **/api/vision/caption — KHÔNG GATE** (chỉ auth :8-9; NVIDIA free tier,
  có NvidiaFreeExhausted — tiền mặt 0 nhưng credit gate không có).
- Lỗ đã khai: cờ `internal` client khai (tiers :127-132; whitelist cứng removeBg/materialSwap/
  segment :161-165; costOfTask chỉ zero task trong set :172-175).
- from-photo: fal.subscribe trực tiếp trong process server, không route ⇒ không gate nào chạm —
  vô hại hôm nay (0 caller), là đường thứ tư khi cắm.

## 7. Human review
- **ProposalSheet = 0 CODE** (grep 0; toàn hit docs: REVIEW-DONG-BO :22 · 00-CHOT :811,:814,
  :870 · HOP-DONG :284,319 · TRIET-LY :20,35 · báo cáo GR v0 :44 "UI từng-dòng đẹp hơn = v1").
- **Checkpoint — SỐNG, 3 mount, KHÔNG persist**: Checkpoint.tsx (3 trạng thái :18-21; 4 luật
  :23-32; seed+undoLabel bắt buộc bằng type :34-36 "Quên = hỏng tsc"); checkpoint-core thuần
  (toggle/setAll/selected/acceptGate/formatProgress/formatSeed/mergeParamsForRetry). Mount:
  ClusterPanel :56,173,316 · PlanPresentPanel :29,106-108,271 · CadEditor DXF :98,141,906,974.
  Persist: 0 (grep localStorage|prisma|persist trong core = 0; mọi mount useState).
- **DistillEngine — SỐNG**: engine.ts distill :33, namespace :60 (:57-59 giữ tên cho grep);
  ProvenanceInput types :45; nguon rỗng = TRỐNG :72. 3 mặt tiền: grounded-render
  reference-sheet :17,:76 ("KHÔNG viết engine trích xuất mới" :4-5) · dna/distiller · (mặt 4
  "dàn ý deck" chỉ trong docs). distillDnaFromSources :152 / FromAssets :139 / merge :165;
  cờ inferred :7-8,:76; "người đã xác nhận thắng máy suy lại" :162-164. Callers: CuaSoThaoLuan
  :182 (sau feature flag :23,28 — lùi được) · DesignDnaCardPanel :297-298 (mount overview).
  Chuẩn hoá nguồn tao-nguon-chung-cat :3,43-45. Persist DNA: api dna route + dna/store.

## 8. Provenance — 8 hệ độc lập
1 ProvenanceFlag 3 nấc (from-photo :35 — CHƯA-CẮM) · 2 SemanticProvenance declared/inferred/
derived (semantic-contract :23 — SỐNG, chảy qua cad-to-obj :144,313,325,340) · 3
ProvenanceInput/DistilledField.nguon (SỐNG) · 4 ProvenanceKind measurement/referenceBlock/
projection (ortho-projection :36-45 — SỐNG) · 5 PerspectiveProvenanceStep (magic-perspective
:101,118-133 — SỐNG, tự khai lỗ rơi round-trip :112-118) · 6 LinkedAssetProvenance (present
model :456,497; giữ qua update; pdf-import nhiều chỗ — SỐNG) · 7 HoSoSongProvenance (types
:28,43; manifest :72 — SỐNG) · 8 PartLockPart.provenance chuỗi tự do (CHƯA-CẮM).
Cờ inferred rời: Base.inferred/Level.inferred (model.ts) · cad-to-obj :313-329 · distiller ·
pdf-import :33. Confidence 4 hệ rời: classify number 0..1 (:34,125-131) · FfeConfidence
(ffe/item :127-128) · warehouse string (dto :44,98; import 3 mức) · vision residualPx.
**origin/sourceAssetId = 0 hit toàn repo**; sourceImageUrl chỉ trong from-photo.
⇒ Không định danh nguồn xuyên hệ.

## Tổng kết SỐNG vs CHƯA-CẮM
SỐNG: metrology node · horizon/to-cad/match-template/ortho → ToolModeForm · caption 2 đường ·
removeBg · SAM2 SmartSelect · idmask · evalRecipe/BuildRecipe UI · credit gate jobs+premium ·
Checkpoint ×3 · DistillEngine → 2 UI · idfc-store · Object3DWindow (1 asset regex).
CHƯA-CẮM: toàn bộ lib/idfc-import (~3.341 dòng) · imageTo3d/trellis (6cr chưa trừ) ·
ProvenanceFlag 3 nấc · ProposalSheet 0 code · AI→BuildRecipe 0.
**Ba đứt gãy**: ảnh→GLB (0 caller, URL không tải về) · GLB→part (0 caller, artifact tay 14/08)
· part→BuildRecipe (khớp hình dạng, ghi JSON chuỗi, 0 đọc lại).

## CHƯA CHẮC (nguyên văn agent)
Chưa chạy test (chuan-net 413 dòng test, surface 261, part-lock 184, from-photo 128 — không
biết xanh) · worktrees bỏ qua · Base.inferred :370 trích từ docs NC chưa tự mở dòng ·
"SỐNG" = chuỗi import tĩnh, có thể sau feature flag (collab flags lùi được, chưa kiểm giá trị)
· 2 route không gate là quan sát grep spendCredits — middleware.ts chưa đọc; NVIDIA free tier
chưa xác nhận hạn mức · surface-graph chỉ đọc export + docblock (62 diện/21 cụm là số phiên
14/08 ghi lại) · chuanNetGeometry đọc đến :881 + phần xuất; nhánh ④c/④c2 và chỗ gọi
mirrorCompleteShapes bên trong chưa tự mắt thấy · proof script trỏ scratchpad phiên khác chưa
kiểm còn tồn tại · frontier-registry là lời tự khai, không phải bằng chứng code · AUDIT-Q0
(đề ngày hôm nay) chưa mở.
