# FINAL ARCHITECTURE AUDIT — INTERIORFLOW · 19/08/2026

> **Vòng khám kiến trúc CUỐI trước khi thi công.** Sau report này: KHÔNG mở audit kiến trúc mới
> trừ khi code/data mới chứng minh architectural conflict thật. Kiến trúc ĐÓNG — chuyển sang thi công.
>
> Mốc: working tree sau `3da4b8c` (Slice 1A bước 2A đã vào cây, chưa commit).
> Phương pháp: 4 phiên phụ audit chỉ-đọc song song (Gate A Data Core · Gate B Module/Workflow ·
> Gate C AI/Decision · Gate D Lark/ArchiNote/Failure), T verify chéo 5 khẳng định nặng nhất tại nguồn.
> Không code, không prisma (kể cả `generate` — bài học 19/08: phá Prisma Client shared), không commit.
>
> Nguồn nền: `ADR-Q0-ARCHITECTURE-DECISIONS-2026-08-19.md` (9 ADR ACCEPTED) ·
> `AUDIT-Q0-SOURCE-OF-TRUTH-LIBRARY-IDFC-2026-08-19.md` · `IF-KIEN-TRUC-OS.md` (hiến pháp 18/08) ·
> `BAN-GIAO-T-MOI-2026-08-19.md` · báo cáo Slice 1A bước 1 + 2A.

---

## 1 · TỔNG QUAN

**Kiến trúc IF đã đủ để đóng khám và chuyển sang thi công.** Bốn gate độc lập cùng hội tụ về một
kết luận: các bệnh đo được hôm nay đều **đã có tên trong 9 ADR** — audit này không phát hiện
architectural conflict MỚI nào ngoài ADR, nó **định lượng** ADR bằng import graph, grep và trace thật.

Ba tin bất ngờ theo chiều tốt:
1. **AI authority 0 RED** — luật 8 được thi hành nhất quán; không đường nào cho model output ghi
   thẳng geometry/ID/canonical state.
2. **Lark đã đúng hình OPTIONAL ADAPTER về runtime** — mô phỏng xoá Lark: 0 domain lõi BLOCKED.
3. **Workflow orchestration đã tách đúng** — handoff optional/consume-once, 10 cách dùng coexist
   được ngay hôm nay, không stage-gate cứng.

Còn lại **5 blocker kiến trúc thật** — đều là việc thi công có địa chỉ file:line, không phải câu
hỏi mở. Xem §PHÁN QUYẾT CUỐI.

**Chốt mới 19/08 nạp vào audit này (Hoà)**: Lark/ATLAS KHÔNG còn là hạ tầng lõi — IF phải hoạt
động đầy đủ với dữ liệu IF sở hữu mà không cần Lark tồn tại; Lark = OPTIONAL EXTERNAL ADAPTER
ngang CSV/Excel importer. Chốt này ĐÈ câu cũ trong `docs/CLAUDE.md` ("cùng đọc/ghi Lark Base ATLAS").
Kết quả Gate D: **code đã tôn trọng chốt này từ trước khi chốt** — không cần đại phẫu.

---

## 2 · CHI TIẾT THEO GATE (chỉ giữ findings đạt ngưỡng — data loss / identity / backward compat / modularity / local-first / AI authority / ArchiNote)

### Gate A · Data Core

| # | Loại | Finding | Evidence |
|---|---|---|---|
| A-1 | **PROVEN CONFLICT** | **Ba namespace cùng tên `matId`**: ① UUID mới (`lib/materials/matid-identity.ts`) ② khoá PBR = sku-upper (`pbr-store.ts:31`) ③ `BoqRow.matId`/`BoqOverride.matId` thực chất = `entity.specId` = `ProductSpec.id`. Backfill UUID xong mà không xử namespace BOQ thì overrides cũ của user thành mồ côi im lặng. | `lib/boq/compute.ts:343,355,366,376,405` (T verify tay: 5 chỗ `matId: specId`) · `boq-overrides.ts:28` |
| A-2 | **PROVEN CONFLICT** | Library content chẻ **3 hệ lưu**: ảnh = Prisma+`./uploads/` · `.idfc` = localStorage `if.library.idfc.v1` · reference manifest = localStorage thứ ba. Cùng là "Master Library" trên UI nhưng 3 vòng đời, 2/3 mất theo browser profile. | `lib/library/idfc-store.ts:17` (T verify) · `lib/refingest.ts:53` |
| A-3 | **BLOCKER** | **4 nhóm schema khai-chưa-push chồng nhau** (`room/confidence` · `ExternalRef` · `Task/WorkflowState` · `matId`): bất kỳ `prisma generate` nào trước `db push` = chết runtime toàn nhánh ProductSpec — cơ chế đã chứng minh 2 lần (schema tự khai + sự cố bước 2A 19/08). | `prisma/schema.prisma:429,482,550,602` |
| A-4 | **BLOCKER (data-loss thật)** | **Tài sản studio sống trong localStorage không backup**: kho `.idfc` studio · PBR store · bảng màu · brand-kit · refManifest. Clear site data một phát = bay tài sản vĩnh viễn — trái "Own your data" ở đúng tầng tài sản. Đây là quả bom data-loss duy nhất còn cài trong hệ. | `idfc-store.ts:17` · `pbr-store.ts:27` · `colors/store` |
| A-5 | GAP | `Flow.graphJson` là domain DUY NHẤT mà mất `dev.db` = mất trắng — không file rời, không nằm trong frozen gì; chưa ADR nào nhận nuôi rõ (Q1 xếp Prisma authority nhưng Q2 snapshot chỉ bàn `.idf`). | `schema.prisma:222` |
| A-6 | GAP (=ADR, xác nhận lại) | `.idf` mù spec khi mất DB (Q2 chưa build snapshot) · upload thẳng vào LibraryAsset không raw stage (Q5, `app/api/library/route.ts:53`) · không frozen revision (Q6) · `meta.code` business-key-mutable làm identity kho `.idfc` — nhập file trùng code = ĐÈ bản cũ im lặng (Q3 sẽ giải) | `idfc-store.ts:37-40` |
| A-7 | GAP nhẹ | Entity ID = `${prefix}-${seq}-${random 4 ký tự}` — đủ cho 1 Doc, KHÔNG đủ làm anchor xuyên project (Decision.targetEntityId của Q8 sẽ đụng). `.idf`/`.idfp` không mang projectId. | `lib/cad/store.ts:435` |

**SAFE cố ý — đừng "sửa" nhầm**: `.idfp` nhúng dataURL + brandKitSnapshot (portability by design) ·
`machineValue` BOQ override cố ý không persist · `sourceLibraryId` display-only (ràng buộc một chiều) ·
`raw` JSON mirror Lark · đường legacy-sku trong `getMaterial` có `resolvedVia` phân biệt.

**Vai trò 3 format (A3 gate)**: `.idf` = portable project design state (v2, migration thật) ·
`.idfc` = canonical reusable content (v3, tự chứa geom2d) · `.idfp` = portable present state
(v1, tự chứa nhất). **Không vi phạm contract giữa các format**; điểm mềm: validate nông
(prims chỉ kiểm `Array.isArray`) — backward compat dựa vào kỷ luật additive, không có máy canh.

### Gate B · Module Boundary / Workflow / Update Locality

| # | Loại | Finding | Evidence |
|---|---|---|---|
| B-1 | **PROVEN CONFLICT** (=Q7, định lượng) | `useCadStore` = god-store: ~40 file ngoài module 2D import; 3D/Library/AI-nodes **GHI NGƯỢC** vào store 2D. Thay/refactor 2D = đụng cả 8 module. Q7 scope hẹp (chỉ Doc mutations, 2/19 store) được audit ủng hộ bằng số. | `render-studio/tool3d.ts:34` · `array-grid-ops.ts:12` · `library/ClusterPanel.tsx:52` · `nodes/defs/render-v2.ts:33` (T verify — đọc :247, ghi ở 3 file kia) |
| B-2 | **PROVEN CONFLICT** (=M-02, nâng cấp độ) | **15-20 file gọi thẳng provider NVIDIA** — nguyên tắc "Replace your AI" (hiến pháp OS) hiện KHÔNG làm được ngoài text. Hiện có **2,5 gateway song song**: `text-tier.ts` (text) · `tiers.ts`/AiTier (ảnh) · `nvidia-image` route tự tụt tầng (logic tier viết tay lần hai trong `render-v2.ts`). Case "thay AI provider" = ARCHITECTURAL COUPLING đỏ nhất trong 12 future changes. | `notebook/embed.ts:18` · `render-v2.ts:154` · `from-photo.ts:215` · `compare-models.ts:11` |
| B-3 | GAP rẻ | `lib/cad/idfc.ts` (format của Library) sống nhầm nhà trong module 2D — kéo Library/Photo/Files vào lãnh thổ cad · `boq-overrides` sống ở `lib/present-editor/` chứ không ở `lib/boq/`. Hai cú dời file thuần cơ học (~1 ngày), giảm ngay 2 vòng phụ thuộc. | — |
| B-4 | GAP | 3 file handoff cùng pattern chép tay + `stage-nav.ts` import thẳng handoff của Present — orchestrator chưa có contract chung; thêm Video module = chép pattern lần 4. | `cad/handoff.ts` · `cad/present-handoff.ts` · `present-editor/handoff.ts` |
| B-5 | SAFE ✅ | Renderer 3D thay được LOCAL (`three` gói trong 20 file, chỉ 1 rò `chuan-net.ts`) · 3D scene = derived thuần đúng Q6 · workflow không stage-gate cứng (`stage ===` ~22 chỗ đều là presentation switching, không phải gate) · 6 vòng phụ thuộc cấp MODULE tồn tại nhưng 0 vòng cấp file. | — |

**Bảng 12 future changes (rút gọn)**: 🟢 LOCAL: thay renderer 3D · thêm ArchiNote (ExternalRef chừa
cửa) · project không dùng Present · supplier catalog API. 🟡 CROSS-MODULE kiểm soát được: thêm
Video/Survey (thiếu stage-registry cắm-là-chạy, ~4 file shell) · bỏ Lark · representation mới IDFC
(do vị trí file, không do thiết kế) · material facet mới (🟢 sau khi cắm M-05) · client approval
(theo ADR Q6+Q8). 🔴 ARCHITECTURAL COUPLING: **thay AI provider** · **local ML engine mới** (cùng
bệnh — phụ thuộc giải gateway).

**Capability contract**: ~70% registry đã tồn tại — `commands/registry` (lệnh × chặng) ·
`gateway/capabilities` (format × chặng × fidelity) · `nodes/registry` (AI transform × port × giá).
Thiếu trục thứ tư: module-level accepts/produces — là việc GHI LẠI (các hàm biên đã thuần nhận `Doc`),
đề xuất thành一 section của `PROJECT-MANIFEST.md` (Q1), KHÔNG xây registry thứ tư.

### Gate C · AI / Decision Core

| # | Loại | Finding | Evidence |
|---|---|---|---|
| C-1 | **SAFE ✅ (nền quý nhất)** | **0 RED AI authority.** Mọi đường AI: ý định có cấu trúc → solver tất định (`ai-assist.ts` khuôn mẫu mực: LLM chỉ parse → `LayoutSpec` JSON, `layoutToEntities` là solver thuần) · cờ `inferred` chờ duyệt (`from-photo` — "NHÁP CHỜ DUYỆT, không tự đăng") · checker "KHÔNG BAO GIỜ tự sửa entity" · `magic-perspective` ghi setState nhưng là code tất định gieo node, undo được, đứng yên chờ người duyệt · L4 Delegate / L5 Autopilot KHÔNG TỒN TẠI (đúng chốt A15). | `standards/checker.ts:5-7` · `ai-assist.ts:4-11` · `from-photo.ts:20-24` |
| C-2 | GAP (=Q8) | Decision history ≈ 0 (grep `DesignDecision` = 0; approved/rejected duy nhất là `FfeApproval` 3 nấc). Nhưng **5 signal REUSE được đã sống trong code**: ① pairwise accept/reject (`gu/pairwise-perceptron` + `GU_KINDS`) ② BOQ overrides = human-correction delta trên số máy ③ `FfeApproval` khuôn status ④ cờ `verified` do người xác nhận ⑤ `FlowVersion` before/after. Q8 là nút cổ chai của cả Q6 lẫn Q9 — **xây Q9 trước Q8 là xây tủ không ngăn**. | `gu-model-sync.ts:23` · `ffe/sheet.ts:52` |
| C-3 | GAP | Intelligence Policy: ĐÃ có cost-gate (`estimateRunCredit`) + model whitelist + read-only gate + cờ 3 nấc. **CHƯA có privacy/data-scope primitive nào** — RAG/docContext gửi nội dung project lên NVIDIA không qua cửa policy (Privacy mode 3 nấc của hiến pháp OS = 0 UI, 0 config). | `execution.ts:263,179` |
| C-4 | **DOCS STALE** | ADR-Q9 ghi "DistillEngine 0 caller ngoài test" — **SAI với working tree**: 2 caller thật, DistillEngine ĐÃ cắm điện. Đính chính ADR, không sửa code. Cùng lượt: bản đồ tay 18/08 ghi 3 Zustand store (thật 19) — đã ghi ở M-07, chưa sửa. | `CuaSoThaoLuan.tsx:182` · `DesignDnaCardPanel.tsx:297` (T verify tay) |
| C-5 | Ghi nhận (D) | AI image output persist vào `Flow.graphJson` không cờ draft/approved · embeddings NVIDIA persist vào NotebookChunk không cờ origin — không RED (không phải canonical design state), thành vấn đề khi Q6 Frozen Revision ra đời. | — |

**AI stack đo được**: L0 = standards/review/BOQ/geometry/text2image-core (tự dán nhãn "KHÔNG AI") ·
L1 Adaptive = PairwisePerceptron (thuần TS, tất định, KHÔNG generative) + DistillEngine (rule-based
0-key) · L2 Assist = Vitals/RAG/VLM caption · L3 Collaborate = image gen nodes (người nối graph +
duyệt + credit gate) · L4/L5 = không tồn tại, đúng thiết kế.

**Image/Video/Scene readiness**: Image = READY TO EXTEND (single-view-metrology + to-cad + mask-ops
+ cờ 3 nấc; thiếu duy nhất vision backbone cục bộ — đã có entry, kiến trúc nhận nó là plug-in) ·
Video = PARTIAL (IF_CAMPATH + camera intent có; thiếu timeline model — cần data model, không cần hệ
AI riêng) · 3D scene = READY TO EXTEND (derived + BuildRecipe là "ý định có cấu trúc" chuẩn cho AI
sinh — luật 8 đã trả lời sẵn). **KHÔNG phải 3 hệ AI tách biệt — là 3 mặt tiền thiếu một gateway chung.**

### Gate D · Lark / ArchiNote / Failure

| # | Loại | Finding | Evidence |
|---|---|---|---|
| D-1 | **SAFE ✅** | **Lark removal simulation: 0 domain lõi BLOCKED.** Project/Material/Library/Supplier/BOQ/Client/Tasks/Knowledge đều SURVIVES (Material degraded nhẹ: mất kênh cập-nhật-giá tự động). Sync routes 503 sạch khi thiếu env · mirror `LarkTaskRef`/`LarkPersonRef` pull-only không FK vào domain · Task nội bộ tự sinh id · matId đã tách khỏi ATLAS · 16 biến `LARK_*` chỉ đọc trong adapter. **KHÔNG tìm thấy CORE DEPENDENCY nào.** | bảng D1+D2 đầy đủ trong gate; `tasks/route.ts:8` · `schema:575` |
| D-2 | GAP (script sẵn) | `Project.larkProjectCode` còn trong bảng LÕI + **13 file đọc trực tiếp** (số ADR Appendix B đúng — verify từng file) thay vì qua bridge. Script `migrate-lark-project-code-to-external-ref.ts` đã soạn, gated `EXTERNAL_REF_TABLE_READY=false` — chờ Wave 0 push ExternalRef. | `schema.prisma:83,112` |
| D-3 | **BLOCKER cho ArchiNote** | **Không có conflict/merge primitive**: `rev Int` có ở Project/Flow nhưng KHÔNG route nào enforce optimistic lock — ghi 2 thiết bị = last-write-wins im lặng. Mobile công trường + desktop studio là ca va chạm chắc chắn. Đứng TRƯỚC cả DesignDecision trong hàng blocker ArchiNote. (IF solo cũng cần: 2 tab/2 máy cùng studio.) | `schema:97,132,234` — có field, 0 enforcement |
| D-4 | GAP | `.idf` metadata mang TÊN project, không mang project id portable — đối chiếu file↔DB theo tên/bucket; ArchiNote không có khoá chắc trỏ về đúng project. | `idf.ts:3-4` |
| D-5 | SAFE ✅ | **10 failure simulation: không ca nào COLLAPSE dây chuyền.** Mất Internet → text-tier fallback Ollama/lõi tất định · mất AI provider → node đỏ per-node, canvas sống · DB mất → `importIdf` parse thuần vẫn mở, BOQ cảnh báo "chưa có đơn giá" không vỡ · file mất → IDB còn bản làm việc · module tắt → empty-state (luật X2 thi hành) · format cũ → 2 bảng migration THẬT, đứt gãy trả null có kiểm soát. | `text-tier.ts:40-84` · `execution.ts:139-148` · `compute.ts:377` |
| D-6 | UNKNOWN (không chặn) | ATLAS material sync **chưa từng chạy thật** (blocked permission 131006 từ 04/08, field names placeholder) — mọi phán về "dữ liệu ATLAS trong ProductSpec" là phán về ĐƯỜNG ỐNG rỗng. Audio ingest cho ArchiNote chưa kiểm sniffKind. | `atlas-material-map.ts:1-40` |

**ArchiNote readiness: PARTIAL.** Nền đủ để ArchiNote nói chuyện qua HTTP API + ExternalRef mà
KHÔNG cần Lark ở giữa và KHÔNG phải import store/UI internals của IF (boundary hiện tại đúng).
Ba điều kiện: conflict primitive (D-3) · project id portable (D-4) · Observation/Decision model (Q8).

---

## 3 · TỔNG KẾT BỨC TRANH

Một câu: **IF là modular monolith đạt 2/3, với deterministic core dày và kỷ luật thật; toàn bộ nợ
còn lại tập trung vào ba trục — ĐỊNH DANH chưa thống nhất (matId 3 nghĩa), CỬA AI chưa hợp nhất
(2,5 gateway), và LỊCH SỬ QUYẾT ĐỊNH chưa tồn tại (Q8)** — cả ba đều đã có ADR tương ứng.

Điều đáng nói nhất: chốt Lark-là-adapter hôm nay hoá ra **code đã tôn trọng từ trước khi chốt** —
không cần đại phẫu, chỉ cần chạy script đã soạn. Điều đáng lo nhất không nằm trong ADR nào:
**tài sản studio nằm trong localStorage** — quả bom data-loss duy nhất còn cài trong hệ.

---

## 4 · ĐÁNH GIÁ KHÁCH QUAN

**Tốt thật**: luật 8 + hiến pháp docstring hoạt động như máy canh mềm (0 RED AI authority) · B4
disk-sync đúng · format migration có test · 3D derived đúng Q6 trước cả khi Q6 được viết ·
ExternalRef chừa cửa ArchiNote 0-migrate · workflow optional không chặn ai.

**Chưa tốt, nói thẳng**:
- "Đồng bộ là phần đẹp nhất của IF" hiện mới đúng cho specId→BOQ; còn matId thì **dây có mà ba kho
  đích đều chưa có UUID nào** (pbrMap keyed sku-upper, `MATERIALS[]` 0 matId, cột chưa backfill) —
  đường UUID hôm nay tra vào kho rỗng.
- **5 máy soi hiện có mù cả 5 blocker của audit này** — chúng canh nhãn/sổ/hình học, không canh
  namespace/coupling. Cần `soi:ranh-gioi` (xem §LUẬT).
- Cả bốn gate đều tự khai **chưa chạy app thật** — mọi phán là đọc-mã, đúng nhưng chưa qua mắt.

---

## 5 · ≥2 HƯỚNG XỬ LÝ

**Hướng 1 — theo nguyên thứ tự Phase của ADR** (Manifest → hash → snapshot → ProjectFile →
overrides → command → decision → revision → DNA). Ưu: an toàn, tuần tự, đã được duyệt. Nhược:
để AI-coupling đỏ tới cuối; không có chỗ cho 2 blocker mới (localStorage assets, conflict primitive).

**Hướng 2 — Wave theo evidence audit cuối (T đề xuất)**: chèn Wave 0 data-safety trước mọi thứ;
nâng AI gateway facade lên sớm (Gate B chứng minh nó làm Q7 sau này NHỎ đi chứ không to lên);
gộp conflict-primitive vào Q8 (một cơ chế `rev`-enforce dùng chung cho optimistic lock lẫn
ArchiNote sync). Ưu: tháo bom trước, mỗi wave giảm chi phí wave sau. Nhược: lệch thứ tự ADR đã
duyệt — nhưng ADR Appendix B cho phép, và evidence là lý do chính đáng.

**Hướng 3 — hybrid tối giản**: chỉ Wave 0 rồi quay lại vertical slice (Slice 1B material), hoãn
Phase 2-3. Ưu: rẻ nhất, giữ momentum slice. Nhược: god-store và gateway mọc thêm callsite mỗi
tuần — chi phí gỡ tăng theo thời gian.

## 6 · ĐỀ XUẤT: HƯỚNG 2 — BUILD WAVES CUỐI

| Wave | Mục tiêu | Việc | Effort | Rollback |
|---|---|---|---|---|
| **0 · Data safety** | tháo bom | ① Hoà `sqlite3 dev.db ".backup"` + `db push` 4 nhóm schema treo ② dry-run rồi backfill matId (script `scripts/backfill-material-matid.ts` đã viết, scope `kind==='material'`) ③ **re-key PBR store + bảng nâng cấp namespace BOQ-overrides** (giải A-1 — thiếu bước này = overrides user mồ côi im lặng) ④ di dời idfc-store/pbr-store/colors ra IDB hoặc đĩa root-folder, kèm nút export ⑤ đính chính docs stale (ADR-Q9 DistillEngine · bản đồ 19-store) | LOW→EXPECTED (~1 tuần) | backup file; migration additive |
| **1 · Domain authority + material wiring** | Q1 + M-05 + Q2 | `PROJECT-MANIFEST.md` (kèm bảng module accepts/produces — không xây registry thứ 4) · cắm `getMaterial` vào 2D/3D/Present (Slice 1B) · dời `idfc.ts` + `boq-overrides` về đúng nhà (B-3) · `.idf` mang projectId + v3 ProductSpec snapshot (Q2, giải D-4 + A-6) | EXPECTED | additive, version-bumped |
| **2 · Boundaries** | M-02 + Q5 + Q3 | **AI gateway facade `lib/ai/gateway.ts`** bọc 15-20 callsite NVIDIA (chưa cần policy engine — chỉ cần MỘT cửa) · hợp nhất 3 handoff thành 1 contract (B-4) · ProjectFile raw stage + promote (Q5) · entity overrides (Q3) | EXPECTED | facade là wrapper, gỡ được |
| **3 · Decision core** | Q7-hẹp + Q8 + Q6 | Command pattern CHỈ Doc mutations (2/19 store — audit ủng hộ bằng số) · DesignDecision model **+ `rev` optimistic-lock enforce** (conflict primitive D-3, dùng chung ArchiNote) · Frozen Revision | HIGH (Q7 = bottleneck) | strangler pattern |
| **4 · DNA + Policy** | Q9 + Privacy | 4-scope DNA (SAU Q8) · Privacy mode 3 nấc dựa trên gateway Wave 2 + provenance Q4 | EXPECTED | — |
| **5 · ArchiNote contracts** | shared truth | Observation model + audio ingest + sync contract qua ExternalRef — chỉ sau conflict primitive Wave 3 | EXPECTED | — |

Ước tổng giữ **~17-20 tuần** (bản v2 đã trừ REUSE — nguồn: bàn giao 19/08 §6); Wave 0 ~1 tuần,
không nằm trong ước cũ. Mỗi wave: verify browser thật cho phần UI + acceptance = máy soi 0 lệch
+ test 0 fail + mở file đầu ra (LUẬT CHUAN-DAU-RA-NGHE).

---

## §24 · HAI LUẬT CHỐT CHO TƯƠNG LAI (wording cuối — đề xuất vào registry + IF-KIEN-TRUC §2)

> **LUẬT B-1 · Năng lực mới VÀO QUA HỢP ĐỒNG, không vào qua ca-đặc-biệt xuyên module.**
> *NEW CAPABILITY MUST ENTER THROUGH A CONTRACT — a registry entry (command · format capability ·
> node def) or a declared handoff — NEVER through another module's store, schema, or internals.*
> Máy kiểm được: import mới trỏ vào `*/store`, `*/internal`, hoặc schema module khác từ bên ngoài
> module ⇒ đỏ.

> **LUẬT B-2 · Thay một module không được buộc sửa module không liên quan.**
> *REPLACING A MODULE SHOULD NOT REQUIRE EDITING UNRELATED MODULES. A module is replaceable when
> everything others know about it is its contract. Test: "swap the renderer" must touch only the
> renderer.* Chuẩn nghiệm thu: bảng 12-future-changes chạy lại định kỳ; case nào từ 🟢 tụt 🟡 là regress.

Cả hai phù hợp thực tế (đánh trúng B-1/B-2/B-4 đo được). Kèm đề xuất: máy soi mới `soi:ranh-gioi`
(grep import xuyên module, cùng họ soi:frontier) — vì 5 máy soi hiện có mù cả 5 blocker của audit này.

---

## §25 · LẬP LUẬN CHỐNG MẠNH NHẤT — cái nào đáng trả, cái nào hoãn

- **Over-architect?** Một phần CÓ: Q7 full 19-store · event sourcing · AssetBlob "cách sạch" ·
  Scene model — đều hoãn (waves trên đã hoãn). Phần còn lại KHÔNG: matId/localStorage/gateway là
  bệnh đã gây sự cố thật (bước 2A hôm nay), không phải lo xa. → **Trả phần lõi, hoãn phần vỏ.**
- **Modular contract làm chậm?** Chi phí trả MỘT LẦN lúc ghi hợp đồng; chi phí KHÔNG có hợp đồng
  trả MỖI TUẦN (mỗi callsite NVIDIA mới = +1 file phải sửa khi thay provider). → **Đáng trả.**
- **UUID identity thêm mapping cost?** Có — phải mang bảng nâng cấp PBR/BOQ. Nhưng giá của
  business-key-làm-identity đã đo được (upsert theo `code` đè bản cũ im lặng). → **Đáng trả.**
- **Decision history phình dữ liệu?** Rủi ro thật (R-Q8-01) — giải bằng JSON Patch + consolidate;
  hoãn auto-proposed-mọi-command. → **Trả một nửa.**
- **Local-first tăng complexity sync?** Có, nhưng complexity đó là BẢN CHẤT sản phẩm (ArchiNote
  mobile là ca thật) — trốn hôm nay là trả gấp đôi ở Wave 5. → **Đáng trả, đúng lúc (Wave 3).**
- **Tách Lark mất lợi thế vận hành?** KHÔNG — đo được: Lark hiện chỉ là mirror + pill UI; ATLAS
  sync còn chưa từng chảy dữ liệu thật. Tách không mất gì đang chạy. → **Không có cost.**
- **Chuẩn bị ArchiNote là gánh scope chưa cần?** Một nửa — Observation model để Wave 5; nhưng
  conflict primitive thì IF solo cũng cần (2 tab/2 máy cùng studio) → gộp vào Q8 là mượn việc
  phải làm. → **Trả phần dùng chung, hoãn phần riêng.**

---

## CHƯA CHẮC

- Cả 4 gate audit bằng **đọc mã + grep, KHÔNG chạy app/DB thật** — trạng thái dev.db thực (cột nào
  đã push) không đo được từ sandbox; "10 workflow coexist" chưa bấm trên app thật.
- Import graph đo bằng regex `from '...'` — không bắt `import()` động/`require`; số 15 vs 20 file
  NVIDIA lệch theo phạm vi grep (T đo 15, Gate B đo 20 với pattern rộng hơn), cùng bậc độ lớn.
- "0 RED AI authority" dựa trên grep có chủ đích (setState/prisma/addEntities/setDoc) trong vùng AI
  + đọc header hiến pháp — chưa đọc full `store.ts` 1037 dòng / `commands.ts` 875 dòng; một đường
  ghi qua biến trung gian có thể lọt.
- Present ImageElement có mang `img_` id hay chỉ dataURL — chưa xác nhận từng field.
- localStorage keys liệt kê là sàn dưới (key ghép động `interiorflow.vitals.*` không đếm hết);
  chưa kiểm Electron main process có đường Lark riêng.

## HẠN DÙNG KẾT LUẬN

Đúng cho working tree 19/08 (sau `3da4b8c` + Slice 1A bước 2A chưa commit). Vô hiệu từng phần khi:
Hoà chạy `db push` các bảng treo · backfill matId chạy · Wave 1-2 thi công (Q2 snapshot + Q5
ProjectFile đổi trực tiếp bảng Domain Authority) · Q7 phase 1 merge (bảng coupling đo lại) ·
ATLAS sync chảy dữ liệu thật lần đầu (D-6 hết UNKNOWN).

---

# PHÁN QUYẾT CUỐI

## 1 · IF ĐÃ ĐỦ KIẾN TRÚC ĐỂ NGỪNG KHÁM VÀ BUILD CHƯA? — **YES.**

Bốn gate độc lập không tìm ra architectural conflict mới nào ngoài 9 ADR đã chốt. Các blocker còn
lại là **việc thi công có địa chỉ file:line**, không phải câu hỏi kiến trúc mở. **Đóng khám.**

## 2 · CÒN BAO NHIÊU BLOCKER KIẾN TRÚC THẬT? — **5.**

| # | Blocker | Chặn gì | Giải ở |
|---|---|---|---|
| ① | **matId ba namespace** (UUID · PBR-sku-upper · BOQ-specId) | cắm resolver rộng; data user mồ côi | Wave 0 |
| ② | **4 nhóm schema khai-chưa-push** (room/confidence · ExternalRef · Task/WorkflowState · matId) | mọi phiếu build đụng Prisma; `generate` = chết runtime | Wave 0 (Hoà chạy tay) |
| ③ | **Tài sản studio trong localStorage** (idfc · PBR · màu · brand-kit) | data-loss vĩnh viễn khi clear site data | Wave 0 |
| ④ | **AI provider coupling 15-20 file / 2,5 gateway** | nguyên tắc Replace-your-AI · local ML engine tương lai | Wave 2 |
| ⑤ | **Thiếu conflict/merge primitive** (`rev` có field, 0 enforcement) | ArchiNote · 2-máy-cùng-studio | Wave 3 (gộp Q8) |

## 3 · TOP 5 VIỆC PHẢI LÀM ĐẦU TIÊN

1. Backup `sqlite3 dev.db ".backup"` + `db push` 4 nhóm schema treo (**Hoà, tay** — sandbox cấm).
2. Backfill matId (dry-run trước) + re-key PBR store + bảng nâng cấp namespace BOQ-overrides.
3. Di dời tài sản studio khỏi localStorage (IDB/đĩa + nút export).
4. `PROJECT-MANIFEST.md` + đính chính 2 chỗ docs stale (ADR-Q9 DistillEngine · bản đồ 19-store).
5. AI gateway facade một-cửa `lib/ai/gateway.ts`.

## 4 · VIỆC CỐ Ý ĐỂ SAU

Q7 full 19-store · event sourcing đầy đủ · AssetBlob model (cách sạch Q4) · dedupe vật lý uploads ·
Scene model · DNA 4-scope trước Q8 (tủ không ngăn) · Privacy policy UI đầy đủ (sau gateway) ·
Community layer · Observation model ArchiNote (Wave 5).

## 5 · ARCHINOTE CÓ XÂY TRÊN NỀN IF NÀY KHÔNG? — **CONDITIONAL.**

Nền ĐÚNG: boundary qua HTTP API + `ExternalRef.system` (0-migrate) · Lark KHÔNG bắt buộc ở giữa ·
local-first thật · material identity vừa tách xong. Ba điều kiện trước khi build: **conflict/merge
primitive** (Wave 3, gộp vào Q8) · **`.idf` mang project id portable** (Wave 1, rẻ) ·
**Observation/Decision model** (Wave 3/5). Không điều kiện nào đòi khám thêm — chỉ đòi thi công
theo thứ tự.

---

**Sau report này: KHÔNG đề xuất audit kiến trúc tiếp nếu không có NEW EVIDENCE gây conflict thật.
HÔM NAY ĐÓNG KIẾN TRÚC. SAU ĐÓ THI CÔNG — bắt đầu từ Wave 0.**

*T lập 19/08/2026, tổng hợp từ 4 gate audit song song + verify chéo tại nguồn. Không commit — Hoà tự bấm.*
